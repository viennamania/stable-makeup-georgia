import { NextResponse, type NextRequest } from "next/server";

import {
	updateStorePaymentCallbackUrl,
} from '@lib/api/store';


export async function POST(request: NextRequest) {

  const body = await request.json();

  const {
    walletAddress,
    storecode,
    paymentCallbackUrl,
  } = body;

  console.log("storecode:", storecode);
  console.log("paymentCallbackUrl:", paymentCallbackUrl);

  const result = await updateStorePaymentCallbackUrl({
    storecode,
    paymentCallbackUrl,
  });

  ///console.log("result:", result);
 
  return NextResponse.json({

    result,
    
  });
  
}
