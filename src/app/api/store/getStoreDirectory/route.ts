import { NextResponse, type NextRequest } from "next/server";

import { getStoreDirectory } from "@lib/api/store";

const globalStoreDirectoryRouteState = globalThis as typeof globalThis & {
  __storeDirectoryRouteCache?: Map<string, { expiresAt: number; value: any }>;
};

const STORE_DIRECTORY_ROUTE_CACHE_TTL_MS = Number.parseInt(
  process.env.STORE_DIRECTORY_ROUTE_CACHE_TTL_MS || "",
  10,
) > 0
  ? Number.parseInt(process.env.STORE_DIRECTORY_ROUTE_CACHE_TTL_MS || "", 10)
  : 15000;

const getRouteCache = () => {
  if (!globalStoreDirectoryRouteState.__storeDirectoryRouteCache) {
    globalStoreDirectoryRouteState.__storeDirectoryRouteCache = new Map();
  }
  return globalStoreDirectoryRouteState.__storeDirectoryRouteCache;
};

const getStaleRouteCacheEntry = (cacheKey: string) => {
  const routeCache = getRouteCache();
  return routeCache.get(cacheKey) || null;
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

export async function POST(request: NextRequest) {
  let body: Record<string, unknown> = {};
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    body = {};
  }

  const safeLimit = normalizeNumber(body.limit, 200, 500);
  const safePage = normalizeNumber(body.page, 1, 1000);
  const safeSearchStore = normalizeString(body.searchStore);
  const cacheKey = JSON.stringify({
    limit: safeLimit,
    page: safePage,
    searchStore: safeSearchStore.toLowerCase(),
  });

  const routeCache = getRouteCache();
  const cached = routeCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return NextResponse.json({
      result: cached.value,
      cached: true,
    });
  }

  try {
    const result = await getStoreDirectory({
      limit: safeLimit,
      page: safePage,
      search: safeSearchStore,
    });

    routeCache.set(cacheKey, {
      value: result,
      expiresAt: Date.now() + STORE_DIRECTORY_ROUTE_CACHE_TTL_MS,
    });

    return NextResponse.json({
      result,
      cached: false,
    });
  } catch (error) {
    const stale = getStaleRouteCacheEntry(cacheKey);
    if (stale) {
      return NextResponse.json({
        result: stale.value,
        cached: true,
        stale: true,
        warning: error instanceof Error ? error.message : "Failed to refresh store directory",
      });
    }

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to load store directory",
        result: {
          totalCount: 0,
          stores: [],
        },
      },
      { status: 500 },
    );
  }
}
