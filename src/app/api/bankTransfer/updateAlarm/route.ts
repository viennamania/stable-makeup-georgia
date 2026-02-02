import { NextResponse, type NextRequest } from "next/server";
import { updateBankTransferAlarm } from "@lib/api/bankTransfer";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { id, alarmOn } = body || {};

  if (!id || typeof alarmOn !== 'boolean') {
    return NextResponse.json({
      status: 'error',
      message: 'id and alarmOn(boolean) are required',
    }, { status: 400 });
  }

  const result = await updateBankTransferAlarm({ id, alarmOn });

  if (result.modifiedCount > 0) {
    return NextResponse.json({ status: 'success' });
  }

  return NextResponse.json({
    status: 'error',
    message: 'update failed',
  }, { status: 500 });
}
