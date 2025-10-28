import { NextResponse, type NextRequest } from "next/server";

import {
	buyOrderConfirmPaymentReverted,
} from '@lib/api/order';




export async function POST(request: NextRequest) {

  const body = await request.json();

  const {
    tradeId,
  } = body;




  const result = await buyOrderConfirmPaymentReverted({
    tradeId: tradeId,
  });
  
    
  return NextResponse.json({
    result,
  });

}
