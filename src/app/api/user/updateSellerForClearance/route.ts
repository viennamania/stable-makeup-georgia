import { NextResponse, type NextRequest } from "next/server";

import {
	updateSellerStatusForClearance,
} from '@lib/api/user';



export async function POST(request: NextRequest) {

  const body = await request.json();

  const { storecode, walletAddress, sellerStatus, bankName, accountNumber, accountHolder } = body;

  //console.log("walletAddress", walletAddress);
  //console.log("sellerStatus", sellerStatus);

  const result = await updateSellerStatusForClearance({
    storecode: storecode,
    walletAddress: walletAddress,
    sellerStatus: sellerStatus,
    bankName: bankName,
    accountNumber: accountNumber,
    accountHolder: accountHolder,
  });


 
  return NextResponse.json({

    result,
    
  });
  
}
