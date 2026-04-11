"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import { useActiveAccount } from "thirdweb/react";

import { postAdminSignedJson } from "@/lib/client/admin-signed-action";

type RangeKey = "today" | "yesterday" | "dayBeforeYesterday" | "all";
type StatusFilter = "all" | "success" | "error";

type StatItem = {
  value: string;
  count: number;
};

type ReturnUrlLog = {
  _id?: string;
  source?: string | null;
  callbackKind?: string | null;
  status?: string | null;
  orderId?: string | null;
  tradeId?: string | null;
  storecode?: string | null;
  nickname?: string | null;
  walletAddress?: string | null;
  orderNumber?: string | null;
  requestMethod?: string | null;
  requestUrl?: string | null;
  returnUrl?: string | null;
  requestHeaders?: Record<string, any> | null;
  requestQuery?: Record<string, any> | null;
  requestBody?: Record<string, any> | null;
  responseStatus?: number | null;
  responseStatusText?: string | null;
  responseOk?: boolean | null;
  responseBody?: unknown;
  errorMessage?: string | null;
  durationMs?: number | null;
  createdAt?: string | null;
};

const RETURN_URL_LOG_READ_SIGNING_PREFIX = "stable-georgia:return-url-log-read:v1";

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
  if (value == null) {
    return "-";
  }
  const text = String(value).trim();
  return text || "-";
};

const stringifyJson = (value: unknown) => {
  if (
    value == null ||
    (typeof value === "object" && !Array.isArray(value) && Object.keys(value as Record<string, unknown>).length === 0)
  ) {
    return "-";
  }

  if (typeof value === "string") {
    return value || "-";
  }

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
};

const formatDuration = (value: unknown) => {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "-";
  }
  return `${value.toLocaleString("ko-KR")}ms`;
};

const resolveRequestUrl = (log: ReturnUrlLog) => {
  return String(log.requestUrl || log.returnUrl || "").trim();
};

const resolveStatusLabel = (status: unknown) => {
  if (status === "success") return "성공";
  if (status === "error") return "실패";
  return "미분류";
};

const resolveStatusClassName = (status: unknown) => {
  if (status === "success") {
    return "bg-emerald-100 text-emerald-800 border-emerald-200";
  }
  if (status === "error") {
    return "bg-rose-100 text-rose-800 border-rose-200";
  }
  return "bg-zinc-100 text-zinc-700 border-zinc-200";
};

