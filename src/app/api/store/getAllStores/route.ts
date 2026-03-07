import { NextResponse, type NextRequest } from "next/server";

import {
	getAllStores,
} from '@lib/api/store';
import { verifyCenterStoreAdminGuard } from "@/lib/server/center-store-admin-guard";


const globalGetAllStoresCache = globalThis as typeof globalThis & {
  __getAllStoresRouteCache?: Map<string, { expiresAt: number; value: any }>;
};

const SENSITIVE_PUBLIC_STORE_KEYS = new Set([
  "payactionKey",
  "bankInfo",
  "bankInfoAAA",
  "bankInfoBBB",
  "bankInfoCCC",
  "bankInfoDDD",
  "sellerWalletAddress",
  "adminWalletAddress",
  "settlementWalletAddress",
  "settlementFeeWalletAddress",
  "agentFeeWalletAddress",
  "privateSellerWalletAddress",
  "privateSaleWalletAddress",
  "paymentCallbackUrl",
]);

const GET_ALL_STORES_CACHE_TTL_MS = Number.parseInt(
  process.env.GET_ALL_STORES_CACHE_TTL_MS || "",
  10,
) > 0
  ? Number.parseInt(process.env.GET_ALL_STORES_CACHE_TTL_MS || "", 10)
  : 10000;

const getRouteCache = () => {
  if (!globalGetAllStoresCache.__getAllStoresRouteCache) {
    globalGetAllStoresCache.__getAllStoresRouteCache = new Map();
  }
  return globalGetAllStoresCache.__getAllStoresRouteCache;
};

const normalizeString = (value: unknown) => {
  if (typeof value !== "string") {
    return "";
  }
  return value.trim();
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

const sanitizeStoreForPublic = (value: any) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return value;
  }

  const sanitized: Record<string, unknown> = {};
  for (const [key, itemValue] of Object.entries(value)) {
    if (SENSITIVE_PUBLIC_STORE_KEYS.has(key)) {
      continue;
    }
    sanitized[key] = itemValue;
  }

  return sanitized;
};

const normalizeNumber = (value: unknown, fallback: number) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return Math.floor(parsed);
};

const buildCacheKey = (params: {
  view: "public" | "privileged";
  limit: number;
  page: number;
  searchStore: string;
  agentcode: string;
  sortBy: string;
  fromDate: string;
  toDate: string;
}) => {
  return JSON.stringify(params);
};


export async function POST(request: NextRequest) {

  let body: Record<string, unknown> = {};
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    body = {};
  }

  const {
    walletAddress,
    limit,
    page,
    searchStore,
    agentcode,
    sortBy,
    fromDate = "",
    toDate = "",
  } = body;

  //console.log("getAllStores request body", body);

  const safeLimit = normalizeNumber(limit, 100);
  const safePage = normalizeNumber(page, 1);
  const safeSearchStore = normalizeString(searchStore);
  const safeAgentcode = normalizeString(agentcode);
  const safeSortBy = normalizeString(sortBy);
  const safeFromDate = normalizeString(fromDate);
  const safeToDate = normalizeString(toDate);

  let privilegedRead = false;
  if (hasCenterStoreAuthIntent(body)) {
    const guardStorecode = normalizeString(body.storecode) || normalizeString(body.requesterStorecode) || "admin";
    const guard = await verifyCenterStoreAdminGuard({
      request,
      route: "/api/store/getAllStores",
      body,
      storecodeRaw: guardStorecode,
      requesterWalletAddressRaw: body.requesterWalletAddress ?? body.walletAddress,
    });
    privilegedRead = guard.ok;
  }

  const view = privilegedRead ? "privileged" : "public";

  const cacheKey = buildCacheKey({
    view,
    limit: safeLimit,
    page: safePage,
    searchStore: safeSearchStore,
    agentcode: safeAgentcode,
    sortBy: safeSortBy,
    fromDate: safeFromDate,
    toDate: safeToDate,
  });
  const cache = getRouteCache();
  const cached = cache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return NextResponse.json({
      result: cached.value,
    });
  }

  const result = await getAllStores({
    limit: safeLimit,
    page: safePage,
    search: safeSearchStore,
    agentcode: safeAgentcode,
    sortBy: safeSortBy,
    fromDate: safeFromDate,
    toDate: safeToDate,
  });

  const responseResult = privilegedRead
    ? result
    : {
      ...result,
      stores: Array.isArray(result?.stores)
        ? result.stores.map((store: any) => sanitizeStoreForPublic(store))
        : [],
    };

  //console.log("getAllStores result", result);
  cache.set(cacheKey, {
    value: responseResult,
    expiresAt: Date.now() + GET_ALL_STORES_CACHE_TTL_MS,
  });
  
 
  return NextResponse.json({

    result: responseResult,
    
  });
  
}
