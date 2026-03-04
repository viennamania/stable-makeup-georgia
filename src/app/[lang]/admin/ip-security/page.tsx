"use client";

import { useEffect, useMemo, useState } from "react";
import { useActiveAccount } from "thirdweb/react";
import { toast } from "react-hot-toast";

import { postAdminSignedJson } from "@/lib/client/admin-signed-action";

type RangeKey = "today" | "yesterday" | "dayBeforeYesterday" | "all";

type IpAccessLog = {
  _id?: string;
  ip?: string;
  pathname?: string;
  method?: string;
  country?: string | null;
  blocked?: boolean;
  blockReason?: string | null;
  userAgent?: string | null;
  referer?: string | null;
  createdAt?: string;
};

type TopIpStat = {
  ip?: string;
  count?: number;
  blockedCount?: number;
  lastSeenAt?: string;
  countries?: string[];
  currentlyBlocked?: boolean;
  blockedReason?: string | null;
};

type BlockedIpRule = {
  _id?: string;
  ip?: string;
  enabled?: boolean;
  reason?: string | null;
  blockedAt?: string;
  updatedAt?: string;
  expiresAt?: string | null;
};

const DASHBOARD_ROUTE = "/api/security/ip-monitor/getDashboard";
const DASHBOARD_SIGNING_PREFIX = "stable-georgia:ip-security-dashboard:v1";
const SET_BLOCK_ROUTE = "/api/security/ip-monitor/setBlock";
const SET_BLOCK_SIGNING_PREFIX = "stable-georgia:ip-security-block:v1";

const rangeOptions: { key: RangeKey; label: string }[] = [
  { key: "today", label: "오늘" },
  { key: "yesterday", label: "어제" },
  { key: "dayBeforeYesterday", label: "그제" },
  { key: "all", label: "전체" },
];

const parseDate = (value: unknown) => {
  if (!value) return null;
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date;
};

const formatDateTime = (value: unknown) => {
  const date = parseDate(value);
  if (!date) return "-";
  return date.toLocaleString("ko-KR", { timeZone: "Asia/Seoul" });
};

const formatRelative = (value: unknown) => {
  const date = parseDate(value);
  if (!date) return "-";
  const diffMs = Date.now() - date.getTime();
  const future = diffMs < 0;
  const diff = Math.abs(diffMs);
  const sec = Math.floor(diff / 1000);
  const min = Math.floor(sec / 60);
  const hour = Math.floor(min / 60);
  const day = Math.floor(hour / 24);
  const suffix = future ? "후" : "전";
  if (sec < 60) return `${sec}초 ${suffix}`;
  if (min < 60) return `${min}분 ${suffix}`;
  if (hour < 24) return `${hour}시간 ${suffix}`;
  return `${day}일 ${suffix}`;
};

const normalizeText = (value: unknown) => {
  const text = String(value || "").trim();
  return text || "-";
};

