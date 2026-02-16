import { NextResponse, type NextRequest } from "next/server";

import {
  getAllSellersByStorecode,
  getAllStoreSellersForBalanceInquiry,
} from "@lib/api/user";
import { getStoreByStorecode } from "@lib/api/store";

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
};

const EXCLUDED_WALLET_ADDRESSES = new Set(
  [
    // thirdweb server wallet smart account (판매자 지갑 잔고 목록 제외 대상)
    "0xa9356206d2d5ea04ae36632c4c75936f9882bb79",
  ].map((address) => address.toLowerCase())
);

const isExcludedWalletAddress = (walletAddress?: string) => {
  const normalizedAddress = String(walletAddress || "").trim().toLowerCase();
  if (!normalizedAddress) {
    return false;
  }
  return EXCLUDED_WALLET_ADDRESSES.has(normalizedAddress);
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
  const normalizedLimit = Number(body?.limit) > 0 ? Number(body.limit) : 100;
  const normalizedPage = Number(body?.page) > 0 ? Number(body.page) : 1;

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

  const usersByWalletAddress = new Map<string, SellerBalanceUser>();

  const addUserByWalletAddress = ({
    walletAddress,
    nickname,
    id,
    _id,
  }: {
    walletAddress?: string;
    nickname?: string;
    id?: number;
    _id?: string;
  }) => {
    const normalizedAddress = String(walletAddress || "").trim();
    if (!normalizedAddress) {
      return;
    }
    if (isExcludedWalletAddress(normalizedAddress)) {
      return;
    }

    const walletKey = normalizedAddress.toLowerCase();
    const previousUser = usersByWalletAddress.get(walletKey);

    usersByWalletAddress.set(walletKey, {
      _id: previousUser?._id || _id,
      id: previousUser?.id || id,
      nickname: previousUser?.nickname || nickname || "seller",
      walletAddress: previousUser?.walletAddress || normalizedAddress,
      currentUsdtBalance: previousUser?.currentUsdtBalance || 0,
    });
  };

  const appendUsers = (users: any[]) => {
    for (const user of users) {
      addUserByWalletAddress({
        _id: user?._id ? String(user._id) : undefined,
        id: user?.id,
        nickname: user?.nickname,
        walletAddress: user?.walletAddress,
      });
    }
  };

  // 1) 기존 로직: confirmed seller 대상 조회
  try {
    const strictSellerResult = await getAllStoreSellersForBalanceInquiry({
      storecode: normalizedStorecode,
      limit: normalizedLimit,
      page: normalizedPage,
    });
    appendUsers(
      Array.isArray(strictSellerResult?.users) ? strictSellerResult.users : []
    );
  } catch (error) {
    console.error("Error loading strict seller balance users:", error);
  }

  // 2) fallback: seller role 기반 조회
  if (usersByWalletAddress.size === 0) {
    try {
      const sellerByRoleResult = await getAllSellersByStorecode({
        storecode: normalizedStorecode,
        role: "seller",
        limit: normalizedLimit,
        page: normalizedPage,
      });
      appendUsers(
        Array.isArray(sellerByRoleResult?.users) ? sellerByRoleResult.users : []
      );
    } catch (error) {
      console.error("Error loading role based seller balance users:", error);
    }
  }

  // 3) fallback: store 설정 지갑 병합
  try {
    const storeInfo = await getStoreByStorecode({
      storecode: normalizedStorecode,
    });

    addUserByWalletAddress({
      nickname: "정산지갑",
      walletAddress: storeInfo?.settlementWalletAddress,
    });
    addUserByWalletAddress({
      nickname: "판매자지갑",
      walletAddress: storeInfo?.sellerWalletAddress,
    });
    addUserByWalletAddress({
      nickname: "개인지갑",
      walletAddress: storeInfo?.privateSellerWalletAddress,
    });
    addUserByWalletAddress({
      nickname: "판매자지갑",
      walletAddress: storeInfo?.privateSaleWalletAddress,
    });
  } catch (error) {
    console.error("Error loading store fallback wallets:", error);
  }

  const result: {
    users: SellerBalanceUser[];
    totalCount: number;
    totalCurrentUsdtBalance: number;
  } = {
    users: Array.from(usersByWalletAddress.values()),
    totalCount: usersByWalletAddress.size,
    totalCurrentUsdtBalance: 0,
  };

  if (result.users.length === 0) {
    return NextResponse.json({ result });
  }

  try {
    const client = createThirdwebClient({
      secretKey: process.env.THIRDWEB_SECRET_KEY || "",
    });

    const contract = getContract({
      client,
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
