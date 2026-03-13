import { NextResponse, type NextRequest } from "next/server";

import { chain } from "@/app/config/contractAddresses";
import { insertAdminApiCallLog } from "@/lib/api/adminApiCallLog";
import {
  insertBuyOrderForClearance,
} from "@lib/api/order";
import { getStoreByStorecode } from "@lib/api/store";
import { getOneServerWalletByStorecodeAndWalletAddress } from "@lib/api/user";
import { verifyAdminSignedAction } from "@/lib/server/admin-action-security";
import {
  DEFAULT_CLEARANCE_DAILY_MAX_KRW_AMOUNT,
  DEFAULT_CLEARANCE_MAX_KRW_AMOUNT,
  findExistingActiveClearanceOrder,
  formatKrwAmount,
  getConfiguredClearanceRequesterWallets,
  getConfiguredClearanceSettlementWalletAddress,
  getClearanceOrderDailyTotals,
  getCurrentKstDayRange,
  isConfiguredClearanceRequesterWallet,
  resolveConfiguredClearanceLimit,
  resolveConfiguredClearanceBuyer,
  resolveConfiguredClearanceSellerBankInfo,
} from "@/lib/server/clearance-order-security";
import { resolveThirdwebServerWalletByAddress } from "@/lib/server/thirdweb-server-wallet-cache";
import {
  getRequestCountry,
  getRequestIp,
  normalizeWalletAddress,
} from "@/lib/server/user-read-security";

