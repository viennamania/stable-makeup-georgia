/*
import { NextResponse, type NextRequest } from "next/server";

import {
	getUsdtKRWRate,
} from '@lib/api/agent';

export async function POST(request: NextRequest) {

  const body = await request.json();

  const {
    agentcode,
  } = body;

  const result = await getUsdtKRWRate({
    agentcode,
  });
 
  return NextResponse.json({
    result,
  });
  
}
*/


import { NextResponse, type NextRequest } from "next/server";

import {
	getUsdtKRWRate,
} from '@lib/api/agent';

import {
  getOne
} from '@lib/api/client';


const clientId = process.env.NEXT_PUBLIC_TEMPLATE_CLIENT_ID;



export async function POST(request: NextRequest) {

  const body = await request.json();

  
  const {
    agentcode,
  } = body;



  let rateKRW = 1400;

  const client = await getOne(clientId || "");

  if (client?.exchangeRateUSDT?.KRW) {
    rateKRW = client.exchangeRateUSDT.KRW;
  } else {

    
    const result = await getUsdtKRWRate({
      agentcode,
    });

    if (result) {
      rateKRW = result;
    }

  }

  

  return NextResponse.json({
    result: rateKRW,
  });
  

  
}
