import { NextResponse, type NextRequest } from "next/server";

import {
	getStoreByStorecode ,
} from '@lib/api/store';
import { verifyCenterStoreAdminGuard } from "@/lib/server/center-store-admin-guard";

export const runtime = "nodejs";
export const preferredRegion = "icn1";

const globalGetOneStoreRouteCache = globalThis as typeof globalThis & {
  __getOneStoreRouteCache?: Map<string, { expiresAt: number; value: any }>;
  __getOneStoreRouteInFlight?: Map<string, Promise<any>>;
};

const GET_ONE_STORE_ROUTE_CACHE_TTL_MS = Number.parseInt(
  process.env.GET_ONE_STORE_ROUTE_CACHE_TTL_MS || "",
  10,
) > 0
  ? Number.parseInt(process.env.GET_ONE_STORE_ROUTE_CACHE_TTL_MS || "", 10)
  : 10000;
const GET_ONE_STORE_ROUTE_TIMEOUT_MS = Number.parseInt(
  process.env.GET_ONE_STORE_ROUTE_TIMEOUT_MS || "",
  10,
) > 0
  ? Number.parseInt(process.env.GET_ONE_STORE_ROUTE_TIMEOUT_MS || "", 10)
  : 12000;
const GET_ONE_STORE_TRANSIENT_RETRY_COUNT = Math.max(
  Number.parseInt(process.env.GET_ONE_STORE_TRANSIENT_RETRY_COUNT || "", 10) || 2,
  1,
);
const GET_ONE_STORE_TRANSIENT_RETRY_DELAY_MS = Math.max(
  Number.parseInt(process.env.GET_ONE_STORE_TRANSIENT_RETRY_DELAY_MS || "", 10) || 200,
  50,
);

const SENSITIVE_PUBLIC_STORE_KEYS = new Set([
  "payactionKey",
  "bankInfo",
  "bankInfoAAA",
  "bankInfoBBB",
  "bankInfoCCC",
  "bankInfoDDD",
  "sellerWalletAddress",
  "adminWalletAddress",
  "settlementWalletAddress",
  "settlementFeeWalletAddress",
  "agentFeeWalletAddress",
  "privateSellerWalletAddress",
  "privateSaleWalletAddress",
  "paymentCallbackUrl",
]);

const normalizeString = (value: unknown) => {
  if (typeof value !== "string") {
    return "";
  }
  return value.trim();
};

const getRouteCache = () => {
  if (!globalGetOneStoreRouteCache.__getOneStoreRouteCache) {
    globalGetOneStoreRouteCache.__getOneStoreRouteCache = new Map();
  }
  return globalGetOneStoreRouteCache.__getOneStoreRouteCache;
};

const getInFlightMap = () => {
  if (!globalGetOneStoreRouteCache.__getOneStoreRouteInFlight) {
    globalGetOneStoreRouteCache.__getOneStoreRouteInFlight = new Map();
  }
  return globalGetOneStoreRouteCache.__getOneStoreRouteInFlight;
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
    || message.includes("ReplicaSetNoPrimary")
    || message.includes("Server selection timed out")
    || message.includes("Timed out while checking out a connection from connection pool")
    || message.includes("Client network socket disconnected")
  );
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const withTransientMongoRetry = async <T>(work: () => Promise<T>): Promise<T> => {
  let attempt = 0;
  let lastError: unknown;

  while (attempt < GET_ONE_STORE_TRANSIENT_RETRY_COUNT) {
    attempt += 1;
    try {
      return await work();
    } catch (error) {
      lastError = error;
      if (!isTransientMongoError(error) || attempt >= GET_ONE_STORE_TRANSIENT_RETRY_COUNT) {
        throw error;
      }
      await sleep(GET_ONE_STORE_TRANSIENT_RETRY_DELAY_MS * attempt);
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Unknown getOneStore failure");
};

const hasCenterStoreAuthIntent = (body: Record<string, unknown>) => {
  return Boolean(
    normalizeString(body.signature)
    || normalizeString(body.signedAt)
    || normalizeString(body.nonce)
    || normalizeString(body.requesterWalletAddress)
    || normalizeString(body.walletAddress),
  );
};

const sanitizeStoreForPublic = (value: any) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return value;
  }

  const sanitized: Record<string, unknown> = {};
  for (const [key, itemValue] of Object.entries(value)) {
    if (SENSITIVE_PUBLIC_STORE_KEYS.has(key)) {
      continue;
    }
    sanitized[key] = itemValue;
  }

  return sanitized;
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
  } = body;

  const safeStorecode = normalizeString(storecode);
  if (!safeStorecode) {
    return NextResponse.json(
      {
        result: null,
        error: "storecode is required",
      },
      { status: 400 },
    );
  }

  const routeCache = getRouteCache();
  const cacheKey = safeStorecode.toLowerCase();
  const cachedEntry = routeCache.get(cacheKey);
  const hasFreshCache = Boolean(cachedEntry && cachedEntry.expiresAt > Date.now());

  let privilegedRead = false;
  if (hasCenterStoreAuthIntent(body)) {
    const guardStorecode = safeStorecode || normalizeString(body.requesterStorecode) || "admin";
    const guard = await verifyCenterStoreAdminGuard({
      request,
      route: "/api/store/getOneStore",
      body,
      storecodeRaw: guardStorecode,
      requesterWalletAddressRaw: body.requesterWalletAddress ?? body.walletAddress,
    });
    privilegedRead = guard.ok;
  }

  if (hasFreshCache) {
    const cachedValue = cachedEntry?.value ?? null;
    return NextResponse.json({
      result: privilegedRead ? cachedValue : sanitizeStoreForPublic(cachedValue),
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
            getStoreByStorecode({
              storecode: safeStorecode,
            }),
            GET_ONE_STORE_ROUTE_TIMEOUT_MS,
            "getOneStore timeout",
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
      expiresAt: Date.now() + GET_ONE_STORE_ROUTE_CACHE_TTL_MS,
    });

    return NextResponse.json({
      result: privilegedRead ? result : sanitizeStoreForPublic(result),
      cached: false,
    });
  } catch (error) {
    if (cachedEntry) {
      return NextResponse.json({
        result: privilegedRead
          ? (cachedEntry.value ?? null)
          : sanitizeStoreForPublic(cachedEntry.value ?? null),
        cached: true,
        stale: true,
        error: "stale cache served due to timeout",
      });
    }

    return NextResponse.json(
      {
        result: null,
        error: error instanceof Error ? error.message : "Failed to read store",
      },
      { status: isTransientMongoError(error) ? 503 : 504 },
    );
  }
  
}
