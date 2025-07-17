import { NextResponse, type NextRequest } from "next/server";

import {
	getOneAgentMemo,
} from '@lib/api/agent';


export async function POST(request: NextRequest) {

  const body = await request.json();

  const {
    walletAddress,
    agentcode,
  } = body;







  const result = await getOneAgentMemo({
    walletAddress,
    agentcode,
  });

 
  return NextResponse.json({

    result,
    
  });
  
}
