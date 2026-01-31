'use client';

import { useEffect, useState } from "react";

import Image from "next/image";

import { toast } from 'react-hot-toast';

import { client } from "../../../client";

import {
  ConnectButton,
  useActiveAccount,
} from "thirdweb/react";

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
      options: [
        "google",
        "discord",
        "email",
        "x",
        "passkey",
        "phone",
        "facebook",
        "line",
        "apple",
        "coinbase",
      ],
    },
  }),
  createWallet("com.coinbase.wallet"),
  createWallet("me.rainbow"),
  createWallet("io.rabby"),
  createWallet("io.zerion.wallet"),
  createWallet("io.metamask"),
  createWallet("com.bitget.web3"),
  createWallet("com.trustwallet.app"),
  createWallet("com.okex.wallet"),
];

const formatDateTime = (value: any) => {
  if (!value) {
    return '-';
  }
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }
  return date.toLocaleString('ko-KR');
};

const CopyIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    className={className || "h-4 w-4"}
    aria-hidden="true"
  >
    <rect
      x="9"
      y="9"
      width="11"
      height="11"
      rx="2"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    />
    <rect
      x="4"
      y="4"
      width="11"
      height="11"
      rx="2"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    />
  </svg>
);

const emptyForm = {
  bankName: '',
  realAccountNumber: '',
  accountHolder: '',
};

const bankNameOptions = [
  '국민은행',
  '신한은행',
  '우리은행',
  '하나은행',
  '농협',
  '기업은행',
  'SC제일은행',
  '씨티은행',
  '카카오뱅크',
  '케이뱅크',
  '토스뱅크',
  '새마을금고',
  '수협',
  '우체국',
  '신협',
];

