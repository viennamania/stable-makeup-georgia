'use client';

import { useEffect, useRef, useState, type KeyboardEvent } from "react";

import Image from "next/image";

import { toast } from 'react-hot-toast';

import Modal from '@/components/modal';

import { client } from "../../../../../client";

import {
  ConnectButton,
  useActiveAccount,
} from "thirdweb/react";
import { useRouter } from "next/navigation";

import {
  inAppWallet,
  createWallet,
} from "thirdweb/wallets";

import {
  ethereum,
  polygon,
  arbitrum,
  bsc,
} from "thirdweb/chains";

import {
  chain,
} from "@/app/config/contractAddresses";

const wallets = [
  inAppWallet({
    auth: {
      options: ["email", "google"],
    },
  }),
];

const formatDateTime = (value: any) => {
  if (!value) {
    return '-';
  }
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }
  return date.toLocaleString('ko-KR', {
    timeZone: 'Asia/Seoul',
  });
};

type BankForm = {
  bankName: string;
  accountNumber: string;
  accountHolder: string;
};

type BankInfoOption = {
  id: string;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  label: string;
};

const emptyForm: BankForm = {
  bankName: '',
  accountNumber: '',
  accountHolder: '',
};

const bankSections = [
  {
    key: 'bankInfo',
    label: '일반 회원용',
    endpoint: '/api/store/setStoreBankInfo',
  },
  {
    key: 'bankInfoAAA',
    label: '1등급 회원용',
    endpoint: '/api/store/setStoreBankInfoAAA',
  },
  {
    key: 'bankInfoBBB',
    label: '2등급 회원용',
    endpoint: '/api/store/setStoreBankInfoBBB',
  },
  {
    key: 'bankInfoCCC',
    label: '3등급 회원용',
    endpoint: '/api/store/setStoreBankInfoCCC',
  },
  {
    key: 'bankInfoDDD',
    label: '4등급 회원용',
    endpoint: '/api/store/setStoreBankInfoDDD',
  },
];

const sectionBadgeMap: Record<
  string,
  { bg: string; text: string; label: string }
> = {
  bankInfo: { bg: 'bg-zinc-200', text: 'text-zinc-800', label: '일반' },
  bankInfoAAA: { bg: 'bg-rose-500', text: 'text-white', label: '1등급' },
  bankInfoBBB: { bg: 'bg-orange-500', text: 'text-white', label: '2등급' },
  bankInfoCCC: { bg: 'bg-amber-500', text: 'text-white', label: '3등급' },
  bankInfoDDD: { bg: 'bg-emerald-500', text: 'text-white', label: '4등급' },
};

const buildFormsFromStore = (store: any) => ({
  bankInfo: {
    bankName: store?.bankInfo?.bankName || '',
    accountNumber: store?.bankInfo?.accountNumber || '',
    accountHolder: store?.bankInfo?.accountHolder || '',
  },
  bankInfoAAA: {
    bankName: store?.bankInfoAAA?.bankName || '',
    accountNumber: store?.bankInfoAAA?.accountNumber || '',
    accountHolder: store?.bankInfoAAA?.accountHolder || '',
  },
  bankInfoBBB: {
    bankName: store?.bankInfoBBB?.bankName || '',
    accountNumber: store?.bankInfoBBB?.accountNumber || '',
    accountHolder: store?.bankInfoBBB?.accountHolder || '',
  },
  bankInfoCCC: {
    bankName: store?.bankInfoCCC?.bankName || '',
    accountNumber: store?.bankInfoCCC?.accountNumber || '',
    accountHolder: store?.bankInfoCCC?.accountHolder || '',
  },
  bankInfoDDD: {
    bankName: store?.bankInfoDDD?.bankName || '',
    accountNumber: store?.bankInfoDDD?.accountNumber || '',
    accountHolder: store?.bankInfoDDD?.accountHolder || '',
  },
});

