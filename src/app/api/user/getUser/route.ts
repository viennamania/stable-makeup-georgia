import { NextResponse, type NextRequest } from "next/server";

import {
	getOneByWalletAddress,
} from '@lib/api/user';



export async function POST(request: NextRequest) {

  const body = await request.json();

  const {
    storecode,
    walletAddress
  } = body;


  console.log("getUser storecode", storecode);
  console.log("getUser walletAddress", walletAddress);


  const result = await getOneByWalletAddress(
    storecode,
    walletAddress
  );


 
  return NextResponse.json({

    result,
    
  });
  
}
