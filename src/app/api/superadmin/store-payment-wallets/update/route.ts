import { NextRequest, NextResponse } from "next/server";

import { assignSuperadminStoreSettlementWallet } from "@/lib/server/superadmin-store-payment-wallets";
import { verifySuperadminSignedAction } from "@/lib/server/superadmin-guard";
import { getRequestIp, normalizeWalletAddress } from "@/lib/server/user-read-security";

export const runtime = "nodejs";
export const preferredRegion = "icn1";

const ROUTE_PATH = "/api/superadmin/store-payment-wallets/update";
const SIGNING_PREFIX = "stable-georgia:superadmin:store-payment-wallets:update:v1";

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
  const settlementWalletAddress = normalizeWalletAddress(body?.settlementWalletAddress);

  if (!storecode || !settlementWalletAddress) {
    return NextResponse.json(
      {
        result: null,
        error: "storecode and valid settlementWalletAddress are required",
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
      settlementWalletAddress,
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
    const result = await assignSuperadminStoreSettlementWallet({
      storecode,
      settlementWalletAddress,
      audit: {
        route: ROUTE_PATH,
        publicIp: auth.ip || getRequestIp(request),
        requesterWalletAddress: auth.requesterWalletAddress,
        userAgent: request.headers.get("user-agent"),
      },
      baseUrl: new URL(request.url).origin,
    });

    return NextResponse.json({
      result,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update store payment wallet";
    const status =
      message === "Store not found"
        ? 404
        : message.includes("required") || message.includes("must ")
          ? 400
          : 500;

    return NextResponse.json(
      {
        result: null,
        error: message,
      },
      { status },
    );
  }
}
