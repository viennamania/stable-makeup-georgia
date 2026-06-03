import { NextResponse, type NextRequest } from "next/server";

import {
  getOneAdminWalletUserByWalletAddress,
  getOneByStorecodeAndWalletAddress,
  getOneByWalletAddress,
} from "@lib/api/user";
import {
  getAdminPasswordCenterStoreAccess,
  isAdminPasswordCookieSessionRequestAllowed,
  readAdminPasswordSession,
} from "@/lib/server/admin-password-auth";
import {
  buildAdminReadSigningMessage,
  consumeReadRateLimit,
  getRequestIp,
  logUserReadSecurityEvent,
  normalizeWalletAddress,
  parseSignedAtOrNull,
  sanitizeUserForResponse,
  verifyWalletSignatureWithFallback,
} from "@/lib/server/user-read-security";

type AdminReadUserRequestBody = {
  storecode?: unknown;
  walletAddress?: unknown;
  requesterStorecode?: unknown;
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
  const body = (await request.json()) as AdminReadUserRequestBody;

  const targetStorecode = normalizeString(body.storecode);
  const targetWalletAddress = normalizeWalletAddress(body.walletAddress);
  const requesterStorecode = normalizeString(body.requesterStorecode || "admin");
  const requesterWalletAddress = normalizeWalletAddress(body.requesterWalletAddress);
  const signature = normalizeString(body.signature);
  const signedAtIso = parseSignedAtOrNull(body.signedAt);
  const ip = getRequestIp(request);

  if (!targetStorecode || !targetWalletAddress) {
    return NextResponse.json(
      {
        result: null,
        error: "Missing required fields",
      },
      { status: 400 }
    );
  }

  const passwordSession = await readAdminPasswordSession(request).catch(() => null);
  if (passwordSession?.authenticated) {
    const passwordRequesterWalletAddress = passwordSession.requesterWalletAddress;
    const passwordRate = consumeReadRateLimit({
      scope: "getUserByStorecodeAndWalletAddress:admin-password-session",
      ip,
      walletAddress: passwordRequesterWalletAddress,
    });

    if (!passwordRate.allowed) {
      void logUserReadSecurityEvent({
        route: "/api/user/getUserByStorecodeAndWalletAddress",
        status: "blocked",
        reason: "password_session_rate_limited",
        ip,
        storecode: targetStorecode,
        walletAddress: targetWalletAddress,
        requesterWalletAddress: passwordRequesterWalletAddress,
        signatureProvided: false,
        signatureVerified: false,
        rateLimited: true,
        extra: {
          requesterStorecode: passwordSession.requesterStorecode,
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

    if (!isAdminPasswordCookieSessionRequestAllowed(request, passwordSession.source)) {
      void logUserReadSecurityEvent({
        route: "/api/user/getUserByStorecodeAndWalletAddress",
        status: "blocked",
        reason: "password_session_invalid_origin",
        ip,
        storecode: targetStorecode,
        walletAddress: targetWalletAddress,
        requesterWalletAddress: passwordRequesterWalletAddress,
        signatureProvided: false,
        signatureVerified: false,
        rateLimited: false,
        extra: {
          requesterStorecode: passwordSession.requesterStorecode,
        },
      });

      return NextResponse.json(
        {
          result: null,
          error: "Invalid session origin",
        },
        { status: 403 }
      );
    }

    const centerAccess = getAdminPasswordCenterStoreAccess({
      account: passwordSession.account,
      storecode: targetStorecode,
    });

    if (!centerAccess.ok) {
      void logUserReadSecurityEvent({
        route: "/api/user/getUserByStorecodeAndWalletAddress",
        status: "blocked",
        reason: `password_session_${centerAccess.reason}`,
        ip,
        storecode: targetStorecode,
        walletAddress: targetWalletAddress,
        requesterWalletAddress: passwordRequesterWalletAddress,
        signatureProvided: false,
        signatureVerified: false,
        rateLimited: false,
        extra: {
          requesterStorecode: passwordSession.requesterStorecode,
          requesterRole: passwordSession.account.role,
          allowedStorecodes: passwordSession.account.storecodes,
        },
      });

      return NextResponse.json(
        {
          result: null,
          error: "Forbidden",
        },
        { status: 403 }
      );
    }

    const result = await getOneByStorecodeAndWalletAddress(targetStorecode, targetWalletAddress);
    const sanitizedResult = sanitizeUserForResponse(result);

    void logUserReadSecurityEvent({
      route: "/api/user/getUserByStorecodeAndWalletAddress",
      status: "allowed",
      reason: "admin_password_session",
      ip,
      storecode: targetStorecode,
      walletAddress: targetWalletAddress,
      requesterWalletAddress: passwordRequesterWalletAddress,
      signatureProvided: false,
      signatureVerified: false,
      rateLimited: false,
      extra: {
        found: Boolean(result),
        requesterStorecode: passwordSession.requesterStorecode,
        requesterRole: passwordSession.account.role,
        matchedBy: centerAccess.matchedBy,
      },
    });

    return NextResponse.json({
      result: sanitizedResult,
    });
  }

  if (!requesterStorecode || !requesterWalletAddress) {
    return NextResponse.json(
      {
        result: null,
        error: "Missing required fields",
      },
      { status: 400 }
    );
  }

  const rate = consumeReadRateLimit({
    scope: "getUserByStorecodeAndWalletAddress",
    ip,
    walletAddress: requesterWalletAddress,
  });

  if (!rate.allowed) {
    void logUserReadSecurityEvent({
      route: "/api/user/getUserByStorecodeAndWalletAddress",
      status: "blocked",
      reason: "rate_limited",
      ip,
      storecode: targetStorecode,
      walletAddress: targetWalletAddress,
      requesterWalletAddress,
      signatureProvided: Boolean(signature && signedAtIso),
      signatureVerified: false,
      rateLimited: true,
      extra: {
        requesterStorecode,
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

  if (!signature || !signedAtIso) {
    void logUserReadSecurityEvent({
      route: "/api/user/getUserByStorecodeAndWalletAddress",
      status: "blocked",
      reason: "missing_signature",
      ip,
      storecode: targetStorecode,
      walletAddress: targetWalletAddress,
      requesterWalletAddress,
      signatureProvided: false,
      signatureVerified: false,
      rateLimited: false,
      extra: {
        requesterStorecode,
      },
    });

    return NextResponse.json(
      {
        result: null,
        error: "Invalid signature",
      },
      { status: 401 }
    );
  }

  const signingMessage = buildAdminReadSigningMessage({
    adminStorecode: requesterStorecode,
    adminWalletAddress: requesterWalletAddress,
    targetStorecode,
    targetWalletAddress,
    signedAtIso,
  });

  const signatureVerified = await verifyWalletSignatureWithFallback({
    walletAddress: requesterWalletAddress,
    signature,
    message: signingMessage,
    storecodeHint: requesterStorecode,
  });

  if (!signatureVerified) {
    void logUserReadSecurityEvent({
      route: "/api/user/getUserByStorecodeAndWalletAddress",
      status: "blocked",
      reason: "invalid_signature",
      ip,
      storecode: targetStorecode,
      walletAddress: targetWalletAddress,
      requesterWalletAddress,
      signatureProvided: true,
      signatureVerified: false,
      rateLimited: false,
      extra: {
        requesterStorecode,
      },
    });

    return NextResponse.json(
      {
        result: null,
        error: "Invalid signature",
      },
      { status: 401 }
    );
  }

  const requesterUser = requesterStorecode.toLowerCase() === "admin"
    ? await getOneAdminWalletUserByWalletAddress(requesterWalletAddress)
    : await getOneByWalletAddress(requesterStorecode, requesterWalletAddress);
  const requesterStorecodeLower = String(requesterUser?.storecode || "").trim().toLowerCase();
  const requesterRoleLower = String(requesterUser?.role || "").trim().toLowerCase();
  const isAdmin = requesterStorecodeLower === "admin" && requesterRoleLower === "admin";

  if (!isAdmin) {
    void logUserReadSecurityEvent({
      route: "/api/user/getUserByStorecodeAndWalletAddress",
      status: "blocked",
      reason: "forbidden_not_admin",
      ip,
      storecode: targetStorecode,
      walletAddress: targetWalletAddress,
      requesterWalletAddress,
      signatureProvided: true,
      signatureVerified: true,
      rateLimited: false,
      extra: {
        requesterStorecode: requesterUser?.storecode || requesterStorecode,
        requesterRole: requesterUser?.role || null,
      },
    });

    return NextResponse.json(
      {
        result: null,
        error: "Forbidden",
      },
      { status: 403 }
    );
  }

  const result = await getOneByStorecodeAndWalletAddress(targetStorecode, targetWalletAddress);
  const sanitizedResult = sanitizeUserForResponse(result);

  void logUserReadSecurityEvent({
    route: "/api/user/getUserByStorecodeAndWalletAddress",
    status: "allowed",
    reason: "admin_signed",
    ip,
    storecode: targetStorecode,
    walletAddress: targetWalletAddress,
    requesterWalletAddress,
    signatureProvided: true,
    signatureVerified: true,
    rateLimited: false,
    extra: {
      found: Boolean(result),
      requesterStorecode: requesterUser?.storecode || requesterStorecode,
    },
  });

  return NextResponse.json({
    result: sanitizedResult,
  });
}
