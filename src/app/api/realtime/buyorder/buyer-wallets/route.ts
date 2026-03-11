import { NextResponse, type NextRequest } from "next/server";

import { getRealtimeBuyOrderBuyerWalletBalances } from "@lib/api/buyOrderStatusRealtimeEvent";
import { authorizeRealtimeRequest } from "@lib/realtime/rbac";

export const runtime = "nodejs";
export const preferredRegion = "icn1";

const globalBuyerWalletsRouteState = globalThis as typeof globalThis & {
  __buyerWalletsRouteCache?: Map<string, { expiresAt: number; value: any }>;
  __buyerWalletsRouteInFlight?: Map<string, Promise<any>>;
};

const BUYER_WALLETS_ROUTE_CACHE_TTL_MS = Math.max(
  Number.parseInt(process.env.BUYER_WALLETS_ROUTE_CACHE_TTL_MS || "", 10) || 8000,
  1000,
);
const BUYER_WALLETS_ROUTE_CACHE_MAX_ENTRIES = Math.max(
  Number.parseInt(process.env.BUYER_WALLETS_ROUTE_CACHE_MAX_ENTRIES || "", 10) || 500,
  50,
);
const BUYER_WALLETS_ROUTE_DEFAULT_LIMIT = Math.max(
  Number.parseInt(process.env.BUYER_WALLETS_ROUTE_DEFAULT_LIMIT || "", 10) || 120,
  1,
);
const BUYER_WALLETS_ROUTE_MAX_LIMIT = Math.max(
  Number.parseInt(process.env.BUYER_WALLETS_ROUTE_MAX_LIMIT || "", 10) || 1000,
  1,
);
const BUYER_WALLETS_ROUTE_TRANSIENT_RETRY_COUNT = Math.max(
  Number.parseInt(process.env.BUYER_WALLETS_ROUTE_TRANSIENT_RETRY_COUNT || "", 10) || 2,
  1,
);
const BUYER_WALLETS_ROUTE_TRANSIENT_RETRY_DELAY_MS = Math.max(
  Number.parseInt(process.env.BUYER_WALLETS_ROUTE_TRANSIENT_RETRY_DELAY_MS || "", 10) || 200,
  50,
);

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

const getRouteCache = () => {
  if (!globalBuyerWalletsRouteState.__buyerWalletsRouteCache) {
    globalBuyerWalletsRouteState.__buyerWalletsRouteCache = new Map();
  }
  return globalBuyerWalletsRouteState.__buyerWalletsRouteCache;
};

const getInFlightMap = () => {
  if (!globalBuyerWalletsRouteState.__buyerWalletsRouteInFlight) {
    globalBuyerWalletsRouteState.__buyerWalletsRouteInFlight = new Map();
  }
  return globalBuyerWalletsRouteState.__buyerWalletsRouteInFlight;
};

