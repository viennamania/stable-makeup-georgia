import { NextResponse, type NextRequest } from "next/server";

import {
	updateStoreAdminWalletAddress,
} from '@lib/api/store';
import {
  getOneVerifiedNonServerWalletByStorecodeAndWalletAddress,
} from '@lib/api/user';

import { verifyStoreSettingsAdminGuard } from "@/lib/server/store-settings-admin-guard";
import { normalizeWalletAddress } from "@/lib/server/user-read-security";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
const ALLOWED_BODY_KEYS = new Set([
  "storecode",
  "adminWalletAddress",
  "requesterStorecode",
  "requesterWalletAddress",
  "walletAddress",
  "signature",
  "signedAt",
  "nonce",
]);


export async function POST(request: NextRequest) {

  let body: Record<string, unknown> = {};
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    body = {};
  }

  const storecode = typeof body.storecode === "string" ? body.storecode.trim() : "";
  const normalizedAdminWalletAddress = normalizeWalletAddress(body.adminWalletAddress);

  const unknownKeys = Object.keys(body).filter((key) => !ALLOWED_BODY_KEYS.has(key));
  if (unknownKeys.length > 0) {
    return NextResponse.json({
      result: null,
      error: `Unexpected fields: ${unknownKeys.join(", ")}`,
    }, { status: 400 });
  }

  if (!storecode || !normalizedAdminWalletAddress) {
    return NextResponse.json({
      result: null,
      error: "storecode and valid adminWalletAddress are required",
    }, { status: 400 });
  }

  if (normalizedAdminWalletAddress === ZERO_ADDRESS) {
    return NextResponse.json({
      result: null,
      error: "adminWalletAddress cannot be zero address",
    }, { status: 400 });
  }

  const adminWalletAddressForSignature = typeof body.adminWalletAddress === "string"
    ? body.adminWalletAddress.trim()
    : body.adminWalletAddress;

  const guardBody: Record<string, unknown> = {
    storecode,
    adminWalletAddress: adminWalletAddressForSignature,
  };

  if (typeof body.requesterStorecode === "string" && body.requesterStorecode.trim()) {
    guardBody.requesterStorecode = body.requesterStorecode.trim();
  }
  if (typeof body.requesterWalletAddress === "string" && body.requesterWalletAddress.trim()) {
    guardBody.requesterWalletAddress = body.requesterWalletAddress.trim().toLowerCase();
  } else if (typeof body.walletAddress === "string" && body.walletAddress.trim()) {
    guardBody.requesterWalletAddress = body.walletAddress.trim().toLowerCase();
  }
  if (typeof body.signature === "string" && body.signature.trim()) {
    guardBody.signature = body.signature.trim();
  }
  if (typeof body.signedAt === "string" && body.signedAt.trim()) {
    guardBody.signedAt = body.signedAt.trim();
  }
  if (typeof body.nonce === "string" && body.nonce.trim()) {
    guardBody.nonce = body.nonce.trim();
  }

  const guard = await verifyStoreSettingsAdminGuard({
    request,
    route: "/api/store/updateStoreAdminWalletAddress",
    body: guardBody,
    requireSigned: true,
  });

  if (!guard.ok) {
    return NextResponse.json({
      result: null,
      error: guard.error,
    }, { status: guard.status });
  }

  const adminWalletUser = await getOneVerifiedNonServerWalletByStorecodeAndWalletAddress(
    storecode,
    normalizedAdminWalletAddress,
  );

  if (!adminWalletUser) {
    return NextResponse.json({
      result: null,
      error: "adminWalletAddress must belong to a verified non-server-wallet user in the store",
    }, { status: 400 });
  }


  const result = await updateStoreAdminWalletAddress({
    storecode,
    adminWalletAddress: normalizedAdminWalletAddress,
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
    adminWalletAddress: normalizedAdminWalletAddress,
    
  });
  
}
