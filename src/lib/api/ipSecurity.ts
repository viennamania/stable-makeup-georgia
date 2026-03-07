import clientPromise, { dbName } from "@/lib/mongodb";

export const API_ACCESS_LOG_COLLECTION = "apiAccessLogs";
export const BLOCKED_PUBLIC_IP_COLLECTION = "blockedPublicIps";

type ApiAccessLogInput = {
  ip: string;
  method: string;
  pathname: string;
  isApi: boolean;
  blocked: boolean;
  blockReason?: string | null;
  country?: string | null;
  userAgent?: string | null;
  referer?: string | null;
  acceptLanguage?: string | null;
  source?: string | null;
  createdAt?: Date | string;
};

type SetBlockedIpInput = {
  ip: string;
  enabled: boolean;
  reason?: string | null;
  expiresAt?: Date | string | null;
  requesterWalletAddress?: string | null;
  requesterUser?: any;
};

let indexEnsured = false;
let indexEnsureInFlight: Promise<boolean> | null = null;
let indexEnsureFailureCount = 0;
let nextIndexEnsureRetryAt = 0;

const INDEX_RETRY_BASE_MS = Math.max(
  Number(process.env.IP_SECURITY_INDEX_RETRY_BASE_MS || 2000),
  500,
);
const INDEX_RETRY_MAX_MS = Math.max(
  Number(process.env.IP_SECURITY_INDEX_RETRY_MAX_MS || 60000),
  INDEX_RETRY_BASE_MS,
);
const ERROR_LOG_THROTTLE_MS = Math.max(
  Number(process.env.IP_SECURITY_ERROR_LOG_THROTTLE_MS || 60000),
  1000,
);

const errorLogState: Record<string, number> = {};

const normalizeString = (value: unknown) => {
  if (typeof value !== "string") {
    return "";
  }
  return value.trim();
};

const toLowerSafe = (value: unknown) => normalizeString(value).toLowerCase();

const normalizeMethod = (value: unknown) => {
  const method = normalizeString(value).toUpperCase();
  return method || "GET";
};

const normalizePathname = (value: unknown) => {
  const path = normalizeString(value);
  if (!path) {
    return "/";
  }
  return path.slice(0, 400);
};

const normalizeCountry = (value: unknown) => {
  const country = normalizeString(value).toUpperCase();
  if (!country || country === "UNKNOWN") {
    return null;
  }
  return country.slice(0, 16);
};

export const normalizePublicIp = (value: unknown): string => {
  let raw = normalizeString(value);
  if (!raw) {
    return "";
  }

  if (raw.includes(",")) {
    raw = raw.split(",")[0]?.trim() || "";
  }

  if (raw.startsWith("[") && raw.includes("]")) {
    raw = raw.slice(1, raw.indexOf("]"));
  }

  if (/^\d{1,3}(?:\.\d{1,3}){3}:\d+$/.test(raw)) {
    raw = raw.split(":")[0] || raw;
  }

  return raw.toLowerCase();
};

const sanitizeRequesterUser = (user: any) => {
  if (!user || typeof user !== "object") {
    return null;
  }

  return {
    id: user.id ?? null,
    _id: user._id ?? null,
    storecode: user.storecode ?? null,
    role: user.role ?? null,
    nickname: user.nickname ?? null,
    walletAddress: user.walletAddress ?? null,
  };
};

const logErrorThrottled = (key: string, message: string, error: unknown) => {
  const now = Date.now();
  const lastLoggedAt = errorLogState[key] || 0;
  if (now - lastLoggedAt < ERROR_LOG_THROTTLE_MS) {
    return;
  }

  errorLogState[key] = now;
  console.error(message, error);
};

