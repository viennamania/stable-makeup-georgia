import { NextResponse, type NextRequest } from "next/server";
import { createHash } from "crypto";

import {
	getBuyOrders,
} from '@lib/api/order';
import { verifyCenterStoreAdminGuard } from "@/lib/server/center-store-admin-guard";

export const runtime = "nodejs";
export const preferredRegion = "icn1";

const globalGetAllBuyOrdersRouteCache = globalThis as typeof globalThis & {
  __getAllBuyOrdersRouteCache?: Map<string, { expiresAt: number; value: any }>;
  __getAllBuyOrdersRouteInFlight?: Map<string, Promise<any>>;
};

const GET_ALL_BUY_ORDERS_ROUTE_CACHE_TTL_MS = Number.parseInt(
  process.env.GET_ALL_BUY_ORDERS_ROUTE_CACHE_TTL_MS || "",
  10,
) > 0
  ? Number.parseInt(process.env.GET_ALL_BUY_ORDERS_ROUTE_CACHE_TTL_MS || "", 10)
  : 5000;
const GET_ALL_BUY_ORDERS_ROUTE_CACHE_MAX_ENTRIES = Math.max(
  Number.parseInt(process.env.GET_ALL_BUY_ORDERS_ROUTE_CACHE_MAX_ENTRIES || "", 10) || 600,
  100,
);
const GET_ALL_BUY_ORDERS_ROUTE_TIMEOUT_MS = Number.parseInt(
  process.env.GET_ALL_BUY_ORDERS_ROUTE_TIMEOUT_MS || "",
  10,
) > 0
  ? Number.parseInt(process.env.GET_ALL_BUY_ORDERS_ROUTE_TIMEOUT_MS || "", 10)
  : 12000;
const GET_ALL_BUY_ORDERS_DEFAULT_LIMIT = Number.parseInt(
  process.env.GET_ALL_BUY_ORDERS_DEFAULT_LIMIT || "",
  10,
) > 0
  ? Number.parseInt(process.env.GET_ALL_BUY_ORDERS_DEFAULT_LIMIT || "", 10)
  : 100;
const GET_ALL_BUY_ORDERS_MAX_LIMIT = Number.parseInt(
  process.env.GET_ALL_BUY_ORDERS_MAX_LIMIT || "",
  10,
) > 0
  ? Number.parseInt(process.env.GET_ALL_BUY_ORDERS_MAX_LIMIT || "", 10)
  : 200;

