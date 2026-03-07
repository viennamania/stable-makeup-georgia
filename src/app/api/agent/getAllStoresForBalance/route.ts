import { NextResponse, type NextRequest } from "next/server";

import {
  getAllStoresForBalanceInquiry,
} from "@lib/api/agent";

import {
  createThirdwebClient,
  getContract,
} from "thirdweb";
import {
  ethereum,
  polygon,
  arbitrum,
  bsc,
} from "thirdweb/chains";
import {
  balanceOf,
} from "thirdweb/extensions/erc20";
import {
  chain,
  ethereumContractAddressUSDT,
  polygonContractAddressUSDT,
  arbitrumContractAddressUSDT,
  bscContractAddressUSDT,
  bscContractAddressMKRW,
} from "@/app/config/contractAddresses";

export const runtime = "nodejs";
export const preferredRegion = "icn1";

const globalAgentStoreBalanceRouteState = globalThis as typeof globalThis & {
  __agentStoreBalanceRouteCache?: Map<string, { expiresAt: number; value: any }>;
  __agentStoreBalanceRouteInFlight?: Map<string, Promise<any>>;
};

const AGENT_STORE_BALANCE_ROUTE_CACHE_TTL_MS = Math.max(
  Number.parseInt(process.env.AGENT_STORE_BALANCE_ROUTE_CACHE_TTL_MS || "", 10) || 12000,
  1000,
);
const AGENT_STORE_BALANCE_ROUTE_TIMEOUT_MS = Math.max(
  Number.parseInt(process.env.AGENT_STORE_BALANCE_ROUTE_TIMEOUT_MS || "", 10) || 20000,
  2000,
);
const AGENT_STORE_BALANCE_ONCHAIN_CONCURRENCY = Math.min(
  Math.max(
    Number.parseInt(process.env.AGENT_STORE_BALANCE_ONCHAIN_CONCURRENCY || "", 10) || 6,
    1,
  ),
  20,
);
const AGENT_STORE_BALANCE_TRANSIENT_RETRY_COUNT = Math.max(
  Number.parseInt(process.env.AGENT_STORE_BALANCE_TRANSIENT_RETRY_COUNT || "", 10) || 2,
  1,
);
const AGENT_STORE_BALANCE_TRANSIENT_RETRY_DELAY_MS = Math.max(
  Number.parseInt(process.env.AGENT_STORE_BALANCE_TRANSIENT_RETRY_DELAY_MS || "", 10) || 200,
  50,
);

const normalizeString = (value: unknown) => {
  if (typeof value !== "string") {
    return "";
  }
  return value.trim();
};

const getRouteCache = () => {
  if (!globalAgentStoreBalanceRouteState.__agentStoreBalanceRouteCache) {
    globalAgentStoreBalanceRouteState.__agentStoreBalanceRouteCache = new Map();
  }
  return globalAgentStoreBalanceRouteState.__agentStoreBalanceRouteCache;
};

