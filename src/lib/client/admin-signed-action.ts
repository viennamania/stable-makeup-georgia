"use client";

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

const normalizeActionFieldValue = (value: unknown): string => {
  if (value == null) {
    return "";
  }

  if (Array.isArray(value)) {
    return value.map((item) => normalizeActionFieldValue(item)).join(",");
  }

  if (typeof value === "object") {
    try {
      return JSON.stringify(value);
    } catch {
      return "";
    }
  }

  return String(value).trim();
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

const buildAdminActionSigningMessage = ({
  signingPrefix,
  route,
  requesterStorecode,
  requesterWalletAddress,
  nonce,
  signedAtIso,
  actionFields,
}: {
  signingPrefix: string;
  route: string;
  requesterStorecode: string;
  requesterWalletAddress: string;
  nonce: string;
  signedAtIso: string;
  actionFields: Record<string, unknown>;
}) => {
  const actionLines = Object.entries(actionFields || {})
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}:${normalizeActionFieldValue(value)}`);

  return [
    signingPrefix,
    `route:${route}`,
    `requesterStorecode:${requesterStorecode}`,
    `requesterWalletAddress:${requesterWalletAddress}`,
    `nonce:${nonce}`,
    `signedAt:${signedAtIso}`,
    ...actionLines,
  ].join("\n");
};

export const signAdminActionPayload = async ({
  account,
  route,
  signingPrefix,
  actionFields,
  requesterStorecode = "admin",
  requesterWalletAddress,
}: {
  account: Account | null | undefined;
  route: string;
  signingPrefix: string;
  actionFields?: Record<string, unknown>;
  requesterStorecode?: string;
  requesterWalletAddress?: string;
}) => {
  if (!account) {
    throw new Error("Wallet account not connected");
  }

  const normalizedStorecode = normalizeString(requesterStorecode) || "admin";
  const normalizedWalletAddress =
    normalizeWalletAddress(requesterWalletAddress) || normalizeWalletAddress(account.address);

  if (!normalizedWalletAddress) {
    throw new Error("requesterWalletAddress is required");
  }

  const nonce = createNonce();
  const signedAt = new Date().toISOString();
  const normalizedActionFields = actionFields || {};

  const signingMessage = buildAdminActionSigningMessage({
    signingPrefix,
    route,
    requesterStorecode: normalizedStorecode,
    requesterWalletAddress: normalizedWalletAddress,
    nonce,
    signedAtIso: signedAt,
    actionFields: normalizedActionFields,
  });

  const signature = await account.signMessage({
    message: signingMessage,
  });

  return {
    requesterStorecode: normalizedStorecode,
    requesterWalletAddress: normalizedWalletAddress,
    signature,
    signedAt,
    nonce,
  };
};

export const postAdminSignedJson = async ({
  account,
  route,
  signingPrefix,
  body,
  requesterStorecode = "admin",
  requesterWalletAddress,
}: {
  account: Account | null | undefined;
  route: string;
  signingPrefix: string;
  body?: Record<string, unknown>;
  requesterStorecode?: string;
  requesterWalletAddress?: string;
}) => {
  const actionFields = sanitizeActionFields(body || {});
  const signed = await signAdminActionPayload({
    account,
    route,
    signingPrefix,
    requesterStorecode,
    requesterWalletAddress,
    actionFields,
  });

  return fetch(route, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ...actionFields,
      ...signed,
    }),
  });
};
