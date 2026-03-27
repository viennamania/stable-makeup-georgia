import clientPromise, { dbName } from "../mongodb";

import {
  CLIENT_EXCHANGE_RATE_KEYS,
  createEmptyClientExchangeRateMap,
  getChangedClientExchangeRateKeys,
  parseClientExchangeRateMap,
  type ClientExchangeRateHistoryItem,
  type ClientExchangeRateHistoryType,
  type ClientExchangeRateMap,
} from "@/lib/client-settings";

const CLIENT_EXCHANGE_RATE_HISTORY_COLLECTION = "clientExchangeRateHistory";

type UpdateClientExchangeRateAudit = {
  route?: string | null;
  publicIp?: string | null;
  requesterWalletAddress?: string | null;
  requesterNickname?: string | null;
  requesterStorecode?: string | null;
  requesterRole?: string | null;
  userAgent?: string | null;
  updatedAt?: Date | string | null;
};

const normalizeString = (value: unknown) => {
  if (typeof value !== "string") {
    return "";
  }
  return value.trim();
};

const normalizeHistoryRateType = (value: unknown): ClientExchangeRateHistoryType => {
  return value === "sell" ? "sell" : "buy";
};

const serializeClientExchangeRateHistoryItem = (
  value: Record<string, unknown> | null | undefined,
): ClientExchangeRateHistoryItem | null => {
  if (!value) {
    return null;
  }

  const after = parseClientExchangeRateMap(value.after);
  if (!after) {
    return null;
  }

  const before = parseClientExchangeRateMap(value.before) || createEmptyClientExchangeRateMap();
  const changedKeysRaw = Array.isArray(value.changedKeys) ? value.changedKeys : [];
  const changedKeys = changedKeysRaw
    .map((item) => String(item))
    .filter((item): item is (typeof CLIENT_EXCHANGE_RATE_KEYS)[number] =>
      CLIENT_EXCHANGE_RATE_KEYS.includes(item as (typeof CLIENT_EXCHANGE_RATE_KEYS)[number]),
    );
  const updatedAt =
    value.updatedAt instanceof Date
      ? value.updatedAt.toISOString()
      : normalizeString(value.updatedAt);

  return {
    _id: String((value._id as { toString?: () => string } | undefined)?.toString?.() || value._id || ""),
    clientId: normalizeString(value.clientId),
    rateType: normalizeHistoryRateType(value.rateType),
    before,
    after,
    changedKeys,
    requesterWalletAddress: normalizeString(value.requesterWalletAddress),
    requesterNickname: normalizeString(value.requesterNickname),
    requesterStorecode: normalizeString(value.requesterStorecode),
    requesterRole: normalizeString(value.requesterRole),
    route: normalizeString(value.route),
    updatedAt,
  };
};

const getDb = async () => {
  const client = await clientPromise;
  return client.db(dbName);
};

const getClientCollection = async () => {
  const db = await getDb();
  return db.collection("clients");
};

const getClientExchangeRateHistoryCollection = async () => {
  const db = await getDb();
  return db.collection(CLIENT_EXCHANGE_RATE_HISTORY_COLLECTION);
};

const updateClientFields = async (
  clientId: string,
  fields: Record<string, unknown>,
  upsert = false,
) => {
  const collection = await getClientCollection();

  return collection.updateOne(
    { clientId },
    { $set: fields },
    { upsert },
  );
};

export async function getOne(clientId: string) {
  const collection = await getClientCollection();
  return collection.findOne({ clientId });
}

export async function updateClientProfile(
  clientId: string,
  data: {
    name: string;
    description: string;
  },
) {
  return updateClientFields(
    clientId,
    {
      name: data.name,
      description: data.description,
    },
    true,
  );
}

