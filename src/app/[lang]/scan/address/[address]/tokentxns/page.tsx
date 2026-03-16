"use client";

import Link from "next/link";
import Image from "next/image";
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

function formatDateTime(value: string | null | undefined): string {
  const text = String(value || "").trim();
  if (!text) {
    return "-";
  }

  const date = new Date(text);
  if (Number.isNaN(date.getTime())) {
    return text;
  }

  return date.toLocaleString("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
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

function getChainLogoSrc(): string {
  if (configuredChain === "ethereum") {
    return "/logo-chain-ethereum.png";
  }
  if (configuredChain === "polygon") {
    return "/logo-chain-polygon.png";
  }
  if (configuredChain === "arbitrum") {
    return "/logo-chain-arbitrum.png";
  }
  return "/logo-chain-bsc.png";
}

function getChainMarketLabel(): string {
  if (configuredChain === "ethereum") {
    return "Ethereum Mainnet";
  }
  if (configuredChain === "polygon") {
    return "Polygon PoS";
  }
  if (configuredChain === "arbitrum") {
    return "Arbitrum One";
  }
  return "BNB Smart Chain";
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
      return "border-[#ccebd6] bg-[#eefaf2] text-[#0f7a4b]";
    case "connecting":
    case "initialized":
      return "border-[#f2d996] bg-[#fff8e1] text-[#9a6b00]";
    case "disconnected":
    case "suspended":
      return "border-[#f4c7c3] bg-[#fff3f2] text-[#b5473c]";
    default:
      return "border-[#d9deea] bg-[#f6f8fb] text-[#5f6b85]";
  }
}

function getRelativeTimeClassName(tone: RelativeTimeTone): string {
  switch (tone) {
    case "live":
      return "border-[#ccebd6] bg-[#eefaf2] text-[#0f7a4b]";
    case "fresh":
      return "border-[#f2d996] bg-[#fff8e1] text-[#9a6b00]";
    case "recent":
      return "border-[#e8dcba] bg-[#fdf7e8] text-[#8a6a18]";
    case "normal":
      return "border-[#d9deea] bg-[#f6f8fb] text-[#5f6b85]";
    default:
      return "border-[#e1e6ef] bg-white text-[#69758c]";
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
    return "border-[#f4c7c3] bg-[#fff3f2] text-[#b5473c]";
  }
  if (direction === "IN") {
    return "border-[#ccebd6] bg-[#eefaf2] text-[#0f7a4b]";
  }
  return "border-[#d9deea] bg-[#f6f8fb] text-[#5f6b85]";
}

function maskAccountNumber(value: string | null | undefined): string | null {
  const accountNumber = String(value || "").replace(/\s+/g, "").trim();
  if (!accountNumber) {
    return null;
  }
  if (accountNumber.length <= 8) {
    return accountNumber;
  }
  return `${accountNumber.slice(0, 3)}-${accountNumber.slice(-4)}`;
}

function buildIdentityTags(identity: PartyIdentity | null | undefined): string[] {
  if (!identity) {
    return [];
  }

  return [
    identity.badgeLabel,
    identity.nickname,
    identity.storeName,
    identity.storecode ? `store:${identity.storecode}` : null,
    identity.userType ? `type:${identity.userType}` : null,
    identity.bankName && maskAccountNumber(identity.accountNumber)
      ? `${identity.bankName} ${maskAccountNumber(identity.accountNumber)}`
      : null,
  ].filter((value): value is string => Boolean(value));
}

function isExternalOnlyInsightEvent(event: UsdtTransactionHashRealtimeEvent): boolean {
  return event.source === "thirdweb.insight.tokens.transfers";
}

function getEventDisplayTimeValue(event: UsdtTransactionHashRealtimeEvent): string | null {
  return event.publishedAt || event.minedAt || event.createdAt || null;
}

function getEventChainTimeValue(event: UsdtTransactionHashRealtimeEvent): string | null {
  return event.minedAt || event.createdAt || null;
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
          const rightTs = Math.max(
            toTimestamp(getEventDisplayTimeValue(right.data)),
            toTimestamp(getEventChainTimeValue(right.data)),
          );
          const leftTs = Math.max(
            toTimestamp(getEventDisplayTimeValue(left.data)),
            toTimestamp(getEventChainTimeValue(left.data)),
          );
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
      latestDetectedAt: getEventDisplayTimeValue(events[0]?.data) || null,
    };
  }, [events, normalizedAddress]);

  const addressExplorerUrl = getExplorerAddressUrl(addressParam);
  const chainLabel = String(configuredChain || "bsc").toUpperCase();
  const chainLogoSrc = getChainLogoSrc();
  const chainMarketLabel = getChainMarketLabel();

  return (
    <div className="min-h-screen bg-[#f4f1ea] text-[#1f2937]">
      <div className="mx-auto flex w-full max-w-[1520px] flex-col gap-4 px-3 py-4 sm:px-6 sm:py-5 lg:px-8">
        <section className="overflow-hidden rounded-[24px] border border-[#d8d2c4] bg-white shadow-[0_30px_90px_-54px_rgba(64,45,0,0.32)]">
          <div className="grid gap-0 lg:grid-cols-[minmax(0,1.1fr)_minmax(340px,0.9fr)]">
            <div className="bg-[#111827] px-4 py-4 sm:px-6 sm:py-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex min-w-0 items-start gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[18px] border border-white/10 bg-white/5 sm:h-16 sm:w-16 sm:rounded-[20px]">
                    <Image src={chainLogoSrc} alt={chainMarketLabel} width={42} height={42} className="h-8 w-8 object-contain sm:h-10 sm:w-10" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#f8d561]">
                      Scan / Token Txns
                    </div>
                    <h1 className="mt-2 text-[1.65rem] font-semibold tracking-tight text-white sm:text-[30px]">
                      Address Token Transfers
                    </h1>
                    <p className="mt-2 max-w-3xl text-sm leading-6 text-[#c9d1de]">
                      Stored scan events and address-scoped insight lookups are merged into a BscScan-style token transfer view.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${getConnectionClassName(connectionState)}`}>
                    <span className="h-2 w-2 rounded-full bg-current" />
                    {connectionState}
                  </span>
                  <Link
                    href={`/${lang}/scan`}
                    className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-white/10"
                  >
                    All Transactions
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(addressParam);
                    }}
                    className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-white/10"
                  >
                    Copy Address
                  </button>
                  <a
                    href={addressExplorerUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full bg-[#f0b90b] px-3 py-1.5 text-xs font-semibold text-[#1d1f24] transition hover:bg-[#e0aa05]"
                  >
                    Open in BscScan
                  </a>
                </div>
              </div>
            </div>

            <div className="border-t border-[#e9dcc0] bg-[linear-gradient(180deg,_#fff6db_0%,_#fffdf7_100%)] px-4 py-4 sm:px-6 sm:py-5 lg:border-l lg:border-t-0">
              <div className="grid gap-2.5">
                <div className="rounded-[20px] border border-[#ecdca6] bg-white/80 px-3.5 py-3.5 sm:px-4 sm:py-4">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#8a6a18]">Address</div>
                  <div className="mt-2 break-all text-sm font-semibold text-[#1d1f24]">{addressParam}</div>
                  <div className="mt-1 text-sm text-[#6c7483]">Wallet-specific USDT transfer history</div>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-[#f0e5c4] bg-[#fff8e5] px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#7b6a39] sm:px-7">
            Token transfer history for a single wallet view
          </div>

          <div className="grid gap-3 px-4 py-4 sm:px-6 sm:py-5 lg:grid-cols-[minmax(0,1.55fr)_minmax(320px,0.9fr)]">
            <div className="rounded-[20px] border border-[#111827] bg-gradient-to-br from-[#111827] via-[#1a2438] to-[#1d293f] p-4 text-white shadow-[0_26px_70px_-45px_rgba(17,24,39,0.88)] sm:p-5">
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

              <div className="mt-4 grid gap-2.5 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-white/5 px-3.5 py-3 sm:px-4">
                  <div className="text-[11px] uppercase tracking-[0.22em] text-slate-400">Total Events</div>
                  <div className="mt-2 text-2xl font-semibold text-white">{totals.totalCount.toLocaleString()}</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 px-3.5 py-3 sm:px-4">
                  <div className="text-[11px] uppercase tracking-[0.22em] text-slate-400">Outgoing</div>
                  <div className="mt-2 text-2xl font-semibold text-rose-300">{totals.outgoingCount.toLocaleString()}</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 px-3.5 py-3 sm:px-4">
                  <div className="text-[11px] uppercase tracking-[0.22em] text-slate-400">Incoming</div>
                  <div className="mt-2 text-2xl font-semibold text-emerald-300">{totals.incomingCount.toLocaleString()}</div>
                </div>
              </div>
            </div>

            <div className="grid gap-2.5 sm:grid-cols-3 lg:grid-cols-1">
              <div className="rounded-[20px] border border-[#e8dcc0] bg-white px-4 py-3.5 shadow-sm sm:px-5 sm:py-4">
                <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#8a6a18]">Observed USDT</div>
                <div className="mt-2 text-[28px] font-semibold tracking-tight text-[#1d1f24]">
                  {formatUsdt(totals.totalUsdt)}
                </div>
              </div>
              <div className="rounded-[20px] border border-[#e8dcc0] bg-white px-4 py-3.5 shadow-sm sm:px-5 sm:py-4">
                <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#8a6a18]">Latest Detected</div>
                <div className="mt-2 text-base font-semibold text-[#1d1f24]">
                  {formatDateTime(totals.latestDetectedAt)}
                </div>
              </div>
              <div className="rounded-[20px] border border-[#e8dcc0] bg-white px-4 py-3.5 shadow-sm sm:px-5 sm:py-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#8a6a18]">Realtime Status</div>
                    <div className="mt-2 text-sm font-medium text-[#364152]">
                      {isSyncing ? "Snapshot syncing..." : "Ably live streaming"}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      void syncFromApi();
                    }}
                    className="rounded-full border border-[#eadcb6] bg-[#fffbef] px-3 py-1.5 text-xs font-semibold text-[#7b6a39] transition hover:border-[#dfc980] hover:bg-[#fff7db]"
                  >
                    Refresh
                  </button>
                </div>
                {connectionErrorMessage ? (
                  <p className="mt-3 text-xs text-[#b5473c]">{connectionErrorMessage}</p>
                ) : null}
                {syncErrorMessage ? (
                  <p className="mt-2 text-xs text-[#9a6b00]">{syncErrorMessage}</p>
                ) : null}
              </div>
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-[24px] border border-[#e8dcc0] bg-white shadow-[0_18px_60px_-42px_rgba(64,45,0,0.28)]">
          <div className="flex flex-col gap-3 border-b border-[#f0e5c4] bg-[#fff8e5] px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-4">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.24em] text-[#7b6a39]">
                Token Transfers
              </div>
              <h2 className="mt-1 text-lg font-semibold text-[#1d1f24]">Latest USDT transaction hash registrations</h2>
            </div>
            <div className="text-xs text-[#5f6b85]">
              address filter: <span className="font-semibold text-[#1d1f24]">{formatShortAddress(addressParam)}</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-[#fff8e5] text-[11px] font-semibold uppercase tracking-[0.22em] text-[#7b6a39]">
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
                    <td colSpan={8} className="px-6 py-16 text-center text-sm text-[#5f6b85]">
                      아직 표시할 transaction hash 이벤트가 없습니다.
                    </td>
                  </tr>
                ) : (
                  events.map((item) => {
                    const direction = getDirection(item.data, normalizedAddress);
                    const detectedTime = getEventDisplayTimeValue(item.data);
                    const chainTime = getEventChainTimeValue(item.data);
                    const relativeTime = getRelativeTimeInfo(detectedTime || item.data.createdAt, nowMs);
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
                        className={`${isHighlighted ? "bg-[#fff8e5]" : "bg-white"} transition-colors`}
                      >
                        <td className="px-4 py-4 align-top sm:px-6">
                          <div className="flex flex-col gap-1">
                            <a
                              href={txHref}
                              target={isExternalOnlyInsightEvent(item.data) ? "_blank" : undefined}
                              rel={isExternalOnlyInsightEvent(item.data) ? "noreferrer" : undefined}
                              className="font-semibold text-[#0784c3] underline decoration-[#7cc2e4] underline-offset-4 hover:text-[#05679d]"
                              title={item.data.transactionHash}
                            >
                              {formatShortHash(item.data.transactionHash)}
                            </a>
                            <div className="flex items-center gap-2 text-xs text-[#5f6b85]">
                              <span>{item.data.chain || configuredChain} · {item.data.tokenSymbol}</span>
                              {isExternalOnlyInsightEvent(item.data) ? (
                                <span className="rounded-full border border-[#d9deea] bg-[#f6f8fb] px-2 py-0.5 text-[10px] font-semibold text-[#5f6b85]">
                                  insight
                                </span>
                              ) : null}
                              <a href={txUrl} target="_blank" rel="noreferrer" className="hover:text-[#0784c3]">
                                external
                              </a>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 align-top">
                          <div
                            className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${getRelativeTimeClassName(relativeTime.tone)}`}
                            title={formatDateTime(detectedTime)}
                          >
                            {relativeTime.relativeLabel}
                          </div>
                          <div className="mt-2 text-[11px] text-[#5f6b85]">Detected {formatDateTime(detectedTime)}</div>
                          {chainTime && chainTime !== detectedTime ? (
                            <div className="mt-1 text-[11px] text-[#8d95a5]">On-chain {formatDateTime(chainTime)}</div>
                          ) : null}
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
                                className="font-medium text-[#1d1f24] hover:text-[#0784c3]"
                                title={item.data.fromWalletAddress}
                              >
                                {formatShortAddress(item.data.fromWalletAddress)}
                              </Link>
                            ) : (
                              <span className="font-medium text-[#1d1f24]">-</span>
                            )}
                            <div className="truncate text-xs text-[#5f6b85]" title={item.data.fromLabel || ""}>
                              {item.data.fromLabel || "-"}
                            </div>
                            {fromIdentityTags.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {fromIdentityTags.map((tag) => (
                                  <span
                                    key={`${item.id}-from-${tag}`}
                                    className="rounded-full border border-[#eadcb6] bg-[#fffbef] px-2 py-0.5 text-[10px] font-medium text-[#7b6a39]"
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            ) : null}
                            <a href={fromUrl} target="_blank" rel="noreferrer" className="text-[11px] text-[#8d95a5] hover:text-[#0784c3]">
                              external explorer
                            </a>
                          </div>
                        </td>
                        <td className="px-4 py-4 align-top">
                          <div className="flex max-w-[220px] flex-col gap-1">
                            {item.data.toWalletAddress ? (
                              <Link
                                href={`/${lang}/scan/address/${item.data.toWalletAddress}/tokentxns`}
                                className="font-medium text-[#1d1f24] hover:text-[#0784c3]"
                                title={item.data.toWalletAddress}
                              >
                                {formatShortAddress(item.data.toWalletAddress)}
                              </Link>
                            ) : (
                              <span className="font-medium text-[#1d1f24]">-</span>
                            )}
                            <div className="truncate text-xs text-[#5f6b85]" title={item.data.toLabel || ""}>
                              {item.data.toLabel || "-"}
                            </div>
                            {toIdentityTags.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {toIdentityTags.map((tag) => (
                                  <span
                                    key={`${item.id}-to-${tag}`}
                                    className="rounded-full border border-[#eadcb6] bg-[#fffbef] px-2 py-0.5 text-[10px] font-medium text-[#7b6a39]"
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            ) : null}
                            <a href={toUrl} target="_blank" rel="noreferrer" className="text-[11px] text-[#8d95a5] hover:text-[#0784c3]">
                              external explorer
                            </a>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-right align-top">
                          <div className="font-semibold text-[#0f7a4b]">{formatUsdt(item.data.amountUsdt)}</div>
                          <div className="mt-1 text-xs text-[#5f6b85]">USDT</div>
                        </td>
                        <td className="px-4 py-4 align-top">
                          <div className="font-medium text-[#1d1f24]">{item.data.tradeId || "-"}</div>
                          <div className="mt-1 text-xs text-[#5f6b85]">{item.data.orderId || "-"}</div>
                        </td>
                        <td className="px-4 py-4 align-top">
                          <div className="flex flex-col gap-1">
                            <span className="inline-flex w-fit rounded-full border border-[#d9deea] bg-[#f6f8fb] px-2 py-1 text-xs font-medium text-[#5f6b85]">
                              {item.data.status || "registered"}
                            </span>
                            <div className="text-xs text-[#5f6b85]">{item.data.store?.code || "-"}</div>
                            <div className="truncate text-xs text-[#8d95a5]" title={item.data.source}>
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
