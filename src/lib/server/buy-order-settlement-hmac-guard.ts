import type { NextRequest } from "next/server";

import {
  hasHmacApiKeyHeaders,
  type VerifyHmacApiGuardResult,
  verifyHmacApiGuard,
} from "@/lib/server/hmac-api-guard-core";

const BUY_ORDER_SETTLEMENT_HMAC_NONCE_COLLECTION = "buyOrderSettlementHmacNonces";
const BUY_ORDER_SETTLEMENT_HMAC_NONCE_UNIQ_INDEX = "uniq_buy_order_settlement_hmac_nonce_key";
const BUY_ORDER_SETTLEMENT_HMAC_NONCE_TTL_INDEX = "ttl_buy_order_settlement_hmac_nonce_expires_at";
const DEFAULT_HMAC_TTL_MS = 5 * 60 * 1000;
const DEFAULT_HMAC_NONCE_TTL_MS = 10 * 60 * 1000;
const BUY_ORDER_SETTLEMENT_HMAC_SIGNING_PREFIX = "stable-georgia:buy-order-settlement:hmac:v1";

type VerifyBuyOrderSettlementHmacGuardParams = {
  request: NextRequest;
  route: string;
  body: Record<string, unknown>;
  rawBody: string;
  storecodeRaw?: unknown;
};

export const hasBuyOrderSettlementHmacHeaders = hasHmacApiKeyHeaders;

export const verifyBuyOrderSettlementHmacGuard = async ({
  request,
  route,
  body,
  rawBody,
  storecodeRaw,
}: VerifyBuyOrderSettlementHmacGuardParams): Promise<VerifyHmacApiGuardResult> => {
  return verifyHmacApiGuard({
    request,
    route,
    body,
    rawBody,
    storecodeRaw,
    config: {
      signingPrefix: BUY_ORDER_SETTLEMENT_HMAC_SIGNING_PREFIX,
      nonceCollection: BUY_ORDER_SETTLEMENT_HMAC_NONCE_COLLECTION,
      nonceUniqueIndex: BUY_ORDER_SETTLEMENT_HMAC_NONCE_UNIQ_INDEX,
      nonceTtlIndex: BUY_ORDER_SETTLEMENT_HMAC_NONCE_TTL_INDEX,
      ttlEnvVar: "BUY_ORDER_SETTLEMENT_HMAC_TTL_MS",
      nonceTtlEnvVar: "BUY_ORDER_SETTLEMENT_HMAC_NONCE_TTL_MS",
      defaultTtlMs: DEFAULT_HMAC_TTL_MS,
      defaultNonceTtlMs: DEFAULT_HMAC_NONCE_TTL_MS,
      rateLimitScopePrefix: "buy-order-settlement-hmac",
      logRequestBody: (requestBody, requestedStorecode) => ({
        orderId: requestBody?.orderId ?? null,
        storecode: requestedStorecode || null,
        settlementStatus:
          requestBody?.settlement && typeof requestBody.settlement === "object"
            ? (requestBody.settlement as { status?: unknown }).status ?? null
            : null,
      }),
    },
  });
};
