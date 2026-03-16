"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import * as Ably from "ably";

import { chain as configuredChain } from "@/app/config/contractAddresses";
import {
  USDT_TRANSACTION_HASH_ABLY_CHANNEL,
  USDT_TRANSACTION_HASH_ABLY_EVENT_NAME,
  type UsdtTransactionHashRealtimeEvent,
} from "@lib/ably/constants";
import { getRelativeTimeInfo, type RelativeTimeTone } from "@lib/realtime/timeAgo";

type FeedItem = {
  id: string;
  data: UsdtTransactionHashRealtimeEvent;
  highlightUntil: number;
};

type PartyIdentity = NonNullable<UsdtTransactionHashRealtimeEvent["fromIdentity"]>;

const MAX_EVENTS = 120;
const RESYNC_LIMIT = 120;
const RESYNC_INTERVAL_MS = 10_000;
const NEW_EVENT_HIGHLIGHT_MS = 4_800;
const TIME_AGO_TICK_MS = 5_000;

function normalizeAddress(value: string | null | undefined): string {
  return String(value || "").trim().toLowerCase();
}

function toTimestamp(value: string | null | undefined): number {
  if (!value) {
    return 0;
  }
  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function formatUsdt(value: number): string {
  return Number(value || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 3,
  });
}

function formatShortHash(value: string | null | undefined): string {
  const hash = String(value || "").trim();
  if (!hash) {
    return "-";
  }
  if (hash.length <= 22) {
    return hash;
  }
  return `${hash.slice(0, 10)}...${hash.slice(-8)}`;
}

function formatShortAddress(value: string | null | undefined): string {
  const address = String(value || "").trim();
  if (!address) {
    return "-";
  }
  if (address.length <= 18) {
    return address;
  }
  return `${address.slice(0, 8)}...${address.slice(-6)}`;
}

function getExplorerBaseUrl(): string {
  if (configuredChain === "ethereum") {
    return "https://etherscan.io";
  }
  if (configuredChain === "polygon") {
    return "https://polygonscan.com";
  }
  if (configuredChain === "bsc") {
    return "https://bscscan.com";
  }
  return "https://arbiscan.io";
}

function getExplorerAddressUrl(address: string | null | undefined): string {
  const normalized = String(address || "").trim();
  if (!normalized) {
    return "";
  }
  return `${getExplorerBaseUrl()}/address/${normalized}#tokentxns`;
}

function getExplorerTxUrl(hash: string | null | undefined): string {
  const normalized = String(hash || "").trim();
  if (!normalized) {
    return "";
  }
  return `${getExplorerBaseUrl()}/tx/${normalized}`;
}

function getConnectionClassName(state: Ably.ConnectionState): string {
  switch (state) {
    case "connected":
      return "border-emerald-300 bg-emerald-50 text-emerald-700";
    case "connecting":
    case "initialized":
      return "border-amber-300 bg-amber-50 text-amber-700";
    case "disconnected":
    case "suspended":
      return "border-rose-300 bg-rose-50 text-rose-700";
    default:
      return "border-slate-300 bg-slate-100 text-slate-600";
  }
}

function getRelativeTimeClassName(tone: RelativeTimeTone): string {
  switch (tone) {
    case "live":
      return "border-emerald-300 bg-emerald-50 text-emerald-700";
    case "fresh":
      return "border-sky-300 bg-sky-50 text-sky-700";
    case "recent":
      return "border-cyan-200 bg-cyan-50 text-cyan-700";
    case "normal":
      return "border-slate-200 bg-slate-100 text-slate-600";
    default:
      return "border-slate-200 bg-white text-slate-500";
  }
}

function matchesAddress(event: UsdtTransactionHashRealtimeEvent, normalizedAddress: string): boolean {
  if (!normalizedAddress) {
    return true;
  }

  return (
    normalizeAddress(event.fromWalletAddress) === normalizedAddress ||
    normalizeAddress(event.toWalletAddress) === normalizedAddress
  );
}

function getDirection(event: UsdtTransactionHashRealtimeEvent, normalizedAddress: string): "OUT" | "IN" | "WATCH" {
  if (!normalizedAddress) {
    return "WATCH";
  }

  if (normalizeAddress(event.fromWalletAddress) === normalizedAddress) {
    return "OUT";
  }
  if (normalizeAddress(event.toWalletAddress) === normalizedAddress) {
    return "IN";
  }
  return "WATCH";
}

