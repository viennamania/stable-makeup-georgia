import {
  createHash,
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
} from "crypto";
import { promisify } from "util";

import type { ObjectId } from "mongodb";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import clientPromise, { dbName } from "@/lib/mongodb";

const scryptAsync = promisify(scryptCallback);

const ADMIN_PASSWORD_ACCOUNT_COLLECTION = "adminPasswordAccounts";
const ADMIN_PASSWORD_SESSION_COLLECTION = "adminPasswordSessions";
const ADMIN_PASSWORD_COOKIE_NAME = "stable_georgia_admin_session";
const ADMIN_PASSWORD_ACCOUNT_LOGIN_UNIQ_INDEX = "uniq_admin_password_login_id";
const ADMIN_PASSWORD_ACCOUNT_STATUS_INDEX = "idx_admin_password_status_updated";
const ADMIN_PASSWORD_SESSION_ID_UNIQ_INDEX = "uniq_admin_password_session_id";
const ADMIN_PASSWORD_SESSION_TOKEN_INDEX = "idx_admin_password_session_token_hash";
const ADMIN_PASSWORD_SESSION_EXPIRY_INDEX = "ttl_admin_password_session_expires_at";

const DEFAULT_ADMIN_PASSWORD_SESSION_TTL_MS = 12 * 60 * 60 * 1000;
const MIN_ADMIN_PASSWORD_SESSION_TTL_MS = 5 * 60 * 1000;
const DEFAULT_LOGIN_LOCK_MS = 15 * 60 * 1000;
const DEFAULT_MAX_FAILED_LOGIN_COUNT = 5;

type AdminPasswordAccountStatus = "active" | "disabled" | "revoked";
export type AdminPasswordRole = "admin" | "superadmin" | "store_admin";
export type AdminPasswordSessionSource = "cookie" | "bearer" | "header";

export type AdminPasswordAccountDocument = {
  _id?: ObjectId;
  loginId: string;
  displayName: string | null;
  passwordHash: string;
  role: AdminPasswordRole;
  storecodes: string[];
  status: AdminPasswordAccountStatus;
  failedLoginCount: number;
  lockedUntil: Date | null;
  lastLoginAt: Date | null;
  passwordUpdatedAt: Date;
  createdAt: Date;
  updatedAt: Date;
};

type AdminPasswordSessionDocument = {
  _id?: ObjectId;
  sessionId: string;
  tokenHash: string;
  accountLoginId: string;
  role: AdminPasswordRole;
  storecodes: string[];
  status: "active" | "revoked";
  createdAt: Date;
  updatedAt: Date;
  expiresAt: Date;
  lastSeenAt: Date;
  publicIp: string | null;
  userAgent: string | null;
};

export type SanitizedAdminPasswordAccount = {
  loginId: string;
  displayName: string | null;
  role: AdminPasswordRole;
  storecodes: string[];
  status: AdminPasswordAccountStatus;
  lastLoginAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export type AdminPasswordSessionAuth =
  | {
      authenticated: true;
      source: AdminPasswordSessionSource;
      token: string;
      sessionId: string;
      expiresAt: Date;
      account: SanitizedAdminPasswordAccount;
      requesterWalletAddress: string;
      requesterStorecode: string;
      requesterUser: Record<string, unknown>;
    }
  | {
      authenticated: false;
      tokenProvided: boolean;
      source: AdminPasswordSessionSource | null;
      reason: string;
    };

const globalAdminPasswordAuth = globalThis as typeof globalThis & {
  __adminPasswordAuthIndexesReady?: boolean;
};

const normalizeString = (value: unknown): string => {
  if (typeof value !== "string") {
    return "";
  }
  return value.trim();
};

const normalizeLoginId = (value: unknown): string => {
  return normalizeString(value).toLowerCase();
};

const unique = <T>(list: T[]) => Array.from(new Set(list));

export const normalizeAdminPasswordRole = (value: unknown): AdminPasswordRole | null => {
  const normalized = normalizeString(value).toLowerCase().replace(/-/g, "_");
  if (normalized === "admin") return "admin";
  if (normalized === "superadmin") return "superadmin";
  if (normalized === "store_admin" || normalized === "storeadmin" || normalized === "store") {
    return "store_admin";
  }
  return null;
};

const normalizeStorecode = (value: unknown): string => normalizeString(value).toLowerCase();

const normalizeStorecodes = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return unique(value.map((item) => normalizeStorecode(item)).filter(Boolean));
};

