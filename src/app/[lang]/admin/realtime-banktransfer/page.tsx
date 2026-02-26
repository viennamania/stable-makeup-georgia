"use client";

import { useEffect, useMemo, useState } from "react";
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

export default function RealtimeBankTransferPage() {
  const [events, setEvents] = useState<RealtimeItem[]>([]);
  const [connectionState, setConnectionState] = useState<Ably.ConnectionState>("initialized");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const clientId = useMemo(() => {
    return `ops-dashboard-${Math.random().toString(36).slice(2, 10)}`;
  }, []);

  useEffect(() => {
    const realtime = new Ably.Realtime({
      authUrl: `/api/realtime/ably-token?clientId=${clientId}`,
    });

    const channel = realtime.channels.get(BANKTRANSFER_ABLY_CHANNEL);

    const onConnectionStateChange = (stateChange: Ably.ConnectionStateChange) => {
      setConnectionState(stateChange.current);
      if (stateChange.reason) {
        setErrorMessage(stateChange.reason.message || "Ably connection error");
      }
    };

    const onMessage = (message: Ably.Message) => {
      const data = message.data as BankTransferDashboardEvent;
      const nextItem: RealtimeItem = {
        id: message.id || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        receivedAt: new Date().toISOString(),
        data,
      };

      setEvents((prev) => {
        return [nextItem, ...prev].slice(0, MAX_EVENTS);
      });
    };

    realtime.connection.on(onConnectionStateChange);
    void channel.subscribe(BANKTRANSFER_ABLY_EVENT_NAME, onMessage);

    return () => {
      channel.unsubscribe(BANKTRANSFER_ABLY_EVENT_NAME, onMessage);
      realtime.connection.off(onConnectionStateChange);
      realtime.close();
    };
  }, [clientId]);

  return (
    <main className="w-full max-w-5xl rounded-lg bg-white p-6 shadow-md">
      <h1 className="text-2xl font-semibold text-black">Banktransfer Realtime</h1>
      <p className="mt-1 text-sm text-gray-600">
        Channel: <span className="font-mono">{BANKTRANSFER_ABLY_CHANNEL}</span> / Event:{" "}
        <span className="font-mono">{BANKTRANSFER_ABLY_EVENT_NAME}</span>
      </p>

      <div className="mt-4 flex flex-wrap gap-3 text-sm">
        <div className="rounded bg-gray-100 px-3 py-2">
          Connection: <span className="font-semibold">{connectionState}</span>
        </div>
        <div className="rounded bg-gray-100 px-3 py-2">
          Events: <span className="font-semibold">{events.length}</span>
        </div>
      </div>

      {errorMessage && (
        <div className="mt-4 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {errorMessage}
        </div>
      )}

      <div className="mt-6 overflow-x-auto">
        <table className="min-w-full border-collapse text-sm">
          <thead>
            <tr className="border-b text-left text-gray-600">
              <th className="px-2 py-2">시간</th>
              <th className="px-2 py-2">상태</th>
              <th className="px-2 py-2">유형</th>
              <th className="px-2 py-2">금액</th>
              <th className="px-2 py-2">입금자</th>
              <th className="px-2 py-2">계좌</th>
              <th className="px-2 py-2">스토어</th>
              <th className="px-2 py-2">거래ID</th>
            </tr>
          </thead>
          <tbody>
            {events.length === 0 && (
              <tr>
                <td colSpan={8} className="px-2 py-8 text-center text-gray-500">
                  아직 수신된 이벤트가 없습니다.
                </td>
              </tr>
            )}
            {events.map((item) => (
              <tr key={item.id} className="border-b align-top">
                <td className="px-2 py-2 font-mono text-xs text-gray-500">{item.receivedAt}</td>
                <td className="px-2 py-2">{item.data.status}</td>
                <td className="px-2 py-2">{item.data.transactionType}</td>
                <td className="px-2 py-2">{item.data.amount.toLocaleString()}</td>
                <td className="px-2 py-2">{item.data.transactionName}</td>
                <td className="px-2 py-2 font-mono">{item.data.bankAccountNumber}</td>
                <td className="px-2 py-2">{item.data.storecode || "-"}</td>
                <td className="px-2 py-2 font-mono">{item.data.tradeId || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
