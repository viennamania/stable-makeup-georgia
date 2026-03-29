import { NextRequest, NextResponse } from "next/server";

import { updateStoreSettlementFeeWalletAddress } from "@/lib/api/store";
import { getOneVerifiedAdminWalletUserByWalletAddress } from "@/lib/api/user";
import { verifySuperadminSignedAction } from "@/lib/server/superadmin-guard";
import { normalizeWalletAddress } from "@/lib/server/user-read-security";

export const runtime = "nodejs";
export const preferredRegion = "icn1";

const ROUTE_PATH = "/api/superadmin/store-payment-wallets/update-settlement-fee-wallet";
const SIGNING_PREFIX = "stable-georgia:superadmin:store-payment-wallets:update-settlement-fee-wallet:v1";

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

  const storecode = normalizeString(body?.storecode).toLowerCase();
  const settlementFeeWalletAddressRaw = normalizeString(body?.settlementFeeWalletAddress);
  const settlementFeeWalletAddress = normalizeWalletAddress(body?.settlementFeeWalletAddress);

  if (!storecode || !settlementFeeWalletAddress) {
    return NextResponse.json(
      {
        result: null,
        error: "storecode and valid settlementFeeWalletAddress are required",
      },
      { status: 400 },
    );
  }

  const auth = await verifySuperadminSignedAction({
    request,
    route: ROUTE_PATH,
    signingPrefix: SIGNING_PREFIX,
    requesterStorecodeRaw: body?.requesterStorecode,
    requesterWalletAddressRaw: body?.requesterWalletAddress,
    signatureRaw: body?.signature,
    signedAtRaw: body?.signedAt,
    nonceRaw: body?.nonce,
    actionFields: {
      storecode,
      settlementFeeWalletAddress: settlementFeeWalletAddressRaw,
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

  const adminWalletUser = await getOneVerifiedAdminWalletUserByWalletAddress(
    settlementFeeWalletAddress,
  );

  if (!adminWalletUser) {
    return NextResponse.json(
      {
        result: null,
        error: "settlementFeeWalletAddress must belong to a verified admin wallet",
      },
      { status: 400 },
    );
  }

  const result = await updateStoreSettlementFeeWalletAddress({
    storecode,
    settlementFeeWalletAddress,
  });

  if (!result) {
    return NextResponse.json(
      {
        result: null,
        error: "Store not found",
      },
      { status: 404 },
    );
  }

  return NextResponse.json({
    result: true,
    storecode,
    settlementFeeWalletAddress,
  });
}
