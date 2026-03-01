"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";

type RangeKey = "today" | "yesterday" | "dayBeforeYesterday";
type TransactionTypeFilter = "all" | "deposited" | "withdrawn";

type StatItem = {
  value: string;
  count: number;
};

type BankTransferWebhookLog = {
  _id?: string;
  createdAt?: string;
  headers?: Record<string, any>;
  body?: {
    transaction_type?: string;
    bank_account_id?: string;
    bank_account_number?: string;
    bank_code?: string;
    amount?: number;
    transaction_date?: string;
    transaction_name?: string;
    balance?: number;
    processing_date?: string;
    match?: unknown;
    tradeId?: string;
  };
};

const rangeOptions: { key: RangeKey; label: string }[] = [
  { key: "today", label: "오늘" },
  { key: "yesterday", label: "어제" },
  { key: "dayBeforeYesterday", label: "그제" },
];

const transactionTypeOptions: { key: TransactionTypeFilter; label: string }[] = [
  { key: "all", label: "전체" },
  { key: "deposited", label: "입금" },
  { key: "withdrawn", label: "출금" },
];

const parseDateValue = (value: unknown): Date | null => {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;

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

const toText = (value: unknown) => {
  const normalized = String(value ?? "").trim();
  return normalized || "-";
};

const getTransactionTypeLabel = (value: unknown) => {
  const normalized = String(value || "").toLowerCase();
  if (normalized === "deposited" || normalized === "deposit" || normalized === "입금") return "입금";
  if (normalized === "withdrawn" || normalized === "withdrawal" || normalized === "출금") return "출금";
  return toText(value);
};

const getTransactionTypeBadgeClass = (value: unknown) => {
  const normalized = String(value || "").toLowerCase();
  if (normalized === "deposited" || normalized === "deposit" || normalized === "입금") {
    return "bg-emerald-100 text-emerald-800 border border-emerald-200";
  }
  if (normalized === "withdrawn" || normalized === "withdrawal" || normalized === "출금") {
    return "bg-rose-100 text-rose-800 border border-rose-200";
  }
  return "bg-zinc-100 text-zinc-700 border border-zinc-200";
};

const getMatchBadgeClass = (value: unknown) => {
  const normalized = String(value ?? "").toLowerCase();
  if (value === true || normalized === "true" || normalized === "success" || normalized === "matched" || normalized === "1") {
    return "bg-blue-100 text-blue-800 border border-blue-200";
  }
  if (value === false || normalized === "false" || normalized === "null" || normalized === "") {
    return "bg-amber-100 text-amber-800 border border-amber-200";
  }
  return "bg-zinc-100 text-zinc-700 border border-zinc-200";
};

export default function BanktransferLogPage() {
  const [logs, setLogs] = useState<BankTransferWebhookLog[]>([]);
  const [transactionStats, setTransactionStats] = useState<StatItem[]>([]);
  const [matchStats, setMatchStats] = useState<StatItem[]>([]);
  const [selectedRange, setSelectedRange] = useState<RangeKey>("today");
  const [selectedTransactionType, setSelectedTransactionType] = useState<TransactionTypeFilter>("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchedAt, setFetchedAt] = useState<Date | null>(null);

  const fetchLogs = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const response = await fetch("/api/webhookLog/getBankTransfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          range: selectedRange,
          transactionType: selectedTransactionType,
          limit: 5000,
        }),
      });

      if (!response.ok) {
        throw new Error("failed_to_fetch_banktransfer_logs");
      }

      const data = await response.json();
      setLogs(data?.result?.logs || []);
      setTransactionStats(data?.transactionStats || []);
      setMatchStats(data?.matchStats || []);
      setFetchedAt(new Date());
    } catch (error) {
      toast.error("banktransfer 로그 조회에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    const intervalId = setInterval(fetchLogs, 10_000);
    return () => clearInterval(intervalId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRange, selectedTransactionType]);

  const filteredLogs = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return logs;

    return logs.filter((log) => {
      const body = log.body || {};
      const headers = log.headers || {};
      const target = [
        body.transaction_type,
        body.transaction_name,
        body.bank_account_number,
        body.bank_code,
        body.amount,
        body.balance,
        body.transaction_date,
        body.processing_date,
        body.match,
        body.tradeId,
        headers["x-trace-id"],
        headers["x-mall-id"],
      ]
        .filter((value) => value !== undefined && value !== null)
        .join(" ")
        .toLowerCase();

      return target.includes(query);
    });
  }, [logs, search]);

  const depositedCount = useMemo(
    () => filteredLogs.filter((log) => String(log.body?.transaction_type || "").toLowerCase() === "deposited").length,
    [filteredLogs],
  );
  const withdrawnCount = useMemo(
    () => filteredLogs.filter((log) => String(log.body?.transaction_type || "").toLowerCase() === "withdrawn").length,
    [filteredLogs],
  );

  return (
    <main className="w-full px-3 sm:px-4 md:px-6 lg:px-10 pb-10">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 bg-gradient-to-r from-slate-900 via-indigo-900 to-slate-900 text-white rounded-2xl p-4 shadow-lg shadow-slate-900/40">
          <div>
            <div className="text-xs uppercase tracking-[0.14em] text-indigo-200">Webhook Logs</div>
            <div className="text-xl font-bold">BankTransfer 호출 로그</div>
            <div className="text-xs text-slate-300 mt-1">event: banktransfer_webhook</div>
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
            <span className="px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 text-xs font-semibold">
              입금 {depositedCount.toLocaleString("ko-KR")}
            </span>
            <span className="px-2 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-100 text-xs font-semibold">
              출금 {withdrawnCount.toLocaleString("ko-KR")}
            </span>
            <span className="text-xs text-zinc-400">
              {fetchedAt ? `업데이트: ${formatDateTime(fetchedAt)}` : "업데이트 대기중..."}
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-2">
            <select
              value={selectedTransactionType}
              onChange={(event) => setSelectedTransactionType(event.target.value as TransactionTypeFilter)}
              className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm text-zinc-800 bg-white"
            >
              {transactionTypeOptions.map((item) => (
                <option key={item.key} value={item.key}>
                  유형: {item.label}
                </option>
              ))}
            </select>

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="입금자명, 계좌번호, 금액, traceId 검색"
              className="w-full lg:col-span-2 border border-zinc-300 rounded-lg px-3 py-2 text-sm text-zinc-800 bg-white"
            />
          </div>

          <div className="flex flex-wrap gap-2 text-xs text-zinc-600">
            <span className="font-semibold">유형 통계:</span>
            {transactionStats.length === 0 ? (
              <span>-</span>
            ) : (
              transactionStats.map((item) => (
                <span key={`trx-${item.value}`} className="px-2 py-0.5 rounded-full bg-zinc-100 border border-zinc-200">
                  {item.value}: {item.count.toLocaleString("ko-KR")}
                </span>
              ))
            )}
          </div>
          <div className="flex flex-wrap gap-2 text-xs text-zinc-600">
            <span className="font-semibold">match 통계:</span>
            {matchStats.length === 0 ? (
              <span>-</span>
            ) : (
              matchStats.map((item) => (
                <span key={`match-${item.value}`} className="px-2 py-0.5 rounded-full bg-zinc-100 border border-zinc-200">
                  {item.value}: {item.count.toLocaleString("ko-KR")}
                </span>
              ))
            )}
          </div>
        </div>

        {filteredLogs.length === 0 ? (
          <div className="w-full bg-white rounded-lg shadow-md border border-dashed border-zinc-300 p-8 text-center text-zinc-500">
            조회된 banktransfer 호출 로그가 없습니다.
          </div>
        ) : (
          <div className="overflow-x-auto bg-white rounded-2xl border border-zinc-200 shadow">
            <table className="w-full text-sm">
              <thead className="bg-zinc-100 text-zinc-700 text-xs">
                <tr>
                  <th className="text-left px-3 py-2">시간</th>
                  <th className="text-left px-3 py-2">유형</th>
                  <th className="text-left px-3 py-2">거래정보</th>
                  <th className="text-left px-3 py-2">계좌/잔액</th>
                  <th className="text-left px-3 py-2">match</th>
                  <th className="text-left px-3 py-2">trace/mall</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log, idx) => {
                  const body = log.body || {};
                  const headers = log.headers || {};
                  const rowKey = String(log._id || `${log.createdAt || "unknown"}-${idx}`);
                  const matchLabel = toText(body.match);

                  return (
                    <tr key={rowKey} className="border-t border-zinc-100 align-top">
                      <td className="px-3 py-2 whitespace-nowrap">
                        <div className="font-medium text-zinc-900">{formatDateTime(log.createdAt)}</div>
                        <div className="text-[11px] text-zinc-500">{formatTimeAgo(log.createdAt)}</div>
                      </td>
                      <td className="px-3 py-2 min-w-[90px]">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${getTransactionTypeBadgeClass(
                            body.transaction_type,
                          )}`}
                        >
                          {getTransactionTypeLabel(body.transaction_type)}
                        </span>
                      </td>
                      <td className="px-3 py-2 min-w-[240px]">
                        <div className="text-zinc-900 font-semibold">{toText(body.transaction_name)}</div>
                        <div className="text-zinc-700 text-xs mt-1">금액: {formatNumber(body.amount)}원</div>
                        <div className="text-zinc-500 text-xs mt-1">
                          거래시각: {formatDateTime(body.transaction_date)}
                        </div>
                        <div className="text-zinc-500 text-xs mt-1">
                          처리시각: {formatDateTime(body.processing_date)}
                        </div>
                      </td>
                      <td className="px-3 py-2 min-w-[220px]">
                        <div className="text-zinc-900 text-xs break-all">계좌: {toText(body.bank_account_number)}</div>
                        <div className="text-zinc-700 text-xs mt-1">코드: {toText(body.bank_code)}</div>
                        <div className="text-zinc-700 text-xs mt-1">잔액: {formatNumber(body.balance)}</div>
                      </td>
                      <td className="px-3 py-2 min-w-[140px]">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${getMatchBadgeClass(
                            body.match,
                          )}`}
                        >
                          {matchLabel}
                        </span>
                        <div className="text-zinc-700 text-xs mt-1 break-all">tradeId: {toText(body.tradeId)}</div>
                      </td>
                      <td className="px-3 py-2 min-w-[220px]">
                        <div className="text-zinc-800 text-xs break-all">trace: {toText(headers["x-trace-id"])}</div>
                        <div className="text-zinc-500 text-xs break-all mt-1">mall: {toText(headers["x-mall-id"])}</div>
                        <div className="text-zinc-500 text-xs break-all mt-1">
                          webhookKey: {toText(headers["x-webhook-key"])}
                        </div>
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
