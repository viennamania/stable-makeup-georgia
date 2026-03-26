import { NextResponse, type NextRequest } from "next/server";

import { getStoreAdminWalletAddressHistory } from "@/lib/api/store";
import { verifyAdminSignedAction } from "@/lib/server/admin-action-security";

const STORE_ADMIN_WALLET_HISTORY_READ_SIGNING_PREFIX =
  "stable-georgia:store-admin-wallet-history-read:v1";

export async function POST(request: NextRequest) {
  let body: any = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const storecode = String(body?.storecode || "").trim();
  const limit = Math.min(Math.max(Number(body?.limit) || 20, 1), 100);

  const actionFields = {
    storecode,
    limit,
  };

  const signed = await verifyAdminSignedAction({
    request,
    route: "/api/store/getStoreAdminWalletAddressHistory",
    signingPrefix: STORE_ADMIN_WALLET_HISTORY_READ_SIGNING_PREFIX,
    requesterStorecodeRaw: body?.requesterStorecode ?? "admin",
    requesterWalletAddressRaw: body?.requesterWalletAddress ?? body?.walletAddress,
    signatureRaw: body?.signature,
    signedAtRaw: body?.signedAt,
    nonceRaw: body?.nonce,
    actionFields,
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

  if (!storecode) {
    return NextResponse.json({
      result: [],
    });
  }

  const result = await getStoreAdminWalletAddressHistory({
    storecode,
    limit,
  });

  return NextResponse.json({
    result,
  });
}
