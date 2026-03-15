import { createHash } from "crypto";

import clientPromise from '../mongodb';

import { dbName } from '../mongodb';
import type { UsdtTransactionHashRealtimeEvent } from "@lib/ably/constants";
import { publishUsdtTransactionHashEvent } from "@lib/ably/server";
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

const PUBLIC_SCAN_EVENT_SOURCES = [
  "api.realtime.scan.usdt-token-transfers.ingest",
  "thirdweb.insight.webhook",
] as const;
const PUBLIC_SCAN_EVENT_SOURCE_SET = new Set<string>(PUBLIC_SCAN_EVENT_SOURCES);

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

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
    fromWalletAddress: event.fromWalletAddress || null,
    toWalletAddress: event.toWalletAddress || null,
    fromLabel: event.fromLabel || null,
    toLabel: event.toLabel || null,
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
    fromWalletAddress,
    toWalletAddress,
    fromLabel: normalizeText(input?.fromLabel) || extractLabel(input?.from, fromWalletAddress),
    toLabel: normalizeText(input?.toLabel) || extractLabel(input?.to, toWalletAddress),
    status: normalizeText(input?.status) || options?.defaultStatus || null,
    queueId: normalizeText(input?.queueId),
    minedAt: normalizeText(input?.minedAt),
    createdAt,
    publishedAt: toIsoString(input?.publishedAt),
  };
}

export function normalizeTransactionHashLogDocument(document: any): UsdtTransactionHashRealtimeEvent {
  const transactionHash = normalizeText(document?.transactionHash) || "";
  const fromWalletAddress =
    normalizeWalletAddress(document?.fromWalletAddress) ||
    extractWalletAddress(document?.from);
  const toWalletAddress =
    normalizeWalletAddress(document?.toWalletAddress) ||
    extractWalletAddress(document?.to);
  const createdAt = toIsoString(document?.createdAt);

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
    store: document?.store && typeof document.store === "object"
      ? {
          code: normalizeText(document.store.code),
          logo: normalizeText(document.store.logo),
          name: normalizeText(document.store.name),
        }
      : null,
    amountUsdt: toSafeNumber(document?.amountUsdt ?? document?.amount),
    transactionHash,
    fromWalletAddress,
    toWalletAddress,
    fromLabel: normalizeText(document?.fromLabel) || extractLabel(document?.from, fromWalletAddress),
    toLabel: normalizeText(document?.toLabel) || extractLabel(document?.to, toWalletAddress),
    status: normalizeText(document?.status),
    queueId: normalizeText(document?.queueId),
    minedAt: normalizeText(document?.minedAt),
    createdAt,
    publishedAt: toIsoString(document?.publishedAt || document?.createdAt),
  };
}


// fetch latest transaction hash logs
export async function getLatestTransactionHashLogs(limit = 10): Promise<TransactionHashLog[]> {

  const client = await clientPromise;
  const collection = client.db(dbName).collection('transactionHashLogs');


  const safeLimit = Math.max(1, Math.min(Number(limit) || 10, 100));


  const logs = await collection
    .find<TransactionHashLog>({})
    .sort({ createdAt: -1, _id: -1 })
    .limit(safeLimit)
    .toArray();


  return logs;

}

export async function getLatestTransactionHashLogEvents({
  limit = 50,
  address,
}: GetLatestTransactionHashLogEventsParams = {}): Promise<UsdtTransactionHashRealtimeEvent[]> {
  const client = await clientPromise;
  const collection = client.db(dbName).collection('transactionHashLogs');

  const safeLimit = Math.max(1, Math.min(Number(limit) || 50, 200));
  const normalizedAddress = normalizeWalletAddress(address);
  const query = buildPublicScanTransactionHashLogQuery(normalizedAddress);

  const logs = await collection
    .find<any>(query)
    .sort({ createdAt: -1, _id: -1 })
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

export async function getTransactionHashLogEventByHash(
  transactionHash: string | null | undefined,
): Promise<UsdtTransactionHashRealtimeEvent | null> {
  const normalizedTransactionHash = normalizeText(transactionHash);
  if (!normalizedTransactionHash) {
    return null;
  }

  const client = await clientPromise;
  const collection = client.db(dbName).collection('transactionHashLogs');

  const document = await collection.findOne(
    {
      $and: [
        {
          transactionHash: {
            $regex: `^${escapeRegex(normalizedTransactionHash)}$`,
            $options: "i",
          },
        },
        buildPublicScanTransactionHashLogQuery(null),
      ],
    },
    {
      sort: { createdAt: -1, _id: -1 },
    },
  );

  if (!document || !isPublicScanTransactionHashEvent(document)) {
    return null;
  }

  return normalizeTransactionHashLogDocument(document);
}

export async function saveTransactionHashLogEvent(
  event: UsdtTransactionHashRealtimeEvent,
): Promise<{ event: UsdtTransactionHashRealtimeEvent; isDuplicate: boolean }> {
  const client = await clientPromise;
  const collection = client.db(dbName).collection('transactionHashLogs');
  const idempotencyKey = normalizeText(event.idempotencyKey);

  if (idempotencyKey) {
    const existing = await collection.findOne({ idempotencyKey });
    if (existing) {
      return {
        event: normalizeTransactionHashLogDocument(existing),
        isDuplicate: true,
      };
    }
  }

  const payload = {
    ...event,
    createdAt: toIsoString(event.createdAt),
    publishedAt: toIsoString(event.publishedAt),
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
  const idempotencyKey = normalizeText(event.idempotencyKey);

  if (!idempotencyKey) {
    const payload = {
      ...event,
      createdAt: toIsoString(event.createdAt),
      publishedAt: toIsoString(event.publishedAt),
    };

    await collection.insertOne(payload);

    return {
      event: normalizeTransactionHashLogDocument(payload),
      isDuplicate: false,
      wasUpdated: false,
    };
  }

  const existing = await collection.findOne({ idempotencyKey });
  if (!existing) {
    const payload = {
      ...event,
      createdAt: toIsoString(event.createdAt),
      publishedAt: toIsoString(event.publishedAt),
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
    ...event,
    eventId: existingEvent.eventId || event.eventId,
    idempotencyKey: existingEvent.idempotencyKey || event.idempotencyKey,
    createdAt: toIsoString(existingEvent.createdAt || event.createdAt),
    publishedAt: toIsoString(event.publishedAt || existingEvent.publishedAt),
  };

  if (toComparableEvent(existingEvent) === toComparableEvent(mergedEvent)) {
    return {
      event: existingEvent,
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
