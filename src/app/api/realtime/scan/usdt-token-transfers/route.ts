import { type NextRequest } from "next/server";

import {
  USDT_TRANSACTION_HASH_ABLY_CHANNEL,
  USDT_TRANSACTION_HASH_ABLY_EVENT_NAME,
} from "@lib/ably/constants";
import {
  createPublicRealtimePreflightResponse,
  jsonWithPublicRealtimeCors,
} from "@lib/realtime/publicCors";
import { getPublicScanTransactionHashLogEvents } from "@lib/api/tokenTransfer";
import {
  getThirdwebInsightUsdtContractAddress,
  THIRDWEB_INSIGHT_ERC20_TRANSFER_SIG_HASH,
  THIRDWEB_INSIGHT_USDT_TRANSFER_FILTER_HINT,
  THIRDWEB_INSIGHT_USDT_TRANSFER_TOPIC,
  THIRDWEB_INSIGHT_WEBHOOK_ID_HEADER,
  THIRDWEB_INSIGHT_WEBHOOK_SIGNATURE_HEADER,
} from "@/lib/server/thirdweb-insight-webhook";
import { getThirdwebSellerUsdtWebhookStatus } from "@/lib/server/thirdweb-insight-webhook-sync";

export const runtime = "nodejs";

type ScanSnapshotRoutePayload = {
  result: Awaited<ReturnType<typeof getPublicScanTransactionHashLogEvents>>;
  meta: {
    channel: string;
    eventName: string;
    authUrl: string;
    snapshotUrl: string;
    ingestUrl: string;
    thirdwebWebhookUrl: string;
    thirdwebWebhookHeaders: string[];
    thirdwebWebhookTopic: string;
    thirdwebWebhookContractAddress: string;
    thirdwebWebhookSigHash: string;
    thirdwebWebhookFilterHint: string;
    thirdwebWebhookStatus?: Awaited<ReturnType<typeof getThirdwebSellerUsdtWebhookStatus>>;
    authHeaders: string[];
    limit: number;
    address: string | null;
  };
};

type ScanSnapshotCacheEntry = {
  expiresAt: number;
  payload: ScanSnapshotRoutePayload;
};

const SNAPSHOT_CACHE_TTL_MS = Math.max(
  Number.parseInt(process.env.PUBLIC_SCAN_SNAPSHOT_CACHE_TTL_MS || "", 10) || 5_000,
  1_000,
);
const scanSnapshotRouteCache = new Map<string, ScanSnapshotCacheEntry>();
const scanSnapshotRouteInflight = new Map<string, Promise<ScanSnapshotRoutePayload>>();

function buildScanSnapshotRouteCacheKey({
  limit,
  address,
  metaOnly,
  includeThirdwebStatus,
  origin,
}: {
  limit: number;
  address: string | null;
  metaOnly: boolean;
  includeThirdwebStatus: boolean;
  origin: string;
}): string {
  return JSON.stringify({
    limit,
    address: address || "",
    metaOnly,
    includeThirdwebStatus,
    origin,
  });
}

async function buildScanSnapshotRoutePayload({
  limit,
  address,
  metaOnly,
  includeThirdwebStatus,
  origin,
}: {
  limit: number;
  address: string | null;
  metaOnly: boolean;
  includeThirdwebStatus: boolean;
  origin: string;
}): Promise<ScanSnapshotRoutePayload> {
  const [events, thirdwebWebhookStatus] = await Promise.all([
    metaOnly
      ? Promise.resolve([])
      : getPublicScanTransactionHashLogEvents({
          limit,
          address,
        }),
    includeThirdwebStatus
      ? getThirdwebSellerUsdtWebhookStatus({
          baseUrl: origin,
        })
      : Promise.resolve(undefined),
  ]);

  return {
    result: events,
    meta: {
      channel: USDT_TRANSACTION_HASH_ABLY_CHANNEL,
      eventName: USDT_TRANSACTION_HASH_ABLY_EVENT_NAME,
      authUrl: "/api/realtime/ably-token?public=1&stream=usdt-txhash",
      snapshotUrl: "/api/realtime/scan/usdt-token-transfers",
      ingestUrl: "/api/realtime/scan/usdt-token-transfers/ingest",
      thirdwebWebhookUrl: "/api/webhook/thirdweb/usdt-token-transfers",
      thirdwebWebhookHeaders: [
        THIRDWEB_INSIGHT_WEBHOOK_ID_HEADER,
        THIRDWEB_INSIGHT_WEBHOOK_SIGNATURE_HEADER,
      ],
      thirdwebWebhookTopic: THIRDWEB_INSIGHT_USDT_TRANSFER_TOPIC,
      thirdwebWebhookContractAddress: getThirdwebInsightUsdtContractAddress(),
      thirdwebWebhookSigHash: THIRDWEB_INSIGHT_ERC20_TRANSFER_SIG_HASH,
      thirdwebWebhookFilterHint: THIRDWEB_INSIGHT_USDT_TRANSFER_FILTER_HINT,
      thirdwebWebhookStatus,
      authHeaders: [
        "x-api-key",
        "x-signature",
        "x-timestamp",
        "x-nonce",
      ],
      limit,
      address: address || null,
    },
  };
}

async function getCachedScanSnapshotRoutePayload(params: {
  limit: number;
  address: string | null;
  metaOnly: boolean;
  includeThirdwebStatus: boolean;
  origin: string;
}): Promise<ScanSnapshotRoutePayload> {
  const cacheKey = buildScanSnapshotRouteCacheKey(params);
  const now = Date.now();
  const cached = scanSnapshotRouteCache.get(cacheKey);

  if (cached && cached.expiresAt > now) {
    return cached.payload;
  }

  const inflight = scanSnapshotRouteInflight.get(cacheKey);
  if (inflight) {
    return inflight;
  }

  const promise = buildScanSnapshotRoutePayload(params)
    .then((payload) => {
      scanSnapshotRouteCache.set(cacheKey, {
        expiresAt: Date.now() + SNAPSHOT_CACHE_TTL_MS,
        payload,
      });
      scanSnapshotRouteInflight.delete(cacheKey);
      return payload;
    })
    .catch((error) => {
      scanSnapshotRouteInflight.delete(cacheKey);
      throw error;
    });

  scanSnapshotRouteInflight.set(cacheKey, promise);
  return promise;
}

export async function OPTIONS() {
  return createPublicRealtimePreflightResponse();
}

export async function GET(request: NextRequest) {
  const limit = Math.min(
    Math.max(Number(request.nextUrl.searchParams.get("limit")) || 60, 1),
    200,
  );
  const address = request.nextUrl.searchParams.get("address");
  const metaOnly = request.nextUrl.searchParams.get("metaOnly") === "1";
  const includeThirdwebStatus = request.nextUrl.searchParams.get("includeThirdwebStatus") === "1";
  const payload = await getCachedScanSnapshotRoutePayload({
    limit,
    address,
    metaOnly,
    includeThirdwebStatus,
    origin: request.nextUrl.origin,
  });

  return jsonWithPublicRealtimeCors(
    payload,
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
