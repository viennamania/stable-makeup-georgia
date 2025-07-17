import { NextResponse, type NextRequest } from "next/server";

import {
	updateAgentSettlementWalletAddress,
} from '@lib/api/agent';


export async function POST(request: NextRequest) {

  const body = await request.json();

  const {
    agentcode,
    settlementWalletAddress,
  } = body;







  const result = await updateAgentSettlementWalletAddress({
    agentcode,
    settlementWalletAddress,
  });

 
  return NextResponse.json({

    result,
    
  });
  
}
