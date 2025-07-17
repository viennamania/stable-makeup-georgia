import { NextResponse, type NextRequest } from "next/server";

import {
  UserProps,
	confirmPayment,
  getOrderById,
  getOneSellOrder,
} from '@lib/api/order';

// object id
import { ObjectId } from 'mongodb';

import {
  getOneByWalletAddress 
} from '@lib/api/user';

// Download the helper library from https://www.twilio.com/docs/node/install
import twilio from "twilio";




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




if (!process.env.THIRDWEB_ENGINE_URL) {
  throw new Error("THIRDWEB_ENGINE_URL is not defined");
}

if (!process.env.THIRDWEB_ENGINE_ACCESS_TOKEN) {
  throw new Error("THIRDWEB_ENGINE_ACCESS_TOKEN is not defined");
}




// nextjs-app
export const maxDuration = 60; // This function can run for a maximum of 5 seconds

//nextjs /pages/api
/*
export const config = {
	//runtime: 'edge',
	maxDuration: 120, // This function can run for a maximum of 60 seconds
};
*/





//const chain = polygon;


// USDT Token (USDT)
const tokenContractAddressUSDT = '0xc2132D05D31c914a87C6611C10748AEb04B58e8F';

const contractAddressArbitrum = "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9"; // USDT on Arbitrum






export async function POST(request: NextRequest) {

  const body = await request.json();

  const { lang, storecode, orderId, paymentAmount, isSmartAccount } = body;

  console.log("lang", lang);
  console.log("storecode", storecode);

  console.log("orderId", orderId);

  console.log("paymentAmount", paymentAmount);

  console.log("isSmartAccount", isSmartAccount);






  
  try {



    // get buyer wallet address

    if (!ObjectId.isValid(orderId)) {
      return NextResponse.json({
        result: null,
      });
    }

    const order = await getOrderById( orderId );


    if (!order) {
      return NextResponse.json({
        result: null,
      });
    }
    

    const {
      status: status,
      walletAddress: walletAddress,
      usdtAmount: usdtAmount,
      buyer: buyer,
    } = order as UserProps;

    if (status !== "paymentRequested") {
      return NextResponse.json({
        result: null,
      });
    }

    const sellerWalletAddress = walletAddress;

    console.log("sellerWalletAddress", sellerWalletAddress);


    if (!sellerWalletAddress) {
      return NextResponse.json({
        result: null,
      });
    }

    const user = await getOneByWalletAddress(
      storecode,
      sellerWalletAddress
    );

    if (!user) {
      return NextResponse.json({
        result: null,
      });
    }


    const escrowWalletAddress = user.escrowWalletAddress;

    console.log("escrowWalletAddress", escrowWalletAddress);

    if (!escrowWalletAddress) {
      return NextResponse.json({
        result: null,
      });
    }



    const toAddressStore = buyer.walletAddress;

    if (!toAddressStore) {
      return NextResponse.json({
        result: null,
      });
    }

    const sendAmountToStore = usdtAmount;

    if (!sendAmountToStore) {
      return NextResponse.json({
        result: null,
      });
    }




    let transactionHashResult = "";
    let queueId = "";



    if (isSmartAccount) {


      const escrowWalletPrivateKey = user.escrowWalletPrivateKey;

      if (!escrowWalletPrivateKey) {
        return NextResponse.json({
          result: null,
        });
      }





      const client = createThirdwebClient({
        secretKey: process.env.THIRDWEB_SECRET_KEY || "",
      });

      if (!client) {
        return NextResponse.json({
          result: null,
        });
      }


      const personalAccount = privateKeyToAccount({
        client,
        privateKey: escrowWalletPrivateKey,
      });
    
      if (!personalAccount) {
        return NextResponse.json({
          result: null,
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
          result: null,
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
          status: 400,
          body: { error: "Invalid send data store" },
        });
      }

      transactionHashResult = sendDataStore.transactionHash;

      console.log("transactionHashResult", transactionHashResult);


    } else {




      const chainId = arbitrum.id;
      const url = process.env.THIRDWEB_ENGINE_URL + "/backend-wallet/" + chainId + "/transfer";

      ///console.log("url", url);

      const resp = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: "Bearer " + process.env.THIRDWEB_ENGINE_ACCESS_TOKEN,
          "x-backend-wallet-address": escrowWalletAddress,
        },
        body: JSON.stringify({
          to: toAddressStore,
          currencyAddress: tokenContractAddressUSDT,
          amount: sendAmountToStore,

          /*
          txOverrides: {
            gas: "530000",
            maxFeePerGas: "1000000000",
            maxPriorityFeePerGas: "1000000000",
            value: "10000000000",
          },
          */
         
        }),
      });
          



      if (!resp) {
        return NextResponse.json({
          result: null,
        });
      }

      const responseJson = await resp.json();

      console.log("responseJson", responseJson);

      queueId = responseJson.result.queueId;

      ///const hash = responseJson.result.transactionHash;

      transactionHashResult = "0x";


    }





    console.log("Sent successfully!");



    const result = await confirmPayment({
      lang: lang,
      storecode: storecode,
      orderId: orderId,
      paymentAmount: paymentAmount,

      queueId: queueId,
      
      transactionHash: transactionHashResult,
    });
  
  
    //console.log("result", JSON.stringify(result));

    const {
      nickname: nickname,
      tradeId: tradeId,
    } = result as UserProps;

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
