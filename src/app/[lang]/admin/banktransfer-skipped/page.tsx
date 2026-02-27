"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";

type RangeKey = "today" | "yesterday" | "dayBeforeYesterday";

type SkipWebhookLog = {
  _id?: string;
  createdAt?: string;
  body?: {
    reasonCode?: string;
    reason?: string;
    stage?: string;
    traceId?: string | null;
    mallId?: string | null;
    transactionType?: string | null;
    bankAccountId?: string | null;
    originalBankAccountNumber?: string | null;
    normalizedBankAccountNumber?: string | null;
    amount?: number | null;
    transactionDate?: string | null;
    transactionName?: string | null;
  };
  error?: {
    name?: string;
    message?: string;
    stack?: string;
  };
};

type ReasonStat = {
  reasonCode: string;
  count: number;
};

const rangeOptions: { key: RangeKey; label: string }[] = [
  { key: "today", label: "오늘" },
  { key: "yesterday", label: "어제" },
  { key: "dayBeforeYesterday", label: "그제" },
];

const formatNumber = (value: unknown) => {
  if (value === null || value === undefined || value === "") return "-";
  const num = Number(value);
  if (Number.isNaN(num)) return String(value);
  return num.toLocaleString("ko-KR");
};

const formatDateTime = (value: unknown) => {
  if (!value) return "-";
  const date = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString("ko-KR");
};

const formatTimeAgo = (value: unknown) => {
  if (!value) return "-";
  const date = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(date.getTime())) return String(value);

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

