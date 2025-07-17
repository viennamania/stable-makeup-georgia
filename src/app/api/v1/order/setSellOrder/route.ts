import { NextResponse, type NextRequest } from "next/server";

import {
	insertSellOrder,
  //requestPayment,
} from '@lib/api/order';

import {
  getOneByWalletAddress,
} from '@lib/api/user';



export async function GET(request: NextRequest) {

  /*
  const body = await request.json();

  const { walletAddress, usdtAmount, krwAmount, rate, privateSale } = body;
  */

  const storecode = request.nextUrl.searchParams.get('storecode') || '';

  const walletAddress = request.nextUrl.searchParams.get('walletAddress');
  const usdtAmount = request.nextUrl.searchParams.get('usdtAmount');
  const krwAmount = request.nextUrl.searchParams.get('krwAmount');
  const rate = request.nextUrl.searchParams.get('rate');
  //const privateSale = request.nextUrl.searchParams.get('privateSale');


  if (walletAddress === null) {
    return NextResponse.json({
      walletAddress: walletAddress,
      status: 400,
      msg: "USDT통장번호가 없습니다.",
    });
  }
  if (usdtAmount === null) {
    return NextResponse.json({
      walletAddress: walletAddress,
      status: 400,
      msg: "USDT 수량이 없습니다.",
    });
  }
  if (krwAmount === null) {
    return NextResponse.json({
      walletAddress: walletAddress,
      status: 400,
      msg: "KRW 수량이 없습니다.",
    });
  }
  if (rate === null) {
    return NextResponse.json({
      walletAddress: walletAddress,
      status: 400,
      msg: "환율이 없습니다.",
    });
  }


  // check if the user exists by walletAddress
  const user = await getOneByWalletAddress(
    storecode,
    walletAddress
  );

  if (user === null) {
    return NextResponse.json({
      walletAddress: walletAddress,
      status: 400,
      msg: "사용자가 없습니다.",
    });
  }

  if (user?.seller === null) {
    return NextResponse.json({
      walletAddress: walletAddress,
      status: 400,
      msg: "판매자가 아닙니다.",
    });
  }

  if (user?.escrowWalletAddress === null ) {
    return NextResponse.json({
      walletAddress: walletAddress,
      status: 400,
      msg: "에스크로 USDT통장번호가 없습니다.",
    });
  }













  const result = await insertSellOrder({
    walletAddress: walletAddress,
    usdtAmount: usdtAmount,
    krwAmount: krwAmount,
    rate: rate,
    privateSale: false,
  });

  //console.log("result", result);
  /*
  result { orderId: new ObjectId('675f8ced926ef97319ca9fdb') }
  */
  if (result === null) {
    return NextResponse.json({
      walletAddress: walletAddress,
      status: 400,
      msg: "주문이 생성되지 않았습니다.",
    });
  }

  /*
  const orderId = result.orderId.toString();

  console.log("orderId", orderId);

  const transactionHash = "0x1234567890";

  const result2 = await requestPayment({
    orderId: orderId,
    transactionHash: transactionHash,
  });

  if (result2 === null) {
    return NextResponse.json({
      orderId: orderId,
      status: 400,
      msg: "결제 요청이 실패했습니다.",
    });
  }

  //console.log("result2", result2);
  */

 
  return NextResponse.json({

    result,
    
  });
  
}
