import { NextRequest, NextResponse } from "next/server";

import { approveSuperadminAccessRequest } from "@/lib/server/superadmin-access-requests";
import { verifySuperadminSignedAction } from "@/lib/server/superadmin-guard";

export const runtime = "nodejs";

const ROUTE_PATH = "/api/superadmin/access-requests/approve";
const SIGNING_PREFIX = "stable-georgia:superadmin:access-requests:approve:v1";

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
    actionFields: {
      requestId: body?.requestId,
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

  try {
    const result = await approveSuperadminAccessRequest({
      requestId: String(body?.requestId || ""),
      approverUser: auth.requesterUser,
      approverWalletAddress: auth.requesterWalletAddress,
    });

    return NextResponse.json({
      result,
    });
  } catch (error) {
    return NextResponse.json(
      {
        result: null,
        error:
          error instanceof Error ? error.message : "권한 요청 승인 처리에 실패했습니다.",
      },
      { status: 500 },
    );
  }
}
