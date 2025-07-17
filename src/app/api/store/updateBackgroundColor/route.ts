import { NextResponse, type NextRequest } from "next/server";

import {
	updateBackgroundColor,
} from '@lib/api/store';


export async function POST(request: NextRequest) {

  const body = await request.json();

  const {
    walletAddress,
    storecode,
    backgroundColor,
  } = body;







  const result = await updateBackgroundColor({
    walletAddress,
    storecode,
    backgroundColor,
  });

 
  return NextResponse.json({

    result,
    
  });
  
}
