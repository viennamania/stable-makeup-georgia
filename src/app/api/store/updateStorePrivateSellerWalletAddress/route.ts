import { NextResponse, type NextRequest } from "next/server";

import {
	updateStorePrivateSellerWalletAddress,
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
  const normalizedPrivateSellerWalletAddress = normalizeWalletAddress(body.privateSellerWalletAddress);

  if (!storecode || !normalizedPrivateSellerWalletAddress) {
    return NextResponse.json({
      result: null,
      error: "storecode and valid privateSellerWalletAddress are required",
    }, { status: 400 });
  }

  const guard = await verifyStoreSettingsAdminGuard({
    request,
    route: "/api/store/updateStorePrivateSellerWalletAddress",
    body,
    requireSigned: true,
  });

  if (!guard.ok) {
    return NextResponse.json({
      result: null,
      error: guard.error,
    }, { status: guard.status });
  }

  const result = await updateStorePrivateSellerWalletAddress({
    storecode,
    privateSellerWalletAddress: normalizedPrivateSellerWalletAddress,
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
    privateSellerWalletAddress: normalizedPrivateSellerWalletAddress,
    
  });
  
}
