import { NextResponse, type NextRequest } from "next/server";

import {
	updateAgentName,
} from '@lib/api/agent';


export async function POST(request: NextRequest) {

  const body = await request.json();

  const {
    walletAddress,
    agentcode,
    agentName,
  } = body;







  const result = await updateAgentName({
    walletAddress,
    agentcode,
    agentName,
  });

 
  return NextResponse.json({

    result,
    
  });
  
}
