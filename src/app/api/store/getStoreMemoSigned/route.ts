import { NextResponse, type NextRequest } from "next/server";

import { getOneStoreMemo } from "@lib/api/store";
import { verifyAdminSignedAction } from "@/lib/server/admin-action-security";

const STORE_MEMO_READ_SIGNING_PREFIX = "stable-georgia:store-memo-read:v1";

export async function POST(request: NextRequest) {
  let body: any = {};

  try {
    body = await request.json();
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
    route: "/api/store/getStoreMemoSigned",
    signingPrefix: STORE_MEMO_READ_SIGNING_PREFIX,
    requesterStorecodeRaw: body?.requesterStorecode ?? "admin",
    requesterWalletAddressRaw: body?.requesterWalletAddress ?? body?.walletAddress,
    signatureRaw: body?.signature,
    signedAtRaw: body?.signedAt,
    nonceRaw: body?.nonce,
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

  const result = await getOneStoreMemo({
    storecode,
  });

  return NextResponse.json({
    result,
  });
}
