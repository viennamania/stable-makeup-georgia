import clientPromise from '../mongodb';

import { dbName } from '../mongodb';



// getOne by vactId
export async function getOne(vactId: string) {
  const client = await clientPromise;
  const collection = client.db(dbName).collection('bankTransfers');
  return collection.findOne({ vactId: vactId });
}


// Create a new bank transfer

export async function insertOne(data: any) {

  console.log('insertOne data: ' + JSON.stringify(data));

  const client = await clientPromise;

  const collection = client.db(dbName).collection('bankTransfers');


  const result = await collection.insertOne(data);

  if (result) {
    return data;
  } else {
    return null;
  }
}





