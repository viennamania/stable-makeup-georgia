const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB_NAME || 'georgia';

if (!uri) {
  console.error('MONGODB_URI is required.');
  process.exit(1);
}

const BATCH_SIZE = 500;

async function run() {
  const client = new MongoClient(uri);
  let updatedCount = 0;
  let scannedCount = 0;

  try {
    await client.connect();
    const collection = client.db(dbName).collection('bankInfos');

    const query = {
      $and: [
        {
          $or: [
            { realAccountNumber: { $exists: false } },
            { realAccountNumber: null },
            { realAccountNumber: '' },
          ],
        },
        { accountNumber: { $exists: true, $ne: null, $ne: '' } },
      ],
    };

    const cursor = collection.find(query, {
      projection: { accountNumber: 1 },
      batchSize: BATCH_SIZE,
    });

    let ops = [];

    while (await cursor.hasNext()) {
      const doc = await cursor.next();
      scannedCount += 1;
      const realAccountNumber = String(doc.accountNumber || '').trim();

      if (!realAccountNumber) {
        continue;
      }

      ops.push({
        updateOne: {
          filter: { _id: doc._id },
          update: {
            $set: {
              realAccountNumber,
              updatedAt: new Date(),
            },
          },
        },
      });

      if (ops.length >= BATCH_SIZE) {
        const result = await collection.bulkWrite(ops, { ordered: false });
        updatedCount += result.modifiedCount || 0;
        ops = [];
      }
    }

    if (ops.length) {
      const result = await collection.bulkWrite(ops, { ordered: false });
      updatedCount += result.modifiedCount || 0;
    }

    console.log(`Scanned: ${scannedCount}`);
    console.log(`Updated: ${updatedCount}`);
  } finally {
    await client.close();
  }
}

run().catch((error) => {
  console.error('Migration failed:', error);
  process.exit(1);
});
