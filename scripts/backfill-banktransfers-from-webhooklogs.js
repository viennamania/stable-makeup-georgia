const fs = require("fs");
const path = require("path");
const { MongoClient } = require("mongodb");

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return {};
  }

  const env = {};
  const content = fs.readFileSync(filePath, "utf8");
  const lines = content.split(/\r?\n/);

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const eqIndex = line.indexOf("=");
    if (eqIndex === -1) continue;

    const key = line.slice(0, eqIndex).trim();
    let value = line.slice(eqIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    env[key] = value;
  }

  return env;
}

function getEnv(key, fallback = "") {
  const fromProcess = process.env[key];
  if (fromProcess !== undefined && fromProcess !== null && fromProcess !== "") {
    return fromProcess;
  }

  const fromDotEnv = parseEnvFile(path.resolve(".env"))[key];
  if (fromDotEnv !== undefined && fromDotEnv !== null && fromDotEnv !== "") {
    return fromDotEnv;
  }

  return fallback;
}

function toNullableString(value) {
  const normalized = String(value || "").trim();
  return normalized ? normalized : null;
}

function parseWebhookDateToUtc(value) {
  const raw = String(value || "").trim();
  if (!raw) {
    return null;
  }

  const normalized = raw.replace(/\//g, "-");
  const hasTimezone = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(normalized);
  const hasT = normalized.includes("T");

  let candidate = normalized;

  // "YYYY-MM-DD HH:mm:ss" is treated as KST payload time.
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}(?:\.\d+)?$/.test(normalized)) {
    candidate = `${normalized.replace(" ", "T")}+09:00`;
  } else if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    candidate = `${normalized}T00:00:00+09:00`;
  } else if (hasT && !hasTimezone) {
    candidate = `${normalized}+09:00`;
  }

  const parsed = new Date(candidate);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function parseArgs() {
  const args = process.argv.slice(2);

  let hours = 24;
  let dryRun = false;
  let limit = 0;

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];

    if (arg === "--dry-run") {
      dryRun = true;
      continue;
    }

    if (arg.startsWith("--hours=")) {
      const value = Number(arg.split("=")[1]);
      if (Number.isFinite(value) && value > 0) {
        hours = value;
      }
      continue;
    }

    if (arg === "--hours") {
      const value = Number(args[i + 1]);
      if (Number.isFinite(value) && value > 0) {
        hours = value;
        i += 1;
      }
      continue;
    }

    if (arg.startsWith("--limit=")) {
      const value = Number(arg.split("=")[1]);
      if (Number.isFinite(value) && value > 0) {
        limit = Math.floor(value);
      }
      continue;
    }

    if (arg === "--limit") {
      const value = Number(args[i + 1]);
      if (Number.isFinite(value) && value > 0) {
        limit = Math.floor(value);
        i += 1;
      }
    }
  }

  return { hours, dryRun, limit };
}

function normalizeHeaderValue(headers, key) {
  if (!headers || typeof headers !== "object") return null;

  const loweredKey = String(key || "").toLowerCase();
  for (const [k, v] of Object.entries(headers)) {
    if (String(k || "").toLowerCase() === loweredKey) {
      return toNullableString(v);
    }
  }

  return null;
}

