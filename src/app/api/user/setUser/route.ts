import { NextResponse, type NextRequest } from "next/server";

import {
  getOneByWalletAddress,
	insertOne,
  updateOne,
} from '@lib/api/user';



export async function POST(request: NextRequest) {

  const body = await request.json();

  const { storecode, walletAddress, nickname, mobile } = body;


  if (!storecode || !walletAddress || !nickname || !mobile) {
    return NextResponse.json({
      error: "Missing required fields: storecode, walletAddress, nickname, or mobile.",
    }, { status: 400 });
  }

  // Check if the user already exists
  const existingUser = await getOneByWalletAddress(storecode, walletAddress);

  if (existingUser) {
    // If the user exists, update their information
    const updatedUser = await updateOne({
      storecode: storecode,
      walletAddress: walletAddress,
      nickname: nickname,
      mobile: mobile,
    });
    return NextResponse.json({
      result: updatedUser,
    });
  }

  const result = await insertOne({
    storecode: storecode,
    walletAddress: walletAddress,
    nickname: nickname,
    mobile: mobile,
  });


 
  return NextResponse.json({

    result,
    
  });
  
}
