import { NextResponse, type NextRequest } from "next/server";

import {
	updateUserType,
} from '@lib/api/user';



export async function POST(request: NextRequest) {

  const body = await request.json();

  const {
    storecode,
    walletAddress,
    userType,
  } = body;

  const result = await updateUserType({
    storecode: storecode,
    walletAddress: walletAddress,
    userType: userType,
  });


 
  return NextResponse.json({

    result,
    
  });
  
}
