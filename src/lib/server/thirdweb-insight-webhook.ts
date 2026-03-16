import { createHash, createHmac, timingSafeEqual } from "crypto";

import {
  arbitrumContractAddressUSDT,
  bscContractAddressUSDT,
  chain as appChain,
  ethereumContractAddressUSDT,
  polygonContractAddressUSDT,
} from "@/app/config/contractAddresses";
import type { UsdtTransactionHashRealtimeEvent } from "@lib/ably/constants";
import { createUsdtTransactionHashRealtimeEvent } from "@lib/api/tokenTransfer";
import clientPromise, { dbName } from "@/lib/mongodb";
import { normalizeWalletAddress } from "@/lib/server/user-read-security";

export const THIRDWEB_INSIGHT_WEBHOOK_ID_HEADER = "x-webhook-id";
export const THIRDWEB_INSIGHT_WEBHOOK_SIGNATURE_HEADER = "x-webhook-signature";
export const THIRDWEB_INSIGHT_USDT_TRANSFER_TOPIC = "v1.events";
export const THIRDWEB_INSIGHT_ERC20_TRANSFER_SIG_HASH =
  "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";
export const THIRDWEB_INSIGHT_USDT_TRANSFER_FILTER_HINT =
  "v1.events · USDT Transfer(address,address,uint256) · store-configured server wallets + active buyer wallets";
export const THIRDWEB_INSIGHT_MANAGED_WEBHOOK_COLLECTION = "thirdwebInsightManagedWebhooks";
export const THIRDWEB_INSIGHT_WEBHOOK_INGRESS_LOG_COLLECTION = "thirdwebInsightWebhookIngressLogs";
export const THIRDWEB_INSIGHT_MANAGED_WEBHOOK_NAME_PREFIX =
  "stable-georgia:store-wallet-usdt-scan";
const THIRDWEB_INSIGHT_TEST_WEBHOOK_SECRET = "test123";
const ACTIVE_BUYORDER_WATCH_STATUSES = [
  "ordered",
  "accepted",
  "paymentRequested",
  "paymentConfirmed",
] as const;

type ThirdwebInsightWebhookEnvelope = {
  topic?: unknown;
  timestamp?: unknown;
  data?: unknown;
};

type ThirdwebInsightWebhookItem = {
  id?: unknown;
  status?: unknown;
  type?: unknown;
  data?: unknown;
};

export type ThirdwebMonitoredWalletKind = "seller" | "privateSeller" | "settlement" | "buyer";

type ThirdwebWalletRecord = {
  walletAddress: string;
  storecode: string | null;
  storeName: string | null;
  storeLogo: string | null;
  storecodes: string[];
  walletKinds: ThirdwebMonitoredWalletKind[];
};

export type ThirdwebSellerWalletRecord = ThirdwebWalletRecord;
export type ThirdwebMonitoredWalletRecord = ThirdwebWalletRecord;

type ExtractThirdwebSellerUsdtTransferEventsResult = {
  topic: string;
  receivedCount: number;
  acceptedCount: number;
  skippedCount: number;
  skippedReasons: Record<string, number>;
  events: UsdtTransactionHashRealtimeEvent[];
};

type VerifyThirdwebInsightWebhookResult =
  | {
      ok: true;
      webhookId: string | null;
      signature: string;
      secretName: string;
      isTestWebhook?: boolean;
    }
  | {
      ok: false;
      status: number;
      error: string;
    };

type ManagedWebhookSecretRecord = {
  webhookId: string;
  webhookSecret: string;
  name: string | null;
};

type ThirdwebInsightWebhookIngressLogInput = {
  route: string;
  outcome:
    | "accepted"
    | "processed_no_match"
    | "seller_mismatch"
    | "rejected_signature"
    | "rejected_payload"
    | "rejected_age"
    | "rejected_topic";
  statusCode: number;
  rawBody: string;
  webhookId?: string | null;
  verified?: boolean;
  isTestWebhook?: boolean;
  secretName?: string | null;
  error?: string | null;
  topic?: string | null;
  sentAtIso?: string | null;
  remoteIp?: string | null;
  userAgent?: string | null;
  vercelRequestId?: string | null;
  signaturePresent?: boolean;
  signatureLength?: number;
  receivedCount?: number;
  acceptedCount?: number;
  skippedCount?: number;
  skippedReasons?: Record<string, number>;
  duplicateCount?: number;
  updatedCount?: number;
  publishedCount?: number;
  transactionHashes?: string[];
  queueIds?: string[];
  storecodes?: string[];
};

const DEFAULT_THIRDWEB_WEBHOOK_MAX_AGE_SECONDS = Math.max(
  Number.parseInt(process.env.THIRDWEB_INSIGHT_WEBHOOK_MAX_AGE_SECONDS || "", 10) || 15 * 60,
  30,
);
const SELLER_WALLET_CACHE_TTL_MS = Math.max(
  Number.parseInt(process.env.THIRDWEB_SELLER_WALLET_CACHE_TTL_MS || "", 10) || 30 * 1000,
  5 * 1000,
);
const MANAGED_WEBHOOK_SECRET_CACHE_TTL_MS = Math.max(
  Number.parseInt(process.env.THIRDWEB_MANAGED_WEBHOOK_SECRET_CACHE_TTL_MS || "", 10) || 30 * 1000,
  5 * 1000,
);
const THIRDWEB_INSIGHT_WEBHOOK_INGRESS_LOG_TTL_DAYS = Math.max(
  Number.parseInt(process.env.THIRDWEB_INSIGHT_WEBHOOK_INGRESS_LOG_TTL_DAYS || "", 10) || 30,
  1,
);

