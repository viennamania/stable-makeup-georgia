import { NextResponse, type NextRequest } from "next/server";

import {
  UserProps,
	deleteBuyOrder,
} from '@lib/api/order';

// Download the helper library from https://www.twilio.com/docs/node/install
import twilio from "twilio";


export async function POST(request: NextRequest) {

  const body = await request.json();

  const { orderId, walletAddress } = body;

  console.log("cancelBuyOrder body", body);
  

  const result = await deleteBuyOrder({
    orderId,
    walletAddress,
  });

  ////console.log("result", result);


 
  return NextResponse.json({

    result,
    
  });
  
}
