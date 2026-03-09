import { normalizeWalletAddress } from "@/lib/server/user-read-security";

export type ClearanceBankInfo = {
  bankName: string;
  accountNumber: string;
  accountHolder: string;
};

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
