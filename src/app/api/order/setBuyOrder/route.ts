import { NextResponse, type NextRequest } from "next/server";

import {
	insertBuyOrder,
  getBlockingBuyOrderByStorecodeAndWalletAddress,
} from '@lib/api/order';
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
import { runBuyOrderAutomationAfterCreate } from "@/lib/server/buy-order-automation";

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

const IP_HEADER_FALLBACK_ORDER = [
  "cf-connecting-ip",
  "true-client-ip",
  "x-real-ip",
  "x-client-ip",
] as const;

function getRequestHeaderValue(request: NextRequest, headerName: string): string {
  return normalizeText(request.headers.get(headerName));
}

function getFirstForwardedIp(request: NextRequest): string {
  const forwardedFor = getRequestHeaderValue(request, "x-forwarded-for");
  return forwardedFor.split(",")[0]?.trim() || "";
}

function buildIpHeaderSnapshot(request: NextRequest): Record<string, string | null> {
  return {
    "x-forwarded-for": getRequestHeaderValue(request, "x-forwarded-for") || null,
    "cf-connecting-ip": getRequestHeaderValue(request, "cf-connecting-ip") || null,
    "true-client-ip": getRequestHeaderValue(request, "true-client-ip") || null,
    "x-real-ip": getRequestHeaderValue(request, "x-real-ip") || null,
    "x-client-ip": getRequestHeaderValue(request, "x-client-ip") || null,
  };
}

function resolveBuyOrderPublicIp(
  payload: Record<string, any>,
  request: NextRequest,
): {
  publicIp: string;
  source: string;
  headers: Record<string, string | null>;
} {
  const bodyClientPublicIp = normalizeText(payload?.clientPublicIp);
  if (bodyClientPublicIp) {
    return {
      publicIp: bodyClientPublicIp,
      source: "body.clientPublicIp",
      headers: buildIpHeaderSnapshot(request),
    };
  }

  const bodyPublicIp = normalizeText(payload?.publicIp);
  if (bodyPublicIp) {
    return {
      publicIp: bodyPublicIp,
      source: "body.publicIp",
      headers: buildIpHeaderSnapshot(request),
    };
  }

  const forwardedIp = getFirstForwardedIp(request);
  if (forwardedIp) {
    return {
      publicIp: forwardedIp,
      source: "headers.x-forwarded-for",
      headers: buildIpHeaderSnapshot(request),
    };
  }

  for (const headerName of IP_HEADER_FALLBACK_ORDER) {
    const headerIp = getRequestHeaderValue(request, headerName);
    if (headerIp) {
      return {
        publicIp: headerIp,
        source: `headers.${headerName}`,
        headers: buildIpHeaderSnapshot(request),
      };
    }
  }

  return {
    publicIp: "",
    source: "unavailable",
    headers: buildIpHeaderSnapshot(request),
  };
}

function hasProvidedRequestMeta(value: unknown): boolean {
  if (value === null || value === undefined) {
    return false;
  }

  if (typeof value === "string") {
    return value.trim().length > 0;
  }

  return true;
}

function resolveBuyOrderRequestMeta({
  payload,
  request,
  resolvedPublicIp,
  publicCountry,
}: {
  payload: Record<string, any>;
  request: NextRequest;
  resolvedPublicIp: ReturnType<typeof resolveBuyOrderPublicIp>;
  publicCountry: string;
}) {
  if (hasProvidedRequestMeta(payload?.requestMeta)) {
    return payload.requestMeta;
  }

  return {
    source: "headers",
    route: ROUTE,
    method: request.method,
    ipSource: resolvedPublicIp.source,
    publicIp: resolvedPublicIp.publicIp || null,
    clientPublicIp: resolvedPublicIp.publicIp || null,
    publicCountry: publicCountry || null,
    headers: resolvedPublicIp.headers,
    userAgent: getRequestHeaderValue(request, "user-agent") || null,
  };
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
  const resolvedPublicIp = resolveBuyOrderPublicIp(body, request);
  const orderPublicIp = resolvedPublicIp.publicIp || null;
  const orderRequestMeta = resolveBuyOrderRequestMeta({
    payload: body,
    request,
    resolvedPublicIp,
    publicCountry: country,
  });

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
    publicIp: orderPublicIp,
    clientPublicIp: orderPublicIp,
    requestMeta: orderRequestMeta,
    createdByApi: ROUTE,
    createdByRequest: {
      route: ROUTE,
      method: request.method,
      publicIp: orderPublicIp || ip,
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

  await runBuyOrderAutomationAfterCreate({
    orderId: result?._id?.toString?.() || result?._id,
    source: ROUTE,
  });



 
  return NextResponse.json({

    result,
    
  });
  
}
