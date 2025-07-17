import { NextResponse, type NextRequest } from "next/server";

import {
	getOneBuyOrderByNicknameAndStorecode,
} from '@lib/api/order';



export async function POST(request: NextRequest) {

  const body = await request.json();

  const { nickname, storecode } = body;
  if (!nickname) {
    return NextResponse.json({
      error: "nickname is required",
    });
  }
  if (nickname.length < 3) {
    return NextResponse.json({
      error: "nickname must be at least 3 characters",
    });
  }
  if (nickname.length > 20) {
    return NextResponse.json({
      error: "nickname must be at most 20 characters",
    });
  }


  const result = await getOneBuyOrderByNicknameAndStorecode({
    nickname: nickname,
    storecode: storecode,
  });

 
  return NextResponse.json({

    result,
    
  });
  
}
