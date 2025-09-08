import { NextResponse, type NextRequest } from "next/server";

import {
  getAllBuyOrdersForRequestPayment,
	buyOrderRequestPayment,
  cancelTradeBySeller,

  updateBuyOrderPayactionResult,
} from '@lib/api/order';

import {
  getStoreByStorecode,
} from '@lib/api/store';

import {
  getOneByWalletAddress,
} from '@lib/api/user';



export async function POST(request: NextRequest) {

// GET
////export async function GET(request: NextRequest) {


  let reaultArray = [];



  const buyordersResult = await getAllBuyOrdersForRequestPayment({
    limit: 100,
    page: 1,
  });


  const buyOrders = buyordersResult?.orders || [];

  
  
  //console.log("buyOrders", buyOrders);
  console.log("buyOrders length", buyOrders.length);
  console.log("buyOrders totalCount", buyordersResult?.totalCount);




  for (const buyOrder of buyOrders) {


    const storecode = buyOrder?.storecode;



    //console.log("storecode", storecode);

    if (!storecode) {
      console.log("error");
      console.log("storecode is null");
      console.log("buyOrder", buyOrder);

      // delete order
      //await collectionOrders.deleteOne({ _id: order._id });


      //console.log("order deleted");
      
      continue;
    }


    const store = await getStoreByStorecode({
      storecode: storecode,
    });

    if (!store) {
      console.log("error");
      console.log("store is null");
      console.log("storecode", storecode);

      // delete order
      //await collectionOrders.deleteOne({ _id: order._id });

      //console.log("order deleted");
      
      continue;
    }


    /*
    const user = await getOneByWalletAddress({
      walletAddress: buyOrder?.walletAddress,
    });
    if (!user) {
      console.log("error");
      console.log("user is null");
      continue;
    }

    //// user 정보를 가져와서 확인한다.
    */


    //console.log("buyOrder", buyOrder);



    const transactionHash = "0x";
    let bankInfo = {
      bankName: store?.bankName,
      accountNumber: store?.accountNumber,
      accountHolder: store?.accountHolder,
      amount: buyOrder.krwAmount,
    };




    const orderId = buyOrder?._id;

    const privateSale = buyOrder?.privateSale;

  

    
    if (privateSale) {
      console.log("privateSale is true");
      //console.log("buyOrder", buyOrder);



      // privateSale인 경우, bankInfo를 store 정보로 설정한다.


      const bankInfo = {
        bankName: store?.withdrawalBankInfo?.bankName,
        accountNumber: store?.withdrawalBankInfo?.accountNumber,
        accountHolder: store?.withdrawalBankInfo?.accountHolder,
        amount: buyOrder.krwAmount,
      };


      /*
      {
        _id: new ObjectId('6833ee1eb0c4bf8cec9297f8'),
        lang: null,
        agentcode: 'dttdqguo',
        agent: {
          _id: new ObjectId('6830a9656938313502aa26fe'),
          agentcode: 'dttdqguo',
          agentName: '애플망고',
          agentType: 'test',
          agentUrl: 'https://test.com',
          agentDescription: '테스트입니다.',
          agentLogo: 'https://vzrcy5vcsuuocnf3.public.blob.vercel-storage.com/iK9vg4m-tQ1U5qPHkmoG3iPyendGrLbLz4jflx.png',
          agentBanner: 'https://cryptoss.beauty/logo.png',
          createdAt: '2025-05-23T16:59:17.883Z',
          adminWalletAddress: '0x880c0E9B2C388a4365c9ba145Cf3355D889731E1',
          agentFeeWalletAddress: '0x80bBe3A61124339780E90e8eB2BF58F26e189312',
          totalStoreCount: 9
        },
        storecode: 'suroggyc',
        store: {
          _id: new ObjectId('682406e0fb6221a9967a61ce'),
          storecode: 'suroggyc',
          storeName: '캘리포니아',
          storeType: 'test',
          storeUrl: 'https://test.com',
          storeDescription: '캘리포니아 만세ㅎㅎ',
          storeLogo: 'https://vzrcy5vcsuuocnf3.public.blob.vercel-storage.com/H095G0M-lXxdoEjtKCw3KNFvpJXPHV52MmY9vG.jpeg',
          totalBuyerCount: 77,
          sellerWalletAddress: '0x98773aF65AE660Be4751ddd09C4350906e9D88F3',
          adminWalletAddress: '0x880c0E9B2C388a4365c9ba145Cf3355D889731E1',
          settlementWalletAddress: '0x880c0E9B2C388a4365c9ba145Cf3355D889731E1',
          settlementFeeWalletAddress: '0x0d4cA31bD8E5ec8c1D8e0C1126D8f8d16683EB97',
          settlementFeePercent: 0.4,
          bankInfo: {
            bankName: '농협은행',
            accountNumber: '3561092781123',
            accountHolder: '신호동'
          },
          agentcode: 'dttdqguo',
          agentFeePercent: 0.1
        },
        */


      // continue;
    
      const result = await buyOrderRequestPayment({
        orderId: orderId,
        transactionHash: transactionHash,

        bankInfo: bankInfo,
      });
      

      console.log("result", result);


      reaultArray.push(buyOrder.tradeId);

      continue;

    }




    const payactionApiKey = store?.payactionKey?.payactionApiKey;
    const payactionWebhookKey = store?.payactionKey?.payactionWebhookKey;
    const payactionShopId = store?.payactionKey?.payactionShopId;

    if (payactionApiKey && payactionShopId) {

      


      const order_number = buyOrder.tradeId;
      const order_amount = buyOrder.krwAmount;
      const order_date = new Date().toISOString();
      const billing_name = buyOrder.buyer.depositName;
      const orderer_name = buyOrder.buyer.depositName;
      
  
      // if buyOrder?.mobile is +82, remove +82
      let mobile = buyOrder?.mobile || "";
      if (mobile.startsWith("+82")) {
        mobile = "0" + mobile.substring(3);
      } else if (mobile.startsWith("82")) {
        mobile = "0" + mobile.substring(2);
      }



      const orderer_email = buyOrder.buyer?.email;
      const trade_usage = "USDT구매";
      const identity_number = buyOrder.walletAddress;

      
      const payactionUrl = "https://api.payaction.app/order";
      const payactionBody = {
        order_number: order_number,
        order_amount: order_amount,
        order_date: order_date,
        billing_name: billing_name,
        orderer_name: orderer_name,
        orderer_phone_number: mobile,
        orderer_email: orderer_email,
        trade_usage: trade_usage,
        identity_number: identity_number,
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


        if (!payactionResponse.ok) {
          console.error("Payaction API response error", payactionResponse.status, payactionResponse.statusText);
          
          continue;
        }

        const payactionResult = await payactionResponse.json();

        console.log("payactionResult", payactionResult);



        if (!payactionResult || typeof payactionResult !== "object") {
          console.error("Payaction API response is not valid JSON", payactionResult);
          continue;
        }

        if (payactionResult.status !== "success") {
          console.error("Payaction API error", payactionResult);


          // updateBuyOrderPayactionResult
          await updateBuyOrderPayactionResult({
            orderId: buyOrder._id,
            api: "/api/order/buyOrderRequestPaymentTask",
            payactionResult: payactionResult,
          });

          continue;
        }
        

        // updateBuyOrderPayactionResult
        await updateBuyOrderPayactionResult({
          orderId: buyOrder._id,
          api: "/api/order/buyOrderRequestPaymentTask",
          payactionResult: payactionResult,
        });
    
    

        if (payactionResponse.status !== 200) {
          
          console.error("Payaction API error", payactionResult);


          console.log("order_number", order_number);
          console.log("order_amount", order_amount);
          console.log("order_date", order_date);
          console.log("billing_name", billing_name);
          console.log("orderer_name", orderer_name);
          console.log("orderer_phone_number", mobile);
          console.log("orderer_email", orderer_email);
          console.log("trade_usage", trade_usage);
          console.log("identity_number", identity_number);

          continue;
        }


        
        //{ status: 'error', response: { message: '누락된 필드가 존재합니다.' } }
        

        
        //{ status: 'success', response: {} }
        


        if (payactionResult.status !== "success") {

          console.error("Payaction API error", payactionResult);


          console.log("order_number", order_number);
          console.log("order_amount", order_amount);
          console.log("order_date", order_date);
          console.log("billing_name", billing_name);
          console.log("orderer_name", orderer_name);
          console.log("orderer_phone_number", mobile);
          console.log("orderer_email", orderer_email);
          console.log("trade_usage", trade_usage);
          console.log("identity_number", identity_number);


          // {
          //    status: 'NOT_RUN',
          //    message: "The condition for the workflow order-v2 is not met. Workflow won't run"
          //}

          // { status: 'error', response: { message: '이미 해당 주문번호의 주문이 존재합니다.' } }


          //throw new Error("Payaction API error");
          continue;
        }

        
      
      } catch (error) {
        console.error("Error calling Payaction API", error);
        //throw new Error("Error calling Payaction API");
        continue;
      }


    }





    /*
    const transactionHash = "0x";
    const bankInfo = {
      bankName: "신한은행",
      accountNumber: "123-456-789012",
      accountHolder: "홍길동",
      amount: 10000,
    };
    */

    
    const result = await buyOrderRequestPayment({
      orderId: orderId,
      transactionHash: transactionHash,

      bankInfo: bankInfo,
    });
    

    console.log("result", result);


    reaultArray.push(buyOrder.tradeId);


  }



 
  return NextResponse.json({

    result: reaultArray,
    
  });
  
}
