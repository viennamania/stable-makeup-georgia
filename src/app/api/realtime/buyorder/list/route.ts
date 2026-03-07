import { NextResponse, type NextRequest } from "next/server";

import { getRealtimeBuyOrderSearchList } from "@lib/api/buyOrderStatusRealtimeEvent";
import { authorizeRealtimeRequest } from "@lib/realtime/rbac";

export const runtime = "nodejs";

const REALTIME_BUYORDER_LIST_CACHE_TTL_MS = Math.max(
  Number.parseInt(process.env.REALTIME_BUYORDER_LIST_CACHE_TTL_MS || "", 10) || 1500,
  250,
);
const REALTIME_BUYORDER_LIST_CACHE_MAX_ENTRIES = Math.max(
  Number.parseInt(process.env.REALTIME_BUYORDER_LIST_CACHE_MAX_ENTRIES || "", 10) || 300,
  20,
);
const REALTIME_BUYORDER_LIST_RETRY_COUNT = Math.max(
  Number.parseInt(process.env.REALTIME_BUYORDER_LIST_RETRY_COUNT || "", 10) || 2,
  1,
);
const REALTIME_BUYORDER_LIST_RETRY_DELAY_MS = Math.max(
  Number.parseInt(process.env.REALTIME_BUYORDER_LIST_RETRY_DELAY_MS || "", 10) || 120,
  50,
);

type RealtimeBuyOrderListSuccessPayload = {
  status: "success";
  role: "admin" | "viewer";
  totalCount: number;
  page: number;
  limit: number;
  totalPages: number;
  orders: unknown[];
  updatedAt: string;
  cached?: boolean;
  stale?: boolean;
};

const globalRealtimeBuyOrderListState = globalThis as typeof globalThis & {
  __realtimeBuyOrderListCache?: Map<
    string,
    { expiresAt: number; payload: RealtimeBuyOrderListSuccessPayload }
  >;
  __realtimeBuyOrderListInFlight?: Map<string, Promise<RealtimeBuyOrderListSuccessPayload>>;
};

const getRealtimeBuyOrderListCache = () => {
  if (!globalRealtimeBuyOrderListState.__realtimeBuyOrderListCache) {
    globalRealtimeBuyOrderListState.__realtimeBuyOrderListCache = new Map();
  }
  return globalRealtimeBuyOrderListState.__realtimeBuyOrderListCache;
};

const getRealtimeBuyOrderListInFlight = () => {
  if (!globalRealtimeBuyOrderListState.__realtimeBuyOrderListInFlight) {
    globalRealtimeBuyOrderListState.__realtimeBuyOrderListInFlight = new Map();
  }
  return globalRealtimeBuyOrderListState.__realtimeBuyOrderListInFlight;
};

const pruneRealtimeBuyOrderListCache = (cache: ReturnType<typeof getRealtimeBuyOrderListCache>) => {
  const now = Date.now();
  for (const [key, value] of cache.entries()) {
    if (value.expiresAt <= now) {
      cache.delete(key);
    }
  }

  while (cache.size > REALTIME_BUYORDER_LIST_CACHE_MAX_ENTRIES) {
    const oldestKey = cache.keys().next().value;
    if (!oldestKey) {
      break;
    }
    cache.delete(oldestKey);
  }
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

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

  if (
    labelSet.has("ResetPool")
    || labelSet.has("PoolRequestedRetry")
    || labelSet.has("PoolRequstedRetry")
  ) {
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

const withTransientMongoRetry = async <T>(work: () => Promise<T>): Promise<T> => {
  let attempt = 0;
  let lastError: unknown;

  while (attempt < REALTIME_BUYORDER_LIST_RETRY_COUNT) {
    attempt += 1;
    try {
      return await work();
    } catch (error) {
      lastError = error;
      if (!isTransientMongoError(error) || attempt >= REALTIME_BUYORDER_LIST_RETRY_COUNT) {
        throw error;
      }
      await sleep(REALTIME_BUYORDER_LIST_RETRY_DELAY_MS * attempt);
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Unknown realtime buyorder list failure");
};

const buildCacheKey = ({
  role,
  isPublic,
  page,
  limit,
  status,
  q,
  storeCode,
}: {
  role: "admin" | "viewer";
  isPublic: boolean;
  page: number;
  limit: number;
  status: string;
  q: string;
  storeCode: string;
}) => {
  return [
    isPublic ? "public" : "signed",
    role,
    String(Math.max(1, Number(page) || 1)),
    String(Math.min(Math.max(Number(limit) || 10, 1), 50)),
    String(status || "all").trim().toLowerCase(),
    String(storeCode || "").trim().toLowerCase(),
    String(q || "").trim().toLowerCase(),
  ].join("|");
};

const getResponseHeaders = (isPublic: boolean) => {
  if (!isPublic) {
    return {
      "Cache-Control": "private, no-store",
    };
  }

  return {
    // Small CDN cache window prevents stampeding on hot list filters during realtime polling.
    "Cache-Control": "public, max-age=1, s-maxage=2, stale-while-revalidate=8",
  };
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

  const page = Number(request.nextUrl.searchParams.get("page") || 1);
  const limit = Number(request.nextUrl.searchParams.get("limit") || 10);
  const status = String(request.nextUrl.searchParams.get("status") || "all");
  const q = String(request.nextUrl.searchParams.get("q") || "");
  const storeCode = String(request.nextUrl.searchParams.get("storeCode") || "");
  const responseHeaders = getResponseHeaders(isPublic);

  const cacheKey = buildCacheKey({
    role,
    isPublic,
    page,
    limit,
    status,
    q,
    storeCode,
  });
  const cache = getRealtimeBuyOrderListCache();
  const inFlight = getRealtimeBuyOrderListInFlight();
  pruneRealtimeBuyOrderListCache(cache);
  const now = Date.now();
  const freshCached = cache.get(cacheKey);

  if (freshCached && freshCached.expiresAt > now) {
    return NextResponse.json(
      {
        ...freshCached.payload,
        cached: true,
      },
      { headers: responseHeaders },
    );
  }

  try {
    const existingJob = inFlight.get(cacheKey);
    const job = existingJob || withTransientMongoRetry(async () => {
      const result = await getRealtimeBuyOrderSearchList({
        page,
        limit,
        status,
        searchQuery: q,
        storeCode,
      });

      return {
        status: "success" as const,
        role,
        totalCount: result.totalCount,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
        orders: result.orders,
        updatedAt: result.updatedAt,
      };
    });

    if (!existingJob) {
      inFlight.set(cacheKey, job);
    }

    const payload = await job;
    cache.set(cacheKey, {
      payload,
      expiresAt: Date.now() + REALTIME_BUYORDER_LIST_CACHE_TTL_MS,
    });

    return NextResponse.json(payload, { headers: responseHeaders });
  } catch (error) {
    console.error("Failed to read buyorder search list:", error);

    const staleCached = cache.get(cacheKey);
    if (staleCached && isTransientMongoError(error)) {
      return NextResponse.json(
        {
          ...staleCached.payload,
          cached: true,
          stale: true,
        },
        { headers: responseHeaders },
      );
    }

    const statusCode = isTransientMongoError(error) ? 503 : 500;
    const message = isTransientMongoError(error)
      ? "Temporary database connectivity issue. Please retry."
      : "Failed to read buyorder search list";

    return NextResponse.json(
      {
        status: "error",
        message,
      },
      { status: statusCode, headers: responseHeaders },
    );
  } finally {
    inFlight.delete(cacheKey);
  }
}
