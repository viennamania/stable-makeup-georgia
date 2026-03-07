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
const TOTAL_BUY_ORDERS_ROUTE_TIMEOUT_MS = Number.parseInt(
  process.env.TOTAL_BUY_ORDERS_ROUTE_TIMEOUT_MS || "",
  10,
) > 0
  ? Number.parseInt(process.env.TOTAL_BUY_ORDERS_ROUTE_TIMEOUT_MS || "", 10)
  : 12000;
const TOTAL_BUY_ORDERS_DEFAULT_LIMIT = Number.parseInt(
  process.env.TOTAL_BUY_ORDERS_DEFAULT_LIMIT || "",
  10,
) > 0
  ? Number.parseInt(process.env.TOTAL_BUY_ORDERS_DEFAULT_LIMIT || "", 10)
  : 100;
const TOTAL_BUY_ORDERS_MAX_LIMIT = Number.parseInt(
  process.env.TOTAL_BUY_ORDERS_MAX_LIMIT || "",
  10,
) > 0
  ? Number.parseInt(process.env.TOTAL_BUY_ORDERS_MAX_LIMIT || "", 10)
  : 300;

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

const withTimeout = async <T>(
  promise: Promise<T>,
  timeoutMs: number,
  timeoutMessage: string,
): Promise<T> => {
  const safeTimeoutMs = Math.max(1000, timeoutMs);
  let timer: ReturnType<typeof setTimeout> | null = null;

  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => reject(new Error(timeoutMessage)), safeTimeoutMs);
      }),
    ]);
  } finally {
    if (timer) {
      clearTimeout(timer);
    }
  }
};


export async function POST(request: NextRequest) {
  let body: Record<string, unknown> = {};
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    body = {};
  }

  const { storecode } = body;
  const safeStorecode = normalizeString(storecode);
  const requestedOrdersLimit = parsePositiveInt(
    body.ordersLimit,
    TOTAL_BUY_ORDERS_DEFAULT_LIMIT,
  );
  const ordersLimit = Math.min(
    Math.max(1, requestedOrdersLimit),
    Math.max(1, TOTAL_BUY_ORDERS_MAX_LIMIT),
  );
  const cacheKey = `${safeStorecode || "__all__"}:${ordersLimit}`;
  const routeCache = getRouteCache();
  const cachedEntry = routeCache.get(cacheKey);
  if (cachedEntry && cachedEntry.expiresAt > Date.now()) {
    return NextResponse.json({
      result: cachedEntry.value,
      cached: true,
    });
  }

  try {
    const result = await withTimeout(
      getTotalNumberOfBuyOrders({
        storecode: safeStorecode,
        ordersLimit,
      }),
      TOTAL_BUY_ORDERS_ROUTE_TIMEOUT_MS,
      "getTotalNumberOfBuyOrders timeout",
    );

    routeCache.set(cacheKey, {
      value: result,
      expiresAt: Date.now() + TOTAL_BUY_ORDERS_ROUTE_CACHE_TTL_MS,
    });

    return NextResponse.json({
      result,
      cached: false,
    });
  } catch (error) {
    if (cachedEntry?.value) {
      return NextResponse.json({
        result: cachedEntry.value,
        cached: true,
        stale: true,
        error: "stale cache served due to timeout",
      });
    }

    return NextResponse.json(
      {
        result: {
          totalCount: 0,
          orders: [],
          audioOnCount: 0,
          ordersLimit,
        },
        error: error instanceof Error ? error.message : "Failed to get total buy orders",
      },
      { status: 504 },
    );
  }
  
}
