import { NextResponse, type NextRequest } from "next/server";


import { getPayUserByWalletAddress } from "@/lib/api/user";

import { getStoreByStorecode } from "@/lib/api/store";

import { polygon, arbitrum } from "thirdweb/chains";



/*
const { privateKeyToAccount, smartWallet } = require("thirdweb/wallets");
const { polygon, arbitrum } = require("thirdweb/chains");
const {
    transfer,
    balanceOf,
} = require("thirdweb/extensions/erc20");
*/

/*
const {
    createThirdwebClient,
    getContract,
    sendAndConfirmTransaction,
    sendTransaction,
    sendBatchTransaction,
} = require("thirdweb");
 */

import { getContract, sendTransaction } from "thirdweb";



import { privateKeyToAccount, smartWallet } from "thirdweb/wallets";
import {
  balanceOf,
  transfer
} from "thirdweb/extensions/erc20";




// vercel long term





import { client as thirdwebClient } from "../../../client";




export const maxDuration = 300; // This function can run for a maximum of 300 seconds
export const dynamic = 'force-dynamic';


export async function POST(request: NextRequest) {

  const body = await request.json();



  const { walletAddress } = body;




  const chainId = arbitrum.id;

  //   const url = process.env.THIRDWEB_ENGINE_URL + "/backend-wallet/" + chainId + "/" + walletAddress + "/get-balance";

  
  //const url = process.env.THIRDWEB_ENGINE_URL + "/backend-wallet/" + chainId + "/" + walletAddress + "/get-balance";
  //https://cors.redoc.ly/contract/{chain}/{contractAddress}/erc20/balance-of

  const contractAddressPolygon = "0xc2132D05D31c914a87C6611C10748AEb04B58e8F"; // USDT on Polygon

  const contractAddressArbitrum = "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9"; // USDT on Arbitrum


  try {



    const user = await getPayUserByWalletAddress(walletAddress);

    if (!user) {

      console.log("User not found for walletAddress:", walletAddress);

      return NextResponse.json({
        result: "error",
        error: "User not found"
      });
    }

    const storecode = user.storecode;

    //get sellerWalletAddress from storecode
    const store = await getStoreByStorecode({
        storecode: storecode,
    } );


    if (!store) {
      console.log("Store not found for storecode:", storecode);

      return NextResponse.json({
        result: "error",
        error: "Store not found"
      });
    }

    const sellerWalletAddress = store.sellerWalletAddress;


    console.log("sellerWalletAddress", sellerWalletAddress);

    if (!sellerWalletAddress) {
        console.log("sellerWalletAddress not found for storecode:", storecode);
        return NextResponse.json({
            result: "error",
            error: "Seller wallet address not found"
        });
    }



    // private key


    const personalAccount = privateKeyToAccount({
        client: thirdwebClient,
        privateKey: user.walletPrivateKey,
    });

    if (!personalAccount) {
        console.log("personalAccount not found");

        return NextResponse.json({
            result: "error",
            error: "Personal account not found"
        });
    }

    const wallet = smartWallet({
        chain: arbitrum,
        ///factoryAddress: "0x655934C0B4bD79f52A2f7e6E60714175D5dd319b", // your own deployed account factory address
        sponsorGas: true,
    });
    // Connect the smart wallet
    const account = await wallet.connect({
        client: thirdwebClient,
        personalAccount: personalAccount,
    });
    if (!account) {
        console.log("account not found");
        return NextResponse.json({
            result: "error",
            error: "Account not found"
        });
    }






    //get USDT balance of walletAddress
    const balance = await balanceOf({
        contract: getContract({
            client: thirdwebClient,
            chain: arbitrum,
            address: contractAddressArbitrum,
        }),
        address: walletAddress,
    });
    if (!balance) {
        console.log("balance not found");
        return NextResponse.json({
            result: "error",
            error: "Balance not found"
        });
    }
    const clearanceUSDTBalance = Number(balance) / 10 ** 6; // USDT has 6 decimals

    console.log("clearanceUSDTBalance", clearanceUSDTBalance);



    if (clearanceUSDTBalance <= 0) {
        console.log("clearanceUSDTBalance is zero or negative");
        return NextResponse.json({
            result: "error",
            error: "Clearance USDT balance is zero or negative"
        });
    }







    // transfer USDT to sellerWalletAddress
    const transactionSendToStore = transfer({
        contract: getContract({
            client: thirdwebClient,
            chain: arbitrum,
            address: contractAddressArbitrum,
        }),
        to: sellerWalletAddress,
        amount: clearanceUSDTBalance,
    });

    const result = await sendTransaction({
        account: account,
        transaction: transactionSendToStore,
    });

    console.log("result", result);

    if (!result) {
        console.log("transaction failed");
        return NextResponse.json({
            result: "error",
            error: "Transaction failed"
        });
    }



    return NextResponse.json({

      result: "success",
      transactionHash: result.transactionHash,
      clearanceUSDTBalance: clearanceUSDTBalance,
      storecode: storecode,
      walletAddress: walletAddress,
      sellerWalletAddress: sellerWalletAddress
      
    });

  } catch (e) {

    console.error("error=", e + "");

    return NextResponse.json({
      result: "error",
      error: e + ""
    });

  }
  
}
