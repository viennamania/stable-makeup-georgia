import { NextResponse, type NextRequest } from "next/server";

import {
	updateBuyer,
} from '@lib/api/user';
import { verifyCenterStoreAdminGuard } from "@/lib/server/center-store-admin-guard";
import { normalizeWalletAddress } from "@/lib/server/user-read-security";

const normalizeString = (value: unknown): string => {
  if (typeof value !== "string") {
    return "";
  }
  return value.trim();
};


export async function POST(request: NextRequest) {

  let body: Record<string, unknown> = {};
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    body = {};
  }

  /*
    storecode: userStorecode,
  walletAddress: userWalletAddress,
    depositBankName: bankName,
    depositBankAccountNumber: accountNumber,
    depositName: accountHolder,
  */

  const storecode = normalizeString(body.storecode);
  const walletAddress = normalizeWalletAddress(body.walletAddress);
  const depositBankName = normalizeString(body.depositBankName);
  const depositBankAccountNumber = normalizeString(body.depositBankAccountNumber).replace(/[^0-9]/g, "");
  const depositName = normalizeString(body.depositName);

  if (!storecode || !walletAddress) {
    return NextResponse.json(
      {
        result: null,
        error: "storecode and walletAddress are required",
      },
      { status: 400 },
    );
  }

  if (!depositBankName || !depositBankAccountNumber || !depositName) {
    return NextResponse.json(
      {
        result: null,
        error: "depositBankName, depositBankAccountNumber and depositName are required",
      },
      { status: 400 },
    );
  }

  if (depositBankName.length > 60 || depositName.length > 60 || depositBankAccountNumber.length > 30) {
    return NextResponse.json(
      {
        result: null,
        error: "Invalid bank info length",
      },
      { status: 400 },
    );
  }

  const guard = await verifyCenterStoreAdminGuard({
    request,
    route: "/api/user/updateUserBankInfo",
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

  const buyer = {
    depositBankName,
    depositBankAccountNumber,
    depositName,
  }

  const result = await updateBuyer({
    storecode: storecode,
    walletAddress: walletAddress,
    buyer: buyer,
  });

  if (!result?.acknowledged) {
    return NextResponse.json(
      {
        result: null,
        error: "Failed to update buyer bank info",
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
