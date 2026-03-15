import { NextResponse, type NextRequest } from "next/server";

import {
  USDT_TRANSACTION_HASH_ABLY_CHANNEL,
  USDT_TRANSACTION_HASH_ABLY_EVENT_NAME,
} from "@lib/ably/constants";
import { registerUsdtTransactionHashRealtimeEvent } from "@lib/api/tokenTransfer";
import {
  extractThirdwebSellerUsdtTransferEvents,
  parseThirdwebInsightWebhookEnvelope,
  THIRDWEB_INSIGHT_USDT_TRANSFER_TOPIC,
  THIRDWEB_INSIGHT_WEBHOOK_ID_HEADER,
  THIRDWEB_INSIGHT_WEBHOOK_SIGNATURE_HEADER,
  validateThirdwebInsightWebhookAge,
  verifyThirdwebInsightWebhook,
} from "@/lib/server/thirdweb-insight-webhook";

export const runtime = "nodejs";

const ROUTE_PATH = "/api/webhook/thirdweb/usdt-token-transfers";

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      Allow: "POST, OPTIONS",
    },
  });
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const webhookId = request.headers.get(THIRDWEB_INSIGHT_WEBHOOK_ID_HEADER);
  const signature = request.headers.get(THIRDWEB_INSIGHT_WEBHOOK_SIGNATURE_HEADER);

  const verified = await verifyThirdwebInsightWebhook({
    rawBody,
    webhookIdRaw: webhookId,
    signatureRaw: signature,
  });
  if (!verified.ok) {
    return NextResponse.json(
      {
        error: verified.error,
        route: ROUTE_PATH,
      },
      { status: verified.status },
    );
  }

  let envelope: ReturnType<typeof parseThirdwebInsightWebhookEnvelope>;
  try {
    envelope = parseThirdwebInsightWebhookEnvelope(rawBody);
  } catch {
    return NextResponse.json(
      {
        error: "Invalid thirdweb webhook payload",
        route: ROUTE_PATH,
      },
      { status: 400 },
    );
  }

  const ageValidation = validateThirdwebInsightWebhookAge(envelope.timestamp);
  if (!ageValidation.ok) {
    return NextResponse.json(
      {
        error: ageValidation.error,
        route: ROUTE_PATH,
      },
      { status: ageValidation.status },
    );
  }

  const extracted = await extractThirdwebSellerUsdtTransferEvents(envelope);
  if (extracted.topic !== THIRDWEB_INSIGHT_USDT_TRANSFER_TOPIC) {
    return NextResponse.json(
      {
        error: `Unsupported thirdweb webhook topic: ${extracted.topic || "-"}`,
        route: ROUTE_PATH,
      },
      { status: 400 },
    );
  }

  const results = await Promise.all(
    extracted.events.map(async (event) => registerUsdtTransactionHashRealtimeEvent(event)),
  );

  const duplicateCount = results.filter((item) => item.isDuplicate).length;
  const updatedCount = results.filter((item) => item.wasUpdated).length;
  const publishedCount = results.filter((item) => item.wasPublished).length;

  return NextResponse.json(
    {
      result: {
        accepted: true,
        verified: true,
        route: ROUTE_PATH,
        webhookId,
        topic: extracted.topic,
        sentAt: ageValidation.sentAtIso,
        receivedCount: extracted.receivedCount,
        sellerMatchedCount: extracted.acceptedCount,
        skippedCount: extracted.skippedCount,
        skippedReasons: extracted.skippedReasons,
        duplicateCount,
        updatedCount,
        publishedCount,
        channel: USDT_TRANSACTION_HASH_ABLY_CHANNEL,
        eventName: USDT_TRANSACTION_HASH_ABLY_EVENT_NAME,
      },
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
