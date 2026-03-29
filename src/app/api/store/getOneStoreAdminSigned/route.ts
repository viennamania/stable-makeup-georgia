import { NextResponse, type NextRequest } from "next/server";

import { getStoreByStorecode } from "@lib/api/store";
import { verifyAdminSignedAction } from "@/lib/server/admin-action-security";

const STORE_ADMIN_READ_SIGNING_PREFIX = "stable-georgia:store-settings-read:v1";

export async function POST(request: NextRequest) {
  let body: Record<string, unknown> = {};

  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    body = {};
  }

  const storecode = String(body?.storecode || "").trim();

  if (!storecode) {
    return NextResponse.json(
      {
        result: null,
        error: "storecode is required",
      },
      { status: 400 },
    );
  }

  const signed = await verifyAdminSignedAction({
    request,
    route: "/api/store/getOneStoreAdminSigned",
    signingPrefix: STORE_ADMIN_READ_SIGNING_PREFIX,
    requesterStorecodeRaw: body?.requesterStorecode ?? "admin",
    requesterWalletAddressRaw: body?.requesterWalletAddress ?? body?.walletAddress,
    signatureRaw: body?.signature,
    signedAtRaw: body?.signedAt,
    nonceRaw: body?.nonce,
    allowedRoles: ["admin", "superadmin"],
    actionFields: {
      storecode,
    },
  });

  if (!signed.ok) {
    return NextResponse.json(
      {
        result: null,
        error: signed.error,
      },
      { status: signed.status },
    );
  }

  const result = await getStoreByStorecode({
    storecode,
  });

  return NextResponse.json({
    result,
  });
}