const normalizeStorecodesInput = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return normalizeStorecodes(value);
  }

  return unique(
    normalizeString(value)
      .split(",")
      .map((item) => normalizeStorecode(item))
      .filter(Boolean),
  );
};

const getConfiguredSessionTtlMs = () => {
  const parsed = Number.parseInt(process.env.ADMIN_PASSWORD_SESSION_TTL_MS || "", 10);
  if (Number.isFinite(parsed) && parsed >= MIN_ADMIN_PASSWORD_SESSION_TTL_MS) {
    return parsed;
  }
  return DEFAULT_ADMIN_PASSWORD_SESSION_TTL_MS;
};

const getConfiguredMaxFailedLoginCount = () => {
  const parsed = Number.parseInt(process.env.ADMIN_PASSWORD_MAX_FAILED_LOGIN_COUNT || "", 10);
  if (Number.isFinite(parsed) && parsed > 0) {
    return parsed;
  }
  return DEFAULT_MAX_FAILED_LOGIN_COUNT;
};

const getConfiguredLoginLockMs = () => {
  const parsed = Number.parseInt(process.env.ADMIN_PASSWORD_LOGIN_LOCK_MS || "", 10);
  if (Number.isFinite(parsed) && parsed > 0) {
    return parsed;
  }
  return DEFAULT_LOGIN_LOCK_MS;
};

const ensureIndexes = async () => {
  if (globalAdminPasswordAuth.__adminPasswordAuthIndexesReady) {
    return;
  }

  const dbClient = await clientPromise;
  const db = dbClient.db(dbName);
  const accounts = db.collection<AdminPasswordAccountDocument>(ADMIN_PASSWORD_ACCOUNT_COLLECTION);
  const sessions = db.collection<AdminPasswordSessionDocument>(ADMIN_PASSWORD_SESSION_COLLECTION);

  await accounts.createIndex(
    { loginId: 1 },
    { unique: true, name: ADMIN_PASSWORD_ACCOUNT_LOGIN_UNIQ_INDEX },
  );
  await accounts.createIndex(
    { status: 1, updatedAt: -1 },
    { name: ADMIN_PASSWORD_ACCOUNT_STATUS_INDEX },
  );
  await sessions.createIndex(
    { sessionId: 1 },
    { unique: true, name: ADMIN_PASSWORD_SESSION_ID_UNIQ_INDEX },
  );
  await sessions.createIndex(
    { tokenHash: 1 },
    { name: ADMIN_PASSWORD_SESSION_TOKEN_INDEX },
  );
  await sessions.createIndex(
    { expiresAt: 1 },
    { expireAfterSeconds: 0, name: ADMIN_PASSWORD_SESSION_EXPIRY_INDEX },
  );

  globalAdminPasswordAuth.__adminPasswordAuthIndexesReady = true;
};

const getAccountsCollection = async () => {
  await ensureIndexes();
  const dbClient = await clientPromise;
  return dbClient.db(dbName).collection<AdminPasswordAccountDocument>(ADMIN_PASSWORD_ACCOUNT_COLLECTION);
};

const getSessionsCollection = async () => {
  await ensureIndexes();
  const dbClient = await clientPromise;
  return dbClient.db(dbName).collection<AdminPasswordSessionDocument>(ADMIN_PASSWORD_SESSION_COLLECTION);
};

const sha256 = (value: string): string => createHash("sha256").update(value).digest("hex");

const safeCompareHex = (leftHex: string, rightHex: string): boolean => {
  const left = Buffer.from(leftHex, "hex");
  const right = Buffer.from(rightHex, "hex");
  if (left.length !== right.length) {
    return false;
  }
  return timingSafeEqual(left, right);
};

