import { NextResponse, type NextRequest } from "next/server";

import {
	insertBuyOrder,
} from '@lib/api/order';


import {
  chain,
} from "@/app/config/contractAddresses";


// getOne from clients by clientid
import {
  getOne,
} from '@lib/api/client';

// getUserWalletAddress from users by storecode, nickname
import {
  getUserWalletAddressByStorecodeAndNickname,
} from '@lib/api/user';




/*
curl -X POST https://www.stable.makeup/api/order/setBuyOrderForStore \
  -H "Content-Type: application/json" \
  -d '{
    "clientid": "150b53f165222304af7c45dc45c73863",
    "storecode": "wwlfhyjg",
    "nickname": "user001",
    "krwAmount": 170000,
    "returnUrl": "https://www.stable.makeup/order/result"
  }'

*/


export async function POST(request: NextRequest) {

  const body = await request.json();

  const {
    clientid,
    storecode,
    nickname,
    krwAmount,
    returnUrl,
  } = body;

  console.log("setBuyOrder =====  body", body);

  // check clientid

  const client = await getOne(clientid);




  // 
  //storecode

  // get walletAddress by storecode, nickname

  // get usdtAmount, rate by krwAmount


  let rate = 0; // clients.exchangeRateUSDT.KRW
  let usdtAmount = 0;

  const privateSale = false;

  const paymentMethod = "bank";
  const orderNumber = "";


  // walletAddress from storecode, nickname
  const userInfo = await getUserWalletAddressByStorecodeAndNickname(storecode, nickname);

  if (!userInfo) {
    return NextResponse.json({
      result: null,
      error: "Invalid storecode or nickname",
    }
    , { status: 400 });
  }

  const {
    walletAddress,
    buyer,
  } = userInfo;


  if (!walletAddress) {

    return NextResponse.json({
      result: null,
      error: "User wallet address not found",
    }
    , { status: 400 });
    
  }

  

  if (!client) {

    return NextResponse.json({
      result: null,
      error: "Invalid clientid",
    }
    , { status: 400 });

  }

  rate = client.exchangeRateUSDT?.KRW || 0;

  if (rate <= 0) {

    return NextResponse.json({
      result: null,
      error: "Invalid exchange rate",
    }
    , { status: 500 });

  }

  usdtAmount = Number((krwAmount / rate).toFixed(2));



  //   if (!data.storecode || !data.walletAddress || !data.usdtAmount || !data.krwAmount || !data.rate) {
    

  const result = await insertBuyOrder({
    chain: chain,
    
    storecode: storecode,
    
    walletAddress: walletAddress,


    nickname: nickname,
    usdtAmount: usdtAmount,
    krwAmount: krwAmount,
    rate: rate,
    privateSale: privateSale,
    buyer: buyer,
    paymentMethod: paymentMethod,
    returnUrl: returnUrl,
    orderNumber: orderNumber,
  });

  /////console.log("setBuyOrder =====  result", result);

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