export default function BankTransferSkippedPage() {
  const [logs, setLogs] = useState<SkipWebhookLog[]>([]);
  const [reasonStats, setReasonStats] = useState<ReasonStat[]>([]);
  const [selectedRange, setSelectedRange] = useState<RangeKey>("today");
  const [selectedReason, setSelectedReason] = useState<string>("ALL");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchedAt, setFetchedAt] = useState<Date | null>(null);

  const fetchLogs = async () => {
    if (loading) return;
    setLoading(true);

    try {
      const response = await fetch("/api/webhookLog/getStoreSkipped", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          range: selectedRange,
          limit: 5000,
        }),
      });

      if (!response.ok) {
        throw new Error("failed_to_fetch_store_skipped");
      }

      const data = await response.json();
      setLogs(data?.result?.logs || []);
      setReasonStats(data?.reasonStats || []);
      setFetchedAt(new Date());
    } catch (error) {
      toast.error("누락 로그 조회에 실패했습니다.");
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
    if (selectedReason === "ALL") return;
    const exists = reasonStats.some((item) => item.reasonCode === selectedReason);
    if (!exists) setSelectedReason("ALL");
  }, [reasonStats, selectedReason]);

  const filteredLogs = useMemo(() => {
    const q = search.trim().toLowerCase();

    return logs.filter((log) => {
      const body = log.body || {};
      const matchesReason = selectedReason === "ALL" || String(body.reasonCode || "") === selectedReason;
      if (!matchesReason) return false;
      if (!q) return true;

      const searchTarget = [
        body.reasonCode,
        body.reason,
        body.stage,
        body.traceId,
        body.mallId,
        body.originalBankAccountNumber,
        body.normalizedBankAccountNumber,
        body.transactionName,
        body.transactionDate,
        body.transactionType,
        body.bankAccountId,
        body.amount,
        log.error?.message,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchTarget.includes(q);
    });
  }, [logs, search, selectedReason]);

  const uniqueAccounts = useMemo(() => {
    const set = new Set<string>();
    filteredLogs.forEach((log) => {
      const body = log.body || {};
      const account =
        String(body.normalizedBankAccountNumber || "").trim() ||
        String(body.originalBankAccountNumber || "").trim();
      if (account) set.add(account);
    });
    return set.size;
  }, [filteredLogs]);

  const selectedRangeLabel = rangeOptions.find((option) => option.key === selectedRange)?.label || "오늘";
  const reasonOptions = useMemo(
    () => [{ reasonCode: "ALL", count: logs.length }, ...reasonStats],
    [logs.length, reasonStats],
  );

  return (
    <main className="w-full px-3 sm:px-4 md:px-6 lg:px-10 pb-10">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 bg-gradient-to-r from-zinc-900 via-rose-950 to-zinc-900 text-white rounded-2xl p-4 shadow-lg shadow-zinc-900/40">
          <div>
            <div className="text-xs uppercase tracking-[0.14em] text-rose-200">Banktransfer Webhook</div>
            <div className="text-xl font-bold">bankTransfers 저장 누락 로그</div>
            <div className="text-xs text-zinc-300 mt-1">event: banktransfer_store_skipped</div>
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
            <span className="text-2xl font-black text-zinc-900">{filteredLogs.length.toLocaleString("ko-KR")}건</span>
            <span className="text-xs text-zinc-400">/ 전체 {logs.length.toLocaleString("ko-KR")}건</span>
            <span className="px-2 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-100 text-xs font-semibold">
              계좌 {uniqueAccounts.toLocaleString("ko-KR")}개
            </span>
            <span className="text-xs text-zinc-400">
              {fetchedAt ? `업데이트: ${formatDateTime(fetchedAt)}` : "업데이트 대기중..."}
            </span>
            <span className="text-xs text-zinc-400">범위: {selectedRangeLabel}</span>
          </div>

          <div className="flex flex-col md:flex-row gap-2">
            <select
              value={selectedReason}
              onChange={(event) => setSelectedReason(event.target.value)}
              className="w-full md:w-72 border border-zinc-300 rounded-lg px-3 py-2 text-sm text-zinc-800 bg-white"
            >
              {reasonOptions.map((item) => (
                <option key={item.reasonCode} value={item.reasonCode}>
                  {item.reasonCode} ({item.count.toLocaleString("ko-KR")})
                </option>
              ))}
            </select>

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="사유코드, 계좌번호, traceId, 입금자명 검색"
              className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm text-zinc-800 bg-white"
            />
          </div>
        </div>

        {filteredLogs.length === 0 ? (
          <div className="w-full bg-white rounded-lg shadow-md border border-dashed border-zinc-300 p-8 text-center text-zinc-500">
            조회된 누락 로그가 없습니다.
          </div>
        ) : (
          <div className="overflow-x-auto bg-white rounded-2xl border border-zinc-200 shadow">
            <table className="w-full text-sm">
              <thead className="bg-zinc-100 text-zinc-700 text-xs">
                <tr>
                  <th className="text-left px-3 py-2">시간</th>
                  <th className="text-left px-3 py-2">사유</th>
                  <th className="text-left px-3 py-2">계좌</th>
                  <th className="text-left px-3 py-2">거래정보</th>
                  <th className="text-left px-3 py-2">trace/mall</th>
                  <th className="text-left px-3 py-2">오류</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log, idx) => {
                  const body = log.body || {};
                  const createdAt = log.createdAt;
                  const reasonCode = body.reasonCode || "UNKNOWN";
                  const reason = body.reason || "-";
                  const stage = body.stage || "-";
                  const originalAccount = body.originalBankAccountNumber || "-";
                  const normalizedAccount = body.normalizedBankAccountNumber || "-";
                  const transactionName = body.transactionName || "-";
                  const amount = body.amount;
                  const transactionType = body.transactionType || "-";
                  const transactionDate = body.transactionDate || "-";
                  const traceId = body.traceId || "-";
                  const mallId = body.mallId || "-";
                  const errorMessage = log.error?.message || "-";
                  const rowKey = String(log._id || `${createdAt || "unknown"}-${idx}`);

                  return (
                    <tr key={rowKey} className="border-t border-zinc-100 align-top">
                      <td className="px-3 py-2 whitespace-nowrap">
                        <div className="font-medium text-zinc-900">{formatDateTime(createdAt)}</div>
                        <div className="text-[11px] text-zinc-500">{formatTimeAgo(createdAt)}</div>
                      </td>
                      <td className="px-3 py-2 min-w-[200px]">
                        <div className="inline-flex items-center px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200 text-[11px] font-semibold">
                          {reasonCode}
                        </div>
                        <div className="text-zinc-800 mt-1">{reason}</div>
                        <div className="text-[11px] text-zinc-500 mt-1">stage: {stage}</div>
                      </td>
                      <td className="px-3 py-2 min-w-[220px]">
                        <div className="text-zinc-900">원본: {originalAccount}</div>
                        <div className="text-zinc-600 text-xs mt-1">정규화: {normalizedAccount}</div>
                      </td>
                      <td className="px-3 py-2 min-w-[220px]">
                        <div className="text-zinc-900">{transactionName}</div>
                        <div className="text-zinc-600 text-xs mt-1">
                          {transactionType} / {formatNumber(amount)} / {transactionDate}
                        </div>
                      </td>
                      <td className="px-3 py-2 min-w-[200px]">
                        <div className="text-zinc-800 text-xs break-all">trace: {traceId}</div>
                        <div className="text-zinc-500 text-xs break-all mt-1">mall: {mallId}</div>
                      </td>
                      <td className="px-3 py-2 min-w-[220px]">
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
