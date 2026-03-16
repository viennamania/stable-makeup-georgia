"use client";

import Image from "next/image";
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

function getChainLogoSrc(): string {
  return "/logo-chain-bsc.png";
}

function getChainMarketLabel(): string {
  return "BNB Smart Chain";
}

function StatusPill({
  tone,
  children,
}: {
  tone: "neutral" | "good" | "warn" | "bad";
  children: ReactNode;
}) {
  const className =
    tone === "good"
      ? "border-[#ccebd6] bg-[#eefaf2] text-[#0f7a4b]"
      : tone === "warn"
        ? "border-[#f2d996] bg-[#fff8e1] text-[#9a6b00]"
        : tone === "bad"
          ? "border-[#f4c7c3] bg-[#fff3f2] text-[#b5473c]"
          : "border-[#d9deea] bg-[#f6f8fb] text-[#5f6b85]";

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
  const chainLogoSrc = getChainLogoSrc();
  const chainMarketLabel = getChainMarketLabel();
  const statusModeLabel =
    thirdwebWebhookStatus?.mode === "persisted-fallback"
      ? "Persisted fallback"
      : thirdwebWebhookStatus?.ok
        ? "Live thirdweb API"
        : "Status unavailable";

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
    <div className="min-h-screen bg-[#f4f1ea] text-[#1f2937]">
      <div className="mx-auto flex w-full max-w-[1320px] flex-col gap-5 px-4 py-5 sm:px-6 lg:px-8">
        <section className="overflow-hidden rounded-[28px] border border-[#d8d2c4] bg-white shadow-[0_32px_90px_-56px_rgba(64,45,0,0.28)]">
          <div className="grid gap-0 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
            <div className="bg-[#111827] px-5 py-6 sm:px-7">
              <div className="flex items-start gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-[20px] border border-white/10 bg-white/5">
                  <Image src={chainLogoSrc} alt={chainMarketLabel} width={40} height={40} className="h-10 w-10 object-contain" />
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.34em] text-[#f8d561]">
                    Scan Infrastructure
                  </div>
                  <h1 className="mt-3 text-[2rem] font-semibold tracking-tight text-white sm:text-[2.3rem]">
                    Explorer integrations and delivery rails
                  </h1>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-[#c9d1de]">
                    Main explorer keeps only blockchain-facing transfer rows. This page exposes the worker ingress,
                    thirdweb webhook sync, snapshot recovery, and Ably broadcast topology behind that feed.
                  </p>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <a href="#ingest" className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10">
                  Ingest API
                </a>
                <a href="#thirdweb" className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10">
                  thirdweb Webhook
                </a>
                <a href="#snapshot" className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10">
                  Snapshot API
                </a>
                <a href="#ably" className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10">
                  Ably Stream
                </a>
              </div>
            </div>

            <div className="border-t border-[#e9dcc0] bg-[linear-gradient(180deg,_#fff6db_0%,_#fffdf7_100%)] px-5 py-6 sm:px-7 lg:border-l lg:border-t-0">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                <div className="rounded-[22px] border border-[#ecdca6] bg-white/80 px-4 py-4">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#8a6a18]">Network</div>
                  <div className="mt-2 text-lg font-semibold text-[#1d1f24]">{chainMarketLabel}</div>
                  <div className="mt-1 text-sm text-[#6c7483]">USDT transfer ingestion pipeline</div>
                </div>
                <div className="rounded-[22px] border border-[#ecdca6] bg-white/80 px-4 py-4">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#8a6a18]">Status</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <StatusPill tone={isLoading ? "warn" : errorMessage ? "bad" : "good"}>
                      {isLoading ? "loading" : errorMessage ? "sync error" : "metadata live"}
                    </StatusPill>
                    <StatusPill tone={thirdwebWebhookStatus?.ok ? "good" : thirdwebWebhookStatus ? "warn" : "neutral"}>
                      {statusModeLabel}
                    </StatusPill>
                  </div>
                  <div className="mt-3 text-sm text-[#6c7483]">
                    Active {Number(thirdwebWebhookStatus?.activeWebhookCount || 0)} / Expected{" "}
                    {Number(thirdwebWebhookStatus?.expectedWebhookCount || 0)}
                  </div>
                </div>
                <div className="rounded-[22px] border border-[#ecdca6] bg-white/80 px-4 py-4 sm:col-span-2 lg:col-span-1">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#8a6a18]">Explorer</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Link
                      href={`/${lang}/scan`}
                      className="rounded-full bg-[#f0b90b] px-4 py-2 text-sm font-semibold text-[#1d1f24] transition hover:bg-[#e0aa05]"
                    >
                      Back to Explorer
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-[#f0e5c4] bg-[#fff8e5] px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#7b6a39] sm:px-7">
            Ingest, webhook, snapshot, and broadcast endpoints used by /scan
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-[24px] border border-[#e8dcc0] bg-white px-5 py-4 shadow-[0_16px_44px_-34px_rgba(64,45,0,0.28)]">
            <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8a6a18]">Ingest URL</div>
            <div className="mt-2 break-all text-sm font-semibold text-[#1d1f24]">{resolvedFeedMeta.ingestUrl}</div>
          </div>
          <div className="rounded-[24px] border border-[#e8dcc0] bg-white px-5 py-4 shadow-[0_16px_44px_-34px_rgba(64,45,0,0.28)]">
            <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8a6a18]">Webhook Count</div>
            <div className="mt-2 text-[28px] font-semibold tracking-tight text-[#1d1f24]">
              {Number(thirdwebWebhookStatus?.managedWebhookCount || 0)}
            </div>
          </div>
          <div className="rounded-[24px] border border-[#e8dcc0] bg-white px-5 py-4 shadow-[0_16px_44px_-34px_rgba(64,45,0,0.28)]">
            <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8a6a18]">Wallet Scope</div>
            <div className="mt-2 text-[28px] font-semibold tracking-tight text-[#1d1f24]">
              {Number(thirdwebWebhookStatus?.expectedWalletCount || 0)}
            </div>
          </div>
          <div className="rounded-[24px] border border-[#e8dcc0] bg-white px-5 py-4 shadow-[0_16px_44px_-34px_rgba(64,45,0,0.28)]">
            <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8a6a18]">Status Fetched</div>
            <div className="mt-2 text-sm font-semibold text-[#1d1f24]">
              {formatDateTime(thirdwebWebhookStatus?.fetchedAt)}
            </div>
          </div>
        </section>

        <section id="ingest" className="scroll-mt-24 rounded-[28px] border border-[#e8dcc0] bg-white p-5 shadow-[0_18px_60px_-42px_rgba(64,45,0,0.26)] sm:p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#8a6a18]">Ingest API</div>
                <h2 className="mt-2 text-xl font-semibold text-[#1d1f24]">Remote worker HMAC ingest endpoint</h2>
              </div>
            </div>
            <StatusPill tone="neutral">Headers {resolvedFeedMeta.authHeaders.join(" · ")}</StatusPill>
          </div>
          <div className="mt-4 rounded-[24px] border border-[#eadcb6] bg-[#fffbef] p-4">
            <div className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8a6a18]">Endpoint</div>
            <div className="mt-2 break-all text-sm font-semibold text-[#1d1f24]">{resolvedFeedMeta.ingestUrl}</div>
            <div className="mt-3 text-sm leading-6 text-[#5f6b85]">
              Backend workers submit normalized transaction hash events here. Requests are authenticated with the configured
              HMAC key, signature, timestamp, and nonce headers.
            </div>
          </div>
        </section>

        <section id="thirdweb" className="scroll-mt-24 rounded-[28px] border border-[#e8dcc0] bg-white p-5 shadow-[0_18px_60px_-42px_rgba(64,45,0,0.26)] sm:p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#8a6a18]">thirdweb Webhook</div>
              <h2 className="mt-2 text-xl font-semibold text-[#1d1f24]">Managed USDT transfer filters</h2>
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
            <div className="rounded-[24px] border border-[#eadcb6] bg-[#fffbef] p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8a6a18]">Receiver URL</div>
              <div className="mt-2 break-all text-sm font-semibold text-[#1d1f24]">{resolvedFeedMeta.thirdwebWebhookUrl}</div>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#a08a54]">Topic</div>
                  <div className="mt-1 text-sm text-[#364152]">{resolvedFeedMeta.thirdwebWebhookTopic}</div>
                </div>
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#a08a54]">Signature Hash</div>
                  <div className="mt-1 break-all text-sm text-[#364152]">{resolvedFeedMeta.thirdwebWebhookSigHash}</div>
                </div>
                <div className="md:col-span-2">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#a08a54]">Contract</div>
                  <div className="mt-1 break-all text-sm text-[#364152]">{resolvedFeedMeta.thirdwebWebhookContractAddress}</div>
                </div>
                <div className="md:col-span-2">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#a08a54]">Filter</div>
                  <div className="mt-1 text-sm text-[#364152]">{resolvedFeedMeta.thirdwebWebhookFilterHint}</div>
                </div>
                <div className="md:col-span-2">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#a08a54]">Headers</div>
                  <div className="mt-1 text-sm text-[#364152]">{resolvedFeedMeta.thirdwebWebhookHeaders.join(" · ")}</div>
                </div>
              </div>
            </div>

            <div className="rounded-[24px] border border-[#e8dcc0] bg-white p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8a6a18]">Live Status</div>
              <div className="mt-3 flex flex-wrap gap-2">
                <StatusPill tone="neutral">wallets {Number(thirdwebWebhookStatus?.expectedWalletCount || 0)}</StatusPill>
                <StatusPill tone={Number(thirdwebWebhookStatus?.urlMismatchCount || 0) > 0 ? "warn" : "neutral"}>
                  url mismatch {Number(thirdwebWebhookStatus?.urlMismatchCount || 0)}
                </StatusPill>
                <StatusPill tone="neutral">managed {Number(thirdwebWebhookStatus?.managedWebhookCount || 0)}</StatusPill>
              </div>
              <div className="mt-3 text-sm text-[#5f6b85]">
                Receiver · {thirdwebWebhookStatus?.receiverUrl || resolvedFeedMeta.thirdwebWebhookUrl}
              </div>
              <div className="mt-1 text-sm text-[#5f6b85]">
                Source · {thirdwebWebhookStatus?.mode === "persisted-fallback" ? "persisted managed webhook records" : "live thirdweb api"}
              </div>
              <div className="mt-1 text-sm text-[#5f6b85]">Fetched · {formatDateTime(thirdwebWebhookStatus?.fetchedAt)}</div>
              {thirdwebError ? (
                <div className="mt-4 rounded-2xl border border-[#f4c7c3] bg-[#fff3f2] px-4 py-3 text-sm text-[#b5473c]">
                  {thirdwebError}
                </div>
              ) : null}
            </div>
          </div>

          {webhookRecords.length > 0 ? (
            <div className="mt-4 rounded-[24px] border border-[#e8dcc0] bg-white p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8a6a18]">Managed Webhooks</div>
              <div className="mt-4 grid gap-3">
                {webhookRecords.map((item) => (
                  <div key={item.id || item.name || item.webhookUrl} className="rounded-[20px] border border-[#eadcb6] bg-[#fffbef] px-4 py-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-[#1d1f24]">{item.name || item.id || "managed webhook"}</span>
                      <StatusPill tone={item.disabled ? "bad" : "good"}>{item.disabled ? "disabled" : "active"}</StatusPill>
                      <StatusPill tone={item.urlMatchesExpected ? "neutral" : "warn"}>
                        {item.urlMatchesExpected ? "url ok" : "url mismatch"}
                      </StatusPill>
                      <StatusPill tone="neutral">{Number(item.walletCount || 0)} wallet</StatusPill>
                    </div>
                    <div className="mt-2 break-all text-sm text-[#5f6b85]">{item.webhookUrl || "-"}</div>
                    <div className="mt-1 text-xs text-[#8d95a5]">Updated · {formatDateTime(item.updatedAt)}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </section>

        <section id="snapshot" className="scroll-mt-24 rounded-[28px] border border-[#e8dcc0] bg-white p-5 shadow-[0_18px_60px_-42px_rgba(64,45,0,0.26)] sm:p-6">
          <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#8a6a18]">Snapshot API</div>
          <h2 className="mt-2 text-xl font-semibold text-[#1d1f24]">Public sync endpoint</h2>
          <div className="mt-4 rounded-[24px] border border-[#eadcb6] bg-[#fffbef] p-4">
            <div className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8a6a18]">Endpoint</div>
            <div className="mt-2 break-all text-sm font-semibold text-[#1d1f24]">{resolvedFeedMeta.snapshotUrl}</div>
            <div className="mt-3 text-sm leading-6 text-[#5f6b85]">
              Public clients resync against this endpoint to recover from dropped realtime messages. Supported query params
              include `limit` and `address`.
            </div>
          </div>
        </section>

        <section id="ably" className="scroll-mt-24 rounded-[28px] border border-[#e8dcc0] bg-white p-5 shadow-[0_18px_60px_-42px_rgba(64,45,0,0.26)] sm:p-6">
          <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#8a6a18]">Ably Stream</div>
          <h2 className="mt-2 text-xl font-semibold text-[#1d1f24]">Realtime broadcast channel</h2>
          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            <div className="rounded-[24px] border border-[#eadcb6] bg-[#fffbef] p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8a6a18]">Channel</div>
              <div className="mt-2 break-all text-sm font-semibold text-[#1d1f24]">{resolvedFeedMeta.channel}</div>
            </div>
            <div className="rounded-[24px] border border-[#eadcb6] bg-[#fffbef] p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8a6a18]">Event</div>
              <div className="mt-2 break-all text-sm font-semibold text-[#1d1f24]">{resolvedFeedMeta.eventName}</div>
            </div>
            <div className="rounded-[24px] border border-[#eadcb6] bg-[#fffbef] p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8a6a18]">Auth URL</div>
              <div className="mt-2 break-all text-sm font-semibold text-[#1d1f24]">{resolvedFeedMeta.authUrl}</div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
