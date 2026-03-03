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
import { verifyAdminSignedAction } from "@/lib/server/admin-action-security";
import { access } from "fs";
import { sign } from "crypto";

const WITHDRAW_VAULT_API_DISABLED = true;
const WITHDRAW_VAULT_API_DISABLED_MESSAGE = "결과를 점검중입니다";
const WITHDRAW_VAULT_SIGNING_PREFIX = "stable-georgia:withdraw-vault:v1";

export async function POST(request: NextRequest) {

  if (WITHDRAW_VAULT_API_DISABLED) {
    return NextResponse.json({
      result: null,
      success: false,
      error: "WithdrawVault API is temporarily disabled",
      message: WITHDRAW_VAULT_API_DISABLED_MESSAGE,
    }, { status: 503 });
  }

  const body = await request.json();
  
  const {
    walletAddress,
    toAddress,
    amount,
  } = body;

  const walletAddressText = String(walletAddress || "").trim();
  const toAddressText = String(toAddress || "").trim();
  const amountText = String(amount || "").trim();

  if (!walletAddressText || !toAddressText || !amountText) {
    return NextResponse.json({
      result: null,
      success: false,
      error: "Missing required fields: walletAddress, toAddress, amount",
    }, { status: 400 });
  }

  const authResult = await verifyAdminSignedAction({
    request,
    route: "/api/vault/withdrawVault",
    signingPrefix: WITHDRAW_VAULT_SIGNING_PREFIX,
    requesterStorecodeRaw: body?.requesterStorecode,
    requesterWalletAddressRaw: body?.requesterWalletAddress,
    signatureRaw: body?.signature,
    signedAtRaw: body?.signedAt,
    nonceRaw: body?.nonce,
    actionFields: {
      walletAddress: walletAddressText.toLowerCase(),
      toAddress: toAddressText.toLowerCase(),
      amount: amountText,
    },
  });

  if (!authResult.ok) {
    return NextResponse.json({
      result: null,
      success: false,
      error: authResult.error,
    }, { status: authResult.status });
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
  let senderEoaAddress = walletAddressText;

  try {
    const serverWallets = await Engine.getServerWallets({ client });
    const accounts = serverWallets?.accounts || [];
    const normalizedRequestedAddress = String(walletAddressText).toLowerCase();

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
        message: `Requested sender address (${walletAddressText}) is not a vault server wallet EOA.`,
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

/*
const wallet = Engine.serverWallet({
  client,
  vaultAccessToken,
  address: "0xc055aD6149C32A504e6C5D6Be407671b4733aF81",
  chain: defineChain(56),
  executionOptions: {
    type: "ERC4337",
    signerAddress: "0x3Ac093D84D3ab98255E4B95ce23b481cD01afDAa",
    smartAccountAddress: "0xc055aD6149C32A504e6C5D6Be407671b4733aF81",
    entrypointVersion: "0.7",
  },
});
*/

  /*
  const wallet = Engine.serverWallet({
    client,
    vaultAccessToken,
    address: walletAddress,
    chain: chain === "ethereum" ? ethereum :
            chain === "polygon" ? polygon :
            chain === "arbitrum" ? arbitrum :
            chain === "bsc" ? bsc : arbitrum,
    executionOptions: {
      type: "ERC4337",
      signerAddress: walletAddress,
      smartAccountAddress: walletAddress,
      entrypointVersion: "0.7",
    },
  });
  */

  ///console.log("wallet created for address:", wallet);







  /*
  const wallet = Engine.serverWallet({
    client,
    vaultAccessToken,
    address: walletAddress,
    chain: chain === "ethereum" ? ethereum :
            chain === "polygon" ? polygon :
            chain === "arbitrum" ? arbitrum :
            chain === "bsc" ? bsc : arbitrum,
  });
  */









/*
const wallet = Engine.serverWallet({
    client,
    vaultAccessToken,
    address: "0xc055aD6149C32A504e6C5D6Be407671b4733aF81",
    chain: chain === "ethereum" ? ethereum :
            chain === "polygon" ? polygon :
            chain === "arbitrum" ? arbitrum :
            chain === "bsc" ? bsc : arbitrum,
    executionOptions: {
      type: "ERC4337",
      signerAddress: "0x3Ac093D84D3ab98255E4B95ce23b481cD01afDAa",
      smartAccountAddress: "0xc055aD6149C32A504e6C5D6Be407671b4733aF81",
      entrypointVersion: "0.7",
    },
  });
  */



// signer address (EOA) for the smart account
// signerAddress

  let senderEoaAddress = walletAddressText;

  try {
    const serverWallets = await Engine.getServerWallets({ client });
    const accounts = serverWallets?.accounts || [];
    const normalizedRequestedAddress = String(walletAddressText).toLowerCase();

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
        message: `Requested sender address (${walletAddressText}) is not a vault server wallet EOA.`,
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




const wallet = Engine.serverWallet({
    client,
    vaultAccessToken,
    address: walletAddressText,
    chain: chain === "ethereum" ? ethereum :
            chain === "polygon" ? polygon :
            chain === "arbitrum" ? arbitrum :
            chain === "bsc" ? bsc : arbitrum,
    executionOptions: {
      type: "ERC4337",
      
      //signerAddress: "0x3Ac093D84D3ab98255E4B95ce23b481cD01afDAa",
      signerAddress: senderEoaAddress,


      smartAccountAddress: walletAddressText,

      entrypointVersion: "0.7",
    },
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
      to: toAddressText,
      amount: amountText,
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
