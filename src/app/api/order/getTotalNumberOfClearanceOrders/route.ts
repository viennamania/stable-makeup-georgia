import { NextResponse, type NextRequest } from "next/server";

import {
	getTotalNumberOfClearanceOrders,
} from '@lib/api/order';



export async function POST(request: NextRequest) {

  const body = await request.json();


  const result = await getTotalNumberOfClearanceOrders();

 
  return NextResponse.json({

    result,
    
  });
  
}
