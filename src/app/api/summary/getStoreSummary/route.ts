import { NextResponse, type NextRequest } from "next/server";

import {
  getAllBuyersByStorecode,
} from "@lib/api/user";
import {
  getAllBuyOrdersByStorecode,
  getAllTradesByStorecode,
  getAllClearancesByAdmin,
} from "@lib/api/order";

export const runtime = "nodejs";
export const preferredRegion = "icn1";

const globalStoreSummaryRouteState = globalThis as typeof globalThis & {
  __storeSummaryRouteCache?: Map<string, { expiresAt: number; value: any }>;
  __storeSummaryRouteInFlight?: Map<string, Promise<any>>;
};

const STORE_SUMMARY_ROUTE_CACHE_TTL_MS = Math.max(
  Number.parseInt(process.env.STORE_SUMMARY_ROUTE_CACHE_TTL_MS || "", 10) || 10000,
  1000,
);
const STORE_SUMMARY_ROUTE_TIMEOUT_MS = Math.max(
  Number.parseInt(process.env.STORE_SUMMARY_ROUTE_TIMEOUT_MS || "", 10) || 12000,
  1000,
);
const STORE_SUMMARY_TRANSIENT_RETRY_COUNT = Math.max(
  Number.parseInt(process.env.STORE_SUMMARY_TRANSIENT_RETRY_COUNT || "", 10) || 2,
  1,
);
const STORE_SUMMARY_TRANSIENT_RETRY_DELAY_MS = Math.max(
  Number.parseInt(process.env.STORE_SUMMARY_TRANSIENT_RETRY_DELAY_MS || "", 10) || 150,
  50,
);

const normalizeString = (value: unknown) => {
  if (typeof value !== "string") {
    return "";
  }
  return value.trim();
};

const getRouteCache = () => {
  if (!globalStoreSummaryRouteState.__storeSummaryRouteCache) {
    globalStoreSummaryRouteState.__storeSummaryRouteCache = new Map();
  }
  return globalStoreSummaryRouteState.__storeSummaryRouteCache;
};

const getInFlightMap = () => {
  if (!globalStoreSummaryRouteState.__storeSummaryRouteInFlight) {
    globalStoreSummaryRouteState.__storeSummaryRouteInFlight = new Map();
  }
  return globalStoreSummaryRouteState.__storeSummaryRouteInFlight;
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

  while (attempt < STORE_SUMMARY_TRANSIENT_RETRY_COUNT) {
    attempt += 1;
    try {
      return await work();
    } catch (error) {
      lastError = error;
      if (!isTransientMongoError(error) || attempt >= STORE_SUMMARY_TRANSIENT_RETRY_COUNT) {
        throw error;
      }
      await sleep(STORE_SUMMARY_TRANSIENT_RETRY_DELAY_MS * attempt);
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Unknown getStoreSummary failure");
};

const buildStoreSummary = async (storecode: string) => {
  const [users, orders, trades, clearances] = await Promise.all([
    withTransientMongoRetry(() =>
      withTimeout(
        getAllBuyersByStorecode({
          limit: 5,
          page: 1,
          storecode,
        }),
        STORE_SUMMARY_ROUTE_TIMEOUT_MS,
        "getStoreSummary buyers timeout",
      ),
    ),
    withTransientMongoRetry(() =>
      withTimeout(
        getAllBuyOrdersByStorecode({
          limit: 5,
          page: 1,
          startDate: "",
          endDate: "",
          storecode,
        }),
        STORE_SUMMARY_ROUTE_TIMEOUT_MS,
        "getStoreSummary orders timeout",
      ),
    ),
    withTransientMongoRetry(() =>
      withTimeout(
        getAllTradesByStorecode({
          limit: 5,
          page: 1,
          startDate: "",
          endDate: "",
          storecode,
          searchBuyer: "",
          searchDepositName: "",
          searchStoreBankAccountNumber: "",
        }),
        STORE_SUMMARY_ROUTE_TIMEOUT_MS,
        "getStoreSummary trades timeout",
      ),
    ),
    withTransientMongoRetry(() =>
      withTimeout(
        getAllClearancesByAdmin({
          limit: 5,
          page: 1,
          agentcode: "",
          searchNickname: "",
          walletAddress: "",
          storecode,
          searchOrderStatusCompleted: false,
          searchBuyer: "",
          searchDepositName: "",
          searchStoreBankAccountNumber: "",
          fromDate: "",
          toDate: "",
        }),
        STORE_SUMMARY_ROUTE_TIMEOUT_MS,
        "getStoreSummary clearances timeout",
      ),
    ),
  ]);

  return {
    storecode,
    latestBuyers: users?.users || [],
    totalNumberOfBuyers: users?.totalCount || 0,
    latestOrders: orders?.orders || [],
    totalNumberOfOrders: orders?.totalCount || 0,
    totalBuyKrwAmount: orders?.totalKrwAmount || 0,
    totalBuyUsdtAmount: orders?.totalUsdtAmount || 0,
    latestTrades: trades?.trades || [],
    totalNumberOfTrades: trades?.totalCount || 0,
    totalTradeKrwAmount: trades?.totalKrwAmount || 0,
    totalTradeUsdtAmount: trades?.totalUsdtAmount || 0,
    totalSettlementCount: trades?.totalSettlementCount || 0,
    totalSettlementAmount: trades?.totalSettlementAmount || 0,
    totalSettlementAmountKRW: trades?.totalSettlementAmountKRW || 0,
    latestClearances: clearances?.orders || [],
    totalClearanceCount: clearances?.totalCount || 0,
    totalClearanceKrwAmount: clearances?.totalKrwAmount || 0,
    totalClearanceUsdtAmount: clearances?.totalUsdtAmount || 0,
  };
};

export async function POST(request: NextRequest) {
  let body: Record<string, unknown> = {};
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    body = {};
  }

  const storecode = normalizeString(body.storecode || "");
  const cacheKey = storecode.toLowerCase() || "__all__";
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
      : buildStoreSummary(storecode).finally(() => {
          inFlight.delete(cacheKey);
        });

    if (!pending) {
      inFlight.set(cacheKey, job);
    }

    const result = await job;
    routeCache.set(cacheKey, {
      value: result,
      expiresAt: Date.now() + STORE_SUMMARY_ROUTE_CACHE_TTL_MS,
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
          storecode,
          latestBuyers: [],
          totalNumberOfBuyers: 0,
          latestOrders: [],
          totalNumberOfOrders: 0,
          totalBuyKrwAmount: 0,
          totalBuyUsdtAmount: 0,
          latestTrades: [],
          totalNumberOfTrades: 0,
          totalTradeKrwAmount: 0,
          totalTradeUsdtAmount: 0,
          totalSettlementCount: 0,
          totalSettlementAmount: 0,
          totalSettlementAmountKRW: 0,
          latestClearances: [],
          totalClearanceCount: 0,
          totalClearanceKrwAmount: 0,
          totalClearanceUsdtAmount: 0,
        },
        error: error instanceof Error ? error.message : "Failed to get store summary",
      },
      { status: isTransientMongoError(error) ? 503 : 504 },
    );
  }
}
