import { NextResponse, type NextRequest } from "next/server";

import {
	getEscrowBalanceByStorecode ,
} from '@lib/api/order';
import { verifyCenterStoreAdminGuard } from "@/lib/server/center-store-admin-guard";


export async function POST(request: NextRequest) {

  const body = await request.json();

  const {
    storecode,
    walletAddress,
  } = body;

  const guard = await verifyCenterStoreAdminGuard({
    request,
    route: "/api/store/getEscrowBalance",
    body,
    storecodeRaw: storecode,
    requesterWalletAddressRaw: walletAddress,
  });

  if (!guard.ok) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }


  const result = await 	getEscrowBalanceByStorecode({
    storecode,
  });


 
  return NextResponse.json({

    result,
    
  });
  
}
