import fs from "fs";
import path from "path";

import { MongoClient } from "mongodb";

const parseEnvFile = (filePath) => {
  const text = fs.readFileSync(filePath, "utf8");
  const env = {};

  for (const line of text.split(/\r?\n/)) {
    if (!line || /^\s*#/.test(line)) {
      continue;
    }

    const separatorIndex = line.indexOf("=");
    if (separatorIndex < 0) {
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

const normalizeText = (value) => (typeof value === "string" ? value.trim() : "");
const normalizeLower = (value) => normalizeText(value).toLowerCase();

const csvEscape = (value) => {
  const text = String(value ?? "");
  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, "\"\"")}"`;
  }
  return text;
};

const classifyOrder = (order, currentSellerUser) => {
  const sellerWalletAddress = normalizeLower(order?.seller?.walletAddress);
  const storeSellerWalletAddress = normalizeLower(order?.store?.sellerWalletAddress);
  const storeAdminWalletAddress = normalizeLower(order?.store?.adminWalletAddress);
  const storeSettlementWalletAddress = normalizeLower(order?.store?.settlementWalletAddress);
  const storePrivateSellerWalletAddress = normalizeLower(order?.store?.privateSellerWalletAddress);

  if (sellerWalletAddress && sellerWalletAddress === storeSellerWalletAddress) {
    return "seller_user_nickname_snapshot_differs";
  }

  if (order?.privateSale === true && sellerWalletAddress) {
    if (sellerWalletAddress === storePrivateSellerWalletAddress) {
      return "private_sale_private_seller_wallet_selected";
    }
    if (sellerWalletAddress === storeSettlementWalletAddress) {
      return "private_sale_settlement_wallet_selected";
    }
    if (sellerWalletAddress === storeAdminWalletAddress) {
      return "private_sale_admin_wallet_selected";
    }
  }

  if (sellerWalletAddress && sellerWalletAddress === storeAdminWalletAddress) {
    return "admin_wallet_selected";
  }

  if (sellerWalletAddress && sellerWalletAddress === storeSettlementWalletAddress) {
    return "settlement_wallet_selected";
  }

  if (sellerWalletAddress && sellerWalletAddress === storePrivateSellerWalletAddress) {
    return "private_seller_wallet_selected";
  }

  if (currentSellerUser && normalizeLower(currentSellerUser.walletAddress) === sellerWalletAddress) {
    return "seller_wallet_differs_from_store_snapshot";
  }

  return "seller_reference_anomaly";
};

