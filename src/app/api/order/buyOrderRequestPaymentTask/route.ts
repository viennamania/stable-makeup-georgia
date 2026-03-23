import { NextResponse, type NextRequest } from "next/server";

import {
  getAllBuyOrdersForRequestPayment,
  buyOrderRequestPayment,
  updateBuyOrderPayactionResult,
} from "@lib/api/order";
import {
  getStoreByStorecode,
} from "@lib/api/store";

export const runtime = "nodejs";
export const preferredRegion = "icn1";

const globalBuyOrderRequestPaymentTaskState = globalThis as typeof globalThis & {
  __buyOrderRequestPaymentTaskInFlight?: Promise<any>;
  __buyOrderRequestPaymentTaskLastResult?: { expiresAt: number; value: any };
};

const BUYORDER_REQUEST_PAYMENT_TASK_CACHE_TTL_MS = Math.max(
  Number.parseInt(process.env.BUYORDER_REQUEST_PAYMENT_TASK_CACHE_TTL_MS || "", 10) || 10000,
  1000,
);
const BUYORDER_REQUEST_PAYMENT_TASK_MAX_ORDERS_PER_RUN = Math.max(
  Number.parseInt(process.env.BUYORDER_REQUEST_PAYMENT_TASK_MAX_ORDERS_PER_RUN || "", 10) || 25,
  1,
);
const BUYORDER_REQUEST_PAYMENT_TASK_MAX_RUN_MS = Math.max(
  Number.parseInt(process.env.BUYORDER_REQUEST_PAYMENT_TASK_MAX_RUN_MS || "", 10) || 18000,
  3000,
);
const BUYORDER_REQUEST_PAYMENT_TASK_DB_TIMEOUT_MS = Math.max(
  Number.parseInt(process.env.BUYORDER_REQUEST_PAYMENT_TASK_DB_TIMEOUT_MS || "", 10) || 12000,
  1000,
);
const BUYORDER_REQUEST_PAYMENT_TASK_ACCEPTED_DELAY_MS = Math.max(
  Number.parseInt(process.env.BUYORDER_REQUEST_PAYMENT_TASK_ACCEPTED_DELAY_MS || "", 10) || 15000,
  0,
);
const BUYORDER_REQUEST_PAYMENT_TASK_PAYACTION_TIMEOUT_MS = Math.max(
  Number.parseInt(process.env.BUYORDER_REQUEST_PAYMENT_TASK_PAYACTION_TIMEOUT_MS || "", 10) || 10000,
  1000,
);
const BUYORDER_REQUEST_PAYMENT_TASK_TRANSIENT_RETRY_COUNT = Math.max(
  Number.parseInt(process.env.BUYORDER_REQUEST_PAYMENT_TASK_TRANSIENT_RETRY_COUNT || "", 10) || 2,
  1,
);
const BUYORDER_REQUEST_PAYMENT_TASK_TRANSIENT_RETRY_DELAY_MS = Math.max(
  Number.parseInt(process.env.BUYORDER_REQUEST_PAYMENT_TASK_TRANSIENT_RETRY_DELAY_MS || "", 10) || 150,
  50,
);

const normalizeString = (value: unknown) => {
  if (typeof value !== "string") {
    return "";
  }
  return value.trim();
};

const stringifyValue = (value: unknown) => {
  if (value === null || typeof value === "undefined") {
    return "";
  }
  return String(value).trim();
};

const normalizeBoolean = (value: unknown): boolean => {
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "number") {
    return value === 1;
  }
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    return normalized === "true" || normalized === "1" || normalized === "yes";
  }
  return false;
};

const getCachedTaskResult = () => {
  const cached = globalBuyOrderRequestPaymentTaskState.__buyOrderRequestPaymentTaskLastResult;
  if (!cached) {
    return null;
  }
  if (cached.expiresAt <= Date.now()) {
    globalBuyOrderRequestPaymentTaskState.__buyOrderRequestPaymentTaskLastResult = undefined;
    return null;
  }
  return cached.value;
};

const setCachedTaskResult = (value: any) => {
  globalBuyOrderRequestPaymentTaskState.__buyOrderRequestPaymentTaskLastResult = {
    value,
    expiresAt: Date.now() + BUYORDER_REQUEST_PAYMENT_TASK_CACHE_TTL_MS,
  };
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

  while (attempt < BUYORDER_REQUEST_PAYMENT_TASK_TRANSIENT_RETRY_COUNT) {
    attempt += 1;
    try {
      return await work();
    } catch (error) {
      lastError = error;
      if (!isTransientMongoError(error) || attempt >= BUYORDER_REQUEST_PAYMENT_TASK_TRANSIENT_RETRY_COUNT) {
        throw error;
      }
      await sleep(BUYORDER_REQUEST_PAYMENT_TASK_TRANSIENT_RETRY_DELAY_MS * attempt);
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Unknown buyOrderRequestPaymentTask failure");
};

const fetchJsonWithTimeout = async (
  url: string,
  init: RequestInit,
  timeoutMs: number,
) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), Math.max(1000, timeoutMs));
  try {
    const response = await fetch(url, {
      ...init,
      signal: controller.signal,
    });

    let json: any = null;
    try {
      json = await response.json();
    } catch {
      json = null;
    }

    return {
      ok: response.ok,
      status: response.status,
      json,
    };
  } finally {
    clearTimeout(timer);
  }
};

