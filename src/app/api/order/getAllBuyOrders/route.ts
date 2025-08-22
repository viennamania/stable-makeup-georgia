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

    searchBuyer,
    searchDepositName,

    searchStoreBankAccountNumber,

    fromDate,
    toDate,


  } = body;


  //console.log("getAllBuyOrders fromDate", fromDate);
  //console.log("getAllBuyOrders toDate", toDate);



  

  ///console.log("getAllBuyOrders body", body);



  // when fromDate is "" or undefined, set it to 30 days ago
  if (!fromDate || fromDate === "") {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    body.fromDate = date.toISOString().split("T")[0]; // YYYY-MM-DD format
  }

  // when toDate is "" or undefined, set it to today
  if (!toDate || toDate === "") {
    const date = new Date();
    body.toDate = date.toISOString().split("T")[0]; // YYYY-MM-DD format
  }



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

    searchBuyer: searchBuyer || "",
    searchDepositName: searchDepositName || "",

    searchStoreBankAccountNumber: searchStoreBankAccountNumber || "",


    fromDate: fromDate || "",

    toDate: toDate || "",

  });

  /*
  console.log("getAllBuyOrders result totalCount", result.totalCount);
  console.log("getAllBuyOrders result totalKrwAmount", result.totalKrwAmount);
  console.log("getAllBuyOrders result totalUsdtAmount", result.totalUsdtAmount);
  console.log("getAllBuyOrders result totalSettlementCount", result.totalSettlementCount);
  console.log("getAllBuyOrders result totalSettlementAmount", result.totalSettlementAmount);
  console.log("getAllBuyOrders result totalSettlementAmountKRW", result.totalSettlementAmountKRW);
  console.log("getAllBuyOrders result totalFeeAmount", result.totalFeeAmount);
  console.log("getAllBuyOrders result totalFeeAmountKRW", result.totalFeeAmountKRW);
  console.log("getAllBuyOrders result totalAgentFeeAmount", result.totalAgentFeeAmount);
  console.log("getAllBuyOrders result totalAgentFeeAmountKRW", result.totalAgentFeeAmountKRW);
  */
 
  return NextResponse.json({

    result,
    
  });
  
}
