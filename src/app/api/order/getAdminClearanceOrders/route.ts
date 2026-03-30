import { NextResponse, type NextRequest } from "next/server";

import { getAdminClearanceOrders } from "@lib/api/order";
import { verifyCenterStoreAdminGuard } from "@/lib/server/center-store-admin-guard";

const normalizeString = (value: unknown) => {
  if (typeof value !== "string") {
    return "";
  }
  return value.trim();
};

const parsePositiveInt = (value: unknown, fallback: number) => {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return Math.trunc(value);
  }

  const parsed = Number.parseInt(String(value ?? "").trim(), 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
};

const normalizeBoolean = (value: unknown): boolean => {
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    return normalized === "true" || normalized === "1" || normalized === "yes";
  }
  if (typeof value === "number") {
    return value === 1;
  }
  return false;
};

const hasCenterStoreAuthIntent = (body: Record<string, unknown>) => {
  return Boolean(
    normalizeString(body.signature)
    || normalizeString(body.signedAt)
    || normalizeString(body.nonce)
    || normalizeString(body.requesterWalletAddress)
    || normalizeString(body.walletAddress),
  );
};

const maskName = (value: unknown) => {
  const safe = normalizeString(value);
  if (!safe) {
    return "";
  }

  const chars = Array.from(safe);
  if (chars.length === 1) {
    return "*";
  }
  if (chars.length === 2) {
    return `${chars[0]}*`;
  }

  return `${chars[0]}${"*".repeat(Math.max(1, chars.length - 2))}${chars[chars.length - 1]}`;
};

const maskWalletLikeValue = (value: unknown) => {
  const safe = normalizeString(value);
  if (!safe) {
    return "";
  }
  if (safe.length <= 12) {
    return safe;
  }
  return `${safe.slice(0, 6)}...${safe.slice(-4)}`;
};

const maskAccountNumber = (value: unknown) => {
  const safe = normalizeString(value).replace(/\s+/g, "");
  if (!safe) {
    return "";
  }
  if (safe.length <= 4) {
    return "*".repeat(safe.length);
  }
  return `${"*".repeat(Math.max(0, safe.length - 4))}${safe.slice(-4)}`;
};

const sanitizeBankInfoForPublic = (bankInfo: unknown) => {
  if (!bankInfo || typeof bankInfo !== "object" || Array.isArray(bankInfo)) {
    return bankInfo;
  }

  const input = bankInfo as Record<string, unknown>;
  return {
    ...input,
    accountHolder: maskName(input.accountHolder),
    accountNumber: maskAccountNumber(input.accountNumber),
    realAccountNumber: maskAccountNumber(input.realAccountNumber),
  };
};

const sanitizeActorForPublic = (actor: unknown) => {
  if (!actor || typeof actor !== "object" || Array.isArray(actor)) {
    return actor;
  }

  const input = actor as Record<string, unknown>;
  return {
    ...input,
    walletAddress: maskWalletLikeValue(input.walletAddress),
    nickname: maskName(input.nickname),
  };
};

const sanitizeCreatedByForPublic = (createdBy: unknown) => {
  if (!createdBy || typeof createdBy !== "object" || Array.isArray(createdBy)) {
    return createdBy;
  }

  const input = createdBy as Record<string, unknown>;
  return {
    walletAddress: maskWalletLikeValue(input.walletAddress),
    nickname: maskName(input.nickname),
    role: normalizeString(input.role) || null,
    storecode: normalizeString(input.storecode) || null,
    requestedAt: normalizeString(input.requestedAt) || null,
    route: normalizeString(input.route) || null,
    source: normalizeString(input.source) || null,
    transactionHashDummyReason: normalizeString(input.transactionHashDummyReason) || null,
  };
};

