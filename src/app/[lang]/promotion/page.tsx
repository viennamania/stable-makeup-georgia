"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as Ably from "ably";

import {
  BANKTRANSFER_ABLY_CHANNEL,
  BANKTRANSFER_ABLY_EVENT_NAME,
  BUYORDER_STATUS_ABLY_CHANNEL,
  BUYORDER_STATUS_ABLY_EVENT_NAME,
  type BankTransferDashboardEvent,
  type BuyOrderStatusRealtimeEvent,
} from "@lib/ably/constants";
import { getRelativeTimeInfo, type RelativeTimeTone } from "@lib/realtime/timeAgo";

type BankFeedItem = {
  id: string;
  receivedAt: string;
  data: BankTransferDashboardEvent;
  highlightUntil: number;
};

type BuyFeedItem = {
  id: string;
  receivedAt: string;
  data: BuyOrderStatusRealtimeEvent;
  highlightUntil: number;
};

const MAX_FEED_ITEMS = 36;
const API_SYNC_LIMIT = 80;
const RESYNC_INTERVAL_MS = 12_000;
const NOW_TICK_MS = 1_000;
const NEW_EVENT_HIGHLIGHT_MS = 6_000;

function toTimestamp(value: string | number | null | undefined): number {
  if (value === null || value === undefined) {
    return 0;
  }
  const raw = Date.parse(String(value));
  return Number.isNaN(raw) ? 0 : raw;
}

function getEventTimestamp(primary: string | null | undefined, fallback: string): number {
  return toTimestamp(primary) || toTimestamp(fallback);
}

