"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { arbitrum, bsc, ethereum, polygon } from "thirdweb/chains";
import { ConnectButton, useActiveAccount } from "thirdweb/react";
import { inAppWallet } from "thirdweb/wallets";

import { client } from "@/app/client";
import { chain } from "@/app/config/contractAddresses";
import { postAdminSignedJson } from "@/lib/client/admin-signed-action";
import { useSuperadminSession } from "@/lib/client/use-superadmin-session";

type DashboardStoreItem = {
  storecode: string;
  storeName: string;
  storeLogo: string;
  settlementWalletAddress?: string | null;
  sellerWalletAddress?: string | null;
  privateSellerWalletAddress?: string | null;
  totalUsdtAmount: number;
  totalPaymentConfirmedCount: number;
};

type DashboardOverview = {
  generatedAt: string;
  counters: {
    totalStores: number;
    settlementReadyStores: number;
    sellerWalletConfiguredStores: number;
    privateSellerWalletConfiguredStores: number;
    verifiedServerWalletUsers: number;
    monitoredWalletCount: number;
    managedWebhookCount: number;
    activeWebhookCount: number;
    disabledWebhookCount: number;
  };
  rates: {
    settlementCoveragePercent: number;
    sellerWalletCoveragePercent: number;
    privateSellerWalletCoveragePercent: number;
    activeWebhookRatioPercent: number;
  };
  queues: {
    missingSettlementCount: number;
    missingSellerWalletCount: number;
    missingPrivateSellerWalletCount: number;
  };
  storesNeedingSettlement: DashboardStoreItem[];
  readyStores: DashboardStoreItem[];
};

const DASHBOARD_ROUTE = "/api/superadmin/dashboard";
const DASHBOARD_SIGNING_PREFIX = "stable-georgia:superadmin:dashboard:v1";
const wallets = [
  inAppWallet({
    auth: {
      options: ["email", "google"],
    },
  }),
];

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

const normalizeWalletText = (value: unknown) => {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
};

const formatCount = (value: unknown) => {
  const numeric = typeof value === "number" ? value : Number.parseInt(String(value || "0"), 10);
  return Number.isFinite(numeric) ? numeric.toLocaleString("ko-KR") : "0";
};

const formatPercent = (value: unknown) => {
  const numeric = typeof value === "number" ? value : Number.parseFloat(String(value || "0"));
  if (!Number.isFinite(numeric)) {
    return "0%";
  }
  return `${numeric.toLocaleString("ko-KR", { maximumFractionDigits: 1 })}%`;
};

