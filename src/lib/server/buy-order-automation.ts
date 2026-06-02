import { ObjectId } from "mongodb";

import {
  acceptBuyOrder,
  buyOrderRequestPayment,
  cancelTradeBySeller,
} from "@lib/api/order";
import { getStoreByStorecode } from "@lib/api/store";
import { getOneByWalletAddress } from "@lib/api/user";
import clientPromise, { dbName } from "@/lib/mongodb";
import { requestPayactionForBuyOrder } from "@/lib/server/buy-order-payaction";

type AutomationStepResult = {
  status: "accepted" | "requested" | "skipped" | "cancelled" | "failed";
  reason?: string;
  tradeId?: string;
};

type BuyOrderAutomationResult = {
  orderId: string;
  accept: AutomationStepResult;
  requestPayment: AutomationStepResult;
};

const normalizeString = (value: unknown): string => {
  if (typeof value === "string") {
    return value.trim();
  }

  if (typeof value === "number" || typeof value === "bigint") {
    return String(value).trim();
  }

  return "";
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

const toObjectId = (orderId: unknown): ObjectId | null => {
  const normalizedOrderId = normalizeString(orderId);
  if (!normalizedOrderId || !ObjectId.isValid(normalizedOrderId)) {
    return null;
  }

  return new ObjectId(normalizedOrderId);
};

const formatSellerMemo = (bankInfo: any): string => {
  return [
    normalizeString(bankInfo?.bankName),
    normalizeString(bankInfo?.accountNumber),
    normalizeString(bankInfo?.accountHolder),
  ].filter(Boolean).join(" ");
};

const getBuyOrderById = async (orderId: unknown) => {
  const objectId = toObjectId(orderId);
  if (!objectId) {
    return null;
  }

  const client = await clientPromise;
  return client.db(dbName).collection("buyorders").findOne<any>({
    _id: objectId,
  });
};

const resolveSellerForAutoAccept = async (buyOrder: any) => {
  const storecode = normalizeString(buyOrder?.storecode);
  if (!storecode) {
    return {
      ok: false,
      reason: "missing_storecode",
    };
  }

  const store = await getStoreByStorecode({ storecode });
  if (!store) {
    return {
      ok: false,
      reason: "store_not_found",
    };
  }

  const isPrivateSale = normalizeBoolean(buyOrder?.privateSale);
  const sellerStorecode = isPrivateSale ? storecode : "admin";
  const sellerWalletAddress = isPrivateSale
    ? normalizeString(
        store?.privateSellerWalletAddress
        || store?.settlementWalletAddress
        || store?.adminWalletAddress,
      )
    : normalizeString(store?.sellerWalletAddress);

  if (!sellerWalletAddress) {
    return {
      ok: false,
      reason: "missing_seller_wallet_address",
      storecode,
      sellerStorecode,
    };
  }

  const userSeller = await getOneByWalletAddress(
    sellerStorecode,
    sellerWalletAddress,
  );

  if (!userSeller) {
    return {
      ok: false,
      reason: "seller_user_not_found",
      storecode,
      sellerStorecode,
      sellerWalletAddress,
    };
  }

  return {
    ok: true,
    storecode,
    sellerStorecode,
    sellerWalletAddress,
    sellerMemo: formatSellerMemo(userSeller?.seller?.bankInfo),
    signerAddress: normalizeString(userSeller?.signerAddress),
  };
};

export async function autoAcceptBuyOrderById(orderId: unknown): Promise<AutomationStepResult> {
  const buyOrder = await getBuyOrderById(orderId);
  const tradeId = normalizeString(buyOrder?.tradeId);

  if (!buyOrder) {
    return {
      status: "skipped",
      reason: "order_not_found",
    };
  }

  if (normalizeString(buyOrder?.status) !== "ordered") {
    return {
      status: "skipped",
      reason: `status_${normalizeString(buyOrder?.status) || "unknown"}`,
      tradeId,
    };
  }

  const seller = await resolveSellerForAutoAccept(buyOrder);
  if (!seller.ok) {
    if (seller.reason === "seller_user_not_found" && seller.storecode && seller.sellerWalletAddress) {
      await cancelTradeBySeller({
        storecode: seller.sellerStorecode || seller.storecode,
        orderId: buyOrder._id,
        walletAddress: seller.sellerWalletAddress,
        cancelTradeReason: "등록된 판매자 정보가 없습니다.",
      });

      return {
        status: "cancelled",
        reason: seller.reason,
        tradeId,
      };
    }

    return {
      status: "skipped",
      reason: seller.reason,
      tradeId,
    };
  }

  const result = await acceptBuyOrder({
    storecode: seller.storecode,
    orderId: buyOrder._id,
    sellerWalletAddress: seller.sellerWalletAddress,
    signerAddress: seller.signerAddress,
    sellerStorecode: seller.sellerStorecode,
    sellerMemo: seller.sellerMemo,
  });

  return {
    status: result ? "accepted" : "skipped",
    reason: result ? undefined : "accept_update_not_modified",
    tradeId,
  };
}

export async function autoRequestPaymentById(orderId: unknown): Promise<AutomationStepResult> {
  const normalizedOrderId = normalizeString(orderId);
  const buyOrder = await getBuyOrderById(normalizedOrderId);
  const tradeId = normalizeString(buyOrder?.tradeId);

  if (!buyOrder) {
    return {
      status: "skipped",
      reason: "order_not_found",
    };
  }

  const status = normalizeString(buyOrder?.status);
  if (status !== "accepted") {
    return {
      status: "skipped",
      reason: `status_${status || "unknown"}`,
      tradeId,
    };
  }

  if (!normalizeString(buyOrder?.buyer?.depositName)) {
    return {
      status: "skipped",
      reason: "missing_buyer_deposit_name",
      tradeId,
    };
  }

  const storecode = normalizeString(buyOrder?.storecode);
  if (!storecode) {
    return {
      status: "skipped",
      reason: "missing_storecode",
      tradeId,
    };
  }

  const store = await getStoreByStorecode({ storecode });
  if (!store) {
    return {
      status: "skipped",
      reason: "store_not_found",
      tradeId,
    };
  }

  const transactionHash = "0x";
  const isPrivateSale = normalizeBoolean(buyOrder?.privateSale);
  if (!isPrivateSale) {
    const payactionReady = await requestPayactionForBuyOrder({
      buyOrder,
      store,
      orderId: normalizedOrderId,
      api: "buy-order-inline-automation",
    });

    if (!payactionReady) {
      return {
        status: "skipped",
        reason: "payaction_request_failed",
        tradeId,
      };
    }
  }

  const result = await buyOrderRequestPayment(
    isPrivateSale
      ? {
          orderId: buyOrder._id,
          transactionHash,
          bankInfo: {
            bankName: store?.withdrawalBankInfo?.bankName,
            accountNumber: store?.withdrawalBankInfo?.accountNumber,
            accountHolder: store?.withdrawalBankInfo?.accountHolder,
            amount: buyOrder?.krwAmount,
          },
        }
      : {
          orderId: buyOrder._id,
          transactionHash,
        },
  );

  return {
    status: result ? "requested" : "skipped",
    reason: result ? undefined : "request_payment_update_not_modified",
    tradeId,
  };
}

export async function runBuyOrderAutomationForOrderId(
  orderId: unknown,
): Promise<BuyOrderAutomationResult> {
  const normalizedOrderId = normalizeString(orderId);
  const accept = await autoAcceptBuyOrderById(normalizedOrderId);
  const requestPayment = await autoRequestPaymentById(normalizedOrderId);

  return {
    orderId: normalizedOrderId,
    accept,
    requestPayment,
  };
}

export async function runBuyOrderAutomationAfterCreate({
  orderId,
  source,
}: {
  orderId: unknown;
  source: string;
}): Promise<BuyOrderAutomationResult | null> {
  if (normalizeBoolean(process.env.BUY_ORDER_INLINE_TASKS_DISABLED)) {
    return null;
  }

  try {
    const result = await runBuyOrderAutomationForOrderId(orderId);
    console.log("buyOrder inline automation result", JSON.stringify({
      source,
      ...result,
    }));
    return result;
  } catch (error) {
    console.error("buyOrder inline automation failed", JSON.stringify({
      source,
      orderId: normalizeString(orderId),
      error: error instanceof Error ? error.message : String(error),
    }));
    return null;
  }
}
