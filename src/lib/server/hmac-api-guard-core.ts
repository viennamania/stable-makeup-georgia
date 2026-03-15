import { createHash, createHmac, timingSafeEqual } from "crypto";
import type { NextRequest } from "next/server";

import { insertAdminApiCallLog } from "@/lib/api/adminApiCallLog";
import clientPromise, { dbName } from "@/lib/mongodb";
import {
  consumeReadRateLimit,
  getRequestCountry,
  getRequestIp,
} from "@/lib/server/user-read-security";
import {
  getActiveHmacApiKeyForVerification,
  markHmacApiKeyUsed,
} from "@/lib/server/hmac-api-key-store";

export type VerifyHmacApiGuardResult =
  | {
      ok: true;
      apiKey: string;
      storecode: string;
      requestTimestampIso: string;
    }
  | {
      ok: false;
      status: number;
      error: string;
    };

type HmacApiGuardConfig = {
  signingPrefix: string;
  nonceCollection: string;
  nonceUniqueIndex: string;
  nonceTtlIndex: string;
  ttlEnvVar?: string;
  nonceTtlEnvVar?: string;
  defaultTtlMs?: number;
  defaultNonceTtlMs?: number;
  rateLimitScopePrefix: string;
  logRequestBody?: (
    body: Record<string, unknown>,
    requestedStorecode: string,
  ) => Record<string, unknown>;
};

type VerifyHmacApiGuardParams = {
  request: NextRequest;
  route: string;
  body: Record<string, unknown>;
  rawBody: string;
  storecodeRaw?: unknown;
  config: HmacApiGuardConfig;
};

const DEFAULT_HMAC_TTL_MS = 5 * 60 * 1000;
const DEFAULT_HMAC_NONCE_TTL_MS = 10 * 60 * 1000;

const globalHmacApiGuard = globalThis as typeof globalThis & {
  __hmacApiGuardNonceIndexesReady?: Record<string, boolean>;
};

const normalizeString = (value: unknown): string => {
  if (typeof value !== "string") {
    return "";
  }
  return value.trim();
};

const normalizeStorecode = (value: unknown): string => {
  return normalizeString(value).toLowerCase();
};

const normalizeNonce = (value: unknown): string => {
  const normalized = normalizeString(value);
  if (!normalized) {
    return "";
  }
  if (!/^[a-zA-Z0-9._:-]{8,128}$/.test(normalized)) {
    return "";
  }
  return normalized;
};

const parseTimestampMs = (value: unknown): number | null => {
  const normalized = normalizeString(value);
  if (!normalized) {
    return null;
  }

  const numeric = Number(normalized);
  if (!Number.isFinite(numeric)) {
    return null;
  }

  const abs = Math.abs(numeric);
  if (abs > 0 && abs < 1e11) {
    return Math.round(numeric * 1000);
  }

  return Math.round(numeric);
};

const safeCompare = (left: string, right: string) => {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }
  return timingSafeEqual(leftBuffer, rightBuffer);
};

const getHeader = (request: NextRequest, name: string) => {
  return normalizeString(request.headers.get(name));
};

