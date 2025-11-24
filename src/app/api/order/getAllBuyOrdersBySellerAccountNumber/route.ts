import { NextResponse, type NextRequest } from "next/server";

import {
	getAllBuyOrdersBySeller
} from '@lib/api/order';



export async function POST(request: NextRequest) {

  const body = await request.json();

  const {
    limit,
    page,
    startDate,
    endDate,
    walletAddress
  } = body;



  const result = await getAllBuyOrdersBySeller({
    limit: limit || 10,
    page: page || 1,
    startDate,
    endDate,
    walletAddress,
  });


 
  return NextResponse.json({

    result,
    
  });
  
}
