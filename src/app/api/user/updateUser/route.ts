import { NextResponse, type NextRequest } from "next/server";

import {
	updateOne,
} from '@lib/api/user';



export async function POST(request: NextRequest) {

  const body = await request.json();

  const { storecode, walletAddress, nickname, mobile, email } = body;

  console.log("walletAddress", walletAddress);
  console.log("nickname", nickname);
  console.log("mobile", mobile);
  console.log("email", email);

  const result = await updateOne({
    storecode: storecode,
    walletAddress: walletAddress,
    nickname: nickname,
    mobile: mobile,
    email: email,
  });


 
  return NextResponse.json({

    result,
    
  });
  
}
