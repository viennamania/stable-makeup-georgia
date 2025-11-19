import { NextResponse, type NextRequest } from "next/server";

import {
	insertBuyOrderForUser,
} from '@lib/api/order';

import {
  getPrivateSellerWalletAddressFromStorecode,
} from '@lib/api/store';


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
    seller
  } = body;



  //console.log("insertBuyOrderForUser body", body);
  /*
  {
    lang: 'ko',
    storecode: 'ixryqqtw',
    walletAddress: '0x1eba71B17AA4beE24b54dC10cA32AAF0789b8D9A',
    nickname: '',
    usdtAmount: 7.25,
    krwAmount: 10000,
    rate: 1400,
    privateSale: true,
    buyer: { depositBankName: '', depositName: '' }
  }
  */


  let sellerInfo = seller;
  // get private seller wallet address from storecode

  const privateSellerWalletAddress = await getPrivateSellerWalletAddressFromStorecode({ storecode });
  if (privateSale && privateSellerWalletAddress) {
    sellerInfo = {
      walletAddress: privateSellerWalletAddress,
    };
  }


  const result = await insertBuyOrderForUser({
    storecode: storecode,
    
    walletAddress: walletAddress,

    nickname: nickname,
    usdtAmount: usdtAmount,
    krwAmount: krwAmount,
    rate: rate,
    privateSale: privateSale,
    buyer: buyer,
    seller: sellerInfo,
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
