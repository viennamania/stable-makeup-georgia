import { NextResponse, type NextRequest } from "next/server";

import { cancelClearanceOrderByAdmin, getOneBuyOrderByOrderId } from "@lib/api/order";
import { getOneByWalletAddress } from "@lib/api/user";
import { verifyAdminSignedAction } from "@/lib/server/admin-action-security";
import { verifyCenterStoreAdminGuard } from "@/lib/server/center-store-admin-guard";
import { getRequestIp } from "@/lib/server/user-read-security";

const ROUTE = "/api/order/cancelClearanceOrderByAdmin";
const CANCEL_CLEARANCE_ORDER_SIGNING_PREFIX =
  "admin-cancel-clearance-order-v1";

const normalizeStorecode = (value: unknown) => {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim().toLowerCase();
};

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({} as Record<string, unknown>));

  const orderId = typeof body?.orderId === "string" ? body.orderId.trim() : "";
  const requesterStorecode = normalizeStorecode(body?.requesterStorecode);
  const requestedStorecode = normalizeStorecode(body?.storecode);
  const actionStorecode = requestedStorecode || requesterStorecode;
  const cancelReason =
    typeof body?.cancelReason === "string" ? body.cancelReason.trim() : "";

  if (!orderId) {
    return NextResponse.json({ error: "orderId is required" }, { status: 400 });
  }

  const usesCenterStoreGuard = Boolean(requesterStorecode && requesterStorecode !== "admin");

  let actor: {
    walletAddress: string;
    nickname: string | null;
    storecode: string | null;
    role: string | null;
    publicIp: string | null;
    signedAt: string | null;
  } | null = null;

  if (usesCenterStoreGuard) {
    if (!actionStorecode) {
      return NextResponse.json({ error: "storecode is required" }, { status: 400 });
    }

    const guard = await verifyCenterStoreAdminGuard({
      request,
      route: ROUTE,
      body,
      storecodeRaw: actionStorecode,
    });

    if (!guard.ok) {
      return NextResponse.json({ error: guard.error }, { status: guard.status });
    }

    const order = await getOneBuyOrderByOrderId(orderId);
    const orderStorecode = normalizeStorecode(order?.storecode || (order as any)?.store?.storecode);

    if (!order) {
      return NextResponse.json({ error: "Buy order not found" }, { status: 404 });
    }

    if (!guard.requesterIsAdmin && orderStorecode !== actionStorecode) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const actorUser = await getOneByWalletAddress(
      guard.requesterIsAdmin ? "admin" : actionStorecode,
      guard.requesterWalletAddress,
    );
    const actorUserAny = actorUser as any;

    actor = {
      walletAddress: guard.requesterWalletAddress,
      nickname: actorUser?.nickname || null,
      storecode: actorUser?.storecode || (guard.requesterIsAdmin ? "admin" : actionStorecode),
      role: actorUser?.role || actorUserAny?.rold || (guard.requesterIsAdmin ? "admin" : "store_admin"),
      publicIp: getRequestIp(request) || null,
      signedAt: typeof body?.signedAt === "string" ? body.signedAt.trim() : null,
    };
  } else {
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
        ...(actionStorecode ? { storecode: actionStorecode } : {}),
      },
      requestLogActionFields: {
        orderId,
        cancelReason,
        ...(actionStorecode ? { storecode: actionStorecode } : {}),
      },
    });

    if (!authResult.ok) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status },
      );
    }

    actor = {
      walletAddress: authResult.requesterWalletAddress,
      nickname: authResult.requesterUser?.nickname || null,
      storecode: authResult.requesterUser?.storecode || null,
      role: authResult.requesterUser?.role || authResult.requesterUser?.rold || null,
      publicIp: authResult.ip || null,
      signedAt: authResult.signedAtIso || null,
    };
  }

  const result = await cancelClearanceOrderByAdmin({
    orderId,
    cancelReason,
    actor,
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
