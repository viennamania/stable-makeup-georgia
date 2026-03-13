import { NextResponse, type NextRequest } from "next/server";

import {
  BUYORDER_BLOCKED_ABLY_CHANNEL,
  BUYORDER_BLOCKED_ABLY_EVENT_NAME,
} from "@lib/ably/constants";
import { getRealtimeBlockedBuyOrders } from "@lib/api/buyOrderStatusRealtimeEvent";
import {
  createPublicRealtimePreflightResponse,
  jsonWithPublicRealtimeCors,
} from "@lib/realtime/publicCors";
import { authorizeRealtimeRequest } from "@lib/realtime/rbac";

export const runtime = "nodejs";
export const preferredRegion = "icn1";

const globalBlockedBuyOrdersRouteState = globalThis as typeof globalThis & {
  __blockedBuyOrdersRouteCache?: Map<string, { expiresAt: number; value: any }>;
  __blockedBuyOrdersRouteInFlight?: Map<string, Promise<any>>;
};

const BLOCKED_BUY_ORDERS_ROUTE_CACHE_TTL_MS = Math.max(
  Number.parseInt(process.env.BLOCKED_BUY_ORDERS_ROUTE_CACHE_TTL_MS || "", 10) || 8000,
  1000,
);
const BLOCKED_BUY_ORDERS_ROUTE_CACHE_MAX_ENTRIES = Math.max(
  Number.parseInt(process.env.BLOCKED_BUY_ORDERS_ROUTE_CACHE_MAX_ENTRIES || "", 10) || 300,
  50,
);
const BLOCKED_BUY_ORDERS_ROUTE_DEFAULT_LIMIT = Math.max(
  Number.parseInt(process.env.BLOCKED_BUY_ORDERS_ROUTE_DEFAULT_LIMIT || "", 10) || 24,
  1,
);
const BLOCKED_BUY_ORDERS_ROUTE_MAX_LIMIT = Math.max(
  Number.parseInt(process.env.BLOCKED_BUY_ORDERS_ROUTE_MAX_LIMIT || "", 10) || 80,
  1,
);
const BLOCKED_BUY_ORDERS_ROUTE_DEFAULT_LOOKBACK_HOURS = Math.max(
  Number.parseInt(process.env.BLOCKED_BUY_ORDERS_ROUTE_DEFAULT_LOOKBACK_HOURS || "", 10) || 24 * 14,
  1,
);

