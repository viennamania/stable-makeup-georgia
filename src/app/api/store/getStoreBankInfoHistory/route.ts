import { NextResponse, type NextRequest } from "next/server";

import {
  getStoreBankInfoHistory,
} from '@lib/api/store';

export async function POST(request: NextRequest) {
  const body = await request.json();

  const {
    storecode,
    limit,
    field,
    dateFrom,
    dateTo,
  } = body || {};

  if (!storecode) {
    return NextResponse.json({ result: [] });
  }

  const result = await getStoreBankInfoHistory({
    storecode: String(storecode),
    limit: Number.isFinite(Number(limit)) ? Number(limit) : 50,
    field: field ? String(field) : undefined,
    dateFrom: dateFrom ? String(dateFrom) : undefined,
    dateTo: dateTo ? String(dateTo) : undefined,
  });

  return NextResponse.json({
    result,
  });
}
