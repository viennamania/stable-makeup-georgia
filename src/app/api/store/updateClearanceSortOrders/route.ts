import { NextResponse, type NextRequest } from "next/server";

import {
  updateClearanceSortOrders,
} from "@lib/api/store";

export async function POST(request: NextRequest) {
  let body: any = null;
  try {
    body = await request.json();
  } catch (error) {
    return NextResponse.json(
      {
        result: false,
        error: "요청 데이터 형식이 올바르지 않습니다.",
      },
      { status: 400 }
    );
  }

  const { orders } = body;

  const normalizedOrders = Array.isArray(orders)
    ? orders
        .map((order: any) => ({
          storecode: String(order?.storecode || "").trim(),
          clearanceSortOrder: Number(order?.clearanceSortOrder),
        }))
        .filter(
          (order: any) =>
            order.storecode &&
            Number.isFinite(order.clearanceSortOrder) &&
            order.clearanceSortOrder > 0
        )
    : [];

  if (normalizedOrders.length === 0) {
    return NextResponse.json(
      {
        result: false,
        error: "유효한 가맹점 순서 정보가 없습니다.",
      },
      { status: 400 }
    );
  }

  try {
    const result = await updateClearanceSortOrders({
      orders: normalizedOrders,
    });

    if (!result) {
      return NextResponse.json(
        {
          result: false,
          error: "가맹점 순서 저장에 실패했습니다. 잠시 후 다시 시도해주세요.",
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      result: true,
      updatedCount: normalizedOrders.length,
    });
  } catch (error) {
    console.error("updateClearanceSortOrders error", error);
    return NextResponse.json(
      {
        result: false,
        error: "가맹점 순서 저장 중 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}
