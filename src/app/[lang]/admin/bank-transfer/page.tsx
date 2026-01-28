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
  useActiveWallet,
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

const formatTransactionTypeInfo = (value: any) => {
  if (!value) {
    return { label: '-', variant: 'default' as const };
  }
  const normalized = String(value).toLowerCase();
  if (value === '입금' || normalized === 'deposited' || normalized === 'deposit') {
    return { label: '입금', variant: 'deposit' as const };
  }
  if (value === '출금' || normalized === 'withdrawn' || normalized === 'withdrawal') {
    return { label: '출금', variant: 'withdrawal' as const };
  }
  return { label: String(value), variant: 'default' as const };
};


export default function BankTransferPage({ params }: any) {

  const router = useRouter();
  const searchParams = useSearchParams();

  const activeAccount = useActiveAccount();
  const activeWallet = useActiveWallet();
  const address = activeAccount?.address;

  const todayString = getTodayString();

  const limitParam = searchParams.get('limit') || '20';
  const pageParam = searchParams.get('page') || '1';
  const queryParam = searchParams.get('q') || '';
  const matchParam = searchParams.get('match') || '';
  const fromDateParam = searchParams.get('fromDate') || todayString;
  const toDateParam = searchParams.get('toDate') || todayString;

  const [limitValue, setLimitValue] = useState(Number(limitParam) || 20);
  const [pageValue, setPageValue] = useState(Number(pageParam) || 1);
  const [pageInput, setPageInput] = useState(String(Number(pageParam) || 1));

  const [searchKeyword, setSearchKeyword] = useState(queryParam);
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
    setMatchStatus(matchParam);
  }, [matchParam]);

  useEffect(() => {
    setSearchFromDate(fromDateParam);
  }, [fromDateParam]);

  useEffect(() => {
    setSearchToDate(toDateParam);
  }, [toDateParam]);


  const [isAdmin, setIsAdmin] = useState(false);
  const [loadingUser, setLoadingUser] = useState(true);

  useEffect(() => {
    if (!address) {
      setIsAdmin(false);
      setLoadingUser(false);
      return;
    }

    setLoadingUser(true);

    fetch('/api/user/getUser', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        storecode: "admin",
        walletAddress: address,
      }),
    })
    .then(response => response.json())
    .then(data => {
      setIsAdmin(data.result?.role === "admin");
    })
    .catch(() => {
      setIsAdmin(false);
    })
    .finally(() => {
      setLoadingUser(false);
    });
  }, [address]);


  const [fetchingTransfers, setFetchingTransfers] = useState(false);
  const [bankTransfers, setBankTransfers] = useState([] as any[]);
  const [totalCount, setTotalCount] = useState(0);

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
      }),
      });

      if (!response.ok) {
        toast.error('입금내역 조회를 실패했습니다.');
        return;
      }

      const data = await response.json();

      setBankTransfers(data.result?.transfers || []);
      setTotalCount(data.result?.totalCount || 0);
    } catch (error) {
      toast.error('입금내역 조회를 실패했습니다.');
    } finally {
      setFetchingTransfers(false);
    }
  };

  useEffect(() => {
    if (!address || !isAdmin) {
      setBankTransfers([]);
      return;
    }
    fetchBankTransfers();
  }, [address, isAdmin, limitParam, pageParam, queryParam, matchParam, fromDateParam, toDateParam]);


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
  } = {}) => {
    const params = new URLSearchParams();

    const nextLimit = overrides.limit ?? limitParam ?? 20;
    const nextPage = overrides.page ?? pageParam ?? 1;
    const nextQ = overrides.q ?? queryParam;
    const nextMatch = overrides.match ?? matchParam;
    const nextFromDate = overrides.fromDate ?? fromDateParam;
    const nextToDate = overrides.toDate ?? toDateParam;

    params.set('limit', String(nextLimit));
    params.set('page', String(nextPage));

    if (nextQ) params.set('q', String(nextQ));
    if (nextMatch) params.set('match', String(nextMatch));
    if (nextFromDate) params.set('fromDate', String(nextFromDate));
    if (nextToDate) params.set('toDate', String(nextToDate));

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

  if (address && !loadingUser && !isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <h1 className="text-2xl font-bold">접근권한을 확인중입니다...</h1>
        <p className="text-lg">이 페이지에 접근할 권한이 없습니다.</p>
        <div className="text-lg text-gray-500">{address}</div>

        <button
          onClick={() => {
            confirm("로그아웃 하시겠습니까?") && activeWallet?.disconnect()
              .then(() => {
                toast.success('로그아웃 되었습니다');
              });
          }}
          className="flex items-center justify-center gap-2 bg-[#3167b4] text-sm text-[#f3f4f6] px-4 py-2 rounded-lg hover:bg-[#3167b4]/80"
        >
          <Image
            src="/icon-logout.webp"
            alt="Logout"
            width={20}
            height={20}
            className="rounded-lg w-5 h-5"
          />
          <span className="text-sm">로그아웃</span>
        </button>
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
            <span className="text-sm text-gray-600">총 {totalCount.toLocaleString('ko-KR')}건</span>
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


        {/* search filters */}
        <div className="w-full flex flex-col lg:flex-row lg:items-end gap-3 bg-white/80 p-4 rounded-lg shadow-md mb-4">
          <div className="flex flex-col gap-1">
            <span className="text-sm text-gray-500">검색어</span>
            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder="입금자명, 계좌번호, 은행코드"
              className="w-64 p-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3167b4]"
            />
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
                setTransactionType('');
                setMatchStatus('');
                setSearchFromDate('');
                setSearchToDate('');
                const query = buildQueryString({
                  page: 1,
                  q: '',
                  match: '',
                  fromDate: '',
                  toDate: '',
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
                <th className="px-3 py-3 text-left">거래일시</th>
                <th className="px-3 py-3 text-left">입금자</th>
                <th className="px-3 py-3 text-right">금액</th>
                <th className="px-3 py-3 text-right">잔액</th>
                <th className="px-3 py-3 text-left">계좌번호</th>
                <th className="px-3 py-3 text-left">원계좌번호</th>
                <th className="px-3 py-3 text-left">은행</th>
                <th className="px-3 py-3 text-left">거래구분</th>
                <th className="px-3 py-3 text-left">처리일시</th>
                <th className="px-3 py-3 text-center">매칭</th>
                <th className="px-3 py-3 text-left">거래ID</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {bankTransfers.length === 0 && (
                <tr>
                  <td colSpan={12} className="px-4 py-8 text-center text-gray-500">
                    조회된 입금내역이 없습니다.
                  </td>
                </tr>
              )}

              {bankTransfers.map((transfer, index) => {
                const transactionDate = transfer.transactionDate || transfer.regDate || transfer.createdAt;
                const transactionName = transfer.transactionName || transfer.sender || '-';
                const amount = transfer.amount;
                const balance = transfer.balance;
                const bankAccountNumber = transfer.bankAccountNumber || transfer.account || transfer.custAccnt || '-';
                const originalBankAccountNumber = transfer.originalBankAccountNumber || transfer.custAccnt || '-';
                const bankName = transfer.bankCode || transfer.bankName || transfer.custBankName || '-';
                const transactionTypeInfo = formatTransactionTypeInfo(transfer.transactionType || transfer.trxType || '-');
                const processingDate = transfer.processingDate || transfer.regDate || '-';
                const matchLabel = transfer.match ? '매칭됨' : '미매칭';
                const tradeId = transfer.tradeId || '-';
                const accountId = transfer.bankAccountId || transfer.vactId || '-';
                const rowKey = transfer?._id?.toString?.() || transfer?._id?.$oid || `${pageValue}-${index}`;

                return (
                  <tr key={rowKey} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-3 py-3 text-left text-gray-500">
                      {(pageValue - 1) * limitValue + index + 1}
                    </td>
                    <td className="px-3 py-3">{formatDateTime(transactionDate)}</td>
                    <td className="px-3 py-3">{transactionName}</td>
                    <td className="px-3 py-3 text-right font-semibold text-blue-600">
                      {formatNumber(amount)}
                    </td>
                    <td className="px-3 py-3 text-right">
                      {formatNumber(balance)}
                    </td>
                    <td className="px-3 py-3">{bankAccountNumber}</td>
                    <td className="px-3 py-3">{originalBankAccountNumber}</td>
                    <td className="px-3 py-3">{bankName}</td>
                    <td className="px-3 py-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          transactionTypeInfo.variant === 'deposit'
                            ? 'bg-blue-100 text-blue-700'
                            : transactionTypeInfo.variant === 'withdrawal'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {transactionTypeInfo.label}
                      </span>
                    </td>
                    <td className="px-3 py-3">{formatDateTime(processingDate)}</td>
                    <td className="px-3 py-3 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs ${transfer.match ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                        {matchLabel}
                      </span>
                    </td>
                    <td className="px-3 py-3">{tradeId}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
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
