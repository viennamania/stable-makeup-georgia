"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as Ably from "ably";

import {
  BUYORDER_STATUS_ABLY_CHANNEL,
  BUYORDER_STATUS_ABLY_EVENT_NAME,
  type BuyOrderStatusRealtimeEvent,
} from "@lib/ably/constants";
import { getRelativeTimeInfo, type RelativeTimeTone } from "@lib/realtime/timeAgo";

type RealtimeItem = {
  id: string;
  receivedAt: string;
  data: BuyOrderStatusRealtimeEvent;
  highlightUntil: number;
};

const MAX_EVENTS = 150;
const RESYNC_LIMIT = 120;
const RESYNC_INTERVAL_MS = 12_000;
const NEW_EVENT_HIGHLIGHT_MS = 3_600;
const TIME_AGO_TICK_MS = 5_000;

function toTimestamp(value: string | null | undefined): number {
  if (!value) {
    return 0;
  }
  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function getStatusLabel(status: string | null | undefined): string {
  switch (status) {
    case "ordered":
      return "주문접수";
    case "accepted":
      return "매칭완료";
    case "paymentRequested":
      return "결제요청";
    case "paymentConfirmed":
      return "결제완료";
    case "cancelled":
      return "취소";
    case "paymentSettled":
      return "정산완료";
    default:
      return String(status || "-");
  }
}

function getStatusClassName(status: string | null | undefined): string {
  switch (status) {
    case "paymentConfirmed":
      return "border border-emerald-400/35 bg-emerald-500/15 text-emerald-200";
    case "paymentRequested":
      return "border border-amber-400/35 bg-amber-500/15 text-amber-200";
    case "accepted":
      return "border border-sky-400/35 bg-sky-500/15 text-sky-200";
    case "cancelled":
      return "border border-rose-400/35 bg-rose-500/15 text-rose-200";
    case "ordered":
      return "border border-slate-500/40 bg-slate-700/45 text-slate-100";
    default:
      return "border border-zinc-500/35 bg-zinc-700/45 text-zinc-200";
  }
}

function formatKrw(value: number): string {
  return Number(value || 0).toLocaleString("ko-KR");
}

function formatUsdt(value: number): string {
  return Number(value || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 3,
  });
}

