import { NextRequest, NextResponse } from "next/server";

import { getSuperadminStorePaymentWalletList } from "@/lib/server/superadmin-store-payment-wallets";
import { verifySuperadminSignedAction } from "@/lib/server/superadmin-guard";

export const runtime = "nodejs";

const ROUTE_PATH = "/api/superadmin/store-payment-wallets/list";
const SIGNING_PREFIX = "stable-georgia:superadmin:store-payment-wallets:list:v1";

const normalizeString = (value: unknown): string => {
  if (typeof value !== "string") {
    return "";
  }
  return value.trim();
};

const normalizePositiveInt = (value: unknown, fallback: number, max: number) => {
  const parsed = Number.parseInt(String(value ?? "").trim(), 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return Math.min(parsed, max);
};

export async function POST(request: NextRequest) {
  let body: Record<string, unknown> = {};
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    body = {};
  }

  const searchStore = normalizeString(body?.searchStore);
  const page = normalizePositiveInt(body?.page, 1, 1000);
  const limit = normalizePositiveInt(body?.limit, 24, 60);

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
      searchStore,
      page,
      limit,
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

  return NextResponse.json({
    result: await getSuperadminStorePaymentWalletList({
      search: searchStore,
      page,
      limit,
    }),
  });
}
