import { NextResponse, type NextRequest } from "next/server";

import {
	updateStoreSettlementWalletAddress,
} from '@lib/api/store';
import {
  getOneServerWalletByStorecodeAndWalletAddress,
} from '@lib/api/user';

import { verifyStoreSettingsAdminGuard } from "@/lib/server/store-settings-admin-guard";
import { getRequestIp, normalizeWalletAddress } from "@/lib/server/user-read-security";

const ROUTE_PATH = "/api/store/updateStoreSettlementWalletAddress";


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
    route: ROUTE_PATH,
    body,
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
    normalizedSettlementWalletAddress,
  );

  if (!serverWalletUser) {
    return NextResponse.json({
      result: null,
      error: "settlementWalletAddress must belong to a server wallet user in the same store",
    }, { status: 400 });
  }


  const result = await updateStoreSettlementWalletAddress({
    storecode,
    settlementWalletAddress: normalizedSettlementWalletAddress,
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
    settlementWalletAddress: normalizedSettlementWalletAddress,
    
  });
  
}
