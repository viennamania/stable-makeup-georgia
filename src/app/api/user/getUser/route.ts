import { NextResponse, type NextRequest } from "next/server";

import {
  getOneByWalletAddress,
} from "@lib/api/user";
import {
  buildSelfReadSigningMessage,
  consumeReadRateLimit,
  getRequestIp,
  logUserReadSecurityEvent,
  normalizeWalletAddress,
  parseSignedAtOrNull,
  sanitizeUserForResponse,
  verifyWalletSignatureWithFallback,
} from "@/lib/server/user-read-security";

type GetUserRequestBody = {
  storecode?: unknown;
  walletAddress?: unknown;
  requesterWalletAddress?: unknown;
  signature?: unknown;
  signedAt?: unknown;
};

const normalizeString = (value: unknown): string => {
  if (typeof value !== "string") {
    return "";
  }
  return value.trim();
};

export async function POST(request: NextRequest) {
  const body = (await request.json()) as GetUserRequestBody;

  const storecode = normalizeString(body.storecode);
  const targetWalletAddress = normalizeWalletAddress(body.walletAddress);
  const requesterWalletAddress = normalizeWalletAddress(body.requesterWalletAddress) || targetWalletAddress;
  const signature = normalizeString(body.signature);
  const signedAtIso = parseSignedAtOrNull(body.signedAt);
  const signatureProvided = Boolean(signature && signedAtIso);
  const requireSignature = process.env.USER_READ_REQUIRE_SIGNATURE !== "false";
  const ip = getRequestIp(request);

  if (!storecode || !targetWalletAddress) {
    return NextResponse.json(
      {
        result: null,
        error: "Missing required fields",
      },
      { status: 400 }
    );
  }

  const rate = consumeReadRateLimit({
    scope: "getUser",
    ip,
    walletAddress: targetWalletAddress,
  });

  if (!rate.allowed) {
    await logUserReadSecurityEvent({
      route: "/api/user/getUser",
      status: "blocked",
      reason: "rate_limited",
      ip,
      storecode,
      walletAddress: targetWalletAddress,
      requesterWalletAddress: requesterWalletAddress || undefined,
      signatureProvided,
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

  let signatureVerified = false;
  if (signature && signedAtIso && requesterWalletAddress && requesterWalletAddress === targetWalletAddress) {
    const signingMessage = buildSelfReadSigningMessage({
      storecode,
      walletAddress: targetWalletAddress,
      signedAtIso,
    });

    signatureVerified = await verifyWalletSignatureWithFallback({
      walletAddress: requesterWalletAddress,
      signature,
      message: signingMessage,
      storecodeHint: storecode,
    });
  }

  if (requireSignature && !signatureVerified) {
    await logUserReadSecurityEvent({
      route: "/api/user/getUser",
      status: "blocked",
      reason: "missing_or_invalid_signature",
      ip,
      storecode,
      walletAddress: targetWalletAddress,
      requesterWalletAddress: requesterWalletAddress || undefined,
      signatureProvided,
      signatureVerified,
      rateLimited: false,
    });

    return NextResponse.json(
      {
        result: null,
        error: "Invalid signature",
      },
      { status: 401 }
    );
  }

  const result = await getOneByWalletAddress(storecode, targetWalletAddress);
  const sanitizedResult = sanitizeUserForResponse(result);

  await logUserReadSecurityEvent({
    route: "/api/user/getUser",
    status: "allowed",
    reason: signatureVerified ? "signed" : "unsigned",
    ip,
    storecode,
    walletAddress: targetWalletAddress,
    requesterWalletAddress: requesterWalletAddress || undefined,
    signatureProvided,
    signatureVerified,
    rateLimited: false,
    extra: {
      found: Boolean(result),
      requireSignature,
    },
  });

  return NextResponse.json({
    result: sanitizedResult,
  });
}
