import clientPromise, { dbName } from "@/lib/mongodb";
import {
  THIRDWEB_INSIGHT_MANAGED_WEBHOOK_COLLECTION,
  getThirdwebSellerWalletRecords,
} from "@/lib/server/thirdweb-insight-webhook";
import { normalizeWalletAddress } from "@/lib/server/user-read-security";

type DashboardStoreItem = {
  storecode: string;
  storeName: string;
  storeLogo: string;
  settlementWalletAddress: string | null;
  sellerWalletAddress: string | null;
  privateSellerWalletAddress: string | null;
  totalUsdtAmount: number;
  totalPaymentConfirmedCount: number;
};

export type SuperadminDashboardOverview = {
  generatedAt: string;
  counters: {
    totalStores: number;
    settlementReadyStores: number;
    sellerWalletConfiguredStores: number;
    privateSellerWalletConfiguredStores: number;
    verifiedServerWalletUsers: number;
    monitoredWalletCount: number;
    managedWebhookCount: number;
    activeWebhookCount: number;
    disabledWebhookCount: number;
  };
  rates: {
    settlementCoveragePercent: number;
    sellerWalletCoveragePercent: number;
    privateSellerWalletCoveragePercent: number;
    activeWebhookRatioPercent: number;
  };
  queues: {
    missingSettlementCount: number;
    missingSellerWalletCount: number;
    missingPrivateSellerWalletCount: number;
  };
  storesNeedingSettlement: DashboardStoreItem[];
  readyStores: DashboardStoreItem[];
};

const EXCLUDED_STORECODES = ["admin", "ADMIN", "agent", "AGENT"];

const normalizeString = (value: unknown): string => {
  if (typeof value !== "string") {
    return "";
  }
  return value.trim();
};

const normalizeNumber = (value: unknown): number => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  const parsed = Number.parseFloat(normalizeString(value));
  return Number.isFinite(parsed) ? parsed : 0;
};

const buildMissingWalletQuery = (field: string) => ({
  $or: [
    { [field]: { $exists: false } },
    { [field]: null },
    { [field]: "" },
  ],
});

const buildPresentWalletQuery = (field: string) => ({
  [field]: { $type: "string", $ne: "" },
});

const buildStoreBaseQuery = () => ({
  storecode: { $nin: EXCLUDED_STORECODES },
});

const serializeStoreItem = (store: any): DashboardStoreItem => ({
  storecode: normalizeString(store?.storecode).toLowerCase(),
  storeName: normalizeString(store?.storeName),
  storeLogo: normalizeString(store?.storeLogo),
  settlementWalletAddress: normalizeWalletAddress(store?.settlementWalletAddress),
  sellerWalletAddress: normalizeWalletAddress(store?.sellerWalletAddress),
  privateSellerWalletAddress: normalizeWalletAddress(store?.privateSellerWalletAddress),
  totalUsdtAmount: normalizeNumber(store?.totalUsdtAmount),
  totalPaymentConfirmedCount: Math.trunc(normalizeNumber(store?.totalPaymentConfirmedCount)),
});

const roundRate = (value: number): number => {
  if (!Number.isFinite(value) || value <= 0) {
    return 0;
  }
  return Math.round(value * 10) / 10;
};

