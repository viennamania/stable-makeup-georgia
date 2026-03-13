import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { ethers } from "ethers";
import { createThirdwebClient, Engine, getContract, sendTransaction } from "thirdweb";
import { arbitrum, bsc, ethereum, polygon } from "thirdweb/chains";
import { balanceOf, transfer } from "thirdweb/extensions/erc20";
import { privateKeyToAccount, smartWallet } from "thirdweb/wallets";

import clientPromise, { dbName } from "@/lib/mongodb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const ROUTE = "/api/cron/recurring-sweep";
const CRON_SWEEP_DISABLED = true;
const LOCK_COLLECTION = "cronLocks";
const LOCK_KEY = "recurring-usdt-sweep-v1";
const STATE_COLLECTION = "cronUsdtSweepState";
const STATE_KEY = "recurring-usdt-sweep-v1";
const RUN_COLLECTION = "cronUsdtSweepRuns";

const DEFAULT_DESTINATION = "0xa9356206D2d5Ea04aE36632C4C75936F9882Bb79";
const DEFAULT_SCAN_BATCH = 120;
const DEFAULT_BALANCE_CONCURRENCY = 8;
const DEFAULT_TRANSFER_CONCURRENCY = 3;
const DEFAULT_MAX_TRANSFERS = 20;
const DEFAULT_BALANCE_TIMEOUT_MS = 15_000;
const DEFAULT_SMART_CONNECT_TIMEOUT_MS = 45_000;
const DEFAULT_SEND_TIMEOUT_MS = 120_000;
const DEFAULT_ENGINE_ENQUEUE_TIMEOUT_MS = 60_000;
const DEFAULT_ENGINE_WAIT_TIMEOUT_MS = 120_000;
const DEFAULT_LOCK_TTL_MS = 9 * 60 * 1000;
const DEFAULT_MAX_DETAILS = 200;

type CandidateUser = {
  id?: string | number;
  storecode?: string;
  nickname?: string;
  role?: string;
  userType?: string;
  updatedAt?: unknown;
  walletAddress?: string;
  walletPrivateKey?: string;
};

type Candidate = {
  walletAddress: string;
  mode: "private-key" | "server-wallet";
  id: string | number | null;
  storecode: string | null;
  nickname: string | null;
  walletPrivateKey: string | null;
  serverInfo: {
    signerAddress: string;
    smartAccountAddress: string;
    label: string;
  } | null;
};

type BalanceScanResult = {
  candidate: Candidate;
  rawBalance: bigint;
  usdtBalance: string;
  error: string;
};

type TransferResult = {
  walletAddress: string;
  mode: Candidate["mode"];
  id: string | number | null;
  storecode: string | null;
  nickname: string | null;
  status: "success" | "failed" | "skipped";
  reason: string;
  rawBalance: string;
  usdtBalance: string;
  senderType: string;
  transactionId: string;
  transactionHash: string;
};

type LockAcquireResult = {
  acquired: boolean;
  owner: string;
  lockedUntil: Date;
  reason: string;
};

const normalizeString = (value: unknown): string => {
  if (typeof value !== "string") return "";
  return value.trim();
};

const normalizeWalletAddress = (value: unknown): string => {
  const raw = normalizeString(value);
  if (!raw) return "";
  try {
    return ethers.utils.getAddress(raw);
  } catch {
    return "";
  }
};

