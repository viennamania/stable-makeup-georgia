import { NextResponse, type NextRequest } from "next/server";

import {
	updateAgentLogo,
} from '@lib/api/agent';


export async function POST(request: NextRequest) {

  const body = await request.json();

  const {
    walletAddress,
    agentcode,
    agentLogo,
  } = body;







  const result = await updateAgentLogo({
    walletAddress,
    agentcode,
    agentLogo,
  });

 
  return NextResponse.json({

    result,
    
  });
  
}
