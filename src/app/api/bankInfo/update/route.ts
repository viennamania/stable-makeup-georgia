import { NextResponse, type NextRequest } from "next/server";
import { ObjectId } from 'mongodb';

import { updateBankInfo, getBankInfoByRealAccountNumber } from '@lib/api/bankInfo';

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
    id,
    bankName,
    realAccountNumber,
    accountNumber,
    accountHolder,
    memo,
    aliasAccountNumber,
    defaultAccountNumber,
  } = body || {};

  if (!id || !ObjectId.isValid(String(id))) {
    return NextResponse.json({ error: 'valid id is required' }, { status: 400 });
  }

  const normalizedAccountNumber = String(realAccountNumber ?? accountNumber ?? '').trim();

  if (!bankName || !normalizedAccountNumber || !accountHolder) {
    return NextResponse.json(
      { error: 'bankName, realAccountNumber, accountHolder are required' },
      { status: 400 }
    );
  }

  const existing = await getBankInfoByRealAccountNumber(normalizedAccountNumber);
  if (existing) {
    const existingId = String(existing?._id?.toString?.() || existing?._id || '');
    if (existingId && existingId !== String(id)) {
      return NextResponse.json(
        { error: 'realAccountNumber already exists' },
        { status: 409 }
      );
    }
  }

  const normalizedAliasAccountNumber = normalizeAliasAccountNumber(aliasAccountNumber);

  const result = await updateBankInfo({
    id: String(id),
    data: {
      bankName: String(bankName),
      realAccountNumber: normalizedAccountNumber,
      accountHolder: String(accountHolder),
      ...(memo !== undefined ? { memo: String(memo) } : {}),
      ...(normalizedAliasAccountNumber !== undefined
        ? { aliasAccountNumber: normalizedAliasAccountNumber }
        : {}),
      ...(defaultAccountNumber !== undefined ? { defaultAccountNumber: String(defaultAccountNumber) } : {}),
    },
  });

  return NextResponse.json({
    result,
  });
}
