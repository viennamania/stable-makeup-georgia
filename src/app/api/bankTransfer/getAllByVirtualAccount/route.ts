import { NextResponse, type NextRequest } from "next/server";

import {
	findByAccount,
} from '@lib/api/bankTransfer'

export async function POST(request: NextRequest) {

  const body = await request.json();

  const { virtualAccount } = body;



  const result = await findByAccount(virtualAccount);



  return NextResponse.json({

    result,
    
  });
  
}
