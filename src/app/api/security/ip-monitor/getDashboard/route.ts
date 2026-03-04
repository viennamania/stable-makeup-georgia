import { NextRequest, NextResponse } from "next/server";

import {
  getIpSecurityDashboard,
  resolveKstRange,
} from "@/lib/api/ipSecurity";
import { verifyAdminSignedAction } from "@/lib/server/admin-action-security";

export const runtime = "nodejs";

const SIGNING_PREFIX = "stable-georgia:ip-security-dashboard:v1";
const ROUTE_PATH = "/api/security/ip-monitor/getDashboard";

const normalizeString = (value: unknown) => {
  if (typeof value !== "string") {
    return "";
  }
  return value.trim();
};

export async function POST(request: NextRequest) {
  let body: any = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const range = normalizeString(body?.range || "today") || "today";
  const search = normalizeString(body?.search || "");
  const page = Number(body?.page || 1);
  const limit = Number(body?.limit || 100);

  const auth = await verifyAdminSignedAction({
    request,
    route: ROUTE_PATH,
    signingPrefix: SIGNING_PREFIX,
    requesterStorecodeRaw: body?.requesterStorecode,
    requesterWalletAddressRaw: body?.requesterWalletAddress,
    signatureRaw: body?.signature,
    signedAtRaw: body?.signedAt,
    nonceRaw: body?.nonce,
    actionFields: {
      range,
      search,
      page,
      limit,
    },
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

  const { start, end } = resolveKstRange(range);
  const result = await getIpSecurityDashboard({
    fromDate: start,
    toDate: end,
    search,
    page,
    limit,
  });

  return NextResponse.json({
    result,
  });
}
