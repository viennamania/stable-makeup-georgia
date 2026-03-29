import { NextResponse, type NextRequest } from "next/server";

import { getAdminStoreList } from "@lib/api/store";
import { verifyCenterStoreAdminGuard } from "@/lib/server/center-store-admin-guard";

const globalAdminStoreListRouteState = globalThis as typeof globalThis & {
  __adminStoreListRouteCache?: Map<string, { expiresAt: number; value: any }>;
};

const ADMIN_STORE_LIST_CACHE_TTL_MS = Number.parseInt(
  process.env.ADMIN_STORE_LIST_CACHE_TTL_MS || "",
  10,
) > 0
  ? Number.parseInt(process.env.ADMIN_STORE_LIST_CACHE_TTL_MS || "", 10)
  : 10000;

const getRouteCache = () => {
  if (!globalAdminStoreListRouteState.__adminStoreListRouteCache) {
    globalAdminStoreListRouteState.__adminStoreListRouteCache = new Map();
  }
  return globalAdminStoreListRouteState.__adminStoreListRouteCache;
};

const normalizeString = (value: unknown) => {
  if (typeof value !== "string") {
    return "";
  }
  return value.trim();
};

const normalizeNumber = (value: unknown, fallback: number, max: number) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return Math.min(Math.floor(parsed), max);
};

const hasCenterStoreAuthIntent = (body: Record<string, unknown>) => {
  return Boolean(
    normalizeString(body.signature)
    || normalizeString(body.signedAt)
    || normalizeString(body.nonce)
    || normalizeString(body.requesterWalletAddress)
    || normalizeString(body.walletAddress),
  );
};

const sanitizeStoreForPublic = (store: any) => {
  if (!store || typeof store !== "object" || Array.isArray(store)) {
    return store;
  }

  return {
    createdAt: store.createdAt,
    storecode: store.storecode,
    storeName: store.storeName,
    companyName: store.companyName,
    storeLogo: store.storeLogo,
    storeDescription: store.storeDescription,
    agentcode: store.agentcode,
    agentName: store.agentName,
    agentLogo: store.agentLogo,
    totalBuyerCount: store.totalBuyerCount,
    totalPaymentConfirmedCount: store.totalPaymentConfirmedCount,
    totalUsdtAmount: store.totalUsdtAmount,
    totalSettlementCount: store.totalSettlementCount,
    totalSettlementAmountKRW: store.totalSettlementAmountKRW,
    escrowAmountUSDT: store.escrowAmountUSDT,
    maxPaymentAmountKRW: store.maxPaymentAmountKRW,
    paymentUrl: store.paymentUrl,
    viewOnAndOff: store.viewOnAndOff,
    liveOnAndOff: store.liveOnAndOff,
    settlementFeePercent: store.settlementFeePercent,
  };
};

export async function POST(request: NextRequest) {
  let body: Record<string, unknown> = {};
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    body = {};
  }

  const safeLimit = normalizeNumber(body.limit, 50, 200);
  const safePage = normalizeNumber(body.page, 1, 1000);
  const safeSearchStore = normalizeString(body.searchStore);
  const safeAgentcode = normalizeString(body.agentcode);
  const safeSortBy = normalizeString(body.sortBy);

  let privilegedRead = false;
  if (hasCenterStoreAuthIntent(body)) {
    const guardStorecode = normalizeString(body.storecode) || normalizeString(body.requesterStorecode) || "admin";
    const guard = await verifyCenterStoreAdminGuard({
      request,
      route: "/api/store/getAdminStoreList",
      body,
      storecodeRaw: guardStorecode,
      requesterWalletAddressRaw: body.requesterWalletAddress ?? body.walletAddress,
    });
    privilegedRead = guard.ok;
  }

  const view = privilegedRead ? "privileged" : "public";
  const cacheKey = JSON.stringify({
    view,
    limit: safeLimit,
    page: safePage,
    searchStore: safeSearchStore.toLowerCase(),
    agentcode: safeAgentcode.toLowerCase(),
    sortBy: safeSortBy,
  });

  const routeCache = getRouteCache();
  const cached = routeCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return NextResponse.json({
      result: cached.value,
      cached: true,
    });
  }

  const result = await getAdminStoreList({
    limit: safeLimit,
    page: safePage,
    search: safeSearchStore,
    agentcode: safeAgentcode,
    sortBy: safeSortBy,
  });

  const responseResult = privilegedRead
    ? result
    : {
      ...result,
      stores: Array.isArray(result?.stores)
        ? result.stores.map((store: any) => sanitizeStoreForPublic(store))
        : [],
    };

  routeCache.set(cacheKey, {
    value: responseResult,
    expiresAt: Date.now() + ADMIN_STORE_LIST_CACHE_TTL_MS,
  });

  return NextResponse.json({
    result: responseResult,
    cached: false,
  });
}
