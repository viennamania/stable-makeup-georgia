import { NextResponse, type NextRequest } from "next/server";

import {
	updateStoreBankInfo,
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





  const result = await updateStoreBankInfo({
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