export default function PaymentSettingsPage({ params }: any) {
  const router = useRouter();
  const activeAccount = useActiveAccount();
  const address = activeAccount?.address;
  const storecode = params?.storecode;

  const [store, setStore] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [forms, setForms] = useState<Record<string, BankForm>>(() => ({
    bankInfo: { ...emptyForm },
    bankInfoAAA: { ...emptyForm },
    bankInfoBBB: { ...emptyForm },
    bankInfoCCC: { ...emptyForm },
    bankInfoDDD: { ...emptyForm },
  }));
  const [saving, setSaving] = useState<Record<string, boolean>>(() => ({
    bankInfo: false,
    bankInfoAAA: false,
    bankInfoBBB: false,
    bankInfoCCC: false,
    bankInfoDDD: false,
  }));
  const [bankInfoOptions, setBankInfoOptions] = useState<BankInfoOption[]>([]);
  const [bankInfoLoading, setBankInfoLoading] = useState(false);
  const [bankInfoTotal, setBankInfoTotal] = useState(0);
  const [bankInfoPage, setBankInfoPage] = useState(1);
  const [bankInfoHasMore, setBankInfoHasMore] = useState(false);
  const [bankInfoFilters, setBankInfoFilters] = useState({
    bankName: '',
    accountNumber: '',
  });
  const bankInfoFilterInitialized = useRef(false);
  const skipBankInfoDebounce = useRef(false);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const [selectedBankInfoIds, setSelectedBankInfoIds] = useState<Record<string, string>>(() => ({
    bankInfo: '',
    bankInfoAAA: '',
    bankInfoBBB: '',
    bankInfoCCC: '',
    bankInfoDDD: '',
  }));
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historyItems, setHistoryItems] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyFilters, setHistoryFilters] = useState({
    field: '',
    dateFrom: '',
    dateTo: '',
  });
  const [confirmInfo, setConfirmInfo] = useState<{
    key: string;
    endpoint: string;
    label: string;
    bankName: string;
    accountNumber: string;
    accountHolder: string;
  } | null>(null);

  const fetchStore = async () => {
    if (!storecode) return;
    setLoading(true);
    try {
      const response = await fetch('/api/store/getOneStore', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          storecode,
          walletAddress: address || '',
        }),
      });

      if (!response.ok) {
        toast.error('스토어 정보를 불러오지 못했습니다.');
        return;
      }

      const data = await response.json();
      setStore(data.result || null);
      setForms(buildFormsFromStore(data.result));
    } catch (error) {
      toast.error('스토어 정보를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const getBankInfoId = (item: any) =>
    String(item?._id?.toString?.() || item?._id?.$oid || item?._id || '');

  const getBankInfoAccountNumber = (item: any) =>
    item?.defaultAccountNumber || item?.realAccountNumber || item?.accountNumber || '';

  const mergeBankInfoOptions = (prev: BankInfoOption[], next: BankInfoOption[]) => {
    const map = new Map(prev.map((item) => [item.id, item]));
    next.forEach((item) => {
      map.set(item.id, item);
    });
    return Array.from(map.values());
  };

  const fetchBankInfoOptions = async ({
    page = 1,
    append = false,
    filters = bankInfoFilters,
  }: {
    page?: number;
    append?: boolean;
    filters?: { bankName: string; accountNumber: string };
  } = {}) => {
    setBankInfoLoading(true);
    try {
      const limit = 100;
      const response = await fetch('/api/bankInfo/getAll', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bankName: filters.bankName || undefined,
          accountNumber: filters.accountNumber || undefined,
          limit,
          page,
        }),
      });

      if (!response.ok) {
        toast.error('은행 계좌 목록을 불러오지 못했습니다.');
        return;
      }

      const data = await response.json();
      const list = Array.isArray(data?.result?.bankInfos) ? data.result.bankInfos : [];
      const mapped: BankInfoOption[] = list
        .map((item: any) => {
          const bankName = item?.bankName || '';
          const accountNumber = getBankInfoAccountNumber(item);
          const accountHolder = item?.accountHolder || '';
          return {
            id: getBankInfoId(item),
            bankName,
            accountNumber,
            accountHolder,
            label: `${bankName || '-'} / ${accountNumber || '-'} / ${accountHolder || '-'}`,
          };
        })
        .filter((item: BankInfoOption) => item.id && item.accountNumber);

      const totalCount = Number(data?.result?.totalCount) || 0;
      setBankInfoOptions((prev) => (append ? mergeBankInfoOptions(prev, mapped) : mapped));
      setBankInfoTotal(totalCount);
      setBankInfoPage(page);
      setBankInfoHasMore(page * limit < totalCount);
    } catch (error) {
      toast.error('은행 계좌 목록을 불러오지 못했습니다.');
    } finally {
      setBankInfoLoading(false);
    }
  };

  useEffect(() => {
    if (!storecode || !address) return;
    fetchStore();
  }, [storecode, address]);

  useEffect(() => {
    if (!address) return;
    fetchBankInfoOptions({ page: 1, append: false, filters: bankInfoFilters });
  }, [address]);

  useEffect(() => {
    if (!address) return;
    if (!bankInfoFilterInitialized.current) {
      bankInfoFilterInitialized.current = true;
      return;
    }
    if (skipBankInfoDebounce.current) {
      skipBankInfoDebounce.current = false;
      return;
    }
    const timer = window.setTimeout(() => {
      fetchBankInfoOptions({ page: 1, append: false, filters: bankInfoFilters });
    }, 400);
    return () => window.clearTimeout(timer);
  }, [bankInfoFilters, address]);

  useEffect(() => {
    if (!store || bankInfoOptions.length === 0) return;
    const nextSelections: Record<string, string> = {};
    const nextForms: Record<string, BankForm> = {};
    bankSections.forEach((section) => {
      const current = store?.[section.key];
      if (!current) return;
      const matched = bankInfoOptions.find(
        (option) =>
          option.bankName === current.bankName &&
          option.accountNumber === current.accountNumber &&
          option.accountHolder === current.accountHolder
      );
      if (matched) {
        nextSelections[section.key] = matched.id;
        nextForms[section.key] = {
          bankName: matched.bankName,
          accountNumber: matched.accountNumber,
          accountHolder: matched.accountHolder,
        };
      }
    });
    if (Object.keys(nextSelections).length > 0) {
      setSelectedBankInfoIds((prev) => ({ ...prev, ...nextSelections }));
    }
    if (Object.keys(nextForms).length > 0) {
      setForms((prev) => ({ ...prev, ...nextForms }));
    }
  }, [store, bankInfoOptions]);

  useEffect(() => {
    const target = loadMoreRef.current;
    if (!target) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting) {
          loadMoreBankInfoOptions();
        }
      },
      { root: null, rootMargin: '200px', threshold: 0 }
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [bankInfoHasMore, bankInfoLoading, bankInfoPage, bankInfoFilters]);

  const fetchHistory = async (filters = historyFilters) => {
    if (!storecode) return;
    setHistoryLoading(true);
    try {
      const response = await fetch('/api/store/getStoreBankInfoHistory', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          storecode,
          limit: 100,
          field: filters.field || undefined,
          dateFrom: filters.dateFrom || undefined,
          dateTo: filters.dateTo || undefined,
        }),
      });

      if (!response.ok) {
        toast.error('변경 이력을 불러오지 못했습니다.');
        return;
      }

      const data = await response.json();
      setHistoryItems(Array.isArray(data.result) ? data.result : []);
    } catch (error) {
      toast.error('변경 이력을 불러오지 못했습니다.');
    } finally {
      setHistoryLoading(false);
    }
  };

  const openHistoryPanel = async () => {
    setIsHistoryOpen(true);
    await fetchHistory();
  };

  const closeHistoryPanel = () => {
    setIsHistoryOpen(false);
  };

  const historyLabelMap: Record<string, string> = {
    bankInfo: '일반 회원용',
    bankInfoAAA: '1등급 회원용',
    bankInfoBBB: '2등급 회원용',
    bankInfoCCC: '3등급 회원용',
    bankInfoDDD: '4등급 회원용',
  };
  const historyFieldOptions = [
    { value: '', label: '전체' },
    { value: 'bankInfo', label: '일반 회원용' },
    { value: 'bankInfoAAA', label: '1등급 회원용' },
    { value: 'bankInfoBBB', label: '2등급 회원용' },
    { value: 'bankInfoCCC', label: '3등급 회원용' },
    { value: 'bankInfoDDD', label: '4등급 회원용' },
  ];

  const applyBankInfoFilters = () => {
    fetchBankInfoOptions({ page: 1, append: false, filters: bankInfoFilters });
  };

  const resetBankInfoFilters = () => {
    const reset = { bankName: '', accountNumber: '' };
    skipBankInfoDebounce.current = true;
    setBankInfoFilters(reset);
    fetchBankInfoOptions({ page: 1, append: false, filters: reset });
  };

  const loadMoreBankInfoOptions = () => {
    if (bankInfoLoading || !bankInfoHasMore) return;
    fetchBankInfoOptions({
      page: bankInfoPage + 1,
      append: true,
      filters: bankInfoFilters,
    });
  };

  const handleBankInfoSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      applyBankInfoFilters();
    }
  };

  const handleSelectBankInfo = (key: string, selectedId: string) => {
    setSelectedBankInfoIds((prev) => ({ ...prev, [key]: selectedId }));
    const selected = bankInfoOptions.find((option) => option.id === selectedId);
    if (!selected) {
      setForms((prev) => ({ ...prev, [key]: { ...emptyForm } }));
      return;
    }
    setForms((prev) => ({
      ...prev,
      [key]: {
        bankName: selected.bankName,
        accountNumber: selected.accountNumber,
        accountHolder: selected.accountHolder,
      },
    }));
  };

  const saveBankInfo = async (key: string, endpoint: string) => {
    const form = forms[key];
    if (!form?.bankName || !form?.accountNumber || !form?.accountHolder) {
      toast.error('은행명, 계좌번호, 예금주를 입력하세요.');
      return;
    }

    setSaving((prev) => ({ ...prev, [key]: true }));
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress: address || '',
          storecode,
          bankName: form.bankName,
          accountNumber: form.accountNumber,
          accountHolder: form.accountHolder,
        }),
      });

      if (!response.ok) {
        toast.error('저장에 실패했습니다.');
        return;
      }

      toast.success('저장했습니다.');
      await fetchStore();
    } catch (error) {
      toast.error('저장에 실패했습니다.');
    } finally {
      setSaving((prev) => ({ ...prev, [key]: false }));
    }
  };

  const resetSectionSelection = (key: string) => {
    setSelectedBankInfoIds((prev) => ({ ...prev, [key]: '' }));
    setForms((prev) => ({
      ...prev,
      [key]: { ...emptyForm },
    }));
  };

  const resetSectionRemote = async (key: string, endpoint: string) => {
    if (saving[key]) return;
    setSaving((prev) => ({ ...prev, [key]: true }));
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: address || '',
          storecode,
          bankName: '',
          accountNumber: '',
          accountHolder: '',
        }),
      });
      if (!response.ok) {
        toast.error('리셋에 실패했습니다.');
        return;
      }
      toast.success('리셋했습니다.');
      resetSectionSelection(key);
      await fetchStore();
    } catch (error) {
      toast.error('리셋에 실패했습니다.');
    } finally {
      setSaving((prev) => ({ ...prev, [key]: false }));
    }
  };

  const requestSave = (key: string, endpoint: string) => {
    const form = forms[key];
    if (!form?.bankName || !form?.accountNumber || !form?.accountHolder) {
      toast.error('은행명, 계좌번호, 예금주를 입력하세요.');
      return;
    }
    if (!selectedBankInfoIds[key]) {
      toast.error('은행 계좌를 선택하세요.');
      return;
    }
    const sectionLabel = bankSections.find((section) => section.key === key)?.label || '';
    setConfirmInfo({
      key,
      endpoint,
      label: sectionLabel,
      bankName: form.bankName,
      accountNumber: form.accountNumber,
      accountHolder: form.accountHolder,
    });
  };

  const handleConfirmSave = async () => {
    if (!confirmInfo) return;
    const { key, endpoint } = confirmInfo;
    setConfirmInfo(null);
    await saveBankInfo(key, endpoint);
  };

  const storeName = store?.storeName || storecode || '-';

  if (!address) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <h1 className="text-2xl font-bold">로그인</h1>

        <ConnectButton
          client={client}
          wallets={wallets}
          showAllWallets={false}
          chain={chain === "ethereum" ? ethereum :
                  chain === "polygon" ? polygon :
                  chain === "arbitrum" ? arbitrum :
                  chain === "bsc" ? bsc : arbitrum}
          theme={"light"}
          connectButton={{
            style: {
              backgroundColor: "#3167b4",
              color: "#f3f4f6",
              padding: "2px 2px",
              borderRadius: "10px",
              fontSize: "14px",
              height: "38px",
            },
            label: "원클릭 로그인",
          }}
          connectModal={{
            size: "wide",
            titleIcon: "https://www.stable.makeup/logo.png",
            showThirdwebBranding: false,
          }}
          locale={"ko_KR"}
        />
      </div>
    );
  }

  return (
    <main className="p-4 pb-10 min-h-[100vh] flex items-start justify-center container max-w-xl mx-auto">
      <div className="py-0 w-full space-y-4">
        <div className="w-full flex items-center justify-start">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-sm px-3 py-2 rounded border border-zinc-300 text-zinc-600 hover:bg-zinc-50"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4" aria-hidden="true">
              <path
                d="M15 6l-6 6 6 6"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            돌아가기
          </button>
        </div>
        <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-2 border-b border-zinc-200 pb-2">
          <div className="flex flex-row items-center gap-3">
            {store?.storeLogo ? (
              <Image
                src={store.storeLogo}
                alt="Store Logo"
                width={44}
                height={44}
                className="w-11 h-11 rounded-full object-cover border border-zinc-200"
              />
            ) : (
              <div className="w-11 h-11 rounded-full border border-zinc-200 bg-zinc-100 text-zinc-500 text-sm font-semibold flex items-center justify-center">
                {storeName?.slice(0, 1)?.toUpperCase() || 'S'}
              </div>
            )}
            <div>
              <div className="text-xl font-semibold">계좌이체용 원화통장 설정</div>
              <div className="text-sm text-zinc-500">{storeName}</div>
            </div>
          </div>

          <div className="flex flex-row items-center gap-2">
            {loading && (
              <Image
                src="/loading.png"
                alt="Loading"
                width={20}
                height={20}
                className="w-5 h-5 animate-spin"
              />
            )}
            <button
              onClick={fetchStore}
              className={`text-sm px-3 py-2 rounded border border-zinc-300 text-zinc-700 hover:bg-zinc-50 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={loading}
            >
              새로고침
            </button>
            <button
              onClick={openHistoryPanel}
              className="text-sm px-3 py-2 rounded border border-zinc-300 text-zinc-700 hover:bg-zinc-50"
            >
              변경 이력 조회
            </button>
          </div>
        </div>

        <div className="w-full bg-white border border-zinc-200 rounded-md px-4 py-4 space-y-3">
          <div className="text-sm text-zinc-500">은행 계좌 검색</div>
          <div className="grid gap-2 sm:grid-cols-2">
            <input
              type="text"
              className="w-full p-2 border border-zinc-300 rounded-md text-sm text-zinc-700 focus:outline-none focus:ring-1 focus:ring-zinc-400 focus:border-zinc-400"
              placeholder="은행명"
              value={bankInfoFilters.bankName}
              onChange={(e) => setBankInfoFilters((prev) => ({ ...prev, bankName: e.target.value }))}
              onKeyDown={handleBankInfoSearchKeyDown}
            />
            <input
              type="text"
              className="w-full p-2 border border-zinc-300 rounded-md text-sm text-zinc-700 focus:outline-none focus:ring-1 focus:ring-zinc-400 focus:border-zinc-400"
              placeholder="계좌번호"
              value={bankInfoFilters.accountNumber}
              onChange={(e) => setBankInfoFilters((prev) => ({ ...prev, accountNumber: e.target.value }))}
              onKeyDown={handleBankInfoSearchKeyDown}
            />
          </div>
          <div className="flex items-center justify-between text-xs text-zinc-500">
            <span>
              표시 {bankInfoOptions.length.toLocaleString('ko-KR')} / {bankInfoTotal.toLocaleString('ko-KR')}건
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={applyBankInfoFilters}
                className="px-3 py-1.5 rounded bg-zinc-900 text-white hover:bg-zinc-800 text-xs"
                disabled={bankInfoLoading}
              >
                검색
              </button>
              <button
                type="button"
                onClick={resetBankInfoFilters}
                className="px-3 py-1.5 rounded border border-zinc-300 text-zinc-600 hover:bg-zinc-50 text-xs"
                disabled={bankInfoLoading}
              >
                초기화
              </button>
            </div>
          </div>
        </div>

        <div className="grid gap-4">
          {bankSections.map((section) => {
            const current = store?.[section.key];
            const form = forms[section.key] || emptyForm;
            const isSaving = saving[section.key];
            const selectedId = selectedBankInfoIds[section.key] || '';

            return (
              <div key={section.key} className="w-full bg-white border border-zinc-200 rounded-md p-4 space-y-3">
                <div className="flex items-center gap-2 border-b border-zinc-200 pb-2">
                  <span
                    className={`inline-flex items-center gap-2`}
                  >
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-semibold ${sectionBadgeMap[section.key]?.bg || 'bg-zinc-200'} ${sectionBadgeMap[section.key]?.text || 'text-zinc-800'}`}
                    >
                      {sectionBadgeMap[section.key]?.label || '등급'}
                    </span>
                    <span className="text-lg text-zinc-800 font-semibold">
                      {section.label}
                    </span>
                  </span>
                </div>

                <div className="grid gap-2 text-sm text-zinc-600">
                  <div className="flex items-center gap-2">
                    <span className="w-20 text-zinc-500">은행이름</span>
                    <span className="font-medium text-zinc-900">{current?.bankName || '-'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-20 text-zinc-500">계좌번호</span>
                    <span className="font-medium text-zinc-900">{current?.accountNumber || '-'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-20 text-zinc-500">예금주</span>
                    <span className="font-medium text-zinc-900">{current?.accountHolder || '-'}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <select
                    className="w-full p-2 border border-zinc-300 rounded-md text-sm text-zinc-700 bg-white focus:outline-none focus:ring-1 focus:ring-zinc-400 focus:border-zinc-400"
                    value={selectedId}
                    onChange={(e) => handleSelectBankInfo(section.key, e.target.value)}
                    disabled={bankInfoLoading}
                  >
                    <option value="">{bankInfoLoading ? '불러오는 중...' : '계좌 선택'}</option>
                    {bankInfoOptions.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <div className="rounded-md border border-zinc-200 bg-zinc-50 p-2 text-xs text-zinc-600">
                    <div>은행명: {form.bankName || '-'}</div>
                    <div>계좌번호: {form.accountNumber || '-'}</div>
                    <div>예금주: {form.accountHolder || '-'}</div>
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const ok = window.confirm('선택한 계좌를 초기화하고 저장된 값을 비우시겠습니까?');
                      if (ok) {
                        resetSectionRemote(section.key, section.endpoint);
                      }
                    }}
                    disabled={isSaving}
                    className={`px-4 py-2 rounded border border-zinc-300 text-zinc-700 hover:bg-zinc-50 text-sm ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    리셋하기
                  </button>
                  <button
                    type="button"
                    onClick={() => requestSave(section.key, section.endpoint)}
                    disabled={isSaving || !selectedId}
                    className={`px-4 py-2 rounded text-white bg-zinc-900 hover:bg-zinc-800 text-sm ${isSaving || !selectedId ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {isSaving ? '저장 중...' : '저장하기'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        {bankInfoHasMore && (
          <div className="flex justify-center py-2 text-xs text-zinc-400">
            {bankInfoLoading ? '불러오는 중...' : '스크롤하면 더 불러옵니다.'}
          </div>
        )}
        <div ref={loadMoreRef} />
      </div>

      <Modal isOpen={!!confirmInfo} onClose={() => setConfirmInfo(null)}>
        <div className="flex flex-col gap-5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-zinc-900/90 text-white flex items-center justify-center text-sm font-semibold">
              ✓
            </div>
            <div>
              <div className="text-lg font-semibold text-zinc-900">저장 확인</div>
              <div className="text-sm text-zinc-500">아래 정보로 변경됩니다.</div>
            </div>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-700 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-zinc-500">구분</span>
              <span className="font-medium text-zinc-900">
                {confirmInfo?.label || '-'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-500">은행명</span>
              <span className="font-medium text-zinc-900">{confirmInfo?.bankName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-500">계좌번호</span>
              <span className="font-medium text-zinc-900">{confirmInfo?.accountNumber}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-500">예금주</span>
              <span className="font-medium text-zinc-900">{confirmInfo?.accountHolder}</span>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setConfirmInfo(null)}
              className="px-4 py-2 rounded-md border border-zinc-300 text-zinc-600 hover:bg-zinc-50 text-sm"
            >
              취소
            </button>
            <button
              type="button"
              onClick={handleConfirmSave}
              className="px-4 py-2 rounded-md bg-zinc-900 text-white hover:bg-zinc-800 text-sm"
            >
              변경하기
            </button>
          </div>
        </div>
      </Modal>

      <div className={`fixed inset-0 z-50 ${isHistoryOpen ? '' : 'pointer-events-none'}`}>
        <div
          className={`absolute inset-0 bg-black/20 transition-opacity duration-200 ${isHistoryOpen ? 'opacity-100' : 'opacity-0'}`}
          onClick={closeHistoryPanel}
        />
        <div
          className={`absolute right-0 top-0 h-full w-full sm:w-[420px] bg-zinc-50 border-l border-zinc-200 transform transition-transform duration-200 ${isHistoryOpen ? 'translate-x-0' : 'translate-x-full'}`}
        >
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 bg-white/80 backdrop-blur">
              <div>
                <div className="text-xs text-zinc-500">P2P 구매자 계좌이체용</div>
                <div className="text-lg font-semibold text-zinc-900">변경 이력</div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fetchHistory()}
                  className={`text-sm px-3 py-1.5 rounded border border-zinc-300 text-zinc-600 hover:bg-zinc-50 ${historyLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  disabled={historyLoading}
                >
                  새로고침
                </button>
                <button
                  type="button"
                  onClick={closeHistoryPanel}
                  className="h-8 w-8 rounded-full border border-zinc-200 bg-white text-zinc-500 hover:bg-zinc-50 hover:text-zinc-700 flex items-center justify-center"
                  aria-label="닫기"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
                    <path
                      d="M6 6l12 12M18 6L6 18"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
              </div>
            </div>

            <div className="px-4 pt-4">
              <div className="rounded-lg border border-zinc-200 bg-white p-3 space-y-3 text-sm">
                <div className="grid gap-2 sm:grid-cols-3">
                  <select
                    className="w-full p-2 border border-zinc-300 rounded-md text-sm text-zinc-700 bg-white focus:outline-none focus:ring-1 focus:ring-zinc-400 focus:border-zinc-400"
                    value={historyFilters.field}
                    onChange={(e) => setHistoryFilters((prev) => ({ ...prev, field: e.target.value }))}
                  >
                    {historyFieldOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <input
                    type="date"
                    className="w-full p-2 border border-zinc-300 rounded-md text-sm text-zinc-700 bg-white focus:outline-none focus:ring-1 focus:ring-zinc-400 focus:border-zinc-400"
                    value={historyFilters.dateFrom}
                    onChange={(e) => setHistoryFilters((prev) => ({ ...prev, dateFrom: e.target.value }))}
                  />
                  <input
                    type="date"
                    className="w-full p-2 border border-zinc-300 rounded-md text-sm text-zinc-700 bg-white focus:outline-none focus:ring-1 focus:ring-zinc-400 focus:border-zinc-400"
                    value={historyFilters.dateTo}
                    onChange={(e) => setHistoryFilters((prev) => ({ ...prev, dateTo: e.target.value }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-xs text-zinc-500">기간을 지정하면 해당 날짜 기준으로 조회됩니다.</div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const resetFilters = { field: '', dateFrom: '', dateTo: '' };
                        setHistoryFilters(resetFilters);
                        fetchHistory(resetFilters);
                      }}
                      className="px-3 py-1.5 rounded border border-zinc-300 text-zinc-600 hover:bg-zinc-50 text-xs"
                    >
                      초기화
                    </button>
                    <button
                      type="button"
                      onClick={() => fetchHistory()}
                      className="px-3 py-1.5 rounded bg-zinc-900 text-white hover:bg-zinc-800 text-xs"
                    >
                      필터 적용
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 text-sm text-zinc-700">
              {historyLoading && (
                <div className="text-sm text-zinc-400">불러오는 중...</div>
              )}
              {!historyLoading && historyItems.length === 0 && (
                <div className="text-sm text-zinc-400">변경 이력이 없습니다.</div>
              )}
              {historyItems.map((item, index) => {
                const beforeInfo = item?.before || {};
                const afterInfo = item?.after || {};
                return (
                  <div key={item?._id?.toString?.() || item?._id || index} className="border border-zinc-200 rounded-lg p-3 space-y-2 bg-white">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium text-zinc-900">
                        {historyLabelMap[item?.field] || item?.field || '변경'}
                      </div>
                      <div className="text-xs text-zinc-400">{formatDateTime(item?.updatedAt)}</div>
                    </div>
                    <div className="grid gap-2 text-xs text-zinc-600">
                      <div className="rounded-md border border-zinc-200 bg-zinc-50 p-2">
                        <div className="text-zinc-500 mb-1">이전</div>
                        <div>은행명: {beforeInfo?.bankName || '-'}</div>
                        <div>계좌번호: {beforeInfo?.accountNumber || '-'}</div>
                        <div>예금주: {beforeInfo?.accountHolder || '-'}</div>
                      </div>
                      <div className="rounded-md border border-zinc-200 bg-white p-2">
                        <div className="text-zinc-500 mb-1">변경</div>
                        <div>은행명: {afterInfo?.bankName || '-'}</div>
                        <div>계좌번호: {afterInfo?.accountNumber || '-'}</div>
                        <div>예금주: {afterInfo?.accountHolder || '-'}</div>
                      </div>
                    </div>
                    {item?.updatedBy && (
                      <div className="text-xs text-zinc-400">변경자: {item.updatedBy}</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
