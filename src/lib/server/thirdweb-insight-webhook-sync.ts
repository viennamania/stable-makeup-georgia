import clientPromise, { dbName } from "@/lib/mongodb";
import {
  THIRDWEB_INSIGHT_ERC20_TRANSFER_SIG_HASH,
  THIRDWEB_INSIGHT_MANAGED_WEBHOOK_COLLECTION,
  THIRDWEB_INSIGHT_MANAGED_WEBHOOK_NAME_PREFIX,
  THIRDWEB_INSIGHT_USDT_TRANSFER_TOPIC,
  clearThirdwebManagedWebhookSecretCache,
  clearThirdwebSellerWalletCache,
  getThirdwebInsightChainId,
  getThirdwebInsightUsdtContractAddress,
  getThirdwebSellerWalletRecords,
} from "@/lib/server/thirdweb-insight-webhook";

const THIRDWEB_WEBHOOK_RECEIVER_PATH = "/api/webhook/thirdweb/usdt-token-transfers";
const DEFAULT_THIRDWEB_INSIGHT_WEBHOOK_CHUNK_SIZE = Math.max(
  Number.parseInt(process.env.THIRDWEB_INSIGHT_WEBHOOK_CHUNK_SIZE || "", 10) || 25,
  1,
);
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
  const walletAddresses = (await getThirdwebSellerWalletRecords()).map((item) => item.walletAddress);
  const desiredWebhooks = buildDesiredThirdwebWebhooks({
    receiverUrl,
    walletAddresses,
  });

  const existingManagedWebhooks = filterManagedThirdwebWebhooks(await listThirdwebWebhooks());

  let createdCount = 0;
  let updatedCount = 0;
  let deletedCount = 0;

  for (let index = 0; index < desiredWebhooks.length; index += 1) {
    const desiredWebhook = desiredWebhooks[index];
    const existingWebhook = existingManagedWebhooks[index];
    if (!existingWebhook) {
      await createThirdwebWebhook(desiredWebhook);
      createdCount += 1;
      continue;
    }

    if (isEquivalentWebhookConfig({ existing: existingWebhook, desired: desiredWebhook })) {
      continue;
    }

    await updateThirdwebWebhook({
      webhookId: existingWebhook.id,
      body: desiredWebhook,
    });
    updatedCount += 1;
  }

  for (let index = desiredWebhooks.length; index < existingManagedWebhooks.length; index += 1) {
    await deleteThirdwebWebhook(existingManagedWebhooks[index].id);
    deletedCount += 1;
  }

  const finalManagedWebhooks = filterManagedThirdwebWebhooks(await listThirdwebWebhooks());
  await persistManagedWebhookRecords(finalManagedWebhooks);

  return {
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
};
