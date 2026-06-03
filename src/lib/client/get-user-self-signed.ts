"use client";

import {
  ADMIN_PASSWORD_VIRTUAL_WALLET_ADDRESS,
  isAdminPasswordSessionAccount,
} from "@/lib/client/use-admin-active-account";
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
  if (isAdminPasswordSessionAccount(account)) {
    try {
      const response = await fetch("/api/admin-auth/session", {
        method: "GET",
        credentials: "same-origin",
        signal,
      });
      const data = await response.json();
      if (!response.ok || !data?.result?.authenticated) {
        return {
          result: null,
          error: data?.error || "Admin password session not authenticated",
        };
      }

      const session = data.result;
      return {
        result: {
          loginId: session.account?.loginId,
          nickname: session.account?.displayName || session.account?.loginId,
          name: session.account?.displayName || session.account?.loginId,
          storecode: session.requesterStorecode || storecode || "admin",
          role: session.account?.role,
          walletAddress: ADMIN_PASSWORD_VIRTUAL_WALLET_ADDRESS,
          authType: "password_session",
          allowedStorecodes: session.account?.storecodes || [],
        },
      };
    } catch (error) {
      return {
        result: null,
        error: error instanceof Error ? error.message : "Failed to read admin password session",
      };
    }
  }

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