const main = async () => {
  const cwd = process.cwd();
  const env = parseEnvFile(path.join(cwd, ".env"));
  const mongoUri = env.MONGODB_URI;
  const dbName = env.MONGODB_DB_NAME || "ultraman";

  if (!mongoUri) {
    throw new Error("MONGODB_URI is required");
  }

  const client = new MongoClient(mongoUri);
  await client.connect();

  try {
    const db = client.db(dbName);
    const orders = await db.collection("buyorders").find(
      {
        seller: { $exists: true, $ne: null },
        "seller.nickname": { $type: "string", $ne: "" },
        $expr: {
          $ne: [
            { $toLower: { $trim: { input: "$seller.nickname" } } },
            "seller",
          ],
        },
      },
      {
        projection: {
          _id: 0,
          tradeId: 1,
          storecode: 1,
          createdAt: 1,
          acceptedAt: 1,
          paymentRequestedAt: 1,
          paymentConfirmedAt: 1,
          status: 1,
          privateSale: 1,
          usdtAmount: 1,
          krwAmount: 1,
          api: 1,
          seller: 1,
          store: {
            storecode: 1,
            storeName: 1,
            sellerWalletAddress: 1,
            adminWalletAddress: 1,
            settlementWalletAddress: 1,
            privateSellerWalletAddress: 1,
          },
        },
      },
    ).sort({ acceptedAt: 1, createdAt: 1 }).toArray();

    const userKeys = Array.from(new Set(
      orders
        .map((order) => `${normalizeText(order.storecode)}::${normalizeLower(order?.seller?.walletAddress)}`)
        .filter((value) => value !== "::"),
    ));

    const orConditions = userKeys.map((key) => {
      const [storecode, walletAddress] = key.split("::");
      return {
        storecode,
        walletAddress: { $regex: `^${walletAddress.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" },
      };
    });

    const sellerUsers = orConditions.length
      ? await db.collection("users").find(
          { $or: orConditions },
          {
            projection: {
              _id: 0,
              storecode: 1,
              walletAddress: 1,
              nickname: 1,
              role: 1,
              updatedAt: 1,
              createdAt: 1,
              signerAddress: 1,
              verified: 1,
            },
          },
        ).toArray()
      : [];

    const sellerUserMap = new Map(
      sellerUsers.map((user) => [
        `${normalizeText(user.storecode)}::${normalizeLower(user.walletAddress)}`,
        user,
      ]),
    );

    const rows = orders.map((order) => {
      const sellerWalletAddress = normalizeText(order?.seller?.walletAddress);
      const sellerNickname = normalizeText(order?.seller?.nickname);
      const storeSellerWalletAddress = normalizeText(order?.store?.sellerWalletAddress);
      const currentSellerUser = sellerUserMap.get(
        `${normalizeText(order.storecode)}::${normalizeLower(sellerWalletAddress)}`,
      ) || null;

      const classification = classifyOrder(order, currentSellerUser);

      return {
        tradeId: normalizeText(order.tradeId),
        storecode: normalizeText(order.storecode),
        storeName: normalizeText(order?.store?.storeName),
        status: normalizeText(order.status),
        privateSale: Boolean(order.privateSale),
        createdAt: normalizeText(order.createdAt),
        acceptedAt: normalizeText(order.acceptedAt),
        paymentRequestedAt: normalizeText(order.paymentRequestedAt),
        paymentConfirmedAt: normalizeText(order.paymentConfirmedAt),
        usdtAmount: Number(order.usdtAmount || 0),
        krwAmount: Number(order.krwAmount || 0),
        sellerNickname,
        sellerWalletAddress,
        sellerSignerAddress: normalizeText(order?.seller?.signerAddress),
        sellerBankAccountHolder: normalizeText(order?.seller?.bankInfo?.accountHolder),
        storeSellerWalletAddress,
        storeAdminWalletAddress: normalizeText(order?.store?.adminWalletAddress),
        storeSettlementWalletAddress: normalizeText(order?.store?.settlementWalletAddress),
        storePrivateSellerWalletAddress: normalizeText(order?.store?.privateSellerWalletAddress),
        currentStoreUserNickname: normalizeText(currentSellerUser?.nickname),
        currentStoreUserRole: normalizeText(currentSellerUser?.role),
        currentStoreUserUpdatedAt: normalizeText(currentSellerUser?.updatedAt),
        currentStoreUserCreatedAt: normalizeText(currentSellerUser?.createdAt),
        currentStoreUserSignerAddress: normalizeText(currentSellerUser?.signerAddress),
        currentStoreUserVerified: Boolean(currentSellerUser?.verified),
        matchesCurrentStoreSellerWallet:
          normalizeLower(sellerWalletAddress) === normalizeLower(storeSellerWalletAddress),
        classification,
        api: normalizeText(order.api),
      };
    });

    const summary = {
      generatedAt: new Date().toISOString(),
      totalOrders: rows.length,
      countsByClassification: Object.entries(
        rows.reduce((acc, row) => {
          acc[row.classification] = (acc[row.classification] || 0) + 1;
          return acc;
        }, {}),
      )
        .sort((a, b) => b[1] - a[1])
        .map(([classification, count]) => ({ classification, count })),
      countsBySellerNickname: Object.entries(
        rows.reduce((acc, row) => {
          acc[row.sellerNickname] = (acc[row.sellerNickname] || 0) + 1;
          return acc;
        }, {}),
      )
        .sort((a, b) => b[1] - a[1])
        .map(([sellerNickname, count]) => ({ sellerNickname, count })),
      countsByStorecode: Object.entries(
        rows.reduce((acc, row) => {
          acc[row.storecode] = (acc[row.storecode] || 0) + 1;
          return acc;
        }, {}),
      )
        .sort((a, b) => b[1] - a[1])
        .map(([storecode, count]) => ({ storecode, count })),
      uniqueSellerWallets: Array.from(new Set(rows.map((row) => row.sellerWalletAddress))).sort(),
    };

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const reportsDir = path.join(cwd, "reports");
    fs.mkdirSync(reportsDir, { recursive: true });

    const jsonPath = path.join(reportsDir, `seller-nickname-anomalies-${timestamp}.json`);
    const csvPath = path.join(reportsDir, `seller-nickname-anomalies-${timestamp}.csv`);

    fs.writeFileSync(
      jsonPath,
      JSON.stringify(
        {
          summary,
          rows,
        },
        null,
        2,
      ),
      "utf8",
    );

    const csvColumns = [
      "tradeId",
      "storecode",
      "storeName",
      "status",
      "privateSale",
      "createdAt",
      "acceptedAt",
      "paymentRequestedAt",
      "paymentConfirmedAt",
      "usdtAmount",
      "krwAmount",
      "sellerNickname",
      "sellerWalletAddress",
      "sellerSignerAddress",
      "sellerBankAccountHolder",
      "storeSellerWalletAddress",
      "storeAdminWalletAddress",
      "storeSettlementWalletAddress",
      "storePrivateSellerWalletAddress",
      "currentStoreUserNickname",
      "currentStoreUserRole",
      "currentStoreUserUpdatedAt",
      "currentStoreUserCreatedAt",
      "currentStoreUserSignerAddress",
      "currentStoreUserVerified",
      "matchesCurrentStoreSellerWallet",
      "classification",
      "api",
    ];

    const csvLines = [
      csvColumns.join(","),
      ...rows.map((row) => csvColumns.map((column) => csvEscape(row[column])).join(",")),
    ];

    fs.writeFileSync(csvPath, `${csvLines.join("\n")}\n`, "utf8");

    console.log(JSON.stringify({
      summary,
      jsonPath,
      csvPath,
    }, null, 2));
  } finally {
    await client.close();
  }
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
