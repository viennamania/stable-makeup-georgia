import { NextResponse, type NextRequest } from "next/server";

import {
  BANKTRANSFER_ABLY_CHANNEL,
  BANKTRANSFER_UNMATCHED_ABLY_CHANNEL,
  BUYORDER_STATUS_ABLY_CHANNEL,
} from "@lib/ably/constants";
import { getAblyRestClient } from "@lib/ably/server";
import { authorizeRealtimeRequest } from "@lib/realtime/rbac";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const isPublic = request.nextUrl.searchParams.get("public") === "1";

  let role: "admin" | "viewer" = "viewer";

  if (!isPublic) {
    const authResult = authorizeRealtimeRequest(request, ["admin", "viewer"]);
    if (!authResult.ok) {
      return NextResponse.json(
        {
          status: "error",
          message: authResult.message,
        },
        { status: authResult.status },
      );
    }

    role = authResult.role;
  }

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
  const fallbackClientId = `ops-dashboard-${role}-${Date.now()}`;
  const clientId = clientIdParam?.trim() || fallbackClientId;
  const stream = request.nextUrl.searchParams.get("stream");

  const capability: Record<string, string[]> = {};
  if (stream === "buyorder") {
    capability[BUYORDER_STATUS_ABLY_CHANNEL] = ["subscribe"];
  } else if (stream === "banktransfer") {
    capability[BANKTRANSFER_ABLY_CHANNEL] = ["subscribe"];
    capability[BANKTRANSFER_UNMATCHED_ABLY_CHANNEL] = ["subscribe"];
  } else {
    capability[BANKTRANSFER_ABLY_CHANNEL] = ["subscribe"];
    capability[BANKTRANSFER_UNMATCHED_ABLY_CHANNEL] = ["subscribe"];
    capability[BUYORDER_STATUS_ABLY_CHANNEL] = ["subscribe"];
  }

  try {
    const tokenRequest = await ably.auth.createTokenRequest({
      clientId,
      capability: JSON.stringify(capability),
    });
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
