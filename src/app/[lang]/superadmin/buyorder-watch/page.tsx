"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ConnectButton, useActiveAccount } from "thirdweb/react";
import { inAppWallet } from "thirdweb/wallets";

import { client } from "@/app/client";
import { useAnimatedNumber } from "@/components/useAnimatedNumber";
import { postAdminSignedJson } from "@/lib/client/admin-signed-action";
import { useSuperadminSession } from "@/lib/client/use-superadmin-session";
import { VerifiedMonitoredTransfersPanel } from "./verified-monitored-transfers-panel";

type SellerWalletBalanceItem = {
  id?: number | null;
  nickname?: string;
  storecode?: string | null;
  storeName?: string | null;
  storeLogo?: string | null;
  walletAddress: string;
  signerAddress?: string | null;
  currentUsdtBalance?: number;
};

type BuyerWalletBalanceItem = {
  walletAddress: string;
  signerAddress?: string | null;
  nickname?: string | null;
  avatar?: string | null;
  storecode?: string | null;
  storeName?: string | null;
  storeLogo?: string | null;
  orderCount?: number;
  totalAmountUsdt?: number;
  latestPaymentConfirmedAt?: string | null;
  currentUsdtBalance?: number;
};

type BlockedBuyOrderMonitorItem = {
  blockedKey: string;
  orderId?: string | null;
  tradeId?: string | null;
  storecode?: string | null;
  storeName?: string | null;
  storeLogo?: string | null;
  buyerNickname?: string | null;
  buyerDepositName?: string | null;
  buyerWalletAddress?: string | null;
  sellerNickname?: string | null;
  status?: string | null;
  settlementStatus?: string | null;
  amountUsdt?: number;
  amountKrw?: number;
  route?: string;
  routeLabel?: string | null;
  latestReason?: string | null;
  latestReasonLabel?: string | null;
  latestReasonDetail?: string | null;
  tone?: "rose" | "amber" | "sky";
  severity?: "critical" | "warning" | "info";
  blockedCount?: number;
  latestBlockedAt?: string | null;
};

type SellerWalletSnapshot = {
  wallets: SellerWalletBalanceItem[];
  updatedAt: string;
  totalCurrentUsdtBalance: number;
};

type BuyerWalletSnapshot = {
  wallets: BuyerWalletBalanceItem[];
  updatedAt: string;
  totalCurrentUsdtBalance: number;
};

type BlockedOrderSnapshot = {
  orders: BlockedBuyOrderMonitorItem[];
  updatedAt: string;
  totalCount: number;
  criticalCount: number;
  warningCount: number;
  infoCount: number;
};

const wallets = [
  inAppWallet({
    auth: {
      options: ["email", "google"],
    },
  }),
];

const SELLER_WALLET_MIN_USDT_BALANCE = 0.1;
const MONITOR_POLLING_MS = 15_000;
const BLOCKED_BUY_ORDERS_LOOKBACK_HOURS = 24 * 14;
const ACCESS_REQUEST_ROUTE = "/api/superadmin/access-requests/request";
const ACCESS_REQUEST_SIGNING_PREFIX = "stable-georgia:superadmin:access-requests:request:v1";

const truncateWallet = (value: unknown) => {
  const text = typeof value === "string" ? value.trim() : "";
  if (!text) {
    return "-";
  }
  if (text.length <= 18) {
    return text;
  }
  return `${text.slice(0, 8)}...${text.slice(-6)}`;
};

const normalizeWalletText = (value: unknown) =>
  typeof value === "string" ? value.trim().toLowerCase() : "";

const formatCount = (value: unknown) => {
  const numeric = typeof value === "number" ? value : Number.parseInt(String(value || "0"), 10);
  return Number.isFinite(numeric) ? numeric.toLocaleString("ko-KR") : "0";
};

const formatUsdtValue = (value: unknown, maximumFractionDigits = 3) => {
  const numeric = typeof value === "number" ? value : Number.parseFloat(String(value || "0"));
  if (!Number.isFinite(numeric)) {
    return "0";
  }
  return numeric.toLocaleString("ko-KR", {
    minimumFractionDigits: maximumFractionDigits,
    maximumFractionDigits,
  });
};

