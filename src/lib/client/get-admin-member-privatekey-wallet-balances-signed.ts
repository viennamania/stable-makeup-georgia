"use client";

import type { Account } from "thirdweb/wallets";

const ROUTE = "/api/admin/member/getPrivateKeyWalletBalances";
const SIGNING_PREFIX = "stable-georgia:admin-member-private-key-wallet-balances:v1";

const normalizeString = (value: unknown): string => {
  if (typeof value !== "string") {
    return "";
  }
  return value.trim();
};

const normalizeWalletAddress = (value: unknown) => {
  return normalizeString(value).toLowerCase();
};

const createNonce = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

const buildSigningMessage = ({
  requesterStorecode,
  requesterWalletAddress,
  nonce,
  signedAtIso,
}: {
  requesterStorecode: string;
  requesterWalletAddress: string;
  nonce: string;
  signedAtIso: string;
}) => {
  return [
    SIGNING_PREFIX,
    `route:${ROUTE}`,
    `requesterStorecode:${requesterStorecode}`,
    `requesterWalletAddress:${requesterWalletAddress}`,
    `nonce:${nonce}`,
    `signedAt:${signedAtIso}`,
  ].join("\n");
};

export async function postAdminMemberPrivateKeyWalletBalancesSigned({
  account,
  requesterStorecode = "admin",
  requesterWalletAddress,
}: {
  account: Account | null | undefined;
  requesterStorecode?: string;
  requesterWalletAddress?: string;
}) {
  if (!account) {
    return {
      result: null,
      error: "Wallet account not connected",
    };
  }

  const normalizedStorecode = normalizeString(requesterStorecode) || "admin";
  const normalizedWalletAddress =
    normalizeWalletAddress(requesterWalletAddress) || normalizeWalletAddress(account.address);

  if (!normalizedWalletAddress) {
    return {
      result: null,
      error: "requesterWalletAddress is required",
    };
  }

  const signedAt = new Date().toISOString();
  const nonce = createNonce();
  const signingMessage = buildSigningMessage({
    requesterStorecode: normalizedStorecode,
    requesterWalletAddress: normalizedWalletAddress,
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
        requesterStorecode: normalizedStorecode,
        requesterWalletAddress: normalizedWalletAddress,
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
      error: error instanceof Error ? error.message : "Failed to sign request",
    };
  }
}
