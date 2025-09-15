import { NextResponse, type NextRequest } from "next/server";


import { chain } from "@/app/config/contractAddresses";


const clientId = process.env.NEXT_PUBLIC_TEMPLATE_CLIENT_ID;


export async function POST(request: NextRequest) {



  const result = {
    chain,
    clientId,
  };

  return NextResponse.json({

    result,
    
  });
  
}
