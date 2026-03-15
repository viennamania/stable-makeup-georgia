import { createThirdwebClient, Engine } from "thirdweb";

import {
  getStoreByStorecode,
  updateStoreSettlementWalletAddress,
} from "@lib/api/store";
import {
  getAllUsersByStorecodeFiltered,
  getOneServerWalletByStorecodeAndWalletAddress,
  upsertStoreServerWalletUser,
} from "@lib/api/user";
import { syncThirdwebSellerUsdtWebhooks } from "@/lib/server/thirdweb-insight-webhook-sync";
import { resolveThirdwebServerWalletByAddress } from "@/lib/server/thirdweb-server-wallet-cache";
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

type StorePaymentWalletCandidate = SerializableServerWalletUser & {
  thirdwebLabel: string;
  thirdwebSource: "cache" | "engine" | null;
  isActiveThirdwebWallet: boolean;
  isSmartAccountMatch: boolean;
  signerMatches: boolean;
  assignmentEligible: boolean;
  isCurrentSettlementWallet: boolean;
};

type StorePaymentWalletOverview = {
  store: SerializableStore;
  walletCandidates: StorePaymentWalletCandidate[];
  totalCandidateCount: number;
  eligibleCandidateCount: number;
};

type StorePaymentWalletMutationResult = {
  created: boolean;
  engineWalletCreated: boolean;
  settlementWalletAddress: string;
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

const serializeStore = (store: any): SerializableStore => ({
  storecode: normalizeString(store?.storecode).toLowerCase(),
  storeName: normalizeString(store?.storeName),
  storeLogo: normalizeString(store?.storeLogo),
  sellerWalletAddress: normalizeWalletAddress(store?.sellerWalletAddress),
  privateSellerWalletAddress: normalizeWalletAddress(store?.privateSellerWalletAddress),
  settlementWalletAddress: normalizeWalletAddress(store?.settlementWalletAddress),
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

const findServerWalletByLabel = async ({
  client,
  label,
}: {
  client: ReturnType<typeof createThirdwebClient>;
  label: string;
}) => {
  let page = 1;

  while (true) {
    const result = await Engine.getServerWallets({
      client,
      page,
      limit: 500,
    });

    const accounts = Array.isArray(result?.accounts) ? result.accounts : [];
    const matched = accounts.find(
      (account) => normalizeString(account?.label) === label,
    );

    if (matched) {
      return matched;
    }

    const pagination = result?.pagination;
    const currentPage = Number(pagination?.page || page);
    const limit = Number(pagination?.limit || 0);
    const totalCount = Number(pagination?.totalCount || 0);
    const hasMore = Boolean(limit > 0 && totalCount > currentPage * limit);

    if (!hasMore || accounts.length === 0) {
      return null;
    }

    page = currentPage + 1;
  }
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
}: {
  user: any;
  currentSettlementWalletAddress: string | null;
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
  };
};

const loadStoreServerWalletCandidates = async ({
  storecode,
  currentSettlementWalletAddress,
}: {
  storecode: string;
  currentSettlementWalletAddress: string | null;
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
      }),
    ),
  );

  return walletCandidates.sort((left, right) => {
    if (left.isCurrentSettlementWallet !== right.isCurrentSettlementWallet) {
      return left.isCurrentSettlementWallet ? -1 : 1;
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
  });

  return {
    store: serializedStore,
    walletCandidates,
    totalCandidateCount: walletCandidates.length,
    eligibleCandidateCount: walletCandidates.filter((item) => item.assignmentEligible).length,
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
  let engineWallet = await findServerWalletByLabel({ client, label });
  let engineWalletCreated = false;

  if (!engineWallet) {
    engineWallet = await Engine.createServerWallet({
      client,
      label,
    });
    engineWalletCreated = true;
  }

  let signerAddress = normalizeWalletAddress(engineWallet?.address);
  let smartAccountAddress = normalizeWalletAddress(engineWallet?.smartAccountAddress);

  if (!smartAccountAddress) {
    const refreshedWallet = await findServerWalletByLabel({ client, label });
    signerAddress = normalizeWalletAddress(refreshedWallet?.address || signerAddress);
    smartAccountAddress = normalizeWalletAddress(refreshedWallet?.smartAccountAddress);
  }

  if (!signerAddress || !smartAccountAddress) {
    throw new Error("Failed to resolve created Thirdweb server wallet addresses");
  }

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
