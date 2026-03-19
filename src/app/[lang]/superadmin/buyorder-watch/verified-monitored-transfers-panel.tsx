"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import * as Ably from "ably";

import type { UsdtTransactionHashRealtimeEvent } from "@/lib/ably/constants";
import {
  formatDateTime,
  formatShortAddress,
  formatShortHash,
  formatUsdt,
  getExplorerTxUrl,
  normalizeAddress,
  resolveScanFeedMeta,
  toTimestamp,
  type ScanFeedMeta,
  type ScanSnapshotResponse,
} from "@/app/[lang]/scan/scan-feed-shared";

type VerifiedMonitoredTransfersPanelProps = {
  lang: string;
  enabled: boolean;
};

type FeedItem = {
  id: string;
  data: UsdtTransactionHashRealtimeEvent;
  highlightUntil: number;
};

type TransferRow = {
  id: string;
  transactionHash: string;
  status: string | null;
  transferCount: number;
  totalUsdt: number;
  timeValue: string | null;
  latestTimestamp: number;
  highlightUntil: number;
  fromTitle: string;
  fromAddress: string;
  toTitle: string;
  toAddress: string;
};

const SNAPSHOT_LIMIT = 12;
const MAX_EVENTS = 24;
const RESYNC_INTERVAL_MS = 15_000;
const HIGHLIGHT_MS = 4_800;