export const hashAdminPassword = async (passwordRaw: string): Promise<string> => {
  const password = String(passwordRaw || "");
  if (password.length < 8) {
    throw new Error("Password must be at least 8 characters");
  }

  const salt = randomBytes(16).toString("base64url");
  const derived = (await scryptAsync(password, salt, 64)) as Buffer;
  return `scrypt$v1$${salt}$${derived.toString("hex")}`;
};

const verifyAdminPasswordHash = async ({
  passwordRaw,
  passwordHash,
}: {
  passwordRaw: string;
  passwordHash: string;
}): Promise<boolean> => {
  const [algorithm, version, salt, expectedHex] = String(passwordHash || "").split("$");
  if (algorithm !== "scrypt" || version !== "v1" || !salt || !expectedHex) {
    return false;
  }

  const derived = (await scryptAsync(String(passwordRaw || ""), salt, 64)) as Buffer;
  return safeCompareHex(derived.toString("hex"), expectedHex);
};

const sanitizeAccount = (account: AdminPasswordAccountDocument): SanitizedAdminPasswordAccount => ({
  loginId: account.loginId,
  displayName: account.displayName || null,
  role: account.role,
  storecodes: Array.isArray(account.storecodes) ? account.storecodes : [],
  status: account.status,
  lastLoginAt: account.lastLoginAt ? account.lastLoginAt.toISOString() : null,
  createdAt: account.createdAt ? account.createdAt.toISOString() : null,
  updatedAt: account.updatedAt ? account.updatedAt.toISOString() : null,
});

export const listAdminPasswordAccounts = async (): Promise<SanitizedAdminPasswordAccount[]> => {
  const accounts = await getAccountsCollection();
  const documents = await accounts
    .find({})
    .sort({ role: 1, loginId: 1 })
    .toArray();

  return documents.map(sanitizeAccount);
};

export const upsertAdminPasswordAccount = async ({
  loginIdRaw,
  passwordRaw,
  displayNameRaw,
  roleRaw,
  storecodesRaw,
  statusRaw = "active",
  updateExisting = true,
}: {
  loginIdRaw: unknown;
  passwordRaw?: unknown;
  displayNameRaw?: unknown;
  roleRaw?: unknown;
  storecodesRaw?: unknown;
  statusRaw?: unknown;
  updateExisting?: boolean;
}): Promise<{
  account: SanitizedAdminPasswordAccount;
  created: boolean;
  passwordUpdated: boolean;
}> => {
  const loginId = normalizeLoginId(loginIdRaw);
  if (!loginId) {
    throw new Error("loginId is required");
  }

  const role = normalizeAdminPasswordRole(roleRaw || "admin");
  if (!role) {
    throw new Error("role must be admin, superadmin, or store_admin");
  }

  const status = normalizeString(statusRaw).toLowerCase();
  if (status !== "active" && status !== "disabled" && status !== "revoked") {
    throw new Error("status must be active, disabled, or revoked");
  }

  let storecodes = normalizeStorecodesInput(storecodesRaw);
  if (storecodes.length === 0) {
    if (role === "admin") {
      storecodes = ["admin"];
    } else if (role === "superadmin") {
      storecodes = ["superadmin"];
    }
  }

  if (role === "store_admin" && storecodes.length === 0) {
    throw new Error("storecodes is required for store_admin");
  }

  const accounts = await getAccountsCollection();
  const existing = await accounts.findOne({ loginId });
  if (existing && !updateExisting) {
    throw new Error("Admin password account already exists");
  }

  const password = typeof passwordRaw === "string" ? passwordRaw : "";
  if (!existing && !password) {
    throw new Error("password is required");
  }

  const now = new Date();
  const updateSet: Record<string, unknown> = {
    loginId,
    displayName: normalizeString(displayNameRaw) || loginId,
    role,
    storecodes,
    status,
    failedLoginCount: 0,
    lockedUntil: null,
    updatedAt: now,
  };

  let passwordUpdated = false;
  if (password) {
    updateSet.passwordHash = await hashAdminPassword(password);
    updateSet.passwordUpdatedAt = now;
    passwordUpdated = true;
  }

  await accounts.updateOne(
    { loginId },
    {
      $set: updateSet,
      $setOnInsert: {
        createdAt: now,
        lastLoginAt: null,
      },
    },
    { upsert: true },
  );

  if (passwordUpdated || status !== "active") {
    const sessions = await getSessionsCollection();
    await sessions.updateMany(
      {
        accountLoginId: loginId,
        status: "active",
      },
      {
        $set: {
          status: "revoked",
          updatedAt: now,
        },
      },
    );
  }

  const account = await accounts.findOne({ loginId });
  if (!account) {
    throw new Error("Failed to load admin password account");
  }

  return {
    account: sanitizeAccount(account),
    created: !existing,
    passwordUpdated,
  };
};