const requestPayaction = async ({
  buyOrder,
  store,
  orderId,
}: {
  buyOrder: any;
  store: any;
  orderId: string;
}) => {
  const payactionApiKey = normalizeString(store?.payactionKey?.payactionApiKey);
  const payactionShopId = normalizeString(store?.payactionKey?.payactionShopId);

  if (payactionApiKey && payactionShopId) {
    const orderNumber = stringifyValue(buyOrder?.tradeId);
    const orderAmount = Number(buyOrder?.krwAmount || 0);
    const orderDate = new Date().toISOString();
    const billingName = normalizeString(buyOrder?.buyer?.depositName);
    const ordererName = billingName;

    let mobile = normalizeString(buyOrder?.mobile);
    if (mobile.startsWith("+82")) {
      mobile = `0${mobile.substring(3)}`;
    } else if (mobile.startsWith("82")) {
      mobile = `0${mobile.substring(2)}`;
    }

    const payactionResponse = await fetchJsonWithTimeout(
      "https://api.payaction.app/order",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": payactionApiKey,
          "x-mall-id": payactionShopId,
        },
        body: JSON.stringify({
          order_number: orderNumber,
          order_amount: orderAmount,
          order_date: orderDate,
          billing_name: billingName,
          orderer_name: ordererName,
          orderer_phone_number: mobile,
          orderer_email: buyOrder?.buyer?.email,
          trade_usage: "지출증빙용",
          identity_number: "",
        }),
      },
      BUYORDER_REQUEST_PAYMENT_TASK_PAYACTION_TIMEOUT_MS,
    );

    if (payactionResponse.json && typeof payactionResponse.json === "object") {
      await withTransientMongoRetry(() =>
        updateBuyOrderPayactionResult({
          orderId,
          api: "/api/order/buyOrderRequestPaymentTask",
          payactionResult: payactionResponse.json,
        }),
      );
    }

    const payactionSuccess = Boolean(
      payactionResponse.ok
      && payactionResponse.status === 200
      && payactionResponse.json
      && payactionResponse.json.status === "success",
    );

    if (!payactionSuccess) {
      console.error("Payaction API error", payactionResponse.status, payactionResponse.json);
      return false;
    }

    return true;
  }

  const fallbackResponse = await fetchJsonWithTimeout(
    "https://dash.bank-oc.com/api/order",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        order_number: stringifyValue(buyOrder?.tradeId),
        order_amount: buyOrder?.krwAmount,
        order_date: new Date().toISOString(),
        billing_name: buyOrder?.buyer?.depositName,
        orderer_name: buyOrder?.buyer?.depositName,
        orderer_phone_number: buyOrder?.mobile,
        orderer_email: buyOrder?.email || "abc@gmail.com",
        trade_usage: "지출증빙용",
        identity_number: buyOrder?.mobile,
        auto_confirm: 0,
      }),
    },
    BUYORDER_REQUEST_PAYMENT_TASK_PAYACTION_TIMEOUT_MS,
  );

  if (fallbackResponse.json && typeof fallbackResponse.json === "object") {
    await withTransientMongoRetry(() =>
      updateBuyOrderPayactionResult({
        orderId,
        api: "/api/order/buyOrderRequestPayment",
        payactionResult: fallbackResponse.json,
      }),
    );
  }

  if (!fallbackResponse.ok || fallbackResponse.json?.status !== "success") {
    console.error("Fallback Payaction API warning", fallbackResponse.status, fallbackResponse.json);
  }

  // Preserve legacy behavior: fallback branch still continues buyOrderRequestPayment.
  return true;
};

