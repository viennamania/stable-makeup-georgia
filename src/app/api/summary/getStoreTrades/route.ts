import { NextResponse, type NextRequest } from "next/server";

import {
  getAllBuyersByStorecode,
} from '@lib/api/user';

import {
	getAllBuyOrdersByStorecode,

  getAllTradesByStorecode,

  //getAllTradesByAdmin,


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



  
  const trades = await getAllTradesByStorecode({
    limit: 1,
    page: 1,
    startDate: "",
    endDate: "",
    storecode,

    searchBuyer: "",
    searchDepositName: "",
    searchStoreBankAccountNumber: "",
  });
  

  /*
  const trades = await getAllTradesByAdmin({
    limit : 1,
    page : 1,
    startDate: "",
    endDate: "",
    searchNickname: "",
    walletAddress: "",
    storecode,
    searchOrderStatusCompleted: true,
    searchBuyer: "",
    searchDepositName: "",
    searchStoreBankAccountNumber: "",
  });
  */



  ///console.log("getAllTradesByAdmin trades", trades);



  const totalCount = trades?.totalCount || 0;

  const totalKrwAmount = trades?.totalKrwAmount || 0;
  const totalUsdtAmount = trades?.totalUsdtAmount || 0;


  const totalSettlementCount = trades?.totalCount || 0;
  const totalSettlementAmount = trades?.totalSettlementAmount || 0;
  const totalSettlementAmountKRW = trades?.totalSettlementAmountKRW || 0;


  const latestTrades = trades?.trades || [];


  const result = {
    //totalNumberOfBuyers,
    //latestBuyers,

    totalCount  ,
    totalKrwAmount,
    totalUsdtAmount,

    totalSettlementCount,
    totalSettlementAmount,
    totalSettlementAmountKRW,

    latestTrades,
  };

 
  return NextResponse.json({

    result,
    
  });
  
}
