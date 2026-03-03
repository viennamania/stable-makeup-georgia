import { NextResponse, type NextRequest } from "next/server";
import { createThirdwebClient, getContract, sendAndConfirmTransaction } from "thirdweb";
import { smartWallet, privateKeyToAccount } from "thirdweb/wallets";
import { transfer, balanceOf } from "thirdweb/extensions/erc20";
import { arbitrum, bsc, ethereum, polygon } from "thirdweb/chains";
import { ethers } from "ethers";

import { getOneByWalletAddress } from "@lib/api/user";
import clientPromise, { dbName } from "@/lib/mongodb";
import {
  normalizeWalletAddress,
  parseSignedAtOrNull,
  verifyWalletSignatureWithFallback,
} from "@/lib/server/user-read-security";
import {
  chain as configuredChain,
  ethereumContractAddressUSDT,
  polygonContractAddressUSDT,
  arbitrumContractAddressUSDT,
  bscContractAddressUSDT,
} from "@/app/config/contractAddresses";

const ROUTE = "/api/user/withdrawEscrowAllToWallet";
const WITHDRAW_ESCROW_SIGNING_PREFIX = "stable-georgia:withdraw-escrow-all-to-wallet:v1";
const USER_ACTION_NONCE_COLLECTION = "userActionSecurityNonces";
const DEFAULT_USER_ACTION_NONCE_TTL_MS = 10 * 60 * 1000;

type WithdrawEscrowRequestBody = {
  storecode?: unknown;
  walletAddress?: unknown;
  signature?: unknown;
  signedAt?: unknown;
  nonce?: unknown;
};

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

const normalizeString = (value: unknown): string => {
  if (typeof value !== "string") {
    return "";
  }
  return value.trim();
};

const buildWithdrawEscrowSigningMessage = ({
  storecode,
  walletAddress,
  nonce,
  signedAtIso,
}: {
  storecode: string;
  walletAddress: string;
  nonce: string;
  signedAtIso: string;
}) => {
  return [
    WITHDRAW_ESCROW_SIGNING_PREFIX,
    `route:${ROUTE}`,
    `storecode:${storecode}`,
    `walletAddress:${walletAddress}`,
    `nonce:${nonce}`,
    `signedAt:${signedAtIso}`,
  ].join("\n");
};

const consumeUserActionNonce = async ({
  route,
  walletAddress,
  nonce,
  signedAtIso,
}: {
  route: string;
  walletAddress: string;
  nonce: string;
  signedAtIso: string;
}) => {
  const dbClient = await clientPromise;
  const collection = dbClient.db(dbName).collection(USER_ACTION_NONCE_COLLECTION);
  const nonceKey = `${route}:${walletAddress}:${nonce}`;

  const existing = await collection.findOne({ nonceKey }, { projection: { _id: 1 } });
  if (existing) {
    return false;
  }

  const now = Date.now();
  const ttlFromNow = Number.parseInt(process.env.USER_ACTION_NONCE_TTL_MS || "", 10);
  const ttlMs =
    Number.isFinite(ttlFromNow) && ttlFromNow > 0
      ? ttlFromNow
      : DEFAULT_USER_ACTION_NONCE_TTL_MS;

  await collection.insertOne({
    nonceKey,
    route,
    walletAddress,
    nonce,
    signedAt: signedAtIso,
    createdAt: new Date(now).toISOString(),
    expiresAt: new Date(now + ttlMs).toISOString(),
  });

  return true;
};

export async function POST(request: NextRequest) {
  let body: WithdrawEscrowRequestBody = {};
  try {
    body = (await request.json()) as WithdrawEscrowRequestBody;
  } catch {
    body = {};
  }

  const storecode = normalizeString(body?.storecode);
  const walletAddress = normalizeWalletAddress(body?.walletAddress);
  const signature = normalizeString(body?.signature);
  const signedAtIso = parseSignedAtOrNull(body?.signedAt);
  const nonce = normalizeString(body?.nonce);

  if (!storecode || !walletAddress) {
    return NextResponse.json(
      {
        error: "Missing required fields: storecode, walletAddress",
      },
      { status: 400 },
    );
  }

  if (!signature || !signedAtIso || !nonce) {
    return NextResponse.json(
      {
        error: "Invalid signature",
      },
      { status: 401 },
    );
  }

  const signingMessage = buildWithdrawEscrowSigningMessage({
    storecode,
    walletAddress,
    nonce,
    signedAtIso,
  });

  const signatureVerified = await verifyWalletSignatureWithFallback({
    walletAddress,
    signature,
    message: signingMessage,
    storecodeHint: storecode,
  });

  if (!signatureVerified) {
    return NextResponse.json(
      {
        error: "Invalid signature",
      },
      { status: 401 },
    );
  }

  const nonceAccepted = await consumeUserActionNonce({
    route: ROUTE,
    walletAddress,
    nonce,
    signedAtIso,
  });

  if (!nonceAccepted) {
    return NextResponse.json(
      {
        error: "Replay detected",
      },
      { status: 409 },
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
