"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { useActiveAccount } from "thirdweb/react";

import { postAdminMemberPrivateKeyWalletCollectSigned } from "@/lib/client/collect-admin-member-privatekey-wallet-balances-signed";
import { postAdminMemberPrivateKeyWalletBalancesSigned } from "@/lib/client/get-admin-member-privatekey-wallet-balances-signed";

type SnapshotItem = {
  member?: {
    id?: string | number | null;
    nickname?: string | null;
    name?: string | null;
    mobile?: string | null;
    role?: string | null;
    userType?: string | null;
    storecode?: string | null;
  } | null;
  store?: {
    storecode?: string | null;
    storeName?: string | null;
  } | null;
  walletAddress?: string | null;
  usdtBalance?: number | null;
};

type SnapshotCounts = {
  matchedConditionUserCount?: number;
  candidateWalletCount?: number;
  scannedWalletCount?: number;
  skippedByScanLimitCount?: number;
  scanLimitApplied?: boolean;
  scanLimit?: number;
  scanConcurrency?: number;
  positiveBalanceCount?: number;
};

type SnapshotResult = {
  fromCache?: boolean;
  fetchedAt?: string | null;
  cooldownUntil?: string | null;
  remainingSeconds?: number;
  counts?: SnapshotCounts | null;
  items?: SnapshotItem[];
};

const formatDateTimeKst = (value: unknown) => {
  if (!value) {
    return "-";
  }
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) {
    return "-";
  }
  return date.toLocaleString("ko-KR", { timeZone: "Asia/Seoul" });
};

const formatRemaining = (seconds: number) => {
  const safe = Math.max(0, seconds);
  const min = Math.floor(safe / 60);
  const sec = safe % 60;
  return `${min}분 ${String(sec).padStart(2, "0")}초`;
};

const normalizeText = (value: unknown) => {
  const text = String(value || "").trim();
  return text || "-";
};

