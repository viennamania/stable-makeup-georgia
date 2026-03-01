import { NextResponse, type NextRequest } from "next/server";


// getAllUsersByStorecode
import {
  getAllUsersByStorecode,
} from "@lib/api/user";



import {
  OrderProps,
	acceptBuyOrder,
  updateBuyOrderByQueueId,


  //getOneBuyOrder,
  getOneBuyOrderByTradeId,

  buyOrderConfirmPayment,

  buyOrderWebhook,

} from '@lib/api/order';



import {
  updateBankTransferMatchAndTradeId,
} from '@lib/api/bankTransfer';

import {
  insertWebhookLog,
} from '@lib/api/webhookLog';


// webhook
// header
/*

Content-Type
application/json
x-webhook-key
your-webhook-key
(대시보드 > API설정 > 웹훅키에서 확인 가능)
x-mall-id
your-mall-id
(대시보드 > API설정 > 상점ID에서 확인 가능)
x-trace-id
트랜잭션 고유 ID
*/
// body
/*
{
    "order_number": "1234567890"
    "order_status": "매칭완료",
    "processing_date": "2023-07-26T11:31:00+09:00"
}
*/

// response body

/*
유형
상태코드
결과값
Response Body
200
{ "status": "success" }
 */


/*
{
  order_number: '11787973',
  order_status: '매칭완료',
  processing_date: '2025-09-15T02:47:58.306+09:00',
  agent_id: 3,
  agent_name: '원클릭',
  account_number: '22105556021573',
  amount: '1,000,000'
}
  */


