import { NextResponse, type NextRequest } from "next/server";

import {
	getOneStoreMemo,
} from '@lib/api/store';


export async function POST(request: NextRequest) {

  const body = await request.json();

  const {
    walletAddress,
    storecode,
  } = body;







  const result = await getOneStoreMemo({
    walletAddress,
    storecode,
  });

 
  return NextResponse.json({

    result,
    
  });
  
}
