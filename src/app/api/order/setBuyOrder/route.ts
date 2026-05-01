import { NextResponse, type NextRequest } from "next/server";

import {
	insertBuyOrder,
  getBlockingBuyOrderByStorecodeAndWalletAddress,
} from '@lib/api/order';
import {
  getOneByWalletAddress,
  getUserByNickname,
} from '@lib/api/user';
import { chain } from "@/app/config/contractAddresses";
import { createBuyOrderEscrowWallet } from "@/lib/server/buy-order-escrow-wallet";
import {
  getRequestCountry,
  getRequestIp,
} from "@/lib/server/user-read-security";
import { insertPublicOrderApiCallLog } from "@/lib/api/publicOrderApiCallLog";
import {
  validateBuyOrderStoreAvailability,
  validateBuyOrderStorePaymentAmount,
} from "@/lib/server/buy-order-store-validation";

const ROUTE = "/api/order/setBuyOrder";

function normalizeText(value: unknown): string {
  if (typeof value === "string") {
    return value.trim();
  }

  if (typeof value === "number" || typeof value === "bigint") {
    return String(value).trim();
  }

  return "";
}

function normalizeWallet(value: unknown): string {
  return normalizeText(value).toLowerCase();
}

function normalizeAccountNumber(value: unknown): string {
  return normalizeText(value).replace(/[^0-9]/g, "");
}

function buyerHasSubmittedBankInfo(buyer: unknown): boolean {
  if (!buyer || typeof buyer !== "object" || Array.isArray(buyer)) {
    return false;
  }

  const buyerRecord = buyer as Record<string, unknown>;
  return Boolean(
    normalizeText(buyerRecord.depositName)
      || normalizeText(buyerRecord.depositBankName)
      || normalizeText(buyerRecord.depositBankAccountNumber)
  );
}

async function validateBuyOrderBuyerSnapshot({
  storecode,
  walletAddress,
  nickname,
  buyer,
}: {
  storecode: string;
  walletAddress: unknown;
  nickname: unknown;
  buyer: unknown;
}): Promise<{
  ok: boolean;
  status?: number;
  reason?: string;
  error?: string;
  resultMeta?: Record<string, unknown>;
}> {
  const safeStorecode = normalizeText(storecode);
  const safeWalletAddress = normalizeText(walletAddress);
  const safeNickname = normalizeText(nickname);

  if (!safeStorecode || (!safeWalletAddress && !safeNickname)) {
    return { ok: true };
  }

  const [walletUser, nicknameUser] = await Promise.all([
    safeWalletAddress
      ? getOneByWalletAddress(safeStorecode, safeWalletAddress)
      : Promise.resolve(null),
    safeNickname
      ? getUserByNickname(safeStorecode, safeNickname)
      : Promise.resolve(null),
  ]);

  if (walletUser && safeNickname && normalizeText(walletUser.nickname) !== safeNickname) {
    return {
      ok: false,
      status: 409,
      reason: "buyer_member_wallet_nickname_mismatch",
      error: "회원 아이디와 지갑 주소가 일치하지 않습니다.",
      resultMeta: {
        storecode: safeStorecode,
        requestNickname: safeNickname,
        registeredNickname: walletUser.nickname || null,
        walletAddress: safeWalletAddress,
      },
    };
  }

  if (
    nicknameUser?.walletAddress
    && safeWalletAddress
    && normalizeWallet(nicknameUser.walletAddress) !== normalizeWallet(safeWalletAddress)
  ) {
    return {
      ok: false,
      status: 409,
      reason: "buyer_member_nickname_wallet_mismatch",
      error: "회원 아이디와 지갑 주소가 일치하지 않습니다.",
      resultMeta: {
        storecode: safeStorecode,
        requestNickname: safeNickname,
        requestWalletAddress: safeWalletAddress,
        registeredWalletAddress: nicknameUser.walletAddress || null,
      },
    };
  }

  const registeredUser = nicknameUser || walletUser;
  if (!registeredUser || !buyerHasSubmittedBankInfo(buyer)) {
    return { ok: true };
  }

  const buyerRecord = buyer as Record<string, unknown>;
  const registeredBuyer = registeredUser.buyer || {};

  const requestedDepositName = normalizeText(buyerRecord.depositName);
  const registeredDepositName = normalizeText(registeredBuyer.depositName);
  if (
    requestedDepositName
    && registeredDepositName
    && requestedDepositName !== registeredDepositName
  ) {
    return {
      ok: false,
      status: 409,
      reason: "buyer_deposit_name_mismatch",
      error: "주문 입금자명이 등록된 회원 입금자명과 일치하지 않습니다.",
      resultMeta: {
        storecode: safeStorecode,
        nickname: registeredUser.nickname || safeNickname || null,
        walletAddress: registeredUser.walletAddress || safeWalletAddress || null,
        requestedDepositName,
        registeredDepositName,
      },
    };
  }

  const requestedBankName = normalizeText(buyerRecord.depositBankName);
  const registeredBankName = normalizeText(registeredBuyer.depositBankName);
  if (
    requestedBankName
    && registeredBankName
    && requestedBankName !== registeredBankName
  ) {
    return {
      ok: false,
      status: 409,
      reason: "buyer_deposit_bank_name_mismatch",
      error: "주문 입금 은행명이 등록된 회원 은행명과 일치하지 않습니다.",
      resultMeta: {
        storecode: safeStorecode,
        nickname: registeredUser.nickname || safeNickname || null,
        walletAddress: registeredUser.walletAddress || safeWalletAddress || null,
        requestedBankName,
        registeredBankName,
      },
    };
  }

  const requestedAccountNumber = normalizeAccountNumber(buyerRecord.depositBankAccountNumber);
  const registeredAccountNumber = normalizeAccountNumber(
    registeredBuyer.depositBankAccountNumber,
  );
  if (
    requestedAccountNumber
    && registeredAccountNumber
    && requestedAccountNumber !== registeredAccountNumber
  ) {
    return {
      ok: false,
      status: 409,
      reason: "buyer_deposit_bank_account_mismatch",
      error: "주문 입금 계좌번호가 등록된 회원 계좌번호와 일치하지 않습니다.",
      resultMeta: {
        storecode: safeStorecode,
        nickname: registeredUser.nickname || safeNickname || null,
        walletAddress: registeredUser.walletAddress || safeWalletAddress || null,
      },
    };
  }

  return { ok: true };
}

