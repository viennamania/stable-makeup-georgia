"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as Ably from "ably";

import {
  BANKTRANSFER_ABLY_CHANNEL,
  BANKTRANSFER_ABLY_EVENT_NAME,
  type BankTransferDashboardEvent,
} from "@lib/ably/constants";

type RealtimeItem = {
  id: string;
  receivedAt: string;
  data: BankTransferDashboardEvent;
};

const MAX_EVENTS = 50;
const RESYNC_LIMIT = 100;
const RESYNC_INTERVAL_MS = 10_000;

function getTransactionTypeLabel(transactionType: string): string {
  if (transactionType === "deposited") {
    return "입금";
  }
  if (transactionType === "withdrawn") {
    return "출금";
  }
  return transactionType;
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

export default function RealtimeBankTransferPage() {
  const [events, setEvents] = useState<RealtimeItem[]>([]);
  const [connectionState, setConnectionState] = useState<Ably.ConnectionState>("initialized");
  const [connectionErrorMessage, setConnectionErrorMessage] = useState<string | null>(null);
  const [syncErrorMessage, setSyncErrorMessage] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [cursor, setCursor] = useState<string | null>(null);

  const cursorRef = useRef<string | null>(null);

  const clientId = useMemo(() => {
    return `ops-dashboard-${Math.random().toString(36).slice(2, 10)}`;
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
    (incomingEvents: BankTransferDashboardEvent[]) => {
      if (incomingEvents.length === 0) {
        return;
      }

      setEvents((previousEvents) => {
        const map = new Map(previousEvents.map((item) => [item.id, item]));

        for (const incomingEvent of incomingEvents) {
          const nextId =
            incomingEvent.eventId ||
            incomingEvent.cursor ||
            `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

          map.set(nextId, {
            id: nextId,
            receivedAt: new Date().toISOString(),
            data: incomingEvent,
          });
        }

        const merged = Array.from(map.values());

        merged.sort((left, right) => {
          const leftTimestamp = Date.parse(left.data.publishedAt || left.receivedAt);
          const rightTimestamp = Date.parse(right.data.publishedAt || right.receivedAt);
          return rightTimestamp - leftTimestamp;
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

          upsertRealtimeEvents(incomingEvents);
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
      authUrl: `/api/realtime/ably-token?public=1&clientId=${clientId}`,
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
      upsertRealtimeEvents([
        {
          ...data,
          eventId: data.eventId || String(message.id || ""),
        },
      ]);
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

  const sortedEvents = useMemo(() => {
    const toTimestamp = (value: string | null | undefined) => {
      if (!value) {
        return 0;
      }

      const timestamp = Date.parse(value);
      return Number.isNaN(timestamp) ? 0 : timestamp;
    };

    return [...events].sort((a, b) => {
      const left = toTimestamp(a.data.publishedAt || a.receivedAt);
      const right = toTimestamp(b.data.publishedAt || b.receivedAt);
      return right - left;
    });
  }, [events]);

  return (
    <main className="w-full max-w-5xl rounded-lg bg-white p-6 shadow-md">
      <h1 className="text-2xl font-semibold text-black">Banktransfer Realtime</h1>
      <p className="mt-1 text-sm text-gray-600">
        Channel: <span className="font-mono">{BANKTRANSFER_ABLY_CHANNEL}</span> / Event:{" "}
        <span className="font-mono">{BANKTRANSFER_ABLY_EVENT_NAME}</span>
      </p>

      <div className="mt-4 flex w-full flex-wrap items-center gap-2 rounded bg-gray-50 p-3">
        <button
          type="button"
          onClick={() => void syncFromApi(null)}
          className="rounded border border-gray-300 bg-white px-3 py-2 text-sm text-black"
        >
          재동기화
        </button>
      </div>

      <div className="mt-4 flex flex-wrap gap-3 text-sm">
        <div className="rounded bg-gray-100 px-3 py-2">
          Connection: <span className="font-semibold">{connectionState}</span>
        </div>
        <div className="rounded bg-gray-100 px-3 py-2">
          Events: <span className="font-semibold">{events.length}</span>
        </div>
        <div className="rounded bg-gray-100 px-3 py-2">
          Cursor: <span className="font-mono text-xs">{cursor || "-"}</span>
        </div>
        <div className="rounded bg-gray-100 px-3 py-2">
          Sync: <span className="font-semibold">{isSyncing ? "running" : "idle"}</span>
        </div>
      </div>

      {connectionErrorMessage && (
        <div className="mt-4 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {connectionErrorMessage}
        </div>
      )}

      {syncErrorMessage && (
        <div className="mt-4 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {syncErrorMessage}
        </div>
      )}

      <div className="mt-6 overflow-x-auto">
        <table className="min-w-full border-collapse text-sm">
          <thead>
            <tr className="border-b text-left text-gray-600">
              <th className="px-2 py-2">시간</th>
              <th className="px-2 py-2">상태</th>
              <th className="px-2 py-2">유형</th>
              <th className="px-2 py-2 text-right">금액</th>
              <th className="px-2 py-2">입금자</th>
              <th className="px-2 py-2">계좌</th>
              <th className="px-2 py-2">스토어</th>
              <th className="px-2 py-2">거래ID</th>
            </tr>
          </thead>
          <tbody>
            {sortedEvents.length === 0 && (
              <tr>
                <td colSpan={8} className="px-2 py-8 text-center text-gray-500">
                  아직 수신된 이벤트가 없습니다.
                </td>
              </tr>
            )}
            {sortedEvents.map((item) => (
              <tr key={item.id} className="border-b align-top">
                <td className="px-2 py-2 font-mono text-xs text-gray-500">{item.receivedAt}</td>
                <td className="px-2 py-2">{item.data.status}</td>
                <td className="px-2 py-2">{getTransactionTypeLabel(item.data.transactionType)}</td>
                <td className="px-2 py-2 text-right">{item.data.amount.toLocaleString()}</td>
                <td className="px-2 py-2">{maskName(item.data.transactionName)}</td>
                <td className="px-2 py-2 font-mono">{maskAccountNumber(item.data.bankAccountNumber)}</td>
                <td className="px-2 py-2">
                  {item.data.store ? (
                    <div className="flex min-w-[180px] items-center gap-2">
                      {item.data.store.logo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.data.store.logo}
                          alt={item.data.store.name || "store-logo"}
                          className="h-8 w-8 rounded object-cover"
                        />
                      ) : (
                        <div className="h-8 w-8 rounded bg-gray-200" />
                      )}
                      <div className="flex flex-col">
                        <span className="leading-tight text-black">{item.data.store.name || "-"}</span>
                        <span className="font-mono text-xs leading-tight text-gray-500">
                          {item.data.store.code || item.data.storecode || "-"}
                        </span>
                      </div>
                    </div>
                  ) : (
                    "-"
                  )}
                </td>
                <td className="px-2 py-2 font-mono">{item.data.tradeId || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
