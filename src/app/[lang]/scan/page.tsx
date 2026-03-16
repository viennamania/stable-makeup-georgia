import {
  USDT_TRANSACTION_HASH_ABLY_CHANNEL,
  USDT_TRANSACTION_HASH_ABLY_EVENT_NAME,
} from "@lib/ably/constants";
import { getPublicScanTransactionHashLogEvents } from "@lib/api/tokenTransfer";
import {
  getThirdwebInsightUsdtContractAddress,
  THIRDWEB_INSIGHT_ERC20_TRANSFER_SIG_HASH,
  THIRDWEB_INSIGHT_USDT_TRANSFER_FILTER_HINT,
  THIRDWEB_INSIGHT_USDT_TRANSFER_TOPIC,
  THIRDWEB_INSIGHT_WEBHOOK_ID_HEADER,
  THIRDWEB_INSIGHT_WEBHOOK_SIGNATURE_HEADER,
} from "@/lib/server/thirdweb-insight-webhook";

import type { ScanSnapshotResponse } from "./scan-feed-shared";
import ScanHomeClientPage from "./scan-home-client";

export const dynamic = "force-dynamic";

const INITIAL_SCAN_LIMIT = 180;

async function buildInitialScanSnapshot(): Promise<ScanSnapshotResponse> {
  const result = await getPublicScanTransactionHashLogEvents({
    limit: INITIAL_SCAN_LIMIT,
  });

  return {
    result,
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
      authHeaders: [
        "x-api-key",
        "x-signature",
        "x-timestamp",
        "x-nonce",
      ],
    },
  };
}

export default async function ScanHomePage() {
  const initialSnapshot = await buildInitialScanSnapshot();

  return <ScanHomeClientPage initialSnapshot={initialSnapshot} />;
}
