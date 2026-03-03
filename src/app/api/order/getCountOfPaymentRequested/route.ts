import { NextResponse, type NextRequest } from "next/server";

import {
	getPaymentRequestedCount,
} from '@lib/api/order';
import { verifyCenterStoreAdminGuard } from "@/lib/server/center-store-admin-guard";



export async function POST(request: NextRequest) {

  const body = await request.json();

  const { storecode, walletAddress } = body;

  const guard = await verifyCenterStoreAdminGuard({
    request,
    route: "/api/order/getCountOfPaymentRequested",
    body,
    storecodeRaw: storecode,
    requesterWalletAddressRaw: walletAddress,
  });

  if (!guard.ok) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }


  const result = await getPaymentRequestedCount( storecode, walletAddress );

  //console.log("getCountOfPaymentRequested result: ", result);

 
  return NextResponse.json({

    result,

  });
  
}
