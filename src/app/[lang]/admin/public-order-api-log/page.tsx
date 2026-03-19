"use client";

import { useEffect, useMemo, useState } from "react";
import { useActiveAccount } from "thirdweb/react";
import { toast } from "react-hot-toast";
import { postAdminSignedJson } from "@/lib/client/admin-signed-action";

type RangeKey = "today" | "yesterday" | "dayBeforeYesterday" | "all";
type StatusFilter = "all" | "success" | "error";

type StatItem = {
  value: string;
  count: number;
};

type PublicOrderApiCallLog = {
  _id?: string;
  route?: string;
  method?: string | null;
  status?: string;
  reason?: string | null;
  publicIp?: string | null;
  publicCountry?: string | null;
  requestBody?: Record<string, any>;
  resultMeta?: Record<string, any>;
  createdAt?: string;
};

const rangeOptions: { key: RangeKey; label: string }[] = [
  { key: "today", label: "오늘" },
  { key: "yesterday", label: "어제" },
  { key: "dayBeforeYesterday", label: "그제" },
  { key: "all", label: "전체" },
];

const statusOptions: { key: StatusFilter; label: string }[] = [
  { key: "all", label: "전체" },
  { key: "success", label: "성공" },
  { key: "error", label: "실패" },
];

const PUBLIC_ORDER_LOG_READ_SIGNING_PREFIX = "stable-georgia:public-order-log-read:v1";

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

const regionDisplayNames =
  typeof Intl !== "undefined" && typeof Intl.DisplayNames === "function"
    ? new Intl.DisplayNames(["ko-KR"], { type: "region" })
    : null;

const formatCountry = (value: unknown) => {
  const code = String(value || "").trim().toUpperCase();
  if (!code || code === "UNKNOWN") {
    return "-";
  }
  if (!/^[A-Z]{2}$/.test(code)) {
    return code;
  }
  const name = regionDisplayNames?.of(code);
  if (!name || name === code) {
    return code;
  }
  return `${name} (${code})`;
};

