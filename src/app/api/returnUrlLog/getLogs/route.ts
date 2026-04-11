import { NextResponse, type NextRequest } from "next/server";

import { getReturnUrlLogs } from "@/lib/api/returnUrlLog";
import { verifyAdminSignedAction } from "@/lib/server/admin-action-security";

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
const RETURN_URL_LOG_READ_SIGNING_PREFIX = "stable-georgia:return-url-log-read:v1";

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
  } catch {
    body = {};
  }

  const range = String(body?.range || "today").trim();
  const status = String(body?.status || "").trim();
  const storecode = String(body?.storecode || "").trim();
  const callbackKind = String(body?.callbackKind || "").trim();
  const search = String(body?.search || "").trim();
  const limit = Number(body?.limit || 1000);

  const actionFields = {
    range,
    status,
    storecode,
    callbackKind,
    search,
    limit,
  };

  const signed = await verifyAdminSignedAction({
    request,
    route: "/api/returnUrlLog/getLogs",
    signingPrefix: RETURN_URL_LOG_READ_SIGNING_PREFIX,
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
  const result = await getReturnUrlLogs({
    fromDate: start,
    toDate: end,
    status,
    storecode,
    callbackKind,
    search,
    limit,
  });

  return NextResponse.json({
    result,
  });
}
