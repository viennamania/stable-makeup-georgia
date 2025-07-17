import { NextResponse, type NextRequest } from "next/server";

import {
	updateAgentSettlementFeePercent,
} from '@lib/api/agent';


export async function POST(request: NextRequest) {

  const body = await request.json();

  const {
    agentcode,
    settlementFeePercent,
  } = body;







  const result = await updateAgentSettlementFeePercent({
    agentcode,
    settlementFeePercent,
  });

 
  return NextResponse.json({

    result,
    
  });
  
}
