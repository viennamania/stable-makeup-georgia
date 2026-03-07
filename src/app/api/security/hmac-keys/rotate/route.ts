import { NextRequest, NextResponse } from "next/server";

import { verifyAdminSignedAction } from "@/lib/server/admin-action-security";
import { rotateHmacApiKeySecret } from "@/lib/server/hmac-api-key-store";

export const runtime = "nodejs";

const ROUTE_PATH = "/api/security/hmac-keys/rotate";
const SIGNING_PREFIX = "stable-georgia:hmac-keys:rotate:v1";

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

  const keyId = normalizeString(body?.keyId);

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
      keyId,
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
    const rotated = await rotateHmacApiKeySecret({
      keyIdRaw: keyId,
      actor: auth.requesterUser,
    });

    return NextResponse.json({
      result: {
        keyId: rotated.keyId,
        secret: rotated.secret,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        result: null,
        error: error instanceof Error ? error.message : "Failed to rotate HMAC key",
      },
      { status: 400 },
    );
  }
}

