import { NextResponse, type NextRequest } from "next/server";

import { listAdminPasswordAccounts } from "@/lib/server/admin-password-auth";
import { verifyAdminSignedAction } from "@/lib/server/admin-action-security";

export const runtime = "nodejs";

const ROUTE = "/api/admin-auth/accounts/list";
const SIGNING_PREFIX = "stable-georgia:admin-password-accounts:list:v1";

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;

  const authResult = await verifyAdminSignedAction({
    request,
    route: ROUTE,
    signingPrefix: SIGNING_PREFIX,
    requesterStorecodeRaw: body?.requesterStorecode,
    requesterWalletAddressRaw: body?.requesterWalletAddress,
    signatureRaw: body?.signature,
    signedAtRaw: body?.signedAt,
    nonceRaw: body?.nonce,
    actionFields: {},
    requestLogActionFields: {},
    allowedRoles: ["admin"],
    requireAdminStorecode: true,
  });

  if (!authResult.ok) {
    return NextResponse.json(
      {
        status: "error",
        result: null,
        error: authResult.error,
      },
      { status: authResult.status },
    );
  }

  const accounts = await listAdminPasswordAccounts();
  return NextResponse.json({
    status: "success",
    result: {
      accounts,
    },
  });
}