const globalThirdwebInsightWebhookState = globalThis as typeof globalThis & {
  __thirdwebSellerWalletCache?: {
    expiresAt: number;
    value: Map<string, ThirdwebSellerWalletRecord>;
  };
  __thirdwebSellerWalletPromise?: Promise<Map<string, ThirdwebSellerWalletRecord>>;
  __thirdwebMonitoredWalletCache?: {
    expiresAt: number;
    value: Map<string, ThirdwebMonitoredWalletRecord>;
  };
  __thirdwebMonitoredWalletPromise?: Promise<Map<string, ThirdwebMonitoredWalletRecord>>;
  __thirdwebManagedWebhookSecretCache?: Map<
    string,
    {
      expiresAt: number;
      value: ManagedWebhookSecretRecord | null;
    }
  >;
  __thirdwebWebhookIngressIndexPromise?: Promise<void>;
};

const normalizeText = (value: unknown): string => {
  if (typeof value === "string") {
    return value.trim();
  }
  if (value == null) {
    return "";
  }
  return String(value).trim();
};

const toNullableText = (value: unknown): string | null => {
  const normalized = normalizeText(value);
  return normalized || null;
};

const toLowerText = (value: unknown): string => normalizeText(value).toLowerCase();

const toArray = <T = unknown>(value: unknown): T[] => {
  return Array.isArray(value) ? (value as T[]) : [];
};

const toRecord = (value: unknown): Record<string, unknown> | null => {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
};

const toFiniteNumberOrNull = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number.parseInt(value.trim(), 10);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
};

const getConfiguredUsdtContractAddress = (): string => {
  if (appChain === "ethereum") {
    return ethereumContractAddressUSDT.toLowerCase();
  }
  if (appChain === "polygon") {
    return polygonContractAddressUSDT.toLowerCase();
  }
  if (appChain === "arbitrum") {
    return arbitrumContractAddressUSDT.toLowerCase();
  }
  return bscContractAddressUSDT.toLowerCase();
};

export const getThirdwebInsightUsdtContractAddress = (): string => getConfiguredUsdtContractAddress();

const getConfiguredChainName = (): string => {
  if (appChain === "ethereum" || appChain === "polygon" || appChain === "arbitrum" || appChain === "bsc") {
    return appChain;
  }
  return "bsc";
};

export const getThirdwebInsightChainName = (): string => getConfiguredChainName();

const getConfiguredChainId = (): string => {
  if (appChain === "ethereum") {
    return "1";
  }
  if (appChain === "polygon") {
    return "137";
  }
  if (appChain === "arbitrum") {
    return "42161";
  }
  return "56";
};

export const getThirdwebInsightChainId = (): string => getConfiguredChainId();

const getUsdtDecimalsForChainId = (chainIdRaw: unknown): number => {
  const chainId = normalizeText(chainIdRaw) || getConfiguredChainId();
  return chainId === "56" ? 18 : 6;
};

const resolveChainName = (chainIdRaw: unknown): string => {
  const chainId = normalizeText(chainIdRaw);
  if (chainId === "1") {
    return "ethereum";
  }
  if (chainId === "137") {
    return "polygon";
  }
  if (chainId === "42161") {
    return "arbitrum";
  }
  if (chainId === "56") {
    return "bsc";
  }
  return getConfiguredChainName();
};

const toIsoFromUnixSeconds = (value: unknown): string | null => {
  const numeric =
    typeof value === "number"
      ? value
      : Number.parseInt(normalizeText(value), 10);

  if (!Number.isFinite(numeric) || numeric <= 0) {
    return null;
  }

  return new Date(numeric * 1000).toISOString();
};

const formatUnitsToNumber = (rawValue: string, decimals: number): number => {
  try {
    const raw = BigInt(rawValue);
    const base = 10n ** BigInt(decimals);
    const integer = raw / base;
    const fraction = raw % base;
    const fractionText = fraction.toString().padStart(decimals, "0").replace(/0+$/, "");
    const normalized = fractionText ? `${integer}.${fractionText}` : integer.toString();
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
  } catch {
    return 0;
  }
};

const getWebhookSecret = (): { name: string; value: string } | null => {
  const candidates: Array<[string, string]> = [
    ["THIRDWEB_INSIGHT_WEBHOOK_SECRET", normalizeText(process.env.THIRDWEB_INSIGHT_WEBHOOK_SECRET)],
    ["THIRDWEB_WEBHOOK_SECRET", normalizeText(process.env.THIRDWEB_WEBHOOK_SECRET)],
  ];

  for (const [name, value] of candidates) {
    if (value) {
      return { name, value };
    }
  }

  return null;
};

const getWebhookIngressIndexPromise = () =>
  globalThirdwebInsightWebhookState.__thirdwebWebhookIngressIndexPromise || null;

const setWebhookIngressIndexPromise = (promise: Promise<void> | null) => {
  globalThirdwebInsightWebhookState.__thirdwebWebhookIngressIndexPromise = promise || undefined;
};

const getSellerWalletCache = () => globalThirdwebInsightWebhookState.__thirdwebSellerWalletCache || null;

const setSellerWalletCache = (value: Map<string, ThirdwebSellerWalletRecord>) => {
  globalThirdwebInsightWebhookState.__thirdwebSellerWalletCache = {
    value,
    expiresAt: Date.now() + SELLER_WALLET_CACHE_TTL_MS,
  };
};

