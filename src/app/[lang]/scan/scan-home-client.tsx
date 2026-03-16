"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
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
  title: string | null;
  subline: string;
  bankLine: string | null;
  href: string | null;
  addresses: string[];
  identity: PartyIdentity | null;
};

type PartyIdentity = NonNullable<UsdtTransactionHashRealtimeEvent["fromIdentity"]>;

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
  chainTimeValue: string | null;
  highlightUntil: number;
  methodLabel: string;
  addresses: string[];
};

const MAX_EVENTS = 180;
const RESYNC_LIMIT = 180;
const RESYNC_INTERVAL_MS = 10_000;
const NEW_EVENT_HIGHLIGHT_MS = 4_800;
const TIME_AGO_TICK_MS = 5_000;

type ScanHomeClientPageProps = {
  initialSnapshot?: ScanSnapshotResponse | null;
};

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

function getEventDisplayTimestamp(event: UsdtTransactionHashRealtimeEvent): number {
  return Math.max(
    toTimestamp(event.publishedAt),
    toTimestamp(event.minedAt),
    toTimestamp(event.createdAt),
  );
}

function getEventDisplayTimeValue(event: UsdtTransactionHashRealtimeEvent): string | null {
  return event.publishedAt || event.minedAt || event.createdAt || null;
}

function getEventChainTimeValue(event: UsdtTransactionHashRealtimeEvent): string | null {
  return event.minedAt || event.createdAt || null;
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
    return "border-[#ccebd6] bg-[#eefaf2] text-[#0f7a4b]";
  }
  if (status === "pending") {
    return "border-[#f2d996] bg-[#fff8e1] text-[#9a6b00]";
  }
  return "border-[#d9deea] bg-[#f6f8fb] text-[#5f6b85]";
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
    return "ETH Mainnet";
  }
  if (configuredChain === "polygon") {
    return "Polygon PoS";
  }
  if (configuredChain === "arbitrum") {
    return "Arbitrum One";
  }
  return "BNB Smart Chain";
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

function getIdentityBadgeClassName(identity: PartyIdentity | null | undefined): string {
  const badgeLabel = String(identity?.badgeLabel || "").trim();
  if (badgeLabel === "Buyer Wallet") {
    return "border-[#d4d4d8] bg-[#fafafa] text-[#3f3f46]";
  }
  if (badgeLabel === "Store Wallet") {
    return "border-[#111111] bg-[#111111] text-white";
  }
  return "border-[#d4d4d8] bg-white text-[#52525b]";
}

function getIdentityPanelClassName(identity: PartyIdentity | null | undefined): string {
  const badgeLabel = String(identity?.badgeLabel || "").trim();
  if (badgeLabel === "Buyer Wallet") {
    return "border-[#e4e4e7] bg-[#fafafa]";
  }
  if (badgeLabel === "Store Wallet") {
    return "border-[#d4d4d8] bg-[#f5f5f5]";
  }
  return "border-[#e4e4e7] bg-white";
}

function buildIdentitySubline(identity: PartyIdentity | null | undefined): string | null {
  if (!identity) {
    return null;
  }

  const brandLine = identity.storeName || (identity.storecode ? `@${identity.storecode}` : null);
  if (identity.badgeLabel && brandLine) {
    return `${identity.badgeLabel} · ${brandLine}`;
  }
  if (identity.badgeLabel && identity.nickname) {
    return `${identity.badgeLabel} · ${identity.nickname}`;
  }
  return brandLine || identity.nickname || identity.badgeLabel || null;
}

function buildIdentityTitle(identity: PartyIdentity | null | undefined, fallbackLabel: string | null): string | null {
  if (!identity) {
    return fallbackLabel;
  }

  return (
    identity.nickname
    || identity.accountHolder
    || identity.storeName
    || (identity.storecode ? `@${identity.storecode}` : null)
    || fallbackLabel
  );
}

function buildIdentityBankLine(identity: PartyIdentity | null | undefined): string | null {
  if (!identity) {
    return null;
  }

  const maskedAccount = maskAccountNumber(identity.accountNumber);
  const parts = [
    identity.bankName,
    maskedAccount,
    identity.accountHolder && identity.accountHolder !== identity.nickname ? identity.accountHolder : null,
  ].filter((value): value is string => Boolean(value));

  return parts.length > 0 ? parts.join(" · ") : null;
}

