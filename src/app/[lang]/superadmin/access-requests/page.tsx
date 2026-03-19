"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ConnectButton, useActiveAccount } from "thirdweb/react";
import { inAppWallet } from "thirdweb/wallets";

import { client } from "@/app/client";
import { postAdminSignedJson } from "@/lib/client/admin-signed-action";
import { useSuperadminSession } from "@/lib/client/use-superadmin-session";

type AccessRequestItem = {
  id: string;
  status: string;
  requesterWalletAddress: string;
  requesterStorecode?: string | null;
  requesterNickname?: string | null;
  requesterEmail?: string | null;
  note?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  approvedAt?: string | null;
  approvedByWalletAddress?: string | null;
  approvedByNickname?: string | null;
  approvedByStorecode?: string | null;
  approvedRoleScope?: string | null;
};

type AccessRequestOverview = {
  pending: AccessRequestItem[];
  recent: AccessRequestItem[];
  generatedAt?: string | null;
};

const LIST_ROUTE = "/api/superadmin/access-requests/list";
const LIST_SIGNING_PREFIX = "stable-georgia:superadmin:access-requests:list:v1";
const APPROVE_ROUTE = "/api/superadmin/access-requests/approve";
const APPROVE_SIGNING_PREFIX = "stable-georgia:superadmin:access-requests:approve:v1";

const wallets = [
  inAppWallet({
    auth: {
      options: ["email", "google"],
    },
  }),
];

const normalizeWalletText = (value: unknown) =>
  typeof value === "string" ? value.trim().toLowerCase() : "";

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

const formatTimeAgo = (value: unknown) => {
  const text = typeof value === "string" ? value.trim() : "";
  if (!text) {
    return "-";
  }
  const date = new Date(text);
  if (Number.isNaN(date.getTime())) {
    return text;
  }
  const diff = Date.now() - date.getTime();
  if (diff < 60_000) return "방금 전";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}분 전`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}시간 전`;
  return `${Math.floor(diff / 86_400_000)}일 전`;
};

const statusToneClass = (status: string) => {
  switch (status) {
    case "approved":
      return "border-emerald-300/30 bg-emerald-400/10 text-emerald-100";
    case "rejected":
      return "border-rose-300/30 bg-rose-400/10 text-rose-100";
    default:
      return "border-amber-300/30 bg-amber-400/10 text-amber-100";
  }
};

