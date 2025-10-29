import { NextResponse, type NextRequest } from "next/server";

import {
	getAllAdmins,
} from '@lib/api/user';




export async function POST(request: NextRequest) {

  const body = await request.json();

  //const { walletAddress } = body;


  //console.log("walletAddress", walletAddress);


  const result = await getAllAdmins({
    limit: 100,
    page: 1,
  });

 
  return NextResponse.json({

    result,
    
  });
  
}
