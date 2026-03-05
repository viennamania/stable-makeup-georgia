import { NextResponse, type NextRequest } from "next/server";

import {
	updateStoreWithdrawalBankInfo,
} from '@lib/api/store';

import { verifyStoreSettingsAdminGuard } from "@/lib/server/store-settings-admin-guard";


export async function POST(request: NextRequest) {

  const body = await request.json();

  const guard = await verifyStoreSettingsAdminGuard({
    request,
    route: "/api/store/setStoreWithdrawalBankInfo",
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

    withdrawalBankName,
    withdrawalAccountNumber,
    withdrawalAccountHolder,
    withdrawalBankCode,
  } = body;





  const result = await updateStoreWithdrawalBankInfo({
    walletAddress,
    storecode,
    withdrawalBankName,
    withdrawalAccountNumber,
    withdrawalAccountHolder,
    withdrawalBankCode,
  });

 
  return NextResponse.json({

    result,
    
  });
  
}
