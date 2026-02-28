'use client';

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";

import { toast } from "react-hot-toast";

import { client } from "../../../client";

import {
  ConnectButton,
  useActiveAccount,
} from "thirdweb/react";

import {
  inAppWallet,
  createWallet,
} from "thirdweb/wallets";

import {
  ethereum,
  polygon,
  arbitrum,
  bsc,
} from "thirdweb/chains";

import {
  chain,
} from "@/app/config/contractAddresses";

const wallets = [
  inAppWallet({
    auth: {
      options: ["email", "google"],
    },
  }),
];

const formatNumber = (value: any) => {
  if (value === null || value === undefined || value === "") {
    return "-";
  }
  const num = typeof value === "number" ? value : Number(value);
  if (Number.isNaN(num)) return String(value);
  return num.toLocaleString("ko-KR", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
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

const timeAgoToneClass = (value: any) => {
  if (!value) return "bg-zinc-100 text-zinc-500";
  const date = parseDateValue(value);
  if (!date) return "bg-zinc-100 text-zinc-500";

  const diffSec = Math.abs((Date.now() - date.getTime()) / 1000);

  if (diffSec < 60) return "bg-emerald-50 text-emerald-700";
  if (diffSec < 3600) return "bg-lime-100 text-lime-800";
  if (diffSec < 86_400) return "bg-amber-100 text-amber-800";
  if (diffSec < 604_800) return "bg-orange-200 text-orange-900";
  return "bg-red-200 text-red-900";
};

const KST_OFFSET = 9 * 60 * 60 * 1000;

function toKstDateString(offsetDays: number) {
  const now = new Date();
  const kst = new Date(now.getTime() + KST_OFFSET);
  kst.setUTCDate(kst.getUTCDate() - offsetDays);
  const y = kst.getUTCFullYear();
  const m = kst.getUTCMonth() + 1;
  const d = kst.getUTCDate();
  const weekday = ["일", "월", "화", "수", "목", "금", "토"][kst.getUTCDay()];
  return `${y}년 ${m.toString().padStart(2, "0")}월 ${d.toString().padStart(2, "0")}일 (${weekday}) KST`;
}

const useCountUp = (value: number, duration = 800) => {
  const [display, setDisplay] = useState<number>(value);
  useEffect(() => {
    const start = display;
    const end = value;
    const diff = end - start;
    if (diff === 0 || !Number.isFinite(diff)) return;
    const startTime = performance.now();

    const tick = (now: number) => {
      const progress = Math.min(1, (now - startTime) / duration);
      const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
      setDisplay(Math.round(start + diff * eased));
      if (progress < 1) requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  }, [value]);

  return display;
};

const csvEscape = (value: any) => {
  if (value === null || value === undefined) return "\"\"";
  const str = String(value).replace(/"/g, '""');
  return `"${str}"`;
};

interface WebhookLog {
  _id?: string;
  event?: string;
  headers?: {
    [key: string]: any;
  };
  body?: any;
  createdAt?: string;
}

interface GroupedAccount {
  accountNumber: string;
  bankCode?: string;
  logs: WebhookLog[];
  totalAmount: number;
  latestCreatedAt?: string;
  defaultAccountNumber?: string;
  accountHolder?: string;
  bankName: string;
  prevBalance?: number;
}

interface PendingOrder {
  _id?: string;
  status?: string;
  krwAmount?: number;
  usdtAmount?: number;
  rate?: number;
  buyer?: string;
  nickname?: string;
  depositName?: string;
  buyerBankAccountNumber?: string;
  createdAt?: string;
  storeName?: string;
  storeLogo?: string;
  tradeId?: string;
  buyerBankInfo?: {
    bankName?: string;
    accountNumber?: string;
    accountHolder?: string;
  };
  sellerBankInfo?: {
    bankName?: string;
    accountNumber?: string;
    accountHolder?: string;
  };
}

type DepositToast = {
  id: string;
  title: string;
  subtitle?: string;
  amount?: number;
  time?: string | Date;
  depositor?: string;
  depositCount?: number;
  depositSum?: number;
};

type AccountCardProps = {
  group: GroupedAccount;
  flashIds: Record<string, boolean>;
  toLogId: (log: WebhookLog, idx: number) => string;
  onExport: (group: GroupedAccount) => void;
};

const toPendingId = (order: PendingOrder) =>
  (order as any)?._id?.toString?.() ||
  order.tradeId ||
  (order.createdAt ? `${order.createdAt}-${order.krwAmount ?? ""}-${order.buyerBankAccountNumber ?? ""}` : `${Math.random()}`);

const AccountCard: React.FC<AccountCardProps> = ({ group, flashIds, toLogId, onExport }) => {
  const listRef = useRef<HTMLDivElement | null>(null);
  const [showInnerTop, setShowInnerTop] = useState(false);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;

    const onScroll = () => {
      setShowInnerTop(el.scrollTop > 60);
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  const scrollInnerTop = () => {
    if (listRef.current) {
      listRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const totalAmountAnimated = useCountUp(group.totalAmount, 800);
  const latestBalance = useMemo(() => {
    if (!group.logs.length) return undefined;
    const latest = group.logs.reduce((prev, curr) => {
      const prevTime = prev?.createdAt ? new Date(prev.createdAt).getTime() : 0;
      const currTime = curr?.createdAt ? new Date(curr.createdAt).getTime() : 0;
      return currTime > prevTime ? curr : prev;
    }, group.logs[0]);
    return latest?.body?.balance;
  }, [group.logs]);

  const hasNewLog = useMemo(
    () => group.logs.some((log, idx) => flashIds[toLogId(log, idx)]),
    [group.logs, flashIds, toLogId],
  );

  return (
    <div
      className={`relative flex flex-col bg-white rounded-xl border shadow-sm hover:shadow-md transition-shadow ${
        hasNewLog ? "border-amber-400 animate-border-flash" : "border-zinc-200"
      }`}
    >
      <div className="flex items-start justify-between gap-2 px-3 py-1.5 border-b border-zinc-100 bg-[#eef5ff] rounded-t-xl">
        
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="text-[11px] uppercase tracking-wide text-zinc-500">계좌번호</span>
            <button
              type="button"
              onClick={() => onExport(group)}
              className="inline-flex items-center gap-1 rounded-md border border-zinc-300 bg-white px-2 py-1 text-[10px] font-semibold text-zinc-700 hover:bg-zinc-50"
            >
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 3v12" strokeLinecap="round" />
                <path d="M8 11l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M4 17h16" strokeLinecap="round" />
              </svg>
              엑셀
            </button>
          </div>
          <div className="text-sm font-semibold text-zinc-900 break-all">{group.defaultAccountNumber}</div>
 
          <div className="flex text-sm font-semibold text-zinc-900 gap-1 items-center">
            {group.accountHolder} · {group.bankName}
          </div>

        </div>
          <div className="flex flex-col items-end gap-1">
          <div className="text-[11px] text-zinc-500">입금 총금액</div>
          <div className="text-sm font-semibold text-blue-700">{formatNumber(totalAmountAnimated)}</div>
          <div className="flex flex-col items-end gap-1 mt-1">
            {group.prevBalance !== undefined && (
              <span className="px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-700 border border-zinc-200 text-[11px] font-semibold inline-flex items-center gap-1">
                전일 잔고 {formatNumber(group.prevBalance)}
              </span>
            )}
            {latestBalance !== undefined && latestBalance !== null && (
              <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[11px] font-semibold inline-flex items-center gap-1">
                당일 잔고 {formatNumber(latestBalance)}
              </span>
            )}
          </div>
        </div>

      </div>


      <div
        ref={listRef}
        className="divide-y divide-zinc-100 max-h-[110px] overflow-y-auto"
      >
        {group.logs.map((log, idx) => {
          const body = log.body || {};
          const headers = log.headers || {};
          const transactionDate = body.transaction_date;
          const transactionName = body.transaction_name;
          const amount = body.amount;
          const traceId = headers["x-trace-id"] || headers["x-trace-id".toUpperCase()];
          const mallId = headers["x-mall-id"] || headers["x-mall-id".toUpperCase()];
          const balance = body.balance;
          const displayOrder = group.logs.length - idx;

          const rowKey = toLogId(log, idx);
          const isFlash = !!flashIds[rowKey];

          return (
            <div
              key={rowKey}
              className={`px-3 py-1.5 flex items-start justify-between gap-2 hover:bg-zinc-50 ${isFlash ? "flash-new" : ""}`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-100 text-[11px]">
                    {displayOrder}
                  </span>

                  <div className="flex flex-nowrap items-center gap-1 mt-1 text-[10px] text-zinc-500">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap ${timeAgoToneClass(transactionDate)}`}>
                      {formatTimeAgo(transactionDate)}
                    </span>
                    {traceId && <span className="px-2 py-0.5 rounded-full bg-zinc-100 border border-zinc-200 whitespace-nowrap">trace {traceId}</span>}
                    {mallId && <span className="px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-100 whitespace-nowrap">mall {mallId}</span>}
                    {/*balance !== undefined && <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-100 whitespace-nowrap">잔액 {formatNumber(balance)}</span>*/}
                  </div>

                  <div className="text-sm font-semibold text-zinc-900 truncate">{transactionName || "-"}</div>
                
                </div>
                


              </div>
              <div className="text-right">
                <div className="text-sm font-semibold text-blue-600 whitespace-nowrap">{formatNumber(amount)}</div>
              </div>
            </div>
          );
        })}
      </div>

      {showInnerTop && (
        <button
          type="button"
          onClick={scrollInnerTop}
          className="absolute bottom-2 right-2 z-20 rounded-full bg-[#3167b4] text-white px-3 py-1 text-[11px] font-semibold shadow-md shadow-blue-500/30 hover:bg-[#275290] transition-transform duration-150 hover:-translate-y-0.5"
        >
          Top
        </button>
      )}
    </div>
  );
};

export default function BankDepositedPage() {
  const activeAccount = useActiveAccount();
  const address = activeAccount?.address;

  const [logs, setLogs] = useState<WebhookLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchedAt, setFetchedAt] = useState<Date | null>(null);
  const [flashIds, setFlashIds] = useState<Record<string, boolean>>({});
  const prevIdsRef = useRef<Set<string>>(new Set());
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [selectedRange, setSelectedRange] = useState<"today" | "yesterday" | "dayBeforeYesterday">("today");
  const [pendingOrders, setPendingOrders] = useState<PendingOrder[]>([]);
  const [pendingFetchedAt, setPendingFetchedAt] = useState<Date | null>(null);
  const [pendingFlashIds, setPendingFlashIds] = useState<Record<string, boolean>>({});
  const [pendingFadeIds, setPendingFadeIds] = useState<Record<string, boolean>>({});
  const [paymentConfirmedSum, setPaymentConfirmedSum] = useState<number | null>(null);
  const [paymentConfirmedCount, setPaymentConfirmedCount] = useState<number | null>(null);
  const prevPendingIdsRef = useRef<Set<string>>(new Set());
  const [prevBalances, setPrevBalances] = useState<Record<string, number | undefined>>({});
  const [depositToasts, setDepositToasts] = useState<DepositToast[]>([]);
  const pendingOrdersRef = useRef<PendingOrder[]>([]);
  const paymentConfirmedSumAnimated = useCountUp(paymentConfirmedSum ?? 0, 900);
  const paymentConfirmedCountAnimated = useCountUp(paymentConfirmedCount ?? 0, 900);

  const refreshInterval = 10_000; // 10 seconds

  const toLogId = (log: WebhookLog, idx = 0) =>
    (log as any)?._id?.toString?.() ||
    (log.createdAt ? `${log.createdAt}-${idx}` : `${idx}-${Math.random()}`);

  const markNewEntries = (nextLogs: WebhookLog[]) => {
    const prevIds = prevIdsRef.current;
    const newIds: string[] = [];

    nextLogs.forEach((log, idx) => {
      const id = toLogId(log, idx);
      if (!prevIds.has(id)) newIds.push(id);
    });

      if (newIds.length) {
        setFlashIds((prev) => {
          const updated = { ...prev };
          newIds.forEach((id) => {
            updated[id] = true;
          setTimeout(() => {
            setFlashIds((current) => {
              if (!current[id]) return current;
              const copy = { ...current };
              delete copy[id];
              return copy;
            });
          }, 8000); // keep highlight visible longer
        });
        return updated;
      });

      // 토스트 생성
      const toastPayloads: DepositToast[] = [];
      // depositor 별 카운트/총액 준비
      const depositorCounts: Record<string, number> = {};
      const depositorSums: Record<string, number> = {};
      nextLogs.forEach((log) => {
        const name = log.body?.transaction_name || "";
        const amt = Number(log.body?.amount) || 0;
        if (!name) return;
        depositorCounts[name] = (depositorCounts[name] || 0) + 1;
        depositorSums[name] = (depositorSums[name] || 0) + amt;
      });

      newIds.forEach((id) => {
        const log = nextLogs.find((l, i) => toLogId(l, i) === id);
        const body = log?.body || {};
        const bankInfo = (log as any)?.bankInfo || {};
        const amount = body.amount;
        const title = body.transaction_name || "입금";
        const account = bankInfo.defaultAccountNumber || body.bank_account_number || "계좌번호 없음";
        const bankName = bankInfo.bankName || body.bank_name || body.bank_code || "";
        const holder = bankInfo.accountHolder || body.account_holder || body.bank_account_holder || "";
        const depositor = body.transaction_name || "";
        const depositCount = depositor ? depositorCounts[depositor] || 1 : undefined;
        const depositSum = depositor ? depositorSums[depositor] || undefined : undefined;
        toastPayloads.push({
          id: `toast-${id}`,
          title,
          subtitle: [bankName, holder, account].filter(Boolean).join(" · "),
          amount,
          time: body.transaction_date || log?.createdAt,
          depositor,
          depositCount,
          depositSum,
        });
      });

      if (toastPayloads.length) {
        setDepositToasts((prev) => {
          const next = [...toastPayloads, ...prev];
          // 오래된 토스트 자동 제거 (최대 6개 유지)
          return next.slice(0, 6);
        });

        // 각 토스트별 자동 제거
        toastPayloads.forEach((t) => {
          setTimeout(() => {
            setDepositToasts((prev) => prev.filter((x) => x.id !== t.id));
          }, 8500);
        });
      }
    }

    prevIdsRef.current = new Set(nextLogs.map((log, idx) => toLogId(log, idx)));
  };

  const fetchLogs = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const response = await fetch("/api/webhookLog/getDeposited", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ range: selectedRange }),
      });

      if (!response.ok) {
        toast.error("웹훅 로그 조회에 실패했습니다.");
        return;
      }

      const data = await response.json();
      const nextLogs: WebhookLog[] = data?.result?.logs || [];
      const nextPrevBalances: Record<string, number | undefined> = data?.prevBalances || {};
      markNewEntries(nextLogs);
      setLogs(nextLogs);
      setPrevBalances(nextPrevBalances);
      setFetchedAt(new Date());
    } catch (error) {
      toast.error("웹훅 로그 조회에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!address) {
      setLogs([]);
      return;
    }

    // 범위가 바뀌면 기존 하이라이트/ID 추적을 리셋
    prevIdsRef.current = new Set();

    fetchLogs();

    const id = setInterval(() => {
      fetchLogs();
    }, refreshInterval);

    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address, selectedRange]);

  useEffect(() => {
    if (!address) {
      setPendingOrders([]);
      return;
    }
    fetchPendingOrders();
    const id = setInterval(() => {
      fetchPendingOrders();
    }, refreshInterval);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address, selectedRange]);

useEffect(() => {
  const onScroll = () => {
    setShowScrollTop(window.scrollY > 240);
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
  return () => window.removeEventListener("scroll", onScroll);
}, []);

const rangeOptions: { key: "today" | "yesterday" | "dayBeforeYesterday"; label: string }[] = [
  { key: "today", label: "오늘" },
  { key: "yesterday", label: "어제" },
  { key: "dayBeforeYesterday", label: "그제" },
];

  const selectedRangeLabel = rangeOptions.find((r) => r.key === selectedRange)?.label || "오늘";
  const selectedRangeOffset = selectedRange === "today" ? 0 : selectedRange === "yesterday" ? 1 : 2;
  const selectedDateString = useMemo(() => toKstDateString(selectedRangeOffset), [selectedRangeOffset]);
  const [countdown, setCountdown] = useState<string>("--:--:--");

useEffect(() => {
  const updateCountdown = () => {
    const now = new Date();
    const kstNow = new Date(now.getTime() + KST_OFFSET);
    const midnight = new Date(kstNow);
    midnight.setUTCHours(0, 0, 0, 0);
    midnight.setUTCDate(midnight.getUTCDate() + 1 - selectedRangeOffset);
    const diff = midnight.getTime() - kstNow.getTime();
    if (diff <= 0) {
      setCountdown("00:00:00");
      return;
    }
    const h = Math.floor(diff / (1000 * 60 * 60));
    const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const s = Math.floor((diff % (1000 * 60)) / 1000);
    const pad = (n: number) => n.toString().padStart(2, "0");
    setCountdown(`${pad(h)}:${pad(m)}:${pad(s)}`);
  };

  updateCountdown();
  const id = setInterval(updateCountdown, 1000);
  return () => clearInterval(id);
}, [selectedRangeOffset]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const exportAccountLogs = (group: GroupedAccount) => {
    if (typeof window === "undefined") return;

    // 최신 잔고: createdAt 기준 가장 최근 balance
    type Latest = { balance?: number; time: number };
    const latestBalance: number | undefined = group.logs.reduce<Latest | null>((acc, log) => {
      const bal = log.body?.balance;
      const t = log.createdAt ? new Date(log.createdAt).getTime() : -Infinity;
      if (bal === undefined) return acc;
      if (!acc || t > acc.time) return { balance: bal, time: t };
      return acc;
    }, null)?.balance;

    const headers = ["거래명", "금액", "거래시간", "잔액", "계좌번호"];
    const rows = group.logs.map((log) => {
      const body = log.body || {};
      const transactionDate = body.transaction_date;
      const transactionName = body.transaction_name;
      const amount = body.amount;
      const balance = body.balance;
      const accountNumber = body.bank_account_number || group.accountNumber;

      return [
        csvEscape(transactionName || "-"),
        csvEscape(amount ?? ""),
        csvEscape(transactionDate ? formatDateTime(transactionDate) : ""),
        csvEscape(balance ?? ""),
        csvEscape(accountNumber || ""),
      ].join(",");
    });

    // 헤더 컬럼 수(5)에 맞춰 첫 줄도 5칸으로 작성
    const firstLine = [
      csvEscape("전일 잔고"),
      csvEscape(group.prevBalance ?? ""),
      csvEscape("당일 잔고"),
      csvEscape(latestBalance ?? ""),
      csvEscape(""),
    ].join(",");

    const csv = [firstLine, headers.map(csvEscape).join(","), ...rows].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `deposits_${group.accountNumber}_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const fetchPendingOrders = async () => {
    try {
      const res = await fetch(`/api/order/getPendingMini?range=${selectedRange}`);
      if (!res.ok) throw new Error("failed");
      const data = await res.json();
      const next: PendingOrder[] = (data?.orders as PendingOrder[]) || [];
      const sumConfirmed = Number(data?.paymentConfirmedSum ?? 0) || 0;
      const countConfirmed = Number(data?.paymentConfirmedCount ?? 0) || 0;
      setPaymentConfirmedSum(sumConfirmed);
      setPaymentConfirmedCount(countConfirmed);

      const prevOrders = pendingOrdersRef.current;
      const prevIds = prevPendingIdsRef.current;
      const newIds: string[] = [];
      const removedIds: string[] = [];

      next.forEach((order: PendingOrder) => {
        const id = toPendingId(order);
        if (!prevIds.has(id)) newIds.push(id);
      });

      prevOrders.forEach((order) => {
        const id = toPendingId(order);
        const stillExists = next.some((o) => toPendingId(o) === id);
        if (!stillExists) removedIds.push(id);
      });

      if (newIds.length) {
        setPendingFlashIds((prev) => {
          const updated = { ...prev };
          newIds.forEach((id) => {
            updated[id] = true;
            setTimeout(() => {
              setPendingFlashIds((current) => {
                if (!current[id]) return current;
                const copy = { ...current };
                delete copy[id];
                return copy;
              });
            }, 2500);
          });
          return updated;
        });
      }

      if (removedIds.length) {
        setPendingFadeIds((prev) => {
          const updated = { ...prev };
          removedIds.forEach((id) => {
            updated[id] = true;
          });
          return updated;
        });

        removedIds.forEach((id) => {
          setTimeout(() => {
            setPendingOrders((prev) => {
              const filtered = prev.filter((order) => toPendingId(order) !== id);
              pendingOrdersRef.current = filtered;
              return filtered;
            });
          }, 1300); // matches fade duration

          setTimeout(() => {
            setPendingFadeIds((prev) => {
              if (!prev[id]) return prev;
              const copy = { ...prev };
              delete copy[id];
              return copy;
            });
          }, 1400);
        });
      }

      // keep fading cards in the list until animation ends
      const removedOrders = prevOrders.filter((o) => removedIds.includes(toPendingId(o)));
      const merged = removedOrders.length ? [...next, ...removedOrders] : next;

      prevPendingIdsRef.current = new Set(merged.map((order) => toPendingId(order)));
      pendingOrdersRef.current = merged;
      setPendingOrders(merged);
      setPendingFetchedAt(new Date());
    } catch (err) {
      // quiet fail; could add toast if needed
      setPaymentConfirmedSum(null);
      setPaymentConfirmedCount(null);
    }
  };

  const chainObj = useMemo(() => (
    chain === "ethereum"
      ? ethereum
      : chain === "polygon"
        ? polygon
        : chain === "arbitrum"
          ? arbitrum
          : chain === "bsc"
            ? bsc
            : arbitrum
  ), []);

  const groupedByAccount = useMemo(() => {
    const map = new Map<string, GroupedAccount>();

    logs.forEach((log) => {
      const body = log.body || {};
      const accountNumber = body.bank_account_number || "계좌번호 없음";
      const bankCode = body.bank_code;
      const amount = Number(body.amount) || 0;
      const bankInfo = (log as any).bankInfo || {};

      const current: GroupedAccount = map.get(accountNumber) ?? {
        accountNumber,
        bankCode,
        logs: [],
        totalAmount: 0,
        latestCreatedAt: log.createdAt,
        defaultAccountNumber: bankInfo.defaultAccountNumber,
        accountHolder: bankInfo.accountHolder,
        bankName: bankInfo.bankName || "알 수 없음",
        prevBalance: prevBalances[accountNumber],
      };

      current.logs.push(log);
      current.totalAmount += amount;
      current.bankCode = current.bankCode || bankCode;
      current.defaultAccountNumber = current.defaultAccountNumber || bankInfo.defaultAccountNumber;
      current.accountHolder = current.accountHolder || bankInfo.accountHolder;
      current.bankName = current.bankName || bankInfo.bankName || "알 수 없음";
      current.prevBalance = current.prevBalance ?? prevBalances[accountNumber];

      const currentTime = current.latestCreatedAt ? new Date(current.latestCreatedAt).getTime() : 0;
      const logTime = log.createdAt ? new Date(log.createdAt).getTime() : 0;
      if (logTime > currentTime) {
        current.latestCreatedAt = log.createdAt;
      }

      map.set(accountNumber, current);
    });

    return Array.from(map.values()).sort((a, b) =>
      (a.accountNumber || "").localeCompare(b.accountNumber || "", "ko-KR", { numeric: true }),
    );

  }, [logs, prevBalances]);

  const totalAmount = useMemo(
    () => groupedByAccount.reduce((sum, acc) => sum + acc.totalAmount, 0),
    [groupedByAccount],
  );
  const totalAmountAnimated = useCountUp(totalAmount);

  if (!address) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <h1 className="text-2xl font-bold">로그인</h1>

        <ConnectButton
          client={client}
          wallets={wallets}
          showAllWallets={false}
          chain={chainObj}
          theme={"light"}
          connectButton={{
            style: {
              backgroundColor: "#3167b4",
              color: "#f3f4f6",
              padding: "2px 2px",
              borderRadius: "10px",
              fontSize: "14px",
              height: "38px",
            },
            label: "원클릭 로그인",
          }}
          connectModal={{
            size: "wide",
            titleIcon: "https://www.stable.makeup/logo.png",
            showThirdwebBranding: false,
          }}
          locale={"ko_KR"}
        />
      </div>
    );
  }

  return (
    <>
      <main className="p-4 pb-10 min-h-[100vh] flex items-start justify-center container max-w-screen-2xl mx-auto">
        <div className="py-0 w-full space-y-4">

        {/* 입금 토스트 스택 */}
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-3 w-[320px] sm:w-[360px] pointer-events-none">
          {depositToasts.map((toast) => (
            <div
              key={toast.id}
              className="pointer-events-auto overflow-hidden rounded-2xl border border-amber-300 bg-white shadow-[0_16px_40px_-18px_rgba(0,0,0,0.35)] animate-slide-in"
            >
              <div className="px-4 py-3 bg-gradient-to-r from-amber-50 via-white to-amber-50">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-[13px] font-bold text-amber-800 truncate">{toast.title}</div>
                    {toast.subtitle && (
                      <div className="text-[11px] text-zinc-500 truncate">{toast.subtitle}</div>
                    )}
                    {toast.depositor && (
                      <div className="text-[11px] text-blue-800 font-semibold flex gap-1 items-center">
                        <span>{toast.depositor}</span>
                        {toast.depositCount !== undefined && (
                          <span className="px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-800 border border-blue-100">
                            {toast.depositCount}번째
                          </span>
                        )}
                        {toast.depositSum !== undefined && (
                          <span className="px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-100">
                            누적 {formatNumber(toast.depositSum)}원
                          </span>
                        )}
                      </div>
                    )}
                    {toast.time && (
                      <div className="mt-1 text-[10px] text-zinc-400">{formatTimeAgo(toast.time)}</div>
                    )}
                  </div>
                  {toast.amount !== undefined && (
                    <div className="text-base font-extrabold text-[#0f172a] whitespace-nowrap bg-gradient-to-r from-blue-50 via-white to-blue-50 px-3 py-1.5 rounded-xl border border-blue-100 shadow-[0_4px_12px_-8px_rgba(15,23,42,0.25)]">
                      {formatNumber(toast.amount)}원
                    </div>
                  )}
                </div>
              </div>
              <div className="h-1 bg-amber-300 animate-toast-bar" />
            </div>
          ))}
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 text-white shadow-[0_14px_38px_-18px_rgba(0,0,0,0.6)] px-4 py-5">
          <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_20%_20%,rgba(59,130,246,0.12),transparent_28%),radial-gradient(circle_at_75%_15%,rgba(16,185,129,0.12),transparent_26%),radial-gradient(circle_at_60%_90%,rgba(236,72,153,0.08),transparent_28%)]" />
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between relative">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg shadow-emerald-500/25 flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M3 10h18" strokeLinecap="round" />
                    <path d="M4 10l8-6 8 6" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M5 10v8" />
                    <path d="M19 10v8" />
                    <path d="M9 10v8" />
                    <path d="M15 10v8" />
                    <path d="M3 18h18" strokeLinecap="round" />
                  </svg>
                </div>
                <div>
                  <div className="text-sm uppercase tracking-[0.15em] text-slate-300">Bank Webhook</div>
                  <div className="text-lg font-bold leading-tight">은행 입금 웹훅 로그</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-200 border border-emerald-400/40 text-[11px] font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
                  최신순
                </span>
                <span className="px-2.5 py-1 rounded-full bg-blue-500/15 text-blue-200 border border-blue-400/40 text-[11px] font-semibold">
                  10초 자동 새로고침
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-2">
              <div className="flex items-center gap-2 bg-white/5 backdrop-blur px-3 py-2 rounded-xl border border-white/10 shadow-inner">
                <div className="text-xs text-slate-200">선택 날짜</div>
                <div className="text-sm sm:text-base font-semibold text-white">{selectedDateString}</div>
              </div>
              <div className="flex items-center gap-2 bg-slate-950/60 px-3 py-2 rounded-xl border border-slate-800 shadow-inner">
                <div className="text-[11px] text-slate-300">자정까지</div>
                <div className="text-lg font-mono tracking-[0.25em] text-amber-100 drop-shadow-sm">
                  {countdown}
                </div>
              </div>
              <div className="flex items-center gap-1 bg-white/5 backdrop-blur rounded-xl px-2 py-1 border border-white/10 shadow-inner">
                {rangeOptions.map((opt) => {
                  const isActive = opt.key === selectedRange;
                  return (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => setSelectedRange(opt.key)}
                      className={`px-3 py-1.5 text-sm font-semibold rounded-lg transition-all ${
                        isActive
                          ? "bg-white text-slate-900 shadow-lg shadow-blue-500/20"
                          : "text-slate-200 hover:bg-white/10"
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white/95 backdrop-blur rounded-2xl shadow-lg border border-slate-200 px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-baseline gap-2">
                <span className="text-xs text-slate-500">표시</span>
                <span className="text-2xl font-bold text-slate-900 leading-none">
                  {logs.length.toLocaleString("ko-KR")}건
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="h-5 w-px bg-slate-200" aria-hidden />
                <span className="px-2 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">
                  {selectedRangeLabel}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="h-5 w-px bg-slate-200" aria-hidden />
                <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 text-xs font-semibold flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 9l8-6 8 6v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" />
                    <path d="M9 22V12h6v10" />
                  </svg>
                  계좌 {groupedByAccount.length.toLocaleString("ko-KR")}개
                </span>
              </div>

              <div className="flex items-center gap-2 pl-1">
                <span className="h-5 w-px bg-slate-200" aria-hidden />
              <div className="flex items-baseline gap-2">
                <span className="text-xs text-slate-500 font-semibold">총액</span>
                <span className="text-2xl font-black text-blue-700 tracking-tight drop-shadow-sm font-mono">
                  {formatNumber(totalAmountAnimated)}
                </span>
              </div>
            </div>
            </div>
            <div className="text-[11px] text-slate-500">
              {fetchedAt ? `업데이트: ${formatDateTime(fetchedAt)}` : "업데이트 대기중..."}
            </div>
          </div>
        </div>

{groupedByAccount.length === 0 ? (
          <div className="w-full bg-white rounded-lg shadow-md border border-dashed border-zinc-300 p-8 text-center text-gray-500">
            조회된 웹훅 로그가 없습니다.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-5 gap-3">
            {groupedByAccount.map((group) => {
              return (
                <AccountCard
                  key={group.accountNumber}
                  group={group}
                  flashIds={flashIds}
                  toLogId={toLogId}
                  onExport={exportAccountLogs}
                />
              );
            })}
          </div>
        )}

        <div className="rounded-2xl border border-slate-200 shadow-lg shadow-slate-200/60 bg-gradient-to-r from-white via-slate-50 to-white px-4 py-3 space-y-3 mt-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-md shadow-slate-500/30">
                <svg className="w-4.5 h-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 6h16" strokeLinecap="round" />
                  <path d="M4 10h16" strokeLinecap="round" />
                  <path d="M10 14h10" strokeLinecap="round" />
                  <path d="M10 18h6" strokeLinecap="round" />
                </svg>
              </div>
              <div className="flex flex-col">
                <div className="text-xs uppercase tracking-[0.12em] text-slate-500">Pending Orders</div>
                <div className="text-base font-semibold text-slate-900">진행중 구매주문</div>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-white/90 backdrop-blur rounded-xl border border-slate-200 px-3 py-2 shadow-inner">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-blue-500 text-white flex items-center justify-center shadow">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 3v18" strokeLinecap="round" />
                  <path d="M6 9h12" strokeLinecap="round" />
                  <path d="M9 6h6" strokeLinecap="round" />
                  <path d="M9 12h6" strokeLinecap="round" />
                </svg>
              </div>
              <div className="leading-tight">
                <div className="text-[11px] text-slate-500">전체 결제금액 (결제확정)</div>
                <div className="text-lg font-bold text-slate-900 tracking-tight font-mono">
                  {paymentConfirmedSum === null ? "—" : `${formatNumber(paymentConfirmedSumAnimated)}원`}
                </div>
              </div>
              <div className="flex flex-col text-[11px] text-slate-500 leading-tight">
                <span>건수</span>
                <span className="text-sm font-semibold text-slate-900">
                  {paymentConfirmedCount === null ? "—" : `${formatNumber(paymentConfirmedCountAnimated)}건`}
                </span>
              </div>
              <span className="text-[11px] text-slate-400 whitespace-nowrap">{selectedRangeLabel} 기준</span>
            </div>

            <div className="text-[11px] text-slate-500">
              {pendingFetchedAt ? `업데이트: ${formatDateTime(pendingFetchedAt)}` : "업데이트 대기중..."}
            </div>
          </div>
          <div className="flex flex-row gap-2 overflow-x-auto py-1 scrollbar-thin justify-start sm:justify-end w-full min-h-[120px]">
            {(pendingOrders.length === 0 ? Array.from({ length: 1 }) : pendingOrders).map((raw, idx) => {
              const order = raw as PendingOrder | undefined;
              const buyerInfo = order?.buyerBankInfo || {};
              const sellerInfo = order?.sellerBankInfo || {};
              const storeLogo = order?.storeLogo;
              const cardId = order ? toPendingId(order) : `empty-${idx}`;
              return (
                <div
                  key={cardId}
                  className={`min-w-[88vw] max-w-[88vw] sm:min-w-[220px] sm:max-w-[240px] rounded-xl border border-zinc-200 bg-white px-3 py-2 shadow-sm flex flex-col gap-1 ${
                    pendingFlashIds[cardId] ? "pending-flash" : ""
                  } ${pendingFadeIds[cardId] ? "pending-fade" : ""}`}
                >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-zinc-100 overflow-hidden flex items-center justify-center">
                          {storeLogo ? (
                            <Image src={storeLogo} alt="store" width={32} height={32} className="object-cover w-full h-full" />
                          ) : (
                            <span className="text-[10px] text-zinc-500">{pendingOrders.length === 0 ? "No data" : "Store"}</span>
                          )}
                        </div>
                        <div className="text-xs font-semibold text-zinc-900 truncate">
                          {order?.storeName || (pendingOrders.length === 0 ? "진행중 주문 없음" : "가맹점 미지정")}
                        </div>
                      </div>
                      <div className="text-sm font-bold text-blue-700 whitespace-nowrap">
                        {order?.krwAmount ? `${formatNumber(order.krwAmount)}원` : (pendingOrders.length === 0 ? "-" : "-")}
                      </div>
                    </div>
                    {order?.tradeId && (
                      <div className="text-[10px]">
                        <span className="px-2 py-0.5 rounded-md bg-sky-100 text-sky-800 border border-sky-200 font-mono">
                          주문번호 {order.tradeId}
                        </span>
                      </div>
                    )}
                  <div className="flex flex-wrap items-center gap-1">
                    {order?.depositName ? (
                      <span className="px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 border border-amber-300 whitespace-nowrap text-[11px] font-bold">
                        구매자 입금명 {order.depositName}
                      </span>
                    ) : pendingOrders.length === 0 ? (
                      <span className="px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-500 border border-zinc-200 whitespace-nowrap text-[11px]">
                        구매자 입금명 없음
                      </span>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap items-center gap-1 text-[12px] text-zinc-800">
                    {order?.sellerBankInfo?.accountHolder ? (
                      <span className="px-3 py-0.5 rounded-full bg-blue-50 text-blue-900 border border-blue-100 whitespace-nowrap font-semibold">
                        판매자 {sellerInfo.accountHolder} {sellerInfo.accountNumber ? `(${sellerInfo.accountNumber})` : ""}
                      </span>
                    ) : pendingOrders.length === 0 ? (
                      <span className="px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-500 border border-zinc-200 whitespace-nowrap">
                        판매자 정보 없음
                      </span>
                    ) : null}
                  </div>
      <div className="text-[10px] text-zinc-500 whitespace-nowrap text-right">
        {order?.createdAt ? formatTimeAgo(order.createdAt) : (pendingOrders.length === 0 ? "—" : "")}
      </div>
    </div>
  );
})}
</div>
</div>

        </div>
      </main>
      {showScrollTop && (
        <button
          type="button"
          aria-label="맨 위로 이동"
          onClick={scrollToTop}
          className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full bg-[#3167b4] text-white px-4 py-2 shadow-lg shadow-blue-500/30 hover:bg-[#275290] transition-transform duration-200 hover:-translate-y-0.5"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 19V5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M5 12l7-7 7 7" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="text-xs font-semibold">Top</span>
        </button>
      )}
      <style jsx global>{`
        @keyframes flashPop {
          0% { transform: scale(0.92); background: #ffe08a; box-shadow: 0 0 0 0 rgba(251, 191, 36, 0.95); }
          45% { transform: scale(1.08); background: #ffd75a; box-shadow: 0 22px 60px -12px rgba(251, 191, 36, 0.95); }
          100% { transform: scale(1); background: #fff9e1; box-shadow: 0 0 0 0 rgba(251, 191, 36, 0); }
        }
        @keyframes flashGlow {
          0% { outline: 4px solid rgba(251, 191, 36, 0.95); }
          100% { outline: 0 solid rgba(251, 191, 36, 0); }
        }
        @keyframes flashPulse {
          0% { box-shadow: 0 0 0 0 rgba(251, 191, 36, 0.55); }
          50% { box-shadow: 0 0 0 18px rgba(251, 191, 36, 0.0); }
          100% { box-shadow: 0 0 0 0 rgba(251, 191, 36, 0); }
        }
        @keyframes borderFlash {
          0% { box-shadow: 0 0 0 0 rgba(251, 191, 36, 0.55); }
          40% { box-shadow: 0 0 0 8px rgba(251, 191, 36, 0); }
          70% { box-shadow: 0 0 0 0 rgba(251, 191, 36, 0.35); }
          100% { box-shadow: 0 0 0 0 rgba(251, 191, 36, 0); }
        }
        .animate-border-flash {
          animation: borderFlash 2.4s ease-out;
        }
        @keyframes pendingFlash {
          0% { transform: translateY(-6px) scale(0.97); box-shadow: 0 12px 30px -18px rgba(0,0,0,0.28); }
          40% { transform: translateY(0) scale(1.03); box-shadow: 0 16px 32px -14px rgba(49,103,180,0.35); }
          100% { transform: translateY(0) scale(1); box-shadow: 0 8px 20px -14px rgba(0,0,0,0.16); }
        }
        .pending-flash {
          animation: pendingFlash 0.9s ease-out;
        }
        @keyframes pendingFade {
          0% { opacity: 1; transform: translateY(0) scale(1); }
          35% { opacity: 0.9; transform: translateY(4px) scale(0.995); }
          70% { opacity: 0.55; transform: translateY(10px) scale(0.97); }
          85% { opacity: 0.35; transform: translateY(14px) scale(0.94); filter: blur(0); }
          100% { opacity: 0; transform: translateY(16px) scale(0.9); filter: blur(2px); }
        }
        .pending-fade {
          animation: pendingFade 1.85s ease-in forwards, pendingBoom 0.55s ease-out 1.35s forwards;
          transform-origin: center;
        }
        @keyframes pendingBoom {
          0% { box-shadow: 0 0 0 0 rgba(239,68,68,0.15); transform: scale(0.95) rotate(-1deg); }
          30% { box-shadow: 0 0 0 12px rgba(239,68,68,0.12); transform: scale(1.03) rotate(1deg); }
          60% { box-shadow: 0 0 0 22px rgba(239,68,68,0.05); transform: scale(0.98) rotate(-2deg); }
          100% { box-shadow: 0 0 0 30px rgba(239,68,68,0); transform: scale(0.9) rotate(0deg); }
        }
        @keyframes pulseSlow {
          0% { opacity: 0.9; }
          50% { opacity: 1; }
          100% { opacity: 0.9; }
        }
        .animate-pulse-slow {
          animation: pulseSlow 1.4s ease-in-out infinite;
        }
        @keyframes slideIn {
          0% { transform: translateX(0) translateY(-14px) scale(0.98); opacity: 0; }
          45% { transform: translateX(0) translateY(0) scale(1.01); opacity: 1; }
          100% { transform: translateX(0) translateY(0) scale(1); opacity: 1; }
        }
        .animate-slide-in {
          animation: slideIn 0.6s cubic-bezier(0.18, 0.89, 0.32, 1.2);
        }
        @keyframes toastBar {
          from { transform: scaleX(1); transform-origin: right; }
          to { transform: scaleX(0); transform-origin: right; }
        }
        .animate-toast-bar {
          animation: toastBar 8s linear forwards;
        }
        .flash-new {
          animation:
            flashPop 1.6s ease-out,
            flashGlow 4.5s ease-out,
            flashPulse 3s ease-in-out 0s 4;
        }
      `}</style>
    </>
  );
}
