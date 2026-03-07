import { NextResponse, type NextRequest } from "next/server";

import {
	getEscrowBalanceByStorecode ,
} from '@lib/api/order';
import { verifyCenterStoreAdminGuard } from "@/lib/server/center-store-admin-guard";

const globalEscrowBalanceRouteCacheState = globalThis as typeof globalThis & {
  __escrowBalanceRouteCache?: Map<string, { expiresAt: number; value: any }>;
};

const ESCROW_BALANCE_ROUTE_CACHE_TTL_MS = Number.parseInt(
  process.env.ESCROW_BALANCE_ROUTE_CACHE_TTL_MS || "",
  10,
) > 0
  ? Number.parseInt(process.env.ESCROW_BALANCE_ROUTE_CACHE_TTL_MS || "", 10)
  : 5000;
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
  const cacheKey = safeStorecode;
  const cachedEntry = routeCache.get(cacheKey);
  if (cachedEntry && cachedEntry.expiresAt > Date.now()) {
    return NextResponse.json({
      result: cachedEntry.value,
      cached: true,
    });
  }

  try {
    const result = await withTimeout(
      getEscrowBalanceByStorecode({
        storecode: safeStorecode,
      }),
      ESCROW_BALANCE_ROUTE_TIMEOUT_MS,
      "getEscrowBalance timeout",
    );

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
      { status: 504 },
    );
  }
  
}
