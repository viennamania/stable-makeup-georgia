import { MongoClient, type MongoClientOptions } from "mongodb";

const uri = process.env.MONGODB_URI;

if (!uri) {
  throw new Error("Missing MONGODB_URI environment variable");
}

const mongoIpFamily = Number(process.env.MONGODB_IP_FAMILY || 4) === 6 ? 6 : 4;
const mongoReadPreferenceRaw = String(
  process.env.MONGODB_READ_PREFERENCE || "secondaryPreferred",
).trim();
const mongoReadPreferenceAllowed = new Set([
  "primary",
  "primaryPreferred",
  "secondary",
  "secondaryPreferred",
  "nearest",
]);
const mongoReadPreference = mongoReadPreferenceAllowed.has(mongoReadPreferenceRaw)
  ? (mongoReadPreferenceRaw as NonNullable<MongoClientOptions["readPreference"]>)
  : "secondaryPreferred";

const options: MongoClientOptions = {
  // Keep selection timeout short so request paths fail fast on transient Atlas networking issues.
  serverSelectionTimeoutMS: Number(process.env.MONGODB_SERVER_SELECTION_TIMEOUT_MS || 5000),
  connectTimeoutMS: Number(process.env.MONGODB_CONNECT_TIMEOUT_MS || 10000),
  socketTimeoutMS: Number(process.env.MONGODB_SOCKET_TIMEOUT_MS || 15000),
  // Vercel serverless workers multiply pools per route and instance, so keep defaults conservative.
  // Admin P2P history can run several read aggregations for one request; `4` is too tight under load.
  maxPoolSize: Number(process.env.MONGODB_MAX_POOL_SIZE || 10),
  minPoolSize: 0,
  maxConnecting: Number(process.env.MONGODB_MAX_CONNECTING || 2),
  waitQueueTimeoutMS: Number(process.env.MONGODB_WAIT_QUEUE_TIMEOUT_MS || 10000),
  maxIdleTimeMS: Number(process.env.MONGODB_MAX_IDLE_TIME_MS || 10000),
  family: mongoIpFamily,
  readPreference: mongoReadPreference,
  retryReads: true,
};

declare global {
  var _mongoClient: MongoClient | undefined;
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

const createClientPromise = async (): Promise<MongoClient> => {
  const client = global._mongoClient ?? new MongoClient(uri, options);
  global._mongoClient = client;

  try {
    await client.connect();
    return client;
  } catch (error) {
    // Reset cached handles so next await can retry connection.
    global._mongoClientPromise = undefined;
    global._mongoClient = undefined;

    try {
      await client.close();
    } catch {
      // Ignore close errors after failed connect.
    }

    throw error;
  }
};

const getClientPromise = () => {
  if (!global._mongoClientPromise) {
    global._mongoClientPromise = createClientPromise();
  }

  return global._mongoClientPromise;
};

const clientPromise = new Proxy(Promise.resolve({} as MongoClient), {
  get(_target, prop, receiver) {
    const promise = getClientPromise() as any;
    const value = Reflect.get(promise, prop, receiver);
    return typeof value === "function" ? value.bind(promise) : value;
  },
}) as Promise<MongoClient>;

export default clientPromise;

export const dbName = process.env.MONGODB_DB_NAME || "georgia";
