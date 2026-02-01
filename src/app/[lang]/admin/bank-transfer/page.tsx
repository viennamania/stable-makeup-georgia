'use client';

import { useEffect, useMemo, useState } from "react";

import Image from "next/image";

import { useRouter } from "next//navigation";
import { useSearchParams } from "next/navigation";

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


const formatNumber = (value: any) => {
  if (value === null || value === undefined || value === '') {
    return '-';
  }
  const num = typeof value === 'number' ? value : Number(value);
  if (Number.isNaN(num)) {
    return String(value);
  }
  return num.toLocaleString('ko-KR');
};

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

const getTodayString = () => {
  const now = new Date();
  const offsetMs = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - offsetMs).toISOString().slice(0, 10);
};


export default function BankTransferPage({ params }: any) {

  const router = useRouter();
  const searchParams = useSearchParams()!;

  const activeAccount = useActiveAccount();
  const address = activeAccount?.address;

  const todayString = getTodayString();

  const limitParam = searchParams.get('limit') || '20';
  const pageParam = searchParams.get('page') || '1';
  const queryParam = searchParams.get('q') || '';
  const matchParam = searchParams.get('match') || '';
  const accountNumberParam = searchParams.get('accountNumber') || '';
  const originalAccountNumberParam = searchParams.get('originalAccountNumber') || '';
  const fromDateParam = searchParams.get('fromDate') || todayString;
  const toDateParam = searchParams.get('toDate') || todayString;

  const [limitValue, setLimitValue] = useState(Number(limitParam) || 20);
  const [pageValue, setPageValue] = useState(Number(pageParam) || 1);
  const [pageInput, setPageInput] = useState(String(Number(pageParam) || 1));

  const [searchKeyword, setSearchKeyword] = useState(queryParam);
  const [searchAccountNumber, setSearchAccountNumber] = useState(accountNumberParam);
  const [searchOriginalAccountNumber, setSearchOriginalAccountNumber] = useState(originalAccountNumberParam);
  const [matchStatus, setMatchStatus] = useState(matchParam);
  const [searchFromDate, setSearchFromDate] = useState(fromDateParam);
  const [searchToDate, setSearchToDate] = useState(toDateParam);

  useEffect(() => {
    setLimitValue(Number(limitParam) || 20);
  }, [limitParam]);

  useEffect(() => {
    setPageValue(Number(pageParam) || 1);
  }, [pageParam]);
  useEffect(() => {
    setPageInput(String(Number(pageParam) || 1));
  }, [pageParam]);

  useEffect(() => {
    setSearchKeyword(queryParam);
  }, [queryParam]);
  useEffect(() => {
    setSearchAccountNumber(accountNumberParam);
  }, [accountNumberParam]);
  useEffect(() => {
    setSearchOriginalAccountNumber(originalAccountNumberParam);
  }, [originalAccountNumberParam]);

  useEffect(() => {
    setMatchStatus(matchParam);
  }, [matchParam]);

  useEffect(() => {
    setSearchFromDate(fromDateParam);
  }, [fromDateParam]);

  useEffect(() => {
    setSearchToDate(toDateParam);
  }, [toDateParam]);


  const [fetchingTransfers, setFetchingTransfers] = useState(false);
  const [bankTransfers, setBankTransfers] = useState([] as any[]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedTradeId, setSelectedTradeId] = useState<string | null>(null);
  const [tradeDetail, setTradeDetail] = useState<any>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detailError, setDetailError] = useState('');

  const openDetail = (tradeId: string) => {
    setSelectedTradeId(tradeId);
    setTradeDetail(null);
    setDetailError('');
    setLoadingDetail(true);
    setIsDetailOpen(true);
  };

  const closeDetail = () => {
    setIsDetailOpen(false);
    setSelectedTradeId(null);
    setTradeDetail(null);
    setDetailError('');
    setLoadingDetail(false);
  };

  const fetchBankTransfers = async () => {
    if (fetchingTransfers) {
      return;
    }
    setFetchingTransfers(true);

    try {
      const response = await fetch('/api/bankTransfer/getAll', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          limit: Number(limitParam) || 20,
          page: Number(pageParam) || 1,
        search: queryParam,
        transactionType: 'deposited',
        matchStatus: matchParam,
        fromDate: fromDateParam,
        toDate: toDateParam,
        accountNumber: accountNumberParam,
        originalAccountNumber: originalAccountNumberParam,
      }),
    });

      if (!response.ok) {
        toast.error('입금내역 조회를 실패했습니다.');
        return;
      }

      const data = await response.json();

      setBankTransfers(data.result?.transfers || []);
      setTotalCount(data.result?.totalCount || 0);
      setTotalAmount(data.result?.totalAmount || 0);
    } catch (error) {
      toast.error('입금내역 조회를 실패했습니다.');
    } finally {
      setFetchingTransfers(false);
    }
  };

  useEffect(() => {
    if (!address) {
      setBankTransfers([]);
      return;
    }
    fetchBankTransfers();
  }, [address, limitParam, pageParam, queryParam, matchParam, fromDateParam, toDateParam, accountNumberParam, originalAccountNumberParam]);

  useEffect(() => {
    if (!isDetailOpen || !selectedTradeId) return;

    const fetchDetail = async () => {
      setLoadingDetail(true);
      setDetailError('');
      try {
        const response = await fetch('/api/order/getOneBuyOrderByTradeId', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ tradeId: selectedTradeId }),
        });

        if (!response.ok) {
          setDetailError('거래 상세를 불러오지 못했습니다.');
          setTradeDetail(null);
          return;
        }

        const data = await response.json();
        setTradeDetail(data.result || null);
      } catch (error) {
        setDetailError('거래 상세를 불러오지 못했습니다.');
        setTradeDetail(null);
      } finally {
        setLoadingDetail(false);
      }
    };

    fetchDetail();
  }, [isDetailOpen, selectedTradeId]);

  useEffect(() => {
    if (!isDetailOpen) return;

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeDetail();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isDetailOpen]);


  const totalPages = useMemo(() => {
    const limit = Number(limitParam) || 20;
    return Math.max(1, Math.ceil(Number(totalCount) / limit));
  }, [totalCount, limitParam]);


  const buildQueryString = (overrides: {
    limit?: string | number;
    page?: string | number;
    q?: string;
    match?: string;
    fromDate?: string;
    toDate?: string;
    accountNumber?: string;
    originalAccountNumber?: string;
  } = {}) => {
    const params = new URLSearchParams();

    const nextLimit = overrides.limit ?? limitParam ?? 20;
    const nextPage = overrides.page ?? pageParam ?? 1;
    const nextQ = overrides.q ?? queryParam;
    const nextMatch = overrides.match ?? matchParam;
    const nextFromDate = overrides.fromDate ?? fromDateParam;
    const nextToDate = overrides.toDate ?? toDateParam;
    const nextAccountNumber = overrides.accountNumber ?? accountNumberParam;
    const nextOriginalAccountNumber = overrides.originalAccountNumber ?? originalAccountNumberParam;

    params.set('limit', String(nextLimit));
    params.set('page', String(nextPage));

    if (nextQ) params.set('q', String(nextQ));
    if (nextMatch) params.set('match', String(nextMatch));
    if (nextFromDate) params.set('fromDate', String(nextFromDate));
    if (nextToDate) params.set('toDate', String(nextToDate));
    if (nextAccountNumber) params.set('accountNumber', String(nextAccountNumber));
    if (nextOriginalAccountNumber) params.set('originalAccountNumber', String(nextOriginalAccountNumber));

    return params.toString();
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
      <div className="py-0 w-full">

        <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-2 bg-black/10 p-2 rounded-lg mb-4">
          <div className="flex flex-row items-center gap-2">
            <Image
              src="/icon-bank.png"
              alt="Bank"
              width={35}
              height={35}
              className="w-6 h-6"
            />
            <div className="text-xl font-semibold">은행 입금내역</div>
            <span className="text-xs bg-green-500 text-white px-2 py-1 rounded-full">최신순</span>
          </div>

          <div className="flex flex-row items-center gap-2">
            {fetchingTransfers && (
              <Image
                src="/loading.png"
                alt="Loading"
                width={20}
                height={20}
                className="w-5 h-5 animate-spin"
              />
            )}

            <button
              onClick={() => fetchBankTransfers()}
              className={`text-sm px-3 py-2 rounded-lg bg-[#3167b4] text-white hover:bg-[#3167b4]/80 ${fetchingTransfers ? 'opacity-60 cursor-not-allowed' : ''}`}
              disabled={fetchingTransfers}
            >
              새로고침
            </button>
          </div>
        </div>

        <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-3 bg-white rounded-xl shadow-md border border-zinc-200 px-4 py-3 mb-4">
          <div className="flex flex-row items-center gap-3">
            <div className="text-sm text-zinc-500">검색결과</div>
            <div className="text-2xl font-semibold text-[#1f2937]">
              {totalCount.toLocaleString('ko-KR')}건
            </div>
            <div className="text-sm text-zinc-400">/</div>
            <div className="text-2xl font-semibold text-[#1f2937]">
              {formatNumber(totalAmount)}원
            </div>
          </div>
          <div className="text-sm text-zinc-500">
            기준: 검색 조건 적용 결과
          </div>
        </div>


        {/* search filters */}
        <div className="w-full flex flex-col lg:flex-row lg:items-end gap-3 bg-white/80 p-4 rounded-lg shadow-md mb-4">
          <div className="flex flex-col gap-1">
            <span className="text-sm text-gray-500">검색어</span>
            <div className="relative w-64">
              <input
                type="text"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder="입금자명"
                className="w-full p-2 pr-8 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3167b4]"
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

          <div className="flex flex-col gap-1">
            <span className="text-sm text-gray-500">계좌번호</span>
            <div className="relative w-48">
              <input
                type="text"
                value={searchAccountNumber}
                onChange={(e) => setSearchAccountNumber(e.target.value)}
                placeholder="계좌번호"
                className="w-full p-2 pr-8 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3167b4]"
              />
              {searchAccountNumber && (
                <button
                  type="button"
                  onClick={() => setSearchAccountNumber('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full border border-zinc-200 bg-zinc-50 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 flex items-center justify-center text-sm leading-none"
                  aria-label="계좌번호 지우기"
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

          <div className="flex flex-col gap-1">
            <span className="text-sm text-gray-500">원계좌번호</span>
            <div className="relative w-48">
              <input
                type="text"
                value={searchOriginalAccountNumber}
                onChange={(e) => setSearchOriginalAccountNumber(e.target.value)}
                placeholder="원계좌번호"
                className="w-full p-2 pr-8 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3167b4]"
              />
              {searchOriginalAccountNumber && (
                <button
                  type="button"
                  onClick={() => setSearchOriginalAccountNumber('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full border border-zinc-200 bg-zinc-50 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 flex items-center justify-center text-sm leading-none"
                  aria-label="원계좌번호 지우기"
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

          <div className="flex flex-col gap-1">
            <span className="text-sm text-gray-500">매칭상태</span>
            <select
              value={matchStatus}
              onChange={(e) => setMatchStatus(e.target.value)}
              className="w-36 p-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3167b4]"
            >
              <option value="">전체</option>
              <option value="matched">매칭됨</option>
              <option value="unmatched">미매칭</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-sm text-gray-500">시작일</span>
            <input
              type="date"
              value={searchFromDate}
              onChange={(e) => setSearchFromDate(e.target.value)}
              className="w-40 p-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3167b4]"
            />
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-sm text-gray-500">종료일</span>
            <input
              type="date"
              value={searchToDate}
              onChange={(e) => setSearchToDate(e.target.value)}
              className="w-40 p-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3167b4]"
            />
          </div>

          <div className="flex flex-row items-center gap-2">
            <button
              onClick={() => {
                const query = buildQueryString({
                  page: 1,
                  q: searchKeyword,
                  match: matchStatus,
                  fromDate: searchFromDate,
                  toDate: searchToDate,
                  accountNumber: searchAccountNumber,
                  originalAccountNumber: searchOriginalAccountNumber,
                });
                router.push(`/${params.lang}/admin/bank-transfer?${query}`);
              }}
              className={`w-28 bg-[#3167b4] text-white px-4 py-2 rounded-lg ${fetchingTransfers ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#3167b4]/80'}`}
              disabled={fetchingTransfers}
            >
              검색
            </button>

            <button
              onClick={() => {
                setSearchKeyword('');
                setSearchAccountNumber('');
                setSearchOriginalAccountNumber('');
                setMatchStatus('');
                setSearchFromDate('');
                setSearchToDate('');
                const query = buildQueryString({
                  page: 1,
                  q: '',
                  match: '',
                  fromDate: '',
                  toDate: '',
                  accountNumber: '',
                  originalAccountNumber: '',
                });
                router.push(`/${params.lang}/admin/bank-transfer?${query}`);
              }}
              className="w-28 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300"
            >
              초기화
            </button>
          </div>
        </div>


        {/* table */}
        <div className="w-full overflow-x-auto bg-white rounded-lg shadow-md">
          <table className="min-w-[1200px] w-full table-auto border-collapse">
            <thead className="bg-zinc-800 text-white text-sm font-semibold">
              <tr>
                <th className="px-3 py-3 text-left">No</th>
                <th className="px-3 py-3 text-left">가맹점</th>
                <th className="px-3 py-3 text-left">거래일시</th>
                <th className="px-3 py-3 text-left">입금자명</th>
                <th className="px-3 py-3 text-right">금액</th>
                <th className="px-3 py-3 text-left">계좌번호</th>
                <th className="px-3 py-3 text-left">원계좌번호</th>
                <th className="px-3 py-3 text-center">매칭</th>
                <th className="px-3 py-3 text-left">거래ID</th>
                <th className="px-3 py-3 text-left">회원정보</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {bankTransfers.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-gray-500">
                    조회된 입금내역이 없습니다.
                  </td>
                </tr>
              )}

              {bankTransfers.map((transfer, index) => {
                const transactionDate = transfer.transactionDate || transfer.regDate || transfer.createdAt;
                const transactionName = transfer.transactionName || transfer.sender || '-';
                const amount = transfer.amount;
                const bankAccountNumber = transfer.bankAccountNumber || transfer.account || transfer.custAccnt || '-';
                const originalBankAccountNumber = transfer.originalBankAccountNumber || transfer.custAccnt || '-';
                const matchLabel = transfer.match ? '매칭됨' : '미매칭';
                const tradeId = transfer.tradeId || '';
                const tradeIdLabel = tradeId ? `#${tradeId}` : '-';
                const storeInfo = transfer?.storeInfo || null;
                const storeName = storeInfo?.storeName || '-';
                const storeLogo = storeInfo?.storeLogo || '';
                const buyerInfo = transfer?.buyerInfo && (
                  <div className="text-sm text-green-700">
                    {transfer.buyerInfo?.nickname || '-'}
                  </div>
                );
                const rowKey = transfer?._id?.toString?.() || transfer?._id?.$oid || `${pageValue}-${index}`;

                return (
                  <tr key={rowKey} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-3 py-3 text-left text-gray-500">
                      {(pageValue - 1) * limitValue + index + 1}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex flex-row items-center gap-2">
                        {storeLogo ? (
                          <Image
                            src={storeLogo}
                            alt={storeName}
                            width={28}
                            height={28}
                            className="w-7 h-7 rounded-full object-cover border border-zinc-200"
                          />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center text-[10px] text-zinc-400">
                            -
                          </div>
                        )}
                        <span className="text-sm text-zinc-700">{storeName}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3">{formatDateTime(transactionDate)}</td>
                    <td className="px-3 py-3">{transactionName}</td>
                    <td className="px-3 py-3 text-right font-semibold text-blue-600">
                      {formatNumber(amount)}
                    </td>
                    <td className="px-3 py-3">{bankAccountNumber}</td>
                    <td className="px-3 py-3">{originalBankAccountNumber}</td>
                    <td className="px-3 py-3 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs ${transfer.match ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                        {matchLabel}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      {tradeId ? (
                        <button
                          type="button"
                          onClick={() => {
                            openDetail(String(tradeId));
                          }}
                          className="text-sm font-semibold text-[#3167b4] hover:text-[#2a5ca1] hover:underline"
                        >
                          {tradeIdLabel}
                        </button>
                      ) : (
                        <span className="text-sm text-zinc-400">-</span>
                      )}
                    </td>
                    <td className="px-3 py-3">{buyerInfo}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* trade detail panel */}
        <div className={`fixed inset-0 z-50 ${isDetailOpen ? '' : 'pointer-events-none'}`}>
          <div
            className={`absolute inset-0 bg-black/30 transition-opacity duration-300 ${isDetailOpen ? 'opacity-100' : 'opacity-0'}`}
            onClick={closeDetail}
          />
          <div
            className={`absolute right-0 top-0 h-full w-full sm:w-[480px] bg-white shadow-2xl border-l border-zinc-200 transform transition-transform duration-300 ${isDetailOpen ? 'translate-x-0' : 'translate-x-full'}`}
          >
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-200">
                <div>
                  <div className="text-xs text-zinc-500">거래상세</div>
                  <div className="text-lg font-semibold text-zinc-900">
                    {selectedTradeId ? `#${selectedTradeId}` : '거래 상세'}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={closeDetail}
                  className="h-9 w-9 rounded-full border border-zinc-200 bg-white text-zinc-500 hover:bg-zinc-50 hover:text-zinc-700 flex items-center justify-center"
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

              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
                {loadingDetail && (
                  <div className="flex items-center gap-2 text-sm text-zinc-500">
                    <Image src="/loading.png" alt="Loading" width={20} height={20} className="w-4 h-4 animate-spin" />
                    거래 정보를 불러오는 중...
                  </div>
                )}

                {!loadingDetail && detailError && (
                  <div className="text-sm text-red-500">{detailError}</div>
                )}

                {!loadingDetail && !detailError && (
                  <>
                    <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4">
                      <div className="text-xs text-zinc-500 mb-1">요약</div>
                      <div className="flex flex-col gap-2 text-sm text-zinc-700">
                        <div className="flex items-center justify-between">
                          <span className="text-zinc-500">거래상태</span>
                          <span className="font-semibold text-zinc-800">{tradeDetail?.status || '-'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-zinc-500">결제금액</span>
                          <span className="font-semibold text-zinc-800">
                            {formatNumber(tradeDetail?.krwAmount || tradeDetail?.paymentAmount || 0)}원
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-zinc-500">USDT 수량</span>
                          <span className="font-semibold text-zinc-800">
                            {tradeDetail?.usdtAmount ? Number(tradeDetail.usdtAmount).toLocaleString('ko-KR') : '-'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-zinc-500">거래일시</span>
                          <span className="font-semibold text-zinc-800">
                            {formatDateTime(tradeDetail?.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white border border-zinc-200 rounded-xl p-4">
                      <div className="text-xs text-zinc-500 mb-2">가맹점</div>
                      <div className="flex items-center gap-3">
                        {tradeDetail?.store?.storeLogo ? (
                          <Image
                            src={tradeDetail?.store?.storeLogo}
                            alt={tradeDetail?.store?.storeName || 'store'}
                            width={36}
                            height={36}
                            className="w-9 h-9 rounded-full object-cover border border-zinc-200"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center text-xs text-zinc-400">
                            -
                          </div>
                        )}
                        <div>
                          <div className="text-sm font-semibold text-zinc-800">
                            {tradeDetail?.store?.storeName || '-'}
                          </div>
                          <div className="text-xs text-zinc-500">
                            {tradeDetail?.store?.storecode || ''}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white border border-zinc-200 rounded-xl p-4">
                      <div className="text-xs text-zinc-500 mb-2">구매자</div>
                      <div className="space-y-2 text-sm text-zinc-700">
                        <div className="flex items-center justify-between">
                          <span className="text-zinc-500">닉네임</span>
                          <span className="font-semibold text-zinc-800">{tradeDetail?.buyer?.nickname || '-'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-zinc-500">입금자명</span>
                          <span className="font-semibold text-zinc-800">{tradeDetail?.buyer?.depositName || '-'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-zinc-500">계좌번호</span>
                          <span className="font-semibold text-zinc-800">{tradeDetail?.buyer?.depositBankAccountNumber || '-'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white border border-zinc-200 rounded-xl p-4">
                      <div className="text-xs text-zinc-500 mb-2">판매자</div>
                      <div className="space-y-2 text-sm text-zinc-700">
                        <div className="flex items-center justify-between">
                          <span className="text-zinc-500">닉네임</span>
                          <span className="font-semibold text-zinc-800">{tradeDetail?.seller?.nickname || '-'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-zinc-500">지갑주소</span>
                          <span className="font-semibold text-zinc-800">
                            {tradeDetail?.seller?.walletAddress
                              ? `${tradeDetail.seller.walletAddress.slice(0, 6)}...${tradeDetail.seller.walletAddress.slice(-4)}`
                              : '-'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-zinc-500">은행</span>
                          <span className="font-semibold text-zinc-800">{tradeDetail?.seller?.bankInfo?.bankName || '-'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-zinc-500">계좌번호</span>
                          <span className="font-semibold text-zinc-800">{tradeDetail?.seller?.bankInfo?.accountNumber || '-'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white border border-zinc-200 rounded-xl p-4">
                      <div className="text-xs text-zinc-500 mb-2">처리 시간</div>
                      <div className="space-y-2 text-sm text-zinc-700">
                        <div className="flex items-center justify-between">
                          <span className="text-zinc-500">승인시간</span>
                          <span className="font-semibold text-zinc-800">{formatDateTime(tradeDetail?.acceptedAt)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-zinc-500">결제요청시간</span>
                          <span className="font-semibold text-zinc-800">{formatDateTime(tradeDetail?.paymentRequestedAt)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-zinc-500">결제확인시간</span>
                          <span className="font-semibold text-zinc-800">{formatDateTime(tradeDetail?.paymentConfirmedAt)}</span>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>


        {/* pagination */}
        <div className="mt-6 w-full flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-white/90 border border-zinc-200 rounded-2xl px-4 py-3 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex flex-row items-center gap-2">
              <span className="text-sm text-zinc-600">페이지당</span>
              <select
                value={limitValue}
                onChange={(e) => {
                  const query = buildQueryString({
                    limit: Number(e.target.value),
                    page: 1,
                  });
                  router.push(`/${params.lang}/admin/bank-transfer?${query}`);
                }}
                className="text-sm bg-white text-zinc-700 border border-zinc-200 px-2 py-1 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3167b4] shadow-xs"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span className="text-sm text-zinc-600">건</span>
            </div>

            <div className="text-sm text-zinc-500 bg-zinc-50 border border-zinc-200 rounded-full px-3 py-1">
              {totalCount === 0
                ? '0 / 0'
                : `${(pageValue - 1) * limitValue + 1} - ${Math.min(totalCount, pageValue * limitValue)} / ${totalCount.toLocaleString('ko-KR')}`}
            </div>
          </div>

          <div className="flex flex-row items-center gap-2 flex-wrap justify-center">
            <button
              disabled={pageValue <= 1}
              className="text-sm px-3 py-2 rounded-full border border-zinc-200 bg-white text-zinc-500 hover:bg-zinc-50 hover:text-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed"
              onClick={() => {
                const query = buildQueryString({ page: 1 });
                router.push(`/${params.lang}/admin/bank-transfer?${query}`);
              }}
            >
              처음
            </button>
            <button
              disabled={pageValue <= 1}
              className="text-sm px-4 py-2 rounded-full bg-zinc-600 text-white hover:bg-zinc-500 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
              onClick={() => {
                const query = buildQueryString({
                  page: Math.max(1, pageValue - 1),
                });
                router.push(`/${params.lang}/admin/bank-transfer?${query}`);
              }}
            >
              이전
            </button>

            <div className="flex flex-row items-center gap-2 bg-zinc-50 border border-zinc-200 rounded-full px-2 py-1">
              <input
                type="number"
                min={1}
                max={totalPages}
                value={pageInput}
                onChange={(e) => setPageInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const nextPage = Math.min(
                      totalPages,
                      Math.max(1, Number(pageInput) || 1)
                    );
                    const query = buildQueryString({ page: nextPage });
                    router.push(`/${params.lang}/admin/bank-transfer?${query}`);
                  }
                }}
                className="w-16 text-sm text-center bg-white border border-zinc-200 rounded-full px-2 py-1 focus:outline-none focus:ring-2 focus:ring-[#3167b4]"
              />
              <span className="text-sm text-zinc-500">/ {totalPages}</span>
              <button
                className="text-sm px-3 py-2 rounded-full bg-zinc-600 text-white hover:bg-zinc-500 shadow-sm"
                onClick={() => {
                  const nextPage = Math.min(
                    totalPages,
                    Math.max(1, Number(pageInput) || 1)
                  );
                  const query = buildQueryString({ page: nextPage });
                  router.push(`/${params.lang}/admin/bank-transfer?${query}`);
                }}
              >
                이동
              </button>
            </div>

            <button
              disabled={pageValue >= totalPages}
              className="text-sm px-4 py-2 rounded-full bg-zinc-700 text-white hover:bg-zinc-600 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
              onClick={() => {
                const query = buildQueryString({
                  page: Math.min(totalPages, pageValue + 1),
                });
                router.push(`/${params.lang}/admin/bank-transfer?${query}`);
              }}
            >
              다음
            </button>
            <button
              disabled={pageValue >= totalPages}
              className="text-sm px-3 py-2 rounded-full border border-zinc-200 bg-white text-zinc-500 hover:bg-zinc-50 hover:text-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed"
              onClick={() => {
                const query = buildQueryString({ page: totalPages });
                router.push(`/${params.lang}/admin/bank-transfer?${query}`);
              }}
            >
              마지막
            </button>
          </div>
        </div>

      </div>
    </main>
  );
}
