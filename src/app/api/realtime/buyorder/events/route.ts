import { NextResponse, type NextRequest } from "next/server";
import { ObjectId } from "mongodb";

import { getBuyOrderStatusRealtimeEvents } from "@lib/api/buyOrderStatusRealtimeEvent";
import { authorizeRealtimeRequest } from "@lib/realtime/rbac";

export const runtime = "nodejs";

const REALTIME_BUYORDER_EVENTS_RETRY_COUNT = Math.max(
  Number.parseInt(process.env.REALTIME_BUYORDER_EVENTS_RETRY_COUNT || "", 10) || 2,
  1,
);
const REALTIME_BUYORDER_EVENTS_RETRY_DELAY_MS = Math.max(
  Number.parseInt(process.env.REALTIME_BUYORDER_EVENTS_RETRY_DELAY_MS || "", 10) || 200,
  50,
);
const REALTIME_BUYORDER_EVENTS_ERROR_LOG_THROTTLE_MS = Math.max(
  Number.parseInt(process.env.REALTIME_BUYORDER_EVENTS_ERROR_LOG_THROTTLE_MS || "", 10) || 60000,
  1000,
);

let lastRealtimeBuyorderEventsErrorLoggedAt = 0;

const isTransientMongoError = (error: unknown): boolean => {
  if (!error || typeof error !== "object") {
    return false;
  }

  const anyError = error as any;
  const labels = anyError?.errorLabelSet instanceof Set
    ? Array.from(anyError.errorLabelSet)
    : [];
  const labelSet = new Set(labels.map((label) => String(label)));
  const name = String(anyError?.name || "");
  const message = String(anyError?.message || "");
  const code = String(anyError?.code || anyError?.cause?.code || "");
  const causeName = String(anyError?.cause?.name || "");

  if (labelSet.has("ResetPool") || labelSet.has("PoolRequestedRetry") || labelSet.has("PoolRequstedRetry")) {
    return true;
  }

  if (
    name === "MongoPoolClearedError" ||
    name === "MongoNetworkError" ||
    causeName === "MongoNetworkError"
  ) {
    return true;
  }

  if (code === "ECONNRESET") {
    return true;
  }

  return message.includes("Connection pool") || message.includes("TLS connection");
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const withTransientMongoRetry = async <T>(work: () => Promise<T>): Promise<T> => {
  let attempt = 0;
  let lastError: unknown;

  while (attempt < REALTIME_BUYORDER_EVENTS_RETRY_COUNT) {
    attempt += 1;
    try {
      return await work();
    } catch (error) {
      lastError = error;
      if (!isTransientMongoError(error) || attempt >= REALTIME_BUYORDER_EVENTS_RETRY_COUNT) {
        throw error;
      }
      await sleep(REALTIME_BUYORDER_EVENTS_RETRY_DELAY_MS * attempt);
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Unknown buyorder realtime events failure");
};

const logRealtimeBuyorderEventsErrorThrottled = (message: string, error: unknown) => {
  const now = Date.now();
  if (now - lastRealtimeBuyorderEventsErrorLoggedAt < REALTIME_BUYORDER_EVENTS_ERROR_LOG_THROTTLE_MS) {
    return;
  }
  lastRealtimeBuyorderEventsErrorLoggedAt = now;
  console.error(message, error);
};

export async function GET(request: NextRequest) {
  const isPublic = request.nextUrl.searchParams.get("public") === "1";

  let role: "admin" | "viewer" = "viewer";

  if (!isPublic) {
    const authResult = authorizeRealtimeRequest(request, ["admin", "viewer"]);
    if (!authResult.ok) {
      return NextResponse.json(
        {
          status: "error",
          message: authResult.message,
        },
        { status: authResult.status },
      );
    }

    role = authResult.role;
  }

  const since = request.nextUrl.searchParams.get("since");
  const limitParam = request.nextUrl.searchParams.get("limit");
  const limit = Number(limitParam || 50);

  if (since && !ObjectId.isValid(since)) {
    return NextResponse.json(
      {
        status: "error",
        message: "Invalid cursor",
      },
      { status: 400 },
    );
  }

  try {
    const result = await withTransientMongoRetry(() =>
      getBuyOrderStatusRealtimeEvents({
        sinceCursor: since,
        limit,
      }),
    );

    return NextResponse.json({
      status: "success",
      role,
      events: result.events,
      nextCursor: result.nextCursor,
    });
  } catch (error) {
    logRealtimeBuyorderEventsErrorThrottled("Failed to read buyorder realtime events:", error);

    if (isTransientMongoError(error)) {
      return NextResponse.json({
        status: "success",
        role,
        events: [],
        nextCursor: since || null,
        degraded: true,
      });
    }

    return NextResponse.json(
      {
        status: "error",
        message: "Failed to read buyorder realtime events",
      },
      { status: 500 },
    );
  }
}
