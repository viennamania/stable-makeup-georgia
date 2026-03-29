import { NextResponse, type NextRequest } from "next/server";

import { getClearanceSellerBankBalanceSummary } from "@lib/api/order";
import { verifyCenterStoreAdminGuard } from "@/lib/server/center-store-admin-guard";

const normalizeString = (value: unknown) => {
  if (typeof value !== "string") {
    return "";
  }
  return value.trim();
};

const normalizeBoolean = (value: unknown): boolean => {
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    return normalized === "true" || normalized === "1" || normalized === "yes";
  }
  if (typeof value === "number") {
    return value === 1;
  }
  return false;
};

export async function POST(request: NextRequest) {
  let body: Record<string, unknown> = {};
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    body = {};
  }

  const requestedStorecode = normalizeString(body.storecode);
  const requesterStorecode = normalizeString(body.requesterStorecode);
  const guard = await verifyCenterStoreAdminGuard({
    request,
    route: "/api/order/getClearanceSellerBankBalanceSummary",
    body,
    storecodeRaw: requestedStorecode || requesterStorecode || "admin",
    requesterWalletAddressRaw: body.requesterWalletAddress ?? body.walletAddress,
  });

  if (!guard.ok) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  const result = await getClearanceSellerBankBalanceSummary({
    storecode: requestedStorecode,
    fromDate: normalizeString(body.fromDate),
    toDate: normalizeString(body.toDate),
    privateSale: normalizeBoolean(body.privateSale),
  });

  return NextResponse.json({
    result,
  });
}
