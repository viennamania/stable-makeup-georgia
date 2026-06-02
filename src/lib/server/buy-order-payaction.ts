import {
  updateBuyOrderPayactionResult,
} from "@lib/api/order";

const BUYORDER_REQUEST_PAYMENT_TASK_PAYACTION_TIMEOUT_MS = Math.max(
  Number.parseInt(process.env.BUYORDER_REQUEST_PAYMENT_TASK_PAYACTION_TIMEOUT_MS || "", 10) || 10000,
  1000,
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

export const isBuyOrderPayactionEnabled = () => {
  const configuredValue = process.env.BUYORDER_REQUEST_PAYMENT_TASK_PAYACTION_ENABLED;
  if (typeof configuredValue === "undefined" || String(configuredValue).trim() === "") {
    return true;
  }
  return normalizeBoolean(configuredValue);
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

export const requestPayactionForBuyOrder = async ({
  buyOrder,
  store,
  orderId,
  api,
}: {
  buyOrder: any;
  store: any;
  orderId: string;
  api: string;
}) => {
  if (!isBuyOrderPayactionEnabled()) {
    return true;
  }

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
      await updateBuyOrderPayactionResult({
        orderId,
        api,
        payactionResult: payactionResponse.json,
      });
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
    await updateBuyOrderPayactionResult({
      orderId,
      api: "/api/order/buyOrderRequestPayment",
      payactionResult: fallbackResponse.json,
    });
  }

  if (!fallbackResponse.ok || fallbackResponse.json?.status !== "success") {
    console.error("Fallback Payaction API warning", fallbackResponse.status, fallbackResponse.json);
  }

  // Preserve legacy behavior: fallback branch still continues buyOrderRequestPayment.
  return true;
};
