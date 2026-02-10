const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB_NAME || 'georgia';
const SOURCE_COLLECTION = 'buyerorders';
const TARGET_COLLECTION = 'buyorders-backup-20260210';
const BATCH_SIZE = 500;

if (!uri) {
  console.error('MONGODB_URI is required.');
  process.exit(1);
}

async function run() {
  const client = new MongoClient(uri);
  let scanned = 0;
  let written = 0;

  try {
    await client.connect();
    const db = client.db(dbName);
    const source = db.collection(SOURCE_COLLECTION);
    const target = db.collection(TARGET_COLLECTION);

    const cursor = source.find({}, { batchSize: BATCH_SIZE });
    let ops = [];

    while (await cursor.hasNext()) {
      const doc = await cursor.next();
      scanned += 1;

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
    console.log(`Written to ${TARGET_COLLECTION}: ${written}`);
  } catch (err) {
    console.error('Backup failed:', err);
    process.exit(1);
  } finally {
    await client.close();
  }
}

run();
