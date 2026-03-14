import { type NextRequest } from "next/server";

import {
  USDT_TRANSACTION_HASH_ABLY_CHANNEL,
  USDT_TRANSACTION_HASH_ABLY_EVENT_NAME,
} from "@lib/ably/constants";
import {
  createPublicRealtimePreflightResponse,
  jsonWithPublicRealtimeCors,
} from "@lib/realtime/publicCors";
import { getLatestTransactionHashLogEvents } from "@lib/api/tokenTransfer";

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

  const events = await getLatestTransactionHashLogEvents({
    limit,
    address,
  });

  return jsonWithPublicRealtimeCors(
    {
      result: events,
      meta: {
        channel: USDT_TRANSACTION_HASH_ABLY_CHANNEL,
        eventName: USDT_TRANSACTION_HASH_ABLY_EVENT_NAME,
        authUrl: "/api/realtime/ably-token?public=1&stream=usdt-txhash",
        snapshotUrl: "/api/realtime/scan/usdt-token-transfers",
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
