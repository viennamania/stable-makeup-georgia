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
  currentUsdtBalance: number;
};

export type RealtimeNicknameSellerWalletBalanceResult = {
  totalCount: number;
  totalCurrentUsdtBalance: number;
  wallets: RealtimeNicknameSellerWalletBalanceItem[];
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
          pgFeeAmountUsdt: { $sum: { $toDouble: { $ifNull: ["$settlement.feeAmount", 0] } } },
          pgFeeAmountKrw: { $sum: { $toDouble: { $ifNull: ["$settlement.feeAmountKRW", 0] } } },
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

  const { totalCount, docs } = await withTransientMongoRetry(async () => {
    const nextTotalCount = await collection.countDocuments(
      query,
      { maxTimeMS: REALTIME_BUYORDER_LIST_MAX_TIME_MS },
    );
    const totalPages = Math.max(1, Math.ceil(nextTotalCount / safeLimit));
    const safePage = Math.min(requestedPage, totalPages);

    const nextDocs = await collection
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
    ])
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
  const collection = client.db(dbName).collection("users");

  const safeNickname = toNullableText(nickname)?.toLowerCase() || "seller";
  const safeExcludeStorecode = toNullableText(excludeStorecode)?.toLowerCase() || "";
  const safeLimit = Math.min(Math.max(Number(limit) || 120, 1), 400);

  const nicknameRegex = new RegExp(`^${escapeRegex(safeNickname)}$`, "i");
  const userQuery: Record<string, unknown> = {
    nickname: nicknameRegex,
    walletAddress: { $type: "string", $ne: "" },
  };

  if (safeExcludeStorecode) {
    const excludeStorecodeRegex = new RegExp(`^${escapeRegex(safeExcludeStorecode)}$`, "i");
    userQuery.storecode = { $not: excludeStorecodeRegex };
  }

  const users = await collection
    .find(
      userQuery,
      {
        projection: {
          _id: 0,
          id: 1,
          nickname: 1,
          storecode: 1,
          walletAddress: 1,
        },
        sort: {
          _id: -1,
        },
        limit: safeLimit * 4,
      },
    )
    .toArray();

  const walletMap = new Map<string, RealtimeNicknameSellerWalletBalanceItem>();

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
      nickname: toNullableText(user?.nickname) || safeNickname,
      storecode: toNullableText(user?.storecode),
      storeName: null,
      storeLogo: null,
      walletAddress,
      currentUsdtBalance: 0,
    });

    if (walletMap.size >= safeLimit) {
      break;
    }
  }

  const wallets = Array.from(walletMap.values());

  const nonAdminStorecodes = Array.from(
    new Set(
      wallets
        .map((item) => toNullableText(item.storecode)?.toLowerCase() || "")
        .filter((storecode) => Boolean(storecode && storecode !== "admin")),
    ),
  );

  const storeMetaByCode = new Map<string, { storeName: string | null; storeLogo: string | null }>();
  if (nonAdminStorecodes.length > 0) {
    try {
      const storeCollection = client.db(dbName).collection("stores");
      const stores = await storeCollection
        .find(
          {
            storecode: { $in: nonAdminStorecodes },
          },
          {
            projection: {
              _id: 0,
              storecode: 1,
              storeName: 1,
              storeLogo: 1,
            },
          },
        )
        .toArray();

      for (const store of stores) {
        const storecode = toNullableText(store?.storecode)?.toLowerCase();
        if (!storecode) {
          continue;
        }

        storeMetaByCode.set(storecode, {
          storeName: toNullableText(store?.storeName),
          storeLogo: toNullableText(store?.storeLogo),
        });
      }
    } catch (error) {
      console.error("Failed to fetch store metadata for realtime nickname seller balances:", error);
    }
  }

  const walletsWithStoreMeta = wallets.map((item) => {
    const storecode = toNullableText(item.storecode)?.toLowerCase() || "";
    const storeMeta = storeMetaByCode.get(storecode);
    return {
      ...item,
      storeName: storeMeta?.storeName || null,
      storeLogo: storeMeta?.storeLogo || null,
    };
  });

  if (walletsWithStoreMeta.length === 0) {
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
      totalCount: walletsWithStoreMeta.length,
      totalCurrentUsdtBalance: 0,
      wallets: walletsWithStoreMeta,
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
      walletsWithStoreMeta.map(async (item) => {
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
      totalCount: walletsWithStoreMeta.length,
      totalCurrentUsdtBalance: 0,
      wallets: walletsWithStoreMeta,
      updatedAt: new Date().toISOString(),
    };
  }
}