function getIdentityAvatarText(identity: PartyIdentity | null | undefined, fallback: string): string {
  const source =
    identity?.storeName
    || identity?.nickname
    || identity?.accountHolder
    || identity?.storecode
    || fallback;
  const normalized = String(source || "").trim();
  return normalized ? normalized.slice(0, 2).toUpperCase() : "WL";
}

function buildPartySummary(entries: FeedItem[], side: "from" | "to", lang: string): PartySummary {
  const addressMap = new Map<string, { label: string; identity: PartyIdentity | null }>();

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
    const identity =
      side === "from"
        ? (entry.data.fromIdentity || null)
        : (entry.data.toIdentity || null);

    if (!addressMap.has(address)) {
      addressMap.set(address, {
        label,
        identity,
      });
    }
  }

  const addresses = Array.from(addressMap.keys());
  if (addresses.length === 0) {
    return {
      headline: "-",
      title: null,
      subline: side === "from" ? "Unknown sender" : "Unknown recipient",
      bankLine: null,
      href: null,
      addresses: [],
      identity: null,
    };
  }

  if (addresses.length === 1) {
    const [address] = addresses;
    const entry = addressMap.get(address);
    const label = entry?.label || "Tagged wallet";
    const identity = entry?.identity || null;
    const subline = buildIdentitySubline(identity) || label;
    return {
      headline: formatShortAddress(address),
      title: buildIdentityTitle(identity, label),
      subline,
      bankLine: buildIdentityBankLine(identity),
      href: `/${lang}/scan/address/${address}/tokentxns`,
      addresses,
      identity,
    };
  }

  return {
    headline: side === "from" ? "Multiple senders" : "Multiple recipients",
    title: null,
    subline: `${addresses.length} monitored wallets`,
    bankLine: null,
    href: null,
    addresses,
    identity: null,
  };
}

