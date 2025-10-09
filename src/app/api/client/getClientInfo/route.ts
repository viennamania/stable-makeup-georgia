import { NextResponse, type NextRequest } from "next/server";


import { chain } from "@/app/config/contractAddresses";

import { getOne } from "@lib/api/client";

const clientId = process.env.NEXT_PUBLIC_TEMPLATE_CLIENT_ID;


export async function POST(request: NextRequest) {


  const clientInfo = await getOne(clientId || "");


  //console.log("clientInfo:", clientInfo);


  

  const result = {
    chain,
    clientId,
    clientInfo,
  };

  return NextResponse.json({

    result,
    
  });
  
}
