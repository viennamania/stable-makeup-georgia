import { NextResponse, type NextRequest } from "next/server";

import {
	updateAvatar,
} from '@lib/api/user';



export async function POST(request: NextRequest) {

  const body = await request.json();

  const { storecode, walletAddress, avatar } = body;
  const resolvedStorecode = String(storecode || "admin").trim() || "admin";

  if (!walletAddress || !avatar) {
    return NextResponse.json(
      {
        error: "Missing required fields: walletAddress, avatar",
      },
      { status: 400 },
    );
  }

  console.log("storecode", resolvedStorecode);
  console.log("walletAddress", walletAddress);
  console.log("avatar", avatar);

  const result = await updateAvatar({
    storecode: resolvedStorecode,
    walletAddress: walletAddress,
    avatar: avatar,
  });


 
  return NextResponse.json({
    result,
  });
  
}
