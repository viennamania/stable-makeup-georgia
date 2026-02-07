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
      options: [
        "google",
        "discord",
        "email",
        "x",
        "passkey",
        "phone",
        "facebook",
        "line",
        "apple",
        "coinbase",
      ],
    },
  }),
  createWallet("com.coinbase.wallet"),
  createWallet("me.rainbow"),
  createWallet("io.rabby"),
  createWallet("io.zerion.wallet"),
  createWallet("io.metamask"),
  createWallet("com.bitget.web3"),
  createWallet("com.trustwallet.app"),
  createWallet("com.okex.wallet"),
];

const formatNumber = (value: any) => {
  if (value === null || value === undefined || value === "") {
    return "-";
  }
  const num = typeof value === "number" ? value : Number(value);
  if (Number.isNaN(num)) return String(value);
  return num.toLocaleString("ko-KR");
};

const formatDateTime = (value: any) => {
  if (!value) return "-";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString("ko-KR");
};

const formatTimeAgo = (value: any) => {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const diff = Date.now() - date.getTime();
  const sec = Math.floor(diff / 1000);
  const min = Math.floor(sec / 60);
  const hour = Math.floor(min / 60);
  const day = Math.floor(hour / 24);

  if (sec < 60) return `${sec}초 전`;
  if (min < 60) return `${min}분 전`;
  if (hour < 24) return `${hour}시간 전`;
  return `${day}일 전`;
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
}

type AccountCardProps = {
  group: GroupedAccount;
  flashIds: Record<string, boolean>;
  toLogId: (log: WebhookLog, idx: number) => string;
};

