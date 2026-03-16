import { createHash, randomUUID } from "crypto";

import clientPromise, { dbName } from "@/lib/mongodb";
import {
  THIRDWEB_INSIGHT_ERC20_TRANSFER_SIG_HASH,
  THIRDWEB_INSIGHT_MANAGED_WEBHOOK_COLLECTION,
  THIRDWEB_INSIGHT_MANAGED_WEBHOOK_NAME_PREFIX,
  THIRDWEB_INSIGHT_USDT_TRANSFER_TOPIC,
  clearThirdwebMonitoredWalletCache,
  clearThirdwebManagedWebhookSecretCache,
  clearThirdwebSellerWalletCache,
  getThirdwebInsightChainId,
  getThirdwebMonitoredWalletRecords,
  getThirdwebInsightUsdtContractAddress,
} from "@/lib/server/thirdweb-insight-webhook";

const THIRDWEB_WEBHOOK_RECEIVER_PATH = "/api/webhook/thirdweb/usdt-token-transfers";
const DEFAULT_THIRDWEB_INSIGHT_WEBHOOK_CHUNK_SIZE = Math.max(
  Number.parseInt(process.env.THIRDWEB_INSIGHT_WEBHOOK_CHUNK_SIZE || "", 10) || 1,
  1,
);
const THIRDWEB_WEBHOOK_STATUS_CACHE_TTL_MS = Math.max(
  Number.parseInt(process.env.THIRDWEB_WEBHOOK_STATUS_CACHE_TTL_MS || "", 10) || 30 * 1000,
  5 * 1000,
);
const THIRDWEB_WEBHOOK_STATUS_LIVE_TIMEOUT_MS = Math.max(
  Number.parseInt(process.env.THIRDWEB_WEBHOOK_STATUS_LIVE_TIMEOUT_MS || "", 10) || 1500,
  250,
);
const THIRDWEB_WEBHOOK_SYNC_COOLDOWN_MS = Math.max(
  Number.parseInt(process.env.THIRDWEB_WEBHOOK_SYNC_COOLDOWN_MS || "", 10) || 30 * 1000,
  5 * 1000,
);
const THIRDWEB_WEBHOOK_SYNC_LOCK_TTL_MS = Math.max(
  Number.parseInt(process.env.THIRDWEB_WEBHOOK_SYNC_LOCK_TTL_MS || "", 10) || 2 * 60 * 1000,
  15 * 1000,
);
const THIRDWEB_WEBHOOK_SYNC_LOCK_POLL_MS = Math.max(
  Number.parseInt(process.env.THIRDWEB_WEBHOOK_SYNC_LOCK_POLL_MS || "", 10) || 250,
  100,
);
const THIRDWEB_WEBHOOK_SYNC_LOCK_WAIT_MS = Math.max(
  Number.parseInt(process.env.THIRDWEB_WEBHOOK_SYNC_LOCK_WAIT_MS || "", 10) || 5 * 1000,
  THIRDWEB_WEBHOOK_SYNC_LOCK_POLL_MS,
);
const THIRDWEB_INSIGHT_WEBHOOK_SYNC_STATE_COLLECTION = "thirdwebInsightWebhookSyncState";
const THIRDWEB_INSIGHT_WEBHOOK_SYNC_LOCK_COLLECTION = "thirdwebInsightWebhookSyncLocks";
const ERC20_TRANSFER_EVENT_ABI = JSON.stringify({
  anonymous: false,
  inputs: [
    { indexed: true, internalType: "address", name: "from", type: "address" },
    { indexed: true, internalType: "address", name: "to", type: "address" },
    { indexed: false, internalType: "uint256", name: "value", type: "uint256" },
  ],
  name: "Transfer",
  type: "event",
});

type ThirdwebWebhookApiRecord = {
  id: string;
  name: string | null;
  webhookUrl: string;
  webhookSecret: string | null;
  filters: Record<string, unknown>;
  disabled: boolean;
  createdAt: string | null;
  updatedAt: string | null;
};

type DesiredThirdwebWebhook = {
  name: string;
  webhook_url: string;
  filters: Record<string, unknown>;
  disabled: boolean;
  walletAddresses: string[];
  walletCount: number;
};

export type SyncThirdwebSellerUsdtWebhooksResult = {
  ok: true;
  receiverUrl: string;
  walletCount: number;
  desiredWebhookCount: number;
  activeWebhookCount: number;
  createdCount: number;
  updatedCount: number;
  deletedCount: number;
  managedWebhookIds: string[];
};

export type ThirdwebSellerUsdtWebhookStatusRecord = {
  id: string;
  name: string | null;
  webhookUrl: string;
  disabled: boolean;
  urlMatchesExpected: boolean;
  walletCount: number;
  createdAt: string | null;
  updatedAt: string | null;
};

type ThirdwebWebhookSyncStateRecord = {
  _id: string;
  desiredFingerprint: string;
  receiverUrl: string;
  cooldownUntil: string;
  syncedAt: string;
  result: SyncThirdwebSellerUsdtWebhooksResult;
};

