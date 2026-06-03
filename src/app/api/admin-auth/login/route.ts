import { NextResponse, type NextRequest } from "next/server";

import {
  applyAdminPasswordSessionCookie,
  authenticateAdminPasswordLogin,
} from "@/lib/server/admin-password-auth";
import {
  consumeReadRateLimit,
  getRequestIp,
} from "@/lib/server/user-read-security";

export const runtime = "nodejs";

const normalizeString = (value: unknown): string => {
  if (typeof value !== "string") {
    return "";
  }
  return value.trim();
};

export async function POST(request: NextRequest) {
  let body: Record<string, unknown> = {};
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    body = {};
  }

  const loginId = normalizeString(body.loginId).toLowerCase();
  const ip = getRequestIp(request);
  const rate = consumeReadRateLimit({
    scope: "admin-password-login",
    ip,
    walletAddress: `login:${loginId || "unknown"}`,
  });

  if (!rate.allowed) {
    return NextResponse.json(
      {
        status: "error",
        result: null,
        error: "Too many login attempts",
      },
      { status: 429 },
    );
  }

  const auth = await authenticateAdminPasswordLogin({
    loginIdRaw: body.loginId,
    passwordRaw: body.password,
    request,
  });

  if (!auth.ok) {
    return NextResponse.json(
      {
        status: "error",
        result: null,
        error: auth.error,
        reason: auth.reason,
      },
      { status: auth.status },
    );
  }

  const shouldReturnToken =
    body.returnToken === true ||
    normalizeString(request.headers.get("x-return-admin-token")).toLowerCase() === "true";

  const response = NextResponse.json({
    status: "success",
    result: {
      authenticated: true,
      account: auth.account,
      expiresAt: auth.expiresAt.toISOString(),
      token: shouldReturnToken ? auth.token : null,
    },
  });

  applyAdminPasswordSessionCookie({
    response,
    token: auth.token,
    expiresAt: auth.expiresAt,
  });

  return response;
}
