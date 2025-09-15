import { NextResponse, type NextRequest } from "next/server";

import {
	updateBuyer,
} from '@lib/api/user';



export async function POST(request: NextRequest) {

  const body = await request.json();

  /*
    storecode: userStorecode,
  walletAddress: userWalletAddress,
    depositBankName: bankName,
    depositBankAccountNumber: accountNumber,
    depositName: accountHolder,
  */

  const {
    storecode,
    walletAddress,
    depositBankName,
    depositBankAccountNumber,
    depositName,
  } = body;

  const buyer = {
    depositBankName,
    depositBankAccountNumber,
    depositName,
  }

  const result = await updateBuyer({
    storecode: storecode,
    walletAddress: walletAddress,
    buyer: buyer,
  });


 
  return NextResponse.json({

    result,
    
  });
  
}
