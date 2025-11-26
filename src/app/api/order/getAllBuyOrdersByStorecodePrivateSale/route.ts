import { NextResponse, type NextRequest } from "next/server";

import {
	getAllBuyOrdersByStorecodePrivateSale
} from '@lib/api/order';



export async function POST(request: NextRequest) {

  const body = await request.json();

 const {
    agentcode,
    storecode,
    limit,
    page,
    walletAddress,
    searchMyOrders,
    searchOrderStatusCancelled,
    searchOrderStatusCompleted,

    searchStoreName,

    //privateSale,

    searchBuyer,
    searchDepositName,

    searchStoreBankAccountNumber,

    fromDate,
    toDate,

    manualConfirmPayment,

    accountNumber,

  } = body;



  const result = await getAllBuyOrdersByStorecodePrivateSale({
    limit: limit || 10,
    page: page || 1,
    fromDate,
    toDate,
    //privateSale,
    storecode,

    searchBuyer,
    searchDepositName,
  });


 
  return NextResponse.json({

    result,
    
  });
  
}
