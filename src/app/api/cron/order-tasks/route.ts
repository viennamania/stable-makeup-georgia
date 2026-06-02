import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";

import clientPromise, { dbName } from "@/lib/mongodb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const ROUTE = "/api/cron/order-tasks";
const LOCK_COLLECTION = "cronLocks";
const LOCK_KEY = "order-tasks-v1";

const DEFAULT_LOCK_TTL_MS = 55_000;
const DEFAULT_TASK_TIMEOUT_MS = 25_000;

type LockAcquireResult = {
  acquired: boolean;
  owner: string;
  lockedUntil: Date;
  reason: string;
};

const normalizeString = (value: unknown): string => {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
};

const normalizeBoolean = (value: unknown): boolean => {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "number") {
    return value === 1;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    return normalized === "true" || normalized === "1" || normalized === "yes";
  }

  return false;
};

const parsePositiveInteger = (value: unknown, fallback: number): number => {
  const parsed = Number.parseInt(normalizeString(value), 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
};

const parseBearerToken = (request: NextRequest): string => {
  const authHeader = normalizeString(request.headers.get("authorization"));
  if (!authHeader.toLowerCase().startsWith("bearer ")) {
    return "";
  }

  return normalizeString(authHeader.slice(7));
};

const verifyCronAuth = (request: NextRequest): { ok: boolean; status: number; error: string } => {
  const expected = normalizeString(process.env.CRON_SECRET);
  if (!expected) {
    return {
      ok: false,
      status: 500,
      error: "CRON_SECRET is not configured in deployment environment",
    };
  }

  const received = parseBearerToken(request);
  if (!received || received !== expected) {
    return {
      ok: false,
      status: 401,
      error: "Unauthorized cron request",
    };
  }

  return { ok: true, status: 200, error: "" };
};

const acquireLock = async ({
  key,
  ttlMs,
}: {
  key: string;
  ttlMs: number;
}): Promise<LockAcquireResult> => {
  const dbClient = await clientPromise;
  const lockCollection = dbClient.db(dbName).collection<any>(LOCK_COLLECTION);
  const now = new Date();
  const lockedUntil = new Date(now.getTime() + Math.max(1000, ttlMs));
  const owner = randomUUID();

  const updateResult = await lockCollection.updateOne(
    {
      _id: key,
      $or: [
        { lockedUntil: { $lte: now } },
        { lockedUntil: { $exists: false } },
      ],
    },
    {
      $set: {
        owner,
        lockedUntil,
        updatedAt: now,
      },
      $setOnInsert: {
        createdAt: now,
      },
    },
    { upsert: false },
  );

  if (updateResult.modifiedCount === 1) {
    return {
      acquired: true,
      owner,
      lockedUntil,
      reason: "updated_expired_lock",
    };
  }

  if (updateResult.matchedCount === 0) {
    try {
      await lockCollection.insertOne({
        _id: key,
        owner,
        lockedUntil,
        createdAt: now,
        updatedAt: now,
      });

      return {
        acquired: true,
        owner,
        lockedUntil,
        reason: "created_lock",
      };
    } catch {
      // Another runner created the lock first.
    }
  }

  const currentLock = await lockCollection.findOne(
    { _id: key },
    { projection: { owner: 1, lockedUntil: 1 } },
  );
  const currentLockUntil = currentLock?.lockedUntil
    ? new Date(currentLock.lockedUntil)
    : new Date(0);

  return {
    acquired: false,
    owner,
    lockedUntil: currentLockUntil,
    reason: "lock_held_by_another_runner",
  };
};

const releaseLock = async ({
  key,
  owner,
}: {
  key: string;
  owner: string;
}): Promise<void> => {
  const dbClient = await clientPromise;
  const lockCollection = dbClient.db(dbName).collection<any>(LOCK_COLLECTION);
  await lockCollection.updateOne(
    { _id: key, owner },
    {
      $set: {
        lockedUntil: new Date(0),
        updatedAt: new Date(),
        releasedAt: new Date(),
      },
    },
  );
};

const resolveBaseUrl = (request: NextRequest): string => {
  const configuredBaseUrl = normalizeString(process.env.ORDER_TASK_CRON_BASE_URL);
  if (configuredBaseUrl) {
    return configuredBaseUrl.replace(/\/+$/, "");
  }

  return request.nextUrl.origin.replace(/\/+$/, "");
};

const fetchTask = async ({
  baseUrl,
  path,
  timeoutMs,
  body,
}: {
  baseUrl: string;
  path: string;
  timeoutMs: number;
  body: Record<string, unknown>;
}) => {
  const startedAt = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), Math.max(1000, timeoutMs));

  try {
    const response = await fetch(new URL(path, baseUrl), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
      signal: controller.signal,
      cache: "no-store",
    });

    const text = await response.text();
    let data: unknown = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = { raw: text };
    }

    return {
      path,
      ok: response.ok,
      status: response.status,
      durationMs: Date.now() - startedAt,
      data,
    };
  } catch (error) {
    return {
      path,
      ok: false,
      status: 0,
      durationMs: Date.now() - startedAt,
      error: error instanceof Error ? error.message : String(error),
    };
  } finally {
    clearTimeout(timer);
  }
};

