import { NextResponse, type NextRequest } from "next/server";

import {
	updateAgentcode,
} from '@lib/api/store';

import { verifyStoreSettingsAdminGuard } from "@/lib/server/store-settings-admin-guard";


export async function POST(request: NextRequest) {

  const body = await request.json();

  const guard = await verifyStoreSettingsAdminGuard({
    request,
    route: "/api/store/updateAgentcode",
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
    agentcode,
  } = body;







  const result = await updateAgentcode({
    walletAddress,
    storecode,
    agentcode,
  });

 
  return NextResponse.json({

    result,
    
  });
  
}
