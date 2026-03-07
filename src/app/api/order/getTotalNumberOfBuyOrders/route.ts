import { NextResponse, type NextRequest } from "next/server";

import {
	getTotalNumberOfBuyOrders,
} from '@lib/api/order';

const globalTotalBuyOrdersRouteCache = globalThis as typeof globalThis & {
  __totalBuyOrdersRouteCache?: Map<string, { expiresAt: number; value: any }>;
};

const TOTAL_BUY_ORDERS_ROUTE_CACHE_TTL_MS = Number.parseInt(
  process.env.TOTAL_BUY_ORDERS_ROUTE_CACHE_TTL_MS || "",
  10,
) > 0
  ? Number.parseInt(process.env.TOTAL_BUY_ORDERS_ROUTE_CACHE_TTL_MS || "", 10)
  : 5000;

const getRouteCache = () => {
  if (!globalTotalBuyOrdersRouteCache.__totalBuyOrdersRouteCache) {
    globalTotalBuyOrdersRouteCache.__totalBuyOrdersRouteCache = new Map();
  }
  return globalTotalBuyOrdersRouteCache.__totalBuyOrdersRouteCache;
};

const normalizeString = (value: unknown) => {
  if (typeof value !== "string") {
    return "";
  }
  return value.trim();
};


export async function POST(request: NextRequest) {

  const body = await request.json();

  const { storecode } = body;
  const safeStorecode = normalizeString(storecode);
  const cacheKey = safeStorecode || "__all__";
  const routeCache = getRouteCache();
  const cached = routeCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return NextResponse.json({
      result: cached.value,
    });
  }

  const result = await getTotalNumberOfBuyOrders({
    storecode: safeStorecode,
  });

  routeCache.set(cacheKey, {
    value: result,
    expiresAt: Date.now() + TOTAL_BUY_ORDERS_ROUTE_CACHE_TTL_MS,
  });

  return NextResponse.json({

    result,
    
  });
  
}
