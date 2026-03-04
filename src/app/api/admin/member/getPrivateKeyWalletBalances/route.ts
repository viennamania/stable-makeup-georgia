import { NextResponse, type NextRequest } from "next/server";

import { getContract } from "thirdweb";
import { arbitrum, bsc, ethereum, polygon } from "thirdweb/chains";
import { balanceOf } from "thirdweb/extensions/erc20";

import clientPromise, { dbName } from "@/lib/mongodb";
import { client as thirdwebClient } from "@/app/client";
import {
  arbitrumContractAddressUSDT,
  bscContractAddressUSDT,
  chain,
  ethereumContractAddressUSDT,
  polygonContractAddressUSDT,
} from "@/app/config/contractAddresses";
import { verifyAdminSignedAction } from "@/lib/server/admin-action-security";
import { normalizeWalletAddress } from "@/lib/server/user-read-security";

const ROUTE = "/api/admin/member/getPrivateKeyWalletBalances";
const SIGNING_PREFIX = "stable-georgia:admin-member-private-key-wallet-balances:v1";
const SNAPSHOT_COLLECTION = "adminMemberPrivateKeyWalletBalanceSnapshots";
const SNAPSHOT_KEY = "default";
const COOLDOWN_MS = 10 * 60 * 1000;
const DEFAULT_SCAN_LIMIT = 10000;
const DEFAULT_SCAN_CONCURRENCY = 20;
const MIN_USDT_BALANCE = 0.1;

type WalletCandidateUser = {
  id?: string | number;
  _id?: unknown;
  nickname?: string;
  name?: string;
  mobile?: string;
  role?: string;
  userType?: string;
  storecode?: string;
  walletAddress?: string;
  walletPrivateKey?: string;
  updatedAt?: unknown;
};

const normalizeString = (value: unknown): string => {
  if (typeof value !== "string") {
    return "";
  }
  return value.trim();
};

const toIsoString = (value: unknown): string | null => {
  if (!value) {
    return null;
  }
  const date = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date.toISOString();
};

