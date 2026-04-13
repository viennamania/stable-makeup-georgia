import { NextResponse, type NextRequest } from "next/server";

import {
	insertBuyOrderForUser,
  getBlockingBuyOrderByStorecodeAndWalletAddress,
} from '@lib/api/order';

import {
  getStoreByStorecode,
  getPrivateSellerWalletAddressFromStorecode,
} from '@lib/api/store';
import { validateBuyOrderStorePaymentAmount } from "@/lib/server/buy-order-store-validation";


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

  const store = await getStoreByStorecode({ storecode });
  let normalizedKrwAmount = krwAmount;
  if (store) {
    const amountValidation = validateBuyOrderStorePaymentAmount({
      store,
      krwAmountRaw: krwAmount,
    });
    if (!amountValidation.ok) {
      return NextResponse.json({
        result: null,
        error: amountValidation.error,
      }, { status: amountValidation.status });
    }
    normalizedKrwAmount = amountValidation.krwAmount;
  }


  const result = await insertBuyOrderForUser({
    storecode: storecode,
    
    walletAddress: walletAddress,

    nickname: nickname,
    usdtAmount: usdtAmount,
    krwAmount: normalizedKrwAmount,
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
