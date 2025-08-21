import { NextResponse, type NextRequest } from "next/server";

import {
	getBuyOrdersGroupByAgentcodeDaily,
} from '@lib/api/order';



export async function POST(request: NextRequest) {

  const body = await request.json();

  const {
    agentcode,
    fromDate,
    toDate,
  } = body;


  //console.log("getAllBuyOrders fromDate", fromDate);
  //console.log("getAllBuyOrders toDate", toDate);



  const result = await getBuyOrdersGroupByAgentcodeDaily({
    agentcode,
    fromDate,
    toDate,
  });

  //console.log("getAllBuyOrders result", result);



  return NextResponse.json({

    result,
    
  });
  
}
