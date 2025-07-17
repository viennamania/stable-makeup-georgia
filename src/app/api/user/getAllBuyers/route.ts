import { NextResponse, type NextRequest } from "next/server";

import {
	getAllBuyers,
} from '@lib/api/user';



export async function POST(request: NextRequest) {

  const body = await request.json();

  const {
    walletAddress,
    agentcode,
    storecode,
    search,
    depositName,
    limit,
    page,
  } = body;


  console.log("limit", limit);
  console.log("page", page);


  const result = await getAllBuyers({
    agentcode: agentcode || '',
    storecode,

    search,
    depositName,
    limit: limit || 100,
    page: page || 1,
  });

  //console.log("getAllBuyers result", result);

 
  return NextResponse.json({

    result,
    
  });
  
}
