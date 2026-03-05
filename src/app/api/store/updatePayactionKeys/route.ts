import { NextResponse, type NextRequest } from "next/server";

import {
	updatePayactionKeys,
} from '@lib/api/store';

import { verifyStoreSettingsAdminGuard } from "@/lib/server/store-settings-admin-guard";


export async function POST(request: NextRequest) {

  const body = await request.json();

  const guard = await verifyStoreSettingsAdminGuard({
    request,
    route: "/api/store/updatePayactionKeys",
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
    payactionKey,
  } = body;







  const result = await updatePayactionKeys({
    walletAddress,
    storecode,
    payactionKey,
  });

 
  return NextResponse.json({

    result,
    
  });
  
}
