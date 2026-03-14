import Link from "next/link";
import { notFound } from "next/navigation";

import { chain as configuredChain } from "@/app/config/contractAddresses";
import {
  getLatestTransactionHashLogEvents,
  getTransactionHashLogEventByHash,
} from "@lib/api/tokenTransfer";
import { getRelativeTimeInfo } from "@lib/realtime/timeAgo";

function formatUsdt(value: number): string {
  return Number(value || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 3,
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

  const relativeTime = getRelativeTimeInfo(event.createdAt);
  const explorerTxUrl = `${getExplorerBaseUrl()}/tx/${event.transactionHash}`;
  const chainLabel = String(event.chain || configuredChain || "bsc").toUpperCase();

  return (
    <div className="min-h-screen bg-[#f4f7fb] text-slate-900">
      <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-5 px-4 py-5 sm:px-6 lg:px-8">
        <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_24px_80px_-48px_rgba(15,23,42,0.35)]">
          <div className="border-b border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.14),_transparent_42%),linear-gradient(135deg,_#ffffff,_#f8fbff)] px-5 py-5 sm:px-7">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-sky-700">
                  Scan / Tx Detail
                </div>
                <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 sm:text-[30px]">
                  Transaction Overview
                </h1>
                <p className="mt-2 break-all text-sm text-slate-600">{event.transactionHash}</p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href={`/${lang}/scan`}
                  className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
                >
                  All Transactions
                </Link>
                <a
                  href={explorerTxUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-700 transition hover:border-sky-300 hover:bg-sky-100"
                >
                  Explorer 열기
                </a>
              </div>
            </div>
          </div>

          <div className="grid gap-4 px-5 py-5 sm:px-7 lg:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.9fr)]">
            <div className="rounded-[24px] border border-slate-200 bg-white px-5 py-4 shadow-sm">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Status</div>
                  <div className="mt-2 inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm font-semibold text-slate-700">
                    {event.status || "registered"}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Token / Chain</div>
                  <div className="mt-2 text-base font-semibold text-slate-900">{event.tokenSymbol} · {chainLabel}</div>
                </div>
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Observed</div>
                  <div className="mt-2 text-base font-semibold text-slate-900">{relativeTime.relativeLabel}</div>
                  <div className="mt-1 text-xs text-slate-500">{relativeTime.absoluteLabel}</div>
                </div>
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Amount</div>
                  <div className="mt-2 text-base font-semibold text-emerald-600">{formatUsdt(event.amountUsdt)} USDT</div>
                </div>
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Trade ID</div>
                  <div className="mt-2 text-base font-semibold text-slate-900">{event.tradeId || "-"}</div>
                </div>
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Order ID</div>
                  <div className="mt-2 break-all text-sm font-medium text-slate-900">{event.orderId || "-"}</div>
                </div>
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Queue ID</div>
                  <div className="mt-2 break-all text-sm font-medium text-slate-900">{event.queueId || "-"}</div>
                </div>
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Source</div>
                  <div className="mt-2 break-all text-sm font-medium text-slate-900">{event.source}</div>
                </div>
              </div>
            </div>

            <div className="grid gap-3">
              <div className="rounded-[24px] border border-slate-200 bg-white px-5 py-4 shadow-sm">
                <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">From</div>
                {event.fromWalletAddress ? (
                  <Link
                    href={`/${lang}/scan/address/${event.fromWalletAddress}/tokentxns`}
                    className="mt-2 block break-all text-sm font-semibold text-sky-700 hover:text-sky-800"
                  >
                    {event.fromWalletAddress}
                  </Link>
                ) : (
                  <div className="mt-2 text-sm font-semibold text-slate-900">-</div>
                )}
                <div className="mt-1 text-sm text-slate-500">{event.fromLabel || "-"}</div>
              </div>
              <div className="rounded-[24px] border border-slate-200 bg-white px-5 py-4 shadow-sm">
                <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">To</div>
                {event.toWalletAddress ? (
                  <Link
                    href={`/${lang}/scan/address/${event.toWalletAddress}/tokentxns`}
                    className="mt-2 block break-all text-sm font-semibold text-sky-700 hover:text-sky-800"
                  >
                    {event.toWalletAddress}
                  </Link>
                ) : (
                  <div className="mt-2 text-sm font-semibold text-slate-900">-</div>
                )}
                <div className="mt-1 text-sm text-slate-500">{event.toLabel || "-"}</div>
              </div>
              <div className="rounded-[24px] border border-slate-200 bg-white px-5 py-4 shadow-sm">
                <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Store</div>
                <div className="mt-2 text-base font-semibold text-slate-900">{event.store?.code || "-"}</div>
                <div className="mt-1 text-sm text-slate-500">{event.store?.name || "-"}</div>
              </div>
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_18px_60px_-42px_rgba(15,23,42,0.32)]">
          <div className="border-b border-slate-200 px-5 py-4 sm:px-7">
            <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Related Transactions</div>
            <h2 className="mt-1 text-lg font-semibold text-slate-950">Same wallet activity</h2>
          </div>

          <div className="divide-y divide-slate-100">
            {relatedEvents.length === 0 ? (
              <div className="px-6 py-10 text-sm text-slate-500">표시할 관련 transaction이 없습니다.</div>
            ) : (
              relatedEvents.map((item) => (
                <div key={item.eventId} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
                  <div className="min-w-0">
                    <Link
                      href={`/${lang}/scan/tx/${item.transactionHash}`}
                      className="font-semibold text-sky-700 hover:text-sky-800"
                    >
                      {item.transactionHash}
                    </Link>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <span>{item.tradeId || "-"}</span>
                      <span>·</span>
                      <span>{item.store?.code || "-"}</span>
                      <span>·</span>
                      <span>{formatShortAddress(item.fromWalletAddress)}</span>
                      <span>→</span>
                      <span>{formatShortAddress(item.toWalletAddress)}</span>
                    </div>
                  </div>
                  <div className="text-sm font-semibold text-emerald-600">{formatUsdt(item.amountUsdt)} USDT</div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
