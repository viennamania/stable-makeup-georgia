"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import { useParams } from "next/navigation";
import { useActiveAccount } from "thirdweb/react";

import { postAdminSignedJson } from "@/lib/client/admin-signed-action";
import { useSuperadminSession } from "@/lib/client/use-superadmin-session";

type WalletCandidate = {
  _id?: string;
  id?: string;
  nickname?: string;
  walletAddress?: string | null;
  signerAddress?: string | null;
  createdAt?: string;
  thirdwebLabel?: string;
  thirdwebSource?: "cache" | "engine" | null;
  isActiveThirdwebWallet?: boolean;
  isSmartAccountMatch?: boolean;
  signerMatches?: boolean;
  assignmentEligible?: boolean;
  isCurrentSettlementWallet?: boolean;
};

type LookupResult = {
  store: {
    storecode: string;
    storeName?: string;
    storeLogo?: string;
    sellerWalletAddress?: string | null;
    privateSellerWalletAddress?: string | null;
    settlementWalletAddress?: string | null;
  };
  walletCandidates: WalletCandidate[];
  totalCandidateCount: number;
  eligibleCandidateCount: number;
};

const LOOKUP_ROUTE = "/api/superadmin/store-payment-wallets/lookup";
const CREATE_ROUTE = "/api/superadmin/store-payment-wallets/create";
const UPDATE_ROUTE = "/api/superadmin/store-payment-wallets/update";

const LOOKUP_SIGNING_PREFIX = "stable-georgia:superadmin:store-payment-wallets:lookup:v1";
const CREATE_SIGNING_PREFIX = "stable-georgia:superadmin:store-payment-wallets:create:v1";
const UPDATE_SIGNING_PREFIX = "stable-georgia:superadmin:store-payment-wallets:update:v1";

const normalizeString = (value: unknown): string => {
  if (typeof value !== "string") {
    return "";
  }
  return value.trim();
};

const formatWallet = (value: unknown) => {
  const text = normalizeString(value);
  if (!text) {
    return "-";
  }
  return text;
};

const formatShortWallet = (value: unknown) => {
  const text = normalizeString(value);
  if (!text) {
    return "-";
  }
  if (text.length <= 18) {
    return text;
  }
  return `${text.slice(0, 8)}...${text.slice(-6)}`;
};

const formatDateTime = (value: unknown) => {
  const text = normalizeString(value);
  if (!text) {
    return "-";
  }
  const date = new Date(text);
  if (Number.isNaN(date.getTime())) {
    return text;
  }
  return date.toLocaleString("ko-KR", { timeZone: "Asia/Seoul" });
};

