#!/usr/bin/env node

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { MongoClient } from "mongodb";
import { ethers } from "ethers";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

const DEFAULT_CHUNK_SIZE = 100;
const DEFAULT_NICKNAME = "seller";
const ERC20_TRANSFER_SIG_HASH =
  "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";
const ERC20_TRANSFER_EVENT_ABI = JSON.stringify({
  anonymous: false,
  inputs: [
    { indexed: true, internalType: "address", name: "from", type: "address" },
    { indexed: true, internalType: "address", name: "to", type: "address" },
    { indexed: false, internalType: "uint256", name: "value", type: "uint256" },
  ],
  name: "Transfer",
  type: "event",
});

const parseEnvFile = (filePath) => {
  const out = {};
  if (!fs.existsSync(filePath)) {
    return out;
  }

  const src = fs.readFileSync(filePath, "utf8");
  for (const line of src.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex <= 0) continue;
    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim().replace(/^"|"$/g, "");
    out[key] = value;
  }
  return out;
};

const normalizeString = (value) => (typeof value === "string" ? value.trim() : "");

const normalizeBaseUrl = (value) => {
  const safe = normalizeString(value).replace(/\/$/, "");
  if (!safe) {
    return "";
  }
  if (/^https?:\/\//i.test(safe)) {
    return safe;
  }
  return `https://${safe}`;
};

const normalizeAddress = (value) => {
  const safe = normalizeString(value);
  if (!safe) return "";

  try {
    return ethers.utils.getAddress(safe).toLowerCase();
  } catch {
    return "";
  }
};

