import { NextResponse, type NextRequest } from "next/server";

import {
	getAllSellersByStorecode,
} from '@lib/api/user';
import { get } from "http";



export async function POST(request: NextRequest) {

  const body = await request.json();

  const {
    walletAddress,
    storecode,
    role,
    limit,
    page,
  } = body;


  //console.log("walletAddress", walletAddress);


  const result = await getAllSellersByStorecode({
    storecode,
    role: role,
    limit: limit || 100,
    page: page || 1,
  });

 
  return NextResponse.json({

    result,
    
  });
  
}
