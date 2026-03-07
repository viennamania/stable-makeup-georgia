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
const CENTER_STORE_ADMIN_GUARD_TRANSIENT_RETRY_COUNT = Math.max(
  Number.parseInt(process.env.CENTER_STORE_ADMIN_GUARD_TRANSIENT_RETRY_COUNT || "", 10) || 2,
  1,
);
const CENTER_STORE_ADMIN_GUARD_TRANSIENT_RETRY_DELAY_MS = Math.max(
  Number.parseInt(process.env.CENTER_STORE_ADMIN_GUARD_TRANSIENT_RETRY_DELAY_MS || "", 10) || 150,
  50,
);
const CENTER_STORE_ADMIN_GUARD_ERROR_LOG_THROTTLE_MS = Math.max(
  Number(process.env.CENTER_STORE_ADMIN_GUARD_ERROR_LOG_THROTTLE_MS || 60000),
  1000,
);
const ENABLE_CENTER_STORE_ADMIN_RUNTIME_INDEX_CREATION =
  String(process.env.ENABLE_CENTER_STORE_ADMIN_RUNTIME_INDEX_CREATION || "").toLowerCase() ===
  "true";
const ENABLE_CENTER_STORE_ADMIN_NONCE_MEMORY_FALLBACK =
  String(process.env.ENABLE_CENTER_STORE_ADMIN_NONCE_MEMORY_FALLBACK || "true").toLowerCase() !==
  "false";

