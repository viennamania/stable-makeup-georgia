import { NextResponse, type NextRequest } from "next/server";

import {
	updateBackgroundColor,
} from '@lib/api/agent';


export async function POST(request: NextRequest) {

  const body = await request.json();

  const {
    walletAddress,
    agentcode,
    backgroundColor,
  } = body;







  const result = await updateBackgroundColor({
    walletAddress,
    agentcode,
    backgroundColor,
  });

 
  return NextResponse.json({

    result,
    
  });
  
}