export default function AdminMemberPrivateKeyWalletBalancePage({
  params,
}: {
  params: { lang: string };
}) {
  const router = useRouter();
  const activeAccount = useActiveAccount();
  const walletAddress = activeAccount?.address || "";

  const [loading, setLoading] = useState(false);
  const [collectingAll, setCollectingAll] = useState(false);
  const [snapshot, setSnapshot] = useState<SnapshotResult | null>(null);
  const [nowMs, setNowMs] = useState<number>(Date.now());

  const fetchSnapshot = async () => {
    if (!activeAccount || loading) {
      return;
    }
    setLoading(true);
    try {
      const response = await postAdminMemberPrivateKeyWalletBalancesSigned({
        account: activeAccount,
        requesterStorecode: "admin",
        requesterWalletAddress: walletAddress,
      });

      if (response?.error) {
        throw new Error(String(response.error));
      }

      setSnapshot((response?.result || null) as SnapshotResult | null);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "프라이빗키 지갑 잔고 목록을 불러오지 못했습니다.",
      );
    } finally {
      setLoading(false);
    }
  };

  const collectAllBalances = async () => {
    if (!activeAccount || collectingAll || loading) {
      return;
    }

    const confirmed = window.confirm(
      "USDT 0.1 이상 잔고를 각 가맹점 sellerWalletAddress로 전체 회수합니다. 계속하시겠습니까?",
    );
    if (!confirmed) {
      return;
    }

    setCollectingAll(true);
    try {
      const response = await postAdminMemberPrivateKeyWalletCollectSigned({
        account: activeAccount,
        requesterStorecode: "admin",
        requesterWalletAddress: walletAddress,
      });

      if (response?.error) {
        throw new Error(String(response.error));
      }

      const transferredCount = Number(response?.result?.counts?.transferredCount || 0);
      const skippedCount = Number(response?.result?.counts?.skippedCount || 0);
      const totalTransferredUsdt = Number(response?.result?.totalTransferredUsdt || 0);
      const remainingTransferTargetCount = Number(
        response?.result?.counts?.remainingTransferTargetCount || 0,
      );

      if (transferredCount > 0) {
        toast.success(
          remainingTransferTargetCount > 0
            ? `회수 완료: ${transferredCount.toLocaleString("ko-KR")}건 / ${totalTransferredUsdt.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 6 })} USDT (남은 대상 ${remainingTransferTargetCount.toLocaleString("ko-KR")}건, 다시 실행 필요)`
            : `회수 완료: ${transferredCount.toLocaleString("ko-KR")}건 / ${totalTransferredUsdt.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 6 })} USDT`,
        );
      } else {
        toast.success(
          remainingTransferTargetCount > 0
            ? `이번 호출 처리 없음 (스킵 ${skippedCount.toLocaleString("ko-KR")}건, 남은 대상 ${remainingTransferTargetCount.toLocaleString("ko-KR")}건)`
            : `회수 대상 없음 (스킵 ${skippedCount.toLocaleString("ko-KR")}건)`,
        );
      }

      await fetchSnapshot();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "전체 회수 처리에 실패했습니다.",
      );
    } finally {
      setCollectingAll(false);
    }
  };

  useEffect(() => {
    if (!walletAddress) {
      return;
    }
    fetchSnapshot();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [walletAddress]);

  useEffect(() => {
    const timer = setInterval(() => {
      setNowMs(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const cooldownRemainingSeconds = useMemo(() => {
    const cooldownUntilText = snapshot?.cooldownUntil;
    if (!cooldownUntilText) {
      return 0;
    }
    const cooldownUntil = new Date(cooldownUntilText);
    if (Number.isNaN(cooldownUntil.getTime())) {
      return 0;
    }
    return Math.max(0, Math.ceil((cooldownUntil.getTime() - nowMs) / 1000));
  }, [snapshot?.cooldownUntil, nowMs]);

  const canReadFresh = cooldownRemainingSeconds <= 0;
  const items = Array.isArray(snapshot?.items) ? snapshot?.items : [];
  const emptyMessage = loading
    ? "지갑 잔고를 조회 중입니다..."
    : !snapshot
      ? "아직 조회 결과가 없습니다. 상단 버튼으로 조회를 시작해 주세요."
      : "조회된 잔고 목록이 없습니다.";
  const totalPositiveBalance = items.reduce((acc, item) => {
    const value = Number(item?.usdtBalance || 0);
    if (!Number.isFinite(value)) {
      return acc;
    }
    return acc + value;
  }, 0);

  return (
    <main className="w-full px-3 sm:px-4 md:px-6 lg:px-10 pb-10">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 bg-gradient-to-r from-zinc-900 via-slate-800 to-zinc-900 text-white rounded-2xl p-4 shadow-lg shadow-zinc-900/40">
          <div className="flex flex-col gap-1">
            <div className="text-xs uppercase tracking-[0.14em] text-cyan-200">
              Admin Member
            </div>
            <div className="text-xl font-bold">
              프라이빗키 보유 지갑 잔고 점검
            </div>
            <div className="text-xs text-slate-300">
              조건: walletPrivateKey exists, walletAddress exists, buyOrderStatus=paymentConfirmed, USDT 0.1 이상
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => router.push(`/${params.lang}/admin/member`)}
              className="px-3 py-2 rounded-lg text-sm font-semibold bg-white/10 hover:bg-white/20 border border-white/20"
            >
              회원관리로 돌아가기
            </button>
            <button
              type="button"
              onClick={fetchSnapshot}
              disabled={!walletAddress || loading || collectingAll || !canReadFresh}
              className="px-4 py-2 rounded-lg text-sm font-semibold bg-cyan-500 text-zinc-900 hover:bg-cyan-400 disabled:opacity-50"
            >
              {loading ? "조회중..." : "지갑 잔고 읽어오기"}
            </button>
            <button
              type="button"
              onClick={collectAllBalances}
              disabled={!walletAddress || loading || collectingAll}
              className="px-4 py-2 rounded-lg text-sm font-semibold bg-rose-500 text-white hover:bg-rose-400 disabled:opacity-50"
            >
              {collectingAll ? "회수중..." : "전체 회수하기"}
            </button>
          </div>
        </div>

        {!walletAddress ? (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
            관리자 지갑 연결 후 조회할 수 있습니다.
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg border border-zinc-200 p-4 flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="px-2 py-1 rounded-md bg-zinc-100 text-zinc-700">
                마지막 조회: {formatDateTimeKst(snapshot?.fetchedAt)}
              </span>
              <span className="px-2 py-1 rounded-md bg-zinc-100 text-zinc-700">
                다음 조회 가능: {formatDateTimeKst(snapshot?.cooldownUntil)}
              </span>
              <span
                className={`px-2 py-1 rounded-md ${
                  canReadFresh
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-rose-100 text-rose-800"
                }`}
              >
                {canReadFresh
                  ? "지금 새로 읽기 가능"
                  : `쿨다운 남음: ${formatRemaining(cooldownRemainingSeconds)}`}
              </span>
              <span className="px-2 py-1 rounded-md bg-cyan-50 text-cyan-700">
                0.1+ 잔고 합계: {totalPositiveBalance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 6 })} USDT
              </span>
            </div>

            <div className="flex flex-wrap gap-2 text-xs">
              <span className="px-2 py-1 rounded-full bg-zinc-100 text-zinc-700">
                조건 매칭 회원: {(snapshot?.counts?.matchedConditionUserCount || 0).toLocaleString("ko-KR")}
              </span>
              <span className="px-2 py-1 rounded-full bg-zinc-100 text-zinc-700">
                잔고 후보: {(snapshot?.counts?.candidateWalletCount || snapshot?.counts?.scannedWalletCount || 0).toLocaleString("ko-KR")}
              </span>
              <span className="px-2 py-1 rounded-full bg-zinc-100 text-zinc-700">
                실제 조회 지갑: {(snapshot?.counts?.scannedWalletCount || 0).toLocaleString("ko-KR")}
              </span>
              <span className="px-2 py-1 rounded-full bg-emerald-100 text-emerald-800">
                잔고 0.1 이상: {(snapshot?.counts?.positiveBalanceCount || 0).toLocaleString("ko-KR")}
              </span>
              {snapshot?.counts?.scanLimitApplied && (
                <span className="px-2 py-1 rounded-full bg-amber-100 text-amber-800">
                  성능 상한 적용: {(snapshot?.counts?.scanLimit || 0).toLocaleString("ko-KR")}개 (제외 {(snapshot?.counts?.skippedByScanLimitCount || 0).toLocaleString("ko-KR")}개)
                </span>
              )}
            </div>

            <div className="overflow-x-auto border border-zinc-200 rounded-xl">
              <table className="min-w-[1100px] w-full text-sm">
                <thead className="bg-zinc-100 text-zinc-700">
                  <tr>
                    <th className="px-3 py-2 text-left">회원정보</th>
                    <th className="px-3 py-2 text-left">가맹점정보</th>
                    <th className="px-3 py-2 text-left">지갑주소</th>
                    <th className="px-3 py-2 text-right">USDT 잔고</th>
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-3 py-8 text-center text-zinc-500">
                        {emptyMessage}
                      </td>
                    </tr>
                  )}

                  {items.map((item, index) => (
                    <tr
                      key={`${item?.walletAddress || "wallet"}-${index}`}
                      className="border-t border-zinc-100"
                    >
                      <td className="px-3 py-2 text-xs text-zinc-700">
                        <div>{normalizeText(item?.member?.nickname)}</div>
                        <div>{normalizeText(item?.member?.name)}</div>
                        <div>{normalizeText(item?.member?.mobile)}</div>
                        <div>{normalizeText(item?.member?.role)} / {normalizeText(item?.member?.userType)}</div>
                      </td>
                      <td className="px-3 py-2 text-xs text-zinc-700">
                        <div>{normalizeText(item?.store?.storeName)}</div>
                        <div>{normalizeText(item?.store?.storecode || item?.member?.storecode)}</div>
                      </td>
                      <td className="px-3 py-2 text-xs font-mono text-zinc-700">
                        {normalizeText(item?.walletAddress)}
                      </td>
                      <td className="px-3 py-2 text-right text-sm font-semibold text-emerald-700">
                        {Number(item?.usdtBalance || 0).toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 6,
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
