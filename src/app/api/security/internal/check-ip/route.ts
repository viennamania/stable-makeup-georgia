import { NextRequest, NextResponse } from "next/server";

import {
  getBlockedIpRule,
  insertApiAccessLog,
  normalizePublicIp,
} from "@/lib/api/ipSecurity";
import { getRequestCountry } from "@/lib/server/user-read-security";

export const runtime = "nodejs";

const IP_RULE_LOOKUP_TIMEOUT_MS = Math.max(
  Number(process.env.IP_SECURITY_LOOKUP_TIMEOUT_MS || 1200),
  100,
);
const IP_SECURITY_ROUTE_ERROR_LOG_THROTTLE_MS = Math.max(
  Number(process.env.IP_SECURITY_ROUTE_ERROR_LOG_THROTTLE_MS || 60000),
  1000,
);

let lastIpSecurityRouteErrorLoggedAt = 0;

const normalizeString = (value: unknown) => {
  if (typeof value !== "string") {
    return "";
  }
  return value.trim();
};

const getInternalSecurityKey = () => {
  return (
    normalizeString(process.env.IP_SECURITY_INTERNAL_KEY) ||
    normalizeString(process.env.THIRDWEB_SECRET_KEY)
  );
};

const isAuthorizedInternalRequest = (request: NextRequest) => {
  const expected = getInternalSecurityKey();
  if (!expected) {
    return false;
  }
  const provided = normalizeString(request.headers.get("x-ip-security-key"));
  return Boolean(provided && provided === expected);
};

const parseBody = async (request: NextRequest) => {
  try {
    return await request.json();
  } catch {
    return {};
  }
};

const withTimeout = async <T>(promise: Promise<T>, timeoutMs: number): Promise<T> => {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  try {
    return await Promise.race([
      promise,
      new Promise<T>((_resolve, reject) => {
        timeoutId = setTimeout(() => {
          reject(new Error(`timeout_after_${timeoutMs}ms`));
        }, timeoutMs);
      }),
    ]);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
};

const logIpSecurityRouteErrorThrottled = (message: string, error?: unknown) => {
  const now = Date.now();
  if (now - lastIpSecurityRouteErrorLoggedAt < IP_SECURITY_ROUTE_ERROR_LOG_THROTTLE_MS) {
    return;
  }

  lastIpSecurityRouteErrorLoggedAt = now;
  if (typeof error === "undefined") {
    console.error(message);
    return;
  }

  console.error(message, error);
};

export async function POST(request: NextRequest) {
  if (!isAuthorizedInternalRequest(request)) {
    return NextResponse.json(
      {
        ok: false,
        error: "Unauthorized",
      },
      { status: 401 },
    );
  }

  const body: any = await parseBody(request);
  const ip = normalizePublicIp(body?.ip);
  const pathname = normalizeString(body?.pathname || "/");
  const method = normalizeString(body?.method || "GET").toUpperCase() || "GET";
  const isApi = Boolean(body?.isApi || pathname.startsWith("/api/"));
  const userAgent = normalizeString(body?.userAgent || "");
  const referer = normalizeString(body?.referer || "");
  const acceptLanguage = normalizeString(body?.acceptLanguage || "");
  const country = normalizeString(body?.country || "") || getRequestCountry(request);

  if (!ip) {
    return NextResponse.json({
      ok: true,
      blocked: false,
      reason: null,
    });
  }

  let blockedRule: any = null;
  try {
    blockedRule = await withTimeout(getBlockedIpRule(ip), IP_RULE_LOOKUP_TIMEOUT_MS);
  } catch (error) {
    logIpSecurityRouteErrorThrottled("IP blocked-rule lookup timeout/failure:", error);
  }

  const blocked = Boolean(blockedRule);
  const blockReason = blocked ? normalizeString(blockedRule?.reason) : null;

  if (isApi || blocked) {
    void insertApiAccessLog({
      ip,
      method,
      pathname,
      isApi,
      blocked,
      blockReason,
      country,
      userAgent,
      referer,
      acceptLanguage,
      source: "middleware",
    });
  }

  return NextResponse.json({
    ok: true,
    blocked,
    reason: blockReason,
    rule: blocked
      ? {
          ip: blockedRule?.ip || ip,
          reason: blockedRule?.reason || null,
          blockedAt: blockedRule?.blockedAt || null,
          expiresAt: blockedRule?.expiresAt || null,
        }
      : null,
  });
}
