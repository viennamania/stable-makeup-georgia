import { NextResponse, type NextRequest } from "next/server";

import {
	updateMaxPaymentAmountKRW,
} from '@lib/api/store';


export async function POST(request: NextRequest) {

  const body = await request.json();

  const {
    walletAddress,
    storecode,
    maxPaymentAmountKRW,
  } = body;







  const result = await updateMaxPaymentAmountKRW({
    walletAddress,
    storecode,
    maxPaymentAmountKRW,
  });

 
  return NextResponse.json({

    result,
    
  });
  
}