async function run() {
  const { hours, dryRun, limit } = parseArgs();

  const uri = getEnv("MONGODB_URI");
  const dbName = getEnv("MONGODB_DB_NAME", "georgia");

  if (!uri) {
    console.error("MONGODB_URI is required.");
    process.exit(1);
  }

  const client = new MongoClient(uri);

  const since = new Date(Date.now() - hours * 60 * 60 * 1000);

  let scanned = 0;
  let inserted = 0;
  let existed = 0;
  let invalid = 0;
  let failed = 0;
  let unresolvedStoreCount = 0;

  const firstErrors = [];
  const bankInfoCache = new Map();
  const storeInfoCache = new Map();

  try {
    await client.connect();

    const db = client.db(dbName);
    const webhookLogs = db.collection("webhookLogs");
    const bankTransfers = db.collection("bankTransfers");
    const bankInfos = db.collection("bankInfos");
    const stores = db.collection("stores");

    let cursor = webhookLogs
      .find(
        {
          event: "banktransfer_webhook",
          createdAt: { $gte: since },
        },
        {
          projection: {
            _id: 1,
            createdAt: 1,
            headers: 1,
            body: 1,
          },
        }
      )
      .sort({ createdAt: 1, _id: 1 });

    if (limit > 0) {
      cursor = cursor.limit(limit);
    }

    while (await cursor.hasNext()) {
      const log = await cursor.next();
      scanned += 1;

      try {
        const body = log?.body || {};

        const transactionType = String(body?.transaction_type || "").trim();
        const originalBankAccountNumber = String(body?.bank_account_number || "").trim();
        const transactionName = String(body?.transaction_name || "").trim();
        const transactionDateRaw = String(body?.transaction_date || "").trim();

        const amount = Number(body?.amount);
        if (!transactionType || !Number.isFinite(amount) || !transactionDateRaw) {
          invalid += 1;
          continue;
        }

        const transactionDateUtc = parseWebhookDateToUtc(transactionDateRaw);
        if (!transactionDateUtc) {
          invalid += 1;
          continue;
        }
        const transactionDateNormalized = transactionDateUtc
          ? transactionDateUtc.toISOString()
          : transactionDateRaw;

        const dedupeBase = {
          transactionType,
          originalBankAccountNumber: originalBankAccountNumber || null,
          amount,
          transactionName,
        };

        const dedupeQuery = {
          ...dedupeBase,
          transactionDateUtc,
        };

        const existing = await bankTransfers.findOne(dedupeQuery, { projection: { _id: 1 } });
        if (existing) {
          existed += 1;
          continue;
        }

        let bankInfo = null;
        if (originalBankAccountNumber) {
          if (bankInfoCache.has(originalBankAccountNumber)) {
            bankInfo = bankInfoCache.get(originalBankAccountNumber);
          } else {
            bankInfo = await bankInfos.findOne({
              $or: [
                { realAccountNumber: originalBankAccountNumber },
                { accountNumber: originalBankAccountNumber },
                { defaultAccountNumber: originalBankAccountNumber },
              ],
            });
            bankInfoCache.set(originalBankAccountNumber, bankInfo || null);
          }
        }

        const bankAccountNumber = toNullableString(
          bankInfo?.defaultAccountNumber || originalBankAccountNumber
        );

        let storeInfo = null;
        if (bankAccountNumber) {
          if (storeInfoCache.has(bankAccountNumber)) {
            storeInfo = storeInfoCache.get(bankAccountNumber);
          } else {
            storeInfo = await stores.findOne({
              $or: [
                { "bankInfo.accountNumber": bankAccountNumber },
                { "bankInfoAAA.accountNumber": bankAccountNumber },
                { "bankInfoBBB.accountNumber": bankAccountNumber },
                { "bankInfoCCC.accountNumber": bankAccountNumber },
                { "bankInfoDDD.accountNumber": bankAccountNumber },
              ],
            });
            storeInfoCache.set(bankAccountNumber, storeInfo || null);
          }
        }

        if (!storeInfo) {
          unresolvedStoreCount += 1;
        }

        const traceId = normalizeHeaderValue(log?.headers, "x-trace-id");
        const mallId = normalizeHeaderValue(log?.headers, "x-mall-id");

        const document = {
          transactionType,
          bankAccountId: toNullableString(body?.bank_account_id),
          originalBankAccountNumber: toNullableString(originalBankAccountNumber),
          bankAccountNumber,
          bankCode: toNullableString(body?.bank_code),
          amount,
          transactionDate: transactionDateNormalized,
          transactionDateUtc,
          transactionDateRaw: toNullableString(transactionDateRaw),
          transactionName,
          balance: Number.isFinite(Number(body?.balance)) ? Number(body?.balance) : body?.balance ?? null,
          processingDate: toNullableString(body?.processing_date),
          match: null,
          matchedByAdmin: false,
          tradeId: null,
          storeInfo: storeInfo || null,
          buyerInfo: null,
          sellerInfo: null,
          memo: "webhookLogs 백필",
          errorMessage: "Backfilled from webhookLogs",
          traceId,
          mallId,
          backfilledFromWebhookLogId: log?._id || null,
          backfilledAt: new Date(),
        };

        if (!dryRun) {
          await bankTransfers.insertOne(document);
        }

        inserted += 1;
      } catch (error) {
        failed += 1;
        if (firstErrors.length < 5) {
          firstErrors.push({
            logId: log?._id || null,
            message: error instanceof Error ? error.message : String(error),
          });
        }
      }

      if (scanned % 500 === 0) {
        console.log(
          `[progress] scanned=${scanned}, inserted=${inserted}, existed=${existed}, invalid=${invalid}, failed=${failed}`
        );
      }
    }

    console.log("");
    console.log("=== Backfill Summary ===");
    console.log(`Database: ${dbName}`);
    console.log(`Since: ${since.toISOString()} (${hours}h)`);
    console.log(`Dry run: ${dryRun ? "yes" : "no"}`);
    console.log(`Scanned webhook logs: ${scanned}`);
    console.log(`Inserted: ${inserted}`);
    console.log(`Skipped (already exists): ${existed}`);
    console.log(`Skipped (invalid payload): ${invalid}`);
    console.log(`Failed: ${failed}`);
    console.log(`Inserted with unresolved storeInfo: ${unresolvedStoreCount}`);

    if (firstErrors.length > 0) {
      console.log("");
      console.log("First errors:");
      for (const item of firstErrors) {
        console.log(`- logId=${item.logId} message=${item.message}`);
      }
    }
  } catch (error) {
    console.error("Backfill failed:", error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

run();
