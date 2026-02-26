"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ConnectButton, useActiveAccount } from "thirdweb/react";
import { arbitrum, bsc, ethereum, polygon } from "thirdweb/chains";
import { inAppWallet } from "thirdweb/wallets";
import { getUserEmail, getUserPhoneNumber } from "thirdweb/wallets/in-app";
import { getContract, sendTransaction, waitForReceipt } from "thirdweb";
import { transfer, balanceOf } from "thirdweb/extensions/erc20";

import { client } from "@/app/client";
import {
  chain as configuredChain,
  ethereumContractAddressUSDT,
  polygonContractAddressUSDT,
  arbitrumContractAddressUSDT,
  bscContractAddressUSDT,
} from "@/app/config/contractAddresses";

const STORECODE = "admin";
const DEFAULT_AVATAR = "/profile-default.png";

const promotionWallets = [
  inAppWallet({
    auth: {
      options: ["phone", "email", "google"],
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

type UserProfile = {
  id?: string | number;
  nickname?: string;
  avatar?: string;
  walletAddress?: string;
  mobile?: string;
  email?: string;
  escrowWalletAddress?: string;
  createdAt?: string;
  updatedAt?: string;
};

function sanitizeNickname(value: string): string {
  return value.trim();
}

function isValidNickname(value: string): boolean {
  return /^[A-Za-z0-9._\-가-힣]{2,20}$/.test(value);
}

function isValidAvatarUrl(value: string): boolean {
  const normalized = value.trim();
  if (!normalized) {
    return true;
  }

  if (normalized.startsWith("/")) {
    return true;
  }

  try {
    const url = new URL(normalized);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
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

export default function PromotionUserRegisterPage({ params }: { params: { lang: string } }) {
  const activeAccount = useActiveAccount();
  const walletAddress = activeAccount?.address || "";

  const contract = useMemo(
    () =>
      getContract({
        client,
        chain: promotionChain,
        address: usdtContractAddress,
      }),
    [],
  );

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [nicknameInput, setNicknameInput] = useState("");
  const [avatarInput, setAvatarInput] = useState(DEFAULT_AVATAR);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [saving, setSaving] = useState(false);
  const [touched, setTouched] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [connectedMobile, setConnectedMobile] = useState("");
  const [connectedEmail, setConnectedEmail] = useState("");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarUploadMessage, setAvatarUploadMessage] = useState<string | null>(null);
  const [escrowWalletAddress, setEscrowWalletAddress] = useState("");
  const [escrowBalance, setEscrowBalance] = useState<number | null>(null);
  const [escrowBalanceLoading, setEscrowBalanceLoading] = useState(false);
  const [creatingEscrowWallet, setCreatingEscrowWallet] = useState(false);
  const [depositAmountInput, setDepositAmountInput] = useState("");
  const [depositingEscrow, setDepositingEscrow] = useState(false);
  const [withdrawingEscrow, setWithdrawingEscrow] = useState(false);
  const [escrowActionMessage, setEscrowActionMessage] = useState<string | null>(null);

  const nickname = useMemo(() => sanitizeNickname(nicknameInput), [nicknameInput]);
  const avatar = useMemo(() => avatarInput.trim() || DEFAULT_AVATAR, [avatarInput]);
  const nicknameValid = useMemo(() => isValidNickname(nickname), [nickname]);
  const avatarValid = useMemo(() => isValidAvatarUrl(avatarInput), [avatarInput]);
  const canSave = !!walletAddress && nicknameValid && avatarValid && !saving && !uploadingAvatar;
  const parsedDepositAmount = Number(depositAmountInput);
  const depositAmountValid = Number.isFinite(parsedDepositAmount) && parsedDepositAmount > 0;

  const fetchProfile = useCallback(async () => {
    if (!walletAddress) {
      setProfile(null);
      setNicknameInput("");
      setAvatarInput(DEFAULT_AVATAR);
      setEscrowWalletAddress("");
      setEscrowBalance(null);
      setLoadingProfile(false);
      return;
    }

    setLoadingProfile(true);
    try {
      const response = await fetch("/api/user/getUser", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          storecode: STORECODE,
          walletAddress,
        }),
      });

      if (!response.ok) {
        throw new Error(`사용자 조회 실패 (${response.status})`);
      }

      const data = (await response.json()) as {
        result?: UserProfile | null;
      };

      const nextProfile = data.result || null;
      setProfile(nextProfile);
      setNicknameInput(nextProfile?.nickname || "");
      setAvatarInput(nextProfile?.avatar || DEFAULT_AVATAR);
      setEscrowWalletAddress(String(nextProfile?.escrowWalletAddress || "").trim());
      setErrorMessage(null);
    } catch (error) {
      setProfile(null);
      setNicknameInput("");
      setAvatarInput(DEFAULT_AVATAR);
      setEscrowWalletAddress("");
      setEscrowBalance(null);
      setErrorMessage(error instanceof Error ? error.message : "사용자 정보를 불러오지 못했습니다.");
    } finally {
      setLoadingProfile(false);
    }
  }, [walletAddress]);

  useEffect(() => {
    void fetchProfile();
  }, [fetchProfile]);

  useEffect(() => {
    if (!walletAddress) {
      setConnectedMobile("");
      setConnectedEmail("");
      return;
    }

    getUserPhoneNumber({ client })
      .then((mobile) => {
        setConnectedMobile(String(mobile || "").trim());
      })
      .catch(() => {
        setConnectedMobile("");
      });

    getUserEmail({ client })
      .then((email) => {
        setConnectedEmail(String(email || "").trim());
      })
      .catch(() => {
        setConnectedEmail("");
      });
  }, [walletAddress]);

  const uploadAvatarFile = useCallback(async (file: File) => {
    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setAvatarUploadMessage("이미지 파일만 업로드할 수 있습니다.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setAvatarUploadMessage("이미지 용량은 10MB 이하여야 합니다.");
      return;
    }

    setUploadingAvatar(true);
    setAvatarUploadMessage(null);

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        headers: {
          "content-type": file.type || "application/octet-stream",
        },
        body: file,
      });

      if (!response.ok) {
        throw new Error(`아바타 업로드 실패 (${response.status})`);
      }

      const data = (await response.json()) as {
        url?: string;
      };

      if (!data.url) {
        throw new Error("업로드 URL을 받지 못했습니다.");
      }

      setAvatarInput(data.url);
      setAvatarUploadMessage("아바타 이미지 업로드가 완료되었습니다.");
    } catch (error) {
      setAvatarUploadMessage(
        error instanceof Error ? error.message : "아바타 업로드 중 오류가 발생했습니다.",
      );
    } finally {
      setUploadingAvatar(false);
    }
  }, []);

  const fetchEscrowBalance = useCallback(
    async (nextEscrowWalletAddress?: string) => {
      const targetAddress = String(nextEscrowWalletAddress || escrowWalletAddress || "").trim();
      if (!walletAddress || !targetAddress) {
        setEscrowBalance(null);
        setEscrowBalanceLoading(false);
        return;
      }

      setEscrowBalanceLoading(true);
      try {
        const raw = await balanceOf({
          contract,
          address: targetAddress,
        });

        const normalized = Number(raw) / 10 ** usdtDecimals;
        setEscrowBalance(Number.isFinite(normalized) ? normalized : 0);
      } catch (error) {
        console.error("failed to fetch escrow balance", error);
        setEscrowBalance(0);
      } finally {
        setEscrowBalanceLoading(false);
      }
    },
    [contract, escrowWalletAddress, walletAddress],
  );

  useEffect(() => {
    void fetchEscrowBalance();
  }, [fetchEscrowBalance]);

  useEffect(() => {
    if (!walletAddress || !escrowWalletAddress) {
      return;
    }
    const timer = window.setInterval(() => {
      void fetchEscrowBalance();
    }, 15_000);
    return () => window.clearInterval(timer);
  }, [escrowWalletAddress, fetchEscrowBalance, walletAddress]);

  const createEscrowWallet = useCallback(async () => {
    setEscrowActionMessage(null);

    if (!walletAddress) {
      setEscrowActionMessage("지갑 연결 후 에스크로 지갑을 생성할 수 있습니다.");
      return;
    }

    if (!profile?.id && !profile?.nickname) {
      setEscrowActionMessage("먼저 회원정보를 저장한 후 에스크로 지갑을 생성하세요.");
      return;
    }

    setCreatingEscrowWallet(true);
    try {
      const response = await fetch("/api/order/getEscrowWalletAddress", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          lang: params.lang,
          storecode: STORECODE,
          walletAddress,
          isSmartAccount: true,
        }),
      });

      const data = (await response.json()) as {
        result?: {
          escrowWalletAddress?: string;
          existed?: boolean;
        } | null;
        error?: string;
      };

      if (!response.ok || !data.result?.escrowWalletAddress) {
        throw new Error(data.error || "에스크로 지갑 생성에 실패했습니다.");
      }

      const nextEscrowAddress = String(data.result.escrowWalletAddress).trim();
      setEscrowWalletAddress(nextEscrowAddress);
      setEscrowActionMessage(
        data.result.existed
          ? "기존 에스크로 지갑을 불러왔습니다."
          : "회원 에스크로 지갑이 생성되었습니다.",
      );
      await fetchProfile();
      await fetchEscrowBalance(nextEscrowAddress);
    } catch (error) {
      setEscrowActionMessage(
        error instanceof Error ? error.message : "에스크로 지갑 생성 중 오류가 발생했습니다.",
      );
    } finally {
      setCreatingEscrowWallet(false);
    }
  }, [fetchEscrowBalance, fetchProfile, params.lang, profile?.id, profile?.nickname, walletAddress]);

  const depositToEscrow = useCallback(async () => {
    setEscrowActionMessage(null);

    if (!walletAddress || !activeAccount) {
      setEscrowActionMessage("지갑 연결 후 충전할 수 있습니다.");
      return;
    }

    if (!escrowWalletAddress) {
      setEscrowActionMessage("먼저 에스크로 지갑을 생성하세요.");
      return;
    }

    if (!depositAmountValid) {
      setEscrowActionMessage("충전 수량(USDT)을 올바르게 입력하세요.");
      return;
    }

    setDepositingEscrow(true);
    try {
      const transaction = transfer({
        contract,
        to: escrowWalletAddress,
        amount: parsedDepositAmount,
      });

      const { transactionHash } = await sendTransaction({
        transaction,
        account: activeAccount as any,
      });

      if (!transactionHash) {
        throw new Error("트랜잭션 해시를 확인하지 못했습니다.");
      }

      await waitForReceipt({
        client,
        chain: promotionChain,
        transactionHash,
      });

      setDepositAmountInput("");
      setEscrowActionMessage(`충전이 완료되었습니다. TX: ${transactionHash}`);
      await fetchEscrowBalance();
    } catch (error) {
      setEscrowActionMessage(
        error instanceof Error ? error.message : "에스크로 충전 중 오류가 발생했습니다.",
      );
    } finally {
      setDepositingEscrow(false);
    }
  }, [
    activeAccount,
    contract,
    depositAmountValid,
    escrowWalletAddress,
    fetchEscrowBalance,
    parsedDepositAmount,
    walletAddress,
  ]);

  const withdrawEscrowAll = useCallback(async () => {
    setEscrowActionMessage(null);

    if (!walletAddress) {
      setEscrowActionMessage("지갑 연결 후 회수할 수 있습니다.");
      return;
    }

    if (!escrowWalletAddress) {
      setEscrowActionMessage("먼저 에스크로 지갑을 생성하세요.");
      return;
    }

    setWithdrawingEscrow(true);
    try {
      const response = await fetch("/api/user/withdrawEscrowAllToWallet", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          storecode: STORECODE,
          walletAddress,
        }),
      });

      const data = (await response.json()) as {
        result?: {
          amountUsdt?: string;
          transactionHash?: string | null;
        } | null;
        error?: string;
      };

      if (!response.ok || !data.result) {
        throw new Error(data.error || "에스크로 회수에 실패했습니다.");
      }

      const amountText = String(data.result.amountUsdt || "0");
      if (!data.result.transactionHash) {
        setEscrowActionMessage(`회수할 에스크로 잔고가 없습니다. (잔고 ${amountText} USDT)`);
      } else {
        setEscrowActionMessage(`에스크로 전액 ${amountText} USDT 회수가 완료되었습니다.`);
      }

      await fetchEscrowBalance();
    } catch (error) {
      setEscrowActionMessage(
        error instanceof Error ? error.message : "에스크로 회수 중 오류가 발생했습니다.",
      );
    } finally {
      setWithdrawingEscrow(false);
    }
  }, [escrowWalletAddress, fetchEscrowBalance, walletAddress]);

  const saveProfile = useCallback(async () => {
    setTouched(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!canSave || !walletAddress) {
      return;
    }

    setSaving(true);
    const mobile = connectedMobile.trim();
    const email = connectedEmail.trim();

    try {
      const lookupResponse = await fetch("/api/user/getUser", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          storecode: STORECODE,
          walletAddress,
        }),
      });

      if (!lookupResponse.ok) {
        throw new Error(`회원 조회 실패 (${lookupResponse.status})`);
      }

      const lookupData = (await lookupResponse.json()) as {
        result?: UserProfile | null;
      };

      const existing = lookupData.result || null;

      if (!existing) {
        const createResponse = await fetch("/api/user/setUserVerified", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            lang: params.lang,
            storecode: STORECODE,
            walletAddress,
            nickname,
            mobile,
            email,
          }),
        });

        const createData = (await createResponse.json()) as {
          result?: unknown;
          error?: string;
        };

        if (!createResponse.ok || !createData.result) {
          throw new Error(createData.error || "회원 생성에 실패했습니다. 닉네임 중복 여부를 확인하세요.");
        }
      } else {
        const updateNicknameResponse = await fetch("/api/user/updateUser", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            storecode: STORECODE,
            walletAddress,
            nickname,
            mobile,
            email,
          }),
        });

        const updateNicknameData = (await updateNicknameResponse.json()) as {
          result?: unknown;
        };

        if (!updateNicknameResponse.ok || !updateNicknameData.result) {
          throw new Error("닉네임 저장에 실패했습니다. 이미 사용 중인 닉네임일 수 있습니다.");
        }
      }

      const previousAvatar = String(existing?.avatar || DEFAULT_AVATAR);
      if (!existing || previousAvatar !== avatar) {
        const updateAvatarResponse = await fetch("/api/user/updateAvatar", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            storecode: STORECODE,
            walletAddress,
            avatar,
          }),
        });

        const updateAvatarData = (await updateAvatarResponse.json()) as {
          result?: unknown;
        };

        if (!updateAvatarResponse.ok || !updateAvatarData.result) {
          throw new Error("아바타 저장에 실패했습니다.");
        }
      }

      await fetchProfile();
      setSuccessMessage("회원 정보가 저장되었습니다.");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "회원 정보 저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  }, [avatar, canSave, connectedEmail, connectedMobile, fetchProfile, nickname, params.lang, walletAddress]);

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
              User Register
            </span>
          </div>
          <h1 className="mt-3 text-xl font-bold tracking-tight text-slate-900">회원정보 등록</h1>
          <p className="mt-1 text-xs text-slate-500">
            users 컬렉션에 닉네임과 아바타 이미지를 저장/수정합니다.
          </p>
        </section>

        {!walletAddress ? (
          <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-[0_16px_34px_-26px_rgba(15,23,42,0.6)]">
            <p className="text-sm font-semibold text-slate-900">지갑 연결이 필요합니다</p>
            <p className="mt-1 text-xs text-slate-500">
              휴대폰 로그인으로 지갑을 연결한 뒤 회원정보를 등록할 수 있습니다.
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
                  description: "Promotion user register",
                  url: "https://www.stable.makeup",
                  logoUrl: "https://www.stable.makeup/logo.png",
                }}
              />
            </div>
          </section>
        ) : (
          <>
            <section className="rounded-3xl border border-emerald-200/80 bg-white p-4 shadow-[0_16px_34px_-26px_rgba(5,150,105,0.55)]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-emerald-700">Connected Wallet</p>
              <p className="mt-1 font-mono text-sm text-slate-800" title={walletAddress}>
                {formatWallet(walletAddress)}
              </p>
              <div className="mt-3 flex items-center justify-between text-xs text-slate-600">
                <span>storecode: {STORECODE}</span>
                <span
                  className={`rounded-full px-2 py-1 font-semibold ${
                    profile ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {loadingProfile ? "확인중" : profile ? "등록됨" : "미등록"}
                </span>
              </div>
              <div className="mt-3 grid gap-1 rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs text-slate-600">
                <p>
                  <span className="font-semibold text-slate-700">연결 휴대폰:</span>{" "}
                  {connectedMobile || "-"}
                </p>
                <p>
                  <span className="font-semibold text-slate-700">연결 이메일:</span>{" "}
                  {connectedEmail || "-"}
                </p>
              </div>
            </section>

            <section className="rounded-3xl border border-cyan-200/80 bg-white p-4 shadow-[0_16px_34px_-26px_rgba(2,132,199,0.55)]">
              <h2 className="text-sm font-semibold text-slate-900">회원 에스크로 지갑 (Server Smart Wallet)</h2>
              <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
                <p className="font-semibold text-slate-700">에스크로 지갑 주소</p>
                <p className="mt-1 break-all font-mono text-[11px] text-slate-700">
                  {escrowWalletAddress || "-"}
                </p>
                <p className="mt-3 font-semibold text-slate-700">에스크로 잔고</p>
                <p className="mt-1 text-lg font-bold text-slate-900">
                  {escrowBalanceLoading
                    ? "조회중..."
                    : `${(escrowBalance ?? 0).toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 6,
                      })} USDT`}
                </p>
              </div>

              <div className="mt-3 grid gap-2">
                {!escrowWalletAddress && (
                  <button
                    type="button"
                    onClick={() => void createEscrowWallet()}
                    disabled={creatingEscrowWallet || !walletAddress}
                    className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-[linear-gradient(135deg,#0c4a6e,#0369a1)] text-sm font-bold text-white shadow-[0_16px_28px_-20px_rgba(2,132,199,0.9)] transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {creatingEscrowWallet ? "에스크로 지갑 생성중..." : "회원 에스크로 지갑 생성"}
                  </button>
                )}

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-xs font-semibold text-slate-700">내 지갑 → 에스크로 지갑 충전</p>
                  <div className="mt-2 flex gap-2">
                    <input
                      value={depositAmountInput}
                      onChange={(event) => {
                        const sanitized = event.target.value.replace(/[^\d.]/g, "");
                        const normalized = sanitized.replace(/(\..*)\./g, "$1");
                        setDepositAmountInput(normalized);
                      }}
                      placeholder="충전 수량 (USDT)"
                      inputMode="decimal"
                      className="h-10 min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-cyan-400"
                    />
                    <button
                      type="button"
                      onClick={() => void depositToEscrow()}
                      disabled={
                        depositingEscrow ||
                        creatingEscrowWallet ||
                        withdrawingEscrow ||
                        !escrowWalletAddress ||
                        !depositAmountValid
                      }
                      className="inline-flex h-10 shrink-0 items-center justify-center rounded-lg border border-cyan-600 bg-cyan-600 px-3 text-xs font-semibold text-white transition hover:bg-cyan-500 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {depositingEscrow ? "충전중..." : "충전하기"}
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => void withdrawEscrowAll()}
                  disabled={withdrawingEscrow || creatingEscrowWallet || !escrowWalletAddress}
                  className="inline-flex h-11 w-full items-center justify-center rounded-xl border border-amber-500 bg-amber-500/10 text-sm font-bold text-amber-700 transition hover:bg-amber-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {withdrawingEscrow ? "회수중..." : "에스크로 전액 회수하기"}
                </button>
              </div>

              {escrowActionMessage && (
                <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">
                  {escrowActionMessage}
                </div>
              )}
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-[0_16px_34px_-26px_rgba(15,23,42,0.55)]">
              <h2 className="text-sm font-semibold text-slate-900">회원 정보 입력</h2>
              <div className="mt-3 space-y-3">
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold text-slate-600">닉네임</span>
                  <input
                    value={nicknameInput}
                    onChange={(event) => setNicknameInput(event.target.value)}
                    placeholder="닉네임 (2~20자)"
                    className="h-11 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white"
                  />
                </label>

                <label className="block">
                  <span className="mb-1 block text-xs font-semibold text-slate-600">아바타 이미지 업로드</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (!file) {
                        return;
                      }
                      void uploadAvatarFile(file);
                      event.currentTarget.value = "";
                    }}
                    className="block w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900 file:mr-3 file:rounded-lg file:border-0 file:bg-sky-600 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white hover:file:bg-sky-500"
                  />
                  <p className="mt-1 text-[11px] text-slate-500">
                    JPG/PNG/WebP 이미지 파일을 업로드하면 Vercel Blob URL이 자동으로 적용됩니다.
                  </p>
                  <p className="mt-1 break-all text-[11px] text-slate-500">
                    현재 이미지 URL: {avatarInput || DEFAULT_AVATAR}
                  </p>
                </label>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500">Preview</p>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={avatar}
                    alt="avatar-preview"
                    className="mt-2 h-16 w-16 rounded-full border border-slate-300 object-cover"
                    onError={(event) => {
                      event.currentTarget.src = DEFAULT_AVATAR;
                    }}
                  />
                </div>
              </div>

              {avatarUploadMessage && (
                <div className="mt-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                  {avatarUploadMessage}
                </div>
              )}

              {touched && !nicknameValid && (
                <p className="mt-2 text-xs text-rose-600">
                  닉네임은 2~20자, 영문/숫자/한글/._- 문자만 사용할 수 있습니다.
                </p>
              )}
              {touched && !avatarValid && (
                <p className="mt-2 text-xs text-rose-600">아바타 URL 형식이 올바르지 않습니다.</p>
              )}

              {errorMessage && (
                <div className="mt-3 rounded-xl border border-rose-300 bg-rose-50 px-3 py-2 text-xs text-rose-700">
                  {errorMessage}
                </div>
              )}

              {successMessage && (
                <div className="mt-3 rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
                  {successMessage}
                </div>
              )}

              <button
                type="button"
                onClick={() => void saveProfile()}
                disabled={!canSave}
                className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-xl bg-[linear-gradient(135deg,#0f766e,#0369a1)] text-sm font-bold text-white shadow-[0_16px_28px_-20px_rgba(2,132,199,0.9)] transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {uploadingAvatar ? "이미지 업로드중..." : saving ? "저장중..." : "회원정보 저장"}
              </button>
            </section>

            {profile && (
              <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-[0_16px_34px_-26px_rgba(15,23,42,0.45)]">
                <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500">
                  Saved Profile
                </p>
                <div className="mt-2 space-y-1 text-xs text-slate-600">
                  <p>
                    <span className="font-semibold text-slate-700">ID:</span> {profile.id || "-"}
                  </p>
                  <p>
                    <span className="font-semibold text-slate-700">Nickname:</span> {profile.nickname || "-"}
                  </p>
                  <p>
                    <span className="font-semibold text-slate-700">Updated:</span>{" "}
                    {profile.updatedAt || profile.createdAt || "-"}
                  </p>
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </main>
  );
}
