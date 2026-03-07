import { NextResponse, type NextRequest } from "next/server";

import { getContract, sendAndConfirmTransaction } from "thirdweb";
import { arbitrum, bsc, ethereum, polygon } from "thirdweb/chains";
import { balanceOf, transfer } from "thirdweb/extensions/erc20";
import { privateKeyToAccount, smartWallet } from "thirdweb/wallets";

import { client as thirdwebClient } from "../../../client";
import {
  arbitrumContractAddressUSDT,
  bscContractAddressUSDT,
  chain,
  ethereumContractAddressUSDT,
  polygonContractAddressUSDT,
} from "@/app/config/contractAddresses";
import { getStoreByStorecode } from "@/lib/api/store";
import { getPayUserByWalletAddress } from "@/lib/api/user";
import { verifyCenterStoreAdminGuard } from "@/lib/server/center-store-admin-guard";
import { normalizeWalletAddress } from "@/lib/server/user-read-security";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

const CLEARANCE_WALLET_ROUTE = "/api/user/clearanceWalletAddress";
const DEFAULT_RPC_TIMEOUT_MS = 20_000;
const DEFAULT_TX_CONFIRM_TIMEOUT_MS = 60_000;

const normalizeString = (value: unknown) => {
  if (typeof value !== "string") {
    return "";
  }
  return value.trim();
};

const parsePositiveInt = (value: unknown, fallback: number): number => {
  const parsed = Number.parseInt(normalizeString(value), 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return parsed;
};

const withTimeout = async <T>(
  promise: Promise<T>,
  timeoutMs: number,
  timeoutMessage: string,
): Promise<T> => {
  const safeTimeoutMs = Math.max(1_000, timeoutMs);
  let timer: ReturnType<typeof setTimeout> | null = null;

  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => reject(new Error(timeoutMessage)), safeTimeoutMs);
      }),
    ]);
  } finally {
    if (timer) {
      clearTimeout(timer);
    }
  }
};

