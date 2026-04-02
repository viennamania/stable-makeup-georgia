import { getStoreByStorecode } from "@lib/api/store";

type BuyOrderStoreValidationFailureReason = "invalid_storecode" | "store_live_off";

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

const normalizeStorecode = (value: unknown): string => {
  if (typeof value !== "string") {
    return "";
  }
  return value.trim();
};

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
