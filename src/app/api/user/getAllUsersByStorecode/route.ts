import { NextResponse, type NextRequest } from "next/server";

import {
  getAllUsersByStorecodeAndVerified,
} from "@lib/api/user";
import {
  consumeReadRateLimit,
  getRequestIp,
  logUserReadSecurityEvent,
  sanitizeUserForResponse,
} from "@/lib/server/user-read-security";

export const runtime = "nodejs";
export const preferredRegion = "icn1";

type GetAllUsersByStorecodeRequestBody = {
  storecode?: unknown;
  limit?: unknown;
  page?: unknown;
};

const globalGetAllUsersByStorecodeRouteState = globalThis as typeof globalThis & {
  __getAllUsersByStorecodeRouteCache?: Map<string, { expiresAt: number; value: any }>;
  __getAllUsersByStorecodeRouteInFlight?: Map<string, Promise<any>>;
};

const GET_ALL_USERS_BY_STORECODE_ROUTE_CACHE_TTL_MS = Math.max(
  Number.parseInt(process.env.GET_ALL_USERS_BY_STORECODE_ROUTE_CACHE_TTL_MS || "", 10) || 8000,
  1000,
);
const GET_ALL_USERS_BY_STORECODE_ROUTE_CACHE_MAX_ENTRIES = Math.max(
  Number.parseInt(process.env.GET_ALL_USERS_BY_STORECODE_ROUTE_CACHE_MAX_ENTRIES || "", 10) || 600,
  50,
);
const GET_ALL_USERS_BY_STORECODE_DEFAULT_LIMIT = Math.max(
  Number.parseInt(process.env.GET_ALL_USERS_BY_STORECODE_DEFAULT_LIMIT || "", 10) || 60,
  1,
);
const GET_ALL_USERS_BY_STORECODE_MAX_LIMIT = Math.max(
  Number.parseInt(process.env.GET_ALL_USERS_BY_STORECODE_MAX_LIMIT || "", 10) || 100,
  1,
);
const GET_ALL_USERS_BY_STORECODE_TRANSIENT_RETRY_COUNT = Math.max(
  Number.parseInt(process.env.GET_ALL_USERS_BY_STORECODE_TRANSIENT_RETRY_COUNT || "", 10) || 2,
  1,
);
const GET_ALL_USERS_BY_STORECODE_TRANSIENT_RETRY_DELAY_MS = Math.max(
  Number.parseInt(process.env.GET_ALL_USERS_BY_STORECODE_TRANSIENT_RETRY_DELAY_MS || "", 10) || 200,
  50,
);

const normalizeString = (value: unknown): string => {
  if (typeof value !== "string") {
    return "";
  }
  return value.trim();
};

const normalizeNumber = (value: unknown, fallback: number): number => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return Math.floor(parsed);
};

const getRouteCache = () => {
  if (!globalGetAllUsersByStorecodeRouteState.__getAllUsersByStorecodeRouteCache) {
    globalGetAllUsersByStorecodeRouteState.__getAllUsersByStorecodeRouteCache = new Map();
  }
  return globalGetAllUsersByStorecodeRouteState.__getAllUsersByStorecodeRouteCache;
};

const getInFlightMap = () => {
  if (!globalGetAllUsersByStorecodeRouteState.__getAllUsersByStorecodeRouteInFlight) {
    globalGetAllUsersByStorecodeRouteState.__getAllUsersByStorecodeRouteInFlight = new Map();
  }
  return globalGetAllUsersByStorecodeRouteState.__getAllUsersByStorecodeRouteInFlight;
};