function getDirectionClassName(direction: "OUT" | "IN" | "WATCH"): string {
  if (direction === "OUT") {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }
  if (direction === "IN") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }
  return "border-slate-200 bg-slate-100 text-slate-600";
}

function buildIdentityTags(identity: PartyIdentity | null | undefined): string[] {
  if (!identity) {
    return [];
  }

  return [
    identity.badgeLabel,
    identity.nickname,
    identity.storecode ? `store:${identity.storecode}` : null,
    identity.userType ? `type:${identity.userType}` : null,
  ].filter((value): value is string => Boolean(value));
}

function isExternalOnlyInsightEvent(event: UsdtTransactionHashRealtimeEvent): boolean {
  return event.source === "thirdweb.insight.tokens.transfers";
}

export default function ScanAddressTokenTransactionsPage() {
  const params = useParams();
  const lang = typeof params?.lang === "string" ? params.lang : "ko";
  const addressParam = typeof params?.address === "string" ? params.address : "";
  const normalizedAddress = useMemo(() => normalizeAddress(addressParam), [addressParam]);

  const [events, setEvents] = useState<FeedItem[]>([]);
  const [connectionState, setConnectionState] = useState<Ably.ConnectionState>("initialized");
  const [connectionErrorMessage, setConnectionErrorMessage] = useState<string | null>(null);
  const [syncErrorMessage, setSyncErrorMessage] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [nowMs, setNowMs] = useState(() => Date.now());

  const clientId = useMemo(() => `scan-usdt-${Math.random().toString(36).slice(2, 10)}`, []);

  const upsertEvents = useCallback((incomingEvents: UsdtTransactionHashRealtimeEvent[], highlightNew = true) => {
    if (incomingEvents.length === 0) {
      return;
    }

    const now = Date.now();

    setEvents((previousEvents) => {
      const map = new Map(previousEvents.map((item) => [item.id, item]));

      for (const event of incomingEvents) {
        if (!matchesAddress(event, normalizedAddress)) {
          continue;
        }

        const nextId = event.eventId || `${event.transactionHash}-${event.orderId || ""}-${event.createdAt}`;
        const existing = map.get(nextId);
        if (existing) {
          map.set(nextId, {
            ...existing,
            data: event,
          });
          continue;
        }

        map.set(nextId, {
          id: nextId,
          data: event,
          highlightUntil: highlightNew ? now + NEW_EVENT_HIGHLIGHT_MS : 0,
        });
      }

      return Array.from(map.values())
        .sort((left, right) => {
          const rightTs = Math.max(toTimestamp(right.data.createdAt), toTimestamp(right.data.publishedAt));
          const leftTs = Math.max(toTimestamp(left.data.createdAt), toTimestamp(left.data.publishedAt));
          return rightTs - leftTs;
        })
        .slice(0, MAX_EVENTS);
    });
  }, [normalizedAddress]);

  const syncFromApi = useCallback(async () => {
    setIsSyncing(true);
    try {
      const params = new URLSearchParams({
        public: "1",
        limit: String(RESYNC_LIMIT),
      });
      if (addressParam) {
        params.set("address", addressParam);
      }

      const response = await fetch(`/api/realtime/scan/usdt-token-transfers?${params.toString()}`, {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(`snapshot request failed (${response.status})`);
      }

      const data = (await response.json()) as { result?: UsdtTransactionHashRealtimeEvent[] };
      upsertEvents(Array.isArray(data.result) ? data.result : [], false);
      setSyncErrorMessage(null);
    } catch (error) {
      setSyncErrorMessage(error instanceof Error ? error.message : "failed to sync");
    } finally {
      setIsSyncing(false);
    }
  }, [addressParam, upsertEvents]);

  useEffect(() => {
    const realtime = new Ably.Realtime({
      authUrl: `/api/realtime/ably-token?public=1&stream=usdt-txhash&clientId=${clientId}`,
    });

    const channel = realtime.channels.get(USDT_TRANSACTION_HASH_ABLY_CHANNEL);

    const onConnectionStateChange = (stateChange: Ably.ConnectionStateChange) => {
      setConnectionState(stateChange.current);
      if (stateChange.reason) {
        setConnectionErrorMessage(stateChange.reason.message || "Ably connection error");
      } else {
        setConnectionErrorMessage(null);
      }

      if (stateChange.current === "connected") {
        void syncFromApi();
      }
    };

    const onMessage = (message: Ably.Message) => {
      const data = message.data as UsdtTransactionHashRealtimeEvent;
      if (!data?.transactionHash || !matchesAddress(data, normalizedAddress)) {
        return;
      }

      upsertEvents(
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
    void channel.subscribe(USDT_TRANSACTION_HASH_ABLY_EVENT_NAME, onMessage);

    return () => {
      channel.unsubscribe(USDT_TRANSACTION_HASH_ABLY_EVENT_NAME, onMessage);
      realtime.connection.off(onConnectionStateChange);
      realtime.close();
    };
  }, [clientId, normalizedAddress, syncFromApi, upsertEvents]);

  useEffect(() => {
    void syncFromApi();
    const timer = window.setInterval(() => {
      void syncFromApi();
    }, RESYNC_INTERVAL_MS);

    return () => window.clearInterval(timer);
  }, [syncFromApi]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNowMs(Date.now());
    }, TIME_AGO_TICK_MS);

    return () => window.clearInterval(timer);
  }, []);

  const totals = useMemo(() => {
    let incomingCount = 0;
    let outgoingCount = 0;
    let totalUsdt = 0;

    for (const item of events) {
      const direction = getDirection(item.data, normalizedAddress);
      if (direction === "IN") {
        incomingCount += 1;
      } else if (direction === "OUT") {
        outgoingCount += 1;
      }
      totalUsdt += Number(item.data.amountUsdt || 0);
    }

    return {
      totalCount: events.length,
      incomingCount,
      outgoingCount,
      totalUsdt,
      latestCreatedAt: events[0]?.data?.createdAt || null,
    };
  }, [events, normalizedAddress]);

  const addressExplorerUrl = getExplorerAddressUrl(addressParam);
  const chainLabel = String(configuredChain || "bsc").toUpperCase();

  return (
    <div className="min-h-screen bg-[#f4f7fb] text-slate-900">
      <div className="mx-auto flex w-full max-w-[1520px] flex-col gap-5 px-4 py-5 sm:px-6 lg:px-8">
        <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_24px_80px_-48px_rgba(15,23,42,0.35)]">
          <div className="border-b border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.14),_transparent_42%),linear-gradient(135deg,_#ffffff,_#f8fbff)] px-5 py-5 sm:px-7">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-sky-700">
                  Scan / Token Txns
                </div>
                <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 sm:text-[30px]">
                  USDT Transaction Hash Live Feed
                </h1>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
                  저장된 scan 이벤트와 사용자 지갑 전용 thirdweb Insight owner query를 합쳐 주소 기준으로 보여줍니다.
                  BscScan의 token transfers 화면처럼 최근 USDT 흐름을 즉시 확인할 수 있습니다.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${getConnectionClassName(connectionState)}`}>
                  <span className="h-2 w-2 rounded-full bg-current" />
                  {connectionState}
                </span>
                <Link
                  href={`/${lang}/scan`}
                  className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
                >
                  All Transactions
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(addressParam);
                  }}
                  className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
                >
                  주소 복사
                </button>
                <a
                  href={addressExplorerUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-700 transition hover:border-sky-300 hover:bg-sky-100"
                >
                  Explorer 열기
                </a>
              </div>
            </div>
          </div>

          <div className="grid gap-4 px-5 py-5 sm:px-7 lg:grid-cols-[minmax(0,1.55fr)_minmax(320px,0.9fr)]">
            <div className="rounded-[24px] border border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-5 text-white shadow-[0_26px_70px_-45px_rgba(15,23,42,0.9)]">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-300">
                    Address Overview
                  </div>
                  <div className="mt-3 break-all text-lg font-semibold tracking-tight sm:text-[22px]">
                    {addressParam}
                  </div>
                </div>

                <div className="inline-flex items-center rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold text-slate-100">
                  {chainLabel} · USDT
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <div className="text-[11px] uppercase tracking-[0.22em] text-slate-400">Total Events</div>
                  <div className="mt-2 text-2xl font-semibold text-white">{totals.totalCount.toLocaleString()}</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <div className="text-[11px] uppercase tracking-[0.22em] text-slate-400">Outgoing</div>
                  <div className="mt-2 text-2xl font-semibold text-rose-300">{totals.outgoingCount.toLocaleString()}</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <div className="text-[11px] uppercase tracking-[0.22em] text-slate-400">Incoming</div>
                  <div className="mt-2 text-2xl font-semibold text-emerald-300">{totals.incomingCount.toLocaleString()}</div>
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              <div className="rounded-[24px] border border-slate-200 bg-white px-5 py-4 shadow-sm">
                <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">Observed USDT</div>
                <div className="mt-2 text-[28px] font-semibold tracking-tight text-slate-950">
                  {formatUsdt(totals.totalUsdt)}
                </div>
              </div>
              <div className="rounded-[24px] border border-slate-200 bg-white px-5 py-4 shadow-sm">
                <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">Latest Seen</div>
                <div className="mt-2 text-base font-semibold text-slate-900">
                  {totals.latestCreatedAt
                    ? new Intl.DateTimeFormat(lang === "ko" ? "ko-KR" : "en-US", {
                        dateStyle: "medium",
                        timeStyle: "medium",
                      }).format(new Date(totals.latestCreatedAt))
                    : "-"}
                </div>
              </div>
              <div className="rounded-[24px] border border-slate-200 bg-white px-5 py-4 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">Realtime Status</div>
                    <div className="mt-2 text-sm font-medium text-slate-700">
                      {isSyncing ? "Snapshot syncing..." : "Ably live streaming"}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      void syncFromApi();
                    }}
                    className="rounded-full border border-slate-300 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-100"
                  >
                    Refresh
                  </button>
                </div>
                {connectionErrorMessage ? (
                  <p className="mt-3 text-xs text-rose-600">{connectionErrorMessage}</p>
                ) : null}
                {syncErrorMessage ? (
                  <p className="mt-2 text-xs text-amber-600">{syncErrorMessage}</p>
                ) : null}
              </div>
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_18px_60px_-42px_rgba(15,23,42,0.32)]">
          <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                Token Transfers
              </div>
              <h2 className="mt-1 text-lg font-semibold text-slate-950">Latest USDT transaction hash registrations</h2>
            </div>
            <div className="text-xs text-slate-500">
              address filter: <span className="font-semibold text-slate-700">{formatShortAddress(addressParam)}</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-50 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                <tr>
                  <th className="px-4 py-3 sm:px-6">Txn Hash</th>
                  <th className="px-4 py-3">Age</th>
                  <th className="px-4 py-3">Direction</th>
                  <th className="px-4 py-3">From</th>
                  <th className="px-4 py-3">To</th>
                  <th className="px-4 py-3 text-right">Value</th>
                  <th className="px-4 py-3">Trade</th>
                  <th className="px-4 py-3">Source</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {events.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-16 text-center text-sm text-slate-500">
                      아직 표시할 transaction hash 이벤트가 없습니다.
                    </td>
                  </tr>
                ) : (
                  events.map((item) => {
                    const direction = getDirection(item.data, normalizedAddress);
                    const relativeTime = getRelativeTimeInfo(item.data.createdAt, nowMs);
                    const txUrl = getExplorerTxUrl(item.data.transactionHash);
                    const fromUrl = getExplorerAddressUrl(item.data.fromWalletAddress);
                    const toUrl = getExplorerAddressUrl(item.data.toWalletAddress);
                    const isHighlighted = item.highlightUntil > nowMs;
                    const fromIdentityTags = buildIdentityTags(item.data.fromIdentity || null);
                    const toIdentityTags = buildIdentityTags(item.data.toIdentity || null);
                    const txHref = isExternalOnlyInsightEvent(item.data)
                      ? txUrl
                      : `/${lang}/scan/tx/${item.data.transactionHash}`;

                    return (
                      <tr
                        key={item.id}
                        className={`${isHighlighted ? "bg-sky-50/70" : "bg-white"} transition-colors`}
                      >
                        <td className="px-4 py-4 align-top sm:px-6">
                          <div className="flex flex-col gap-1">
                            <a
                              href={txHref}
                              target={isExternalOnlyInsightEvent(item.data) ? "_blank" : undefined}
                              rel={isExternalOnlyInsightEvent(item.data) ? "noreferrer" : undefined}
                              className="font-semibold text-sky-700 underline decoration-sky-300 underline-offset-4 hover:text-sky-800"
                              title={item.data.transactionHash}
                            >
                              {formatShortHash(item.data.transactionHash)}
                            </a>
                            <div className="flex items-center gap-2 text-xs text-slate-500">
                              <span>{item.data.chain || configuredChain} · {item.data.tokenSymbol}</span>
                              {isExternalOnlyInsightEvent(item.data) ? (
                                <span className="rounded-full border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold text-indigo-700">
                                  insight
                                </span>
                              ) : null}
                              <a href={txUrl} target="_blank" rel="noreferrer" className="hover:text-sky-700">
                                external
                              </a>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 align-top">
                          <div
                            className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${getRelativeTimeClassName(relativeTime.tone)}`}
                            title={relativeTime.absoluteLabel}
                          >
                            {relativeTime.relativeLabel}
                          </div>
                        </td>
                        <td className="px-4 py-4 align-top">
                          <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${getDirectionClassName(direction)}`}>
                            {direction}
                          </span>
                        </td>
                        <td className="px-4 py-4 align-top">
                          <div className="flex max-w-[220px] flex-col gap-1">
                            {item.data.fromWalletAddress ? (
                              <Link
                                href={`/${lang}/scan/address/${item.data.fromWalletAddress}/tokentxns`}
                                className="font-medium text-slate-900 hover:text-sky-700"
                                title={item.data.fromWalletAddress}
                              >
                                {formatShortAddress(item.data.fromWalletAddress)}
                              </Link>
                            ) : (
                              <span className="font-medium text-slate-900">-</span>
                            )}
                            <div className="truncate text-xs text-slate-500" title={item.data.fromLabel || ""}>
                              {item.data.fromLabel || "-"}
                            </div>
                            {fromIdentityTags.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {fromIdentityTags.map((tag) => (
                                  <span
                                    key={`${item.id}-from-${tag}`}
                                    className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-600"
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            ) : null}
                            <a href={fromUrl} target="_blank" rel="noreferrer" className="text-[11px] text-slate-400 hover:text-sky-700">
                              external explorer
                            </a>
                          </div>
                        </td>
                        <td className="px-4 py-4 align-top">
                          <div className="flex max-w-[220px] flex-col gap-1">
                            {item.data.toWalletAddress ? (
                              <Link
                                href={`/${lang}/scan/address/${item.data.toWalletAddress}/tokentxns`}
                                className="font-medium text-slate-900 hover:text-sky-700"
                                title={item.data.toWalletAddress}
                              >
                                {formatShortAddress(item.data.toWalletAddress)}
                              </Link>
                            ) : (
                              <span className="font-medium text-slate-900">-</span>
                            )}
                            <div className="truncate text-xs text-slate-500" title={item.data.toLabel || ""}>
                              {item.data.toLabel || "-"}
                            </div>
                            {toIdentityTags.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {toIdentityTags.map((tag) => (
                                  <span
                                    key={`${item.id}-to-${tag}`}
                                    className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-600"
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            ) : null}
                            <a href={toUrl} target="_blank" rel="noreferrer" className="text-[11px] text-slate-400 hover:text-sky-700">
                              external explorer
                            </a>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-right align-top">
                          <div className="font-semibold text-emerald-600">{formatUsdt(item.data.amountUsdt)}</div>
                          <div className="mt-1 text-xs text-slate-500">USDT</div>
                        </td>
                        <td className="px-4 py-4 align-top">
                          <div className="font-medium text-slate-900">{item.data.tradeId || "-"}</div>
                          <div className="mt-1 text-xs text-slate-500">{item.data.orderId || "-"}</div>
                        </td>
                        <td className="px-4 py-4 align-top">
                          <div className="flex flex-col gap-1">
                            <span className="inline-flex w-fit rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-medium text-slate-600">
                              {item.data.status || "registered"}
                            </span>
                            <div className="text-xs text-slate-500">{item.data.store?.code || "-"}</div>
                            <div className="truncate text-xs text-slate-400" title={item.data.source}>
                              {item.data.source}
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
