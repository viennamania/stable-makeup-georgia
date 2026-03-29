import { createThirdwebClient, Engine } from "thirdweb";

import clientPromise, { dbName } from "@/lib/mongodb";
import {
  getStoreByStorecode,
  updateStoreSellerWalletAddress,
  updateStoreSettlementWalletAddress,
} from "@lib/api/store";
import {
  getAllUsersByStorecodeFiltered,
  getOneServerWalletByStorecodeAndWalletAddress,
  upsertStoreServerWalletUser,
} from "@lib/api/user";
import { syncThirdwebSellerUsdtWebhooks } from "@/lib/server/thirdweb-insight-webhook-sync";
import {
  primeThirdwebServerWalletCache,
  resolveThirdwebServerWalletByAddress,
} from "@/lib/server/thirdweb-server-wallet-cache";
import { normalizeWalletAddress } from "@/lib/server/user-read-security";

type WalletAudit = {
  route: string;
  publicIp?: string | null;
  requesterWalletAddress?: string | null;
  userAgent?: string | null;
};

type SerializableStore = {
  storecode: string;
  storeName: string;
  storeLogo: string;
  sellerWalletAddress: string | null;
  privateSellerWalletAddress: string | null;
  settlementWalletAddress: string | null;
};

type SerializableServerWalletUser = {
  _id: string;
  id: string;
  storecode: string;
  nickname: string;
  walletAddress: string | null;
  signerAddress: string | null;
  createdAt: string;
};

type StorePaymentWalletListItem = SerializableStore & {
  totalUsdtAmount: number;
  totalPaymentConfirmedCount: number;
};

type StorePaymentWalletCandidate = SerializableServerWalletUser & {
  thirdwebLabel: string;
  thirdwebSource: "cache" | "users" | "engine" | null;
  isActiveThirdwebWallet: boolean;
  isSmartAccountMatch: boolean;
  signerMatches: boolean;
  assignmentEligible: boolean;
  isCurrentSettlementWallet: boolean;
  isCurrentSellerWallet: boolean;
};

type StorePaymentWalletOverview = {
  store: SerializableStore;
  walletCandidates: StorePaymentWalletCandidate[];
  totalCandidateCount: number;
  eligibleCandidateCount: number;
};

type StorePaymentWalletListResult = {
  stores: StorePaymentWalletListItem[];
  totalCount: number;
  page: number;
  limit: number;
};

type StorePaymentWalletMutationResult = {
  created: boolean;
  engineWalletCreated: boolean;
  settlementWalletAddress: string;
  signerAddress: string;
  user: SerializableServerWalletUser;
  thirdwebWebhookSync: Record<string, unknown>;
};

type StoreSellerWalletMutationResult = {
  sellerWalletAddress: string;
  signerAddress: string;
  user: SerializableServerWalletUser;
  thirdwebWebhookSync: Record<string, unknown>;
};

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

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const serializeStore = (store: any): SerializableStore => ({
  storecode: normalizeString(store?.storecode).toLowerCase(),
  storeName: normalizeString(store?.storeName),
  storeLogo: normalizeString(store?.storeLogo),
  sellerWalletAddress: normalizeWalletAddress(store?.sellerWalletAddress),
  privateSellerWalletAddress: normalizeWalletAddress(store?.privateSellerWalletAddress),
  settlementWalletAddress: normalizeWalletAddress(store?.settlementWalletAddress),
});

const serializeStoreListItem = (store: any): StorePaymentWalletListItem => ({
  ...serializeStore(store),
  totalUsdtAmount: normalizeNumber(store?.totalUsdtAmount),
  totalPaymentConfirmedCount: Math.trunc(normalizeNumber(store?.totalPaymentConfirmedCount)),
});

const serializeUser = (user: any): SerializableServerWalletUser => ({
  _id: user?._id ? String(user._id) : "",
  id: normalizeString(user?.id),
  storecode: normalizeString(user?.storecode).toLowerCase(),
  nickname: normalizeString(user?.nickname),
  walletAddress: normalizeWalletAddress(user?.walletAddress),
  signerAddress: normalizeWalletAddress(user?.signerAddress),
  createdAt: normalizeString(user?.createdAt),
});

const buildSettlementWalletLabel = (storecode: string) =>
  `stable-georgia:settlement:${normalizeString(storecode).toLowerCase()}`;

const buildSettlementWalletNickname = (store: any, storecode: string) => {
  const storeName = normalizeString(store?.storeName);
  return storeName ? `${storeName} 자동결제` : `${normalizeString(storecode)} 자동결제`;
};

