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
  } = body;

  const settlementFeePercent = Number(body?.settlementFeePercent);

  if (!Number.isFinite(settlementFeePercent)) {
    return NextResponse.json({
      result: null,
      error: "settlementFeePercent must be a valid number",
    }, { status: 400 });
  }

  if (settlementFeePercent < 0.01 || settlementFeePercent > 5.00) {
    return NextResponse.json({
      result: null,
      error: "settlementFeePercent must be between 0.01 and 5.00",
    }, { status: 400 });
  }

  const result = await updateStoreSettlementFeePercent({
    storecode,
    settlementFeePercent,
  });

 
  return NextResponse.json({

    result,
    
  });
  
}
