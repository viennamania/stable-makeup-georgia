import { NextResponse, type NextRequest } from "next/server";

import {
	getDailyBuyOrderBySeller,
} from '@lib/api/order';



export async function POST(request: NextRequest) {

  const body = await request.json();

  const {
    startDate,
    endDate,
    walletAddress,
  } = body;


  const startDateUTC = new Date(startDate).toISOString();
  const endDateUTC = new Date(endDate).toISOString();



  const result = await getDailyBuyOrderBySeller({
    startDate: startDateUTC,
    endDate: endDateUTC,
    walletAddress,
  });

 
  return NextResponse.json({

    result,
    
  });
  
}
