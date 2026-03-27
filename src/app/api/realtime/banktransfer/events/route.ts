import { NextResponse, type NextRequest } from "next/server";
import { ObjectId } from "mongodb";

import { getBankTransferRealtimeEvents } from "@lib/api/bankTransferRealtimeEvent";
import { authorizeRealtimeRequest } from "@lib/realtime/rbac";

export const runtime = "nodejs";

const normalizeString = (value: string | null) => {
  return typeof value === "string" ? value.trim() : "";
};

const normalizeTransactionType = (value: string | null) => {
  const normalized = normalizeString(value).toLowerCase();

  if (!normalized) {
    return "";
  }

  if (normalized === "deposited" || normalized === "deposit" || normalized === "입금") {
    return "deposited";
  }

  if (normalized === "withdrawn" || normalized === "withdrawal" || normalized === "출금") {
    return "withdrawn";
  }

  return null;
};

const normalizeSort = (value: string | null) => {
  const normalized = normalizeString(value).toLowerCase();

  if (!normalized || normalized === "asc") {
    return "asc" as const;
  }

  if (normalized === "desc") {
    return "desc" as const;
  }

  return null;
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
  const storecode = normalizeString(request.nextUrl.searchParams.get("storecode"));
  const transactionType = normalizeTransactionType(
    request.nextUrl.searchParams.get("transactionType"),
  );
  const sort = normalizeSort(request.nextUrl.searchParams.get("sort"));

  if (since && !ObjectId.isValid(since)) {
    return NextResponse.json(
      {
        status: "error",
        message: "Invalid cursor",
      },
      { status: 400 },
    );
  }

  if (transactionType === null) {
    return NextResponse.json(
      {
        status: "error",
        message: "Invalid transactionType",
      },
      { status: 400 },
    );
  }

  if (sort === null) {
    return NextResponse.json(
      {
        status: "error",
        message: "Invalid sort",
      },
      { status: 400 },
    );
  }

  try {
    const result = await getBankTransferRealtimeEvents({
      sinceCursor: since,
      limit,
      transactionType,
      storecode,
      sort,
    });

    return NextResponse.json({
      status: "success",
      role,
      events: result.events,
      nextCursor: result.nextCursor,
    });
  } catch (error) {
    console.error("Failed to read banktransfer realtime events:", error);
    return NextResponse.json(
      {
        status: "error",
        message: "Failed to read banktransfer realtime events",
      },
      { status: 500 },
    );
  }
}
