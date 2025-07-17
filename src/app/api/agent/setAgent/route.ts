import { NextResponse, type NextRequest } from "next/server";

import {
	insertAgent,
} from '@lib/api/agent';


export async function POST(request: NextRequest) {

  const body = await request.json();

  const {
    walletAddress,
    agentcode,
    agentName,
    agentType,
    agentUrl,
    agentDescription,
    agentLogo,
    agentBanner,
  } = body;



  console.log("body", body);




  const result = await insertAgent({
    walletAddress,
    agentcode,
    agentName,
    agentType,
    agentUrl,
    agentDescription,
    agentLogo,
    agentBanner,
  });

 
  return NextResponse.json({

    result,
    
  });
  
}
