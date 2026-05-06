import { NextResponse, type NextRequest } from "next/server";
import clientPromise, { dbName } from "@/lib/mongodb";

import {
  buyOrderConfirmPayment,
  buyOrderGetOrderById,
} from "@lib/api/order";
import { verifyAdminSignedAction } from "@/lib/server/admin-action-security";
import { normalizeWalletAddress } from "@/lib/server/user-read-security";

const ROUTE = "/api/admin/member/confirmBuyOrderPayment";
const SIGNING_PREFIX = "stable-georgia:admin-member-confirm-buy-order-payment:v1";
const CONFIRMABLE_BUYORDER_STATUSES = [
  "ordered",
  "accepted",
  "paymentRequested",
  "cancelled",
  "completed",
] as const;
const BUYORDER_STATUS_HISTORY_STATUSES = [
  ...CONFIRMABLE_BUYORDER_STATUSES,
  "paymentConfirmed",
] as const;

const normalizeString = (value: unknown): string => {
  if (typeof value !== "string") {
    return "";
  }
  return value.trim();
};

const escapeRegexText = (value: string) =>
  String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const isConfirmableBuyOrderStatus = (status: string) => {
  return CONFIRMABLE_BUYORDER_STATUSES.includes(
    status as (typeof CONFIRMABLE_BUYORDER_STATUSES)[number],
  );
};

const getLatestBuyOrderForMember = async ({
  storecode,
  walletAddress,
}: {
  storecode: string;
  walletAddress: string;
}) => {
  const client = await clientPromise;
  const collection = client.db(dbName).collection("buyorders");
  const walletAddressRegex = new RegExp(`^${escapeRegexText(walletAddress)}$`, "i");

  return collection.findOne(
    {
      storecode,
      walletAddress: walletAddressRegex,
      status: { $in: [...BUYORDER_STATUS_HISTORY_STATUSES] },
    },
    {
      sort: { createdAt: -1 },
      projection: {
        _id: 1,
        tradeId: 1,
        status: 1,
        createdAt: 1,
        krwAmount: 1,
        usdtAmount: 1,
      },
    },
  );
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

  const latestOrder = await getLatestBuyOrderForMember({
    storecode,
    walletAddress,
  });

  if (!latestOrder?._id) {
    return NextResponse.json(
      {
        result: null,
        error: "No buy order found for this member",
        currentStatus: "",
        orderId: null,
        tradeId: null,
      },
      { status: 404 },
    );
  }

  const currentStatus = String(latestOrder.status || "").trim();
  const orderId = String(latestOrder._id);
  const tradeId = latestOrder.tradeId ? String(latestOrder.tradeId) : null;

  if (currentStatus === "paymentConfirmed") {
    return NextResponse.json(
      {
        result: null,
        error: "Buy order is already paymentConfirmed",
        currentStatus,
        orderId,
        tradeId,
      },
      { status: 409 },
    );
  }

  if (!isConfirmableBuyOrderStatus(currentStatus)) {
    return NextResponse.json(
      {
        result: null,
        error: "This buy order status cannot be changed to paymentConfirmed",
        currentStatus,
        orderId,
        tradeId,
      },
      { status: 409 },
    );
  }

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

  const paymentAmount = Number((buyOrder as any)?.krwAmount ?? latestOrder.krwAmount ?? 0) || 0;
  const usdtAmount = Number((buyOrder as any)?.usdtAmount ?? latestOrder.usdtAmount ?? 0) || 0;
  const requesterUser = authResult.requesterUser || {};
  const paymentConfirmedBy = {
    walletAddress: authResult.requesterWalletAddress,
    nickname: normalizeString(requesterUser.nickname) || normalizeString(requesterUser.name) || null,
    storecode: normalizeString(requesterUser.storecode) || authResult.requesterStorecode,
    role: normalizeString(requesterUser.role || requesterUser.rold) || null,
    publicIp: authResult.ip,
    signedAt: authResult.signedAtIso,
    matchedBy: "admin-member-management",
  };

  const confirmedOrder = await buyOrderConfirmPayment({
    orderId,
    paymentAmount,
    transactionHash: "0x",
    sellerWalletAddressBalance: 0,
    autoConfirmPayment: false,
    matchedByAdmin: true,
    paymentConfirmedBy,
    allowedCurrentStatuses: [...CONFIRMABLE_BUYORDER_STATUSES],
    statusFrom: currentStatus,
    usdtAmount,
    privateSale: Boolean((buyOrder as any)?.privateSale),
  });

  if (!confirmedOrder) {
    const refreshedOrder = await buyOrderGetOrderById(orderId);
    const refreshedStatus = refreshedOrder?.status ? String(refreshedOrder.status) : "";

    return NextResponse.json(
      {
        result: null,
        error: "Failed to confirm payment because the order state changed",
        currentStatus: refreshedStatus,
        orderId,
        tradeId,
      },
      { status: 409 },
    );
  }

  return NextResponse.json({
    result: {
      success: true,
      orderId,
      tradeId,
      storecode,
      walletAddress,
      previousStatus: currentStatus,
      currentStatus: "paymentConfirmed",
      paymentConfirmedAt: (confirmedOrder as any).paymentConfirmedAt || null,
      paymentAmount,
      usdtAmount,
    },
  });
}