const pruneRouteCache = (cache: Map<string, { expiresAt: number; value: any }>) => {
  const now = Date.now();
  for (const [key, value] of cache.entries()) {
    if (value.expiresAt <= now) {
      cache.delete(key);
    }
  }

  while (cache.size > GET_ALL_USERS_BY_STORECODE_ROUTE_CACHE_MAX_ENTRIES) {
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

  while (attempt < GET_ALL_USERS_BY_STORECODE_TRANSIENT_RETRY_COUNT) {
    attempt += 1;
    try {
      return await work();
    } catch (error) {
      lastError = error;
      if (!isTransientMongoError(error) || attempt >= GET_ALL_USERS_BY_STORECODE_TRANSIENT_RETRY_COUNT) {
        throw error;
      }
      await sleep(GET_ALL_USERS_BY_STORECODE_TRANSIENT_RETRY_DELAY_MS * attempt);
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Unknown getAllUsersByStorecode failure");
};

export async function POST(request: NextRequest) {
  let body: GetAllUsersByStorecodeRequestBody = {};
  try {
    body = (await request.json()) as GetAllUsersByStorecodeRequestBody;
  } catch {
    body = {};
  }

  const storecode = normalizeString(body.storecode);
  const limit = Math.min(
    GET_ALL_USERS_BY_STORECODE_MAX_LIMIT,
    normalizeNumber(body.limit, GET_ALL_USERS_BY_STORECODE_DEFAULT_LIMIT),
  );
  const page = normalizeNumber(body.page, 1);
  const ip = getRequestIp(request);

  if (!storecode) {
    return NextResponse.json(
      {
        result: null,
        error: "Missing storecode",
      },
      { status: 400 }
    );
  }

  const rate = consumeReadRateLimit({
    scope: "getAllUsersByStorecode",
    ip,
    walletAddress: storecode.toLowerCase(),
  });

  if (!rate.allowed) {
    void logUserReadSecurityEvent({
      route: "/api/user/getAllUsersByStorecode",
      status: "blocked",
      reason: "rate_limited",
      ip,
      storecode,
      walletAddress: storecode.toLowerCase(),
      rateLimited: true,
      signatureProvided: false,
      signatureVerified: false,
    });

    return NextResponse.json(
      {
        result: null,
        error: "Too many requests",
      },
      { status: 429 }
    );
  }

  const cacheKey = JSON.stringify({
    storecode: storecode.toLowerCase(),
    limit,
    page,
  });
  const routeCache = getRouteCache();
  pruneRouteCache(routeCache);
  const cachedEntry = routeCache.get(cacheKey);
  const hasFreshCache = Boolean(cachedEntry && cachedEntry.expiresAt > Date.now());

  try {
    if (hasFreshCache) {
      return NextResponse.json({
        result: cachedEntry?.value,
        cached: true,
      });
    }

    const inFlight = getInFlightMap();
    const pending = inFlight.get(cacheKey);
    const job = pending
      ? pending
      : withTransientMongoRetry(() =>
          getAllUsersByStorecodeAndVerified({
            storecode,
            limit,
            page,
          }),
        ).finally(() => {
          inFlight.delete(cacheKey);
        });

    if (!pending) {
      inFlight.set(cacheKey, job);
    }

    const result = await job;
    const sanitizedResult = sanitizeUserForResponse(result);
    routeCache.set(cacheKey, {
      value: sanitizedResult,
      expiresAt: Date.now() + GET_ALL_USERS_BY_STORECODE_ROUTE_CACHE_TTL_MS,
    });

    void logUserReadSecurityEvent({
      route: "/api/user/getAllUsersByStorecode",
      status: "allowed",
      reason: "store_user_list_read",
      ip,
      storecode,
      walletAddress: storecode.toLowerCase(),
      rateLimited: false,
      signatureProvided: false,
      signatureVerified: false,
      extra: {
        limit,
        page,
        totalResult: result?.totalResult || 0,
      },
    });

    return NextResponse.json({
      result: sanitizedResult,
      cached: false,
    });
  } catch (error) {
    if (cachedEntry?.value) {
      return NextResponse.json({
        result: cachedEntry.value,
        cached: true,
        stale: true,
      });
    }

    return NextResponse.json(
      {
        result: null,
        error: "Temporary database connectivity issue. Please retry.",
      },
      { status: isTransientMongoError(error) ? 503 : 500 },
    );
  }
}
