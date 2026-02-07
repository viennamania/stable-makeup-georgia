import { NextResponse, type NextRequest } from "next/server";

import { getWebhookLogs } from "@lib/api/webhookLog";

const getTodayKSTRange = () => {
  const now = new Date();
  const KST_OFFSET = 9 * 60 * 60 * 1000;
  const kstNow = new Date(now.getTime() + KST_OFFSET);

  const year = kstNow.getUTCFullYear();
  const month = kstNow.getUTCMonth();
  const date = kstNow.getUTCDate();

  // KST midnight/start and end converted back to UTC time
  const start = new Date(Date.UTC(year, month, date, 0, 0, 0) - KST_OFFSET);
  const end = new Date(Date.UTC(year, month, date, 23, 59, 59, 999) - KST_OFFSET);

  return { start, end };
};

export async function POST(request: NextRequest) {
  let body: any = {};
  try {
    body = await request.json();
  } catch (error) {
    body = {};
  }

  const { limit } = body || {};

  const { start, end } = getTodayKSTRange();

  const result = await getWebhookLogs({
    event: "banktransfer_webhook",
    transactionType: "deposited",
    fromDate: start,
    toDate: end,
    limit: limit || 20000,
  });

  return NextResponse.json({ result });
}

export async function GET() {
  const { start, end } = getTodayKSTRange();

  const result = await getWebhookLogs({
    event: "banktransfer_webhook",
    transactionType: "deposited",
    fromDate: start,
    toDate: end,
    limit: 20000,
  });

  return NextResponse.json({ result });
}
