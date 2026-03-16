import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { chain as configuredChain } from "@/app/config/contractAddresses";
import {
  getLatestTransactionHashLogEvents,
  getTransactionHashLogEventsByHash,
} from "@lib/api/tokenTransfer";
import { type UsdtTransactionHashRealtimeEvent } from "@lib/ably/constants";
import { getRelativeTimeInfo } from "@lib/realtime/timeAgo";

type PartyIdentity = NonNullable<UsdtTransactionHashRealtimeEvent["fromIdentity"]>;
type TransactionPartyGroup = {
  address: string | null;
  label: string;
  identity: PartyIdentity | null;
  totalUsdt: number;
  tags: string[];
};

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
  identity: PartyIdentity | null | undefined,
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

function groupTransactionParties(
  events: UsdtTransactionHashRealtimeEvent[],
  side: "from" | "to",
): TransactionPartyGroup[] {
  const groups = new Map<string, TransactionPartyGroup>();

  for (const event of events) {
    const address = String(
      side === "from" ? event.fromWalletAddress || "" : event.toWalletAddress || "",
    ).trim();
    const identity = side === "from" ? (event.fromIdentity || null) : (event.toIdentity || null);
    const label = String(side === "from" ? event.fromLabel || "" : event.toLabel || "").trim() || "Tagged wallet";
    const key = address.toLowerCase() || `${side}:${label}`;
    const existing = groups.get(key);

    if (!existing) {
      groups.set(key, {
        address: address || null,
        label,
        identity,
        totalUsdt: Number(event.amountUsdt || 0),
        tags: buildIdentityTags(identity),
      });
      continue;
    }

    existing.totalUsdt += Number(event.amountUsdt || 0);
  }

  return Array.from(groups.values()).sort((left, right) => right.totalUsdt - left.totalUsdt);
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

  const events = await getTransactionHashLogEventsByHash(txHash, 40);
  const event = events[0] || null;
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
  const totalUsdt = events.reduce((sum, item) => sum + Number(item.amountUsdt || 0), 0);
  const transferCount = events.length;
  const fromGroups = groupTransactionParties(events, "from");
  const toGroups = groupTransactionParties(events, "to");

  return (
    <div className="min-h-screen bg-[#f4f1ea] text-[#1f2937]">
      <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-4 px-3 py-4 sm:px-6 sm:py-5 lg:px-8">
        <section className="overflow-hidden rounded-[24px] border border-[#d8d2c4] bg-white shadow-[0_30px_90px_-54px_rgba(64,45,0,0.32)]">
          <div className="grid gap-0 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
            <div className="bg-[#111827] px-4 py-4 sm:px-6 sm:py-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex min-w-0 items-start gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[18px] border border-white/10 bg-white/5 sm:h-16 sm:w-16 sm:rounded-[20px]">
                    <Image src={chainLogoSrc} alt={chainMarketLabel} width={42} height={42} className="h-8 w-8 object-contain sm:h-10 sm:w-10" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#f8d561]">
                      Scan / Tx Detail
                    </div>
                    <h1 className="mt-2 text-[1.65rem] font-semibold tracking-tight text-white sm:text-[30px]">
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

            <div className="border-t border-[#e9dcc0] bg-[linear-gradient(180deg,_#fff6db_0%,_#fffdf7_100%)] px-4 py-4 sm:px-6 sm:py-5 lg:border-l lg:border-t-0">
              <div className="grid gap-2.5 sm:grid-cols-2">
                <div className="rounded-[20px] border border-[#ecdca6] bg-white/80 px-3.5 py-3.5 sm:px-4 sm:py-4">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#8a6a18]">Detected</div>
                  <div className="mt-2 text-base font-semibold text-[#1d1f24]">
                    {detectedRelativeTime.relativeLabel}
                  </div>
                  <div className="mt-1 text-sm text-[#6c7483]">{formatDateTime(detectedAt)}</div>
                </div>
                <div className="rounded-[20px] border border-[#ecdca6] bg-white/80 px-3.5 py-3.5 sm:px-4 sm:py-4">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#8a6a18]">Amount</div>
                  <div className="mt-2 text-[28px] font-semibold tracking-tight text-[#0f7a4b]">
                    {formatUsdt(totalUsdt)} USDT
                  </div>
                  <div className="mt-1 text-sm text-[#6c7483]">{transferCount} transfer logs</div>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-[#f0e5c4] bg-[#fff8e5] px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#7b6a39] sm:px-7">
            Transaction hash, counterparties, and related wallet activity
          </div>
        </section>

        <section className="overflow-hidden rounded-[24px] border border-[#e8dcc0] bg-white shadow-[0_18px_60px_-42px_rgba(64,45,0,0.28)]">
          <div className="grid gap-3 px-4 py-4 sm:px-6 sm:py-5 lg:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.9fr)]">
            <div className="rounded-[20px] border border-[#eadcb6] bg-[#fffdf7] px-4 py-3.5 shadow-sm sm:px-5 sm:py-4">
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
                  <div className="mt-2 text-base font-semibold text-[#0f7a4b]">{formatUsdt(totalUsdt)} USDT</div>
                </div>
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8a6a18]">Transfer Logs</div>
                  <div className="mt-2 text-base font-semibold text-[#1d1f24]">{transferCount}</div>
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

            <div className="grid gap-2.5">
              <div className="rounded-[20px] border border-[#eadcb6] bg-[#fffdf7] px-4 py-3.5 shadow-sm sm:px-5 sm:py-4">
                <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8a6a18]">From</div>
                <div className="mt-2 space-y-3">
                  {fromGroups.map((group, index) => (
                    <div
                      key={`from-${group.address || group.label}-${index}`}
                      className="rounded-[18px] border border-[#efe3c0] bg-white px-3 py-3"
                    >
                      {group.address ? (
                        <Link
                          href={`/${lang}/scan/address/${group.address}/tokentxns`}
                          className="block break-all text-sm font-semibold text-[#0784c3] hover:text-[#05679d]"
                        >
                          {group.address}
                        </Link>
                      ) : (
                        <div className="text-sm font-semibold text-[#1d1f24]">-</div>
                      )}
                      <div className="mt-1 text-sm text-[#5f6b85]">{group.label || "-"}</div>
                      <div className="mt-2 text-sm font-semibold text-[#0f7a4b]">{formatUsdt(group.totalUsdt)} USDT</div>
                      {group.tags.length > 0 ? (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {group.tags.map((tag) => (
                            <span
                              key={`from-${group.address || group.label}-${tag}`}
                              className="rounded-full border border-[#eadcb6] bg-[#fffbef] px-2 py-1 text-[11px] font-medium text-[#7b6a39]"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-[20px] border border-[#eadcb6] bg-[#fffdf7] px-4 py-3.5 shadow-sm sm:px-5 sm:py-4">
                <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8a6a18]">To</div>
                <div className="mt-2 space-y-3">
                  {toGroups.map((group, index) => (
                    <div
                      key={`to-${group.address || group.label}-${index}`}
                      className="rounded-[18px] border border-[#efe3c0] bg-white px-3 py-3"
                    >
                      {group.address ? (
                        <Link
                          href={`/${lang}/scan/address/${group.address}/tokentxns`}
                          className="block break-all text-sm font-semibold text-[#0784c3] hover:text-[#05679d]"
                        >
                          {group.address}
                        </Link>
                      ) : (
                        <div className="text-sm font-semibold text-[#1d1f24]">-</div>
                      )}
                      <div className="mt-1 text-sm text-[#5f6b85]">{group.label || "-"}</div>
                      <div className="mt-2 text-sm font-semibold text-[#0f7a4b]">{formatUsdt(group.totalUsdt)} USDT</div>
                      {group.tags.length > 0 ? (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {group.tags.map((tag) => (
                            <span
                              key={`to-${group.address || group.label}-${tag}`}
                              className="rounded-full border border-[#eadcb6] bg-[#fffbef] px-2 py-1 text-[11px] font-medium text-[#7b6a39]"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-[20px] border border-[#eadcb6] bg-[#fffdf7] px-4 py-3.5 shadow-sm sm:px-5 sm:py-4">
                <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8a6a18]">Store</div>
                <div className="mt-2 text-base font-semibold text-[#1d1f24]">{event.store?.code || "-"}</div>
                <div className="mt-1 text-sm text-[#5f6b85]">{event.store?.name || "-"}</div>
              </div>
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-[24px] border border-[#e8dcc0] bg-white shadow-[0_18px_60px_-42px_rgba(64,45,0,0.28)]">
          <div className="border-b border-[#f0e5c4] bg-[#fff8e5] px-4 py-3.5 sm:px-6 sm:py-4">
            <div className="text-xs font-semibold uppercase tracking-[0.24em] text-[#7b6a39]">Related Transactions</div>
            <h2 className="mt-1 text-lg font-semibold text-[#1d1f24]">Same wallet activity</h2>
          </div>

          <div className="divide-y divide-[#f3ead2]">
            {relatedEvents.length === 0 ? (
              <div className="px-4 py-8 text-sm text-[#5f6b85] sm:px-6 sm:py-10">표시할 관련 transaction이 없습니다.</div>
            ) : (
              relatedEvents.map((item) => (
                <div key={item.eventId} className="flex flex-col gap-2.5 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-4">
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
