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
const TODAY_SUMMARY_REFRESH_MS = 10_000;
const NEW_EVENT_HIGHLIGHT_MS = 3_600;
const TIME_AGO_TICK_MS = 5_000;
const COUNTDOWN_TICK_MS = 1_000;
const COUNT_UP_MIN_MS = 640;
const COUNT_UP_MAX_MS = 1_480;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

type TodaySummary = {
  dateKst: string;
  depositedAmount: number;
  withdrawnAmount: number;
  depositedCount: number;
  withdrawnCount: number;
  totalCount: number;
  updatedAt: string;
};

function toTimestamp(value: string | null | undefined): number {
  if (!value) {
    return 0;
  }
  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function getKstDateKey(value: Date): string {
  const kst = new Date(value.getTime() + 9 * 60 * 60 * 1000);
  const year = kst.getUTCFullYear();
  const month = String(kst.getUTCMonth() + 1).padStart(2, "0");
  const day = String(kst.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getKstDateKeyFromIso(value: string | null | undefined): string | null {
  const timestamp = toTimestamp(value);
  if (!timestamp) {
    return null;
  }
  return getKstDateKey(new Date(timestamp));
}

function normalizeTransactionType(value: string): "deposited" | "withdrawn" | "other" {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "deposited" || normalized === "deposit" || normalized === "입금") {
    return "deposited";
  }
  if (normalized === "withdrawn" || normalized === "withdrawal" || normalized === "출금") {
    return "withdrawn";
  }
  return "other";
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

function getKstDateLabel(referenceDate: Date): string {
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  }).format(referenceDate);
}

function getRemainingKstMs(referenceMs: number): number {
  const shifted = new Date(referenceMs + KST_OFFSET_MS);
  const year = shifted.getUTCFullYear();
  const month = shifted.getUTCMonth();
  const day = shifted.getUTCDate();
  const nextMidnightShiftedMs = Date.UTC(year, month, day + 1, 0, 0, 0, 0);
  return Math.max(0, nextMidnightShiftedMs - shifted.getTime());
}

function formatCountdownHms(totalMs: number): string {
  const totalSec = Math.max(0, Math.floor(totalMs / 1000));
  const hours = Math.floor(totalSec / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function easeOutCubic(value: number): number {
  const clamped = Math.max(0, Math.min(1, value));
  return 1 - Math.pow(1 - clamped, 3);
}

function getCountUpDurationMs(fromValue: number, toValue: number): number {
  const delta = Math.abs(toValue - fromValue);
  if (delta <= 0) {
    return COUNT_UP_MIN_MS;
  }

  const scaled = 520 + Math.log10(delta + 1) * 280;
  return Math.round(Math.max(COUNT_UP_MIN_MS, Math.min(COUNT_UP_MAX_MS, scaled)));
}

function useCountUpValue(targetValue: number): number {
  const safeTarget = Number.isFinite(targetValue) ? Math.round(targetValue) : 0;
  const [displayValue, setDisplayValue] = useState<number>(safeTarget);
  const previousTargetRef = useRef<number>(safeTarget);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const nextTarget = Number.isFinite(targetValue) ? Math.round(targetValue) : 0;
    const startValue = previousTargetRef.current;

    if (rafRef.current !== null) {
      window.cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    if (startValue === nextTarget) {
      setDisplayValue(nextTarget);
      previousTargetRef.current = nextTarget;
      return;
    }

    const durationMs = getCountUpDurationMs(startValue, nextTarget);
    let startTimestamp = 0;

    const animate = (timestamp: number) => {
      if (!startTimestamp) {
        startTimestamp = timestamp;
      }

      const elapsed = timestamp - startTimestamp;
      const progress = Math.min(1, elapsed / durationMs);
      const eased = easeOutCubic(progress);
      const interpolated = startValue + (nextTarget - startValue) * eased;
      setDisplayValue(Math.round(interpolated));

      if (progress < 1) {
        rafRef.current = window.requestAnimationFrame(animate);
        return;
      }

      setDisplayValue(nextTarget);
      previousTargetRef.current = nextTarget;
      rafRef.current = null;
    };

    rafRef.current = window.requestAnimationFrame(animate);

    return () => {
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [targetValue]);

  return displayValue;
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
  const [countdownNowMs, setCountdownNowMs] = useState(() => Date.now());
  const [todaySummary, setTodaySummary] = useState<TodaySummary | null>(null);
  const [todaySummaryErrorMessage, setTodaySummaryErrorMessage] = useState<string | null>(null);

  const cursorRef = useRef<string | null>(null);
  const summaryAppliedEventIdsRef = useRef<Set<string>>(new Set());

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

  const fetchTodaySummary = useCallback(async () => {
    try {
      const response = await fetch("/api/realtime/banktransfer/summary?public=1", {
        method: "GET",
        cache: "no-store",
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`HTTP ${response.status} ${text}`);
      }

      const data = await response.json();
      const summaryData = data?.summary || {};

      const nextSummary: TodaySummary = {
        dateKst: String(summaryData.dateKst || getKstDateKey(new Date())),
        depositedAmount: Number(summaryData.depositedAmount || 0),
        withdrawnAmount: Number(summaryData.withdrawnAmount || 0),
        depositedCount: Number(summaryData.depositedCount || 0),
        withdrawnCount: Number(summaryData.withdrawnCount || 0),
        totalCount: Number(summaryData.totalCount || 0),
        updatedAt: String(summaryData.updatedAt || new Date().toISOString()),
      };

      setTodaySummary((previous) => {
        if (previous?.dateKst !== nextSummary.dateKst) {
          summaryAppliedEventIdsRef.current.clear();
        }
        return nextSummary;
      });
      setTodaySummaryErrorMessage(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : "오늘 누적 집계 조회 실패";
      setTodaySummaryErrorMessage(message);
    }
  }, []);

  const applyRealtimeEventToTodaySummary = useCallback((event: BankTransferDashboardEvent) => {
    if (event.status !== "stored") {
      return;
    }

    const eventId = String(event.eventId || event.cursor || "").trim();
    if (eventId) {
      const appliedSet = summaryAppliedEventIdsRef.current;
      if (appliedSet.has(eventId)) {
        return;
      }
      appliedSet.add(eventId);

      if (appliedSet.size > 2000) {
        const recent = Array.from(appliedSet).slice(-1000);
        appliedSet.clear();
        for (const id of recent) {
          appliedSet.add(id);
        }
      }
    }

    const eventDateKey = getKstDateKeyFromIso(event.transactionDate || event.publishedAt);
    const todayDateKey = getKstDateKey(new Date());
    if (!eventDateKey || eventDateKey !== todayDateKey) {
      return;
    }

    const type = normalizeTransactionType(event.transactionType);
    if (type === "other") {
      return;
    }

    const amount = Number(event.amount || 0);
    if (!Number.isFinite(amount)) {
      return;
    }

    setTodaySummary((previous) => {
      const base: TodaySummary = previous?.dateKst === todayDateKey
        ? previous
        : {
            dateKst: todayDateKey,
            depositedAmount: 0,
            withdrawnAmount: 0,
            depositedCount: 0,
            withdrawnCount: 0,
            totalCount: 0,
            updatedAt: new Date().toISOString(),
          };

      if (type === "deposited") {
        return {
          ...base,
          depositedAmount: base.depositedAmount + amount,
          depositedCount: base.depositedCount + 1,
          totalCount: base.totalCount + 1,
          updatedAt: new Date().toISOString(),
        };
      }

      return {
        ...base,
        withdrawnAmount: base.withdrawnAmount + amount,
        withdrawnCount: base.withdrawnCount + 1,
        totalCount: base.totalCount + 1,
        updatedAt: new Date().toISOString(),
      };
    });
  }, []);

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
        void fetchTodaySummary();
      }
    };

    const onMessage = (message: Ably.Message) => {
      const data = message.data as BankTransferDashboardEvent;
      const normalizedEvent: BankTransferDashboardEvent = {
        ...data,
        eventId: data.eventId || String(message.id || ""),
      };
      upsertRealtimeEvents(
        [normalizedEvent],
        { highlightNew: true },
      );
      applyRealtimeEventToTodaySummary(normalizedEvent);
    };

    realtime.connection.on(onConnectionStateChange);
    void channel.subscribe(BANKTRANSFER_ABLY_EVENT_NAME, onMessage);

    return () => {
      channel.unsubscribe(BANKTRANSFER_ABLY_EVENT_NAME, onMessage);
      realtime.connection.off(onConnectionStateChange);
      realtime.close();
    };
  }, [applyRealtimeEventToTodaySummary, clientId, fetchTodaySummary, syncFromApi, upsertRealtimeEvents]);

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
    void fetchTodaySummary();

    const timer = window.setInterval(() => {
      void fetchTodaySummary();
    }, TODAY_SUMMARY_REFRESH_MS);

    return () => {
      window.clearInterval(timer);
    };
  }, [fetchTodaySummary]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNowMs(Date.now());
    }, TIME_AGO_TICK_MS);

    return () => {
      window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCountdownNowMs(Date.now());
    }, COUNTDOWN_TICK_MS);

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

  const todaySummaryFallback = useMemo(() => {
    const todayDateKey = getKstDateKey(new Date(nowMs));
    let depositedCount = 0;
    let withdrawnCount = 0;
    let depositedAmount = 0;
    let withdrawnAmount = 0;

    for (const item of sortedEvents) {
      if (item.data.status !== "stored") {
        continue;
      }

      const eventDateKey = getKstDateKeyFromIso(item.data.transactionDate || item.data.publishedAt);
      if (!eventDateKey || eventDateKey !== todayDateKey) {
        continue;
      }

      const type = normalizeTransactionType(item.data.transactionType);
      const amount = Number(item.data.amount || 0);
      if (!Number.isFinite(amount)) {
        continue;
      }

      if (type === "deposited") {
        depositedCount += 1;
        depositedAmount += amount;
      } else if (type === "withdrawn") {
        withdrawnCount += 1;
        withdrawnAmount += amount;
      }
    }

    return {
      dateKst: todayDateKey,
      depositedAmount,
      withdrawnAmount,
      depositedCount,
      withdrawnCount,
      totalCount: depositedCount + withdrawnCount,
      updatedAt: new Date().toISOString(),
    } satisfies TodaySummary;
  }, [nowMs, sortedEvents]);

  const todayTotals = todaySummary || todaySummaryFallback;
  const animatedDepositedAmount = useCountUpValue(todayTotals.depositedAmount);
  const animatedWithdrawnAmount = useCountUpValue(todayTotals.withdrawnAmount);
  const animatedDepositedCount = useCountUpValue(todayTotals.depositedCount);
  const animatedWithdrawnCount = useCountUpValue(todayTotals.withdrawnCount);
  const todayEventTotal = Math.max(1, todayTotals.totalCount);
  const depositedRatio = Math.max(8, Math.min(100, (todayTotals.depositedCount / todayEventTotal) * 100));
  const withdrawnRatio = Math.max(8, Math.min(100, (todayTotals.withdrawnCount / todayEventTotal) * 100));
  const todayDateLabelKst = useMemo(() => getKstDateLabel(new Date(countdownNowMs)), [countdownNowMs]);
  const remainingMsToday = useMemo(() => getRemainingKstMs(countdownNowMs), [countdownNowMs]);
  const countdownLabel = useMemo(() => formatCountdownHms(remainingMsToday), [remainingMsToday]);
  const remainingDayRatio = Math.max(0, Math.min(100, (remainingMsToday / ONE_DAY_MS) * 100));

  return (
    <main className="w-full max-w-[1800px] space-y-5 pt-20 text-slate-100">
      <RealtimeTopNav lang={lang} current="banktransfer" />

      <section className="overflow-hidden rounded-2xl border border-cyan-500/20 bg-[radial-gradient(circle_at_top,_rgba(15,118,110,0.22),_rgba(2,6,23,0.96)_52%)] p-6 shadow-[0_20px_70px_-24px_rgba(6,182,212,0.45)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-cyan-100">Banktransfer Realtime Dashboard</h1>
            <p className="mt-1 text-sm text-slate-300">
              공개 대시보드입니다. 입금자 이름/계좌번호는 마스킹되어 표시됩니다.
            </p>
            <p className="mt-1 text-xs text-cyan-300/90">
              Channel: <span className="font-mono">{BANKTRANSFER_ABLY_CHANNEL}</span> / Event: <span className="font-mono">{BANKTRANSFER_ABLY_EVENT_NAME}</span>
            </p>
          </div>

          <div className="w-full max-w-[980px] space-y-2">
            <div className="flex items-center justify-end">
              <button
                type="button"
                onClick={() => void syncFromApi(null)}
                className="rounded-xl border border-cyan-400/40 bg-cyan-500/10 px-3 py-2 text-sm font-medium text-cyan-100 transition hover:bg-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isSyncing}
              >
                {isSyncing ? "재동기화 중..." : "재동기화"}
              </button>
            </div>

            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
              <article className="relative overflow-hidden rounded-xl border border-violet-300/35 bg-gradient-to-br from-indigo-500/26 via-violet-500/16 to-slate-950/72 px-3 py-3 shadow-[0_14px_34px_-24px_rgba(99,102,241,0.95)]">
                <div className="pointer-events-none absolute -right-10 -top-8 h-24 w-24 rounded-full bg-violet-300/25 blur-2xl" />
                <p className="relative text-[11px] uppercase tracking-[0.12em] text-violet-100/90">오늘 날짜 (KST)</p>
                <p className="relative mt-1 text-lg font-semibold leading-tight text-violet-50">{todayDateLabelKst}</p>
                <div className="relative mt-2 flex items-end justify-between">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.12em] text-violet-100/80">오늘 남은 시간</p>
                    <p className="mt-1 font-mono text-2xl font-semibold leading-none tabular-nums text-violet-50 animate-pulse">
                      {countdownLabel}
                    </p>
                  </div>
                  <span className="inline-flex rounded-full border border-violet-300/45 bg-violet-400/20 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-violet-50">
                    COUNTDOWN
                  </span>
                </div>
                <div className="relative mt-2 h-1.5 overflow-hidden rounded-full bg-violet-100/30">
                  <div
                    className="h-full rounded-full bg-violet-300 transition-all duration-700"
                    style={{ width: `${remainingDayRatio}%` }}
                  />
                </div>
              </article>

              <article className="relative overflow-hidden rounded-xl border border-emerald-400/35 bg-gradient-to-br from-emerald-500/24 via-emerald-500/14 to-slate-950/70 px-3 py-3 shadow-[0_14px_34px_-24px_rgba(16,185,129,0.95)]">
                <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-emerald-300/20 blur-2xl" />
                <p className="relative text-[11px] uppercase tracking-[0.12em] text-emerald-100/85">오늘 입금 (KST)</p>
                <p className="relative mt-1 text-2xl font-semibold leading-tight tabular-nums text-emerald-50">
                  {formatKrw(animatedDepositedAmount)}
                  <span className="ml-1 text-sm font-medium text-emerald-200/90">KRW</span>
                </p>
                <div className="relative mt-1 flex items-center justify-between text-xs">
                  <span className="text-emerald-100/90">누적 {animatedDepositedCount.toLocaleString("ko-KR")}건</span>
                  <span className="inline-flex rounded-full border border-emerald-300/40 bg-emerald-400/20 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-emerald-50">
                    LIVE
                  </span>
                </div>
                <div className="relative mt-2 h-1.5 overflow-hidden rounded-full bg-emerald-100/30">
                  <div
                    className="h-full rounded-full bg-emerald-300 transition-all duration-500"
                    style={{ width: `${depositedRatio}%` }}
                  />
                </div>
              </article>

              <article className="relative overflow-hidden rounded-xl border border-rose-400/35 bg-gradient-to-br from-rose-500/24 via-rose-500/14 to-slate-950/70 px-3 py-3 shadow-[0_14px_34px_-24px_rgba(244,63,94,0.95)]">
                <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-rose-300/20 blur-2xl" />
                <p className="relative text-[11px] uppercase tracking-[0.12em] text-rose-100/85">오늘 출금 (KST)</p>
                <p className="relative mt-1 text-2xl font-semibold leading-tight tabular-nums text-rose-50">
                  {formatKrw(animatedWithdrawnAmount)}
                  <span className="ml-1 text-sm font-medium text-rose-200/90">KRW</span>
                </p>
                <div className="relative mt-1 flex items-center justify-between text-xs">
                  <span className="text-rose-100/90">누적 {animatedWithdrawnCount.toLocaleString("ko-KR")}건</span>
                  <span className="inline-flex rounded-full border border-rose-300/40 bg-rose-400/20 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-rose-50">
                    LIVE
                  </span>
                </div>
                <div className="relative mt-2 h-1.5 overflow-hidden rounded-full bg-rose-100/30">
                  <div
                    className="h-full rounded-full bg-rose-300 transition-all duration-500"
                    style={{ width: `${withdrawnRatio}%` }}
                  />
                </div>
              </article>
            </div>
          </div>
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

      {todaySummaryErrorMessage && (
        <div className="rounded-xl border border-amber-500/40 bg-amber-950/45 px-3 py-2 text-sm text-amber-200">
          오늘 누적 집계 조회 실패: {todaySummaryErrorMessage}
        </div>
      )}

      <section className="grid gap-3 xl:grid-cols-[360px_minmax(0,1fr)]">
        <div className="rounded-2xl border border-slate-700/80 bg-slate-900/75 p-4 shadow-lg shadow-black/20">
          <p className="text-xs uppercase tracking-wide text-slate-400">거래 지표 (오늘 · KST)</p>
          <div className="mt-3 space-y-2 text-sm">
            <div className="flex items-center justify-between rounded-lg border border-slate-700/70 bg-slate-950/60 px-3 py-2">
              <span className="text-slate-300">입금 건수</span>
              <span className="font-semibold tabular-nums text-emerald-200">{todayTotals.depositedCount.toLocaleString("ko-KR")}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-slate-700/70 bg-slate-950/60 px-3 py-2">
              <span className="text-slate-300">출금 건수</span>
              <span className="font-semibold tabular-nums text-rose-200">{todayTotals.withdrawnCount.toLocaleString("ko-KR")}</span>
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
            <p className="font-semibold text-slate-100">실시간 입출금 시스템 로그</p>
            <p className="mt-1 font-mono text-[11px] text-slate-500">tail -f /var/log/banktransfer/realtime.log</p>
          </div>

          <div className="border-b border-slate-800/80 bg-slate-950/85 px-4 py-2">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-rose-400/90" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber-400/90" />
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/90" />
              <span className="ml-2 font-mono text-[11px] text-slate-500">banktransfer-realtime@{connectionState}</span>
            </div>
          </div>

          <div className="max-h-[780px] space-y-1 overflow-y-auto bg-[linear-gradient(180deg,rgba(2,6,23,0.95),rgba(2,6,23,0.92))] p-3">
            {sortedEvents.length === 0 && (
              <div className="rounded-lg border border-slate-800/80 bg-slate-950/70 px-3 py-8 text-center font-mono text-xs text-slate-500">
                [WAITING] 아직 수신된 이벤트가 없습니다.
              </div>
            )}

            {sortedEvents.map((item, index) => {
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
              const status = String(item.data.status || "").toLowerCase();
              const level = status === "error" ? "ERROR" : status === "stored" ? "INFO" : "WARN";
              const type = getTransactionTypeLabel(item.data.transactionType).toUpperCase();
              const lineNo = String(sortedEvents.length - index).padStart(4, "0");

              return (
                <article
                  key={`log-${item.id}`}
                  className={`rounded-lg border px-3 py-2 transition-all duration-500 ${
                    isHighlighted
                      ? "border-cyan-400/45 bg-cyan-500/10 shadow-[inset_0_0_0_1px_rgba(34,211,238,0.26)]"
                      : "border-slate-800/80 bg-slate-950/65"
                  }`}
                >
                  <div className="flex flex-wrap items-center gap-2 font-mono text-[11px] leading-relaxed">
                    <span className="text-slate-600">#{lineNo}</span>
                    <span className="text-slate-500">{timeInfo.absoluteLabel}</span>
                    <span className={`rounded px-1.5 py-0.5 font-semibold ${
                      level === "ERROR"
                        ? "bg-rose-500/20 text-rose-200"
                        : level === "INFO"
                          ? "bg-emerald-500/20 text-emerald-200"
                          : "bg-amber-500/20 text-amber-200"
                    }`}>
                      {level}
                    </span>
                    <span className={`rounded px-1.5 py-0.5 font-semibold ${
                      type === "입금"
                        ? "bg-cyan-500/20 text-cyan-200"
                        : type === "출금"
                          ? "bg-fuchsia-500/20 text-fuchsia-200"
                          : "bg-slate-700/80 text-slate-200"
                    }`}>
                      {type}
                    </span>
                    <span className="text-slate-300">amount=<span className="text-slate-100">{formatKrw(item.data.amount)}KRW</span></span>
                    <span className="text-slate-400">sender={maskName(item.data.transactionName)}:{maskAccountNumber(item.data.bankAccountNumber)}</span>
                    <span className="text-slate-400">receiver={receiverBankName}/{receiverAccountHolder}/{receiverAccountNumber}</span>
                    <span className="text-cyan-300">tid={item.data.tradeId || "-"}</span>
                    <span className={item.data.match ? "text-emerald-300" : "text-amber-300"}>
                      match={item.data.match || "-"}
                    </span>
                    <span className="text-slate-500">trace={item.data.traceId || "-"}</span>
                    <span className="text-slate-600">({timeInfo.relativeLabel})</span>
                    {isHighlighted && (
                      <span className="animate-pulse rounded border border-cyan-400/40 bg-cyan-500/20 px-1.5 py-0.5 text-cyan-100">
                        NEW
                      </span>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}
