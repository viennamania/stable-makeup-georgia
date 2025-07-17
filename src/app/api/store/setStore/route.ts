import { NextResponse, type NextRequest } from "next/server";

import {
	insertStore,
} from '@lib/api/store';


export async function POST(request: NextRequest) {

  const body = await request.json();

  const {
    walletAddress,
    agentcode,
    storecode,
    storeName,
    storeType,
    storeUrl,
    storeDescription,
    storeLogo,
    storeBanner,
  } = body;



  console.log("body", body);




  const result = await insertStore({
    walletAddress,
    agentcode,
    storecode,
    storeName,
    storeType,
    storeUrl,
    storeDescription,
    storeLogo,
    storeBanner,
  });

 
  return NextResponse.json({

    result,
    
  });
  
}
