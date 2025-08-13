import { NextResponse, type NextRequest } from "next/server";

import {
    getTransferByWalletAddress,
} from '@lib/api/transfer';

export async function POST(request: NextRequest) {

  const body = await request.json();

  const { walletAddress } = body;

  console.log("walletAddress", walletAddress);


  const result = await getTransferByWalletAddress({
    walletAddress: walletAddress,
  });

  //console.log("result", result);



  return NextResponse.json({

    result,
    
  });
  
}
