import { NextResponse, type NextRequest } from "next/server";

import { getRealtimePendingBuyOrders } from "@lib/api/buyOrderStatusRealtimeEvent";
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

  const limitParam = request.nextUrl.searchParams.get("limit");
  const limit = Number(limitParam || 24);

  try {
    const result = await getRealtimePendingBuyOrders({ limit });

    return NextResponse.json({
      status: "success",
      role,
      totalCount: result.totalCount,
      orders: result.orders,
      updatedAt: result.updatedAt,
    });
  } catch (error) {
    console.error("Failed to read buyorder pending list:", error);
    return NextResponse.json(
      {
        status: "error",
        message: "Failed to read buyorder pending list",
      },
      { status: 500 },
    );
  }
}