function updateCursorValue(
  target: { current: string | null },
  nextCursor: string | null | undefined,
): void {
  if (!nextCursor) {
    return;
  }
  if (!target.current || nextCursor > target.current) {
    target.current = nextCursor;
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

function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

function shortenText(
  value: string | null | undefined,
  headLength = 8,
  tailLength = 6,
): string {
  const normalized = String(value || "").trim();
  if (!normalized) {
    return "-";
  }
  if (normalized.length <= headLength + tailLength + 3) {
    return normalized;
  }
  return `${normalized.slice(0, headLength)}...${normalized.slice(-tailLength)}`;
}

function getTransactionTypeLabel(transactionType: string | null | undefined): string {
  if (transactionType === "deposited") {
    return "입금";
  }
  if (transactionType === "withdrawn") {
    return "출금";
  }
  return transactionType || "-";
}

function getTransactionTypeClassName(transactionType: string | null | undefined): string {
  if (transactionType === "deposited") {
    return "border border-emerald-300/60 bg-emerald-400/20 text-emerald-50";
  }
  if (transactionType === "withdrawn") {
    return "border border-rose-300/60 bg-rose-400/20 text-rose-50";
  }
  return "border border-slate-400/60 bg-slate-500/20 text-slate-100";
}

function getBuyStatusLabel(status: string | null | undefined): string {
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
      return status || "-";
  }
}

function getBuyStatusClassName(status: string | null | undefined): string {
  switch (status) {
    case "paymentSettled":
      return "border border-emerald-300/60 bg-emerald-400/20 text-emerald-50";
    case "paymentConfirmed":
      return "border border-emerald-300/60 bg-emerald-400/20 text-emerald-50";
    case "paymentRequested":
      return "border border-amber-300/60 bg-amber-400/20 text-amber-50";
    case "accepted":
      return "border border-sky-300/60 bg-sky-400/20 text-sky-50";
    case "cancelled":
      return "border border-rose-300/60 bg-rose-400/20 text-rose-50";
    default:
      return "border border-slate-400/60 bg-slate-500/20 text-slate-100";
  }
}

function isSettlementBuyEvent(event: BuyOrderStatusRealtimeEvent): boolean {
  const source = String(event.source || "").toLowerCase();
  return (
    event.statusTo === "paymentSettled" ||
    event.statusFrom === "paymentSettled" ||
    source.includes("settlement")
  );
}

function getRelativeTimeBadgeClassName(tone: RelativeTimeTone): string {
  switch (tone) {
    case "live":
      return "animate-pulse border-cyan-200/80 bg-cyan-300/25 text-cyan-50 shadow-[0_0_12px_rgba(34,211,238,0.55)]";
    case "fresh":
      return "border-teal-200/75 bg-teal-300/22 text-teal-50";
    case "recent":
      return "border-sky-200/65 bg-sky-300/18 text-sky-50";
    case "normal":
      return "border-slate-400/60 bg-slate-500/18 text-slate-100";
    default:
      return "border-slate-600/70 bg-slate-800/65 text-slate-400";
  }
}

export default function PromotionPage() {
  const params = useParams();
  const lang = typeof params?.lang === "string" ? params.lang : "ko";

  const [bankEvents, setBankEvents] = useState<BankFeedItem[]>([]);
  const [buyEvents, setBuyEvents] = useState<BuyFeedItem[]>([]);
  const [connectionState, setConnectionState] = useState<Ably.ConnectionState>("initialized");
  const [connectionErrorMessage, setConnectionErrorMessage] = useState<string | null>(null);
  const [syncErrorMessage, setSyncErrorMessage] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [isHeroBursting, setIsHeroBursting] = useState(false);

  const heroBurstTimerRef = useRef<number | null>(null);
  const bankCursorRef = useRef<string | null>(null);
  const buyCursorRef = useRef<string | null>(null);

  const clientId = useMemo(() => {
    return `promotion-${Math.random().toString(36).slice(2, 10)}`;
  }, []);

  const triggerHeroBurst = useCallback(() => {
    setIsHeroBursting(true);
    if (heroBurstTimerRef.current) {
      window.clearTimeout(heroBurstTimerRef.current);
    }
    heroBurstTimerRef.current = window.setTimeout(() => {
      setIsHeroBursting(false);
      heroBurstTimerRef.current = null;
    }, 1_200);
  }, []);

  const upsertBankEvents = useCallback(
    (incomingEvents: BankTransferDashboardEvent[], highlightNew: boolean) => {
      if (incomingEvents.length === 0) {
        return;
      }

      const now = Date.now();
      setBankEvents((previousEvents) => {
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
            getEventTimestamp(right.data.publishedAt, right.receivedAt) -
            getEventTimestamp(left.data.publishedAt, left.receivedAt)
          );
        });

        return merged.slice(0, MAX_FEED_ITEMS);
      });

      for (const incomingEvent of incomingEvents) {
        updateCursorValue(bankCursorRef, incomingEvent.cursor || null);
      }

      if (highlightNew) {
        triggerHeroBurst();
      }
    },
    [triggerHeroBurst],
  );

  const upsertBuyEvents = useCallback(
    (incomingEvents: BuyOrderStatusRealtimeEvent[], highlightNew: boolean) => {
      if (incomingEvents.length === 0) {
        return;
      }

      const now = Date.now();
      setBuyEvents((previousEvents) => {
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
            getEventTimestamp(right.data.publishedAt, right.receivedAt) -
            getEventTimestamp(left.data.publishedAt, left.receivedAt)
          );
        });

        return merged.slice(0, MAX_FEED_ITEMS);
      });

      for (const incomingEvent of incomingEvents) {
        updateCursorValue(buyCursorRef, incomingEvent.cursor || null);
      }

      if (highlightNew) {
        triggerHeroBurst();
      }
    },
    [triggerHeroBurst],
  );

  const syncBankEvents = useCallback(
    async (sinceOverride?: string | null) => {
      const since = sinceOverride ?? bankCursorRef.current;
      const searchParams = new URLSearchParams({
        limit: String(API_SYNC_LIMIT),
        public: "1",
      });
      if (since) {
        searchParams.set("since", since);
      }

      let lastError: string | null = null;
      for (let attempt = 1; attempt <= 3; attempt += 1) {
        try {
          const response = await fetch(`/api/realtime/banktransfer/events?${searchParams.toString()}`, {
            method: "GET",
            cache: "no-store",
          });

          if (!response.ok) {
            const text = await response.text();
            throw new Error(`banktransfer sync failed (${response.status}) ${text}`);
          }

          const data = await response.json();
          const incomingEvents = Array.isArray(data.events)
            ? (data.events as BankTransferDashboardEvent[])
            : [];

          upsertBankEvents(incomingEvents, Boolean(since));
          updateCursorValue(
            bankCursorRef,
            typeof data.nextCursor === "string" ? data.nextCursor : null,
          );
          return;
        } catch (error) {
          lastError = error instanceof Error ? error.message : "banktransfer sync failed";
          if (attempt < 3) {
            await new Promise((resolve) => setTimeout(resolve, 200 * attempt));
          }
        }
      }

      throw new Error(lastError || "banktransfer sync failed");
    },
    [upsertBankEvents],
  );

  const syncBuyEvents = useCallback(
    async (sinceOverride?: string | null) => {
      const since = sinceOverride ?? buyCursorRef.current;
      const searchParams = new URLSearchParams({
        limit: String(API_SYNC_LIMIT),
        public: "1",
      });
      if (since) {
        searchParams.set("since", since);
      }

      let lastError: string | null = null;
      for (let attempt = 1; attempt <= 3; attempt += 1) {
        try {
          const response = await fetch(`/api/realtime/buyorder/events?${searchParams.toString()}`, {
            method: "GET",
            cache: "no-store",
          });

          if (!response.ok) {
            const text = await response.text();
            throw new Error(`buyorder sync failed (${response.status}) ${text}`);
          }

          const data = await response.json();
          const incomingEvents = Array.isArray(data.events)
            ? (data.events as BuyOrderStatusRealtimeEvent[])
            : [];

          upsertBuyEvents(incomingEvents, Boolean(since));
          updateCursorValue(
            buyCursorRef,
            typeof data.nextCursor === "string" ? data.nextCursor : null,
          );
          return;
        } catch (error) {
          lastError = error instanceof Error ? error.message : "buyorder sync failed";
          if (attempt < 3) {
            await new Promise((resolve) => setTimeout(resolve, 200 * attempt));
          }
        }
      }

      throw new Error(lastError || "buyorder sync failed");
    },
    [upsertBuyEvents],
  );

  const syncAllEvents = useCallback(
    async (forceFullSync = false) => {
      setIsSyncing(true);
      try {
        await Promise.all([
          syncBankEvents(forceFullSync ? null : undefined),
          syncBuyEvents(forceFullSync ? null : undefined),
        ]);
        setSyncErrorMessage(null);
      } catch (error) {
        setSyncErrorMessage(error instanceof Error ? error.message : "재동기화에 실패했습니다.");
      } finally {
        setIsSyncing(false);
      }
    },
    [syncBankEvents, syncBuyEvents],
  );

  useEffect(() => {
    const realtime = new Ably.Realtime({
      authUrl: `/api/realtime/ably-token?public=1&clientId=${clientId}`,
    });

    const bankChannel = realtime.channels.get(BANKTRANSFER_ABLY_CHANNEL);
    const buyChannel = realtime.channels.get(BUYORDER_STATUS_ABLY_CHANNEL);

    const onConnectionStateChange = (stateChange: Ably.ConnectionStateChange) => {
      setConnectionState(stateChange.current);
      if (stateChange.reason) {
        setConnectionErrorMessage(stateChange.reason.message || "Ably connection error");
      } else {
        setConnectionErrorMessage(null);
      }

      if (stateChange.current === "connected") {
        void syncAllEvents(false);
      }
    };

    const onBankMessage = (message: Ably.Message) => {
      const data = message.data as BankTransferDashboardEvent;
      upsertBankEvents(
        [
          {
            ...data,
            eventId: data.eventId || String(message.id || ""),
          },
        ],
        true,
      );
    };

    const onBuyMessage = (message: Ably.Message) => {
      const data = message.data as BuyOrderStatusRealtimeEvent;
      upsertBuyEvents(
        [
          {
            ...data,
            eventId: data.eventId || String(message.id || ""),
          },
        ],
        true,
      );
    };

    realtime.connection.on(onConnectionStateChange);
    void bankChannel.subscribe(BANKTRANSFER_ABLY_EVENT_NAME, onBankMessage);
    void buyChannel.subscribe(BUYORDER_STATUS_ABLY_EVENT_NAME, onBuyMessage);

    return () => {
      bankChannel.unsubscribe(BANKTRANSFER_ABLY_EVENT_NAME, onBankMessage);
      buyChannel.unsubscribe(BUYORDER_STATUS_ABLY_EVENT_NAME, onBuyMessage);
      realtime.connection.off(onConnectionStateChange);
      realtime.close();
    };
  }, [clientId, syncAllEvents, upsertBankEvents, upsertBuyEvents]);

  useEffect(() => {
    void syncAllEvents(true);

    const timer = window.setInterval(() => {
      void syncAllEvents(false);
    }, RESYNC_INTERVAL_MS);

    return () => {
      window.clearInterval(timer);
    };
  }, [syncAllEvents]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNowMs(Date.now());
    }, NOW_TICK_MS);

    return () => {
      window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    const now = Date.now();
    const candidates = [...bankEvents, ...buyEvents]
      .map((item) => item.highlightUntil)
      .filter((until) => until > now);

    if (candidates.length === 0) {
      return;
    }

    const nextExpiryAt = Math.min(...candidates);
    const waitMs = Math.max(90, nextExpiryAt - now + 20);
    const timer = window.setTimeout(() => {
      const current = Date.now();
      setBankEvents((previousEvents) =>
        previousEvents.map((item) => {
          if (item.highlightUntil > current || item.highlightUntil === 0) {
            return item;
          }
          return {
            ...item,
            highlightUntil: 0,
          };
        }),
      );
      setBuyEvents((previousEvents) =>
        previousEvents.map((item) => {
          if (item.highlightUntil > current || item.highlightUntil === 0) {
            return item;
          }
          return {
            ...item,
            highlightUntil: 0,
          };
        }),
      );
    }, waitMs);

    return () => {
      window.clearTimeout(timer);
    };
  }, [bankEvents, buyEvents]);

  useEffect(() => {
    return () => {
      if (heroBurstTimerRef.current) {
        window.clearTimeout(heroBurstTimerRef.current);
      }
    };
  }, []);

  const sortedBankEvents = useMemo(() => {
    return [...bankEvents].sort((left, right) => {
      return (
        getEventTimestamp(right.data.publishedAt, right.receivedAt) -
        getEventTimestamp(left.data.publishedAt, left.receivedAt)
      );
    });
  }, [bankEvents]);

  const sortedBuyEvents = useMemo(() => {
    return [...buyEvents].sort((left, right) => {
      return (
        getEventTimestamp(right.data.publishedAt, right.receivedAt) -
        getEventTimestamp(left.data.publishedAt, left.receivedAt)
      );
    });
  }, [buyEvents]);

  const settlementBuyEvents = useMemo(() => {
    return sortedBuyEvents.filter((item) => isSettlementBuyEvent(item.data));
  }, [sortedBuyEvents]);

  const latestBank = sortedBankEvents[0];
  const latestBuy = sortedBuyEvents[0];
  const latestSettlement = settlementBuyEvents[0];
  const latestSettlementTimeInfo = latestSettlement
    ? getRelativeTimeInfo(latestSettlement.data.publishedAt || latestSettlement.receivedAt, nowMs)
    : null;
  const isSettlementCtaHot = Boolean(
    latestSettlement && latestSettlement.highlightUntil > nowMs,
  );

  const summary = useMemo(() => {
    let depositedAmount = 0;
    let depositedCount = 0;
    let confirmedCount = 0;
    let pendingCount = 0;
    let totalUsdt = 0;
    let settlementCount = 0;
    let settlementUsdt = 0;
    let settlementKrw = 0;

    for (const item of sortedBankEvents) {
      if (item.data.transactionType === "deposited") {
        depositedAmount += Number(item.data.amount || 0);
        depositedCount += 1;
      }
    }

    for (const item of sortedBuyEvents) {
      totalUsdt += Number(item.data.amountUsdt || 0);
      if (item.data.statusTo === "paymentConfirmed") {
        confirmedCount += 1;
      }
      if (
        item.data.statusTo === "ordered" ||
        item.data.statusTo === "accepted" ||
        item.data.statusTo === "paymentRequested"
      ) {
        pendingCount += 1;
      }

      if (isSettlementBuyEvent(item.data)) {
        settlementCount += 1;
      settlementUsdt += Number(item.data.amountUsdt || 0);
      settlementKrw += Number(item.data.amountKrw || 0);
    }
  }

    const settlementCountRatio =
      sortedBuyEvents.length > 0 ? Math.round((settlementCount / sortedBuyEvents.length) * 1000) / 10 : 0;
    const settlementUsdtRatio =
      totalUsdt > 0 ? Math.round((settlementUsdt / totalUsdt) * 1000) / 10 : 0;

    return {
      totalEvents: sortedBankEvents.length + sortedBuyEvents.length,
      depositedAmount,
      depositedCount,
      confirmedCount,
      pendingCount,
      totalUsdt,
      settlementCount,
      settlementUsdt,
      settlementKrw,
      settlementCountRatio,
      settlementUsdtRatio,
    };
  }, [sortedBankEvents, sortedBuyEvents]);

  const latestTimestamp = useMemo(() => {
    const bankTime = latestBank ? getEventTimestamp(latestBank.data.publishedAt, latestBank.receivedAt) : 0;
    const buyTime = latestBuy ? getEventTimestamp(latestBuy.data.publishedAt, latestBuy.receivedAt) : 0;
    return Math.max(bankTime, buyTime);
  }, [latestBank, latestBuy]);

  const latestTimeInfo = getRelativeTimeInfo(latestTimestamp || null, nowMs);

  const tickerTexts = useMemo(() => {
    const merged = [
      ...sortedBankEvents.slice(0, 8).map((item) => ({
        id: `bank-${item.id}`,
        timestamp: getEventTimestamp(item.data.publishedAt, item.receivedAt),
        text: `[Bank] ${getTransactionTypeLabel(item.data.transactionType)} ${formatKrw(item.data.amount)} KRW ${
          item.data.store?.name || item.data.storecode || "Unknown Store"
        }`,
      })),
      ...sortedBuyEvents.slice(0, 8).map((item) => ({
        id: `buy-${item.id}`,
        timestamp: getEventTimestamp(item.data.publishedAt, item.receivedAt),
        text: `[BuyOrder] ${getBuyStatusLabel(item.data.statusTo)} ${formatUsdt(item.data.amountUsdt)} USDT ${
          item.data.store?.name || "Unknown Store"
        }`,
      })),
      ...settlementBuyEvents.slice(0, 6).map((item) => ({
        id: `settlement-${item.id}`,
        timestamp: getEventTimestamp(item.data.publishedAt, item.receivedAt),
        text: `[Settlement] ${formatUsdt(item.data.amountUsdt)} USDT / ${
          item.data.store?.name || "Unknown Store"
        }`,
      })),
    ].sort((left, right) => right.timestamp - left.timestamp);

    if (merged.length === 0) {
      return ["실시간 이벤트 대기 중입니다. 잠시 후 자동으로 갱신됩니다."];
    }

    const labels = merged.map((item) => item.text);
    return [...labels, ...labels];
  }, [sortedBankEvents, sortedBuyEvents, settlementBuyEvents]);

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#030711] text-slate-100">
      <div className="pointer-events-none absolute inset-0">
        <div className="promo-grid absolute inset-0 opacity-55" />
        <div className="promo-orb promo-orb-a" />
        <div className="promo-orb promo-orb-b" />
        <div className="promo-orb promo-orb-c" />
      </div>

      <section className="relative mx-auto w-full max-w-[1520px] space-y-5 px-4 py-6 sm:px-6 lg:px-10">
        <header
          className={`relative overflow-hidden rounded-[28px] border border-emerald-300/30 bg-slate-950/85 p-6 shadow-[0_26px_84px_-36px_rgba(16,185,129,0.7)] backdrop-blur ${isHeroBursting ? "promo-hero-burst" : ""}`}
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_14%_20%,rgba(16,185,129,0.3),rgba(2,6,23,0)_45%),radial-gradient(circle_at_85%_28%,rgba(34,211,238,0.2),rgba(2,6,23,0)_42%)]" />

          <nav className="relative flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="promo-live-dot h-2.5 w-2.5 rounded-full bg-emerald-300" />
              <span className="text-xs uppercase tracking-[0.22em] text-emerald-100/95">
                VASP Operated Realtime Hub
              </span>
              <span className="rounded-full border border-emerald-300/65 bg-emerald-500/20 px-2 py-0.5 text-[11px] font-semibold text-emerald-50">
                VASP 운영
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href={`/${lang}/realtime-banktransfer`}
                className="rounded-xl border border-slate-600/70 bg-slate-900/70 px-3 py-1.5 text-sm text-slate-200 transition hover:border-cyan-300/70 hover:text-cyan-100"
              >
                Banktransfer
              </Link>
              <Link
                href={`/${lang}/realtime-buyorder`}
                className="rounded-xl border border-slate-600/70 bg-slate-900/70 px-3 py-1.5 text-sm text-slate-200 transition hover:border-cyan-300/70 hover:text-cyan-100"
              >
                BuyOrder
              </Link>
              <Link
                href={`/${lang}/realtime-settlement`}
                className="rounded-xl border border-emerald-500/65 bg-emerald-500/22 px-3 py-1.5 text-sm font-semibold text-emerald-50 transition hover:border-emerald-300/80 hover:bg-emerald-400/28"
              >
                Settlement
              </Link>
            </div>
          </nav>

          <div className="relative mt-5 grid gap-5 lg:grid-cols-[1.2fr_1fr]">
            <div>
              <h1 className="text-3xl font-semibold leading-tight sm:text-4xl">
                <span className="promo-title-shine">VASP 운영</span> 기반 USDT 정산 플랫폼
              </h1>
              <p className="mt-3 max-w-2xl text-sm text-slate-300 sm:text-base">
                본 플랫폼은 VASP 운영 체계 하에서 USDT 정산 이벤트를 최우선 지표로 공개합니다.
                입출금, 주문, 정산 데이터가 하나의 실시간 화면에서 연결되어 자금 처리 신뢰를
                금융기관 수준으로 전달합니다.
              </p>

              <div className="mt-4 flex flex-wrap gap-2 text-[11px]">
                <span className="rounded-full border border-emerald-300/50 bg-emerald-500/15 px-2.5 py-1 text-emerald-100">
                  VASP 운영 모니터링
                </span>
                <span className="rounded-full border border-cyan-300/50 bg-cyan-500/15 px-2.5 py-1 text-cyan-100">
                  USDT 온체인 정산 추적
                </span>
                <span className="rounded-full border border-slate-500/60 bg-slate-800/70 px-2.5 py-1 text-slate-200">
                  정산 이벤트 우선 공시
                </span>
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  href={`/${lang}/realtime-settlement`}
                  className="rounded-xl border border-emerald-300/80 bg-emerald-500/30 px-4 py-2 text-sm font-semibold text-emerald-50 transition hover:-translate-y-0.5 hover:bg-emerald-400/38"
                >
                  정산 라이브 보기
                </Link>
                <Link
                  href={`/${lang}/realtime-buyorder`}
                  className="rounded-xl border border-cyan-300/70 bg-cyan-400/22 px-4 py-2 text-sm font-semibold text-cyan-50 transition hover:-translate-y-0.5 hover:bg-cyan-300/30"
                >
                  BuyOrder 라이브 보기
                </Link>
                <Link
                  href={`/${lang}/realtime-banktransfer`}
                  className="rounded-xl border border-slate-500/70 bg-slate-800/70 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:-translate-y-0.5 hover:border-slate-300/70"
                >
                  입출금 라이브 보기
                </Link>
              </div>

              <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-300">
                <span className="rounded-lg border border-slate-700/70 bg-slate-900/75 px-2.5 py-1.5">
                  Connection: <span className="font-semibold text-emerald-200">{connectionState}</span>
                </span>
                <span className="rounded-lg border border-slate-700/70 bg-slate-900/75 px-2.5 py-1.5">
                  Sync: <span className="font-semibold text-emerald-200">{isSyncing ? "running" : "idle"}</span>
                </span>
                <span className="rounded-lg border border-slate-700/70 bg-slate-900/75 px-2.5 py-1.5">
                  Last Update:{" "}
                  <span className="font-semibold text-emerald-200">{latestTimeInfo.relativeLabel}</span>
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <article className="rounded-2xl border border-emerald-300/55 bg-emerald-950/40 p-4 shadow-lg shadow-black/25 sm:col-span-2">
                <p className="text-xs uppercase tracking-[0.08em] text-emerald-200">핵심 지표 | Settlement USDT</p>
                <p className="mt-2 text-3xl font-bold leading-none text-emerald-50 sm:text-[2.1rem]">
                  {formatUsdt(summary.settlementUsdt)}
                  <span className="ml-1 text-base font-semibold text-emerald-200">USDT</span>
                </p>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="rounded-md border border-emerald-300/40 bg-emerald-500/12 px-2 py-1 text-emerald-100">
                    정산완료 {summary.settlementCount.toLocaleString("ko-KR")}건
                  </span>
                  <span className="text-emerald-200/90">
                    USDT 기준 비중 {formatPercent(summary.settlementUsdtRatio)}
                  </span>
                </div>
              </article>

              <article className="rounded-2xl border border-cyan-500/45 bg-cyan-950/35 p-4 shadow-lg shadow-black/25">
                <p className="text-xs uppercase tracking-[0.08em] text-cyan-200">플랫폼 USDT</p>
                <p className="mt-2 text-xl font-semibold leading-tight text-cyan-50">
                  {formatUsdt(summary.totalUsdt)} USDT
                </p>
                <p className="mt-2 text-xs text-cyan-300/80">BuyOrder 누적 유동량</p>
              </article>

              <article className="rounded-2xl border border-amber-500/45 bg-amber-950/35 p-4 shadow-lg shadow-black/25">
                <p className="text-xs uppercase tracking-[0.08em] text-amber-200">정산 이벤트 비중</p>
                <p className="mt-2 text-3xl font-semibold leading-none text-amber-50">
                  {formatPercent(summary.settlementCountRatio)}
                </p>
                <p className="mt-2 text-xs text-amber-300/80">BuyOrder 이벤트 대비</p>
              </article>
            </div>
          </div>
        </header>

        {connectionErrorMessage && (
          <div className="rounded-xl border border-rose-500/45 bg-rose-950/55 px-3 py-2 text-sm text-rose-200">
            {connectionErrorMessage}
          </div>
        )}

        {syncErrorMessage && (
          <div className="rounded-xl border border-rose-500/45 bg-rose-950/55 px-3 py-2 text-sm text-rose-200">
            {syncErrorMessage}
          </div>
        )}

        <section className="relative overflow-hidden rounded-2xl border border-emerald-400/45 bg-[linear-gradient(135deg,rgba(6,78,59,0.56),rgba(2,6,23,0.92))] p-5 shadow-[0_18px_44px_-24px_rgba(16,185,129,0.72)]">
          <span className="absolute right-4 top-4 rounded-full border border-emerald-200/70 bg-emerald-400/22 px-2.5 py-0.5 text-[10px] font-bold tracking-[0.12em] text-emerald-50">
            SETTLEMENT PRIORITY
          </span>
          <div className="grid gap-4 lg:grid-cols-[1.25fr_1fr]">
            <div>
              <p className="text-xs uppercase tracking-[0.12em] text-emerald-200/90">Settlement Spotlight</p>
              <h2 className="mt-1 text-xl font-semibold text-emerald-50">
                최우선 정산 공시 데스크: VASP 운영 상태를 실시간으로 증명합니다
              </h2>
              <p className="mt-2 max-w-3xl text-sm text-emerald-100/85">
                체결 이후 USDT 정산 반영까지의 이벤트를 별도 추적해 정산 지연 리스크를 즉시 식별합니다.
                대외 공개 화면에서 정산 건수, 정산 금액, 처리 시점을 함께 노출하여 금융 서비스 수준의
                운영 투명성을 제공합니다.
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="rounded-lg border border-emerald-300/45 bg-emerald-500/14 px-2.5 py-1 text-xs text-emerald-100">
                  정산 이벤트 {summary.settlementCount.toLocaleString("ko-KR")}건
                </span>
                <span className="rounded-lg border border-emerald-300/45 bg-emerald-500/14 px-2.5 py-1 text-xs text-emerald-100">
                  {formatUsdt(summary.settlementUsdt)} USDT
                </span>
                <span className="rounded-lg border border-emerald-300/45 bg-emerald-500/14 px-2.5 py-1 text-xs text-emerald-100">
                  {formatKrw(summary.settlementKrw)} KRW
                </span>
                <span className="rounded-lg border border-emerald-300/45 bg-emerald-500/14 px-2.5 py-1 text-xs text-emerald-100">
                  정산 비중 {formatPercent(summary.settlementCountRatio)}
                </span>
              </div>
            </div>

            <div
              className={`promo-settlement-cta rounded-2xl border p-3.5 ${
                isSettlementCtaHot || isHeroBursting ? "promo-settlement-cta-burst" : ""
              }`}
            >
              <div className="relative flex items-start justify-between gap-2">
                <div>
                  <p className="inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.1em] text-emerald-100">
                    <span className="promo-live-dot h-2 w-2 rounded-full bg-emerald-300" />
                    Realtime Settlement Log
                  </p>
                  <h3 className="mt-1 text-base font-semibold leading-tight text-emerald-50">
                    정산 이벤트를 공시 수준으로 즉시 확인
                  </h3>
                  <p className="mt-1 text-[11px] text-emerald-200/90">
                    {latestSettlementTimeInfo
                      ? `최근 정산 이벤트 ${latestSettlementTimeInfo.relativeLabel}`
                      : "최근 정산 이벤트 대기 중"}
                  </p>
                </div>

                <span className="promo-settlement-ping rounded-full border border-emerald-200/75 bg-emerald-400/24 px-2 py-0.5 text-[10px] font-bold tracking-[0.12em] text-emerald-50">
                  LIVE
                </span>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-lg border border-emerald-400/35 bg-emerald-500/12 px-2 py-1.5 text-emerald-100">
                  <p className="text-[10px] uppercase tracking-[0.09em] text-emerald-200/90">Settlement Count</p>
                  <p className="mt-1 text-sm font-semibold tabular-nums">
                    {summary.settlementCount.toLocaleString("ko-KR")}건
                  </p>
                </div>
                <div className="rounded-lg border border-cyan-400/35 bg-cyan-500/12 px-2 py-1.5 text-cyan-100">
                  <p className="text-[10px] uppercase tracking-[0.09em] text-cyan-200/90">Settlement USDT</p>
                  <p className="mt-1 text-sm font-semibold tabular-nums">
                    {formatUsdt(summary.settlementUsdt)}{" "}
                    <span className="text-[11px] font-bold tracking-[0.08em]">USDT</span>
                  </p>
                </div>
              </div>

              <Link
                href={`/${lang}/realtime-settlement`}
                className="promo-settlement-btn mt-3 inline-flex w-full items-center justify-between rounded-xl border border-emerald-200/80 bg-emerald-400/30 px-3 py-2 text-sm font-semibold text-emerald-50 transition hover:-translate-y-0.5 hover:bg-emerald-300/36"
              >
                <span>정산 대시보드 바로가기</span>
                <span aria-hidden className="text-base leading-none">
                  →
                </span>
              </Link>

              <ul className="mt-3 space-y-2">
                {settlementBuyEvents.slice(0, 3).map((item) => {
                  const isHighlighted = item.highlightUntil > nowMs;
                  const timeInfo = getRelativeTimeInfo(item.data.publishedAt || item.receivedAt, nowMs);

                  return (
                    <li
                      key={`spot-${item.id}`}
                      className={`rounded-xl border px-2.5 py-2 transition-all duration-500 ${
                        isHighlighted
                          ? "promo-event-flash border-emerald-300/62 bg-emerald-400/16 shadow-[0_12px_24px_-16px_rgba(16,185,129,0.9)]"
                          : "border-emerald-500/30 bg-slate-950/58"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-xs text-emerald-50">
                          {item.data.store?.name || "Unknown Store"}
                        </span>
                        <span className="font-mono text-[11px] text-emerald-200">{timeInfo.relativeLabel}</span>
                      </div>
                      <p className="mt-1 text-base font-semibold text-emerald-100">
                        {formatUsdt(item.data.amountUsdt)}
                        <span className="ml-1 text-xs font-bold tracking-[0.08em] text-emerald-200">USDT</span>
                      </p>
                    </li>
                  );
                })}

                {settlementBuyEvents.length === 0 && (
                  <li className="rounded-lg border border-slate-700/70 bg-slate-900/70 px-2.5 py-3 text-xs text-slate-400">
                    수신된 정산 이벤트가 없습니다.
                  </li>
                )}
              </ul>
            </div>
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-2">
          <article className="overflow-hidden rounded-2xl border border-slate-700/80 bg-slate-900/75 p-4 shadow-lg shadow-black/20">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-xs uppercase tracking-[0.08em] text-emerald-300">Banktransfer Live</p>
                <h2 className="mt-1 text-lg font-semibold text-slate-100">입출금 실시간 하이라이트</h2>
              </div>
              <span className="rounded-full border border-emerald-300/60 bg-emerald-400/20 px-2 py-1 text-xs font-semibold text-emerald-50">
                LIVE
              </span>
            </div>

            {latestBank ? (
              <div className="mt-4 rounded-xl border border-slate-600/80 bg-slate-950/70 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2">
                    {latestBank.data.store?.logo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={latestBank.data.store.logo}
                        alt={latestBank.data.store.name || "store"}
                        className="h-10 w-10 shrink-0 rounded-md border border-slate-700 object-cover"
                      />
                    ) : (
                      <div className="h-10 w-10 shrink-0 rounded-md border border-slate-700 bg-slate-800" />
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-100">
                        {latestBank.data.store?.name || latestBank.data.storecode || "Unknown Store"}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        {getTransactionTypeLabel(latestBank.data.transactionType)} /{" "}
                        {formatKrw(latestBank.data.amount)} KRW
                      </p>
                    </div>
                  </div>
                  <span
                    className={`shrink-0 rounded-md border px-2 py-1 font-mono text-[11px] ${getRelativeTimeBadgeClassName(
                      getRelativeTimeInfo(
                        latestBank.data.publishedAt || latestBank.receivedAt,
                        nowMs,
                      ).tone,
                    )}`}
                  >
                    {
                      getRelativeTimeInfo(
                        latestBank.data.publishedAt || latestBank.receivedAt,
                        nowMs,
                      ).relativeLabel
                    }
                  </span>
                </div>
              </div>
            ) : (
              <div className="mt-4 rounded-xl border border-slate-700/80 bg-slate-950/70 p-3 text-sm text-slate-400">
                아직 수신된 입출금 이벤트가 없습니다.
              </div>
            )}

            <ul className="mt-3 space-y-2">
              {sortedBankEvents.slice(0, 6).map((item) => {
                const isHighlighted = item.highlightUntil > Date.now();
                const timeInfo = getRelativeTimeInfo(item.data.publishedAt || item.receivedAt, nowMs);

                return (
                  <li
                    key={item.id}
                    className={`rounded-xl border px-3 py-2 transition-all duration-500 ${
                      isHighlighted
                        ? "promo-event-flash border-cyan-300/60 bg-cyan-400/12"
                        : "border-slate-700/80 bg-slate-950/60"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${getTransactionTypeClassName(
                              item.data.transactionType,
                            )}`}
                          >
                            {getTransactionTypeLabel(item.data.transactionType)}
                          </span>
                          <span className="truncate text-xs text-slate-300">
                            {item.data.store?.name || item.data.storecode || "-"}
                          </span>
                        </div>
                        <p className="mt-1 text-sm font-semibold tabular-nums text-slate-100">
                          {formatKrw(item.data.amount)} KRW
                        </p>
                      </div>
                      <span
                        className={`shrink-0 rounded-md border px-1.5 py-1 font-mono text-[10px] ${getRelativeTimeBadgeClassName(
                          timeInfo.tone,
                        )}`}
                      >
                        {timeInfo.relativeLabel}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          </article>

          <article className="overflow-hidden rounded-2xl border border-slate-700/80 bg-slate-900/75 p-4 shadow-lg shadow-black/20">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-xs uppercase tracking-[0.08em] text-cyan-200">BuyOrder USDT Live</p>
                <h2 className="mt-1 text-lg font-semibold text-slate-100">USDT 주문 상태 하이라이트</h2>
              </div>
              <span className="rounded-full border border-cyan-300/60 bg-cyan-400/20 px-2 py-1 text-xs font-semibold text-cyan-50">
                LIVE
              </span>
            </div>

            {latestBuy ? (
              <div className="mt-4 rounded-xl border border-slate-600/80 bg-slate-950/70 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${getBuyStatusClassName(
                          latestBuy.data.statusTo,
                        )}`}
                      >
                        {getBuyStatusLabel(latestBuy.data.statusTo)}
                      </span>
                      <span className="truncate text-xs text-slate-300">
                        {latestBuy.data.store?.name || "-"}
                      </span>
                    </div>
                    <p className="mt-1 text-base font-semibold tabular-nums text-cyan-100">
                      {formatUsdt(latestBuy.data.amountUsdt)} USDT
                    </p>
                    <p className="mt-1 font-mono text-[11px] text-slate-400">
                      Buyer: {shortenText(latestBuy.data.buyerWalletAddress, 8, 6)}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-md border px-2 py-1 font-mono text-[11px] ${getRelativeTimeBadgeClassName(
                      getRelativeTimeInfo(latestBuy.data.publishedAt || latestBuy.receivedAt, nowMs)
                        .tone,
                    )}`}
                  >
                    {getRelativeTimeInfo(latestBuy.data.publishedAt || latestBuy.receivedAt, nowMs).relativeLabel}
                  </span>
                </div>
              </div>
            ) : (
              <div className="mt-4 rounded-xl border border-slate-700/80 bg-slate-950/70 p-3 text-sm text-slate-400">
                아직 수신된 BuyOrder 이벤트가 없습니다.
              </div>
            )}

            <ul className="mt-3 space-y-2">
              {sortedBuyEvents.slice(0, 6).map((item) => {
                const isHighlighted = item.highlightUntil > Date.now();
                const timeInfo = getRelativeTimeInfo(item.data.publishedAt || item.receivedAt, nowMs);

                return (
                  <li
                    key={item.id}
                    className={`rounded-xl border px-3 py-2 transition-all duration-500 ${
                      isHighlighted
                        ? "promo-event-flash border-cyan-300/60 bg-cyan-400/12"
                        : "border-slate-700/80 bg-slate-950/60"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${getBuyStatusClassName(
                              item.data.statusTo,
                            )}`}
                          >
                            {getBuyStatusLabel(item.data.statusTo)}
                          </span>
                          <span className="truncate text-xs text-slate-300">
                            {item.data.store?.name || "-"}
                          </span>
                        </div>
                        <p className="mt-1 text-sm font-semibold tabular-nums text-cyan-100">
                          {formatUsdt(item.data.amountUsdt)} USDT
                        </p>
                        <p className="mt-1 font-mono text-[11px] text-slate-400">
                          Wallet: {shortenText(item.data.buyerWalletAddress, 8, 6)}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 rounded-md border px-1.5 py-1 font-mono text-[10px] ${getRelativeTimeBadgeClassName(
                          timeInfo.tone,
                        )}`}
                      >
                        {timeInfo.relativeLabel}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          </article>
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-700/80 bg-slate-900/75 shadow-lg shadow-black/20">
          <div className="border-b border-slate-700/80 px-4 py-3">
            <p className="font-semibold text-slate-100">실시간 이벤트 티커</p>
            <p className="text-xs text-slate-400">입출금/주문/정산 이벤트를 자동 순환 표시합니다.</p>
          </div>
          <div className="overflow-hidden px-3 py-3">
            <div className="promo-marquee-track">
              {tickerTexts.map((text, index) => (
                <span
                  key={`ticker-${index}-${text}`}
                  className="inline-flex shrink-0 items-center rounded-full border border-cyan-300/35 bg-cyan-400/10 px-3 py-1 text-xs text-cyan-100"
                >
                  {text}
                </span>
              ))}
            </div>
          </div>
        </section>
      </section>

      <style jsx>{`
        .promo-grid {
          background-image: linear-gradient(
              to right,
              rgba(148, 163, 184, 0.12) 1px,
              transparent 1px
            ),
            linear-gradient(to bottom, rgba(148, 163, 184, 0.1) 1px, transparent 1px);
          background-size: 42px 42px;
          mask-image: radial-gradient(circle at 50% 40%, rgba(0, 0, 0, 1), rgba(0, 0, 0, 0) 78%);
          animation: promoGridMove 22s linear infinite;
        }

        .promo-orb {
          position: absolute;
          border-radius: 9999px;
          filter: blur(18px);
          opacity: 0.58;
        }

        .promo-orb-a {
          left: -120px;
          top: -60px;
          height: 340px;
          width: 340px;
          background: rgba(34, 211, 238, 0.34);
          animation: promoFloatA 12s ease-in-out infinite;
        }

        .promo-orb-b {
          right: -80px;
          top: 120px;
          height: 300px;
          width: 300px;
          background: rgba(52, 211, 153, 0.3);
          animation: promoFloatB 14s ease-in-out infinite;
        }

        .promo-orb-c {
          left: 35%;
          bottom: -130px;
          height: 360px;
          width: 360px;
          background: rgba(56, 189, 248, 0.22);
          animation: promoFloatC 18s ease-in-out infinite;
        }

        .promo-live-dot {
          animation: promoLivePulse 1.6s ease-out infinite;
          box-shadow: 0 0 0 rgba(34, 211, 238, 0.7);
        }

        .promo-title-shine {
          color: transparent;
          background: linear-gradient(92deg, #67e8f9 12%, #f0f9ff 45%, #6ee7b7 75%, #67e8f9 98%);
          background-size: 220% 100%;
          -webkit-background-clip: text;
          background-clip: text;
          animation: promoTitleShine 4s linear infinite;
        }

        .promo-hero-burst {
          animation: promoHeroBurst 1.1s ease;
        }

        .promo-event-flash {
          animation: promoEventFlash 1.2s ease;
        }

        .promo-settlement-cta {
          position: relative;
          overflow: hidden;
          border-color: rgba(110, 231, 183, 0.42);
          background: linear-gradient(
            145deg,
            rgba(5, 46, 36, 0.92) 0%,
            rgba(3, 15, 28, 0.94) 56%,
            rgba(6, 78, 59, 0.9) 100%
          );
          box-shadow: inset 0 0 0 1px rgba(16, 185, 129, 0.18),
            0 18px 36px -22px rgba(16, 185, 129, 0.8);
        }

        .promo-settlement-cta::before {
          content: "";
          position: absolute;
          inset: -130% -36%;
          background: linear-gradient(
            110deg,
            transparent 36%,
            rgba(110, 231, 183, 0.2) 50%,
            rgba(103, 232, 249, 0.28) 58%,
            transparent 71%
          );
          transform: rotate(10deg);
          animation: promoSettlementSweep 4.7s linear infinite;
          pointer-events: none;
        }

        .promo-settlement-cta::after {
          content: "";
          position: absolute;
          inset: -20%;
          background: radial-gradient(
            circle at 75% 18%,
            rgba(16, 185, 129, 0.23) 0%,
            rgba(2, 6, 23, 0) 58%
          );
          animation: promoSettlementAura 2.8s ease-in-out infinite;
          pointer-events: none;
        }

        .promo-settlement-cta > * {
          position: relative;
          z-index: 1;
        }

        .promo-settlement-cta-burst {
          animation: promoSettlementBurst 1.15s ease;
        }

        .promo-settlement-ping {
          animation: promoSettlementPing 1.15s ease-out infinite;
          box-shadow: 0 0 0 0 rgba(110, 231, 183, 0.55);
        }

        .promo-settlement-btn {
          position: relative;
          overflow: hidden;
          isolation: isolate;
          animation: promoSettlementBtnLift 2.4s ease-in-out infinite;
        }

        .promo-settlement-btn::after {
          content: "";
          position: absolute;
          top: 0;
          bottom: 0;
          left: -38%;
          width: 34%;
          background: linear-gradient(
            110deg,
            rgba(255, 255, 255, 0) 0%,
            rgba(255, 255, 255, 0.34) 48%,
            rgba(255, 255, 255, 0) 100%
          );
          transform: skewX(-18deg);
          animation: promoSettlementBtnShine 2.9s linear infinite;
          z-index: 0;
        }

        .promo-settlement-btn > span {
          position: relative;
          z-index: 1;
        }

        .promo-marquee-track {
          display: flex;
          width: max-content;
          gap: 0.75rem;
          animation: promoMarquee 33s linear infinite;
        }

        @keyframes promoGridMove {
          0% {
            transform: translate3d(0, 0, 0);
          }
          100% {
            transform: translate3d(-42px, -42px, 0);
          }
        }

        @keyframes promoFloatA {
          0%,
          100% {
            transform: translate3d(0, 0, 0);
          }
          50% {
            transform: translate3d(50px, 26px, 0);
          }
        }

        @keyframes promoFloatB {
          0%,
          100% {
            transform: translate3d(0, 0, 0);
          }
          50% {
            transform: translate3d(-42px, -18px, 0);
          }
        }

        @keyframes promoFloatC {
          0%,
          100% {
            transform: translate3d(0, 0, 0);
          }
          50% {
            transform: translate3d(26px, -30px, 0);
          }
        }

        @keyframes promoLivePulse {
          0% {
            box-shadow: 0 0 0 0 rgba(34, 211, 238, 0.72);
          }
          100% {
            box-shadow: 0 0 0 11px rgba(34, 211, 238, 0);
          }
        }

        @keyframes promoTitleShine {
          0% {
            background-position: 200% 0;
          }
          100% {
            background-position: -20% 0;
          }
        }

        @keyframes promoHeroBurst {
          0% {
            box-shadow: 0 0 0 0 rgba(45, 212, 191, 0.2);
          }
          35% {
            box-shadow: 0 0 0 7px rgba(45, 212, 191, 0.2);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(45, 212, 191, 0);
          }
        }

        @keyframes promoEventFlash {
          0% {
            transform: translateY(6px) scale(0.985);
            opacity: 0.7;
          }
          100% {
            transform: translateY(0) scale(1);
            opacity: 1;
          }
        }

        @keyframes promoSettlementSweep {
          0% {
            transform: translate3d(-42%, -18%, 0) rotate(10deg);
          }
          100% {
            transform: translate3d(38%, 22%, 0) rotate(10deg);
          }
        }

        @keyframes promoSettlementAura {
          0%,
          100% {
            opacity: 0.56;
            transform: scale(1);
          }
          50% {
            opacity: 1;
            transform: scale(1.04);
          }
        }

        @keyframes promoSettlementBurst {
          0% {
            box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.2);
          }
          32% {
            box-shadow: 0 0 0 8px rgba(16, 185, 129, 0.2);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(16, 185, 129, 0);
          }
        }

        @keyframes promoSettlementPing {
          0% {
            box-shadow: 0 0 0 0 rgba(110, 231, 183, 0.66);
          }
          100% {
            box-shadow: 0 0 0 10px rgba(110, 231, 183, 0);
          }
        }

        @keyframes promoSettlementBtnLift {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-1px);
          }
        }

        @keyframes promoSettlementBtnShine {
          0% {
            left: -42%;
          }
          100% {
            left: 132%;
          }
        }

        @keyframes promoMarquee {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .promo-grid,
          .promo-orb,
          .promo-live-dot,
          .promo-title-shine,
          .promo-hero-burst,
          .promo-event-flash,
          .promo-settlement-cta,
          .promo-settlement-cta-burst,
          .promo-settlement-ping,
          .promo-settlement-btn,
          .promo-marquee-track {
            animation: none !important;
          }
        }
      `}</style>
    </main>
  );
}
