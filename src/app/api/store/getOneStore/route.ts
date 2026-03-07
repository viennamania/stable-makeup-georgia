import { NextResponse, type NextRequest } from "next/server";

import {
	getStoreByStorecode ,
} from '@lib/api/store';
import { verifyCenterStoreAdminGuard } from "@/lib/server/center-store-admin-guard";

const SENSITIVE_PUBLIC_STORE_KEYS = new Set([
  "payactionKey",
  "bankInfo",
  "bankInfoAAA",
  "bankInfoBBB",
  "bankInfoCCC",
  "bankInfoDDD",
  "sellerWalletAddress",
  "adminWalletAddress",
  "settlementWalletAddress",
  "settlementFeeWalletAddress",
  "agentFeeWalletAddress",
  "privateSellerWalletAddress",
  "privateSaleWalletAddress",
  "paymentCallbackUrl",
]);

const normalizeString = (value: unknown) => {
  if (typeof value !== "string") {
    return "";
  }
  return value.trim();
};

const hasCenterStoreAuthIntent = (body: Record<string, unknown>) => {
  return Boolean(
    normalizeString(body.signature)
    || normalizeString(body.signedAt)
    || normalizeString(body.nonce)
    || normalizeString(body.requesterWalletAddress)
    || normalizeString(body.walletAddress),
  );
};

const sanitizeStoreForPublic = (value: any) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return value;
  }

  const sanitized: Record<string, unknown> = {};
  for (const [key, itemValue] of Object.entries(value)) {
    if (SENSITIVE_PUBLIC_STORE_KEYS.has(key)) {
      continue;
    }
    sanitized[key] = itemValue;
  }

  return sanitized;
};


export async function POST(request: NextRequest) {

  let body: Record<string, unknown> = {};
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    body = {};
  }

  const {
    storecode,
  } = body;

  const safeStorecode = normalizeString(storecode);
  if (!safeStorecode) {
    return NextResponse.json(
      {
        result: null,
        error: "storecode is required",
      },
      { status: 400 },
    );
  }

  let privilegedRead = false;
  if (hasCenterStoreAuthIntent(body)) {
    const guardStorecode = safeStorecode || normalizeString(body.requesterStorecode) || "admin";
    const guard = await verifyCenterStoreAdminGuard({
      request,
      route: "/api/store/getOneStore",
      body,
      storecodeRaw: guardStorecode,
      requesterWalletAddressRaw: body.requesterWalletAddress ?? body.walletAddress,
    });
    privilegedRead = guard.ok;
  }

  const result = await getStoreByStorecode({
    storecode: safeStorecode,
  });

 
  return NextResponse.json({
    result: privilegedRead ? result : sanitizeStoreForPublic(result),
    
  });
  
}
