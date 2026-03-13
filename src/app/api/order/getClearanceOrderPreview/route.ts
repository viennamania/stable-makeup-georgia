import { NextResponse, type NextRequest } from "next/server";

import { getStoreByStorecode } from "@lib/api/store";
import { getOneServerWalletByStorecodeAndWalletAddress } from "@lib/api/user";
import { verifyAdminSignedAction } from "@/lib/server/admin-action-security";
import {
  DEFAULT_CLEARANCE_DAILY_MAX_KRW_AMOUNT,
  DEFAULT_CLEARANCE_MAX_KRW_AMOUNT,
  findExistingActiveClearanceOrder,
  formatKrwAmount,
  getConfiguredClearanceSettlementWalletAddress,
  getClearanceOrderDailyTotals,
  getCurrentKstDayRange,
  isConfiguredClearanceRequesterWallet,
  resolveConfiguredClearanceBuyer,
  resolveConfiguredClearanceLimit,
  resolveConfiguredClearanceSellerBankInfo,
} from "@/lib/server/clearance-order-security";
import { resolveThirdwebServerWalletByAddress } from "@/lib/server/thirdweb-server-wallet-cache";
import { normalizeWalletAddress } from "@/lib/server/user-read-security";

const ROUTE = "/api/order/getClearanceOrderPreview";
const GET_CLEARANCE_ORDER_PREVIEW_SIGNING_PREFIX = "stable-georgia:get-clearance-order-preview:v1";
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

