import { NextResponse, type NextRequest } from "next/server";


import {
  getAllStoresForAgent,
} from '@lib/api/store';

import {
  getAllBuyersForAgent,
} from '@lib/api/user';

import {
	getAllTradesForAgent,
  getAllBuyOrdersForAgent,
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
    agentcode,
  } = body;


  //console.log("getTotalSummaryForAgent body", body);



  const stores = await getAllStoresForAgent({
    limit: 5,
    page: 1,
    agentcode: agentcode,
  });


  ///console.log("stores", stores);

  const totalNumberOfStores = stores?.totalCount || 0;
  const latestStores = stores?.stores || [];




  const buyers = await getAllBuyersForAgent({
    storecode: "",
    agentcode: agentcode,
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
  const orders = await getAllTradesForAgent({
    limit: 5,
    page: 1,
    startDate: "",
    endDate: "",
    searchNickname: "",
    walletAddress: "",
    agentcode: agentcode,
    searchOrderStatusCompleted: true,
    searchBuyer: "",
    searchDepositName: "",
    searchStoreBankAccountNumber: "",
  });

  //console.log("getTotal Summary orders", orders);


  const totalNumberOfTrades = orders?.totalCount || 0;
  const totalBuyAmountKrw = orders?.totalKrwAmount || 0;
  const totalUsdtAmount = orders?.totalUsdtAmount || 0;
  const totalSettlementAmount = orders?.totalSettlementAmount || 0;
  const totalSettlementAmountKRW = orders?.totalSettlementAmountKRW || 0;

  const latestTrades = orders?.orders || [];

  //console.log("getTotal Summary latestTrades", latestTrades);



  const buyOrders = await getAllBuyOrdersForAgent({
    limit: 5,
    page: 1,
    startDate: "",
    endDate: "",
    searchNickname: "",
    walletAddress: "",
    agentcode: agentcode,
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