export type ThirdwebSellerUsdtWebhookStatus =
  | {
      ok: true;
      mode?: "live" | "persisted-fallback";
      fetchedAt: string;
      receiverUrl: string | null;
      expectedWalletCount: number;
      expectedWebhookCount: number;
      managedWebhookCount: number;
      activeWebhookCount: number;
      disabledWebhookCount: number;
      urlMismatchCount: number;
      webhooks: ThirdwebSellerUsdtWebhookStatusRecord[];
    }
  | {
      ok: false;
      mode?: "live" | "persisted-fallback";
      fetchedAt: string;
      receiverUrl: string | null;
      expectedWalletCount: number;
      expectedWebhookCount: number;
      managedWebhookCount: number;
      activeWebhookCount: number;
      disabledWebhookCount: number;
      urlMismatchCount: number;
      webhooks: ThirdwebSellerUsdtWebhookStatusRecord[];
      error: string;
    };

const globalThirdwebWebhookSyncState = globalThis as typeof globalThis & {
  __thirdwebWebhookStatusCache?: Map<
    string,
    {
      expiresAt: number;
      value: ThirdwebSellerUsdtWebhookStatus;
    }
  >;
  __thirdwebWebhookStatusPromiseCache?: Map<string, Promise<ThirdwebSellerUsdtWebhookStatus>>;
  __thirdwebWebhookSyncCooldownCache?: Map<
    string,
    {
      expiresAt: number;
      value: SyncThirdwebSellerUsdtWebhooksResult;
    }
  >;
  __thirdwebWebhookSyncPromiseCache?: Map<string, Promise<SyncThirdwebSellerUsdtWebhooksResult>>;
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

const toRecord = (value: unknown): Record<string, unknown> | null => {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
};

const toArray = <T = unknown>(value: unknown): T[] => {
  return Array.isArray(value) ? (value as T[]) : [];
};

const normalizeBaseUrl = (value: unknown): string => {
  const normalized = normalizeText(value).replace(/\/$/, "");
  if (!normalized) {
    return "";
  }
  if (/^https?:\/\//i.test(normalized)) {
    return normalized;
  }
  return `https://${normalized}`;
};

const normalizeComparableUrl = (value: unknown): string => {
  return normalizeBaseUrl(value).toLowerCase();
};

const withTimeout = async <T>(
  promise: Promise<T>,
  timeoutMs: number,
  timeoutMessage: string,
): Promise<T> => {
  const safeTimeoutMs = Math.max(100, timeoutMs);
  let timer: ReturnType<typeof setTimeout> | null = null;

  try {
    return await Promise.race([
      promise,
      new Promise<T>((_resolve, reject) => {
        timer = setTimeout(() => reject(new Error(timeoutMessage)), safeTimeoutMs);
      }),
    ]);
  } finally {
    if (timer) {
      clearTimeout(timer);
    }
  }
};

const resolveThirdwebWebhookBaseUrl = (baseUrlRaw?: string | null): string => {
  const candidates = [
    baseUrlRaw,
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.APP_URL,
    process.env.VERCEL_PROJECT_PRODUCTION_URL,
    process.env.VERCEL_URL,
  ];

  for (const candidate of candidates) {
    const normalized = normalizeBaseUrl(candidate);
    if (normalized) {
      return normalized;
    }
  }

  return "";
};

const buildThirdwebWebhookReceiverUrl = (baseUrlRaw?: string | null): string => {
  const baseUrl = resolveThirdwebWebhookBaseUrl(baseUrlRaw);
  if (!baseUrl) {
    return "";
  }
  return `${baseUrl}${THIRDWEB_WEBHOOK_RECEIVER_PATH}`;
};

const getWebhookStatusCacheStore = () => {
  if (!globalThirdwebWebhookSyncState.__thirdwebWebhookStatusCache) {
    globalThirdwebWebhookSyncState.__thirdwebWebhookStatusCache = new Map();
  }
  return globalThirdwebWebhookSyncState.__thirdwebWebhookStatusCache;
};

const getWebhookStatusPromiseStore = () => {
  if (!globalThirdwebWebhookSyncState.__thirdwebWebhookStatusPromiseCache) {
    globalThirdwebWebhookSyncState.__thirdwebWebhookStatusPromiseCache = new Map();
  }
  return globalThirdwebWebhookSyncState.__thirdwebWebhookStatusPromiseCache;
};

const getWebhookSyncCooldownStore = () => {
  if (!globalThirdwebWebhookSyncState.__thirdwebWebhookSyncCooldownCache) {
    globalThirdwebWebhookSyncState.__thirdwebWebhookSyncCooldownCache = new Map();
  }
  return globalThirdwebWebhookSyncState.__thirdwebWebhookSyncCooldownCache;
};

const getWebhookSyncPromiseStore = () => {
  if (!globalThirdwebWebhookSyncState.__thirdwebWebhookSyncPromiseCache) {
    globalThirdwebWebhookSyncState.__thirdwebWebhookSyncPromiseCache = new Map();
  }
  return globalThirdwebWebhookSyncState.__thirdwebWebhookSyncPromiseCache;
};

const clearThirdwebWebhookStatusCache = () => {
  getWebhookStatusCacheStore().clear();
  getWebhookStatusPromiseStore().clear();
};

const setThirdwebWebhookSyncCooldownResult = (
  cacheKey: string,
  value: SyncThirdwebSellerUsdtWebhooksResult,
) => {
  getWebhookSyncCooldownStore().set(cacheKey, {
    expiresAt: Date.now() + THIRDWEB_WEBHOOK_SYNC_COOLDOWN_MS,
    value,
  });
};

const getThirdwebInsightWebhookApiBaseUrl = (): string => {
  const chainId = getThirdwebInsightChainId();
  return `https://${chainId}.insight.thirdweb.com/v1/webhooks`;
};

const getThirdwebSecretKey = (): string => {
  const secretKey = normalizeText(process.env.THIRDWEB_SECRET_KEY);
  if (!secretKey) {
    throw new Error("THIRDWEB_SECRET_KEY is required");
  }
  return secretKey;
};

const buildManagedWebhookNamePrefix = (): string => {
  return `${THIRDWEB_INSIGHT_MANAGED_WEBHOOK_NAME_PREFIX}:${getThirdwebInsightChainId()}`;
};

const buildManagedWebhookName = (index: number): string => {
  return `${buildManagedWebhookNamePrefix()}:${String(index + 1).padStart(3, "0")}`;
};

const buildThirdwebWebhookSyncCacheKey = (receiverUrl: string) =>
  `${buildManagedWebhookNamePrefix()}:${normalizeComparableUrl(receiverUrl)}`;

const chunk = <T>(items: T[], chunkSize: number): T[][] => {
  if (items.length === 0) {
    return [];
  }

  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += chunkSize) {
    chunks.push(items.slice(index, index + chunkSize));
  }
  return chunks;
};

