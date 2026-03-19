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
    return "border-emerald-300/25 bg-emerald-400/10 text-emerald-100";
  }
  if (status === "pending") {
    return "border-amber-300/25 bg-amber-400/10 text-amber-100";
  }
  return "border-white/10 bg-white/[0.06] text-slate-200";
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
      ? "border-emerald-300/25 bg-emerald-400/10 text-emerald-100"
      : connectionState === "connecting" || connectionState === "initialized"
        ? "border-amber-300/25 bg-amber-400/10 text-amber-100"
        : "border-rose-300/25 bg-rose-400/10 text-rose-100";

  if (!enabled) {
    return null;
  }

  return (
    <section className="rounded-[28px] border border-amber-400/20 bg-[linear-gradient(180deg,rgba(34,27,13,0.96),rgba(15,12,8,0.99))] p-5 shadow-[0_30px_110px_-70px_rgba(245,158,11,0.35)]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-amber-200/90">
            Verified monitored transfers
          </div>
          <h3 className="mt-2 text-xl font-semibold text-white">
            scan 라이브 전송내역
          </h3>
          <div className="mt-2 text-sm leading-6 text-amber-50/75">
            `/ko/scan`과 같은 USDT monitored transfer feed를 superadmin 상황판에서 바로 감시합니다.
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${connectionClassName}`}>
            {connectionState}
          </span>
          <Link
            href={`/${lang}/scan`}
            className="rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-sm font-medium text-slate-100 transition hover:border-white/20 hover:bg-white/[0.1]"
          >
            전체 Scan 보기
          </Link>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <div className="rounded-[22px] border border-white/10 bg-white/[0.04] px-4 py-4">
          <div className="text-[11px] uppercase tracking-[0.22em] text-slate-500">Transactions</div>
          <div className="mt-2 text-2xl font-semibold text-white">{rows.length.toLocaleString("ko-KR")}</div>
          <div className="mt-1 text-xs text-slate-400">현재 패널에 표시 중인 최신 전송</div>
        </div>
        <div className="rounded-[22px] border border-white/10 bg-white/[0.04] px-4 py-4">
          <div className="text-[11px] uppercase tracking-[0.22em] text-slate-500">Observed value</div>
          <div className="mt-2 text-2xl font-semibold text-amber-100">{formatUsdt(totalAmountUsdt)} USDT</div>
          <div className="mt-1 text-xs text-slate-400">현재 패널 기준 누적 금액</div>
        </div>
        <div className="rounded-[22px] border border-white/10 bg-white/[0.04] px-4 py-4">
          <div className="text-[11px] uppercase tracking-[0.22em] text-slate-500">Last synced</div>
          <div className="mt-2 text-sm font-semibold text-white">{formatDateTime(lastSyncedAt)}</div>
          <div className="mt-1 text-xs text-slate-400">{formatTimeAgo(lastSyncedAt)} · 15초 폴링 + Ably</div>
        </div>
      </div>

      {loading && rows.length === 0 ? (
        <div className="mt-5 rounded-[22px] border border-cyan-400/20 bg-cyan-500/10 px-5 py-4 text-sm text-cyan-100">
          scan 라이브 전송내역을 불러오는 중입니다.
        </div>
      ) : null}

      {error ? (
        <div className="mt-5 rounded-[22px] border border-rose-400/20 bg-rose-500/10 px-5 py-4 text-sm text-rose-100">
          {error}
        </div>
      ) : null}

      {rows.length > 0 ? (
        <div className="mt-5 grid gap-3 xl:grid-cols-2">
          {rows.map((row) => {
            const isHighlighted = row.highlightUntil > nowMs;
            const txUrl = getExplorerTxUrl(row.transactionHash);
            return (
              <article
                key={row.id}
                className={`rounded-[24px] border px-4 py-4 transition ${
                  isHighlighted
                    ? "border-amber-300/35 bg-amber-400/[0.08] shadow-[0_0_0_1px_rgba(252,211,77,0.12)]"
                    : "border-white/8 bg-white/[0.04]"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/${lang}/scan/tx/${row.transactionHash}`}
                        className="font-mono text-sm font-semibold text-white transition hover:text-amber-100"
                      >
                        {formatShortHash(row.transactionHash)}
                      </Link>
                      <span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] ${getStatusTone(row.status)}`}>
                        {getStatusLabel(row.status)}
                      </span>
                      <span className="rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-300">
                        {row.transferCount > 1 ? `Batch ${row.transferCount}` : "Single"}
                      </span>
                    </div>
                    <div className="mt-2 text-xs text-slate-400">
                      {formatTimeAgo(row.timeValue)} · {formatDateTime(row.timeValue)}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-xl font-semibold text-amber-100">
                      {formatUsdt(row.totalUsdt)}
                    </div>
                    <div className="mt-1 text-[10px] font-medium uppercase tracking-[0.18em] text-amber-200/70">
                      USDT
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
                  <div className="rounded-[18px] border border-white/8 bg-[#0d1322] px-4 py-3">
                    <div className="text-[10px] uppercase tracking-[0.22em] text-slate-500">From</div>
                    <div className="mt-2 text-sm font-semibold text-white">{row.fromTitle}</div>
                    <div className="mt-1 font-mono text-xs text-slate-400">
                      {formatShortAddress(row.fromAddress)}
                    </div>
                  </div>

                  <div className="flex items-center justify-center text-slate-500">→</div>

                  <div className="rounded-[18px] border border-white/8 bg-[#0d1322] px-4 py-3">
                    <div className="text-[10px] uppercase tracking-[0.22em] text-slate-500">To</div>
                    <div className="mt-2 text-sm font-semibold text-white">{row.toTitle}</div>
                    <div className="mt-1 font-mono text-xs text-slate-400">
                      {formatShortAddress(row.toAddress)}
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-slate-400">
                  <Link
                    href={`/${lang}/scan/tx/${row.transactionHash}`}
                    className="font-medium text-cyan-200 transition hover:text-cyan-100"
                  >
                    내부 상세 보기
                  </Link>
                  {txUrl ? (
                    <a
                      href={txUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="font-medium text-amber-200 transition hover:text-amber-100"
                    >
                      BscScan 열기
                    </a>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      ) : !loading && !error ? (
        <div className="mt-5 rounded-[22px] border border-dashed border-white/10 bg-white/[0.03] px-5 py-6 text-sm text-slate-400">
          표시할 monitored transfer가 없습니다.
        </div>
      ) : null}
    </section>
  );
}
