import { NextResponse, type NextRequest } from "next/server";

import {
	updateStoreMemo
} from '@lib/api/store';
import { verifyStoreSettingsAdminGuard } from "@/lib/server/store-settings-admin-guard";


export async function POST(request: NextRequest) {

  const body = await request.json();
  const storecode = String(body?.storecode || "").trim();
  const walletAddress = String(body?.walletAddress || "").trim();
  const storeMemo = String(body?.storeMemo || "")
    .replace(/\u0000/g, "")
    .trim();

  const guard = await verifyStoreSettingsAdminGuard({
    request,
    route: "/api/store/setStoreMemo",
    body,
    requireSigned: true,
  });

  if (!guard.ok) {
    return NextResponse.json({
      result: null,
      error: guard.error,
    }, { status: guard.status });
  }

  if (!storecode) {
    return NextResponse.json({
      result: null,
      error: "storecode is required",
    }, { status: 400 });
  }

  if (storeMemo.length > 5000) {
    return NextResponse.json({
      result: null,
      error: "storeMemo is too long",
    }, { status: 400 });
  }

  const result = await updateStoreMemo({
    walletAddress,
    storecode,
    storeMemo,
  });

 
  return NextResponse.json({

    result,
    
  });
  
}