const getSellerWalletPromise = () => globalThirdwebInsightWebhookState.__thirdwebSellerWalletPromise || null;

const setSellerWalletPromise = (promise: Promise<Map<string, ThirdwebSellerWalletRecord>> | null) => {
  globalThirdwebInsightWebhookState.__thirdwebSellerWalletPromise = promise || undefined;
};

const getMonitoredWalletCache = () => globalThirdwebInsightWebhookState.__thirdwebMonitoredWalletCache || null;

const setMonitoredWalletCache = (value: Map<string, ThirdwebMonitoredWalletRecord>) => {
  globalThirdwebInsightWebhookState.__thirdwebMonitoredWalletCache = {
    value,
    expiresAt: Date.now() + SELLER_WALLET_CACHE_TTL_MS,
  };
};

const getMonitoredWalletPromise = () => globalThirdwebInsightWebhookState.__thirdwebMonitoredWalletPromise || null;

const setMonitoredWalletPromise = (
  promise: Promise<Map<string, ThirdwebMonitoredWalletRecord>> | null,
) => {
  globalThirdwebInsightWebhookState.__thirdwebMonitoredWalletPromise = promise || undefined;
};

const getManagedWebhookSecretCache = () => {
  if (!globalThirdwebInsightWebhookState.__thirdwebManagedWebhookSecretCache) {
    globalThirdwebInsightWebhookState.__thirdwebManagedWebhookSecretCache = new Map();
  }
  return globalThirdwebInsightWebhookState.__thirdwebManagedWebhookSecretCache;
};

const getCachedManagedWebhookSecret = (webhookId: string) => {
  const cache = getManagedWebhookSecretCache();
  const cached = cache.get(webhookId);
  if (!cached) {
    return undefined;
  }
  if (cached.expiresAt <= Date.now()) {
    cache.delete(webhookId);
    return undefined;
  }
  return cached.value;
};

const setCachedManagedWebhookSecret = (
  webhookId: string,
  value: ManagedWebhookSecretRecord | null,
) => {
  getManagedWebhookSecretCache().set(webhookId, {
    value,
    expiresAt: Date.now() + MANAGED_WEBHOOK_SECRET_CACHE_TTL_MS,
  });
};

export const clearThirdwebManagedWebhookSecretCache = () => {
  getManagedWebhookSecretCache().clear();
};

export const clearThirdwebSellerWalletCache = () => {
  delete globalThirdwebInsightWebhookState.__thirdwebSellerWalletCache;
  delete globalThirdwebInsightWebhookState.__thirdwebSellerWalletPromise;
  delete globalThirdwebInsightWebhookState.__thirdwebMonitoredWalletCache;
  delete globalThirdwebInsightWebhookState.__thirdwebMonitoredWalletPromise;
};

export const clearThirdwebMonitoredWalletCache = () => {
  delete globalThirdwebInsightWebhookState.__thirdwebMonitoredWalletCache;
  delete globalThirdwebInsightWebhookState.__thirdwebMonitoredWalletPromise;
};

const ensureThirdwebWebhookIngressLogIndexes = async () => {
  const existingPromise = getWebhookIngressIndexPromise();
  if (existingPromise) {
    return existingPromise;
  }

  const nextPromise = (async () => {
    const client = await clientPromise;
    const database = client.db(dbName);
    const collection = database.collection(THIRDWEB_INSIGHT_WEBHOOK_INGRESS_LOG_COLLECTION);
    await Promise.all([
      collection.createIndex({ createdAt: -1 }),
      collection.createIndex({ outcome: 1, createdAt: -1 }),
      collection.createIndex({ webhookId: 1, createdAt: -1 }),
      collection.createIndex({ verified: 1, createdAt: -1 }),
      collection.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
    ]);
  })()
    .catch((error) => {
      setWebhookIngressIndexPromise(null);
      throw error;
    });

  setWebhookIngressIndexPromise(nextPromise);
  return nextPromise;
};

const safeUniqueLimitedStrings = (values: unknown[], limit = 20): string[] => {
  const unique = new Set<string>();

  for (const value of values) {
    const normalized = toNullableText(value);
    if (!normalized) {
      continue;
    }

    unique.add(normalized);
    if (unique.size >= limit) {
      break;
    }
  }

  return [...unique];
};

const summarizeThirdwebWebhookEnvelope = (rawBody: string) => {
  try {
    const envelope = parseThirdwebInsightWebhookEnvelope(rawBody);
    const items = toArray<ThirdwebInsightWebhookItem>(envelope.data);
    const transactionHashes = safeUniqueLimitedStrings(
      items.map((item) => {
        const payload = toRecord(item?.data);
        return payload?.transaction_hash || payload?.transactionHash || null;
      }),
    );
    const itemIds = safeUniqueLimitedStrings(items.map((item) => item?.id));
    const envelopeTimestamp = toFiniteNumberOrNull(envelope.timestamp);

    return {
      topic: toNullableText(envelope.topic),
      envelopeTimestamp: envelopeTimestamp ? new Date(envelopeTimestamp * 1000).toISOString() : null,
      receivedCount: items.length,
      transactionHashes,
      itemIds,
    };
  } catch {
    return {
      topic: null,
      envelopeTimestamp: null,
      receivedCount: 0,
      transactionHashes: [],
      itemIds: [],
    };
  }
};

