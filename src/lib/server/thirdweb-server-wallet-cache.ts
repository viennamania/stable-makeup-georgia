import { createThirdwebClient, Engine } from "thirdweb";

import clientPromise, { dbName } from "@/lib/mongodb";
import { normalizeWalletAddress } from "@/lib/server/user-read-security";

const SERVER_WALLET_CACHE_COLLECTION = "server_wallet_cache";
const SERVER_WALLET_CACHE_ENTRY_TYPE = "address";
const SERVER_WALLET_CACHE_TTL_MS = Math.max(
  Number.parseInt(process.env.SERVER_WALLET_CACHE_TTL_MS || "", 10) || 5 * 60 * 1000,
  60 * 1000,
);

type ResolvedThirdwebServerWallet = {
  signerAddress: string;
  smartAccountAddress: string;
  label: string;
  source: "cache" | "users" | "engine";
};

type PrimeThirdwebServerWalletCacheInput = {
  signerAddress: unknown;
  smartAccountAddress: unknown;
  label?: unknown;
};

const normalizeString = (value: unknown): string => {
  if (typeof value !== "string") {
    return "";
  }
  return value.trim();
};

const getThirdwebClient = () => {
  const secretKey = normalizeString(process.env.THIRDWEB_SECRET_KEY);
  if (!secretKey) {
    throw new Error("THIRDWEB_SECRET_KEY is required");
  }

  return createThirdwebClient({ secretKey });
};

const toResolvedServerWallet = (
  raw: {
    address?: unknown;
    smartAccountAddress?: unknown;
    label?: unknown;
  },
  source: "cache" | "engine",
): ResolvedThirdwebServerWallet | null => {
  const signerAddress = normalizeWalletAddress(raw.address);
  const smartAccountAddress = normalizeWalletAddress(raw.smartAccountAddress);

  if (!signerAddress || !smartAccountAddress) {
    return null;
  }

  return {
    signerAddress,
    smartAccountAddress,
    label: normalizeString(raw.label),
    source,
  };
};

const getCachedThirdwebServerWalletByAddress = async (
  walletAddress: string,
): Promise<ResolvedThirdwebServerWallet | null> => {
  const client = await clientPromise;
  const collection = client.db(dbName).collection(SERVER_WALLET_CACHE_COLLECTION);

  const cached = await collection.findOne<{
    address?: unknown;
    smartAccountAddress?: unknown;
    label?: unknown;
  }>(
    {
      type: SERVER_WALLET_CACHE_ENTRY_TYPE,
      normalizedAddress: walletAddress,
      expiresAt: { $gt: new Date() },
    },
    {
      projection: {
        _id: 0,
        address: 1,
        smartAccountAddress: 1,
        label: 1,
      },
    },
  );

  if (!cached) {
    return null;
  }

  return toResolvedServerWallet(cached, "cache");
};

const getServerWalletFromAdminUsersByAddress = async (
  walletAddress: string,
): Promise<ResolvedThirdwebServerWallet | null> => {
  const client = await clientPromise;
  const collection = client.db(dbName).collection("users");
  const candidates = Array.from(
    new Set([walletAddress, walletAddress.toLowerCase(), walletAddress.toUpperCase()].filter(Boolean)),
  );
  const escapedWalletAddress = walletAddress.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const walletAddressRegex = new RegExp(`^${escapedWalletAddress}$`, "i");

  let found = await collection.findOne<{
    walletAddress?: unknown;
    signerAddress?: unknown;
    nickname?: unknown;
  }>(
    {
      storecode: { $in: ["admin", "ADMIN"] },
      signerAddress: { $type: "string", $ne: "" },
      verified: true,
      $or: [
        { walletAddress: { $in: candidates } },
        { signerAddress: { $in: candidates } },
      ],
    },
    {
      projection: {
        _id: 0,
        walletAddress: 1,
        signerAddress: 1,
        nickname: 1,
      },
    },
  );

  if (!found) {
    found = await collection.findOne<{
      walletAddress?: unknown;
      signerAddress?: unknown;
      nickname?: unknown;
    }>(
      {
        storecode: { $in: ["admin", "ADMIN"] },
        signerAddress: { $type: "string", $ne: "" },
        verified: true,
        $or: [
          { walletAddress: walletAddressRegex },
          { signerAddress: walletAddressRegex },
        ],
      },
      {
        projection: {
          _id: 0,
          walletAddress: 1,
          signerAddress: 1,
          nickname: 1,
        },
      },
    );
  }

  if (!found) {
    return null;
  }

  const signerAddress = normalizeWalletAddress(found.signerAddress);
  const smartAccountAddress = normalizeWalletAddress(found.walletAddress);

  if (!signerAddress || !smartAccountAddress) {
    return null;
  }

  const resolved: ResolvedThirdwebServerWallet = {
    signerAddress,
    smartAccountAddress,
    label: normalizeString(found.nickname),
    source: "users",
  };

  await writeThirdwebServerWalletToCache(resolved);
  return resolved;
};

