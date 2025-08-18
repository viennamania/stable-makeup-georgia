import { NextResponse, type NextRequest } from "next/server";


import {

  getAllTradesByAdmin,

  getAllClearancesByAdmin,


} from '@lib/api/order';

/*
{
    totalNumberOfBuyers: 0,
    latestBuyers: [],
    totalNumberOfTrades: 0,
    latestTrades: [],
    totalBuyAmountKrw: 0,
    totalUsdtAmount: 0,
  }
*/

export async function POST(request: NextRequest) {

  const body = await request.json();

  const {
    privateSale = false,
    limit = 1,
    page = 1,
    startDate = "",
    endDate = "",
    agentcode = "",
    searchNickname = "",
    walletAddress = "",
    storecode = "",
    searchOrderStatusCompleted = true,
    searchBuyer = "",
    searchDepositName = "",
    searchStoreBankAccountNumber = "",

    fromDate = "",
    toDate = "",
  } = body;



  ///console.log("getStoreSummary body", body);



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






  


  const trades = await getAllTradesByAdmin({

    privateSale: privateSale,

    limit : limit,
    page : page,
    
    //startDate: startDate,
    //endDate: endDate,

    agentcode: agentcode,
    searchNickname: searchNickname,
    walletAddress: walletAddress,
    storecode: storecode,
    searchOrderStatusCompleted: searchOrderStatusCompleted,
    searchBuyer: searchBuyer,
    searchDepositName: searchDepositName,
    searchStoreBankAccountNumber: searchStoreBankAccountNumber,

    fromDate: fromDate,
    toDate: toDate,
  });


  ////console.log("getStoreSummary trades", trades);



  const totalCount = trades?.totalCount || 0;

  const totalKrwAmount = trades?.totalKrwAmount || 0;
  const totalUsdtAmount = trades?.totalUsdtAmount || 0;


  const totalSettlementCount = trades?.totalSettlementCount || 0;
  const totalSettlementAmount = trades?.totalSettlementAmount || 0;
  const totalSettlementAmountKRW = trades?.totalSettlementAmountKRW || 0;

  const totalFeeAmount = trades?.totalFeeAmount || 0;
  const totalFeeAmountKRW = trades?.totalFeeAmountKRW || 0;

  const totalAgentFeeAmount = trades?.totalAgentFeeAmount || 0;
  const totalAgentFeeAmountKRW = trades?.totalAgentFeeAmountKRW || 0;


  const latestTrades = trades?.trades || [];



  // clearance
  const clearanceTrades = await getAllClearancesByAdmin({
    limit: 10,
    page: 1,
    //startDate: startDate,
    //endDate: endDate,
    agentcode: agentcode,
    searchNickname: searchNickname,
    walletAddress: walletAddress,
    storecode: storecode,
    searchOrderStatusCompleted: searchOrderStatusCompleted,
    searchBuyer: searchBuyer,
    searchDepositName: searchDepositName,
    searchStoreBankAccountNumber: searchStoreBankAccountNumber,

    fromDate: fromDate,
    toDate: toDate,
  });



  //console.log("getStoreSummary clearanceTrades", clearanceTrades);










  const totalClearanceCount = clearanceTrades?.totalCount || 0;
  const totalClearanceAmount = clearanceTrades?.totalKrwAmount || 0;
  const totalClearanceAmountUSDT = clearanceTrades?.totalUsdtAmount || 0;



  const result = {
    //totalNumberOfBuyers,
    //latestBuyers,

    totalCount  ,
    totalKrwAmount,
    totalUsdtAmount,

    totalSettlementCount,
    totalSettlementAmount,
    totalSettlementAmountKRW,

    totalFeeAmount,
    totalFeeAmountKRW,
    totalAgentFeeAmount,
    totalAgentFeeAmountKRW,

    latestTrades,



    totalClearanceCount,
    totalClearanceAmount,
    totalClearanceAmountUSDT,

  };

 
  return NextResponse.json({

    result,
    
  });
  
}
