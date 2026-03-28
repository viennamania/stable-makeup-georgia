import type { NextRequest } from "next/server";

import clientPromise, { dbName } from "@/lib/mongodb";
import {
  buildUserWalletActionSigningMessage,
  extractUserWalletActionFields,
  isPlainObject,
} from "@/lib/security/user-wallet-action-signing";
import {
  normalizeWalletAddress,
  parseSignedAtOrNull,
  verifyWalletSignatureWithFallback,
} from "@/lib/server/user-read-security";

const USER_ACTION_NONCE_COLLECTION = "userActionSecurityNonces";
const DEFAULT_USER_ACTION_NONCE_TTL_MS = 10 * 60 * 1000;

const normalizeString = (value: unknown): string => {
  if (typeof value !== "string") {
    return "";
  }
  return value.trim();
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

export const verifyUserWalletActionGuard = async ({
  request: _request,
  route,
  body,
  storecodeRaw,
  walletAddressRaw,
}: {
  request: NextRequest;
  route: string;
  body: unknown;
  storecodeRaw?: unknown;
  walletAddressRaw?: unknown;
}) => {
  const safeBody = isPlainObject(body) ? body : {};
  const storecode = normalizeString(storecodeRaw ?? safeBody.storecode);
  const walletAddress = normalizeWalletAddress(walletAddressRaw ?? safeBody.walletAddress);
  const signature = normalizeString(safeBody.signature);
  const signedAtIso = parseSignedAtOrNull(safeBody.signedAt);
  const nonce = normalizeString(safeBody.nonce);

  if (!storecode || !walletAddress) {
    return {
      ok: false as const,
      status: 400,
      error: "Missing required fields",
    };
  }

  if (!signature || !signedAtIso || !nonce) {
    return {
      ok: false as const,
      status: 401,
      error: "Invalid signature",
    };
  }

  const actionFields = extractUserWalletActionFields(safeBody);
  actionFields.storecode = storecode;
  actionFields.walletAddress = walletAddress;

  const signingMessage = buildUserWalletActionSigningMessage({
    route,
    storecode,
    walletAddress,
    nonce,
    signedAtIso,
    actionFields,
  });

  const signatureVerified = await verifyWalletSignatureWithFallback({
    walletAddress,
    signature,
    message: signingMessage,
    storecodeHint: storecode,
  });

  if (!signatureVerified) {
    return {
      ok: false as const,
      status: 401,
      error: "Invalid signature",
    };
  }

  const nonceAccepted = await consumeUserActionNonce({
    route,
    walletAddress,
    nonce,
    signedAtIso,
  });

  if (!nonceAccepted) {
    return {
      ok: false as const,
      status: 409,
      error: "Replay detected",
    };
  }

  return {
    ok: true as const,
    storecode,
    walletAddress,
    signedAtIso,
  };
};
