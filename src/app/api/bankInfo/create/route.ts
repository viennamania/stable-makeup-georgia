import { NextResponse, type NextRequest } from "next/server";

import { createBankInfo, getBankInfoByRealAccountNumber } from '@lib/api/bankInfo';

const normalizeAliasAccountNumber = (input: any) => {
  if (input === undefined) {
    return undefined;
  }
  const list = Array.isArray(input) ? input : [input];
  const cleaned = list
    .map((value) => String(value || '').trim())
    .filter((value) => value.length > 0);
  return Array.from(new Set(cleaned));
};

export async function POST(request: NextRequest) {
  const body = await request.json();

  const {
    bankName,
    realAccountNumber,
    accountNumber,
    accountHolder,
    memo,
    aliasAccountNumber,
    realName,
    residentNumber,
    phoneNumber,
    idCardImageUrl,
  } = body || {};

  const normalizedAccountNumber = String(realAccountNumber ?? accountNumber ?? '').trim();

  if (!bankName || !normalizedAccountNumber || !accountHolder) {
    return NextResponse.json(
      { error: 'bankName, realAccountNumber, accountHolder are required' },
      { status: 400 }
    );
  }

  const existing = await getBankInfoByRealAccountNumber(normalizedAccountNumber);
  if (existing) {
    return NextResponse.json(
      { error: 'realAccountNumber already exists' },
      { status: 409 }
    );
  }

  const normalizedAliasAccountNumber = normalizeAliasAccountNumber(aliasAccountNumber);

  const result = await createBankInfo({
    bankName: String(bankName),
    realAccountNumber: normalizedAccountNumber,
    accountHolder: String(accountHolder),
    ...(memo !== undefined ? { memo: String(memo) } : {}),
    ...(normalizedAliasAccountNumber !== undefined
      ? { aliasAccountNumber: normalizedAliasAccountNumber }
      : {}),
    ...(realName != null ? { realName: String(realName) } : {}),
    ...(residentNumber != null ? { residentNumber: String(residentNumber) } : {}),
    ...(phoneNumber != null ? { phoneNumber: String(phoneNumber) } : {}),
    ...(idCardImageUrl != null ? { idCardImageUrl: String(idCardImageUrl) } : {}),
  });

  return NextResponse.json({
    result,
  });
}
