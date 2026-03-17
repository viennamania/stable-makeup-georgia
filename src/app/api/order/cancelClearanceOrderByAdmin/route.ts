import { NextResponse, type NextRequest } from "next/server";

import { cancelClearanceOrderByAdmin } from "@lib/api/order";
import { verifyAdminSignedAction } from "@/lib/server/admin-action-security";

const ROUTE = "/api/order/cancelClearanceOrderByAdmin";
const CANCEL_CLEARANCE_ORDER_SIGNING_PREFIX =
  "admin-cancel-clearance-order-v1";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({} as Record<string, unknown>));

  const orderId = typeof body?.orderId === "string" ? body.orderId.trim() : "";
  const cancelReason =
    typeof body?.cancelReason === "string" ? body.cancelReason.trim() : "";

  if (!orderId) {
    return NextResponse.json({ error: "orderId is required" }, { status: 400 });
  }

  const authResult = await verifyAdminSignedAction({
    request,
    route: ROUTE,
    signingPrefix: CANCEL_CLEARANCE_ORDER_SIGNING_PREFIX,
    requesterStorecodeRaw: body?.requesterStorecode,
    requesterWalletAddressRaw: body?.requesterWalletAddress ?? body?.walletAddress,
    signatureRaw: body?.signature,
    signedAtRaw: body?.signedAt,
    nonceRaw: body?.nonce,
    actionFields: {
      orderId,
      cancelReason,
    },
    requestLogActionFields: {
      orderId,
      cancelReason,
    },
  });

  if (!authResult.ok) {
    return NextResponse.json(
      { error: authResult.error },
      { status: authResult.status },
    );
  }

  const result = await cancelClearanceOrderByAdmin({
    orderId,
    cancelReason,
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
      { error: result.error || "Failed to cancel clearance order" },
      { status: result.status || 500 },
    );
  }

  return NextResponse.json({
    result: {
      orderId,
      tradeId: result.tradeId || null,
      alreadyCancelled: Boolean(result.alreadyCancelled),
      order: result.order || null,
    },
  });
}
