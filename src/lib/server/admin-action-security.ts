import { NextRequest } from "next/server";

import {
  getOneAdminWalletUserByWalletAddress,
  getOneByWalletAddress,
  getOneByWalletAddressAcrossStores,
} from "@lib/api/user";
import { insertAdminApiCallLog } from "@/lib/api/adminApiCallLog";
import clientPromise, { dbName } from "@/lib/mongodb";
import {
  consumeReadRateLimit,
  getRequestCountry,
  getRequestIp,
  logUserReadSecurityEvent,
  normalizeWalletAddress,
  parseSignedAtOrNull,
  verifyWalletSignatureWithFallback,
} from "@/lib/server/user-read-security";

const ADMIN_ACTION_NONCE_COLLECTION = "adminActionSecurityNonces";
const DEFAULT_ADMIN_ACTION_NONCE_TTL_MS = 10 * 60 * 1000;
const ADMIN_ACTION_NONCE_UNIQ_INDEX = "uniq_admin_action_nonce_key";
const ADMIN_ACTION_NONCE_TTL_INDEX = "ttl_admin_action_nonce_expires_at";

const globalAdminActionSecurity = globalThis as typeof globalThis & {
  __adminActionNonceIndexesReady?: boolean;
};

type BuildAdminActionSigningMessageParams = {
  signingPrefix: string;
  route: string;
  requesterStorecode: string;
  requesterWalletAddress: string;
  nonce: string;
  signedAtIso: string;
  actionFields: Record<string, unknown>;
};

export type VerifyAdminSignedActionParams = {
  request: NextRequest;
  route: string;
  signingPrefix: string;
  requesterStorecodeRaw: unknown;
  requesterWalletAddressRaw: unknown;
  signatureRaw: unknown;
  signedAtRaw: unknown;
  nonceRaw: unknown;
  actionFields: Record<string, unknown>;
  requestLogActionFields?: Record<string, unknown>;
  allowedRoles?: string[];
  requireAdminStorecode?: boolean;
};

export type VerifyAdminSignedActionResult =
  | {
      ok: true;
      requesterWalletAddress: string;
      requesterStorecode: string;
      requesterUser: any;
      signedAtIso: string;
      nonce: string;
      ip: string;
    }
  | {
      ok: false;
      status: number;
      error: string;
    };

const normalizeString = (value: unknown) => {
  if (typeof value !== "string") {
    return "";
  }
  return value.trim();
};

const normalizeRole = (value: unknown) => normalizeString(value).toLowerCase();

const getRequesterRoleLower = (user: any) => {
  return normalizeRole(user?.role || user?.rold);
};

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const getAuthorizedRequesterAcrossStores = async ({
  walletAddress,
  allowedRoles,
}: {
  walletAddress: string;
  allowedRoles: string[];
}) => {
  const walletAddressRaw = normalizeString(walletAddress);
  if (!walletAddressRaw) {
    return null;
  }

  const rolePatterns = allowedRoles
    .map((value) => normalizeRole(value))
    .filter(Boolean)
    .map((value) => new RegExp(`^${escapeRegex(value)}$`, "i"));

  if (rolePatterns.length === 0) {
    return getOneByWalletAddressAcrossStores(walletAddressRaw);
  }

  const walletAddressCandidates = Array.from(
    new Set([walletAddressRaw, walletAddressRaw.toLowerCase(), walletAddressRaw.toUpperCase()]),
  );

  const dbClient = await clientPromise;
  const collection = dbClient.db(dbName).collection("users");

  const roleQuery = {
    $or: [
      { role: { $in: rolePatterns } },
      { rold: { $in: rolePatterns } },
    ],
  };

  const directMatch = await collection.findOne({
    walletAddress: { $in: walletAddressCandidates },
    ...roleQuery,
  });

  if (directMatch) {
    return directMatch;
  }

  const walletAddressRegex = new RegExp(`^${escapeRegex(walletAddressRaw)}$`, "i");

  return collection.findOne({
    walletAddress: walletAddressRegex,
    ...roleQuery,
  });
};

const normalizeActionFieldValue = (value: unknown): string => {
  if (value == null) {
    return "";
  }
  if (Array.isArray(value)) {
    return value.map((item) => normalizeActionFieldValue(item)).join(",");
  }
  if (typeof value === "object") {
    try {
      return JSON.stringify(value);
    } catch {
      return "";
    }
  }
  return String(value).trim();
};

const ensureAdminActionNonceIndexes = async () => {
  if (globalAdminActionSecurity.__adminActionNonceIndexesReady) {
    return;
  }

  const dbClient = await clientPromise;
  const collection = dbClient.db(dbName).collection(ADMIN_ACTION_NONCE_COLLECTION);

  await collection.createIndex(
    { nonceKey: 1 },
    { unique: true, name: ADMIN_ACTION_NONCE_UNIQ_INDEX }
  );
  await collection.createIndex(
    { expiresAt: 1 },
    { expireAfterSeconds: 0, name: ADMIN_ACTION_NONCE_TTL_INDEX }
  );

  globalAdminActionSecurity.__adminActionNonceIndexesReady = true;
};

