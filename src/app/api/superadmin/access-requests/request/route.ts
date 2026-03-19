import { NextRequest, NextResponse } from "next/server";

import { createSuperadminAccessRequest } from "@/lib/server/superadmin-access-requests";
import { verifyAdminSignedAction } from "@/lib/server/admin-action-security";

export const runtime = "nodejs";

const ROUTE_PATH = "/api/superadmin/access-requests/request";
const SIGNING_PREFIX = "stable-georgia:superadmin:access-requests:request:v1";

export async function POST(request: NextRequest) {
  let body: Record<string, unknown> = {};
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    body = {};
  }

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
      note: body?.note,
      requestPage: body?.requestPage,
    },
    requestLogActionFields: {
      note: body?.note,
      requestPage: body?.requestPage,
      requestedRole: "superadmin",
    },
    allowedRoles: [],
    requireAdminStorecode: false,
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
    const result = await createSuperadminAccessRequest({
      requesterUser: auth.requesterUser,
      requesterWalletAddress: auth.requesterWalletAddress,
      note: body?.note as string,
      ip: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "",
      userAgent: request.headers.get("user-agent") || "",
      requestRoute: (body?.requestPage as string) || request.headers.get("referer") || "",
    });

    return NextResponse.json({
      result,
    });
  } catch (error) {
    return NextResponse.json(
      {
        result: null,
        error:
          error instanceof Error ? error.message : "관리자권한 요청을 저장하지 못했습니다.",
      },
      { status: 500 },
    );
  }
}
