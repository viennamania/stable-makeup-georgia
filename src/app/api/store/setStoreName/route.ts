import { NextResponse, type NextRequest } from "next/server";

import {
	updateStoreName,
} from '@lib/api/store';
import { verifyStoreBrandingMutationGuard } from "@/lib/server/store-branding-mutation-guard";


export async function POST(request: NextRequest) {

  const body = await request.json();

  const guard = await verifyStoreBrandingMutationGuard({
    request,
    route: "/api/store/setStoreName",
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
    storeName,
  } = body;







  const result = await updateStoreName({
    walletAddress,
    storecode,
    storeName,
  });

 
  return NextResponse.json({

    result,
    
  });
  
}
