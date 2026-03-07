import { NextRequest, NextResponse } from "next/server";

import { verifyAdminSignedAction } from "@/lib/server/admin-action-security";
import { listHmacApiKeys } from "@/lib/server/hmac-api-key-store";

export const runtime = "nodejs";

const ROUTE_PATH = "/api/security/hmac-keys/getList";
const SIGNING_PREFIX = "stable-georgia:hmac-keys:get-list:v1";

const normalizeString = (value: unknown) => {
  if (typeof value !== "string") {
    return "";
  }
  return value.trim();
};

export async function POST(request: NextRequest) {
  let body: any = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const routeFilter = normalizeString(body?.routeFilter || "");

  const auth = await verifyAdminSignedAction({
    request,
    route: ROUTE_PATH,
    signingPrefix: SIGNING_PREFIX,
    requesterStorecodeRaw: body?.requesterStorecode,
    requesterWalletAddressRaw: body?.requesterWalletAddress,
    signatureRaw: body?.signature,
    signedAtRaw: body?.signedAt,
    nonceRaw: body?.nonce,
    actionFields: {
      routeFilter,
    },
  });

  if (!auth.ok) {
    return NextResponse.json(
      {
        result: null,
        error: auth.error,
      },
      { status: auth.status },
    );
  }

  try {
    const keys = await listHmacApiKeys({
      route: routeFilter || undefined,
    });
    return NextResponse.json({
      result: {
        keys,
        totalCount: keys.length,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        result: null,
        error: error instanceof Error ? error.message : "Failed to list HMAC keys",
      },
      { status: 500 },
    );
  }
}

