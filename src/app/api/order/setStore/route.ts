import { NextResponse, type NextRequest } from "next/server";

import {
	insertStore,
} from '@lib/api/order';
import { verifyStoreSettingsAdminGuard } from "@/lib/server/store-settings-admin-guard";


export async function POST(request: NextRequest) {

  const body = await request.json();

  const guard = await verifyStoreSettingsAdminGuard({
    request,
    route: "/api/order/setStore",
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
