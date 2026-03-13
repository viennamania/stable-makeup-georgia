import clientPromise, { dbName } from "@/lib/mongodb";
import { normalizeWalletAddress } from "@/lib/server/user-read-security";

export type ClearanceBankInfo = {
  bankName: string;
  accountNumber: string;
  accountHolder: string;
};

export const ACTIVE_CLEARANCE_ORDER_STATUSES = ["ordered", "accepted", "paymentRequested"] as const;
export const DEFAULT_CLEARANCE_MAX_KRW_AMOUNT = 5_000_000;
export const DEFAULT_CLEARANCE_DAILY_MAX_KRW_AMOUNT = 500_000_000;

const normalizeString = (value: unknown): string => {
  if (typeof value !== "string") {
    return "";
  }
  return value.trim();
};

const normalizeBankInfo = (value: unknown): ClearanceBankInfo | null => {
  if (!value || typeof value !== "object") {
    return null;
  }

  const bankName = normalizeString((value as Record<string, unknown>).bankName);
  const accountNumber = normalizeString((value as Record<string, unknown>).accountNumber);
  const accountHolder = normalizeString((value as Record<string, unknown>).accountHolder);

  if (!bankName || !accountNumber || !accountHolder) {
    return null;
  }

  return {
    bankName,
    accountNumber,
    accountHolder,
  };
};

const normalizePositiveLimit = (value: unknown): number | null => {
  const normalized = Number(value);
  if (!Number.isFinite(normalized) || normalized <= 0) {
    return null;
  }
  return normalized;
};

const buildBankInfoKey = (value: ClearanceBankInfo) => {
  return [
    value.bankName.toLowerCase(),
    value.accountNumber.replace(/\s+/g, ""),
    value.accountHolder.toLowerCase(),
  ].join("|");
};

const dedupeBankInfos = (items: Array<ClearanceBankInfo | null>): ClearanceBankInfo[] => {
  const seen = new Set<string>();
  const results: ClearanceBankInfo[] = [];

  items.forEach((item) => {
    if (!item) {
      return;
    }

    const key = buildBankInfoKey(item);
    if (seen.has(key)) {
      return;
    }

    seen.add(key);
    results.push(item);
  });

  return results;
};

const findConfiguredBankInfo = (
  configuredInfos: ClearanceBankInfo[],
  requestedRaw: unknown,
): ClearanceBankInfo | null => {
  const requested = normalizeBankInfo(requestedRaw);
  if (!requested) {
    return null;
  }

  const requestedKey = buildBankInfoKey(requested);
  return configuredInfos.find((item) => buildBankInfoKey(item) === requestedKey) || null;
};

export const formatKrwAmount = (value: number) => {
  return `${Math.trunc(Number(value || 0)).toLocaleString("ko-KR")}원`;
};

export const resolveConfiguredClearanceLimit = ({
  storeValue,
  envValue,
  fallback,
}: {
  storeValue: unknown;
  envValue: unknown;
  fallback: number;
}) => {
  return (
    normalizePositiveLimit(storeValue)
    || normalizePositiveLimit(envValue)
    || fallback
  );
};

export const getCurrentKstDayRange = () => {
  const now = new Date();
  const kstNow = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const kstYear = kstNow.getUTCFullYear();
  const kstMonth = kstNow.getUTCMonth();
  const kstDay = kstNow.getUTCDate();

  const start = new Date(Date.UTC(kstYear, kstMonth, kstDay, 0, 0, 0) - 9 * 60 * 60 * 1000);
  const end = new Date(Date.UTC(kstYear, kstMonth, kstDay + 1, 0, 0, 0) - 9 * 60 * 60 * 1000);

  return {
    startCreatedAtIso: start.toISOString(),
    endCreatedAtIso: end.toISOString(),
    label: `${kstYear}-${String(kstMonth + 1).padStart(2, "0")}-${String(kstDay).padStart(2, "0")}`,
  };
};

export const getClearanceOrderDailyTotals = async ({
  storecode,
  startCreatedAtIso,
  endCreatedAtIso,
}: {
  storecode: string;
  startCreatedAtIso: string;
  endCreatedAtIso: string;
}) => {
  const client = await clientPromise;
  const collection = client.db(dbName).collection("buyorders");
  const [summary] = await collection.aggregate<{
    totalKrwAmount?: number;
    totalUsdtAmount?: number;
    orderCount?: number;
  }>([
    {
      $match: {
        storecode,
        privateSale: true,
        createdAt: {
          $gte: startCreatedAtIso,
          $lt: endCreatedAtIso,
        },
        status: { $ne: "cancelled" },
      },
    },
    {
      $group: {
        _id: null,
        totalKrwAmount: { $sum: { $toDouble: "$krwAmount" } },
        totalUsdtAmount: { $sum: { $toDouble: "$usdtAmount" } },
        orderCount: { $sum: 1 },
      },
    },
  ]).toArray();

  return {
    totalKrwAmount: Number(summary?.totalKrwAmount || 0),
    totalUsdtAmount: Number(summary?.totalUsdtAmount || 0),
    orderCount: Number(summary?.orderCount || 0),
  };
};

