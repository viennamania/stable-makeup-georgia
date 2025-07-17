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




import { Network, Alchemy } from 'alchemy-sdk';




const settings = {
  apiKey: process.env.ALCHEMY_API_KEY,
  network: Network.MATIC_MAINNET,
};

const alchemy = new Alchemy(settings);




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

  const { lang, storecode, walletAddress, amount, isSmartAccount } = body;

  console.log("lang", lang);
  console.log("storecode", storecode);

  console.log("walletAddress", walletAddress);
  console.log("isSmartAccount", isSmartAccount);






  
  try {



    
    const user = await getOneByWalletAddress(
      storecode,
      walletAddress
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



    const toAddressStore = walletAddress;

    if (!toAddressStore) {
      return NextResponse.json({
        result: null,
      });
    }




    const sendAmountToStore = amount;


    console.log("escrowWalletAddress", escrowWalletAddress);
    console.log("toAddressStore", toAddressStore);
    console.log("sendAmountToStore", sendAmountToStore);



    if (!sendAmountToStore) {
      return NextResponse.json({
        result: null,
      });
    }




    let transactionHashResult = "";
    let queueId = "";



      const chainId = arbitrum.id;
      const url = process.env.THIRDWEB_ENGINE_URL + "/backend-wallet/" + chainId + "/transfer";

      ///console.log("url", url);
      /*
      const resp = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: "Bearer " + process.env.THIRDWEB_ENGINE_ACCESS_TOKEN,
          "x-backend-wallet-address": escrowWalletAddress,
        },
        body: JSON.stringify({
          to: toAddressStore,
          currencyAddress: chain === "polygon" ? tokenContractAddressUSDT : contractAddressArbitrum,
          amount: sendAmountToStore,
          txOverrides: {
            gas: "530000",
            maxFeePerGas: "1000000000",
            maxPriorityFeePerGas: "1000000000",
            value: "10000000000",
          },
        }),
      });
      */
      // =====>  queue error




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

        }),
      });




          

      ///console.log("resp", resp);


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








    console.log("Sent successfully!");


  

    return NextResponse.json({
      result: {
        transactionHash: transactionHashResult,
        queueId: queueId,
      },
    });





  } catch (error) {
      
    console.log(" error=====>" + error);



  }

  


 
  return NextResponse.json({

    result: null,
    
  });
  
}
