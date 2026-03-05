import { NextResponse, type NextRequest } from "next/server";

import {
	updateStoreEscrowAmountUSDT,
} from '@lib/api/store';

import { verifyStoreSettingsAdminGuard } from "@/lib/server/store-settings-admin-guard";


export async function POST(request: NextRequest) {

  const body = await request.json();

  const guard = await verifyStoreSettingsAdminGuard({
    request,
    route: "/api/store/updateStoreEscrowAmountUSDT",
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
    escrowAmountUSDT,
  } = body;







  const result = await updateStoreEscrowAmountUSDT({
    storecode,
    escrowAmountUSDT,
  });

 
  return NextResponse.json({

    result,
    
  });
  
}
