"use client";

import { buildCenterStoreAdminSigningMessage } from "@/lib/security/center-store-admin-signing";
import type { Account } from "thirdweb/wallets";

const normalizeString = (value: unknown): string => {
  if (typeof value !== "string") {
    return "";
  }
  return value.trim();
};

const normalizeWalletAddress = (value: unknown): string => {
  return normalizeString(value).toLowerCase();
};

const sanitizeActionFields = (value: Record<string, unknown>) => {
  const next: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(value || {})) {
    if (item === undefined) {
      continue;
    }
    next[key] = item;
  }
  return next;
};

const createNonce = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

export const postCenterStoreAdminSignedJson = async ({
  account,
  route,
  body,
  storecode,
  requesterWalletAddress,
  signal,
}: {
  account: Account | null | undefined;
  route: string;
  body?: Record<string, unknown>;
  storecode?: string;
  requesterWalletAddress?: string;
  signal?: AbortSignal;
}) => {
  try {
    if (!account) {
      throw new Error("Wallet account not connected");
    }

    const actionFields = sanitizeActionFields(body || {});
    const normalizedStorecode = normalizeString(storecode ?? actionFields.storecode);
    const normalizedWalletAddress =
      normalizeWalletAddress(requesterWalletAddress ?? actionFields.walletAddress) ||
      normalizeWalletAddress(account.address);

    if (!normalizedStorecode) {
      throw new Error("storecode is required");
    }

    if (!normalizedWalletAddress) {
      throw new Error("walletAddress is required");
    }

    const normalizedBody = {
      ...actionFields,
      storecode: normalizedStorecode,
      walletAddress: normalizedWalletAddress,
    };

    const signedAt = new Date().toISOString();
    const nonce = createNonce();

    const message = buildCenterStoreAdminSigningMessage({
      route,
      storecode: normalizedStorecode,
      requesterWalletAddress: normalizedWalletAddress,
      nonce,
      signedAtIso: signedAt,
      actionFields: normalizedBody,
    });

    const signature = await account.signMessage({
      message,
    });

    return fetch(route, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      signal,
      body: JSON.stringify({
        ...normalizedBody,
        signature,
        signedAt,
        nonce,
      }),
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to sign center store admin request";

    return new Response(
      JSON.stringify({
        result: null,
        success: false,
        error: errorMessage,
      }),
      {
        status: 401,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  }
};
