"use client";

import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as Ably from "ably";
import { createPortal } from "react-dom";

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

type JackpotBurst = {
  id: string;
  amountUsdt: number;
  storeLabel: string;
};

const MAX_EVENTS = 150;
const RESYNC_LIMIT = 120;
const RESYNC_INTERVAL_MS = 12_000;
const NEW_EVENT_HIGHLIGHT_MS = 3_600;
const TIME_AGO_TICK_MS = 5_000;
const JACKPOT_BURST_DURATION_MS = 3_300;
const JACKPOT_MAX_ACTIVE_BURSTS = 3;
const JACKPOT_TRIGGERED_EVENT_CACHE_LIMIT = 700;
const PARTY_CONFETTI_COUNT = 72;
const PARTY_STREAMER_COUNT = 16;
const PARTY_FIREWORK_COUNT = 6;
const PARTY_FIREWORK_RAY_COUNT = 12;

function isPaymentConfirmedStatus(status: string | null | undefined): boolean {
  return status === "paymentConfirmed";
}

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

function getOptionalText(value: string | null | undefined): string | null {
  const normalized = String(value || "").trim();
  return normalized || null;
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
  const [jackpotBursts, setJackpotBursts] = useState<JackpotBurst[]>([]);
  const [connectionState, setConnectionState] = useState<Ably.ConnectionState>("initialized");
  const [connectionErrorMessage, setConnectionErrorMessage] = useState<string | null>(null);
  const [syncErrorMessage, setSyncErrorMessage] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [cursor, setCursor] = useState<string | null>(null);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [isHydrated, setIsHydrated] = useState(false);

  const cursorRef = useRef<string | null>(null);
  const jackpotTimerMapRef = useRef<Map<string, number>>(new Map());
  const triggeredJackpotEventIdsRef = useRef<string[]>([]);

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

  const registerJackpotTrigger = useCallback((eventId: string): boolean => {
    const cache = triggeredJackpotEventIdsRef.current;
    if (cache.includes(eventId)) {
      return false;
    }

    cache.push(eventId);
    if (cache.length > JACKPOT_TRIGGERED_EVENT_CACHE_LIMIT) {
      cache.splice(0, cache.length - JACKPOT_TRIGGERED_EVENT_CACHE_LIMIT);
    }
    return true;
  }, []);

  const triggerJackpotBurst = useCallback((event: BuyOrderStatusRealtimeEvent, eventId: string) => {
    if (!registerJackpotTrigger(eventId)) {
      return;
    }

    const burstId = `jackpot-${eventId}-${Date.now().toString(36)}`;
    const burst: JackpotBurst = {
      id: burstId,
      amountUsdt: Number(event.amountUsdt || 0),
      storeLabel: event.store?.name || event.store?.code || "Unknown Store",
    };

    setJackpotBursts((previous) => [...previous.slice(-(JACKPOT_MAX_ACTIVE_BURSTS - 1)), burst]);

    const timer = window.setTimeout(() => {
      jackpotTimerMapRef.current.delete(burstId);
      setJackpotBursts((previous) => previous.filter((item) => item.id !== burstId));
    }, JACKPOT_BURST_DURATION_MS);

    jackpotTimerMapRef.current.set(burstId, timer);
  }, [registerJackpotTrigger]);

  const partyConfettiBlueprint = useMemo(() => {
    const colors = [
      "rgba(52, 211, 153, 0.95)",
      "rgba(34, 211, 238, 0.95)",
      "rgba(250, 204, 21, 0.95)",
      "rgba(244, 114, 182, 0.92)",
      "rgba(196, 181, 253, 0.92)",
      "rgba(251, 146, 60, 0.92)",
    ];

    return Array.from({ length: PARTY_CONFETTI_COUNT }, (_, index) => {
      const left = 2 + ((index * 37) % 96);
      const delay = (index % 10) * 90;
      const duration = 1_240 + (index % 9) * 230;
      const sway = (index % 2 === 0 ? 1 : -1) * (18 + ((index * 13) % 68));
      const spin = (index % 2 === 0 ? 1 : -1) * (220 + ((index * 29) % 280));
      const width = 4 + (index % 4) * 2;
      const height = 10 + (index % 3) * 5;

      return {
        left,
        delay,
        duration,
        sway,
        spin,
        width,
        height,
        color: colors[index % colors.length],
      };
    });
  }, []);

  const partyStreamerBlueprint = useMemo(() => {
    const colors = [
      "rgba(45, 212, 191, 0.9)",
      "rgba(56, 189, 248, 0.88)",
      "rgba(250, 204, 21, 0.86)",
      "rgba(244, 114, 182, 0.84)",
    ];

    return Array.from({ length: PARTY_STREAMER_COUNT }, (_, index) => {
      const left = 4 + ((index * 61) % 92);
      const delay = (index % 8) * 75;
      const duration = 950 + (index % 5) * 160;
      const tilt = (index % 2 === 0 ? 1 : -1) * (9 + ((index * 5) % 17));

      return {
        left,
        delay,
        duration,
        tilt,
        color: colors[index % colors.length],
      };
    });
  }, []);

  const partyFireworkBlueprint = useMemo(() => {
    const colors = [
      "rgba(110, 231, 183, 0.95)",
      "rgba(250, 204, 21, 0.95)",
      "rgba(56, 189, 248, 0.95)",
      "rgba(251, 146, 60, 0.92)",
      "rgba(244, 114, 182, 0.9)",
      "rgba(196, 181, 253, 0.92)",
    ];

    return Array.from({ length: PARTY_FIREWORK_COUNT }, (_, index) => {
      const left = 12 + ((index * 19) % 76);
      const top = 14 + ((index * 17) % 30);
      const delay = 90 + index * 120;
      const scale = 0.84 + (index % 3) * 0.2;

      return {
        left,
        top,
        delay,
        scale,
        color: colors[index % colors.length],
      };
    });
  }, []);

  const upsertRealtimeEvents = useCallback(
    (incomingEvents: BuyOrderStatusRealtimeEvent[], options?: { highlightNew?: boolean }) => {
      if (incomingEvents.length === 0) {
        return;
      }

      const highlightNew = options?.highlightNew ?? true;
      const now = Date.now();
      const jackpotCandidates: Array<{ eventId: string; event: BuyOrderStatusRealtimeEvent }> = [];

      setEvents((previousEvents) => {
        const map = new Map(previousEvents.map((item) => [item.id, item]));

        for (const incomingEvent of incomingEvents) {
          const nextId =
            incomingEvent.eventId ||
            incomingEvent.cursor ||
            `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

          const existing = map.get(nextId);

          if (existing) {
            const previousWasPaymentConfirmed = isPaymentConfirmedStatus(existing.data.statusTo);
            const nextIsPaymentConfirmed = isPaymentConfirmedStatus(incomingEvent.statusTo);
            if (highlightNew && nextIsPaymentConfirmed && !previousWasPaymentConfirmed) {
              jackpotCandidates.push({
                eventId: nextId,
                event: incomingEvent,
              });
            }

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

          if (highlightNew && isPaymentConfirmedStatus(incomingEvent.statusTo)) {
            jackpotCandidates.push({
              eventId: nextId,
              event: incomingEvent,
            });
          }
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

      for (const candidate of jackpotCandidates) {
        triggerJackpotBurst(candidate.event, candidate.eventId);
      }
    },
    [triggerJackpotBurst, updateCursor],
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
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNowMs(Date.now());
    }, TIME_AGO_TICK_MS);

    return () => {
      window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    const timerMap = jackpotTimerMapRef.current;
    return () => {
      for (const timer of timerMap.values()) {
        window.clearTimeout(timer);
      }
      timerMap.clear();
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

  const jackpotOverlayLayer =
    isHydrated && typeof document !== "undefined"
      ? createPortal(
          jackpotBursts.map((burst) => (
            <div key={burst.id} className="jackpot-overlay pointer-events-none fixed inset-0 z-[2500]">
              <div className="party-backdrop" />
              <div className="party-flash" />

              <div className="party-streamers">
                {partyStreamerBlueprint.map((streamer, index) => (
                  <span
                    key={`${burst.id}-streamer-${index}`}
                    className="party-streamer"
                    style={
                      {
                        left: `${streamer.left}%`,
                        animationDelay: `${streamer.delay}ms`,
                        animationDuration: `${streamer.duration}ms`,
                        "--stream-tilt": `${streamer.tilt}deg`,
                        "--stream-color": streamer.color,
                      } as React.CSSProperties
                    }
                  />
                ))}
              </div>

              <div className="party-fireworks">
                {partyFireworkBlueprint.map((firework, fireworkIndex) => (
                  <span
                    key={`${burst.id}-firework-${fireworkIndex}`}
                    className="party-firework"
                    style={
                      {
                        left: `${firework.left}%`,
                        top: `${firework.top}%`,
                        animationDelay: `${firework.delay}ms`,
                        "--firework-scale": String(firework.scale),
                        "--firework-color": firework.color,
                      } as React.CSSProperties
                    }
                  >
                    {Array.from({ length: PARTY_FIREWORK_RAY_COUNT }).map((_, rayIndex) => (
                      <i
                        key={`${burst.id}-firework-${fireworkIndex}-ray-${rayIndex}`}
                        className="party-firework-ray"
                        style={{ transform: `rotate(${(360 / PARTY_FIREWORK_RAY_COUNT) * rayIndex}deg)` }}
                      />
                    ))}
                  </span>
                ))}
              </div>

              <div className="party-confetti">
                {partyConfettiBlueprint.map((particle, index) => (
                  <span
                    key={`${burst.id}-confetti-${index}`}
                    className="party-confetti-piece"
                    style={
                      {
                        left: `${particle.left}%`,
                        animationDelay: `${particle.delay}ms`,
                        animationDuration: `${particle.duration}ms`,
                        width: `${particle.width}px`,
                        height: `${particle.height}px`,
                        background: particle.color,
                        "--confetti-sway": `${particle.sway}px`,
                        "--confetti-spin": `${particle.spin}deg`,
                      } as React.CSSProperties
                    }
                  />
                ))}
              </div>

              <div className="party-center">
                <p className="party-title">PAYMENT CONFIRMED</p>
                <p className="party-subtitle">{formatUsdt(burst.amountUsdt)} USDT · {burst.storeLabel}</p>
              </div>
            </div>
          )),
          document.body,
        )
      : null;

  return (
    <main className="w-full max-w-[1800px] space-y-5 pt-20 text-slate-100">
      <RealtimeTopNav lang={lang} current="buyorder" />
      {jackpotOverlayLayer}

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
          <div className="mt-3 rounded-xl border border-cyan-400/45 bg-cyan-500/10 px-3 py-3 shadow-[inset_0_0_24px_rgba(34,211,238,0.12)]">
            <p className="text-[11px] uppercase tracking-[0.1em] text-cyan-300/90">USDT Total</p>
            <p className="mt-1 text-3xl font-bold leading-none tabular-nums text-cyan-100 drop-shadow-[0_0_12px_rgba(34,211,238,0.3)]">
              {formatUsdt(summary.totalUsdt)}
              <span className="ml-1 text-base font-semibold text-cyan-200">USDT</span>
            </p>
          </div>
          <div className="mt-3 rounded-lg border border-slate-700/80 bg-slate-950/70 px-3 py-2">
            <p className="text-[11px] uppercase tracking-[0.1em] text-slate-400">KRW Total</p>
            <p className="mt-1 text-lg font-semibold tabular-nums text-slate-200">
              {formatKrw(summary.totalKrw)} KRW
            </p>
          </div>
          <div className="mt-4 rounded-xl border border-slate-700/80 bg-slate-950/70 p-3 text-xs text-slate-400">
            이벤트 기준 합계이며 정산 데이터와 다를 수 있습니다.
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-700/80 bg-slate-900/75 shadow-lg shadow-black/20">
          <div className="border-b border-slate-700/80 px-4 py-3">
            <p className="font-semibold text-slate-100">실시간 상태 변경</p>
            <p className="text-xs text-slate-400">최신 이벤트 순</p>
          </div>

          <div className="space-y-2 p-3 md:hidden">
            {sortedEvents.length === 0 && (
              <div className="rounded-xl border border-slate-700/80 bg-slate-950/70 px-3 py-8 text-center text-sm text-slate-500">
                아직 수신된 이벤트가 없습니다.
              </div>
            )}

            {sortedEvents.map((item) => {
              const fromLabel = item.data.statusFrom ? getStatusLabel(item.data.statusFrom) : "초기";
              const toLabel = getStatusLabel(item.data.statusTo);
              const isHighlighted = item.highlightUntil > Date.now();
              const isJackpotEvent = isPaymentConfirmedStatus(item.data.statusTo);
              const timeInfo = getRelativeTimeInfo(item.data.publishedAt || item.receivedAt, nowMs);
              const detailTradeId = getOptionalText(item.data.tradeId);
              const detailOrderId = getOptionalText(item.data.orderId);
              const detailSource = getOptionalText(item.data.source);
              const detailTxHash = getOptionalText(item.data.transactionHash);
              const detailEscrowTxHash = getOptionalText(item.data.escrowTransactionHash);
              const detailReason = getOptionalText(item.data.reason);
              const hasMobileDetails = Boolean(
                detailTradeId ||
                  detailOrderId ||
                  detailSource ||
                  detailTxHash ||
                  detailEscrowTxHash ||
                  detailReason,
              );

              return (
                <article
                  key={`mobile-${item.id}`}
                  className={`rounded-xl border p-3 transition-all duration-500 ${
                    isHighlighted
                      ? isJackpotEvent
                        ? "jackpot-card-highlight border-emerald-300/55 bg-emerald-500/16 shadow-[inset_0_0_0_1px_rgba(110,231,183,0.35)]"
                        : "animate-pulse border-cyan-400/40 bg-cyan-500/10 shadow-[inset_0_0_0_1px_rgba(34,211,238,0.28)]"
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
                      <div className="text-base font-semibold leading-tight tabular-nums text-cyan-200">
                        {formatUsdt(item.data.amountUsdt)}
                        <span className="ml-1 text-xs font-semibold text-cyan-100">USDT</span>
                      </div>
                      <div className="mt-1 text-[11px] tabular-nums text-slate-400">
                        {formatKrw(item.data.amountKrw)} KRW
                      </div>
                    </div>
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-1">
                    <span className={`rounded-full px-2 py-1 text-xs font-medium ${getStatusClassName(item.data.statusFrom)}`}>
                      {fromLabel}
                    </span>
                    <span className="text-slate-500">→</span>
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-medium ${getStatusClassName(
                        item.data.statusTo,
                      )} ${isJackpotEvent ? "jackpot-status-pill" : ""}`}
                    >
                      {toLabel}
                    </span>
                    {isHighlighted && (
                      <span
                        className="ml-auto rounded-md border border-cyan-400/40 bg-cyan-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-cyan-100"
                      >
                        NEW
                      </span>
                    )}
                  </div>

                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    <div className="rounded-lg border border-slate-700/70 bg-slate-900/60 px-2.5 py-2">
                      <p className="text-[10px] uppercase tracking-[0.08em] text-slate-400">구매자</p>
                      <p className="mt-1 text-sm text-slate-100">{maskName(item.data.buyerName)}</p>
                      <p className="mt-1 font-mono text-[11px] text-cyan-200" title={item.data.buyerWalletAddress || ""}>
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

                  {hasMobileDetails && (
                    <div className="mt-2 rounded-lg border border-slate-700/70 bg-slate-900/60 px-2.5 py-2 text-[11px]">
                      {detailTradeId ? (
                        <p className="font-mono text-cyan-200">TID: {detailTradeId}</p>
                      ) : null}
                      {detailOrderId ? (
                        <p className="mt-1 font-mono text-slate-400">OID: {detailOrderId}</p>
                      ) : null}
                      {detailSource ? (
                        <p className="mt-1 font-mono text-slate-500">Source: {detailSource}</p>
                      ) : null}
                      {detailTxHash ? (
                        <p className="mt-1 font-mono text-violet-200" title={detailTxHash}>
                          TX: {formatShortHash(detailTxHash)}
                        </p>
                      ) : null}
                      {detailEscrowTxHash ? (
                        <p className="mt-1 font-mono text-blue-200" title={detailEscrowTxHash}>
                          Escrow TX: {formatShortHash(detailEscrowTxHash)}
                        </p>
                      ) : null}
                      {detailReason ? (
                        <p className="mt-1 truncate text-rose-300">{detailReason}</p>
                      ) : null}
                    </div>
                  )}
                </article>
              );
            })}
          </div>

          <div className="hidden overflow-x-auto md:block">
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
                  const isJackpotEvent = isPaymentConfirmedStatus(item.data.statusTo);
                  const timeInfo = getRelativeTimeInfo(item.data.publishedAt || item.receivedAt, nowMs);
                  const detailTradeId = getOptionalText(item.data.tradeId);
                  const detailOrderId = getOptionalText(item.data.orderId);
                  const detailSource = getOptionalText(item.data.source);
                  const detailTxHash = getOptionalText(item.data.transactionHash);
                  const detailEscrowTxHash = getOptionalText(item.data.escrowTransactionHash);
                  const detailQueueId = getOptionalText(item.data.queueId);
                  const detailMinedAt = getOptionalText(item.data.minedAt);
                  const detailReason = getOptionalText(item.data.reason);

                  return (
                    <tr
                      key={item.id}
                      className={`border-b border-slate-800/80 align-top transition-all duration-500 ${
                        isHighlighted
                          ? isJackpotEvent
                            ? "jackpot-row-highlight bg-emerald-500/12 shadow-[inset_0_0_0_1px_rgba(110,231,183,0.35)]"
                            : "animate-pulse bg-cyan-500/10 shadow-[inset_0_0_0_1px_rgba(34,211,238,0.32)]"
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
                          <span
                            className="mt-1 inline-flex rounded-md border border-cyan-400/40 bg-cyan-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-cyan-100"
                          >
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
                          <span
                            className={`rounded-full px-2 py-1 text-xs font-medium ${getStatusClassName(
                              item.data.statusTo,
                            )} ${isJackpotEvent ? "jackpot-status-pill" : ""}`}
                          >
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
                        {detailTradeId ? (
                          <div className="font-mono text-xs text-cyan-200">TID: {detailTradeId}</div>
                        ) : null}
                        {detailOrderId ? (
                          <div className="mt-1 font-mono text-[11px] text-slate-400">OID: {detailOrderId}</div>
                        ) : null}
                        {detailSource ? (
                          <div className="mt-1 font-mono text-[11px] text-slate-500">Source: {detailSource}</div>
                        ) : null}
                        {detailTxHash ? (
                          <div className="mt-1 font-mono text-[11px] text-violet-200" title={detailTxHash}>
                            TX: {formatShortHash(detailTxHash)}
                          </div>
                        ) : null}
                        {detailEscrowTxHash ? (
                          <div className="mt-1 font-mono text-[11px] text-blue-200" title={detailEscrowTxHash}>
                            Escrow TX: {formatShortHash(detailEscrowTxHash)}
                          </div>
                        ) : null}
                        {detailQueueId ? (
                          <div className="mt-1 font-mono text-[11px] text-slate-400">Queue: {detailQueueId}</div>
                        ) : null}
                        {detailMinedAt ? (
                          <div className="mt-1 font-mono text-[11px] text-slate-500">Mined: {detailMinedAt}</div>
                        ) : null}
                        {detailReason ? (
                          <div className="mt-1 truncate text-xs text-rose-300">{detailReason}</div>
                        ) : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>
      <style jsx>{`
        .jackpot-overlay {
          animation: jackpotOverlayFade ${JACKPOT_BURST_DURATION_MS}ms ease-out both;
          overflow: hidden;
          isolation: isolate;
        }

        .party-backdrop {
          position: absolute;
          inset: 0;
          background: radial-gradient(
              circle at 50% 38%,
              rgba(16, 185, 129, 0.24) 0%,
              rgba(56, 189, 248, 0.2) 30%,
              rgba(15, 23, 42, 0.5) 68%,
              rgba(2, 6, 23, 0.66) 100%
            ),
            linear-gradient(
              125deg,
              rgba(52, 211, 153, 0.16) 0%,
              rgba(250, 204, 21, 0.14) 38%,
              rgba(244, 114, 182, 0.14) 70%,
              rgba(56, 189, 248, 0.16) 100%
            );
        }

        .party-flash {
          position: absolute;
          inset: -30% -20%;
          background: radial-gradient(circle, rgba(255, 255, 255, 0.62) 0%, rgba(255, 255, 255, 0) 64%);
          mix-blend-mode: screen;
          opacity: 0;
          animation: partyFlashPulse 760ms ease-out both;
        }

        .party-streamers {
          position: absolute;
          inset: 0;
          overflow: hidden;
        }

        .party-streamer {
          position: absolute;
          top: -124vh;
          width: 2px;
          height: 190vh;
          opacity: 0;
          transform: translateX(-50%) rotate(var(--stream-tilt));
          transform-origin: top center;
          background: linear-gradient(
            to bottom,
            rgba(255, 255, 255, 0.85) 0%,
            var(--stream-color) 18%,
            rgba(15, 23, 42, 0) 100%
          );
          box-shadow: 0 0 20px rgba(255, 255, 255, 0.16);
          animation: partyStreamerDrop cubic-bezier(0.28, 0.86, 0.38, 1) both;
        }

        .party-fireworks {
          position: absolute;
          inset: 0;
        }

        .party-firework {
          position: absolute;
          width: 0;
          height: 0;
          opacity: 0;
          transform: translate(-50%, -50%) scale(var(--firework-scale));
          animation: partyFireworkBloom 820ms ease-out both;
        }

        .party-firework-ray {
          position: absolute;
          display: block;
          left: -2px;
          top: -2px;
          width: 4px;
          height: 92px;
          opacity: 0;
          transform-origin: center 2px;
          border-radius: 9999px;
          background: linear-gradient(
            to bottom,
            rgba(255, 255, 255, 0.95) 0%,
            var(--firework-color) 34%,
            rgba(15, 23, 42, 0) 100%
          );
          animation: partyFireworkRay 820ms ease-out both;
          animation-delay: inherit;
        }

        .party-confetti {
          position: absolute;
          inset: 0;
          overflow: hidden;
        }

        .party-confetti-piece {
          position: absolute;
          top: -14vh;
          border-radius: 2px;
          opacity: 0;
          box-shadow: 0 0 8px rgba(255, 255, 255, 0.45);
          animation-name: partyConfettiFall;
          animation-timing-function: cubic-bezier(0.2, 0.74, 0.32, 1);
          animation-fill-mode: both;
        }

        .party-center {
          position: absolute;
          left: 50%;
          top: 11%;
          width: min(92vw, 640px);
          padding: 0.88rem 1.2rem;
          border-radius: 9999px;
          text-align: center;
          transform: translateX(-50%);
          border: 1px solid rgba(236, 253, 245, 0.5);
          background: linear-gradient(
            145deg,
            rgba(15, 118, 110, 0.66) 0%,
            rgba(12, 74, 110, 0.68) 50%,
            rgba(88, 28, 135, 0.58) 100%
          );
          backdrop-filter: blur(8px);
          box-shadow: 0 0 50px rgba(16, 185, 129, 0.26), 0 0 60px rgba(250, 204, 21, 0.2);
          animation: partyCenterRise 880ms cubic-bezier(0.22, 1.14, 0.33, 1) both;
        }

        .party-title {
          margin: 0;
          line-height: 1;
          font-size: clamp(1.25rem, 3.9vw, 2.2rem);
          letter-spacing: 0.12em;
          font-weight: 900;
          color: transparent;
          background-image: linear-gradient(
            95deg,
            rgba(250, 204, 21, 1) 0%,
            rgba(255, 255, 255, 0.98) 34%,
            rgba(110, 231, 183, 0.98) 66%,
            rgba(34, 211, 238, 0.98) 100%
          );
          background-size: 210% 100%;
          -webkit-background-clip: text;
          background-clip: text;
          text-shadow: 0 0 18px rgba(250, 204, 21, 0.28);
          animation: partyTitleSheen 920ms linear infinite;
        }

        .party-subtitle {
          margin-top: 0.34rem;
          font-size: clamp(0.72rem, 2.2vw, 0.92rem);
          color: rgba(240, 253, 250, 0.96);
          font-weight: 700;
          letter-spacing: 0.03em;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .jackpot-row-highlight {
          animation: jackpotRowGlow 1.2s ease-in-out infinite;
        }

        .jackpot-card-highlight {
          animation: jackpotCardGlow 1.1s ease-in-out infinite;
        }

        .jackpot-status-pill {
          box-shadow: 0 0 0 1px rgba(16, 185, 129, 0.25), 0 0 16px rgba(16, 185, 129, 0.35);
          animation: jackpotStatusPulse 980ms ease-in-out infinite;
        }

        @keyframes jackpotOverlayFade {
          0% {
            opacity: 0;
          }
          6% {
            opacity: 1;
          }
          88% {
            opacity: 1;
          }
          100% {
            opacity: 0;
          }
        }

        @keyframes partyFlashPulse {
          0% {
            opacity: 0;
            transform: scale(0.72);
          }
          34% {
            opacity: 0.9;
            transform: scale(1);
          }
          100% {
            opacity: 0;
            transform: scale(1.3);
          }
        }

        @keyframes partyStreamerDrop {
          0% {
            opacity: 0;
            transform: translateX(-50%) translateY(-18vh) rotate(var(--stream-tilt));
          }
          18% {
            opacity: 1;
          }
          100% {
            opacity: 0;
            transform: translateX(-50%) translateY(118vh) rotate(var(--stream-tilt));
          }
        }

        @keyframes partyFireworkBloom {
          0% {
            opacity: 0;
          }
          22% {
            opacity: 1;
          }
          100% {
            opacity: 0;
          }
        }

        @keyframes partyFireworkRay {
          0% {
            opacity: 0;
            height: 30px;
          }
          26% {
            opacity: 1;
            height: 94px;
          }
          100% {
            opacity: 0;
            height: 138px;
          }
        }

        @keyframes partyConfettiFall {
          0% {
            opacity: 0;
            transform: translate3d(0, -12vh, 0) rotate(0deg);
          }
          14% {
            opacity: 1;
          }
          100% {
            opacity: 0;
            transform: translate3d(var(--confetti-sway), 112vh, 0) rotate(var(--confetti-spin));
          }
        }

        @keyframes partyCenterRise {
          0% {
            opacity: 0;
            transform: translate(-50%, -18px) scale(0.92);
          }
          36% {
            opacity: 1;
            transform: translate(-50%, 0) scale(1.04);
          }
          100% {
            opacity: 1;
            transform: translate(-50%, 0) scale(1);
          }
        }

        @keyframes partyTitleSheen {
          0% {
            background-position: 210% 50%;
          }
          100% {
            background-position: -16% 50%;
          }
        }

        @keyframes jackpotStatusPulse {
          0%,
          100% {
            transform: translateZ(0) scale(1);
          }
          50% {
            transform: translateZ(0) scale(1.06);
          }
        }

        @keyframes jackpotRowGlow {
          0%,
          100% {
            box-shadow: inset 0 0 0 1px rgba(110, 231, 183, 0.3);
          }
          50% {
            box-shadow: inset 0 0 0 1px rgba(110, 231, 183, 0.6), inset 0 0 42px rgba(52, 211, 153, 0.18);
          }
        }

        @keyframes jackpotCardGlow {
          0%,
          100% {
            box-shadow: inset 0 0 0 1px rgba(110, 231, 183, 0.3);
          }
          50% {
            box-shadow: inset 0 0 0 1px rgba(110, 231, 183, 0.62), inset 0 0 30px rgba(52, 211, 153, 0.24);
          }
        }

        @media (max-width: 640px) {
          .party-center {
            top: 8%;
            width: min(95vw, 520px);
            padding: 0.72rem 0.9rem;
            border-radius: 1rem;
          }

          .party-title {
            font-size: clamp(1.08rem, 6vw, 1.5rem);
          }

          .party-subtitle {
            font-size: clamp(0.64rem, 3.2vw, 0.84rem);
          }

          .party-firework-ray {
            height: 74px;
          }

          .party-streamer {
            width: 1.5px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .jackpot-row-highlight,
          .jackpot-card-highlight,
          .jackpot-status-pill {
            animation: none !important;
          }
        }
      `}</style>
    </main>
  );
}
