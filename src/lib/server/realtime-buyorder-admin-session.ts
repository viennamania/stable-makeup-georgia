import { createHash, createHmac, timingSafeEqual } from "crypto";

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const REALTIME_BUYORDER_ADMIN_COOKIE_NAME = "realtime_buyorder_admin";
const REALTIME_BUYORDER_ADMIN_SESSION_TTL_MS = Math.max(
  Number.parseInt(process.env.REALTIME_BUYORDER_ADMIN_SESSION_TTL_MS || "", 10) || 12 * 60 * 60 * 1000,
  5 * 60 * 1000,
);

type RealtimeBuyorderAdminSessionPayload = {
  iat: number;
  exp: number;
  pwd: string;
  scope: "manual-payment";
};

function getConfiguredPassword(): string {
  return String(process.env.REALTIME_BUYORDER_ADMIN_PASSWORD || "").trim();
}

function getConfiguredSessionSecret(): string {
  return String(process.env.REALTIME_BUYORDER_ADMIN_SESSION_SECRET || "").trim();
}

function toBase64Url(value: Buffer | string): string {
  return Buffer.from(value).toString("base64url");
}

function fromBase64Url(value: string): Buffer | null {
  try {
    return Buffer.from(value, "base64url");
  } catch (error) {
    return null;
  }
}

function getPasswordFingerprint(password: string): string {
  return createHash("sha256").update(password).digest("hex");
}

function getSigningKey(): Buffer | null {
  const password = getConfiguredPassword();
  if (!password) {
    return null;
  }

  const sessionSecret = getConfiguredSessionSecret();
  const source = sessionSecret || password;
  return createHash("sha256").update(source).digest();
}

function signPayload(encodedPayload: string, signingKey: Buffer): string {
  return createHmac("sha256", signingKey).update(encodedPayload).digest("base64url");
}

function getCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "strict" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: Math.floor(REALTIME_BUYORDER_ADMIN_SESSION_TTL_MS / 1000),
  };
}

function safeStringEquals(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}

function parseSessionToken(token: string | null | undefined): RealtimeBuyorderAdminSessionPayload | null {
  const safeToken = String(token || "").trim();
  const signingKey = getSigningKey();
  const password = getConfiguredPassword();

  if (!safeToken || !signingKey || !password) {
    return null;
  }

  const tokenParts = safeToken.split(".");
  if (tokenParts.length !== 2) {
    return null;
  }

  const [encodedPayload, signature] = tokenParts;
  const expectedSignature = signPayload(encodedPayload, signingKey);
  if (!safeStringEquals(signature, expectedSignature)) {
    return null;
  }

  const payloadBuffer = fromBase64Url(encodedPayload);
  if (!payloadBuffer) {
    return null;
  }

  try {
    const payload = JSON.parse(payloadBuffer.toString("utf8")) as Partial<RealtimeBuyorderAdminSessionPayload>;
    const now = Date.now();
    if (
      payload.scope !== "manual-payment"
      || typeof payload.iat !== "number"
      || typeof payload.exp !== "number"
      || typeof payload.pwd !== "string"
      || payload.exp <= now
      || payload.iat > now + 30_000
      || !safeStringEquals(payload.pwd, getPasswordFingerprint(password))
    ) {
      return null;
    }

    return {
      iat: payload.iat,
      exp: payload.exp,
      pwd: payload.pwd,
      scope: "manual-payment",
    };
  } catch (error) {
    return null;
  }
}

export function isRealtimeBuyorderAdminEnabled(): boolean {
  return Boolean(getConfiguredPassword());
}

export function verifyRealtimeBuyorderAdminPassword(password: unknown): boolean {
  const configuredPassword = getConfiguredPassword();
  const input = typeof password === "string" ? password.trim() : "";

  if (!configuredPassword || !input) {
    return false;
  }

  return safeStringEquals(input, configuredPassword);
}

export function createRealtimeBuyorderAdminSessionToken(): string | null {
  const signingKey = getSigningKey();
  const password = getConfiguredPassword();

  if (!signingKey || !password) {
    return null;
  }

  const now = Date.now();
  const payload: RealtimeBuyorderAdminSessionPayload = {
    iat: now,
    exp: now + REALTIME_BUYORDER_ADMIN_SESSION_TTL_MS,
    pwd: getPasswordFingerprint(password),
    scope: "manual-payment",
  };

  const encodedPayload = toBase64Url(JSON.stringify(payload));
  const signature = signPayload(encodedPayload, signingKey);
  return `${encodedPayload}.${signature}`;
}

export function readRealtimeBuyorderAdminSession(request: NextRequest): {
  enabled: boolean;
  authenticated: boolean;
  expiresAt: number | null;
} {
  if (!isRealtimeBuyorderAdminEnabled()) {
    return {
      enabled: false,
      authenticated: false,
      expiresAt: null,
    };
  }

  const token = request.cookies.get(REALTIME_BUYORDER_ADMIN_COOKIE_NAME)?.value || null;
  const payload = parseSessionToken(token);

  return {
    enabled: true,
    authenticated: Boolean(payload),
    expiresAt: payload?.exp || null,
  };
}

export function applyRealtimeBuyorderAdminSession(response: NextResponse): boolean {
  const token = createRealtimeBuyorderAdminSessionToken();
  if (!token) {
    return false;
  }

  response.cookies.set(REALTIME_BUYORDER_ADMIN_COOKIE_NAME, token, getCookieOptions());
  return true;
}

export function clearRealtimeBuyorderAdminSession(response: NextResponse) {
  response.cookies.set(REALTIME_BUYORDER_ADMIN_COOKIE_NAME, "", {
    ...getCookieOptions(),
    maxAge: 0,
    expires: new Date(0),
  });
}
