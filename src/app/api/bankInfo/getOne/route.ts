import { NextResponse, type NextRequest } from "next/server";
import { ObjectId } from 'mongodb';

import { getBankInfoById } from '@lib/api/bankInfo';

export async function POST(request: NextRequest) {
  const body = await request.json();

  const { id } = body || {};

  if (!id || !ObjectId.isValid(String(id))) {
    return NextResponse.json({ error: 'valid id is required' }, { status: 400 });
  }

  const result = await getBankInfoById(String(id));

  return NextResponse.json({
    result,
  });
}