export default function SuperadminStorePaymentWalletsPage() {
  const params = useParams<{ lang: string }>();
  const activeAccount = useActiveAccount();
  const { isSuperadmin, loading: loadingSession, error: sessionError } = useSuperadminSession(activeAccount);

  const lang = params?.lang || "ko";
  const [storecodeInput, setStorecodeInput] = useState("");
  const [resolvedStorecode, setResolvedStorecode] = useState("");
  const [manualWalletAddress, setManualWalletAddress] = useState("");
  const [lookupResult, setLookupResult] = useState<LookupResult | null>(null);
  const [loadingLookup, setLoadingLookup] = useState(false);
  const [runningAction, setRunningAction] = useState("");
  const [lastActionSummary, setLastActionSummary] = useState("");
  const showControls = Boolean(activeAccount && !loadingSession && isSuperadmin);

  const eligibleCandidates = useMemo(
    () => (lookupResult?.walletCandidates || []).filter((item) => item.assignmentEligible),
    [lookupResult],
  );

  const currentSettlementCandidate = useMemo(
    () => (lookupResult?.walletCandidates || []).find((item) => item.isCurrentSettlementWallet) || null,
    [lookupResult],
  );

  const fetchStoreOverview = async (storecodeRaw?: string) => {
    const storecode = normalizeString(storecodeRaw || storecodeInput).toLowerCase();
    if (!activeAccount) {
      toast.error("지갑 연결이 필요합니다.");
      return;
    }
    if (!storecode) {
      toast.error("storecode를 입력하세요.");
      return;
    }

    setLoadingLookup(true);
    try {
      const response = await postAdminSignedJson({
        account: activeAccount,
        route: LOOKUP_ROUTE,
        signingPrefix: LOOKUP_SIGNING_PREFIX,
        requesterStorecode: "superadmin",
        body: {
          storecode,
        },
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "가맹점 지갑 정보를 조회하지 못했습니다.");
      }

      setResolvedStorecode(storecode);
      setLookupResult(data?.result || null);
      setLastActionSummary("");
      if (!normalizeString(storecodeInput)) {
        setStorecodeInput(storecode);
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "가맹점 지갑 정보를 조회하지 못했습니다.";
      toast.error(message);
    } finally {
      setLoadingLookup(false);
    }
  };

  const runCreateWallet = async () => {
    if (!activeAccount) {
      toast.error("지갑 연결이 필요합니다.");
      return;
    }
    if (!resolvedStorecode) {
      toast.error("먼저 storecode를 조회하세요.");
      return;
    }
    if (!confirm(`${resolvedStorecode} 가맹점의 결제용 smart account를 생성 또는 재배정하시겠습니까?`)) {
      return;
    }

    setRunningAction("create");
    try {
      const response = await postAdminSignedJson({
        account: activeAccount,
        route: CREATE_ROUTE,
        signingPrefix: CREATE_SIGNING_PREFIX,
        requesterStorecode: "superadmin",
        body: {
          storecode: resolvedStorecode,
        },
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "결제용 지갑 생성에 실패했습니다.");
      }

      const nextWalletAddress = normalizeString(data?.result?.settlementWalletAddress);
      setLastActionSummary(
        nextWalletAddress
          ? `최근 작업: ${nextWalletAddress} 로 settlement wallet 반영`
          : "최근 작업: settlement wallet 반영 완료",
      );
      toast.success(data?.result?.created ? "새 결제용 지갑을 생성했습니다." : "기존 server wallet을 결제용 지갑으로 반영했습니다.");
      await fetchStoreOverview(resolvedStorecode);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "결제용 지갑 생성에 실패했습니다.");
    } finally {
      setRunningAction("");
    }
  };

  const runAssignWallet = async (walletAddressRaw?: string) => {
    if (!activeAccount) {
      toast.error("지갑 연결이 필요합니다.");
      return;
    }
    if (!resolvedStorecode) {
      toast.error("먼저 storecode를 조회하세요.");
      return;
    }

    const settlementWalletAddress = normalizeString(walletAddressRaw || manualWalletAddress);
    if (!settlementWalletAddress) {
      toast.error("배정할 smart account 주소를 입력하세요.");
      return;
    }
    if (!confirm(`${resolvedStorecode} settlement wallet을 ${settlementWalletAddress} 로 변경하시겠습니까?`)) {
      return;
    }

    setRunningAction(settlementWalletAddress);
    try {
      const response = await postAdminSignedJson({
        account: activeAccount,
        route: UPDATE_ROUTE,
        signingPrefix: UPDATE_SIGNING_PREFIX,
        requesterStorecode: "superadmin",
        body: {
          storecode: resolvedStorecode,
          settlementWalletAddress,
        },
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "결제용 지갑 변경에 실패했습니다.");
      }

      setManualWalletAddress("");
      setLastActionSummary(`최근 작업: ${settlementWalletAddress} 로 settlement wallet 변경`);
      toast.success("결제용 지갑주소를 변경했습니다.");
      await fetchStoreOverview(resolvedStorecode);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "결제용 지갑 변경에 실패했습니다.");
    } finally {
      setRunningAction("");
    }
  };

  return (
    <main className="flex flex-col gap-5">
      <section className="overflow-hidden rounded-[30px] border border-white/10 bg-[linear-gradient(135deg,rgba(9,16,31,0.96),rgba(6,9,17,0.98))] shadow-[0_42px_130px_-72px_rgba(34,211,238,0.35)]">
        <div className="grid gap-5 px-5 py-6 sm:px-7 lg:grid-cols-[minmax(0,1.45fr)_360px]">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.32em] text-cyan-300/90">
              Module 01 / Payment Wallets
            </div>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-[36px]">
              가맹점 결제용 지갑주소 생성·변경
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300/82">
              settlement wallet을 thirdweb server wallet smart account 기준으로 생성하거나,
              같은 가맹점에 귀속된 검증된 후보 주소로 다시 배정하는 superadmin 전용 운영 화면입니다.
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1.5 text-xs font-semibold text-cyan-200">
                Signed Superadmin API
              </span>
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-slate-200">
                Smart Account Validation
              </span>
              <span className="rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1.5 text-xs font-semibold text-amber-100">
                Webhook Auto Sync
              </span>
            </div>
          </div>

          <div className="rounded-[26px] border border-white/10 bg-white/[0.04] p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-[11px] uppercase tracking-[0.24em] text-slate-500">
                  Control Status
                </div>
                <div className="mt-2 text-lg font-semibold text-white">
                  {loadingSession ? "권한 확인중" : isSuperadmin ? "Ready" : "Locked"}
                </div>
              </div>
              <Link
                href={`/${lang}/superadmin`}
                className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:bg-white/[0.08]"
              >
                Deck 으로
              </Link>
            </div>

            <div className="mt-4 space-y-3 text-sm text-slate-300/82">
              <div>
                <div className="text-[11px] uppercase tracking-[0.22em] text-slate-500">Wallet</div>
                <div className="mt-1 font-semibold text-white">{formatWallet(activeAccount?.address)}</div>
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-[0.22em] text-slate-500">Scope</div>
                <div className="mt-1 font-semibold text-white">superadmin</div>
              </div>
              {lastActionSummary ? (
                <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
                  {lastActionSummary}
                </div>
              ) : null}
              {sessionError ? (
                <div className="rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
                  {sessionError}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      {!activeAccount ? (
        <section className="rounded-[26px] border border-amber-400/20 bg-amber-500/10 px-5 py-5 text-sm text-amber-100">
          지갑을 먼저 연결해야 superadmin 기능을 사용할 수 있습니다.
        </section>
      ) : null}

      {activeAccount && loadingSession ? (
        <section className="rounded-[26px] border border-cyan-400/20 bg-cyan-500/10 px-5 py-5 text-sm text-cyan-100">
          현재 지갑의 superadmin 권한을 확인하고 있습니다.
        </section>
      ) : null}

      {activeAccount && !loadingSession && !isSuperadmin ? (
        <section className="rounded-[26px] border border-rose-400/20 bg-rose-500/10 px-5 py-5 text-sm text-rose-100">
          현재 지갑은 superadmin 권한이 없어서 settlement wallet 생성·변경 기능을 사용할 수 없습니다.
        </section>
      ) : null}

      {showControls ? (
        <>
          <section className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500">
                  Store Lookup
                </div>
                <h3 className="mt-2 text-xl font-semibold text-white">가맹점 단위 조회</h3>
                <p className="mt-2 text-sm text-slate-400">
                  storecode 기준으로 현재 settlement wallet, 검증된 server wallet 후보, smart account 상태를 함께 확인합니다.
                </p>
              </div>

              <div className="flex w-full flex-col gap-3 md:flex-row lg:max-w-[720px]">
                <input
                  value={storecodeInput}
                  onChange={(event) => setStorecodeInput(event.target.value)}
                  placeholder="storecode 입력"
                  className="h-12 w-full rounded-2xl border border-white/10 bg-[#0d1322] px-4 text-sm text-white outline-none transition focus:border-cyan-400/50 focus:ring-4 focus:ring-cyan-500/10"
                />
                <button
                  type="button"
                  onClick={() => void fetchStoreOverview()}
                  disabled={loadingLookup}
                  className="h-12 rounded-2xl bg-cyan-300 px-5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
                >
                  {loadingLookup ? "조회중..." : "가맹점 불러오기"}
                </button>
              </div>
            </div>
          </section>

          {lookupResult ? (
            <>
          <section className="grid gap-4 xl:grid-cols-4">
            <div className="rounded-[26px] border border-white/10 bg-white/[0.04] p-5">
              <div className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Store</div>
              <div className="mt-3 text-2xl font-semibold text-white">{lookupResult.store.storeName || "-"}</div>
              <div className="mt-2 text-sm text-slate-400">{lookupResult.store.storecode}</div>
            </div>
            <div className="rounded-[26px] border border-white/10 bg-white/[0.04] p-5">
              <div className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Current Settlement</div>
              <div className="mt-3 break-all text-sm font-semibold text-white">
                {formatWallet(lookupResult.store.settlementWalletAddress)}
              </div>
            </div>
            <div className="rounded-[26px] border border-white/10 bg-white/[0.04] p-5">
              <div className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Candidates</div>
              <div className="mt-3 text-2xl font-semibold text-white">
                {lookupResult.totalCandidateCount.toLocaleString("ko-KR")}
              </div>
              <div className="mt-2 text-sm text-slate-400">verified + signerAddress 보유 사용자 기준</div>
            </div>
            <div className="rounded-[26px] border border-white/10 bg-white/[0.04] p-5">
              <div className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Assignable</div>
              <div className="mt-3 text-2xl font-semibold text-cyan-200">
                {lookupResult.eligibleCandidateCount.toLocaleString("ko-KR")}
              </div>
              <div className="mt-2 text-sm text-slate-400">active thirdweb smart account only</div>
            </div>
          </section>

          <section className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_420px]">
            <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="text-[11px] uppercase tracking-[0.26em] text-slate-500">Current Binding</div>
                  <h3 className="mt-2 text-xl font-semibold text-white">현재 결제용 지갑 상태</h3>
                </div>

                <button
                  type="button"
                  onClick={() => void runCreateWallet()}
                  disabled={!isSuperadmin || runningAction !== ""}
                  className="rounded-full bg-amber-300 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-amber-200 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
                >
                  {runningAction === "create" ? "생성중..." : "신규 server wallet 생성"}
                </button>
              </div>

              <div className="mt-5 rounded-[24px] border border-white/10 bg-[#0d1322] p-5">
                <div className="text-[11px] uppercase tracking-[0.22em] text-slate-500">Settlement Wallet</div>
                <div className="mt-3 break-all text-base font-semibold text-white">
                  {formatWallet(lookupResult.store.settlementWalletAddress)}
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <div className="text-[11px] uppercase tracking-[0.22em] text-slate-500">Seller Wallet</div>
                    <div className="mt-2 break-all text-sm text-slate-200">
                      {formatWallet(lookupResult.store.sellerWalletAddress)}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <div className="text-[11px] uppercase tracking-[0.22em] text-slate-500">Private Seller Wallet</div>
                    <div className="mt-2 break-all text-sm text-slate-200">
                      {formatWallet(lookupResult.store.privateSellerWalletAddress)}
                    </div>
                  </div>
                </div>

                {currentSettlementCandidate ? (
                  <div className="mt-4 rounded-2xl border border-cyan-400/20 bg-cyan-500/10 p-4 text-sm text-cyan-100">
                    현재 settlement wallet은 후보 목록과 매칭됩니다.
                    <div className="mt-2 font-semibold">{currentSettlementCandidate.nickname || formatShortWallet(currentSettlementCandidate.walletAddress)}</div>
                  </div>
                ) : (
                  <div className="mt-4 rounded-2xl border border-amber-400/20 bg-amber-500/10 p-4 text-sm text-amber-100">
                    현재 settlement wallet이 후보 server wallet 목록과 매칭되지 않습니다. 검증된 후보를 선택하거나 새 지갑을 생성하세요.
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5">
              <div className="text-[11px] uppercase tracking-[0.26em] text-slate-500">Manual Rebind</div>
              <h3 className="mt-2 text-xl font-semibold text-white">수동 주소 변경</h3>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                같은 storecode에 등록된 verified server wallet user의 smart account 주소만 통과합니다.
              </p>

              <div className="mt-5 space-y-3">
                <input
                  value={manualWalletAddress}
                  onChange={(event) => setManualWalletAddress(event.target.value)}
                  placeholder="0x... smart account 주소 입력"
                  className="h-12 w-full rounded-2xl border border-white/10 bg-[#0d1322] px-4 text-sm text-white outline-none transition focus:border-cyan-400/50 focus:ring-4 focus:ring-cyan-500/10"
                />
                <button
                  type="button"
                  onClick={() => void runAssignWallet()}
                  disabled={!isSuperadmin || runningAction !== ""}
                  className="h-12 w-full rounded-2xl bg-white text-sm font-semibold text-slate-950 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
                >
                  {runningAction === manualWalletAddress ? "변경중..." : "이 주소로 변경"}
                </button>
              </div>

              <div className="mt-5 rounded-[24px] border border-white/10 bg-[#0d1322] p-4">
                <div className="text-[11px] uppercase tracking-[0.22em] text-slate-500">Fast Select</div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {eligibleCandidates.length === 0 ? (
                    <div className="text-sm text-slate-500">즉시 배정 가능한 후보가 없습니다.</div>
                  ) : (
                    eligibleCandidates.map((item) => (
                      <button
                        key={String(item.walletAddress || item._id)}
                        type="button"
                        onClick={() => setManualWalletAddress(normalizeString(item.walletAddress))}
                        className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:border-cyan-300/40 hover:bg-cyan-400/10"
                      >
                        {item.nickname || formatShortWallet(item.walletAddress)}
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-[11px] uppercase tracking-[0.26em] text-slate-500">Server Wallet Candidates</div>
                <h3 className="mt-2 text-xl font-semibold text-white">검증된 후보 smart account</h3>
              </div>
              <div className="text-xs text-slate-400">
                current {currentSettlementCandidate ? "matched" : "unmatched"}
              </div>
            </div>

            <div className="mt-5 grid gap-4 xl:grid-cols-2">
              {lookupResult.walletCandidates.length === 0 ? (
                <div className="rounded-[24px] border border-dashed border-white/10 bg-[#0d1322] p-5 text-sm text-slate-500">
                  이 가맹점에는 signerAddress가 있는 verified server wallet 사용자가 아직 없습니다.
                </div>
              ) : (
                lookupResult.walletCandidates.map((item) => (
                  <article
                    key={String(item.walletAddress || item._id)}
                    className={`rounded-[24px] border p-5 ${
                      item.isCurrentSettlementWallet
                        ? "border-cyan-300/40 bg-cyan-500/10"
                        : "border-white/10 bg-[#0d1322]"
                    }`}
                  >
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <div className="text-lg font-semibold text-white">
                          {item.nickname || formatShortWallet(item.walletAddress)}
                        </div>
                        <div className="mt-2 break-all font-mono text-xs text-slate-300">
                          {formatWallet(item.walletAddress)}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {item.isCurrentSettlementWallet ? (
                          <span className="rounded-full border border-cyan-300/30 bg-cyan-400/10 px-3 py-1 text-[11px] font-semibold text-cyan-200">
                            current
                          </span>
                        ) : null}
                        {item.assignmentEligible ? (
                          <span className="rounded-full border border-emerald-300/30 bg-emerald-400/10 px-3 py-1 text-[11px] font-semibold text-emerald-200">
                            assignable
                          </span>
                        ) : (
                          <span className="rounded-full border border-rose-300/30 bg-rose-400/10 px-3 py-1 text-[11px] font-semibold text-rose-200">
                            blocked
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                        <div className="text-[11px] uppercase tracking-[0.22em] text-slate-500">Signer</div>
                        <div className="mt-2 break-all text-sm text-slate-200">{formatWallet(item.signerAddress)}</div>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                        <div className="text-[11px] uppercase tracking-[0.22em] text-slate-500">Thirdweb Label</div>
                        <div className="mt-2 break-all text-sm text-slate-200">{item.thirdwebLabel || "-"}</div>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <span className={`rounded-full border px-3 py-1 text-[11px] font-semibold ${
                        item.isActiveThirdwebWallet
                          ? "border-emerald-300/30 bg-emerald-400/10 text-emerald-200"
                          : "border-rose-300/30 bg-rose-400/10 text-rose-200"
                      }`}>
                        {item.isActiveThirdwebWallet ? "thirdweb active" : "not active"}
                      </span>
                      <span className={`rounded-full border px-3 py-1 text-[11px] font-semibold ${
                        item.isSmartAccountMatch
                          ? "border-cyan-300/30 bg-cyan-400/10 text-cyan-200"
                          : "border-rose-300/30 bg-rose-400/10 text-rose-200"
                      }`}>
                        {item.isSmartAccountMatch ? "smart account" : "not smart account"}
                      </span>
                      <span className={`rounded-full border px-3 py-1 text-[11px] font-semibold ${
                        item.signerMatches
                          ? "border-amber-300/30 bg-amber-400/10 text-amber-100"
                          : "border-rose-300/30 bg-rose-400/10 text-rose-200"
                      }`}>
                        {item.signerMatches ? "signer matched" : "signer mismatch"}
                      </span>
                      <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-semibold text-slate-300">
                        {item.thirdwebSource || "-"}
                      </span>
                    </div>

                    <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                      <div className="text-xs text-slate-500">
                        created {formatDateTime(item.createdAt)}
                      </div>
                      <button
                        type="button"
                        onClick={() => void runAssignWallet(item.walletAddress || "")}
                        disabled={!item.assignmentEligible || runningAction !== ""}
                        className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
                      >
                        {runningAction === item.walletAddress ? "변경중..." : "이 지갑으로 배정"}
                      </button>
                    </div>
                  </article>
                ))
              )}
            </div>
          </section>
            </>
          ) : (
            <section className="rounded-[28px] border border-dashed border-white/10 bg-[#0d1322] p-6 text-sm text-slate-400">
              조회할 가맹점의 `storecode`를 입력하면 settlement wallet 상태와 재배정 가능한 smart account 후보가 표시됩니다.
            </section>
          )}
        </>
      ) : null}
    </main>
  );
}
