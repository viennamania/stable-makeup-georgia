"use client";

import type { Account } from "thirdweb/wallets";

const SELF_READ_SIGNING_PREFIX = "stable-georgia:get-user:self:v1";

const normalize = (value: unknown): string => {
  if (typeof value !== "string") {
    return "";
  }
  return value.trim();
};

const normalizeWalletAddress = (value: unknown): string => {
  return normalize(value).toLowerCase();
};

const buildSelfReadSigningMessage = ({
  storecode,
  walletAddress,
  signedAtIso,
}: {
  storecode: string;
  walletAddress: string;
  signedAtIso: string;
}) => {
  return [
    SELF_READ_SIGNING_PREFIX,
    `storecode:${storecode}`,
    `walletAddress:${walletAddress}`,
    `signedAt:${signedAtIso}`,
  ].join("\n");
};

export async function postGetUserSelfSigned({
  account,
  storecode,
  walletAddress,
  signal,
}: {
  account: Account | null | undefined;
  storecode?: string;
  walletAddress?: string;
  signal?: AbortSignal;
}) {
  if (!account) {
    return {
      result: null,
      error: "Wallet account not connected",
    };
  }

  const safeStorecode = normalize(storecode);
  const safeWalletAddress = normalizeWalletAddress(walletAddress) || normalizeWalletAddress(account.address);

  if (!safeStorecode || !safeWalletAddress) {
    return {
      result: null,
      error: "Missing required fields",
    };
  }

  const signedAt = new Date().toISOString();
  const signingMessage = buildSelfReadSigningMessage({
    storecode: safeStorecode,
    walletAddress: safeWalletAddress,
    signedAtIso: signedAt,
  });

  try {
    const signature = await account.signMessage({
      message: signingMessage,
    });

    const response = await fetch("/api/user/getUser", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      signal,
      body: JSON.stringify({
        storecode: safeStorecode,
        walletAddress: safeWalletAddress,
        requesterWalletAddress: safeWalletAddress,
        signature,
        signedAt,
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
      error: error instanceof Error ? error.message : "Failed to sign getUser request",
    };
  }
}