function maskName(value: string | null | undefined): string {
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

function maskAccountNumber(value: string | null | undefined): string {
  const accountNumber = String(value || "").trim();
  if (!accountNumber) {
    return "-";
  }
  const visibleTailLength = Math.min(4, accountNumber.length);
  const head = accountNumber.slice(0, -visibleTailLength);
  const tail = accountNumber.slice(-visibleTailLength);
  return `${head.replace(/[0-9A-Za-z가-힣]/g, "*")}${tail}`;
}

function formatShortHash(value: string | null | undefined): string {
  const hash = String(value || "").trim();
  if (!hash) {
    return "-";
  }
  if (hash.length <= 20) {
    return hash;
  }
  return `${hash.slice(0, 10)}...${hash.slice(-8)}`;
}

function formatShortWalletAddress(value: string | null | undefined): string {
  const address = String(value || "").trim();
  if (!address) {
    return "-";
  }
  if (address.length <= 14) {
    return address;
  }
  return `${address.slice(0, 8)}...${address.slice(-6)}`;
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

export default function RealtimeBuyOrderPage() {
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
    return `buyorder-dashboard-${Math.random().toString(36).slice(2, 10)}`;
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
    (incomingEvents: BuyOrderStatusRealtimeEvent[], options?: { highlightNew?: boolean }) => {
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
          const response = await fetch(`/api/realtime/buyorder/events?${params.toString()}`, {
            method: "GET",
            cache: "no-store",
          });

          if (!response.ok) {
            const text = await response.text();
            throw new Error(`HTTP ${response.status} ${text}`);
          }

          const data = await response.json();
          const incomingEvents = Array.isArray(data.events)
            ? (data.events as BuyOrderStatusRealtimeEvent[])
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
      authUrl: `/api/realtime/ably-token?public=1&stream=buyorder&clientId=${clientId}`,
    });

    const channel = realtime.channels.get(BUYORDER_STATUS_ABLY_CHANNEL);

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
      const data = message.data as BuyOrderStatusRealtimeEvent;
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
    void channel.subscribe(BUYORDER_STATUS_ABLY_EVENT_NAME, onMessage);

    return () => {
      channel.unsubscribe(BUYORDER_STATUS_ABLY_EVENT_NAME, onMessage);
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
          if (item.highlightUntil > current) {
            return item;
          }
          if (item.highlightUntil === 0) {
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
    return [...events].sort((left, right) => {
      return (
        toTimestamp(right.data.publishedAt || right.receivedAt) -
        toTimestamp(left.data.publishedAt || left.receivedAt)
      );
    });
  }, [events]);

  const summary = useMemo(() => {
    const counts = new Map<string, number>();
    let totalKrw = 0;
    let totalUsdt = 0;

    for (const item of sortedEvents) {
      const status = String(item.data.statusTo || "unknown");
      counts.set(status, (counts.get(status) || 0) + 1);
      totalKrw += Number(item.data.amountKrw || 0);
      totalUsdt += Number(item.data.amountUsdt || 0);
    }

    const pendingCount =
      (counts.get("ordered") || 0) +
      (counts.get("accepted") || 0) +
      (counts.get("paymentRequested") || 0);

    return {
      totalKrw,
      totalUsdt,
      pendingCount,
      confirmedCount: counts.get("paymentConfirmed") || 0,
      cancelledCount: counts.get("cancelled") || 0,
      latestStatus: sortedEvents[0]?.data.statusTo || "-",
    };
  }, [sortedEvents]);

  const metricCards = useMemo(() => {
    const total = Math.max(1, sortedEvents.length);
    const toRatio = (count: number) => Math.round((count / total) * 1000) / 10;

    return [
      {
        key: "total",
        title: "총 이벤트",
        value: sortedEvents.length,
        ratio: 100,
        tone: "slate",
        subtext: "실시간 누적 수신",
      },
      {
        key: "confirmed",
        title: "결제완료",
        value: summary.confirmedCount,
        ratio: toRatio(summary.confirmedCount),
        tone: "emerald",
        subtext: "정상 완료 건수",
      },
      {
        key: "pending",
        title: "진행중(주문/매칭/요청)",
        value: summary.pendingCount,
        ratio: toRatio(summary.pendingCount),
        tone: "amber",
        subtext: "처리 대기/진행",
      },
      {
        key: "cancelled",
        title: "취소",
        value: summary.cancelledCount,
        ratio: toRatio(summary.cancelledCount),
        tone: "rose",
        subtext: "취소/중단 건수",
      },
    ] as const;
  }, [sortedEvents.length, summary.cancelledCount, summary.confirmedCount, summary.pendingCount]);

  function getMetricToneClassName(tone: "slate" | "emerald" | "amber" | "rose") {
    if (tone === "emerald") {
      return {
        card: "border-emerald-500/30 bg-emerald-950/25",
        label: "text-emerald-200",
        value: "text-emerald-100",
        meta: "text-emerald-300/75",
        bar: "bg-emerald-400/90",
        rail: "bg-emerald-900/45",
        dot: "bg-emerald-400",
      };
    }
    if (tone === "amber") {
      return {
        card: "border-amber-500/30 bg-amber-950/25",
        label: "text-amber-200",
        value: "text-amber-100",
        meta: "text-amber-300/75",
        bar: "bg-amber-400/90",
        rail: "bg-amber-900/45",
        dot: "bg-amber-400",
      };
    }
    if (tone === "rose") {
      return {
        card: "border-rose-500/30 bg-rose-950/25",
        label: "text-rose-200",
        value: "text-rose-100",
        meta: "text-rose-300/75",
        bar: "bg-rose-400/90",
        rail: "bg-rose-900/45",
        dot: "bg-rose-400",
      };
    }
    return {
      card: "border-slate-600/70 bg-slate-900/80",
      label: "text-slate-200",
      value: "text-slate-100",
      meta: "text-slate-400",
      bar: "bg-cyan-400/90",
      rail: "bg-slate-700/70",
      dot: "bg-cyan-300",
    };
  }

  return (
    <main className="w-full max-w-[1800px] space-y-5 text-slate-100">
      <nav className="flex flex-wrap items-center gap-2">
        <Link
          href={`/${lang}/realtime-banktransfer`}
          className="rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-1.5 text-sm text-slate-300 transition hover:border-cyan-400/60 hover:text-cyan-200"
        >
          Banktransfer
        </Link>
        <span className="rounded-lg border border-cyan-500/45 bg-cyan-500/12 px-3 py-1.5 text-sm font-medium text-cyan-200">
          BuyOrder
        </span>
      </nav>

      <section className="overflow-hidden rounded-2xl border border-cyan-500/20 bg-[radial-gradient(circle_at_top,_rgba(14,116,144,0.24),_rgba(2,6,23,0.96)_52%)] p-6 shadow-[0_20px_70px_-24px_rgba(6,182,212,0.45)]">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-cyan-100">BuyOrder Realtime Dashboard</h1>
            <p className="mt-1 text-sm text-slate-300">
              공개 대시보드입니다. 구매자 이름/계좌번호는 마스킹되어 표시됩니다.
            </p>
            <p className="mt-1 text-xs text-cyan-300/90">
              Channel: <span className="font-mono">{BUYORDER_STATUS_ABLY_CHANNEL}</span> / Event: <span className="font-mono">{BUYORDER_STATUS_ABLY_EVENT_NAME}</span>
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
            Last Status <span className="ml-2 font-semibold text-cyan-200">{getStatusLabel(summary.latestStatus)}</span>
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

          return (
            <article
              key={metric.key}
              className={`relative overflow-hidden rounded-2xl border p-4 shadow-[0_14px_28px_-20px_rgba(2,6,23,0.9)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_34px_-20px_rgba(8,145,178,0.38)] ${tone.card}`}
            >
              <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-white/5 blur-2xl" />

              <div className="relative flex items-start justify-between gap-2">
                <p className={`text-xs uppercase tracking-[0.08em] ${tone.label}`}>{metric.title}</p>
                <span className={`h-2.5 w-2.5 rounded-full ${tone.dot}`} />
              </div>

              <p className={`relative mt-2 text-3xl font-semibold leading-none tabular-nums ${tone.value}`}>
                {metric.value.toLocaleString("ko-KR")}
              </p>

              <div className="relative mt-3 flex items-center justify-between text-xs">
                <span className={tone.meta}>{metric.subtext}</span>
                <span className={`${tone.label} font-medium tabular-nums`}>
                  {metric.key === "total" ? "100.0%" : `${metric.ratio.toFixed(1)}%`}
                </span>
              </div>

              <div className={`relative mt-2 h-1.5 overflow-hidden rounded-full ${tone.rail}`}>
                <div
                  className={`h-full rounded-full ${tone.bar} transition-all duration-500`}
                  style={{
                    width: `${Math.max(
                      4,
                      Math.min(100, metric.key === "total" ? 100 : metric.ratio),
                    )}%`,
                  }}
                />
              </div>
            </article>
          );
        })}
      </section>

      <section className="grid gap-3 xl:grid-cols-[360px_minmax(0,1fr)]">
        <div className="rounded-2xl border border-slate-700/80 bg-slate-900/75 p-4 shadow-lg shadow-black/20">
          <p className="text-xs uppercase tracking-wide text-slate-400">누적 금액</p>
          <p className="mt-2 text-2xl font-semibold text-slate-100">{formatKrw(summary.totalKrw)} KRW</p>
          <p className="mt-1 text-sm text-cyan-200">{formatUsdt(summary.totalUsdt)} USDT</p>
          <div className="mt-4 rounded-xl border border-slate-700/80 bg-slate-950/70 p-3 text-xs text-slate-400">
            이벤트 기준 합계이며 정산 데이터와 다를 수 있습니다.
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-700/80 bg-slate-900/75 shadow-lg shadow-black/20">
          <div className="border-b border-slate-700/80 px-4 py-3">
            <p className="font-semibold text-slate-100">실시간 상태 변경</p>
            <p className="text-xs text-slate-400">최신 이벤트 순</p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-[1360px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-700/80 bg-slate-950/90 text-left text-slate-300">
                  <th className="w-[190px] px-3 py-2">시간</th>
                  <th className="w-[280px] px-3 py-2">상태</th>
                  <th className="w-[180px] px-3 py-2 text-right">금액</th>
                  <th className="w-[140px] px-3 py-2">구매자</th>
                  <th className="w-[170px] px-3 py-2">계좌</th>
                  <th className="w-[260px] px-3 py-2">스토어</th>
                  <th className="w-[420px] px-3 py-2">내역</th>
                </tr>
              </thead>
              <tbody>
                {sortedEvents.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-3 py-8 text-center text-slate-500">
                      아직 수신된 이벤트가 없습니다.
                    </td>
                  </tr>
                )}

                {sortedEvents.map((item) => {
                  const fromLabel = item.data.statusFrom ? getStatusLabel(item.data.statusFrom) : "초기";
                  const toLabel = getStatusLabel(item.data.statusTo);
                  const isHighlighted = item.highlightUntil > Date.now();
                  const timeInfo = getRelativeTimeInfo(item.data.publishedAt || item.receivedAt, nowMs);

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
                        <div className="flex flex-wrap items-center gap-1">
                          <span className={`rounded-full px-2 py-1 text-xs font-medium ${getStatusClassName(item.data.statusFrom)}`}>
                            {fromLabel}
                          </span>
                          <span className="text-slate-500">→</span>
                          <span className={`rounded-full px-2 py-1 text-xs font-medium ${getStatusClassName(item.data.statusTo)}`}>
                            {toLabel}
                          </span>
                        </div>
                      </td>

                      <td className="px-3 py-3 text-right">
                        <div className="text-lg font-semibold leading-tight text-cyan-200">
                          {formatUsdt(item.data.amountUsdt)} USDT
                        </div>
                        <div className="mt-1 text-xs text-slate-400">
                          {formatKrw(item.data.amountKrw)} KRW
                        </div>
                      </td>

                      <td className="px-3 py-3">
                        <div className="flex flex-col">
                          <span className="text-slate-200">{maskName(item.data.buyerName)}</span>
                          <span
                            className="mt-1 font-mono text-[11px] text-cyan-200"
                            title={item.data.buyerWalletAddress || ""}
                          >
                            {formatShortWalletAddress(item.data.buyerWalletAddress)}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-3 font-mono text-xs text-slate-300">{maskAccountNumber(item.data.buyerAccountNumber)}</td>

                      <td className="px-3 py-3">
                        {item.data.store ? (
                          <div className="flex min-w-[240px] items-center gap-2">
                            {item.data.store.logo ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={item.data.store.logo}
                                alt={item.data.store.name || "store-logo"}
                                className="h-9 w-9 rounded-md border border-slate-700 object-cover"
                              />
                            ) : (
                              <div className="h-9 w-9 rounded-md border border-slate-700 bg-slate-800" />
                            )}
                            <div className="flex flex-col">
                              <span className="leading-tight text-slate-100">{item.data.store.name || "-"}</span>
                              <span className="font-mono text-xs leading-tight text-slate-400">
                                {item.data.store.code || "-"}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-500">-</span>
                        )}
                      </td>

                      <td className="px-3 py-3">
                        <div className="font-mono text-xs text-cyan-200">TID: {item.data.tradeId || "-"}</div>
                        <div className="mt-1 font-mono text-[11px] text-slate-400">OID: {item.data.orderId || "-"}</div>
                        <div className="mt-1 font-mono text-[11px] text-slate-500">Source: {item.data.source || "-"}</div>
                        <div className="mt-1 font-mono text-[11px] text-violet-200" title={item.data.transactionHash || ""}>
                          TX: {formatShortHash(item.data.transactionHash)}
                        </div>
                        <div className="mt-1 font-mono text-[11px] text-blue-200" title={item.data.escrowTransactionHash || ""}>
                          Escrow TX: {formatShortHash(item.data.escrowTransactionHash)}
                        </div>
                        <div className="mt-1 font-mono text-[11px] text-slate-400">
                          Queue: {item.data.queueId || "-"}
                        </div>
                        <div className="mt-1 font-mono text-[11px] text-slate-500">
                          Mined: {item.data.minedAt || "-"}
                        </div>
                        {item.data.reason ? (
                          <div className="mt-1 truncate text-xs text-rose-300">{item.data.reason}</div>
                        ) : (
                          <div className="mt-1 text-xs text-slate-500">-</div>
                        )}
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
