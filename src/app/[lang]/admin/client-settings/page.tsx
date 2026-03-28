'use client';

import Image from "next/image";
import { useEffect, useState, type ReactNode } from "react";
import { toast } from "react-hot-toast";
import { useActiveAccount } from "thirdweb/react";

import AdminAccessState from "@/components/admin/admin-access-state";
import Uploader from "@/components/uploader-client";
import { postAdminSignedJson } from "@/lib/client/admin-signed-action";
import { postGetUserSelfSigned } from "@/lib/client/get-user-self-signed";
import {
  CLIENT_EXCHANGE_RATE_KEYS,
  clientExchangeRateMapToForm,
  createEmptyClientExchangeRateForm,
  isClientExchangeRateInput,
  parseClientExchangeRateHistoryItem,
  parseClientExchangeRateForm,
  type ClientExchangeRateHistoryItem,
  type ClientExchangeRateHistoryType,
  type ClientExchangeRateForm,
  type ClientExchangeRateKey,
  type ClientExchangeRateMap,
} from "@/lib/client-settings";
import {
  CLIENT_SETTINGS_ADMIN_READ_SIGNING_PREFIX,
  CLIENT_SETTINGS_ADMIN_MUTATION_SIGNING_PREFIX,
  CLIENT_SETTINGS_GET_RATE_HISTORY_ROUTE,
  CLIENT_SETTINGS_UPDATE_BUY_RATE_ROUTE,
  CLIENT_SETTINGS_UPDATE_PAYACTION_ROUTE,
  CLIENT_SETTINGS_UPDATE_PROFILE_ROUTE,
  CLIENT_SETTINGS_UPDATE_SELL_RATE_ROUTE,
} from "@/lib/security/client-settings-admin";

type SettingsPageProps = {
  params: {
    lang: string;
  };
};

type ClientProfileForm = {
  name: string;
  description: string;
};

const CHAIN_META: Record<
  string,
  {
    label: string;
    icon: string;
    accent: string;
    muted: string;
  }
> = {
  ethereum: {
    label: "Ethereum",
    icon: "/logo-chain-ethereum.png",
    accent: "from-slate-900 to-slate-700",
    muted: "bg-slate-100 text-slate-700 border-slate-200",
  },
  polygon: {
    label: "Polygon",
    icon: "/logo-chain-polygon.png",
    accent: "from-fuchsia-600 to-violet-500",
    muted: "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-100",
  },
  bsc: {
    label: "BSC",
    icon: "/logo-chain-bsc.png",
    accent: "from-amber-500 to-yellow-400",
    muted: "bg-amber-50 text-amber-700 border-amber-100",
  },
  arbitrum: {
    label: "Arbitrum",
    icon: "/logo-chain-arbitrum.png",
    accent: "from-sky-600 to-blue-500",
    muted: "bg-sky-50 text-sky-700 border-sky-100",
  },
};

const RATE_FIELD_META: Array<{
  key: ClientExchangeRateKey;
  label: string;
  description: string;
}> = [
  { key: "USD", label: "USD", description: "미국 달러 기준가" },
  { key: "KRW", label: "KRW", description: "원화 정산 기준" },
  { key: "JPY", label: "JPY", description: "일본 엔화 기준" },
  { key: "CNY", label: "CNY", description: "중국 위안 기준" },
  { key: "EUR", label: "EUR", description: "유로화 기준" },
];

const createEmptyProfileForm = (): ClientProfileForm => ({
  name: "",
  description: "",
});

const HISTORY_LIMIT = 10;

const formatWalletAddress = (value: string | undefined) => {
  if (!value) {
    return "연결되지 않음";
  }

  if (value.length <= 12) {
    return value;
  }

  return `${value.slice(0, 6)}...${value.slice(-4)}`;
};

const areRateFormsEqual = (left: ClientExchangeRateForm, right: ClientExchangeRateForm) =>
  CLIENT_EXCHANGE_RATE_KEYS.every((key) => left[key] === right[key]);

const formatDateTime = (value: string | undefined) => {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("ko-KR");
};

const formatRateValue = (value: number) => {
  if (!Number.isFinite(value)) {
    return "-";
  }

  return new Intl.NumberFormat("ko-KR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 6,
  }).format(value);
};

const formatHistoryActor = (item: ClientExchangeRateHistoryItem) => {
  const walletLabel = item.requesterWalletAddress
    ? formatWalletAddress(item.requesterWalletAddress)
    : "관리자";

  if (item.requesterNickname) {
    return `${item.requesterNickname} · ${walletLabel}`;
  }

  return walletLabel;
};

