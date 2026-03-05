import { NextResponse, type NextRequest } from "next/server";

import { getStoreSettingsApiCallLogs } from "@/lib/api/storeSettingsApiCallLog";
import { verifyAdminSignedAction } from "@/lib/server/admin-action-security";

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
const STORE_SETTINGS_LOG_READ_SIGNING_PREFIX = "stable-georgia:store-settings-log-read:v1";

const getKstDateRangeByOffset = (offsetDays = 0) => {
  const now = new Date();
  const kstNow = new Date(now.getTime() + KST_OFFSET_MS);
  kstNow.setUTCDate(kstNow.getUTCDate() - offsetDays);

  const year = kstNow.getUTCFullYear();
  const month = kstNow.getUTCMonth();
  const date = kstNow.getUTCDate();

  const start = new Date(Date.UTC(year, month, date, 0, 0, 0, 0) - KST_OFFSET_MS);
  const end = new Date(Date.UTC(year, month, date, 23, 59, 59, 999) - KST_OFFSET_MS);

  return { start, end };
};

const resolveRange = (range: string) => {
  if (range === "yesterday") {
    return getKstDateRangeByOffset(1);
  }
  if (range === "dayBeforeYesterday") {
    return getKstDateRangeByOffset(2);
  }
  if (range === "all") {
    return { start: undefined, end: undefined };
  }
  return getKstDateRangeByOffset(0);
};

export async function POST(request: NextRequest) {
  let body: any = {};
  try {
    body = await request.json();
  } catch (error) {
    body = {};
  }

  const range = String(body?.range || "today").trim();
  const route = String(body?.route || "").trim();
  const status = String(body?.status || "").trim();
  const search = String(body?.search || "").trim();
  const limit = Number(body?.limit || 1000);

  const actionFields = {
    range,
    route,
    status,
    search,
    limit,
  };

  const signed = await verifyAdminSignedAction({
    request,
    route: "/api/storeSettingsLog/getLogs",
    signingPrefix: STORE_SETTINGS_LOG_READ_SIGNING_PREFIX,
    requesterStorecodeRaw: body?.requesterStorecode ?? "admin",
    requesterWalletAddressRaw: body?.requesterWalletAddress ?? body?.walletAddress,
    signatureRaw: body?.signature,
    signedAtRaw: body?.signedAt,
    nonceRaw: body?.nonce,
    actionFields,
  });

  if (!signed.ok) {
    return NextResponse.json(
      {
        result: null,
        error: signed.error,
      },
      { status: signed.status },
    );
  }

  const { start, end } = resolveRange(range);

  const result = await getStoreSettingsApiCallLogs({
    fromDate: start,
    toDate: end,
    route,
    status,
    search,
    limit,
  });

  return NextResponse.json({
    result,
  });
}
