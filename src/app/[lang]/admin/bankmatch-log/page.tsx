"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";

type RangeKey = "today" | "yesterday" | "dayBeforeYesterday";

type StatItem = {
  value: string;
  count: number;
};

type BankMatchWebhookLog = {
  _id?: string;
  createdAt?: string;
  body?: {
    stage?: string;
    traceId?: string | null;
    mallId?: string | null;
    orderNumber?: string | null;
    orderStatus?: string | null;
    processingDate?: string | null;
    responseStatus?: string | null;
    responseMessage?: string | null;
    reasonCode?: string | null;
    tradeId?: string | null;
    buyOrderId?: string | null;
    buyOrderStatus?: string | null;
    storecode?: string | null;
    paymentAmount?: number | null;
    buyerDepositName?: string | null;
    buyerNickname?: string | null;
    confirmStatus?: string | null;
    confirmMessage?: string | null;
  };
  error?: {
    name?: string;
    message?: string;
    stack?: string;
  };
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
  return date.toLocaleString("ko-KR", {
    timeZone: "Asia/Seoul",
  });
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

const toText = (value: unknown) => {
  const normalized = String(value || "").trim();
  return normalized || "-";
};

const getStatusClass = (status: string) => {
  if (status === "success") return "bg-emerald-100 text-emerald-800 border border-emerald-200";
  if (status === "false") return "bg-amber-100 text-amber-800 border border-amber-200";
  if (status === "error") return "bg-rose-100 text-rose-800 border border-rose-200";
  return "bg-zinc-100 text-zinc-700 border border-zinc-200";
};

export default function BankMatchLogPage() {
  const [logs, setLogs] = useState<BankMatchWebhookLog[]>([]);
  const [statusStats, setStatusStats] = useState<StatItem[]>([]);
  const [stageStats, setStageStats] = useState<StatItem[]>([]);
  const [selectedRange, setSelectedRange] = useState<RangeKey>("today");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [selectedStage, setSelectedStage] = useState<string>("ALL");
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
      setStageStats(data?.stageStats || []);
      setFetchedAt(new Date());
    } catch (error) {
      toast.error("bankmatch 로그 조회에 실패했습니다.");
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

  useEffect(() => {
    if (selectedStatus === "ALL") return;
    const exists = statusStats.some((item) => item.value === selectedStatus);
    if (!exists) setSelectedStatus("ALL");
  }, [selectedStatus, statusStats]);

  useEffect(() => {
    if (selectedStage === "ALL") return;
    const exists = stageStats.some((item) => item.value === selectedStage);
    if (!exists) setSelectedStage("ALL");
  }, [selectedStage, stageStats]);

  const filteredLogs = useMemo(() => {
    const query = search.trim().toLowerCase();

    return logs.filter((log) => {
      const body = log.body || {};
      const status = String(body.responseStatus || "UNKNOWN");
      const stage = String(body.stage || "UNKNOWN");

      if (selectedStatus !== "ALL" && status !== selectedStatus) return false;
      if (selectedStage !== "ALL" && stage !== selectedStage) return false;
      if (!query) return true;

      const searchTarget = [
        body.orderNumber,
        body.orderStatus,
        body.processingDate,
        body.responseStatus,
        body.responseMessage,
        body.reasonCode,
        body.stage,
        body.tradeId,
        body.buyOrderId,
        body.storecode,
        body.traceId,
        body.mallId,
        body.buyerDepositName,
        body.buyerNickname,
        body.confirmStatus,
        body.confirmMessage,
        log.error?.message,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchTarget.includes(query);
    });
  }, [logs, search, selectedStage, selectedStatus]);

  const uniqueTradeCount = useMemo(() => {
    const set = new Set<string>();
    filteredLogs.forEach((log) => {
      const body = log.body || {};
      const tradeId = String(body.tradeId || body.orderNumber || "").trim();
      if (tradeId) {
        set.add(tradeId);
      }
    });
    return set.size;
  }, [filteredLogs]);

  const selectedRangeLabel = rangeOptions.find((item) => item.key === selectedRange)?.label || "오늘";
  const statusOptions = useMemo(
    () => [{ value: "ALL", count: logs.length }, ...statusStats],
    [logs.length, statusStats],
  );
  const stageOptions = useMemo(
    () => [{ value: "ALL", count: logs.length }, ...stageStats],
    [logs.length, stageStats],
  );

  return (
    <main className="w-full px-3 sm:px-4 md:px-6 lg:px-10 pb-10">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 bg-gradient-to-r from-indigo-900 via-slate-900 to-cyan-900 text-white rounded-2xl p-4 shadow-lg shadow-slate-900/40">
          <div>
            <div className="text-xs uppercase tracking-[0.14em] text-cyan-200">Webhook Logs</div>
            <div className="text-xl font-bold">bankmatch 웹훅 로그</div>
            <div className="text-xs text-slate-300 mt-1">event: bankmatch_webhook</div>
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

        <div className="bg-white rounded-2xl shadow-lg border border-zinc-200 p-4 flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm text-zinc-500">표시</span>
            <span className="text-2xl font-black text-zinc-900">{filteredLogs.length.toLocaleString("ko-KR")}건</span>
            <span className="text-xs text-zinc-400">/ 전체 {logs.length.toLocaleString("ko-KR")}건</span>
            <span className="px-2 py-1 rounded-full bg-cyan-50 text-cyan-700 border border-cyan-100 text-xs font-semibold">
              거래 {uniqueTradeCount.toLocaleString("ko-KR")}건
            </span>
            <span className="text-xs text-zinc-400">범위: {selectedRangeLabel}</span>
            <span className="text-xs text-zinc-400">
              {fetchedAt ? `업데이트: ${formatDateTime(fetchedAt)}` : "업데이트 대기중..."}
            </span>
          </div>

          <div className="flex flex-col md:flex-row gap-2">
            <select
              value={selectedStatus}
              onChange={(event) => setSelectedStatus(event.target.value)}
              className="w-full md:w-56 border border-zinc-300 rounded-lg px-3 py-2 text-sm text-zinc-800 bg-white"
            >
              {statusOptions.map((item) => (
                <option key={`status-${item.value}`} value={item.value}>
                  상태 {item.value} ({item.count.toLocaleString("ko-KR")})
                </option>
              ))}
            </select>

            <select
              value={selectedStage}
              onChange={(event) => setSelectedStage(event.target.value)}
              className="w-full md:w-72 border border-zinc-300 rounded-lg px-3 py-2 text-sm text-zinc-800 bg-white"
            >
              {stageOptions.map((item) => (
                <option key={`stage-${item.value}`} value={item.value}>
                  단계 {item.value} ({item.count.toLocaleString("ko-KR")})
                </option>
              ))}
            </select>

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="tradeId, orderNumber, stage, traceId, 오류 검색"
              className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm text-zinc-800 bg-white"
            />
          </div>
        </div>

        {filteredLogs.length === 0 ? (
          <div className="w-full bg-white rounded-lg shadow-md border border-dashed border-zinc-300 p-8 text-center text-zinc-500">
            조회된 bankmatch 로그가 없습니다.
          </div>
        ) : (
          <div className="overflow-x-auto bg-white rounded-2xl border border-zinc-200 shadow">
            <table className="w-full text-sm">
              <thead className="bg-zinc-100 text-zinc-700 text-xs">
                <tr>
                  <th className="text-left px-3 py-2">시간</th>
                  <th className="text-left px-3 py-2">주문</th>
                  <th className="text-left px-3 py-2">처리결과</th>
                  <th className="text-left px-3 py-2">BuyOrder</th>
                  <th className="text-left px-3 py-2">trace/mall</th>
                  <th className="text-left px-3 py-2">오류</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log, index) => {
                  const body = log.body || {};
                  const createdAt = log.createdAt;
                  const orderNumber = body.orderNumber || "-";
                  const orderStatus = body.orderStatus || "-";
                  const processingDate = body.processingDate || "-";
                  const responseStatus = toText(body.responseStatus);
                  const responseMessage = toText(body.responseMessage);
                  const reasonCode = toText(body.reasonCode);
                  const stage = toText(body.stage);
                  const tradeId = toText(body.tradeId || body.orderNumber);
                  const buyOrderId = toText(body.buyOrderId);
                  const storecode = toText(body.storecode);
                  const paymentAmount = body.paymentAmount;
                  const traceId = toText(body.traceId);
                  const mallId = toText(body.mallId);
                  const errorMessage = toText(log.error?.message);
                  const rowKey = String(log._id || `${createdAt || "unknown"}-${index}`);

                  return (
                    <tr key={rowKey} className="border-t border-zinc-100 align-top">
                      <td className="px-3 py-2 whitespace-nowrap">
                        <div className="font-medium text-zinc-900">{formatDateTime(createdAt)}</div>
                        <div className="text-[11px] text-zinc-500">{formatTimeAgo(createdAt)}</div>
                      </td>
                      <td className="px-3 py-2 min-w-[220px]">
                        <div className="text-zinc-900 font-semibold">tradeId: {orderNumber}</div>
                        <div className="text-xs text-zinc-600 mt-1">orderStatus: {orderStatus}</div>
                        <div className="text-xs text-zinc-500 mt-1">processing: {formatDateTime(processingDate)}</div>
                      </td>
                      <td className="px-3 py-2 min-w-[260px]">
                        <div className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${getStatusClass(responseStatus)}`}>
                          {responseStatus}
                        </div>
                        <div className="text-zinc-800 mt-1">{responseMessage}</div>
                        <div className="text-[11px] text-zinc-500 mt-1">stage: {stage}</div>
                        <div className="text-[11px] text-zinc-500">reason: {reasonCode}</div>
                      </td>
                      <td className="px-3 py-2 min-w-[240px]">
                        <div className="text-zinc-800 text-xs">tradeId: {tradeId}</div>
                        <div className="text-zinc-700 text-xs mt-1">buyOrderId: {buyOrderId}</div>
                        <div className="text-zinc-700 text-xs mt-1">storecode: {storecode}</div>
                        <div className="text-zinc-700 text-xs mt-1">amount: {formatNumber(paymentAmount)}</div>
                      </td>
                      <td className="px-3 py-2 min-w-[220px]">
                        <div className="text-zinc-800 text-xs break-all">trace: {traceId}</div>
                        <div className="text-zinc-500 text-xs break-all mt-1">mall: {mallId}</div>
                      </td>
                      <td className="px-3 py-2 min-w-[260px]">
                        <div className="text-zinc-800 text-xs break-all">{errorMessage}</div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
