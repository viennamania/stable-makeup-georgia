import type { NextRequest } from "next/server";

import {
  type VerifyHmacApiGuardResult,
  verifyHmacApiGuard,
} from "@/lib/server/hmac-api-guard-core";

const SCAN_TRANSFER_EVENT_HMAC_NONCE_COLLECTION = "scanTransferEventHmacNonces";
const SCAN_TRANSFER_EVENT_HMAC_NONCE_UNIQ_INDEX = "uniq_scan_transfer_event_hmac_nonce_key";
const SCAN_TRANSFER_EVENT_HMAC_NONCE_TTL_INDEX = "ttl_scan_transfer_event_hmac_nonce_expires_at";
const DEFAULT_HMAC_TTL_MS = 5 * 60 * 1000;
const DEFAULT_HMAC_NONCE_TTL_MS = 10 * 60 * 1000;
const SCAN_TRANSFER_EVENT_HMAC_SIGNING_PREFIX = "stable-georgia:scan-transfer-event:hmac:v1";

type VerifyScanTransferEventHmacGuardParams = {
  request: NextRequest;
  route: string;
  body: Record<string, unknown>;
  rawBody: string;
  storecodeRaw?: unknown;
};

export const verifyScanTransferEventHmacGuard = async ({
  request,
  route,
  body,
  rawBody,
  storecodeRaw,
}: VerifyScanTransferEventHmacGuardParams): Promise<VerifyHmacApiGuardResult> => {
  return verifyHmacApiGuard({
    request,
    route,
    body,
    rawBody,
    storecodeRaw,
    config: {
      signingPrefix: SCAN_TRANSFER_EVENT_HMAC_SIGNING_PREFIX,
      nonceCollection: SCAN_TRANSFER_EVENT_HMAC_NONCE_COLLECTION,
      nonceUniqueIndex: SCAN_TRANSFER_EVENT_HMAC_NONCE_UNIQ_INDEX,
      nonceTtlIndex: SCAN_TRANSFER_EVENT_HMAC_NONCE_TTL_INDEX,
      ttlEnvVar: "SCAN_TRANSFER_EVENT_HMAC_TTL_MS",
      nonceTtlEnvVar: "SCAN_TRANSFER_EVENT_HMAC_NONCE_TTL_MS",
      defaultTtlMs: DEFAULT_HMAC_TTL_MS,
      defaultNonceTtlMs: DEFAULT_HMAC_NONCE_TTL_MS,
      rateLimitScopePrefix: "scan-transfer-event-hmac",
      logRequestBody: (requestBody, requestedStorecode) => ({
        storecode: requestedStorecode || null,
        transactionHash: requestBody?.transactionHash ?? null,
        tradeId: requestBody?.tradeId ?? null,
        orderId: requestBody?.orderId ?? null,
        queueId: requestBody?.queueId ?? null,
        status: requestBody?.status ?? null,
      }),
    },
  });
};
