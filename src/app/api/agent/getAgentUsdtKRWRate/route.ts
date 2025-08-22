import { NextResponse, type NextRequest } from "next/server";

import {
	getUsdtKRWRate,
} from '@lib/api/agent';

export async function POST(request: NextRequest) {

  const body = await request.json();

  const {
    agentcode,
  } = body;

  const result = await getUsdtKRWRate({
    agentcode,
  });
 
  return NextResponse.json({
    result,
  });
  
}
