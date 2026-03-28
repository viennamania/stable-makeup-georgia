import { NextResponse, type NextRequest } from "next/server";

import { getOneAdminWalletUserByWalletAddress } from "@lib/api/user";
import { getAdminApiCallLogs } from "@/lib/api/adminApiCallLog";
import { normalizeWalletAddress } from "@/lib/server/user-read-security";

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

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

  const requesterWalletAddress = normalizeWalletAddress(body?.requesterWalletAddress);
  if (!requesterWalletAddress) {
    return NextResponse.json(
      {
        result: null,
        error: "requesterWalletAddress is required",
      },
      { status: 401 },
    );
  }

  const requesterUser = await getOneAdminWalletUserByWalletAddress(requesterWalletAddress);
  const requesterStorecode = String(requesterUser?.storecode || "").trim().toLowerCase();
  const requesterRole = String(requesterUser?.role || "").trim().toLowerCase();

  if (requesterStorecode !== "admin" || requesterRole !== "admin") {
    return NextResponse.json(
      {
        result: null,
        error: "Forbidden",
      },
      { status: 403 },
    );
  }

  const range = String(body?.range || "today").trim();
  const route = String(body?.route || "").trim();
  const status = String(body?.status || "").trim();
  const guardType = String(body?.guardType || "").trim();
  const search = String(body?.search || "").trim();
  const limit = Number(body?.limit || 1000);

  const { start, end } = resolveRange(range);

  const result = await getAdminApiCallLogs({
    fromDate: start,
    toDate: end,
    route,
    status,
    guardType,
    search,
    limit,
  });

  return NextResponse.json({
    result,
  });
}
