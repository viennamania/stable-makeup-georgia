import { NextResponse, type NextRequest } from "next/server";

import {
	getStoreByStorecode ,
} from '@lib/api/order';


export async function POST(request: NextRequest) {

  const body = await request.json();

  const {
    storecode,
    walletAddress,
  } = body;


  //console.log("getStoreByStorecode", storecode);






  const result = await getStoreByStorecode({
    storecode,
  });

 
  return NextResponse.json({

    result,
    
  });
  
}