const syncThirdwebWebhookState = async (baseUrl: string) => {
  try {
    return await syncThirdwebSellerUsdtWebhooks({
      baseUrl,
    });
  } catch (error) {
    console.error("Failed to sync thirdweb store wallet webhooks from superadmin flow:", error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to sync thirdweb store wallet webhooks",
    };
  }
};

const inspectServerWalletUserCandidate = async ({
  user,
  currentSettlementWalletAddress,
  currentSellerWalletAddress,
}: {
  user: any;
  currentSettlementWalletAddress: string | null;
  currentSellerWalletAddress: string | null;
}): Promise<StorePaymentWalletCandidate> => {
  const serialized = serializeUser(user);
  const walletAddress = serialized.walletAddress;
  const signerAddress = serialized.signerAddress;

  if (!walletAddress) {
    return {
      ...serialized,
      thirdwebLabel: "",
      thirdwebSource: null,
      isActiveThirdwebWallet: false,
      isSmartAccountMatch: false,
      signerMatches: false,
      assignmentEligible: false,
      isCurrentSettlementWallet: false,
      isCurrentSellerWallet: false,
    };
  }

  const resolved = await resolveThirdwebServerWalletByAddress(walletAddress).catch(() => null);
  const isActiveThirdwebWallet = Boolean(resolved);
  const isSmartAccountMatch = Boolean(
    resolved && resolved.smartAccountAddress === walletAddress,
  );
  const signerMatches = Boolean(
    resolved && signerAddress && signerAddress === resolved.signerAddress,
  );

  return {
    ...serialized,
    thirdwebLabel: resolved?.label || "",
    thirdwebSource: resolved?.source || null,
    isActiveThirdwebWallet,
    isSmartAccountMatch,
    signerMatches,
    assignmentEligible: Boolean(isActiveThirdwebWallet && isSmartAccountMatch && signerMatches),
    isCurrentSettlementWallet: walletAddress === currentSettlementWalletAddress,
    isCurrentSellerWallet: walletAddress === currentSellerWalletAddress,
  };
};

const loadStoreServerWalletCandidates = async ({
  storecode,
  currentSettlementWalletAddress,
  currentSellerWalletAddress,
}: {
  storecode: string;
  currentSettlementWalletAddress: string | null;
  currentSellerWalletAddress: string | null;
}) => {
  const users = await getAllUsersByStorecodeFiltered({
    storecode,
    limit: 200,
    page: 1,
    verifiedOnly: true,
    requireSignerAddress: true,
  });

  const walletCandidates = await Promise.all(
    (users?.users || []).map((user) =>
      inspectServerWalletUserCandidate({
        user,
        currentSettlementWalletAddress,
        currentSellerWalletAddress,
      }),
    ),
  );

  return walletCandidates.sort((left, right) => {
    const leftCurrent = Number(left.isCurrentSettlementWallet) + Number(left.isCurrentSellerWallet);
    const rightCurrent = Number(right.isCurrentSettlementWallet) + Number(right.isCurrentSellerWallet);
    if (leftCurrent !== rightCurrent) {
      return rightCurrent - leftCurrent;
    }
    if (left.assignmentEligible !== right.assignmentEligible) {
      return left.assignmentEligible ? -1 : 1;
    }
    return String(left.nickname || left.walletAddress || "").localeCompare(
      String(right.nickname || right.walletAddress || ""),
    );
  });
};

const getReusableSettlementWalletCandidate = async (store: SerializableStore) => {
  const candidates = await loadStoreServerWalletCandidates({
    storecode: store.storecode,
    currentSettlementWalletAddress: store.settlementWalletAddress,
    currentSellerWalletAddress: store.sellerWalletAddress,
  });

  if (store.settlementWalletAddress) {
    const currentCandidate = candidates.find((item) => item.walletAddress === store.settlementWalletAddress);
    if (currentCandidate?.assignmentEligible) {
      return currentCandidate;
    }
  }

  return candidates.find((item) => item.assignmentEligible) || null;
};

export const getSuperadminStorePaymentWalletOverview = async (
  storecodeRaw: string,
): Promise<StorePaymentWalletOverview | null> => {
  const store = await getStoreByStorecode({ storecode: storecodeRaw });
  if (!store) {
    return null;
  }

  const serializedStore = serializeStore(store);
  const walletCandidates = await loadStoreServerWalletCandidates({
    storecode: serializedStore.storecode,
    currentSettlementWalletAddress: serializedStore.settlementWalletAddress,
    currentSellerWalletAddress: serializedStore.sellerWalletAddress,
  });

  return {
    store: serializedStore,
    walletCandidates,
    totalCandidateCount: walletCandidates.length,
    eligibleCandidateCount: walletCandidates.filter((item) => item.assignmentEligible).length,
  };
};

