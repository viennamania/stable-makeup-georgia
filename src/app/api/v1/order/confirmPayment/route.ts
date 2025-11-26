import { NextResponse, type NextRequest } from "next/server";

import {
  OrderProps,
	confirmPayment,
  getOrderById,
} from '@lib/api/order';

// object id
import { ObjectId } from 'mongodb';

import {
  getOneByWalletAddress 
} from '@lib/api/user';



import {
  createThirdwebClient,
  eth_getTransactionByHash,
  getContract,
  sendAndConfirmTransaction,
  
  sendBatchTransaction,


} from "thirdweb";

//import { polygonAmoy } from "thirdweb/chains";
import {
  polygon,
  arbitrum,
 } from "thirdweb/chains";

import {
  privateKeyToAccount,
  smartWallet,
  getWalletBalance,
  
 } from "thirdweb/wallets";


import {
  mintTo,
  totalSupply,
  transfer,
  
  getBalance,

  balanceOf,

} from "thirdweb/extensions/erc20";
import { stat } from "fs";



// nextjs-app
export const maxDuration = 60; // This function can run for a maximum of 5 seconds

//nextjs /pages/api
/*
export const config = {
	//runtime: 'edge',
	maxDuration: 120, // This function can run for a maximum of 60 seconds
};
*/


// USDT Token (USDT)
const tokenContractAddressUSDT = '0xc2132D05D31c914a87C6611C10748AEb04B58e8F';

const contractAddressArbitrum = "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9"; // USDT on Arbitrum




export async function GET(request: NextRequest) {



  const orderId = request.nextUrl.searchParams.get('orderId');
  const storecode = request.nextUrl.searchParams.get('storecode') || '';

  if (orderId === null) {
    return NextResponse.json({
      orderId: orderId,
      status: 400,
      msg: "주문번호가 없습니다.",
    });
  }




  console.log("orderId", orderId);


  const lang = "ko";
  const chain = "polygon";
  const isSmartAccount = false;





  
  try {


    if (!ObjectId.isValid(orderId)) {
      return NextResponse.json({
        orderId: orderId,
        status: 400,
        msg: "주문번호가 유효하지 않습니다.",
      });
    }

    // get buyer wallet address


    const order = await getOrderById( orderId );

    
    //console.log("order", order);




    if (!order) {
      return NextResponse.json({
        orderId: orderId,
        status: 400,
        msg: "주문이 없습니다.",
      });
    }

    const {
      status: status,
      walletAddress: walletAddress,
      usdtAmount: usdtAmount,
      krwAmount: krwAmount,
      buyer: buyer,
    } = order as OrderProps;


    if (status !== "paymentRequested") {
      return NextResponse.json({
        orderId: orderId,
        status: 400,
        msg: "주문 상태가 유효하지 않습니다.",
      });
    }


    const paymentAmount = krwAmount;


    const sellerWalletAddress = walletAddress;

    //console.log("sellerWalletAddress", sellerWalletAddress);


    if (!sellerWalletAddress) {
      return NextResponse.json({
        orderId: orderId,
        status: 400,
        msg: "판매자 USDT지갑주소가 없습니다.",
      });
    }

    const user = await getOneByWalletAddress(
      storecode,
      sellerWalletAddress
    );

    //console.log("user", user);

    if (!user) {
      return NextResponse.json({
        orderId: orderId,
        status: 400,
        msg: "사용자가 없습니다.",
      });
    }


    const escrowWalletAddress = user.escrowWalletAddress;

    console.log("escrowWalletAddress", escrowWalletAddress);

    if (!escrowWalletAddress) {
      return NextResponse.json({
        orderId: orderId,
        status: 400,
        msg: "에스크로 USDT지갑주소가 없습니다.",
      });
    }



    const toAddressStore = buyer.walletAddress;

    if (!toAddressStore) {
      return NextResponse.json({
        orderId: orderId,
        status: 400,
        msg: "구매자 USDT지갑주소가 없습니다.",
      });
    }

    const sendAmountToStore = usdtAmount;


    let transactionHashResult = "";
    let queueId = null;



    if (isSmartAccount) {


      const escrowWalletPrivateKey = user.escrowWalletPrivateKey;

      if (!escrowWalletPrivateKey) {
        return NextResponse.json({
          orderId: orderId,
          status: 400,
          msg: "에스크로 지갑 개인키가 없습니다.",
        });
      }





      const client = createThirdwebClient({
        secretKey: process.env.THIRDWEB_SECRET_KEY || "",
      });

      if (!client) {
        return NextResponse.json({
          orderId: orderId,
          status: 400,
          msg: "클라이언트가 없습니다.",
        });
      }


      const personalAccount = privateKeyToAccount({
        client,
        privateKey: escrowWalletPrivateKey,
      });
    
      if (!personalAccount) {
        return NextResponse.json({
          orderId: orderId,
          status: 400,
          msg: "개인 계정이 없습니다.",
        });
      }


      const wallet = smartWallet({

        chain: arbitrum,

        //factoryAddress: "0x655934C0B4bD79f52A2f7e6E60714175D5dd319b", // your own deployed account factory address
        sponsorGas: true,
      });

      // Connect the smart wallet
      const account = await wallet.connect({
        client: client,
        personalAccount: personalAccount,
      });

      if (!account) {
        return NextResponse.json({
          orderId: orderId,
          status: 400,
          msg: "계정이 없습니다.",
        });
      }

 
      const contract = getContract({
        client,
        chain: arbitrum,
        address: tokenContractAddressUSDT, // erc20 contract from thirdweb.com/explore
      });
      
                
      const transactionSendToStore = transfer({
        contract,
        to: toAddressStore,
        amount: sendAmountToStore,
      });

      const sendDataStore = await sendAndConfirmTransaction({
        transaction: transactionSendToStore,
        account: account,
      });
  
      
      if (!sendDataStore) {
        return NextResponse.json({
          orderId: orderId,
          status: 400,
          msg: "전송 실패",
        });
      }

      transactionHashResult = sendDataStore.transactionHash;

      ///console.log("transactionHashResult", transactionHashResult);


    } else {


      transactionHashResult = "0x";


    }





    console.log("Sent successfully!");



    const result = await confirmPayment({
      lang: lang,
      chain: chain,
      orderId: orderId,
      paymentAmount: paymentAmount,
      queueId: queueId,
      transactionHash: transactionHashResult,
    });
  
  
    //console.log("result", JSON.stringify(result));

    const {
      nickname: nickname,
      tradeId: tradeId,
    } = result as OrderProps;

    return NextResponse.json({
      result: result,
    });





  } catch (error) {
      
    console.log(" error=====>" + error);



  }

  


 
  return NextResponse.json({

    result: null,
    
  });
  
}

