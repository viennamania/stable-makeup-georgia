import { NextResponse, type NextRequest } from "next/server";

import {
	updateStoreName,
} from '@lib/api/store';


export async function POST(request: NextRequest) {

  const body = await request.json();

  const {
    walletAddress,
    storecode,
    storeName,
  } = body;







  const result = await updateStoreName({
    walletAddress,
    storecode,
    storeName,
  });

 
  return NextResponse.json({

    result,
    
  });
  
}
