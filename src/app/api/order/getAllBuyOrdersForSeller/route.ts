import { NextResponse, type NextRequest } from "next/server";

import {
	getBuyOrdersForSeller,
} from '@lib/api/order';



export async function POST(request: NextRequest) {

  const body = await request.json();

  const {
    storecode,
    limit,
    page,
    walletAddress,
    searchMyOrders,
    searchOrderStatusCancelled,
    searchOrderStatusCompleted,
    fromDate,
    toDate,
  } = body;



  const result = await getBuyOrdersForSeller({
    storecode,
    limit: limit || 10,
    page: page || 1,
    walletAddress,
    searchMyOrders,
    searchOrderStatusCancelled,
    searchOrderStatusCompleted,
    fromDate,
    toDate,
  });



  ///console.log('getBuyOrdersForSeller result: ' + JSON.stringify(result));

  return NextResponse.json({

    result,
    
  });
  
}
