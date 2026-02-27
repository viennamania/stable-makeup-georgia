"use client";

import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as Ably from "ably";

import RealtimeTopNav from "@components/realtime/RealtimeTopNav";
import {
  BANKTRANSFER_ABLY_CHANNEL,
  BANKTRANSFER_ABLY_EVENT_NAME,
  type BankTransferDashboardEvent,
} from "@lib/ably/constants";
import { getRelativeTimeInfo, type RelativeTimeTone } from "@lib/realtime/timeAgo";

type RealtimeItem = {
  id: string;
  receivedAt: string;
  data: BankTransferDashboardEvent;
  highlightUntil: number;
};

const MAX_EVENTS = 120;
const RESYNC_LIMIT = 140;
const RESYNC_INTERVAL_MS = 10_000;
const NEW_EVENT_HIGHLIGHT_MS = 3_600;
const TIME_AGO_TICK_MS = 5_000;

function toTimestamp(value: string | null | undefined): number {
  if (!value) {
    return 0;
  }
  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function getTransactionTypeLabel(transactionType: string): string {
  if (transactionType === "deposited") {
    return "입금";
  }
  if (transactionType === "withdrawn") {
    return "출금";
  }
  return transactionType || "-";
}

function getTransactionTypeClassName(transactionType: string): string {
  if (transactionType === "deposited") {
    return "border border-emerald-400/35 bg-emerald-500/15 text-emerald-200";
  }
  if (transactionType === "withdrawn") {
    return "border border-rose-400/35 bg-rose-500/15 text-rose-200";
  }
  return "border border-slate-500/40 bg-slate-700/45 text-slate-100";
}

function getStatusClassName(status: string): string {
  if (status === "stored") {
    return "border border-cyan-400/35 bg-cyan-500/15 text-cyan-200";
  }
  if (status === "error") {
    return "border border-rose-400/35 bg-rose-500/15 text-rose-200";
  }
  return "border border-slate-500/40 bg-slate-700/45 text-slate-100";
}

function formatKrw(value: number): string {
  return Number(value || 0).toLocaleString("ko-KR");
}

function maskName(value: string): string {
  const name = String(value || "").trim();
  if (!name) {
    return "-";
  }
  if (name.length <= 1) {
    return "*";
  }
  if (name.length === 2) {
    return `${name[0]}*`;
  }
  if (name.length === 3) {
    return `${name[0]}*${name[2]}`;
  }
  return `${name[0]}${"*".repeat(name.length - 2)}${name[name.length - 1]}`;
}

function maskAccountNumber(value: string): string {
  const accountNumber = String(value || "").trim();
  if (!accountNumber) {
    return "-";
  }

  const visibleTailLength = Math.min(4, accountNumber.length);
  const head = accountNumber.slice(0, -visibleTailLength);
  const tail = accountNumber.slice(-visibleTailLength);

  const maskedHead = head.replace(/[0-9A-Za-z가-힣]/g, "*");
  return `${maskedHead}${tail}`;
}

function getReceiverDisplayInfo(event: BankTransferDashboardEvent): {
  nickname: string;
  bankName: string;
  accountHolder: string;
  accountNumber: string;
  walletAddress: string;
} {
  const receiver = event.receiver;

  return {
    nickname: String(receiver?.nickname || "").trim(),
    bankName: String(receiver?.bankName || "").trim(),
    accountHolder: String(receiver?.accountHolder || "").trim(),
    accountNumber: String(receiver?.accountNumber || event.bankAccountNumber || "").trim(),
    walletAddress: String(receiver?.walletAddress || "").trim(),
  };
}

function getRelativeTimeToneClassName(tone: RelativeTimeTone): string {
  switch (tone) {
    case "live":
      return "animate-pulse border-cyan-300/75 bg-cyan-400/22 text-cyan-50 shadow-[0_0_0_1px_rgba(34,211,238,0.3),0_0_16px_rgba(34,211,238,0.24)]";
    case "fresh":
      return "border-teal-300/65 bg-teal-400/18 text-teal-50 shadow-[0_0_0_1px_rgba(45,212,191,0.2)]";
    case "recent":
      return "border-sky-300/55 bg-sky-400/14 text-sky-100";
    case "normal":
      return "border-slate-500/50 bg-slate-700/55 text-slate-100";
    default:
      return "border-slate-700/70 bg-slate-900/70 text-slate-400";
  }
}

export default function RealtimeBankTransferPage() {
  const params = useParams();
  const lang = typeof params?.lang === "string" ? params.lang : "ko";

  const [events, setEvents] = useState<RealtimeItem[]>([]);
  const [connectionState, setConnectionState] = useState<Ably.ConnectionState>("initialized");
  const [connectionErrorMessage, setConnectionErrorMessage] = useState<string | null>(null);
  const [syncErrorMessage, setSyncErrorMessage] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [cursor, setCursor] = useState<string | null>(null);
  const [nowMs, setNowMs] = useState(() => Date.now());

  const cursorRef = useRef<string | null>(null);

  const clientId = useMemo(() => {
    return `banktransfer-dashboard-${Math.random().toString(36).slice(2, 10)}`;
  }, []);

  const updateCursor = useCallback((nextCursor: string | null | undefined) => {
    if (!nextCursor) {
      return;
    }

    setCursor((previousCursor) => {
      if (!previousCursor || nextCursor > previousCursor) {
        cursorRef.current = nextCursor;
        return nextCursor;
      }

      return previousCursor;
    });
  }, []);

  const upsertRealtimeEvents = useCallback(
    (incomingEvents: BankTransferDashboardEvent[], options?: { highlightNew?: boolean }) => {
      if (incomingEvents.length === 0) {
        return;
      }

      const highlightNew = options?.highlightNew ?? true;
      const now = Date.now();

      setEvents((previousEvents) => {
        const map = new Map(previousEvents.map((item) => [item.id, item]));

        for (const incomingEvent of incomingEvents) {
          const nextId =
            incomingEvent.eventId ||
            incomingEvent.cursor ||
            `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

          const existing = map.get(nextId);
          if (existing) {
            map.set(nextId, {
              ...existing,
              data: incomingEvent,
            });
            continue;
          }

          map.set(nextId, {
            id: nextId,
            receivedAt: new Date().toISOString(),
            data: incomingEvent,
            highlightUntil: highlightNew ? now + NEW_EVENT_HIGHLIGHT_MS : 0,
          });
        }

        const merged = Array.from(map.values());
        merged.sort((left, right) => {
          return (
            toTimestamp(right.data.publishedAt || right.receivedAt) -
            toTimestamp(left.data.publishedAt || left.receivedAt)
          );
        });

        return merged.slice(0, MAX_EVENTS);
      });

      for (const incomingEvent of incomingEvents) {
        updateCursor(incomingEvent.cursor || null);
      }
    },
    [updateCursor],
  );

  const syncFromApi = useCallback(
    async (sinceOverride?: string | null) => {
      const since = sinceOverride ?? cursorRef.current;
      const params = new URLSearchParams({
        limit: String(RESYNC_LIMIT),
        public: "1",
      });

      if (since) {
        params.set("since", since);
      }

      setIsSyncing(true);
      let lastError: string | null = null;

      for (let attempt = 1; attempt <= 3; attempt += 1) {
        try {
          const response = await fetch(`/api/realtime/banktransfer/events?${params.toString()}`, {
            method: "GET",
            cache: "no-store",
          });

          if (!response.ok) {
            const text = await response.text();
            throw new Error(`HTTP ${response.status} ${text}`);
          }

          const data = await response.json();
          const incomingEvents = Array.isArray(data.events)
            ? (data.events as BankTransferDashboardEvent[])
            : [];

          upsertRealtimeEvents(incomingEvents, { highlightNew: Boolean(since) });
          updateCursor(typeof data.nextCursor === "string" ? data.nextCursor : null);
          setSyncErrorMessage(null);
          setIsSyncing(false);
          return;
        } catch (error) {
          lastError = error instanceof Error ? error.message : "sync failed";

          if (attempt < 3) {
            await new Promise((resolve) => setTimeout(resolve, attempt * 300));
          }
        }
      }

      setSyncErrorMessage(lastError || "재동기화에 실패했습니다.");
      setIsSyncing(false);
    },
    [upsertRealtimeEvents, updateCursor],
  );

  useEffect(() => {
    const realtime = new Ably.Realtime({
      authUrl: `/api/realtime/ably-token?public=1&stream=banktransfer&clientId=${clientId}`,
    });

    const channel = realtime.channels.get(BANKTRANSFER_ABLY_CHANNEL);

    const onConnectionStateChange = (stateChange: Ably.ConnectionStateChange) => {
      setConnectionState(stateChange.current);
      if (stateChange.reason) {
        setConnectionErrorMessage(stateChange.reason.message || "Ably connection error");
      }

      if (stateChange.current === "connected") {
        void syncFromApi();
      }
    };

    const onMessage = (message: Ably.Message) => {
      const data = message.data as BankTransferDashboardEvent;
      upsertRealtimeEvents(
        [
          {
            ...data,
            eventId: data.eventId || String(message.id || ""),
          },
        ],
        { highlightNew: true },
      );
    };

    realtime.connection.on(onConnectionStateChange);
    void channel.subscribe(BANKTRANSFER_ABLY_EVENT_NAME, onMessage);

    return () => {
      channel.unsubscribe(BANKTRANSFER_ABLY_EVENT_NAME, onMessage);
      realtime.connection.off(onConnectionStateChange);
      realtime.close();
    };
  }, [clientId, syncFromApi, upsertRealtimeEvents]);

  useEffect(() => {
    void syncFromApi(null);

    const timer = window.setInterval(() => {
      void syncFromApi();
    }, RESYNC_INTERVAL_MS);

    return () => {
      window.clearInterval(timer);
    };
  }, [syncFromApi]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNowMs(Date.now());
    }, TIME_AGO_TICK_MS);

    return () => {
      window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    const now = Date.now();
    const activeHighlights = events
      .map((item) => item.highlightUntil)
      .filter((until) => until > now);

    if (activeHighlights.length === 0) {
      return;
    }

    const nextExpiryAt = Math.min(...activeHighlights);
    const waitMs = Math.max(80, nextExpiryAt - now + 20);

    const timer = window.setTimeout(() => {
      setEvents((previous) => {
        const current = Date.now();
        return previous.map((item) => {
          if (item.highlightUntil > current || item.highlightUntil === 0) {
            return item;
          }
          return {
            ...item,
            highlightUntil: 0,
          };
        });
      });
    }, waitMs);

    return () => {
      window.clearTimeout(timer);
    };
  }, [events]);

  const sortedEvents = useMemo(() => {
    return [...events].sort((a, b) => {
      const left = toTimestamp(a.data.publishedAt || a.receivedAt);
      const right = toTimestamp(b.data.publishedAt || b.receivedAt);
      return right - left;
    });
  }, [events]);

  const summary = useMemo(() => {
    let depositedCount = 0;
    let withdrawnCount = 0;
    let depositedAmount = 0;
    let withdrawnAmount = 0;
    let errorCount = 0;
    let matchedCount = 0;

    for (const item of sortedEvents) {
      const type = String(item.data.transactionType || "");
      const amount = Number(item.data.amount || 0);

      if (type === "deposited") {
        depositedCount += 1;
        depositedAmount += amount;
      }

      if (type === "withdrawn") {
        withdrawnCount += 1;
        withdrawnAmount += amount;
      }

      if (item.data.status === "error") {
        errorCount += 1;
      }

      if (String(item.data.match || "").trim()) {
        matchedCount += 1;
      }
    }

    return {
      totalEvents: sortedEvents.length,
      depositedCount,
      withdrawnCount,
      depositedAmount,
      withdrawnAmount,
      errorCount,
      matchedCount,
    };
  }, [sortedEvents]);

  const totalEventsForRatio = Math.max(1, summary.totalEvents);

  const metricCards = useMemo(() => {
    return [
      {
        key: "total",
        title: "총 이벤트",
        value: summary.totalEvents.toLocaleString("ko-KR"),
        sub: "실시간 누적 수신",
        ratio: 100,
        tone: "slate",
      },
      {
        key: "deposited",
        title: "입금 누적 금액",
        value: `${formatKrw(summary.depositedAmount)} KRW`,
        sub: `${summary.depositedCount.toLocaleString("ko-KR")}건`,
        ratio: (summary.depositedCount / totalEventsForRatio) * 100,
        tone: "emerald",
      },
      {
        key: "withdrawn",
        title: "출금 누적 금액",
        value: `${formatKrw(summary.withdrawnAmount)} KRW`,
        sub: `${summary.withdrawnCount.toLocaleString("ko-KR")}건`,
        ratio: (summary.withdrawnCount / totalEventsForRatio) * 100,
        tone: "rose",
      },
      {
        key: "errors",
        title: "오류 이벤트",
        value: summary.errorCount.toLocaleString("ko-KR"),
        sub: "검증 필요",
        ratio: (summary.errorCount / totalEventsForRatio) * 100,
        tone: "amber",
      },
    ] as const;
  }, [summary, totalEventsForRatio]);

  function getMetricToneClassName(tone: "slate" | "emerald" | "rose" | "amber") {
    if (tone === "emerald") {
      return {
        card: "border-emerald-400/75 bg-gradient-to-br from-emerald-100 to-emerald-50",
        label: "text-emerald-700",
        value: "text-emerald-950",
        meta: "text-emerald-700/90",
        rail: "bg-emerald-200",
        bar: "bg-emerald-600",
      };
    }
    if (tone === "rose") {
      return {
        card: "border-rose-400/75 bg-gradient-to-br from-rose-100 to-rose-50",
        label: "text-rose-700",
        value: "text-rose-950",
        meta: "text-rose-700/90",
        rail: "bg-rose-200",
        bar: "bg-rose-600",
      };
    }
    if (tone === "amber") {
      return {
        card: "border-amber-400/75 bg-gradient-to-br from-amber-100 to-amber-50",
        label: "text-amber-700",
        value: "text-amber-950",
        meta: "text-amber-700/90",
        rail: "bg-amber-200",
        bar: "bg-amber-500",
      };
    }
    return {
      card: "border-slate-400/75 bg-gradient-to-br from-slate-100 to-slate-50",
      label: "text-slate-700",
      value: "text-slate-900",
      meta: "text-slate-700/90",
      rail: "bg-slate-300",
      bar: "bg-sky-600",
    };
  }

  return (
    <main className="w-full max-w-[1800px] space-y-5 pt-20 text-slate-100">
      <RealtimeTopNav lang={lang} current="banktransfer" />

      <section className="overflow-hidden rounded-2xl border border-cyan-500/20 bg-[radial-gradient(circle_at_top,_rgba(15,118,110,0.22),_rgba(2,6,23,0.96)_52%)] p-6 shadow-[0_20px_70px_-24px_rgba(6,182,212,0.45)]">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-cyan-100">Banktransfer Realtime Dashboard</h1>
            <p className="mt-1 text-sm text-slate-300">
              공개 대시보드입니다. 입금자 이름/계좌번호는 마스킹되어 표시됩니다.
            </p>
            <p className="mt-1 text-xs text-cyan-300/90">
              Channel: <span className="font-mono">{BANKTRANSFER_ABLY_CHANNEL}</span> / Event: <span className="font-mono">{BANKTRANSFER_ABLY_EVENT_NAME}</span>
            </p>
          </div>

          <button
            type="button"
            onClick={() => void syncFromApi(null)}
            className="rounded-xl border border-cyan-400/40 bg-cyan-500/10 px-3 py-2 text-sm text-cyan-100 transition hover:bg-cyan-500/20"
          >
            재동기화
          </button>
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-xl border border-slate-700/70 bg-slate-900/65 px-3 py-2 text-sm text-slate-200">
            Connection <span className="ml-2 font-semibold text-cyan-200">{connectionState}</span>
          </div>
          <div className="rounded-xl border border-slate-700/70 bg-slate-900/65 px-3 py-2 text-sm text-slate-200">
            Sync <span className="ml-2 font-semibold text-cyan-200">{isSyncing ? "running" : "idle"}</span>
          </div>
          <div className="rounded-xl border border-slate-700/70 bg-slate-900/65 px-3 py-2 text-sm text-slate-200">
            Cursor <span className="ml-2 break-all font-mono text-xs text-cyan-200">{cursor || "-"}</span>
          </div>
          <div className="rounded-xl border border-slate-700/70 bg-slate-900/65 px-3 py-2 text-sm text-slate-200">
            매칭된 이벤트 <span className="ml-2 font-semibold text-cyan-200">{summary.matchedCount.toLocaleString("ko-KR")}</span>
          </div>
        </div>
      </section>

      {connectionErrorMessage && (
        <div className="rounded-xl border border-rose-500/40 bg-rose-950/55 px-3 py-2 text-sm text-rose-200">
          {connectionErrorMessage}
        </div>
      )}

      {syncErrorMessage && (
        <div className="rounded-xl border border-rose-500/40 bg-rose-950/55 px-3 py-2 text-sm text-rose-200">
          {syncErrorMessage}
        </div>
      )}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metricCards.map((metric) => {
          const tone = getMetricToneClassName(metric.tone);
          const width = Math.max(4, Math.min(100, metric.key === "total" ? 100 : metric.ratio));

          return (
            <article
              key={metric.key}
              className={`relative overflow-hidden rounded-2xl border p-4 shadow-[0_14px_28px_-20px_rgba(2,6,23,0.9)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_34px_-20px_rgba(8,145,178,0.38)] ${tone.card}`}
            >
              <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-white/5 blur-2xl" />
              <p className={`relative text-xs uppercase tracking-[0.08em] ${tone.label}`}>{metric.title}</p>
              <p className={`relative mt-2 text-2xl font-semibold leading-tight tabular-nums ${tone.value}`}>{metric.value}</p>
              <div className="relative mt-2 flex items-center justify-between text-xs">
                <span className={tone.meta}>{metric.sub}</span>
                <span className={`${tone.label} font-medium tabular-nums`}>{metric.key === "total" ? "100.0%" : `${metric.ratio.toFixed(1)}%`}</span>
              </div>
              <div className={`relative mt-2 h-1.5 overflow-hidden rounded-full ${tone.rail}`}>
                <div className={`h-full rounded-full ${tone.bar} transition-all duration-500`} style={{ width: `${width}%` }} />
              </div>
            </article>
          );
        })}
      </section>

      <section className="grid gap-3 xl:grid-cols-[360px_minmax(0,1fr)]">
        <div className="rounded-2xl border border-slate-700/80 bg-slate-900/75 p-4 shadow-lg shadow-black/20">
          <p className="text-xs uppercase tracking-wide text-slate-400">거래 지표</p>
          <div className="mt-3 space-y-2 text-sm">
            <div className="flex items-center justify-between rounded-lg border border-slate-700/70 bg-slate-950/60 px-3 py-2">
              <span className="text-slate-300">입금 건수</span>
              <span className="font-semibold tabular-nums text-emerald-200">{summary.depositedCount.toLocaleString("ko-KR")}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-slate-700/70 bg-slate-950/60 px-3 py-2">
              <span className="text-slate-300">출금 건수</span>
              <span className="font-semibold tabular-nums text-rose-200">{summary.withdrawnCount.toLocaleString("ko-KR")}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-slate-700/70 bg-slate-950/60 px-3 py-2">
              <span className="text-slate-300">매칭 성공</span>
              <span className="font-semibold tabular-nums text-cyan-200">{summary.matchedCount.toLocaleString("ko-KR")}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-slate-700/70 bg-slate-950/60 px-3 py-2">
              <span className="text-slate-300">오류 이벤트</span>
              <span className="font-semibold tabular-nums text-amber-200">{summary.errorCount.toLocaleString("ko-KR")}</span>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-700/80 bg-slate-900/75 shadow-lg shadow-black/20">
          <div className="border-b border-slate-700/80 px-4 py-3">
            <p className="font-semibold text-slate-100">실시간 입출금 내역</p>
            <p className="text-xs text-slate-400">최신 이벤트 순</p>
          </div>

          <div className="space-y-2 p-3 md:hidden">
            {sortedEvents.length === 0 && (
              <div className="rounded-xl border border-slate-700/80 bg-slate-950/70 px-3 py-8 text-center text-sm text-slate-500">
                아직 수신된 이벤트가 없습니다.
              </div>
            )}

            {sortedEvents.map((item) => {
              const isHighlighted = item.highlightUntil > Date.now();
              const timeInfo = getRelativeTimeInfo(item.data.publishedAt || item.receivedAt, nowMs);
              const receiverInfo = getReceiverDisplayInfo(item.data);
              const receiverAccountHolder = receiverInfo.accountHolder
                ? maskName(receiverInfo.accountHolder)
                : "-";
              const receiverAccountNumber = receiverInfo.accountNumber
                ? maskAccountNumber(receiverInfo.accountNumber)
                : "-";
              const receiverBankName = receiverInfo.bankName || "-";
              const receiverNickname = receiverInfo.nickname || "-";
              const receiverWalletAddress = receiverInfo.walletAddress || "-";

              return (
                <article
                  key={`mobile-${item.id}`}
                  className={`rounded-xl border p-3 transition-all duration-500 ${
                    isHighlighted
                      ? "animate-pulse border-cyan-400/40 bg-cyan-500/10 shadow-[inset_0_0_0_1px_rgba(34,211,238,0.28)]"
                      : "border-slate-700/80 bg-slate-950/65"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div
                        className={`inline-flex rounded-md border px-2 py-1 font-mono text-[11px] font-semibold tabular-nums ${getRelativeTimeToneClassName(timeInfo.tone)}`}
                      >
                        {timeInfo.relativeLabel}
                      </div>
                      <div className="mt-1 font-mono text-[11px] text-slate-500">{timeInfo.absoluteLabel}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-base font-semibold tabular-nums text-slate-100">
                        {formatKrw(item.data.amount)} KRW
                      </div>
                      {isHighlighted && (
                        <span className="mt-1 inline-flex rounded-md border border-cyan-400/40 bg-cyan-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-cyan-100">
                          NEW
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-1">
                    <span className={`rounded-full px-2 py-1 text-xs font-medium ${getStatusClassName(item.data.status)}`}>
                      {item.data.status || "-"}
                    </span>
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-medium ${getTransactionTypeClassName(item.data.transactionType)}`}
                    >
                      {getTransactionTypeLabel(item.data.transactionType)}
                    </span>
                  </div>

                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    <div className="rounded-lg border border-slate-700/70 bg-slate-900/60 px-2.5 py-2">
                      <p className="text-[10px] uppercase tracking-[0.08em] text-slate-400">입금자</p>
                      <p className="mt-1 text-sm text-slate-100">{maskName(item.data.transactionName)}</p>
                      <p className="mt-1 font-mono text-[11px] text-slate-400">
                        {maskAccountNumber(item.data.bankAccountNumber)}
                      </p>
                    </div>

                    <div className="rounded-lg border border-slate-700/70 bg-slate-900/60 px-2.5 py-2">
                      <p className="text-[10px] uppercase tracking-[0.08em] text-slate-400">입금 수취자</p>
                      <p className="mt-1 text-sm text-slate-100">{receiverAccountHolder}</p>
                      <p className="mt-1 text-[11px] text-slate-400">
                        {receiverBankName} {receiverAccountNumber}
                      </p>
                      <p className="mt-1 text-[11px] text-cyan-200">닉네임: {receiverNickname}</p>
                      {receiverWalletAddress !== "-" && (
                        <p className="mt-1 break-all font-mono text-[11px] text-slate-500">
                          Wallet: {receiverWalletAddress}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-2 rounded-lg border border-slate-700/70 bg-slate-900/60 px-2.5 py-2 text-[11px]">
                    <p className="font-mono text-cyan-200">TID: {item.data.tradeId || "-"}</p>
                    <p className="mt-1 font-mono text-slate-400">Match: {item.data.match || "-"}</p>
                    <p className="mt-1 font-mono text-slate-500">Trace: {item.data.traceId || "-"}</p>
                  </div>
                </article>
              );
            })}
          </div>

          <div className="hidden overflow-x-auto md:block">
            <table className="min-w-[1380px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-700/80 bg-slate-950/90 text-left text-slate-300">
                  <th className="w-[190px] px-3 py-2">시간</th>
                  <th className="w-[130px] px-3 py-2">처리</th>
                  <th className="w-[120px] px-3 py-2">유형</th>
                  <th className="w-[170px] px-3 py-2 text-right">금액</th>
                  <th className="w-[140px] px-3 py-2">입금자</th>
                  <th className="w-[170px] px-3 py-2">계좌</th>
                  <th className="w-[260px] px-3 py-2">입금 수취자</th>
                  <th className="w-[320px] px-3 py-2">거래/매칭</th>
                </tr>
              </thead>
              <tbody>
                {sortedEvents.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-3 py-8 text-center text-slate-500">
                      아직 수신된 이벤트가 없습니다.
                    </td>
                  </tr>
                )}
                {sortedEvents.map((item) => {
                  const isHighlighted = item.highlightUntil > Date.now();
                  const timeInfo = getRelativeTimeInfo(item.data.publishedAt || item.receivedAt, nowMs);
                  const receiverInfo = getReceiverDisplayInfo(item.data);
                  const receiverAccountHolder = receiverInfo.accountHolder
                    ? maskName(receiverInfo.accountHolder)
                    : "-";
                  const receiverAccountNumber = receiverInfo.accountNumber
                    ? maskAccountNumber(receiverInfo.accountNumber)
                    : "-";
                  const receiverBankName = receiverInfo.bankName || "-";
                  const receiverNickname = receiverInfo.nickname || "-";
                  const receiverWalletAddress = receiverInfo.walletAddress || "-";

                  return (
                    <tr
                      key={item.id}
                      className={`border-b border-slate-800/80 align-top transition-all duration-500 ${
                        isHighlighted
                          ? "animate-pulse bg-cyan-500/10 shadow-[inset_0_0_0_1px_rgba(34,211,238,0.32)]"
                          : "hover:bg-slate-900/55"
                      }`}
                    >
                      <td className="px-3 py-3 text-xs text-slate-400">
                        <div
                          className={`inline-flex rounded-md border px-2 py-1 font-mono text-[11px] font-semibold tabular-nums ${getRelativeTimeToneClassName(timeInfo.tone)}`}
                        >
                          {timeInfo.relativeLabel}
                        </div>
                        <div className="mt-1 font-mono text-[11px] text-slate-500">{timeInfo.absoluteLabel}</div>
                        {isHighlighted && (
                          <span className="mt-1 inline-flex rounded-md border border-cyan-400/40 bg-cyan-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-cyan-100">
                            NEW
                          </span>
                        )}
                      </td>

                      <td className="px-3 py-3">
                        <span className={`rounded-full px-2 py-1 text-xs font-medium ${getStatusClassName(item.data.status)}`}>
                          {item.data.status || "-"}
                        </span>
                      </td>

                      <td className="px-3 py-3">
                        <span className={`rounded-full px-2 py-1 text-xs font-medium ${getTransactionTypeClassName(item.data.transactionType)}`}>
                          {getTransactionTypeLabel(item.data.transactionType)}
                        </span>
                      </td>

                      <td className="px-3 py-3 text-right font-semibold tabular-nums text-slate-100">
                        {formatKrw(item.data.amount)}
                      </td>

                      <td className="px-3 py-3 text-slate-200">{maskName(item.data.transactionName)}</td>
                      <td className="px-3 py-3 font-mono text-xs text-slate-300">{receiverAccountNumber}</td>

                      <td className="px-3 py-3">
                        <div className="flex min-w-[230px] flex-col">
                          <span className="leading-tight text-slate-100">{receiverAccountHolder}</span>
                          <span className="mt-1 text-xs leading-tight text-slate-400">
                            {receiverBankName} {receiverAccountNumber}
                          </span>
                          <span className="mt-1 text-xs leading-tight text-cyan-200">닉네임: {receiverNickname}</span>
                          {receiverWalletAddress !== "-" && (
                            <span className="mt-1 break-all font-mono text-[11px] leading-tight text-slate-500">
                              Wallet: {receiverWalletAddress}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-3 py-3">
                        <div className="font-mono text-xs text-cyan-200">TID: {item.data.tradeId || "-"}</div>
                        <div className="mt-1 font-mono text-[11px] text-slate-400">Match: {item.data.match || "-"}</div>
                        <div className="mt-1 font-mono text-[11px] text-slate-500">Trace: {item.data.traceId || "-"}</div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </main>
  );
}
