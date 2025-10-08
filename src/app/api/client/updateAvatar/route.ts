import { NextResponse, type NextRequest } from "next/server";

import { updateAvatar } from "@/lib/api/client";


const clientId = process.env.NEXT_PUBLIC_TEMPLATE_CLIENT_ID || "";


export async function POST(request: NextRequest) {

  const body = await request.json();

  //console.log("updateAvatar request body:", body);

  const { avatar } = body;

  //console.log("updateAvatar request avatar:", avatar);

  if (!clientId) {
    return NextResponse.json(
      { error: "No clientId configured in environment" },
      { status: 500 }
    );
  }

  if (!avatar) {
    return NextResponse.json(
      { error: "No avatar provided" },
      { status: 400 }
    );
  }
  const result = await updateAvatar(
    clientId,
    avatar
  );

  //console.log("updateAvatar result:", result);

  return NextResponse.json({
    result,
  });
}
