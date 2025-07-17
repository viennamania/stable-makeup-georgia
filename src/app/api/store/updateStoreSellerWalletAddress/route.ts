import { NextResponse, type NextRequest } from "next/server";

import {
	updateStoreSellerWalletAddress,
} from '@lib/api/store';


export async function POST(request: NextRequest) {

  const body = await request.json();

  const {
    storecode,
    sellerWalletAddress,
  } = body;







  const result = await updateStoreSellerWalletAddress({
    storecode,
    sellerWalletAddress,
  });

 
  return NextResponse.json({

    result,
    
  });
  
}
