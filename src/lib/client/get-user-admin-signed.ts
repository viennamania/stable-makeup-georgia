"use client";

import type { Account } from "thirdweb/wallets";

const ADMIN_READ_SIGNING_PREFIX = "stable-georgia:get-user:admin:v1";

type GetUserByStorecodeAndWalletAddressSignedParams = {
  account: Account | null | undefined;
  requesterStorecode?: string;
  requesterWalletAddress?: string;
  targetStorecode?: string;
  targetWalletAddress?: string;
};

const normalize = (value: unknown): string => {
  if (typeof value !== "string") {
    return "";
  }
  return value.trim();
};

const normalizeWalletAddress = (value: unknown): string => {
  return normalize(value).toLowerCase();
};

const buildAdminReadSigningMessage = ({
  adminStorecode,
  adminWalletAddress,
  targetStorecode,
  targetWalletAddress,
  signedAtIso,
}: {
  adminStorecode: string;
  adminWalletAddress: string;
  targetStorecode: string;
  targetWalletAddress: string;
  signedAtIso: string;
}) => {
  return [
    ADMIN_READ_SIGNING_PREFIX,
    `adminStorecode:${adminStorecode}`,
    `adminWalletAddress:${adminWalletAddress}`,
    `targetStorecode:${targetStorecode}`,
    `targetWalletAddress:${targetWalletAddress}`,
    `signedAt:${signedAtIso}`,
  ].join("\n");
};

export async function postGetUserByStorecodeAndWalletAddressSigned({
  account,
  requesterStorecode,
  requesterWalletAddress,
  targetStorecode,
  targetWalletAddress,
}: GetUserByStorecodeAndWalletAddressSignedParams): Promise<any> {
  const adminStorecode = normalize(requesterStorecode) || "admin";
  const adminWalletAddress = normalizeWalletAddress(requesterWalletAddress);
  const safeTargetStorecode = normalize(targetStorecode);
  const safeTargetWalletAddress = normalizeWalletAddress(targetWalletAddress);

  if (!account) {
    return {
      result: null,
      error: "Wallet account not connected",
    };
  }

  if (!adminStorecode || !adminWalletAddress || !safeTargetStorecode || !safeTargetWalletAddress) {
    return {
      result: null,
      error: "Missing required fields",
    };
  }

  const signedAt = new Date().toISOString();
  const signingMessage = buildAdminReadSigningMessage({
    adminStorecode,
    adminWalletAddress,
    targetStorecode: safeTargetStorecode,
    targetWalletAddress: safeTargetWalletAddress,
    signedAtIso: signedAt,
  });

  try {
    const signature = await account.signMessage({
      message: signingMessage,
    });

    const response = await fetch("/api/user/getUserByStorecodeAndWalletAddress", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        storecode: safeTargetStorecode,
        walletAddress: safeTargetWalletAddress,
        requesterStorecode: adminStorecode,
        requesterWalletAddress: adminWalletAddress,
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
      error: error instanceof Error ? error.message : "Failed to sign admin read request",
    };
  }
}
