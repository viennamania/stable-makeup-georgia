import { NextResponse, type NextRequest } from "next/server";

import {
	updateStoreSettlementWalletAddress,
} from '@lib/api/store';

import { verifyStoreSettingsAdminGuard } from "@/lib/server/store-settings-admin-guard";
import { normalizeWalletAddress } from "@/lib/server/user-read-security";


export async function POST(request: NextRequest) {

  let body: Record<string, unknown> = {};
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    body = {};
  }

  const storecode = typeof body.storecode === "string" ? body.storecode.trim() : "";
  const normalizedSettlementWalletAddress = normalizeWalletAddress(body.settlementWalletAddress);

  if (!storecode || !normalizedSettlementWalletAddress) {
    return NextResponse.json({
      result: null,
      error: "storecode and valid settlementWalletAddress are required",
    }, { status: 400 });
  }

  const guard = await verifyStoreSettingsAdminGuard({
    request,
    route: "/api/store/updateStoreSettlementWalletAddress",
    body,
    requireSigned: true,
  });

  if (!guard.ok) {
    return NextResponse.json({
      result: null,
      error: guard.error,
    }, { status: guard.status });
  }


  const result = await updateStoreSettlementWalletAddress({
    storecode,
    settlementWalletAddress: normalizedSettlementWalletAddress,
  });

  if (!result) {
    return NextResponse.json({
      result: null,
      error: "Store not found",
    }, { status: 404 });
  }

  return NextResponse.json({

    result: true,
    storecode,
    settlementWalletAddress: normalizedSettlementWalletAddress,
    
  });
  
}
