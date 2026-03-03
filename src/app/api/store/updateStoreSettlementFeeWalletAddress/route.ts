import { NextResponse, type NextRequest } from "next/server";

import {
	updateStoreSettlementFeeWalletAddress,
} from '@lib/api/store';

import { verifyStoreSettingsAdminGuard } from "@/lib/server/store-settings-admin-guard";


export async function POST(request: NextRequest) {

  const body = await request.json();

  const guard = await verifyStoreSettingsAdminGuard({
    request,
    route: "/api/store/updateStoreSettlementFeeWalletAddress",
    body,
  });

  if (!guard.ok) {
    return NextResponse.json({
      result: null,
      error: guard.error,
    }, { status: guard.status });
  }


  const {
    storecode,
    settlementFeeWalletAddress,
  } = body;



  console.log("storecode", storecode);
  console.log("settlementFeeWalletAddress", settlementFeeWalletAddress);




  const result = await updateStoreSettlementFeeWalletAddress({
    storecode,
    settlementFeeWalletAddress,
  });

 
  return NextResponse.json({

    result,
    
  });
  
}
