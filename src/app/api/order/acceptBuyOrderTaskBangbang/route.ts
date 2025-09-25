import { NextResponse, type NextRequest } from "next/server";

import {
  getAllBuyOrdersForMatching,
	acceptBuyOrder,
  cancelTradeBySeller,
} from '@lib/api/order';

import {
  getStoreByStorecode,
} from '@lib/api/store';

import {
  getOneByWalletAddress,
} from '@lib/api/user';


export async function POST(request: NextRequest) {


//export async function GET(request: NextRequest) {


  const buyordersResult = await getAllBuyOrdersForMatching({
    limit: 100,
    page: 1,
    startDate: "",
    endDate: "",
  });





  //console.log("buyordersResult", buyordersResult);


  const buyorders = buyordersResult?.orders || [];

  for (const buyorder of buyorders) {



    ///const matchingDuration = 15; // in seconds
    const matchingDuration = 1; // in seconds



    const now = new Date();

    const oneMinuteAgo = new Date(now.getTime() - 1 * matchingDuration * 1000).toISOString();
    console.log("oneMinuteAgo", oneMinuteAgo);

    // check if order.createdAt is less than oneMinuteAgo
    if (buyorder.createdAt > oneMinuteAgo) {
      console.log("order.createdAt is more than 1 minute ago");
      continue;
    }

    const storecode = buyorder?.storecode;

    //console.log("storecode", storecode);

    if (!storecode) {
      console.log("error");
      console.log("storecode is null");
      console.log("buyorder", buyorder);

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


    let sellerWalletAddress = '';


    if (buyorder.privateSale) {

      sellerWalletAddress = store?.adminWalletAddress;

    } else {

      sellerWalletAddress = store?.sellerWalletAddress;

    }

    console.log("sellerWalletAddress", sellerWalletAddress);

    if (!sellerWalletAddress) {
      console.log("error");
      console.log("sellerWalletAddress is null");
      console.log("store", store);

      // delete order
      //await collectionOrders.deleteOne({ _id: order._id });

      //console.log("order deleted");
      
      continue;
    }


    //const sellerStorecode = "admin";
    const sellerStorecode = storecode; // use the same storecode as the buyer's store



    let sellerMemo = "";


    

    // 프라이빗 세일이 아닌 경우, 판매자의 은행 정보가 있는지 확인한다.
    if (!buyorder.privateSale) {
    
        const userSeller = await getOneByWalletAddress(
          sellerStorecode,
          sellerWalletAddress
        );

        if (!userSeller) {
          console.log("error");
          console.log("userSeller is null");
          console.log("userSeller", userSeller);

          await cancelTradeBySeller({
            storecode: sellerStorecode,
            orderId: buyorder._id,
            walletAddress: sellerWalletAddress,
            cancelTradeReason: "등록된 판매자 정보가 없습니다.",
          });

          console.log("order cancelled");

          continue;
        }




        /*
        if (!userSeller
          || !userSeller.seller
          || !userSeller.seller.bankInfo
          || !userSeller.seller.bankInfo.bankName
          || !userSeller.seller.bankInfo.accountNumber
          || !userSeller.seller.bankInfo.accountHolder
        ) {
          console.log("error");
          console.log("userSeller is null");
          console.log("userSeller", userSeller);


          await cancelTradeBySeller({
            storecode: sellerStorecode,
            orderId: buyorder._id,
            walletAddress: sellerWalletAddress,
            cancelTradeReason: "등록된 판매자 정보가 없습니다.",
          });


          console.log("order cancelled");
          
          continue;
        }


        sellerMemo = userSeller?.seller?.bankInfo?.bankName + " " + userSeller?.seller?.bankInfo?.accountNumber + " " + userSeller?.seller?.bankInfo?.accountHolder;
        */
  

    } 


    // if buyer's walletAddress is 

    /*
    {"storecode":"ccaderjl",
    "orderId":"6833ec4c4f5e4d7f156271a7",
    "sellerWalletAddress":"0xE7b5DF6DA5B87D3EAd4b40b8BE979583837F7224",
    "sellerStorecode":"admin",
    "sellerMemo":""}
    */
  

    const result = await acceptBuyOrder({
      storecode: storecode,
      orderId: buyorder._id,
      sellerWalletAddress: sellerWalletAddress,
      sellerStorecode: sellerStorecode,
      sellerMemo: sellerMemo,


      /*
      sellerNickname: sellerNickname,
      sellerAvatar: sellerAvatar,
      sellerMobile: sellerMobile,
      seller: seller,
      */

    });

    ////console.log("acceptBuyOrder result", result);

    if (result) {

      //console.log("acceptBuyOrder result", result);



    }





  }

 
  return NextResponse.json({

    result: "success",
    
  });
  
}
