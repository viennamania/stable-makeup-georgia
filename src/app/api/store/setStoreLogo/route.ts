import { NextResponse, type NextRequest } from "next/server";

import {
	updateStoreLogo,
} from '@lib/api/store';
import { verifyStoreBrandingMutationGuard } from "@/lib/server/store-branding-mutation-guard";


export async function POST(request: NextRequest) {

  const body = await request.json();

  const guard = await verifyStoreBrandingMutationGuard({
    request,
    route: "/api/store/setStoreLogo",
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
    storeLogo,
  } = body;







  const result = await updateStoreLogo({
    walletAddress,
    storecode,
    storeLogo,
  });

 
  return NextResponse.json({

    result,
    
  });
  
}
