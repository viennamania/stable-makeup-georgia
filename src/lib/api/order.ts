import { use } from 'react';
import { createHash } from "crypto";
import clientPromise from '../mongodb';

import { dbName } from '../mongodb';


// object id
import { ObjectId } from 'mongodb';
import {
  type BuyOrderStatusRealtimeEvent,
} from "@lib/ably/constants";
import {
  publishBuyOrderStatusEvent,
} from "@lib/ably/server";
import {
  saveBuyOrderStatusRealtimeEvent,
} from "@lib/api/buyOrderStatusRealtimeEvent";
import { scheduleUsdtTransactionHashReceiptReconcile } from "@lib/api/tokenTransfer";
import {
  getConfiguredClearanceSettlementWalletAddress,
  isConfiguredClearanceRequesterWallet,
  resolveConfiguredClearanceBuyer,
  resolveConfiguredClearanceSellerBankInfo,
} from "@/lib/server/clearance-order-security";
import { syncThirdwebSellerUsdtWebhooksIfStale } from "@/lib/server/thirdweb-insight-webhook-sync";
import {
  isWithdrawalWebhookGeneratedClearanceOrder,
  isWithdrawalWebhookGeneratedClearanceOrderDeletable,
  WITHDRAWAL_WEBHOOK_CLEARANCE_CREATED_BY_ROUTE,
  WITHDRAWAL_WEBHOOK_CLEARANCE_DUMMY_TRANSFER_REASON,
  WITHDRAWAL_WEBHOOK_CLEARANCE_SOURCE,
} from "@/lib/clearance-webhook-order";
import { normalizeWalletAddress } from "@/lib/server/user-read-security";



export interface OrderProps {
  /*
  name: string;
  username: string;
  email: string;
  image: string;
  bio: string;
  bioMdx: MDXRemoteSerializeResult<Record<string, unknown>>;
  followers: number;
  verified: boolean;
  */

  id: string,
  name: string,
  nickname: string,
  storecode: string,
  email: string,
  avatar: string,
  regType: string,
  mobile: string,
  gender: string,
  weight: number,
  height: number,
  birthDate: string,
  purpose: string,
  marketingAgree: string,
  createdAt: string,
  updatedAt: string,
  deletedAt: string,
  loginedAt: string,
  followers : number,
  emailVerified: boolean,
  bio: string,

  password: string,

  seller: any,

  status: string,

  walletAddress: string,
  signerAddress?: string,

  tradeId: string,

  usdtAmount: number,
  krwAmount: number,
  
  acceptedAt: string,
  paymentRequestedAt: string,
  paymentConfirmedAt: string,
  cancelledAt: string,

  buyer: any,

  transactionHash: string,
  escrowTransactionHash?: string,
  queueId?: string | null,
  minedAt?: string | null,

  agentcode: string,

  totalPaymentConfirmedCount: number,
  totalPaymentConfirmedKrwAmount: number,
  totalPaymentConfirmedUsdtAmount: number,

  escrowWallet: any,

  latestBuyOrder: any,

  userType: string,

  returnUrl: string,
  orderNumber: string,

  createdByApi?: string | null,
  createdByRequest?: any,
  autoConfirmPayment?: boolean | null,
  matchedByAdmin?: boolean | null,
  paymentConfirmedBy?: any,
  paymentConfirmedByName?: string | null,
  paymentConfirmedByWalletAddress?: string | null,
  confirmedBy?: any,
  confirmedByName?: string | null,
  confirmedByWalletAddress?: string | null,
  processedBy?: any,
  processedByName?: string | null,
  processedByWalletAddress?: string | null,
  cancelledBy?: any,
  cancelledByAdmin?: any,
  cancelledByName?: string | null,
  cancelledByWalletAddress?: string | null,
}

export interface ResultProps {
  totalCount: number;
  orders: OrderProps[];
}

export interface BlockedBuyOrderHistoryItem {
  orderId: string | null;
  tradeId: string | null;
  status: string | null;
  settlementStatus: string | null;
  amountUsdt: number;
  amountKrw: number;
  createdAt: string | null;
  paymentRequestedAt: string | null;
  paymentConfirmedAt: string | null;
  buyerNickname: string | null;
  buyerDepositName: string | null;
  sellerNickname: string | null;
}

export interface BlockedBuyOrderHistoryResult {
  anchorTradeId: string | null;
  anchorOrderId: string | null;
  anchorCreatedAt: string | null;
  storecode: string | null;
  matchType: "walletAddress" | "depositName" | "none";
  matchValue: string | null;
  totalCount: number;
  paymentConfirmedCount: number;
  cancelledCount: number;
  activeCount: number;
  orders: BlockedBuyOrderHistoryItem[];
}

const BUYORDER_REALTIME_PROJECTION = {
  _id: 1,
  tradeId: 1,
  status: 1,
  updatedAt: 1,
  walletAddress: 1,
  storecode: 1,
  store: 1,
  krwAmount: 1,
  usdtAmount: 1,
  nickname: 1,
  buyer: 1,
  autoConfirmPayment: 1,
  matchedByAdmin: 1,
  cancelTradeReason: 1,
  transactionHash: 1,
  escrowTransactionHash: 1,
  queueId: 1,
  minedAt: 1,
  paymentConfirmedBy: 1,
  paymentConfirmedByName: 1,
  paymentConfirmedByWalletAddress: 1,
  confirmedBy: 1,
  confirmedByName: 1,
  confirmedByWalletAddress: 1,
  processedBy: 1,
  processedByName: 1,
  processedByWalletAddress: 1,
  cancelledAt: 1,
  cancelledBy: 1,
  cancelledByAdmin: 1,
  cancelledByName: 1,
  cancelledByWalletAddress: 1,
  settlement: 1,
} as const;

function getBuyOrderBuyerName(order: any): string | null {
  const raw = String(
    order?.buyer?.depositName ||
      order?.buyer?.bankInfo?.accountHolder ||
      order?.nickname ||
      "",
  ).trim();
  return raw || null;
}

function getBuyOrderBuyerAccountNumber(order: any): string | null {
  const raw = String(
    order?.buyer?.bankInfo?.accountNumber ||
      order?.buyer?.depositBankAccountNumber ||
      order?.buyer?.bankAccountNumber ||
      "",
  ).trim();
  return raw || null;
}

function getBuyOrderBuyerWalletAddress(order: any): string | null {
  const raw = String(order?.walletAddress || order?.buyer?.walletAddress || "").trim();
  return raw || null;
}

