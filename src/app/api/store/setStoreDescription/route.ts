import { NextResponse, type NextRequest } from "next/server";

import {
	updateStoreDescription,
} from '@lib/api/store';


export async function POST(request: NextRequest) {

  const body = await request.json();

  const {
    walletAddress,
    storecode,
    storeDescription,
  } = body;



  console.log("setStoreDescription storecode", storecode);
  console.log("setStoreDescription walletAddress", walletAddress);
  console.log("setStoreDescription storeDescription", storeDescription);




  const result = await updateStoreDescription({
    walletAddress,
    storecode,
    storeDescription,
  });

 
  return NextResponse.json({

    result,
    
  });
  
}