const AccountCard: React.FC<AccountCardProps> = ({ group, flashIds, toLogId }) => {
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

  const totalAmountLabel = `${formatNumber(group.totalAmount)}`;

  return (
    <div
      className="relative flex flex-col bg-white rounded-xl border border-zinc-200 shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between gap-2 px-3 py-2 border-b border-zinc-100">
        <div className="flex flex-col gap-1">
          <div className="text-[11px] uppercase tracking-wide text-zinc-500">계좌번호</div>
          <div className="text-sm font-semibold text-zinc-900 break-all">{group.accountNumber}</div>
          <div className="flex items-center gap-2 text-[11px] text-zinc-500">
            <span className="px-2 py-0.5 rounded-full bg-zinc-100 border border-zinc-200">로그 {group.logs.length}</span>
            {group.bankCode && (
              <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">은행 {group.bankCode}</span>
            )}
          </div>
        </div>
        <div className="text-right">
          <div className="text-[11px] text-zinc-500">총액</div>
          <div className="text-sm font-semibold text-blue-700">{totalAmountLabel}</div>
        </div>
      </div>

      <div
        ref={listRef}
        className="divide-y divide-zinc-100 max-h-[280px] overflow-y-auto"
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

          const rowKey = toLogId(log, idx);
          const isFlash = !!flashIds[rowKey];

          return (
            <div
              key={rowKey}
              className={`px-3 py-2 flex items-start justify-between gap-3 hover:bg-zinc-50 ${isFlash ? "flash-new" : ""}`}
            >
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-zinc-900 truncate">{transactionName || "-"}</div>
                <div className="text-[11px] text-zinc-500 flex items-center gap-2">
                  <span>{formatDateTime(transactionDate)}</span>
                  <span className="text-[10px] text-amber-700 font-semibold">{formatTimeAgo(transactionDate)}</span>
                </div>
                <div className="flex flex-wrap gap-1 mt-1 text-[10px] text-zinc-500">
                  {traceId && <span className="px-2 py-0.5 rounded-full bg-zinc-100 border border-zinc-200">trace {traceId}</span>}
                  {mallId && <span className="px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-100">mall {mallId}</span>}
                  {balance !== undefined && <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-100">잔액 {formatNumber(balance)}</span>}
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
        body: JSON.stringify({}), // fetch today's all
      });

      if (!response.ok) {
        toast.error("웹훅 로그 조회에 실패했습니다.");
        return;
      }

      const data = await response.json();
      const nextLogs: WebhookLog[] = data?.result?.logs || [];
      markNewEntries(nextLogs);
      setLogs(nextLogs);
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

    fetchLogs();

    const id = setInterval(() => {
      fetchLogs();
    }, refreshInterval);

    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address]);

  useEffect(() => {
    const onScroll = () => {
      setShowScrollTop(window.scrollY > 240);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
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

      const current: GroupedAccount = map.get(accountNumber) ?? {
        accountNumber,
        bankCode,
        logs: [],
        totalAmount: 0,
        latestCreatedAt: log.createdAt,
      };

      current.logs.push(log);
      current.totalAmount += amount;
      current.bankCode = current.bankCode || bankCode;

      const currentTime = current.latestCreatedAt ? new Date(current.latestCreatedAt).getTime() : 0;
      const logTime = log.createdAt ? new Date(log.createdAt).getTime() : 0;
      if (logTime > currentTime) {
        current.latestCreatedAt = log.createdAt;
      }

      map.set(accountNumber, current);
    });

    return Array.from(map.values()).sort((a, b) => {
      const aTime = a.latestCreatedAt ? new Date(a.latestCreatedAt).getTime() : 0;
      const bTime = b.latestCreatedAt ? new Date(b.latestCreatedAt).getTime() : 0;
      return bTime - aTime;
    });
  }, [logs]);

  if (!address) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <h1 className="text-2xl font-bold">로그인</h1>

        <ConnectButton
          client={client}
          wallets={wallets}
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

        <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-2 bg-black/10 p-2 rounded-lg">
          <div className="flex items-center gap-2">
            <Image src="/icon-bank.png" alt="Bank" width={35} height={35} className="w-7 h-7" />
            <div className="text-lg font-semibold">은행 입금 웹훅 로그</div>
            <span className="text-[11px] bg-green-500 text-white px-2 py-0.5 rounded-full">최신순</span>
            <span className="text-[11px] bg-blue-500 text-white px-2 py-0.5 rounded-full">10초 자동 새로고침</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 bg-white rounded-xl shadow-md border border-zinc-200 px-3 py-2">
          <div className="flex items-center gap-3">
            <div className="text-sm text-zinc-500">표시</div>
            <div className="text-xl font-semibold text-[#1f2937]">{logs.length.toLocaleString('ko-KR')}건</div>
            <div className="text-xs text-zinc-400">/ 오늘 전체</div>
            <div className="text-xs text-green-700 font-semibold">계좌 {groupedByAccount.length.toLocaleString('ko-KR')}개</div>
          </div>
          <div className="text-xs text-zinc-500">
            {fetchedAt ? `업데이트: ${formatDateTime(fetchedAt)}` : '업데이트 대기중...'}
          </div>
        </div>

        {groupedByAccount.length === 0 ? (
          <div className="w-full bg-white rounded-lg shadow-md border border-dashed border-zinc-300 p-8 text-center text-gray-500">
            조회된 웹훅 로그가 없습니다.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
            {groupedByAccount.map((group) => {
              return (
                <AccountCard
                  key={group.accountNumber}
                  group={group}
                  flashIds={flashIds}
                  toLogId={toLogId}
                />
              );
            })}
          </div>
        )}

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
          0% { transform: scale(0.94); background: #fff3c4; box-shadow: 0 0 0 0 rgba(251, 191, 36, 0.9); }
          50% { transform: scale(1.05); background: #ffe08a; box-shadow: 0 16px 50px -14px rgba(251, 191, 36, 0.9); }
          100% { transform: scale(1); background: #fffdf6; box-shadow: 0 0 0 0 rgba(251, 191, 36, 0); }
        }
        @keyframes flashGlow {
          0% { outline: 3px solid rgba(251, 191, 36, 0.95); }
          100% { outline: 0 solid rgba(251, 191, 36, 0); }
        }
        @keyframes flashPulse {
          0% { box-shadow: 0 0 0 0 rgba(251, 191, 36, 0.45); }
          50% { box-shadow: 0 0 0 12px rgba(251, 191, 36, 0.0); }
          100% { box-shadow: 0 0 0 0 rgba(251, 191, 36, 0); }
        }
        .flash-new {
          animation:
            flashPop 1.15s ease-out,
            flashGlow 3.2s ease-out,
            flashPulse 2.2s ease-in-out 0s 3;
        }
      `}</style>
    </>
  );
}
