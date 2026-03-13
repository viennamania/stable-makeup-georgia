import { NextResponse, type NextRequest } from "next/server";

import { getBankTransfers, matchBankTransfersBybankTransferId } from "@lib/api/bankTransfer";
import { buyOrderConfirmPayment, buyOrderGetOrderById, type OrderProps } from "@lib/api/order";
import { client } from "@/app/client";
import {
  chain,
  ethereumContractAddressUSDT,
  polygonContractAddressUSDT,
  arbitrumContractAddressUSDT,
  bscContractAddressUSDT,
} from "@/app/config/contractAddresses";
import { readRealtimeBuyorderAdminSession } from "@/lib/server/realtime-buyorder-admin-session";
import { getContract } from "thirdweb";
import { arbitrum, bsc, ethereum, polygon } from "thirdweb/chains";
import { balanceOf } from "thirdweb/extensions/erc20";

export const runtime = "nodejs";

const contract = getContract({
  client,
  chain:
    chain === "ethereum" ? ethereum :
    chain === "polygon" ? polygon :
    chain === "arbitrum" ? arbitrum :
    chain === "bsc" ? bsc :
    arbitrum,
  address:
    chain === "ethereum" ? ethereumContractAddressUSDT :
    chain === "polygon" ? polygonContractAddressUSDT :
    chain === "arbitrum" ? arbitrumContractAddressUSDT :
    chain === "bsc" ? bscContractAddressUSDT :
    arbitrumContractAddressUSDT,
});

function getKstDateKey(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) {
    return null;
  }

  const shifted = new Date(timestamp + 9 * 60 * 60 * 1000);
  const year = shifted.getUTCFullYear();
  const month = String(shifted.getUTCMonth() + 1).padStart(2, "0");
  const day = String(shifted.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function toOrderStatusPayload(order: OrderProps | null) {
  return {
    currentStatus: order?.status ? String(order.status) : null,
    tradeId: order?.tradeId ? String(order.tradeId) : null,
  };
}

async function getSellerWalletAddressBalance(order: OrderProps): Promise<number> {
  const sellerWalletAddress = String(order?.seller?.walletAddress || "").trim();
  if (!sellerWalletAddress) {
    return 0;
  }

  try {
    const sellerBalance = await balanceOf({
      contract,
      address: sellerWalletAddress,
    });

    if (chain === "bsc") {
      return Number(sellerBalance) / 10 ** 18;
    }

    return Number(sellerBalance) / 10 ** 6;
  } catch (error) {
    console.error("Failed to fetch seller wallet balance for realtime manual confirm:", error);
    return 0;
  }
}

export async function POST(request: NextRequest) {
  const session = readRealtimeBuyorderAdminSession(request);
  if (!session.enabled) {
    return NextResponse.json(
      {
        status: "error",
        message: "Realtime manual confirm is not configured",
      },
      { status: 503 },
    );
  }

  if (!session.authenticated) {
    return NextResponse.json(
      {
        status: "error",
        message: "Realtime admin authentication required",
      },
      { status: 401 },
    );
  }

  const body = await request.json().catch(() => ({}));
  const orderId = String(body?.orderId || "").trim();
  const requestedBankTransferIds = Array.isArray(body?.bankTransferIds)
    ? body.bankTransferIds.map((item: unknown) => String(item || "").trim()).filter(Boolean)
    : [];

  if (!orderId) {
    return NextResponse.json(
      {
        status: "error",
        message: "orderId is required",
      },
      { status: 400 },
    );
  }

  const order = await buyOrderGetOrderById(orderId);
  if (!order) {
    return NextResponse.json(
      {
        status: "error",
        message: "Buy order not found",
      },
      { status: 404 },
    );
  }

  if (String(order.status || "") !== "paymentRequested") {
    return NextResponse.json(
      {
        status: "error",
        message: "Buy order is no longer awaiting payment confirmation",
        ...toOrderStatusPayload(order),
      },
      { status: 409 },
    );
  }

  const sellerAccountNumber = String(order?.seller?.bankInfo?.accountNumber || "").trim();
  const referenceDateKey =
    getKstDateKey(order.paymentRequestedAt) ||
    getKstDateKey(order.createdAt) ||
    getKstDateKey(new Date().toISOString());

  let selectedTransfers: any[] = [];
  if (requestedBankTransferIds.length > 0) {
    if (!sellerAccountNumber) {
      return NextResponse.json(
        {
          status: "error",
          message: "Seller bank account is not configured for this order",
        },
        { status: 400 },
      );
    }

    const transferResult = await getBankTransfers({
      accountNumber: sellerAccountNumber,
      transactionType: "deposited",
      matchStatus: "unmatched",
      page: 1,
      limit: 200,
      fromDate: referenceDateKey || "",
      toDate: referenceDateKey || "",
    });

    const transferMap = new Map(
      (Array.isArray(transferResult?.transfers) ? transferResult.transfers : [])
        .map((transfer: any) => [String(transfer?._id || ""), transfer]),
    );
    selectedTransfers = requestedBankTransferIds
      .map((transferId: string) => transferMap.get(transferId))
      .filter(Boolean);

    if (selectedTransfers.length !== requestedBankTransferIds.length) {
      return NextResponse.json(
        {
          status: "error",
          message: "Some selected deposits are no longer available",
        },
        { status: 409 },
      );
    }

    const selectedTotalAmount = selectedTransfers.reduce(
      (sum, transfer) => sum + (Number(transfer?.amount || 0) || 0),
      0,
    );

    if (selectedTotalAmount !== Number(order.krwAmount || 0)) {
      return NextResponse.json(
        {
          status: "error",
          message: "Selected deposit amount does not match the order amount",
          selectedTotalAmount,
          requiredAmount: Number(order.krwAmount || 0),
        },
        { status: 400 },
      );
    }
  }

  const sellerWalletAddressBalance = await getSellerWalletAddressBalance(order);
  const confirmedOrder = await buyOrderConfirmPayment({
    orderId,
    paymentAmount: Number(order.krwAmount || 0),
    transactionHash: "0x",
    sellerWalletAddressBalance,
  });

  if (!confirmedOrder) {
    const latestOrder = await buyOrderGetOrderById(orderId);
    return NextResponse.json(
      {
        status: "error",
        message: "Failed to confirm payment because the order state changed",
        ...toOrderStatusPayload(latestOrder),
      },
      { status: 409 },
    );
  }

  const confirmedTradeId = String(order.tradeId || "");
  const confirmedStatus = String((confirmedOrder as any)?.status || "paymentConfirmed");
  const matchedTransferIds: string[] = [];
  const unmatchedTransferIds: string[] = [];
  for (const transfer of selectedTransfers) {
    const transferId = String(transfer?._id || "");
    if (!transferId) {
      continue;
    }

    const matched = await matchBankTransfersBybankTransferId({
      bankTransferId: transferId,
      tradeId: confirmedTradeId,
      matchedByAdmin: true,
    });

    if (matched) {
      matchedTransferIds.push(transferId);
    } else {
      unmatchedTransferIds.push(transferId);
    }
  }

  return NextResponse.json({
    status: "success",
    result: {
      orderId,
      tradeId: confirmedTradeId,
      confirmedStatus,
      matchedTransferIds,
      unmatchedTransferIds,
    },
  });
}
