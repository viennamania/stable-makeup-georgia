import { NextResponse, type NextRequest } from "next/server";

import {
    getAllPaymentsByStorecode
} from '@lib/api/payment';

export async function POST(request: NextRequest) {

  const body = await request.json();

  const {
    storecode,
    limit,
    page,
  } = body;

 
  const result = await getAllPaymentsByStorecode({
    storecode,
    limit,
    page,

  });

  return NextResponse.json({

    result,
    
  });
  
}
