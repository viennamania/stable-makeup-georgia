import { createHash } from "crypto";

import clientPromise from '../mongodb';

import { dbName } from '../mongodb';
import type { UsdtTransactionHashRealtimeEvent } from "@lib/ably/constants";
import { publishUsdtTransactionHashEvent } from "@lib/ably/server";
import {
  arbitrumContractAddressUSDT,
  bscContractAddressUSDT,
  chain as configuredChain,
  ethereumContractAddressUSDT,
  polygonContractAddressUSDT,
  thirdwebClientId,
} from "@/app/config/contractAddresses";
import { getThirdwebMonitoredWalletRecords } from "@/lib/server/thirdweb-insight-webhook";
import { normalizeWalletAddress } from "@/lib/server/user-read-security";


export interface TransactionHashLog {
  chain?: string;
  transactionHash: string;
  from?: string;
  to?: string;
  amount?: number;
  createdAt?: string | Date;
}

type RegisterUsdtTransactionHashRealtimeEventResult = {
  event: UsdtTransactionHashRealtimeEvent;
  isDuplicate: boolean;
  wasUpdated: boolean;
  wasPublished: boolean;
};

type GetLatestTransactionHashLogEventsParams = {
  limit?: number;
  address?: string | null;
};

type ScanUserWalletIdentity = NonNullable<UsdtTransactionHashRealtimeEvent["fromIdentity"]>;

type StoredTransactionHashLogDocument = {
  _id?: unknown;
  eventId?: unknown;
  idempotencyKey?: unknown;
  source?: unknown;
  orderId?: unknown;
  tradeId?: unknown;
  chain?: unknown;
  tokenSymbol?: unknown;
  store?: unknown;
  amountUsdt?: unknown;
  amount?: unknown;
  transactionHash?: unknown;
  logIndex?: unknown;
  fromWalletAddress?: unknown;
  toWalletAddress?: unknown;
  fromLabel?: unknown;
  toLabel?: unknown;
  fromIdentity?: unknown;
  toIdentity?: unknown;
  status?: unknown;
  queueId?: unknown;
  minedAt?: unknown;
  createdAt?: unknown;
  publishedAt?: unknown;
  from?: unknown;
  to?: unknown;
};

type ScanWalletUserRecord = {
  walletAddress: string;
  nickname: string | null;
  storecode: string | null;
  userType: string | null;
  role: string | null;
  buyerDepositName: string | null;
  buyerBankName: string | null;
  buyerAccountNumber: string | null;
  buyerAccountHolder: string | null;
  sellerBankName: string | null;
  sellerAccountNumber: string | null;
  sellerAccountHolder: string | null;
};

type ScanStoreBrandingRecord = {
  code: string;
  name: string | null;
  logo: string | null;
};

type ThirdwebInsightTokenTransferItem = {
  transaction_hash?: unknown;
  from_address?: unknown;
  to_address?: unknown;
  contract_address?: unknown;
  block_timestamp?: unknown;
  log_index?: unknown;
  amount?: unknown;
  chain_id?: unknown;
};

const PUBLIC_SCAN_EVENT_SOURCES = [
  "api.realtime.scan.usdt-token-transfers.ingest",
  "thirdweb.insight.webhook",
  "order.transactionHash.reconcile",
] as const;
const PUBLIC_SCAN_EVENT_SOURCE_SET = new Set<string>(PUBLIC_SCAN_EVENT_SOURCES);
const ACTIVE_SCAN_BUYER_STATUSES = [
  "ordered",
  "accepted",
  "paymentRequested",
  "paymentConfirmed",
] as const;
const THIRDWEB_OWNER_QUERY_SOURCE = "thirdweb.insight.tokens.transfers";
const BUYORDER_TRANSACTION_HASH_RECONCILE_SOURCE = "order.transactionHash.reconcile";
const SCAN_RECEIPT_RECONCILE_COOLDOWN_MS = Math.max(
  Number.parseInt(process.env.SCAN_RECEIPT_RECONCILE_COOLDOWN_MS || "", 10) || 2 * 60 * 1000,
  10 * 1000,
);
const SCAN_WALLET_USER_RECORD_CACHE_TTL_MS = Math.max(
  Number.parseInt(process.env.SCAN_WALLET_USER_RECORD_CACHE_TTL_MS || "", 10) || 30_000,
  5_000,
);
const SCAN_STORE_BRANDING_CACHE_TTL_MS = Math.max(
  Number.parseInt(process.env.SCAN_STORE_BRANDING_CACHE_TTL_MS || "", 10) || 60_000,
  5_000,
);
const SCAN_ACTIVE_BUYER_WALLET_CACHE_TTL_MS = Math.max(
  Number.parseInt(process.env.SCAN_ACTIVE_BUYER_WALLET_CACHE_TTL_MS || "", 10) || 15_000,
  5_000,
);

type TimedCacheEntry<T> = {
  expiresAt: number;
  value: T;
};

const scanWalletUserRecordCache = new Map<string, TimedCacheEntry<ScanWalletUserRecord[]>>();
const scanStoreBrandingCache = new Map<string, TimedCacheEntry<ScanStoreBrandingRecord | null>>();
const scanActiveBuyerWalletCache = new Map<string, TimedCacheEntry<boolean>>();

function getTimedCacheValue<T>(
  cache: Map<string, TimedCacheEntry<T>>,
  key: string,
): { hit: true; value: T } | { hit: false } {
  const entry = cache.get(key);
  if (!entry) {
    return { hit: false };
  }
  if (entry.expiresAt <= Date.now()) {
    cache.delete(key);
    return { hit: false };
  }
  return {
    hit: true,
    value: entry.value,
  };
}

function setTimedCacheValue<T>(
  cache: Map<string, TimedCacheEntry<T>>,
  key: string,
  value: T,
  ttlMs: number,
): void {
  cache.set(key, {
    expiresAt: Date.now() + ttlMs,
    value,
  });
}

type ReconcileUsdtTransactionHashByReceiptParams = {
  transactionHash: string | null | undefined;
  orderId?: string | null;
  tradeId?: string | null;
  queueId?: string | null;
  chain?: string | null;
  store?: UsdtTransactionHashRealtimeEvent["store"] | null;
  relevantWalletAddresses?: Array<string | null | undefined>;
};

type JsonRpcTransferLog = {
  address?: unknown;
  topics?: unknown;
  data?: unknown;
  logIndex?: unknown;
  blockTimestamp?: unknown;
  block_timestamp?: unknown;
};

type JsonRpcTransactionReceipt = {
  status?: unknown;
  logs?: unknown;
};

const globalScanReconcileState = globalThis as typeof globalThis & {
  __scanReceiptReconcileCooldowns?: Map<string, number>;
  __scanReceiptReconcilePromises?: Map<string, Promise<{ registeredCount: number; skippedReason: string | null }>>;
};

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const getScanReceiptReconcileCooldownStore = () => {
  if (!globalScanReconcileState.__scanReceiptReconcileCooldowns) {
    globalScanReconcileState.__scanReceiptReconcileCooldowns = new Map();
  }
  return globalScanReconcileState.__scanReceiptReconcileCooldowns;
};

const getScanReceiptReconcilePromiseStore = () => {
  if (!globalScanReconcileState.__scanReceiptReconcilePromises) {
    globalScanReconcileState.__scanReceiptReconcilePromises = new Map();
  }
  return globalScanReconcileState.__scanReceiptReconcilePromises;
};

const normalizeText = (value: unknown): string | null => {
  if (typeof value === "string") {
    const normalized = value.trim();
    return normalized || null;
  }
  if (value == null) {
    return null;
  }
  const normalized = String(value).trim();
  return normalized || null;
};

const normalizeHexText = (value: unknown): string | null => {
  const normalized = normalizeText(value);
  if (!normalized) {
    return null;
  }
  return normalized.toLowerCase();
};

const toIsoString = (value: unknown): string => {
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (typeof value === "string") {
    const normalized = value.trim();
    if (normalized) {
      return normalized;
    }
  }
  return new Date().toISOString();
};

const toSafeNumber = (value: unknown): number => {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : 0;
};

const toFiniteTimestamp = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  const normalized = normalizeText(value);
  if (!normalized) {
    return null;
  }
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
};

const extractWalletAddress = (value: unknown): string | null => {
  if (typeof value === "string") {
    return normalizeWalletAddress(value);
  }
  if (value && typeof value === "object") {
    return (
      normalizeWalletAddress((value as { walletAddress?: unknown }).walletAddress) ||
      normalizeWalletAddress((value as { address?: unknown }).address) ||
      normalizeWalletAddress((value as { depositWalletAddress?: unknown }).depositWalletAddress)
    );
  }
  return null;
};