const jsonResponse = ({
  body,
  isPublic,
  init,
}: {
  body: unknown;
  isPublic: boolean;
  init?: ResponseInit;
}) => {
  if (isPublic) {
    return jsonWithPublicRealtimeCors(body, init);
  }

  return NextResponse.json(body, init);
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

const getRouteCache = () => {
  if (!globalBlockedBuyOrdersRouteState.__blockedBuyOrdersRouteCache) {
    globalBlockedBuyOrdersRouteState.__blockedBuyOrdersRouteCache = new Map();
  }
  return globalBlockedBuyOrdersRouteState.__blockedBuyOrdersRouteCache;
};

const getInFlightMap = () => {
  if (!globalBlockedBuyOrdersRouteState.__blockedBuyOrdersRouteInFlight) {
    globalBlockedBuyOrdersRouteState.__blockedBuyOrdersRouteInFlight = new Map();
  }
  return globalBlockedBuyOrdersRouteState.__blockedBuyOrdersRouteInFlight;
};

const pruneRouteCache = (cache: Map<string, { expiresAt: number; value: any }>) => {
  const now = Date.now();
  for (const [key, value] of cache.entries()) {
    if (value.expiresAt <= now) {
      cache.delete(key);
    }
  }

  while (cache.size > BLOCKED_BUY_ORDERS_ROUTE_CACHE_MAX_ENTRIES) {
    const oldestKey = cache.keys().next().value;
    if (!oldestKey) {
      break;
    }
    cache.delete(oldestKey);
  }
};

const getPublicAblyConfig = (request: NextRequest) => ({
  stream: "buyorder-blocked",
  channel: BUYORDER_BLOCKED_ABLY_CHANNEL,
  eventName: BUYORDER_BLOCKED_ABLY_EVENT_NAME,
  authUrl: new URL(
    "/api/realtime/ably-token?public=1&stream=buyorder-blocked",
    request.nextUrl.origin,
  ).toString(),
  snapshotUrl: request.nextUrl.toString(),
});

export async function OPTIONS() {
  return createPublicRealtimePreflightResponse();
}

export async function GET(request: NextRequest) {
  const isPublic = request.nextUrl.searchParams.get("public") === "1";

  let role: "admin" | "viewer" = "viewer";

  if (!isPublic) {
    const authResult = authorizeRealtimeRequest(request, ["admin", "viewer"]);
    if (!authResult.ok) {
      return jsonResponse({
        isPublic,
        body: {
          status: "error",
          message: authResult.message,
        },
        init: { status: authResult.status },
      });
    }

    role = authResult.role;
  }

  const limit = Math.min(
    Math.max(
      1,
      parsePositiveInt(
        request.nextUrl.searchParams.get("limit"),
        BLOCKED_BUY_ORDERS_ROUTE_DEFAULT_LIMIT,
      ),
    ),
    BLOCKED_BUY_ORDERS_ROUTE_MAX_LIMIT,
  );
  const lookbackHours = Math.max(
    1,
    parsePositiveInt(
      request.nextUrl.searchParams.get("lookbackHours"),
      BLOCKED_BUY_ORDERS_ROUTE_DEFAULT_LOOKBACK_HOURS,
    ),
  );

  const cacheKey = JSON.stringify({
    limit,
    lookbackHours,
  });
  const routeCache = getRouteCache();
  pruneRouteCache(routeCache);

  const cachedEntry = routeCache.get(cacheKey);
  const ably = getPublicAblyConfig(request);
  if (cachedEntry && cachedEntry.expiresAt > Date.now()) {
    return jsonResponse({
      isPublic,
      body: {
        status: "success",
        role,
        ably,
        totalCount: cachedEntry.value.totalCount || 0,
        criticalCount: cachedEntry.value.criticalCount || 0,
        warningCount: cachedEntry.value.warningCount || 0,
        infoCount: cachedEntry.value.infoCount || 0,
        orders: cachedEntry.value.orders || [],
        updatedAt: cachedEntry.value.updatedAt || new Date().toISOString(),
        cached: true,
      },
    });
  }

  const inFlight = getInFlightMap();
  const pending = inFlight.get(cacheKey);
  const job = pending
    ? pending
    : getRealtimeBlockedBuyOrders({
        limit,
        lookbackHours,
      }).finally(() => {
        inFlight.delete(cacheKey);
      });

  if (!pending) {
    inFlight.set(cacheKey, job);
  }

  try {
    const result = await job;
    routeCache.set(cacheKey, {
      value: result,
      expiresAt: Date.now() + BLOCKED_BUY_ORDERS_ROUTE_CACHE_TTL_MS,
    });

    return jsonResponse({
      isPublic,
      body: {
        status: "success",
        role,
        ably,
        totalCount: result.totalCount,
        criticalCount: result.criticalCount,
        warningCount: result.warningCount,
        infoCount: result.infoCount,
        orders: result.orders,
        updatedAt: result.updatedAt,
        cached: false,
      },
    });
  } catch (error) {
    console.error("Failed to read realtime blocked buy orders:", error);

    if (cachedEntry?.value) {
      return jsonResponse({
        isPublic,
        body: {
          status: "success",
          role,
          ably,
          totalCount: cachedEntry.value.totalCount || 0,
          criticalCount: cachedEntry.value.criticalCount || 0,
          warningCount: cachedEntry.value.warningCount || 0,
          infoCount: cachedEntry.value.infoCount || 0,
          orders: cachedEntry.value.orders || [],
          updatedAt: cachedEntry.value.updatedAt || new Date().toISOString(),
          cached: true,
          stale: true,
        },
      });
    }

    return jsonResponse({
      isPublic,
      body: {
        status: "error",
        message: "Failed to read realtime blocked buy orders",
      },
      init: { status: 500 },
    });
  }
}
