"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  startTransition,
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";
import * as Ably from "ably";

import { chain as configuredChain } from "@/app/config/contractAddresses";
import {
  type UsdtTransactionHashRealtimeEvent,
} from "@lib/ably/constants";
import { getRelativeTimeInfo, type RelativeTimeTone } from "@lib/realtime/timeAgo";
import {
  formatDateTime,
  formatShortAddress,
  formatShortHash,
  formatUsdt,
  getExplorerBaseUrl,
  getExplorerTxUrl,
  normalizeAddress,
  resolveScanFeedMeta,
  toTimestamp,
  type ScanFeedMeta,
  type ScanSnapshotResponse,
} from "./scan-feed-shared";

type FeedItem = {
  id: string;
  data: UsdtTransactionHashRealtimeEvent;
  highlightUntil: number;
};

type PartySummary = {
  headline: string;
  subline: string;
  href: string | null;
  addresses: string[];
};

type TransactionRow = {
  id: string;
  transactionHash: string;
  chain: string | null;
  status: string | null;
  totalUsdt: number;
  transferCount: number;
  fromSummary: PartySummary;
  toSummary: PartySummary;
  latestTimestamp: number;
  timeValue: string | null;
  highlightUntil: number;
  methodLabel: string;
  addresses: string[];
};

const MAX_EVENTS = 180;
const RESYNC_LIMIT = 180;
const RESYNC_INTERVAL_MS = 10_000;
const NEW_EVENT_HIGHLIGHT_MS = 4_800;
const TIME_AGO_TICK_MS = 5_000;

function getEventKey(event: UsdtTransactionHashRealtimeEvent, fallbackId = ""): string {
  const queueId = String(event.queueId || "").trim();
  if (queueId) {
    return queueId;
  }

  const idempotencyKey = String(event.idempotencyKey || "").trim();
  if (idempotencyKey) {
    return idempotencyKey;
  }

  const transactionHash = String(event.transactionHash || "").trim();
  const fromWalletAddress = normalizeAddress(event.fromWalletAddress);
  const toWalletAddress = normalizeAddress(event.toWalletAddress);
  const amountUsdt = Number(event.amountUsdt || 0);

  return (
    fallbackId
    || `${transactionHash}:${fromWalletAddress}:${toWalletAddress}:${amountUsdt}:${event.createdAt || event.publishedAt || ""}`
  );
}

function getConnectionClassName(state: Ably.ConnectionState): string {
  switch (state) {
    case "connected":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "connecting":
    case "initialized":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "disconnected":
    case "suspended":
      return "border-rose-200 bg-rose-50 text-rose-700";
    default:
      return "border-slate-200 bg-slate-100 text-slate-600";
  }
}

function getRelativeTimeClassName(tone: RelativeTimeTone): string {
  switch (tone) {
    case "live":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "fresh":
      return "border-sky-200 bg-sky-50 text-sky-700";
    case "recent":
      return "border-indigo-200 bg-indigo-50 text-indigo-700";
    case "normal":
      return "border-slate-200 bg-slate-100 text-slate-600";
    default:
      return "border-slate-200 bg-white text-slate-500";
  }
}

function getStatusLabel(status: string | null | undefined): string {
  if (status === "confirmed") {
    return "Success";
  }
  if (!status) {
    return "Queued";
  }
  return status.replace(/[-_]/g, " ");
}

function getStatusTone(status: string | null | undefined): string {
  if (status === "confirmed") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }
  if (status === "pending") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }
  return "border-slate-200 bg-slate-100 text-slate-600";
}