const ensureIndexes = async (): Promise<boolean> => {
  if (indexEnsured) {
    return true;
  }

  if (indexEnsureInFlight) {
    return indexEnsureInFlight;
  }

  if (nextIndexEnsureRetryAt > Date.now()) {
    return false;
  }

  indexEnsureInFlight = (async () => {
    try {
      const client = await clientPromise;
      const db = client.db(dbName);

      await Promise.all([
        db.collection(API_ACCESS_LOG_COLLECTION).createIndex({ createdAt: -1 }),
        db.collection(API_ACCESS_LOG_COLLECTION).createIndex({ ip: 1, createdAt: -1 }),
        db.collection(API_ACCESS_LOG_COLLECTION).createIndex({ pathname: 1, createdAt: -1 }),
        db.collection(API_ACCESS_LOG_COLLECTION).createIndex({ blocked: 1, createdAt: -1 }),
        db.collection(BLOCKED_PUBLIC_IP_COLLECTION).createIndex({ ip: 1 }, { unique: true }),
        db.collection(BLOCKED_PUBLIC_IP_COLLECTION).createIndex({ enabled: 1, updatedAt: -1 }),
      ]);

      indexEnsured = true;
      indexEnsureFailureCount = 0;
      nextIndexEnsureRetryAt = 0;
      return true;
    } catch (error) {
      indexEnsureFailureCount += 1;
      const backoffMs = Math.min(
        INDEX_RETRY_BASE_MS * 2 ** Math.max(indexEnsureFailureCount - 1, 0),
        INDEX_RETRY_MAX_MS,
      );
      nextIndexEnsureRetryAt = Date.now() + backoffMs;
      logErrorThrottled("ensureIndexes", "Failed to ensure ip security indexes:", error);
      return false;
    } finally {
      indexEnsureInFlight = null;
    }
  })();

  return indexEnsureInFlight;
};

export const insertApiAccessLog = async (input: ApiAccessLogInput) => {
  const ip = normalizePublicIp(input.ip);
  if (!ip) {
    return null;
  }

  try {
    const indexesReady = await ensureIndexes();
    if (!indexesReady) {
      return null;
    }

    const client = await clientPromise;
    const collection = client.db(dbName).collection(API_ACCESS_LOG_COLLECTION);

    const payload = {
      ip,
      method: normalizeMethod(input.method),
      pathname: normalizePathname(input.pathname),
      isApi: Boolean(input.isApi),
      blocked: Boolean(input.blocked),
      blockReason: normalizeString(input.blockReason || "") || null,
      country: normalizeCountry(input.country),
      userAgent: normalizeString(input.userAgent || "").slice(0, 1000) || null,
      referer: normalizeString(input.referer || "").slice(0, 1000) || null,
      acceptLanguage:
        normalizeString(input.acceptLanguage || "").slice(0, 200) || null,
      source: normalizeString(input.source || "middleware") || "middleware",
      createdAt: input.createdAt ? new Date(input.createdAt) : new Date(),
    };

    await collection.insertOne(payload);
    return payload;
  } catch (error) {
    logErrorThrottled("insertApiAccessLog", "Failed to insert api access log:", error);
    return null;
  }
};

export const getBlockedIpRule = async (ipRaw: unknown) => {
  const ip = normalizePublicIp(ipRaw);
  if (!ip) {
    return null;
  }

  try {
    const client = await clientPromise;
    const collection = client.db(dbName).collection(BLOCKED_PUBLIC_IP_COLLECTION);
    const now = new Date();

    const rule = await collection.findOne({
      ip,
      enabled: true,
      $or: [{ expiresAt: null }, { expiresAt: { $exists: false } }, { expiresAt: { $gt: now } }],
    });

    return rule;
  } catch (error) {
    logErrorThrottled("getBlockedIpRule", "Failed to check blocked ip rule:", error);
    return null;
  }
};

export const setBlockedIpRule = async (input: SetBlockedIpInput) => {
  const ip = normalizePublicIp(input.ip);
  if (!ip) {
    throw new Error("invalid_ip");
  }

  const indexesReady = await ensureIndexes();
  if (!indexesReady) {
    throw new Error("ip_security_indexes_unavailable");
  }

  const client = await clientPromise;
  const collection = client.db(dbName).collection(BLOCKED_PUBLIC_IP_COLLECTION);
  const now = new Date();

  const requesterWalletAddress =
    toLowerSafe(input.requesterWalletAddress || "") || null;
  const requesterUser = sanitizeRequesterUser(input.requesterUser);
  const reason = normalizeString(input.reason || "");

  if (input.enabled) {
    await collection.updateOne(
      { ip },
      {
        $set: {
          ip,
          enabled: true,
          reason: reason || "suspicious_api_activity",
          expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
          blockedAt: now,
          blockedByWalletAddress: requesterWalletAddress,
          blockedByUser: requesterUser,
          updatedAt: now,
          unblockedAt: null,
          unblockedReason: null,
        },
        $setOnInsert: {
          createdAt: now,
        },
      },
      { upsert: true },
    );
  } else {
    await collection.updateOne(
      { ip },
      {
        $set: {
          ip,
          enabled: false,
          updatedAt: now,
          unblockedAt: now,
          unblockedReason: reason || "manual_unblock",
          unblockedByWalletAddress: requesterWalletAddress,
          unblockedByUser: requesterUser,
        },
        $setOnInsert: {
          createdAt: now,
        },
      },
      { upsert: true },
    );
  }

  return collection.findOne({ ip });
};

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const getKstDateRangeByOffset = (offsetDays = 0) => {
  const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
  const now = new Date();
  const kstNow = new Date(now.getTime() + KST_OFFSET_MS);
  kstNow.setUTCDate(kstNow.getUTCDate() - offsetDays);

  const year = kstNow.getUTCFullYear();
  const month = kstNow.getUTCMonth();
  const date = kstNow.getUTCDate();

  const start = new Date(Date.UTC(year, month, date, 0, 0, 0, 0) - KST_OFFSET_MS);
  const end = new Date(Date.UTC(year, month, date, 23, 59, 59, 999) - KST_OFFSET_MS);

  return { start, end };
};

