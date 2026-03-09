import { NextResponse, type NextRequest } from "next/server";

import {
	getAllSellersByStorecode,
} from '@lib/api/user';


export async function POST(request: NextRequest) {

  const body = await request.json();

  const {
    walletAddress,
    storecode,
    role,
    limit,
    page,
    excludeSignerAddress,
  } = body;


  //console.log("walletAddress", walletAddress);


  const result = await getAllSellersByStorecode({
    storecode,
    role: role,
    limit: limit || 100,
    page: page || 1,
    excludeSignerAddress: Boolean(excludeSignerAddress),
  });

 
  return NextResponse.json({

    result,
    
  });
  
}
