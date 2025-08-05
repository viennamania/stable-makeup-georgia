import { NextResponse, type NextRequest } from "next/server";

import {
  getOneByWalletAddress,
	insertOne,
  updateOne,
} from '@lib/api/user';



export async function POST(request: NextRequest) {

  const body = await request.json();

  const { storecode, walletAddress, nickname, mobile} = body;

  console.log("storecode", storecode);
  console.log("walletAddress", walletAddress);
  console.log("nickname", nickname);
  console.log("mobile", mobile);


  if (!storecode || !walletAddress || !nickname) {
    
    console.log("Missing required fields");

    return NextResponse.json({
      error: "Missing required fields: storecode, walletAddress, or nickname",
    }, { status: 400 });
  }

  // Check if the user already exists
  const existingUser = await getOneByWalletAddress(storecode, walletAddress);

  if (existingUser) {

    console.log("User already exists");
    
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



  const buyer = {
    depositBankAccountNumber: '123456789',
    depositBankName: 'Bank of Example',
    depositName: 'John Doe',
  };

  const result = await insertOne({
    storecode: storecode,
    walletAddress: walletAddress,
    nickname: nickname,
    mobile: mobile,

    buyer: buyer,
  });

  if (!result) {
    console.log("Failed to create user");
    
    return NextResponse.json({
      error: "Failed to create user",
    }, { status: 500 });
  }


 
  return NextResponse.json({

    result,
    
  });
  
}
