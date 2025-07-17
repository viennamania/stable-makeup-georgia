import { NextResponse, type NextRequest } from "next/server";

import {
	updateAgentFeeWalletAddress,
} from '@lib/api/agent';


export async function POST(request: NextRequest) {

  const body = await request.json();

  const {
    agentcode,
    agentFeeWalletAddress,
  } = body;






  const result = await updateAgentFeeWalletAddress({
    agentcode,
    agentFeeWalletAddress,
  });

 
  return NextResponse.json({

    result,
    
  });
  
}
