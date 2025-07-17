import { NextResponse, type NextRequest } from "next/server";

import {
	updateStoreSettlementWalletAddress,
} from '@lib/api/store';


export async function POST(request: NextRequest) {

  const body = await request.json();

  const {
    storecode,
    settlementWalletAddress,
  } = body;







  const result = await updateStoreSettlementWalletAddress({
    storecode,
    settlementWalletAddress,
  });

 
  return NextResponse.json({

    result,
    
  });
  
}
