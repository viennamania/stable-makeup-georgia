import { NextResponse, type NextRequest } from "next/server";

import {
  buyOrderConfirmPaymentEnqueueTransaction,
} from '@lib/api/order';




export async function POST(request: NextRequest) {

  console.log("buyOrderConfirmPaymentEnqueueTransaction==================");

  const body = await request.json();

  const {
    orderId,
    queueId,
  } = body;

  
  try {


    const result = await buyOrderConfirmPaymentEnqueueTransaction({
      orderId: orderId,
      queueId: queueId,
    });
  
    
    return NextResponse.json({
  
      result,
      
    });



  } catch (error) {
      
    console.log(" error=====>" + error);

  }


 
  return NextResponse.json({

    result: null,
    
  });
  
}
