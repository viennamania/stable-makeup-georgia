import { NextResponse, type NextRequest } from "next/server";

import {
  getOneByWalletAddress,
  getOneByWalletAddressAcrossStores,
} from "@lib/api/user";
import {
  consumeReadRateLimit,
  getRequestIp,
  logUserReadSecurityEvent,
  normalizeWalletAddress,
  sanitizeUserForResponse,
} from "@/lib/server/user-read-security";

type GetUserByWalletAddressRequestBody = {
  storecode?: unknown;
  walletAddress?: unknown;
};

const normalizeString = (value: unknown): string => {
  if (typeof value !== "string") {
    return "";
  }
  return value.trim();
};

export async function POST(request: NextRequest) {
  const body = (await request.json()) as GetUserByWalletAddressRequestBody;

  const storecode = normalizeString(body.storecode);
  const walletAddress = normalizeWalletAddress(body.walletAddress);
  const ip = getRequestIp(request);

  if (!walletAddress) {
    return NextResponse.json(
      {
        result: null,
        error: "Missing walletAddress",
      },
      { status: 400 }
    );
  }

  const rate = consumeReadRateLimit({
    scope: "getUserByWalletAddress",
    ip,
    walletAddress,
  });

  if (!rate.allowed) {
    await logUserReadSecurityEvent({
      route: "/api/user/getUserByWalletAddress",
      status: "blocked",
      reason: "rate_limited",
      ip,
      storecode: storecode || undefined,
      walletAddress,
      signatureProvided: false,
      signatureVerified: false,
      rateLimited: true,
      extra: {
        rateLimitMax: rate.max,
      },
    });

    return NextResponse.json(
      {
        result: null,
        error: "Too many requests",
      },
      { status: 429 }
    );
  }

  const result = storecode
    ? await getOneByWalletAddress(storecode, walletAddress)
    : await getOneByWalletAddressAcrossStores(walletAddress);

  const sanitizedResult = sanitizeUserForResponse(result);

  await logUserReadSecurityEvent({
    route: "/api/user/getUserByWalletAddress",
    status: "allowed",
    reason: storecode ? "store_scoped_lookup" : "global_lookup",
    ip,
    storecode: storecode || undefined,
    walletAddress,
    signatureProvided: false,
    signatureVerified: false,
    rateLimited: false,
    extra: {
      found: Boolean(result),
    },
  });

  return NextResponse.json({
    result: sanitizedResult,
  });
}