export const buildAdminActionSigningMessage = ({
  signingPrefix,
  route,
  requesterStorecode,
  requesterWalletAddress,
  nonce,
  signedAtIso,
  actionFields,
}: BuildAdminActionSigningMessageParams): string => {
  const actionLines = Object.entries(actionFields || {})
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}:${normalizeActionFieldValue(value)}`);

  return [
    signingPrefix,
    `route:${route}`,
    `requesterStorecode:${requesterStorecode}`,
    `requesterWalletAddress:${requesterWalletAddress}`,
    `nonce:${nonce}`,
    `signedAt:${signedAtIso}`,
    ...actionLines,
  ].join("\n");
};

const consumeAdminActionNonce = async ({
  route,
  walletAddress,
  nonce,
  signedAtIso,
}: {
  route: string;
  walletAddress: string;
  nonce: string;
  signedAtIso: string;
}) => {
  const dbClient = await clientPromise;
  const collection = dbClient.db(dbName).collection(ADMIN_ACTION_NONCE_COLLECTION);
  await ensureAdminActionNonceIndexes();

  const nonceKey = `${route}:${walletAddress}:${nonce}`;

  const now = Date.now();
  const ttlFromNow = Number.parseInt(process.env.ADMIN_ACTION_NONCE_TTL_MS || "", 10);
  const ttlMs =
    Number.isFinite(ttlFromNow) && ttlFromNow > 0
      ? ttlFromNow
      : DEFAULT_ADMIN_ACTION_NONCE_TTL_MS;

  try {
    const result = await collection.updateOne(
      { nonceKey },
      {
        $setOnInsert: {
          nonceKey,
          route,
          walletAddress,
          nonce,
          signedAt: signedAtIso,
          createdAt: new Date(now),
          expiresAt: new Date(now + ttlMs),
        },
      },
      { upsert: true }
    );

    return Boolean(result.upsertedCount);
  } catch (error: any) {
    if (error?.code === 11000) {
      return false;
    }
    throw error;
  }
};

export const verifyAdminSignedAction = async ({
  request,
  route,
  signingPrefix,
  requesterStorecodeRaw,
  requesterWalletAddressRaw,
  signatureRaw,
  signedAtRaw,
  nonceRaw,
  actionFields,
  requestLogActionFields,
  allowedRoles,
  requireAdminStorecode = true,
}: VerifyAdminSignedActionParams): Promise<VerifyAdminSignedActionResult> => {
  const requesterStorecode = normalizeString(requesterStorecodeRaw || "admin") || "admin";
  const requesterWalletAddress = normalizeWalletAddress(requesterWalletAddressRaw);
  const signature = normalizeString(signatureRaw);
  const signedAtIso = parseSignedAtOrNull(signedAtRaw);
  const nonce = normalizeString(nonceRaw);
  const ip = getRequestIp(request);
  const country = getRequestCountry(request);
  const normalizedAllowedRoles = Array.from(
    new Set(
      ((allowedRoles === undefined ? ["admin"] : allowedRoles) || [])
        .map((value) => normalizeRole(value))
        .filter(Boolean),
    ),
  );
  const hasRoleRestriction = normalizedAllowedRoles.length > 0;

  const writeAdminApiCallLog = async ({
    status,
    reason,
    requesterUser,
    walletAddress,
    meta,
  }: {
    status: "allowed" | "blocked";
    reason: string;
    requesterUser?: any;
    walletAddress?: string | null;
    meta?: Record<string, unknown>;
  }) => {
    await insertAdminApiCallLog({
      route,
      guardType: "admin_signed",
      status,
      reason,
      publicIp: ip,
      publicCountry: country,
      requesterWalletAddress: walletAddress ?? requesterWalletAddress ?? null,
      requesterUser: requesterUser || null,
      requestBody: requestLogActionFields || actionFields,
      meta: {
        requesterStorecode,
        signingPrefix,
        allowedRoles: normalizedAllowedRoles,
        requireAdminStorecode,
        ...meta,
      },
    });
  };

  if (!requesterWalletAddress || !signature || !signedAtIso || !nonce) {
    await writeAdminApiCallLog({
      status: "blocked",
      reason: "missing_or_invalid_signature_fields",
    });
    await logUserReadSecurityEvent({
      route,
      status: "blocked",
      reason: "missing_or_invalid_signature_fields",
      ip,
      requesterWalletAddress: requesterWalletAddress || undefined,
      signatureProvided: Boolean(signature && signedAtIso),
      signatureVerified: false,
      rateLimited: false,
      extra: {
        requesterStorecode,
        allowedRoles: normalizedAllowedRoles,
      },
    });

    return {
      ok: false,
      status: 401,
      error: "Invalid signature",
    };
  }

  const rate = consumeReadRateLimit({
    scope: `admin-action:${route}`,
    ip,
    walletAddress: requesterWalletAddress,
  });

  if (!rate.allowed) {
    await writeAdminApiCallLog({
      status: "blocked",
      reason: "rate_limited",
    });
    await logUserReadSecurityEvent({
      route,
      status: "blocked",
      reason: "rate_limited",
      ip,
      requesterWalletAddress,
      signatureProvided: true,
      signatureVerified: false,
      rateLimited: true,
      extra: {
        requesterStorecode,
        allowedRoles: normalizedAllowedRoles,
      },
    });

    return {
      ok: false,
      status: 429,
      error: "Too many requests",
    };
  }

  const signingMessage = buildAdminActionSigningMessage({
    signingPrefix,
    route,
    requesterStorecode,
    requesterWalletAddress,
    nonce,
    signedAtIso,
    actionFields,
  });

  const signatureVerified = await verifyWalletSignatureWithFallback({
    walletAddress: requesterWalletAddress,
    signature,
    message: signingMessage,
    storecodeHint: requesterStorecode,
  });

  if (!signatureVerified) {
    await writeAdminApiCallLog({
      status: "blocked",
      reason: "invalid_signature",
    });
    await logUserReadSecurityEvent({
      route,
      status: "blocked",
      reason: "invalid_signature",
      ip,
      requesterWalletAddress,
      signatureProvided: true,
      signatureVerified: false,
      rateLimited: false,
      extra: {
        requesterStorecode,
      },
    });

    return {
      ok: false,
      status: 401,
      error: "Invalid signature",
    };
  }

  const requesterUser = requireAdminStorecode
    ? requesterStorecode.toLowerCase() === "admin"
      ? await getOneAdminWalletUserByWalletAddress(requesterWalletAddress)
      : await getOneByWalletAddress(requesterStorecode, requesterWalletAddress)
    : await getAuthorizedRequesterAcrossStores({
        walletAddress: requesterWalletAddress,
        allowedRoles: normalizedAllowedRoles,
      });
  const requesterStorecodeLower = String(requesterUser?.storecode || "").trim().toLowerCase();
  const requesterRoleLower = getRequesterRoleLower(requesterUser);
  const requesterHasAllowedRole = hasRoleRestriction
    ? normalizedAllowedRoles.includes(requesterRoleLower)
    : Boolean(requesterUser);
  const requesterMatchesStorecode = requireAdminStorecode ? requesterStorecodeLower === "admin" : true;
  const requesterIsAuthorized = requesterHasAllowedRole && requesterMatchesStorecode;

  if (!requesterIsAuthorized) {
    const denyReason = requesterUser
      ? "forbidden_not_authorized_role"
      : "forbidden_requester_not_found";
    await writeAdminApiCallLog({
      status: "blocked",
      reason: denyReason,
      requesterUser,
      meta: {
        requesterStorecode: requesterUser?.storecode || requesterStorecode,
        requesterRole: requesterRoleLower || null,
        allowedRoles: normalizedAllowedRoles,
        requireAdminStorecode,
      },
    });
    await logUserReadSecurityEvent({
      route,
      status: "blocked",
      reason: denyReason,
      ip,
      requesterWalletAddress,
      signatureProvided: true,
      signatureVerified: true,
      rateLimited: false,
      extra: {
        requesterStorecode: requesterUser?.storecode || requesterStorecode,
        requesterRole: requesterRoleLower || null,
        allowedRoles: normalizedAllowedRoles,
        requireAdminStorecode,
      },
    });

    return {
      ok: false,
      status: 403,
      error: "Forbidden",
    };
  }

  const nonceAccepted = await consumeAdminActionNonce({
    route,
    walletAddress: requesterWalletAddress,
    nonce,
    signedAtIso,
  });

  if (!nonceAccepted) {
    await writeAdminApiCallLog({
      status: "blocked",
      reason: "replayed_nonce",
      requesterUser,
    });
    await logUserReadSecurityEvent({
      route,
      status: "blocked",
      reason: "replayed_nonce",
      ip,
      requesterWalletAddress,
      signatureProvided: true,
      signatureVerified: true,
      rateLimited: false,
      extra: {
        requesterStorecode,
        allowedRoles: normalizedAllowedRoles,
      },
    });

    return {
      ok: false,
      status: 409,
      error: "Replay detected",
    };
  }

  await writeAdminApiCallLog({
    status: "allowed",
    reason: "admin_signed",
    requesterUser,
  });
  await logUserReadSecurityEvent({
    route,
    status: "allowed",
    reason: "admin_signed",
    ip,
    requesterWalletAddress,
    signatureProvided: true,
    signatureVerified: true,
    rateLimited: false,
      extra: {
        requesterStorecode,
        action: signingPrefix,
        allowedRoles: normalizedAllowedRoles,
        requireAdminStorecode,
      },
    });

  return {
    ok: true,
    requesterWalletAddress,
    requesterStorecode,
    requesterUser,
    signedAtIso,
    nonce,
    ip,
  };
};
