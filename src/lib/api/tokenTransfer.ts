import clientPromise from '../mongodb';

import { dbName } from '../mongodb';
import type { UsdtTransactionHashRealtimeEvent } from "@lib/ably/constants";
import { normalizeWalletAddress } from "@/lib/server/user-read-security";


export interface TransactionHashLog {
  chain?: string;
  transactionHash: string;
  from?: string;
  to?: string;
  amount?: number;
  createdAt?: string | Date;
}

type GetLatestTransactionHashLogEventsParams = {
  limit?: number;
  address?: string | null;
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
  const query = normalizedAddress
    ? {
        $or: [
          { fromWalletAddress: normalizedAddress },
          { toWalletAddress: normalizedAddress },
          { "from.walletAddress": normalizedAddress },
          { "to.walletAddress": normalizedAddress },
          { from: normalizedAddress },
          { to: normalizedAddress },
        ],
      }
    : {};

  const logs = await collection
    .find<any>(query)
    .sort({ createdAt: -1, _id: -1 })
    .limit(safeLimit)
    .toArray();

  return logs
    .map((document) => normalizeTransactionHashLogDocument(document))
    .filter((item) => {
      if (!normalizedAddress) {
        return true;
      }
      return item.fromWalletAddress === normalizedAddress || item.toWalletAddress === normalizedAddress;
    });
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
