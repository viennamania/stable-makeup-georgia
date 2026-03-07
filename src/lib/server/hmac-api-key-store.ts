import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "crypto";

import clientPromise, { dbName } from "@/lib/mongodb";

const HMAC_API_KEY_COLLECTION = "hmacApiKeys";
const HMAC_API_KEY_ID_UNIQ_INDEX = "uniq_hmac_api_key_id";
const HMAC_API_KEY_STATUS_INDEX = "idx_hmac_api_key_status_updated";

const globalHmacApiKeyStore = globalThis as typeof globalThis & {
  __hmacApiKeyStoreIndexesReady?: boolean;
};

type HmacApiKeyStatus = "active" | "disabled" | "revoked";

type EncryptedSecret = {
  v: number;
  alg: "aes-256-gcm";
  iv: string;
  tag: string;
  data: string;
};

type HmacApiKeyDocument = {
  _id?: any;
  keyId: string;
  encryptedSecret: EncryptedSecret;
  secretPreview: string;
  allowedRoutes: string[];
  allowedStorecodes: string[];
  description: string | null;
  status: HmacApiKeyStatus;
  usageCount: number;
  lastUsedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  createdBy: {
    walletAddress: string | null;
    storecode: string | null;
    role: string | null;
    nickname: string | null;
  } | null;
  updatedBy: {
    walletAddress: string | null;
    storecode: string | null;
    role: string | null;
    nickname: string | null;
  } | null;
};

const normalizeString = (value: unknown): string => {
  if (typeof value !== "string") {
    return "";
  }
  return value.trim();
};

const normalizeRoute = (value: unknown): string => {
  const normalized = normalizeString(value);
  if (!normalized) {
    return "";
  }
  return normalized.startsWith("/") ? normalized : `/${normalized}`;
};

const normalizeStorecode = (value: unknown): string => {
  return normalizeString(value).toLowerCase();
};

const unique = <T>(list: T[]) => Array.from(new Set(list));

const normalizeRoutes = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }
  return unique(
    value
      .map((item) => normalizeRoute(item))
      .filter(Boolean),
  );
};

const normalizeStorecodes = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }
  return unique(
    value
      .map((item) => normalizeStorecode(item))
      .filter(Boolean),
  );
};

const normalizeStatus = (value: unknown): HmacApiKeyStatus | null => {
  const normalized = normalizeString(value).toLowerCase();
  if (normalized === "active" || normalized === "disabled" || normalized === "revoked") {
    return normalized;
  }
  return null;
};

const buildMissingMasterKeyMessage = () => {
  const vercelEnv = normalizeString(process.env.VERCEL_ENV) || "local";
  const nodeEnv = normalizeString(process.env.NODE_ENV) || "unknown";
  const hasPrimaryKey = Boolean(normalizeString(process.env.HMAC_API_KEY_MASTER_KEY));
  const hasFallbackKey = Boolean(
    normalizeString(process.env.BUY_ORDER_SETTLEMENT_HMAC_MASTER_KEY),
  );

  return [
    "Missing HMAC master key.",
    "Required: HMAC_API_KEY_MASTER_KEY (or BUY_ORDER_SETTLEMENT_HMAC_MASTER_KEY).",
    `envScope={VERCEL_ENV:${vercelEnv},NODE_ENV:${nodeEnv}}`,
    `keysPresent={HMAC_API_KEY_MASTER_KEY:${hasPrimaryKey},BUY_ORDER_SETTLEMENT_HMAC_MASTER_KEY:${hasFallbackKey}}`,
  ].join(" ");
};

const getMasterKey = (): Buffer => {
  const raw =
    normalizeString(process.env.HMAC_API_KEY_MASTER_KEY)
    || normalizeString(process.env.BUY_ORDER_SETTLEMENT_HMAC_MASTER_KEY);

  if (!raw) {
    throw new Error(buildMissingMasterKeyMessage());
  }

  return createHash("sha256").update(raw).digest();
};

