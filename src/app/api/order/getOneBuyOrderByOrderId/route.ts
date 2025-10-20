import { NextResponse, type NextRequest } from "next/server";

import {
	getOneBuyOrderByOrderId,
} from '@lib/api/order';



export async function POST(request: NextRequest) {

  const body = await request.json();

  if (!body.orderId) return NextResponse.json({ error: 'orderId is required' }, { status: 400 });


  
  const result = await getOneBuyOrderByOrderId(body.orderId);
 
  return NextResponse.json({
    result,
  });
  
  
}
