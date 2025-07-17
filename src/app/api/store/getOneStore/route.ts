import { NextResponse, type NextRequest } from "next/server";

import {
	getStoreByStorecode ,
} from '@lib/api/store';


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


  //console.log("result", result);




 
  return NextResponse.json({

    result,
    
  });
  
}
