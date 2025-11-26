import { NextResponse, type NextRequest } from "next/server";

import {
	getAllBuyOrdersBySellerAccountNumber
} from '@lib/api/order';


/*
{
  accountNumber: '3560545924843',
  fromDate: '2025-10-25',
  toDate: '2025-11-24',
  limit: 10,
  page: 1,
  privateSale: false,
  sortBy: 'createdAt',
  sortOrder: 'desc'
}
*/


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

    privateSale,

    searchBuyer,
    searchDepositName,

    searchStoreBankAccountNumber,

    fromDate,
    toDate,

    manualConfirmPayment,

    accountNumber,

  } = body;



  const result = await getAllBuyOrdersBySellerAccountNumber({
    limit: limit || 10,
    page: page || 1,
    fromDate,
    toDate,
    privateSale,
    accountNumber,

    searchBuyer,
    searchDepositName,
  });


 
  return NextResponse.json({

    result,
    
  });
  
}
