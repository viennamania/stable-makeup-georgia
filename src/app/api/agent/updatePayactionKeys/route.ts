import { NextResponse, type NextRequest } from "next/server";

import {
	updatePayactionKeys,
} from '@lib/api/agent';


export async function POST(request: NextRequest) {

  const body = await request.json();

  const {
    walletAddress,
    agentcode,
    payactionKey,
  } = body;







  const result = await updatePayactionKeys({
    walletAddress,
    agentcode,
    payactionKey,
  });

 
  return NextResponse.json({

    result,
    
  });
  
}
