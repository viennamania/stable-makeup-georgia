import fs from "fs";
import path from "path";
import { MongoClient } from "mongodb";
import { createThirdwebClient } from "thirdweb";
import { polygon } from "thirdweb/chains";
import {
  privateKeyToAccount,
  smartWallet,
} from "thirdweb/wallets";

const ROUTE = "scripts/migrate-buyer-wallets-to-smart-accounts.mjs";
const BLOCKING_BUYORDER_STATUSES = ["ordered", "accepted", "paymentRequested"];
const USER_BUYORDER_SYNC_STATUSES = [
  ...BLOCKING_BUYORDER_STATUSES,
  "paymentConfirmed",
  "cancelled",
  "completed",
];

const parseEnvFile = (content) => {
  const env = {};
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }

    const separatorIndex = line.indexOf("=");
    if (separatorIndex === -1) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    let value = line.slice(separatorIndex + 1).trim();
    if (
      (value.startsWith("\"") && value.endsWith("\""))
      || (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    env[key] = value;
  }

  return env;
};

const loadEnv = () => {
  const envPath = path.join(process.cwd(), ".env");
  const fileEnv = fs.existsSync(envPath)
    ? parseEnvFile(fs.readFileSync(envPath, "utf8"))
    : {};

  return {
    ...fileEnv,
    ...process.env,
  };
};

const normalizeText = (value) => String(value || "").trim();

