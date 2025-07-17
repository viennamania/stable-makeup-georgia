import { NextResponse, type NextRequest } from "next/server";

import {
	getAllTradesByAdmin,
} from '@lib/api/order';



export async function POST(request: NextRequest) {

  const body = await request.json();

  const {
    limit,
    page,
    
    //startDate,
    //endDate,

    agentcode,
    searchNickname,
    walletAddress,
    storecode = "",
    searchOrderStatusCompleted = true,
    searchBuyer = "",
    searchDepositName = "",
    searchStoreBankAccountNumber = "",
    privateSale = false, // false for normal trades

    fromDate = "",
    toDate = "",
  } = body;



  const result = await getAllTradesByAdmin({
    limit,
    page,
    
    //startDate,
    //endDate,

    agentcode,
    searchNickname,
    walletAddress,
    storecode,
    searchOrderStatusCompleted,
    searchBuyer,
    searchDepositName,
    searchStoreBankAccountNumber,
    privateSale,

    fromDate,
    toDate,
  });

 
  return NextResponse.json({

    result,
    
  });
  
}
