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

import { ethers } from "ethers";


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



export async function GET(request: NextRequest) {

  //const body = await request.json();

  //const { lang, chain, walletAddress, isSmartAccount } = body;

  const storecode = request.nextUrl.searchParams.get('storecode') || '';
  const walletAddress = request.nextUrl.searchParams.get('walletAddress') || '';

  console.log("walletAddress", walletAddress);




  
  try {


    // get user by wallet address

    const user = await getOneByWalletAddress(
      storecode,
      walletAddress
    );

    ///console.log("user", user);

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


  
    const escrowWalletPrivateKey = ethers.Wallet.createRandom().privateKey;

    return NextResponse.json({
      result: {
        escrowWalletAddress: escrowWalletAddress,
      }
    });



  } catch (error) {
      
    console.log(" error=====>" + error);

    return NextResponse.json({
      result: null,
    });

  }


}