const buildSignatureFilters = (walletAddresses: string[]) => {
  return walletAddresses.flatMap((walletAddress) => [
    {
      sig_hash: THIRDWEB_INSIGHT_ERC20_TRANSFER_SIG_HASH,
      abi: ERC20_TRANSFER_EVENT_ABI,
      params: { from: walletAddress },
    },
    {
      sig_hash: THIRDWEB_INSIGHT_ERC20_TRANSFER_SIG_HASH,
      abi: ERC20_TRANSFER_EVENT_ABI,
      params: { to: walletAddress },
    },
  ]);
};

const canonicalize = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map((item) => canonicalize(item));
  }
  if (value && typeof value === "object") {
    const normalized = value as Record<string, unknown>;
    return Object.keys(normalized)
      .sort()
      .reduce<Record<string, unknown>>((accumulator, key) => {
        accumulator[key] = canonicalize(normalized[key]);
        return accumulator;
      }, {});
  }
  return value;
};

const stableStringify = (value: unknown): string => JSON.stringify(canonicalize(value));

const wait = (timeoutMs: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, Math.max(0, timeoutMs));
  });

const normalizeWebhookFiltersForComparison = (filters: Record<string, unknown>) => {
  const eventFilter = toRecord(filters?.[THIRDWEB_INSIGHT_USDT_TRANSFER_TOPIC]);
  if (!eventFilter) {
    return filters;
  }

  const normalizedEventFilter = {
    ...eventFilter,
    chain_ids: toArray(eventFilter.chain_ids)
      .map((item) => normalizeText(item))
      .filter(Boolean)
      .sort((left, right) => left.localeCompare(right)),
    addresses: toArray(eventFilter.addresses)
      .map((item) => normalizeText(item).toLowerCase())
      .filter(Boolean)
      .sort((left, right) => left.localeCompare(right)),
    signatures: toArray(eventFilter.signatures)
      .map((item) => canonicalize(item))
      .sort((left, right) => stableStringify(left).localeCompare(stableStringify(right))),
  };

  return {
    ...filters,
    [THIRDWEB_INSIGHT_USDT_TRANSFER_TOPIC]: normalizedEventFilter,
  };
};

const buildDesiredWebhookFingerprint = ({
  receiverUrl,
  desiredWebhooks,
}: {
  receiverUrl: string;
  desiredWebhooks: DesiredThirdwebWebhook[];
}) => {
  return createHash("sha256")
    .update(
      stableStringify({
        receiverUrl: normalizeComparableUrl(receiverUrl),
        desiredWebhooks: desiredWebhooks.map((item) => ({
          name: item.name,
          webhook_url: normalizeComparableUrl(item.webhook_url),
          disabled: item.disabled,
          filters: normalizeWebhookFiltersForComparison(item.filters),
        })),
      }),
    )
    .digest("hex");
};

const normalizeThirdwebWebhookApiRecord = (
  value: unknown,
): ThirdwebWebhookApiRecord | null => {
  const record = toRecord(value);
  const id = toNullableText(record?.id);
  const webhookUrl = toNullableText(record?.webhook_url);
  const filters = toRecord(record?.filters);
  if (!id || !webhookUrl || !filters) {
    return null;
  }

  return {
    id,
    name: toNullableText(record?.name),
    webhookUrl,
    webhookSecret: toNullableText(record?.webhook_secret),
    filters,
    disabled: Boolean(record?.disabled),
    createdAt: toNullableText(record?.created_at),
    updatedAt: toNullableText(record?.updated_at),
  };
};

