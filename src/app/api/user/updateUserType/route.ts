import { NextResponse, type NextRequest } from "next/server";

import {
	updateUserType,
} from '@lib/api/user';
import { verifyCenterStoreAdminGuard } from "@/lib/server/center-store-admin-guard";
import { normalizeWalletAddress } from "@/lib/server/user-read-security";

const normalizeString = (value: unknown): string => {
  if (typeof value !== "string") {
    return "";
  }
  return value.trim();
};

const normalizeUserType = (value: unknown): string | null => {
  const normalized = normalizeString(value).toUpperCase();
  if (!normalized || normalized === "NORMAL") {
    return "";
  }
  if (normalized === "AAA" || normalized === "BBB" || normalized === "CCC" || normalized === "DDD") {
    return normalized;
  }
  return null;
};


export async function POST(request: NextRequest) {

  let body: Record<string, unknown> = {};
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    body = {};
  }

  const storecode = normalizeString(body.storecode);
  const walletAddress = normalizeWalletAddress(body.walletAddress);
  const userType = normalizeUserType(body.userType);

  if (!storecode || !walletAddress) {
    return NextResponse.json(
      {
        result: null,
        error: "storecode and walletAddress are required",
      },
      { status: 400 },
    );
  }

  if (userType === null) {
    return NextResponse.json(
      {
        result: null,
        error: "Invalid userType",
      },
      { status: 400 },
    );
  }

  const guard = await verifyCenterStoreAdminGuard({
    request,
    route: "/api/user/updateUserType",
    body,
    storecodeRaw: storecode,
    requesterWalletAddressRaw: body.requesterWalletAddress,
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

  const result = await updateUserType({
    storecode: storecode,
    walletAddress: walletAddress,
    userType: userType,
  });

  if (!result?.acknowledged) {
    return NextResponse.json(
      {
        result: null,
        error: "Failed to update userType",
      },
      { status: 500 },
    );
  }

  if (!result?.matchedCount) {
    return NextResponse.json(
      {
        result: null,
        error: "User not found",
      },
      { status: 404 },
    );
  }


 
  return NextResponse.json({

    result: true,
    matchedCount: result.matchedCount,
    modifiedCount: result.modifiedCount,
    
  });
  
}