const getConfiguredDurationMs = ({
  envVar,
  fallbackMs,
}: {
  envVar?: string;
  fallbackMs: number;
}) => {
  const raw = envVar ? process.env[envVar] : undefined;
  const parsed = Number.parseInt(raw || "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallbackMs;
};

const ensureNonceIndexes = async ({
  collectionName,
  uniqueIndexName,
  ttlIndexName,
}: {
  collectionName: string;
  uniqueIndexName: string;
  ttlIndexName: string;
}) => {
  const readyMap = globalHmacApiGuard.__hmacApiGuardNonceIndexesReady || {};
  const cacheKey = `${collectionName}:${uniqueIndexName}:${ttlIndexName}`;

  if (readyMap[cacheKey]) {
    return;
  }

  const dbClient = await clientPromise;
  const collection = dbClient.db(dbName).collection(collectionName);

  await collection.createIndex(
    { nonceKey: 1 },
    { unique: true, name: uniqueIndexName },
  );
  await collection.createIndex(
    { expiresAt: 1 },
    { expireAfterSeconds: 0, name: ttlIndexName },
  );

  globalHmacApiGuard.__hmacApiGuardNonceIndexesReady = {
    ...readyMap,
    [cacheKey]: true,
  };
};

const consumeNonce = async ({
  collectionName,
  uniqueIndexName,
  ttlIndexName,
  route,
  apiKey,
  nonce,
  ttlMs,
}: {
  collectionName: string;
  uniqueIndexName: string;
  ttlIndexName: string;
  route: string;
  apiKey: string;
  nonce: string;
  ttlMs: number;
}) => {
  await ensureNonceIndexes({
    collectionName,
    uniqueIndexName,
    ttlIndexName,
  });

  const dbClient = await clientPromise;
  const collection = dbClient.db(dbName).collection(collectionName);
  const nonceKey = `${route}:${apiKey}:${nonce}`;
  const now = Date.now();

  try {
    const result = await collection.updateOne(
      { nonceKey },
      {
        $setOnInsert: {
          nonceKey,
          route,
          apiKey,
          nonce,
          createdAt: new Date(now),
          expiresAt: new Date(now + ttlMs),
        },
      },
      { upsert: true },
    );
    return Boolean(result.upsertedCount);
  } catch (error: any) {
    if (error?.code === 11000) {
      return false;
    }
    throw error;
  }
};

const buildSigningMessage = ({
  signingPrefix,
  method,
  route,
  apiKey,
  timestampMs,
  nonce,
  bodySha256,
}: {
  signingPrefix: string;
  method: string;
  route: string;
  apiKey: string;
  timestampMs: number;
  nonce: string;
  bodySha256: string;
}) => {
  return [
    signingPrefix,
    `method:${method}`,
    `route:${route}`,
    `apiKey:${apiKey}`,
    `timestamp:${timestampMs}`,
    `nonce:${nonce}`,
    `bodySha256:${bodySha256}`,
  ].join("\n");
};

export const hasHmacApiKeyHeaders = (request: NextRequest) => {
  const apiKey = request.headers.get("x-api-key");
  const signature = request.headers.get("x-signature");
  const timestamp = request.headers.get("x-timestamp");
  const nonce = request.headers.get("x-nonce");

  return Boolean(
    apiKey
    && signature
    && timestamp
    && nonce,
  );
};

export const verifyHmacApiGuard = async ({
  request,
  route,
  body,
  rawBody,
  storecodeRaw,
  config,
}: VerifyHmacApiGuardParams): Promise<VerifyHmacApiGuardResult> => {
  const ip = getRequestIp(request);
  const country = getRequestCountry(request);
  const requestedStorecode = normalizeStorecode(storecodeRaw ?? body?.storecode);
  const apiKey = getHeader(request, "x-api-key");
  const nonce = normalizeNonce(getHeader(request, "x-nonce"));
  const providedSignatureRaw = getHeader(request, "x-signature");
  const timestampMs = parseTimestampMs(getHeader(request, "x-timestamp"));

  const writeLog = async ({
    status,
    reason,
    meta,
  }: {
    status: "allowed" | "blocked";
    reason: string;
    meta?: Record<string, unknown>;
  }) => {
    await insertAdminApiCallLog({
      route,
      guardType: "hmac_api_key",
      status,
      reason,
      publicIp: ip,
      publicCountry: country,
      requesterWalletAddress: apiKey ? `hmac:${apiKey}` : null,
      requesterUser: null,
      requestBody: config.logRequestBody
        ? config.logRequestBody(body, requestedStorecode)
        : {
            storecode: requestedStorecode || null,
          },
      meta: {
        apiKey: apiKey || null,
        ...meta,
      },
    });
  };

  if (!apiKey || !nonce || !providedSignatureRaw || !timestampMs) {
    await writeLog({
      status: "blocked",
      reason: "missing_or_invalid_hmac_headers",
    });
    return {
      ok: false,
      status: 401,
      error: "Invalid HMAC auth headers",
    };
  }

  let keyConfig: {
    keyId: string;
    secret: string;
    allowedStorecodes: string[];
  } | null = null;

  try {
    keyConfig = await getActiveHmacApiKeyForVerification({
      keyIdRaw: apiKey,
      routeRaw: route,
    });
  } catch (error) {
    await writeLog({
      status: "blocked",
      reason: "hmac_key_store_error",
      meta: {
        message: error instanceof Error ? error.message : String(error),
      },
    });
    return {
      ok: false,
      status: 503,
      error: "HMAC key store is not available",
    };
  }

  if (!keyConfig) {
    await writeLog({
      status: "blocked",
      reason: "unknown_or_inactive_api_key",
    });
    return {
      ok: false,
      status: 401,
      error: "Invalid API key",
    };
  }

  if (!requestedStorecode) {
    await writeLog({
      status: "blocked",
      reason: "storecode_required",
    });
    return {
      ok: false,
      status: 400,
      error: "storecode is required",
    };
  }

  if (
    keyConfig.allowedStorecodes.length > 0
    && !keyConfig.allowedStorecodes.includes(requestedStorecode)
  ) {
    await writeLog({
      status: "blocked",
      reason: "forbidden_storecode",
      meta: {
        allowedStorecodes: keyConfig.allowedStorecodes,
        requestedStorecode,
      },
    });
    return {
      ok: false,
      status: 403,
      error: "Forbidden",
    };
  }

  const ttlMs = getConfiguredDurationMs({
    envVar: config.ttlEnvVar,
    fallbackMs: config.defaultTtlMs || DEFAULT_HMAC_TTL_MS,
  });

  if (Math.abs(Date.now() - timestampMs) > ttlMs) {
    await writeLog({
      status: "blocked",
      reason: "expired_timestamp",
    });
    return {
      ok: false,
      status: 401,
      error: "Expired request timestamp",
    };
  }

  const rate = consumeReadRateLimit({
    scope: `${config.rateLimitScopePrefix}:${route}`,
    ip,
    walletAddress: `hmac:${apiKey}`,
  });

  if (!rate.allowed) {
    await writeLog({
      status: "blocked",
      reason: "rate_limited",
    });
    return {
      ok: false,
      status: 429,
      error: "Too many requests",
    };
  }

  const normalizedProvidedSignature = providedSignatureRaw.replace(/^sha256=/i, "").trim();
  const bodySha256 = createHash("sha256").update(rawBody).digest("hex");
  const signingMessage = buildSigningMessage({
    signingPrefix: config.signingPrefix,
    method: String(request.method || "POST").toUpperCase(),
    route,
    apiKey,
    timestampMs,
    nonce,
    bodySha256,
  });

  const expectedHexSignature = createHmac("sha256", keyConfig.secret)
    .update(signingMessage)
    .digest("hex");
  const expectedBase64Signature = createHmac("sha256", keyConfig.secret)
    .update(signingMessage)
    .digest("base64");

  const signatureMatched =
    safeCompare(normalizedProvidedSignature, expectedHexSignature)
    || safeCompare(normalizedProvidedSignature, expectedBase64Signature);

  if (!signatureMatched) {
    await writeLog({
      status: "blocked",
      reason: "invalid_hmac_signature",
    });
    return {
      ok: false,
      status: 401,
      error: "Invalid HMAC signature",
    };
  }

  const nonceAccepted = await consumeNonce({
    collectionName: config.nonceCollection,
    uniqueIndexName: config.nonceUniqueIndex,
    ttlIndexName: config.nonceTtlIndex,
    route,
    apiKey,
    nonce,
    ttlMs: getConfiguredDurationMs({
      envVar: config.nonceTtlEnvVar,
      fallbackMs: config.defaultNonceTtlMs || DEFAULT_HMAC_NONCE_TTL_MS,
    }),
  });

  if (!nonceAccepted) {
    await writeLog({
      status: "blocked",
      reason: "replayed_nonce",
    });
    return {
      ok: false,
      status: 409,
      error: "Replay detected",
    };
  }

  const requestTimestampIso = new Date(timestampMs).toISOString();

  await markHmacApiKeyUsed({ keyIdRaw: keyConfig.keyId });

  await writeLog({
    status: "allowed",
    reason: "hmac_api_key",
    meta: {
      requestedStorecode,
      requestTimestampIso,
    },
  });

  return {
    ok: true,
    apiKey,
    storecode: requestedStorecode,
    requestTimestampIso,
  };
};
