import { NextResponse, type NextRequest } from "next/server";

import {
  updateBuyOrderDepositCompleted,
} from '@lib/api/order';
import { verifyAdminSignedAction } from "@/lib/server/admin-action-security";

const ROUTE = "/api/order/buyOrderDepositCompleted";
const BUY_ORDER_DEPOSIT_COMPLETED_SIGNING_PREFIX = "admin-buyorder-deposit-completed-v1";


export async function POST(request: NextRequest) {

  const body = await request.json().catch(() => ({} as Record<string, unknown>));

  const orderId = typeof body?.orderId === "string" ? body.orderId.trim() : "";

  if (!orderId) {
    return NextResponse.json(
      { error: "orderId is required" },
      { status: 400 }
    );
  }

  const authResult = await verifyAdminSignedAction({
    request,
    route: ROUTE,
    signingPrefix: BUY_ORDER_DEPOSIT_COMPLETED_SIGNING_PREFIX,
    requesterStorecodeRaw: body?.requesterStorecode,
    requesterWalletAddressRaw: body?.requesterWalletAddress ?? body?.walletAddress,
    signatureRaw: body?.signature,
    signedAtRaw: body?.signedAt,
    nonceRaw: body?.nonce,
    actionFields: {
      orderId,
    },
    requestLogActionFields: {
      orderId,
    },
  });

  if (!authResult.ok) {
    return NextResponse.json(
      { error: authResult.error },
      { status: authResult.status }
    );
  }

  const result = await updateBuyOrderDepositCompleted({
    orderId,
    actor: {
      walletAddress: authResult.requesterWalletAddress,
      nickname: authResult.requesterUser?.nickname || null,
      storecode: authResult.requesterUser?.storecode || null,
      role: authResult.requesterUser?.role || null,
      publicIp: authResult.ip || null,
      signedAt: authResult.signedAtIso || null,
    },
  });


  if (!result.ok) {
    return NextResponse.json(
      { error: 'Failed to update buy order deposit completed' },
      { status: 500 }
    );
  }

  return NextResponse.json(
    {
      result: {
        orderId,
        alreadyCompleted: result.alreadyCompleted,
        buyer: result.order?.buyer || null,
      },
      message: result.alreadyCompleted
        ? 'Buy order deposit already completed'
        : 'Buy order deposit completed updated successfully',
    },
    { status: 200 }
  );

}
