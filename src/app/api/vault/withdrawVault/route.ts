import { NextResponse, type NextRequest } from "next/server";

import {
  createThirdwebClient,
  Engine,
  getContract,
  sendAndConfirmTransaction,
  sendTransaction,
} from "thirdweb";

import { balanceOf, transfer } from "thirdweb/extensions/erc20";
 

import {
  ethereum,
  polygon,
  arbitrum,
  bsc,
} from "thirdweb/chains";

import {
  chain,
  ethereumContractAddressUSDT,
  polygonContractAddressUSDT,
  arbitrumContractAddressUSDT,
  bscContractAddressUSDT,

  bscContractAddressMKRW,
} from "@/app/config/contractAddresses";
import { access } from "fs";


export async function POST(request: NextRequest) {

  const body = await request.json();
  
  const {
    walletAddress,
    toAddress,
    amount,
  } = body;


  const client = createThirdwebClient({
    secretKey: process.env.THIRDWEB_SECRET_KEY || "",
  });

  if (!client) {
    return NextResponse.json({
      result: null,
      error: "Thirdweb client is not initialized",
    }, { status: 500 });
  }


  // vault access token
  const vaultAccessToken = process.env.THIRDWEB_VAULT_ACCESS_TOKEN || "";

  /*
  const wallet = Engine.serverWallet({
    client,
    address: "0xf7a2B5aD9398c0E4c98ed35086617764275Bd752", // your server wallet signer (EOA) address
  });
  */
 
  
  const wallet = Engine.serverWallet({
    client,
    vaultAccessToken,
    address: walletAddress, // your server wallet signer (EOA) address
  });
  

  const contract = getContract({
    // the client you have created via `createThirdwebClient()`
    client,
    // the chain the contract is deployed on
    
    
    //chain: arbitrum,
    chain:  chain === "ethereum" ? ethereum :
            chain === "polygon" ? polygon :
            chain === "arbitrum" ? arbitrum :
            chain === "bsc" ? bsc : arbitrum,
  
  
  
    // the contract's address
    ///address: contractAddressArbitrum,

    address: chain === "ethereum" ? ethereumContractAddressUSDT :
            chain === "polygon" ? polygonContractAddressUSDT :
            chain === "arbitrum" ? arbitrumContractAddressUSDT :
            chain === "bsc" ? bscContractAddressUSDT : arbitrumContractAddressUSDT,


    // OPTIONAL: the contract's abi
    //abi: [...],
  });


  
  try {
    const transaction = transfer({
      contract,
      to: toAddress,
      amount: amount,
    });



    // enqueue the transaction
    const { transactionId } = await wallet.enqueueTransaction({
      transaction,
    });

    console.log("Transaction enqueued with ID:", transactionId);

    const { transactionHash } = await Engine.waitForTransactionHash({
      client,
      transactionId,
    });
    console.log("Transaction sent:", transactionHash);


  
    return NextResponse.json({
      result: "Transfer successful",
      transactionHash,
    });

  } catch (error) {
    console.error("Error during transfer:", error);
    return NextResponse.json({
      result: null,
      error: "Transfer failed",
    }, { status: 500 });
  }

  /*
  Error during transfer: Error: Error sending transaction: {"kind":"thirdweb_engine","code":"engine_bad_request","error":"Missing vaultAccessToken or walletAccessToken or awsKms credentials","correlationId":"ab2a76e2-da4b-480b-a74c-157750512875"}
  */


}