const getInFlightMap = () => {
  if (!globalAgentStoreBalanceRouteState.__agentStoreBalanceRouteInFlight) {
    globalAgentStoreBalanceRouteState.__agentStoreBalanceRouteInFlight = new Map();
  }
  return globalAgentStoreBalanceRouteState.__agentStoreBalanceRouteInFlight;
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
      new Promise<T>((_resolve, reject) => {
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
    || name === "MongoWaitQueueTimeoutError"
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
    || message.includes("Server selection timed out")
    || message.includes("Timed out while checking out a connection from connection pool")
    || message.includes("Client network socket disconnected")
  );
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const withTransientMongoRetry = async <T>(work: () => Promise<T>): Promise<T> => {
  let attempt = 0;
  let lastError: unknown;

  while (attempt < AGENT_STORE_BALANCE_TRANSIENT_RETRY_COUNT) {
    attempt += 1;
    try {
      return await work();
    } catch (error) {
      lastError = error;
      if (!isTransientMongoError(error) || attempt >= AGENT_STORE_BALANCE_TRANSIENT_RETRY_COUNT) {
        throw error;
      }
      await sleep(AGENT_STORE_BALANCE_TRANSIENT_RETRY_DELAY_MS * attempt);
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Unknown getAllStoresForBalance (agent) failure");
};

const getUsdtContract = () => {
  const client = createThirdwebClient({
    secretKey: process.env.THIRDWEB_SECRET_KEY || "",
  });

  return getContract({
    client,
    chain: chain === "ethereum"
      ? ethereum
      : chain === "polygon"
        ? polygon
        : chain === "arbitrum"
          ? arbitrum
          : chain === "bsc"
            ? bsc
            : bsc,
    address: chain === "ethereum"
      ? ethereumContractAddressUSDT
      : chain === "polygon"
        ? polygonContractAddressUSDT
        : chain === "arbitrum"
          ? arbitrumContractAddressUSDT
          : chain === "bsc"
            ? bscContractAddressUSDT
            : bscContractAddressMKRW,
  });
};

const enrichStoresWithCurrentBalance = async (stores: any[]) => {
  if (!Array.isArray(stores) || stores.length === 0) {
    return;
  }

  const contract = getUsdtContract();
  const decimalDivisor = chain === "bsc" ? 10 ** 18 : 10 ** 6;
  let cursor = 0;

  const workers = Array.from(
    { length: Math.min(AGENT_STORE_BALANCE_ONCHAIN_CONCURRENCY, stores.length) },
    async () => {
      while (true) {
        const index = cursor;
        cursor += 1;
        if (index >= stores.length) {
          return;
        }

        const store = stores[index];
        const settlementWalletAddress = normalizeString(store?.settlementWalletAddress);
        if (!settlementWalletAddress) {
          store.currentUsdtBalance = 0;
          continue;
        }

        try {
          const tokenBalance = await balanceOf({
            contract,
            address: settlementWalletAddress,
          });
          store.currentUsdtBalance = Number(tokenBalance) / decimalDivisor;
        } catch (error) {
          console.error(
            `Error getting balance for store ${store?.storeName || ""} (${settlementWalletAddress}):`,
            error,
          );
          store.currentUsdtBalance = 0;
        }
      }
    },
  );

  await Promise.all(workers);
};

export async function POST(request: NextRequest) {
  let body: Record<string, unknown> = {};
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    body = {};
  }

  const safeAgentcode = normalizeString(body.agentcode);
  const cacheKey = safeAgentcode.toLowerCase() || "__all__";

  const routeCache = getRouteCache();
  const cachedEntry = routeCache.get(cacheKey);
  if (cachedEntry && cachedEntry.expiresAt > Date.now()) {
    return NextResponse.json({
      result: cachedEntry.value,
      cached: true,
    });
  }

  try {
    const inFlight = getInFlightMap();
    const pending = inFlight.get(cacheKey);
    const job = pending
      ? pending
      : (async () => {
          const result = await withTransientMongoRetry(() =>
            withTimeout(
              getAllStoresForBalanceInquiry({
                agentcode: safeAgentcode,
              }),
              AGENT_STORE_BALANCE_ROUTE_TIMEOUT_MS,
              "getAllStoresForBalance agent inquiry timeout",
            ),
          );

          const stores = Array.isArray(result?.stores) ? result.stores : [];
          await enrichStoresWithCurrentBalance(stores);

          stores.sort(
            (a: { currentUsdtBalance?: number }, b: { currentUsdtBalance?: number }) =>
              (b.currentUsdtBalance || 0) - (a.currentUsdtBalance || 0),
          );

          const totalCurrentUsdtBalance = stores.reduce((sum: number, store: any) => {
            return sum + Number(store?.currentUsdtBalance || 0);
          }, 0);

          return {
            ...result,
            stores,
            totalCurrentUsdtBalance,
          };
        })().finally(() => {
          inFlight.delete(cacheKey);
        });

    if (!pending) {
      inFlight.set(cacheKey, job);
    }

    const result = await job;
    routeCache.set(cacheKey, {
      value: result,
      expiresAt: Date.now() + AGENT_STORE_BALANCE_ROUTE_CACHE_TTL_MS,
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
          stores: [],
          totalCurrentUsdtBalance: 0,
        },
        error: error instanceof Error ? error.message : "Failed to fetch agent stores for balance",
      },
      { status: isTransientMongoError(error) ? 503 : 504 },
    );
  }
}
