"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { toast } from "react-hot-toast";

type WebhookLog = {
  _id?: string;
  body?: any;
  bankInfo?: any;
  createdAt?: string;
};

type GroupedAccount = {
  accountNumber: string;
  bankName?: string;
  accountHolder?: string;
  logs: WebhookLog[];
  totalAmount: number;
  latestCreatedAt?: string;
};

const formatNumber = (value: any) => {
  if (value === null || value === undefined || value === "") return "-";
  const num = Number(value);
  if (Number.isNaN(num)) return String(value);
  return num.toLocaleString("ko-KR", { maximumFractionDigits: 0 });
};

const parseDateValue = (value: any): Date | null => {
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

const formatDateTime = (value: any) => {
  if (!value) return "-";
  const date = parseDateValue(value);
  if (!date) return String(value);
  return date.toLocaleString("ko-KR", {
    timeZone: "Asia/Seoul",
  });
};

const formatTimeAgo = (value: any) => {
  if (!value) return "-";
  const date = parseDateValue(value);
  if (!date) return String(value);
  const diff = Date.now() - date.getTime();
  const abs = Math.abs(diff);
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  if (abs < minute) return `${Math.floor(abs / 1000)}초 ${diff < 0 ? "후" : "전"}`;
  if (abs < hour) return `${Math.floor(abs / minute)}분 ${diff < 0 ? "후" : "전"}`;
  if (abs < day) return `${Math.floor(abs / hour)}시간 ${diff < 0 ? "후" : "전"}`;
  return `${Math.floor(abs / day)}일 ${diff < 0 ? "후" : "전"}`;
};

const rangeOptions: { key: "today" | "yesterday" | "dayBeforeYesterday"; label: string }[] = [
  { key: "today", label: "오늘" },
  { key: "yesterday", label: "어제" },
  { key: "dayBeforeYesterday", label: "그제" },
];

export default function BankWithdrawnPage() {
  const [logs, setLogs] = useState<WebhookLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchedAt, setFetchedAt] = useState<Date | null>(null);
  const [selectedRange, setSelectedRange] = useState<"today" | "yesterday" | "dayBeforeYesterday">("today");

  const selectedRangeLabel = rangeOptions.find((r) => r.key === selectedRange)?.label || "오늘";

  const fetchLogs = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch("/api/webhookLog/getWithdrawn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ range: selectedRange }),
      });
      if (!res.ok) throw new Error("failed");
      const data = await res.json();
      setLogs(data?.result?.logs || []);
      setFetchedAt(new Date());
    } catch (err) {
      toast.error("출금 웹훅 로그 조회에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    const id = setInterval(fetchLogs, 10_000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRange]);

  const groupedByAccount = useMemo(() => {
    const map = new Map<string, GroupedAccount>();
    logs.forEach((log) => {
      const body = log.body || {};
      const accountNumber = body.bank_account_number || "계좌번호 없음";
      const amount = Number(body.amount) || 0;
      const bankInfo = log.bankInfo || {};
      const current: GroupedAccount = map.get(accountNumber) ?? {
        accountNumber,
        bankName: bankInfo.bankName || body.bank_name || "알 수 없음",
        accountHolder: bankInfo.accountHolder || body.account_holder || body.bank_account_holder,
        logs: [] as WebhookLog[],
        totalAmount: 0,
        latestCreatedAt: log.createdAt,
      };
      current.logs.push(log);
      current.totalAmount += amount;
      const currTime = current.latestCreatedAt ? new Date(current.latestCreatedAt).getTime() : 0;
      const logTime = log.createdAt ? new Date(log.createdAt).getTime() : 0;
      if (logTime > currTime) current.latestCreatedAt = log.createdAt;
      map.set(accountNumber, current);
    });
    return Array.from(map.values()).sort((a, b) =>
      (a.accountNumber || "").localeCompare(b.accountNumber || "", "ko-KR", { numeric: true })
    );
  }, [logs]);

  const totalAmount = useMemo(
    () => groupedByAccount.reduce((sum, acc) => sum + acc.totalAmount, 0),
    [groupedByAccount],
  );

  const uniqueAccounts = groupedByAccount.length;

  return (
    <main className="w-full px-3 sm:px-4 md:px-6 lg:px-10 pb-10">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 text-white rounded-2xl p-4 shadow-lg shadow-slate-900/40">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-500 flex items-center justify-center shadow-md shadow-emerald-500/30">
              <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M3 9l9-6 9 6v9a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3z" />
                <path d="M9 22V12h6v10" />
              </svg>
            </div>
            <div>
              <div className="text-xs uppercase tracking-[0.14em] text-slate-300">Bank Webhook</div>
              <div className="text-xl font-bold">은행 출금 웹훅 로그</div>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-white/10 rounded-lg px-2 py-1 border border-white/10">
            {rangeOptions.map((opt) => {
              const active = opt.key === selectedRange;
              return (
                <button
                  key={opt.key}
                  onClick={() => setSelectedRange(opt.key)}
                  className={`px-3 py-1.5 text-sm font-semibold rounded-md transition-all ${
                    active ? "bg-white text-slate-900 shadow" : "text-slate-200 hover:bg-white/10"
                  }`}
                  type="button"
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="bg-white/95 backdrop-blur rounded-2xl shadow-lg border border-slate-200 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm text-slate-500">표시</span>
            <span className="text-2xl font-black text-slate-900">{logs.length.toLocaleString("ko-KR")}건</span>
            <span className="text-xs text-slate-400">/ {selectedRangeLabel}</span>
            <span className="px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 text-xs font-semibold">
              계좌 {uniqueAccounts.toLocaleString("ko-KR")}개
            </span>
            <span className="flex items-baseline gap-1 text-2xl font-black text-blue-700 font-mono">
              <span className="text-xs text-slate-500 font-semibold">총액</span>
              {formatNumber(totalAmount)}
            </span>
          </div>
          <div className="text-[11px] text-slate-500">
            {fetchedAt ? `업데이트: ${formatDateTime(fetchedAt)}` : "업데이트 대기중..."}
          </div>
        </div>

        {groupedByAccount.length === 0 ? (
          <div className="w-full bg-white rounded-lg shadow-md border border-dashed border-slate-300 p-8 text-center text-slate-500">
            조회된 출금 웹훅 로그가 없습니다.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {groupedByAccount.map((group) => (
              <div
                key={group.accountNumber}
                className="relative flex flex-col bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-2 px-3 py-2 border-b border-slate-100 bg-slate-50 rounded-t-xl">
                  <div className="flex flex-col gap-1">
                    <div className="text-[11px] uppercase tracking-wide text-slate-500">계좌번호</div>
                    <div className="text-sm font-semibold text-slate-900 break-all">{group.accountNumber}</div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-600">
                      <span>{group.bankName}</span>
                      {group.accountHolder && (
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 border border-slate-200">
                          예금주 {group.accountHolder}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-slate-500">총 출금</div>
                    <div className="text-lg font-bold text-blue-700 font-mono">{formatNumber(group.totalAmount)}원</div>
                    <div className="text-[11px] text-slate-400">
                      {group.latestCreatedAt ? formatTimeAgo(group.latestCreatedAt) : ""}
                    </div>
                  </div>
                </div>

                <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
                  {group.logs.map((log, idx) => {
                    const body = log.body || {};
                    const amount = body.amount;
                    const balance = body.balance;
                    const transactionName = body.transaction_name || "-";
                    const transactionDate = body.transaction_date;
                    return (
                      <div key={`${log._id || idx}`} className="px-3 py-2 flex flex-col gap-1">
                        <div className="flex items-center justify-between">
                          <div className="text-[13px] font-semibold text-slate-900 truncate">{transactionName}</div>
                          <div className="text-sm font-bold text-rose-600 whitespace-nowrap">
                            {amount !== undefined ? `-${formatNumber(amount)}원` : "-"}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500">
                          {transactionDate ? (
                            <span className="px-2 py-0.5 rounded-full bg-slate-50 border border-slate-200">
                              {formatDateTime(transactionDate)}
                            </span>
                          ) : null}
                          <span className="px-2 py-0.5 rounded-full bg-slate-50 border border-slate-200">
                            {formatTimeAgo(log.createdAt || transactionDate)}
                          </span>
                          {balance !== undefined && (
                            <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-100">
                              잔액 {formatNumber(balance)}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
