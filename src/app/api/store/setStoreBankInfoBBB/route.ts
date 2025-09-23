import { NextResponse, type NextRequest } from "next/server";

import {
	updateStoreBankInfoBBB
} from '@lib/api/store';


export async function POST(request: NextRequest) {

  const body = await request.json();

  const {
    walletAddress,
    storecode,
    bankName,
    accountNumber,
    accountHolder,
  } = body;





  const result = await updateStoreBankInfoBBB({
    walletAddress,
    storecode,
    bankName,
    accountNumber,
    accountHolder,
  });

 
  return NextResponse.json({

    result,
    
  });
  
}
