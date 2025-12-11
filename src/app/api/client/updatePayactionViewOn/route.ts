import { NextResponse, type NextRequest } from "next/server";

import { updatePayactionViewOn } from "@lib/api/client";


const clientId = process.env.NEXT_PUBLIC_TEMPLATE_CLIENT_ID || "";


export async function POST(request: NextRequest) {

  const body = await request.json();

  //console.log("updateAvatar request body:", body);

  const { payactionViewOn } = body;

  //console.log("updateAvatar request avatar:", avatar);

  if (!clientId) {
    return NextResponse.json(
      { error: "No clientId configured in environment" },
      { status: 500 }
    );
  }


  const result = await updatePayactionViewOn(
    clientId,
    payactionViewOn,
  );

  console.log("updatePayactionViewOn result:", result);

  return NextResponse.json({
    result,
  });
}