const ROUTE = "/api/order/setBuyOrderForClearance";
const SET_BUY_ORDER_FOR_CLEARANCE_SIGNING_PREFIX = "stable-georgia:set-buy-order-for-clearance:v1";
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

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

  if (normalizedClearanceWalletAddress === ZERO_ADDRESS) {
    await writeAdminApiCallLog({
      status: "blocked",
      reason: "zero_wallet_address_not_allowed",
      meta: {
        storecode,
      },
    });

    return NextResponse.json(
      {
        result: null,
        error: "walletAddress cannot be zero address",
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

  const platformAdminStore = await getStoreByStorecode({ storecode: "admin" });
  const platformAdminWalletAddress = normalizeWalletAddress(platformAdminStore?.adminWalletAddress);
  const normalizedRequesterWalletAddress = normalizeWalletAddress(requesterWalletAddress);

  if (!platformAdminWalletAddress) {
    await writeAdminApiCallLog({
      status: "blocked",
      reason: "missing_platform_admin_wallet",
      meta: {
        storecode,
      },
    });

    return NextResponse.json(
      {
        result: null,
        error: "Platform admin wallet is not configured",
      },
      { status: 500 },
    );
  }

  if (normalizedRequesterWalletAddress !== platformAdminWalletAddress) {
    await writeAdminApiCallLog({
      status: "blocked",
      reason: "forbidden_not_platform_admin_wallet",
      meta: {
        storecode,
        platformAdminWalletAddress,
      },
    });

    return NextResponse.json(
      {
        result: null,
        error: "Only the platform admin wallet can create clearance buy orders",
      },
      { status: 403 },
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

  const clearanceUser = await getOneServerWalletByStorecodeAndWalletAddress(
    "admin",
    normalizedClearanceWalletAddress,
  );
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

  let resolvedThirdwebServerWallet = null;
  try {
    resolvedThirdwebServerWallet = await resolveThirdwebServerWalletByAddress(
      normalizedClearanceWalletAddress,
    );
  } catch (error) {
    await writeAdminApiCallLog({
      status: "blocked",
      reason: "clearance_requester_validation_failed",
      meta: {
        storecode,
        message: error instanceof Error ? error.message : "unknown",
      },
    });

    return NextResponse.json(
      {
        result: null,
        error: error instanceof Error ? error.message : "Failed to validate clearance wallet",
      },
      { status: 500 },
    );
  }

  if (!resolvedThirdwebServerWallet) {
    await writeAdminApiCallLog({
      status: "blocked",
      reason: "clearance_requester_not_server_wallet",
      meta: {
        storecode,
      },
    });

    return NextResponse.json(
      {
        result: null,
        error: "walletAddress must be an active Thirdweb server wallet",
      },
      { status: 400 },
    );
  }

  if (resolvedThirdwebServerWallet.smartAccountAddress !== normalizedClearanceWalletAddress) {
    await writeAdminApiCallLog({
      status: "blocked",
      reason: "clearance_requester_not_smart_account",
      meta: {
        storecode,
        signerAddress: resolvedThirdwebServerWallet.signerAddress,
      },
    });

    return NextResponse.json(
      {
        result: null,
        error: "walletAddress must be a Thirdweb server wallet smart account address",
      },
      { status: 400 },
    );
  }

  const clearanceUserSignerAddress = normalizeWalletAddress(clearanceUser?.signerAddress);
  if (
    !clearanceUserSignerAddress
    || clearanceUserSignerAddress !== resolvedThirdwebServerWallet.signerAddress
  ) {
    await writeAdminApiCallLog({
      status: "blocked",
      reason: "clearance_requester_signer_mismatch",
      meta: {
        storecode,
        expectedSignerAddress: clearanceUserSignerAddress,
        resolvedSignerAddress: resolvedThirdwebServerWallet.signerAddress,
      },
    });

    return NextResponse.json(
      {
        result: null,
        error: "walletAddress signer does not match the configured server wallet user",
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

  const impliedRate = krwAmount / usdtAmount;
  const allowedRateDelta = Math.max(1, rate * 0.01);
  if (Math.abs(impliedRate - rate) > allowedRateDelta) {
    await writeAdminApiCallLog({
      status: "blocked",
      reason: "rate_amount_mismatch",
      meta: {
        storecode,
        impliedRate,
        allowedRateDelta,
      },
    });

    return NextResponse.json(
      {
        result: null,
        error: "krwAmount, usdtAmount, and rate do not match within the allowed tolerance",
      },
      { status: 400 },
    );
  }

  const maxKrwAmount = resolveConfiguredClearanceLimit({
    storeValue: (store as Record<string, unknown>)?.clearanceMaxKrwAmount,
    envValue: process.env.CLEARANCE_BUYORDER_MAX_KRW_AMOUNT,
    fallback: DEFAULT_CLEARANCE_MAX_KRW_AMOUNT,
  });

  if (krwAmount > maxKrwAmount) {
    await writeAdminApiCallLog({
      status: "blocked",
      reason: "amount_exceeds_per_order_limit",
      meta: {
        storecode,
        maxKrwAmount,
      },
    });

    return NextResponse.json(
      {
        result: null,
        error: `매입신청 1회 한도는 ${formatKrwAmount(maxKrwAmount)}입니다.`,
      },
      { status: 400 },
    );
  }

  const existingActiveOrder = await findExistingActiveClearanceOrder({
    storecode,
    walletAddress: normalizedClearanceWalletAddress,
    sellerBankInfo,
    buyerBankInfo: buyer.bankInfo,
    usdtAmount,
    krwAmount,
    rate,
  });

  if (existingActiveOrder) {
    await writeAdminApiCallLog({
      status: "blocked",
      reason: "existing_active_buy_order",
      meta: {
        storecode,
        existingOrderId: existingActiveOrder?._id?.toString?.() || null,
        existingTradeId: existingActiveOrder?.tradeId || null,
        existingStatus: existingActiveOrder?.status || null,
      },
    });

    return NextResponse.json(
      {
        result: null,
        error: "An identical active clearance buy order already exists",
      },
      { status: 409 },
    );
  }

  const { startCreatedAtIso, endCreatedAtIso, label: kstDayLabel } = getCurrentKstDayRange();
  const maxDailyKrwAmount = resolveConfiguredClearanceLimit({
    storeValue: (store as Record<string, unknown>)?.clearanceDailyMaxKrwAmount,
    envValue: process.env.CLEARANCE_BUYORDER_DAILY_MAX_KRW_AMOUNT,
    fallback: DEFAULT_CLEARANCE_DAILY_MAX_KRW_AMOUNT,
  });
  const dailyTotals = await getClearanceOrderDailyTotals({
    storecode,
    startCreatedAtIso,
    endCreatedAtIso,
  });

  if (dailyTotals.totalKrwAmount + krwAmount > maxDailyKrwAmount) {
    await writeAdminApiCallLog({
      status: "blocked",
      reason: "amount_exceeds_daily_limit",
      meta: {
        storecode,
        kstDayLabel,
        maxDailyKrwAmount,
        currentDailyKrwAmount: dailyTotals.totalKrwAmount,
      },
    });

    return NextResponse.json(
      {
        result: null,
        error: `매입신청 1일 누적 한도는 ${formatKrwAmount(maxDailyKrwAmount)}입니다.`,
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
      kstDayLabel,
    },
  });

  return NextResponse.json({
    result,
  });
}