const extractThirdwebErrorMessage = (payload: unknown, fallback: string): string => {
  const record = toRecord(payload);
  const errorRecord = toRecord(record?.error);
  const directMessage = toNullableText(record?.message) || toNullableText(record?.error);
  if (directMessage) {
    return directMessage;
  }

  if (errorRecord) {
    const issueMessages = toArray(errorRecord.issues)
      .map((issue) => toNullableText(toRecord(issue)?.message))
      .filter(Boolean);
    if (issueMessages.length > 0) {
      return issueMessages.join("; ");
    }

    const namedError = toNullableText(errorRecord.message) || toNullableText(errorRecord.name);
    if (namedError) {
      return namedError;
    }
  }

  return fallback;
};

const requestThirdwebWebhookApi = async ({
  method,
  path = "",
  body,
}: {
  method: "GET" | "POST" | "PATCH" | "DELETE";
  path?: string;
  body?: Record<string, unknown>;
}): Promise<unknown> => {
  const url = `${getThirdwebInsightWebhookApiBaseUrl()}${path}`;
  const response = await fetch(url, {
    method,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "x-secret-key": getThirdwebSecretKey(),
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });

  const text = await response.text();
  let payload: unknown = null;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = text;
  }

  if (!response.ok) {
    throw new Error(
      extractThirdwebErrorMessage(
        payload,
        `${method} ${path || "/"} failed (${response.status})`,
      ),
    );
  }

  return payload;
};

const listThirdwebWebhooks = async (): Promise<ThirdwebWebhookApiRecord[]> => {
  const payload = await requestThirdwebWebhookApi({ method: "GET" });
  const records = toArray(toRecord(payload)?.data)
    .map((item) => normalizeThirdwebWebhookApiRecord(item))
    .filter(Boolean) as ThirdwebWebhookApiRecord[];

  return records;
};

const filterManagedThirdwebWebhooks = (records: ThirdwebWebhookApiRecord[]) => {
  const managedPrefix = buildManagedWebhookNamePrefix();
  return records
    .filter((item) => String(item.name || "").startsWith(managedPrefix))
    .sort((left, right) => String(left.name || "").localeCompare(String(right.name || "")));
};

const sortWebhookCandidates = (records: ThirdwebWebhookApiRecord[]) => {
  return [...records].sort((left, right) => {
    const leftUpdated = Date.parse(String(left.updatedAt || left.createdAt || ""));
    const rightUpdated = Date.parse(String(right.updatedAt || right.createdAt || ""));

    if (!Number.isNaN(leftUpdated) && !Number.isNaN(rightUpdated) && leftUpdated !== rightUpdated) {
      return leftUpdated - rightUpdated;
    }

    const leftCreated = Date.parse(String(left.createdAt || ""));
    const rightCreated = Date.parse(String(right.createdAt || ""));

    if (!Number.isNaN(leftCreated) && !Number.isNaN(rightCreated) && leftCreated !== rightCreated) {
      return leftCreated - rightCreated;
    }

    return left.id.localeCompare(right.id);
  });
};

const createThirdwebWebhook = async (
  body: DesiredThirdwebWebhook,
): Promise<ThirdwebWebhookApiRecord> => {
  const payload = await requestThirdwebWebhookApi({
    method: "POST",
    body,
  });
  const record = normalizeThirdwebWebhookApiRecord(toRecord(payload)?.data);
  if (!record) {
    throw new Error("thirdweb webhook create returned an invalid payload");
  }
  return record;
};

const updateThirdwebWebhook = async ({
  webhookId,
  body,
}: {
  webhookId: string;
  body: DesiredThirdwebWebhook;
}): Promise<ThirdwebWebhookApiRecord> => {
  const payload = await requestThirdwebWebhookApi({
    method: "PATCH",
    path: `/${encodeURIComponent(webhookId)}`,
    body,
  });
  const record = normalizeThirdwebWebhookApiRecord(toRecord(payload)?.data);
  if (!record) {
    throw new Error("thirdweb webhook update returned an invalid payload");
  }
  return record;
};

const deleteThirdwebWebhook = async (webhookId: string): Promise<void> => {
  await requestThirdwebWebhookApi({
    method: "DELETE",
    path: `/${encodeURIComponent(webhookId)}`,
  });
};

const buildDesiredThirdwebWebhooks = ({
  receiverUrl,
  walletAddresses,
}: {
  receiverUrl: string;
  walletAddresses: string[];
}): DesiredThirdwebWebhook[] => {
  const chunkedWalletAddresses = chunk(
    [...walletAddresses].sort((left, right) => left.localeCompare(right)),
    DEFAULT_THIRDWEB_INSIGHT_WEBHOOK_CHUNK_SIZE,
  );
  const chainId = getThirdwebInsightChainId();
  const contractAddress = getThirdwebInsightUsdtContractAddress();

  return chunkedWalletAddresses.map((chunkedAddresses, index) => ({
    name: buildManagedWebhookName(index),
    webhook_url: receiverUrl,
    disabled: false,
    walletAddresses: chunkedAddresses,
    walletCount: chunkedAddresses.length,
    filters: {
      [THIRDWEB_INSIGHT_USDT_TRANSFER_TOPIC]: {
        chain_ids: [chainId],
        addresses: [contractAddress],
        signatures: buildSignatureFilters(chunkedAddresses),
      },
    },
  }));
};