export default function BankInfoPage() {
  const activeAccount = useActiveAccount();
  const address = activeAccount?.address;

  const [bankInfos, setBankInfos] = useState([] as any[]);
  const [totalCount, setTotalCount] = useState(0);
  const [fetching, setFetching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ ...emptyForm });
  const [searchKeyword, setSearchKeyword] = useState('');
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedInfo, setSelectedInfo] = useState<any>(null);
  const [detailMemo, setDetailMemo] = useState('');
  const [savingMemo, setSavingMemo] = useState(false);
  const [detailAliases, setDetailAliases] = useState<string[]>([]);
  const [aliasInput, setAliasInput] = useState('');
  const [savingAliases, setSavingAliases] = useState(false);
  const [isDefaultOpen, setIsDefaultOpen] = useState(false);
  const [selectedDefaultInfo, setSelectedDefaultInfo] = useState<any>(null);
  const [selectedDefaultValue, setSelectedDefaultValue] = useState('');
  const [savingDefault, setSavingDefault] = useState(false);

  const getIdValue = (item: any) =>
    String(item?._id?.toString?.() || item?._id?.$oid || item?._id || '');

  const normalizeAliasList = (list: string[]) =>
    Array.from(
      new Set(
        list
          .map((value) => String(value || '').trim())
          .filter((value) => value.length > 0)
      )
    );

  const sanitizeDigits = (value: string) => value.replace(/\D/g, '');

  const arraysEqual = (a: string[], b: string[]) => {
    if (a.length !== b.length) {
      return false;
    }
    return a.every((value, index) => value === b[index]);
  };

  const memoOriginal = selectedInfo?.memo || '';
  const isMemoDirty = detailMemo !== memoOriginal;
  const aliasOriginal = Array.isArray(selectedInfo?.aliasAccountNumber)
    ? selectedInfo.aliasAccountNumber
    : [];
  const isAliasDirty = !arraysEqual(detailAliases, aliasOriginal);
  const defaultOriginal = selectedDefaultInfo?.defaultAccountNumber || '';
  const isDefaultDirty = selectedDefaultValue !== defaultOriginal;
  const defaultRealValue = selectedDefaultInfo?.realAccountNumber || selectedDefaultInfo?.accountNumber || '';
  const defaultAliasValues = normalizeAliasList(
    Array.isArray(selectedDefaultInfo?.aliasAccountNumber) ? selectedDefaultInfo.aliasAccountNumber : []
  ).filter((value) => value !== defaultRealValue);

  const resolveErrorMessage = async (
    response: Response,
    fallback: string
  ) => {
    if (response.status === 409) {
      return '이미 등록된 실계좌번호입니다.';
    }
    if (response.status === 400) {
      try {
        const data = await response.json();
        if (data?.error === 'valid id is required') {
          return '유효하지 않은 항목입니다.';
        }
        if (
          data?.error === 'bankName, realAccountNumber, accountHolder are required' ||
          data?.error === 'bankName, accountNumber, accountHolder are required'
        ) {
          return '은행명, 실계좌번호, 예금주를 모두 입력해주세요.';
        }
      } catch (error) {
        return '요청 값이 올바르지 않습니다.';
      }
      return '요청 값이 올바르지 않습니다.';
    }
    if (response.status >= 500) {
      return '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
    }
    return fallback;
  };

  const fetchBankInfos = async (keyword = searchKeyword) => {
    if (fetching) {
      return;
    }
    setFetching(true);
    try {
      const response = await fetch('/api/bankInfo/getAll', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          search: keyword || '',
          limit: 200,
          page: 1,
        }),
      });

      if (!response.ok) {
        const message = await resolveErrorMessage(response, '은행 정보 조회를 실패했습니다.');
        toast.error(message);
        return;
      }

      const data = await response.json();
      setBankInfos(data.result?.bankInfos || []);
      setTotalCount(data.result?.totalCount || 0);
    } catch (error) {
      toast.error('은행 정보 조회를 실패했습니다.');
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    if (!address) {
      setBankInfos([]);
      setTotalCount(0);
      return;
    }
    fetchBankInfos();
  }, [address]);

  const handleCreate = async () => {
    if (saving) return;

    const payload = {
      bankName: form.bankName.trim(),
      realAccountNumber: form.realAccountNumber.trim(),
      accountHolder: form.accountHolder.trim(),
    };

    if (!payload.bankName || !payload.realAccountNumber || !payload.accountHolder) {
      toast.error('은행명, 실계좌번호, 예금주를 모두 입력해주세요.');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/bankInfo/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const message = await resolveErrorMessage(response, '은행 정보 등록을 실패했습니다.');
        toast.error(message);
        return;
      }

      toast.success('은행 정보를 등록했습니다.');
      setForm({ ...emptyForm });
      await fetchBankInfos();
    } catch (error) {
      toast.error('은행 정보 등록을 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (item: any) => {
    const id = getIdValue(item);
    if (!id) return;
    setEditingId(id);
    setEditForm({
      bankName: item?.bankName || '',
      realAccountNumber: item?.realAccountNumber || item?.accountNumber || '',
      accountHolder: item?.accountHolder || '',
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({ ...emptyForm });
  };

  const openDetail = (item: any) => {
    if (isDefaultOpen && !closeDefaultPanel()) {
      return;
    }
    setSelectedInfo(item);
    setDetailMemo(item?.memo || '');
    setDetailAliases(Array.isArray(item?.aliasAccountNumber) ? [...item.aliasAccountNumber] : []);
    setAliasInput('');
    setIsDetailOpen(true);
  };

  const closeDetail = () => {
    if (isMemoDirty || isAliasDirty) {
      const shouldClose = window.confirm('변경사항이 저장되지 않았습니다. 닫으시겠습니까?');
      if (!shouldClose) {
        return false;
      }
    }
    setIsDetailOpen(false);
    setSelectedInfo(null);
    setDetailMemo('');
    setDetailAliases([]);
    setAliasInput('');
    return true;
  };

  const openDefaultPanel = (item: any) => {
    if (isDetailOpen && !closeDetail()) {
      return;
    }
    setSelectedDefaultInfo(item);
    setSelectedDefaultValue(item?.defaultAccountNumber || '');
    setIsDefaultOpen(true);
  };

  const closeDefaultPanel = () => {
    if (isDefaultDirty) {
      const shouldClose = window.confirm('변경사항이 저장되지 않았습니다. 닫으시겠습니까?');
      if (!shouldClose) {
        return false;
      }
    }
    setIsDefaultOpen(false);
    setSelectedDefaultInfo(null);
    setSelectedDefaultValue('');
    return true;
  };

  useEffect(() => {
    if (!isDetailOpen) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeDetail();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isDetailOpen, isMemoDirty, isAliasDirty, isDefaultOpen, isDefaultDirty]);

  useEffect(() => {
    if (!isDefaultOpen) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeDefaultPanel();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isDefaultOpen, isDefaultDirty]);

  const handleCopyAccountNumber = async () => {
    if (!selectedInfo) return;
    const value = selectedInfo?.realAccountNumber || selectedInfo?.accountNumber || '';
    if (!value) {
      toast.error('복사할 실계좌번호가 없습니다.');
      return;
    }
    try {
      await navigator.clipboard.writeText(String(value));
      toast.success('실계좌번호를 복사했습니다.');
    } catch (error) {
      toast.error('복사에 실패했습니다.');
    }
  };

  const handleCopyDefaultAccount = async (value: string) => {
    const target = String(value || '').trim();
    if (!target) {
      toast.error('복사할 사용중인 계좌번호가 없습니다.');
      return;
    }
    try {
      await navigator.clipboard.writeText(target);
      toast.success('사용중인 계좌번호를 복사했습니다.');
    } catch (error) {
      toast.error('복사에 실패했습니다.');
    }
  };

  const handleCopyValue = async (value: string, label: string) => {
    const target = String(value || '').trim();
    if (!target) {
      toast.error(`복사할 ${label}가 없습니다.`);
      return;
    }
    try {
      await navigator.clipboard.writeText(target);
      toast.success(`${label}를 복사했습니다.`);
    } catch (error) {
      toast.error('복사에 실패했습니다.');
    }
  };

  const handleSaveMemo = async () => {
    if (!selectedInfo || savingMemo) return;
    const id = getIdValue(selectedInfo);
    if (!id) {
      toast.error('유효하지 않은 항목입니다.');
      return;
    }
    setSavingMemo(true);
    try {
      const response = await fetch('/api/bankInfo/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id,
          bankName: selectedInfo?.bankName || '',
          realAccountNumber: selectedInfo?.realAccountNumber || selectedInfo?.accountNumber || '',
          accountHolder: selectedInfo?.accountHolder || '',
          memo: detailMemo,
        }),
      });

      if (!response.ok) {
        const message = await resolveErrorMessage(response, '메모 저장에 실패했습니다.');
        toast.error(message);
        return;
      }

      toast.success('메모를 저장했습니다.');
      setSelectedInfo((prev: any) => ({
        ...prev,
        memo: detailMemo,
        updatedAt: new Date(),
      }));
      await fetchBankInfos();
    } catch (error) {
      toast.error('메모 저장에 실패했습니다.');
    } finally {
      setSavingMemo(false);
    }
  };

  const handleAddAlias = () => {
    const value = sanitizeDigits(String(aliasInput || '').trim());
    if (!value) {
      toast.error('추가할 별칭 계좌번호를 입력해주세요.');
      return;
    }
    const normalized = normalizeAliasList([...detailAliases, value]);
    if (normalized.length === detailAliases.length) {
      toast.error('이미 등록된 별칭 계좌번호입니다.');
      return;
    }
    setDetailAliases(normalized);
    setAliasInput('');
  };

  const handleRemoveAlias = (value: string) => {
    setDetailAliases((prev) => prev.filter((item) => item !== value));
  };

  const handleSaveAliases = async () => {
    if (!selectedInfo || savingAliases) return;
    const id = getIdValue(selectedInfo);
    if (!id) {
      toast.error('유효하지 않은 항목입니다.');
      return;
    }
    setSavingAliases(true);
    try {
      const response = await fetch('/api/bankInfo/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id,
          bankName: selectedInfo?.bankName || '',
          realAccountNumber: selectedInfo?.realAccountNumber || selectedInfo?.accountNumber || '',
          accountHolder: selectedInfo?.accountHolder || '',
          aliasAccountNumber: detailAliases,
        }),
      });

      if (!response.ok) {
        const message = await resolveErrorMessage(response, '별칭 계좌번호 저장에 실패했습니다.');
        toast.error(message);
        return;
      }

      toast.success('별칭 계좌번호를 저장했습니다.');
      setSelectedInfo((prev: any) => ({
        ...prev,
        aliasAccountNumber: detailAliases,
        updatedAt: new Date(),
      }));
      await fetchBankInfos();
    } catch (error) {
      toast.error('별칭 계좌번호 저장에 실패했습니다.');
    } finally {
      setSavingAliases(false);
    }
  };

  const handleSaveDefaultAccount = async () => {
    if (!selectedDefaultInfo || savingDefault) return;
    const id = getIdValue(selectedDefaultInfo);
    if (!id) {
      toast.error('유효하지 않은 항목입니다.');
      return;
    }
    if (!selectedDefaultValue) {
      toast.error('사용중인 계좌번호를 선택해주세요.');
      return;
    }
    setSavingDefault(true);
    try {
      const response = await fetch('/api/bankInfo/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id,
          bankName: selectedDefaultInfo?.bankName || '',
          realAccountNumber: selectedDefaultInfo?.realAccountNumber || selectedDefaultInfo?.accountNumber || '',
          accountHolder: selectedDefaultInfo?.accountHolder || '',
          defaultAccountNumber: selectedDefaultValue,
        }),
      });

      if (!response.ok) {
        const message = await resolveErrorMessage(response, '사용중인 계좌번호 저장에 실패했습니다.');
        toast.error(message);
        return;
      }

      toast.success('사용중인 계좌번호를 저장했습니다.');
      setSelectedDefaultInfo((prev: any) => ({
        ...prev,
        defaultAccountNumber: selectedDefaultValue,
        updatedAt: new Date(),
      }));
      await fetchBankInfos();
    } catch (error) {
      toast.error('사용중인 계좌번호 저장에 실패했습니다.');
    } finally {
      setSavingDefault(false);
    }
  };

  const handleCopyAlias = async (value: string) => {
    const target = String(value || '').trim();
    if (!target) {
      toast.error('복사할 별칭 계좌번호가 없습니다.');
      return;
    }
    try {
      await navigator.clipboard.writeText(target);
      toast.success('별칭 계좌번호를 복사했습니다.');
    } catch (error) {
      toast.error('복사에 실패했습니다.');
    }
  };

  const handleUpdate = async (id: string) => {
    if (saving) return;
    const payload = {
      bankName: editForm.bankName.trim(),
      realAccountNumber: editForm.realAccountNumber.trim(),
      accountHolder: editForm.accountHolder.trim(),
    };

    if (!payload.bankName || !payload.realAccountNumber || !payload.accountHolder) {
      toast.error('은행명, 실계좌번호, 예금주를 모두 입력해주세요.');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/bankInfo/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id,
          ...payload,
        }),
      });

      if (!response.ok) {
        const message = await resolveErrorMessage(response, '은행 정보 수정에 실패했습니다.');
        toast.error(message);
        return;
      }

      toast.success('은행 정보를 수정했습니다.');
      setEditingId(null);
      setEditForm({ ...emptyForm });
      await fetchBankInfos();
    } catch (error) {
      toast.error('은행 정보 수정에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!id || deletingId) return;
    if (!window.confirm('정말로 삭제하시겠습니까?')) {
      return;
    }
    setDeletingId(id);
    try {
      const response = await fetch('/api/bankInfo/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id }),
      });

      if (!response.ok) {
        const message = await resolveErrorMessage(response, '은행 정보 삭제에 실패했습니다.');
        toast.error(message);
        return;
      }

      toast.success('은행 정보를 삭제했습니다.');
      await fetchBankInfos();
    } catch (error) {
      toast.error('은행 정보 삭제에 실패했습니다.');
    } finally {
      setDeletingId(null);
    }
  };

  if (!address) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <h1 className="text-2xl font-bold">로그인</h1>

        <ConnectButton
          client={client}
          wallets={wallets}
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
    <main className="p-4 pb-10 min-h-[100vh] flex items-start justify-center container max-w-screen-2xl mx-auto">
      <div className="py-0 w-full space-y-3">
        <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-2 border-b border-zinc-200 pb-2">
          <div className="flex flex-row items-center gap-2">
            <Image
              src="/icon-bank.png"
              alt="Bank"
              width={35}
              height={35}
              className="w-6 h-6"
            />
            <div className="text-xl font-semibold">은행 계좌 정보</div>
          </div>

          <div className="flex flex-row items-center gap-2">
            {fetching && (
              <Image
                src="/loading.png"
                alt="Loading"
                width={20}
                height={20}
                className="w-5 h-5 animate-spin"
              />
            )}

            <button
              onClick={() => fetchBankInfos()}
              className={`text-sm px-3 py-2 rounded border border-zinc-300 text-zinc-700 hover:bg-zinc-50 ${fetching ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={fetching}
            >
              새로고침
            </button>
          </div>
        </div>

        <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-3 bg-white border border-zinc-200 rounded-md px-4 py-3">
          <div className="flex flex-row items-center gap-3">
            <div className="text-sm text-zinc-500">검색결과</div>
            <div className="text-lg font-semibold text-zinc-900">
              {totalCount.toLocaleString('ko-KR')}건
            </div>
          </div>
          <div className="text-sm text-zinc-500">
            기준: 검색 조건 적용 결과
          </div>
        </div>

        <div className="w-full flex flex-col lg:flex-row lg:items-end gap-3 bg-white border border-zinc-200 rounded-md p-4">
          <div className="flex flex-col gap-1">
            <span className="text-sm text-gray-500">검색어</span>
            <div className="relative w-72">
              <input
                type="text"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder="은행명 / 실계좌번호 / 별칭 / 예금주"
                className="w-full p-2 pr-8 border border-zinc-300 rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-400 focus:border-zinc-400"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    fetchBankInfos(searchKeyword);
                  }
                }}
              />
              {searchKeyword && (
                <button
                  type="button"
                  onClick={() => setSearchKeyword('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full border border-zinc-200 bg-zinc-50 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 flex items-center justify-center text-sm leading-none"
                  aria-label="검색어 지우기"
                >
                  <svg viewBox="0 0 24 24" className="h-3 w-3" aria-hidden="true">
                    <path
                      d="M6 6l12 12M18 6L6 18"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-row items-center gap-2">
            <button
              onClick={() => fetchBankInfos(searchKeyword)}
              className={`w-28 bg-white text-zinc-700 px-4 py-2 rounded border border-zinc-300 ${fetching ? 'opacity-50 cursor-not-allowed' : 'hover:bg-zinc-50'}`}
              disabled={fetching}
            >
              검색
            </button>

            <button
              onClick={() => {
                setSearchKeyword('');
                fetchBankInfos('');
              }}
              className="w-28 bg-white text-zinc-600 px-4 py-2 rounded border border-zinc-300 hover:bg-zinc-50"
              disabled={fetching}
            >
              초기화
            </button>
          </div>
        </div>

        <div className="w-full bg-white border border-zinc-200 rounded-md px-4 py-4">
          <div className="text-sm text-zinc-500 mb-3">신규 등록</div>
          <div className="flex flex-col lg:flex-row lg:items-end gap-3">
            <div className="flex flex-col gap-1">
              <span className="text-sm text-gray-500">은행명</span>
              <select
                value={form.bankName}
                onChange={(e) => setForm((prev) => ({ ...prev, bankName: e.target.value }))}
                className="w-48 p-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-400 focus:border-zinc-400"
              >
                <option value="">은행 선택</option>
                {bankNameOptions.map((bankName) => (
                  <option key={bankName} value={bankName}>
                    {bankName}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-sm text-gray-500">실계좌번호</span>
              <input
                type="text"
                value={form.realAccountNumber}
                onChange={(e) => setForm((prev) => ({ ...prev, realAccountNumber: e.target.value }))}
                placeholder="예: 9003226783592"
                className="w-64 p-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-400 focus:border-zinc-400"
              />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-sm text-gray-500">예금주</span>
              <input
                type="text"
                value={form.accountHolder}
                onChange={(e) => setForm((prev) => ({ ...prev, accountHolder: e.target.value }))}
                placeholder="예: 홍길동"
                className="w-48 p-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-400 focus:border-zinc-400"
              />
            </div>
            <button
              onClick={handleCreate}
              className={`w-32 bg-zinc-900 text-white px-4 py-2 rounded ${saving ? 'opacity-50 cursor-not-allowed' : 'hover:bg-zinc-800'}`}
              disabled={saving}
            >
              등록
            </button>
          </div>
        </div>

        <div className="w-full overflow-x-auto bg-white border border-zinc-200 rounded-md">
          <table className="min-w-[1200px] w-full table-fixed border-collapse">
            <thead className="bg-zinc-100 text-zinc-700 text-sm font-medium border-b border-zinc-200">
              <tr>
                <th className="px-3 py-3 text-left w-12">No</th>
                <th className="px-3 py-3 text-left w-32">실계좌번호</th>
                <th className="px-3 py-3 text-left w-28">예금주</th>
                <th className="px-3 py-3 text-left w-28">은행명</th>
                <th className="px-3 py-3 text-left w-48">사용중인 계좌번호</th>
                <th className="px-3 py-3 text-left w-52">별칭</th>
                <th className="px-3 py-3 text-left w-36">생성일</th>
                <th className="px-3 py-3 text-left w-36">수정일</th>
                <th className="px-3 py-3 text-center w-28">관리</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {bankInfos.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                    등록된 은행 정보가 없습니다.
                  </td>
                </tr>
              )}

              {bankInfos.map((info, index) => {
                const id = getIdValue(info);
                const isEditing = editingId === id;
                const rowKey = id || `${index}`;

                return (
                  <tr key={rowKey} className="group border-b border-gray-200 hover:bg-gray-50 align-top">
                    <td className="px-3 py-3 text-left text-gray-500 align-top">
                      {index + 1}
                    </td>
                    <td className="px-3 py-3 align-top">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editForm.realAccountNumber}
                          onChange={(e) => setEditForm((prev) => ({ ...prev, realAccountNumber: e.target.value }))}
                          className="w-56 p-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-400 focus:border-zinc-400"
                        />
                      ) : (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => openDetail(info)}
                            className="text-left text-zinc-900 hover:underline underline-offset-4"
                          >
                            {info?.realAccountNumber || info?.accountNumber || '-'}
                          </button>
                          {(info?.realAccountNumber || info?.accountNumber) && (
                            <button
                              type="button"
                              onClick={() =>
                                handleCopyValue(
                                  info?.realAccountNumber || info?.accountNumber,
                                  '실계좌번호'
                                )
                              }
                              className="p-1 rounded border border-zinc-200 text-zinc-600 hover:bg-zinc-50 opacity-0 group-hover:opacity-100 transition"
                              aria-label="실계좌번호 복사"
                            >
                              <CopyIcon className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-3 align-top">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editForm.accountHolder}
                          onChange={(e) => setEditForm((prev) => ({ ...prev, accountHolder: e.target.value }))}
                          className="w-40 p-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-400 focus:border-zinc-400"
                        />
                      ) : (
                        info?.accountHolder || '-'
                      )}
                    </td>
                    <td className="px-3 py-3 align-top">
                      {isEditing ? (
                        <select
                          value={editForm.bankName}
                          onChange={(e) => setEditForm((prev) => ({ ...prev, bankName: e.target.value }))}
                          className="w-44 p-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-400 focus:border-zinc-400"
                        >
                          <option value="">은행 선택</option>
                          {!bankNameOptions.includes(editForm.bankName) && editForm.bankName ? (
                            <option value={editForm.bankName}>{editForm.bankName}</option>
                          ) : null}
                          {bankNameOptions.map((bankName) => (
                            <option key={bankName} value={bankName}>
                              {bankName}
                            </option>
                          ))}
                        </select>
                      ) : (
                        info?.bankName || '-'
                      )}
                    </td>
                    <td className="px-3 py-3 align-top">
                      {isEditing ? (
                        <span>{info?.defaultAccountNumber || ''}</span>
                      ) : (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => openDefaultPanel(info)}
                            className="text-left text-zinc-900 hover:underline underline-offset-4"
                          >
                            {info?.defaultAccountNumber ? (
                              info.defaultAccountNumber
                            ) : (
                              <span className="text-xs text-zinc-400">설정</span>
                            )}
                          </button>
                          {info?.defaultAccountNumber && (
                            <button
                              type="button"
                              onClick={() => handleCopyDefaultAccount(info.defaultAccountNumber)}
                              className="p-1 rounded border border-zinc-200 text-zinc-600 hover:bg-zinc-50 opacity-0 group-hover:opacity-100 transition"
                              aria-label="사용중인 계좌번호 복사"
                            >
                              <CopyIcon className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-3 align-top">
                      <div className="flex flex-col gap-1">
                        {Array.isArray(info?.aliasAccountNumber) && info.aliasAccountNumber.length > 0 ? (
                          info.aliasAccountNumber.map((alias: string) => (
                            <span
                              key={alias}
                              className="group/alias text-xs px-2 py-1 rounded border border-zinc-200 text-zinc-600 bg-white inline-flex items-center gap-1"
                            >
                              <span>{alias}</span>
                              <button
                                type="button"
                                onClick={() => handleCopyValue(alias, '별칭 계좌번호')}
                                className="p-0.5 rounded border border-zinc-200 text-zinc-500 hover:bg-zinc-50 opacity-0 group-hover:opacity-100 group-hover/alias:opacity-100 transition"
                                aria-label="별칭 계좌번호 복사"
                              >
                                <CopyIcon className="h-3 w-3" />
                              </button>
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-zinc-400">-</span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-3 align-top">{formatDateTime(info?.createdAt)}</td>
                    <td className="px-3 py-3 align-top">{formatDateTime(info?.updatedAt)}</td>
                    <td className="px-3 py-3 text-center align-top">
                      {isEditing ? (
                        <div className="flex flex-row items-center justify-center gap-2">
                          <button
                            onClick={() => handleUpdate(id)}
                            className={`px-3 py-1 rounded text-white bg-zinc-900 hover:bg-zinc-800 ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
                            disabled={saving}
                          >
                            저장
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="px-3 py-1 rounded border border-zinc-300 text-zinc-600 hover:bg-zinc-50"
                            disabled={saving}
                          >
                            취소
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-row items-center justify-center gap-2">
                          <button
                            onClick={() => startEdit(info)}
                            className="px-3 py-1 rounded border border-zinc-300 text-zinc-700 hover:bg-zinc-50"
                          >
                            수정
                          </button>
                          <button
                            onClick={() => handleDelete(id)}
                            className={`px-3 py-1 rounded border border-red-200 text-red-600 hover:bg-red-50 ${deletingId === id ? 'opacity-50 cursor-not-allowed' : ''}`}
                            disabled={deletingId === id}
                          >
                            삭제
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className={`fixed inset-0 z-50 ${isDefaultOpen ? '' : 'pointer-events-none'}`}>
        <div
          className={`absolute inset-0 bg-black/20 transition-opacity duration-200 ${isDefaultOpen ? 'opacity-100' : 'opacity-0'}`}
          onClick={closeDefaultPanel}
        />
        <div
          className={`absolute right-0 top-0 h-full w-full sm:w-[360px] bg-white border-l border-zinc-200 transform transition-transform duration-200 ${isDefaultOpen ? 'translate-x-0' : 'translate-x-full'}`}
        >
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200">
              <div>
                <div className="text-xs text-zinc-500">사용중인 계좌번호</div>
                <div className="text-lg font-semibold text-zinc-900">계좌 선택</div>
              </div>
              <div className="flex items-center gap-2">
                {isDefaultDirty && (
                  <span className="text-xs text-amber-600">변경됨</span>
                )}
                <button
                  type="button"
                  onClick={closeDefaultPanel}
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

            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 text-sm text-zinc-700">
              <div className="border border-zinc-200 rounded-md p-3">
                <div className="text-xs text-zinc-500 mb-2">선택 가능한 계좌</div>
                <div className="space-y-4">
                  <div>
                    <div className="text-xs text-zinc-400 mb-2">실계좌번호</div>
                    {defaultRealValue ? (
                      <label className="flex items-center gap-2 text-sm text-zinc-800">
                        <input
                          type="radio"
                          name="defaultAccountNumber"
                          checked={selectedDefaultValue === defaultRealValue}
                          onChange={() => setSelectedDefaultValue(defaultRealValue)}
                          className="h-4 w-4"
                        />
                        <span>{defaultRealValue}</span>
                      </label>
                    ) : (
                      <div className="text-xs text-zinc-400">실계좌번호가 없습니다.</div>
                    )}
                  </div>

                  <div>
                    <div className="text-xs text-zinc-400 mb-2">별칭 계좌번호</div>
                    {defaultAliasValues.length === 0 ? (
                      <div className="text-xs text-zinc-400">등록된 별칭이 없습니다.</div>
                    ) : (
                      <div className="space-y-2">
                        {defaultAliasValues.map((alias) => (
                          <label key={alias} className="flex items-center gap-2 text-sm text-zinc-800">
                            <input
                              type="radio"
                              name="defaultAccountNumber"
                              checked={selectedDefaultValue === alias}
                              onChange={() => setSelectedDefaultValue(alias)}
                              className="h-4 w-4"
                            />
                            <span>{alias}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-zinc-200 px-4 py-3">
              <button
                type="button"
                onClick={handleSaveDefaultAccount}
                className={`w-full px-3 py-2 rounded text-white bg-zinc-900 hover:bg-zinc-800 ${savingDefault || !isDefaultDirty || !selectedDefaultValue ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={savingDefault || !isDefaultDirty || !selectedDefaultValue}
              >
                저장하기
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className={`fixed inset-0 z-50 ${isDetailOpen ? '' : 'pointer-events-none'}`}>
        <div
          className={`absolute inset-0 bg-black/20 transition-opacity duration-200 ${isDetailOpen ? 'opacity-100' : 'opacity-0'}`}
          onClick={closeDetail}
        />
        <div
          className={`absolute right-0 top-0 h-full w-full sm:w-[360px] bg-white border-l border-zinc-200 transform transition-transform duration-200 ${isDetailOpen ? 'translate-x-0' : 'translate-x-full'}`}
        >
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200">
              <div>
                <div className="text-xs text-zinc-500">상세 정보</div>
                <div className="text-lg font-semibold text-zinc-900">실계좌번호</div>
              </div>
              <button
                type="button"
                onClick={closeDetail}
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

            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 text-sm text-zinc-700">
              <div className="border border-zinc-200 rounded-md p-3">
                <div className="text-xs text-zinc-500 mb-2">계좌 정보</div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500">은행명</span>
                    <span className="font-medium text-zinc-900">{selectedInfo?.bankName || '-'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500">실계좌번호</span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-zinc-900">
                        {selectedInfo?.realAccountNumber || selectedInfo?.accountNumber || '-'}
                      </span>
                      <button
                        type="button"
                        onClick={handleCopyAccountNumber}
                        className="p-1 rounded border border-zinc-200 text-zinc-600 hover:bg-zinc-50"
                        aria-label="실계좌번호 복사"
                      >
                        <CopyIcon className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500">예금주</span>
                    <span className="font-medium text-zinc-900">{selectedInfo?.accountHolder || '-'}</span>
                  </div>
                </div>
              </div>

              <div className="border border-zinc-200 rounded-md p-3">
                <div className="text-xs text-zinc-500 mb-2">메타 정보</div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500">생성일</span>
                    <span className="font-medium text-zinc-900">{formatDateTime(selectedInfo?.createdAt)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500">수정일</span>
                    <span className="font-medium text-zinc-900">{formatDateTime(selectedInfo?.updatedAt)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500">ID</span>
                    <span className="font-medium text-zinc-900 truncate max-w-[200px]">
                      {getIdValue(selectedInfo) || '-'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="border border-zinc-200 rounded-md p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs text-zinc-500">별칭 계좌번호</div>
                  {isAliasDirty && (
                    <span className="text-xs text-amber-600">변경됨</span>
                  )}
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <input
                    type="text"
                    value={aliasInput}
                    onChange={(e) => setAliasInput(sanitizeDigits(e.target.value))}
                    placeholder="별칭 계좌번호 추가"
                    className="flex-1 p-2 border border-zinc-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-zinc-400 focus:border-zinc-400"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleAddAlias();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAddAlias}
                    className="px-3 py-2 rounded border border-zinc-300 text-zinc-700 hover:bg-zinc-50 text-xs"
                  >
                    추가
                  </button>
                </div>
                <div className="space-y-2">
                  {detailAliases.length === 0 ? (
                    <div className="text-xs text-zinc-400">등록된 별칭이 없습니다.</div>
                  ) : (
                    detailAliases.map((alias) => (
                      <div key={alias} className="flex items-center justify-between border border-zinc-200 rounded-md px-2 py-1.5">
                        <span className="text-sm text-zinc-700">{alias}</span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleCopyAlias(alias)}
                            className="p-1 rounded border border-zinc-200 text-zinc-600 hover:bg-zinc-50"
                            aria-label="별칭 계좌번호 복사"
                          >
                            <CopyIcon className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveAlias(alias)}
                            className="text-xs text-red-600 hover:underline underline-offset-4"
                          >
                            삭제
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <div className="mt-3 flex justify-end">
                  <button
                    type="button"
                    onClick={handleSaveAliases}
                    className={`px-3 py-1.5 rounded text-white bg-zinc-900 hover:bg-zinc-800 ${savingAliases || !isAliasDirty ? 'opacity-50 cursor-not-allowed' : ''}`}
                    disabled={savingAliases || !isAliasDirty}
                  >
                    저장
                  </button>
                </div>
              </div>

              <div className="border border-zinc-200 rounded-md p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs text-zinc-500">메모</div>
                  {isMemoDirty && (
                    <span className="text-xs text-amber-600">변경됨</span>
                  )}
                </div>
                <textarea
                  value={detailMemo}
                  onChange={(e) => setDetailMemo(e.target.value)}
                  rows={5}
                  placeholder="메모를 입력하세요."
                  className="w-full resize-none border border-zinc-300 rounded-md p-2 text-sm text-zinc-700 focus:outline-none focus:ring-1 focus:ring-zinc-400 focus:border-zinc-400"
                />
                <div className="mt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={handleSaveMemo}
                    className={`px-3 py-1.5 rounded text-white bg-zinc-900 hover:bg-zinc-800 ${savingMemo || !isMemoDirty ? 'opacity-50 cursor-not-allowed' : ''}`}
                    disabled={savingMemo || !isMemoDirty}
                  >
                    저장
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
