import { NextResponse, type NextRequest } from "next/server";

import { getClientExchangeRateHistory } from "@lib/api/client";
import type { ClientExchangeRateHistoryType } from "@/lib/client-settings";
import { verifyAdminSignedAction } from "@/lib/server/admin-action-security";
import {
  CLIENT_SETTINGS_ADMIN_READ_SIGNING_PREFIX,
  CLIENT_SETTINGS_GET_RATE_HISTORY_ROUTE,
  extractClientSettingsAdminActionFields,
  isPlainObject,
} from "@/lib/security/client-settings-admin";

const clientId = process.env.NEXT_PUBLIC_TEMPLATE_CLIENT_ID || "";
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 30;

const parseHistoryType = (value: unknown): ClientExchangeRateHistoryType | null => {
  if (value === "buy" || value === "sell") {
    return value;
  }
  return null;
};

const parseLimit = (value: unknown) => {
  const parsed = Number.parseInt(String(value || ""), 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return DEFAULT_LIMIT;
  }
  return Math.min(parsed, MAX_LIMIT);
};

export async function POST(request: NextRequest) {
  if (!clientId) {
    return NextResponse.json(
      {
        result: null,
        error: "No clientId configured in environment",
      },
      { status: 500 },
    );
  }

  let body: Record<string, unknown> = {};

  try {
    const parsed = await request.json();
    body = isPlainObject(parsed) ? parsed : {};
  } catch {
    body = {};
  }

  const authResult = await verifyAdminSignedAction({
    request,
    route: CLIENT_SETTINGS_GET_RATE_HISTORY_ROUTE,
    signingPrefix: CLIENT_SETTINGS_ADMIN_READ_SIGNING_PREFIX,
    requesterStorecodeRaw: body.requesterStorecode ?? "admin",
    requesterWalletAddressRaw: body.requesterWalletAddress,
    signatureRaw: body.signature,
    signedAtRaw: body.signedAt,
    nonceRaw: body.nonce,
    actionFields: extractClientSettingsAdminActionFields(body),
  });

  if (!authResult.ok) {
    return NextResponse.json(
      {
        result: null,
        error: authResult.error,
      },
      { status: authResult.status },
    );
  }

  const rateType = parseHistoryType(body.rateType);
  if (!rateType) {
    return NextResponse.json(
      {
        result: null,
        error: "Invalid rate history type",
      },
      { status: 400 },
    );
  }

  const result = await getClientExchangeRateHistory({
    clientId,
    rateType,
    limit: parseLimit(body.limit),
  });

  return NextResponse.json({
    result,
  });
}
