import { NextResponse, type NextRequest } from "next/server";


import {
  getAllStores,
} from '@lib/api/store';

import {
  getAllBuyers,
} from '@lib/api/user';

import {
	getAllTradesByAdmin,
  ///getAllClearancesByAdmin,
  getAllBuyOrdersByAdmin,
} from '@lib/api/order';

/*
{
    totalNumberOfStores: 0,
    latestStores: [],
    totalNumberOfBuyers: 0,
    latestBuyers: [],
    totalNumberOfTrades: 0,
    latestTrades: [],
    totalBuyAmountKrw: 0,
    totalUsdtAmount: 0,
    totalSellAmount: 0,
    totalSellAmountKRW: 0,
  }
*/

export async function POST(request: NextRequest) {

  const body = await request.json();

  const {
    agentcode = "",
    storecode = "",
    search = "",
    //searchStore = "",
  } = body;


  //console.log("getTotalSummary body", body);



  const stores = await getAllStores({
    agentcode,
    search: search,
    limit: 5,
    page: 1,
  });


  //console.log("stores", stores);

  const totalNumberOfStores = stores?.totalCount || 0;
  const latestStores = stores?.stores || [];

  
  ///console.log("getTotalSummary latestStores", latestStores);







  const buyers = await getAllBuyers({
    agentcode: agentcode,
    storecode: storecode,
    search: search,
    depositName: "",
    limit: 5,
    page: 1,
  });

  //console.log("buyers", buyers);

  const totalNumberOfBuyers = buyers?.totalCount || 0;
  const latestBuyers = buyers?.users || [];


  /*
      limit,
    page,
    startDate,
    endDate,
    searchNickname,
    walletAddress,
    */
  const orders = await getAllTradesByAdmin({
    limit: 5,
    page: 1,
    
    //startDate: "",
    //endDate: "",

    agentcode: agentcode,
    searchNickname: "",
    walletAddress: "",
    storecode: "",
    searchOrderStatusCompleted: true,
    searchBuyer: "",
    searchDepositName: "",
    searchStoreBankAccountNumber: "",
    privateSale: false, // false for normal trades

    fromDate: "",
    toDate: "",
  });

  //console.log("getTotal Summary orders", orders);


  const totalNumberOfTrades = orders?.totalCount || 0;


  //console.log("getTotal Summary totalNumberOfTrades", totalNumberOfTrades);

  const totalBuyAmountKrw = orders?.totalKrwAmount || 0;
  const totalUsdtAmount = orders?.totalUsdtAmount || 0;
  const totalSettlementAmount = orders?.totalSettlementAmount || 0;
  const totalSettlementAmountKRW = orders?.totalSettlementAmountKRW || 0;

  const totalAgentFeeAmount = orders?.totalAgentFeeAmount || 0;
  const totalAgentFeeAmountKRW = orders?.totalAgentFeeAmountKRW || 0;


  const latestTrades = orders?.orders || [];



  //console.log("totalAgentFeeAmount", totalAgentFeeAmount);
  //console.log("totalAgentFeeAmountKRW", totalAgentFeeAmountKRW);

  //console.log("getTotal Summary latestTrades", latestTrades);



  /*
  // only get the latest 5 clearances and privateSale is true for private sales
  const clearances = await getAllTradesByAdmin({
    limit: 5,
    page: 1,
    
    //startDate: "",
    //endDate: "",

    agentcode: agentcode,
    searchNickname: "",
    walletAddress: "",
    storecode: "",
    searchOrderStatusCompleted: true,
    searchBuyer: "",
    searchDepositName: "",
    searchStoreBankAccountNumber: "",
    privateSale: true, // true for clearances

    fromDate: "",
    toDate: "",
  });
  //console.log("getTotal Summary clearances", clearances);
  const totalNumberOfClearances = clearances?.totalCount || 0;
  const totalBuyAmountClearances = clearances?.totalKrwAmount || 0;
  const totalUsdtAmountClearances = clearances?.totalUsdtAmount || 0;
  const totalSettlementAmountClearances = clearances?.totalSettlementAmount || 0;
  const totalSettlementAmountKRWClearances = clearances?.totalSettlementAmountKRW || 0;
  const latestClearances = clearances?.clearances || [];
  //console.log("getTotal Summary latestClearances", latestClearances);
  */












  const buyOrders = await getAllBuyOrdersByAdmin({
    limit: 5,
    page: 1,
    startDate: "",
    endDate: "",
    agentcode: agentcode,
    searchNickname: "",
    walletAddress: "",
  });
  //console.log("getTotal Summary buyOrders", buyOrders);
  const totalNumberOfBuyOrders = buyOrders?.totalCount || 0;
  const totalBuyAmount = buyOrders?.totalKrwAmount || 0;
  const totalUsdtAmountBuyOrders = buyOrders?.totalUsdtAmount || 0;



  const latestBuyOrders = buyOrders?.orders || [];






  const result = {
    totalNumberOfStores,
    latestStores,
    totalNumberOfBuyers,
    latestBuyers,

    totalNumberOfTrades,
    latestTrades,
    totalBuyAmountKrw,
    totalUsdtAmount,
    totalSettlementAmount,
    totalSettlementAmountKRW,

    totalAgentFeeAmount,
    totalAgentFeeAmountKRW,


    totalNumberOfBuyOrders,
    totalBuyAmount,
    totalUsdtAmountBuyOrders,
    latestBuyOrders,
  };


  ///console.log("getTotalSummary result", result);

 
  return NextResponse.json({

    result,
    
  });
  
}
