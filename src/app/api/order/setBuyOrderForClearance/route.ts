import { NextResponse, type NextRequest } from "next/server";

import {
	insertBuyOrderForClearance,
} from '@lib/api/order';

import {
  checkSellerByWalletAddress,
} from '@lib/api/user';


import {
  chain,
  ethereumContractAddressUSDT,
  polygonContractAddressUSDT,
  arbitrumContractAddressUSDT,
  bscContractAddressUSDT,

  bscContractAddressMKRW,
} from "@/app/config/contractAddresses";

export async function POST(request: NextRequest) {

  const body = await request.json();

  const { storecode, walletAddress, nickname, usdtAmount, krwAmount, rate, privateSale, buyer } = body;


  const user = await checkSellerByWalletAddress("admin", walletAddress);
  if (!user) {
    return NextResponse.json({
      result: null,
      error: "Seller with the provided wallet address does not exist",
    }
    , { status: 400 });
  }

  const sellerNickname = user.nickname;



  const result = await insertBuyOrderForClearance({
   
    chain: chain,
    
    storecode: storecode,
    
    walletAddress: walletAddress,
    //nickname: nickname,
    nickname: sellerNickname,

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
