import { NextResponse, type NextRequest } from "next/server";

import {
	acceptBuyOrder,
} from '@lib/api/order';



export async function POST(request: NextRequest) {

  const body = await request.json();

  const {
    lang,
    storecode,
    
    orderId,

    sellerWalletAddress,
    sellerStorecode,
    sellerMemo,
    //sellerNickname, sellerAvatar, sellerMobile, seller

    tradeId,
    buyerWalletAddress,
  } = body;

  ///console.log("acceptBuyOrder body", body);


  /*
  {
    lang: 'ko',
    storecode: 'suroggyc',
    orderId: new ObjectId('6827479e460e1b9e73417ebc'),
    sellerWalletAddress: '0x98773aF65AE660Be4751ddd09C4350906e9D88F3',
    sellerStorecode: 'admin'
  }
  */

  

  const result = await acceptBuyOrder({
    lang: lang,
    storecode: storecode,
    orderId: orderId,
    sellerWalletAddress: sellerWalletAddress,
    sellerStorecode: sellerStorecode || "admin",
    sellerMemo: sellerMemo,

    /*
    sellerNickname: sellerNickname,
    sellerAvatar: sellerAvatar,
    sellerMobile: sellerMobile,
    seller: seller,
    */

  });

  //console.log("result", result);

  if (result) {





    /*
    const APPLICATION_ID = 'CCD67D05-55A6-4CA2-A6B1-187A5B62EC9D';

    const apiToken = process.env.SENDBIRD_API_TOKEN;

    if (apiToken) {
 
      // group_channels
      const url = `https://api-${APPLICATION_ID}.sendbird.com/v3/group_channels`;

      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Api-Token': apiToken,
          },
          body: JSON.stringify({
            name: "거래번호: #" + tradeId,
            channel_url: orderId,
            cover_url: 'https://stable.makeup/icon-trade.png',
            custom_type: 'trade',
            user_ids: [buyerWalletAddress, sellerWalletAddress],
            data: JSON.stringify({
              tradeId: tradeId,
              buyerWalletAddress: buyerWalletAddress,
              sellerWalletAddress: sellerWalletAddress,
              sellerStorecode: sellerStorecode,
            }),
            
          }),
        });

        const data = await response.json();
        //console.log('Sendbird group channel created:', data);




      } catch (error) {
        console.error('Error creating Sendbird group channel:', error);
      }

    }
    */



  }


  /*
  const {
    mobile: mobile,
    buyer: buyer,
    tradeId: tradeId,
  } = result as UserProps;
  */

  // if mobile number is not prefix with country code don't send sms
  /*
  if (!mobile || !mobile.startsWith('+')) {
    return NextResponse.json({
      result,
    });
  }
    */


    // send sms
    /*
    const to = mobile;


    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const client = twilio(accountSid, authToken);



    let message = null;

   

    try {

      let msgBody = '';

      if (lang === 'en') {
        msgBody = `[GTETHER] TID[${tradeId}] Your buy order has been accepted by ${seller?.nickname}! You must escrow USDT to proceed with the trade in 10 minutes!`;
      } else if (lang === 'kr') {
        msgBody = `[GTETHER] TID[${tradeId}] ${seller?.nickname}님이 구매 주문을 수락했습니다! 거래를 계속하기 위해 USDT를 에스크로해야 합니다!`;
      } else {
        msgBody = `[GTETHER] TID[${tradeId}] Your buy order has been accepted by ${seller?.nickname}! You must escrow USDT to proceed with the trade in 10 minutes!`;
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





 
  return NextResponse.json({

    result,
    
  });
  
}
