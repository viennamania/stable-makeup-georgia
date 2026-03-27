import { ObjectId } from "mongodb";

import clientPromise, { dbName } from "@lib/mongodb";
import type { BankTransferDashboardEvent } from "@lib/ably/constants";

const COLLECTION_NAME = "bankTransferRealtimeEvents";
const ENABLE_BANK_TRANSFER_REALTIME_RUNTIME_INDEX_CREATION =
  String(process.env.ENABLE_BANK_TRANSFER_REALTIME_RUNTIME_INDEX_CREATION || "").toLowerCase() ===
  "true";

type BankTransferRealtimeEventDocument = {
  _id: ObjectId;
  eventId: string;
  idempotencyKey: string;
  payload: BankTransferDashboardEvent;
  createdAt: Date;
};

type BankTransferRealtimeEventSort = "asc" | "desc";
type NormalizedBankTransferTransactionType = "deposited" | "withdrawn" | "";

let ensureIndexesPromise: Promise<void> | null = null;

async function ensureIndexes() {
  if (!ENABLE_BANK_TRANSFER_REALTIME_RUNTIME_INDEX_CREATION) {
    return;
  }

  if (!ensureIndexesPromise) {
    ensureIndexesPromise = (async () => {
      const client = await clientPromise;
      const collection = client.db(dbName).collection<BankTransferRealtimeEventDocument>(COLLECTION_NAME);

      await collection.createIndex({ eventId: 1 }, { unique: true, name: "uniq_eventId" });
      await collection.createIndex({ idempotencyKey: 1, createdAt: -1 }, { name: "idx_idempotency_createdAt" });
      await collection.createIndex({ createdAt: -1 }, { name: "idx_createdAt" });
      await collection.createIndex({ "payload.storecode": 1, _id: -1 }, { name: "idx_payload_storecode_id" });
      await collection.createIndex({ "payload.transactionType": 1, _id: -1 }, { name: "idx_payload_transactionType_id" });
    })();
  }

  await ensureIndexesPromise;
}

function toCursor(value: ObjectId): string {
  return value.toHexString();
}

const normalizeStorecode = (value: unknown) => {
  if (typeof value !== "string") {
    return "";
  }
  return value.trim();
};

const normalizeTransactionType = (value: unknown): NormalizedBankTransferTransactionType => {
  const normalized = String(value || "").trim().toLowerCase();

  if (normalized === "deposited" || normalized === "deposit" || normalized === "입금") {
    return "deposited";
  }

  if (normalized === "withdrawn" || normalized === "withdrawal" || normalized === "출금") {
    return "withdrawn";
  }

  return "";
};

const resolveSortDirection = (value: unknown): BankTransferRealtimeEventSort => {
  return String(value || "").trim().toLowerCase() === "desc" ? "desc" : "asc";
};

const buildTransactionTypeQuery = (value: NormalizedBankTransferTransactionType) => {
  if (value === "deposited") {
    return {
      $or: [
        {
          "payload.transactionType": {
            $regex: /^(deposited|deposit)$/i,
          },
        },
        {
          "payload.transactionType": "입금",
        },
      ],
    };
  }

  if (value === "withdrawn") {
    return {
      $or: [
        {
          "payload.transactionType": {
            $regex: /^(withdrawn|withdrawal)$/i,
          },
        },
        {
          "payload.transactionType": "출금",
        },
      ],
    };
  }

  return {};
};

export async function saveBankTransferRealtimeEvent({
  eventId,
  idempotencyKey,
  payload,
}: {
  eventId: string;
  idempotencyKey: string;
  payload: BankTransferDashboardEvent;
}): Promise<{
  cursor: string;
  event: BankTransferDashboardEvent;
  isDuplicate: boolean;
}> {
  await ensureIndexes();

  const client = await clientPromise;
  const collection = client.db(dbName).collection<BankTransferRealtimeEventDocument>(COLLECTION_NAME);

  const now = new Date();

  const upsertResult = await collection.updateOne(
    { eventId },
    {
      $setOnInsert: {
        eventId,
        idempotencyKey,
        payload,
        createdAt: now,
      },
    },
    { upsert: true },
  );

  if (upsertResult.upsertedId) {
    const insertedId = upsertResult.upsertedId as ObjectId;

    return {
      cursor: toCursor(insertedId),
      event: {
        ...payload,
        cursor: toCursor(insertedId),
      },
      isDuplicate: false,
    };
  }

  const existing = await collection.findOne(
    { eventId },
    { projection: { _id: 1, payload: 1 } },
  );

  if (!existing) {
    throw new Error(`Failed to load existing realtime event: ${eventId}`);
  }

  return {
    cursor: toCursor(existing._id),
    event: {
      ...existing.payload,
      cursor: toCursor(existing._id),
    },
    isDuplicate: true,
  };
}

export async function getBankTransferRealtimeEvents({
  sinceCursor,
  limit = 50,
  transactionType,
  storecode,
  sort = "asc",
}: {
  sinceCursor?: string | null;
  limit?: number;
  transactionType?: string | null;
  storecode?: string | null;
  sort?: BankTransferRealtimeEventSort;
}): Promise<{
  events: BankTransferDashboardEvent[];
  nextCursor: string | null;
}> {
  await ensureIndexes();

  const client = await clientPromise;
  const collection = client.db(dbName).collection<BankTransferRealtimeEventDocument>(COLLECTION_NAME);

  const safeLimit = Math.min(Math.max(Number(limit) || 50, 1), 200);
  const safeStorecode = normalizeStorecode(storecode);
  const safeTransactionType = normalizeTransactionType(transactionType);
  const safeSort = resolveSortDirection(sort);
  const sortDirection = safeSort === "desc" ? -1 : 1;

  const hasSinceCursor = Boolean(sinceCursor && ObjectId.isValid(sinceCursor));
  const query: Record<string, unknown> = {
    ...buildTransactionTypeQuery(safeTransactionType),
  };

  if (safeStorecode) {
    query["payload.storecode"] = safeStorecode;
  }

  if (hasSinceCursor) {
    query._id = {
      $gt: new ObjectId(String(sinceCursor)),
    };
  }

  let docs: BankTransferRealtimeEventDocument[];

  if (hasSinceCursor) {
    docs = await collection
      .find(query)
      .sort({ _id: sortDirection })
      .limit(safeLimit)
      .toArray();
  } else if (safeSort === "desc") {
    docs = await collection
      .find(query)
      .sort({ _id: -1 })
      .limit(safeLimit)
      .toArray();
  } else {
    const latestDocs = await collection
      .find(query)
      .sort({ _id: -1 })
      .limit(safeLimit)
      .toArray();

    docs = latestDocs.reverse();
  }

  const events = docs.map((doc) => {
    return {
      ...doc.payload,
      cursor: toCursor(doc._id),
    };
  });

  const nextCursor = docs.length > 0
    ? toCursor(safeSort === "desc" ? docs[0]._id : docs[docs.length - 1]._id)
    : sinceCursor || null;

  return {
    events,
    nextCursor,
  };
}
