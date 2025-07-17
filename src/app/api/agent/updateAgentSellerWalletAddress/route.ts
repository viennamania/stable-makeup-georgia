import { NextResponse, type NextRequest } from "next/server";

import {
	updateAgentSellerWalletAddress,
} from '@lib/api/agent';


export async function POST(request: NextRequest) {

  const body = await request.json();

  const {
    agentcode,
    sellerWalletAddress,
  } = body;







  const result = await updateAgentSellerWalletAddress({
    agentcode,
    sellerWalletAddress,
  });

 
  return NextResponse.json({

    result,
    
  });
  
}
