import { NextResponse, type NextRequest } from "next/server";

import { updateClientExchangeRateSell } from "@lib/api/client";
import { parseClientExchangeRateMap } from "@/lib/client-settings";
import { verifyAdminSignedAction } from "@/lib/server/admin-action-security";
import {
  CLIENT_SETTINGS_ADMIN_MUTATION_SIGNING_PREFIX,
  CLIENT_SETTINGS_UPDATE_SELL_RATE_ROUTE,
  extractClientSettingsAdminActionFields,
  isPlainObject,
} from "@/lib/security/client-settings-admin";

const clientId = process.env.NEXT_PUBLIC_TEMPLATE_CLIENT_ID || "";
const MAX_EXCHANGE_RATE = 10_000_000;

const isValidExchangeRateMap = (value: unknown) => {
  const parsed = parseClientExchangeRateMap(value);
  if (!parsed) {
    return null;
  }

  const values = Object.values(parsed);
  if (values.some((item) => item < 0 || item > MAX_EXCHANGE_RATE)) {
    return null;
  }

  return parsed;
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
    route: CLIENT_SETTINGS_UPDATE_SELL_RATE_ROUTE,
    signingPrefix: CLIENT_SETTINGS_ADMIN_MUTATION_SIGNING_PREFIX,
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

  const exchangeRateUSDTSell = isValidExchangeRateMap(body.exchangeRateUSDTSell);

  if (!exchangeRateUSDTSell) {
    return NextResponse.json(
      {
        result: null,
        error: "Invalid sell exchange rates",
      },
      { status: 400 },
    );
  }

  const result = await updateClientExchangeRateSell(clientId, exchangeRateUSDTSell);

  return NextResponse.json({
    result,
  });
}