export const findExistingActiveClearanceOrder = async ({
  storecode,
  walletAddress,
  sellerBankInfo,
  buyerBankInfo,
  usdtAmount,
  krwAmount,
  rate,
}: {
  storecode: string;
  walletAddress: string;
  sellerBankInfo: ClearanceBankInfo;
  buyerBankInfo: ClearanceBankInfo;
  usdtAmount: number;
  krwAmount: number;
  rate: number;
}) => {
  const client = await clientPromise;
  const collection = client.db(dbName).collection("buyorders");

  return collection.findOne<any>({
    storecode,
    privateSale: true,
    walletAddress,
    usdtAmount,
    krwAmount,
    rate,
    status: { $in: [...ACTIVE_CLEARANCE_ORDER_STATUSES] },
    "seller.bankInfo.bankName": sellerBankInfo.bankName,
    "seller.bankInfo.accountNumber": sellerBankInfo.accountNumber,
    "seller.bankInfo.accountHolder": sellerBankInfo.accountHolder,
    "buyer.bankInfo.bankName": buyerBankInfo.bankName,
    "buyer.bankInfo.accountNumber": buyerBankInfo.accountNumber,
    "buyer.bankInfo.accountHolder": buyerBankInfo.accountHolder,
  });
};

export const getConfiguredClearanceRequesterWallets = (store: any): string[] => {
  const candidates = [
    normalizeWalletAddress(store?.privateSaleWalletAddress),
    normalizeWalletAddress(store?.sellerWalletAddress),
  ].filter(Boolean) as string[];

  return Array.from(new Set(candidates));
};

export const isConfiguredClearanceRequesterWallet = (
  store: any,
  walletAddress: string | null,
): boolean => {
  if (!walletAddress) {
    return false;
  }

  return getConfiguredClearanceRequesterWallets(store).includes(walletAddress);
};

export const getConfiguredClearanceSettlementWalletAddress = (store: any): string | null => {
  return (
    normalizeWalletAddress(store?.privateSellerWalletAddress)
    || normalizeWalletAddress(store?.settlementWalletAddress)
    || normalizeWalletAddress(store?.adminWalletAddress)
    || null
  );
};

export const getConfiguredClearanceBuyerBankInfos = (store: any): ClearanceBankInfo[] => {
  return dedupeBankInfos([
    normalizeBankInfo(store?.bankInfo),
    normalizeBankInfo(store?.bankInfoAAA),
    normalizeBankInfo(store?.bankInfoBBB),
    normalizeBankInfo(store?.bankInfoCCC),
    normalizeBankInfo(store?.bankInfoDDD),
    normalizeBankInfo(store?.bankInfoEEE),
  ]);
};

export const getConfiguredClearanceSellerBankInfos = (store: any): ClearanceBankInfo[] => {
  return dedupeBankInfos([
    normalizeBankInfo(store?.withdrawalBankInfo),
    normalizeBankInfo(store?.withdrawalBankInfoAAA),
    normalizeBankInfo(store?.withdrawalBankInfoBBB),
    normalizeBankInfo(store?.withdrawalBankInfoCCC),
  ]);
};

export const resolveConfiguredClearanceBuyer = (store: any, requestedRaw: unknown) => {
  const configuredInfos = getConfiguredClearanceBuyerBankInfos(store);
  const requestedProvided = requestedRaw !== undefined && requestedRaw !== null;
  const requestedBankInfo = findConfiguredBankInfo(
    configuredInfos,
    requestedRaw && typeof requestedRaw === "object"
      ? (requestedRaw as Record<string, unknown>).bankInfo
      : null,
  );

  if (requestedProvided && !requestedBankInfo) {
    return null;
  }

  const bankInfo = requestedBankInfo || configuredInfos[0] || null;
  if (!bankInfo) {
    return null;
  }

  return {
    depositName: "",
    bankInfo,
  };
};

export const resolveConfiguredClearanceSellerBankInfo = (store: any, requestedRaw: unknown) => {
  const configuredInfos = getConfiguredClearanceSellerBankInfos(store);
  const requestedProvided = requestedRaw !== undefined && requestedRaw !== null;
  const requestedBankInfo = findConfiguredBankInfo(configuredInfos, requestedRaw);

  if (requestedProvided && !requestedBankInfo) {
    return null;
  }

  return requestedBankInfo || configuredInfos[0] || null;
};
