import { NextResponse, type NextRequest } from "next/server";

import {
	updateStoreDescription,
} from '@lib/api/store';

import { verifyStoreSettingsAdminGuard } from "@/lib/server/store-settings-admin-guard";


export async function POST(request: NextRequest) {

  const body = await request.json();

  const guard = await verifyStoreSettingsAdminGuard({
    request,
    route: "/api/store/setStoreDescription",
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
    storeDescription,
  } = body;



  console.log("setStoreDescription storecode", storecode);
  console.log("setStoreDescription walletAddress", walletAddress);
  console.log("setStoreDescription storeDescription", storeDescription);




  const result = await updateStoreDescription({
    walletAddress,
    storecode,
    storeDescription,
  });

 
  return NextResponse.json({

    result,
    
  });
  
}
