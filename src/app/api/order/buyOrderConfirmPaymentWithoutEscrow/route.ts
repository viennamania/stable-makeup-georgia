import { NextResponse, type NextRequest } from "next/server";

import {
  OrderProps,
	buyOrderConfirmPayment,
  buyOrderGetOrderById,

  //buyOrderWebhook,

  updateBuyOrderPayactionResult,
} from '@lib/api/order';
import { verifyCenterStoreAdminGuard } from "@/lib/server/center-store-admin-guard";


import {
  checkSellerByWalletAddress, 
} from '@lib/api/user';



// matchBankTransfersToPaymentAmount
import {
  matchBankTransfersBybankTransferId,
  matchBankTransfersToPaymentAmount,
} from '@lib/api/bankTransfer';


// thirdweb

import {
  getContract,
} from "thirdweb";

import { balanceOf } from "thirdweb/extensions/erc20";
 

import {
  ethereum,
  polygon,
  arbitrum,
  bsc,
} from "thirdweb/chains";

import {
  chain,
  ethereumContractAddressUSDT,
  polygonContractAddressUSDT,
  arbitrumContractAddressUSDT,
  bscContractAddressUSDT,
} from "@/app/config/contractAddresses";



import {
  client,
} from "@/app/client";



import {
  getPayactionKeys,
} from '@lib/api/store';
import { resolveCenterStoreOrderActionActor } from "@/lib/server/order-action-actor";




const contract = getContract({
  // the client you have created via `createThirdwebClient()`
  client,
  // the chain the contract is deployed on
  
  
  //chain: arbitrum,
  chain:  chain === "ethereum" ? ethereum :
          chain === "polygon" ? polygon :
          chain === "arbitrum" ? arbitrum :
          chain === "bsc" ? bsc : arbitrum,



  // the contract's address
  ///address: contractAddressArbitrum,

  address: chain === "ethereum" ? ethereumContractAddressUSDT :
          chain === "polygon" ? polygonContractAddressUSDT :
          chain === "arbitrum" ? arbitrumContractAddressUSDT :
          chain === "bsc" ? bscContractAddressUSDT : arbitrumContractAddressUSDT,


  // OPTIONAL: the contract's abi
  //abi: [...],
});

const normalizeStorecode = (value: unknown) => {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
};




export async function POST(request: NextRequest) {

  console.log("buyOrderConfirmPaymentWithoutEscrow");


  const body = await request.json();

  const {
    //lang,
    storecode,
    orderId,
    paymentAmount,
    queueId,
    transactionHash,

    bankTransferIds,

    //isSmartAccount
  } = body;

  const guard = await verifyCenterStoreAdminGuard({
    request,
    route: "/api/order/buyOrderConfirmPaymentWithoutEscrow",
    body,
    storecodeRaw: storecode,
  });

  if (!guard.ok) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }


  //console.log("lang", lang);
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
      nickname: orderNickname,
      storecode: orderStorecode,
      seller: seller,
      walletAddress: walletAddress,
      usdtAmount: usdtAmount,
      buyer: buyer,
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



    const sellerWalletAddress = seller.walletAddress;

    if (!sellerWalletAddress) {
      return NextResponse.json({
        result: null,
      });
    }

    /*
    // check seller exists
    const user = await checkSellerByWalletAddress(
      storecode,
      sellerWalletAddress
    );

    ///console.log("user", user);

    if (!user) {
      return NextResponse.json({
        result: null,
      });
    }
    */


    // get balance of seller wallet address

    let sellerWalletAddressBalance = 0;

    try {
      const sellerBalance = await balanceOf({
        contract,
        address: sellerWalletAddress,
      });

      if (chain === 'bsc') {
        sellerWalletAddressBalance = Number(sellerBalance) / 10 ** 18
      } else {
        sellerWalletAddressBalance = Number(sellerBalance) / 10 ** 6
      }
      console.log("sellerWalletAddressBalance=", sellerWalletAddressBalance);

    } catch (error) {
        
      console.log(" error=====>" + error);

    }



    const paymentConfirmedBy = await resolveCenterStoreOrderActionActor({
      request,
      requesterWalletAddress: guard.requesterWalletAddress,
      requesterIsAdmin: guard.requesterIsAdmin,
      matchedBy: guard.matchedBy,
      storecode: requestedStorecode || buyOrderStorecode,
      signedAt: body?.signedAt,
    });

    const result = await buyOrderConfirmPayment({
      //lang: lang,
      //storecode: storecode,
      orderId: orderId,
      paymentAmount: paymentAmount,
      
      queueId: queueId,

      transactionHash: transactionHash,

      sellerWalletAddressBalance: sellerWalletAddressBalance,
      autoConfirmPayment: false,
      matchedByAdmin: true,
      paymentConfirmedBy,

    });



    // if bankTransferIds 가 있으면
    // 각각을 매칭 처리한다.
    if (bankTransferIds && Array.isArray(bankTransferIds)) {
      for (const bankTransferId of bankTransferIds) {
        try {
          await matchBankTransfersBybankTransferId({
            bankTransferId: bankTransferId,
            tradeId:  order?.tradeId,
            matchedByAdmin: true,
          });
        } catch (error) {
          console.log("Error matching bank transfer ID:", bankTransferId, error);
        }
      }
    }





    // bankTransfer 에서 오늘것 중에 매칭 안되어있는것 찾기
    // 그리고 합산이 paymentAmount 이상이면
    // 차례로 합산해서 paymentAmount 와 똑같아지면 그 시점까지
    // 각각을 매칭 처리한다.
    // matchBankTransfersToPaymentAmount
    /*
    const bankTransfersToMatch = await matchBankTransfersToPaymentAmount({
      transactionName: orderNickname,
      paymentAmount: paymentAmount,
      tradeId:  order?.tradeId,
    });

    console.log("bankTransfersToMatch.length=", bankTransfersToMatch.length);

    */



    /*
    // getPayactionKeys
    const payactionKeys = await getPayactionKeys({
      storecode: order.storecode,
    });

    if (payactionKeys && payactionKeys.payactionApiKey && payactionKeys.payactionShopId) {

      const payactionApiKey = payactionKeys.payactionApiKey;
      const payactionShopId = payactionKeys.payactionShopId;

      const payactionUrl = "https://api.payaction.app/order-exclude";
      
      const headers = {
        "Content-Type": "application/json",
        "x-api-key": payactionApiKey,
        "x-mall-id": payactionShopId,
      };
      const body = {
        order_number: order.tradeId,
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
        


        if (response.status !== 200) {
          console.error("Payaction API error", result);
          //throw new Error("Payaction API error");
        }

        if (result.status !== "success") {
          console.error("Payaction API error", result);


          // update order payactionResult


          //throw new Error("Payaction API error");
        }

        //console.log("Payaction API result", result);

      
      } catch (error) {
        console.error("Error calling Payaction API", error);
      }

    }

    */







    

  
  
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
