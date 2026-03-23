import { NextResponse, type NextRequest } from "next/server";

import {
	getCollectOrdersForSeller,
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
    buyerBankAccountNumber,
    sellerBankAccountNumber,
    skipSummary,
    clearanceOnly,
  } = body;

  const guard = await verifyCenterStoreAdminGuard({
    request,
    route: "/api/order/getAllCollectOrdersForSeller",
    body,
    storecodeRaw: storecode,
    requesterWalletAddressRaw: walletAddress,
  });

  if (!guard.ok) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }



  const result = await getCollectOrdersForSeller({
    storecode,
    limit: limit || 10,
    page: page || 1,
    walletAddress,
    searchMyOrders,

    fromDate,
    toDate,
    buyerBankAccountNumber,
    sellerBankAccountNumber,
    skipSummary,
    clearanceOnly,
  });


  //console.log('totalByBuyerBankAccountNumber', result.totalByBuyerBankAccountNumber);

  return NextResponse.json({

    result,
    
  });
  
}