const globalCenterStoreAdminSecurity = globalThis as typeof globalThis & {
  __centerStoreAdminNonceIndexesReady?: boolean;
  __centerStoreAdminNonceMemoryCache?: Map<string, number>;
  __centerStoreAdminGuardLastErrorLoggedAt?: number;
  __centerStoreAdminGuardLastLogWriteErrorLoggedAt?: number;
  __centerStoreAdminGuardLastNonceFallbackLoggedAt?: number;
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const isTransientMongoError = (error: unknown): boolean => {
  if (!error || typeof error !== "object") {
    return false;
  }

  const anyError = error as any;
  const labels = anyError?.errorLabelSet instanceof Set
    ? Array.from(anyError.errorLabelSet)
    : [];
  const labelSet = new Set(labels.map((label) => String(label)));
  const name = String(anyError?.name || "");
  const message = String(anyError?.message || "");
  const code = String(anyError?.code || anyError?.cause?.code || "");
  const causeName = String(anyError?.cause?.name || "");

  if (labelSet.has("ResetPool") || labelSet.has("PoolRequestedRetry") || labelSet.has("PoolRequstedRetry")) {
    return true;
  }

  if (
    name === "MongoPoolClearedError" ||
    name === "MongoNetworkError" ||
    causeName === "MongoNetworkError"
  ) {
    return true;
  }

  if (code === "ECONNRESET") {
    return true;
  }

  return message.includes("Connection pool") || message.includes("TLS connection");
};

const withTransientMongoRetry = async <T>(work: () => Promise<T>): Promise<T> => {
  let attempt = 0;
  let lastError: unknown;

  while (attempt < CENTER_STORE_ADMIN_GUARD_TRANSIENT_RETRY_COUNT) {
    attempt += 1;

    try {
      return await work();
    } catch (error) {
      lastError = error;
      if (!isTransientMongoError(error) || attempt >= CENTER_STORE_ADMIN_GUARD_TRANSIENT_RETRY_COUNT) {
        throw error;
      }

      await sleep(CENTER_STORE_ADMIN_GUARD_TRANSIENT_RETRY_DELAY_MS * attempt);
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Unknown center-store-admin guard failure");
};

const logCenterStoreAdminGuardErrorThrottled = (message: string, error?: unknown) => {
  const now = Date.now();
  const lastLoggedAt = globalCenterStoreAdminSecurity.__centerStoreAdminGuardLastErrorLoggedAt || 0;
  if (now - lastLoggedAt < CENTER_STORE_ADMIN_GUARD_ERROR_LOG_THROTTLE_MS) {
    return;
  }

  globalCenterStoreAdminSecurity.__centerStoreAdminGuardLastErrorLoggedAt = now;
  if (typeof error === "undefined") {
    console.error(message);
    return;
  }

  console.error(message, error);
};

const logCenterStoreAdminLogWriteErrorThrottled = (error: unknown) => {
  const now = Date.now();
  const lastLoggedAt = globalCenterStoreAdminSecurity.__centerStoreAdminGuardLastLogWriteErrorLoggedAt || 0;
  if (now - lastLoggedAt < CENTER_STORE_ADMIN_GUARD_ERROR_LOG_THROTTLE_MS) {
    return;
  }

  globalCenterStoreAdminSecurity.__centerStoreAdminGuardLastLogWriteErrorLoggedAt = now;
  if (isTransientMongoError(error)) {
    console.error("center-store-admin log write skipped due to transient mongo connectivity");
  } else {
    console.error("center-store-admin log write failed:", error);
  }
};

const getCenterStoreAdminNonceMemoryCache = () => {
  if (!globalCenterStoreAdminSecurity.__centerStoreAdminNonceMemoryCache) {
    globalCenterStoreAdminSecurity.__centerStoreAdminNonceMemoryCache = new Map();
  }
  return globalCenterStoreAdminSecurity.__centerStoreAdminNonceMemoryCache;
};

const logCenterStoreAdminNonceFallbackThrottled = () => {
  const now = Date.now();
  const lastLoggedAt = globalCenterStoreAdminSecurity.__centerStoreAdminGuardLastNonceFallbackLoggedAt || 0;
  if (now - lastLoggedAt < CENTER_STORE_ADMIN_GUARD_ERROR_LOG_THROTTLE_MS) {
    return;
  }

  globalCenterStoreAdminSecurity.__centerStoreAdminGuardLastNonceFallbackLoggedAt = now;
  console.error("center-store-admin nonce fallback: using in-memory nonce cache due to mongo connectivity");
};

const consumeCenterStoreAdminNonceInMemory = ({
  nonceKey,
  ttlMs,
}: {
  nonceKey: string;
  ttlMs: number;
}) => {
  const cache = getCenterStoreAdminNonceMemoryCache();
  const now = Date.now();

  for (const [key, expiresAt] of cache.entries()) {
    if (expiresAt <= now) {
      cache.delete(key);
    }
  }

  const existingExpiry = cache.get(nonceKey);
  if (existingExpiry && existingExpiry > now) {
    return false;
  }

  cache.set(nonceKey, now + ttlMs);
  return true;
};

const ensureCenterStoreAdminNonceIndexes = async () => {
  if (globalCenterStoreAdminSecurity.__centerStoreAdminNonceIndexesReady) {
    return;
  }

  if (!ENABLE_CENTER_STORE_ADMIN_RUNTIME_INDEX_CREATION) {
    globalCenterStoreAdminSecurity.__centerStoreAdminNonceIndexesReady = true;
    return;
  }

  const dbClient = await withTransientMongoRetry(() => clientPromise);
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
    const dbClient = await withTransientMongoRetry(() => clientPromise);
    const collection = dbClient.db(dbName).collection(CENTER_STORE_ADMIN_NONCE_COLLECTION);
    await withTransientMongoRetry(() => ensureCenterStoreAdminNonceIndexes());

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

    if (ENABLE_CENTER_STORE_ADMIN_NONCE_MEMORY_FALLBACK && isTransientMongoError(error)) {
      logCenterStoreAdminNonceFallbackThrottled();
      return consumeCenterStoreAdminNonceInMemory({ nonceKey, ttlMs });
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
  try {
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
      try {
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
      } catch (error) {
        logCenterStoreAdminLogWriteErrorThrottled(error);
      }
    };

    if (!storecode) {
      void writeAdminApiCallLog({
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
      void writeAdminApiCallLog({
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
      void writeAdminApiCallLog({
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
      void writeAdminApiCallLog({
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
      void writeAdminApiCallLog({
        status: "blocked",
        reason: "invalid_signature",
      });
      return {
        ok: false,
        status: 401,
        error: "Invalid signature",
      };
    }

    const nonceConsumed = await withTransientMongoRetry(() =>
      consumeCenterStoreAdminNonce({
        route,
        walletAddress: requesterWalletAddress,
        nonce,
        signedAtIso,
      }),
    );

    if (!nonceConsumed) {
      void writeAdminApiCallLog({
        status: "blocked",
        reason: "invalid_nonce",
      });
      return {
        ok: false,
        status: 409,
        error: "Invalid nonce",
      };
    }

    const requesterAdminUser = await withTransientMongoRetry(() =>
      getOneByWalletAddress("admin", requesterWalletAddress),
    );
    const requesterIsAdmin = isGlobalAdminUser(requesterAdminUser);

    if (requesterIsAdmin) {
      void writeAdminApiCallLog({
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

    const store = await withTransientMongoRetry(() => getStoreByStorecode({ storecode }));
    const storeAdminWalletAddress = normalizeWalletAddress(store?.adminWalletAddress);

    if (!storeAdminWalletAddress) {
      void writeAdminApiCallLog({
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
      void writeAdminApiCallLog({
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

    void writeAdminApiCallLog({
      status: "allowed",
      reason: "store_admin_wallet",
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
  } catch (error) {
    if (isTransientMongoError(error)) {
      logCenterStoreAdminGuardErrorThrottled(
        "center-store-admin guard transient mongo connectivity issue",
      );
    } else {
      logCenterStoreAdminGuardErrorThrottled("center-store-admin guard failed:", error);
    }

    return {
      ok: false,
      status: 503,
      error: "Temporary database connectivity issue. Please retry.",
    };
  }
};
