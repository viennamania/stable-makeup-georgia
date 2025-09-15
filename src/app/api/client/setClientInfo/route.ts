import { NextResponse, type NextRequest } from "next/server";


import { upsertOne } from "@/lib/api/client";

export async function POST(request: NextRequest) {
  const { clientId, ...data } = await request.json();
  const result = await upsertOne(clientId, data);
  return NextResponse.json({
    result,
  });
}
