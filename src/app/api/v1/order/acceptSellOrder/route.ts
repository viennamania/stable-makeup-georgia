import { NextResponse, type NextRequest } from "next/server";

import {
  UserProps,
  getOneSellOrder,
	acceptSellOrder,
  requestPayment,
} from '@lib/api/order';

import {
  getOneByWalletAddress,
} from '@lib/api/user';


// Download the helper library from https://www.twilio.com/docs/node/install
import twilio from "twilio";
import { idCounter } from "thirdweb/extensions/farcaster/idRegistry";


export async function GET(request: NextRequest) {

  /*
  const body = await request.json();

  const { lang, chain, orderId, buyerWalletAddress, buyerNickname, buyerAvatar, buyerMobile, buyerMemo, depositName, depositBankName } = body;
  */

  const lang = request.nextUrl.searchParams.get('lang');
  const storecode = request.nextUrl.searchParams.get('storecode') ?? '';
  const orderId = request.nextUrl.searchParams.get('orderId');
  const buyerWalletAddress = request.nextUrl.searchParams.get('buyerWalletAddress');

  /*
  const buyerNickname = request.nextUrl.searchParams.get('buyerNickname');
  const buyerAvatar = request.nextUrl.searchParams.get('buyerAvatar');
  const buyerMobile = request.nextUrl.searchParams.get('buyerMobile');
  const buyerMemo = request.nextUrl.searchParams.get('buyerMemo');
  const depositName = request.nextUrl.searchParams.get('depositName');
  const depositBankName = request.nextUrl.searchParams.get('depositBankName');
  */




  ///console.log("orderId", orderId);

  // check if the order is already accepted

  if (orderId === null) {
    return NextResponse.json({
      orderId: orderId,
      status: 400,
      msg: "주문번호가 없습니다.",
    });
  }

  if (buyerWalletAddress === null) {
    return NextResponse.json({
      orderId: orderId,
      status: 400,
      msg: "구매자 USDT지갑주소가 없습니다.",
    });
  }





  const sellOrders = await getOneSellOrder({
    orderId: orderId,
  });

  if (sellOrders === null) {
    return NextResponse.json({
      orderId: orderId,
      status: 400,
      msg: "주문이 없습니다.",
    });
  }

  //console.log("sellOrders", sellOrders);
  /*
  sellOrders {
    totalCount: 1,
    orders: [
      {
        _id: new ObjectId('675f791d1c704dfe1729dc71'),
        lang: null,
        chain: null,
        walletAddress: '0xE8A03aBFCb23637173eE1D1EB91c311e1bE7866a',
        nickname: 'gtest1210',
        mobile: '+8201037438448',
        avatar: null,
        seller: [Object],
        usdtAmount: '1',
        krwAmount: '2000',
        rate: '2000',
        createdAt: '2024-12-16T00:49:33.840Z',
        status: 'ordered',
        privateSale: false
      }
    ]
  }
  */

  if (sellOrders.totalCount === 0) {
    return NextResponse.json({
      orderId: orderId,
      status: 400,
      msg: "주문이 없습니다.",
    });
  }

  const sellOrder = sellOrders.orders[0];

  //console.log("sellOrder", sellOrder);

  if (sellOrder.status !== 'ordered') {
    return NextResponse.json({
      orderId: orderId,
      status: 400,
      msg: "이미 수락된 주문입니다.",
      result: sellOrder,
    });
  }

  

  // get user info from wallet address

  const buyerInfo = await getOneByWalletAddress(
    storecode,
    buyerWalletAddress
  );

  if (buyerInfo === null) {
    return NextResponse.json({
      orderId: orderId,
      status: 400,
      msg: "구매자 정보가 없습니다.",
    });
  }


  const buyerNickname = buyerInfo?.nickname;
  const buyerAvatar = buyerInfo?.avatar;
  const buyerMobile = buyerInfo?.mobile;


  const result = await acceptSellOrder({
    lang: lang,
    storecode: storecode,
    orderId: orderId,
    buyerWalletAddress: buyerWalletAddress,
    buyerNickname: buyerNickname,
    buyerAvatar: buyerAvatar,
    buyerMobile: buyerMobile,
    //buyerMemo: buyerMemo,
    //depositName: depositName,
    //depositBankName: depositBankName,

  });

  ////console.log("result", result);



  // requestPayment
  const transactionHash = "0x1234567890";
  const result2 = await requestPayment({
    orderId: orderId,
    transactionHash: transactionHash,
  });

  ////console.log("result2", result2);






  /*
  const {
    //mobile: mobile,
    seller: seller,
    buyer: buyer,
    tradeId: tradeId,
  } = result as UserProps;


  // if mobile number is not prefix with country code don't send sms
  if (!mobile.startsWith('+')) {
    return NextResponse.json({
      result,
    });
  }


    // send sms

    
    const to = mobile;


    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const client = twilio(accountSid, authToken);



    let message = null;

   

    try {

      let msgBody = '';

      if (lang === 'en') {
        msgBody = `[GTETHER] TID[${tradeId}] Your sell order has been accepted by ${buyer?.nickname}! You must escrow USDT to proceed with the trade in 10 minutes!`;
      } else if (lang === 'kr') {
        msgBody = `[GTETHER] TID[${tradeId}] ${buyer?.nickname}님이 판매 주문을 수락했습니다! 거래를 계속하기 위해 USDT를 에스크로해야 합니다!`;
      } else {
        msgBody = `[GTETHER] TID[${tradeId}] Your sell order has been accepted by ${buyer?.nickname}! You must escrow USDT to proceed with the trade in 10 minutes!`;
      }



      message = await client.messages.create({
        body: msgBody,
        from: "+17622254217",
        to: to,
      });

      console.log(message.sid);



    } catch (e) {
      console.error('error', e);
    }

    */


  if (result === null) {
    return NextResponse.json({
      orderId: orderId,
      status: 400,
      msg: "주문을 수락하지 못했습니다.",
    });
  }
  
  //      {"status" :200, "msg": "성공하였습니다."}



 
  return NextResponse.json({
    orderId: orderId,
    status: 200,
    msg: "성공하였습니다.",
    result: result2,
    
  });
  
}
