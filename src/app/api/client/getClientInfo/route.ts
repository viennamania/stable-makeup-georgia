import { NextResponse, type NextRequest } from "next/server";


import { chain } from "@/app/config/contractAddresses";


export async function POST(request: NextRequest) {



  const result = {
    chain,
  };

  return NextResponse.json({

    result,
    
  });
  
}