export default function AdminIpSecurityPage() {
  const activeAccount = useActiveAccount();
  const walletAddress = activeAccount?.address || "";

  const [logs, setLogs] = useState<IpAccessLog[]>([]);
  const [topIps, setTopIps] = useState<TopIpStat[]>([]);
  const [blockedIps, setBlockedIps] = useState<BlockedIpRule[]>([]);
  const [range, setRange] = useState<RangeKey>("today");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(100);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [fetchedAt, setFetchedAt] = useState<Date | null>(null);
  const [blockIpInput, setBlockIpInput] = useState("");
  const [blockReasonInput, setBlockReasonInput] = useState(
    "Suspicious API activity detected",
  );
  const [savingBlock, setSavingBlock] = useState(false);

  const fetchDashboard = async () => {
    if (!activeAccount || loading) {
      return;
    }

    setLoading(true);
    try {
      const response = await postAdminSignedJson({
        account: activeAccount,
        route: DASHBOARD_ROUTE,
        signingPrefix: DASHBOARD_SIGNING_PREFIX,
        body: {
          range,
          search,
          page,
          limit,
        },
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "failed_to_fetch_dashboard");
      }

      const result = data?.result || {};
      setLogs(result?.logs || []);
      setTopIps(result?.topIps || []);
      setBlockedIps(result?.blockedIps || []);
      setTotalCount(Number(result?.totalCount || 0));
      setTotalPages(Number(result?.totalPages || 1));
      setFetchedAt(new Date());
    } catch (error) {
      console.error(error);
      toast.error("IP 보안 로그 조회에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const updateBlockRule = async ({
    ip,
    enabled,
    reason,
  }: {
    ip: string;
    enabled: boolean;
    reason: string;
  }) => {
    if (!activeAccount || savingBlock) {
      return;
    }

    setSavingBlock(true);
    try {
      const response = await postAdminSignedJson({
        account: activeAccount,
        route: SET_BLOCK_ROUTE,
        signingPrefix: SET_BLOCK_SIGNING_PREFIX,
        body: {
          ip,
          enabled,
          reason,
        },
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "failed_to_update_ip_block");
      }

      toast.success(enabled ? "IP 차단 처리 완료" : "IP 차단 해제 완료");
      if (enabled) {
        setBlockIpInput("");
      }
      await fetchDashboard();
    } catch (error) {
      console.error(error);
      toast.error("IP 차단 설정 저장에 실패했습니다.");
    } finally {
      setSavingBlock(false);
    }
  };

  useEffect(() => {
    if (!activeAccount) return;
    fetchDashboard();
    const timer = setInterval(fetchDashboard, 20_000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeAccount, range, page, limit]);

  useEffect(() => {
    setPage(1);
  }, [search, range, limit]);

  const activeBlockedIps = useMemo(() => {
    return blockedIps.filter((item) => Boolean(item?.enabled));
  }, [blockedIps]);

  return (
    <main className="w-full px-3 sm:px-4 md:px-6 lg:px-10 pb-10">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 bg-gradient-to-r from-zinc-900 via-rose-900 to-zinc-900 text-white rounded-2xl p-4 shadow-lg shadow-zinc-900/40">
          <div>
            <div className="text-xs uppercase tracking-[0.14em] text-rose-200">Security Monitor</div>
            <div className="text-xl font-bold">퍼블릭 IP 보안 모니터링 / 차단 관리</div>
            <div className="text-xs text-slate-300 mt-1">
              collections: apiAccessLogs / blockedPublicIps
            </div>
          </div>
          <div className="flex items-center gap-2 bg-white/10 rounded-lg px-2 py-1 border border-white/10">
            {rangeOptions.map((option) => {
              const active = option.key === range;
              return (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => setRange(option.key)}
                  className={`px-3 py-1.5 text-sm font-semibold rounded-md transition-all ${
                    active ? "bg-white text-slate-900 shadow" : "text-slate-200 hover:bg-white/10"
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>

        {!walletAddress ? (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
            관리자 지갑 연결 후 IP 보안 모니터링을 조회할 수 있습니다.
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg border border-zinc-200 p-4 flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm text-zinc-500">표시</span>
              <span className="text-2xl font-black text-zinc-900">{logs.length.toLocaleString("ko-KR")}건</span>
              <span className="text-xs text-zinc-400">
                / 전체 {totalCount.toLocaleString("ko-KR")}건
              </span>
              <span className="text-xs text-zinc-400">
                페이지 {page.toLocaleString("ko-KR")} / {totalPages.toLocaleString("ko-KR")}
              </span>
              <span className="text-xs text-zinc-400">
                활성 차단 IP: {activeBlockedIps.length.toLocaleString("ko-KR")}개
              </span>
              <span className="text-xs text-zinc-400">
                {fetchedAt ? `업데이트: ${formatDateTime(fetchedAt)}` : "업데이트 대기중..."}
              </span>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-3">
              <div className="xl:col-span-2 rounded-xl border border-zinc-200 bg-zinc-50 p-3 flex flex-col gap-2">
                <div className="text-sm font-bold text-zinc-800">의심 IP 직접 차단</div>
                <div className="flex flex-col lg:flex-row gap-2">
                  <input
                    value={blockIpInput}
                    onChange={(event) => setBlockIpInput(event.target.value)}
                    placeholder="차단할 퍼블릭 IP 입력"
                    className="w-full lg:w-64 border border-zinc-300 rounded-lg px-3 py-2 text-sm text-zinc-800"
                  />
                  <input
                    value={blockReasonInput}
                    onChange={(event) => setBlockReasonInput(event.target.value)}
                    placeholder="차단 사유"
                    className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm text-zinc-800"
                  />
                  <button
                    type="button"
                    disabled={savingBlock || !blockIpInput.trim()}
                    onClick={() =>
                      updateBlockRule({
                        ip: blockIpInput.trim(),
                        enabled: true,
                        reason: blockReasonInput.trim() || "manual_block",
                      })
                    }
                    className="px-4 py-2 rounded-lg text-sm font-semibold bg-rose-700 text-white hover:bg-rose-600 disabled:opacity-60"
                  >
                    {savingBlock ? "처리중..." : "차단 등록"}
                  </button>
                </div>
              </div>

              <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 flex flex-col gap-2">
                <div className="text-sm font-bold text-zinc-800">검색 / 페이지</div>
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="IP / 라우트 / 국가 / 사유 검색"
                  className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm text-zinc-800"
                />
                <div className="flex gap-2">
                  <select
                    value={String(limit)}
                    onChange={(event) => setLimit(Number(event.target.value) || 100)}
                    className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm text-zinc-800 bg-white"
                  >
                    <option value="50">50개</option>
                    <option value="100">100개</option>
                    <option value="200">200개</option>
                  </select>
                  <button
                    type="button"
                    onClick={fetchDashboard}
                    disabled={loading}
                    className="px-4 py-2 rounded-lg text-sm font-semibold bg-zinc-900 text-white hover:bg-zinc-800 disabled:opacity-60"
                  >
                    {loading ? "조회중..." : "새로고침"}
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
              <div className="rounded-xl border border-zinc-200 overflow-x-auto">
                <div className="px-3 py-2 bg-zinc-100 text-sm font-bold text-zinc-700">상위 호출 IP</div>
                <table className="min-w-[680px] w-full text-sm">
                  <thead className="bg-zinc-50 text-zinc-700">
                    <tr>
                      <th className="px-3 py-2 text-left">IP</th>
                      <th className="px-3 py-2 text-left">호출수</th>
                      <th className="px-3 py-2 text-left">차단호출</th>
                      <th className="px-3 py-2 text-left">마지막 호출</th>
                      <th className="px-3 py-2 text-left">상태</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topIps.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-3 py-8 text-center text-zinc-500">
                          데이터가 없습니다.
                        </td>
                      </tr>
                    )}
                    {topIps.map((item) => (
                      <tr key={`top-ip-${item.ip}`} className="border-t border-zinc-100 align-top">
                        <td className="px-3 py-2 font-mono text-xs text-zinc-800">{normalizeText(item.ip)}</td>
                        <td className="px-3 py-2 text-zinc-700">{Number(item.count || 0).toLocaleString("ko-KR")}</td>
                        <td className="px-3 py-2 text-zinc-700">{Number(item.blockedCount || 0).toLocaleString("ko-KR")}</td>
                        <td className="px-3 py-2 text-xs text-zinc-700">
                          <div>{formatDateTime(item.lastSeenAt)}</div>
                          <div className="text-zinc-400">{formatRelative(item.lastSeenAt)}</div>
                        </td>
                        <td className="px-3 py-2 text-xs">
                          {item.currentlyBlocked ? (
                            <button
                              type="button"
                              disabled={savingBlock}
                              onClick={() =>
                                updateBlockRule({
                                  ip: String(item.ip || ""),
                                  enabled: false,
                                  reason: "manual_unblock",
                                })
                              }
                              className="px-2 py-1 rounded-md border border-emerald-200 bg-emerald-50 text-emerald-700 font-semibold"
                            >
                              차단해제
                            </button>
                          ) : (
                            <button
                              type="button"
                              disabled={savingBlock || !item.ip}
                              onClick={() =>
                                updateBlockRule({
                                  ip: String(item.ip || ""),
                                  enabled: true,
                                  reason:
                                    String(item.blockedReason || "").trim() ||
                                    "suspicious_api_activity",
                                })
                              }
                              className="px-2 py-1 rounded-md border border-rose-200 bg-rose-50 text-rose-700 font-semibold"
                            >
                              차단
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="rounded-xl border border-zinc-200 overflow-x-auto">
                <div className="px-3 py-2 bg-zinc-100 text-sm font-bold text-zinc-700">차단 규칙 목록</div>
                <table className="min-w-[680px] w-full text-sm">
                  <thead className="bg-zinc-50 text-zinc-700">
                    <tr>
                      <th className="px-3 py-2 text-left">IP</th>
                      <th className="px-3 py-2 text-left">상태</th>
                      <th className="px-3 py-2 text-left">사유</th>
                      <th className="px-3 py-2 text-left">업데이트</th>
                      <th className="px-3 py-2 text-left">동작</th>
                    </tr>
                  </thead>
                  <tbody>
                    {blockedIps.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-3 py-8 text-center text-zinc-500">
                          차단 규칙이 없습니다.
                        </td>
                      </tr>
                    )}
                    {blockedIps.map((item) => (
                      <tr key={`blocked-ip-${item._id || item.ip}`} className="border-t border-zinc-100 align-top">
                        <td className="px-3 py-2 font-mono text-xs text-zinc-800">{normalizeText(item.ip)}</td>
                        <td className="px-3 py-2">
                          <span
                            className={`px-2 py-1 rounded-md text-xs font-semibold border ${
                              item.enabled
                                ? "bg-rose-100 text-rose-800 border-rose-200"
                                : "bg-zinc-100 text-zinc-600 border-zinc-200"
                            }`}
                          >
                            {item.enabled ? "차단중" : "해제됨"}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-xs text-zinc-700">{normalizeText(item.reason)}</td>
                        <td className="px-3 py-2 text-xs text-zinc-700">
                          <div>{formatDateTime(item.updatedAt || item.blockedAt)}</div>
                          <div className="text-zinc-400">{formatRelative(item.updatedAt || item.blockedAt)}</div>
                        </td>
                        <td className="px-3 py-2 text-xs">
                          {item.enabled ? (
                            <button
                              type="button"
                              disabled={savingBlock || !item.ip}
                              onClick={() =>
                                updateBlockRule({
                                  ip: String(item.ip || ""),
                                  enabled: false,
                                  reason: "manual_unblock",
                                })
                              }
                              className="px-2 py-1 rounded-md border border-emerald-200 bg-emerald-50 text-emerald-700 font-semibold"
                            >
                              해제
                            </button>
                          ) : (
                            <button
                              type="button"
                              disabled={savingBlock || !item.ip}
                              onClick={() =>
                                updateBlockRule({
                                  ip: String(item.ip || ""),
                                  enabled: true,
                                  reason: String(item.reason || "").trim() || "manual_reblock",
                                })
                              }
                              className="px-2 py-1 rounded-md border border-rose-200 bg-rose-50 text-rose-700 font-semibold"
                            >
                              재차단
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="overflow-x-auto border border-zinc-200 rounded-xl">
              <table className="min-w-[1200px] w-full text-sm">
                <thead className="bg-zinc-100 text-zinc-700">
                  <tr>
                    <th className="px-3 py-2 text-left">시간</th>
                    <th className="px-3 py-2 text-left">IP</th>
                    <th className="px-3 py-2 text-left">국가</th>
                    <th className="px-3 py-2 text-left">메서드</th>
                    <th className="px-3 py-2 text-left">라우트</th>
                    <th className="px-3 py-2 text-left">차단</th>
                    <th className="px-3 py-2 text-left">사유</th>
                    <th className="px-3 py-2 text-left">User-Agent</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-3 py-8 text-center text-zinc-500">
                        조회된 API 로그가 없습니다.
                      </td>
                    </tr>
                  )}
                  {logs.map((log) => (
                    <tr key={String(log._id)} className="border-t border-zinc-100 align-top">
                      <td className="px-3 py-2 whitespace-nowrap text-zinc-700">
                        <div>{formatDateTime(log.createdAt)}</div>
                        <div className="text-xs text-zinc-400">{formatRelative(log.createdAt)}</div>
                      </td>
                      <td className="px-3 py-2 font-mono text-xs text-zinc-800">{normalizeText(log.ip)}</td>
                      <td className="px-3 py-2 text-xs text-zinc-700">{normalizeText(log.country)}</td>
                      <td className="px-3 py-2 text-xs text-zinc-700">{normalizeText(log.method)}</td>
                      <td className="px-3 py-2 font-mono text-xs text-zinc-800">{normalizeText(log.pathname)}</td>
                      <td className="px-3 py-2">
                        <span
                          className={`px-2 py-1 rounded-md text-xs font-semibold border ${
                            log.blocked
                              ? "bg-rose-100 text-rose-800 border-rose-200"
                              : "bg-emerald-100 text-emerald-800 border-emerald-200"
                          }`}
                        >
                          {log.blocked ? "차단" : "허용"}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-xs text-zinc-700">{normalizeText(log.blockReason)}</td>
                      <td className="px-3 py-2 text-xs text-zinc-700 max-w-[24rem]">
                        <div className="break-all line-clamp-2">{normalizeText(log.userAgent)}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage(1)}
                className="px-3 py-1.5 rounded-md text-xs font-semibold border border-zinc-300 text-zinc-700 disabled:opacity-40"
              >
                처음
              </button>
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                className="px-3 py-1.5 rounded-md text-xs font-semibold border border-zinc-300 text-zinc-700 disabled:opacity-40"
              >
                이전
              </button>
              <span className="text-xs text-zinc-500">
                {page.toLocaleString("ko-KR")} / {totalPages.toLocaleString("ko-KR")}
              </span>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                className="px-3 py-1.5 rounded-md text-xs font-semibold border border-zinc-300 text-zinc-700 disabled:opacity-40"
              >
                다음
              </button>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage(totalPages)}
                className="px-3 py-1.5 rounded-md text-xs font-semibold border border-zinc-300 text-zinc-700 disabled:opacity-40"
              >
                마지막
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
