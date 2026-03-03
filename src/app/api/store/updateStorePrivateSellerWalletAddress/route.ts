import { NextResponse, type NextRequest } from "next/server";

import {
	updateStorePrivateSellerWalletAddress,
} from '@lib/api/store';

import { verifyStoreSettingsAdminGuard } from "@/lib/server/store-settings-admin-guard";


export async function POST(request: NextRequest) {

  const body = await request.json();

  const guard = await verifyStoreSettingsAdminGuard({
    request,
    route: "/api/store/updateStorePrivateSellerWalletAddress",
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
    privateSellerWalletAddress,
  } = body;


  const result = await updateStorePrivateSellerWalletAddress({
    storecode,
    privateSellerWalletAddress,
  });

 
  return NextResponse.json({

    result,
    
  });
  
}
