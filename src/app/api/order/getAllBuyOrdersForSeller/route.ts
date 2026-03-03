import { NextResponse, type NextRequest } from "next/server";

import {
	getBuyOrdersForSeller,
} from '@lib/api/order';
import { verifyCenterStoreAdminGuard } from "@/lib/server/center-store-admin-guard";



export async function POST(request: NextRequest) {

  const body = await request.json();

  const {
    storecode,
    limit,
    page,
    walletAddress,
    searchMyOrders,
    searchOrderStatusCancelled,
    searchOrderStatusCompleted,
    fromDate,
    toDate,
  } = body;

  const guard = await verifyCenterStoreAdminGuard({
    request,
    route: "/api/order/getAllBuyOrdersForSeller",
    body,
    storecodeRaw: storecode,
    requesterWalletAddressRaw: walletAddress,
  });

  if (!guard.ok) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }



  const result = await getBuyOrdersForSeller({
    storecode,
    limit: limit || 10,
    page: page || 1,
    walletAddress,
    searchMyOrders,
    searchOrderStatusCancelled,
    searchOrderStatusCompleted,
    fromDate,
    toDate,
  });



  ///console.log('getBuyOrdersForSeller result: ' + JSON.stringify(result));

  return NextResponse.json({

    result,
    
  });
  
}
