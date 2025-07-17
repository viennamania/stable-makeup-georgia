import { NextResponse, type NextRequest } from "next/server";

import {
  UserProps,
	requestPayment,
  getOneBuyOrder,
} from '@lib/api/order';

// Download the helper library from https://www.twilio.com/docs/node/install
import twilio from "twilio";

import {
  getPayactionKeys,
} from '@lib/api/store';


export async function POST(request: NextRequest) {

  const body = await request.json();
  /*
            orderId: orderId,
          tradeId: tradeId,
          amount: amount
  */

  const { lang, chain, orderId, transactionHash } = body;

  console.log("requestPayment orderId", orderId);
  


  const resultBuyOrder = await getOneBuyOrder({
    orderId: orderId,
    limit: 1,
    page: 1,  
  });

  //console.log("getOneBuyOrder result", resultBuyOrder);
  if (!resultBuyOrder) {
    console.log("resultBuyOrder not found");
    console.log("orderId", orderId);
    return NextResponse.json({
      result: null,
    });
  }

  const buyOrder = resultBuyOrder?.orders[0];

  if (!buyOrder) {
    console.log("buyOrder not found");
    console.log("orderId", orderId);
    return NextResponse.json({
      result: null,
    });
  }


  const seller = buyOrder.seller;
  const buyer = buyOrder.buyer;
  const tradeId = buyOrder.tradeId;
  const krwAmount = buyOrder.krwAmount;
  const usdtAmount = buyOrder.usdtAmount;
  const mobile = buyer?.mobile;
  const email = buyer?.email;


 

  const bankName = seller.bankInfo.bankName;
  const accountNumber = seller.bankInfo.accountNumber;
  const accountHolder = seller.bankInfo.accountHolder;


  const depositName = buyer?.depositName;


   // getPayactionKeys
    const payactionKeys = await getPayactionKeys({
      storecode: buyOrder.storecode,
    });
    if (!payactionKeys) {
      console.error("Payaction keys not found for storecode:", buyOrder.storecode);
      return NextResponse.json({
        error: "Payaction keys not found for storecode",
        storecode: buyOrder.storecode,
      }, { status: 400 });
    }
    const payactionApiKey = payactionKeys.payactionApiKey;
    const payactionShopId = payactionKeys.payactionShopId;



  const payactionUrl = "https://api.payaction.app/order";



  if (!payactionApiKey || !payactionShopId) {

    console.error("Payaction API key or Shop ID is not defined for storecode:", buyOrder.storecode);
    return NextResponse.json({
      error: "Payaction API key or Shop ID is not defined",
      storecode: buyOrder.storecode,
    }, { status: 400 });
  }


  const payactionBody = {
    
    order_number: tradeId,

    order_amount: krwAmount,
    order_date: new Date().toISOString(),
    billing_name: depositName,
    orderer_name: depositName,
    orderer_phone_number: mobile,
    orderer_email: email,
    trade_usage: "USDT구매",
    identity_number: depositName,
  };

  const payactionHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    "x-api-key": payactionApiKey,
    "x-mall-id": payactionShopId,
  };
  const payactionOptions = {
    method: "POST",
    headers: payactionHeaders,
    body: JSON.stringify(payactionBody),
  };

  try {
    const payactionResponse = await fetch(payactionUrl, payactionOptions);

    const payactionResult = await payactionResponse.json();
    console.log("payactionResult", payactionResult);

    if (payactionResponse.status !== 200) {
      console.error("Payaction API error", payactionResult);
      throw new Error("Payaction API error");
    }
  
  } catch (error) {
    console.error("Error calling Payaction API", error);
    throw new Error("Error calling Payaction API");
  }



   
  const result = await requestPayment({
    orderId: orderId,
    transactionHash: transactionHash,
  });



  //console.log("result", JSON.stringify(result));
  /*
  const {
    mobile: mobile,
    seller: seller,
    buyer: buyer,
    tradeId: tradeId,
    krwAmount: krwAmount,
  } = result as UserProps;
  */





    // send sms


    /*
    if (!buyer.mobile) {
      return NextResponse.json({
        result,
      });
    }

    // check buyer.mobile is prefixed with +
    if (!buyer.mobile.startsWith("+")) {
      return NextResponse.json({
        result,
      });
    }

    const to = buyer.mobile;




    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const client = twilio(accountSid, authToken);



    let message = null;

    try {

      const msgBody = `[GTETHER] TID[${tradeId}] ${bankName} ${accountNumber} ${accountHolder} 입금자명:[${depositName}] ${amount}원`;

      message = await client.messages.create({
        ///body: "This is the ship that made the Kessel Run in fourteen parsecs?",
        body: msgBody,
        from: "+17622254217",
        to: to,
      });

      console.log(message.sid);

    } catch (e) {
        
      console.log("error", e);

    }


    */




 
  return NextResponse.json({

    result,
    
  });
  
}
