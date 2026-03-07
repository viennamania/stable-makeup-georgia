import { NextResponse, type NextRequest } from "next/server";

import {
  getAllUsers,
} from "@lib/api/user";
import {
  consumeReadRateLimit,
  getRequestIp,
  logUserReadSecurityEvent,
  sanitizeUserForResponse,
} from "@/lib/server/user-read-security";

type GetAllUsersRequestBody = {
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
  const body = (await request.json()) as GetAllUsersRequestBody;

  const storecode = normalizeString(body.storecode);
  const limit = Math.min(200, normalizeNumber(body.limit, 100));
  const page = normalizeNumber(body.page, 1);
  const ip = getRequestIp(request);

  const rate = consumeReadRateLimit({
    scope: "getAllUsers",
    ip,
    walletAddress: "all",
  });

  if (!rate.allowed) {
    void logUserReadSecurityEvent({
      route: "/api/user/getAllUsers",
      status: "blocked",
      reason: "rate_limited",
      ip,
      storecode: storecode || undefined,
      walletAddress: "all",
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

  const result = await getAllUsers({
    storecode: storecode || "",
    limit,
    page,
  });

  const sanitizedResult = sanitizeUserForResponse(result);

  void logUserReadSecurityEvent({
    route: "/api/user/getAllUsers",
    status: "allowed",
    reason: "list_read",
    ip,
    storecode: storecode || undefined,
    walletAddress: "all",
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
