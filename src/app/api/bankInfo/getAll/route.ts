import { NextResponse, type NextRequest } from "next/server";

import { getBankInfos } from '@lib/api/bankInfo';
import { verifyBankInfoAdminGuard } from "@/lib/server/bank-info-admin-guard";

const ROUTE = "/api/bankInfo/getAll";

const normalizeString = (value: unknown) => {
  if (value == null) {
    return "";
  }
  return String(value).trim();
};

export async function POST(request: NextRequest) {
  let body: Record<string, unknown> = {};
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    body = {};
  }

  const authResult = await verifyBankInfoAdminGuard({
    request,
    route: ROUTE,
    body,
  });

  if (!authResult.ok) {
    return NextResponse.json(
      {
        result: null,
        error: authResult.error,
      },
      { status: authResult.status },
    );
  }

  const {
    search,
    bankName,
    accountNumber,
    limit,
    page,
  } = body || {};

  const result = await getBankInfos({
    search: normalizeString(search),
    bankName: normalizeString(bankName),
    accountNumber: normalizeString(accountNumber),
    limit: Number(limit) || 50,
    page: Number(page) || 1,
  });

  return NextResponse.json({
    result,
  });
}