const encryptSecret = (secret: string): EncryptedSecret => {
  const key = getMasterKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);

  const encrypted = Buffer.concat([
    cipher.update(secret, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  return {
    v: 1,
    alg: "aes-256-gcm",
    iv: iv.toString("base64"),
    tag: tag.toString("base64"),
    data: encrypted.toString("base64"),
  };
};

const decryptSecret = (encryptedSecret: EncryptedSecret): string => {
  if (!encryptedSecret || encryptedSecret.alg !== "aes-256-gcm") {
    throw new Error("Invalid encrypted secret payload");
  }

  const key = getMasterKey();
  const iv = Buffer.from(encryptedSecret.iv, "base64");
  const tag = Buffer.from(encryptedSecret.tag, "base64");
  const data = Buffer.from(encryptedSecret.data, "base64");

  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);

  const plain = Buffer.concat([
    decipher.update(data),
    decipher.final(),
  ]);

  return plain.toString("utf8");
};

const maskSecret = (secret: string) => {
  const normalized = normalizeString(secret);
  if (!normalized) return "";
  if (normalized.length <= 8) {
    return `${"*".repeat(Math.max(0, normalized.length - 2))}${normalized.slice(-2)}`;
  }
  return `${normalized.slice(0, 4)}...${normalized.slice(-4)}`;
};

const ensureIndexes = async () => {
  if (globalHmacApiKeyStore.__hmacApiKeyStoreIndexesReady) {
    return;
  }

  const dbClient = await clientPromise;
  const collection = dbClient.db(dbName).collection(HMAC_API_KEY_COLLECTION);
  await collection.createIndex(
    { keyId: 1 },
    { unique: true, name: HMAC_API_KEY_ID_UNIQ_INDEX },
  );
  await collection.createIndex(
    { status: 1, updatedAt: -1 },
    { name: HMAC_API_KEY_STATUS_INDEX },
  );

  globalHmacApiKeyStore.__hmacApiKeyStoreIndexesReady = true;
};

const collectionRef = async () => {
  await ensureIndexes();
  const dbClient = await clientPromise;
  return dbClient.db(dbName).collection<HmacApiKeyDocument>(HMAC_API_KEY_COLLECTION);
};

export const generateHmacApiKeyId = () => {
  const random = randomBytes(6).toString("hex");
  return `hsk_${Date.now().toString(36)}_${random}`;
};

export const generateHmacApiSecret = () => {
  return randomBytes(32).toString("base64url");
};

export const listHmacApiKeys = async ({
  route,
}: {
  route?: string;
}) => {
  const collection = await collectionRef();
  const routeFilter = normalizeRoute(route);
  const query: Record<string, unknown> = routeFilter
    ? {
        $or: [
          { allowedRoutes: { $size: 0 } },
          { allowedRoutes: routeFilter },
        ],
      }
    : {};

  const keys = await collection
    .find(query, {
      projection: {
        _id: 0,
        keyId: 1,
        secretPreview: 1,
        allowedRoutes: 1,
        allowedStorecodes: 1,
        description: 1,
        status: 1,
        usageCount: 1,
        lastUsedAt: 1,
        createdAt: 1,
        updatedAt: 1,
        createdBy: 1,
        updatedBy: 1,
      },
    })
    .sort({ updatedAt: -1, createdAt: -1 })
    .toArray();

  return keys.map((item) => ({
    ...item,
    allowedRoutes: Array.isArray(item.allowedRoutes) ? item.allowedRoutes : [],
    allowedStorecodes: Array.isArray(item.allowedStorecodes) ? item.allowedStorecodes : [],
  }));
};

export const createHmacApiKey = async ({
  keyIdRaw,
  secretPlain,
  allowedRoutesRaw,
  allowedStorecodesRaw,
  descriptionRaw,
  actor,
}: {
  keyIdRaw?: unknown;
  secretPlain: string;
  allowedRoutesRaw?: unknown;
  allowedStorecodesRaw?: unknown;
  descriptionRaw?: unknown;
  actor?: any;
}) => {
  const collection = await collectionRef();

  const keyId = normalizeString(keyIdRaw) || generateHmacApiKeyId();
  if (!/^[a-zA-Z0-9._:-]{6,120}$/.test(keyId)) {
    throw new Error("Invalid keyId format");
  }

  const allowedRoutes = normalizeRoutes(allowedRoutesRaw);
  const allowedStorecodes = normalizeStorecodes(allowedStorecodesRaw);
  const description = normalizeString(descriptionRaw) || null;

  const now = new Date();
  const encryptedSecret = encryptSecret(secretPlain);

  const actorInfo = actor
    ? {
        walletAddress: normalizeString(actor?.walletAddress)?.toLowerCase() || null,
        storecode: normalizeString(actor?.storecode)?.toLowerCase() || null,
        role: normalizeString(actor?.role)?.toLowerCase() || null,
        nickname: normalizeString(actor?.nickname) || null,
      }
    : null;

  const insertDoc: HmacApiKeyDocument = {
    keyId,
    encryptedSecret,
    secretPreview: maskSecret(secretPlain),
    allowedRoutes,
    allowedStorecodes,
    description,
    status: "active",
    usageCount: 0,
    lastUsedAt: null,
    createdAt: now,
    updatedAt: now,
    createdBy: actorInfo,
    updatedBy: actorInfo,
  };

  const result = await collection.insertOne(insertDoc);
  if (!result.acknowledged) {
    throw new Error("Failed to create HMAC API key");
  }

  return {
    keyId,
    secret: secretPlain,
  };
};

export const updateHmacApiKey = async ({
  keyIdRaw,
  statusRaw,
  allowedStorecodesRaw,
  allowedRoutesRaw,
  descriptionRaw,
  actor,
}: {
  keyIdRaw: unknown;
  statusRaw?: unknown;
  allowedStorecodesRaw?: unknown;
  allowedRoutesRaw?: unknown;
  descriptionRaw?: unknown;
  actor?: any;
}) => {
  const collection = await collectionRef();
  const keyId = normalizeString(keyIdRaw);
  if (!keyId) {
    throw new Error("keyId is required");
  }

  const updateFields: Record<string, unknown> = {};

  if (statusRaw !== undefined) {
    const status = normalizeStatus(statusRaw);
    if (!status) {
      throw new Error("Invalid status");
    }
    updateFields.status = status;
  }

  if (allowedStorecodesRaw !== undefined) {
    updateFields.allowedStorecodes = normalizeStorecodes(allowedStorecodesRaw);
  }

  if (allowedRoutesRaw !== undefined) {
    updateFields.allowedRoutes = normalizeRoutes(allowedRoutesRaw);
  }

  if (descriptionRaw !== undefined) {
    const normalized = normalizeString(descriptionRaw);
    updateFields.description = normalized || null;
  }

  const actorInfo = actor
    ? {
        walletAddress: normalizeString(actor?.walletAddress)?.toLowerCase() || null,
        storecode: normalizeString(actor?.storecode)?.toLowerCase() || null,
        role: normalizeString(actor?.role)?.toLowerCase() || null,
        nickname: normalizeString(actor?.nickname) || null,
      }
    : null;

  updateFields.updatedAt = new Date();
  updateFields.updatedBy = actorInfo;

  const result = await collection.updateOne(
    { keyId },
    { $set: updateFields },
  );

  if (result.matchedCount < 1) {
    throw new Error("HMAC key not found");
  }

  return true;
};

export const rotateHmacApiKeySecret = async ({
  keyIdRaw,
  actor,
}: {
  keyIdRaw: unknown;
  actor?: any;
}) => {
  const collection = await collectionRef();
  const keyId = normalizeString(keyIdRaw);
  if (!keyId) {
    throw new Error("keyId is required");
  }

  const secret = generateHmacApiSecret();
  const encryptedSecret = encryptSecret(secret);

  const actorInfo = actor
    ? {
        walletAddress: normalizeString(actor?.walletAddress)?.toLowerCase() || null,
        storecode: normalizeString(actor?.storecode)?.toLowerCase() || null,
        role: normalizeString(actor?.role)?.toLowerCase() || null,
        nickname: normalizeString(actor?.nickname) || null,
      }
    : null;

  const result = await collection.updateOne(
    { keyId },
    {
      $set: {
        encryptedSecret,
        secretPreview: maskSecret(secret),
        status: "active",
        updatedAt: new Date(),
        updatedBy: actorInfo,
      },
    },
  );

  if (result.matchedCount < 1) {
    throw new Error("HMAC key not found");
  }

  return {
    keyId,
    secret,
  };
};

export const getActiveHmacApiKeyForVerification = async ({
  keyIdRaw,
  routeRaw,
}: {
  keyIdRaw: unknown;
  routeRaw: unknown;
}) => {
  const keyId = normalizeString(keyIdRaw);
  const route = normalizeRoute(routeRaw);

  if (!keyId || !route) {
    return null;
  }

  const collection = await collectionRef();
  const item = await collection.findOne(
    {
      keyId,
      status: "active",
      $or: [
        { allowedRoutes: { $size: 0 } },
        { allowedRoutes: route },
      ],
    },
    {
      projection: {
        _id: 0,
        keyId: 1,
        encryptedSecret: 1,
        allowedStorecodes: 1,
        status: 1,
      },
    },
  );

  if (!item) {
    return null;
  }

  const secret = decryptSecret(item.encryptedSecret);
  return {
    keyId: item.keyId,
    secret,
    allowedStorecodes: Array.isArray(item.allowedStorecodes) ? item.allowedStorecodes : [],
  };
};

export const markHmacApiKeyUsed = async ({ keyIdRaw }: { keyIdRaw: unknown }) => {
  const keyId = normalizeString(keyIdRaw);
  if (!keyId) {
    return false;
  }

  const collection = await collectionRef();
  const result = await collection.updateOne(
    { keyId },
    {
      $inc: { usageCount: 1 },
      $set: { lastUsedAt: new Date(), updatedAt: new Date() },
    },
  );

  return result.matchedCount > 0;
};
