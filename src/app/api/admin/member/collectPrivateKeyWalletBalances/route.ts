import { NextResponse, type NextRequest } from "next/server";

import { getContract, sendAndConfirmTransaction } from "thirdweb";
import { arbitrum, bsc, ethereum, polygon } from "thirdweb/chains";
import { balanceOf, transfer } from "thirdweb/extensions/erc20";
import { privateKeyToAccount, smartWallet } from "thirdweb/wallets";
import { ethers } from "ethers";

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

export const maxDuration = 300;
export const dynamic = "force-dynamic";

const ROUTE = "/api/admin/member/collectPrivateKeyWalletBalances";
const SIGNING_PREFIX = "stable-georgia:admin-member-private-key-wallet-collect:v1";
const DEFAULT_SCAN_LIMIT = 10000;
const DEFAULT_SCAN_CONCURRENCY = 20;
const DEFAULT_TRANSFER_CONCURRENCY = 3;
const MIN_USDT_BALANCE = 0.1;
const SNAPSHOT_COLLECTION = "adminMemberPrivateKeyWalletBalanceSnapshots";
const SNAPSHOT_KEY = "default";
const MAX_DETAILS_IN_RESPONSE = 200;

type WalletCandidateUser = {
  id?: string | number;
  _id?: unknown;
  nickname?: string;
  role?: string;
  userType?: string;
  storecode?: string;
  walletAddress?: string;
  walletPrivateKey?: string;
  updatedAt?: unknown;
};

type StoreRow = {
  storecode?: string;
  storeName?: string;
  sellerWalletAddress?: string;
};

type TransferTarget = {
  walletAddress: string;
  walletPrivateKey: string;
  storecode: string;
  storeName: string | null;
  sellerWalletAddress: string;
  rawBalance: bigint;
};

type SkipDetail = {
  walletAddress: string | null;
  storecode: string | null;
  sellerWalletAddress: string | null;
  reason: string;
  error?: string;
};

type TransferDetail = {
  walletAddress: string;
  storecode: string;
  storeName: string | null;
  sellerWalletAddress: string;
  amountUsdt: string;
  transactionHash: string;
};

