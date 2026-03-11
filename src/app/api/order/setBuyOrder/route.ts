import { NextResponse, type NextRequest } from "next/server";

import {
	insertBuyOrder,
  getBlockingBuyOrderByStorecodeAndWalletAddress,
} from '@lib/api/order';
import { chain } from "@/app/config/contractAddresses";
import { createBuyOrderEscrowWallet } from "@/lib/server/buy-order-escrow-wallet";

export async function POST(request: NextRequest) {

  const body = await request.json();

  const {
    storecode,
    walletAddress,
    nickname,
    usdtAmount,
    krwAmount,
    rate,
    privateSale,
    buyer,
    paymentMethod,
    returnUrl,
    orderNumber,
  } = body;

  console.log("setBuyOrder =====  body", body);

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




  const result = await insertBuyOrder({
    chain: chain,
    
    //agentcode: agentcode,
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
