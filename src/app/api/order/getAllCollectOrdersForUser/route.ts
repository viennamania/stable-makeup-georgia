import { NextResponse, type NextRequest } from "next/server";

import {
	getCollectOrdersForUser,
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

    fromDate,
    toDate,

    searchWithdrawDepositName,
  } = body;

  const guard = await verifyCenterStoreAdminGuard({
    request,
    route: "/api/order/getAllCollectOrdersForUser",
    body,
    storecodeRaw: storecode,
    requesterWalletAddressRaw: walletAddress,
  });

  if (!guard.ok) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }



  const result = await getCollectOrdersForUser({
    storecode,
    limit: limit || 10,
    page: page || 1,
    walletAddress,
    searchMyOrders,

    fromDate,
    toDate,

    searchWithdrawDepositName,
  });

 
  return NextResponse.json({

    result,
    
  });
  
}