const runTask = async () => {
  const startedAt = Date.now();
  const processedTradeIds: string[] = [];
  const skippedTradeIds: string[] = [];
  const storeCache = new Map<string, any | null>();

  const buyordersResult = await withTransientMongoRetry(() =>
    withTimeout(
      getAllBuyOrdersForRequestPayment({
        limit: BUYORDER_REQUEST_PAYMENT_TASK_MAX_ORDERS_PER_RUN,
        page: 1,
        acceptedBefore: new Date(Date.now() - BUYORDER_REQUEST_PAYMENT_TASK_ACCEPTED_DELAY_MS).toISOString(),
      }),
      BUYORDER_REQUEST_PAYMENT_TASK_DB_TIMEOUT_MS,
      "buyOrderRequestPaymentTask queue read timeout",
    ),
  );
  const buyOrders = Array.isArray(buyordersResult?.orders) ? buyordersResult.orders : [];

  for (const buyOrder of buyOrders) {
    if (Date.now() - startedAt >= BUYORDER_REQUEST_PAYMENT_TASK_MAX_RUN_MS) {
      console.error("buyOrderRequestPaymentTask reached max run window; stop early");
      break;
    }

    const tradeId = stringifyValue(buyOrder?.tradeId);
    const storecode = normalizeString(buyOrder?.storecode);
    const orderId = stringifyValue(buyOrder?._id);

    if (!storecode || !orderId) {
      if (tradeId) {
        skippedTradeIds.push(tradeId);
      }
      continue;
    }

    let store: any | null | undefined = storeCache.get(storecode);
    if (typeof store === "undefined") {
      store = await withTransientMongoRetry(() =>
        withTimeout(
          getStoreByStorecode({ storecode }),
          BUYORDER_REQUEST_PAYMENT_TASK_DB_TIMEOUT_MS,
          "buyOrderRequestPaymentTask store lookup timeout",
        ),
      );
      storeCache.set(storecode, store || null);
    }

    if (!store) {
      if (tradeId) {
        skippedTradeIds.push(tradeId);
      }
      continue;
    }

    const transactionHash = "0x";
    const isPrivateSale = normalizeBoolean(buyOrder?.privateSale);

    if (isPrivateSale) {
      await withTransientMongoRetry(() =>
        withTimeout(
          buyOrderRequestPayment({
            orderId,
            transactionHash,
            bankInfo: {
              bankName: store?.withdrawalBankInfo?.bankName,
              accountNumber: store?.withdrawalBankInfo?.accountNumber,
              accountHolder: store?.withdrawalBankInfo?.accountHolder,
              amount: buyOrder?.krwAmount,
            },
          }),
          BUYORDER_REQUEST_PAYMENT_TASK_DB_TIMEOUT_MS,
          "buyOrderRequestPaymentTask privateSale requestPayment timeout",
        ),
      );

      if (tradeId) {
        processedTradeIds.push(tradeId);
      }
      continue;
    }

    const payactionReady = await requestPayaction({
      buyOrder,
      store,
      orderId,
    });
    if (!payactionReady) {
      if (tradeId) {
        skippedTradeIds.push(tradeId);
      }
      continue;
    }

    await withTransientMongoRetry(() =>
      withTimeout(
        buyOrderRequestPayment({
          orderId,
          transactionHash,
        }),
        BUYORDER_REQUEST_PAYMENT_TASK_DB_TIMEOUT_MS,
        "buyOrderRequestPaymentTask requestPayment timeout",
      ),
    );

    if (tradeId) {
      processedTradeIds.push(tradeId);
    }
  }

  const result = {
    processedTradeIds,
    skippedTradeIds,
    processedCount: processedTradeIds.length,
    skippedCount: skippedTradeIds.length,
    queueTotalCount: Number(buyordersResult?.totalCount || 0),
    fetchedOrders: buyOrders.length,
    elapsedMs: Date.now() - startedAt,
  };

  setCachedTaskResult(result);
  return result;
};

export async function POST(request: NextRequest) {
  let body: Record<string, unknown> = {};
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    body = {};
  }

  const forceRun = normalizeBoolean(body.force);
  const cached = getCachedTaskResult();
  if (!forceRun && cached) {
    return NextResponse.json({
      result: Array.isArray(cached?.processedTradeIds) ? cached.processedTradeIds : [],
      meta: cached,
      cached: true,
    });
  }

  const inFlight = globalBuyOrderRequestPaymentTaskState.__buyOrderRequestPaymentTaskInFlight;
  if (!forceRun && inFlight) {
    const result = await inFlight;
    return NextResponse.json({
      result: Array.isArray(result?.processedTradeIds) ? result.processedTradeIds : [],
      meta: result,
      inFlight: true,
    });
  }

  const job = runTask().finally(() => {
    globalBuyOrderRequestPaymentTaskState.__buyOrderRequestPaymentTaskInFlight = undefined;
  });
  globalBuyOrderRequestPaymentTaskState.__buyOrderRequestPaymentTaskInFlight = job;

  try {
    const result = await job;
    return NextResponse.json({
      result: Array.isArray(result?.processedTradeIds) ? result.processedTradeIds : [],
      meta: result,
      cached: false,
    });
  } catch (error) {
    const fallback = getCachedTaskResult();
    if (fallback) {
      return NextResponse.json({
        result: Array.isArray(fallback?.processedTradeIds) ? fallback.processedTradeIds : [],
        meta: fallback,
        cached: true,
        stale: true,
        error: "stale cache served due to timeout",
      });
    }

    return NextResponse.json(
      {
        result: [],
        meta: {
          processedTradeIds: [],
          skippedTradeIds: [],
          processedCount: 0,
          skippedCount: 0,
          queueTotalCount: 0,
          fetchedOrders: 0,
          elapsedMs: 0,
        },
        error: error instanceof Error ? error.message : "Failed to run buyOrderRequestPaymentTask",
      },
      { status: isTransientMongoError(error) ? 503 : 500 },
    );
  }
}
