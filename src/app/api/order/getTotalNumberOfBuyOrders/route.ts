import { NextResponse, type NextRequest } from "next/server";

import {
	getTotalNumberOfBuyOrders,
} from '@lib/api/order';



export async function POST(request: NextRequest) {

  const body = await request.json();

  const { storecode } = body;

  const result = await getTotalNumberOfBuyOrders({
    storecode,
  });

  return NextResponse.json({

    result,
    
  });
  
}
