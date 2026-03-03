import { NextResponse, type NextRequest } from "next/server";

import {
	updateStoreSettlementWalletAddress,
} from '@lib/api/store';

import { verifyStoreSettingsAdminGuard } from "@/lib/server/store-settings-admin-guard";


export async function POST(request: NextRequest) {

  const body = await request.json();

  const guard = await verifyStoreSettingsAdminGuard({
    request,
    route: "/api/store/updateStoreSettlementWalletAddress",
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
    storecode,
    settlementWalletAddress,
  } = body;







  const result = await updateStoreSettlementWalletAddress({
    storecode,
    settlementWalletAddress,
  });

 
  return NextResponse.json({

    result,
    
  });
  
}
