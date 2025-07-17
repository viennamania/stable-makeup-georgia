import { NextResponse, type NextRequest } from "next/server";

import {
	updateAgentBankInfo,
} from '@lib/api/agent';


export async function POST(request: NextRequest) {

  const body = await request.json();

  const {
    walletAddress,
    agentcode,
    bankName,
    accountNumber,
    accountHolder,
  } = body;





  const result = await updateAgentBankInfo({
    walletAddress,
    agentcode,
    bankName,
    accountNumber,
    accountHolder,
  });

 
  return NextResponse.json({

    result,
    
  });
  
}
