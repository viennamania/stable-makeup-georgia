import { NextResponse, type NextRequest } from "next/server";

import {
  updateBuyOrderDepositCompleted,
} from '@lib/api/order';



export async function POST(request: NextRequest) {

  const body = await request.json();

  const {
    orderId,
  } = body;


  // updateBuyOrderSettlement
  const result = await updateBuyOrderDepositCompleted({
    orderId: orderId,
  });


  if (!result) {
    return NextResponse.json(
      { error: 'Failed to update buy order deposit completed' },
      { status: 500 }
    );
  }

  return NextResponse.json(
    { message: 'Buy order deposit completed updated successfully' },
    { status: 200 }
  );

}
