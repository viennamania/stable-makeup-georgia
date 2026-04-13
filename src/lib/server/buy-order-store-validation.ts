import { getStoreByStorecode } from "@lib/api/store";

type BuyOrderStoreValidationFailureReason = "invalid_storecode" | "store_live_off";
type BuyOrderStoreAmountValidationFailureReason =
  | "invalid_amount"
  | "amount_exceeds_store_limit";

export const DEFAULT_STORE_MAX_PAYMENT_AMOUNT_KRW = 3_000_000;

export type BuyOrderStoreValidationResult =
  | {
      ok: true;
      store: any;
      storecode: string;
    }
  | {
      ok: false;
      status: 400 | 403;
      reason: BuyOrderStoreValidationFailureReason;
      error: string;
      storecode: string | null;
    };

export type BuyOrderStoreAmountValidationResult =
  | {
      ok: true;
      krwAmount: number;
      maxPaymentAmountKRW: number;
    }
  | {
      ok: false;
      status: 400;
      reason: BuyOrderStoreAmountValidationFailureReason;
      error: string;
      maxPaymentAmountKRW?: number;
    };

const normalizeStorecode = (value: unknown): string => {
  if (typeof value !== "string") {
    return "";
  }
  return value.trim();
};

export const normalizePositiveNumber = (value: unknown): number | null => {
  const normalized = Number(value);
  if (!Number.isFinite(normalized) || normalized <= 0) {
    return null;
  }

  return normalized;
};

export const resolveStoreMaxPaymentAmountKRW = (store: any): number => {
  const configuredLimit = Number(store?.maxPaymentAmountKRW);
  if (!Number.isFinite(configuredLimit) || configuredLimit <= 0) {
    return DEFAULT_STORE_MAX_PAYMENT_AMOUNT_KRW;
  }

  return configuredLimit;
};

export function validateBuyOrderStorePaymentAmount({
  store,
  krwAmountRaw,
}: {
  store: any;
  krwAmountRaw: unknown;
}): BuyOrderStoreAmountValidationResult {
  const krwAmount = normalizePositiveNumber(krwAmountRaw);
  if (!krwAmount) {
    return {
      ok: false,
      status: 400,
      reason: "invalid_amount",
      error: "Invalid krwAmount",
    };
  }

  const maxPaymentAmountKRW = resolveStoreMaxPaymentAmountKRW(store);
  if (krwAmount > maxPaymentAmountKRW) {
    return {
      ok: false,
      status: 400,
      reason: "amount_exceeds_store_limit",
      error: `결제 상한 금액은 ${maxPaymentAmountKRW.toLocaleString()} KRW 입니다.`,
      maxPaymentAmountKRW,
    };
  }

  return {
    ok: true,
    krwAmount,
    maxPaymentAmountKRW,
  };
}

export async function validateBuyOrderStoreAvailability(
  storecodeRaw: unknown,
): Promise<BuyOrderStoreValidationResult> {
  const storecode = normalizeStorecode(storecodeRaw);
  if (!storecode) {
    return {
      ok: false,
      status: 400,
      reason: "invalid_storecode",
      error: "Invalid storecode",
      storecode: null,
    };
  }

  const store = await getStoreByStorecode({ storecode });
  if (!store) {
    return {
      ok: false,
      status: 400,
      reason: "invalid_storecode",
      error: "Invalid storecode",
      storecode,
    };
  }

  if (store.liveOnAndOff === false) {
    return {
      ok: false,
      status: 403,
      reason: "store_live_off",
      error: `가맹점코드:${storecode} 현재 운영중지 상태`,
      storecode,
    };
  }

  return {
    ok: true,
    store,
    storecode,
  };
}
