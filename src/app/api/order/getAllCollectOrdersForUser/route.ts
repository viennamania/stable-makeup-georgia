import { NextResponse, type NextRequest } from "next/server";

import {
	getCollectOrdersForUser,
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

    searchWithdrawDepositName,
  } = body;



  const result = await getCollectOrdersForUser({
    storecode,
    limit: limit || 10,
    page: page || 1,
    walletAddress,
    searchMyOrders,

    fromDate,
    toDate,

    searchWithdrawDepositName,
  });

 
  return NextResponse.json({

    result,
    
  });
  
}
