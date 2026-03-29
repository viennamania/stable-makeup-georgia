import { NextResponse, type NextRequest } from "next/server";

import { getAdminClearanceOrders } from "@lib/api/order";
import { verifyCenterStoreAdminGuard } from "@/lib/server/center-store-admin-guard";

const normalizeString = (value: unknown) => {
  if (typeof value !== "string") {
    return "";
  }
  return value.trim();
};

const parsePositiveInt = (value: unknown, fallback: number) => {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return Math.trunc(value);
  }

  const parsed = Number.parseInt(String(value ?? "").trim(), 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
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
    route: "/api/order/getAdminClearanceOrders",
    body,
    storecodeRaw: requestedStorecode || requesterStorecode || "admin",
    requesterWalletAddressRaw: body.requesterWalletAddress ?? body.walletAddress,
  });

  if (!guard.ok) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  const result = await getAdminClearanceOrders({
    storecode: requestedStorecode,
    limit: parsePositiveInt(body.limit, 30),
    page: parsePositiveInt(body.page, 1),
    walletAddress: normalizeString(body.walletAddress),
    searchMyOrders: normalizeBoolean(body.searchMyOrders),
    fromDate: normalizeString(body.fromDate),
    toDate: normalizeString(body.toDate),
  });

  return NextResponse.json({
    result,
  });
}