const parsePositiveInt = (value, fallback) => {
  const parsed = Number.parseInt(normalizeString(value), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const chunk = (list, chunkSize) => {
  if (!Array.isArray(list) || list.length === 0) {
    return [];
  }

  const output = [];
  for (let index = 0; index < list.length; index += chunkSize) {
    output.push(list.slice(index, index + chunkSize));
  }
  return output;
};

const parseArgs = (argv) => {
  const args = {
    baseUrl: "",
    chunkSize: DEFAULT_CHUNK_SIZE,
    nickname: DEFAULT_NICKNAME,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === "--base-url") {
      args.baseUrl = normalizeString(argv[index + 1]);
      index += 1;
      continue;
    }
    if (token === "--chunk-size") {
      args.chunkSize = parsePositiveInt(argv[index + 1], DEFAULT_CHUNK_SIZE);
      index += 1;
      continue;
    }
    if (token === "--nickname") {
      args.nickname = normalizeString(argv[index + 1]) || DEFAULT_NICKNAME;
      index += 1;
    }
  }

  return args;
};

const resolveChainConfig = (chainNameRaw) => {
  const chainName = normalizeString(chainNameRaw).toLowerCase() || "bsc";

  if (chainName === "ethereum") {
    return {
      chainName: "ethereum",
      chainId: "1",
      usdtContractAddress: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
    };
  }

  if (chainName === "polygon") {
    return {
      chainName: "polygon",
      chainId: "137",
      usdtContractAddress: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F",
    };
  }

  if (chainName === "arbitrum") {
    return {
      chainName: "arbitrum",
      chainId: "42161",
      usdtContractAddress: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9",
    };
  }

  return {
    chainName: "bsc",
    chainId: "56",
    usdtContractAddress: "0x55d398326f99059fF775485246999027B3197955",
  };
};

const buildSignatureFilters = (addresses) => {
  return addresses.flatMap((walletAddress) => [
    {
      sig_hash: ERC20_TRANSFER_SIG_HASH,
      abi: ERC20_TRANSFER_EVENT_ABI,
      params: { from: walletAddress },
    },
    {
      sig_hash: ERC20_TRANSFER_SIG_HASH,
      abi: ERC20_TRANSFER_EVENT_ABI,
      params: { to: walletAddress },
    },
  ]);
};

const main = async () => {
  const args = parseArgs(process.argv.slice(2));
  const env = {
    ...parseEnvFile(path.join(projectRoot, ".env")),
    ...process.env,
  };

  const mongoUri = normalizeString(env.MONGODB_URI);
  const dbName = normalizeString(env.MONGODB_DB_NAME) || "georgia";
  const resolvedBaseUrl = normalizeBaseUrl(
    normalizeString(args.baseUrl)
    || normalizeString(env.NEXT_PUBLIC_APP_URL)
    || normalizeString(env.APP_URL)
    || normalizeString(env.VERCEL_PROJECT_PRODUCTION_URL),
  );

  if (!mongoUri) {
    throw new Error("MONGODB_URI is required");
  }

  const chainConfig = resolveChainConfig(env.NEXT_PUBLIC_CHAIN);
  const receiverUrl = resolvedBaseUrl
    ? `${resolvedBaseUrl.replace(/\/$/, "")}/api/webhook/thirdweb/usdt-token-transfers`
    : "/api/webhook/thirdweb/usdt-token-transfers";

  const mongoClient = new MongoClient(mongoUri);
  await mongoClient.connect();

  try {
    const database = mongoClient.db(dbName);
    const users = await database
      .collection("users")
      .find(
        {
          nickname: new RegExp(`^${args.nickname}$`, "i"),
          walletAddress: { $type: "string", $ne: "" },
        },
        {
          projection: {
            _id: 0,
            walletAddress: 1,
            storecode: 1,
            nickname: 1,
            updatedAt: 1,
          },
          sort: {
            updatedAt: -1,
            _id: -1,
          },
        },
      )
      .toArray();

    const uniqueWallets = [];
    const seen = new Set();
    for (const user of users) {
      const walletAddress = normalizeAddress(user?.walletAddress);
      if (!walletAddress || seen.has(walletAddress)) {
        continue;
      }
      seen.add(walletAddress);
      uniqueWallets.push({
        walletAddress,
        storecode: normalizeString(user?.storecode).toLowerCase() || null,
        nickname: normalizeString(user?.nickname) || null,
      });
    }

    const walletChunks = chunk(
      uniqueWallets.map((item) => item.walletAddress),
      Math.max(1, args.chunkSize),
    );

    const payload = {
      generatedAt: new Date().toISOString(),
      mode: "narrow-seller-only",
      note:
        "Register thirdweb Insight webhooks so only seller smart-account USDT Transfer events reach Vercel. Do not register the full-chain USDT Transfer stream.",
      dashboardSetup: {
        recommended: true,
        destination: "thirdweb dashboard > Insight > Webhooks > New Webhook",
        endpointUrl: receiverUrl,
        topic: "v1.events",
        contractAddress: chainConfig.usdtContractAddress.toLowerCase(),
        chainId: chainConfig.chainId,
      },
      nickname: args.nickname,
      chain: chainConfig.chainName,
      chainId: chainConfig.chainId,
      topic: "v1.events",
      webhookUrl: receiverUrl,
      usdtContractAddress: chainConfig.usdtContractAddress.toLowerCase(),
      eventSignatureHash: ERC20_TRANSFER_SIG_HASH,
      eventAbi: JSON.parse(ERC20_TRANSFER_EVENT_ABI),
      sellerWalletCount: uniqueWallets.length,
      chunkSize: Math.max(1, args.chunkSize),
      sellerWallets: uniqueWallets,
      webhookPayloads: walletChunks.map((walletAddresses, index) => ({
        chunkIndex: index + 1,
        walletCount: walletAddresses.length,
        walletAddresses,
        thirdwebCreateWebhookInput: {
          webhookUrl: receiverUrl,
          filters: {
            "v1.events": {
              chain_ids: [chainConfig.chainId],
              addresses: [chainConfig.usdtContractAddress.toLowerCase()],
              signatures: buildSignatureFilters(walletAddresses),
            },
          },
        },
      })),
    };

    process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
  } finally {
    await mongoClient.close();
  }
};

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
