import { NextResponse, type NextRequest } from "next/server";

import {
  updateBuyerBankInfoUpdate,
} from '@lib/api/order';
import { runBuyOrderAutomationAfterCreate } from "@/lib/server/buy-order-automation";

const ROUTE = "/api/order/updateBuyerBankInfoUpdate";



export async function POST(request: NextRequest) {


  const body = await request.json();

  const {
    tradeId,
    buyerBankInfo,
  } = body;


  const result = await updateBuyerBankInfoUpdate({
    tradeId,
    buyerBankInfo,
  });

  if (result) {
    await runBuyOrderAutomationAfterCreate({
      orderId: result?._id?.toString?.() || result?._id,
      source: ROUTE,
    });
  }

  return NextResponse.json({
    result: result,
  });

  
}