export async function POST(request: NextRequest) {
  const receivedAt = new Date();


  // parse header
  const webhookKey = request.headers.get("x-webhook-key");
  const mallId = request.headers.get("x-mall-id");
  const traceId = request.headers.get("x-trace-id");

  const headersPayload = {
    "x-webhook-key": webhookKey,
    "x-mall-id": mallId,
    "x-trace-id": traceId,
  };

  let rawBody = "";
  let body: any = null;

  const respondWithLog = async ({
    status,
    message,
    stage,
    error,
    resultData,
  }: {
    status: string;
    message?: string;
    stage: string;
    error?: any;
    resultData?: Record<string, any>;
  }) => {
    const responseBody: Record<string, any> = {
      status,
    };

    if (message) {
      responseBody.message = message;
    }

    try {
      await insertWebhookLog({
        event: "bankmatch_webhook",
        headers: headersPayload,
        body: {
          request: body,
          requestRaw: rawBody || null,
          order_number: body?.order_number || null,
          order_status: body?.order_status || null,
          processing_date: body?.processing_date || null,
          traceId,
          mallId,
          result: {
            status,
            message: message || null,
            stage,
            ...resultData,
          },
          receivedAt,
        },
        error: error || null,
        createdAt: receivedAt,
      });
    } catch (logError) {
      console.error("Failed to insert bankmatch webhook log:", logError);
    }

    return NextResponse.json(responseBody);
  };

  console.log("payaction webhookKey", webhookKey);
  console.log("payaction mallId", mallId);
  console.log("payaction traceId", traceId); // payaction traceId 1747808169270x797731416156850300



  try {
    rawBody = await request.text();
    body = rawBody ? JSON.parse(rawBody) : null;
  } catch (parseError) {
    return await respondWithLog({
      status: "error",
      message: "Invalid JSON body",
      stage: "parse_body",
      error: parseError,
    });
  }

  console.log("payaction body", body);
  /*
  {
    order_number: '682d72f8a9087272af75142b',
    order_status: '매칭완료',
    processing_date: '2025-05-21T15:31:06+09:00'
  }
  */

  /*
   {
    order_number: '40620819',
    order_status: '매칭완료',
    processing_date: '2025-09-15T05:46:42.060+09:00',
    agent_id: 3,
    agent_name: '원클릭',
    account_number: '37591024505107',
    amount: '3,000,000'
  }
  */


  if (!body) {
    return await respondWithLog({
      status: "error",
      message: "body is empty",
      stage: "validate_body",
    });
  }



  const {
    order_number,
    order_status,
    processing_date,
  } = body;

 


  console.log("payaction order_number", order_number);
  console.log("payaction order_status", order_status);
  console.log("payaction processing_date", processing_date);

  /*

  payaction order_number 11787973
  payaction order_status 매칭완료
  payaction processing_date 2025-09-15T02:47:58.306+09:00
  */


  

  if (!order_number) {
    return await respondWithLog({
      status: "false",
      message: "order_number is empty",
      stage: "validate_order_number",
    });
  }

  if (order_status !== "매칭완료") {
    return await respondWithLog({
      status: "false",
      message: "order_status is not matched",
      stage: "validate_order_status",
    });
  }

  /*
    const result = await buyOrderConfirmPayment({
      lang: lang,
      storecode: storecode,
      orderId: orderId,
      paymentAmount: paymentAmount,
      
      queueId: queueId,

      transactionHash: transactionHashResult,

    });
    */

  /*
  const resultBuyOrder = await getOneBuyOrder({
    orderId: order_number,
    limit: 1,
    page: 1,  
  });

  //console.log("getOneBuyOrder result", resultBuyOrder);
  if (!resultBuyOrder) {
    return NextResponse.json({
      status: "error",
      message: "resultBuyOrder is empty",
    });
  }

  const buyOrder = resultBuyOrder?.orders[0];

  console.log("buyOrder", buyOrder);
  if (!buyOrder) {
    return NextResponse.json({
      status: "error",
      message: "buyOrder is empty",
    });
  }
  */


  
  
  try {
    const buyOrder = await getOneBuyOrderByTradeId({
      tradeId: order_number,
    });

    if (!buyOrder) {
      console.log("buyOrder is empty");
      return await respondWithLog({
        status: "error",
        message: "buyOrder is empty",
        stage: "find_buy_order_by_trade_id",
      });
    }

    //console.log("buyOrder", buyOrder);

    
    if (buyOrder?.status !== "paymentRequested") {
      console.log("buyOrder status is not requestPayment");
      return await respondWithLog({
        status: "false",
        message: "buyOrder status is not paymentRequested",
        stage: "validate_buy_order_status",
        resultData: {
          buyOrderStatusBefore: buyOrder?.status || null,
          buyOrderId: buyOrder?._id?.toString?.() || null,
        },
      });
    }
    


    const storecode = buyOrder?.storecode;
    const orderId = buyOrder?._id;
    const paymentAmount = buyOrder?.krwAmount;
    const queueId = null;
    const transactionHash = "0x";

    const buyerDepositName = buyOrder?.buyer?.depositName || "익명";
    const buyerNickname = buyOrder?.nickname || "익명";


    
    const response = await buyOrderConfirmPayment({
      lang: "ko",
      storecode: storecode,
      orderId: orderId,
      paymentAmount: paymentAmount,
      queueId: queueId,
      transactionHash: transactionHash,


      autoConfirmPayment: true,


    });

    //console.log("buyOrderConfirmPayment response", response);


 
  // updateBankTransferMatchAndTradeId
  /*
  const result = await updateBankTransferMatchAndTradeId({
    transactionName: buyerDepositName,
    amount: paymentAmount,
    tradeId: order_number,
    storeInfo: {
      storecode: buyOrder?.storecode || "",
      storeName: buyOrder?.store.storeName || "",
      storeLogo: buyOrder?.store.storeLogo || "",
    },
    buyerInfo: {
      nickname: buyerNickname,
      depositBankName: buyOrder?.buyer?.depositBankName || "",
      depositBankAccountNumber: buyOrder?.buyer?.depositBankAccountNumber || "",
      depositName: buyOrder?.buyer?.depositName || "",
      walletAddress: buyOrder?.buyer?.walletAddress || "",
    },
  });
  
  console.log("updateBankTransferMatchAndTradeId result", result);
  */


  
  
  
  
  
  /*
  if (buyOrder.store.storecode === "dtwuzgst") { // 가맹점 이름 매니


      // http://3.112.81.28/?userid=test1234&amount=10000

      const userid = buyOrder.nickname; // 매니의 userid는 orderNickname
      const amount = paymentAmount; // 매니의 amount는 krwAmount

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


          
          //성공: {result: success}, 실패: {result: fail}



          await buyOrderWebhook({
            orderId: orderId,
            webhookData: {
              createdAt: new Date().toISOString(),
              url: webhookUrl,
              userid: userid,
              amount: amount,
              
              //response: response.text(), // response를 JSON으로 파싱하지 못한 경우
              response: await response.text(), // response를 JSON으로 파싱하지 못한 경우

            }
          });



        }

      } catch (error) {
        console.error("Error sending webhook:", error);
      }

    }

    */








  

    return await respondWithLog({
      status: "success",
      stage: "confirm_payment",
      resultData: {
        buyOrderId: orderId?.toString?.() || null,
        tradeId: order_number,
        storecode: storecode || null,
        paymentAmount: paymentAmount || null,
        buyerNickname,
        buyerDepositName,
        buyOrderStatusBefore: buyOrder?.status || null,
        buyOrderConfirmPaymentResult: response || null,
      },
    });
  } catch (error) {
    console.error("Error processing bankmatch webhook:", error);
    return await respondWithLog({
      status: "error",
      message: "Unhandled error while processing bankmatch webhook",
      stage: "process_webhook",
      error,
    });
  }
  
}
