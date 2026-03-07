import { NextResponse, type NextRequest } from "next/server";

import {
	getEscrowBalanceByStorecode ,
} from '@lib/api/order';
import { verifyCenterStoreAdminGuard } from "@/lib/server/center-store-admin-guard";

export const runtime = "nodejs";
export const preferredRegion = "icn1";

const globalEscrowBalanceRouteCacheState = globalThis as typeof globalThis & {
  __escrowBalanceRouteCache?: Map<string, { expiresAt: number; value: any }>;
  __escrowBalanceRouteInFlight?: Map<string, Promise<any>>;
};

const ESCROW_BALANCE_ROUTE_CACHE_TTL_MS = Number.parseInt(
  process.env.ESCROW_BALANCE_ROUTE_CACHE_TTL_MS || "",
  10,
) > 0
  ? Number.parseInt(process.env.ESCROW_BALANCE_ROUTE_CACHE_TTL_MS || "", 10)
  : 5000;
const ESCROW_BALANCE_ROUTE_CACHE_MAX_ENTRIES = Math.max(
  Number.parseInt(process.env.ESCROW_BALANCE_ROUTE_CACHE_MAX_ENTRIES || "", 10) || 400,
  100,
);
const ESCROW_BALANCE_ROUTE_TIMEOUT_MS = Number.parseInt(
  process.env.ESCROW_BALANCE_ROUTE_TIMEOUT_MS || "",
  10,
) > 0
  ? Number.parseInt(process.env.ESCROW_BALANCE_ROUTE_TIMEOUT_MS || "", 10)
  : 12000;

const normalizeString = (value: unknown) => {
  if (typeof value !== "string") {
    return "";
  }
  return value.trim();
};

const getRouteCache = () => {
  if (!globalEscrowBalanceRouteCacheState.__escrowBalanceRouteCache) {
    globalEscrowBalanceRouteCacheState.__escrowBalanceRouteCache = new Map();
  }
  return globalEscrowBalanceRouteCacheState.__escrowBalanceRouteCache;
};

const getInFlightMap = () => {
  if (!globalEscrowBalanceRouteCacheState.__escrowBalanceRouteInFlight) {
    globalEscrowBalanceRouteCacheState.__escrowBalanceRouteInFlight = new Map();
  }
  return globalEscrowBalanceRouteCacheState.__escrowBalanceRouteInFlight;
};

const pruneRouteCache = (cache: Map<string, { expiresAt: number; value: any }>) => {
  const now = Date.now();
  for (const [key, value] of cache.entries()) {
    if (value.expiresAt <= now) {
      cache.delete(key);
    }
  }

  while (cache.size > ESCROW_BALANCE_ROUTE_CACHE_MAX_ENTRIES) {
    const oldestKey = cache.keys().next().value;
    if (!oldestKey) {
      break;
    }
    cache.delete(oldestKey);
  }
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

const ESCROW_BALANCE_TRANSIENT_RETRY_COUNT = Math.max(
  Number.parseInt(process.env.ESCROW_BALANCE_TRANSIENT_RETRY_COUNT || "", 10) || 2,
  1,
);
const ESCROW_BALANCE_TRANSIENT_RETRY_DELAY_MS = Math.max(
  Number.parseInt(process.env.ESCROW_BALANCE_TRANSIENT_RETRY_DELAY_MS || "", 10) || 200,
  50,
);

const withTransientMongoRetry = async <T>(work: () => Promise<T>): Promise<T> => {
  let attempt = 0;
  let lastError: unknown;

  while (attempt < ESCROW_BALANCE_TRANSIENT_RETRY_COUNT) {
    attempt += 1;
    try {
      return await work();
    } catch (error) {
      lastError = error;
      if (!isTransientMongoError(error) || attempt >= ESCROW_BALANCE_TRANSIENT_RETRY_COUNT) {
        throw error;
      }
      await sleep(ESCROW_BALANCE_TRANSIENT_RETRY_DELAY_MS * attempt);
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Unknown getEscrowBalance failure");
};


export async function POST(request: NextRequest) {
  let body: Record<string, unknown> = {};
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    body = {};
  }

  const {
    storecode,
    walletAddress,
  } = body;
  const safeStorecode = normalizeString(storecode);

  if (!safeStorecode) {
    return NextResponse.json({ error: "storecode is required" }, { status: 400 });
  }

  const guard = await verifyCenterStoreAdminGuard({
    request,
    route: "/api/store/getEscrowBalance",
    body,
    storecodeRaw: safeStorecode,
    requesterWalletAddressRaw: walletAddress,
  });

  if (!guard.ok) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  const routeCache = getRouteCache();
  pruneRouteCache(routeCache);
  const cacheKey = safeStorecode;
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
            getEscrowBalanceByStorecode({
              storecode: safeStorecode,
            }),
            ESCROW_BALANCE_ROUTE_TIMEOUT_MS,
            "getEscrowBalance timeout",
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
      expiresAt: Date.now() + ESCROW_BALANCE_ROUTE_CACHE_TTL_MS,
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
          escrowBalance: 0,
          todayMinusedEscrowAmount: 0,
        },
        error: error instanceof Error ? error.message : "Failed to read escrow balance",
      },
      { status: isTransientMongoError(error) ? 503 : 504 },
    );
  }
  
}
