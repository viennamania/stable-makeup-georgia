import { NextResponse, type NextRequest } from "next/server";

import {
	getTotalNumberOfBuyOrders,
} from '@lib/api/order';



export async function POST(request: NextRequest) {

  const body = await request.json();


  const result = await getTotalNumberOfBuyOrders();

 
  return NextResponse.json({

    result,
    
  });
  
}
