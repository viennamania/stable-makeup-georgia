import { NextResponse, type NextRequest } from "next/server";

import {
	updateStorePaymentCallbackUrl,
} from '@lib/api/store';
import { verifyStoreSettingsAdminGuard } from "@/lib/server/store-settings-admin-guard";


export async function POST(request: NextRequest) {

  const body = await request.json();

  const guard = await verifyStoreSettingsAdminGuard({
    request,
    route: "/api/store/updateStorePaymentCallbackUrl",
    body,
    requireSigned: true,
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
    paymentCallbackUrl,
  } = body;

  console.log("storecode:", storecode);
  console.log("paymentCallbackUrl:", paymentCallbackUrl);

  const result = await updateStorePaymentCallbackUrl({
    storecode,
    paymentCallbackUrl,
  });

  ///console.log("result:", result);
 
  return NextResponse.json({

    result,
    
  });
  
}
