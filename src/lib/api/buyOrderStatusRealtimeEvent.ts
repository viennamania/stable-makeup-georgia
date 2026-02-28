import { ObjectId } from "mongodb";

import clientPromise, { dbName } from "@lib/mongodb";
import type { BuyOrderStatusRealtimeEvent } from "@lib/ably/constants";

const COLLECTION_NAME = "buyOrderStatusRealtimeEvents";
const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

type BuyOrderStatusRealtimeEventDocument = {
  _id: ObjectId;
  eventId: string;
  idempotencyKey: string;
  payload: BuyOrderStatusRealtimeEvent;
  createdAt: Date;
};

let ensureIndexesPromise: Promise<void> | null = null;

async function ensureIndexes() {
  if (!ensureIndexesPromise) {
    ensureIndexesPromise = (async () => {
      const client = await clientPromise;
      const collection = client
        .db(dbName)
        .collection<BuyOrderStatusRealtimeEventDocument>(COLLECTION_NAME);

      await collection.createIndex({ eventId: 1 }, { unique: true, name: "uniq_eventId" });
      await collection.createIndex({ idempotencyKey: 1, createdAt: -1 }, { name: "idx_idempotency_createdAt" });
      await collection.createIndex({ createdAt: -1 }, { name: "idx_createdAt" });
      await collection.createIndex(
        { "payload.statusTo": 1, "payload.publishedAt": -1 },
        { name: "idx_statusTo_publishedAt" },
      );
    })();
  }

  await ensureIndexesPromise;
}

