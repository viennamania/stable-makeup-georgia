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

const IN_PROGRESS_BUY_ORDER_STATUSES = [
  "ordered",
  "accepted",
  "paymentRequested",
];

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

  const dbClient = await clientPromise;
  const snapshotCollection = dbClient
    .db(dbName)
    .collection(SNAPSHOT_COLLECTION);
  const snapshot = await snapshotCollection.findOne({ key: SNAPSHOT_KEY });
  const now = new Date();

  const existingCooldownUntil = snapshot?.cooldownUntil
    ? new Date(snapshot.cooldownUntil)
    : null;

  if (
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
  const buyOrdersCollection = dbClient.db(dbName).collection("buyorders");
  const storesCollection = dbClient.db(dbName).collection("stores");

  const usersWithPrivateKey = await usersCollection
    .find(
      {
        walletAddress: { $exists: true, $ne: null, $nin: [""] },
        walletPrivateKey: { $exists: true, $ne: null, $nin: [""] },
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
        },
      },
    )
    .toArray() as WalletCandidateUser[];

  const inProgressBuyerOrders = await buyOrdersCollection
    .find(
      {
        status: { $in: IN_PROGRESS_BUY_ORDER_STATUSES },
        "buyer.walletAddress": { $exists: true, $ne: null, $nin: [""] },
      },
      {
        projection: {
          "buyer.walletAddress": 1,
        },
      },
    )
    .toArray();

  const inProgressBuyerWalletSet = new Set<string>();
  for (const order of inProgressBuyerOrders) {
    const normalized = normalizeWalletAddress(order?.buyer?.walletAddress);
    if (normalized) {
      inProgressBuyerWalletSet.add(normalized);
    }
  }

  const candidateUsers = usersWithPrivateKey.filter((user) => {
    const normalizedWalletAddress = normalizeWalletAddress(user.walletAddress);
    if (!normalizedWalletAddress) {
      return false;
    }
    return !inProgressBuyerWalletSet.has(normalizedWalletAddress);
  });

  const storecodes = Array.from(
    new Set(
      candidateUsers
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
  const usdtContract = getContract({
    client: thirdwebClient,
    chain: chainConfig,
    address: contractAddressUSDT,
  });

  const scannedBalanceResults = await mapWithConcurrency(
    candidateUsers,
    8,
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
        const usdtBalance = Number(rawBalance) / 10 ** usdtDecimals;
        if (!Number.isFinite(usdtBalance) || usdtBalance <= 0) {
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
    usersWithPrivateKeyCount: usersWithPrivateKey.length,
    excludedInProgressBuyerWalletCount:
      usersWithPrivateKey.length - candidateUsers.length,
    scannedWalletCount: candidateUsers.length,
    positiveBalanceCount: items.length,
  };

  await snapshotCollection.updateOne(
    { key: SNAPSHOT_KEY },
    {
      $set: {
        key: SNAPSHOT_KEY,
        chain,
        token: "USDT",
        inProgressStatuses: IN_PROGRESS_BUY_ORDER_STATUSES,
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
