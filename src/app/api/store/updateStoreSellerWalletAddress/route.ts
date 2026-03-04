import { NextResponse, type NextRequest } from "next/server";

import {
	updateStoreSellerWalletAddress,
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
  const normalizedSellerWalletAddress = normalizeWalletAddress(body.sellerWalletAddress);

  if (!storecode || !normalizedSellerWalletAddress) {
    return NextResponse.json({
      result: null,
      error: "storecode and valid sellerWalletAddress are required",
    }, { status: 400 });
  }

  const guard = await verifyStoreSettingsAdminGuard({
    request,
    route: "/api/store/updateStoreSellerWalletAddress",
    body,
    requireSigned: true,
  });

  if (!guard.ok) {
    return NextResponse.json({
      result: null,
      error: guard.error,
    }, { status: guard.status });
  }
  const result = await updateStoreSellerWalletAddress({
    storecode,
    sellerWalletAddress: normalizedSellerWalletAddress,
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
    sellerWalletAddress: normalizedSellerWalletAddress,
    
  });
  
}
