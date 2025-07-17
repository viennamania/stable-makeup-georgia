import { NextResponse, type NextRequest } from "next/server";

import {
	updateAgentMemo
} from '@lib/api/agent';


export async function POST(request: NextRequest) {

  const body = await request.json();

  const {
    walletAddress,
    agentcode,
    agentMemo,
  } = body;







  const result = await updateAgentMemo({
    walletAddress,
    agentcode,
    agentMemo,
  });

 
  return NextResponse.json({

    result,
    
  });
  
}