const normalizeString = (value: unknown): string => {
  if (typeof value !== "string") {
    return "";
  }
  return value.trim();
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

const toReasonCounts = (items: SkipDetail[]) => {
  const counts: Record<string, number> = {};
  for (const item of items) {
    const reason = normalizeString(item.reason) || "unknown";
    counts[reason] = (counts[reason] || 0) + 1;
  }
  return counts;
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
  const transferConcurrency = parsePositiveInt(
    process.env.ADMIN_PRIVATEKEY_TRANSFER_CONCURRENCY,
    DEFAULT_TRANSFER_CONCURRENCY,
  );

  const dbClient = await clientPromise;
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
    const walletAddress = normalizeWalletAddress(user.walletAddress);
    const walletPrivateKey = normalizeString(user.walletPrivateKey);
    const storecode = normalizeString(user.storecode);
    return Boolean(walletAddress && walletPrivateKey && storecode);
  });

  const sortedCandidateUsers = [...candidateUsers].sort((left, right) => {
    const leftPriority = getSellerPriority(left);
    const rightPriority = getSellerPriority(right);
    if (leftPriority !== rightPriority) {
      return rightPriority - leftPriority;
    }
    const leftUpdatedAt = toEpochMs(left.updatedAt);
    const rightUpdatedAt = toEpochMs(right.updatedAt);
    return rightUpdatedAt - leftUpdatedAt;
  });

  const uniqueUsersByWallet = new Map<string, WalletCandidateUser>();
  for (const user of sortedCandidateUsers) {
    const walletAddress = normalizeWalletAddress(user.walletAddress);
    if (!walletAddress) {
      continue;
    }
    if (!uniqueUsersByWallet.has(walletAddress)) {
      uniqueUsersByWallet.set(walletAddress, user);
    }
  }

  const deduplicatedUsers = Array.from(uniqueUsersByWallet.values());
  const scanTargetUsers = deduplicatedUsers.slice(0, scanLimit);
  const skippedByScanLimitCount = Math.max(0, deduplicatedUsers.length - scanTargetUsers.length);
  const duplicateWalletCount = Math.max(0, sortedCandidateUsers.length - deduplicatedUsers.length);

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
            sellerWalletAddress: 1,
          },
        },
      )
      .toArray() as StoreRow[]
    : [];

  const storeMap = new Map<string, { storeName: string | null; sellerWalletAddress: string | null }>();
  for (const store of stores) {
    const storecode = normalizeString(store?.storecode);
    if (!storecode) {
      continue;
    }
    storeMap.set(storecode, {
      storeName: normalizeString(store?.storeName) || null,
      sellerWalletAddress: normalizeWalletAddress(store?.sellerWalletAddress) || null,
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

  const scanResults = await mapWithConcurrency(
    scanTargetUsers,
    scanConcurrency,
    async (user) => {
      const walletAddress = normalizeWalletAddress(user.walletAddress);
      const walletPrivateKey = normalizeString(user.walletPrivateKey);
      const storecode = normalizeString(user.storecode);
      const storeInfo = storeMap.get(storecode);
      const sellerWalletAddress = normalizeWalletAddress(storeInfo?.sellerWalletAddress);

      if (!walletAddress || !walletPrivateKey || !storecode) {
        return {
          target: null as TransferTarget | null,
          skipped: {
            walletAddress: walletAddress || null,
            storecode: storecode || null,
            sellerWalletAddress: sellerWalletAddress || null,
            reason: "invalid_user_fields",
          } as SkipDetail,
        };
      }

      if (!sellerWalletAddress) {
        return {
          target: null as TransferTarget | null,
          skipped: {
            walletAddress,
            storecode,
            sellerWalletAddress: null,
            reason: "seller_wallet_missing",
          } as SkipDetail,
        };
      }

      try {
        const rawBalance = await balanceOf({
          contract: usdtContract,
          address: walletAddress,
        });
        const rawBalanceBigInt = BigInt(rawBalance as any);

        if (rawBalanceBigInt < minUsdtRawBalance) {
          return {
            target: null as TransferTarget | null,
            skipped: {
              walletAddress,
              storecode,
              sellerWalletAddress,
              reason: "balance_below_0_1",
            } as SkipDetail,
          };
        }

        return {
          target: {
            walletAddress,
            walletPrivateKey,
            storecode,
            storeName: storeInfo?.storeName || null,
            sellerWalletAddress,
            rawBalance: rawBalanceBigInt,
          } as TransferTarget,
          skipped: null as SkipDetail | null,
        };
      } catch (error) {
        return {
          target: null as TransferTarget | null,
          skipped: {
            walletAddress,
            storecode,
            sellerWalletAddress,
            reason: "balance_read_failed",
            error: error instanceof Error ? error.message : String(error),
          } as SkipDetail,
        };
      }
    },
  );

  const transferTargets = scanResults
    .map((item) => item.target)
    .filter((item): item is TransferTarget => Boolean(item));

  const scanSkipped = scanResults
    .map((item) => item.skipped)
    .filter((item): item is SkipDetail => Boolean(item));

  const transferResults = await mapWithConcurrency(
    transferTargets,
    transferConcurrency,
    async (target) => {
      try {
        const personalAccount = privateKeyToAccount({
          client: thirdwebClient,
          privateKey: target.walletPrivateKey,
        });

        const wallet = smartWallet({
          chain: chainConfig,
          sponsorGas: true,
        });

        const account = await wallet.connect({
          client: thirdwebClient,
          personalAccount,
        });

        const signerAddress = normalizeWalletAddress(account.address);
        if (!signerAddress || signerAddress !== target.walletAddress) {
          return {
            success: null as TransferDetail | null,
            rawTransferred: 0n,
            skipped: {
              walletAddress: target.walletAddress,
              storecode: target.storecode,
              sellerWalletAddress: target.sellerWalletAddress,
              reason: "smart_wallet_mismatch",
            } as SkipDetail,
          };
        }

        const amountUsdt = ethers.utils.formatUnits(target.rawBalance.toString(), usdtDecimals);

        const transaction = transfer({
          contract: usdtContract,
          to: target.sellerWalletAddress,
          amount: amountUsdt,
        });

        const receipt = await sendAndConfirmTransaction({
          transaction,
          account,
        });

        const transactionHash = normalizeString(receipt?.transactionHash);
        if (!transactionHash) {
          return {
            success: null as TransferDetail | null,
            rawTransferred: 0n,
            skipped: {
              walletAddress: target.walletAddress,
              storecode: target.storecode,
              sellerWalletAddress: target.sellerWalletAddress,
              reason: "transaction_hash_missing",
            } as SkipDetail,
          };
        }

        return {
          success: {
            walletAddress: target.walletAddress,
            storecode: target.storecode,
            storeName: target.storeName,
            sellerWalletAddress: target.sellerWalletAddress,
            amountUsdt,
            transactionHash,
          } as TransferDetail,
          rawTransferred: target.rawBalance,
          skipped: null as SkipDetail | null,
        };
      } catch (error) {
        return {
          success: null as TransferDetail | null,
          rawTransferred: 0n,
          skipped: {
            walletAddress: target.walletAddress,
            storecode: target.storecode,
            sellerWalletAddress: target.sellerWalletAddress,
            reason: "transfer_failed",
            error: error instanceof Error ? error.message : String(error),
          } as SkipDetail,
        };
      }
    },
  );

  const transfers = transferResults
    .map((item) => item.success)
    .filter((item): item is TransferDetail => Boolean(item));

  const transferSkipped = transferResults
    .map((item) => item.skipped)
    .filter((item): item is SkipDetail => Boolean(item));

  const skipped = [...scanSkipped, ...transferSkipped];

  const totalTransferredRaw = transferResults.reduce((acc, item) => {
    return acc + item.rawTransferred;
  }, 0n);

  const totalTransferredUsdt = ethers.utils.formatUnits(totalTransferredRaw.toString(), usdtDecimals);

  await dbClient
    .db(dbName)
    .collection(SNAPSHOT_COLLECTION)
    .updateOne(
      { key: SNAPSHOT_KEY },
      {
        $set: {
          key: SNAPSHOT_KEY,
          cooldownUntil: new Date(0),
          updatedAt: new Date(),
          invalidatedBy: "collectPrivateKeyWalletBalances",
        },
      },
      { upsert: true },
    );

  const detailsTruncated =
    transfers.length > MAX_DETAILS_IN_RESPONSE || skipped.length > MAX_DETAILS_IN_RESPONSE;

  return NextResponse.json({
    result: {
      chain,
      minUsdtBalance: MIN_USDT_BALANCE,
      totalTransferredUsdt,
      counts: {
        matchedConditionUserCount: usersWithPrivateKey.length,
        candidateWalletCount: candidateUsers.length,
        deduplicatedWalletCount: deduplicatedUsers.length,
        duplicateWalletCount,
        scannedWalletCount: scanTargetUsers.length,
        skippedByScanLimitCount,
        scanLimitApplied: skippedByScanLimitCount > 0,
        scanLimit,
        scanConcurrency,
        eligibleTransferCount: transferTargets.length,
        transferConcurrency,
        transferredCount: transfers.length,
        skippedCount: skipped.length,
      },
      reasonCounts: toReasonCounts(skipped),
      transfers: transfers.slice(0, MAX_DETAILS_IN_RESPONSE),
      skipped: skipped.slice(0, MAX_DETAILS_IN_RESPONSE),
      detailLimit: MAX_DETAILS_IN_RESPONSE,
      detailsTruncated,
    },
  });
}
