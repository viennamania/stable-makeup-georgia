"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ConnectButton, useActiveAccount } from "thirdweb/react";
import { getContract } from "thirdweb";
import { balanceOf } from "thirdweb/extensions/erc20";
import { arbitrum, bsc, ethereum, polygon } from "thirdweb/chains";
import { inAppWallet } from "thirdweb/wallets";

import { client } from "@/app/client";
import {
  chain as configuredChain,
  arbitrumContractAddressUSDT,
  bscContractAddressUSDT,
  ethereumContractAddressUSDT,
  polygonContractAddressUSDT,
} from "@/app/config/contractAddresses";

const promotionWallets = [
  inAppWallet({
    auth: {
      options: ["phone"],
      defaultSmsCountryCode: "KR",
    },
  }),
];

const promotionChain =
  configuredChain === "ethereum"
    ? ethereum
    : configuredChain === "polygon"
      ? polygon
      : configuredChain === "bsc"
        ? bsc
        : arbitrum;

const usdtContractAddress =
  configuredChain === "ethereum"
    ? ethereumContractAddressUSDT
    : configuredChain === "polygon"
      ? polygonContractAddressUSDT
      : configuredChain === "bsc"
        ? bscContractAddressUSDT
        : arbitrumContractAddressUSDT;

const usdtDecimals = configuredChain === "bsc" ? 18 : 6;

function isValidWalletAddress(value: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(value.trim());
}

function formatBalance(value: number | null): string {
  if (value === null || Number.isNaN(value)) {
    return "-";
  }
  return value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 6,
  });
}

function formatWallet(value: string | null | undefined): string {
  const normalized = String(value || "").trim();
  if (!normalized) {
    return "-";
  }
  if (normalized.length <= 14) {
    return normalized;
  }
  return `${normalized.slice(0, 8)}...${normalized.slice(-6)}`;
}