const buildAddressRegex = (walletAddress) =>
  new RegExp(`^${String(walletAddress || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i");

const buildWalletClauses = (walletAddresses) =>
  walletAddresses
    .map((walletAddress) => normalizeText(walletAddress))
    .filter(Boolean)
    .map((walletAddress) => ({
      walletAddress: buildAddressRegex(walletAddress),
    }));

const toPlainId = (value) => {
  if (!value) {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "object" && typeof value.toString === "function") {
    return value.toString();
  }

  return String(value);
};

const parseArgs = () => {
  const args = process.argv.slice(2);
  const options = {
    storecode: "hyvoragg",
    execute: false,
  };

  for (const arg of args) {
    if (arg === "--execute") {
      options.execute = true;
      continue;
    }

    if (arg.startsWith("--storecode=")) {
      options.storecode = normalizeText(arg.slice("--storecode=".length)) || options.storecode;
    }
  }

  return options;
};

const resolveUserOrderSummary = async ({
  buyOrderCollection,
  storecode,
  walletAddresses,
}) => {
  const walletClauses = buildWalletClauses(walletAddresses);
  if (walletClauses.length === 0) {
    return {
      blockingOrderCount: 0,
      latestBuyOrder: null,
      buyOrderStatus: "",
      totalPaymentConfirmedCount: 0,
      totalPaymentConfirmedKrwAmount: 0,
      totalPaymentConfirmedUsdtAmount: 0,
    };
  }

  const [blockingOrderCount, latestOrder, paymentConfirmedTotals] = await Promise.all([
    buyOrderCollection.countDocuments({
      storecode,
      status: { $in: BLOCKING_BUYORDER_STATUSES },
      $or: walletClauses,
    }),
    buyOrderCollection.findOne(
      {
        storecode,
        status: { $in: USER_BUYORDER_SYNC_STATUSES },
        $or: walletClauses,
      },
      {
        sort: { createdAt: -1 },
        projection: {
          _id: 1,
          tradeId: 1,
          status: 1,
          createdAt: 1,
          storecode: 1,
          store: 1,
          usdtAmount: 1,
          krwAmount: 1,
          rate: 1,
        },
      },
    ),
    buyOrderCollection.aggregate([
      {
        $match: {
          storecode,
          status: "paymentConfirmed",
          $or: walletClauses,
        },
      },
      {
        $group: {
          _id: null,
          totalPaymentConfirmedCount: { $sum: 1 },
          totalPaymentConfirmedKrwAmount: { $sum: "$krwAmount" },
          totalPaymentConfirmedUsdtAmount: { $sum: "$usdtAmount" },
        },
      },
    ]).toArray(),
  ]);

  const totals = paymentConfirmedTotals[0] || null;

  return {
    blockingOrderCount,
    latestBuyOrder: latestOrder
      ? {
          _id: toPlainId(latestOrder._id),
          tradeId: latestOrder.tradeId || "",
          storecode: latestOrder.storecode || storecode,
          storeName: latestOrder?.store?.storeName || "",
          storeLogo: latestOrder?.store?.storeLogo || "",
          usdtAmount: latestOrder.usdtAmount || 0,
          krwAmount: latestOrder.krwAmount || 0,
          rate: latestOrder.rate || 0,
          createdAt: latestOrder.createdAt || "",
        }
      : null,
    buyOrderStatus: latestOrder?.status
      ? String(latestOrder.status)
      : (totals ? "paymentConfirmed" : ""),
    totalPaymentConfirmedCount: totals?.totalPaymentConfirmedCount || 0,
    totalPaymentConfirmedKrwAmount: totals?.totalPaymentConfirmedKrwAmount || 0,
    totalPaymentConfirmedUsdtAmount: totals?.totalPaymentConfirmedUsdtAmount || 0,
  };
};

const main = async () => {
  const options = parseArgs();
  const env = loadEnv();
  const mongoUri = normalizeText(env.MONGODB_URI || env.MONGO_URI);
  const dbName = normalizeText(env.MONGODB_DB || env.DB_NAME || "ultraman");
  const thirdwebSecretKey = normalizeText(env.THIRDWEB_SECRET_KEY);

  if (!mongoUri) {
    throw new Error("MONGODB_URI is required");
  }
  if (!thirdwebSecretKey) {
    throw new Error("THIRDWEB_SECRET_KEY is required");
  }

  const mongoClient = new MongoClient(mongoUri);
  const thirdwebClient = createThirdwebClient({
    secretKey: thirdwebSecretKey,
  });

  await mongoClient.connect();

  try {
    const db = mongoClient.db(dbName);
    const userCollection = db.collection("users");
    const buyOrderCollection = db.collection("buyorders");

    const users = await userCollection.find(
      {
        storecode: options.storecode,
        buyer: { $exists: true, $ne: null },
        walletAddress: { $type: "string", $ne: "" },
        walletPrivateKey: { $type: "string", $ne: "" },
        $or: [
          { signerAddress: { $exists: false } },
          { signerAddress: null },
          { signerAddress: "" },
        ],
      },
      {
        projection: {
          _id: 1,
          nickname: 1,
          walletAddress: 1,
          walletPrivateKey: 1,
          createdByApi: 1,
          createdAt: 1,
        },
      },
    ).sort({ createdAt: 1, _id: 1 }).toArray();

    const results = [];

    for (const user of users) {
      const currentWalletAddress = normalizeText(user.walletAddress);
      const privateKey = normalizeText(user.walletPrivateKey);
      const personalAccount = privateKeyToAccount({
        client: thirdwebClient,
        privateKey,
      });

      const wallet = smartWallet({
        chain: polygon,
        sponsorGas: true,
      });

      const smartAccount = await wallet.connect({
        client: thirdwebClient,
        personalAccount,
      });

      const smartAccountAddress = normalizeText(smartAccount?.address);
      const signerAddress = normalizeText(personalAccount?.address);
      const walletAliases = Array.from(
        new Set([currentWalletAddress, smartAccountAddress, signerAddress].filter(Boolean)),
      );

      const summary = await resolveUserOrderSummary({
        buyOrderCollection,
        storecode: options.storecode,
        walletAddresses: walletAliases,
      });

      const duplicateUser = smartAccountAddress
        ? await userCollection.findOne(
            {
              storecode: options.storecode,
              _id: { $ne: user._id },
              walletAddress: buildAddressRegex(smartAccountAddress),
            },
            {
              projection: {
                _id: 1,
                nickname: 1,
                walletAddress: 1,
              },
            },
          )
        : null;

      const alreadySmartWallet = Boolean(
        smartAccountAddress
        && currentWalletAddress
        && smartAccountAddress.toLowerCase() === currentWalletAddress.toLowerCase(),
      );

      const canMigrate = Boolean(
        smartAccountAddress
        && signerAddress
        && !duplicateUser
        && summary.blockingOrderCount === 0,
      );

      const result = {
        userId: toPlainId(user._id),
        nickname: normalizeText(user.nickname),
        createdByApi: normalizeText(user.createdByApi),
        currentWalletAddress,
        signerAddress,
        smartAccountAddress,
        alreadySmartWallet,
        duplicateWalletOwner: duplicateUser
          ? {
              userId: toPlainId(duplicateUser._id),
              nickname: normalizeText(duplicateUser.nickname),
              walletAddress: normalizeText(duplicateUser.walletAddress),
            }
          : null,
        blockingOrderCount: summary.blockingOrderCount,
        latestBuyOrderTradeId: summary.latestBuyOrder?.tradeId || "",
        latestBuyOrderStatus: summary.buyOrderStatus,
        totalPaymentConfirmedCount: summary.totalPaymentConfirmedCount,
        executed: false,
        skippedReason: "",
      };

      if (!canMigrate) {
        if (!smartAccountAddress || !signerAddress) {
          result.skippedReason = "failed_to_resolve_smart_account";
        } else if (duplicateUser) {
          result.skippedReason = "duplicate_smart_account_wallet";
        } else if (summary.blockingOrderCount > 0) {
          result.skippedReason = "blocking_buy_order_exists";
        } else {
          result.skippedReason = "unknown";
        }

        results.push(result);
        continue;
      }

      if (options.execute) {
        const migratedAt = new Date().toISOString();
        await userCollection.updateOne(
          { _id: user._id },
          {
            $set: {
              walletAddress: smartAccountAddress,
              signerAddress,
              updatedAt: migratedAt,
              buyOrderStatus: summary.buyOrderStatus,
              totalPaymentConfirmedCount: summary.totalPaymentConfirmedCount,
              totalPaymentConfirmedKrwAmount: summary.totalPaymentConfirmedKrwAmount,
              totalPaymentConfirmedUsdtAmount: summary.totalPaymentConfirmedUsdtAmount,
              ...(summary.latestBuyOrder
                ? { latestBuyOrder: summary.latestBuyOrder }
                : {}),
              walletMigration: {
                route: ROUTE,
                mode: alreadySmartWallet ? "backfill_signer_address" : "eoa_to_smart_account",
                migratedAt,
                previousWalletAddress: currentWalletAddress,
              },
            },
          },
        );
        result.executed = true;
      }

      results.push(result);
    }

    const summary = {
      storecode: options.storecode,
      execute: options.execute,
      totalCandidates: users.length,
      migratableCount: results.filter((item) => !item.skippedReason).length,
      executedCount: results.filter((item) => item.executed).length,
      blockedCount: results.filter((item) => item.skippedReason === "blocking_buy_order_exists").length,
      duplicateCount: results.filter((item) => item.skippedReason === "duplicate_smart_account_wallet").length,
      failedResolveCount: results.filter((item) => item.skippedReason === "failed_to_resolve_smart_account").length,
      results,
    };

    console.log(JSON.stringify(summary, null, 2));
  } finally {
    await mongoClient.close();
  }
};

main().catch((error) => {
  console.error(
    JSON.stringify(
      {
        error: error instanceof Error ? error.message : String(error),
      },
      null,
      2,
    ),
  );
  process.exit(1);
});
