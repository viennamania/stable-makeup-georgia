import { NextResponse, type NextRequest } from "next/server";

import {
  UserProps,
	buyOrderRequestPayment,

  getOneBuyOrder,

  updateBuyOrderPayactionResult,
} from '@lib/api/order';


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

  const {
    orderId,
    transactionHash,
    bankInfo,
  } = body;


  console.log("buyOrderRequestPayment orderId", orderId);













  const resultBuyOrder = await getOneBuyOrder({
    orderId: orderId,
    limit: 1,
    page: 1,  
  });



  const buyOrder = resultBuyOrder?.orders[0];


  if (!buyOrder) {
    console.error("Buy order not found for orderId:", orderId);
    return NextResponse.json({
      error: "Buy order not found",
      orderId: orderId,
    }, { status: 404 });
  }

  console.log("buyOrderRequestPayment buyOrder.storecode=", buyOrder.storecode);



  const payactionKeys = await getPayactionKeys({
    storecode: buyOrder.storecode,
  });


  if (payactionKeys.payactionApiKey && payactionKeys.payactionShopId) {


    if (!payactionKeys) {
      console.error("Payaction keys not found for storecode:", buyOrder.storecode);
      return NextResponse.json({
        error: "Payaction keys not found for storecode",
        storecode: buyOrder.storecode,
      }, { status: 400 });
    }
    const payactionApiKey = payactionKeys.payactionApiKey;
    const payactionWebhookKey = payactionKeys.payactionWebhookKey;
    const payactionShopId = payactionKeys.payactionShopId;

    //console.log("payactionApiKey", payactionApiKey);
    //console.log("payactionWebhookKey", payactionWebhookKey);
    //console.log("payactionShopId", payactionShopId);





    /*

    if (!payactionApiKey || !payactionShopId) {
      console.error("Payaction API key or Shop ID is not defined for storecode:", buyOrder.storecode);
      return NextResponse.json({
        error: "Payaction API key or Shop ID is not defined",
        storecode: buyOrder.storecode,
      }, { status: 400 });
    }
    */



  
    // if buyOrder?.mobile is +82, remove +82
    let mobile = buyOrder?.mobile || "";
    if (mobile.startsWith("+82")) {
      mobile = "0" + mobile.substring(3);
    } else if (mobile.startsWith("82")) {
      mobile = "0" + mobile.substring(2);
    }


    if (payactionApiKey && payactionShopId) {

      const tradeId = buyOrder.tradeId;
      
      const payactionUrl = "https://api.payaction.app/order";
      const payactionBody = {
        order_number: tradeId,
        order_amount: buyOrder.krwAmount,
        order_date: new Date().toISOString(),
        billing_name: buyOrder.buyer.depositName,
        orderer_name: buyOrder.buyer.depositName,
        orderer_phone_number: mobile,
        orderer_email: buyOrder.buyer?.email,
        trade_usage: "USDT구매",
        identity_number: buyOrder.walletAddress,
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
        console.log("buyOrderRequestPayment payactionResult", payactionResult);
        /*
        { status: 'success', response: {} }
        */

        // updateBuyOrderPayactionResult
        await updateBuyOrderPayactionResult({
          orderId: orderId,
          api: "/api/order/buyOrderRequestPayment",
          payactionResult: payactionResult,
        });



        if (payactionResponse.status !== 200) {
          console.error("Payaction API error", payactionResult);
          throw new Error("Payaction API error");
        }


        if (payactionResult.status !== "success") {
          console.error("Payaction API error", payactionResult);
          throw new Error("Payaction API error");
        }

        
      
      } catch (error) {
        // Error calling Payaction API
        console.error("Error calling Payaction API", error);
        
        return NextResponse.json({
          error: "Error calling Payaction API",
          details: error instanceof Error ? error.message : "Unknown error",
        }, { status: 500 });

      }
    
    }

  }
  


  const result = await buyOrderRequestPayment({
    orderId: orderId,
    transactionHash: transactionHash,

    bankInfo: bankInfo,
  });








  if (!result) {
    return NextResponse.json({
      error: "Failed to request payment for the order",
    }, { status: 500 });
  }










 
  return NextResponse.json({

    result,
    
  });
  
}