export const insertThirdwebInsightWebhookIngressLog = async (
  input: ThirdwebInsightWebhookIngressLogInput,
) => {
  try {
    const envelopeSummary = summarizeThirdwebWebhookEnvelope(input.rawBody);
    const bodyBytes = Buffer.byteLength(input.rawBody, "utf8");
    const bodySha256 = createHash("sha256").update(input.rawBody).digest("hex");
    const createdAt = new Date();
    const expiresAt = new Date(
      createdAt.getTime() + THIRDWEB_INSIGHT_WEBHOOK_INGRESS_LOG_TTL_DAYS * 24 * 60 * 60 * 1000,
    );

    await ensureThirdwebWebhookIngressLogIndexes();

    const client = await clientPromise;
    const database = client.db(dbName);
    const collection = database.collection(THIRDWEB_INSIGHT_WEBHOOK_INGRESS_LOG_COLLECTION);

    await collection.insertOne({
      route: toNullableText(input.route),
      outcome: input.outcome,
      statusCode: input.statusCode,
      verified: Boolean(input.verified),
      isTestWebhook: Boolean(input.isTestWebhook),
      secretName: toNullableText(input.secretName),
      error: toNullableText(input.error),
      webhookId: toNullableText(input.webhookId),
      topic: toNullableText(input.topic) || envelopeSummary.topic,
      sentAt: toNullableText(input.sentAtIso),
      envelopeTimestamp: envelopeSummary.envelopeTimestamp,
      remoteIp: toNullableText(input.remoteIp),
      userAgent: toNullableText(input.userAgent),
      vercelRequestId: toNullableText(input.vercelRequestId),
      signaturePresent: Boolean(input.signaturePresent),
      signatureLength: Math.max(Number(input.signatureLength) || 0, 0),
      bodyBytes,
      bodySha256,
      receivedCount:
        typeof input.receivedCount === "number"
          ? input.receivedCount
          : envelopeSummary.receivedCount,
      acceptedCount: Math.max(Number(input.acceptedCount) || 0, 0),
      skippedCount: Math.max(Number(input.skippedCount) || 0, 0),
      skippedReasons: toRecord(input.skippedReasons) || {},
      duplicateCount: Math.max(Number(input.duplicateCount) || 0, 0),
      updatedCount: Math.max(Number(input.updatedCount) || 0, 0),
      publishedCount: Math.max(Number(input.publishedCount) || 0, 0),
      transactionHashes: safeUniqueLimitedStrings([
        ...envelopeSummary.transactionHashes,
        ...(Array.isArray(input.transactionHashes) ? input.transactionHashes : []),
      ]),
      itemIds: envelopeSummary.itemIds,
      queueIds: safeUniqueLimitedStrings(Array.isArray(input.queueIds) ? input.queueIds : []),
      storecodes: safeUniqueLimitedStrings(Array.isArray(input.storecodes) ? input.storecodes : []),
      createdAt,
      expiresAt,
    });
  } catch (error) {
    console.error("Failed to insert thirdweb webhook ingress log:", error);
  }
};

const loadManagedWebhookSecretRecord = async (
  webhookId: string,
): Promise<ManagedWebhookSecretRecord | null> => {
  const client = await clientPromise;
  const database = client.db(dbName);
  const collection = database.collection(THIRDWEB_INSIGHT_MANAGED_WEBHOOK_COLLECTION);
  const record = await collection.findOne(
    { webhookId },
    {
      projection: {
        _id: 0,
        webhookId: 1,
        webhookSecret: 1,
        name: 1,
      },
    },
  );

  const normalizedWebhookId = toNullableText(record?.webhookId);
  const normalizedWebhookSecret = toNullableText(record?.webhookSecret);
  if (!normalizedWebhookId || !normalizedWebhookSecret) {
    return null;
  }

  return {
    webhookId: normalizedWebhookId,
    webhookSecret: normalizedWebhookSecret,
    name: toNullableText(record?.name),
  };
};

export const getThirdwebManagedWebhookSecretById = async (
  webhookIdRaw: unknown,
): Promise<ManagedWebhookSecretRecord | null> => {
  const webhookId = toNullableText(webhookIdRaw);
  if (!webhookId) {
    return null;
  }

  const cached = getCachedManagedWebhookSecret(webhookId);
  if (cached !== undefined) {
    return cached;
  }

  const loaded = await loadManagedWebhookSecretRecord(webhookId);
  setCachedManagedWebhookSecret(webhookId, loaded);
  return loaded;
};

const mergeWalletKind = (
  walletKinds: ThirdwebMonitoredWalletKind[],
  walletKind: ThirdwebMonitoredWalletKind,
): ThirdwebMonitoredWalletKind[] => {
  if (walletKinds.includes(walletKind)) {
    return walletKinds;
  }

  return [...walletKinds, walletKind];
};

const mergeStorecodes = (storecodes: Array<string | null | undefined>): string[] => {
  const uniqueStorecodes = new Set<string>();
  for (const storecodeRaw of storecodes) {
    const storecode = toLowerText(storecodeRaw);
    if (storecode) {
      uniqueStorecodes.add(storecode);
    }
  }
  return [...uniqueStorecodes].sort((left, right) => left.localeCompare(right));
};

const resolvePrimaryStoreContext = ({
  existing,
  storecode,
  storecodes: candidateStorecodes,
  storeName,
  storeLogo,
}: {
  existing?: ThirdwebWalletRecord | null;
  storecode: string | null;
  storecodes?: string[];
  storeName: string | null;
  storeLogo: string | null;
}) => {
  const storecodes = mergeStorecodes([
    ...(existing?.storecodes || []),
    existing?.storecode || null,
    ...(candidateStorecodes || []),
    storecode,
  ]);

  if (storecodes.length !== 1) {
    return {
      storecodes,
      storecode: null,
      storeName: null,
      storeLogo: null,
    };
  }

  const onlyStorecode = storecodes[0];
  const shouldPreferExisting = existing?.storecode === onlyStorecode;

  return {
    storecodes,
    storecode: onlyStorecode,
    storeName: shouldPreferExisting ? existing?.storeName || storeName : storeName,
    storeLogo: shouldPreferExisting ? existing?.storeLogo || storeLogo : storeLogo,
  };
};