const formatKstDateTime = (value?: string | Date | null) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString("ko-KR", {
    timeZone: "Asia/Seoul",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};

const formatTimeAgo = (value?: string | Date | null) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  const diffMs = Date.now() - date.getTime();
  if (diffMs < 0) return "방금 전";
  const sec = Math.floor(diffMs / 1000);
  if (sec < 60) return "방금 전";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}분 전`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}시간 전`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}일 전`;
  const week = Math.floor(day / 7);
  if (week < 5) return `${week}주 전`;
  const month = Math.floor(day / 30);
  if (month < 12) return `${month}개월 전`;
  const year = Math.floor(day / 365);
  return `${year}년 전`;
};

const formatShortAddress = (value: unknown) => {
  const text = typeof value === "string" ? value.trim() : "";
  if (!text) {
    return "-";
  }
  if (text.length <= 12) {
    return text;
  }
  return `${text.slice(0, 6)}...${text.slice(-4)}`;
};

const isDocumentHidden = () => {
  if (typeof document === "undefined") {
    return false;
  }
  return Boolean(document.hidden);
};

const isSmartAccountWallet = (
  wallet?: {
    walletAddress?: string | null;
    signerAddress?: string | null;
  } | null,
) => {
  if (!wallet) {
    return false;
  }
  const walletAddress = String(wallet.walletAddress || "").trim().toLowerCase();
  const signerAddress = String(wallet.signerAddress || "").trim().toLowerCase();
  if (!signerAddress) {
    return false;
  }
  return !walletAddress || signerAddress !== walletAddress;
};

const getBlockedOrderToneClasses = (tone?: BlockedBuyOrderMonitorItem["tone"]) => {
  switch (tone) {
    case "rose":
      return {
        card: "border-rose-400/25 bg-rose-500/10",
        badge: "border-rose-300/30 bg-rose-400/15 text-rose-100",
        accent: "text-rose-200",
      };
    case "amber":
      return {
        card: "border-amber-400/25 bg-amber-500/10",
        badge: "border-amber-300/30 bg-amber-400/15 text-amber-100",
        accent: "text-amber-100",
      };
    default:
      return {
        card: "border-cyan-400/25 bg-cyan-500/10",
        badge: "border-cyan-300/30 bg-cyan-400/15 text-cyan-100",
        accent: "text-cyan-100",
      };
  }
};

const getBlockedOrderSeverityLabel = (severity?: BlockedBuyOrderMonitorItem["severity"]) => {
  switch (severity) {
    case "critical":
      return "고위험";
    case "warning":
      return "의심";
    default:
      return "관찰";
  }
};

const getErrorMessage = (value: unknown) => {
  if (value instanceof Error) {
    return value.message;
  }
  return "모니터 데이터를 불러오지 못했습니다.";
};

const summaryCardClass =
  "rounded-[26px] border border-white/10 bg-[linear-gradient(180deg,rgba(13,18,29,0.96),rgba(8,12,20,0.98))] p-5 shadow-[0_28px_90px_-68px_rgba(8,15,31,0.9)]";

export default function SuperadminBuyorderWatchPage() {
  const params = useParams<{ lang: string }>();
  const activeAccount = useActiveAccount();
  const { role, isSuperadmin, requesterWalletAddress, loading, error } =
    useSuperadminSession(activeAccount);
  const lang = params?.lang || "ko";

  const connectedWalletAddress = normalizeWalletText(activeAccount?.address);
  const authorizedWalletAddress = normalizeWalletText(requesterWalletAddress);

  const [sellerSnapshot, setSellerSnapshot] = useState<SellerWalletSnapshot>({
    wallets: [],
    updatedAt: "",
    totalCurrentUsdtBalance: 0,
  });
  const [buyerSnapshot, setBuyerSnapshot] = useState<BuyerWalletSnapshot>({
    wallets: [],
    updatedAt: "",
    totalCurrentUsdtBalance: 0,
  });
  const [blockedSnapshot, setBlockedSnapshot] = useState<BlockedOrderSnapshot>({
    orders: [],
    updatedAt: "",
    totalCount: 0,
    criticalCount: 0,
    warningCount: 0,
    infoCount: 0,
  });
  const [accessRequestNote, setAccessRequestNote] = useState("");
  const [accessRequestLoading, setAccessRequestLoading] = useState(false);
  const [accessRequestError, setAccessRequestError] = useState("");
  const [accessRequestSuccess, setAccessRequestSuccess] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [boardError, setBoardError] = useState("");

  const canViewBoard = Boolean(activeAccount && !loading && isSuperadmin);
  const animatedSellerWalletTotalUsdt = useAnimatedNumber(sellerSnapshot.totalCurrentUsdtBalance, {
    decimalPlaces: 3,
  });
  const animatedBuyerWalletTotalUsdt = useAnimatedNumber(buyerSnapshot.totalCurrentUsdtBalance, {
    decimalPlaces: 3,
  });

  const handleRequestAccess = useCallback(async () => {
    if (!activeAccount) {
      return;
    }

    setAccessRequestLoading(true);
    setAccessRequestError("");
    setAccessRequestSuccess("");

    try {
      const response = await postAdminSignedJson({
        account: activeAccount,
        route: ACCESS_REQUEST_ROUTE,
        signingPrefix: ACCESS_REQUEST_SIGNING_PREFIX,
        requesterStorecode: "superadmin",
        body: {
          note: accessRequestNote,
          requestPage: `/${lang}/superadmin/buyorder-watch`,
        },
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "관리자권한 요청을 접수하지 못했습니다.");
      }

      const duplicate = Boolean(data?.result?.duplicate);
      const createdAt = formatKstDateTime(data?.result?.request?.createdAt);
      setAccessRequestSuccess(
        duplicate
          ? `이미 승인 대기 중인 요청이 있습니다. 접수 시각: ${createdAt}`
          : `관리자권한 요청이 접수되었습니다. 접수 시각: ${createdAt}`,
      );
      setAccessRequestNote("");
    } catch (nextError) {
      setAccessRequestError(
        nextError instanceof Error ? nextError.message : "관리자권한 요청을 접수하지 못했습니다.",
      );
    } finally {
      setAccessRequestLoading(false);
    }
  }, [accessRequestNote, activeAccount, lang]);

  const refreshBoard = useCallback(async ({ showLoading = false }: { showLoading?: boolean } = {}) => {
    if (!canViewBoard) {
      return;
    }

    if (showLoading) {
      setRefreshing(true);
    }

    try {
      const sellerQuery = new URLSearchParams();
      sellerQuery.set("public", "1");
      sellerQuery.set("limit", "200");

      const buyerQuery = new URLSearchParams();
      buyerQuery.set("public", "1");
      buyerQuery.set("limit", "1000");

      const blockedQuery = new URLSearchParams();
      blockedQuery.set("public", "1");
      blockedQuery.set("limit", "24");
      blockedQuery.set("lookbackHours", String(BLOCKED_BUY_ORDERS_LOOKBACK_HOURS));

      const [sellerResponse, buyerResponse, blockedResponse] = await Promise.all([
        fetch(`/api/realtime/buyorder/seller-user-wallets?${sellerQuery.toString()}`, {
          method: "GET",
          cache: "no-store",
        }),
        fetch(`/api/realtime/buyorder/buyer-wallets?${buyerQuery.toString()}`, {
          method: "GET",
          cache: "no-store",
        }),
        fetch(`/api/realtime/buyorder/blocked-orders?${blockedQuery.toString()}`, {
          method: "GET",
          cache: "no-store",
        }),
      ]);

      const [sellerData, buyerData, blockedData] = await Promise.all([
        sellerResponse.json(),
        buyerResponse.json(),
        blockedResponse.json(),
      ]);

      if (!sellerResponse.ok) {
        throw new Error(sellerData?.message || "Seller Wallet Monitor를 불러오지 못했습니다.");
      }
      if (!buyerResponse.ok) {
        throw new Error(buyerData?.message || "Buyer Wallet Monitor를 불러오지 못했습니다.");
      }
      if (!blockedResponse.ok) {
        throw new Error(blockedData?.message || "FDS 이상거래 탐지를 불러오지 못했습니다.");
      }

      const rawSellerWallets = Array.isArray(sellerData?.wallets)
        ? (sellerData.wallets as SellerWalletBalanceItem[])
        : [];
      const sellerWallets = rawSellerWallets.filter(
        (item) => Number(item?.currentUsdtBalance || 0) >= SELLER_WALLET_MIN_USDT_BALANCE,
      );
      const sellerTotal = sellerWallets.reduce(
        (sum, item) => sum + Number(item?.currentUsdtBalance || 0),
        0,
      );

      setSellerSnapshot({
        wallets: sellerWallets,
        updatedAt: String(sellerData?.updatedAt || ""),
        totalCurrentUsdtBalance: sellerTotal,
      });

      setBuyerSnapshot({
        wallets: Array.isArray(buyerData?.wallets)
          ? (buyerData.wallets as BuyerWalletBalanceItem[])
          : [],
        updatedAt: String(buyerData?.updatedAt || ""),
        totalCurrentUsdtBalance: Number(buyerData?.totalCurrentUsdtBalance || 0),
      });

      setBlockedSnapshot({
        orders: Array.isArray(blockedData?.orders)
          ? (blockedData.orders as BlockedBuyOrderMonitorItem[])
          : [],
        updatedAt: String(blockedData?.updatedAt || ""),
        totalCount: Number(blockedData?.totalCount || 0),
        criticalCount: Number(blockedData?.criticalCount || 0),
        warningCount: Number(blockedData?.warningCount || 0),
        infoCount: Number(blockedData?.infoCount || 0),
      });

      setBoardError("");
    } catch (nextError) {
      setBoardError(getErrorMessage(nextError));
    } finally {
      if (showLoading) {
        setRefreshing(false);
      }
    }
  }, [canViewBoard]);

  useEffect(() => {
    if (!canViewBoard) {
      setSellerSnapshot({ wallets: [], updatedAt: "", totalCurrentUsdtBalance: 0 });
      setBuyerSnapshot({ wallets: [], updatedAt: "", totalCurrentUsdtBalance: 0 });
      setBlockedSnapshot({
        orders: [],
        updatedAt: "",
        totalCount: 0,
        criticalCount: 0,
        warningCount: 0,
        infoCount: 0,
      });
      setRefreshing(false);
      setBoardError("");
      return;
    }

    let cancelled = false;
    const refresh = async (showLoading = false) => {
      if (cancelled) {
        return;
      }
      await refreshBoard({ showLoading });
    };

    void refresh(true);
    const interval = window.setInterval(() => {
      if (isDocumentHidden()) {
        return;
      }
      void refresh(false);
    }, MONITOR_POLLING_MS);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [canViewBoard, refreshBoard]);

  const statusText = !activeAccount
    ? "지갑 연결 필요"
    : loading
      ? "권한 확인중"
      : isSuperadmin
        ? "Watchboard Ready"
        : "권한 없음";

  const sellerSmartWalletCount = useMemo(
    () => sellerSnapshot.wallets.filter((item) => isSmartAccountWallet(item)).length,
    [sellerSnapshot.wallets],
  );
  const buyerSmartWalletCount = useMemo(
    () => buyerSnapshot.wallets.filter((item) => isSmartAccountWallet(item)).length,
    [buyerSnapshot.wallets],
  );

  return (
    <main className="flex flex-col gap-5">
      <section className="overflow-hidden rounded-[32px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.18),transparent_26%),radial-gradient(circle_at_82%_18%,rgba(34,211,238,0.16),transparent_20%),linear-gradient(135deg,rgba(7,11,18,0.98),rgba(5,8,14,1))] shadow-[0_56px_160px_-88px_rgba(15,23,42,0.95)]">
        <div className="grid gap-6 px-5 py-6 sm:px-7 lg:grid-cols-[minmax(0,1.35fr)_390px]">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.34em] text-emerald-300/85">
              Buyorder Situation Board
            </div>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-[38px]">
              Seller, Buyer, FDS 신호만 따로 보는 운영 상황판
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300/82">
              `/ko/admin/buyorder`에 있던 Seller Wallet Monitor, Buyer Wallet Monitor,
              FDS 이상거래 탐지 모듈만 분리한 superadmin 전용 감시 화면입니다.
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              <Link
                href={`/${lang}/superadmin`}
                className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1.5 text-xs font-semibold text-cyan-200 transition hover:bg-cyan-400/15"
              >
                Control Deck
              </Link>
              <Link
                href={`/${lang}/admin/buyorder`}
                className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-xs font-semibold text-slate-100 transition hover:bg-white/[0.08]"
              >
                Admin Buyorder
              </Link>
            </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5 backdrop-blur">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">
                  Access Status
                </div>
                <div className="mt-3 inline-flex rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-xs font-semibold text-emerald-200">
                  {statusText}
                </div>
              </div>

              <button
                type="button"
                onClick={() => void refreshBoard({ showLoading: true })}
                disabled={!canViewBoard || refreshing}
                className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-xs font-semibold text-slate-100 transition hover:bg-white/[0.1] disabled:cursor-not-allowed disabled:text-slate-500"
              >
                {refreshing ? "새로고침중..." : "Refresh"}
              </button>
            </div>

            <div className="mt-5 grid gap-3 text-sm text-slate-300/82">
              <div className="rounded-2xl border border-white/10 bg-[#0d1322] px-4 py-3">
                <div className="text-[11px] uppercase tracking-[0.22em] text-slate-500">
                  Connected Wallet
                </div>
                <div className="mt-2 font-semibold text-white">
                  {truncateWallet(activeAccount?.address)}
                </div>
                <div className="mt-1 break-all text-xs text-slate-500">
                  {connectedWalletAddress || "-"}
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-[#0d1322] px-4 py-3">
                  <div className="text-[11px] uppercase tracking-[0.22em] text-slate-500">
                    Auth Wallet
                  </div>
                  <div className="mt-2 font-semibold text-white">
                    {truncateWallet(requesterWalletAddress)}
                  </div>
                  <div className="mt-1 break-all text-xs text-slate-500">
                    {authorizedWalletAddress || "권한 확인 전"}
                  </div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-[#0d1322] px-4 py-3">
                  <div className="text-[11px] uppercase tracking-[0.22em] text-slate-500">
                    Role
                  </div>
                  <div className="mt-2 font-semibold text-white">{role || "-"}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {!activeAccount ? (
        <section className="rounded-[26px] border border-amber-400/20 bg-amber-500/10 px-5 py-5 text-sm text-amber-100">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="font-medium text-amber-50">
                상황판을 보려면 먼저 지갑을 연결해야 합니다.
              </div>
              <div className="mt-2 text-sm leading-6 text-amber-100/80">
                연결 후 현재 지갑의 `role` 또는 `rold`가 `superadmin`인지 바로 확인합니다.
              </div>
            </div>

            <div className="shrink-0">
              <ConnectButton
                client={client}
                wallets={wallets}
                showAllWallets={false}
                theme="dark"
                connectButton={{
                  label: "지갑 연결",
                  style: {
                    background:
                      "linear-gradient(135deg, rgba(34,211,238,0.92), rgba(14,165,233,0.92))",
                    color: "#020617",
                    borderRadius: "999px",
                    padding: "0 18px",
                    height: "44px",
                    fontSize: "14px",
                    fontWeight: 700,
                    boxShadow: "0 14px 40px -18px rgba(34,211,238,0.8)",
                  },
                }}
                connectModal={{
                  size: "wide",
                  title: "Superadmin Wallet Connect",
                  titleIcon: "https://www.stable.makeup/logo.png",
                  showThirdwebBranding: false,
                }}
                locale="ko_KR"
              />
            </div>
          </div>
        </section>
      ) : null}

      {activeAccount && loading ? (
        <section className="rounded-[26px] border border-cyan-400/20 bg-cyan-500/10 px-5 py-5 text-sm text-cyan-100">
          현재 지갑의 superadmin 권한을 확인하고 있습니다.
        </section>
      ) : null}

      {activeAccount && !loading && !isSuperadmin ? (
        <section className="rounded-[26px] border border-rose-400/20 bg-rose-500/10 px-5 py-5 text-sm text-rose-100">
          현재 지갑에는 `role` 또는 `rold` 기준 `superadmin` 권한이 없습니다.
          <div className="mt-3 text-xs leading-6 text-rose-100/80">
            Connected: {connectedWalletAddress || "-"}
          </div>
          <div className="text-xs leading-6 text-rose-100/80">
            Auth checked: {authorizedWalletAddress || "권한 확인 실패"}
          </div>
          {error ? (
            <div className="mt-3 text-xs leading-6 text-rose-100/80">
              Error: {error}
            </div>
          ) : null}

          <div className="mt-5 rounded-[22px] border border-white/10 bg-white/[0.05] p-4">
            <div className="text-sm font-semibold text-white">관리자권한 요청하기</div>
            <div className="mt-2 text-xs leading-6 text-rose-100/80">
              현재 지갑 기준으로 요청을 저장합니다. 기존 superadmin 사용자가
              <Link
                href={`/${lang}/superadmin/access-requests`}
                className="mx-1 font-semibold text-fuchsia-200 underline decoration-fuchsia-300/50 underline-offset-4"
              >
                승인 페이지
              </Link>
              에서 승인하면 즉시 접근할 수 있습니다.
            </div>

            <label className="mt-4 block">
              <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-rose-100/70">
                Request Note
              </div>
              <textarea
                value={accessRequestNote}
                onChange={(event) => setAccessRequestNote(event.target.value)}
                rows={3}
                placeholder="요청 사유나 운영 메모를 남겨두면 승인자가 확인하기 쉽습니다."
                className="w-full rounded-[18px] border border-white/10 bg-slate-950/40 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-fuchsia-300/40"
              />
            </label>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => void handleRequestAccess()}
                disabled={accessRequestLoading}
                className="rounded-full border border-fuchsia-300/30 bg-fuchsia-400/10 px-4 py-2 text-sm font-semibold text-fuchsia-100 transition hover:border-fuchsia-200/40 hover:bg-fuchsia-400/15 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {accessRequestLoading ? "요청 접수 중..." : "관리자권한 요청하기"}
              </button>
              <Link
                href={`/${lang}/superadmin/access-requests`}
                className="rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-white/20 hover:bg-white/[0.08]"
              >
                승인 페이지 보기
              </Link>
            </div>

            {accessRequestSuccess ? (
              <div className="mt-4 rounded-[16px] border border-emerald-300/20 bg-emerald-400/10 px-4 py-3 text-xs leading-6 text-emerald-100">
                {accessRequestSuccess}
              </div>
            ) : null}
            {accessRequestError ? (
              <div className="mt-4 rounded-[16px] border border-rose-300/20 bg-rose-400/10 px-4 py-3 text-xs leading-6 text-rose-100">
                {accessRequestError}
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      {canViewBoard ? (
        <>
          {boardError ? (
            <section className="rounded-[24px] border border-rose-400/20 bg-rose-500/10 px-5 py-4 text-sm text-rose-100">
              {boardError}
            </section>
          ) : null}

          <section className="grid gap-4 xl:grid-cols-4">
            <article className={summaryCardClass}>
              <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-emerald-300/90">
                Seller Wallets
              </div>
              <div className="mt-3 text-3xl font-semibold tracking-tight text-white">
                {formatCount(sellerSnapshot.wallets.length)}
              </div>
              <div className="mt-2 text-sm font-medium text-slate-200">
                {formatUsdtValue(animatedSellerWalletTotalUsdt)} USDT
              </div>
              <div className="mt-3 text-sm leading-6 text-slate-400">
                스마트 지갑 {formatCount(sellerSmartWalletCount)}개 · {SELLER_WALLET_MIN_USDT_BALANCE}
                USDT 이상 seller만 집계
              </div>
            </article>

            <article className={summaryCardClass}>
              <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-cyan-300/90">
                Buyer Wallets
              </div>
              <div className="mt-3 text-3xl font-semibold tracking-tight text-white">
                {formatCount(buyerSnapshot.wallets.length)}
              </div>
              <div className="mt-2 text-sm font-medium text-slate-200">
                {formatUsdtValue(animatedBuyerWalletTotalUsdt)} USDT
              </div>
              <div className="mt-3 text-sm leading-6 text-slate-400">
                스마트 지갑 {formatCount(buyerSmartWalletCount)}개 · 미정산 buyer wallet 모니터
              </div>
            </article>

            <article className={summaryCardClass}>
              <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-rose-300/90">
                Open FDS Cases
              </div>
              <div className="mt-3 text-3xl font-semibold tracking-tight text-white">
                {formatCount(blockedSnapshot.totalCount)}
              </div>
              <div className="mt-2 text-sm font-medium text-slate-200">
                고위험 {formatCount(blockedSnapshot.criticalCount)}건
              </div>
              <div className="mt-3 text-sm leading-6 text-slate-400">
                의심 {formatCount(blockedSnapshot.warningCount)}건 · 관찰{" "}
                {formatCount(blockedSnapshot.infoCount)}건
              </div>
            </article>

            <article className={summaryCardClass}>
              <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-amber-300/90">
                Snapshot
              </div>
              <div className="mt-3 text-base font-semibold tracking-tight text-white">
                {formatKstDateTime(
                  blockedSnapshot.updatedAt || buyerSnapshot.updatedAt || sellerSnapshot.updatedAt,
                )}
              </div>
              <div className="mt-2 text-sm font-medium text-slate-200">
                15초 주기 상황판
              </div>
              <div className="mt-3 text-sm leading-6 text-slate-400">
                Seller · Buyer · FDS 세 모듈을 한 화면에서 감시합니다.
              </div>
            </article>
          </section>

          <VerifiedMonitoredTransfersPanel lang={lang} enabled={canViewBoard} />

          <section className="grid gap-5 xl:grid-cols-2">
            <article className="rounded-[28px] border border-emerald-400/20 bg-[linear-gradient(180deg,rgba(14,29,24,0.96),rgba(9,18,15,1))] p-5 shadow-[0_28px_100px_-72px_rgba(5,150,105,0.45)]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Image src="/icon-seller.png" alt="Seller" width={18} height={18} className="h-[18px] w-[18px]" />
                    <span className="text-sm font-semibold text-white">Seller Wallet Monitor</span>
                  </div>
                  <div className="mt-2 text-xs leading-6 text-emerald-100/75">
                    users.nickname=seller · users.walletAddress · {SELLER_WALLET_MIN_USDT_BALANCE}
                    USDT 이상
                  </div>
                </div>
                <div className="text-right text-xs text-emerald-100/75">
                  <div>{formatCount(sellerSnapshot.wallets.length)} wallets</div>
                  <div className="mt-1">{formatKstDateTime(sellerSnapshot.updatedAt)}</div>
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-emerald-400/15 bg-emerald-500/10 px-4 py-3">
                <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-emerald-200/80">
                  Total USDT
                </div>
                <div className="mt-2 flex items-center gap-2 text-2xl font-semibold text-white">
                  <Image src="/icon-tether.png" alt="USDT" width={18} height={18} className="h-[18px] w-[18px]" />
                  {formatUsdtValue(animatedSellerWalletTotalUsdt)}
                </div>
              </div>

              {sellerSnapshot.wallets.length > 0 ? (
                <div className="mt-4 grid max-h-[560px] gap-3 overflow-y-auto pr-1">
                  {sellerSnapshot.wallets.map((seller, index) => (
                    <div
                      key={`${seller.walletAddress}-${index}`}
                      className="rounded-2xl border border-white/8 bg-white/[0.04] px-4 py-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            {isSmartAccountWallet(seller) ? (
                              <span className="rounded-full border border-cyan-300/25 bg-cyan-400/10 px-2 py-0.5 text-[10px] font-semibold text-cyan-100">
                                스마트 지갑
                              </span>
                            ) : null}
                            <span className="font-mono text-sm font-semibold text-white">
                              {formatShortAddress(seller.walletAddress)}
                            </span>
                          </div>
                          <div className="mt-2 flex min-w-0 items-center gap-2">
                            <Image
                              src={seller.storeLogo || "/icon-store.png"}
                              alt={seller.storeName || seller.storecode || "Store"}
                              width={18}
                              height={18}
                              className="h-[18px] w-[18px] rounded-full border border-white/10 object-cover"
                            />
                            <div className="truncate text-sm text-slate-300">
                              {seller.storeName || seller.storecode || "-"}
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="font-mono text-lg font-semibold text-emerald-200">
                            {formatUsdtValue(seller.currentUsdtBalance || 0)}
                          </div>
                          <div className="mt-1 text-[10px] font-medium uppercase tracking-[0.18em] text-emerald-300/70">
                            USDT
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-4 rounded-2xl border border-dashed border-white/10 bg-white/[0.03] px-4 py-6 text-sm text-slate-400">
                  잔고가 {SELLER_WALLET_MIN_USDT_BALANCE} USDT 이상인 seller 지갑이 없습니다.
                </div>
              )}
            </article>

            <article className="rounded-[28px] border border-cyan-400/20 bg-[linear-gradient(180deg,rgba(10,25,31,0.96),rgba(8,14,20,1))] p-5 shadow-[0_28px_100px_-72px_rgba(8,145,178,0.45)]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Image src="/icon-buyer.png" alt="Buyer" width={18} height={18} className="h-[18px] w-[18px]" />
                    <span className="text-sm font-semibold text-white">Buyer Wallet Monitor</span>
                  </div>
                  <div className="mt-2 text-xs leading-6 text-cyan-100/75">
                    paymentConfirmed · transactionHash sent · settlement pending
                  </div>
                </div>
                <div className="text-right text-xs text-cyan-100/75">
                  <div>{formatCount(buyerSnapshot.wallets.length)} wallets</div>
                  <div className="mt-1">{formatKstDateTime(buyerSnapshot.updatedAt)}</div>
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-cyan-400/15 bg-cyan-500/10 px-4 py-3">
                <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-200/80">
                  Total USDT
                </div>
                <div className="mt-2 flex items-center gap-2 text-2xl font-semibold text-white">
                  <Image src="/icon-tether.png" alt="USDT" width={18} height={18} className="h-[18px] w-[18px]" />
                  {formatUsdtValue(animatedBuyerWalletTotalUsdt)}
                </div>
              </div>

              {buyerSnapshot.wallets.length > 0 ? (
                <div className="mt-4 grid max-h-[560px] gap-3 overflow-y-auto pr-1">
                  {buyerSnapshot.wallets.map((buyer, index) => (
                    <div
                      key={`${buyer.walletAddress}-${index}`}
                      className="rounded-2xl border border-white/8 bg-white/[0.04] px-4 py-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            {isSmartAccountWallet(buyer) ? (
                              <span className="rounded-full border border-cyan-300/25 bg-cyan-400/10 px-2 py-0.5 text-[10px] font-semibold text-cyan-100">
                                스마트 지갑
                              </span>
                            ) : null}
                            <span className="font-mono text-sm font-semibold text-white">
                              {formatShortAddress(buyer.walletAddress)}
                            </span>
                          </div>
                          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-300">
                            <span>{buyer.nickname || "익명 구매자"}</span>
                          </div>
                          <div className="mt-2 flex min-w-0 items-center gap-2">
                            <Image
                              src={buyer.storeLogo || "/icon-store.png"}
                              alt={buyer.storeName || buyer.storecode || "Store"}
                              width={18}
                              height={18}
                              className="h-[18px] w-[18px] rounded-full border border-white/10 object-cover"
                            />
                            <div className="min-w-0">
                              <div className="truncate text-sm text-slate-300">
                                {buyer.storeName || buyer.storecode || "가맹점 정보 없음"}
                              </div>
                              {buyer.storeName && buyer.storecode ? (
                                <div className="truncate text-[11px] text-slate-500">@{buyer.storecode}</div>
                              ) : null}
                            </div>
                          </div>
                          <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-slate-400">
                            <span>{formatCount(buyer.orderCount || 0)} orders</span>
                            <span>{formatUsdtValue(buyer.totalAmountUsdt || 0)} USDT</span>
                            <span>{formatTimeAgo(buyer.latestPaymentConfirmedAt)}</span>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="font-mono text-lg font-semibold text-cyan-200">
                            {formatUsdtValue(buyer.currentUsdtBalance || 0)}
                          </div>
                          <div className="mt-1 text-[10px] font-medium uppercase tracking-[0.18em] text-cyan-300/70">
                            USDT
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-4 rounded-2xl border border-dashed border-white/10 bg-white/[0.03] px-4 py-6 text-sm text-slate-400">
                  미정산 구매자 지갑이 없습니다.
                </div>
              )}
            </article>
          </section>

          <section className="rounded-[28px] border border-rose-400/20 bg-[linear-gradient(180deg,rgba(33,10,15,0.96),rgba(18,7,10,1))] p-5 shadow-[0_28px_100px_-72px_rgba(244,63,94,0.4)]">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-rose-300/20 bg-rose-400/10 text-sm font-black text-rose-100">
                    !
                  </span>
                  <div>
                    <div className="text-sm font-semibold text-white">FDS 이상거래 탐지</div>
                    <div className="mt-1 text-xs leading-6 text-rose-100/75">
                      미해결 케이스만 · 최근 {Math.floor(BLOCKED_BUY_ORDERS_LOOKBACK_HOURS / 24)}일
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-center sm:grid-cols-4">
                <div className="rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3">
                  <div className="text-[10px] uppercase tracking-[0.18em] text-slate-400">Open</div>
                  <div className="mt-2 text-xl font-semibold text-white">{formatCount(blockedSnapshot.totalCount)}</div>
                </div>
                <div className="rounded-2xl border border-rose-300/20 bg-rose-400/10 px-4 py-3">
                  <div className="text-[10px] uppercase tracking-[0.18em] text-rose-100">High</div>
                  <div className="mt-2 text-xl font-semibold text-white">{formatCount(blockedSnapshot.criticalCount)}</div>
                </div>
                <div className="rounded-2xl border border-amber-300/20 bg-amber-400/10 px-4 py-3">
                  <div className="text-[10px] uppercase tracking-[0.18em] text-amber-100">Warning</div>
                  <div className="mt-2 text-xl font-semibold text-white">{formatCount(blockedSnapshot.warningCount)}</div>
                </div>
                <div className="rounded-2xl border border-cyan-300/20 bg-cyan-400/10 px-4 py-3">
                  <div className="text-[10px] uppercase tracking-[0.18em] text-cyan-100">Watch</div>
                  <div className="mt-2 text-xl font-semibold text-white">{formatCount(blockedSnapshot.infoCount)}</div>
                </div>
              </div>
            </div>

            {blockedSnapshot.orders.length > 0 ? (
              <div className="mt-5 grid gap-3 xl:grid-cols-2 2xl:grid-cols-3">
                {blockedSnapshot.orders.map((item, index) => {
                  const tone = getBlockedOrderToneClasses(item.tone);
                  const identity = item.tradeId || item.orderId || item.blockedKey;

                  return (
                    <article
                      key={`${item.blockedKey}-${index}`}
                      className={`rounded-[24px] border px-4 py-4 ${tone.card}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-sm font-bold text-white">
                              {identity || "-"}
                            </span>
                            <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${tone.badge}`}>
                              {getBlockedOrderSeverityLabel(item.severity)}
                            </span>
                          </div>
                          <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                            <span>{item.routeLabel || item.route || "-"}</span>
                            <span>·</span>
                            <span>{formatTimeAgo(item.latestBlockedAt)}</span>
                            <span>·</span>
                            <span>{formatCount(item.blockedCount || 0)}회</span>
                          </div>
                        </div>
                        <div className="text-right text-[11px] text-slate-400">
                          <div>주문 상태</div>
                          <div className="mt-1 font-semibold text-white">{item.status || "-"}</div>
                        </div>
                      </div>

                      <div className="mt-4 flex items-center justify-between gap-3">
                        <div className="min-w-0 flex items-center gap-2">
                          <Image
                            src={item.storeLogo || "/icon-store.png"}
                            alt={item.storeName || item.storecode || "Store"}
                            width={30}
                            height={30}
                            className="h-[30px] w-[30px] rounded-xl border border-white/10 bg-white object-cover"
                          />
                          <div className="min-w-0">
                            <div className="truncate text-sm font-semibold text-white">
                              {item.storeName || item.storecode || "가맹점 정보 없음"}
                            </div>
                            <div className="truncate text-xs text-slate-400">
                              {item.buyerNickname || item.buyerDepositName || "구매자 정보 없음"}
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="font-mono text-sm font-bold text-white">
                            {formatUsdtValue(item.amountUsdt || 0)} USDT
                          </div>
                          <div className="mt-1 text-[11px] text-slate-400">
                            {(Number(item.amountKrw || 0) || 0).toLocaleString()}원
                          </div>
                        </div>
                      </div>

                      <div className={`mt-4 rounded-2xl border px-3 py-3 ${tone.badge}`}>
                        <div className="text-[11px] font-semibold uppercase tracking-[0.18em]">
                          {item.latestReasonLabel || item.latestReason || "탐지 사유"}
                        </div>
                        <p className="mt-2 line-clamp-3 text-[12px] leading-5">
                          {item.latestReasonDetail || "-"}
                        </p>
                      </div>

                      <div className="mt-4 flex items-center justify-between gap-2 text-[11px] text-slate-400">
                        <span>{formatKstDateTime(item.latestBlockedAt)}</span>
                        <span className={`${tone.accent} font-semibold`}>
                          {item.settlementStatus || "-"}
                        </span>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="mt-5 rounded-2xl border border-dashed border-white/10 bg-white/[0.03] px-4 py-6 text-sm text-slate-400">
                현재 미해결 FDS 탐지 케이스가 없습니다.
              </div>
            )}
          </section>
        </>
      ) : null}
    </main>
  );
}