const extractLabel = (value: unknown, fallbackWalletAddress?: string | null): string | null => {
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    const candidates = [
      record.nickname,
      record.depositName,
      record.accountHolder,
      record.bankName,
      record.accountNumber,
    ];

    for (const candidate of candidates) {
      const normalized = normalizeText(candidate);
      if (normalized) {
        return normalized;
      }
    }

    const bankInfo = record.bankInfo;
    if (bankInfo && typeof bankInfo === "object") {
      const bankInfoRecord = bankInfo as Record<string, unknown>;
      const bankInfoCandidates = [
        bankInfoRecord.accountHolder,
        bankInfoRecord.bankName,
        bankInfoRecord.accountNumber,
      ];

      for (const candidate of bankInfoCandidates) {
        const normalized = normalizeText(candidate);
        if (normalized) {
          return normalized;
        }
      }
    }
  }

  return fallbackWalletAddress || null;
};

const isPublicScanTransactionHashEvent = (value: unknown): boolean => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const source = normalizeText((value as { source?: unknown }).source);
  return Boolean(source && PUBLIC_SCAN_EVENT_SOURCE_SET.has(source));
};

const buildPublicScanTransactionHashLogQuery = (normalizedAddress: string | null) => {
  const filters: Record<string, unknown>[] = [
    {
      source: {
        $in: [...PUBLIC_SCAN_EVENT_SOURCES],
      },
    },
  ];

  if (normalizedAddress) {
    filters.push({
      $or: [
        { fromWalletAddress: normalizedAddress },
        { toWalletAddress: normalizedAddress },
        { "from.walletAddress": normalizedAddress },
        { "to.walletAddress": normalizedAddress },
        { from: normalizedAddress },
        { to: normalizedAddress },
      ],
    });
  }

  return filters.length === 1 ? filters[0] : { $and: filters };
};

const normalizeStorePayload = (
  value: unknown,
  fallbackStorecode?: unknown,
): UsdtTransactionHashRealtimeEvent["store"] => {
  const fallbackCode = normalizeText(fallbackStorecode);

  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    const code = normalizeText(record.code) || fallbackCode;
    const logo = normalizeText(record.logo);
    const name = normalizeText(record.name);

    if (!code && !logo && !name) {
      return null;
    }

    return {
      code,
      logo,
      name,
    };
  }

  if (!fallbackCode) {
    return null;
  }

  return {
    code: fallbackCode,
    logo: null,
    name: null,
  };
};

const buildDefaultIdempotencyKey = ({
  source,
  storecode,
  orderId,
  tradeId,
  transactionHash,
}: {
  source: string;
  storecode: string | null;
  orderId: string | null;
  tradeId: string | null;
  transactionHash: string;
}) => {
  const baseKeySource = [
    source,
    storecode,
    orderId,
    tradeId,
    transactionHash.toLowerCase(),
  ]
    .map((value) => String(value || "").trim())
    .join("|");

  return `usdt-tx:${createHash("sha256").update(baseKeySource).digest("hex")}`;
};

const buildDefaultEventId = (idempotencyKey: string) => {
  return `usdt-tx-${createHash("sha256").update(idempotencyKey).digest("hex")}`;
};

const normalizePartyIdentity = (value: unknown): ScanUserWalletIdentity | null => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const record = value as Record<string, unknown>;
  const badgeLabel = normalizeText(record.badgeLabel);
  const nickname = normalizeText(record.nickname);
  const storecode = normalizeText(record.storecode);
  const storeName = normalizeText(record.storeName);
  const storeLogo = normalizeText(record.storeLogo);
  const userType = normalizeText(record.userType);
  const role = normalizeText(record.role);
  const bankName = normalizeText(record.bankName);
  const accountNumber = normalizeText(record.accountNumber);
  const accountHolder = normalizeText(record.accountHolder);

  if (
    !badgeLabel
    && !nickname
    && !storecode
    && !storeName
    && !storeLogo
    && !userType
    && !role
    && !bankName
    && !accountNumber
    && !accountHolder
  ) {
    return null;
  }

  return {
    badgeLabel,
    nickname,
    storecode,
    storeName,
    storeLogo,
    userType,
    role,
    bankName,
    accountNumber,
    accountHolder,
  };
};

const mergePartyIdentity = (
  existing: ScanUserWalletIdentity | null | undefined,
  incoming: ScanUserWalletIdentity | null | undefined,
): ScanUserWalletIdentity | null => {
  const normalizedExisting = normalizePartyIdentity(existing);
  const normalizedIncoming = normalizePartyIdentity(incoming);

  if (!normalizedExisting) {
    return normalizedIncoming;
  }
  if (!normalizedIncoming) {
    return normalizedExisting;
  }

  return {
    badgeLabel: normalizedExisting.badgeLabel || normalizedIncoming.badgeLabel,
    nickname: normalizedExisting.nickname || normalizedIncoming.nickname,
    storecode: normalizedExisting.storecode || normalizedIncoming.storecode,
    storeName: normalizedExisting.storeName || normalizedIncoming.storeName,
    storeLogo: normalizedExisting.storeLogo || normalizedIncoming.storeLogo,
    userType: normalizedExisting.userType || normalizedIncoming.userType,
    role: normalizedExisting.role || normalizedIncoming.role,
    bankName: normalizedExisting.bankName || normalizedIncoming.bankName,
    accountNumber: normalizedExisting.accountNumber || normalizedIncoming.accountNumber,
    accountHolder: normalizedExisting.accountHolder || normalizedIncoming.accountHolder,
  };
};

const buildIdentityDisplayLabel = (identity: ScanUserWalletIdentity | null | undefined): string | null => {
  const normalizedIdentity = normalizePartyIdentity(identity);
  if (!normalizedIdentity) {
    return null;
  }

  const baseLabel = normalizedIdentity.badgeLabel || null;
  if (baseLabel && normalizedIdentity.nickname) {
    return `${baseLabel} · ${normalizedIdentity.nickname}`;
  }
  return normalizedIdentity.nickname || baseLabel;
};

const shouldReplacePartyLabelWithIdentity = ({
  currentLabel,
  walletAddress,
  identity,
}: {
  currentLabel: string | null;
  walletAddress: string | null;
  identity: ScanUserWalletIdentity | null;
}) => {
  if (!identity) {
    return false;
  }

  const normalizedLabel = normalizeText(currentLabel)?.toLowerCase() || "";
  if (!normalizedLabel) {
    return true;
  }

  if (walletAddress && normalizedLabel === walletAddress.toLowerCase()) {
    return true;
  }

  if (identity.badgeLabel === "Buyer Wallet") {
    return (
      normalizedLabel === "active buyer wallet"
      || normalizedLabel === "buyer wallet"
      || normalizedLabel.includes("buyer:")
      || normalizedLabel.endsWith("buyer")
    );
  }

  if (identity.badgeLabel === "Member Wallet") {
    return normalizedLabel === "member wallet" || normalizedLabel === "wallet";
  }

  if (identity.badgeLabel === "Store Wallet") {
    return (
      normalizedLabel === "store wallet"
      || normalizedLabel === "tagged wallet"
      || normalizedLabel === "settlement wallet"
      || normalizedLabel === "seller wallet"
      || normalizedLabel.endsWith("wallet")
    );
  }

  return false;
};

const buildChainIdForConfiguredChain = (): string => {
  if (configuredChain === "ethereum") {
    return "1";
  }
  if (configuredChain === "polygon") {
    return "137";
  }
  if (configuredChain === "arbitrum") {
    return "42161";
  }
  return "56";
};

const resolveChainName = (chainIdRaw: unknown): string => {
  const chainId = normalizeText(chainIdRaw) || buildChainIdForConfiguredChain();
  if (chainId === "1") {
    return "ethereum";
  }
  if (chainId === "137") {
    return "polygon";
  }
  if (chainId === "42161") {
    return "arbitrum";
  }
  return "bsc";
};

const getUsdtContractAddressForConfiguredChain = (): string => {
  if (configuredChain === "ethereum") {
    return ethereumContractAddressUSDT.toLowerCase();
  }
  if (configuredChain === "polygon") {
    return polygonContractAddressUSDT.toLowerCase();
  }
  if (configuredChain === "arbitrum") {
    return arbitrumContractAddressUSDT.toLowerCase();
  }
  return bscContractAddressUSDT.toLowerCase();
};

