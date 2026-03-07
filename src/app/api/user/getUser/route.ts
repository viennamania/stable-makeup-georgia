import { NextResponse, type NextRequest } from "next/server";

import {
  getOneByWalletAddress,
} from "@lib/api/user";
import {
  buildSelfReadSigningMessage,
  consumeReadRateLimit,
  getRequestIp,
  logUserReadSecurityEvent,
  normalizeWalletAddress,
  parseSignedAtOrNull,
  sanitizeUserForResponse,
  verifyWalletSignatureWithFallback,
} from "@/lib/server/user-read-security";

type GetUserRequestBody = {
  storecode?: unknown;
  walletAddress?: unknown;
  requesterWalletAddress?: unknown;
  signature?: unknown;
  signedAt?: unknown;
};

const normalizeString = (value: unknown): string => {
  if (typeof value !== "string") {
    return "";
  }
  return value.trim();
};

const globalGetUserRouteCacheState = globalThis as typeof globalThis & {
  __getUserRouteCache?: Map<string, { expiresAt: number; value: any }>;
};

const GET_USER_ROUTE_CACHE_TTL_MS = Number.parseInt(
  process.env.GET_USER_ROUTE_CACHE_TTL_MS || "",
  10,
) > 0
  ? Number.parseInt(process.env.GET_USER_ROUTE_CACHE_TTL_MS || "", 10)
  : 10000;
const GET_USER_ROUTE_TIMEOUT_MS = Number.parseInt(
  process.env.GET_USER_ROUTE_TIMEOUT_MS || "",
  10,
) > 0
  ? Number.parseInt(process.env.GET_USER_ROUTE_TIMEOUT_MS || "", 10)
  : 10000;
const GET_USER_TRANSIENT_RETRY_COUNT = Math.max(
  Number.parseInt(process.env.GET_USER_TRANSIENT_RETRY_COUNT || "", 10) || 2,
  1,
);
const GET_USER_TRANSIENT_RETRY_DELAY_MS = Math.max(
  Number.parseInt(process.env.GET_USER_TRANSIENT_RETRY_DELAY_MS || "", 10) || 150,
  50,
);

const getRouteCache = () => {
  if (!globalGetUserRouteCacheState.__getUserRouteCache) {
    globalGetUserRouteCacheState.__getUserRouteCache = new Map();
  }
  return globalGetUserRouteCacheState.__getUserRouteCache;
};

const withTimeout = async <T>(
  promise: Promise<T>,
  timeoutMs: number,
  timeoutMessage: string,
): Promise<T> => {
  const safeTimeoutMs = Math.max(1000, timeoutMs);
  let timer: ReturnType<typeof setTimeout> | null = null;

  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => reject(new Error(timeoutMessage)), safeTimeoutMs);
      }),
    ]);
  } finally {
    if (timer) {
      clearTimeout(timer);
    }
  }
};

