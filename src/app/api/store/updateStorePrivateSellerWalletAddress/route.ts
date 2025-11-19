import { NextResponse, type NextRequest } from "next/server";

import {
	updateStorePrivateSellerWalletAddress,
} from '@lib/api/store';


export async function POST(request: NextRequest) {

  const body = await request.json();

  const {
    storecode,
    privateSellerWalletAddress,
  } = body;


  const result = await updateStorePrivateSellerWalletAddress({
    storecode,
    privateSellerWalletAddress,
  });

 
  return NextResponse.json({

    result,
    
  });
  
}
