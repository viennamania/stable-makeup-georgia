import { NextResponse, type NextRequest } from "next/server";

import {
	insertBuyOrder,
  getBlockingBuyOrderByStorecodeAndWalletAddress,
} from '@lib/api/order';


import {
  chain,
} from "@/app/config/contractAddresses";
import { createBuyOrderEscrowWallet } from "@/lib/server/buy-order-escrow-wallet";
import {
  getRequestCountry,
  getRequestIp,
} from "@/lib/server/user-read-security";


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
/*
// mgorlkxu => 캘리포니아 storecode
// zkeyujk => userid
curl -X GET "https://www.stable.makeup/api/order/setBuyOrderForStore?clientid=150b53f165222304af7c45dc45c73863&storecode=mgorlkxu&nickname=zkeyujk&krwAmount=10000&returnUrl="


curl -X GET "http://localhost:3000/api/order/setBuyOrderForStore?clientid=150b53f165222304af7c45dc45c73863&storecode=mgorlkxu&nickname=zkeyujk&krwAmount=10000&returnUrl="

*/

const ROUTE = "/api/order/setBuyOrderForStore";

async function handleSetBuyOrder(payload: Record<string, any>, request: NextRequest) {

  const clientid = payload.clientid || payload.clientId;
  const storecode = payload.storecode || payload.storeCode;
  const userid = payload.userid || payload.userId || payload.nickname;
  const amount = payload.amount ?? payload.krwAmount;
  const returnUrl = payload.returnUrl;
  const ip = getRequestIp(request);
  const country = getRequestCountry(request);

  ///console.log("setBuyOrder =====  body", payload);

  if (!clientid || !storecode || !userid || !amount) {

    return NextResponse.json({
      result: null,
      error: "Missing required fields",
    }
    , { status: 400 });
    
  }

  // check clientid

  const client = await getOne(clientid);


  if (!client) {

    return NextResponse.json({
      result: null,
      error: "Invalid clientid",
    }
    , { status: 400 });

  }

  const nickname = userid;
  const krwAmount = Number(amount);


  // 
  //storecode

  // get walletAddress by storecode, nickname

  // get usdtAmount, rate by krwAmount


  const privateSale = false;

  const paymentMethod = "bank";
  const orderNumber = "";


  // walletAddress from storecode, nickname
  const userInfo = await getUserWalletAddressByStorecodeAndNickname(storecode, nickname);

  if (!userInfo) {
    return NextResponse.json({
      result: null,
      error: "Invalid storecode or userid",
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

  const existingBuyOrder = await getBlockingBuyOrderByStorecodeAndWalletAddress({
    storecode,
    walletAddress,
  });

  if (existingBuyOrder) {
    return NextResponse.json({
      result: null,
      error: "Existing active buy order already exists for this member",
      existingOrder: existingBuyOrder,
    }, { status: 409 });
  }



  const rate = client.exchangeRateUSDT?.KRW || 0;

  if (rate <= 0) {

    return NextResponse.json({
      result: null,
      error: "Invalid exchange rate",
    }
    , { status: 500 });

  }

  const usdtAmount = Number((krwAmount / rate).toFixed(2));

  let escrowWallet;
  try {
    escrowWallet = await createBuyOrderEscrowWallet({
      storecode,
    });
  } catch (error) {
    return NextResponse.json({
      result: null,
      error: error instanceof Error ? error.message : "Failed to create buy order escrow wallet",
    }, { status: 500 });
  }



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
    escrowWallet,
    returnUrl: returnUrl,
    orderNumber: orderNumber,
    createdByApi: ROUTE,
    createdByRequest: {
      route: ROUTE,
      method: request.method,
      publicIp: ip,
      publicCountry: country,
      clientId: String(clientid || "").trim() || null,
      userId: String(userid || "").trim() || null,
      requestedAt: new Date().toISOString(),
    },
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


export async function POST(request: NextRequest) {

  try {
    const body = await request.json();
    return handleSetBuyOrder(body, request);
  } catch (error) {
    return NextResponse.json({
      result: null,
      error: "Invalid JSON body",
    }, { status: 400 });
  }
}


export async function GET(request: NextRequest) {
  const payload = Object.fromEntries(request.nextUrl.searchParams.entries());
  return handleSetBuyOrder(payload, request);
}
