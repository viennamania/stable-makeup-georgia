import { ObjectId } from "mongodb";

import clientPromise, { dbName } from "@lib/mongodb";
import type { BuyOrderStatusRealtimeEvent } from "@lib/ably/constants";
import { createThirdwebClient, getContract } from "thirdweb";
import { ethereum, polygon, arbitrum, bsc } from "thirdweb/chains";
import { balanceOf } from "thirdweb/extensions/erc20";
import {
  chain as appChain,
  ethereumContractAddressUSDT,
  polygonContractAddressUSDT,
  arbitrumContractAddressUSDT,
  bscContractAddressUSDT,
  bscContractAddressMKRW,
} from "@/app/config/contractAddresses";

const COLLECTION_NAME = "buyOrderStatusRealtimeEvents";
const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
const ENABLE_BUYORDER_REALTIME_RUNTIME_INDEX_CREATION =
  String(process.env.ENABLE_BUYORDER_REALTIME_RUNTIME_INDEX_CREATION || "").toLowerCase() ===
  "true";
const REALTIME_BUYORDER_LIST_MAX_TIME_MS = Math.max(
  Number.parseInt(process.env.REALTIME_BUYORDER_LIST_MAX_TIME_MS || "", 10) || 4500,
  500,
);
const REALTIME_BUYORDER_LIST_TRANSIENT_RETRY_COUNT = Math.max(
  Number.parseInt(process.env.REALTIME_BUYORDER_LIST_TRANSIENT_RETRY_COUNT || "", 10) || 2,
  1,
);
const REALTIME_BUYORDER_LIST_TRANSIENT_RETRY_DELAY_MS = Math.max(
  Number.parseInt(process.env.REALTIME_BUYORDER_LIST_TRANSIENT_RETRY_DELAY_MS || "", 10) || 120,
  50,
);
const REALTIME_BUYORDER_QUERY_MAX_TIME_MS = Math.max(
  Number.parseInt(process.env.REALTIME_BUYORDER_QUERY_MAX_TIME_MS || "", 10) || 4500,
  500,
);

type BuyOrderStatusRealtimeEventDocument = {
  _id: ObjectId;
  eventId: string;
  idempotencyKey: string;
  payload: BuyOrderStatusRealtimeEvent;
  createdAt: Date;
};

let ensureIndexesPromise: Promise<void> | null = null;

