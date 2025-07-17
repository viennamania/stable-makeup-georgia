import { NextResponse, type NextRequest } from "next/server";

import {
	updateStoreAgentFeeWalletAddress,
} from '@lib/api/store';


export async function POST(request: NextRequest) {

  const body = await request.json();

  const {
    storecode,
    agentFeeWalletAddress,
  } = body;





  const result = await updateStoreAgentFeeWalletAddress({
    storecode,
    agentFeeWalletAddress,
  });

 
  return NextResponse.json({

    result,
    
  });
  
}