type GetClearanceOrderPreviewRequestBody = {
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
  const body = await request.json() as GetClearanceOrderPreviewRequestBody;

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
    signingPrefix: GET_CLEARANCE_ORDER_PREVIEW_SIGNING_PREFIX,
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

  if (
    !storecode
    || !requestedClearanceWalletAddress
    || !normalizedClearanceWalletAddress
    || !usdtAmount
    || !krwAmount
    || !rate
  ) {
    return NextResponse.json(
      {
        result: null,
        error: "Missing or invalid required fields",
      },
      { status: 400 },
    );
  }

  if (!privateSale) {
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
    return NextResponse.json(
      {
        result: null,
        error: "Store not found",
      },
      { status: 404 },
    );
  }

  const requesterWalletAddress = normalizeWalletAddress(authResult.requesterWalletAddress);
  const requesterIsAuthorizedAdmin = true;

  const clearanceWalletAllowed =
    normalizedClearanceWalletAddress !== ZERO_ADDRESS
    && isConfiguredClearanceRequesterWallet(store, normalizedClearanceWalletAddress);

  const settlementWalletAddress = getConfiguredClearanceSettlementWalletAddress(store);
  const sellerBankInfo = resolveConfiguredClearanceSellerBankInfo(store, body.sellerBankInfo);
  const buyer = resolveConfiguredClearanceBuyer(store, body.buyer);

  const clearanceUser = clearanceWalletAllowed
    ? await getOneServerWalletByStorecodeAndWalletAddress("admin", normalizedClearanceWalletAddress)
    : null;

  let resolvedThirdwebServerWallet = null;
  if (clearanceWalletAllowed) {
    try {
      resolvedThirdwebServerWallet = await resolveThirdwebServerWalletByAddress(
        normalizedClearanceWalletAddress,
      );
    } catch {
      resolvedThirdwebServerWallet = null;
    }
  }

  const clearanceWalletIsServerWallet = Boolean(
    clearanceUser
    && resolvedThirdwebServerWallet
    && resolvedThirdwebServerWallet.smartAccountAddress === normalizedClearanceWalletAddress
    && normalizeWalletAddress(clearanceUser?.signerAddress) === resolvedThirdwebServerWallet.signerAddress,
  );

  const impliedRate = krwAmount / usdtAmount;
  const allowedRateDelta = Math.max(1, rate * 0.01);
  const withinRateTolerance = Math.abs(impliedRate - rate) <= allowedRateDelta;

  const maxKrwAmount = resolveConfiguredClearanceLimit({
    storeValue: (store as Record<string, unknown>)?.clearanceMaxKrwAmount,
    envValue: process.env.CLEARANCE_BUYORDER_MAX_KRW_AMOUNT,
    fallback: DEFAULT_CLEARANCE_MAX_KRW_AMOUNT,
  });

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

  const projectedDailyKrwAmount = dailyTotals.totalKrwAmount + krwAmount;
  const remainingDailyKrwAmount = Math.max(0, maxDailyKrwAmount - projectedDailyKrwAmount);
  const withinPerOrderLimit = krwAmount <= maxKrwAmount;
  const withinDailyLimit = projectedDailyKrwAmount <= maxDailyKrwAmount;

  const existingActiveOrder =
    sellerBankInfo && buyer?.bankInfo
      ? await findExistingActiveClearanceOrder({
          storecode,
          walletAddress: normalizedClearanceWalletAddress,
          sellerBankInfo,
          buyerBankInfo: buyer.bankInfo,
          usdtAmount,
          krwAmount,
          rate,
        })
      : null;

  const blockingReasons: string[] = [];

  if (normalizedClearanceWalletAddress === ZERO_ADDRESS) {
    blockingReasons.push("청산 요청 지갑이 0 주소입니다.");
  } else if (!clearanceWalletAllowed) {
    blockingReasons.push("청산 요청 지갑이 해당 가맹점에 허용된 지갑이 아닙니다.");
  } else if (!clearanceWalletIsServerWallet) {
    blockingReasons.push("청산 요청 지갑이 active Thirdweb server wallet smart account가 아닙니다.");
  }
  if (!sellerBankInfo) {
    blockingReasons.push("출금 계좌 정보가 올바르지 않습니다.");
  }
  if (!buyer?.bankInfo) {
    blockingReasons.push("입금 계좌 정보가 올바르지 않습니다.");
  }
  if (!settlementWalletAddress) {
    blockingReasons.push("청산 정산지갑이 설정되지 않았습니다.");
  }
  if (!withinRateTolerance) {
    blockingReasons.push("입력 금액과 환율 계산이 맞지 않습니다.");
  }
  if (!withinPerOrderLimit) {
    blockingReasons.push(`매입신청 1회 한도는 ${formatKrwAmount(maxKrwAmount)}입니다.`);
  }
  if (!withinDailyLimit) {
    blockingReasons.push(`매입신청 1일 누적 한도는 ${formatKrwAmount(maxDailyKrwAmount)}입니다.`);
  }
  if (existingActiveOrder) {
    blockingReasons.push(`동일한 진행중 매입주문이 이미 있습니다. #${existingActiveOrder.tradeId}`);
  }

  return NextResponse.json({
    result: {
      storecode,
      requesterWalletAddress,
      requesterIsAuthorizedAdmin,
      clearanceWalletAddress: normalizedClearanceWalletAddress,
      clearanceWalletAllowed,
      clearanceWalletIsServerWallet,
      settlementWalletAddress,
      requestedKrwAmount: krwAmount,
      requestedUsdtAmount: usdtAmount,
      rate,
      maxKrwAmount,
      maxDailyKrwAmount,
      currentDailyKrwAmount: dailyTotals.totalKrwAmount,
      currentDailyUsdtAmount: dailyTotals.totalUsdtAmount,
      currentDailyOrderCount: dailyTotals.orderCount,
      projectedDailyKrwAmount,
      remainingDailyKrwAmount,
      withinPerOrderLimit,
      withinDailyLimit,
      withinRateTolerance,
      impliedRate,
      allowedRateDelta,
      existingActiveOrder: existingActiveOrder
        ? {
            orderId: existingActiveOrder?._id?.toString?.() || null,
            tradeId: existingActiveOrder?.tradeId || null,
            status: existingActiveOrder?.status || null,
          }
        : null,
      blockingReasons,
      canSubmit: blockingReasons.length === 0,
      kstDayLabel,
    },
  });
}
