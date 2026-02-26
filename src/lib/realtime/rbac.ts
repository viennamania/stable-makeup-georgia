import { timingSafeEqual } from "crypto";

import type { NextRequest } from "next/server";

export type RealtimeRole = "admin" | "viewer";

type RoleTokenMap = Record<string, string[]>;

const DEFAULT_ROLE = "viewer";

function parseJsonRules(raw: string): RoleTokenMap {
  try {
    const parsed = JSON.parse(raw) as Record<string, string[] | string>;
    const map: RoleTokenMap = {};

    for (const [role, tokens] of Object.entries(parsed)) {
      const values = Array.isArray(tokens) ? tokens : [tokens];
      map[role] = values
        .map((token) => String(token || "").trim())
        .filter(Boolean);
    }

    return map;
  } catch (error) {
    console.error("Failed to parse REALTIME_RBAC_RULES_JSON:", error);
    return {};
  }
}

function parseCsvRules(raw: string): RoleTokenMap {
  const map: RoleTokenMap = {};
  const entries = raw
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);

  for (const entry of entries) {
    const separatorIndex = entry.indexOf(":");
    if (separatorIndex <= 0) {
      continue;
    }

    const role = entry.slice(0, separatorIndex).trim();
    const token = entry.slice(separatorIndex + 1).trim();

    if (!role || !token) {
      continue;
    }

    if (!map[role]) {
      map[role] = [];
    }

    map[role].push(token);
  }

  return map;
}

function getRoleTokenMap(): RoleTokenMap {
  const rawJson = process.env.REALTIME_RBAC_RULES_JSON?.trim() || "";
  if (rawJson) {
    return parseJsonRules(rawJson);
  }

  const rawCsv = process.env.REALTIME_RBAC_TOKENS?.trim() || "";
  if (rawCsv) {
    return parseCsvRules(rawCsv);
  }

  return {};
}

function safeTokenEquals(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}

function extractTokenFromRequest(request: NextRequest): string | null {
  const authorization = request.headers.get("authorization") || "";
  if (authorization.toLowerCase().startsWith("bearer ")) {
    const bearerToken = authorization.slice(7).trim();
    if (bearerToken) {
      return bearerToken;
    }
  }

  const headerToken =
    request.headers.get("x-realtime-token") ||
    request.headers.get("x-rbac-token") ||
    "";

  const token = headerToken.trim();
  return token || null;
}

export function resolveRealtimeRoleByToken(token: string): RealtimeRole | null {
  const roleMap = getRoleTokenMap();
  const entries = Object.entries(roleMap);

  if (entries.length === 0) {
    return null;
  }

  for (const [role, tokens] of entries) {
    for (const candidate of tokens) {
      if (safeTokenEquals(token, candidate)) {
        return role as RealtimeRole;
      }
    }
  }

  return null;
}

export function getDefaultRealtimeRole(): RealtimeRole {
  return DEFAULT_ROLE as RealtimeRole;
}

export function authorizeRealtimeRequest(
  request: NextRequest,
  allowedRoles: RealtimeRole[],
):
  | { ok: true; role: RealtimeRole; token: string }
  | { ok: false; status: number; message: string } {
  const token = extractTokenFromRequest(request);
  if (!token) {
    return {
      ok: false,
      status: 401,
      message: "Missing realtime RBAC token",
    };
  }

  const role = resolveRealtimeRoleByToken(token);
  if (!role) {
    return {
      ok: false,
      status: 403,
      message: "Invalid RBAC token or RBAC is not configured",
    };
  }

  if (!allowedRoles.includes(role)) {
    return {
      ok: false,
      status: 403,
      message: `Role '${role}' is not allowed`,
    };
  }

  return {
    ok: true,
    role,
    token,
  };
}
