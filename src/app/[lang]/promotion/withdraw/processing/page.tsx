"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ConnectButton, useActiveAccount } from "thirdweb/react";
import { getContract, sendTransaction, waitForReceipt } from "thirdweb";
import { transfer } from "thirdweb/extensions/erc20";
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

type TransferStatus = "idle" | "sending" | "success" | "error";
type TransferStep = "signature" | "broadcast" | "confirmed";

const transferStepOrder: TransferStep[] = ["signature", "broadcast", "confirmed"];

const transferStepMeta: Record<TransferStep, { label: string; caption: string }> = {
  signature: {
    label: "서명 대기",
    caption: "지갑 앱에서 출금 서명을 승인합니다.",
  },
  broadcast: {
    label: "브로드캐스트",
    caption: "트랜잭션이 네트워크에 전파됩니다.",
  },
  confirmed: {
    label: "확정",
    caption: "블록 확정 후 최종 완료됩니다.",
  },
};

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

function isValidWalletAddress(value: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(value.trim());
}

function getExplorerTxUrl(txHash: string): string {
  if (!txHash) {
    return "";
  }
  if (configuredChain === "ethereum") {
    return `https://etherscan.io/tx/${txHash}`;
  }
  if (configuredChain === "polygon") {
    return `https://polygonscan.com/tx/${txHash}`;
  }
  if (configuredChain === "bsc") {
    return `https://bscscan.com/tx/${txHash}`;
  }
  return `https://arbiscan.io/tx/${txHash}`;
}

function formatWallet(value: string): string {
  const normalized = value.trim();
  if (!normalized) {
    return "-";
  }
  if (normalized.length <= 14) {
    return normalized;
  }
  return `${normalized.slice(0, 8)}...${normalized.slice(-6)}`;
}