const upsertSellerWalletRecord = ({
  sellerMap,
  walletAddress,
  walletKind,
  storecode,
  storecodes,
  storeName,
  storeLogo,
}: {
  sellerMap: Map<string, ThirdwebSellerWalletRecord>;
  walletAddress: string;
  walletKind: ThirdwebMonitoredWalletKind;
  storecode: string | null;
  storecodes?: string[];
  storeName: string | null;
  storeLogo: string | null;
}) => {
  const existing = sellerMap.get(walletAddress);
  const primaryStoreContext = resolvePrimaryStoreContext({
    existing,
    storecode,
    storecodes,
    storeName,
    storeLogo,
  });
  if (existing) {
    sellerMap.set(walletAddress, {
      walletAddress,
      storecode: primaryStoreContext.storecode,
      storeName: primaryStoreContext.storeName,
      storeLogo: primaryStoreContext.storeLogo,
      storecodes: primaryStoreContext.storecodes,
      walletKinds: mergeWalletKind(existing.walletKinds, walletKind),
    });
    return;
  }

  sellerMap.set(walletAddress, {
    walletAddress,
    storecode: primaryStoreContext.storecode,
    storeName: primaryStoreContext.storeName,
    storeLogo: primaryStoreContext.storeLogo,
    storecodes: primaryStoreContext.storecodes,
    walletKinds: [walletKind],
  });
};

const loadSellerWalletRecords = async (): Promise<Map<string, ThirdwebSellerWalletRecord>> => {
  const client = await clientPromise;
  const database = client.db(dbName);
  const storeCollection = database.collection("stores");

  const stores = await storeCollection
    .find(
      {
        $or: [
          { sellerWalletAddress: { $type: "string", $ne: "" } },
          { privateSellerWalletAddress: { $type: "string", $ne: "" } },
          { settlementWalletAddress: { $type: "string", $ne: "" } },
        ],
      },
      {
        projection: {
          _id: 0,
          storecode: 1,
          storeName: 1,
          storeLogo: 1,
          sellerWalletAddress: 1,
          privateSellerWalletAddress: 1,
          settlementWalletAddress: 1,
          updatedAt: 1,
        },
        sort: {
          updatedAt: -1,
          _id: -1,
        },
      },
    )
    .toArray();

  const sellerMap = new Map<string, ThirdwebSellerWalletRecord>();

  for (const store of stores) {
    const storecode = toLowerText(store?.storecode) || null;
    const storeName = toNullableText(store?.storeName);
    const storeLogo = toNullableText(store?.storeLogo);

    const sellerWalletAddress = normalizeWalletAddress(store?.sellerWalletAddress);
    if (sellerWalletAddress) {
      upsertSellerWalletRecord({
        sellerMap,
        walletAddress: sellerWalletAddress,
        walletKind: "seller",
        storecode,
        storeName,
        storeLogo,
      });
    }

    const privateSellerWalletAddress = normalizeWalletAddress(store?.privateSellerWalletAddress);
    if (privateSellerWalletAddress) {
      upsertSellerWalletRecord({
        sellerMap,
        walletAddress: privateSellerWalletAddress,
        walletKind: "privateSeller",
        storecode,
        storeName,
        storeLogo,
      });
    }

    const settlementWalletAddress = normalizeWalletAddress(store?.settlementWalletAddress);
    if (settlementWalletAddress) {
      upsertSellerWalletRecord({
        sellerMap,
        walletAddress: settlementWalletAddress,
        walletKind: "settlement",
        storecode,
        storeName,
        storeLogo,
      });
    }
  }

  return sellerMap;
};

const getBuyOrderBuyerWalletAddress = (order: any): string | null => {
  return normalizeWalletAddress(order?.walletAddress || order?.buyer?.walletAddress);
};

const loadActiveBuyerWalletRecords = async (): Promise<Map<string, ThirdwebMonitoredWalletRecord>> => {
  const client = await clientPromise;
  const database = client.db(dbName);
  const buyOrderCollection = database.collection("buyorders");
  const storeCollection = database.collection("stores");

  const activeOrders = await buyOrderCollection
    .find(
      {
        status: { $in: [...ACTIVE_BUYORDER_WATCH_STATUSES] },
        $or: [
          { walletAddress: { $type: "string", $ne: "" } },
          { "buyer.walletAddress": { $type: "string", $ne: "" } },
        ],
      },
      {
        projection: {
          _id: 0,
          storecode: 1,
          walletAddress: 1,
          buyer: 1,
          paymentConfirmedAt: 1,
          paymentRequestedAt: 1,
          acceptedAt: 1,
          updatedAt: 1,
          createdAt: 1,
        },
        sort: {
          paymentConfirmedAt: -1,
          paymentRequestedAt: -1,
          acceptedAt: -1,
          updatedAt: -1,
          createdAt: -1,
        },
      },
    )
    .toArray();

  const storecodes = new Set<string>();
  for (const order of activeOrders) {
    const storecode = toLowerText(order?.storecode);
    if (storecode) {
      storecodes.add(storecode);
    }
  }

  const stores = storecodes.size > 0
    ? await storeCollection
        .find(
          { storecode: { $in: [...storecodes] } },
          {
            projection: {
              _id: 0,
              storecode: 1,
              storeName: 1,
              storeLogo: 1,
            },
          },
        )
        .toArray()
    : [];

  const storeMap = new Map(
    stores.map((store) => [
      toLowerText(store?.storecode),
      {
        storeName: toNullableText(store?.storeName),
        storeLogo: toNullableText(store?.storeLogo),
      },
    ]),
  );

  const buyerMap = new Map<string, ThirdwebMonitoredWalletRecord>();

  for (const order of activeOrders) {
    const walletAddress = getBuyOrderBuyerWalletAddress(order);
    if (!walletAddress) {
      continue;
    }

    const storecode = toLowerText(order?.storecode) || null;
    const storeMeta = storecode ? storeMap.get(storecode) || null : null;

    upsertSellerWalletRecord({
      sellerMap: buyerMap,
      walletAddress,
      walletKind: "buyer",
      storecode,
      storeName: storeMeta?.storeName || null,
      storeLogo: storeMeta?.storeLogo || null,
    });
  }

  return buyerMap;
};