function toSafeNumber(value: unknown): number {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

function toNullableText(value: unknown): string | null {
  if (typeof value === "string") {
    const normalized = value.trim();
    return normalized || null;
  }

  if (typeof value === "number" || typeof value === "bigint") {
    const normalized = String(value).trim();
    return normalized || null;
  }

  return null;
}

function escapeRegex(value: string): string {
  return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeSearchText(value: unknown): string {
  if (typeof value !== "string") {
    return "";
  }
  return value.trim();
}

function toContainsRegexFilter(value: unknown):
  | {
      $regex: string;
      $options: "i";
    }
  | undefined {
  const safe = normalizeSearchText(value);
  if (!safe) {
    return undefined;
  }
  return {
    $regex: escapeRegex(safe),
    $options: "i",
  };
}

function appendExactFilter(target: Record<string, any>, field: string, value: unknown) {
  const safe = normalizeSearchText(value);
  if (!safe) {
    return;
  }
  target[field] = safe;
}

function appendContainsFilter(target: Record<string, any>, field: string, value: unknown) {
  const regexFilter = toContainsRegexFilter(value);
  if (!regexFilter) {
    return;
  }
  target[field] = regexFilter;
}

const toDoubleExpr = (path: string) => ({
  $convert: {
    input: `$${path}`,
    to: "double",
    onError: 0,
    onNull: 0,
  },
});

function toNormalizedHash(value: unknown): string | null {
  const raw = String(value || "").trim();
  if (!raw || raw === "0x") {
    return null;
  }
  return raw;
}

function buildWithdrawalWebhookDummyTransactionHash({
  tradeId,
  storecode,
  walletAddress,
  createdAt,
}: {
  tradeId: string;
  storecode: string;
  walletAddress: string;
  createdAt: string;
}) {
  return `0x${createHash("sha256")
    .update(
      [
        "withdrawal-webhook-clearance-dummy-transfer",
        String(tradeId || "").trim(),
        String(storecode || "").trim().toLowerCase(),
        String(walletAddress || "").trim().toLowerCase(),
        String(createdAt || "").trim(),
      ].join("|"),
    )
    .digest("hex")}`;
}

const BUYORDER_READ_INDEX_STORE_PRIVATE_STATUS_CREATED =
  "idx_buyorders_store_private_status_created";
const BUYORDER_READ_INDEX_PRIVATE_STATUS_CREATED =
  "idx_buyorders_private_status_created";
const BUYORDER_READ_INDEX_STORE_PRIVATE_STATUS_AUDIO =
  "idx_buyorders_store_private_status_audio";
const BUYORDER_READ_INDEX_PAYMENT_REQUESTED =
  "idx_buyorders_payment_requested";
const BUYORDER_READ_INDEX_STATUS_PRIVATE_AGENT_STORE_CREATED =
  "idx_buyorders_status_private_agent_store_created";
const BUYORDER_READ_INDEX_PRIVATE_STATUS_AGENT_CREATED =
  "idx_buyorders_private_status_agent_created";
const BUYORDER_READ_INDEX_STORE_WALLET_STATUS_CREATED =
  "idx_buyorders_store_wallet_status_created";
// Duplicate-order prevention should only block actionable, in-flight orders.
const BLOCKING_BUYORDER_STATUSES = ["ordered", "accepted", "paymentRequested"] as const;
const USER_BUYORDER_SYNC_STATUSES = [
  ...BLOCKING_BUYORDER_STATUSES,
  "paymentConfirmed",
  "cancelled",
  "completed",
] as const;
const THIRDWEB_BUYORDER_WEBHOOK_SYNC_TRIGGER_STATUSES = new Set([
  "ordered",
  "accepted",
  "paymentRequested",
  "paymentConfirmed",
  "paymentSettled",
  "cancelled",
]);

const scheduleThirdwebBuyerWebhookSync = () => {
  void syncThirdwebSellerUsdtWebhooksIfStale().catch((error) => {
    console.error("Failed to sync thirdweb USDT webhooks after buyorder status change:", error);
  });
};

const getBuyOrderScanRelevantWalletAddresses = (order: any): string[] => {
  return Array.from(
    new Set(
      [
        normalizeWalletAddress(order?.walletAddress),
        normalizeWalletAddress(order?.buyer?.walletAddress),
        normalizeWalletAddress(order?.seller?.walletAddress),
        normalizeWalletAddress(order?.store?.sellerWalletAddress),
        normalizeWalletAddress(order?.store?.privateSellerWalletAddress),
        normalizeWalletAddress(order?.store?.settlementWalletAddress),
        normalizeWalletAddress(order?.store?.settlementFeeWalletAddress),
        normalizeWalletAddress(order?.settlement?.settlementWalletAddress),
        normalizeWalletAddress(order?.settlement?.feeWalletAddress),
        normalizeWalletAddress(order?.escrowWallet?.address),
        normalizeWalletAddress(order?.escrowWallet?.smartAccountAddress),
      ].filter((walletAddress): walletAddress is string => Boolean(walletAddress)),
    ),
  );
};

const globalBuyOrderReadState = globalThis as typeof globalThis & {
  __buyOrderReadIndexesReady?: boolean;
  __buyOrderReadCache?: Map<string, { expiresAt: number; value: any }>;
};

const BUYORDER_READ_CACHE_TTL_MS = Number.parseInt(
  process.env.BUYORDER_READ_CACHE_TTL_MS || "",
  10,
) > 0
  ? Number.parseInt(process.env.BUYORDER_READ_CACHE_TTL_MS || "", 10)
  : 5000;
const ESCROW_BALANCE_QUERY_MAX_TIME_MS = Number.parseInt(
  process.env.ESCROW_BALANCE_QUERY_MAX_TIME_MS || "",
  10,
) > 0
  ? Number.parseInt(process.env.ESCROW_BALANCE_QUERY_MAX_TIME_MS || "", 10)
  : 12000;
const BUYORDER_QUERY_MAX_TIME_MS = Number.parseInt(
  process.env.BUYORDER_QUERY_MAX_TIME_MS || "",
  10,
) > 0
  ? Number.parseInt(process.env.BUYORDER_QUERY_MAX_TIME_MS || "", 10)
  : 12000;
const ENABLE_BUYORDER_RUNTIME_INDEX_CREATION =
  String(process.env.ENABLE_BUYORDER_RUNTIME_INDEX_CREATION || "").toLowerCase() === "true";

const getBuyOrderReadCache = () => {
  if (!globalBuyOrderReadState.__buyOrderReadCache) {
    globalBuyOrderReadState.__buyOrderReadCache = new Map();
  }
  return globalBuyOrderReadState.__buyOrderReadCache;
};

const getBuyOrderCachedValue = (key: string) => {
  const cache = getBuyOrderReadCache();
  const cached = cache.get(key);
  if (!cached) {
    return undefined;
  }
  if (cached.expiresAt <= Date.now()) {
    cache.delete(key);
    return undefined;
  }
  return cached.value;
};

const setBuyOrderCachedValue = (key: string, value: any) => {
  const cache = getBuyOrderReadCache();
  cache.set(key, {
    value,
    expiresAt: Date.now() + BUYORDER_READ_CACHE_TTL_MS,
  });
};

const clearBuyOrderReadCache = () => {
  const cache = getBuyOrderReadCache();
  cache.clear();
};

const escapeRegExp = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

type BuyOrderDepositNameSearchMode = "legacy" | "buyerExact";

const normalizeBuyOrderDepositNameSearchMode = (
  value: unknown,
): BuyOrderDepositNameSearchMode => {
  return String(value || "").trim() === "buyerExact" ? "buyerExact" : "legacy";
};

const buildBuyOrderDepositNameFilter = ({
  searchDepositName,
  searchDepositNameMode,
}: {
  searchDepositName: string;
  searchDepositNameMode: BuyOrderDepositNameSearchMode;
}) => {
  const normalizedSearchDepositName = String(searchDepositName || "").trim();

  if (!normalizedSearchDepositName) {
    return {};
  }

  if (searchDepositNameMode === "buyerExact") {
    return {
      "buyer.depositName": normalizedSearchDepositName,
    };
  }

  const escapedSearchDepositName = escapeRegExp(normalizedSearchDepositName);

  return {
    $or: [
      {
        "buyer.depositName": {
          $regex: escapedSearchDepositName,
          $options: "i",
        },
      },
      {
        "seller.bankInfo.accountHolder": {
          $regex: escapedSearchDepositName,
          $options: "i",
        },
      },
    ],
  };
};

const buildBuyOrderSellerBankAccountFilter = ({
  searchStoreBankAccountNumber,
}: {
  searchStoreBankAccountNumber: string;
}) => {
  const normalizedSearchStoreBankAccountNumber = String(
    searchStoreBankAccountNumber || "",
  ).trim();

  if (!normalizedSearchStoreBankAccountNumber) {
    return {};
  }

  // Numeric input is treated as an account-number search. Non-numeric input
  // from the admin UI is more likely an account-holder lookup.
  if (/^[\d\s-]+$/.test(normalizedSearchStoreBankAccountNumber)) {
    return {
      "seller.bankInfo.accountNumber": {
        $regex: escapeRegExp(normalizedSearchStoreBankAccountNumber),
        $options: "i",
      },
    };
  }

  return {
    "seller.bankInfo.accountHolder": normalizedSearchStoreBankAccountNumber,
  };
};

const ensureBuyOrderReadIndexes = async (collection: any) => {
  if (globalBuyOrderReadState.__buyOrderReadIndexesReady) {
    return;
  }

  if (!ENABLE_BUYORDER_RUNTIME_INDEX_CREATION) {
    globalBuyOrderReadState.__buyOrderReadIndexesReady = true;
    return;
  }

  globalBuyOrderReadState.__buyOrderReadIndexesReady = true;

  try {
    await Promise.all([
      collection.createIndex(
        { storecode: 1, privateSale: 1, status: 1, createdAt: -1 },
        { name: BUYORDER_READ_INDEX_STORE_PRIVATE_STATUS_CREATED },
      ),
      collection.createIndex(
        { privateSale: 1, status: 1, createdAt: -1 },
        { name: BUYORDER_READ_INDEX_PRIVATE_STATUS_CREATED },
      ),
      collection.createIndex(
        { storecode: 1, privateSale: 1, status: 1, audioOn: 1 },
        { name: BUYORDER_READ_INDEX_STORE_PRIVATE_STATUS_AUDIO },
      ),
      collection.createIndex(
        {
          storecode: 1,
          privateSale: 1,
          status: 1,
          "buyer.depositName": 1,
          createdAt: -1,
        },
        { name: BUYORDER_READ_INDEX_PAYMENT_REQUESTED },
      ),
      collection.createIndex(
        {
          status: 1,
          privateSale: 1,
          agentcode: 1,
          storecode: 1,
          createdAt: -1,
        },
        { name: BUYORDER_READ_INDEX_STATUS_PRIVATE_AGENT_STORE_CREATED },
      ),
      collection.createIndex(
        {
          privateSale: 1,
          status: 1,
          agentcode: 1,
          createdAt: -1,
        },
        { name: BUYORDER_READ_INDEX_PRIVATE_STATUS_AGENT_CREATED },
      ),
      collection.createIndex(
        {
          storecode: 1,
          walletAddress: 1,
          status: 1,
          createdAt: -1,
        },
        { name: BUYORDER_READ_INDEX_STORE_WALLET_STATUS_CREATED },
      ),
    ]);
  } catch (error) {
    console.error("buyorders read index ensure failed:", error);
  }
};

export async function getBlockingBuyOrderByStorecodeAndWalletAddress(
  {
    storecode,
    walletAddress,
  }: {
    storecode: string;
    walletAddress: string;
  }
): Promise<any | null> {
  const normalizedStorecode = String(storecode || "").trim();
  const normalizedWalletAddress = normalizeWalletAddress(walletAddress);

  if (!normalizedStorecode || !normalizedWalletAddress) {
    return null;
  }

  const client = await clientPromise;
  const collection = client.db(dbName).collection("buyorders");
  await ensureBuyOrderReadIndexes(collection);

  const walletAddressRegex = new RegExp(
    `^${escapeRegExp(normalizedWalletAddress)}$`,
    "i",
  );

  return collection.findOne(
    {
      storecode: normalizedStorecode,
      walletAddress: walletAddressRegex,
      status: { $in: [...BLOCKING_BUYORDER_STATUSES] },
    },
    {
      sort: { createdAt: -1 },
      projection: {
        _id: 1,
        tradeId: 1,
        status: 1,
        storecode: 1,
        walletAddress: 1,
        createdAt: 1,
        acceptedAt: 1,
        paymentRequestedAt: 1,
      },
    },
  );
}

async function syncUserBuyOrderStateByWalletAndStorecode({
  client,
  buyOrderCollection,
  storecode,
  walletAddress,
}: {
  client: any;
  buyOrderCollection: any;
  storecode: string;
  walletAddress: string;
}) {
  const normalizedStorecode = String(storecode || "").trim();
  const normalizedWalletAddress = normalizeWalletAddress(walletAddress);

  if (!normalizedStorecode || !normalizedWalletAddress) {
    return null;
  }

  const walletAddressRegex = new RegExp(
    `^${escapeRegExp(normalizedWalletAddress)}$`,
    "i",
  );

  const [latestOrder, totalPaymentConfirmed] = await Promise.all([
    buyOrderCollection.findOne(
      {
        storecode: normalizedStorecode,
        walletAddress: walletAddressRegex,
        status: { $in: [...USER_BUYORDER_SYNC_STATUSES] },
      },
      {
        sort: { createdAt: -1 },
        projection: {
          status: 1,
          createdAt: 1,
          acceptedAt: 1,
          paymentRequestedAt: 1,
          paymentConfirmedAt: 1,
          cancelledAt: 1,
        },
      },
    ),
    buyOrderCollection.aggregate([
      {
        $match: {
          storecode: normalizedStorecode,
          walletAddress: walletAddressRegex,
          status: "paymentConfirmed",
        },
      },
      {
        $group: {
          _id: null,
          totalPaymentConfirmedCount: { $sum: 1 },
          totalKrwAmount: { $sum: "$krwAmount" },
          totalUsdtAmount: { $sum: "$usdtAmount" },
        },
      },
    ]).toArray(),
  ]);

  const totals = totalPaymentConfirmed[0] || null;
  const nextBuyOrderStatus = latestOrder?.status
    ? String(latestOrder.status)
    : (totals ? "paymentConfirmed" : "");

  const userCollection = client.db(dbName).collection("users");
  const result = await userCollection.updateMany(
    {
      storecode: normalizedStorecode,
      walletAddress: walletAddressRegex,
    },
    {
      $set: {
        buyOrderStatus: nextBuyOrderStatus,
        totalPaymentConfirmedCount: totals?.totalPaymentConfirmedCount || 0,
        totalPaymentConfirmedKrwAmount: totals?.totalKrwAmount || 0,
        totalPaymentConfirmedUsdtAmount: totals?.totalUsdtAmount || 0,
      },
    },
  );

  return {
    buyOrderStatus: nextBuyOrderStatus,
    totalPaymentConfirmedCount: totals?.totalPaymentConfirmedCount || 0,
    totalPaymentConfirmedKrwAmount: totals?.totalKrwAmount || 0,
    totalPaymentConfirmedUsdtAmount: totals?.totalUsdtAmount || 0,
    matchedCount: result.matchedCount || 0,
    modifiedCount: result.modifiedCount || 0,
  };
}

async function fetchBuyOrderRealtimeSnapshot(
  collection: any,
  query: Record<string, any>,
): Promise<any | null> {
  return collection.findOne(query, { projection: BUYORDER_REALTIME_PROJECTION });
}

async function emitBuyOrderStatusRealtimeEvent({
  source,
  statusFrom,
  statusTo,
  order,
  reason,
  idempotencyParts,
}: {
  source: string;
  statusFrom: string | null;
  statusTo: string;
  order: any | null;
  reason?: string | null;
  idempotencyParts?: Array<string | null | undefined>;
}) {
  if (!order || !statusTo) {
    return;
  }

  const orderId = order?._id ? String(order._id) : "";
  const tradeId = String(order?.tradeId || "");
  const storeCode = String(order?.storecode || order?.store?.storecode || "");
  const baseKeySource = [
    source,
    orderId,
    tradeId,
    statusFrom || "",
    statusTo,
    ...(idempotencyParts || []),
  ]
    .map((value) => String(value || "").trim())
    .join("|");

  const idempotencyKey = `buyorder:${createHash("sha256").update(baseKeySource).digest("hex")}`;
  const eventId = `buyorder-status-${createHash("sha256")
    .update(`${idempotencyKey}|${statusTo}`)
    .digest("hex")}`;

  const event: BuyOrderStatusRealtimeEvent = {
    eventId,
    idempotencyKey,
    source,
    orderId: orderId || null,
    tradeId: tradeId || null,
    statusFrom: statusFrom || null,
    statusTo,
    store: {
      code: storeCode || null,
      logo: order?.store?.storeLogo || null,
      name: order?.store?.storeName || null,
    },
    amountKrw: toSafeNumber(order?.krwAmount),
    amountUsdt: toSafeNumber(order?.usdtAmount),
    buyerName: getBuyOrderBuyerName(order),
    buyerWalletAddress: getBuyOrderBuyerWalletAddress(order),
    buyerAccountNumber: getBuyOrderBuyerAccountNumber(order),
    transactionHash: toNormalizedHash(
      statusTo === "paymentSettled"
        ? order?.settlement?.txid || order?.transactionHash
        : order?.transactionHash,
    ),
    escrowTransactionHash: toNormalizedHash(order?.escrowTransactionHash),
    queueId: order?.queueId != null ? String(order.queueId).trim() || null : null,
    minedAt: order?.minedAt ? String(order.minedAt) : null,
    reason: reason || order?.cancelTradeReason || null,
    publishedAt: new Date().toISOString(),
  };

  const shouldSyncThirdwebBuyerWebhookWatchlist =
    THIRDWEB_BUYORDER_WEBHOOK_SYNC_TRIGGER_STATUSES.has(statusTo);

  try {
    const saved = await saveBuyOrderStatusRealtimeEvent({
      eventId: event.eventId,
      idempotencyKey: event.idempotencyKey,
      payload: event,
    });

    if (!saved.isDuplicate) {
      await publishBuyOrderStatusEvent(saved.event);
    }
  } catch (error) {
    console.error("Failed to publish buyorder status realtime event:", error);
  }

  if (!shouldSyncThirdwebBuyerWebhookWatchlist) {
    if (event.transactionHash) {
      scheduleUsdtTransactionHashReceiptReconcile({
        transactionHash: event.transactionHash,
        orderId: event.orderId,
        tradeId: event.tradeId,
        queueId: event.queueId,
        store: event.store,
        relevantWalletAddresses: getBuyOrderScanRelevantWalletAddresses(order),
      });
    }
    return;
  }

  if (event.transactionHash) {
    scheduleUsdtTransactionHashReceiptReconcile({
      transactionHash: event.transactionHash,
      orderId: event.orderId,
      tradeId: event.tradeId,
      queueId: event.queueId,
      store: event.store,
      relevantWalletAddresses: getBuyOrderScanRelevantWalletAddresses(order),
    });
  }

  scheduleThirdwebBuyerWebhookSync();
}

// get usdtPrice by walletAddress
export async function getUsdtPrice(data: any) {

  if (!data.walletAddress) {
    return null;
  }

  const client = await clientPromise;
  const collection = client.db(dbName).collection('setup');

  const result = await collection.findOne<OrderProps>(
    { $and: [ { walletAddress: data.walletAddress }, { usdtPrice: { $exists: true } } ] }
  );

  ///console.log('getUsdtPrice result: ' + JSON.stringify(result));

  //{"_id":"66b9b4431645dcffd9fbe2c2","walletAddress":"0x68B4F181d97AF97d8b111Ad50A79AfeB33CF6be6","usdtPrice":"1404"}

  if (result) {
    return result;
  } else {
    return null;
  }

}






// updatePrice

export async function updatePrice(data: any) {
  
  ///console.log('updatePrice data: ' + JSON.stringify(data));

  if (!data.walletAddress || !data.price) {
    return null;
  }

  ///console.log('updatePrice data.price: ' + data.price);



  const client = await clientPromise;
  const collection = client.db(dbName).collection('setup');

  // update and return update, or if not exists, insert and return insert

  // check usdtPrice is field of setup collection
  // if exists, update, else insert

  try {

    const result = await collection.findOneAndUpdate(
      { walletAddress: data.walletAddress },
      { $set: { usdtPrice: data.price } },
      { upsert: true, returnDocument: 'after' }
    );

    if (result) {

      ///console.log('updatePrice result: ' + result);

      return result.value;
    } else {
      return null;
    }


  } catch (error) {

    // updatePrice error: MongoInvalidArgumentError: Update document requires atomic operators
    ///console.log('updatePrice error: ' + error);

    return null;
  }




}








export async function insertSellOrder(data: any) {

  //console.log('insertSellOrder data: ' + JSON.stringify(data));

  if (!data.walletAddress || !data.usdtAmount || !data.krwAmount || !data.rate) {
    return null;
  }



  const client = await clientPromise;



  // get user mobile number by wallet address

  const userCollection = client.db(dbName).collection('users');


  const user = await userCollection.findOne<OrderProps>(
    { walletAddress: data.walletAddress },
    { projection: { _id: 0, emailVerified: 0 } }
  );

  if (!user) {
    return null;
  }



  ////console.log('user: ' + user);

  const nickname = user.nickname;

  const mobile = user.mobile;

  const avatar = user.avatar;

  const seller = user.seller;



  const collection = client.db(dbName).collection('orders');

 
	  const result = await collection.insertOne(

	    {
      lang: data.lang,
      chain: data.chain,
      walletAddress: data.walletAddress,
      nickname: nickname,
      mobile: mobile,
      avatar: avatar,
      seller: seller,
      usdtAmount: data.usdtAmount,
      krwAmount: data.krwAmount,
      rate: data.rate,
      createdAt: new Date().toISOString(),
      status: 'ordered',
      privateSale: data.privateSale,
    }
  );


  if (result) {
    return {
      orderId: result.insertedId,
    };
  } else {
    return null;
  }
  

}


// getOrderById
/*
error=====>BSONError: input must be a 24 character hex string, 12 byte Uint8Array, or an integer
*/
export async function getOrderById(orderId: string): Promise<OrderProps | null> {

  //console.log('getOrderById orderId: ' + orderId);
  ///  orderId 67470264536de8c4c57ab7488


  const client = await clientPromise;
  const collection = client.db(dbName).collection('orders');

  
  // check orderId is valid ObjectId
  if (!ObjectId.isValid(orderId)) {
    console.log('getOrderById invalid orderId: ' + orderId);
    return null;
  }


  const result = await collection.findOne<OrderProps>(
    {
      _id: new ObjectId(orderId),
    }
  );


  if (result) {
    return result;
  } else {
    return null;
  }

}



// get count of open orders not expired 24 hours after created
export async function getOpenOrdersCount(): Promise<number> {

  const client = await clientPromise;
  const collection = client.db(dbName).collection('orders');

  const result = await collection.countDocuments(
    { status: 'ordered', createdAt: { $gt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() } }
  );

  return result;

}






// get sell orders order by createdAt desc
export async function getSellOrders(

  {

    limit,
    page,
    walletAddress,
    searchMyOrders,
  }: {

    limit: number;
    page: number;
    walletAddress: string;
    searchMyOrders: boolean;
  
  }

): Promise<ResultProps> {

  const client = await clientPromise;
  const collection = client.db(dbName).collection('orders');


  // status is not 'paymentConfirmed'

  // if searchMyOrders is true, get orders by wallet address is walletAddress
  // else get all orders except paymentConfirmed
  // sort status is accepted first, then createdAt desc

  if (searchMyOrders) {

    const results = await collection.find<OrderProps>(

      //{ walletAddress: walletAddress, status: { $ne: 'paymentConfirmed' } },
      { walletAddress: walletAddress },
      
      //{ projection: { _id: 0, emailVerified: 0 } }

    )

    .sort({ createdAt: -1 })
    .limit(limit).skip((page - 1) * limit).toArray();



    return {
      totalCount: results.length,
      orders: results,
    };

  } else {

    const results = await collection.find<OrderProps>(
      {
        //status: 'ordered',
  
        status: { $ne: 'paymentConfirmed' },
  
        // exclude private sale
        //privateSale: { $ne: true },
      },
      
      //{ projection: { _id: 0, emailVerified: 0 } }
  
    ).sort({ createdAt: -1 }).limit(limit).skip((page - 1) * limit).toArray();
  
    return {
      totalCount: results.length,
      orders: results,
    };

  }


}



// get sell orders order by createdAt desc
export async function getAllSellOrders(

  {
    status,
    limit,
    page,
    walletAddress,
    searchMyOrders,
  }: {
    status: string;
    limit: number;
    page: number;
    walletAddress: string;
    searchMyOrders: boolean;
  
  }

): Promise<ResultProps> {

  const client = await clientPromise;
  const collection = client.db(dbName).collection('orders');


  // status is not 'paymentConfirmed'

  // if searchMyOrders is true, get orders by wallet address is walletAddress
  // else get all orders except paymentConfirmed
  // sort status is accepted first, then createdAt desc

  ///console.log('getAllSellOrders searchMyOrders: ' + searchMyOrders);

  if (searchMyOrders) {

    // if status is 'all', get all orders by wallet address
    // if status is not 'all', get orders by wallet address and status

    const results = await collection.find<OrderProps>(

      //{ walletAddress: walletAddress, status: status },

      {
        walletAddress: walletAddress,

        status: status === 'all' ? { $ne: 'nothing' } : status,

      },


    )
    .sort({ createdAt: -1 })
    .limit(limit).skip((page - 1) * limit).toArray();

    // get total count of orders
    const totalCount = await collection.countDocuments(
      { walletAddress: walletAddress,
        status: status === 'all' ? { $ne: 'nothing' } : status
      }
    );

    return {
      totalCount: totalCount,
      orders: results,
    };

  } else {

    const results = await collection.find<OrderProps>(
      
      //{ status: status, },

      {
        status: status === 'all' ? { $ne: 'nothing' } : status,
      },

    ).sort({ createdAt: -1 }).limit(limit).skip((page - 1) * limit).toArray();

    // get total count of orders
    const totalCount = await collection.countDocuments(
      { status: status }
    );
  
    return {
      totalCount: totalCount,
      orders: results,
    };

  }


}




export async function getOneSellOrder(

  {
    orderId,
  }: {
    orderId: string;  
  }

): Promise<ResultProps> {

  const client = await clientPromise;
  const collection = client.db(dbName).collection('orders');


  // status is not 'paymentConfirmed'

  // check orderId is valid ObjectId


  if (!ObjectId.isValid(orderId)) {
    return {
      totalCount: 0,
      orders: [],
    };
  }




  const results = await collection.find<OrderProps>(
    {

      _id: new ObjectId(orderId),

      //status: 'ordered',

      ///status: { $ne: 'paymentConfirmed' },

      // exclude private sale
      //privateSale: { $ne: true },
    },
    
    //{ projection: { _id: 0, emailVerified: 0 } }

  ).sort({ createdAt: -1 }).toArray();



  return {
    totalCount: results.length,
    orders: results,
  };

}



// deleete sell order by orderId
export async function deleteSellOrder(

  {
    orderId,
    walletAddress,
  }: {
    orderId: string;
    walletAddress: string;
  
  }


): Promise<boolean> {

  const client = await clientPromise;
  const collection = client.db(dbName).collection('orders');

  // check orderId is valid ObjectId
  if (!ObjectId.isValid(orderId)) {
    return false;
  }

  // check walletAddress is valid

  if (!walletAddress) {
    return false;
  }

  // status is 'ordered'
  const result = await collection.deleteOne(
    { _id: new ObjectId(orderId), walletAddress: walletAddress, status: 'ordered' }
  );



  if (result.deletedCount === 1) {
    return true;
  } else {
    return false;
  }


}





// cancel buy order by orderId from buyer
export async function cancelTradeByBuyer(

  {
    orderId,
    walletAddress,
    cancelTradeReason,
  }: {
    orderId: string;
    walletAddress: string;
    cancelTradeReason: string;
  
  }

) {

  console.log('cancelTradeByBuyer orderId: ' + orderId);

  const client = await clientPromise;
  const collection = client.db(dbName).collection('orders');

  // check orderId is valid ObjectId
  if (!ObjectId.isValid(orderId)) {

    console.log('cancelTradeByBuyer invalid orderId: ' + orderId);

    return false;
  }

  // check walletAddress is valid

  if (!walletAddress) {

    console.log('cancelTradeByBuyer invalid walletAddress: ' + walletAddress);
    return false;
  }

  // check status is 'accepted'

  // update status to 'cancelled'

  
  const result = await collection.updateOne(
    {
      _id: new ObjectId(orderId + ''),
      status: 'paymentRequested'
    },
    { $set: {
      status: 'cancelled',
      cancelTradeReason: cancelTradeReason,
      cancelledAt: new Date().toISOString(),
    } }
  );


  ///console.log('cancelTradeByBuyer result: ' + JSON.stringify(result));
  /*
  cancelTradeByBuyer result: {"acknowledged":true,"modifiedCount":0,"upsertedId":null,"upsertedCount":0,"matchedCount":0}
  */

  const updated = await collection.findOne<OrderProps>(
    { _id: new ObjectId(orderId) }
  );

  if (result) {
    return {
      updated,
    }
  } else {
    return null;
  }


}




// cancelTradeByAdmin
// update order status to cancelled
// where status is 'accepted'
// and acceptedAt is more than 1 hour ago

export async function cancelTradeByAdmin() {

  const client = await clientPromise;
  const collection = client.db(dbName).collection('orders');

  // status is 'accepted'
  // acceptedAt is more than 1 hour ago

  const result = await collection.updateMany(
    { status: 'accepted', acceptedAt: { $lt: new Date(Date.now() - 60 * 60 * 1000).toISOString() } },
    { $set: {
      status: 'cancelled',
      cancelledAt: new Date().toISOString(),
      canceller: 'admin',
    } }
  );

  return result;

}







// get sell orders order by createdAt desc
export async function getSellOrdersForBuyer(

  {
    limit,
    page,
    walletAddress,
    searchMyOrders,
  }: {

    limit: number;
    page: number;
    walletAddress: string;
    searchMyOrders: boolean;
  }

): Promise<ResultProps> {

  const client = await clientPromise;
  const collection = client.db(dbName).collection('orders');


  // status is not 'paymentConfirmed'



  // if searchMyOrders is true, get orders by buyer wallet address is walletAddress
  // else get all orders except paymentConfirmed

  if (searchMyOrders) {

    const results = await collection.find<OrderProps>(
      {
        'buyer.walletAddress': walletAddress,
        status: { $ne: 'paymentConfirmed' },
      },
      
      //{ projection: { _id: 0, emailVerified: 0 } }

    ).sort({ createdAt: -1 }).limit(limit).skip((page - 1) * limit).toArray();

    return {
      totalCount: results.length,
      orders: results,
    };

  } else {

    const results = await collection.find<OrderProps>(
      {
        //status: 'ordered',
  
        status: { $ne: 'paymentConfirmed' },
  
        // exclude private sale
        privateSale: { $ne: true },
      },
      
      //{ projection: { _id: 0, emailVerified: 0 } }
  
    ).sort({ createdAt: -1 }).limit(limit).skip((page - 1) * limit).toArray();
  
    return {
      totalCount: results.length,
      orders: results,
    };

  }


}





// get sell orders by wallet address order by createdAt desc
export async function getSellOrdersByWalletAddress(

  {
    walletAddress,
    limit,
    page,
  }: {
    walletAddress: string;
    limit: number;
    page: number;
  
  }

): Promise<ResultProps> {

  const client = await clientPromise;
  const collection = client.db(dbName).collection('orders');


  const results = await collection.find<OrderProps>(
    { walletAddress: walletAddress },
  ).sort({ createdAt: -1 }).limit(limit).skip((page - 1) * limit).toArray();

  return {
    totalCount: results.length,
    orders: results,
  };

}



// accept sell order
// update order status to accepted

export async function acceptSellOrder(data: any) {
  
  ///console.log('acceptSellOrder data: ' + JSON.stringify(data));




  if (!data.orderId || !data.buyerWalletAddress ) {
    return null;
  }

  const buyerMemo = data.buyerMemo || '';


  const depositName = data.depositName || '';

  const depositBankName = data.depositBankName || '';




  const client = await clientPromise;
  const collection = client.db(dbName).collection('orders');

  // random number for tradeId
  // 100000 ~ 999999 string

  const tradeId = Math.floor(Math.random() * 900000) + 100000 + '';



  /*
    const result = await collection.findOne<OrderProps>(
    { _id: new ObjectId(orderId) }
  );
  */


  ///console.log('acceptSellOrder data.orderId: ' + data.orderId);

 
  // *********************************************
  // update status to accepted if status is ordered

  // if status is not ordered, return null
  // check condition and update status to accepted
  // *********************************************

  const result = await collection.findOneAndUpdate(
    
    { _id: new ObjectId(data.orderId + ''), status: 'ordered' },

    { $set: {
      status: 'accepted',
      acceptedAt: new Date().toISOString(),
      tradeId: tradeId,
      buyer: {
        walletAddress: data.buyerWalletAddress,
        nickname: data.buyerNickname,
        avatar: data.buyerAvatar,
        mobile: data.buyerMobile,
        memo: buyerMemo,
        depositName: depositName,
        depositBankName: depositBankName,
      },
    } }
  );









  /*
  const result = await collection.updateOne(
    
    //{ _id: new ObjectId(data.orderId) },

    { _id: new ObjectId( data.orderId + '' ) },




    { $set: {
      status: 'accepted',
      acceptedAt: new Date().toISOString(),


      tradeId: tradeId,

      buyer: {
        walletAddress: data.buyerWalletAddress,
        nickname: data.buyerNickname,
        avatar: data.buyerAvatar,
        mobile: data.buyerMobile,

      },
    } }
  );
  */


  ////console.log('acceptSellOrder result: ' + result);




  if (result) {

    const updated = await collection.findOne<OrderProps>(
      { _id: new ObjectId(data.orderId + '') }
    );

    ///console.log('acceptSellOrder updated: ' + JSON.stringify(updated));



    return updated;

  } else {
    return null;
  }
  
}






export async function requestPayment(data: any) {
  
  ///console.log('acceptSellOrder data: ' + JSON.stringify(data));

  if (!data.orderId) {
    return null;
  }

  if (!data.transactionHash) {
    return null;
  }


  const client = await clientPromise;
  const collection = client.db(dbName).collection('orders');


  const result = await collection.updateOne(
    
    { _id: new ObjectId(data.orderId + '') },


    { $set: {
      status: 'paymentRequested',
      escrowTransactionHash: data.transactionHash,
      paymentRequestedAt: new Date().toISOString(),
    } }
  );

  if (result) {
    const updated = await collection.findOne<OrderProps>(
      { _id: new ObjectId(data.orderId + '') }
    );

    return updated;
  } else {
    return null;
  }
  
}





export async function confirmPayment(data: any) {
  
  if (!data.orderId) {
    return null;
  }

  if (!data.transactionHash) {
    return null;
  }

  const paymentAmount = data.paymentAmount || 0;



  ///console.log('confirmPayment orderId: ' + data.orderId);
  


  const client = await clientPromise;
  const collection = client.db(dbName).collection('orders');


  const result = await collection.updateOne(
    
    { _id: new ObjectId(data.orderId+'') },


    { $set: {
      status: 'paymentConfirmed',
      paymentAmount: paymentAmount,
      queueId: data.queueId,
      transactionHash: data.transactionHash,
      paymentConfirmedAt: new Date().toISOString(),
    } }
  );

  if (result) {






    // update store collection
    // get count of paymentConfirmed orders by storecode
    // get sum of krwAmount and usdtAmount by storecode

    // get storecode from order
    const order = await collection.findOne<OrderProps>(
      { _id: new ObjectId(data.orderId+'') },
      { projection: {
        storecode: 1,
        agentcode: 1,
      } }
    );


    if (order) {
      const storecode = order.storecode;

      console.log('confirmPayment storecode: ' + storecode);

      const totalPaymentConfirmedCount = await collection.countDocuments(
        { storecode: storecode, status: 'paymentConfirmed' }
      );

      console.log('confirmPayment totalPaymentConfirmedCount: ' + totalPaymentConfirmedCount);


      const totalKrwAmount = await collection.aggregate([
        { $match: { storecode: storecode, status: 'paymentConfirmed' } },
        { $group: { _id: null, totalKrwAmount: { $sum: '$krwAmount' } } }
      ]).toArray();

      console.log('confirmPayment totalKrwAmount: ' + totalKrwAmount[0]?.totalKrwAmount || 0);


      const totalUsdtAmount = await collection.aggregate([
        { $match: { storecode: storecode, status: 'paymentConfirmed' } },
        { $group: { _id: null, totalUsdtAmount: { $sum: '$usdtAmount' } } }
      ]).toArray();

      console.log('confirmPayment totalUsdtAmount: ' + totalUsdtAmount[0]?.totalUsdtAmount || 0);



      // update store collection
      const storeCollection = client.db(dbName).collection('stores');
      const store = await storeCollection.updateOne(
        { storecode: storecode },
        { $set: {
            totalPaymentConfirmedCount: totalPaymentConfirmedCount,
            totalKrwAmount: totalKrwAmount[0]?.totalKrwAmount || 0,
            totalUsdtAmount: totalUsdtAmount[0]?.totalUsdtAmount || 0,
        } }
      );






    // update agnet collection
      const agentcode = order?.agentcode || '';


      // get totalPaymentConfirmedCount and totalKrwAmount and totalUsdtAmount by agentcode
      if (!agentcode) {
        console.log('confirmPayment agentcode is null');
        return null;
      }

      const totalPaymentConfirmedCountByAgent = await collection.countDocuments(
        { agentcode: agentcode, status: 'paymentConfirmed' }
      );

      console.log('confirmPayment totalPaymentConfirmedCountByAgent: ' + totalPaymentConfirmedCountByAgent);
      const totalKrwAmountByAgent = await collection.aggregate([
        { $match: { agentcode: agentcode, status: 'paymentConfirmed' } },
        { $group: { _id: null, totalKrwAmount: { $sum: '$krwAmount' } } }
      ]).toArray();
      console.log('confirmPayment totalKrwAmountByAgent: ' + totalKrwAmountByAgent[0]?.totalKrwAmount || 0);

      const totalUsdtAmountByAgent = await collection.aggregate([
        { $match: { agentcode: agentcode, status: 'paymentConfirmed' } },
        { $group: { _id: null, totalUsdtAmount: { $sum: '$usdtAmount' } } }
      ]).toArray();
      console.log('confirmPayment totalUsdtAmountByAgent: ' + totalUsdtAmountByAgent[0]?.totalUsdtAmount || 0);


      // update agent collection
      const agentCollection = client.db(dbName).collection('agents');
      const agent = await agentCollection.updateOne(
        { agentcode: agentcode },
        { $set: {
          totalPaymentConfirmedCount: totalPaymentConfirmedCountByAgent,
          totalKrwAmount: totalKrwAmountByAgent[0]?.totalKrwAmount || 0,
          totalUsdtAmount: totalUsdtAmountByAgent[0]?.totalUsdtAmount || 0,
        } }
      );









    }





   





    const updated = await collection.findOne<OrderProps>(
      { _id: new ObjectId(data.orderId+'') }
    );

    return updated;
  } else {
    return null;
  }
  
}





// get sell orders by wallet address order by createdAt desc
export async function getTradesByWalletAddress(

  {
    walletAddress,
    limit,
    page,
  }: {
    walletAddress: string;
    limit: number;
    page: number;
  
  }

): Promise<ResultProps> {



  const client = await clientPromise;
  const collection = client.db(dbName).collection('orders');


  // get orders by buyer.walletAddress = walletAddress 
  // tradeId is not null

  const results = await collection.find<OrderProps>(

    { 'buyer.walletAddress': walletAddress, tradeId: { $ne: null } },

  ).sort({ acceptedAt: -1 }).limit(limit).skip((page - 1) * limit).toArray();



  //console.log('getTradesByWalletAddress results: ' + JSON.stringify(results)); 



  return {
    totalCount: results.length,
    orders: results,
  };

}




// get sell orders by wallet address order by createdAt desc
export async function getTradesByWalletAddressProcessing(

  {
    walletAddress,
    limit,
    page,
  }: {
    walletAddress: string;
    limit: number;
    page: number;
  
  }

): Promise<ResultProps> {



  const client = await clientPromise;
  const collection = client.db(dbName).collection('orders');


  // get orders by buyer.walletAddress = walletAddress 
  // tradeId is not null
  // status is not 'paymentConfirmed'

  const results = await collection.find<OrderProps>(

    {
      'buyer.walletAddress': walletAddress,
      tradeId: { $ne: null },
      status: { $ne: 'paymentConfirmed' },
    },

  ).sort({ createdAt: -1 }).limit(limit).skip((page - 1) * limit).toArray();


  return {
    totalCount: results.length,
    orders: results,
  };

}






// get sell trades by wallet address order by createdAt desc
export async function getSellTradesByWalletAddress(

  {
    walletAddress,
    limit,
    page,
  }: {
    walletAddress: string;
    limit: number;
    page: number;
  
  }

): Promise<ResultProps> {



  const client = await clientPromise;
  const collection = client.db(dbName).collection('orders');


  // get orders by buyer.walletAddress = walletAddress 
  // tradeId is not null

  const results = await collection.find<OrderProps>(

    { 'walletAddress': walletAddress, tradeId: { $ne: null } },

  ).sort({ createdAt: -1 }).limit(limit).skip((page - 1) * limit).toArray();


  return {
    totalCount: results.length,
    orders: results,
  };

}




// get sell trades by wallet address order by createdAt desc
// status is not 'paymentConfirmed'
export async function getSellTradesByWalletAddressProcessing(

  {
    walletAddress,
    limit,
    page,
  }: {
    walletAddress: string;
    limit: number;
    page: number;
  
  }

): Promise<ResultProps> {



  const client = await clientPromise;
  const collection = client.db(dbName).collection('orders');


  // get orders by buyer.walletAddress = walletAddress 
  // tradeId is not null

  const results = await collection.find<OrderProps>(

    {
      'walletAddress': walletAddress,
      tradeId: { $ne: null },
      status: { $ne: 'paymentConfirmed' },
    },

  ).sort({ createdAt: -1 }).limit(limit).skip((page - 1) * limit).toArray();


  return {
    totalCount: results.length,
    orders: results,
  };

}



// get paymentRequested trades by wallet address
// and sum of usdtAmount
export async function getPaymentRequestedUsdtAmountByWalletAddress(

  {
    walletAddress,
  }: {
    walletAddress: string;
  
  }

): Promise<any> {

  const client = await clientPromise;
  const collection = client.db(dbName).collection('orders');

  const results = await collection.aggregate([
    {
      $match: {
        'walletAddress': walletAddress,
        status: 'paymentRequested',
      }
    },
    {
      $group: {
        _id: null,
        totalUsdtAmount: { $sum: '$usdtAmount' },
      }
    }
  ]).toArray();

  if (results.length > 0) {
    return results[0];
  } else {
    return null;
  }


}








export async function updateOne(data: any) {
  const client = await clientPromise;
  const collection = client.db(dbName).collection('users');


  // update and return updated user

  if (!data.walletAddress || !data.nickname) {
    return null;
  }


  const result = await collection.updateOne(
    { walletAddress: data.walletAddress },
    { $set: { nickname: data.nickname } }
  );

  if (result) {
    const updated = await collection.findOne<OrderProps>(
      { walletAddress: data.walletAddress },
      { projection: { _id: 0, emailVerified: 0 } }
    );

    return updated;
  }


}





export async function sellOrderRollbackPayment(data: any) {
  

  if (!data.orderId) {
    return null;
  }

  if (!data.transactionHash) {
    return null;
  }

  const paymentAmount = data.paymentAmount || 0;


  const client = await clientPromise;
  const collection = client.db(dbName).collection('orders');


  const result = await collection.updateOne(
    
    { _id: new ObjectId(data.orderId+'') },


    { $set: {
      status: 'cancelled',
      paymentAmount: paymentAmount,
      queueId: data.queueId,
      transactionHash: data.transactionHash,
      cancelledAt: new Date().toISOString(),
      rollbackAmount: paymentAmount,
    } }
  );

  if (result) {
    const updated = await collection.findOne<OrderProps>(
      { _id: new ObjectId(data.orderId+'') }
    );

    return updated;
  } else {
    return null;
  }
  
}










// "ordered" : "주문완료"

export async function insertBuyOrder(data: any) {


  if (!data.storecode || !data.walletAddress || !data.usdtAmount || !data.krwAmount || !data.rate) {
    
    console.log('insertBuyOrder data is null: ' + JSON.stringify(data));
    
    return null;
  }


  const nickname = data.nickname || '';
  const requestedMobile =
    typeof data.mobile === 'string'
      ? data.mobile.trim()
      : '';


  const client = await clientPromise;


  const storeCollection = client.db(dbName).collection('stores');
  const store = await storeCollection.findOne<any>(
    { storecode: data.storecode },
    { projection:
      { _id: 1,
        agentcode: 1,
        storecode: 1,
        storeName: 1,
        storeType: 1,
        storeUrl: 1,
        storeDescription: 1,
        storeLogo: 1,
        totalBuyerCount: 1,
        sellerWalletAddress: 1,
        adminWalletAddress: 1,
        settlementWalletAddress: 1,
        settlementFeeWalletAddress: 1,
        settlementFeePercent: 1,
        
        bankInfo: 1,
        bankInfoAAA: 1,
        bankInfoBBB: 1,
        bankInfoCCC: 1,
        bankInfoDDD: 1,
        bankInfoEEE: 1,

        agentFeePercent: 1,

        totalSettlementAmount: 1,
        totalUsdtAmountClearance: 1,
      }
    }
  );

  if (!store) {

    console.log('insertBuyOrder storecode is not valid: ' + data.storecode);
    return null;
  }


  const userCollection = client.db(dbName).collection('users');



  
  let user = await userCollection.findOne<OrderProps>(
    {
      storecode: data.storecode,
      walletAddress: data.walletAddress
    },
  );

  if (!user) {
    console.log('insertBuyOrder user is null: ' + JSON.stringify(user));
    // inser user if not exists
    await userCollection.insertOne({
      chain: data.chain,

      storecode: data.storecode,
      walletAddress: data.walletAddress,
      nickname: nickname,
      mobile: requestedMobile,
      buyOrderStatus: 'ordered',
      latestBuyOrder: {
        storecode: data.storecode,
        storeName: store.storeName,
        storeLogo: store.storeLogo,
        usdtAmount: data.usdtAmount,
        krwAmount: data.krwAmount,
        rate: data.rate,
        createdAt: new Date().toISOString(),
      }
    });

    // re-fetch user
    const newUser = await userCollection.findOne<OrderProps>(
      {
        storecode: data.storecode,
        walletAddress: data.walletAddress
      },
    );
    if (!newUser) {
      console.log('insertBuyOrder newUser is null: ' + JSON.stringify(newUser));
      return null;
    }


    user = newUser;
  }


  // get agent by storecode

  const agentcode = store.agentcode || '';


  if (!agentcode) {
    console.log('insertBuyOrder agentcode is null: ' + agentcode);
    return null;
  }


  const agentCollection = client.db(dbName).collection('agents');
  const agent = await agentCollection.findOne<any>(
    { agentcode: agentcode },
  );

  if (!agent) {
    console.log('insertBuyOrder agent is null: ' + JSON.stringify(agent));
    return null;
  }



  const mobile = requestedMobile || user?.mobile || '';

  const avatar = user?.avatar;

  const userType = user?.userType || '';

  
  //const seller = user.seller;



  //const tradeId = Math.floor(Math.random() * 900000000) + 100000000 + '';
  // more long number for tradeId
  const tradeId = Math.floor(Math.random() * 9000000000) + 1000000000 + ''; 


  ///console.log('insertBuyOrder tradeId: ' + tradeId);



  const collection = client.db(dbName).collection('buyorders');

  const result = await collection.insertOne(

    {
      chain: data.chain,
      lang: data.lang,


      agentcode: agentcode,
      agent: agent,
      storecode: data.storecode,
      store: store,

      walletAddress: data.walletAddress,
      nickname: nickname,
      mobile: mobile,
      avatar: avatar,
      userType: userType,
      
      userStats: {
        totalPaymentConfirmedCount: user.totalPaymentConfirmedCount || 0,
        totalPaymentConfirmedKrwAmount: user.totalPaymentConfirmedKrwAmount || 0,
        totalPaymentConfirmedUsdtAmount: user.totalPaymentConfirmedUsdtAmount || 0,
      },
      
      //seller: seller,

      usdtAmount: data.usdtAmount,
      krwAmount: data.krwAmount,
      rate: data.rate,
      createdAt: new Date().toISOString(),
      status: 'ordered',
      privateSale: data.privateSale,
      
      buyer: data.buyer,

      paymentMethod: data.paymentMethod || 'bank', // default to bank if not provided

      tradeId: tradeId,

      escrowWallet: data.escrowWallet || '', // optional, can be empty

      audioOn: true, // default true

      returnUrl: data.returnUrl || '', // optional, can be empty
      orderNumber: data.orderNumber || '', // optional, can be empty
      createdByApi: data.createdByApi || null,
      createdByRequest: data.createdByRequest || null,
    }
  );

  
  
  ///console.log('insertBuyOrder result: ' + JSON.stringify(result));


  if (result) {


    // update user collection buyOrderStatus to "ordered"

    await userCollection.updateOne(
      {
        walletAddress: data.walletAddress,
        storecode: data.storecode,
      },
      { $set: {
        buyOrderStatus: 'ordered',
        latestBuyOrder: {
          _id: result.insertedId,
          tradeId: tradeId,
          storecode: data.storecode,
          storeName: store.storeName,
          storeLogo: store.storeLogo,
          usdtAmount: data.usdtAmount,
          krwAmount: data.krwAmount,
          rate: data.rate,
          createdAt: new Date().toISOString(),
        }
      } }
    );

    const createdOrder = await fetchBuyOrderRealtimeSnapshot(
      collection,
      { _id: result.insertedId },
    );

    await emitBuyOrderStatusRealtimeEvent({
      source: "order.insertBuyOrder",
      statusFrom: null,
      statusTo: "ordered",
      order: createdOrder,
      idempotencyParts: [String(result.insertedId), tradeId],
    });


    /*
    const updated = await collection.findOne<OrderProps>(
      { _id: result.insertedId },
    );
    */

    return {

      _id: result.insertedId,
      tradeId: tradeId,

      walletAddress: data.walletAddress,
      escrowWalletAddress: data.escrowWallet?.address || '', // optional, can be empty

      
    };


    
  } else {
    return null;
  }
  

}









export async function insertBuyOrderForClearance(data: any) {


  if (!data.storecode
    || !data.walletAddress
    
    //|| !data.sellerBankInfo

    || !data.usdtAmount
    || !data.krwAmount
    || !data.rate
  ) {
    
    console.log('insertBuyOrderForClearance data is null: ' + JSON.stringify(data));
    
    return null;
  }


  const nickname = data.nickname || '';


  const client = await clientPromise;


  const storeCollection = client.db(dbName).collection('stores');
  const store = await storeCollection.findOne<any>(
    { storecode: data.storecode },
    { projection:
      { _id: 1,
        agentcode: 1,
        storecode: 1,
        storeName: 1,
        storeType: 1,
        storeUrl: 1,
        storeDescription: 1,
        storeLogo: 1,
        totalBuyerCount: 1,
        sellerWalletAddress: 1,
        privateSaleWalletAddress: 1,
        privateSellerWalletAddress: 1,
        adminWalletAddress: 1,
        settlementWalletAddress: 1,
        settlementFeeWalletAddress: 1,
        settlementFeePercent: 1,
        bankInfo: 1,
        bankInfoAAA: 1,
        bankInfoBBB: 1,
        bankInfoCCC: 1,
        bankInfoDDD: 1,
        bankInfoEEE: 1,
        withdrawalBankInfo: 1,
        withdrawalBankInfoAAA: 1,
        withdrawalBankInfoBBB: 1,
        withdrawalBankInfoCCC: 1,
        agentFeePercent: 1,

        totalSettlementAmount: 1,
        totalUsdtAmountClearance: 1,
      }
    }
  );

  if (!store) {

    console.log('insertBuyOrderForClearance storecode is not valid: ' + data.storecode);
    return null;
  }

  const normalizedRequesterWalletAddress = normalizeWalletAddress(data.walletAddress);
  if (!normalizedRequesterWalletAddress) {
    console.log('insertBuyOrderForClearance walletAddress is not valid: ' + data.walletAddress);
    return null;
  }

  if (!isConfiguredClearanceRequesterWallet(store, normalizedRequesterWalletAddress)) {
    console.log('insertBuyOrderForClearance walletAddress is not allowed for store: ' + normalizedRequesterWalletAddress);
    return null;
  }

  const sellerBankInfo = resolveConfiguredClearanceSellerBankInfo(store, data.sellerBankInfo);
  if (!sellerBankInfo) {
    console.log('insertBuyOrderForClearance sellerBankInfo is null');
    return null;
  }

  const buyer = resolveConfiguredClearanceBuyer(store, data.buyer);
  if (!buyer) {
    console.log('insertBuyOrderForClearance buyer bankInfo is null');
    return null;
  }

  // check clearance user exists
  // clearance user's storecode is 'admin'
  const clearanceStorecode = 'admin';

  const userCollection = client.db(dbName).collection('users');


  const walletAddressRaw = String(normalizedRequesterWalletAddress || '').trim();
  const escapedWalletAddress = walletAddressRaw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const walletAddressRegex = new RegExp(`^${escapedWalletAddress}$`, 'i');

  const user = await userCollection.findOne<OrderProps>(
    {
      storecode: clearanceStorecode,
      walletAddress: walletAddressRegex
    },
  );

  if (!user) {
    console.log('insertBuyOrderForClearance user is null: ' + JSON.stringify(user));
    return null;
  }


  // get agent by storecode

  const agentcode = store.agentcode || '';


  if (!agentcode) {
    console.log('insertBuyOrderForClearance agentcode is null: ' + agentcode);
    return null;
  }


  const agentCollection = client.db(dbName).collection('agents');
  const agent = await agentCollection.findOne<any>(
    { agentcode: agentcode },
  );

  if (!agent) {
    console.log('insertBuyOrderForClearance agent is null: ' + JSON.stringify(agent));
    return null;
  }



  const mobile = user?.mobile;

  const avatar = user?.avatar;

  
  //const seller = user.seller;



  const tradeId = Math.floor(Math.random() * 900000000) + 100000000 + '';

  ///console.log('insertBuyOrder tradeId: ' + tradeId);



  const collection = client.db(dbName).collection('buyorders');

  /*
  const result = await collection.insertOne(

    {
      chain: data.chain,
      lang: data.lang,

      agentcode: agentcode,
      agent: agent,
      storecode: data.storecode,
      store: store,
      walletAddress: data.walletAddress,
      nickname: nickname,
      mobile: mobile,
      avatar: avatar,
      
      //seller: seller,

      usdtAmount: data.usdtAmount,
      krwAmount: data.krwAmount,
      rate: data.rate,
      createdAt: new Date().toISOString(),
      status: 'ordered',
      privateSale: data.privateSale,
      
      buyer: data.buyer,

      tradeId: tradeId,

	      transactionHash: '0x',
	      queueId: null,
	    }
	  );
  */

  const sellerWalletAddress = getConfiguredClearanceSettlementWalletAddress(store);
  if (!sellerWalletAddress) {
    console.log('insertBuyOrderForClearance sellerWalletAddress is null');
    return null;
  }

  // get seller info from user collection by sellerWalletAddress
  const escapedSellerWalletAddress = sellerWalletAddress.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const sellerWalletAddressRegex = new RegExp(`^${escapedSellerWalletAddress}$`, 'i');
  const sellerUser = await userCollection.findOne<OrderProps>(
    {
      storecode: data.storecode,
      walletAddress: sellerWalletAddressRegex,
    },
  );
  const sellerNickname = sellerUser?.nickname || '';
  const sellerAvatar = sellerUser?.avatar || '';
  const sellerMobile = sellerUser?.mobile || '';
  const sellerSignerAddress = String(sellerUser?.signerAddress || '').trim();
  const sellerMemo = ""

  const sellerData: Record<string, any> = {
    walletAddress: sellerWalletAddress,

    nickname: sellerNickname,
    avatar: sellerAvatar,
    mobile: sellerMobile,

    memo: sellerMemo,
    bankInfo: sellerBankInfo,
  };

  if (sellerSignerAddress) {
    sellerData.signerAddress = sellerSignerAddress;
  }

  const createdAt = new Date().toISOString();
  const isWithdrawalWebhookGeneratedOrder = isWithdrawalWebhookGeneratedClearanceOrder({
    createdBy: data.createdBy,
    source: data.source,
    automationSource: data.automationSource,
    clearanceSource: data.clearanceSource,
  });
  const shouldStubWithdrawalWebhookTransfer =
    isWithdrawalWebhookGeneratedOrder
    && !toNormalizedHash(data.transactionHash)
    && !toNullableText(data.queueId);
  const transactionHash = shouldStubWithdrawalWebhookTransfer
    ? buildWithdrawalWebhookDummyTransactionHash({
        tradeId,
        storecode: data.storecode,
        walletAddress: normalizedRequesterWalletAddress,
        createdAt,
      })
    : toNormalizedHash(data.transactionHash) || "0x";
  const queueId = shouldStubWithdrawalWebhookTransfer
    ? null
    : toNullableText(data.queueId);

  const result = await collection.insertOne(

    {
      chain: data.chain,
      lang: data.lang,

      agentcode: agentcode,
      agent: agent,
      storecode: data.storecode,
      store: store,
      walletAddress: normalizedRequesterWalletAddress,
      nickname: nickname,
      mobile: mobile,
      avatar: avatar,
      
      //seller: seller,

      usdtAmount: data.usdtAmount,
      krwAmount: data.krwAmount,
      rate: data.rate,
      createdAt,
      
      status: 'paymentRequested',
      acceptedAt: createdAt,
      paymentRequestedAt: createdAt,

      privateSale: true,

      buyer: buyer,


      seller: sellerData,
      sellerMemo: sellerMemo,


      tradeId: tradeId,

      transactionHash,
      queueId,
      transactionHashDummy: shouldStubWithdrawalWebhookTransfer || undefined,
      transactionHashDummyReason: shouldStubWithdrawalWebhookTransfer
        ? WITHDRAWAL_WEBHOOK_CLEARANCE_DUMMY_TRANSFER_REASON
        : undefined,
      transactionHashDummyAt: shouldStubWithdrawalWebhookTransfer ? createdAt : undefined,
      createdBy: data.createdBy || null,
    }
  );


  
  
  ///console.log('insertBuyOrder result: ' + JSON.stringify(result));


  if (result) {


    // update user collection buyOrderStatus to "ordered"
    /*
    await userCollection.updateOne(
      {
        walletAddress: data.walletAddress,
        storecode: data.storecode,
      },
      { $set: { buyOrderStatus: 'ordered' } }
    );
    */
   // update user collection buyOrderStatus to "accepted"
    await userCollection.updateOne(
      {
        walletAddress: walletAddressRegex,
        storecode: clearanceStorecode,
      },
      { $set: { buyOrderStatus: 'paymentRequested' } }
    );



    const updated = await collection.findOne<OrderProps>(
      { _id: result.insertedId }
    );

    await emitBuyOrderStatusRealtimeEvent({
      source: "order.insertBuyOrderForClearance",
      statusFrom: null,
      statusTo: "paymentRequested",
      order: updated,
      idempotencyParts: [String(result.insertedId), tradeId],
    });

    ///console.log('insertBuyOrderForClearance updated: ' + JSON.stringify(updated));



    return {

      _id: result.insertedId,

      walletAddress: normalizedRequesterWalletAddress,
      tradeId: tradeId,
      
    };


    
  } else {
    return null;
  }
  

}

















export async function insertBuyOrderForUser(data: any) {


  if (!data.storecode || !data.walletAddress || !data.usdtAmount || !data.krwAmount || !data.rate) {
    
    console.log('insertBuyOrderForUser data is null: ' + JSON.stringify(data));

    /*
    {
    "walletAddress":"0x1eba71B17AA4beE24b54dC10cA32AAF0789b8D9A",
    "nickname":"",
    "usdtAmount":7.25,
    "krwAmount":10000,"rate":1400,
    "privateSale":true,
    "buyer":{"depositBankName":"","depositName":""}
    }
    */
    
    return null;
  }


  const nickname = data.nickname || '';


  const client = await clientPromise;


  const storeCollection = client.db(dbName).collection('stores');
  const store = await storeCollection.findOne<any>(
    { storecode: data.storecode },
    { projection:
      { _id: 1,
        agentcode: 1,
        storecode: 1,
        storeName: 1,
        storeType: 1,
        storeUrl: 1,
        storeDescription: 1,
        storeLogo: 1,
        totalBuyerCount: 1,
        sellerWalletAddress: 1,
        adminWalletAddress: 1,
        settlementWalletAddress: 1,
        settlementFeeWalletAddress: 1,
        settlementFeePercent: 1,
        bankInfo: 1,
        agentFeePercent: 1,

        totalSettlementAmount: 1,
        totalUsdtAmountClearance: 1,
      }
    }
  );

  if (!store) {

    console.log('insertBuyOrderForUser storecode is not valid: ' + data.storecode);
    return null;
  }



  // get agent by storecode

  const agentcode = store.agentcode || '';


  if (!agentcode) {
    console.log('insertBuyOrderForUser agentcode is null: ' + agentcode);
    return null;
  }


  const agentCollection = client.db(dbName).collection('agents');
  const agent = await agentCollection.findOne<any>(
    { agentcode: agentcode },
  );

  if (!agent) {
    console.log('insertBuyOrderForUser agent is null: ' + JSON.stringify(agent));
    return null;
  }



  const tradeId = Math.floor(Math.random() * 900000000) + 100000000 + '';

  ///console.log('insertBuyOrder tradeId: ' + tradeId);



  const collection = client.db(dbName).collection('buyorders');

  const mobile = '';
  const avatar = '';
 
  const result = await collection.insertOne(

    {
      lang: data.lang,
      agentcode: agentcode,
      agent: agent,
      storecode: data.storecode,
      store: store,
      walletAddress: data.walletAddress,
      nickname: nickname,
      mobile: mobile,
      avatar: avatar,
      
      //seller: seller,

      usdtAmount: data.usdtAmount,
      krwAmount: data.krwAmount,
      rate: data.rate,
      createdAt: new Date().toISOString(),
      
      //status: 'ordered',
      status: 'paymentRequested',
      paymentRequestedAt: new Date().toISOString(),

      privateSale: data.privateSale,
      
      buyer: data.buyer,

      seller: data.seller,

      tradeId: tradeId,
    }
  );

  
  
  ///console.log('insertBuyOrder result: ' + JSON.stringify(result));


  if (result) {

    const createdOrder = await fetchBuyOrderRealtimeSnapshot(
      collection,
      { _id: result.insertedId },
    );

    await emitBuyOrderStatusRealtimeEvent({
      source: "order.insertBuyOrderForUser",
      statusFrom: null,
      statusTo: "paymentRequested",
      order: createdOrder,
      idempotencyParts: [String(result.insertedId), tradeId],
    });


    return {

      _id: result.insertedId,

      walletAddress: data.walletAddress,
      
    };


    
  } else {
    return null;
  }
  

}










// get buy orders order by createdAt desc
export async function getBuyOrders(
  {
    limit,
    page,
    agentcode,
    storecode,
    walletAddress,
    searchMyOrders,
    searchOrderStatusCancelled,
    searchOrderStatusCompleted,

    searchStoreName,

    privateSale,

    searchTradeId,
    searchBuyer,
    searchDepositName,
    searchDepositNameMode = 'legacy',

    searchStoreBankAccountNumber,
    searchBuyerBankAccountNumber,
    searchDepositCompleted,

    fromDate,
    toDate,

    manualConfirmPayment,
    includeSummary = true,

    userType,

    collectionName = 'buyorders',
  }: {

    limit: number;
    page: number;
    agentcode: string;
    storecode: string;
    walletAddress: string;
    searchMyOrders: boolean;
    searchOrderStatusCancelled: boolean;
    searchOrderStatusCompleted: boolean;

    searchStoreName: string;

    privateSale: boolean;

    searchTradeId: string;
    searchBuyer: string;
    searchDepositName: string;
    searchDepositNameMode?: string;

    searchStoreBankAccountNumber: string;
    searchBuyerBankAccountNumber: string;
    searchDepositCompleted: boolean;

    fromDate: string;
    toDate: string;

    manualConfirmPayment: boolean;
    includeSummary?: boolean;

    userType: string; // 'all', '', 'AAA', 'BBB', 'CCC', 'DDD'

    collectionName?: string;
  }

): Promise<any> {


  //console.log('getBuyOrders fromDate: ' + fromDate);
  //console.log('getBuyOrders toDate: ' + toDate);


  //console.log('getBuyOrders agentcode: ==========>' + agentcode);

  /*
  getBuyOrders fromDate: 2025-04-04
  getBuyOrders toDate: 2025-05-30
  */

  


  //console.log('getBuyOrders limit: ' + limit);
  //console.log('getBuyOrders page: ' + page);


  // searchStoreBankAccountNumber
  //console.log('getBuyOrders searchStoreBankAccountNumber: ' + searchStoreBankAccountNumber);

  // searchDepositName
  // 일렉스파크
  //console.log('getBuyOrders searchDepositName: ' + searchDepositName);

  const depositNameFilter = buildBuyOrderDepositNameFilter({
    searchDepositName,
    searchDepositNameMode: normalizeBuyOrderDepositNameSearchMode(searchDepositNameMode),
  });
  const sellerBankAccountFilter = buildBuyOrderSellerBankAccountFilter({
    searchStoreBankAccountNumber,
  });


  const client = await clientPromise;
  const collection = client.db(dbName).collection(collectionName);
  void ensureBuyOrderReadIndexes(collection);
  const searchDepositCompletedQuery = searchDepositCompleted
    ? { 'buyer.depositCompleted': true }
    : {};
  const normalizedStorecode = String(storecode || "").trim();
  const storecodeQuery = normalizedStorecode
    ? { storecode: normalizedStorecode }
    : { storecode: { $ne: null } };


  // status is not 'paymentConfirmed'

  // if searchMyOrders is true, get orders by wallet address is walletAddress
  // else get all orders except paymentConfirmed
  // sort status is accepted first, then createdAt desc

  if (searchMyOrders) {

    const resultsPromise = collection.find<OrderProps>(

      //{ walletAddress: walletAddress, status: { $ne: 'paymentConfirmed' } },
      {
        ...(agentcode ? { agentcode: { $regex: String(agentcode), $options: 'i' } } : {}),


        ...storecodeQuery,
        walletAddress: walletAddress,
        
        status: (searchOrderStatusCancelled && searchOrderStatusCompleted ? { $in: ['cancelled', 'paymentConfirmed'] }
          : (searchOrderStatusCancelled ? 'cancelled'
          : (searchOrderStatusCompleted ? 'paymentConfirmed'
          : { $ne: 'nothing' }))),

        privateSale: privateSale || { $ne: true },
        ...(searchStoreName ? { "store.storeName": { $regex: String(searchStoreName), $options: 'i' } } : {}),
        ...(searchBuyer ? { nickname: { $regex: String(searchBuyer), $options: 'i' } } : {}),

        // if searchTradeId is provided, search by tradeId
        ...(searchTradeId ? { tradeId: { $regex: String(searchTradeId), $options: 'i' } } : {}),
        ...depositNameFilter,

        
        ///...(searchStoreBankAccountNumber ? { 'store.bankInfo.accountNumber': { $regex: String(searchStoreBankAccountNumber), $options: 'i' } } : {}),

        // seller?.bankInfo?.accountNumber
        ...sellerBankAccountFilter,

        ...(searchBuyerBankAccountNumber ? { 'buyer.bankInfo.accountNumber': { $regex: String(searchBuyerBankAccountNumber), $options: 'i' } } : {}),
        ...searchDepositCompletedQuery,
        
        // if manualConfirmPayment is true, autoConfirmPayment is not true
        ...(manualConfirmPayment ? { autoConfirmPayment: { $ne: true } } : {}),



        // filter by fromDate and toDate
        // fromDate format: YYYY-MM-DD
        // toDate format: YYYY-MM-DD
        //createdAt: {
        //  $gte: new Date(fromDate ? fromDate + 'T00:00:00Z' : '1970-01-01T00:00:00Z'),
        //  $lte: new Date(toDate ? toDate + 'T23:59:59Z' : new Date().toISOString()),
        //}

        
      },
      {
        maxTimeMS: BUYORDER_QUERY_MAX_TIME_MS,
      },
      
      //{ projection: { _id: 0, emailVerified: 0 } }

    )

    .sort({ createdAt: -1 })
    .limit(limit).skip((page - 1) * limit).toArray();

    if (!includeSummary) {
      const results = await resultsPromise;
      return {
        totalCount: 0,
        totalKrwAmount: 0,
        totalUsdtAmount: 0,
        totalTransferCount: 0,
        totalTransferAmount: 0,
        totalTransferAmountKRW: 0,
        totalSettlementCount: 0,
        totalSettlementAmount: 0,
        totalSettlementAmountKRW: 0,
        totalFeeAmount: 0,
        totalFeeAmountKRW: 0,
        totalAgentFeeAmount: 0,
        totalAgentFeeAmountKRW: 0,
        totalByUserType: [],
        totalBySellerBankAccountNumber: [],
        totalByBuyerBankAccountNumber: [],
        orders: results,
      };
    }

    const totalCountPromise = collection.countDocuments(
      {

        ...(agentcode ? { agentcode: { $regex: String(agentcode), $options: 'i' } } : {}),

        ...storecodeQuery,
        
        walletAddress: walletAddress,

        status: (searchOrderStatusCancelled && searchOrderStatusCompleted ? { $in: ['cancelled', 'paymentConfirmed'] }
          : (searchOrderStatusCancelled ? 'cancelled'
          : (searchOrderStatusCompleted ? 'paymentConfirmed'
          : { $ne: 'nothing' }))),

        privateSale: { $ne: true },

        ...(searchTradeId ? { tradeId: { $regex: String(searchTradeId), $options: 'i' } } : {}),

        ...(searchStoreName ? { "store.storeName": { $regex: String(searchStoreName), $options: 'i' } } : {}),

        ...(searchBuyer ? { nickname: { $regex: String(searchBuyer), $options: 'i' } } : {}),
        
        
        ...depositNameFilter,


        /////...(searchStoreBankAccountNumber ? { 'store.bankInfo.accountNumber': { $regex: String(searchStoreBankAccountNumber), $options: 'i' } } : {}),
        // seller?.bankInfo?.accountNumber
        ...sellerBankAccountFilter,

        ...(searchBuyerBankAccountNumber ? { 'buyer.bankInfo.accountNumber': { $regex: String(searchBuyerBankAccountNumber), $options: 'i' } } : {}),
        ...searchDepositCompletedQuery,

        // if manualConfirmPayment is true, autoConfirmPayment is not true
        ...(manualConfirmPayment ? { autoConfirmPayment: { $ne: true } } : {}),





        // filter by fromDate and toDate
        ///createdAt: {
        //  $gte: new Date(fromDate ? fromDate + 'T00:00:00Z' : '1970-01-01T00:00:00Z'),
        //  $lte: new Date(toDate ? toDate + 'T23:59:59Z' : new Date().toISOString()),
        //}

      },
      {
        maxTimeMS: BUYORDER_QUERY_MAX_TIME_MS,
      },
    );

    const [results, totalCount] = await Promise.all([
      resultsPromise,
      totalCountPromise,
    ]);


    return {
      totalCount: totalCount,
      orders: results,
    };

  } else {

    //const fromDateValue = fromDate ? fromDate + 'T00:00:00Z' : '1970-01-01T00:00:00Z';
    //const toDateValue = toDate ? toDate + 'T23:59:59Z' : new Date().toISOString();
    // korean timezone is UTC+9, so we need to convert to UTC time

    //const fromDateValue = fromDate ? fromDate + 'T00:00:00Z' : '1970-01-01T00:00:00Z';

    const fromDateValue = fromDate ? new Date(fromDate + 'T00:00:00+09:00').toISOString() : '1970-01-01T00:00:00Z';

    //const toDateValue = toDate ? toDate + 'T23:59:59Z' : new Date().toISOString();

    const toDateValue = toDate ? new Date(toDate + 'T23:59:59+09:00').toISOString() : new Date().toISOString();
    const clearanceStatusesForSummary = privateSale
      ? ['paymentConfirmed', 'paymentRequested']
      : ['paymentConfirmed'];
    const normalizedTransactionHashExpr = {
      $toLower: {
        $ifNull: ['$transactionHash', ''],
      },
    };
    const normalizedTransactionHashDummyReasonExpr = {
      $toLower: {
        $ifNull: [
          '$transactionHashDummyReason',
          {
            $ifNull: [
              '$createdBy.transactionHashDummyReason',
              { $ifNull: ['$clearanceSource.transactionHashDummyReason', ''] },
            ],
          },
        ],
      },
    };
    const hasRealTransferExpr = {
      $and: [
        { $ne: [normalizedTransactionHashExpr, ''] },
        { $ne: [normalizedTransactionHashExpr, '0x'] },
        { $ne: [{ $ifNull: ['$transactionHashDummy', false] }, true] },
        {
          $ne: [
            normalizedTransactionHashDummyReasonExpr,
            WITHDRAWAL_WEBHOOK_CLEARANCE_DUMMY_TRANSFER_REASON,
          ],
        },
      ],
    };
    //console.log('getBuyOrders fromDateValue: ' + fromDateValue);
    //console.log('getBuyOrders toDateValue: ' + toDateValue);


    const resultsPromise = collection.find<OrderProps>(
      {
        ...(agentcode ? { agentcode: { $regex: String(agentcode), $options: 'i' } } : {}),


        ...storecodeQuery,

        // search status is searchOrderStatusCancelled
        // search status is searchOrderStatusCompleted
        // search status is searchOrderStatusCancelled or searchOrderStatusCompleted
        // search status is searchOrderStatusCancelled and searchOrderStatusCompleted

        // status is "cancelled" or "paymentConfirmed"

        // if searchOrderStatusCancelled is true and searchOrderStatusCompleted is true,
        // then status is "cancelled" or "paymentConfirmed"

        // if searchOrderStatusCancelled is true and searchOrderStatusCompleted is false,
        // then status is "cancelled"
        // if searchOrderStatusCancelled is false and searchOrderStatusCompleted is true,
        // then status is "paymentConfirmed"
        // if searchOrderStatusCancelled is false and searchOrderStatusCompleted is false,
        // then status is ne "nothing"

        status: (searchOrderStatusCancelled && searchOrderStatusCompleted ? { $in: ['cancelled', 'paymentConfirmed'] }
          : (searchOrderStatusCancelled ? 'cancelled'
          : (searchOrderStatusCompleted ? 'paymentConfirmed'
          : { $ne: 'nothing' }))),

        // exclude private sale
        //privateSale: { $ne: true },
        privateSale: privateSale || { $ne: true },


        // if searchTradeId is provided, search by tradeId
        ...(searchTradeId ? { tradeId: { $regex: String(searchTradeId), $options: 'i' } } : {}),

        // search store name
        ...(searchStoreName ? { "store.storeName": { $regex: String(searchStoreName), $options: 'i' } } : {}),

        // search buyer name
        ...(searchBuyer ? { nickname: { $regex: String(searchBuyer), $options: 'i' } } : {}),
        
        
        
        // search deposit name
        ...depositNameFilter,


        // search store bank account number
        /////...(searchStoreBankAccountNumber ? { 'store.bankInfo.accountNumber': { $regex: String(searchStoreBankAccountNumber), $options: 'i' } } : {}),
        // seller?.bankInfo?.accountNumber
        ...sellerBankAccountFilter,

        ...(searchBuyerBankAccountNumber ? { 'buyer.bankInfo.accountNumber': { $regex: String(searchBuyerBankAccountNumber), $options: 'i' } } : {}),
        ...searchDepositCompletedQuery,

        // if manualConfirmPayment is true, autoConfirmPayment is not true
        ...(manualConfirmPayment ? { autoConfirmPayment: { $ne: true } } : {}),


        // userType filter
        ...(userType !== 'all' ? { userType: userType } : {}),

        // filter by fromDate and toDate
        /*
        createdAt
        "2025-06-03T07:24:10.135Z"
        */
        /* createdAt is string format */
        /* fromDate is string format YYYY-MM-DD */
        /* convert createdAt to Date object */

        createdAt: {
          $gte: fromDateValue,
          $lte: toDateValue,
        }

      },
      {
        maxTimeMS: BUYORDER_QUERY_MAX_TIME_MS,
      },
      
      //{ projection: { _id: 0, emailVerified: 0 } }
  
    )
    .sort({ createdAt: -1 })
    .limit(limit).skip((page - 1) * limit)
    .toArray();
    //).sort({ paymentConfirmedAt: -1 }).limit(limit).skip((page - 1) * limit).toArray();

    if (!includeSummary) {
      const results = await resultsPromise;
      return {
        totalCount: 0,
        totalKrwAmount: 0,
        totalUsdtAmount: 0,
        totalTransferCount: 0,
        totalTransferAmount: 0,
        totalTransferAmountKRW: 0,
        totalSettlementCount: 0,
        totalSettlementAmount: 0,
        totalSettlementAmountKRW: 0,
        totalFeeAmount: 0,
        totalFeeAmountKRW: 0,
        totalAgentFeeAmount: 0,
        totalAgentFeeAmountKRW: 0,
        totalByUserType: [],
        totalBySellerBankAccountNumber: [],
        totalByBuyerBankAccountNumber: [],
        orders: results,
      };
    }

    
    
    const totalResultPromise = collection.aggregate([
      {
        $match: {

          //'seller.walletAddress': walletAddress,

          //nickname: { $regex: searchNickname, $options: 'i' },


          status: { $in: clearanceStatusesForSummary },

          ///privateSale: { $ne: true },
          privateSale: privateSale,


          //agentcode: { $regex: agentcode, $options: 'i' },
          ...(agentcode ? { agentcode: { $regex: String(agentcode), $options: 'i' } } : {}),



          ...storecodeQuery,

          nickname: { $regex: searchBuyer, $options: 'i' },

          ...(searchTradeId ? { tradeId: { $regex: String(searchTradeId), $options: 'i' } } : {}),
          
          ...depositNameFilter,



          //'store.bankInfo.accountNumber': { $regex: searchStoreBankAccountNumber, $options: 'i' },
                  // seller?.bankInfo?.accountNumber
          ...sellerBankAccountFilter,

          ...(searchBuyerBankAccountNumber ? { 'buyer.bankInfo.accountNumber': { $regex: String(searchBuyerBankAccountNumber), $options: 'i' } } : {}),
          ...searchDepositCompletedQuery,



          // if manualConfirmPayment is true, autoConfirmPayment is not true
          ...(manualConfirmPayment ? { autoConfirmPayment: { $ne: true } } : {}),


          // userType filter
          ...(userType !== 'all' ? { userType: userType } : {}),

          //paymentConfirmedAt: { $gte: startDate, $lt: endDate },

          createdAt: { $gte: fromDateValue, $lt: toDateValue },
        }
      },
      {
        $group: {
          _id: null,


          totalCount: { $sum: 1 },
          totalKrwAmount: { $sum: '$krwAmount' },
          totalUsdtAmount: { $sum: '$usdtAmount' },
          totalTransferCount: {
            $sum: {
              $cond: [hasRealTransferExpr, 1, 0],
            },
          },
          totalTransferAmount: {
            $sum: {
              $cond: [hasRealTransferExpr, { $ifNull: ['$usdtAmount', 0] }, 0],
            },
          },
          totalTransferAmountKRW: {
            $sum: {
              $cond: [hasRealTransferExpr, { $ifNull: ['$krwAmount', 0] }, 0],
            },
          },

          /*
          totalSettlementCount: { $sum: 1 },
          totalSettlementAmount: { $sum: { $toDouble: '$settlement.settlementAmount' } },
          totalSettlementAmountKRW: { $sum: { $toDouble: '$settlement.settlementAmountKRW' } },
          
          totalFeeAmount: { $sum: { $toDouble: '$settlement.feeAmount' } },
          totalFeeAmountKRW: { $sum: { $toDouble: '$settlement.feeAmountKRW' } },

          totalAgentFeeAmount: { $sum: '$settlement.agentFeeAmount' },
          totalAgentFeeAmountKRW: { $sum: { $toDouble: '$settlement.agentFeeAmountKRW' } },
          */

        }

      }

    ], {
      maxTimeMS: BUYORDER_QUERY_MAX_TIME_MS,
    }).toArray();





    const totalResultSettlementPromise = collection.aggregate([
      {
        $match: {

          //'seller.walletAddress': walletAddress,

          //nickname: { $regex: searchNickname, $options: 'i' },


          status: 'paymentConfirmed',
          settlement: { $exists: true, $ne: null },

          ///privateSale: { $ne: true },
          privateSale: privateSale,


          //agentcode: { $regex: agentcode, $options: 'i' },
          ...(agentcode ? { agentcode: { $regex: String(agentcode), $options: 'i' } } : {}),


          ...storecodeQuery,

          nickname: { $regex: searchBuyer, $options: 'i' },

          ...(searchTradeId ? { tradeId: { $regex: String(searchTradeId), $options: 'i' } } : {}),
          
          ...depositNameFilter,



          ///'store.bankInfo.accountNumber': { $regex: searchStoreBankAccountNumber, $options: 'i' },
          // seller?.bankInfo?.accountNumber
          ...sellerBankAccountFilter,

          ...(searchBuyerBankAccountNumber ? { 'buyer.bankInfo.accountNumber': { $regex: String(searchBuyerBankAccountNumber), $options: 'i' } } : {}),
          ...searchDepositCompletedQuery,


          // if manualConfirmPayment is true, autoConfirmPayment is not true
          ...(manualConfirmPayment ? { autoConfirmPayment: { $ne: true } } : {}),


          // userType filter
          ...(userType !== 'all' ? { userType: userType } : {}),


          //paymentConfirmedAt: { $gte: startDate, $lt: endDate },

          createdAt: { $gte: fromDateValue, $lt: toDateValue },
        }
      },
      {
        $group: {
          _id: null,

          /*
          totalCount: { $sum: 1 },
          totalKrwAmount: { $sum: '$krwAmount' },
          totalUsdtAmount: { $sum: '$usdtAmount' },
          */

          totalSettlementCount: { $sum: 1 },
          totalSettlementAmount: { $sum: { $toDouble: '$settlement.settlementAmount' } },
          totalSettlementAmountKRW: { $sum: { $toDouble: '$settlement.settlementAmountKRW' } },
          
          totalFeeAmount: { $sum: { $toDouble: '$settlement.feeAmount' } },
          totalFeeAmountKRW: { $sum: { $toDouble: '$settlement.feeAmountKRW' } },

          totalAgentFeeAmount: { $sum: '$settlement.agentFeeAmount' },
          totalAgentFeeAmountKRW: { $sum: { $toDouble: '$settlement.agentFeeAmountKRW' } },


        }

      }

    ], {
      maxTimeMS: BUYORDER_QUERY_MAX_TIME_MS,
    }).toArray();



    // totalResult for usdtAmout, krwAmount sum and count of each userType (group by userType)

    const totalReaultGroupByUserTypePromise = collection.aggregate([
      {
        $match: {

          //'seller.walletAddress': walletAddress,

          //nickname: { $regex: searchNickname, $options: 'i' },


          status: { $in: clearanceStatusesForSummary },

          //settlement: { $exists: true, $ne: null },

          ///privateSale: { $ne: true },
          privateSale: privateSale,


          //agentcode: { $regex: agentcode, $options: 'i' },
          ...(agentcode ? { agentcode: { $regex: String(agentcode), $options: 'i' } } : {}),


          ...storecodeQuery,

          nickname: { $regex: searchBuyer, $options: 'i' },

          ...(searchTradeId ? { tradeId: { $regex: String(searchTradeId), $options: 'i' } } : {}),
          
          ...depositNameFilter,



          ///'store.bankInfo.accountNumber': { $regex: searchStoreBankAccountNumber, $options: 'i' },
          // seller?.bankInfo?.accountNumber
          ...sellerBankAccountFilter,

          ...(searchBuyerBankAccountNumber ? { 'buyer.bankInfo.accountNumber': { $regex: String(searchBuyerBankAccountNumber), $options: 'i' } } : {}),
          ...searchDepositCompletedQuery,


          // if manualConfirmPayment is true, autoConfirmPayment is not true
          ...(manualConfirmPayment ? { autoConfirmPayment: { $ne: true } } : {}),


          // userType filter
          ...(userType !== 'all' ? { userType: userType } : {}),

          //paymentConfirmedAt: { $gte: startDate, $lt: endDate },

          createdAt: { $gte: fromDateValue, $lt: toDateValue },
        }
      },
      // group by userType empty, A, B, C, D
      {
        $group: {
          _id: '$userType',

          totalCount: { $sum: 1 },
          totalKrwAmount: { $sum: '$krwAmount' },
          totalUsdtAmount: { $sum: '$usdtAmount' },

        }

      }

    ], {
      maxTimeMS: BUYORDER_QUERY_MAX_TIME_MS,
    }).toArray();


    /*
    const totalReaultGroupByBuyerDepositName = await collection.aggregate([
      {
        $match: {
          status: 'paymentConfirmed',
          //settlement: { $exists: true, $ne: null },
          privateSale: privateSale,
          ...(agentcode ? { agentcode: { $regex: String(agentcode), $options: 'i' } } : {}),
          ...storecodeQuery,
          nickname: { $regex: searchBuyer, $options: 'i' },
          ...(searchTradeId ? { tradeId: { $regex: String(searchTradeId), $options: 'i' } } : {}),
          ...depositNameFilter,
          //...(searchStoreBankAccountNumber ? { 'seller.bankInfo.accountNumber': { $regex: String(searchStoreBankAccountNumber), $options: 'i' } } : {}),
          //...(searchBuyerBankAccountNumber ? { 'buyer.bankInfo.accountNumber': { $regex: String(searchBuyerBankAccountNumber), $options: 'i' } } : {}),
          ...(manualConfirmPayment ? { autoConfirmPayment: { $ne: true } } : {}),
          // userType filter
          ...(userType !== 'all' ? { userType: userType } : {}),
          createdAt: { $gte: fromDateValue, $lt: toDateValue },
        }
      },
      {
        $group: {
          _id: '$buyer.depositName',
          totalCount: { $sum: 1 },
          totalKrwAmount: { $sum: '$krwAmount' },
          totalUsdtAmount: { $sum: '$usdtAmount' },
        }
      },
      // sort by totalUsdtAmount desc
      { $sort: { totalUsdtAmount: -1, _id: 1 } },
      // limit 20
      { $limit: 20 }
    ]).toArray();

    const totalReaultGroupByBuyerDepositNameCount = await collection.aggregate([
      {
        $match: {
          status: 'paymentConfirmed',
          //settlement: { $exists: true, $ne: null },
          privateSale: privateSale,
          ...(agentcode ? { agentcode: { $regex: String(agentcode), $options: 'i' } } : {}),
          ...storecodeQuery,
          nickname: { $regex: searchBuyer, $options: 'i' },
          ...(searchTradeId ? { tradeId: { $regex: String(searchTradeId), $options: 'i' } } : {}),
          ...depositNameFilter,
          //...(searchStoreBankAccountNumber ? { 'seller.bankInfo.accountNumber': { $regex: String(searchStoreBankAccountNumber), $options: 'i' } } : {}),
          //...(searchBuyerBankAccountNumber ? { 'buyer.bankInfo.accountNumber': { $regex: String(searchBuyerBankAccountNumber), $options: 'i' } } : {}),
          ...(manualConfirmPayment ? { autoConfirmPayment: { $ne: true } } : {}),
          // userType filter
          ...(userType !== 'all' ? { userType: userType } : {}),
          createdAt: { $gte: fromDateValue, $lt: toDateValue },
        }
      },
      {
        $group: {
          _id: '$buyer.depositName',
        }
      },
      {
        $count: "totalCount"
      }
    ]).toArray();
    */


    // totalReaultGroup by seller.bankInfo.accountNumber

    /*
    
      {
        "_id": {
          "$oid": "6953741b33bd75162b52bf41"
        },
        "bankAccountNumber": "3022104866591",
        "accountHolder": "박준휘",
        "balance": 3097081,
        "bankName": "",
        "updatedAt": "2025-12-30T06:58:41.471Z"
      }
    */
    // join $seller.bankInfo.accountNumber with bankusers collection to get bank account info

    const totalReaultGroupBySellerBankAccountNumberPromise = collection.aggregate([
      {
        $match: {
          status: { $in: clearanceStatusesForSummary },
          
          //settlement: { $exists: true, $ne: null },

          privateSale: privateSale,
          ...(agentcode ? { agentcode: { $regex: String(agentcode), $options: 'i' } } : {}),
          ...storecodeQuery,
          nickname: { $regex: searchBuyer, $options: 'i' },
          ...(searchTradeId ? { tradeId: { $regex: String(searchTradeId), $options: 'i' } } : {}),
          ...depositNameFilter,
          
          
          ...sellerBankAccountFilter,
          //...(searchBuyerBankAccountNumber ? { 'buyer.bankInfo.accountNumber': { $regex: String(searchBuyerBankAccountNumber), $options: 'i' } } : {}),
          
          ...(manualConfirmPayment ? { autoConfirmPayment: { $ne: true } } : {}),
          ...searchDepositCompletedQuery,

          // userType filter
          ...(userType !== 'all' ? { userType: userType } : {}),

          createdAt: { $gte: fromDateValue, $lt: toDateValue },
        }
      },
      {
        $group: {
          
          //_id: '$seller.bankInfo.accountNumber',

          _id: '$seller.bankInfo.realAccountNumber',
          
          totalCount: { $sum: 1 },
          totalKrwAmount: { $sum: '$krwAmount' },
          totalUsdtAmount: { $sum: '$usdtAmount' },
        }
      },
      
      /*
      {
        $lookup: {
          from: "bankusers",
          localField: "_id",
          foreignField: "bankAccountNumber",
          as: "bankUserInfo"
        }
      },
      */
      
     
      {
        $lookup: {
          from: "bankInfos",
          localField: "_id",
          foreignField: "realAccountNumber",
          as: "bankUserInfo"
        }
      },
      


      // sort by totalUsdtAmount desc
      { $sort: { totalUsdtAmount: -1 } }
    ], {
      maxTimeMS: BUYORDER_QUERY_MAX_TIME_MS,
    }).toArray();





    /*
    const totalReaultGroupBySellerAliesBankAccountNumber = await collection.aggregate([
      {
        $match: {
          status: 'paymentConfirmed',
          
          //settlement: { $exists: true, $ne: null },

          privateSale: privateSale,
          ...(agentcode ? { agentcode: { $regex: String(agentcode), $options: 'i' } } : {}),
          ...storecodeQuery,
          nickname: { $regex: searchBuyer, $options: 'i' },
          ...(searchTradeId ? { tradeId: { $regex: String(searchTradeId), $options: 'i' } } : {}),
          ...(searchDepositName ? { $or: [{ "buyer.depositName": { $regex: String(searchDepositName), $options: 'i' } }, { 'seller.bankInfo.accountHolder': { $regex: String(searchDepositName), $options: 'i' } }] } : {}),
          
          
          //...(searchStoreBankAccountNumber ? { 'seller.bankInfo.accountNumber': { $regex: String(searchStoreBankAccountNumber), $options: 'i' } } : {}),
          //...(searchBuyerBankAccountNumber ? { 'buyer.bankInfo.accountNumber': { $regex: String(searchBuyerBankAccountNumber), $options: 'i' } } : {}),
          
          ...(manualConfirmPayment ? { autoConfirmPayment: { $ne: true } } : {}),

          // userType filter
          ...(userType !== 'all' ? { userType: userType } : {}),

          createdAt: { $gte: fromDateValue, $lt: toDateValue },
        }
      },
      {
        $group: {
          
          _id: '$seller.bankInfo.accountNumber',
          totalCount: { $sum: 1 },
          totalKrwAmount: { $sum: '$krwAmount' },
          totalUsdtAmount: { $sum: '$usdtAmount' },
        }
      },
      
      {
        $lookup: {
          from: "bankusers",
          localField: "_id",
          foreignField: "bankAccountNumber",
          as: "bankUserInfo"
        }
      },


      // sort by totalUsdtAmount desc
      { $sort: { totalUsdtAmount: -1 } }
    ]).toArray();
    */






    // totalReaultGroup by buyer.bankInfo.accountNumber
    
    const totalReaultGroupByBuyerBankAccountNumberPromise = collection.aggregate([
      {
        $match: {
          status: { $in: clearanceStatusesForSummary },
          
          //settlement: { $exists: true, $ne: null },

          privateSale: privateSale,
          ...(agentcode ? { agentcode: { $regex: String(agentcode), $options: 'i' } } : {}),
          ...storecodeQuery,
          nickname: { $regex: String(searchBuyer), $options: 'i' },
          ...(searchTradeId ? { tradeId: { $regex: String(searchTradeId), $options: 'i' } } : {}),
          ...depositNameFilter,
          
          ...sellerBankAccountFilter,
          //...(searchBuyerBankAccountNumber ? { 'buyer.bankInfo.accountNumber': { $regex: String(searchBuyerBankAccountNumber), $options: 'i' } } : {}),

          ...(manualConfirmPayment ? { autoConfirmPayment: { $ne: true } } : {}),
          ...searchDepositCompletedQuery,

          // userType filter
          ...(userType !== 'all' ? { userType: userType } : {}),

          createdAt: { $gte: fromDateValue, $lt: toDateValue },
        }
      },
      {
        $group: {
          _id: '$buyer.bankInfo.accountNumber',
          totalCount: { $sum: 1 },
          totalKrwAmount: { $sum: '$krwAmount' },
          totalUsdtAmount: { $sum: '$usdtAmount' },
        }
      },
      {
        $lookup: {
          from: "bankusers",
          localField: "_id",
          foreignField: "bankAccountNumber",
          as: "bankUserInfo"
        }
      },

      // sort by totalUsdtAmount desc
      { $sort: { totalUsdtAmount: -1 } }
    ], {
      maxTimeMS: BUYORDER_QUERY_MAX_TIME_MS,
    }).toArray();
    const [
      results,
      totalResult,
      totalResultSettlement,
      totalReaultGroupByUserType,
      totalReaultGroupBySellerBankAccountNumber,
      totalReaultGroupByBuyerBankAccountNumber,
    ] = await Promise.all([
      resultsPromise,
      totalResultPromise,
      totalResultSettlementPromise,
      totalReaultGroupByUserTypePromise,
      totalReaultGroupBySellerBankAccountNumberPromise,
      totalReaultGroupByBuyerBankAccountNumberPromise,
    ]);

    return {
      totalCount: totalResult.length > 0 ? totalResult[0].totalCount : 0,
      totalKrwAmount: totalResult.length > 0 ? totalResult[0].totalKrwAmount : 0,
      totalUsdtAmount: totalResult.length > 0 ? totalResult[0].totalUsdtAmount : 0,
      totalTransferCount: totalResult.length > 0 ? totalResult[0].totalTransferCount : 0,
      totalTransferAmount: totalResult.length > 0 ? totalResult[0].totalTransferAmount : 0,
      totalTransferAmountKRW: totalResult.length > 0 ? totalResult[0].totalTransferAmountKRW : 0,

      totalSettlementCount: totalResultSettlement.length > 0 ? totalResultSettlement[0].totalSettlementCount : 0,
      totalSettlementAmount: totalResultSettlement.length > 0 ? totalResultSettlement[0].totalSettlementAmount : 0,
      totalSettlementAmountKRW: totalResultSettlement.length > 0 ? totalResultSettlement[0].totalSettlementAmountKRW : 0,
      totalFeeAmount: totalResultSettlement.length > 0 ? totalResultSettlement[0].totalFeeAmount : 0,
      totalFeeAmountKRW: totalResultSettlement.length > 0 ? totalResultSettlement[0].totalFeeAmountKRW : 0,
      totalAgentFeeAmount: totalResultSettlement.length > 0 ? totalResultSettlement[0].totalAgentFeeAmount : 0,
      totalAgentFeeAmountKRW: totalResultSettlement.length > 0 ? totalResultSettlement[0].totalAgentFeeAmountKRW : 0,

      totalByUserType: totalReaultGroupByUserType,
      
      //totalByBuyerDepositName: totalReaultGroupByBuyerDepositName,
      //totalReaultGroupByBuyerDepositNameCount: totalReaultGroupByBuyerDepositNameCount.length > 0 ? totalReaultGroupByBuyerDepositNameCount[0].totalCount : 0,

      totalBySellerBankAccountNumber: totalReaultGroupBySellerBankAccountNumber,

      ////totalBySellerAliesBankAccountNumber: totalReaultGroupBySellerAliesBankAccountNumber,

      totalByBuyerBankAccountNumber: totalReaultGroupByBuyerBankAccountNumber,

      orders: results,
    };

  }


}










export async function getBuyOrdersGroupByStorecodeDaily(
  {
    storecode,
    fromDate,
    toDate,
    searchBuyer,
    searchDepositName,
    searchStoreBankAccountNumber,
  }: {

    storecode: string;
    fromDate: string;
    toDate: string;
    searchBuyer?: string;
    searchDepositName?: string;
    searchStoreBankAccountNumber?: string;

  }
): Promise<any> {

  console.log('getBuyOrdersGroupByStorecodeDaily storecode: ' + storecode);
  console.log('getBuyOrdersGroupByStorecodeDaily fromDate: ' + fromDate);
  console.log('getBuyOrdersGroupByStorecodeDaily toDate: ' + toDate);

  const client = await clientPromise;
  const collection = client.db(dbName).collection('buyorders');

  // fromDate format: YYYY-MM-DD
  // toDate format: YYYY-MM-DD

  // group by korean timezone, so we need to convert fromDate, toDate to UTC time
  // plus 9 hours to UTC time
  // so if hours larger than 24, then add 1 day to date


  const fromDateValue = fromDate ? new Date(fromDate + 'T00:00:00+09:00').toISOString() : '1970-01-01T00:00:00Z';
  const toDateValue = toDate ? new Date(toDate + 'T23:59:59+09:00').toISOString() : new Date().toISOString();


  console.log('getBuyOrdersGroupByStorecodeDaily fromDateValue: ' + fromDateValue);
  console.log('getBuyOrdersGroupByStorecodeDaily toDateValue: ' + toDateValue);


  const normalizedStorecode = (storecode || "").trim();
  const normalizedSearchBuyer = normalizeSearchText(searchBuyer);
  const normalizedSearchDepositName = normalizeSearchText(searchDepositName);
  const normalizedSearchStoreBankAccountNumber = normalizeSearchText(searchStoreBankAccountNumber);
  const isAllStoreScope =
    normalizedStorecode === "" || normalizedStorecode.toLowerCase() === "all";
  const escapedStorecode = normalizedStorecode.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const storecodeMatch = isAllStoreScope
    ? { $ne: null }
    : { $regex: `^${escapedStorecode}$`, $options: 'i' };

  const orderMatchQuery: Record<string, unknown> = {
    storecode: storecodeMatch,
    status: 'paymentConfirmed',
    privateSale: { $ne: true },
    createdAt: {
      $gte: fromDateValue,
      $lte: toDateValue,
    },
  };

  appendContainsFilter(orderMatchQuery, 'nickname', normalizedSearchBuyer);
  appendContainsFilter(orderMatchQuery, 'buyer.depositName', normalizedSearchDepositName);
  appendContainsFilter(
    orderMatchQuery,
    'store.bankInfo.accountNumber',
    normalizedSearchStoreBankAccountNumber,
  );

  // order by date descending
  
  const pipeline = [
    {
      $match: orderMatchQuery
    },
    {
      $group: {
        _id: {
          date: { 
            $dateToString: { 
              format: "%Y-%m-%d", 
              date: { $dateFromString: { dateString: "$createdAt" } },
              timezone: "Asia/Seoul"
            } 
          },

        },
        totalUsdtAmount: { $sum: "$usdtAmount" },
        totalKrwAmount: { $sum: "$krwAmount" },
        totalCount: { $sum: 1 }, // Count the number of orders


        // if settlement fields is exist in buyorders, then count settlement
        totalSettlementCount: { $sum: { $cond: [{ $ifNull: ["$settlement", false] }, 1, 0] } },

        // sum of settlement.settlementAmount
        /////totalSettlementAmount: { $sum: "$settlement.settlementAmount" },
        totalSettlementAmount: { $sum: { $toDouble: "$settlement.settlementAmount" } },


        // sum of settlement.settlementAmountKRW
        // convert settlement.settlementAmountKRW to double
        totalSettlementAmountKRW: { $sum: { $toDouble: "$settlement.settlementAmountKRW" } },

        // agentFeeAmount, agentFeeAmountKRW
        totalAgentFeeAmount: { $sum: "$settlement.agentFeeAmount" },
        totalAgentFeeAmountKRW: { $sum: { $toDouble: "$settlement.agentFeeAmountKRW" } },

        // feeAmount, feeAmountKRW
        totalFeeAmount: { $sum: "$settlement.feeAmount" },
        totalFeeAmountKRW: { $sum: { $toDouble: "$settlement.feeAmountKRW" } },

      }
    },
    {
      $sort: { "_id.date": -1 } // Sort by date descending
    }
  ];
  


  const results = await collection.aggregate(pipeline).toArray();
  //console.log('getBuyOrdersGroupByStorecodeDaily results: ' + JSON.stringify(results));


  // aggregate with escrows collection when escrows date is same as buyorders date
  // escrows date is '2024-01-01'

  const escrowCollection = client.db(dbName).collection('escrows');
  const escrowPipeline = [
    {
      $match: {
        storecode: storecodeMatch,

        // withdrawAmount > 0,
        // depositAmount > 0,
        withdrawAmount: { $gt: 0 },

        date: {
          $gte: fromDateValue,
          $lte: toDateValue,
        }
      }
    },
    {
      $group: {
        _id: {
          date: { 
            $dateToString: { 
              format: "%Y-%m-%d", 
              date: { $dateFromString: { dateString: "$date" } },
              timezone: "Asia/Seoul"
            } 
          },
        },
        totalEscrowDepositAmount: { $sum: "$depositAmount" },
        totalEscrowWithdrawAmount: { $sum: "$withdrawAmount" },
        totalEscrowCount: { $sum: 1 }, // Count the number of escrows
      }
    },
    {
      $sort: { "_id.date": -1 } // Sort by date descending
    }
  ];

  const escrowResults = await escrowCollection.aggregate(escrowPipeline).toArray();

  const privateSaleMatchQuery: Record<string, unknown> = {
    storecode: storecodeMatch,
    status: 'paymentConfirmed',
    privateSale: true,
    createdAt: {
      $gte: fromDateValue,
      $lte: toDateValue,
    },
  };

  appendContainsFilter(privateSaleMatchQuery, 'nickname', normalizedSearchBuyer);
  appendContainsFilter(privateSaleMatchQuery, 'buyer.depositName', normalizedSearchDepositName);
  appendContainsFilter(
    privateSaleMatchQuery,
    'store.bankInfo.accountNumber',
    normalizedSearchStoreBankAccountNumber,
  );


  const pipelinePrivateSale = [
    {
      $match: privateSaleMatchQuery
    },
    {
      $group: {
        _id: {
          date: { 
            $dateToString: { 
              format: "%Y-%m-%d", 
              date: { $dateFromString: { dateString: "$createdAt" } },
              timezone: "Asia/Seoul"
            } 
          },

        },
        totalUsdtAmount: { $sum: "$usdtAmount" },
        totalKrwAmount: { $sum: "$krwAmount" },
        totalCount: { $sum: 1 }, // Count the number of orders

      }
    },
    {
      $sort: { "_id.date": -1 } // Sort by date descending
    }
  ];

  const privateSaleResults = await collection.aggregate(pipelinePrivateSale).toArray();






  return {
    storecode: storecode,
    fromDate: fromDate,
    toDate: toDate,
    orders: results.map(result => ({
      date: result._id.date,
      totalCount: result.totalCount,
      totalUsdtAmount: result.totalUsdtAmount,
      totalKrwAmount: result.totalKrwAmount,
      totalSettlementCount: result.totalSettlementCount,
      totalSettlementAmount: result.totalSettlementAmount,
      totalSettlementAmountKRW: result.totalSettlementAmountKRW,

      totalAgentFeeAmount: result.totalAgentFeeAmount,
      totalAgentFeeAmountKRW: result.totalAgentFeeAmountKRW,
      totalFeeAmount: result.totalFeeAmount,
      totalFeeAmountKRW: result.totalFeeAmountKRW,


      totalEscrowDepositAmount: escrowResults.find(escrow => escrow._id.date === result._id.date)?.totalEscrowDepositAmount || 0,
      totalEscrowWithdrawAmount: escrowResults.find(escrow => escrow._id.date === result._id.date)?.totalEscrowWithdrawAmount || 0,
      totalEscrowCount: escrowResults.find(escrow => escrow._id.date === result._id.date)?.totalEscrowCount || 0,


      totalClearanceCount: privateSaleResults.find(ps => ps._id.date === result._id.date)?.totalCount || 0,
      totalClearanceUsdtAmount: privateSaleResults.find(ps => ps._id.date === result._id.date)?.totalUsdtAmount || 0,
      totalClearanceKrwAmount: privateSaleResults.find(ps => ps._id.date === result._id.date)?.totalKrwAmount || 0,


    }))
  }

}









// getBuyOrdersGroupByAgentcodeDaily
export async function getBuyOrdersGroupByAgentcodeDaily(
  {
    agentcode,
    fromDate,
    toDate,
  }: {

    agentcode: string;
    fromDate: string;
    toDate: string;

  }
): Promise<any> {

  console.log('getBuyOrdersGroupByAgentcodeDaily agentcode: ' + agentcode);
  console.log('getBuyOrdersGroupByAgentcodeDaily fromDate: ' + fromDate);
  console.log('getBuyOrdersGroupByAgentcodeDaily toDate: ' + toDate);

  const client = await clientPromise;
  const collection = client.db(dbName).collection('buyorders');

  // fromDate format: YYYY-MM-DD
  // toDate format: YYYY-MM-DD

  // group by korean timezone, so we need to convert fromDate, toDate to UTC time
  // plus 9 hours to UTC time
  // so if hours larger than 24, then add 1 day to date
  const fromDateValue = fromDate ? new Date(fromDate + 'T00:00:00+09:00').toISOString() : '1970-01-01T00:00:00Z';
  const toDateValue = toDate ? new Date(toDate + 'T23:59:59+09:00').toISOString() : new Date().toISOString();

  console.log('getBuyOrdersGroupByAgentcodeDaily fromDateValue: ' + fromDateValue);
  console.log('getBuyOrdersGroupByAgentcodeDaily toDateValue: ' + toDateValue);
  // order by date descending
  const pipeline = [
    {
      $match: {
        agentcode: agentcode ? { $regex: agentcode, $options: 'i' } : { $ne: null },

        status: 'paymentConfirmed',
        privateSale: { $ne: true },
        createdAt: {
          $gte: fromDateValue,
          $lte: toDateValue,
        }
      }
    },
    {
      $group: {
        _id: {
          date: { 
            $dateToString: { 
              format: "%Y-%m-%d", 
              date: { $dateFromString: { dateString: "$createdAt" } },
              timezone: "Asia/Seoul"
            } 
          },
          agentcode: "$agentcode"
        },
        totalUsdtAmount: { $sum: "$usdtAmount" },
        totalKrwAmount: { $sum: "$krwAmount" },
        totalCount: { $sum: 1 }, // Count the number of orders

        // if settlement fields is exist in buyorders, then count settlement
        totalSettlementCount: { $sum: { $cond: [{ $ifNull: ["$settlement", false] }, 1, 0] } },

        // sum of settlement.settlementAmount
        totalSettlementAmount: { $sum: "$settlement.settlementAmount" },

        // sum of settlement.settlementAmountKRW
        // convert settlement.settlementAmountKRW to double
        totalSettlementAmountKRW: { $sum: { $toDouble: "$settlement.settlementAmountKRW" } },

        // agentFeeAmount, agentFeeAmountKRW
        totalAgentFeeAmount: { $sum: "$settlement.agentFeeAmount" },
        totalAgentFeeAmountKRW: { $sum: { $toDouble: "$settlement.agentFeeAmountKRW" } },

        // feeAmount, feeAmountKRW
        totalFeeAmount: { $sum: "$settlement.feeAmount" },
        totalFeeAmountKRW: { $sum: { $toDouble: "$settlement.feeAmountKRW" } },

      }
    },
    {
      $sort: { "_id.date": -1 } // Sort by date descending
    }
  ];

  const results = await collection.aggregate(pipeline).toArray();
  //console.log('getBuyOrdersGroupByAgentcodeDaily results: ' + JSON.stringify(results));
  // aggregate with escrows collection when escrows date is same as buyorders date
  // escrows date is '2024-01-01'
  const escrowCollection = client.db(dbName).collection('escrows');
  const escrowPipeline = [
    {
      $match: {
        agentcode: agentcode ? { $regex: agentcode, $options: 'i' } : { $ne: null },

        // withdrawAmount > 0,
        // depositAmount > 0,
        withdrawAmount: { $gt: 0 },

        date: {
          $gte: fromDateValue,
          $lte: toDateValue,
        }
      }
    },
    {
      $group: {
        _id: {
          date: { 
            $dateToString: { 
              format: "%Y-%m-%d", 
              date: { $dateFromString: { dateString: "$date" } },
              timezone: "Asia/Seoul"
            } 
          },
          agentcode: "$agentcode"
        },
        totalEscrowDepositAmount: { $sum: "$depositAmount" },
        totalEscrowWithdrawAmount: { $sum: "$withdrawAmount" },
        totalEscrowCount: { $sum: 1 }, // Count the number of escrows
      }
    },
    {
      $sort: { "_id.date": -1 } // Sort by date descending
    }
  ];
  const escrowResults = await escrowCollection.aggregate(escrowPipeline).toArray();
  //console.log('getBuyOrdersGroupByAgentcodeDaily escrowResults: ' + JSON.stringify(escrowResults));
  return {
    agentcode: agentcode,
    fromDate: fromDate,
    toDate: toDate,
    orders: results.map(result => ({
      date: result._id.date,
      agentcode: result._id.agentcode,
      totalCount: result.totalCount,
      totalUsdtAmount: result.totalUsdtAmount,
      totalKrwAmount: result.totalKrwAmount,
      totalSettlementCount: result.totalSettlementCount,
      totalSettlementAmount: result.totalSettlementAmount,
      totalSettlementAmountKRW: result.totalSettlementAmountKRW,

      totalAgentFeeAmount: result.totalAgentFeeAmount,
      totalAgentFeeAmountKRW: result.totalAgentFeeAmountKRW,
      totalFeeAmount: result.totalFeeAmount,
      totalFeeAmountKRW: result.totalFeeAmountKRW,

      totalEscrowDepositAmount: escrowResults.find(escrow => escrow._id.date === result._id.date && escrow._id.agentcode === result._id.agentcode)?.totalEscrowDepositAmount || 0,
      totalEscrowWithdrawAmount: escrowResults.find(escrow => escrow._id.date === result._id.date && escrow._id.agentcode === result._id.agentcode)?.totalEscrowWithdrawAmount || 0,
      totalEscrowCount: escrowResults.find(escrow => escrow._id.date === result._id.date && escrow._id.agentcode === result._id.agentcode)?.totalEscrowCount || 0,

    }))
  }
}



// getBuyOrdersGroupByAgentcodeStores
// group by storecode under the agentcode
// storecode join stores collection to get storeName, storeLogo
export async function getBuyOrdersGroupByAgentcodeStores(
  {
    agentcode,
    fromDate,
    toDate,
  }: {
    agentcode: string;
    fromDate: string;
    toDate: string;
  }
): Promise<any> {


  const client = await clientPromise;
  const collection = client.db(dbName).collection('buyorders');
  const fromDateValue = fromDate ? new Date(fromDate + 'T00:00:00+09:00').toISOString() : '1970-01-01T00:00:00Z';
  const toDateValue = toDate ? new Date(toDate + 'T23:59:59+09:00').toISOString() : new Date().toISOString();
  const pipeline = [
    {
      $match: {
        agentcode: agentcode ? { $regex: agentcode, $options: 'i' } : { $ne: null },
        status: 'paymentConfirmed',
        privateSale: { $ne: true },
        createdAt: {
          $gte: fromDateValue,
          $lte: toDateValue,
        }
      }
    },
    {
      $group: {
        _id: "$storecode",
        totalCount: { $sum: 1 }, // Count the number of orders
        totalUsdtAmount: { $sum: "$usdtAmount" },
        totalKrwAmount: { $sum: "$krwAmount" },
        totalSettlementCount: { $sum: { $cond: [{ $ifNull: ["$settlement", false] }, 1, 0] } },
        totalSettlementAmount: { $sum: "$settlement.settlementAmount" },
        totalSettlementAmountKRW: { $sum: { $toDouble: "$settlement.settlementAmountKRW" } },
        totalAgentFeeAmount: { $sum: "$settlement.agentFeeAmount" },
        totalAgentFeeAmountKRW: { $sum: { $toDouble: "$settlement.agentFeeAmountKRW" } },
        totalFeeAmount: { $sum: "$settlement.feeAmount" },
        totalFeeAmountKRW: { $sum: { $toDouble: "$settlement.feeAmountKRW" } },
        
      }
    },
    {
      $sort: { totalKrwAmount: -1 } // Sort by totalKrwAmount descending
    }
  ];

  const results = await collection.aggregate(pipeline).toArray();

  const storesCollection = client.db(dbName).collection('stores');
  // join stores collection to get storeName, storeLogo
  for (let i = 0; i < results.length; i++) {
    const store = await storesCollection.findOne({ storecode: results[i]._id });
    if (store) {
      results[i].storeName = store.storeName;
      results[i].storeLogo = store.storeLogo;
    } else {
      results[i].storeName = '';
      results[i].storeLogo = '';
    }
  }



  return {
    agentcode: agentcode,
    fromDate: fromDate,
    toDate: toDate,
    orders: results.map(result => ({
      storecode: result._id,
      storeName: result.storeName,
      storeLogo: result.storeLogo,
      totalCount: result.totalCount,
      totalUsdtAmount: result.totalUsdtAmount,
      totalKrwAmount: result.totalKrwAmount,
      totalSettlementCount: result.totalSettlementCount,
      totalSettlementAmount: result.totalSettlementAmount,
      totalSettlementAmountKRW: result.totalSettlementAmountKRW,
      totalAgentFeeAmount: result.totalAgentFeeAmount,
      totalAgentFeeAmountKRW: result.totalAgentFeeAmountKRW,
      totalFeeAmount: result.totalFeeAmount,
      totalFeeAmountKRW: result.totalFeeAmountKRW,
    }))
  };

}






///getBuyOrdersGroupByStores
export async function getBuyOrdersGroupByStores(
  {
    fromDate,
    toDate,
  }: {
    fromDate: string;
    toDate: string;
  }
): Promise<any> {
  const client = await clientPromise;
  const collection = client.db(dbName).collection('buyorders');
  const fromDateValue = fromDate ? new Date(fromDate + 'T00:00:00+09:00').toISOString() : '1970-01-01T00:00:00Z';
  const toDateValue = toDate ? new Date(toDate + 'T23:59:59+09:00').toISOString() : new Date().toISOString();
  const pipeline = [
    {
      $match: {
        status: 'paymentConfirmed',
        privateSale: { $ne: true },
        createdAt: {
          $gte: fromDateValue,
          $lte: toDateValue,
        }
      }
    },
    {
      $group: {
        _id: "$storecode",
        totalCount: { $sum: 1 }, // Count the number of orders
        totalUsdtAmount: { $sum: "$usdtAmount" },
        totalKrwAmount: { $sum: "$krwAmount" },
        totalSettlementCount: { $sum: { $cond: [{ $ifNull: ["$settlement", false] }, 1, 0] } },
        totalSettlementAmount: { $sum: "$settlement.settlementAmount" },
        totalSettlementAmountKRW: { $sum: { $toDouble: "$settlement.settlementAmountKRW" } },
        totalAgentFeeAmount: { $sum: "$settlement.agentFeeAmount" },
        totalAgentFeeAmountKRW: { $sum: { $toDouble: "$settlement.agentFeeAmountKRW" } },
        totalFeeAmount: { $sum: "$settlement.feeAmount" },
        totalFeeAmountKRW: { $sum: { $toDouble: "$settlement.feeAmountKRW" } },
      }
    },
    {
      $sort: { totalKrwAmount: -1 } // Sort by totalKrwAmount descending
    }
  ];
  const results = await collection.aggregate(pipeline).toArray();

  const storesCollection = client.db(dbName).collection('stores');
  // join stores collection to get storeName, storeLogo
  for (let i = 0; i < results.length; i++) {
    const store = await storesCollection.findOne({ storecode: results[i]._id });
    if (store) {
      results[i].storeName = store.storeName;
      results[i].storeLogo = store.storeLogo;
    } else {
      results[i].storeName = '';
      results[i].storeLogo = '';
    }
  }

  return {
    fromDate: fromDate,
    toDate: toDate,
    orders: results.map(result => ({
      storecode: result._id,
      storeName: result.storeName,
      storeLogo: result.storeLogo,
      totalCount: result.totalCount,
      totalUsdtAmount: result.totalUsdtAmount,
      totalKrwAmount: result.totalKrwAmount,
      totalSettlementCount: result.totalSettlementCount,
      totalSettlementAmount: result.totalSettlementAmount,
      totalSettlementAmountKRW: result.totalSettlementAmountKRW,
      totalAgentFeeAmount: result.totalAgentFeeAmount,
      totalAgentFeeAmountKRW: result.totalAgentFeeAmountKRW,
      totalFeeAmount: result.totalFeeAmount,
      totalFeeAmountKRW: result.totalFeeAmountKRW,
    }))
  };
}




// deleete sell order by orderId
export async function deleteBuyOrder(

  {
    orderId,
    walletAddress,
  }: {
    orderId: string;
    walletAddress: string;
  
  }


): Promise<boolean> {

  const client = await clientPromise;
  const collection = client.db(dbName).collection('buyorders');

  // check orderId is valid ObjectId
  if (!ObjectId.isValid(orderId)) {
    return false;
  }

  // check walletAddress is valid

  if (!walletAddress) {
    return false;
  }

  // status is 'ordered'
  const result = await collection.deleteOne(
    { _id: new ObjectId(orderId), walletAddress: walletAddress, status: 'ordered' }
  );



  if (result.deletedCount === 1) {
    return true;
  } else {
    return false;
  }


}

export async function cancelClearanceOrderByAdmin({
  orderId,
  actor,
  cancelReason,
}: {
  orderId: string;
  actor: {
    walletAddress: string | null;
    nickname?: string | null;
    storecode?: string | null;
    role?: string | null;
    publicIp?: string | null;
    signedAt?: string | null;
  };
  cancelReason?: string | null;
}): Promise<{
  ok: boolean;
  status: number;
  error?: string;
  alreadyCancelled?: boolean;
  order?: any | null;
  tradeId?: string | null;
}> {
  if (!ObjectId.isValid(orderId)) {
    return {
      ok: false,
      status: 400,
      error: "Invalid orderId",
    };
  }

  const client = await clientPromise;
  const collection = client.db(dbName).collection("buyorders");
  const bankTransferCollection = client.db(dbName).collection("bankTransfers");
  const historyCollection = client
    .db(dbName)
    .collection("clearanceOrderAdminCancellationHistory");

  const existingOrder = await collection.findOne<any>({
    _id: new ObjectId(orderId),
  });

  if (!existingOrder) {
    return {
      ok: false,
      status: 404,
      error: "Order not found",
    };
  }

  if (existingOrder?.privateSale !== true) {
    return {
      ok: false,
      status: 400,
      error: "Only privateSale clearance orders can be cancelled here",
    };
  }

  if (existingOrder?.buyer?.depositCompleted === true) {
    return {
      ok: false,
      status: 409,
      error: "Withdrawal already completed",
    };
  }

  if (String(existingOrder?.status || "").trim() === "cancelled") {
    return {
      ok: true,
      status: 200,
      alreadyCancelled: true,
      order: existingOrder,
      tradeId: existingOrder?.tradeId || null,
    };
  }

  const previousOrder = await fetchBuyOrderRealtimeSnapshot(
    collection,
    { _id: new ObjectId(orderId) },
  );
  const previousStatus = previousOrder?.status ? String(previousOrder.status) : null;
  const cancelledAt = new Date().toISOString();
  const normalizedCancelReason =
    String(cancelReason || "").trim() || "cancelled_by_admin_clearance_management";
  const normalizedActor = {
    walletAddress: toNullableText(actor?.walletAddress)?.toLowerCase() || null,
    nickname: toNullableText(actor?.nickname),
    storecode: toNullableText(actor?.storecode),
    role: toNullableText(actor?.role),
    publicIp: toNullableText(actor?.publicIp),
    signedAt: toNullableText(actor?.signedAt),
    cancelledAt,
  };

  const result = await collection.updateOne(
    {
      _id: new ObjectId(orderId),
      status: { $ne: "cancelled" },
      "buyer.depositCompleted": { $ne: true },
    },
    {
      $set: {
        status: "cancelled",
        canceller: "admin",
        cancelledAt,
        cancelTradeReason: normalizedCancelReason,
        cancelledByAdmin: normalizedActor,
      },
    },
  );

  const updatedOrder = await collection.findOne<any>({
    _id: new ObjectId(orderId),
  });

  if (result.modifiedCount !== 1 || !updatedOrder) {
    if (updatedOrder?.status === "cancelled") {
      return {
        ok: true,
        status: 200,
        alreadyCancelled: true,
        order: updatedOrder,
        tradeId: updatedOrder?.tradeId || null,
      };
    }

    return {
      ok: false,
      status: 500,
      error: "Failed to cancel clearance order",
      order: updatedOrder || existingOrder,
      tradeId: existingOrder?.tradeId || null,
    };
  }

  const linkedBankTransfers = updatedOrder?.tradeId
    ? await bankTransferCollection.find({
        tradeId: String(updatedOrder.tradeId || ""),
      }).toArray()
    : [];

  if (linkedBankTransfers.length > 0) {
    await bankTransferCollection.updateMany(
      {
        _id: {
          $in: linkedBankTransfers.map((item) => item?._id).filter(Boolean),
        },
      },
      {
        $set: {
          tradeId: null,
          match: null,
          matchedByAdmin: false,
          buyerInfo: null,
          sellerInfo: null,
          errorMessage: null,
          memo: "청산주문 관리자 취소로 매칭 해제됨",
          clearanceOrderCancelledAt: cancelledAt,
          clearanceOrderCancelledReason: normalizedCancelReason,
          clearanceOrderCancelledBy: normalizedActor,
        },
      },
    );
  }

  await historyCollection.insertOne({
    orderId,
    tradeId: updatedOrder?.tradeId || existingOrder?.tradeId || null,
    storecode: updatedOrder?.storecode || existingOrder?.storecode || null,
    walletAddress: updatedOrder?.walletAddress || existingOrder?.walletAddress || null,
    previousStatus,
    cancelReason: normalizedCancelReason,
    cancelledAt,
    cancelledBy: normalizedActor,
    linkedBankTransferIds: linkedBankTransfers.map((item) => item?._id).filter(Boolean),
    orderSnapshotBefore: existingOrder,
    orderSnapshotAfter: updatedOrder,
  });

  clearBuyOrderReadCache();

  if (updatedOrder?.storecode && updatedOrder?.walletAddress) {
    await syncUserBuyOrderStateByWalletAndStorecode({
      client,
      buyOrderCollection: collection,
      storecode: String(updatedOrder.storecode || ""),
      walletAddress: String(updatedOrder.walletAddress || ""),
    });
  }

  if (previousStatus !== "cancelled") {
    await emitBuyOrderStatusRealtimeEvent({
      source: "order.cancelClearanceOrderByAdmin",
      statusFrom: previousStatus,
      statusTo: "cancelled",
      order: updatedOrder,
      reason: normalizedCancelReason,
      idempotencyParts: [
        String(orderId),
        String(normalizedActor.walletAddress || ""),
        cancelledAt,
      ],
    });
  }

  return {
    ok: true,
    status: 200,
    alreadyCancelled: false,
    order: updatedOrder,
    tradeId: updatedOrder?.tradeId || null,
  };
}

export async function deleteWebhookGeneratedClearanceOrderByAdmin({
  orderId,
  actor,
  deleteReason,
}: {
  orderId: string;
  actor: {
    walletAddress: string | null;
    nickname?: string | null;
    storecode?: string | null;
    role?: string | null;
    publicIp?: string | null;
    signedAt?: string | null;
  };
  deleteReason?: string | null;
}): Promise<{
  ok: boolean;
  status: number;
  error?: string;
  deletedOrderId?: string;
  tradeId?: string | null;
}> {
  if (!ObjectId.isValid(orderId)) {
    return {
      ok: false,
      status: 400,
      error: "Invalid orderId",
    };
  }

  const client = await clientPromise;
  const collection = client.db(dbName).collection("buyorders");
  const bankTransferCollection = client.db(dbName).collection("bankTransfers");
  const historyCollection = client
    .db(dbName)
    .collection("clearanceWebhookOrderDeletionHistory");

  const existingOrder = await collection.findOne<any>({
    _id: new ObjectId(orderId),
  });

  if (!existingOrder) {
    return {
      ok: false,
      status: 404,
      error: "Order not found",
    };
  }

  if (existingOrder?.privateSale !== true) {
    return {
      ok: false,
      status: 400,
      error: "Only privateSale clearance orders can be deleted here",
    };
  }

  if (!isWithdrawalWebhookGeneratedClearanceOrder(existingOrder)) {
    return {
      ok: false,
      status: 400,
      error: "Only withdrawal-webhook generated clearance orders can be deleted",
    };
  }

  if (!isWithdrawalWebhookGeneratedClearanceOrderDeletable(existingOrder)) {
    return {
      ok: false,
      status: 409,
      error: "This withdrawal-webhook clearance order can no longer be deleted",
    };
  }

  const deletionTimestamp = new Date().toISOString();
  const normalizedDeleteReason =
    String(deleteReason || "").trim() || "not_a_clearance_withdrawal";
  const linkedBankTransfers = existingOrder?.tradeId
    ? await bankTransferCollection.find({
      tradeId: String(existingOrder.tradeId || ""),
    }).toArray()
    : [];

  if (linkedBankTransfers.length > 0) {
    await bankTransferCollection.updateMany(
      {
        _id: {
          $in: linkedBankTransfers.map((item) => item?._id).filter(Boolean),
        },
      },
      {
        $set: {
          tradeId: null,
          match: null,
          matchedByAdmin: false,
          buyerInfo: null,
          sellerInfo: null,
          errorMessage: null,
          memo: "legacy 출금 webhook 자동생성 주문 삭제됨",
          webhookGeneratedClearanceOrderDeletedAt: deletionTimestamp,
          webhookGeneratedClearanceOrderDeletedReason: normalizedDeleteReason,
          webhookGeneratedClearanceOrderDeletedBy: {
            walletAddress: actor?.walletAddress || null,
            nickname: actor?.nickname || null,
            storecode: actor?.storecode || null,
            role: actor?.role || null,
            publicIp: actor?.publicIp || null,
            signedAt: actor?.signedAt || null,
          },
        },
      },
    );
  }

  const result = await collection.deleteOne({
    _id: new ObjectId(orderId),
  });

  if (result.deletedCount !== 1) {
    return {
      ok: false,
      status: 500,
      error: "Failed to delete clearance order",
    };
  }

  await historyCollection.insertOne({
    orderId,
    tradeId: existingOrder?.tradeId || null,
    storecode: existingOrder?.storecode || null,
    walletAddress: existingOrder?.walletAddress || null,
    createdBySource:
      existingOrder?.createdBy?.source || WITHDRAWAL_WEBHOOK_CLEARANCE_SOURCE,
    deleteReason: normalizedDeleteReason,
    deletedAt: deletionTimestamp,
    deletedBy: {
      walletAddress: actor?.walletAddress || null,
      nickname: actor?.nickname || null,
      storecode: actor?.storecode || null,
      role: actor?.role || null,
      publicIp: actor?.publicIp || null,
      signedAt: actor?.signedAt || null,
    },
    linkedBankTransferIds: linkedBankTransfers.map((item) => item?._id).filter(Boolean),
    linkedBankTransferTradeId: existingOrder?.tradeId || null,
    orderSnapshot: existingOrder,
  });

  clearBuyOrderReadCache();

  if (existingOrder?.storecode && existingOrder?.walletAddress) {
    await syncUserBuyOrderStateByWalletAndStorecode({
      client,
      buyOrderCollection: collection,
      storecode: String(existingOrder.storecode || ""),
      walletAddress: String(existingOrder.walletAddress || ""),
    });
  }

  return {
    ok: true,
    status: 200,
    deletedOrderId: orderId,
    tradeId: existingOrder?.tradeId || null,
  };
}








// get sell orders order by createdAt desc
export async function getBuyOrdersForSeller(

  {
    storecode,
    limit,
    page,
    walletAddress,
    searchMyOrders,
    searchOrderStatusCancelled,
    searchOrderStatusCompleted,
    fromDate,
    toDate,
  }: {
    storecode: string;
    limit: number;
    page: number;
    walletAddress: string;
    searchMyOrders: boolean;
    searchOrderStatusCancelled: boolean;
    searchOrderStatusCompleted: boolean;
    fromDate: string;
    toDate: string;
  }

): Promise<ResultProps> {

  const client = await clientPromise;

  const collection = client.db(dbName).collection('buyorders');


  // status is not 'paymentConfirmed'

  //console.log('getBuyOrdersForSeller storecode: ' + storecode);
  //console.log('getBuyOrdersForSeller limit: ' + limit);
  //console.log('getBuyOrdersForSeller page: ' + page);





  // if searchMyOrders is true, get orders by buyer wallet address is walletAddress
  // else get all orders except paymentConfirmed

  // if storecode is empty, get all orders by wallet address

  // if storecode is not empty, get orders by storecode and wallet address


  if (searchMyOrders) {

    const results = await collection.find<OrderProps>(

      /*
      {
        'storecode': storecode,
        'walletAddress': walletAddress,

        
        //status: { $ne: 'paymentConfirmed' },

      },
      */
      // createdAt is fromDate to toDate

      {

        storecode:  storecode,
        walletAddress: walletAddress,
        privateSale: { $ne: true },

        createdAt: {
          $gte: new Date(fromDate),
          $lte: new Date(toDate)
        },

        status: (searchOrderStatusCancelled && searchOrderStatusCompleted ? { $in: ['cancelled', 'paymentConfirmed'] }
          : (searchOrderStatusCancelled ? 'cancelled'
          : (searchOrderStatusCompleted ? 'paymentConfirmed'
          : { $ne: 'nothing' }))),

      }
      // createdAt is fromDate to toDate

      //{ projection: { _id: 0, emailVerified: 0 } }

    ).sort({ createdAt: -1 }).limit(limit).skip((page - 1) * limit).toArray();


    const totalCount = await collection.countDocuments(
      {
        storecode: storecode,
        walletAddress: walletAddress,

        privateSale: { $ne: true },

        createdAt: {
          $gte: new Date(fromDate),
          $lte: new Date(toDate)
        },

        status: (searchOrderStatusCancelled && searchOrderStatusCompleted ? { $in: ['cancelled', 'paymentConfirmed'] }
          : (searchOrderStatusCancelled ? 'cancelled'
          : (searchOrderStatusCompleted ? 'paymentConfirmed'
          : { $ne: 'nothing' }))),

      }
    );


    return {
      totalCount: totalCount,
      orders: results,
    };

  } else {



    const results = await collection.find<OrderProps>(
      {
        //status: 'ordered',
  
        //status: { $ne: 'paymentConfirmed' },
  
        storecode: storecode,
        // exclude private sale
        privateSale: { $ne: true },

        createdAt: {
          $gte: new Date(fromDate),
          $lte: new Date(toDate)
        },

        status: (searchOrderStatusCancelled && searchOrderStatusCompleted ? { $in: ['cancelled', 'paymentConfirmed'] }
          : (searchOrderStatusCancelled ? 'cancelled'
          : (searchOrderStatusCompleted ? 'paymentConfirmed'
          : { $ne: 'nothing' }))),

      },
      
      //{ projection: { _id: 0, emailVerified: 0 } }
  
    ).sort({ createdAt: -1 }).limit(limit).skip((page - 1) * limit).toArray();
  

    const totalCount = await collection.countDocuments(
      {
        storecode: storecode,
        privateSale: { $ne: true },

        createdAt: {
          $gte: new Date(fromDate),
          $lte: new Date(toDate)
        },

        status: (searchOrderStatusCancelled && searchOrderStatusCompleted ? { $in: ['cancelled', 'paymentConfirmed'] }
          : (searchOrderStatusCancelled ? 'cancelled'
          : (searchOrderStatusCompleted ? 'paymentConfirmed'
          : { $ne: 'nothing' }))),

      }
    );

    return {
      totalCount: totalCount,
      orders: results,
    };

  }


}



/*
  {
    lang: 'ko',
    storecode: 'suroggyc',
    orderId: new ObjectId('6827479e460e1b9e73417ebc'),
    sellerWalletAddress: '0x98773aF65AE660Be4751ddd09C4350906e9D88F3',
    sellerStorecode: 'admin'
  }
*/



// accept buy order
// update order status to accepted


export async function acceptBuyOrder(data: any) {
 
  if (!data.orderId || !data.storecode || !data.sellerWalletAddress
    || !data.sellerStorecode
  ) {
    return null;
  }

  const sellerMemo = data.sellerMemo || '';


  const client = await clientPromise;

  const buyorderCollection = client.db(dbName).collection('buyorders');
  const storeCollection = client.db(dbName).collection('stores');
  const userCollection = client.db(dbName).collection('users');

  const store = await storeCollection.findOne<any>(
    {
      storecode: data.storecode,
    },
  );
  if (!store) {
    console.log('acceptBuyOrder storecode is not valid: ' + data.storecode);
    return null;
  }


  // get user by wallet address
  let user: OrderProps | null = null;


  // if privateSale is false, then get user by storecode and walletAddress
  const order = await client.db(dbName)
    .collection('buyorders')
    .findOne<any>(
      { _id: new ObjectId(data.orderId + '')},
      { projection: {
        privateSale: 1,
        walletAddress: 1,
      } }
    );

  //if (order?.privateSale === false) {
    
    const sellerWalletAddressRaw = String(data.sellerWalletAddress || '').trim();
    const normalizedSellerWalletAddress = normalizeWalletAddress(data.sellerWalletAddress);

    user = await userCollection.findOne<OrderProps>(
      {
        walletAddress: sellerWalletAddressRaw,
        storecode: data.sellerStorecode,
      },
    );

    if (!user && (normalizedSellerWalletAddress || sellerWalletAddressRaw)) {
      const escapedSellerWalletAddress = String(
        normalizedSellerWalletAddress || sellerWalletAddressRaw,
      ).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

      // Legacy store settings sometimes persist the same wallet with different casing.
      user = await userCollection.findOne<OrderProps>(
        {
          storecode: data.sellerStorecode,
          walletAddress: new RegExp(`^${escapedSellerWalletAddress}$`, 'i'),
        },
      );
    }

    if (!user) {
      console.log('acceptBuyOrder user is null: ' + JSON.stringify(user));
      return null;
    }

  //}





  // get buyer userType
  const buyer = await userCollection.findOne<OrderProps>(
    {
      storecode: data.storecode,
      walletAddress: order?.walletAddress,
    },
    { projection: { userType: 1 } }
  );

  // userType is null or empty, or 'AAA', 'BBB', 'CCC', 'DDD'
  const userType = buyer?.userType || '';

  /*
  const bankInfo = user?.seller?.bankInfo || {
    bankName: '',
    accountNumber: '',
    accountHolder: '',
  };
  */

  const bankInfo = userType === ''
    ? store?.bankInfo
    : userType === 'AAA'
      ? store?.bankInfoAAA
      : userType === 'BBB'
        ? store?.bankInfoBBB
        : userType === 'CCC'
          ? store?.bankInfoCCC
          : userType === 'DDD'
            ? store?.bankInfoDDD
            : store?.bankInfo;


  const sellerNickname = user?.nickname || '';
  const sellerAvatar = user?.avatar || '';




  const sellerMobile = user?.mobile || '';
  const sellerSignerAddress = String(user?.signerAddress || data.signerAddress || '').trim();


  let updatedBankInfo = bankInfo;

  // find trustBankInfo by bankInfo.accountNumber from bankInfos collection
  const bankInfosCollection = client.db(dbName).collection('bankInfos');
  const trustBankInfo = await bankInfosCollection.findOne<any>(
    {
      defaultAccountNumber: bankInfo?.accountNumber,
    }
  );
  if (trustBankInfo
    && trustBankInfo.bankName !== 'Unknown'
    && trustBankInfo.accountHolder !== 'Unknown'
    && trustBankInfo.realAccountNumber
  ) {
    updatedBankInfo = {
      bankName: trustBankInfo.bankName,
      accountNumber: trustBankInfo.defaultAccountNumber,
      accountHolder: trustBankInfo.accountHolder,
      realAccountNumber: trustBankInfo.realAccountNumber,
    };
  }







  // random number for tradeId
  // 100000 ~ 999999 string

  ////const tradeId = Math.floor(Math.random() * 900000) + 100000 + '';



  /*
    const result = await collection.findOne<OrderProps>(
    { _id: new ObjectId(orderId) }
  );
  */


  ///console.log('acceptSellOrder data.orderId: ' + data.orderId);

 
  // *********************************************
  // update status to accepted if status is ordered

  // if status is not ordered, return null
  // check condition and update status to accepted
  // *********************************************

  const sellerUpdate: Record<string, any> = {
    walletAddress: data.sellerWalletAddress,

    /*
    nickname: data.sellerNickname,
    avatar: data.sellerAvatar,
    mobile: data.sellerMobile,
    */

    nickname: sellerNickname,
    avatar: sellerAvatar,
    mobile: sellerMobile,

    memo: sellerMemo,

    //bankInfo: bankInfo,
    bankInfo: updatedBankInfo,
  };

  if (sellerSignerAddress) {
    sellerUpdate.signerAddress = sellerSignerAddress;
  }

  const result = await buyorderCollection.findOneAndUpdate(
    { _id: new ObjectId(data.orderId + ''), status: 'ordered' },
    { $set: {
      status: 'accepted',
      acceptedAt: new Date().toISOString(),
      ///tradeId: tradeId,
      
      seller: sellerUpdate,

    } }
  );




  if (result) {

    if (result?.value) {
      const updatedOrder = await fetchBuyOrderRealtimeSnapshot(
        buyorderCollection,
        { _id: new ObjectId(data.orderId + "") },
      );

      await emitBuyOrderStatusRealtimeEvent({
        source: "order.acceptBuyOrder",
        statusFrom: "ordered",
        statusTo: "accepted",
        order: updatedOrder,
        idempotencyParts: [String(data.orderId)],
      });
    }


    /*
    const updated = await buyorderCollection.findOne<any>(
      { _id: new ObjectId(data.orderId + '') }
    );

    ///console.log('acceptSellOrder updated: ' + JSON.stringify(updated));



    return updated;
    */
    
    return result;
    

  } else {
    
    return null;
  }
  
}







export async function buyOrderRequestPayment(data: any) {
  
  ///console.log('acceptSellOrder data: ' + JSON.stringify(data));

  if (!data.orderId) {

    console.log('buyOrderRequestPayment orderId is null: ' + JSON.stringify(data));
    return null;
  }

  if (!data.transactionHash) {

    console.log('buyOrderRequestPayment transactionHash is null: ' + JSON.stringify(data));
    return null;
  }


  const client = await clientPromise;
  const collection = client.db(dbName).collection('buyorders');

  const previousOrder = await fetchBuyOrderRealtimeSnapshot(
    collection,
    { _id: new ObjectId(data.orderId + '') },
  );
  const previousStatus = previousOrder?.status ? String(previousOrder.status) : null;


  let result = null;


  if (data?.bankInfo) {

    result = await collection.updateOne(
    
      { _id: new ObjectId(data.orderId + '') },

      { $set: {
        status: 'paymentRequested',
        escrowTransactionHash: data.transactionHash,
        paymentRequestedAt: new Date().toISOString(),
        "seller.bankInfo": data.bankInfo,
        "seller.memo": data.sellerMemo,
      } }

    );




  } else {
  
  
    result = await collection.updateOne(
    
      { _id: new ObjectId(data.orderId + '') },


      { $set: {
        status: 'paymentRequested',
        escrowTransactionHash: data.transactionHash,
        paymentRequestedAt: new Date().toISOString(),
      } }
      
    );

  }
  

  console.log('buyOrderRequestPayment result: ' + JSON.stringify(result));




  if (result && result.modifiedCount > 0) {


    const order = await collection.findOne<OrderProps>(
      { _id: new ObjectId(data.orderId + '') },
      { projection: { storecode: 1, walletAddress: 1 } }
    );
    if (order) {
      await syncUserBuyOrderStateByWalletAndStorecode({
        client,
        buyOrderCollection: collection,
        storecode: String(order.storecode || ""),
        walletAddress: String(order.walletAddress || ""),
      });

    }




    const updated = await collection.findOne<OrderProps>(
      { _id: new ObjectId(data.orderId + '') }
    );

    if (updated && previousStatus !== 'paymentRequested') {
      await emitBuyOrderStatusRealtimeEvent({
        source: "order.buyOrderRequestPayment",
        statusFrom: previousStatus,
        statusTo: "paymentRequested",
        order: updated,
        idempotencyParts: [String(data.orderId), String(data.transactionHash || "")],
      });
    }

    return updated;
  } else {
    return null;
  }
  
}





export async function buyOrderConfirmPayment(data: any) {

  if (!data.orderId) {
    return null;
  }

  if (!data.transactionHash) {
    return null;
  }

  const paymentAmount = data.paymentAmount || 0;

  const autoConfirmPayment = data.autoConfirmPayment;
  const paymentConfirmedAt = new Date().toISOString();
  const normalizedPaymentConfirmedBy =
    data.paymentConfirmedBy && typeof data.paymentConfirmedBy === "object" && !Array.isArray(data.paymentConfirmedBy)
      ? {
          walletAddress: toNullableText(data.paymentConfirmedBy.walletAddress)?.toLowerCase() || null,
          nickname: toNullableText(data.paymentConfirmedBy.nickname),
          storecode: toNullableText(data.paymentConfirmedBy.storecode),
          role: toNullableText(data.paymentConfirmedBy.role),
          publicIp: toNullableText(data.paymentConfirmedBy.publicIp),
          signedAt: toNullableText(data.paymentConfirmedBy.signedAt),
          matchedBy: toNullableText(data.paymentConfirmedBy.matchedBy),
          confirmedAt: paymentConfirmedAt,
        }
      : null;


  const client = await clientPromise;
  const collection = client.db(dbName).collection('buyorders');


  let result = null;
  const updateFields: Record<string, unknown> = {
    status: 'paymentConfirmed',
    updatedAt: paymentConfirmedAt,
    paymentConfirmedAt,
    paymentAmount: paymentAmount,
    transactionHash: data.transactionHash,
    sellerWalletAddressBalance: data.sellerWalletAddressBalance,
  };

  if (data.queueId != null) {
    updateFields.queueId = data.queueId;
  }

  if (typeof autoConfirmPayment === "boolean") {
    updateFields.autoConfirmPayment = autoConfirmPayment;
  }

  if (typeof data.matchedByAdmin === "boolean") {
    updateFields.matchedByAdmin = data.matchedByAdmin;
  }

  if (normalizedPaymentConfirmedBy) {
    updateFields.paymentConfirmedBy = normalizedPaymentConfirmedBy;
    updateFields.paymentConfirmedByName = normalizedPaymentConfirmedBy.nickname;
    updateFields.paymentConfirmedByWalletAddress = normalizedPaymentConfirmedBy.walletAddress;
    updateFields.confirmedBy = normalizedPaymentConfirmedBy;
    updateFields.confirmedByName = normalizedPaymentConfirmedBy.nickname;
    updateFields.confirmedByWalletAddress = normalizedPaymentConfirmedBy.walletAddress;
    updateFields.processedBy = normalizedPaymentConfirmedBy;
    updateFields.processedByName = normalizedPaymentConfirmedBy.nickname;
    updateFields.processedByWalletAddress = normalizedPaymentConfirmedBy.walletAddress;
  }

  if (data.escrowTransactionHash) {
    updateFields.escrowTransactionHash = data.escrowTransactionHash;
    updateFields.escrowTransactionConfirmedAt = new Date().toISOString();
  }


  // when order status is 'paymentRequested', then update to 'paymentConfirmed'


  try {
    result = await collection.updateOne(
      {
        _id: new ObjectId(data.orderId+''),
        status: 'paymentRequested',
      },
      { $set: updateFields }
    );

  } catch (error) {
    console.error('Error confirming payment:', error);
    return null;
  }

  //console.log('buyOrderConfirmPayment result: ' + JSON.stringify(result));

  // result: {"acknowledged":true,"modifiedCount":1,"upsertedId":null,"upsertedCount":0,"matchedCount":1}

  if (result && result.modifiedCount > 0) {

    clearBuyOrderReadCache();







    // update store collection

    // get count of paymentConfirmed orders by storecode
    // get sum of krwAmount and usdtAmount by storecode
    // get storecode from order
    const order = await collection.findOne<OrderProps>(
      { _id: new ObjectId(data.orderId+'') },
      { projection: {
        tradeId: 1,
        nickname: 1,
        krwAmount: 1,
        storecode: 1,
        agentcode: 1,
        walletAddress: 1,
        returnUrl: 1,
        orderNumber: 1,
      } }
    );


    

    if (order && order.storecode) {





      // 조지아 WOOD site
      // when storecode is "qibgieiu"

      // callback to site
      // url POST
      // https://wood-505.com/tools/arena/ChangeBalance2.php
      // jsoin body
      /*
      {
        "indexkey": "26834827",
        "userid": "user123",
        "amount": "10000",
      }
      */

      // returnUrl result log collection
      const returnUrlLogCollection = client.db(dbName).collection('returnUrlLogs');

      // 조지아 WOOD site
      if (
        order.storecode === 'qibgieiu'
      ) {
        try {
          const returnUrl = 'https://wood-505.com/tools/arena/ChangeBalance2.php';
          const response = await fetch(returnUrl,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                indexkey: order.tradeId,
                userid: order.nickname,
                amount: order.krwAmount,
              }),
            }
          );

          const responseData = await response.text();


          // log returnUrl call result
          await returnUrlLogCollection.insertOne({
            tradeId: order.tradeId,
            returnUrl: returnUrl,
            requestBody: {
              indexkey: order.tradeId,
              userid: order.nickname,
              amount: order.krwAmount,
            },
            responseBody: responseData,
            createdAt: new Date().toISOString(),
          });


        } catch (error) {
          console.error('Error calling external API for storecode qibgieiu:', error);
        }
      } else {

        if (order.returnUrl) {
          ///shop/influ_coin/orderform.php?oid=123456&paystate=4&pay_date=2025-10-2414:30:25&mul_no=1
          try {

            // parse get prams from returnUrl
            const url = new URL(order.returnUrl);
            const existingParams = Object.fromEntries(url.searchParams);
            // merge existing get prams with get prams
            const mergedParams = {
              ...existingParams,
              paystate: '4',
              pay_date: new Date().toISOString().replace('T', '').substring(0, 19),
              mul_no: '1',
              orderNumber: order.orderNumber || '',
            };
            // set merged get prams to url
            const finalUrl = url.origin + url.pathname + '?' + new URLSearchParams(mergedParams).toString();

            console.log('Calling returnUrl API: ' + finalUrl);

            const response = await fetch(finalUrl,
              {
                method: 'GET',
              }
            );

            const responseData = await response.text();

            // log returnUrl call result
            await returnUrlLogCollection.insertOne({
              tradeId: order.tradeId,
              returnUrl: finalUrl,
              responseBody: responseData,
              createdAt: new Date().toISOString(),
            });


          } catch (error) {
            console.error('Error calling returnUrl API:', error);
          }
        }

      }













      const storecode = order.storecode;
      const walletAddress = order.walletAddress;

      await syncUserBuyOrderStateByWalletAndStorecode({
        client,
        buyOrderCollection: collection,
        storecode: String(storecode || ""),
        walletAddress: String(walletAddress || ""),
      });


      /*
      const totalPaymentConfirmed = await collection.aggregate([
        { $match: {
          storecode: storecode,
          status: 'paymentConfirmed',
          privateSale: false, // exclude private sale
        }},
        { $group: {
          _id: null,
          totalPaymentConfirmedCount: { $sum: 1 },
          totalKrwAmount: { $sum: '$krwAmount' },
          totalUsdtAmount: { $sum: '$usdtAmount' }
        } }
      ]).toArray();


      //console.log('confirmPayment totalPaymentConfirmed: ' + JSON.stringify(totalPaymentConfirmed));
      const totalPaymentConfirmedClearance = await collection.aggregate([
        { $match: {
          storecode: storecode,
          status: 'paymentConfirmed',
          privateSale: true, // include private sale
        }},
        { $group: {
          _id: null,
          totalPaymentConfirmedClearanceCount: { $sum: 1 },
          totalKrwAmountClearance: { $sum: '$krwAmount' },
          totalUsdtAmountClearance: { $sum: '$usdtAmount' }
        } }
      ]).toArray();


      //console.log('confirmPayment totalPaymentConfirmedClearance: ' + JSON.stringify(totalPaymentConfirmedClearance));
      // update store collection
      const storeCollection = client.db(dbName).collection('stores');
      await storeCollection.updateOne(
        { storecode: storecode },
        { $set: {
          
          totalPaymentConfirmedCount: totalPaymentConfirmed[0]?.totalPaymentConfirmedCount || 0,
          totalKrwAmount: totalPaymentConfirmed[0]?.totalKrwAmount || 0,
          totalUsdtAmount: totalPaymentConfirmed[0]?.totalUsdtAmount || 0,

          totalPaymentConfirmedClearanceCount: totalPaymentConfirmedClearance[0]?.totalPaymentConfirmedClearanceCount || 0,
          totalKrwAmountClearance: totalPaymentConfirmedClearance[0]?.totalKrwAmountClearance || 0,
          totalUsdtAmountClearance: totalPaymentConfirmedClearance[0]?.totalUsdtAmountClearance || 0,
        } }
      );
      */

      // update store collection
      const storeCollection = client.db(dbName).collection('stores');
      // update store collection for clearance
      if (data.privateSale) {
        await storeCollection.updateOne(
          { storecode: storecode },
          { $inc: {
            totalPaymentConfirmedClearanceCount: 1,
            totalKrwAmountClearance: paymentAmount,
            totalUsdtAmountClearance: data.usdtAmount || 0,
          } }
        );
      } else {
        await storeCollection.updateOne(
          { storecode: storecode },
          { $inc: {
            totalPaymentConfirmedCount: 1,
            totalKrwAmount: paymentAmount,
            totalUsdtAmount: data.usdtAmount || 0,
          } }
        );
      }



    }



    if (order && order.agentcode) {
      

      const agentcode = order.agentcode;

      /*
      const totalPaymentConfirmed = await collection.aggregate([
        { $match: {
          agentcode: agentcode,
          status: 'paymentConfirmed',
          privateSale: false, // exclude private sale
        }},
        { $group: {
          _id: null,
          totalPaymentConfirmedCount: { $sum: 1 },
          totalKrwAmount: { $sum: '$krwAmount' },
          totalUsdtAmount: { $sum: '$usdtAmount' }
        } }
      ]).toArray();

      //console.log('confirmPayment totalPaymentConfirmed: ' + JSON.stringify(totalPaymentConfirmed));
      const totalPaymentConfirmedClearance = await collection.aggregate([
        { $match: {
          agentcode: agentcode,
          status: 'paymentConfirmed',
          privateSale: true, // include private sale
        }},
        { $group: {
          _id: null,
          totalPaymentConfirmedClearanceCount: { $sum: 1 },
          totalKrwAmountClearance: { $sum: '$krwAmount' },
          totalUsdtAmountClearance: { $sum: '$usdtAmount' }
        } }
      ]).toArray();
      
      //console.log('confirmPayment totalPaymentConfirmedClearance: ' + JSON.stringify(totalPaymentConfirmedClearance));
      // update agent collection
      const agentCollection = client.db(dbName).collection('agents');
      const agent = await agentCollection.updateOne(
        { agentcode: agentcode },
        { $set: {
          totalPaymentConfirmedCount: totalPaymentConfirmed[0]?.totalPaymentConfirmedCount || 0,
          totalKrwAmount: totalPaymentConfirmed[0]?.totalKrwAmount || 0,
          totalUsdtAmount: totalPaymentConfirmed[0]?.totalUsdtAmount || 0,
          totalPaymentConfirmedClearanceCount: totalPaymentConfirmedClearance[0]?.totalPaymentConfirmedClearanceCount || 0,
          totalKrwAmountClearance: totalPaymentConfirmedClearance[0]?.totalKrwAmountClearance || 0,
          totalUsdtAmountClearance: totalPaymentConfirmedClearance[0]?.totalUsdtAmountClearance || 0,
        } }
      );
      */


      // update agent collection
      const agentCollection = client.db(dbName).collection('agents');



      // update agent collection for clearance
      if (data.privateSale) {
        await agentCollection.updateOne(
          { agentcode: agentcode },
          { $inc: {
            totalPaymentConfirmedClearanceCount: 1,
            totalKrwAmountClearance: paymentAmount,
            totalUsdtAmountClearance: data.usdtAmount || 0,
          } }
        );
      } else {
        await agentCollection.updateOne(
          { agentcode: agentcode },
          { $inc: {
            totalPaymentConfirmedCount: 1,
            totalKrwAmount: paymentAmount,
            totalUsdtAmount: data.usdtAmount || 0,
          } }
        );
      }




    }

    const confirmedOrder = await fetchBuyOrderRealtimeSnapshot(
      collection,
      { _id: new ObjectId(data.orderId + "") },
    );

    await emitBuyOrderStatusRealtimeEvent({
      source: "order.buyOrderConfirmPayment",
      statusFrom: "paymentRequested",
      statusTo: "paymentConfirmed",
      order: confirmedOrder,
      idempotencyParts: [
        String(data.orderId),
        String(data.queueId || ""),
        String(data.transactionHash || ""),
      ],
    });



      return {
        status: 'paymentConfirmed',
        paymentAmount: paymentAmount,
        queueId: data.queueId,
        transactionHash: data.transactionHash,
        paymentConfirmedAt,
        autoConfirmPayment: autoConfirmPayment,
        paymentConfirmedBy: normalizedPaymentConfirmedBy,
      };

    
  } else {

    console.log('buyOrderConfirmPayment no document updated for orderId: ' + data.orderId);
    
    return null;
  }
  
}





