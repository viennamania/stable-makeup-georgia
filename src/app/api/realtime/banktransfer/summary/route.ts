import { NextResponse, type NextRequest } from "next/server";

import { getBankTransferTodaySummary } from "@lib/api/bankTransfer";
import { authorizeRealtimeRequest } from "@lib/realtime/rbac";

export const runtime = "nodejs";

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

  try {
    const summary = await getBankTransferTodaySummary();

    return NextResponse.json({
      status: "success",
      role,
      summary,
    });
  } catch (error) {
    console.error("Failed to read banktransfer today summary:", error);
    return NextResponse.json(
      {
        status: "error",
        message: "Failed to read banktransfer today summary",
      },
      { status: 500 },
    );
  }
}