const loadThirdwebMonitoredWalletRecords = async (): Promise<Map<string, ThirdwebMonitoredWalletRecord>> => {
  const [sellerMap, buyerMap] = await Promise.all([
    loadSellerWalletRecords(),
    loadActiveBuyerWalletRecords(),
  ]);

  const monitoredMap = new Map<string, ThirdwebMonitoredWalletRecord>(sellerMap);

  for (const buyerRecord of buyerMap.values()) {
    upsertSellerWalletRecord({
      sellerMap: monitoredMap,
      walletAddress: buyerRecord.walletAddress,
      walletKind: "buyer",
      storecode: buyerRecord.storecode,
      storecodes: buyerRecord.storecodes,
      storeName: buyerRecord.storeName,
      storeLogo: buyerRecord.storeLogo,
    });
  }

  return monitoredMap;
};

const getSellerWalletRecordsMap = async (): Promise<Map<string, ThirdwebSellerWalletRecord>> => {
  const cached = getSellerWalletCache();
  if (cached && cached.expiresAt > Date.now()) {
    return cached.value;
  }

  const existingPromise = getSellerWalletPromise();
  if (existingPromise) {
    return existingPromise;
  }

  const nextPromise = loadSellerWalletRecords()
    .then((value) => {
      setSellerWalletCache(value);
      return value;
    })
    .finally(() => {
      setSellerWalletPromise(null);
    });

  setSellerWalletPromise(nextPromise);
  return nextPromise;
};

export const getThirdwebSellerWalletRecords = async (): Promise<ThirdwebSellerWalletRecord[]> => {
  const sellerMap = await getSellerWalletRecordsMap();
  return Array.from(sellerMap.values()).sort((left, right) =>
    left.walletAddress.localeCompare(right.walletAddress),
  );
};

const getThirdwebMonitoredWalletRecordsMap = async (): Promise<Map<string, ThirdwebMonitoredWalletRecord>> => {
  const cached = getMonitoredWalletCache();
  if (cached && cached.expiresAt > Date.now()) {
    return cached.value;
  }

  const existingPromise = getMonitoredWalletPromise();
  if (existingPromise) {
    return existingPromise;
  }

  const nextPromise = loadThirdwebMonitoredWalletRecords()
    .then((value) => {
      setMonitoredWalletCache(value);
      return value;
    })
    .finally(() => {
      setMonitoredWalletPromise(null);
    });

  setMonitoredWalletPromise(nextPromise);
  return nextPromise;
};

export const getThirdwebMonitoredWalletRecords = async (): Promise<ThirdwebMonitoredWalletRecord[]> => {
  const monitoredMap = await getThirdwebMonitoredWalletRecordsMap();
  return Array.from(monitoredMap.values()).sort((left, right) =>
    left.walletAddress.localeCompare(right.walletAddress),
  );
};

const getWalletKindLabel = (walletKind: ThirdwebMonitoredWalletKind): string => {
  if (walletKind === "privateSeller") {
    return "private-seller";
  }
  if (walletKind === "buyer") {
    return "buyer";
  }
  return walletKind;
};

const buildMonitoredWalletLabel = (wallet: ThirdwebMonitoredWalletRecord): string => {
  const walletKindText = wallet.walletKinds.length > 0
    ? wallet.walletKinds.map(getWalletKindLabel).join(",")
    : "monitored-wallet";
  const scopedWalletKindText =
    wallet.storecodes.length > 1
      ? `${walletKindText}:${wallet.storecodes[0]}+${wallet.storecodes.length - 1}`
      : wallet.storecode
        ? `${walletKindText}:${wallet.storecode}`
        : walletKindText;
  const parts = [
    wallet.storecodes.length === 1 ? wallet.storeName : null,
    scopedWalletKindText,
  ].filter(Boolean);

  if (parts.length > 0) {
    return parts.join(" · ");
  }

  return wallet.walletKinds.includes("buyer") ? "active buyer wallet" : "store server wallet";
};

const selectPrimaryMonitoredWallet = (
  ...wallets: Array<ThirdwebMonitoredWalletRecord | null>
): ThirdwebMonitoredWalletRecord | null => {
  return (
    wallets.find(
      (wallet) =>
        wallet &&
        wallet.walletKinds.some((walletKind) => walletKind !== "buyer") &&
        wallet.storecode,
    ) ||
    wallets.find(
      (wallet) => wallet && wallet.walletKinds.some((walletKind) => walletKind !== "buyer"),
    ) ||
    wallets.find((wallet) => wallet && wallet.storecode) ||
    wallets.find(Boolean) ||
    null
  );
};

