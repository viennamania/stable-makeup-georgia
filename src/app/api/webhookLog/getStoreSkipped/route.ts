import { NextResponse, type NextRequest } from "next/server";
import { getWebhookLogs } from "@lib/api/webhookLog";

const KST_OFFSET = 9 * 60 * 60 * 1000;

const getKSTRangesByOffset = (offsetDays = 0) => {
  const now = new Date();
  const kstNow = new Date(now.getTime() + KST_OFFSET);

  kstNow.setUTCDate(kstNow.getUTCDate() - offsetDays);

  const year = kstNow.getUTCFullYear();
  const month = kstNow.getUTCMonth();
  const date = kstNow.getUTCDate();

  const start = new Date(Date.UTC(year, month, date, 0, 0, 0) - KST_OFFSET);
  const end = new Date(Date.UTC(year, month, date, 23, 59, 59, 999) - KST_OFFSET);

  return { start, end };
};

const rangeToOffset = (range?: string) => {
  if (range === "yesterday") return 1;
  if (range === "dayBeforeYesterday") return 2;
  return 0;
};

const buildReasonStats = (logs: any[]) => {
  const reasonMap = new Map<string, number>();

  logs.forEach((log) => {
    const reasonCode = String(log?.body?.reasonCode || "UNKNOWN");
    reasonMap.set(reasonCode, (reasonMap.get(reasonCode) || 0) + 1);
  });

  return Array.from(reasonMap.entries())
    .map(([reasonCode, count]) => ({ reasonCode, count }))
    .sort((a, b) => b.count - a.count);
};

export async function POST(request: NextRequest) {
  let body: any = {};
  try {
    body = await request.json();
  } catch (error) {
    body = {};
  }

  const { limit, range, reasonCode } = body || {};
  const { start, end } = getKSTRangesByOffset(rangeToOffset(range));

  const result = await getWebhookLogs({
    event: "banktransfer_store_skipped",
    reasonCode: reasonCode || "",
    fromDate: start,
    toDate: end,
    limit: limit || 20000,
  });

  return NextResponse.json({
    result,
    reasonStats: buildReasonStats(result?.logs || []),
  });
}

export async function GET() {
  const { start, end } = getKSTRangesByOffset(0);

  const result = await getWebhookLogs({
    event: "banktransfer_store_skipped",
    fromDate: start,
    toDate: end,
    limit: 20000,
  });

  return NextResponse.json({
    result,
    reasonStats: buildReasonStats(result?.logs || []),
  });
}
