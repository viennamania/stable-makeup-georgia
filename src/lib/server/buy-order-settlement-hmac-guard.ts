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

const BUY_ORDER_SETTLEMENT_HMAC_NONCE_COLLECTION = "buyOrderSettlementHmacNonces";
const BUY_ORDER_SETTLEMENT_HMAC_NONCE_UNIQ_INDEX = "uniq_buy_order_settlement_hmac_nonce_key";
const BUY_ORDER_SETTLEMENT_HMAC_NONCE_TTL_INDEX = "ttl_buy_order_settlement_hmac_nonce_expires_at";

const DEFAULT_HMAC_TTL_MS = 5 * 60 * 1000;
const DEFAULT_HMAC_NONCE_TTL_MS = 10 * 60 * 1000;
const BUY_ORDER_SETTLEMENT_HMAC_SIGNING_PREFIX = "stable-georgia:buy-order-settlement:hmac:v1";

const globalBuyOrderSettlementHmac = globalThis as typeof globalThis & {
  __buyOrderSettlementHmacNonceIndexesReady?: boolean;
};

type VerifyBuyOrderSettlementHmacGuardParams = {
  request: NextRequest;
  route: string;
  body: Record<string, unknown>;
  rawBody: string;
  storecodeRaw?: unknown;
};

type VerifyBuyOrderSettlementHmacGuardResult =
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
  // Keep nonce format strict enough to avoid parser abuse.
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
  // Accept unix seconds for compatibility.
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

const ensureNonceIndexes = async () => {
  if (globalBuyOrderSettlementHmac.__buyOrderSettlementHmacNonceIndexesReady) {
    return;
  }

  const dbClient = await clientPromise;
  const collection = dbClient.db(dbName).collection(BUY_ORDER_SETTLEMENT_HMAC_NONCE_COLLECTION);

  await collection.createIndex(
    { nonceKey: 1 },
    { unique: true, name: BUY_ORDER_SETTLEMENT_HMAC_NONCE_UNIQ_INDEX }
  );
  await collection.createIndex(
    { expiresAt: 1 },
    { expireAfterSeconds: 0, name: BUY_ORDER_SETTLEMENT_HMAC_NONCE_TTL_INDEX }
  );

  globalBuyOrderSettlementHmac.__buyOrderSettlementHmacNonceIndexesReady = true;
};

const consumeNonce = async ({
  route,
  apiKey,
  nonce,
}: {
  route: string;
  apiKey: string;
  nonce: string;
}) => {
  const dbClient = await clientPromise;
  const collection = dbClient.db(dbName).collection(BUY_ORDER_SETTLEMENT_HMAC_NONCE_COLLECTION);
  await ensureNonceIndexes();

  const nonceKey = `${route}:${apiKey}:${nonce}`;
  const now = Date.now();
  const configuredTtl = Number.parseInt(
    process.env.BUY_ORDER_SETTLEMENT_HMAC_NONCE_TTL_MS || "",
    10
  );
  const ttlMs =
    Number.isFinite(configuredTtl) && configuredTtl > 0
      ? configuredTtl
      : DEFAULT_HMAC_NONCE_TTL_MS;

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

const buildSigningMessage = ({
  method,
  route,
  apiKey,
  timestampMs,
  nonce,
  bodySha256,
}: {
  method: string;
  route: string;
  apiKey: string;
  timestampMs: number;
  nonce: string;
  bodySha256: string;
}) => {
  return [
    BUY_ORDER_SETTLEMENT_HMAC_SIGNING_PREFIX,
    `method:${method}`,
    `route:${route}`,
    `apiKey:${apiKey}`,
    `timestamp:${timestampMs}`,
    `nonce:${nonce}`,
    `bodySha256:${bodySha256}`,
  ].join("\n");
};

const getHeader = (request: NextRequest, name: string) => {
  return normalizeString(request.headers.get(name));
};

export const hasBuyOrderSettlementHmacHeaders = (request: NextRequest) => {
  const apiKey = request.headers.get("x-api-key");
  const signature = request.headers.get("x-signature");
  const timestamp = request.headers.get("x-timestamp");
  const nonce = request.headers.get("x-nonce");

  return Boolean(
    apiKey
    && signature
    && timestamp
    && nonce
  );
};

export const verifyBuyOrderSettlementHmacGuard = async ({
  request,
  route,
  body,
  rawBody,
  storecodeRaw,
}: VerifyBuyOrderSettlementHmacGuardParams): Promise<VerifyBuyOrderSettlementHmacGuardResult> => {
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
      requestBody: {
        orderId: body?.orderId ?? null,
        storecode: requestedStorecode || null,
        settlementStatus:
          (body?.settlement && typeof body.settlement === "object")
            ? (body.settlement as any)?.status ?? null
            : null,
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

  const ttlMsRaw = Number.parseInt(process.env.BUY_ORDER_SETTLEMENT_HMAC_TTL_MS || "", 10);
  const ttlMs = Number.isFinite(ttlMsRaw) && ttlMsRaw > 0 ? ttlMsRaw : DEFAULT_HMAC_TTL_MS;

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
    scope: `buy-order-settlement-hmac:${route}`,
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
    route,
    apiKey,
    nonce,
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