async function writePublicOrderApiCallLog({
  request,
  payload,
  status,
  reason = null,
  resultMeta = null,
}: {
  request: NextRequest;
  payload: Record<string, any>;
  status: "success" | "error";
  reason?: string | null;
  resultMeta?: Record<string, unknown> | null;
}) {
  const ip = getRequestIp(request);
  const country = getRequestCountry(request);

  try {
    await insertPublicOrderApiCallLog({
      route: ROUTE,
      method: request.method,
      status,
      reason,
      publicIp: ip,
      publicCountry: country,
      requestBody: payload,
      resultMeta,
    });
  } catch (error) {
    console.error("Failed to write public order api call log:", error);
  }
}

export async function POST(request: NextRequest) {
  let body: any = {};
  try {
    body = await request.json();
  } catch {
    await writePublicOrderApiCallLog({
      request,
      payload: {},
      status: "error",
      reason: "invalid_json",
    });
    return NextResponse.json({
      result: null,
      error: "Invalid JSON body",
    }, { status: 400 });
  }

  const ip = getRequestIp(request);
  const country = getRequestCountry(request);

  const {
    storecode,
    walletAddress,
    nickname,
    mobile,
    usdtAmount,
    krwAmount,
    rate,
    privateSale,
    buyer,
    paymentMethod,
    returnUrl,
    orderNumber,
  } = body;

  console.log("setBuyOrder =====  body", body);

  const storeValidation = await validateBuyOrderStoreAvailability(storecode);
  if (!storeValidation.ok) {
    await writePublicOrderApiCallLog({
      request,
      payload: body,
      status: "error",
      reason: storeValidation.reason,
      resultMeta: {
        storecode: storeValidation.storecode,
      },
    });
    return NextResponse.json({
      result: null,
      error: storeValidation.error,
    }, { status: storeValidation.status });
  }
  const resolvedStorecode = storeValidation.storecode;
  const amountValidation = validateBuyOrderStorePaymentAmount({
    store: storeValidation.store,
    krwAmountRaw: krwAmount,
  });
  if (!amountValidation.ok) {
    await writePublicOrderApiCallLog({
      request,
      payload: body,
      status: "error",
      reason: amountValidation.reason,
      resultMeta: {
        storecode: resolvedStorecode,
        walletAddress: walletAddress || null,
        maxPaymentAmountKRW: amountValidation.maxPaymentAmountKRW ?? null,
      },
    });
    return NextResponse.json({
      result: null,
      error: amountValidation.error,
    }, { status: amountValidation.status });
  }
  const normalizedKrwAmount = amountValidation.krwAmount;

  const buyerSnapshotValidation = await validateBuyOrderBuyerSnapshot({
    storecode: resolvedStorecode,
    walletAddress,
    nickname,
    buyer,
  });
  if (!buyerSnapshotValidation.ok) {
    await writePublicOrderApiCallLog({
      request,
      payload: body,
      status: "error",
      reason: buyerSnapshotValidation.reason,
      resultMeta: buyerSnapshotValidation.resultMeta || {
        storecode: resolvedStorecode,
        walletAddress: walletAddress || null,
        nickname: nickname || null,
      },
    });
    return NextResponse.json(
      {
        result: null,
        error: buyerSnapshotValidation.error || "Buyer information does not match registered member",
      },
      { status: buyerSnapshotValidation.status || 409 }
    );
  }

  const existingBuyOrder = await getBlockingBuyOrderByStorecodeAndWalletAddress({
    storecode: resolvedStorecode,
    walletAddress,
  });

  if (existingBuyOrder) {
    await writePublicOrderApiCallLog({
      request,
      payload: body,
      status: "error",
      reason: "existing_active_buy_order",
      resultMeta: {
        existingOrderId: existingBuyOrder?._id?.toString?.() || existingBuyOrder?._id || null,
        existingTradeId: existingBuyOrder?.tradeId || null,
        walletAddress: existingBuyOrder?.walletAddress || walletAddress || null,
        storecode: existingBuyOrder?.storecode || resolvedStorecode || null,
      },
    });
    return NextResponse.json({
      result: null,
      error: "Existing active buy order already exists for this member",
      existingOrder: existingBuyOrder,
    }, { status: 409 });
  }

  let escrowWallet;
  try {
    escrowWallet = await createBuyOrderEscrowWallet({
      storecode: resolvedStorecode,
    });
  } catch (error) {
    await writePublicOrderApiCallLog({
      request,
      payload: body,
      status: "error",
      reason: error instanceof Error ? error.message : "failed_to_create_buy_order_escrow_wallet",
      resultMeta: {
        walletAddress: walletAddress || null,
        storecode: resolvedStorecode || null,
      },
    });
    return NextResponse.json({
      result: null,
      error: error instanceof Error ? error.message : "Failed to create buy order escrow wallet",
    }, { status: 500 });
  }




  const result = await insertBuyOrder({
    chain: chain,
    
    //agentcode: agentcode,
    storecode: resolvedStorecode,
    
    walletAddress: walletAddress,


    nickname: nickname,
    mobile: mobile,
    usdtAmount: usdtAmount,
    krwAmount: normalizedKrwAmount,
    rate: rate,
    privateSale: privateSale,
    buyer: buyer,
    paymentMethod: paymentMethod,

    escrowWallet,

    returnUrl: returnUrl,
    orderNumber: orderNumber,
    createdByApi: ROUTE,
    createdByRequest: {
      route: ROUTE,
      method: request.method,
      publicIp: ip,
      publicCountry: country,
      requestedAt: new Date().toISOString(),
    },
  });

  ///console.log("setBuyOrder =====  result", result);

  if (!result) {
    await writePublicOrderApiCallLog({
      request,
      payload: body,
      status: "error",
      reason: "failed_to_insert_buy_order",
      resultMeta: {
        walletAddress: walletAddress || null,
        storecode: resolvedStorecode || null,
        nickname: nickname || null,
      },
    });

    return NextResponse.json({
      result: null,
      error: "Failed to insert buy order",
    }
    , { status: 500 });

  }

  await writePublicOrderApiCallLog({
    request,
    payload: body,
    status: "success",
    reason: "buy_order_created",
    resultMeta: {
      orderId: result?._id?.toString?.() || result?._id || null,
      tradeId: result?.tradeId || null,
      walletAddress: result?.walletAddress || walletAddress || null,
      storecode: resolvedStorecode || null,
      nickname: nickname || null,
    },
  });



 
  return NextResponse.json({

    result,
    
  });
  
}