export async function POST(request: NextRequest) {
  let body: Record<string, unknown> = {};
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    body = {};
  }

  const requestedWalletAddress = normalizeString(body.walletAddress);
  const requestedStorecode = normalizeString(body.storecode);
  const rpcTimeoutMs = parsePositiveInt(
    process.env.CLEARANCE_RPC_TIMEOUT_MS ?? process.env.ADMIN_PRIVATEKEY_RPC_TIMEOUT_MS,
    DEFAULT_RPC_TIMEOUT_MS,
  );
  const txConfirmTimeoutMs = parsePositiveInt(
    process.env.CLEARANCE_TX_CONFIRM_TIMEOUT_MS ?? process.env.ADMIN_PRIVATEKEY_TX_CONFIRM_TIMEOUT_MS,
    DEFAULT_TX_CONFIRM_TIMEOUT_MS,
  );

  if (!requestedWalletAddress || !requestedStorecode) {
    return NextResponse.json(
      {
        result: null,
        error: "walletAddress and storecode are required",
      },
      { status: 400 },
    );
  }

  const guard = await verifyCenterStoreAdminGuard({
    request,
    route: CLEARANCE_WALLET_ROUTE,
    body,
    storecodeRaw: requestedStorecode,
    requesterWalletAddressRaw: body.requesterWalletAddress,
  });

  if (!guard.ok) {
    return NextResponse.json(
      {
        result: null,
        error: guard.error,
      },
      { status: guard.status },
    );
  }

  const normalizedRequestedWalletAddress = normalizeWalletAddress(requestedWalletAddress);
  if (!normalizedRequestedWalletAddress) {
    return NextResponse.json(
      {
        result: null,
        error: "Invalid walletAddress",
      },
      { status: 400 },
    );
  }

  const chainConfig =
    chain === "ethereum" ? ethereum
      : chain === "polygon" ? polygon
        : chain === "arbitrum" ? arbitrum
          : chain === "bsc" ? bsc
            : arbitrum;

  const contractAddressUSDT =
    chain === "ethereum" ? ethereumContractAddressUSDT
      : chain === "polygon" ? polygonContractAddressUSDT
        : chain === "arbitrum" ? arbitrumContractAddressUSDT
          : chain === "bsc" ? bscContractAddressUSDT
            : arbitrumContractAddressUSDT;

  try {
    let user = await getPayUserByWalletAddress(requestedWalletAddress);
    if (!user && requestedWalletAddress.toLowerCase() !== normalizedRequestedWalletAddress) {
      user = await getPayUserByWalletAddress(normalizedRequestedWalletAddress);
    }

    if (!user) {
      return NextResponse.json(
        {
          result: null,
          error: "User not found",
        },
        { status: 404 },
      );
    }

    const userStorecode = normalizeString(user.storecode);
    if (!userStorecode || userStorecode.toLowerCase() !== requestedStorecode.toLowerCase()) {
      return NextResponse.json(
        {
          result: null,
          error: "Forbidden",
        },
        { status: 403 },
      );
    }

    if (!user.walletPrivateKey) {
      return NextResponse.json(
        {
          result: null,
          error: "walletPrivateKey not found for target user",
        },
        { status: 400 },
      );
    }

    const store = await getStoreByStorecode({
      storecode: userStorecode,
    });

    if (!store) {
      return NextResponse.json(
        {
          result: null,
          error: "Store not found",
        },
        { status: 404 },
      );
    }

    const sellerWalletAddress = normalizeString(store.sellerWalletAddress);
    if (!sellerWalletAddress) {
      return NextResponse.json(
        {
          result: null,
          error: "Seller wallet address not found",
        },
        { status: 400 },
      );
    }

    const personalAccount = privateKeyToAccount({
      client: thirdwebClient,
      privateKey: user.walletPrivateKey,
    });

    const wallet = smartWallet({
      chain: chainConfig,
      sponsorGas: true,
    });

    const account = await wallet.connect({
      client: thirdwebClient,
      personalAccount,
    });

    const targetWalletAddress = normalizeString(user.walletAddress) || normalizedRequestedWalletAddress;
    const balance = await withTimeout(
      balanceOf({
        contract: getContract({
          client: thirdwebClient,
          chain: chainConfig,
          address: contractAddressUSDT,
        }),
        address: targetWalletAddress,
      }),
      rpcTimeoutMs,
      "balance read timeout",
    );

    const rawBalance = Number(balance);
    if (!Number.isFinite(rawBalance) || rawBalance <= 0) {
      return NextResponse.json(
        {
          result: null,
          error: "Balance not found",
        },
        { status: 400 },
      );
    }

    let clearanceUSDTBalance = chain === "bsc"
      ? Number((rawBalance / 10 ** 18).toFixed(6))
      : rawBalance / 10 ** 6;

    if (!Number.isFinite(clearanceUSDTBalance) || clearanceUSDTBalance <= 0) {
      return NextResponse.json(
        {
          result: null,
          error: "Clearance USDT balance is zero or negative",
        },
        { status: 400 },
      );
    }

    clearanceUSDTBalance = clearanceUSDTBalance - 0.000001;
    if (!Number.isFinite(clearanceUSDTBalance) || clearanceUSDTBalance <= 0) {
      return NextResponse.json(
        {
          result: null,
          error: "Clearance USDT balance is too low after fee adjustment",
        },
        { status: 400 },
      );
    }

    const transactionSendToStore = transfer({
      contract: getContract({
        client: thirdwebClient,
        chain: chainConfig,
        address: contractAddressUSDT,
      }),
      to: sellerWalletAddress,
      amount: clearanceUSDTBalance,
    });

    const result = await withTimeout(
      sendAndConfirmTransaction({
        account,
        transaction: transactionSendToStore,
      }),
      txConfirmTimeoutMs,
      "transaction confirm timeout",
    );

    if (!result?.transactionHash) {
      return NextResponse.json(
        {
          result: null,
          error: "Transaction failed",
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      result: true,
      chain,
      transactionHash: result.transactionHash,
      clearanceUSDTBalance,
      storecode: userStorecode,
      walletAddress: targetWalletAddress,
      sellerWalletAddress,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("clearanceWalletAddress error:", message);

    return NextResponse.json(
      {
        result: null,
        error: message,
      },
      { status: 500 },
    );
  }
}
