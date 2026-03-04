#!/usr/bin/env node

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { MongoClient } from "mongodb";

import { ethers } from "ethers";
import {
  createThirdwebClient,
  Engine,
  getContract,
  sendAndConfirmTransaction,
} from "thirdweb";
import { transfer, balanceOf } from "thirdweb/extensions/erc20";
import { arbitrum, bsc, ethereum, polygon } from "thirdweb/chains";
import { smartWallet, privateKeyToAccount } from "thirdweb/wallets";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

const DEFAULT_NICKNAME = "seller";
const DEFAULT_EXCLUDE_STORECODE = "admin";

const parseEnvFile = (filePath) => {
  const result = {};
  const source = fs.readFileSync(filePath, "utf8");

  for (const line of source.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }
    const delimiterIndex = trimmed.indexOf("=");
    if (delimiterIndex <= 0) {
      continue;
    }
    const key = trimmed.slice(0, delimiterIndex).trim();
    const rawValue = trimmed.slice(delimiterIndex + 1).trim();
    result[key] = rawValue.replace(/^"|"$/g, "");
  }

  return result;
};

const normalizeString = (value) => {
  if (typeof value !== "string") {
    return "";
  }
  return value.trim();
};

const normalizeWalletAddress = (value) => {
  const safe = normalizeString(value);
  if (!safe) {
    return "";
  }
  try {
    return ethers.utils.getAddress(safe);
  } catch {
    return "";
  }
};

const formatUnitsString = (rawValue, decimals) => {
  const raw = BigInt(rawValue);
  const base = BigInt(10) ** BigInt(decimals);
  const integer = raw / base;
  const fraction = raw % base;
  const fractionText = fraction
    .toString()
    .padStart(decimals, "0")
    .replace(/0+$/, "");
  return fractionText ? `${integer}.${fractionText}` : `${integer}`;
};

const parseArgs = (argv) => {
  const args = {
    execute: false,
    yes: false,
    mode: "auto",
    to: "",
    nickname: DEFAULT_NICKNAME,
    excludeStorecode: DEFAULT_EXCLUDE_STORECODE,
    includeStorecode: "",
    limit: 1000,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--execute") {
      args.execute = true;
      continue;
    }
    if (token === "--yes") {
      args.yes = true;
      continue;
    }
    if (token === "--mode") {
      args.mode = (argv[i + 1] || "auto").toLowerCase();
      i += 1;
      continue;
    }
    if (token === "--to") {
      args.to = argv[i + 1] || "";
      i += 1;
      continue;
    }
    if (token === "--nickname") {
      args.nickname = argv[i + 1] || DEFAULT_NICKNAME;
      i += 1;
      continue;
    }
    if (token === "--exclude-storecode") {
      args.excludeStorecode = argv[i + 1] || DEFAULT_EXCLUDE_STORECODE;
      i += 1;
      continue;
    }
    if (token === "--include-storecode") {
      args.includeStorecode = argv[i + 1] || "";
      i += 1;
      continue;
    }
    if (token === "--limit") {
      const value = Number(argv[i + 1]);
      args.limit = Number.isFinite(value) && value > 0 ? Math.floor(value) : args.limit;
      i += 1;
      continue;
    }
  }

  return args;
};

const mapWithConcurrency = async (items, concurrency, mapper) => {
  if (!items.length) {
    return [];
  }

  const safeConcurrency = Math.max(1, Math.min(concurrency, items.length));
  const result = new Array(items.length);
  let cursor = 0;

  const workers = Array.from({ length: safeConcurrency }).map(async () => {
    while (true) {
      const index = cursor;
      cursor += 1;
      if (index >= items.length) {
        return;
      }
      result[index] = await mapper(items[index], index);
    }
  });

  await Promise.all(workers);
  return result;
};