export const getSuperadminStorePaymentWalletList = async ({
  search = "",
  page = 1,
  limit = 24,
}: {
  search?: string;
  page?: number;
  limit?: number;
}): Promise<StorePaymentWalletListResult> => {
  const safeSearch = normalizeString(search);
  const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
  const safeLimit = Number.isFinite(limit) && limit > 0
    ? Math.min(Math.floor(limit), 60)
    : 24;

  const query: Record<string, unknown> = {
    storecode: { $nin: ["admin", "agent", "ADMIN", "AGENT"] },
  };

  if (safeSearch) {
    const searchRegex = new RegExp(escapeRegex(safeSearch), "i");
    query.$or = [
      { storeName: searchRegex },
      { storecode: searchRegex },
    ];
  }

  const client = await clientPromise;
  const collection = client.db(dbName).collection("stores");

  const [totalCount, stores] = await Promise.all([
    collection.countDocuments(query),
    collection
      .find(query, {
        projection: {
          _id: 0,
          storecode: 1,
          storeName: 1,
          storeLogo: 1,
          sellerWalletAddress: 1,
          privateSellerWalletAddress: 1,
          settlementWalletAddress: 1,
          totalUsdtAmount: 1,
          totalPaymentConfirmedCount: 1,
          createdAt: 1,
        },
      })
      .sort({
        storeName: 1,
        createdAt: -1,
      })
      .collation({ locale: "ko", strength: 1 })
      .skip((safePage - 1) * safeLimit)
      .limit(safeLimit)
      .toArray(),
  ]);

  return {
    stores: stores.map((item) => serializeStoreListItem(item)),
    totalCount,
    page: safePage,
    limit: safeLimit,
  };
};

export const assignSuperadminStoreSettlementWallet = async ({
  storecode,
  settlementWalletAddress,
  audit,
  baseUrl,
}: {
  storecode: string;
  settlementWalletAddress: string;
  audit: WalletAudit;
  baseUrl: string;
}): Promise<StorePaymentWalletMutationResult> => {
  const normalizedStorecode = normalizeString(storecode).toLowerCase();
  const normalizedSettlementWalletAddress = normalizeWalletAddress(settlementWalletAddress);
  if (!normalizedStorecode || !normalizedSettlementWalletAddress) {
    throw new Error("storecode and valid settlementWalletAddress are required");
  }

  const serverWalletUser = await getOneServerWalletByStorecodeAndWalletAddress(
    normalizedStorecode,
    normalizedSettlementWalletAddress,
  );
  if (!serverWalletUser) {
    throw new Error("settlementWalletAddress must belong to a server wallet user in the same store");
  }

  const resolvedThirdwebServerWallet = await resolveThirdwebServerWalletByAddress(
    normalizedSettlementWalletAddress,
  );
  if (!resolvedThirdwebServerWallet) {
    throw new Error("settlementWalletAddress must be an active Thirdweb server wallet");
  }

  if (resolvedThirdwebServerWallet.smartAccountAddress !== normalizedSettlementWalletAddress) {
    throw new Error("settlementWalletAddress must be a Thirdweb server wallet smart account address");
  }

  const serverWalletUserSignerAddress = normalizeWalletAddress(serverWalletUser?.signerAddress);
  if (!serverWalletUserSignerAddress || serverWalletUserSignerAddress !== resolvedThirdwebServerWallet.signerAddress) {
    throw new Error("settlementWalletAddress does not match the store server wallet signer");
  }

  const updatedStore = await updateStoreSettlementWalletAddress({
    storecode: normalizedStorecode,
    settlementWalletAddress: normalizedSettlementWalletAddress,
    audit,
  });
  if (!updatedStore) {
    throw new Error("Store not found");
  }

  const thirdwebWebhookSync = await syncThirdwebWebhookState(baseUrl);

  return {
    created: false,
    engineWalletCreated: false,
    settlementWalletAddress: normalizedSettlementWalletAddress,
    signerAddress: resolvedThirdwebServerWallet.signerAddress,
    user: serializeUser(serverWalletUser),
    thirdwebWebhookSync,
  };
};

