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

const ROUTE = "/api/order/setBuyOrder";

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

  const existingBuyOrder = await getBlockingBuyOrderByStorecodeAndWalletAddress({
    storecode,
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
        storecode: existingBuyOrder?.storecode || storecode || null,
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
      storecode,
    });
  } catch (error) {
    await writePublicOrderApiCallLog({
      request,
      payload: body,
      status: "error",
      reason: error instanceof Error ? error.message : "failed_to_create_buy_order_escrow_wallet",
      resultMeta: {
        walletAddress: walletAddress || null,
        storecode: storecode || null,
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
    storecode: storecode,
    
    walletAddress: walletAddress,


    nickname: nickname,
    mobile: mobile,
    usdtAmount: usdtAmount,
    krwAmount: krwAmount,
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
        storecode: storecode || null,
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
      storecode: storecode || null,
      nickname: nickname || null,
    },
  });



 
  return NextResponse.json({

    result,
    
  });
  
}
