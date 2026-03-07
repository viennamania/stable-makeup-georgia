import { MongoClient, type MongoClientOptions } from "mongodb";

const uri = process.env.MONGODB_URI;

if (!uri) {
  throw new Error("Missing MONGODB_URI environment variable");
}

const options: MongoClientOptions = {
  // Keep selection timeout short so request paths fail fast on transient Atlas networking issues.
  serverSelectionTimeoutMS: Number(process.env.MONGODB_SERVER_SELECTION_TIMEOUT_MS || 5000),
  connectTimeoutMS: Number(process.env.MONGODB_CONNECT_TIMEOUT_MS || 10000),
  socketTimeoutMS: Number(process.env.MONGODB_SOCKET_TIMEOUT_MS || 20000),
  maxPoolSize: Number(process.env.MONGODB_MAX_POOL_SIZE || 20),
  minPoolSize: 0,
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
