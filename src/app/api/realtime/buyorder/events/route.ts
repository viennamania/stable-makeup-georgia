import { NextResponse, type NextRequest } from "next/server";
import { ObjectId } from "mongodb";

import { getBuyOrderStatusRealtimeEvents } from "@lib/api/buyOrderStatusRealtimeEvent";
import { authorizeRealtimeRequest } from "@lib/realtime/rbac";

export const runtime = "nodejs";
export const preferredRegion = "icn1";

const REALTIME_BUYORDER_EVENTS_RETRY_COUNT = Math.max(
  Number.parseInt(process.env.REALTIME_BUYORDER_EVENTS_RETRY_COUNT || "", 10) || 2,
  1,
);
const REALTIME_BUYORDER_EVENTS_RETRY_DELAY_MS = Math.max(
  Number.parseInt(process.env.REALTIME_BUYORDER_EVENTS_RETRY_DELAY_MS || "", 10) || 200,
  50,
);
const REALTIME_BUYORDER_EVENTS_CACHE_TTL_MS = Math.max(
  Number.parseInt(process.env.REALTIME_BUYORDER_EVENTS_CACHE_TTL_MS || "", 10) || 900,
  100,
);
const REALTIME_BUYORDER_EVENTS_EMPTY_CACHE_TTL_MS = Math.max(
  Number.parseInt(process.env.REALTIME_BUYORDER_EVENTS_EMPTY_CACHE_TTL_MS || "", 10) || 1500,
  100,
);
const REALTIME_BUYORDER_EVENTS_CACHE_MAX_ENTRIES = Math.max(
  Number.parseInt(process.env.REALTIME_BUYORDER_EVENTS_CACHE_MAX_ENTRIES || "", 10) || 1000,
  50,
);
const REALTIME_BUYORDER_EVENTS_ERROR_LOG_THROTTLE_MS = Math.max(
  Number.parseInt(process.env.REALTIME_BUYORDER_EVENTS_ERROR_LOG_THROTTLE_MS || "", 10) || 60000,
  1000,
);

let lastRealtimeBuyorderEventsErrorLoggedAt = 0;
const globalRealtimeBuyorderEventsRouteState = globalThis as typeof globalThis & {
  __realtimeBuyorderEventsRouteCache?: Map<string, { expiresAt: number; payload: any }>;
  __realtimeBuyorderEventsRouteInFlight?: Map<string, Promise<any>>;
};

const getRouteCache = () => {
  if (!globalRealtimeBuyorderEventsRouteState.__realtimeBuyorderEventsRouteCache) {
    globalRealtimeBuyorderEventsRouteState.__realtimeBuyorderEventsRouteCache = new Map();
  }
  return globalRealtimeBuyorderEventsRouteState.__realtimeBuyorderEventsRouteCache;
};

const getInFlightMap = () => {
  if (!globalRealtimeBuyorderEventsRouteState.__realtimeBuyorderEventsRouteInFlight) {
    globalRealtimeBuyorderEventsRouteState.__realtimeBuyorderEventsRouteInFlight = new Map();
  }
  return globalRealtimeBuyorderEventsRouteState.__realtimeBuyorderEventsRouteInFlight;
};

