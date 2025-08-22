import { NextResponse, type NextRequest } from "next/server";

import {
	updateUsdtKRWRate,
} from '@lib/api/agent';


export async function POST(request: NextRequest) {

  const body = await request.json();

  const {
    agentcode,
    usdtKRWRate,
  } = body;


  console.log("Updating USDT-KRW rate for agent:", agentcode);
  console.log("New USDT-KRW rate:", usdtKRWRate);

  

  const result = await updateUsdtKRWRate({
    agentcode,
    usdtKRWRate,
  });

 
  return NextResponse.json({

    result,
    
  });
  
}
