import { NextResponse, type NextRequest } from "next/server";

import { getBankInfos } from '@lib/api/bankInfo';

export async function POST(request: NextRequest) {
  const body = await request.json();

  const {
    search,
    limit,
    page,
  } = body || {};

  const result = await getBankInfos({
    search: search || '',
    limit: Number(limit) || 50,
    page: Number(page) || 1,
  });

  return NextResponse.json({
    result,
  });
}
