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

export async function OPTIONS() {
  return createPublicRealtimePreflightResponse();
}

export async function GET(request: NextRequest) {
  const limit = Math.min(
    Math.max(Number(request.nextUrl.searchParams.get("limit")) || 60, 1),
    200,
  );
  const address = request.nextUrl.searchParams.get("address");

  const events = await getPublicScanTransactionHashLogEvents({
    limit,
    address,
  });
  const thirdwebWebhookStatus = await getThirdwebSellerUsdtWebhookStatus({
    baseUrl: request.nextUrl.origin,
  });

  return jsonWithPublicRealtimeCors(
    {
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
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
