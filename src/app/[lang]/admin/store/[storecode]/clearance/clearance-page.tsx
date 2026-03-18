'use client';

import { useState, useEffect, use, useCallback, useRef } from "react";
import * as Ably from "ably";



import { toast } from 'react-hot-toast';

import { client } from "../../../../../client";

import {
    getContract,
    sendAndConfirmTransaction,
} from "thirdweb";


import {
    ConnectButton,
    useActiveAccount,
    useActiveWallet,
    useConnectedWallets,
    useSetActiveWallet,
} from "thirdweb/react";

import {
  inAppWallet,
  createWallet,
  getWalletBalance,
} from "thirdweb/wallets";


import { getUserPhoneNumber } from "thirdweb/wallets/in-app";


import Image from 'next/image';

import GearSetupIcon from "@/components/gearSetupIcon";


import Uploader from '@/components/uploader';

import { balanceOf, transfer } from "thirdweb/extensions/erc20";
 






// open modal

import Modal from '@/components/modal';

import {
  useRouter,
  useSearchParams,
}from "next//navigation";
import { postAdminSignedJson } from "@/lib/client/admin-signed-action";
import { postCenterStoreAdminSignedJson } from "@/lib/client/center-store-admin-signed-action";
import {
  isWithdrawalWebhookGeneratedClearanceOrder,
  isWithdrawalWebhookGeneratedClearanceOrderDummyTransfer,
  isWithdrawalWebhookGeneratedClearanceOrderDeletable,
} from "@/lib/clearance-webhook-order";
import {
  BANKTRANSFER_ABLY_CHANNEL,
  BANKTRANSFER_ABLY_EVENT_NAME,
  type BankTransferDashboardEvent,
} from "@lib/ably/constants";



import { getDictionary } from "../../../../../dictionaries";


interface BuyOrder {
  _id: string;
  createdAt: string;
  createdBy?: any;
  walletAddress: string;
  nickname: string;
  avatar: string;
  trades: number;
  price: number;
  available: number;
  limit: string;
  paymentMethods: string[];

  usdtAmount: number;
  krwAmount: number;
  rate: number;



  seller: any;

  tradeId: string;
  status: string;
  acceptedAt: string;
  paymentRequestedAt: string;
  paymentConfirmedAt: string;
  cancelledAt: string;


  buyer: any;

  canceller: string;

  escrowTransactionHash: string;
  transactionHash: string;
  transactionHashDummy?: boolean;
  transactionHashDummyReason?: string | null;
  queueId?: string | null;
  minedAt?: string;

  storecode: string;
  store: any;

  settlement: any;

  paymentAmount: number;

  autoConfirmPayment: boolean;

  privateSale: boolean;
}

interface QueueTransactionCheckResult {
  orderId: string;
  status: string;
  success: boolean;
  updated: boolean;
  message: string;
  queueId?: string;
  retryTransactionId?: string;
  transactionHash?: string;
  engineStatus?: string;
}

interface QueueCheckBanner {
  tone: "success" | "warning" | "error";
  message: string;
}

type ClearanceWithdrawalRealtimeItem = {
  id: string;
  data: BankTransferDashboardEvent;
  receivedAt: string;
  highlightUntil: number;
};

const BUY_ORDER_DEPOSIT_COMPLETED_SIGNING_PREFIX = "admin-buyorder-deposit-completed-v1";
const CANCEL_CLEARANCE_ORDER_SIGNING_PREFIX = "admin-cancel-clearance-order-v1";
const DELETE_WEBHOOK_CLEARANCE_ORDER_SIGNING_PREFIX = "admin-delete-webhook-clearance-order-v1";
const CLEARANCE_WITHDRAWAL_MAX_EVENTS = 14;
const CLEARANCE_WITHDRAWAL_RESYNC_LIMIT = 80;
const CLEARANCE_WITHDRAWAL_RESYNC_INTERVAL_MS = 10_000;
const CLEARANCE_WITHDRAWAL_HIGHLIGHT_MS = 4_800;
const CLEARANCE_WITHDRAWAL_CLOCK_TICK_MS = 5_000;

const formatShortWalletAddress = (value: string | null | undefined) => {
  const normalized = String(value || "").trim();
  if (!normalized) {
    return "";
  }
  if (normalized.length <= 14) {
    return normalized;
  }
  return `${normalized.slice(0, 6)}...${normalized.slice(-4)}`;
};

const formatAdminActionDateTime = (value: string | null | undefined) => {
  const normalized = String(value || "").trim();
  if (!normalized) {
    return "";
  }
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) {
    return normalized;
  }
  return date.toLocaleString("ko-KR");
};

const normalizeBankTransferTransactionType = (value: string | null | undefined) => {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "withdrawn" || normalized === "withdrawal" || normalized === "출금") {
    return "withdrawn";
  }
  if (normalized === "deposited" || normalized === "deposit" || normalized === "입금") {
    return "deposited";
  }
  return normalized;
};

const toSafeTimestamp = (value: string | null | undefined) => {
  if (!value) {
    return 0;
  }
  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? 0 : timestamp;
};

