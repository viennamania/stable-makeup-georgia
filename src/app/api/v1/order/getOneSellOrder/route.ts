import { NextResponse, type NextRequest } from "next/server";

import {
	getOneSellOrder,
} from '@lib/api/order';



export async function GET(request: NextRequest) {


  const orderId = request.nextUrl.searchParams.get('orderId');

  if (!orderId) {
    return NextResponse.json({
      error: "orderId is required",
    });
  }

  const result = await getOneSellOrder({
    orderId: orderId,
  });

 
  return NextResponse.json({

    result,
    
  });
  
}
