import { NextResponse, type NextRequest } from "next/server";

import {
	buyOrderConfirmPaymentCompleted,
} from '@lib/api/order';




export async function POST(request: NextRequest) {

  const body = await request.json();

  const {
    queueId,
    transactionHash,
  } = body;




  const result = await buyOrderConfirmPaymentCompleted({
    queueId: queueId,
    transactionHash: transactionHash,
  });
  



  // call thirdweb api for transaction by hash
  







    
  return NextResponse.json({
    result,
  });

}
