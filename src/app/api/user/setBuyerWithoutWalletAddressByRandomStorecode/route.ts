import { NextResponse, type NextRequest } from "next/server";

import {
  getUserByNickname,
	insertOne,
} from '@lib/api/user';

import {
  getRandomStore,
} from '@lib/api/order';

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

import { ethers } from "ethers";



export async function POST(request: NextRequest) {

  const body = await request.json();


  const {
    userCode,
    userName,
    userBankName,
    userBankAccountNumber,
  } = body;

  //const { storecode, nickname, mobile, password } = body;

  //console.log("body", body);

  const nickname = userCode;

  const mobile = "+821012345678";
  const password = "12345678";


  /*
  buyer
  Object
  depositBankName
  "국민은행"
  depositName
  "김성종"
  */
  const buyer = {
    depositBankName: userBankName,
    depositBankAccountNumber: userBankAccountNumber,
    depositName: userName,
  };



  try {


    // check storecode is valid
    /*
    const store = await getStoreByStorecode({
      storecode,
    });
    //console.log("store", store);
    if (!store) {
      return NextResponse.json({
        result: "Store not found",
      });
    }
      */
     // random storecode
     const store = await getRandomStore();

     if (!store) {
      return NextResponse.json({
        result: "Store not found",
      });
     }

     console.log("store", store);

     const storecode = store?.storecode;




    // https://store.otc.earth/Api/walletAddress?storecode=2000001&memberid=google@gmail.com

    // {"result":1,"data":"0x8c1C4C15bd7e74A368E847C8278C0aB9F8182B25"}
    
    /*
    const data = await fetch(`https://store.otc.earth/Api/walletAddress?storecode=${storecode}&memberid=${memberid}`);




    const json = await data?.json();

    if (!json?.data) {
      throw new Error("No wallet address found");
    }

    const walletAddress = json?.data;



    console.log("walletAddress", walletAddress);
    */



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
      privateKey: userWalletPrivateKey,
    });
  

    if (!personalAccount) {
      return NextResponse.json({
        result: null,
      });
    }

    const wallet = smartWallet({
      chain:  polygon ,
      ///factoryAddress: "0x9Bb60d360932171292Ad2b80839080fb6F5aBD97", // your own deployed account factory address
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


    const userWalletAddress = account.address;










    const result = await insertOne({
      
      storecode: storecode,
      store: store,
      walletAddress: userWalletAddress,
      walletPrivateKey: userWalletPrivateKey,
      nickname: nickname,
      mobile: mobile,
      password: password,
      buyer: buyer,
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