export const getAdminPasswordRequesterWalletAddress = (loginId: string): string => {
  return `password:${normalizeLoginId(loginId) || "unknown"}`;
};

export const getAdminPasswordRequesterStorecode = (account: SanitizedAdminPasswordAccount): string => {
  if (account.role === "admin") {
    return "admin";
  }
  if (account.role === "superadmin") {
    return "superadmin";
  }
  return normalizeStorecode(account.storecodes[0]) || "store_admin";
};

export const buildAdminPasswordRequesterUser = (
  account: SanitizedAdminPasswordAccount,
): Record<string, unknown> => {
  const requesterStorecode = getAdminPasswordRequesterStorecode(account);
  return {
    loginId: account.loginId,
    nickname: account.displayName || account.loginId,
    name: account.displayName || account.loginId,
    role: account.role,
    storecode: requesterStorecode,
    walletAddress: getAdminPasswordRequesterWalletAddress(account.loginId),
    authType: "password_session",
    allowedStorecodes: account.storecodes,
  };
};

const accountHasStorecode = (
  account: SanitizedAdminPasswordAccount,
  storecodeRaw: unknown,
): boolean => {
  const storecode = normalizeStorecode(storecodeRaw);
  if (!storecode) {
    return false;
  }

  const storecodes = normalizeStorecodes(account.storecodes);
  return storecodes.includes("*") || storecodes.includes(storecode);
};

export const canAdminPasswordAccountUseAdminAction = ({
  account,
  allowedRoles,
  requireAdminStorecode,
}: {
  account: SanitizedAdminPasswordAccount;
  allowedRoles: string[];
  requireAdminStorecode: boolean;
}) => {
  const role = normalizeAdminPasswordRole(account.role);
  const normalizedAllowedRoles = allowedRoles
    .map((value) => normalizeAdminPasswordRole(value))
    .filter(Boolean) as AdminPasswordRole[];

  if (!role) {
    return false;
  }

  if (normalizedAllowedRoles.length > 0 && !normalizedAllowedRoles.includes(role)) {
    return false;
  }

  if (requireAdminStorecode) {
    return role === "admin" && accountHasStorecode(account, "admin");
  }

  return true;
};

export const getAdminPasswordCenterStoreAccess = ({
  account,
  storecode,
}: {
  account: SanitizedAdminPasswordAccount;
  storecode: string;
}):
  | { ok: true; requesterIsAdmin: boolean; matchedBy: "global_admin" | "store_admin_password" }
  | { ok: false; reason: string } => {
  const role = normalizeAdminPasswordRole(account.role);

  if (role === "admin" || role === "superadmin") {
    return {
      ok: true,
      requesterIsAdmin: true,
      matchedBy: "global_admin",
    };
  }

  if (role === "store_admin" && accountHasStorecode(account, storecode)) {
    return {
      ok: true,
      requesterIsAdmin: false,
      matchedBy: "store_admin_password",
    };
  }

  return {
    ok: false,
    reason: role === "store_admin" ? "store_not_allowed" : "role_not_allowed",
  };
};

const buildSessionToken = () => {
  const sessionId = randomBytes(12).toString("base64url");
  const secret = randomBytes(32).toString("base64url");
  return {
    sessionId,
    token: `sgas_${sessionId}_${secret}`,
  };
};

const parseSessionToken = (tokenRaw: unknown): { sessionId: string; token: string } | null => {
  const token = normalizeString(tokenRaw);
  const match = /^sgas_([A-Za-z0-9_-]{12,})_([A-Za-z0-9_-]{24,})$/.exec(token);
  if (!match) {
    return null;
  }
  return {
    sessionId: match[1],
    token,
  };
};

