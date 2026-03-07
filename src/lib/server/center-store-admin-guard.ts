import { NextRequest } from "next/server";

import { insertAdminApiCallLog } from "@/lib/api/adminApiCallLog";
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
  getRequestCountry,
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
const CENTER_STORE_ADMIN_NONCE_UNIQ_INDEX = "uniq_centerStoreAdminActionNonceKey";
const CENTER_STORE_ADMIN_NONCE_TTL_INDEX = "ttl_centerStoreAdminActionNonceExpiresAt";

const globalCenterStoreAdminSecurity = globalThis as typeof globalThis & {
  __centerStoreAdminNonceIndexesReady?: boolean;
};

const ensureCenterStoreAdminNonceIndexes = async () => {
  if (globalCenterStoreAdminSecurity.__centerStoreAdminNonceIndexesReady) {
    return;
  }

  const dbClient = await clientPromise;
  const collection = dbClient.db(dbName).collection(CENTER_STORE_ADMIN_NONCE_COLLECTION);

  await collection.createIndex(
    { nonceKey: 1 },
    { unique: true, name: CENTER_STORE_ADMIN_NONCE_UNIQ_INDEX }
  );
  await collection.createIndex(
    { expiresAt: 1 },
    { expireAfterSeconds: 0, name: CENTER_STORE_ADMIN_NONCE_TTL_INDEX }
  );

  globalCenterStoreAdminSecurity.__centerStoreAdminNonceIndexesReady = true;
};

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
  await ensureCenterStoreAdminNonceIndexes();

  const nonceKey = `${route}:${walletAddress}:${nonce}`;

  const now = Date.now();
  const ttlFromNow = Number.parseInt(
    process.env.CENTER_STORE_ADMIN_NONCE_TTL_MS || "",
    10,
  );
  const ttlMs =
    Number.isFinite(ttlFromNow) && ttlFromNow > 0
      ? ttlFromNow
      : DEFAULT_CENTER_STORE_ADMIN_NONCE_TTL_MS;

  try {
    const result = await collection.updateOne(
      { nonceKey },
      {
        $setOnInsert: {
          nonceKey,
          route,
          walletAddress,
          nonce,
          signedAt: signedAtIso,
          createdAt: new Date(now),
          expiresAt: new Date(now + ttlMs),
        },
      },
      { upsert: true }
    );

    return Boolean(result.upsertedCount);
  } catch (error: any) {
    if (error?.code === 11000) {
      return false;
    }
    throw error;
  }
};

export const verifyCenterStoreAdminGuard = async ({
  request,
  route,
  body,
  storecodeRaw,
  requesterWalletAddressRaw,
}: VerifyCenterStoreAdminGuardParams): Promise<VerifyCenterStoreAdminGuardResult> => {
  const safeBody = isPlainObject(body) ? body : {};
  const actionFields = extractCenterStoreAdminActionFields(safeBody);
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
  const ip = getRequestIp(request);
  const country = getRequestCountry(request);

  const writeAdminApiCallLog = async ({
    status,
    reason,
    requesterUser,
    walletAddress,
    meta,
  }: {
    status: "allowed" | "blocked";
    reason: string;
    requesterUser?: any;
    walletAddress?: string | null;
    meta?: Record<string, unknown>;
  }) => {
    await insertAdminApiCallLog({
      route,
      guardType: "center_store_admin",
      status,
      reason,
      publicIp: ip,
      publicCountry: country,
      requesterWalletAddress: walletAddress ?? requesterWalletAddress ?? null,
      requesterUser: requesterUser || null,
      requestBody: actionFields,
      meta: {
        storecode,
        ...meta,
      },
    });
  };

  if (!storecode) {
    await writeAdminApiCallLog({
      status: "blocked",
      reason: "storecode_required",
    });
    return {
      ok: false,
      status: 400,
      error: "storecode is required",
    };
  }

  if (!requesterWalletAddress) {
    await writeAdminApiCallLog({
      status: "blocked",
      reason: "invalid_wallet_address",
      walletAddress: null,
    });
    return {
      ok: false,
      status: 401,
      error: "Invalid signature",
    };
  }

  if (!signature || !signedAtIso || !nonce) {
    await writeAdminApiCallLog({
      status: "blocked",
      reason: "missing_or_invalid_signature_fields",
    });
    return {
      ok: false,
      status: 401,
      error: "Invalid signature",
    };
  }

  const rate = consumeReadRateLimit({
    scope: `center-store-admin:${route}`,
    ip,
    walletAddress: requesterWalletAddress,
  });

  if (!rate.allowed) {
    await writeAdminApiCallLog({
      status: "blocked",
      reason: "rate_limited",
    });
    return {
      ok: false,
      status: 429,
      error: "Too many requests",
    };
  }

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
    await writeAdminApiCallLog({
      status: "blocked",
      reason: "invalid_signature",
    });
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
    await writeAdminApiCallLog({
      status: "blocked",
      reason: "invalid_nonce",
    });
    return {
      ok: false,
      status: 409,
      error: "Invalid nonce",
    };
  }

  const requesterAdminUser = await getOneByWalletAddress("admin", requesterWalletAddress);
  const requesterIsAdmin = isGlobalAdminUser(requesterAdminUser);

  if (requesterIsAdmin) {
    await writeAdminApiCallLog({
      status: "allowed",
      reason: "global_admin",
      requesterUser: requesterAdminUser,
      meta: {
        matchedBy: "global_admin",
      },
    });
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
    await writeAdminApiCallLog({
      status: "blocked",
      reason: "store_admin_wallet_not_configured",
    });
    return {
      ok: false,
      status: 403,
      error: "Forbidden",
    };
  }

  if (storeAdminWalletAddress !== requesterWalletAddress) {
    await writeAdminApiCallLog({
      status: "blocked",
      reason: "forbidden_wallet_mismatch",
      meta: {
        configuredStoreAdminWalletAddress: storeAdminWalletAddress,
      },
    });
    return {
      ok: false,
      status: 403,
      error: "Forbidden",
    };
  }

  const requesterStoreUser = await getOneByWalletAddress(storecode, requesterWalletAddress);
  await writeAdminApiCallLog({
    status: "allowed",
    reason: "store_admin_wallet",
    requesterUser: requesterStoreUser,
    meta: {
      matchedBy: "store_admin_wallet",
    },
  });
  return {
    ok: true,
    requesterWalletAddress,
    requesterIsAdmin: false,
    matchedBy: "store_admin_wallet",
  };
};
