import { NextResponse, type NextRequest } from "next/server";

import { chain } from "@/app/config/contractAddresses";
import { insertAdminApiCallLog } from "@/lib/api/adminApiCallLog";
import {
  getBlockingBuyOrderByStorecodeAndWalletAddress,
  insertBuyOrderForClearance,
} from "@lib/api/order";
import { getStoreByStorecode } from "@lib/api/store";
import { getOneByWalletAddress } from "@lib/api/user";
import { verifyAdminSignedAction } from "@/lib/server/admin-action-security";
import {
  getConfiguredClearanceRequesterWallets,
  getConfiguredClearanceSettlementWalletAddress,
  isConfiguredClearanceRequesterWallet,
  resolveConfiguredClearanceBuyer,
  resolveConfiguredClearanceSellerBankInfo,
} from "@/lib/server/clearance-order-security";
import {
  getRequestCountry,
  getRequestIp,
  normalizeWalletAddress,
} from "@/lib/server/user-read-security";

const ROUTE = "/api/order/setBuyOrderForClearance";
const SET_BUY_ORDER_FOR_CLEARANCE_SIGNING_PREFIX = "stable-georgia:set-buy-order-for-clearance:v1";

type SetBuyOrderForClearanceRequestBody = {
  storecode?: unknown;
  walletAddress?: unknown;
  requesterStorecode?: unknown;
  requesterWalletAddress?: unknown;
  signature?: unknown;
  signedAt?: unknown;
  nonce?: unknown;
  sellerBankInfo?: unknown;
  usdtAmount?: unknown;
  krwAmount?: unknown;
  rate?: unknown;
  privateSale?: unknown;
  buyer?: unknown;
};

const normalizeString = (value: unknown): string => {
  if (typeof value !== "string") {
    return "";
  }
  return value.trim();
};

const normalizeOptionalString = (value: unknown): string | null => {
  const normalized = normalizeString(value);
  return normalized || null;
};

const normalizePositiveNumber = (value: unknown): number | null => {
  const normalized = Number(value);
  if (!Number.isFinite(normalized) || normalized <= 0) {
    return null;
  }
  return normalized;
};

const normalizeBoolean = (value: unknown): boolean => {
  if (typeof value === "boolean") {
    return value;
  }
  const normalized = normalizeString(value).toLowerCase();
  return normalized === "true" || normalized === "1" || normalized === "yes";
};

const buildRedactedRequestBody = ({
  storecode,
  walletAddress,
  usdtAmount,
  krwAmount,
  rate,
  privateSale,
  sellerBankInfo,
  buyer,
}: {
  storecode: string;
  walletAddress: string;
  usdtAmount: number | null;
  krwAmount: number | null;
  rate: number | null;
  privateSale: boolean;
  sellerBankInfo: unknown;
  buyer: unknown;
}) => {
  const buyerValue =
    buyer && typeof buyer === "object" ? (buyer as Record<string, unknown>) : null;

  return {
    storecode,
    walletAddress,
    usdtAmount,
    krwAmount,
    rate,
    privateSale,
    sellerBankInfoProvided: Boolean(sellerBankInfo),
    buyerBankInfoProvided: Boolean(
      buyerValue
      && buyerValue.bankInfo
      && typeof buyerValue.bankInfo === "object"
    ),
  };
};

