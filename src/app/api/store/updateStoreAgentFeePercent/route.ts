import { NextResponse, type NextRequest } from "next/server";

import {
	updateStoreAgentFeePercent,
} from '@lib/api/store';


export async function POST(request: NextRequest) {

  const body = await request.json();

  const {
    storecode,
    agentFeePercent,
  } = body;







  const result = await updateStoreAgentFeePercent({
    storecode,
    agentFeePercent,
  });

 
  return NextResponse.json({

    result,
    
  });
  
}
