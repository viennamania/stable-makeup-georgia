import { ethers } from "ethers";
import { verifySignature } from "thirdweb/auth";
import { arbitrum, bsc, ethereum, polygon } from "thirdweb/chains";
import { NextRequest } from "next/server";

import clientPromise, { dbName } from "@/lib/mongodb";
import { client } from "@/app/client";
import { chain as configuredChain } from "@/app/config/contractAddresses";

const SELF_READ_SIGNING_PREFIX = "stable-georgia:get-user:self:v1";
const ADMIN_READ_SIGNING_PREFIX = "stable-georgia:get-user:admin:v1";
const DEFAULT_SIGNATURE_TTL_MS = 5 * 60 * 1000;
const DEFAULT_RATE_LIMIT_WINDOW_MS = 60 * 1000;
const DEFAULT_RATE_LIMIT_MAX = 120;
const USER_READ_SECURITY_LOG_COLLECTION = "userReadSecurityLogs";

const SENSITIVE_USER_KEYS = new Set([
  "password",
  "walletPrivateKey",
  "escrowWalletPrivateKey",
  "emailVerified",
]);

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const globalStore = globalThis as typeof globalThis & {
  __userReadRateLimitStore?: Map<string, RateLimitEntry>;
};

const rateLimitStore = globalStore.__userReadRateLimitStore ?? new Map<string, RateLimitEntry>();
if (!globalStore.__userReadRateLimitStore) {
  globalStore.__userReadRateLimitStore = rateLimitStore;
}

const normalizeString = (value: unknown): string => {
  if (typeof value !== "string") {
    return "";
  }
  return value.trim();
};

export const normalizeWalletAddress = (value: unknown): string | null => {
  if (typeof value !== "string") {
    return null;
  }

  try {
    return ethers.utils.getAddress(value.trim()).toLowerCase();
  } catch {
    return null;
  }
};

const resolveSignatureChains = (storecodeHint: string) => {
  const chainMap: Record<string, any> = {
    arbitrum,
    polygon,
    ethereum,
    bsc,
  };

  const candidates = [
    String(storecodeHint || "").trim().toLowerCase(),
    String(configuredChain || "").trim().toLowerCase(),
    "arbitrum",
    "polygon",
    "ethereum",
    "bsc",
  ];

  const chains: any[] = [];
  for (const name of candidates) {
    const candidate = chainMap[name];
    if (!candidate) {
      continue;
    }
    if (!chains.some((item) => item.id === candidate.id)) {
      chains.push(candidate);
    }
  }

  return chains;
};

export const parseSignedAtOrNull = (signedAtRaw: unknown, ttlMs = DEFAULT_SIGNATURE_TTL_MS) => {
  const signedAtText = normalizeString(signedAtRaw);
  if (!signedAtText) {
    return null;
  }

  const signedAtMs = Date.parse(signedAtText);
  if (Number.isNaN(signedAtMs)) {
    return null;
  }

  if (Math.abs(Date.now() - signedAtMs) > ttlMs) {
    return null;
  }

  return new Date(signedAtMs).toISOString();
};

export const buildSelfReadSigningMessage = ({
  storecode,
  walletAddress,
  signedAtIso,
}: {
  storecode: string;
  walletAddress: string;
  signedAtIso: string;
}): string => {
  return [
    SELF_READ_SIGNING_PREFIX,
    `storecode:${storecode}`,
    `walletAddress:${walletAddress}`,
    `signedAt:${signedAtIso}`,
  ].join("\n");
};

export const buildAdminReadSigningMessage = ({
  adminStorecode,
  adminWalletAddress,
  targetStorecode,
  targetWalletAddress,
  signedAtIso,
}: {
  adminStorecode: string;
  adminWalletAddress: string;
  targetStorecode: string;
  targetWalletAddress: string;
  signedAtIso: string;
}): string => {
  return [
    ADMIN_READ_SIGNING_PREFIX,
    `adminStorecode:${adminStorecode}`,
    `adminWalletAddress:${adminWalletAddress}`,
    `targetStorecode:${targetStorecode}`,
    `targetWalletAddress:${targetWalletAddress}`,
    `signedAt:${signedAtIso}`,
  ].join("\n");
};