const isEquivalentWebhookConfig = ({
  existing,
  desired,
}: {
  existing: ThirdwebWebhookApiRecord;
  desired: DesiredThirdwebWebhook;
}): boolean => {
  return (
    String(existing.name || "") === desired.name &&
    existing.webhookUrl === desired.webhook_url &&
    existing.disabled === desired.disabled &&
    stableStringify(normalizeWebhookFiltersForComparison(existing.filters)) ===
      stableStringify(normalizeWebhookFiltersForComparison(desired.filters))
  );
};

const extractWalletAddressesFromFilters = (filters: Record<string, unknown>): string[] => {
  const eventFilter = toRecord(filters?.[THIRDWEB_INSIGHT_USDT_TRANSFER_TOPIC]);
  const signatures = toArray(eventFilter?.signatures);
  const uniqueWalletAddresses = new Set<string>();

  for (const signature of signatures) {
    const params = toRecord(toRecord(signature)?.params);
    const fromAddress = toNullableText(params?.from)?.toLowerCase();
    const toAddress = toNullableText(params?.to)?.toLowerCase();
    if (fromAddress) {
      uniqueWalletAddresses.add(fromAddress);
    }
    if (toAddress) {
      uniqueWalletAddresses.add(toAddress);
    }
  }

  return [...uniqueWalletAddresses].sort((left, right) => left.localeCompare(right));
};

const getWebhookSyncStateCollection = async () => {
  const client = await clientPromise;
  return client.db(dbName).collection<ThirdwebWebhookSyncStateRecord>(
    THIRDWEB_INSIGHT_WEBHOOK_SYNC_STATE_COLLECTION,
  );
};

const getWebhookSyncLockCollection = async () => {
  const client = await clientPromise;
  return client.db(dbName).collection<{
    _id: string;
    lockToken?: string;
    lockUntil?: Date;
    createdAt?: string;
    updatedAt?: string;
  }>(THIRDWEB_INSIGHT_WEBHOOK_SYNC_LOCK_COLLECTION);
};

const getPersistedThirdwebWebhookSyncResult = async ({
  cacheKey,
  desiredFingerprint,
}: {
  cacheKey: string;
  desiredFingerprint: string;
}): Promise<SyncThirdwebSellerUsdtWebhooksResult | null> => {
  const collection = await getWebhookSyncStateCollection();
  const state = await collection.findOne(
    {
      _id: cacheKey,
      desiredFingerprint,
    },
    {
      projection: {
        result: 1,
        cooldownUntil: 1,
      },
    },
  );

  if (!state?.result) {
    return null;
  }

  const cooldownUntilMs = Date.parse(String(state.cooldownUntil || ""));
  if (Number.isNaN(cooldownUntilMs) || cooldownUntilMs <= Date.now()) {
    return null;
  }

  return state.result;
};

const persistThirdwebWebhookSyncResult = async ({
  cacheKey,
  desiredFingerprint,
  receiverUrl,
  result,
}: {
  cacheKey: string;
  desiredFingerprint: string;
  receiverUrl: string;
  result: SyncThirdwebSellerUsdtWebhooksResult;
}) => {
  const collection = await getWebhookSyncStateCollection();
  const syncedAt = new Date().toISOString();
  const cooldownUntil = new Date(Date.now() + THIRDWEB_WEBHOOK_SYNC_COOLDOWN_MS).toISOString();

  await collection.updateOne(
    { _id: cacheKey },
    {
      $set: {
        desiredFingerprint,
        receiverUrl,
        cooldownUntil,
        syncedAt,
        result,
      },
      $setOnInsert: {
        createdAt: syncedAt,
      },
    },
    { upsert: true },
  );
};

const acquireThirdwebWebhookSyncLock = async (cacheKey: string): Promise<string | null> => {
  const collection = await getWebhookSyncLockCollection();
  const now = new Date();
  const token = randomUUID();
  const lockUntil = new Date(now.getTime() + THIRDWEB_WEBHOOK_SYNC_LOCK_TTL_MS);

  try {
    const result = await collection.updateOne(
      {
        _id: cacheKey,
        $or: [
          { lockUntil: { $exists: false } },
          { lockUntil: { $lte: now } },
        ],
      },
      {
        $set: {
          lockToken: token,
          lockUntil,
          updatedAt: now.toISOString(),
        },
        $setOnInsert: {
          createdAt: now.toISOString(),
        },
      },
      { upsert: true },
    );

    if (result.matchedCount > 0 || result.modifiedCount > 0 || result.upsertedCount > 0) {
      return token;
    }

    return null;
  } catch (error: any) {
    if (error?.code === 11000) {
      return null;
    }
    throw error;
  }
};

const releaseThirdwebWebhookSyncLock = async (cacheKey: string, token: string) => {
  const collection = await getWebhookSyncLockCollection();
  await collection.updateOne(
    {
      _id: cacheKey,
      lockToken: token,
    },
    {
      $unset: {
        lockToken: "",
      },
      $set: {
        lockUntil: new Date(0),
        updatedAt: new Date().toISOString(),
      },
    },
  );
};