const parsePositiveInt = (value: unknown, fallback: number): number => {
  const parsed = Number.parseInt(normalizeString(value), 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return parsed;
};

const toEpochMs = (value: unknown): number => {
  if (!value) {
    return 0;
  }
  const date = value instanceof Date ? value : new Date(String(value));
  const epochMs = date.getTime();
  if (!Number.isFinite(epochMs)) {
    return 0;
  }
  return epochMs;
};

const getSellerPriority = (user: WalletCandidateUser): number => {
  const role = normalizeString(user.role).toLowerCase();
  const userType = normalizeString(user.userType).toLowerCase();
  const nickname = normalizeString(user.nickname).toLowerCase();
  if (role === "seller" || userType === "seller" || nickname === "seller") {
    return 1;
  }
  return 0;
};

const mapWithConcurrency = async <T, R>(
  list: T[],
  concurrency: number,
  mapper: (item: T, index: number) => Promise<R>,
) => {
  if (list.length === 0) {
    return [] as R[];
  }

  const safeConcurrency = Math.max(1, Math.min(concurrency, list.length));
  const results = new Array<R>(list.length);
  let cursor = 0;

  const workers = Array.from({ length: safeConcurrency }).map(async () => {
    while (true) {
      const index = cursor;
      cursor += 1;
      if (index >= list.length) {
        return;
      }
      results[index] = await mapper(list[index], index);
    }
  });

  await Promise.all(workers);
  return results;
};

export async function POST(request: NextRequest) {
  let body: Record<string, unknown> = {};
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    body = {};
  }

  const authResult = await verifyAdminSignedAction({
    request,
    route: ROUTE,
    signingPrefix: SIGNING_PREFIX,
    requesterStorecodeRaw: body.requesterStorecode ?? "admin",
    requesterWalletAddressRaw: body.requesterWalletAddress,
    signatureRaw: body.signature,
    signedAtRaw: body.signedAt,
    nonceRaw: body.nonce,
    actionFields: {},
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

  const scanLimit = parsePositiveInt(
    process.env.ADMIN_PRIVATEKEY_BALANCE_SCAN_LIMIT,
    DEFAULT_SCAN_LIMIT,
  );
  const scanConcurrency = parsePositiveInt(
    process.env.ADMIN_PRIVATEKEY_BALANCE_CONCURRENCY,
    DEFAULT_SCAN_CONCURRENCY,
  );

  const dbClient = await clientPromise;
  const snapshotCollection = dbClient
    .db(dbName)
    .collection(SNAPSHOT_COLLECTION);
  const snapshot = await snapshotCollection.findOne({ key: SNAPSHOT_KEY });
  const now = new Date();
  const snapshotMinUsdtBalance = Number(snapshot?.queryFilter?.minUsdtBalance || 0);
  const snapshotScanLimit = Number(snapshot?.counts?.scanLimit || 0);
  const isSnapshotCompatible =
    snapshotMinUsdtBalance >= MIN_USDT_BALANCE
    && snapshotScanLimit === scanLimit;

  const existingCooldownUntil = snapshot?.cooldownUntil
    ? new Date(snapshot.cooldownUntil)
    : null;

  if (
    isSnapshotCompatible
    &&
    existingCooldownUntil
    && Number.isFinite(existingCooldownUntil.getTime())
    && existingCooldownUntil.getTime() > now.getTime()
  ) {
    const remainingSeconds = Math.max(
      0,
      Math.ceil((existingCooldownUntil.getTime() - now.getTime()) / 1000),
    );

    return NextResponse.json({
      result: {
        fromCache: true,
        fetchedAt: toIsoString(snapshot?.fetchedAt),
        cooldownUntil: toIsoString(existingCooldownUntil),
        remainingSeconds,
        canReadFresh: false,
        counts: snapshot?.counts || null,
        items: Array.isArray(snapshot?.items) ? snapshot.items : [],
      },
    });
  }

  const usersCollection = dbClient.db(dbName).collection("users");
  const storesCollection = dbClient.db(dbName).collection("stores");

  const usersWithPrivateKey = await usersCollection
    .find(
      {
        walletAddress: { $exists: true, $ne: null, $nin: [""] },
        walletPrivateKey: { $exists: true, $ne: null, $nin: [""] },
        buyOrderStatus: "paymentConfirmed",
      },
      {
        projection: {
          id: 1,
          _id: 1,
          nickname: 1,
          name: 1,
          mobile: 1,
          role: 1,
          userType: 1,
          storecode: 1,
          walletAddress: 1,
          walletPrivateKey: 1,
          updatedAt: 1,
        },
      },
    )
    .toArray() as WalletCandidateUser[];

  const candidateUsers = usersWithPrivateKey.filter((user) => {
    const normalizedWalletAddress = normalizeWalletAddress(user.walletAddress);
    return Boolean(normalizedWalletAddress);
  });

  const sortedCandidateUsers = [...candidateUsers].sort((left, right) => {
    const leftPriority = getSellerPriority(left);
    const rightPriority = getSellerPriority(right);
    if (leftPriority !== rightPriority) {
      return rightPriority - leftPriority;
    }
    const leftUpdatedAt = toEpochMs(left.updatedAt);
    const rightUpdatedAt = toEpochMs(right.updatedAt);
    if (leftUpdatedAt === rightUpdatedAt) {
      return 0;
    }
    return rightUpdatedAt - leftUpdatedAt;
  });

  const scanTargetUsers = sortedCandidateUsers.slice(0, scanLimit);
  const skippedByScanLimitCount = Math.max(
    0,
    sortedCandidateUsers.length - scanTargetUsers.length,
  );

  const storecodes = Array.from(
    new Set(
      scanTargetUsers
        .map((user) => normalizeString(user.storecode))
        .filter(Boolean),
    ),
  );

  const stores = storecodes.length > 0
    ? await storesCollection
      .find(
        {
          storecode: { $in: storecodes },
        },
        {
          projection: {
            storecode: 1,
            storeName: 1,
          },
        },
      )
      .toArray()
    : [];

  const storeMap = new Map<string, { storecode: string; storeName: string }>();
  for (const store of stores) {
    const storecode = normalizeString(store?.storecode);
    if (!storecode) {
      continue;
    }
    storeMap.set(storecode, {
      storecode,
      storeName: normalizeString(store?.storeName),
    });
  }

  const chainConfig =
    chain === "ethereum" ? ethereum
      : chain === "polygon" ? polygon
        : chain === "arbitrum" ? arbitrum
          : chain === "bsc" ? bsc
            : arbitrum;

  const contractAddressUSDT =
    chain === "ethereum" ? ethereumContractAddressUSDT
      : chain === "polygon" ? polygonContractAddressUSDT
        : chain === "arbitrum" ? arbitrumContractAddressUSDT
          : chain === "bsc" ? bscContractAddressUSDT
            : arbitrumContractAddressUSDT;

  const usdtDecimals = chain === "bsc" ? 18 : 6;
  const minUsdtRawBalance = BigInt(10) ** BigInt(Math.max(0, usdtDecimals - 1));
  const usdtContract = getContract({
    client: thirdwebClient,
    chain: chainConfig,
    address: contractAddressUSDT,
  });

  const scannedBalanceResults = await mapWithConcurrency(
    scanTargetUsers,
    scanConcurrency,
    async (user) => {
      const normalizedWalletAddress = normalizeWalletAddress(user.walletAddress);
      if (!normalizedWalletAddress) {
        return null;
      }

      try {
        const rawBalance = await balanceOf({
          contract: usdtContract,
          address: normalizedWalletAddress,
        });
        if (rawBalance < minUsdtRawBalance) {
          return null;
        }
        const usdtBalance = Number(rawBalance) / 10 ** usdtDecimals;
        if (!Number.isFinite(usdtBalance)) {
          return null;
        }

        const storecode = normalizeString(user.storecode);
        const storeInfo = storeMap.get(storecode);

        return {
          member: {
            id: user.id ?? null,
            _id: user._id ?? null,
            nickname: normalizeString(user.nickname) || null,
            name: normalizeString(user.name) || null,
            mobile: normalizeString(user.mobile) || null,
            role: normalizeString(user.role) || null,
            userType: normalizeString(user.userType) || null,
            storecode: storecode || null,
          },
          store: {
            storecode: storecode || null,
            storeName: storeInfo?.storeName || null,
          },
          walletAddress: normalizedWalletAddress,
          usdtBalance: Number(usdtBalance.toFixed(6)),
        };
      } catch (error) {
        return null;
      }
    },
  );

  const items = scannedBalanceResults
    .filter((item) => Boolean(item))
    .sort((left, right) => {
      const leftBalance = Number(left?.usdtBalance || 0);
      const rightBalance = Number(right?.usdtBalance || 0);
      return rightBalance - leftBalance;
    });

  const fetchedAt = new Date();
  const cooldownUntil = new Date(fetchedAt.getTime() + COOLDOWN_MS);
  const counts = {
    matchedConditionUserCount: usersWithPrivateKey.length,
    candidateWalletCount: candidateUsers.length,
    scannedWalletCount: scanTargetUsers.length,
    skippedByScanLimitCount,
    scanLimitApplied: skippedByScanLimitCount > 0,
    scanLimit,
    scanConcurrency,
    positiveBalanceCount: items.length,
  };

  await snapshotCollection.updateOne(
    { key: SNAPSHOT_KEY },
    {
      $set: {
        key: SNAPSHOT_KEY,
        chain,
        token: "USDT",
        queryFilter: {
          walletPrivateKeyExists: true,
          walletAddressExists: true,
          buyOrderStatus: "paymentConfirmed",
          minUsdtBalance: MIN_USDT_BALANCE,
        },
        fetchedAt,
        cooldownUntil,
        updatedAt: fetchedAt,
        requestedBy: {
          walletAddress: authResult.requesterWalletAddress,
          storecode: authResult.requesterStorecode,
          nickname: authResult.requesterUser?.nickname || null,
          role: authResult.requesterUser?.role || null,
        },
        counts,
        items,
      },
      $setOnInsert: {
        createdAt: fetchedAt,
      },
    },
    { upsert: true },
  );

  return NextResponse.json({
    result: {
      fromCache: false,
      fetchedAt: fetchedAt.toISOString(),
      cooldownUntil: cooldownUntil.toISOString(),
      remainingSeconds: Math.ceil(COOLDOWN_MS / 1000),
      canReadFresh: false,
      counts,
      items,
    },
  });
}
