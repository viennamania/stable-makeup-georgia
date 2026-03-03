import { NextResponse, type NextRequest } from "next/server";

import {
	insertBuyOrderForClearance,
} from '@lib/api/order';

import {
  checkSellerByWalletAddress,
  getOneByWalletAddress,
} from '@lib/api/user';


import {
  chain,
} from "@/app/config/contractAddresses";

import {
  normalizeWalletAddress,
  parseSignedAtOrNull,
  verifyWalletSignatureWithFallback,
} from "@/lib/server/user-read-security";

const SET_BUY_ORDER_FOR_CLEARANCE_SIGNING_PREFIX = "stable-georgia:set-buy-order-for-clearance:v1";

type SetBuyOrderForClearanceRequestBody = {
  storecode?: unknown;
  walletAddress?: unknown;
  requesterWalletAddress?: unknown;
  signature?: unknown;
  signedAt?: unknown;
  sellerBankInfo?: unknown;
  usdtAmount?: unknown;
  krwAmount?: unknown;
  rate?: unknown;
  privateSale?: unknown;
  buyer?: unknown;
};

const normalizeString = (value: unknown): string => {
  if (typeof value !== "string") {
    return "";
  }
  return value.trim();
};

const normalizePositiveNumber = (value: unknown): number | null => {
  const normalized = Number(value);
  if (!Number.isFinite(normalized) || normalized <= 0) {
    return null;
  }
  return normalized;
};

const formatNumberForSignature = (value: number) => {
  return Number.isFinite(value) ? value.toString() : "";
};

const buildSetBuyOrderForClearanceSigningMessage = ({
  requesterWalletAddress,
  storecode,
  sellerWalletAddress,
  usdtAmount,
  krwAmount,
  rate,
  signedAtIso,
}: {
  requesterWalletAddress: string;
  storecode: string;
  sellerWalletAddress: string;
  usdtAmount: number;
  krwAmount: number;
  rate: number;
  signedAtIso: string;
}) => {
  return [
    SET_BUY_ORDER_FOR_CLEARANCE_SIGNING_PREFIX,
    `requesterWalletAddress:${requesterWalletAddress}`,
    `storecode:${storecode}`,
    `sellerWalletAddress:${sellerWalletAddress}`,
    `usdtAmount:${formatNumberForSignature(usdtAmount)}`,
    `krwAmount:${formatNumberForSignature(krwAmount)}`,
    `rate:${formatNumberForSignature(rate)}`,
    `signedAt:${signedAtIso}`,
  ].join("\n");
};

export async function POST(request: NextRequest) {

  const body = await request.json() as SetBuyOrderForClearanceRequestBody;

  const storecode = normalizeString(body.storecode);
  const requestedSellerWalletAddress = normalizeString(body.walletAddress);
  const normalizedSellerWalletAddress = normalizeWalletAddress(requestedSellerWalletAddress);
  const requesterWalletAddress = normalizeWalletAddress(body.requesterWalletAddress);
  const signature = normalizeString(body.signature);
  const signedAtIso = parseSignedAtOrNull(body.signedAt);
  const usdtAmount = normalizePositiveNumber(body.usdtAmount);
  const krwAmount = normalizePositiveNumber(body.krwAmount);
  const rate = normalizePositiveNumber(body.rate);

  if (
    !storecode
    || !requestedSellerWalletAddress
    || !normalizedSellerWalletAddress
    || !requesterWalletAddress
    || !signature
    || !signedAtIso
    || !usdtAmount
    || !krwAmount
    || !rate
  ) {
    return NextResponse.json(
      {
        result: null,
        error: "Missing or invalid required fields",
      },
      { status: 400 }
    );
  }

  const signingMessage = buildSetBuyOrderForClearanceSigningMessage({
    requesterWalletAddress,
    storecode,
    sellerWalletAddress: normalizedSellerWalletAddress,
    usdtAmount,
    krwAmount,
    rate,
    signedAtIso,
  });

  const signatureVerified = await verifyWalletSignatureWithFallback({
    walletAddress: requesterWalletAddress,
    signature,
    message: signingMessage,
    storecodeHint: "admin",
  });

  if (!signatureVerified) {
    return NextResponse.json(
      {
        result: null,
        error: "Invalid signature",
      },
      { status: 401 }
    );
  }

  const requesterUser = await getOneByWalletAddress("admin", requesterWalletAddress);
  const requesterStorecode = String(requesterUser?.storecode || "").trim().toLowerCase();
  const requesterRole = String(requesterUser?.role || "").trim().toLowerCase();
  const requesterIsAdmin = requesterStorecode === "admin" && requesterRole === "admin";

  if (!requesterIsAdmin) {
    return NextResponse.json(
      {
        result: null,
        error: "Forbidden",
      },
      { status: 403 }
    );
  }

  let user = await checkSellerByWalletAddress("admin", requestedSellerWalletAddress);
  if (!user && requestedSellerWalletAddress !== normalizedSellerWalletAddress) {
    user = await checkSellerByWalletAddress("admin", normalizedSellerWalletAddress);
  }
  if (!user) {
    return NextResponse.json({
      result: null,
      error: "Seller with the provided wallet address does not exist",
    }
    , { status: 400 });
  }

  const sellerNickname = user.nickname;



  const result = await insertBuyOrderForClearance({
   
    chain: chain,
    
    storecode: storecode,
    
    walletAddress: normalizedSellerWalletAddress,

    sellerBankInfo: body.sellerBankInfo,

    nickname: sellerNickname,

    usdtAmount: usdtAmount,
    krwAmount: krwAmount,
    rate: rate,
    privateSale: body.privateSale,
    buyer: body.buyer
  });

  ///console.log("setBuyOrder =====  result", result);

  if (!result) {

    return NextResponse.json({
      result: null,
      error: "Failed to insert buy order",
    }
    , { status: 500 });

  }




 
  return NextResponse.json({

    result,
    
  });
  
}
