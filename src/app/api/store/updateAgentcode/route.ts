import { NextResponse, type NextRequest } from "next/server";

import {
	updateAgentcode,
} from '@lib/api/store';


export async function POST(request: NextRequest) {

  const body = await request.json();

  const {
    walletAddress,
    storecode,
    agentcode,
  } = body;







  const result = await updateAgentcode({
    walletAddress,
    storecode,
    agentcode,
  });

 
  return NextResponse.json({

    result,
    
  });
  
}