const isTransientMongoError = (error: unknown): boolean => {
  if (!error || typeof error !== "object") {
    return false;
  }

  const anyError = error as any;
  const labels = anyError?.errorLabelSet instanceof Set
    ? Array.from(anyError.errorLabelSet)
    : [];
  const labelSet = new Set(labels.map((label) => String(label)));
  const name = String(anyError?.name || "");
  const message = String(anyError?.message || "");
  const code = String(anyError?.code || anyError?.cause?.code || "");
  const causeName = String(anyError?.cause?.name || "");

  if (labelSet.has("ResetPool") || labelSet.has("PoolRequestedRetry") || labelSet.has("PoolRequstedRetry")) {
    return true;
  }

  if (
    name === "MongoPoolClearedError"
    || name === "MongoNetworkError"
    || name === "MongoServerSelectionError"
    || causeName === "MongoNetworkError"
  ) {
    return true;
  }

  if (code === "ECONNRESET" || code === "ETIMEDOUT") {
    return true;
  }

  return (
    message.includes("Connection pool")
    || message.includes("TLS connection")
    || message.includes("ReplicaSetNoPrimary")
    || message.includes("Server selection timed out")
    || message.includes("Client network socket disconnected")
  );
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const withTransientMongoRetry = async <T>(work: () => Promise<T>): Promise<T> => {
  let attempt = 0;
  let lastError: unknown;

  while (attempt < GET_USER_TRANSIENT_RETRY_COUNT) {
    attempt += 1;
    try {
      return await work();
    } catch (error) {
      lastError = error;
      if (!isTransientMongoError(error) || attempt >= GET_USER_TRANSIENT_RETRY_COUNT) {
        throw error;
      }
      await sleep(GET_USER_TRANSIENT_RETRY_DELAY_MS * attempt);
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Unknown getUser failure");
};

export async function POST(request: NextRequest) {
  const body = (await request.json()) as GetUserRequestBody;

  const storecode = normalizeString(body.storecode);
  const targetWalletAddress = normalizeWalletAddress(body.walletAddress);
  const requesterWalletAddress = normalizeWalletAddress(body.requesterWalletAddress) || targetWalletAddress;
  const signature = normalizeString(body.signature);
  const signedAtIso = parseSignedAtOrNull(body.signedAt);
  const signatureProvided = Boolean(signature && signedAtIso);
  const requireSignature = process.env.USER_READ_REQUIRE_SIGNATURE !== "false";
  const ip = getRequestIp(request);

  if (!storecode || !targetWalletAddress) {
    return NextResponse.json(
      {
        result: null,
        error: "Missing required fields",
      },
      { status: 400 }
    );
  }

  const rate = consumeReadRateLimit({
    scope: "getUser",
    ip,
    walletAddress: targetWalletAddress,
  });

  if (!rate.allowed) {
    void logUserReadSecurityEvent({
      route: "/api/user/getUser",
      status: "blocked",
      reason: "rate_limited",
      ip,
      storecode,
      walletAddress: targetWalletAddress,
      requesterWalletAddress: requesterWalletAddress || undefined,
      signatureProvided,
      signatureVerified: false,
      rateLimited: true,
      extra: {
        rateLimitMax: rate.max,
      },
    });

    return NextResponse.json(
      {
        result: null,
        error: "Too many requests",
      },
      { status: 429 }
    );
  }

  let signatureVerified = false;
  if (signature && signedAtIso && requesterWalletAddress && requesterWalletAddress === targetWalletAddress) {
    const signingMessage = buildSelfReadSigningMessage({
      storecode,
      walletAddress: targetWalletAddress,
      signedAtIso,
    });

    signatureVerified = await verifyWalletSignatureWithFallback({
      walletAddress: requesterWalletAddress,
      signature,
      message: signingMessage,
      storecodeHint: storecode,
    });
  }

  if (requireSignature && !signatureVerified) {
    void logUserReadSecurityEvent({
      route: "/api/user/getUser",
      status: "blocked",
      reason: "missing_or_invalid_signature",
      ip,
      storecode,
      walletAddress: targetWalletAddress,
      requesterWalletAddress: requesterWalletAddress || undefined,
      signatureProvided,
      signatureVerified,
      rateLimited: false,
    });

    return NextResponse.json(
      {
        result: null,
        error: "Invalid signature",
      },
      { status: 401 }
    );
  }

  const cacheKey = `${storecode}:${targetWalletAddress}`;
  const routeCache = getRouteCache();
  const cachedEntry = routeCache.get(cacheKey);
  if (cachedEntry && cachedEntry.expiresAt > Date.now()) {
    return NextResponse.json({
      result: cachedEntry.value,
      cached: true,
    });
  }

  try {
    const result = await withTransientMongoRetry(() =>
      withTimeout(
        getOneByWalletAddress(storecode, targetWalletAddress),
        GET_USER_ROUTE_TIMEOUT_MS,
        "getUser timeout",
      ),
    );
    const sanitizedResult = sanitizeUserForResponse(result);

    routeCache.set(cacheKey, {
      value: sanitizedResult,
      expiresAt: Date.now() + GET_USER_ROUTE_CACHE_TTL_MS,
    });

    void logUserReadSecurityEvent({
      route: "/api/user/getUser",
      status: "allowed",
      reason: signatureVerified ? "signed" : "unsigned",
      ip,
      storecode,
      walletAddress: targetWalletAddress,
      requesterWalletAddress: requesterWalletAddress || undefined,
      signatureProvided,
      signatureVerified,
      rateLimited: false,
      extra: {
        found: Boolean(result),
        requireSignature,
      },
    });

    return NextResponse.json({
      result: sanitizedResult,
      cached: false,
    });
  } catch (error) {
    if (cachedEntry) {
      return NextResponse.json({
        result: cachedEntry.value,
        cached: true,
        stale: true,
        error: "stale cache served due to timeout",
      });
    }

    void logUserReadSecurityEvent({
      route: "/api/user/getUser",
      status: "blocked",
      reason: "temporary_db_connectivity_issue",
      ip,
      storecode,
      walletAddress: targetWalletAddress,
      requesterWalletAddress: requesterWalletAddress || undefined,
      signatureProvided,
      signatureVerified,
      rateLimited: false,
      extra: {
        message: error instanceof Error ? error.message : "unknown_error",
      },
    });

    return NextResponse.json(
      {
        result: null,
        error: error instanceof Error ? error.message : "Failed to read user",
      },
      { status: isTransientMongoError(error) ? 503 : 504 },
    );
  }
}
