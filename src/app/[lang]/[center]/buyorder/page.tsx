'use client';

import { useState, useEffect, use, act, useRef } from "react";

import Image from "next/image";



// open modal

//import Modal from '@/components/modal';
import ModalUser from '@/components/modal-user';
import Modal from '@/components/modal';

import { useRouter }from "next//navigation";


import { toast } from 'react-hot-toast';

import {
  clientId,
  client
} from "../../../client";



import {
  getContract,
  sendAndConfirmTransaction,
  sendTransaction,
  waitForReceipt,
} from "thirdweb";


import {
  ConnectButton,
  useActiveAccount,
  useActiveWallet,
  useWalletBalance,

  useSetActiveWallet,

  useConnectedWallets,


} from "thirdweb/react";

import {
  inAppWallet,
  createWallet,
} from "thirdweb/wallets";





import {
  getUserPhoneNumber,
  getUserEmail,
} from "thirdweb/wallets/in-app";


import { balanceOf, transfer } from "thirdweb/extensions/erc20";
import { add } from "thirdweb/extensions/farcaster/keyGateway";
 


import AppBarComponent from "@/components/Appbar/AppBar";
import { getDictionary } from "../../../dictionaries";

import { ClassNames } from "@emotion/react";


import useSound from 'use-sound';



import { useSearchParams } from 'next/navigation';


import { paymentUrl } from "../../../config/payment";

import { version } from "../../../config/version";



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

import { useAnimatedNumber } from "@/components/useAnimatedNumber";


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

  settlement: any;

  storecode: string;
  store: any;

  cancelTradeReason: string;

  paymentAmount: number;

  autoConfirmPayment: boolean;

  agentName: string;
  agentcode: string;

  userStats: any;

  paymentMethod: string;

  escrowWallet: {
    address: string;
    balance: number;
    transactionHash: string;
  };

  userType: string;

}


const wallets = [
  inAppWallet({
    auth: {
      options: ["email", "google"],
    },
  }),
];




