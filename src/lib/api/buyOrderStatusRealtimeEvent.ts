import { ObjectId } from "mongodb";

import clientPromise, { dbName } from "@lib/mongodb";
import type { BuyOrderStatusRealtimeEvent } from "@lib/ably/constants";

const COLLECTION_NAME = "buyOrderStatusRealtimeEvents";
const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

type BuyOrderStatusRealtimeEventDocument = {
  _id: ObjectId;
  eventId: string;
  idempotencyKey: string;
  payload: BuyOrderStatusRealtimeEvent;
  createdAt: Date;
};

let ensureIndexesPromise: Promise<void> | null = null;

async function ensureIndexes() {
  if (!ensureIndexesPromise) {
    ensureIndexesPromise = (async () => {
      const client = await clientPromise;
      const collection = client
        .db(dbName)
        .collection<BuyOrderStatusRealtimeEventDocument>(COLLECTION_NAME);

      await collection.createIndex({ eventId: 1 }, { unique: true, name: "uniq_eventId" });
      await collection.createIndex({ idempotencyKey: 1, createdAt: -1 }, { name: "idx_idempotency_createdAt" });
      await collection.createIndex({ createdAt: -1 }, { name: "idx_createdAt" });
      await collection.createIndex(
        { "payload.statusTo": 1, "payload.publishedAt": -1 },
        { name: "idx_statusTo_publishedAt" },
      );
    })();
  }

  await ensureIndexesPromise;
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

  return {
    dateKst: `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
    startUtc,
    endUtc,
  };
}

function toCursor(value: ObjectId): string {
  return value.toHexString();
}

export type BuyOrderTodaySummary = {
  dateKst: string;
  confirmedCount: number;
  confirmedAmountKrw: number;
  confirmedAmountUsdt: number;
  updatedAt: string;
};

export async function saveBuyOrderStatusRealtimeEvent({
  eventId,
  idempotencyKey,
  payload,
}: {
  eventId: string;
  idempotencyKey: string;
  payload: BuyOrderStatusRealtimeEvent;
}): Promise<{
  cursor: string;
  event: BuyOrderStatusRealtimeEvent;
  isDuplicate: boolean;
}> {
  await ensureIndexes();

  const client = await clientPromise;
  const collection = client
    .db(dbName)
    .collection<BuyOrderStatusRealtimeEventDocument>(COLLECTION_NAME);

  const upsertResult = await collection.updateOne(
    { eventId },
    {
      $setOnInsert: {
        eventId,
        idempotencyKey,
        payload,
        createdAt: new Date(),
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
    throw new Error(`Failed to load existing buyorder realtime event: ${eventId}`);
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

export async function getBuyOrderStatusRealtimeEvents({
  sinceCursor,
  limit = 50,
}: {
  sinceCursor?: string | null;
  limit?: number;
}): Promise<{
  events: BuyOrderStatusRealtimeEvent[];
  nextCursor: string | null;
}> {
  await ensureIndexes();

  const client = await clientPromise;
  const collection = client
    .db(dbName)
    .collection<BuyOrderStatusRealtimeEventDocument>(COLLECTION_NAME);

  const safeLimit = Math.min(Math.max(Number(limit) || 50, 1), 300);

  const hasSinceCursor = Boolean(sinceCursor && ObjectId.isValid(sinceCursor));
  const query = hasSinceCursor
    ? {
        _id: {
          $gt: new ObjectId(String(sinceCursor)),
        },
      }
    : {};

  let docs: BuyOrderStatusRealtimeEventDocument[] = [];

  if (hasSinceCursor) {
    docs = await collection
      .find(query)
      .sort({ _id: 1 })
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

  const nextCursor = docs.length > 0 ? toCursor(docs[docs.length - 1]._id) : sinceCursor || null;

  return {
    events,
    nextCursor,
  };
}

export async function getBuyOrderTodaySummary(): Promise<BuyOrderTodaySummary> {
  const client = await clientPromise;
  const collection = client.db(dbName).collection("buyorders");

  const { dateKst, startUtc, endUtc } = getKstUtcDayRange();
  const startIso = startUtc.toISOString();
  // Keep boundary behavior aligned with admin/buyorder totals.
  const endIso = new Date(`${dateKst}T23:59:59+09:00`).toISOString();

  const summaryResult = await collection
    .aggregate([
      {
        $match: {
          status: "paymentConfirmed",
          privateSale: false,
          createdAt: {
            $gte: startIso,
            $lt: endIso,
          },
        },
      },
      {
        $group: {
          _id: null,
          confirmedCount: { $sum: 1 },
          confirmedAmountKrw: { $sum: "$krwAmount" },
          confirmedAmountUsdt: { $sum: "$usdtAmount" },
        },
      },
    ])
    .toArray();

  const summary = summaryResult[0] || {};

  return {
    dateKst,
    confirmedCount: Number(summary.confirmedCount || 0),
    confirmedAmountKrw: Number(summary.confirmedAmountKrw || 0),
    confirmedAmountUsdt: Number(summary.confirmedAmountUsdt || 0),
    updatedAt: new Date().toISOString(),
  };
}