const writeThirdwebServerWalletToCache = async ({
  signerAddress,
  smartAccountAddress,
  label,
}: {
  signerAddress: string;
  smartAccountAddress: string;
  label: string;
}) => {
  const client = await clientPromise;
  const collection = client.db(dbName).collection(SERVER_WALLET_CACHE_COLLECTION);
  const now = Date.now();
  const updatedAt = new Date(now);
  const expiresAt = new Date(now + SERVER_WALLET_CACHE_TTL_MS);

  const cacheDoc = {
    type: SERVER_WALLET_CACHE_ENTRY_TYPE,
    address: signerAddress,
    smartAccountAddress,
    label,
    updatedAt,
    expiresAt,
    snapshotVersion: now,
  };

  await Promise.all([
    collection.updateOne(
      {
        type: SERVER_WALLET_CACHE_ENTRY_TYPE,
        normalizedAddress: signerAddress,
      },
      {
        $set: {
          ...cacheDoc,
          normalizedAddress: signerAddress,
        },
      },
      { upsert: true },
    ),
    collection.updateOne(
      {
        type: SERVER_WALLET_CACHE_ENTRY_TYPE,
        normalizedAddress: smartAccountAddress,
      },
      {
        $set: {
          ...cacheDoc,
          normalizedAddress: smartAccountAddress,
        },
      },
      { upsert: true },
    ),
  ]);
};

export const primeThirdwebServerWalletCache = async ({
  signerAddress,
  smartAccountAddress,
  label,
}: PrimeThirdwebServerWalletCacheInput): Promise<ResolvedThirdwebServerWallet | null> => {
  const normalizedSignerAddress = normalizeWalletAddress(signerAddress);
  const normalizedSmartAccountAddress = normalizeWalletAddress(smartAccountAddress);

  if (!normalizedSignerAddress || !normalizedSmartAccountAddress) {
    return null;
  }

  const resolved: ResolvedThirdwebServerWallet = {
    signerAddress: normalizedSignerAddress,
    smartAccountAddress: normalizedSmartAccountAddress,
    label: normalizeString(label),
    source: "engine",
  };

  await writeThirdwebServerWalletToCache(resolved);
  return resolved;
};

const findThirdwebServerWalletByAddressViaEngine = async (
  walletAddress: string,
): Promise<ResolvedThirdwebServerWallet | null> => {
  const thirdwebClient = getThirdwebClient();
  let page = 1;

  while (true) {
    const result = await Engine.getServerWallets({
      client: thirdwebClient,
      page,
      limit: 500,
    });

    const accounts = Array.isArray(result?.accounts) ? result.accounts : [];
    const matched = accounts.find((account) => {
      const signerAddress = normalizeWalletAddress(account?.address);
      const smartAccountAddress = normalizeWalletAddress(account?.smartAccountAddress);

      return walletAddress === signerAddress || walletAddress === smartAccountAddress;
    });

    if (matched) {
      const resolved = toResolvedServerWallet(matched, "engine");
      if (!resolved) {
        return null;
      }

      await writeThirdwebServerWalletToCache(resolved);
      return resolved;
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

export const resolveThirdwebServerWalletByAddress = async (
  walletAddressRaw: unknown,
): Promise<ResolvedThirdwebServerWallet | null> => {
  const walletAddress = normalizeWalletAddress(walletAddressRaw);
  if (!walletAddress) {
    return null;
  }

  const cached = await getCachedThirdwebServerWalletByAddress(walletAddress);
  if (cached) {
    return cached;
  }

  const adminUserResolved = await getServerWalletFromAdminUsersByAddress(walletAddress);
  if (adminUserResolved) {
    return adminUserResolved;
  }

  return findThirdwebServerWalletByAddressViaEngine(walletAddress);
};