const logClientExchangeRateHistory = async (
  payload: Record<string, unknown>,
): Promise<ClientExchangeRateHistoryItem | null> => {
  try {
    const historyCollection = await getClientExchangeRateHistoryCollection();
    const result = await historyCollection.insertOne(payload);
    return serializeClientExchangeRateHistoryItem({
      ...payload,
      _id: result.insertedId,
    });
  } catch (error) {
    console.error("Failed to log client exchange rate history", error);
    return null;
  }
};

const updateClientExchangeRateField = async ({
  clientId,
  field,
  rateType,
  nextValue,
  audit,
}: {
  clientId: string;
  field: "exchangeRateUSDT" | "exchangeRateUSDTSell";
  rateType: ClientExchangeRateHistoryType;
  nextValue: ClientExchangeRateMap;
  audit?: UpdateClientExchangeRateAudit;
}) => {
  const collection = await getClientCollection();
  const existingClient = await collection.findOne(
    { clientId },
    { projection: { [field]: 1 } },
  );
  const beforeValue =
    parseClientExchangeRateMap(existingClient?.[field]) || createEmptyClientExchangeRateMap();
  const changedKeys = getChangedClientExchangeRateKeys(beforeValue, nextValue);

  const result = await collection.updateOne(
    { clientId },
    { $set: { [field]: nextValue } },
    { upsert: true },
  );

  const historyEntry =
    result?.acknowledged && changedKeys.length > 0
      ? await logClientExchangeRateHistory({
          clientId,
          rateType,
          field,
          before: beforeValue,
          after: nextValue,
          changedKeys,
          changed: changedKeys.length > 0,
          publicIp: normalizeString(audit?.publicIp) || null,
          requesterWalletAddress:
            normalizeString(audit?.requesterWalletAddress).toLowerCase() || null,
          requesterNickname: normalizeString(audit?.requesterNickname) || null,
          requesterStorecode: normalizeString(audit?.requesterStorecode).toLowerCase() || null,
          requesterRole: normalizeString(audit?.requesterRole).toLowerCase() || null,
          userAgent: normalizeString(audit?.userAgent).slice(0, 1000) || null,
          route: normalizeString(audit?.route) || null,
          updatedAt: audit?.updatedAt ? new Date(audit.updatedAt) : new Date(),
        })
      : null;

  return {
    result,
    historyEntry,
  };
};

export async function updateClientExchangeRateBuy(
  clientId: string,
  exchangeRateUSDT: ClientExchangeRateMap,
  audit?: UpdateClientExchangeRateAudit,
) {
  return updateClientExchangeRateField({
    clientId,
    field: "exchangeRateUSDT",
    rateType: "buy",
    nextValue: exchangeRateUSDT,
    audit,
  });
}

export async function updateClientExchangeRateSell(
  clientId: string,
  exchangeRateUSDTSell: ClientExchangeRateMap,
  audit?: UpdateClientExchangeRateAudit,
) {
  return updateClientExchangeRateField({
    clientId,
    field: "exchangeRateUSDTSell",
    rateType: "sell",
    nextValue: exchangeRateUSDTSell,
    audit,
  });
}

export async function getClientExchangeRateHistory({
  clientId,
  rateType,
  limit = 10,
}: {
  clientId: string;
  rateType: ClientExchangeRateHistoryType;
  limit?: number;
}) {
  if (!clientId) {
    return [];
  }

  const collection = await getClientExchangeRateHistoryCollection();
  const items = await collection
    .find({
      clientId,
      rateType,
    })
    .sort({ updatedAt: -1, _id: -1 })
    .limit(Math.max(1, limit))
    .toArray();

  return items
    .map((item) => serializeClientExchangeRateHistoryItem(item as Record<string, unknown>))
    .filter((item): item is ClientExchangeRateHistoryItem => Boolean(item));
}

export async function updateAvatar(clientId: string, avatar: string) {
  return updateClientFields(
    clientId,
    {
      avatar,
    },
    false,
  );
}

export async function updatePayactionViewOn(clientId: string, payactionViewOn: boolean) {
  return updateClientFields(
    clientId,
    {
      payactionViewOn,
    },
    false,
  );
}