async function runOrderTasks(request: NextRequest) {
  const baseUrl = resolveBaseUrl(request);
  const timeoutMs = parsePositiveInteger(
    process.env.ORDER_TASK_CRON_TASK_TIMEOUT_MS,
    DEFAULT_TASK_TIMEOUT_MS,
  );
  const forceRequestPayment =
    normalizeBoolean(request.nextUrl.searchParams.get("force"))
    || normalizeBoolean(process.env.ORDER_TASK_CRON_FORCE_REQUEST_PAYMENT);

  const acceptBuyOrder = await fetchTask({
    baseUrl,
    path: "/api/order/acceptBuyOrderTaskV2",
    timeoutMs,
    body: {},
  });
  const requestPayment = await fetchTask({
    baseUrl,
    path: "/api/order/buyOrderRequestPaymentTaskV2",
    timeoutMs,
    body: forceRequestPayment ? { force: true } : {},
  });

  return {
    baseUrl,
    acceptBuyOrder,
    requestPayment,
  };
}

export async function GET(request: NextRequest) {
  const disabled = normalizeBoolean(process.env.ORDER_TASK_CRON_DISABLED);
  if (disabled) {
    return NextResponse.json({
      ok: true,
      route: ROUTE,
      skipped: true,
      reason: "cron_disabled",
    });
  }

  const authResult = verifyCronAuth(request);
  if (!authResult.ok) {
    return NextResponse.json(
      {
        ok: false,
        route: ROUTE,
        error: authResult.error,
      },
      { status: authResult.status },
    );
  }

  const lockTtlMs = parsePositiveInteger(
    process.env.ORDER_TASK_CRON_LOCK_TTL_MS,
    DEFAULT_LOCK_TTL_MS,
  );
  const lock = await acquireLock({
    key: LOCK_KEY,
    ttlMs: lockTtlMs,
  });

  if (!lock.acquired) {
    return NextResponse.json({
      ok: true,
      route: ROUTE,
      skipped: true,
      reason: lock.reason,
      lockedUntil: lock.lockedUntil.toISOString(),
    });
  }

  try {
    const startedAt = Date.now();
    const result = await runOrderTasks(request);
    const ok = Boolean(result.acceptBuyOrder.ok && result.requestPayment.ok);

    return NextResponse.json(
      {
        ok,
        route: ROUTE,
        lockReason: lock.reason,
        elapsedMs: Date.now() - startedAt,
        result,
      },
      { status: ok ? 200 : 502 },
    );
  } finally {
    await releaseLock({
      key: LOCK_KEY,
      owner: lock.owner,
    });
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}