// buyOrderConfirmPaymentEnqueueTransaction
export async function buyOrderConfirmPaymentEnqueueTransaction(data: any) {
  // orderId, queueId
  if (!data.orderId || !data.queueId) {
    return null;
  }

  const client = await clientPromise;
  const collection = client.db(dbName).collection('buyorders');
  const previousOrder = await fetchBuyOrderRealtimeSnapshot(
    collection,
    { _id: new ObjectId(data.orderId + '') },
  );
  const previousStatus = previousOrder?.status ? String(previousOrder.status) : null;
  const previousQueueId =
    previousOrder?.queueId != null ? String(previousOrder.queueId).trim() || null : null;
  const result = await collection.updateOne(
    { _id: new ObjectId(data.orderId+'')},
    { $set: {
      
      queueId: data.queueId,
      // queue update date time
      queueUpdatedAt: new Date().toISOString(),

      status: 'paymentConfirmed',
      paymentConfirmedAt: new Date().toISOString(),
    } }
  );

  if (result.modifiedCount > 0) {
    const updatedOrder = await fetchBuyOrderRealtimeSnapshot(
      collection,
      { _id: new ObjectId(data.orderId + '') },
    );
    if (updatedOrder?.storecode && updatedOrder?.walletAddress) {
      await syncUserBuyOrderStateByWalletAndStorecode({
        client,
        buyOrderCollection: collection,
        storecode: String(updatedOrder.storecode || ""),
        walletAddress: String(updatedOrder.walletAddress || ""),
      });
    }
    const nextStatus =
      updatedOrder?.status ? String(updatedOrder.status) : previousStatus || "paymentConfirmed";
    const nextQueueId =
      updatedOrder?.queueId != null ? String(updatedOrder.queueId).trim() || null : null;

    if (nextStatus === previousStatus && nextQueueId === previousQueueId) {
      return {
        success: result.modifiedCount === 1,
      };
    }

    await emitBuyOrderStatusRealtimeEvent({
      source: "order.buyOrderConfirmPaymentEnqueueTransaction",
      statusFrom: previousStatus,
      statusTo: nextStatus,
      order: updatedOrder,
      idempotencyParts: [String(data.orderId), String(data.queueId || "")],
    });
  }

  return {
    success: result.modifiedCount === 1,
  };
}



