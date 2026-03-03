"use client";

import { useEffect, useMemo, useState } from "react";
import { useActiveAccount } from "thirdweb/react";
import { toast } from "react-hot-toast";

type RangeKey = "today" | "yesterday" | "dayBeforeYesterday" | "all";
type StatusFilter = "all" | "allowed" | "blocked";
type GuardTypeFilter = "all" | "admin_signed" | "center_store_admin";

type StatItem = {
  value: string;
  count: number;
};

type AdminApiCallLog = {
  _id?: string;
  route?: string;
  guardType?: string;
  status?: string;
  reason?: string | null;
  publicIp?: string | null;
  publicCountry?: string | null;
  requesterWalletAddress?: string | null;
  requesterUser?: {
    nickname?: string | null;
    role?: string | null;
    storecode?: string | null;
    walletAddress?: string | null;
  } | null;
  requestBody?: Record<string, any>;
  meta?: Record<string, any>;
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
  { key: "allowed", label: "허용" },
  { key: "blocked", label: "차단" },
];

const guardTypeOptions: { key: GuardTypeFilter; label: string }[] = [
  { key: "all", label: "전체 가드" },
  { key: "admin_signed", label: "Admin Signed" },
  { key: "center_store_admin", label: "Center Store Admin" },
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

export default function AdminApiLogPage() {
  const activeAccount = useActiveAccount();
  const walletAddress = activeAccount?.address || "";

  const [logs, setLogs] = useState<AdminApiCallLog[]>([]);
  const [routeStats, setRouteStats] = useState<StatItem[]>([]);
  const [statusStats, setStatusStats] = useState<StatItem[]>([]);
  const [guardTypeStats, setGuardTypeStats] = useState<StatItem[]>([]);
  const [selectedRange, setSelectedRange] = useState<RangeKey>("today");
  const [selectedStatus, setSelectedStatus] = useState<StatusFilter>("all");
  const [selectedRoute, setSelectedRoute] = useState<string>("all");
  const [selectedGuardType, setSelectedGuardType] =
    useState<GuardTypeFilter>("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchedAt, setFetchedAt] = useState<Date | null>(null);

  const fetchLogs = async () => {
    if (!walletAddress || loading) {
      return;
    }
    setLoading(true);
    try {
      const response = await fetch("/api/adminApiLog/getLogs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requesterWalletAddress: walletAddress,
          range: selectedRange,
          status: selectedStatus === "all" ? "" : selectedStatus,
          route: selectedRoute === "all" ? "" : selectedRoute,
          guardType: selectedGuardType === "all" ? "" : selectedGuardType,
          search,
          limit: 2000,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "failed_to_fetch_logs");
      }

      setLogs(data?.result?.logs || []);
      setRouteStats(data?.result?.routeStats || []);
      setStatusStats(data?.result?.statusStats || []);
      setGuardTypeStats(data?.result?.guardTypeStats || []);
      setFetchedAt(new Date());
    } catch (error) {
      toast.error("Admin API 로그 조회에 실패했습니다.");
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
  }, [walletAddress, selectedRange, selectedStatus, selectedRoute, selectedGuardType]);

  const filteredLogs = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return logs;
    }
    return logs.filter((log) => {
      const joined = [
        log.route,
        log.guardType,
        log.status,
        log.reason,
        log.publicIp,
        log.publicCountry,
        log.requesterWalletAddress,
        log.requesterUser?.nickname,
        log.requesterUser?.role,
        log.requesterUser?.storecode,
        log.requestBody?.storecode,
        log.meta?.storecode,
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
            <div className="text-xl font-bold">Admin 권한 API 호출 이력</div>
            <div className="text-xs text-slate-300 mt-1">collection: adminApiCallLogs</div>
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
              <span className="text-2xl font-black text-zinc-900">
                {filteredLogs.length.toLocaleString("ko-KR")}건
              </span>
              <span className="text-xs text-zinc-400">
                / 전체 {logs.length.toLocaleString("ko-KR")}건
              </span>
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
                value={selectedGuardType}
                onChange={(event) =>
                  setSelectedGuardType(event.target.value as GuardTypeFilter)
                }
                className="w-full lg:w-52 border border-zinc-300 rounded-lg px-3 py-2 text-sm text-zinc-800 bg-white"
              >
                {guardTypeOptions.map((option) => (
                  <option key={option.key} value={option.key}>
                    {option.label}
                  </option>
                ))}
              </select>

              <select
                value={selectedRoute}
                onChange={(event) => setSelectedRoute(event.target.value)}
                className="w-full lg:w-[26rem] border border-zinc-300 rounded-lg px-3 py-2 text-sm text-zinc-800 bg-white"
              >
                {routeOptionItems.map((item) => (
                  <option key={`route-${item.value}`} value={item.value}>
                    {item.value === "all" ? "전체 라우트" : item.value} (
                    {item.count.toLocaleString("ko-KR")})
                  </option>
                ))}
              </select>

              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="지갑/닉네임/스토어코드/라우트 검색"
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
              <table className="min-w-[1260px] w-full text-sm">
                <thead className="bg-zinc-100 text-zinc-700">
                  <tr>
                    <th className="px-3 py-2 text-left">시간</th>
                    <th className="px-3 py-2 text-left">가드</th>
                    <th className="px-3 py-2 text-left">라우트</th>
                    <th className="px-3 py-2 text-left">상태</th>
                    <th className="px-3 py-2 text-left">호출자</th>
                    <th className="px-3 py-2 text-left">회원정보</th>
                    <th className="px-3 py-2 text-left">퍼블릭 IP / 국가</th>
                    <th className="px-3 py-2 text-left">요청값</th>
                    <th className="px-3 py-2 text-left">메타</th>
                    <th className="px-3 py-2 text-left">사유</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.length === 0 && (
                    <tr>
                      <td colSpan={10} className="px-3 py-8 text-center text-zinc-500">
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
                      <td className="px-3 py-2 text-xs text-zinc-700">{normalizeText(log.guardType)}</td>
                      <td className="px-3 py-2 font-mono text-xs text-zinc-800">{normalizeText(log.route)}</td>
                      <td className="px-3 py-2">
                        <span
                          className={`px-2 py-1 rounded-md text-xs font-semibold border ${
                            log.status === "allowed"
                              ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                              : "bg-rose-100 text-rose-800 border-rose-200"
                          }`}
                        >
                          {log.status === "allowed" ? "허용" : "차단"}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-xs">
                        <div className="font-mono text-zinc-800">{normalizeText(log.requesterWalletAddress)}</div>
                        <div className="text-zinc-500">{normalizeText(log.requestBody?.storecode)}</div>
                      </td>
                      <td className="px-3 py-2 text-xs text-zinc-700">
                        <div>{normalizeText(log.requesterUser?.nickname)}</div>
                        <div>{normalizeText(log.requesterUser?.role)}</div>
                        <div>{normalizeText(log.requesterUser?.storecode)}</div>
                      </td>
                      <td className="px-3 py-2 text-xs text-zinc-700">
                        <div className="font-mono">{normalizeText(log.publicIp)}</div>
                        <div className="text-zinc-500">{formatCountry(log.publicCountry)}</div>
                      </td>
                      <td className="px-3 py-2 text-xs text-zinc-700 max-w-[20rem]">
                        <pre className="whitespace-pre-wrap break-all">
                          {JSON.stringify(log.requestBody || {}, null, 2)}
                        </pre>
                      </td>
                      <td className="px-3 py-2 text-xs text-zinc-700 max-w-[14rem]">
                        <pre className="whitespace-pre-wrap break-all">
                          {JSON.stringify(log.meta || {}, null, 2)}
                        </pre>
                      </td>
                      <td className="px-3 py-2 text-xs text-zinc-700">{normalizeText(log.reason)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-wrap gap-2">
              {statusStats.map((item) => (
                <span
                  key={`status-${item.value}`}
                  className={`px-2 py-1 rounded-full text-xs font-semibold border ${
                    item.value === "allowed"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                      : item.value === "blocked"
                        ? "bg-rose-50 text-rose-700 border-rose-100"
                        : "bg-zinc-50 text-zinc-700 border-zinc-100"
                  }`}
                >
                  {item.value}: {item.count.toLocaleString("ko-KR")}
                </span>
              ))}

              {guardTypeStats.map((item) => (
                <span
                  key={`guardType-${item.value}`}
                  className="px-2 py-1 rounded-full text-xs font-semibold border bg-sky-50 text-sky-700 border-sky-100"
                >
                  {item.value}: {item.count.toLocaleString("ko-KR")}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