const getRequestIp = (request: NextRequest): string => {
  return (
    normalizeString(request.headers.get("x-forwarded-for")).split(",")[0]?.trim()
    || normalizeString(request.headers.get("x-real-ip"))
    || "unknown"
  );
};

export const authenticateAdminPasswordLogin = async ({
  loginIdRaw,
  passwordRaw,
  request,
}: {
  loginIdRaw: unknown;
  passwordRaw: unknown;
  request: NextRequest;
}):
  Promise<
    | {
        ok: true;
        token: string;
        sessionId: string;
        expiresAt: Date;
        account: SanitizedAdminPasswordAccount;
      }
    | {
        ok: false;
        status: number;
        error: string;
        reason: string;
      }
  > => {
  const loginId = normalizeLoginId(loginIdRaw);
  const password = typeof passwordRaw === "string" ? passwordRaw : "";

  if (!loginId || !password) {
    return {
      ok: false,
      status: 400,
      error: "loginId and password are required",
      reason: "missing_credentials",
    };
  }

  const accounts = await getAccountsCollection();
  const account = await accounts.findOne({ loginId });

  if (!account) {
    return {
      ok: false,
      status: 401,
      error: "Invalid login credentials",
      reason: "account_not_found",
    };
  }

  if (account.status !== "active") {
    return {
      ok: false,
      status: 403,
      error: "Admin account is not active",
      reason: "account_inactive",
    };
  }

  if (account.lockedUntil && account.lockedUntil.getTime() > Date.now()) {
    return {
      ok: false,
      status: 423,
      error: "Admin account is temporarily locked",
      reason: "account_locked",
    };
  }

  const passwordMatches = await verifyAdminPasswordHash({
    passwordRaw: password,
    passwordHash: account.passwordHash,
  });

  if (!passwordMatches) {
    const failedLoginCount = Number(account.failedLoginCount || 0) + 1;
    const maxFailedLoginCount = getConfiguredMaxFailedLoginCount();
    const lockedUntil = failedLoginCount >= maxFailedLoginCount
      ? new Date(Date.now() + getConfiguredLoginLockMs())
      : null;

    await accounts.updateOne(
      { loginId },
      {
        $set: {
          failedLoginCount,
          lockedUntil,
          updatedAt: new Date(),
        },
      },
    );

    return {
      ok: false,
      status: 401,
      error: "Invalid login credentials",
      reason: lockedUntil ? "invalid_password_locked" : "invalid_password",
    };
  }

  const { token, sessionId } = buildSessionToken();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + getConfiguredSessionTtlMs());
  const accountStorecodes = normalizeStorecodes(account.storecodes);
  const sanitizedAccount = sanitizeAccount({
    ...account,
    storecodes: accountStorecodes,
  });

  const sessions = await getSessionsCollection();
  await sessions.insertOne({
    sessionId,
    tokenHash: sha256(token),
    accountLoginId: loginId,
    role: sanitizedAccount.role,
    storecodes: accountStorecodes,
    status: "active",
    createdAt: now,
    updatedAt: now,
    expiresAt,
    lastSeenAt: now,
    publicIp: getRequestIp(request),
    userAgent: normalizeString(request.headers.get("user-agent")) || null,
  });

  await accounts.updateOne(
    { loginId },
    {
      $set: {
        failedLoginCount: 0,
        lockedUntil: null,
        lastLoginAt: now,
        updatedAt: now,
      },
    },
  );

  return {
    ok: true,
    token,
    sessionId,
    expiresAt,
    account: sanitizedAccount,
  };
};

const readSessionToken = (
  request: NextRequest,
): { token: string; source: AdminPasswordSessionSource } | null => {
  const authorization = normalizeString(request.headers.get("authorization"));
  const bearerMatch = /^Bearer\s+(.+)$/i.exec(authorization);
  if (bearerMatch?.[1]) {
    return {
      token: bearerMatch[1].trim(),
      source: "bearer",
    };
  }

  const headerToken = normalizeString(request.headers.get("x-admin-session-token"));
  if (headerToken) {
    return {
      token: headerToken,
      source: "header",
    };
  }

  const cookieToken = request.cookies.get(ADMIN_PASSWORD_COOKIE_NAME)?.value;
  if (cookieToken) {
    return {
      token: cookieToken,
      source: "cookie",
    };
  }

  return null;
};

