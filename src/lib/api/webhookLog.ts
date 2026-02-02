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
