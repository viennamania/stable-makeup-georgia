import { NextResponse, type NextRequest } from "next/server";

import {
	getOneBuyOrderByTradeId,
} from '@lib/api/order';



export async function POST(request: NextRequest) {

  const body = await request.json();
  
  if (!body.tradeId) return NextResponse.json({ error: 'tradeId is required' }, { status: 400 });


  const result = await getOneBuyOrderByTradeId({
    tradeId: body.tradeId,
  });
 
  return NextResponse.json({
    result,
  });
  
  
}
