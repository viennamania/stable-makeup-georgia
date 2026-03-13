import { NextResponse, type NextRequest } from "next/server";

import { getStoreByStorecode } from "@lib/api/store";
import clientPromise, { dbName } from "@/lib/mongodb";
import { getConfiguredClearanceSettlementWalletAddress } from "@/lib/server/clearance-order-security";

import { createThirdwebClient, getContract } from "thirdweb";
import { ethereum, polygon, arbitrum, bsc } from "thirdweb/chains";
import { balanceOf } from "thirdweb/extensions/erc20";

import {
  chain,
  ethereumContractAddressUSDT,
  polygonContractAddressUSDT,
  arbitrumContractAddressUSDT,
  bscContractAddressUSDT,
  bscContractAddressMKRW,
} from "@/app/config/contractAddresses";

type SellerBalanceUser = {
  _id?: string;
  id?: number;
  nickname: string;
  walletAddress: string;
  currentUsdtBalance?: number;
  pendingTransferCount?: number;
  pendingTransferUsdtAmount?: number;
};

const getUsdtContractAddress = () => {
  if (chain === "ethereum") {
    return ethereumContractAddressUSDT;
  }
  if (chain === "polygon") {
    return polygonContractAddressUSDT;
  }
  if (chain === "arbitrum") {
    return arbitrumContractAddressUSDT;
  }
  if (chain === "bsc") {
    return bscContractAddressUSDT;
  }
  return bscContractAddressMKRW;
};

const getThirdwebChain = () => {
  if (chain === "ethereum") {
    return ethereum;
  }
  if (chain === "polygon") {
    return polygon;
  }
  if (chain === "arbitrum") {
    return arbitrum;
  }
  return bsc;
};

export async function POST(request: NextRequest) {
  let body: any = {};
  try {
    body = await request.json();
  } catch (error) {
    body = {};
  }

  const normalizedStorecode = String(body?.storecode || "").trim();

  if (!normalizedStorecode) {
    return NextResponse.json(
      {
        error: "storecode is required",
      },
      {
        status: 400,
      }
    );
  }

  const storeInfo = await getStoreByStorecode({
    storecode: normalizedStorecode,
  });

  if (!storeInfo) {
    return NextResponse.json(
      {
        error: "store not found",
      },
      {
        status: 404,
      }
    );
  }

  const sellerWalletAddress = String(
    getConfiguredClearanceSettlementWalletAddress(storeInfo)
    || storeInfo?.sellerWalletAddress
    || "",
  ).trim();

  const client = await clientPromise;
  const buyOrderCollection = client.db(dbName).collection("buyorders");

  const [pendingTransferSummary] = await buyOrderCollection.aggregate<{
    pendingTransferCount?: number;
    pendingTransferUsdtAmount?: number;
  }>([
    {
      $match: {
        storecode: normalizedStorecode,
        privateSale: true,
        status: "paymentConfirmed",
        $or: [
          { transactionHash: { $exists: false } },
          { transactionHash: null },
          { transactionHash: "" },
          { transactionHash: "0x" },
        ],
        "settlement.status": { $ne: "paymentSettled" },
      },
    },
    {
      $group: {
        _id: null,
        pendingTransferCount: { $sum: 1 },
        pendingTransferUsdtAmount: { $sum: { $toDouble: "$usdtAmount" } },
      },
    },
  ]).toArray();

  const totalPendingTransferCount = Number(pendingTransferSummary?.pendingTransferCount || 0);
  const totalPendingTransferUsdtAmount = Number(pendingTransferSummary?.pendingTransferUsdtAmount || 0);

  const result: {
    users: SellerBalanceUser[];
    totalCount: number;
    totalCurrentUsdtBalance: number;
    totalPendingTransferCount: number;
    totalPendingTransferUsdtAmount: number;
  } = {
    users: sellerWalletAddress
      ? [
          {
            nickname: "판매자지갑",
            walletAddress: sellerWalletAddress,
            currentUsdtBalance: 0,
            pendingTransferCount: totalPendingTransferCount,
            pendingTransferUsdtAmount: totalPendingTransferUsdtAmount,
          },
        ]
      : [],
    totalCount: sellerWalletAddress ? 1 : 0,
    totalCurrentUsdtBalance: 0,
    totalPendingTransferCount,
    totalPendingTransferUsdtAmount,
  };

  if (result.users.length === 0) {
    return NextResponse.json({ result });
  }

  try {
    const thirdwebClient = createThirdwebClient({
      secretKey: process.env.THIRDWEB_SECRET_KEY || "",
    });

    const contract = getContract({
      client: thirdwebClient,
      chain: getThirdwebChain(),
      address: getUsdtContractAddress(),
    });

    for (let i = 0; i < result.users.length; i++) {
      const user = result.users[i];
      if (!user.walletAddress) {
        user.currentUsdtBalance = 0;
        continue;
      }

      try {
        const walletBalanceRaw = await balanceOf({
          contract,
          address: user.walletAddress,
        });

        const decimals = chain === "bsc" ? 18 : 6;
        user.currentUsdtBalance = Number(walletBalanceRaw) / 10 ** decimals;
      } catch (error) {
        console.error(
          `Error getting balance for user ${user.nickname} (${user.walletAddress}):`,
          error
        );
        user.currentUsdtBalance = 0;
      }
    }

    result.users.sort(
      (a, b) => (b.currentUsdtBalance || 0) - (a.currentUsdtBalance || 0)
    );

    result.totalCurrentUsdtBalance = result.users.reduce(
      (sum, user) => sum + (user.currentUsdtBalance || 0),
      0
    );
  } catch (error) {
    console.error(
      "Error in getAllStoreSellersForBalance:",
      JSON.stringify(error)
    );
  }

  return NextResponse.json({
    result,
  });
}
