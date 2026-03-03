import { NextResponse, type NextRequest } from "next/server";
import { ObjectId } from 'mongodb';

import { getBankInfoById } from '@lib/api/bankInfo';
import { verifyBankInfoAdminGuard } from "@/lib/server/bank-info-admin-guard";

const ROUTE = "/api/bankInfo/getOne";

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

  const { id } = body || {};

  if (!id || !ObjectId.isValid(String(id))) {
    return NextResponse.json({ error: 'valid id is required' }, { status: 400 });
  }

  const result = await getBankInfoById(String(id));

  return NextResponse.json({
    result,
  });
}
