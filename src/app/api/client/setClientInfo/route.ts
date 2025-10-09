import { NextResponse, type NextRequest } from "next/server";


import { upsertOne } from "@lib/api/client";


const clientId = process.env.NEXT_PUBLIC_TEMPLATE_CLIENT_ID || "";

export async function POST(request: NextRequest) {
  const { data} = await request.json();
  const result = await upsertOne(clientId, data);
  return NextResponse.json({
    result,
  });
}
