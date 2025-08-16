import { NextResponse, type NextRequest } from "next/server";

import {
  UserProps,
  getOneByWalletAddress,

  setEscrowWalletAddressByWalletAddress,

} from '@lib/api/user';


//import { ethers } from "ethers";

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



export async function POST(request: NextRequest) {

  const body = await request.json();

  const { lang, storecode, walletAddress, isSmartAccount } = body;

  console.log("lang", lang);
  console.log("storecode", storecode);
  console.log("walletAddress", walletAddress);
  console.log("isSmartAccount", isSmartAccount);






  
  try {


    // get user by wallet address

    const user = await getOneByWalletAddress(
      storecode,
      walletAddress
    );

    //console.log("user", user);

    if (!user) {
      return NextResponse.json({
        result: null,
      });
    }

    let escrowWalletAddress = user.escrowWalletAddress;

    //console.log("escrowWalletAddress", escrowWalletAddress);

    if (escrowWalletAddress) {
      return NextResponse.json({
        result: {
          escrowWalletAddress: escrowWalletAddress,
        }
      });
    }



    let escrowWalletPrivateKey = '';


    const result = await setEscrowWalletAddressByWalletAddress(
      storecode,
      walletAddress,
      escrowWalletAddress,
      escrowWalletPrivateKey,
    );

    //console.log("setEscrowWalletAddressByWalletAddress result", result);


    if (!result) {
      return NextResponse.json({
        result: null,
      });
    }

    return NextResponse.json({
      result: {
        escrowWalletAddress: escrowWalletAddress,
      }
    });



  } catch (error) {
      
    console.log(" error=====>" + error);

  }

  
  return NextResponse.json({
    result: null,
  });


}