function buildPartySummary(entries: FeedItem[], side: "from" | "to", lang: string): PartySummary {
  const addressMap = new Map<string, string>();

  for (const entry of entries) {
    const address =
      side === "from"
        ? normalizeAddress(entry.data.fromWalletAddress)
        : normalizeAddress(entry.data.toWalletAddress);
    if (!address) {
      continue;
    }

    const label = String(
      side === "from" ? entry.data.fromLabel || "" : entry.data.toLabel || "",
    ).trim();

    if (!addressMap.has(address)) {
      addressMap.set(address, label);
    }
  }

  const addresses = Array.from(addressMap.keys());
  if (addresses.length === 0) {
    return {
      headline: "-",
      subline: side === "from" ? "Unknown sender" : "Unknown recipient",
      href: null,
      addresses: [],
    };
  }

  if (addresses.length === 1) {
    const [address] = addresses;
    const label = addressMap.get(address) || "Tagged wallet";
    return {
      headline: formatShortAddress(address),
      subline: label,
      href: `/${lang}/scan/address/${address}/tokentxns`,
      addresses,
    };
  }

  return {
    headline: side === "from" ? "Multiple senders" : "Multiple recipients",
    subline: `${addresses.length} monitored wallets`,
    href: null,
    addresses,
  };
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

  const deferredSearchQuery = useDeferredValue(searchQuery);
  const clientId = useMemo(() => `scan-feed-${Math.random().toString(36).slice(2, 10)}`, []);
  const chainLabel = configuredChain === "bsc" ? "BNB Smart Chain" : String(configuredChain || "bsc").toUpperCase();
  const explorerHost = getExplorerBaseUrl().replace("https://", "");

  const resolvedFeedMeta = useMemo(() => resolveScanFeedMeta(feedMeta), [feedMeta]);

  const upsertEvents = useCallback((incomingEvents: UsdtTransactionHashRealtimeEvent[], highlightNew = true) => {
    if (incomingEvents.length === 0) {
      return;
    }

    const now = Date.now();

    setEvents((previousEvents) => {
      const map = new Map(previousEvents.map((item) => [item.id, item]));

      for (const event of incomingEvents) {
        const nextId = getEventKey(event, event.eventId || "");
        const existing = map.get(nextId);

        if (existing) {
          map.set(nextId, {
            ...existing,
            data: event,
            highlightUntil:
              highlightNew && existing.highlightUntil <= now
                ? now + NEW_EVENT_HIGHLIGHT_MS
                : existing.highlightUntil,
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
            toTimestamp(right.data.minedAt),
            toTimestamp(right.data.createdAt),
            toTimestamp(right.data.publishedAt),
          );
          const leftTs = Math.max(
            toTimestamp(left.data.minedAt),
            toTimestamp(left.data.createdAt),
            toTimestamp(left.data.publishedAt),
          );
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
      startTransition(() => {
        upsertEvents(
          Array.isArray(data.result) ? (data.result as UsdtTransactionHashRealtimeEvent[]) : [],
          false,
        );
        setFeedMeta(data.meta || null);
        setSyncErrorMessage(null);
      });
    } catch (error) {
      setSyncErrorMessage(error instanceof Error ? error.message : "failed to sync");
    } finally {
      setIsSyncing(false);
    }
  }, [upsertEvents]);

  useEffect(() => {
    const realtime = new Ably.Realtime({
      authUrl: `${resolvedFeedMeta.authUrl}?public=1&stream=usdt-txhash&clientId=${clientId}`,
    });

    const channel = realtime.channels.get(resolvedFeedMeta.channel);

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

      startTransition(() => {
        upsertEvents(
          [
            {
              ...data,
              eventId: data.eventId || String(message.id || ""),
            },
          ],
          true,
        );
      });
    };

    realtime.connection.on(onConnectionStateChange);
    void channel.subscribe(resolvedFeedMeta.eventName, onMessage);

    return () => {
      channel.unsubscribe(resolvedFeedMeta.eventName, onMessage);
      realtime.connection.off(onConnectionStateChange);
      realtime.close();
    };
  }, [clientId, resolvedFeedMeta.authUrl, resolvedFeedMeta.channel, resolvedFeedMeta.eventName, syncFromApi, upsertEvents]);

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

  const transactionRows = useMemo(() => {
    const grouped = new Map<
      string,
      {
        transactionHash: string;
        chain: string | null;
        status: string | null;
        totalUsdt: number;
        entries: FeedItem[];
        latestTimestamp: number;
        timeValue: string | null;
        highlightUntil: number;
      }
    >();

    for (const item of events) {
      const transactionHash = String(item.data.transactionHash || "").trim();
      if (!transactionHash) {
        continue;
      }

      const nextTimestamp = Math.max(
        toTimestamp(item.data.minedAt),
        toTimestamp(item.data.createdAt),
        toTimestamp(item.data.publishedAt),
      );
      const nextTimeValue = item.data.minedAt || item.data.createdAt || item.data.publishedAt || null;
      const existing = grouped.get(transactionHash);

      if (!existing) {
        grouped.set(transactionHash, {
          transactionHash,
          chain: item.data.chain || null,
          status: item.data.status || null,
          totalUsdt: Number(item.data.amountUsdt || 0),
          entries: [item],
          latestTimestamp: nextTimestamp,
          timeValue: nextTimeValue,
          highlightUntil: item.highlightUntil,
        });
        continue;
      }

      existing.chain = existing.chain || item.data.chain || null;
      existing.status = existing.status || item.data.status || null;
      existing.totalUsdt += Number(item.data.amountUsdt || 0);
      existing.entries.push(item);
      existing.highlightUntil = Math.max(existing.highlightUntil, item.highlightUntil);

      if (nextTimestamp > existing.latestTimestamp) {
        existing.latestTimestamp = nextTimestamp;
        existing.timeValue = nextTimeValue;
      }
    }

    return Array.from(grouped.values())
      .map((group): TransactionRow => {
        const orderedEntries = [...group.entries].sort((left, right) => {
          const rightAmount = Number(right.data.amountUsdt || 0);
          const leftAmount = Number(left.data.amountUsdt || 0);
          if (rightAmount !== leftAmount) {
            return rightAmount - leftAmount;
          }
          return (
            Math.max(
              toTimestamp(right.data.minedAt),
              toTimestamp(right.data.createdAt),
              toTimestamp(right.data.publishedAt),
            )
            - Math.max(
              toTimestamp(left.data.minedAt),
              toTimestamp(left.data.createdAt),
              toTimestamp(left.data.publishedAt),
            )
          );
        });
        const fromSummary = buildPartySummary(orderedEntries, "from", lang);
        const toSummary = buildPartySummary(orderedEntries, "to", lang);
        const methodLabel = orderedEntries.length > 1 ? "Batch Transfer" : "Transfer";

        return {
          id: group.transactionHash,
          transactionHash: group.transactionHash,
          chain: group.chain,
          status: group.status,
          totalUsdt: group.totalUsdt,
          transferCount: orderedEntries.length,
          fromSummary,
          toSummary,
          latestTimestamp: group.latestTimestamp,
          timeValue: group.timeValue,
          highlightUntil: group.highlightUntil,
          methodLabel,
          addresses: Array.from(new Set([...fromSummary.addresses, ...toSummary.addresses])),
        };
      })
      .sort((left, right) => right.latestTimestamp - left.latestTimestamp);
  }, [events, lang]);

  const filteredRows = useMemo(() => {
    const normalizedQuery = deferredSearchQuery.trim().toLowerCase();
    if (!normalizedQuery) {
      return transactionRows;
    }

    return transactionRows.filter((row) => {
      const candidates = [
        row.transactionHash,
        row.methodLabel,
        row.status,
        row.fromSummary.headline,
        row.fromSummary.subline,
        row.toSummary.headline,
        row.toSummary.subline,
        ...row.addresses,
      ];

      return candidates.some((candidate) => String(candidate || "").toLowerCase().includes(normalizedQuery));
    });
  }, [deferredSearchQuery, transactionRows]);

  const totals = useMemo(() => {
    const activeWallets = new Set(filteredRows.flatMap((item) => item.addresses));
    const totalTransferLogs = filteredRows.reduce((sum, item) => sum + item.transferCount, 0);
    const totalUsdt = filteredRows.reduce((sum, item) => sum + item.totalUsdt, 0);

    return {
      transactions: filteredRows.length,
      transferLogs: totalTransferLogs,
      activeWallets: activeWallets.size,
      totalUsdt,
      latestRecordAt: filteredRows[0]?.timeValue || null,
    };
  }, [filteredRows]);

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

  const integrationLinks = [
    {
      id: "ingest",
      title: "Ingest API",
      description: "HMAC worker ingress",
    },
    {
      id: "thirdweb",
      title: "thirdweb Webhook",
      description: "USDT transfer filters",
    },
    {
      id: "snapshot",
      title: "Snapshot API",
      description: "Public resync endpoint",
    },
    {
      id: "ably",
      title: "Ably Stream",
      description: "Realtime broadcast channel",
    },
  ];

  return (
    <div className="min-h-screen bg-[#f5f7fb] text-[#1f2b46]">
      <div className="mx-auto flex w-full max-w-[1480px] flex-col gap-5 px-4 py-5 sm:px-6 lg:px-8">
        <section className="overflow-hidden rounded-[28px] border border-[#d7e3f5] bg-white shadow-[0_32px_96px_-60px_rgba(29,78,216,0.45)]">
          <div className="border-b border-[#e5edf8] bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.18),_transparent_42%),linear-gradient(180deg,_#ffffff_0%,_#f8fbff_100%)] px-5 py-6 sm:px-7">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
              <div className="max-w-3xl">
                <div className="text-[11px] font-semibold uppercase tracking-[0.36em] text-[#5f84c6]">
                  {chainLabel} Explorer
                </div>
                <h1 className="mt-3 text-[2rem] font-semibold tracking-tight text-[#1f2b46] sm:text-[2.45rem]">
                  Live USDT Transactions
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
                  BscScan-inspired transaction feed for verified USDT transfers detected on monitored smart accounts.
                  Infrastructure details have been moved to a dedicated integrations page.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${getConnectionClassName(connectionState)}`}>
                  <span className="scan-live-dot h-2 w-2 rounded-full bg-current" />
                  {connectionState}
                </span>
                <Link
                  href={`/${lang}/scan/integrations`}
                  className="rounded-full border border-[#cfe0fa] bg-[#f8fbff] px-4 py-2 text-sm font-semibold text-[#2354a8] transition hover:border-[#b8cff6] hover:bg-white"
                >
                  Infrastructure Details
                </Link>
                <a
                  href={getExplorerBaseUrl()}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full border border-[#d7e3f5] bg-white px-4 py-2 text-sm font-semibold text-[#1f2b46] transition hover:border-[#bfd2f4] hover:text-[#2354a8]"
                >
                  Open {explorerHost}
                </a>
              </div>
            </div>

            <form onSubmit={handleSearchSubmit} className="mt-6 rounded-[24px] border border-[#d7e3f5] bg-white p-3 shadow-[0_18px_45px_-38px_rgba(15,23,42,0.35)]">
              <div className="flex flex-col gap-3 md:flex-row">
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Search by transaction hash or address</div>
                  <input
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="0x..."
                    className="mt-2 h-12 w-full rounded-2xl border border-transparent bg-[#f8fbff] px-4 text-sm text-[#1f2b46] outline-none transition focus:border-[#b8cff6] focus:bg-white focus:ring-4 focus:ring-[#e8f1ff]"
                  />
                </div>
                <button
                  type="submit"
                  className="h-12 rounded-2xl bg-[#1f4fa8] px-5 text-sm font-semibold text-white transition hover:bg-[#183f88] md:self-end"
                >
                  Search Explorer
                </button>
              </div>
            </form>

            <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {integrationLinks.map((item) => (
                <Link
                  key={item.id}
                  href={`/${lang}/scan/integrations#${item.id}`}
                  className="group rounded-[22px] border border-[#d7e3f5] bg-white px-4 py-4 transition hover:-translate-y-0.5 hover:border-[#b7cef6] hover:shadow-[0_18px_38px_-32px_rgba(29,78,216,0.45)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-[#1f2b46]">{item.title}</div>
                      <div className="mt-1 text-xs text-slate-500">{item.description}</div>
                    </div>
                    <span className="rounded-full border border-[#d7e3f5] bg-[#f8fbff] px-2.5 py-1 text-[11px] font-semibold text-[#2354a8] transition group-hover:border-[#bfd2f4]">
                      Open
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div className="grid gap-4 px-5 py-5 sm:px-7 lg:grid-cols-4">
            <div className="rounded-[24px] border border-[#dfe8f7] bg-[#fbfdff] px-5 py-4 shadow-sm">
              <div className="text-[11px] font-semibold uppercase tracking-[0.26em] text-slate-500">Transactions</div>
              <div className="mt-2 text-[30px] font-semibold tracking-tight text-[#1f2b46]">{totals.transactions.toLocaleString()}</div>
            </div>
            <div className="rounded-[24px] border border-[#dfe8f7] bg-[#fbfdff] px-5 py-4 shadow-sm">
              <div className="text-[11px] font-semibold uppercase tracking-[0.26em] text-slate-500">Transfer Logs</div>
              <div className="mt-2 text-[30px] font-semibold tracking-tight text-[#1f2b46]">{totals.transferLogs.toLocaleString()}</div>
            </div>
            <div className="rounded-[24px] border border-[#dfe8f7] bg-[#fbfdff] px-5 py-4 shadow-sm">
              <div className="text-[11px] font-semibold uppercase tracking-[0.26em] text-slate-500">Observed USDT</div>
              <div className="mt-2 text-[30px] font-semibold tracking-tight text-emerald-600">{formatUsdt(totals.totalUsdt)}</div>
            </div>
            <div className="rounded-[24px] border border-[#dfe8f7] bg-[#fbfdff] px-5 py-4 shadow-sm">
              <div className="text-[11px] font-semibold uppercase tracking-[0.26em] text-slate-500">Active Wallets</div>
              <div className="mt-2 text-[30px] font-semibold tracking-tight text-[#1f2b46]">{totals.activeWallets.toLocaleString()}</div>
              <div className="mt-2 text-xs text-slate-500">Latest {formatDateTime(totals.latestRecordAt)}</div>
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-[28px] border border-[#d7e3f5] bg-white shadow-[0_22px_70px_-48px_rgba(15,23,42,0.24)]">
          <div className="border-b border-[#e5edf8] px-5 py-5 sm:px-7">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#5f84c6]">Latest Transactions</div>
                <h2 className="mt-2 text-xl font-semibold text-[#1f2b46]">Verified USDT transfers on monitored wallets</h2>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <span>{isSyncing ? "Snapshot syncing..." : "Realtime feed active"}</span>
                {connectionErrorMessage ? <span>· {connectionErrorMessage}</span> : null}
                {syncErrorMessage ? <span>· {syncErrorMessage}</span> : null}
              </div>
            </div>
          </div>

          <div className="hidden border-b border-[#e5edf8] bg-[#f8fbff] px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500 md:grid md:grid-cols-[1.55fr,0.92fr,0.92fr,1.1fr,1.1fr,0.92fr] md:gap-4 sm:px-7">
            <div>Txn Hash</div>
            <div>Method</div>
            <div>Age</div>
            <div>From</div>
            <div>To</div>
            <div>Amount</div>
          </div>

          {filteredRows.length > 0 ? (
            <div className="divide-y divide-[#edf2fb]">
              {filteredRows.map((row) => {
                const isHighlighted = row.highlightUntil > nowMs;
                const relativeTime = getRelativeTimeInfo(row.timeValue, nowMs);

                return (
                  <div
                    key={row.id}
                    className={`scan-live-row px-5 py-5 sm:px-7 ${isHighlighted ? "scan-live-row--highlight" : "bg-white"}`}
                  >
                    <div className="grid gap-4 md:grid-cols-[1.55fr,0.92fr,0.92fr,1.1fr,1.1fr,0.92fr]">
                      <div className="min-w-0">
                        <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400 md:hidden">Txn Hash</div>
                        <div className="mt-1 flex items-start gap-3">
                          <span className="inline-flex h-10 w-10 flex-none items-center justify-center rounded-2xl border border-[#d7e3f5] bg-[#f8fbff] text-xs font-semibold text-[#2354a8]">
                            {row.transferCount > 1 ? "B" : "T"}
                          </span>
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <Link
                                href={`/${lang}/scan/tx/${row.transactionHash}`}
                                className="text-sm font-semibold text-[#2354a8] transition hover:text-[#183f88]"
                                title={row.transactionHash}
                              >
                                {formatShortHash(row.transactionHash)}
                              </Link>
                              <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${getStatusTone(row.status)}`}>
                                {getStatusLabel(row.status)}
                              </span>
                            </div>
                            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                              <a
                                href={getExplorerTxUrl(row.transactionHash)}
                                target="_blank"
                                rel="noreferrer"
                                className="font-medium text-slate-400 transition hover:text-slate-600"
                              >
                                View on {explorerHost}
                              </a>
                              <span>{row.transferCount} transfer logs</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="min-w-0">
                        <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400 md:hidden">Method</div>
                        <div className="mt-1">
                          <span className="inline-flex rounded-full border border-[#cfe0fa] bg-[#eef5ff] px-3 py-1 text-xs font-semibold text-[#2354a8]">
                            {row.methodLabel}
                          </span>
                          <div className="mt-2 text-sm text-slate-500">{(row.chain || configuredChain || "bsc").toUpperCase()}</div>
                        </div>
                      </div>

                      <div className="min-w-0">
                        <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400 md:hidden">Age</div>
                        <div className="mt-1">
                          <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${getRelativeTimeClassName(relativeTime.tone)}`}>
                            {relativeTime.relativeLabel}
                          </span>
                          <div className="mt-2 text-sm text-slate-500">{formatDateTime(row.timeValue)}</div>
                        </div>
                      </div>

                      <div className="min-w-0">
                        <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400 md:hidden">From</div>
                        <div className="mt-1">
                          {row.fromSummary.href ? (
                            <Link
                              href={row.fromSummary.href}
                              className="text-sm font-semibold text-[#1f2b46] transition hover:text-[#2354a8]"
                              title={row.fromSummary.addresses[0]}
                            >
                              {row.fromSummary.headline}
                            </Link>
                          ) : (
                            <div className="text-sm font-semibold text-[#1f2b46]">{row.fromSummary.headline}</div>
                          )}
                          <div className="mt-2 text-xs leading-5 text-slate-500">{row.fromSummary.subline}</div>
                        </div>
                      </div>

                      <div className="min-w-0">
                        <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400 md:hidden">To</div>
                        <div className="mt-1">
                          {row.toSummary.href ? (
                            <Link
                              href={row.toSummary.href}
                              className="text-sm font-semibold text-[#1f2b46] transition hover:text-[#2354a8]"
                              title={row.toSummary.addresses[0]}
                            >
                              {row.toSummary.headline}
                            </Link>
                          ) : (
                            <div className="text-sm font-semibold text-[#1f2b46]">{row.toSummary.headline}</div>
                          )}
                          <div className="mt-2 text-xs leading-5 text-slate-500">{row.toSummary.subline}</div>
                        </div>
                      </div>

                      <div className="min-w-0">
                        <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400 md:hidden">Amount</div>
                        <div className="mt-1">
                          <div className="text-sm font-semibold text-[#1f2b46]">{formatUsdt(row.totalUsdt)} USDT</div>
                          <div className="mt-2 text-xs text-slate-500">{row.transferCount > 1 ? "Aggregated batch value" : "Single transfer value"}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="px-5 py-16 text-center text-sm text-slate-500 sm:px-7">
              No matching transactions yet.
            </div>
          )}
        </section>
      </div>

      <style jsx global>{`
        @keyframes scanRowEnter {
          0% {
            opacity: 0;
            transform: translateY(-16px) scale(0.985);
            filter: blur(7px);
          }
          55% {
            opacity: 1;
            transform: translateY(0) scale(1.006);
            filter: blur(0);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
            filter: blur(0);
          }
        }

        @keyframes scanRowGlow {
          0% {
            box-shadow:
              inset 0 0 0 1px rgba(96, 165, 250, 0.42),
              0 18px 42px -34px rgba(37, 99, 235, 0.38);
          }
          100% {
            box-shadow:
              inset 0 0 0 1px rgba(96, 165, 250, 0),
              0 0 0 0 rgba(37, 99, 235, 0);
          }
        }

        @keyframes scanDotPulse {
          0%,
          100% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.24);
            opacity: 0.52;
          }
        }

        .scan-live-row {
          position: relative;
          isolation: isolate;
          background: #ffffff;
        }

        .scan-live-row--highlight {
          animation:
            scanRowEnter 880ms cubic-bezier(0.18, 0.84, 0.2, 1),
            scanRowGlow 2500ms ease-out;
          background:
            linear-gradient(90deg, rgba(235, 244, 255, 0.95) 0%, rgba(255, 255, 255, 1) 18%, rgba(247, 251, 255, 0.96) 100%);
        }

        .scan-live-row--highlight::before {
          content: "";
          position: absolute;
          left: 0;
          top: 14px;
          bottom: 14px;
          width: 4px;
          border-radius: 999px;
          background: linear-gradient(180deg, #2563eb 0%, #60a5fa 100%);
          box-shadow: 0 0 18px rgba(59, 130, 246, 0.4);
        }

        .scan-live-dot {
          animation: scanDotPulse 1600ms ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
