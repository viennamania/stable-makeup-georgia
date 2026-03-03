import clientPromise from "@/lib/mongodb";
import { dbName } from "@/lib/mongodb";

export const STORE_SETTINGS_API_CALL_LOG_COLLECTION = "storeSettingsApiCallLogs";

type InsertStoreSettingsApiCallLogInput = {
  route: string;
  status: "allowed" | "blocked";
  reason?: string;
  publicIp?: string | null;
  publicCountry?: string | null;
  requesterWalletAddress?: string | null;
  requesterUser?: any;
  requestBody?: Record<string, unknown> | null;
  createdAt?: Date | string;
};

const normalizeString = (value: unknown) => {
  if (typeof value !== "string") {
    return "";
  }
  return value.trim();
};

const normalizeCountry = (value: unknown) => {
  const raw = normalizeString(value).toUpperCase();
  if (!raw || raw === "UNKNOWN") {
    return null;
  }
  return raw;
};

const maskAccountNumber = (value: string) => {
  const raw = value.replace(/\s+/g, "");
  if (raw.length <= 4) {
    return "*".repeat(raw.length);
  }
  return `${"*".repeat(Math.max(0, raw.length - 4))}${raw.slice(-4)}`;
};

const SENSITIVE_KEYS = [
  "password",
  "privatekey",
  "secret",
  "accesstoken",
  "token",
  "apikey",
  "webhookkey",
  "signature",
  "signedat",
  "nonce",
];

const ACCOUNT_NUMBER_KEYS = [
  "accountnumber",
  "withdrawalaccountnumber",
  "realaccountnumber",
  "defaultaccountnumber",
];

const sanitizePayload = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map((item) => sanitizePayload(item));
  }

  if (!value || typeof value !== "object") {
    return value;
  }

  const objectValue = value as Record<string, unknown>;
  const sanitized: Record<string, unknown> = {};

  for (const [key, itemValue] of Object.entries(objectValue)) {
    const normalizedKey = key.toLowerCase();

    if (SENSITIVE_KEYS.some((token) => normalizedKey.includes(token))) {
      sanitized[key] = "[REDACTED]";
      continue;
    }

    if (ACCOUNT_NUMBER_KEYS.some((token) => normalizedKey.includes(token))) {
      const text = normalizeString(itemValue);
      sanitized[key] = text ? maskAccountNumber(text) : itemValue;
      continue;
    }

    sanitized[key] = sanitizePayload(itemValue);
  }

  return sanitized;
};

const sanitizeRequesterUser = (user: any) => {
  if (!user || typeof user !== "object") {
    return null;
  }

  return sanitizePayload({
    id: user.id ?? null,
    _id: user._id ?? null,
    storecode: user.storecode ?? null,
    role: user.role ?? null,
    nickname: user.nickname ?? null,
    walletAddress: user.walletAddress ?? null,
    email: user.email ?? null,
    mobile: user.mobile ?? null,
    name: user.name ?? null,
    bankInfo: user.bankInfo ?? null,
    seller: user.seller ?? null,
  });
};

export async function insertStoreSettingsApiCallLog(input: InsertStoreSettingsApiCallLogInput) {
  const client = await clientPromise;
  const collection = client.db(dbName).collection(STORE_SETTINGS_API_CALL_LOG_COLLECTION);

  const payload = {
    route: normalizeString(input.route),
    status: input.status,
    reason: normalizeString(input.reason) || null,
    publicIp: normalizeString(input.publicIp) || null,
    publicCountry: normalizeCountry(input.publicCountry),
    requesterWalletAddress: normalizeString(input.requesterWalletAddress)?.toLowerCase() || null,
    requesterUser: sanitizeRequesterUser(input.requesterUser),
    requestBody: sanitizePayload(input.requestBody || {}),
    createdAt: input.createdAt ? new Date(input.createdAt) : new Date(),
  };

  const result = await collection.insertOne(payload);
  if (!result?.acknowledged) {
    return null;
  }

  return {
    _id: result.insertedId,
    ...payload,
  };
}

export async function getStoreSettingsApiCallLogs({
  fromDate,
  toDate,
  route = "",
  status = "",
  search = "",
  limit = 500,
}: {
  fromDate?: Date | string;
  toDate?: Date | string;
  route?: string;
  status?: string;
  search?: string;
  limit?: number;
}) {
  const client = await clientPromise;
  const collection = client.db(dbName).collection(STORE_SETTINGS_API_CALL_LOG_COLLECTION);

  const filters: any[] = [];

  if (route) {
    filters.push({ route: String(route) });
  }

  if (status) {
    filters.push({ status: String(status) });
  }

  if (fromDate || toDate) {
    const range: Record<string, Date> = {};
    if (fromDate) {
      const start = fromDate instanceof Date ? fromDate : new Date(fromDate);
      range.$gte = start;
    }
    if (toDate) {
      const end = toDate instanceof Date ? toDate : new Date(toDate);
      range.$lte = end;
    }
    filters.push({ createdAt: range });
  }

  if (search) {
    const escaped = String(search).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(escaped, "i");
    filters.push({
      $or: [
        { route: regex },
        { reason: regex },
        { requesterWalletAddress: regex },
        { publicCountry: regex },
        { "requesterUser.nickname": regex },
        { "requesterUser.storecode": regex },
        { "requesterUser.role": regex },
        { "requestBody.storecode": regex },
      ],
    });
  }

  const query = filters.length > 0 ? { $and: filters } : {};
  const safeLimit = Math.min(Math.max(Number(limit) || 500, 1), 5000);

  const [totalCount, logs] = await Promise.all([
    collection.countDocuments(query),
    collection
      .find(query)
      .sort({ createdAt: -1, _id: -1 })
      .limit(safeLimit)
      .toArray(),
  ]);

  const routeStats = new Map<string, number>();
  const statusStats = new Map<string, number>();

  logs.forEach((log: any) => {
    const routeValue = String(log?.route || "UNKNOWN");
    const statusValue = String(log?.status || "UNKNOWN");
    routeStats.set(routeValue, (routeStats.get(routeValue) || 0) + 1);
    statusStats.set(statusValue, (statusStats.get(statusValue) || 0) + 1);
  });

  return {
    totalCount,
    logs,
    routeStats: Array.from(routeStats.entries())
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => b.count - a.count),
    statusStats: Array.from(statusStats.entries())
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => b.count - a.count),
  };
}