const main = async () => {
  const args = parseArgs(process.argv.slice(2));
  const envPath = path.resolve(projectRoot, ".env");
  const env = parseEnvFile(envPath);
  const mode = normalizeString(args.mode || "auto").toLowerCase();

  const mongoUri = normalizeString(env.MONGODB_URI);
  const dbName = normalizeString(env.MONGODB_DB_NAME) || "georgia";
  const thirdwebSecretKey = normalizeString(env.THIRDWEB_SECRET_KEY);
  const vaultAccessToken = normalizeString(env.THIRDWEB_VAULT_ACCESS_TOKEN);

  if (!mongoUri) {
    throw new Error("MONGODB_URI is required in .env");
  }
  if (!thirdwebSecretKey) {
    throw new Error("THIRDWEB_SECRET_KEY is required in .env");
  }

  const destinationRaw = normalizeString(args.to);
  const destination = destinationRaw ? normalizeWalletAddress(destinationRaw) : "";
  if (destinationRaw && !destination) {
    throw new Error(`Invalid --to wallet address: ${args.to}`);
  }
  if (args.execute && !destination) {
    throw new Error("Execution blocked. --to <walletAddress> is required for --execute.");
  }
  if (!["auto", "private-key", "server-wallet"].includes(mode)) {
    throw new Error(`Invalid --mode value: ${args.mode}`);
  }
  if (mode === "server-wallet" && !vaultAccessToken) {
    throw new Error("THIRDWEB_VAULT_ACCESS_TOKEN is required for --mode server-wallet");
  }

  const chainName = normalizeString(env.NEXT_PUBLIC_CHAIN).toLowerCase() || "arbitrum";
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

  const thirdwebClient = createThirdwebClient({
    secretKey: thirdwebSecretKey,
  });

  const usdtContract = getContract({
    client: thirdwebClient,
    chain: chainConfig,
    address: usdtContractAddress,
  });

  const mongoClient = new MongoClient(mongoUri);
  await mongoClient.connect();

  try {
    const usersCollection = mongoClient.db(dbName).collection("users");
    const query = {
      nickname: { $regex: `^${args.nickname}$`, $options: "i" },
      walletAddress: { $exists: true, $ne: null, $nin: [""] },
      ...(args.includeStorecode
        ? { storecode: args.includeStorecode }
        : { storecode: { $not: new RegExp(`^${args.excludeStorecode}$`, "i") } }),
    };

    const rawUsers = await usersCollection
      .find(query, {
        projection: {
          _id: 0,
          id: 1,
          storecode: 1,
          nickname: 1,
          walletAddress: 1,
          walletPrivateKey: 1,
        },
      })
      .limit(args.limit)
      .toArray();

    const dedupMap = new Map();
    for (const user of rawUsers) {
      const walletAddress = normalizeWalletAddress(user.walletAddress);
      if (!walletAddress) {
        continue;
      }
      const key = walletAddress.toLowerCase();
      if (!dedupMap.has(key)) {
        dedupMap.set(key, {
          id: user.id ?? null,
          storecode: normalizeString(user.storecode),
          nickname: normalizeString(user.nickname),
          walletAddress,
          walletPrivateKey: normalizeString(user.walletPrivateKey) || null,
        });
      }
    }

    const users = Array.from(dedupMap.values());
    const balanceRows = await mapWithConcurrency(users, 8, async (user) => {
      try {
        const rawBalance = await balanceOf({
          contract: usdtContract,
          address: user.walletAddress,
        });
        const raw = BigInt(rawBalance);
        if (raw <= 0n) {
          return null;
        }
        return {
          ...user,
          rawBalance: raw.toString(),
          usdtBalance: formatUnitsString(raw, usdtDecimals),
          hasWalletPrivateKey: Boolean(user.walletPrivateKey),
        };
      } catch (error) {
        return {
          ...user,
          rawBalance: "0",
          usdtBalance: "error",
          hasWalletPrivateKey: Boolean(user.walletPrivateKey),
          balanceError: error instanceof Error ? error.message : String(error),
        };
      }
    });

    const positiveRows = balanceRows
      .filter((item) => item && item.usdtBalance !== "error" && BigInt(item.rawBalance) > 0n)
      .sort((left, right) => {
        return BigInt(right.rawBalance) > BigInt(left.rawBalance) ? 1 : -1;
      });
    const usePrivateKey = mode === "auto" || mode === "private-key";
    const useServerWallet = mode === "auto" || mode === "server-wallet";
    const serverWalletByAddress = new Map();

    if (useServerWallet && vaultAccessToken) {
      const serverWallets = await Engine.getServerWallets({
        client: thirdwebClient,
        limit: 500,
        page: 1,
      });
      const accounts = Array.isArray(serverWallets?.accounts) ? serverWallets.accounts : [];
      for (const account of accounts) {
        const signerAddress = normalizeWalletAddress(account?.address);
        const smartAccountAddress = normalizeWalletAddress(account?.smartAccountAddress);
        const mapped = {
          signerAddress,
          smartAccountAddress,
          label: normalizeString(account?.label),
        };
        if (signerAddress) {
          serverWalletByAddress.set(signerAddress.toLowerCase(), mapped);
        }
        if (smartAccountAddress) {
          serverWalletByAddress.set(smartAccountAddress.toLowerCase(), mapped);
        }
      }
    }

    const transferCandidateRows = positiveRows.map((row) => {
      const walletKey = row.walletAddress.toLowerCase();
      const serverWallet = serverWalletByAddress.get(walletKey) || null;
      const canByPrivateKey = usePrivateKey && Boolean(row.hasWalletPrivateKey);
      const canByServerWallet = useServerWallet && Boolean(serverWallet);
      const transferMode = canByPrivateKey
        ? "private-key"
        : canByServerWallet
          ? "server-wallet"
          : "";
      return {
        ...row,
        serverWallet,
        canByPrivateKey,
        canByServerWallet,
        transferMode,
      };
    });

    const transferableRows = transferCandidateRows.filter((row) => Boolean(row.transferMode));
    const missingPrivateKeyRows = transferCandidateRows.filter((row) => !row.hasWalletPrivateKey);
    const missingServerWalletRows = transferCandidateRows.filter((row) => !row.canByServerWallet);

    const totalRaw = transferCandidateRows.reduce((acc, row) => acc + BigInt(row.rawBalance), 0n);
    const totalUsdt = formatUnitsString(totalRaw, usdtDecimals);

    console.log("");
    console.log(`[info] db=${dbName} chain=${chainName} usdt=${usdtContractAddress}`);
    console.log(`[info] destination=${destination || "(not set)"}`);
    console.log(
      `[info] mode=${mode} candidates=${users.length} positive=${transferCandidateRows.length} transferable=${transferableRows.length} missingPrivateKey=${missingPrivateKeyRows.length} missingServerWallet=${missingServerWalletRows.length} total=${totalUsdt} USDT`,
    );
    console.log("");

    if (transferCandidateRows.length === 0) {
      console.log("[done] positive balance wallet not found.");
      return;
    }

    console.table(
      transferCandidateRows.map((row, index) => ({
        no: index + 1,
        storecode: row.storecode,
        walletAddress: row.walletAddress,
        usdtBalance: row.usdtBalance,
        canTransfer: row.transferMode ? "yes" : "no",
        transferMode: row.transferMode || "-",
      })),
    );

    if (!args.execute) {
      console.log("");
      console.log("[dry-run] no transfer executed.");
      console.log(
        "Run with: node scripts/transfer-seller-usdt-to-wallet.mjs --mode server-wallet --execute --yes --to <destination_wallet>",
      );
      return;
    }

    if (!args.yes) {
      throw new Error("Execution blocked. Add --yes to confirm irreversible transfers.");
    }

    console.log("");
    console.log("[execute] start transfers...");

    const transferResults = [];

    for (const row of transferableRows) {
      try {
        const tx = transfer({
          contract: usdtContract,
          to: destination,
          amount: row.usdtBalance,
        });
        if (row.transferMode === "private-key") {
          const personalAccount = privateKeyToAccount({
            client: thirdwebClient,
            privateKey: row.walletPrivateKey,
          });

          const eoaAddress = normalizeWalletAddress(personalAccount.address);
          const smart = smartWallet({
            chain: chainConfig,
            sponsorGas: true,
          });
          const smartAccount = await smart.connect({
            client: thirdwebClient,
            personalAccount,
          });
          const smartAddress = normalizeWalletAddress(smartAccount.address);
          const targetAddress = row.walletAddress.toLowerCase();

          let senderAccount = null;
          let senderType = "";
          if (smartAddress && smartAddress.toLowerCase() === targetAddress) {
            senderAccount = smartAccount;
            senderType = "smart";
          } else if (eoaAddress && eoaAddress.toLowerCase() === targetAddress) {
            senderAccount = personalAccount;
            senderType = "eoa";
          }

          if (!senderAccount) {
            transferResults.push({
              storecode: row.storecode,
              walletAddress: row.walletAddress,
              usdtBalance: row.usdtBalance,
              status: "skipped",
              reason: `sender address mismatch (smart=${smartAddress || "-"}, eoa=${eoaAddress || "-"})`,
            });
            continue;
          }

          const receipt = await sendAndConfirmTransaction({
            transaction: tx,
            account: senderAccount,
          });

          transferResults.push({
            storecode: row.storecode,
            walletAddress: row.walletAddress,
            usdtBalance: row.usdtBalance,
            status: "success",
            senderType,
            transactionHash: receipt?.transactionHash || null,
          });
          continue;
        }

        if (row.transferMode === "server-wallet") {
          if (!vaultAccessToken) {
            throw new Error("vault token is missing for server-wallet transfer");
          }

          const signerAddress = row.serverWallet?.signerAddress || null;
          const smartAccountAddress = row.serverWallet?.smartAccountAddress || null;
          const targetAddress = row.walletAddress.toLowerCase();

          let wallet = null;
          let senderType = "";
          if (
            smartAccountAddress &&
            signerAddress &&
            smartAccountAddress.toLowerCase() === targetAddress
          ) {
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
          } else if (signerAddress && signerAddress.toLowerCase() === targetAddress) {
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
            throw new Error("server wallet mapping is invalid");
          }

          const enqueueResult = await wallet.enqueueTransaction({
            transaction: tx,
          });
          const transactionId = normalizeString(enqueueResult?.transactionId);
          if (!transactionId) {
            throw new Error("engine did not return transactionId");
          }

          const waitResult = await Engine.waitForTransactionHash({
            client: thirdwebClient,
            transactionId,
          });
          transferResults.push({
            storecode: row.storecode,
            walletAddress: row.walletAddress,
            usdtBalance: row.usdtBalance,
            status: "success",
            senderType,
            transactionId,
            transactionHash: waitResult?.transactionHash || null,
          });
          continue;
        }

        transferResults.push({
          storecode: row.storecode,
          walletAddress: row.walletAddress,
          usdtBalance: row.usdtBalance,
          status: "skipped",
          reason: "no transfer mode selected",
        });
      } catch (error) {
        transferResults.push({
          storecode: row.storecode,
          walletAddress: row.walletAddress,
          usdtBalance: row.usdtBalance,
          status: "failed",
          senderType: row.transferMode || "-",
          reason: error instanceof Error ? error.message : String(error),
        });
      }
    }

    const successCount = transferResults.filter((item) => item.status === "success").length;
    const failedCount = transferResults.filter((item) => item.status === "failed").length;
    const skippedCount = transferResults.filter((item) => item.status === "skipped").length;

    console.log("");
    console.log(
      `[execute] done success=${successCount} failed=${failedCount} skipped=${skippedCount}`,
    );
    console.table(
      transferResults.map((item, index) => ({
        no: index + 1,
        storecode: item.storecode,
        walletAddress: item.walletAddress,
        usdtBalance: item.usdtBalance,
        status: item.status,
        senderType: item.senderType || "-",
        transactionId: item.transactionId || "-",
        transactionHash: item.transactionHash || "-",
        reason: item.reason || "-",
      })),
    );
  } finally {
    await mongoClient.close();
  }
};

main().catch((error) => {
  console.error("[error]", error instanceof Error ? error.message : String(error));
  process.exit(1);
});
