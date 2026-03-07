import { NextResponse, type NextRequest } from "next/server";

import {
	getPaymentRequestedCount,
} from '@lib/api/order';
import { verifyCenterStoreAdminGuard } from "@/lib/server/center-store-admin-guard";

const globalPaymentRequestedRouteCache = globalThis as typeof globalThis & {
  __paymentRequestedRouteCache?: Map<string, { expiresAt: number; value: any }>;
};

const PAYMENT_REQUESTED_ROUTE_CACHE_TTL_MS = Number.parseInt(
  process.env.PAYMENT_REQUESTED_ROUTE_CACHE_TTL_MS || "",
  10,
) > 0
  ? Number.parseInt(process.env.PAYMENT_REQUESTED_ROUTE_CACHE_TTL_MS || "", 10)
  : 5000;
const PAYMENT_REQUESTED_ROUTE_TIMEOUT_MS = Number.parseInt(
  process.env.PAYMENT_REQUESTED_ROUTE_TIMEOUT_MS || "",
  10,
) > 0
  ? Number.parseInt(process.env.PAYMENT_REQUESTED_ROUTE_TIMEOUT_MS || "", 10)
  : 12000;
const PAYMENT_REQUESTED_DEFAULT_LIMIT = Number.parseInt(
  process.env.PAYMENT_REQUESTED_DEFAULT_LIMIT || "",
  10,
) > 0
  ? Number.parseInt(process.env.PAYMENT_REQUESTED_DEFAULT_LIMIT || "", 10)
  : 100;
const PAYMENT_REQUESTED_MAX_LIMIT = Number.parseInt(
  process.env.PAYMENT_REQUESTED_MAX_LIMIT || "",
  10,
) > 0
  ? Number.parseInt(process.env.PAYMENT_REQUESTED_MAX_LIMIT || "", 10)
  : 300;

const getRouteCache = () => {
  if (!globalPaymentRequestedRouteCache.__paymentRequestedRouteCache) {
    globalPaymentRequestedRouteCache.__paymentRequestedRouteCache = new Map();
  }
  return globalPaymentRequestedRouteCache.__paymentRequestedRouteCache;
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


export async function POST(request: NextRequest) {
  let body: Record<string, unknown> = {};
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    body = {};
  }

  const { storecode, walletAddress } = body;
  const safeStorecode = normalizeString(storecode);
  const safeWalletAddress = normalizeString(walletAddress).toLowerCase();
  const requestedOrdersLimit = parsePositiveInt(
    body.ordersLimit,
    PAYMENT_REQUESTED_DEFAULT_LIMIT,
  );
  const ordersLimit = Math.min(
    Math.max(1, requestedOrdersLimit),
    Math.max(1, PAYMENT_REQUESTED_MAX_LIMIT),
  );

  const guard = await verifyCenterStoreAdminGuard({
    request,
    route: "/api/order/getCountOfPaymentRequested",
    body,
    storecodeRaw: safeStorecode,
    requesterWalletAddressRaw: safeWalletAddress,
  });

  if (!guard.ok) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }


  const cacheKey = `${safeStorecode || "__all__"}:${safeWalletAddress || "__anonymous__"}:${ordersLimit}`;
  const routeCache = getRouteCache();
  const cachedEntry = routeCache.get(cacheKey);
  if (cachedEntry && cachedEntry.expiresAt > Date.now()) {
    return NextResponse.json({
      result: cachedEntry.value,
      cached: true,
    });
  }

  try {
    const result = await withTimeout(
      getPaymentRequestedCount(safeStorecode, safeWalletAddress, ordersLimit),
      PAYMENT_REQUESTED_ROUTE_TIMEOUT_MS,
      "getCountOfPaymentRequested timeout",
    );
    routeCache.set(cacheKey, {
      value: result,
      expiresAt: Date.now() + PAYMENT_REQUESTED_ROUTE_CACHE_TTL_MS,
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
          orders: [],
          ordersLimit,
        },
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch payment requested count",
      },
      { status: 504 },
    );
  }
  
}
