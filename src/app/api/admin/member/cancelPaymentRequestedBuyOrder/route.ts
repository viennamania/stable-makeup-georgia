import { NextResponse, type NextRequest } from "next/server";

import {
  buyOrderGetOrderById,
  cancelTradeBySeller,
  getBlockingBuyOrderByStorecodeAndWalletAddress,
  updateBuyOrderPayactionResult,
} from "@lib/api/order";
import { getPayactionKeys } from "@lib/api/store";
import { verifyAdminSignedAction } from "@/lib/server/admin-action-security";
import { normalizeWalletAddress } from "@/lib/server/user-read-security";

const ROUTE = "/api/admin/member/cancelPaymentRequestedBuyOrder";
const SIGNING_PREFIX = "stable-georgia:admin-member-cancel-payment-requested-buy-order:v1";

const normalizeString = (value: unknown): string => {
  if (typeof value !== "string") {
    return "";
  }
  return value.trim();
};

export async function POST(request: NextRequest) {
  let body: Record<string, unknown> = {};
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    body = {};
  }

  const storecode = normalizeString(body.storecode);
  const walletAddress = normalizeWalletAddress(body.walletAddress);
  const cancelTradeReason =
    normalizeString(body.cancelTradeReason) || "관리자 회원페이지 상태변경";

  const authResult = await verifyAdminSignedAction({
    request,
    route: ROUTE,
    signingPrefix: SIGNING_PREFIX,
    requesterStorecodeRaw: body.requesterStorecode ?? "admin",
    requesterWalletAddressRaw: body.requesterWalletAddress,
    signatureRaw: body.signature,
    signedAtRaw: body.signedAt,
    nonceRaw: body.nonce,
    actionFields: {
      storecode,
      walletAddress,
      cancelTradeReason,
    },
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

  if (!storecode || !walletAddress) {
    return NextResponse.json(
      {
        result: null,
        error: "storecode and walletAddress are required",
      },
      { status: 400 },
    );
  }

  const blockingOrder = await getBlockingBuyOrderByStorecodeAndWalletAddress({
    storecode,
    walletAddress,
  });

  if (!blockingOrder?._id) {
    return NextResponse.json(
      {
        result: null,
        error: "No active buy order found for this member",
      },
      { status: 404 },
    );
  }

  const currentStatus = String(blockingOrder.status || "").trim();
  if (currentStatus !== "paymentRequested") {
    return NextResponse.json(
      {
        result: null,
        error: "Only paymentRequested orders can be cancelled from admin member page",
        currentStatus,
        orderId: String(blockingOrder._id),
      },
      { status: 409 },
    );
  }

  const orderId = String(blockingOrder._id);
  const buyOrder = await buyOrderGetOrderById(orderId);

  if (!buyOrder) {
    return NextResponse.json(
      {
        result: null,
        error: "Buy order not found",
      },
      { status: 404 },
    );
  }

  const payactionKeys = await getPayactionKeys({
    storecode: buyOrder.storecode,
  });

  if (payactionKeys?.payactionApiKey && payactionKeys?.payactionShopId) {
    const payactionUrl = "https://api.payaction.app/order-exclude";

    try {
      const response = await fetch(payactionUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": payactionKeys.payactionApiKey,
          "x-mall-id": payactionKeys.payactionShopId,
        },
        body: JSON.stringify({
          order_number: buyOrder.tradeId,
        }),
      });

      const payactionResult = await response.json();

      await updateBuyOrderPayactionResult({
        orderId,
        api: ROUTE,
        payactionResult,
      });

      if (response.status !== 200 || payactionResult?.status !== "success") {
        return NextResponse.json(
          {
            result: null,
            error: "Payaction API error",
            payactionResult,
          },
          { status: 502 },
        );
      }
    } catch (error) {
      console.error("cancelPaymentRequestedBuyOrder payaction error:", error);
      return NextResponse.json(
        {
          result: null,
          error: "Failed to exclude order from payaction",
        },
        { status: 502 },
      );
    }
  }

  const sellerWalletAddress =
    normalizeWalletAddress(buyOrder?.seller?.walletAddress)
    || authResult.requesterWalletAddress;

  const cancelledOrder = await cancelTradeBySeller({
    storecode,
    orderId,
    walletAddress: sellerWalletAddress,
    cancelTradeReason,
  });

  if (!cancelledOrder) {
    return NextResponse.json(
      {
        result: null,
        error: "Failed to cancel buy order",
      },
      { status: 500 },
    );
  }

  return NextResponse.json({
    result: {
      success: true,
      orderId,
      storecode,
      walletAddress,
      previousStatus: currentStatus,
      currentStatus: String(cancelledOrder.status || "cancelled"),
      cancelledAt: cancelledOrder.cancelledAt || null,
    },
  });
}
