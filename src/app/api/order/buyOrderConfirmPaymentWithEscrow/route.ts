import { NextResponse, type NextRequest } from "next/server";

import {
  OrderProps,
	buyOrderConfirmPayment,
  buyOrderGetOrderById,

  //buyOrderWebhook,

} from '@lib/api/order';
import { verifyCenterStoreAdminGuard } from "@/lib/server/center-store-admin-guard";

// Download the helper library from https://www.twilio.com/docs/node/install
import twilio from "twilio";
import { webhook } from "twilio/lib/webhooks/webhooks";
import { create } from "domain";

export const maxDuration = 60; // This function can run for a maximum of 60 seconds

const normalizeStorecode = (value: unknown) => {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
};


export async function POST(request: NextRequest) {

  console.log("buyOrderConfirmPaymentWithEscrow route.ts called");


  const body = await request.json();

  const {
    lang,
    storecode,
    orderId,
    paymentAmount,
    transactionHash,
    isSmartAccount
  } = body;

  const guard = await verifyCenterStoreAdminGuard({
    request,
    route: "/api/order/buyOrderConfirmPaymentWithEscrow",
    body,
    storecodeRaw: storecode,
  });

  if (!guard.ok) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }


  console.log("lang", lang);
  console.log("storecode", storecode);

  console.log("orderId", orderId);

  console.log("paymentAmount", paymentAmount);






  
  try {



    // get buyer wallet address


    const order = await buyOrderGetOrderById( orderId );

    if (!order) {

      console.log("order not found");
      console.log("orderId", orderId);
      
      return NextResponse.json({
        result: null,
      });
    }
    

    const {
      storecode: orderStorecode,
    } = order as OrderProps;

    const requestedStorecode = normalizeStorecode(storecode);
    const buyOrderStorecode = normalizeStorecode(orderStorecode);
    if (!buyOrderStorecode || buyOrderStorecode !== requestedStorecode) {
      console.log("buyOrder storecode mismatch for orderId:", orderId, {
        requestedStorecode,
        buyOrderStorecode,
      });
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const result = await buyOrderConfirmPayment({
      lang: lang,
      storecode: storecode,
      orderId: orderId,
      paymentAmount: paymentAmount,

      transactionHash: transactionHash,
    });
  
  
    //console.log("result", JSON.stringify(result));
  
    /*
    const {
      nickname: nickname,
      tradeId: tradeId,
    } = result as OrderProps;
  
  
  
    const amount = usdtAmount;
    */
  
  
      // send sms
    /*

    if (!buyer?.mobile) {
      return NextResponse.json({
        result,
      });
    }


    // check buyer.mobile is prefixed with +
    if (!buyer?.mobile.startsWith("+")) {
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

      const msgBody = `[GTETHER] TID[${tradeId}] You received ${amount} USDT from ${nickname}! https://gold.goodtether.com/${lang}/${chain}/sell-usdt/${orderId}`;
  
      message = await client.messages.create({
        ///body: "This is the ship that made the Kessel Run in fourteen parsecs?",
        body: msgBody,
        from: "+17622254217",
        to: to,
      });
  
      console.log(message.sid);

    } catch (error) {
        
      console.log("error", error);
  
    }

    */
  
  
    /*
    // order storecode가 매니의 storecode인 경우에만 webhook을 보냄
    if (orderStorecode === "dtwuzgst") { // 가맹점 이름 매니


      // http://3.112.81.28/?userid=test1234&amount=10000

      const userid = orderNickname; // 매니의 userid는 orderNickname
      const amount = paymentAmount;

      // https://my-9999.com/api/deposit?userid=test1234&amount=10000
      const webhookUrl = "http://3.112.81.28"; // 매니의 웹훅 URL

      const fetchUrl = `${webhookUrl}/?userid=${userid}&amount=${amount}`;

      try {

        
        //const response = await fetch(fetchUrl, {
        //  method: "GET",
        //  headers: {
        //    "Content-Type": "application/json",
        //  },
        //});

        // GET 요청
        const response = await fetch(fetchUrl);

        console.log("fetchUrl", fetchUrl);
        console.log("response", response);



        if (!response.ok) {
          console.error("Failed to send webhook for user:", userid, "with status:", response.status);
        } else {


          
          //성공: {result: success), 실패: {result: fail}
          

          try {
            const data = await response.json();
            console.log("Webhook sent for user:", userid, "with response:", data);

            await buyOrderWebhook({
              orderId: orderId,
              webhookData: {
                createdAt: new Date().toISOString(),
                url: webhookUrl,
                userid: userid,
                amount: amount,
                response: data,
              }
            });


          } catch (jsonError) {


            await buyOrderWebhook({
              orderId: orderId,
              webhookData: {
                createdAt: new Date().toISOString(),
                url: webhookUrl,
                userid: userid,
                amount: amount,
                response: response.text(), // response를 JSON으로 파싱하지 못한 경우
              }
            });

          }

        }

      } catch (error) {
        console.error("Error sending webhook:", error);
      }

    }
    */


  
    
    return NextResponse.json({
  
      result,
      
    });









  } catch (error) {
      
    console.log(" error=====>" + error);



  }

  


 
  return NextResponse.json({

    result: null,
    
  });
  
}
