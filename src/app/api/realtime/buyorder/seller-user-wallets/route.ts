import { NextResponse, type NextRequest } from "next/server";

import { getRealtimeNicknameSellerWalletBalances } from "@lib/api/buyOrderStatusRealtimeEvent";
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

  const nickname = request.nextUrl.searchParams.get("nickname") || "seller";
  const excludeStorecode = request.nextUrl.searchParams.get("excludeStorecode") || "";
  const limit = Number(request.nextUrl.searchParams.get("limit") || 120);

  try {
    const result = await getRealtimeNicknameSellerWalletBalances({
      nickname,
      excludeStorecode,
      limit,
    });

    return NextResponse.json({
      status: "success",
      role,
      nickname,
      excludeStorecode,
      totalCount: result.totalCount,
      totalCurrentUsdtBalance: result.totalCurrentUsdtBalance,
      wallets: result.wallets,
      updatedAt: result.updatedAt,
    });
  } catch (error) {
    console.error("Failed to read realtime nickname seller wallet balances:", error);
    return NextResponse.json(
      {
        status: "error",
        message: "Failed to read realtime nickname seller wallet balances",
      },
      { status: 500 },
    );
  }
}