// buyOrderConfirmPaymentCompleted
export async function buyOrderConfirmPaymentCompleted(data: any) {
  // queueId, transactionHash
  if (!data.queueId || !data.transactionHash) {
    return null;
  }

  const client = await clientPromise;
  const collection = client.db(dbName).collection('buyorders');
  const previousOrder = await fetchBuyOrderRealtimeSnapshot(
    collection,
    { queueId: data.queueId },
  );
  const previousStatus = previousOrder?.status ? String(previousOrder.status) : null;
  const previousTransactionHash = toNormalizedHash(previousOrder?.transactionHash);



  

  /*
  // find document by queueId
  // insert transactionHash, from, to into transactionHashLog collection
  const existingOrder = await collection.findOne<any>(
    { queueId: data.queueId },
    { projection: { chain: 1, seller: 1, buyer: 1, usdtAmount: 1 } }
  );
  if (!existingOrder) {
    return { success: false };
  }

  const from = existingOrder?.seller;
  const to = existingOrder?.buyer;
  const amount = existingOrder?.usdtAmount || 0;

  const transactionHashLogCollection = client.db(dbName).collection('transactionHashLogs');
  await transactionHashLogCollection.insertOne({
    chain: existingOrder.chain,
    transactionHash: data.transactionHash,
    from: from,
    to: to,
    amount: amount,
    createdAt: new Date().toISOString(),
  });
  */
  





  const result = await collection.updateOne(
    { queueId: data.queueId },
    { $set: {
      transactionHash: data.transactionHash,
      status: 'paymentConfirmed',
      paymentConfirmedAt: new Date().toISOString(),
    } }
  );

  if (result.modifiedCount > 0) {
    const updatedOrder = await fetchBuyOrderRealtimeSnapshot(
      collection,
      { queueId: data.queueId },
    );
    if (updatedOrder?.storecode && updatedOrder?.walletAddress) {
      await syncUserBuyOrderStateByWalletAndStorecode({
        client,
        buyOrderCollection: collection,
        storecode: String(updatedOrder.storecode || ""),
        walletAddress: String(updatedOrder.walletAddress || ""),
      });
    }
    const nextStatus =
      updatedOrder?.status ? String(updatedOrder.status) : previousStatus || "paymentConfirmed";
    const nextTransactionHash = toNormalizedHash(updatedOrder?.transactionHash);

    if (nextStatus === previousStatus && nextTransactionHash === previousTransactionHash) {
      return {
        success: result.modifiedCount === 1,
      };
    }

    await emitBuyOrderStatusRealtimeEvent({
      source: "order.buyOrderConfirmPaymentCompleted",
      statusFrom: previousStatus,
      statusTo: nextStatus,
      order: updatedOrder,
      idempotencyParts: [String(data.queueId || ""), String(data.transactionHash || "")],
    });
  }
  
  return {
    success: result.modifiedCount === 1,
  };

}


