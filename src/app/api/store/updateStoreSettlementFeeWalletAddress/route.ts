import { NextResponse, type NextRequest } from "next/server";

import {
	updateStoreSettlementFeeWalletAddress,
} from '@lib/api/store';


export async function POST(request: NextRequest) {

  const body = await request.json();

  const {
    storecode,
    settlementFeeWalletAddress,
  } = body;



  console.log("storecode", storecode);
  console.log("settlementFeeWalletAddress", settlementFeeWalletAddress);




  const result = await updateStoreSettlementFeeWalletAddress({
    storecode,
    settlementFeeWalletAddress,
  });

 
  return NextResponse.json({

    result,
    
  });
  
}
