import { NextResponse, type NextRequest } from "next/server";
import { createThirdwebClient, getContract, sendAndConfirmTransaction } from "thirdweb";
import { smartWallet, privateKeyToAccount } from "thirdweb/wallets";
import { transfer, balanceOf } from "thirdweb/extensions/erc20";
import { arbitrum, bsc, ethereum, polygon } from "thirdweb/chains";
import { ethers } from "ethers";

import { getOneByWalletAddress } from "@lib/api/user";
import {
  chain as configuredChain,
  ethereumContractAddressUSDT,
  polygonContractAddressUSDT,
  arbitrumContractAddressUSDT,
  bscContractAddressUSDT,
} from "@/app/config/contractAddresses";

const activeChain =
  configuredChain === "ethereum"
    ? ethereum
    : configuredChain === "polygon"
      ? polygon
      : configuredChain === "bsc"
        ? bsc
        : arbitrum;

const usdtContractAddress =
  configuredChain === "ethereum"
    ? ethereumContractAddressUSDT
    : configuredChain === "polygon"
      ? polygonContractAddressUSDT
      : configuredChain === "bsc"
        ? bscContractAddressUSDT
        : arbitrumContractAddressUSDT;

const usdtDecimals = configuredChain === "bsc" ? 18 : 6;

export async function POST(request: NextRequest) {
  const body = await request.json();

  const storecode = String(body?.storecode || "").trim();
  const walletAddress = String(body?.walletAddress || "").trim();

  if (!storecode || !walletAddress) {
    return NextResponse.json(
      {
        error: "Missing required fields: storecode, walletAddress",
      },
      { status: 400 },
    );
  }

  const secretKey = process.env.THIRDWEB_SECRET_KEY || "";
  if (!secretKey) {
    return NextResponse.json(
      {
        error: "THIRDWEB_SECRET_KEY is required",
      },
      { status: 500 },
    );
  }

  try {
    const user = await getOneByWalletAddress(storecode, walletAddress);

    if (!user) {
      return NextResponse.json(
        {
          error: "User not found",
        },
        { status: 404 },
      );
    }

    const escrowWalletPrivateKey = String(user.escrowWalletPrivateKey || "").trim();
    if (!escrowWalletPrivateKey) {
      return NextResponse.json(
        {
          error: "Escrow wallet private key not found",
        },
        { status: 400 },
      );
    }

    const client = createThirdwebClient({
      secretKey,
    });

    const personalAccount = privateKeyToAccount({
      client,
      privateKey: escrowWalletPrivateKey,
    });

    const wallet = smartWallet({
      chain: activeChain,
      sponsorGas: true,
    });

    const escrowAccount = await wallet.connect({
      client,
      personalAccount,
    });

    const contract = getContract({
      client,
      chain: activeChain,
      address: usdtContractAddress,
    });

    const rawBalance = await balanceOf({
      contract,
      address: escrowAccount.address,
    });

    const rawBalanceBigInt = BigInt(rawBalance as any);

    if (rawBalanceBigInt <= 0n) {
      return NextResponse.json({
        result: {
          escrowWalletAddress: escrowAccount.address,
          amountUsdt: "0",
          transactionHash: null,
        },
      });
    }

    const amountUsdtText = ethers.utils.formatUnits(rawBalanceBigInt.toString(), usdtDecimals);

    const transaction = transfer({
      contract,
      to: walletAddress,
      amount: amountUsdtText,
    });

    const receipt = await sendAndConfirmTransaction({
      transaction,
      account: escrowAccount,
    });

    return NextResponse.json({
      result: {
        escrowWalletAddress: escrowAccount.address,
        amountUsdt: amountUsdtText,
        transactionHash: receipt?.transactionHash || null,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to withdraw escrow balance",
      },
      { status: 500 },
    );
  }
}
