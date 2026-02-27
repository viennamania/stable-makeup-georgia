import clientPromise from '../mongodb';
import { dbName } from '../mongodb';


const normalizeHeaders = (headers: Headers | Record<string, any> | undefined | null) => {
  if (!headers) {
    return undefined;
  }

  if (headers instanceof Headers) {
    return Object.fromEntries(headers.entries());
  }

  return headers;
};

const normalizeError = (error: any) => {
  if (!error) {
    return undefined;
  }

  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  return error;
};


export async function insertWebhookLog(data: {
  event: string;
  headers?: Headers | Record<string, any>;
  body: any;
  error?: any;
  createdAt?: string | Date;
}) {
  const client = await clientPromise;
  const collection = client.db(dbName).collection('webhookLogs');

  const payload = {
    ...data,
    headers: normalizeHeaders(data.headers),
    error: normalizeError(data.error),
    createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
  };

  const result = await collection.insertOne(payload);

  if (!result?.acknowledged) {
    return null;
  }

  return {
    _id: result.insertedId,
    ...payload,
  };
}


export async function getWebhookLogs({
  event = '',
  transactionType = '',
  reasonCode = '',
  limit = 50,
  fromDate = '',
  toDate = '',
}: {
  event?: string;
  transactionType?: string;
  reasonCode?: string;
  limit?: number;
  fromDate?: string | Date;
  toDate?: string | Date;
}) {
  const client = await clientPromise;
  const collection = client.db(dbName).collection('webhookLogs');

  const filters: any[] = [];

  
  if (event) {
    filters.push({ event: String(event) });
  }

  if (transactionType) {
    filters.push({ 'body.transaction_type': String(transactionType) });
  }

  if (reasonCode) {
    filters.push({ 'body.reasonCode': String(reasonCode) });
  }
  



  if (fromDate || toDate) {
    const range: Record<string, Date> = {};

    if (fromDate) {
      const start = fromDate instanceof Date ? fromDate : new Date(fromDate);
      range.$gte = start;
    }

    if (toDate) {
      const end = toDate instanceof Date ? toDate : new Date(toDate);
      range.$lte = end;
    }

    filters.push({ createdAt: range });
  }

  const query = filters.length ? { $and: filters } : {};

  const safeLimit = Math.min(Math.max(Number(limit) || 5000, 1), 20000);


  /*
  const [totalCount, logs] = await Promise.all([
    collection.countDocuments(query),
    collection
      .find(query)
      .sort({ createdAt: -1, _id: -1 })
      .limit(safeLimit)
      .toArray(),
  ]);
  */
  /*
  bankInfos collection
  {
    "_id": {
      "$oid": "697ce1784cac2762e3485731"
    },
    "bankName": "농협",
    "realAccountNumber": "3520946632383",
    "defaultAccountNumber": "3528879532639",
    "accountHolder": "김민우",
    "createdAt": {
      "$date": "2026-01-30T16:51:04.447Z"
    },
    "updatedAt": {
      "$date": "2026-02-04T05:51:56.474Z"
    },
    "aliasAccountNumber": [
      "3528879532639"
    ],
    "touchedAt": {
      "$date": "2026-02-07T16:41:53.227Z"
    },
    "balance": 5646000,
    "idCardImageUrl": "",
    "phoneNumber": "01097306240",
    "realName": "김민우",
    "residentNumber": "990716-1"
  }

  fint defaultAccountNumber, accountHolder by

  join bankInfos on body.bank_account_number = bankInfos.realAccountNumber

  */
  const aggregationPipeline: any[] = [
    { $match: query },
    {
      $lookup: {
        from: 'bankInfos',
        localField: 'body.bank_account_number',
        foreignField: 'realAccountNumber',
        as: 'bankInfo',
      },
    },
    { $unwind: { path: '$bankInfo', preserveNullAndEmptyArrays: true } },
    { $sort: { createdAt: -1, _id: -1 } },
    { $limit: safeLimit },
    {
      $project: {
        event: 1,
        headers: 1,
        body: 1,
        error: 1,
        createdAt: 1,
        bankInfo: {
          bankName: 1,
          realAccountNumber: 1,
          defaultAccountNumber: 1,
          accountHolder: 1,
        },
      },
    },
  ];


  const [totalCount, logs] = await Promise.all([
    collection.countDocuments(query),
    collection.aggregate(aggregationPipeline).toArray(),
  ]);



  return {
    totalCount,
    logs,
  };
}
