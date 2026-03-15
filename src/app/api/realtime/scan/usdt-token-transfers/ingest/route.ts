import { NextResponse, type NextRequest } from "next/server";

import {
  USDT_TRANSACTION_HASH_ABLY_CHANNEL,
  USDT_TRANSACTION_HASH_ABLY_EVENT_NAME,
} from "@lib/ably/constants";
import {
  createUsdtTransactionHashRealtimeEvent,
  registerUsdtTransactionHashRealtimeEvent,
} from "@lib/api/tokenTransfer";
import { verifyScanTransferEventHmacGuard } from "@/lib/server/scan-transfer-event-hmac-guard";

export const runtime = "nodejs";

const ROUTE_PATH = "/api/realtime/scan/usdt-token-transfers/ingest";

const normalizeStorecode = (value: unknown) => {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim().toLowerCase();
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      Allow: "POST, OPTIONS",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "content-type, x-api-key, x-signature, x-timestamp, x-nonce",
    },
  });
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  let body: Record<string, unknown> = {};

  try {
    body = rawBody ? JSON.parse(rawBody) : {};
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const rawStore =
    body?.store && typeof body.store === "object"
      ? (body.store as Record<string, unknown>)
      : null;
  const storecode = normalizeStorecode(body?.storecode ?? rawStore?.code);

  const guard = await verifyScanTransferEventHmacGuard({
    request,
    route: ROUTE_PATH,
    body,
    rawBody,
    storecodeRaw: storecode,
  });

  if (!guard.ok) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  const event = createUsdtTransactionHashRealtimeEvent(
    {
      ...body,
      storecode: guard.storecode,
      store: rawStore
        ? {
            ...rawStore,
            code: guard.storecode,
          }
        : {
            code: guard.storecode,
          },
    },
    {
      defaultSource: "api.realtime.scan.usdt-token-transfers.ingest",
      defaultStatus: "registered",
      defaultTokenSymbol: "USDT",
    },
  );

  if (!event) {
    return NextResponse.json({ error: "transactionHash is required" }, { status: 400 });
  }

  try {
    const result = await registerUsdtTransactionHashRealtimeEvent(event);

    return NextResponse.json(
      {
        result: {
          accepted: true,
          duplicate: result.isDuplicate,
          updated: result.wasUpdated,
          published: result.wasPublished,
          requestTimestamp: guard.requestTimestampIso,
          channel: USDT_TRANSACTION_HASH_ABLY_CHANNEL,
          eventName: USDT_TRANSACTION_HASH_ABLY_EVENT_NAME,
          event: result.event,
        },
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    console.error("Failed to ingest usdt transaction hash realtime event:", error);
    return NextResponse.json(
      {
        error: "Failed to ingest transaction hash event",
      },
      { status: 500 },
    );
  }
}
