import { NextResponse, type NextRequest } from "next/server";

import {
	updateStorePrivateSellerWalletAddress,
} from '@lib/api/store';
import {
  getOneServerWalletByStorecodeAndWalletAddress,
} from '@lib/api/user';

import { verifyStoreSettingsAdminGuard } from "@/lib/server/store-settings-admin-guard";
import { resolveThirdwebServerWalletByAddress } from "@/lib/server/thirdweb-server-wallet-cache";
import { getRequestIp, normalizeWalletAddress } from "@/lib/server/user-read-security";

const ROUTE_PATH = "/api/store/updateStorePrivateSellerWalletAddress";
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
const ALLOWED_BODY_KEYS = new Set([
  "storecode",
  "privateSellerWalletAddress",
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
  const normalizedPrivateSellerWalletAddress = normalizeWalletAddress(body.privateSellerWalletAddress);

  const unknownKeys = Object.keys(body).filter((key) => !ALLOWED_BODY_KEYS.has(key));
  if (unknownKeys.length > 0) {
    return NextResponse.json({
      result: null,
      error: `Unexpected fields: ${unknownKeys.join(", ")}`,
    }, { status: 400 });
  }

  if (!storecode || !normalizedPrivateSellerWalletAddress) {
    return NextResponse.json({
      result: null,
      error: "storecode and valid privateSellerWalletAddress are required",
    }, { status: 400 });
  }

  if (normalizedPrivateSellerWalletAddress === ZERO_ADDRESS) {
    return NextResponse.json({
      result: null,
      error: "privateSellerWalletAddress cannot be zero address",
    }, { status: 400 });
  }

  const privateSellerWalletAddressForSignature = typeof body.privateSellerWalletAddress === "string"
    ? body.privateSellerWalletAddress.trim()
    : body.privateSellerWalletAddress;

  const guardBody: Record<string, unknown> = {
    storecode,
    privateSellerWalletAddress: privateSellerWalletAddressForSignature,
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
    route: ROUTE_PATH,
    body: guardBody,
    requireSigned: true,
  });

  if (!guard.ok) {
    return NextResponse.json({
      result: null,
      error: guard.error,
    }, { status: guard.status });
  }

  const serverWalletUser = await getOneServerWalletByStorecodeAndWalletAddress(
    storecode,
    normalizedPrivateSellerWalletAddress,
  );

  if (!serverWalletUser) {
    return NextResponse.json({
      result: null,
      error: "privateSellerWalletAddress must belong to a server wallet user in the same store",
    }, { status: 400 });
  }

  let resolvedThirdwebServerWallet = null;
  try {
    resolvedThirdwebServerWallet = await resolveThirdwebServerWalletByAddress(
      normalizedPrivateSellerWalletAddress,
    );
  } catch (error) {
    return NextResponse.json({
      result: null,
      error: error instanceof Error ? error.message : "Failed to validate privateSellerWalletAddress",
    }, { status: 500 });
  }

  if (!resolvedThirdwebServerWallet) {
    return NextResponse.json({
      result: null,
      error: "privateSellerWalletAddress must be an active Thirdweb server wallet",
    }, { status: 400 });
  }

  if (resolvedThirdwebServerWallet.smartAccountAddress !== normalizedPrivateSellerWalletAddress) {
    return NextResponse.json({
      result: null,
      error: "privateSellerWalletAddress must be a Thirdweb server wallet smart account address",
    }, { status: 400 });
  }

  const serverWalletUserSignerAddress = normalizeWalletAddress(serverWalletUser?.signerAddress);
  if (!serverWalletUserSignerAddress || serverWalletUserSignerAddress !== resolvedThirdwebServerWallet.signerAddress) {
    return NextResponse.json({
      result: null,
      error: "privateSellerWalletAddress does not match the store server wallet signer",
    }, { status: 400 });
  }

  const result = await updateStorePrivateSellerWalletAddress({
    storecode,
    privateSellerWalletAddress: normalizedPrivateSellerWalletAddress,
    audit: {
      route: ROUTE_PATH,
      publicIp: guard.ip || getRequestIp(request),
      requesterWalletAddress: guard.requesterWalletAddress,
      userAgent: request.headers.get("user-agent"),
    },
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
