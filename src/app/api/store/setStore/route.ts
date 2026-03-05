import { NextResponse, type NextRequest } from "next/server";

import {
	insertStore,
} from '@lib/api/store';
import { verifyStoreSettingsAdminGuard } from "@/lib/server/store-settings-admin-guard";


export async function POST(request: NextRequest) {

  const body = await request.json();

  const guard = await verifyStoreSettingsAdminGuard({
    request,
    route: "/api/store/setStore",
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
    agentcode,
    storecode,
    storeName,
    storeType,
    storeUrl,
    storeDescription,
    storeLogo,
    storeBanner,
  } = body;



  console.log("body", body);




  const result = await insertStore({
    walletAddress,
    agentcode,
    storecode,
    storeName,
    storeType,
    storeUrl,
    storeDescription,
    storeLogo,
    storeBanner,
  });

 
  return NextResponse.json({

    result,
    
  });
  
}
