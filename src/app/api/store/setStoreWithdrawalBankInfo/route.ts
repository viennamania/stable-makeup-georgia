import { NextResponse, type NextRequest } from "next/server";

import {
	updateStoreWithdrawalBankInfo,
} from '@lib/api/store';


export async function POST(request: NextRequest) {

  const body = await request.json();

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
