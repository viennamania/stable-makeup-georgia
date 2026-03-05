import { NextResponse, type NextRequest } from "next/server";

import {
	updateStoreMemo
} from '@lib/api/store';
import { verifyStoreSettingsAdminGuard } from "@/lib/server/store-settings-admin-guard";


export async function POST(request: NextRequest) {

  const body = await request.json();

  const guard = await verifyStoreSettingsAdminGuard({
    request,
    route: "/api/store/setStoreMemo",
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
    storeMemo,
  } = body;







  const result = await updateStoreMemo({
    walletAddress,
    storecode,
    storeMemo,
  });

 
  return NextResponse.json({

    result,
    
  });
  
}