export default function PublicOrderApiLogPage() {
  const activeAccount = useActiveAccount();
  const walletAddress = activeAccount?.address || "";

  const [logs, setLogs] = useState<PublicOrderApiCallLog[]>([]);
  const [routeStats, setRouteStats] = useState<StatItem[]>([]);
  const [statusStats, setStatusStats] = useState<StatItem[]>([]);
  const [selectedRange, setSelectedRange] = useState<RangeKey>("today");
  const [selectedStatus, setSelectedStatus] = useState<StatusFilter>("all");
  const [selectedRoute, setSelectedRoute] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchedAt, setFetchedAt] = useState<Date | null>(null);

  const fetchLogs = async () => {
    if (!walletAddress || loading) {
      return;
    }

    setLoading(true);
    try {
      const response = await postAdminSignedJson({
        account: activeAccount,
        route: "/api/publicOrderApiLog/getLogs",
        signingPrefix: PUBLIC_ORDER_LOG_READ_SIGNING_PREFIX,
        body: {
          range: selectedRange,
          status: selectedStatus === "all" ? "" : selectedStatus,
          route: selectedRoute === "all" ? "" : selectedRoute,
          search,
          limit: 2000,
        },
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "failed_to_fetch_logs");
      }

      setLogs(data?.result?.logs || []);
      setRouteStats(data?.result?.routeStats || []);
      setStatusStats(data?.result?.statusStats || []);
      setFetchedAt(new Date());
    } catch (error) {
      toast.error("공개 주문 API 로그 조회에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!walletAddress) return;
    fetchLogs();
    const timer = setInterval(fetchLogs, 15_000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [walletAddress, selectedRange, selectedStatus, selectedRoute]);

  const filteredLogs = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return logs;
    }
    return logs.filter((log) => {
      const joined = [
        log.route,
        log.method,
        log.status,
        log.reason,
        log.publicIp,
        log.publicCountry,
        log.requestBody?.storecode,
        log.requestBody?.nickname,
        log.requestBody?.userid,
        log.requestBody?.userId,
        log.requestBody?.clientid,
        log.requestBody?.clientId,
        log.resultMeta?.tradeId,
        log.resultMeta?.orderId,
        log.resultMeta?.walletAddress,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return joined.includes(query);
    });
  }, [logs, search]);

  const routeOptionItems = useMemo(() => {
    return [{ value: "all", count: logs.length }, ...routeStats];
  }, [logs.length, routeStats]);

  return (
    <main className="w-full px-3 sm:px-4 md:px-6 lg:px-10 pb-10">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 bg-gradient-to-r from-zinc-900 via-slate-800 to-zinc-900 text-white rounded-2xl p-4 shadow-lg shadow-zinc-900/40">
          <div>
            <div className="text-xs uppercase tracking-[0.14em] text-cyan-200">Audit Logs</div>
            <div className="text-xl font-bold">공개 주문 API 호출 이력</div>
            <div className="text-xs text-slate-300 mt-1">collection: publicOrderApiCallLogs</div>
          </div>
          <div className="flex items-center gap-2 bg-white/10 rounded-lg px-2 py-1 border border-white/10">
            {rangeOptions.map((option) => {
              const active = option.key === selectedRange;
              return (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => setSelectedRange(option.key)}
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
            관리자 지갑 연결 후 로그를 조회할 수 있습니다.
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg border border-zinc-200 p-4 flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm text-zinc-500">표시</span>
              <span className="text-2xl font-black text-zinc-900">{filteredLogs.length.toLocaleString("ko-KR")}건</span>
              <span className="text-xs text-zinc-400">/ 전체 {logs.length.toLocaleString("ko-KR")}건</span>
              <span className="text-xs text-zinc-400">
                {fetchedAt ? `업데이트: ${formatDateTime(fetchedAt)}` : "업데이트 대기중..."}
              </span>
            </div>

            <div className="flex flex-col lg:flex-row gap-2">
              <select
                value={selectedStatus}
                onChange={(event) => setSelectedStatus(event.target.value as StatusFilter)}
                className="w-full lg:w-40 border border-zinc-300 rounded-lg px-3 py-2 text-sm text-zinc-800 bg-white"
              >
                {statusOptions.map((option) => (
                  <option key={option.key} value={option.key}>
                    {option.label}
                  </option>
                ))}
              </select>

              <select
                value={selectedRoute}
                onChange={(event) => setSelectedRoute(event.target.value)}
                className="w-full lg:w-[28rem] border border-zinc-300 rounded-lg px-3 py-2 text-sm text-zinc-800 bg-white"
              >
                {routeOptionItems.map((item) => (
                  <option key={`route-${item.value}`} value={item.value}>
                    {item.value === "all" ? "전체 라우트" : item.value} ({item.count.toLocaleString("ko-KR")})
                  </option>
                ))}
              </select>

              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="storecode / nickname / clientId / wallet / tradeId 검색"
                className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm text-zinc-800"
              />

              <button
                type="button"
                onClick={fetchLogs}
                disabled={loading}
                className="px-4 py-2 rounded-lg text-sm font-semibold bg-zinc-900 text-white hover:bg-zinc-800 disabled:opacity-60"
              >
                {loading ? "조회중..." : "새로고침"}
              </button>
            </div>

            <div className="overflow-x-auto border border-zinc-200 rounded-xl">
              <table className="min-w-[1220px] w-full text-sm">
                <thead className="bg-zinc-100 text-zinc-700">
                  <tr>
                    <th className="px-3 py-2 text-left">시간</th>
                    <th className="px-3 py-2 text-left">라우트</th>
                    <th className="px-3 py-2 text-left">상태</th>
                    <th className="px-3 py-2 text-left">요청 식별자</th>
                    <th className="px-3 py-2 text-left">주문 결과</th>
                    <th className="px-3 py-2 text-left">퍼블릭 IP / 국가</th>
                    <th className="px-3 py-2 text-left">요청값</th>
                    <th className="px-3 py-2 text-left">사유</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-3 py-8 text-center text-zinc-500">
                        조회된 로그가 없습니다.
                      </td>
                    </tr>
                  )}
                  {filteredLogs.map((log) => (
                    <tr key={String(log._id)} className="border-t border-zinc-100 align-top">
                      <td className="px-3 py-2 whitespace-nowrap text-zinc-700">
                        <div>{formatDateTime(log.createdAt)}</div>
                        <div className="text-xs text-zinc-400">{formatRelative(log.createdAt)}</div>
                      </td>
                      <td className="px-3 py-2 text-xs">
                        <div className="font-mono text-zinc-800">{normalizeText(log.route)}</div>
                        <div className="text-zinc-500">{normalizeText(log.method)}</div>
                      </td>
                      <td className="px-3 py-2">
                        <span
                          className={`px-2 py-1 rounded-md text-xs font-semibold border ${
                            log.status === "success"
                              ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                              : "bg-rose-100 text-rose-800 border-rose-200"
                          }`}
                        >
                          {log.status === "success" ? "성공" : "실패"}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-xs text-zinc-700">
                        <div>storecode: {normalizeText(log.requestBody?.storecode)}</div>
                        <div>nickname: {normalizeText(log.requestBody?.nickname || log.requestBody?.userid || log.requestBody?.userId)}</div>
                        <div>clientId: {normalizeText(log.requestBody?.clientid || log.requestBody?.clientId)}</div>
                        <div className="font-mono">wallet: {normalizeText(log.requestBody?.walletAddress)}</div>
                        <div>amount: {normalizeText(log.requestBody?.amount ?? log.requestBody?.krwAmount)}</div>
                      </td>
                      <td className="px-3 py-2 text-xs text-zinc-700">
                        <div>tradeId: {normalizeText(log.resultMeta?.tradeId)}</div>
                        <div>orderId: {normalizeText(log.resultMeta?.orderId)}</div>
                        <div className="font-mono">wallet: {normalizeText(log.resultMeta?.walletAddress)}</div>
                      </td>
                      <td className="px-3 py-2 text-xs text-zinc-700">
                        <div className="font-mono">{normalizeText(log.publicIp)}</div>
                        <div>{formatCountry(log.publicCountry)}</div>
                      </td>
                      <td className="px-3 py-2">
                        <pre className="text-[11px] leading-5 whitespace-pre-wrap break-all bg-zinc-950 text-zinc-100 rounded-xl p-3 max-w-[30rem] overflow-x-auto">
                          {JSON.stringify(log.requestBody || {}, null, 2)}
                        </pre>
                      </td>
                      <td className="px-3 py-2 text-xs text-zinc-700">
                        <div>{normalizeText(log.reason)}</div>
                        {log.resultMeta && Object.keys(log.resultMeta).length > 0 && (
                          <pre className="mt-2 text-[11px] leading-5 whitespace-pre-wrap break-all bg-zinc-100 text-zinc-800 rounded-xl p-3 max-w-[22rem] overflow-x-auto">
                            {JSON.stringify(log.resultMeta, null, 2)}
                          </pre>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
                <div className="text-xs uppercase tracking-[0.12em] text-zinc-500 mb-2">Route Stats</div>
                <div className="flex flex-col gap-2 max-h-60 overflow-y-auto">
                  {routeStats.length === 0 && <div className="text-sm text-zinc-400">데이터 없음</div>}
                  {routeStats.map((item) => (
                    <div
                      key={`route-${item.value}`}
                      className="flex items-center justify-between gap-3 rounded-lg bg-white border border-zinc-200 px-3 py-2"
                    >
                      <div className="font-mono text-xs text-zinc-700 break-all">{item.value}</div>
                      <div className="text-sm font-semibold text-zinc-900">{item.count.toLocaleString("ko-KR")}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
                <div className="text-xs uppercase tracking-[0.12em] text-zinc-500 mb-2">Status Stats</div>
                <div className="flex flex-col gap-2">
                  {statusStats.length === 0 && <div className="text-sm text-zinc-400">데이터 없음</div>}
                  {statusStats.map((item) => (
                    <div
                      key={`status-${item.value}`}
                      className="flex items-center justify-between rounded-lg bg-white border border-zinc-200 px-3 py-2"
                    >
                      <div className="text-sm text-zinc-700">{item.value}</div>
                      <div className="text-sm font-semibold text-zinc-900">{item.count.toLocaleString("ko-KR")}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
