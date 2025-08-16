import { NextResponse, type NextRequest } from "next/server";

import {
  getUserByNickname,
	insertOne,
} from '@lib/api/user';

import {
  getStoreByStorecode,
} from '@lib/api/store';



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



export async function POST(request: NextRequest) {

  const body = await request.json();

  const { storecode, nickname, mobile, password } = body;

  console.log("body", body);



  try {


    // check storecode is valid
    const store = await getStoreByStorecode({
      storecode,
    });
    //console.log("store", store);
    if (!store) {
      return NextResponse.json({
        result: "Store not found",
      });
    }




    // find user by nickname
    const user = await getUserByNickname(
      storecode,
      nickname
    );


    ///console.log("user", user);

    if (user) {
      return NextResponse.json({
        result: "User already exists",
        walletAddress: user.walletAddress,
        storecode: user?.storecode,
      });
    }


    
    const userWalletPrivateKey = ethers.Wallet.createRandom().privateKey;

    //console.log("escrowWalletPrivateKey", escrowWalletPrivateKey);

    if (!userWalletPrivateKey) {
      return NextResponse.json({
        result: null,
      });
    }



    const userWalletAddress = ethers.Wallet.fromMnemonic(userWalletPrivateKey).address;




    const result = await insertOne({
      storecode: storecode,
      walletAddress: userWalletAddress,
      walletPrivateKey: userWalletPrivateKey,
      nickname: nickname,
      mobile: mobile,
      password: password,
    });

    // return wallet address to user

    return NextResponse.json({

      result,
      walletAddress: userWalletAddress,
      
    });


  } catch (error) {
    console.log("error", error);

    return NextResponse.json({
      error,
      
    });
  }


 

  
}
