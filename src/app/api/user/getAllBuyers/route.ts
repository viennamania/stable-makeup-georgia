import { NextResponse, type NextRequest } from "next/server";

import {
	getAllBuyers,
} from '@lib/api/user';
import { verifyCenterStoreAdminGuard } from "@/lib/server/center-store-admin-guard";
import { sanitizeUserForResponse } from "@/lib/server/user-read-security";

const normalizeString = (value: unknown) => {
  if (typeof value !== "string") {
    return "";
  }
  return value.trim();
};

const normalizeNumber = (value: unknown, fallback: number) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return Math.floor(parsed);
};


export async function POST(request: NextRequest) {

  let body: Record<string, unknown> = {};
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    body = {};
  }

  const {
    agentcode,
    storecode,
    searchStore,
    search,
    depositName,
    userType,
  } = body;

  const safeStorecode = normalizeString(storecode);
  const guardStorecode = safeStorecode || normalizeString(body.requesterStorecode) || "admin";
  const safeRequesterWalletAddress = normalizeString(
    body.requesterWalletAddress ?? body.walletAddress,
  ).toLowerCase();
  const safeLimit = Math.min(500, normalizeNumber(body.limit, 100));
  const safePage = normalizeNumber(body.page, 1);

  const guard = await verifyCenterStoreAdminGuard({
    request,
    route: "/api/user/getAllBuyers",
    body,
    storecodeRaw: guardStorecode,
    requesterWalletAddressRaw: safeRequesterWalletAddress,
  });

  if (!guard.ok) {
    return NextResponse.json(
      {
        result: null,
        error: guard.error,
      },
      { status: guard.status },
    );
  }


  const result = await getAllBuyers({
    agentcode: normalizeString(agentcode),
    storecode: safeStorecode,
    searchStore: normalizeString(searchStore),
    search: normalizeString(search),
    depositName: normalizeString(depositName),
    userType: normalizeString(userType) || 'all',
    limit: safeLimit,
    page: safePage,
  });

  //console.log("getAllBuyers result", result);

 
  return NextResponse.json({

    result: sanitizeUserForResponse(result),
    
  });
  
}
