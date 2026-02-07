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
  limit = 50,
  fromDate = '',
  toDate = '',
}: {
  event?: string;
  transactionType?: string;
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

  const [totalCount, logs] = await Promise.all([
    collection.countDocuments(query),
    collection
      .find(query)
      .sort({ createdAt: -1, _id: -1 })
      .limit(safeLimit)
      .toArray(),
  ]);

  return {
    totalCount,
    logs,
  };
}
