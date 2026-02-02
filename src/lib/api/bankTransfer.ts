import { match } from 'assert';
import clientPromise from '../mongodb';

import { dbName } from '../mongodb';

// ObjectId
import { ObjectId } from 'mongodb';


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
  } else if (matchStatus === 'notSuccess') {
    filters.push({
      $or: [
        { match: { $exists: false } },
        { match: { $ne: 'success' } },
      ],
    });
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
  storeInfo,
  buyerInfo,
}: {
  transactionName: string;
  amount: number;
  tradeId: string;
  storeInfo: any;
  buyerInfo: any;
}) {

  console.log('updateBankTransferMatchAndTradeId called with:', {
    transactionName,
    amount,
    tradeId,
    storeInfo,
    buyerInfo,
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

  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const oneDayAgoKST = new Date(oneDayAgo.getTime() + 9 * 60 * 60 * 1000);

  const result = await collection.updateOne(
    {
      transactionType: 'deposited',
      //transactionName: transactionName,
      transactionName: { $regex: `^${transactionName}$`, $options: 'i' },

      amount: amount,
      transactionDate: { $gte: oneDayAgoKST },
      match: null,
      tradeId: null,
    },
    {
      $set: {
        match: 'success',
        tradeId: tradeId,
        storeInfo: storeInfo,
        buyerInfo: buyerInfo,
      },
    }
  );

  return result.modifiedCount > 0;

}




// check bankTransfer 짧은 시간에 여러번 발생하는지 체크
export async function isBankTransferMultipleTimes({
  transactionName,
  amount,
  transactionDate,
}: {
  transactionName: string;
  amount: number;
  transactionDate: Date;
}): Promise<boolean> {

  const client = await clientPromise;
  const collection = client.db(dbName).collection('bankTransfers');

  // check within 10 seconds
  
  const oneMinuteBefore = new Date(transactionDate.getTime() - 10 * 1000);
  const oneMinuteAfter = new Date(transactionDate.getTime() + 10 * 1000);

  const count = await collection.countDocuments({
    transactionType: 'deposited',
    transactionName: { $regex: `^${transactionName}$`, $options: 'i' },
    amount: amount,
    transactionDate: { $gte: oneMinuteBefore, $lte: oneMinuteAfter },
  });

  return count > 1;
}



// bankTransfer 에서 오늘것 중에 매칭 안되어있는것 찾기 (입금자명, 금액 기준)
// 그리고 합산이 paymentAmount 이상이면
// 차례로 합산해서 paymentAmount 와 똑같아지면 그 시점까지
// 각각을 매칭 처리한다.
export async function matchBankTransfersToPaymentAmount({
  transactionName,
  paymentAmount,
  tradeId,
}: {
  transactionName: string;
  paymentAmount: number;
  tradeId: string;
}): Promise<any[]> {

  const client = await clientPromise;
  const collection = client.db(dbName).collection('bankTransfers');

  // 오늘 날짜 구하기 (KST 기준)
  const now = new Date();
  const kstOffset = 9 * 60; // KST is UTC+9
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const kstNow = new Date(utc + (kstOffset * 60000));

  const startOfDay = new Date(kstNow.getFullYear(), kstNow.getMonth(), kstNow.getDate(), 0, 0, 0);
  const endOfDay = new Date(kstNow.getFullYear(), kstNow.getMonth(), kstNow.getDate(), 23, 59, 59, 999);

  // find unmatched bank transfers for today
  const unmatchedTransfers = await collection.find({
    transactionType: 'deposited',
    transactionName: { $regex: `^${transactionName}$`, $options: 'i' },
    amount: { $gt: 0 },
    transactionDate: { $gte: startOfDay, $lte: endOfDay },
    match: null,
  }).sort({ transactionDate: 1 }).toArray();

  const matchedTransfers: any[] = [];
  let accumulatedAmount = 0;

  for (const transfer of unmatchedTransfers) {
    accumulatedAmount += transfer.amount;

    matchedTransfers.push(transfer);

    if (accumulatedAmount >= paymentAmount) {
      break;
    }
  }


  // check if accumulatedAmount equals paymentAmount
  // update only if equals
  // update each matched transfer

  if (accumulatedAmount === paymentAmount) {

   
    // get buyorder collection to get storeInfo and buyerInfo
    const buyOrderCollection = client.db(dbName).collection('buyorders');

    const buyOrder = await buyOrderCollection.findOne({ tradeId: tradeId });

    const storeInfo = buyOrder?.store || null;
    const buyerInfo = buyOrder?.buyer || null;


    for (const transfer of matchedTransfers) {
      await collection.updateOne(
        { _id: transfer._id },
        { $set: { match: 'success', tradeId: tradeId, storeInfo: storeInfo, buyerInfo: buyerInfo } }
      );
    }


    return matchedTransfers;
  } else {
    return [];
  }
}




// matchBankTransfersBybankTransferId
// 수동으로 처리했는지 체크
export async function matchBankTransfersBybankTransferId({
  bankTransferId,
  tradeId,
  matchedByAdmin = false,
}: {
  bankTransferId: string;
  tradeId: string;
  matchedByAdmin?: boolean;
}): Promise<boolean> {

  // get storeInfo, buyerInfo, sellerInfo from buyorders collection
  const clientForBuyOrder = await clientPromise;
  const buyOrderCollection = clientForBuyOrder.db(dbName).collection('buyorders');

  const buyOrder = await buyOrderCollection.findOne({ tradeId: tradeId });

  const storeInfo = buyOrder?.store || null;
  const buyerInfo = buyOrder?.buyer || null;
  const sellerInfo = buyOrder?.seller || null;


  const client = await clientPromise;
  const collection = client.db(dbName).collection('bankTransfers');

  const result = await collection.updateOne(
    {
      _id: new ObjectId(bankTransferId),
      transactionType: 'deposited',
      match: null,
      tradeId: null,
    },
    {
      $set: {
        match: 'success',
        matchedByAdmin: matchedByAdmin,
        tradeId: tradeId,
        storeInfo: storeInfo,
        buyerInfo: buyerInfo,
        sellerInfo: sellerInfo,
      },
    }
  );

  return result.modifiedCount > 0;
}
