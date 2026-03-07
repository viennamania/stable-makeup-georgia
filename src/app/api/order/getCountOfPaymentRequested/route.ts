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


export async function POST(request: NextRequest) {

  const body = await request.json();

  const { storecode, walletAddress } = body;
  const safeStorecode = normalizeString(storecode);
  const safeWalletAddress = normalizeString(walletAddress).toLowerCase();

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


  const cacheKey = `${safeStorecode || "__all__"}:${safeWalletAddress || "__anonymous__"}`;
  const routeCache = getRouteCache();
  const cached = routeCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return NextResponse.json({
      result: cached.value,
    });
  }

  const result = await getPaymentRequestedCount(safeStorecode, safeWalletAddress);
  routeCache.set(cacheKey, {
    value: result,
    expiresAt: Date.now() + PAYMENT_REQUESTED_ROUTE_CACHE_TTL_MS,
  });

  //console.log("getCountOfPaymentRequested result: ", result);

 
  return NextResponse.json({

    result,

  });
  
}
