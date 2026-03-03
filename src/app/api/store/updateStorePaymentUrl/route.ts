import { NextResponse, type NextRequest } from "next/server";

import {
	updateStorePaymentUrl,
} from '@lib/api/store';

import { verifyStoreSettingsAdminGuard } from "@/lib/server/store-settings-admin-guard";


export async function POST(request: NextRequest) {

  const body = await request.json();

  const guard = await verifyStoreSettingsAdminGuard({
    request,
    route: "/api/store/updateStorePaymentUrl",
    body,
  });

  if (!guard.ok) {
    return NextResponse.json({
      result: null,
      error: guard.error,
    }, { status: guard.status });
  }


  const {
    walletAddress,
    storecode,
    paymentUrl,
  } = body;

  console.log("storecode:", storecode);
  console.log("paymentUrl:", paymentUrl);

  const result = await updateStorePaymentUrl({
    storecode,
    paymentUrl,
  });

  //console.log("result:", result);
 
  return NextResponse.json({

    result,
    
  });
  
}
