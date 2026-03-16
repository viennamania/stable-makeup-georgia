"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { startTransition, useCallback, useEffect, useMemo, useState, type ReactNode } from "react";

import {
  formatDateTime,
  resolveScanFeedMeta,
  type ScanFeedMeta,
  type ScanSnapshotResponse,
} from "../scan-feed-shared";

const REFRESH_INTERVAL_MS = 15_000;

function StatusPill({
  tone,
  children,
}: {
  tone: "neutral" | "good" | "warn" | "bad";
  children: ReactNode;
}) {
  const className =
    tone === "good"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : tone === "warn"
        ? "border-amber-200 bg-amber-50 text-amber-700"
        : tone === "bad"
          ? "border-rose-200 bg-rose-50 text-rose-700"
          : "border-slate-200 bg-slate-50 text-slate-600";

  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${className}`}>
      {children}
    </span>
  );
}

export default function ScanIntegrationsPage() {
  const params = useParams();
  const lang = typeof params?.lang === "string" ? params.lang : "ko";

  const [feedMeta, setFeedMeta] = useState<ScanFeedMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const resolvedFeedMeta = useMemo(() => resolveScanFeedMeta(feedMeta), [feedMeta]);
  const thirdwebWebhookStatus = feedMeta?.thirdwebWebhookStatus || null;

  const loadMeta = useCallback(async () => {
    try {
      const response = await fetch("/api/realtime/scan/usdt-token-transfers?public=1&limit=1&metaOnly=1&includeThirdwebStatus=1", {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(`metadata request failed (${response.status})`);
      }

      const data = (await response.json()) as ScanSnapshotResponse;
      startTransition(() => {
        setFeedMeta(data.meta || null);
        setErrorMessage(null);
      });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "failed to load scan metadata");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadMeta();
    const timer = window.setInterval(() => {
      void loadMeta();
    }, REFRESH_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [loadMeta]);

  const webhookRecords = thirdwebWebhookStatus?.webhooks || [];
  const thirdwebError =
    thirdwebWebhookStatus && !thirdwebWebhookStatus.ok && "error" in thirdwebWebhookStatus
      ? thirdwebWebhookStatus.error || "Failed to load thirdweb webhook status"
      : null;

  return (
    <div className="min-h-screen bg-[#f5f7fb] text-[#1f2b46]">
      <div className="mx-auto flex w-full max-w-[1320px] flex-col gap-5 px-4 py-5 sm:px-6 lg:px-8">
        <section className="overflow-hidden rounded-[28px] border border-[#d7e3f5] bg-white shadow-[0_28px_90px_-56px_rgba(29,78,216,0.45)]">
          <div className="border-b border-[#e5edf8] bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.16),_transparent_46%),linear-gradient(180deg,_#ffffff_0%,_#f8fbff_100%)] px-5 py-6 sm:px-7">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-3xl">
                <div className="text-[11px] font-semibold uppercase tracking-[0.34em] text-[#5f84c6]">
                  Scan Infrastructure
                </div>
                <h1 className="mt-3 text-[2rem] font-semibold tracking-tight text-[#1f2b46] sm:text-[2.35rem]">
                  Realtime ingestion and delivery endpoints
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
                  Main explorer screen keeps only blockchain-facing transaction history. Worker ingress, thirdweb webhook,
                  snapshot sync, and Ably broadcast details live on this page.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href={`/${lang}/scan`}
                  className="rounded-full border border-[#cfe0fa] bg-[#f8fbff] px-4 py-2 text-sm font-semibold text-[#2354a8] transition hover:border-[#b8cff6] hover:bg-white"
                >
                  Back to Explorer
                </Link>
                <StatusPill tone={isLoading ? "warn" : errorMessage ? "bad" : "good"}>
                  {isLoading ? "loading" : errorMessage ? "sync error" : "metadata live"}
                </StatusPill>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <a href="#ingest" className="rounded-full border border-[#d7e3f5] bg-white px-4 py-2 text-sm font-semibold text-[#1f2b46] transition hover:border-[#bfd2f4] hover:text-[#2354a8]">
                Ingest API
              </a>
              <a href="#thirdweb" className="rounded-full border border-[#d7e3f5] bg-white px-4 py-2 text-sm font-semibold text-[#1f2b46] transition hover:border-[#bfd2f4] hover:text-[#2354a8]">
                thirdweb Webhook
              </a>
              <a href="#snapshot" className="rounded-full border border-[#d7e3f5] bg-white px-4 py-2 text-sm font-semibold text-[#1f2b46] transition hover:border-[#bfd2f4] hover:text-[#2354a8]">
                Snapshot API
              </a>
              <a href="#ably" className="rounded-full border border-[#d7e3f5] bg-white px-4 py-2 text-sm font-semibold text-[#1f2b46] transition hover:border-[#bfd2f4] hover:text-[#2354a8]">
                Ably Stream
              </a>
            </div>
          </div>
        </section>

        <section id="ingest" className="scroll-mt-24 rounded-[28px] border border-[#d7e3f5] bg-white p-5 shadow-[0_18px_60px_-42px_rgba(15,23,42,0.22)] sm:p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#5f84c6]">Ingest API</div>
              <h2 className="mt-2 text-xl font-semibold text-[#1f2b46]">Remote worker HMAC ingest endpoint</h2>
            </div>
            <StatusPill tone="neutral">Headers {resolvedFeedMeta.authHeaders.join(" · ")}</StatusPill>
          </div>
          <div className="mt-4 rounded-[24px] border border-[#dfe8f7] bg-[#f8fbff] p-4">
            <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Endpoint</div>
            <div className="mt-2 break-all text-sm font-semibold text-[#1f2b46]">{resolvedFeedMeta.ingestUrl}</div>
            <div className="mt-3 text-sm leading-6 text-slate-500">
              Backend workers submit normalized transaction hash events here. Requests are authenticated with the configured
              HMAC key, signature, timestamp, and nonce headers.
            </div>
          </div>
        </section>

        <section id="thirdweb" className="scroll-mt-24 rounded-[28px] border border-[#d7e3f5] bg-white p-5 shadow-[0_18px_60px_-42px_rgba(15,23,42,0.22)] sm:p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#5f84c6]">thirdweb Webhook</div>
              <h2 className="mt-2 text-xl font-semibold text-[#1f2b46]">Managed USDT transfer filters</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              <StatusPill
                tone={
                  thirdwebWebhookStatus?.mode === "persisted-fallback"
                    ? "warn"
                    : thirdwebWebhookStatus?.ok
                      ? "good"
                      : "bad"
                }
              >
                {thirdwebWebhookStatus?.mode === "persisted-fallback"
                  ? "cached fallback"
                  : thirdwebWebhookStatus?.ok
                    ? "live status ok"
                    : "live status error"}
              </StatusPill>
              <StatusPill tone="neutral">
                active {Number(thirdwebWebhookStatus?.activeWebhookCount || 0)} / expected {Number(thirdwebWebhookStatus?.expectedWebhookCount || 0)}
              </StatusPill>
            </div>
          </div>

          <div className="mt-4 grid gap-4 xl:grid-cols-[1.1fr,0.9fr]">
            <div className="rounded-[24px] border border-[#dfe8f7] bg-[#f8fbff] p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Receiver URL</div>
              <div className="mt-2 break-all text-sm font-semibold text-[#1f2b46]">{resolvedFeedMeta.thirdwebWebhookUrl}</div>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">Topic</div>
                  <div className="mt-1 text-sm text-slate-700">{resolvedFeedMeta.thirdwebWebhookTopic}</div>
                </div>
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">Signature Hash</div>
                  <div className="mt-1 break-all text-sm text-slate-700">{resolvedFeedMeta.thirdwebWebhookSigHash}</div>
                </div>
                <div className="md:col-span-2">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">Contract</div>
                  <div className="mt-1 break-all text-sm text-slate-700">{resolvedFeedMeta.thirdwebWebhookContractAddress}</div>
                </div>
                <div className="md:col-span-2">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">Filter</div>
                  <div className="mt-1 text-sm text-slate-700">{resolvedFeedMeta.thirdwebWebhookFilterHint}</div>
                </div>
                <div className="md:col-span-2">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">Headers</div>
                  <div className="mt-1 text-sm text-slate-700">{resolvedFeedMeta.thirdwebWebhookHeaders.join(" · ")}</div>
                </div>
              </div>
            </div>

            <div className="rounded-[24px] border border-[#dfe8f7] bg-white p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Live Status</div>
              <div className="mt-3 flex flex-wrap gap-2">
                <StatusPill tone="neutral">wallets {Number(thirdwebWebhookStatus?.expectedWalletCount || 0)}</StatusPill>
                <StatusPill tone={Number(thirdwebWebhookStatus?.urlMismatchCount || 0) > 0 ? "warn" : "neutral"}>
                  url mismatch {Number(thirdwebWebhookStatus?.urlMismatchCount || 0)}
                </StatusPill>
                <StatusPill tone="neutral">managed {Number(thirdwebWebhookStatus?.managedWebhookCount || 0)}</StatusPill>
              </div>
              <div className="mt-3 text-sm text-slate-500">
                Receiver · {thirdwebWebhookStatus?.receiverUrl || resolvedFeedMeta.thirdwebWebhookUrl}
              </div>
              <div className="mt-1 text-sm text-slate-500">
                Source · {thirdwebWebhookStatus?.mode === "persisted-fallback" ? "persisted managed webhook records" : "live thirdweb api"}
              </div>
              <div className="mt-1 text-sm text-slate-500">Fetched · {formatDateTime(thirdwebWebhookStatus?.fetchedAt)}</div>
              {thirdwebError ? (
                <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {thirdwebError}
                </div>
              ) : null}
            </div>
          </div>

          {webhookRecords.length > 0 ? (
            <div className="mt-4 rounded-[24px] border border-[#dfe8f7] bg-white p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Managed Webhooks</div>
              <div className="mt-4 grid gap-3">
                {webhookRecords.map((item) => (
                  <div key={item.id || item.name || item.webhookUrl} className="rounded-[20px] border border-slate-200 bg-[#fbfdff] px-4 py-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-[#1f2b46]">{item.name || item.id || "managed webhook"}</span>
                      <StatusPill tone={item.disabled ? "bad" : "good"}>{item.disabled ? "disabled" : "active"}</StatusPill>
                      <StatusPill tone={item.urlMatchesExpected ? "neutral" : "warn"}>
                        {item.urlMatchesExpected ? "url ok" : "url mismatch"}
                      </StatusPill>
                      <StatusPill tone="neutral">{Number(item.walletCount || 0)} wallet</StatusPill>
                    </div>
                    <div className="mt-2 break-all text-sm text-slate-500">{item.webhookUrl || "-"}</div>
                    <div className="mt-1 text-xs text-slate-400">Updated · {formatDateTime(item.updatedAt)}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </section>

        <section id="snapshot" className="scroll-mt-24 rounded-[28px] border border-[#d7e3f5] bg-white p-5 shadow-[0_18px_60px_-42px_rgba(15,23,42,0.22)] sm:p-6">
          <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#5f84c6]">Snapshot API</div>
          <h2 className="mt-2 text-xl font-semibold text-[#1f2b46]">Public sync endpoint</h2>
          <div className="mt-4 rounded-[24px] border border-[#dfe8f7] bg-[#f8fbff] p-4">
            <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Endpoint</div>
            <div className="mt-2 break-all text-sm font-semibold text-[#1f2b46]">{resolvedFeedMeta.snapshotUrl}</div>
            <div className="mt-3 text-sm leading-6 text-slate-500">
              Public clients resync against this endpoint to recover from dropped realtime messages. Supported query params
              include `limit` and `address`.
            </div>
          </div>
        </section>

        <section id="ably" className="scroll-mt-24 rounded-[28px] border border-[#d7e3f5] bg-white p-5 shadow-[0_18px_60px_-42px_rgba(15,23,42,0.22)] sm:p-6">
          <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#5f84c6]">Ably Stream</div>
          <h2 className="mt-2 text-xl font-semibold text-[#1f2b46]">Realtime broadcast channel</h2>
          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            <div className="rounded-[24px] border border-[#dfe8f7] bg-[#f8fbff] p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Channel</div>
              <div className="mt-2 break-all text-sm font-semibold text-[#1f2b46]">{resolvedFeedMeta.channel}</div>
            </div>
            <div className="rounded-[24px] border border-[#dfe8f7] bg-[#f8fbff] p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Event</div>
              <div className="mt-2 break-all text-sm font-semibold text-[#1f2b46]">{resolvedFeedMeta.eventName}</div>
            </div>
            <div className="rounded-[24px] border border-[#dfe8f7] bg-[#f8fbff] p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Auth URL</div>
              <div className="mt-2 break-all text-sm font-semibold text-[#1f2b46]">{resolvedFeedMeta.authUrl}</div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
