import { NextResponse, type NextRequest } from "next/server";

import {
	getOneByNickname,
} from '@lib/api/user';
import { error } from "console";



export async function GET(request: NextRequest) {


  const storecode = request.nextUrl.searchParams.get('storecode');
  const storeUser = request.nextUrl.searchParams.get('storeUser');
  

  if (!storeUser) {
    return NextResponse.json({
      result: null,
      error: "storeUser is required",
    });
  }

  const result = await getOneByNickname(
    storecode || "",
    storeUser
);

  if (!result) {
    return NextResponse.json({
      result: null,
      error: "No user found",
    });
  }

  return NextResponse.json({

    result,
    
  });

}

