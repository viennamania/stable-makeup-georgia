import { NextResponse, type NextRequest } from "next/server";

import {
	updateAgentDescription,
} from '@lib/api/agent';


export async function POST(request: NextRequest) {

  const body = await request.json();

  const {
    walletAddress,
    agentcode,
    agentDescription,
  } = body;



  console.log("setAgentDescription agentcode", agentcode);
  console.log("setAgentDescription walletAddress", walletAddress);
  console.log("setAgentDescription agentDescription", agentDescription);




  const result = await updateAgentDescription({
    walletAddress,
    agentcode,
    agentDescription,
  });

 
  return NextResponse.json({

    result,
    
  });
  
}
