import { NextResponse, type NextRequest } from "next/server";

import { getBankTransfers } from "@lib/api/bankTransfer";
import { buyOrderGetOrderById, type OrderProps } from "@lib/api/order";
import { readRealtimeBuyorderAdminSession } from "@/lib/server/realtime-buyorder-admin-session";

export const runtime = "nodejs";

function getKstDateKey(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) {
    return null;
  }

  const shifted = new Date(timestamp + 9 * 60 * 60 * 1000);
  const year = shifted.getUTCFullYear();
  const month = String(shifted.getUTCMonth() + 1).padStart(2, "0");
  const day = String(shifted.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function normalizeDepositName(value: unknown): string {
  return String(value || "").trim().toLowerCase();
}

function buildOrderSummary(order: OrderProps) {
  const anyOrder = order as OrderProps & { store?: any };
  const storeName = String(anyOrder?.store?.storeName || order.storecode || "").trim() || null;
  const storeLogo = String(anyOrder?.store?.storeLogo || "").trim() || null;
  const buyerName = String(
    order?.buyer?.depositName ||
      order?.buyer?.bankInfo?.accountHolder ||
      order?.nickname ||
      "",
  ).trim() || null;
  const buyerAccountNumber = String(
    order?.buyer?.bankInfo?.accountNumber ||
      order?.buyer?.depositBankAccountNumber ||
      order?.buyer?.bankAccountNumber ||
      "",
  ).trim() || null;
  const sellerBankName = String(order?.seller?.bankInfo?.bankName || "").trim() || null;
  const sellerAccountNumber = String(order?.seller?.bankInfo?.accountNumber || "").trim() || null;
  const sellerAccountHolder = String(order?.seller?.bankInfo?.accountHolder || "").trim() || null;

  return {
    orderId: String((order as any)?._id || ""),
    tradeId: String(order.tradeId || "").trim() || null,
    status: String(order.status || "").trim() || null,
    paymentMethod: String((order as any)?.paymentMethod || "").trim() || null,
    storeCode: String(order.storecode || "").trim() || null,
    storeName,
    storeLogo,
    buyerName,
    buyerAccountNumber,
    krwAmount: Number(order.krwAmount || 0),
    usdtAmount: Number(order.usdtAmount || 0),
    createdAt: String(order.createdAt || "").trim() || null,
    paymentRequestedAt: String(order.paymentRequestedAt || "").trim() || null,
    sellerBankName,
    sellerAccountNumber,
    sellerAccountHolder,
  };
}

export async function POST(request: NextRequest) {
  const session = readRealtimeBuyorderAdminSession(request);
  if (!session.enabled) {
    return NextResponse.json(
      {
        status: "error",
        message: "Realtime manual confirm is not configured",
      },
      { status: 503 },
    );
  }

  if (!session.authenticated) {
    return NextResponse.json(
      {
        status: "error",
        message: "Realtime admin authentication required",
      },
      { status: 401 },
    );
  }

  const body = await request.json().catch(() => ({}));
  const orderId = String(body?.orderId || "").trim();
  if (!orderId) {
    return NextResponse.json(
      {
        status: "error",
        message: "orderId is required",
      },
      { status: 400 },
    );
  }

  const order = await buyOrderGetOrderById(orderId);
  if (!order) {
    return NextResponse.json(
      {
        status: "error",
        message: "Buy order not found",
      },
      { status: 404 },
    );
  }

  const orderSummary = buildOrderSummary(order);
  if (orderSummary.status !== "paymentRequested") {
    return NextResponse.json(
      {
        status: "error",
        message: "Buy order is no longer awaiting payment confirmation",
        currentStatus: orderSummary.status,
        order: orderSummary,
      },
      { status: 409 },
    );
  }

  const sellerAccountNumber = orderSummary.sellerAccountNumber;
  const buyerDepositName = normalizeDepositName(orderSummary.buyerName);
  const referenceDateKey =
    getKstDateKey(orderSummary.paymentRequestedAt) ||
    getKstDateKey(orderSummary.createdAt) ||
    getKstDateKey(new Date().toISOString());

  if (!sellerAccountNumber) {
    return NextResponse.json({
      status: "success",
      order: orderSummary,
      recommendedFromDate: referenceDateKey,
      recommendedToDate: referenceDateKey,
      deposits: [],
    });
  }

  const transferResult = await getBankTransfers({
    accountNumber: sellerAccountNumber,
    transactionType: "deposited",
    matchStatus: "unmatched",
    page: 1,
    limit: 50,
    fromDate: referenceDateKey || "",
    toDate: referenceDateKey || "",
  });

  const deposits = Array.isArray(transferResult?.transfers)
    ? transferResult.transfers
        .map((transfer: any) => {
          const transactionName = String(transfer?.transactionName || "").trim() || null;
          const amount = Number(transfer?.amount || 0);
          const transferAccountNumber =
            String(transfer?.bankAccountNumber || transfer?.account || "").trim() || null;
          const transactionDate =
            String(transfer?.transactionDateUtc || transfer?.processingDate || transfer?.regDate || "").trim() ||
            null;
          const normalizedTransactionName = normalizeDepositName(transactionName);

          return {
            id: String(transfer?._id || ""),
            transactionName,
            amount,
            bankAccountNumber: transferAccountNumber,
            balance: Number(transfer?.balance || 0),
            transactionDate,
            memo: String(transfer?.memo || "").trim() || null,
            isAmountMatch: amount === Number(orderSummary.krwAmount || 0),
            isNameMatch: Boolean(buyerDepositName) && normalizedTransactionName === buyerDepositName,
          };
        })
        .filter((transfer: any) => transfer.id)
        .sort((left: any, right: any) => {
          if (Number(right.isAmountMatch) !== Number(left.isAmountMatch)) {
            return Number(right.isAmountMatch) - Number(left.isAmountMatch);
          }
          if (Number(right.isNameMatch) !== Number(left.isNameMatch)) {
            return Number(right.isNameMatch) - Number(left.isNameMatch);
          }
          return Date.parse(String(right.transactionDate || "")) - Date.parse(String(left.transactionDate || ""));
        })
    : [];

  return NextResponse.json({
    status: "success",
    order: orderSummary,
    recommendedFromDate: referenceDateKey,
    recommendedToDate: referenceDateKey,
    deposits,
  });
}
