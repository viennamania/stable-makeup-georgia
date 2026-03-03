import { NextResponse, type NextRequest } from "next/server";

import {
	updateStoreSettlementFeePercent,
} from '@lib/api/store';

import { verifyStoreSettingsAdminGuard } from "@/lib/server/store-settings-admin-guard";


export async function POST(request: NextRequest) {

  const body = await request.json();

  const guard = await verifyStoreSettingsAdminGuard({
    request,
    route: "/api/store/updateStoreSettlementFeePercent",
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
    settlementFeePercent,
  } = body;







  const result = await updateStoreSettlementFeePercent({
    storecode,
    settlementFeePercent,
  });

 
  return NextResponse.json({

    result,
    
  });
  
}
