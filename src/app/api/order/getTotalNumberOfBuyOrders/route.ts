import { NextResponse, type NextRequest } from "next/server";

import {
	getTotalNumberOfBuyOrders,
} from '@lib/api/order';

export const runtime = "nodejs";
export const preferredRegion = "icn1";

const globalTotalBuyOrdersRouteCache = globalThis as typeof globalThis & {
  __totalBuyOrdersRouteCache?: Map<string, { expiresAt: number; value: any }>;
  __totalBuyOrdersRouteInFlight?: Map<string, Promise<any>>;
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

const getInFlightMap = () => {
  if (!globalTotalBuyOrdersRouteCache.__totalBuyOrdersRouteInFlight) {
    globalTotalBuyOrdersRouteCache.__totalBuyOrdersRouteInFlight = new Map();
  }
  return globalTotalBuyOrdersRouteCache.__totalBuyOrdersRouteInFlight;
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

const isTransientMongoError = (error: unknown): boolean => {
  if (!error || typeof error !== "object") {
    return false;
  }

  const anyError = error as any;
  const labels = anyError?.errorLabelSet instanceof Set
    ? Array.from(anyError.errorLabelSet)
    : [];
  const labelSet = new Set(labels.map((label) => String(label)));
  const name = String(anyError?.name || "");
  const message = String(anyError?.message || "");
  const code = String(anyError?.code || anyError?.cause?.code || "");
  const causeName = String(anyError?.cause?.name || "");

  if (labelSet.has("ResetPool") || labelSet.has("PoolRequestedRetry") || labelSet.has("PoolRequstedRetry")) {
    return true;
  }

  if (
    name === "MongoPoolClearedError" ||
    name === "MongoNetworkError" ||
    name === "MongoServerSelectionError" ||
    name === "MongoWaitQueueTimeoutError" ||
    causeName === "MongoNetworkError"
  ) {
    return true;
  }

  if (code === "ECONNRESET" || code === "ETIMEDOUT") {
    return true;
  }

  return (
    message.includes("Connection pool")
    || message.includes("TLS connection")
    || message.includes("Server selection timed out")
    || message.includes("Timed out while checking out a connection from connection pool")
    || message.includes("Client network socket disconnected")
  );
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const TOTAL_BUY_ORDERS_TRANSIENT_RETRY_COUNT = Math.max(
  Number.parseInt(process.env.TOTAL_BUY_ORDERS_TRANSIENT_RETRY_COUNT || "", 10) || 2,
  1,
);
const TOTAL_BUY_ORDERS_TRANSIENT_RETRY_DELAY_MS = Math.max(
  Number.parseInt(process.env.TOTAL_BUY_ORDERS_TRANSIENT_RETRY_DELAY_MS || "", 10) || 200,
  50,
);

const withTransientMongoRetry = async <T>(work: () => Promise<T>): Promise<T> => {
  let attempt = 0;
  let lastError: unknown;

  while (attempt < TOTAL_BUY_ORDERS_TRANSIENT_RETRY_COUNT) {
    attempt += 1;
    try {
      return await work();
    } catch (error) {
      lastError = error;
      if (!isTransientMongoError(error) || attempt >= TOTAL_BUY_ORDERS_TRANSIENT_RETRY_COUNT) {
        throw error;
      }
      await sleep(TOTAL_BUY_ORDERS_TRANSIENT_RETRY_DELAY_MS * attempt);
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Unknown getTotalNumberOfBuyOrders failure");
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
    const inFlight = getInFlightMap();
    const pending = inFlight.get(cacheKey);
    const job = pending
      ? pending
      : withTransientMongoRetry(() =>
          withTimeout(
            getTotalNumberOfBuyOrders({
              storecode: safeStorecode,
              ordersLimit,
            }),
            TOTAL_BUY_ORDERS_ROUTE_TIMEOUT_MS,
            "getTotalNumberOfBuyOrders timeout",
          ),
        ).finally(() => {
          inFlight.delete(cacheKey);
        });

    if (!pending) {
      inFlight.set(cacheKey, job);
    }

    const result = await job;

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
      { status: isTransientMongoError(error) ? 503 : 504 },
    );
  }
  
}
