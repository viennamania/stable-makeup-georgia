import { NextResponse, type NextRequest } from "next/server";

import {
	updatePayactionKeys,
} from '@lib/api/store';


export async function POST(request: NextRequest) {

  const body = await request.json();

  const {
    walletAddress,
    storecode,
    payactionKey,
  } = body;







  const result = await updatePayactionKeys({
    walletAddress,
    storecode,
    payactionKey,
  });

 
  return NextResponse.json({

    result,
    
  });
  
}
