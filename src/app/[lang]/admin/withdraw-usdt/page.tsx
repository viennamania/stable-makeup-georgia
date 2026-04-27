'use client';

import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { ConnectButton, useActiveAccount, useActiveWallet } from "thirdweb/react";
import { inAppWallet } from "thirdweb/wallets";
import { arbitrum, bsc, ethereum, polygon } from "thirdweb/chains";

import AdminAccessLogoutButton from "@/components/admin/admin-access-logout-button";
import AdminAccessState from "@/components/admin/admin-access-state";
import { client } from "../../../client";
import {
  chain,
} from "@/app/config/contractAddresses";
import { postAdminSignedJson } from "@/lib/client/admin-signed-action";
import WithdrawUsdtPage from "../../withdraw-usdt/page";

const GET_USER_BY_WALLET_ADDRESS_ADMIN_SIGNING_PREFIX =
  "stable-georgia:get-user-by-wallet:admin:v1";

const wallets = [
  inAppWallet({
    auth: {
      options: ["email", "google"],
    },
  }),
];

const activeChain =
  chain === "ethereum"
    ? ethereum
    : chain === "polygon"
      ? polygon
      : chain === "bsc"
        ? bsc
        : arbitrum;

const isAdminUser = (user: any) => {
  return (
    String(user?.role || user?.rold || "").toLowerCase() === "admin"
    && String(user?.storecode || "").toLowerCase() === "admin"
  );
};

export default function AdminWithdrawUsdtPage({ params }: any) {
  const activeAccount = useActiveAccount();
  const activeWallet = useActiveWallet();
  const address = activeAccount?.address || "";
  const [loadingUser, setLoadingUser] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!address || !activeAccount) {
      setLoadingUser(false);
      setIsAdmin(false);
      return;
    }

    let cancelled = false;

    const verifyAdmin = async () => {
      setLoadingUser(true);
      setIsAdmin(false);

      try {
        const response = await postAdminSignedJson({
          account: activeAccount,
          route: "/api/user/getUserByWalletAddress",
          signingPrefix: GET_USER_BY_WALLET_ADDRESS_ADMIN_SIGNING_PREFIX,
          body: {
            storecode: "admin",
            walletAddress: address,
          },
        });
        const data = await response.json().catch(() => null);

        if (!cancelled) {
          setIsAdmin(Boolean(response.ok && isAdminUser(data?.result)));
        }
      } catch (error) {
        if (!cancelled) {
          setIsAdmin(false);
        }
      } finally {
        if (!cancelled) {
          setLoadingUser(false);
        }
      }
    };

    verifyAdmin();

    return () => {
      cancelled = true;
    };
  }, [address, activeAccount]);

  if (!address) {
    return (
      <AdminAccessState
        variant="login"
        title="관리자 지갑 연결이 필요합니다"
        description="콘솔 USDT 출금은 승인된 관리자 지갑에서만 사용할 수 있습니다. 지갑을 연결한 뒤 권한 확인을 진행해주세요."
        note="테더 전송 화면은 전송 서명을 직접 발생시키므로 관리자 인증 이전에는 렌더링하지 않습니다."
        actions={
          <ConnectButton
            client={client}
            wallets={wallets}
            showAllWallets={false}
            chain={activeChain}
            theme="light"
            connectButton={{
              label: "관리자 지갑 연결",
              style: {
                backgroundColor: "#0f172a",
                color: "#f8fafc",
                borderRadius: "12px",
                fontSize: "14px",
                height: "40px",
              },
            }}
            connectModal={{
              size: "wide",
              titleIcon: "https://www.stable.makeup/logo.png",
              showThirdwebBranding: false,
            }}
            locale="ko_KR"
          />
        }
      />
    );
  }

  if (loadingUser) {
    return (
      <AdminAccessState
        variant="checking"
        title="USDT 출금 권한을 확인하고 있습니다"
        description="연결된 지갑의 관리자 권한을 서명 기반으로 검증하는 중입니다."
        address={address}
        note="검증이 끝나기 전에는 전송 UI와 수신 지갑 목록을 표시하지 않습니다."
      />
    );
  }

  if (!isAdmin) {
    return (
      <AdminAccessState
        variant="denied"
        title="USDT 출금 권한이 없습니다"
        description="콘솔 USDT 출금은 본사 관리자 지갑만 접근할 수 있습니다. 승인된 관리자 지갑으로 다시 접속해주세요."
        address={address}
        note="권한 기준: storecode=admin, role=admin"
        actions={
          <AdminAccessLogoutButton
            onClick={() => {
              if (!confirm("로그아웃 하시겠습니까?")) {
                return;
              }

              activeWallet?.disconnect().then(() => {
                toast.success("로그아웃 되었습니다");
              });
            }}
          />
        }
      />
    );
  }

  return <WithdrawUsdtPage params={params} />;
}
