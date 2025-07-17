import { NextResponse, type NextRequest } from "next/server";

import {
	getAllStores,
} from '@lib/api/store';



export async function POST(request: NextRequest) {

  const body = await request.json();

  const {
    walletAddress,
    limit,
    page,
    searchStore,
    agentcode,

    fromDate = "",
    toDate = "",
  } = body;

  //console.log("getAllStores request body", body);


  const result = await getAllStores({
    limit: limit || 100,
    page: page || 1,
    //search: '',
    search: searchStore || '',
    agentcode: agentcode || '',

    fromDate: fromDate || '',
    toDate: toDate || '',
  });

  ///console.log("getAllStores result", result);



 
  return NextResponse.json({

    result,
    
  });
  
}
