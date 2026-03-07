import { NextResponse, type NextRequest } from "next/server";

import {
	getAllStores,
} from '@lib/api/store';


const globalGetAllStoresCache = globalThis as typeof globalThis & {
  __getAllStoresRouteCache?: Map<string, { expiresAt: number; value: any }>;
};

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

const normalizeNumber = (value: unknown, fallback: number) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return Math.floor(parsed);
};

const buildCacheKey = (params: {
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

  const body = await request.json();

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
  const cacheKey = buildCacheKey({
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

  //console.log("getAllStores result", result);
  cache.set(cacheKey, {
    value: result,
    expiresAt: Date.now() + GET_ALL_STORES_CACHE_TTL_MS,
  });
  
 
  return NextResponse.json({

    result,
    
  });
  
}