// buyOrderConfirmPaymentReverted
export async function buyOrderConfirmPaymentReverted(data: any) {
  // tradeId
  if (!data.tradeId) {
    return null;
  }
  const client = await clientPromise;
  const collection = client.db(dbName).collection('buyorders');
  const result = await collection.updateOne(
    { tradeId: data.tradeId },
    { $set: {
      queueId: null,
    } }
  );
  return {
    success: result.modifiedCount === 1,
  };
}




export async function buyOrderRollbackPayment(data: any) {
  

  if (!data.orderId) {
    return null;
  }

  if (!data.transactionHash) {
    return null;
  }

  const paymentAmount = data.paymentAmount || 0;


  const client = await clientPromise;
  const collection = client.db(dbName).collection('buyorders');
  const previousOrder = await fetchBuyOrderRealtimeSnapshot(
    collection,
    { _id: new ObjectId(data.orderId + '') },
  );
  const previousStatus = previousOrder?.status ? String(previousOrder.status) : null;
  const previousTransactionHash = toNormalizedHash(previousOrder?.transactionHash);


  const result = await collection.updateOne(
    
    { _id: new ObjectId(data.orderId+'') },


    { $set: {
      status: 'cancelled',
      paymentAmount: paymentAmount,
      queueId: data.queueId,
      transactionHash: data.transactionHash,
      cancelledAt: new Date().toISOString(),
      rollbackAmount: paymentAmount,
    } }
  );

  if (result.modifiedCount > 0) {


    const order = await collection.findOne<any>(
      { _id: new ObjectId(data.orderId+'') },
      { projection: { storecode: 1, walletAddress: 1 } }
    );

    if (order) {
      await syncUserBuyOrderStateByWalletAndStorecode({
        client,
        buyOrderCollection: collection,
        storecode: String(order.storecode || ""),
        walletAddress: String(order.walletAddress || ""),
      });
    }


    


    const updated = await collection.findOne<any>(
      { _id: new ObjectId(data.orderId+'') }
    );

    const updatedTransactionHash = toNormalizedHash(updated?.transactionHash);
    if (
      updated &&
      (previousStatus !== 'cancelled' || updatedTransactionHash !== previousTransactionHash)
    ) {
      await emitBuyOrderStatusRealtimeEvent({
        source: "order.buyOrderRollbackPayment",
        statusFrom: previousStatus,
        statusTo: "cancelled",
        order: updated,
        reason: String(data.cancelTradeReason || "payment rollback"),
        idempotencyParts: [
          String(data.orderId),
          String(data.queueId || ""),
          String(data.transactionHash || ""),
        ],
      });
    }

    return updated;
  } else {
    return null;
  }
  
}





// getOrderById
export async function buyOrderGetOrderById(orderId: string): Promise<OrderProps | null> {

  const client = await clientPromise;
  const collection = client.db(dbName).collection('buyorders');

  const result = await collection.findOne<OrderProps>(
    { _id: new ObjectId(orderId) }
  );

  if (result) {
    return result;
  } else {
    return null;
  }

}






// cancel buy order by orderId from seller
export async function cancelTradeBySeller(

  {
    storecode,
    orderId,
    walletAddress,
    cancelTradeReason,
    actor,

    escrowTransactionHash,

  }: {
    storecode: string;
    orderId: string;
    walletAddress: string;
    cancelTradeReason: string;
    actor?: {
      walletAddress?: string | null;
      nickname?: string | null;
      storecode?: string | null;
      role?: string | null;
      publicIp?: string | null;
      signedAt?: string | null;
      matchedBy?: string | null;
    } | null;

    escrowTransactionHash?: string; // optional, if exists, then update escrowTransactionHash
  
  }

) {




  const client = await clientPromise;


  // check validation of storecode
  const storeCollection = client.db(dbName).collection('stores');
  const stores = await storeCollection.findOne<any>(
    {
      storecode: storecode,
    },
  );
  if (!stores) {

    console.log('cancelTradeBySeller storecode is not valid: ' + storecode);

    return null;
  }



  const collection = client.db(dbName).collection('buyorders');

  // check orderId is valid ObjectId
  if (!ObjectId.isValid(orderId)) {
    console.log('cancelTradeBySeller orderId is not valid: ' + orderId);
    return false;
  }

  // check walletAddress is valid

  if (!walletAddress) {
    console.log('cancelTradeBySeller walletAddress is not valid: ' + walletAddress);
    return false;
  }

  const previousOrder = await fetchBuyOrderRealtimeSnapshot(
    collection,
    { _id: new ObjectId(orderId) },
  );
  const previousStatus = previousOrder?.status ? String(previousOrder.status) : null;
  const previousEscrowTransactionHash = toNormalizedHash(previousOrder?.escrowTransactionHash);
  const cancelledAt = new Date().toISOString();
  const normalizedCancelledBy = {
    walletAddress:
      toNullableText(actor?.walletAddress || walletAddress)?.toLowerCase() || null,
    nickname: toNullableText(actor?.nickname),
    storecode: toNullableText(actor?.storecode) || toNullableText(storecode),
    role: toNullableText(actor?.role),
    publicIp: toNullableText(actor?.publicIp),
    signedAt: toNullableText(actor?.signedAt),
    matchedBy: toNullableText(actor?.matchedBy),
    cancelledAt,
  };
  const updateFields: Record<string, unknown> = {
    status: 'cancelled',
    cancelledAt,
    cancelTradeReason: cancelTradeReason,
    cancelledBy: normalizedCancelledBy,
    cancelledByAdmin: normalizedCancelledBy,
    cancelledByName: normalizedCancelledBy.nickname,
    cancelledByWalletAddress: normalizedCancelledBy.walletAddress,
  };

  if (escrowTransactionHash) {
    updateFields.escrowTransactionHash = escrowTransactionHash;
    updateFields.escrowTransactionCancelledAt = cancelledAt;
  }

  // check status is 'accepted' or 'paymentRequested'

  // update status to 'cancelled'

  const result = await collection.updateOne(
    { _id: new ObjectId(orderId),
      ////////'seller.walletAddress': walletAddress,

      //status: 'accepted'
      status: { $in: ['accepted', 'paymentRequested'] },

    },
    { $set: updateFields }
  );

  if (result.modifiedCount > 0) {

    const order = await collection.findOne<any>(
      { _id: new ObjectId(orderId) },
      { projection: { storecode: 1, walletAddress: 1 } }
    );

    if (order) {
      await syncUserBuyOrderStateByWalletAndStorecode({
        client,
        buyOrderCollection: collection,
        storecode: String(order.storecode || ""),
        walletAddress: String(order.walletAddress || ""),
      });
    }



    //console.log('cancelTradeBySeller result: ' + JSON.stringify(result));

    const updated = await collection.findOne<OrderProps>(
      { _id: new ObjectId(orderId) }
    );

    const updatedEscrowTransactionHash = toNormalizedHash(updated?.escrowTransactionHash);
    clearBuyOrderReadCache();
    if (
      updated &&
      (previousStatus !== 'cancelled' ||
        updatedEscrowTransactionHash !== previousEscrowTransactionHash)
    ) {
      await emitBuyOrderStatusRealtimeEvent({
        source: "order.cancelTradeBySeller",
        statusFrom: previousStatus,
        statusTo: "cancelled",
        order: updated,
        reason: cancelTradeReason || null,
        idempotencyParts: [
          String(orderId),
          String(walletAddress || ""),
          String(escrowTransactionHash || ""),
          String(normalizedCancelledBy.walletAddress || ""),
          cancelledAt,
        ],
      });
    }

    return updated;

  } else {
    console.log('cancelTradeBySeller result is null');

    return null;
  }




}



export async function getOneBuyOrderByOrderId(orderId: string): Promise<OrderProps | null> {
  const client = await clientPromise;
  const collection = client.db(dbName).collection('buyorders');

  if (!ObjectId.isValid(orderId)) {
    return null;
  }

  const result = await collection.findOne<OrderProps>(
    { _id: new ObjectId(orderId) }
  );
  if (result) {
    return result;
  } else {
    return null;
  }
}




export async function getOneBuyOrder(

  {
    orderId,
    limit,
    page,
  }: {
    orderId: string;
    limit: number;
    page: number;
  
  }

): Promise<ResultProps> {

  const client = await clientPromise;
  const collection = client.db(dbName).collection('buyorders');


  // status is not 'paymentConfirmed'

  // check orderId is valid ObjectId


  if (!ObjectId.isValid(orderId)) {
    return {
      totalCount: 0,
      orders: [],
    };
  }




  const results = await collection.find<OrderProps>(
    {

      _id: new ObjectId(orderId),

      //status: 'ordered',

      ///status: { $ne: 'paymentConfirmed' },

      // exclude private sale
      //privateSale: { $ne: true },
    },
    
    //{ projection: { _id: 0, emailVerified: 0 } }

  ).sort({ createdAt: -1 }).limit(limit).skip((page - 1) * limit).toArray();



  return {
    totalCount: results.length,
    orders: results,
  };

}



// getOneBuyOrderByTradeId
export async function getOneBuyOrderByTradeId(
  {
    tradeId,
  }: {
    tradeId: string;
  }
): Promise<any | null> {
  const client = await clientPromise;
  const collection = client.db(dbName).collection('buyorders');
  const result = await collection.findOne<OrderProps>(
    {
      tradeId: tradeId,
    }
  );
  if (result) {
    return result;
  } else {
    return null;
  }
}

export async function getBlockedBuyOrderHistory({
  tradeId,
  orderId,
  limit = 8,
}: {
  tradeId?: string | null;
  orderId?: string | null;
  limit?: number;
}): Promise<BlockedBuyOrderHistoryResult> {
  const client = await clientPromise;
  const collection = client.db(dbName).collection("buyorders");

  const normalizedTradeId = toNullableText(tradeId);
  const normalizedOrderId = toNullableText(orderId);
  const safeLimit = Math.min(Math.max(Number(limit) || 8, 1), 20);

  const currentOrder = normalizedTradeId
    ? await getOneBuyOrderByTradeId({ tradeId: normalizedTradeId })
    : normalizedOrderId
      ? await getOneBuyOrderByOrderId(normalizedOrderId)
      : null;

  if (!currentOrder) {
    return {
      anchorTradeId: normalizedTradeId,
      anchorOrderId: normalizedOrderId,
      anchorCreatedAt: null,
      storecode: null,
      matchType: "none",
      matchValue: null,
      totalCount: 0,
      paymentConfirmedCount: 0,
      cancelledCount: 0,
      activeCount: 0,
      orders: [],
    };
  }

  const currentOrderId =
    currentOrder?._id instanceof ObjectId
      ? currentOrder._id
      : toNullableText(currentOrder?._id) && ObjectId.isValid(String(currentOrder._id))
        ? new ObjectId(String(currentOrder._id))
        : null;
  const storecode = toNullableText(currentOrder?.storecode);
  const anchorCreatedAt =
    currentOrder?.createdAt instanceof Date
      ? currentOrder.createdAt
      : currentOrder?.createdAt
        ? new Date(currentOrder.createdAt)
        : null;

  const normalizedWallet = normalizeWalletAddress(
    currentOrder?.walletAddress || currentOrder?.buyer?.walletAddress || "",
  );
  const buyerDepositName = toNullableText(
    currentOrder?.buyer?.depositName
      || currentOrder?.buyer?.bankInfo?.accountHolder
      || null,
  );

  const identityFilters: Record<string, unknown>[] = [];
  let matchType: BlockedBuyOrderHistoryResult["matchType"] = "none";
  let matchValue: string | null = null;

  if (normalizedWallet) {
    const walletRegex = {
      $regex: `^${escapeRegex(normalizedWallet)}$`,
      $options: "i" as const,
    };
    identityFilters.push(
      { walletAddress: walletRegex },
      { "buyer.walletAddress": walletRegex },
    );
    matchType = "walletAddress";
    matchValue = normalizedWallet;
  } else if (buyerDepositName) {
    const depositNameRegex = {
      $regex: `^${escapeRegex(buyerDepositName)}$`,
      $options: "i" as const,
    };
    identityFilters.push(
      { "buyer.depositName": depositNameRegex },
      { "buyer.bankInfo.accountHolder": depositNameRegex },
    );
    matchType = "depositName";
    matchValue = buyerDepositName;
  }

  if (!storecode || identityFilters.length === 0) {
    return {
      anchorTradeId: toNullableText(currentOrder?.tradeId),
      anchorOrderId: currentOrderId?.toHexString() || toNullableText(currentOrder?._id),
      anchorCreatedAt: anchorCreatedAt && !Number.isNaN(anchorCreatedAt.getTime())
        ? anchorCreatedAt.toISOString()
        : null,
      storecode,
      matchType,
      matchValue,
      totalCount: 0,
      paymentConfirmedCount: 0,
      cancelledCount: 0,
      activeCount: 0,
      orders: [],
    };
  }

  const query: Record<string, unknown>[] = [
    { storecode },
    { $or: identityFilters },
  ];

  if (currentOrderId) {
    query.push({ _id: { $ne: currentOrderId } });
  }

  if (anchorCreatedAt && !Number.isNaN(anchorCreatedAt.getTime())) {
    query.push({ createdAt: { $lt: anchorCreatedAt } });
  }

  const matchQuery = query.length > 1 ? { $and: query } : query[0] || {};

  const [orders, statusCounts, totalCount] = await Promise.all([
    collection.find(
      matchQuery,
      {
        projection: {
          _id: 1,
          tradeId: 1,
          status: 1,
          settlement: 1,
          usdtAmount: 1,
          krwAmount: 1,
          createdAt: 1,
          paymentRequestedAt: 1,
          paymentConfirmedAt: 1,
          nickname: 1,
          buyer: 1,
          seller: 1,
        },
      },
    )
      .sort({ createdAt: -1, _id: -1 })
      .limit(safeLimit)
      .toArray(),
    collection.aggregate<{ _id: string | null; count: number }>([
      { $match: matchQuery as any },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]).toArray(),
    collection.countDocuments(matchQuery),
  ]);

  let paymentConfirmedCount = 0;
  let cancelledCount = 0;
  let activeCount = 0;

  for (const row of statusCounts) {
    const status = String(row?._id || "").trim().toLowerCase();
    const count = Number(row?.count || 0);

    if (status === "paymentconfirmed" || status === "paymentsettled") {
      paymentConfirmedCount += count;
    } else if (status === "cancelled") {
      cancelledCount += count;
    } else if (status === "ordered" || status === "accepted" || status === "paymentrequested") {
      activeCount += count;
    }
  }

  return {
    anchorTradeId: toNullableText(currentOrder?.tradeId),
    anchorOrderId: currentOrderId?.toHexString() || toNullableText(currentOrder?._id),
    anchorCreatedAt: anchorCreatedAt && !Number.isNaN(anchorCreatedAt.getTime())
      ? anchorCreatedAt.toISOString()
      : null,
    storecode,
    matchType,
    matchValue,
    totalCount,
    paymentConfirmedCount,
    cancelledCount,
    activeCount,
    orders: orders.map((order: any) => ({
      orderId:
        order?._id instanceof ObjectId
          ? order._id.toHexString()
          : toNullableText(order?._id),
      tradeId: toNullableText(order?.tradeId),
      status: toNullableText(order?.status),
      settlementStatus: toNullableText(order?.settlement?.status),
      amountUsdt: toSafeNumber(order?.usdtAmount),
      amountKrw: toSafeNumber(order?.krwAmount),
      createdAt:
        order?.createdAt instanceof Date
          ? order.createdAt.toISOString()
          : toNullableText(order?.createdAt),
      paymentRequestedAt:
        order?.paymentRequestedAt instanceof Date
          ? order.paymentRequestedAt.toISOString()
          : toNullableText(order?.paymentRequestedAt),
      paymentConfirmedAt:
        order?.paymentConfirmedAt instanceof Date
          ? order.paymentConfirmedAt.toISOString()
          : toNullableText(order?.paymentConfirmedAt),
      buyerNickname: toNullableText(order?.nickname || order?.buyer?.nickname),
      buyerDepositName: toNullableText(order?.buyer?.depositName),
      sellerNickname: toNullableText(order?.seller?.nickname),
    })),
  };
}







// getOneBuyOrderByNicknameAndStorecode
// status is "ordered" or "accepted" or "paymentRequested"
export async function getOneBuyOrderByNicknameAndStorecode(
  {
    nickname,
    storecode,
  }: {
    nickname: string;
    storecode: string;
  }
): Promise<OrderProps | null> {
  const client = await clientPromise;
  const collection = client.db(dbName).collection('buyorders');
  const result = await collection.findOne<OrderProps>(
    {
      nickname: nickname,
      storecode: storecode,
      status: { $in: ['ordered', 'accepted', 'paymentRequested'] },
    }
  );
  if (result) {
    return result;
  } else {
    return null;
  }
}




// updateBuyOrderByQueueId
export async function updateBuyOrderByQueueId(data: any) {

  console.log('updateBuyOrderByQueueId data: ' + JSON.stringify(data));

  if (!data.queueId || !data.transactionHash || !data.minedAt) {
    return null;
  }

  const client = await clientPromise;
  const collection = client.db(dbName).collection('buyorders');
  const query =
    data.orderId && ObjectId.isValid(String(data.orderId))
      ? { _id: new ObjectId(String(data.orderId)), queueId: data.queueId }
      : { queueId: data.queueId };

  const previousOrder = await fetchBuyOrderRealtimeSnapshot(collection, query);
  const previousStatus = previousOrder?.status ? String(previousOrder.status) : null;
  const previousTransactionHash = toNormalizedHash(previousOrder?.transactionHash);

  const result = await collection.updateOne(
    query,
    { $set: {
      transactionHash: data.transactionHash,
      minedAt: data.minedAt,
    } }
  );

  if (result.modifiedCount > 0) {
    const updatedOrder = await fetchBuyOrderRealtimeSnapshot(collection, query);
    if (updatedOrder?.storecode && updatedOrder?.walletAddress) {
      await syncUserBuyOrderStateByWalletAndStorecode({
        client,
        buyOrderCollection: collection,
        storecode: String(updatedOrder.storecode || ""),
        walletAddress: String(updatedOrder.walletAddress || ""),
      });
    }
    const nextStatus =
      updatedOrder?.status ? String(updatedOrder.status) : previousStatus || "paymentConfirmed";
    const nextTransactionHash = toNormalizedHash(updatedOrder?.transactionHash);

    if (updatedOrder && nextTransactionHash !== previousTransactionHash) {
      await emitBuyOrderStatusRealtimeEvent({
        source: "order.updateBuyOrderByQueueId",
        statusFrom: previousStatus,
        statusTo: nextStatus,
        order: updatedOrder,
        idempotencyParts: [
          String(data.orderId || ""),
          String(data.queueId || ""),
          String(data.transactionHash || ""),
          String(data.minedAt || ""),
        ],
      });
    }

    return true;
  } else {
    return false;
  }

}





// getAllBuyOrdersBySeller
// sum of krwAmount
export async function getAllBuyOrdersBySeller(

  {
    limit,
    page,
    startDate, // 2025-04-01
    endDate,   // 2025-04-30
    walletAddress,
  }: {
    limit: number;
    page: number;
    startDate: string;
    endDate: string;
    walletAddress: string;
  }

): Promise<any> {

  //console.log('getAllBuyOrdersBySeller limit: ' + limit);
  //console.log('getAllBuyOrdersBySeller page: ' + page);
  //console.log('getAllBuyOrdersBySeller startDate: ' + startDate);
  //console.log('getAllBuyOrdersBySeller endDate: ' + endDate);
  //console.log('getAllBuyOrdersBySeller walletAddress: ' + walletAddress);


  // convert 2025-04-01 to 2025-04-30T07:55:42.346Z

  const startDateTime = new Date(startDate).toISOString();
  const endDateTime = new Date(endDate).toISOString();



  //console.log('getAllBuyOrdersBySeller startDateTime: ' + startDateTime);
  //console.log('getAllBuyOrdersBySeller endDateTime: ' + endDateTime);

  const client = await clientPromise;
  const collection = client.db(dbName).collection('buyorders');


  const results = await collection.find<OrderProps>(

    //{ walletAddress: walletAddress, status: status },

    {

      privateSale: { $ne: true },

      'seller.walletAddress': walletAddress,

      status: 'paymentConfirmed',

      ////paymentConfirmedAt: { $gte: startDate, $lt: endDate },
      
      //paymentConfirmedAt: { $gte: startDateTime, $lt: endDateTime },

      



    },


  )
  .sort({ paymentConfirmedAt: -1 })
  .limit(limit).skip((page - 1) * limit).toArray();

  // get total count of orders
  const totalCount = await collection.countDocuments(
    {

      privateSale: { $ne: true },

      'seller.walletAddress': walletAddress,
      status: 'paymentConfirmed',

      //paymentConfirmedAt: { $gte: startDate, $lt: endDate },

    }
  );

  console.log('getAllBuyOrdersBySeller totalCount: ' + totalCount);

  // sum of krwAmount
  // TypeError: Cannot read properties of undefined (reading 'totalKrwAmount')

  const totalKrwAmount = await collection.aggregate([
    {
      $match: {

        privateSale: { $ne: true },

        'seller.walletAddress': walletAddress,
        status: 'paymentConfirmed',

        //paymentConfirmedAt: { $gte: startDate, $lt: endDate },

      }
    },
    {
      $group: {
        _id: null,
        totalKrwAmount: { $sum: '$krwAmount' },
      }
    }
  ]).toArray();

  const totalUsdtAmount = await collection.aggregate([
    {
      $match: {

        privateSale: { $ne: true },

        'seller.walletAddress': walletAddress,
        status: 'paymentConfirmed',
        //paymentConfirmedAt: { $gte: startDate, $lt: endDate },
      }
    },
    {
      $group: {
        _id: null,
        totalUsdtAmount: { $sum: '$usdtAmount' },
      }
    }
  ]).toArray();


  return {
    totalCount: totalCount,
    totalKrwAmount: totalKrwAmount ? totalKrwAmount[0]?.totalKrwAmount : 0,
    totalUsdtAmount: totalUsdtAmount ? totalUsdtAmount[0]?.totalUsdtAmount : 0,
    orders: results,
  };

}


// getAllBuyOrdersBySellerAccountNumber
export async function getAllBuyOrdersBySellerAccountNumber(
  {
    limit,
    page,
    fromDate,
    toDate,
    privateSale,
    accountNumber,

    searchBuyer,
    searchDepositName,
  }: {
    limit: number;
    page: number;
    fromDate: string;
    toDate: string;
    privateSale: boolean;
    accountNumber: string;

    searchBuyer?: string;
    searchDepositName?: string;
  }
): Promise<any> {


  console.log('getAllBuyOrdersBySellerAccountNumber searchBuyer: ' + searchBuyer);
  console.log('getAllBuyOrdersBySellerAccountNumber searchDepositName: ' + searchDepositName);

  const client = await clientPromise;
  const collection = client.db(dbName).collection('buyorders');
  const results = await collection.find<OrderProps>(
    {
      
      'seller.bankInfo.accountNumber': accountNumber,
      // if seller.bankInfo.accountNumber has spaces, remove spaces before compare
      //'seller.bankInfo.accountNumber': {
      //  $replaceAll: { input: '$seller.bankInfo.accountNumber', find: ' ', replacement: '' } , $eq: accountNumber
      //},

      //'buyer.nickname': searchBuyer ? { $regex: searchBuyer, $options: 'i' } : { $exists: true },
      //'buyer.depositName': searchDepositName ? { $regex: searchDepositName, $options: 'i' } : { $exists: true },


      /*
              ...(searchDepositName ? {
          $or: [{ "buyer.depositName": { $regex: String(searchDepositName), $options: 'i' } },
            { 'seller.bankInfo.accountHolder': { $regex: String(searchDepositName), $options: 'i' }
          }] } : {}),
      */

      ...(searchBuyer ? { 'buyer.nickname': { $regex: String(searchBuyer), $options: 'i' } } : {}),
      ...(searchDepositName ? { 'buyer.depositName': { $regex: String(searchDepositName), $options: 'i' } } : {}),





      status: 'paymentConfirmed',
      
      //privateSale: privateSale,

      paymentConfirmedAt: { $gte: fromDate, $lt: toDate },
    }
  ).sort({ paymentConfirmedAt: -1 })
    .limit(limit).skip((page - 1) * limit).toArray();
  // get total count of orders
  const totalCount = await collection.countDocuments(
    {
      'seller.bankInfo.accountNumber': accountNumber,
      // if seller.bankInfo.accountNumber has spaces, remove spaces before compare
      //'seller.bankInfo.accountNumber': {
      //  $replaceAll: { input: '$seller.bankInfo.accountNumber', find: ' ', replacement: '' } , $eq: accountNumber
      //},

      //'buyer.nickname': searchBuyer ? { $regex: searchBuyer, $options: 'i' } : { $exists: true },
      //'buyer.depositName': searchDepositName ? { $regex: searchDepositName, $options: 'i' } : { $exists: true },

      ...(searchBuyer ? { 'buyer.nickname': { $regex: String(searchBuyer), $options: 'i' } } : {}),
      ...(searchDepositName ? { 'buyer.depositName': { $regex: String(searchDepositName), $options: 'i' } } : {}),


      status: 'paymentConfirmed',
      
      //privateSale: privateSale,

      paymentConfirmedAt: { $gte: fromDate, $lt: toDate },
    }
  );
  return {
    totalCount: totalCount,
    orders: results,
  };


}





/*
김명실 농협 22105556021573
맞춤 0102400173229
맞춤 0109964859919
*/
// 22105556021573 or 0102400173229 or 0109964859919


// getAllBuyOrdersBySellerAccountNumber
export async function getAllBuyOrdersBySellerAccountNumberTemp(
  {
    limit,
    page,
    fromDate,
    toDate,
    privateSale,
    accountNumber,

    searchBuyer,
    searchDepositName,
  }: {
    limit: number;
    page: number;
    fromDate: string;
    toDate: string;
    privateSale: boolean;
    accountNumber: string;

    searchBuyer?: string;
    searchDepositName?: string;
  }
): Promise<any> {


  console.log('getAllBuyOrdersBySellerAccountNumber searchBuyer: ' + searchBuyer);
  console.log('getAllBuyOrdersBySellerAccountNumber searchDepositName: ' + searchDepositName);

  const client = await clientPromise;
  const collection = client.db(dbName).collection('buyorders');
  const results = await collection.find<OrderProps>(
    {
      
      //'seller.bankInfo.accountNumber': accountNumber,
      $or: [
        { 'seller.bankInfo.accountNumber': accountNumber },
        { 'seller.bankInfo.accountNumber': '0102400173229' },
        { 'seller.bankInfo.accountNumber': '0109964859919' },
      ],



      // if seller.bankInfo.accountNumber has spaces, remove spaces before compare
      //'seller.bankInfo.accountNumber': {
      //  $replaceAll: { input: '$seller.bankInfo.accountNumber', find: ' ', replacement: '' } , $eq: accountNumber
      //},

      //'buyer.nickname': searchBuyer ? { $regex: searchBuyer, $options: 'i' } : { $exists: true },
      //'buyer.depositName': searchDepositName ? { $regex: searchDepositName, $options: 'i' } : { $exists: true },


      /*
              ...(searchDepositName ? {
          $or: [{ "buyer.depositName": { $regex: String(searchDepositName), $options: 'i' } },
            { 'seller.bankInfo.accountHolder': { $regex: String(searchDepositName), $options: 'i' }
          }] } : {}),
      */

      ...(searchBuyer ? { 'buyer.nickname': { $regex: String(searchBuyer), $options: 'i' } } : {}),
      ...(searchDepositName ? { 'buyer.depositName': { $regex: String(searchDepositName), $options: 'i' } } : {}),





      status: 'paymentConfirmed',
      
      //privateSale: privateSale,

      paymentConfirmedAt: { $gte: fromDate, $lt: toDate },
    }
  ).sort({ paymentConfirmedAt: -1 })
    .limit(limit).skip((page - 1) * limit).toArray();
  // get total count of orders
  const totalCount = await collection.countDocuments(
    {
      //'seller.bankInfo.accountNumber': accountNumber,
      $or: [
        { 'seller.bankInfo.accountNumber': accountNumber },
        { 'seller.bankInfo.accountNumber': '0102400173229' },
        { 'seller.bankInfo.accountNumber': '0109964859919' },
      ],


      // if seller.bankInfo.accountNumber has spaces, remove spaces before compare
      //'seller.bankInfo.accountNumber': {
      //  $replaceAll: { input: '$seller.bankInfo.accountNumber', find: ' ', replacement: '' } , $eq: accountNumber
      //},

      //'buyer.nickname': searchBuyer ? { $regex: searchBuyer, $options: 'i' } : { $exists: true },
      //'buyer.depositName': searchDepositName ? { $regex: searchDepositName, $options: 'i' } : { $exists: true },

      ...(searchBuyer ? { 'buyer.nickname': { $regex: String(searchBuyer), $options: 'i' } } : {}),
      ...(searchDepositName ? { 'buyer.depositName': { $regex: String(searchDepositName), $options: 'i' } } : {}),


      status: 'paymentConfirmed',
      
      //privateSale: privateSale,

      paymentConfirmedAt: { $gte: fromDate, $lt: toDate },
    }
  );
  return {
    totalCount: totalCount,
    orders: results,
  };


}







/*
최미소 3521659516663 ==> accountNumber
맞춤 3525523607419
*/
// 3521659516663 or 3525523607419


