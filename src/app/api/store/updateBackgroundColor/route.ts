import { NextResponse, type NextRequest } from "next/server";

import {
	updateBackgroundColor,
} from '@lib/api/store';

import { verifyStoreSettingsAdminGuard } from "@/lib/server/store-settings-admin-guard";


export async function POST(request: NextRequest) {

  const body = await request.json();

  const guard = await verifyStoreSettingsAdminGuard({
    request,
    route: "/api/store/updateBackgroundColor",
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
    backgroundColor,
  } = body;







  const result = await updateBackgroundColor({
    walletAddress,
    storecode,
    backgroundColor,
  });

 
  return NextResponse.json({

    result,
    
  });
  
}