export default function ReturnUrlLogPage() {
  const activeAccount = useActiveAccount();
  const walletAddress = activeAccount?.address || "";

  const [logs, setLogs] = useState<ReturnUrlLog[]>([]);
  const [statusStats, setStatusStats] = useState<StatItem[]>([]);
  const [storeStats, setStoreStats] = useState<StatItem[]>([]);
  const [callbackKindStats, setCallbackKindStats] = useState<StatItem[]>([]);
  const [selectedRange, setSelectedRange] = useState<RangeKey>("today");
  const [selectedStatus, setSelectedStatus] = useState<StatusFilter>("all");
  const [selectedCallbackKind, setSelectedCallbackKind] = useState("all");
  const [selectedStorecode, setSelectedStorecode] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchedAt, setFetchedAt] = useState<Date | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  const fetchLogs = async () => {
    if (!walletAddress || loading) {
      return;
    }

    setLoading(true);

    try {
      const response = await postAdminSignedJson({
        account: activeAccount,
        route: "/api/returnUrlLog/getLogs",
        signingPrefix: RETURN_URL_LOG_READ_SIGNING_PREFIX,
        body: {
          range: selectedRange,
          status: selectedStatus === "all" ? "" : selectedStatus,
          callbackKind: selectedCallbackKind === "all" ? "" : selectedCallbackKind,
          storecode: selectedStorecode === "all" ? "" : selectedStorecode,
          search,
          limit: 2000,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "failed_to_fetch_logs");
      }

      setLogs(data?.result?.logs || []);
      setStatusStats(data?.result?.statusStats || []);
      setStoreStats(data?.result?.storeStats || []);
      setCallbackKindStats(data?.result?.callbackKindStats || []);
      setFetchedAt(new Date());
    } catch (error) {
      toast.error("returnUrl 콜백 로그 조회에 실패했습니다.");
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
  }, [walletAddress, selectedRange, selectedStatus, selectedCallbackKind, selectedStorecode]);

  const filteredLogs = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return logs;
    }

    return logs.filter((log) => {
      const joined = [
        log.source,
        log.callbackKind,
        log.status,
        log.orderId,
        log.tradeId,
        log.storecode,
        log.nickname,
        log.walletAddress,
        log.orderNumber,
        log.requestMethod,
        resolveRequestUrl(log),
        log.responseStatus,
        log.responseStatusText,
        log.errorMessage,
        stringifyJson(log.requestQuery),
        stringifyJson(log.requestBody),
        stringifyJson(log.responseBody),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return joined.includes(query);
    });
  }, [logs, search]);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(filteredLogs.length / pageSize));
  }, [filteredLogs.length, pageSize]);

  const pagedLogs = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredLogs.slice(start, start + pageSize);
  }, [filteredLogs, currentPage, pageSize]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedRange, selectedStatus, selectedCallbackKind, selectedStorecode, search, pageSize]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const callbackKindOptions = useMemo(() => {
    return [{ value: "all", count: logs.length }, ...callbackKindStats];
  }, [callbackKindStats, logs.length]);

  const storeOptions = useMemo(() => {
    return [{ value: "all", count: logs.length }, ...storeStats];
  }, [logs.length, storeStats]);

  const pageNumbers = useMemo(() => {
    const radius = 2;
    const start = Math.max(1, currentPage - radius);
    const end = Math.min(totalPages, currentPage + radius);
    const numbers: number[] = [];

    for (let page = start; page <= end; page += 1) {
      numbers.push(page);
    }

    return numbers;
  }, [currentPage, totalPages]);

  return (
    <main className="w-full px-3 sm:px-4 md:px-6 lg:px-10 pb-10">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 bg-gradient-to-r from-zinc-900 via-slate-800 to-zinc-900 text-white rounded-2xl p-4 shadow-lg shadow-zinc-900/40">
          <div>
            <div className="text-xs uppercase tracking-[0.14em] text-cyan-200">Audit Logs</div>
            <div className="text-xl font-bold">구매주문 returnUrl 콜백 로그</div>
            <div className="text-xs text-slate-300 mt-1">collection: returnUrlLogs</div>
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
                {pagedLogs.length.toLocaleString("ko-KR")}건
              </span>
              <span className="text-xs text-zinc-400">
                / 검색결과 {filteredLogs.length.toLocaleString("ko-KR")}건 / 전체 {logs.length.toLocaleString("ko-KR")}건
              </span>
              <span className="text-xs text-zinc-400">
                페이지 {currentPage.toLocaleString("ko-KR")} / {totalPages.toLocaleString("ko-KR")}
              </span>
              <span className="text-xs text-zinc-400">
                {fetchedAt ? `업데이트: ${formatDateTime(fetchedAt)}` : "업데이트 대기중..."}
              </span>
            </div>

            <div className="flex flex-col lg:flex-row gap-2">
              <select
                value={selectedStatus}
                onChange={(event) => setSelectedStatus(event.target.value as StatusFilter)}
                className="w-full lg:w-36 border border-zinc-300 rounded-lg px-3 py-2 text-sm text-zinc-800 bg-white"
              >
                {statusOptions.map((option) => (
                  <option key={option.key} value={option.key}>
                    {option.label}
                  </option>
                ))}
              </select>

              <select
                value={selectedCallbackKind}
                onChange={(event) => setSelectedCallbackKind(event.target.value)}
                className="w-full lg:w-60 border border-zinc-300 rounded-lg px-3 py-2 text-sm text-zinc-800 bg-white"
              >
                {callbackKindOptions.map((item) => (
                  <option key={`callback-kind-${item.value}`} value={item.value}>
                    {item.value === "all" ? "전체 콜백 종류" : item.value} ({item.count.toLocaleString("ko-KR")})
                  </option>
                ))}
              </select>

              <select
                value={selectedStorecode}
                onChange={(event) => setSelectedStorecode(event.target.value)}
                className="w-full lg:w-52 border border-zinc-300 rounded-lg px-3 py-2 text-sm text-zinc-800 bg-white"
              >
                {storeOptions.map((item) => (
                  <option key={`store-${item.value}`} value={item.value}>
                    {item.value === "all" ? "전체 스토어" : item.value} ({item.count.toLocaleString("ko-KR")})
                  </option>
                ))}
              </select>

              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="storecode / nickname / tradeId / orderId / URL 검색"
                className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm text-zinc-800"
              />

              <select
                value={String(pageSize)}
                onChange={(event) => setPageSize(Number(event.target.value) || 50)}
                className="w-full lg:w-28 border border-zinc-300 rounded-lg px-3 py-2 text-sm text-zinc-800 bg-white"
              >
                <option value="25">25개</option>
                <option value="50">50개</option>
                <option value="100">100개</option>
                <option value="200">200개</option>
              </select>

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
              <table className="min-w-[1680px] w-full text-sm">
                <thead className="bg-zinc-100 text-zinc-700">
                  <tr>
                    <th className="px-3 py-2 text-left">시간</th>
                    <th className="px-3 py-2 text-left">상태 / 종류</th>
                    <th className="px-3 py-2 text-left">주문 식별자</th>
                    <th className="px-3 py-2 text-left">요청</th>
                    <th className="px-3 py-2 text-left">응답</th>
                    <th className="px-3 py-2 text-left">요청 Payload</th>
                    <th className="px-3 py-2 text-left">응답 Payload</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedLogs.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-3 py-8 text-center text-zinc-500">
                        조회된 로그가 없습니다.
                      </td>
                    </tr>
                  )}
                  {pagedLogs.map((log) => {
                    const requestUrl = resolveRequestUrl(log);

                    return (
                      <tr key={String(log._id)} className="border-t border-zinc-100 align-top">
                        <td className="px-3 py-2 whitespace-nowrap text-zinc-700">
                          <div>{formatDateTime(log.createdAt)}</div>
                          <div className="text-xs text-zinc-400">{formatRelative(log.createdAt)}</div>
                        </td>
                        <td className="px-3 py-2 text-xs">
                          <span
                            className={`inline-flex px-2 py-1 rounded-md text-xs font-semibold border ${resolveStatusClassName(
                              log.status,
                            )}`}
                          >
                            {resolveStatusLabel(log.status)}
                          </span>
                          <div className="mt-2 font-mono text-zinc-800">{normalizeText(log.callbackKind)}</div>
                          <div className="text-zinc-500">{normalizeText(log.source)}</div>
                        </td>
                        <td className="px-3 py-2 text-xs text-zinc-700">
                          <div>storecode: {normalizeText(log.storecode)}</div>
                          <div>nickname: {normalizeText(log.nickname)}</div>
                          <div>tradeId: {normalizeText(log.tradeId)}</div>
                          <div>orderId: {normalizeText(log.orderId)}</div>
                          <div>orderNumber: {normalizeText(log.orderNumber)}</div>
                          <div className="font-mono break-all">wallet: {normalizeText(log.walletAddress)}</div>
                        </td>
                        <td className="px-3 py-2 text-xs text-zinc-700 max-w-[28rem]">
                          <div className="font-semibold text-zinc-900">
                            {normalizeText(log.requestMethod)} {requestUrl ? "" : "-"}
                          </div>
                          <div className="font-mono break-all text-zinc-700 mt-1">{normalizeText(requestUrl)}</div>
                          <pre className="mt-2 text-[11px] leading-5 whitespace-pre-wrap break-all bg-zinc-100 text-zinc-800 rounded-xl p-3 overflow-x-auto">
                            {stringifyJson(log.requestQuery)}
                          </pre>
                        </td>
                        <td className="px-3 py-2 text-xs text-zinc-700">
                          <div>status: {normalizeText(log.responseStatus)}</div>
                          <div>statusText: {normalizeText(log.responseStatusText)}</div>
                          <div>ok: {normalizeText(log.responseOk)}</div>
                          <div>duration: {formatDuration(log.durationMs)}</div>
                          <div className="mt-2 text-rose-700 break-all">{normalizeText(log.errorMessage)}</div>
                        </td>
                        <td className="px-3 py-2 text-xs text-zinc-700 max-w-[24rem]">
                          <div className="text-zinc-500 mb-1">headers</div>
                          <pre className="text-[11px] leading-5 whitespace-pre-wrap break-all bg-zinc-950 text-zinc-100 rounded-xl p-3 overflow-x-auto">
                            {stringifyJson(log.requestHeaders)}
                          </pre>
                          <div className="text-zinc-500 mt-3 mb-1">body</div>
                          <pre className="text-[11px] leading-5 whitespace-pre-wrap break-all bg-zinc-950 text-zinc-100 rounded-xl p-3 overflow-x-auto">
                            {stringifyJson(log.requestBody)}
                          </pre>
                        </td>
                        <td className="px-3 py-2 text-xs text-zinc-700 max-w-[28rem]">
                          <pre className="text-[11px] leading-5 whitespace-pre-wrap break-all bg-zinc-100 text-zinc-800 rounded-xl p-3 overflow-x-auto">
                            {stringifyJson(log.responseBody)}
                          </pre>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {filteredLogs.length > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <div className="text-xs text-zinc-500">
                  {(filteredLogs.length === 0 ? 0 : (currentPage - 1) * pageSize + 1).toLocaleString("ko-KR")}
                  -
                  {Math.min(currentPage * pageSize, filteredLogs.length).toLocaleString("ko-KR")}
                  / {filteredLogs.length.toLocaleString("ko-KR")}건
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage(1)}
                    className="px-2.5 py-1.5 rounded-md text-xs font-semibold border border-zinc-300 text-zinc-700 disabled:opacity-40"
                  >
                    처음
                  </button>
                  <button
                    type="button"
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    className="px-2.5 py-1.5 rounded-md text-xs font-semibold border border-zinc-300 text-zinc-700 disabled:opacity-40"
                  >
                    이전
                  </button>
                  {pageNumbers.map((page) => (
                    <button
                      key={`page-${page}`}
                      type="button"
                      onClick={() => setCurrentPage(page)}
                      className={`px-2.5 py-1.5 rounded-md text-xs font-semibold border ${
                        page === currentPage
                          ? "bg-zinc-900 text-white border-zinc-900"
                          : "border-zinc-300 text-zinc-700"
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    type="button"
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                    className="px-2.5 py-1.5 rounded-md text-xs font-semibold border border-zinc-300 text-zinc-700 disabled:opacity-40"
                  >
                    다음
                  </button>
                  <button
                    type="button"
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage(totalPages)}
                    className="px-2.5 py-1.5 rounded-md text-xs font-semibold border border-zinc-300 text-zinc-700 disabled:opacity-40"
                  >
                    마지막
                  </button>
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              {statusStats.map((item) => (
                <span
                  key={`status-${item.value}`}
                  className={`px-2 py-1 rounded-full text-xs font-semibold border ${
                    item.value === "success"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                      : item.value === "error"
                        ? "bg-rose-50 text-rose-700 border-rose-100"
                        : "bg-zinc-50 text-zinc-700 border-zinc-100"
                  }`}
                >
                  {item.value}: {item.count.toLocaleString("ko-KR")}
                </span>
              ))}

              {callbackKindStats.map((item) => (
                <span
                  key={`callback-kind-stat-${item.value}`}
                  className="px-2 py-1 rounded-full text-xs font-semibold border bg-sky-50 text-sky-700 border-sky-100"
                >
                  {item.value}: {item.count.toLocaleString("ko-KR")}
                </span>
              ))}

              {storeStats.slice(0, 10).map((item) => (
                <span
                  key={`store-stat-${item.value}`}
                  className="px-2 py-1 rounded-full text-xs font-semibold border bg-violet-50 text-violet-700 border-violet-100"
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
