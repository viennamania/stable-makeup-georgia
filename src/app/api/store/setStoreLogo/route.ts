import { NextResponse, type NextRequest } from "next/server";

import {
	updateStoreLogo,
} from '@lib/api/store';
import { verifyStoreSettingsAdminGuard } from "@/lib/server/store-settings-admin-guard";


export async function POST(request: NextRequest) {

  const body = await request.json();

  const guard = await verifyStoreSettingsAdminGuard({
    request,
    route: "/api/store/setStoreLogo",
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
