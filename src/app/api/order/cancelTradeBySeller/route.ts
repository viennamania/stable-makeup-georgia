import { NextResponse, type NextRequest } from "next/server";

import {
  getOneBuyOrder,
	cancelTradeBySeller,

  updateBuyOrderPayactionResult,

} from '@lib/api/order';


import {
  getOneByWalletAddress 
} from '@lib/api/user';

import {
  getPayactionKeys,
} from '@lib/api/store';



// Download the helper library from https://www.twilio.com/docs/node/install
import twilio from "twilio";





export async function POST(request: NextRequest) {

  const body = await request.json();

  const {
    orderId,
    storecode,
    walletAddress,
    cancelTradeReason,
  } = body;

  //console.log("orderId", orderId);
  //console.log("walletAddress", walletAddress);




  const user = await getOneByWalletAddress(
    storecode,
    walletAddress
  );



  if (!user) {

    
    console.log("user not found");
    console.log("walletAddress", walletAddress);



    return NextResponse.json({
      result: null,
    });
  }


  const buyOrderResult = await getOneBuyOrder({
    orderId: orderId,
    limit: 1,
    page: 1,
  });

  const buyOrder = buyOrderResult?.orders[0] || null;


  if (!buyOrder) {
    console.log("buyOrder not found");
    console.log("orderId", orderId);

    return NextResponse.json({
      result: null,
    });
  }




  // 결제요청한 정보가 자동입금(payaction)인 경우 주문-메칭 제외처리
  if (buyOrder.status === "paymentRequested") {

    const tradeId = buyOrder.tradeId;


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





    const payactionUrl = "https://api.payaction.app/order-exclude";



    if (!payactionApiKey || !payactionShopId) {
      console.error("Payaction API key or Shop ID is not defined for storecode:", buyOrder.storecode);
      return NextResponse.json({
        error: "Payaction API key or Shop ID is not defined",
        storecode: buyOrder.storecode,
      }, { status: 400 });
    }

    
    const headers = {
      "Content-Type": "application/json",
      "x-api-key": payactionApiKey,
      "x-mall-id": payactionShopId,
    };
    const body = {
      order_number: tradeId,
    };
    const options = {
      method: "POST",
      headers: headers,
      body: JSON.stringify(body),
    };

    try {
      const response = await fetch(payactionUrl, options);

      const result = await response.json();
      
      
      console.log("payactionResult", result);
      // updateBuyOrderPayactionResult
      await updateBuyOrderPayactionResult({
        orderId: orderId,
        api: "/api/order/cancelTradeBySeller",
        payactionResult: result,
      });

      /*
      {
        status: 'NOT_RUN',
        message: "The condition for the workflow order-exclude-v2 is not met. Workflow won't run"
      }
        */


      if (response.status !== 200) {
        console.error("Payaction API error", result);
        throw new Error("Payaction API error");
      }

      if (result.status !== "success") {
        console.error("Payaction API error", result);


        // update order payactionResult







        throw new Error("Payaction API error");
      }

      //console.log("Payaction API result", result);

    
    } catch (error) {
      console.error("Error calling Payaction API", error);
      throw new Error("Error calling Payaction API");
    }


    const resultCancelTradeBySeller = await cancelTradeBySeller({
      storecode: storecode,
      orderId: orderId,
      walletAddress: walletAddress,
      cancelTradeReason: cancelTradeReason,
    });

    if (resultCancelTradeBySeller) {
      return NextResponse.json({
        result: true,
      });
    } else {
      return NextResponse.json({
        result: false,
      });
    }





  } else if (buyOrder.status === "accepted") {

    const result = await cancelTradeBySeller({
      storecode: storecode,
      orderId: orderId,
      walletAddress: walletAddress,
      cancelTradeReason: cancelTradeReason,
    });



    if (result) {


      //const tradeId = result.updated?.tradeId;
      //const to = result.updated?.mobile || "";
      //const buyer = result.updated?.buyer;



      /*
      const accountSid = process.env.TWILIO_ACCOUNT_SID;
      const authToken = process.env.TWILIO_AUTH_TOKEN;
      const client = twilio(accountSid, authToken);



      let message = null;

      try {

        const msgBody = `[GTETHER] TID[${tradeId}] Your sell order has been cancelled by ${buyer?.nickname}!`;

        message = await client.messages.create({
          ///body: "This is the ship that made the Kessel Run in fourteen parsecs?",
          body: msgBody,
          from: "+17622254217",
          to: to,
        });

        console.log(message.sid);

      } catch (e) {
        console.error('Error sending SMS', e);
      }
      */



      return NextResponse.json({

        result: true,
        
      });  


    } else {
  
      return NextResponse.json({

        result: false,
        
      });

    }

  } else {

    console.log("buyOrder.status", buyOrder.status);
    return NextResponse.json({
      result: false,
    });
  }
  
}
