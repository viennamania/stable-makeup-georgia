import { NextResponse, type NextRequest } from "next/server";

import { getBuyOrdersGroupByStorecodeDaily } from "@lib/api/order";
import { verifyCenterStoreAdminGuard } from "@/lib/server/center-store-admin-guard";

export const runtime = "nodejs";
export const preferredRegion = "icn1";

const normalizeStorecode = (value: unknown) => {
  if (typeof value !== "string") {
    return "";
  }
  return value.trim();
};

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

const hasCenterStoreAuthIntent = (body: Record<string, unknown>) =>
  Boolean(
    normalizeString(body.signature)
    || normalizeString(body.signedAt)
    || normalizeString(body.nonce)
    || normalizeString(body.requesterWalletAddress)
    || normalizeString(body.walletAddress),
  );

type DailyHistoryRow = {
  date?: string;
  totalCount?: number;
  totalUsdtAmount?: number;
  totalKrwAmount?: number;
  totalSettlementCount?: number;
  totalSettlementAmount?: number;
  totalSettlementAmountKRW?: number;
  totalAgentFeeAmount?: number;
  totalAgentFeeAmountKRW?: number;
  totalFeeAmount?: number;
  totalFeeAmountKRW?: number;
  totalClearanceCount?: number;
  totalClearanceUsdtAmount?: number;
  totalClearanceKrwAmount?: number;
};

const sumBy = (rows: DailyHistoryRow[], key: keyof DailyHistoryRow) =>
  rows.reduce((sum, row) => sum + Number(row?.[key] || 0), 0);

export async function POST(request: NextRequest) {
  let body: Record<string, unknown> = {};

  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    body = {};
  }

  const requestedStorecode = normalizeStorecode(body.storecode);
  const requesterStorecode = normalizeStorecode(body.requesterStorecode);
  const guardStorecode = requesterStorecode || requestedStorecode || "admin";
  const authIntent = hasCenterStoreAuthIntent(body);

  let privilegedRead = false;
  let effectiveStorecode = requestedStorecode;

  if (authIntent) {
    const guard = await verifyCenterStoreAdminGuard({
      request,
      route: "/api/order/getAdminTradeHistoryDaily",
      body,
      storecodeRaw: guardStorecode,
      requesterWalletAddressRaw: body.requesterWalletAddress ?? body.walletAddress,
    });

    privilegedRead = guard.ok;

    if (guard.ok) {
      const requesterScopeStorecode = requesterStorecode || guardStorecode;
      const requestedDiffersFromRequesterScope = Boolean(
        requestedStorecode
          && requesterScopeStorecode
          && requestedStorecode.toLowerCase() !== requesterScopeStorecode.toLowerCase(),
      );

      if (!guard.requesterIsAdmin && requestedDiffersFromRequesterScope) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      effectiveStorecode = guard.requesterIsAdmin
        ? requestedStorecode
        : guardStorecode;
    }
  }

  const limit = Math.min(parsePositiveInt(body.limit, 30), 180);
  const page = Math.max(parsePositiveInt(body.page, 1), 1);

  const dailyResult = await getBuyOrdersGroupByStorecodeDaily({
    storecode: effectiveStorecode,
    fromDate: normalizeString(body.fromDate),
    toDate: normalizeString(body.toDate),
    searchBuyer: normalizeString(body.searchBuyer),
    searchDepositName: normalizeString(body.searchDepositName),
    searchStoreBankAccountNumber: normalizeString(body.searchStoreBankAccountNumber),
  });

  const rows = Array.isArray(dailyResult?.orders)
    ? (dailyResult.orders as DailyHistoryRow[])
    : [];
  const totalCount = rows.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / limit));
  const safePage = Math.min(page, totalPages);
  const pageRows = rows.slice((safePage - 1) * limit, safePage * limit);

  const result = {
    view: privilegedRead ? "privileged" : "public",
    storecode: effectiveStorecode,
    fromDate: normalizeString(dailyResult?.fromDate),
    toDate: normalizeString(dailyResult?.toDate),
    totalCount,
    page: safePage,
    limit,
    totalPages,
    orders: pageRows,
    totalTradeCount: sumBy(rows, "totalCount"),
    totalTradeUsdtAmount: sumBy(rows, "totalUsdtAmount"),
    totalTradeKrwAmount: sumBy(rows, "totalKrwAmount"),
    totalSettlementCount: sumBy(rows, "totalSettlementCount"),
    totalSettlementAmount: sumBy(rows, "totalSettlementAmount"),
    totalSettlementAmountKRW: sumBy(rows, "totalSettlementAmountKRW"),
    totalAgentFeeAmount: sumBy(rows, "totalAgentFeeAmount"),
    totalAgentFeeAmountKRW: sumBy(rows, "totalAgentFeeAmountKRW"),
    totalFeeAmount: sumBy(rows, "totalFeeAmount"),
    totalFeeAmountKRW: sumBy(rows, "totalFeeAmountKRW"),
    totalClearanceCount: sumBy(rows, "totalClearanceCount"),
    totalClearanceUsdtAmount: sumBy(rows, "totalClearanceUsdtAmount"),
    totalClearanceKrwAmount: sumBy(rows, "totalClearanceKrwAmount"),
  };

  return NextResponse.json({ result });
}
