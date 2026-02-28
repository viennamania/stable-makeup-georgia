import { NextResponse, type NextRequest } from "next/server";

import { getRealtimeBuyOrderSearchList } from "@lib/api/buyOrderStatusRealtimeEvent";
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

  const page = Number(request.nextUrl.searchParams.get("page") || 1);
  const limit = Number(request.nextUrl.searchParams.get("limit") || 10);
  const status = String(request.nextUrl.searchParams.get("status") || "all");
  const q = String(request.nextUrl.searchParams.get("q") || "");

  try {
    const result = await getRealtimeBuyOrderSearchList({
      page,
      limit,
      status,
      searchQuery: q,
    });

    return NextResponse.json({
      status: "success",
      role,
      totalCount: result.totalCount,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
      orders: result.orders,
      updatedAt: result.updatedAt,
    });
  } catch (error) {
    console.error("Failed to read buyorder search list:", error);
    return NextResponse.json(
      {
        status: "error",
        message: "Failed to read buyorder search list",
      },
      { status: 500 },
    );
  }
}
