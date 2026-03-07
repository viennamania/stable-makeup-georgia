import { NextResponse, type NextRequest } from "next/server";

import {
	getAllAdmins,
} from '@lib/api/user';
import { verifyAdminSignedAction } from "@/lib/server/admin-action-security";
import { sanitizeUserForResponse } from "@/lib/server/user-read-security";

const GET_ALL_ADMINS_SIGNING_PREFIX = "stable-georgia:get-all-admins:v1";


export async function POST(request: NextRequest) {

  const body = await request.json();

  const limitRaw = Number(body?.limit);
  const pageRaw = Number(body?.page);
  const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? Math.min(limitRaw, 5000) : 100;
  const page = Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : 1;

  const authResult = await verifyAdminSignedAction({
    request,
    route: "/api/user/getAllAdmins",
    signingPrefix: GET_ALL_ADMINS_SIGNING_PREFIX,
    requesterStorecodeRaw: body?.requesterStorecode,
    requesterWalletAddressRaw: body?.requesterWalletAddress,
    signatureRaw: body?.signature,
    signedAtRaw: body?.signedAt,
    nonceRaw: body?.nonce,
    actionFields: {
      limit: String(limit),
      page: String(page),
    },
  });

  if (!authResult.ok) {
    return NextResponse.json(
      {
        result: null,
        success: false,
        error: authResult.error,
      },
      { status: authResult.status }
    );
  }


  const result = await getAllAdmins({
    limit,
    page,
  });

  const sanitizedUsers = sanitizeUserForResponse(result?.users || []);

 
  return NextResponse.json({

    result: {
      ...result,
      users: sanitizedUsers,
    },
    
  });
  
}
