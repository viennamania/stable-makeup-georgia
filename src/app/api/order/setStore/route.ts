import { NextResponse, type NextRequest } from "next/server";

import {
	insertStore,
} from '@lib/api/order';


export async function POST(request: NextRequest) {

  const body = await request.json();

  const {
    walletAddress,
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