// getAllBuyOrdersBySellerAccountNumber
export async function getAllBuyOrdersBySellerAccountNumberTemp2(
  {
    limit,
    page,
    fromDate,
    toDate,
    privateSale,
    accountNumber,

    searchBuyer,
    searchDepositName,
  }: {
    limit: number;
    page: number;
    fromDate: string;
    toDate: string;
    privateSale: boolean;
    accountNumber: string;

    searchBuyer?: string;
    searchDepositName?: string;
  }
): Promise<any> {


  console.log('getAllBuyOrdersBySellerAccountNumber searchBuyer: ' + searchBuyer);
  console.log('getAllBuyOrdersBySellerAccountNumber searchDepositName: ' + searchDepositName);

  const client = await clientPromise;
  const collection = client.db(dbName).collection('buyorders');
  const results = await collection.find<OrderProps>(
    {
      
      //'seller.bankInfo.accountNumber': accountNumber,
      $or: [
        { 'seller.bankInfo.accountNumber': accountNumber },
        { 'seller.bankInfo.accountNumber': '3525523607419' },
      ],



      // if seller.bankInfo.accountNumber has spaces, remove spaces before compare
      //'seller.bankInfo.accountNumber': {
      //  $replaceAll: { input: '$seller.bankInfo.accountNumber', find: ' ', replacement: '' } , $eq: accountNumber
      //},

      //'buyer.nickname': searchBuyer ? { $regex: searchBuyer, $options: 'i' } : { $exists: true },
      //'buyer.depositName': searchDepositName ? { $regex: searchDepositName, $options: 'i' } : { $exists: true },


      /*
              ...(searchDepositName ? {
          $or: [{ "buyer.depositName": { $regex: String(searchDepositName), $options: 'i' } },
            { 'seller.bankInfo.accountHolder': { $regex: String(searchDepositName), $options: 'i' }
          }] } : {}),
      */

      ...(searchBuyer ? { 'buyer.nickname': { $regex: String(searchBuyer), $options: 'i' } } : {}),
      ...(searchDepositName ? { 'buyer.depositName': { $regex: String(searchDepositName), $options: 'i' } } : {}),





      status: 'paymentConfirmed',
      
      //privateSale: privateSale,

      paymentConfirmedAt: { $gte: fromDate, $lt: toDate },
    }
  ).sort({ paymentConfirmedAt: -1 })
    .limit(limit).skip((page - 1) * limit).toArray();
  // get total count of orders
  const totalCount = await collection.countDocuments(
    {
      //'seller.bankInfo.accountNumber': accountNumber,
      $or: [
        { 'seller.bankInfo.accountNumber': accountNumber },
        { 'seller.bankInfo.accountNumber': '3525523607419' },
      ],


      // if seller.bankInfo.accountNumber has spaces, remove spaces before compare
      //'seller.bankInfo.accountNumber': {
      //  $replaceAll: { input: '$seller.bankInfo.accountNumber', find: ' ', replacement: '' } , $eq: accountNumber
      //},

      //'buyer.nickname': searchBuyer ? { $regex: searchBuyer, $options: 'i' } : { $exists: true },
      //'buyer.depositName': searchDepositName ? { $regex: searchDepositName, $options: 'i' } : { $exists: true },

      ...(searchBuyer ? { 'buyer.nickname': { $regex: String(searchBuyer), $options: 'i' } } : {}),
      ...(searchDepositName ? { 'buyer.depositName': { $regex: String(searchDepositName), $options: 'i' } } : {}),


      status: 'paymentConfirmed',
      
      //privateSale: privateSale,

      paymentConfirmedAt: { $gte: fromDate, $lt: toDate },
    }
  );
  return {
    totalCount: totalCount,
    orders: results,
  };


}







// getAllBuyOrdersByStorecode
export async function getAllBuyOrdersByStorecodePrivateSale(
  {
    limit,
    page,
    fromDate,
    toDate,
    //privateSale,
    storecode,

    buyerBankInfoAccountNumber,

    searchBuyer,
    searchDepositName,
  }: {
    limit: number;
    page: number;
    fromDate: string;
    toDate: string;
    //privateSale: boolean;
    storecode: string;

    buyerBankInfoAccountNumber?: string;

    searchBuyer?: string;
    searchDepositName?: string;
  }
): Promise<any> {
  const client = await clientPromise;
  const collection = client.db(dbName).collection('buyorders');
  const results = await collection.find<OrderProps>(
    {
      storecode: storecode,
      status: 'paymentConfirmed',
      
      //privateSale: true,

      ...(buyerBankInfoAccountNumber ? { 'buyer.bankInfo.accountNumber': buyerBankInfoAccountNumber } : {}),

      paymentConfirmedAt: { $gte: fromDate, $lt: toDate },
      ...(searchBuyer ? { 'buyer.nickname': { $regex: String(searchBuyer), $options: 'i' } } : {}),
      ...(searchDepositName ? { 'buyer.depositName': { $regex: String(searchDepositName), $options: 'i' } } : {}),
    }
  
  )
    //.sort({ paymentConfirmedAt: -1 })
    //.sort({ createdAt: -1 })
    .sort({ _id: -1 })

    .limit(limit).skip((page - 1) * limit).toArray();
  // get total count of orders
  const totalCount = await collection.countDocuments(
    {
      storecode: storecode,
      status: 'paymentConfirmed',
      
      //privateSale: true,

      ...(buyerBankInfoAccountNumber ? { 'buyer.bankInfo.accountNumber': buyerBankInfoAccountNumber } : {}),

      paymentConfirmedAt: { $gte: fromDate, $lt: toDate },
      ...(searchBuyer ? { 'buyer.nickname': { $regex: String(searchBuyer), $options: 'i' } } : {}),
      ...(searchDepositName ? { 'buyer.depositName': { $regex: String(searchDepositName), $options: 'i' } } : {}),
    }
  );
  return {
    totalCount: totalCount,
    orders: results,
  };
}





// getDailyBuyOrder
export async function getDailyBuyOrder(
  
  {
    startDate,
    endDate,
  }: {
    startDate: string;
    endDate: string;
  }

): Promise<any> {

  //console.log('getDailyBuyOrder startDate: ' + startDate);
  //console.log('getDailyBuyOrder endDate: ' + endDate);
  /*
  getDailyBuyOrder startDate: 2025-03-01
  getDailyBuyOrder endDate: 2025-03-13

  
  */

  const client = await clientPromise;
  const collection = client.db(dbName).collection('buyorders');




  // distinct count of walletAddress by day
  // sum of krwAmount by day
  // sum of usdtAmount by day
  // count of trades by day


  const results = await collection.aggregate([

    {
      $match: {
        status: 'paymentConfirmed',

        ///paymentConfirmedAt: { $gte: startDate, $lt: endDate },


      }
    },
    {
      $group: {
        
        //_id: { $dateToString: { format: '%Y-%m-%d', date: { $toDate: '$paymentConfirmedAt' } } },

        // convert date to korea time
        // +9 hours

        _id: { $dateToString: { format: '%Y-%m-%d', date: { $add: [ { $toDate: '$paymentConfirmedAt' }, 9 * 60 * 60 * 1000 ] } } },
     
        
        totalKrwAmount: { $sum: '$krwAmount' },
        totalUsdtAmount: { $sum: '$usdtAmount' },
        trades: { $sum: 1 },

      }
    },



    // order by date desc
    { $sort: { _id: -1 } },
  ]).toArray();



  return results;

}



// getDailyKrwAmountBySeller
export async function getDailyBuyOrderBySeller(
  
  {
    startDate,
    endDate,
    walletAddress,
  }: {
    startDate: string;
    endDate: string;
    walletAddress: string;
  }

): Promise<any> {

  console.log('getDailyKrwAmountBySeller startDate: ' + startDate);
  console.log('getDailyKrwAmountBySeller endDate: ' + endDate);
  /*
  getDailyKrwAmountBySeller startDate: 2025-03-01
  getDailyKrwAmountBySeller endDate: 2025-03-13
  */

  const client = await clientPromise;
  const collection = client.db(dbName).collection('buyorders');

  // sum of krwAmount by day
  /*
  const results = await collection.aggregate([
    {
      $match: {
        'seller.walletAddress': walletAddress,
        status: 'paymentConfirmed',
        paymentConfirmedAt: { $gte: startDate, $lt: endDate },
      }
    },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$paymentConfirmedAt' } },
        totalKrwAmount: { $sum: '$krwAmount' },
      }
    }
  ]).toArray();
  */
  /*
      errmsg: "PlanExecutor error during aggregation :: caused by :: $dateToString parameter 'date' must be coercible to date",
    code: 4997901,
    */

  // count of distinct walletAddress by day

  const results = await collection.aggregate([
    {
      $match: {
        'seller.walletAddress': walletAddress,
        status: 'paymentConfirmed',
        paymentConfirmedAt: { $gte: startDate, $lt: endDate },
      }
    },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: { $toDate: '$paymentConfirmedAt' } } },
        totalKrwAmount: { $sum: '$krwAmount' },
        totalUsdtAmount: { $sum: '$usdtAmount' },
        trades: { $sum: 1 },
      }
    },
    // order by date desc
    { $sort: { _id: -1 } },
  ]).toArray();



  return results;

}



// getAllBuyOrdersByStorecode
export async function getAllBuyOrdersByStorecode(
  {
    limit,
    page,
    startDate,
    endDate,
    storecode,
  }: {
    limit: number;
    page: number;
    startDate: string;
    endDate: string;
    storecode: string;
  }
): Promise<any> {

  if (!startDate) {
    startDate = new Date(0).toISOString();
  }
  if (!endDate) {
    endDate = new Date().toISOString();
  }


  //console.log('getAllBuyOrdersByStorecode startDate: ' + startDate);
  //console.log('getAllBuyOrdersByStorecode endDate: ' + endDate);



  const client = await clientPromise;
  const collection = client.db(dbName).collection('buyorders');
  const results = await collection.find<OrderProps>(
    {
      storecode: storecode,
      //status: 'paymentConfirmed',
      status: { $in: ['ordered', 'accepted', 'paymentRequested', ] },
      //paymentConfirmedAt: { $gte: startDate, $lt: endDate },

      privateSale: { $ne: true }, // exclude private sale
    },
  )
    .sort({ paymentConfirmedAt: -1 })
    .limit(limit).skip((page - 1) * limit).toArray();


  //console.log('getAllBuyOrdersByStorecode results: ' + JSON.stringify(results));

  // get total count of orders
  const totalCount = await collection.countDocuments(
    {
      storecode: storecode,
      status: { $in: ['ordered', 'accepted', 'paymentRequested', ] },
      //paymentConfirmedAt: { $gte: startDate, $lt: endDate },

      privateSale: { $ne: true }, // exclude private sale
    }
  );
  //console.log('getAllBuyOrdersByStorecode totalCount: ' + totalCount);

  // sum of krwAmount
  const totalKrwAmount = await collection.aggregate([
    {
      $match: {
        storecode: storecode,
        status: { $in: ['ordered', 'accepted', 'paymentRequested', ] },
        //paymentConfirmedAt: { $gte: startDate, $lt: endDate },

        privateSale: { $ne: true }, // exclude private sale
      }
    },
    {
      $group: {
        _id: null,
        totalKrwAmount: { $sum: '$krwAmount' },
      }
    }
  ]).toArray();

  // sum of usdtAmount
  const totalUsdtAmount = await collection.aggregate([
    {
      $match: {
        storecode: storecode,
        status: { $in: ['ordered', 'accepted', 'paymentRequested', ] },
        //paymentConfirmedAt: { $gte: startDate, $lt: endDate },

        privateSale: { $ne: true }, // exclude private sale
      }
    },
    {
      $group: {
        _id: null,
        totalUsdtAmount: { $sum: '$usdtAmount' },
      }
    }
  ]).toArray();


  return {
    totalCount: totalCount,
    totalKrwAmount: totalKrwAmount ? totalKrwAmount[0]?.totalKrwAmount : 0,
    totalUsdtAmount: totalUsdtAmount ? totalUsdtAmount[0]?.totalUsdtAmount : 0,
    orders: results,
  };
}







// getAllTradesByAdmin
// sum of krwAmount
export async function getAllTradesByAdmin(

  {
    limit,
    page,
    
    //startDate,
    //endDate,
    
    agentcode,
    searchNickname,
    walletAddress,
    storecode,
    searchOrderStatusCompleted,
    searchBuyer,
    searchDepositName,
    searchStoreBankAccountNumber,
    privateSale,

    fromDate, // 2025-04-01
    toDate,   // 2025-04-30
  }: {
    limit: number;
    page: number;

    //startDate: string;
    //endDate: string;

    agentcode: string,
    searchNickname: string,
    walletAddress: string;
    storecode: string;
    searchOrderStatusCompleted: boolean;
    searchBuyer: string;
    searchDepositName: string;
    searchStoreBankAccountNumber: string;
    privateSale: boolean;

    fromDate?: string; // 2025-04-01
    toDate?: string;   // 2025-04-30

  }

): Promise<any> {
  const fromDateValue = fromDate
    ? new Date(fromDate + 'T00:00:00+09:00').toISOString()
    : '1970-01-01T00:00:00Z';
  const toDateValue = toDate
    ? new Date(toDate + 'T23:59:59+09:00').toISOString()
    : new Date().toISOString();

  const safeLimit = Math.max(1, Number(limit || 0) || 1);
  const safePage = Math.max(1, Number(page || 0) || 1);
  const skip = (safePage - 1) * safeLimit;

  const safeAgentcode = normalizeSearchText(agentcode);
  const safeStorecode = normalizeSearchText(storecode);
  const safeSearchBuyer = normalizeSearchText(searchBuyer);
  const safeSearchDepositName = normalizeSearchText(searchDepositName);
  const safeSearchStoreBankAccountNumber = normalizeSearchText(searchStoreBankAccountNumber);

  const client = await clientPromise;
  const collection = client.db(dbName).collection('buyorders');
  await ensureBuyOrderReadIndexes(collection);

  const cacheKey = `getAllTradesByAdmin:${JSON.stringify({
    limit: safeLimit,
    page: safePage,
    privateSale: Boolean(privateSale),
    agentcode: safeAgentcode,
    storecode: safeStorecode,
    searchBuyer: safeSearchBuyer,
    searchDepositName: safeSearchDepositName,
    searchStoreBankAccountNumber: safeSearchStoreBankAccountNumber,
    fromDate: fromDateValue,
    toDate: toDateValue,
  })}`;
  const cached = getBuyOrderCachedValue(cacheKey);
  if (cached !== undefined) {
    return cached;
  }

  const matchQuery: Record<string, any> = {
    status: 'paymentConfirmed',
    privateSale: Boolean(privateSale),
    createdAt: { $gte: fromDateValue, $lt: toDateValue },
  };

  appendExactFilter(matchQuery, 'agentcode', safeAgentcode);
  appendExactFilter(matchQuery, 'storecode', safeStorecode);
  appendContainsFilter(matchQuery, 'nickname', safeSearchBuyer);
  appendContainsFilter(matchQuery, 'buyer.depositName', safeSearchDepositName);
  appendContainsFilter(matchQuery, 'store.bankInfo.accountNumber', safeSearchStoreBankAccountNumber);

  const [facetResult = {}] = await collection.aggregate([
    { $match: matchQuery },
    {
      $facet: {
        orders: [
          { $sort: { paymentConfirmedAt: -1, createdAt: -1 } },
          { $skip: skip },
          { $limit: safeLimit },
        ],
        summary: [
          {
            $group: {
              _id: null,
              totalCount: { $sum: 1 },
              totalKrwAmount: { $sum: { $ifNull: ['$krwAmount', 0] } },
              totalUsdtAmount: { $sum: { $ifNull: ['$usdtAmount', 0] } },
              totalSettlementCount: {
                $sum: {
                  $cond: [{ $ne: ['$settlement', null] }, 1, 0],
                },
              },
              totalSettlementAmount: { $sum: toDoubleExpr('settlement.settlementAmount') },
              totalSettlementAmountKRW: { $sum: toDoubleExpr('settlement.settlementAmountKRW') },
              totalFeeAmount: { $sum: toDoubleExpr('settlement.feeAmount') },
              totalFeeAmountKRW: { $sum: toDoubleExpr('settlement.feeAmountKRW') },
              totalAgentFeeAmount: { $sum: toDoubleExpr('settlement.agentFeeAmount') },
              totalAgentFeeAmountKRW: { $sum: toDoubleExpr('settlement.agentFeeAmountKRW') },
            },
          },
        ],
      },
    },
  ]).toArray();

  const orders = Array.isArray(facetResult?.orders) ? facetResult.orders : [];
  const summary = facetResult?.summary?.[0] || {};

  const result = {
    totalCount: Number(summary?.totalCount || 0),
    totalKrwAmount: Number(summary?.totalKrwAmount || 0),
    totalUsdtAmount: Number(summary?.totalUsdtAmount || 0),
    totalSettlementCount: Number(summary?.totalSettlementCount || 0),
    totalSettlementAmount: Number(summary?.totalSettlementAmount || 0),
    totalSettlementAmountKRW: Number(summary?.totalSettlementAmountKRW || 0),
    totalFeeAmount: Number(summary?.totalFeeAmount || 0),
    totalFeeAmountKRW: Number(summary?.totalFeeAmountKRW || 0),
    totalAgentFeeAmount: Number(summary?.totalAgentFeeAmount || 0),
    totalAgentFeeAmountKRW: Number(summary?.totalAgentFeeAmountKRW || 0),
    orders,
    trades: orders,
  };

  setBuyOrderCachedValue(cacheKey, result);
  return result;
}











export async function getAdminP2PTradeHistory(
  {
    storecode,
    limit,
    page,
    fromDate,
    toDate,
    searchKeyword,
    searchTradeId,
    searchStoreName,
    searchBuyer,
    searchSeller,
    searchDepositName,
    searchBuyerBankAccountNumber,
    searchSellerBankAccountNumber,
    userType,
  }: {
    storecode?: string;
    limit: number;
    page: number;
    fromDate?: string;
    toDate?: string;
    searchKeyword?: string;
    searchTradeId?: string;
    searchStoreName?: string;
    searchBuyer?: string;
    searchSeller?: string;
    searchDepositName?: string;
    searchBuyerBankAccountNumber?: string;
    searchSellerBankAccountNumber?: string;
    userType?: string;
  }
): Promise<any> {
  const defaultFromDate = new Date();
  defaultFromDate.setDate(defaultFromDate.getDate() - 30);

  const fromDateValue = fromDate
    ? new Date(`${fromDate}T00:00:00+09:00`)
    : defaultFromDate;
  const toDateValue = toDate
    ? new Date(`${toDate}T23:59:59.999+09:00`)
    : new Date();

  const safeLimit = Math.min(Math.max(1, Number(limit || 0) || 1), 200);
  const safePage = Math.max(1, Number(page || 0) || 1);
  const skip = (safePage - 1) * safeLimit;

  const safeStorecode = normalizeSearchText(storecode);
  const safeSearchKeyword = normalizeSearchText(searchKeyword);
  const safeSearchTradeId = normalizeSearchText(searchTradeId);
  const safeSearchStoreName = normalizeSearchText(searchStoreName);
  const safeSearchBuyer = normalizeSearchText(searchBuyer);
  const safeSearchSeller = normalizeSearchText(searchSeller);
  const safeSearchDepositName = normalizeSearchText(searchDepositName);
  const safeSearchBuyerBankAccountNumber = normalizeSearchText(searchBuyerBankAccountNumber);
  const safeSearchSellerBankAccountNumber = normalizeSearchText(searchSellerBankAccountNumber);
  const safeUserType = normalizeSearchText(userType);

  const client = await clientPromise;
  const collection = client.db(dbName).collection("buyorders");
  await ensureBuyOrderReadIndexes(collection);

  const cacheKey = `getAdminP2PTradeHistory:${JSON.stringify({
    storecode: safeStorecode,
    limit: safeLimit,
    page: safePage,
    fromDate: fromDateValue.toISOString(),
    toDate: toDateValue.toISOString(),
    searchKeyword: safeSearchKeyword,
    searchTradeId: safeSearchTradeId,
    searchStoreName: safeSearchStoreName,
    searchBuyer: safeSearchBuyer,
    searchSeller: safeSearchSeller,
    searchDepositName: safeSearchDepositName,
    searchBuyerBankAccountNumber: safeSearchBuyerBankAccountNumber,
    searchSellerBankAccountNumber: safeSearchSellerBankAccountNumber,
    userType: safeUserType,
  })}`;
  const cached = getBuyOrderCachedValue(cacheKey);
  if (cached !== undefined) {
    return cached;
  }

  const pipeline: Record<string, any>[] = [
    {
      $match: {
        status: "paymentConfirmed",
        privateSale: { $ne: true },
        ...(safeStorecode ? { storecode: safeStorecode } : { storecode: { $ne: null } }),
      },
    },
    {
      $addFields: {
        historyAtDate: {
          $ifNull: [
            {
              $convert: {
                input: "$paymentConfirmedAt",
                to: "date",
                onError: null,
                onNull: null,
              },
            },
            {
              $convert: {
                input: "$createdAt",
                to: "date",
                onError: null,
                onNull: null,
              },
            },
          ],
        },
      },
    },
    {
      $match: {
        historyAtDate: {
          $gte: fromDateValue,
          $lte: toDateValue,
        },
      },
    },
  ];

  if (safeUserType && safeUserType.toLowerCase() !== "all") {
    if (safeUserType === "EMPTY") {
      pipeline.push({
        $match: {
          $or: [
            { userType: { $exists: false } },
            { userType: null },
            { userType: "" },
          ],
        },
      });
    } else {
      pipeline.push({
        $match: {
          userType: safeUserType,
        },
      });
    }
  }

  const keywordRegex = toContainsRegexFilter(safeSearchKeyword);
  if (keywordRegex) {
    pipeline.push({
      $match: {
        $or: [
          { tradeId: keywordRegex },
          { storecode: keywordRegex },
          { "store.storeName": keywordRegex },
          { "store.companyName": keywordRegex },
          { nickname: keywordRegex },
          { "buyer.nickname": keywordRegex },
          { "buyer.depositName": keywordRegex },
          { walletAddress: keywordRegex },
          { "buyer.walletAddress": keywordRegex },
          { "buyer.bankInfo.accountNumber": keywordRegex },
          { "buyer.depositBankAccountNumber": keywordRegex },
          { "seller.nickname": keywordRegex },
          { "seller.walletAddress": keywordRegex },
          { "seller.signerAddress": keywordRegex },
          { "seller.bankInfo.accountHolder": keywordRegex },
          { "seller.bankInfo.accountNumber": keywordRegex },
        ],
      },
    });
  }

  const searchTradeIdRegex = toContainsRegexFilter(safeSearchTradeId);
  if (searchTradeIdRegex) {
    pipeline.push({
      $match: {
        tradeId: searchTradeIdRegex,
      },
    });
  }

  const searchStoreNameRegex = toContainsRegexFilter(safeSearchStoreName);
  if (searchStoreNameRegex) {
    pipeline.push({
      $match: {
        $or: [
          { storecode: searchStoreNameRegex },
          { "store.storeName": searchStoreNameRegex },
          { "store.companyName": searchStoreNameRegex },
        ],
      },
    });
  }

  const searchBuyerRegex = toContainsRegexFilter(safeSearchBuyer);
  if (searchBuyerRegex) {
    pipeline.push({
      $match: {
        $or: [
          { nickname: searchBuyerRegex },
          { "buyer.nickname": searchBuyerRegex },
          { walletAddress: searchBuyerRegex },
          { "buyer.walletAddress": searchBuyerRegex },
        ],
      },
    });
  }

  const searchSellerRegex = toContainsRegexFilter(safeSearchSeller);
  if (searchSellerRegex) {
    pipeline.push({
      $match: {
        $or: [
          { "seller.nickname": searchSellerRegex },
          { "seller.walletAddress": searchSellerRegex },
          { "seller.signerAddress": searchSellerRegex },
          { "seller.bankInfo.accountHolder": searchSellerRegex },
          { "seller.bankInfo.accountNumber": searchSellerRegex },
        ],
      },
    });
  }

  const searchDepositNameRegex = toContainsRegexFilter(safeSearchDepositName);
  if (searchDepositNameRegex) {
    pipeline.push({
      $match: {
        $or: [
          { "buyer.depositName": searchDepositNameRegex },
          { "buyer.bankInfo.accountHolder": searchDepositNameRegex },
        ],
      },
    });
  }

  const searchBuyerBankAccountRegex = toContainsRegexFilter(safeSearchBuyerBankAccountNumber);
  if (searchBuyerBankAccountRegex) {
    pipeline.push({
      $match: {
        $or: [
          { "buyer.bankInfo.accountNumber": searchBuyerBankAccountRegex },
          { "buyer.depositBankAccountNumber": searchBuyerBankAccountRegex },
        ],
      },
    });
  }

  const searchSellerBankAccountRegex = toContainsRegexFilter(safeSearchSellerBankAccountNumber);
  if (searchSellerBankAccountRegex) {
    pipeline.push({
      $match: {
        $or: [
          { "seller.bankInfo.accountNumber": searchSellerBankAccountRegex },
          { "store.bankInfo.accountNumber": searchSellerBankAccountRegex },
        ],
      },
    });
  }

  pipeline.push({
    $facet: {
      orders: [
        { $sort: { historyAtDate: -1, createdAt: -1 } },
        { $skip: skip },
        { $limit: safeLimit },
        { $project: { historyAtDate: 0 } },
      ],
      summary: [
        {
          $group: {
            _id: null,
            totalCount: { $sum: 1 },
            totalKrwAmount: { $sum: { $ifNull: ["$krwAmount", 0] } },
            totalUsdtAmount: { $sum: { $ifNull: ["$usdtAmount", 0] } },
            totalSettlementCount: {
              $sum: {
                $cond: [{ $ne: ["$settlement", null] }, 1, 0],
              },
            },
            totalSettlementAmount: { $sum: toDoubleExpr("settlement.settlementAmount") },
            totalSettlementAmountKRW: { $sum: toDoubleExpr("settlement.settlementAmountKRW") },
            totalFeeAmount: { $sum: toDoubleExpr("settlement.feeAmount") },
            totalFeeAmountKRW: { $sum: toDoubleExpr("settlement.feeAmountKRW") },
            totalAgentFeeAmount: { $sum: toDoubleExpr("settlement.agentFeeAmount") },
            totalAgentFeeAmountKRW: { $sum: toDoubleExpr("settlement.agentFeeAmountKRW") },
          },
        },
      ],
    },
  });

  const [facetResult = {}] = await collection.aggregate(pipeline, {
    maxTimeMS: BUYORDER_QUERY_MAX_TIME_MS,
  }).toArray();

  const orders = Array.isArray(facetResult?.orders) ? facetResult.orders : [];
  const summary = facetResult?.summary?.[0] || {};
  const result = {
    totalCount: Number(summary?.totalCount || 0),
    totalKrwAmount: Number(summary?.totalKrwAmount || 0),
    totalUsdtAmount: Number(summary?.totalUsdtAmount || 0),
    totalSettlementCount: Number(summary?.totalSettlementCount || 0),
    totalSettlementAmount: Number(summary?.totalSettlementAmount || 0),
    totalSettlementAmountKRW: Number(summary?.totalSettlementAmountKRW || 0),
    totalFeeAmount: Number(summary?.totalFeeAmount || 0),
    totalFeeAmountKRW: Number(summary?.totalFeeAmountKRW || 0),
    totalAgentFeeAmount: Number(summary?.totalAgentFeeAmount || 0),
    totalAgentFeeAmountKRW: Number(summary?.totalAgentFeeAmountKRW || 0),
    orders,
    trades: orders,
  };

  setBuyOrderCachedValue(cacheKey, result);
  return result;
}

 // getAllClearancesByAdmin
  // all orders with status 'paymentConfirmed' and privateSale is true
 export async function getAllClearancesByAdmin(

  {
    limit,
    page,
    
    //startDate,
    //endDate,


    agentcode,
    searchNickname,
    walletAddress,
    storecode,
    searchOrderStatusCompleted,
    searchBuyer,
    searchDepositName,
    searchStoreBankAccountNumber,
    //privateSale,

    fromDate,
    toDate,
  }: {
    limit: number;
    page: number;

    //startDate: string;
    //endDate: string;

    agentcode: string,
    searchNickname: string,
    walletAddress: string;
    storecode: string;
    searchOrderStatusCompleted: boolean;
    searchBuyer: string;
    searchDepositName: string;
    searchStoreBankAccountNumber: string;
    //privateSale: boolean;

    fromDate: string,
    toDate: string,
  }

): Promise<any> {
  const fromDateValue = fromDate
    ? new Date(fromDate + 'T00:00:00+09:00').toISOString()
    : '1970-01-01T00:00:00Z';
  const toDateValue = toDate
    ? new Date(toDate + 'T23:59:59+09:00').toISOString()
    : new Date().toISOString();

  const safeLimit = Math.max(1, Number(limit || 0) || 1);
  const safePage = Math.max(1, Number(page || 0) || 1);
  const skip = (safePage - 1) * safeLimit;

  const safeAgentcode = normalizeSearchText(agentcode);
  const safeStorecode = normalizeSearchText(storecode);
  const safeSearchBuyer = normalizeSearchText(searchBuyer);
  const safeSearchDepositName = normalizeSearchText(searchDepositName);
  const safeSearchStoreBankAccountNumber = normalizeSearchText(searchStoreBankAccountNumber);

  const client = await clientPromise;
  const collection = client.db(dbName).collection('buyorders');
  await ensureBuyOrderReadIndexes(collection);

  const cacheKey = `getAllClearancesByAdmin:${JSON.stringify({
    limit: safeLimit,
    page: safePage,
    agentcode: safeAgentcode,
    storecode: safeStorecode,
    searchBuyer: safeSearchBuyer,
    searchDepositName: safeSearchDepositName,
    searchStoreBankAccountNumber: safeSearchStoreBankAccountNumber,
    fromDate: fromDateValue,
    toDate: toDateValue,
  })}`;
  const cached = getBuyOrderCachedValue(cacheKey);
  if (cached !== undefined) {
    return cached;
  }

  const matchQuery: Record<string, any> = {
    status: { $in: ['paymentConfirmed', 'paymentRequested'] },
    privateSale: true,
    createdAt: { $gte: fromDateValue, $lt: toDateValue },
  };

  appendExactFilter(matchQuery, 'agentcode', safeAgentcode);
  appendExactFilter(matchQuery, 'storecode', safeStorecode);
  appendContainsFilter(matchQuery, 'nickname', safeSearchBuyer);
  appendContainsFilter(matchQuery, 'store.bankInfo.accountNumber', safeSearchStoreBankAccountNumber);

  if (safeSearchDepositName) {
    const depositNameFilter = toContainsRegexFilter(safeSearchDepositName);
    if (depositNameFilter) {
      matchQuery.$or = [
        { 'store.bankInfo.accountHolder': depositNameFilter },
        { 'buyer.depositName': depositNameFilter },
      ];
    }
  }

  const [facetResult = {}] = await collection.aggregate([
    { $match: matchQuery },
    {
      $facet: {
        orders: [
          { $sort: { createdAt: -1 } },
          { $skip: skip },
          { $limit: safeLimit },
        ],
        totalCountMeta: [
          { $count: 'value' },
        ],
        paymentConfirmedSummary: [
          { $match: { status: 'paymentConfirmed' } },
          {
            $group: {
              _id: null,
              totalKrwAmount: { $sum: { $ifNull: ['$krwAmount', 0] } },
              totalUsdtAmount: { $sum: { $ifNull: ['$usdtAmount', 0] } },
              totalSettlementCount: {
                $sum: {
                  $cond: [{ $ne: ['$settlement', null] }, 1, 0],
                },
              },
              totalSettlementAmount: { $sum: toDoubleExpr('settlement.settlementAmount') },
              totalSettlementAmountKRW: { $sum: toDoubleExpr('settlement.settlementAmountKRW') },
              totalFeeAmount: { $sum: toDoubleExpr('settlement.feeAmount') },
              totalFeeAmountKRW: { $sum: toDoubleExpr('settlement.feeAmountKRW') },
            },
          },
        ],
      },
    },
  ]).toArray();

  const orders = Array.isArray(facetResult?.orders) ? facetResult.orders : [];
  const totalCount = Number(facetResult?.totalCountMeta?.[0]?.value || 0);
  const summary = facetResult?.paymentConfirmedSummary?.[0] || {};

  const result = {
    totalCount,
    totalKrwAmount: Number(summary?.totalKrwAmount || 0),
    totalUsdtAmount: Number(summary?.totalUsdtAmount || 0),
    totalSettlementCount: Number(summary?.totalSettlementCount || 0),
    totalSettlementAmount: Number(summary?.totalSettlementAmount || 0),
    totalSettlementAmountKRW: Number(summary?.totalSettlementAmountKRW || 0),
    totalFeeAmount: Number(summary?.totalFeeAmount || 0),
    totalFeeAmountKRW: Number(summary?.totalFeeAmountKRW || 0),
    orders,
  };

  setBuyOrderCachedValue(cacheKey, result);
  return result;
}
























// getAllTradesForAgent agentcode
export async function getAllTradesForAgent(
  {
    limit,
    page,
    startDate,
    endDate,
    searchNickname,
    walletAddress,
    agentcode,
    searchOrderStatusCompleted,
    searchBuyer,
    searchDepositName,
    searchStoreBankAccountNumber,
  }: {
    limit: number;
    page: number;
    startDate: string;
    endDate: string;
    searchNickname: string,
    walletAddress: string;
    agentcode: string;
    searchOrderStatusCompleted: boolean;
    searchBuyer: string;
    searchDepositName: string;
    searchStoreBankAccountNumber: string;
  }
): Promise<any> {
  if (!startDate) {
    startDate = new Date(0).toISOString();
  }
  if (!endDate) {
    endDate = new Date().toISOString();
  }
  //console.log('getAllTradesForAgent startDate: ' + startDate);
  //console.log('getAllTradesForAgent endDate: ' + endDate);
  const client = await clientPromise;
  const collection = client.db(dbName).collection('buyorders');
  const results = await collection.find<OrderProps>(
    {
      privateSale: { $ne: true },
      agentcode: { $regex: agentcode, $options: 'i' },
      status: 'paymentConfirmed',
      nickname: { $regex: searchNickname, $options: 'i' },
      'buyer.depositName': { $regex: searchDepositName, $options: 'i' },
      'store.bankInfo.accountNumber': { $regex: searchStoreBankAccountNumber, $options: 'i' },
      //paymentConfirmedAt: { $gte: startDate, $lt: endDate },
    },
  )
    .sort({ paymentConfirmedAt: -1 })
    .limit(limit).skip((page - 1) * limit).toArray();
  // get total count of orders
  const totalCount = await collection.countDocuments(
    {
      privateSale: { $ne: true },
      agentcode: { $regex: agentcode, $options: 'i' },
      status: 'paymentConfirmed',
      nickname: { $regex: searchNickname, $options: 'i' },
      'buyer.depositName': { $regex: searchDepositName, $options: 'i' },
      'store.bankInfo.accountNumber': { $regex: searchStoreBankAccountNumber, $options: 'i' },
      //paymentConfirmedAt: { $gte: startDate, $lt: endDate },
    }
  );
  //console.log('getAllTradesForAgent totalCount: ' + totalCount);
  // sum of krwAmount
  const totalKrwAmount = await collection.aggregate([
    {
      $match: {
        privateSale: { $ne: true },
        agentcode: { $regex: agentcode, $options: 'i' },
        status: 'paymentConfirmed',
        nickname: { $regex: searchNickname, $options: 'i' },
        'buyer.depositName': { $regex: searchDepositName, $options: 'i' },
        'store.bankInfo.accountNumber': { $regex: searchStoreBankAccountNumber, $options: 'i' },
        //paymentConfirmedAt: { $gte: startDate, $lt: endDate },
      }
    },
    {
      $group: {
        _id: null,
        totalKrwAmount: { $sum: '$krwAmount' },
      }
    }
  ]).toArray();
  // sum of usdtAmount
  const totalUsdtAmount = await collection.aggregate([
    {
      $match: {
        privateSale: { $ne: true },
        agentcode: { $regex: agentcode, $options: 'i' },
        status: 'paymentConfirmed',
        nickname: { $regex: searchNickname, $options: 'i' },
        'buyer.depositName': { $regex: searchDepositName, $options: 'i' },
        'store.bankInfo.accountNumber': { $regex: searchStoreBankAccountNumber, $options: 'i' },
        //paymentConfirmedAt: { $gte: startDate, $lt: endDate },
      }
    },
    {
      $group: {
        _id: null,
        totalUsdtAmount: { $sum: '$usdtAmount' },
      }
    }
  ]).toArray();
  const totalSettlementCount = await collection.aggregate([
    {
      $match: {
        privateSale: { $ne: true },
        agentcode: { $regex: agentcode, $options: 'i' },
        status: 'paymentConfirmed',
        nickname: { $regex: searchNickname, $options: 'i' },
        'buyer.depositName': { $regex: searchDepositName, $options: 'i' },
        'store.bankInfo.accountNumber': { $regex: searchStoreBankAccountNumber, $options: 'i' },
        settlement: { $exists: true, $ne: null },
        //paymentConfirmedAt: { $gte: startDate, $lt: endDate },
      }
    },
    {
      $group: {
        _id: null,
        totalSettlementCount: { $sum: 1 },
      }
    }
  ]).toArray();
  // totalSettlementAmount
  const totalSettlementAmount = await collection.aggregate([
    {
      $match: {
        privateSale: { $ne: true },
        agentcode: { $regex: agentcode, $options: 'i' },
        status: 'paymentConfirmed',
        nickname: { $regex: searchNickname, $options: 'i' },
        'buyer.depositName': { $regex: searchDepositName, $options: 'i' },
        'store.bankInfo.accountNumber': { $regex: searchStoreBankAccountNumber, $options: 'i' },
        settlement: { $exists: true, $ne: null },
        //paymentConfirmedAt: { $gte: startDate, $lt: endDate },
      }
    },
    {
      $group: {
        _id: null,
        totalSettlementAmount: { $sum: '$settlement.settlementAmount' },
      }
    }
  ]).toArray();
  // totalSettlementAmountKRW
  const totalSettlementAmountKRW = await collection.aggregate([
    {
      $match: {
        privateSale: { $ne: true },
        agentcode: { $regex: agentcode, $options: 'i' },
        status: 'paymentConfirmed',
        nickname: { $regex: searchNickname, $options: 'i' },
        'buyer.depositName': { $regex: searchDepositName, $options: 'i' },
        'store.bankInfo.accountNumber': { $regex: searchStoreBankAccountNumber, $options: 'i' },
        settlement: { $exists: true, $ne: null },
        //paymentConfirmedAt: { $gte: startDate, $lt: endDate },
      }
    },
    {
      $group: {
        _id: null,
        totalSettlementAmountKRW: { $sum: { $toDouble: '$settlement.settlementAmountKRW' } },
      }
    }
  ]).toArray();
  // total feeAmount
  const totalFeeAmount = await collection.aggregate([
    {
      $match: {
        privateSale: { $ne: true },
        agentcode: { $regex: agentcode, $options: 'i' },
        status: 'paymentConfirmed',
        nickname: { $regex: searchNickname, $options: 'i' },
        'buyer.depositName': { $regex: searchDepositName, $options: 'i' },
        'store.bankInfo.accountNumber': { $regex: searchStoreBankAccountNumber, $options: 'i' },
        settlement: { $exists: true, $ne: null },
        //paymentConfirmedAt: { $gte: startDate, $lt: endDate },
      }
    },
    {
      $group: {
        _id: null,
        //totalFeeAmount: { $sum: '$settlement.feeAmount' },
        totalAgentFeeAmount: { $sum: '$settlement.agentFeeAmount' },
      }
    }
  ]).toArray();
  // total feeAmountKRW
  const totalFeeAmountKRW = await collection.aggregate([
    {
      $match: {
        privateSale: { $ne: true },
        agentcode: { $regex: agentcode, $options: 'i' },
        status: 'paymentConfirmed',
        nickname: { $regex: searchNickname, $options: 'i' },
        'buyer.depositName': { $regex: searchDepositName, $options: 'i' },
        'store.bankInfo.accountNumber': { $regex: searchStoreBankAccountNumber, $options: 'i' },
        settlement: { $exists: true, $ne: null },
        //paymentConfirmedAt: { $gte: startDate, $lt: endDate },
      }
    },
    {
      $group: {
        _id: null,
        //totalFeeAmountKRW: { $sum: { $toDouble: '$settlement.feeAmountKRW' } },
        totalAgentFeeAmountKRW: { $sum: { $toDouble: '$settlement.agentFeeAmountKRW' } },
      }
    }
  ]).toArray();
  //console.log('getAllTradesForAgent totalCount: ' + totalCount);
  return {
    totalCount: totalCount,
    totalKrwAmount: totalKrwAmount ? totalKrwAmount[0]?.totalKrwAmount : 0,
    totalUsdtAmount: totalUsdtAmount ? totalUsdtAmount[0]?.totalUsdtAmount : 0,
    totalSettlementCount: totalSettlementCount ? totalSettlementCount[0]?.totalSettlementCount : 0,
    totalSettlementAmount: totalSettlementAmount ? totalSettlementAmount[0]?.totalSettlementAmount : 0,
    totalSettlementAmountKRW: totalSettlementAmountKRW ? totalSettlementAmountKRW[0]?.totalSettlementAmountKRW : 0,
    totalFeeAmount: totalFeeAmount ? totalFeeAmount[0]?.totalFeeAmount : 0,
    totalFeeAmountKRW: totalFeeAmountKRW ? totalFeeAmountKRW[0]?.totalFeeAmountKRW : 0,
    orders: results,
  };
}


