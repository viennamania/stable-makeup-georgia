import { NextResponse, type NextRequest } from "next/server";

import {
	updateStoreAccessToken,
} from '@lib/api/store';


export async function POST(request: NextRequest) {

  const body = await request.json();

  const {
    storecode,
    accessToken,
  } = body;







  const result = await updateStoreAccessToken({
    storecode,
    accessToken,
  });

 
  return NextResponse.json({

    result,
    
  });
  
}
