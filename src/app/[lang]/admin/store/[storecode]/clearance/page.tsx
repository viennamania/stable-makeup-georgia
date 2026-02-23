'use client';

import { useState, useEffect, use } from "react";



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



import { getDictionary } from "../../../../../dictionaries";


interface BuyOrder {
  _id: string;
  createdAt: string;
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

      if (isEmbedded) {
        nextParams.set('storecode', storecode);
        router.push(`/${params.lang}/admin/store/clearance-management?${nextParams.toString()}`);
        return;
      }

      router.push(`/${params.lang}/admin/store/${storecode}/clearance?${nextParams.toString()}`);
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

    const fetchBuyOrders = async () => {

      if (!storecode) {
        return;
      }

      setLoadingFetchBuyOrders(true);

      try {
        // api call
        //const response = await fetch('/api/order/getAllBuyOrders', {
        const response = await fetch('/api/order/getAllCollectOrdersForSeller', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            lang: params.lang,
            storecode: storecode,
            limit: Number(limitValue),
            page: Number(pageValue),
            walletAddress: address || "",
            searchMyOrders: address ? searchMyOrders : false,
            privateSale: true,
            fromDate: searchFromDate,
            toDate: searchToDate,
          })
        });

        const data = await response.json();

        if (data.result) {
          setBuyOrders(data.result.orders);
          setTotalCount(data.result.totalCount);

          setTotalClearanceCount(data.result.totalClearanceCount);
          setTotalClearanceAmount(data.result.totalClearanceAmount);
          setTotalClearanceAmountKRW(data.result.totalClearanceAmountKRW);
        }
      } catch (error) {
        console.error('fetchBuyOrders error', error);
      } finally {
        setLoadingFetchBuyOrders(false);
        setHasFetchedBuyOrdersOnce(true);
      }

    };




    useEffect(() => {

        if (!storecode) {
          return;
        }
        
        

  
        fetchBuyOrders();

        // fetch sell orders every 10 seconds
      
        const interval = setInterval(() => {
          fetchBuyOrders();
        }, 10000);

        return () => clearInterval(interval);


    }, [address, searchMyOrders, params.lang, storecode, limitValue, pageValue, searchFromDate, searchToDate]);





    const [isModalOpen, setModalOpen] = useState(false);

    const closeModal = () => setModalOpen(false);
    const openModal = () => setModalOpen(true);
    const [withdrawConfirmTarget, setWithdrawConfirmTarget] = useState<{
      index: number;
      order: BuyOrder;
    } | null>(null);

    const goChat = () => {
        console.log('Go Chat');
        router.push(`/chat?tradeId=12345`);
    }


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

    //console.log('buyerBankInfo', buyerBankInfo);

    const buyOrder = async () => {

      if (buyOrdering) {
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

      let orderUsdtAmount = usdtAmount;

      if (checkInputKrwAmount) {
        orderUsdtAmount = parseFloat(Number(safeKrwAmount / rate).toFixed(2));
      }
      

      const response = await fetch('/api/order/setBuyOrderForClearance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          lang: params.lang,
          storecode: storecode,

          ////////////walletAddress: address,
          //walletAddress: store.sellerWalletAddress,
          walletAddress: store?.privateSaleWalletAddress || store?.sellerWalletAddress,

          
          sellerBankInfo: withdrawalBankInfo,


          usdtAmount: orderUsdtAmount,
          krwAmount: safeKrwAmount,
          rate: rate,
          privateSale: true,
          buyer: {
            depositName: "",

            //bankName: buyerBankInfo.bankName,
            //accountNumber: buyerBankInfo.accountNumber,
            //accountHolder: buyerBankInfo.accountHolder,
            bankInfo: {
              bankName: buyerBankInfo.bankName,
              accountNumber: buyerBankInfo.accountNumber,
              accountHolder: buyerBankInfo.accountHolder,
            },
          }
        })

      });

      ////console.log('buyOrder response', response);

      if (!response.ok) {
        setBuyOrdering(false);
        toast.error('주문을 처리하는 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
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
            //storecode: "admin",

            walletAddress: address,
            searchMyOrders: searchMyOrders,

            privateSale: true,
            fromDate: searchFromDate,
            toDate: searchToDate

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

    setLoadingDeposit((prev) =>
      prev.map((item, idx) => idx === index ? true : item)
    );

    try {
      const response = await fetch('/api/order/buyOrderDepositCompleted', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: orderId,
          walletAddress: address,
        }),
      });
      
      if (!response.ok) {
        setLoadingDeposit((prev) =>
          prev.map((item, idx) => idx === index ? false : item)
        );
        toast.error('Failed to set deposit completed');
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
              },
            };
          }
          return item;
        })
      );

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



    // get store by storecode
    const [fetchingStore, setFetchingStore] = useState(false);
    const [store, setStore] = useState<any>(null);
    
    const fetchStore = async () => {
        if (fetchingStore) {
        return;
        }
        setFetchingStore(true);
        const response = await fetch('/api/store/getOneStore', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(
            {
            storecode: normalizedStorecode,
            }
        ),
        });
        if (!response.ok) {
        setFetchingStore(false);
        return;
        }
        const data = await response.json();
        
        //console.log('getOneStore data', data);

        setStore(data.result);

        setBuyerBankInfo({
          depositName: "",
          bankName: data.result.bankInfo?.bankName || "",
          accountNumber: data.result.bankInfo?.accountNumber || "",
          accountHolder: data.result.bankInfo?.accountHolder || "",
        });

        setWithdrawalBankInfo({
          bankName: data.result.withdrawalBankInfo?.bankName || "",
          accountNumber: data.result.withdrawalBankInfo?.accountNumber || "",
          accountHolder: data.result.withdrawalBankInfo?.accountHolder || "",
        });


        setFetchingStore(false);

        return data.result;
    }

    useEffect(() => {

        fetchStore();

    } , [normalizedStorecode]);




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

      if (!sellersBalanceStorecode) {
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
    }, [sellersBalanceStorecode]);

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
    const pendingQueueCheckOrderIds = getPendingQueueCheckOrderIds();
    const pendingQueueCheckCount = pendingQueueCheckOrderIds.length;




    
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
                          등록된 구매자 계좌 정보가 없습니다.
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

                                      buyOrder();
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

                              <p className={`mt-2 text-[11px] ${safeKrwAmount > 0 ? 'text-slate-500' : 'text-blue-700'}`}>
                                {safeKrwAmount > 0
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
                                    disabled={!address || safeKrwAmount <= 0 || buyOrdering}
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
                                        disabled={safeKrwAmount <= 0 || agreementPlaceOrder === false}
                                        className={`
                                          h-full min-h-[56px] w-full rounded-xl px-4 py-3 text-lg font-semibold text-white transition
                                          ${safeKrwAmount <= 0 || agreementPlaceOrder === false
                                            ? 'bg-slate-400'
                                            : 'bg-slate-800 hover:bg-slate-900'
                                          }
                                        `}
                                        onClick={() => {
                                            buyOrder();
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
                        className="relative flex min-w-[300px] flex-row items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-zinc-50 p-3">
                        {seller.walletAddress === store?.settlementWalletAddress ? (
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
                       

                        {/* if seller nickname is 'seller', then show withdraw button */}
                        
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
                      
                    ))}
                    </div>
                  )}

                </div>

                {hasFetchedBuyOrdersOnce && buyOrders.length === 0 && (
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
                        
                        <th className="w-[220px] text-center">거래상태</th>
                        <th className="w-[170px] text-center">출금상태</th>

                          
                      </tr>
                  </thead>
                  <tbody>
                      {buyOrders.map((item, index) => (
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
                            </div>
                          </td>

                      

                          <td className="p-2">
                            <div className="flex flex-col items-start justify-center gap-1">

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
                                  <div className="flex flex-row flex-wrap items-center gap-1">
                                    <span className="text-sm text-zinc-600 font-semibold">
                                      {item?.buyer?.bankInfo?.bankName}
                                    </span>
                                    <span className="text-sm text-zinc-600 font-semibold">
                                      {item?.buyer?.bankInfo?.accountNumber?.length > 5 ?
                                        item?.buyer?.bankInfo?.accountNumber.slice(0, 3) + '****' + item?.buyer?.bankInfo?.accountNumber.slice(-2)
                                        :
                                        item?.buyer?.bankInfo?.accountNumber
                                      }
                                    </span>
                                  </div>
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

                          <td className="p-2">
                            <div className="flex flex-col items-center justify-center gap-2">

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
                                  {Completed}
                                </span>
                                <span className="text-sm">
                                  {
                                  item.paymentConfirmedAt && new Date(item.paymentConfirmedAt)?.toLocaleString()
                                  }
                                </span>

                                {item.transactionHash && item.transactionHash !== '0x' ? (
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


                          {/* 출금상태: buyer.depositCompleted */}
                          <td className="p-2 w-36 text-center align-middle">

                            <div className="w-full flex items-center justify-center">

                            {
                            item.transactionHash && item.transactionHash !== '0x' && (
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
                                </div>
                              ) : (
                                <span className="text-sm text-[#409192]
                                  border border-green-600
                                  rounded-md px-2 py-1">
                                  출금완료
                                </span>
                              )}

                              </>

                            )}

                            </div>
                          </td>

                          </tr>
                      ))}
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


          <Modal isOpen={isModalOpen} onClose={closeModal}>
              <TradeDetail
                  closeModal={closeModal}
                  goChat={goChat}
              />
          </Modal>


        </main>

    );


};






