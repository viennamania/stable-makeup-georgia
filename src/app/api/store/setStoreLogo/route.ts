import { NextResponse, type NextRequest } from "next/server";

import {
	updateStoreLogo,
} from '@lib/api/store';


export async function POST(request: NextRequest) {

  const body = await request.json();

  const {
    walletAddress,
    storecode,
    storeLogo,
  } = body;







  const result = await updateStoreLogo({
    walletAddress,
    storecode,
    storeLogo,
  });

 
  return NextResponse.json({

    result,
    
  });
  
}
