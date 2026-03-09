import { NextResponse, type NextRequest } from "next/server";

import {
  getAllServerWalletUsersWithStoreInfo,
} from "@lib/api/user";
import {
  consumeReadRateLimit,
  getRequestIp,
  logUserReadSecurityEvent,
  sanitizeUserForResponse,
} from "@/lib/server/user-read-security";

type GetAllServerWalletUsersRequestBody = {
  keyword?: unknown;
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
  const body = (await request.json().catch(() => ({}))) as GetAllServerWalletUsersRequestBody;

  const keyword = normalizeString(body.keyword);
  const limit = Math.min(50, normalizeNumber(body.limit, 20));
  const page = normalizeNumber(body.page, 1);
  const ip = getRequestIp(request);

  const rate = consumeReadRateLimit({
    scope: "getAllServerWalletUsers",
    ip,
    walletAddress: keyword ? keyword.toLowerCase() : "all",
  });

  if (!rate.allowed) {
    void logUserReadSecurityEvent({
      route: "/api/user/getAllServerWalletUsers",
      status: "blocked",
      reason: "rate_limited",
      ip,
      walletAddress: keyword ? keyword.toLowerCase() : "all",
      rateLimited: true,
      signatureProvided: false,
      signatureVerified: false,
      extra: {
        keyword,
        limit,
        page,
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

  const result = await getAllServerWalletUsersWithStoreInfo({
    keyword,
    limit,
    page,
  });

  const sanitizedResult = sanitizeUserForResponse(result);

  void logUserReadSecurityEvent({
    route: "/api/user/getAllServerWalletUsers",
    status: "allowed",
    reason: "server_wallet_user_list_read",
    ip,
    walletAddress: keyword ? keyword.toLowerCase() : "all",
    rateLimited: false,
    signatureProvided: false,
    signatureVerified: false,
    extra: {
      keyword,
      limit,
      page,
      totalResult: result?.totalResult || 0,
    },
  });

  return NextResponse.json({
    result: sanitizedResult,
  });
}
