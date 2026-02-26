"use client";

import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as Ably from "ably";

import { chain as configuredChain } from "@/app/config/contractAddresses";
import RealtimeTopNav from "@components/realtime/RealtimeTopNav";
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

const MAX_EVENTS = 180;
const RESYNC_LIMIT = 140;
const RESYNC_INTERVAL_MS = 10_000;
const NEW_EVENT_HIGHLIGHT_MS = 4_200;
const TIME_AGO_TICK_MS = 5_000;

function toTimestamp(value: string | null | undefined): number {
  if (!value) {
    return 0;
  }
  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function hasSettlementReference(event: BuyOrderStatusRealtimeEvent): boolean {
  return Boolean(
    String(event.transactionHash || "").trim() ||
      String(event.escrowTransactionHash || "").trim() ||
      String(event.queueId || "").trim() ||
      String(event.minedAt || "").trim(),
  );
}

function isCompletedSettlementEvent(event: BuyOrderStatusRealtimeEvent): boolean {
  if (event.statusTo !== "paymentSettled") {
    return false;
  }

  const amountUsdt = Number(event.amountUsdt || 0);
  const amountKrw = Number(event.amountKrw || 0);

  return amountUsdt > 0 || amountKrw > 0 || hasSettlementReference(event);
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
    case "paymentSettled":
      return "정산완료";
    case "cancelled":
      return "취소";
    default:
      return String(status || "-");
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

function formatShortWalletAddress(value: string | null | undefined): string {
  const address = String(value || "").trim();
  if (!address) {
    return "-";
  }
  if (address.length <= 16) {
    return address;
  }
  return `${address.slice(0, 10)}...${address.slice(-6)}`;
}

function formatReadableHash(value: string | null | undefined): string {
  const hash = String(value || "").trim();
  if (!hash) {
    return "-";
  }
  if (hash.length <= 36) {
    return hash;
  }
  return `${hash.slice(0, 14)}...${hash.slice(-12)}`;
}

function getExplorerTxUrl(txHash: string | null | undefined): string {
  const hash = String(txHash || "").trim();
  if (!hash) {
    return "";
  }
  if (configuredChain === "ethereum") {
    return `https://etherscan.io/tx/${hash}`;
  }
  if (configuredChain === "polygon") {
    return `https://polygonscan.com/tx/${hash}`;
  }
  if (configuredChain === "bsc") {
    return `https://bscscan.com/tx/${hash}`;
  }
  return `https://arbiscan.io/tx/${hash}`;
}

function openExplorerPopup(url: string): void {
  if (!url) {
    return;
  }

  const width = 1220;
  const height = 860;
  const left = Math.max(0, Math.round((window.screen.width - width) / 2));
  const top = Math.max(0, Math.round((window.screen.height - height) / 2));
  const features = [
    `width=${width}`,
    `height=${height}`,
    `left=${left}`,
    `top=${top}`,
    "resizable=yes",
    "scrollbars=yes",
    "status=no",
    "menubar=no",
    "toolbar=no",
    "location=yes",
    "noopener=yes",
    "noreferrer=yes",
  ].join(",");

  window.open(url, "settlement-scan-popup", features);
}

function getRelativeTimeToneClassName(tone: RelativeTimeTone): string {
  switch (tone) {
    case "live":
      return "animate-pulse border-emerald-300/75 bg-emerald-400/23 text-emerald-50 shadow-[0_0_0_1px_rgba(52,211,153,0.32),0_0_16px_rgba(52,211,153,0.22)]";
    case "fresh":
      return "border-teal-300/65 bg-teal-400/18 text-teal-50";
    case "recent":
      return "border-cyan-300/55 bg-cyan-400/15 text-cyan-100";
    case "normal":
      return "border-slate-500/50 bg-slate-700/55 text-slate-100";
    default:
      return "border-slate-700/70 bg-slate-900/70 text-slate-400";
  }
}

export default function RealtimeSettlementPage() {
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
    return `settlement-dashboard-${Math.random().toString(36).slice(2, 10)}`;
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

          let settlementEvents = incomingEvents.filter(isCompletedSettlementEvent);

          if (!since && settlementEvents.length === 0) {
            try {
              const bootstrapResponse = await fetch(
                `/api/realtime/settlement/bootstrap?public=1&limit=${RESYNC_LIMIT}`,
                {
                  method: "GET",
                  cache: "no-store",
                },
              );

              if (bootstrapResponse.ok) {
                const bootstrapData = await bootstrapResponse.json();
                settlementEvents = Array.isArray(bootstrapData.events)
                  ? (bootstrapData.events as BuyOrderStatusRealtimeEvent[])
                  : [];
              }
            } catch (bootstrapError) {
              console.error("Failed to fetch settlement bootstrap events:", bootstrapError);
            }
          }

          upsertRealtimeEvents(settlementEvents, { highlightNew: Boolean(since) });
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
      if (!isCompletedSettlementEvent(data)) {
        return;
      }

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
    return [...events].sort((left, right) => {
      return (
        toTimestamp(right.data.publishedAt || right.receivedAt) -
        toTimestamp(left.data.publishedAt || left.receivedAt)
      );
    });
  }, [events]);

  const summary = useMemo(() => {
    let totalKrw = 0;
    let totalUsdt = 0;
    let settledCount = 0;
    let txCount = 0;
    let escrowTxCount = 0;

    for (const item of sortedEvents) {
      totalKrw += Number(item.data.amountKrw || 0);
      totalUsdt += Number(item.data.amountUsdt || 0);

      if (item.data.statusTo === "paymentSettled") {
        settledCount += 1;
      }
      if (item.data.transactionHash) {
        txCount += 1;
      }
      if (item.data.escrowTransactionHash) {
        escrowTxCount += 1;
      }
    }

    const total = Math.max(1, sortedEvents.length);
    return {
      totalEvents: sortedEvents.length,
      totalKrw,
      totalUsdt,
      settledCount,
      txCount,
      escrowTxCount,
      txCoverage: Math.round((txCount / total) * 1000) / 10,
      escrowCoverage: Math.round((escrowTxCount / total) * 1000) / 10,
      latestStore:
        sortedEvents[0]?.data.store?.name ||
        sortedEvents[0]?.data.store?.code ||
        "Unknown",
    };
  }, [sortedEvents]);

  const metricCards = [
    {
      key: "total",
      title: "정산 이벤트",
      value: summary.totalEvents.toLocaleString("ko-KR"),
      sub: "Settlement 관련 수신",
      tone: "emerald",
    },
    {
      key: "usdt",
      title: "총 정산 USDT",
      value: `${formatUsdt(summary.totalUsdt)} USDT`,
      sub: "온체인 정산 규모",
      tone: "cyan",
    },
    {
      key: "krw",
      title: "총 정산 KRW",
      value: `${formatKrw(summary.totalKrw)} KRW`,
      sub: "원화 환산 합계",
      tone: "slate",
    },
    {
      key: "coverage",
      title: "해시 추적률",
      value: `${summary.txCoverage.toFixed(1)}%`,
      sub: `Escrow ${summary.escrowCoverage.toFixed(1)}%`,
      tone: "amber",
    },
  ] as const;

  function getMetricToneClassName(tone: "emerald" | "cyan" | "slate" | "amber") {
    if (tone === "emerald") {
      return {
        card: "border-emerald-500/35 bg-emerald-950/30",
        title: "text-emerald-200",
        value: "text-emerald-50",
        sub: "text-emerald-300/80",
      };
    }
    if (tone === "cyan") {
      return {
        card: "border-cyan-500/35 bg-cyan-950/30",
        title: "text-cyan-200",
        value: "text-cyan-50",
        sub: "text-cyan-300/80",
      };
    }
    if (tone === "amber") {
      return {
        card: "border-amber-500/35 bg-amber-950/30",
        title: "text-amber-200",
        value: "text-amber-50",
        sub: "text-amber-300/80",
      };
    }
    return {
      card: "border-slate-600/70 bg-slate-900/80",
      title: "text-slate-200",
      value: "text-slate-100",
      sub: "text-slate-400",
    };
  }

  return (
    <main className="w-full max-w-[1880px] space-y-5 pt-20 text-slate-100">
      <RealtimeTopNav lang={lang} current="settlement" />

      <section className="overflow-hidden rounded-2xl border border-emerald-500/20 bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.2),_rgba(2,6,23,0.97)_54%)] p-6 shadow-[0_20px_70px_-24px_rgba(16,185,129,0.45)]">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-emerald-100">
              Settlement Realtime Dashboard
            </h1>
            <p className="mt-1 text-sm text-slate-300">
              BuyOrder 중 paymentSettled 완료 및 정산 참조값이 있는 이벤트만 실시간으로 표시합니다.
            </p>
            <p className="mt-1 text-xs text-emerald-300/90">
              Channel: <span className="font-mono">{BUYORDER_STATUS_ABLY_CHANNEL}</span> / Event:{" "}
              <span className="font-mono">{BUYORDER_STATUS_ABLY_EVENT_NAME}</span>
            </p>
          </div>

          <button
            type="button"
            onClick={() => void syncFromApi(null)}
            className="rounded-xl border border-emerald-400/45 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-100 transition hover:bg-emerald-500/20"
          >
            재동기화
          </button>
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-xl border border-slate-700/70 bg-slate-900/65 px-3 py-2 text-sm text-slate-200">
            Connection <span className="ml-2 font-semibold text-emerald-200">{connectionState}</span>
          </div>
          <div className="rounded-xl border border-slate-700/70 bg-slate-900/65 px-3 py-2 text-sm text-slate-200">
            Sync <span className="ml-2 font-semibold text-emerald-200">{isSyncing ? "running" : "idle"}</span>
          </div>
          <div className="rounded-xl border border-slate-700/70 bg-slate-900/65 px-3 py-2 text-sm text-slate-200">
            Cursor <span className="ml-2 break-all font-mono text-xs text-emerald-200">{cursor || "-"}</span>
          </div>
          <div className="rounded-xl border border-slate-700/70 bg-slate-900/65 px-3 py-2 text-sm text-slate-200">
            Latest Store <span className="ml-2 font-semibold text-emerald-200">{summary.latestStore}</span>
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
              className={`relative overflow-hidden rounded-2xl border p-4 shadow-[0_14px_28px_-20px_rgba(2,6,23,0.9)] transition-all duration-300 hover:-translate-y-0.5 ${tone.card}`}
            >
              <p className={`text-xs uppercase tracking-[0.08em] ${tone.title}`}>{metric.title}</p>
              <p className={`mt-2 text-2xl font-semibold leading-tight tabular-nums ${tone.value}`}>
                {metric.value}
              </p>
              <p className={`mt-2 text-xs ${tone.sub}`}>{metric.sub}</p>
            </article>
          );
        })}
      </section>

      <section className="grid gap-3 xl:grid-cols-[320px_minmax(0,1fr)]">
        <div className="rounded-2xl border border-slate-700/80 bg-slate-900/75 p-4 shadow-lg shadow-black/20">
          <p className="text-xs uppercase tracking-wide text-slate-400">정산 모니터링</p>
          <div className="mt-3 rounded-xl border border-emerald-400/45 bg-emerald-500/10 px-3 py-3 shadow-[inset_0_0_24px_rgba(16,185,129,0.12)]">
            <p className="text-[11px] uppercase tracking-[0.1em] text-emerald-300/90">Settlement USDT</p>
            <p className="mt-1 text-3xl font-bold leading-none tabular-nums text-emerald-100 drop-shadow-[0_0_12px_rgba(16,185,129,0.3)]">
              {formatUsdt(summary.totalUsdt)}
              <span className="ml-1 text-base font-semibold text-emerald-200">USDT</span>
            </p>
          </div>
          <div className="mt-3 rounded-lg border border-slate-700/80 bg-slate-950/70 px-3 py-2">
            <p className="text-[11px] uppercase tracking-[0.1em] text-slate-400">Settlement KRW</p>
            <p className="mt-1 text-lg font-semibold tabular-nums text-slate-200">
              {formatKrw(summary.totalKrw)} KRW
            </p>
          </div>
          <div className="mt-3 rounded-lg border border-emerald-500/35 bg-emerald-950/35 px-3 py-2 text-xs text-emerald-100">
            <div className="flex items-center justify-between gap-2">
              <span>Settlement TX</span>
              <span className="font-semibold tabular-nums">{summary.txCount.toLocaleString("ko-KR")}건</span>
            </div>
            <div className="mt-1 flex items-center justify-between gap-2 text-emerald-200/90">
              <span>Escrow TX</span>
              <span className="font-semibold tabular-nums">{summary.escrowTxCount.toLocaleString("ko-KR")}건</span>
            </div>
          </div>
          <div className="mt-3 rounded-lg border border-slate-700/80 bg-slate-950/70 px-3 py-2 text-xs text-slate-400">
            정산 완료 + 정산 참조 정보가 확인된 이벤트만 추적합니다.
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-700/80 bg-slate-900/75 shadow-lg shadow-black/20">
          <div className="border-b border-slate-700/80 px-4 py-3">
            <p className="font-semibold text-slate-100">실시간 정산 이벤트</p>
            <p className="text-xs text-slate-400">최신 이벤트 순</p>
          </div>

          <div className="space-y-2 p-3 md:hidden">
            {sortedEvents.length === 0 && (
              <div className="rounded-xl border border-slate-700/80 bg-slate-950/70 px-3 py-8 text-center text-sm text-slate-500">
                아직 수신된 정산 이벤트가 없습니다.
              </div>
            )}

            {sortedEvents.map((item) => {
              const isHighlighted = item.highlightUntil > Date.now();
              const timeInfo = getRelativeTimeInfo(item.data.publishedAt || item.receivedAt, nowMs);
              const settlementRefReady = hasSettlementReference(item.data);
              const transactionExplorerUrl = getExplorerTxUrl(item.data.transactionHash);
              const escrowTransactionExplorerUrl = getExplorerTxUrl(item.data.escrowTransactionHash);

              return (
                <article
                  key={`mobile-${item.id}`}
                  className={`rounded-xl border p-3 transition-all duration-500 ${
                    isHighlighted
                      ? "animate-pulse border-emerald-400/45 bg-emerald-500/10 shadow-[inset_0_0_0_1px_rgba(52,211,153,0.28)]"
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
                      <div className="text-base font-semibold leading-tight tabular-nums text-emerald-200">
                        {formatUsdt(item.data.amountUsdt)}
                        <span className="ml-1 text-xs font-semibold text-emerald-100">USDT</span>
                      </div>
                      <div className="mt-1 text-[11px] tabular-nums text-slate-400">
                        {formatKrw(item.data.amountKrw)} KRW
                      </div>
                    </div>
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-1">
                    <span className="rounded-full border border-emerald-300/65 bg-emerald-500/22 px-2 py-1 text-xs font-semibold text-emerald-50">
                      정산완료
                    </span>
                    <span
                      className={`rounded-full border px-2 py-1 text-xs font-medium ${
                        settlementRefReady
                          ? "border-cyan-300/55 bg-cyan-500/16 text-cyan-100"
                          : "border-amber-300/55 bg-amber-500/16 text-amber-100"
                      }`}
                    >
                      {settlementRefReady ? "참조확인" : "참조대기"}
                    </span>
                    {isHighlighted && (
                      <span className="ml-auto rounded-md border border-emerald-400/40 bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-100">
                        NEW
                      </span>
                    )}
                  </div>

                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    <div className="rounded-lg border border-slate-700/70 bg-slate-900/60 px-2.5 py-2">
                      <p className="text-[10px] uppercase tracking-[0.08em] text-slate-400">구매자</p>
                      <p className="mt-1 text-sm text-slate-100">{maskName(item.data.buyerName)}</p>
                      <p className="mt-1 font-mono text-[11px] text-emerald-200" title={item.data.buyerWalletAddress || ""}>
                        {formatShortWalletAddress(item.data.buyerWalletAddress)}
                      </p>
                      <p className="mt-1 font-mono text-[11px] text-slate-400">
                        {maskAccountNumber(item.data.buyerAccountNumber)}
                      </p>
                    </div>

                    <div className="rounded-lg border border-slate-700/70 bg-slate-900/60 px-2.5 py-2">
                      <p className="text-[10px] uppercase tracking-[0.08em] text-slate-400">스토어</p>
                      {item.data.store ? (
                        <div className="mt-1 flex min-w-0 items-center gap-2">
                          {item.data.store.logo ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={item.data.store.logo}
                              alt={item.data.store.name || "store-logo"}
                              className="h-8 w-8 shrink-0 rounded-md border border-slate-700 object-cover"
                            />
                          ) : (
                            <div className="h-8 w-8 shrink-0 rounded-md border border-slate-700 bg-slate-800" />
                          )}
                          <div className="min-w-0">
                            <p className="truncate text-sm text-slate-100">{item.data.store.name || "-"}</p>
                            <p className="font-mono text-[11px] text-slate-400">{item.data.store.code || "-"}</p>
                          </div>
                        </div>
                      ) : (
                        <p className="mt-1 text-xs text-slate-500">-</p>
                      )}
                    </div>
                  </div>

                  <div className="mt-2 rounded-lg border border-slate-700/70 bg-slate-900/60 px-2.5 py-2 text-[11px]">
                    <p className="text-[10px] uppercase tracking-[0.08em] text-emerald-300/90">Settlement Hash</p>
                    {transactionExplorerUrl ? (
                      <a
                        href={transactionExplorerUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(event) => {
                          event.preventDefault();
                          openExplorerPopup(transactionExplorerUrl);
                        }}
                        className="mt-1 block cursor-pointer font-mono text-violet-200 underline decoration-violet-300/45 underline-offset-2 transition hover:text-violet-100 hover:decoration-violet-100"
                        title={item.data.transactionHash || ""}
                      >
                        TX: {formatReadableHash(item.data.transactionHash)}
                      </a>
                    ) : (
                      <p className="mt-1 font-mono text-violet-200">TX: -</p>
                    )}
                    {escrowTransactionExplorerUrl ? (
                      <a
                        href={escrowTransactionExplorerUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(event) => {
                          event.preventDefault();
                          openExplorerPopup(escrowTransactionExplorerUrl);
                        }}
                        className="mt-1 block cursor-pointer font-mono text-blue-200 underline decoration-blue-300/45 underline-offset-2 transition hover:text-blue-100 hover:decoration-blue-100"
                        title={item.data.escrowTransactionHash || ""}
                      >
                        Escrow TX: {formatReadableHash(item.data.escrowTransactionHash)}
                      </a>
                    ) : (
                      <p className="mt-1 font-mono text-blue-200">Escrow TX: -</p>
                    )}
                    <p className="font-mono text-emerald-200">TID: {item.data.tradeId || "-"}</p>
                    <p className="mt-1 font-mono text-slate-400">OID: {item.data.orderId || "-"}</p>
                    <p className="mt-1 font-mono text-slate-500">Source: {item.data.source || "-"}</p>
                    <p className="mt-1 font-mono text-slate-400">Queue: {item.data.queueId || "-"}</p>
                    <p className="mt-1 font-mono text-slate-500">Mined: {item.data.minedAt || "-"}</p>
                    {item.data.reason ? (
                      <p className="mt-1 truncate text-rose-300">{item.data.reason}</p>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>

          <div className="hidden overflow-x-auto md:block">
            <table className="min-w-[1840px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-700/80 bg-slate-950/90 text-left text-slate-300">
                  <th className="w-[220px] px-3 py-2">시간</th>
                  <th className="w-[220px] px-3 py-2">정산 상태</th>
                  <th className="w-[240px] px-3 py-2 text-right">정산 금액</th>
                  <th className="w-[430px] px-3 py-2">Settlement Hash</th>
                  <th className="w-[240px] px-3 py-2">구매자</th>
                  <th className="w-[300px] px-3 py-2">스토어</th>
                  <th className="w-[420px] px-3 py-2">정산 추적</th>
                </tr>
              </thead>
              <tbody>
                {sortedEvents.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-3 py-8 text-center text-slate-500">
                      아직 수신된 정산 이벤트가 없습니다.
                    </td>
                  </tr>
                )}

                {sortedEvents.map((item) => {
                  const fromLabel = item.data.statusFrom ? getStatusLabel(item.data.statusFrom) : "초기";
                  const toLabel = getStatusLabel(item.data.statusTo);
                  const isHighlighted = item.highlightUntil > Date.now();
                  const timeInfo = getRelativeTimeInfo(item.data.publishedAt || item.receivedAt, nowMs);
                  const settlementRefReady = hasSettlementReference(item.data);
                  const transactionExplorerUrl = getExplorerTxUrl(item.data.transactionHash);
                  const escrowTransactionExplorerUrl = getExplorerTxUrl(item.data.escrowTransactionHash);

                  return (
                    <tr
                      key={item.id}
                      className={`border-b border-slate-800/80 align-top transition-all duration-500 ${
                        isHighlighted
                          ? "animate-pulse bg-emerald-500/10 shadow-[inset_0_0_0_1px_rgba(52,211,153,0.32)]"
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
                          <span className="mt-1 inline-flex rounded-md border border-emerald-400/40 bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-100">
                            NEW
                          </span>
                        )}
                      </td>

                      <td className="px-3 py-3">
                        <div className="flex flex-wrap items-center gap-1">
                          <span className="rounded-full border border-emerald-300/65 bg-emerald-500/22 px-2 py-1 text-xs font-semibold text-emerald-50">
                            {toLabel}
                          </span>
                          <span
                            className={`rounded-full border px-2 py-1 text-xs font-medium ${
                              settlementRefReady
                                ? "border-cyan-300/55 bg-cyan-500/16 text-cyan-100"
                                : "border-amber-300/55 bg-amber-500/16 text-amber-100"
                            }`}
                          >
                            {settlementRefReady ? "참조확인" : "참조대기"}
                          </span>
                        </div>
                        <div className="mt-2 text-xs text-slate-400">
                          이전 상태: <span className="text-slate-300">{fromLabel}</span>
                        </div>
                      </td>

                      <td className="px-3 py-3 text-right">
                        <div className="text-xl font-semibold leading-tight text-emerald-200">
                          {formatUsdt(item.data.amountUsdt)} USDT
                        </div>
                        <div className="mt-1 text-sm text-slate-300">
                          {formatKrw(item.data.amountKrw)} KRW
                        </div>
                      </td>

                      <td className="px-3 py-3">
                        <div className="rounded-lg border border-emerald-500/35 bg-emerald-500/10 px-2.5 py-2">
                          <p className="text-[10px] uppercase tracking-[0.1em] text-emerald-300/90">Settlement TX</p>
                          {transactionExplorerUrl ? (
                            <a
                              href={transactionExplorerUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(event) => {
                                event.preventDefault();
                                openExplorerPopup(transactionExplorerUrl);
                              }}
                              className="mt-1 block break-all font-mono text-[12px] leading-5 text-emerald-50 underline decoration-emerald-300/45 underline-offset-2 transition hover:text-emerald-100 hover:decoration-emerald-100"
                              title={item.data.transactionHash || ""}
                            >
                              {formatReadableHash(item.data.transactionHash)}
                            </a>
                          ) : (
                            <p className="mt-1 break-all font-mono text-[12px] leading-5 text-emerald-50">-</p>
                          )}
                        </div>
                        <div className="mt-2 rounded-lg border border-blue-500/35 bg-blue-500/10 px-2.5 py-2">
                          <p className="text-[10px] uppercase tracking-[0.1em] text-blue-200/90">Escrow TX</p>
                          {escrowTransactionExplorerUrl ? (
                            <a
                              href={escrowTransactionExplorerUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(event) => {
                                event.preventDefault();
                                openExplorerPopup(escrowTransactionExplorerUrl);
                              }}
                              className="mt-1 block break-all font-mono text-[12px] leading-5 text-blue-100 underline decoration-blue-300/45 underline-offset-2 transition hover:text-blue-50 hover:decoration-blue-100"
                              title={item.data.escrowTransactionHash || ""}
                            >
                              {formatReadableHash(item.data.escrowTransactionHash)}
                            </a>
                          ) : (
                            <p className="mt-1 break-all font-mono text-[12px] leading-5 text-blue-100">-</p>
                          )}
                        </div>
                      </td>

                      <td className="px-3 py-3">
                        <div className="flex flex-col">
                          <span className="text-slate-200">{maskName(item.data.buyerName)}</span>
                          <span
                            className="mt-1 font-mono text-[11px] text-emerald-200"
                            title={item.data.buyerWalletAddress || ""}
                          >
                            {formatShortWalletAddress(item.data.buyerWalletAddress)}
                          </span>
                          <span className="mt-1 font-mono text-[11px] text-slate-400">
                            {maskAccountNumber(item.data.buyerAccountNumber)}
                          </span>
                        </div>
                      </td>

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
                        <div className="font-mono text-xs text-emerald-200">TID: {item.data.tradeId || "-"}</div>
                        <div className="mt-1 font-mono text-[11px] text-slate-400">OID: {item.data.orderId || "-"}</div>
                        <div className="mt-1 font-mono text-[11px] text-slate-400">Queue: {item.data.queueId || "-"}</div>
                        <div className="mt-1 font-mono text-[11px] text-slate-500">Mined: {item.data.minedAt || "-"}</div>
                        <div className="mt-1 font-mono text-[11px] text-slate-500">Source: {item.data.source || "-"}</div>
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
