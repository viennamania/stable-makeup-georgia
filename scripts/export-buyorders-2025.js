const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB_NAME;
const BATCH_SIZE = 500;
const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

if (!uri) {
  console.error('MONGODB_URI is required.');
  process.exit(1);
}

const getKstYear = (value) => {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Date(date.getTime() + KST_OFFSET_MS).getUTCFullYear();
};

async function run() {
  const client = new MongoClient(uri);
  let scanned = 0;
  let matched = 0;
  let written = 0;

  try {
    await client.connect();
    const db = client.db(dbName);
    const source = db.collection('buyorders');
    const target = db.collection('buyorders_2025');

    const cursor = source.find(
      { createdAt: { $exists: true, $ne: null } },
      { batchSize: BATCH_SIZE }
    );

    let ops = [];

    while (await cursor.hasNext()) {
      const doc = await cursor.next();
      scanned += 1;

      const year = getKstYear(doc.createdAt);
      if (year !== 2025) {
        continue;
      }

      matched += 1;
      ops.push({
        replaceOne: {
          filter: { _id: doc._id },
          replacement: doc,
          upsert: true,
        },
      });

      if (ops.length >= BATCH_SIZE) {
        const result = await target.bulkWrite(ops, { ordered: false });
        written += (result.upsertedCount || 0) + (result.modifiedCount || 0);
        ops = [];
      }
    }

    if (ops.length) {
      const result = await target.bulkWrite(ops, { ordered: false });
      written += (result.upsertedCount || 0) + (result.modifiedCount || 0);
    }

    console.log(`Scanned: ${scanned}`);
    console.log(`Matched (KST 2025): ${matched}`);
    console.log(`Written to buyorders_2025: ${written}`);
  } catch (err) {
    console.error('Export failed:', err);
    process.exit(1);
  } finally {
    await client.close();
  }
}

run();