export default function PromotionWithdrawProcessingPage({ params }: { params: { lang: string } }) {
  const activeAccount = useActiveAccount();
  const walletAddress = activeAccount?.address || "";
  const searchParams = useSearchParams();

  const [status, setStatus] = useState<TransferStatus>("idle");
  const [currentStep, setCurrentStep] = useState<TransferStep>("signature");
  const [stepNote, setStepNote] = useState("지갑 서명창이 뜨면 승인해 주세요.");
  const [txHash, setTxHash] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const recipientAddress = (searchParams?.get("to") || "").trim();
  const amountText = (searchParams?.get("amount") || "").trim();
  const parsedAmount = Number(amountText);
  const transferInputValid =
    isValidWalletAddress(recipientAddress) && Number.isFinite(parsedAmount) && parsedAmount > 0;

  const activeStepIndex = useMemo(() => {
    if (status === "success") {
      return transferStepOrder.length - 1;
    }
    return Math.max(0, transferStepOrder.indexOf(currentStep));
  }, [currentStep, status]);

  const contract = useMemo(
    () =>
      getContract({
        client,
        chain: promotionChain,
        address: usdtContractAddress,
      }),
    [],
  );

  const sendTransfer = useCallback(async () => {
    if (!activeAccount || !walletAddress) {
      return;
    }
    if (!transferInputValid) {
      setCurrentStep("signature");
      setStepNote("입력값을 먼저 확인해 주세요.");
      setErrorMessage("전송 파라미터가 올바르지 않습니다. 출금 화면에서 다시 시도하세요.");
      setStatus("error");
      return;
    }

    setStatus("sending");
    setCurrentStep("signature");
    setStepNote("지갑 앱/모달에서 전송 서명을 승인하세요.");
    setErrorMessage("");
    setTxHash("");

    try {
      const transaction = transfer({
        contract,
        to: recipientAddress,
        amount: parsedAmount,
      });

      const { transactionHash: nextTxHash } = await sendTransaction({
        transaction,
        account: activeAccount as any,
      });
      if (!nextTxHash) {
        throw new Error("트랜잭션 해시를 확인하지 못했습니다.");
      }
      setTxHash(nextTxHash);
      setCurrentStep("broadcast");
      setStepNote("브로드캐스트 완료. 블록 확정을 기다리는 중입니다.");

      await waitForReceipt({
        client,
        chain: promotionChain,
        transactionHash: nextTxHash,
      });
      setCurrentStep("confirmed");
      setStepNote("블록 확정이 완료되었습니다.");

      try {
        await fetch("/api/transaction/setTransfer", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            lang: params.lang,
            chain: configuredChain,
            walletAddress,
            amount: parsedAmount,
            toWalletAddress: recipientAddress,
          }),
        });
      } catch (error) {
        console.error("failed to save transfer history", error);
      }

      setStatus("success");
    } catch (error) {
      setStatus("error");
      setStepNote("처리 도중 중단되었습니다.");
      setErrorMessage(
        error instanceof Error ? error.message : "전송 처리 중 오류가 발생했습니다. 다시 시도하세요.",
      );
    }
  }, [
    activeAccount,
    contract,
    params.lang,
    parsedAmount,
    recipientAddress,
    transferInputValid,
    walletAddress,
  ]);

  useEffect(() => {
    if (status !== "idle") {
      return;
    }
    if (!walletAddress || !activeAccount) {
      return;
    }
    void sendTransfer();
  }, [activeAccount, sendTransfer, status, walletAddress]);

  const txExplorerUrl = useMemo(() => getExplorerTxUrl(txHash), [txHash]);

  return (
    <main className="min-h-screen bg-[radial-gradient(120%_120%_at_100%_0%,#dbeafe_0%,#eff6ff_35%,#f8fafc_100%)] px-3 py-4 text-slate-900 sm:px-4 sm:py-6">
      <div className="mx-auto flex w-full max-w-md flex-col gap-3 sm:gap-4">
        <section className="rounded-3xl border border-sky-200/80 bg-white/90 p-4 shadow-[0_18px_45px_-28px_rgba(37,99,235,0.5)] backdrop-blur">
          <div className="flex items-center justify-between">
            <Link
              href={`/${params.lang}/promotion/withdraw`}
              className="inline-flex h-9 items-center justify-center rounded-xl border border-slate-300/70 bg-slate-50 px-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              이전으로
            </Link>
            <span className="rounded-full bg-sky-50 px-3 py-1 text-[11px] font-semibold text-sky-700">
              Transfer Processing
            </span>
          </div>
          <h1 className="mt-3 text-xl font-bold tracking-tight text-slate-900">출금 처리</h1>
          <p className="mt-1 text-xs text-slate-500">
            컨펌된 출금 요청을 체인에 전송하고 있습니다.
          </p>
        </section>

        {!walletAddress ? (
          <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-[0_16px_34px_-26px_rgba(15,23,42,0.6)]">
            <p className="text-sm font-semibold text-slate-900">지갑 연결 상태를 확인하세요</p>
            <p className="mt-1 text-xs text-slate-500">
              연결이 끊어졌습니다. 휴대폰 로그인으로 다시 연결 후 처리할 수 있습니다.
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
                  description: "Promotion withdraw processing",
                  url: "https://www.stable.makeup",
                  logoUrl: "https://www.stable.makeup/logo.png",
                }}
              />
            </div>
          </section>
        ) : (
          <>
            <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-[0_16px_34px_-26px_rgba(15,23,42,0.55)]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Transfer Request</p>
              <div className="mt-3 space-y-2 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm">
                <div className="flex items-start justify-between gap-3">
                  <span className="text-slate-500">보내는 지갑</span>
                  <span className="font-mono text-slate-800">{formatWallet(walletAddress)}</span>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <span className="text-slate-500">받는 지갑</span>
                  <span className="font-mono text-slate-800">{formatWallet(recipientAddress)}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-slate-500">수량</span>
                  <span className="font-semibold text-slate-900">{parsedAmount || 0} USDT</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-slate-500">네트워크</span>
                  <span className="font-semibold uppercase text-slate-900">{configuredChain}</span>
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-sky-200 bg-white p-4 shadow-[0_16px_34px_-26px_rgba(2,132,199,0.55)]">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-sky-700">
                    Transfer Steps
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    {status === "success"
                      ? "출금이 확정되었습니다."
                      : status === "error"
                        ? "전송이 중단되었습니다."
                        : "출금 진행 중"}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">{stepNote}</p>
                </div>
                {status === "sending" && (
                  <span className="mt-0.5 inline-flex h-6 w-6 animate-spin rounded-full border-2 border-sky-300 border-t-sky-700" />
                )}
              </div>

              <div className="mt-4">
                <div className="flex items-center">
                  {transferStepOrder.map((step, index) => {
                    const completed = status === "success" || index < activeStepIndex;
                    const active = status !== "success" && index === activeStepIndex;
                    return (
                      <div key={step} className="flex flex-1 items-center">
                        <span
                          className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                            completed
                              ? "bg-emerald-500 text-white"
                              : active
                                ? "bg-sky-500 text-white"
                                : "bg-slate-200 text-slate-500"
                          }`}
                        >
                          {index + 1}
                        </span>
                        {index < transferStepOrder.length - 1 && (
                          <span
                            className={`mx-2 h-1 flex-1 rounded-full ${
                              status === "success" || index < activeStepIndex
                                ? "bg-emerald-400"
                                : index === activeStepIndex
                                  ? "bg-sky-300"
                                  : "bg-slate-200"
                            }`}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                  {transferStepOrder.map((step, index) => {
                    const completed = status === "success" || index < activeStepIndex;
                    const active = status !== "success" && index === activeStepIndex;
                    return (
                      <div key={`${step}-meta`} className="rounded-xl border border-slate-200 bg-slate-50 px-1.5 py-2">
                        <p
                          className={`text-[11px] font-semibold ${
                            completed
                              ? "text-emerald-700"
                              : active
                                ? "text-sky-700"
                                : "text-slate-500"
                          }`}
                        >
                          {transferStepMeta[step].label}
                        </p>
                        <p className="mt-1 text-[10px] leading-tight text-slate-500">
                          {transferStepMeta[step].caption}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>

            {status === "success" && (
              <section className="rounded-3xl border border-emerald-200 bg-white p-4 shadow-[0_16px_34px_-26px_rgba(16,185,129,0.55)]">
                <p className="text-sm font-semibold text-emerald-700">출금 전송이 완료되었습니다.</p>
                {txExplorerUrl && (
                  <a
                    href={txExplorerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 block break-all rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-2 font-mono text-xs text-emerald-700 underline decoration-emerald-400/80 underline-offset-2"
                  >
                    {txHash}
                  </a>
                )}
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <Link
                    href={`/${params.lang}/promotion/withdraw`}
                    className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-300 bg-slate-50 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                  >
                    새 출금
                  </Link>
                  <Link
                    href={`/${params.lang}/promotion`}
                    className="inline-flex h-10 items-center justify-center rounded-xl bg-[linear-gradient(135deg,#0f766e,#0369a1)] text-sm font-bold text-white transition hover:opacity-95"
                  >
                    홈으로
                  </Link>
                </div>
              </section>
            )}

            {status === "error" && (
              <section className="rounded-3xl border border-rose-200 bg-white p-4 shadow-[0_16px_34px_-26px_rgba(244,63,94,0.5)]">
                <p className="text-sm font-semibold text-rose-700">전송 처리 실패</p>
                <p className="mt-1 text-xs text-rose-600">
                  {errorMessage || "처리 중 문제가 발생했습니다. 잠시 후 다시 시도하세요."}
                </p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setStatus("idle");
                      setCurrentStep("signature");
                      setStepNote("지갑 서명창이 뜨면 승인해 주세요.");
                      setErrorMessage("");
                    }}
                    className="h-10 rounded-xl border border-rose-300 bg-rose-50 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
                  >
                    다시 시도
                  </button>
                  <Link
                    href={`/${params.lang}/promotion/withdraw`}
                    className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-300 bg-slate-50 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                  >
                    입력 화면
                  </Link>
                </div>
              </section>
            )}

            {!transferInputValid && status === "idle" && (
              <section className="rounded-3xl border border-amber-200 bg-white p-4 shadow-[0_16px_34px_-26px_rgba(245,158,11,0.55)]">
                <p className="text-sm font-semibold text-amber-700">입력값 확인 필요</p>
                <p className="mt-1 text-xs text-amber-700/90">
                  전송할 지갑주소 또는 수량이 누락되었습니다. 출금 화면에서 다시 입력해 주세요.
                </p>
              </section>
            )}
          </>
        )}
      </div>
    </main>
  );
}