export default function Index({ params }: any) {

  const searchParams = useSearchParams()!;
 
  //const wallet = searchParams.get('wallet');


  // limit, page number params

  //const limit = searchParams.get('limit') || 10;
  //const page = searchParams.get('page') || 1;



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



 
  const activeWallet = useActiveWallet();



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
    Buy: "",
    Sell: "",
    Amount: "",
    Price: "",
    Total: "",
    Orders: "",
    Trades: "",
    Search_my_trades: "",

    Anonymous: "",

    Seller: "",
    Buyer: "",
    Me: "",

    Buy_USDT: "",
    Rate: "",
    Payment: "",
    Bank_Transfer: "",

    I_agree_to_the_terms_of_trade: "",
    I_agree_to_cancel_the_trade: "",

    Opened_at: "",
    Cancelled_at: "",
    Completed_at: "",


    Opened: "",
    Completed: "",
    Cancelled: "",


    Waiting_for_seller_to_deposit: "",

    to_escrow: "",
    If_the_seller_does_not_deposit_the_USDT_to_escrow: "",
    this_trade_will_be_cancelled_in: "",

    Cancel_My_Trade: "",


    Order_accepted_successfully: "",
    Order_has_been_cancelled: "",
    My_Order: "",

    hours: "",
    minutes: "",
    seconds: "",

    hours_ago: "",
    minutes_ago: "",
    seconds_ago: "",

    Order_Opened: "",
    Trade_Started: "",
    Expires_in: "",

    Accepting_Order: "",

    Escrow: "",

    Chat_with_Seller: "",
    Chat_with_Buyer: "",

    Table_View: "",

    TID: "",

    Status: "",

    Sell_USDT: "",

    Buy_Order_Opened: "",
  
    Insufficient_balance: "",


    Request_Payment: "",

    Payment_has_been_confirmed: "",

    Confirm_Payment: "",

    Escrow_Completed: "",

    Buy_Order_Accept: "",

    Payment_Amount: "",

    Buy_Amount: "",

    Deposit_Name: "",

    My_Balance: "",

    Make_Escrow_Wallet: "",
    Escrow_Wallet_Address_has_been_created: "",
    Failed_to_create_Escrow_Wallet_Address: "",

    Newest_order_has_been_arrived: "",
    Payment_request_has_been_sent: "",
    Escrow_balance_is_less_than_payment_amount: "",

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
    Buy,
    Sell,
    Amount,
    Price,
    Total,
    Orders,
    Trades,
    Search_my_trades,

    Anonymous,

    Seller,
    Buyer,
    Me,

    Buy_USDT,
    Rate,
    Payment,
    Bank_Transfer,
    I_agree_to_the_terms_of_trade,
    I_agree_to_cancel_the_trade,

    Opened_at,
    Cancelled_at,
    Completed_at,

    Opened,
    Completed,
    Cancelled,

    Waiting_for_seller_to_deposit,

    to_escrow,

    If_the_seller_does_not_deposit_the_USDT_to_escrow,
    this_trade_will_be_cancelled_in,

    Cancel_My_Trade,

    Order_accepted_successfully,
    Order_has_been_cancelled,
    My_Order,

    hours,
    minutes,
    seconds,

    hours_ago,
    minutes_ago,
    seconds_ago,

    Order_Opened,
    Trade_Started,
    Expires_in,

    Accepting_Order,

    Escrow,

    Chat_with_Seller,
    Chat_with_Buyer,

    Table_View,

    TID,

    Status,

    Sell_USDT,

    Buy_Order_Opened,

    Insufficient_balance,

    Request_Payment,

    Payment_has_been_confirmed,

    Confirm_Payment,

    Escrow_Completed,

    Buy_Order_Accept,

    Payment_Amount,

    Buy_Amount,

    Deposit_Name,

    My_Balance,

    Make_Escrow_Wallet,
    Escrow_Wallet_Address_has_been_created,
    Failed_to_create_Escrow_Wallet_Address,

    Newest_order_has_been_arrived,
    Payment_request_has_been_sent,
    Escrow_balance_is_less_than_payment_amount,

    Copied_Wallet_Address,

  } = data;




  const router = useRouter();



  /*
  const setActiveAccount = useSetActiveWallet();
 

  const connectWallets = useConnectedWallets();

  const smartConnectWallet = connectWallets?.[0];
  const inAppConnectWallet = connectWallets?.[1];
  */


  const activeAccount = useActiveAccount();

  const address = activeAccount?.address;



  const [phoneNumber, setPhoneNumber] = useState("");

  

  



  const [balance, setBalance] = useState(0);
  useEffect(() => {

    // get the balance
    const getBalance = async () => {

      ///console.log('getBalance address', address);

      
      const result = await balanceOf({
        contract,
        address: address || "",
      });

  
      if (chain === 'bsc') {
        setBalance( Number(result) / 10 ** 18 );
      } else {
        setBalance( Number(result) / 10 ** 6 );
      }


    };


    if (address) getBalance();

    const interval = setInterval(() => {
      if (address) getBalance();
    } , 5000);

    return () => clearInterval(interval);

  } , [address, contract]);











  const [escrowWalletAddress, setEscrowWalletAddress] = useState('');
  const [makeingEscrowWallet, setMakeingEscrowWallet] = useState(false);

  const makeEscrowWallet = async () => {
      
    if (!address) {
      toast.error('Please connect your wallet');
      return;
    }


    setMakeingEscrowWallet(true);

    fetch('/api/order/getEscrowWalletAddress', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        lang: params.lang,
        storecode: params.center,
        walletAddress: address,
        //isSmartAccount: activeWallet === inAppConnectWallet ? false : true,
        isSmartAccount: false,
      }),
    })
    .then(response => response.json())
    .then(data => {
        
        //console.log('getEscrowWalletAddress data.result', data.result);


        if (data.result) {
          setEscrowWalletAddress(data.result.escrowWalletAddress);
          toast.success(Escrow_Wallet_Address_has_been_created);
        } else {
          toast.error(Failed_to_create_Escrow_Wallet_Address);
        }
    })
    .finally(() => {
      setMakeingEscrowWallet(false);
    });

  }

  //console.log("escrowWalletAddress", escrowWalletAddress);








  

  // get User by wallet address
  const [isAdmin, setIsAdmin] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [loadingUser, setLoadingUser] = useState(true);





  useEffect(() => {

    if (address) {

      getUserEmail({ client }).then((email) => {
        console.log('email', email);

        if (email) {
          

          fetch('/api/user/setUserVerified', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            // storecode, walletAddress, nickname, mobile, email
            body: JSON.stringify({
              storecode: params.center,
              walletAddress: address,
              nickname: email,
              mobile: '+82',
              email: email,
            }),
          })
          .then(response => response.json())
          .then(data => {
              //console.log('data', data);



              fetch('/api/user/getUser', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  storecode: params.center,
                  walletAddress: address,
                }),
              })
              .then(response => response.json())
              .then(data => {
                  //console.log('data', data);
                  setUser(data.result);
              })

          });



        }

      });

  

      //const phoneNumber = await getUserPhoneNumber({ client });
      //setPhoneNumber(phoneNumber);


      getUserPhoneNumber({ client }).then((phoneNumber) => {
        setPhoneNumber(phoneNumber || "");
      });

    }

  } , [address]);



  
  useEffect(() => {

    if (!address) {

      setUser(null);
      return;
    }

    setLoadingUser(true);

    fetch('/api/user/getUser', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            storecode: params.center,
            walletAddress: address,
        }),
    })
    .then(response => response.json())
    .then(data => {
        
        /////console.log('data.result', data.result);


        setUser(data.result);

        setEscrowWalletAddress(data.result.escrowWalletAddress);

        setIsAdmin(data.result?.role === "admin");

    })
    .catch((error) => {
        console.error('Error:', JSON.stringify(error));
        setUser(null);
        setEscrowWalletAddress('');
        setIsAdmin(false);
    });

    setLoadingUser(false);


  } , [address, params.center]);

  


  const [isPlaying, setIsPlaying] = useState(false);
  //const [play, { stop }] = useSound(galaxySfx);
  const [play, { stop }] = useSound('/ding.mp3');

  function playSong() {
    setIsPlaying(true);
    play();
  }

  function stopSong() {
    setIsPlaying(false);
    stop();
  }







  const [isModalOpen, setModalOpen] = useState(false);

  const closeModal = () => setModalOpen(false);
  const openModal = () => setModalOpen(true);

  const [tradeDetailOpen, setTradeDetailOpen] = useState(false);
  const [tradeDetailLoading, setTradeDetailLoading] = useState(false);
  const [tradeDetailData, setTradeDetailData] = useState<any>(null);

  const closeTradeDetailModal = () => {
    setTradeDetailOpen(false);
    setTradeDetailData(null);
  };

  const openTradeDetailModal = async (tradeId: string) => {
    if (!tradeId) return;
    setTradeDetailOpen(true);
    setTradeDetailLoading(true);
    try {
      const res = await fetch('/api/order/getOneBuyOrderByTradeId', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tradeId }),
      });
      const data = await res.json();
      if (!res.ok || data?.error) {
        throw new Error(data?.error || '거래상세를 불러오지 못했습니다.');
      }
      setTradeDetailData(data?.result || null);
    } catch (error: any) {
      console.error(error);
      toast.error(error?.message || '거래상세 조회 실패');
    } finally {
      setTradeDetailLoading(false);
    }
  };

  

  const [searchStorecode, setSearchStorecode] = useState(params.center);



  const [searchOrderStatusCancelled, setSearchOrderStatusCancelled] = useState(
    searchParams?.get('searchOrderStatusCancelled') === 'true'
  );
  const [searchOrderStatusCompleted, setSearchOrderStatusCompleted] = useState(
    searchParams?.get('searchOrderStatusCompleted') === 'true'
  );


  const [searchMyOrders, setSearchMyOrders] = useState(false);




  const [limitValue, setLimitValue] = useState(20);
  useEffect(() => {
    const limit = Number(searchParams?.get('limit') || 20);
    setLimitValue(limit > 0 ? limit : 20);
  }, [searchParams]);



  const [pageValue, setPageValue] = useState(1);
  useEffect(() => {
    const page = Number(searchParams?.get('page') || 1);
    setPageValue(page > 0 ? page : 1);
  }, [searchParams]);



  const getKstDateString = (offsetDays = 0) => {
    const kst = new Date(Date.now() + 9 * 60 * 60 * 1000);
    kst.setUTCDate(kst.getUTCDate() + offsetDays);
    const y = kst.getUTCFullYear();
    const m = String(kst.getUTCMonth() + 1).padStart(2, '0');
    const d = String(kst.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };
  const formattedDate = getKstDateString();

  // search form date to date
  const [searchFromDate, setSearchFormDate] = useState(searchParams?.get('fromDate') || formattedDate);
  const [searchToDate, setSearchToDate] = useState(searchParams?.get('toDate') || formattedDate);

 



  const [searchBuyer, setSearchBuyer] = useState(searchParams?.get('searchBuyer') || "");

  const [searchDepositName, setSearchDepositName] = useState(searchParams?.get('searchDepositName') || "");


  // search store bank account number
  const [searchStoreBankAccountNumber, setSearchStoreBankAccountNumber] = useState(searchParams?.get('searchStoreBankAccountNumber') || "");

  useEffect(() => {
    setSearchBuyer(searchParams?.get('searchBuyer') || "");
    setSearchDepositName(searchParams?.get('searchDepositName') || "");
    setSearchStoreBankAccountNumber(searchParams?.get('searchStoreBankAccountNumber') || "");
    setSearchOrderStatusCancelled(searchParams?.get('searchOrderStatusCancelled') === 'true');
    setSearchOrderStatusCompleted(searchParams?.get('searchOrderStatusCompleted') === 'true');
    setSearchFormDate(searchParams?.get('fromDate') || formattedDate);
    setSearchToDate(searchParams?.get('toDate') || formattedDate);
  }, [searchParams, formattedDate]);




  const [totalCount, setTotalCount] = useState(0);
    
  const [buyOrders, setBuyOrders] = useState<BuyOrder[]>([]);
  const [showJackpot, setShowJackpot] = useState(false);
  const [jackpotMessage, setJackpotMessage] = useState<string>('결제가 완료되었습니다.');
  const [jackpotStoreName, setJackpotStoreName] = useState<string>('');
  const [jackpotStoreLogo, setJackpotStoreLogo] = useState<string>('/icon-store.png');
  const [jackpotDepositor, setJackpotDepositor] = useState<string>('');
  const [jackpotKrw, setJackpotKrw] = useState<number>(0);
  const [jackpotUsdt, setJackpotUsdt] = useState<number>(0);
  const prevBuyOrderIdsRef = useRef<Set<string>>(new Set());
  const prevStatusMapRef = useRef<Record<string, string>>({});
  const lastJackpotRef = useRef<{ id: string | null; time: number }>({ id: null, time: 0 });
  const jackpotDoneRef = useRef<Set<string>>(new Set());


  const [buyOrderStats, setBuyOrderStats] = useState<{
      totalCount: number;
      totalKrwAmount: number;
      totalUsdtAmount: number;
      totalSettlementCount: number;
      totalSettlementAmount: number;
      totalSettlementAmountKRW: number;
      totalFeeAmount: number;
      totalFeeAmountKRW: number;
      totalAgentFeeAmount: number;
      totalAgentFeeAmountKRW: number;
      totalByUserType: Array<{
        _id: string;
        totalCount: number;
        totalKrwAmount: number;
        totalUsdtAmount: number;
      }>;
      totalBySellerBankAccountNumber: Array<{
        _id: string;
        totalCount: number;
        totalKrwAmount: number;
        totalUsdtAmount: number;
        bankUserInfo: any;
      }>;
      totalBySellerAliesBankAccountNumber: Array<{
        _id: string;
        totalCount: number;
        totalKrwAmount: number;
        totalUsdtAmount: number;
        bankUserInfo: any;
      }>;
    }>({
      totalCount: 0,
      totalKrwAmount: 0,
      totalUsdtAmount: 0,
      totalSettlementCount: 0,
      totalSettlementAmount: 0,
      totalSettlementAmountKRW: 0,
      totalFeeAmount: 0,
      totalFeeAmountKRW: 0,
      totalAgentFeeAmount: 0,
      totalAgentFeeAmountKRW: 0,

      totalByUserType: [],
      totalBySellerBankAccountNumber: [],
      totalBySellerAliesBankAccountNumber: [],
    });

  const parsedLimitValue = Number(limitValue) > 0 ? Number(limitValue) : 20;
  const totalPages = Math.max(1, Math.ceil(Number(totalCount) / parsedLimitValue));
  const currentPage = Math.min(Math.max(Number(pageValue) || 1, 1), totalPages);
  const currentPageStart = Number(totalCount) === 0 ? 0 : (currentPage - 1) * parsedLimitValue + 1;
  const currentPageEnd = Math.min(currentPage * parsedLimitValue, Number(totalCount));

  const buildBuyorderQuery = ({
    limit,
    page,
    buyer,
    depositName,
    bankAccountNumber,
    fromDate,
    toDate,
    cancelled,
    completed,
  }: {
    limit?: number;
    page?: number;
    buyer?: string;
    depositName?: string;
    bankAccountNumber?: string;
    fromDate?: string;
    toDate?: string;
    cancelled?: boolean;
    completed?: boolean;
  }) => {
    const query = new URLSearchParams({
      limit: String(limit ?? parsedLimitValue),
      page: String(page ?? currentPage),
    });

    const buyerValue = (buyer ?? searchBuyer).trim();
    const depositNameValue = (depositName ?? searchDepositName).trim();
    const bankAccountNumberValue = (bankAccountNumber ?? searchStoreBankAccountNumber).trim();
    const fromDateValue = (fromDate ?? searchFromDate).trim();
    const toDateValue = (toDate ?? searchToDate).trim();

    if (buyerValue) {
      query.set('searchBuyer', buyerValue);
    }
    if (depositNameValue) {
      query.set('searchDepositName', depositNameValue);
    }
    if (bankAccountNumberValue) {
      query.set('searchStoreBankAccountNumber', bankAccountNumberValue);
    }
    if (fromDateValue) {
      query.set('fromDate', fromDateValue);
    }
    if (toDateValue) {
      query.set('toDate', toDateValue);
    }

    if (cancelled ?? searchOrderStatusCancelled) {
      query.set('searchOrderStatusCancelled', 'true');
    }
    if (completed ?? searchOrderStatusCompleted) {
      query.set('searchOrderStatusCompleted', 'true');
    }

    return `/${params.lang}/${params.center}/buyorder?${query.toString()}`;
  };




  const animatedTotalCount = useAnimatedNumber(buyOrderStats.totalCount);
  const animatedTotalUsdtAmount = useAnimatedNumber(buyOrderStats.totalUsdtAmount, { decimalPlaces: 3 });
  const animatedTotalKrwAmount = useAnimatedNumber(buyOrderStats.totalKrwAmount);

  const animatedTotalSettlementCount = useAnimatedNumber(buyOrderStats.totalSettlementCount);
  const animatedTotalSettlementAmount = useAnimatedNumber(buyOrderStats.totalSettlementAmount, { decimalPlaces: 3 });
  const animatedTotalSettlementAmountKRW = useAnimatedNumber(buyOrderStats.totalSettlementAmountKRW);


  const triggerJackpot = (order?: BuyOrder) => {
    if (!order) return;
    if (order._id && jackpotDoneRef.current.has(order._id)) return;
    const now = Date.now();
    if (lastJackpotRef.current.id === order._id && now - lastJackpotRef.current.time < 1500) {
      return; // prevent double flashing for the same order
    }
    if (order._id) {
      jackpotDoneRef.current.add(order._id);
    }
    const amount = order.krwAmount ?? 0;
    const usdt = order.usdtAmount ?? 0;
    const depositor = order.buyer?.depositName || order.buyer?.name || '';
    setJackpotDepositor(depositor || '');
    setJackpotKrw(amount);
    setJackpotUsdt(usdt);
    setJackpotMessage('결제가 완료되었습니다.');
    setJackpotStoreName(order.store?.storeName || store?.storeName || '');
    setJackpotStoreLogo(order.store?.storeLogo || store?.storeLogo || '/icon-store.png');
    setShowJackpot(true);
    setTimeout(() => setShowJackpot(false), 3200);
    lastJackpotRef.current = { id: order._id, time: now };
  };

  useEffect(() => {
    if (!buyOrders || buyOrders.length === 0) {
      prevBuyOrderIdsRef.current = new Set();
      prevStatusMapRef.current = {};
      return;
    }

    const jackpotStates = ['paymentCompleted', 'paymentConfirmed', 'paymentSettled'];
    const currentStatusMap: Record<string, string> = {};
    buyOrders.forEach((o) => {
      currentStatusMap[o._id] = o.status;
    });

    const newlyFinished = buyOrders.find((o) => {
      const prev = prevStatusMapRef.current[o._id];
      return prev && prev !== o.status && jackpotStates.includes(o.status);
    });

    const addedFinished = buyOrders.find(
      (o) => !prevBuyOrderIdsRef.current.has(o._id) && jackpotStates.includes(o.status)
    );

    if (newlyFinished) {
      triggerJackpot(newlyFinished);
    } else if (addedFinished) {
      triggerJackpot(addedFinished);
    }

    prevBuyOrderIdsRef.current = new Set(buyOrders.map((o) => o._id));
    prevStatusMapRef.current = currentStatusMap;
  }, [buyOrders, user]);



  const [sellerBankAccountDisplayValueArray, setSellerBankAccountDisplayValueArray] = useState<number[]>([]);


  function updateSellerBankAccountDisplayValue(index: number, value: number) {
    setSellerBankAccountDisplayValueArray((prevValues) => {
      const newValues = [...prevValues];
      newValues[index] = value;
      return newValues;
    });
  }


  useEffect(() => {
    buyOrderStats.totalBySellerBankAccountNumber.forEach((item, index) => {
      const targetValue = item.totalKrwAmount;
      const duration = 1000; // animation duration in ms
      const startValue = sellerBankAccountDisplayValueArray[index] || 0;
      const startTime = performance.now();
      function animate(currentTime: number) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const currentValue = startValue + (targetValue - startValue) * progress;
        updateSellerBankAccountDisplayValue(index, Math.round(currentValue));
        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      }
      requestAnimationFrame(animate);
    });
  //}, [buyOrderStats.totalBySellerBankAccountNumber, sellerBankAccountDisplayValueArray]);
  }, [buyOrderStats.totalBySellerBankAccountNumber]);


  // lastestBalance array for animated number
  const [lastestBalanceArray, setLastestBalanceArray] = useState<number[]>([]);
  const [balanceFlashSet, setBalanceFlashSet] = useState<Set<number>>(new Set());
  const prevBalanceRef = useRef<number[]>([]);
  function updateLastestBalanceArray(index: number, value: number) {
    setLastestBalanceArray((prevValues) => {
      const newValues = [...prevValues];
      newValues[index] = value;
      return newValues;
    });
  }
  useEffect(() => {
    const flashes: number[] = [];
    buyOrderStats.totalBySellerBankAccountNumber.forEach((item, index) => {
      const targetValue = item.bankUserInfo && item.bankUserInfo.length > 0 && item.bankUserInfo[0].balance ? item.bankUserInfo[0].balance : 0;
      const duration = 1000; // animation duration in ms
      const startValue = lastestBalanceArray[index] || 0;
       const prevValue = prevBalanceRef.current[index] ?? startValue;
       if (prevValue !== targetValue) {
         flashes.push(index);
       }
       prevBalanceRef.current[index] = targetValue;
      const startTime = performance.now();
      function animate(currentTime: number) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const currentValue = startValue + (targetValue - startValue) * progress;
        updateLastestBalanceArray(index, Math.round(currentValue));
        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      }
      requestAnimationFrame(animate);
    });
    if (flashes.length) {
      setBalanceFlashSet(new Set(flashes));
      setTimeout(() => setBalanceFlashSet(new Set()), 1000);
    }
  }, [buyOrderStats.totalBySellerBankAccountNumber]);



  // 별칭 계좌별 이력 패널 상태
  const [aliasPanelOpen, setAliasPanelOpen] = useState(false);
  const [aliasPanelLoading, setAliasPanelLoading] = useState(false);
  const [aliasPanelError, setAliasPanelError] = useState('');
  const [aliasPanelTransfers, setAliasPanelTransfers] = useState<any[]>([]);
  const [aliasPanelAccountNumber, setAliasPanelAccountNumber] = useState('');
  const [aliasPanelAliasNumber, setAliasPanelAliasNumber] = useState('');
  const [aliasPanelBankName, setAliasPanelBankName] = useState('');
  const [aliasPanelAccountHolder, setAliasPanelAccountHolder] = useState('');
  const [aliasPanelTotalCount, setAliasPanelTotalCount] = useState(0);
  const [aliasPanelTotalAmount, setAliasPanelTotalAmount] = useState(0);
  const [aliasPanelMatchFilter, setAliasPanelMatchFilter] = useState<'all' | 'matched' | 'unmatched'>('all');
  const [aliasPanelPage, setAliasPanelPage] = useState(1);
  const [aliasPanelHasMore, setAliasPanelHasMore] = useState(true);
  const aliasPanelLoadMoreRef = useRef<HTMLDivElement | null>(null);

  // 미신청 입금내역
  const [unmatchedTransfers, setUnmatchedTransfers] = useState<any[]>([]);
  const [unmatchedTotalAmount, setUnmatchedTotalAmount] = useState(0);
  const [unmatchedLoading, setUnmatchedLoading] = useState(false);
  const [showUnmatched, setShowUnmatched] = useState(true);
  const unmatchedScrollRef = useRef<HTMLDivElement | null>(null);
  const [showSellerBankStats, setShowSellerBankStats] = useState(true);
  const [showSellerAliasStats, setShowSellerAliasStats] = useState(true);

  const formatKstDateTime = (value?: string | Date) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toLocaleString('ko-KR', {
      timeZone: 'Asia/Seoul',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatTimeAgo = (value?: string | Date) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    if (diffMs < 0) return '방금 전';
    const sec = Math.floor(diffMs / 1000);
    if (sec < 60) return '방금 전';
    const min = Math.floor(sec / 60);
    if (min < 60) return `${min}분 전`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr}시간 전`;
    const day = Math.floor(hr / 24);
    if (day < 7) return `${day}일 전`;
    const week = Math.floor(day / 7);
    if (week < 5) return `${week}주 전`;
    const month = Math.floor(day / 30);
    if (month < 12) return `${month}개월 전`;
    const year = Math.floor(day / 365);
    return `${year}년 전`;
  };

  const getTxnTypeInfo = (typeValue: any) => {
    const raw = String(typeValue || '').toLowerCase();
    if (raw === 'deposited' || raw === 'deposit' || raw === '입금') {
      return { label: '입금', className: 'bg-emerald-100 text-emerald-700 border border-emerald-200' };
    }
    if (raw === 'withdrawn' || raw === 'withdrawal' || raw === '출금') {
      return { label: '출금', className: 'bg-rose-100 text-rose-700 border border-rose-200' };
    }
    return { label: '기타', className: 'bg-zinc-100 text-zinc-600 border border-zinc-200' };
  };

  const getMatchStatusInfo = (matchValue: any) => {
    const normalized = matchValue === undefined || matchValue === null
      ? ''
      : typeof matchValue === 'string'
        ? matchValue.toLowerCase()
        : 'object';
    const isSuccess = normalized === 'success' || normalized === 'object';
    return isSuccess
      ? { label: '정상입금', className: 'bg-blue-100 text-blue-700 border border-blue-200' }
      : { label: '미신청입금', className: 'bg-amber-100 text-amber-700 border border-amber-200' };
  };

  const fetchDepositsByAccount = async (
    accountNumber: string | number,
    meta?: {
      bankName?: string;
      accountHolder?: string;
      aliasAccountNumber?: string;
      defaultAccountNumber?: string;
      realAccountNumber?: string;
    },
    matchFilter?: 'all' | 'matched' | 'unmatched',
    page: number = 1,
    append: boolean = false,
  ) => {
    const targetReal = String(meta?.realAccountNumber || accountNumber || '').trim();
    const targetAlias = String(
      meta?.defaultAccountNumber ||
      meta?.aliasAccountNumber ||
      meta?.realAccountNumber ||
      accountNumber ||
      ''
    ).trim();

    if (!targetReal) {
      toast.error('실계좌번호가 없습니다.');
      return;
    }

    const activeMatchFilter = matchFilter ?? aliasPanelMatchFilter;

    if (!append) {
      setAliasPanelTransfers([]);
      setAliasPanelTotalCount(0);
      setAliasPanelTotalAmount(0);
      setAliasPanelPage(1);
      setAliasPanelHasMore(true);
    }

    setAliasPanelAccountNumber(targetReal);
    setAliasPanelAliasNumber(targetAlias || targetReal);
    setAliasPanelBankName(meta?.bankName || '');
    setAliasPanelAccountHolder(meta?.accountHolder || '');
    setAliasPanelMatchFilter(activeMatchFilter);
    setAliasPanelOpen(true);
    setAliasPanelLoading(true);
    setAliasPanelError('');
    try {
      const response = await fetch('/api/bankTransfer/getAll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          limit: 50,
          page: page,
          accountNumber: '',
          originalAccountNumber: targetReal,
          fromDate: searchFromDate,
          toDate: searchToDate,
          transactionType: 'deposited',
          matchStatus:
            activeMatchFilter === 'matched'
              ? 'matched'
              : activeMatchFilter === 'unmatched'
                ? 'unmatched'
                : '',
        }),
      });

      if (!response.ok) {
        throw new Error('데이터를 불러오지 못했습니다.');
      }

      const data = await response.json();
      const rawTransfers: any[] = data?.result?.transfers || [];

      const filteredTransfers =
        activeMatchFilter === 'matched'
          ? rawTransfers.filter((t) => {
              const m = t?.match;
              if (!m) return false;
              if (typeof m === 'string') return m.toLowerCase() === 'success';
              if (typeof m === 'object') return true; // 객체 match는 성공으로 간주
              return false;
            })
          : activeMatchFilter === 'unmatched'
            ? rawTransfers.filter((t) => {
                const m = t?.match;
                if (!m) return true;
                if (typeof m === 'string') return m.toLowerCase() !== 'success';
                if (typeof m === 'object') return false; // 객체 match는 성공 처리 -> 제외
                return true;
              })
            : rawTransfers;

      setAliasPanelTransfers((prev) =>
        append ? [...prev, ...filteredTransfers] : filteredTransfers
      );

      // 총 건수/합계는 서버에서 계산된 전체값(페이징 무관) 사용
      const apiTotalCount = data?.result?.totalCount ?? filteredTransfers.length;
      const apiTotalAmount = data?.result?.totalAmount ?? filteredTransfers.reduce((acc, cur) => acc + (Number(cur.amount) || 0), 0);
      setAliasPanelTotalCount(apiTotalCount);
      setAliasPanelTotalAmount(apiTotalAmount);
      setAliasPanelPage(page);
      setAliasPanelHasMore(rawTransfers.length >= 50);
    } catch (error: any) {
      console.error('별칭 계좌 이력 조회 실패', error);
      setAliasPanelError(error?.message || '불러오기 실패');
      toast.error(error?.message || '데이터를 불러오지 못했습니다.');
    } finally {
      setAliasPanelLoading(false);
    }
  };

  // 미신청 입금내역 불러오기
  const fetchUnmatchedTransfers = async () => {
    if (unmatchedLoading) return;
    setUnmatchedLoading(true);
    try {
      const res = await fetch('/api/bankTransfer/getAll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          limit: 200,
          page: 1,
          transactionType: 'deposited',
          matchStatus: 'notSuccess',
          fromDate: searchFromDate || '',
          toDate: searchToDate || '',
          storecode: searchStorecode || '',
        }),
      });
      if (!res.ok) {
        throw new Error('미신청 입금내역을 불러오지 못했습니다.');
      }
      const data = await res.json();
      const rawList: any[] = data?.result?.transfers || [];

      // match !== 'success' 만 남기고 최근순 정렬
      const filtered = rawList.filter((t) => {
        const m = t?.match;
        if (!m) return true;
        if (typeof m === 'string') return m.toLowerCase() !== 'success';
        if (typeof m === 'object') return false;
        return true;
      }).sort((a, b) =>
        new Date(b.transactionDateUtc || b.regDate || 0).getTime() -
        new Date(a.transactionDateUtc || a.regDate || 0).getTime()
      );

      setUnmatchedTransfers(filtered);
      setUnmatchedTotalAmount(
        filtered.reduce((sum, cur) => sum + (Number(cur.amount) || 0), 0)
      );
    } catch (error: any) {
      toast.error(error?.message || '미신청 입금내역 조회 실패');
    } finally {
      setUnmatchedLoading(false);
    }
  };

  const closeAliasPanel = () => {
    setAliasPanelOpen(false);
  };

  // 무한 스크롤로 추가 로드
  useEffect(() => {
    const sentinel = aliasPanelLoadMoreRef.current;
    if (!aliasPanelOpen || !sentinel) return;

    const observer = new IntersectionObserver((entries) => {
      const first = entries[0];
      if (!first.isIntersecting) return;
      if (aliasPanelLoading || !aliasPanelHasMore) return;
      if (!aliasPanelAccountNumber) return;

      fetchDepositsByAccount(
        aliasPanelAccountNumber,
        {
          bankName: aliasPanelBankName,
          accountHolder: aliasPanelAccountHolder,
          aliasAccountNumber: aliasPanelAliasNumber || aliasPanelAccountNumber,
          defaultAccountNumber: aliasPanelAliasNumber || aliasPanelAccountNumber,
          realAccountNumber: aliasPanelAccountNumber,
        },
        aliasPanelMatchFilter,
        aliasPanelPage + 1,
        true
      );
    }, {
      root: null,
      rootMargin: '200px',
      threshold: 0,
    });

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [
    aliasPanelOpen,
    aliasPanelLoading,
    aliasPanelHasMore,
    aliasPanelAccountNumber,
    aliasPanelMatchFilter,
    aliasPanelPage,
    aliasPanelBankName,
    aliasPanelAccountHolder,
    aliasPanelAliasNumber,
  ]);

  // 미신청 내역 자동 갱신
  useEffect(() => {
    fetchUnmatchedTransfers();
    const timer = setInterval(fetchUnmatchedTransfers, 10000);
    return () => clearInterval(timer);
  }, [searchFromDate, searchToDate, searchStorecode]);





  /* agreement for trade */
  const [agreementForTrade, setAgreementForTrade] = useState([] as boolean[]);
  for (let i = 0; i < 100; i++) {
      agreementForTrade.push(false);
  }
  /*
  useEffect(() => {
      setAgreementForTrade (
          buyOrders.map((item, idx) => {
              return false;
          })
      );
  } , [buyOrders]);
    */
    
    
  // initialize false array of 100
  const [acceptingBuyOrder, setAcceptingBuyOrder] = useState([] as boolean[]);
  for (let i = 0; i < 100; i++) {
      acceptingBuyOrder.push(false);
  }

   



   
    /*
    useEffect(() => {
        setAcceptingBuyOrder (
            buyOrders.map((item, idx) => {
                return false;
            })
        );
    } , [buyOrders]);
     */


    /*
    // sms receiver mobile number array
    const [smsReceiverMobileNumbers, setSmsReceiverMobileNumbers] = useState([] as string[]);
    useEffect(() => {
        setSmsReceiverMobileNumbers(
            buyOrders.map((item, idx) => {
                return user?.mobile || '';
            })
        );
    } , [buyOrders, user]);
    */

    const [smsReceiverMobileNumber, setSmsReceiverMobileNumber] = useState('');
    useEffect(() => {
        setSmsReceiverMobileNumber(phoneNumber);
    } , [phoneNumber]);



    const acceptBuyOrder = (
      index: number,
      orderId: string,
      smsNumber: string,
    ) => {

        if (!address) {
            toast.error('Please connect your wallet');
            return;
        }

        /*
        if (!escrowWalletAddress || escrowWalletAddress === '') {
          toast.error('에스크로 지갑이 없습니다.');
          return;
        }
        */

        setAcceptingBuyOrder (
          acceptingBuyOrder.map((item, idx) => idx === index ? true : item)
        );


        fetch('/api/order/acceptBuyOrder', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                lang: params.lang,
                storecode: params.center,
                orderId: orderId,
                sellerWalletAddress: address,
                sellerstorecode: params.center,

                /*
                sellerNickname: user ? user.nickname : '',
                sellerAvatar: user ? user.avatar : '',

                //buyerMobile: user.mobile,

                sellerMobile: smsNumber,
                */



                seller: user?.seller,

            }),
        })
        .then(response => response.json())
        .then(data => {

            console.log('data', data);

            //setBuyOrders(data.result.orders);
            //openModal();

            toast.success(Order_accepted_successfully);

            //playSong();



            fetch('/api/order/getAllBuyOrders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(
                  {
                    storecode: params.center,
                    limit: Number(limitValue),
                    page: Number(pageValue),
                    walletAddress: address,
                    searchMyOrders: searchMyOrders,

                    searchOrderStatusCancelled: searchOrderStatusCancelled,
                    searchOrderStatusCompleted: searchOrderStatusCompleted,

                    searchBuyer: searchBuyer,
                    searchDepositName: searchDepositName,

                    searchStoreBankAccountNumber: searchStoreBankAccountNumber,


                    fromDate: searchFromDate,
                    toDate: searchToDate,

                  }
                ),
            })
            .then(response => response.json())
            .then(data => {
                ///console.log('data', data);
                setBuyOrders(data.result.orders);

                setTotalCount(data.result.totalCount);


                setBuyOrderStats({
                  totalCount: data.result.totalCount,
                  totalKrwAmount: data.result.totalKrwAmount,
                  totalUsdtAmount: data.result.totalUsdtAmount,
                  totalSettlementCount: data.result.totalSettlementCount,
                  totalSettlementAmount: data.result.totalSettlementAmount,
                  totalSettlementAmountKRW: data.result.totalSettlementAmountKRW,
                  totalFeeAmount: data.result.totalFeeAmount,
                  totalFeeAmountKRW: data.result.totalFeeAmountKRW,
                  totalAgentFeeAmount: data.result.totalAgentFeeAmount,
                  totalAgentFeeAmountKRW: data.result.totalAgentFeeAmountKRW,

                  totalByUserType: data.result.totalByUserType,
                  totalBySellerBankAccountNumber: data.result.totalBySellerBankAccountNumber,
                  totalBySellerAliesBankAccountNumber: data.result.totalBySellerAliesBankAccountNumber,
                });


            })



        })
        .catch((error) => {
            console.error('Error:', JSON.stringify(error));
        })
        .finally(() => {


            setAgreementForTrade (
              agreementForTrade.map((item, idx) => idx === index ? false : item)
            );


            setAcceptingBuyOrder (
                acceptingBuyOrder.map((item, idx) => idx === index ? false : item)
            );

        } );


    }










  // agreement for cancel trade
  const [agreementForCancelTrade, setAgreementForCancelTrade] = useState([] as boolean[]);
  for (let i = 0; i < 100; i++) {
    agreementForCancelTrade.push(false);
  }
  /*
  useEffect(() => {
    setAgreementForCancelTrade(
      buyOrders.map(() => false)
    );
  } , [buyOrders]);
   */


  // cancelReason
  const [cancelTradeReason, setCancelTradeReason] = useState([] as string[]);
  for (let i = 0; i < 100; i++) {
    cancelTradeReason.push('');
  }




    // cancel sell order state
    const [cancellings, setCancellings] = useState([] as boolean[]);
    for (let i = 0; i < 100; i++) {
      cancellings.push(false);
    }
    /*
    useEffect(() => {
      setCancellings(buyOrders.map(() => false));
    }, [buyOrders]);
    */



    const cancelTrade = async (orderId: string, index: number) => {



      if (cancellings[index]) {
        return;
      }



      setCancellings(
        cancellings.map((item, i) => i === index ? true : item)
      );


      const response = await fetch('/api/order/cancelTradeBySeller', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          orderId: orderId,
          storecode: params.center,
          walletAddress: address,
          cancelTradeReason: cancelTradeReason[index],
        })
      });

      const data = await response.json();

      ///console.log('data', data);

      if (data.result) {

        toast.success(Order_has_been_cancelled);

        //playSong();


        await fetch('/api/order/getAllBuyOrders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(
            {
              storecode: params.center,
              limit: Number(limitValue),
              page: Number(pageValue),
              walletAddress: address,
              searchMyOrders: searchMyOrders,

              searchOrderStatusCancelled: searchOrderStatusCancelled,
              searchOrderStatusCompleted: searchOrderStatusCompleted,

              searchBuyer: searchBuyer,
              searchDepositName: searchDepositName,

              searchStoreBankAccountNumber: searchStoreBankAccountNumber,


              fromDate: searchFromDate,
              toDate: searchToDate,
            }
          )
        }).then(async (response) => {
          const data = await response.json();
          //console.log('data', data);
          if (data.result) {
            setBuyOrders(data.result.orders);

            setTotalCount(data.result.totalCount);

            setBuyOrderStats({
              totalCount: data.result.totalCount,
              totalKrwAmount: data.result.totalKrwAmount,
              totalUsdtAmount: data.result.totalUsdtAmount,
              totalSettlementCount: data.result.totalSettlementCount,
              totalSettlementAmount: data.result.totalSettlementAmount,
              totalSettlementAmountKRW: data.result.totalSettlementAmountKRW,
              totalFeeAmount: data.result.totalFeeAmount,
              totalFeeAmountKRW: data.result.totalFeeAmountKRW,
              totalAgentFeeAmount: data.result.totalAgentFeeAmount,
              totalAgentFeeAmountKRW: data.result.totalAgentFeeAmountKRW,

              totalByUserType: data.result.totalByUserType,
              totalBySellerBankAccountNumber: data.result.totalBySellerBankAccountNumber,
              totalBySellerAliesBankAccountNumber: data.result.totalBySellerAliesBankAccountNumber,
            });


          }
        });

      } else {
        toast.error('거래취소에 실패했습니다.');
      }


      setAgreementForCancelTrade(
        agreementForCancelTrade.map((item, i) => i === index ? false : item)
      );

      setCancellings(
        cancellings.map((item, i) => i === index ? false : item)
      );

    }








    // request payment check box
    const [requestPaymentCheck, setRequestPaymentCheck] = useState([] as boolean[]);
    for (let i = 0; i < 100; i++) {
      requestPaymentCheck.push(false);
    }

    /*
    useEffect(() => {
        
        setRequestPaymentCheck(
          new Array(buyOrders.length).fill(false)
        );
  
    } , [buyOrders]);
     */
    




    // array of escrowing
    const [escrowing, setEscrowing] = useState([] as boolean[]);
    for (let i = 0; i < 100; i++) {
      escrowing.push(false);
    }

    /*
    useEffect(() => {
        
        setEscrowing(
          new Array(buyOrders.length).fill(false)
        );
  
    } , [buyOrders]);
     */

    // array of requestingPayment
    const [requestingPayment, setRequestingPayment] = useState([] as boolean[]);
    for (let i = 0; i < 100; i++) {
      requestingPayment.push(false);
    }


    /*
    useEffect(() => {

      setRequestingPayment(

        new Array(buyOrders.length).fill(false)

      );

    } , [buyOrders]);
      */




  // without escrow
  const [isWithoutEscrow, setIsWithoutEscrow] = useState(true);


  const requestPayment = async (
    index: number,
    orderId: string,
    tradeId: string,
    amount: number,
    storecode: string,


    bankInfo: any,
  ) => {


    // check escrowWalletAddress

    if (!isWithoutEscrow && escrowWalletAddress === '') {
      toast.error('Recipient wallet address is empty');
      return;
    }

    // check balance
    // send payment request

    if (balance < amount) {
      toast.error(Insufficient_balance);
      return;
    }


    // check all escrowing is false
    if (!isWithoutEscrow && escrowing.some((item) => item === true)) {
      toast.error('Escrowing');
      return;
    }




    // check all requestingPayment is false
    if (requestingPayment.some((item) => item === true)) {
      toast.error('Requesting Payment');
      return;
    }


    if (!isWithoutEscrow) {


      setEscrowing(
        escrowing.map((item, idx) =>  idx === index ? true : item) 
      );
  

  


      // send USDT
      // Call the extension function to prepare the transaction
      const transaction = transfer({
        contract,
        to: escrowWalletAddress,
        amount: amount,
      });
      


      try {


        /*
        const transactionResult = await sendAndConfirmTransaction({
            account: smartAccount as any,
            transaction: transaction,
        });

        //console.log("transactionResult===", transactionResult);
        */

        const { transactionHash } = await sendTransaction({
          
          account: activeAccount as any,

          transaction,
        });

        ///console.log("transactionHash===", transactionHash);


        /*
        const transactionResult = await waitForReceipt({
          client,
          chain: arbitrum ,
          maxBlocksWaitTime: 1,
          transactionHash: transactionHash,
        });


        console.log("transactionResult===", transactionResult);
        */
  

        // send payment request

        //if (transactionResult) {
        if (transactionHash) {

          
          setRequestingPayment(
            requestingPayment.map((item, idx) => idx === index ? true : item)
          );
          
          
          


        
          const response = await fetch('/api/order/buyOrderRequestPayment', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              //lang: params.lang,
              //storecode: storecode,
              orderId: orderId,
              //transactionHash: transactionResult.transactionHash,
              transactionHash: transactionHash,
            })
          });

          const data = await response.json();

          //console.log('/api/order/buyOrderRequestPayment data====', data);


          /*
          setRequestingPayment(
            requestingPayment.map((item, idx) => {
              if (idx === index) {
                return false;
              }
              return item;
            })
          );
          */
          


          if (data.result) {

            toast.success(Payment_request_has_been_sent);

            //toast.success('Payment request has been sent');

            //playSong();
            

            
            await fetch('/api/order/getAllBuyOrders', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(
                {
                  storecode: searchStorecode,
                  limit: Number(limitValue),
                  page: Number(pageValue),
                  walletAddress: address,
                  searchMyOrders: searchMyOrders,

                  searchOrderStatusCancelled: searchOrderStatusCancelled,
                  searchOrderStatusCompleted: searchOrderStatusCompleted,

                  searchBuyer: searchBuyer,
                  searchDepositName: searchDepositName,

                  searchStoreBankAccountNumber: searchStoreBankAccountNumber,


                  fromDate: searchFromDate,
                  toDate: searchToDate,
                }
              )
            }).then(async (response) => {
              const data = await response.json();
              //console.log('data', data);
              if (data.result) {
                setBuyOrders(data.result.orders);
    
                setTotalCount(data.result.totalCount);

                setBuyOrderStats({
                  totalCount: data.result.totalCount,
                  totalKrwAmount: data.result.totalKrwAmount,
                  totalUsdtAmount: data.result.totalUsdtAmount,
                  totalSettlementCount: data.result.totalSettlementCount,
                  totalSettlementAmount: data.result.totalSettlementAmount,
                  totalSettlementAmountKRW: data.result.totalSettlementAmountKRW,
                  totalFeeAmount: data.result.totalFeeAmount,
                  totalFeeAmountKRW: data.result.totalFeeAmountKRW,
                  totalAgentFeeAmount: data.result.totalAgentFeeAmount,
                  totalAgentFeeAmountKRW: data.result.totalAgentFeeAmountKRW,

                  totalByUserType: data.result.totalByUserType,
                  totalBySellerBankAccountNumber: data.result.totalBySellerBankAccountNumber,
                  totalBySellerAliesBankAccountNumber: data.result.totalBySellerAliesBankAccountNumber,
                });

              }
            });


            // refresh balance

            const result = await balanceOf({
              contract,
              address: address || "",
            });

            //console.log(result);

            setBalance( Number(result) / 10 ** 6 );


          

          } else {
            toast.error('Payment request has been failed');
          }

        }


      } catch (error) {
        console.error('Error:', JSON.stringify(error));

        toast.error('Payment request has been failed');
      }

      setEscrowing(
        escrowing.map((item, idx) =>  idx === index ? false : item)
      );



    } else {
      // without escrow


      try {

        const transactionHash = '0x';


        setRequestingPayment(
          requestingPayment.map((item, idx) => idx === index ? true : item)
        );
        
        
        




      
        const response = await fetch('/api/order/buyOrderRequestPayment', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            //lang: params.lang,
            //storecode: storecode,
            orderId: orderId,
            //transactionHash: transactionResult.transactionHash,
            transactionHash: transactionHash,

            // payment bank information


            paymentBankInfo: bankInfo,




          })
        });

        const data = await response.json();


        if (data.result) {

          toast.success(Payment_request_has_been_sent);

          //toast.success('Payment request has been sent');

          //playSong();
          
          await fetch('/api/order/getAllBuyOrders', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(
              {
                storecode: searchStorecode,
                limit: Number(limitValue),
                page: Number(pageValue),
                walletAddress: address,
                searchMyOrders: searchMyOrders,

                searchOrderStatusCancelled: searchOrderStatusCancelled,
                searchOrderStatusCompleted: searchOrderStatusCompleted,

                searchBuyer: searchBuyer,
                searchDepositName: searchDepositName,

                searchStoreBankAccountNumber: searchStoreBankAccountNumber,


                fromDate: searchFromDate,
                toDate: searchToDate,
              }
            )
          }).then(async (response) => {
            const data = await response.json();
            //console.log('data', data);
            if (data.result) {
              setBuyOrders(data.result.orders);
  
              setTotalCount(data.result.totalCount);

              setBuyOrderStats({
                totalCount: data.result.totalCount,
                totalKrwAmount: data.result.totalKrwAmount,
                totalUsdtAmount: data.result.totalUsdtAmount,
                totalSettlementCount: data.result.totalSettlementCount,
                totalSettlementAmount: data.result.totalSettlementAmount,
                totalSettlementAmountKRW: data.result.totalSettlementAmountKRW,
                totalFeeAmount: data.result.totalFeeAmount,
                totalFeeAmountKRW: data.result.totalFeeAmountKRW,
                totalAgentFeeAmount: data.result.totalAgentFeeAmount,
                totalAgentFeeAmountKRW: data.result.totalAgentFeeAmountKRW,

                totalByUserType: data.result.totalByUserType,
                totalBySellerBankAccountNumber: data.result.totalBySellerBankAccountNumber,
                totalBySellerAliesBankAccountNumber: data.result.totalBySellerAliesBankAccountNumber,
              });

            }
          });


          // refresh balance

          const result = await balanceOf({
            contract,
            address: address || "",
          });

          //console.log(result);

          setBalance( Number(result) / 10 ** 6 );


        } else {
          toast.error('결제요청이 실패했습니다.');
        }

      } catch (error) {
        console.error('Error:', JSON.stringify(error));

        toast.error('결제요청이 실패했습니다.');
      }

      
    } // end of without escrow


    setRequestingPayment(
      requestingPayment.map((item, idx) => idx === index ? false : item)
    );


  }









  // array of confirmingPayment

  const [confirmingPayment, setConfirmingPayment] = useState([] as boolean[]);
  for (let i = 0; i < 100; i++) {
    confirmingPayment.push(false);
  }

  /*
  useEffect(() => {
      
      setConfirmingPayment(
        new Array(buyOrders.length).fill(false)
      );

  } , [buyOrders]);
   */


  // confirm payment check box
  const [confirmPaymentCheck, setConfirmPaymentCheck] = useState([] as boolean[]);
  for (let i = 0; i < 100; i++) {
    confirmPaymentCheck.push(false);
  }

  /*
  useEffect(() => {
      
      setConfirmPaymentCheck(
        new Array(buyOrders.length).fill(false)
      );

  } , [buyOrders]);
    */




  // payment amoount array
  const [paymentAmounts, setPaymentAmounts] = useState([] as number[]);
  useEffect(() => {

    // default payment amount is from sellOrders krwAmount
      
    setPaymentAmounts(
      buyOrders.map((item) => item.krwAmount)
      );

  } , [buyOrders]);

  const [paymentAmountsUsdt, setPaymentAmountsUsdt] = useState([] as number[]);
  useEffect(() => {

    // default payment amount is from sellOrders krwAmount
      
    setPaymentAmountsUsdt(
      buyOrders.map((item) => item.usdtAmount)
      );

  } , [buyOrders]);



  const confirmPayment = async (

    index: number,
    orderId: string,
    //paymentAmount: number,
    krwAmount: number,
    //paymentAmountUsdt: number,
    usdtAmount: number,

    buyerWalletAddress: string,

    paymentMethod: string, // 'bank' or 'mkrw' or 'usdt'

  ) => {
    // confirm payment
    // send usdt to buyer wallet address


    // if escrowWalletAddress balance is less than paymentAmount, then return

    //console.log('escrowBalance', escrowBalance);
    //console.log('paymentAmountUsdt', paymentAmountUsdt);
    
    /*
    if (escrowBalance < paymentAmountUsdt) {
      toast.error(Escrow_balance_is_less_than_payment_amount);
      return;
    }
    
    // if escrowNativeBalance is less than 0.1, then return
    if (escrowNativeBalance < 0.1) {
      toast.error('ETH balance is less than 0.1');
      return;
    }
      */



    if (confirmingPayment[index]) {
      return;
    }

    setConfirmingPayment(
      confirmingPayment.map((item, idx) =>  idx === index ? true : item)
    );


    try {

      



        // transfer my wallet to buyer wallet address

        const buyerWalletAddress = buyOrders[index].walletAddress;
        const usdtAmount = buyOrders[index].usdtAmount;

        const transaction = transfer({
          contract,
          to: buyerWalletAddress,
          amount: usdtAmount,
        });


        try {

          const { transactionHash } = await sendAndConfirmTransaction({
          
          //const { transactionHash } = await sendTransaction({
          
            account: activeAccount as any,
            transaction,
          });

          console.log("transactionHash===", transactionHash);



          if (transactionHash) {

            if (paymentMethod === 'mkrw') {

              const response = await fetch('/api/order/buyOrderConfirmPaymentWithEscrow', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  lang: params.lang,
                  storecode: params.center,
                  orderId: orderId,
                  paymentAmount: krwAmount,
                  transactionHash: transactionHash,
                  ///isSmartAccount: activeWallet === inAppConnectWallet ? false : true,
                  isSmartAccount: false,
                })
              });

              const data = await response.json();



            } else {

              const response = await fetch('/api/order/buyOrderConfirmPaymentWithoutEscrow', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  lang: params.lang,
                  storecode: params.center,
                  orderId: orderId,
                  paymentAmount: krwAmount,
                  transactionHash: transactionHash,
                  ///isSmartAccount: activeWallet === inAppConnectWallet ? false : true,
                  isSmartAccount: false,
                })
              });

              const data = await response.json();

              //console.log('data', data);

            }


              
              ///fetchBuyOrders();

              // fetch Buy Orders
              await fetch('/api/order/getAllBuyOrders', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(
                  {
                    storecode: params.center,
                    limit: Number(limitValue),
                    page: Number(pageValue),
                    walletAddress: address,
                    searchMyOrders: searchMyOrders,

                    searchOrderStatusCancelled: searchOrderStatusCancelled,
                    searchOrderStatusCompleted: searchOrderStatusCompleted,

                    searchBuyer: searchBuyer,
                    searchDepositName: searchDepositName,

                    searchStoreBankAccountNumber: searchStoreBankAccountNumber,


                    fromDate: searchFromDate,
                    toDate: searchToDate,
                  }
                ),
              })
              .then(response => response.json())
              .then(data => {
                  ///console.log('data', data);
                  setBuyOrders(data.result.orders);

                  setTotalCount(data.result.totalCount);


                  setBuyOrderStats({
                    totalCount: data.result.totalCount,
                    totalKrwAmount: data.result.totalKrwAmount,
                    totalUsdtAmount: data.result.totalUsdtAmount,
                    totalSettlementCount: data.result.totalSettlementCount,
                    totalSettlementAmount: data.result.totalSettlementAmount,
                    totalSettlementAmountKRW: data.result.totalSettlementAmountKRW,
                    totalFeeAmount: data.result.totalFeeAmount,
                    totalFeeAmountKRW: data.result.totalFeeAmountKRW,
                    totalAgentFeeAmount: data.result.totalAgentFeeAmount,
                    totalAgentFeeAmountKRW: data.result.totalAgentFeeAmountKRW,

                    totalByUserType: data.result.totalByUserType,
                    totalBySellerBankAccountNumber: data.result.totalBySellerBankAccountNumber,
                    totalBySellerAliesBankAccountNumber: data.result.totalBySellerAliesBankAccountNumber,
                  });

              })

              toast.success(Payment_has_been_confirmed);
              //playSong();



          } else {
            toast.error('결제확인이 실패했습니다.');
          }

        } catch (error) {
          console.error('Error:', JSON.stringify(error));
          toast.error('결제확인이 실패했습니다.');
        }





    } catch (error) {
      console.error('Error:', JSON.stringify(error));
      toast.error('결제확인이 실패했습니다.');
    }


    setConfirmingPayment(
      confirmingPayment.map((item, idx) => idx === index ? false : item)
    );

    setConfirmPaymentCheck(
      confirmPaymentCheck.map((item, idx) => idx === index ? false : item)
    );
  

  }






  // send payment
  const sendPayment = async (

    index: number,
    orderId: string,
    //paymentAmount: number,
    krwAmount: number,
    //paymentAmountUsdt: number,
    usdtAmount: number,

    buyerWalletAddress: string,

  ) => {
    // confirm payment
    // send usdt to buyer wallet address


    // if escrowWalletAddress balance is less than paymentAmount, then return

    //console.log('escrowBalance', escrowBalance);
    //console.log('paymentAmountUsdt', paymentAmountUsdt);
    

    // check balance
    // if balance is less than paymentAmount, then return
    if (balance < usdtAmount) {
      toast.error(Insufficient_balance);
      return;
    }

    const storecode = "admin";


    if (confirmingPayment[index]) {
      return;
    }

    setConfirmingPayment(
      confirmingPayment.map((item, idx) =>  idx === index ? true : item)
    );

      try {


        const transaction = transfer({
          contract,
          to: buyerWalletAddress,
          amount: usdtAmount,
        });



        //const { transactionHash } = await sendAndConfirmTransaction({
        const { transactionHash } = await sendTransaction({
          transaction: transaction,
          account: activeAccount as any,
        });

        console.log("transactionHash===", transactionHash);



        if (transactionHash) {


          //alert('USDT 전송이 완료되었습니다.');


          const response = await fetch('/api/order/buyOrderConfirmPaymentWithoutEscrow', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              lang: params.lang,
              storecode: params.center,
              orderId: orderId,
              paymentAmount: krwAmount,
              transactionHash: transactionHash,
              ///isSmartAccount: activeWallet === inAppConnectWallet ? false : true,
              isSmartAccount: false,
            })
          });

          const data = await response.json();

          //console.log('data', data);


            // fetch Buy Orders
            await fetch('/api/order/getAllBuyOrders', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(
                {
                  storecode: params.center,
                  limit: Number(limitValue),
                  page: Number(pageValue),
                  walletAddress: address,
                  searchMyOrders: searchMyOrders,

                  searchOrderStatusCancelled: searchOrderStatusCancelled,
                  searchOrderStatusCompleted: searchOrderStatusCompleted,

                  searchBuyer: searchBuyer,
                  searchDepositName: searchDepositName,

                  searchStoreBankAccountNumber: searchStoreBankAccountNumber,


                  fromDate: searchFromDate,
                  toDate: searchToDate,
                }
              ),
            })
            .then(response => response.json())
            .then(data => {
                ///console.log('data', data);
                setBuyOrders(data.result.orders);

                setTotalCount(data.result.totalCount);


                setBuyOrderStats({
                  totalCount: data.result.totalCount,
                  totalKrwAmount: data.result.totalKrwAmount,
                  totalUsdtAmount: data.result.totalUsdtAmount,
                  totalSettlementCount: data.result.totalSettlementCount,
                  totalSettlementAmount: data.result.totalSettlementAmount,
                  totalSettlementAmountKRW: data.result.totalSettlementAmountKRW,
                  totalFeeAmount: data.result.totalFeeAmount,
                  totalFeeAmountKRW: data.result.totalFeeAmountKRW,
                  totalAgentFeeAmount: data.result.totalAgentFeeAmount,
                  totalAgentFeeAmountKRW: data.result.totalAgentFeeAmountKRW,

                  totalByUserType: data.result.totalByUserType,
                  totalBySellerBankAccountNumber: data.result.totalBySellerBankAccountNumber,
                  totalBySellerAliesBankAccountNumber: data.result.totalBySellerAliesBankAccountNumber,
                });

            })

          toast.success(Payment_has_been_confirmed);
          //playSong();


        } else {
          toast.error('결제확인이 실패했습니다.');
        }

    } catch (error) {
      console.error('Error:', JSON.stringify(error));
      //toast.error('결제확인이 실패했습니다.');
    }



    setConfirmingPayment(
      confirmingPayment.map((item, idx) => idx === index ? false : item)
    );

    setConfirmPaymentCheck(
      confirmPaymentCheck.map((item, idx) => idx === index ? false : item)
    );
  

  }














  
  // array of rollbackingPayment
  const [rollbackingPayment, setRollbackingPayment] = useState([] as boolean[]);
  for (let i = 0; i < 100; i++) {
    rollbackingPayment.push(false);
  }
  /*
  useEffect(() => {
      
      setRollbackingPayment(
        new Array(buyOrders.length).fill(false)
      );

  } , [buyOrders]);
   */

  // rollback payment check box
  const [rollbackPaymentCheck, setRollbackPaymentCheck] = useState([] as boolean[]);
  for (let i = 0; i < 100; i++) {
    rollbackPaymentCheck.push(false);
  }
  /*
  useEffect(() => {
      
      setRollbackPaymentCheck(
        new Array(buyOrders.length).fill(false)
      );

  } , [buyOrders]);
   */


  // rollback payment
  const rollbackPayment = async (

    index: number,
    orderId: string,
    paymentAmount: number,
    paymentAmountUsdt: number,

  ) => {
    // rollback payment
    // send usdt to seller wallet address

    if (rollbackingPayment[index]) {
      return;
    }


    /*
    // if escrowWalletAddress balance is less than paymentAmount, then return
    if (escrowBalance < paymentAmountUsdt) {
      toast.error(Escrow_balance_is_less_than_payment_amount);
      return;
    }

    // if escrowNativeBalance is less than 0.1, then return
    if (escrowNativeBalance < 0.1) {
      toast.error('ETH balance is less than 0.1');
      return;
    }
      */
    


    setRollbackingPayment(
      rollbackingPayment.map((item, idx) => idx === index ? true : item)
    );


    try {

      const response = await fetch('/api/order/buyOrderRollbackPayment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          lang: params.lang,
          storecode: params.center,
          orderId: orderId,
          paymentAmount: paymentAmount,
          ///isSmartAccount: activeWallet === inAppConnectWallet ? false : true,
          isSmartAccount: false,
        })
      });

      const data = await response.json();

      //console.log('data', data);

      if (data.result) {


        toast.success('Payment has been rollbacked');

        //playSong();

        
        ///fetchBuyOrders();

        // fetch Buy Orders
        await fetch('/api/order/getAllBuyOrders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(
            {
              storecode: params.center,
              limit: Number(limitValue),
              page: Number(pageValue),
              walletAddress: address,
              searchMyOrders: searchMyOrders,

              searchOrderStatusCancelled: searchOrderStatusCancelled,
              searchOrderStatusCompleted: searchOrderStatusCompleted,

              searchBuyer: searchBuyer,
              searchDepositName: searchDepositName,

              searchStoreBankAccountNumber: searchStoreBankAccountNumber,


              fromDate: searchFromDate,
              toDate: searchToDate,
            }
          ),
        })
        .then(response => response.json())
        .then(data => {
            ///console.log('data', data);
            setBuyOrders(data.result.orders);

            setTotalCount(data.result.totalCount);

            setBuyOrderStats({
              totalCount: data.result.totalCount,
              totalKrwAmount: data.result.totalKrwAmount,
              totalUsdtAmount: data.result.totalUsdtAmount,
              totalSettlementCount: data.result.totalSettlementCount,
              totalSettlementAmount: data.result.totalSettlementAmount,
              totalSettlementAmountKRW: data.result.totalSettlementAmountKRW,
              totalFeeAmount: data.result.totalFeeAmount,
              totalFeeAmountKRW: data.result.totalFeeAmountKRW,
              totalAgentFeeAmount: data.result.totalAgentFeeAmount,
              totalAgentFeeAmountKRW: data.result.totalAgentFeeAmountKRW,

              totalByUserType: data.result.totalByUserType,
              totalBySellerBankAccountNumber: data.result.totalBySellerBankAccountNumber,
              totalBySellerAliesBankAccountNumber: data.result.totalBySellerAliesBankAccountNumber,
            });

        })

      }

    } catch (error) {
      console.error('Error:', JSON.stringify(error));
      toast.error('Rollback payment has been failed');
    }



    setRollbackingPayment(
      rollbackingPayment.map((item, idx) => idx === index ? false : item)
    );

    setRollbackPaymentCheck(
      rollbackPaymentCheck.map((item, idx) => idx === index ? false : item)
    );


  }











  const [latestBuyOrder, setLatestBuyOrder] = useState<BuyOrder | null>(null);


  useEffect(() => {


    const fetchBuyOrders = async () => {

      //console.log('fetchBuyOrders===============>');
      //console.log("address=", address);
      //console.log("searchMyOrders=", searchMyOrders);


      //console.log('acceptingBuyOrder', acceptingBuyOrder);
      //console.log('escrowing', escrowing);
      //console.log('requestingPayment', requestingPayment);
      //console.log('confirmingPayment', confirmingPayment);



      // check all agreementForTrade is false

      if (
        //!address || !searchMyOrders
        agreementForTrade.some((item) => item === true)
        || acceptingBuyOrder.some((item) => item === true)
        || agreementForCancelTrade.some((item) => item === true)
        || confirmPaymentCheck.some((item) => item === true)
        || rollbackPaymentCheck.some((item) => item === true)
        || acceptingBuyOrder.some((item) => item === true)
        || escrowing.some((item) => item === true)
        || requestingPayment.some((item) => item === true)
        || confirmingPayment.some((item) => item === true)
        || rollbackingPayment.some((item) => item === true)
      ) {
        return;
      }


      

      const response = await fetch('/api/order/getAllBuyOrders', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
          },
          body: JSON.stringify(

            {
              storecode: params.center,
              limit: Number(limitValue),
              page: Number(pageValue),
              walletAddress: address,
              searchMyOrders: searchMyOrders,

              searchOrderStatusCancelled: searchOrderStatusCancelled,
              searchOrderStatusCompleted: searchOrderStatusCompleted,

              //searchStoreName: searchStoreName,


              searchBuyer: searchBuyer,
              searchDepositName: searchDepositName,

              searchStoreBankAccountNumber: searchStoreBankAccountNumber,


              fromDate: searchFromDate,
              toDate: searchToDate,



            }

        ),
      });

      if (!response.ok) {
        return;
      }



      const data = await response.json();

      //console.log('data', data);


      // if data.result is different from buyOrders
      // check neweset order is different from buyOrders
      // then toasts message
      //console.log('data.result.orders[0]', data.result.orders?.[0]);
      //console.log('buyOrders[0]', buyOrders);


      //console.log('buyOrders[0]', buyOrders?.[0]);
      /*
      if (data.result.orders?.[0]?._id !== latestBuyOrder?._id) {

        setLatestBuyOrder(data.result.orders?.[0] || null);

   
        
        //toast.success(Newest_order_has_been_arrived);
        toast.success('새로운 주문이 도착했습니다');




        // <audio src="/racing.mp3" typeof="audio/mpeg" autoPlay={soundStatus} muted={!soundStatus} />
        // audio play

        //setSoundStatus(true);

        // audio ding play

        //playSong();

        // Uncaught (in promise) NotAllowedError: play() failed because the user didn't interact with the document first.


      }
      */

      setBuyOrders(data.result.orders);

      setTotalCount(data.result.totalCount);
      

      setBuyOrderStats({
        totalCount: data.result.totalCount,
        totalKrwAmount: data.result.totalKrwAmount,
        totalUsdtAmount: data.result.totalUsdtAmount,
        totalSettlementCount: data.result.totalSettlementCount,
        totalSettlementAmount: data.result.totalSettlementAmount,
        totalSettlementAmountKRW: data.result.totalSettlementAmountKRW,
        totalFeeAmount: data.result.totalFeeAmount,
        totalFeeAmountKRW: data.result.totalFeeAmountKRW,
        totalAgentFeeAmount: data.result.totalAgentFeeAmount,
        totalAgentFeeAmountKRW: data.result.totalAgentFeeAmountKRW,

        totalByUserType: data.result.totalByUserType,
        totalBySellerBankAccountNumber: data.result.totalBySellerBankAccountNumber,
        totalBySellerAliesBankAccountNumber: data.result.totalBySellerAliesBankAccountNumber,
      });


    }


    fetchBuyOrders();

    
    
    const interval = setInterval(() => {

      fetchBuyOrders();


    }, 3000);


    return () => clearInterval(interval);
    
    
    
    


  } , [

    address,
    searchMyOrders,
    agreementForTrade,
    acceptingBuyOrder,
    escrowing,
    requestingPayment,
    confirmingPayment,
    rollbackingPayment,
    agreementForCancelTrade,
    confirmPaymentCheck,
    rollbackPaymentCheck,

    latestBuyOrder,
    //playSong,
    params.center,
    limitValue,
    pageValue,
    searchFromDate,
    searchToDate,

    searchOrderStatusCancelled,
    searchOrderStatusCompleted,

    searchBuyer,
    searchDepositName,
    searchStoreBankAccountNumber,


]);


///console.log('agreementForTrade', agreementForTrade);





  



const [fetchingBuyOrders, setFetchingBuyOrders] = useState(false);

const fetchBuyOrders = async () => {


  if (fetchingBuyOrders) {
    return;
  }
  setFetchingBuyOrders(true);

  const response = await fetch('/api/order/getAllBuyOrders', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    },
    body: JSON.stringify(
      {
        storecode: params.center,
        limit: Number(limitValue),
        page: Number(pageValue),
        walletAddress: address,
        searchMyOrders: searchMyOrders,

        searchOrderStatusCompleted: true,

        searchBuyer: searchBuyer,
        searchDepositName: searchDepositName,

        searchStoreBankAccountNumber: searchStoreBankAccountNumber,

        fromDate: searchFromDate,
        toDate: searchToDate,

      }

    ),
  });

  if (!response.ok) {
    setFetchingBuyOrders(false);
    toast.error('Failed to fetch buy orders');
    return;
  }
  const data = await response.json();
  //console.log('data', data);

  setBuyOrders(data.result.orders);
  setTotalCount(data.result.totalCount);
  setFetchingBuyOrders(false);


  setBuyOrderStats({
    totalCount: data.result.totalCount,
    totalKrwAmount: data.result.totalKrwAmount,
    totalUsdtAmount: data.result.totalUsdtAmount,
    totalSettlementCount: data.result.totalSettlementCount,
    totalSettlementAmount: data.result.totalSettlementAmount,
    totalSettlementAmountKRW: data.result.totalSettlementAmountKRW,
    totalFeeAmount: data.result.totalFeeAmount,
    totalFeeAmountKRW: data.result.totalFeeAmountKRW,
    totalAgentFeeAmount: data.result.totalAgentFeeAmount,
    totalAgentFeeAmountKRW: data.result.totalAgentFeeAmountKRW,

    totalByUserType: data.result.totalByUserType,
    totalBySellerBankAccountNumber: data.result.totalBySellerBankAccountNumber,
    totalBySellerAliesBankAccountNumber: data.result.totalBySellerAliesBankAccountNumber,
  });


  return data.result.orders;
}






  const [escrowBalance, setEscrowBalance] = useState(0);
  const [todayMinusedEscrowAmount, setTodayMinusedEscrowAmount] = useState(0);

  useEffect(() => {

    const fetchEscrowBalance = async () => {
      if (!params.center) {
        return;
      }

      const response = await fetch('/api/store/getEscrowBalance', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
          },
          body: JSON.stringify(
            {
              storecode: params.center,
            }
        ),
      });

      if (!response.ok) {
        return;
      }



      const data = await response.json();

      setEscrowBalance(data.result.escrowBalance);
      setTodayMinusedEscrowAmount(data.result.todayMinusedEscrowAmount);

    }


    fetchEscrowBalance();

    
    
    const interval = setInterval(() => {

      fetchEscrowBalance();

    }, 5000);

    return () => clearInterval(interval);

  } , [
    params.center,
  ]);









    // check table view or card view
    const [tableView, setTableView] = useState(true);




    const [storeCodeNumber, setStoreCodeNumber] = useState('');

    useEffect(() => {
  
      const fetchStoreCode = async () => {
  
        const response = await fetch('/api/order/getStoreCodeNumber', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });
  
        const data = await response.json();
  
        //console.log('getStoreCodeNumber data', data);
  
        setStoreCodeNumber(data?.storeCodeNumber);
  
      }
  
      fetchStoreCode();
  
    } , []);
    



    // array of stores
    const [storeList, setStoreList] = useState([] as any[]);




    const [storeAdminWalletAddress, setStoreAdminWalletAddress] = useState("");

    const [fetchingStore, setFetchingStore] = useState(false);
    const [store, setStore] = useState(null) as any;
  
    useEffect(() => {
  
      setFetchingStore(true);
  
      const fetchData = async () => {
          const response = await fetch("/api/store/getOneStore", {
              method: "POST",
              headers: {
                  "Content-Type": "application/json",
              },
              body: JSON.stringify({
                storecode: params.center,
                ////walletAddress: address,
              }),
          });
  
          const data = await response.json();
  
          //console.log("data", data);
  
          if (data.result) {
  
            setStore(data.result);
  
            setStoreAdminWalletAddress(data.result?.adminWalletAddress);

            if (data.result?.adminWalletAddress === address) {
              setIsAdmin(true);
            }
  

        } else {
          // get store list
          const response = await fetch("/api/store/getAllStores", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
            }),
          });
          const data = await response.json();
          //console.log("getStoreList data", data);
          setStoreList(data.result.stores);
          setStore(null);
          setStoreAdminWalletAddress("");
        }
  
          setFetchingStore(false);
      };

      if (!params.center) {
        return;
      }
  
      fetchData();

      // interval
      const interval = setInterval(() => {
        fetchData();
      }
      , 5000);
      return () => clearInterval(interval);
  
    } , [params.center, address]);





    const [selectedItem, setSelectedItem] = useState<any>(null);

  
  
  
  
  
  // totalNumberOfBuyOrders
  const [loadingTotalNumberOfBuyOrders, setLoadingTotalNumberOfBuyOrders] = useState(false);
  const [totalNumberOfBuyOrders, setTotalNumberOfBuyOrders] = useState(0);
  const [processingBuyOrders, setProcessingBuyOrders] = useState([] as BuyOrder[]);
  const [totalNumberOfAudioOnBuyOrders, setTotalNumberOfAudioOnBuyOrders] = useState(0);

  useEffect(() => {

    const fetchTotalBuyOrders = async (): Promise<void> => {
      setLoadingTotalNumberOfBuyOrders(true);
      const response = await fetch('/api/order/getTotalNumberOfBuyOrders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          storecode: params.center,
        })
      });
      if (!response.ok) {
        console.error('Failed to fetch total number of buy orders');
        setLoadingTotalNumberOfBuyOrders(false);
        return;
      }
      const data = await response.json();
      //console.log('getTotalNumberOfBuyOrders data', data);
      setTotalNumberOfBuyOrders(data.result.totalCount);
      setProcessingBuyOrders(data.result.orders);
      setTotalNumberOfAudioOnBuyOrders(data.result.audioOnCount);

      setLoadingTotalNumberOfBuyOrders(false);
    };


    if (!address) {
      setTotalNumberOfBuyOrders(0);
      return;
    }

    fetchTotalBuyOrders();

    const interval = setInterval(() => {
      fetchTotalBuyOrders();
    }, 5000);
    return () => clearInterval(interval);

  }, [address, params.center]);

  
  useEffect(() => {
    if (
      user?.buyOrderAudioOn &&
      totalNumberOfBuyOrders > 0 && loadingTotalNumberOfBuyOrders === false) {
      const audio = new Audio('/notification.wav'); 
      audio.play();
    }
  }, [
    user?.buyOrderAudioOn,
    totalNumberOfBuyOrders, loadingTotalNumberOfBuyOrders]);
  





    
  // get count of status is 'paymentRequested' from api
  const [paymentRequestedCount, setPaymentRequestedCount] = useState(0);
  const [loadingPaymentRequestedCount, setLoadingPaymentRequestedCount] = useState(false);
  const [processingPaymentRequestedOrders, setProcessingPaymentRequestedOrders] = useState([] as BuyOrder[]);

  useEffect(() => {
    const fetchData = async () => {
      setLoadingPaymentRequestedCount(true);
      try {
        const response = await fetch('/api/order/getCountOfPaymentRequested', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            storecode: params.center,
            walletAddress: address,
          }),
        });
        if (response.ok) {
          const data = await response.json();
          setPaymentRequestedCount(data.result.totalCount || 0);
          setProcessingPaymentRequestedOrders(data.result.orders || []);
        }
      } catch (error) {
        console.error("Error fetching payment requested count: ", error);
      }

      setLoadingPaymentRequestedCount(false);
    };
    fetchData();

    const interval = setInterval(() => {
      fetchData();
    }, 5000);
    return () => clearInterval(interval);
  }, [address, params.center]);
  

  useEffect(() => {
    if (paymentRequestedCount > 0 && loadingPaymentRequestedCount === false) {
      const audio = new Audio('/audio-notification-order-private.wav'); 
      audio.play();
    }
  }, [paymentRequestedCount, loadingPaymentRequestedCount]);



  // handleUserBuyOrderAudioToggle
  const handleUserBuyOrderAudioToggle = async (audioOn: boolean) => {
    const response = await fetch('/api/user/toggleBuyOrderAudioNotification', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        walletAddress: address,
        storecode: params.center,
        audioOn,
      }),
    });

    if (!response.ok) {
      console.error('Failed to toggle audio notification');
      return;
    }

    const data = await response.json();
    console.log('Audio notification toggled:', data);

    if (data.success) {
      // update user audioOn state
      setUser((prevUser: any) => ({
        ...prevUser,
        buyOrderAudioOn: audioOn,
      }));
    }

  };





  useEffect(() => {
    // Dynamically load the Binance widget script
    const script = document.createElement("script");
    script.src = "https://public.bnbstatic.com/unpkg/growth-widget/cryptoCurrencyWidget@0.0.20.min.js";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      // Cleanup the script when the component unmounts
      document.body.removeChild(script);
    };
  }, [address, store]);





  if (fetchingStore) {
    return (
      <main className="p-4 pb-10 min-h-[100vh] flex items-start justify-center container max-w-screen-2xl mx-auto">
        <div className="py-0 w-full flex flex-col items-center justify-center gap-4">

          <Image
            src="/banner-loading.gif"
            alt="Loading"
            width={200}
            height={200}
          />

          <div className="text-lg text-gray-500">가맹점 정보를 불러오는 중</div>
        </div>
      </main>
    );
  }

  
  if (!fetchingStore && !store) {
    return (
      <main className="p-4 pb-10 min-h-[100vh] flex items-start justify-center container max-w-screen-2xl mx-auto">
        <div className="py-0 w-full flex flex-col items-center justify-center gap-4">
          <Image
            src="/banner-404.gif"
            alt="Error"
            width={200}
            height={200}
          />
          <div className="text-lg text-gray-500">가맹점 정보가 없습니다.</div>
          <div className="text-sm text-gray-400">가맹점 홈페이지로 이동해주세요.</div>

          {/* table of storeList */}
          {/* storeName, storeCode, storeLogo, goto center page */}
          
          <div className="w-full max-w-2xl">
            <table className="w-full table-auto border-collapse">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left">가맹점 이름</th>
                  <th className="px-4 py-2 text-left">가맹점 코드</th>
                  <th className="px-4 py-2 text-left">가맹점 로고</th>
                </tr>
              </thead>
              <tbody>
                {storeList.map((store) => (
                  <tr key={store.storecode} className="hover:bg-gray-100">
                    <td className="px-4 py-2">{store.storeName}</td>
                    <td className="px-4 py-2">{store.storecode}</td>
                    <td className="px-4 py-2">
                      <Image
                        src={store.storeLogo || "/logo.png"}
                        alt={store.storeName}
                        width={100}
                        height={100}
                        className="rounded-lg w-20 h-20 object-cover"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <button
                        onClick={() => router.push('/' + params.lang + '/' + store.storecode + '/center')}
                        className="text-blue-500 hover:underline"
                      >
                        가맹점 페이지로 이동
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      </main>
    );
  }







  if (!address) {
    return (
   <main className="p-4 pb-10 min-h-[100vh] flex items-start justify-center container max-w-screen-2xl mx-auto">


      <div className="py-0 w-full">


        {params.center && (

            <div className={`w-full flex flex-col sm:flex-row items-center justify-start gap-2
              p-2 rounded-lg mb-4
              ${store?.backgroundColor ?
                "bg-" + store.backgroundColor + " " :
                "bg-black/10"
              }`}>

              {/* banner-igor-bastidas-7.gif */}
              <Image
                src="/banner-igor-bastidas-7.gif"
                alt="Please connect your wallet"
                width={400}
                height={200}
                className="rounded-lg w-full max-w-2xl"
              />
              <div className="text-sm text-[#3167b4] font-bold">
                {store?.storeName} ({store?.storecode}) 가맹점 - 지갑을 연결해주세요.
              </div>
              
            </div>
        )}


        <div className="w-full flex flex-col justify-between items-center gap-2 mb-5">
   

          <div className="w-full flex flex-row gap-2 justify-end items-center">


          {/* right space */}
          {/* background transparent */}
          <select
            //className="p-2 text-sm bg-zinc-800 text-white rounded"


            className="p-2 text-sm bg-transparent text-zinc-800 rounded"

            onChange={(e) => {
              const lang = e.target.value;
              router.push(
                "/" + lang + "/" + params.center + "/center"
              );
            }}
          >
            <option
              value="en"
              selected={params.lang === "en"}
            >
              English(US)
            </option>
            <option
              value="ko"
              selected={params.lang === "ko"}
            >
              한국어(KR)
            </option>
            <option
              value="zh"
              selected={params.lang === "zh"}
            >
              中文(ZH)
            </option>
            <option
              value="ja"
              selected={params.lang === "ja"}
            >
              日本語(JP)
            </option>
          </select>

          {/* icon-language */}
          {/* color is tone down */}
          <Image
            src="/icon-language.png"
            alt="Language"
            width={20}
            height={20}
            className="rounded-lg w-6 h-6
              opacity-50
              "
          />

          </div>

        </div>


      </div>

    </main>


    );
  }



  if (
    (address
    && store
    &&  address !== store.adminWalletAddress
    && user?.role !== "admin"
  )
    

  ) {
    return (


      <div className={`w-full flex flex-row items-center justify-start gap-2
        p-2 rounded-lg mb-4
        ${store?.backgroundColor ?
          "bg-" + store.backgroundColor + " " :
          "bg-black/10"
        }`}>

        <div className="flex flex-row items-center justify-center gap-2">
          <Image
            src={store?.storeLogo || "/logo.png"}
            alt="logo"
            width={35}
            height={35}
            className="rounded-lg w-6 h-6 object-cover"
          />
          <div className="text-sm text-[#3167b4] font-bold">
            {store?.storeName + " (" + store?.storecode + ") 가맹점 관리자가 아닙니다."}
          </div>
        </div>

        {/* 회원가입한후 가맹점 관리자 등록신청을 하세요 */}
        {/* 회원가입하러 가기 */}
        <div className="flex flex-row items-center justify-center gap-2">
          <button
            onClick={() => {
              router.push('/' + params.lang + '/' + params.center + '/profile-settings');
            }}
            className="flex bg-[#3167b4] text-sm text-[#f3f4f6] px-4 py-2 rounded-lg hover:bg-[#3167b4]/80"
          >
            회원가입하러 가기
          </button>
        </div>

        {/* 로그아웃 버튼 */}
        <button
          onClick={() => {
            confirm("로그아웃 하시겠습니까?") && activeWallet?.disconnect()
            .then(() => {

                toast.success('로그아웃 되었습니다');

                //router.push(
                //    "/admin/" + params.center
                //);
            });
          } }

          className="flex items-center justify-center gap-2
            bg-[#3167b4] text-sm text-[#f3f4f6] px-4 py-2 rounded-lg hover:bg-[#3167b4]/80"
        >
          <Image
            src="/icon-logout.webp"
            alt="Logout"
            width={20}
            height={20}
            className="rounded-lg w-5 h-5"
          />
          <span className="text-sm">
            로그아웃
          </span>
        </button>



      </div>
    );

  }





  return (

    <>
    <main className="p-4 pb-10 min-h-[100vh] flex items-start justify-center container max-w-screen-2xl mx-auto">

      {showJackpot && (
        <div className="jackpot-overlay">
          {[...Array(20)].map((_, i) => (
            <span
              key={i}
              className="confetti-piece"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 60}%`,
                animationDelay: `${Math.random() * 0.3}s`,
              ['--confetti-color' as any]: ['#10b981','#6366f1','#f59e0b','#ef4444'][i % 4],
            }}
          />
          ))}
          <div className="jackpot-card flex items-center gap-4 px-6 py-4 bg-white/95 rounded-2xl shadow-2xl backdrop-blur">
            <Image
              src={jackpotStoreLogo || '/icon-store.png'}
              alt={jackpotStoreName || 'store'}
              width={72}
              height={72}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover ring-4 ring-amber-300 bg-white"
            />
            <div className="flex flex-col gap-1">
              <span className="text-lg sm:text-xl font-semibold text-neutral-700">
                {jackpotStoreName || '가맹점'}
              </span>
              {jackpotDepositor && (
                <span className="text-2xl sm:text-3xl font-extrabold text-neutral-900 leading-tight">
                  입금자명: {jackpotDepositor}
                </span>
              )}
              <div className="text-4xl sm:text-5xl font-extrabold text-amber-500 drop-shadow-lg tracking-tight leading-none">
                <span className="text-emerald-600">
                  {jackpotKrw.toLocaleString()}원
                </span>
                <span className="text-neutral-700 font-bold mx-2 text-2xl sm:text-3xl">
                  를 결제하고
                </span>
                <span className="text-emerald-600">
                  {jackpotUsdt.toLocaleString(undefined, { minimumFractionDigits: 3, maximumFractionDigits: 3 })} USDT
                </span>
                <span className="text-neutral-700 font-bold ml-2 text-2xl sm:text-3xl">
                  를 구매하였습니다.
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
      <style jsx global>{`
        @keyframes jackpotFlash {
          0% { opacity: 0; transform: scale(0.96); }
          20% { opacity: 1; transform: scale(1.02); }
          60% { opacity: 1; transform: scale(1); }
          100% { opacity: 0; transform: scale(1); }
        }
        @keyframes confetti {
          0% { transform: translateY(-20px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(80px) rotate(360deg); opacity: 0; }
        }
        @keyframes balanceFlash {
          0% { box-shadow: 0 0 0 0 rgba(21,128,61,0.85); background-color: rgba(16,185,129,0.18); }
          35% { box-shadow: 0 0 0 14px rgba(21,128,61,0.30); background-color: rgba(16,185,129,0.10); }
          70% { box-shadow: 0 0 0 26px rgba(21,128,61,0.10); background-color: rgba(16,185,129,0.04); }
          100% { box-shadow: 0 0 0 34px rgba(21,128,61,0); background-color: transparent; }
        }
        .balance-flash { animation: balanceFlash 0.9s ease-out; }
        .balance-flash-target { animation: balanceFlash 0.9s ease-out; }
        .jackpot-overlay {
          position: fixed;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          pointer-events: none;
          background: radial-gradient(circle at 50% 40%, rgba(255,255,240,0.9), rgba(255,255,240,0.25) 45%, rgba(0,0,0,0.12));
          animation: jackpotFlash 1.2s ease-out;
          z-index: 50;
        }
        .confetti-piece {
          position: absolute;
          width: 6px;
          height: 14px;
          border-radius: 2px;
          background: var(--confetti-color, #10b981);
          opacity: 0;
          animation: confetti 1s ease-out forwards;
        }
      `}</style>


      {/* fixed position right and vertically center */}
      <div className="
        flex
        fixed right-4 top-1/2 transform -translate-y-1/2
        z-40
        ">

          <div className="w-full flex flex-col items-end justify-center gap-4">

            <div className="
              h-20
              flex flex-row items-center justify-center gap-2
              bg-white/80
              p-2 rounded-lg shadow-md
              backdrop-blur-md
            ">

            <div className="flex flex-col items-center justify-center gap-1
            border-r-2 border-gray-300 pr-2
            ">
                <span className="text-xl text-zinc-500 font-semibold">
                  {user?.buyOrderAudioOn ? (
                    '🔊'
                  ) : (
                    '🔇'
                  )}
                </span>
                {/* audioOn off button */}
                <button
                  className="text-sm text-blue-600 font-semibold underline"
                  onClick={() => handleUserBuyOrderAudioToggle(
                    user?.buyOrderAudioOn ? false : true
                  )}
                >
                  {user?.buyOrderAudioOn ? '끄기' : '켜기'}
                </button>
              </div>


              {loadingTotalNumberOfBuyOrders ? (
                <Image
                  src="/loading.png"
                  alt="Loading"
                  width={20}
                  height={20}
                  className="w-6 h-6 animate-spin"
                />
              ) : (
                <Image
                  src="/icon-buyorder.png"
                  alt="Buy Order"
                  width={35}
                  height={35}
                  className="w-6 h-6"
                />
              )}

              {/* array of processingBuyOrders store logos */}
              <div className="flex flex-row items-center justify-center gap-1">

                {processingBuyOrders.slice(0, 3).map((order: BuyOrder, index: number) => (

                  <div className="flex flex-col items-center justify-center
                  bg-white p-1 rounded-lg shadow-md
                  "
                  key={index}>
                    <Image
                      src={order?.store?.storeLogo || '/logo.png'}
                      alt={order?.store?.storeName || 'Store'}
                      width={20}
                      height={20}
                      className="w-5 h-5 rounded-lg object-cover"
                    />
                    <span className="text-xs text-gray-500">
                      {order?.store?.storeName || 'Store'}
                    </span>
                    <span className="text-sm text-gray-800 font-semibold">
                      {order?.buyer.depositName || 'Buyer'}
                    </span>
                  </div>

                ))}

                {processingBuyOrders.length > 3 && (
                  <span className="text-sm text-gray-500">
                    +{processingBuyOrders.length - 3}
                  </span>
                )}
              </div>

              <p className="text-lg text-red-500 font-semibold">
                {
                totalNumberOfBuyOrders
                }
              </p>

              {totalNumberOfBuyOrders > 0 && (
                <div className="flex flex-row items-center justify-center gap-2">
                  <Image
                    src="/icon-notification.gif"
                    alt="Notification"
                    width={50}
                    height={50}
                    className="w-15 h-15 object-cover"
                    
                  />
                </div>
              )}
            </div>


            {/* Clearance Orders */}
            
            {version !== 'bangbang' && (
            <div className="
              h-20
              flex flex-row items-center justify-center gap-2
              bg-white/80
              p-2 rounded-lg shadow-md
              backdrop-blur-md
            ">

              {loadingPaymentRequestedCount ? (
                <Image
                  src="/loading.png"
                  alt="Loading"
                  width={20}
                  height={20}
                  className="w-6 h-6 animate-spin"
                />
              ) : (
                <Image
                  src="/icon-clearance.png"
                  alt="Clearance"
                  width={35}
                  height={35}
                  className="w-6 h-6"
                />
              )}

              {/* array of processingPaymentRequestedOrders store logos */}
              <div className="flex flex-row items-center justify-center gap-1">
                {processingPaymentRequestedOrders.slice(0, 3).map((order: BuyOrder, index: number) => (

                  <div className="flex flex-col items-center justify-center
                  bg-white p-1 rounded-lg shadow-md
                  "
                  key={index}>
                    <Image
                      src={order?.store?.storeLogo || '/logo.png'}
                      alt={order?.store?.storeName || 'Store'}
                      width={20}
                      height={20}
                      className="w-5 h-5 rounded-lg object-cover"
                    />
                    <span className="text-xs text-gray-500">
                      {order?.store?.storeName || 'Store'}
                    </span>
                    <span className="text-sm text-gray-800 font-semibold">
                      {order?.seller?.bankInfo?.accountHolder || 'Buyer'}
                    </span>
                  </div>

                ))}

                {processingPaymentRequestedOrders.length > 3 && (
                  <span className="text-sm text-gray-500">
                    +{processingPaymentRequestedOrders.length - 3}
                  </span>
                )}
              </div>

              <p className="text-lg text-yellow-500 font-semibold">
                {
                paymentRequestedCount
                }
              </p>

              {paymentRequestedCount > 0 && (
                <div className="flex flex-row items-center justify-center gap-2">
                  <Image
                    src="/icon-notification.gif"
                    alt="Notification"
                    width={50}
                    height={50}
                    className="w-15 h-15 object-cover"
                    
                  />
                  <button
                    onClick={() => {
                      router.push('/' + params.lang + '/' + params.center + '/clearance-history');
                    }}
                    className="flex items-center justify-center gap-2
                    bg-[#3167b4] text-sm text-[#f3f4f6] px-4 py-2 rounded-lg hover:bg-[#3167b4]/80"
                  >
                    <span className="text-sm">
                      거래소<br />판매
                    </span>
                  </button>
                </div>
              )}
            </div>
            )}
            


            {/* P2P 거래수 */}
            <div className="flex flex-row items-center justify-center gap-2
            bg-white/80
            p-2 rounded-lg shadow-md
            backdrop-blur-md
            ">
              <Image
                src="/icon-trade.png"
                alt="P2P"
                width={35}
                height={35}
                className="w-6 h-6"
              />
              <p className="text-lg text-green-500 font-semibold">
                {
                  //buyOrderStats.totalCount
                  animatedTotalCount
                }
              </p>
            </div>

            {/* 가맹점 결제수 */}
            <div className="flex flex-row items-center justify-center gap-2
            bg-white/80
            p-2 rounded-lg shadow-md
            backdrop-blur-md
            ">
              <Image
                src="/icon-payment2.png"
                alt="payment"
                width={35}
                height={35}
                className="w-6 h-6"
              />
              <p className="text-lg text-green-500 font-semibold">
                {
                buyOrderStats.totalSettlementCount
                }
              </p>
            </div>

        
          </div>

      </div>


      <div className="py-0 w-full">

        <div className={`w-full flex flex-col sm:flex-row items-center justify-between gap-2
          p-2 rounded-lg mb-4
          ${store?.backgroundColor ?
            "bg-" + store.backgroundColor + " " :
            "bg-black/10"
          }`}>
            

            <div className="flex flex-row items-center gap-2">
              
              {/*}
              <div className="w-full flex flex-row items-center justify-end gap-2">
                {!address && (
                  <ConnectButton
                    client={client}
                    wallets={wallets}
                    showAllWallets={false}
                    
                    theme={"light"}

                    // button color is dark skyblue convert (49, 103, 180) to hex
                    connectButton={{
                        style: {
                            backgroundColor: "#3167b4", // dark skyblue
                            color: "#f3f4f6", // gray-300
                            padding: "2px 10px",
                            borderRadius: "10px",
                            fontSize: "14px",
                            width: "60x",
                            height: "38px",
                        },
                        label: "원클릭 로그인",
                    }}

                    connectModal={{
                      size: "wide", 
                      //size: "compact",
                      titleIcon: "https://www.stable.makeup/logo.png",                           
                      showThirdwebBranding: false,
                    }}

                    locale={"ko_KR"}
                    //locale={"en_US"}
                  />
                )}
              </div>
              */}

          
              {address && !loadingUser && (
                  <div className="w-full flex flex-row items-center justify-end gap-2">

                    <button
                      onClick={() => {
                        router.push('/' + params.lang + '/' + params.center + '/profile-settings');
                      }}
                      className="
                      items-center justify-center
                      bg-[#3167b4] text-sm text-[#f3f4f6] px-4 py-2 rounded-lg hover:bg-[#3167b4]/80"
                    >
                      <div className="
                        w-40 xl:w-48
                        flex flex-col sm:flex-row items-center justify-center gap-2">
                        <span className="text-sm text-zinc-50">
                          {user?.nickname || "프로필"}
                        </span>
                        {isAdmin && (
                          <div className="flex flex-row items-center justify-center gap-2">
                            <Image
                              src="/icon-admin.png"
                              alt="Admin"
                              width={20}
                              height={20}
                              className="rounded-lg w-5 h-5"
                            />
                            <span className="text-sm text-yellow-500">
                              가맹점 관리자
                            </span>
                          </div>
                        )}
                      </div>
                    </button>

                    {/* logout button */}
                    <button
                        onClick={() => {
                            confirm("로그아웃 하시겠습니까?") && activeWallet?.disconnect()
                            .then(() => {

                                toast.success('로그아웃 되었습니다');

                                //router.push(
                                //    "/admin/" + params.center
                                //);
                            });
                        } }

                        className="
                          w-32
                          flex items-center justify-center gap-2
                          bg-[#3167b4] text-sm text-[#f3f4f6] px-4 py-2 rounded-lg hover:bg-[#3167b4]/80"
                    >
                      <Image
                        src="/icon-logout.webp"
                        alt="Logout"
                        width={20}
                        height={20}
                        className="rounded-lg w-5 h-5"
                      />
                      <span className="text-sm">
                        로그아웃
                      </span>
                    </button>

                </div>
              )}


            </div>


        </div>


        <div className="flex flex-col items-start justify-center gap-2">


          {/* USDT 가격 binance market price */}
          {/*
          <div
            className="
            h-20
              w-full flex
              binance-widget-marquee
            flex-row items-center justify-center gap-2
            p-2
            "

            data-cmc-ids="1,1027,52,5426,3408,74,20947,5994,24478,13502,35336,825"
            data-theme="dark"
            data-transparent="true"
            data-locale="ko"
            data-fiat="KRW"
            //data-powered-by="Powered by OneClick USDT"
            //data-disclaimer="Disclaimer"
          ></div>
          */}



          
          {/*version !== 'bangbang' && (

          <div className="w-full flex flex-col items-end justify-end gap-2
          border-b border-zinc-300 pb-2">

            <div className="flex flex-col sm:flex-row items-start xl:items-center gap-2">
              <div className="flex flex-row gap-2 items-center">
                <Image
                  src="/icon-trade.png"
                  alt="Trade"
                  width={20}
                  height={20}
                  className="w-5 h-5"
                />
                <span className="text-lg font-semibold text-zinc-500">
                  가맹점 거래
                </span>
              </div>

              <div className="flex flex-row items-center gap-2">
                <Image
                  src="/icon-tether.png"
                  alt="Tether"
                  width={20}
                  height={20}
                  className="w-5 h-5"
                />
                <span className="text-lg text-[#409192] font-semibold"
                  style={{ fontFamily: 'monospace' }}
                >
                  {
                    Number(store?.totalUsdtAmount ? store?.totalUsdtAmount : 0)
                    .toFixed(3).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                  }
                </span>
              </div>

              <div className="flex flex-row gap-1 items-center">
                <span className="text-lg text-yellow-600 font-semibold"
                  style={{ fontFamily: 'monospace' }}
                >
                  {
                    Number(store?.totalKrwAmount ? store?.totalKrwAmount : 0)
                    .toLocaleString('ko-KR')
                  }
                </span>
                <span className="text-sm text-zinc-500">
                  원
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-start xl:items-center gap-2">
              <div className="flex flex-row gap-2 items-center">
                <Image
                  src="/icon-settlement.png"
                  alt="Settlement"
                  width={20}
                  height={20}
                  className="w-5 h-5"
                />
                <span className="text-lg font-semibold text-zinc-500">
                  가맹점 정산
                </span>
              </div>

              <div className="flex flex-row items-center gap-2">
                <Image
                  src="/icon-tether.png"
                  alt="Tether"
                  width={20}
                  height={20}
                  className="w-5 h-5"
                />
                <span className="text-lg text-[#409192] font-semibold"
                  style={{ fontFamily: 'monospace' }}
                >
                  {
                    Number(store?.totalSettlementAmount ? store?.totalSettlementAmount : 0)
                    .toFixed(3).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                  }
                </span>
              </div>

              <div className="flex flex-row gap-1 items-center">
                <span className="text-lg text-yellow-600 font-semibold"
                  style={{ fontFamily: 'monospace' }}
                >
                  {
                    Number(store?.totalSettlementAmountKRW ? store?.totalSettlementAmountKRW : 0)
                    .toLocaleString('ko-KR')
                  }
                </span>
                <span className="text-sm text-zinc-500">
                  원
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-start xl:items-center gap-2">
              <div className="flex flex-row gap-2 items-center">
                <Image
                  src="/icon-clearance.png"
                  alt="Clearance"
                  width={20}
                  height={20}
                  className="w-5 h-5"
                />
                <span className="text-lg font-semibold text-zinc-500">
                  가맹점 판매
                </span>
              </div>

              <div className="flex flex-row items-center gap-2">
                <Image
                  src="/icon-tether.png"
                  alt="Tether"
                  width={20}
                  height={20}
                  className="w-5 h-5"
                />
                <span className="text-lg text-[#409192] font-semibold"
                  style={{ fontFamily: 'monospace' }}
                >
                  {
                    Number(store?.totalUsdtAmountClearance || 0)
                    .toFixed(3).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                  }
                </span>
              </div>

              <div className="flex flex-row gap-1 items-center">
                <span className="text-lg text-yellow-600 font-semibold"
                  style={{ fontFamily: 'monospace' }}
                >
                  {
                    Number(store?.totalKrwAmountClearance || 0)
                    .toLocaleString('ko-KR')
                  }
                </span>
                <span className="text-sm text-zinc-500">
                  원
                </span>
              </div>

            </div> 


          </div>

          )*/}


          <div className="mb-4 flex w-full items-center gap-2 overflow-x-auto pb-1">
              <button
                  onClick={() => router.push('/' + params.lang + '/' + params.center + '/member')}
                  className="flex shrink-0 min-w-[8.5rem] items-center justify-center whitespace-nowrap rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-[0_8px_18px_-12px_rgba(0,0,0,0.35)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-md">
                  회원관리
              </button>

              <div className="flex shrink-0 min-w-[8.5rem] items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white shadow-[0_10px_20px_-12px_rgba(15,23,42,0.8)]">
                <Image
                  src="/icon-buyorder.png"
                  alt="Trade"
                  width={35}
                  height={35}
                  className="w-4 h-4"
                />
                <div className="text-sm font-semibold">
                  구매주문관리
                </div>
              </div>

              <button
                  onClick={() => router.push('/' + params.lang + '/' + params.center + '/trade-history')}
                  className="flex shrink-0 min-w-[8.5rem] items-center justify-center whitespace-nowrap rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-[0_8px_18px_-12px_rgba(0,0,0,0.35)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-md">
                  P2P 거래내역
              </button>


              {version !== 'bangbang' && (
              <button
                  onClick={() => router.push('/' + params.lang + '/' + params.center + '/clearance-history')}
                  className="flex shrink-0 min-w-[8.5rem] items-center justify-center whitespace-nowrap rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-[0_8px_18px_-12px_rgba(0,0,0,0.35)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-md">
                  판매(거래소)
              </button>
              )}

              {version !== 'bangbang' && (
              <button
                onClick={() => router.push('/' + params.lang + '/' + params.center + '/clearance-request')}
                className="flex shrink-0 min-w-[8.5rem] items-center justify-center whitespace-nowrap rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-[0_8px_18px_-12px_rgba(0,0,0,0.35)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-md">
                  출금(회원)
              </button>
              )}

              <button
                onClick={() => router.push('/' + params.lang + '/' + params.center + '/daily-close')}
                className="flex shrink-0 min-w-[8.5rem] items-center justify-center whitespace-nowrap rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-[0_8px_18px_-12px_rgba(0,0,0,0.35)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-md">
                  통계(일별)
              </button>

          </div>


          <div className='flex flex-row items-center space-x-4'>
              <Image
                src="/icon-buyorder.png"
                alt="Trade"
                width={35}
                height={35}
                className="w-6 h-6"
              />

              <div className="text-xl font-semibold">
                구매주문관리
              </div>

          </div>


          <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6
          border-b border-zinc-300 pb-4">

            <div className="flex flex-col items-start gap-4">

              {/* P2P 거래소 입금통장 */}
              <div className="flex flex-col sm:flex-row items-start justify-start gap-1">
                <div className="flex flex-row gap-2 items-center">
                  {/* dot */}
                  <div className="w-1 h-1 rounded-full bg-zinc-500" />
                  <span className="text-sm text-zinc-500">
                    P2P 거래소 입금통장
                  </span>
                </div>

                <div className="w-60 flex flex-row items-start justify-start gap-1">
                  <Image
                    src="/icon-bank.png"
                    alt="Bank"
                    width={20}
                    height={20}
                    className="rounded-lg"
                  />
                  <div className="w-full flex flex-col items-start justify-center">

                    {/* 일반 */}
                    {store?.bankInfo && (
                    <div className="flex flex-row items-center gap-1">
                      <div className="w-10 h-5 rounded-full bg-zinc-500 flex items-center justify-center">
                        <span className="text-xs text-white">일반</span>
                      </div>
                      <span className="text-sm text-zinc-500">
                          {store?.bankInfo?.accountNumber.length > 5 ? (
                            <>
                              {store?.bankInfo?.accountHolder
                              + " " + store?.bankInfo?.accountNumber.slice(0, 5) + "..."
                              + " " + store?.bankInfo?.bankName}
                            </>
                          ) : (
                            <>
                              {store?.bankInfo?.accountHolder
                              + " " + store?.bankInfo?.accountNumber
                              + " " + store?.bankInfo?.bankName}
                            </>
                          )}
                      </span>
                    </div>
                    )}
                    {/* 1등급 */}
                    {store?.bankInfoAAA && (
                    <div className="flex flex-row items-center gap-1">
                      <div className="w-10 h-5 rounded-full bg-red-500 flex items-center justify-center">
                        <span className="text-xs text-white">1등급</span>
                      </div>
                      <span className="text-sm text-zinc-500">
                          {store?.bankInfoAAA?.accountNumber.length > 5 ? (
                            <>
                              {store?.bankInfoAAA?.accountHolder
                              + " " + store?.bankInfoAAA?.accountNumber.slice(0, 5) + "..."
                              + " " + store?.bankInfoAAA?.bankName}
                            </>
                          ) : (
                            <>
                              {store?.bankInfoAAA?.accountHolder
                              + " " + store?.bankInfoAAA?.accountNumber
                              + " " + store?.bankInfoAAA?.bankName}
                            </>
                          )}
                      </span>
                    </div>
                    )}
                    {/* 2등급 */}
                    {store?.bankInfoBBB && (
                    <div className="flex flex-row items-center gap-1">
                      <div className="w-10 h-5 rounded-full bg-orange-500 flex items-center justify-center">
                        <span className="text-xs text-white">2등급</span>
                      </div>
                      <span className="text-sm text-zinc-500">
                          {store?.bankInfoBBB?.accountNumber.length > 5 ? (
                            <>
                              {store?.bankInfoBBB?.accountHolder
                              + " " + store?.bankInfoBBB?.accountNumber.slice(0, 5) + "..."
                              + " " + store?.bankInfoBBB?.bankName}
                            </>
                          ) : (
                            <>
                              {store?.bankInfoBBB?.accountHolder
                              + " " + store?.bankInfoBBB?.accountNumber
                              + " " + store?.bankInfoBBB?.bankName}
                            </>
                          )}
                      </span>
                    </div>
                    )}
                    {/* 3등급 */}
                    {store?.bankInfoCCC && (
                    <div className="flex flex-row items-center gap-1">
                      <div className="w-10 h-5 rounded-full bg-yellow-500 flex items-center justify-center">
                        <span className="text-xs text-white">3등급</span>
                      </div>
                      <span className="text-sm text-zinc-500">
                          {store?.bankInfoCCC?.accountNumber.length > 5 ? (
                            <>
                              {store?.bankInfoCCC?.accountHolder
                              + " " + store?.bankInfoCCC?.accountNumber.slice(0, 5) + "..."
                              + " " + store?.bankInfoCCC?.bankName}
                            </>
                          ) : (
                            <>
                              {store?.bankInfoCCC?.accountHolder
                              + " " + store?.bankInfoCCC?.accountNumber
                              + " " + store?.bankInfoCCC?.bankName}
                            </>
                          )}
                      </span>
                    </div>
                    )}
                    {/* 4등급 */}
                    {store?.bankInfoDDD && (
                    <div className="flex flex-row items-center gap-1">
                      <div className="w-10 h-5 rounded-full bg-green-500 flex items-center justify-center">
                        <span className="text-xs text-white">4등급</span>
                      </div>
                      <span className="text-sm text-zinc-500">
                          {store?.bankInfoDDD?.accountNumber.length > 5 ? (
                            <>
                              {store?.bankInfoDDD?.accountHolder
                              + " " + store?.bankInfoDDD?.accountNumber.slice(0, 5) + "..."
                              + " " + store?.bankInfoDDD?.bankName}
                            </>
                          ) : (
                            <>
                              {store?.bankInfoDDD?.accountHolder
                              + " " + store?.bankInfoDDD?.accountNumber
                              + " " + store?.bankInfoDDD?.bankName}
                            </>
                          )}
                      </span>
                    </div>
                    )}
                  
                  </div>

                </div>

              </div>

              {/* 판매용 USDT지갑 */}
              {/* storeInfo.walletAddress */}
              <div className="flex flex-col sm:flex-row items-start justify-start gap-1">
                <div className="flex flex-row gap-2 items-center">
                  {/* dot */}
                  <div className="w-1 h-1 rounded-full bg-zinc-500" /> 
                  <span className="text-sm text-zinc-500">
                    P2P 거래소 판매용 USDT지갑
                  </span>
                </div>
                <div className="w-56 flex flex-row items-center justify-start gap-1">
                  <Image
                    src="/icon-shield.png"
                    alt="Shield"
                    width={20}
                    height={20}
                    className="w-5 h-5"
                  />
                  <span className="text-sm text-zinc-500">
                    {
                    store?.sellerWalletAddress
                    && store?.sellerWalletAddress.slice(0, 6) + "..." + store?.sellerWalletAddress.slice(-4)
                    }
                  </span>
                </div>
              </div>

              {/* 자동결제용 USDT지갑 */}
              {/* store.settlementWalletAddress */}
              <div className="flex flex-col sm:flex-row items-start justify-start gap-1">
                <div className="flex flex-row gap-2 items-center">
                  {/* dot */}
                  <div className="w-1 h-1 rounded-full bg-zinc-500" />
                  <span className="text-sm text-zinc-500">
                    가맹점 자동결제용 USDT지갑
                  </span>
                </div>
                <div className="w-56 flex flex-row items-center justify-start gap-1">
                  <Image
                    src="/icon-shield.png"
                    alt="Shield"
                    width={20}
                    height={20}
                    className="w-5 h-5"
                  />
                  <span className="text-sm text-zinc-500">
                    {
                    store?.settlementWalletAddress
                    && store?.settlementWalletAddress.slice(0, 6) + "..." + store?.settlementWalletAddress.slice(-4)
                    }
                  </span>
                </div>
              </div>


              {/*address && (
                  <div className={`
                    ${address === store?.sellerWalletAddress ? 'bg-green-100' : 'bg-white'}
                    p-4 rounded-lg shadow-md
                    flex flex-col items-end
                  `}>

                      <div className="flex flex-row items-center justify-center gap-2">

                          <div className="flex flex-row gap-2 items-center">
                            <div className="w-1 h-1 rounded-full bg-zinc-500" />
                            <span className="text-sm text-zinc-500">
                              나의 USDT지갑
                            </span>
                          </div>

                          <Image
                              src="/icon-shield.png"
                              alt="Wallet"
                              width={100}
                              height={100}
                              className="w-6 h-6"
                          />
                          <button
                              className="text-lg text-zinc-600 underline"
                              onClick={() => {
                                  navigator.clipboard.writeText(address);
                                  toast.success(Copied_Wallet_Address);
                              } }
                          >
                              {address.substring(0, 6)}...{address.substring(address.length - 4)}
                          </button>

                      </div>
                      <div className="flex flex-row items-center justify-center gap-1">
                          <Image
                              src="/icon-tether.png"
                              alt="Tether"
                              width={20}
                              height={20}
                              className="w-5 h-5"
                          />
                          <span className="text-2xl xl:text-4xl font-semibold text-[#409192]"
                              style={{ fontFamily: 'monospace' }}
                          >
                              {Number(balance).toFixed(3).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                          </span>
                      </div>
                      
                      {address === store?.sellerWalletAddress && (
                        <div className="flex flex-row gap-2 items-center">
                          <Image
                            src="/icon-info.png"
                            alt="Information"
                            width={20}
                            height={20}
                            className="w-5 h-5"
                          />
                          <span className="text-sm text-zinc-500">
                            이 지갑은 판매용 지갑입니다.
                          </span>
                        </div>
                      )}

                  </div>
              )}
              */}

            </div>

            <div className="flex flex-col sm:flex-row items-center justify-end gap-2 mt-4">

              {/* 가맹점 보유량 */}
              {version !== 'bangbang' && (
              <div className="flex flex-col sm:flex-row items-start xl:items-center gap-2
                bg-white/50 backdrop-blur-sm p-2 rounded-lg shadow-md">

                  <div className="flex flex-col items-start xl:items-center gap-2 mb-2 xl:mb-0">                
                    <div className="flex flex-row gap-2 items-center">
                      <div className="flex flex-row gap-2 items-center">
                        <Image
                          src="/icon-escrow.png"
                          alt="Escrow"
                          width={20}
                          height={20}
                          className="w-5 h-5"
                        />
                        <span className="text-lg font-semibold text-zinc-500">
                          현재 보유량
                        </span>
                      </div>

                      <div className="
                        w-40
                        flex flex-row gap-2 items-center justify-between
                      ">
                        <Image
                          src="/icon-tether.png"
                          alt="Tether"
                          width={20}
                          height={20}
                          className="w-5 h-5"
                        />
                        <span className="text-lg text-[#409192] font-semibold"
                          style={{ fontFamily: 'monospace' }}
                        >
                          {
                            escrowBalance.toFixed(3).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                          }
                        </span>
                      </div>
                    </div>

                    {/* 오늘 수수료 차감량 */}
                    <div className="flex flex-row gap-2 items-center">
                      <span className="text-sm text-zinc-500 font-semibold">
                        오늘 수수료 차감량
                      </span>
                      <div className="
                        w-40
                        flex flex-row gap-2 items-center justify-between
                      ">
                        <Image
                          src="/icon-tether.png"
                          alt="Tether"
                          width={20}
                          height={20}
                          className="w-5 h-5"
                        />
                        <span className="text-lg text-red-600 font-semibold"
                          style={{ fontFamily: 'monospace' }}
                        >
                          {
                            todayMinusedEscrowAmount && todayMinusedEscrowAmount > 0 ?
                            todayMinusedEscrowAmount.toFixed(3).replace(/\B(?=(\d{3})+(?!\d))/g, ',') :
                            '0.000'
                          }
                        </span>
                      </div>
                    </div>

                  </div>


                {/* 보유량 내역 */}
                <button
                  onClick={() => {
                    router.push('/' + params.lang + '/' + params.center + '/escrow-history');
                  }}
                  className="bg-[#3167b4] text-sm text-[#f3f4f6] px-4 py-2 rounded-lg hover:bg-[#3167b4]/80
                  flex items-center justify-center gap-2
                  border border-zinc-300 hover:border-[#3167b4]"
                >
                  보유량 내역
                </button>

              </div>
              )}







            </div>

          </div>


          <div className="w-full flex flex-row items-center justify-end gap-2">

            {/*
            <div className="flex flex-col gap-2 items-center">
              <div className="text-sm">{Total}</div>
              <div className="text-xl font-semibold text-zinc-500">
                {buyOrders.length} 
              </div>
            </div>
            */}



            {/*}
            <div className="flex flex-col gap-2 items-center">
              <div className="text-sm">
                {Buy_Order_Accept}
              </div>
              <div className="text-xl font-semibold text-white">
                {buyOrders.filter((item) => item.status === 'accepted').length}
              </div>
            </div>
            */}

            {/*}
            <div className="flex flex-col gap-2 items-center">
              <div className="text-sm">거래중</div>
              <div className="text-xl font-semibold text-zinc-500">

                {
                  buyOrders.filter((item) => item.status === 'accepted' || item.status === 'paymentRequested').length

                }

              </div>
            </div>


            <div className="flex flex-col gap-2 items-center">
              <div className="text-sm">전체</div>
              <div className="text-xl font-semibold text-zinc-500">
                {totalCount}
              </div>
            </div>
            */}

          </div>



          <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-5">

            <div className="flex flex-col sm:flex-row items-center gap-2">

              {/* search bar */}
              {/* searchStorecode */}
              {/*
              <div className="flex flex-col sm:flex-row items-center gap-2">
                <input
                  type="text"
                  value={searchStoreName}
                  onChange={(e) => setSearchStoreName(e.target.value)}
                  placeholder="가맹점 이름"
                  className="p-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

                <button
                  onClick={() => {
                    setPageValue(1);
                    fetchBuyOrders();
                  }}
                  //className="bg-[#3167b4] text-sm text-[#f3f4f6] px-4 py-2 rounded-lg hover:bg-[#3167b4]/80"
                  className={
                    `${fetchingBuyOrders ? 'bg-zinc-500' : 'bg-[#3167b4]'}
                    w-32
                    flex flex-row items-center justify-center gap-2
                    text-sm text-[#f3f4f6] px-4 py-2 rounded-lg hover:bg-[#3167b4]/80`
                  }
                >
                  {fetchingBuyOrders ? (
                    <Image
                      src="/loading.png"
                      alt="Loading"
                      width={20}
                      height={20}
                      className="w-5 h-5 animate-spin"
                    />
                  ) : (
                    <Image
                      src="/icon-search.png"
                      alt="Search"
                      width={20}
                      height={20}
                      className="w-5 h-5"
                    />
                  )}
                  <span className="text-sm">
                    {fetchingBuyOrders ? '검색중...' : '검색'}
                  </span>
                  
                </button>

              </div>
              */}








          




              
              <div className="flex flex-row items-center gap-2">

                <div className="flex flex-row items-center gap-2">
                  <input
                    type="checkbox"
                    checked={searchOrderStatusCancelled}
                    onChange={(e) => {
                      setSearchOrderStatusCancelled(e.target.checked);
                      setPageValue(1)
                      //fetchBuyOrders();
                    }}
                    className="w-5 h-5"
                  />
                  <label className="text-sm text-zinc-500">거래취소</label>
                </div>
                <div className="flex flex-row items-center gap-2">
                  <input
                    type="checkbox"
                    checked={searchOrderStatusCompleted}
                    onChange={(e) => {
                      setSearchOrderStatusCompleted(e.target.checked);
                      setPageValue(1);
                      //fetchBuyOrders();
                    }}
                    className="w-5 h-5"
                  />
                  <label className="text-sm text-zinc-500">거래완료</label>
                </div>
              </div>
              
              




            </div>



          </div>

          {/* 통장 */}
          {/*}
          {address && user?.seller?.bankInfo && (
            <div className="flex flex-row items-center gap-2 mt-4">
              <Image
                src="/icon-bank.png"
                alt="Bank"
                width={35}
                height={35}
                className="w-6 h-6"
              />
              <div className="text-sm xl:text-xl font-semibold">
                {user?.seller?.bankInfo.bankName}{' '}
                {user?.seller?.bankInfo.accountNumber}{' '}
                {user?.seller?.bankInfo.accountHolder}
              </div>

              <div className="flex flex-row gap-2 items-center justify-center">
                <Image
                  src="/icon-bank-auto.png"
                  alt="Bank Auto"
                  width={20}
                  height={20}
                  className="animate-spin"
                />
                <span className="text-sm font-semibold text-zinc-500">
                  자동자동입금확인중
                </span>
              </div>

            </div>
          )}
          */}

          {/*}
          {address && !user?.seller?.bankInfo && (
            <div className="flex flex-row items-center gap-2 mt-4">
              <Image
                src="/icon-bank.png"
                alt="Bank"
                width={35}
                height={35}
                className="w-6 h-6"
              />
              <div className="text-sm text-zinc-500 font-semibold">
                입금통장정보가 없습니다. 입금통장정보가 없으면 판매가 불가능합니다.
              </div>
            </div>
          )}
          */}






            <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-3">



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
                    onChange={(e) => setSearchFormDate(e.target.value)}
                    className="w-full p-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3167b4]"
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
                    onChange={(e) => setSearchToDate(e.target.value)}
                    className="w-full p-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3167b4]"
                  />
                </div>

                <div className="flex flex-row items-center gap-2">
                    {/* 오늘, 어제 */}
                    <button
                      onClick={() => {
                        const todayKst = getKstDateString();
                        setSearchFormDate(todayKst);
                        setSearchToDate(todayKst);
                      }}
                      className="text-sm text-zinc-500 underline"
                    >
                      오늘
                    </button>
                    <button
                      onClick={() => {
                        const yesterdayKst = getKstDateString(-1);
                        setSearchFormDate(yesterdayKst);
                        setSearchToDate(yesterdayKst);
                      }}
                      className="text-sm text-zinc-500 underline"
                    >
                      어제
                    </button>
                  </div>


              </div>


              {/* search depositName */}
              <div className="flex flex-col items-center gap-2">


                <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
                  {/* search nickname */}
                  <div className="flex flex-row items-center gap-2">
                    <input
                      type="text"
                      value={searchBuyer}
                      onChange={(e) => setSearchBuyer(e.target.value)}
                      placeholder="회원 아이디"
                      className="w-full p-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3167b4]"
                    />
                  </div>

                  <div className="flex flex-row items-center gap-2">
                    <input
                      type="text"
                      value={searchDepositName}
                      onChange={(e) => setSearchDepositName(e.target.value)}
                      placeholder="입금자명"
                      className="w-full p-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3167b4]"
                    />
                  </div>

                  {/* searchStoreBankAccountNumber */}
                  <div className="flex flex-row items-center gap-2">
                    <input
                      type="text"
                      value={searchStoreBankAccountNumber}
                      onChange={(e) => setSearchStoreBankAccountNumber(e.target.value)}
                      placeholder="구매자 통장번호"
                      className="w-full p-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3167b4]"
                    /> 
                  </div>



                


                  {/* 검색 버튼 */}
                  <div className="
                    w-28  
                    flex flex-row items-center gap-2">
                    <button
                      onClick={() => {
                        router.push(buildBuyorderQuery({ page: 1 }));
                      }}
                      //className="bg-[#3167b4] text-white px-4 py-2 rounded-lg w-full"
                      className={`${
                        fetchingBuyOrders ? 'bg-gray-400' : 'bg-[#3167b4]'
                      }
                      text-white px-4 py-2 rounded-lg w-full
                      hover:bg-[#3167b4]/80
                      hover:cursor-pointer
                      hover:scale-105
                      transition-transform duration-200 ease-in-out`}
                      title="검색"

                      disabled={fetchingBuyOrders}
                    >
                      <div className="flex flex-row items-center justify-between gap-2">
                        <Image
                          src="/icon-search.png"
                          alt="Search"
                          width={20}
                          height={20}
                          className="rounded-lg w-5 h-5"
                        />
                        <span className="text-sm">
                          {fetchingBuyOrders ? '검색중...' : '검색'}
                        </span>
                      </div>

                    </button>
                  </div>

                </div>



              </div>






            </div>





          {/* trade summary */}

          <div className="w-full grid grid-cols-1 lg:grid-cols-[0.9fr_1.1fr] gap-4">
            {/* P2P Summary */}
            <div className="flex items-stretch gap-4 rounded-2xl border border-zinc-200 bg-white px-5 py-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-zinc-900 text-white flex items-center justify-center shadow-inner">
                  <Image src="/icon-trade.png" alt="P2P" width={32} height={32} className="w-8 h-8 object-contain invert" />
                </div>
                <div className="flex flex-col justify-center">
                  <span className="text-[11px] text-zinc-600">P2P 거래수(건)</span>
                  <span className="text-xl font-semibold text-zinc-700">
                    {animatedTotalCount.toLocaleString()}
                  </span>
                </div>
              </div>
              <div className="mx-3 hidden md:block w-px bg-gradient-to-b from-transparent via-zinc-200 to-transparent" />
              <div className="flex flex-col justify-center items-end flex-1">
                <span className="text-xl font-bold text-emerald-600 flex items-center gap-2 leading-tight" style={{ fontFamily: 'monospace' }}>
                  <Image src="/icon-tether.png" alt="USDT" width={24} height={24} className="w-6 h-6" />
                  {animatedTotalUsdtAmount ? animatedTotalUsdtAmount.toFixed(3).replace(/\B(?=(\d{3})+(?!\d))/g, ',') : '0.000'}
                </span>
                <span className="text-xl font-bold text-amber-600 leading-tight" style={{ fontFamily: 'monospace' }}>
                  {animatedTotalKrwAmount.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Settlement Summary */}
            <div className="flex items-stretch gap-4 rounded-2xl border border-zinc-200 bg-white px-5 py-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-sky-100 text-sky-700 flex items-center justify-center shadow-inner">
                  <Image src="/icon-payment2.png" alt="Settlement" width={28} height={28} className="w-7 h-7 object-contain" />
                </div>
                <div className="flex flex-col justify-center">
                  <span className="text-[11px] text-zinc-600">가맹점 결제수(건)</span>
                  <span className="text-xl font-semibold text-zinc-700">
                    {animatedTotalSettlementCount.toLocaleString()}
                  </span>
                </div>
              </div>
              <div className="flex flex-col md:flex-row md:items-center md:justify-end flex-1 gap-2 md:gap-4">
                <div className="flex flex-col items-end">
                  <span className="text-xl font-bold text-emerald-600 flex items-center gap-2 leading-tight" style={{ fontFamily: 'monospace' }}>
                    <Image src="/icon-tether.png" alt="USDT" width={24} height={24} className="w-6 h-6" />
                    {animatedTotalSettlementAmount ? animatedTotalSettlementAmount.toFixed(3).replace(/\B(?=(\d{3})+(?!\d))/g, ',') : '0.000'}
                  </span>
                  <span className="text-xl font-bold text-amber-600 leading-tight" style={{ fontFamily: 'monospace' }}>
                    {animatedTotalSettlementAmountKRW.toLocaleString()}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full md:w-auto text-sm font-semibold text-zinc-700 md:mt-0 mt-1">
                  <div className="flex flex-col gap-1 items-end md:items-start">
                    <div className="flex items-center gap-2">
                      <span className="text-zinc-500">PG 수수료</span>
                      <span className="text-emerald-600 text-base" style={{ fontFamily: 'monospace' }}>
                        {buyOrderStats.totalFeeAmount?.toFixed(3) || '0.000'} USDT
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-amber-600 text-base" style={{ fontFamily: 'monospace' }}>
                        {buyOrderStats.totalFeeAmountKRW !== undefined
                          ? Math.round(buyOrderStats.totalFeeAmountKRW).toLocaleString()
                          : '0'} 원
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 items-end md:items-start">
                    <div className="flex items-center gap-2">
                      <span className="text-zinc-500">AG 수수료</span>
                      <span className="text-emerald-600 text-base" style={{ fontFamily: 'monospace' }}>
                        {buyOrderStats.totalAgentFeeAmount?.toFixed(3) || '0.000'} USDT
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-amber-600 text-base" style={{ fontFamily: 'monospace' }}>
                        {buyOrderStats.totalAgentFeeAmountKRW !== undefined
                          ? Math.round(buyOrderStats.totalAgentFeeAmountKRW).toLocaleString()
                          : '0'} 원
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* for mobile */}
          {/*
          <div className="sm:hidden w-full flex flex-row items-center justify-end gap-2 mt-2">

            <div className="flex flex-row items-center justify-center gap-2
            bg-white/80
            p-2 rounded-lg shadow-md
            backdrop-blur-md
            ">
              {loadingTotalNumberOfBuyOrders ? (
                <Image
                  src="/loading.png"
                  alt="Loading"
                  width={20}
                  height={20}
                  className="w-6 h-6 animate-spin"
                />
              ) : (
                <Image
                  src="/icon-buyorder.png"
                  alt="Buy Order"
                  width={35}
                  height={35}
                  className="w-6 h-6"
                />
              )}


              <p className="text-lg text-red-500 font-semibold">
                {
                totalNumberOfBuyOrders
                }
              </p>

              {totalNumberOfBuyOrders > 0 && (
                <div className="flex flex-row items-center justify-center gap-2">
                  <Image
                    src="/icon-notification.gif"
                    alt="Notification"
                    width={50}
                    height={50}
                    className="w-15 h-15 object-cover"
                    
                  />
                </div>
              )}
            </div>



            {version !== 'bangbang' && (
            <div className="flex flex-row items-center justify-center gap-2
            bg-white/80
            p-2 rounded-lg shadow-md
            backdrop-blur-md
            ">
              <button
                className={`
                  ${paymentRequestedCount > 0 ? 'bg-red-500 text-white' : 'bg-gray-300 text-gray-500'}
                  text-sm px-4 py-2 rounded-lg hover:bg-red-600
                `}
                onClick={() => {
                  router.push('/' + params.lang + '/' + params.center + '/clearance-history');
                }}
              >
                판매(거래소)
              </button>
              {loadingPaymentRequestedCount ? (
                <Image
                  src="/loading.png"
                  alt="Loading"
                  width={20}
                  height={20}
                  className="w-6 h-6 animate-spin"
                />
              ) : (
                <Image
                  src="/icon-buyorder.png"
                  alt="Buy Order"
                  width={35}
                  height={35}
                  className="w-6 h-6"
                />
              )}


              <p className="text-lg text-red-500 font-semibold">
                {
                  paymentRequestedCount > 0 ? (
                    <span>{paymentRequestedCount.toLocaleString()}</span>
                  ) : (
                    <span>0</span>
                  )}
              </p>

              {paymentRequestedCount > 0 && (
                <div className="flex flex-row items-center justify-center gap-2">
                  <Image
                    src="/icon-notification.gif"
                    alt="Notification"
                    width={50}
                    height={50}
                    className="w-15 h-15 object-cover"
                  />
                </div>
              )}
            </div>
            )}

          </div>
          */}


          {/* buyOrderStats.totalBySellerBankAccountNumber */}
          {/*
          <div className="w-full
            grid grid-cols-1 sm:grid-cols-8 gap-4">
          */}

          {/* 미신청입금 내역 */}
          <div className="w-full mt-6">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <button
                className="px-2 py-1 text-xs border border-zinc-300 rounded-md text-zinc-600 hover:bg-zinc-100 transition"
                onClick={() => setShowUnmatched((v) => !v)}
              >
                {showUnmatched ? '접기' : '펼치기'}
              </button>
              <span className="text-lg font-semibold">미신청입금 내역</span>
              <span className="text-xs text-zinc-500">
                건수 {unmatchedTransfers.length.toLocaleString()}
              </span>
              <span className="text-xs text-zinc-500">
                합계 {unmatchedTotalAmount.toLocaleString()}원
              </span>
              <button
                className="px-2 py-1 text-xs border border-zinc-300 rounded-md text-zinc-600 hover:bg-zinc-100 disabled:opacity-50"
                onClick={fetchUnmatchedTransfers}
                disabled={unmatchedLoading}
              >
                {unmatchedLoading ? '갱신중...' : '새로고침'}
              </button>
            </div>

            {showUnmatched && (
            <div className="w-full overflow-x-auto">
              {unmatchedTransfers.length === 0 ? (
                <div className="min-h-[80px] flex items-center justify-center text-sm text-zinc-500 border border-neutral-200 rounded-xl bg-white px-4">
                  {unmatchedLoading ? '불러오는 중...' : '미신청 입금이 없습니다.'}
                </div>
              ) : (
                <div
                  className="flex gap-2 pb-2 overflow-x-auto"
                  ref={unmatchedScrollRef}
                >
                  {(() => {
                    const timestamps = unmatchedTransfers
                      .map((t) => {
                        const d = new Date(t.transactionDateUtc || t.processingDate || t.regDate);
                        return Number.isNaN(d.getTime()) ? null : d.getTime();
                      })
                      .filter((v) => v !== null) as number[];
                    const oldest = timestamps.length ? Math.min(...timestamps) : null;
                    const newest = timestamps.length ? Math.max(...timestamps) : null;
                    return unmatchedTransfers.map((transfer, index) => {
                      const ts = new Date(transfer.transactionDateUtc || transfer.processingDate || transfer.regDate).getTime();
                      const ratio = (oldest !== null && newest !== null && newest !== oldest)
                        ? 1 - Math.max(0, Math.min(1, (ts - oldest) / (newest - oldest)))
                        : 0.5;
                      const bg = `rgba(248,113,113, ${0.15 + 0.35 * ratio})`;
                      const border = `rgba(248,113,113, ${0.25 + 0.4 * ratio})`;
                      return (
                    <div
                      key={transfer._id || index}
                      className="min-w-[220px] max-w-[240px] p-3 border rounded-lg shadow-sm flex flex-col gap-1.5"
                      style={{ backgroundColor: bg, borderColor: border, boxShadow: `0 6px 12px rgba(248,113,113,0.12)` }}
                    >
                      <div className="flex items-center justify-between text-[11px] text-zinc-500">
                        <span className="font-semibold text-zinc-600">No.{unmatchedTransfers.length - index}</span>
                        <span className="px-2 py-[2px] text-[10px] font-semibold rounded-full bg-white/70 text-rose-600 border border-rose-100">
                          {formatTimeAgo(transfer.transactionDateUtc || transfer.processingDate || transfer.regDate)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-sm font-semibold text-zinc-800 truncate">
                            {transfer.storeInfo?.storeName || '미지정 가맹점'}
                          </span>
                          <span className="text-sm font-semibold text-zinc-700 truncate">
                            {transfer.transactionName || '-'}
                          </span>
                        </div>
                        <span className="text-base font-extrabold text-emerald-700" style={{ fontFamily: 'monospace' }}>
                          {(Number(transfer.amount) || 0).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex flex-col text-[11px] text-zinc-700 gap-[2px]">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-mono text-sm text-zinc-800 truncate">
                            {transfer.bankAccountNumber || '-'}
                          </span>
                          <span className="text-[10px] text-zinc-500 truncate">
                            {(transfer.storeInfo?.bankInfo?.bankName
                              || transfer.storeInfo?.bankInfoAAA?.bankName
                              || transfer.storeInfo?.bankInfoBBB?.bankName
                              || transfer.storeInfo?.bankInfoCCC?.bankName
                              || transfer.storeInfo?.bankInfoDDD?.bankName
                              || '은행정보없음')}
                            {' · '}
                            {(transfer.storeInfo?.bankInfo?.accountHolder
                              || transfer.storeInfo?.bankInfoAAA?.accountHolder
                              || transfer.storeInfo?.bankInfoBBB?.accountHolder
                              || transfer.storeInfo?.bankInfoCCC?.accountHolder
                              || transfer.storeInfo?.bankInfoDDD?.accountHolder
                              || '예금주없음')}
                          </span>
                        </div>
                      </div>
                    </div>
                      );
                    });
                  })()}
                </div>
              )}
            </div>
            )}
          </div>


          <div className="w-full flex flex-col items-center justify-center">
            <div className="w-full max-w-6xl flex items-center justify-center mb-2 gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <button
                  className="px-2 py-1 text-xs border border-zinc-300 rounded-md text-zinc-600 hover:bg-zinc-100 transition"
                  onClick={() => setShowSellerBankStats((v) => !v)}
                >
                  {showSellerBankStats ? '접기' : '펼치기'}
                </button>
                <span className="text-lg font-semibold">
                  판매자 통장별 P2P 거래 통계
                </span>
              </div>
              <span className="text-xs text-zinc-500">
                총 {buyOrderStats.totalBySellerBankAccountNumber?.length || 0} 계좌
              </span>
            </div>

            {showSellerBankStats && (
            <div className="w-full max-w-6xl mx-auto
              grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-4
              items-start justify-center">

            {/*
            {buyOrderStats.totalBySellerBankAccountNumber?.map((item, index) => (
              <div key={index} className="flex flex-col gap-2 items-end justify-center
                border border-zinc-300 rounded-lg p-4
                bg-zinc-50 shadow-md
                ">

                <div className="flex flex-row items-center justify-center gap-1">
                  <Image
                    src="/icon-bank.png"
                    alt="Bank"
                    width={20}
                    height={20}
                    className="w-5 h-5"
                  />
                  <button
                    className="text-sm font-semibold underline text-blue-600"
                          onClick={() => fetchDepositsByAccount(
                            item.bankUserInfo?.[0]?.realAccountNumber
                            || item.bankUserInfo?.[0]?.accountNumber
                            || item._id
                            || '기타은행',
                            {
                              bankName: item.bankUserInfo?.[0]?.bankName,
                              accountHolder: item.bankUserInfo?.[0]?.accountHolder,
                              aliasAccountNumber: item._id || ''
                            }
                          )}
                    title="별칭 계좌 이력 보기"
                  >
                    {item._id || '기타은행'}
                  </button>
                </div>

                <div className="flex flex-row items-center justify-center gap-2">

                  <div className="text-sm font-semibold">
                    {item.totalCount?.toLocaleString() || '0'}
                  </div>

                  <div className="flex flex-col gap-1 items-end justify-center">
                    <div className="flex flex-row items-center justify-center gap-1">
                      <Image
                        src="/icon-tether.png"
                        alt="Tether"
                        width={20}
                        height={20}
                        className="w-5 h-5"
                      />
                      <span className="text-sm font-semibold text-green-600"
                        style={{ fontFamily: 'monospace' }}>
                        {item.totalUsdtAmount
                          ? item.totalUsdtAmount.toFixed(3).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                          : '0.000'}
                      </span>
                    </div>
                    <div className="flex flex-row items-center justify-center gap-1">
                      <span className="text-sm font-semibold text-yellow-600"
                        style={{ fontFamily: 'monospace' }}>
                        {item.totalKrwAmount?.toLocaleString() || '0'}
                      </span>
                    </div>
                  </div>
                </div>

              </div>
            ))}
            */}



            {buyOrderStats.totalBySellerBankAccountNumber?.map((item, index) => (
              <div
                key={index}
                className={`flex flex-col gap-2 items-start border border-zinc-200 rounded-lg p-3 bg-white shadow-sm transition ${balanceFlashSet.has(index) ? 'balance-flash' : ''}`}
              >
                <div className="w-full flex items-center gap-2 text-sm text-zinc-800">
                  <Image src="/icon-bank.png" alt="Bank" width={18} height={18} className="w-4.5 h-4.5" />
                  <button
                    className="font-semibold underline text-blue-600 truncate"
                    onClick={() => {
                      const accountNumber = item._id || '기타은행';
                      navigator.clipboard.writeText(accountNumber)
                        .then(() => toast.success(`통장번호 ${accountNumber} 복사됨`))
                        .catch((err) => toast.error('복사 실패: ' + err));
                    }}
                    title="통장번호 복사"
                  >
                    {item._id || '기타은행'}
                  </button>
                  <span className="text-xs text-zinc-500 truncate">
                    {item.bankUserInfo?.[0]?.bankName || '은행명 없음'}
                  </span>
                  {item.bankUserInfo?.[0]?.accountHolder && (
                    <span className="text-xs font-semibold text-zinc-500">
                      {item.bankUserInfo[0].accountHolder}
                    </span>
                  )}
                </div>

                <div className="w-full flex items-center justify-between gap-2">
                  <span className="text-xs text-zinc-500 whitespace-nowrap">사용계좌</span>
                  <div className="flex flex-col items-end min-w-0">
                    <span className="text-base font-semibold text-zinc-800 truncate text-right" style={{ fontFamily: 'monospace' }}>
                      {item.bankUserInfo[0]?.defaultAccountNumber || '기본통장정보없음'}
                    </span>
                  </div>
                </div>

                <div className="w-full flex items-center justify-between">
                  <span className="text-xs text-zinc-500">잔액(원)</span>
                  <span className={`text-lg font-semibold text-amber-600 ${balanceFlashSet.has(index) ? 'balance-flash-target' : ''}`} style={{ fontFamily: 'monospace' }}>
                    {lastestBalanceArray && lastestBalanceArray[index] !== undefined
                      ? lastestBalanceArray[index].toLocaleString()
                      : '잔액정보없음'}
                  </span>
                </div>

                <div className="w-full flex items-center justify-between">
                  <span className="text-xs font-semibold text-zinc-500">
                    거래 {item.totalCount?.toLocaleString() || '0'}건
                  </span>
                  <span className="text-sm font-semibold text-emerald-700" style={{ fontFamily: 'monospace' }}>
                    {sellerBankAccountDisplayValueArray && sellerBankAccountDisplayValueArray[index] !== undefined
                      ? sellerBankAccountDisplayValueArray[index].toLocaleString()
                      : '0'}
                  </span>
                </div>

                <button
                  className="w-full text-xs px-3 py-2 border border-zinc-200 rounded-md text-zinc-600 hover:bg-zinc-50 transition text-center"
                  onClick={() => fetchDepositsByAccount(
                    item.bankUserInfo?.[0]?.realAccountNumber
                    || item.bankUserInfo?.[0]?.accountNumber
                    || item._id
                    || '기타은행',
                    {
                      bankName: item.bankUserInfo?.[0]?.bankName,
                      accountHolder: item.bankUserInfo?.[0]?.accountHolder,
                      aliasAccountNumber: item.bankUserInfo?.[0]?.defaultAccountNumber || item._id || '',
                      defaultAccountNumber: item.bankUserInfo?.[0]?.defaultAccountNumber || item._id || '',
                      realAccountNumber: item.bankUserInfo?.[0]?.realAccountNumber || item.bankUserInfo?.[0]?.accountNumber || item._id || ''
                    }
                  )}
                >
                  입금내역 보기
                </button>
              </div>
            ))}


          </div>
          )}
        </div>



          {/* table view is horizontal scroll */}
          {tableView ? (


            <div className="w-full overflow-x-auto">

              <table className="w-full table-auto border-collapse border border-neutral-200 rounded-xl shadow-sm bg-white">

                <thead className="bg-neutral-900 text-white text-sm font-semibold">
                  <tr>

                    <th className="p-2">
                      <div className="flex flex-col items-start justify-center gap-2">
                        <span>P2P 거래번호</span>
                        <span>거래일시</span>
                      </div>
                    </th>

                    <th className="p-2">
                      <div className="flex flex-col items-start justify-center gap-2">
                        <span>P2P 구매자 아이디</span>
                        <span>USDT지갑</span>
                        <span>입금자</span>
                      </div>
                    </th>
                    
                    <th className="p-2">
                      <div className="flex flex-col items-end justify-center gap-2">
                        <span>구매량(USDT)</span>
                        <span>구매금액(원)</span>
                        <span>개당금액(원)</span>
                      </div>
                    </th>

                    {/*
                    <th className="p-2">{Payment_Amount}</th>
                    */}

                    <th className="p-2">
                      <div className="flex flex-col items-start justify-center gap-2">

                        <span className="text-sm text-zinc-50 font-semibold">
                          P2P 판매자 아이디
                        </span>
                        <span className="text-sm text-zinc-50 font-semibold">
                          USDT지갑
                        </span>
                        <div className="flex flex-row items-center justify-center gap-2">
                          <span>자동매칭</span>
                          <Image
                            src="/icon-matching.png"
                            alt="Auto Matching"
                            width={20}
                            height={20}
                            className={`
                              ${buyOrders.filter((item) => item.status === 'ordered').length > 0 ? 'animate-spin' : ''}
                              w-5 h-5
                            `}
                          />

                          {/* the count of status is ordered */}
                          <span className="text-sm text-zinc-50 font-semibold">
                            {
                              buyOrders.filter((item) => item.status === 'ordered').length
                            }
                          </span>

                          <span className="text-sm text-zinc-50 font-semibold">
                            거래상태
                          </span>
                        </div>


                      </div>
                    </th>



                    <th className="p-2">
                      <div className="flex flex-col items-center justify-center gap-2">

                        <div className="flex flex-row items-center justify-center gap-2">
                          <span>
                            자동입금확인
                          </span>
                          <Image
                            src="/icon-bank-auto.png"
                            alt="Bank Auto"
                            width={20}
                            height={20}
                            className={`
                              ${buyOrders.filter((item) => item.status === 'paymentRequested').length > 0 ? 'animate-spin' : ''}
                            w-5 h-5`}
                          />
                          <span className="text-sm text-zinc-50 font-semibold">
                            {
                              buyOrders.filter((item) => item.status === 'paymentRequested').length
                            }
                          </span>

                        </div>

                      </div>

                    </th>


                    <th className="p-2">
                      <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
                        <span>
                          P2P 거래취소
                        </span>
                        <span>
                          P2P 거래완료
                        </span>
                      </div>
                    </th>

                    <th className="
                      p-2">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <div className="flex flex-row items-center justify-center gap-2">
                          {/* storeLogo */}
                          <Image
                            src={store?.storeLogo || "/icon-store.png"}
                            alt="Store"
                            width={30}
                            height={30}
                            className="rounded-lg w-8 h-8 object-cover"
                          />
                          <span>
                            가맹점 자동결제 및 정산(USDT)
                          </span>
                          <Image
                            src="/icon-settlement.png"
                            alt="Settlement"
                            width={20}
                            height={20}
                            className={`
                              ${buyOrders.filter((item) => item.status === 'paymentConfirmed'
                              && item?.settlement?.status !== "paymentSettled").length > 0 ? 'animate-spin' : ''}
                              w-5 h-5
                            `}
                          />

                          <span className="text-sm text-zinc-50 font-semibold">
                            {
                              buyOrders.filter((item) => item.status === 'paymentConfirmed'
                              && item?.settlement?.status !== "paymentSettled").length
                            }
                          </span>

                        </div>


                      </div>

                    </th>
                    

                  </tr>
                </thead>

                {/* if my trading, then tr has differenc color */}
                <tbody>

                  {buyOrders.map((item, index) => (

                    
                    <tr key={index} className={`
                      ${index % 2 === 0 ? 'bg-white' : 'bg-neutral-50'}
                      border-b border-neutral-200
                    `}>
                    

                      <td className="
                        p-2
                      "
                      >

                        <div
                          className="
                            w-32  
                            flex flex-col sm:flex-row items-start justify-start gap-2
                            bg-zinc-100
                            rounded-lg
                            border border-zinc-800
                            hover:bg-zinc-200
                            cursor-pointer
                            transition-all duration-200 ease-in-out
                            hover:scale-105
                            hover:shadow-lg
                            hover:shadow-zinc-500/50
                            hover:cursor-pointer
                            p-2
                          "
                          onClick={() => {
                            navigator.clipboard.writeText(item.tradeId);
                            toast.success("거래번호가 복사되었습니다.");
                          }}
                        >




                          <div className=" flex flex-col gap-2 items-center justify-start">
                            {/*
                            <div className="flex flex-row items-center justify-start gap-2">
                              <Image
                                src={item?.store?.storeLogo || "/icon-store.png"}
                                alt="Avatar"
                                width={35}
                                height={35}
                                className="rounded-full w-8 h-8"
                              />
                              
                              <div className="flex flex-col items-start justify-start">
                                <span className="text-sm text-zinc-500 font-semibold">
                                  {
                                    item?.store?.storeName
                                  }
                                </span>
                                <span className="text-sm text-zinc-500 font-semibold">
                                  {
                                    item?.agentName || item?.agentcode
                                  }
                                </span>
                              </div>
                            </div>
                            */}

                            <div className="flex flex-row items-start justify-start gap-1">
                              <Image
                                src="/icon-trade.png"
                                alt="Trade Icon"
                                width={20}
                                height={20}
                                className={`w-5 h-5 ${item?.status === 'cancelled' ||
                                  (item?.status === 'paymentConfirmed' && item?.transactionHash !== '0x') ||
                                  item?.settlement
                                  ? '' : 'animate-spin'}`}
                              />
                              <span className="text-sm text-zinc-500 font-semibold">
                              {
                                "#" + item.tradeId
                              }
                              </span>
                            </div>

                            <div className="flex flex-col items-center justify-center gap-1">
                              <span className="text-sm text-zinc-500">
                                {new Date(item.createdAt).toLocaleString('ko-KR', {
                                  year: 'numeric',
                                  month: '2-digit',
                                  day: '2-digit',
                                })}
                              </span>
                              <span className="text-sm text-zinc-500 font-semibold">
                                {new Date(item.createdAt).toLocaleString('ko-KR', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  second: '2-digit',
                                })}
                              </span>
                            </div>

                            <span className="text-sm text-zinc-500 font-semibold">
                              {params.lang === 'ko' ? (
                                <p>{
                                  new Date().getTime() - new Date(item.createdAt).getTime() < 1000 * 60 ? (
                                    ' ' + Math.floor((new Date().getTime() - new Date(item.createdAt).getTime()) / 1000) + ' ' + seconds_ago
                                  ) :
                                  new Date().getTime() - new Date(item.createdAt).getTime() < 1000 * 60 * 60 ? (
                                  ' ' + Math.floor((new Date().getTime() - new Date(item.createdAt).getTime()) / 1000 / 60) + ' ' + minutes_ago
                                  ) : (
                                    ' ' + Math.floor((new Date().getTime() - new Date(item.createdAt).getTime()) / 1000 / 60 / 60) + ' ' + hours_ago
                                  )
                                }</p>
                              ) : (
                                <p>{
                                  new Date().getTime() - new Date(item.createdAt).getTime() < 1000 * 60 ? (
                                    ' ' + Math.floor((new Date().getTime() - new Date(item.createdAt).getTime()) / 1000) + ' ' + seconds_ago
                                  ) :
                                  new Date().getTime() - new Date(item.createdAt).getTime() < 1000 * 60 * 60 ? (
                                  ' ' + Math.floor((new Date().getTime() - new Date(item.createdAt).getTime()) / 1000 / 60) + ' ' + minutes_ago
                                  ) : (
                                    ' ' + Math.floor((new Date().getTime() - new Date(item.createdAt).getTime()) / 1000 / 60 / 60) + ' ' + hours_ago
                                  )
                                }</p>
                              )}
                            </span>

                          </div>

                        </div>

                      </td>
                      
                      <td className="p-2">
                        <div className="
                          w-38
                          flex flex-col items-start justify-start gap-2">
                          {/*
                          <Image
                            src={item.avatar || "/profile-default.png"}
                            alt="Avatar"
                            width={20}
                            height={20}
                            priority={true} // Added priority property
                            className="rounded-full"
                            style={{
                                objectFit: 'cover',
                                width: '20px',
                                height: '20px',
                            }}
                          />
                          */}
                          
                          <div className="w-full flex flex-col gap-2 items-start justify-start">

                            <div className="flex flex-row items-center gap-1">     
                              <Image
                                src={item?.buyer?.avatar || "/icon-user.png"}
                                alt="Avatar"
                                width={20}
                                height={20}
                                className="rounded-sm w-5 h-5"
                              />                         
                              {
                              item?.userType === 'AAA'
                              ? (<div className="
                                    text-xs text-white bg-red-500 px-1 rounded-md
                                    ">
                                    1등급
                                  </div>
                              )
                              : item?.userType === 'BBB'
                              ? (<div className="
                                    text-xs text-white bg-orange-500 px-1 rounded-md
                                    ">
                                    2등급
                                  </div>
                              )
                              : item?.userType === 'CCC'
                              ? (<div className="
                                    text-xs text-white bg-yellow-500 px-1 rounded-md
                                    ">
                                    3등급
                                  </div>
                              )
                              : item?.userType === 'DDD'
                              ? (<div className="
                                    text-xs text-white bg-green-500 px-1 rounded-md
                                    ">
                                    4등급
                                  </div>
                              )
                              : (<div className="
                                    text-xs text-white bg-zinc-500 px-1 rounded-md
                                    ">
                                    일반
                                  </div>
                              )
                              }
                              <span className="text-sm text-zinc-500 font-semibold">
                                {
                                  item?.nickname?.length > 8 ?
                                  item?.nickname?.substring(0, 8) + '...' :
                                  item?.nickname
                                }
                              </span>

                            </div>


                            {/* wallet address */}
                            <div className="flex flex-row items-center gap-1">
                              <Image
                                src="/icon-shield.png"
                                alt="Shield"
                                width={20}
                                height={20}
                                className="rounded-sm w-5 h-5"
                              />
                              <button
                                className="text-sm text-blue-600 font-semibold
                                underline
                                "
                                onClick={() => {
                                  navigator.clipboard.writeText(item.walletAddress);
                                  toast.success(Copied_Wallet_Address);
                                }}
                              >
                                {item.walletAddress.substring(0, 6)}...{item.walletAddress.substring(item.walletAddress.length - 4)}
                              </button>
                            </div>


                            {/* buyer info */}

                            <div className="flex flex-row items-center justify-start gap-1">
                              <Image
                                src="/icon-bank.png"
                                alt="Bank"
                                width={20}
                                height={20}
                                className="rounded-sm w-5 h-5"
                              />

                              <div className="flex flex-row items-center justify-start gap-1">
                                <span className="text-lg text-gray-800 font-bold">
                                  {
                                    item?.buyer?.depositName
                                  }
                                </span>
                                <span className="
                                  hidden sm:flex
                                  text-sm text-zinc-500">
                                  {
                                    item?.buyer?.depositBankName
                                  }
                                </span>
                                <span className="
                                  text-sm text-zinc-500">
                                  {
                                    item?.buyer?.depositBanktAccountNumber &&
                                    item?.buyer?.depositBanktAccountNumber.substring(0, 3) + '...'
                                  }
                                </span>
                              </div>

                            </div>

                          </div>


                          {item?.userStats?.totalPaymentConfirmedCount ? (
                            
                            <div className="w-full flex flex-row items-center justify-between gap-1">

                              <Image
                                src="/icon-user-stats.png"
                                alt="User Stats"
                                width={20}
                                height={20}
                                className="w-5 h-5"
                              />

                              <div className="w-full flex flex-row items-center justify-between gap-2">
                                <span className="text-sm text-zinc-500">
                                  {
                                    item?.userStats?.totalPaymentConfirmedCount
                                    ? item?.userStats?.totalPaymentConfirmedCount.toLocaleString() :
                                    0
                                  }
                                </span>

                                <div className="flex flex-col items-end justify-center gap-1">
                                  <div className="flex flex-row items-center justify-center gap-1">
                                    <Image
                                      src="/icon-tether.png"
                                      alt="Tether"
                                      width={20}
                                      height={20}
                                      className="w-3 h-3"
                                    />
                                    <span className="text-sm text-[#409192]">
                                      {
                                        item?.userStats?.totalPaymentConfirmedUsdtAmount &&
                                        Number(item?.userStats?.totalPaymentConfirmedUsdtAmount).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                                      }
                                    </span>
                                  </div>
                                  <span className="text-sm text-yellow-600">
                                    {
                                      item?.userStats?.totalPaymentConfirmedKrwAmount &&
                                      Number(item?.userStats?.totalPaymentConfirmedKrwAmount).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                                    }
                                  </span>
                                </div>
                              </div>

                            </div>

                          ) : (

                            <div className="flex flex-row items-center justify-center gap-1">
                              <Image
                                src="/icon-new-user.png"
                                alt="New User"
                                width={50}
                                height={50}
                                className="w-10 h-10"
                              />
                            </div>

                          )}



                        </div>

                      </td>


                      <td className="p-2">
                        <div className="
                          w-28
                          flex flex-col gap-2 items-end justify-start">

                          <div className="flex flex-row items-center justify-end gap-2">
                            <Image
                              src="/icon-tether.png"
                              alt="Tether"
                              width={20}
                              height={20}
                              className="w-5 h-5"
                            />
                            <span className="text-lg text-[#409192] font-semibold"
                              style={{
                                fontFamily: 'monospace',
                              }}
                            >
                              {item.usdtAmount
                                && item.usdtAmount.toFixed(3)
                                .replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                            </span>
                          </div>

                          <div className="flex flex-row items-center justify-end gap-1">
                            <span className="text-lg text-yellow-600 font-semibold"
                              style={{
                                fontFamily: 'monospace',
                              }}
                            >
                              {Number(item.krwAmount).toFixed(0)
                                .replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                            </span>
                          </div>

                          <span className="text-sm text-zinc-500"
                            style={{
                              fontFamily: 'monospace',
                            }}
                          >
                            {
                              Number(item.rate).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                              //Number(item.krwAmount / item.usdtAmount).toFixed(3)
                            }
                          </span>




                        {/* paymentMethod */}
                        <div className="flex flex-col items-end justify-end gap-2">
                          
                          <div className="flex flex-row items-center justify-center gap-2">
                            <span className="text-sm text-zinc-500">
                              결제방법
                            </span>
                            <span className="text-sm text-zinc-500">
                              {item.paymentMethod === 'bank' ? '은행'
                              : item.paymentMethod === 'card' ? '카드'
                              : item.paymentMethod === 'pg' ? 'PG'
                              : item.paymentMethod === 'cash' ? '현금'
                              : item.paymentMethod === 'crypto' ? '암호화폐'
                              : item.paymentMethod === 'giftcard' ? '기프트카드'
                              : item.paymentMethod === 'mkrw' ? 'MKRW' : '기타'
                              }
                            </span>
                          </div>

                          {item.paymentMethod === 'mkrw' && item?.escrowWallet?.address && (
                            <div className="flex flex-col items-end justify-center gap-2">

                              <div className="flex flex-row items-center justify-center gap-1">
                                <Image
                                  src="/icon-shield.png"
                                  alt="Escrow Wallet"
                                  width={20}
                                  height={20}
                                  className="w-5 h-5"
                                />
                                <button
                                  className="text-sm text-blue-600 font-semibold underline"
                                  onClick={() => {
                                    navigator.clipboard.writeText(item?.escrowWallet.address);
                                    toast.success(Copied_Wallet_Address);
                                  }}
                                >
                                    {item?.escrowWallet.address.substring(0, 6)}...{item?.escrowWallet.address.substring(item?.escrowWallet.address.length - 4)}
                                </button>
                              </div>

                              {/* balance */}
                              {item?.escrowWallet?.balance ? (
                                <div className="flex flex-row items-center justify-center gap-1">
                                  <Image
                                    src="/token-mkrw-icon.png"
                                    alt="MKRW Token"
                                    width={20}
                                    height={20}
                                    className="w-5 h-5"
                                  />
                                  <span className="text-lg text-yellow-600 font-semibold"
                                    style={{
                                      fontFamily: 'monospace',
                                    }}
                                  >
                                    {
                                      item?.escrowWallet?.balance.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                                    }
                                  </span>
                                </div>

                              ) : (
                                <div className="flex flex-row items-center justify-center gap-1">
                                  <Image
                                    src="/loading.png"
                                    alt="Loading"
                                    width={20}
                                    height={20}
                                    className="w-5 h-5 animate-spin"
                                  />
                                  <span className="text-sm text-zinc-500">
                                    에스크로 진행중...
                                  </span>
                                </div>
                              )}

                            </div>

                          )}
      
                        </div>






                        </div>
                      </td>

                      {/*}
                      <td className="p-2">
                        <div className="flex flex-col gap-2 items-center justify-center">
                          {

                            (
                              item.status === 'paymentRequested' ||
                              item.status === 'ordered' ||
                              item.status === 'accepted' ||
                              item.status === 'paymentConfirmed'
                            ) ? (

                              <div className="text-xl text-zinc-500 font-semibold"
                                // monospace
                                style={{
                                  fontFamily: 'monospace',
                                }}
                              >
                                {
                                  item.krwAmount?.toLocaleString() + ' 원'
                                }
                              </div>

                            ) : (
                              item.status === 'test'
                            ) ? (
                              <div className="flex flex-col gap-2 items-end justify-center">
                                <input
                                  disabled={false}
                                  type="number"
                                  value={paymentAmounts[index]}
                                  onChange={(e) => {
                                    setPaymentAmounts(
                                      paymentAmounts.map((item, idx) => idx === index ? Number(e.target.value) : item)
                                    );
                                  }}
                                  className="w-20 h-8 rounded-md text-right text-lg text-zinc-500 font-semibold bg-zinc-100 border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />{' '}원
                              </div>
                            ) : (
                              <></>
                            )

                          }
                        </div>
                      </td>
                      */}






                      <td className="p-2">

                        <div className="
                          w-40
                          flex flex-col items-start justify-start gap-2">

                          {/* status */}
                          {item.status === 'ordered' && (
                            <div className="w-full flex flex-col gap-2 items-start justify-start">

                              <div className="flex flex-row items-center justify-center gap-2">
                                <Image
                                  src="/icon-matching.png"
                                  alt="Auto Matching"
                                  width={20}
                                  height={20}
                                  className="w-5 h-5 animate-spin"
                                />
                                <span className="text-sm text-zinc-500 font-semibold">
                                  판매자 매칭중입니다.
                                </span>
                              </div>

                              <button
                                className="text-sm text-red-600 font-semibold
                                  border border-red-600 rounded-lg p-2
                                  bg-red-100
                                  w-full text-center
                                  hover:bg-red-200
                                  cursor-pointer
                                  transition-all duration-200 ease-in-out
                                  hover:scale-105
                                  hover:shadow-lg
                                  hover:shadow-red-500/50
                                "
                                onClick={() => {
                                  setSelectedItem(item);
                                  openModal();
                                }}
                              >
                                {Buy_Order_Opened}
                              </button>


                      
                            


                            {/*
                            <div className="text-lg text-yellow-600 font-semibold
                              border border-yellow-600 rounded-lg p-2
                              bg-yellow-100
                              w-full text-center
                              ">


                              {Buy_Order_Opened}
                            </div>
                            */}

                            </div>
                          )}

                          {item.status === 'ordered' ? (
                            <span className="text-sm text-zinc-500 font-semibold">
                              
                            </span>
                          ) : (

                            <div className="w-full flex flex-col gap-2 items-start justify-start">

                              <div className="flex flex-row items-center justify-center gap-2"> 
                                <Image
                                  src={item?.seller?.avatar || "/icon-seller.png"}
                                  alt="Avatar"
                                  width={20}
                                  height={20}
                                  className="rounded-sm w-5 h-5"
                                />
                                <span className="text-lg font-semibold text-zinc-500">
                                  {
                                    item.seller?.nickname &&
                                    item.seller.nickname.length > 10 ?
                                    item.seller.nickname.slice(0, 10) + '...' :
                                    item.seller?.nickname
                                  }
                                </span>
                              </div>

                              {/* wallet address */}
                              <div className="flex flex-row items-center justify-center gap-1">
                                <Image
                                  src="/icon-shield.png"
                                  alt="Shield"
                                  width={20}
                                  height={20}
                                  className="rounded-sm w-5 h-5"
                                />
                                <button
                                  className="text-sm text-blue-600 font-semibold
                                  underline
                                  "
                                  onClick={() => {
                                    navigator.clipboard.writeText(item.seller?.walletAddress);
                                    toast.success(Copied_Wallet_Address);
                                  }}
                                >
                                  {item.seller?.walletAddress && item.seller?.walletAddress.substring(0, 6) + '...' + item.seller?.walletAddress.substring(item.seller?.walletAddress.length - 4)}
                                </button>
                              </div>

                              <div className="flex flex-row items-center justify-center gap-2">
                                <Image
                                  src="/icon-matching-completed.png"
                                  alt="Matching Completed"
                                  width={20}
                                  height={20}
                                  className="w-5 h-5"
                                />
                                <span className="text-sm text-zinc-500 font-semibold">
                                  자동매칭
                                </span>
                              </div>

                            </div>
                          )}



                          {item.status === 'accepted' && (

                            <div className="w-full flex flex-row gap-2 items-center justify-start">
                              <button
                                className="text-sm text-blue-600 font-semibold
                                  border border-blue-600 rounded-lg p-2
                                  bg-blue-100
                                  text-center
                                  hover:bg-blue-200
                                  cursor-pointer
                                  transition-all duration-200 ease-in-out
                                  hover:scale-105
                                  hover:shadow-lg
                                  hover:shadow-blue-500/50
                                "
                                onClick={() => {
                                  setSelectedItem(item);
                                  openModal();
                                }}
                              >
                                {Trade_Started}
                              </button>

                              {/* new window */}
                              <a
                                href={`${paymentUrl}/ko/${clientId}/${item?.storecode}/pay-usdt-reverse/${item?._id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-blue-600 font-semibold hover:underline"
                              >
                                새창
                              </a>
                              
                              <div className="text-sm text-zinc-500">

                                {params.lang === 'ko' ? (
                                  <p>{
                                    new Date().getTime() - new Date(item.acceptedAt).getTime() < 1000 * 60 ? (
                                      ' ' + Math.floor((new Date().getTime() - new Date(item.acceptedAt).getTime()) / 1000) + ' ' + seconds_ago
                                    ) :
                                    new Date().getTime() - new Date(item.acceptedAt).getTime() < 1000 * 60 * 60 ? (
                                    ' ' + Math.floor((new Date().getTime() - new Date(item.acceptedAt).getTime()) / 1000 / 60) + ' ' + minutes_ago
                                    ) : (
                                      ' ' + Math.floor((new Date().getTime() - new Date(item.acceptedAt).getTime()) / 1000 / 60 / 60) + ' ' + hours_ago
                                    )
                                  }</p>
                                ) : (
                                  <p>{
                                    new Date().getTime() - new Date(item.acceptedAt).getTime() < 1000 * 60 ? (
                                      ' ' + Math.floor((new Date().getTime() - new Date(item.acceptedAt).getTime()) / 1000) + ' ' + seconds_ago
                                    ) :
                                    new Date().getTime() - new Date(item.acceptedAt).getTime() < 1000 * 60 * 60 ? (
                                    ' ' + Math.floor((new Date().getTime() - new Date(item.acceptedAt).getTime()) / 1000 / 60) + ' ' + minutes_ago
                                    ) : (
                                      ' ' + Math.floor((new Date().getTime() - new Date(item.acceptedAt).getTime()) / 1000 / 60 / 60) + ' ' + hours_ago
                                    )
                                  }</p>
                                )}

                              </div>


                            </div>
                          )}

                          {item.status === 'paymentRequested' && (

                            <div className="w-full flex flex-row gap-2 items-center justify-start">

                              <button
                                className="text-sm text-yellow-600 font-semibold
                                  border border-yellow-600 rounded-lg p-2
                                  bg-yellow-100
                                  text-center
                                  hover:bg-yellow-200
                                  cursor-pointer
                                  transition-all duration-200 ease-in-out
                                  hover:scale-105
                                  hover:shadow-lg
                                  hover:shadow-yellow-500/50
                                "
                                onClick={() => {
                                  setSelectedItem(item);
                                  openModal();
                                }}
                              >
                                {Request_Payment}
                              </button>

                              {/* new window */}
                              <a
                                href={`${paymentUrl}/ko/${clientId}/${item?.storecode}/pay-usdt-reverse/${item?._id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-blue-600 font-semibold hover:underline"
                              >
                                새창
                              </a>

                              <div className="text-sm text-zinc-500">
                                {/* from now */}
                                {
                                  new Date().getTime() - new Date(item.paymentRequestedAt).getTime() < 1000 * 60 ? (
                                    ' ' + Math.floor((new Date().getTime() - new Date(item.paymentRequestedAt).getTime()) / 1000) + ' ' + seconds_ago
                                  ) : new Date().getTime() - new Date(item.paymentRequestedAt).getTime() < 1000 * 60 * 60 ? (
                                    ' ' + Math.floor((new Date().getTime() - new Date(item.paymentRequestedAt).getTime()) / 1000 / 60) + ' ' + minutes_ago
                                  ) : (
                                    ' ' + Math.floor((new Date().getTime() - new Date(item.paymentRequestedAt).getTime()) / 1000 / 60 / 60) + ' ' + hours_ago
                                  )
                                }
                              </div>


                            </div>
                          )}

                          {item.status === 'cancelled' && (
                              <div className="w-full flex flex-row gap-2 items-center justify-start">
                                <button
                                  className="text-sm text-red-600 font-semibold
                                    border border-red-600 rounded-lg p-2
                                    bg-red-100
                                    text-center
                                    hover:bg-red-200
                                    cursor-pointer
                                    transition-all duration-200 ease-in-out
                                    hover:scale-105
                                    hover:shadow-lg
                                    hover:shadow-red-500/50
                                  "
                                  onClick={() => {
                                    setSelectedItem(item);
                                    openModal();
                                  }}
                                >
                                  {Cancelled_at}
                                </button>


                                {/* new window */}
                                <a
                                  href={`${paymentUrl}/ko/${clientId}/${item?.storecode}/pay-usdt-reverse/${item?._id}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm text-blue-600 font-semibold hover:underline"
                                >
                                  새창
                                </a>

                                <div className="text-sm text-zinc-500">
                                  {
                                    // from now
                                    new Date().getTime() - new Date(item.cancelledAt).getTime() < 1000 * 60 ? (
                                      ' ' + Math.floor((new Date().getTime() - new Date(item.cancelledAt).getTime()) / 1000) + ' ' + seconds_ago
                                    ) : new Date().getTime() - new Date(item.cancelledAt).getTime() < 1000 * 60 * 60 ? (
                                      ' ' + Math.floor((new Date().getTime() - new Date(item.cancelledAt).getTime()) / 1000 / 60) + ' ' + minutes_ago
                                    ) : (
                                      ' ' + Math.floor((new Date().getTime() - new Date(item.cancelledAt).getTime()) / 1000 / 60 / 60) + ' ' + hours_ago
                                    )
                                  }
                                </div>
                              </div>
                          )}


                          {/* if status is accepted, show payment request button */}
                          {item.status === 'paymentConfirmed' && (
                            <div className="w-full flex flex-row gap-2 items-center justify-start">
                              <button
                                className="text-sm text-[#409192] font-semibold
                                  border border-green-600 rounded-lg p-2
                                  bg-green-100
                                  text-center
                                  hover:bg-green-200
                                  cursor-pointer
                                  transition-all duration-200 ease-in-out
                                  hover:scale-105
                                  hover:shadow-lg
                                  hover:shadow-green-500/50
                                "
                                onClick={() => {
                                  setSelectedItem(item);
                                  openModal();
                                }}
                              >
                                {Completed}
                              </button>
                              {/* new window */}
                              <a
                                href={`${paymentUrl}/ko/${clientId}/${item?.storecode}/pay-usdt-reverse/${item?._id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-blue-600 font-semibold hover:underline"
                              >
                                새창
                              </a>

                              <span
                                className="text-sm text-zinc-500"
                              >{
                                //item.paymentConfirmedAt && new Date(item.paymentConfirmedAt)?.toLocaleString()
                                // from now
                                new Date().getTime() - new Date(item.paymentConfirmedAt).getTime() < 1000 * 60 ? (
                                  ' ' + Math.floor((new Date().getTime() - new Date(item.paymentConfirmedAt).getTime()) / 1000) + ' ' + seconds_ago
                                ) : new Date().getTime() - new Date(item.paymentConfirmedAt).getTime() < 1000 * 60 * 60 ? (
                                  ' ' + Math.floor((new Date().getTime() - new Date(item.paymentConfirmedAt).getTime()) / 1000 / 60) + ' ' + minutes_ago
                                ) : (
                                  ' ' + Math.floor((new Date().getTime() - new Date(item.paymentConfirmedAt).getTime()) / 1000 / 60 / 60) + ' ' + hours_ago
                                )

                              }</span>
                            </div>
                          )}


                          {item.status === 'completed' && (
                            <div className="flex flex-col gap-2 items-start justify-start">
                              
                              {Completed_at}
                            </div>
                          )}

                        </div>

                      </td>




                      <td className="p-2">

                        {item?.status === 'paymentConfirmed' && (
                          <div className="
                            w-32  
                            flex flex-col gap-2 items-end justify-center">
                            <div className="flex flex-row gap-2 items-center justify-center">
                              <Image
                                src="/icon-payaction.png"
                                alt="Bank Check"
                                width={30}
                                height={30}
                                className="w-6 h-6 rounded-full"
                              />
                              <span className="text-sm font-semibold text-zinc-500">
                                입금완료
                              </span>
                            </div>

                            {/* seller bank info */}
                            <div className="flex flex-row gap-2 items-center justify-center">

                              <span className="text-sm text-zinc-500">
                                {/*item.seller?.bankInfo?.bankName*/}
                                {
                                  item?.userType === 'AAA'
                                  ? item.store?.bankInfoAAA?.bankName
                                  : item?.userType === 'BBB'
                                  ? item.store?.bankInfoBBB?.bankName
                                  : item?.userType === 'CCC'
                                  ? item.store?.bankInfoCCC?.bankName
                                  : item?.userType === 'DDD'
                                  ? item.store?.bankInfoDDD?.bankName
                                  : item.store?.bankInfo?.bankName
                                }
                              </span>
                              <span className="text-lg text-gray-800 font-bold">
                                {/*item.seller?.bankInfo?.accountHolder*/}
                                
                                {
                                  item?.userType === 'AAA'
                                  ? item.store?.bankInfoAAA?.accountHolder
                                  : item?.userType === 'BBB'
                                  ? item.store?.bankInfoBBB?.accountHolder
                                  : item?.userType === 'CCC'
                                  ? item.store?.bankInfoCCC?.accountHolder
                                  : item?.userType === 'DDD'
                                  ? item.store?.bankInfoDDD?.accountHolder
                                  : item.store?.bankInfo?.accountHolder
                                }

                              </span>


                            </div>

                            {/* paymentAmount */}
                            <div className="flex flex-row gap-1 items-center justify-center">
                              <span className="text-lg text-yellow-600 font-semibold"
                                style={{ fontFamily: 'monospace' }}>
                                {
                                  item.paymentAmount?.toLocaleString()
                                }
                              </span>
                            </div>
                          

                            <span className="text-sm text-purple-600 font-semibold">
                              {params.lang === 'ko' ? (
                                <p>{
                                  new Date(item.paymentConfirmedAt).getTime() - new Date(item.paymentRequestedAt).getTime() < 1000 * 60 ? (
                                    ' ' + Math.floor((new Date(item.paymentConfirmedAt).getTime() - new Date(item.paymentRequestedAt).getTime()) / 1000) + ' ' + '초 경과'
                                  ) :
                                  new Date(item.paymentConfirmedAt).getTime() - new Date(item.paymentRequestedAt).getTime() < 1000 * 60 * 60 ? (
                                  ' ' + Math.floor((new Date(item.paymentConfirmedAt).getTime() - new Date(item.paymentRequestedAt).getTime()) / 1000 / 60) + ' ' + '분 경과'
                                  ) : (
                                    ' ' + Math.floor((new Date(item.paymentConfirmedAt).getTime() - new Date(item.paymentRequestedAt).getTime()) / 1000 / 60 / 60) + ' ' + '시간 경과'
                                  )
                                }</p>
                              ) : (
                                <p>{
                                  new Date(item.paymentConfirmedAt).getTime() - new Date(item.paymentRequestedAt).getTime() < 1000 * 60 ? (
                                    ' ' + Math.floor((new Date(item.paymentConfirmedAt).getTime() - new Date(item.paymentRequestedAt).getTime()) / 1000) + ' ' + '초 경과'
                                  ) :
                                  new Date(item.paymentConfirmedAt).getTime() - new Date(item.paymentRequestedAt).getTime() < 1000 * 60 * 60 ? (
                                  ' ' + Math.floor((new Date(item.paymentConfirmedAt).getTime() - new Date(item.paymentRequestedAt).getTime()) / 1000 / 60) + ' ' + '분 경과'
                                  ) : (
                                    ' ' + Math.floor((new Date(item.paymentConfirmedAt).getTime() - new Date(item.paymentRequestedAt).getTime()) / 1000 / 60 / 60) + ' ' + '시간 경과'
                                  )
                                }</p>
                              )}
                            </span>




                          </div>
                        )}

                        {item?.status === 'paymentRequested' && (

                          <div className="
                            w-32
                            flex flex-col gap-2 items-end justify-center">

                            <div className="flex flex-row gap-2 items-center justify-center">
                              <Image
                                src="/icon-search-bank.gif"
                                alt="Bank Auto"
                                width={30}
                                height={30}
                                className="rounded-full"
                              />
                              <span className="text-sm font-semibold text-zinc-500">
                                확인중입니다.
                              </span>
                            </div>

                            <div className="flex flex-col gap-2 items-center justify-center">
                              <div className="flex flex-row items-center gap-2">

                                <div className="text-sm text-zinc-500">
                                  {/*item.seller?.bankInfo?.bankName*/}
                                  {item?.userType === 'AAA'
                                    ? item.store?.bankInfoAAA?.bankName
                                    : item?.userType === 'BBB'
                                    ? item.store?.bankInfoBBB?.bankName
                                    : item?.userType === 'CCC'
                                    ? item.store?.bankInfoCCC?.bankName
                                    : item?.userType === 'DDD'
                                    ? item.store?.bankInfoDDD?.bankName
                                    : item.store?.bankInfo?.bankName
                                  }
                                </div>
                                <div className="text-lg text-gray-800 font-bold">
                                  {/*item.seller?.bankInfo?.accountHolder*/}
                                  {
                                    item?.userType === 'AAA'
                                    ? item.store?.bankInfoAAA?.accountHolder
                                    : item?.userType === 'BBB'
                                    ? item.store?.bankInfoBBB?.accountHolder
                                    : item?.userType === 'CCC'
                                    ? item.store?.bankInfoCCC?.accountHolder
                                    : item?.userType === 'DDD'
                                    ? item.store?.bankInfoDDD?.accountHolder
                                    : item.store?.bankInfo?.accountHolder
                                  }
                                </div>

                              </div>
                              {/*
                              <div className="text-sm text-zinc-500">
                                {item.store?.bankInfo?.accountNumber}
                              </div>
                              */}

                            </div>

                            {/* paymentAmount */}
                            <div className="flex flex-row gap-1 items-center justify-center">
                              <span className="text-lg text-yellow-600 font-semibold"
                                style={{ fontFamily: 'monospace' }}>
                                {
                                  item.krwAmount?.toLocaleString()
                                }
                              </span>
                            </div>


                            <span className="text-sm text-purple-600 font-semibold">
                              {params.lang === 'ko' ? (
                                <p>{
                                  new Date().getTime() - new Date(item.paymentRequestedAt).getTime() < 1000 * 60 ? (
                                    ' ' + Math.floor((new Date().getTime() - new Date(item.paymentRequestedAt).getTime()) / 1000) + ' ' + '초 경과'
                                  ) :
                                  new Date().getTime() - new Date(item.paymentRequestedAt).getTime() < 1000 * 60 * 60 ? (
                                  ' ' + Math.floor((new Date().getTime() - new Date(item.paymentRequestedAt).getTime()) / 1000 / 60) + ' ' + '분 경과'
                                  ) : (
                                    ' ' + Math.floor((new Date().getTime() - new Date(item.paymentRequestedAt).getTime()) / 1000 / 60 / 60) + ' ' + '시간 경과'
                                  )
                                }</p>
                              ) : (
                                <p>{
                                  new Date().getTime() - new Date(item.paymentRequestedAt).getTime() < 1000 * 60 ? (
                                    ' ' + Math.floor((new Date().getTime() - new Date(item.paymentRequestedAt).getTime()) / 1000) + ' ' + '초 경과'
                                  ) :
                                  new Date().getTime() - new Date(item.paymentRequestedAt).getTime() < 1000 * 60 * 60 ? (
                                  ' ' + Math.floor((new Date().getTime() - new Date(item.paymentRequestedAt).getTime()) / 1000 / 60) + ' ' + '분 경과'
                                  ) : (
                                    ' ' + Math.floor((new Date().getTime() - new Date(item.paymentRequestedAt).getTime()) / 1000 / 60 / 60) + ' ' + '시간 경과'
                                  )
                                }</p>
                              )}
                            </span>



                          </div>

                        )}
                      </td>






                      <td className="p-2">
                        <div className="
                          w-64 flex flex-col gap-2 items-center justify-center">
                        {
                          user?.seller &&
                          item.status === 'ordered'  && (


                          <div className="bg-gray-500/10
                            rounded-md
                            p-2
                            flex flex-col sm:flex-row gap-2 items-start justify-start">


                          
                            <div className="
                              w-full
                              flex flex-col gap-2 items-end justify-center">

                              <div className="flex flex-row gap-2">
                                <input
                                  type="checkbox"
                                  checked={agreementForTrade[index]}
                                  onChange={(e) => {
                                    setAgreementForTrade(
                                      agreementForTrade.map((item, idx) => idx === index ? e.target.checked : item)
                                    );
                                  }}
                                />
                                <button
                                  disabled={acceptingBuyOrder[index] || !agreementForTrade[index]}
                                  className="
                                    text-sm text-blue-600 font-semibold
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
                                    acceptBuyOrder(index, item._id, smsReceiverMobileNumber);
                                  }}
                                >
                                  <div className="flex flex-row gap-2 items-center justify-center">
                                    {acceptingBuyOrder[index] && (
                                      <Image
                                        src="/loading.png"
                                        alt="Loading"
                                        width={20}
                                        height={20}
                                        className="animate-spin"
                                      />
                                    )}
                                    <span className="text-sm">{Buy_Order_Accept}</span>
                                  </div>
                                </button>

                              </div>

                              <div className="flex flex-row gap-2 items-center justify-center">
                                <Image
                                  src={user?.avatar || "/icon-seller.png"}
                                  alt="User"
                                  width={20}
                                  height={20}
                                  className="w-5 h-5"
                                />
                                {/* seller nickname */}
                                <div className="text-lg text-zinc-500 font-semibold">
                                  {user?.nickname}
                                </div>
                              </div>


                            </div>

                          </div>

                        )}



                        {item?.seller?.walletAddress !== address ? (

                          <div className="flex flex-col gap-2 items-center justify-center">


                              {item.status === 'paymentConfirmed' &&
                              !item?.settlement &&
                              (!item?.transactionHash || item?.transactionHash === '0x') && (
                                <div className="flex flex-row gap-2 items-center justify-center">
                                  <Image
                                    src="/icon-sending.png"
                                    alt="Sending"
                                    width={20}
                                    height={20}
                                    className="w-5 h-5 animate-spin"
                                  />
                                  <span className="text-sm text-zinc-500">
                                    판매자(<b>{item.seller?.nickname}</b>)가 <b>{item.usdtAmount.toFixed(3).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}</b> USDT를 회원(<b>{item.nickname}</b>)에게 보내는 중입니다.
                                  </span>
                                </div>
                              )}

                            
                          </div>

                        ) : (

                          <div className={`
                            ${
                            //item.status === 'accepted' ? 'bg-blue-500/10'
                            //: item.status === 'paymentRequested' ? 'bg-blue-500/10'
                            //: item.status === 'paymentConfirmed' ? 'bg-blue-500/10'
                            //: item.status === 'cancelled' ? 'bg-red-500/10'
                            //: item.status === 'paymentConfirmed' ? 'bg-green-500/10'
                            //: 'bg-gray-500/10'
                            <></>
                            } 

                            rounded-md
                            p-2 
                            flex flex-col sm:flex-row gap-2 items-start justify-start
                            `}>


                            
                            <div className="
                              w-full
                              flex flex-col gap-2 items-start justify-start">


                              {
                              (item.status === 'accepted' || item.status === 'paymentRequested')
                              && item.seller && item.seller.walletAddress === address && (
                                
                                <div className="flex flex-col items-center gap-2">
                                
                                  <div className="flex flex-row items-center gap-2">
                                    <input
                                      type="checkbox"
                                      checked={agreementForCancelTrade[index]}
                                      onChange={(e) => {
                                        setAgreementForCancelTrade(
                                          agreementForCancelTrade.map((item, idx) => idx === index ? e.target.checked : item)
                                        );
                                      }}
                                    />
                                    <button
                                      disabled={cancellings[index] || !agreementForCancelTrade[index]}
                  
                                      className="text-sm text-red-600 font-semibold
                                        border border-red-600 rounded-lg p-2
                                        bg-red-100
                                        w-full text-center
                                        hover:bg-red-200
                                        cursor-pointer
                                        transition-all duration-200 ease-in-out
                                        hover:scale-105
                                        hover:shadow-lg
                                        hover:shadow-red-500/50
                                      "  
                                      onClick={() => {
                                        cancelTrade(item._id, index);
                                      }}
                                    >
                                      <div className="flex flex-row gap-2 items-center justify-center">
                                        {cancellings[index] && (
                                          <Image
                                            src="/loading.png"
                                            alt="Loading"
                                            width={20}
                                            height={20}
                                            className="w-5 h-5
                                            animate-spin"
                                          />
                                        )}
                                        <span className="text-sm">{Cancel_My_Trade}</span>
                                      </div>
                                    
                                    </button>
                                  </div>

                                  <input 
                                    type="text"
                                    value={cancelTradeReason[index]}
                                    onChange={(e) => {
                                      setCancelTradeReason(
                                        cancelTradeReason.map((item, idx) => idx === index ? e.target.value : item)
                                      );
                                    }}
                                    placeholder="거래취소사유"
                                    className="w-full h-8
                                    text-center rounded-md text-sm text-zinc-500 font-semibold bg-zinc-100 border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  />
                                  {/* warning message */}
                                  {/* 취소사유가 없을 경우 판매자 평가에 영향을 미칠 수 있습니다. */}
                                  <div className="text-xs text-red-500">
                                    취소사유가 없을 경우 판매자 평가에 영향을 미칠 수 있습니다.
                                  </div>



                                </div>

                              )}

                              {/*
                              {item.status === 'cancelled' && (

                                <div className="w-full flex flex-col gap-2 items-center justify-center">
                                  <span className="text-sm text-red-600">
                                    {item.cancelTradeReason ? item.cancelTradeReason :
                                      "거래취소사유 없음"
                                    }
                                  </span>
                                </div>

                              )}
                              */}

                            </div>
                            

                            <div className="
                            w-full
                            flex flex-col gap-2 items-start justify-start">

                              {/*
                              {item.status === 'accepted' && item.seller && item.seller.walletAddress === address && (
                                
                                <div className="flex flex-row items-center gap-2">
                                  <input
                                    type="checkbox"
                                    checked={agreementForCancelTrade[index]}
                                    onChange={(e) => {
                                      setAgreementForCancelTrade(
                                        agreementForCancelTrade.map((item, idx) => idx === index ? e.target.checked : item)
                                      );
                                    }}
                                  />
                                  <button
                                    disabled={cancellings[index] || !agreementForCancelTrade[index]}

                                    className={`flex flex-row gap-1 text-sm text-white px-2 py-1 rounded-md ${cancellings[index] || !agreementForCancelTrade[index] ? 'bg-gray-500' : 'bg-red-500'}`}
                                      
                                    onClick={() => {
                                      cancelTrade(item._id, index);
                                    }}
                                  >
                                    {cancellings[index] && (
                                      <Image
                                        src="/loading.png"
                                        alt="Loading"
                                        width={20}
                                        height={20}
                                        className="animate-spin"
                                      />
                                    )}
                                    
                                    <span className="text-sm">{Cancel_My_Trade}</span>
                                  
                                  </button>
                                </div>

                              )}
                              */}



                              







                              {
                                item.seller && item.seller.walletAddress === address &&
                                item.status === 'accepted' && (


                                <div className="
                                  w-full
                                  flex flex-col gap-2 items-center justify-center">

                                  {item.store?.bankInfo ? (
                                    <div className="flex flex-row gap-2">

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
                                        
                                        className="text-sm text-yellow-600 font-semibold
                                          border border-yellow-600 rounded-lg p-2
                                          bg-yellow-100
                                          w-full text-center
                                          hover:bg-yellow-200
                                          cursor-pointer
                                          transition-all duration-200 ease-in-out
                                          hover:scale-105
                                          hover:shadow-lg
                                          hover:shadow-yellow-500/50
                                        "
                                        onClick={() => {

                                          requestPayment(
                                            index,
                                            item._id,
                                            item.tradeId,
                                            item.usdtAmount,
                                            item.storecode,

                                            item.store?.bankInfo,
                                          );
                                        }}
                                      >

                                        <div className="flex flex-row gap-2 items-center justify-center">
                                          { (escrowing[index] || requestingPayment[index]) && (
                                              <Image
                                                src="/loading.png"
                                                alt="Loading"
                                                width={20}
                                                height={20}
                                                className="w-5 h-5
                                                animate-spin"
                                              />
                                          )}
                                          <span className="text-sm">
                                            {Request_Payment}
                                          </span>
                                        </div>
                                      
                                      </button>

                                    </div>
                                  ) : (
                                    <div className="flex flex-row gap-2 items-center justify-center">
                                      <Image
                                        src="/icon-bank.png"
                                        alt="Bank"
                                        width={20}
                                        height={20}
                                        className="w-5 h-5"
                                      />
                                      <span className="text-sm text-red-600 font-semibold">
                                        결제은행정보 없음
                                      </span>
                                    </div>
                                  )}
                                  

                                  {/* seller bank info */}

                                  {item?.paymentMethod === 'bank' && (

                                    <div className="flex flex-col gap-2 items-center justify-center">
                                      <div className="flex flex-row gap-2 items-center justify-center">
                                        <span className="text-sm text-zinc-500">
                                          {item.store?.bankInfo?.accountHolder}
                                        </span>
                                        <span className="text-sm text-zinc-500">
                                          {item.store?.bankInfo?.bankName}
                                        </span>
                                      </div>

                                      <span className="text-sm text-zinc-500">
                                        {
                                          item.store?.bankInfo?.accountNumber &&
                                          item.store?.bankInfo?.accountNumber.length > 5 &&
                                          item.store?.bankInfo?.accountNumber.substring(0, 5) + '...'
                                        }
                                      </span>

                                    </div>

                                  )}
        
                                </div>
                              )}



                              {item.seller
                              && item.seller.walletAddress === address
                              && item.status === 'paymentRequested'
                              
                              ///////////////&& item?.autoConfirmPayment

                              && (

                                <div className="
                                  w-full
                                  flex flex-col gap-2 items-center justify-center">
                                  
                                  <div className="flex flex-row gap-2">

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
                                      
                                      className="text-sm text-[#409192] font-semibold
                                        border border-green-600 rounded-lg p-2
                                        bg-green-100
                                        w-full text-center
                                        hover:bg-green-200
                                        cursor-pointer
                                        transition-all duration-200 ease-in-out
                                        hover:scale-105
                                        hover:shadow-lg
                                        hover:shadow-green-500/50
                                      "

                                      /*
                                        confirmPayment(
                                            index,
                                            item._id,
                                            
                                            //paymentAmounts[index],
                                            item.krwAmount,

                                            //paymentAmountsUsdt[index],
                                            item.usdtAmount,


                                            item.walletAddress,
                                          );
                                          */

                                      
                                      onClick={() => {
                                        confirmPayment(
                                          index,
                                          item._id,
                                          //paymentAmounts[index],
                                          //paymentAmountsUsdt[index],

                                          item.krwAmount,
                                          item.usdtAmount,
                                          
                                          item.walletAddress,

                                          item.paymentMethod,
                                        );
                                      }}

                                    >
                                      <div className="flex flex-row gap-2 items-center justify-center">
                                        { confirmingPayment[index] && (
                                            <Image
                                              src="/loading.png"
                                              alt="Loading"
                                              width={20}
                                              height={20}
                                              className="w-5 h-5
                                              animate-spin"
                                            />
                                        )}
                                        <span className="text-sm">
                                          거래완료
                                        </span>
                                      </div>

                                    </button>

                                  </div>


                                  {!isWithoutEscrow && (
                                    <div className="flex flex-row gap-2">

                                      <input
                                        disabled={rollbackingPayment[index]}
                                        type="checkbox"
                                        checked={rollbackPaymentCheck[index]}
                                        onChange={(e) => {
                                          setRollbackPaymentCheck(
                                            rollbackPaymentCheck.map((item, idx) => {
                                              if (idx === index) {
                                                return e.target.checked;
                                              }
                                              return item;
                                            })
                                          );
                                        }}
                                      />

                                      <button
                                        disabled={rollbackingPayment[index] || !rollbackPaymentCheck[index]}
                                        className={`flex flex-row gap-1 text-sm text-white px-2 py-1 rounded-md ${rollbackingPayment[index] || !rollbackPaymentCheck[index] ? 'bg-gray-500' : 'bg-red-500'}`}
                                        onClick={() => {
                                          rollbackPayment(
                                            index,
                                            item._id,
                                            paymentAmounts[index],
                                            paymentAmountsUsdt[index]
                                          );
                                        }}

                                      >
                                        <div className="flex flex-row gap-2 items-center justify-center">
                                          <Image
                                            src="/loading.png"
                                            alt="loading"
                                            width={16}
                                            height={16}
                                            className={rollbackingPayment[index] ? 'animate-spin' : 'hidden'}
                                          />
                                          <span className="text-sm">
                                            에스크로 취소
                                          </span>
                                        </div>

                                      </button>

                                    </div>
                                  )}




                                  {/* 결제은행정보 */}
                                  {/*
                                  <div className="flex flex-row gap-2 items-center justify-center">
                                    <div className="flex flex-row items-center gap-2">
                                      <div className="text-sm text-zinc-500">
                                        {item.seller?.bankInfo?.bankName}
                                      </div>
                                      <div className="text-sm text-zinc-500">
                                        {
                                          item.seller?.bankInfo &&
                                          item.seller?.bankInfo?.accountNumber.substring(0,3) + '...'
                                        }
                                      </div>
                                    </div>
                                    <div className="text-sm text-zinc-500">
                                      {item.seller?.bankInfo?.accountHolder}
                                    </div>
                                  </div>
                                  */}

                                  {/* 결제금액 */}

                                  <div className="w-full flex flex-row gap-2 items-center justify-center">
                                    <input
                                      disabled={true}
                                      type="number"
                                      value={paymentAmounts[index]}
                                      onChange={(e) => {
                                        setPaymentAmounts(
                                          paymentAmounts.map((item, idx) => idx === index ? Number(e.target.value) : item)
                                        );
                                      }}
                                      className="w-20 h-8 rounded-md text-right text-lg text-zinc-500 font-semibold bg-zinc-100 border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />{' '}원
                                  </div>






                                </div>





                              )}

                              {/* paymentConfirmed */}
                              {/* paymentAmount */}
                              {item.status === 'paymentConfirmed' && (

                                <div className="
                                  w-40
                                  flex flex-col gap-2 items-center justify-center">





                                  {/* 자동입금처리일경우 */}
                                  {/* 수동으로 결제완료처리 버튼 */}
                                
                                  { !item?.settlement &&

                                  item?.autoConfirmPayment
                                  && (item?.transactionHash === '0x' || item?.transactionHash === undefined)
                                  && (


                                    <div className="w-full flex flex-row items-center justify-center gap-2">

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
                                        className="w-5 h-5 rounded-md border border-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                      />

                                      <button
                                        disabled={
                                          confirmingPayment[index]
                                          || !confirmPaymentCheck[index]
                                        
                                        }

                                        className={`
                                          w-full
                                        flex flex-row gap-1 text-sm text-white px-2 py-1 rounded-md
                                        border border-green-600
                                        hover:border-green-700
                                        hover:shadow-lg
                                        hover:shadow-green-500/50
                                        transition-all duration-200 ease-in-out

                                        ${confirmingPayment[index] ? 'bg-red-500' : 'bg-green-500'}
                                        

                                        ${!confirmPaymentCheck[index] ? 'bg-gray-500' : 'bg-green-500'}
                                        
                                        `}

                                        

                                        /*
                                        className={`
                                          ${confirmingPayment[index] ? 'bg-gray-500' : 'bg-green-500'}
                                        

                                          

                                        
                                        
                                        
                                        "text-sm text-[#409192] font-semibold
                                          border border-green-600 rounded-lg p-2
                                          bg-green-100
                                          w-full text-center
                                          hover:bg-green-200
                                          cursor-pointer
                                          transition-all duration-200 ease-in-out
                                          hover:scale-105
                                          hover:shadow-lg
                                          hover:shadow-green-500/50
                                        "
                                        */
                                        



                                        onClick={() => {
                                          //confirmPayment(
                                          sendPayment(

                                            index,
                                            item._id,
                                            
                                            //paymentAmounts[index],
                                            item.krwAmount,

                                            //paymentAmountsUsdt[index],
                                            item.usdtAmount,


                                            item.walletAddress,
                                          );
                                        }}


                                      >

                                        <div className="flex flex-row gap-2 items-center justify-center">
                                          <Image
                                            src="/icon-transfer.png"
                                            alt="Transfer"
                                            width={20}
                                            height={20}
                                            className={`
                                            ${confirmingPayment[index] ? 'animate-spin' : 'animate-pulse'}
                                              w-5 h-5
                                            `}
                                          />
                                          <span className="text-sm">
                                            구매자에게 {item.usdtAmount.toFixed(3)} USDT 전송하기
                                          </span>
                                        </div>

                                      </button>

                                    </div>




                                  )}

                                </div>
                              )}


                            </div>


                          </div>

                        )}


                        {item.status === 'cancelled' && (

                          <div className="w-full flex flex-col gap-2 items-center justify-center">
                            <span className="text-sm text-red-600">
                              {item.cancelTradeReason ? item.cancelTradeReason :
                                "거래취소사유 없음"
                              }
                            </span>
                          </div>

                        )}



                        {
                        (item?.transactionHash && item?.transactionHash !== '0x') && (
                          <button
                            className="
                              flex flex-row gap-2 items-center justify-between
                              text-sm text-blue-600 font-semibold
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
                            <div className="flex flex-col gap-2 items-start justify-start ml-2">
                              <div className="flex flex-col gap-1 items-start justify-start">
                                <span className="text-sm">
                                  회원지갑으로 전송한 테더(USDT)
                                </span>
                                <div className="flex flex-row gap-1 items-center justify-start">
                                  <Image
                                    src={`/icon-tether.png`}
                                    alt="USDT Logo"
                                    width={20}
                                    height={20}
                                    className="w-5 h-5"
                                  />
                                  <span className="text-sm text-[#409192] font-semibold"
                                    style={{
                                      fontFamily: 'monospace',
                                    }}>
                                    {item?.usdtAmount.toFixed(3).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                  </span>
                                </div>
                                <span className="text-sm text-zinc-500">
                                  TXID: {item.transactionHash.slice(0, 6)}...{item.transactionHash.slice(-4)}
                                </span>
                              </div>
                            </div>
                            {/* chain logo */}
                            <Image
                              src={`/logo-chain-${chain}.png`}
                              alt={`${chain} Logo`}
                              width={20}
                              height={20}
                              className="w-5 h-5"
                            />
                          </button>
                        )}


                        {item?.settlement &&
                        (!item?.transactionHash || item?.transactionHash === '0x') && (
                          <div className="flex flex-row gap-2 items-center justify-center">
                            <span className="text-sm text-zinc-500">
                              TXID 확인중...
                            </span>
                          </div>
                        )}




                        {/*
                        {item.status === 'paymentConfirmed' &&
                        !item?.settlement &&
                        (!item?.transactionHash || item?.transactionHash === '0x') && (
                          <div className="flex flex-row gap-2 items-center justify-center">
                            <Image
                              src="/loading.png"
                              alt="Loading Icon"
                              width={20}
                              height={20}
                              className="w-5 h-5 animate-spin"
                            />
                            <span className="text-sm text-zinc-500">
                              판매자가 판매한 테더(USDT)를 구매자에게 보내는 중
                            </span>
                          </div>
                        )}
                          */}


                        {item?.escrowTransactionHash
                        && item?.escrowTransactionHash !== '0x'
                        && (
                          <button
                            className={`
                              ${item.status === 'cancelled' ? 'bg-red-100 text-red-600' : 'bg-purple-100 text-purple-600'}
                              flex flex-row gap-2 items-center justify-between
                              text-sm font-semibold
                              border border-purple-600 rounded-lg p-2
                              w-full text-center
                              hover:bg-purple-200
                              cursor-pointer
                              transition-all duration-200 ease-in-out
                              hover:scale-105
                              hover:shadow-lg
                              hover:shadow-purple-500/50
                            `}

                            
                            onClick={() => {
                              let url = '';
                              if (chain === "ethereum") {
                                url = `https://etherscan.io/tx/${item.escrowTransactionHash}`;
                              } else if (chain === "polygon") {
                                url = `https://polygonscan.com/tx/${item.escrowTransactionHash}`;
                              } else if (chain === "arbitrum") {
                                url = `https://arbiscan.io/tx/${item.escrowTransactionHash}`;
                              } else if (chain === "bsc") {
                                url = `https://bscscan.com/tx/${item.escrowTransactionHash}`;
                              } else {
                                url = `https://arbiscan.io/tx/${item.escrowTransactionHash}`;
                              }
                              window.open(url, '_blank');

                            }}
                          >
                            <div className="flex flex-row gap-2 items-center justify-start ml-2">
                              <Image
                                src={`/token-mkrw-icon.png`}
                                alt="MKRW Logo"
                                width={20}
                                height={20}
                                className="w-5 h-5"
                              />
                              <Image
                                src={`/logo-chain-${chain}.png`}
                                alt={`${chain} Logo`}
                                width={20}
                                height={20}
                                className="w-5 h-5"
                              />
                              <span className="text-sm">
                                {item?.status === 'cancelled' ?
                                  '에스크로(MKRW) 회수내역'
                                  :
                                  '에스크로(MKRW) 전송내역'
                                }
                              </span>
                            </div>
                            {/* chain logo */}
                            <Image
                              src={`/logo-chain-${chain}.png`}
                              alt={`${chain} Logo`}
                              width={20}
                              height={20}
                              className="w-5 h-5"
                            />
                          </button>
                        )}





                        </div>

                      </td>


                      <td className="p-2">
                        <div className="w-full  flex flex-col gap-2 items-center justify-center
                          bg-zinc-50 p-4 rounded-lg shadow-sm">


                          {item.status === "paymentConfirmed" &&
                            (!item?.transactionHash || item?.transactionHash === '0x') &&
                            !item?.settlement && (

                            <div className="flex flex-col gap-2">
                              {/* 자동결제 지갑주소 */}

                              <div className="w-full flex flex-row gap-2 items-center justify-start">
                                <span className="text-sm font-semibold text-zinc-500">
                                  {item?.store?.storeName}{' '}가맹점 자동결제 지갑주소
                                </span>
                              </div>


                              <div className="flex flex-row gap-1 items-center">
                                <Image
                                  src="/icon-shield.png"
                                  alt="Wallet Icon"
                                  width={16}
                                  height={16}
                                  className="w-4 h-4 rounded-lg object-cover"
                                />
                                <span className="text-sm font-semibold text-zinc-500">
                                  {item.store?.settlementWalletAddress ?
                                    item.store.settlementWalletAddress.slice(0, 5) + '...' + item.store.settlementWalletAddress.slice(-4)
                                    : '없음'}
                                </span>
                              </div>

                              {/* info P2P 거래완료후 자동으로 결제와 정산을 진행합니다. */}
                              <div className="flex flex-row gap-1 items-center">
                                <Image
                                  src="/icon-info.png"
                                  alt="Info Icon"
                                  width={16}
                                  height={16}
                                  className="w-4 h-4 rounded-lg object-cover"
                                />
                                <span className="text-sm font-semibold text-zinc-500">
                                  P2P 거래완료후 자동으로 결제와 정산을 진행합니다.
                                </span>
                              </div>

                            </div>
                          )}


                          {item?.settlement && (

                            <div className="w-full flex flex-row gap-2 items-center justify-between">
                              
                              <div className="flex flex-row gap-1 items-center">
                                <Image
                                  src="/icon-payment.png"
                                  alt="Payment Icon"
                                  width={30}
                                  height={30}
                                  className="w-8 h-8 rounded-lg object-cover"
                                />
                                <span className="text-sm font-semibold text-zinc-500">
                                  결제완료
                                </span>

                                <div className="flex flex-row gap-1 items-center">
                                  {/* image for usdt and chain image */}
                                  <Image
                                    src="/icon-tether.png"
                                    alt="USDT Icon"
                                    width={16}
                                    height={16}
                                    className="w-4 h-4 rounded-lg object-cover"
                                  />
                                  <Image
                                    src={`/logo-chain-${chain}.png`}
                                    alt={`${chain} Icon`}
                                    width={16}
                                    height={16}
                                    className="w-4 h-4 rounded-lg object-cover"
                                  />
                                </div>
                              </div>
                              {/*
                              <div className="flex flex-row gap-1 items-center">
                                <span className="text-sm font-semibold text-zinc-500">
                                  지갑잔액:
                                </span>
                                <span className="text-lg font-semibold text-green-600"
                                  style={{
                                    fontFamily: 'monospace',
                                  }}>
                                  {item?.settlement?.settlementWalletBalance &&
                                    `${Number(item?.settlement?.settlementWalletBalance).toFixed(3).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`
                                  }
                                </span>
                              </div>
                              */}

                            </div>

                          )}


                          <div className="flex flex-row gap-2 items-between justify-center">

                            {item?.settlement && (
                              <div className="flex flex-col gap-2 items-end justify-center">

                                <div className="w-full flex flex-row gap-2 items-center justify-center">
                                  <span className="
                                  w-14 text-end
                                  text-sm text-zinc-500"
                                    style={{
                                      fontFamily: 'monospace',
                                    }}>
                                    {Number(
                                      100 - (item.store?.agentFeePercent ? item.store?.agentFeePercent : 0.0) - (item.store.settlementFeePercent ? item.store.settlementFeePercent : 0.0)
                                    ).toFixed(2)
                                    }%
                                  </span>
                                </div>

                                {/*
                                <div className="w-full flex flex-row gap-2 items-center justify-center">
                                  <span className="
                                  w-16
                                  text-sm text-zinc-500">
                                    AG 수수료
                                  </span>
                                  <span className="
                                  w-14 text-end
                                  text-sm text-zinc-500"
                                    style={{
                                      fontFamily: 'monospace',
                                    }}>
                                    {Number(item.store?.agentFeePercent ? item.store?.agentFeePercent : 0.0).toFixed(3)}%
                                  </span>
                                </div>

                                <div className="w-full flex flex-row gap-2 items-center justify-center">
                                  <span className="
                                  w-16
                                  text-sm text-zinc-500">
                                    PG 수수료
                                  </span>
                                  <span className="
                                  w-14  text-end
                                  text-sm text-zinc-500"
                                    style={{
                                      fontFamily: 'monospace',
                                    }}>
                                    {Number(item.store.settlementFeePercent ? item.store.settlementFeePercent : 0.0).toFixed(3)}%
                                  </span>
                                </div>
                                */}

                              </div>
                            )}



                            {item?.settlement ? (

                              <div className="flex flex-row gap-2 items-center justify-center">
                                <div className="flex flex-col gap-2 items-center justify-center">

                                  {/* RGB => 175, 228, 171 */}
                                  <button
                                    className="
                                    w-32
                                    flex flex-col gap-2 items-center justify-center

                                    bg-[#AFE4AB] hover:bg-[#9BCDA5]
                                    text-sm text-green-800 font-semibold
                                    border border-green-600 rounded-lg p-2
                                    hover:border-green-700
                                    hover:shadow-lg
                                    hover:shadow-green-500/50
                                    transition-all duration-200 ease-in-out
                                    hover:scale-105
                                    hover:cursor-pointer
                                    "

                                    onClick={() => {
                                      window.open(
  
                                        chain === 'ethereum' ? `https://etherscan.io/tx/${item.settlement.txid}`
                                        : chain === 'polygon' ? `https://polygonscan.com/tx/${item.settlement.txid}`
                                        : chain === 'arbitrum' ? `https://arbiscan.io/tx/${item.settlement.txid}`
                                        : chain === 'bsc' ? `https://bscscan.com/tx/${item.settlement.txid}`
                                        : `https://arbiscan.io/tx/${item.settlement.txid}`,

                                        '_blank'
                                      );
                                    }}
                                  >

                                    <div className="flex flex-col gap-2 items-end justify-center"
                                      style={{
                                        fontFamily: 'monospace',
                                      }}
                                    >
                                      <div className="flex flex-row gap-1 items-center justify-center">
                                        <Image
                                          src="/icon-tether.png"
                                          alt="Settlement Tether"
                                          width={20}
                                          height={20}
                                          className="w-5 h-5"
                                        />
                                        <span>
                                          {Number(item?.settlement?.settlementAmount).toFixed(3).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                        </span>
                                        {/* logo-chain-{chain} */}
                                        <Image
                                          src={`/logo-chain-${chain}.png`}
                                          alt={`Settlement ${chain}`}
                                          width={20}
                                          height={20}
                                          className="w-5 h-5"
                                        />

                                      </div>
                                      {/*
                                      <span>
                                        {
                                          item?.settlement?.agentFeeAmount ?
                                          item?.settlement?.agentFeeAmount?.toLocaleString() + ' USDT'
                                          : '0 USDT'
                                        }
                                        {' '}
                                        {
                                          item?.settlement?.agentFeeWalletAddress &&
                                        item?.settlement?.agentFeeWalletAddress?.slice(0, 5) + '...'}
                                      </span>
                                      <span>
                                        {item?.settlement?.feeAmount?.toLocaleString() + ' USDT'}
                                        {' '}
                                        {
                                          item?.settlement?.feeWalletAddress &&
                                        item?.settlement?.feeWalletAddress?.slice(0, 5) + '...'}
                                      </span>
                                      */}

                                    </div>

                                  </button>

                                  {/* https://arbiscan.io/token/0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9?a=0x27819bb55cB09A6Bc1E1a82e7A085A340981039A */}
                                  <div className="flex flex-row items-center justify-center gap-1">
                                    <Image
                                      src="/icon-shield.png"
                                      alt="Settlement Shield"
                                      width={20}
                                      height={20}
                                      className="w-5 h-5"
                                    />
                                    <button
                                      className="
                                        text-sm text-blue-600 underline font-semibold
                                        hover:text-blue-800
                                        hover:cursor-pointer
                                        transition-all duration-200 ease-in-out
                                        hover:scale-105
                                        hover:shadow-lg
                                        hover:shadow-blue-500/50
                                      "
                                      onClick={() => {
                                        window.open(
                                          chain === 'ethereum' ? `https://etherscan.io/token/${ethereumContractAddressUSDT}?a=${item?.settlement?.settlementWalletAddress}`
                                          : chain === 'polygon' ? `https://polygonscan.com/token/${polygonContractAddressUSDT}?a=${item?.settlement?.settlementWalletAddress}`
                                          : chain === 'arbitrum' ? `https://arbiscan.io/token/${arbitrumContractAddressUSDT}?a=${item?.settlement?.settlementWalletAddress}`
                                          : chain === 'bsc' ? `https://bscscan.com/token/${bscContractAddressUSDT}?a=${item?.settlement?.settlementWalletAddress}`
                                          : `https://arbiscan.io/token/${item?.settlement?.settlementWalletAddress}`,
                                          '_blank'
                                        );
                                      }}
                                    >
                                        {
                                          item?.settlement?.settlementWalletAddress &&
                                          item?.settlement?.settlementWalletAddress?.slice(0, 6) + '...' + item?.settlement?.settlementWalletAddress?.slice(-4)
                                        }
                                    </button>
                                  </div>
                                </div>


                                <div className="  
                                w-36  
                                flex flex-col gap-2 items-end justify-center"
                                >
                                  <button
                                    onClick={() => {
                                      // Handle user click
                                      // copy item.nickname
                                      navigator.clipboard.writeText(item.nickname);
                                      toast.success('회원 아이디가 복사되었습니다.');
                                    }}
                                    className="flex flex-row gap-1 items-center justify-center p-2
                                    bg-transparent border-none cursor-pointer
                                    hover:border hover:border-blue-600 hover:border-dashed
                                    hover:bg-blue-100 hover:shadow-lg"
                                  >
                                    <Image
                                      src="/icon-user.png"
                                      alt="User Icon"
                                      width={20}
                                      height={20}
                                      className="w-5 h-5"
                                    />
                                    <span className="text-lg font-semibold text-blue-600">
                                      {item.nickname}
                                    </span>
                                  </button>

                                  <span className="text-sm text-blue-600 font-semibold"
                                    style={{
                                      fontFamily: 'monospace',
                                    }}
                                  >
                                    {Number(item.krwAmount).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}원 충전
                                  </span>
                                </div>


                                {/*
                                <div className="
                                w-40 
                                flex flex-col gap-2 items-end justify-center"
                                >
                                  <div className="flex flex-row gap-1 items-center justify-center">
                                    <Image
                                      src="/icon-user.png"
                                      alt="User Icon"
                                      width={20}
                                      height={20}
                                      className="w-5 h-5"
                                    />
                                    <span className="text-lg font-semibold text-blue-600">
                                      {item.nickname}
                                    </span>
                                  </div>
                                  <span className="text-sm text-blue-600 font-semibold"
                                    style={{
                                      fontFamily: 'monospace',
                                    }}
                                  >
                                    {Number(item.krwAmount).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}원 충전
                                  </span>
                                </div>
                                */}



                              </div>

                            ) : (
                              <>
                                {item.status === 'paymentConfirmed'
                                && item?.transactionHash !== '0x'
                                && (
                                  <div className="flex flex-row gap-2 items-center justify-center">

                                    {item.storecode === 'admin' ? (

                                      <div className="flex flex-row gap-2 items-center justify-center">
                                        일반 회원 구매
                                      </div>

                                    ) : (
                                    
                                      <div className="flex flex-col gap-2 items-center justify-center">

                                        <div className="flex flex-row gap-2 items-center justify-center">
                                          <Image
                                            src="/icon-payment.gif"
                                            alt="Payment Processing"
                                            width={35}
                                            height={35}
                                            className="rounded-full"
                                          />
                                          <span className="text-sm font-semibold text-zinc-500">
                                            회원(<b>{item.nickname.slice(0, 5)}...</b>)이 테더로 결제하는 중입니다.
                                          </span>
                                        </div>

                                        <div className="flex flex-row gap-2 items-center justify-center">
                                          <Image
                                            src={item.store?.storeLogo || '/icon-store.png'}
                                            alt="Store Logo"
                                            width={20}
                                            height={20}
                                            className="rounded-lg w-6 h-6 object-cover"
                                          />
                                          <span className="text-sm font-semibold text-zinc-500">
                                            {item.store?.storeName}
                                          </span>
                                        </div>

                                        <div className="flex flex-row items-center justify-center gap-1">
                                          <Image
                                            src="/icon-tether.png"
                                            alt="Settlement Tether"
                                            width={20}
                                            height={20}
                                            className="w-5 h-5"
                                          />
                                          <span className="text-lg font-semibold text-[#409192]"
                                            style={{
                                              fontFamily: 'monospace',
                                            }}
                                          >
                                            {Number(item.usdtAmount).toFixed(3).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                          </span>
                                        </div>

                                      </div>

                                    )}


                                  </div>
                                )}
                              </>
                            )}


                          </div>

                        </div>

                      </td>




                      {/* 상세보기 */}
                      {/*
                      <td className="p-2">
                        <div className="
                          w-20
                        flex flex-col gap-2 items-center justify-center">
                          <button
                            className="text-sm bg-zinc-500 text-white px-2 py-1 rounded-md hover:bg-zinc-600"

                            onClick={() => {
                              setSelectedItem(item);
                              openModal();
                              
                            }}

                          >
                            거래보기
                          </button>
      

                          {item?.settlement && item?.settlement?.txid && (
                          <button
                            className="text-sm bg-zinc-500 text-white px-2 py-1 rounded-md hover:bg-zinc-600"
                            onClick={() => {
                              window.open(
                                `https://arbiscan.io/tx/${item.settlement.txid}`,
                                '_blank'
                              );
                            }}
                          >
                            정산보기
                          </button>
                          )}
                        </div>
                      </td>
                      */}


                    </tr>

                  ))}

                </tbody>

              </table>

            </div>


          ) : (

            <div className="w-full grid gap-4 lg:grid-cols-2 xl:grid-cols-3 justify-center ">

                {buyOrders.map((item, index) => (
    
                  <div
                    key={index}
                    className="relative flex flex-col items-center justify-center"
                  >


                    {item.status === 'ordered' && (new Date().getTime() - new Date(item.createdAt).getTime() > 1000 * 60 * 60 * 24) && (
                      <div className="absolute inset-0 flex justify-center items-center z-10
                        bg-black bg-opacity-50
                      ">
                        <Image
                          src="/icon-expired.png"
                          alt="Expired"
                          width={100}
                          height={100}
                          className="opacity-20"
                        />
                      </div>
                    )}

                    {item.status === 'cancelled' && (
                      <div className="absolute inset-0 flex justify-center items-center z-10
                        bg-black bg-opacity-50
                      ">
                        <Image
                          src="/icon-cancelled.png"
                          alt="Cancelled"
                          width={100}
                          height={100}
                          className="opacity-20"
                        />
                      </div>
                    )}


                    <article
                        //key={index}
                        className={` w-96 xl:w-full h-full relative
                          ${item.walletAddress === address ? 'border-green-500' : 'border-gray-200'}

                          ${item.status === 'accepted' || item.status === 'paymentRequested' ? 'border-red-600' : 'border-gray-200'}

                          p-4 rounded-md border bg-black bg-opacity-50
                      `}
                    >

                      {item.status === 'ordered' && (


                        <div className="w-full flex flex-col gpa-2 items-start justify-start">


                            <div className="w-full flex flex-row items-center justify-between gap-2">

                              <div className="flex flex-row items-center gap-2">

                                {/* if createdAt is recent 1 hours, show new badge */}
                                {new Date().getTime() - new Date(item.createdAt).getTime() < 1000 * 60 * 60 && (
                                  <Image
                                    src="/icon-new.png"
                                    alt="New"
                                    width={28}
                                    height={28}
                                  />
                                )}

                                <Image
                                  src="/icon-public-sale.png"
                                  alt="Public Sale"
                                  width={28}
                                  height={28}
                                />

                              

                                {params.lang === 'ko' ? (

                                  <p className="text-sm text-zinc-500">

                                  
                                    {

                                      new Date().getTime() - new Date(item.createdAt).getTime() < 1000 * 60 ? (
                                        ' ' + Math.floor((new Date().getTime() - new Date(item.createdAt).getTime()) / 1000) + ' ' + seconds_ago
                                      ) :
                                      new Date().getTime() - new Date(item.createdAt).getTime() < 1000 * 60 * 60 ? (
                                      ' ' + Math.floor((new Date().getTime() - new Date(item.createdAt).getTime()) / 1000 / 60) + ' ' + minutes_ago
                                      ) : (
                                        ' ' + Math.floor((new Date().getTime() - new Date(item.createdAt).getTime()) / 1000 / 60 / 60) + ' ' + hours_ago
                                      )
                                    }{' '}{Buy_Order_Opened} 

                                  </p>
                                  
                                  ) : (

                                    <p className="text-sm text-zinc-500">


                                  
                                    {Buy_Order_Opened}{' '}{

                                      new Date().getTime() - new Date(item.createdAt).getTime() < 1000 * 60 ? (
                                        ' ' + Math.floor((new Date().getTime() - new Date(item.createdAt).getTime()) / 1000) + ' ' + seconds_ago
                                      ) :
                                      new Date().getTime() - new Date(item.createdAt).getTime() < 1000 * 60 * 60 ? (
                                      ' ' + Math.floor((new Date().getTime() - new Date(item.createdAt).getTime()) / 1000 / 60) + ' ' + minutes_ago
                                      ) : (
                                        ' ' + Math.floor((new Date().getTime() - new Date(item.createdAt).getTime()) / 1000 / 60 / 60) + ' ' + hours_ago
                                      )
                                    }



                                  </p>


                                )}

                              </div>



                              {/* share button */}
                              {/*
                              <button
                                className="text-sm bg-blue-500 text-white px-2 py-1 rounded-md hover:bg-blue-600"
                                onClick={() => {

                                  window.open(`https://gold.goodtether.com/${params.lang}/sell-usdt/${item._id}`, '_blank');

                                }}
                              >
                                <Image
                                  src="/icon-share.png"
                                  alt="Share"
                                  width={20}
                                  height={20}
                                />
                              </button>
                              */}


                            </div>


                            {24 - Math.floor((new Date().getTime() - new Date(item.createdAt).getTime()) / 1000 / 60 / 60) > 0 ? (

                              <div className="mt-2 flex flex-row items-center space-x-2">
                                <Image
                                  src="/icon-timer.webp"
                                  alt="Timer"
                                  width={28}
                                  height={28}
                                />
                                <p className="text-sm text-zinc-500">{Expires_in} {

                                  24 - Math.floor((new Date().getTime() - new Date(item.createdAt).getTime()) / 1000 / 60 / 60) - 1

                                  } {hours} {
                                    60 - Math.floor((new Date().getTime() - new Date(item.createdAt).getTime()) / 1000 / 60) % 60
                                  } {minutes}

                                </p>
                              </div>

                            ) : (
                              <div className="mt-2 flex flex-row items-center space-x-2">
                                {/*
                                <Image
                                  src="/icon-timer.webp"
                                  alt="Expired"
                                  width={28}
                                  height={28}
                                />
                                <p className="text-sm text-zinc-500">Expired</p>
                                */}
                              </div>
                            )}

                        </div>

                      )}





                      { (item.status === 'accepted' || item.status === 'paymentRequested' || item.status === 'cancelled') && (
                          
                        <div className={`
                          ${item.status !== 'cancelled' && 'h-16'}

                          mb-4 flex flex-row items-center bg-zinc-800 px-2 py-1 rounded-md`}>
                            <Image
                              src="/icon-trade.png"
                              alt="Trade"
                              width={32}
                              height={32}
                            />


                            <p className="text-sm font-semibold text-[#409192] ">
                              {item.tradeId}
                            </p>

                            {item.status === 'cancelled' ? (
                              <p className="ml-2 text-sm text-zinc-500">
                                {new Date(item.acceptedAt)?.toLocaleString()}
                              </p>
                            ) : (
                              
                              <>
                                {params.lang === 'ko' ? (

                                  <p className="ml-2 text-sm text-zinc-500">

                                  
                                    {new Date().getTime() - new Date(item.acceptedAt).getTime() < 1000 * 60 ? (
                                      ' ' + Math.floor((new Date().getTime() - new Date(item.acceptedAt).getTime()) / 1000) + ' ' + seconds_ago
                                    ) :
                                    new Date().getTime() - new Date(item.acceptedAt).getTime() < 1000 * 60 * 60 ? (
                                    ' ' + Math.floor((new Date().getTime() - new Date(item.acceptedAt).getTime()) / 1000 / 60) + ' ' + minutes_ago
                                    ) : (
                                      ' ' + Math.floor((new Date().getTime() - new Date(item.acceptedAt).getTime()) / 1000 / 60 / 60) + ' ' + hours_ago
                                    )
                                    }{' '}{Trade_Started}

                                  </p>



                                ) : (

                                  <p className="ml-2 text-sm text-zinc-500">

                                    {Trade_Started} {
                                      new Date().getTime() - new Date(item.acceptedAt).getTime() < 1000 * 60 ? (
                                        ' ' + Math.floor((new Date().getTime() - new Date(item.acceptedAt).getTime()) / 1000) + ' ' + seconds_ago
                                      ) :
                                      new Date().getTime() - new Date(item.acceptedAt).getTime() < 1000 * 60 * 60 ? (
                                      ' ' + Math.floor((new Date().getTime() - new Date(item.acceptedAt).getTime()) / 1000 / 60) + ' ' + minutes_ago
                                      ) : (
                                        ' ' + Math.floor((new Date().getTime() - new Date(item.acceptedAt).getTime()) / 1000 / 60 / 60) + ' ' + hours_ago
                                      )
                                    }

                                  </p>

                                )}




                              </>
                            
                            )}



                              {/* share button */}
                              <button
                                className="ml-5 text-sm bg-blue-500 text-white px-2 py-1 rounded-md hover:bg-blue-600"
                                onClick={() => {

                                  //window.open(`https://gold.goodtether.com/${params.lang}/${"admin"}/sell-usdt/${item._id}`, '_blank');

                                  // copy to clipboard

                                  navigator.clipboard.writeText(`https://gold.goodtether.com/${params.lang}/${"admin"}/sell-usdt/${item._id}`);

                                  toast.success('Link copied to clipboard');

                                }}
                              >
                                <Image
                                  src="/icon-share.png"
                                  alt="Share"
                                  width={20}
                                  height={20}
                                />
                              </button>



                          </div>
                      )}


                        {/*
                        
                        {item.acceptedAt && (
                          <p className="mb-2 text-sm text-zinc-500">
                            Trade started at {new Date(item.acceptedAt).toLocaleDateString() + ' ' + new Date(item.acceptedAt).toLocaleTimeString()}
                          </p>
                        )}
                        */}




                      {item.status === 'cancelled' && (
                          <div className="mt-4 flex flex-row items-center gap-2">
                            <Image
                              src='/icon-cancelled.webp'
                              alt='cancel'
                              width={20}
                              height={20}
                            />
                            <p className="text-sm text-red-500">
                              {Cancelled_at} {
                                new Date(item.cancelledAt).toLocaleDateString() + ' ' + new Date(item.cancelledAt).toLocaleTimeString()
                              }
                            </p>
                          </div>
                        )}




              

                        <div className="mt-4 flex flex-col items-start">



                          <p className="text-xl text-zinc-500"
                            style={{ fontFamily: 'monospace' }}>
                            {Price}: {
                              // currency
                            
                              Number(item.krwAmount)?.toLocaleString() + ' 원'

                            }
                          </p>

                          <div className="mt-2 flex flex-row items-start gap-2">

                            <p className="text-xl font-semibold text-zinc-500">
                              {item.usdtAmount}{' '}USDT
                            </p>
                            <p className="text-lg font-semibold text-zinc-500">{Rate}: {

                              Number(item.krwAmount / item.usdtAmount).toFixed(3)

                              }</p>
                          </div>


                        </div>

                

                        <div className="mb-4 flex flex-col items-start text-sm ">
                          {Payment}: {Bank_Transfer} ({item.seller?.bankInfo?.bankName})
                        </div>



                        <div className="flex flex-col items-start justify-start gap-2">
                          <p className="mt-2 mb-2 flex items-center gap-2">

                            <Image
                                src={item.avatar || '/profile-default.png'}
                                alt="Avatar"
                                width={32}
                                height={32}
                                priority={true} // Added priority property
                                className="rounded-full"
                                style={{
                                    objectFit: 'cover',
                                    width: '32px',
                                    height: '32px',
                                }}
                            />

                            <div className="flex flex-col gap-2 items-start">
                              <div className="flex items-center space-x-2">{Buyer}:</div>

                              <div className="text-sm font-semibold">
                                {item.nickname}
                              </div>
                              <div className="text-lg text-[#409192]">
                                {item.buyer?.depositName}
                              </div>
                            </div>

                            <Image
                              src="/verified.png"
                              alt="Verified"
                              width={20}
                              height={20}
                              className="rounded-lg"
                            />

                            <Image
                              src="/best-buyer.png"
                              alt="Best Buyer"
                              width={20}
                              height={20}
                              className="rounded-lg"
                            />

                          </p>


                          {address && item.walletAddress !== address && item?.buyer && item?.buyer?.walletAddress === address && (
                            <button
                              className="bg-green-500 text-white px-4 py-2 rounded-lg"
                              onClick={() => {
                                  //console.log('Buy USDT');
                                  // go to chat
                                  // close modal
                                  //closeModal();
                                  ///goChat(item._id, item.tradeId);

                                  router.push(`/${params.lang}/${"admin"}/sell-usdt/${item._id}`);

                              }}
                            >
                              {Chat_with_Buyer + ' ' + item.nickname}
                            </button>
                          )}


                        </div>




                        {/* buyer cancelled the trade */}
                        {item.status === 'cancelled' && (
                          <div className="mt-4 flex flex-col gap-2 items-start justify-center">
                            <div className="flex flex-row items-center gap-2">
                              <Image
                                src={item?.buyer?.avatar || "/profile-default.png"}
                                alt="Profile Image"
                                width={32}
                                height={32}
                                priority={true} // Added priority property
                                className="rounded-full"
                                style={{
                                    objectFit: 'cover',
                                    width: '32px',
                                    height: '32px',
                                }}
                              />
                              <p className="text-sm text-red-500 font-semibold">
                                {Buyer}: {
                                  address && item?.buyer?.nickname ? item?.buyer?.nickname : Anonymous
                                }
                              </p>

                            </div>


                          </div>
                        )}



                        {(item.status === 'accepted' || item.status === 'paymentRequested') && (
                    
                          <div className="mt-4 flex flex-row items-center gap-2">
                            <Image
                              src={item.seller?.avatar || "/profile-default.png"}
                              alt="Profile Image"
                              width={32}
                              height={32}
                              priority={true} // Added priority property
                              className="rounded-full"
                              style={{
                                  objectFit: 'cover',
                                  width: '32px',
                                  height: '32px',
                              }}
                            />
                            <p className="text-xl text-[#409192] font-semibold">
                              {Seller}: {
                                item.seller?.nickname
                              }
                            </p>
                            <Image
                              src="/verified.png"
                              alt="Verified"
                              width={20}
                              height={20}
                              className="rounded-lg"
                            />
                          </div>
                        
                        )}
                      

                        {/* waiting for escrow */}
                        {item.status === 'accepted' && (



                          <div className="mt-4 flex flex-col gap-2 items-center justify-start">


                              
                              
                            <div className="mt-4 flex flex-row gap-2 items-center justify-start">
                              <Image
                                src="/loading.png"
                                alt="Escrow"
                                width={32}
                                height={32}
                                className="animate-spin"
                              />

                              <div className="flex flex-col gap-2 items-start">
                                <span>
                                  {Waiting_for_seller_to_deposit} {item.usdtAmount} USDT {to_escrow}...
                                </span>

                                <span className="text-sm text-zinc-500">

                                  {If_the_seller_does_not_deposit_the_USDT_to_escrow},

                                  {this_trade_will_be_cancelled_in} {

                                    (1 - Math.floor((new Date().getTime() - new Date(item.acceptedAt).getTime()) / 1000 / 60 / 60) - 1) > 0
                                    ? (1 - Math.floor((new Date().getTime() - new Date(item.acceptedAt).getTime()) / 1000 / 60 / 60) - 1) + ' ' + hours
                                    : (60 - Math.floor((new Date().getTime() - new Date(item.acceptedAt).getTime()) / 1000 / 60) % 60) + ' ' + minutes

                                  } 

                                </span>
                              </div>
                            </div>





                            {item.buyer?.walletAddress === address && (

                              <div className="mt-4 flex flex-col items-center justify-center gap-2">



                                <div className="flex flex-row items-center gap-2">
                                  <input
                                    type="checkbox"
                                    checked={agreementForCancelTrade[index]}
                                    onChange={(e) => {
                                      setAgreementForCancelTrade(
                                        buyOrders.map((item, idx) => {
                                          if (idx === index) {
                                            return e.target.checked;
                                          } else {
                                            return false;
                                          }
                                        })
                                      );
                                    }}
                                  />
                                  <label className="text-sm text-zinc-500">
                                    {I_agree_to_cancel_the_trade}
                                  </label>
                                </div>


                                <div className="mt-5 flex flex-row items-center gap-2">

                                  <button
                                    disabled={cancellings[index] || !agreementForCancelTrade[index]}
                                    className={`text-sm bg-red-500 text-white px-2 py-1 rounded-md ${cancellings[index] || !agreementForCancelTrade[index] ? 'opacity-50 cursor-not-allowed' : 'hover:bg-red-600'}`}
                                    onClick={() => {

                                      cancelTrade(item._id, index);

                                    }}
                                  >

                                    <div className="flex flex-row items-center gap-2 px-2 py-1">
                                      {cancellings[index] ? (
                                        <div className="
                                          w-4 h-4
                                          border-2 border-zinc-800
                                          rounded-full
                                          animate-spin
                                        ">
                                          <Image
                                            src="/loading.png"
                                            alt="loading"
                                            width={16}
                                            height={16}
                                          />
                                        </div>
                                      ) : (
                                        <Image
                                          src="/icon-cancelled.png"
                                          alt="Cancel"
                                          width={16}
                                          height={16}
                                        />
                                      )}
                                      {Cancel_My_Trade}
                                    </div>
                                      
                                  
                                  </button>
                                </div>

                              </div>

                            )}


                          </div>
                        )}



                        {/* if status is accepted, show payment request button */}
                        {item.status === 'paymentConfirmed' && (
                          <div className="flex flex-col gap-1">
                            <span className="text-sm font-semibold text-[#409192]">
                              {Completed}
                            </span>
                            <span>{
                              item.paymentConfirmedAt && new Date(item.paymentConfirmedAt)?.toLocaleString()
                            }</span>
                          </div>
                        )}

                        {
                        item.seller && item.seller.walletAddress === address &&
                        item.status === 'accepted' && (
                          <div className="flex flex-row gap-1">

                            {/* check box for agreement */}
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
                                  item.usdtAmount,
                                  item.storecode,

                                  item.seller?.bankInfo,
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

                          </div>
                        )}


                        {/* waiting for payment */}
                        {item.status === 'paymentRequested' && (

                            <div className="mt-4 flex flex-col gap-2 items-start justify-start">

                              <div className="flex flex-row items-center gap-2">

                                <Image
                                  src="/smart-contract.png"
                                  alt="Smart Contract"
                                  width={32}
                                  height={32}
                                />
                                <div>{Escrow}: {item.usdtAmount} USDT</div>
                                <button
                                  className="bg-white text-black px-2 py-2 rounded-md"
                                  onClick={() => {
                        
                                      window.open(`https://arbiscan.io/tx/${item.escrowTransactionHash}`);
                                      


                                  }}
                                >
                                  <Image
                                    src='/logo-arbitrum.png'
                                    alt="Chain"
                                    width={20}
                                    height={20}
                                  />
                                </button>
                              </div>

                              <div className="flex flex-row gap-2 items-center justify-start">

                                {/* rotate loading icon */}
                              
                                <Image
                                  src="/loading.png"
                                  alt="Escrow"
                                  width={32}
                                  height={32}
                                  className="animate-spin"
                                />

                                <div>Waiting for buyer to send {
                                item.krwAmount?.toLocaleString('ko-KR', {
                                  style: 'currency',
                                  currency: 'KRW',
                                })} to seller...</div>
                              

                              </div>


                            </div>
                        )}



                      





                        {item.status === 'ordered' && (
                          <>

                          {acceptingBuyOrder[index] ? (

                            <div className="flex flex-row items-center gap-2">
                              <Image
                                src='/loading.png'
                                alt='loading'
                                width={35}
                                height={35}
                                className="animate-spin"
                              />
                              <div>{Accepting_Order}...</div>
                            </div>


                          ) : (
                            <>
                              
                              {item.walletAddress === address ? (
                                <div className="flex flex-col space-y-4">
                                  {My_Order}
                                </div>
                              ) : (
                                <div className="w-full flex items-center justify-center">

                                  {item.status === 'ordered' && (
                                    
                                    // check if the order is expired
                                    new Date().getTime() - new Date(item.createdAt).getTime() > 1000 * 60 * 60 * 24

                                  ) ? (

                                    <>
                                      {/*
                                      <Image
                                        src="/icon-expired.png"
                                        alt="Expired"
                                        width={80}
                                        height={80}
                                      />
                                      */}
                                  
                                  </>
                                  ) : (
                                    <>

                                      {user?.seller && user?.seller?.bankInfo && (

          

                                        <div className="mt-4 flex flex-col items-center justify-center">

                                          {/* agreement for trade */}
                                          <div className="flex flex-row items-center space-x-2">
                                            <input
                                              disabled={!address}
                                              type="checkbox"
                                              checked={agreementForTrade[index]}
                                              onChange={(e) => {
                                                  setAgreementForTrade(
                                                      buyOrders.map((item, idx) => {
                                                          if (idx === index) {
                                                              return e.target.checked;
                                                          } else {
                                                              return false;
                                                          }
                                                      })
                                                  );
                                              }}
                                            />
                                            <label className="text-sm text-zinc-500">
                                              {I_agree_to_the_terms_of_trade}
                                            </label>
                                          </div>



                                          {/* input sms receiver mobile number */}

                                          {address && agreementForTrade[index] && (
                                            <div className="mt-8 flex flex-row items-center justify-start gap-2">

                                              <span className="text-sm text-zinc-500">SMS</span>

                                              <div className="flex flex-col items-start justify-start">
                                                <input
                                                  disabled={!address || !agreementForTrade[index]}
                                                  type="text"
                                                  placeholder="SMS Receiver Mobile Number"
                                                  className={`w-full px-4 py-2 rounded-md text-black`}
                                                  value={smsReceiverMobileNumber}
                                                  onChange={(e) => {
                                                      setSmsReceiverMobileNumber(e.target.value);
                                                  }}
                                                />
                                              </div>
                                            </div>
                                          )}

                                          <button
                                            disabled={!address || !agreementForTrade[index]}
                                            className={`m-10 text-lg text-white px-4 py-2 rounded-md
                                              ${!address || !agreementForTrade[index] ? 'bg-zinc-800' : 'bg-green-500 hover:bg-green-600'}
                                              `}
                                            onClick={() => {
  
                                                acceptBuyOrder(index, item._id, smsReceiverMobileNumber);
                                          

                                            }}
                                          >
                                            {Buy_Order_Accept} {item.usdtAmount} USDT
                                          </button>


                                        </div>

                                      )}

                                    </>

                                  )}

                                </div>



                                )}

                              </>

                            )}

                          </>

                        )}



                    </article>




                    {/* status */}
                    {/*
                    <div className="absolute bottom-4 right-4 flex flex-row items-start justify-start">
                      <div className="text-sm text-zinc-500">
                        {item.status === 'ordered' ? 'Order opened at ' + new Date(item.createdAt)?.toLocaleString()
                        : item.status === 'accepted' ? 'Trade started at ' + new Date(item.acceptedAt)?.toLocaleString()
                        : item.status === 'paymentRequested' ? 'Payment requested at ' + new Date(item.paymentRequestedAt)?.toLocaleString()
                        : item.status === 'cancelled' ? 'Trade cancelled at ' + new Date(item.cancelledAt)?.toLocaleString()
                        : item.status === 'paymentConfirmed' ? 'Trade completed at ' + new Date(item.paymentConfirmedAt)?.toLocaleString()
                        : 'Unknown'}
                      </div>
                    </div>
                    */}






                  </div>
            
                ))}

            </div>

          )}

          


        </div>

      

        <div className="mt-6 flex w-full flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-sm text-zinc-600">
            <span>페이지당</span>
            <select
              value={parsedLimitValue}
              onChange={(e) => {
                router.push(buildBuyorderQuery({
                  limit: Number(e.target.value),
                  page: 1,
                }));
              }}
              className="h-9 rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-700 focus:border-zinc-400 focus:outline-none"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2">
            <span className="mr-2 text-sm text-zinc-500">
              {currentPageStart.toLocaleString()}-{currentPageEnd.toLocaleString()} / {Number(totalCount).toLocaleString()}건
            </span>

            <button
              disabled={currentPage <= 1}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                currentPage <= 1
                  ? 'cursor-not-allowed bg-zinc-100 text-zinc-400'
                  : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
              }`}
              onClick={() => {
                router.push(buildBuyorderQuery({ page: 1 }));
              }}
            >
              처음
            </button>

            <button
              disabled={currentPage <= 1}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                currentPage <= 1
                  ? 'cursor-not-allowed bg-zinc-100 text-zinc-400'
                  : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
              }`}
              onClick={() => {
                router.push(buildBuyorderQuery({ page: currentPage - 1 }));
              }}
            >
              이전
            </button>

            <span className="min-w-[70px] text-center text-sm font-medium text-zinc-700">
              {currentPage} / {totalPages}
            </span>

            <button
              disabled={currentPage >= totalPages}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                currentPage >= totalPages
                  ? 'cursor-not-allowed bg-zinc-100 text-zinc-400'
                  : 'bg-zinc-900 text-white hover:bg-zinc-700'
              }`}
              onClick={() => {
                router.push(buildBuyorderQuery({ page: currentPage + 1 }));
              }}
            >
              다음
            </button>

            <button
              disabled={currentPage >= totalPages}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                currentPage >= totalPages
                  ? 'cursor-not-allowed bg-zinc-100 text-zinc-400'
                  : 'bg-zinc-900 text-white hover:bg-zinc-700'
              }`}
              onClick={() => {
                router.push(buildBuyorderQuery({ page: totalPages }));
              }}
            >
              마지막
            </button>
          </div>

        </div>



        <div className="w-full flex flex-col items-center justify-center gap-4 p-4 bg-white shadow-md rounded-lg mt-5">
          <div className="text-sm text-zinc-600">
            © 2024 Stable Makeup. All rights reserved.
          </div>
          <div className="text-sm text-zinc-600">
            <a href={`/${params.lang}/terms-of-service`} className="text-blue-500 hover:underline">
              이용약관
            </a>
            {' | '}
            <a href={`/${params.lang}/privacy-policy`} className="text-blue-500 hover:underline">
              개인정보처리방침
            </a>
            {' | '}
            <a href={`/${params.lang}/contact`} className="text-blue-500 hover:underline">
              고객센터
            </a>
          </div>
        </div> 


      </div>



              {/*
        <Modal isOpen={isModalOpen} onClose={closeModal}>
            <TradeDetail
                closeModal={closeModal}
                //goChat={goChat}
            />
        </Modal>
        */}


        <ModalUser isOpen={isModalOpen} onClose={closeModal}>
            <UserPaymentPage
                closeModal={closeModal}
                selectedItem={selectedItem}
            />
        </ModalUser>

        {/* 거래상세 모달 */}
        <Modal isOpen={tradeDetailOpen} onClose={closeTradeDetailModal}>
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-zinc-900">거래상세</h3>
              <button
                onClick={closeTradeDetailModal}
                className="text-xs px-3 py-1 rounded-md border border-zinc-200 text-zinc-600 hover:bg-zinc-100 transition"
              >
                닫기
              </button>
            </div>

            {tradeDetailLoading && (
              <div className="flex items-center gap-2 text-sm text-zinc-500">
                <Image src="/loading.png" alt="loading" width={20} height={20} className="w-5 h-5 animate-spin" />
                불러오는 중...
              </div>
            )}

            {!tradeDetailLoading && !tradeDetailData && (
              <div className="text-sm text-zinc-500">표시할 거래 정보가 없습니다.</div>
            )}

            {!tradeDetailLoading && tradeDetailData && (
              <div className="space-y-3 text-sm text-zinc-700">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500">거래번호</span>
                  <span className="px-2 py-1 rounded-md border border-zinc-200 bg-zinc-50 font-mono text-xs">
                    {tradeDetailData.tradeId || '-'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500">상태</span>
                  <span className="font-semibold">{tradeDetailData.status || '-'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500">구매자 닉네임</span>
                  <span className="font-semibold">
                    {tradeDetailData?.buyer?.nickname || '-'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500">입금자명</span>
                  <span className="font-semibold">{tradeDetailData?.buyer?.depositName || '-'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500">USDT</span>
                  <span className="font-semibold text-emerald-700" style={{ fontFamily: 'monospace' }}>
                    {(tradeDetailData?.usdtAmount ?? 0).toLocaleString(undefined, { minimumFractionDigits: 3, maximumFractionDigits: 3 })}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500">KRW</span>
                  <span className="font-semibold text-amber-600" style={{ fontFamily: 'monospace' }}>
                    {(tradeDetailData?.krwAmount ?? tradeDetailData?.paymentAmount ?? 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500">거래일시</span>
                  <span className="font-semibold">
                    {formatKstDateTime(tradeDetailData?.createdAt)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500">가맹점</span>
                  <span className="font-semibold">
                    {tradeDetailData?.store?.storeName || tradeDetailData?.storecode || '-'}
                  </span>
                </div>
              </div>
            )}
          </div>
        </Modal>

        {/* 별칭 계좌 이력 패널 (좌측 슬라이드) */}
        <div
          className={`fixed inset-0 z-50 transition-all duration-300 ${
            aliasPanelOpen ? 'pointer-events-auto' : 'pointer-events-none'
          }`}
        >
          {/* dimmed background */}
          <div
            className={`absolute inset-0 bg-black/30 transition-opacity duration-300 ${
              aliasPanelOpen ? 'opacity-100' : 'opacity-0'
            }`}
            onClick={closeAliasPanel}
          />

          {/* panel */}
          <div
            className={`absolute inset-y-0 left-0 bg-white shadow-2xl w-full sm:w-[500px] max-w-[560px] h-full overflow-y-auto transition-transform duration-300 ease-out ${
              aliasPanelOpen ? 'translate-x-0' : '-translate-x-full'
            }`}
          >
            <div className="sticky top-0 z-10 bg-gradient-to-b from-white to-zinc-50 border-b border-zinc-200 shadow-sm">
              <div className="p-4 flex flex-col gap-3">
                <button
                  className="self-start text-sm px-3 py-1.5 rounded-md border border-zinc-200 hover:bg-zinc-100 active:scale-95 transition"
                  onClick={closeAliasPanel}
                >
                  닫기
                </button>

                <div className="flex flex-col gap-1">
                  <span className="text-xs uppercase tracking-wide text-zinc-500">
                    사용계좌번호
                  </span>
                  <span className="text-xl font-extrabold text-zinc-900" style={{ fontFamily: 'monospace' }}>
                    {aliasPanelAliasNumber || aliasPanelAccountNumber || '-'}
                  </span>
                  <span className="text-[11px] uppercase tracking-wide text-zinc-400 mt-2">
                    실계좌번호
                  </span>
                  <span className="text-sm font-semibold text-zinc-500" style={{ fontFamily: 'monospace' }}>
                    {aliasPanelAccountNumber || '-'}
                  </span>
                  {(aliasPanelBankName || aliasPanelAccountHolder) && (
                    <span className="text-sm font-semibold text-zinc-700">
                      {aliasPanelBankName || '은행명 없음'} · {aliasPanelAccountHolder || '예금주 없음'}
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-1 bg-zinc-100 rounded-lg p-1">
                    {[
                      { key: 'all', label: '전체' },
                      { key: 'matched', label: '정상입금' },
                      { key: 'unmatched', label: '미신청입금' },
                    ].map((opt) => (
                      <button
                        key={opt.key}
                        className={`px-3 py-1 text-xs rounded-md transition ${
                          aliasPanelMatchFilter === opt.key
                            ? 'bg-white shadow-sm border border-zinc-200 font-semibold'
                            : 'text-zinc-600'
                        }`}
                        onClick={() => {
                          setAliasPanelMatchFilter(opt.key as any);
                          fetchDepositsByAccount(
                            aliasPanelAccountNumber,
                            {
                              bankName: aliasPanelBankName,
                              accountHolder: aliasPanelAccountHolder,
                              aliasAccountNumber: aliasPanelAliasNumber || aliasPanelAccountNumber,
                              defaultAccountNumber: aliasPanelAliasNumber || aliasPanelAccountNumber,
                              realAccountNumber: aliasPanelAccountNumber,
                            },
                            opt.key as any,
                            1,
                            false
                          );
                        }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-2 text-sm font-semibold">
                  <span className="text-xs text-zinc-500">
                    조회기간 {searchFromDate} ~ {searchToDate}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 rounded-md bg-zinc-100 text-zinc-700">
                      건수 {aliasPanelTotalCount.toLocaleString()}
                    </span>
                    <span className="px-3 py-2 rounded-md bg-amber-50 text-amber-600" style={{ fontFamily: 'monospace' }}>
                      합계 {aliasPanelTotalAmount?.toLocaleString()} 원
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3 px-4 pt-4">

              <div className="flex items-center justify-between text-xs text-zinc-500">
                <span>검색결과입니다.</span>
                <button
                  className="px-2 py-1 rounded-md border border-zinc-200 text-[11px] text-zinc-600 hover:bg-zinc-100 active:scale-95 transition"
                  onClick={() =>
                    fetchDepositsByAccount(
                      aliasPanelAccountNumber,
                      {
                        bankName: aliasPanelBankName,
                        accountHolder: aliasPanelAccountHolder,
                        aliasAccountNumber: aliasPanelAliasNumber || aliasPanelAccountNumber,
                        defaultAccountNumber: aliasPanelAliasNumber || aliasPanelAccountNumber,
                        realAccountNumber: aliasPanelAccountNumber,
                      },
                      aliasPanelMatchFilter,
                      1,
                      false
                    )
                  }
                >
                  새로고침
                </button>
              </div>

              {aliasPanelError && (
                <div className="text-sm text-red-600 mb-3">오류: {aliasPanelError}</div>
              )}

              {!aliasPanelLoading && !aliasPanelError && aliasPanelTransfers.length === 0 && (
                <div className="text-sm text-zinc-500">표시할 이력이 없습니다.</div>
              )}

              <div className="space-y-3">
                {aliasPanelTransfers.map((trx: any, idx: number) => (
                  <div
                    key={trx._id || idx}
                    className="flex items-center justify-between gap-2 rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs"
                  >
                    {(() => {
                      const matchInfo = getMatchStatusInfo(trx.match);
                      const descendingIndex = aliasPanelTotalCount
                        ? aliasPanelTotalCount - idx
                        : aliasPanelTransfers.length - idx;
                      return (
                        <>
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="w-6 text-center text-[11px] text-zinc-400">
                              {descendingIndex}.
                            </span>
                            <span className={`px-2 py-0.5 rounded-full leading-none ${matchInfo.className}`}>
                              {matchInfo.label}
                            </span>
                            <div className="flex flex-col leading-tight">
                              <span className="font-semibold text-zinc-900 truncate">
                                {trx.transactionName || '-'}
                              </span>
                              <span className="text-[11px] text-zinc-500 truncate">
                                {trx.buyerInfo?.nickname || '-'}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-semibold text-emerald-700" style={{ fontFamily: 'monospace' }}>
                              {trx.amount !== undefined ? Number(trx.amount).toLocaleString() : '-'}
                            </span>
                            <span className="text-[11px] text-zinc-500 whitespace-nowrap">
                              {formatKstDateTime(trx.transactionDateUtc || trx.regDate)}
                            </span>
                            {trx.tradeId && (
                              <button
                                className="px-2 py-0.5 rounded-md border border-emerald-200 bg-emerald-50 text-emerald-700 font-mono text-[11px] hover:bg-emerald-100"
                                onClick={() => openTradeDetailModal(trx.tradeId)}
                              >
                                {trx.tradeId}
                              </button>
                            )}
                          </div>
                        </>
                      );
                    })()}
                  </div>
                ))}
              </div>

              <div ref={aliasPanelLoadMoreRef} className="h-10 flex items-center justify-center text-xs text-zinc-400">
                {aliasPanelLoading
                  ? '불러오는 중...'
                  : aliasPanelHasMore
                    ? '아래로 스크롤하면 더 보기'
                    : '더 이상 내역이 없습니다.'}
              </div>
            </div>
          </div>
        </div>



    </main>
    </>

  );


};




const UserPaymentPage = (
  {
      closeModal = () => {},
      selectedItem = null as {
        _id: string;
        nickname: string;
        storecode: string;
        buyer?: {
          depositBankName?: string;
          depositBankAccountNumber?: string;
          depositName?: string
        }
      } | null,
  }
) => {

  return (
    <div className="w-full flex flex-col items-center justify-center gap-4">
      <h1 className="text-2xl font-semibold">상세정보</h1>
      
      {/* iframe */}
      <iframe
        src={`${paymentUrl}/ko/${clientId}/${selectedItem?.storecode}/pay-usdt-reverse/${selectedItem?._id}`}

        
          
        width="400px"
        height="500px"
        className="border border-zinc-300 rounded-lg"
        title="Page"
      ></iframe>


      <button
        onClick={closeModal}
        className="bg-[#3167b4] text-white px-4 py-2 rounded-lg hover:bg-[#3167b4]/80"
      >
        닫기
      </button>
    </div>
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
    const receiveAmount = (amount / price).toFixed(3);
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
