import { NextResponse, type NextRequest } from "next/server";
import { createThirdwebClient } from "thirdweb";
import { smartWallet, privateKeyToAccount } from "thirdweb/wallets";
import { arbitrum, bsc, ethereum, polygon } from "thirdweb/chains";
import { ethers } from "ethers";

import {
  getOneByWalletAddress,
  setEscrowWalletAddressByWalletAddress,
} from "@lib/api/user";
import { chain as configuredChain } from "@/app/config/contractAddresses";

const serverWalletChain =
  configuredChain === "ethereum"
    ? ethereum
    : configuredChain === "polygon"
      ? polygon
      : configuredChain === "bsc"
        ? bsc
        : arbitrum;

async function resolveSmartWalletAddress(client: ReturnType<typeof createThirdwebClient>, privateKey: string) {
  const personalAccount = privateKeyToAccount({
    client,
    privateKey,
  });

  const wallet = smartWallet({
    chain: serverWalletChain,
    sponsorGas: true,
  });

  const account = await wallet.connect({
    client,
    personalAccount,
  });

  return account.address;
}

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

    if (user.escrowWalletAddress && user.escrowWalletPrivateKey) {
      return NextResponse.json({
        result: {
          escrowWalletAddress: user.escrowWalletAddress,
          existed: true,
        },
      });
    }

    const client = createThirdwebClient({
      secretKey,
    });

    let escrowWalletPrivateKey = String(user.escrowWalletPrivateKey || "").trim();
    if (!escrowWalletPrivateKey) {
      escrowWalletPrivateKey = ethers.Wallet.createRandom().privateKey;
    }

    const escrowWalletAddress = await resolveSmartWalletAddress(client, escrowWalletPrivateKey);

    await setEscrowWalletAddressByWalletAddress(
      storecode,
      walletAddress,
      escrowWalletAddress,
      escrowWalletPrivateKey,
    );

    return NextResponse.json({
      result: {
        escrowWalletAddress,
        existed: false,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to create escrow wallet",
      },
      { status: 500 },
    );
  }
}