export const resolveKstRange = (rangeRaw: unknown) => {
  const range = normalizeString(rangeRaw).toLowerCase();
  if (range === "all") {
    return { start: undefined, end: undefined };
  }
  if (range === "yesterday") {
    return getKstDateRangeByOffset(1);
  }
  if (range === "daybeforeyesterday") {
    return getKstDateRangeByOffset(2);
  }
  return getKstDateRangeByOffset(0);
};

export const getIpSecurityDashboard = async ({
  fromDate,
  toDate,
  search = "",
  page = 1,
  limit = 100,
}: {
  fromDate?: Date | string;
  toDate?: Date | string;
  search?: string;
  page?: number;
  limit?: number;
}) => {
  const indexesReady = await ensureIndexes();
  if (!indexesReady) {
    throw new Error("ip_security_indexes_unavailable");
  }

  const client = await clientPromise;
  const db = client.db(dbName);
  const logsCollection = db.collection(API_ACCESS_LOG_COLLECTION);
  const blockedCollection = db.collection(BLOCKED_PUBLIC_IP_COLLECTION);

  const filters: any[] = [{ isApi: true }];

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

  const searchText = normalizeString(search);
  if (searchText) {
    const regex = new RegExp(escapeRegex(searchText), "i");
    filters.push({
      $or: [
        { ip: regex },
        { pathname: regex },
        { method: regex },
        { country: regex },
        { userAgent: regex },
        { referer: regex },
        { blockReason: regex },
      ],
    });
  }

  const query = filters.length > 0 ? { $and: filters } : {};
  const safeLimit = Math.min(Math.max(Number(limit) || 100, 10), 1000);
  const safePage = Math.max(Number(page) || 1, 1);
  const skip = (safePage - 1) * safeLimit;

  const [totalCount, logs, topIps, blockedIps] = await Promise.all([
    logsCollection.countDocuments(query),
    logsCollection
      .find(query)
      .sort({ createdAt: -1, _id: -1 })
      .skip(skip)
      .limit(safeLimit)
      .toArray(),
    logsCollection
      .aggregate([
        { $match: query },
        {
          $group: {
            _id: "$ip",
            count: { $sum: 1 },
            blockedCount: { $sum: { $cond: ["$blocked", 1, 0] } },
            lastSeenAt: { $max: "$createdAt" },
            countries: { $addToSet: "$country" },
          },
        },
        { $sort: { count: -1, lastSeenAt: -1 } },
        { $limit: 100 },
      ])
      .toArray(),
    blockedCollection
      .find(
        searchText
          ? {
              $or: [
                { ip: new RegExp(escapeRegex(searchText), "i") },
                { reason: new RegExp(escapeRegex(searchText), "i") },
              ],
            }
          : {},
      )
      .sort({ enabled: -1, updatedAt: -1, createdAt: -1 })
      .limit(500)
      .toArray(),
  ]);

  const blockedMap = new Map<string, any>();
  for (const item of blockedIps) {
    const key = normalizePublicIp(item?.ip);
    if (!key) continue;
    blockedMap.set(key, item);
  }

  const normalizedTopIps = topIps.map((item: any) => {
    const ip = normalizePublicIp(item?._id);
    const blockedRule = blockedMap.get(ip) || null;
    return {
      ip,
      count: Number(item?.count || 0),
      blockedCount: Number(item?.blockedCount || 0),
      lastSeenAt: item?.lastSeenAt || null,
      countries: Array.isArray(item?.countries)
        ? item.countries.filter(Boolean)
        : [],
      currentlyBlocked: Boolean(blockedRule?.enabled),
      blockedReason: blockedRule?.reason || null,
    };
  });

  return {
    totalCount,
    page: safePage,
    limit: safeLimit,
    totalPages: Math.max(1, Math.ceil(totalCount / safeLimit)),
    logs,
    topIps: normalizedTopIps,
    blockedIps,
  };
};