const sanitizeOrderForPublic = (order: unknown) => {
  if (!order || typeof order !== "object" || Array.isArray(order)) {
    return order;
  }

  const input = order as Record<string, unknown>;
  const buyer =
    input.buyer && typeof input.buyer === "object" && !Array.isArray(input.buyer)
      ? (input.buyer as Record<string, unknown>)
      : null;
  const seller =
    input.seller && typeof input.seller === "object" && !Array.isArray(input.seller)
      ? (input.seller as Record<string, unknown>)
      : null;
  const store =
    input.store && typeof input.store === "object" && !Array.isArray(input.store)
      ? (input.store as Record<string, unknown>)
      : null;

  return {
    ...input,
    nickname: maskName(input.nickname),
    walletAddress: maskWalletLikeValue(input.walletAddress),
    createdBy: sanitizeCreatedByForPublic(input.createdBy),
    cancelledBy: sanitizeActorForPublic(input.cancelledBy),
    cancelledByAdmin: sanitizeActorForPublic(input.cancelledByAdmin),
    cancelledByName: maskName(input.cancelledByName),
    cancelledByWalletAddress: maskWalletLikeValue(input.cancelledByWalletAddress),
    buyer: buyer
      ? {
          ...buyer,
          nickname: maskName(buyer.nickname),
          depositName: maskName(buyer.depositName),
          walletAddress: maskWalletLikeValue(buyer.walletAddress),
          depositBankAccountNumber: maskAccountNumber(buyer.depositBankAccountNumber),
          bankInfo: sanitizeBankInfoForPublic(buyer.bankInfo),
          depositCompletedBy: sanitizeActorForPublic(buyer.depositCompletedBy),
        }
      : input.buyer,
    seller: seller
      ? {
          ...seller,
          nickname: maskName(seller.nickname),
          walletAddress: maskWalletLikeValue(seller.walletAddress),
          signerAddress: maskWalletLikeValue(seller.signerAddress),
          bankInfo: sanitizeBankInfoForPublic(seller.bankInfo),
        }
      : input.seller,
    store: store
      ? {
          ...store,
          bankInfo: sanitizeBankInfoForPublic(store.bankInfo),
          bankInfoAAA: sanitizeBankInfoForPublic(store.bankInfoAAA),
          bankInfoBBB: sanitizeBankInfoForPublic(store.bankInfoBBB),
          bankInfoCCC: sanitizeBankInfoForPublic(store.bankInfoCCC),
          bankInfoDDD: sanitizeBankInfoForPublic(store.bankInfoDDD),
        }
      : input.store,
  };
};

const sanitizeClearanceResultForPublic = (result: Record<string, unknown>) => {
  return {
    ...result,
    view: "public",
    orders: Array.isArray(result.orders)
      ? result.orders.map((order) => sanitizeOrderForPublic(order))
      : [],
  };
};

export async function POST(request: NextRequest) {
  let body: Record<string, unknown> = {};
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    body = {};
  }

  const requestedStorecode = normalizeString(body.storecode);
  const requesterStorecode = normalizeString(body.requesterStorecode);
  const guardStorecode = requesterStorecode || requestedStorecode || "admin";
  const authIntent = hasCenterStoreAuthIntent(body);
  let privilegedRead = false;
  let effectiveStorecode = requestedStorecode;
  let authStatus = 0;
  let authError = "";

  if (authIntent) {
    const guard = await verifyCenterStoreAdminGuard({
      request,
      route: "/api/order/getAdminClearanceOrders",
      body,
      storecodeRaw: guardStorecode,
      requesterWalletAddressRaw: body.requesterWalletAddress ?? body.walletAddress,
    });
    privilegedRead = guard.ok;
    if (!guard.ok) {
      authStatus = guard.status;
      authError = guard.error;
    }

    if (guard.ok) {
      const requesterScopeStorecode = requesterStorecode || guardStorecode;
      const requestedDiffersFromRequesterScope = Boolean(
        requestedStorecode
          && requesterScopeStorecode
          && requestedStorecode.toLowerCase() !== requesterScopeStorecode.toLowerCase(),
      );

      if (!guard.requesterIsAdmin && requestedDiffersFromRequesterScope) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      effectiveStorecode = guard.requesterIsAdmin
        ? requestedStorecode
        : guardStorecode;
    }
  }

  const result = await getAdminClearanceOrders({
    storecode: effectiveStorecode,
    limit: parsePositiveInt(body.limit, 30),
    page: parsePositiveInt(body.page, 1),
    walletAddress: privilegedRead ? normalizeString(body.walletAddress) : "",
    searchMyOrders: privilegedRead ? normalizeBoolean(body.searchMyOrders) : false,
    fromDate: normalizeString(body.fromDate),
    toDate: normalizeString(body.toDate),
  });

  return NextResponse.json({
    result: privilegedRead
      ? {
          ...result,
          view: "privileged",
          authIntent,
          authStatus: 0,
          authError: "",
          authRecoverySuggested: false,
        }
      : {
          ...sanitizeClearanceResultForPublic(result),
          authIntent,
          authStatus,
          authError,
          authRecoverySuggested: authIntent && authStatus !== 0 && authStatus !== 403,
        },
  });
}
