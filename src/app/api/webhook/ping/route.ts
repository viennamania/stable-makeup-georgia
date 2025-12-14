import { NextResponse, type NextRequest } from "next/server";


export async function GET(request: NextRequest) {

  // Just respond with a success status for the ping webhook
  // find client ip address
  const clientIp = request.headers.get("x-forwarded-for") || request.ip;
  console.log("Ping webhook received from IP:", clientIp);


  return NextResponse.json({
    status: "success",
  });
  
}
