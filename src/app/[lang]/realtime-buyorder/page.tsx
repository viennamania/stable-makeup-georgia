"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as Ably from "ably";

import {
  BUYORDER_STATUS_ABLY_CHANNEL,
  BUYORDER_STATUS_ABLY_EVENT_NAME,
  type BuyOrderStatusRealtimeEvent,
} from "@lib/ably/constants";

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

export default function RealtimeBuyOrderPage() {
  const [events, setEvents] = useState<RealtimeItem[]>([]);
  const [connectionState, setConnectionState] = useState<Ably.ConnectionState>("initialized");
  const [connectionErrorMessage, setConnectionErrorMessage] = useState<string | null>(null);
  const [syncErrorMessage, setSyncErrorMessage] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [cursor, setCursor] = useState<string | null>(null);

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

  return (
    <main className="w-full max-w-[1800px] space-y-5 text-slate-100">
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
        <div className="rounded-2xl border border-slate-700/80 bg-slate-900/75 p-4 shadow-lg shadow-black/20">
          <p className="text-xs uppercase tracking-wide text-slate-400">총 이벤트</p>
          <p className="mt-2 text-2xl font-semibold text-slate-100">{sortedEvents.length}</p>
        </div>
        <div className="rounded-2xl border border-emerald-500/25 bg-emerald-900/20 p-4 shadow-lg shadow-black/20">
          <p className="text-xs uppercase tracking-wide text-emerald-300/80">결제완료</p>
          <p className="mt-2 text-2xl font-semibold text-emerald-200">{summary.confirmedCount}</p>
        </div>
        <div className="rounded-2xl border border-amber-500/25 bg-amber-900/20 p-4 shadow-lg shadow-black/20">
          <p className="text-xs uppercase tracking-wide text-amber-300/80">진행중(주문/매칭/요청)</p>
          <p className="mt-2 text-2xl font-semibold text-amber-200">{summary.pendingCount}</p>
        </div>
        <div className="rounded-2xl border border-rose-500/25 bg-rose-900/20 p-4 shadow-lg shadow-black/20">
          <p className="text-xs uppercase tracking-wide text-rose-300/80">취소</p>
          <p className="mt-2 text-2xl font-semibold text-rose-200">{summary.cancelledCount}</p>
        </div>
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
                  <th className="w-[320px] px-3 py-2">내역</th>
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

                  return (
                    <tr
                      key={item.id}
                      className={`border-b border-slate-800/80 align-top transition-all duration-500 ${
                        isHighlighted
                          ? "animate-pulse bg-cyan-500/10 shadow-[inset_0_0_0_1px_rgba(34,211,238,0.32)]"
                          : "hover:bg-slate-900/55"
                      }`}
                    >
                      <td className="px-3 py-3 font-mono text-xs text-slate-400">
                        <div>{item.data.publishedAt || item.receivedAt}</div>
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
                        <div className="font-semibold text-slate-100">{formatKrw(item.data.amountKrw)} KRW</div>
                        <div className="text-xs text-slate-400">{formatUsdt(item.data.amountUsdt)} USDT</div>
                      </td>

                      <td className="px-3 py-3 text-slate-200">{maskName(item.data.buyerName)}</td>
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
