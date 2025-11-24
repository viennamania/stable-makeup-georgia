import { NextResponse, type NextRequest } from "next/server";

import {
	getAllBuyOrdersBySellerAccountNumber
} from '@lib/api/order';



export async function POST(request: NextRequest) {

  const body = await request.json();

  const {
    limit,
    page,
    startDate,
    endDate,
    privateSale,
    accountNumber,
  } = body;



  const result = await getAllBuyOrdersBySellerAccountNumber({
    limit: limit || 10,
    page: page || 1,
    startDate,
    endDate,
    privateSale,
    accountNumber,
  });


 
  return NextResponse.json({

    result,
    
  });
  
}
