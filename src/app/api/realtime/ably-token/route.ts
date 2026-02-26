import { NextResponse, type NextRequest } from "next/server";

import { getAblyRestClient } from "@lib/ably/server";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const ably = getAblyRestClient();
  if (!ably) {
    return NextResponse.json(
      {
        status: "error",
        message: "ABLY_API_KEY is not configured",
      },
      { status: 500 },
    );
  }

  const clientIdParam = request.nextUrl.searchParams.get("clientId");
  const clientId = clientIdParam?.trim() || `ops-dashboard-${Date.now()}`;

  try {
    const tokenRequest = await ably.auth.createTokenRequest({ clientId });
    return NextResponse.json(tokenRequest);
  } catch (error) {
    console.error("Failed to create Ably token request:", error);
    return NextResponse.json(
      {
        status: "error",
        message: "Failed to create Ably token request",
      },
      { status: 500 },
    );
  }
}