export const readAdminPasswordSession = async (
  request: NextRequest,
): Promise<AdminPasswordSessionAuth> => {
  const tokenInfo = readSessionToken(request);
  if (!tokenInfo) {
    return {
      authenticated: false,
      tokenProvided: false,
      source: null,
      reason: "missing_token",
    };
  }

  const parsedToken = parseSessionToken(tokenInfo.token);
  if (!parsedToken) {
    return {
      authenticated: false,
      tokenProvided: true,
      source: tokenInfo.source,
      reason: "invalid_token_format",
    };
  }

  const sessions = await getSessionsCollection();
  const session = await sessions.findOne({
    sessionId: parsedToken.sessionId,
    status: "active",
  });

  if (!session) {
    return {
      authenticated: false,
      tokenProvided: true,
      source: tokenInfo.source,
      reason: "session_not_found",
    };
  }

  if (session.expiresAt.getTime() <= Date.now()) {
    return {
      authenticated: false,
      tokenProvided: true,
      source: tokenInfo.source,
      reason: "session_expired",
    };
  }

  if (!safeCompareHex(sha256(parsedToken.token), session.tokenHash)) {
    return {
      authenticated: false,
      tokenProvided: true,
      source: tokenInfo.source,
      reason: "token_hash_mismatch",
    };
  }

  const accounts = await getAccountsCollection();
  const account = await accounts.findOne({
    loginId: session.accountLoginId,
    status: "active",
  });

  if (!account) {
    return {
      authenticated: false,
      tokenProvided: true,
      source: tokenInfo.source,
      reason: "account_not_active",
    };
  }

  const now = new Date();
  if (now.getTime() - session.lastSeenAt.getTime() > 60_000) {
    void sessions.updateOne(
      { sessionId: session.sessionId },
      {
        $set: {
          lastSeenAt: now,
          updatedAt: now,
        },
      },
    );
  }

  const sanitizedAccount = sanitizeAccount(account);
  const requesterWalletAddress = getAdminPasswordRequesterWalletAddress(sanitizedAccount.loginId);
  const requesterStorecode = getAdminPasswordRequesterStorecode(sanitizedAccount);

  return {
    authenticated: true,
    source: tokenInfo.source,
    token: parsedToken.token,
    sessionId: session.sessionId,
    expiresAt: session.expiresAt,
    account: sanitizedAccount,
    requesterWalletAddress,
    requesterStorecode,
    requesterUser: buildAdminPasswordRequesterUser(sanitizedAccount),
  };
};

export const isAdminPasswordCookieSessionRequestAllowed = (
  request: NextRequest,
  source: AdminPasswordSessionSource,
): boolean => {
  if (source !== "cookie") {
    return true;
  }

  const method = String(request.method || "GET").toUpperCase();
  if (method === "GET" || method === "HEAD" || method === "OPTIONS") {
    return true;
  }

  const origin = normalizeString(request.headers.get("origin"));
  if (!origin) {
    return true;
  }

  const host = normalizeString(request.headers.get("host"));
  if (!host) {
    return false;
  }

  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
};

export const applyAdminPasswordSessionCookie = ({
  response,
  token,
  expiresAt,
}: {
  response: NextResponse;
  token: string;
  expiresAt: Date;
}) => {
  response.cookies.set(ADMIN_PASSWORD_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
    maxAge: Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 1000)),
  });
};

export const clearAdminPasswordSessionCookie = (response: NextResponse) => {
  response.cookies.set(ADMIN_PASSWORD_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
    expires: new Date(0),
  });
};

export const revokeAdminPasswordSession = async (request: NextRequest) => {
  const session = await readAdminPasswordSession(request);
  if (!session.authenticated) {
    return false;
  }

  const sessions = await getSessionsCollection();
  await sessions.updateOne(
    { sessionId: session.sessionId },
    {
      $set: {
        status: "revoked",
        updatedAt: new Date(),
      },
    },
  );
  return true;
};
