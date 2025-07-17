import { NextResponse, type NextRequest } from "next/server";

import {
	getDailyBuyOrder,
} from '@lib/api/order';



export async function POST(request: NextRequest) {

  const body = await request.json();

  const {
    startDate,
    endDate,
  } = body;


  ///startDate and endDate is korean time
  // convert to UTC time

  const startDateUTC = new Date(startDate).toISOString();
  const endDateUTC = new Date(endDate).toISOString();



  const result = await getDailyBuyOrder({
    //startDate,
    //endDate,

    startDate: startDateUTC,
    endDate: endDateUTC,
  });

 
  return NextResponse.json({

    result,
    
  });
  
}