function createClientId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `superadmin-scan-${crypto.randomUUID()}`;
  }
  return `superadmin-scan-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function formatTimeAgo(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  const diffMs = Date.now() - date.getTime();
  if (diffMs < 60_000) return "방금 전";
  if (diffMs < 3_600_000) return `${Math.floor(diffMs / 60_000)}분 전`;
  if (diffMs < 86_400_000) return `${Math.floor(diffMs / 3_600_000)}시간 전`;
  return `${Math.floor(diffMs / 86_400_000)}일 전`;
}

function getEventKey(event: UsdtTransactionHashRealtimeEvent) {
  const queueId = String(event.queueId || "").trim();
  if (queueId) return queueId;
  const eventId = String(event.eventId || "").trim();
  if (eventId) return eventId;
  const idempotencyKey = String(event.idempotencyKey || "").trim();
  if (idempotencyKey) return idempotencyKey;
  const logIndex = String(event.logIndex || "").trim();
  return [
    String(event.transactionHash || "").trim(),
    logIndex,
    normalizeAddress(event.fromWalletAddress),
    normalizeAddress(event.toWalletAddress),
    String(event.amountUsdt || 0),
  ].join(":");
}

function getEventDisplayTimestamp(event: UsdtTransactionHashRealtimeEvent) {
  return Math.max(
    toTimestamp(event.publishedAt),
    toTimestamp(event.minedAt),
    toTimestamp(event.createdAt),
  );
}

function getEventDisplayTimeValue(event: UsdtTransactionHashRealtimeEvent) {
  return event.publishedAt || event.minedAt || event.createdAt || null;
}

function buildPartyTitle({
  address,
  label,
  identity,
}: {
  address: string;
  label: string | null | undefined;
  identity:
    | UsdtTransactionHashRealtimeEvent["fromIdentity"]
    | UsdtTransactionHashRealtimeEvent["toIdentity"];
}) {
  const badgeLabel = String(identity?.badgeLabel || "").trim();
  const primary =
    identity?.storeName
    || identity?.nickname
    || identity?.accountHolder
    || (identity?.storecode ? `@${identity.storecode}` : "")
    || String(label || "").trim();
  if (primary) {
    return badgeLabel ? `${badgeLabel} · ${primary}` : primary;
  }
  return formatShortAddress(address);
}

function getStatusLabel(status: string | null | undefined) {
  if (status === "confirmed") return "Success";
  if (!status) return "Queued";
  return status.replace(/[-_]/g, " ");
}

function getStatusTone(status: string | null | undefined) {
  if (status === "confirmed") {
    return "border-[#18181b] bg-[#18181b] text-white";
  }
  if (status === "pending") {
    return "border-[#fcd34d] bg-[#fff7d6] text-[#8b6c1f]";
  }
  return "border-[#d4d4d8] bg-[#fafafa] text-[#52525b]";
}

export function VerifiedMonitoredTransfersPanel({
  lang,
  enabled,
}: VerifiedMonitoredTransfersPanelProps) {
  const [events, setEvents] = useState<FeedItem[]>([]);
  const [feedMeta, setFeedMeta] = useState<ScanFeedMeta | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [connectionState, setConnectionState] = useState<Ably.ConnectionState>("initialized");
  const [lastSyncedAt, setLastSyncedAt] = useState("");
  const [nowMs, setNowMs] = useState(() => Date.now());
  const resolvedFeedMeta = useMemo(() => resolveScanFeedMeta(feedMeta), [feedMeta]);
  const clientId = useMemo(() => createClientId(), []);

  const upsertEvents = useCallback((incomingEvents: UsdtTransactionHashRealtimeEvent[], highlightNew = true) => {
    if (incomingEvents.length === 0) {
      return;
    }

    const now = Date.now();

    setEvents((previous) => {
      const map = new Map(previous.map((item) => [item.id, item]));

      for (const event of incomingEvents) {
        const nextId = getEventKey(event);
        const existing = map.get(nextId);

        if (existing) {
          map.set(nextId, {
            ...existing,
            data: event,
            highlightUntil:
              highlightNew && existing.highlightUntil <= now
                ? now + HIGHLIGHT_MS
                : existing.highlightUntil,
          });
          continue;
        }

        map.set(nextId, {
          id: nextId,
          data: event,
          highlightUntil: highlightNew ? now + HIGHLIGHT_MS : 0,
        });
      }

      return Array.from(map.values())
        .sort((left, right) => getEventDisplayTimestamp(right.data) - getEventDisplayTimestamp(left.data))
        .slice(0, MAX_EVENTS);
    });
  }, []);

  const syncFromApi = useCallback(async () => {
    if (!enabled) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `/api/realtime/scan/usdt-token-transfers?public=1&limit=${SNAPSHOT_LIMIT}`,
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
      setLastSyncedAt(new Date().toISOString());
      setError("");
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "전송내역을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, [enabled, upsertEvents]);

  useEffect(() => {
    if (!enabled) {
      setEvents([]);
      setFeedMeta(null);
      setError("");
      setLoading(false);
      setConnectionState("initialized");
      setLastSyncedAt("");
      return;
    }

    void syncFromApi();
    const timer = window.setInterval(() => {
      void syncFromApi();
    }, RESYNC_INTERVAL_MS);

    return () => window.clearInterval(timer);
  }, [enabled, syncFromApi]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const realtime = new Ably.Realtime({
      authUrl: `${resolvedFeedMeta.authUrl}?public=1&stream=usdt-txhash&clientId=${clientId}`,
    });

    const channel = realtime.channels.get(resolvedFeedMeta.channel);

    const onConnectionStateChange = (stateChange: Ably.ConnectionStateChange) => {
      setConnectionState(stateChange.current);
      if (stateChange.current === "connected") {
        setError("");
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
      setLastSyncedAt(new Date().toISOString());
    };

    realtime.connection.on(onConnectionStateChange);
    void channel.subscribe(resolvedFeedMeta.eventName, onMessage);

    return () => {
      channel.unsubscribe(resolvedFeedMeta.eventName, onMessage);
      realtime.connection.off(onConnectionStateChange);
      realtime.close();
    };
  }, [
    clientId,
    enabled,
    resolvedFeedMeta.authUrl,
    resolvedFeedMeta.channel,
    resolvedFeedMeta.eventName,
    upsertEvents,
  ]);

  useEffect(() => {
    if (!enabled) {
      return;
    }
    const timer = window.setInterval(() => {
      setNowMs(Date.now());
    }, 5_000);
    return () => window.clearInterval(timer);
  }, [enabled]);

  const rows = useMemo(() => {
    const grouped = new Map<string, TransferRow>();

    for (const item of events) {
      const transactionHash = String(item.data.transactionHash || "").trim();
      if (!transactionHash) {
        continue;
      }

      const nextTimestamp = getEventDisplayTimestamp(item.data);
      const existing = grouped.get(transactionHash);
      const fromAddress = normalizeAddress(item.data.fromWalletAddress);
      const toAddress = normalizeAddress(item.data.toWalletAddress);
      const fromTitle = buildPartyTitle({
        address: fromAddress,
        label: item.data.fromLabel,
        identity: item.data.fromIdentity,
      });
      const toTitle = buildPartyTitle({
        address: toAddress,
        label: item.data.toLabel,
        identity: item.data.toIdentity,
      });

      if (!existing) {
        grouped.set(transactionHash, {
          id: transactionHash,
          transactionHash,
          status: item.data.status || null,
          transferCount: 1,
          totalUsdt: Number(item.data.amountUsdt || 0),
          timeValue: getEventDisplayTimeValue(item.data),
          latestTimestamp: nextTimestamp,
          highlightUntil: item.highlightUntil,
          fromTitle,
          fromAddress,
          toTitle,
          toAddress,
        });
        continue;
      }

      existing.transferCount += 1;
      existing.totalUsdt += Number(item.data.amountUsdt || 0);
      existing.highlightUntil = Math.max(existing.highlightUntil, item.highlightUntil);
      if (nextTimestamp > existing.latestTimestamp) {
        existing.latestTimestamp = nextTimestamp;
        existing.timeValue = getEventDisplayTimeValue(item.data);
        existing.status = item.data.status || existing.status;
        existing.fromTitle = fromTitle;
        existing.fromAddress = fromAddress;
        existing.toTitle = toTitle;
        existing.toAddress = toAddress;
      }
    }

    return Array.from(grouped.values())
      .sort((left, right) => right.latestTimestamp - left.latestTimestamp)
      .slice(0, SNAPSHOT_LIMIT);
  }, [events]);

  const totalAmountUsdt = useMemo(
    () => rows.reduce((sum, row) => sum + Number(row.totalUsdt || 0), 0),
    [rows],
  );

  const connectionClassName =
    connectionState === "connected"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : connectionState === "connecting" || connectionState === "initialized"
        ? "border-amber-200 bg-amber-50 text-[#8b6c1f]"
        : "border-rose-200 bg-rose-50 text-rose-700";

  if (!enabled) {
    return null;
  }

  return (
    <section className="overflow-hidden rounded-[30px] border border-[#e7d6a6] bg-[linear-gradient(180deg,#fffdfa_0%,#fffaf0_100%)] shadow-[0_24px_80px_-58px_rgba(0,0,0,0.35)]">
      <div className="border-b border-[#efe4c8] px-5 py-5 sm:px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.32em] text-[#8b6c1f]">
              Verified monitored transfers
            </div>
            <h3 className="mt-2 text-[28px] font-semibold tracking-tight text-[#18181b]">
              scan 라이브 전송내역
            </h3>
            <div className="mt-2 max-w-3xl text-sm leading-6 text-[#71717a]">
              `/ko/scan`의 monitored transfer feed를 상황판 안에서 BscScan `txs` 리스트처럼 빠르게 확인합니다.
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${connectionClassName}`}>
              {connectionState}
            </span>
            <span className="rounded-full border border-[#e4e4e7] bg-white px-3 py-1 text-xs font-medium text-[#71717a]">
              {formatTimeAgo(lastSyncedAt)} · 15초 폴링 + Ably
            </span>
            <Link
              href={`/${lang}/scan`}
              className="rounded-full border border-[#18181b] bg-[#18181b] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#27272a]"
            >
              전체 Scan 보기
            </Link>
          </div>
        </div>
      </div>

      <div className="grid gap-3 border-b border-[#efe4c8] px-5 py-4 sm:px-6 md:grid-cols-3">
        <div className="rounded-[22px] border border-[#e8dcc1] bg-white px-4 py-4 shadow-[0_18px_40px_-34px_rgba(24,24,27,0.2)]">
          <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#8b6c1f]">Transactions</div>
          <div className="mt-2 text-right text-[34px] font-semibold tracking-tight tabular-nums text-[#18181b]">
            {rows.length.toLocaleString("ko-KR")}
          </div>
          <div className="mt-1 text-right text-xs text-[#71717a]">현재 패널에 표시 중인 최신 전송</div>
        </div>
        <div className="rounded-[22px] border border-[#e8dcc1] bg-white px-4 py-4 shadow-[0_18px_40px_-34px_rgba(24,24,27,0.2)]">
          <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#8b6c1f]">Observed value</div>
          <div className="mt-2 text-right text-[34px] font-semibold tracking-tight tabular-nums text-[#15803d]">
            {formatUsdt(totalAmountUsdt)}
          </div>
          <div className="mt-1 text-right text-xs text-[#71717a]">USDT aggregated from current feed</div>
        </div>
        <div className="rounded-[22px] border border-[#e8dcc1] bg-white px-4 py-4 shadow-[0_18px_40px_-34px_rgba(24,24,27,0.2)]">
          <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#8b6c1f]">Last synced</div>
          <div className="mt-2 text-right text-base font-semibold text-[#18181b]">{formatDateTime(lastSyncedAt)}</div>
          <div className="mt-1 text-right text-xs text-[#71717a]">{formatTimeAgo(lastSyncedAt)} · realtime active</div>
        </div>
      </div>

      {loading && rows.length === 0 ? (
        <div className="mx-5 mt-5 rounded-[22px] border border-cyan-200 bg-cyan-50 px-5 py-4 text-sm text-cyan-800 sm:mx-6">
          scan 라이브 전송내역을 불러오는 중입니다.
        </div>
      ) : null}

      {error ? (
        <div className="mx-5 mt-5 rounded-[22px] border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-800 sm:mx-6">
          {error}
        </div>
      ) : null}

      {rows.length > 0 ? (
        <div className="pb-2">
          <div className="hidden border-b border-[#ece7d6] bg-[#faf7ef] px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#71717a] md:grid md:grid-cols-[1.55fr,0.88fr,0.96fr,1.05fr,1.05fr,0.92fr] md:gap-4 sm:px-6">
            <div>Txn Hash</div>
            <div>Method</div>
            <div>Age</div>
            <div>From</div>
            <div>To</div>
            <div className="text-right">Value</div>
          </div>

          <div className="divide-y divide-[#efeadb]">
            {rows.map((row) => {
              const isHighlighted = row.highlightUntil > nowMs;
              const txUrl = getExplorerTxUrl(row.transactionHash);
              const methodLabel = row.transferCount > 1 ? "Batch Transfer" : "Transfer";
              const amountLabel = `${formatUsdt(row.totalUsdt)} USDT`;

              return (
                <article
                  key={row.id}
                  className={`px-3 py-3 sm:px-5 md:px-6 md:py-4 ${
                    isHighlighted ? "bg-[#fff8df]" : "bg-white"
                  }`}
                >
                  <div
                    className={`overflow-hidden rounded-[24px] border bg-[linear-gradient(180deg,#ffffff_0%,#fcfcfb_100%)] shadow-[0_18px_34px_-30px_rgba(24,24,27,0.18)] md:hidden ${
                      isHighlighted ? "border-[#f4d373]" : "border-[#ece7d6]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3 border-b border-[#f1ede0] px-3.5 py-3.5">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <Link
                            href={`/${lang}/scan/tx/${row.transactionHash}`}
                            className="truncate text-[15px] font-semibold text-[#18181b] transition hover:text-[#3f3f46]"
                            title={row.transactionHash}
                          >
                            {formatShortHash(row.transactionHash)}
                          </Link>
                          <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold ${getStatusTone(row.status)}`}>
                            {getStatusLabel(row.status)}
                          </span>
                        </div>
                        <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px] text-[#71717a]">
                          {txUrl ? (
                            <a
                              href={txUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="font-medium text-[#3f3f46] transition hover:text-[#18181b]"
                            >
                              View on bscscan.com
                            </a>
                          ) : null}
                          <span>{row.transferCount} transfer logs</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-[18px] font-semibold tracking-tight tabular-nums text-[#18181b]">
                          {amountLabel}
                        </div>
                        <div className="mt-1 text-[11px] text-[#71717a]">
                          {row.transferCount > 1 ? "Batch total" : "Single transfer"}
                        </div>
                      </div>
                    </div>

                    <div className="border-b border-[#f3efe4] px-3.5 py-3">
                      <div className="flex flex-wrap gap-2">
                        <span className="inline-flex rounded-full border border-[#d4d4d8] bg-[#fafafa] px-2.5 py-1 text-[11px] font-semibold text-[#27272a]">
                          {methodLabel}
                        </span>
                        <span className="inline-flex rounded-full border border-[#f4d373] bg-[#fff7d6] px-2.5 py-1 text-[11px] font-semibold text-[#8b6c1f]">
                          {formatTimeAgo(row.timeValue)}
                        </span>
                        <span className="inline-flex rounded-full border border-[#e4e4e7] bg-white px-2.5 py-1 text-[11px] font-semibold text-[#52525b]">
                          BSC
                        </span>
                      </div>
                      <div className="mt-2 text-[11px] leading-5 text-[#71717a]">
                        Detected {formatDateTime(row.timeValue)}
                      </div>
                    </div>

                    <div className="grid gap-2.5 px-3.5 py-3.5">
                      <div className="rounded-[18px] border border-[#ece7d6] bg-white px-3 py-3">
                        <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#71717a]">From</div>
                        <div className="mt-1.5 text-sm font-semibold text-[#18181b]">{row.fromTitle}</div>
                        <div className="mt-1 font-mono text-xs text-[#71717a]">{formatShortAddress(row.fromAddress)}</div>
                      </div>
                      <div className="rounded-[18px] border border-[#ece7d6] bg-white px-3 py-3">
                        <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#71717a]">To</div>
                        <div className="mt-1.5 text-sm font-semibold text-[#18181b]">{row.toTitle}</div>
                        <div className="mt-1 font-mono text-xs text-[#71717a]">{formatShortAddress(row.toAddress)}</div>
                      </div>
                    </div>
                  </div>

                  <div className="hidden md:grid md:grid-cols-[1.55fr,0.88fr,0.96fr,1.05fr,1.05fr,0.92fr] md:gap-4">
                    <div className="min-w-0">
                      <div className="flex items-start gap-3">
                        <span className="inline-flex h-10 w-10 flex-none items-center justify-center rounded-[14px] border border-[#d4d4d8] bg-[#fafafa] text-[10px] font-semibold text-[#18181b]">
                          {row.transferCount > 1 ? "BEP" : "TXN"}
                        </span>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <Link
                              href={`/${lang}/scan/tx/${row.transactionHash}`}
                              className="truncate text-sm font-semibold text-[#18181b] transition hover:text-[#3f3f46]"
                              title={row.transactionHash}
                            >
                              {formatShortHash(row.transactionHash)}
                            </Link>
                            <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold ${getStatusTone(row.status)}`}>
                              {getStatusLabel(row.status)}
                            </span>
                          </div>
                          <div className="mt-1.5 flex flex-wrap items-center gap-3 text-[11px] text-[#71717a]">
                            {txUrl ? (
                              <a
                                href={txUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="font-medium text-[#3f3f46] transition hover:text-[#18181b]"
                              >
                                View on bscscan.com
                              </a>
                            ) : null}
                            <span>{row.transferCount} transfer logs</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="min-w-0">
                      <span className="inline-flex rounded-full border border-[#d4d4d8] bg-[#fafafa] px-2.5 py-1 text-[11px] font-semibold text-[#27272a]">
                        {methodLabel}
                      </span>
                      <div className="mt-1.5 text-[12px] text-[#71717a]">BSC</div>
                    </div>

                    <div className="min-w-0">
                      <span className="inline-flex rounded-full border border-[#f4d373] bg-[#fff7d6] px-2 py-0.5 text-[10px] font-semibold text-[#8b6c1f]">
                        {formatTimeAgo(row.timeValue)}
                      </span>
                      <div className="mt-1.5 text-[12px] text-[#52525b]">Detected {formatDateTime(row.timeValue)}</div>
                    </div>

                    <div className="min-w-0 rounded-[18px] border border-[#ece7d6] bg-[#fcfbf8] px-3 py-3">
                      <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#71717a]">From</div>
                      <div className="mt-1.5 truncate text-sm font-semibold text-[#18181b]">{row.fromTitle}</div>
                      <div className="mt-1 font-mono text-xs text-[#71717a]">{formatShortAddress(row.fromAddress)}</div>
                    </div>

                    <div className="min-w-0 rounded-[18px] border border-[#ece7d6] bg-[#fcfbf8] px-3 py-3">
                      <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#71717a]">To</div>
                      <div className="mt-1.5 truncate text-sm font-semibold text-[#18181b]">{row.toTitle}</div>
                      <div className="mt-1 font-mono text-xs text-[#71717a]">{formatShortAddress(row.toAddress)}</div>
                    </div>

                    <div className="min-w-0 text-right">
                      <div className="text-[20px] font-semibold tracking-tight tabular-nums text-[#18181b]">
                        {amountLabel}
                      </div>
                      <div className="mt-1 text-[11px] text-[#71717a]">
                        {row.transferCount > 1 ? "Batch total" : "Single transfer"}
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      ) : !loading && !error ? (
        <div className="mx-5 my-5 rounded-[22px] border border-dashed border-[#d4d4d8] bg-[#fafafa] px-5 py-6 text-sm text-[#71717a] sm:mx-6">
          표시할 monitored transfer가 없습니다.
        </div>
      ) : null}
    </section>
  );
}
