import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { chain as configuredChain } from "@/app/config/contractAddresses";
import {
  getLatestTransactionHashLogEvents,
  getTransactionHashLogEventByHash,
} from "@lib/api/tokenTransfer";
import { getRelativeTimeInfo } from "@lib/realtime/timeAgo";

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

function buildIdentityTags(
  identity: NonNullable<Awaited<ReturnType<typeof getTransactionHashLogEventByHash>>>["fromIdentity"] | null | undefined,
): string[] {
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

export default async function ScanTransactionDetailPage({
  params,
}: {
  params: { lang: string; txHash: string };
}) {
  const lang = params.lang || "ko";
  const txHash = String(params.txHash || "").trim();

  const event = await getTransactionHashLogEventByHash(txHash);
  if (!event) {
    notFound();
  }

  const relatedAddress = event.fromWalletAddress || event.toWalletAddress || null;
  const relatedEvents = relatedAddress
    ? (await getLatestTransactionHashLogEvents({
        limit: 8,
        address: relatedAddress,
      })).filter((item) => item.transactionHash.toLowerCase() !== event.transactionHash.toLowerCase())
    : [];

  const explorerTxUrl = `${getExplorerBaseUrl()}/tx/${event.transactionHash}`;
  const chainLabel = String(event.chain || configuredChain || "bsc").toUpperCase();
  const chainLogoSrc = getChainLogoSrc();
  const chainMarketLabel = getChainMarketLabel();
  const detectedAt = event.publishedAt || event.minedAt || event.createdAt || null;
  const onChainAt = event.minedAt || event.createdAt || null;
  const detectedRelativeTime = getRelativeTimeInfo(detectedAt || event.createdAt);
  const fromIdentityTags = buildIdentityTags(event.fromIdentity || null);
  const toIdentityTags = buildIdentityTags(event.toIdentity || null);

  return (
    <div className="min-h-screen bg-[#f4f1ea] text-[#1f2937]">
      <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-5 px-4 py-5 sm:px-6 lg:px-8">
        <section className="overflow-hidden rounded-[28px] border border-[#d8d2c4] bg-white shadow-[0_30px_90px_-54px_rgba(64,45,0,0.32)]">
          <div className="grid gap-0 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
            <div className="bg-[#111827] px-5 py-5 sm:px-7">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex min-w-0 items-start gap-4">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[20px] border border-white/10 bg-white/5">
                    <Image src={chainLogoSrc} alt={chainMarketLabel} width={42} height={42} className="h-10 w-10 object-contain" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#f8d561]">
                      Scan / Tx Detail
                    </div>
                    <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-[30px]">
                      Transaction Overview
                    </h1>
                    <p className="mt-2 break-all text-sm text-[#c9d1de]">{event.transactionHash}</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`/${lang}/scan`}
                    className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-white/10"
                  >
                    All Transactions
                  </Link>
                  <a
                    href={explorerTxUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full bg-[#f0b90b] px-3 py-1.5 text-xs font-semibold text-[#1d1f24] transition hover:bg-[#e0aa05]"
                  >
                    Open in BscScan
                  </a>
                </div>
              </div>
            </div>

            <div className="border-t border-[#e9dcc0] bg-[linear-gradient(180deg,_#fff6db_0%,_#fffdf7_100%)] px-5 py-5 sm:px-7 lg:border-l lg:border-t-0">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                <div className="rounded-[22px] border border-[#ecdca6] bg-white/80 px-4 py-4">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#8a6a18]">Network</div>
                  <div className="mt-2 text-lg font-semibold text-[#1d1f24]">{chainMarketLabel}</div>
                  <div className="mt-1 text-sm text-[#6c7483]">{event.tokenSymbol} transfer trace</div>
                </div>
                <div className="rounded-[22px] border border-[#ecdca6] bg-white/80 px-4 py-4">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#8a6a18]">Detected</div>
                  <div className="mt-2 text-base font-semibold text-[#1d1f24]">
                    {detectedRelativeTime.relativeLabel}
                  </div>
                  <div className="mt-1 text-sm text-[#6c7483]">{formatDateTime(detectedAt)}</div>
                </div>
                <div className="rounded-[22px] border border-[#ecdca6] bg-white/80 px-4 py-4 sm:col-span-2 lg:col-span-1">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#8a6a18]">Amount</div>
                  <div className="mt-2 text-[28px] font-semibold tracking-tight text-[#0f7a4b]">
                    {formatUsdt(event.amountUsdt)} USDT
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-[#f0e5c4] bg-[#fff8e5] px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#7b6a39] sm:px-7">
            Transaction hash, counterparties, and related wallet activity
          </div>
        </section>

        <section className="overflow-hidden rounded-[28px] border border-[#e8dcc0] bg-white shadow-[0_18px_60px_-42px_rgba(64,45,0,0.28)]">
          <div className="grid gap-4 px-5 py-5 sm:px-7 lg:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.9fr)]">
            <div className="rounded-[24px] border border-[#eadcb6] bg-[#fffdf7] px-5 py-4 shadow-sm">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8a6a18]">Status</div>
                  <div className="mt-2 inline-flex rounded-full border border-[#d9deea] bg-[#f6f8fb] px-3 py-1 text-sm font-semibold text-[#5f6b85]">
                    {event.status || "registered"}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8a6a18]">Token / Chain</div>
                  <div className="mt-2 text-base font-semibold text-[#1d1f24]">{event.tokenSymbol} · {chainLabel}</div>
                </div>
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8a6a18]">Detected</div>
                  <div className="mt-2 text-base font-semibold text-[#1d1f24]">{detectedRelativeTime.relativeLabel}</div>
                  <div className="mt-1 text-xs text-[#5f6b85]">{formatDateTime(detectedAt)}</div>
                  {onChainAt && onChainAt !== detectedAt ? (
                    <div className="mt-1 text-xs text-[#8d95a5]">On-chain {formatDateTime(onChainAt)}</div>
                  ) : null}
                </div>
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8a6a18]">Amount</div>
                  <div className="mt-2 text-base font-semibold text-[#0f7a4b]">{formatUsdt(event.amountUsdt)} USDT</div>
                </div>
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8a6a18]">Trade ID</div>
                  <div className="mt-2 text-base font-semibold text-[#1d1f24]">{event.tradeId || "-"}</div>
                </div>
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8a6a18]">Order ID</div>
                  <div className="mt-2 break-all text-sm font-medium text-[#1d1f24]">{event.orderId || "-"}</div>
                </div>
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8a6a18]">Queue ID</div>
                  <div className="mt-2 break-all text-sm font-medium text-[#1d1f24]">{event.queueId || "-"}</div>
                </div>
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8a6a18]">Source</div>
                  <div className="mt-2 break-all text-sm font-medium text-[#1d1f24]">{event.source}</div>
                </div>
              </div>
            </div>

            <div className="grid gap-3">
              <div className="rounded-[24px] border border-[#eadcb6] bg-[#fffdf7] px-5 py-4 shadow-sm">
                <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8a6a18]">From</div>
                {event.fromWalletAddress ? (
                  <Link
                    href={`/${lang}/scan/address/${event.fromWalletAddress}/tokentxns`}
                    className="mt-2 block break-all text-sm font-semibold text-[#0784c3] hover:text-[#05679d]"
                  >
                    {event.fromWalletAddress}
                  </Link>
                ) : (
                  <div className="mt-2 text-sm font-semibold text-[#1d1f24]">-</div>
                )}
                <div className="mt-1 text-sm text-[#5f6b85]">{event.fromLabel || "-"}</div>
                {fromIdentityTags.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {fromIdentityTags.map((tag) => (
                      <span
                        key={`from-${tag}`}
                        className="rounded-full border border-[#eadcb6] bg-[#fffbef] px-2 py-1 text-[11px] font-medium text-[#7b6a39]"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
              <div className="rounded-[24px] border border-[#eadcb6] bg-[#fffdf7] px-5 py-4 shadow-sm">
                <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8a6a18]">To</div>
                {event.toWalletAddress ? (
                  <Link
                    href={`/${lang}/scan/address/${event.toWalletAddress}/tokentxns`}
                    className="mt-2 block break-all text-sm font-semibold text-[#0784c3] hover:text-[#05679d]"
                  >
                    {event.toWalletAddress}
                  </Link>
                ) : (
                  <div className="mt-2 text-sm font-semibold text-[#1d1f24]">-</div>
                )}
                <div className="mt-1 text-sm text-[#5f6b85]">{event.toLabel || "-"}</div>
                {toIdentityTags.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {toIdentityTags.map((tag) => (
                      <span
                        key={`to-${tag}`}
                        className="rounded-full border border-[#eadcb6] bg-[#fffbef] px-2 py-1 text-[11px] font-medium text-[#7b6a39]"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
              <div className="rounded-[24px] border border-[#eadcb6] bg-[#fffdf7] px-5 py-4 shadow-sm">
                <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8a6a18]">Store</div>
                <div className="mt-2 text-base font-semibold text-[#1d1f24]">{event.store?.code || "-"}</div>
                <div className="mt-1 text-sm text-[#5f6b85]">{event.store?.name || "-"}</div>
              </div>
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-[28px] border border-[#e8dcc0] bg-white shadow-[0_18px_60px_-42px_rgba(64,45,0,0.28)]">
          <div className="border-b border-[#f0e5c4] bg-[#fff8e5] px-5 py-4 sm:px-7">
            <div className="text-xs font-semibold uppercase tracking-[0.24em] text-[#7b6a39]">Related Transactions</div>
            <h2 className="mt-1 text-lg font-semibold text-[#1d1f24]">Same wallet activity</h2>
          </div>

          <div className="divide-y divide-[#f3ead2]">
            {relatedEvents.length === 0 ? (
              <div className="px-6 py-10 text-sm text-[#5f6b85]">표시할 관련 transaction이 없습니다.</div>
            ) : (
              relatedEvents.map((item) => (
                <div key={item.eventId} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
                  <div className="min-w-0">
                    <Link
                      href={`/${lang}/scan/tx/${item.transactionHash}`}
                      className="font-semibold text-[#0784c3] hover:text-[#05679d]"
                    >
                      {item.transactionHash}
                    </Link>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[#5f6b85]">
                      <span>{item.tradeId || "-"}</span>
                      <span>·</span>
                      <span>{item.store?.code || "-"}</span>
                      <span>·</span>
                      <span>{formatShortAddress(item.fromWalletAddress)}</span>
                      <span>→</span>
                      <span>{formatShortAddress(item.toWalletAddress)}</span>
                    </div>
                  </div>
                  <div className="text-sm font-semibold text-[#0f7a4b]">{formatUsdt(item.amountUsdt)} USDT</div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
