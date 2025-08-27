import { NextResponse, type NextRequest } from "next/server";

import {
	insertBuyOrder,
} from '@lib/api/order';

/*
import {
  getAgentByStorecode,
} from '@lib/api/agent';
*/


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
  ethereum,
  polygon,
  arbitrum,
  bsc,
 } from "thirdweb/chains";

import {
  privateKeyToAccount,
  smartWallet,
  getWalletBalance,
  
 } from "thirdweb/wallets";


import {
  chain,
  ethereumContractAddressUSDT,
  polygonContractAddressUSDT,
  arbitrumContractAddressUSDT,
  bscContractAddressUSDT,

  bscContractAddressMKRW,
} from "@/app/config/contractAddresses";



export async function POST(request: NextRequest) {

  const body = await request.json();

  const {
    storecode,
    walletAddress,
    nickname,
    usdtAmount,
    krwAmount,
    rate,
    privateSale,
    buyer,
    paymentMethod
  } = body;

  console.log("setBuyOrder =====  body", body);

  /*
  {
    lang: 'ko',
    storecode: 'agvdldan',
    walletAddress: '0x98773aF65AE660Be4751ddd09C4350906e9D88F3',
    nickname: 'mcmcmo',
    usdtAmount: 0.68,
    krwAmount: 1000,
    rate: 1480,
    privateSale: true,
    buyer: { depositBankName: '', depositName: '' }
  }
  */


  //getAgentByStorecode
  /*
  const agent = await getAgentByStorecode({
    storecode: storecode,
  });
  

  const agentcode = agent?.agentcode || null;
  */
  

  // generate escrow wallet

  const escrowWalletPrivateKey = ethers.Wallet.createRandom().privateKey;

  if (!escrowWalletPrivateKey) {
    return NextResponse.json({
      result: null,
      error: "Failed to generate escrow wallet private key",
    }, { status: 500 });
  }

  const client = createThirdwebClient({
    secretKey: process.env.THIRDWEB_SECRET_KEY || "",
  });

  if (!client) {
    return NextResponse.json({
      result: null,
      error: "Failed to create Thirdweb client",
    }, { status: 500 });
  }

  const personalAccount = privateKeyToAccount({
    client,
    privateKey: escrowWalletPrivateKey,
  });


  if (!personalAccount) {
    return NextResponse.json({
      result: null,
      error: "Failed to create personal account",
    }, { status: 500 });
  }

  const wallet = smartWallet({
    chain: chain === 'ethereum' ? ethereum : chain === 'polygon' ? polygon : chain === 'arbitrum' ? arbitrum : chain === 'bsc' ? bsc : ethereum,
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
      error: "Failed to connect smart wallet",
    }, { status: 500 });
  }

  const escrowWalletAddress = account.address;




  const result = await insertBuyOrder({
    chain: chain,
    
    //agentcode: agentcode,
    storecode: storecode,
    
    walletAddress: walletAddress,


    nickname: nickname,
    usdtAmount: usdtAmount,
    krwAmount: krwAmount,
    rate: rate,
    privateSale: privateSale,
    buyer: buyer,
    paymentMethod: paymentMethod,

    escrowWallet: {
      address: escrowWalletAddress,
      privateKey: escrowWalletPrivateKey,
    },
  });

  ///console.log("setBuyOrder =====  result", result);

  if (!result) {

    return NextResponse.json({
      result: null,
      error: "Failed to insert buy order",
    }
    , { status: 500 });

  }




 
  return NextResponse.json({

    result,
    
  });
  
}
