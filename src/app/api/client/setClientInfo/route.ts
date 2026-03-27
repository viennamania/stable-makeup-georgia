import { NextResponse, type NextRequest } from "next/server";

import { upsertOne } from "@lib/api/client";
import { verifyAdminSignedAction } from "@/lib/server/admin-action-security";
import {
  CLIENT_SETTINGS_ADMIN_MUTATION_SIGNING_PREFIX,
  CLIENT_SETTINGS_SET_INFO_ROUTE,
  extractClientSettingsAdminActionFields,
  isPlainObject,
} from "@/lib/security/client-settings-admin";

const clientId = process.env.NEXT_PUBLIC_TEMPLATE_CLIENT_ID || "";
const MAX_CLIENT_NAME_LENGTH = 120;
const MAX_CLIENT_DESCRIPTION_LENGTH = 2000;
const MAX_EXCHANGE_RATE = 10_000_000;
const EXCHANGE_RATE_KEYS = ["USD", "KRW", "JPY", "CNY", "EUR"] as const;

type ExchangeRateKey = (typeof EXCHANGE_RATE_KEYS)[number];
type ExchangeRateMap = Record<ExchangeRateKey, number>;

const normalizeString = (value: unknown): string => {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
};

const coerceExchangeRateValue = (value: unknown): number | null => {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) {
      return 0;
    }

    if (!/^\d+(\.\d+)?$/.test(trimmed)) {
      return null;
    }

    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
};

const parseExchangeRateMap = (value: unknown): ExchangeRateMap | null => {
  if (!isPlainObject(value)) {
    return null;
  }

  const next = {} as ExchangeRateMap;

  for (const key of EXCHANGE_RATE_KEYS) {
    const parsed = coerceExchangeRateValue(value[key]);
    if (parsed == null || parsed < 0 || parsed > MAX_EXCHANGE_RATE) {
      return null;
    }
    next[key] = parsed;
  }

  return next;
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
    route: CLIENT_SETTINGS_SET_INFO_ROUTE,
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

  const name = normalizeString(body.name);
  const description = normalizeString(body.description);
  const exchangeRateUSDT = parseExchangeRateMap(body.exchangeRateUSDT);
  const exchangeRateUSDTSell = parseExchangeRateMap(body.exchangeRateUSDTSell);

  if (!name || name.length > MAX_CLIENT_NAME_LENGTH) {
    return NextResponse.json(
      {
        result: null,
        error: "Invalid client name",
      },
      { status: 400 },
    );
  }

  if (description.length > MAX_CLIENT_DESCRIPTION_LENGTH) {
    return NextResponse.json(
      {
        result: null,
        error: "Invalid client description",
      },
      { status: 400 },
    );
  }

  if (!exchangeRateUSDT || !exchangeRateUSDTSell) {
    return NextResponse.json(
      {
        result: null,
        error: "Invalid exchange rates",
      },
      { status: 400 },
    );
  }

  const result = await upsertOne(clientId, {
    name,
    description,
    exchangeRateUSDT,
    exchangeRateUSDTSell,
  });

  return NextResponse.json({
    result,
  });
}