/*
   limit: 5,
    page: 1,
    startDate: "",
    endDate: "",
    searchNickname: "",
    walletAddress: "",
    agentcode: agentcode,
  });
  */
// getAllBuyOrdersForAgent agentcode
export async function getAllBuyOrdersForAgent(
  {
    limit,
    page,
    startDate,
    endDate,

    searchNickname,
    walletAddress,
    agentcode,
  }: {
    limit: number;
    page: number;
    startDate: string;
    endDate: string;
    searchNickname: string,
    walletAddress: string;
    agentcode: string;
  }
): Promise<any> {
  if (!startDate) {
    startDate = new Date(0).toISOString();
  }
  if (!endDate) {
    endDate = new Date().toISOString();
  }
  //console.log('getAllBuyOrdersForAgent startDate: ' + startDate);
  //console.log('getAllBuyOrdersForAgent endDate: ' + endDate);



  console.log('getAllBuyOrdersForAgent agentcode: ' + agentcode);



  const client = await clientPromise;
  const collection = client.db(dbName).collection('buyorders');
  const results = await collection.find<OrderProps>(
    {
      agentcode: { $regex: agentcode, $options: 'i' },

      //status: 'paymentConfirmed',
      status: { $in: ['ordered', 'accepted', 'paymentRequested', ] },
      //paymentConfirmedAt: { $gte: startDate, $lt: endDate },
      nickname: { $regex: searchNickname, $options: 'i' },

      'buyer.walletAddress': { $regex: walletAddress, $options: 'i' },

      'store.bankInfo.accountNumber': { $regex: '', $options: 'i' }, // no search for bank account number

      'buyer.depositName': { $regex: '', $options: 'i' }, // no search for deposit name

    },
  )
    .sort({ paymentConfirmedAt: -1 })
    .limit(limit).skip((page - 1) * limit).toArray();
  
  
  //console.log('getAllBuyOrdersForAgent results: ' + JSON.stringify(results));




  // get total count of orders
  const totalCount = await collection.countDocuments(
    {
      agentcode: { $regex: agentcode, $options: 'i' },
      //status: 'paymentConfirmed',
      status: { $in: ['ordered', 'accepted', 'paymentRequested', ] },
      //paymentConfirmedAt: { $gte: startDate, $lt: endDate },
      nickname: { $regex: searchNickname, $options: 'i' },
      'buyer.walletAddress': { $regex: walletAddress, $options: 'i' },
      'store.bankInfo.accountNumber': { $regex: '', $options: 'i' }, // no search for bank account number
      'buyer.depositName': { $regex: '', $options: 'i' }, // no search for deposit name
    }
  );
  //console.log('getAllBuyOrdersForAgent totalCount: ' + totalCount);
  // sum of krwAmount
  const totalKrwAmount = await collection.aggregate([
    {
      $match: {
        agentcode: { $regex: agentcode, $options: 'i' },
        //status: 'paymentConfirmed',
        status: { $in: ['ordered', 'accepted', 'paymentRequested', ] },
        //paymentConfirmedAt: { $gte: startDate, $lt: endDate },
        nickname: { $regex: searchNickname, $options: 'i' },
        'buyer.walletAddress': { $regex: walletAddress, $options: 'i' },
        'store.bankInfo.accountNumber': { $regex: '', $options: 'i' }, // no search for bank account number
        'buyer.depositName': { $regex: '', $options: 'i' }, // no search for deposit name
      }
    },
    {
      $group: {
        _id: null,
        totalKrwAmount: { $sum: '$krwAmount' },
      }
    }
  ]).toArray();
  // sum of usdtAmount
  const totalUsdtAmount = await collection.aggregate([
    {
      $match: {
        agentcode: { $regex: agentcode, $options: 'i' },
        //status: 'paymentConfirmed',
        status: { $in: ['ordered', 'accepted', 'paymentRequested', ] },
        //paymentConfirmedAt: { $gte: startDate, $lt: endDate },
        nickname: { $regex: searchNickname, $options: 'i' },
        'buyer.walletAddress': { $regex: walletAddress, $options: 'i' },
        'store.bankInfo.accountNumber': { $regex: '', $options: 'i' }, // no search for bank account number
        'buyer.depositName': { $regex: '', $options: 'i' }, // no search for deposit name
      }
    },
    {
      $group: {
        _id: null,
        totalUsdtAmount: { $sum: '$usdtAmount' },
      }
    }
  ]).toArray();
  return {
    totalCount: totalCount,
    totalKrwAmount: totalKrwAmount ? totalKrwAmount[0]?.totalKrwAmount : 0,
    totalUsdtAmount: totalUsdtAmount ? totalUsdtAmount[0]?.totalUsdtAmount : 0,
    orders: results,
  };
}





// getAllTradesByStorecode
export async function getAllTradesByStorecode(
  {
    limit,
    page,
    startDate,
    endDate,
    storecode,
    searchBuyer,
    searchDepositName,
    searchStoreBankAccountNumber,

  }: {
    limit: number;
    page: number;
    startDate: string;
    endDate: string;
    storecode: string;
    searchBuyer: string;
    searchDepositName: string;
    searchStoreBankAccountNumber: string;
  }
): Promise<any> {
  if (!startDate) {
    startDate = new Date(0).toISOString();
  }
  if (!endDate) {
    endDate = new Date().toISOString();
  }
  //console.log('getAllTradesByStorecode startDate: ' + startDate);
  //console.log('getAllTradesByStorecode endDate: ' + endDate);
  const client = await clientPromise;
  const collection = client.db(dbName).collection('buyorders');






    /*
        status: 'paymentConfirmed',

      privateSale: { $ne: true },

      //storecode: storecode,
      storecode: { $regex: storecode, $options: 'i' },

      nickname: { $regex: searchBuyer, $options: 'i' },

      'buyer.depositName': { $regex: searchDepositName, $options: 'i' },

      'store.bankInfo.accountNumber': { $regex: searchStoreBankAccountNumber, $options: 'i' },

      */


  const results = await collection.find<OrderProps>(
    {

      privateSale: { $ne: true },

      //storecode: storecode,
      storecode: { $regex: storecode, $options: 'i' },



      status: 'paymentConfirmed',



      nickname: { $regex: searchBuyer, $options: 'i' },

      'buyer.depositName': { $regex: searchDepositName, $options: 'i' },

      'store.bankInfo.accountNumber': { $regex: searchStoreBankAccountNumber, $options: 'i' },

    



      //paymentConfirmedAt: { $gte: startDate, $lt: endDate },
    },
  )
    .sort({ paymentConfirmedAt: -1 })
    .limit(limit).skip((page - 1) * limit).toArray();


  // get total count of orders
  const totalCount = await collection.countDocuments(
    {

      privateSale: { $ne: true },

      //storecode: storecode,

      storecode: { $regex: storecode, $options: 'i' },


      status: 'paymentConfirmed',

      nickname: { $regex: searchBuyer, $options: 'i' },

      'buyer.depositName': { $regex: searchDepositName, $options: 'i' },

      'store.bankInfo.accountNumber': { $regex: searchStoreBankAccountNumber, $options: 'i' },

    


      //paymentConfirmedAt: { $gte: startDate, $lt: endDate },
    }
  );
  //console.log('getAllTradesByStorecode totalCount: ' + totalCount);
  // sum of krwAmount
  const totalKrwAmount = await collection.aggregate([
    {
      $match: {

        privateSale: { $ne: true },


        //storecode: storecode,

        storecode: { $regex: storecode, $options: 'i' },


        status: 'paymentConfirmed',

        nickname: { $regex: searchBuyer, $options: 'i' },

        'buyer.depositName': { $regex: searchDepositName, $options: 'i' },

        'store.bankInfo.accountNumber': { $regex: searchStoreBankAccountNumber, $options: 'i' },

    


        //paymentConfirmedAt: { $gte: startDate, $lt: endDate },
      }
    },
    {
      $group: {
        _id: null,
        totalKrwAmount: { $sum: '$krwAmount' },
      }
    }
  ]).toArray();
  
  // sum of usdtAmount
  const totalUsdtAmount = await collection.aggregate([
    {
      $match: {

        privateSale: { $ne: true },

        //storecode: storecode,

        storecode: { $regex: storecode, $options: 'i' },


        status: 'paymentConfirmed',

      nickname: { $regex: searchBuyer, $options: 'i' },

      'buyer.depositName': { $regex: searchDepositName, $options: 'i' },

      'store.bankInfo.accountNumber': { $regex: searchStoreBankAccountNumber, $options: 'i' },

    


        //paymentConfirmedAt: { $gte: startDate, $lt: endDate },
      }
    },
    {
      $group: {
        _id: null,
        totalUsdtAmount: { $sum: '$usdtAmount' },
      }
    }
  ]).toArray();

  const totalSettlementCount = await collection.aggregate([
    {
      $match: {

        privateSale: { $ne: true },

        //storecode: storecode,

        storecode: { $regex: storecode, $options: 'i' },


        status: 'paymentConfirmed',

      nickname: { $regex: searchBuyer, $options: 'i' },

      'buyer.depositName': { $regex: searchDepositName, $options: 'i' },

      'store.bankInfo.accountNumber': { $regex: searchStoreBankAccountNumber, $options: 'i' },

    


        //paymentConfirmedAt: { $gte: startDate, $lt: endDate },
      }
    },
    {
      $group: {
        _id: null,
        totalSettlementCount: { $sum: 1 },
      }
    }
  ]).toArray();

  // totalSettlementAmount
  const totalSettlementAmount = await collection.aggregate([
    {
      $match: {

        privateSale: { $ne: true },

        //storecode: storecode,

        storecode: { $regex: storecode, $options: 'i' },


        status: 'paymentConfirmed',


        nickname: { $regex: searchBuyer, $options: 'i' },

      'buyer.depositName': { $regex: searchDepositName, $options: 'i' },

      'store.bankInfo.accountNumber': { $regex: searchStoreBankAccountNumber, $options: 'i' },



        //settlement.settlementAmount: { $exists: true },
        'settlement.settlementAmount': { $exists: true, $ne: null },



    


      }
    },
    {
      $group: {
        _id: null,
        totalSettlementAmount: { $sum: { $toDouble: '$settlement.settlementAmount' } },
      }
    }
  ]).toArray();
  // totalSettlementAmountKRW
  const totalSettlementAmountKRW = await collection.aggregate([
    {
      $match: {

        privateSale: { $ne: true },

        //storecode: storecode,

        storecode: { $regex: storecode, $options: 'i' },


        status: 'paymentConfirmed',


        nickname: { $regex: searchBuyer, $options: 'i' },

      'buyer.depositName': { $regex: searchDepositName, $options: 'i' },

      'store.bankInfo.accountNumber': { $regex: searchStoreBankAccountNumber, $options: 'i' },



        //settlement.settlementAmountKRW: { $exists: true },
        'settlement.settlementAmountKRW': { $exists: true, $ne: null },
      }
    },
    // $settlement.settlementAmountKRW is string
    {
      $group: {
        _id: null,
        ///totalSettlementAmountKRW: { $sum: '$settlement.settlementAmountKRW' },
        totalSettlementAmountKRW: { $sum: { $toDouble: '$settlement.settlementAmountKRW' } },
      }
    }
  ]).toArray();
  return {
    totalCount: totalCount,
    totalKrwAmount: totalKrwAmount ? totalKrwAmount[0]?.totalKrwAmount : 0,
    totalUsdtAmount: totalUsdtAmount ? totalUsdtAmount[0]?.totalUsdtAmount : 0,
    totalSettlementCount: totalSettlementCount ? totalSettlementCount[0]?.totalSettlementCount : 0,
    totalSettlementAmount: totalSettlementAmount ? totalSettlementAmount[0]?.totalSettlementAmount : 0,
    totalSettlementAmountKRW: totalSettlementAmountKRW ? totalSettlementAmountKRW[0]?.totalSettlementAmountKRW : 0,
    trades: results,
  };
}











// getAllBuyOrdersByAdmin
// status is "ordered" or "accepted" or "paymentAccepted"
export async function getAllBuyOrdersByAdmin(
  {
    limit,
    page,
    startDate,
    endDate,
    agentcode,
    searchNickname,
    walletAddress,
  }: {
    limit: number;
    page: number;
    startDate: string;
    endDate: string;
    agentcode: string;
    searchNickname: string;
    walletAddress: string;
  }

): Promise<any> {
  const safeLimit = Math.max(1, Number(limit || 0) || 1);
  const safePage = Math.max(1, Number(page || 0) || 1);
  const skip = (safePage - 1) * safeLimit;

  const safeAgentcode = normalizeSearchText(agentcode);
  const safeSearchNickname = normalizeSearchText(searchNickname);
  const safeWalletAddress = normalizeSearchText(walletAddress);

  const client = await clientPromise;
  const collection = client.db(dbName).collection('buyorders');
  await ensureBuyOrderReadIndexes(collection);

  const cacheKey = `getAllBuyOrdersByAdmin:${JSON.stringify({
    limit: safeLimit,
    page: safePage,
    agentcode: safeAgentcode,
    searchNickname: safeSearchNickname,
    walletAddress: safeWalletAddress,
  })}`;
  const cached = getBuyOrderCachedValue(cacheKey);
  if (cached !== undefined) {
    return cached;
  }

  const matchQuery: Record<string, any> = {
    privateSale: { $ne: true },
    status: { $in: ['ordered', 'accepted', 'paymentRequested'] },
    storecode: { $ne: null },
  };

  appendExactFilter(matchQuery, 'agentcode', safeAgentcode);
  appendContainsFilter(matchQuery, 'nickname', safeSearchNickname);
  appendContainsFilter(matchQuery, 'walletAddress', safeWalletAddress);

  const [facetResult = {}] = await collection.aggregate([
    { $match: matchQuery },
    {
      $facet: {
        orders: [
          { $sort: { createdAt: -1 } },
          { $skip: skip },
          { $limit: safeLimit },
        ],
        summary: [
          {
            $group: {
              _id: null,
              totalCount: { $sum: 1 },
              totalKrwAmount: { $sum: { $ifNull: ['$krwAmount', 0] } },
              totalUsdtAmount: { $sum: { $ifNull: ['$usdtAmount', 0] } },
            },
          },
        ],
      },
    },
  ]).toArray();

  const orders = Array.isArray(facetResult?.orders) ? facetResult.orders : [];
  const summary = facetResult?.summary?.[0] || {};

  const result = {
    totalCount: Number(summary?.totalCount || 0),
    totalKrwAmount: Number(summary?.totalKrwAmount || 0),
    totalUsdtAmount: Number(summary?.totalUsdtAmount || 0),
    orders,
  };

  setBuyOrderCachedValue(cacheKey, result);
  return result;
}

// getAllBuyOrdersByAdmin




















// getAllBuyOrdersForMatching
export async function getAllBuyOrdersForMatching(
  {
    limit,
    page,
    startDate,
    endDate,
  }: {
    limit: number;
    page: number;
    startDate: string;
    endDate: string;
  }
): Promise<any> {
  if (!startDate) {
    startDate = new Date(0).toISOString();
  }
  if (!endDate) {
    endDate = new Date().toISOString();
  }
  //console.log('getAllBuyOrdersForMatching startDate: ' + startDate);
  //console.log('getAllBuyOrdersForMatching endDate: ' + endDate);


  //console.log('getAllBuyOrdersForMatching limit: ' + limit);
  //console.log('getAllBuyOrdersForMatching page: ' + page);


  const client = await clientPromise;
  const collection = client.db(dbName).collection('buyorders');
  const results = await collection.find<OrderProps>(
    {
      
      storecode: { $ne: "admin" },




      settlement: null,

      status: { $in: ['ordered'] },
      
      
      'store.sellerWalletAddress': { $exists: true, $ne: null },


    }
  )
    .sort({ createdAt: -1 })
    ///.limit(limit).skip((page - 1) * limit)
    .toArray();



  ///console.log('getAllBuyOrdersForMatching results: ' + JSON.stringify(results));


  // get total count of orders
  const totalCount = await collection.countDocuments(
    {
      storecode: { $ne: "admin" },
      settlement: null,
      status: { $in: ['ordered'] },


      'store.sellerWalletAddress': { $exists: true, $ne: null },



    }
  );


  return {
    totalCount: totalCount,
    orders: results,
  };
}



// insertStore
export async function insertStore(data: any) {
  //console.log('insertStore data: ' + JSON.stringify(data));
  /*
  insertStore data: {"storecode":"teststorecode","storeName":"테스트상점","storeType":"test","storeUrl":"https://test.com","storeDescription":"설명입니다.","storeLogo":"https://test.com/logo.png","storeBanner":"https://test.com/banner.png"}
  */
  if (!data.storecode || !data.storeName) {
    
    
    console.log('insertStore data is invalid');
    console.log('insertStore data: ' + JSON.stringify(data));



    return null;
  }
  const client = await clientPromise;
  const collection = client.db(dbName).collection('stores');
  // check storecode is unique
  const stores = await collection.findOne<OrderProps>(
    {
      //storecode: data.storecode or storeName: data.storeName
      $or: [
        { storecode: data.storecode },
        { storeName: data.storeName },
      ],

    }
  );

  console.log('insertStore stores: ' + JSON.stringify(stores));

  if (stores) {
    console.log('storecode or storeName is already exist');
    return null;
  }



  // insert storecode
  const result = await collection.insertOne(
    {
      storecode: data.storecode,
      storeName: data.storeName.trim(),
      storeType: data.storeType,
      storeUrl: data.storeUrl,
      storeDescription: data.storeDescription,
      storeLogo: data.storeLogo,
      storeBanner: data.storeBanner,
      createdAt: new Date().toISOString(),
    }
  );
  //console.log('insertStore result: ' + JSON.stringify(result));
  if (result) {
    const updated = await collection.findOne<OrderProps>(
      { _id: result.insertedId }
    );
    return {
      _id: result.insertedId,
      storecode: data.storecode,
    };
  } else {
    return null;
  }
}







// deleteStoreCode
export async function deleteStoreCode(
  {
    storecode,
  }: {
    storecode: string;
  }
): Promise<boolean> {
  const client = await clientPromise;
  const collection = client.db(dbName).collection('stores');

  // delete storecode
  const result = await collection.deleteOne(
    { storecode: storecode }
  );
  if (result.deletedCount === 1) {
    return true;
  } else {
    return false;
  }
}


// getRandomStore
export async function getRandomStore(): Promise<any> {
  const client = await clientPromise;
  const collection = client.db(dbName).collection('stores');

  const result = await collection.aggregate<any>([
    { $sample: { size: 1 } }
  ]).toArray();

  if (result) {
    return result[0];
  } else {
    return null;
  }

}
















export async function getCollectOrdersForSeller(

  {
    storecode,
    limit,
    page,
    walletAddress,
    searchMyOrders,

    fromDate,
    toDate,
    buyerBankAccountNumber,
    sellerBankAccountNumber,
    skipSummary,
    clearanceOnly,
  }: {
    storecode: string;
    limit: number;
    page: number;
    walletAddress: string;
    searchMyOrders: boolean;

    fromDate?: string;
    toDate?: string;
    buyerBankAccountNumber?: string;
    sellerBankAccountNumber?: string;
    skipSummary?: boolean;
    clearanceOnly?: boolean;
  }

): Promise<any> {

  //console.log('getCollectOrdersForSeller fromDate: ' + fromDate);
  //console.log('getCollectOrdersForSeller toDate: ' + toDate);

  //const fromDateValue = fromDate ? fromDate + 'T00:00:00Z' : '1970-01-01T00:00:00Z';
  const fromDateValue = fromDate ? new Date(fromDate + 'T00:00:00+09:00').toISOString() : '1970-01-01T00:00:00Z';

  //const toDateValue = toDate ? toDate + 'T23:59:59Z' : new Date().toISOString();
  const toDateValue = toDate ? new Date(toDate + 'T23:59:59+09:00').toISOString() : new Date().toISOString();
  

  const client = await clientPromise;

  const collection = client.db(dbName).collection('buyorders');
  const clearanceStatuses = ['paymentConfirmed', 'paymentRequested'];
  const webhookGeneratedClearanceExclusionMatch = {
    $nor: [
      { 'createdBy.route': WITHDRAWAL_WEBHOOK_CLEARANCE_CREATED_BY_ROUTE },
      { 'createdBy.source': WITHDRAWAL_WEBHOOK_CLEARANCE_SOURCE },
      { 'clearanceSource.source': WITHDRAWAL_WEBHOOK_CLEARANCE_SOURCE },
      { source: WITHDRAWAL_WEBHOOK_CLEARANCE_SOURCE },
      { automationSource: WITHDRAWAL_WEBHOOK_CLEARANCE_SOURCE },
    ],
  };
  const normalizedTransactionHashExpr = {
    $toLower: {
      $ifNull: ['$transactionHash', ''],
    },
  };
  const normalizedTransactionHashDummyReasonExpr = {
    $toLower: {
      $ifNull: [
        '$transactionHashDummyReason',
        {
          $ifNull: [
            '$createdBy.transactionHashDummyReason',
            { $ifNull: ['$clearanceSource.transactionHashDummyReason', ''] },
          ],
        },
      ],
    },
  };
  const hasRealTransferExpr = {
    $and: [
      { $ne: [normalizedTransactionHashExpr, ''] },
      { $ne: [normalizedTransactionHashExpr, '0x'] },
      { $ne: [{ $ifNull: ['$transactionHashDummy', false] }, true] },
      {
        $ne: [
          normalizedTransactionHashDummyReasonExpr,
          WITHDRAWAL_WEBHOOK_CLEARANCE_DUMMY_TRANSFER_REASON,
        ],
      },
    ],
  };


  // status is not 'paymentConfirmed'


  // if searchMyOrders is true, get orders by buyer wallet address is walletAddress
  // else get all orders except paymentConfirmed

  // if storecode is empty, get all orders by wallet address

  // if storecode is not empty, get orders by storecode and wallet address
    const normalizedBuyerBankAccountNumber = String(buyerBankAccountNumber || '').trim();
    const normalizedSellerBankAccountNumber = String(sellerBankAccountNumber || '').trim();
    const shouldSkipSummary = skipSummary === true;
    const shouldFilterClearanceOnly = clearanceOnly === true;

    const resultsMatch: Record<string, any> = {
      storecode: storecode,
      privateSale: true,
      'buyer.depositName': { $eq: '' },
      createdAt: { $gte: fromDateValue, $lt: toDateValue },
    };

    if (normalizedBuyerBankAccountNumber) {
      resultsMatch['buyer.bankInfo.accountNumber'] = normalizedBuyerBankAccountNumber;
    }

    if (normalizedSellerBankAccountNumber) {
      resultsMatch['seller.bankInfo.accountNumber'] = normalizedSellerBankAccountNumber;
    }

    if (shouldFilterClearanceOnly) {
      resultsMatch.status = { $in: clearanceStatuses };
      resultsMatch.$nor = webhookGeneratedClearanceExclusionMatch.$nor;
    }

    const results = await collection.find<OrderProps>(
      resultsMatch,
      
      //{ projection: { _id: 0, emailVerified: 0 } }
  
    ).sort({ createdAt: -1 }).limit(limit).skip((page - 1) * limit).toArray();
  

    const totalCount = await collection.countDocuments(resultsMatch);

    if (shouldSkipSummary) {
      return {
        totalCount,
        totalClearanceCount: 0,
        totalClearanceAmount: 0,
        totalClearanceAmountKRW: 0,
        totalTransferCount: 0,
        totalTransferAmount: 0,
        totalByBuyerBankAccountNumber: [],
        totalBySellerBankAccountNumber: [],
        orders: results,
      };
    }


    // totalClearanceCount
    // totalclearanceAmount
    // totalClearanceAmountKRW
    const totalClearance = await collection.aggregate([
      {
        $match: {
          storecode: storecode,
          privateSale: true,
          status: { $in: clearanceStatuses },

          'buyer.depositName': { $eq: '' },

          createdAt: { $gte: fromDateValue, $lt: toDateValue },
          ...webhookGeneratedClearanceExclusionMatch,
        }
      },
      {
        $group: {
          _id: null,

          totalClearanceCount: { $sum: 1 },
          totalClearanceAmount: { $sum: '$usdtAmount' },
          totalClearanceAmountKRW: { $sum: { $toDouble: '$krwAmount' } }, // convert to double
          totalTransferCount: {
            $sum: {
              $cond: [hasRealTransferExpr, 1, 0],
            },
          },
          totalTransferAmount: {
            $sum: {
              $cond: [hasRealTransferExpr, { $ifNull: ['$usdtAmount', 0] }, 0],
            },
          },

        }
      }
    ]).toArray();

    const totalClearanceCount = totalClearance.length > 0 ? totalClearance[0].totalClearanceCount : 0;
    const totalClearanceAmount = totalClearance.length > 0 ? totalClearance[0].totalClearanceAmount : 0;
    const totalClearanceAmountKRW = totalClearance.length > 0 ? totalClearance[0].totalClearanceAmountKRW : 0;
    const totalTransferCount = totalClearance.length > 0 ? totalClearance[0].totalTransferCount : 0;
    const totalTransferAmount = totalClearance.length > 0 ? totalClearance[0].totalTransferAmount : 0;

    



    // totalReaultGroup by buyer.bankInfo.accountNumber
    const totalReaultGroupByBuyerBankAccountNumber = await collection.aggregate([
      {
        $match: {
          status: { $in: clearanceStatuses },
          
          //settlement: { $exists: true, $ne: null },

          privateSale: true,
          storecode: { $regex: storecode, $options: 'i' },
          createdAt: { $gte: fromDateValue, $lt: toDateValue },
          ...webhookGeneratedClearanceExclusionMatch,
        }
      },
      {
        $sort: {
          createdAt: -1,
        },
      },
      {
        $group: {
          _id: '$buyer.bankInfo.accountNumber',
          bankName: {
            $first: {
              $ifNull: [
                '$buyer.depositBankName',
                { $ifNull: ['$buyer.bankInfo.bankName', ''] },
              ],
            },
          },
          accountHolder: {
            $first: {
              $cond: [
                {
                  $and: [
                    { $ne: [{ $ifNull: ['$buyer.depositName', ''] }, ''] },
                    { $ne: [{ $ifNull: ['$buyer.depositName', null] }, null] },
                  ],
                },
                '$buyer.depositName',
                { $ifNull: ['$buyer.bankInfo.accountHolder', ''] },
              ],
            },
          },
          totalCount: { $sum: 1 },
          totalKrwAmount: { $sum: '$krwAmount' },
          totalUsdtAmount: { $sum: '$usdtAmount' },
        }
      },
      // sort by totalUsdtAmount desc
      { $sort: { totalUsdtAmount: -1 } }
    ]).toArray();


    // totalReaultGroup by seller.bankInfo.accountNumber
    const totalReaultGroupBySellerBankAccountNumber = await collection.aggregate([
      {
        $match: {
          status: { $in: clearanceStatuses },
          privateSale: true,
          storecode: { $regex: storecode, $options: 'i' },
          createdAt: { $gte: fromDateValue, $lt: toDateValue },
          ...webhookGeneratedClearanceExclusionMatch,
        }
      },
      {
        $sort: {
          createdAt: -1,
        },
      },
      {
        $group: {
          _id: '$seller.bankInfo.accountNumber',
          bankName: {
            $first: {
              $ifNull: ['$seller.bankInfo.bankName', ''],
            },
          },
          accountHolder: {
            $first: {
              $ifNull: ['$seller.bankInfo.accountHolder', ''],
            },
          },
          totalCount: { $sum: 1 },
          totalKrwAmount: { $sum: '$krwAmount' },
          totalUsdtAmount: { $sum: '$usdtAmount' },
        }
      },
      // sort by totalUsdtAmount desc
      { $sort: { totalUsdtAmount: -1 } }
    ]).toArray();



    return {
      totalCount: totalCount,
      totalClearanceCount: totalClearanceCount,
      totalClearanceAmount: totalClearanceAmount,
      totalClearanceAmountKRW: totalClearanceAmountKRW,
      totalTransferCount: totalTransferCount,
      totalTransferAmount: totalTransferAmount,

      totalByBuyerBankAccountNumber: totalReaultGroupByBuyerBankAccountNumber,
      totalBySellerBankAccountNumber: totalReaultGroupBySellerBankAccountNumber,

      orders: results,
    };




}


export async function getClearanceSellerBankBalanceSummary(
  {
    storecode,
    fromDate,
    toDate,
    privateSale = false,
  }: {
    storecode?: string;
    fromDate?: string;
    toDate?: string;
    privateSale?: boolean;
  },
): Promise<any> {
  const fromDateValue = fromDate
    ? new Date(`${fromDate}T00:00:00+09:00`).toISOString()
    : '1970-01-01T00:00:00Z';
  const toDateValue = toDate
    ? new Date(`${toDate}T23:59:59+09:00`).toISOString()
    : new Date().toISOString();
  const normalizedStorecode = String(storecode || "").trim();

  const client = await clientPromise;
  const collection = client.db(dbName).collection('buyorders');
  const clearanceStatuses = privateSale
    ? ['paymentConfirmed', 'paymentRequested']
    : ['paymentConfirmed'];

  const query: Record<string, any> = {
    status: { $in: clearanceStatuses },
    createdAt: { $gte: fromDateValue, $lt: toDateValue },
    privateSale: privateSale ? true : { $ne: true },
  };

  if (normalizedStorecode) {
    query.storecode = normalizedStorecode;
  }

  const items = await collection.aggregate([
    {
      $match: query,
    },
    {
      $group: {
        _id: '$seller.bankInfo.realAccountNumber',
        totalCount: { $sum: 1 },
        totalKrwAmount: { $sum: '$krwAmount' },
        totalUsdtAmount: { $sum: '$usdtAmount' },
      },
    },
    {
      $lookup: {
        from: 'bankInfos',
        localField: '_id',
        foreignField: 'realAccountNumber',
        as: 'bankUserInfo',
      },
    },
    {
      $addFields: {
        primaryBankUserInfo: { $arrayElemAt: ['$bankUserInfo', 0] },
      },
    },
    {
      $project: {
        _id: 1,
        totalCount: 1,
        totalKrwAmount: 1,
        totalUsdtAmount: 1,
        bankName: {
          $ifNull: ['$primaryBankUserInfo.bankName', ''],
        },
        accountHolder: {
          $ifNull: ['$primaryBankUserInfo.accountHolder', ''],
        },
        accountNumber: {
          $ifNull: [
            '$primaryBankUserInfo.defaultAccountNumber',
            {
              $ifNull: [
                '$primaryBankUserInfo.realAccountNumber',
                {
                  $ifNull: ['$primaryBankUserInfo.accountNumber', ''],
                },
              ],
            },
          ],
        },
        realAccountNumber: {
          $ifNull: ['$primaryBankUserInfo.realAccountNumber', ''],
        },
        defaultAccountNumber: {
          $ifNull: ['$primaryBankUserInfo.defaultAccountNumber', ''],
        },
        balance: {
          $cond: [
            { $ne: [{ $ifNull: ['$primaryBankUserInfo.balance', null] }, null] },
            { $toDouble: '$primaryBankUserInfo.balance' },
            null,
          ],
        },
      },
    },
    {
      $sort: {
        balance: -1,
        totalUsdtAmount: -1,
        _id: 1,
      },
    },
  ], {
    maxTimeMS: BUYORDER_QUERY_MAX_TIME_MS,
  }).toArray();

  return {
    totalCount: items.length,
    items,
  };
}


export async function getAdminClearanceOrders(
  {
    storecode,
    limit,
    page,
    walletAddress,
    searchMyOrders,
    fromDate,
    toDate,
  }: {
    storecode?: string;
    limit: number;
    page: number;
    walletAddress?: string;
    searchMyOrders?: boolean;
    fromDate?: string;
    toDate?: string;
  }
): Promise<any> {
  const fromDateValue = fromDate
    ? new Date(`${fromDate}T00:00:00+09:00`).toISOString()
    : '1970-01-01T00:00:00Z';
  const toDateValue = toDate
    ? new Date(`${toDate}T23:59:59+09:00`).toISOString()
    : new Date().toISOString();

  const normalizedStorecode = String(storecode || "").trim();
  const normalizedWalletAddress = String(walletAddress || "").trim();
  const safeLimit = Math.min(Math.max(1, Number(limit) || 1), 200);
  const safePage = Math.max(1, Number(page) || 1);

  const client = await clientPromise;
  const collection = client.db(dbName).collection('buyorders');
  const normalizedTransactionHashExpr = {
    $toLower: {
      $ifNull: ['$transactionHash', ''],
    },
  };
  const normalizedTransactionHashDummyReasonExpr = {
    $toLower: {
      $ifNull: [
        '$transactionHashDummyReason',
        {
          $ifNull: [
            '$createdBy.transactionHashDummyReason',
            { $ifNull: ['$clearanceSource.transactionHashDummyReason', ''] },
          ],
        },
      ],
    },
  };
  const hasRealTransferExpr = {
    $and: [
      { $ne: [normalizedTransactionHashExpr, ''] },
      { $ne: [normalizedTransactionHashExpr, '0x'] },
      { $ne: [{ $ifNull: ['$transactionHashDummy', false] }, true] },
      {
        $ne: [
          normalizedTransactionHashDummyReasonExpr,
          WITHDRAWAL_WEBHOOK_CLEARANCE_DUMMY_TRANSFER_REASON,
        ],
      },
    ],
  };

  const query: Record<string, any> = {
    privateSale: true,
    createdAt: { $gte: fromDateValue, $lt: toDateValue },
    ...(normalizedStorecode ? { storecode: normalizedStorecode } : { storecode: { $ne: null } }),
    ...(searchMyOrders && normalizedWalletAddress ? { walletAddress: normalizedWalletAddress } : {}),
  };

  const [orders, totalCount, summary] = await Promise.all([
    collection.find<OrderProps>(
      query,
      {
        maxTimeMS: BUYORDER_QUERY_MAX_TIME_MS,
      },
    )
      .sort({ createdAt: -1 })
      .limit(safeLimit)
      .skip((safePage - 1) * safeLimit)
      .toArray(),
    collection.countDocuments(query, {
      maxTimeMS: BUYORDER_QUERY_MAX_TIME_MS,
    }),
    collection.aggregate([
      {
        $match: query,
      },
      {
        $group: {
          _id: null,
          totalTransferCount: {
            $sum: {
              $cond: [hasRealTransferExpr, 1, 0],
            },
          },
          totalTransferAmount: {
            $sum: {
              $cond: [hasRealTransferExpr, { $ifNull: ['$usdtAmount', 0] }, 0],
            },
          },
          totalTransferAmountKRW: {
            $sum: {
              $cond: [hasRealTransferExpr, { $ifNull: ['$krwAmount', 0] }, 0],
            },
          },
        },
      },
    ], {
      maxTimeMS: BUYORDER_QUERY_MAX_TIME_MS,
    }).toArray(),
  ]);

  const totals = summary[0] || {};

  return {
    totalCount: Number(totalCount || 0),
    totalClearanceCount: Number(totals.totalTransferCount || 0),
    totalClearanceAmount: Number(totals.totalTransferAmount || 0),
    totalClearanceAmountKRW: Number(totals.totalTransferAmountKRW || 0),
    orders,
  };
}







