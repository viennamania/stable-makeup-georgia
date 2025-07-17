import { NextResponse, type NextRequest } from "next/server";

import {
	getAllBuyersForAgent,
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


  const result = await getAllBuyersForAgent({
    storecode: storecode || '',
    agentcode: agentcode || '',
    limit: limit || 100,
    page: page || 1,
  });

  //console.log("getAllBuyers result", result);

 
  return NextResponse.json({

    result,
    
  });
  
}
