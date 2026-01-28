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



// Get bank transfers with pagination and filters
export async function getBankTransfers(
  {
    limit,
    page,
    search = '',
    transactionType = '',
    matchStatus = '',
    fromDate = '',
    toDate = '',
    accountNumber = '',
    originalAccountNumber = '',
  }: {
    limit: number;
    page: number;
    search?: string;
    transactionType?: string;
    matchStatus?: string;
    fromDate?: string;
    toDate?: string;
    accountNumber?: string;
    originalAccountNumber?: string;
  }
): Promise<any> {

  const client = await clientPromise;
  const collection = client.db(dbName).collection('bankTransfers');

  const filters: any[] = [];

  if (search) {
    const regex = { $regex: String(search), $options: 'i' };
    filters.push({
      $or: [
        { transactionName: regex },
        { sender: regex },
      ],
    });
  }

  if (accountNumber) {
    const value = String(accountNumber).trim();
    filters.push({
      $or: [
        { bankAccountNumber: value },
        { account: value },
        { custAccnt: value },
      ],
    });
  }

  if (originalAccountNumber) {
    const value = String(originalAccountNumber).trim();
    filters.push({
      $or: [
        { originalBankAccountNumber: value },
        { custAccnt: value },
      ],
    });
  }

  if (transactionType) {
    const rawType = String(transactionType);
    const normalizedType = rawType.toLowerCase();
    let typeRegex = rawType;

    if (rawType === '입금' || normalizedType === 'deposited' || normalizedType === 'deposit') {
      typeRegex = '^(deposited|deposit|입금)$';
    } else if (rawType === '출금' || normalizedType === 'withdrawn' || normalizedType === 'withdrawal') {
      typeRegex = '^(withdrawn|withdrawal|출금)$';
    }

    filters.push({
      $or: [
        { transactionType: { $regex: typeRegex, $options: 'i' } },
        { trxType: { $regex: typeRegex, $options: 'i' } },
      ],
    });
  }

  if (matchStatus === 'matched') {
    filters.push({ match: { $ne: null } });
  } else if (matchStatus === 'unmatched') {
    filters.push({ match: null });
  }

  if (fromDate || toDate) {
    const dateRangeDate: any = {};
    const dateRangeString: any = {};

    if (fromDate) {
      const start = new Date(`${fromDate}T00:00:00.000Z`);
      dateRangeDate.$gte = start;
      dateRangeString.$gte = start.toISOString();
    }

    if (toDate) {
      const end = new Date(`${toDate}T23:59:59.999Z`);
      dateRangeDate.$lte = end;
      dateRangeString.$lte = end.toISOString();
    }

    filters.push({
      $or: [
        { transactionDate: dateRangeDate },
        { transactionDate: dateRangeString },
      ],
    });
  }

  const query = filters.length ? { $and: filters } : {};

  const totalCount = await collection.countDocuments(query);

  const totalAmountResult = await collection
    .aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalAmount: {
            $sum: {
              $convert: {
                input: "$amount",
                to: "double",
                onError: 0,
                onNull: 0,
              },
            },
          },
        },
      },
    ])
    .toArray();

  const totalAmount = totalAmountResult?.[0]?.totalAmount || 0;

  const transfers = await collection
    .find(query)
    .sort({ transactionDate: -1, regDate: -1, _id: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .toArray();

  return {
    totalCount,
    totalAmount,
    transfers,
  };
}


/*
{
  "_id": {
    "$oid": "6978e1feeff8ed7d1afb38c6"
  },
  "transactionType": "deposited",
  "bankAccountId": null,
  "originalBankAccountNumber": "3020621418681",
  "bankAccountNumber": "3520106623778",
  "bankCode": null,
  "amount": 200000,
  "transactionDate": "2026-01-28T01:04:11.152+09:00",
  "transactionName": "이순임",
  "balance": 1381172,
  "processingDate": null,
  "match": null
}
*/


// update bankTransfers collection match field = 'success', tradeId field = tradeId
// when transactionType: deposited
// and transactionName and amount equals to the given values
// and within 1 minute ago

export async function updateBankTransferMatchAndTradeId({
  transactionName,
  amount,
  tradeId,
}: {
  transactionName: string;
  amount: number;
  tradeId: string;
}) {

  console.log('updateBankTransferMatchAndTradeId called with:', {
    transactionName,
    amount,
    tradeId,
  });


  // transactionName


  const client = await clientPromise;
  const collection = client.db(dbName).collection('bankTransfers');


  // "transactionDate": "2026-01-28T01:04:11.152+09:00"
  // is KST timezone
  // so we need to consider timezone difference
  // but for simplicity, we will just use Date.now() - 1 minute
  //const oneMinuteAgo = new Date(Date.now() - 1 * 60 * 1000);
  //const oneMinuteAgoKST = new Date(oneMinuteAgo.getTime() + 9 * 60 * 60 * 1000);


  const result = await collection.updateOne(
    {
      transactionType: 'deposited',
      //transactionName: transactionName,
      transactionName: { $regex: `^${transactionName}$`, $options: 'i' },

      amount: amount,
      //transactionDate: { $gte: oneMinuteAgoKST },
      match: null,
      tradeId: null,
    },
    {
      $set: {
        match: 'success',
        tradeId: tradeId,
      },
    }
  );

  return result.modifiedCount > 0;

}
