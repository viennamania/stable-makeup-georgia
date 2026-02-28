import { NextResponse, type NextRequest } from "next/server";

import { getRealtimeBuyOrderSellerWalletBalances } from "@lib/api/buyOrderStatusRealtimeEvent";
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

  const limit = Number(request.nextUrl.searchParams.get("limit") || 12);

  try {
    const result = await getRealtimeBuyOrderSellerWalletBalances({ limit });
    return NextResponse.json({
      status: "success",
      role,
      totalCount: result.totalCount,
      wallets: result.wallets,
      updatedAt: result.updatedAt,
    });
  } catch (error) {
    console.error("Failed to read buyorder seller wallet balances:", error);
    return NextResponse.json(
      {
        status: "error",
        message: "Failed to read buyorder seller wallet balances",
      },
      { status: 500 },
    );
  }
}