const normalizeStorecode = (value: unknown) => {
  if (typeof value !== "string") {
    return "";
  }
  return value.trim();
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

const normalizeBoolean = (value: unknown): boolean => {
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    return normalized === "true" || normalized === "1" || normalized === "yes";
  }
  if (typeof value === "number") {
    return value === 1;
  }
  return false;
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

const GET_ALL_BUY_ORDERS_TRANSIENT_RETRY_COUNT = Math.max(
  Number.parseInt(process.env.GET_ALL_BUY_ORDERS_TRANSIENT_RETRY_COUNT || "", 10) || 2,
  1,
);
const GET_ALL_BUY_ORDERS_TRANSIENT_RETRY_DELAY_MS = Math.max(
  Number.parseInt(process.env.GET_ALL_BUY_ORDERS_TRANSIENT_RETRY_DELAY_MS || "", 10) || 200,
  50,
);

const withTransientMongoRetry = async <T>(work: () => Promise<T>): Promise<T> => {
  let attempt = 0;
  let lastError: unknown;

  while (attempt < GET_ALL_BUY_ORDERS_TRANSIENT_RETRY_COUNT) {
    attempt += 1;

    try {
      return await work();
    } catch (error) {
      lastError = error;
      if (!isTransientMongoError(error) || attempt >= GET_ALL_BUY_ORDERS_TRANSIENT_RETRY_COUNT) {
        throw error;
      }

      await sleep(GET_ALL_BUY_ORDERS_TRANSIENT_RETRY_DELAY_MS * attempt);
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Unknown getAllBuyOrders failure");
};

const getRouteCache = () => {
  if (!globalGetAllBuyOrdersRouteCache.__getAllBuyOrdersRouteCache) {
    globalGetAllBuyOrdersRouteCache.__getAllBuyOrdersRouteCache = new Map();
  }
  return globalGetAllBuyOrdersRouteCache.__getAllBuyOrdersRouteCache;
};

const getInFlightMap = () => {
  if (!globalGetAllBuyOrdersRouteCache.__getAllBuyOrdersRouteInFlight) {
    globalGetAllBuyOrdersRouteCache.__getAllBuyOrdersRouteInFlight = new Map();
  }
  return globalGetAllBuyOrdersRouteCache.__getAllBuyOrdersRouteInFlight;
};

const pruneRouteCache = (cache: Map<string, { expiresAt: number; value: any }>) => {
  const now = Date.now();
  for (const [key, value] of cache.entries()) {
    if (value.expiresAt <= now) {
      cache.delete(key);
    }
  }

  while (cache.size > GET_ALL_BUY_ORDERS_ROUTE_CACHE_MAX_ENTRIES) {
    const oldestKey = cache.keys().next().value;
    if (!oldestKey) {
      break;
    }
    cache.delete(oldestKey);
  }
};

const createCacheKey = (input: Record<string, unknown>) => {
  const payload = JSON.stringify(input);
  return createHash("sha1").update(payload).digest("hex");
};



export async function POST(request: NextRequest) {
  let body: Record<string, unknown> = {};
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    body = {};
  }

  const {
    agentcode,
    storecode,
    limit,
    page,
    walletAddress,
    searchMyOrders,
    searchOrderStatusCancelled,
    searchOrderStatusCompleted,

    searchStoreName,

    privateSale,

    searchTradeId,
    searchBuyer,
    searchDepositName,

    searchStoreBankAccountNumber,
    searchBuyerBankAccountNumber,
    searchDepositCompleted,

    fromDate,
    toDate,

    manualConfirmPayment,

    userType,

  } = body;

  const requestedStorecode = normalizeStorecode(storecode);
  const requesterStorecode = normalizeStorecode(body?.requesterStorecode);

  const guardStorecode = requesterStorecode || requestedStorecode || "admin";

  const guard = await verifyCenterStoreAdminGuard({
    request,
    route: "/api/order/getAllBuyOrders",
    body,
    storecodeRaw: guardStorecode,
    requesterWalletAddressRaw: body?.requesterWalletAddress || walletAddress,
  });

  if (!guard.ok) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  const requesterScopeStorecode = requesterStorecode || guardStorecode;
  const requestedDiffersFromRequesterScope = Boolean(
    requestedStorecode
      && requesterScopeStorecode
      && requestedStorecode.toLowerCase() !== requesterScopeStorecode.toLowerCase(),
  );

  if (!guard.requesterIsAdmin && requestedDiffersFromRequesterScope) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const effectiveStorecode = guard.requesterIsAdmin
    ? requestedStorecode
    : guardStorecode;

  const safeLimit = Math.min(
    Math.max(1, parsePositiveInt(limit, GET_ALL_BUY_ORDERS_DEFAULT_LIMIT)),
    Math.max(1, GET_ALL_BUY_ORDERS_MAX_LIMIT),
  );
  const safePage = Math.max(1, parsePositiveInt(page, 1));
  const isSearchDepositCompleted = normalizeBoolean(searchDepositCompleted);
  const safeSearchMyOrders = normalizeBoolean(searchMyOrders);
  const safeSearchOrderStatusCancelled = normalizeBoolean(searchOrderStatusCancelled);
  const safeSearchOrderStatusCompleted = normalizeBoolean(searchOrderStatusCompleted);
  const safePrivateSale = normalizeBoolean(privateSale);
  const safeManualConfirmPayment = normalizeBoolean(manualConfirmPayment);

  // searchStoreBankAccountNumber
  //console.log("getAllBuyOrders searchStoreBankAccountNumber", searchStoreBankAccountNumber);


  //console.log("getAllBuyOrders fromDate", fromDate);
  //console.log("getAllBuyOrders toDate", toDate);



  

  ///console.log("getAllBuyOrders body", body);



  // when fromDate is "" or undefined, set it to 30 days ago
  if (!fromDate || fromDate === "") {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    body.fromDate = date.toISOString().split("T")[0]; // YYYY-MM-DD format
  }

  // when toDate is "" or undefined, set it to today
  if (!toDate || toDate === "") {
    const date = new Date();
    body.toDate = date.toISOString().split("T")[0]; // YYYY-MM-DD format
  }

  const routeCache = getRouteCache();
  const cacheKey = createCacheKey({
    agentcode: normalizeString(agentcode),
    storecode: effectiveStorecode,
    limit: safeLimit,
    page: safePage,
    walletAddress: normalizeString(walletAddress).toLowerCase(),
    searchMyOrders: safeSearchMyOrders,
    searchOrderStatusCancelled: safeSearchOrderStatusCancelled,
    searchOrderStatusCompleted: safeSearchOrderStatusCompleted,
    searchStoreName: normalizeString(searchStoreName),
    privateSale: safePrivateSale,
    searchTradeId: normalizeString(searchTradeId),
    searchBuyer: normalizeString(searchBuyer),
    searchDepositName: normalizeString(searchDepositName),
    searchStoreBankAccountNumber: normalizeString(searchStoreBankAccountNumber),
    searchBuyerBankAccountNumber: normalizeString(searchBuyerBankAccountNumber),
    searchDepositCompleted: isSearchDepositCompleted,
    fromDate: normalizeString(body.fromDate),
    toDate: normalizeString(body.toDate),
    manualConfirmPayment: safeManualConfirmPayment,
    userType: userType === undefined ? "all" : normalizeString(userType),
  });

  pruneRouteCache(routeCache);
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
            getBuyOrders({
              limit: safeLimit,
              page: safePage,
              agentcode: normalizeString(agentcode),
              storecode: effectiveStorecode,
              walletAddress: normalizeString(walletAddress),
              searchMyOrders: safeSearchMyOrders,
              searchOrderStatusCancelled: safeSearchOrderStatusCancelled,
              searchOrderStatusCompleted: safeSearchOrderStatusCompleted,
              searchStoreName: normalizeString(searchStoreName),
              privateSale: safePrivateSale,
              searchTradeId: normalizeString(searchTradeId),
              searchBuyer: normalizeString(searchBuyer),
              searchDepositName: normalizeString(searchDepositName),
              searchStoreBankAccountNumber: normalizeString(searchStoreBankAccountNumber),
              searchBuyerBankAccountNumber: normalizeString(searchBuyerBankAccountNumber),
              searchDepositCompleted: isSearchDepositCompleted,
              fromDate: normalizeString(body.fromDate),
              toDate: normalizeString(body.toDate),
              manualConfirmPayment: safeManualConfirmPayment,
              userType: userType === undefined ? "all" : normalizeString(userType) || "all",
            }),
            GET_ALL_BUY_ORDERS_ROUTE_TIMEOUT_MS,
            "getAllBuyOrders timeout",
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
      expiresAt: Date.now() + GET_ALL_BUY_ORDERS_ROUTE_CACHE_TTL_MS,
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
          totalKrwAmount: 0,
          totalUsdtAmount: 0,
          totalSettlementCount: 0,
          totalSettlementAmount: 0,
          totalSettlementAmountKRW: 0,
          totalFeeAmount: 0,
          totalFeeAmountKRW: 0,
          totalAgentFeeAmount: 0,
          totalAgentFeeAmountKRW: 0,
          totalByUserType: [],
          totalBySellerBankAccountNumber: [],
          totalByBuyerBankAccountNumber: [],
          orders: [],
        },
        error: error instanceof Error ? error.message : "Failed to get all buy orders",
      },
      { status: isTransientMongoError(error) ? 503 : 504 },
    );
  }
}