export async function getCollectOrdersForUser(

  {
    storecode,
    limit,
    page,
    walletAddress,
    searchMyOrders,

    fromDate,
    toDate,

    searchWithdrawDepositName,
  }: {
    storecode: string;
    limit: number;
    page: number;
    walletAddress: string;
    searchMyOrders: boolean;

    fromDate?: string;
    toDate?: string;

    searchWithdrawDepositName?: string;
  }

): Promise<any> {

  //console.log('getCollectOrdersForUser fromDate: ' + fromDate);
  //console.log('getCollectOrdersForUser toDate: ' + toDate);

  //console.log('searchWithdrawDepositName: ' + searchWithdrawDepositName);



  //const fromDateValue = fromDate ? fromDate + 'T00:00:00Z' : '1970-01-01T00:00:00Z';
  // fromDate is korean date
  // then convert to UTC date
  const fromDateValue = fromDate ? new Date(fromDate + 'T00:00:00+09:00').toISOString() : '1970-01-01T00:00:00Z';

  // toDate is korean date
  //const toDateValue = toDate ? toDate + 'T23:59:59Z' : new Date().toISOString();
  const toDateValue = toDate ? new Date(toDate + 'T23:59:59+09:00').toISOString() : new Date().toISOString();
  

  const client = await clientPromise;

  const collection = client.db(dbName).collection('buyorders');


  // status is not 'paymentConfirmed'


  // if searchMyOrders is true, get orders by buyer wallet address is walletAddress
  // else get all orders except paymentConfirmed

  // if storecode is empty, get all orders by wallet address

  // if storecode is not empty, get orders by storecode and wallet address


    const results = await collection.find<OrderProps>(
      {
        //walletAddress: walletAddress,


        //status: 'ordered',
  
        //status: { $ne: 'paymentConfirmed' },
  
        storecode: storecode,
        privateSale: true,


        // check buyer.depositName is exist and where searchWithdrawDepositName is store.buyer.depositName

        //'buyer.depositName': { $regex: searchWithdrawDepositName, $options: 'i' },

        // when 'buyer.depositName' is not '', then search by 'buyer.depositName'
        'buyer.depositName': { $exists: true, $ne: '', $regex: searchWithdrawDepositName, $options: 'i' },
  



        createdAt: { $gte: fromDateValue, $lt: toDateValue },

        // if store.bankInfo.accountHolder is exist, and searchWithdrawDepositName is not empty, then search by store.bankInfo.accountHolder
        // or buyer.depositName is exist, and searchWithdrawDepositName is not empty, then search by buyer.depositName

        /*
        $or: [
          { 'store.bankInfo.accountHolder': { $regex: searchWithdrawDepositName, $options: 'i' } },
          { 'buyer.depositName': { $regex: searchWithdrawDepositName, $options: 'i' } },
        ], 
        */
       /*
        errorLabelSet: Set(0) {},
        errorResponse: {
          ok: 0,
          errmsg: '$regex has to be a string',
          code: 2,
          codeName: 'BadValue',
          '$clusterTime': {
            clusterTime: new Timestamp({ t: 1754661900, i: 1 }),
            signature: [Object]
          },
          operationTime: new Timestamp({ t: 1754661900, i: 1 })
        },
        ok: 0,
        code: 2,
        codeName: 'BadValue',
        '$clusterTime': {
          clusterTime: new Timestamp({ t: 1754661900, i: 1 }),
          signature: {
            hash: Binary.createFromBase64('m44on9ySijyLEn0GO4Rg4B65sTQ=', 0),
            keyId: new Long('7511921603412754437')
          }
        },
        operationTime: new Timestamp({ t: 1754661900, i: 1 })
        */


        // check if store.bankInfo.accountHolder is exist and where searchWithdrawDepositName is store.bankInfo.accountHolder
        /*
        ...(searchWithdrawDepositName && searchWithdrawDepositName.trim() !== '' ? {
          $or: [
            { 'store.bankInfo.accountHolder': { $regex: searchWithdrawDepositName, $options: 'i' } },
            { 'buyer.depositName': { $regex: searchWithdrawDepositName, $options: 'i' } },
          ],
        } : {}),
         */


      },
      
      //{ projection: { _id: 0, emailVerified: 0 } }
  
    ).sort({ createdAt: -1 }).limit(limit).skip((page - 1) * limit).toArray();


    //console.log('getCollectOrdersForUser results: ' + JSON.stringify(results));


  

    const totalCount = await collection.countDocuments(
      {
        //walletAddress: walletAddress,

        storecode: storecode,
        privateSale: true,

        'buyer.depositName': { $exists: true, $ne: '', $regex: searchWithdrawDepositName, $options: 'i' },

        // if store.bankInfo.accountHolder is exist, and searchWithdrawDepositName is not empty, then search by store.bankInfo.accountHolder
        // or buyer.depositName is exist, and searchWithdrawDepositName is not empty, then search by buyer.depositName
        /*
        $or: [
          { 'store.bankInfo.accountHolder': { $regex: searchWithdrawDepositName, $options: 'i' } },
          { 'buyer.depositName': { $regex: searchWithdrawDepositName, $options: 'i' } },
        ],
        */


        createdAt: { $gte: fromDateValue, $lt: toDateValue },


      }
    );

    
    // totalClearanceCount
    // totalClearanceAmount
    // totalClearanceAmountKRW

    const totalClearance = await collection.aggregate([
      {
        $match: {
          storecode: storecode,
          privateSale: true,
          status: 'paymentConfirmed',
          'buyer.depositName': { $exists: true, $ne: '', $regex: searchWithdrawDepositName, $options: 'i' },
          createdAt: { $gte: fromDateValue, $lt: toDateValue },
        }
      },
      {
        $group: {
          _id: null,

          totalClearanceCount: { $sum: 1 },
          totalClearanceAmount: { $sum: '$usdtAmount' },
          totalClearanceAmountKRW: { $sum: { $toDouble: '$krwAmount' } }, // convert to double

        }
      }
    ]).toArray();

    const totalClearanceCount = totalClearance.length > 0 ? totalClearance[0].totalClearanceCount : 0;
    const totalClearanceAmount = totalClearance.length > 0 ? totalClearance[0].totalClearanceAmount : 0;
    const totalClearanceAmountKRW = totalClearance.length > 0 ? totalClearance[0].totalClearanceAmountKRW : 0;

    

    return {
      totalCount: totalCount,
      totalClearanceCount: totalClearanceCount,
      totalClearanceAmount: totalClearanceAmount,
      totalClearanceAmountKRW: totalClearanceAmountKRW,
      //totalKrwAmount: totalKrwAmount
      orders: results,
    };




}






// getAllBuyOrdersForRequestPayment
export async function getAllBuyOrdersForRequestPayment(
  {
    limit,
    page,
    acceptedBefore,
  }: {
    limit: number;
    page: number;
    acceptedBefore?: string;
  }

): Promise<any> {

  const client = await clientPromise;

  const collection = client.db(dbName).collection('buyorders');

  const BUYORDER_REQUEST_PAYMENT_QUERY_MAX_TIME_MS = Math.max(
    Number.parseInt(process.env.BUYORDER_REQUEST_PAYMENT_QUERY_MAX_TIME_MS || "", 10) || 12000,
    1000,
  );
  const safeLimit = Math.min(Math.max(1, Number(limit) || 1), 200);
  const safePage = Math.max(1, Number(page) || 1);

  const query = {
    "payactionResult.status": { $ne: 'error' }, // ==================> 중요한부분
    storecode: { $ne: null },
    "buyer.depositName": { $ne: null },
    status: 'accepted',
    ...(acceptedBefore ? { acceptedAt: { $lte: acceptedBefore } } : {}),
  };

  const [results, totalCount] = await Promise.all([
    collection.find<OrderProps>(
      query,
      {
        maxTimeMS: BUYORDER_REQUEST_PAYMENT_QUERY_MAX_TIME_MS,
      },
    )
      .sort({ createdAt: -1 })
      .limit(safeLimit)
      .skip((safePage - 1) * safeLimit)
      .toArray(),
    collection.countDocuments(query, {
      maxTimeMS: BUYORDER_REQUEST_PAYMENT_QUERY_MAX_TIME_MS,
    }),
  ]);


  return {
    totalCount: totalCount,
    orders: results,
  };
}







// updateBuyOrderPayactionResult
export async function updateBuyOrderPayactionResult(
  {
    orderId,
    api,
    payactionResult,
  }: {
    orderId: string;
    api: string;
    payactionResult: any;
  }
): Promise<boolean> {
  const client = await clientPromise;
  const collection = client.db(dbName).collection('buyorders');
  // update buyorder
  const result = await collection.updateOne(
    { _id: new ObjectId(orderId) },
    { $set: {
      api: api,
      payactionResult: payactionResult,
    } }
  );
  if (result.modifiedCount === 1) {
    return true;
  } else {
    return false;
  }
}




// getTradeId
export async function getTradeId(
  {
    orderId,
  }: {
    orderId: string;
  }
): Promise<string | null> {
  const client = await clientPromise;
  const collection = client.db(dbName).collection('buyorders');
  // get tradeId
  const result = await collection.findOne<any>(
    { _id: new ObjectId(orderId) },
    { projection: { tradeId: 1 } }
  );


  console.log('getTradeId result: ' + JSON.stringify(result));

  

  if (result && result.tradeId) {
    return result.tradeId;
  } else {
    return null;
  }
}




// updateBuyOrderSettlement
export async function updateBuyOrderSettlement(
  {
    updater,
    orderId,
    settlement,
    ///////////storecode,
  }: {
    updater: string; // who is updating the settlement
    orderId: string;
    settlement: any;
    ////////////storecode: string;
  }
): Promise<boolean> {
  if (!ObjectId.isValid(orderId)) {
    return false;
  }

  const orderObjectId = new ObjectId(orderId);
  const client = await clientPromise;
  const collection = client.db(dbName).collection('buyorders');
  const previousOrder = await fetchBuyOrderRealtimeSnapshot(
    collection,
    { _id: orderObjectId },
  );
  const previousStatus = previousOrder?.status ? String(previousOrder.status) : null;

  // update buyorder
  const result = await collection.updateOne(
    {
      _id: orderObjectId,
      status: "paymentConfirmed",
      storecode: { $ne: "admin" },
      transactionHash: {
        $type: "string",
        $nin: ["", "0x"],
      },
      transactionHashFail: { $ne: true },
      $or: [
        { settlement: { $exists: false } },
        { settlement: null },
        { "settlement.settlementAmount": { $exists: false } },
        { "settlement.settlementAmount": null },
      ],
    },
    { $set: {
      settlement: settlement,
      settlementUpdatedAt: new Date().toISOString(),
      settlementUpdatedBy: updater, // who updates the settlement
    } }
  );


  if (result.modifiedCount === 1) {

    // get storecode from buyorder
    const buyOrder = await collection.findOne<any>(
      { _id: orderObjectId },
      { projection: { storecode: 1 } }
    );
    if (!buyOrder || !buyOrder.storecode) {
      console.log('updateBuyOrderSettlement: storecode not found in buyorder');
      return false;
    }
    const storecode = buyOrder.storecode;
    console.log('updateBuyOrderSettlement: storecode found in buyorder: ' + storecode);


    const collectionBuyorders = client.db(dbName).collection('buyorders');

    // update store with settlement data
    try {

      const collectionStore = client.db(dbName).collection('stores');

      // totalSettlementCount is count of all buyorders with settlement and storecode
      /*
      const totalSettlementCount = await collectionBuyorders.countDocuments({
          storecode: storecode,
          settlement: {$exists: true},
          privateSale: { $ne: true }, // exclude privateSale orders
      });
      //console.log("totalSettlementCount", totalSettlementCount);
      */

      const totalSettlementAmountResult = await collectionBuyorders.aggregate([
          {
              $match: {
                  storecode: storecode,
                  settlement: {$exists: true},
                  privateSale: { $ne: true }, // exclude privateSale orders
              }
          },
          {
              $group: {
                  _id: null,
                  totalSettlementCount: { $sum: 1 },
                  totalSettlementAmount: { $sum: "$settlement.settlementAmount" },
                  totalSettlementAmountKRW: { $sum: { $toDouble: "$settlement.settlementAmountKRW" } },

                  totalFeeAmount: { $sum: "$settlement.feeAmount" },
                  totalFeeAmountKRW: { $sum: { $toDouble: "$settlement.feeAmountKRW" } },

                  totalAgentFeeAmount: { $sum: "$settlement.agentFeeAmount" },
                  totalAgentFeeAmountKRW: { $sum: { $toDouble: "$settlement.agentFeeAmountKRW" } }

              }
          }
      ]).toArray();

      const totalSettlementCount = totalSettlementAmountResult[0].totalSettlementCount;

      const totalSettlementAmount = totalSettlementAmountResult[0].totalSettlementAmount;
      const totalSettlementAmountKRW = totalSettlementAmountResult[0].totalSettlementAmountKRW;

      const totalFeeAmount = totalSettlementAmountResult[0].totalFeeAmount;
      const totalFeeAmountKRW = totalSettlementAmountResult[0].totalFeeAmountKRW;

      const totalAgentFeeAmount = totalSettlementAmountResult[0].totalAgentFeeAmount;
      const totalAgentFeeAmountKRW = totalSettlementAmountResult[0].totalAgentFeeAmountKRW;

      // update store
      const resultStore = await collectionStore.updateOne(
          { storecode: storecode },
          {
              $set: {
                  totalSettlementCount: totalSettlementCount,
                  totalSettlementAmount: totalSettlementAmount,
                  totalSettlementAmountKRW: totalSettlementAmountKRW,

                  totalFeeAmount: totalFeeAmount,
                  totalFeeAmountKRW: totalFeeAmountKRW,

                  totalAgentFeeAmount: totalAgentFeeAmount,
                  totalAgentFeeAmountKRW: totalAgentFeeAmountKRW,
              },
          }
      );


      if (resultStore.modifiedCount === 1) {
        console.log('updateBuyOrderSettlement: store updated successfully');
      } else {
        console.log('updateBuyOrderSettlement: store update failed');
      }

    } catch (error) {
      console.error('Error updating store with settlement data:', error);
    }




    // update agent with settlement data
    try {

      // get agentcode from buyorder
      const buyOrder = await collectionBuyorders.findOne<any>(
        { _id: new ObjectId(orderId) },
        { projection: { agentcode: 1 } }
      );
      if (!buyOrder || !buyOrder.agentcode) {
        console.log('updateBuyOrderSettlement: agentcode not found in buyorder');
        return false;
      }
      const agentcode = buyOrder.agentcode;

      const collectionAgents = client.db(dbName).collection('agents');

      /*
      // totalSettlementCount is count of all buyorders with settlement and agentcode
      const totalSettlementCount = await collectionBuyorders.countDocuments({
        agentcode: agentcode,
        settlement: { $exists: true },
        privateSale: { $ne: true }, // exclude privateSale orders
      });
      console.log("updateBuyOrderSettlement totalSettlementCount", totalSettlementCount);
      */

      const totalSettlementAmountResult = await collectionBuyorders.aggregate([
        {
          $match: {
            agentcode: agentcode,
            settlement: { $exists: true },
            privateSale: { $ne: true }, // exclude privateSale orders
          }
        },
        {
          $group: {
            _id: null,
            totalSettlementCount: { $sum: 1 },

            totalSettlementAmount: { $sum: "$settlement.settlementAmount" },
            totalSettlementAmountKRW: { $sum: { $toDouble: "$settlement.settlementAmountKRW" } },
            totalFeeAmount: { $sum: "$settlement.feeAmount" },
            totalFeeAmountKRW: { $sum: { $toDouble: "$settlement.feeAmountKRW" } },
          }
        }
      ]).toArray();

      const totalSettlementCount = totalSettlementAmountResult[0].totalSettlementCount;
      const totalSettlementAmount = totalSettlementAmountResult[0].totalSettlementAmount;
      const totalSettlementAmountKRW = totalSettlementAmountResult[0].totalSettlementAmountKRW;
      const totalFeeAmount = totalSettlementAmountResult[0].totalFeeAmount;
      const totalFeeAmountKRW = totalSettlementAmountResult[0].totalFeeAmountKRW;
      // update agent
      const resultAgent = await collectionAgents.updateOne(
        { agentcode: agentcode },
        {
          $set: {
            totalSettlementCount: totalSettlementCount,
            totalSettlementAmount: totalSettlementAmount,
            totalSettlementAmountKRW: totalSettlementAmountKRW,
            totalFeeAmount: totalFeeAmount,
            totalFeeAmountKRW: totalFeeAmountKRW,
          },
        }
      );

      if (resultAgent.modifiedCount === 1) {
        console.log('updateBuyOrderSettlement: agent updated successfully');
      } else {
        console.log('updateBuyOrderSettlement: agent update failed');
      }

    } catch (error) {
      console.error('Error updating agent with settlement data:', error);
    }

    try {
      const updatedOrder = await fetchBuyOrderRealtimeSnapshot(
        collection,
        { _id: orderObjectId },
      );

      if (updatedOrder) {
        await emitBuyOrderStatusRealtimeEvent({
          source: "order.updateBuyOrderSettlement",
          statusFrom: previousStatus,
          statusTo: "paymentSettled",
          order: updatedOrder,
          idempotencyParts: [
            String(settlement?.txid || ""),
            String(settlement?.settlementAmount || ""),
            String(settlement?.feeAmount || ""),
            String(settlement?.agentFeeAmount || ""),
            String(settlement?.status || ""),
            String(updater || ""),
          ],
        });
      }
    } catch (error) {
      console.error('Failed to emit settlement realtime event:', error);
    }


    return true;
  } else {

    console.log('updateBuyOrderSettlement failed for orderId: ' + orderId);
    console.log('updateBuyOrderSettlement result: ' + JSON.stringify(result));

    return false;
  }
}




// getTotalNumberOfBuyOrders
export async function getTotalNumberOfBuyOrders(
  {
    storecode,
    ordersLimit,
  }: {
    storecode: string;
    ordersLimit?: number;
  }
): Promise<{
  totalCount: number;
  orders: any[];
  audioOnCount: number;
  ordersLimit: number;
}> {
  const client = await clientPromise;
  const collection = client.db(dbName).collection('buyorders');
  void ensureBuyOrderReadIndexes(collection);

  const safeStorecode = String(storecode || "").trim();
  const parsedOrdersLimit = Number(ordersLimit);
  const safeOrdersLimit = Number.isFinite(parsedOrdersLimit)
    ? Math.min(300, Math.max(1, Math.trunc(parsedOrdersLimit)))
    : 100;
  const cacheKey = `totalBuyOrders:${safeStorecode || "__all__"}:${safeOrdersLimit}`;
  const cached = getBuyOrderCachedValue(cacheKey);
  if (cached !== undefined) {
    return cached;
  }

  const matchQuery: Record<string, unknown> = {
    privateSale: { $ne: true },
    status: { $in: ['ordered', 'accepted', 'paymentRequested'] },
  };

  if (safeStorecode) {
    matchQuery.storecode = safeStorecode;
  }

  const [totalCount, audioOnCount, orders] = await Promise.all([
    collection.countDocuments(matchQuery, { maxTimeMS: 12000 }),
    collection.countDocuments(
      {
        ...matchQuery,
        audioOn: true,
      },
      { maxTimeMS: 12000 },
    ),
    collection
      .find<any>(
        matchQuery,
        {
          projection: {
            tradeId: 1,
            store: 1,
            buyer: 1,
            createdAt: 1,
          },
          maxTimeMS: 12000,
        },
      )
      .sort({ createdAt: -1 })
      .limit(safeOrdersLimit)
      .toArray(),
  ]);

  const result = {
    totalCount: Number(totalCount || 0),
    orders: Array.isArray(orders) ? orders : [],
    audioOnCount: Number(audioOnCount || 0),
    ordersLimit: safeOrdersLimit,
  };

  setBuyOrderCachedValue(cacheKey, result);
  return result;
}




// getTotalNumberOfClearanceOrders
export async function getTotalNumberOfClearanceOrders(): Promise<{ totalCount: number, orders: any[] }> {
  const client = await clientPromise;
  const collection = client.db(dbName).collection('buyorders');
  const CLEARANCE_ORDERS_DEFAULT_LIMIT = Math.max(
    Number.parseInt(process.env.CLEARANCE_ORDERS_DEFAULT_LIMIT || "", 10) || 100,
    1,
  );
  const CLEARANCE_ORDERS_QUERY_MAX_TIME_MS = Math.max(
    Number.parseInt(process.env.CLEARANCE_ORDERS_QUERY_MAX_TIME_MS || "", 10) || 12000,
    1000,
  );

  const matchQuery = {
    privateSale: true,
    'buyer.depositCompleted': false, // buyer has not completed withdrawal handling
  };

  const safeOrdersLimit = Math.min(
    Math.max(1, CLEARANCE_ORDERS_DEFAULT_LIMIT),
    300,
  );

  const [totalCount, results] = await Promise.all([
    collection.countDocuments(matchQuery, {
      maxTimeMS: CLEARANCE_ORDERS_QUERY_MAX_TIME_MS,
    }),
    collection.find<any>(
      matchQuery,
      {
        projection: { tradeId: 1, store: 1, buyer: 1, createdAt: 1 },
        maxTimeMS: CLEARANCE_ORDERS_QUERY_MAX_TIME_MS,
      },
    )
      .sort({ createdAt: -1 })
      .limit(safeOrdersLimit)
      .toArray(),
  ]);



  return {
    totalCount: totalCount,
    orders: results,
  }
}










// buyOrderWebhook
export async function buyOrderWebhook(
  {
    orderId,
    webhookData,
  }: {
    orderId: string;
    webhookData: any;
  }
): Promise<boolean> {
  const client = await clientPromise;
  const collection = client.db(dbName).collection('buyorders');
  // update buyorder
  const result = await collection.updateOne(
    { _id: new ObjectId(orderId) },
    { $set: {
      webhookData: webhookData,
    } }
  );
  if (result.modifiedCount === 1) {
    return true;
  } else {
    return false;
  }
}



// getBuyOrderByEscrowWalletAddress
export async function getBuyOrderByEscrowWalletAddress(
  {
    escrowWalletAddress,
  }: {
    escrowWalletAddress: string;
  }
): Promise<any | null> {

  console.log('getBuyOrderByEscrowWalletAddress escrowWalletAddress: ' + escrowWalletAddress);

  const client = await clientPromise;
  const collection = client.db(dbName).collection('buyorders');
  // get buyorder by escrow wallet address
  const result = await collection.findOne<any>(
    { 'escrowWallet.address': escrowWalletAddress },
  );
  if (result) {
    return result;
  } else {
    return null;
  }
}

// updateBuyOrderEscrowBalance
export async function updateBuyOrderEscrowBalance(
  {
    orderId,
    escrowBalance,
    transactionHash,
  }: {
    orderId: string;
    escrowBalance: number;
    transactionHash: string;
  }
): Promise<boolean> {

  console.log('updateBuyOrderEscrowBalance orderId: ' + orderId);
  console.log('updateBuyOrderEscrowBalance escrowBalance: ' + escrowBalance);

  const client = await clientPromise;
  const collection = client.db(dbName).collection('buyorders');
  // update buyorder
  const result = await collection.updateOne(
    { _id: new ObjectId(orderId) },
    { $set: {
      'escrowWallet.balance': escrowBalance,
      'escrowWallet.transactionHash': transactionHash,
      'escrowWallet.updatedAt': new Date().toISOString(),
    } }
  );

  console.log('updateBuyOrderEscrowBalance result: ' + JSON.stringify(result));

  if (result.modifiedCount === 1) {
    return true;
  } else {
    return false;
  }
}






// escrows collection
// date: 20240101, depositAmount, withdrawAmount, beforeBalance, afterBalance
// deposit escrow
export async function depositEscrow(
  {
    storecode,
    date,
    depositAmount,
  }: {
    storecode: string;
    date: string;
    depositAmount: number;
  }
): Promise<boolean> {

  // get store.escrowAmountUSDT from storecode
  const client = await clientPromise;
  const collection = client.db(dbName).collection('stores');
  const store = await collection.findOne<any>(
    { storecode: storecode },
    { projection: { escrowAmountUSDT: 1 } }
  );

  if (!store) {
    //console.log('store not found for storecode: ' + storecode);
    return false;
  }


  const storeEscrowAmountUSDT = store.escrowAmountUSDT || 0;

  // insert escrow record
  const escrowCollection = client.db(dbName).collection('escrows');
  const result = await escrowCollection.insertOne(
    {
      createdAt: new Date().toISOString(),
      storecode: storecode,
      date: date,
      depositAmount: depositAmount,
      beforeBalance: storeEscrowAmountUSDT,
      afterBalance: storeEscrowAmountUSDT + depositAmount,
    }
  );
  if (result.insertedId) {
    // update store.escrowAmountUSDT
    const updateResult = await collection.updateOne(
      { storecode: storecode },
      { $inc: { escrowAmountUSDT: depositAmount } }
    );
    if (updateResult.modifiedCount === 1) {
      return true;
    } else {
      console.log('update store escrowAmountUSDT failed for storecode: ' + storecode);
      return false;
    }
  } else {
    console.log('insert escrow record failed for storecode: ' + storecode);
    return false;
  }
}

// withdraw escrow
export async function withdrawEscrow(
  {
    storecode,
    date,
    withdrawAmount,
  }: {
    storecode: string;
    date: string;
    withdrawAmount: number;
  }
): Promise<boolean> {

  // get store.escrowAmountUSDT from storecode
  const client = await clientPromise;
  const collection = client.db(dbName).collection('stores');
  const store = await collection.findOne<any>(
    { storecode: storecode },
    { projection: { escrowAmountUSDT: 1 } }
  );

  if (!store) {
    //console.log('store not found for storecode: ' + storecode);
    return false;
  }

  const storeEscrowAmountUSDT = store.escrowAmountUSDT || 0;

  if (storeEscrowAmountUSDT < withdrawAmount) {
    console.log('store.escrowAmountUSDT is less than withdrawAmount for storecode: ' + storecode);
    return false;
  }

  // insert escrow record
  const escrowCollection = client.db(dbName).collection('escrows');
  const result = await escrowCollection.insertOne(
    {
      createdAt: new Date().toISOString(),
      storecode: storecode,
      date: date,
      withdrawAmount: withdrawAmount,
      beforeBalance: storeEscrowAmountUSDT,
      afterBalance: storeEscrowAmountUSDT - withdrawAmount,
    }
  );
  
  if (result.insertedId) {
    // update store.escrowAmountUSDT
    const updateResult = await collection.updateOne(
      { storecode: storecode },
      { $inc: { escrowAmountUSDT: -withdrawAmount } }
    );
    
    if (updateResult.modifiedCount === 1) {
      return true;
    } else {
      console.log('update store escrowAmountUSDT failed for storecode: ' + storecode);
      return false;
    }
  } else {
    console.log('insert escrow record failed for storecode: ' + storecode);
    return false;
  }
}

  

// getEscrowHistory
export async function getEscrowHistory(
  {
    storecode,
    limit,
    page,
  }: {
    storecode: string;
    limit: number;
    page: number;
  }
): Promise<any> {
  const client = await clientPromise;
  const collection = client.db(dbName).collection('escrows');
  
  const results = await collection.find<any>(
    { storecode: storecode },
  ).sort({ _id: -1 }).limit(limit).skip((page - 1) * limit).toArray();

  const totalCount = await collection.countDocuments(
    { storecode: storecode }
  );

  return {
    totalCount: totalCount,
    escrows: results,
  };
}












// updateBuyOrderDepositCompleted
// update buyer.depositCompleted to true
// and depositCompletedAt to current date
// this is used when the buyer has completed the deposit
export async function updateBuyOrderDepositCompleted(
  {
    orderId,
    actor,
  }: {
    orderId: string;
    actor?: {
      walletAddress?: string | null;
      nickname?: string | null;
      storecode?: string | null;
      role?: string | null;
      publicIp?: string | null;
      signedAt?: string | null;
    } | null;
  }
): Promise<{
  ok: boolean;
  alreadyCompleted: boolean;
  order: any | null;
}> {

  console.log('updateBuyOrderDepositCompleted orderId: ' + orderId);

  if (!ObjectId.isValid(orderId)) {
    return {
      ok: false,
      alreadyCompleted: false,
      order: null,
    };
  }

  const completedAt = new Date().toISOString();
  const normalizedActor = actor
    ? {
        walletAddress: toNullableText(actor.walletAddress)?.toLowerCase() || null,
        nickname: toNullableText(actor.nickname),
        storecode: toNullableText(actor.storecode),
        role: toNullableText(actor.role),
        publicIp: toNullableText(actor.publicIp),
        signedAt: toNullableText(actor.signedAt),
        completedAt,
      }
    : null;

  const client = await clientPromise;
  const collection = client.db(dbName).collection('buyorders');

  const result = await collection.updateOne(
    {
      _id: new ObjectId(orderId),
      'buyer.depositCompleted': { $ne: true },
    },
    { $set: {
      'buyer.depositCompleted': true,
      'buyer.depositCompletedAt': completedAt,
      ...(normalizedActor ? { 'buyer.depositCompletedBy': normalizedActor } : {}),
    } }
  );

  if (result.modifiedCount === 1) {
    clearBuyOrderReadCache();
    const updatedOrder = await collection.findOne<any>(
      { _id: new ObjectId(orderId) },
      { projection: { buyer: 1, tradeId: 1, transactionHash: 1 } }
    );
    return {
      ok: true,
      alreadyCompleted: false,
      order: updatedOrder,
    };
  }

  const existingOrder = await collection.findOne<any>(
    { _id: new ObjectId(orderId) },
    { projection: { buyer: 1, tradeId: 1, transactionHash: 1 } }
  );

  if (existingOrder?.buyer?.depositCompleted === true) {
    return {
      ok: true,
      alreadyCompleted: true,
      order: existingOrder,
    };
  }

  return {
    ok: false,
    alreadyCompleted: false,
    order: existingOrder,
  };
}








// getEscrowBalanceByStorecode
// Get the escrow balance for a specific storecode
export async function getEscrowBalanceByStorecode(
  {
    storecode,
  }: {
    storecode: string;
  }
): Promise<any> {
  const safeStorecode = String(storecode || "").trim();
  const cacheKey = `escrowBalance:${safeStorecode || "__all__"}`;
  const cached = getBuyOrderCachedValue(cacheKey);
  if (cached !== undefined) {
    return cached;
  }

  if (!safeStorecode) {
    const emptyResult = {
      escrowBalance: 0,
      todayMinusedEscrowAmount: 0,
    };
    setBuyOrderCachedValue(cacheKey, emptyResult);
    return emptyResult;
  }

  const client = await clientPromise;
  const collection = client.db(dbName).collection('stores');
  const store = await collection.findOne<any>(
    { storecode: safeStorecode },
    {
      projection: { escrowAmountUSDT: 1 },
      maxTimeMS: ESCROW_BALANCE_QUERY_MAX_TIME_MS,
    }
  );

  if (!store) {
    const result = {
      escrowBalance: 0,
      todayMinusedEscrowAmount: 0,
    };
    setBuyOrderCachedValue(cacheKey, result);
    return result;
  }




  // get latest date from escrows collection with withdrawAmount > 0
  // if no escrows found, return 0
 
  const escrowCollection = client.db(dbName).collection('escrows');
  const buyordersCollection = client.db(dbName).collection('buyorders');




  const latestEscrow = await escrowCollection.findOne<any>(
    {
      storecode: safeStorecode,
      withdrawAmount: { $gt: 0 },
    },
    {
      projection: { date: 1 },
      sort: { date: -1 },
      maxTimeMS: ESCROW_BALANCE_QUERY_MAX_TIME_MS,
    },
  );

  //console.log('getEscrowBalanceByStorecode latestEscrow: ' + JSON.stringify(latestEscrow));
  //  [{"_id":"6888e772edb063fa5cfe9ead","storecode":"dtwuzgst","date":"2025-07-29","withdrawAmount":113.42,"beforeBalance":1579.7389999999996,"afterBalance":1466.3189999999995}]


  if (!latestEscrow) {

    const totalSettlement = await buyordersCollection.aggregate([
      {
        $match: {
          storecode: safeStorecode,
          settlement: { $exists: true },
        },
      },
      {
        $group: {
          _id: null,
          totalFeeAmount: { $sum: { $ifNull: ['$$ROOT.settlement.feeAmount', 0] } },
          totalAgentFeeAmount: { $sum: { $ifNull: ['$$ROOT.settlement.agentFeeAmount', 0] } },
        },
      },
    ], {
      maxTimeMS: ESCROW_BALANCE_QUERY_MAX_TIME_MS,
    }).toArray();

    if (totalSettlement.length === 0) {

      const result = {
        escrowBalance: store.escrowAmountUSDT || 0,
        todayMinusedEscrowAmount: 0,
      };
      setBuyOrderCachedValue(cacheKey, result);
      return result;

    } else {

      const totalFeeAmount = totalSettlement[0].totalFeeAmount || 0;
      const totalAgentFeeAmount = totalSettlement[0].totalAgentFeeAmount || 0;

      const todayMinusedEscrowAmount = totalFeeAmount + totalAgentFeeAmount;

      // calculate escrow balance
      const escrowBalance = (store.escrowAmountUSDT || 0) - todayMinusedEscrowAmount;

      const result = {
        escrowBalance: escrowBalance,
        todayMinusedEscrowAmount: todayMinusedEscrowAmount,
      };
      setBuyOrderCachedValue(cacheKey, result);
      return result;

    }



  } else {

    // get sum of settlement.feeAmount + settlement.agentFeeAmount from buyorders where storecode is storecode
    // where settlement.createdAt is greater than  latestEscrow[0].date


    // latestEscrow[0].date is in 'YYYY-MM-DD' format and korean timezone
    // so we need to convert it to UTC date format
    // and plus one day to get the end of the day
    // e.g. '2025-07-28' -> '2025-07

    //const latestEscrowDate = new Date(latestEscrow[0].date + 'T00:00:00+09:00').toISOString();

    const latestEscrowDateBase = new Date(String(latestEscrow.date || "") + 'T00:00:00+09:00');
    if (!Number.isFinite(latestEscrowDateBase.getTime())) {
      const result = {
        escrowBalance: store.escrowAmountUSDT || 0,
        todayMinusedEscrowAmount: 0,
      };
      setBuyOrderCachedValue(cacheKey, result);
      return result;
    }

    const latestEscrowDate = latestEscrowDateBase.toISOString();
    // plus one day to get the end of the day
    const latestEscrowDatePlusOne = 
      new Date(new Date(latestEscrowDate).getTime() + 24 * 60 * 60 * 1000).toISOString();

    ///console.log('getEscrowBalanceByStorecode latestEscrowDatePlusOne: ' + latestEscrowDatePlusOne);
    // 2025-07-28T15:00:00.000Z
    // getEscrowBalanceByStorecode latestEscrowDatePlusOne: 2025-08-08T15:00:00.000Z

    const totalSettlement = await buyordersCollection.aggregate([
      {
        $match: {
          storecode: safeStorecode,
          'settlement.createdAt': { $gt: latestEscrowDatePlusOne },
          settlement: { $exists: true },
        },
      },
      {
        $group: {
          _id: null,
          totalFeeAmount: { $sum: { $ifNull: ['$$ROOT.settlement.feeAmount', 0] } },
          
          totalAgentFeeAmount: { $sum: { $ifNull: ['$$ROOT.settlement.agentFeeAmount', 0] } },

        },
      },
    ], {
      maxTimeMS: ESCROW_BALANCE_QUERY_MAX_TIME_MS,
    }).toArray();

    //console.log('getEscrowBalanceByStorecode totalSettlement: ' + JSON.stringify(totalSettlement));


    if (totalSettlement.length === 0) {

      const result = {
        escrowBalance: store.escrowAmountUSDT || 0,
        todayMinusedEscrowAmount: 0,
      };
      setBuyOrderCachedValue(cacheKey, result);
      return result;

    } else {

      const totalFeeAmount = totalSettlement[0].totalFeeAmount || 0;

      const totalAgentFeeAmount = totalSettlement[0].totalAgentFeeAmount || 0;

      const todayMinusedEscrowAmount = totalFeeAmount + totalAgentFeeAmount;

      // calculate escrow balance
      const escrowBalance = (store.escrowAmountUSDT || 0) - todayMinusedEscrowAmount;

      const result = {
        escrowBalance: escrowBalance,
        todayMinusedEscrowAmount: todayMinusedEscrowAmount,
      };
      setBuyOrderCachedValue(cacheKey, result);
      return result;

    }

  }


}




// getPaymentRequestedCount
export async function getPaymentRequestedCount(
  storecode: string,
  walletAddress: string,
  ordersLimit?: number,
) {

  //console.log('getPaymentRequestedCount storecode: ' + storecode);
  //console.log('getPaymentRequestedCount walletAddress: ' + walletAddress);

  const client = await clientPromise;
  const collection = client.db(dbName).collection('buyorders');
  void ensureBuyOrderReadIndexes(collection);

  const safeStorecode = String(storecode || "").trim();
  const parsedOrdersLimit = Number(ordersLimit);
  const safeOrdersLimit = Number.isFinite(parsedOrdersLimit)
    ? Math.min(300, Math.max(1, Math.trunc(parsedOrdersLimit)))
    : 100;
  const cacheKey = `paymentRequested:${safeStorecode || "__all__"}:${String(walletAddress || "").trim().toLowerCase()}:${safeOrdersLimit}`;
  const cached = getBuyOrderCachedValue(cacheKey);
  if (cached !== undefined) {
    return cached;
  }

  const matchQuery: Record<string, unknown> = {
    privateSale: true,
    'buyer.depositName': { $eq: '' },
    status: 'paymentRequested',
  };

  if (safeStorecode) {
    matchQuery.storecode = safeStorecode;
  }

  const [totalCount, orders] = await Promise.all([
    collection.countDocuments(matchQuery, { maxTimeMS: 12000 }),
    collection
      .find<any>(
        matchQuery,
        {
          projection: {
            _id: 1,
            tradeId: 1,
            store: 1,
            seller: 1,
            createdAt: 1,
          },
          maxTimeMS: 12000,
        },
      )
      .sort({ createdAt: -1 })
      .limit(safeOrdersLimit)
      .toArray(),
  ]);

  const result = {
    totalCount: Number(totalCount || 0),
    orders: Array.isArray(orders) ? orders : [],
    ordersLimit: safeOrdersLimit,
  };

  setBuyOrderCachedValue(cacheKey, result);
  return result;
}



// updateAudioNotification
export async function updateAudioNotification(data: any) {

  if (!data.orderId || data.audioOn === undefined) {
    return null;
  }

  const client = await clientPromise;
  const collection = client.db(dbName).collection('buyorders');

  const result = await collection.updateOne(
    { _id: new ObjectId(data.orderId) },
    { $set: { audioOn: data.audioOn } }
  );
  
  if (result.modifiedCount === 1) {
    const updated = await collection.findOne<OrderProps>(
      { _id: new ObjectId(data.orderId) }
    );
    return updated;
  } else {
    return null;
  }
}





// updateBuyerBankInfoUpdate
// response updated order
export async function updateBuyerBankInfoUpdate(
  {
    tradeId,
    buyerBankInfo,
  }: {
    tradeId: string;
    buyerBankInfo: any;
  }): Promise<any | null> {
  const client = await clientPromise;
  const collection = client.db(dbName).collection('buyorders');
  // update buyorder
  const result = await collection.updateOne(
    { tradeId: tradeId },
    { $set: {
      'buyer.bankInfo': buyerBankInfo,
    } }
  );
  if (result.modifiedCount === 1) {
    const updatedOrder = await collection.findOne<any>(
      { tradeId: tradeId }
    );
    return updatedOrder;
  } else {
    return null;
  }
}



// check match from buyorders collection
// when buyerDepositName and krwAmount match
// and 10 minute within createdAt
// return tradeId

// buyerDepositName: "김윤중(점중스튜"

export async function checkBuyOrderMatchDeposit(
  {
    buyerDepositName,
    krwAmount,
  }: {
    buyerDepositName: string;
    krwAmount: number;
  }
): Promise<{
  tradeId: string;
  buyer: any;
  seller: any;
} | null> {
  
  const client = await clientPromise;
  const collection = client.db(dbName).collection('buyorders');
  
  // 10 minutes ago
  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  const buyerDepositNameRegex = `^${escapeRegex(String(buyerDepositName || "").trim())}$`;


  const result = await collection.findOne<any>(
    {
      'buyer.bankTransferMatched': { $ne: true }, // bankTransferMatched is not true

      'buyer.depositName': { $regex: buyerDepositNameRegex, $options: 'i' }, // case insensitive match
      krwAmount: krwAmount,

      createdAt: { $gte: tenMinutesAgo },
    },
    { projection: {
      tradeId: 1,
      nickname: 1,
      buyer: 1,
      seller: 1,
    } }
  );
  
  if (result) {

    // update check bankTransferMatched to true
    const updateResult = await collection.updateOne(
      { tradeId: result.tradeId },
      { $set: { 'buyer.bankTransferMatched': true } }
    );

    if (updateResult.modifiedCount !== 1) {
      console.log('checkBuyOrderMatchDeposit: failed to update bankTransferMatched for tradeId: ' + result.tradeId);
    }


    return {
      tradeId: result.tradeId,
      buyer: {
        nickname: result.nickname,
        bankInfo: result.buyer,
      },
      seller: result.seller,
    }

  } else {
    return null;
  }

}
