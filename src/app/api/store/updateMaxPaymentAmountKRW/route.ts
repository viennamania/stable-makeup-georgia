import { NextResponse, type NextRequest } from "next/server";

import {
	updateMaxPaymentAmountKRW,
} from '@lib/api/store';

import { verifyStoreSettingsAdminGuard } from "@/lib/server/store-settings-admin-guard";


export async function POST(request: NextRequest) {

  const body = await request.json();

  const guard = await verifyStoreSettingsAdminGuard({
    request,
    route: "/api/store/updateMaxPaymentAmountKRW",
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
    maxPaymentAmountKRW,
  } = body;







  const result = await updateMaxPaymentAmountKRW({
    walletAddress,
    storecode,
    maxPaymentAmountKRW,
  });

 
  return NextResponse.json({

    result,
    
  });
  
}
