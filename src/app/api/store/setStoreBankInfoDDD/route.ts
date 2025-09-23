import { NextResponse, type NextRequest } from "next/server";

import {
	updateStoreBankInfoDDD
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





  const result = await updateStoreBankInfoDDD({
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
