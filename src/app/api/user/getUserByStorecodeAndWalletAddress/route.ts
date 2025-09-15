import { NextResponse, type NextRequest } from "next/server";

import {
	getOneByStorecodeAndWalletAddress,
} from '@lib/api/user';

import {
  createThirdwebClient,
  getUser
} from "thirdweb";

export async function POST(request: NextRequest) {

  const body = await request.json();

  const {
    storecode,
    walletAddress
  } = body;


  //console.log("walletAddress", walletAddress);


  /*
  const client = createThirdwebClient({
    secretKey: process.env.THIRDWEB_SECRET_KEY || "",
  });
 
  const user = await getUser({
    client,
    walletAddress: walletAddress,
    //walletAddress: "0xF1b051dceb3Aab2f8e35805F134e373b709382aA", // For testing purposes
  });

  console.log("user", user);
  */


  const result = await getOneByStorecodeAndWalletAddress(
    storecode,
    walletAddress
  );


 
  return NextResponse.json({

    result,
    
  });
  
}
