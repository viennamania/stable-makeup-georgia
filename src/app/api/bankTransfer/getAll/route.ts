import { NextResponse, type NextRequest } from "next/server";

import { getBankTransfers } from '@lib/api/bankTransfer';

export async function POST(request: NextRequest) {
  const body = await request.json();

  const {
    limit,
    page,
    search,
    transactionType,
    matchStatus,
    fromDate,
    toDate,
    accountNumber,
    originalAccountNumber,
  } = body;

  const result = await getBankTransfers({
    limit: limit || 20,
    page: page || 1,
    search: search || '',
    transactionType: transactionType || '',
    matchStatus: matchStatus || '',
    fromDate: fromDate || '',
    toDate: toDate || '',
    accountNumber: accountNumber || '',
    originalAccountNumber: originalAccountNumber || '',
  });

  return NextResponse.json({
    result,
  });
}
