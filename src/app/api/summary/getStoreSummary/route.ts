import { NextResponse, type NextRequest } from "next/server";

import {
  getAllBuyersByStorecode,
} from '@lib/api/user';

import {
  
	getAllBuyOrdersByStorecode,

  getAllTradesByStorecode,


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
    storecode = "",
  } = body;

  const users = await getAllBuyersByStorecode({
    limit: 5,
    page: 1,
    storecode,
  });

  //console.log("getStoreSummary users", users);
  const totalNumberOfBuyers = users?.totalCount || 0;
  const latestBuyers = users?.users || [];
  //console.log("getStoreSummary latestBuyers", latestBuyers);


  const orders = await getAllBuyOrdersByStorecode({
    limit: 5,
    page: 1,
    startDate: "",
    endDate: "",
    storecode,
  });
  //console.log("getStoreSummary orders", orders);
  const totalNumberOfOrders = orders?.totalCount || 0;
  const totalBuyKrwAmount = orders?.totalKrwAmount || 0;
  const totalBuyUsdtAmount = orders?.totalUsdtAmount || 0;
  const latestOrders = orders?.orders || [];



  //console.log("getStoreSummary latestTrades", latestTrades);
  const trades = await getAllTradesByStorecode({
    limit: 5,
    page: 1,
    startDate: "",
    endDate: "",
    storecode,
    
    searchBuyer: "",
    searchDepositName: "",
    searchStoreBankAccountNumber: "",

  });

  //console.log("getStoreSummary trades", trades);

  const totalNumberOfTrades = trades?.totalCount || 0;
  const totalTradeKrwAmount= trades?.totalKrwAmount || 0;
  const totalTradeUsdtAmount = trades?.totalUsdtAmount || 0;

  const totalSettlementCount = trades?.totalSettlementCount || 0;
  const totalSettlementAmount = trades?.totalSettlementAmount || 0;
  const totalSettlementAmountKRW = trades?.totalSettlementAmountKRW || 0;


  const latestTrades = trades?.trades || [];



  /*
      limit,
    page,
    startDate,
    endDate,
    agentcode,
    searchNickname,
    walletAddress,
    storecode,
    searchOrderStatusCompleted,
    searchBuyer,
    searchDepositName,
    searchStoreBankAccountNumber,
  */
  const clearances = await getAllClearancesByAdmin({
    limit: 5,
    page: 1,
    
    //startDate: "",
    //endDate: "",

    agentcode: "",
    searchNickname: "",
    walletAddress: "",
    storecode,
    searchOrderStatusCompleted: false,
    searchBuyer: "",
    searchDepositName: "",
    searchStoreBankAccountNumber: "",

    fromDate: "",
    toDate: "",
  });

  //console.log("getStoreSummary clearances", clearances);

  const totalClearanceCount = clearances?.totalCount || 0;
  const totalClearanceKrwAmount = clearances?.totalKrwAmount || 0;
  const totalClearanceUsdtAmount = clearances?.totalUsdtAmount || 0;

  const latestClearances = clearances?.orders || [];


  const result = {
    storecode,

    latestBuyers,
    totalNumberOfBuyers,

    latestOrders,
    totalNumberOfOrders,
    totalBuyKrwAmount,
    totalBuyUsdtAmount,


    latestTrades,
    totalNumberOfTrades,
    totalTradeKrwAmount,
    totalTradeUsdtAmount,
    totalSettlementCount,
    totalSettlementAmount,
    totalSettlementAmountKRW,


    latestClearances,
    totalClearanceCount,
    totalClearanceKrwAmount,
    totalClearanceUsdtAmount,


  };

 
  return NextResponse.json({

    result,
    
  });
  
}
