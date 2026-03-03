"use client";

import type { Account } from "thirdweb/wallets";

const ROUTE = "/api/user/withdrawEscrowAllToWallet";
const WITHDRAW_ESCROW_SIGNING_PREFIX = "stable-georgia:withdraw-escrow-all-to-wallet:v1";

type WithdrawEscrowPayload = {
  storecode?: string;
  walletAddress?: string;
};

const normalizeString = (value: unknown): string => {
  if (typeof value !== "string") {
    return "";
  }
  return value.trim();
};

const normalizeWalletAddress = (value: unknown): string => {
  return normalizeString(value).toLowerCase();
};

const createNonce = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
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

export async function postWithdrawEscrowAllToWalletSigned({
  account,
  payload,
}: {
  account: Account | null | undefined;
  payload: WithdrawEscrowPayload;
}): Promise<any> {
  if (!account) {
    return { result: null, error: "Wallet account not connected" };
  }

  const storecode = normalizeString(payload?.storecode);
  const walletAddress =
    normalizeWalletAddress(payload?.walletAddress) || normalizeWalletAddress(account.address);

  if (!storecode || !walletAddress) {
    return { result: null, error: "Missing required fields" };
  }

  const signedAt = new Date().toISOString();
  const nonce = createNonce();
  const signingMessage = buildWithdrawEscrowSigningMessage({
    storecode,
    walletAddress,
    nonce,
    signedAtIso: signedAt,
  });

  try {
    const signature = await account.signMessage({
      message: signingMessage,
    });

    const response = await fetch(ROUTE, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        storecode,
        walletAddress,
        signature,
        signedAt,
        nonce,
      }),
    });

    const data = await response.json();
    if (!response.ok && !data?.error) {
      return {
        ...data,
        result: data?.result ?? null,
        error: `Request failed (${response.status})`,
      };
    }
    return data;
  } catch (error) {
    return {
      result: null,
      error: error instanceof Error ? error.message : "Failed to sign withdraw request",
    };
  }
}