const formatDateTime = (value: unknown) => {
  const text = typeof value === "string" ? value.trim() : "";
  if (!text) {
    return "-";
  }
  const date = new Date(text);
  if (Number.isNaN(date.getTime())) {
    return text;
  }
  return date.toLocaleString("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatCompactUsdt = (value: unknown) => {
  const numeric = typeof value === "number" ? value : Number.parseFloat(String(value || "0"));
  if (!Number.isFinite(numeric)) {
    return "0";
  }
  return numeric.toLocaleString("ko-KR", {
    maximumFractionDigits: 2,
  });
};

const metricCardClass =
  "rounded-[26px] border border-white/10 bg-[linear-gradient(180deg,rgba(14,21,37,0.92),rgba(8,12,22,0.98))] p-5 shadow-[0_28px_100px_-72px_rgba(15,23,42,0.95)]";

function DashboardMetricCard({
  eyebrow,
  title,
  value,
  detail,
  toneClass,
}: {
  eyebrow: string;
  title: string;
  value: string;
  detail: string;
  toneClass: string;
}) {
  return (
    <article className={metricCardClass}>
      <div className={`text-[11px] font-semibold uppercase tracking-[0.28em] ${toneClass}`}>
        {eyebrow}
      </div>
      <div className="mt-3 text-3xl font-semibold tracking-tight text-white">{value}</div>
      <div className="mt-2 text-sm font-medium text-slate-200">{title}</div>
      <div className="mt-3 text-sm leading-6 text-slate-400">{detail}</div>
    </article>
  );
}

function WalletStatusPill({
  label,
  active,
}: {
  label: string;
  active: boolean;
}) {
  return (
    <span
      className={`rounded-full border px-3 py-1 text-[11px] font-semibold ${
        active
          ? "border-emerald-300/25 bg-emerald-400/10 text-emerald-200"
          : "border-white/10 bg-white/[0.04] text-slate-400"
      }`}
    >
      {label}
    </span>
  );
}

export default function SuperadminHomePage() {
  const params = useParams<{ lang: string }>();
  const activeAccount = useActiveAccount();
  const { user, role, isSuperadmin, requesterWalletAddress, loading, error } =
    useSuperadminSession(activeAccount);
  const [dashboard, setDashboard] = useState<DashboardOverview | null>(null);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [dashboardError, setDashboardError] = useState("");
  const lang = params?.lang || "ko";
  const connectedWalletAddress = normalizeWalletText(activeAccount?.address);
  const authorizedWalletAddress = normalizeWalletText(requesterWalletAddress);
  const walletAddressMismatch = Boolean(
    connectedWalletAddress &&
      authorizedWalletAddress &&
      connectedWalletAddress !== authorizedWalletAddress,
  );

  const statusText = !activeAccount
    ? "지갑 연결 필요"
    : loading
      ? "권한 확인중"
      : isSuperadmin
        ? "Dashboard Ready"
        : "권한 없음";
  const canViewDashboard = Boolean(activeAccount && !loading && isSuperadmin);

  useEffect(() => {
    if (!activeAccount || !isSuperadmin) {
      setDashboard(null);
      setDashboardError("");
      setDashboardLoading(false);
      return;
    }

    let cancelled = false;

    const fetchDashboard = async () => {
      setDashboardLoading(true);
      try {
        const response = await postAdminSignedJson({
          account: activeAccount,
          route: DASHBOARD_ROUTE,
          signingPrefix: DASHBOARD_SIGNING_PREFIX,
          requesterStorecode: "superadmin",
          body: {},
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data?.error || "슈퍼어드민 대시보드를 불러오지 못했습니다.");
        }

        if (!cancelled) {
          setDashboard(data?.result || null);
          setDashboardError("");
        }
      } catch (nextError) {
        if (!cancelled) {
          setDashboard(null);
          setDashboardError(
            nextError instanceof Error
              ? nextError.message
              : "슈퍼어드민 대시보드를 불러오지 못했습니다.",
          );
        }
      } finally {
        if (!cancelled) {
          setDashboardLoading(false);
        }
      }
    };

    void fetchDashboard();

    return () => {
      cancelled = true;
    };
  }, [activeAccount, isSuperadmin]);

  const refreshDashboard = async () => {
    if (!activeAccount || !isSuperadmin) {
      return;
    }

    setDashboardLoading(true);
    try {
      const response = await postAdminSignedJson({
        account: activeAccount,
        route: DASHBOARD_ROUTE,
        signingPrefix: DASHBOARD_SIGNING_PREFIX,
        requesterStorecode: "superadmin",
        body: {},
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "슈퍼어드민 대시보드를 새로고침하지 못했습니다.");
      }

      setDashboard(data?.result || null);
      setDashboardError("");
    } catch (nextError) {
      setDashboardError(
        nextError instanceof Error
          ? nextError.message
          : "슈퍼어드민 대시보드를 새로고침하지 못했습니다.",
      );
    } finally {
      setDashboardLoading(false);
    }
  };

  return (
    <main className="flex flex-col gap-5">
      <section className="overflow-hidden rounded-[32px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.18),transparent_28%),radial-gradient(circle_at_78%_16%,rgba(251,191,36,0.14),transparent_18%),linear-gradient(135deg,rgba(8,15,31,0.96),rgba(5,9,18,0.98))] shadow-[0_54px_160px_-82px_rgba(8,145,178,0.42)]">
        <div className="grid gap-6 px-5 py-6 sm:px-7 lg:grid-cols-[minmax(0,1.4fr)_390px]">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.34em] text-cyan-300/85">
              Darknight Superadmin Dashboard
            </div>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-[38px]">
              루트 운영 현황을 한 화면에서 봅니다.
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300/82">
              가맹점 결제용 지갑주소 운영 상태, settlement wallet 커버리지, thirdweb webhook
              감시 상태, 조치가 필요한 가맹점을 superadmin 전용으로 요약한 대시보드입니다.
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1.5 text-xs font-semibold text-cyan-200">
                Settlement Control
              </span>
              <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-xs font-semibold text-slate-200">
                thirdweb Webhook Health
              </span>
              <span className="rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1.5 text-xs font-semibold text-amber-100">
                Darknight Ops Board
              </span>
            </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5 backdrop-blur">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">
                  Access Status
                </div>
                <div className="mt-3 inline-flex rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1.5 text-xs font-semibold text-cyan-200">
                  {statusText}
                </div>
              </div>

              <button
                type="button"
                onClick={() => void refreshDashboard()}
                disabled={!canViewDashboard || dashboardLoading}
                className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-xs font-semibold text-slate-100 transition hover:bg-white/[0.1] disabled:cursor-not-allowed disabled:text-slate-500"
              >
                {dashboardLoading ? "새로고침중..." : "Refresh"}
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
                  <div className="text-[11px] uppercase tracking-[0.22em] text-slate-500">Role</div>
                  <div className="mt-2 font-semibold text-white">{role || "-"}</div>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-[#0d1322] px-4 py-3">
                  <div className="text-[11px] uppercase tracking-[0.22em] text-slate-500">Operator</div>
                  <div className="mt-2 font-semibold text-white">
                    {String(user?.nickname || user?.name || "-")}
                  </div>
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-[#0d1322] px-4 py-3">
                <div className="text-[11px] uppercase tracking-[0.22em] text-slate-500">Last Snapshot</div>
                <div className="mt-2 font-semibold text-white">
                  {dashboard ? formatDateTime(dashboard.generatedAt) : "-"}
                </div>
              </div>

              {walletAddressMismatch ? (
                <div className="rounded-2xl border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-xs leading-6 text-amber-100">
                  연결된 지갑 주소와 서버가 권한 검증에 사용한 주소가 다릅니다. thirdweb active
                  account 또는 연결 세션을 다시 확인해야 합니다.
                </div>
              ) : null}
            </div>

            {error ? (
              <div className="mt-4 rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
                {error}
              </div>
            ) : null}
          </div>
        </div>
      </section>

      {!activeAccount ? (
        <section className="rounded-[26px] border border-amber-400/20 bg-amber-500/10 px-5 py-5 text-sm text-amber-100">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="font-medium text-amber-50">
                슈퍼어드민 대시보드를 보려면 먼저 지갑을 연결해야 합니다.
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
                accountAbstraction={{
                  chain:
                    chain === "ethereum"
                      ? ethereum
                      : chain === "polygon"
                        ? polygon
                        : chain === "arbitrum"
                          ? arbitrum
                          : chain === "bsc"
                            ? bsc
                            : arbitrum,
                  sponsorGas: true,
                }}
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
        </section>
      ) : null}

      {canViewDashboard && dashboardLoading && !dashboard ? (
        <section className="rounded-[28px] border border-white/10 bg-white/[0.04] px-5 py-6 text-sm text-slate-300">
          대시보드 집계 데이터를 불러오는 중입니다.
        </section>
      ) : null}

      {canViewDashboard && dashboardError ? (
        <section className="rounded-[28px] border border-rose-400/20 bg-rose-500/10 px-5 py-5 text-sm text-rose-100">
          {dashboardError}
        </section>
      ) : null}

      {canViewDashboard && dashboard ? (
        <>
          <section className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
            <DashboardMetricCard
              eyebrow="Network"
              title="전체 가맹점"
              value={formatCount(dashboard.counters.totalStores)}
              detail={`조치 필요 ${formatCount(dashboard.queues.missingSettlementCount)}개`}
              toneClass="text-cyan-300/90"
            />
            <DashboardMetricCard
              eyebrow="Settlement"
              title="결제용 지갑 커버리지"
              value={formatPercent(dashboard.rates.settlementCoveragePercent)}
              detail={`${formatCount(dashboard.counters.settlementReadyStores)} / ${formatCount(dashboard.counters.totalStores)} stores`}
              toneClass="text-emerald-300/90"
            />
            <DashboardMetricCard
              eyebrow="Wallet Pool"
              title="감시 중인 store wallet"
              value={formatCount(dashboard.counters.monitoredWalletCount)}
              detail={`verified server wallet users ${formatCount(dashboard.counters.verifiedServerWalletUsers)}명`}
              toneClass="text-amber-200/90"
            />
            <DashboardMetricCard
              eyebrow="Webhook"
              title="thirdweb webhook 정상 비율"
              value={formatPercent(dashboard.rates.activeWebhookRatioPercent)}
              detail={`active ${formatCount(dashboard.counters.activeWebhookCount)} / total ${formatCount(dashboard.counters.managedWebhookCount)}`}
              toneClass="text-fuchsia-200/85"
            />
          </section>

          <section className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_380px]">
            <article className="rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(13,20,35,0.95),rgba(7,11,20,0.98))] p-5 shadow-[0_42px_130px_-82px_rgba(14,165,233,0.42)]">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.3em] text-cyan-300/85">
                    Control Radar
                  </div>
                  <h3 className="mt-2 text-2xl font-semibold text-white">운영 지갑 커버리지</h3>
                  <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-400">
                    결제용 settlement wallet, seller wallet, private seller wallet, webhook 상태를
                    한 번에 점검할 수 있는 루트 관제 보드입니다.
                  </p>
                </div>

                <Link
                  href={`/${lang}/superadmin/store-payment-wallets`}
                  className="inline-flex items-center rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-slate-100"
                >
                  결제용 지갑 모듈 열기
                </Link>
              </div>

              <div className="mt-6 grid gap-4 lg:grid-cols-2">
                <div className="rounded-[24px] border border-white/10 bg-[#0d1322] p-5">
                  <div className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Coverage</div>
                  <div className="mt-4 space-y-4">
                    {[
                      {
                        label: "Settlement Wallet",
                        percent: dashboard.rates.settlementCoveragePercent,
                        tone: "bg-cyan-300",
                      },
                      {
                        label: "Seller Wallet",
                        percent: dashboard.rates.sellerWalletCoveragePercent,
                        tone: "bg-emerald-300",
                      },
                      {
                        label: "Private Seller Wallet",
                        percent: dashboard.rates.privateSellerWalletCoveragePercent,
                        tone: "bg-amber-300",
                      },
                      {
                        label: "Webhook Active",
                        percent: dashboard.rates.activeWebhookRatioPercent,
                        tone: "bg-fuchsia-300",
                      },
                    ].map((item) => (
                      <div key={item.label}>
                        <div className="flex items-center justify-between gap-3 text-sm">
                          <span className="font-medium text-slate-200">{item.label}</span>
                          <span className="text-slate-400">{formatPercent(item.percent)}</span>
                        </div>
                        <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-white/10">
                          <div
                            className={`h-full rounded-full ${item.tone}`}
                            style={{ width: `${Math.min(Math.max(item.percent, 0), 100)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-[24px] border border-white/10 bg-[#0d1322] p-5">
                  <div className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Action Queue</div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl border border-rose-300/20 bg-rose-500/10 px-4 py-4">
                      <div className="text-[11px] uppercase tracking-[0.22em] text-rose-200/80">
                        Missing Settlement
                      </div>
                      <div className="mt-3 text-2xl font-semibold text-white">
                        {formatCount(dashboard.queues.missingSettlementCount)}
                      </div>
                    </div>
                    <div className="rounded-2xl border border-amber-300/20 bg-amber-500/10 px-4 py-4">
                      <div className="text-[11px] uppercase tracking-[0.22em] text-amber-100/80">
                        Missing Seller
                      </div>
                      <div className="mt-3 text-2xl font-semibold text-white">
                        {formatCount(dashboard.queues.missingSellerWalletCount)}
                      </div>
                    </div>
                    <div className="rounded-2xl border border-cyan-300/20 bg-cyan-500/10 px-4 py-4">
                      <div className="text-[11px] uppercase tracking-[0.22em] text-cyan-100/80">
                        Missing Private
                      </div>
                      <div className="mt-3 text-2xl font-semibold text-white">
                        {formatCount(dashboard.queues.missingPrivateSellerWalletCount)}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm leading-7 text-slate-300">
                    결제용 지갑 생성/재배정은 가맹점별 module 01에서 처리하고, 홈에서는 가장 급한 누락 대상과
                    webhook 감시 상태를 먼저 확인하는 흐름으로 구성했습니다.
                  </div>
                </div>
              </div>
            </article>

            <article className="rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(12,18,33,0.95),rgba(7,10,18,0.98))] p-5">
              <div className="text-[11px] font-semibold uppercase tracking-[0.3em] text-amber-200/85">
                Quick Actions
              </div>
              <h3 className="mt-2 text-2xl font-semibold text-white">루트 운영 바로가기</h3>

              <div className="mt-5 space-y-3">
                <Link
                  href={`/${lang}/superadmin/store-payment-wallets`}
                  className="block rounded-[24px] border border-white/10 bg-[#0d1322] p-4 transition hover:border-cyan-300/35 hover:bg-cyan-500/10"
                >
                  <div className="text-sm font-semibold text-white">가맹점 결제용 지갑주소</div>
                  <div className="mt-2 text-sm leading-6 text-slate-400">
                    settlement wallet 생성, 검증된 smart account 재배정, candidate 상태 점검
                  </div>
                </Link>

                <div className="rounded-[24px] border border-white/10 bg-[#0d1322] p-4">
                  <div className="text-sm font-semibold text-white">Webhook 감시 메모</div>
                  <div className="mt-2 text-sm leading-6 text-slate-400">
                    thirdweb managed webhook 총 {formatCount(dashboard.counters.managedWebhookCount)}개,
                    disabled {formatCount(dashboard.counters.disabledWebhookCount)}개입니다.
                  </div>
                </div>

                <div className="rounded-[24px] border border-white/10 bg-[#0d1322] p-4">
                  <div className="text-sm font-semibold text-white">Wallet Inventory</div>
                  <div className="mt-2 text-sm leading-6 text-slate-400">
                    verified server wallet user {formatCount(dashboard.counters.verifiedServerWalletUsers)}명,
                    monitored wallet {formatCount(dashboard.counters.monitoredWalletCount)}개
                  </div>
                </div>
              </div>
            </article>
          </section>

          <section className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
            <article className="rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(12,18,32,0.95),rgba(7,10,19,0.98))] p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.3em] text-rose-200/85">
                    Attention Queue
                  </div>
                  <h3 className="mt-2 text-2xl font-semibold text-white">결제용 지갑 조치 필요 가맹점</h3>
                </div>
                <div className="rounded-full border border-rose-300/20 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-100">
                  {formatCount(dashboard.queues.missingSettlementCount)} stores
                </div>
              </div>

              <div className="mt-5 space-y-3">
                {dashboard.storesNeedingSettlement.length === 0 ? (
                  <div className="rounded-[24px] border border-dashed border-white/10 bg-[#0d1322] px-5 py-6 text-sm text-slate-400">
                    settlement wallet 누락 가맹점이 없습니다.
                  </div>
                ) : (
                  dashboard.storesNeedingSettlement.map((store) => (
                    <div
                      key={store.storecode}
                      className="rounded-[24px] border border-white/10 bg-[#0d1322] p-4"
                    >
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                          <div className="text-lg font-semibold text-white">
                            {store.storeName || store.storecode}
                          </div>
                          <div className="mt-1 text-sm text-slate-500">{store.storecode}</div>
                        </div>

                        <Link
                          href={`/${lang}/superadmin/store-payment-wallets`}
                          className="inline-flex items-center rounded-full border border-cyan-300/25 bg-cyan-500/10 px-3 py-1.5 text-xs font-semibold text-cyan-100 transition hover:bg-cyan-500/15"
                        >
                          모듈로 이동
                        </Link>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        <WalletStatusPill label="seller" active={Boolean(store.sellerWalletAddress)} />
                        <WalletStatusPill
                          label="private seller"
                          active={Boolean(store.privateSellerWalletAddress)}
                        />
                        <WalletStatusPill
                          label="settlement"
                          active={Boolean(store.settlementWalletAddress)}
                        />
                      </div>

                      <div className="mt-4 grid gap-3 md:grid-cols-2">
                        <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
                          <div className="text-[11px] uppercase tracking-[0.22em] text-slate-500">
                            누적 거래량
                          </div>
                          <div className="mt-2 font-semibold text-white">
                            {formatCompactUsdt(store.totalUsdtAmount)} USDT
                          </div>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
                          <div className="text-[11px] uppercase tracking-[0.22em] text-slate-500">
                            결제확정 건수
                          </div>
                          <div className="mt-2 font-semibold text-white">
                            {formatCount(store.totalPaymentConfirmedCount)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </article>

            <article className="rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(12,18,32,0.95),rgba(7,10,19,0.98))] p-5">
              <div className="text-[11px] font-semibold uppercase tracking-[0.3em] text-emerald-200/85">
                Ready Stores
              </div>
              <h3 className="mt-2 text-2xl font-semibold text-white">정상 settlement wallet 보유</h3>

              <div className="mt-5 space-y-3">
                {dashboard.readyStores.length === 0 ? (
                  <div className="rounded-[24px] border border-dashed border-white/10 bg-[#0d1322] px-5 py-6 text-sm text-slate-400">
                    아직 정상 settlement wallet 보유 가맹점이 없습니다.
                  </div>
                ) : (
                  dashboard.readyStores.map((store) => (
                    <div
                      key={store.storecode}
                      className="rounded-[24px] border border-white/10 bg-[#0d1322] p-4"
                    >
                      <div className="text-sm font-semibold text-white">
                        {store.storeName || store.storecode}
                      </div>
                      <div className="mt-1 text-xs text-slate-500">{store.storecode}</div>
                      <div className="mt-3 text-xs text-slate-400">
                        {truncateWallet(store.settlementWalletAddress)}
                      </div>
                      <div className="mt-3 flex items-center justify-between gap-3 text-xs text-slate-400">
                        <span>{formatCompactUsdt(store.totalUsdtAmount)} USDT</span>
                        <span>{formatCount(store.totalPaymentConfirmedCount)} orders</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </article>
          </section>
        </>
      ) : null}
    </main>
  );
}
