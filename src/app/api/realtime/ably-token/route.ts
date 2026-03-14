import { NextResponse, type NextRequest } from "next/server";

import {
  BANKTRANSFER_ABLY_CHANNEL,
  BANKTRANSFER_UNMATCHED_ABLY_CHANNEL,
  BUYORDER_BLOCKED_ABLY_CHANNEL,
  BUYORDER_STATUS_ABLY_CHANNEL,
  USDT_TRANSACTION_HASH_ABLY_CHANNEL,
} from "@lib/ably/constants";
import { getAblyRestClient } from "@lib/ably/server";
import {
  createPublicRealtimePreflightResponse,
  jsonWithPublicRealtimeCors,
} from "@lib/realtime/publicCors";
import { authorizeRealtimeRequest } from "@lib/realtime/rbac";

export const runtime = "nodejs";

const jsonResponse = ({
  body,
  isPublic,
  init,
}: {
  body: unknown;
  isPublic: boolean;
  init?: ResponseInit;
}) => {
  if (isPublic) {
    return jsonWithPublicRealtimeCors(body, init);
  }

  return NextResponse.json(body, init);
};

export async function OPTIONS() {
  return createPublicRealtimePreflightResponse();
}

export async function GET(request: NextRequest) {
  const isPublic = request.nextUrl.searchParams.get("public") === "1";

  let role: "admin" | "viewer" = "viewer";

  if (!isPublic) {
    const authResult = authorizeRealtimeRequest(request, ["admin", "viewer"]);
    if (!authResult.ok) {
      return jsonResponse({
        isPublic,
        body: {
          status: "error",
          message: authResult.message,
        },
        init: { status: authResult.status },
      });
    }

    role = authResult.role;
  }

  const ably = getAblyRestClient();
  if (!ably) {
    return jsonResponse({
      isPublic,
      body: {
        status: "error",
        message: "ABLY_API_KEY is not configured",
      },
      init: { status: 500 },
    });
  }

  const clientIdParam = request.nextUrl.searchParams.get("clientId");
  const fallbackClientId = `ops-dashboard-${role}-${Date.now()}`;
  const clientId = clientIdParam?.trim() || fallbackClientId;
  const stream = request.nextUrl.searchParams.get("stream");

  const capability: Record<string, string[]> = {};
  if (stream === "buyorder") {
    capability[BUYORDER_STATUS_ABLY_CHANNEL] = ["subscribe"];
  } else if (stream === "buyorder-blocked") {
    capability[BUYORDER_BLOCKED_ABLY_CHANNEL] = ["subscribe"];
  } else if (stream === "usdt-txhash") {
    capability[USDT_TRANSACTION_HASH_ABLY_CHANNEL] = ["subscribe"];
  } else if (stream === "banktransfer") {
    capability[BANKTRANSFER_ABLY_CHANNEL] = ["subscribe"];
    capability[BANKTRANSFER_UNMATCHED_ABLY_CHANNEL] = ["subscribe"];
  } else {
    capability[BANKTRANSFER_ABLY_CHANNEL] = ["subscribe"];
    capability[BANKTRANSFER_UNMATCHED_ABLY_CHANNEL] = ["subscribe"];
    capability[BUYORDER_STATUS_ABLY_CHANNEL] = ["subscribe"];
    capability[BUYORDER_BLOCKED_ABLY_CHANNEL] = ["subscribe"];
    capability[USDT_TRANSACTION_HASH_ABLY_CHANNEL] = ["subscribe"];
  }

  try {
    const tokenRequest = await ably.auth.createTokenRequest({
      clientId,
      capability: JSON.stringify(capability),
    });
    return jsonResponse({
      isPublic,
      body: tokenRequest,
      init: {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    });
  } catch (error) {
    console.error("Failed to create Ably token request:", error);
    return jsonResponse({
      isPublic,
      body: {
        status: "error",
        message: "Failed to create Ably token request",
      },
      init: { status: 500 },
    });
  }
}
