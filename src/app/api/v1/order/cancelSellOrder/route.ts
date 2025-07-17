import { NextResponse, type NextRequest } from "next/server";

import {
	deleteSellOrder,
} from '@lib/api/order';

// Download the helper library from https://www.twilio.com/docs/node/install
import twilio from "twilio";


export async function GET(request: NextRequest) {

  /*
  const body = await request.json();

  const { orderId, walletAddress: walletAddress } = body;
  */

  const orderId = request.nextUrl.searchParams.get('orderId') ?? '';
  const walletAddress = request.nextUrl.searchParams.get('walletAddress') ?? '';



  //console.log("orderId", orderId);
  //console.log("walletAddress", walletAddress);
  

  const result = await deleteSellOrder({
    orderId: orderId,
    walletAddress: walletAddress,
  });

  ////console.log("result", result);


 
  return NextResponse.json({

    result,
    
  });
  
}
