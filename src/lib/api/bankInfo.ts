import { ObjectId } from 'mongodb';

import clientPromise from '../mongodb';
import { dbName } from '../mongodb';

export async function getBankInfos({
  search = '',
  limit = 50,
  page = 1,
}: {
  search?: string;
  limit?: number;
  page?: number;
} = {}) {
  const client = await clientPromise;
  const collection = client.db(dbName).collection('bankInfos');

  const filters: any[] = [];

  if (search) {
    const regex = { $regex: String(search), $options: 'i' };
    filters.push({
      $or: [
        { bankName: regex },
        { realAccountNumber: regex },
        { accountNumber: regex },
        { accountHolder: regex },
        { aliasAccountNumber: regex },
      ],
    });
  }

  const query = filters.length ? { $and: filters } : {};

  const totalCount = await collection.countDocuments(query);

  const bankInfos = await collection
    .find(query)
    .sort({ createdAt: -1, _id: -1 })
    .skip(Math.max(0, (page - 1) * limit))
    .limit(Math.max(1, limit))
    .toArray();

  return {
    totalCount,
    bankInfos,
  };
}

export async function getBankInfoById(id: string) {
  if (!ObjectId.isValid(id)) {
    return null;
  }
  const client = await clientPromise;
  const collection = client.db(dbName).collection('bankInfos');
  return collection.findOne({ _id: new ObjectId(id) });
}

export async function getBankInfoByRealAccountNumber(realAccountNumber: string) {
  const value = String(realAccountNumber || '').trim();
  if (!value) {
    return null;
  }
  const client = await clientPromise;
  const collection = client.db(dbName).collection('bankInfos');
  return collection.findOne({
    $or: [
      { realAccountNumber: value },
      { accountNumber: value },
    ],
  });
}

export async function createBankInfo(data: {
  bankName: string;
  realAccountNumber: string;
  defaultAccountNumber?: string;
  accountHolder: string;
  memo?: string;
  aliasAccountNumber?: string[];
}) {
  const client = await clientPromise;
  const collection = client.db(dbName).collection('bankInfos');

  const payload = {
    bankName: data.bankName,
    realAccountNumber: data.realAccountNumber,
    defaultAccountNumber: data.defaultAccountNumber ?? data.realAccountNumber,
    accountHolder: data.accountHolder,
    ...(data.memo !== undefined ? { memo: data.memo } : {}),
    ...(data.aliasAccountNumber !== undefined ? { aliasAccountNumber: data.aliasAccountNumber } : {}),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const result = await collection.insertOne(payload);

  if (!result) {
    return null;
  }

  return {
    _id: result.insertedId,
    ...payload,
  };
}

export async function updateBankInfo({
  id,
  data,
}: {
  id: string;
  data: {
    bankName: string;
    realAccountNumber: string;
    accountHolder: string;
    memo?: string;
    aliasAccountNumber?: string[];
    defaultAccountNumber?: string;
  };
}) {
  if (!ObjectId.isValid(id)) {
    return null;
  }
  const client = await clientPromise;
  const collection = client.db(dbName).collection('bankInfos');

  const updateFields: Record<string, any> = {
    bankName: data.bankName,
    realAccountNumber: data.realAccountNumber,
    accountHolder: data.accountHolder,
    updatedAt: new Date(),
  };

  if (data.memo !== undefined) {
    updateFields.memo = data.memo;
  }
  if (data.aliasAccountNumber !== undefined) {
    updateFields.aliasAccountNumber = data.aliasAccountNumber;
  }
  if (data.defaultAccountNumber !== undefined) {
    updateFields.defaultAccountNumber = data.defaultAccountNumber;
  }

  const result = await collection.updateOne(
    { _id: new ObjectId(id) },
    {
      $set: updateFields,
    }
  );

  return result;
}

export async function deleteBankInfo(id: string) {
  if (!ObjectId.isValid(id)) {
    return null;
  }
  const client = await clientPromise;
  const collection = client.db(dbName).collection('bankInfos');
  return collection.deleteOne({ _id: new ObjectId(id) });
}




// touch by realAccountNumber
// used in webhook when bank transfer occurs
export async function touchBankInfoByRealAccountNumber(
  realAccountNumber: string,
  balance: number,
) {
  const value = String(realAccountNumber || '').trim();
  if (!value) {
    return null;
  }
  const client = await clientPromise;
  const collection = client.db(dbName).collection('bankInfos');

  const now = new Date();

  // if not exists, insert a new document
  const result = await collection.updateOne(
    {
      realAccountNumber: value,
    },
    {
      $set: {
        touchedAt: now,
        balance: balance,
      },
      $setOnInsert: {
        touchedAt: now,
        balance: balance,
        bankName: 'Unknown',
        realAccountNumber: value,
        defaultAccountNumber: value,
        accountHolder: 'Unknown',
        createdAt: now,
        createdBy: 'system',
      },
    },
    { upsert: true }
  );

  return result;
}