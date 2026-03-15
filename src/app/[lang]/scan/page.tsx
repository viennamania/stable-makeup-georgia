"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
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

type ScanFeedMeta = {
  channel?: string;
  eventName?: string;
  authUrl?: string;
  snapshotUrl?: string;
  ingestUrl?: string;
  authHeaders?: string[];
};

type ScanSnapshotResponse = {
  result?: UsdtTransactionHashRealtimeEvent[];
  meta?: ScanFeedMeta;
};

const MAX_EVENTS = 160;
const RESYNC_LIMIT = 160;
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

export default function ScanHomePage() {
  const params = useParams();
  const router = useRouter();
  const lang = typeof params?.lang === "string" ? params.lang : "ko";

  const [events, setEvents] = useState<FeedItem[]>([]);
  const [connectionState, setConnectionState] = useState<Ably.ConnectionState>("initialized");
  const [connectionErrorMessage, setConnectionErrorMessage] = useState<string | null>(null);
  const [syncErrorMessage, setSyncErrorMessage] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [searchQuery, setSearchQuery] = useState("");
  const [feedMeta, setFeedMeta] = useState<ScanFeedMeta | null>(null);

  const clientId = useMemo(() => `scan-feed-${Math.random().toString(36).slice(2, 10)}`, []);
  const chainLabel = String(configuredChain || "bsc").toUpperCase();
  const resolvedFeedMeta = useMemo<Required<ScanFeedMeta>>(() => ({
    channel: feedMeta?.channel || USDT_TRANSACTION_HASH_ABLY_CHANNEL,
    eventName: feedMeta?.eventName || USDT_TRANSACTION_HASH_ABLY_EVENT_NAME,
    authUrl: feedMeta?.authUrl || "/api/realtime/ably-token?public=1&stream=usdt-txhash",
    snapshotUrl: feedMeta?.snapshotUrl || "/api/realtime/scan/usdt-token-transfers",
    ingestUrl: feedMeta?.ingestUrl || "/api/realtime/scan/usdt-token-transfers/ingest",
    authHeaders:
      Array.isArray(feedMeta?.authHeaders) && feedMeta?.authHeaders.length > 0
        ? feedMeta.authHeaders
        : ["x-api-key", "x-signature", "x-timestamp", "x-nonce"],
  }), [feedMeta]);

  const upsertEvents = useCallback((incomingEvents: UsdtTransactionHashRealtimeEvent[], highlightNew = true) => {
    if (incomingEvents.length === 0) {
      return;
    }

    const now = Date.now();

    setEvents((previousEvents) => {
      const map = new Map(previousEvents.map((item) => [item.id, item]));

      for (const event of incomingEvents) {
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
  }, []);

  const syncFromApi = useCallback(async () => {
    setIsSyncing(true);
    try {
      const response = await fetch(
        `/api/realtime/scan/usdt-token-transfers?public=1&limit=${RESYNC_LIMIT}`,
        { cache: "no-store" },
      );

      if (!response.ok) {
        throw new Error(`snapshot request failed (${response.status})`);
      }

      const data = (await response.json()) as ScanSnapshotResponse;
      upsertEvents(Array.isArray(data.result) ? data.result : [], false);
      setFeedMeta(data.meta || null);
      setSyncErrorMessage(null);
    } catch (error) {
      setSyncErrorMessage(error instanceof Error ? error.message : "failed to sync");
    } finally {
      setIsSyncing(false);
    }
  }, [upsertEvents]);

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
      if (!data?.transactionHash) {
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
  }, [clientId, syncFromApi, upsertEvents]);

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

  const filteredEvents = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    if (!normalizedQuery) {
      return events;
    }

    return events.filter((item) => {
      const candidates = [
        item.data.transactionHash,
        item.data.tradeId,
        item.data.orderId,
        item.data.fromWalletAddress,
        item.data.toWalletAddress,
        item.data.store?.code,
        item.data.fromLabel,
        item.data.toLabel,
        item.data.source,
        item.data.queueId,
        item.data.status,
      ];

      return candidates.some((candidate) => String(candidate || "").toLowerCase().includes(normalizedQuery));
    });
  }, [events, searchQuery]);

  const totals = useMemo(() => {
    const totalUsdt = filteredEvents.reduce((sum, item) => sum + Number(item.data.amountUsdt || 0), 0);
    const uniqueStores = new Set(filteredEvents.map((item) => item.data.store?.code).filter(Boolean));
    const uniqueAddresses = new Set(
      filteredEvents.flatMap((item) => [item.data.fromWalletAddress, item.data.toWalletAddress]).filter(Boolean),
    );

    return {
      totalCount: filteredEvents.length,
      totalUsdt,
      uniqueStores: uniqueStores.size,
      uniqueAddresses: uniqueAddresses.size,
    };
  }, [filteredEvents]);

  const handleSearchSubmit = useCallback((event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalized = searchQuery.trim();
    if (!normalized) {
      return;
    }

    if (normalized.startsWith("0x") && normalized.length >= 64) {
      router.push(`/${lang}/scan/tx/${normalized}`);
      return;
    }

    if (normalized.startsWith("0x")) {
      router.push(`/${lang}/scan/address/${normalized}/tokentxns`);
    }
  }, [lang, router, searchQuery]);

  return (
    <div className="min-h-screen bg-[#f4f7fb] text-slate-900">
      <div className="mx-auto flex w-full max-w-[1560px] flex-col gap-5 px-4 py-5 sm:px-6 lg:px-8">
        <section className="overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-[0_30px_90px_-52px_rgba(15,23,42,0.36)]">
          <div className="border-b border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.14),_transparent_42%),linear-gradient(135deg,_#ffffff,_#f8fbff)] px-5 py-6 sm:px-7">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
              <div className="max-w-3xl">
                <div className="text-[11px] font-semibold uppercase tracking-[0.3em] text-sky-700">
                  Scan Explorer
                </div>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-[34px]">
                  Live USDT Transaction Explorer
                </h1>
                <p className="mt-3 text-sm leading-6 text-slate-500">
                  원격 백엔드가 HMAC 보호 ingest API를 호출하면 이벤트가 Ably로 즉시 송출되고,
                  이 화면에서 BscScan 스타일의 실시간 USDT 전송 내역으로 확인할 수 있습니다.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${getConnectionClassName(connectionState)}`}>
                  <span className="h-2 w-2 rounded-full bg-current" />
                  {connectionState}
                </span>
                <a
                  href={getExplorerBaseUrl()}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-700 transition hover:border-sky-300 hover:bg-sky-100"
                >
                  {chainLabel} Explorer
                </a>
              </div>
            </div>

            <form onSubmit={handleSearchSubmit} className="mt-5 flex flex-col gap-3 sm:flex-row">
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search by tx hash, address, tradeId, queueId, storecode"
                className="h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
              />
              <button
                type="submit"
                className="h-12 rounded-2xl bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Search / Open
              </button>
            </form>

            <div className="mt-5 grid gap-3 lg:grid-cols-3">
              <div className="rounded-[24px] border border-slate-200 bg-white/80 px-4 py-4 shadow-sm backdrop-blur">
                <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Ingest API</div>
                <div className="mt-2 break-all text-sm font-semibold text-slate-950">{resolvedFeedMeta.ingestUrl}</div>
                <div className="mt-2 text-xs leading-5 text-slate-500">
                  Required headers · {resolvedFeedMeta.authHeaders.join(" · ")}
                </div>
              </div>
              <div className="rounded-[24px] border border-slate-200 bg-white/80 px-4 py-4 shadow-sm backdrop-blur">
                <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Snapshot API</div>
                <div className="mt-2 break-all text-sm font-semibold text-slate-950">{resolvedFeedMeta.snapshotUrl}</div>
                <div className="mt-2 text-xs leading-5 text-slate-500">
                  10s resync keeps the feed aligned with stored transaction history.
                </div>
              </div>
              <div className="rounded-[24px] border border-slate-200 bg-white/80 px-4 py-4 shadow-sm backdrop-blur">
                <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Ably Stream</div>
                <div className="mt-2 break-all text-sm font-semibold text-slate-950">{resolvedFeedMeta.channel}</div>
                <div className="mt-2 break-all text-xs leading-5 text-slate-500">
                  Event · {resolvedFeedMeta.eventName}
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-4 px-5 py-5 sm:px-7 lg:grid-cols-4">
            <div className="rounded-[24px] border border-slate-200 bg-white px-5 py-4 shadow-sm">
              <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">Transactions</div>
              <div className="mt-2 text-[28px] font-semibold tracking-tight text-slate-950">{totals.totalCount.toLocaleString()}</div>
            </div>
            <div className="rounded-[24px] border border-slate-200 bg-white px-5 py-4 shadow-sm">
              <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">Observed USDT</div>
              <div className="mt-2 text-[28px] font-semibold tracking-tight text-emerald-600">{formatUsdt(totals.totalUsdt)}</div>
            </div>
            <div className="rounded-[24px] border border-slate-200 bg-white px-5 py-4 shadow-sm">
              <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">Stores</div>
              <div className="mt-2 text-[28px] font-semibold tracking-tight text-slate-950">{totals.uniqueStores.toLocaleString()}</div>
            </div>
            <div className="rounded-[24px] border border-slate-200 bg-white px-5 py-4 shadow-sm">
              <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">Wallets</div>
              <div className="mt-2 text-[28px] font-semibold tracking-tight text-slate-950">{totals.uniqueAddresses.toLocaleString()}</div>
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_18px_60px_-42px_rgba(15,23,42,0.32)]">
          <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Latest Token Transfers</div>
              <h2 className="mt-1 text-lg font-semibold text-slate-950">Live registered USDT transfer feed</h2>
            </div>
            <div className="text-xs text-slate-500">
              {isSyncing ? "Snapshot syncing..." : "Realtime feed active"}
              {connectionErrorMessage ? ` · ${connectionErrorMessage}` : ""}
              {syncErrorMessage ? ` · ${syncErrorMessage}` : ""}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-50 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                <tr>
                  <th className="px-4 py-3 sm:px-6">Txn Hash</th>
                  <th className="px-4 py-3">Age</th>
                  <th className="px-4 py-3">From</th>
                  <th className="px-4 py-3">To</th>
                  <th className="px-4 py-3 text-right">Value</th>
                  <th className="px-4 py-3">Store</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Detail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredEvents.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-16 text-center text-sm text-slate-500">
                      표시할 transaction 이벤트가 없습니다.
                    </td>
                  </tr>
                        ) : (
                          filteredEvents.map((item) => {
                    const relativeTime = getRelativeTimeInfo(item.data.publishedAt || item.data.createdAt, nowMs);
                    const txExplorerUrl = getExplorerTxUrl(item.data.transactionHash);
                    const isHighlighted = item.highlightUntil > nowMs;

                    return (
                      <tr key={item.id} className={`${isHighlighted ? "bg-sky-50/70" : "bg-white"} transition-colors`}>
                        <td className="px-4 py-4 align-top sm:px-6">
                          <div className="flex flex-col gap-1">
                            <Link
                              href={`/${lang}/scan/tx/${item.data.transactionHash}`}
                              className="font-semibold text-sky-700 underline decoration-sky-300 underline-offset-4 hover:text-sky-800"
                              title={item.data.transactionHash}
                            >
                              {formatShortHash(item.data.transactionHash)}
                            </Link>
                            <a
                              href={txExplorerUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs text-slate-500 hover:text-sky-700"
                            >
                              external explorer
                            </a>
                          </div>
                        </td>
                        <td className="px-4 py-4 align-top">
                          <div className="flex flex-col gap-2">
                            <div
                              className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${getRelativeTimeClassName(relativeTime.tone)}`}
                              title={relativeTime.absoluteLabel}
                            >
                              {relativeTime.relativeLabel}
                            </div>
                            <div className="text-xs text-slate-500" title={relativeTime.absoluteLabel}>
                              {relativeTime.absoluteLabel}
                            </div>
                          </div>
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
                          </div>
                        </td>
                        <td className="px-4 py-4 text-right align-top">
                          <div className="font-semibold text-emerald-600">{formatUsdt(item.data.amountUsdt)}</div>
                          <div className="mt-1 text-xs text-slate-500">USDT</div>
                        </td>
                        <td className="px-4 py-4 align-top">
                          <div className="font-medium text-slate-900">{item.data.store?.code || "-"}</div>
                          <div className="mt-1 text-xs text-slate-500">{item.data.tradeId || "-"}</div>
                          <div className="mt-1 text-xs text-slate-400">{item.data.source || "-"}</div>
                        </td>
                        <td className="px-4 py-4 align-top">
                          <div className="flex max-w-[220px] flex-col gap-2">
                            <span className="inline-flex w-fit rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-medium text-slate-600">
                              {item.data.status || "registered"}
                            </span>
                            <div className="text-xs text-slate-500">
                              {item.data.queueId ? `queue ${item.data.queueId}` : "queue -"}
                            </div>
                            <div className="text-xs text-slate-400">
                              {item.data.minedAt ? `mined ${item.data.minedAt}` : "mined pending"}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-right align-top">
                          <Link
                            href={`/${lang}/scan/tx/${item.data.transactionHash}`}
                            className="inline-flex rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
                          >
                            View
                          </Link>
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
