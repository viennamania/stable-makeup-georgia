import clientPromise from '../mongodb';

import { dbName } from '../mongodb';



// getOne by clientId
export async function getOne(clientId: string) {
  const client = await clientPromise;
  const collection = client.db(dbName).collection('clients');
  return collection.findOne({ clientId: clientId });
}


// upsertOne by clientId
export async function upsertOne(clientId: string, data: any) {
  const client = await clientPromise;
  const collection = client.db(dbName).collection('clients');
  const result = await collection.updateOne(
    { clientId: clientId },
    { $set: data },
    { upsert: true }
  );
  return result;
}


// updateAvatar by clientId
export async function updateAvatar(clientId: string, avatar: string) {
  const client = await clientPromise;
  const collection = client.db(dbName).collection('clients');
  const result = await collection.updateOne(
    { clientId: clientId },
    { $set: { avatar: avatar } },
    { upsert: false }
  );
  return result;
}

