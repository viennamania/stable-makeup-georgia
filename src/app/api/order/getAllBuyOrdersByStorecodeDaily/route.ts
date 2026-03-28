import { NextResponse, type NextRequest } from "next/server";

import {
	getBuyOrdersGroupByStorecodeDaily,
} from '@lib/api/order';
import { verifyCenterStoreAdminGuard } from "@/lib/server/center-store-admin-guard";



export async function POST(request: NextRequest) {

  const body = await request.json();

  const {
    storecode,
    walletAddress,
    fromDate,
    toDate,
    searchBuyer,
    searchDepositName,
    searchStoreBankAccountNumber,
  } = body;

  const guard = await verifyCenterStoreAdminGuard({
    request,
    route: "/api/order/getAllBuyOrdersByStorecodeDaily",
    body,
    storecodeRaw: storecode,
    requesterWalletAddressRaw: walletAddress,
  });

  if (!guard.ok) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }


  //console.log("getAllBuyOrders fromDate", fromDate);
  //console.log("getAllBuyOrders toDate", toDate);



  const result = await getBuyOrdersGroupByStorecodeDaily({
    storecode,
    fromDate,
    toDate,
    searchBuyer,
    searchDepositName,
    searchStoreBankAccountNumber,
  });

  //console.log("getAllBuyOrders result", result);



  return NextResponse.json({

    result,
    
  });
  
}
