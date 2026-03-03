import { NextRequest } from "next/server";

import clientPromise, { dbName } from "@/lib/mongodb";
import { getStoreByStorecode } from "@lib/api/store";
import { getOneByWalletAddress } from "@lib/api/user";
import {
  buildCenterStoreAdminSigningMessage,
  extractCenterStoreAdminActionFields,
  isPlainObject,
} from "@/lib/security/center-store-admin-signing";
import {
  consumeReadRateLimit,
  getRequestIp,
  normalizeWalletAddress,
  parseSignedAtOrNull,
  verifyWalletSignatureWithFallback,
} from "@/lib/server/user-read-security";

type VerifyCenterStoreAdminGuardParams = {
  request: NextRequest;
  route: string;
  body: unknown;
  storecodeRaw?: unknown;
  requesterWalletAddressRaw?: unknown;
};

type VerifyCenterStoreAdminGuardResult =
  | {
      ok: true;
      requesterWalletAddress: string;
      requesterIsAdmin: boolean;
      matchedBy: "store_admin_wallet" | "global_admin";
    }
  | {
      ok: false;
      status: number;
      error: string;
    };

const normalizeStorecode = (value: unknown): string => {
  if (typeof value !== "string") {
    return "";
  }
  return value.trim();
};

const normalizeString = (value: unknown): string => {
  if (typeof value !== "string") {
    return "";
  }
  return value.trim();
};

const isGlobalAdminUser = (user: any) => {
  const storecode = normalizeStorecode(user?.storecode).toLowerCase();
  const role = normalizeStorecode(user?.role).toLowerCase();
  return storecode === "admin" && role === "admin";
};

const CENTER_STORE_ADMIN_NONCE_COLLECTION = "centerStoreAdminActionNonces";
const DEFAULT_CENTER_STORE_ADMIN_NONCE_TTL_MS = 10 * 60 * 1000;

const consumeCenterStoreAdminNonce = async ({
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
  const collection = dbClient.db(dbName).collection(CENTER_STORE_ADMIN_NONCE_COLLECTION);

  const nonceKey = `${route}:${walletAddress}:${nonce}`;
  const existing = await collection.findOne({ nonceKey }, { projection: { _id: 1 } });

  if (existing) {
    return false;
  }

  const now = Date.now();
  const ttlFromNow = Number.parseInt(
    process.env.CENTER_STORE_ADMIN_NONCE_TTL_MS || "",
    10,
  );
  const ttlMs =
    Number.isFinite(ttlFromNow) && ttlFromNow > 0
      ? ttlFromNow
      : DEFAULT_CENTER_STORE_ADMIN_NONCE_TTL_MS;

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

export const verifyCenterStoreAdminGuard = async ({
  request,
  route,
  body,
  storecodeRaw,
  requesterWalletAddressRaw,
}: VerifyCenterStoreAdminGuardParams): Promise<VerifyCenterStoreAdminGuardResult> => {
  const safeBody = isPlainObject(body) ? body : {};
  const storecode = normalizeStorecode(storecodeRaw ?? safeBody.storecode);
  const requesterWalletAddress = normalizeWalletAddress(
    requesterWalletAddressRaw
      ?? safeBody.requesterWalletAddress
      ?? safeBody.walletAddress
      ?? safeBody.sellerWalletAddress,
  );
  const signature = normalizeString(safeBody.signature);
  const signedAtIso = parseSignedAtOrNull(safeBody.signedAt);
  const nonce = normalizeString(safeBody.nonce);

  if (!storecode) {
    return {
      ok: false,
      status: 400,
      error: "storecode is required",
    };
  }

  if (!requesterWalletAddress) {
    return {
      ok: false,
      status: 401,
      error: "Invalid signature",
    };
  }

  if (!signature || !signedAtIso || !nonce) {
    return {
      ok: false,
      status: 401,
      error: "Invalid signature",
    };
  }

  const ip = getRequestIp(request);
  const rate = consumeReadRateLimit({
    scope: `center-store-admin:${route}`,
    ip,
    walletAddress: requesterWalletAddress,
  });

  if (!rate.allowed) {
    return {
      ok: false,
      status: 429,
      error: "Too many requests",
    };
  }

  const actionFields = extractCenterStoreAdminActionFields(safeBody);
  const signingMessage = buildCenterStoreAdminSigningMessage({
    route,
    storecode,
    requesterWalletAddress,
    nonce,
    signedAtIso,
    actionFields,
  });

  const signatureVerified = await verifyWalletSignatureWithFallback({
    walletAddress: requesterWalletAddress,
    signature,
    message: signingMessage,
    storecodeHint: storecode,
  });

  if (!signatureVerified) {
    return {
      ok: false,
      status: 401,
      error: "Invalid signature",
    };
  }

  const nonceConsumed = await consumeCenterStoreAdminNonce({
    route,
    walletAddress: requesterWalletAddress,
    nonce,
    signedAtIso,
  });

  if (!nonceConsumed) {
    return {
      ok: false,
      status: 409,
      error: "Invalid nonce",
    };
  }

  const requesterAdminUser = await getOneByWalletAddress("admin", requesterWalletAddress);
  const requesterIsAdmin = isGlobalAdminUser(requesterAdminUser);

  if (requesterIsAdmin) {
    return {
      ok: true,
      requesterWalletAddress,
      requesterIsAdmin: true,
      matchedBy: "global_admin",
    };
  }

  const store = await getStoreByStorecode({ storecode });
  const storeAdminWalletAddress = normalizeWalletAddress(store?.adminWalletAddress);

  if (!storeAdminWalletAddress) {
    return {
      ok: false,
      status: 403,
      error: "Forbidden",
    };
  }

  if (storeAdminWalletAddress !== requesterWalletAddress) {
    return {
      ok: false,
      status: 403,
      error: "Forbidden",
    };
  }

  return {
    ok: true,
    requesterWalletAddress,
    requesterIsAdmin: false,
    matchedBy: "store_admin_wallet",
  };
};
