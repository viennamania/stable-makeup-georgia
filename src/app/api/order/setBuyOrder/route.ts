import { NextResponse, type NextRequest } from "next/server";

import {
	insertBuyOrder,
} from '@lib/api/order';

/*
import {
  getAgentByStorecode,
} from '@lib/api/agent';
*/


export async function POST(request: NextRequest) {

  const body = await request.json();

  const { storecode, walletAddress, nickname, usdtAmount, krwAmount, rate, privateSale, buyer } = body;

  console.log("setBuyOrder =====  body", body);

  /*
  {
    lang: 'ko',
    storecode: 'agvdldan',
    walletAddress: '0x98773aF65AE660Be4751ddd09C4350906e9D88F3',
    nickname: 'mcmcmo',
    usdtAmount: 0.68,
    krwAmount: 1000,
    rate: 1480,
    privateSale: true,
    buyer: { depositBankName: '', depositName: '' }
  }
  */


  //getAgentByStorecode
  /*
  const agent = await getAgentByStorecode({
    storecode: storecode,
  });
  

  const agentcode = agent?.agentcode || null;
  */
  

  const result = await insertBuyOrder({
    //agentcode: agentcode,
    storecode: storecode,
    
    walletAddress: walletAddress,


    nickname: nickname,
    usdtAmount: usdtAmount,
    krwAmount: krwAmount,
    rate: rate,
    privateSale: privateSale,
    buyer: buyer
  });

  ///console.log("setBuyOrder =====  result", result);

  if (!result) {

    return NextResponse.json({
      result: null,
      error: "Failed to insert buy order",
    }
    , { status: 500 });

  }




 
  return NextResponse.json({

    result,
    
  });
  
}
