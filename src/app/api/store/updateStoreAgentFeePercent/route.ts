import { NextResponse, type NextRequest } from "next/server";

import {
	updateStoreAgentFeePercent,
} from '@lib/api/store';

import { verifyStoreSettingsAdminGuard } from "@/lib/server/store-settings-admin-guard";


export async function POST(request: NextRequest) {

  const body = await request.json();

  const guard = await verifyStoreSettingsAdminGuard({
    request,
    route: "/api/store/updateStoreAgentFeePercent",
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
    agentFeePercent,
  } = body;







  const result = await updateStoreAgentFeePercent({
    storecode,
    agentFeePercent,
  });

 
  return NextResponse.json({

    result,
    
  });
  
}