export const getSuperadminDashboardOverview = async (): Promise<SuperadminDashboardOverview> => {
  const client = await clientPromise;
  const database = client.db(dbName);
  const storesCollection = database.collection("stores");
  const usersCollection = database.collection("users");
  const managedWebhookCollection = database.collection(THIRDWEB_INSIGHT_MANAGED_WEBHOOK_COLLECTION);

  const baseStoreQuery = buildStoreBaseQuery();

  const [
    totalStores,
    settlementReadyStores,
    sellerWalletConfiguredStores,
    privateSellerWalletConfiguredStores,
    missingSettlementCount,
    missingSellerWalletCount,
    missingPrivateSellerWalletCount,
    verifiedServerWalletUsers,
    managedWebhookCount,
    activeWebhookCount,
    disabledWebhookCount,
    monitoredWalletRecords,
    storesNeedingSettlementRaw,
    readyStoresRaw,
  ] = await Promise.all([
    storesCollection.countDocuments(baseStoreQuery),
    storesCollection.countDocuments({
      ...baseStoreQuery,
      ...buildPresentWalletQuery("settlementWalletAddress"),
    }),
    storesCollection.countDocuments({
      ...baseStoreQuery,
      ...buildPresentWalletQuery("sellerWalletAddress"),
    }),
    storesCollection.countDocuments({
      ...baseStoreQuery,
      ...buildPresentWalletQuery("privateSellerWalletAddress"),
    }),
    storesCollection.countDocuments({
      ...baseStoreQuery,
      ...buildMissingWalletQuery("settlementWalletAddress"),
    }),
    storesCollection.countDocuments({
      ...baseStoreQuery,
      ...buildMissingWalletQuery("sellerWalletAddress"),
    }),
    storesCollection.countDocuments({
      ...baseStoreQuery,
      ...buildMissingWalletQuery("privateSellerWalletAddress"),
    }),
    usersCollection.countDocuments({
      storecode: { $nin: EXCLUDED_STORECODES },
      walletAddress: { $type: "string", $ne: "" },
      signerAddress: { $type: "string", $ne: "" },
      verified: true,
    }),
    managedWebhookCollection.countDocuments({}),
    managedWebhookCollection.countDocuments({
      $or: [
        { disabled: { $exists: false } },
        { disabled: false },
        { disabled: null },
      ],
    }),
    managedWebhookCollection.countDocuments({ disabled: true }),
    getThirdwebSellerWalletRecords(),
    storesCollection
      .find(
        {
          ...baseStoreQuery,
          ...buildMissingWalletQuery("settlementWalletAddress"),
        },
        {
          projection: {
            _id: 0,
            storecode: 1,
            storeName: 1,
            storeLogo: 1,
            settlementWalletAddress: 1,
            sellerWalletAddress: 1,
            privateSellerWalletAddress: 1,
            totalUsdtAmount: 1,
            totalPaymentConfirmedCount: 1,
          },
          sort: {
            totalUsdtAmount: -1,
            totalPaymentConfirmedCount: -1,
            createdAt: -1,
          },
          limit: 6,
        },
      )
      .toArray(),
    storesCollection
      .find(
        {
          ...baseStoreQuery,
          ...buildPresentWalletQuery("settlementWalletAddress"),
        },
        {
          projection: {
            _id: 0,
            storecode: 1,
            storeName: 1,
            storeLogo: 1,
            settlementWalletAddress: 1,
            sellerWalletAddress: 1,
            privateSellerWalletAddress: 1,
            totalUsdtAmount: 1,
            totalPaymentConfirmedCount: 1,
          },
          sort: {
            totalUsdtAmount: -1,
            totalPaymentConfirmedCount: -1,
            createdAt: -1,
          },
          limit: 6,
        },
      )
      .toArray(),
  ]);

  const settlementCoveragePercent = totalStores > 0
    ? roundRate((settlementReadyStores / totalStores) * 100)
    : 0;
  const sellerWalletCoveragePercent = totalStores > 0
    ? roundRate((sellerWalletConfiguredStores / totalStores) * 100)
    : 0;
  const privateSellerWalletCoveragePercent = totalStores > 0
    ? roundRate((privateSellerWalletConfiguredStores / totalStores) * 100)
    : 0;
  const activeWebhookRatioPercent = managedWebhookCount > 0
    ? roundRate((activeWebhookCount / managedWebhookCount) * 100)
    : 0;

  return {
    generatedAt: new Date().toISOString(),
    counters: {
      totalStores,
      settlementReadyStores,
      sellerWalletConfiguredStores,
      privateSellerWalletConfiguredStores,
      verifiedServerWalletUsers,
      monitoredWalletCount: monitoredWalletRecords.length,
      managedWebhookCount,
      activeWebhookCount,
      disabledWebhookCount,
    },
    rates: {
      settlementCoveragePercent,
      sellerWalletCoveragePercent,
      privateSellerWalletCoveragePercent,
      activeWebhookRatioPercent,
    },
    queues: {
      missingSettlementCount,
      missingSellerWalletCount,
      missingPrivateSellerWalletCount,
    },
    storesNeedingSettlement: storesNeedingSettlementRaw.map((store) => serializeStoreItem(store)),
    readyStores: readyStoresRaw.map((store) => serializeStoreItem(store)),
  };
};