const pruneRouteCache = (cache: Map<string, { expiresAt: number; value: any }>) => {
  const now = Date.now();
  for (const [key, value] of cache.entries()) {
    if (value.expiresAt <= now) {
      cache.delete(key);
    }
  }

  while (cache.size > BUYER_WALLETS_ROUTE_CACHE_MAX_ENTRIES) {
    const oldestKey = cache.keys().next().value;
    if (!oldestKey) {
      break;
    }
    cache.delete(oldestKey);
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

  if (labelSet.has("ResetPool") || labelSet.has("PoolRequestedRetry") || labelSet.has("PoolRequstedRetry")) {
    return true;
  }

  if (
    name === "MongoPoolClearedError" ||
    name === "MongoNetworkError" ||
    name === "MongoServerSelectionError" ||
    name === "MongoWaitQueueTimeoutError"
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
  );
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const withTransientMongoRetry = async <T>(work: () => Promise<T>): Promise<T> => {
  let attempt = 0;
  let lastError: unknown;

  while (attempt < BUYER_WALLETS_ROUTE_TRANSIENT_RETRY_COUNT) {
    attempt += 1;
    try {
      return await work();
    } catch (error) {
      lastError = error;
      if (!isTransientMongoError(error) || attempt >= BUYER_WALLETS_ROUTE_TRANSIENT_RETRY_COUNT) {
        throw error;
      }
      await sleep(BUYER_WALLETS_ROUTE_TRANSIENT_RETRY_DELAY_MS * attempt);
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Unknown buyer-wallets failure");
};

export async function GET(request: NextRequest) {
  const isPublic = request.nextUrl.searchParams.get("public") === "1";

  let role: "admin" | "viewer" = "viewer";

  if (!isPublic) {
    const authResult = authorizeRealtimeRequest(request, ["admin", "viewer"]);
    if (!authResult.ok) {
      return NextResponse.json(
        {
          status: "error",
          message: authResult.message,
        },
        { status: authResult.status },
      );
    }

    role = authResult.role;
  }

  const requestedLimit = parsePositiveInt(
    request.nextUrl.searchParams.get("limit"),
    BUYER_WALLETS_ROUTE_DEFAULT_LIMIT,
  );
  const fromDate = String(request.nextUrl.searchParams.get("fromDate") || "").trim();
  const toDate = String(request.nextUrl.searchParams.get("toDate") || "").trim();
  const limit = Math.min(
    Math.max(1, requestedLimit),
    Math.max(1, BUYER_WALLETS_ROUTE_MAX_LIMIT),
  );
  const cacheKey = JSON.stringify({
    fromDate,
    toDate,
    limit,
  });
  const routeCache = getRouteCache();
  pruneRouteCache(routeCache);
  const cachedEntry = routeCache.get(cacheKey);
  const hasFreshCache = Boolean(cachedEntry && cachedEntry.expiresAt > Date.now());

  try {
    if (hasFreshCache) {
      return NextResponse.json({
        status: "success",
        role,
        fromDate,
        toDate,
        totalCount: cachedEntry?.value?.totalCount || 0,
        totalCurrentUsdtBalance: cachedEntry?.value?.totalCurrentUsdtBalance || 0,
        wallets: cachedEntry?.value?.wallets || [],
        updatedAt: cachedEntry?.value?.updatedAt || new Date().toISOString(),
        cached: true,
      });
    }

    const inFlight = getInFlightMap();
    const pending = inFlight.get(cacheKey);
    const job = pending
      ? pending
      : withTransientMongoRetry(() =>
          getRealtimeBuyOrderBuyerWalletBalances({
            fromDate,
            toDate,
            limit,
          }),
        ).finally(() => {
          inFlight.delete(cacheKey);
        });

    if (!pending) {
      inFlight.set(cacheKey, job);
    }

    const result = await job;
    routeCache.set(cacheKey, {
      value: result,
      expiresAt: Date.now() + BUYER_WALLETS_ROUTE_CACHE_TTL_MS,
    });

    return NextResponse.json({
      status: "success",
      role,
      fromDate,
      toDate,
      totalCount: result.totalCount,
      totalCurrentUsdtBalance: result.totalCurrentUsdtBalance,
      wallets: result.wallets,
      updatedAt: result.updatedAt,
      cached: false,
    });
  } catch (error) {
    console.error("Failed to read realtime buyer wallet balances:", error);

    if (cachedEntry?.value) {
      return NextResponse.json({
        status: "success",
        role,
        fromDate,
        toDate,
        totalCount: cachedEntry.value.totalCount || 0,
        totalCurrentUsdtBalance: cachedEntry.value.totalCurrentUsdtBalance || 0,
        wallets: cachedEntry.value.wallets || [],
        updatedAt: cachedEntry.value.updatedAt || new Date().toISOString(),
        cached: true,
        stale: true,
      });
    }

    return NextResponse.json(
      {
        status: "error",
        message: "Failed to read realtime buyer wallet balances",
      },
      { status: 500 },
    );
  }
}
