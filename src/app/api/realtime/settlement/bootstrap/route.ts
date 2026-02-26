import { createHash } from "crypto";

import { NextResponse, type NextRequest } from "next/server";
import { ObjectId } from "mongodb";

import clientPromise, { dbName } from "@lib/mongodb";
import { authorizeRealtimeRequest } from "@lib/realtime/rbac";
import type { BuyOrderStatusRealtimeEvent } from "@lib/ably/constants";

export const runtime = "nodejs";

type BuyOrderSettlementDocument = {
  _id: ObjectId;
  tradeId?: string;
  status?: string;
  walletAddress?: string;
  storecode?: string;
  store?: {
    storecode?: string;
    code?: string;
    storeName?: string;
    name?: string;
    storeLogo?: string;
    logo?: string;
  } | null;
  krwAmount?: number;
  usdtAmount?: number;
  nickname?: string;
  buyer?: {
    walletAddress?: string;
    depositName?: string;
    bankInfo?: {
      accountHolder?: string;
      accountNumber?: string;
    };
    depositBankAccountNumber?: string;
    bankAccountNumber?: string;
  } | null;
  cancelTradeReason?: string;
  transactionHash?: string;
  escrowTransactionHash?: string;
  queueId?: string | null;
  minedAt?: string | null;
  settlementUpdatedAt?: string;
  settlement?: {
    status?: string;
    txid?: string;
    createdAt?: string;
    settlementAmount?: number | string;
    settlementAmountKRW?: number | string;
  } | null;
};

function toSafeNumber(value: unknown): number {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

function toSafeString(value: unknown): string | null {
  const raw = String(value || "").trim();
  return raw || null;
}

function toSafeHash(value: unknown): string | null {
  const raw = String(value || "").trim();
  if (!raw || raw === "0x") {
    return null;
  }
  return raw;
}

function toPublishedAt(doc: BuyOrderSettlementDocument): string {
  return (
    toSafeString(doc.settlement?.createdAt) ||
    toSafeString(doc.settlementUpdatedAt) ||
    doc._id.getTimestamp().toISOString()
  );
}

function toEvent(doc: BuyOrderSettlementDocument): BuyOrderStatusRealtimeEvent {
  const orderId = doc._id.toHexString();
  const tradeId = toSafeString(doc.tradeId);
  const settlementTxid = toSafeHash(doc.settlement?.txid);
  const settlementAmountUsdt = toSafeNumber(doc.settlement?.settlementAmount);
  const settlementAmountKrw = toSafeNumber(doc.settlement?.settlementAmountKRW);
  const amountUsdt = settlementAmountUsdt || toSafeNumber(doc.usdtAmount);
  const amountKrw = settlementAmountKrw || toSafeNumber(doc.krwAmount);
  const statusFrom = toSafeString(doc.status);
  const publishedAt = toPublishedAt(doc);

  const source = "order.settlement.bootstrap";
  const idempotencyBase = [
    source,
    orderId,
    settlementTxid || "",
    String(amountUsdt),
    String(amountKrw),
    publishedAt,
  ].join("|");
  const hash = createHash("sha256").update(idempotencyBase).digest("hex");
  const eventId = `buyorder-settlement-${hash}`;

  return {
    eventId,
    idempotencyKey: `buyorder:settlement:${hash}`,
    cursor: orderId,
    source,
    orderId,
    tradeId,
    statusFrom: statusFrom && statusFrom !== "paymentSettled" ? statusFrom : null,
    statusTo: "paymentSettled",
    store: {
      code:
        toSafeString(doc.store?.storecode) ||
        toSafeString(doc.store?.code) ||
        toSafeString(doc.storecode),
      logo: toSafeString(doc.store?.storeLogo) || toSafeString(doc.store?.logo),
      name: toSafeString(doc.store?.storeName) || toSafeString(doc.store?.name),
    },
    amountKrw,
    amountUsdt,
    buyerName:
      toSafeString(doc.buyer?.depositName) ||
      toSafeString(doc.buyer?.bankInfo?.accountHolder) ||
      toSafeString(doc.nickname),
    buyerWalletAddress:
      toSafeString(doc.walletAddress) || toSafeString(doc.buyer?.walletAddress),
    buyerAccountNumber:
      toSafeString(doc.buyer?.bankInfo?.accountNumber) ||
      toSafeString(doc.buyer?.depositBankAccountNumber) ||
      toSafeString(doc.buyer?.bankAccountNumber),
    transactionHash: settlementTxid || toSafeHash(doc.transactionHash),
    escrowTransactionHash: toSafeHash(doc.escrowTransactionHash),
    queueId: toSafeString(doc.queueId),
    minedAt: toSafeString(doc.minedAt),
    reason: toSafeString(doc.cancelTradeReason),
    publishedAt,
  };
}

export async function GET(request: NextRequest) {
  const isPublic = request.nextUrl.searchParams.get("public") === "1";

  let role: "admin" | "viewer" = "viewer";
  if (!isPublic) {
    const authResult = authorizeRealtimeRequest(request, ["admin", "viewer"]);
    if (!authResult.ok) {
      return NextResponse.json(
        {
          status: "error",
          message: authResult.message,
        },
        { status: authResult.status },
      );
    }
    role = authResult.role;
  }

  const limitParam = request.nextUrl.searchParams.get("limit");
  const limit = Math.min(Math.max(Number(limitParam) || 80, 1), 300);

  try {
    const client = await clientPromise;
    const collection = client
      .db(dbName)
      .collection<BuyOrderSettlementDocument>("buyorders");

    const docs = await collection
      .find(
        {
          settlement: { $exists: true, $ne: null },
        },
        {
          projection: {
            _id: 1,
            tradeId: 1,
            status: 1,
            walletAddress: 1,
            storecode: 1,
            store: 1,
            krwAmount: 1,
            usdtAmount: 1,
            nickname: 1,
            buyer: 1,
            cancelTradeReason: 1,
            transactionHash: 1,
            escrowTransactionHash: 1,
            queueId: 1,
            minedAt: 1,
            settlementUpdatedAt: 1,
            settlement: 1,
          },
        },
      )
      .sort({
        "settlement.createdAt": -1,
        settlementUpdatedAt: -1,
        _id: -1,
      })
      .limit(limit)
      .toArray();

    const events = docs.map(toEvent);
    return NextResponse.json({
      status: "success",
      role,
      events,
      nextCursor: docs.length > 0 ? docs[docs.length - 1]._id.toHexString() : null,
    });
  } catch (error) {
    console.error("Failed to bootstrap settlement realtime events:", error);
    return NextResponse.json(
      {
        status: "error",
        message: "Failed to bootstrap settlement realtime events",
      },
      { status: 500 },
    );
  }
}
