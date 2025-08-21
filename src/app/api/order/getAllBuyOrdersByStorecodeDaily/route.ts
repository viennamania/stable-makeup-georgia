import { NextResponse, type NextRequest } from "next/server";

import {
	getBuyOrdersGroupByStorecodeDaily,
} from '@lib/api/order';



export async function POST(request: NextRequest) {

  const body = await request.json();

  const {
    storecode,
    fromDate,
    toDate,
  } = body;


  //console.log("getAllBuyOrders fromDate", fromDate);
  //console.log("getAllBuyOrders toDate", toDate);



  const result = await getBuyOrdersGroupByStorecodeDaily({
    storecode,
    fromDate,
    toDate,
  });

  //console.log("getAllBuyOrders result", result);



  return NextResponse.json({

    result,
    
  });
  
}
