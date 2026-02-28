import { match } from 'assert';
import clientPromise from '../mongodb';

import { dbName } from '../mongodb';

// ObjectId
import { ObjectId } from 'mongodb';
import { memo } from 'react';

function escapeRegex(value: string): string {
  return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

function parseKstDateToUtcBoundary(value: string, endOfDay: boolean): Date | null {
  const normalized = String(value || '').trim();
  const match = normalized.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  const validate = new Date(Date.UTC(year, month - 1, day));
  if (
    validate.getUTCFullYear() !== year ||
    validate.getUTCMonth() !== month - 1 ||
    validate.getUTCDate() !== day
  ) {
    return null;
  }

  const hour = endOfDay ? 23 : 0;
  const minute = endOfDay ? 59 : 0;
  const second = endOfDay ? 59 : 0;
  const millisecond = endOfDay ? 999 : 0;

  return new Date(
    Date.UTC(year, month - 1, day, hour, minute, second, millisecond) - KST_OFFSET_MS,
  );
}

function getKstUtcDayRange(referenceDate: Date = new Date()): {
  dateKst: string;
  startUtc: Date;
  endUtc: Date;
} {
  const kstNow = new Date(referenceDate.getTime() + KST_OFFSET_MS);
  const year = kstNow.getUTCFullYear();
  const month = kstNow.getUTCMonth();
  const day = kstNow.getUTCDate();

  const startUtc = new Date(Date.UTC(year, month, day, 0, 0, 0, 0) - KST_OFFSET_MS);
  const endUtc = new Date(Date.UTC(year, month, day, 23, 59, 59, 999) - KST_OFFSET_MS);

  const dateKst = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  return {
    dateKst,
    startUtc,
    endUtc,
  };
}

export type BankTransferTodaySummary = {
  dateKst: string;
  depositedAmount: number;
  withdrawnAmount: number;
  depositedCount: number;
  withdrawnCount: number;
  totalCount: number;
  updatedAt: string;
};

export async function getBankTransferTodaySummary(): Promise<BankTransferTodaySummary> {
  const client = await clientPromise;
  const collection = client.db(dbName).collection('bankTransfers');

  const { dateKst, startUtc, endUtc } = getKstUtcDayRange();

  const summaryResult = await collection
    .aggregate([
      {
        $match: {
          transactionDateUtc: {
            $gte: startUtc,
            $lte: endUtc,
          },
        },
      },
      {
        $project: {
          normalizedType: {
            $toLower: {
              $ifNull: [
                '$transactionType',
                {
                  $ifNull: ['$trxType', ''],
                },
              ],
            },
          },
          amountValue: {
            $convert: {
              input: '$amount',
              to: 'double',
              onError: 0,
              onNull: 0,
            },
          },
        },
      },
      {
        $group: {
          _id: null,
          depositedAmount: {
            $sum: {
              $cond: [
                { $in: ['$normalizedType', ['deposited', 'deposit', '입금']] },
                '$amountValue',
                0,
              ],
            },
          },
          withdrawnAmount: {
            $sum: {
              $cond: [
                { $in: ['$normalizedType', ['withdrawn', 'withdrawal', '출금']] },
                '$amountValue',
                0,
              ],
            },
          },
          depositedCount: {
            $sum: {
              $cond: [
                { $in: ['$normalizedType', ['deposited', 'deposit', '입금']] },
                1,
                0,
              ],
            },
          },
          withdrawnCount: {
            $sum: {
              $cond: [
                { $in: ['$normalizedType', ['withdrawn', 'withdrawal', '출금']] },
                1,
                0,
              ],
            },
          },
        },
      },
    ])
    .toArray();

  const summary = summaryResult?.[0] || {};
  const depositedAmount = Number(summary.depositedAmount || 0);
  const withdrawnAmount = Number(summary.withdrawnAmount || 0);
  const depositedCount = Number(summary.depositedCount || 0);
  const withdrawnCount = Number(summary.withdrawnCount || 0);

  return {
    dateKst,
    depositedAmount,
    withdrawnAmount,
    depositedCount,
    withdrawnCount,
    totalCount: depositedCount + withdrawnCount,
    updatedAt: new Date().toISOString(),
  };
}


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
    storecode = '',
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
    storecode?: string;
  }
): Promise<any> {

  /*
  console.log('getBankTransfers called with:', {
    limit,
    page,
    search,
    transactionType,
    matchStatus,
    fromDate,
    toDate,
    accountNumber,
    originalAccountNumber,
    storecode,
  });
  */
  

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

  if (storecode) {
    const value = String(storecode).trim();
    filters.push({ 'storeInfo.storecode': value });
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
    const dateRangeUtc: any = {};

    if (fromDate) {
      const start = parseKstDateToUtcBoundary(fromDate, false);
      if (start) {
        dateRangeUtc.$gte = start;
      }
    }

    if (toDate) {
      const end = parseKstDateToUtcBoundary(toDate, true);
      if (end) {
        dateRangeUtc.$lte = end;
      }
    }

    if (Object.keys(dateRangeUtc).length > 0) {
      filters.push({ transactionDateUtc: dateRangeUtc });
    }
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

  const manualFilters = [...filters, { matchedByAdmin: true }];
  const autoFilters = [...filters, { $or: [{ matchedByAdmin: { $exists: false } }, { matchedByAdmin: { $ne: true } }] }];

  const manualQuery = manualFilters.length ? { $and: manualFilters } : {};
  const autoQuery = autoFilters.length ? { $and: autoFilters } : {};

  const [totalManualCount, totalAutoCount] = await Promise.all([
    collection.countDocuments(manualQuery),
    collection.countDocuments(autoQuery),
  ]);

  const transfers = await collection
    .find(query)
    .sort({ transactionDateUtc: -1, _id: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .toArray();

  return {
    totalCount,
    totalAmount,
    totalManualCount,
    totalAutoCount,
    transfers,
  };
}


export async function updateBankTransferAlarm({
  id,
  alarmOn,
}: {
  id: string;
  alarmOn: boolean;
}) {
  if (!ObjectId.isValid(id)) {
    return { acknowledged: false, modifiedCount: 0 };
  }
  const client = await clientPromise;
  const collection = client.db(dbName).collection('bankTransfers');
  const result = await collection.updateOne(
    { _id: new ObjectId(id) },
    { $set: { alarmOn } },
  );
  return result;
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

  const oneDayAgoUtc = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const transactionNameRegex = `^${escapeRegex(String(transactionName || '').trim())}$`;

  const result = await collection.updateOne(
    {
      transactionType: 'deposited',
      //transactionName: transactionName,
      transactionName: { $regex: transactionNameRegex, $options: 'i' },

      amount: amount,
      transactionDateUtc: { $gte: oneDayAgoUtc },
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
    transactionDateUtc: { $gte: oneMinuteBefore, $lte: oneMinuteAfter },
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

  // 오늘 날짜 구하기 (KST 기준) -> UTC 경계로 변환
  const now = new Date();
  const kstMs = now.getTime() + 9 * 60 * 60 * 1000;
  const kstNow = new Date(kstMs);
  const y = kstNow.getUTCFullYear();
  const m = kstNow.getUTCMonth();
  const d = kstNow.getUTCDate();
  const startOfDayUtc = new Date(Date.UTC(y, m, d, 0, 0, 0) - 9 * 60 * 60 * 1000);
  const endOfDayUtc = new Date(Date.UTC(y, m, d, 23, 59, 59, 999) - 9 * 60 * 60 * 1000);

  // find unmatched bank transfers for today
  const unmatchedTransfers = await collection.find({
    transactionType: 'deposited',
    transactionName: { $regex: `^${transactionName}$`, $options: 'i' },
    amount: { $gt: 0 },
    transactionDateUtc: { $gte: startOfDayUtc, $lte: endOfDayUtc },
    match: null,
  }).sort({ transactionDateUtc: 1 }).toArray();

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
    const buyerInfo = {
      nickname: buyOrder?.nickname || '',
      bankInfo: buyOrder?.buyer || null,
    };
    const sellerInfo = buyOrder?.seller || null;

    for (const transfer of matchedTransfers) {
      await collection.updateOne(
        { _id: transfer._id },
        { $set: {
          match: 'success',
          tradeId: tradeId,
          storeInfo: storeInfo,
          buyerInfo: buyerInfo,
          sellerInfo: sellerInfo,
          memo: '자동 매칭',
        } }
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
  //const bankInfo = buyOrder?.buyer || null;
  const buyerInfo = {
    nickname: buyOrder?.nickname || '',
    bankInfo: buyOrder?.buyer || null,
  };
    
    
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
        memo: '관리자 수동 매칭',
      },
    }
  );

  return result.modifiedCount > 0;
}