export const createSuperadminStoreSettlementWallet = async ({
  storecode,
  audit,
  baseUrl,
}: {
  storecode: string;
  audit: WalletAudit;
  baseUrl: string;
}): Promise<StorePaymentWalletMutationResult> => {
  const normalizedStorecode = normalizeString(storecode).toLowerCase();
  if (!normalizedStorecode) {
    throw new Error("storecode is required");
  }

  const store = await getStoreByStorecode({ storecode: normalizedStorecode });
  if (!store) {
    throw new Error("Store not found");
  }

  const serializedStore = serializeStore(store);
  const reusableCandidate = await getReusableSettlementWalletCandidate(serializedStore);

  if (reusableCandidate?.walletAddress && reusableCandidate.signerAddress) {
    const updatedStore = await updateStoreSettlementWalletAddress({
      storecode: normalizedStorecode,
      settlementWalletAddress: reusableCandidate.walletAddress,
      audit,
    });
    if (!updatedStore) {
      throw new Error("Store not found");
    }

    const thirdwebWebhookSync = await syncThirdwebWebhookState(baseUrl);

    return {
      created: false,
      engineWalletCreated: false,
      settlementWalletAddress: reusableCandidate.walletAddress,
      signerAddress: reusableCandidate.signerAddress,
      user: reusableCandidate,
      thirdwebWebhookSync,
    };
  }

  const thirdwebSecretKey = normalizeString(process.env.THIRDWEB_SECRET_KEY);
  if (!thirdwebSecretKey) {
    throw new Error("THIRDWEB_SECRET_KEY is required");
  }

  const client = createThirdwebClient({
    secretKey: thirdwebSecretKey,
  });

  const label = buildSettlementWalletLabel(normalizedStorecode);
  const engineWallet = await Engine.createServerWallet({
    client,
    label,
  });
  const engineWalletCreated = true;

  let signerAddress = normalizeWalletAddress(engineWallet?.address);
  let smartAccountAddress = normalizeWalletAddress(engineWallet?.smartAccountAddress);

  if (!signerAddress || !smartAccountAddress) {
    throw new Error("Thirdweb server wallet was created without a smart account address. Retry the request.");
  }

  await primeThirdwebServerWalletCache({
    signerAddress,
    smartAccountAddress,
    label,
  });

  const user = await upsertStoreServerWalletUser({
    storecode: normalizedStorecode,
    walletAddress: smartAccountAddress,
    signerAddress,
    nicknameBase: buildSettlementWalletNickname(store, normalizedStorecode),
  });
  if (!user) {
    throw new Error("Failed to save settlement server wallet user");
  }

  const updatedStore = await updateStoreSettlementWalletAddress({
    storecode: normalizedStorecode,
    settlementWalletAddress: smartAccountAddress,
    audit,
  });
  if (!updatedStore) {
    throw new Error("Store not found");
  }

  const thirdwebWebhookSync = await syncThirdwebWebhookState(baseUrl);

  return {
    created: true,
    engineWalletCreated,
    settlementWalletAddress: smartAccountAddress,
    signerAddress,
    user: serializeUser(user),
    thirdwebWebhookSync,
  };
};

export const assignSuperadminStoreSellerWallet = async ({
  storecode,
  sellerWalletAddress,
  audit,
  baseUrl,
}: {
  storecode: string;
  sellerWalletAddress: string;
  audit: WalletAudit;
  baseUrl: string;
}): Promise<StoreSellerWalletMutationResult> => {
  const normalizedStorecode = normalizeString(storecode).toLowerCase();
  const normalizedSellerWalletAddress = normalizeWalletAddress(sellerWalletAddress);
  if (!normalizedStorecode || !normalizedSellerWalletAddress) {
    throw new Error("storecode and valid sellerWalletAddress are required");
  }

  const serverWalletUser = await getOneServerWalletByStorecodeAndWalletAddress(
    normalizedStorecode,
    normalizedSellerWalletAddress,
  );
  if (!serverWalletUser) {
    throw new Error("sellerWalletAddress must belong to a server wallet user in the same store");
  }

  const resolvedThirdwebServerWallet = await resolveThirdwebServerWalletByAddress(
    normalizedSellerWalletAddress,
  );
  if (!resolvedThirdwebServerWallet) {
    throw new Error("sellerWalletAddress must be an active Thirdweb server wallet");
  }

  if (resolvedThirdwebServerWallet.smartAccountAddress !== normalizedSellerWalletAddress) {
    throw new Error("sellerWalletAddress must be a Thirdweb server wallet smart account address");
  }

  const serverWalletUserSignerAddress = normalizeWalletAddress(serverWalletUser?.signerAddress);
  if (!serverWalletUserSignerAddress || serverWalletUserSignerAddress !== resolvedThirdwebServerWallet.signerAddress) {
    throw new Error("sellerWalletAddress does not match the store server wallet signer");
  }

  const updatedStore = await updateStoreSellerWalletAddress({
    storecode: normalizedStorecode,
    sellerWalletAddress: normalizedSellerWalletAddress,
    audit,
  });
  if (!updatedStore) {
    throw new Error("Store not found");
  }

  const thirdwebWebhookSync = await syncThirdwebWebhookState(baseUrl);

  return {
    sellerWalletAddress: normalizedSellerWalletAddress,
    signerAddress: resolvedThirdwebServerWallet.signerAddress,
    user: serializeUser(serverWalletUser),
    thirdwebWebhookSync,
  };
};
