"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";

type RangeKey = "today" | "yesterday" | "dayBeforeYesterday";

type BankMatchLog = {
  _id?: string;
  createdAt?: string;
  body?: {
    request?: {
      order_number?: string;
      order_status?: string;
      processing_date?: string;
      [key: string]: any;
    };
    result?: {
      status?: string;
      message?: string | null;
      stage?: string;
      tradeId?: string | null;
      buyOrderId?: string | null;
      storecode?: string | null;
      paymentAmount?: number | null;
      buyOrderStatusBefore?: string | null;
      [key: string]: any;
    };
    traceId?: string | null;
    mallId?: string | null;
  };
  error?: {
    name?: string;
    message?: string;
    stack?: string;
  };
};

type StatusStat = {
  status: string;
  count: number;
};

const rangeOptions: { key: RangeKey; label: string }[] = [
  { key: "today", label: "오늘" },
  { key: "yesterday", label: "어제" },
  { key: "dayBeforeYesterday", label: "그제" },
];

const parseDateValue = (value: unknown): Date | null => {
  if (!value) return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  const raw = String(value).trim();
  if (!raw) return null;

  const normalized = raw.replace(/\//g, "-");
  const hasTimezone = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(normalized);
  const hasT = normalized.includes("T");
  let candidate = normalized;

  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}(?:\.\d+)?$/.test(normalized)) {
    candidate = `${normalized.replace(" ", "T")}+09:00`;
  } else if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    candidate = `${normalized}T00:00:00+09:00`;
  } else if (hasT && !hasTimezone) {
    candidate = `${normalized}+09:00`;
  }

  const date = new Date(candidate);
  return Number.isNaN(date.getTime()) ? null : date;
};

const formatDateTime = (value: unknown) => {
  if (!value) return "-";
  const date = parseDateValue(value);
  if (!date) return String(value);
  return date.toLocaleString("ko-KR", { timeZone: "Asia/Seoul" });
};

const formatTimeAgo = (value: unknown) => {
  if (!value) return "-";
  const date = parseDateValue(value);
  if (!date) return String(value);

  const diffMs = Date.now() - date.getTime();
  const isFuture = diffMs < 0;
  const diff = Math.abs(diffMs);
  const sec = Math.floor(diff / 1000);
  const min = Math.floor(sec / 60);
  const hour = Math.floor(min / 60);
  const day = Math.floor(hour / 24);
  const suffix = isFuture ? "후" : "전";

  if (sec < 60) return `${sec}초 ${suffix}`;
  if (min < 60) return `${min}분 ${suffix}`;
  if (hour < 24) return `${hour}시간 ${suffix}`;
  return `${day}일 ${suffix}`;
};

const formatNumber = (value: unknown) => {
  if (value === null || value === undefined || value === "") return "-";
  const num = Number(value);
  if (Number.isNaN(num)) return String(value);
  return num.toLocaleString("ko-KR");
};

const getStatusBadgeClass = (status: string) => {
  const normalized = String(status || "").toLowerCase();
  if (normalized === "success") return "bg-emerald-100 text-emerald-800 border-emerald-200";
  if (normalized === "error") return "bg-rose-100 text-rose-800 border-rose-200";
  if (normalized === "false") return "bg-amber-100 text-amber-800 border-amber-200";
  return "bg-zinc-100 text-zinc-700 border-zinc-200";
};