const mergeHistoryEntry = (
  current: ClientExchangeRateHistoryItem[],
  incoming: ClientExchangeRateHistoryItem,
) => {
  return [incoming, ...current.filter((item) => item._id !== incoming._id)].slice(0, HISTORY_LIMIT);
};

const SettingCard = ({
  eyebrow,
  title,
  description,
  children,
  action,
  className = "",
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
  action?: ReactNode;
  className?: string;
}) => {
  return (
    <section
      className={`overflow-hidden rounded-[28px] border border-slate-200 bg-white/90 shadow-[0_20px_70px_-40px_rgba(15,23,42,0.35)] backdrop-blur ${className}`}
    >
      <div className="border-b border-slate-100 px-5 py-5 sm:px-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <span className="inline-flex w-fit items-center rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-600">
              {eyebrow}
            </span>
            <div>
              <h2 className="text-xl font-semibold text-slate-950">{title}</h2>
              <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
            </div>
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>
      </div>
      <div className="px-5 py-5 sm:px-7 sm:py-6">{children}</div>
    </section>
  );
};

const SummaryCard = ({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string;
  hint: string;
  tone: "slate" | "emerald" | "amber";
}) => {
  const toneClass =
    tone === "emerald"
      ? "border-emerald-200 bg-emerald-50 text-emerald-900"
      : tone === "amber"
        ? "border-amber-200 bg-amber-50 text-amber-900"
        : "border-slate-200 bg-white text-slate-900";

  return (
    <div className={`rounded-2xl border p-4 ${toneClass}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.22em] opacity-70">{label}</p>
      <p className="mt-3 text-lg font-semibold">{value}</p>
      <p className="mt-2 text-sm opacity-75">{hint}</p>
    </div>
  );
};

const ExchangeRateHistoryPanel = ({
  tone,
  loaded,
  loading,
  items,
  onLoad,
}: {
  tone: "sky" | "emerald";
  loaded: boolean;
  loading: boolean;
  items: ClientExchangeRateHistoryItem[];
  onLoad: () => void;
}) => {
  const toneClass =
    tone === "sky"
      ? {
          wrapper: "border-sky-100 bg-[linear-gradient(180deg,_rgba(240,249,255,0.9),_rgba(255,255,255,1))]",
          button: "border-sky-200 text-sky-700 hover:bg-sky-50",
          badge: "bg-sky-100 text-sky-700",
          value: "text-sky-900",
        }
      : {
          wrapper: "border-emerald-100 bg-[linear-gradient(180deg,_rgba(236,253,245,0.92),_rgba(255,255,255,1))]",
          button: "border-emerald-200 text-emerald-700 hover:bg-emerald-50",
          badge: "bg-emerald-100 text-emerald-700",
          value: "text-emerald-900",
        };

  return (
    <div className={`mt-6 rounded-[24px] border p-4 sm:p-5 ${toneClass.wrapper}`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-900">최근 변경 이력</p>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            저장 시점의 변경 전/후 환율과 변경 관리자 정보를 기록합니다.
          </p>
        </div>
        <button
          type="button"
          onClick={onLoad}
          disabled={loading}
          className={`inline-flex items-center justify-center rounded-full border px-4 py-2 text-xs font-semibold transition ${toneClass.button} ${loading ? "cursor-not-allowed opacity-60" : ""}`}
        >
          {loading ? "불러오는 중..." : loaded ? "이력 새로고침" : "이력 보기"}
        </button>
      </div>

      {!loaded ? (
        <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-white/80 px-4 py-4 text-sm leading-6 text-slate-500">
          관리자 서명 후 최근 {HISTORY_LIMIT}건의 환율 변경 이력을 조회할 수 있습니다.
        </div>
      ) : null}

      {loaded && items.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-white/80 px-4 py-4 text-sm leading-6 text-slate-500">
          저장된 환율 변경 이력이 없습니다.
        </div>
      ) : null}

      {loaded && items.length > 0 ? (
        <div className="mt-4 space-y-3">
          {items.map((item) => {
            const displayKeys = item.changedKeys.length > 0 ? item.changedKeys : CLIENT_EXCHANGE_RATE_KEYS;

            return (
              <div
                key={item._id || `${item.rateType}-${item.updatedAt}`}
                className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-[0_18px_40px_-30px_rgba(15,23,42,0.35)]"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{formatHistoryActor(item)}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {formatDateTime(item.updatedAt)}
                      {item.requesterRole ? ` · ${item.requesterRole}` : ""}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {displayKeys.map((key) => (
                      <span
                        key={`${item._id}-${key}`}
                        className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${toneClass.badge}`}
                      >
                        {key}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  {displayKeys.map((key) => (
                    <div
                      key={`${item._id}-${key}-row`}
                      className="grid grid-cols-[56px_minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 rounded-2xl border border-slate-100 bg-slate-50 px-3 py-2 text-sm"
                    >
                      <span className="font-semibold text-slate-700">{key}</span>
                      <span className="truncate text-slate-500">{formatRateValue(item.before[key])}</span>
                      <span className="text-slate-400">→</span>
                      <span className={`truncate text-right font-semibold ${toneClass.value}`}>
                        {formatRateValue(item.after[key])}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
};

export default function SettingsPage({ params }: SettingsPageProps) {
  const activeAccount = useActiveAccount();
  const address = activeAccount?.address;

  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loadingUser, setLoadingUser] = useState(true);

  const [chain, setChain] = useState("arbitrum");
  const [clientId, setClientId] = useState("");
  const [payactionViewOn, setPayactionViewOn] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState("");

  const [profileForm, setProfileForm] = useState<ClientProfileForm>(createEmptyProfileForm());
  const [profileSnapshot, setProfileSnapshot] = useState<ClientProfileForm>(createEmptyProfileForm());

  const [buyRatesForm, setBuyRatesForm] = useState<ClientExchangeRateForm>(createEmptyClientExchangeRateForm());
  const [buyRatesSnapshot, setBuyRatesSnapshot] = useState<ClientExchangeRateForm>(createEmptyClientExchangeRateForm());
  const [buyRateHistory, setBuyRateHistory] = useState<ClientExchangeRateHistoryItem[]>([]);
  const [buyRateHistoryLoaded, setBuyRateHistoryLoaded] = useState(false);
  const [buyRateHistoryLoading, setBuyRateHistoryLoading] = useState(false);

  const [sellRatesForm, setSellRatesForm] = useState<ClientExchangeRateForm>(createEmptyClientExchangeRateForm());
  const [sellRatesSnapshot, setSellRatesSnapshot] = useState<ClientExchangeRateForm>(createEmptyClientExchangeRateForm());
  const [sellRateHistory, setSellRateHistory] = useState<ClientExchangeRateHistoryItem[]>([]);
  const [sellRateHistoryLoaded, setSellRateHistoryLoaded] = useState(false);
  const [sellRateHistoryLoading, setSellRateHistoryLoading] = useState(false);

  const [savingProfile, setSavingProfile] = useState(false);
  const [savingBuyRates, setSavingBuyRates] = useState(false);
  const [savingSellRates, setSavingSellRates] = useState(false);
  const [updatingPayactionViewOn, setUpdatingPayactionViewOn] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      if (!address) {
        setUser(null);
        setIsAdmin(false);
        setLoadingUser(false);
        return;
      }

      setLoadingUser(true);

      try {
        const data = await postGetUserSelfSigned({
          account: activeAccount,
          storecode: "admin",
          walletAddress: address,
        });

        if (data.result) {
          setUser(data.result);
          const userStorecode = String(data.result?.storecode || "").trim().toLowerCase();
          const userRole = String(data.result?.role || "").trim().toLowerCase();
          setIsAdmin(userStorecode === "admin" && userRole === "admin");
        } else {
          setUser(null);
          setIsAdmin(false);
        }
      } catch (error) {
        setUser(null);
        setIsAdmin(false);
        console.error("Failed to load admin user", error);
      } finally {
        setLoadingUser(false);
      }
    };

    loadUser();
  }, [address, activeAccount]);

  useEffect(() => {
    const loadClientSettings = async () => {
      if (!address || !isAdmin) {
        return;
      }

      try {
        const response = await fetch("/api/client/getClientInfo", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        });

        const data = await response.json();
        const result = data?.result;
        const clientInfo = result?.clientInfo || {};

        const nextProfile = {
          name: String(clientInfo?.name || ""),
          description: String(clientInfo?.description || ""),
        };
        const nextBuyRates = clientExchangeRateMapToForm(clientInfo?.exchangeRateUSDT);
        const nextSellRates = clientExchangeRateMapToForm(clientInfo?.exchangeRateUSDTSell);

        setChain(String(result?.chain || "arbitrum"));
        setClientId(String(result?.clientId || ""));
        setPayactionViewOn(Boolean(clientInfo?.payactionViewOn));
        setProfileForm(nextProfile);
        setProfileSnapshot(nextProfile);
        setBuyRatesForm(nextBuyRates);
        setBuyRatesSnapshot(nextBuyRates);
        setSellRatesForm(nextSellRates);
        setSellRatesSnapshot(nextSellRates);
        setLastSyncedAt(new Date().toLocaleString("ko-KR"));
      } catch (error) {
        console.error("Failed to load client settings", error);
        toast.error("센터 설정을 불러오지 못했습니다.");
      }
    };

    loadClientSettings();
  }, [address, isAdmin]);

  const profileDirty =
    profileForm.name !== profileSnapshot.name
    || profileForm.description !== profileSnapshot.description;
  const buyRatesDirty = !areRateFormsEqual(buyRatesForm, buyRatesSnapshot);
  const sellRatesDirty = !areRateFormsEqual(sellRatesForm, sellRatesSnapshot);
  const pendingChangeCount = [profileDirty, buyRatesDirty, sellRatesDirty].filter(Boolean).length;

  const chainMeta = CHAIN_META[chain] || CHAIN_META.arbitrum;

  const applyHistoryEntry = (
    rateType: ClientExchangeRateHistoryType,
    historyEntry: ClientExchangeRateHistoryItem | null,
  ) => {
    if (!historyEntry) {
      return;
    }

    if (rateType === "buy") {
      setBuyRateHistoryLoaded(true);
      setBuyRateHistory((current) => mergeHistoryEntry(current, historyEntry));
      return;
    }

    setSellRateHistoryLoaded(true);
    setSellRateHistory((current) => mergeHistoryEntry(current, historyEntry));
  };

  const loadRateHistory = async (rateType: ClientExchangeRateHistoryType) => {
    if (!activeAccount || !address || !isAdmin) {
      return;
    }

    const setLoading = rateType === "buy" ? setBuyRateHistoryLoading : setSellRateHistoryLoading;
    const setLoaded = rateType === "buy" ? setBuyRateHistoryLoaded : setSellRateHistoryLoaded;
    const setHistory = rateType === "buy" ? setBuyRateHistory : setSellRateHistory;

    setLoading(true);

    try {
      const response = await postAdminSignedJson({
        account: activeAccount,
        route: CLIENT_SETTINGS_GET_RATE_HISTORY_ROUTE,
        signingPrefix: CLIENT_SETTINGS_ADMIN_READ_SIGNING_PREFIX,
        requesterWalletAddress: address,
        body: {
          rateType,
          limit: HISTORY_LIMIT,
        },
      });

      const data = await response.json().catch(() => null);

      if (response.ok && Array.isArray(data?.result)) {
        const nextHistory = data.result
          .map(parseClientExchangeRateHistoryItem)
          .filter(
            (item: ClientExchangeRateHistoryItem | null): item is ClientExchangeRateHistoryItem =>
              Boolean(item),
          );

        setHistory(nextHistory);
        setLoaded(true);
      } else {
        toast.error(data?.error || "변경 이력을 불러오지 못했습니다.");
      }
    } catch (error) {
      toast.error("변경 이력을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = async () => {
    if (!activeAccount || !address || !isAdmin || !profileDirty || savingProfile) {
      return;
    }

    setSavingProfile(true);

    try {
      const response = await postAdminSignedJson({
        account: activeAccount,
        route: CLIENT_SETTINGS_UPDATE_PROFILE_ROUTE,
        signingPrefix: CLIENT_SETTINGS_ADMIN_MUTATION_SIGNING_PREFIX,
        requesterWalletAddress: address,
        body: profileForm,
      });

      const data = await response.json().catch(() => null);

      if (response.ok && data?.result) {
        setProfileSnapshot(profileForm);
        setLastSyncedAt(new Date().toLocaleString("ko-KR"));
        toast.success("센터 정보가 저장되었습니다.");
      } else {
        toast.error(data?.error || "센터 정보 저장에 실패했습니다.");
      }
    } catch (error) {
      toast.error("센터 정보 저장에 실패했습니다.");
    } finally {
      setSavingProfile(false);
    }
  };

  const saveBuyRates = async () => {
    if (!activeAccount || !address || !isAdmin || !buyRatesDirty || savingBuyRates) {
      return;
    }

    const nextBuyRates = parseClientExchangeRateForm(buyRatesForm);
    if (!nextBuyRates) {
      toast.error("환율(살때) 값을 다시 확인해주세요.");
      return;
    }

    setSavingBuyRates(true);

    try {
      const response = await postAdminSignedJson({
        account: activeAccount,
        route: CLIENT_SETTINGS_UPDATE_BUY_RATE_ROUTE,
        signingPrefix: CLIENT_SETTINGS_ADMIN_MUTATION_SIGNING_PREFIX,
        requesterWalletAddress: address,
        body: {
          exchangeRateUSDT: nextBuyRates,
        },
      });

      const data = await response.json().catch(() => null);

      if (response.ok && data?.result) {
        const normalizedForm = clientExchangeRateMapToForm(nextBuyRates);
        setBuyRatesForm(normalizedForm);
        setBuyRatesSnapshot(normalizedForm);
        applyHistoryEntry("buy", parseClientExchangeRateHistoryItem(data?.historyEntry));
        setLastSyncedAt(new Date().toLocaleString("ko-KR"));
        toast.success("환율(살때)가 저장되었습니다.");
      } else {
        toast.error(data?.error || "환율(살때) 저장에 실패했습니다.");
      }
    } catch (error) {
      toast.error("환율(살때) 저장에 실패했습니다.");
    } finally {
      setSavingBuyRates(false);
    }
  };

  const saveSellRates = async () => {
    if (!activeAccount || !address || !isAdmin || !sellRatesDirty || savingSellRates) {
      return;
    }

    const nextSellRates = parseClientExchangeRateForm(sellRatesForm);
    if (!nextSellRates) {
      toast.error("환율(팔때) 값을 다시 확인해주세요.");
      return;
    }

    setSavingSellRates(true);

    try {
      const response = await postAdminSignedJson({
        account: activeAccount,
        route: CLIENT_SETTINGS_UPDATE_SELL_RATE_ROUTE,
        signingPrefix: CLIENT_SETTINGS_ADMIN_MUTATION_SIGNING_PREFIX,
        requesterWalletAddress: address,
        body: {
          exchangeRateUSDTSell: nextSellRates,
        },
      });

      const data = await response.json().catch(() => null);

      if (response.ok && data?.result) {
        const normalizedForm = clientExchangeRateMapToForm(nextSellRates);
        setSellRatesForm(normalizedForm);
        setSellRatesSnapshot(normalizedForm);
        applyHistoryEntry("sell", parseClientExchangeRateHistoryItem(data?.historyEntry));
        setLastSyncedAt(new Date().toLocaleString("ko-KR"));
        toast.success("환율(팔때)가 저장되었습니다.");
      } else {
        toast.error(data?.error || "환율(팔때) 저장에 실패했습니다.");
      }
    } catch (error) {
      toast.error("환율(팔때) 저장에 실패했습니다.");
    } finally {
      setSavingSellRates(false);
    }
  };

  const updatePayactionView = async (value: boolean) => {
    if (!activeAccount || !address || !isAdmin || updatingPayactionViewOn) {
      return;
    }

    setUpdatingPayactionViewOn(true);

    try {
      const response = await postAdminSignedJson({
        account: activeAccount,
        route: CLIENT_SETTINGS_UPDATE_PAYACTION_ROUTE,
        signingPrefix: CLIENT_SETTINGS_ADMIN_MUTATION_SIGNING_PREFIX,
        requesterWalletAddress: address,
        body: {
          payactionViewOn: value,
        },
      });

      const data = await response.json().catch(() => null);

      if (response.ok && data?.result) {
        setPayactionViewOn(value);
        setLastSyncedAt(new Date().toLocaleString("ko-KR"));
        toast.success("페이액션 사용 설정이 저장되었습니다.");
      } else {
        toast.error(data?.error || "페이액션 설정 저장에 실패했습니다.");
      }
    } catch (error) {
      toast.error("페이액션 설정 저장에 실패했습니다.");
    } finally {
      setUpdatingPayactionViewOn(false);
    }
  };

  const updateRateField = (
    setter: React.Dispatch<React.SetStateAction<ClientExchangeRateForm>>,
    key: ClientExchangeRateKey,
    value: string,
  ) => {
    if (!isClientExchangeRateInput(value)) {
      return;
    }

    setter((current) => ({
      ...current,
      [key]: value,
    }));
  };

  if (!address) {
    return (
      <AdminAccessState
        variant="login"
        title="관리자 지갑 연결이 필요합니다"
        description="센터 시스템 설정은 관리자 지갑 서명 기반으로 보호됩니다. 지갑을 연결한 뒤 다시 시도해주세요."
        note="민감한 설정 변경은 모두 관리자 서명을 요구합니다."
      />
    );
  }

  if (loadingUser) {
    return (
      <AdminAccessState
        variant="checking"
        title="센터 설정 권한을 확인하고 있습니다"
        description="연결된 지갑이 admin 운영 정책과 일치하는지 점검하는 중입니다."
        address={address}
        note="확인 완료 후에만 센터 프로필과 환율 설정 화면이 열립니다."
      />
    );
  }

  if (!isAdmin) {
    return (
      <AdminAccessState
        variant="denied"
        title="센터 설정 접근 권한이 없습니다"
        description="이 화면은 금융 운영 관리자만 접근할 수 있습니다. 연결된 지갑의 운영 권한을 다시 확인해주세요."
        address={address}
        note="권한 기준: storecode=admin, role=admin"
        actions={
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center justify-center rounded-2xl border border-sky-300/20 bg-sky-400/12 px-4 py-3 text-sm font-medium text-sky-50 transition hover:bg-sky-400/20"
          >
            이전 화면
          </button>
        }
      />
    );
  }

  return (
    <main className="min-h-[100vh] bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.18),_transparent_24%),radial-gradient(circle_at_top_right,_rgba(16,185,129,0.14),_transparent_22%),linear-gradient(180deg,_#f7fafc_0%,_#eef4fb_100%)] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <section className="relative overflow-hidden rounded-[32px] border border-slate-200 bg-[linear-gradient(135deg,_rgba(15,23,42,0.97),_rgba(30,41,59,0.95)_52%,_rgba(15,118,110,0.9))] px-6 py-6 text-white shadow-[0_40px_120px_-56px_rgba(15,23,42,0.7)] sm:px-8">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(148,163,184,0.16),transparent_30%),radial-gradient(circle_at_80%_0%,rgba(16,185,129,0.18),transparent_26%)]" />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <button
                onClick={() => window.history.back()}
                className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-slate-100 transition hover:bg-white/10"
              >
                <Image src="/icon-back.png" alt="Back" width={18} height={18} className="h-4 w-4 rounded-full" />
                이전 화면
              </button>
              <div className="mt-5 inline-flex items-center rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.28em] text-emerald-200">
                Financial System Settings
              </div>
              <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">센터 시스템 설정</h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
                운영 로고, 센터 프로필, 매수/매도 환율, 결제 연동 토글을 각각 독립적으로 관리하는 금융앱 운영 콘솔입니다.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[360px]">
              <SummaryCard
                label="관리자 지갑"
                value={formatWalletAddress(address)}
                hint={user?.nickname ? `${user.nickname} 계정으로 로그인됨` : "관리자 계정 확인 완료"}
                tone="slate"
              />
              <SummaryCard
                label="동기화 상태"
                value={lastSyncedAt || "방금 불러옴"}
                hint={pendingChangeCount > 0 ? `${pendingChangeCount}개 섹션에 미저장 변경 있음` : "모든 설정이 저장된 상태"}
                tone={pendingChangeCount > 0 ? "amber" : "emerald"}
              />
            </div>
          </div>
        </section>

        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          <SummaryCard
            label="CLIENT ID"
            value={clientId || "미설정"}
            hint="결제/시세 기준 클라이언트 식별값"
            tone="slate"
          />
          <SummaryCard
            label="ACTIVE CHAIN"
            value={chainMeta.label}
            hint="센터가 현재 사용 중인 정산 체인"
            tone="slate"
          />
          <SummaryCard
            label="PAYACTION"
            value={payactionViewOn ? "활성화" : "비활성화"}
            hint={payactionViewOn ? "결제 연동 기능이 켜져 있습니다." : "결제 연동 기능이 꺼져 있습니다."}
            tone={payactionViewOn ? "emerald" : "amber"}
          />
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.7fr)]">
          <div className="space-y-6">
            <SettingCard
              eyebrow="Center Identity"
              title="센터 정보 변경"
              description="브랜드명과 소개 문구를 별도 API로 저장합니다. 환율과는 분리되어 즉시 독립 반영됩니다."
              action={(
                <button
                  type="button"
                  onClick={saveProfile}
                  disabled={!profileDirty || savingProfile}
                  className={`inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-semibold transition ${
                    !profileDirty || savingProfile
                      ? "cursor-not-allowed bg-slate-100 text-slate-400"
                      : "bg-slate-950 text-white hover:bg-slate-800"
                  }`}
                >
                  {savingProfile ? "저장 중..." : profileDirty ? "센터 정보 저장" : "저장 완료"}
                </button>
              )}
            >
              <div className="grid gap-5">
                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-slate-700">센터 이름</span>
                  <input
                    type="text"
                    value={profileForm.name}
                    onChange={(event) =>
                      setProfileForm((current) => ({
                        ...current,
                        name: event.target.value,
                      }))
                    }
                    placeholder="센터 이름"
                    className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white"
                  />
                </label>

                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-slate-700">센터 소개</span>
                  <textarea
                    value={profileForm.description}
                    onChange={(event) =>
                      setProfileForm((current) => ({
                        ...current,
                        description: event.target.value,
                      }))
                    }
                    rows={5}
                    placeholder="센터 소개 문구를 입력하세요."
                    className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white"
                  />
                </label>
              </div>
            </SettingCard>

            <SettingCard
              eyebrow="Market Buy Rates"
              title="환율(살때)"
              description="USDT를 고객이 구매할 때 사용하는 기준 환율입니다. 저장 시 변경 이력이 자동으로 기록됩니다."
              action={(
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => void loadRateHistory("buy")}
                    disabled={buyRateHistoryLoading}
                    className={`inline-flex items-center justify-center rounded-full border border-sky-200 px-4 py-2.5 text-sm font-semibold text-sky-700 transition hover:bg-sky-50 ${
                      buyRateHistoryLoading ? "cursor-not-allowed opacity-60" : ""
                    }`}
                  >
                    {buyRateHistoryLoading ? "이력 조회 중..." : buyRateHistoryLoaded ? "이력 새로고침" : "이력 보기"}
                  </button>
                  <button
                    type="button"
                    onClick={saveBuyRates}
                    disabled={!buyRatesDirty || savingBuyRates}
                    className={`inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-semibold transition ${
                      !buyRatesDirty || savingBuyRates
                        ? "cursor-not-allowed bg-slate-100 text-slate-400"
                        : "bg-sky-600 text-white hover:bg-sky-500"
                    }`}
                  >
                    {savingBuyRates ? "저장 중..." : buyRatesDirty ? "매수 환율 저장" : "저장 완료"}
                  </button>
                </div>
              )}
            >
              <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-5">
                {RATE_FIELD_META.map((item) => (
                  <div
                    key={`buy-${item.key}`}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-sky-200 hover:bg-white"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{item.label}</p>
                        <p className="mt-1 text-xs leading-5 text-slate-500">{item.description}</p>
                      </div>
                      <span className="rounded-full bg-sky-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-700">
                        Buy
                      </span>
                    </div>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={buyRatesForm[item.key]}
                      onChange={(event) => updateRateField(setBuyRatesForm, item.key, event.target.value)}
                      className="mt-4 h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-base font-semibold text-slate-900 outline-none transition focus:border-sky-400"
                    />
                  </div>
                ))}
              </div>

              <ExchangeRateHistoryPanel
                tone="sky"
                loaded={buyRateHistoryLoaded}
                loading={buyRateHistoryLoading}
                items={buyRateHistory}
                onLoad={() => void loadRateHistory("buy")}
              />
            </SettingCard>

            <SettingCard
              eyebrow="Market Sell Rates"
              title="환율(팔때)"
              description="USDT를 고객이 판매할 때 사용하는 기준 환율입니다. 저장 시 변경 이력이 자동으로 기록됩니다."
              action={(
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => void loadRateHistory("sell")}
                    disabled={sellRateHistoryLoading}
                    className={`inline-flex items-center justify-center rounded-full border border-emerald-200 px-4 py-2.5 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50 ${
                      sellRateHistoryLoading ? "cursor-not-allowed opacity-60" : ""
                    }`}
                  >
                    {sellRateHistoryLoading ? "이력 조회 중..." : sellRateHistoryLoaded ? "이력 새로고침" : "이력 보기"}
                  </button>
                  <button
                    type="button"
                    onClick={saveSellRates}
                    disabled={!sellRatesDirty || savingSellRates}
                    className={`inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-semibold transition ${
                      !sellRatesDirty || savingSellRates
                        ? "cursor-not-allowed bg-slate-100 text-slate-400"
                        : "bg-emerald-600 text-white hover:bg-emerald-500"
                    }`}
                  >
                    {savingSellRates ? "저장 중..." : sellRatesDirty ? "매도 환율 저장" : "저장 완료"}
                  </button>
                </div>
              )}
            >
              <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-5">
                {RATE_FIELD_META.map((item) => (
                  <div
                    key={`sell-${item.key}`}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-emerald-200 hover:bg-white"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{item.label}</p>
                        <p className="mt-1 text-xs leading-5 text-slate-500">{item.description}</p>
                      </div>
                      <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700">
                        Sell
                      </span>
                    </div>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={sellRatesForm[item.key]}
                      onChange={(event) => updateRateField(setSellRatesForm, item.key, event.target.value)}
                      className="mt-4 h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-base font-semibold text-slate-900 outline-none transition focus:border-emerald-400"
                    />
                  </div>
                ))}
              </div>

              <ExchangeRateHistoryPanel
                tone="emerald"
                loaded={sellRateHistoryLoaded}
                loading={sellRateHistoryLoading}
                items={sellRateHistory}
                onLoad={() => void loadRateHistory("sell")}
              />
            </SettingCard>
          </div>

          <div className="space-y-6">
            <SettingCard
              eyebrow="Brand Asset"
              title="센터 로고"
              description="보호된 업로드 라우트로 이미지를 저장하고, 관리자 서명 검증 후 로고 URL을 반영합니다."
            >
              <Uploader
                lang={params.lang}
                account={activeAccount}
                walletAddress={address}
              />
            </SettingCard>

            <SettingCard
              eyebrow="Payment Control"
              title="페이액션 사용 유무"
              description="결제 연동 기능을 실운영 환경에서 즉시 켜거나 끌 수 있습니다."
            >
              <div className="rounded-[24px] border border-slate-200 bg-[linear-gradient(180deg,_#f8fafc_0%,_#eef6ff_100%)] p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">현재 상태</p>
                    <p className="mt-2 text-2xl font-semibold text-slate-950">
                      {payactionViewOn ? "활성화" : "비활성화"}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      {payactionViewOn
                        ? "결제 연동이 외부 시스템과 연결되어 주문 화면에 노출됩니다."
                        : "결제 연동이 잠시 중단되어 주문 화면에 표시되지 않습니다."}
                    </p>
                  </div>

                  <div className="flex rounded-full bg-white p-1 shadow-[0_14px_30px_-18px_rgba(15,23,42,0.35)]">
                    <button
                      type="button"
                      disabled={updatingPayactionViewOn}
                      onClick={() => updatePayactionView(true)}
                      className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                        payactionViewOn
                          ? "bg-emerald-500 text-white shadow-sm"
                          : "text-slate-500 hover:text-slate-800"
                      } ${updatingPayactionViewOn ? "cursor-not-allowed opacity-60" : ""}`}
                    >
                      사용
                    </button>
                    <button
                      type="button"
                      disabled={updatingPayactionViewOn}
                      onClick={() => updatePayactionView(false)}
                      className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                        !payactionViewOn
                          ? "bg-slate-900 text-white shadow-sm"
                          : "text-slate-500 hover:text-slate-800"
                      } ${updatingPayactionViewOn ? "cursor-not-allowed opacity-60" : ""}`}
                    >
                      중지
                    </button>
                  </div>
                </div>
              </div>
            </SettingCard>

            <SettingCard
              eyebrow="System Context"
              title="환경 정보"
              description="운영 시스템에서 참조하는 체인과 식별 정보를 읽기 전용으로 표시합니다."
            >
              <div className="space-y-4">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Client ID</p>
                  <p className="mt-3 break-all text-sm font-semibold text-slate-900">{clientId || "미설정"}</p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Settlement Chain</p>
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    {Object.entries(CHAIN_META).map(([key, meta]) => {
                      const active = key === chain;

                      return (
                        <div
                          key={key}
                          className={`rounded-2xl border p-3 transition ${
                            active
                              ? "border-transparent bg-[linear-gradient(135deg,#0f172a,#0f766e)] text-white shadow-[0_24px_48px_-28px_rgba(15,23,42,0.7)]"
                              : meta.muted
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Image src={meta.icon} alt={meta.label} width={22} height={22} className="h-5 w-5 rounded-full" />
                            <span className="text-sm font-semibold">{meta.label}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-700">운영 메모</p>
                  <p className="mt-3 text-sm leading-6 text-amber-900">
                    프로필, 매수환율, 매도환율은 각각 별도 API로 저장됩니다. 환율 저장 시에는 변경 전후 값과 변경 시각이 자동으로 이력에 기록됩니다.
                  </p>
                </div>
              </div>
            </SettingCard>
          </div>
        </div>
      </div>
    </main>
  );
}