const waitForThirdwebWebhookSyncResult = async ({
  cacheKey,
  desiredFingerprint,
}: {
  cacheKey: string;
  desiredFingerprint: string;
}): Promise<SyncThirdwebSellerUsdtWebhooksResult | null> => {
  const deadline = Date.now() + THIRDWEB_WEBHOOK_SYNC_LOCK_WAIT_MS;

  while (Date.now() < deadline) {
    const persisted = await getPersistedThirdwebWebhookSyncResult({
      cacheKey,
      desiredFingerprint,
    });
    if (persisted) {
      return persisted;
    }
    await wait(THIRDWEB_WEBHOOK_SYNC_LOCK_POLL_MS);
  }

  return null;
};

const buildThirdwebSellerUsdtWebhookStatus = async ({
  baseUrl,
}: {
  baseUrl?: string | null;
} = {}): Promise<ThirdwebSellerUsdtWebhookStatus> => {
  const fetchedAt = new Date().toISOString();
  const receiverUrl = buildThirdwebWebhookReceiverUrl(baseUrl) || null;
  const walletAddresses = (await getThirdwebMonitoredWalletRecords()).map((item) => item.walletAddress);
  const expectedWalletCount = walletAddresses.length;
  const expectedWebhookCount = chunk(
    [...walletAddresses].sort((left, right) => left.localeCompare(right)),
    DEFAULT_THIRDWEB_INSIGHT_WEBHOOK_CHUNK_SIZE,
  ).length;

  try {
    const managedWebhooks = filterManagedThirdwebWebhooks(await listThirdwebWebhooks());
    const expectedComparableUrl = normalizeComparableUrl(receiverUrl);
    const webhooks = managedWebhooks.map<ThirdwebSellerUsdtWebhookStatusRecord>((record) => {
      const urlMatchesExpected = Boolean(
        expectedComparableUrl && normalizeComparableUrl(record.webhookUrl) === expectedComparableUrl,
      );

      return {
        id: record.id,
        name: record.name,
        webhookUrl: record.webhookUrl,
        disabled: record.disabled,
        urlMatchesExpected,
        walletCount: extractWalletAddressesFromFilters(record.filters).length,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
      };
    });

    const disabledWebhookCount = webhooks.filter((item) => item.disabled).length;
    const activeWebhookCount = webhooks.length - disabledWebhookCount;
    const urlMismatchCount = webhooks.filter((item) => !item.urlMatchesExpected).length;

    return {
      ok: true,
      mode: "live",
      fetchedAt,
      receiverUrl,
      expectedWalletCount,
      expectedWebhookCount,
      managedWebhookCount: webhooks.length,
      activeWebhookCount,
      disabledWebhookCount,
      urlMismatchCount,
      webhooks,
    };
  } catch (error) {
    return {
      ok: false,
      mode: "live",
      fetchedAt,
      receiverUrl,
      expectedWalletCount,
      expectedWebhookCount,
      managedWebhookCount: 0,
      activeWebhookCount: 0,
      disabledWebhookCount: 0,
      urlMismatchCount: 0,
      webhooks: [],
      error: error instanceof Error ? error.message : "Failed to load thirdweb webhook status",
    };
  }
};

const buildPersistedThirdwebSellerUsdtWebhookStatus = async ({
  baseUrl,
  errorMessage,
}: {
  baseUrl?: string | null;
  errorMessage: string;
}): Promise<ThirdwebSellerUsdtWebhookStatus> => {
  const fetchedAt = new Date().toISOString();
  const receiverUrl = buildThirdwebWebhookReceiverUrl(baseUrl) || null;
  const walletAddresses = (await getThirdwebMonitoredWalletRecords()).map((item) => item.walletAddress);
  const expectedWalletCount = walletAddresses.length;
  const expectedWebhookCount = chunk(
    [...walletAddresses].sort((left, right) => left.localeCompare(right)),
    DEFAULT_THIRDWEB_INSIGHT_WEBHOOK_CHUNK_SIZE,
  ).length;

  try {
    const client = await clientPromise;
    const database = client.db(dbName);
    const collection = database.collection(THIRDWEB_INSIGHT_MANAGED_WEBHOOK_COLLECTION);
    const managedPrefix = buildManagedWebhookNamePrefix();
    const records = await collection
      .find(
        { managedPrefix },
        {
          projection: {
            _id: 0,
            webhookId: 1,
            name: 1,
            webhookUrl: 1,
            disabled: 1,
            walletCount: 1,
            thirdwebCreatedAt: 1,
            thirdwebUpdatedAt: 1,
          },
        },
      )
      .sort({ name: 1, webhookId: 1 })
      .toArray();

    const expectedComparableUrl = normalizeComparableUrl(receiverUrl);
    const webhooks = records.map<ThirdwebSellerUsdtWebhookStatusRecord>((record: any, index: number) => {
      const webhookUrl = toNullableText(record?.webhookUrl) || "";
      const fallbackId =
        toNullableText(record?.webhookId)
        || webhookUrl
        || toNullableText(record?.name)
        || `${managedPrefix}:${String(index + 1).padStart(3, "0")}`;
      const urlMatchesExpected = Boolean(
        expectedComparableUrl && normalizeComparableUrl(webhookUrl) === expectedComparableUrl,
      );

      return {
        id: fallbackId,
        name: toNullableText(record?.name),
        webhookUrl,
        disabled: Boolean(record?.disabled),
        urlMatchesExpected,
        walletCount: Number(record?.walletCount || 0),
        createdAt: toNullableText(record?.thirdwebCreatedAt),
        updatedAt: toNullableText(record?.thirdwebUpdatedAt),
      };
    });

    const disabledWebhookCount = webhooks.filter((item) => item.disabled).length;
    const activeWebhookCount = webhooks.length - disabledWebhookCount;
    const urlMismatchCount = webhooks.filter((item) => !item.urlMatchesExpected).length;

    return {
      ok: false,
      mode: "persisted-fallback",
      fetchedAt,
      receiverUrl,
      expectedWalletCount,
      expectedWebhookCount,
      managedWebhookCount: webhooks.length,
      activeWebhookCount,
      disabledWebhookCount,
      urlMismatchCount,
      webhooks,
      error: errorMessage,
    };
  } catch (error) {
    return {
      ok: false,
      mode: "persisted-fallback",
      fetchedAt,
      receiverUrl,
      expectedWalletCount,
      expectedWebhookCount,
      managedWebhookCount: 0,
      activeWebhookCount: 0,
      disabledWebhookCount: 0,
      urlMismatchCount: 0,
      webhooks: [],
      error:
        error instanceof Error
          ? `${errorMessage}; persisted fallback failed: ${error.message}`
          : `${errorMessage}; persisted fallback failed`,
    };
  }
};