const formatRealtimeDateTime = (value: string | null | undefined) => {
  const timestamp = toSafeTimestamp(value);
  if (!timestamp) {
    return "-";
  }
  return new Date(timestamp).toLocaleString("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};

const formatRealtimeRelative = (value: string | null | undefined, nowMs: number) => {
  const timestamp = toSafeTimestamp(value);
  if (!timestamp) {
    return "-";
  }

  const diffMs = Math.max(0, nowMs - timestamp);
  const diffSeconds = Math.floor(diffMs / 1000);

  if (diffSeconds < 60) {
    return `${diffSeconds}초 전`;
  }

  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) {
    return `${diffMinutes}분 전`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours}시간 전`;
  }

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}일 전`;
};

const normalizeAccountNumber = (value: string | null | undefined) =>
  String(value || "").replace(/[\s-]/g, "");

const getDepositCompletedActorLabel = (buyer: any) => {
  const actor = buyer?.depositCompletedBy;
  return actor?.nickname || formatShortWalletAddress(actor?.walletAddress);
};

const getDepositCompletedActorMeta = (buyer: any) => {
  const actor = buyer?.depositCompletedBy;
  const nickname = String(actor?.nickname || "").trim().toLowerCase();
  const role = String(actor?.role || "").trim().toLowerCase();

  if (!actor) {
    return null;
  }

  if (role === "system" || nickname === "withdrawal webhook") {
    return {
      label: "시스템 처리",
      className: "border-amber-200 bg-amber-50 text-amber-700",
    };
  }

  return {
    label: "관리자 처리",
    className: "border-sky-200 bg-sky-50 text-sky-700",
  };
};

const getCreatedByActorLabel = (order: BuyOrder | any) => {
  const actor = order?.createdBy;
  return actor?.nickname || formatShortWalletAddress(actor?.walletAddress);
};

const getCreatedByDateTime = (order: BuyOrder | any) => {
  return String(order?.createdBy?.requestedAt || order?.createdAt || "").trim();
};

interface ClearanceOrderPreview {
  storecode: string;
  requesterWalletAddress: string;
  requesterIsAuthorizedAdmin: boolean;
  clearanceWalletAddress: string;
  clearanceWalletAllowed: boolean;
  clearanceWalletIsServerWallet: boolean;
  settlementWalletAddress: string | null;
  requestedKrwAmount: number;
  requestedUsdtAmount: number;
  rate: number;
  maxKrwAmount: number;
  maxDailyKrwAmount: number;
  currentDailyKrwAmount: number;
  currentDailyUsdtAmount: number;
  currentDailyOrderCount: number;
  projectedDailyKrwAmount: number;
  remainingDailyKrwAmount: number;
  withinPerOrderLimit: boolean;
  withinDailyLimit: boolean;
  withinRateTolerance: boolean;
  impliedRate: number;
  allowedRateDelta: number;
  existingActiveOrder?: {
    orderId?: string | null;
    tradeId?: string | null;
    status?: string | null;
  } | null;
  blockingReasons: string[];
  canSubmit: boolean;
  kstDayLabel: string;
}



const wallets = [
  inAppWallet({
    auth: {
      options: ["email", "google"],
    },
  }),
];




import {
  ethereum,
  polygon,
  arbitrum,
  bsc,
} from "thirdweb/chains";

import {
  chain,
  ethereumContractAddressUSDT,
  polygonContractAddressUSDT,
  arbitrumContractAddressUSDT,
  bscContractAddressUSDT,

  bscContractAddressMKRW,
} from "@/app/config/contractAddresses";

const SET_BUY_ORDER_FOR_CLEARANCE_SIGNING_PREFIX = "stable-georgia:set-buy-order-for-clearance:v1";
const GET_CLEARANCE_ORDER_PREVIEW_SIGNING_PREFIX = "stable-georgia:get-clearance-order-preview:v1";

const normalizeStringValue = (value: unknown): string => {
  if (typeof value !== "string") {
    return "";
  }
  return value.trim();
};

const normalizeWalletAddressForSignature = (value: unknown): string => {
  return normalizeStringValue(value).toLowerCase();
};

const formatKrwDisplay = (value: unknown) => {
  return `${Math.trunc(Number(value || 0)).toLocaleString("ko-KR")}원`;
};

const formatUsdtDisplay = (value: unknown) => {
  return Number(value || 0).toFixed(3).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};


export default function Index({ params }: any) {

  //console.log('params', params);

  const searchParams = useSearchParams()!;
 
  const wallet = searchParams.get('wallet');
  const queryLimit = searchParams.get('limit');
  const queryPage = searchParams.get('page');
  const querySearchMyOrders = searchParams.get('searchMyOrders');
  const queryFromDate = searchParams.get('fromDate');
  const queryToDate = searchParams.get('toDate');

  const storecode = params?.storecode || params?.center || "";
  const normalizedStorecode = String(storecode || "").trim();
  const isEmbedded = Boolean(params?.embedded);
  const isHistoryOnly = Boolean(params?.historyOnly);

  console.log("storecode", storecode);

  const contract = getContract({
    // the client you have created via `createThirdwebClient()`
    client,
    // the chain the contract is deployed on
    
    
    //chain: arbitrum,
    chain:  chain === "ethereum" ? ethereum :
            chain === "polygon" ? polygon :
            chain === "arbitrum" ? arbitrum :
            chain === "bsc" ? bsc : arbitrum,
  
  
  
    // the contract's address
    ///address: contractAddressArbitrum,

    address: chain === "ethereum" ? ethereumContractAddressUSDT :
            chain === "polygon" ? polygonContractAddressUSDT :
            chain === "arbitrum" ? arbitrumContractAddressUSDT :
            chain === "bsc" ? bscContractAddressUSDT : arbitrumContractAddressUSDT,


    // OPTIONAL: the contract's abi
    //abi: [...],
  });




  const contractMKRW = getContract({
    // the client you have created via `createThirdwebClient()`
    client,

    // the chain the contract is deployed on
    chain: chain === "ethereum" ? ethereum :
           chain === "polygon" ? polygon :
           chain === "arbitrum" ? arbitrum :
           chain === "bsc" ? bsc : arbitrum,

    // the contract's address
    address: chain === "ethereum" ? bscContractAddressMKRW :
            chain === "polygon" ? bscContractAddressMKRW :
            chain === "arbitrum" ? bscContractAddressMKRW :
            chain === "bsc" ? bscContractAddressMKRW : bscContractAddressMKRW,

    // OPTIONAL: the contract's abi
    //abi: [...],
  });




  const [data, setData] = useState({
    title: "",
    description: "",

    menu : {
      buy: "",
      sell: "",
      trade: "",
      chat: "",
      history: "",
      settings: "",
    },

    Go_Home: "",

    Order: "",
    Buy: "",
    Sell: "",
    Amount: "",
    Price: "",
    Total: "",
    Orders: "",
    Trades: "",
    Search_my_trades: "",

    Seller: "",
    Buyer: "",
    Me: "",

    Buy_USDT: "",
    Sell_USDT: "",  
    Rate: "",
    Payment: "",
    Bank_Transfer: "",

    I_agree_to_the_terms_of_trade: "",
    I_agree_to_cancel_the_trade: "",

    Opened_at: "",
    Cancelled_at: "",
    Completed_at: "",

    Waiting_for_seller_to_deposit: "",

    to_escrow: "",
    If_the_seller_does_not_deposit_the_USDT_to_escrow: "",
    this_trade_will_be_cancelled_in: "",

    Cancel_My_Trade: "",


    Order_accepted_successfully: "",
    Order_has_been_cancelled: "",
    My_Order: "",

    Sale: "",
    Private_Sale: "",

    Place_Order: "",

    Search_my_orders: "",

    Go_Sell_USDT: "",

    Cancel_My_Order: "",


    Order_has_been_placed: "",


    Placing_Order: "",

    hours_ago: "",
    minutes_ago: "",
    seconds_ago: "",

    SMS_will_be_sent_to_your_mobile_number: "",

    Profile : "",
    My_Profile_Picture : "",

    Edit : "",

    Escrow: "",

    TID: "",

    Chat_with_Buyer: "",

    Table_View: "",
    Started_at: "",
    Trading_Time_is: "",
    Memo: "",
    Buy_Amount: "",
    Status: "",
    Payment_Amount: "",

    hours: "",
    minutes: "",
    seconds: "",

    Opened: "",
    Completed: "",
    Cancelled: "",

    Deposit_Name: "",

    Request_Payment: "",

    Waiting_for_seller_to_confirm_payment: "",

    Confirm_Payment: "",

    Escrow_Completed: "",

    Payment_request_has_been_sent: "",

    Payment_has_been_confirmed: "",

    Reload: "",

    Insufficient_balance: "",


    Private_Buy_Order: "",

    Buy_Order_USDT: "",

    Buy_Order_SMS_will_be_sent_to_your_mobile_number: "",

    Buy_Orders: "",

    My_Balance: "",

    Anonymous: "",

    Copied_Wallet_Address: "",

  } );

  useEffect(() => {
      async function fetchData() {
          const dictionary = await getDictionary(params.lang);
          setData(dictionary);
      }
      fetchData();
  }, [params.lang]);

  const {
    title,
    description,
    menu,
    Go_Home,

    Order,
    Buy,
    Sell,
    Amount,
    Price,
    Total,
    Orders,
    Trades,
    Search_my_trades,
    Seller,
    Buyer,
    Me,

    Buy_USDT,
    Sell_USDT,
    Rate,
    Payment,
    Bank_Transfer,
    I_agree_to_the_terms_of_trade,
    I_agree_to_cancel_the_trade,

    Opened_at,
    Cancelled_at,
    Completed_at,

    Waiting_for_seller_to_deposit,

    to_escrow,

    If_the_seller_does_not_deposit_the_USDT_to_escrow,
    this_trade_will_be_cancelled_in,

    Cancel_My_Trade,

    Order_accepted_successfully,
    Order_has_been_cancelled,
    My_Order,

    Sale,
    Private_Sale,

    Place_Order,

    Search_my_orders,

    Go_Sell_USDT,

    Cancel_My_Order,

    Order_has_been_placed,

    Placing_Order,

    hours_ago,
    minutes_ago,
    seconds_ago,

    SMS_will_be_sent_to_your_mobile_number,

    Profile,
    My_Profile_Picture,

    Edit,

    Escrow,

    TID,

    Chat_with_Buyer,

    Table_View,
    Started_at,
    Trading_Time_is,
    Memo,
    Buy_Amount,
    Status,
    Payment_Amount,

    hours,
    minutes,
    seconds,

    Opened,
    Completed,
    Cancelled,

    Deposit_Name,

    Request_Payment,

    
    Waiting_for_seller_to_confirm_payment,

    Confirm_Payment,

    Escrow_Completed,

    Payment_request_has_been_sent,

    Payment_has_been_confirmed,

    Reload,

    Insufficient_balance,

    Private_Buy_Order,

    Buy_Order_USDT,

    Buy_Order_SMS_will_be_sent_to_your_mobile_number,

    Buy_Orders,

    My_Balance,

    Anonymous,

    Copied_Wallet_Address,

  } = data;






  const router = useRouter();

  const activeAccount = useActiveAccount();

  const address = activeAccount?.address;




  const [rate, setRate] = useState(1380);


  // /api/client/getUsdtKRWRateSell
  useEffect(() => {
    const fetchRate = async () => {
      try {
        const response = await fetch('/api/client/getUsdtKRWRateSell', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        const data = await response.json();

        console.log('getUsdtKRWRateSell data', data);


        if (data.result) {
          setRate(data.result);
        }
      } catch (error) {
        console.error('Error fetching USDT/KRW rate:', error);
      }
    }
    fetchRate();

    // fetch rate every 10 seconds
    const interval = setInterval(() => {
      fetchRate();
    }, 10000);
    return () => clearInterval(interval);
  }, []);





  const [phoneNumber, setPhoneNumber] = useState("");

  useEffect(() => {


    if (address) {

      //const phoneNumber = await getUserPhoneNumber({ client });
      //setPhoneNumber(phoneNumber);


      getUserPhoneNumber({ client }).then((phoneNumber) => {
        setPhoneNumber(phoneNumber || "");
      });



    }

  } , [address]);


  


  const [nickname, setNickname] = useState("");
  const [avatar, setAvatar] = useState("/icon-user.png");
  const [userCode, setUserCode] = useState("");


  const [user, setUser] = useState<any>(null);
  const isAdminUser = String(user?.role || "").trim().toLowerCase() === "admin";


  const [seller, setSeller] = useState(null) as any;


  const [loadingUser, setLoadingUser] = useState(true);

  useEffect(() => {
      const fetchData = async () => {

          if (!address) {
              return;
          }
          setLoadingUser(true);

          const response = await fetch("/api/user/getUser", {
              method: "POST",
              headers: {
                  "Content-Type": "application/json",
              },
              body: JSON.stringify({
                  storecode: "admin",
                  walletAddress: address,
              }),
          });

          if (!response.ok) {
              console.error("Error fetching user data");
              setLoadingUser(false);
              return;
            
          }

          const data = await response.json();

          //console.log("data", data);

          if (data.result) {
              setLoadingUser(false);
              setNickname(data.result.nickname);
              data.result.avatar && setAvatar(data.result.avatar);
              setUserCode(data.result.id);

              setUser(data.result);

              setSeller(data.result.seller);

          }
      };

      fetchData();

  }, [address]);




    const [totalClearanceCount, setTotalClearanceCount] = useState(0);
    const [totalClearanceAmount, setTotalClearanceAmount] = useState(0);
    const [totalClearanceAmountKRW, setTotalClearanceAmountKRW] = useState(0);

    const [totalCount, setTotalCount] = useState(0);
    const [buyOrders, setBuyOrders] = useState<BuyOrder[]>([]);
    const [deletingWebhookOrderIds, setDeletingWebhookOrderIds] = useState<string[]>([]);
    const [cancellingClearanceOrderIds, setCancellingClearanceOrderIds] = useState<string[]>([]);
    const [buyOrdersReadMessage, setBuyOrdersReadMessage] = useState("");
    const [hasPrivilegedStoreRead, setHasPrivilegedStoreRead] = useState(false);
    const [storeReadMessage, setStoreReadMessage] = useState("");

    const getKstToday = () => {
      const today = new Date();
      today.setHours(today.getHours() + 9);
      return today.toISOString().split('T')[0];
    };

    const getKstDateByOffset = (offsetDays: number) => {
      const date = new Date();
      date.setHours(date.getHours() + 9);
      date.setDate(date.getDate() + offsetDays);
      return date.toISOString().split('T')[0];
    };

    const [searchMyOrders, setSearchMyOrders] = useState(querySearchMyOrders === 'true');
    useEffect(() => {
      setSearchMyOrders(querySearchMyOrders === 'true');
    }, [querySearchMyOrders]);

    const [limitValue, setLimitValue] = useState(Number(queryLimit) || 20);
    useEffect(() => {
      setLimitValue(Number(queryLimit) || 20);
    }, [queryLimit]);

    const [pageValue, setPageValue] = useState(Number(queryPage) || 1);
    useEffect(() => {
      setPageValue(Number(queryPage) || 1);
    }, [queryPage]);

    // search form date to date
    const [searchFromDate, setSearchFormDate] = useState(queryFromDate || getKstToday());
    const [searchToDate, setSearchToDate] = useState(queryToDate || getKstToday());
    useEffect(() => {
      setSearchFormDate(queryFromDate || getKstToday());
      setSearchToDate(queryToDate || getKstToday());
    }, [queryFromDate, queryToDate]);

    const currentLimit = Math.max(1, Number(limitValue) || 20);
    const currentPage = Math.max(1, Number(pageValue) || 1);
    const totalPages = Math.max(1, Math.ceil(Number(totalCount) / currentLimit));
    const canMovePrev = currentPage > 1;
    const canMoveNext = currentPage < totalPages;

    const pushClearanceParams = ({
      nextLimit = currentLimit,
      nextPage = currentPage,
      nextSearchMyOrders = searchMyOrders,
      nextFromDate = searchFromDate,
      nextToDate = searchToDate,
    }: {
      nextLimit?: number;
      nextPage?: number;
      nextSearchMyOrders?: boolean;
      nextFromDate?: string;
      nextToDate?: string;
    }) => {
      const nextParams = new URLSearchParams(searchParams?.toString() || '');
      const basePath = isHistoryOnly
        ? `/${params.lang}/admin/clearance-management`
        : `/${params.lang}/admin/store/clearance-management`;

      nextParams.set('limit', String(nextLimit));
      nextParams.set('page', String(nextPage));
      nextParams.set('searchMyOrders', String(nextSearchMyOrders));

      if (nextFromDate) {
        nextParams.set('fromDate', nextFromDate);
      } else {
        nextParams.delete('fromDate');
      }

      if (nextToDate) {
        nextParams.set('toDate', nextToDate);
      } else {
        nextParams.delete('toDate');
      }

      nextParams.set('storecode', storecode);
      router.push(`${basePath}?${nextParams.toString()}`);
    };

    const moveToPage = (targetPage: number, nextLimit = currentLimit) => {
      const normalizedPage = Math.min(totalPages, Math.max(1, targetPage || 1));
      setPageValue(normalizedPage);
      pushClearanceParams({
        nextLimit,
        nextPage: normalizedPage,
      });
    };

    const applyQuickDateSearch = (targetDate: string) => {
      setSearchFormDate(targetDate);
      setSearchToDate(targetDate);
      pushClearanceParams({
        nextPage: 1,
        nextFromDate: targetDate,
        nextToDate: targetDate,
      });
    };

    const applyAllDateSearch = () => {
      setSearchFormDate("");
      setSearchToDate("");
      pushClearanceParams({
        nextPage: 1,
        nextFromDate: "",
        nextToDate: "",
      });
    };

    const todayDate = getKstToday();
    const yesterdayDate = getKstDateByOffset(-1);






    const [loadingFetchBuyOrders, setLoadingFetchBuyOrders] = useState(false);
    const [hasFetchedBuyOrdersOnce, setHasFetchedBuyOrdersOnce] = useState(false);
    const [checkingQueueTx, setCheckingQueueTx] = useState(false);
    const [checkingQueueOrderIds, setCheckingQueueOrderIds] = useState<string[]>([]);
    const [queueCheckSummary, setQueueCheckSummary] = useState("");
    const [queueCheckResultsByOrderId, setQueueCheckResultsByOrderId] = useState<
      Record<string, QueueCheckBanner>
    >({});

    const getPendingQueueCheckOrderIds = () => {
      return buyOrders
        .filter((item) => item.transactionHash === "0x" && Boolean(item.queueId))
        .map((item) => String(item._id || "").trim())
        .filter(Boolean);
    };

    const isQueueCheckingOrder = (orderId: string) => {
      return checkingQueueOrderIds.includes(String(orderId || ""));
    };

    const syncQueueTransactionHashes = async (targetOrderIds?: string[]) => {
      const candidateOrderIds = targetOrderIds?.length
        ? targetOrderIds
        : getPendingQueueCheckOrderIds();

      const orderIds = Array.from(
        new Set(
          candidateOrderIds
            .map((orderId) => String(orderId || "").trim())
            .filter(Boolean)
        )
      );

      if (orderIds.length === 0) {
        toast("점검할 queueId 주문이 없습니다.");
        return;
      }

      setCheckingQueueTx(true);
      setCheckingQueueOrderIds(orderIds);
      setQueueCheckSummary("");

      try {
        const chunkSize = 20;
        const orderIdChunks: string[][] = [];
        for (let i = 0; i < orderIds.length; i += chunkSize) {
          orderIdChunks.push(orderIds.slice(i, i + chunkSize));
        }

        const results: QueueTransactionCheckResult[] = [];
        let checkedCount = 0;
        let updatedCount = 0;
        let requeuedCount = 0;
        let pendingCount = 0;
        let failedCount = 0;

        for (const orderIdChunk of orderIdChunks) {
          const response = await fetch("/api/order/checkQueueTransactionHash", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              storecode,
              orderIds: orderIdChunk,
              retryFailed: true,
            }),
          });

          let data: any = null;
          try {
            data = await response.json();
          } catch (error) {
            data = null;
          }

          if (!response.ok || !data?.result) {
            throw new Error(data?.error || data?.message || "TXID 점검 API 호출 실패");
          }

          const chunkResults: QueueTransactionCheckResult[] = Array.isArray(data?.result?.results)
            ? data.result.results
            : [];
          const chunkSummary = data?.result?.summary || {};

          results.push(...chunkResults);
          checkedCount += Number(chunkSummary?.checkedCount || chunkResults.length || 0);
          updatedCount += Number(chunkSummary?.updatedCount || 0);
          requeuedCount += Number(chunkSummary?.requeuedCount || 0);
          pendingCount += Number(chunkSummary?.pendingCount || 0);
          failedCount += Number(chunkSummary?.failedCount || 0);
        }

        const banners: Record<string, QueueCheckBanner> = {};
        const transactionHashByOrderId = new Map<string, string>();
        const queueIdByOrderId = new Map<string, string>();

        for (const item of results) {
          const orderId = String(item?.orderId || "").trim();
          if (!orderId) {
            continue;
          }

          const txHash = String(item?.transactionHash || "").trim();
          if (txHash && txHash !== "0x") {
            transactionHashByOrderId.set(orderId, txHash);
          }

          if (item?.status === "updated" && item?.updated) {
            banners[orderId] = {
              tone: "success",
              message: txHash
                ? `TX 업데이트 완료: ${txHash.slice(0, 10)}...${txHash.slice(-8)}`
                : "TX 업데이트 완료",
            };
            continue;
          }

          if (item?.status === "updated" || item?.status === "already-has-hash") {
            banners[orderId] = {
              tone: "success",
              message: item?.message || "이미 동기화된 주문입니다.",
            };
            continue;
          }

          if (item?.status === "pending") {
            banners[orderId] = {
              tone: "warning",
              message: item?.message || "아직 처리 중인 queue 입니다.",
            };
            continue;
          }

          if (item?.status === "requeued") {
            const retryQueueId = String(
              item?.retryTransactionId || item?.queueId || ""
            ).trim();
            if (retryQueueId) {
              queueIdByOrderId.set(orderId, retryQueueId);
            }
            banners[orderId] = {
              tone: "warning",
              message: item?.message || "실패 건을 새 queue로 재전송했습니다.",
            };
            continue;
          }

          banners[orderId] = {
            tone: "error",
            message: item?.message || "queue 조회 중 오류가 발생했습니다.",
          };
        }

        if (Object.keys(banners).length > 0) {
          setQueueCheckResultsByOrderId((prev) => ({
            ...prev,
            ...banners,
          }));
        }

        if (transactionHashByOrderId.size > 0 || queueIdByOrderId.size > 0) {
          setBuyOrders((prev) =>
            prev.map((order) => {
              const nextHash = transactionHashByOrderId.get(String(order._id));
              const nextQueueId = queueIdByOrderId.get(String(order._id));
              if (!nextHash && !nextQueueId) {
                return order;
              }
              return {
                ...order,
                transactionHash: nextHash || order.transactionHash,
                queueId: nextQueueId || order.queueId,
              };
            })
          );
        }

        if (checkedCount <= 0) {
          checkedCount = results.length;
        }

        const summaryMessage = `점검 ${checkedCount}건 · 업데이트 ${updatedCount}건 · 재전송 ${requeuedCount}건 · 대기 ${pendingCount}건 · 실패 ${failedCount}건`;
        setQueueCheckSummary(summaryMessage);

        if (updatedCount > 0 || requeuedCount > 0) {
          toast.success(summaryMessage);
        } else if (failedCount > 0) {
          toast.error(summaryMessage);
        } else {
          toast(summaryMessage);
        }
      } catch (error) {
        console.error("syncQueueTransactionHashes error", error);
        const errorMessage =
          error instanceof Error && error.message
            ? error.message
            : "queue 점검 중 오류가 발생했습니다.";
        setQueueCheckSummary(errorMessage);
        toast.error(errorMessage);
      } finally {
        setCheckingQueueTx(false);
        setCheckingQueueOrderIds([]);
      }
    };

    const fetchBuyOrders = useCallback(async () => {

      if (!normalizedStorecode) {
        return;
      }

      if (!activeAccount || !address) {
        setBuyOrders([]);
        setTotalCount(0);
        setTotalClearanceCount(0);
        setTotalClearanceAmount(0);
        setTotalClearanceAmountKRW(0);
        setBuyOrdersReadMessage("관리자 지갑 연결 후 청산내역을 조회할 수 있습니다.");
        setHasFetchedBuyOrdersOnce(false);
        setLoadingFetchBuyOrders(false);
        return;
      }

      setLoadingFetchBuyOrders(true);
      setBuyOrdersReadMessage("");

      try {
        const response = await postCenterStoreAdminSignedJson({
          account: activeAccount,
          route: '/api/order/getAllCollectOrdersForSeller',
          storecode: normalizedStorecode,
          requesterWalletAddress: address,
          body: {
            lang: params.lang,
            storecode: normalizedStorecode,
            limit: Number(limitValue),
            page: Number(pageValue),
            walletAddress: address,
            searchMyOrders,
            privateSale: true,
            fromDate: searchFromDate,
            toDate: searchToDate,
          },
        });

        const data = await response.json().catch(() => null);

        if (!response.ok || !data?.result) {
          setBuyOrders([]);
          setTotalCount(0);
          setTotalClearanceCount(0);
          setTotalClearanceAmount(0);
          setTotalClearanceAmountKRW(0);
          setHasFetchedBuyOrdersOnce(false);
          setBuyOrdersReadMessage(
            data?.error
              || "청산내역을 불러오지 못했습니다. 관리자 지갑 권한을 확인해 주세요."
          );
          return;
        }

        setBuyOrders(data.result.orders || []);
        setTotalCount(data.result.totalCount || 0);
        setTotalClearanceCount(data.result.totalClearanceCount || 0);
        setTotalClearanceAmount(data.result.totalClearanceAmount || 0);
        setTotalClearanceAmountKRW(data.result.totalClearanceAmountKRW || 0);
        setHasFetchedBuyOrdersOnce(true);
      } catch (error) {
        console.error('fetchBuyOrders error', error);
        setBuyOrders([]);
        setTotalCount(0);
        setTotalClearanceCount(0);
        setTotalClearanceAmount(0);
        setTotalClearanceAmountKRW(0);
        setHasFetchedBuyOrdersOnce(false);
        setBuyOrdersReadMessage('청산내역을 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoadingFetchBuyOrders(false);
      }

    }, [
      normalizedStorecode,
      activeAccount,
      address,
      params.lang,
      limitValue,
      pageValue,
      searchMyOrders,
      searchFromDate,
      searchToDate,
    ]);




    useEffect(() => {

        if (!normalizedStorecode) {
          return;
        }
        
        

  
        fetchBuyOrders();

        // fetch sell orders every 10 seconds
      
        const interval = setInterval(() => {
          fetchBuyOrders();
        }, 10000);

        return () => clearInterval(interval);


    }, [fetchBuyOrders, normalizedStorecode]);





    const [isModalOpen, setModalOpen] = useState(false);
    const [clearanceOrderPreview, setClearanceOrderPreview] = useState<ClearanceOrderPreview | null>(null);
    const [loadingClearanceOrderPreview, setLoadingClearanceOrderPreview] = useState(false);

    const closeModal = () => {
      setModalOpen(false);
      setLoadingClearanceOrderPreview(false);
      setClearanceOrderPreview(null);
    };
    const openModal = () => setModalOpen(true);
    const [withdrawConfirmTarget, setWithdrawConfirmTarget] = useState<{
      index: number;
      order: BuyOrder;
    } | null>(null);
    const [cancelConfirmTarget, setCancelConfirmTarget] = useState<{
      index: number;
      order: BuyOrder;
    } | null>(null);

    const [usdtAmount, setUsdtAmount] = useState(0);

    const [defaultKrWAmount, setDefaultKrwAmount] = useState(0);

    const [krwAmount, setKrwAmount] = useState(0);

    console.log('usdtAmount', usdtAmount);


 

    useEffect(() => {

      if (usdtAmount === 0) {

        setDefaultKrwAmount(0);

        setKrwAmount(0);

        return;
      }
    
        
      setDefaultKrwAmount( Math.round(usdtAmount * rate) );


      setKrwAmount( Math.round(usdtAmount * rate) );

    } , [usdtAmount, rate]);









    const [privateBuyOrder, setprivateBuyOrder] = useState(true);


    const [buyOrdering, setBuyOrdering] = useState(false);

    const [agreementPlaceOrder, setAgreementPlaceOrder] = useState(false);


    // check input krw amount at sell order
    const [checkInputKrwAmount, setCheckInputKrwAmount] = useState(true);
    const safeKrwAmount = Number.isFinite(krwAmount) ? krwAmount : 0;


    const [buyerBankInfo, setBuyerBankInfo] = useState({
      depositName: "",
      bankName: "",
      accountNumber: "",
      accountHolder: "",
    });

    const [withdrawalBankInfo, setWithdrawalBankInfo] = useState({
      bankName: "",
      accountNumber: "",
      accountHolder: "",
    });

    const buildClearanceOrderRequestPayload = () => {
      let orderUsdtAmount = usdtAmount;

      if (checkInputKrwAmount) {
        orderUsdtAmount = parseFloat(Number(safeKrwAmount / rate).toFixed(2));
      }

      const clearanceWalletAddress = normalizeStringValue(store?.privateSaleWalletAddress || store?.sellerWalletAddress);
      const requesterWalletAddress = normalizeWalletAddressForSignature(address);
      const clearanceWalletAddressForSignature = normalizeWalletAddressForSignature(clearanceWalletAddress);
      const signatureUsdtAmount = Number(orderUsdtAmount);
      const signatureKrwAmount = Number(safeKrwAmount);
      const signatureRate = Number(rate);

      return {
        requesterWalletAddress,
        clearanceWalletAddress,
        clearanceWalletAddressForSignature,
        signatureUsdtAmount,
        signatureKrwAmount,
        signatureRate,
        body: {
          storecode: normalizedStorecode,
          walletAddress: clearanceWalletAddressForSignature,
          sellerBankInfo: {
            bankName: withdrawalBankInfo.bankName,
            accountNumber: withdrawalBankInfo.accountNumber,
            accountHolder: withdrawalBankInfo.accountHolder,
          },
          usdtAmount: signatureUsdtAmount,
          krwAmount: signatureKrwAmount,
          rate: signatureRate,
          privateSale: true,
          buyer: {
            bankInfo: {
              bankName: buyerBankInfo.bankName,
              accountNumber: buyerBankInfo.accountNumber,
              accountHolder: buyerBankInfo.accountHolder,
            },
          },
        },
      };
    };

    const validateClearanceOrderRequestPayload = (payload: ReturnType<typeof buildClearanceOrderRequestPayload>) => {
      if (
        !normalizedStorecode
        || !payload.clearanceWalletAddress
        || !payload.requesterWalletAddress
        || !payload.clearanceWalletAddressForSignature
        || !Number.isFinite(payload.signatureUsdtAmount) || payload.signatureUsdtAmount <= 0
        || !Number.isFinite(payload.signatureKrwAmount) || payload.signatureKrwAmount <= 0
        || !Number.isFinite(payload.signatureRate) || payload.signatureRate <= 0
      ) {
        return false;
      }

      return true;
    };

    const openBuyOrderPreviewModal = async () => {
      if (buyOrdering || loadingClearanceOrderPreview) {
        return;
      }

      if (!address || !activeAccount) {
        toast.error('지갑 연결이 필요합니다.');
        return;
      }

      if (!isAdminUser) {
        toast.error('관리자 권한(role=admin)에서만 매입신청이 가능합니다.');
        return;
      }

      if (agreementPlaceOrder === false) {
        toast.error('거래 조건 동의가 필요합니다.');
        return;
      }

      if (safeKrwAmount <= 0) {
        toast.error('매입금액을 입력해주세요.');
        return;
      }

      const payload = buildClearanceOrderRequestPayload();
      if (!validateClearanceOrderRequestPayload(payload)) {
        toast.error('매입신청 요청 파라미터가 올바르지 않습니다.');
        return;
      }

      setLoadingClearanceOrderPreview(true);

      try {
        const response = await postAdminSignedJson({
          account: activeAccount,
          route: '/api/order/getClearanceOrderPreview',
          signingPrefix: GET_CLEARANCE_ORDER_PREVIEW_SIGNING_PREFIX,
          requesterStorecode: 'admin',
          requesterWalletAddress: payload.requesterWalletAddress,
          body: payload.body,
        });

        const data = await response.json().catch(() => null);

        if (!response.ok || !data?.result) {
          toast.error(
            typeof data?.error === 'string' && data.error.trim()
              ? data.error.trim()
              : '매입신청 미리 계산 정보를 불러오지 못했습니다.',
          );
          return;
        }

        setClearanceOrderPreview(data.result as ClearanceOrderPreview);
        openModal();
      } catch (error) {
        toast.error(
          error instanceof Error && error.message
            ? error.message
            : '매입신청 미리 계산 중 오류가 발생했습니다.',
        );
      } finally {
        setLoadingClearanceOrderPreview(false);
      }
    };

    const handlePlaceOrderClick = () => {
      if (isEmbedded) {
        buyOrder();
        return;
      }

      openBuyOrderPreviewModal();
    };

    const buyOrder = async () => {

      if (buyOrdering) {
        return;
      }

      if (!address || !activeAccount) {
        toast.error('지갑 연결이 필요합니다.');
        return;
      }

      if (!isAdminUser) {
        toast.error('관리자 권한(role=admin)에서만 매입신청이 가능합니다.');
        return;
      }

      if (agreementPlaceOrder === false) {
        toast.error('You must agree to the terms and conditions');
        return;
      }

      if (safeKrwAmount <= 0) {
        toast.error('매입금액을 입력해주세요.');
        return;
      }

      setBuyOrdering(true);

      const payload = buildClearanceOrderRequestPayload();

      if (!validateClearanceOrderRequestPayload(payload)) {
        setBuyOrdering(false);
        toast.error('매입신청 요청 파라미터가 올바르지 않습니다.');
        return;
      }

      const response = await postAdminSignedJson({
        account: activeAccount,
        route: '/api/order/setBuyOrderForClearance',
        signingPrefix: SET_BUY_ORDER_FOR_CLEARANCE_SIGNING_PREFIX,
        requesterStorecode: 'admin',
        requesterWalletAddress: payload.requesterWalletAddress,
        body: payload.body,
      });

      ////console.log('buyOrder response', response);

      if (!response.ok) {
        setBuyOrdering(false);
        let errorMessage = '주문을 처리하는 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
        try {
          const errorData = await response.json();
          if (typeof errorData?.error === 'string' && errorData.error.trim()) {
            errorMessage = errorData.error.trim();
          }
        } catch {
          // Ignore JSON parse failures and keep fallback message.
        }
        toast.error(errorMessage);
        return;
      }

      const data = await response.json();

      //console.log('data', data);

      if (data.result) {

        toast.success(
          Order_has_been_placed
        );

        setUsdtAmount(0);
        setKrwAmount(0);
        setprivateBuyOrder(false);

        setAgreementPlaceOrder(false);
     

        await fetchBuyOrders();


      } else {
        toast.error('Order has been failed');
      }

      setBuyOrdering(false);

    };




    
    /*
    const [cancellings, setCancellings] = useState([] as boolean[]);
    useEffect(() => {
      setCancellings(buyOrders.map(() => false));
    }, [buyOrders]);



    const cancelBuyOrder = async (orderId: string, index: number) => {

      if (cancellings[index]) {
        return;
      }

      setCancellings(cancellings.map((item, i) => i === index ? true : item));

      const response = await fetch('/api/order/cancelBuyOrder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          orderId: orderId,
          walletAddress: address
        })
      });

      const data = await response.json();

      ///console.log('data', data);

      if (data.result) {
        toast.success(Order_has_been_cancelled);


        fetchBuyOrders();


      } else {
        toast.error('Order has been failed');
      }

      setCancellings(cancellings.map((item, i) => i === index ? false : item));

    }
    */










    // cancel buy order state
    const [cancellings, setCancellings] = useState([] as boolean[]);
    useEffect(() => {
      setCancellings(
        buyOrders.map(() => false)
      );
    }, [buyOrders]);



    const cancelTrade = async (orderId: string, index: number) => {



      if (cancellings[index]) {
        return;
      }



      setCancellings(cancellings.map((item, i) => i === index ? true : item));

      //const response = await fetch('/api/order/cancelTradeByBuyer', {

      const response = await fetch('/api/order/cancelTradeBySeller', {

        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          orderId: orderId,
          storecode: storecode,
          walletAddress: address,
          cancelTradeReason: "cancelled by seller",
        })
      });

      const data = await response.json();

      ///console.log('data', data);

      if (data.result) {
        toast.success(Order_has_been_cancelled);


        setBuyOrders(
          buyOrders.map((item, i) => {
            if (i === index) {
              return {
                ...item,
                status: 'cancelled',
                canceller: 'seller',
                cancelledAt: new Date().toISOString(),
              };
            }
            return item;
          })
        );

        /*
        //await fetch('/api/order/getAllBuyOrders', {
        await fetch('/api/order/getAllCollectOrdersForSeller', {

          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            body: JSON.stringify({
              lang: params.lang,
              limit: Number(limitValue),
              page: Number(pageValue),
              storecode: storecode,
              //storecode: "admin",
              walletAddress: address,
              searchMyOrders: searchMyOrders,
              privateSale: true,
              fromDate: searchFromDate,
              toDate: searchToDate
        })
          })
        }).then(async (response) => {
          const data = await response.json();
          //console.log('data', data);
          if (data.result) {
            setBuyOrders(data.result.orders);
            setTotalCount(data.result.totalCount);
            setTotalClearanceCount(data.result.totalClearanceCount);
            setTotalClearanceAmount(data.result.totalClearanceAmount);
            setTotalClearanceAmountKRW(data.result.totalClearanceAmountKRW);
          }
        });
        */

      } else {
        toast.error('실패했습니다. 잠시 후 다시 시도해주세요.');
      }

      setCancellings(cancellings.map((item, i) => i === index ? false : item));

    }










    // request payment check box
    const [requestPaymentCheck, setRequestPaymentCheck] = useState([] as boolean[]);
    useEffect(() => {
        
        setRequestPaymentCheck(
          new Array(buyOrders.length).fill(false)
        );
  
    } , [buyOrders]);
    




    // array of escrowing
    const [escrowing, setEscrowing] = useState([] as boolean[]);

    useEffect(() => {
        
        setEscrowing(
          new Array(buyOrders.length).fill(false)
        );
  
    } , [buyOrders]);





    // array of requestingPayment
    const [requestingPayment, setRequestingPayment] = useState([] as boolean[]);

    useEffect(() => {

      setRequestingPayment(

        new Array(buyOrders.length).fill(false)

      );

    } , [buyOrders]);





  // array of confirmingPayment

  const [confirmingPayment, setConfirmingPayment] = useState([] as boolean[]);

  useEffect(() => {
      
      setConfirmingPayment(
        new Array(buyOrders.length).fill(false)
      );

  } , [buyOrders]);



  // confirm payment check box
  const [confirmPaymentCheck, setConfirmPaymentCheck] = useState([] as boolean[]);
  useEffect(() => {
      
      setConfirmPaymentCheck(
        new Array(buyOrders.length).fill(false)
      );

  } , [buyOrders]);





  // payment amoount array
  const [paymentAmounts, setPaymentAmounts] = useState([] as number[]);
  useEffect(() => {

    // default payment amount is from buyOrders krwAmount
      
    setPaymentAmounts(
      buyOrders.map((item) => item.krwAmount)
      );

  } , [buyOrders]);



  const confirmPayment = async (

    index: number,
    orderId: string,
    paymentAmount: number,

  ) => {
    // confirm payment
    // send usdt to buyer wallet address

    if (confirmingPayment[index]) {
      return;
    }

    setConfirmingPayment(
      confirmingPayment.map((item, idx) => {
        if (idx === index) {
          return true;
        }
        return item;
      })
    );



    const response = await fetch('/api/order/confirmPayment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        lang: params.lang,
        chain: storecode,
        orderId: orderId,
        paymentAmount: paymentAmount,
      })
    });

    const data = await response.json();

    //console.log('data', data);

    if (data.result) {
      
      fetchBuyOrders();

      toast.success(Payment_has_been_confirmed);

    } else {
      toast.error('Payment has been failed');
    }

    setConfirmingPayment(
      confirmingPayment.map((item, idx) => {
        if (idx === index) {
          return false;
        }
        return item;
      })
    );

  }








  // buyOrderDepositCompleted
  const [loadingDeposit, setLoadingDeposit] = useState([] as boolean[]);
  useEffect(() => {
    setLoadingDeposit([]);
    const newArray: boolean[] = [];
    for (let i = 0; i < buyOrders.length; i++) {
      newArray.push(false);
    }
    setLoadingDeposit(newArray);
  } , [buyOrders.length]);




  const buyOrderDepositCompleted = async (index: number, orderId: string) => {
    // call API to set deposit completed
    // update the state to reflect the change

    if (loadingDeposit[index]) {
      return false;
    }

    if (!activeAccount || !address) {
      toast.error('관리자 지갑을 연결해주세요.');
      return false;
    }

    setLoadingDeposit((prev) =>
      prev.map((item, idx) => idx === index ? true : item)
    );

    try {
      const response = await postAdminSignedJson({
        account: activeAccount,
        route: '/api/order/buyOrderDepositCompleted',
        signingPrefix: BUY_ORDER_DEPOSIT_COMPLETED_SIGNING_PREFIX,
        requesterWalletAddress: address,
        body: {
          orderId: orderId,
        },
      });
      const responseData = await response.json().catch(() => ({}));
      
      if (!response.ok) {
        setLoadingDeposit((prev) =>
          prev.map((item, idx) => idx === index ? false : item)
        );
        toast.error(responseData?.error || 'Failed to set deposit completed');
        return false;
      }

      setLoadingDeposit(
        prev => prev.map((item, idx) => idx === index ? false : item)
      );

      setBuyOrders(
        prev => prev.map((item, idx) => {
          if (idx === index) {
            return {
              ...item,
              //buyer.depositCompleted
              buyer: {
                ...item.buyer,
                depositCompleted: true,
                depositCompletedAt:
                  responseData?.result?.buyer?.depositCompletedAt
                  || item?.buyer?.depositCompletedAt
                  || new Date().toISOString(),
                depositCompletedBy:
                  responseData?.result?.buyer?.depositCompletedBy
                  || item?.buyer?.depositCompletedBy
                  || null,
              },
            };
          }
          return item;
        })
      );

      if (responseData?.result?.alreadyCompleted) {
        toast.success('이미 출금완료 처리된 주문입니다.');
      }

      return true;
    } catch (error) {
      console.error('buyOrderDepositCompleted error', error);
      setLoadingDeposit((prev) =>
        prev.map((item, idx) => idx === index ? false : item)
      );
      toast.error('출금 완료 처리 중 오류가 발생했습니다.');
      return false;
    }

    


    /*
    //await fetch('/api/order/getAllBuyOrders', {
    await fetch('/api/order/getAllCollectOrdersForSeller', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        lang: params.lang,
        limit: Number(limitValue),
        page: Number(pageValue),
        storecode: storecode,
        walletAddress: address,
        searchMyOrders: searchMyOrders,
        privateSale: true,
        fromDate: searchFromDate,
        toDate: searchToDate,

      })
    }).then(async (response) => {
      const data = await response.json();
      //console.log('data', data);
      if (data.result) {
        setBuyOrders(data.result.orders);
        setTotalCount(data.result.totalCount);
        setTotalClearanceCount(data.result.totalClearanceCount);
        setTotalClearanceAmount(data.result.totalClearanceAmount);
        setTotalClearanceAmountKRW(data.result.totalClearanceAmountKRW);
      }
    });
    */


  }

  const deleteWebhookGeneratedClearanceOrder = async (order: BuyOrder) => {
    const orderId = String(order?._id || "").trim();
    if (!orderId) {
      return false;
    }

    if (!activeAccount || !address) {
      toast.error("관리자 지갑을 연결해주세요.");
      return false;
    }

    if (!isAdminUser) {
      toast.error("관리자 권한(role=admin)에서만 삭제할 수 있습니다.");
      return false;
    }

    if (!isWithdrawalWebhookGeneratedClearanceOrderDeletable(order)) {
      toast.error("이 주문은 더 이상 삭제 가능한 상태가 아닙니다.");
      return false;
    }

    const confirmed = window.confirm(
      `은행출금 webhook 생성 청산주문 #${order.tradeId || orderId} 을(를) 삭제하시겠습니까?\n\n삭제 후 복구할 수 없습니다.`,
    );

    if (!confirmed) {
      return false;
    }

    setDeletingWebhookOrderIds((prev) => Array.from(new Set([...prev, orderId])));

    try {
      const response = await postAdminSignedJson({
        account: activeAccount,
        route: "/api/order/deleteWebhookGeneratedClearanceOrder",
        signingPrefix: DELETE_WEBHOOK_CLEARANCE_ORDER_SIGNING_PREFIX,
        requesterWalletAddress: address,
        body: {
          orderId,
          deleteReason: "not_a_clearance_withdrawal",
        },
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        toast.error(data?.error || "청산주문 삭제에 실패했습니다.");
        return false;
      }

      toast.success(`청산주문 #${order.tradeId || orderId} 삭제 완료`);
      await fetchBuyOrders();
      return true;
    } catch (error) {
      console.error("deleteWebhookGeneratedClearanceOrder error", error);
      toast.error("청산주문 삭제 중 오류가 발생했습니다.");
      return false;
    } finally {
      setDeletingWebhookOrderIds((prev) =>
        prev.filter((item) => item !== orderId),
      );
    }
  };

  const cancelClearanceOrderByAdmin = async (index: number, order: BuyOrder) => {
    const orderId = String(order?._id || "").trim();
    if (!orderId) {
      toast.error("주문 정보를 확인할 수 없습니다.");
      return false;
    }

    if (cancellingClearanceOrderIds.includes(orderId)) {
      return false;
    }

    if (!activeAccount || !address) {
      toast.error("관리자 지갑을 연결해주세요.");
      return false;
    }

    setCancellingClearanceOrderIds((prev) => Array.from(new Set([...prev, orderId])));

    try {
      const response = await postAdminSignedJson({
        account: activeAccount,
        route: "/api/order/cancelClearanceOrderByAdmin",
        signingPrefix: CANCEL_CLEARANCE_ORDER_SIGNING_PREFIX,
        requesterWalletAddress: address,
        body: {
          orderId,
          cancelReason: "cancelled_by_admin_clearance_management",
        },
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        toast.error(data?.error || "청산주문 취소에 실패했습니다.");
        return false;
      }

      setBuyOrders((prev) =>
        prev.map((item, itemIndex) => {
          if (itemIndex !== index && item._id !== orderId) {
            return item;
          }

          return {
            ...item,
            status: "cancelled",
            canceller: "admin",
            cancelledAt:
              data?.result?.order?.cancelledAt
              || item.cancelledAt
              || new Date().toISOString(),
          };
        }),
      );

      if (data?.result?.alreadyCancelled) {
        toast.success("이미 취소된 청산주문입니다.");
      } else {
        toast.success(`청산주문 #${order.tradeId || orderId} 취소 완료`);
      }

      await fetchBuyOrders();
      return true;
    } catch (error) {
      console.error("cancelClearanceOrderByAdmin error", error);
      toast.error("청산주문 취소 중 오류가 발생했습니다.");
      return false;
    } finally {
      setCancellingClearanceOrderIds((prev) =>
        prev.filter((item) => item !== orderId),
      );
    }
  };


  const openWithdrawConfirmModal = (index: number, order: BuyOrder) => {
    if (loadingDeposit[index]) {
      return;
    }
    setWithdrawConfirmTarget({
      index,
      order,
    });
  };

  const closeWithdrawConfirmModal = () => {
    setWithdrawConfirmTarget(null);
  };

  const openCancelConfirmModal = (index: number, order: BuyOrder) => {
    const orderId = String(order?._id || "").trim();
    if (!orderId) {
      return;
    }
    if (loadingDeposit[index] || cancellingClearanceOrderIds.includes(orderId)) {
      return;
    }
    setCancelConfirmTarget({
      index,
      order,
    });
  };

  const closeCancelConfirmModal = () => {
    setCancelConfirmTarget(null);
  };

  const confirmWithdrawDepositCompleted = async () => {
    if (!withdrawConfirmTarget) {
      return;
    }

    const isSuccess = await buyOrderDepositCompleted(
      withdrawConfirmTarget.index,
      withdrawConfirmTarget.order._id
    );

    if (isSuccess) {
      toast.success('출금 완료 처리되었습니다.');
      closeWithdrawConfirmModal();
    }
  };

  const confirmCancelClearanceOrder = async () => {
    if (!cancelConfirmTarget) {
      return;
    }

    const isSuccess = await cancelClearanceOrderByAdmin(
      cancelConfirmTarget.index,
      cancelConfirmTarget.order,
    );

    if (isSuccess) {
      closeCancelConfirmModal();
    }
  };



    // get store by storecode
    const [fetchingStore, setFetchingStore] = useState(false);
    const [store, setStore] = useState<any>(null);
    const fetchingStoreRef = useRef(false);
    const [withdrawalRealtimeEvents, setWithdrawalRealtimeEvents] =
      useState<ClearanceWithdrawalRealtimeItem[]>([]);
    const [withdrawalRealtimeConnectionState, setWithdrawalRealtimeConnectionState] =
      useState<Ably.ConnectionState>("initialized");
    const [withdrawalRealtimeConnectionError, setWithdrawalRealtimeConnectionError] =
      useState<string | null>(null);
    const [withdrawalRealtimeSyncError, setWithdrawalRealtimeSyncError] =
      useState<string | null>(null);
    const [withdrawalRealtimeSyncing, setWithdrawalRealtimeSyncing] = useState(false);
    const [withdrawalRealtimeLastSyncedAt, setWithdrawalRealtimeLastSyncedAt] =
      useState<string | null>(null);
    const [withdrawalRealtimeNowMs, setWithdrawalRealtimeNowMs] = useState(() => Date.now());
    const withdrawalRealtimeClientIdRef = useRef(
      `clearance-management-${Math.random().toString(36).slice(2, 10)}`,
    );
    
    const fetchStore = useCallback(async () => {
        if (fetchingStoreRef.current || !normalizedStorecode) {
          return;
        }

        fetchingStoreRef.current = true;
        setFetchingStore(true);
        setStoreReadMessage("");
        setHasPrivilegedStoreRead(false);

        try {
          let response: Response | null = null;
          let usedPrivilegedStoreRead = false;
          let nextStoreReadMessage = "";

          if (activeAccount && address) {
            response = await postCenterStoreAdminSignedJson({
              account: activeAccount,
              route: '/api/store/getOneStore',
              storecode: normalizedStorecode,
              requesterWalletAddress: address,
              body: {
                storecode: normalizedStorecode,
              },
            });

            if (response.ok) {
              usedPrivilegedStoreRead = true;
            } else {
              nextStoreReadMessage = "가맹점 민감정보를 불러오지 못했습니다. 관리자 지갑 권한을 확인해 주세요.";
            }
          } else {
            nextStoreReadMessage = "관리자 지갑 연결 후 구매자 계좌 정보를 확인할 수 있습니다.";
          }

          if (!response || !response.ok) {
            response = await fetch('/api/store/getOneStore', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                storecode: normalizedStorecode,
              }),
            });
          }

          if (!response.ok) {
            setStore(null);
            setBuyerBankInfo({
              depositName: "",
              bankName: "",
              accountNumber: "",
              accountHolder: "",
            });
            setWithdrawalBankInfo({
              bankName: "",
              accountNumber: "",
              accountHolder: "",
            });
            setStoreReadMessage(nextStoreReadMessage || "가맹점 정보를 불러오지 못했습니다.");
            return;
          }

          const data = await response.json();
          const nextStore = data?.result || null;

          setStore(nextStore);
          setHasPrivilegedStoreRead(usedPrivilegedStoreRead);
          setStoreReadMessage(usedPrivilegedStoreRead ? "" : nextStoreReadMessage);

          setBuyerBankInfo({
            depositName: "",
            bankName: nextStore?.bankInfo?.bankName || "",
            accountNumber: nextStore?.bankInfo?.accountNumber || "",
            accountHolder: nextStore?.bankInfo?.accountHolder || "",
          });

          setWithdrawalBankInfo({
            bankName: nextStore?.withdrawalBankInfo?.bankName || "",
            accountNumber: nextStore?.withdrawalBankInfo?.accountNumber || "",
            accountHolder: nextStore?.withdrawalBankInfo?.accountHolder || "",
          });

          return nextStore;
        } catch (error) {
          console.error("Error fetching store data:", error);
          setStore(null);
          setBuyerBankInfo({
            depositName: "",
            bankName: "",
            accountNumber: "",
            accountHolder: "",
          });
          setWithdrawalBankInfo({
            bankName: "",
            accountNumber: "",
            accountHolder: "",
          });
          setStoreReadMessage(
            activeAccount && address
              ? "가맹점 민감정보를 불러오는 중 오류가 발생했습니다."
              : "관리자 지갑 연결 후 구매자 계좌 정보를 확인할 수 있습니다."
          );
          return;
        } finally {
          fetchingStoreRef.current = false;
          setFetchingStore(false);
        }
    }, [normalizedStorecode, activeAccount, address]);

    useEffect(() => {

        fetchStore();

    } , [fetchStore]);

    useEffect(() => {
      if (!isHistoryOnly || !normalizedStorecode) {
        setWithdrawalRealtimeEvents([]);
        return;
      }

      const cursorRef: { current: string | null } = { current: null };

      const upsertRealtimeEvents = (
        incomingEvents: BankTransferDashboardEvent[],
        options?: { highlightNew?: boolean },
      ) => {
        if (incomingEvents.length === 0) {
          return;
        }

        const now = Date.now();
        const highlightNew = options?.highlightNew ?? true;

        setWithdrawalRealtimeEvents((previousEvents) => {
          const map = new Map(previousEvents.map((item) => [item.id, item]));

          for (const incomingEvent of incomingEvents) {
            const nextId =
              String(incomingEvent.eventId || incomingEvent.cursor || "").trim()
              || `${incomingEvent.traceId || "withdraw"}-${incomingEvent.publishedAt || Date.now()}`;

            const existing = map.get(nextId);
            if (existing) {
              map.set(nextId, {
                ...existing,
                data: incomingEvent,
              });
              continue;
            }

            map.set(nextId, {
              id: nextId,
              data: incomingEvent,
              receivedAt: new Date().toISOString(),
              highlightUntil: highlightNew ? now + CLEARANCE_WITHDRAWAL_HIGHLIGHT_MS : 0,
            });
          }

          return Array.from(map.values())
            .sort((left, right) => {
              const rightTs = Math.max(
                toSafeTimestamp(right.data.processingDate),
                toSafeTimestamp(right.data.transactionDate),
                toSafeTimestamp(right.data.publishedAt),
              );
              const leftTs = Math.max(
                toSafeTimestamp(left.data.processingDate),
                toSafeTimestamp(left.data.transactionDate),
                toSafeTimestamp(left.data.publishedAt),
              );
              return rightTs - leftTs;
            })
            .slice(0, CLEARANCE_WITHDRAWAL_MAX_EVENTS);
        });
      };

      const syncRealtimeEvents = async (sinceCursor?: string | null) => {
        const params = new URLSearchParams({
          public: "1",
          limit: String(CLEARANCE_WITHDRAWAL_RESYNC_LIMIT),
        });

        const nextCursor = sinceCursor ?? cursorRef.current;
        if (nextCursor) {
          params.set("since", nextCursor);
        }

        setWithdrawalRealtimeSyncing(true);

        try {
          const response = await fetch(`/api/realtime/banktransfer/events?${params.toString()}`, {
            method: "GET",
            cache: "no-store",
          });

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }

          const data = await response.json();
          const incomingEvents = Array.isArray(data?.events)
            ? (data.events as BankTransferDashboardEvent[]).filter((event) => {
                return (
                  normalizeBankTransferTransactionType(event?.transactionType) === "withdrawn"
                  && String(event?.storecode || "").trim() === normalizedStorecode
                );
              })
            : [];

          upsertRealtimeEvents(incomingEvents, { highlightNew: Boolean(nextCursor) });

          if (typeof data?.nextCursor === "string" && data.nextCursor) {
            cursorRef.current = data.nextCursor;
          }

          setWithdrawalRealtimeSyncError(null);
          setWithdrawalRealtimeLastSyncedAt(new Date().toISOString());
        } catch (error) {
          setWithdrawalRealtimeSyncError(
            error instanceof Error ? error.message : "withdrawal realtime sync failed",
          );
        } finally {
          setWithdrawalRealtimeSyncing(false);
        }
      };

      const realtime = new Ably.Realtime({
        authUrl: `/api/realtime/ably-token?public=1&stream=banktransfer&clientId=${withdrawalRealtimeClientIdRef.current}`,
      });
      const channel = realtime.channels.get(BANKTRANSFER_ABLY_CHANNEL);

      const onConnectionStateChange = (stateChange: Ably.ConnectionStateChange) => {
        setWithdrawalRealtimeConnectionState(stateChange.current);
        if (stateChange.reason) {
          setWithdrawalRealtimeConnectionError(stateChange.reason.message || "Ably connection error");
        } else {
          setWithdrawalRealtimeConnectionError(null);
        }

        if (stateChange.current === "connected") {
          void syncRealtimeEvents();
        }
      };

      const onMessage = (message: Ably.Message) => {
        const data = message.data as BankTransferDashboardEvent;
        if (
          normalizeBankTransferTransactionType(data?.transactionType) !== "withdrawn"
          || String(data?.storecode || "").trim() !== normalizedStorecode
        ) {
          return;
        }

        upsertRealtimeEvents(
          [
            {
              ...data,
              eventId: data?.eventId || String(message.id || ""),
            },
          ],
          { highlightNew: true },
        );
        setWithdrawalRealtimeLastSyncedAt(new Date().toISOString());
      };

      realtime.connection.on(onConnectionStateChange);
      void channel.subscribe(BANKTRANSFER_ABLY_EVENT_NAME, onMessage);
      void syncRealtimeEvents(null);

      const syncInterval = window.setInterval(() => {
        void syncRealtimeEvents();
      }, CLEARANCE_WITHDRAWAL_RESYNC_INTERVAL_MS);

      return () => {
        window.clearInterval(syncInterval);
        channel.unsubscribe(BANKTRANSFER_ABLY_EVENT_NAME, onMessage);
        realtime.connection.off(onConnectionStateChange);
        realtime.close();
      };
    }, [isHistoryOnly, normalizedStorecode]);

    useEffect(() => {
      if (!isHistoryOnly) {
        return;
      }

      const timer = window.setInterval(() => {
        setWithdrawalRealtimeNowMs(Date.now());
      }, CLEARANCE_WITHDRAWAL_CLOCK_TICK_MS);

      return () => {
        window.clearInterval(timer);
      };
    }, [isHistoryOnly]);




    // store settlementWalletAddress USDT balance
    
    const [settlementWalletBalance, setSettlementWalletBalance] = useState(0);

    useEffect(() => {

      const getSettlementWalletBalance = async () => {
        if (!store || !store.settlementWalletAddress) {
          setSettlementWalletBalance(0);
          return;
        }
        const result = await balanceOf({
          contract,
          address: store.settlementWalletAddress,
        });
 
        if (chain === 'bsc') {
          setSettlementWalletBalance( Number(result) / 10 ** 18 );
        } else {
          setSettlementWalletBalance( Number(result) / 10 ** 6 );
        }

      };

      getSettlementWalletBalance();
    }, [store, contract, store?.settlementWalletAddress]);




    // adminWalletAddress USDT balance
    /*
    const [adminWalletBalance, setAdminWalletBalance] = useState(0);
    useEffect(() => {
      const getAdminWalletBalance = async () => {
        if (!store || !store.adminWalletAddress) {
          setAdminWalletBalance(0);
          return;
        }
        const result = await balanceOf({
          contract,
          address: store.adminWalletAddress,
        });
        //console.log('adminWalletBalance result', result);
        setAdminWalletBalance(Number(result) / 10 ** 6);
      };
      getAdminWalletBalance();
    }, [store, contract]);
    */

    // sellerWalletAddress USDT balance
    const [sellerWalletBalance, setSellerWalletBalance] = useState(0);
    useEffect(() => {
      const getSellerWalletBalance = async () => {
        if (!store || !store.sellerWalletAddress) {
          setSellerWalletBalance(0);
          return;
        }
        const result = await balanceOf({
          contract,
          address: store.sellerWalletAddress,
        });

        if (chain === 'bsc') {
          setSellerWalletBalance(Number(result) / 10 ** 18);
        } else {
          setSellerWalletBalance(Number(result) / 10 ** 6);
        }
      };
      getSellerWalletBalance();
    }, [store, contract]);





    const [sellersBalance, setSellersBalance] = useState([] as any[]);
    const [loadingSellersBalance, setLoadingSellersBalance] = useState(false);
    const [refreshingSellersBalance, setRefreshingSellersBalance] = useState(false);
    const sellersBalanceStorecode = String(
      store?.storecode || normalizedStorecode || ""
    ).trim();
    
    useEffect(() => {
      let mounted = true;

      if (isHistoryOnly || !sellersBalanceStorecode) {
        setSellersBalance([]);
        setLoadingSellersBalance(false);
        setRefreshingSellersBalance(false);
        return;
      }

      const fetchSellersBalance = async ({ silent = false }: { silent?: boolean } = {}) => {
        if (!silent) {
          setLoadingSellersBalance(true);
        } else {
          setRefreshingSellersBalance(true);
        }

        try {
          const response = await fetch('/api/user/getAllStoreSellersForBalance', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(
              {
                storecode: sellersBalanceStorecode,
                limit: 100,
                page: 1,
              }
            )
          });

          if (!response.ok) {
            throw new Error(`Failed to fetch sellers balance: ${response.status}`);
          }

          const data = await response.json();
          if (!mounted) {
            return;
          }

          if (data.result) {
            setSellersBalance(data.result.users || []);
          } else {
            if (!silent) {
              setSellersBalance([]);
            }
            console.error('Error fetching sellers balance');
          }
        } catch (error) {
          if (!mounted) {
            return;
          }
          if (!silent) {
            setSellersBalance([]);
          }
          console.error('Error fetching sellers balance:', error);
        } finally {
          if (!mounted) {
            return;
          }
          if (!silent) {
            setLoadingSellersBalance(false);
          } else {
            setRefreshingSellersBalance(false);
          }
        }
      };

      setSellersBalance([]);
      fetchSellersBalance({ silent: false });

      // interval to fetch every 10 seconds without replacing current UI
      const interval = setInterval(() => {
        fetchSellersBalance({ silent: true });
      }, 10000);

      return () => {
        mounted = false;
        clearInterval(interval);
      };
    }, [sellersBalanceStorecode, isHistoryOnly]);

    const buyerBankOptions = [
      store?.bankInfo,
      store?.bankInfoAAA,
      store?.bankInfoBBB,
      store?.bankInfoCCC,
      store?.bankInfoDDD,
    ].filter((bankInfo: any) => Boolean(bankInfo?.accountNumber));

    const sellerBankOptions = [
      store?.withdrawalBankInfo,
      store?.withdrawalBankInfoAAA,
      store?.withdrawalBankInfoBBB,
    ].filter((bankInfo: any) => Boolean(bankInfo?.accountNumber));

    const getBankCardClass = (isSelected: boolean) =>
      `group relative w-full rounded-lg border px-2.5 py-2 text-left transition-all duration-200 ${
        isSelected
          ? 'border-slate-800 bg-gradient-to-r from-slate-100 to-slate-50 ring-2 ring-slate-300 shadow-[0_10px_20px_-14px_rgba(15,23,42,0.75)]'
          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
      }`;

    const getBankTagClass = (isSelected: boolean) =>
      `ml-1.5 shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold transition-colors ${
        isSelected
          ? 'border-slate-900 bg-slate-900 text-white shadow-sm'
          : 'border-slate-200 bg-slate-50 text-slate-500 group-hover:border-slate-300'
      }`;

    const withdrawConfirmOrder = withdrawConfirmTarget?.order || null;
    const withdrawConfirmLoading = withdrawConfirmTarget
      ? Boolean(loadingDeposit[withdrawConfirmTarget.index])
      : false;
    const cancelConfirmOrder = cancelConfirmTarget?.order || null;
    const cancelConfirmLoading = cancelConfirmTarget
      ? cancellingClearanceOrderIds.includes(String(cancelConfirmTarget.order?._id || "").trim())
      : false;
    const pendingQueueCheckOrderIds = getPendingQueueCheckOrderIds();
    const pendingQueueCheckCount = pendingQueueCheckOrderIds.length;
    const withdrawalRealtimeEventCount = withdrawalRealtimeEvents.length;
    const latestWithdrawalRealtimeAt = withdrawalRealtimeEvents[0]?.data?.processingDate
      || withdrawalRealtimeEvents[0]?.data?.transactionDate
      || withdrawalRealtimeEvents[0]?.data?.publishedAt
      || null;
    const withdrawalRealtimeAmountTotal = withdrawalRealtimeEvents.reduce((sum, item) => {
      return sum + Number(item?.data?.amount || 0);
    }, 0);




    
    return (

      <main className={isEmbedded
        ? 'w-full'
        : 'p-3 sm:p-4 pb-10 min-h-[100vh] flex items-start justify-center container max-w-screen-2xl mx-auto bg-gradient-to-b from-zinc-100 to-zinc-50'
      }>

        <div className="py-0 w-full">


  
        {!isEmbedded && (
          <div className="w-full flex flex-row gap-2 items-center justify-between rounded-2xl border border-zinc-200 bg-white/90 px-3 py-2 text-zinc-500 shadow-sm">
            {/* go back button */}
            <div className="w-full flex justify-start items-center gap-2">
                {/*
                <button
                    onClick={() => window.history.back()}
                    className="flex items-center justify-center rounded-full border border-zinc-300 bg-zinc-100 p-2 hover:bg-zinc-200 transition">
                    <Image
                        src="/icon-back.png"
                        alt="Back"
                        width={20}
                        height={20}
                        className="rounded-full"
                    />
                </button>
                */}
                {/* windows back button */}
                <button
                    onClick={() => window.history.back()}
                    className="flex items-center justify-center rounded-full border border-zinc-300 bg-zinc-100 p-2 hover:bg-zinc-200 transition">
                    <Image
                        src="/icon-back.png"
                        alt="Back"
                        width={20}
                        height={20}
                        className="rounded-full"
                    />
                </button>

                {/* title */}
                <span className="text-sm text-zinc-600 font-semibold">
                    돌아가기
                </span>
            </div>


            {address && !loadingUser && (
                  <div className="w-full flex flex-row items-center justify-end gap-2">

                    <div className="flex flex-row items-center justify-center gap-2
                      bg-zinc-100 border border-zinc-200 rounded-full p-1
                      ">
                      <Image
                        src={user?.avatar || avatar || "/icon-user.png"}
                        alt="User"
                        width={20}
                        height={20}
                        className="rounded-full"
                      />
                      <span className="text-sm text-zinc-600">
                        {user?.nickname || "프로필"}
                      </span>
                    </div>

                </div>
              )}

          </div>
        )}
          <div className={`${isEmbedded ? 'mt-0' : 'mt-4'} w-full flex flex-col items-start justify-center gap-4`}>
            {!isEmbedded && (
              <div className='flex flex-row items-center gap-3 rounded-2xl border border-zinc-200 bg-white px-3 py-2 shadow-sm'>
                <Image
                  src={store?.storeLogo || "/icon-collect.png"}
                  alt="Store Logo"
                  width={35}
                  height={35}
                  className="w-10 h-10 rounded-full"
                />

                <div className="text-xl font-semibold text-zinc-900 tracking-tight">
                  가맹점{' '}{
                    store && store.storeName + " (" + store.storecode + ")"
                  }{' '}청산관리
                </div>
              </div>
            )}


                  {!isHistoryOnly && (
                  <>
                  <div className={`${isEmbedded ? 'mt-0' : 'mt-5'} mb-4 w-full grid gap-3 xl:grid-cols-2 xl:items-start`}>
                  {/* 구매자 계좌 */}
                  {/*
                    store
                    bankInfo
                      accountHolder
                      accountNumber
                      bankName
                    bankInfoAAA

                    bankInfoBBB
                    bankInfoCCC
                    bankInfoDDD
                  */}


                  {/* select one of bankInfo, bankInfoAAA, bankInfoBBB, bankInfoCCC, bankInfoDDD */}
                  
                  <div className="w-full flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
                    <div className="flex flex-row items-center justify-start gap-2">
                      <h2 className="text-sm font-semibold text-slate-800">
                        구매자 계좌 정보
                      </h2>
                      {fetchingStore && (
                        <div className="flex flex-row items-center gap-2">
                            <div className="
                              w-6 h-6
                              border-2 border-zinc-800
                              rounded-full
                              animate-spin
                            ">
                              <Image
                                src="/loading.png"
                                alt="loading"
                                width={24}
                                height={24}
                              />
                            </div>
                            <div className="text-zinc-400">
                              로딩중...
                            </div>
                        </div>
                      )}
                    </div>

                    <span className="text-[11px] text-slate-500">
                      가맹점 계좌 정보 중에서 하나를 선택하세요.
                    </span>


                    <div className="grid w-full gap-2 sm:grid-cols-2 2xl:grid-cols-3">
                      {buyerBankOptions.map((bankInfo: any, index: number) => {
                        const isSelected = buyerBankInfo.accountNumber === bankInfo.accountNumber;
                        return (
                          <button
                            key={`buyer-bank-${bankInfo.accountNumber || index}-${index}`}
                            className={getBankCardClass(isSelected)}
                            onClick={() => {
                              setBuyerBankInfo((prev: any) => ({
                                ...prev,
                                bankName: bankInfo.bankName,
                                accountNumber: bankInfo.accountNumber,
                                accountHolder: bankInfo.accountHolder,
                              }));
                            }}
                          >
                            <span
                              className={`absolute left-0 top-1.5 h-[calc(100%-12px)] w-1 rounded-r-full transition-colors ${
                                isSelected ? 'bg-slate-800' : 'bg-transparent'
                              }`}
                            />
                            <div className="flex items-center gap-2.5">
                              <div
                                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md border ${
                                  isSelected ? 'border-slate-700 bg-white ring-1 ring-slate-300' : 'border-slate-200 bg-slate-50'
                                }`}
                              >
                                <Image
                                  src="/icon-bank.png"
                                  alt="Bank"
                                  width={16}
                                  height={16}
                                  className="h-4 w-4"
                                />
                              </div>
                              <div className="min-w-0 flex-1">
                                <span className="text-[11px] font-medium tracking-wide text-slate-500">
                                  {bankInfo.bankName}
                                </span>
                                <span className="mt-0.5 block truncate text-[13px] font-semibold leading-tight text-slate-900">
                                  {bankInfo.accountNumber}
                                </span>
                                <span className="mt-1 block text-sm font-semibold leading-tight text-slate-900">
                                  {bankInfo.accountHolder}
                                </span>
                              </div>
                              <span className={getBankTagClass(isSelected)}>
                                {isSelected ? '✓ 선택됨' : '선택'}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                      {buyerBankOptions.length === 0 && (
                        <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 py-3 text-xs text-slate-500">
                          {!hasPrivilegedStoreRead && storeReadMessage
                            ? storeReadMessage
                            : '등록된 구매자 계좌 정보가 없습니다.'}
                        </div>
                      )}

                    </div>

                  </div>

         

                  {/* 출금계좌 */}
                  {/* align right */}
                  {/* store withdrawal bank info */}
                  {/*
                  <div className="w-full flex flex-row justify-end">
                    {store && store?.withdrawalBankInfo && (
                      <div className="flex flex-col items-end">
                        <span className="text-sm text-zinc-500">
                          출금계좌
                        </span>
                        <div className="flex flex-row items-center gap-2">
                          <Image
                            src="/icon-bank.png"
                            alt="Bank"
                            width={30}
                            height={30}
                            className="w-8 h-8"
                          />
                          <span className="text-lg font-semibold text-zinc-800">
                            {store.withdrawalBankInfo.bankName} {store.withdrawalBankInfo.accountNumber} {store.withdrawalBankInfo.accountHolder}
                          </span>
                        </div>

                      </div>
                    )}
                  </div>
                  */}
                  {/* 결제계좌 하나를 선택하세요. */}
                  {/* withdrawalBankInfo, withdrawalBankInfoAAA */}
                  <div className="w-full flex flex-col items-start justify-center gap-2 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
                    <h3 className="text-sm font-semibold text-slate-800">
                      판매자 결제계좌
                    </h3>
                    <span className="text-[11px] text-slate-500">
                      정산 시 사용할 계좌를 선택하세요.
                    </span>
                    <div className="grid w-full gap-2 sm:grid-cols-2 2xl:grid-cols-3">
                      {sellerBankOptions.map((bankInfo: any, index: number) => {
                        const isSelected = withdrawalBankInfo.accountNumber === bankInfo.accountNumber;
                        return (
                          <button
                            key={`seller-bank-${bankInfo.accountNumber || index}-${index}`}
                            className={getBankCardClass(isSelected)}
                            onClick={() => {
                              setWithdrawalBankInfo({
                                bankName: bankInfo.bankName,
                                accountNumber: bankInfo.accountNumber,
                                accountHolder: bankInfo.accountHolder,
                              });
                            }}
                          >
                            <span
                              className={`absolute left-0 top-1.5 h-[calc(100%-12px)] w-1 rounded-r-full transition-colors ${
                                isSelected ? 'bg-slate-800' : 'bg-transparent'
                              }`}
                            />
                            <div className="flex items-center gap-2.5">
                              <div
                                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md border ${
                                  isSelected ? 'border-slate-700 bg-white ring-1 ring-slate-300' : 'border-slate-200 bg-slate-50'
                                }`}
                              >
                                <Image
                                  src="/icon-bank.png"
                                  alt="Bank"
                                  width={16}
                                  height={16}
                                  className="h-4 w-4"
                                />
                              </div>
                              <div className="min-w-0 flex-1">
                                <span className="text-[11px] font-medium tracking-wide text-slate-500">
                                  {bankInfo.bankName}
                                </span>
                                <span className="mt-0.5 block truncate text-[13px] font-semibold leading-tight text-slate-900">
                                  {bankInfo.accountNumber}
                                </span>
                                <span className="mt-1 block text-sm font-semibold leading-tight text-slate-900">
                                  {bankInfo.accountHolder}
                                </span>
                              </div>
                              <span className={getBankTagClass(isSelected)}>
                                {isSelected ? '✓ 선택됨' : '선택'}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                      {sellerBankOptions.length === 0 && (
                        <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 py-3 text-xs text-slate-500">
                          등록된 판매자 결제계좌 정보가 없습니다.
                        </div>
                      )}
                    </div>
                  </div>
                  </div>



                  
                  



                  {/* check box for sell order */}
                  {/*
                  <div className="flex flex-row items-center gap-2">
                    <input
                      type="checkbox"
                      checked={checkInputKrwAmount}
                      onChange={(e) => setCheckInputKrwAmount(e.target.checked)}
                    />
                    <p className="text-sm text-zinc-400">
                      원화로 주문하기
                    </p>
                  </div>
                  */}

                  <div className=" w-full grid gap-4  justify-center">

                    

                    {/* sell order is different border color
                    */}
                    <article
                      className={`
                        ${checkInputKrwAmount ? 'hidden' : 'block'}
                      bg-white shadow-md rounded-lg p-4 border border-gray-300`}
              
                    >

                      <div className="flex flex-col sm:flex-row gap-5 xl:gap-10 items-center">


                        <div className="flex flex-col gap-2 items-start">


                          <p className="mt-4 text-xl font-bold text-zinc-400">1 USDT = {
                            // currency format
                            Number(rate)?.toLocaleString('ko-KR', {
                              style: 'currency',
                              currency: 'KRW'
                            })
                          }</p>
                          
                          <div className=" flex flex-row items-center gap-2">
                            <p className="text-xl text-blue-500 font-bold ">
                              <input 
                                type="number"
                                className=" w-28 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 "
                                placeholder="Amount"
                                value={usdtAmount}
                                onChange={(e) => {
                                  // check number
                                  e.target.value = e.target.value.replace(/[^0-9.]/g, '');

                                  // if the value is start with 0, then remove 0
                                  if (e.target.value.startsWith('0')) {
                                    e.target.value = e.target.value.substring(1);
                                  }

                                  
                                  if (e.target.value === '') {
                                    setUsdtAmount(0);
                                    return;
                                  }

                                  
                              


                                  parseFloat(e.target.value) < 0 ? setUsdtAmount(0) : setUsdtAmount(parseFloat(e.target.value));

                                  parseFloat(e.target.value) > 1000 ? setUsdtAmount(1000) : setUsdtAmount(parseFloat(e.target.value));

                                } }


                              />
                              <span className="ml-1 text-sm">USDT</span>
                            </p>

                            <p className=" text-xl text-zinc-400 font-bold">
                              = {
                              Number(defaultKrWAmount)?.toLocaleString('ko-KR', {
                                style: 'currency',
                                currency: 'KRW'
                              })
                              }
                            </p>
                          </div>


                          {seller && (
                            <p className=" text-sm text-zinc-400">
                              {Payment}: {Bank_Transfer} ({seller?.bankInfo?.bankName} {seller?.bankInfo?.accountNumber} {seller?.bankInfo?.accountHolder})
                            </p>
                          )}

                        </div>


                        {/* input krw amount */}
                        {/* left side decrease button and center is input and  right side increase button */}
                        {/* -1, -10, -100, +1, +10, +100 */}
                        {/* if - button change bg color red */}
                        {/* if + button change bg color */}

                          <div className="mt-4  flex flex-row items-center justify-between gap-2">


                            <div className="flex flex-col gap-2">

                              <button
                                disabled={usdtAmount === 0}
                                className="bg-red-400 text-white px-2 py-2 rounded-md"
                                onClick={() => {
                                  krwAmount > 0 && setKrwAmount(krwAmount - 1);
                                }}
                              >
                                -1
                              </button>

                              <button
                                disabled={usdtAmount === 0}
                                className="bg-red-600 text-white px-2 py-2 rounded-md"
                                onClick={() => {
                                  krwAmount > 10 && setKrwAmount(krwAmount - 10);
                                }}
                              >
                                -10
                              </button>

                              <button
                                disabled={usdtAmount === 0}
                                className="bg-red-800 text-white px-2 py-2 rounded-md"
                                onClick={() => {
                                  krwAmount > 100 && setKrwAmount(krwAmount - 100);
                                }}
                              >
                                -100
                              </button>

                              <button
                                disabled={usdtAmount === 0}
                                className="bg-red-900 text-white px-2 py-2 rounded-md"
                                onClick={() => {
                                  krwAmount > 1000 && setKrwAmount(krwAmount - 1000);
                                }}
                              >
                                -1000
                              </button>

                            </div>

                            <div className="flex flex-col gap-2">
                              <div className="flex flex-row items-center gap-2"> 
    
                                <input 
                                  disabled
                                  type="number"
                                  className=" w-36  px-3 py-2 text-black bg-white text-xl font-bold border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 "
                                  value={krwAmount}
                                  onChange={(e) => {
                                    // check number
                                    e.target.value = e.target.value.replace(/[^0-9.]/g, '');

                                    if (e.target.value === '') {
                                      setKrwAmount(0);
                                      return;
                                    }

                                    parseFloat(e.target.value) < 0 ? setKrwAmount(0) : setKrwAmount(parseFloat(e.target.value));

                                    parseFloat(e.target.value) > 1000 ? setKrwAmount(1000) : setKrwAmount(parseFloat(e.target.value));

                                  } }
                                />
                              </div>

                              {krwAmount > 0 && (
                                <div className="text-lg font-semibold text-zinc-400">
                                  {Rate}: {

                                    // currency format
                                    Number((krwAmount / usdtAmount).toFixed(2))?.toLocaleString('ko-KR', {
                                      style: 'currency',
                                      currency: 'KRW'
                                    })

                                  } 
                                </div>
                              )}
                            </div>

                            <div className="flex flex-col gap-2">
                              <button
                                disabled={usdtAmount === 0}
                                className="bg-green-400 text-white px-2 py-2 rounded-md"
                                onClick={() => {
                                  setKrwAmount(krwAmount + 1);
                                }}
                              >
                                +1
                              </button>
                              <button
                                disabled={usdtAmount === 0}
                                className="bg-green-600 text-white px-2 py-2 rounded-md"
                                onClick={() => {
                                  setKrwAmount(krwAmount + 10);
                                }}
                              >
                                +10
                              </button>

                              <button
                                disabled={usdtAmount === 0}
                                className="bg-green-800 text-white px-2 py-2 rounded-md"
                                onClick={() => {
                                  setKrwAmount(krwAmount + 100);
                                }}
                              >
                                +100
                              </button>

                              <button
                                disabled={usdtAmount === 0}
                                className="bg-green-900 text-white px-2 py-2 rounded-md"
                                onClick={() => {
                                  setKrwAmount(krwAmount + 1000);
                                }}
                              >
                                +1000
                              </button>

                            </div>


                          </div>

                        </div>




                        {/* sms mobile number */}
                        {address && phoneNumber && (
                          <div className="mt-4 flex flex-col gap-2 items-start">
                            <div className="flex flex-row items-center gap-2">
                              <div className="h-2 w-2 bg-zinc-400 rounded-full inline-block mr-2"></div>
                              <span className="text-sm text-zinc-400">
                                SMS: {phoneNumber}
                              </span>
                            </div>
                           
                            <div className="flex flex-row items-center gap-2">
                              <div className="h-2 w-2 bg-zinc-400 rounded-full inline-block mr-2"></div>
                              <span className="text-sm text-zinc-400">
                                 {Buy_Order_SMS_will_be_sent_to_your_mobile_number}
                              </span>
                            </div>
                            
                          </div>
                        )}



                        {/* aggremment */}
                        {/* After you place order and the buyer accepts the order, you can not cancel the order. */}


                        <div className="mt-4 flex flex-row items-center gap-2">
                          <input
                            disabled={!address || usdtAmount === 0 || buyOrdering}
                            type="checkbox"
                            checked={agreementPlaceOrder}
                            onChange={(e) => setAgreementPlaceOrder(e.target.checked)}
                          />
                          <p className="text-sm text-zinc-400">
                            
                            {I_agree_to_the_terms_of_trade}

                          </p>
                        </div>


                        {/* terms and conditions */}
                        {/* text area */}
                        {/*
                        <textarea
                          className="w-full h-32 p-2 border border-gray-300 rounded-md text-sm text-black"
                          placeholder="
                            After you place order, the buyer has 24 hours to accept the order.
                            If the buyer does not accept the order within 24 hours, the order will be expired.
                            After the buyer accepts the order, you can not cancel the order.
                            After the buyer accepts the order, you must deposit the USDT to escrow within 1 hour.
                            If you do not deposit the USDT to escrow within 1 hour, the order will be expired.
                            If you want to cancel the order, you must contact the buyer and request to cancel the order.
                            If the buyer agrees to cancel the order, the order will be cancelled.
                          "
                        ></textarea>
                        */}



                        {/*
                        <div className="mt-4 text-sm text-zinc-400">

                          <div className="h-2 w-2 bg-zinc-400 rounded-full inline-block mr-2"></div>
                          <span>After you place order, the buyer has 24 hours to accept the order.
                            If the buyer does not accept the order within 24 hours, the order will be expired.
                          </span>
                        </div>
                        <div className="mt-4 text-sm text-zinc-400">

                          <div className="h-2 w-2 bg-zinc-400 rounded-full inline-block mr-2"></div>
                          <span>After the buyer accepts the order, you can not cancel the order.</span>
                        </div>
                        <div className="mt-4 text-sm text-zinc-400">

                          <div className="h-2 w-2 bg-zinc-400 rounded-full inline-block mr-2"></div>
                          <span>After the buyer accepts the order, you must deposit the USDT to escrow within 1 hour.
                            If you do not deposit the USDT to escrow within 1 hour, the order will be expired.
                          </span>
                        </div>
                        <div className="mt-4 text-sm text-zinc-400">

                          <div className="h-2 w-2 bg-zinc-400 rounded-full inline-block mr-2"></div>
                          <span>If you want to cancel the order, you must contact the buyer and request to cancel the order.
                            If the buyer agrees to cancel the order, the order will be cancelled.
                          </span>
                        </div>
                        */}





                        <div className="mt-4 flex flex-col gap-2">
                  
                          {buyOrdering ? (

                            <div className="flex flex-row items-center gap-2">
                                <div className="
                                  w-6 h-6
                                  border-2 border-zinc-800
                                  rounded-full
                                  animate-spin
                                ">
                                  <Image
                                    src="/loading.png"
                                    alt="loading"
                                    width={24}
                                    height={24}
                                  />
                                </div>
                                <div className="text-zinc-400">
                                  {Placing_Order}...
                                </div>
                  
                            </div>


                          ) : (
                              <button
                                  disabled={usdtAmount === 0 || agreementPlaceOrder === false}
                                  className={`text-lg text-white px-4 py-2 rounded-md ${usdtAmount === 0 || agreementPlaceOrder === false ? 'bg-gray-500' : 'bg-green-500'}`}
                                  onClick={() => {
                                      console.log('Buy USDT');
                                      // open trade detail
                                      // open modal of trade detail
                                      ///openModal();

                                      handlePlaceOrderClick();
                                  }}
                              >
                                {Place_Order}
                              </button>
                          )}

                        </div>


                    </article>


                    {/* sell order card view */}
                    {/* input price and auto change usdt amount */}
                    <article
                      className={` ${checkInputKrwAmount ? 'block' : 'hidden'}
                        w-full overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-b from-white to-slate-50 shadow-sm`}
                    >
                        <div className="w-full p-3">
                          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 shadow-sm">
                            <span className="text-[11px] font-semibold tracking-wide text-slate-500">
                              기준환율
                            </span>
                            <span
                              className="text-base font-semibold text-slate-800"
                              style={{ fontFamily: 'monospace' }}
                            >
                              1 USDT = {
                                Number(rate)?.toLocaleString('ko-KR', {
                                  style: 'currency',
                                  currency: 'KRW'
                                })
                              }
                            </span>
                          </div>

                          <div className="grid w-full gap-3 lg:grid-cols-[minmax(0,1.75fr)_minmax(240px,0.9fr)_minmax(280px,1fr)] lg:items-stretch">
                            <div
                              className={`h-full rounded-xl border p-3 shadow-sm transition-all duration-200 ${
                                safeKrwAmount > 0
                                  ? 'border-slate-300 bg-white'
                                  : 'border-blue-200 bg-gradient-to-br from-blue-50 via-white to-slate-50 ring-1 ring-blue-100'
                              }`}
                            >
                              <div className="mb-2 flex items-center justify-between">
                                <span
                                  className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold ${
                                    safeKrwAmount > 0 ? 'bg-slate-100 text-slate-600' : 'bg-blue-100 text-blue-700'
                                  }`}
                                >
                                  <span
                                    className={`h-1.5 w-1.5 rounded-full ${
                                      safeKrwAmount > 0 ? 'bg-slate-500' : 'bg-blue-500 animate-pulse'
                                    }`}
                                  />
                                  STEP 1
                                </span>
                                <span
                                  className={`text-[11px] font-medium ${
                                    safeKrwAmount > 0 ? 'text-slate-500' : 'text-blue-700'
                                  }`}
                                >
                                  {safeKrwAmount > 0 ? '입력 완료' : '먼저 매입금액을 입력하세요'}
                                </span>
                              </div>

                              <div className="flex h-full flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                                <span className="shrink-0 text-sm font-semibold text-slate-500 sm:w-[84px]">
                                  매입금액
                                </span>

                                <div
                                  className={`flex min-w-0 flex-1 flex-row items-center gap-2 rounded-xl border px-3 py-2.5 transition-all duration-200 ${
                                    safeKrwAmount > 0
                                      ? 'border-slate-300 bg-white'
                                      : 'border-blue-300 bg-blue-50/70 ring-2 ring-blue-100'
                                  } focus-within:border-blue-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-200`}
                                >
                                  <input
                                    type='text'
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    onWheel={(e) => e.currentTarget.blur()}
                                    style={{ MozAppearance: 'textfield' }}
                                    className="
                                      min-w-0 w-full bg-transparent text-2xl font-bold text-slate-900
                                      outline-none placeholder:text-slate-400
                                    "
                                    placeholder={Price}
                                    value={safeKrwAmount}
                                    onChange={(e) => {
                                      const digitsOnly = e.target.value.replace(/[^0-9]/g, '');

                                      if (!digitsOnly) {
                                        setKrwAmount(0);
                                        return;
                                      }

                                      const normalized = digitsOnly.replace(/^0+/, '');

                                      if (!normalized) {
                                        setKrwAmount(0);
                                        return;
                                      }

                                      const parsedAmount = Number(normalized);

                                      if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
                                        setKrwAmount(0);
                                        return;
                                      }

                                      setKrwAmount(Math.min(parsedAmount, 100000000));
                                    } }
                                  />
                                  <span
                                    className="shrink-0 text-2xl font-semibold text-amber-700"
                                    style={{ fontFamily: 'monospace' }}
                                  >
                                    {safeKrwAmount === 0 ? '0' : Number(safeKrwAmount).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                  </span>
                                  <span className="shrink-0 text-lg font-semibold text-slate-400">
                                    원
                                  </span>
                                </div>
                              </div>

                              <p className={`mt-2 text-[11px] ${!isAdminUser ? 'text-rose-600' : safeKrwAmount > 0 ? 'text-slate-500' : 'text-blue-700'}`}>
                                {!isAdminUser
                                  ? '관리자 권한(role=admin) 지갑에서만 매입신청이 가능합니다.'
                                  : safeKrwAmount > 0
                                    ? '다음 단계에서 거래조건 동의 후 매입신청을 진행하세요.'
                                    : '금액 입력 후 거래조건 동의와 매입신청이 가능합니다.'}
                              </p>
                            </div>

                            <div className="h-full rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3 shadow-sm">
                              <div className="flex h-full flex-col justify-center gap-1.5">
                                <span className="text-xs font-semibold tracking-wide text-slate-500">
                                  매입량(USDT)
                                </span>
                                <p
                                  className="text-2xl font-semibold leading-none text-slate-700"
                                  style={{ fontFamily: 'monospace' }}
                                >
                                  = {
                                    safeKrwAmount === 0 ? '0' :
                                    (safeKrwAmount / rate).toFixed(3) === 'NaN' ? '0' : (safeKrwAmount / rate).toFixed(3)
                                  }{' '}USDT
                                </p>
                              </div>
                            </div>

                            <div className="h-full rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                              <div className="grid h-full grid-rows-[auto_1fr] gap-2">
                                <label className="flex items-start gap-2 text-xs text-slate-600">
                                  <input
                                    onWheel={(e) => e.preventDefault()}
                                    disabled={!address || !isAdminUser || safeKrwAmount <= 0 || buyOrdering}
                                    type="checkbox"
                                    checked={agreementPlaceOrder}
                                    onChange={(e) => setAgreementPlaceOrder(e.target.checked)}
                                    className="mt-0.5 h-4 w-4 rounded border-slate-300"
                                  />
                                  <span className="leading-tight lg:whitespace-nowrap">
                                    {I_agree_to_the_terms_of_trade || "거래 조건에 동의합니다."}
                                  </span>
                                </label>

                                {buyOrdering ? (

                                  <div className="flex h-full min-h-[56px] flex-row items-center justify-center gap-2 rounded-xl bg-slate-100 px-3 py-3">
                                      <div className="
                                        w-6 h-6
                                        border-2 border-zinc-800
                                        rounded-full
                                        animate-spin
                                      ">
                                        <Image
                                          src="/loading.png"
                                          alt="loading"
                                          width={24}
                                          height={24}
                                        />
                                      </div>
                                      <div className="text-slate-500">
                                        신청중...
                                      </div>

                                  </div>
                                ) : (
                                    <button
                                        disabled={!address || !isAdminUser || safeKrwAmount <= 0 || agreementPlaceOrder === false}
                                        className={`
                                          h-full min-h-[56px] w-full rounded-xl px-4 py-3 text-lg font-semibold text-white transition
                                          ${!address || !isAdminUser || safeKrwAmount <= 0 || agreementPlaceOrder === false
                                            ? 'bg-slate-400'
                                            : 'bg-slate-800 hover:bg-slate-900'
                                          }
                                        `}
                                        onClick={() => {
                                            handlePlaceOrderClick();
                                        }}
                                    >
                                      매입신청
                                    </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                    </article>









                    <article
                      className="hidden xl:block"
                    ></article>

                    <article
                      className="hidden xl:block"
                    ></article>


                  </div>
                  </>)}

                  <div className="w-full flex flex-col xl:flex-row items-start xl:items-center justify-between gap-3 rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm">



                    {/* serach fromDate and toDate */}
                    {/* DatePicker for fromDate and toDate */}
                    <div className="flex flex-col sm:flex-row items-center gap-2">
                      <div className="flex flex-row items-center gap-2">
                        <Image
                          src="/icon-calendar.png"
                          alt="Calendar"
                          width={20}
                          height={20}
                          className="rounded-lg w-5 h-5"
                        />
                        <input
                          type="date"
                          value={searchFromDate}
                          onChange={(e) => {
                            const nextFromDate = e.target.value;
                            setSearchFormDate(nextFromDate);
                            pushClearanceParams({
                              nextPage: 1,
                              nextFromDate,
                              nextToDate: searchToDate,
                            });
                          }}
                          className="w-full rounded-xl border border-zinc-300 bg-zinc-50 p-2 text-sm text-zinc-700 focus:outline-none focus:ring-2 focus:ring-zinc-300"
                        />
                      </div>

                      <span className="text-sm text-gray-500">~</span>

                      <div className="flex flex-row items-center gap-2">
                        <Image
                          src="/icon-calendar.png"
                          alt="Calendar"
                          width={20}
                          height={20}
                          className="rounded-lg w-5 h-5"
                        />
                        <input
                          type="date"
                          value={searchToDate}
                          onChange={(e) => {
                            const nextToDate = e.target.value;
                            setSearchToDate(nextToDate);
                            pushClearanceParams({
                              nextPage: 1,
                              nextFromDate: searchFromDate,
                              nextToDate,
                            });
                          }}
                          className="w-full rounded-xl border border-zinc-300 bg-zinc-50 p-2 text-sm text-zinc-700 focus:outline-none focus:ring-2 focus:ring-zinc-300"
                        />
                      </div>

                      <div className="flex flex-row items-center gap-1.5 sm:ml-1">
                        <button
                          type="button"
                          onClick={() => applyQuickDateSearch(todayDate)}
                          className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                            searchFromDate === todayDate && searchToDate === todayDate
                              ? 'border-zinc-900 bg-zinc-900 text-white'
                              : 'border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-100'
                          }`}
                        >
                          오늘
                        </button>
                        <button
                          type="button"
                          onClick={() => applyQuickDateSearch(yesterdayDate)}
                          className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                            searchFromDate === yesterdayDate && searchToDate === yesterdayDate
                              ? 'border-zinc-900 bg-zinc-900 text-white'
                              : 'border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-100'
                          }`}
                        >
                          어제
                        </button>
                        <button
                          type="button"
                          onClick={applyAllDateSearch}
                          className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                            !searchFromDate && !searchToDate
                              ? 'border-zinc-900 bg-zinc-900 text-white'
                              : 'border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-100'
                          }`}
                        >
                          전체
                        </button>
                      </div>
                    </div>


                    {/*
                    <div className="flex flex-col gap-2 items-center">
                      <div className="text-sm">건수</div>
                      <div className="text-xl font-semibold text-zinc-400">
                        {buyOrders.length.toLocaleString()}
                      </div>
                    </div>
                    */}




                    <div className="flex w-full xl:w-auto flex-col items-end gap-1">
                      <button
                        type="button"
                        disabled={checkingQueueTx || pendingQueueCheckCount === 0}
                        onClick={() => syncQueueTransactionHashes(pendingQueueCheckOrderIds)}
                        className={`
                          inline-flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition
                          ${
                            checkingQueueTx || pendingQueueCheckCount === 0
                              ? "cursor-not-allowed border-zinc-200 bg-zinc-100 text-zinc-400"
                              : "border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100"
                          }
                        `}
                      >
                        {checkingQueueTx ? (
                          <>
                            <Image
                              src="/loading.png"
                              alt="loading"
                              width={16}
                              height={16}
                              className="h-4 w-4 animate-spin"
                            />
                            <span>TXID 점검중...</span>
                          </>
                        ) : (
                          <span>TXID 점검 ({pendingQueueCheckCount}건)</span>
                        )}
                      </button>

                      {queueCheckSummary && (
                        <span className="text-[11px] text-zinc-500">
                          {queueCheckSummary}
                        </span>
                      )}
                    </div>

                    <div className="flex w-full xl:w-auto flex-row items-center justify-center gap-4
                      border border-zinc-200
                      bg-zinc-50
                      px-3 py-2 rounded-xl
                      ">

                        {/* totalClearanceAmount */}
                        {/* totalClearanceAmountUSDT */}
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
                          
                          <div className="flex flex-col items-center">
                            <span className="text-xs text-zinc-500">
                              총 매입주문수(건)
                            </span>
                            <span className="text-lg xl:text-xl font-semibold text-[#409192]">
                              {totalClearanceCount.toLocaleString()}
                            </span>
                          </div>

                          <div className="flex flex-col items-center">
                              <span className="text-xs text-zinc-500">
                                  총 매입량(USDT)
                              </span>
                              <div className="flex flex-row items-center justify-center gap-2">
                                <span className="text-lg xl:text-xl font-semibold text-[#409192]"
                                  style={{ fontFamily: "monospace" }}>
                                    {
                                      (Number(totalClearanceAmount).toFixed(3))
                                      .replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                                    }
                                </span>
                              </div>
                          </div>
                          
                          <div className="flex flex-col items-center">
                              <span className="text-xs text-zinc-500">
                                  총 매입금액(원)
                              </span>
                              <div className="flex flex-row items-center justify-center gap-2">
                                <span className="text-lg xl:text-xl font-semibold text-yellow-600"
                                  style={{ fontFamily: "monospace" }}>
                                    {
                                      (Number(totalClearanceAmountKRW).toFixed(0))
                                      .replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                                    }
                                </span>
                              </div>
                          </div>

                        </div>

                      </div>



                  
                </div>


                {!isHistoryOnly && (
                <div className="mt-4 w-full rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm">
                  <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-zinc-700">
                    <span>판매자 지갑 잔고 현황</span>
                    {refreshingSellersBalance && sellersBalance?.length > 0 && (
                      <span className="text-[11px] font-medium text-zinc-400">
                        갱신중...
                      </span>
                    )}
                  </div>

                  {loadingSellersBalance && sellersBalance?.length === 0 && (
                    <div className="rounded-lg border border-dashed border-zinc-200 bg-zinc-50 px-3 py-3 text-xs text-zinc-500">
                      판매자 지갑 잔고를 불러오는 중입니다...
                    </div>
                  )}

                  {!loadingSellersBalance && sellersBalance?.length === 0 && (
                    <div className="rounded-lg border border-dashed border-zinc-200 bg-zinc-50 px-3 py-3 text-xs text-zinc-500">
                      표시할 판매자 지갑 잔고가 없습니다.
                    </div>
                  )}

                  {sellersBalance?.length > 0 && (
                    <div className="flex w-full flex-wrap items-stretch justify-start gap-2">
                    {sellersBalance.map((seller, index) => (
                      <div
                        key={index}
                        className="relative flex min-w-[300px] flex-wrap items-center gap-3 rounded-xl border border-zinc-200 bg-zinc-50 p-3">
                        {String(seller.walletAddress || "").toLowerCase() === String(
                          store?.privateSellerWalletAddress
                          || store?.settlementWalletAddress
                          || store?.adminWalletAddress
                          || "",
                        ).toLowerCase() ? (
                          <div className="absolute top-0 right-0 bg-yellow-400 text-white text-xs font-bold px-2 py-1 rounded-bl-lg rounded-tr-lg">
                            기본지갑
                          </div>
                        ) : null}
                        <div className="flex flex-row items-center gap-4">
                          <Image
                            src="/icon-seller.png"
                            alt="Seller"
                            width={32}
                            height={32}
                            className="w-8 h-8"
                          />
                          <div className="flex flex-col">
                            <span className="text-sm font-semibold text-zinc-800">
                              {seller.nickname}
                            </span>
                            <button
                              className="text-xs text-zinc-600 underline"
                              onClick={() => {
                                navigator.clipboard.writeText(seller.walletAddress);
                                toast.success(Copied_Wallet_Address);
                              } }
                            >
                              {seller.walletAddress.substring(0, 6)}...{seller.walletAddress.substring(seller.walletAddress.length - 4)}
                            </button>
                          </div>
                        </div>

                        <div className="flex min-w-[180px] flex-col rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
                          <span className="text-[11px] font-semibold text-amber-700">
                            미전송 정산주문
                          </span>
                          <span className="text-[10px] text-amber-600/80">
                            paymentRequested 포함
                          </span>
                          <div className="mt-1 flex items-center gap-2">
                            <span className="text-xs font-medium text-zinc-600">
                              {Number(seller.pendingTransferCount || 0).toLocaleString()}건
                            </span>
                            <span
                              className="text-sm font-semibold text-amber-700"
                              style={{ fontFamily: 'monospace' }}
                            >
                              {Number(seller.pendingTransferUsdtAmount || 0).toFixed(3).replace(/\B(?=(\d{3})+(?!\d))/g, ',')} USDT
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-row items-center gap-2 sm:ml-auto">
                          <div className="flex flex-row items-center gap-2">
                            <Image
                              src="/icon-tether.png"
                              alt="USDT"
                              width={20}
                              height={20}
                              className="w-5 h-5"
                            />
                            <span className="text-lg font-semibold text-[#409192]"
                              style={{ fontFamily: 'monospace' }}>
                              {Number(seller.currentUsdtBalance).toFixed(3).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                            </span>
                          </div>

                          {seller.nickname === 'seller' && (
                            <button
                              onClick={() => {
                                router.push('/' + params.lang + '/admin/withdraw-vault?walletAddress=' + seller.walletAddress);
                              }}
                              className="rounded-lg border border-zinc-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-[#3167b4] hover:bg-zinc-100 transition"
                            >
                              출금하기
                            </button>
                          )}
                        </div>
                        
                      </div>
                      
                    ))}
                    </div>
                  )}

                </div>
                )}

                {isHistoryOnly && (
                  <>
                    <section className="mt-4 w-full rounded-2xl border border-sky-200 bg-white shadow-sm">
                      <div className="border-b border-sky-100 bg-gradient-to-r from-sky-50 via-white to-cyan-50 px-4 py-3">
                        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-sky-200 bg-white shadow-sm">
                                <Image
                                  src="/icon-bank.png"
                                  alt="결제통장 출금"
                                  width={18}
                                  height={18}
                                  className="h-[18px] w-[18px]"
                                />
                              </div>
                              <h2 className="text-sm font-semibold tracking-tight text-zinc-900">
                                결제통장 출금 LIVE
                              </h2>
                              <span className="rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-sky-700">
                                Ably
                              </span>
                              <span className="rounded-full border border-zinc-200 bg-white px-2 py-0.5 text-[10px] font-medium text-zinc-500">
                                {store?.storeName || normalizedStorecode}
                              </span>
                              {store?.bankInfo?.accountNumber && (
                                <span className="rounded-full border border-zinc-200 bg-white px-2 py-0.5 font-mono text-[10px] text-zinc-500">
                                  {store?.bankInfo?.bankName || "결제통장"} {store?.bankInfo?.accountNumber}
                                </span>
                              )}
                            </div>
                            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                              <span className="rounded-full border border-zinc-200 bg-white px-2 py-1">
                                최근 {latestWithdrawalRealtimeAt ? formatRealtimeRelative(latestWithdrawalRealtimeAt, withdrawalRealtimeNowMs) : "-"}
                              </span>
                              <span className="rounded-full border border-zinc-200 bg-white px-2 py-1">
                                동기화 {withdrawalRealtimeLastSyncedAt ? formatRealtimeRelative(withdrawalRealtimeLastSyncedAt, withdrawalRealtimeNowMs) : "-"}
                              </span>
                              <span className="rounded-full border border-zinc-200 bg-white px-2 py-1">
                                {withdrawalRealtimeEventCount.toLocaleString("ko-KR")}건
                              </span>
                              <span className="rounded-full border border-zinc-200 bg-white px-2 py-1">
                                {withdrawalRealtimeAmountTotal.toLocaleString("ko-KR")} KRW
                              </span>
                              {withdrawalRealtimeSyncing && (
                                <span className="rounded-full border border-sky-200 bg-sky-50 px-2 py-1 text-sky-700">
                                  동기화중...
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 xl:justify-end">
                            <div className="rounded-xl border border-zinc-200 bg-white px-3 py-2 shadow-sm">
                              <div className="text-[10px] font-medium uppercase tracking-[0.12em] text-zinc-500">
                                Connection
                              </div>
                              <div className="mt-1 flex items-center gap-2 text-sm font-semibold text-zinc-800">
                                <span
                                  className={`inline-block h-2.5 w-2.5 rounded-full ${
                                    withdrawalRealtimeConnectionState === "connected"
                                      ? "bg-emerald-500"
                                      : withdrawalRealtimeConnectionState === "connecting"
                                        || withdrawalRealtimeConnectionState === "initialized"
                                        ? "bg-amber-400"
                                        : "bg-rose-500"
                                  }`}
                                />
                                {withdrawalRealtimeConnectionState}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => router.push('/' + params.lang + '/realtime-banktransfer')}
                              className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
                            >
                              실시간 입출금 보기
                            </button>
                          </div>
                        </div>

                        {(withdrawalRealtimeConnectionError || withdrawalRealtimeSyncError) && (
                          <div className="mt-3 flex flex-col gap-2">
                            {withdrawalRealtimeConnectionError && (
                              <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                                연결 오류: {withdrawalRealtimeConnectionError}
                              </div>
                            )}
                            {withdrawalRealtimeSyncError && (
                              <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
                                동기화 오류: {withdrawalRealtimeSyncError}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="px-4 py-3">
                        {withdrawalRealtimeEvents.length === 0 ? (
                          <div className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50 px-4 py-5 text-sm text-zinc-500">
                            현재 선택된 가맹점의 출금 실시간 이벤트가 없습니다.
                          </div>
                        ) : (
                          <div className="-mx-1 overflow-x-auto pb-1">
                            <div className="flex min-w-full gap-3 px-1">
                              {withdrawalRealtimeEvents.map((item) => {
                                const event = item.data;
                                const eventAccountNumber = normalizeAccountNumber(event?.bankAccountNumber);
                                const storeAccountNumber = normalizeAccountNumber(store?.bankInfo?.accountNumber);
                                const linkedOrder = buyOrders.find(
                                  (order) => String(order?.tradeId || "").trim() === String(event?.tradeId || "").trim(),
                                );
                                const receiverBankName = String(
                                  event?.receiver?.bankName
                                  || linkedOrder?.seller?.bankInfo?.bankName
                                  || "",
                                ).trim();
                                const receiverAccountHolder = String(
                                  event?.receiver?.accountHolder
                                  || linkedOrder?.seller?.bankInfo?.accountHolder
                                  || "",
                                ).trim();
                                const receiverAccountNumber = String(
                                  event?.receiver?.accountNumber
                                  || linkedOrder?.seller?.bankInfo?.accountNumber
                                  || "",
                                ).trim();
                                const isPrimaryAccount = Boolean(
                                  eventAccountNumber
                                  && storeAccountNumber
                                  && eventAccountNumber === storeAccountNumber,
                                );

                                return (
                                  <article
                                    key={item.id}
                                    className={`min-w-[260px] max-w-[280px] flex-1 rounded-2xl border px-3 py-3 shadow-sm transition ${
                                      item.highlightUntil > withdrawalRealtimeNowMs
                                        ? 'border-sky-300 bg-sky-50/70'
                                        : 'border-zinc-200 bg-white'
                                    }`}
                                  >
                                    <div className="flex items-start justify-between gap-3">
                                      <div className="min-w-0">
                                        <div className="text-[11px] font-medium text-zinc-500">
                                          {formatRealtimeDateTime(
                                            event?.processingDate
                                            || event?.transactionDate
                                            || event?.publishedAt,
                                          )}
                                        </div>
                                        <div className="mt-1 text-lg font-semibold tracking-tight text-rose-600">
                                          {Number(event?.amount || 0).toLocaleString("ko-KR")}원
                                        </div>
                                      </div>
                                      <div className="flex shrink-0 flex-col items-end gap-1">
                                        {isPrimaryAccount && (
                                          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                                            기본 결제통장
                                          </span>
                                        )}
                                        <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[10px] text-zinc-500">
                                          {formatRealtimeRelative(
                                            event?.processingDate || event?.transactionDate || event?.publishedAt,
                                            withdrawalRealtimeNowMs,
                                          )}
                                        </span>
                                      </div>
                                    </div>

                                    <div className="mt-3 space-y-1.5 text-xs text-zinc-600">
                                      <div className="flex items-center gap-2">
                                        <span className="w-10 shrink-0 text-zinc-400">FROM</span>
                                        <span className="truncate font-medium text-zinc-800">
                                          {event?.transactionName || "-"}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className="w-10 shrink-0 text-zinc-400">계좌</span>
                                        <span className="truncate font-mono text-zinc-700">
                                          {event?.bankAccountNumber || "-"}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className="w-10 shrink-0 text-zinc-400">TO</span>
                                        <span className="truncate font-medium text-zinc-800">
                                          {receiverAccountHolder || "알 수 없음"}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className="w-10 shrink-0 text-zinc-400">계좌</span>
                                        <span className="truncate font-mono text-zinc-700">
                                          {receiverBankName || receiverAccountNumber
                                            ? `${receiverBankName || "-"} ${receiverAccountNumber || "-"}`
                                            : "알 수 없음"}
                                        </span>
                                      </div>
                                      {event?.tradeId && (
                                        <div className="flex items-center gap-2">
                                          <span className="w-10 shrink-0 text-zinc-400">trade</span>
                                          <span className="font-mono text-zinc-700">{event.tradeId}</span>
                                        </div>
                                      )}
                                    </div>
                                  </article>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </section>
                  </>
                )}

                {buyOrdersReadMessage && (
                  <div className="mt-4 w-full rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
                    {buyOrdersReadMessage}
                  </div>
                )}

                {hasFetchedBuyOrdersOnce && buyOrders.length === 0 && !buyOrdersReadMessage && (
                  <div className="mt-4 w-full rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
                    오늘 날짜 기준으로 조회된 청산내역이 없습니다. 날짜를 변경하거나 전체 조회를 선택해 주세요.
                  </div>
                )}



                <div className="w-full overflow-x-auto rounded-2xl border border-zinc-200 bg-white shadow-sm">
          
                  <table className="
                    clearance-compact-table min-w-[1280px] w-full table-auto border-collapse
                    [&_th]:px-2 [&_th]:py-2 [&_th]:text-[11px] [&_th]:font-semibold [&_th]:tracking-wide
                    [&_td]:px-2 [&_td]:py-2 [&_td]:align-top [&_td]:text-[13px]
                  ">

                    <thead
                      className="sticky top-0 z-10 bg-zinc-900/95 text-zinc-100 text-xs font-semibold backdrop-blur-sm"
                    >
                      <tr>

                        <th className="w-[160px] whitespace-nowrap text-center">
                          <div className="flex flex-col items-center justify-center gap-1">
                            <span>#신청번호</span>
                            <span>신청시간</span>
                          </div>
                        </th>

                        <th className="w-[130px] text-center">주문유형</th>

                        <th className="w-[200px] text-left">구매자정보</th>

                        


                        <th className="w-[170px] text-right">
                          <div className="flex flex-col items-end justify-center gap-1">
                            <span>매입량(USDT)</span>
                            <span>매입금액(원)</span>
                            <span>{Rate}(원)</span>
                          </div>
                        </th>

                        <th className="w-[150px] text-left">결제통장</th>
                        <th className="w-[160px] text-left">판매자 정보</th>
                        <th className="w-[120px] text-right">결제금액(원)</th>
                        
                        <th className="w-[170px] text-center">출금상태</th>
                        <th className="w-[220px] text-center">USDT 전송상태</th>

                          
                      </tr>
                  </thead>
                  <tbody>
                      {buyOrders.map((item, index) => {
                        const isWebhookGeneratedOrder =
                          isWithdrawalWebhookGeneratedClearanceOrder(item);
                        const canDeleteWebhookGeneratedOrder =
                          isHistoryOnly
                          && isAdminUser
                          && isWebhookGeneratedOrder
                          && isWithdrawalWebhookGeneratedClearanceOrderDeletable(item);
                        const isDeletingWebhookOrder = deletingWebhookOrderIds.includes(
                          String(item?._id || "").trim(),
                        );
                        const isCancellingClearanceOrder = cancellingClearanceOrderIds.includes(
                          String(item?._id || "").trim(),
                        );

                        return (
                        <tr key={index} className={`
                          ${
                            index % 2 === 0 ? 'bg-white' : 'bg-zinc-50/70'
                          }
                          border-t border-zinc-200/80 hover:bg-zinc-50 transition-colors
                        `}>

                          <td className="p-2 text-center">
                            <div className="flex flex-col items-center justify-center gap-1">
                              <button
                                className="text-xs text-blue-600 font-semibold underline"
                                onClick={() => {
                                  // copy to clipboard
                                  navigator.clipboard.writeText(item.tradeId);
                                  toast.success('Copied to clipboard');
                                }}
                              >
                                #{item.tradeId}
                              </button>
                              {/* year-month-date */}
                              <span className="text-xs text-zinc-600">
                                {new Date(item.createdAt).toLocaleDateString()}
                              </span>
                              {/* hours-minutes */}
                              <span className="text-xs text-zinc-600">
                                {new Date(item.createdAt).toLocaleTimeString()}
                              </span>
                              <span className="text-[11px] text-zinc-400">
                                {
                                  new Date().getTime() - new Date(item.createdAt).getTime() < 1000 * 60 ? (
                                    ' ' + Math.floor((new Date().getTime() - new Date(item.createdAt).getTime()) / 1000) + ' ' + seconds_ago
                                  ) :
                                  new Date().getTime() - new Date(item.createdAt).getTime() < 1000 * 60 * 60 ? (
                                    ' ' + Math.floor((new Date().getTime() - new Date(item.createdAt).getTime()) / 1000 / 60) + ' ' + minutes_ago
                                  ) : (
                                    ' ' + Math.floor((new Date().getTime() - new Date(item.createdAt).getTime()) / 1000 / 60 / 60) + ' ' + hours_ago
                                  )}
                              </span>
                              {(getCreatedByActorLabel(item) || getCreatedByDateTime(item)) && (
                                <div className="mt-1 w-full rounded-lg border border-sky-200 bg-sky-50 px-2 py-1 text-center">
                                  <div className="text-[10px] font-semibold uppercase tracking-wide text-sky-700">
                                    매입신청
                                  </div>
                                  {getCreatedByActorLabel(item) && (
                                    <div className="text-[11px] font-semibold text-sky-900">
                                      신청자 {getCreatedByActorLabel(item)}
                                    </div>
                                  )}
                                  {getCreatedByDateTime(item) && (
                                    <div className="text-[10px] text-sky-700">
                                      {formatAdminActionDateTime(getCreatedByDateTime(item))}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </td>

                          <td className="p-2 text-center">
                            <div className="flex flex-col items-center justify-center gap-2">
                              {isWebhookGeneratedOrder ? (
                                <>
                                  <span className="inline-flex rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-[11px] font-semibold text-amber-700">
                                    webhook 자동생성
                                  </span>
                                  <span className="text-[11px] leading-tight text-zinc-500">
                                    결제통장 출금 이벤트
                                  </span>
                                </>
                              ) : (
                                <>
                                  <span className="inline-flex rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-[11px] font-semibold text-sky-700">
                                    관리자 생성
                                  </span>
                                  <span className="text-[11px] leading-tight text-zinc-500">
                                    수동 매입신청 주문
                                  </span>
                                </>
                              )}

                              {isHistoryOnly && isWebhookGeneratedOrder && (
                                <div className="w-full rounded-lg border border-amber-200 bg-amber-50 px-2 py-2 text-center">
                                  <div className="text-[10px] font-semibold uppercase tracking-wide text-amber-700">
                                    은행출금 생성
                                  </div>
                                  <div className="mt-0.5 text-[11px] leading-tight text-amber-900">
                                    webhook 출금 이벤트 기반 자동생성 주문
                                  </div>
                                  {canDeleteWebhookGeneratedOrder ? (
                                    <button
                                      type="button"
                                      disabled={isDeletingWebhookOrder}
                                      onClick={() => {
                                        deleteWebhookGeneratedClearanceOrder(item);
                                      }}
                                      className={`
                                        mt-2 inline-flex h-8 items-center justify-center rounded-lg border px-2.5 text-[11px] font-semibold transition
                                        ${
                                          isDeletingWebhookOrder
                                            ? "cursor-not-allowed border-zinc-200 bg-zinc-100 text-zinc-400"
                                            : "border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-100"
                                        }
                                      `}
                                    >
                                      {isDeletingWebhookOrder ? "삭제중..." : "청산주문 삭제"}
                                    </button>
                                  ) : (
                                    <div className="mt-1 text-[10px] leading-tight text-amber-700">
                                      전송 queue 또는 TX가 없는 주문만 삭제할 수 있습니다.
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </td>

                      

                          <td className="p-2">
                            <div className="flex flex-col items-start justify-center gap-1">

                              {isWebhookGeneratedOrder && (
                                <div className="mb-1 inline-flex rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700">
                                  webhook 출금 자동생성
                                </div>
                              )}

                              <div className="flex flex-row items-center gap-1">
                                <Image
                                  src="/icon-user.png"
                                  alt="Buyer"
                                  width={20}
                                  height={20}
                                  className="w-5 h-5 rounded-full"
                                />


                                {item?.buyer?.nickname ? (
                                  <span className="text-sm font-semibold text-zinc-700">
                                    {item.buyer?.nickname}
                                  </span>
                                ) : (
                                  <span className="text-sm font-semibold text-zinc-700">
                                    {item.nickname || '익명'}
                                  </span>
                                )}

                              </div>


                              {/* item?.buyer?.bankInfo?.bankName, item?.buyer?.bankInfo?.accountNumber, item?.buyer?.bankInfo?.accountHolder */}
                              <div className="flex flex-row items-start gap-1">
                                <Image
                                  src="/icon-bank.png"
                                  alt="Bank"
                                  width={20}
                                  height={20}
                                  className="mt-0.5 rounded-lg w-5 h-5"
                                />
                                <div className="flex flex-col gap-0.5 leading-tight">
                                  <span className="text-sm text-zinc-600 font-semibold">
                                    {item?.buyer?.bankInfo?.bankName}
                                  </span>
                                  <span className="text-sm text-zinc-600 font-semibold break-all">
                                    {item?.buyer?.bankInfo?.accountNumber}
                                  </span>
                                  <span className="text-sm text-zinc-600 font-semibold">
                                    {item?.buyer?.bankInfo?.accountHolder}
                                  </span>
                                </div>
                              </div>


                              <div className="flex flex-row items-center gap-1">
                                <Image
                                  src="/icon-shield.png"
                                  alt="Shield"
                                  width={20}
                                  height={20}
                                  className="w-5 h-5 rounded-full"
                                />
                                <span className="text-sm">
                                  {item.walletAddress.slice(0, 6) + '...' + item.walletAddress.slice(-4)}
                                </span>
                              </div>

                            </div>
                          </td>


                          <td className="p-2 text-right">
                            <div className="flex flex-col items-end justify-center gap-1">

                            
                              <div className="flex flex-row items-center gap-1">
                                <Image
                                  src="/icon-tether.png"
                                  alt="Tether"
                                  width={20}
                                  height={20}
                                  className="w-5 h-5"
                                />
                                <span className="text-base text-[#409192] font-semibold"
                                  style={{
                                    fontFamily: 'monospace',
                                  }}
                                >
                                  {item.usdtAmount && item.usdtAmount.toFixed(3).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                                </span>
                              </div>

                              <span className="text-sm text-yellow-600 font-semibold"
                                style={{
                                  fontFamily: 'monospace',
                                }}
                              >
                                {Number(item.krwAmount)?.toLocaleString()}
                              </span>


                              <span className="text-xs text-zinc-400 font-semibold"
                                style={{
                                  fontFamily: 'monospace',
                                }}
                              >
                                {Number(item.rate).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                                </span>
                            </div>
                          </td>


                          {/*
                          <td>
                            {item?.buyer?.nickname ? (
                              <div className="w-36 flex flex-col items-start justify-center gap-1">

                                <span className="text-sm text-zinc-600">
                                  {item.buyer?.depositBankName}
                                </span>
                                <span className="text-sm text-zinc-600">
                                  {item.buyer?.depositBankAccountNumber}
                                </span>
                                <span className="text-sm text-zinc-600">
                                  {item.buyer?.depositName}
                                </span>

                              </div>
                            ) : (
                              <div className="w-36 flex flex-col items-start justify-center gap-1">
                                <span className="text-sm text-zinc-600">
                                  {item.seller?.bankInfo?.bankName}
                                </span>
                                <span className="text-sm text-zinc-600">
                                  {item.seller?.bankInfo?.accountNumber}
                                  </span>
                                <span className="text-sm text-zinc-600">
                                  {item.seller?.bankInfo?.accountHolder}
                                  </span>
                              </div>
                            )}
                          </td>
                          */}


                          {/*구매자 결제통장 정보*/}
                          <td>

                            <div className="w-32 flex flex-col items-start justify-center gap-1">
                              <span className="text-sm text-zinc-600">
                                {item.seller?.bankInfo?.bankName}
                              </span>
                              <span className="text-sm text-zinc-600">
                                {item.seller?.bankInfo?.accountNumber}
                                </span>
                              <span className="text-sm text-zinc-600">
                                {item.seller?.bankInfo?.accountHolder}
                                </span>
                            </div>

                          </td>


                          {/* 판매자 정보 */}
                          <td className="p-2 text-right">
                            {item?.seller?.walletAddress ? (
                              <div className="w-32 flex flex-col items-start justify-center gap-1">

                                <div className="flex flex-row items-center gap-1">
                                  <Image
                                    src="/icon-seller.png"
                                    alt="Seller"
                                    width={20}
                                    height={20}
                                    className="w-5 h-5 rounded-full"
                                  />
                                  <span className="text-sm font-semibold text-zinc-700">
                                    {item?.seller?.nickname || '익명'}
                                  </span>
                                </div>

                                <div className="flex flex-row items-center gap-1">
                                  <Image
                                    src="/icon-shield.png"
                                    alt="Shield"
                                    width={20}
                                    height={20}
                                    className="w-5 h-5 rounded-full"
                                  />
                                  <span className="text-sm">
                                    {item?.seller?.walletAddress.slice(0, 6) + '...' + item?.seller?.walletAddress.slice(-4)}
                                  </span>
                                </div>

                              </div>
                            ) : (
                              <span className="text-sm text-zinc-600">
                                판매자 확인중...
                              </span>
                            )}
                          </td>

                          <td className="p-2">
                            
                            {item.status === 'paymentConfirmed' && (
                              <span className="text-sm text-yellow-600 font-semibold"
                                style={{ fontFamily: 'monospace' }}
                              > 
                                {Number(item.krwAmount)?.toLocaleString()}
                              </span>
                            )}

                            {item.status === 'paymentRequested' && (

                              <div className="flex flex-row justify-end gap-1">
                                <input
                                  disabled={true}
                                  type="number"
                                  className="w-28
                                  px-2 py-1 border border-gray-300 rounded-md text-sm text-black"
                                  placeholder="Amount"
                                  value={paymentAmounts[index]}
                                  onChange={(e) => {
                                    // check number
                                    e.target.value = e.target.value.replace(/[^0-9.]/g, '');


                                    parseFloat(e.target.value) < 0 ? setPaymentAmounts(
                                      paymentAmounts.map((item, idx) => {
                                        if (idx === index) {
                                          return 0;
                                        }
                                        return item;
                                      })
                                    ) : setPaymentAmounts(
                                      paymentAmounts.map((item, idx) => {
                                        if (idx === index) {
                                          return parseFloat(e.target.value);
                                        }
                                        return item;
                                      })
                                    );

                                  }
                                }
                                />
                                  
                              </div>

                            )}
                          </td>   

                          {/* 출금상태: buyer.depositCompleted */}
                          <td className="p-2 w-36 text-center align-middle">

                            <div className="w-full flex items-center justify-center">

                            {
                            item.status === 'cancelled' && (
                              <span className="text-sm text-slate-600 border border-slate-400 rounded-md px-2 py-1">
                                취소됨
                              </span>
                            )}

                            {
                            item.status !== 'cancelled' && (
                              <>

                              {item?.buyer?.depositCompleted !== true
                              ? (
                                <div className="w-full flex flex-col items-center justify-center gap-1">
                                  <div className="w-full flex flex-row items-center justify-center gap-2">                                   
                                    <span className="text-sm text-red-600
                                      border border-red-600
                                      rounded-md px-2 py-1">
                                      출금대기중
                                    </span>
                                  </div>
                                  {/* 출금완료 버튼 */}
                                  <button
                                    disabled={loadingDeposit[index]}
                                    className={`
                                      group w-full h-9 inline-flex items-center justify-center gap-1.5 rounded-lg border px-2
                                      text-xs font-semibold transition-all duration-200 ease-out
                                      ${
                                        loadingDeposit[index]
                                          ? 'cursor-not-allowed border-slate-300 bg-slate-200 text-slate-500'
                                          : 'border-emerald-300 bg-gradient-to-b from-emerald-500 to-emerald-600 text-white shadow-[0_8px_16px_-10px_rgba(5,150,105,0.72)] hover:-translate-y-0.5 hover:from-emerald-600 hover:to-emerald-700 hover:shadow-[0_12px_22px_-12px_rgba(5,150,105,0.85)] active:translate-y-0'
                                      }
                                    `}

                                    onClick={() => {
                                      openWithdrawConfirmModal(index, item);
                                    }}
                                  >
                                    {loadingDeposit[index] && (
                                      <Image
                                        src="/loading.png"
                                        alt="Loading"
                                        width={20}
                                        height={20}
                                        className="h-4 w-4 animate-spin"
                                      />
                                    )}
                                    {!loadingDeposit[index] && (
                                      <span className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-white/40 bg-white/20 text-[10px] leading-none">
                                        ✓
                                      </span>
                                    )}
                                    <span>출금완료하기</span>
                                  </button>
                                  <button
                                    disabled={loadingDeposit[index] || isCancellingClearanceOrder}
                                    className={`
                                      group w-full h-9 inline-flex items-center justify-center gap-1.5 rounded-lg border px-2
                                      text-xs font-semibold transition-all duration-200 ease-out
                                      ${
                                        loadingDeposit[index] || isCancellingClearanceOrder
                                          ? 'cursor-not-allowed border-slate-300 bg-slate-200 text-slate-500'
                                          : 'border-rose-300 bg-gradient-to-b from-rose-500 to-rose-600 text-white shadow-[0_8px_16px_-10px_rgba(225,29,72,0.72)] hover:-translate-y-0.5 hover:from-rose-600 hover:to-rose-700 hover:shadow-[0_12px_22px_-12px_rgba(225,29,72,0.85)] active:translate-y-0'
                                      }
                                    `}
                                    onClick={() => {
                                      openCancelConfirmModal(index, item);
                                    }}
                                  >
                                    {(loadingDeposit[index] || isCancellingClearanceOrder) && (
                                      <Image
                                        src="/loading.png"
                                        alt="Loading"
                                        width={20}
                                        height={20}
                                        className="h-4 w-4 animate-spin"
                                      />
                                    )}
                                    {!loadingDeposit[index] && !isCancellingClearanceOrder && (
                                      <span className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-white/40 bg-white/20 text-[10px] leading-none">
                                        !
                                      </span>
                                    )}
                                    <span>{isCancellingClearanceOrder ? "취소중..." : "취소하기"}</span>
                                  </button>
                                </div>
                              ) : (
                                <div className="flex flex-col items-center justify-center gap-1">
                                  <span className="text-sm text-[#409192]
                                    border border-green-600
                                    rounded-md px-2 py-1">
                                    출금완료
                                  </span>
                                  {(getDepositCompletedActorLabel(item?.buyer) || item?.buyer?.depositCompletedAt) && (
                                    <div className="w-full rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1 text-center text-[11px] leading-4 text-emerald-800">
                                      {getDepositCompletedActorMeta(item?.buyer) && (
                                        <div className="mb-1">
                                          <span
                                            className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${getDepositCompletedActorMeta(item?.buyer)?.className}`}
                                          >
                                            {getDepositCompletedActorMeta(item?.buyer)?.label}
                                          </span>
                                        </div>
                                      )}
                                      {getDepositCompletedActorLabel(item?.buyer) && (
                                        <div>처리자 {getDepositCompletedActorLabel(item?.buyer)}</div>
                                      )}
                                      {item?.buyer?.depositCompletedAt && (
                                        <div>처리시각 {formatAdminActionDateTime(item?.buyer?.depositCompletedAt)}</div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              )}

                              </>

                            )}

                            </div>
                          </td>

                          <td className="p-2">
                            <div className="flex flex-col items-center justify-center gap-2">
                              <span className="rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-[11px] font-semibold text-sky-700">
                                전송량 {formatUsdtDisplay(item.usdtAmount)} USDT
                              </span>

                            {(item.status === 'ordered'
                              || item.status === 'accepted'
                            )
                            && (

                              <>
                              {/*
                              <button
                                disabled={cancellings[index]}
                                className={`flex flex-row gap-1 text-sm text-white px-2 py-1 rounded-md ${cancellings[index] ? 'bg-gray-500' : 'bg-red-500'}`}
                                onClick={() => cancelBuyOrder(item._id, index)}
                              >
                                <Image
                                  src="/loading.png"
                                  alt="loading"
                                  width={16}
                                  height={16}
                                  className={cancellings[index] ? 'animate-spin' : 'hidden'}
                                />
                                <span>{Cancel_My_Order}</span>
                              
                              </button>
                              */}


                              </>

                            )}

                            {item.status === 'ordered' && (

                                <>
                          
                                <span className="text-sm text-yellow-600 font-semibold">
                
                                  주문 신청중...
                                </span>


                                </>

                            )}



                            {item.status === 'paymentConfirmed' && (
                              <div className="flex flex-col items-center justify-center gap-2">

                                <span className="text-sm font-semibold text-[#409192]">
                                  USDT 전송완료
                                </span>
                                <span className="text-sm">
                                  {
                                  item.paymentConfirmedAt && new Date(item.paymentConfirmedAt)?.toLocaleString()
                                  }
                                </span>

                                {item.transactionHash && item.transactionHash !== '0x' ? (
                                isWithdrawalWebhookGeneratedClearanceOrderDummyTransfer(item) ? (
                                <div className="w-full rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-center">
                                  <div className="text-xs font-semibold text-amber-700">더미 전송 처리</div>
                                  <div className="mt-1 break-all font-mono text-[11px] text-amber-800">
                                    {item.transactionHash}
                                  </div>
                                </div>
                                ) : (
                                <button
                                  className="text-sm text-blue-600 font-semibold
                                    border border-blue-600 rounded-lg p-2
                                    bg-blue-100
                                    w-full text-center
                                    hover:bg-blue-200
                                    cursor-pointer
                                    transition-all duration-200 ease-in-out
                                    hover:scale-105
                                    hover:shadow-lg
                                    hover:shadow-blue-500/50
                                  "

                                  onClick={() => {
                                    let url = '';
                                    if (chain === "ethereum") {
                                      url = `https://etherscan.io/tx/${item.transactionHash}`;
                                    } else if (chain === "polygon") {
                                      url = `https://polygonscan.com/tx/${item.transactionHash}`;
                                    } else if (chain === "arbitrum") {
                                      url = `https://arbiscan.io/tx/${item.transactionHash}`;
                                    } else if (chain === "bsc") {
                                      url = `https://bscscan.com/tx/${item.transactionHash}`;
                                    } else {
                                      url = `https://arbiscan.io/tx/${item.transactionHash}`;
                                    }
                                    window.open(url, '_blank');

                                  }}

                                >
                                  <div className="flex flex-row gap-2 items-center justify-center">
                                    <Image
                                      src={`/logo-chain-${chain}.png`}
                                      alt="Chain"
                                      width={20}
                                      height={20}
                                      className="w-5 h-5"
                                    />
                                    <span className="text-sm">
                                      USDT 전송내역
                                    </span>
                                  </div>
                                </button>
                                )
                                ) : (
                                <div className="flex flex-col items-center justify-center gap-1">
                                  <div className="text-sm text-green-600 font-semibold border border-green-600 rounded-lg p-2">
                                    TXID 업데이트 중...
                                  </div>

                                  {item.queueId ? (
                                    <button
                                      type="button"
                                      disabled={checkingQueueTx || isQueueCheckingOrder(item._id)}
                                      onClick={() => syncQueueTransactionHashes([item._id])}
                                      className={`
                                        rounded-md border px-2 py-1 text-[11px] font-semibold transition
                                        ${
                                          checkingQueueTx || isQueueCheckingOrder(item._id)
                                            ? "cursor-not-allowed border-zinc-200 bg-zinc-100 text-zinc-400"
                                            : "border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100"
                                        }
                                      `}
                                    >
                                      {isQueueCheckingOrder(item._id) ? "점검중..." : "queue 재확인"}
                                    </button>
                                  ) : (
                                    <span className="text-[11px] text-rose-500">
                                      queueId 없음
                                    </span>
                                  )}
                                </div>
                                )}

                              </div>
                            )}

                            {item.status === 'accepted' && (
                              <div className="flex flex-row gap-1">

                                <span className="text-sm font-semibold text-yellow-600">
                                  주문접수
                                </span>

                                {/* check box for agreement */}
                                {/*
                                <input
                                  disabled={escrowing[index] || requestingPayment[index]}
                                  type="checkbox"
                                  checked={requestPaymentCheck[index]}
                                  onChange={(e) => {
                                    setRequestPaymentCheck(
                                      requestPaymentCheck.map((item, idx) => {
                                        if (idx === index) {
                                          return e.target.checked;
                                        }
                                        return item;
                                      })
                                    );
                                  }}
                                />

                                <button
                                  disabled={escrowing[index] || requestingPayment[index] || !requestPaymentCheck[index]}
                                  
                                  className={`flex flex-row gap-1 text-sm text-white px-2 py-1 rounded-md ${escrowing[index] || requestingPayment[index] || !requestPaymentCheck[index] ? 'bg-gray-500' : 'bg-green-500'}`}
                                  onClick={() => {
    
                                    requestPayment(
                                      index,
                                      item._id,
                                      item.tradeId,
                                      item.usdtAmount
                                    );
                                  }}
                                >
                                  <Image
                                    src="/loading.png"
                                    alt="loading"
                                    width={16}
                                    height={16}
                                    className={escrowing[index] || requestingPayment[index] ? 'animate-spin' : 'hidden'}
                                  />
                                  <span>{Request_Payment}</span>
                                
                                </button>
                                */}

                              </div>
                            )}

                            {item.status === 'paymentRequested' && (

                              <div className="flex flex-col items-center justify-center gap-2">

                                <span className="text-sm font-semibold text-yellow-600">
                                  USDT 전송요청
                                </span>

                                {item.transactionHash === "0x" && item.queueId && (
                                  <button
                                    type="button"
                                    disabled={checkingQueueTx || isQueueCheckingOrder(item._id)}
                                    onClick={() => syncQueueTransactionHashes([item._id])}
                                    className={`
                                      rounded-md border px-2 py-1 text-[11px] font-semibold transition
                                      ${
                                        checkingQueueTx || isQueueCheckingOrder(item._id)
                                          ? "cursor-not-allowed border-zinc-200 bg-zinc-100 text-zinc-400"
                                          : "border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100"
                                      }
                                    `}
                                  >
                                    {isQueueCheckingOrder(item._id) ? "점검중..." : "queue 재확인"}
                                  </button>
                                )}

                                {/* cancelTrade button */}
                                {/* functio cancelTrade(index, item._id) */}
                                {/*
                                <button
                                  disabled={cancellings[index]}
                                  className={`flex flex-row gap-1 text-sm text-white px-2 py-1 rounded-md ${cancellings[index] ? 'bg-gray-500' : 'bg-red-500'}`}
                                  onClick={() => {
                                    confirm (
                                      "정말로 취소하시겠습니까? \n\n" +
                                      "취소시 거래가 취소됩니다.\n\n"
                                    )
                                      &&  cancelTrade(item._id, index);
                                

                                  } }
                                >
                                  <Image
                                    src="/loading.png"
                                    alt="loading"
                                    width={16}
                                    height={16}
                                    className={`
                                      ${cancellings[index] ? 'animate-spin' : 'hidden'}
                                      w-4 h-4
                                    `}

                                  />
                                  <span>{Cancel_My_Order}</span>
                                </button>
                                */}



                              



                                {/*
                                <div className="flex flex-row gap-1">

                                  <input
                                    disabled={confirmingPayment[index]}
                                    type="checkbox"
                                    checked={confirmPaymentCheck[index]}
                                    onChange={(e) => {
                                      setConfirmPaymentCheck(
                                        confirmPaymentCheck.map((item, idx) => {
                                          if (idx === index) {
                                            return e.target.checked;
                                          }
                                          return item;
                                        })
                                      );
                                    }}
                                  />

                                  <button
                                    disabled={confirmingPayment[index] || !confirmPaymentCheck[index]}
                                    className={`flex flex-row gap-1 text-sm text-white px-2 py-1 rounded-md ${confirmingPayment[index] || !confirmPaymentCheck[index] ? 'bg-gray-500' : 'bg-green-500'}`}
                                    onClick={() => {
                                      confirmPayment(
                                        index,
                                        item._id,
                                        paymentAmounts[index]
                                      );
                                    }}

                                  >

                                    <Image
                                      src="/loading.png"
                                      alt="loading"
                                      width={16}
                                      height={16}
                                      className={confirmingPayment[index] ? 'animate-spin' : 'hidden'}
                                    />
                                    <span>{Confirm_Payment}</span>

                                  </button>

                                </div>
                                */}

                              </div>



                            )}
                            {item.status === 'cancelled' && (
                              <span className="text-red-500">{Cancelled}</span>
                            )}

                            {queueCheckResultsByOrderId[item._id] && (
                              <div
                                className={`
                                  max-w-[180px] text-center text-[11px]
                                  ${
                                    queueCheckResultsByOrderId[item._id].tone === "success"
                                      ? "text-emerald-600"
                                      : queueCheckResultsByOrderId[item._id].tone === "warning"
                                      ? "text-amber-600"
                                      : "text-rose-600"
                                  }
                                `}
                              >
                                {queueCheckResultsByOrderId[item._id].message}
                              </div>
                            )}

                            </div>

                          </td>

                          </tr>
                        );
                      })}
                  </tbody>
                  </table>

                </div>


            </div>





          {/* pagination */}
          <div className="mt-4 rounded-2xl border border-zinc-200 bg-white px-4 py-3 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-600">
                <span className="rounded-full bg-zinc-100 px-2.5 py-1 font-semibold text-zinc-700">
                  총 {Number(totalCount).toLocaleString()}건
                </span>
                <span>페이지당</span>
                <select
                  value={limitValue}
                  onChange={(e) => {
                    const nextLimit = Number(e.target.value);
                    setLimitValue(nextLimit);
                    moveToPage(1, nextLimit);
                  }}
                  className="h-8 rounded-lg border border-zinc-300 bg-white px-2 text-xs font-medium text-zinc-700 outline-none transition focus:border-zinc-500"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>

              <div className="flex flex-wrap items-center gap-1">
                <button
                  disabled={!canMovePrev}
                  className={`h-8 rounded-lg px-3 text-xs font-semibold transition ${canMovePrev ? 'border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-100' : 'border border-zinc-200 bg-zinc-100 text-zinc-400'}`}
                  onClick={() => moveToPage(1)}
                >
                  처음
                </button>

                <button
                  disabled={!canMovePrev}
                  className={`h-8 rounded-lg px-3 text-xs font-semibold transition ${canMovePrev ? 'border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-100' : 'border border-zinc-200 bg-zinc-100 text-zinc-400'}`}
                  onClick={() => moveToPage(currentPage - 1)}
                >
                  이전
                </button>

                <span className="inline-flex h-8 min-w-[88px] items-center justify-center rounded-lg border border-zinc-300 bg-zinc-50 px-2 text-xs font-semibold text-zinc-700">
                  {currentPage} / {totalPages}
                </span>

                <button
                  disabled={!canMoveNext}
                  className={`h-8 rounded-lg px-3 text-xs font-semibold transition ${canMoveNext ? 'border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-100' : 'border border-zinc-200 bg-zinc-100 text-zinc-400'}`}
                  onClick={() => moveToPage(currentPage + 1)}
                >
                  다음
                </button>

                <button
                  disabled={!canMoveNext}
                  className={`h-8 rounded-lg px-3 text-xs font-semibold transition ${canMoveNext ? 'border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-100' : 'border border-zinc-200 bg-zinc-100 text-zinc-400'}`}
                  onClick={() => moveToPage(totalPages)}
                >
                  마지막
                </button>
              </div>

              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min={1}
                  max={totalPages}
                  value={pageValue}
                  onChange={(e) => setPageValue(Math.max(1, Number(e.target.value) || 1))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      moveToPage(pageValue);
                    }
                  }}
                  className="h-8 w-20 rounded-lg border border-zinc-300 bg-white px-2 text-xs text-zinc-700 outline-none focus:border-zinc-500"
                />
                <button
                  className="h-8 rounded-lg bg-zinc-900 px-3 text-xs font-semibold text-white transition hover:bg-zinc-700"
                  onClick={() => moveToPage(pageValue)}
                >
                  이동
                </button>
              </div>
            </div>
          </div>



          <footer className="mt-5 w-full rounded-2xl border border-zinc-200 bg-white px-4 py-4 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-xs text-zinc-500">
                © {new Date().getFullYear()} Stable Makeup. All rights reserved.
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <a href={`/${params.lang}/terms-of-service`} className="rounded-md border border-zinc-200 px-2 py-1 text-zinc-600 transition hover:bg-zinc-100">
                  이용약관
                </a>
                <a href={`/${params.lang}/privacy-policy`} className="rounded-md border border-zinc-200 px-2 py-1 text-zinc-600 transition hover:bg-zinc-100">
                  개인정보처리방침
                </a>
                <a href={`/${params.lang}/contact`} className="rounded-md border border-zinc-200 px-2 py-1 text-zinc-600 transition hover:bg-zinc-100">
                  고객센터
                </a>
              </div>
            </div>
          </footer>



            
          </div>

          <Modal
            isOpen={Boolean(withdrawConfirmOrder)}
            onClose={closeWithdrawConfirmModal}
            panelClassName="max-w-2xl"
          >
            {withdrawConfirmOrder && (
              <div className="flex flex-col gap-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">출금완료 처리 확인</h3>
                    <p className="mt-1 text-sm text-slate-500">
                      아래 거래를 출금완료로 처리하시겠습니까?
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={closeWithdrawConfirmModal}
                    className="rounded-md border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-500 hover:bg-slate-50"
                  >
                    닫기
                  </button>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div className="grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
                    <div className="flex items-center justify-between gap-2 rounded-lg bg-white px-3 py-2">
                      <span className="text-xs text-slate-500">신청번호</span>
                      <span className="font-semibold text-slate-900">
                        {withdrawConfirmOrder.tradeId || withdrawConfirmOrder._id}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2 rounded-lg bg-white px-3 py-2">
                      <span className="text-xs text-slate-500">신청시간</span>
                      <span className="font-semibold text-slate-900">
                        {withdrawConfirmOrder.createdAt
                          ? new Date(withdrawConfirmOrder.createdAt).toLocaleString()
                          : '-'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2 rounded-lg bg-white px-3 py-2">
                      <span className="text-xs text-slate-500">매입량</span>
                      <span className="font-semibold text-slate-900">
                        {Number(withdrawConfirmOrder.usdtAmount || 0).toFixed(3)} USDT
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2 rounded-lg bg-white px-3 py-2">
                      <span className="text-xs text-slate-500">매입금액</span>
                      <span className="font-semibold text-slate-900">
                        {Number(withdrawConfirmOrder.krwAmount || 0).toLocaleString()} 원
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2 rounded-lg bg-white px-3 py-2">
                      <span className="text-xs text-slate-500">구매자</span>
                      <span className="font-semibold text-slate-900">
                        {withdrawConfirmOrder?.buyer?.bankInfo?.accountHolder || '-'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2 rounded-lg bg-white px-3 py-2">
                      <span className="text-xs text-slate-500">구매자 계좌</span>
                      <span className="max-w-[220px] truncate font-semibold text-slate-900">
                        {withdrawConfirmOrder?.buyer?.bankInfo?.bankName
                          ? `${withdrawConfirmOrder.buyer.bankInfo.bankName} ${withdrawConfirmOrder.buyer.bankInfo.accountNumber || ''}`
                          : '-'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2 rounded-lg bg-white px-3 py-2">
                      <span className="text-xs text-slate-500">판매자 결제계좌</span>
                      <span className="max-w-[220px] truncate font-semibold text-slate-900">
                        {withdrawConfirmOrder?.seller?.bankInfo?.bankName
                          ? `${withdrawConfirmOrder.seller.bankInfo.bankName} ${withdrawConfirmOrder.seller.bankInfo.accountNumber || ''}`
                          : '-'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2 rounded-lg bg-white px-3 py-2">
                      <span className="text-xs text-slate-500">전송 TX</span>
                      <span className="max-w-[220px] truncate font-semibold text-slate-900">
                        {withdrawConfirmOrder.transactionHash && withdrawConfirmOrder.transactionHash !== '0x'
                          ? `${withdrawConfirmOrder.transactionHash.slice(0, 8)}...${withdrawConfirmOrder.transactionHash.slice(-6)}`
                          : '-'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                  출금완료 처리 후에는 되돌릴 수 없습니다. 거래 정보와 입금/출금 상태를 확인한 뒤 진행하세요.
                </div>

                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={closeWithdrawConfirmModal}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    취소
                  </button>
                  <button
                    type="button"
                    disabled={withdrawConfirmLoading}
                    onClick={confirmWithdrawDepositCompleted}
                    className={`group flex min-w-[140px] items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold text-white transition-all duration-200 ease-out ${
                      withdrawConfirmLoading
                        ? 'cursor-not-allowed border-slate-300 bg-slate-400'
                        : 'border-emerald-300 bg-gradient-to-b from-emerald-500 to-emerald-600 shadow-[0_10px_20px_-12px_rgba(5,150,105,0.75)] hover:-translate-y-0.5 hover:from-emerald-600 hover:to-emerald-700 hover:shadow-[0_14px_24px_-12px_rgba(5,150,105,0.85)] active:translate-y-0'
                    }`}
                  >
                    {withdrawConfirmLoading && (
                      <Image
                        src="/loading.png"
                        alt="loading"
                        width={16}
                        height={16}
                        className="h-4 w-4 animate-spin"
                      />
                    )}
                    {!withdrawConfirmLoading && (
                      <span className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-white/40 bg-white/20 text-[10px] leading-none">
                        ✓
                      </span>
                    )}
                    <span>출금완료 처리</span>
                  </button>
                </div>
              </div>
            )}
          </Modal>

          <Modal
            isOpen={Boolean(cancelConfirmOrder)}
            onClose={closeCancelConfirmModal}
            panelClassName="max-w-2xl"
          >
            {cancelConfirmOrder && (
              <div className="flex flex-col gap-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">청산주문 취소 확인</h3>
                    <p className="mt-1 text-sm text-slate-500">
                      아래 청산주문을 취소하시겠습니까?
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={closeCancelConfirmModal}
                    className="rounded-md border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-500 hover:bg-slate-50"
                  >
                    닫기
                  </button>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div className="grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
                    <div className="flex items-center justify-between gap-2 rounded-lg bg-white px-3 py-2">
                      <span className="text-xs text-slate-500">신청번호</span>
                      <span className="font-semibold text-slate-900">
                        {cancelConfirmOrder.tradeId || cancelConfirmOrder._id}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2 rounded-lg bg-white px-3 py-2">
                      <span className="text-xs text-slate-500">현재상태</span>
                      <span className="font-semibold text-slate-900">
                        {cancelConfirmOrder.status || '-'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2 rounded-lg bg-white px-3 py-2">
                      <span className="text-xs text-slate-500">신청시간</span>
                      <span className="font-semibold text-slate-900">
                        {cancelConfirmOrder.createdAt
                          ? new Date(cancelConfirmOrder.createdAt).toLocaleString()
                          : '-'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2 rounded-lg bg-white px-3 py-2">
                      <span className="text-xs text-slate-500">매입량</span>
                      <span className="font-semibold text-slate-900">
                        {Number(cancelConfirmOrder.usdtAmount || 0).toFixed(3)} USDT
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2 rounded-lg bg-white px-3 py-2">
                      <span className="text-xs text-slate-500">매입금액</span>
                      <span className="font-semibold text-slate-900">
                        {Number(cancelConfirmOrder.krwAmount || 0).toLocaleString()} 원
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2 rounded-lg bg-white px-3 py-2">
                      <span className="text-xs text-slate-500">구매자</span>
                      <span className="font-semibold text-slate-900">
                        {cancelConfirmOrder?.buyer?.bankInfo?.accountHolder || '-'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2 rounded-lg bg-white px-3 py-2">
                      <span className="text-xs text-slate-500">구매자 계좌</span>
                      <span className="max-w-[220px] truncate font-semibold text-slate-900">
                        {cancelConfirmOrder?.buyer?.bankInfo?.bankName
                          ? `${cancelConfirmOrder.buyer.bankInfo.bankName} ${cancelConfirmOrder.buyer.bankInfo.accountNumber || ''}`
                          : '-'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2 rounded-lg bg-white px-3 py-2">
                      <span className="text-xs text-slate-500">전송 TX</span>
                      <span className="max-w-[220px] truncate font-semibold text-slate-900">
                        {cancelConfirmOrder.transactionHash && cancelConfirmOrder.transactionHash !== '0x'
                          ? `${cancelConfirmOrder.transactionHash.slice(0, 8)}...${cancelConfirmOrder.transactionHash.slice(-6)}`
                          : '-'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800">
                  주문 상태는 취소로 전환되고, 연결된 입금 매칭 정보는 해제됩니다. 이미 발생한 온체인 전송은 되돌릴 수 없습니다.
                </div>

                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={closeCancelConfirmModal}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    닫기
                  </button>
                  <button
                    type="button"
                    disabled={cancelConfirmLoading}
                    onClick={confirmCancelClearanceOrder}
                    className={`group flex min-w-[140px] items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold text-white transition-all duration-200 ease-out ${
                      cancelConfirmLoading
                        ? 'cursor-not-allowed border-slate-300 bg-slate-400'
                        : 'border-rose-300 bg-gradient-to-b from-rose-500 to-rose-600 shadow-[0_10px_20px_-12px_rgba(225,29,72,0.75)] hover:-translate-y-0.5 hover:from-rose-600 hover:to-rose-700 hover:shadow-[0_14px_24px_-12px_rgba(225,29,72,0.85)] active:translate-y-0'
                    }`}
                  >
                    {cancelConfirmLoading && (
                      <Image
                        src="/loading.png"
                        alt="loading"
                        width={16}
                        height={16}
                        className="h-4 w-4 animate-spin"
                      />
                    )}
                    {!cancelConfirmLoading && (
                      <span className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-white/40 bg-white/20 text-[10px] leading-none">
                        !
                      </span>
                    )}
                    <span>청산주문 취소</span>
                  </button>
                </div>
              </div>
            )}
          </Modal>


          {!isEmbedded && (
          <Modal isOpen={isModalOpen} onClose={closeModal} panelClassName="max-w-2xl p-0">
            <div className="overflow-hidden rounded-2xl">
              <div className="border-b border-slate-200 bg-gradient-to-r from-slate-900 to-slate-800 px-5 py-4 text-white">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-xs font-semibold tracking-[0.2em] text-slate-300">
                      CLEARANCE PREVIEW
                    </div>
                    <h2 className="mt-1 text-xl font-semibold">매입신청 사전 점검</h2>
                    <p className="mt-1 text-sm text-slate-300">
                      신청 전 한도, 누적 금액, 차단 사유를 먼저 확인합니다.
                    </p>
                  </div>
                  <button
                    onClick={closeModal}
                    className="rounded-full border border-white/20 px-3 py-1 text-sm text-slate-200 hover:bg-white/10"
                  >
                    닫기
                  </button>
                </div>
              </div>

              <div className="bg-slate-50 px-5 py-5">
                {loadingClearanceOrderPreview ? (
                  <div className="rounded-2xl border border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-500">
                    매입신청 미리 계산 중입니다...
                  </div>
                ) : clearanceOrderPreview ? (
                  <div className="space-y-4">
                    <div className="grid gap-3 md:grid-cols-3">
                      <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                        <div className="text-[11px] font-semibold tracking-wide text-slate-500">신청금액</div>
                        <div className="mt-2 text-2xl font-semibold text-amber-600" style={{ fontFamily: 'monospace' }}>
                          {formatKrwDisplay(clearanceOrderPreview.requestedKrwAmount)}
                        </div>
                      </div>
                      <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                        <div className="text-[11px] font-semibold tracking-wide text-slate-500">예상 매입량</div>
                        <div className="mt-2 text-2xl font-semibold text-emerald-600" style={{ fontFamily: 'monospace' }}>
                          {formatUsdtDisplay(clearanceOrderPreview.requestedUsdtAmount)} USDT
                        </div>
                      </div>
                      <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                        <div className="text-[11px] font-semibold tracking-wide text-slate-500">적용 환율</div>
                        <div className="mt-2 text-2xl font-semibold text-slate-800" style={{ fontFamily: 'monospace' }}>
                          {Number(clearanceOrderPreview.rate || 0).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                      <div className="mb-3 flex items-center justify-between gap-2">
                        <div className="text-sm font-semibold text-slate-800">한도 점검</div>
                        <div className="text-xs text-slate-500">KST {clearanceOrderPreview.kstDayLabel}</div>
                      </div>

                      <div className="grid gap-3 md:grid-cols-2">
                        <div className={`rounded-xl border px-4 py-3 ${clearanceOrderPreview.withinPerOrderLimit ? 'border-emerald-200 bg-emerald-50' : 'border-rose-200 bg-rose-50'}`}>
                          <div className="text-[11px] font-semibold tracking-wide text-slate-500">1회 한도</div>
                          <div className="mt-2 flex items-end justify-between gap-3">
                            <div>
                              <div className="text-lg font-semibold text-slate-900">{formatKrwDisplay(clearanceOrderPreview.maxKrwAmount)}</div>
                              <div className="text-xs text-slate-500">신청 {formatKrwDisplay(clearanceOrderPreview.requestedKrwAmount)}</div>
                            </div>
                            <div className={`rounded-full px-2.5 py-1 text-xs font-semibold ${clearanceOrderPreview.withinPerOrderLimit ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                              {clearanceOrderPreview.withinPerOrderLimit ? '통과' : '초과'}
                            </div>
                          </div>
                        </div>

                        <div className={`rounded-xl border px-4 py-3 ${clearanceOrderPreview.withinDailyLimit ? 'border-blue-200 bg-blue-50' : 'border-rose-200 bg-rose-50'}`}>
                          <div className="text-[11px] font-semibold tracking-wide text-slate-500">1일 누적 한도</div>
                          <div className="mt-2 space-y-1 text-sm text-slate-700">
                            <div className="flex items-center justify-between gap-3">
                              <span>현재 누적</span>
                              <span className="font-semibold" style={{ fontFamily: 'monospace' }}>
                                {formatKrwDisplay(clearanceOrderPreview.currentDailyKrwAmount)}
                              </span>
                            </div>
                            <div className="flex items-center justify-between gap-3">
                              <span>신청 후 예상</span>
                              <span className="font-semibold" style={{ fontFamily: 'monospace' }}>
                                {formatKrwDisplay(clearanceOrderPreview.projectedDailyKrwAmount)}
                              </span>
                            </div>
                            <div className="flex items-center justify-between gap-3">
                              <span>최대 한도</span>
                              <span className="font-semibold" style={{ fontFamily: 'monospace' }}>
                                {formatKrwDisplay(clearanceOrderPreview.maxDailyKrwAmount)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                      <div className="mb-3 text-sm font-semibold text-slate-800">실시간 검증</div>
                      <div className="grid gap-2 text-sm md:grid-cols-2">
                        <div className="rounded-xl bg-slate-50 px-3 py-2">
                          <div className="text-[11px] font-semibold tracking-wide text-slate-500">요청 관리자 권한</div>
                          <div className={`mt-1 font-semibold ${clearanceOrderPreview.requesterIsAuthorizedAdmin ? 'text-emerald-700' : 'text-rose-700'}`}>
                            {clearanceOrderPreview.requesterIsAuthorizedAdmin ? 'admin 권한 확인' : 'admin 권한 확인 실패'}
                          </div>
                        </div>
                        <div className="rounded-xl bg-slate-50 px-3 py-2">
                          <div className="text-[11px] font-semibold tracking-wide text-slate-500">청산 지갑 상태</div>
                          <div className={`mt-1 font-semibold ${clearanceOrderPreview.clearanceWalletIsServerWallet ? 'text-emerald-700' : 'text-rose-700'}`}>
                            {clearanceOrderPreview.clearanceWalletIsServerWallet ? 'server wallet smart account' : 'server wallet 검증 실패'}
                          </div>
                        </div>
                        <div className="rounded-xl bg-slate-50 px-3 py-2">
                          <div className="text-[11px] font-semibold tracking-wide text-slate-500">오늘 누적 주문 수</div>
                          <div className="mt-1 font-semibold text-slate-800">
                            {Number(clearanceOrderPreview.currentDailyOrderCount || 0).toLocaleString()}건
                          </div>
                        </div>
                        <div className="rounded-xl bg-slate-50 px-3 py-2">
                          <div className="text-[11px] font-semibold tracking-wide text-slate-500">남은 일일 한도</div>
                          <div className="mt-1 font-semibold text-slate-800" style={{ fontFamily: 'monospace' }}>
                            {formatKrwDisplay(clearanceOrderPreview.remainingDailyKrwAmount)}
                          </div>
                        </div>
                      </div>
                    </div>

                    {clearanceOrderPreview.existingActiveOrder && (
                      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                        참고: 동일한 진행중 주문이 있습니다.
                        {' '}#{clearanceOrderPreview.existingActiveOrder.tradeId}
                        {' '}({clearanceOrderPreview.existingActiveOrder.status})
                      </div>
                    )}

                    {clearanceOrderPreview.blockingReasons.length > 0 ? (
                      <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3">
                        <div className="text-sm font-semibold text-rose-800">현재 상태로는 매입신청이 차단됩니다.</div>
                        <div className="mt-2 space-y-1 text-sm text-rose-700">
                          {clearanceOrderPreview.blockingReasons.map((reason, index) => (
                            <div key={`${reason}-${index}`}>- {reason}</div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                        현재 입력 기준으로는 매입신청이 가능합니다. 확인 후 최종 신청하세요.
                      </div>
                    )}

                    <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
                      <button
                        onClick={closeModal}
                        className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        다시 수정
                      </button>
                      <button
                        disabled={!clearanceOrderPreview.canSubmit || buyOrdering}
                        onClick={() => {
                          closeModal();
                          buyOrder();
                        }}
                        className={`rounded-xl px-4 py-2.5 text-sm font-semibold text-white ${
                          clearanceOrderPreview.canSubmit && !buyOrdering
                            ? 'bg-slate-900 hover:bg-black'
                            : 'bg-slate-400'
                        }`}
                      >
                        확인 후 매입신청
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </Modal>
          )}


        </main>

    );


};
