import { NextResponse, type NextRequest } from "next/server";

import {
	updateStoreSettlementFeePercent,
} from '@lib/api/store';


export async function POST(request: NextRequest) {

  const body = await request.json();

  const {
    storecode,
    settlementFeePercent,
  } = body;







  const result = await updateStoreSettlementFeePercent({
    storecode,
    settlementFeePercent,
  });

 
  return NextResponse.json({

    result,
    
  });
  
}