function PartyIdentityCard({ summary }: { summary: PartySummary }) {
  const identity = summary.identity;
  const hasIdentity = Boolean(
    identity
    && (
      summary.title
      || identity.badgeLabel
      || identity.storeName
      || identity.storecode
      || summary.bankLine
    ),
  );

  if (!hasIdentity) {
    return (
      <div className="mt-1.5 text-[11px] leading-4 text-[#71717a]">
        {summary.subline}
      </div>
    );
  }

  const compactMeta =
    identity?.badgeLabel === "Store Wallet"
      ? [
          identity?.storeName,
          identity?.storecode ? `@${identity.storecode}` : null,
        ].filter((value): value is string => Boolean(value)).join(" · ")
      : summary.bankLine || summary.subline;

  return (
    <div className={`mt-2 overflow-hidden rounded-[16px] border px-2.5 py-2 ${getIdentityPanelClassName(identity)}`}>
      <div className="flex items-center gap-2.5">
        <div className="relative flex h-8 w-8 flex-none items-center justify-center overflow-hidden rounded-[12px] border border-[#e4e4e7] bg-white text-[10px] font-semibold text-[#27272a]">
          <span>{getIdentityAvatarText(identity, summary.headline)}</span>
          {identity?.storeLogo ? (
            <img
              src={identity.storeLogo}
              alt={identity.storeName || summary.title || "wallet"}
              className="absolute inset-0 h-full w-full object-cover"
              onError={(event) => {
                event.currentTarget.style.display = "none";
              }}
            />
          ) : null}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            {identity?.badgeLabel ? (
              <span className={`inline-flex rounded-full border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] ${getIdentityBadgeClassName(identity)}`}>
                {identity.badgeLabel}
              </span>
            ) : null}
            {summary.title ? (
              <div className="min-w-0 truncate text-[12px] font-semibold text-[#18181b]">
                {summary.title}
              </div>
            ) : null}
          </div>

          {compactMeta ? (
            <div className="mt-1 truncate text-[11px] leading-4 text-[#71717a]">
              {compactMeta}
            </div>
          ) : (
            <div className="mt-1 truncate text-[11px] leading-4 text-[#71717a]">
              {summary.subline}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function getCompactLinkClassName() {
  return "text-sm font-semibold text-[#18181b] transition hover:text-[#52525b]";
}

function getTableStatusTone(status: string | null | undefined): string {
  if (status === "confirmed") {
    return "border-[#111111] bg-[#111111] text-white";
  }
  if (status === "pending") {
    return "border-[#d4d4d8] bg-white text-[#3f3f46]";
  }
  return "border-[#e4e4e7] bg-[#fafafa] text-[#52525b]";
}

function buildInitialFeedItems(initialSnapshot: ScanSnapshotResponse | null | undefined): FeedItem[] {
  const initialEvents = Array.isArray(initialSnapshot?.result)
    ? (initialSnapshot.result as UsdtTransactionHashRealtimeEvent[])
    : [];

  const eventMap = new Map<string, FeedItem>();

  for (const event of initialEvents) {
    const id = getEventKey(event, event.eventId || "");
    eventMap.set(id, {
      id,
      data: event,
      highlightUntil: 0,
    });
  }

  return Array.from(eventMap.values())
    .sort((left, right) => getEventDisplayTimestamp(right.data) - getEventDisplayTimestamp(left.data))
    .slice(0, MAX_EVENTS);
}

export default function ScanHomeClientPage({
  initialSnapshot = null,
}: ScanHomeClientPageProps) {
  const params = useParams();
  const router = useRouter();
  const lang = typeof params?.lang === "string" ? params.lang : "ko";

  const [events, setEvents] = useState<FeedItem[]>(() => buildInitialFeedItems(initialSnapshot));
  const [connectionState, setConnectionState] = useState<Ably.ConnectionState>("initialized");
  const [connectionErrorMessage, setConnectionErrorMessage] = useState<string | null>(null);
  const [syncErrorMessage, setSyncErrorMessage] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [searchQuery, setSearchQuery] = useState("");
  const [feedMeta, setFeedMeta] = useState<ScanFeedMeta | null>(initialSnapshot?.meta || null);

  const deferredSearchQuery = useDeferredValue(searchQuery);
  const clientId = useMemo(() => `scan-feed-${Math.random().toString(36).slice(2, 10)}`, []);
  const chainLabel = configuredChain === "bsc" ? "BNB Smart Chain" : String(configuredChain || "bsc").toUpperCase();
  const chainMarketLabel = getChainMarketLabel();
  const chainLogoSrc = getChainLogoSrc();
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
          const rightTs = getEventDisplayTimestamp(right.data);
          const leftTs = getEventDisplayTimestamp(left.data);
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
      upsertEvents(
        Array.isArray(data.result) ? (data.result as UsdtTransactionHashRealtimeEvent[]) : [],
        false,
      );
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
        chainTimeValue: string | null;
        highlightUntil: number;
      }
    >();

    for (const item of events) {
      const transactionHash = String(item.data.transactionHash || "").trim();
      if (!transactionHash) {
        continue;
      }

      const nextTimestamp = getEventDisplayTimestamp(item.data);
      const nextTimeValue = getEventDisplayTimeValue(item.data);
      const nextChainTimeValue = getEventChainTimeValue(item.data);
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
          chainTimeValue: nextChainTimeValue,
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
        existing.chainTimeValue = nextChainTimeValue;
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
          return getEventDisplayTimestamp(right.data) - getEventDisplayTimestamp(left.data);
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
          chainTimeValue: group.chainTimeValue,
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
        row.fromSummary.title,
        row.fromSummary.subline,
        row.fromSummary.bankLine,
        row.fromSummary.identity?.storeName,
        row.fromSummary.identity?.storecode,
        row.fromSummary.identity?.nickname,
        row.toSummary.headline,
        row.toSummary.title,
        row.toSummary.subline,
        row.toSummary.bankLine,
        row.toSummary.identity?.storeName,
        row.toSummary.identity?.storecode,
        row.toSummary.identity?.nickname,
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

  const topMetrics = [
    {
      id: "chain",
      label: "Chain",
      value: chainMarketLabel,
    },
    {
      id: "feed",
      label: "Feed",
      value: connectionState === "connected" ? "Realtime Active" : "Snapshot Mode",
    },
    {
      id: "latest",
      label: "Last Detected",
      value: formatDateTime(totals.latestRecordAt),
    },
    {
      id: "wallets",
      label: "Wallet Scope",
      value: `${totals.activeWallets.toLocaleString()} tracked`,
    },
  ];

  return (
    <div className="min-h-screen bg-[#f4f1ea] text-[#1f2937]">
      <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-5 px-4 py-5 sm:px-6 lg:px-8">
        <section className="overflow-hidden rounded-[26px] border border-[#2a3140] bg-[#111827] text-white shadow-[0_30px_80px_-52px_rgba(15,23,42,0.9)]">
          <div className="grid gap-3 px-5 py-3 sm:px-6 lg:grid-cols-4">
            {topMetrics.map((item) => (
              <div
                key={item.id}
                className="rounded-[18px] border border-white/10 bg-white/5 px-4 py-3 backdrop-blur"
              >
                <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#c7d0e0]">
                  {item.label}
                </div>
                <div className="mt-1 text-sm font-semibold text-white">
                  {item.value}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="overflow-hidden rounded-[28px] border border-[#e9e2d2] bg-white shadow-[0_28px_72px_-54px_rgba(15,23,42,0.28)]">
          <div className="border-b border-[#efe6d4] bg-[linear-gradient(180deg,_#fffdf7_0%,_#fbf7eb_100%)] px-5 py-6 sm:px-7">
            <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
              <div className="max-w-3xl">
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-[22px] border border-[#f0ddb0] bg-[#fff7df] shadow-[0_14px_34px_-26px_rgba(180,129,0,0.55)]">
                    <Image
                      src={chainLogoSrc}
                      alt={chainLabel}
                      width={42}
                      height={42}
                      className="h-10 w-10 object-contain"
                    />
                  </div>
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-[0.34em] text-[#9a7610]">
                      {chainMarketLabel} Explorer
                    </div>
                    <h1 className="mt-2 text-[2rem] font-semibold tracking-tight text-[#202939] sm:text-[2.6rem]">
                      Latest BEP-20 USDT Transfers
                    </h1>
                  </div>
                </div>
                <p className="mt-4 max-w-2xl text-sm leading-6 text-[#5f6675]">
                  BscScan-style explorer surface for monitored wallet activity. Live transfers stay blockchain-first,
                  while store and buyer labels make monitored addresses behave like white-labeled identities.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${getConnectionClassName(connectionState)}`}>
                  <span className="scan-live-dot h-2 w-2 rounded-full bg-current" />
                  {connectionState}
                </span>
                <Link
                  href={`/${lang}/scan/integrations`}
                  className="rounded-full border border-[#e6dcc5] bg-white px-4 py-2 text-sm font-semibold text-[#4a5568] transition hover:border-[#d8c9a3] hover:text-[#946400]"
                >
                  Infrastructure
                </Link>
                <a
                  href={getExplorerBaseUrl()}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full border border-[#f0ddb0] bg-[#fff6da] px-4 py-2 text-sm font-semibold text-[#946400] transition hover:border-[#e7cc80] hover:bg-[#fff2c7]"
                >
                  Open {explorerHost}
                </a>
              </div>
            </div>

            <div className="mt-6 rounded-[26px] border border-[#1e2633] bg-[#151d29] p-4 shadow-[0_22px_48px_-34px_rgba(15,23,42,0.75)]">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#f2d996]">
                    Search explorer
                  </div>
                  <form onSubmit={handleSearchSubmit} className="mt-3 flex flex-col gap-3 md:flex-row">
                    <div className="relative min-w-0 flex-1">
                      <input
                        value={searchQuery}
                        onChange={(event) => setSearchQuery(event.target.value)}
                        placeholder="Search by address / transaction hash / store label"
                        className="h-14 w-full rounded-2xl border border-white/10 bg-white px-5 text-sm text-[#202939] outline-none transition focus:border-[#f2d996] focus:ring-4 focus:ring-[#f8edc6]"
                      />
                    </div>
                    <button
                      type="submit"
                      className="h-14 rounded-2xl bg-[#f0b90b] px-6 text-sm font-semibold text-[#1d1f24] transition hover:bg-[#e0aa05]"
                    >
                      Search
                    </button>
                  </form>
                </div>

                <div className="grid gap-2 sm:grid-cols-2 xl:w-[360px]">
                  {integrationLinks.map((item) => (
                    <Link
                      key={item.id}
                      href={`/${lang}/scan/integrations#${item.id}`}
                      className="group rounded-[18px] border border-white/10 bg-white/5 px-4 py-3 text-sm transition hover:border-[#f0ddb0] hover:bg-white/10"
                    >
                      <div className="font-semibold text-white">{item.title}</div>
                      <div className="mt-1 text-xs text-[#c7d0e0]">{item.description}</div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-[22px] border border-[#ece4d2] bg-[#fffdfa] px-5 py-4 shadow-sm">
                <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#8b6c1f]">Transactions</div>
                <div className="mt-2 text-[30px] font-semibold tracking-tight text-[#202939]">{totals.transactions.toLocaleString()}</div>
                <div className="mt-1 text-xs text-[#7c8495]">Unique transaction hashes in feed</div>
              </div>
              <div className="rounded-[22px] border border-[#ece4d2] bg-[#fffdfa] px-5 py-4 shadow-sm">
                <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#8b6c1f]">Token Transfers</div>
                <div className="mt-2 text-[30px] font-semibold tracking-tight text-[#202939]">{totals.transferLogs.toLocaleString()}</div>
                <div className="mt-1 text-xs text-[#7c8495]">Individual monitored transfer logs</div>
              </div>
              <div className="rounded-[22px] border border-[#ece4d2] bg-[#fffdfa] px-5 py-4 shadow-sm">
                <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#8b6c1f]">Observed Value</div>
                <div className="mt-2 text-[30px] font-semibold tracking-tight text-[#0f7a4b]">{formatUsdt(totals.totalUsdt)}</div>
                <div className="mt-1 text-xs text-[#7c8495]">USDT aggregated from current feed</div>
              </div>
              <div className="rounded-[22px] border border-[#ece4d2] bg-[#fffdfa] px-5 py-4 shadow-sm">
                <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#8b6c1f]">Wallet Labels</div>
                <div className="mt-2 text-[30px] font-semibold tracking-tight text-[#202939]">{totals.activeWallets.toLocaleString()}</div>
                <div className="mt-1 text-xs text-[#7c8495]">Last detected {formatDateTime(totals.latestRecordAt)}</div>
              </div>
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-[28px] border border-[#e4e4e7] bg-white shadow-[0_22px_70px_-56px_rgba(0,0,0,0.18)]">
          <div className="border-b border-[#e4e4e7] px-5 py-5 sm:px-7">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.32em] text-[#71717a]">Latest Token Transfers</div>
                <h2 className="mt-2 text-xl font-semibold text-[#18181b]">Verified monitored transfers</h2>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs text-[#71717a]">
                <span>{isSyncing ? "Snapshot syncing..." : "Realtime feed active"}</span>
                {connectionErrorMessage ? <span>· {connectionErrorMessage}</span> : null}
                {syncErrorMessage ? <span>· {syncErrorMessage}</span> : null}
              </div>
            </div>
          </div>

          <div className="hidden border-b border-[#e4e4e7] bg-[#fafafa] px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#71717a] md:grid md:grid-cols-[1.55fr,0.92fr,0.92fr,1.1fr,1.1fr,0.92fr] md:gap-4 sm:px-7">
            <div>Txn Hash</div>
            <div>Method</div>
            <div>Age</div>
            <div>From</div>
            <div>To</div>
            <div>Value</div>
          </div>

          {filteredRows.length > 0 ? (
            <div className="divide-y divide-[#efefef]">
              {filteredRows.map((row) => {
                const isHighlighted = row.highlightUntil > nowMs;
                const relativeTime = getRelativeTimeInfo(row.timeValue, nowMs);

                return (
                  <div
                    key={row.id}
                    className={`scan-live-row px-5 py-4 sm:px-7 ${isHighlighted ? "scan-live-row--highlight" : "bg-white"}`}
                  >
                    <div className="grid gap-3 md:grid-cols-[1.55fr,0.92fr,0.92fr,1.1fr,1.1fr,0.92fr]">
                      <div className="min-w-0">
                        <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#71717a] md:hidden">Txn Hash</div>
                        <div className="mt-1 flex items-start gap-2.5">
                          <span className="inline-flex h-8 w-8 flex-none items-center justify-center rounded-xl border border-[#d4d4d8] bg-[#fafafa] text-[10px] font-semibold text-[#18181b]">
                            {row.transferCount > 1 ? "BEP" : "TXN"}
                          </span>
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <Link
                                href={`/${lang}/scan/tx/${row.transactionHash}`}
                                className={getCompactLinkClassName()}
                                title={row.transactionHash}
                              >
                                {formatShortHash(row.transactionHash)}
                              </Link>
                              <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold ${getTableStatusTone(row.status)}`}>
                                {getStatusLabel(row.status)}
                              </span>
                            </div>
                            <div className="mt-1.5 flex flex-wrap items-center gap-3 text-[11px] text-[#71717a]">
                              <a
                                href={getExplorerTxUrl(row.transactionHash)}
                                target="_blank"
                                rel="noreferrer"
                                className="font-medium text-[#3f3f46] transition hover:text-[#18181b]"
                              >
                                View on {explorerHost}
                              </a>
                              <span>{row.transferCount} transfer logs</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="min-w-0">
                        <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#71717a] md:hidden">Method</div>
                        <div className="mt-1">
                          <span className="inline-flex rounded-full border border-[#d4d4d8] bg-[#fafafa] px-2.5 py-1 text-[11px] font-semibold text-[#27272a]">
                            {row.methodLabel}
                          </span>
                          <div className="mt-1.5 text-[12px] text-[#71717a]">{(row.chain || configuredChain || "bsc").toUpperCase()}</div>
                        </div>
                      </div>

                      <div className="min-w-0">
                        <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#71717a] md:hidden">Age</div>
                        <div className="mt-1">
                          <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold ${getRelativeTimeClassName(relativeTime.tone)}`}>
                            {relativeTime.relativeLabel}
                          </span>
                          <div className="mt-1.5 text-[12px] text-[#52525b]">Detected {formatDateTime(row.timeValue)}</div>
                          {row.chainTimeValue && row.chainTimeValue !== row.timeValue ? (
                            <div className="mt-1 text-[11px] text-[#a1a1aa]">On-chain {formatDateTime(row.chainTimeValue)}</div>
                          ) : null}
                        </div>
                      </div>

                      <div className="min-w-0">
                        <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#71717a] md:hidden">From</div>
                        <div className="mt-1">
                          {row.fromSummary.href ? (
                            <Link
                              href={row.fromSummary.href}
                              className={getCompactLinkClassName()}
                              title={row.fromSummary.addresses[0]}
                            >
                              {row.fromSummary.headline}
                            </Link>
                          ) : (
                            <div className="text-sm font-semibold text-[#18181b]">{row.fromSummary.headline}</div>
                          )}
                          <PartyIdentityCard summary={row.fromSummary} />
                        </div>
                      </div>

                      <div className="min-w-0">
                        <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#71717a] md:hidden">To</div>
                        <div className="mt-1">
                          {row.toSummary.href ? (
                            <Link
                              href={row.toSummary.href}
                              className={getCompactLinkClassName()}
                              title={row.toSummary.addresses[0]}
                            >
                              {row.toSummary.headline}
                            </Link>
                          ) : (
                            <div className="text-sm font-semibold text-[#18181b]">{row.toSummary.headline}</div>
                          )}
                          <PartyIdentityCard summary={row.toSummary} />
                        </div>
                      </div>

                      <div className="min-w-0">
                        <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#71717a] md:hidden">Value</div>
                        <div className="mt-1">
                          <div className="text-sm font-semibold text-[#18181b]">{formatUsdt(row.totalUsdt)} USDT</div>
                          <div className="mt-1.5 text-[11px] text-[#71717a]">{row.transferCount > 1 ? "Batch total" : "Single transfer"}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="px-5 py-16 text-center text-sm text-[#7c8495] sm:px-7">
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
              inset 0 0 0 1px rgba(24, 24, 27, 0.12),
              0 18px 42px -34px rgba(0, 0, 0, 0.16);
          }
          100% {
            box-shadow:
              inset 0 0 0 1px rgba(24, 24, 27, 0),
              0 0 0 0 rgba(0, 0, 0, 0);
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
            linear-gradient(90deg, rgba(250, 250, 250, 0.98) 0%, rgba(255, 255, 255, 1) 18%, rgba(244, 244, 245, 0.98) 100%);
        }

        .scan-live-row--highlight::before {
          content: "";
          position: absolute;
          left: 0;
          top: 14px;
          bottom: 14px;
          width: 3px;
          border-radius: 999px;
          background: linear-gradient(180deg, #18181b 0%, #71717a 100%);
          box-shadow: 0 0 14px rgba(24, 24, 27, 0.18);
        }

        .scan-live-dot {
          animation: scanDotPulse 1600ms ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