// close modal

const TradeDetail = (
    {
        closeModal = () => {},
        goChat = () => {},
        
    }
) => {


    const [amount, setAmount] = useState(1000);
    const price = 91.17; // example price
    const receiveAmount = (amount / price).toFixed(2);
    const commission = 0.01; // example commission
  
    return (

      <div className="max-w-2xl mx-auto bg-white shadow-lg rounded-lg p-6">
        <div className="flex items-center">
          <span className="inline-block w-4 h-4 rounded-full bg-green-500 mr-2"></span>
          <h2 className="text-lg font-semibold text-black ">Iskan9</h2>
          <span className="ml-2 text-blue-500 text-sm">318 trades</span>
        </div>
        <p className="text-gray-600 mt-2">The offer is taken from another source. You can only use chat if the trade is open.</p>
        
        <div className="mt-4">
          <div className="flex justify-between text-gray-700">
            <span>Price</span>
            <span>{price} KRW</span>
          </div>
          <div className="flex justify-between text-gray-700 mt-2">
            <span>Limit</span>
            <span>40680.00 KRW - 99002.9 KRW</span>
          </div>
          <div className="flex justify-between text-gray-700 mt-2">
            <span>Available</span>
            <span>1085.91 USDT</span>
          </div>
          <div className="flex justify-between text-gray-700 mt-2">
            <span>Seller&apos;s payment method</span>
            <span className="bg-yellow-100 text-yellow-800 px-2 rounded-full">Tinkoff</span>
          </div>
          <div className="mt-4 text-gray-700">
            <p>24/7</p>
          </div>
        </div>
  
        <div className="mt-6 border-t pt-4 text-gray-700">
          <div className="flex flex-col space-y-4">
            <div>
              <label className="block text-gray-700">I want to pay</label>
              <input 
                type="number"
                value={amount}
                onChange={(e) => setAmount(
                    e.target.value === '' ? 0 : parseInt(e.target.value)
                ) }

                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-gray-700">I will receive</label>
              <input 
                type="text"
                value={`${receiveAmount} USDT`}
                readOnly
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-gray-700">Commission</label>
              <input 
                type="text"
                value={`${commission} USDT`}
                readOnly
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
          </div>
          
          <div className="mt-6 flex space-x-4">
            <button
                className="bg-green-500 text-white px-4 py-2 rounded-lg"
                onClick={() => {
                    console.log('Buy USDT');
                    // go to chat
                    // close modal
                    closeModal();
                    goChat();

                }}
            >
                Buy USDT
            </button>
            <button
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg"
                onClick={() => {
                    console.log('Cancel');
                    // close modal
                    closeModal();
                }}
            >
                Cancel
            </button>
          </div>

        </div>


      </div>
    );
  };
