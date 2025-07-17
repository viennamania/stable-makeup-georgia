import { NextResponse, type NextRequest } from "next/server";

import {
	updateOne,
} from '@lib/api/user';



export async function POST(request: NextRequest) {

  const body = await request.json();

  const { storecode, walletAddress, nickname } = body;

  console.log("walletAddress", walletAddress);
  console.log("nickname", nickname);

  const result = await updateOne({
    storecode: storecode,
    walletAddress: walletAddress,
    nickname: nickname,
  });


 
  return NextResponse.json({

    result,
    
  });
  
}
