import { NextResponse, type NextRequest } from "next/server";

import {
  updateBuyerBankInfoUpdate,
} from '@lib/api/order';



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

  return NextResponse.json({
    result: result,
  });

  
}
