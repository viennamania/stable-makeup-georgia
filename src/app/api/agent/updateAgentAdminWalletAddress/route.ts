import { NextResponse, type NextRequest } from "next/server";

import {
	updateAgentAdminWalletAddress,
} from '@lib/api/agent';


export async function POST(request: NextRequest) {

  const body = await request.json();

  const {
    agentcode,
    adminWalletAddress,
  } = body;







  const result = await updateAgentAdminWalletAddress({
    agentcode,
    adminWalletAddress,
  });

 
  return NextResponse.json({

    result,
    
  });
  
}
