import { NextRequest, NextResponse } from "next/server";

import { getSuperadminDashboardOverview } from "@/lib/server/superadmin-dashboard";
import { verifySuperadminSignedAction } from "@/lib/server/superadmin-guard";

export const runtime = "nodejs";

const ROUTE_PATH = "/api/superadmin/dashboard";
const SIGNING_PREFIX = "stable-georgia:superadmin:dashboard:v1";

export async function POST(request: NextRequest) {
  let body: Record<string, unknown> = {};
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    body = {};
  }

  const auth = await verifySuperadminSignedAction({
    request,
    route: ROUTE_PATH,
    signingPrefix: SIGNING_PREFIX,
    requesterStorecodeRaw: body?.requesterStorecode,
    requesterWalletAddressRaw: body?.requesterWalletAddress,
    signatureRaw: body?.signature,
    signedAtRaw: body?.signedAt,
    nonceRaw: body?.nonce,
    actionFields: {},
  });

  if (!auth.ok) {
    return NextResponse.json(
      {
        result: null,
        error: auth.error,
      },
      { status: auth.status },
    );
  }

  return NextResponse.json({
    result: await getSuperadminDashboardOverview(),
  });
}