const pruneRouteCache = (cache: Map<string, { expiresAt: number; payload: any }>) => {
  const now = Date.now();
  for (const [key, value] of cache.entries()) {
    if (value.expiresAt <= now) {
      cache.delete(key);
    }
  }

  while (cache.size > REALTIME_BUYORDER_EVENTS_CACHE_MAX_ENTRIES) {
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

const withTransientMongoRetry = async <T>(work: () => Promise<T>): Promise<T> => {
  let attempt = 0;
  let lastError: unknown;

  while (attempt < REALTIME_BUYORDER_EVENTS_RETRY_COUNT) {
    attempt += 1;
    try {
      return await work();
    } catch (error) {
      lastError = error;
      if (!isTransientMongoError(error) || attempt >= REALTIME_BUYORDER_EVENTS_RETRY_COUNT) {
        throw error;
      }
      await sleep(REALTIME_BUYORDER_EVENTS_RETRY_DELAY_MS * attempt);
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Unknown buyorder realtime events failure");
};

const logRealtimeBuyorderEventsErrorThrottled = (message: string, error: unknown) => {
  const now = Date.now();
  if (now - lastRealtimeBuyorderEventsErrorLoggedAt < REALTIME_BUYORDER_EVENTS_ERROR_LOG_THROTTLE_MS) {
    return;
  }
  lastRealtimeBuyorderEventsErrorLoggedAt = now;
  console.error(message, error);
};

const buildCacheKey = ({
  role,
  isPublic,
  since,
  limit,
}: {
  role: "admin" | "viewer";
  isPublic: boolean;
  since: string | null;
  limit: number;
}) => {
  return [
    isPublic ? "public" : "signed",
    role,
    since || "__latest__",
    String(Math.min(Math.max(Number(limit) || 50, 1), 300)),
  ].join("|");
};

const getResponseHeaders = (isPublic: boolean) => {
  if (!isPublic) {
    return {
      "Cache-Control": "private, no-store",
    };
  }

  return {
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

  const since = request.nextUrl.searchParams.get("since");
  const limitParam = request.nextUrl.searchParams.get("limit");
  const limit = Number(limitParam || 50);
  const responseHeaders = getResponseHeaders(isPublic);
  const cacheKey = buildCacheKey({
    role,
    isPublic,
    since,
    limit,
  });
  const routeCache = getRouteCache();
  const inFlight = getInFlightMap();
  pruneRouteCache(routeCache);
  const now = Date.now();
  const cachedEntry = routeCache.get(cacheKey);

  if (cachedEntry && cachedEntry.expiresAt > now) {
    return NextResponse.json(
      {
        ...cachedEntry.payload,
        cached: true,
      },
      { headers: responseHeaders },
    );
  }

  if (since && !ObjectId.isValid(since)) {
    return NextResponse.json(
      {
        status: "error",
        message: "Invalid cursor",
      },
      { status: 400 },
    );
  }

  try {
    const existingJob = inFlight.get(cacheKey);
    const job = existingJob || withTransientMongoRetry(async () => {
      const result = await getBuyOrderStatusRealtimeEvents({
        sinceCursor: since,
        limit,
      });

      return {
        status: "success" as const,
        role,
        events: result.events,
        nextCursor: result.nextCursor,
      };
    });

    if (!existingJob) {
      inFlight.set(cacheKey, job);
    }

    const payload = await job;
    routeCache.set(cacheKey, {
      payload,
      expiresAt: Date.now()
        + (Array.isArray(payload.events) && payload.events.length > 0
          ? REALTIME_BUYORDER_EVENTS_CACHE_TTL_MS
          : REALTIME_BUYORDER_EVENTS_EMPTY_CACHE_TTL_MS),
    });

    return NextResponse.json(payload, { headers: responseHeaders });
  } catch (error) {
    logRealtimeBuyorderEventsErrorThrottled("Failed to read buyorder realtime events:", error);

    if (cachedEntry && isTransientMongoError(error)) {
      return NextResponse.json(
        {
          ...cachedEntry.payload,
          cached: true,
          stale: true,
        },
        { headers: responseHeaders },
      );
    }

    if (isTransientMongoError(error)) {
      return NextResponse.json(
        {
          status: "success",
          role,
          events: [],
          nextCursor: since || null,
          degraded: true,
        },
        { headers: responseHeaders },
      );
    }

    return NextResponse.json(
      {
        status: "error",
        message: "Failed to read buyorder realtime events",
      },
      { status: 500, headers: responseHeaders },
    );
  } finally {
    inFlight.delete(cacheKey);
  }
}
