import { NextResponse, type NextRequest } from "next/server";

import {
  createThirdwebClient,
  Engine,
  getContract,
  sendAndConfirmTransaction,
  sendTransaction,
  waitForReceipt,
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

  if (!walletAddress || !toAddress || !amount) {
    return NextResponse.json({
      result: null,
      success: false,
      error: "Missing required fields: walletAddress, toAddress, amount",
    }, { status: 400 });
  }

  console.log("WithdrawVault Request Body:", body);


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
  const vaultAccessToken = process.env.THIRDWEB_VAULT_ACCESS_TOKEN?.trim() || "";

  if (!vaultAccessToken) {
    return NextResponse.json({
      result: null,
      success: false,
      error: "Missing THIRDWEB_VAULT_ACCESS_TOKEN",
      message: "Set THIRDWEB_VAULT_ACCESS_TOKEN in server env (.env.local) and restart the server.",
    }, { status: 500 });
  }


  /*
  let senderEoaAddress = walletAddress as string;

  try {
    const serverWallets = await Engine.getServerWallets({ client });
    const accounts = serverWallets?.accounts || [];
    const normalizedRequestedAddress = String(walletAddress).toLowerCase();

    const matched = accounts.find((account: any) => {
      const eoa = String(account?.address || "").toLowerCase();
      const smart = String(account?.smartAccountAddress || "").toLowerCase();
      return normalizedRequestedAddress === eoa || normalizedRequestedAddress === smart;
    });

    if (!matched) {
      return NextResponse.json({
        result: null,
        success: false,
        error: "Sender wallet is not registered in Thirdweb Vault",
        message: `Requested sender address (${walletAddress}) is not a vault server wallet EOA.`,
      }, { status: 400 });
    }

    senderEoaAddress = matched.address;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json({
      result: null,
      success: false,
      error: "Failed to validate vault server wallet",
      message: errorMessage,
    }, { status: 500 });
  }

  console.log("Using sender EOA address:", senderEoaAddress);


 
  
  const wallet = Engine.serverWallet({
    client,
    vaultAccessToken,
    address: senderEoaAddress, // vault server wallet signer (EOA) address
  });
  */

  console.log("Using wallet address:", walletAddress);
  // ERC4337 Smart Account address is used as the signer for the transaction, and the vault access token is used to authenticate the request to the vault. The vault will then use its own logic to determine which server wallet (EOA) to use for signing the transaction on behalf of the smart account.


  const wallet = Engine.serverWallet({
    client,
    vaultAccessToken,
    address: walletAddress, // Smart Account address used as the signer
  });

  ///console.log("wallet created for address:", wallet);


  

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

    const waitResult = await Engine.waitForTransactionHash({
      client,
      transactionId,
    });
    const { transactionHash } = waitResult;
    console.log("Transaction sent:", transactionHash);

    const receipt = await waitForReceipt(waitResult);
    const transactionSuccess = receipt.status === "success";

    if (!transactionSuccess) {
      return NextResponse.json({
        result: null,
        success: false,
        transactionId,
        transactionHash,
        receiptStatus: receipt.status,
        error: "Transfer failed: transaction reverted",
      }, { status: 500 });
    }

  
    return NextResponse.json({
      result: "Transfer successful",
      success: true,
      transactionId,
      transactionHash,
      receiptStatus: receipt.status,
    });

  } catch (error) {
    console.error("Error during transfer:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json({
      result: null,
      success: false,
      error: "Transfer failed",
      message: errorMessage,
    }, { status: 500 });
  }

  /*
  Error during transfer: Error: Error sending transaction: {"kind":"thirdweb_engine","code":"engine_bad_request","error":"Missing vaultAccessToken or walletAccessToken or awsKms credentials","correlationId":"ab2a76e2-da4b-480b-a74c-157750512875"}
  */


}
