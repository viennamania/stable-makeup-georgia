import { NextResponse, type NextRequest } from "next/server";
import { ObjectId } from "mongodb";

import { getBankTransferRealtimeEvents } from "@lib/api/bankTransferRealtimeEvent";
import { authorizeRealtimeRequest } from "@lib/realtime/rbac";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
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
    const result = await getBankTransferRealtimeEvents({
      sinceCursor: since,
      limit,
    });

    return NextResponse.json({
      status: "success",
      role: authResult.role,
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