async function ensureIndexes() {
  if (!ENABLE_BUYORDER_REALTIME_RUNTIME_INDEX_CREATION) {
    return;
  }

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

function getUsdtContractAddress(): string {
  if (appChain === "ethereum") {
    return ethereumContractAddressUSDT;
  }
  if (appChain === "polygon") {
    return polygonContractAddressUSDT;
  }
  if (appChain === "arbitrum") {
    return arbitrumContractAddressUSDT;
  }
  if (appChain === "bsc") {
    return bscContractAddressUSDT;
  }
  return bscContractAddressMKRW;
}

function getThirdwebChain() {
  if (appChain === "ethereum") {
    return ethereum;
  }
  if (appChain === "polygon") {
    return polygon;
  }
  if (appChain === "arbitrum") {
    return arbitrum;
  }
  return bsc;
}

function getUsdtDecimals(): number {
  return appChain === "bsc" ? 18 : 6;
}

function toCursor(value: ObjectId): string {
  return value.toHexString();
}

export type BuyOrderTodaySummary = {
  dateKst: string;
  confirmedCount: number;
  confirmedAmountKrw: number;
  confirmedAmountUsdt: number;
  pgFeeAmountKrw: number;
  pgFeeAmountUsdt: number;
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

const REALTIME_BUYORDER_LIST_PROJECTION = {
  _id: 1,
  tradeId: 1,
  status: 1,
  createdAt: 1,
  krwAmount: 1,
  usdtAmount: 1,
  nickname: 1,
  storecode: 1,
  "buyer.depositName": 1,
  "buyer.depositBankAccountNumber": 1,
  "buyer.bankInfo.accountHolder": 1,
  "buyer.bankInfo.accountNumber": 1,
  "store.storeLogo": 1,
  "store.storeName": 1,
  "store.storecode": 1,
} as const;

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

export type RealtimeSellerWalletBalanceItem = {
  walletAddress: string;
  orderCount: number;
  totalAmountUsdt: number;
  latestOrderCreatedAt: string | null;
  currentUsdtBalance: number;
};

export type RealtimeSellerWalletBalanceResult = {
  totalCount: number;
  wallets: RealtimeSellerWalletBalanceItem[];
  updatedAt: string;
};

export type RealtimeNicknameSellerWalletBalanceItem = {
  id: number | null;
  nickname: string;
  storecode: string | null;
  storeName: string | null;
  storeLogo: string | null;
  walletAddress: string;
  signerAddress: string | null;
  currentUsdtBalance: number;
};

export type RealtimeNicknameSellerWalletBalanceResult = {
  totalCount: number;
  totalCurrentUsdtBalance: number;
  wallets: RealtimeNicknameSellerWalletBalanceItem[];
  updatedAt: string;
};

export type RealtimeBuyerWalletBalanceItem = {
  walletAddress: string;
  nickname: string | null;
  avatar: string | null;
  storecode: string | null;
  storeName: string | null;
  storeLogo: string | null;
  orderCount: number;
  totalAmountUsdt: number;
  latestPaymentConfirmedAt: string | null;
  currentUsdtBalance: number;
};

export type RealtimeBuyerWalletBalanceResult = {
  totalCount: number;
  totalCurrentUsdtBalance: number;
  wallets: RealtimeBuyerWalletBalanceItem[];
  updatedAt: string;
};

export type RealtimeBlockedBuyOrderMonitorTone = "rose" | "amber" | "sky";
export type RealtimeBlockedBuyOrderSeverity = "critical" | "warning" | "info";

export type RealtimeBlockedBuyOrderItem = {
  blockedKey: string;
  orderId: string | null;
  tradeId: string | null;
  storecode: string | null;
  storeName: string | null;
  storeLogo: string | null;
  buyerNickname: string | null;
  buyerDepositName: string | null;
  buyerWalletAddress: string | null;
  sellerNickname: string | null;
  status: string | null;
  settlementStatus: string | null;
  amountUsdt: number;
  amountKrw: number;
  route: string;
  routeLabel: string;
  guardType: string | null;
  latestReason: string | null;
  latestReasonLabel: string;
  latestReasonDetail: string;
  tone: RealtimeBlockedBuyOrderMonitorTone;
  severity: RealtimeBlockedBuyOrderSeverity;
  blockedCount: number;
  firstBlockedAt: string | null;
  latestBlockedAt: string | null;
  latestPublicIp: string | null;
  latestRequesterWalletAddress: string | null;
  distinctReasons: string[];
  requestBody: Record<string, unknown> | null;
  meta: Record<string, unknown> | null;
};

export type RealtimeBlockedBuyOrderResult = {
  totalCount: number;
  criticalCount: number;
  warningCount: number;
  infoCount: number;
  orders: RealtimeBlockedBuyOrderItem[];
  updatedAt: string;
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

function isTransientMongoError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  const anyError = error as any;
  const labels = anyError?.errorLabelSet instanceof Set
    ? Array.from(anyError.errorLabelSet)
    : [];
  const labelSet = new Set(labels.map((label) => String(label)));
  const name = String(anyError?.name || "");
  const message = String(anyError?.message || "");
  const code = String(anyError?.code || anyError?.cause?.code || "");
  const causeName = String(anyError?.cause?.name || "");

  if (
    labelSet.has("ResetPool")
    || labelSet.has("PoolRequestedRetry")
    || labelSet.has("PoolRequstedRetry")
  ) {
    return true;
  }

  if (
    name === "MongoPoolClearedError"
    || name === "MongoNetworkError"
    || name === "MongoServerSelectionError"
    || name === "MongoWaitQueueTimeoutError"
    || causeName === "MongoNetworkError"
  ) {
    return true;
  }

  if (code === "ECONNRESET" || code === "ETIMEDOUT") {
    return true;
  }

  return (
    message.includes("Connection pool")
    || message.includes("TLS connection")
    || message.includes("Server selection timed out")
    || message.includes("Timed out while checking out a connection from connection pool")
    || message.includes("Client network socket disconnected")
  );
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function withTransientMongoRetry<T>(work: () => Promise<T>): Promise<T> {
  let attempt = 0;
  let lastError: unknown;

  while (attempt < REALTIME_BUYORDER_LIST_TRANSIENT_RETRY_COUNT) {
    attempt += 1;
    try {
      return await work();
    } catch (error) {
      lastError = error;
      if (!isTransientMongoError(error) || attempt >= REALTIME_BUYORDER_LIST_TRANSIENT_RETRY_COUNT) {
        throw error;
      }
      await sleep(REALTIME_BUYORDER_LIST_TRANSIENT_RETRY_DELAY_MS * attempt);
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Unknown realtime buyorder list failure");
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
      .maxTimeMS(REALTIME_BUYORDER_QUERY_MAX_TIME_MS)
      .sort({ _id: 1 })
      .limit(safeLimit)
      .toArray();
  } else {
    const latestDocs = await collection
      .find(query)
      .maxTimeMS(REALTIME_BUYORDER_QUERY_MAX_TIME_MS)
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
          pgFeeAmountUsdt: { $sum: { $toDouble: { $ifNull: ["$settlement.feeAmount", 0] } } },
          pgFeeAmountKrw: { $sum: { $toDouble: { $ifNull: ["$settlement.feeAmountKRW", 0] } } },
        },
      },
    ], {
      maxTimeMS: REALTIME_BUYORDER_QUERY_MAX_TIME_MS,
    })
    .toArray();

  const summary = summaryResult[0] || {};

  return {
    dateKst,
    confirmedCount: Number(summary.confirmedCount || 0),
    confirmedAmountKrw: Number(summary.confirmedAmountKrw || 0),
    confirmedAmountUsdt: Number(summary.confirmedAmountUsdt || 0),
    pgFeeAmountKrw: Number(summary.pgFeeAmountKrw || 0),
    pgFeeAmountUsdt: Number(summary.pgFeeAmountUsdt || 0),
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
    collection.countDocuments(query, {
      maxTimeMS: REALTIME_BUYORDER_QUERY_MAX_TIME_MS,
    }),
    collection
      .find(query, {
        projection: REALTIME_BUYORDER_LIST_PROJECTION,
      })
      .sort({ createdAt: -1, _id: -1 })
      .limit(safeLimit)
      .maxTimeMS(REALTIME_BUYORDER_QUERY_MAX_TIME_MS)
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
    query.storecode = normalizedStoreCode;
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

  const { totalCount, docs } = await withTransientMongoRetry(async () => {
    const baseSkip = (requestedPage - 1) * safeLimit;
    const [nextTotalCount, firstDocs] = await Promise.all([
      collection.countDocuments(
        query,
        { maxTimeMS: REALTIME_BUYORDER_LIST_MAX_TIME_MS },
      ),
      collection
        .find(query, {
          projection: REALTIME_BUYORDER_LIST_PROJECTION,
        })
        .sort({ createdAt: -1, _id: -1 })
        .skip(baseSkip)
        .limit(safeLimit)
        .maxTimeMS(REALTIME_BUYORDER_LIST_MAX_TIME_MS)
        .toArray(),
    ]);

    const totalPages = Math.max(1, Math.ceil(nextTotalCount / safeLimit));
    const safePage = Math.min(requestedPage, totalPages);

    if (safePage === requestedPage) {
      return {
        totalCount: nextTotalCount,
        docs: firstDocs,
      };
    }

    const nextDocs = await collection
      .find(query, {
        projection: REALTIME_BUYORDER_LIST_PROJECTION,
      })
      .sort({ createdAt: -1, _id: -1 })
      .skip((safePage - 1) * safeLimit)
      .limit(safeLimit)
      .maxTimeMS(REALTIME_BUYORDER_LIST_MAX_TIME_MS)
      .toArray();

    return {
      totalCount: nextTotalCount,
      docs: nextDocs,
    };
  });

  const totalPages = Math.max(1, Math.ceil(totalCount / safeLimit));
  const safePage = Math.min(requestedPage, totalPages);

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
    ], {
      maxTimeMS: REALTIME_BUYORDER_QUERY_MAX_TIME_MS,
    })
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

export async function getRealtimeBuyOrderSellerWalletBalances({
  limit = 12,
}: {
  limit?: number;
} = {}): Promise<RealtimeSellerWalletBalanceResult> {
  const client = await clientPromise;
  const collection = client.db(dbName).collection("buyorders");
  const safeLimit = Math.min(Math.max(Number(limit) || 12, 1), 40);

  const groupedWallets = await collection
    .aggregate([
      {
        $match: {
          privateSale: { $ne: true },
          "seller.walletAddress": { $type: "string", $ne: "" },
        },
      },
      {
        $project: {
          walletAddress: {
            $trim: {
              input: "$seller.walletAddress",
            },
          },
          usdtAmount: "$usdtAmount",
          createdAt: "$createdAt",
        },
      },
      {
        $match: {
          walletAddress: { $type: "string", $ne: "" },
        },
      },
      {
        $group: {
          _id: { $toLower: "$walletAddress" },
          walletAddress: { $first: "$walletAddress" },
          orderCount: { $sum: 1 },
          totalAmountUsdt: { $sum: { $toDouble: { $ifNull: ["$usdtAmount", 0] } } },
          latestOrderCreatedAt: { $max: "$createdAt" },
        },
      },
      {
        $sort: {
          latestOrderCreatedAt: -1,
          orderCount: -1,
        },
      },
      {
        $limit: safeLimit,
      },
    ], {
      maxTimeMS: REALTIME_BUYORDER_QUERY_MAX_TIME_MS,
    })
    .toArray();

  const wallets: RealtimeSellerWalletBalanceItem[] = groupedWallets
    .map((item: any) => {
      const walletAddress = toNullableText(item?.walletAddress);
      if (!walletAddress) {
        return null;
      }

      return {
        walletAddress,
        orderCount: Number(item?.orderCount || 0),
        totalAmountUsdt: toSafeNumber(item?.totalAmountUsdt),
        latestOrderCreatedAt: toIsoString(item?.latestOrderCreatedAt),
        currentUsdtBalance: 0,
      } satisfies RealtimeSellerWalletBalanceItem;
    })
    .filter((item): item is RealtimeSellerWalletBalanceItem => Boolean(item));

  if (wallets.length === 0) {
    return {
      totalCount: 0,
      wallets: [],
      updatedAt: new Date().toISOString(),
    };
  }

  const thirdwebSecretKey = String(process.env.THIRDWEB_SECRET_KEY || "").trim();
  const usdtContractAddress = getUsdtContractAddress();
  if (!thirdwebSecretKey || !usdtContractAddress) {
    return {
      totalCount: wallets.length,
      wallets,
      updatedAt: new Date().toISOString(),
    };
  }

  try {
    const thirdwebClient = createThirdwebClient({
      secretKey: thirdwebSecretKey,
    });
    const contract = getContract({
      client: thirdwebClient,
      chain: getThirdwebChain(),
      address: usdtContractAddress,
    });
    const decimals = getUsdtDecimals();

    const withBalances = await Promise.all(
      wallets.map(async (item) => {
        try {
          const rawBalance = await balanceOf({
            contract,
            address: item.walletAddress,
          });
          return {
            ...item,
            currentUsdtBalance: Number(rawBalance) / 10 ** decimals,
          };
        } catch (error) {
          console.error(`Failed to fetch seller wallet USDT balance (${item.walletAddress}):`, error);
          return {
            ...item,
            currentUsdtBalance: 0,
          };
        }
      }),
    );

    return {
      totalCount: withBalances.length,
      wallets: withBalances,
      updatedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Failed to fetch realtime seller wallet balances:", error);
    return {
      totalCount: wallets.length,
      wallets,
      updatedAt: new Date().toISOString(),
    };
  }
}

export async function getRealtimeNicknameSellerWalletBalances({
  nickname = "seller",
  excludeStorecode = "",
  limit = 120,
}: {
  nickname?: string;
  excludeStorecode?: string;
  limit?: number;
} = {}): Promise<RealtimeNicknameSellerWalletBalanceResult> {
  const client = await clientPromise;
  const storeCollection = client.db(dbName).collection("stores");
  const userCollection = client.db(dbName).collection("users");

  const safeNickname = toNullableText(nickname)?.toLowerCase() || "seller";
  const safeExcludeStorecode = toNullableText(excludeStorecode)?.toLowerCase() || "";
  const safeLimit = Math.min(Math.max(Number(limit) || 120, 1), 400);

  const userQuery: Record<string, unknown> = {
    nickname: new RegExp(`^${escapeRegex(safeNickname)}$`, "i"),
    walletAddress: { $type: "string", $ne: "" },
  };

  if (safeExcludeStorecode) {
    const excludeStorecodeRegex = new RegExp(`^${escapeRegex(safeExcludeStorecode)}$`, "i");
    userQuery.storecode = { $not: excludeStorecodeRegex };
  }

  const users = await userCollection
    .find(
      userQuery,
      {
        projection: {
          _id: 0,
          id: 1,
          nickname: 1,
          storecode: 1,
          walletAddress: 1,
          signerAddress: 1,
          updatedAt: 1,
        },
        sort: {
          updatedAt: -1,
          _id: -1,
        },
        limit: safeLimit * 4,
        maxTimeMS: REALTIME_BUYORDER_QUERY_MAX_TIME_MS,
      },
    )
    .toArray();

  const walletMap = new Map<string, RealtimeNicknameSellerWalletBalanceItem>();
  const storecodeSet = new Set<string>();

  for (const user of users) {
    const walletAddress = toNullableText(user?.walletAddress);
    if (!walletAddress) {
      continue;
    }

    const walletKey = walletAddress.toLowerCase();
    if (walletMap.has(walletKey)) {
      continue;
    }

    walletMap.set(walletKey, {
      id: typeof user?.id === "number" ? user.id : null,
      nickname: toNullableText(user?.nickname)?.toLowerCase() || safeNickname,
      storecode: toNullableText(user?.storecode),
      storeName: null,
      storeLogo: null,
      walletAddress,
      signerAddress: toNullableText(user?.signerAddress),
      currentUsdtBalance: 0,
    });

    const storecode = toNullableText(user?.storecode)?.toLowerCase();
    if (storecode) {
      storecodeSet.add(storecode);
    }

    if (walletMap.size >= safeLimit) {
      break;
    }
  }

  const storeByCode = new Map<string, { storeName: string | null; storeLogo: string | null }>();
  const storeQueryConditions = Array.from(storecodeSet).map((storecode) => ({
    storecode: new RegExp(`^${escapeRegex(storecode)}$`, "i"),
  }));

  if (storeQueryConditions.length > 0) {
    const stores = await storeCollection
      .find(
        {
          $or: storeQueryConditions,
        },
        {
          projection: {
            _id: 0,
            storecode: 1,
            storeName: 1,
            storeLogo: 1,
          },
          sort: {
            storeName: 1,
            storecode: 1,
          },
          maxTimeMS: REALTIME_BUYORDER_QUERY_MAX_TIME_MS,
        },
      )
      .toArray();

    for (const store of stores) {
      const storecode = toNullableText(store?.storecode)?.toLowerCase();
      if (!storecode || storeByCode.has(storecode)) {
        continue;
      }
      storeByCode.set(storecode, {
        storeName: toNullableText(store?.storeName),
        storeLogo: toNullableText(store?.storeLogo),
      });
    }
  }

  const wallets = Array.from(walletMap.values()).map((item) => {
    const storeInfo = storeByCode.get(String(item.storecode || "").toLowerCase());

    return {
      ...item,
      storeName: storeInfo?.storeName ?? item.storeName ?? null,
      storeLogo: storeInfo?.storeLogo ?? item.storeLogo ?? null,
    };
  });

  if (wallets.length === 0) {
    return {
      totalCount: 0,
      totalCurrentUsdtBalance: 0,
      wallets: [],
      updatedAt: new Date().toISOString(),
    };
  }

  const thirdwebSecretKey = String(process.env.THIRDWEB_SECRET_KEY || "").trim();
  const usdtContractAddress = getUsdtContractAddress();
  if (!thirdwebSecretKey || !usdtContractAddress) {
    return {
      totalCount: wallets.length,
      totalCurrentUsdtBalance: 0,
      wallets,
      updatedAt: new Date().toISOString(),
    };
  }

  try {
    const thirdwebClient = createThirdwebClient({
      secretKey: thirdwebSecretKey,
    });
    const contract = getContract({
      client: thirdwebClient,
      chain: getThirdwebChain(),
      address: usdtContractAddress,
    });
    const decimals = getUsdtDecimals();

    const withBalances = await Promise.all(
      wallets.map(async (item) => {
        try {
          const rawBalance = await balanceOf({
            contract,
            address: item.walletAddress,
          });
          return {
            ...item,
            currentUsdtBalance: Number(rawBalance) / 10 ** decimals,
          };
        } catch (error) {
          console.error(
            `Failed to fetch nickname seller wallet USDT balance (${item.walletAddress}):`,
            error,
          );
          return {
            ...item,
            currentUsdtBalance: 0,
          };
        }
      }),
    );

    withBalances.sort((left, right) => {
      return (
        right.currentUsdtBalance - left.currentUsdtBalance ||
        left.walletAddress.localeCompare(right.walletAddress)
      );
    });

    const totalCurrentUsdtBalance = withBalances.reduce((sum, item) => {
      return sum + toSafeNumber(item.currentUsdtBalance);
    }, 0);

    return {
      totalCount: withBalances.length,
      totalCurrentUsdtBalance,
      wallets: withBalances,
      updatedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Failed to fetch realtime nickname seller wallet balances:", error);
    return {
      totalCount: wallets.length,
      totalCurrentUsdtBalance: 0,
      wallets,
      updatedAt: new Date().toISOString(),
    };
  }
}

export async function getRealtimeBuyOrderBuyerWalletBalances({
  fromDate = "",
  toDate = "",
  limit = 120,
  storecode = "",
}: {
  fromDate?: string;
  toDate?: string;
  limit?: number;
  storecode?: string;
} = {}): Promise<RealtimeBuyerWalletBalanceResult> {
  const client = await clientPromise;
  const collection = client.db(dbName).collection("buyorders");
  const storeCollection = client.db(dbName).collection("stores");
  const safeLimit = Math.min(Math.max(Number(limit) || 120, 1), 1000);
  const safeFromDate = String(fromDate || "").trim();
  const safeToDate = String(toDate || "").trim();
  const safeStorecode = String(storecode || "").trim();

  const fromDateValue = safeFromDate
    ? new Date(`${safeFromDate}T00:00:00+09:00`).toISOString()
    : "";
  const toDateValue = safeToDate
    ? new Date(`${safeToDate}T23:59:59+09:00`).toISOString()
    : "";

  const matchStage: Record<string, unknown> = {
    privateSale: { $ne: true },
    status: "paymentConfirmed",
    walletAddress: { $type: "string", $ne: "" },
    transactionHash: { $type: "string", $nin: ["", "0x"] },
    transactionHashFail: { $ne: true },
    $and: [
      {
        $or: [
          { settlement: { $exists: false } },
          { "settlement.status": { $ne: "paymentSettled" } },
        ],
      },
      {
        $or: [
          { "settlement.txid": { $exists: false } },
          { "settlement.txid": null },
          { "settlement.txid": "" },
          { "settlement.txid": "0x" },
        ],
      },
    ],
  };

  if (safeStorecode) {
    matchStage.storecode = new RegExp(`^${escapeRegex(safeStorecode)}$`, "i");
  }

  if (fromDateValue || toDateValue) {
    const createdAtRange: Record<string, string> = {};
    if (fromDateValue) {
      createdAtRange.$gte = fromDateValue;
    }
    if (toDateValue) {
      createdAtRange.$lte = toDateValue;
    }
    matchStage.createdAt = createdAtRange;
  }

  const groupedWallets = await collection
    .aggregate([
      {
        $match: matchStage,
      },
      {
        $project: {
          buyerWalletAddress: {
            $trim: {
              input: "$walletAddress",
            },
          },
          nickname: "$nickname",
          avatar: "$avatar",
          storecode: "$storecode",
          storeName: "$store.storeName",
          storeLogo: "$store.storeLogo",
          usdtAmount: "$usdtAmount",
          paymentConfirmedAt: "$paymentConfirmedAt",
          paymentConfirmedAtDate: {
            $convert: {
              input: "$paymentConfirmedAt",
              to: "date",
              onError: null,
              onNull: null,
            },
          },
          createdAtDate: {
            $convert: {
              input: "$createdAt",
              to: "date",
              onError: null,
              onNull: null,
            },
          },
        },
      },
      {
        $match: {
          buyerWalletAddress: { $type: "string", $ne: "" },
        },
      },
      {
        $sort: {
          paymentConfirmedAtDate: -1,
          createdAtDate: -1,
          _id: -1,
        },
      },
      {
        $group: {
          _id: { $toLower: "$buyerWalletAddress" },
          walletAddress: { $first: "$buyerWalletAddress" },
          nickname: { $first: "$nickname" },
          avatar: { $first: "$avatar" },
          storecode: { $first: "$storecode" },
          storeName: { $first: "$storeName" },
          storeLogo: { $first: "$storeLogo" },
          orderCount: { $sum: 1 },
          totalAmountUsdt: { $sum: { $toDouble: { $ifNull: ["$usdtAmount", 0] } } },
          latestPaymentConfirmedAt: { $first: "$paymentConfirmedAt" },
        },
      },
      {
        $sort: {
          orderCount: -1,
          latestPaymentConfirmedAt: -1,
          walletAddress: 1,
        },
      },
      {
        $limit: safeLimit,
      },
    ], {
      maxTimeMS: REALTIME_BUYORDER_QUERY_MAX_TIME_MS,
    })
    .toArray();

  let wallets: RealtimeBuyerWalletBalanceItem[] = groupedWallets
    .map((item: any) => {
      const walletAddress = toNullableText(item?.walletAddress);
      if (!walletAddress) {
        return null;
      }

      return {
        walletAddress,
        nickname: toNullableText(item?.nickname),
        avatar: toNullableText(item?.avatar),
        storecode: toNullableText(item?.storecode),
        storeName: toNullableText(item?.storeName),
        storeLogo: toNullableText(item?.storeLogo),
        orderCount: Number(item?.orderCount || 0),
        totalAmountUsdt: toSafeNumber(item?.totalAmountUsdt),
        latestPaymentConfirmedAt: toIsoString(item?.latestPaymentConfirmedAt),
        currentUsdtBalance: 0,
      } satisfies RealtimeBuyerWalletBalanceItem;
    })
    .filter((item): item is RealtimeBuyerWalletBalanceItem => Boolean(item));

  if (wallets.length === 0) {
    return {
      totalCount: 0,
      totalCurrentUsdtBalance: 0,
      wallets: [],
      updatedAt: new Date().toISOString(),
    };
  }

  const storecodeSet = new Set<string>();
  for (const item of wallets) {
    const storecode = toNullableText(item.storecode)?.toLowerCase();
    if (storecode) {
      storecodeSet.add(storecode);
    }
  }

  if (storecodeSet.size > 0) {
    const storeByCode = new Map<string, { storeName: string | null; storeLogo: string | null }>();
    const storeQueryConditions = Array.from(storecodeSet).map((storecode) => ({
      storecode: new RegExp(`^${escapeRegex(storecode)}$`, "i"),
    }));

    const stores = await storeCollection
      .find(
        {
          $or: storeQueryConditions,
        },
        {
          projection: {
            _id: 0,
            storecode: 1,
            storeName: 1,
            storeLogo: 1,
          },
          sort: {
            storeName: 1,
            storecode: 1,
          },
          maxTimeMS: REALTIME_BUYORDER_QUERY_MAX_TIME_MS,
        },
      )
      .toArray();

    for (const store of stores) {
      const storecode = toNullableText(store?.storecode)?.toLowerCase();
      if (!storecode || storeByCode.has(storecode)) {
        continue;
      }
      storeByCode.set(storecode, {
        storeName: toNullableText(store?.storeName),
        storeLogo: toNullableText(store?.storeLogo),
      });
    }

    wallets = wallets.map((item) => {
      const storeInfo = storeByCode.get(String(item.storecode || "").toLowerCase());

      return {
        ...item,
        storeName: storeInfo?.storeName ?? item.storeName ?? null,
        storeLogo: storeInfo?.storeLogo ?? item.storeLogo ?? null,
      };
    });
  }

  const thirdwebSecretKey = String(process.env.THIRDWEB_SECRET_KEY || "").trim();
  const usdtContractAddress = getUsdtContractAddress();
  if (!thirdwebSecretKey || !usdtContractAddress) {
    return {
      totalCount: wallets.length,
      totalCurrentUsdtBalance: 0,
      wallets,
      updatedAt: new Date().toISOString(),
    };
  }

  try {
    const thirdwebClient = createThirdwebClient({
      secretKey: thirdwebSecretKey,
    });
    const contract = getContract({
      client: thirdwebClient,
      chain: getThirdwebChain(),
      address: usdtContractAddress,
    });
    const decimals = getUsdtDecimals();

    const withBalances = await Promise.all(
      wallets.map(async (item) => {
        try {
          const rawBalance = await balanceOf({
            contract,
            address: item.walletAddress,
          });
          return {
            ...item,
            currentUsdtBalance: Number(rawBalance) / 10 ** decimals,
          };
        } catch (error) {
          console.error(`Failed to fetch buyer wallet USDT balance (${item.walletAddress}):`, error);
          return {
            ...item,
            currentUsdtBalance: 0,
          };
        }
      }),
    );

    withBalances.sort((left, right) => {
      return (
        right.currentUsdtBalance - left.currentUsdtBalance
        || right.totalAmountUsdt - left.totalAmountUsdt
        || (right.orderCount - left.orderCount)
        || left.walletAddress.localeCompare(right.walletAddress)
      );
    });

    const totalCurrentUsdtBalance = withBalances.reduce((sum, item) => {
      return sum + toSafeNumber(item.currentUsdtBalance);
    }, 0);

    return {
      totalCount: withBalances.length,
      totalCurrentUsdtBalance,
      wallets: withBalances,
      updatedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Failed to fetch realtime buyer wallet balances:", error);
    return {
      totalCount: wallets.length,
      totalCurrentUsdtBalance: 0,
      wallets,
      updatedAt: new Date().toISOString(),
    };
  }
}

const BLOCKED_BUYORDER_MONITOR_ROUTES = new Set([
  "/api/order/setBuyOrderForClearance",
  "/api/order/buyOrderSettlement",
  "/api/order/updateBuyOrderSettlement",
  "/api/order/buyOrderConfirmPaymentWithoutEscrow",
  "/api/order/buyOrderRequestPayment",
  "/api/order/requestPayment",
  "/api/order/acceptBuyOrderTask",
  "/api/order/acceptBuyOrderTaskBangbang",
  "/api/order/cancelTradeBySellerWithEscrow",
  "/api/order/cancelTradeBySeller",
]);

const BLOCKED_BUYORDER_ACTIVE_STATUSES = new Set([
  "ordered",
  "accepted",
  "paymentrequested",
]);

const getBlockedBuyOrderRouteLabel = (route: string | null) => {
  switch (route) {
    case "/api/order/setBuyOrderForClearance":
      return "정산 주문 생성";
    case "/api/order/buyOrderSettlement":
    case "/api/order/updateBuyOrderSettlement":
      return "정산 처리";
    case "/api/order/buyOrderConfirmPaymentWithoutEscrow":
      return "수동 입금확인";
    case "/api/order/buyOrderRequestPayment":
    case "/api/order/requestPayment":
      return "결제 요청";
    case "/api/order/acceptBuyOrderTask":
    case "/api/order/acceptBuyOrderTaskBangbang":
      return "판매자 수락";
    case "/api/order/cancelTradeBySellerWithEscrow":
    case "/api/order/cancelTradeBySeller":
      return "판매자 취소";
    default:
      return route || "주문 처리";
  }
};

const getBlockedBuyOrderReasonMeta = ({
  reason,
  route,
  meta,
}: {
  reason: string | null;
  route: string | null;
  meta?: Record<string, unknown> | null;
}): {
  label: string;
  detail: string;
  tone: RealtimeBlockedBuyOrderMonitorTone;
  severity: RealtimeBlockedBuyOrderSeverity;
} => {
  const normalizedReason = String(reason || "").trim().toLowerCase();
  const existingTradeId = toNullableText(meta?.existingTradeId);
  const existingStatus = toNullableText(meta?.existingStatus);
  const errorMessage = toNullableText(meta?.message);

  switch (normalizedReason) {
    case "existing_active_buy_order":
      return {
        label: "진행 중 주문 충돌",
        detail: existingTradeId
          ? `이미 진행 중인 주문 ${existingTradeId}${existingStatus ? ` · ${existingStatus}` : ""} 이 있어 새 요청이 차단되었습니다.`
          : "이미 진행 중인 주문이 있어 새 요청이 차단되었습니다.",
        tone: "amber",
        severity: "warning",
      };
    case "hmac_key_store_error":
      return {
        label: "정산 키 저장소 오류",
        detail: errorMessage || "정산 HMAC 키 저장소 오류로 주문 정산 요청이 차단되었습니다.",
        tone: "rose",
        severity: "critical",
      };
    case "invalid_hmac_signature":
      return {
        label: "HMAC 서명 불일치",
        detail: "정산 요청 서명이 일치하지 않아 차단되었습니다.",
        tone: "rose",
        severity: "critical",
      };
    case "replayed_nonce":
      return {
        label: "중복 요청 감지",
        detail: "이미 사용된 nonce가 감지되어 재전송 요청이 차단되었습니다.",
        tone: "amber",
        severity: "warning",
      };
    case "expired_timestamp":
      return {
        label: "만료된 요청 시각",
        detail: "허용 시간을 벗어난 요청이라 차단되었습니다.",
        tone: "amber",
        severity: "warning",
      };
    case "missing_or_invalid_hmac_headers":
      return {
        label: "정산 인증 헤더 누락",
        detail: "HMAC 헤더가 없거나 형식이 올바르지 않아 차단되었습니다.",
        tone: "amber",
        severity: "warning",
      };
    case "missing_or_invalid_signature_fields":
      return {
        label: "서명 필드 누락",
        detail: "서명 검증에 필요한 필드가 빠져 요청이 차단되었습니다.",
        tone: "amber",
        severity: "warning",
      };
    case "invalid_signature":
      return {
        label: "서명 불일치",
        detail: "요청 서명이 검증되지 않아 차단되었습니다.",
        tone: "rose",
        severity: "critical",
      };
    case "invalid_nonce":
      return {
        label: "유효하지 않은 nonce",
        detail: "nonce 값이 잘못되어 요청이 차단되었습니다.",
        tone: "amber",
        severity: "warning",
      };
    case "invalid_wallet_address":
      return {
        label: "잘못된 지갑 주소",
        detail: "지갑 주소 형식이 올바르지 않아 요청이 차단되었습니다.",
        tone: "amber",
        severity: "warning",
      };
    case "forbidden_wallet_mismatch":
      return {
        label: "관리 지갑 불일치",
        detail: "요청 지갑이 주문/가맹점 관리자 지갑과 일치하지 않아 차단되었습니다.",
        tone: "rose",
        severity: "critical",
      };
    case "store_admin_wallet_not_configured":
      return {
        label: "관리 지갑 미설정",
        detail: "가맹점 관리자 지갑이 설정되지 않아 주문 처리가 차단되었습니다.",
        tone: "amber",
        severity: "warning",
      };
    case "storecode_required":
      return {
        label: "storecode 누락",
        detail: "가맹점 식별값이 없어 요청이 차단되었습니다.",
        tone: "sky",
        severity: "info",
      };
    default:
      return {
        label: normalizedReason || "차단됨",
        detail: route
          ? `${getBlockedBuyOrderRouteLabel(route)} 요청이 ${normalizedReason || "unknown_reason"} 사유로 차단되었습니다.`
          : "주문 요청이 차단되었습니다.",
        tone: "sky",
        severity: "info",
      };
  }
};

const isBlockedBuyOrderStillActive = ({
  route,
  reason,
  order,
}: {
  route: string | null;
  reason: string | null;
  order: any;
}) => {
  if (!order) {
    return false;
  }

  const normalizedRoute = String(route || "").trim();
  const normalizedReason = String(reason || "").trim().toLowerCase();
  const status = String(order?.status || "").trim().toLowerCase();
  const settlementStatus = String(order?.settlement?.status || "").trim().toLowerCase();

  if (normalizedRoute === "/api/order/setBuyOrderForClearance" && normalizedReason === "existing_active_buy_order") {
    return BLOCKED_BUYORDER_ACTIVE_STATUSES.has(status);
  }

  if (
    normalizedRoute === "/api/order/buyOrderSettlement"
    || normalizedRoute === "/api/order/updateBuyOrderSettlement"
  ) {
    return settlementStatus !== "paymentsettled" && status !== "cancelled";
  }

  if (normalizedRoute === "/api/order/buyOrderConfirmPaymentWithoutEscrow") {
    return status !== "paymentconfirmed" && status !== "paymentsettled" && status !== "cancelled";
  }

  if (
    normalizedRoute === "/api/order/acceptBuyOrderTask"
    || normalizedRoute === "/api/order/acceptBuyOrderTaskBangbang"
  ) {
    return status === "ordered";
  }

  if (
    normalizedRoute === "/api/order/cancelTradeBySellerWithEscrow"
    || normalizedRoute === "/api/order/cancelTradeBySeller"
  ) {
    return status !== "cancelled";
  }

  if (
    normalizedRoute === "/api/order/buyOrderRequestPayment"
    || normalizedRoute === "/api/order/requestPayment"
  ) {
    return status !== "paymentrequested" && status !== "paymentconfirmed" && status !== "paymentsettled";
  }

  return true;
};

export async function getRealtimeBlockedBuyOrders({
  limit = 24,
  lookbackHours = 24 * 14,
  scanLimit = 800,
}: {
  limit?: number;
  lookbackHours?: number;
  scanLimit?: number;
} = {}): Promise<RealtimeBlockedBuyOrderResult> {
  const client = await clientPromise;
  const db = client.db(dbName);
  const logCollection = db.collection("adminApiCallLogs");
  const orderCollection = db.collection("buyorders");

  const safeLimit = Math.min(Math.max(Number(limit) || 24, 1), 100);
  const safeLookbackHours = Math.min(Math.max(Number(lookbackHours) || 24 * 14, 1), 24 * 90);
  const safeScanLimit = Math.min(Math.max(Number(scanLimit) || 800, safeLimit), 3000);
  const lookbackStart = new Date(Date.now() - safeLookbackHours * 60 * 60 * 1000);

  const routeList = Array.from(BLOCKED_BUYORDER_MONITOR_ROUTES);
  const rawLogs = await logCollection
    .find(
      {
        status: "blocked",
        route: { $in: routeList },
        createdAt: { $gte: lookbackStart },
        $or: [
          { "requestBody.orderId": { $type: "string", $ne: "" } },
          { "requestBody.tradeId": { $type: "string", $ne: "" } },
          { "meta.existingOrderId": { $type: "string", $ne: "" } },
          { "meta.existingTradeId": { $type: "string", $ne: "" } },
        ],
      },
      {
        projection: {
          _id: 0,
          route: 1,
          guardType: 1,
          reason: 1,
          publicIp: 1,
          requesterWalletAddress: 1,
          requestBody: 1,
          meta: 1,
          createdAt: 1,
        },
        sort: { createdAt: -1 },
        limit: safeScanLimit,
        maxTimeMS: REALTIME_BUYORDER_QUERY_MAX_TIME_MS,
      },
    )
    .toArray();

  type GroupedBlockedItem = {
    blockedKey: string;
    orderId: string | null;
    tradeId: string | null;
    route: string | null;
    guardType: string | null;
    latestReason: string | null;
    latestPublicIp: string | null;
    latestRequesterWalletAddress: string | null;
    requestBody: Record<string, unknown> | null;
    meta: Record<string, unknown> | null;
    firstBlockedAt: string | null;
    latestBlockedAt: string | null;
    blockedCount: number;
    distinctReasons: Set<string>;
  };

  const grouped = new Map<string, GroupedBlockedItem>();

  for (const log of rawLogs) {
    const metaValue = log && typeof log.meta === "object" ? log.meta as Record<string, unknown> : null;
    const requestBodyValue = log && typeof log.requestBody === "object" ? log.requestBody as Record<string, unknown> : null;
    const tradeId =
      toNullableText(metaValue?.existingTradeId)
      || toNullableText(requestBodyValue?.tradeId);
    const orderId =
      toNullableText(metaValue?.existingOrderId)
      || toNullableText(requestBodyValue?.orderId);
    const blockedKey = tradeId ? `trade:${tradeId}` : orderId ? `order:${orderId}` : null;

    if (!blockedKey) {
      continue;
    }

    const createdAt = toIsoString(log?.createdAt);
    const createdAtTime = createdAt ? Date.parse(createdAt) : 0;
    const existing = grouped.get(blockedKey);

    if (!existing) {
      grouped.set(blockedKey, {
        blockedKey,
        orderId,
        tradeId,
        route: toNullableText(log?.route),
        guardType: toNullableText(log?.guardType),
        latestReason: toNullableText(log?.reason),
        latestPublicIp: toNullableText(log?.publicIp),
        latestRequesterWalletAddress: toNullableText(log?.requesterWalletAddress),
        requestBody: requestBodyValue,
        meta: metaValue,
        firstBlockedAt: createdAt,
        latestBlockedAt: createdAt,
        blockedCount: 1,
        distinctReasons: new Set([toNullableText(log?.reason) || "unknown"]),
      });
      continue;
    }

    existing.blockedCount += 1;
    existing.distinctReasons.add(toNullableText(log?.reason) || "unknown");

    const firstTime = existing.firstBlockedAt ? Date.parse(existing.firstBlockedAt) : createdAtTime;
    if (createdAtTime && (!firstTime || createdAtTime < firstTime)) {
      existing.firstBlockedAt = createdAt;
    }

    const latestTime = existing.latestBlockedAt ? Date.parse(existing.latestBlockedAt) : 0;
    if (createdAtTime >= latestTime) {
      existing.orderId = orderId || existing.orderId;
      existing.tradeId = tradeId || existing.tradeId;
      existing.route = toNullableText(log?.route);
      existing.guardType = toNullableText(log?.guardType);
      existing.latestReason = toNullableText(log?.reason);
      existing.latestPublicIp = toNullableText(log?.publicIp);
      existing.latestRequesterWalletAddress = toNullableText(log?.requesterWalletAddress);
      existing.requestBody = requestBodyValue;
      existing.meta = metaValue;
      existing.latestBlockedAt = createdAt;
    }
  }

  if (grouped.size === 0) {
    return {
      totalCount: 0,
      criticalCount: 0,
      warningCount: 0,
      infoCount: 0,
      orders: [],
      updatedAt: new Date().toISOString(),
    };
  }

  const tradeIds = new Set<string>();
  const objectIds: ObjectId[] = [];

  for (const item of grouped.values()) {
    if (item.tradeId) {
      tradeIds.add(item.tradeId);
    }
    if (item.orderId && ObjectId.isValid(item.orderId)) {
      objectIds.push(new ObjectId(item.orderId));
    }
  }

  const orderQuery: Record<string, unknown>[] = [];
  if (tradeIds.size > 0) {
    orderQuery.push({
      tradeId: { $in: Array.from(tradeIds) },
    });
  }
  if (objectIds.length > 0) {
    orderQuery.push({
      _id: { $in: objectIds },
    });
  }

  const orders = orderQuery.length > 0
    ? await orderCollection
        .find(
          {
            $and: [
              { privateSale: { $ne: true } },
              { $or: orderQuery },
            ],
          },
          {
            projection: {
              _id: 1,
              tradeId: 1,
              privateSale: 1,
              storecode: 1,
              status: 1,
              createdAt: 1,
              acceptedAt: 1,
              paymentRequestedAt: 1,
              paymentConfirmedAt: 1,
              usdtAmount: 1,
              krwAmount: 1,
              walletAddress: 1,
              nickname: 1,
              buyer: 1,
              seller: 1,
              store: 1,
              settlement: 1,
            },
            maxTimeMS: REALTIME_BUYORDER_QUERY_MAX_TIME_MS,
          },
        )
        .toArray()
    : [];

  const orderByTradeId = new Map<string, any>();
  const orderByOrderId = new Map<string, any>();

  for (const order of orders) {
    const tradeId = toNullableText(order?.tradeId);
    const orderId = order?._id instanceof ObjectId ? order._id.toHexString() : toNullableText(order?._id);
    if (tradeId) {
      orderByTradeId.set(tradeId, order);
    }
    if (orderId) {
      orderByOrderId.set(orderId, order);
    }
  }

  const items: RealtimeBlockedBuyOrderItem[] = Array.from(grouped.values())
    .map((item) => {
      const order = (item.tradeId ? orderByTradeId.get(item.tradeId) : null)
        || (item.orderId ? orderByOrderId.get(item.orderId) : null)
        || null;

      if (!order) {
        return null;
      }

      if (order?.privateSale === true) {
        return null;
      }

      if (!isBlockedBuyOrderStillActive({
        route: item.route,
        reason: item.latestReason,
        order,
      })) {
        return null;
      }

      const reasonMeta = getBlockedBuyOrderReasonMeta({
        reason: item.latestReason,
        route: item.route,
        meta: item.meta,
      });

      return {
        blockedKey: item.blockedKey,
        orderId: item.orderId || (order?._id instanceof ObjectId ? order._id.toHexString() : null),
        tradeId: item.tradeId || toNullableText(order?.tradeId),
        storecode: toNullableText(order?.storecode || order?.store?.storecode),
        storeName: toNullableText(order?.store?.storeName),
        storeLogo: toNullableText(order?.store?.storeLogo),
        buyerNickname: toNullableText(order?.nickname || order?.buyer?.nickname),
        buyerDepositName: toNullableText(order?.buyer?.depositName),
        buyerWalletAddress: toNullableText(order?.walletAddress),
        sellerNickname: toNullableText(order?.seller?.nickname),
        status: toNullableText(order?.status),
        settlementStatus: toNullableText(order?.settlement?.status),
        amountUsdt: toSafeNumber(order?.usdtAmount),
        amountKrw: toSafeNumber(order?.krwAmount),
        route: item.route || "",
        routeLabel: getBlockedBuyOrderRouteLabel(item.route),
        guardType: item.guardType,
        latestReason: item.latestReason,
        latestReasonLabel: reasonMeta.label,
        latestReasonDetail: reasonMeta.detail,
        tone: reasonMeta.tone,
        severity: reasonMeta.severity,
        blockedCount: item.blockedCount,
        firstBlockedAt: item.firstBlockedAt,
        latestBlockedAt: item.latestBlockedAt,
        latestPublicIp: item.latestPublicIp,
        latestRequesterWalletAddress: item.latestRequesterWalletAddress,
        distinctReasons: Array.from(item.distinctReasons).sort(),
        requestBody: item.requestBody,
        meta: item.meta,
      } satisfies RealtimeBlockedBuyOrderItem;
    })
    .filter((item): item is RealtimeBlockedBuyOrderItem => Boolean(item))
    .sort((left, right) => {
      const leftTime = left.latestBlockedAt ? Date.parse(left.latestBlockedAt) : 0;
      const rightTime = right.latestBlockedAt ? Date.parse(right.latestBlockedAt) : 0;
      return (
        rightTime - leftTime
        || right.blockedCount - left.blockedCount
        || right.amountKrw - left.amountKrw
        || String(left.tradeId || left.orderId || "").localeCompare(String(right.tradeId || right.orderId || ""))
      );
    })
    .slice(0, safeLimit);

  const criticalCount = items.filter((item) => item.severity === "critical").length;
  const warningCount = items.filter((item) => item.severity === "warning").length;
  const infoCount = items.filter((item) => item.severity === "info").length;

  return {
    totalCount: items.length,
    criticalCount,
    warningCount,
    infoCount,
    orders: items,
    updatedAt: new Date().toISOString(),
  };
}
