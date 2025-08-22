import { NextResponse, type NextRequest } from "next/server";

import {
	getCollectOrdersForSeller,
} from '@lib/api/order';



export async function POST(request: NextRequest) {

  const body = await request.json();

  const {
    storecode,
    limit,
    page,
    walletAddress,
    searchMyOrders,

    fromDate,
    toDate,
  } = body;



  const result = await getCollectOrdersForSeller({
    storecode,
    limit: limit || 10,
    page: page || 1,
    walletAddress,
    searchMyOrders,

    fromDate,
    toDate,
  });

  ///console.log('getCollectOrdersForSeller result: ' + JSON.stringify(result));

  return NextResponse.json({

    result,
    
  });
  
}
