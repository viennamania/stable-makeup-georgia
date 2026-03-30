import { NextResponse, type NextRequest } from "next/server";

import { getAdminP2PTradeHistory } from "@lib/api/order";
import { verifyCenterStoreAdminGuard } from "@/lib/server/center-store-admin-guard";

export const runtime = "nodejs";
export const preferredRegion = "icn1";

const normalizeStorecode = (value: unknown) => {
  if (typeof value !== "string") {
    return "";
  }
  return value.trim();
};

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
    defaultAccountNumber: maskAccountNumber(input.defaultAccountNumber),
  };
};

const sanitizeActionActorForPublic = (actor: unknown) => {
  if (!actor || typeof actor !== "object" || Array.isArray(actor)) {
    return actor;
  }

  const input = actor as Record<string, unknown>;
  return {
    ...input,
    walletAddress: maskWalletLikeValue(input.walletAddress),
    nickname: maskName(input.nickname),
    publicIp: null,
  };
};

const sanitizeSettlementInfoForPublic = (settlement: unknown) => {
  if (!settlement || typeof settlement !== "object" || Array.isArray(settlement)) {
    return settlement;
  }

  const input = settlement as Record<string, unknown>;
  return {
    ...input,
    settlementWalletAddress: maskWalletLikeValue(input.settlementWalletAddress),
    feeWalletAddress: maskWalletLikeValue(input.feeWalletAddress),
    agentFeeWalletAddress: maskWalletLikeValue(input.agentFeeWalletAddress),
  };
};

const sanitizeEscrowWalletForPublic = (escrowWallet: unknown) => {
  if (!escrowWallet || typeof escrowWallet !== "object" || Array.isArray(escrowWallet)) {
    return escrowWallet;
  }

  const input = escrowWallet as Record<string, unknown>;
  return {
    ...input,
    transactionHash: maskWalletLikeValue(input.transactionHash),
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
    paymentConfirmedBy: sanitizeActionActorForPublic(input.paymentConfirmedBy),
    paymentConfirmedByName: maskName(input.paymentConfirmedByName),
    paymentConfirmedByWalletAddress: maskWalletLikeValue(input.paymentConfirmedByWalletAddress),
    confirmedBy: sanitizeActionActorForPublic(input.confirmedBy),
    confirmedByName: maskName(input.confirmedByName),
    confirmedByWalletAddress: maskWalletLikeValue(input.confirmedByWalletAddress),
    processedBy: sanitizeActionActorForPublic(input.processedBy),
    processedByName: maskName(input.processedByName),
    processedByWalletAddress: maskWalletLikeValue(input.processedByWalletAddress),
    cancelledBy: sanitizeActionActorForPublic(input.cancelledBy),
    cancelledByAdmin: sanitizeActionActorForPublic(input.cancelledByAdmin),
    cancelledByName: maskName(input.cancelledByName),
    cancelledByWalletAddress: maskWalletLikeValue(input.cancelledByWalletAddress),
    settlement: sanitizeSettlementInfoForPublic(input.settlement),
    escrowWallet: sanitizeEscrowWalletForPublic(input.escrowWallet),
    buyer: buyer
      ? {
          ...buyer,
          nickname: maskName(buyer.nickname),
          walletAddress: maskWalletLikeValue(buyer.walletAddress),
          depositName: maskName(buyer.depositName),
          depositBankAccountNumber: maskAccountNumber(buyer.depositBankAccountNumber),
          bankInfo: sanitizeBankInfoForPublic(buyer.bankInfo),
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

const sanitizeTradeHistoryResultForPublic = (result: Record<string, unknown>) => {
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

  const requestedStorecode = normalizeStorecode(body.storecode);
  const requesterStorecode = normalizeStorecode(body.requesterStorecode);
  const guardStorecode = requesterStorecode || requestedStorecode || "admin";
  const authIntent = hasCenterStoreAuthIntent(body);
  let privilegedRead = false;
  let effectiveStorecode = requestedStorecode;

  if (authIntent) {
    const guard = await verifyCenterStoreAdminGuard({
      request,
      route: "/api/order/getAdminP2PTradeHistory",
      body,
      storecodeRaw: guardStorecode,
      requesterWalletAddressRaw: body.requesterWalletAddress ?? body.walletAddress,
    });

    privilegedRead = guard.ok;

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

  const normalizedFromDate = normalizeString(body.fromDate);
  const normalizedToDate = normalizeString(body.toDate);
  const result = await getAdminP2PTradeHistory({
    storecode: effectiveStorecode,
    limit: parsePositiveInt(body.limit, 30),
    page: parsePositiveInt(body.page, 1),
    fromDate: normalizedFromDate,
    toDate: normalizedToDate,
    searchKeyword: normalizeString(body.searchKeyword),
    searchTradeId: normalizeString(body.searchTradeId),
    searchStoreName: normalizeString(body.searchStoreName),
    searchBuyer: normalizeString(body.searchBuyer),
    searchSeller: normalizeString(body.searchSeller),
    searchDepositName: normalizeString(body.searchDepositName),
    searchBuyerBankAccountNumber: normalizeString(body.searchBuyerBankAccountNumber),
    searchSellerBankAccountNumber: normalizeString(body.searchSellerBankAccountNumber),
    userType: normalizeString(body.userType),
  });

  return NextResponse.json({
    result: privilegedRead
      ? {
          ...result,
          view: "privileged",
        }
      : sanitizeTradeHistoryResultForPublic(result),
  });
}