export const verifyWalletSignatureWithFallback = async ({
  walletAddress,
  signature,
  message,
  storecodeHint,
}: {
  walletAddress: string;
  signature: string;
  message: string;
  storecodeHint: string;
}): Promise<boolean> => {
  let isValid = false;

  try {
    const recoveredAddress = ethers.utils.verifyMessage(message, signature).toLowerCase();
    isValid = recoveredAddress === walletAddress;
  } catch {
    isValid = false;
  }

  if (isValid) {
    return true;
  }

  try {
    const chains = resolveSignatureChains(storecodeHint);
    for (const chainItem of chains) {
      const result = await verifySignature({
        message,
        signature,
        address: walletAddress,
        chain: chainItem,
        client,
      });

      if (result) {
        return true;
      }
    }
  } catch {
    return false;
  }

  return false;
};

export const sanitizeUserForResponse = (value: any): any => {
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeUserForResponse(item));
  }

  if (!value || typeof value !== "object") {
    return value;
  }

  const sanitized: Record<string, any> = {};
  for (const [key, itemValue] of Object.entries(value)) {
    if (SENSITIVE_USER_KEYS.has(key)) {
      continue;
    }
    sanitized[key] = sanitizeUserForResponse(itemValue);
  }

  return sanitized;
};

export const consumeReadRateLimit = ({
  scope,
  ip,
  walletAddress,
}: {
  scope: string;
  ip: string;
  walletAddress: string;
}) => {
  const limitMax = Number.parseInt(process.env.USER_READ_RATE_LIMIT_MAX || "", 10);
  const windowMs = Number.parseInt(process.env.USER_READ_RATE_LIMIT_WINDOW_MS || "", 10);
  const max = Number.isFinite(limitMax) && limitMax > 0 ? limitMax : DEFAULT_RATE_LIMIT_MAX;
  const window = Number.isFinite(windowMs) && windowMs > 0 ? windowMs : DEFAULT_RATE_LIMIT_WINDOW_MS;

  const key = `${scope}:${ip}:${walletAddress}`;
  const now = Date.now();
  const current = rateLimitStore.get(key);

  if (!current || current.resetAt <= now) {
    const resetAt = now + window;
    rateLimitStore.set(key, { count: 1, resetAt });
    return {
      allowed: true,
      remaining: Math.max(0, max - 1),
      resetAt,
      max,
    };
  }

  if (current.count >= max) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: current.resetAt,
      max,
    };
  }

  current.count += 1;
  rateLimitStore.set(key, current);
  return {
    allowed: true,
    remaining: Math.max(0, max - current.count),
    resetAt: current.resetAt,
    max,
  };
};

export const getRequestIp = (request: NextRequest): string => {
  const xForwardedFor = normalizeString(request.headers.get("x-forwarded-for"));
  if (xForwardedFor) {
    const firstIp = xForwardedFor.split(",")[0]?.trim();
    if (firstIp) {
      return firstIp;
    }
  }

  const xRealIp = normalizeString(request.headers.get("x-real-ip"));
  if (xRealIp) {
    return xRealIp;
  }

  return "unknown";
};

export const getRequestCountry = (request: NextRequest): string => {
  const headerCandidates = [
    request.headers.get("x-vercel-ip-country"),
    request.headers.get("cf-ipcountry"),
    request.headers.get("x-country-code"),
    request.headers.get("x-geo-country"),
  ];

  for (const candidate of headerCandidates) {
    const normalized = normalizeString(candidate).toUpperCase();
    if (!normalized || normalized === "UNKNOWN") {
      continue;
    }
    if (/^[A-Z]{2}$/.test(normalized)) {
      return normalized;
    }
    return normalized;
  }

  return "unknown";
};

export const logUserReadSecurityEvent = async (payload: {
  route: string;
  status: string;
  reason?: string;
  ip?: string;
  storecode?: string;
  walletAddress?: string;
  requesterWalletAddress?: string;
  signatureProvided?: boolean;
  signatureVerified?: boolean;
  rateLimited?: boolean;
  extra?: Record<string, unknown>;
}) => {
  try {
    const dbClient = await clientPromise;
    const collection = dbClient.db(dbName).collection(USER_READ_SECURITY_LOG_COLLECTION);

    await collection.insertOne({
      route: payload.route,
      status: payload.status,
      reason: payload.reason || null,
      ip: payload.ip || null,
      storecode: payload.storecode || null,
      walletAddress: payload.walletAddress || null,
      requesterWalletAddress: payload.requesterWalletAddress || null,
      signatureProvided: Boolean(payload.signatureProvided),
      signatureVerified: Boolean(payload.signatureVerified),
      rateLimited: Boolean(payload.rateLimited),
      extra: payload.extra || null,
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Failed to write user read security log:", error);
  }
};
