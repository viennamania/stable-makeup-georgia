import { NextResponse, type NextRequest } from "next/server";

import {
	updateStoreEscrowAmountUSDT,
} from '@lib/api/store';


export async function POST(request: NextRequest) {

  const body = await request.json();

  const {
    storecode,
    escrowAmountUSDT,
  } = body;







  const result = await updateStoreEscrowAmountUSDT({
    storecode,
    escrowAmountUSDT,
  });

 
  return NextResponse.json({

    result,
    
  });
  
}
