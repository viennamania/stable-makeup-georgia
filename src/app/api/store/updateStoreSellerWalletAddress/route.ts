import { NextResponse, type NextRequest } from "next/server";

import {
	updateStoreSellerWalletAddress,
} from '@lib/api/store';

import { verifyStoreSettingsAdminGuard } from "@/lib/server/store-settings-admin-guard";


export async function POST(request: NextRequest) {

  const body = await request.json();

  const guard = await verifyStoreSettingsAdminGuard({
    request,
    route: "/api/store/updateStoreSellerWalletAddress",
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
    sellerWalletAddress,
  } = body;







  const result = await updateStoreSellerWalletAddress({
    storecode,
    sellerWalletAddress,
  });

 
  return NextResponse.json({

    result,
    
  });
  
}
