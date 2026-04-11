import clientPromise, { dbName } from "@/lib/mongodb";

export const RETURN_URL_LOG_COLLECTION = "returnUrlLogs";

type ReturnUrlLogStatus = "success" | "error";

type InsertReturnUrlLogInput = {
  source?: string | null;
  callbackKind?: string | null;
  status: ReturnUrlLogStatus;
  orderId?: string | null;
  tradeId?: string | null;
  storecode?: string | null;
  nickname?: string | null;
  walletAddress?: string | null;
  orderNumber?: string | null;
  requestMethod?: string | null;
  requestUrl?: string | null;
  requestHeaders?: Record<string, unknown> | null;
  requestQuery?: Record<string, unknown> | null;
  requestBody?: Record<string, unknown> | null;
  responseStatus?: number | null;
  responseStatusText?: string | null;
  responseOk?: boolean | null;
  responseBody?: unknown;
  errorMessage?: string | null;
  durationMs?: number | null;
  createdAt?: Date | string | null;
};

const normalizeString = (value: unknown) => {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
};

const normalizeNullableString = (value: unknown) => {
  const text = normalizeString(value);
  return text || null;
};

const normalizeNullableNumber = (value: unknown) => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  return null;
};

const normalizeNullableBoolean = (value: unknown) => {
  if (typeof value === "boolean") {
    return value;
  }

  return null;
};

const SENSITIVE_KEYS = [
  "password",
  "privatekey",
  "secret",
  "accesstoken",
  "token",
  "apikey",
  "signature",
  "signedat",
  "nonce",
];

const sanitizePayload = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map((item) => sanitizePayload(item));
  }

  if (!value || typeof value !== "object") {
    if (typeof value === "string") {
      return value.slice(0, 12000);
    }

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

    sanitized[key] = sanitizePayload(itemValue);
  }

  return sanitized;
};

const sanitizeResponseBody = (value: unknown) => {
  if (typeof value === "string") {
    return value.slice(0, 12000);
  }

  return sanitizePayload(value);
};

const normalizeCreatedAt = (value: unknown) => {
  if (!value) {
    return new Date().toISOString();
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  const parsed = new Date(String(value));
  if (Number.isNaN(parsed.getTime())) {
    return new Date().toISOString();
  }

  return parsed.toISOString();
};

export async function insertReturnUrlLog(input: InsertReturnUrlLogInput) {
  const client = await clientPromise;
  const collection = client.db(dbName).collection(RETURN_URL_LOG_COLLECTION);

  const payload = {
    source: normalizeNullableString(input.source),
    callbackKind: normalizeNullableString(input.callbackKind),
    status: input.status,
    orderId: normalizeNullableString(input.orderId),
    tradeId: normalizeNullableString(input.tradeId),
    storecode: normalizeNullableString(input.storecode),
    nickname: normalizeNullableString(input.nickname),
    walletAddress: normalizeNullableString(input.walletAddress),
    orderNumber: normalizeNullableString(input.orderNumber),
    requestMethod: normalizeNullableString(input.requestMethod),
    requestUrl: normalizeNullableString(input.requestUrl),
    returnUrl: normalizeNullableString(input.requestUrl),
    requestHeaders: sanitizePayload(input.requestHeaders || {}),
    requestQuery: sanitizePayload(input.requestQuery || {}),
    requestBody: sanitizePayload(input.requestBody || {}),
    responseStatus: normalizeNullableNumber(input.responseStatus),
    responseStatusText: normalizeNullableString(input.responseStatusText),
    responseOk: normalizeNullableBoolean(input.responseOk),
    responseBody: sanitizeResponseBody(input.responseBody),
    errorMessage: normalizeNullableString(input.errorMessage),
    durationMs: normalizeNullableNumber(input.durationMs),
    createdAt: normalizeCreatedAt(input.createdAt),
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

export async function getReturnUrlLogs({
  fromDate,
  toDate,
  status = "",
  storecode = "",
  callbackKind = "",
  search = "",
  limit = 500,
}: {
  fromDate?: Date | string;
  toDate?: Date | string;
  status?: string;
  storecode?: string;
  callbackKind?: string;
  search?: string;
  limit?: number;
}) {
  const client = await clientPromise;
  const collection = client.db(dbName).collection(RETURN_URL_LOG_COLLECTION);

  const filters: any[] = [];

  if (status) {
    filters.push({ status: String(status) });
  }

  if (storecode) {
    filters.push({ storecode: String(storecode) });
  }

  if (callbackKind) {
    filters.push({ callbackKind: String(callbackKind) });
  }

  if (fromDate || toDate) {
    const range: Record<string, string> = {};
    if (fromDate) {
      const start = fromDate instanceof Date ? fromDate.toISOString() : new Date(fromDate).toISOString();
      range.$gte = start;
    }
    if (toDate) {
      const end = toDate instanceof Date ? toDate.toISOString() : new Date(toDate).toISOString();
      range.$lte = end;
    }
    filters.push({ createdAt: range });
  }

  if (search) {
    const escaped = String(search).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(escaped, "i");
    filters.push({
      $or: [
        { source: regex },
        { callbackKind: regex },
        { orderId: regex },
        { tradeId: regex },
        { storecode: regex },
        { nickname: regex },
        { walletAddress: regex },
        { orderNumber: regex },
        { requestMethod: regex },
        { requestUrl: regex },
        { returnUrl: regex },
        { responseStatusText: regex },
        { errorMessage: regex },
        { "requestQuery.userid": regex },
        { "requestQuery.orderNumber": regex },
        { "requestBody.userid": regex },
        { "requestBody.indexkey": regex },
        { "requestBody.amount": regex },
        { responseBody: regex },
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

  const statusStats = new Map<string, number>();
  const storeStats = new Map<string, number>();
  const callbackKindStats = new Map<string, number>();

  logs.forEach((log: any) => {
    const statusValue = String(log?.status || "UNKNOWN");
    const storeValue = String(log?.storecode || "UNKNOWN");
    const callbackKindValue = String(log?.callbackKind || "UNKNOWN");
    statusStats.set(statusValue, (statusStats.get(statusValue) || 0) + 1);
    storeStats.set(storeValue, (storeStats.get(storeValue) || 0) + 1);
    callbackKindStats.set(callbackKindValue, (callbackKindStats.get(callbackKindValue) || 0) + 1);
  });

  return {
    totalCount,
    logs,
    statusStats: Array.from(statusStats.entries())
      .map(([value, count]) => ({ value, count }))
      .sort((left, right) => right.count - left.count),
    storeStats: Array.from(storeStats.entries())
      .map(([value, count]) => ({ value, count }))
      .sort((left, right) => right.count - left.count),
    callbackKindStats: Array.from(callbackKindStats.entries())
      .map(([value, count]) => ({ value, count }))
      .sort((left, right) => right.count - left.count),
  };
}
