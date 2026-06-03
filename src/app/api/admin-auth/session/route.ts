import { NextResponse, type NextRequest } from "next/server";

import {
  isAdminPasswordCookieSessionRequestAllowed,
  readAdminPasswordSession,
} from "@/lib/server/admin-password-auth";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const session = await readAdminPasswordSession(request);

  if (!session.authenticated) {
    return NextResponse.json({
      status: "success",
      result: {
        authenticated: false,
        reason: session.reason,
        tokenProvided: session.tokenProvided,
      },
    });
  }

  if (!isAdminPasswordCookieSessionRequestAllowed(request, session.source)) {
    return NextResponse.json(
      {
        status: "error",
        result: null,
        error: "Invalid session origin",
      },
      { status: 403 },
    );
  }

  return NextResponse.json({
    status: "success",
    result: {
      authenticated: true,
      source: session.source,
      account: session.account,
      requesterWalletAddress: session.requesterWalletAddress,
      requesterStorecode: session.requesterStorecode,
      expiresAt: session.expiresAt.toISOString(),
    },
  });
}

