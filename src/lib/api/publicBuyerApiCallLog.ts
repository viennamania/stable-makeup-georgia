import clientPromise, { dbName } from "@/lib/mongodb";

export const PUBLIC_BUYER_API_CALL_LOG_COLLECTION = "publicBuyerApiCallLogs";

type InsertPublicBuyerApiCallLogInput = {
  route: string;
  method?: string | null;
  status: "success" | "error";
  reason?: string | null;
  publicIp?: string | null;
  publicCountry?: string | null;
  requestBody?: Record<string, unknown> | null;
  resultMeta?: Record<string, unknown> | null;
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
      return value.slice(0, 2000);
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

export async function insertPublicBuyerApiCallLog(input: InsertPublicBuyerApiCallLogInput) {
  const client = await clientPromise;
  const collection = client.db(dbName).collection(PUBLIC_BUYER_API_CALL_LOG_COLLECTION);

  const payload = {
    route: normalizeString(input.route),
    method: normalizeString(input.method) || null,
    status: input.status,
    reason: normalizeString(input.reason) || null,
    publicIp: normalizeString(input.publicIp) || null,
    publicCountry: normalizeCountry(input.publicCountry),
    requestBody: sanitizePayload(input.requestBody || {}),
    resultMeta: sanitizePayload(input.resultMeta || {}),
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

export async function getPublicBuyerApiCallLogs({
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
  const collection = client.db(dbName).collection(PUBLIC_BUYER_API_CALL_LOG_COLLECTION);

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
        { publicIp: regex },
        { publicCountry: regex },
        { "requestBody.storecode": regex },
        { "requestBody.walletAddress": regex },
        { "requestBody.userCode": regex },
        { "requestBody.userName": regex },
        { "requestBody.userBankName": regex },
        { "requestBody.userBankAccountNumber": regex },
        { "requestBody.userType": regex },
        { "resultMeta.id": regex },
        { "resultMeta.nickname": regex },
        { "resultMeta.storecode": regex },
        { "resultMeta.walletAddress": regex },
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
