import { NextResponse, type NextRequest } from "next/server";

import {
	getAgentByAgentcode ,
} from '@lib/api/agent';


export async function POST(request: NextRequest) {

  const body = await request.json();

  const {
    agentcode,
    walletAddress,
  } = body;


  console.log("getAgentByAgentcode", agentcode);






  const result = await getAgentByAgentcode({
    agentcode,
  });

 
  return NextResponse.json({

    result,
    
  });
  
}
