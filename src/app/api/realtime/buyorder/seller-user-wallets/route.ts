import { NextResponse, type NextRequest } from "next/server";

import { getRealtimeNicknameSellerWalletBalances } from "@lib/api/buyOrderStatusRealtimeEvent";
import { authorizeRealtimeRequest } from "@lib/realtime/rbac";

export const runtime = "nodejs";
export const preferredRegion = "icn1";

const globalSellerUserWalletsRouteState = globalThis as typeof globalThis & {
  __sellerUserWalletsRouteCache?: Map<string, { expiresAt: number; value: any }>;
  __sellerUserWalletsRouteInFlight?: Map<string, Promise<any>>;
};

const SELLER_USER_WALLETS_ROUTE_CACHE_TTL_MS = Math.max(
  Number.parseInt(process.env.SELLER_USER_WALLETS_ROUTE_CACHE_TTL_MS || "", 10) || 8000,
  1000,
);
const SELLER_USER_WALLETS_ROUTE_DEFAULT_LIMIT = Math.max(
  Number.parseInt(process.env.SELLER_USER_WALLETS_ROUTE_DEFAULT_LIMIT || "", 10) || 120,
  1,
);
const SELLER_USER_WALLETS_ROUTE_MAX_LIMIT = Math.max(
  Number.parseInt(process.env.SELLER_USER_WALLETS_ROUTE_MAX_LIMIT || "", 10) || 160,
  1,
);
const SELLER_USER_WALLETS_ROUTE_TRANSIENT_RETRY_COUNT = Math.max(
  Number.parseInt(process.env.SELLER_USER_WALLETS_ROUTE_TRANSIENT_RETRY_COUNT || "", 10) || 2,
  1,
);
const SELLER_USER_WALLETS_ROUTE_TRANSIENT_RETRY_DELAY_MS = Math.max(
  Number.parseInt(process.env.SELLER_USER_WALLETS_ROUTE_TRANSIENT_RETRY_DELAY_MS || "", 10) || 200,
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
  if (!globalSellerUserWalletsRouteState.__sellerUserWalletsRouteCache) {
    globalSellerUserWalletsRouteState.__sellerUserWalletsRouteCache = new Map();
  }
  return globalSellerUserWalletsRouteState.__sellerUserWalletsRouteCache;
};

const getInFlightMap = () => {
  if (!globalSellerUserWalletsRouteState.__sellerUserWalletsRouteInFlight) {
    globalSellerUserWalletsRouteState.__sellerUserWalletsRouteInFlight = new Map();
  }
  return globalSellerUserWalletsRouteState.__sellerUserWalletsRouteInFlight;
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

  while (attempt < SELLER_USER_WALLETS_ROUTE_TRANSIENT_RETRY_COUNT) {
    attempt += 1;
    try {
      return await work();
    } catch (error) {
      lastError = error;
      if (!isTransientMongoError(error) || attempt >= SELLER_USER_WALLETS_ROUTE_TRANSIENT_RETRY_COUNT) {
        throw error;
      }
      await sleep(SELLER_USER_WALLETS_ROUTE_TRANSIENT_RETRY_DELAY_MS * attempt);
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Unknown seller-user-wallets failure");
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

  const nickname = request.nextUrl.searchParams.get("nickname") || "seller";
  const excludeStorecode = request.nextUrl.searchParams.get("excludeStorecode") || "";
  const requestedLimit = parsePositiveInt(
    request.nextUrl.searchParams.get("limit"),
    SELLER_USER_WALLETS_ROUTE_DEFAULT_LIMIT,
  );
  const limit = Math.min(
    Math.max(1, requestedLimit),
    Math.max(1, SELLER_USER_WALLETS_ROUTE_MAX_LIMIT),
  );
  const cacheKey = JSON.stringify({
    nickname,
    excludeStorecode,
    limit,
  });
  const routeCache = getRouteCache();
  const cachedEntry = routeCache.get(cacheKey);
  const hasFreshCache = Boolean(cachedEntry && cachedEntry.expiresAt > Date.now());

  try {
    if (hasFreshCache) {
      return NextResponse.json({
        status: "success",
        role,
        nickname,
        excludeStorecode,
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
          getRealtimeNicknameSellerWalletBalances({
            nickname,
            excludeStorecode,
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
      expiresAt: Date.now() + SELLER_USER_WALLETS_ROUTE_CACHE_TTL_MS,
    });

    return NextResponse.json({
      status: "success",
      role,
      nickname,
      excludeStorecode,
      totalCount: result.totalCount,
      totalCurrentUsdtBalance: result.totalCurrentUsdtBalance,
      wallets: result.wallets,
      updatedAt: result.updatedAt,
      cached: false,
    });
  } catch (error) {
    console.error("Failed to read realtime nickname seller wallet balances:", error);

    if (cachedEntry?.value) {
      return NextResponse.json({
        status: "success",
        role,
        nickname,
        excludeStorecode,
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
        message: "Failed to read realtime nickname seller wallet balances",
      },
      { status: 500 },
    );
  }
}
