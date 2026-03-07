import { NextResponse, type NextRequest } from "next/server";

import { getBankTransfers } from '@lib/api/bankTransfer';

export const runtime = "nodejs";
export const preferredRegion = "icn1";

const globalBankTransferGetAllRouteCache = globalThis as typeof globalThis & {
  __bankTransferGetAllRouteCache?: Map<string, { expiresAt: number; value: any }>;
};

const BANK_TRANSFER_GET_ALL_ROUTE_CACHE_TTL_MS = Number.parseInt(
  process.env.BANK_TRANSFER_GET_ALL_ROUTE_CACHE_TTL_MS || "",
  10,
) > 0
  ? Number.parseInt(process.env.BANK_TRANSFER_GET_ALL_ROUTE_CACHE_TTL_MS || "", 10)
  : 5000;
const BANK_TRANSFER_GET_ALL_ROUTE_TIMEOUT_MS = Number.parseInt(
  process.env.BANK_TRANSFER_GET_ALL_ROUTE_TIMEOUT_MS || "",
  10,
) > 0
  ? Number.parseInt(process.env.BANK_TRANSFER_GET_ALL_ROUTE_TIMEOUT_MS || "", 10)
  : 12000;
const BANK_TRANSFER_GET_ALL_DEFAULT_LIMIT = Number.parseInt(
  process.env.BANK_TRANSFER_GET_ALL_DEFAULT_LIMIT || "",
  10,
) > 0
  ? Number.parseInt(process.env.BANK_TRANSFER_GET_ALL_DEFAULT_LIMIT || "", 10)
  : 20;
const BANK_TRANSFER_GET_ALL_MAX_LIMIT = Number.parseInt(
  process.env.BANK_TRANSFER_GET_ALL_MAX_LIMIT || "",
  10,
) > 0
  ? Number.parseInt(process.env.BANK_TRANSFER_GET_ALL_MAX_LIMIT || "", 10)
  : 300;
const BANK_TRANSFER_GET_ALL_TRANSIENT_RETRY_COUNT = Math.max(
  Number.parseInt(process.env.BANK_TRANSFER_GET_ALL_TRANSIENT_RETRY_COUNT || "", 10) || 2,
  1,
);
const BANK_TRANSFER_GET_ALL_TRANSIENT_RETRY_DELAY_MS = Math.max(
  Number.parseInt(process.env.BANK_TRANSFER_GET_ALL_TRANSIENT_RETRY_DELAY_MS || "", 10) || 200,
  50,
);

const normalizeString = (value: unknown) => {
  if (typeof value !== "string") {
    return "";
  }
  return value.trim();
};

const parsePositiveInt = (value: unknown, fallback: number) => {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return Math.trunc(value);
  }
  const parsed = Number.parseInt(String(value ?? "").trim(), 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return parsed;
};

const getRouteCache = () => {
  if (!globalBankTransferGetAllRouteCache.__bankTransferGetAllRouteCache) {
    globalBankTransferGetAllRouteCache.__bankTransferGetAllRouteCache = new Map();
  }
  return globalBankTransferGetAllRouteCache.__bankTransferGetAllRouteCache;
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
    name === "MongoPoolClearedError" ||
    name === "MongoNetworkError" ||
    name === "MongoServerSelectionError" ||
    causeName === "MongoNetworkError"
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

  while (attempt < BANK_TRANSFER_GET_ALL_TRANSIENT_RETRY_COUNT) {
    attempt += 1;
    try {
      return await work();
    } catch (error) {
      lastError = error;
      if (!isTransientMongoError(error) || attempt >= BANK_TRANSFER_GET_ALL_TRANSIENT_RETRY_COUNT) {
        throw error;
      }
      await sleep(BANK_TRANSFER_GET_ALL_TRANSIENT_RETRY_DELAY_MS * attempt);
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Unknown bankTransfer getAll failure");
};

export async function POST(request: NextRequest) {
  let body: Record<string, unknown> = {};
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    body = {};
  }

  const safeLimit = Math.min(
    Math.max(1, parsePositiveInt(body.limit, BANK_TRANSFER_GET_ALL_DEFAULT_LIMIT)),
    Math.max(1, BANK_TRANSFER_GET_ALL_MAX_LIMIT),
  );
  const safePage = Math.max(1, parsePositiveInt(body.page, 1));
  const safeSearch = normalizeString(body.search);
  const safeTransactionType = normalizeString(body.transactionType);
  const safeMatchStatus = normalizeString(body.matchStatus);
  const safeFromDate = normalizeString(body.fromDate);
  const safeToDate = normalizeString(body.toDate);
  const safeAccountNumber = normalizeString(body.accountNumber);
  const safeOriginalAccountNumber = normalizeString(body.originalAccountNumber);
  const safeStorecode = normalizeString(body.storecode);

  const query = {
    limit: safeLimit,
    page: safePage,
    search: safeSearch,
    transactionType: safeTransactionType,
    matchStatus: safeMatchStatus,
    fromDate: safeFromDate,
    toDate: safeToDate,
    accountNumber: safeAccountNumber,
    originalAccountNumber: safeOriginalAccountNumber,
    storecode: safeStorecode,
  };

  const cacheKey = JSON.stringify(query);
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
        getBankTransfers(query),
        BANK_TRANSFER_GET_ALL_ROUTE_TIMEOUT_MS,
        "bankTransfer getAll timeout",
      ),
    );

    routeCache.set(cacheKey, {
      value: result,
      expiresAt: Date.now() + BANK_TRANSFER_GET_ALL_ROUTE_CACHE_TTL_MS,
    });

    return NextResponse.json({
      result,
      cached: false,
    });
  } catch (error) {
    if (cachedEntry?.value) {
      return NextResponse.json({
        result: cachedEntry.value,
        cached: true,
        stale: true,
        error: "stale cache served due to timeout",
      });
    }

    return NextResponse.json(
      {
        result: {
          totalCount: 0,
          totalAmount: 0,
          totalManualCount: 0,
          totalAutoCount: 0,
          transfers: [],
        },
        error: error instanceof Error ? error.message : "Failed to read bank transfers",
      },
      { status: isTransientMongoError(error) ? 503 : 504 },
    );
  }
}
