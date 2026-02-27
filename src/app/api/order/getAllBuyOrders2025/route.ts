import { NextResponse, type NextRequest } from "next/server";

import {
	getBuyOrders,
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

    privateSale,

    searchTradeId,
    searchBuyer,
    searchDepositName,

    searchStoreBankAccountNumber,
    searchBuyerBankAccountNumber,
    searchDepositCompleted,

    fromDate,
    toDate,

    manualConfirmPayment,

    userType,

  } = body;

  const isSearchDepositCompleted =
    searchDepositCompleted === true || searchDepositCompleted === "true";

  const normalizedFromDate = fromDate && fromDate !== "" ? fromDate : '2025-01-01';
  const normalizedToDate = toDate && toDate !== "" ? toDate : '2025-12-31';

  const result = await getBuyOrders({
    limit: limit || 100,
    page: page || 1,
    agentcode: agentcode || "",
    storecode: storecode || "",
    walletAddress:  walletAddress || "",
    searchMyOrders:  searchMyOrders || false,
    searchOrderStatusCancelled,
    searchOrderStatusCompleted,

    searchStoreName: searchStoreName || "",

    privateSale: privateSale || false,

    searchTradeId: searchTradeId || "",
    searchBuyer: searchBuyer || "",
    searchDepositName: searchDepositName || "",

    searchStoreBankAccountNumber: searchStoreBankAccountNumber || "",

    searchBuyerBankAccountNumber: searchBuyerBankAccountNumber || "",
    searchDepositCompleted: isSearchDepositCompleted,


    fromDate: normalizedFromDate,

    toDate: normalizedToDate,

    manualConfirmPayment: manualConfirmPayment || false,

    userType: userType === undefined ? 'all' : userType,

    collectionName: 'buyorders_20260210',
  });

 
  return NextResponse.json({

    result,
    
  });
  
}