const getUsdtDecimalsForChainId = (chainIdRaw: unknown): number => {
  const chainId = normalizeText(chainIdRaw) || buildChainIdForConfiguredChain();
  return chainId === "56" ? 18 : 6;
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

const getThirdwebInsightTokenTransferUrl = ({
  ownerAddress,
  limit,
}: {
  ownerAddress: string;
  limit: number;
}) => {
  const params = new URLSearchParams({
    limit: String(limit),
    owner_address: ownerAddress,
    contract_address: getUsdtContractAddressForConfiguredChain(),
  });

  return `https://${buildChainIdForConfiguredChain()}.insight.thirdweb.com/v1/tokens/transfers?${params.toString()}`;
};

const getThirdwebInsightHeaders = () => {
  const secretKey = normalizeText(process.env.THIRDWEB_SECRET_KEY);
  const clientId =
    normalizeText(process.env.NEXT_PUBLIC_TEMPLATE_CLIENT_ID)
    || normalizeText(process.env.THIRDWEB_CLIENT_ID)
    || thirdwebClientId;

  if (!secretKey || !clientId) {
    return null;
  }

  return {
    "x-client-id": clientId,
    "x-secret-key": secretKey,
    "user-agent": "stable-georgia-scan/1.0",
  };
};

const buildThirdwebTransferEventKey = ({
  transactionHash,
  logIndex,
  fromWalletAddress,
  toWalletAddress,
  amountUsdt,
}: {
  transactionHash: string;
  logIndex: string | null;
  fromWalletAddress: string | null;
  toWalletAddress: string | null;
  amountUsdt: number;
}) => {
  return [
    transactionHash.toLowerCase(),
    logIndex || "",
    fromWalletAddress || "",
    toWalletAddress || "",
    Number.isFinite(amountUsdt) ? amountUsdt.toFixed(8) : "0",
  ].join(":");
};

const getRpcUrlForConfiguredChain = (): string => {
  const chain = String(configuredChain || "").trim().toLowerCase();
  if (chain === "ethereum") {
    return "https://eth.llamarpc.com";
  }
  if (chain === "polygon") {
    return "https://polygon-rpc.com";
  }
  if (chain === "arbitrum") {
    return "https://arb1.arbitrum.io/rpc";
  }
  return "https://bsc-dataseed.binance.org";
};

const decodeAddressTopic = (value: unknown): string | null => {
  const normalized = normalizeHexText(value);
  if (!normalized || !normalized.startsWith("0x") || normalized.length < 42) {
    return null;
  }
  return normalizeWalletAddress(`0x${normalized.slice(-40)}`);
};

const toIsoFromUnixSeconds = (value: unknown): string | null => {
  const numeric = toFiniteTimestamp(value);
  if (!Number.isFinite(numeric) || Number(numeric) <= 0) {
    return null;
  }
  return new Date(Number(numeric) * 1000).toISOString();
};

const buildReconcileIdempotencyKey = ({
  transactionHash,
  logIndex,
  fromWalletAddress,
  toWalletAddress,
  amountUsdt,
}: {
  transactionHash: string;
  logIndex: string | null;
  fromWalletAddress: string | null;
  toWalletAddress: string | null;
  amountUsdt: number;
}) =>
  [
    "scan-reconcile",
    transactionHash.toLowerCase(),
    logIndex || "",
    fromWalletAddress || "",
    toWalletAddress || "",
    Number.isFinite(amountUsdt) ? amountUsdt.toFixed(8) : "0",
  ].join(":");

const buildEventMergeKey = (event: UsdtTransactionHashRealtimeEvent): string => {
  const transactionHash = (normalizeText(event.transactionHash) || "").toLowerCase();
  const logIndex = normalizeText(event.logIndex);
  const fromWalletAddress = normalizeWalletAddress(event.fromWalletAddress) || "";
  const toWalletAddress = normalizeWalletAddress(event.toWalletAddress) || "";
  const amountUsdt = Number.isFinite(Number(event.amountUsdt))
    ? Number(event.amountUsdt).toFixed(8)
    : "0";

  return [transactionHash, logIndex, fromWalletAddress, toWalletAddress, amountUsdt].join(":");
};

const getEventTimestamp = (event: UsdtTransactionHashRealtimeEvent): number => {
  const candidates = [event.publishedAt, event.minedAt, event.createdAt];
  for (const candidate of candidates) {
    const timestamp = Date.parse(String(candidate || ""));
    if (!Number.isNaN(timestamp)) {
      return timestamp;
    }
  }
  return 0;
};

const toComparableEvent = (event: UsdtTransactionHashRealtimeEvent) => {
  return JSON.stringify({
    source: event.source || null,
    orderId: event.orderId || null,
    tradeId: event.tradeId || null,
    chain: event.chain || null,
    tokenSymbol: event.tokenSymbol || null,
    store: event.store || null,
    amountUsdt: toSafeNumber(event.amountUsdt),
    transactionHash: event.transactionHash || null,
    logIndex: event.logIndex || null,
    fromWalletAddress: event.fromWalletAddress || null,
    toWalletAddress: event.toWalletAddress || null,
    fromLabel: event.fromLabel || null,
    toLabel: event.toLabel || null,
    fromIdentity: event.fromIdentity || null,
    toIdentity: event.toIdentity || null,
    status: event.status || null,
    queueId: event.queueId || null,
    minedAt: event.minedAt || null,
    createdAt: toIsoString(event.createdAt),
  });
};

export function createUsdtTransactionHashRealtimeEvent(
  input: Record<string, unknown>,
  options?: {
    defaultSource?: string;
    defaultStatus?: string;
    defaultTokenSymbol?: string;
  },
): UsdtTransactionHashRealtimeEvent | null {
  const transactionHash = normalizeText(input?.transactionHash);
  if (!transactionHash) {
    return null;
  }

  const store = normalizeStorePayload(input?.store, input?.storecode);
  const source =
    normalizeText(input?.source) ||
    options?.defaultSource ||
    "api.realtime.scan.usdt-token-transfers.ingest";
  const orderId = normalizeText(input?.orderId);
  const tradeId = normalizeText(input?.tradeId);
  const idempotencyKey =
    normalizeText(input?.idempotencyKey) ||
    buildDefaultIdempotencyKey({
      source,
      storecode: store?.code || null,
      orderId,
      tradeId,
      transactionHash,
    });
  const createdAt = toIsoString(input?.createdAt);

  const fromWalletAddress =
    normalizeWalletAddress(input?.fromWalletAddress) ||
    extractWalletAddress(input?.from);
  const toWalletAddress =
    normalizeWalletAddress(input?.toWalletAddress) ||
    extractWalletAddress(input?.to);

  return {
    eventId: normalizeText(input?.eventId) || buildDefaultEventId(idempotencyKey),
    idempotencyKey,
    source,
    orderId,
    tradeId,
    chain: normalizeText(input?.chain),
    tokenSymbol: normalizeText(input?.tokenSymbol) || options?.defaultTokenSymbol || "USDT",
    store,
    amountUsdt: toSafeNumber(input?.amountUsdt ?? input?.usdtAmount ?? input?.amount),
    transactionHash,
    logIndex: normalizeText(input?.logIndex),
    fromWalletAddress,
    toWalletAddress,
    fromLabel: normalizeText(input?.fromLabel) || extractLabel(input?.from, fromWalletAddress),
    toLabel: normalizeText(input?.toLabel) || extractLabel(input?.to, toWalletAddress),
    fromIdentity: normalizePartyIdentity(input?.fromIdentity),
    toIdentity: normalizePartyIdentity(input?.toIdentity),
    status: normalizeText(input?.status) || options?.defaultStatus || null,
    queueId: normalizeText(input?.queueId),
    minedAt: normalizeText(input?.minedAt),
    createdAt,
    publishedAt: toIsoString(input?.publishedAt),
  };
}

export function normalizeTransactionHashLogDocument(document: StoredTransactionHashLogDocument): UsdtTransactionHashRealtimeEvent {
  const transactionHash = normalizeText(document?.transactionHash) || "";
  const fromWalletAddress =
    normalizeWalletAddress(document?.fromWalletAddress) ||
    extractWalletAddress(document?.from);
  const toWalletAddress =
    normalizeWalletAddress(document?.toWalletAddress) ||
    extractWalletAddress(document?.to);
  const createdAt = toIsoString(document?.createdAt);
  const storeRecord =
    document?.store && typeof document.store === "object"
      ? (document.store as Record<string, unknown>)
      : null;

  return {
    eventId: normalizeText(document?.eventId) || `txhash-log-${String(document?._id || transactionHash || createdAt)}`,
    idempotencyKey:
      normalizeText(document?.idempotencyKey) ||
      `legacy:${transactionHash}:${String(document?._id || createdAt)}`,
    source: normalizeText(document?.source) || "legacy.transactionHashLogs",
    orderId: normalizeText(document?.orderId),
    tradeId: normalizeText(document?.tradeId),
    chain: normalizeText(document?.chain),
    tokenSymbol: normalizeText(document?.tokenSymbol) || "USDT",
    store: storeRecord
      ? {
          code: normalizeText(storeRecord.code),
          logo: normalizeText(storeRecord.logo),
          name: normalizeText(storeRecord.name),
        }
      : null,
    amountUsdt: toSafeNumber(document?.amountUsdt ?? document?.amount),
    transactionHash,
    logIndex: normalizeText(document?.logIndex),
    fromWalletAddress,
    toWalletAddress,
    fromLabel: normalizeText(document?.fromLabel) || extractLabel(document?.from, fromWalletAddress),
    toLabel: normalizeText(document?.toLabel) || extractLabel(document?.to, toWalletAddress),
    fromIdentity: normalizePartyIdentity(document?.fromIdentity),
    toIdentity: normalizePartyIdentity(document?.toIdentity),
    status: normalizeText(document?.status),
    queueId: normalizeText(document?.queueId),
    minedAt: normalizeText(document?.minedAt),
    createdAt,
    publishedAt: toIsoString(document?.publishedAt || document?.createdAt),
  };
}

async function loadStoredTransactionHashLogEvents({
  limit = 50,
  address,
}: GetLatestTransactionHashLogEventsParams = {}): Promise<UsdtTransactionHashRealtimeEvent[]> {
  const client = await clientPromise;
  const collection = client.db(dbName).collection('transactionHashLogs');

  const safeLimit = Math.max(1, Math.min(Number(limit) || 50, 200));
  const normalizedAddress = normalizeWalletAddress(address);
  const query = buildPublicScanTransactionHashLogQuery(normalizedAddress);

  const logs = await collection
    .find<StoredTransactionHashLogDocument>(query)
    .sort({ publishedAt: -1, createdAt: -1, _id: -1 })
    .limit(safeLimit)
    .toArray();

  return logs
    .map((document) => normalizeTransactionHashLogDocument(document))
    .filter((item) => {
      if (!isPublicScanTransactionHashEvent(item)) {
        return false;
      }
      if (!normalizedAddress) {
        return true;
      }
      return item.fromWalletAddress === normalizedAddress || item.toWalletAddress === normalizedAddress;
    });
}

async function getScanWalletUserRecordMap(
  walletAddresses: string[],
): Promise<Map<string, ScanWalletUserRecord[]>> {
  const normalizedWalletAddresses = Array.from(
    new Set(
      walletAddresses
        .map((walletAddress) => normalizeWalletAddress(walletAddress))
        .filter((value): value is string => Boolean(value)),
    ),
  );

  if (normalizedWalletAddresses.length === 0) {
    return new Map();
  }

  const recordMap = new Map<string, ScanWalletUserRecord[]>();
  const missingWalletAddresses: string[] = [];

  for (const walletAddress of normalizedWalletAddresses) {
    const cachedRecords = getTimedCacheValue(scanWalletUserRecordCache, walletAddress);
    if (cachedRecords.hit) {
      if (cachedRecords.value.length > 0) {
        recordMap.set(walletAddress, cachedRecords.value);
      }
      continue;
    }
    missingWalletAddresses.push(walletAddress);
  }

  if (missingWalletAddresses.length === 0) {
    return recordMap;
  }

  const client = await clientPromise;
  const collection = client.db(dbName).collection("users");
  const users = await collection.aggregate<{
    _id: string;
    walletAddress: string;
    nickname?: string;
    storecode?: string;
    userType?: string;
    role?: string;
    buyerDepositName?: string;
    buyerBankName?: string;
    buyerAccountNumber?: string;
    buyerAccountHolder?: string;
    sellerBankName?: string;
    sellerAccountNumber?: string;
    sellerAccountHolder?: string;
  }>([
    {
      $match: {
        walletAddress: { $type: "string", $ne: "" },
      },
    },
    {
      $addFields: {
        normalizedWalletAddress: {
          $toLower: {
            $trim: {
              input: { $ifNull: ["$walletAddress", ""] },
            },
          },
        },
        buyerDepositNameSource: {
          $ifNull: ["$buyer.depositName", null],
        },
        buyerBankNameSource: {
          $ifNull: [
            "$buyer.bankInfo.bankName",
            {
              $ifNull: ["$buyer.depositBankName", "$seller.bankInfo.bankName"],
            },
          ],
        },
        buyerAccountNumberSource: {
          $ifNull: [
            "$buyer.bankInfo.accountNumber",
            {
              $ifNull: ["$buyer.depositBankAccountNumber", "$seller.bankInfo.accountNumber"],
            },
          ],
        },
        buyerAccountHolderSource: {
          $ifNull: [
            "$buyer.bankInfo.accountHolder",
            {
              $ifNull: ["$buyer.depositName", "$seller.bankInfo.accountHolder"],
            },
          ],
        },
        sellerBankNameSource: {
          $ifNull: ["$seller.bankInfo.bankName", null],
        },
        sellerAccountNumberSource: {
          $ifNull: ["$seller.bankInfo.accountNumber", null],
        },
        sellerAccountHolderSource: {
          $ifNull: ["$seller.bankInfo.accountHolder", null],
        },
      },
    },
    {
      $match: {
        normalizedWalletAddress: { $in: missingWalletAddresses },
      },
    },
    {
      $sort: {
        updatedAt: -1,
        _id: -1,
      },
    },
    {
      $group: {
        _id: "$normalizedWalletAddress",
        walletAddress: { $first: "$walletAddress" },
        nickname: { $first: "$nickname" },
        storecode: { $first: "$storecode" },
        userType: { $first: "$userType" },
        role: { $first: "$role" },
        buyerDepositName: { $first: "$buyerDepositNameSource" },
        buyerBankName: { $first: "$buyerBankNameSource" },
        buyerAccountNumber: { $first: "$buyerAccountNumberSource" },
        buyerAccountHolder: { $first: "$buyerAccountHolderSource" },
        sellerBankName: { $first: "$sellerBankNameSource" },
        sellerAccountNumber: { $first: "$sellerAccountNumberSource" },
        sellerAccountHolder: { $first: "$sellerAccountHolderSource" },
      },
    },
  ]).toArray();

  const fetchedRecordMap = new Map<string, ScanWalletUserRecord[]>();

  for (const user of users) {
    const normalizedWalletAddress = normalizeWalletAddress(user.walletAddress) || String(user._id);
    const nextRecord = {
      walletAddress: normalizedWalletAddress,
      nickname: normalizeText(user.nickname),
      storecode: normalizeText(user.storecode),
      userType: normalizeText(user.userType),
      role: normalizeText(user.role),
      buyerDepositName: normalizeText(user.buyerDepositName),
      buyerBankName: normalizeText(user.buyerBankName),
      buyerAccountNumber: normalizeText(user.buyerAccountNumber),
      buyerAccountHolder: normalizeText(user.buyerAccountHolder),
      sellerBankName: normalizeText(user.sellerBankName),
      sellerAccountNumber: normalizeText(user.sellerAccountNumber),
      sellerAccountHolder: normalizeText(user.sellerAccountHolder),
    } satisfies ScanWalletUserRecord;

    const currentRecords = fetchedRecordMap.get(normalizedWalletAddress) || [];
    currentRecords.push(nextRecord);
    fetchedRecordMap.set(normalizedWalletAddress, currentRecords);
  }

  for (const walletAddress of missingWalletAddresses) {
    const nextRecords = fetchedRecordMap.get(walletAddress) || [];
    setTimedCacheValue(
      scanWalletUserRecordCache,
      walletAddress,
      nextRecords,
      SCAN_WALLET_USER_RECORD_CACHE_TTL_MS,
    );

    if (nextRecords.length > 0) {
      recordMap.set(walletAddress, nextRecords);
    }
  }

  return recordMap;
}

async function getScanStoreBrandingMap(
  storecodes: string[],
): Promise<Map<string, ScanStoreBrandingRecord>> {
  const normalizedStorecodes = Array.from(
    new Set(
      storecodes
        .map((storecode) => normalizeText(storecode)?.toLowerCase() || "")
        .filter((value): value is string => Boolean(value)),
    ),
  );

  if (normalizedStorecodes.length === 0) {
    return new Map();
  }

  const brandingMap = new Map<string, ScanStoreBrandingRecord>();
  const missingStorecodes: string[] = [];

  for (const storecode of normalizedStorecodes) {
    const cachedBranding = getTimedCacheValue(scanStoreBrandingCache, storecode);
    if (cachedBranding.hit) {
      if (cachedBranding.value) {
        brandingMap.set(storecode, cachedBranding.value);
      }
      continue;
    }
    missingStorecodes.push(storecode);
  }

  if (missingStorecodes.length === 0) {
    return brandingMap;
  }

  const client = await clientPromise;
  const collection = client.db(dbName).collection("stores");
  const stores = await collection.aggregate<{
    _id: string;
    storecode: string;
    storeName?: string;
    storeLogo?: string;
  }>([
    {
      $match: {
        storecode: { $type: "string", $ne: "" },
      },
    },
    {
      $addFields: {
        normalizedStorecode: {
          $toLower: {
            $trim: {
              input: { $ifNull: ["$storecode", ""] },
            },
          },
        },
      },
    },
    {
      $match: {
        normalizedStorecode: { $in: missingStorecodes },
      },
    },
    {
      $sort: {
        updatedAt: -1,
        _id: -1,
      },
    },
    {
      $group: {
        _id: "$normalizedStorecode",
        storecode: { $first: "$storecode" },
        storeName: { $first: "$storeName" },
        storeLogo: { $first: "$storeLogo" },
      },
    },
  ]).toArray();

  const fetchedBrandingMap = new Map(
    stores.map((store) => [
      normalizeText(store.storecode)?.toLowerCase() || String(store._id),
      {
        code: normalizeText(store.storecode) || String(store._id),
        name: normalizeText(store.storeName),
        logo: normalizeText(store.storeLogo),
      } satisfies ScanStoreBrandingRecord,
    ]),
  );

  for (const storecode of missingStorecodes) {
    const nextBranding = fetchedBrandingMap.get(storecode) || null;
    setTimedCacheValue(
      scanStoreBrandingCache,
      storecode,
      nextBranding,
      SCAN_STORE_BRANDING_CACHE_TTL_MS,
    );
    if (nextBranding) {
      brandingMap.set(storecode, nextBranding);
    }
  }

  return brandingMap;
}

async function getActiveBuyerWalletAddressSet(walletAddresses: string[]): Promise<Set<string>> {
  const normalizedWalletAddresses = Array.from(
    new Set(
      walletAddresses
        .map((walletAddress) => normalizeWalletAddress(walletAddress))
        .filter((value): value is string => Boolean(value)),
    ),
  );

  if (normalizedWalletAddresses.length === 0) {
    return new Set();
  }

  const activeWalletSet = new Set<string>();
  const missingWalletAddresses: string[] = [];

  for (const walletAddress of normalizedWalletAddresses) {
    const cachedStatus = getTimedCacheValue(scanActiveBuyerWalletCache, walletAddress);
    if (!cachedStatus.hit) {
      missingWalletAddresses.push(walletAddress);
      continue;
    }
    if (cachedStatus.value) {
      activeWalletSet.add(walletAddress);
    }
  }

  if (missingWalletAddresses.length === 0) {
    return activeWalletSet;
  }

  const client = await clientPromise;
  const collection = client.db(dbName).collection("buyorders");
  const activeWallets = await collection.aggregate<{ _id: string }>([
    {
      $match: {
        status: { $in: [...ACTIVE_SCAN_BUYER_STATUSES] },
        $or: [
          { walletAddress: { $type: "string", $ne: "" } },
          { "buyer.walletAddress": { $type: "string", $ne: "" } },
        ],
      },
    },
    {
      $addFields: {
        normalizedWalletAddress: {
          $toLower: {
            $trim: {
              input: {
                $ifNull: ["$walletAddress", "$buyer.walletAddress"],
              },
            },
          },
        },
      },
    },
    {
      $match: {
        normalizedWalletAddress: { $in: missingWalletAddresses },
      },
    },
    {
      $group: {
        _id: "$normalizedWalletAddress",
      },
    },
  ]).toArray();

  const fetchedActiveWallets = new Set(
    activeWallets
      .map((item) => normalizeWalletAddress(item._id))
      .filter((value): value is string => Boolean(value)),
  );

  for (const walletAddress of missingWalletAddresses) {
    const isActive = fetchedActiveWallets.has(walletAddress);
    setTimedCacheValue(
      scanActiveBuyerWalletCache,
      walletAddress,
      isActive,
      SCAN_ACTIVE_BUYER_WALLET_CACHE_TTL_MS,
    );
    if (isActive) {
      activeWalletSet.add(walletAddress);
    }
  }

  return activeWalletSet;
}

const buildScanWalletIdentity = ({
  user,
  isActiveBuyer,
  storeBranding,
  preferStoreWallet = false,
}: {
  user: ScanWalletUserRecord;
  isActiveBuyer: boolean;
  storeBranding?: ScanStoreBrandingRecord | null;
  preferStoreWallet?: boolean;
}): ScanUserWalletIdentity => {
  const nickname = normalizeText(user.nickname);
  const storecode = normalizeText(user.storecode);
  const storeName = normalizeText(storeBranding?.name);
  const storeLogo = normalizeText(storeBranding?.logo);
  const userType = normalizeText(user.userType);
  const role = normalizeText(user.role);
  const buyerDepositName = normalizeText(user.buyerDepositName);
  const buyerBankName = normalizeText(user.buyerBankName);
  const buyerAccountNumber = normalizeText(user.buyerAccountNumber);
  const buyerAccountHolder = normalizeText(user.buyerAccountHolder);
  const sellerBankName = normalizeText(user.sellerBankName);
  const sellerAccountNumber = normalizeText(user.sellerAccountNumber);
  const sellerAccountHolder = normalizeText(user.sellerAccountHolder);
  const normalizedNickname = (nickname || "").toLowerCase();
  const normalizedRole = (role || "").toLowerCase();
  const normalizedUserType = (userType || "").toLowerCase();

  const isStoreWallet =
    preferStoreWallet
    || normalizedUserType === "server-wallet"
    || normalizedRole === "seller"
    || normalizedNickname === "seller";

  let badgeLabel = "Member Wallet";
  if (isStoreWallet) {
    badgeLabel = "Store Wallet";
  } else if (isActiveBuyer) {
    badgeLabel = "Buyer Wallet";
  }

  const bankName = buyerBankName || sellerBankName || null;
  const accountNumber = buyerAccountNumber || sellerAccountNumber || null;
  const accountHolder = buyerAccountHolder || buyerDepositName || sellerAccountHolder || nickname || null;
  const resolvedNickname = nickname || buyerDepositName || accountHolder || null;

  return {
    badgeLabel,
    nickname: resolvedNickname,
    storecode: storecode || null,
    storeName: storeName || null,
    storeLogo: storeLogo || null,
    userType: userType || null,
    role: role || null,
    bankName,
    accountNumber,
    accountHolder,
  };
};

const normalizeStorecodeKey = (value: unknown): string => {
  return (normalizeText(value) || "").toLowerCase();
};

const selectScanWalletUserRecordForEvent = ({
  userRecords,
  eventStorecode,
}: {
  userRecords: ScanWalletUserRecord[];
  eventStorecode: string;
}): ScanWalletUserRecord | null => {
  if (userRecords.length === 0) {
    return null;
  }

  if (userRecords.length === 1) {
    return userRecords[0] || null;
  }

  if (!eventStorecode) {
    return null;
  }

  return (
    userRecords.find(
      (userRecord) => normalizeStorecodeKey(userRecord.storecode) === eventStorecode,
    ) || null
  );
};

const buildEventStoreWalletIdentity = (
  eventStore: UsdtTransactionHashRealtimeEvent["store"] | null | undefined,
): ScanUserWalletIdentity | null => {
  const storecode = normalizeText(eventStore?.code);
  const storeName = normalizeText(eventStore?.name);
  const storeLogo = normalizeText(eventStore?.logo);

  if (!storecode && !storeName && !storeLogo) {
    return null;
  }

  return {
    badgeLabel: "Store Wallet",
    nickname: storeName || storecode || null,
    storecode: storecode || null,
    storeName: storeName || null,
    storeLogo: storeLogo || null,
    userType: "server-wallet",
    role: "seller",
    bankName: null,
    accountNumber: null,
    accountHolder: null,
  };
};

async function hydrateUsdtTransactionHashRealtimeEvents(
  events: UsdtTransactionHashRealtimeEvent[],
): Promise<UsdtTransactionHashRealtimeEvent[]> {
  if (events.length === 0) {
    return events;
  }

  const walletAddresses = Array.from(
    new Set(
      events.flatMap((event) => [
        normalizeWalletAddress(event.fromWalletAddress),
        normalizeWalletAddress(event.toWalletAddress),
      ]).filter(Boolean),
    ),
  ) as string[];

  if (walletAddresses.length === 0) {
    return events;
  }

  const [userRecordMap, activeBuyerWalletSet, monitoredWalletRecords] = await Promise.all([
    getScanWalletUserRecordMap(walletAddresses),
    getActiveBuyerWalletAddressSet(walletAddresses),
    getThirdwebMonitoredWalletRecords(),
  ]);
  const monitoredWalletRecordMap = new Map(
    monitoredWalletRecords.map((walletRecord) => [
      normalizeWalletAddress(walletRecord.walletAddress) || walletRecord.walletAddress,
      walletRecord,
    ]),
  );
  const storeBrandingMap = await getScanStoreBrandingMap(
    Array.from(userRecordMap.values()).flatMap((users) => users.map((user) => user.storecode || "")),
  );

  return events.map((event) => {
    const fromWalletAddress = normalizeWalletAddress(event.fromWalletAddress);
    const toWalletAddress = normalizeWalletAddress(event.toWalletAddress);
    const eventStorecode = normalizeStorecodeKey(event.store?.code);
    const fromUsers = fromWalletAddress ? userRecordMap.get(fromWalletAddress) || [] : [];
    const toUsers = toWalletAddress ? userRecordMap.get(toWalletAddress) || [] : [];
    const fromUser = selectScanWalletUserRecordForEvent({
      userRecords: fromUsers,
      eventStorecode,
    });
    const toUser = selectScanWalletUserRecordForEvent({
      userRecords: toUsers,
      eventStorecode,
    });
    const fromMonitoredWallet = fromWalletAddress ? monitoredWalletRecordMap.get(fromWalletAddress) || null : null;
    const toMonitoredWallet = toWalletAddress ? monitoredWalletRecordMap.get(toWalletAddress) || null : null;
    const fromIsStoreScopedWallet = Boolean(
      eventStorecode
      && fromMonitoredWallet
      && fromMonitoredWallet.walletKinds.some((walletKind) => walletKind !== "buyer")
      && fromMonitoredWallet.storecodes.some((storecode) => normalizeStorecodeKey(storecode) === eventStorecode),
    );
    const toIsStoreScopedWallet = Boolean(
      eventStorecode
      && toMonitoredWallet
      && toMonitoredWallet.walletKinds.some((walletKind) => walletKind !== "buyer")
      && toMonitoredWallet.storecodes.some((storecode) => normalizeStorecodeKey(storecode) === eventStorecode),
    );

    const fromCandidateIdentity = fromUser
      ? buildScanWalletIdentity({
          user: fromUser,
          isActiveBuyer: activeBuyerWalletSet.has(fromUser.walletAddress),
          storeBranding:
            (eventStorecode
              ? storeBrandingMap.get(eventStorecode) || null
              : null)
            || (fromUser.storecode
              ? storeBrandingMap.get(normalizeStorecodeKey(fromUser.storecode)) || null
              : null),
          preferStoreWallet: fromIsStoreScopedWallet,
        })
      : fromIsStoreScopedWallet
        ? buildEventStoreWalletIdentity(event.store)
        : null;
    const toCandidateIdentity = toUser
      ? buildScanWalletIdentity({
          user: toUser,
          isActiveBuyer: activeBuyerWalletSet.has(toUser.walletAddress),
          storeBranding:
            (eventStorecode
              ? storeBrandingMap.get(eventStorecode) || null
              : null)
            || (toUser.storecode
              ? storeBrandingMap.get(normalizeStorecodeKey(toUser.storecode)) || null
              : null),
          preferStoreWallet: toIsStoreScopedWallet,
        })
      : toIsStoreScopedWallet
        ? buildEventStoreWalletIdentity(event.store)
        : null;

    const fromIdentity = fromIsStoreScopedWallet && fromCandidateIdentity
      ? fromCandidateIdentity
      : mergePartyIdentity(event.fromIdentity, fromCandidateIdentity);
    const toIdentity = toIsStoreScopedWallet && toCandidateIdentity
      ? toCandidateIdentity
      : mergePartyIdentity(event.toIdentity, toCandidateIdentity);
    const nextFromLabel = shouldReplacePartyLabelWithIdentity({
      currentLabel: event.fromLabel,
      walletAddress: fromWalletAddress,
      identity: fromIdentity,
    })
      ? buildIdentityDisplayLabel(fromIdentity) || event.fromLabel || fromWalletAddress
      : event.fromLabel;
    const nextToLabel = shouldReplacePartyLabelWithIdentity({
      currentLabel: event.toLabel,
      walletAddress: toWalletAddress,
      identity: toIdentity,
    })
      ? buildIdentityDisplayLabel(toIdentity) || event.toLabel || toWalletAddress
      : event.toLabel;

    return {
      ...event,
      fromLabel: nextFromLabel || event.fromLabel || null,
      toLabel: nextToLabel || event.toLabel || null,
      fromIdentity,
      toIdentity,
    };
  });
}

async function fetchThirdwebInsightUsdtTransferEventsByOwnerAddress({
  ownerAddress,
  limit,
}: {
  ownerAddress: string;
  limit: number;
}): Promise<UsdtTransactionHashRealtimeEvent[]> {
  const normalizedOwnerAddress = normalizeWalletAddress(ownerAddress);
  if (!normalizedOwnerAddress) {
    return [];
  }

  const headers = getThirdwebInsightHeaders();
  if (!headers) {
    return [];
  }

  try {
    const response = await fetch(
      getThirdwebInsightTokenTransferUrl({
        ownerAddress: normalizedOwnerAddress,
        limit: Math.max(1, Math.min(limit, 120)),
      }),
      {
        method: "GET",
        headers,
        cache: "no-store",
      },
    );

    if (!response.ok) {
      console.error("Failed to fetch thirdweb token transfers:", response.status);
      return [];
    }

    const payload = (await response.json()) as { data?: ThirdwebInsightTokenTransferItem[] };
    const transfers = Array.isArray(payload?.data) ? payload.data : [];

    return transfers
      .map((item) => {
        const transactionHash = normalizeText(item.transaction_hash);
        if (!transactionHash) {
          return null;
        }

        const fromWalletAddress = normalizeWalletAddress(item.from_address);
        const toWalletAddress = normalizeWalletAddress(item.to_address);
        const logIndex = normalizeText(item.log_index) || null;
        const chainId = normalizeText(item.chain_id) || buildChainIdForConfiguredChain();
        const amountRaw = normalizeText(item.amount);
        const amountUsdt = amountRaw ? formatUnitsToNumber(amountRaw, getUsdtDecimalsForChainId(chainId)) : 0;
        const createdAt = normalizeText(item.block_timestamp) || new Date().toISOString();
        const eventKey = buildThirdwebTransferEventKey({
          transactionHash,
          logIndex,
          fromWalletAddress,
          toWalletAddress,
          amountUsdt,
        });

        return createUsdtTransactionHashRealtimeEvent(
          {
            eventId: `thirdweb-owner-transfer:${eventKey}`,
            idempotencyKey: `thirdweb-owner-transfer:${eventKey}`,
            source: THIRDWEB_OWNER_QUERY_SOURCE,
            chain: resolveChainName(chainId),
            tokenSymbol: "USDT",
            transactionHash,
            logIndex,
            amountUsdt,
            fromWalletAddress,
            toWalletAddress,
            status: "confirmed",
            queueId: `thirdweb-owner:${transactionHash}:${logIndex || "na"}`,
            minedAt: createdAt,
            createdAt,
            publishedAt: new Date().toISOString(),
          },
          {
            defaultSource: THIRDWEB_OWNER_QUERY_SOURCE,
            defaultStatus: "confirmed",
            defaultTokenSymbol: "USDT",
          },
        );
      })
      .filter((event): event is UsdtTransactionHashRealtimeEvent => Boolean(event));
  } catch (error) {
    console.error("Failed to fetch thirdweb owner-address token transfers:", error);
    return [];
  }
}

const mergeUsdtTransactionHashRealtimeEvents = (
  events: UsdtTransactionHashRealtimeEvent[],
): UsdtTransactionHashRealtimeEvent[] => {
  const mergedMap = new Map<string, UsdtTransactionHashRealtimeEvent>();

  for (const event of events) {
    const eventKey = buildEventMergeKey(event);
    const existing = mergedMap.get(eventKey);

    if (!existing) {
      mergedMap.set(eventKey, event);
      continue;
    }

    mergedMap.set(eventKey, {
      ...event,
      ...existing,
      eventId: existing.eventId || event.eventId,
      idempotencyKey: existing.idempotencyKey || event.idempotencyKey,
      source: existing.source || event.source,
      store: existing.store || event.store,
      fromLabel: existing.fromLabel || event.fromLabel,
      toLabel: existing.toLabel || event.toLabel,
      fromIdentity: mergePartyIdentity(existing.fromIdentity, event.fromIdentity),
      toIdentity: mergePartyIdentity(existing.toIdentity, event.toIdentity),
      queueId: existing.queueId || event.queueId,
      status: existing.status || event.status,
      orderId: existing.orderId || event.orderId,
      tradeId: existing.tradeId || event.tradeId,
      publishedAt: existing.publishedAt || event.publishedAt,
      createdAt: existing.createdAt || event.createdAt,
      minedAt: existing.minedAt || event.minedAt,
      logIndex: existing.logIndex || event.logIndex,
    });
  }

  return Array.from(mergedMap.values());
};

export async function getPublicScanTransactionHashLogEvents({
  limit = 50,
  address,
}: GetLatestTransactionHashLogEventsParams = {}): Promise<UsdtTransactionHashRealtimeEvent[]> {
  const safeLimit = Math.max(1, Math.min(Number(limit) || 50, 200));
  const normalizedAddress = normalizeWalletAddress(address);
  const storedEvents = await loadStoredTransactionHashLogEvents({
    limit: safeLimit,
    address: normalizedAddress,
  });

  let combinedEvents = storedEvents;

  if (normalizedAddress) {
    const userRecordMap = await getScanWalletUserRecordMap([normalizedAddress]);
    if (userRecordMap.has(normalizedAddress)) {
      const externalEvents = await fetchThirdwebInsightUsdtTransferEventsByOwnerAddress({
        ownerAddress: normalizedAddress,
        limit: safeLimit,
      });
      combinedEvents = mergeUsdtTransactionHashRealtimeEvents([
        ...storedEvents,
        ...externalEvents,
      ]);
    }
  }

  const hydratedEvents = await hydrateUsdtTransactionHashRealtimeEvents(combinedEvents);
  return hydratedEvents
    .filter((item) => {
      if (!normalizedAddress) {
        return true;
      }
      return item.fromWalletAddress === normalizedAddress || item.toWalletAddress === normalizedAddress;
    })
    .sort((left, right) => getEventTimestamp(right) - getEventTimestamp(left))
    .slice(0, safeLimit);
}


// fetch latest transaction hash logs
export async function getLatestTransactionHashLogs(limit = 10): Promise<TransactionHashLog[]> {

  const client = await clientPromise;
  const collection = client.db(dbName).collection('transactionHashLogs');


  const safeLimit = Math.max(1, Math.min(Number(limit) || 10, 100));


  const logs = await collection
    .find<TransactionHashLog>({})
    .sort({ publishedAt: -1, createdAt: -1, _id: -1 })
    .limit(safeLimit)
    .toArray();


  return logs;

}

export async function getLatestTransactionHashLogEvents({
  limit = 50,
  address,
}: GetLatestTransactionHashLogEventsParams = {}): Promise<UsdtTransactionHashRealtimeEvent[]> {
  const storedEvents = await loadStoredTransactionHashLogEvents({
    limit,
    address,
  });
  return hydrateUsdtTransactionHashRealtimeEvents(storedEvents);
}

export async function getTransactionHashLogEventsByHash(
  transactionHash: string | null | undefined,
  limit = 50,
): Promise<UsdtTransactionHashRealtimeEvent[]> {
  const normalizedTransactionHash = normalizeText(transactionHash);
  if (!normalizedTransactionHash) {
    return [];
  }

  const client = await clientPromise;
  const collection = client.db(dbName).collection('transactionHashLogs');
  const safeLimit = Math.max(1, Math.min(Number(limit) || 50, 200));

  const documents = await collection
    .find<StoredTransactionHashLogDocument>({
      $and: [
        {
          transactionHash: {
            $regex: `^${escapeRegex(normalizedTransactionHash)}$`,
            $options: "i",
          },
        },
        buildPublicScanTransactionHashLogQuery(null),
      ],
    })
    .sort({ publishedAt: -1, createdAt: -1, _id: -1 })
    .limit(safeLimit)
    .toArray();

  const hydratedEvents = await hydrateUsdtTransactionHashRealtimeEvents(
    documents
      .map((document) => normalizeTransactionHashLogDocument(document))
      .filter((item) => isPublicScanTransactionHashEvent(item)),
  );

  return hydratedEvents.sort((left, right) => getEventTimestamp(right) - getEventTimestamp(left));
}

export async function getTransactionHashLogEventByHash(
  transactionHash: string | null | undefined,
): Promise<UsdtTransactionHashRealtimeEvent | null> {
  const [event] = await getTransactionHashLogEventsByHash(transactionHash, 1);
  return event || null;
}

export async function saveTransactionHashLogEvent(
  event: UsdtTransactionHashRealtimeEvent,
): Promise<{ event: UsdtTransactionHashRealtimeEvent; isDuplicate: boolean }> {
  const client = await clientPromise;
  const collection = client.db(dbName).collection('transactionHashLogs');
  const idempotencyKey = normalizeText(event.idempotencyKey);
  const [hydratedEvent] = await hydrateUsdtTransactionHashRealtimeEvents([event]);
  const nextEvent = hydratedEvent || event;

  if (idempotencyKey) {
    const existing = await collection.findOne({ idempotencyKey });
    if (existing) {
      const [existingEvent] = await hydrateUsdtTransactionHashRealtimeEvents([
        normalizeTransactionHashLogDocument(existing),
      ]);
      return {
        event: existingEvent || normalizeTransactionHashLogDocument(existing),
        isDuplicate: true,
      };
    }
  }

  const payload = {
    ...nextEvent,
    createdAt: toIsoString(nextEvent.createdAt),
    publishedAt: toIsoString(nextEvent.publishedAt),
  };

  await collection.insertOne(payload);

  return {
    event: normalizeTransactionHashLogDocument(payload),
    isDuplicate: false,
  };
}

async function upsertTransactionHashLogEvent(
  event: UsdtTransactionHashRealtimeEvent,
): Promise<{ event: UsdtTransactionHashRealtimeEvent; isDuplicate: boolean; wasUpdated: boolean }> {
  const client = await clientPromise;
  const collection = client.db(dbName).collection('transactionHashLogs');
  const [hydratedEvent] = await hydrateUsdtTransactionHashRealtimeEvents([event]);
  const nextEvent = hydratedEvent || event;
  const idempotencyKey = normalizeText(nextEvent.idempotencyKey);

  if (!idempotencyKey) {
    const payload = {
      ...nextEvent,
      createdAt: toIsoString(nextEvent.createdAt),
      publishedAt: toIsoString(nextEvent.publishedAt),
    };

    await collection.insertOne(payload);

    return {
      event: normalizeTransactionHashLogDocument(payload),
      isDuplicate: false,
      wasUpdated: false,
    };
  }

  let existing = await collection.findOne({ idempotencyKey });
  if (!existing && PUBLIC_SCAN_EVENT_SOURCE_SET.has(nextEvent.source as (typeof PUBLIC_SCAN_EVENT_SOURCES)[number])) {
    existing = await findExistingPublicTransferEventDocument(collection, nextEvent);
  }
  if (!existing) {
    const payload = {
      ...nextEvent,
      createdAt: toIsoString(nextEvent.createdAt),
      publishedAt: toIsoString(nextEvent.publishedAt),
    };

    await collection.insertOne(payload);

    return {
      event: normalizeTransactionHashLogDocument(payload),
      isDuplicate: false,
      wasUpdated: false,
    };
  }

  const existingEvent = normalizeTransactionHashLogDocument(existing);
  const mergedEvent: UsdtTransactionHashRealtimeEvent = {
    ...existingEvent,
    ...nextEvent,
    eventId: existingEvent.eventId || nextEvent.eventId,
    idempotencyKey: existingEvent.idempotencyKey || nextEvent.idempotencyKey,
    fromIdentity: mergePartyIdentity(existingEvent.fromIdentity, nextEvent.fromIdentity),
    toIdentity: mergePartyIdentity(existingEvent.toIdentity, nextEvent.toIdentity),
    createdAt: toIsoString(existingEvent.createdAt || nextEvent.createdAt),
    publishedAt: toIsoString(nextEvent.publishedAt || existingEvent.publishedAt),
  };

  if (toComparableEvent(existingEvent) === toComparableEvent(mergedEvent)) {
    const [hydratedExistingEvent] = await hydrateUsdtTransactionHashRealtimeEvents([existingEvent]);
    return {
      event: hydratedExistingEvent || existingEvent,
      isDuplicate: true,
      wasUpdated: false,
    };
  }

  await collection.updateOne(
    { _id: existing._id },
    {
      $set: {
        ...mergedEvent,
      },
    },
  );

  return {
    event: mergedEvent,
    isDuplicate: true,
    wasUpdated: true,
  };
}

async function findExistingPublicTransferEventDocument(
  collection: any,
  event: UsdtTransactionHashRealtimeEvent,
) {
  const normalizedTransactionHash = normalizeText(event.transactionHash);
  if (!normalizedTransactionHash) {
    return null;
  }

  const filters: Record<string, unknown>[] = [
    buildPublicScanTransactionHashLogQuery(null),
    {
      transactionHash: {
        $regex: `^${escapeRegex(normalizedTransactionHash)}$`,
        $options: "i",
      },
    },
    {
      amountUsdt: toSafeNumber(event.amountUsdt),
    },
  ];

  const normalizedLogIndex = normalizeText(event.logIndex);
  if (normalizedLogIndex) {
    filters.push({ logIndex: normalizedLogIndex });
  }

  const normalizedFromWalletAddress = normalizeWalletAddress(event.fromWalletAddress);
  if (normalizedFromWalletAddress) {
    filters.push({ fromWalletAddress: normalizedFromWalletAddress });
  }

  const normalizedToWalletAddress = normalizeWalletAddress(event.toWalletAddress);
  if (normalizedToWalletAddress) {
    filters.push({ toWalletAddress: normalizedToWalletAddress });
  }

  return collection.findOne(
    {
      $and: filters,
    },
    {
      sort: { publishedAt: -1, createdAt: -1, _id: -1 },
    },
  );
}

const fetchTransactionReceiptByHash = async (
  transactionHash: string,
): Promise<JsonRpcTransactionReceipt | null> => {
  const response = await fetch(getRpcUrlForConfiguredChain(), {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "eth_getTransactionReceipt",
      params: [transactionHash],
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`eth_getTransactionReceipt failed (${response.status})`);
  }

  const payload = (await response.json()) as { result?: JsonRpcTransactionReceipt | null };
  return payload?.result || null;
};

export async function reconcileUsdtTransactionHashByReceipt(
  params: ReconcileUsdtTransactionHashByReceiptParams,
): Promise<{ registeredCount: number; skippedReason: string | null }> {
  const transactionHash = normalizeText(params.transactionHash);
  if (!transactionHash) {
    return {
      registeredCount: 0,
      skippedReason: "missing_transaction_hash",
    };
  }

  const receipt = await fetchTransactionReceiptByHash(transactionHash);
  if (!receipt) {
    return {
      registeredCount: 0,
      skippedReason: "receipt_not_found",
    };
  }

  const receiptStatus = normalizeHexText(receipt.status);
  if (receiptStatus && receiptStatus !== "0x1") {
    return {
      registeredCount: 0,
      skippedReason: "receipt_not_success",
    };
  }

  const logs = Array.isArray(receipt.logs) ? (receipt.logs as JsonRpcTransferLog[]) : [];
  if (logs.length === 0) {
    return {
      registeredCount: 0,
      skippedReason: "receipt_without_logs",
    };
  }

  const monitoredWalletRecords = await getThirdwebMonitoredWalletRecords();
  const monitoredWalletMap = new Map(
    monitoredWalletRecords
      .map((item) => [normalizeWalletAddress(item.walletAddress), item] as const)
      .filter((entry): entry is [string, (typeof monitoredWalletRecords)[number]] => Boolean(entry[0])),
  );
  const relevantWalletSet = new Set<string>(
    params.relevantWalletAddresses
      ?.map((walletAddress) => normalizeWalletAddress(walletAddress))
      .filter((walletAddress): walletAddress is string => Boolean(walletAddress)) || [],
  );

  for (const walletAddress of monitoredWalletMap.keys()) {
    relevantWalletSet.add(walletAddress);
  }

  const client = await clientPromise;
  const collection = client.db(dbName).collection("transactionHashLogs");
  const chainId = normalizeText(params.chain) || buildChainIdForConfiguredChain();
  const configuredUsdtContractAddress = getUsdtContractAddressForConfiguredChain();

  let registeredCount = 0;

  for (const log of logs) {
    const contractAddress = normalizeWalletAddress(log.address);
    if (contractAddress !== configuredUsdtContractAddress) {
      continue;
    }

    const topics = Array.isArray(log.topics) ? log.topics : [];
    if (topics.length < 3) {
      continue;
    }

    if (normalizeHexText(topics[0]) !== "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef") {
      continue;
    }

    const fromWalletAddress = decodeAddressTopic(topics[1]);
    const toWalletAddress = decodeAddressTopic(topics[2]);

    if (
      !fromWalletAddress
      || !toWalletAddress
      || (!relevantWalletSet.has(fromWalletAddress) && !relevantWalletSet.has(toWalletAddress))
    ) {
      continue;
    }

    const amountRaw = normalizeHexText(log.data);
    if (!amountRaw) {
      continue;
    }

    const amountUsdt = formatUnitsToNumber(amountRaw, getUsdtDecimalsForChainId(chainId));
    const logIndex = normalizeHexText(log.logIndex);
    const minedAt = toIsoFromUnixSeconds(log.blockTimestamp || log.block_timestamp);
    const primaryMonitored =
      monitoredWalletMap.get(fromWalletAddress) || monitoredWalletMap.get(toWalletAddress) || null;
    const event = createUsdtTransactionHashRealtimeEvent(
      {
        eventId: `buyorder-reconcile-${transactionHash.toLowerCase()}-${logIndex || "na"}`,
        idempotencyKey: buildReconcileIdempotencyKey({
          transactionHash,
          logIndex,
          fromWalletAddress,
          toWalletAddress,
          amountUsdt,
        }),
        source: BUYORDER_TRANSACTION_HASH_RECONCILE_SOURCE,
        orderId: params.orderId,
        tradeId: params.tradeId,
        chain: resolveChainName(chainId),
        tokenSymbol: "USDT",
        store:
          params.store || (primaryMonitored?.storecode
            ? {
                code: primaryMonitored.storecode,
                name: primaryMonitored.storeName,
                logo: primaryMonitored.storeLogo,
              }
            : null),
        amountUsdt,
        transactionHash,
        logIndex,
        fromWalletAddress,
        toWalletAddress,
        status: "confirmed",
        queueId: params.queueId || null,
        minedAt,
        createdAt: minedAt || new Date().toISOString(),
        publishedAt: new Date().toISOString(),
      },
      {
        defaultSource: BUYORDER_TRANSACTION_HASH_RECONCILE_SOURCE,
        defaultStatus: "confirmed",
        defaultTokenSymbol: "USDT",
      },
    );

    if (!event) {
      continue;
    }

    const existingTransfer = await findExistingPublicTransferEventDocument(collection, event);
    if (existingTransfer) {
      continue;
    }

    const registered = await registerUsdtTransactionHashRealtimeEvent(event);
    if (!registered.isDuplicate || registered.wasUpdated) {
      registeredCount += 1;
    }
  }

  return {
    registeredCount,
    skippedReason: registeredCount > 0 ? null : "no_matching_usdt_transfer",
  };
}

export const scheduleUsdtTransactionHashReceiptReconcile = (
  params: ReconcileUsdtTransactionHashByReceiptParams,
) => {
  const transactionHash = normalizeText(params.transactionHash)?.toLowerCase();
  if (!transactionHash) {
    return;
  }

  const promiseStore = getScanReceiptReconcilePromiseStore();
  const existingPromise = promiseStore.get(transactionHash);
  if (existingPromise) {
    return;
  }

  const cooldownStore = getScanReceiptReconcileCooldownStore();
  const cooldownUntil = cooldownStore.get(transactionHash) || 0;
  if (cooldownUntil > Date.now()) {
    return;
  }

  const nextPromise = reconcileUsdtTransactionHashByReceipt(params)
    .then((result) => {
      const nextCooldownMs =
        result.skippedReason === "receipt_not_found"
          ? Math.min(15 * 1000, SCAN_RECEIPT_RECONCILE_COOLDOWN_MS)
          : SCAN_RECEIPT_RECONCILE_COOLDOWN_MS;
      cooldownStore.set(transactionHash, Date.now() + nextCooldownMs);
      return result;
    })
    .catch((error) => {
      console.error("Failed to reconcile transaction hash into scan feed:", error);
      cooldownStore.set(transactionHash, Date.now() + 15 * 1000);
      return {
        registeredCount: 0,
        skippedReason: "reconcile_failed",
      };
    })
    .finally(() => {
      promiseStore.delete(transactionHash);
    });

  promiseStore.set(transactionHash, nextPromise);
  void nextPromise;
};

export async function registerUsdtTransactionHashRealtimeEvent(
  event: UsdtTransactionHashRealtimeEvent,
): Promise<RegisterUsdtTransactionHashRealtimeEventResult> {
  const saved = await upsertTransactionHashLogEvent(event);
  const shouldPublish = !saved.isDuplicate || saved.wasUpdated;

  if (shouldPublish) {
    await publishUsdtTransactionHashEvent(saved.event);
  }

  return {
    ...saved,
    wasPublished: shouldPublish,
  };
}
