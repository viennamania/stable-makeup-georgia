import { NextResponse, type NextRequest } from "next/server";

import {
	getPaymentRequestedCount,
} from '@lib/api/order';



export async function POST(request: NextRequest) {

  const body = await request.json();

  const { storecode, walletAddress } = body;


  const result = await getPaymentRequestedCount( storecode, walletAddress );

  //console.log("getCountOfPaymentRequested result: ", result);

 
  return NextResponse.json({

    count: result

  });
  
}
