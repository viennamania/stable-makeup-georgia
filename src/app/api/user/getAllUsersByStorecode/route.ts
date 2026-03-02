import { NextResponse, type NextRequest } from "next/server";

import {
  getAllUsersByStorecodeAndVerified,
} from "@lib/api/user";
import {
  consumeReadRateLimit,
  getRequestIp,
  logUserReadSecurityEvent,
  sanitizeUserForResponse,
} from "@/lib/server/user-read-security";

type GetAllUsersByStorecodeRequestBody = {
  storecode?: unknown;
  limit?: unknown;
  page?: unknown;
};

const normalizeString = (value: unknown): string => {
  if (typeof value !== "string") {
    return "";
  }
  return value.trim();
};

const normalizeNumber = (value: unknown, fallback: number): number => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return Math.floor(parsed);
};

export async function POST(request: NextRequest) {
  const body = (await request.json()) as GetAllUsersByStorecodeRequestBody;

  const storecode = normalizeString(body.storecode);
  const limit = Math.min(200, normalizeNumber(body.limit, 100));
  const page = normalizeNumber(body.page, 1);
  const ip = getRequestIp(request);

  if (!storecode) {
    return NextResponse.json(
      {
        result: null,
        error: "Missing storecode",
      },
      { status: 400 }
    );
  }

  const rate = consumeReadRateLimit({
    scope: "getAllUsersByStorecode",
    ip,
    walletAddress: storecode.toLowerCase(),
  });

  if (!rate.allowed) {
    await logUserReadSecurityEvent({
      route: "/api/user/getAllUsersByStorecode",
      status: "blocked",
      reason: "rate_limited",
      ip,
      storecode,
      walletAddress: storecode.toLowerCase(),
      rateLimited: true,
      signatureProvided: false,
      signatureVerified: false,
    });

    return NextResponse.json(
      {
        result: null,
        error: "Too many requests",
      },
      { status: 429 }
    );
  }

  const result = await getAllUsersByStorecodeAndVerified({
    storecode,
    limit,
    page,
  });

  const sanitizedResult = sanitizeUserForResponse(result);

  await logUserReadSecurityEvent({
    route: "/api/user/getAllUsersByStorecode",
    status: "allowed",
    reason: "store_user_list_read",
    ip,
    storecode,
    walletAddress: storecode.toLowerCase(),
    rateLimited: false,
    signatureProvided: false,
    signatureVerified: false,
    extra: {
      limit,
      page,
      totalResult: result?.totalResult || 0,
    },
  });

  return NextResponse.json({
    result: sanitizedResult,
  });
}
