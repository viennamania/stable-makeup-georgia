import { NextResponse, type NextRequest } from "next/server";

import { getBlockedBuyOrderHistory } from "@lib/api/order";

export async function POST(request: NextRequest) {
  const body = await request.json();

  const tradeId = String(body?.tradeId || "").trim();
  const orderId = String(body?.orderId || "").trim();
  const limit = Number(body?.limit || 8);

  if (!tradeId && !orderId) {
    return NextResponse.json(
      { error: "tradeId or orderId is required" },
      { status: 400 },
    );
  }

  const result = await getBlockedBuyOrderHistory({
    tradeId: tradeId || null,
    orderId: orderId || null,
    limit,
  });

  return NextResponse.json({
    result,
  });
}
