import { NextResponse, type NextRequest } from "next/server";

import { getLatestTransactionHashLogs } from "@lib/api/tokenTransfer";

export async function POST(request: NextRequest) {
  let body: any = {};
  try {
    body = await request.json();
  } catch (error) {
    body = {};
  }

  const { limit } = body;

  const logs = await getLatestTransactionHashLogs(limit || 10);

  return NextResponse.json({
    result: logs,
  });
}

export async function GET() {
  const logs = await getLatestTransactionHashLogs(10);

  return NextResponse.json({
    result: logs,
  });
}

