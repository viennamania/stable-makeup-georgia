import { NextResponse, type NextRequest } from "next/server";

import { polygon, arbitrum } from "thirdweb/chains";



export async function POST(request: NextRequest) {

  const body = await request.json();


  const { lang, storecode, walletAddress } = body;

  return NextResponse.json({
    result: {
      balance: "0.00",
      currency: "USDT",
      walletAddress: walletAddress,
    },
    error: null,
  });
  
}
