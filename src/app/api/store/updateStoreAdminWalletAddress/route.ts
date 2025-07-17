import { NextResponse, type NextRequest } from "next/server";

import {
	updateStoreAdminWalletAddress,
} from '@lib/api/store';


export async function POST(request: NextRequest) {

  const body = await request.json();

  const {
    storecode,
    adminWalletAddress,
  } = body;







  const result = await updateStoreAdminWalletAddress({
    storecode,
    adminWalletAddress,
  });

 
  return NextResponse.json({

    result,
    
  });
  
}