const buildFallbackWebhookItemKey = ({
  transactionHash,
  contractAddress,
  fromWalletAddress,
  toWalletAddress,
  rawAmount,
}: {
  transactionHash: string;
  contractAddress: string;
  fromWalletAddress: string | null;
  toWalletAddress: string | null;
  rawAmount: string;
}) => {
  return [
    "thirdweb-fallback",
    transactionHash.toLowerCase(),
    contractAddress.toLowerCase(),
    (fromWalletAddress || "").toLowerCase(),
    (toWalletAddress || "").toLowerCase(),
    rawAmount,
  ].join(":");
};

const incrementReason = (store: Record<string, number>, key: string) => {
  store[key] = (store[key] || 0) + 1;
};

const isValidThirdwebWebhookSignature = ({
  rawBody,
  signature,
  secretValue,
}: {
  rawBody: string;
  signature: string;
  secretValue: string;
}): boolean => {
  const expectedSignature = createHmac("sha256", secretValue).update(rawBody).digest("hex");
  const expectedBuffer = Buffer.from(expectedSignature);
  const receivedBuffer = Buffer.from(signature);

  return (
    expectedBuffer.length === receivedBuffer.length &&
    timingSafeEqual(expectedBuffer, receivedBuffer)
  );
};

export const verifyThirdwebInsightWebhook = async ({
  rawBody,
  webhookIdRaw,
  signatureRaw,
}: {
  rawBody: string;
  webhookIdRaw: unknown;
  signatureRaw: unknown;
}): Promise<VerifyThirdwebInsightWebhookResult> => {
  const webhookId = toNullableText(webhookIdRaw);
  const signature = normalizeText(signatureRaw).replace(/^sha256=/i, "").toLowerCase();
  if (!signature) {
    return {
      ok: false,
      status: 401,
      error: "Missing thirdweb webhook signature",
    };
  }

  if (webhookId) {
    const managedSecret = await getThirdwebManagedWebhookSecretById(webhookId);
    if (managedSecret) {
      if (!isValidThirdwebWebhookSignature({
        rawBody,
        signature,
        secretValue: managedSecret.webhookSecret,
      })) {
        if (
          isValidThirdwebWebhookSignature({
            rawBody,
            signature,
            secretValue: THIRDWEB_INSIGHT_TEST_WEBHOOK_SECRET,
          })
        ) {
          return {
            ok: true,
            webhookId,
            signature,
            secretName: "THIRDWEB_INSIGHT_TEST_WEBHOOK_SECRET",
            isTestWebhook: true,
          };
        }

        return {
          ok: false,
          status: 401,
          error: "Invalid thirdweb webhook signature",
        };
      }

      return {
        ok: true,
        webhookId,
        signature,
        secretName: managedSecret.name || THIRDWEB_INSIGHT_MANAGED_WEBHOOK_COLLECTION,
      };
    }
  }

  const secret = getWebhookSecret();
  if (!secret) {
    return {
      ok: false,
      status: 500,
      error: "Thirdweb webhook secret is not configured",
    };
  }

  if (!isValidThirdwebWebhookSignature({
    rawBody,
    signature,
    secretValue: secret.value,
  })) {
    return {
      ok: false,
      status: 401,
      error: "Invalid thirdweb webhook signature",
    };
  }

  return {
    ok: true,
    webhookId,
    signature,
    secretName: secret.name,
  };
};

export const parseThirdwebInsightWebhookEnvelope = (
  rawBody: string,
): ThirdwebInsightWebhookEnvelope => {
  const parsed = JSON.parse(rawBody);
  return toRecord(parsed) || {};
};

export const validateThirdwebInsightWebhookAge = (
  timestampRaw: unknown,
): { ok: true; sentAtIso: string | null } | { ok: false; status: number; error: string } => {
  const timestamp = Number.parseInt(normalizeText(timestampRaw), 10);
  if (!Number.isFinite(timestamp) || timestamp <= 0) {
    return {
      ok: false,
      status: 400,
      error: "Invalid thirdweb webhook timestamp",
    };
  }

  const nowSeconds = Math.floor(Date.now() / 1000);
  if (Math.abs(nowSeconds - timestamp) > DEFAULT_THIRDWEB_WEBHOOK_MAX_AGE_SECONDS) {
    return {
      ok: false,
      status: 408,
      error: "Expired thirdweb webhook payload",
    };
  }

  return {
    ok: true,
    sentAtIso: new Date(timestamp * 1000).toISOString(),
  };
};