function getKstUtcDayRange(referenceDate: Date = new Date()): {
  dateKst: string;
  startUtc: Date;
  endUtc: Date;
} {
  const kstNow = new Date(referenceDate.getTime() + KST_OFFSET_MS);
  const year = kstNow.getUTCFullYear();
  const month = kstNow.getUTCMonth();
  const day = kstNow.getUTCDate();

  const startUtc = new Date(Date.UTC(year, month, day, 0, 0, 0, 0) - KST_OFFSET_MS);
  const endUtc = new Date(Date.UTC(year, month, day, 23, 59, 59, 999) - KST_OFFSET_MS);

  return {
    dateKst: `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
    startUtc,
    endUtc,
  };
}

function toCursor(value: ObjectId): string {
  return value.toHexString();
}

export type BuyOrderTodaySummary = {
  dateKst: string;
  confirmedCount: number;
  confirmedAmountKrw: number;
  confirmedAmountUsdt: number;
  updatedAt: string;
};

type PendingBuyOrderStatus = "ordered" | "accepted" | "paymentRequested";
type RealtimeBuyOrderListStatus =
  | PendingBuyOrderStatus
  | "paymentConfirmed"
  | "cancelled"
  | "paymentSettled";

const PENDING_BUYORDER_STATUSES: PendingBuyOrderStatus[] = [
  "ordered",
  "accepted",
  "paymentRequested",
];

const BUYORDER_LIST_STATUSES: RealtimeBuyOrderListStatus[] = [
  "ordered",
  "accepted",
  "paymentRequested",
  "paymentConfirmed",
  "cancelled",
  "paymentSettled",
];

export type RealtimePendingBuyOrderItem = {
  orderId: string;
  tradeId: string | null;
  status: PendingBuyOrderStatus;
  createdAt: string | null;
  amountKrw: number;
  amountUsdt: number;
  buyerName: string | null;
  buyerAccountNumber: string | null;
  storeLogo: string | null;
  storeName: string | null;
  storeCode: string | null;
};

export type RealtimePendingBuyOrderResult = {
  totalCount: number;
  orders: RealtimePendingBuyOrderItem[];
  updatedAt: string;
};

export type RealtimeBuyOrderListItem = {
  orderId: string;
  tradeId: string | null;
  status: RealtimeBuyOrderListStatus;
  createdAt: string | null;
  amountKrw: number;
  amountUsdt: number;
  buyerName: string | null;
  buyerAccountNumber: string | null;
  storeLogo: string | null;
  storeName: string | null;
  storeCode: string | null;
};

export type RealtimeBuyOrderListResult = {
  totalCount: number;
  page: number;
  limit: number;
  totalPages: number;
  orders: RealtimeBuyOrderListItem[];
  updatedAt: string;
};

export type RealtimeBuyOrderStoreOption = {
  storeCode: string;
  storeName: string;
  storeLogo: string | null;
};

function toNullableText(value: unknown): string | null {
  const normalized = String(value || "").trim();
  return normalized || null;
}

function toIsoString(value: unknown): string | null {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  const text = String(value).trim();
  if (!text) {
    return null;
  }

  const timestamp = Date.parse(text);
  if (Number.isNaN(timestamp)) {
    return null;
  }

  return new Date(timestamp).toISOString();
}

function toSafeNumber(value: unknown): number {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

function escapeRegex(value: string): string {
  return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getPendingBuyerName(order: any): string | null {
  return toNullableText(
    order?.buyer?.depositName ||
      order?.buyer?.bankInfo?.accountHolder ||
      order?.nickname,
  );
}

function getPendingBuyerAccountNumber(order: any): string | null {
  return toNullableText(
    order?.buyer?.bankInfo?.accountNumber ||
      order?.buyer?.depositBankAccountNumber ||
      order?.buyer?.bankAccountNumber,
  );
}

export async function saveBuyOrderStatusRealtimeEvent({
  eventId,
  idempotencyKey,
  payload,
}: {
  eventId: string;
  idempotencyKey: string;
  payload: BuyOrderStatusRealtimeEvent;
}): Promise<{
  cursor: string;
  event: BuyOrderStatusRealtimeEvent;
  isDuplicate: boolean;
}> {
  await ensureIndexes();

  const client = await clientPromise;
  const collection = client
    .db(dbName)
    .collection<BuyOrderStatusRealtimeEventDocument>(COLLECTION_NAME);

  const upsertResult = await collection.updateOne(
    { eventId },
    {
      $setOnInsert: {
        eventId,
        idempotencyKey,
        payload,
        createdAt: new Date(),
      },
    },
    { upsert: true },
  );

  if (upsertResult.upsertedId) {
    const insertedId = upsertResult.upsertedId as ObjectId;
    return {
      cursor: toCursor(insertedId),
      event: {
        ...payload,
        cursor: toCursor(insertedId),
      },
      isDuplicate: false,
    };
  }

  const existing = await collection.findOne(
    { eventId },
    { projection: { _id: 1, payload: 1 } },
  );

  if (!existing) {
    throw new Error(`Failed to load existing buyorder realtime event: ${eventId}`);
  }

  return {
    cursor: toCursor(existing._id),
    event: {
      ...existing.payload,
      cursor: toCursor(existing._id),
    },
    isDuplicate: true,
  };
}

export async function getBuyOrderStatusRealtimeEvents({
  sinceCursor,
  limit = 50,
}: {
  sinceCursor?: string | null;
  limit?: number;
}): Promise<{
  events: BuyOrderStatusRealtimeEvent[];
  nextCursor: string | null;
}> {
  await ensureIndexes();

  const client = await clientPromise;
  const collection = client
    .db(dbName)
    .collection<BuyOrderStatusRealtimeEventDocument>(COLLECTION_NAME);

  const safeLimit = Math.min(Math.max(Number(limit) || 50, 1), 300);

  const hasSinceCursor = Boolean(sinceCursor && ObjectId.isValid(sinceCursor));
  const query = hasSinceCursor
    ? {
        _id: {
          $gt: new ObjectId(String(sinceCursor)),
        },
      }
    : {};

  let docs: BuyOrderStatusRealtimeEventDocument[] = [];

  if (hasSinceCursor) {
    docs = await collection
      .find(query)
      .sort({ _id: 1 })
      .limit(safeLimit)
      .toArray();
  } else {
    const latestDocs = await collection
      .find(query)
      .sort({ _id: -1 })
      .limit(safeLimit)
      .toArray();
    docs = latestDocs.reverse();
  }

  const events = docs.map((doc) => {
    return {
      ...doc.payload,
      cursor: toCursor(doc._id),
    };
  });

  const nextCursor = docs.length > 0 ? toCursor(docs[docs.length - 1]._id) : sinceCursor || null;

  return {
    events,
    nextCursor,
  };
}

export async function getBuyOrderTodaySummary(): Promise<BuyOrderTodaySummary> {
  const client = await clientPromise;
  const collection = client.db(dbName).collection("buyorders");

  const { dateKst, startUtc, endUtc } = getKstUtcDayRange();
  const startIso = startUtc.toISOString();
  // Keep boundary behavior aligned with admin/buyorder totals.
  const endIso = new Date(`${dateKst}T23:59:59+09:00`).toISOString();

  const summaryResult = await collection
    .aggregate([
      {
        $match: {
          status: "paymentConfirmed",
          privateSale: false,
          createdAt: {
            $gte: startIso,
            $lt: endIso,
          },
        },
      },
      {
        $group: {
          _id: null,
          confirmedCount: { $sum: 1 },
          confirmedAmountKrw: { $sum: "$krwAmount" },
          confirmedAmountUsdt: { $sum: "$usdtAmount" },
        },
      },
    ])
    .toArray();

  const summary = summaryResult[0] || {};

  return {
    dateKst,
    confirmedCount: Number(summary.confirmedCount || 0),
    confirmedAmountKrw: Number(summary.confirmedAmountKrw || 0),
    confirmedAmountUsdt: Number(summary.confirmedAmountUsdt || 0),
    updatedAt: new Date().toISOString(),
  };
}

export async function getRealtimePendingBuyOrders({
  limit = 24,
}: {
  limit?: number;
} = {}): Promise<RealtimePendingBuyOrderResult> {
  const client = await clientPromise;
  const collection = client.db(dbName).collection("buyorders");

  const safeLimit = Math.min(Math.max(Number(limit) || 24, 1), 100);
  const query = {
    privateSale: { $ne: true },
    status: { $in: PENDING_BUYORDER_STATUSES },
  };

  const [totalCount, docs] = await Promise.all([
    collection.countDocuments(query),
    collection
      .find(query, {
        projection: {
          _id: 1,
          tradeId: 1,
          status: 1,
          createdAt: 1,
          krwAmount: 1,
          usdtAmount: 1,
          nickname: 1,
          buyer: 1,
          storecode: 1,
          store: 1,
        },
      })
      .sort({ createdAt: -1, _id: -1 })
      .limit(safeLimit)
      .toArray(),
  ]);

  const orders: RealtimePendingBuyOrderItem[] = docs.map((doc: any) => ({
    orderId: String(doc?._id || ""),
    tradeId: toNullableText(doc?.tradeId),
    status: PENDING_BUYORDER_STATUSES.includes(doc?.status)
      ? (doc.status as PendingBuyOrderStatus)
      : "ordered",
    createdAt: toIsoString(doc?.createdAt),
    amountKrw: toSafeNumber(doc?.krwAmount),
    amountUsdt: toSafeNumber(doc?.usdtAmount),
    buyerName: getPendingBuyerName(doc),
    buyerAccountNumber: getPendingBuyerAccountNumber(doc),
    storeLogo: toNullableText(doc?.store?.storeLogo),
    storeName: toNullableText(doc?.store?.storeName),
    storeCode: toNullableText(doc?.storecode || doc?.store?.storecode),
  }));

  return {
    totalCount,
    orders,
    updatedAt: new Date().toISOString(),
  };
}

export async function getRealtimeBuyOrderSearchList({
  page = 1,
  limit = 10,
  status = "all",
  searchQuery = "",
  storeCode = "",
}: {
  page?: number;
  limit?: number;
  status?: string;
  searchQuery?: string;
  storeCode?: string;
} = {}): Promise<RealtimeBuyOrderListResult> {
  const client = await clientPromise;
  const collection = client.db(dbName).collection("buyorders");

  const safeLimit = Math.min(Math.max(Number(limit) || 10, 1), 50);
  const requestedPage = Math.max(Number(page) || 1, 1);
  const normalizedStatus = String(status || "all").trim();
  const searchText = String(searchQuery || "").trim();
  const normalizedStoreCode = String(storeCode || "").trim();

  const andConditions: Array<Record<string, unknown>> = [];

  const query: Record<string, unknown> = {
    privateSale: { $ne: true },
  };

  if (BUYORDER_LIST_STATUSES.includes(normalizedStatus as RealtimeBuyOrderListStatus)) {
    query.status = normalizedStatus;
  }

  if (normalizedStoreCode) {
    andConditions.push({
      $or: [
        { storecode: normalizedStoreCode },
        { "store.storecode": normalizedStoreCode },
      ],
    });
  }

  if (searchText) {
    const pattern = new RegExp(escapeRegex(searchText), "i");
    andConditions.push({
      $or: [
      { tradeId: { $regex: pattern } },
      { "store.storeName": { $regex: pattern } },
      { nickname: { $regex: pattern } },
      { "buyer.depositName": { $regex: pattern } },
      { "buyer.bankInfo.accountHolder": { $regex: pattern } },
      { "buyer.bankInfo.accountNumber": { $regex: pattern } },
      { "buyer.depositBankAccountNumber": { $regex: pattern } },
      ],
    });
  }

  if (andConditions.length > 0) {
    query.$and = andConditions;
  }

  const totalCount = await collection.countDocuments(query);
  const totalPages = Math.max(1, Math.ceil(totalCount / safeLimit));
  const safePage = Math.min(requestedPage, totalPages);

  const docs = await collection
    .find(query, {
      projection: {
        _id: 1,
        tradeId: 1,
        status: 1,
        createdAt: 1,
        krwAmount: 1,
        usdtAmount: 1,
        nickname: 1,
        buyer: 1,
        storecode: 1,
        store: 1,
      },
    })
    .sort({ createdAt: -1, _id: -1 })
    .skip((safePage - 1) * safeLimit)
    .limit(safeLimit)
    .toArray();

  const orders: RealtimeBuyOrderListItem[] = docs.map((doc: any) => {
    const normalizedDocStatus = BUYORDER_LIST_STATUSES.includes(doc?.status)
      ? (doc.status as RealtimeBuyOrderListStatus)
      : "ordered";

    return {
      orderId: String(doc?._id || ""),
      tradeId: toNullableText(doc?.tradeId),
      status: normalizedDocStatus,
      createdAt: toIsoString(doc?.createdAt),
      amountKrw: toSafeNumber(doc?.krwAmount),
      amountUsdt: toSafeNumber(doc?.usdtAmount),
      buyerName: getPendingBuyerName(doc),
      buyerAccountNumber: getPendingBuyerAccountNumber(doc),
      storeLogo: toNullableText(doc?.store?.storeLogo),
      storeName: toNullableText(doc?.store?.storeName),
      storeCode: toNullableText(doc?.storecode || doc?.store?.storecode),
    };
  });

  return {
    totalCount,
    page: safePage,
    limit: safeLimit,
    totalPages,
    orders,
    updatedAt: new Date().toISOString(),
  };
}

export async function getRealtimeBuyOrderStoreOptions({
  limit = 300,
}: {
  limit?: number;
} = {}): Promise<{
  stores: RealtimeBuyOrderStoreOption[];
  updatedAt: string;
}> {
  const client = await clientPromise;
  const collection = client.db(dbName).collection("buyorders");
  const safeLimit = Math.min(Math.max(Number(limit) || 300, 1), 1000);

  const results = await collection
    .aggregate([
      {
        $match: {
          privateSale: { $ne: true },
          $or: [
            { storecode: { $type: "string", $ne: "" } },
            { "store.storecode": { $type: "string", $ne: "" } },
          ],
        },
      },
      {
        $project: {
          storeCode: {
            $ifNull: ["$storecode", "$store.storecode"],
          },
          storeName: {
            $ifNull: ["$store.storeName", "$storecode"],
          },
          storeLogo: "$store.storeLogo",
        },
      },
      {
        $match: {
          storeCode: { $type: "string", $ne: "" },
        },
      },
      {
        $group: {
          _id: "$storeCode",
          storeCode: { $first: "$storeCode" },
          storeName: { $first: "$storeName" },
          storeLogo: { $first: "$storeLogo" },
        },
      },
      {
        $sort: {
          storeName: 1,
          storeCode: 1,
        },
      },
      {
        $limit: safeLimit,
      },
    ])
    .toArray();

  const stores: RealtimeBuyOrderStoreOption[] = results
    .map((item: any) => {
      const code = toNullableText(item?.storeCode);
      if (!code) {
        return null;
      }

      return {
        storeCode: code,
        storeName: toNullableText(item?.storeName) || code,
        storeLogo: toNullableText(item?.storeLogo),
      } satisfies RealtimeBuyOrderStoreOption;
    })
    .filter((item): item is RealtimeBuyOrderStoreOption => Boolean(item));

  return {
    stores,
    updatedAt: new Date().toISOString(),
  };
}
