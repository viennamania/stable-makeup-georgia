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

const toStatusCode = (log: any) => {
  return String(log?.body?.result?.status || "unknown").toLowerCase();
};

const buildStatusStats = (logs: any[]) => {
  const statusMap = new Map<string, number>();

  logs.forEach((log) => {
    const status = toStatusCode(log);
    statusMap.set(status, (statusMap.get(status) || 0) + 1);
  });

  return Array.from(statusMap.entries())
    .map(([status, count]) => ({ status, count }))
    .sort((a, b) => b.count - a.count);
};

export async function POST(request: NextRequest) {
  let body: any = {};
  try {
    body = await request.json();
  } catch (error) {
    body = {};
  }

  const {
    limit,
    range,
    resultStatus,
  } = body || {};

  const { start, end } = getKSTRangesByOffset(rangeToOffset(range));

  const rawResult = await getWebhookLogs({
    event: "bankmatch_webhook",
    fromDate: start,
    toDate: end,
    limit: limit || 5000,
  });

  const allLogs = rawResult?.logs || [];

  const filteredLogs = String(resultStatus || "").trim()
    ? allLogs.filter((log: any) => toStatusCode(log) === String(resultStatus).toLowerCase())
    : allLogs;

  return NextResponse.json({
    result: {
      totalCount: filteredLogs.length,
      logs: filteredLogs,
    },
    statusStats: buildStatusStats(allLogs),
  });
}

export async function GET() {
  const { start, end } = getKSTRangesByOffset(0);

  const rawResult = await getWebhookLogs({
    event: "bankmatch_webhook",
    fromDate: start,
    toDate: end,
    limit: 5000,
  });

  const logs = rawResult?.logs || [];

  return NextResponse.json({
    result: {
      totalCount: logs.length,
      logs,
    },
    statusStats: buildStatusStats(logs),
  });
}

