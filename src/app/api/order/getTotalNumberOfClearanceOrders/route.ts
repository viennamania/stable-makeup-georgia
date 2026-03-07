import { NextResponse, type NextRequest } from "next/server";

import {
  getTotalNumberOfClearanceOrders,
} from "@lib/api/order";

export const runtime = "nodejs";
export const preferredRegion = "icn1";

const globalClearanceOrdersRouteCache = globalThis as typeof globalThis & {
  __clearanceOrdersRouteCache?: Map<string, { expiresAt: number; value: any }>;
  __clearanceOrdersRouteInFlight?: Map<string, Promise<any>>;
};

const CLEARANCE_ORDERS_ROUTE_CACHE_TTL_MS = Math.max(
  Number.parseInt(process.env.CLEARANCE_ORDERS_ROUTE_CACHE_TTL_MS || "", 10) || 6000,
  1000,
);
const CLEARANCE_ORDERS_ROUTE_TIMEOUT_MS = Math.max(
  Number.parseInt(process.env.CLEARANCE_ORDERS_ROUTE_TIMEOUT_MS || "", 10) || 12000,
  1000,
);
const CLEARANCE_ORDERS_TRANSIENT_RETRY_COUNT = Math.max(
  Number.parseInt(process.env.CLEARANCE_ORDERS_TRANSIENT_RETRY_COUNT || "", 10) || 2,
  1,
);
const CLEARANCE_ORDERS_TRANSIENT_RETRY_DELAY_MS = Math.max(
  Number.parseInt(process.env.CLEARANCE_ORDERS_TRANSIENT_RETRY_DELAY_MS || "", 10) || 200,
  50,
);

const getRouteCache = () => {
  if (!globalClearanceOrdersRouteCache.__clearanceOrdersRouteCache) {
    globalClearanceOrdersRouteCache.__clearanceOrdersRouteCache = new Map();
  }
  return globalClearanceOrdersRouteCache.__clearanceOrdersRouteCache;
};

const getInFlightMap = () => {
  if (!globalClearanceOrdersRouteCache.__clearanceOrdersRouteInFlight) {
    globalClearanceOrdersRouteCache.__clearanceOrdersRouteInFlight = new Map();
  }
  return globalClearanceOrdersRouteCache.__clearanceOrdersRouteInFlight;
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
      new Promise<T>((_resolve, reject) => {
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
    name === "MongoPoolClearedError"
    || name === "MongoNetworkError"
    || name === "MongoServerSelectionError"
    || name === "MongoWaitQueueTimeoutError"
    || causeName === "MongoNetworkError"
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

const withTransientMongoRetry = async <T>(work: () => Promise<T>): Promise<T> => {
  let attempt = 0;
  let lastError: unknown;

  while (attempt < CLEARANCE_ORDERS_TRANSIENT_RETRY_COUNT) {
    attempt += 1;
    try {
      return await work();
    } catch (error) {
      lastError = error;
      if (!isTransientMongoError(error) || attempt >= CLEARANCE_ORDERS_TRANSIENT_RETRY_COUNT) {
        throw error;
      }
      await sleep(CLEARANCE_ORDERS_TRANSIENT_RETRY_DELAY_MS * attempt);
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Unknown getTotalNumberOfClearanceOrders failure");
};

export async function POST(_request: NextRequest) {
  const cacheKey = "__all__";
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
            getTotalNumberOfClearanceOrders(),
            CLEARANCE_ORDERS_ROUTE_TIMEOUT_MS,
            "getTotalNumberOfClearanceOrders timeout",
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
      expiresAt: Date.now() + CLEARANCE_ORDERS_ROUTE_CACHE_TTL_MS,
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
        },
        error: error instanceof Error ? error.message : "Failed to get total clearance orders",
      },
      { status: isTransientMongoError(error) ? 503 : 504 },
    );
  }
}