export const getThirdwebSellerUsdtWebhookStatus = async ({
  baseUrl,
}: {
  baseUrl?: string | null;
} = {}): Promise<ThirdwebSellerUsdtWebhookStatus> => {
  const receiverUrl = buildThirdwebWebhookReceiverUrl(baseUrl) || "__default__";
  const cacheStore = getWebhookStatusCacheStore();
  const cached = cacheStore.get(receiverUrl);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.value;
  }

  const promiseStore = getWebhookStatusPromiseStore();
  const existingPromise = promiseStore.get(receiverUrl);
  if (existingPromise) {
    return existingPromise;
  }

  const nextPromise = withTimeout(
    buildThirdwebSellerUsdtWebhookStatus({ baseUrl }),
    THIRDWEB_WEBHOOK_STATUS_LIVE_TIMEOUT_MS,
    `thirdweb webhook status timed out after ${THIRDWEB_WEBHOOK_STATUS_LIVE_TIMEOUT_MS}ms`,
  )
    .catch((error) =>
      buildPersistedThirdwebSellerUsdtWebhookStatus({
        baseUrl,
        errorMessage:
          error instanceof Error ? error.message : "Failed to load thirdweb webhook status",
      }),
    )
    .then((value) => {
      cacheStore.set(receiverUrl, {
        expiresAt: Date.now() + THIRDWEB_WEBHOOK_STATUS_CACHE_TTL_MS,
        value,
      });
      return value;
    })
    .finally(() => {
      promiseStore.delete(receiverUrl);
    });

  promiseStore.set(receiverUrl, nextPromise);
  return nextPromise;
};

const persistManagedWebhookRecords = async (records: ThirdwebWebhookApiRecord[]) => {
  const managedPrefix = buildManagedWebhookNamePrefix();
  const syncedAt = new Date().toISOString();
  const client = await clientPromise;
  const database = client.db(dbName);
  const collection = database.collection(THIRDWEB_INSIGHT_MANAGED_WEBHOOK_COLLECTION);

  if (records.length === 0) {
    await collection.deleteMany({ managedPrefix });
    clearThirdwebManagedWebhookSecretCache();
    return;
  }

  const managedWebhookIds = records.map((record) => record.id);
  await collection.deleteMany({
    managedPrefix,
    webhookId: { $nin: managedWebhookIds },
  });

  await collection.bulkWrite(
    records.map((record) => {
      const walletAddresses = extractWalletAddressesFromFilters(record.filters);
      return {
        updateOne: {
          filter: { webhookId: record.id },
          update: {
            $set: {
              webhookId: record.id,
              name: record.name,
              webhookUrl: record.webhookUrl,
              webhookSecret: record.webhookSecret,
              filters: record.filters,
              disabled: record.disabled,
              managedPrefix,
              receiverUrl: record.webhookUrl,
              chainId: getThirdwebInsightChainId(),
              walletAddresses,
              walletCount: walletAddresses.length,
              thirdwebCreatedAt: record.createdAt,
              thirdwebUpdatedAt: record.updatedAt,
              syncedAt,
            },
            $setOnInsert: {
              createdAt: syncedAt,
            },
          },
          upsert: true,
        },
      };
    }),
  );

  clearThirdwebManagedWebhookSecretCache();
};

