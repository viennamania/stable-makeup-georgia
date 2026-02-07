import { NextResponse, type NextRequest } from "next/server";

import { getWebhookLogs } from "@lib/api/webhookLog";

const getKSTRangesByOffset = (offsetDays = 0) => {
  const now = new Date();
  const KST_OFFSET = 9 * 60 * 60 * 1000;
  const kstNow = new Date(now.getTime() + KST_OFFSET);

  // 이동할 날짜 적용 (KST 기준)
  kstNow.setUTCDate(kstNow.getUTCDate() - offsetDays);

  const year = kstNow.getUTCFullYear();
  const month = kstNow.getUTCMonth();
  const date = kstNow.getUTCDate();

  // KST 자정과 하루 끝을 UTC로 변환
  const start = new Date(Date.UTC(year, month, date, 0, 0, 0) - KST_OFFSET);
  const end = new Date(Date.UTC(year, month, date, 23, 59, 59, 999) - KST_OFFSET);

  return { start, end };
};

const rangeToOffset = (range?: string) => {
  if (range === "yesterday") return 1;
  if (range === "dayBeforeYesterday") return 2;
  return 0; // default: today
};

export async function POST(request: NextRequest) {
  let body: any = {};
  try {
    body = await request.json();
  } catch (error) {
    body = {};
  }

  const { limit, range } = body || {};

  const { start, end } = getKSTRangesByOffset(rangeToOffset(range));

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
  const { start, end } = getKSTRangesByOffset(0);

  const result = await getWebhookLogs({
    event: "banktransfer_webhook",
    transactionType: "deposited",
    fromDate: start,
    toDate: end,
    limit: 20000,
  });

  return NextResponse.json({ result });
}