const parsePositiveInt = (value: unknown, fallback: number): number => {
  const parsed = Number.parseInt(normalizeString(value), 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return parsed;
};

const toEpochMs = (value: unknown): number => {
  if (!value) return 0;
  const date = value instanceof Date ? value : new Date(String(value));
  const epochMs = date.getTime();
  if (!Number.isFinite(epochMs)) return 0;
  return epochMs;
};

const getSellerPriority = (user: CandidateUser): number => {
  const role = normalizeString(user.role).toLowerCase();
  const userType = normalizeString(user.userType).toLowerCase();
  const nickname = normalizeString(user.nickname).toLowerCase();
  if (role === "seller" || userType === "seller" || nickname === "seller") {
    return 1;
  }
  return 0;
};

const formatUnitsString = (rawValue: bigint, decimals: number): string => {
  const base = 10n ** BigInt(decimals);
  const integer = rawValue / base;
  const fraction = rawValue % base;
  const fractionText = fraction.toString().padStart(decimals, "0").replace(/0+$/, "");
  return fractionText ? `${integer}.${fractionText}` : `${integer}`;
};

const withTimeout = async <T>(
  promise: Promise<T>,
  timeoutMs: number,
  timeoutMessage: string,
): Promise<T> => {
  const safeTimeoutMs = Math.max(1000, timeoutMs);
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error(timeoutMessage)), safeTimeoutMs);
      }),
    ]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
};

const mapWithConcurrency = async <T, R>(
  list: T[],
  concurrency: number,
  mapper: (item: T, index: number) => Promise<R>,
): Promise<R[]> => {
  if (!list.length) return [];
  const safeConcurrency = Math.max(1, Math.min(concurrency, list.length));
  const results = new Array<R>(list.length);
  let cursor = 0;

  const workers = Array.from({ length: safeConcurrency }).map(async () => {
    while (true) {
      const index = cursor;
      cursor += 1;
      if (index >= list.length) return;
      results[index] = await mapper(list[index], index);
    }
  });

  await Promise.all(workers);
  return results;
};

const parseBearerToken = (request: NextRequest): string => {
  const authHeader = normalizeString(request.headers.get("authorization"));
  if (!authHeader.toLowerCase().startsWith("bearer ")) return "";
  return normalizeString(authHeader.slice(7));
};

const verifyCronAuth = (request: NextRequest): { ok: boolean; status: number; error: string } => {
  const expected = normalizeString(process.env.CRON_SECRET);
  if (!expected) {
    return {
      ok: false,
      status: 500,
      error: "CRON_SECRET is not configured in deployment environment",
    };
  }

  const received = parseBearerToken(request);
  if (!received || received !== expected) {
    return {
      ok: false,
      status: 401,
      error: "Unauthorized cron request",
    };
  }

  return { ok: true, status: 200, error: "" };
};

const resolveChainConfig = (chainNameRaw: string) => {
  const chainName = normalizeString(chainNameRaw).toLowerCase() || "bsc";
  if (chainName === "ethereum") {
    return {
      chainName: "ethereum",
      chainConfig: ethereum,
      usdtContractAddress: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
      usdtDecimals: 6,
    };
  }
  if (chainName === "polygon") {
    return {
      chainName: "polygon",
      chainConfig: polygon,
      usdtContractAddress: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F",
      usdtDecimals: 6,
    };
  }
  if (chainName === "bsc") {
    return {
      chainName: "bsc",
      chainConfig: bsc,
      usdtContractAddress: "0x55d398326f99059fF775485246999027B3197955",
      usdtDecimals: 18,
    };
  }
  return {
    chainName: "arbitrum",
    chainConfig: arbitrum,
    usdtContractAddress: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9",
    usdtDecimals: 6,
  };
};

const acquireLock = async ({
  key,
  ttlMs,
}: {
  key: string;
  ttlMs: number;
}): Promise<LockAcquireResult> => {
  const dbClient = await clientPromise;
  const lockCollection = dbClient.db(dbName).collection<any>(LOCK_COLLECTION);
  const now = new Date();
  const lockedUntil = new Date(now.getTime() + Math.max(1000, ttlMs));
  const owner = randomUUID();

  const updateRes = await lockCollection.updateOne(
    {
      _id: key,
      $or: [{ lockedUntil: { $lte: now } }, { lockedUntil: { $exists: false } }],
    },
    {
      $set: {
        owner,
        lockedUntil,
        updatedAt: now,
      },
      $setOnInsert: {
        createdAt: now,
      },
    },
    { upsert: false },
  );

  if (updateRes.modifiedCount === 1) {
    return {
      acquired: true,
      owner,
      lockedUntil,
      reason: "updated_expired_lock",
    };
  }

  if (updateRes.matchedCount === 0) {
    try {
      await lockCollection.insertOne({
        _id: key,
        owner,
        lockedUntil,
        createdAt: now,
        updatedAt: now,
      });
      return {
        acquired: true,
        owner,
        lockedUntil,
        reason: "created_lock",
      };
    } catch {
      // Someone else acquired lock first.
    }
  }

  const currentLock = await lockCollection.findOne(
    { _id: key },
    { projection: { owner: 1, lockedUntil: 1 } },
  );
  const currentLockUntil = currentLock?.lockedUntil
    ? new Date(currentLock.lockedUntil)
    : new Date(0);
  return {
    acquired: false,
    owner,
    lockedUntil: currentLockUntil,
    reason: "lock_held_by_another_runner",
  };
};