export const extractThirdwebSellerUsdtTransferEvents = async (
  envelope: ThirdwebInsightWebhookEnvelope,
): Promise<ExtractThirdwebSellerUsdtTransferEventsResult> => {
  const topic = normalizeText(envelope.topic);
  const items = toArray<ThirdwebInsightWebhookItem>(envelope.data);
  const monitoredWallets = new Map(
    (await getThirdwebMonitoredWalletRecords()).map((item) => [item.walletAddress, item]),
  );
  const configuredUsdtAddress = getConfiguredUsdtContractAddress();
  const skippedReasons: Record<string, number> = {};
  const events: UsdtTransactionHashRealtimeEvent[] = [];

  for (const item of items) {
    const itemType = toLowerText(item?.type);
    const itemStatus = toLowerText(item?.status);
    const itemId = normalizeText(item?.id);
    const payload = toRecord(item?.data);
    if (!payload) {
      incrementReason(skippedReasons, "invalid_payload");
      continue;
    }

    if (itemType !== "event") {
      incrementReason(skippedReasons, "unsupported_item_type");
      continue;
    }

    const contractAddress =
      normalizeWalletAddress(payload.address) ||
      normalizeWalletAddress(payload.contract_address);
    if (!contractAddress || contractAddress !== configuredUsdtAddress) {
      incrementReason(skippedReasons, "contract_mismatch");
      continue;
    }

    const topics = toArray<string>(payload.topics);
    const primaryTopic = normalizeText(topics[0]);
    const payloadSigHash =
      normalizeText(payload.sig_hash) ||
      normalizeText(payload.sigHash) ||
      normalizeText(toRecord(payload.params)?.sig_hash) ||
      normalizeText(toRecord(payload.params)?.sigHash);
    if (
      primaryTopic.toLowerCase() !== THIRDWEB_INSIGHT_ERC20_TRANSFER_SIG_HASH &&
      normalizeText(toRecord(payload.decoded)?.sig_hash).toLowerCase() !== THIRDWEB_INSIGHT_ERC20_TRANSFER_SIG_HASH &&
      payloadSigHash.toLowerCase() !== THIRDWEB_INSIGHT_ERC20_TRANSFER_SIG_HASH
    ) {
      incrementReason(skippedReasons, "signature_mismatch");
      continue;
    }

    const decoded = toRecord(payload.decoded);
    const payloadParams = toRecord(payload.params) || {};
    const indexedParams = toRecord(decoded?.indexed_params) || toRecord(decoded?.indexedParams) || payloadParams;
    const nonIndexedParams =
      toRecord(decoded?.non_indexed_params) || toRecord(decoded?.nonIndexedParams) || payloadParams;
    const fromWalletAddress = normalizeWalletAddress(indexedParams.from || payload.from);
    const toWalletAddress = normalizeWalletAddress(indexedParams.to || payload.to);
    const fromMonitored = fromWalletAddress ? monitoredWallets.get(fromWalletAddress) || null : null;
    const toMonitored = toWalletAddress ? monitoredWallets.get(toWalletAddress) || null : null;

    if (!fromMonitored && !toMonitored) {
      incrementReason(skippedReasons, "monitored_wallet_not_matched");
      continue;
    }

    const transactionHash =
      toNullableText(payload.transaction_hash) ||
      toNullableText(payload.transactionHash);
    if (!transactionHash) {
      incrementReason(skippedReasons, "missing_transaction_hash");
      continue;
    }

    const rawAmount =
      toNullableText(nonIndexedParams.amount) ||
      toNullableText(nonIndexedParams.value) ||
      toNullableText(nonIndexedParams.rawAmount) ||
      toNullableText(payload.value) ||
      toNullableText(payload.amount);
    if (!rawAmount) {
      incrementReason(skippedReasons, "missing_amount");
      continue;
    }

    const primaryMonitored = selectPrimaryMonitoredWallet(fromMonitored, toMonitored);
    if (!primaryMonitored) {
      incrementReason(skippedReasons, "monitored_wallet_not_matched");
      continue;
    }

    const webhookItemKey = itemId
      ? `thirdweb:event:${itemId}`
      : buildFallbackWebhookItemKey({
          transactionHash,
          contractAddress,
          fromWalletAddress,
          toWalletAddress,
          rawAmount,
        });
    const chainId = toNullableText(payload.chain_id) || getConfiguredChainId();
    const logIndex = toNullableText(payload.log_index) || toNullableText(payload.logIndex);
    const minedAt = toIsoFromUnixSeconds(payload.block_timestamp) || toIsoFromUnixSeconds(envelope.timestamp);
    const event = createUsdtTransactionHashRealtimeEvent(
      {
        eventId: itemId ? `thirdweb-event-${itemId}` : `thirdweb-event-${webhookItemKey}`,
        idempotencyKey: webhookItemKey,
        source: "thirdweb.insight.webhook",
        chain: resolveChainName(chainId),
        tokenSymbol: "USDT",
        storecode: primaryMonitored.storecode,
        store: primaryMonitored.storecode
          ? {
              code: primaryMonitored.storecode,
              name: primaryMonitored.storeName,
              logo: primaryMonitored.storeLogo,
            }
          : null,
        amountUsdt: formatUnitsToNumber(rawAmount, getUsdtDecimalsForChainId(chainId)),
        transactionHash,
        logIndex,
        fromWalletAddress,
        toWalletAddress,
        fromLabel: fromMonitored ? buildMonitoredWalletLabel(fromMonitored) : null,
        toLabel: toMonitored ? buildMonitoredWalletLabel(toMonitored) : null,
        status: itemStatus === "reverted" ? "reverted" : "confirmed",
        queueId: itemId ? `thirdweb:${itemId}` : null,
        minedAt,
        createdAt: minedAt || new Date().toISOString(),
        publishedAt: new Date().toISOString(),
      },
      {
        defaultSource: "thirdweb.insight.webhook",
        defaultStatus: "confirmed",
        defaultTokenSymbol: "USDT",
      },
    );

    if (!event) {
      incrementReason(skippedReasons, "event_normalization_failed");
      continue;
    }

    events.push(event);
  }

  return {
    topic,
    receivedCount: items.length,
    acceptedCount: events.length,
    skippedCount: Math.max(items.length - events.length, 0),
    skippedReasons,
    events,
  };
};