export default function BankMatchLogPage() {
  const [logs, setLogs] = useState<BankMatchLog[]>([]);
  const [statusStats, setStatusStats] = useState<StatusStat[]>([]);
  const [selectedRange, setSelectedRange] = useState<RangeKey>("today");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchedAt, setFetchedAt] = useState<Date | null>(null);

  const fetchLogs = async () => {
    if (loading) return;
    setLoading(true);

    try {
      const response = await fetch("/api/webhookLog/getBankMatch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          range: selectedRange,
          limit: 5000,
        }),
      });

      if (!response.ok) {
        throw new Error("failed_to_fetch_bankmatch_logs");
      }

      const data = await response.json();
      setLogs(data?.result?.logs || []);
      setStatusStats(data?.statusStats || []);
      setFetchedAt(new Date());
    } catch (error) {
      toast.error("bankMatch 로그 조회에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    const intervalId = setInterval(fetchLogs, 15_000);
    return () => clearInterval(intervalId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRange]);

  const filteredLogs = useMemo(() => {
    const q = search.trim().toLowerCase();

    return logs.filter((log) => {
      const request = log.body?.request || {};
      const result = log.body?.result || {};
      const status = String(result.status || "").toLowerCase();

      if (selectedStatus !== "ALL" && status !== selectedStatus.toLowerCase()) {
        return false;
      }

      if (!q) return true;

      const target = [
        request.order_number,
        request.order_status,
        request.processing_date,
        result.status,
        result.message,
        result.stage,
        result.tradeId,
        result.buyOrderId,
        result.storecode,
        result.buyOrderStatusBefore,
        log.body?.traceId,
        log.body?.mallId,
        log.error?.message,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return target.includes(q);
    });
  }, [logs, search, selectedStatus]);

  const selectedRangeLabel = rangeOptions.find((item) => item.key === selectedRange)?.label || "오늘";

  const counts = useMemo(() => {
    const map = new Map<string, number>();
    filteredLogs.forEach((log) => {
      const status = String(log.body?.result?.status || "unknown").toLowerCase();
      map.set(status, (map.get(status) || 0) + 1);
    });
    return {
      total: filteredLogs.length,
      success: map.get("success") || 0,
      error: map.get("error") || 0,
      falseCount: map.get("false") || 0,
    };
  }, [filteredLogs]);

  const statusOptions = useMemo(() => {
    const options: StatusStat[] = [{ status: "ALL", count: logs.length }];
    (statusStats || []).forEach((item) => {
      options.push(item);
    });
    return options;
  }, [logs.length, statusStats]);

  return (
    <main className="w-full px-3 sm:px-4 md:px-6 lg:px-10 pb-10">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 bg-gradient-to-r from-zinc-900 via-sky-900 to-zinc-900 text-white rounded-2xl p-4 shadow-lg shadow-zinc-900/40">
          <div>
            <div className="text-xs uppercase tracking-[0.14em] text-sky-200">BankMatch Webhook</div>
            <div className="text-xl font-bold">bankMatch 호출 로그</div>
            <div className="text-xs text-zinc-300 mt-1">event: bankmatch_webhook</div>
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
                    active ? "bg-white text-zinc-900 shadow" : "text-zinc-200 hover:bg-white/10"
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-zinc-200 p-4 flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm text-zinc-500">표시</span>
            <span className="text-2xl font-black text-zinc-900">{counts.total.toLocaleString("ko-KR")}건</span>
            <span className="text-xs text-zinc-400">/ 전체 {logs.length.toLocaleString("ko-KR")}건</span>
            <span className="text-xs text-zinc-400">
              {fetchedAt ? `업데이트: ${formatDateTime(fetchedAt)}` : "업데이트 대기중..."}
            </span>
            <span className="text-xs text-zinc-400">범위: {selectedRangeLabel}</span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2">
              <div className="text-xs text-zinc-500">총 호출</div>
              <div className="text-lg font-black text-zinc-900">{counts.total.toLocaleString("ko-KR")}</div>
            </div>
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">
              <div className="text-xs text-emerald-700">성공</div>
              <div className="text-lg font-black text-emerald-900">{counts.success.toLocaleString("ko-KR")}</div>
            </div>
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
              <div className="text-xs text-amber-700">매칭 스킵(false)</div>
              <div className="text-lg font-black text-amber-900">{counts.falseCount.toLocaleString("ko-KR")}</div>
            </div>
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2">
              <div className="text-xs text-rose-700">오류</div>
              <div className="text-lg font-black text-rose-900">{counts.error.toLocaleString("ko-KR")}</div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-2">
            <select
              value={selectedStatus}
              onChange={(event) => setSelectedStatus(event.target.value)}
              className="w-full md:w-64 border border-zinc-300 rounded-lg px-3 py-2 text-sm text-zinc-800 bg-white"
            >
              {statusOptions.map((item) => (
                <option key={item.status} value={item.status}>
                  {item.status} ({item.count.toLocaleString("ko-KR")})
                </option>
              ))}
            </select>

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="flex-1 border border-zinc-300 rounded-lg px-3 py-2 text-sm text-zinc-800"
              placeholder="order_number, traceId, stage, message 검색"
            />

            <button
              type="button"
              onClick={fetchLogs}
              className="px-3 py-2 rounded-lg bg-zinc-900 text-white text-sm font-semibold hover:bg-zinc-800 disabled:opacity-60"
              disabled={loading}
            >
              {loading ? "조회중..." : "새로고침"}
            </button>
          </div>
        </div>

        <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-zinc-50 text-zinc-600">
                <tr>
                  <th className="text-left px-3 py-2 font-semibold">수신시각</th>
                  <th className="text-left px-3 py-2 font-semibold">order_number</th>
                  <th className="text-left px-3 py-2 font-semibold">요청상태</th>
                  <th className="text-left px-3 py-2 font-semibold">결과상태</th>
                  <th className="text-left px-3 py-2 font-semibold">처리스테이지</th>
                  <th className="text-left px-3 py-2 font-semibold">메시지</th>
                  <th className="text-left px-3 py-2 font-semibold">상세</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-3 py-10 text-center text-zinc-400">
                      조회된 bankMatch 로그가 없습니다.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log, index) => {
                    const request = log.body?.request || {};
                    const result = log.body?.result || {};
                    const resultStatus = String(result.status || "unknown");
                    const message = result.message || log.error?.message || "-";
                    return (
                      <tr key={log._id || `${log.createdAt}-${index}`} className="border-t border-zinc-100 align-top">
                        <td className="px-3 py-2 whitespace-nowrap">
                          <div className="font-semibold text-zinc-900">{formatDateTime(log.createdAt)}</div>
                          <div className="text-xs text-zinc-500">{formatTimeAgo(log.createdAt)}</div>
                        </td>
                        <td className="px-3 py-2 font-mono text-xs text-zinc-800">{request.order_number || "-"}</td>
                        <td className="px-3 py-2">{request.order_status || "-"}</td>
                        <td className="px-3 py-2">
                          <span className={`inline-flex items-center px-2 py-1 text-xs font-bold rounded border ${getStatusBadgeClass(resultStatus)}`}>
                            {resultStatus}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-zinc-700">{result.stage || "-"}</td>
                        <td className="px-3 py-2 text-zinc-700 max-w-[28rem]">{String(message)}</td>
                        <td className="px-3 py-2 text-xs text-zinc-600 whitespace-nowrap">
                          <div>trace: {log.body?.traceId || "-"}</div>
                          <div>store: {result.storecode || "-"}</div>
                          <div>trade: {result.tradeId || "-"}</div>
                          <div>orderId: {result.buyOrderId || "-"}</div>
                          <div>amount: {formatNumber(result.paymentAmount)}</div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}

