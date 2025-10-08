import { NextResponse, type NextRequest } from "next/server";

import {
  getOne
} from '@lib/api/client';


const clientId = process.env.NEXT_PUBLIC_TEMPLATE_CLIENT_ID;



export async function POST(request: NextRequest) {

  let rateKRW = 1400;

  const client = await getOne(clientId || "");

  if (client?.exchangeRateUSDTSell?.KRW) {
    rateKRW = client.exchangeRateUSDTSell.KRW;
  }

  console.log("rateKRW:", rateKRW);
  

  return NextResponse.json({
    result: rateKRW,
  });
  

  
}