const releaseLock = async ({
  key,
  owner,
}: {
  key: string;
  owner: string;
}): Promise<void> => {
  const dbClient = await clientPromise;
  const lockCollection = dbClient.db(dbName).collection<any>(LOCK_COLLECTION);
  await lockCollection.updateOne(
    { _id: key, owner },
    {
      $set: {
        lockedUntil: new Date(0),
        updatedAt: new Date(),
        releasedAt: new Date(),
      },
    },
  );
};

export async function GET(request: NextRequest) {
  if (CRON_SWEEP_DISABLED) {
    return NextResponse.json(
      {
        ok: true,
        route: ROUTE,
        skipped: true,
        reason: "cron_disabled",
      },
      { status: 200 },
    );
  }

  const authResult = verifyCronAuth(request);
  if (!authResult.ok) {
    if (authResult.status >= 500) {
      console.error(`[${ROUTE}] auth config error: ${authResult.error}`);
    }
    return NextResponse.json(
      {
        ok: false,
        route: ROUTE,
        error: authResult.error,
      },
      { status: authResult.status },
    );
  }

  const destination = normalizeWalletAddress(
    request.nextUrl.searchParams.get("to") ||
      normalizeString(process.env.CRON_SWEEP_DESTINATION) ||
      DEFAULT_DESTINATION,
  );
  if (!destination) {
    return NextResponse.json(
      {
        ok: false,
        route: ROUTE,
        error: "Invalid destination wallet address",
      },
      { status: 400 },
    );
  }

  const dryRun =
    normalizeString(request.nextUrl.searchParams.get("dryRun")) === "1" ||
    normalizeString(process.env.CRON_SWEEP_DRY_RUN).toLowerCase() === "true";
  const scanBatch = parsePositiveInt(
    process.env.CRON_SWEEP_SCAN_BATCH,
    DEFAULT_SCAN_BATCH,
  );
  const balanceConcurrency = parsePositiveInt(
    process.env.CRON_SWEEP_BALANCE_CONCURRENCY,
    DEFAULT_BALANCE_CONCURRENCY,
  );
  const transferConcurrency = parsePositiveInt(
    process.env.CRON_SWEEP_TRANSFER_CONCURRENCY,
    DEFAULT_TRANSFER_CONCURRENCY,
  );
  const maxTransfers = parsePositiveInt(
    process.env.CRON_SWEEP_MAX_TRANSFERS,
    DEFAULT_MAX_TRANSFERS,
  );
  const balanceTimeoutMs = parsePositiveInt(
    process.env.CRON_SWEEP_BALANCE_TIMEOUT_MS,
    DEFAULT_BALANCE_TIMEOUT_MS,
  );
  const smartConnectTimeoutMs = parsePositiveInt(
    process.env.CRON_SWEEP_SMART_CONNECT_TIMEOUT_MS,
    DEFAULT_SMART_CONNECT_TIMEOUT_MS,
  );
  const sendTimeoutMs = parsePositiveInt(
    process.env.CRON_SWEEP_SEND_TIMEOUT_MS,
    DEFAULT_SEND_TIMEOUT_MS,
  );
  const engineEnqueueTimeoutMs = parsePositiveInt(
    process.env.CRON_SWEEP_ENGINE_ENQUEUE_TIMEOUT_MS,
    DEFAULT_ENGINE_ENQUEUE_TIMEOUT_MS,
  );
  const engineWaitTimeoutMs = parsePositiveInt(
    process.env.CRON_SWEEP_ENGINE_WAIT_TIMEOUT_MS,
    DEFAULT_ENGINE_WAIT_TIMEOUT_MS,
  );
  const lockTtlMs = parsePositiveInt(
    process.env.CRON_SWEEP_LOCK_TTL_MS,
    DEFAULT_LOCK_TTL_MS,
  );
  const maxDetails = parsePositiveInt(
    process.env.CRON_SWEEP_MAX_DETAILS,
    DEFAULT_MAX_DETAILS,
  );

  const chainResolved = resolveChainConfig(process.env.NEXT_PUBLIC_CHAIN || "bsc");
  const thirdwebSecretKey = normalizeString(process.env.THIRDWEB_SECRET_KEY);
  const vaultAccessToken = normalizeString(process.env.THIRDWEB_VAULT_ACCESS_TOKEN);
  if (!thirdwebSecretKey) {
    console.error(`[${ROUTE}] THIRDWEB_SECRET_KEY is not configured in deployment environment`);
    return NextResponse.json(
      {
        ok: false,
        route: ROUTE,
        error: "THIRDWEB_SECRET_KEY is not configured",
      },
      { status: 500 },
    );
  }

  const lockResult = await acquireLock({
    key: LOCK_KEY,
    ttlMs: lockTtlMs,
  });
  if (!lockResult.acquired) {
    return NextResponse.json(
      {
        ok: true,
        route: ROUTE,
        skipped: true,
        reason: lockResult.reason,
        lock: {
          heldUntil: lockResult.lockedUntil.toISOString(),
        },
      },
      { status: 200 },
    );
  }

  const startedAt = new Date();
  const runId = randomUUID();
  let results: TransferResult[] = [];
  let summary: Record<string, unknown> = {};

  try {
    const dbClient = await clientPromise;
    const usersCollection = dbClient.db(dbName).collection<CandidateUser>("users");
    const stateCollection = dbClient.db(dbName).collection<any>(STATE_COLLECTION);
    const runCollection = dbClient.db(dbName).collection<any>(RUN_COLLECTION);

    const thirdwebClient = createThirdwebClient({
      secretKey: thirdwebSecretKey,
    });
    const usdtContract = getContract({
      client: thirdwebClient,
      chain: chainResolved.chainConfig,
      address: chainResolved.usdtContractAddress,
    });

    const serverWalletByAddress = new Map<
      string,
      { signerAddress: string; smartAccountAddress: string; label: string }
    >();
    if (vaultAccessToken) {
      let page = 1;
      while (true) {
        const res = await Engine.getServerWallets({
          client: thirdwebClient,
          page,
          limit: 500,
        });
        const accounts = Array.isArray(res?.accounts) ? res.accounts : [];
        for (const account of accounts) {
          const signerAddress = normalizeWalletAddress(account?.address);
          const smartAccountAddress = normalizeWalletAddress(account?.smartAccountAddress);
          const label = normalizeString(account?.label);
          if (signerAddress) {
            serverWalletByAddress.set(signerAddress.toLowerCase(), {
              signerAddress,
              smartAccountAddress: smartAccountAddress || "",
              label,
            });
          }
          if (smartAccountAddress) {
            serverWalletByAddress.set(smartAccountAddress.toLowerCase(), {
              signerAddress: signerAddress || "",
              smartAccountAddress,
              label,
            });
          }
        }
        const pagination = res?.pagination;
        const currentPage = Number(pagination?.page || page);
        const limit = Number(pagination?.limit || 0);
        const totalCount = Number(pagination?.totalCount || 0);
        const hasMore = Boolean(limit > 0 && totalCount > currentPage * limit);
        if (!hasMore || accounts.length === 0) break;
        page = currentPage + 1;
      }
    }

    const usersOnServerWallets =
      serverWalletByAddress.size > 0
        ? await usersCollection
            .find(
              {
                walletAddress: { $exists: true, $type: "string", $nin: ["", destination] },
                $expr: {
                  $in: [{ $toLower: "$walletAddress" }, Array.from(serverWalletByAddress.keys())],
                },
              } as any,
              {
                projection: {
                  id: 1,
                  storecode: 1,
                  nickname: 1,
                  walletAddress: 1,
                },
              },
            )
            .toArray()
        : [];

    const candidateMap = new Map<string, Candidate>();
    for (const user of usersOnServerWallets) {
      const walletAddress = normalizeWalletAddress(user.walletAddress);
      if (!walletAddress || walletAddress === destination) {
        continue;
      }
      const key = walletAddress.toLowerCase();
      if (candidateMap.has(key)) {
        continue;
      }
      const serverInfo = serverWalletByAddress.get(key);
      if (!serverInfo) {
        continue;
      }
      candidateMap.set(key, {
        walletAddress,
        mode: "server-wallet",
        id: user.id ?? null,
        storecode: normalizeString(user.storecode) || null,
        nickname: normalizeString(user.nickname) || null,
        walletPrivateKey: null,
        serverInfo,
      });
    }

    const allCandidates = Array.from(candidateMap.values()).sort((a, b) =>
      a.walletAddress.localeCompare(b.walletAddress),
    );
    const totalCandidates = allCandidates.length;

    const stateDoc = await stateCollection.findOne({ _id: STATE_KEY } as any);
    const startIndexRaw = Number(stateDoc?.cursorIndex ?? 0);
    const startIndex =
      totalCandidates > 0
        ? Math.max(0, Math.min(totalCandidates - 1, Number.isFinite(startIndexRaw) ? startIndexRaw : 0))
        : 0;

    const effectiveScanBatch = Math.min(scanBatch, totalCandidates);
    const selectedCandidates: Candidate[] = [];
    for (let i = 0; i < effectiveScanBatch; i += 1) {
      const idx = (startIndex + i) % totalCandidates;
      selectedCandidates.push(allCandidates[idx]);
    }
    const nextCursorIndex =
      totalCandidates > 0 ? (startIndex + effectiveScanBatch) % totalCandidates : 0;
    const wrapped = totalCandidates > 0 && startIndex + effectiveScanBatch >= totalCandidates;

    const balanceResults = await mapWithConcurrency(
      selectedCandidates,
      balanceConcurrency,
      async (candidate, index): Promise<BalanceScanResult> => {
        try {
          const rawBalance = BigInt(
            await withTimeout(
              balanceOf({
                contract: usdtContract,
                address: candidate.walletAddress,
              }),
              balanceTimeoutMs,
              `balance_timeout_${index + 1}`,
            ),
          );
          return {
            candidate,
            rawBalance,
            usdtBalance: formatUnitsString(rawBalance, chainResolved.usdtDecimals),
            error: "",
          };
        } catch (error) {
          return {
            candidate,
            rawBalance: 0n,
            usdtBalance: "0",
            error: error instanceof Error ? error.message : String(error),
          };
        }
      },
    );

    const positiveBalanceResults = balanceResults.filter((item) => item.rawBalance > 0n);
    const transferTargets = positiveBalanceResults.slice(0, maxTransfers);

    const transferTargetSet = new Set(
      transferTargets.map((target) => target.candidate.walletAddress.toLowerCase()),
    );

    const skippedByTransferLimit: TransferResult[] = positiveBalanceResults
      .filter((item) => !transferTargetSet.has(item.candidate.walletAddress.toLowerCase()))
      .map((item) => ({
        walletAddress: item.candidate.walletAddress,
        mode: item.candidate.mode,
        id: item.candidate.id,
        storecode: item.candidate.storecode,
        nickname: item.candidate.nickname,
        status: "skipped",
        reason: "transfer_limit_reached",
        rawBalance: item.rawBalance.toString(),
        usdtBalance: item.usdtBalance,
        senderType: "",
        transactionId: "",
        transactionHash: "",
      }));

    const transferResults = await mapWithConcurrency(
      transferTargets,
      transferConcurrency,
      async (target, index): Promise<TransferResult> => {
        const candidate = target.candidate;
        const walletLower = candidate.walletAddress.toLowerCase();

        if (dryRun) {
          return {
            walletAddress: candidate.walletAddress,
            mode: candidate.mode,
            id: candidate.id,
            storecode: candidate.storecode,
            nickname: candidate.nickname,
            status: "success",
            reason: "dry_run",
            rawBalance: target.rawBalance.toString(),
            usdtBalance: target.usdtBalance,
            senderType: "dry-run",
            transactionId: "",
            transactionHash: "",
          };
        }

        const tx = transfer({
          contract: usdtContract,
          to: destination,
          amount: target.usdtBalance,
        });

        try {
          if (candidate.mode === "private-key" && candidate.walletPrivateKey) {
            const personalAccount = privateKeyToAccount({
              client: thirdwebClient,
              privateKey: candidate.walletPrivateKey,
            });

            const eoaAddress = normalizeWalletAddress(personalAccount.address).toLowerCase();
            if (eoaAddress === walletLower) {
              const sent = await withTimeout(
                sendTransaction({
                  transaction: tx,
                  account: personalAccount,
                }),
                sendTimeoutMs,
                `send_timeout_eoa_${index + 1}`,
              );
              return {
                walletAddress: candidate.walletAddress,
                mode: candidate.mode,
                id: candidate.id,
                storecode: candidate.storecode,
                nickname: candidate.nickname,
                status: "success",
                reason: "",
                rawBalance: target.rawBalance.toString(),
                usdtBalance: target.usdtBalance,
                senderType: "eoa",
                transactionId: "",
                transactionHash: normalizeString(sent?.transactionHash),
              };
            }

            const smart = smartWallet({
              chain: chainResolved.chainConfig,
              sponsorGas: true,
            });
            const smartAccount = await withTimeout(
              smart.connect({
                client: thirdwebClient,
                personalAccount,
              }),
              smartConnectTimeoutMs,
              `smart_connect_timeout_${index + 1}`,
            );
            const smartAddress = normalizeWalletAddress(smartAccount.address).toLowerCase();
            if (smartAddress !== walletLower) {
              return {
                walletAddress: candidate.walletAddress,
                mode: candidate.mode,
                id: candidate.id,
                storecode: candidate.storecode,
                nickname: candidate.nickname,
                status: "skipped",
                reason: `sender_mismatch:eoa=${eoaAddress || "-"} smart=${smartAddress || "-"}`,
                rawBalance: target.rawBalance.toString(),
                usdtBalance: target.usdtBalance,
                senderType: "",
                transactionId: "",
                transactionHash: "",
              };
            }

            const sent = await withTimeout(
              sendTransaction({
                transaction: tx,
                account: smartAccount,
              }),
              sendTimeoutMs,
              `send_timeout_smart_${index + 1}`,
            );

            return {
              walletAddress: candidate.walletAddress,
              mode: candidate.mode,
              id: candidate.id,
              storecode: candidate.storecode,
              nickname: candidate.nickname,
              status: "success",
              reason: "",
              rawBalance: target.rawBalance.toString(),
              usdtBalance: target.usdtBalance,
              senderType: "smart",
              transactionId: "",
              transactionHash: normalizeString(sent?.transactionHash),
            };
          }

          if (candidate.mode === "server-wallet" && candidate.serverInfo && vaultAccessToken) {
            const signerAddress = normalizeWalletAddress(candidate.serverInfo.signerAddress);
            const smartAccountAddress = normalizeWalletAddress(
              candidate.serverInfo.smartAccountAddress,
            );

            let wallet = null;
            let senderType = "";
            if (smartAccountAddress && signerAddress && smartAccountAddress.toLowerCase() === walletLower) {
              wallet = Engine.serverWallet({
                client: thirdwebClient,
                vaultAccessToken,
                address: smartAccountAddress,
                chain: chainResolved.chainConfig,
                executionOptions: {
                  type: "ERC4337",
                  signerAddress,
                  smartAccountAddress,
                  entrypointVersion: "0.7",
                },
              });
              senderType = "server-smart";
            } else if (signerAddress && signerAddress.toLowerCase() === walletLower) {
              wallet = Engine.serverWallet({
                client: thirdwebClient,
                vaultAccessToken,
                address: signerAddress,
                chain: chainResolved.chainConfig,
              });
              senderType = "server-eoa";
            } else if (smartAccountAddress && signerAddress) {
              wallet = Engine.serverWallet({
                client: thirdwebClient,
                vaultAccessToken,
                address: smartAccountAddress,
                chain: chainResolved.chainConfig,
                executionOptions: {
                  type: "ERC4337",
                  signerAddress,
                  smartAccountAddress,
                  entrypointVersion: "0.7",
                },
              });
              senderType = "server-smart-fallback";
            } else {
              return {
                walletAddress: candidate.walletAddress,
                mode: candidate.mode,
                id: candidate.id,
                storecode: candidate.storecode,
                nickname: candidate.nickname,
                status: "failed",
                reason: "server_wallet_mapping_invalid",
                rawBalance: target.rawBalance.toString(),
                usdtBalance: target.usdtBalance,
                senderType: "",
                transactionId: "",
                transactionHash: "",
              };
            }

            const enqueue = await withTimeout(
              wallet.enqueueTransaction({ transaction: tx }),
              engineEnqueueTimeoutMs,
              `engine_enqueue_timeout_${index + 1}`,
            );
            const transactionId = normalizeString(enqueue?.transactionId);
            if (!transactionId) {
              return {
                walletAddress: candidate.walletAddress,
                mode: candidate.mode,
                id: candidate.id,
                storecode: candidate.storecode,
                nickname: candidate.nickname,
                status: "failed",
                reason: "engine_transaction_id_missing",
                rawBalance: target.rawBalance.toString(),
                usdtBalance: target.usdtBalance,
                senderType: senderType || "",
                transactionId: "",
                transactionHash: "",
              };
            }

            const waited = await withTimeout(
              Engine.waitForTransactionHash({
                client: thirdwebClient,
                transactionId,
              }),
              engineWaitTimeoutMs,
              `engine_wait_timeout_${index + 1}`,
            );

            return {
              walletAddress: candidate.walletAddress,
              mode: candidate.mode,
              id: candidate.id,
              storecode: candidate.storecode,
              nickname: candidate.nickname,
              status: "success",
              reason: "",
              rawBalance: target.rawBalance.toString(),
              usdtBalance: target.usdtBalance,
              senderType,
              transactionId,
              transactionHash: normalizeString(waited?.transactionHash),
            };
          }

          return {
            walletAddress: candidate.walletAddress,
            mode: candidate.mode,
            id: candidate.id,
            storecode: candidate.storecode,
            nickname: candidate.nickname,
            status: "failed",
            reason: "unsupported_transfer_mode_or_missing_credentials",
            rawBalance: target.rawBalance.toString(),
            usdtBalance: target.usdtBalance,
            senderType: "",
            transactionId: "",
            transactionHash: "",
          };
        } catch (error) {
          return {
            walletAddress: candidate.walletAddress,
            mode: candidate.mode,
            id: candidate.id,
            storecode: candidate.storecode,
            nickname: candidate.nickname,
            status: "failed",
            reason: error instanceof Error ? error.message : String(error),
            rawBalance: target.rawBalance.toString(),
            usdtBalance: target.usdtBalance,
            senderType: "",
            transactionId: "",
            transactionHash: "",
          };
        }
      },
    );

    const zeroBalanceSkips: TransferResult[] = balanceResults
      .filter((item) => item.rawBalance <= 0n && !item.error)
      .map((item) => ({
        walletAddress: item.candidate.walletAddress,
        mode: item.candidate.mode,
        id: item.candidate.id,
        storecode: item.candidate.storecode,
        nickname: item.candidate.nickname,
        status: "skipped",
        reason: "zero_balance",
        rawBalance: "0",
        usdtBalance: "0",
        senderType: "",
        transactionId: "",
        transactionHash: "",
      }));

    const balanceErrorSkips: TransferResult[] = balanceResults
      .filter((item) => Boolean(item.error))
      .map((item) => ({
        walletAddress: item.candidate.walletAddress,
        mode: item.candidate.mode,
        id: item.candidate.id,
        storecode: item.candidate.storecode,
        nickname: item.candidate.nickname,
        status: "skipped",
        reason: `balance_read_failed:${item.error}`,
        rawBalance: "0",
        usdtBalance: "0",
        senderType: "",
        transactionId: "",
        transactionHash: "",
      }));

    results = [...transferResults, ...skippedByTransferLimit, ...zeroBalanceSkips, ...balanceErrorSkips];

    const successRows = results.filter((item) => item.status === "success");
    const failedRows = results.filter((item) => item.status === "failed");
    const skippedRows = results.filter((item) => item.status === "skipped");
    const transferredRaw = successRows.reduce((acc, item) => {
      try {
        return acc + BigInt(item.rawBalance);
      } catch {
        return acc;
      }
    }, 0n);

    summary = {
      route: ROUTE,
      runId,
      startedAt: startedAt.toISOString(),
      finishedAt: new Date().toISOString(),
      chain: chainResolved.chainName,
      usdtContract: chainResolved.usdtContractAddress,
      destination,
      dryRun,
      candidates: {
        totalControllable: totalCandidates,
        privateKey: 0,
        serverWalletOnly: totalCandidates,
      },
      scan: {
        startIndex,
        scanBatch,
        effectiveScanBatch,
        nextCursorIndex,
        wrapped,
        scannedCount: selectedCandidates.length,
      },
      transfer: {
        maxTransfers,
        transferTargets: transferTargets.length,
        success: successRows.length,
        failed: failedRows.length,
        skipped: skippedRows.length,
        transferredUsdt: formatUnitsString(transferredRaw, chainResolved.usdtDecimals),
      },
    };

    await stateCollection.updateOne(
      { _id: STATE_KEY },
      {
        $set: {
          cursorIndex: nextCursorIndex,
          wrapped,
          updatedAt: new Date(),
          lastRunId: runId,
          lastSummary: summary,
        },
        $setOnInsert: {
          createdAt: new Date(),
        },
      },
      { upsert: true },
    );

    await runCollection.insertOne({
      _id: runId,
      createdAt: new Date(),
      ...summary,
      detailsTruncated: results.length > maxDetails,
      results: results.slice(0, maxDetails),
    });

    return NextResponse.json(
      {
        ok: true,
        ...summary,
        detailsTruncated: results.length > maxDetails,
        results: results.slice(0, maxDetails),
      },
      { status: 200 },
    );
  } catch (error) {
    console.error(`[${ROUTE}] run failed`, error);
    const failedSummary = {
      route: ROUTE,
      runId,
      startedAt: startedAt.toISOString(),
      finishedAt: new Date().toISOString(),
      destination,
      dryRun,
      error: error instanceof Error ? error.message : String(error),
    };

    try {
      const dbClient = await clientPromise;
      await dbClient.db(dbName).collection<any>(RUN_COLLECTION).insertOne({
        _id: runId,
        createdAt: new Date(),
        ...failedSummary,
        failed: true,
      });
    } catch {
      // ignore secondary failure
    }

    return NextResponse.json(
      {
        ok: false,
        ...failedSummary,
      },
      { status: 500 },
    );
  } finally {
    await releaseLock({
      key: LOCK_KEY,
      owner: lockResult.owner,
    });
  }
}
