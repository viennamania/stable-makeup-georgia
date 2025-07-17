import { NextResponse, type NextRequest } from "next/server";

import {
	updateAgentFeePercent,
} from '@lib/api/agent';


export async function POST(request: NextRequest) {

  const body = await request.json();

  const {
    agentcode,
    agentFeePercent,
  } = body;







  const result = await updateAgentFeePercent({
    agentcode,
    agentFeePercent,
  });

 
  return NextResponse.json({

    result,
    
  });
  
}