export async function POST(request: NextRequest) {
  const body = await request.json() as SetBuyOrderForClearanceRequestBody;
  const ip = getRequestIp(request);
  const country = getRequestCountry(request);

  const storecode = normalizeString(body.storecode);
  const requestedClearanceWalletAddress = normalizeString(body.walletAddress);
  const normalizedClearanceWalletAddress = normalizeWalletAddress(body.walletAddress);
  const usdtAmount = normalizePositiveNumber(body.usdtAmount);
  const krwAmount = normalizePositiveNumber(body.krwAmount);
  const rate = normalizePositiveNumber(body.rate);
  const privateSale = normalizeBoolean(body.privateSale);

  const redactedRequestBody = buildRedactedRequestBody({
    storecode,
    walletAddress: requestedClearanceWalletAddress,
    usdtAmount,
    krwAmount,
    rate,
    privateSale,
    sellerBankInfo: body.sellerBankInfo,
    buyer: body.buyer,
  });

  const authResult = await verifyAdminSignedAction({
    request,
    route: ROUTE,
    signingPrefix: SET_BUY_ORDER_FOR_CLEARANCE_SIGNING_PREFIX,
    requesterStorecodeRaw: body.requesterStorecode,
    requesterWalletAddressRaw: body.requesterWalletAddress,
    signatureRaw: body.signature,
    signedAtRaw: body.signedAt,
    nonceRaw: body.nonce,
    actionFields: {
      storecode,
      walletAddress: normalizedClearanceWalletAddress || requestedClearanceWalletAddress,
      usdtAmount,
      krwAmount,
      rate,
      privateSale,
      sellerBankInfo: body.sellerBankInfo ?? null,
      buyer: body.buyer ?? null,
    },
    requestLogActionFields: redactedRequestBody,
  });

  if (!authResult.ok) {
    return NextResponse.json(
      {
        result: null,
        error: authResult.error,
      },
      { status: authResult.status },
    );
  }

  const requesterWalletAddress = authResult.requesterWalletAddress;
  const requesterUser = authResult.requesterUser;

  const writeAdminApiCallLog = async ({
    status,
    reason,
    meta,
  }: {
    status: "allowed" | "blocked";
    reason: string;
    meta?: Record<string, unknown>;
  }) => {
    await insertAdminApiCallLog({
      route: ROUTE,
      guardType: "admin_signed",
      status,
      reason,
      publicIp: ip,
      publicCountry: country,
      requesterWalletAddress,
      requesterUser: requesterUser || null,
      requestBody: redactedRequestBody,
      meta,
    });
  };

  if (
    !storecode
    || !requestedClearanceWalletAddress
    || !normalizedClearanceWalletAddress
    || !usdtAmount
    || !krwAmount
    || !rate
  ) {
    await writeAdminApiCallLog({
      status: "blocked",
      reason: "missing_or_invalid_required_fields",
    });

    return NextResponse.json(
      {
        result: null,
        error: "Missing or invalid required fields",
      },
      { status: 400 },
    );
  }

  if (!privateSale) {
    await writeAdminApiCallLog({
      status: "blocked",
      reason: "private_sale_must_be_true",
    });

    return NextResponse.json(
      {
        result: null,
        error: "privateSale must be true",
      },
      { status: 400 },
    );
  }

  const existingBuyOrder = await getBlockingBuyOrderByStorecodeAndWalletAddress({
    storecode,
    walletAddress: normalizedClearanceWalletAddress,
  });

  if (existingBuyOrder) {
    await writeAdminApiCallLog({
      status: "blocked",
      reason: "existing_active_buy_order",
      meta: {
        storecode,
        existingOrderId: existingBuyOrder?._id ? String(existingBuyOrder._id) : null,
        existingTradeId: existingBuyOrder?.tradeId || null,
        existingStatus: existingBuyOrder?.status || null,
      },
    });

    return NextResponse.json(
      {
        result: null,
        error: "Existing active buy order already exists for this member",
        existingOrder: existingBuyOrder,
      },
      { status: 409 },
    );
  }

  const store = await getStoreByStorecode({ storecode });
  if (!store) {
    await writeAdminApiCallLog({
      status: "blocked",
      reason: "store_not_found",
      meta: {
        storecode,
      },
    });

    return NextResponse.json(
      {
        result: null,
        error: "Store not found",
      },
      { status: 404 },
    );
  }

  if (!isConfiguredClearanceRequesterWallet(store, normalizedClearanceWalletAddress)) {
    await writeAdminApiCallLog({
      status: "blocked",
      reason: "wallet_not_allowed_for_store",
      meta: {
        storecode,
        configuredWalletCount: getConfiguredClearanceRequesterWallets(store).length,
      },
    });

    return NextResponse.json(
      {
        result: null,
        error: "Wallet is not allowed for the requested store",
      },
      { status: 400 },
    );
  }

  const clearanceUser = await getOneByWalletAddress("admin", normalizedClearanceWalletAddress);
  if (!clearanceUser) {
    await writeAdminApiCallLog({
      status: "blocked",
      reason: "clearance_requester_not_found",
      meta: {
        storecode,
      },
    });

    return NextResponse.json(
      {
        result: null,
        error: "Configured clearance wallet user not found",
      },
      { status: 400 },
    );
  }

  const sellerBankInfo = resolveConfiguredClearanceSellerBankInfo(store, body.sellerBankInfo);
  if (!sellerBankInfo) {
    await writeAdminApiCallLog({
      status: "blocked",
      reason: "invalid_seller_bank_info",
      meta: {
        storecode,
      },
    });

    return NextResponse.json(
      {
        result: null,
        error: "Invalid seller bank info",
      },
      { status: 400 },
    );
  }

  const buyer = resolveConfiguredClearanceBuyer(store, body.buyer);
  if (!buyer) {
    await writeAdminApiCallLog({
      status: "blocked",
      reason: "invalid_buyer_bank_info",
      meta: {
        storecode,
      },
    });

    return NextResponse.json(
      {
        result: null,
        error: "Invalid buyer bank info",
      },
      { status: 400 },
    );
  }

  const settlementWalletAddress = getConfiguredClearanceSettlementWalletAddress(store);
  if (!settlementWalletAddress) {
    await writeAdminApiCallLog({
      status: "blocked",
      reason: "missing_clearance_settlement_wallet",
      meta: {
        storecode,
      },
    });

    return NextResponse.json(
      {
        result: null,
        error: "Configured settlement wallet not found",
      },
      { status: 400 },
    );
  }

  const createdBy = {
    walletAddress: normalizeOptionalString(requesterUser?.walletAddress) || requesterWalletAddress,
    storecode: normalizeOptionalString(requesterUser?.storecode) || "admin",
    role: normalizeOptionalString(requesterUser?.role),
    id: requesterUser?.id ?? null,
    nickname: normalizeOptionalString(requesterUser?.nickname),
    mobile: normalizeOptionalString(requesterUser?.mobile),
    email: normalizeOptionalString(requesterUser?.email),
    avatar: normalizeOptionalString(requesterUser?.avatar),
    requestedAt: new Date().toISOString(),
    signatureVerified: true,
  };

  const result = await insertBuyOrderForClearance({
    chain,
    storecode,
    walletAddress: normalizedClearanceWalletAddress,
    sellerBankInfo,
    nickname: normalizeOptionalString(clearanceUser?.nickname) || "",
    usdtAmount,
    krwAmount,
    rate,
    privateSale: true,
    buyer,
    createdBy,
  });

  if (!result) {
    await writeAdminApiCallLog({
      status: "blocked",
      reason: "insert_buy_order_failed",
      meta: {
        storecode,
        settlementWalletAddress,
      },
    });

    return NextResponse.json(
      {
        result: null,
        error: "Failed to insert buy order",
      },
      { status: 500 },
    );
  }

  await writeAdminApiCallLog({
    status: "allowed",
    reason: "buy_order_created",
    meta: {
      id: result?._id || null,
      tradeId: result?.tradeId || null,
      storecode,
      settlementWalletAddress,
    },
  });

  return NextResponse.json({
    result,
  });
}
