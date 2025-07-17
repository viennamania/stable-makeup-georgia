import { NextResponse, type NextRequest } from "next/server";

import {
	getSellOrdersByWalletAddress,
} from '@lib/api/order';



export async function POST(request: NextRequest) {

  const body = await request.json();

  const { walletAddress, limit, page } = body;

  console.log("walletAddress", walletAddress);
  

  const result = await getSellOrdersByWalletAddress({
    walletAddress: walletAddress,
    limit: limit || 10,
    page: page || 1,
  });

 
  return NextResponse.json({

    result,
    
  });
  
}
