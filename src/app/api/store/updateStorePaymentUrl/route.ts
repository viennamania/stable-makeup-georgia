import { NextResponse, type NextRequest } from "next/server";

import {
	updateStorePaymentUrl,
} from '@lib/api/store';


export async function POST(request: NextRequest) {

  const body = await request.json();

  const {
    walletAddress,
    storecode,
    paymentUrl,
  } = body;

  console.log("storecode:", storecode);
  console.log("paymentUrl:", paymentUrl);

  const result = await updateStorePaymentUrl({
    storecode,
    paymentUrl,
  });

  console.log("result:", result);
 
  return NextResponse.json({

    result,
    
  });
  
}
