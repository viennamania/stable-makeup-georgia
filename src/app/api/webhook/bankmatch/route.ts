import { NextResponse, type NextRequest } from "next/server";
import {
  getOneBuyOrderByTradeId,
  buyOrderConfirmPayment,
} from "@lib/api/order";
import { insertWebhookLog } from "@lib/api/webhookLog";


// webhook
// header
/*

Content-Type
application/json
x-webhook-key
your-webhook-key
(대시보드 > API설정 > 웹훅키에서 확인 가능)
x-mall-id
your-mall-id
(대시보드 > API설정 > 상점ID에서 확인 가능)
x-trace-id
트랜잭션 고유 ID
*/
// body
/*
{
    "order_number": "1234567890"
    "order_status": "매칭완료",
    "processing_date": "2023-07-26T11:31:00+09:00"
}
*/

// response body

/*
유형
상태코드
결과값
Response Body
200
{ "status": "success" }
 */


/*
{
  order_number: '11787973',
  order_status: '매칭완료',
  processing_date: '2025-09-15T02:47:58.306+09:00',
  agent_id: 3,
  agent_name: '원클릭',
  account_number: '22105556021573',
  amount: '1,000,000'
}
  */


function toNullableString(value: unknown): string | null {
  const normalized = String(value || "").trim();
  return normalized ? normalized : null;
}

export async function POST(request: NextRequest) {
  const webhookKey = request.headers.get("x-webhook-key");
  const mallId = request.headers.get("x-mall-id");
  const traceId = request.headers.get("x-trace-id");
  const headersPayload = {
    "x-webhook-key": webhookKey,
    "x-mall-id": mallId,
    "x-trace-id": traceId,
  };

  console.log("payaction webhookKey", webhookKey);
  console.log("payaction mallId", mallId);
  console.log("payaction traceId", traceId);

  let body: any = null;
  let order_number: any = null;
  let order_status: any = null;
  let processing_date: any = null;

  const logAndRespond = async ({
    responseBody,
    stage,
    statusCode = 200,
    details = {},
    error = null,
  }: {
    responseBody: Record<string, any>;
    stage: string;
    statusCode?: number;
    details?: Record<string, unknown>;
    error?: any;
  }) => {
    try {
      await insertWebhookLog({
        event: "bankmatch_webhook",
        headers: headersPayload,
        body: {
          stage,
          traceId: traceId || null,
          mallId: mallId || null,
          orderNumber: toNullableString(order_number),
          orderStatus: toNullableString(order_status),
          processingDate: toNullableString(processing_date),
          responseStatus: toNullableString(responseBody?.status),
          responseMessage: toNullableString(responseBody?.message),
          ...details,
        },
        error,
        createdAt: new Date(),
      });
    } catch (logError) {
      console.error("Failed to insert bankmatch webhook log:", logError);
    }

    return NextResponse.json(responseBody, { status: statusCode });
  };

  try {
    body = await request.json();
  } catch (parseError) {
    return logAndRespond({
      responseBody: {
        status: "error",
        message: "Invalid JSON body",
      },
      statusCode: 400,
      stage: "parse_request_body",
      details: {
        reasonCode: "INVALID_JSON_BODY",
      },
      error: parseError,
    });
  }

  console.log("payaction body", body);

  if (!body) {
    return logAndRespond({
      responseBody: {
        status: "error",
        message: "body is empty",
      },
      stage: "validate_body",
      details: {
        reasonCode: "EMPTY_BODY",
      },
    });
  }

  ({
    order_number,
    order_status,
    processing_date,
  } = body);

  console.log("payaction order_number", order_number);
  console.log("payaction order_status", order_status);
  console.log("payaction processing_date", processing_date);

  if (!order_number) {
    return logAndRespond({
      responseBody: {
        status: "false",
      },
      stage: "validate_order_number",
      details: {
        reasonCode: "MISSING_ORDER_NUMBER",
      },
    });
  }

  if (order_status !== "매칭완료") {
    return logAndRespond({
      responseBody: {
        status: "false",
      },
      stage: "validate_order_status",
      details: {
        reasonCode: "ORDER_STATUS_NOT_MATCHED",
      },
    });
  }

  try {
    const buyOrder = await getOneBuyOrderByTradeId({
      tradeId: order_number,
    });

    if (!buyOrder) {
      console.log("buyOrder is empty");
      return logAndRespond({
        responseBody: {
          status: "error",
          message: "buyOrder is empty",
        },
        stage: "find_buyorder",
        details: {
          reasonCode: "BUYORDER_NOT_FOUND",
          tradeId: toNullableString(order_number),
        },
      });
    }

    if (buyOrder?.status !== "paymentRequested") {
      console.log("buyOrder status is not paymentRequested");
      return logAndRespond({
        responseBody: {
          status: "false",
        },
        stage: "validate_buyorder_status",
        details: {
          reasonCode: "BUYORDER_STATUS_NOT_PAYMENT_REQUESTED",
          buyOrderStatus: toNullableString(buyOrder?.status),
          tradeId: toNullableString(order_number),
          buyOrderId: toNullableString(buyOrder?._id),
        },
      });
    }

    const storecode = buyOrder?.storecode;
    const orderId = buyOrder?._id;
    const paymentAmount = buyOrder?.krwAmount;
    const queueId = null;
    const transactionHash = "0x";
    const buyerDepositName = buyOrder?.buyer?.depositName || "익명";
    const buyerNickname = buyOrder?.nickname || "익명";

    const confirmResponse = await buyOrderConfirmPayment({
      lang: "ko",
      storecode: storecode,
      orderId: orderId,
      paymentAmount: paymentAmount,
      queueId: queueId,
      transactionHash: transactionHash,
      autoConfirmPayment: true,
    });

    return logAndRespond({
      responseBody: {
        status: "success",
      },
      stage: "buyorder_confirm_payment",
      details: {
        tradeId: toNullableString(order_number),
        buyOrderId: toNullableString(orderId),
        storecode: toNullableString(storecode),
        paymentAmount: paymentAmount ?? null,
        buyerDepositName: toNullableString(buyerDepositName),
        buyerNickname: toNullableString(buyerNickname),
        confirmStatus: toNullableString((confirmResponse as any)?.status),
        confirmMessage: toNullableString((confirmResponse as any)?.message),
      },
    });
  } catch (runtimeError) {
    console.error("bankmatch webhook failed:", runtimeError);
    return logAndRespond({
      responseBody: {
        status: "error",
        message: "bankmatch webhook failed",
      },
      statusCode: 500,
      stage: "runtime_error",
      details: {
        reasonCode: "BANKMATCH_RUNTIME_ERROR",
      },
      error: runtimeError,
    });
  }
}
