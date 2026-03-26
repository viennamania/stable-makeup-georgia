'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { ConnectButton, useActiveAccount } from 'thirdweb/react';
import { inAppWallet } from 'thirdweb/wallets';

import { client } from '../../../../../client';
import { postAdminSignedJson } from '@/lib/client/admin-signed-action';

const wallets = [
  inAppWallet({
    auth: {
      options: ['email', 'google'],
    },
  }),
];

const STORE_SETTINGS_MUTATION_SIGNING_PREFIX = 'stable-georgia:store-settings-mutation:v1';
const STORE_MEMO_READ_SIGNING_PREFIX = 'stable-georgia:store-memo-read:v1';
const MAX_MEMO_LENGTH = 5000;

const shellCardClass =
  'rounded-[28px] border border-slate-200/80 bg-white/90 shadow-[0_24px_60px_rgba(15,23,42,0.08)] backdrop-blur';

const inputClass =
  'w-full rounded-[24px] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100 disabled:cursor-not-allowed disabled:bg-slate-50';

const primaryButtonClass =
  'inline-flex items-center justify-center rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(15,23,42,0.16)] transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50';

const secondaryButtonClass =
  'inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50';

const formatDateTime = (value?: string | Date | null) => {
  if (!value) {
    return '기록 없음';
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '기록 없음';
  }

  return new Intl.DateTimeFormat('ko-KR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
};

const shortenWallet = (value?: string | null) => {
  const walletAddress = String(value || '').trim();
  if (!walletAddress) {
    return '미연결';
  }

  if (walletAddress.length <= 14) {
    return walletAddress;
  }

  return `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`;
};

export default function StoreMemoPage({ params }: { params: { lang: string; storecode: string } }) {
  const router = useRouter();
  const smartAccount = useActiveAccount();
  const address = smartAccount?.address || '';

  const [store, setStore] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [loadingStore, setLoadingStore] = useState(true);
  const [loadingUser, setLoadingUser] = useState(false);
  const [loadingMemo, setLoadingMemo] = useState(false);
  const [savingMemo, setSavingMemo] = useState(false);
  const [storeMemo, setStoreMemo] = useState('');
  const [savedStoreMemo, setSavedStoreMemo] = useState('');
  const [memoUpdatedAt, setMemoUpdatedAt] = useState<string | null>(null);

  const memoLength = storeMemo.length;
  const hasUnsavedChanges = storeMemo.trim() !== savedStoreMemo.trim();

  const memoUsageRatio = useMemo(() => {
    return Math.min(100, Math.round((memoLength / MAX_MEMO_LENGTH) * 100));
  }, [memoLength]);

  const fetchStore = useCallback(async () => {
    if (!params.storecode) {
      setStore(null);
      return;
    }

    setLoadingStore(true);

    try {
      const response = await fetch('/api/store/getOneStore', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          storecode: params.storecode,
        }),
      });

      if (!response.ok) {
        setStore(null);
        return;
      }

      const data = await response.json();
      setStore(data?.result || null);
    } finally {
      setLoadingStore(false);
    }
  }, [params.storecode]);

  const fetchCurrentUser = useCallback(async () => {
    if (!address) {
      setUser(null);
      return;
    }

    setLoadingUser(true);

    try {
      const response = await fetch('/api/user/getUser', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          storecode: 'admin',
          walletAddress: address,
        }),
      });

      if (!response.ok) {
        setUser(null);
        return;
      }

      const data = await response.json();
      setUser(data?.result || null);
    } finally {
      setLoadingUser(false);
    }
  }, [address]);

  const fetchStoreMemo = useCallback(async (options?: { silent?: boolean }) => {
    if (!params.storecode || !smartAccount || !address) {
      setStoreMemo('');
      setSavedStoreMemo('');
      setMemoUpdatedAt(null);
      return;
    }

    if (!options?.silent) {
      setLoadingMemo(true);
    }

    try {
      const response = await postAdminSignedJson({
        account: smartAccount,
        route: '/api/store/getStoreMemoSigned',
        signingPrefix: STORE_MEMO_READ_SIGNING_PREFIX,
        requesterWalletAddress: address,
        body: {
          storecode: params.storecode,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        if (!options?.silent) {
          toast.error(data?.error || '가맹점 메모 조회에 실패했습니다.');
        }
        setStoreMemo('');
        setSavedStoreMemo('');
        setMemoUpdatedAt(null);
        return;
      }

      const nextMemo = String(data?.result?.storeMemo || '');
      setStoreMemo(nextMemo);
      setSavedStoreMemo(nextMemo);
      setMemoUpdatedAt(data?.result?.storeMemoUpdatedAt || null);
    } finally {
      if (!options?.silent) {
        setLoadingMemo(false);
      }
    }
  }, [address, params.storecode, smartAccount]);

  useEffect(() => {
    void fetchStore();
  }, [fetchStore]);

  useEffect(() => {
    void fetchCurrentUser();
  }, [fetchCurrentUser]);

  useEffect(() => {
    void fetchStoreMemo({ silent: true });
  }, [fetchStoreMemo]);

  const writeStoreMemo = async () => {
    const trimmedMemo = storeMemo.trim();

    if (!smartAccount || !address) {
      toast.error('관리자 지갑을 먼저 연결하세요.');
      return;
    }

    if (!trimmedMemo) {
      toast.error('메모를 입력해주세요.');
      return;
    }

    if (trimmedMemo.length > MAX_MEMO_LENGTH) {
      toast.error(`메모는 ${MAX_MEMO_LENGTH.toLocaleString()}자 이하로 입력하세요.`);
      return;
    }

    if (!hasUnsavedChanges) {
      toast.error('저장할 변경사항이 없습니다.');
      return;
    }

    setSavingMemo(true);

    try {
      const response = await postAdminSignedJson({
        account: smartAccount,
        route: '/api/store/setStoreMemo',
        signingPrefix: STORE_SETTINGS_MUTATION_SIGNING_PREFIX,
        requesterWalletAddress: address,
        body: {
          storecode: params.storecode,
          walletAddress: address,
          storeMemo: trimmedMemo,
        },
      });

      const data = await response.json();

      if (!response.ok || !data?.result) {
        toast.error(data?.error || '메모 저장에 실패했습니다.');
        return;
      }

      toast.success('메모가 저장되었습니다.');
      await fetchStoreMemo({ silent: true });
    } finally {
      setSavingMemo(false);
    }
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(191,219,254,0.42),_transparent_38%),linear-gradient(180deg,_#f8fbff_0%,_#eef4ff_30%,_#f8fafc_100%)] px-4 py-5">
      <div className="mx-auto max-w-screen-lg pb-36">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            onClick={() => router.back()}
            className={secondaryButtonClass}
          >
            <Image
              src="/icon-back.png"
              alt="Back"
              width={18}
              height={18}
              className="mr-2 h-4 w-4"
            />
            돌아가기
          </button>

          {address ? (
            <div className="flex items-center gap-3 self-end rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
              <Image
                src={user?.avatar || '/icon-user.png'}
                alt="User Avatar"
                width={32}
                height={32}
                className="h-8 w-8 rounded-full border border-slate-200"
              />
              <div className="flex flex-col leading-tight">
                <span className="text-sm font-semibold text-slate-800">
                  {user?.nickname || '관리자'}
                </span>
                <span className="text-xs text-slate-500">
                  {shortenWallet(address)}
                </span>
              </div>
              {loadingUser ? (
                <Image
                  src="/loading.png"
                  alt="Loading"
                  width={16}
                  height={16}
                  className="h-4 w-4 animate-spin"
                />
              ) : null}
            </div>
          ) : (
            <ConnectButton
              client={client}
              wallets={wallets}
              theme="light"
              connectButton={{
                label: '관리자 지갑 연결',
              }}
              connectModal={{
                size: 'wide',
                titleIcon: 'https://www.stable.makeup/logo.png',
                showThirdwebBranding: false,
              }}
              locale="ko_KR"
            />
          )}
        </div>

        <div className="mt-6 overflow-hidden rounded-[32px] border border-slate-200/80 bg-[linear-gradient(135deg,_rgba(15,23,42,0.98)_0%,_rgba(30,41,59,0.96)_52%,_rgba(14,116,144,0.88)_100%)] p-6 text-white shadow-[0_24px_70px_rgba(15,23,42,0.24)]">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-4">
                <Image
                  src={store?.storeLogo || '/icon-store.png'}
                  alt="Store Logo"
                  width={72}
                  height={72}
                  className="h-16 w-16 rounded-[22px] border border-white/20 bg-white/10 object-cover shadow-lg"
                />
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-100/80">
                    Store Memo
                  </span>
                  <div className="text-2xl font-semibold tracking-tight sm:text-3xl">
                    {loadingStore ? '가맹점 로딩 중...' : `${store?.storeName || '가맹점'} 메모`}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-sm text-slate-200">
                    <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 font-medium">
                      {params.storecode}
                    </span>
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-slate-100/80">
                      signed read / signed write 보호
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-white/8 px-4 py-3 backdrop-blur-sm">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-300">
                    메모 길이
                  </div>
                  <div className="mt-2 text-2xl font-semibold text-white">
                    {memoLength.toLocaleString()}
                    <span className="ml-1 text-sm font-medium text-slate-300">자</span>
                  </div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/8 px-4 py-3 backdrop-blur-sm">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-300">
                    저장 상태
                  </div>
                  <div className="mt-2 text-base font-semibold text-white">
                    {hasUnsavedChanges ? '미저장 변경 있음' : '저장됨'}
                  </div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/8 px-4 py-3 backdrop-blur-sm">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-300">
                    마지막 반영
                  </div>
                  <div className="mt-2 text-sm font-semibold text-white">
                    {formatDateTime(memoUpdatedAt)}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/8 px-4 py-3 text-sm text-slate-200 backdrop-blur-sm lg:max-w-xs">
              운영 메모는 가맹점별 내부 기록입니다.
              메모 조회와 저장 모두 관리자 지갑 서명을 거치도록 분리했습니다.
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">
          <section className={`${shellCardClass} p-6`}>
            <div className="flex flex-col gap-3 border-b border-slate-200/80 pb-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-sky-200 bg-gradient-to-br from-sky-50 via-white to-blue-100 shadow-sm">
                  <Image
                    src="/icon-memo.png"
                    alt="Memo"
                    width={22}
                    height={22}
                    className="h-5 w-5"
                  />
                </div>
                <div className="flex flex-col">
                  <span className="text-lg font-semibold tracking-tight text-slate-950">
                    운영 메모 작성
                  </span>
                  <span className="text-sm text-slate-500">
                    가맹점 담당자 전달사항, 리스크 메모, 결제 운영 메모를 남깁니다.
                  </span>
                </div>
              </div>

              <button
                onClick={() => void fetchStoreMemo()}
                disabled={!address || !smartAccount || loadingMemo}
                className={secondaryButtonClass}
              >
                {loadingMemo ? '불러오는 중...' : '메모 새로고침'}
              </button>
            </div>

            {!address || !smartAccount ? (
              <div className="mt-5 rounded-[24px] border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
                관리자 지갑 연결 후 메모를 조회하고 저장할 수 있습니다.
              </div>
            ) : (
              <div className="mt-5 flex flex-col gap-4">
                <div className="rounded-[26px] border border-slate-200 bg-slate-50/80 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                        Security
                      </div>
                      <div className="mt-1 text-sm text-slate-600">
                        읽기: 관리자 서명 검증, 저장: 관리자 서명 + 입력 길이 검증
                      </div>
                    </div>
                    <div className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                      {memoLength.toLocaleString()} / {MAX_MEMO_LENGTH.toLocaleString()}
                    </div>
                  </div>

                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-sky-500 via-cyan-500 to-emerald-500 transition-all"
                      style={{ width: `${memoUsageRatio}%` }}
                    />
                  </div>
                </div>

                <textarea
                  className={`${inputClass} min-h-[320px] resize-y leading-7`}
                  placeholder="가맹점 운영 메모를 입력하세요. 예: 정산 주의사항, 운영 메모, 특이 고객 응대 이력"
                  value={storeMemo}
                  onChange={(e) => setStoreMemo(e.target.value)}
                  maxLength={MAX_MEMO_LENGTH}
                  disabled={loadingMemo || savingMemo}
                />

                <div className="flex flex-col gap-3 rounded-[24px] border border-slate-200 bg-slate-50/80 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-semibold text-slate-900">
                      {hasUnsavedChanges ? '저장되지 않은 변경사항이 있습니다.' : '현재 메모가 서버와 동기화되어 있습니다.'}
                    </span>
                    <span className="text-xs text-slate-500">
                      마지막 반영 시각: {formatDateTime(memoUpdatedAt)}
                    </span>
                  </div>

                  <button
                    disabled={savingMemo || loadingMemo || !hasUnsavedChanges}
                    className={primaryButtonClass}
                    onClick={() => void writeStoreMemo()}
                  >
                    {savingMemo ? '메모 저장 중...' : '메모 저장하기'}
                  </button>
                </div>
              </div>
            )}
          </section>

          <aside className="flex flex-col gap-5">
            <div className={`${shellCardClass} p-5`}>
              <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                Store Summary
              </div>
              <div className="mt-3 flex items-center gap-3">
                <Image
                  src={store?.storeLogo || '/icon-store.png'}
                  alt="Store"
                  width={48}
                  height={48}
                  className="h-12 w-12 rounded-2xl border border-slate-200 object-cover"
                />
                <div className="flex flex-col">
                  <span className="text-lg font-semibold tracking-tight text-slate-950">
                    {store?.storeName || '가맹점'}
                  </span>
                  <span className="text-sm text-slate-500">
                    {store?.storecode || params.storecode}
                  </span>
                </div>
              </div>

              <div className="mt-4 grid gap-3">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <span className="text-xs text-slate-500">가맹점 설명</span>
                  <div className="mt-1 text-sm font-medium text-slate-800">
                    {store?.storeDescription || '설정된 설명이 없습니다.'}
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <span className="text-xs text-slate-500">관리자 지갑</span>
                  <div className="mt-1 text-sm font-semibold text-slate-800">
                    {shortenWallet(store?.adminWalletAddress)}
                  </div>
                </div>
              </div>
            </div>

            <div className={`${shellCardClass} p-5`}>
              <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                Security Checklist
              </div>
              <div className="mt-4 space-y-3">
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                  <div className="text-sm font-semibold text-emerald-800">Signed Read</div>
                  <div className="mt-1 text-xs leading-6 text-emerald-700">
                    메모 조회는 관리자 지갑 서명 검증 후에만 허용됩니다.
                  </div>
                </div>
                <div className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3">
                  <div className="text-sm font-semibold text-sky-800">Signed Write</div>
                  <div className="mt-1 text-xs leading-6 text-sky-700">
                    저장은 관리자 서명과 메모 길이 검증을 모두 통과해야 반영됩니다.
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <div className="text-sm font-semibold text-slate-800">운영 팁</div>
                  <div className="mt-1 text-xs leading-6 text-slate-600">
                    민감정보 원문보다는 운영 메모, 리스크 태그, 대응 이력 중심으로 기록하는 것이 안전합니다.
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
