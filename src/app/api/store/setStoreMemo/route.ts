import { NextResponse, type NextRequest } from "next/server";

import {
	updateStoreMemo
} from '@lib/api/store';


export async function POST(request: NextRequest) {

  const body = await request.json();

  const {
    walletAddress,
    storecode,
    storeMemo,
  } = body;







  const result = await updateStoreMemo({
    walletAddress,
    storecode,
    storeMemo,
  });

 
  return NextResponse.json({

    result,
    
  });
  
}