export const syncThirdwebSellerUsdtWebhooks = async ({
  baseUrl,
}: {
  baseUrl?: string | null;
} = {}): Promise<SyncThirdwebSellerUsdtWebhooksResult> => {
  const receiverUrl = buildThirdwebWebhookReceiverUrl(baseUrl);
  if (!receiverUrl) {
    throw new Error("A public app URL is required to register thirdweb webhooks");
  }

  clearThirdwebSellerWalletCache();
  clearThirdwebMonitoredWalletCache();
  const walletAddresses = (await getThirdwebMonitoredWalletRecords()).map((item) => item.walletAddress);
  const desiredWebhooks = buildDesiredThirdwebWebhooks({
    receiverUrl,
    walletAddresses,
  });
  const cacheKey = buildThirdwebWebhookSyncCacheKey(receiverUrl);
  const desiredFingerprint = buildDesiredWebhookFingerprint({
    receiverUrl,
    desiredWebhooks,
  });

  const persistedCooldownResult = await getPersistedThirdwebWebhookSyncResult({
    cacheKey,
    desiredFingerprint,
  });
  if (persistedCooldownResult) {
    setThirdwebWebhookSyncCooldownResult(cacheKey, persistedCooldownResult);
    return persistedCooldownResult;
  }

  const lockToken = await acquireThirdwebWebhookSyncLock(cacheKey);
  if (!lockToken) {
    const waitedResult = await waitForThirdwebWebhookSyncResult({
      cacheKey,
      desiredFingerprint,
    });
    if (waitedResult) {
      setThirdwebWebhookSyncCooldownResult(cacheKey, waitedResult);
      return waitedResult;
    }

    throw new Error("Another thirdweb webhook sync is already running");
  }

  try {
    const existingManagedWebhooks = filterManagedThirdwebWebhooks(await listThirdwebWebhooks());
    const existingByName = new Map<string, ThirdwebWebhookApiRecord[]>();

    for (const record of existingManagedWebhooks) {
      const name = String(record.name || "").trim();
      if (!name) {
        continue;
      }
      const records = existingByName.get(name) || [];
      records.push(record);
      existingByName.set(name, records);
    }

    let createdCount = 0;
    let updatedCount = 0;
    let deletedCount = 0;

    for (const desiredWebhook of desiredWebhooks) {
      const candidates = sortWebhookCandidates(existingByName.get(desiredWebhook.name) || []);
      existingByName.delete(desiredWebhook.name);

      if (candidates.length === 0) {
        await createThirdwebWebhook(desiredWebhook);
        createdCount += 1;
        continue;
      }

      let canonical =
        candidates.find((candidate) =>
          isEquivalentWebhookConfig({
            existing: candidate,
            desired: desiredWebhook,
          }),
        ) || candidates[0];

      if (
        !isEquivalentWebhookConfig({
          existing: canonical,
          desired: desiredWebhook,
        })
      ) {
        canonical = await updateThirdwebWebhook({
          webhookId: canonical.id,
          body: desiredWebhook,
        });
        updatedCount += 1;
      }

      for (const duplicate of candidates) {
        if (duplicate.id === canonical.id) {
          continue;
        }
        await deleteThirdwebWebhook(duplicate.id);
        deletedCount += 1;
      }
    }

    for (const staleRecords of existingByName.values()) {
      for (const staleRecord of staleRecords) {
        await deleteThirdwebWebhook(staleRecord.id);
        deletedCount += 1;
      }
    }

    const finalManagedWebhooks = filterManagedThirdwebWebhooks(await listThirdwebWebhooks());
    await persistManagedWebhookRecords(finalManagedWebhooks);
    clearThirdwebWebhookStatusCache();

    const result: SyncThirdwebSellerUsdtWebhooksResult = {
      ok: true,
      receiverUrl,
      walletCount: walletAddresses.length,
      desiredWebhookCount: desiredWebhooks.length,
      activeWebhookCount: finalManagedWebhooks.length,
      createdCount,
      updatedCount,
      deletedCount,
      managedWebhookIds: finalManagedWebhooks.map((item) => item.id),
    };

    await persistThirdwebWebhookSyncResult({
      cacheKey,
      desiredFingerprint,
      receiverUrl,
      result,
    });
    setThirdwebWebhookSyncCooldownResult(cacheKey, result);
    return result;
  } finally {
    await releaseThirdwebWebhookSyncLock(cacheKey, lockToken);
  }
};

export const syncThirdwebSellerUsdtWebhooksIfStale = async ({
  baseUrl,
}: {
  baseUrl?: string | null;
} = {}): Promise<SyncThirdwebSellerUsdtWebhooksResult> => {
  const cacheKey = buildThirdwebWebhookReceiverUrl(baseUrl) || resolveThirdwebWebhookBaseUrl(baseUrl) || "__default__";
  const cooldownStore = getWebhookSyncCooldownStore();
  const cached = cooldownStore.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.value;
  }

  const promiseStore = getWebhookSyncPromiseStore();
  const existingPromise = promiseStore.get(cacheKey);
  if (existingPromise) {
    return existingPromise;
  }

  const nextPromise = syncThirdwebSellerUsdtWebhooks({ baseUrl })
    .then((value) => {
      setThirdwebWebhookSyncCooldownResult(cacheKey, value);
      return value;
    })
    .finally(() => {
      promiseStore.delete(cacheKey);
    });

  promiseStore.set(cacheKey, nextPromise);
  return nextPromise;
};