export default function PromotionWithdrawPage({ params }: { params: { lang: string } }) {
  const router = useRouter();
  const activeAccount = useActiveAccount();
  const walletAddress = activeAccount?.address || "";

  const [recipientAddress, setRecipientAddress] = useState("");
  const [amountInput, setAmountInput] = useState("");
  const [balance, setBalance] = useState<number | null>(null);
  const [loadingBalance, setLoadingBalance] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [touched, setTouched] = useState(false);

  const contract = useMemo(
    () =>
      getContract({
        client,
        chain: promotionChain,
        address: usdtContractAddress,
      }),
    [],
  );

  const normalizedRecipient = recipientAddress.trim();
  const parsedAmount = Number(amountInput);
  const addressValid = isValidWalletAddress(normalizedRecipient);
  const amountValid = Number.isFinite(parsedAmount) && parsedAmount > 0;
  const notSelf =
    !walletAddress || walletAddress.toLowerCase() !== normalizedRecipient.toLowerCase();
  const enoughBalance = balance !== null && amountValid && parsedAmount <= balance;
  const canSubmit = !!walletAddress && addressValid && amountValid && enoughBalance && notSelf;

  const fetchBalance = useCallback(async () => {
    if (!walletAddress) {
      setBalance(null);
      return;
    }
    try {
      setLoadingBalance(true);
      const raw = await balanceOf({
        contract,
        address: walletAddress,
      });
      const normalized = Number(raw) / 10 ** usdtDecimals;
      setBalance(Number.isFinite(normalized) ? normalized : 0);
    } catch (error) {
      console.error("failed to fetch promotion wallet balance", error);
      setBalance(0);
    } finally {
      setLoadingBalance(false);
    }
  }, [contract, walletAddress]);

  useEffect(() => {
    void fetchBalance();
    const timer = window.setInterval(() => {
      void fetchBalance();
    }, 10_000);
    return () => window.clearInterval(timer);
  }, [fetchBalance]);

  const handleAmountChange = useCallback((nextValue: string) => {
    const sanitized = nextValue.replace(/[^\d.]/g, "");
    const normalized = sanitized.replace(/(\..*)\./g, "$1");
    setAmountInput(normalized);
  }, []);

  const handleOpenConfirm = useCallback(() => {
    setTouched(true);
    if (!canSubmit) {
      return;
    }
    setShowConfirmModal(true);
  }, [canSubmit]);

  const handleConfirmTransfer = useCallback(() => {
    const query = new URLSearchParams({
      to: normalizedRecipient,
      amount: String(parsedAmount),
    });
    router.push(`/${params.lang}/promotion/withdraw/processing?${query.toString()}`);
  }, [normalizedRecipient, parsedAmount, params.lang, router]);

  return (
    <main className="min-h-screen bg-[radial-gradient(120%_120%_at_100%_0%,#dbeafe_0%,#eff6ff_35%,#f8fafc_100%)] px-3 py-4 text-slate-900 sm:px-4 sm:py-6">
      <div className="mx-auto flex w-full max-w-md flex-col gap-3 sm:gap-4">
        <section className="rounded-3xl border border-sky-200/80 bg-white/90 p-4 shadow-[0_18px_45px_-28px_rgba(37,99,235,0.5)] backdrop-blur">
          <div className="flex items-center justify-between">
            <Link
              href={`/${params.lang}/promotion`}
              className="inline-flex h-9 items-center justify-center rounded-xl border border-slate-300/70 bg-slate-50 px-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              홈으로
            </Link>
            <span className="rounded-full bg-sky-50 px-3 py-1 text-[11px] font-semibold text-sky-700">
              Banking Withdraw
            </span>
          </div>
          <h1 className="mt-3 text-xl font-bold tracking-tight text-slate-900">USDT 출금</h1>
          <p className="mt-1 text-xs text-slate-500">
            받는 지갑주소와 수량을 입력한 뒤, 확인 모달에서 검토 후 전송하세요.
          </p>
        </section>

        {!walletAddress ? (
          <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-[0_16px_34px_-26px_rgba(15,23,42,0.6)]">
            <p className="text-sm font-semibold text-slate-900">지갑 연결이 필요합니다</p>
            <p className="mt-1 text-xs text-slate-500">
              My Wallet과 동일하게 휴대폰 로그인으로 연결할 수 있습니다.
            </p>
            <div className="mt-3">
              <ConnectButton
                client={client}
                wallets={promotionWallets}
                showAllWallets={false}
                chain={promotionChain}
                accountAbstraction={{
                  chain: promotionChain,
                  sponsorGas: true,
                }}
                theme="dark"
                locale="ko_KR"
                connectButton={{
                  label: "휴대폰으로 지갑연결",
                  style: {
                    width: "100%",
                    minHeight: "42px",
                    borderRadius: "12px",
                    border: "1px solid rgba(56,189,248,0.6)",
                    background: "linear-gradient(135deg, rgba(14,116,144,0.95), rgba(2,132,199,0.9))",
                    color: "#f0f9ff",
                    fontWeight: 700,
                    fontSize: "14px",
                  },
                }}
                connectModal={{
                  size: "wide",
                  titleIcon: "https://www.stable.makeup/logo.png",
                  showThirdwebBranding: false,
                }}
                appMetadata={{
                  name: "OneClick Stable",
                  description: "Promotion withdraw",
                  url: "https://www.stable.makeup",
                  logoUrl: "https://www.stable.makeup/logo.png",
                }}
              />
            </div>
          </section>
        ) : (
          <>
            <section className="rounded-3xl border border-emerald-200/80 bg-white p-4 shadow-[0_16px_34px_-26px_rgba(5,150,105,0.55)]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-emerald-700">My Wallet</p>
              <p className="mt-1 font-mono text-sm text-slate-800">{formatWallet(walletAddress)}</p>
              <div className="mt-3 flex items-end justify-between">
                <div>
                  <p className="text-[11px] text-slate-500">출금 가능 잔액</p>
                  <p className="text-2xl font-bold tracking-tight text-slate-900">
                    {loadingBalance ? "..." : formatBalance(balance)} <span className="text-base">USDT</span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void fetchBalance()}
                  className="rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100"
                >
                  잔액 새로고침
                </button>
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-[0_16px_34px_-26px_rgba(15,23,42,0.55)]">
              <h2 className="text-sm font-semibold text-slate-900">출금 정보 입력</h2>
              <div className="mt-3 space-y-3">
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold text-slate-600">받는 지갑주소</span>
                  <input
                    value={recipientAddress}
                    onChange={(event) => setRecipientAddress(event.target.value)}
                    placeholder="0x..."
                    className="h-11 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 font-mono text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white"
                  />
                </label>

                <label className="block">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-600">보낼 수량 (USDT)</span>
                    <button
                      type="button"
                      onClick={() => {
                        if (balance === null) {
                          return;
                        }
                        setAmountInput(String(Number(Math.max(balance, 0).toFixed(6))));
                      }}
                      className="rounded-lg border border-sky-300 bg-sky-50 px-2 py-1 text-[11px] font-semibold text-sky-700 transition hover:bg-sky-100"
                    >
                      MAX
                    </button>
                  </div>
                  <input
                    value={amountInput}
                    onChange={(event) => handleAmountChange(event.target.value)}
                    placeholder="0.00"
                    inputMode="decimal"
                    className="h-11 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white"
                  />
                </label>
              </div>

              {touched && !addressValid && (
                <p className="mt-2 text-xs text-rose-600">유효한 EVM 지갑주소를 입력하세요.</p>
              )}
              {touched && !amountValid && (
                <p className="mt-2 text-xs text-rose-600">보낼 수량은 0보다 커야 합니다.</p>
              )}
              {touched && amountValid && !enoughBalance && (
                <p className="mt-2 text-xs text-rose-600">잔액이 부족합니다.</p>
              )}
              {touched && addressValid && !notSelf && (
                <p className="mt-2 text-xs text-rose-600">본인 지갑으로는 출금할 수 없습니다.</p>
              )}

              <button
                type="button"
                onClick={handleOpenConfirm}
                className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-xl bg-[linear-gradient(135deg,#0f766e,#0369a1)] text-sm font-bold text-white shadow-[0_16px_28px_-20px_rgba(2,132,199,0.9)] transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={!walletAddress}
              >
                전송하기
              </button>
            </section>
          </>
        )}
      </div>

      {showConfirmModal && (
        <div className="fixed inset-0 z-[180] flex items-center justify-center bg-slate-950/60 px-4 py-6 backdrop-blur-[2px]">
          <div className="w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-4 shadow-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-sky-700">Transfer Confirm</p>
            <h3 className="mt-1 text-lg font-bold text-slate-900">출금 내용을 확인하세요</h3>

            <div className="mt-3 space-y-2 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm">
              <div className="flex items-start justify-between gap-3">
                <span className="text-slate-500">받는 주소</span>
                <span className="max-w-[180px] break-all font-mono text-right text-slate-800">
                  {normalizedRecipient}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-slate-500">수량</span>
                <span className="font-semibold text-slate-900">{parsedAmount} USDT</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-slate-500">네트워크</span>
                <span className="font-semibold uppercase text-slate-900">{configuredChain}</span>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="h-10 rounded-xl border border-slate-300 bg-slate-50 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleConfirmTransfer}
                className="h-10 rounded-xl bg-[linear-gradient(135deg,#0f766e,#0369a1)] text-sm font-bold text-white transition hover:opacity-95"
              >
                확인 후 전송
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