export default function SuperadminAccessRequestsPage() {
  const params = useParams<{ lang: string }>();
  const activeAccount = useActiveAccount();
  const { isSuperadmin, requesterWalletAddress, loading, error } =
    useSuperadminSession(activeAccount);
  const lang = params?.lang || "ko";
  const [overview, setOverview] = useState<AccessRequestOverview>({
    pending: [],
    recent: [],
    generatedAt: "",
  });
  const [pageLoading, setPageLoading] = useState(false);
  const [pageError, setPageError] = useState("");
  const [approvingId, setApprovingId] = useState("");
  const connectedWalletAddress = normalizeWalletText(activeAccount?.address);
  const authorizedWalletAddress = normalizeWalletText(requesterWalletAddress);

  const refreshOverview = useCallback(async () => {
    if (!activeAccount || !isSuperadmin) {
      setOverview({
        pending: [],
        recent: [],
        generatedAt: "",
      });
      setPageLoading(false);
      setPageError("");
      return;
    }

    setPageLoading(true);
    try {
      const response = await postAdminSignedJson({
        account: activeAccount,
        route: LIST_ROUTE,
        signingPrefix: LIST_SIGNING_PREFIX,
        requesterStorecode: "superadmin",
        body: {},
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "권한 요청 목록을 불러오지 못했습니다.");
      }

      setOverview(data?.result || { pending: [], recent: [], generatedAt: "" });
      setPageError("");
    } catch (nextError) {
      setPageError(nextError instanceof Error ? nextError.message : "권한 요청 목록을 불러오지 못했습니다.");
    } finally {
      setPageLoading(false);
    }
  }, [activeAccount, isSuperadmin]);

  useEffect(() => {
    void refreshOverview();
  }, [refreshOverview]);

  const handleApprove = useCallback(
    async (requestId: string) => {
      if (!activeAccount || !isSuperadmin || !requestId) {
        return;
      }

      setApprovingId(requestId);
      try {
        const response = await postAdminSignedJson({
          account: activeAccount,
          route: APPROVE_ROUTE,
          signingPrefix: APPROVE_SIGNING_PREFIX,
          requesterStorecode: "superadmin",
          body: {
            requestId,
          },
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data?.error || "권한 요청 승인에 실패했습니다.");
        }

        await refreshOverview();
      } catch (nextError) {
        setPageError(nextError instanceof Error ? nextError.message : "권한 요청 승인에 실패했습니다.");
      } finally {
        setApprovingId("");
      }
    },
    [activeAccount, isSuperadmin, refreshOverview],
  );

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(14,21,37,0.94),rgba(8,12,22,0.98))] px-5 py-6 shadow-[0_32px_120px_-68px_rgba(15,23,42,0.95)]">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.32em] text-fuchsia-200/90">
              Superadmin Access
            </div>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white">
              관리자권한 승인함
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300/80">
              권한 요청 지갑을 검토하고 `superadmin` 권한을 승인하는 운영 페이지입니다.
              요청 승인 시 대상 지갑의 `users.role`이 `superadmin`으로 갱신됩니다.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/${lang}/superadmin`}
              className="rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-white/20 hover:bg-white/[0.1]"
            >
              대시보드
            </Link>
            <Link
              href={`/${lang}/superadmin/buyorder-watch`}
              className="rounded-full border border-cyan-400/25 bg-cyan-400/10 px-4 py-2 text-sm font-medium text-cyan-100 transition hover:border-cyan-300/40 hover:bg-cyan-400/15"
            >
              Buyorder Watch
            </Link>
          </div>
        </div>
      </section>

      {!activeAccount ? (
        <section className="rounded-[26px] border border-amber-400/20 bg-amber-500/10 px-5 py-5 text-sm text-amber-100">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="font-medium text-amber-50">
                승인 페이지를 보려면 먼저 지갑을 연결해야 합니다.
              </div>
              <div className="mt-2 text-sm leading-6 text-amber-100/80">
                superadmin 지갑으로 연결해야 요청 목록과 승인 버튼이 열립니다.
              </div>
            </div>

            <ConnectButton
              client={client}
              wallets={wallets}
              showAllWallets={false}
              theme="dark"
              connectButton={{
                label: "지갑 연결",
                style: {
                  background:
                    "linear-gradient(135deg, rgba(244,114,182,0.92), rgba(192,38,211,0.92))",
                  color: "#f8fafc",
                  borderRadius: "999px",
                  padding: "0 18px",
                  height: "44px",
                  fontSize: "14px",
                  fontWeight: 700,
                  boxShadow: "0 14px 40px -18px rgba(217,70,239,0.6)",
                },
              }}
              connectModal={{
                size: "wide",
                title: "Superadmin Access Connect",
                titleIcon: "https://www.stable.makeup/logo.png",
                showThirdwebBranding: false,
              }}
              locale="ko_KR"
            />
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
          현재 지갑에는 `superadmin` 권한이 없어서 승인 페이지를 사용할 수 없습니다.
          <div className="mt-3 text-xs leading-6 text-rose-100/80">
            Connected: {connectedWalletAddress || "-"}
          </div>
          <div className="text-xs leading-6 text-rose-100/80">
            Auth checked: {authorizedWalletAddress || "권한 확인 실패"}
          </div>
          {error ? <div className="mt-3 text-xs leading-6 text-rose-100/80">Error: {error}</div> : null}
        </section>
      ) : null}

      {isSuperadmin ? (
        <>
          <section className="grid gap-4 md:grid-cols-3">
            <article className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5">
              <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-fuchsia-200/90">
                Pending
              </div>
              <div className="mt-3 text-3xl font-semibold tracking-tight text-white">
                {overview.pending.length.toLocaleString("ko-KR")}
              </div>
              <div className="mt-2 text-sm text-slate-400">승인 대기 중인 요청 수</div>
            </article>
            <article className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5">
              <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-emerald-200/90">
                Recent Decisions
              </div>
              <div className="mt-3 text-3xl font-semibold tracking-tight text-white">
                {overview.recent.length.toLocaleString("ko-KR")}
              </div>
              <div className="mt-2 text-sm text-slate-400">최근 처리된 승인 이력 수</div>
            </article>
            <article className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5">
              <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-cyan-200/90">
                Last Refresh
              </div>
              <div className="mt-3 text-lg font-semibold tracking-tight text-white">
                {formatDateTime(overview.generatedAt)}
              </div>
              <div className="mt-2 text-sm text-slate-400">현재 서버 기준 동기화 시각</div>
            </article>
          </section>

          {pageError ? (
            <section className="rounded-[24px] border border-rose-400/20 bg-rose-500/10 px-5 py-4 text-sm text-rose-100">
              {pageError}
            </section>
          ) : null}

          <section className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5 shadow-[0_28px_120px_-80px_rgba(15,23,42,0.95)]">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-amber-200/90">
                  Pending Queue
                </div>
                <h3 className="mt-2 text-xl font-semibold text-white">관리자권한 요청 대기열</h3>
              </div>
              <button
                type="button"
                onClick={() => void refreshOverview()}
                className="rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-white/20 hover:bg-white/[0.1]"
              >
                새로고침
              </button>
            </div>

            {pageLoading ? (
              <div className="mt-5 rounded-[22px] border border-cyan-400/20 bg-cyan-500/10 px-5 py-4 text-sm text-cyan-100">
                권한 요청 목록을 불러오는 중입니다.
              </div>
            ) : overview.pending.length === 0 ? (
              <div className="mt-5 rounded-[22px] border border-white/10 bg-white/[0.03] px-5 py-6 text-sm text-slate-400">
                현재 승인 대기 중인 관리자권한 요청이 없습니다.
              </div>
            ) : (
              <div className="mt-5 grid gap-4 lg:grid-cols-2">
                {overview.pending.map((item) => (
                  <article
                    key={item.id}
                    className="rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(16,24,39,0.94),rgba(8,12,22,0.98))] p-5"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="text-[11px] font-semibold uppercase tracking-[0.26em] text-fuchsia-200/90">
                          {item.requesterStorecode || "unknown-store"}
                        </div>
                        <div className="mt-2 text-lg font-semibold text-white">
                          {item.requesterNickname || "닉네임 없음"}
                        </div>
                        <div className="mt-1 text-sm text-slate-400">
                          {truncateWallet(item.requesterWalletAddress)}
                        </div>
                      </div>

                      <span className={`rounded-full border px-3 py-1 text-[11px] font-semibold ${statusToneClass(item.status)}`}>
                        {item.status === "pending" ? "승인대기" : item.status}
                      </span>
                    </div>

                    <div className="mt-4 grid gap-3 text-sm text-slate-300 sm:grid-cols-2">
                      <div>
                        <div className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Email</div>
                        <div className="mt-1 text-slate-200">{item.requesterEmail || "-"}</div>
                      </div>
                      <div>
                        <div className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Requested</div>
                        <div className="mt-1 text-slate-200">{formatDateTime(item.createdAt)}</div>
                        <div className="text-xs text-slate-500">{formatTimeAgo(item.createdAt)}</div>
                      </div>
                    </div>

                    <div className="mt-4 rounded-[18px] border border-white/10 bg-white/[0.04] px-4 py-3">
                      <div className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Note</div>
                      <div className="mt-2 text-sm leading-6 text-slate-300">
                        {item.note || "요청 메모 없음"}
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                      <div className="text-xs leading-5 text-slate-500">
                        요청 ID: {item.id}
                      </div>
                      <button
                        type="button"
                        onClick={() => void handleApprove(item.id)}
                        disabled={approvingId === item.id}
                        className="rounded-full border border-emerald-300/25 bg-emerald-400/10 px-4 py-2 text-sm font-semibold text-emerald-100 transition hover:border-emerald-200/40 hover:bg-emerald-400/15 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {approvingId === item.id ? "승인 처리 중..." : "superadmin 승인"}
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5 shadow-[0_28px_120px_-80px_rgba(15,23,42,0.95)]">
            <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-cyan-200/90">
              Recent Activity
            </div>
            <h3 className="mt-2 text-xl font-semibold text-white">최근 승인 이력</h3>

            {overview.recent.length === 0 ? (
              <div className="mt-5 rounded-[22px] border border-white/10 bg-white/[0.03] px-5 py-6 text-sm text-slate-400">
                최근 처리된 권한 요청 이력이 없습니다.
              </div>
            ) : (
              <div className="mt-5 overflow-x-auto">
                <table className="min-w-full text-left text-sm text-slate-200">
                  <thead>
                    <tr className="text-[11px] uppercase tracking-[0.24em] text-slate-500">
                      <th className="px-3 py-3 font-medium">상태</th>
                      <th className="px-3 py-3 font-medium">요청자</th>
                      <th className="px-3 py-3 font-medium">지갑</th>
                      <th className="px-3 py-3 font-medium">처리시각</th>
                      <th className="px-3 py-3 font-medium">승인자</th>
                    </tr>
                  </thead>
                  <tbody>
                    {overview.recent.map((item) => (
                      <tr key={item.id} className="border-t border-white/6">
                        <td className="px-3 py-3">
                          <span className={`rounded-full border px-3 py-1 text-[11px] font-semibold ${statusToneClass(item.status)}`}>
                            {item.status === "approved" ? "승인됨" : item.status}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          <div className="font-medium text-white">{item.requesterNickname || "-"}</div>
                          <div className="text-xs text-slate-500">{item.requesterStorecode || "-"}</div>
                        </td>
                        <td className="px-3 py-3 font-mono text-xs text-slate-300">
                          {truncateWallet(item.requesterWalletAddress)}
                        </td>
                        <td className="px-3 py-3 text-slate-300">
                          {formatDateTime(item.approvedAt || item.updatedAt)}
                        </td>
                        <td className="px-3 py-3">
                          <div className="font-medium text-white">{item.approvedByNickname || "-"}</div>
                          <div className="text-xs text-slate-500">
                            {item.approvedByStorecode || "-"} · {truncateWallet(item.approvedByWalletAddress)}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      ) : null}
    </div>
  );
}
