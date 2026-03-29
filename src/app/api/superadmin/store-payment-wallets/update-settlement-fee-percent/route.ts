import { NextRequest, NextResponse } from "next/server";

import { updateStoreSettlementFeePercent } from "@/lib/api/store";
import { verifySuperadminSignedAction } from "@/lib/server/superadmin-guard";

export const runtime = "nodejs";
export const preferredRegion = "icn1";

const ROUTE_PATH = "/api/superadmin/store-payment-wallets/update-settlement-fee-percent";
const SIGNING_PREFIX = "stable-georgia:superadmin:store-payment-wallets:update-settlement-fee-percent:v1";

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
  const settlementFeePercent = Number(body?.settlementFeePercent);

  if (!storecode) {
    return NextResponse.json(
      {
        result: null,
        error: "storecode is required",
      },
      { status: 400 },
    );
  }

  if (!Number.isFinite(settlementFeePercent)) {
    return NextResponse.json(
      {
        result: null,
        error: "settlementFeePercent must be a valid number",
      },
      { status: 400 },
    );
  }

  if (settlementFeePercent < 0.01 || settlementFeePercent > 2.0) {
    return NextResponse.json(
      {
        result: null,
        error: "settlementFeePercent must be between 0.01 and 2.00",
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
      settlementFeePercent,
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

  const result = await updateStoreSettlementFeePercent({
    storecode,
    settlementFeePercent,
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
    settlementFeePercent,
  });
}
