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


export async function POST(request: NextRequest) {


  // parse header
  const webhookKey = request.headers.get("x-webhook-key");
  const mallId = request.headers.get("x-mall-id");
  const traceId = request.headers.get("x-trace-id");

  console.log("payaction webhookKey", webhookKey);
  console.log("payaction mallId", mallId);
  console.log("payaction traceId", traceId); // payaction traceId 1747808169270x797731416156850300



  const body = await request.json();

  console.log("payaction body", body);
  /*
  {
    order_number: '682d72f8a9087272af75142b',
    order_status: '매칭완료',
    processing_date: '2025-05-21T15:31:06+09:00'
  }
  */


  if (!body) {
    return NextResponse.json({
      status: "error",
      message: "body is empty",
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


  if (!order_number) {
    return NextResponse.json({
      status: "false",
    });
  }

  if (order_status !== "매칭완료") {
    return NextResponse.json({
      status: "false",
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




  const buyOrder = await getOneBuyOrderByTradeId({
    tradeId: order_number,
  });

  if (!buyOrder) {
    console.log("buyOrder is empty");
    return NextResponse.json({
      status: "error",
      message: "buyOrder is empty",
    });
  }

  console.log("buyOrder", buyOrder);

  
  if (buyOrder?.status !== "paymentRequested") {
    console.log("buyOrder status is not requestPayment");
    return NextResponse.json({
      status: "false",
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


          
          /*
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
                
                //response: response.text(), // response를 JSON으로 파싱하지 못한 경우
                response: await response.text(), // response를 JSON으로 파싱하지 못한 경우

              }
            });

          }
          */









        }

      } catch (error) {
        console.error("Error sending webhook:", error);
      }

    }










  

  return NextResponse.json({
    status: "success",
  });
  
}
