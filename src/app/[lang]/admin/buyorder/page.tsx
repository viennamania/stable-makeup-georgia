'use client';

import React, { useState, useEffect, use, act, useRef, useMemo, useCallback } from "react";
import Image from "next/image";

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
  sendBatchTransaction,

  readContract,
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





import { getUserPhoneNumber } from "thirdweb/wallets/in-app";


import { balanceOf, transfer } from "thirdweb/extensions/erc20";
import { add } from "thirdweb/extensions/farcaster/keyGateway";

import * as XLSX from "xlsx";


import AppBarComponent from "@/components/Appbar/AppBar";
import { getDictionary } from "../../../dictionaries";
//import Chat from "@/components/Chat";
import { ClassNames } from "@emotion/react";


import useSound from 'use-sound';

import { useSearchParams } from 'next/navigation';

import { getAllUsersForSettlementOfStore } from "@/lib/api/user";


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

// status → pulse utility
const statusPulseClass = (status: string | undefined) => {
  switch (status) {
    case 'ordered':
      return 'status-pulse-gray';
    case 'paymentRequested':
      return 'status-pulse-amber';
    case 'paymentConfirmed':
    case 'paymentSettled':
      return 'status-pulse-emerald';
    case 'cancelled':
    case 'canceled':
      return 'status-pulse-rose';
    default:
      return '';
  }
};

const statusCardTone = (status: string | undefined, settlement?: any) => {
  // Treat settlement completion even when status remains paymentConfirmed
  const isSettled = status === 'paymentConfirmed' && !!settlement?.txid;
  switch (status) {
    case 'paymentRequested':
      return 'bg-amber-50 border-amber-200 hover:bg-amber-100';
    case 'accepted':
      return 'bg-sky-50 border-sky-200 hover:bg-sky-100';
    case 'paymentConfirmed':
      return isSettled
        ? 'bg-zinc-50 border-zinc-200 hover:bg-zinc-100'
        : 'bg-emerald-50 border-emerald-200 hover:bg-emerald-100';
    case 'cancelled':
    case 'canceled':
      return 'bg-rose-50 border-rose-200 hover:bg-rose-100';
    default:
      return 'bg-zinc-50 border-zinc-200 hover:bg-zinc-100';
  }
};

const RevealText: React.FC<{ value: any; className?: string; children: React.ReactNode }> = ({
  value,
  className = '',
  children,
}) => {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    setTick((t) => t + 1); // force re-mount to replay animation on value change/appear
  }, [value]);
  return (
    <span
      key={tick}
      className={`content-reveal inline-block ${className}`}
      style={{ animation: 'contentReveal 0.4s ease-out, flashReveal 0.6s ease-out' }}
    >
      {children}
    </span>
  );
};


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
  paymentAmount: number;
  cancelledAt: string;


  buyer: any;

  canceller: string;

  escrowTransactionHash: string;
  transactionHash: string;

  storecode: string;
  store: any;

  settlement: any;

  agentFeeRate: number;
  centerFeeRate: number;
  tradeFeeRate: number;

  cancelTradeReason: string;


  autoConfirmPayment: boolean;

  agent: any;

  userStats: any;


  settlementUpdatedAt: string;
  settlementUpdatedBy: string; // who updates the settlement

  transactionHashFail: boolean; // if the transaction failed, set this to true

  audioOn: boolean; // default true, used for audio notification in trade history page



  paymentMethod: string;

  escrowWallet: {
    address: string;
    balance: number;
    transactionHash: string;
  };

  sellerWalletAddressBalance: number; // balance of seller wallet address, added in version 1.1.5

  userType: string; // added in version 1.2.0, user type (e.g., AAA, BBB, CCC, DDD, EEE)
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




export default function Index({ params }: any) {

  const searchParams = useSearchParams()!;
 
  

  // limit, page number params
  /*
  const limit = searchParams.get('limit') || 20;
  const page = searchParams.get('page') || 1;

  useEffect(() => {
    if (searchParams.get('limit')) {
      setLimitValue(searchParams.get('limit') || 20);
    }
    if (searchParams.get('page')) {
      setPageValue(searchParams.get('page') || 1);
    }
  }, [searchParams]);
  */


 




  const searchParamsStorecode = searchParams.get('storecode') || "";


  const activeWallet = useActiveWallet();


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
    chain: bsc,

    // the contract's address
    address: bscContractAddressMKRW,

    // OPTIONAL: the contract's abi
    //abi: [...],
  });






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
  }, []);
 




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

  
  useEffect(() => {

    if (address) {

  

      //const phoneNumber = await getUserPhoneNumber({ client });
      //setPhoneNumber(phoneNumber);


      getUserPhoneNumber({ client }).then((phoneNumber) => {
        setPhoneNumber(phoneNumber || "");
      });

    }

  } , [address]);
  


  //const [nativeBalance, setNativeBalance] = useState(0);
  /*
  const [balance, setBalance] = useState(0);
  useEffect(() => {

    // get the balance
    const getBalance = async () => {

      if (!address) {
        setBalance(0);
        return;
      }

      
      const result = await balanceOf({
        contract,
        address: address,
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
  */



  // balance of MKRW
  /*
  const [mkrwBalance, setMkrwBalance] = useState(0);
  useEffect(() => {
    if (!address) {
      return;
    }
    // get the balance
    const getMkrwBalance = async () => {
      const result = await balanceOf({
        contract: contractMKRW,
        address: address,
      });
  
      setMkrwBalance( Number(result) / 10 ** 18 );

  
    };
    if (address) getMkrwBalance();
    const interval = setInterval(() => {
      if (address) getMkrwBalance();
    } , 5000);
    return () => clearInterval(interval);
  }, [address, contractMKRW]);
  */










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
        storecode: "admin",
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




  // get escrow wallet address and balance
  
  const [escrowBalance, setEscrowBalance] = useState(0);
  const [escrowNativeBalance, setEscrowNativeBalance] = useState(0);

  
  useEffect(() => {

    const getEscrowBalance = async () => {

      if (!address) {
        setEscrowBalance(0);
        return;
      }

      if (!escrowWalletAddress || escrowWalletAddress === '') return;


      
      const result = await balanceOf({
        contract,
        address: escrowWalletAddress,
      });

      //console.log('escrowWalletAddress balance', result);

  
      setEscrowBalance( Number(result) / 10 ** 6 );
            


      /*
      await fetch('/api/user/getUSDTBalanceByWalletAddress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          storecode: "admin",
          walletAddress: escrowWalletAddress,
        }),
      })
      .then(response => response?.json())
      .then(data => {

        console.log('getUSDTBalanceByWalletAddress data.result.displayValue', data.result?.displayValue);

        setEscrowBalance(data.result?.displayValue);

      } );
       */




      await fetch('/api/user/getBalanceByWalletAddress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          storecode: "admin",
          walletAddress: escrowWalletAddress,
        }),
      })
      .then(response => response?.json())
      .then(data => {


        ///console.log('getBalanceByWalletAddress data', data);


        setEscrowNativeBalance(data.result?.displayValue);

      });
      



    };

    getEscrowBalance();

    const interval = setInterval(() => {
      getEscrowBalance();
    } , 5000);

    return () => clearInterval(interval);

  } , [address, escrowWalletAddress, contract,]);
  

  //console.log('escrowBalance', escrowBalance);







  

  // get User by wallet address
  const [isAdmin, setIsAdmin] = useState(false);

  const [user, setUser] = useState<any>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  
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
            storecode: "admin",
            walletAddress: address,
        }),
    })
    .then(response => response.json())
    .then(data => {
        
        //console.log('data.result', data.result);


        setUser(data.result);

        setEscrowWalletAddress(data.result.escrowWalletAddress);

        setIsAdmin(data.result?.role === "admin");

    })
    .catch((error) => {
        console.error('Error:', JSON.stringify(error));
    });


    setLoadingUser(false);

  } , [address]);



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

  
  
  
  
const [searchStorecode, setSearchStorecode] = useState("");
useEffect(() => {
  setSearchStorecode(searchParamsStorecode || "");
}, [searchParamsStorecode]);

const [prioritizePending, setPrioritizePending] = useState(true);






  const [searchStoreName, setSearchStoreName] = useState("");




  const [searchOrderStatusCancelled, setSearchOrderStatusCancelled] = useState(false);
  const [searchOrderStatusCompleted, setSearchOrderStatusCompleted] = useState(false);


  const [searchMyOrders, setSearchMyOrders] = useState(false);






  /*
  // search form date to date
  const [searchFormDate, setSearchFormDate] = useState("");
  // from date is not today, but today - 30 days
  useEffect(() => {
    
    ///from date isAdmin not today, but today - 30 days
    const today = new Date();
    const formattedDate = new Date(today.setDate(today.getDate() - 30)).toISOString().split('T')[0]; // YYYY-MM-DD format
    setSearchFormDate(formattedDate);
  }, []);



  const [searchToDate, setSearchToDate] = useState("");
  useEffect(() => {
    const today = new Date();
    const toDate = new Date(today.setDate(today.getDate() + 1)); // add 1 day to today
    setSearchToDate(toDate.toISOString().split('T')[0]); // YYYY-MM-DD format
  }, []);
  */



  /*
  // limit number
  const [limitValue, setLimitValue] = useState(limit || 20);

  // page number
  const [pageValue, setPageValue] = useState(page || 1);
  */

 const [limitValue, setLimitValue] = useState(20);
  useEffect(() => {
    const limit = searchParams.get('limit') || 20;
    setLimitValue(Number(limit));
  }, [searchParams]);



  const [pageValue, setPageValue] = useState(1);
  useEffect(() => {
    const page = searchParams.get('page') || 1;
    setPageValue(Number(page));
  }, [searchParams]);



  const today = new Date();
  today.setHours(today.getHours() + 9); // Adjust for Korean timezone (UTC+9)
  const formattedDate = today.toISOString().split('T')[0]; // YYYY-MM-DD format

  // search form date to date
  const [searchFromDate, setSearchFormDate] = useState(formattedDate);
  const [searchToDate, setSearchToDate] = useState(formattedDate);





  //const [totalCount, setTotalCount] = useState(0);
    
const [buyOrders, setBuyOrders] = useState<BuyOrder[]>([]);
  const priorityStatusSet = useMemo(() => new Set(['ordered', 'paymentRequested']), []);
  const prioritizeOrderList = useCallback((orders: BuyOrder[]) => {
    if (!prioritizePending) return orders;
    return orders
      .map((o, idx) => ({
        o,
        idx,
        p: priorityStatusSet.has(o.status) ? 0 : 1,
      }))
      .sort((a, b) => a.p - b.p || a.idx - b.idx)
      .map((x) => x.o);
  }, [prioritizePending, priorityStatusSet]);

  const applyBuyOrders = useCallback((orders: BuyOrder[]) => {
    setBuyOrders(prioritizeOrderList(orders));
  }, [prioritizeOrderList]);

  // re-apply ordering when preference changes
  useEffect(() => {
    setBuyOrders((prev) => prioritizeOrderList(prev));
  }, [prioritizeOrderList]);

  const [recentlyAddedIds, setRecentlyAddedIds] = useState<Set<string>>(new Set());
  const [recentlyAddedDirection, setRecentlyAddedDirection] = useState<Record<string, 'top' | 'bottom'>>({});
  const prevBuyOrderIdsRef = useRef<Set<string>>(new Set());
  const prevStatusMapRef = useRef<Record<string, string>>({});
  const [recentStatusChange, setRecentStatusChange] = useState<Record<string, string>>({});
  const [showJackpot, setShowJackpot] = useState(false);
  const [jackpotMessage, setJackpotMessage] = useState<string>('입금이 완료되었습니다.');
  const [jackpotStoreName, setJackpotStoreName] = useState<string>('');
  const [jackpotStoreLogo, setJackpotStoreLogo] = useState<string>('/icon-store.png');
  const [jackpotDepositor, setJackpotDepositor] = useState<string>('');
  const [jackpotKrw, setJackpotKrw] = useState<number>(0);
  const [jackpotUsdt, setJackpotUsdt] = useState<number>(0);
  const lastJackpotRef = useRef<{ id: string | null; time: number }>({ id: null, time: 0 });

  const jackpotDoneRef = useRef<Set<string>>(new Set());

  const triggerJackpot = (order?: BuyOrder) => {
    if (!order) return;
    if (!user?.isJackpotAnimationOn) return;
    if (order._id && jackpotDoneRef.current.has(order._id)) return;
    const now = Date.now();
    if (lastJackpotRef.current.id === order._id && now - lastJackpotRef.current.time < 1500) {
      return; // prevent double flashing on rapid successive updates of same order
    }
    if (order._id) {
      jackpotDoneRef.current.add(order._id); // mark as already celebrated
    }
    const amount = order.krwAmount ?? 0;
    const usdt = order.usdtAmount ?? 0;
    const depositor = order.buyer?.depositName || order.buyer?.name || '';
    setJackpotDepositor(depositor || '');
    setJackpotKrw(amount);
    setJackpotUsdt(usdt);
    setJackpotMessage('결제가 완료되었습니다.');
    setJackpotStoreName(order.store?.storeName || '');
    setJackpotStoreLogo(order.store?.storeLogo || '/icon-store.png');
    setShowJackpot(true);
    setTimeout(() => setShowJackpot(false), 3000);
    lastJackpotRef.current = { id: order._id, time: now };
  };

  // track newly added rows to animate them
  useEffect(() => {
    let jackpotTriggered = false;
    const currentIds = new Set(buyOrders.map((o) => o._id));
    const added = buyOrders
      .filter((o) => !prevBuyOrderIdsRef.current.has(o._id))
      .map((o) => o._id);
    const statusChanged: string[] = [];
    const currentStatusMap: Record<string, string> = {};
    buyOrders.forEach((o) => {
      currentStatusMap[o._id] = o.status;
      if (prevStatusMapRef.current[o._id] && prevStatusMapRef.current[o._id] !== o.status) {
        statusChanged.push(o._id);
      }
    });

    if (added.length) {
      // decide slide direction per added row (top if near start, bottom otherwise)
      setRecentlyAddedDirection((prev) => {
        const next = { ...prev };
        added.forEach((id) => {
          const idx = buyOrders.findIndex((o) => o._id === id);
          next[id] = idx <= 1 ? 'top' : 'bottom';
        });
        return next;
      });

      setRecentlyAddedIds((prev) => {
        const next = new Set(prev);
        added.forEach((id) => next.add(id));
        const jackpotStates = ['paymentCompleted', 'paymentConfirmed', 'paymentSettled'];
        const jackpotOrder = added
          .map((id) => buyOrders.find((o) => o._id === id))
          .find((order) => order && jackpotStates.includes(order.status));
        if (jackpotOrder) {
          triggerJackpot(jackpotOrder);
          jackpotTriggered = true;
        }
        // remove highlight after animation finishes
        setTimeout(() => {
          setRecentlyAddedIds((curr) => {
            const cleaned = new Set(curr);
            added.forEach((id) => cleaned.delete(id));
            return cleaned;
          });
          setRecentlyAddedDirection((curr) => {
            const copy = { ...curr };
            added.forEach((id) => delete copy[id]);
            return copy;
          });
        }, 700);
        return next;
      });
    }

    if (statusChanged.length) {
      setRecentStatusChange((prev) => {
        const next = { ...prev };
        statusChanged.forEach((id) => {
          next[id] = currentStatusMap[id];
        });
        // trigger jackpot overlay when a status reaches completion
        const jackpotStates = ['paymentCompleted', 'paymentConfirmed', 'paymentSettled'];
        if (!jackpotTriggered) {
          const jackpotId = statusChanged.find((id) => jackpotStates.includes(currentStatusMap[id]));
          if (jackpotId) {
            const order = buyOrders.find((o) => o._id === jackpotId);
            triggerJackpot(order);
          }
        }
        setTimeout(() => {
          setRecentStatusChange((curr) => {
            const copy = { ...curr };
            statusChanged.forEach((id) => delete copy[id]);
            return copy;
          });
        }, 900);
        return next;
      });
    }

    prevBuyOrderIdsRef.current = currentIds;
    prevStatusMapRef.current = currentStatusMap;
  }, [buyOrders]);


  /*
  getAllBuyOrders result totalCount 367
getAllBuyOrders result totalKrwAmount 91645000
getAllBuyOrders result totalUsdtAmount 66409.36
getAllBuyOrders result totalSettlementCount 367
getAllBuyOrders result totalSettlementAmount 66021.883
getAllBuyOrders result totalSettlementAmountKRW 91110233
getAllBuyOrders result totalFeeAmount 387.477
getAllBuyOrders result totalFeeAmountKRW 534718.74
getAllBuyOrders result totalAgentFeeAmount 0
getAllBuyOrders result totalAgentFeeAmountKRW 0
*/

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

    /*
    totalByBuyerDepositName: Array<{
        _id: string;
        totalCount: number;
        totalKrwAmount: number;
        totalUsdtAmount: number;
      }>;
    totalReaultGroupByBuyerDepositNameCount: number;
    */

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

    /*
    totalByBuyerDepositName: [],
    totalReaultGroupByBuyerDepositNameCount: 0,
    */

    totalBySellerBankAccountNumber: [],
    totalBySellerAliesBankAccountNumber: [],
  });


  //console.log('buyOrders', buyOrders);

  const animatedTotalCount = useAnimatedNumber(buyOrderStats.totalCount);
  const animatedTotalUsdtAmount = useAnimatedNumber(buyOrderStats.totalUsdtAmount, { decimalPlaces: 3 });
  const animatedTotalKrwAmount = useAnimatedNumber(buyOrderStats.totalKrwAmount);

  const animatedTotalSettlementCount = useAnimatedNumber(buyOrderStats.totalSettlementCount);
  const animatedTotalSettlementAmount = useAnimatedNumber(buyOrderStats.totalSettlementAmount, { decimalPlaces: 3 });
  const animatedTotalSettlementAmountKRW = useAnimatedNumber(buyOrderStats.totalSettlementAmountKRW);



  // animation for totalBySellerBankAccountNumber.totalKrwAmount static array


  /*
  const [buyerDisplayValueArray, setBuyerDisplayValueArray] = useState<number[]>([]);
  function updateBuyerDisplayValue(index: number, value: number) {
    setBuyerDisplayValueArray((prevValues) => {
      const newValues = [...prevValues];
      newValues[index] = value;
      return newValues;
    });
  }

  useEffect(() => {
    buyOrderStats.totalByBuyerDepositName.forEach((item, index) => {
      const targetValue = item.totalKrwAmount;
      const duration = 1000; // animation duration in ms
      const startValue = buyerDisplayValueArray[index] || 0;
      const startTime = performance.now();
      function animate(currentTime: number) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const currentValue = startValue + (targetValue - startValue) * progress;
        updateBuyerDisplayValue(index, Math.round(currentValue));
        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      }
      requestAnimationFrame(animate);
    });
  }, [buyOrderStats.totalByBuyerDepositName]);
  */





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
  const prevTargetBalanceRef = useRef<number[]>([]);
  const [balanceFlashSet, setBalanceFlashSet] = useState<Set<number>>(new Set());
  function updateLastestBalanceArray(index: number, value: number) {
    setLastestBalanceArray((prevValues) => {
      const newValues = [...prevValues];
      newValues[index] = value;
      return newValues;
    });
  }
  useEffect(() => {
    const changedIndices: number[] = [];
    buyOrderStats.totalBySellerBankAccountNumber.forEach((item, index) => {
      
      ///const targetValue = item.bankUserInfo && item.bankUserInfo.length > 0 && item.bankUserInfo[0].latestBalance ? item.bankUserInfo[0].latestBalance : 0;

      const targetValue = item.bankUserInfo && item.bankUserInfo.length > 0 && item.bankUserInfo[0].balance ? item.bankUserInfo[0].balance : 0;


      const duration = 1000; // animation duration in ms
      const startValue = lastestBalanceArray[index] || 0;
      if (startValue !== targetValue) {
        changedIndices.push(index);
      }
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
    if (changedIndices.length) {
      setBalanceFlashSet((prev) => {
        const next = new Set(prev);
        changedIndices.forEach((i) => next.add(i));
        setTimeout(() => {
          setBalanceFlashSet((curr) => {
            const copy = new Set(curr);
            changedIndices.forEach((i) => copy.delete(i));
            return copy;
          });
        }, 900);
        return next;
      });
    }
  }, [buyOrderStats.totalBySellerBankAccountNumber]);

  // detect balance change for flash animation using raw target values
  useEffect(() => {
    const prev = prevTargetBalanceRef.current;
    const changed: number[] = [];
    buyOrderStats.totalBySellerBankAccountNumber.forEach((item, idx) => {
      const targetValue = item.bankUserInfo && item.bankUserInfo.length > 0 && item.bankUserInfo[0].balance
        ? item.bankUserInfo[0].balance
        : 0;
      if (prev[idx] !== undefined && prev[idx] !== targetValue) {
        changed.push(idx);
      }
      prev[idx] = targetValue;
    });
    if (changed.length) {
      setBalanceFlashSet((prevSet) => {
        const next = new Set(prevSet);
        changed.forEach((i) => next.add(i));
        setTimeout(() => {
          setBalanceFlashSet((curr) => {
            const copy = new Set(curr);
            changed.forEach((i) => copy.delete(i));
            return copy;
          });
        }, 900);
        return next;
      });
    }
  }, [buyOrderStats.totalBySellerBankAccountNumber]);


  // 사용계좌(별칭) 이력 패널 상태
  const [aliasPanelOpen, setAliasPanelOpen] = useState(false);
  const [aliasPanelLoading, setAliasPanelLoading] = useState(false);
  const [aliasPanelError, setAliasPanelError] = useState('');
  const [aliasPanelTransfers, setAliasPanelTransfers] = useState<any[]>([]);
  const [aliasPanelAccountNumber, setAliasPanelAccountNumber] = useState('');
  const [aliasPanelAliasNumber, setAliasPanelAliasNumber] = useState('');
  const [aliasPanelBankName, setAliasPanelBankName] = useState('');
  const [aliasPanelAccountHolder, setAliasPanelAccountHolder] = useState('');
  const [aliasPanelStoreLogo, setAliasPanelStoreLogo] = useState('');
  const [aliasPanelStoreName, setAliasPanelStoreName] = useState('');
  const [aliasPanelTotalCount, setAliasPanelTotalCount] = useState(0);
  const [aliasPanelTotalAmount, setAliasPanelTotalAmount] = useState(0);
  const [showSellerBankStats, setShowSellerBankStats] = useState(true);
  const [aliasPanelMatchFilter, setAliasPanelMatchFilter] = useState<'all' | 'matched' | 'unmatched'>('all');
  const [aliasPanelPage, setAliasPanelPage] = useState(1);
  const [aliasPanelHasMore, setAliasPanelHasMore] = useState(true);
  const aliasPanelLoadMoreRef = useRef<HTMLDivElement | null>(null);
  const [aliasPanelDownloading, setAliasPanelDownloading] = useState(false);
  const [aliasPanelConfirmOpen, setAliasPanelConfirmOpen] = useState(false);
  const [aliasPanelConfirmMemo, setAliasPanelConfirmMemo] = useState('');
  const [aliasPanelConfirmTarget, setAliasPanelConfirmTarget] = useState<any>(null);
  const [aliasPanelConfirmLoading, setAliasPanelConfirmLoading] = useState(false);

  // 미신청 입금내역
  const [unmatchedTransfers, setUnmatchedTransfers] = useState<any[]>([]);
  const [unmatchedLoading, setUnmatchedLoading] = useState(false);
  const [unmatchedTotalAmount, setUnmatchedTotalAmount] = useState(0);
  const [showUnmatched, setShowUnmatched] = useState(true);
  const unmatchedScrollRef = useRef<HTMLDivElement | null>(null);
  const [togglingAlarmId, setTogglingAlarmId] = useState<string | null>(null);
  const lastAlarmSoundRef = useRef<number>(0);
  const [unmatchedCountdown, setUnmatchedCountdown] = useState('00:00:00');

  // 입금내역 선택 모달 상태
const [depositModalOpen, setDepositModalOpen] = useState(false);
const [depositModalLoading, setDepositModalLoading] = useState(false);
const [depositOptions, setDepositOptions] = useState<any[]>([]);
const [selectedDepositIds, setSelectedDepositIds] = useState<string[]>([]);
const [targetConfirmIndex, setTargetConfirmIndex] = useState<number | null>(null);
const [targetConfirmOrder, setTargetConfirmOrder] = useState<BuyOrder | null>(null);
const [tradeDetailOpen, setTradeDetailOpen] = useState(false);
const [tradeDetailLoading, setTradeDetailLoading] = useState(false);
const [tradeDetailData, setTradeDetailData] = useState<any>(null);
const selectedDepositTotal = useMemo(() => {
  return depositOptions.reduce((sum, trx, idx) => {
    const key = trx?._id || String(idx);
    if (!selectedDepositIds.includes(key)) return sum;
    return sum + (Number(trx?.amount) || 0);
  }, 0);
}, [depositOptions, selectedDepositIds]);
const depositAmountMatches = useMemo(() => {
  if (!targetConfirmOrder) return true;
  if (!selectedDepositIds.length) return true;
  const orderAmount = Number(targetConfirmOrder.krwAmount) || 0;
  return selectedDepositTotal === orderAmount;
}, [targetConfirmOrder, selectedDepositIds, selectedDepositTotal]);

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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tradeId }),
      });
      const data = await res.json();
      if (!res.ok || data?.error) {
        throw new Error(data?.error || '거래상세를 불러오지 못했습니다.');
      }
      setTradeDetailData(data.result || null);
    } catch (error: any) {
      console.error(error);
      toast.error(error?.message || '거래상세 조회 실패');
    } finally {
      setTradeDetailLoading(false);
    }
  };

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

  // 오래된 미신청 입금일수록 붉게 표시
  const getUnmatchedCardProps = (
    value: string | Date | undefined,
    oldestMs: number | null,
    newestMs: number | null
  ) => {
    const date = value ? new Date(value) : null;
    const ts = date && !Number.isNaN(date.getTime()) ? date.getTime() : null;
    if (ts === null || oldestMs === null || newestMs === null) {
      return {
        style: {
          backgroundColor: 'rgba(248, 113, 113, 0.18)',
          borderColor: 'rgba(248, 113, 113, 0.3)',
          boxShadow: '0 6px 14px rgba(248,113,113,0.12)',
        },
        alertClass: '',
      };
    }
    const range = Math.max(1, newestMs - oldestMs);
    const ratio = 1 - Math.max(0, Math.min(1, (ts - oldestMs) / range)); // oldest=1(red), newest=0(light)
    const bgAlpha = 0.16 + 0.44 * ratio;   // 0.16 ~ 0.60
    const borderAlpha = 0.25 + 0.55 * ratio; // 0.25 ~ 0.80
    const shadowAlpha = 0.08 + 0.3 * ratio;  // 0.08 ~ 0.38
    const alertClass =
      ratio >= 0.8 ? 'animate-pulse ring-2 ring-rose-300' :
      ratio >= 0.5 ? 'ring ring-rose-200' : '';
    return {
      style: {
        backgroundColor: `rgba(248, 113, 113, ${bgAlpha})`,
        borderColor: `rgba(248, 113, 113, ${borderAlpha})`,
        boxShadow: `0 8px 18px rgba(248,113,113, ${shadowAlpha})`,
      },
      alertClass,
    };
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

  const fetchAliasTransfers = async (
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
      targetReal
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
      setAliasPanelStoreLogo('');
      setAliasPanelStoreName('');
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
          page,
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
              if (typeof m === 'object') return true;
              return false;
            })
          : activeMatchFilter === 'unmatched'
            ? rawTransfers.filter((t) => {
                const m = t?.match;
                if (!m) return true;
                if (typeof m === 'string') return m.toLowerCase() !== 'success';
                if (typeof m === 'object') return false;
                return true;
              })
            : rawTransfers;

      setAliasPanelTransfers((prev) =>
        append ? [...prev, ...filteredTransfers] : filteredTransfers
      );
      if ((!append || !aliasPanelStoreName) && filteredTransfers.length > 0) {
        const first = filteredTransfers[0];
        const storeLogo =
          first?.storeInfo?.storeLogo ||
          first?.storeInfo?.logo ||
          first?.store?.storeLogo ||
          '';
        const storeName =
          first?.storeInfo?.storeName ||
          first?.store?.storeName ||
          first?.storeName ||
          '';
        if (storeLogo) setAliasPanelStoreLogo(storeLogo);
        if (storeName) setAliasPanelStoreName(storeName);
      }

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

  const closeAliasPanel = () => {
    setAliasPanelOpen(false);
  };

  const downloadAliasPanelExcel = async () => {
    if (aliasPanelDownloading) return;
    if (!aliasPanelAccountNumber) {
      toast.error('먼저 계좌를 선택해 주세요.');
      return;
    }

    setAliasPanelDownloading(true);
    try {
      const limit = 200;
      let page = 1;
      let hasMore = true;
      const allTransfers: any[] = [];
      let totalCountFromApi: number | null = null;

      while (hasMore) {
        const response = await fetch('/api/bankTransfer/getAll', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            limit,
            page,
            accountNumber: '',
            originalAccountNumber: aliasPanelAccountNumber,
            fromDate: searchFromDate,
            toDate: searchToDate,
            transactionType: 'deposited',
            matchStatus:
              aliasPanelMatchFilter === 'matched'
                ? 'matched'
                : aliasPanelMatchFilter === 'unmatched'
                  ? 'unmatched'
                  : '',
          }),
        });

        if (!response.ok) {
          throw new Error('전체 내역을 불러오지 못했습니다.');
        }

        const data = await response.json();
        const rawTransfers: any[] = data?.result?.transfers || [];

        const filteredTransfers =
          aliasPanelMatchFilter === 'matched'
            ? rawTransfers.filter((t) => {
                const m = t?.match;
                if (!m) return false;
                if (typeof m === 'string') return m.toLowerCase() === 'success';
                if (typeof m === 'object') return true;
                return false;
              })
            : aliasPanelMatchFilter === 'unmatched'
              ? rawTransfers.filter((t) => {
                  const m = t?.match;
                  if (!m) return true;
                  if (typeof m === 'string') return m.toLowerCase() !== 'success';
                  if (typeof m === 'object') return false;
                  return true;
                })
              : rawTransfers;

        allTransfers.push(...filteredTransfers);
        if (totalCountFromApi === null) {
          totalCountFromApi = data?.result?.totalCount ?? filteredTransfers.length;
        }
        hasMore = rawTransfers.length >= limit;
        page += 1;
      }

      if (!allTransfers.length) {
        toast.error('다운로드할 입금 내역이 없습니다.');
        return;
      }

      const rows = allTransfers.map((t, idx) => {
        const matchLabel = (() => {
          const m = t?.match;
          const normalized = m === undefined || m === null
            ? ''
            : typeof m === 'string'
              ? m.toLowerCase()
              : 'object';
          const isSuccess = normalized === 'success' || normalized === 'object';
          return isSuccess ? '정상입금' : '미신청입금';
        })();

        const descendingIndex = totalCountFromApi !== null
          ? totalCountFromApi - idx
          : allTransfers.length - idx;

        return {
          No: descendingIndex,
          Match: matchLabel,
          Depositor: t.transactionName || '',
          Amount: Number(t.amount) || 0,
          BankAccountNumber: t.bankAccountNumber || aliasPanelAccountNumber || '',
          BankName: t.bankName || aliasPanelBankName || '',
          AccountHolder: t.accountHolder || aliasPanelAccountHolder || '',
          TransactionDate: t.transactionDate || t.processingDate || t.regDate || '',
          Balance: Number(t.balance) || 0,
          TradeId: t.tradeId || '',
          UserId: t.userId || '',
        };
      });

      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Deposits');

      const safeAlias = (aliasPanelAliasNumber || aliasPanelAccountNumber || 'account')
        .toString()
        .replace(/[^0-9a-zA-Z_-]/g, '');
      const filename = `deposits_${safeAlias}_${searchFromDate || 'from'}_${searchToDate || 'to'}.xlsx`;
      XLSX.writeFile(wb, filename);
      toast.success('전체 입금 내역을 다운로드했습니다.');
    } catch (error: any) {
      console.error('입금 내역 다운로드 실패', error);
      toast.error(error?.message || '엑셀 다운로드에 실패했습니다.');
    } finally {
      setAliasPanelDownloading(false);
    }
  };

  const openAliasConfirmModal = (trx: any) => {
    setAliasPanelConfirmTarget(trx);
    setAliasPanelConfirmMemo(trx?.memo || '');
    setAliasPanelConfirmOpen(true);
  };

  const closeAliasConfirmModal = () => {
    if (aliasPanelConfirmLoading) return;
    setAliasPanelConfirmOpen(false);
    setAliasPanelConfirmMemo('');
    setAliasPanelConfirmTarget(null);
  };

  const confirmAliasMatchUpdate = async () => {
    if (!aliasPanelConfirmTarget?._id) {
      toast.error('대상 입금 내역이 없습니다.');
      return;
    }
    if (!aliasPanelConfirmMemo.trim()) {
      toast.error('설명을 입력해주세요.');
      return;
    }
    setAliasPanelConfirmLoading(true);
    try {
      const res = await fetch('/api/bankTransfer/mark-success', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: aliasPanelConfirmTarget._id,
          memo: aliasPanelConfirmMemo.trim(),
        }),
      });
      if (!res.ok) {
        throw new Error('업데이트에 실패했습니다.');
      }
      // update local list
      setAliasPanelTransfers((prev) =>
        prev.map((t) =>
          (t._id || '') === aliasPanelConfirmTarget._id
            ? { ...t, match: 'success', memo: aliasPanelConfirmMemo.trim() }
            : t
        )
      );
      toast.success('입금내역을 정상입금으로 업데이트했습니다.');
      closeAliasConfirmModal();
    } catch (error: any) {
      toast.error(error?.message || '업데이트에 실패했습니다.');
    } finally {
      setAliasPanelConfirmLoading(false);
    }
  };

  // ESC to close alias panel
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && aliasPanelOpen) {
        closeAliasPanel();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [aliasPanelOpen]);

  const fetchDepositsForOrder = async (order: BuyOrder | null) => {
    if (!order) return;
    const sellerAccountNumber = order?.seller?.bankInfo?.accountNumber;
    if (!sellerAccountNumber) {
      toast.error('판매자 계좌번호가 없습니다.');
      return;
    }
    setDepositModalLoading(true);
    try {
      const res = await fetch('/api/bankTransfer/getAll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountNumber: sellerAccountNumber,
          transactionType: 'deposited',
          matchStatus: 'unmatched',
          page: 1,
          limit: 50,
          fromDate: searchFromDate,
          toDate: searchToDate,
        }),
      });
      if (!res.ok) {
        throw new Error(`입금내역 조회 실패 (${res.status})`);
      }
      const data = await res.json();
      const list = data?.result?.transfers || [];
      const filtered = list.filter((t: any) => {
        const typeRaw = (t?.transactionType || t?.trxType || '').toString().toLowerCase();
        return typeRaw === 'deposited' || typeRaw === 'deposit' || typeRaw === '입금';
      });
      filtered.sort((a: any, b: any) =>
        new Date(b.transactionDate || b.regDate || 0).getTime() -
        new Date(a.transactionDate || a.regDate || 0).getTime()
      );
      setDepositOptions(filtered);
    } catch (err) {
      console.error(err);
      toast.error('입금내역을 불러오지 못했습니다.');
      setDepositOptions([]);
    } finally {
      setDepositModalLoading(false);
    }
  };

  // 입금내역 선택 모달 열기
  const openDepositModalForOrder = async (index: number, order: BuyOrder) => {
    const sellerAccountNumber = order?.seller?.bankInfo?.accountNumber;
    if (!sellerAccountNumber) {
      toast.error('판매자 계좌번호가 없습니다.');
      return;
    }
    setTargetConfirmIndex(index);
    setTargetConfirmOrder(order);
    setSelectedDepositIds([]);
    setDepositModalOpen(true);
    fetchDepositsForOrder(order);
  };

  const refreshDepositOptions = async () => {
    await fetchDepositsForOrder(targetConfirmOrder);
  };

  const handleConfirmPaymentWithSelected = async () => {
    if (targetConfirmIndex === null || !targetConfirmOrder) {
      toast.error('대상 주문이 없습니다.');
      return;
    }
    if (selectedDepositIds.length && !depositAmountMatches) {
      toast.error('선택한 입금 합계와 주문 금액이 일치하지 않습니다.');
      return;
    }

    const transferIds = selectedDepositIds.length ? selectedDepositIds : ['000000000'];
    const transferAmount = selectedDepositIds.length ? selectedDepositTotal : 0;

    await confirmPayment(
      targetConfirmIndex,
      targetConfirmOrder._id,
      targetConfirmOrder.krwAmount,
      targetConfirmOrder.usdtAmount,
      targetConfirmOrder.walletAddress,
      targetConfirmOrder.paymentMethod,
      transferIds,
      transferAmount
    );
    setDepositModalOpen(false);
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

      fetchAliasTransfers(
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

  // 미신청 입금내역 조회
  const fetchUnmatchedTransfers = async () => {
    if (unmatchedLoading) return;
    setUnmatchedLoading(true);
    try {
      const response = await fetch('/api/bankTransfer/getAll', {
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

      if (!response.ok) {
        throw new Error('미신청 입금내역을 불러오지 못했습니다.');
      }

      const data = await response.json();
      const rawList: any[] = data?.result?.transfers || [];

      const filtered = rawList.filter((t) => {
        const m = t?.match;
        if (!m) return true;
        if (typeof m === 'string') return m.toLowerCase() !== 'success';
        // 객체인 경우는 매칭된 것으로 간주
        return false;
      });

      filtered.sort((a, b) =>
        new Date(b.transactionDate || b.regDate || 0).getTime() -
        new Date(a.transactionDate || a.regDate || 0).getTime()
      );

      const totalAmt = filtered.reduce((sum, cur) => sum + (Number(cur.amount) || 0), 0);

      setUnmatchedTransfers(filtered);
      setUnmatchedTotalAmount(totalAmt);
    } catch (error: any) {
      console.error('미신청 입금 조회 실패', error);
      toast.error(error?.message || '미신청 입금내역 조회 실패');
    } finally {
      setUnmatchedLoading(false);
    }
  };

  useEffect(() => {
    fetchUnmatchedTransfers();
    const interval = setInterval(fetchUnmatchedTransfers, 10000);
    return () => clearInterval(interval);
  }, [searchFromDate, searchToDate, searchStorecode]);

  // alarm sound when any unmatched item has alarmOn !== false
  useEffect(() => {
    const now = Date.now();
    const hasAlarm = unmatchedTransfers.some((t) => t?.alarmOn !== false);
    if (hasAlarm && now - lastAlarmSoundRef.current > 12000) {
      playSong();
      lastAlarmSoundRef.current = now;
    }
  }, [unmatchedTransfers]);

  const toggleAlarm = async (transferId: string, currentOn: boolean) => {
    if (!transferId) return;
    try {
      setTogglingAlarmId(transferId);
      const nextOn = !currentOn;
      // optimistic update
      setUnmatchedTransfers((prev) =>
        prev.map((t: any) =>
          (t._id || '') === transferId ? { ...t, alarmOn: nextOn } : t
        )
      );
      const res = await fetch('/api/bankTransfer/updateAlarm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: transferId, alarmOn: nextOn }),
      });
      if (!res.ok) {
        throw new Error('알람 상태 업데이트 실패');
      }
    } catch (err: any) {
      toast.error(err?.message || '알람 상태를 변경하지 못했습니다.');
      // revert on failure
      setUnmatchedTransfers((prev) =>
        prev.map((t: any) =>
          (t._id || '') === transferId ? { ...t, alarmOn: currentOn } : t
        )
      );
    } finally {
      setTogglingAlarmId(null);
    }
  };

  // countdown to midnight (local time)
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const end = new Date();
      end.setHours(23, 59, 59, 999);
      const diff = end.getTime() - now.getTime();
      if (diff <= 0) {
        setUnmatchedCountdown('00:00:00');
        return;
      }
      const h = Math.floor(diff / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);
      const pad = (n: number) => String(n).padStart(2, '0');
      setUnmatchedCountdown(`${pad(h)}:${pad(m)}:${pad(s)}`);
    };
    updateCountdown();
    const id = setInterval(updateCountdown, 1000);
    return () => clearInterval(id);
  }, []);

  const downloadUnmatchedExcel = () => {
    if (!unmatchedTransfers.length) {
      toast.error('다운로드할 미신청 입금이 없습니다.');
      return;
    }

    const rows = unmatchedTransfers.map((t, idx) => {
      const bankInfo =
        t.storeInfo?.bankInfo ||
        t.storeInfo?.bankInfoAAA ||
        t.storeInfo?.bankInfoBBB ||
        t.storeInfo?.bankInfoCCC ||
        t.storeInfo?.bankInfoDDD ||
        {};

      return {
        No: unmatchedTransfers.length - idx,
        Store: t.storeInfo?.storeName || '',
        Depositor: t.transactionName || '',
        Amount: Number(t.amount) || 0,
        BankAccountNumber: t.bankAccountNumber || '',
        BankName: bankInfo.bankName || '',
        AccountHolder: bankInfo.accountHolder || '',
        TransactionDate: t.transactionDate || t.processingDate || t.regDate || '',
        Balance: Number(t.balance) || 0,
        AlarmOn: t.alarmOn === false ? 'OFF' : 'ON',
      };
    });

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Unmatched');

    const filename = `unmatched_${searchFromDate || 'from'}_${searchToDate || 'to'}.xlsx`;
    XLSX.writeFile(wb, filename);
  };






  /* agreement for trade */
  const [agreementForTrade, setAgreementForTrade] = useState([] as boolean[]);
  useEffect(() => {
    setAgreementForTrade([]);
    const newArray: boolean[] = [];
    for (let i = 0; i < buyOrders.length; i++) {
      newArray.push(false);
    }
    setAgreementForTrade(newArray);
  } , [buyOrders.length]);



  const [acceptingBuyOrder, setAcceptingBuyOrder] = useState([] as boolean[]);
  useEffect(() => {
    setAcceptingBuyOrder([]);
    const newArray: boolean[] = [];
    for (let i = 0; i < buyOrders.length; i++) {
      newArray.push(false);
    }
    setAcceptingBuyOrder(newArray);
  } , [buyOrders.length]);

   



   
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

      tradeId: string,
      walletAddress: string,
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
                storecode: "admin",
                orderId: orderId,
                sellerWalletAddress: address,
                sellerStorecode: "admin",

                /*
                sellerNickname: user ? user.nickname : '',
                sellerAvatar: user ? user.avatar : '',

                //buyerMobile: user.mobile,

                sellerMobile: smsNumber,
                */



                seller: user?.seller,

                tradeId: tradeId,
                buyerWalletAddress: walletAddress,

            }),
        })
        .then(response => response.json())
        .then(data => {

            //console.log('data', data);

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
                    storecode: searchStorecode,
                    limit: Number(limitValue),
                    page: Number(pageValue),
                    walletAddress: address,
                    searchMyOrders: searchMyOrders,
                    searchOrderStatusCancelled: searchOrderStatusCancelled,
                    searchOrderStatusCompleted: searchOrderStatusCompleted,

                    searchStoreName: searchStoreName,

                    fromDate: searchFromDate,
                    toDate: searchToDate,

                  }
                ),
            })
            .then(response => response.json())
            .then(data => {
                ///console.log('data', data);
                applyBuyOrders(data.result.orders);

                //setTotalCount(data.result.totalCount);

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
                  
                  //totalByBuyerDepositName: data.result.totalByBuyerDepositName,
                  //totalReaultGroupByBuyerDepositNameCount: data.result.totalReaultGroupByBuyerDepositNameCount,
                  
                  totalBySellerBankAccountNumber: data.result.totalBySellerBankAccountNumber,
                  totalBySellerAliesBankAccountNumber: data.result.totalBySellerAliesBankAccountNumber || [],
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
  useEffect(() => {
    setAgreementForCancelTrade([]);
    const newArray: boolean[] = [];
    for (let i = 0; i < buyOrders.length; i++) {
      newArray.push(false);
    }
    setAgreementForCancelTrade(newArray);
  } , [buyOrders.length]);



  // cancelReason
  const [cancelTradeReason, setCancelTradeReason] = useState([] as string[]);
  useEffect(() => {
    setCancelTradeReason([]);
    const newArray: string[] = [];
    for (let i = 0; i < buyOrders.length; i++) {
      newArray.push("");
    }
    setCancelTradeReason(newArray);
  } , [buyOrders.length]);




  // cancel sell order state
  const [cancellings, setCancellings] = useState([] as boolean[]);
  useEffect(() => {
    setCancellings([]);
    const newArray: boolean[] = [];
    for (let i = 0; i < buyOrders.length; i++) {
      newArray.push(false);
    }
    setCancellings(newArray);
  } , [buyOrders.length]);



  const cancelTrade = async (orderId: string, index: number) => {

    if (cancellings[index]) {
      return;
    }

    setCancellings(
      cancellings.map((item, i) => i === index ? true : item)
    );


    // if escrowWallet is exists, call cancelTradeBySellerWithEscrow API
    const buyOrder = buyOrders[index];

    if (buyOrder?.escrowWallet && buyOrder?.escrowWallet?.transactionHash) {

      try {

        const result = await fetch('/api/order/cancelTradeBySellerWithEscrow', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            orderId: orderId,
            storecode: "admin",
            walletAddress: address,
            cancelTradeReason: cancelTradeReason[index],
          })

        });

        const data = await result.json();
        //console.log('cancelTradeBySellerWithEscrow data', data);

        if (data.result) {

          toast.success(Order_has_been_cancelled);

          ////playSong();

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

                searchStoreName: searchStoreName,

                fromDate: searchFromDate,
                toDate: searchToDate,
              }
            )
          }).then(async (response) => {
            const data = await response.json();
            //console.log('data', data);
            if (data.result) {
              applyBuyOrders(data.result.orders);

              ////setTotalCount(data.result.totalCount);

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
            
            //totalByBuyerDepositName: data.result.totalByBuyerDepositName,
            //totalReaultGroupByBuyerDepositNameCount: data.result.totalReaultGroupByBuyerDepositNameCount,
            
            totalBySellerBankAccountNumber: data.result.totalBySellerBankAccountNumber,
            totalBySellerAliesBankAccountNumber: data.result.totalBySellerAliesBankAccountNumber || [],
          });

            }
          });

        } else {
          toast.error('거래취소에 실패했습니다.');
        }


      } catch (error) {
        console.error('Error cancelling trade with escrow:', error);
        toast.error('거래취소에 실패했습니다.');
        setCancellings(
          cancellings.map((item, i) => i === index ? false : item)
        );
        return;
      }


    } else {

      const response = await fetch('/api/order/cancelTradeBySeller', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          orderId: orderId,
          storecode: "admin",
          walletAddress: address,
          cancelTradeReason: cancelTradeReason[index],
        })
      });

      if (!response.ok) {
        toast.error('거래취소에 실패했습니다.');
        setCancellings(
          cancellings.map((item, i) => i === index ? false : item)
        );
        return;
      }

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
              storecode: searchStorecode,
              limit: Number(limitValue),
              page: Number(pageValue),
              walletAddress: address,
              searchMyOrders: searchMyOrders,
              searchOrderStatusCancelled: searchOrderStatusCancelled,
              searchOrderStatusCompleted: searchOrderStatusCompleted,

              searchStoreName: searchStoreName,

              fromDate: searchFromDate,
              toDate: searchToDate,
            }
          )
        }).then(async (response) => {
          const data = await response.json();
          //console.log('data', data);
          if (data.result) {
            applyBuyOrders(data.result.orders);

            //setTotalCount(data.result.totalCount);

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
              
              //totalByBuyerDepositName: data.result.totalByBuyerDepositName,
              //totalReaultGroupByBuyerDepositNameCount: data.result.totalReaultGroupByBuyerDepositNameCount,
              
              totalBySellerBankAccountNumber: data.result.totalBySellerBankAccountNumber,
              totalBySellerAliesBankAccountNumber: data.result.totalBySellerAliesBankAccountNumber || [],
            });


          }
        });

      } else {
        toast.error('거래취소에 실패했습니다.');
      }


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
  useEffect(() => {
    setRequestPaymentCheck([]);
    const newArray: boolean[] = [];
    for (let i = 0; i < buyOrders.length; i++) {
      newArray.push(false);
    }
    setRequestPaymentCheck(newArray);
  } , [buyOrders.length]);  




  // array of escrowing
  const [escrowing, setEscrowing] = useState([] as boolean[]);
  useEffect(() => {
    setEscrowing([]);
    const newArray: boolean[] = [];
    for (let i = 0; i < buyOrders.length; i++) {
      newArray.push(false);
    }
    setEscrowing(newArray);
  } , [buyOrders.length]);
  
  


  // array of requestingPayment
  const [requestingPayment, setRequestingPayment] = useState([] as boolean[]);
  useEffect(() => {
    setRequestingPayment([]);
    const newArray: boolean[] = [];
    for (let i = 0; i < buyOrders.length; i++) {
      newArray.push(false);
    }
    setRequestingPayment(newArray);
  } , [buyOrders.length]);



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
    /*
    if (balance < amount) {
      toast.error(Insufficient_balance);
      return;
    }
    */

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

        /*
        const { transactionHash } = await sendTransaction({
          
          account: activeAccount as any,

          transaction,
        });
        */

        // sendAndConfirmTransaction
        const transactionHash = await sendAndConfirmTransaction({
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
              lang: params.lang,
              storecode: storecode,
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

                  searchStoreName: searchStoreName,


                  fromDate: searchFromDate,
                  toDate: searchToDate,
                }
              )
            }).then(async (response) => {
              const data = await response.json();
              //console.log('data', data);
              if (data.result) {
                applyBuyOrders(data.result.orders);
    
                //setTotalCount(data.result.totalCount);

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
              
              //totalByBuyerDepositName: data.result.totalByBuyerDepositName,
              //totalReaultGroupByBuyerDepositNameCount: data.result.totalReaultGroupByBuyerDepositNameCount,
              
              totalBySellerBankAccountNumber: data.result.totalBySellerBankAccountNumber,
              totalBySellerAliesBankAccountNumber: data.result.totalBySellerAliesBankAccountNumber || [],
            });

              }
            });
          

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
            lang: params.lang,
            storecode: storecode,
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

                searchStoreName: searchStoreName,

                fromDate: searchFromDate,
                toDate: searchToDate,
              }
            )
          }).then(async (response) => {
            const data = await response.json();
            //console.log('data', data);
            if (data.result) {
              applyBuyOrders(data.result.orders);
  
              //setTotalCount(data.result.totalCount);

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
                
                //totalByBuyerDepositName: data.result.totalByBuyerDepositName,
                //totalReaultGroupByBuyerDepositNameCount: data.result.totalReaultGroupByBuyerDepositNameCount,
                
                totalBySellerBankAccountNumber: data.result.totalBySellerBankAccountNumber,
                totalBySellerAliesBankAccountNumber: data.result.totalBySellerAliesBankAccountNumber || [],
              });

            }
          });


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
  useEffect(() => {
    setConfirmingPayment([]);
    const newArray: boolean[] = [];
    for (let i = 0; i < buyOrders.length; i++) {
      newArray.push(false);
    }
    setConfirmingPayment(newArray);
  } , [buyOrders.length]);




  // confirm payment check box
  const [confirmPaymentCheck, setConfirmPaymentCheck] = useState([] as boolean[]);
  useEffect(() => {
    setConfirmPaymentCheck([]);
    const newArray: boolean[] = [];
    for (let i = 0; i < buyOrders.length; i++) {
      newArray.push(false);
    }
    setConfirmPaymentCheck(newArray);
  } , [buyOrders.length]);



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



  // confirm payment
  const confirmPayment = async (

    index: number,
    orderId: string,
    //paymentAmount: number,
    krwAmount: number,
    //paymentAmountUsdt: number,
    usdtAmount: number,

    buyerWalletAddress: string,

    paymentMethod: string, // 'bank' or 'mkrw' or 'usdt'

    bankTransferIds?: string[],
    selectedDepositAmount?: number,
  ) => {
    // confirm payment
    // send usdt to buyer wallet address


    // if escrowWalletAddress balance is less than paymentAmount, then return

    //console.log('escrowBalance', escrowBalance);
    //console.log('paymentAmountUsdt', paymentAmountUsdt);
    

    // check balance
    // if balance is less than paymentAmount, then return
    /*
    if (balance < usdtAmount) {
      toast.error(Insufficient_balance);
      return;
    }
      */

    const storecode = "admin";


    if (confirmingPayment[index]) {
      return;
    }

    setConfirmingPayment(
      confirmingPayment.map((item, idx) =>  idx === index ? true : item)
    );




        // transfer my wallet to buyer wallet address

        //const buyerWalletAddress = buyOrders[index].walletAddress;

      try {


        /*
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
        */

        const transactionHash = '0x';

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
                storecode: storecode,
                orderId: orderId,
                paymentAmount: krwAmount,
                transactionHash: transactionHash,
                bankTransferId: bankTransferIds?.[0],
                bankTransferIds,
                bankTransferAmount: selectedDepositAmount,
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
                storecode: storecode,
                orderId: orderId,
                paymentAmount: krwAmount,
                transactionHash: transactionHash,
                bankTransferId: bankTransferIds?.[0],
                bankTransferIds,
                bankTransferAmount: selectedDepositAmount,
                ///isSmartAccount: activeWallet === inAppConnectWallet ? false : true,
                isSmartAccount: false,
              })
            });

            const data = await response.json();

            //console.log('data', data);

          }




          /*
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

                searchStoreName: searchStoreName,

                fromDate: searchFromDate,
                toDate: searchToDate,
              }
            )
          }).then(async (response) => {
            const data = await response.json();
            //console.log('data', data);
            if (data.result) {
              applyBuyOrders(data.result.orders);
  
              //setTotalCount(data.result.totalCount);

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
              });


            }
          });
          */

          applyBuyOrders(
            buyOrders.map((item, idx) => {
              if (idx === index) {
                return {
                  ...item,
                  status: 'paymentConfirmed',
                  transactionHash: transactionHash,
                };
              }
              return item;
            })
          );

          toast.success(Payment_has_been_confirmed);
          //////playSong();






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








  // send payment


  const [sendingTransaction, setSendingTransaction] = useState([] as boolean[]);
  useEffect(() => {
    setSendingTransaction([]);
    const newArray: boolean[] = [];
    for (let i = 0; i < buyOrders.length; i++) {
      newArray.push(false);
    }
    setSendingTransaction(newArray);
  } , [buyOrders.length]);


  ///console.log('sendingTransaction', sendingTransaction);




  // avoid double click event

  const isProcessingSendTransaction = useRef(false);
  //const [isProcessingSendTransaction, setIsProcessingSendTransaction] = useState(false);


  const sendPayment = async (

    index: number,
    orderId: string,
    //paymentAmount: number,
    krwAmount: number,
    //paymentAmountUsdt: number,
    usdtAmount: number,

    buyerWalletAddress: string,

  ) => {

 
    if (isProcessingSendTransaction.current) {
      alert('USDT 전송이 처리중입니다. 잠시후 다시 시도해주세요.');
      return;
    }
    isProcessingSendTransaction.current = true;

    /*
    if (sendingTransaction.some((item) => item === true)) {
      alert('다른 USDT 전송이 처리중입니다. 잠시후 다시 시도해주세요.');
      return;
    }
    */


    setSendingTransaction(
      sendingTransaction.map((item, idx) => idx === index ? true : item)
    );
    

    ///setIsProcessingSendTransaction(true);




    if (!address) {
      toast.error('Please connect your wallet');
      
      //setIsProcessingSendTransaction(false);
      isProcessingSendTransaction.current = false;

      setSendingTransaction(
        sendingTransaction.map((item, idx) => idx === index ? false : item)
      );
      return;
    }

  
    let balance = 0;
    const result = await balanceOf({
      contract,
      address: address,
    });


    if (chain === 'bsc') {
      balance = Number(result) / 10 ** 18;
    } else {
      balance = Number(result) / 10 ** 6;
    }

    // check balance
    // if balance is less than paymentAmount, then return
    if (balance < usdtAmount) {
      toast.error(Insufficient_balance);
      
      //setIsProcessingSendTransaction(false);
      isProcessingSendTransaction.current = false;

      setSendingTransaction(
        sendingTransaction.map((item, idx) => idx === index ? false : item)
      );
      return;
    }
  



    const storecode = "admin";

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



        if (transactionHash) {

          const response = await fetch('/api/order/buyOrderConfirmPaymentWithoutEscrow', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              lang: params.lang,
              storecode: storecode,
              orderId: orderId,
              paymentAmount: krwAmount,
              transactionHash: transactionHash,
              ///isSmartAccount: activeWallet === inAppConnectWallet ? false : true,
              isSmartAccount: false,
            })
          });

          const data = await response.json();

          applyBuyOrders(
            buyOrders.map((item, idx) => {
              if (idx === index) {
                return {
                  ...item,
                  //status: 'paymentConfirmed',
                  transactionHash: transactionHash,
                };
              }
              return item;
            })
          );



          ///toast.success(Payment_has_been_confirmed);
          /////playSong();

          ///toast.success('USDT 전송이 완료되었습니다.');
          alert("USDT 전송이 완료되었습니다.");


        } else {
          //toast.error('결제확인이 실패했습니다.');
          alert('USDT 전송이 실패했습니다.');
        }

    } catch (error) {
      console.error('Error:', JSON.stringify(error));
      //toast.error('결제확인이 실패했습니다.');
      alert('USDT 전송이 실패했습니다. ' + error);
    }

    //setIsProcessingSendTransaction(false);
    isProcessingSendTransaction.current = false;


    setSendingTransaction(
      sendingTransaction.map((item, idx) => idx === index ? false : item)
    );

  }




  // settlement
 
  // array of settlement

  const [loadingSettlement, setLoadingSettlement] = useState([] as boolean[]);
  useEffect(() => {
    setLoadingSettlement([]);
    const newArray: boolean[] = [];
    for (let i = 0; i < buyOrders.length; i++) {
      newArray.push(false);
    }
    setLoadingSettlement(newArray);
  } , [buyOrders.length]);



  // settlement check box
  const [settlementCheck, setSettlementCheck] = useState([] as boolean[]);
  useEffect(() => {
    setSettlementCheck([]);
    const newArray: boolean[] = [];
    for (let i = 0; i < buyOrders.length; i++) {
      newArray.push(false);
    }
    setSettlementCheck(newArray);
  } , [buyOrders.length]);

  

  const settlementRequest = async (index: number, orderId: string) => {
    // settlement

    if (loadingSettlement[index]) {
      return;
    }

    setLoadingSettlement(
      loadingSettlement.map((item, idx) => idx === index ? true : item)
    );

    // api call to settlement
    try {
      const response = await fetch('/api/order/updateBuyOrderSettlement', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          orderId: orderId,
        })
      });
      const data = await response.json();

      //console.log('data', data);

      if (data.result) {

        toast.success('정산이 완료되었습니다.');

        //playSong();

        // fetch Buy Orders
        await fetch('/api/order/getAllBuyOrders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
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

              searchStoreName: searchStoreName,

              fromDate: searchFromDate,
              toDate: searchToDate,
            }
          ),
        })
        .then(response => response.json())
        .then(data => {
            ///console.log('data', data);
            applyBuyOrders(data.result.orders);

            //setTotalCount(data.result.totalCount);

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
              
              //totalByBuyerDepositName: data.result.totalByBuyerDepositName,
              //totalReaultGroupByBuyerDepositNameCount: data.result.totalReaultGroupByBuyerDepositNameCount,
              
              totalBySellerBankAccountNumber: data.result.totalBySellerBankAccountNumber,
              totalBySellerAliesBankAccountNumber: data.result.totalBySellerAliesBankAccountNumber || [],
            });

        })

      } else {
        toast.error('Settlement has been failed');
      }

    } catch (error) {
      console.error('Error:', JSON.stringify(error));
      toast.error('Settlement has been failed');
    }


    setLoadingSettlement(
      loadingSettlement.map((item, idx) => idx === index ? false : item)
    );

    setSettlementCheck(
      settlementCheck.map((item, idx) => idx === index ? false : item)
    );

  }








  //const [latestBuyOrder, setLatestBuyOrder] = useState<BuyOrder | null>(null);


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
        || acceptingBuyOrder.some((item) => item === true)
        || escrowing.some((item) => item === true)
        || requestingPayment.some((item) => item === true)
        || confirmingPayment.some((item) => item === true)


        || sendingTransaction.some((item) => item === true)

        ///|| isProcessingSendTransaction
        || isProcessingSendTransaction.current


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
              storecode: searchStorecode,
              limit: Number(limitValue),
              page: Number(pageValue),
              walletAddress: address,
              searchMyOrders: searchMyOrders,
              searchOrderStatusCancelled: searchOrderStatusCancelled,
              searchOrderStatusCompleted: searchOrderStatusCompleted,

              searchStoreName: searchStoreName,

              fromDate: searchFromDate,
              toDate: searchToDate,
            }

        ),
      });

      if (!response.ok) {
        return;
      }



      const data = await response.json();


      applyBuyOrders(data.result.orders);

      //setTotalCount(data.result.totalCount);

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
            
            //totalByBuyerDepositName: data.result.totalByBuyerDepositName,
            //totalReaultGroupByBuyerDepositNameCount: data.result.totalReaultGroupByBuyerDepositNameCount,
            
            totalBySellerBankAccountNumber: data.result.totalBySellerBankAccountNumber,
            totalBySellerAliesBankAccountNumber: data.result.totalBySellerAliesBankAccountNumber || [],
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
    agreementForCancelTrade,
    confirmPaymentCheck,



    

    ///latestBuyOrder,
    searchOrderStatusCancelled,
    searchOrderStatusCompleted,
    

    //searchStoreName,


    limitValue,
    pageValue,
    searchStorecode,
    searchFromDate,
    searchToDate,


    sendingTransaction,

    //isProcessingSendTransaction,
    isProcessingSendTransaction.current

]);



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
        storecode: searchStorecode,
        limit: Number(limitValue),
        page: Number(pageValue),
        walletAddress: address,
        searchMyOrders: searchMyOrders,

        searchStoreName: searchStoreName,

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

  applyBuyOrders(data.result.orders);
  //setTotalCount(data.result.totalCount);
  setFetchingBuyOrders(false);

  return data.result.orders;
}








    /*
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

    */

    
    



  const [selectedItem, setSelectedItem] = useState<any>(null);
    


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
              storecode: "admin",
              ///walletAddress: address,
            }),
        });

        const data = await response.json();


        if (data.result) {

          setStore(data.result);

          setStoreAdminWalletAddress(data.result?.adminWalletAddress);

        }

        setFetchingStore(false);
    };

    fetchData();

  } , [address]);


  
  /*
  const [tradeSummary, setTradeSummary] = useState({
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

      orders: [] as BuyOrder[],

      totalClearanceCount: 0,
      totalClearanceAmount: 0,
      totalClearanceAmountUSDT: 0,
    });
    const [loadingTradeSummary, setLoadingTradeSummary] = useState(false);


    const getTradeSummary = async () => {
      if (!address) {
        return;
      }
      setLoadingTradeSummary(true);
      const response = await fetch('/api/summary/getTradeSummary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({

          agentcode: params.agentcode,
          storecode: searchStorecode,
          walletAddress: address,
          searchMyOrders: searchMyOrders,
          searchOrderStatusCancelled: searchOrderStatusCancelled,
          searchOrderStatusCompleted: searchOrderStatusCompleted,
          
          //searchBuyer: searchBuyer,
          searchBuyer: '',
          //searchDepositName: searchDepositName,
          searchDepositName: '',
          //searchStoreBankAccountNumber: searchStoreBankAccountNumber,
          searchStoreBankAccountNumber: '',






        })
      });
      if (!response.ok) {
        setLoadingTradeSummary(false);
        toast.error('Failed to fetch trade summary');
        return;
      }
      const data = await response.json();
      
      //console.log('getTradeSummary data', data);


      setTradeSummary(data.result);

      setLoadingTradeSummary(false);
      return data.result;
    }



    useEffect(() => {

      if (!address) {
        return;
      }

      getTradeSummary();

      // fetch trade summary every 10 seconds
      const interval = setInterval(() => {
        getTradeSummary();
      }, 10000);
      return () => clearInterval(interval);


    } , [address, searchMyOrders, searchStorecode, searchOrderStatusCancelled, searchOrderStatusCompleted, ]);
    */







     // get All stores
  const [fetchingAllStores, setFetchingAllStores] = useState(false);
  const [allStores, setAllStores] = useState([] as any[]);
  const [storeTotalCount, setStoreTotalCount] = useState(0);
  const fetchAllStores = async () => {
    if (fetchingAllStores) {
      return;
    }
    setFetchingAllStores(true);
    const response = await fetch('/api/store/getAllStoresForBalance', {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json',
      },
      body: JSON.stringify(
        {
          limit: 100,
          page: 1,
        }
      ),
    });

    if (!response.ok) {
      setFetchingAllStores(false);
      toast.error('가맹점 검색에 실패했습니다.');
      return;
    }

    const data = await response.json();
    
    //console.log('getAllStores data', data);




    setAllStores(data.result.stores);
    setStoreTotalCount(data.result.totalCount);
    setFetchingAllStores(false);
    return data.result.stores;
  }
  useEffect(() => {
    if (!address) {
      setAllStores([]);
      return;
    }
    fetchAllStores();
  }, [address]);




  // totalNumberOfBuyOrders
  const [loadingTotalNumberOfBuyOrders, setLoadingTotalNumberOfBuyOrders] = useState(false);
  const [totalNumberOfBuyOrders, setTotalNumberOfBuyOrders] = useState(0);
  const [processingBuyOrders, setProcessingBuyOrders] = useState([] as BuyOrder[]);
  const [totalNumberOfAudioOnBuyOrders, setTotalNumberOfAudioOnBuyOrders] = useState(0);


  // Move fetchTotalBuyOrders outside of useEffect to avoid self-reference error
  const fetchTotalBuyOrders = async (): Promise<void> => {
    setLoadingTotalNumberOfBuyOrders(true);
    const response = await fetch('/api/order/getTotalNumberOfBuyOrders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
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

  useEffect(() => {
    if (!address) {
      setTotalNumberOfBuyOrders(0);
      return;
    }

    fetchTotalBuyOrders();

    const interval = setInterval(() => {
      fetchTotalBuyOrders();
    }, 5000);
    return () => clearInterval(interval);

  }, [address]);

      
  /*
  useEffect(() => {
    if (totalNumberOfBuyOrders > 0 && loadingTotalNumberOfBuyOrders === false) {
      const audio = new Audio('/notification.wav'); 
      audio.play();
    }
  }, [totalNumberOfBuyOrders, loadingTotalNumberOfBuyOrders]);
  */

  useEffect(() => {
    if (totalNumberOfAudioOnBuyOrders > 0 && loadingTotalNumberOfBuyOrders === false) {
      const audio = new Audio('/notification.wav');
      audio.play();
    }
  }, [totalNumberOfAudioOnBuyOrders, loadingTotalNumberOfBuyOrders]);






  // totalNumberOfClearanceOrders
  const [loadingTotalNumberOfClearanceOrders, setLoadingTotalNumberOfClearanceOrders] = useState(false);
  const [totalNumberOfClearanceOrders, setTotalNumberOfClearanceOrders] = useState(0);
  const [processingClearanceOrders, setProcessingClearanceOrders] = useState([] as BuyOrder[]);
  useEffect(() => {
    if (!address) {
      setTotalNumberOfClearanceOrders(0);
      return;
    }

    const fetchTotalClearanceOrders = async () => {
      setLoadingTotalNumberOfClearanceOrders(true);
      const response = await fetch('/api/order/getTotalNumberOfClearanceOrders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
        }),
      });
      if (!response.ok) {
        console.error('Failed to fetch total number of clearance orders');
        return;
      }
      const data = await response.json();
      //console.log('getTotalNumberOfClearanceOrders data', data);
      setTotalNumberOfClearanceOrders(data.result.totalCount);
      setProcessingClearanceOrders(data.result.orders);

      setLoadingTotalNumberOfClearanceOrders(false);
    };

    fetchTotalClearanceOrders();

    const interval = setInterval(() => {
      fetchTotalClearanceOrders();
    }, 5000);
    return () => clearInterval(interval);

  }, [address]);

  useEffect(() => {
    if (totalNumberOfClearanceOrders > 0 && loadingTotalNumberOfClearanceOrders === false) {
      const audio = new Audio('/notification.wav');
      audio.play();
    }
  }, [totalNumberOfClearanceOrders, loadingTotalNumberOfClearanceOrders]);




    // audio notification state
  const [audioNotification, setAudioNotification] = useState<boolean[]>([]);
  
  // keep audioNotification in sync with buyOrders
  useEffect(() => {
    setAudioNotification(
      buyOrders.map((item) => !!item.audioOn)
    );
  }, [buyOrders]);
  
  // handleAudioToggle
  const handleAudioToggle = (index: number, orderId: string) => {
    // api call
    fetch('/api/order/toggleAudioNotification', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        orderId: orderId,
        audioOn: !audioNotification[index],
        walletAddress: address,
      }),
    })
    .then(response => response.json())
    .then(data => {
      
      //console.log('toggleAudioNotification data', data);
      //alert('toggleAudioNotification data: ' + JSON.stringify(data));
      /*
      {"success":true,"message":"Audio notification setting updated successfully"}
      */

      if (data.success) {
        // update local state for immediate UI feedback
        setAudioNotification((prev) =>
          prev.map((v, i) => (i === index ? !v : v))
        );
        toast.success('오디오 알림 설정이 변경되었습니다.');
      } else {
        toast.error('오디오 알림 설정 변경에 실패했습니다.');
      }
    })
    .catch(error => {
      console.error('Error toggling audio notification:', error);
      toast.error('오디오 알림 설정 변경에 실패했습니다.' + error.message);
    });
  };




  // /api/user/getAllSellersForBalance
  const [sellersBalance, setSellersBalance] = useState([] as any[]);
  const fetchSellersBalance = async () => {
    const response = await fetch('/api/user/getAllSellersForBalance', {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json',
      },
      body: JSON.stringify(
        {
          limit: 100,
          page: 1,
        }
      )
    });

    const data = await response.json();
    if (data.result) {
      setSellersBalance(data.result.users);


    } else {
      console.error('Error fetching sellers balance');
    }
  };
  useEffect(() => {
    if (!address) {
      setSellersBalance([]);
      return;
    }
    fetchSellersBalance();
    // interval to fetch every 10 seconds
    const interval = setInterval(() => {
      fetchSellersBalance();
    }, 10000);
    return () => clearInterval(interval);
  }, [address]);


  //console.log('sellersBalance', sellersBalance);

  // currentUsdtBalance array for animated display
  const [currentUsdtBalanceArray, setCurrentUsdtBalanceArray] = useState<number[]>([]);
  function animateUsdtBalance(targetBalances: number[]) {
    const animationDuration = 1000; // 1 second
    const frameRate = 30; // 30 frames per second
    const totalFrames = Math.round((animationDuration / 1000) * frameRate);
    const initialBalances = currentUsdtBalanceArray.length === targetBalances.length
      ? [...currentUsdtBalanceArray]
      : targetBalances.map(() => 0);

    let frame = 0;
    const interval = setInterval(() => {
      frame++;
      const newBalances = targetBalances.map((target, index) => {
        const initial = initialBalances[index];
        const progress = Math.min(frame / totalFrames, 1);
        return initial + (target - initial) * progress;
      });
      setCurrentUsdtBalanceArray(newBalances);
      if (frame >= totalFrames) {
        clearInterval(interval);
      }
    }, 1000 / frameRate);
  }
  useEffect(() => {
    const targetBalances = sellersBalance.map((seller) => seller.currentUsdtBalance || 0);
    animateUsdtBalance(targetBalances);
  }, [sellersBalance]);




  if (!address) {
    return (
      <div className="flex flex-col items-center justify-center">


        {/* banner-igor-bastidas-7.gif */}
        <Image
          src="/banner-igor-bastidas-7.gif"
          alt="Banner"
          width={500}
          height={200}
        />

      </div>
    );
  }


  if (address && loadingUser) {
    return (
    <main className="p-4 pb-10 min-h-[100vh] flex items-start justify-center container max-w-screen-2xl mx-auto bg-neutral-50 text-gray-900">
        <div className="py-0 w-full flex flex-col items-center justify-center gap-4">

          <Image
            src="/banner-loading.gif"
            alt="Loading"
            width={200}
            height={200}
          />

          <div className="text-lg text-gray-500">회원 정보를 불러오는 중</div>
        </div>
      </main>
    );
  }


  if (address && !loadingUser && !isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center">

        <h1 className="text-2xl font-bold">접근권한을 확인중입니다...</h1>
        <p className="text-lg">이 페이지에 접근할 권한이 없습니다.</p>
        <div className="text-lg text-gray-500">{address}</div>



              
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
    <main className="p-4 pb-10 min-h-[100vh] flex items-start justify-center container max-w-screen-2xl mx-auto bg-neutral-50 text-gray-900">
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
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-slide {
          animation: fadeSlideIn 300ms ease-out;
        }
        @keyframes slideInTop {
          from { transform: translateY(-10px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes slideInBottom {
          from { transform: translateY(10px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .slide-in-top { animation: slideInTop 0.45s ease-out; }
        .slide-in-bottom { animation: slideInBottom 0.45s ease-out; }
        @keyframes fadeStatus {
          0% { opacity: 0; transform: translateY(4px); }
          40% { opacity: 1; transform: translateY(0); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .fade-status { animation: fadeStatus 480ms ease-out; }
        @keyframes expandRow {
          0% { transform: scaleY(0.8); opacity: 0; }
          70% { transform: scaleY(1.02); opacity: 1; }
          100% { transform: scaleY(1); opacity: 1; }
        }
        .expand-row {
          transform-origin: top;
          animation: expandRow 0.35s ease-out;
        }
        @keyframes statusPulseGray {
          0% { box-shadow: 0 0 0 0 rgba(107,114,128,0.45); }
          100% { box-shadow: 0 0 0 10px rgba(107,114,128,0); }
        }
        @keyframes statusPulseAmber {
          0% { box-shadow: 0 0 0 0 rgba(245,158,11,0.45); }
          100% { box-shadow: 0 0 0 10px rgba(245,158,11,0); }
        }
        @keyframes statusPulseEmerald {
          0% { box-shadow: 0 0 0 0 rgba(16,185,129,0.45); }
          100% { box-shadow: 0 0 0 10px rgba(16,185,129,0); }
        }
        @keyframes statusPulseRose {
          0% { box-shadow: 0 0 0 0 rgba(244,63,94,0.45); }
          100% { box-shadow: 0 0 0 10px rgba(244,63,94,0); }
        }
        .status-pulse-gray { animation: statusPulseGray 0.8s ease-out; }
        .status-pulse-amber { animation: statusPulseAmber 0.8s ease-out; }
        .status-pulse-emerald { animation: statusPulseEmerald 0.8s ease-out; }
        .status-pulse-rose { animation: statusPulseRose 0.8s ease-out; }
        @keyframes contentReveal {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes flashReveal {
          0% { box-shadow: 0 0 0 0 rgba(255,193,7,0.65); background-color: rgba(255,236,179,0.95); }
          60% { box-shadow: 0 0 0 10px rgba(255,193,7,0.05); background-color: rgba(255,236,179,0.2); }
          100% { box-shadow: 0 0 0 14px rgba(255,193,7,0); background-color: transparent; }
        }
        .content-reveal {
          animation: contentReveal 0.4s ease-out, flashReveal 0.6s ease-out;
          border-radius: 6px;
        }
        @keyframes balanceFlash {
          0% { box-shadow: 0 0 0 0 rgba(21,128,61,0.85); background-color: rgba(16,185,129,0.25); }
          35% { box-shadow: 0 0 0 14px rgba(21,128,61,0.40); background-color: rgba(16,185,129,0.15); }
          70% { box-shadow: 0 0 0 26px rgba(21,128,61,0.12); background-color: rgba(16,185,129,0.06); }
          100% { box-shadow: 0 0 0 34px rgba(21,128,61,0); background-color: transparent; }
        }
        .balance-flash { animation: balanceFlash 1s ease-out; }
        .balance-flash-target { animation: balanceFlash 1s ease-out; }
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

              {loadingTotalNumberOfClearanceOrders ? (
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

              {/* array of processingClearanceOrders store logos */}
              <div className="flex flex-row items-center justify-center gap-1">
                {processingClearanceOrders.slice(0, 3).map((order: BuyOrder, index: number) => (

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

                {processingClearanceOrders.length > 3 && (
                  <span className="text-sm text-gray-500">
                    +{processingClearanceOrders.length - 3}
                  </span>
                )}
              </div>


              <p className="text-lg text-yellow-500 font-semibold">
                {
                totalNumberOfClearanceOrders
                }
              </p>

              {totalNumberOfClearanceOrders > 0 && (
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
                      router.push('/' + params.lang + '/admin/clearance-history');
                    }}
                    className="flex items-center justify-center gap-2
                    bg-[#3167b4] text-sm text-[#f3f4f6] px-4 py-2 rounded-lg hover:bg-[#3167b4]/80"
                  >
                    <span className="text-sm">
                      청산<br />관리
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
                alt="Merchant"
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

        <div className="w-full flex flex-col sm:flex-row items-center justify-center gap-2 bg-black/10 p-2 rounded-lg mb-4">
            
          {/*
          <div className="w-full flex flex-row items-center justify-start gap-2">
            <button
              onClick={() => router.push('/' + params.lang + '/admin')}
              className="flex items-center justify-center gap-2
              rounded-lg p-2
              hover:bg-black/20
              hover:cursor-pointer
              hover:scale-105
              transition-transform duration-200 ease-in-out"

            >
              <Image
                src="/logo.png"
                alt="logo"
                width={100}
                height={100}
                className="h-10 w-10 rounded-full"
              />
            </button>
          </div>
          */}


          {address && !loadingUser && (


            <div className="w-full flex flex-row items-center justify-end gap-2">
              <button
                onClick={() => {
                  router.push('/' + params.lang + '/admin/profile-settings');
                }}
                className="flex bg-[#3167b4] text-sm text-[#f3f4f6] px-4 py-2 rounded-lg hover:bg-[#3167b4]/80"
              >
                <div className="flex flex-row items-center justify-center gap-2">
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
                        전체 관리자
                      </span>
                    </div>
                  )}
                  <span className="text-sm text-[#f3f4f6]">
                    {user?.nickname || "프로필"}
                  </span>

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


          )}


        </div>



        <div className="flex flex-col items-start justify-center gap-2 mt-4">


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
          


            <div className="grid grid-cols-3 xl:grid-cols-6 gap-2 items-center justify-start mb-4">


              <button
                  onClick={() => router.push('/' + params.lang + '/admin/store')}
                  className="flex w-32 bg-[#3167b4] text-[#f3f4f6] text-sm rounded-lg p-2 items-center justify-center
                  hover:bg-[#3167b4]/80
                  hover:cursor-pointer
                  hover:scale-105
                  transition-transform duration-200 ease-in-out
                  ">
                  가맹점관리
              </button>

              <button
                  onClick={() => router.push('/' + params.lang + '/admin/agent')}
                  className="flex w-32 bg-[#3167b4] text-[#f3f4f6] text-sm rounded-lg p-2 items-center justify-center
                  hover:bg-[#3167b4]/80
                  hover:cursor-pointer
                  hover:scale-105
                  transition-transform duration-200 ease-in-out
                  ">
                  에이전트관리
              </button>


              <button
                  onClick={() => router.push('/' + params.lang + '/admin/member')}
                  className="flex w-32 bg-[#3167b4] text-[#f3f4f6] text-sm rounded-lg p-2 items-center justify-center
                  hover:bg-[#3167b4]/80
                  hover:cursor-pointer
                  hover:scale-105
                  transition-transform duration-200 ease-in-out
                  ">
                  회원관리
              </button>

              <div className='flex w-32 items-center justify-center gap-2
              bg-yellow-500 text-[#3167b4] text-sm rounded-lg p-2'>
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
                  onClick={() => router.push('/' + params.lang + '/admin/trade-history')}
                  className="flex w-32 bg-[#3167b4] text-[#f3f4f6] text-sm rounded-lg p-2 items-center justify-center
                  hover:bg-[#3167b4]/80
                  hover:cursor-pointer
                  hover:scale-105
                  transition-transform duration-200 ease-in-out
                  ">
                  P2P 거래내역
              </button>

              {version !== 'bangbang' && (
                <button
                  onClick={() => router.push('/' + params.lang + '/admin/clearance-history')}
                  className="flex w-32 bg-[#3167b4] text-[#f3f4f6] text-sm rounded-lg p-2 items-center justify-center
                  hover:bg-[#3167b4]/80
                  hover:cursor-pointer
                  hover:scale-105
                  transition-transform duration-200 ease-in-out
                  ">
                  청산관리
              </button>
              )}

              <button
                  onClick={() => router.push('/' + params.lang + '/admin/trade-history-daily')}
                  className="flex w-32 bg-[#3167b4] text-[#f3f4f6] text-sm rounded-lg p-2 items-center justify-center
                  hover:bg-[#3167b4]/80
                  hover:cursor-pointer
                  hover:scale-105
                  transition-transform duration-200 ease-in-out
                  ">
                  P2P통계(가맹)
              </button>

              <button
                  onClick={() => router.push('/' + params.lang + '/admin/trade-history-daily-agent')}
                  className="flex w-32 bg-[#3167b4] text-[#f3f4f6] text-sm rounded-lg p-2 items-center justify-center
                  hover:bg-[#3167b4]/80
                  hover:cursor-pointer
                  hover:scale-105
                  transition-transform duration-200 ease-in-out
                  ">
                  P2P통계(AG)
              </button>

              {version !== 'bangbang' && (
                <button
                    onClick={() => router.push('/' + params.lang + '/admin/escrow-history')}
                    className="flex w-32 bg-[#3167b4] text-[#f3f4f6] text-sm rounded-lg p-2 items-center justify-center
                    hover:bg-[#3167b4]/80
                    hover:cursor-pointer
                  hover:scale-105
                  transition-transform duration-200 ease-in-out
                  ">
                  보유량내역
                </button>
              )}

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

          {/*
          {address && (
              <div className="w-full flex flex-col items-end justify-center gap-4">

                  <div className="flex flex-row items-center justify-center gap-2">
                      <Image
                          src="/icon-shield.png"
                          alt="Wallet"
                          width={50}
                          height={50}
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

                  <div className="flex flex-row items-center justify-center  gap-2">
                    <Image
                        src="/icon-tether.png"
                        alt="USDT"
                        width={50}
                        height={50}
                        className="w-6 h-6"
                    />
                    <span className="text-2xl xl:text-4xl font-semibold text-[#409192]"
                      style={{ fontFamily: 'monospace' }}
                    >
                        {Number(balance).toFixed(3).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    </span>
                  </div>

              </div>
          )}
          */}



          <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-5">

            <div className="flex flex-col sm:flex-row items-center gap-2">


              {/* select storecode */}
              <div className="flex flex-row items-center gap-2">
                {fetchingAllStores ? (
                  <Image
                    src="/loading.png"
                    alt="Loading"
                    width={20}
                    height={20}
                    className="animate-spin"
                  />
                ) : (
                  <div className="flex flex-row items-center gap-2">

                    
                    <Image
                      src="/icon-store.png"
                      alt="Store"
                      width={20}
                      height={20}
                      className="rounded-lg w-5 h-5"
                    />

                    <span className="
                      w-32
                      text-sm font-semibold">
                      가맹점 선택
                    </span>


                    <select
                      value={searchStorecode}
                      
                      // storecode parameter is passed to fetchBuyOrders
                      onChange={(e) => {
                        setSearchStorecode(e.target.value);
                        router.push('/' + params.lang + '/admin/buyorder?storecode=' + e.target.value);
                      }}



                      className="w-full p-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3167b4]"
                    >
                      <option value="">전체</option>
                      {allStores && allStores.map((item, index) => (
                        <option key={index} value={item.storecode}
                          className="flex flex-row items-center justify-start gap-2"
                        >
                          
                          {item.storeName}{' '}({item.storecode})

                        </option>
                      ))}
                    </select>


                  </div>

                )}
              </div>


              <div className="flex flex-row items-center gap-2">
                {/* checkbox for searchOrderStatus is 'cancelled' */}
                {/* 거래취소 */}
                {/* 거래완료 */}
                {/* only one checkbox can be checked */}
                <div className="flex flex-row items-center gap-1">
                  <input
                    type="checkbox"
                    checked={searchOrderStatusCancelled}
                    onChange={(e) => {
                      setSearchOrderStatusCancelled(e.target.checked);
                      setPageValue(1);
                      //fetchBuyOrders();
                    }}
                    className="w-5 h-5"
                  />
                  <label className="text-sm text-zinc-500">거래취소</label>
                </div>
                <div className="flex flex-row items-center gap-1">
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
                        // korea time
                        const today = new Date();
                        today.setHours(today.getHours() + 9); // Adjust for Korean timezone (UTC+9)
                        setSearchFormDate(today.toISOString().split("T")[0]);
                        setSearchToDate(today.toISOString().split("T")[0]);
                      }}
                      className="text-sm text-zinc-500 underline"
                    >
                      오늘
                    </button>
                    <button
                      onClick={() => {
                        // korea time yesterday
                        const today = new Date();
                        today.setHours(today.getHours() + 9); // Adjust for Korean timezone (UTC+9)
                        const yesterday = new Date(today);
                        yesterday.setDate(yesterday.getDate() - 1);
                        setSearchFormDate(yesterday.toISOString().split("T")[0]);
                        setSearchToDate(yesterday.toISOString().split("T")[0]);
                      }}
                      className="text-sm text-zinc-500 underline"
                    >
                      어제
                    </button>
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
          <div className="sm:hidden w-full flex flex-row items-center justify-end gap-2">

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

            {version !== 'bangbang' && (
            <div className="flex flex-row items-center justify-center gap-2
            bg-white/80
            p-2 rounded-lg shadow-md
            backdrop-blur-md
            ">

              {loadingTotalNumberOfClearanceOrders ? (
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

              <p className="text-lg text-yellow-500 font-semibold">
                {
                totalNumberOfClearanceOrders
                }
              </p>

              {totalNumberOfClearanceOrders > 0 && (
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
                      router.push('/' + params.lang + '/admin/clearance-history');
                    }}
                    className="flex items-center justify-center gap-2
                    bg-[#3167b4] text-sm text-[#f3f4f6] px-4 py-2 rounded-lg hover:bg-[#3167b4]/80"
                  >
                    <span className="text-sm">
                      청산관리
                    </span>
                  </button>
                </div>
              )}
            </div>
            )}
        
          </div>
          */}

          {/* sellersBalance array row */}
          {/*
            users: [
              {
                _id: new ObjectId('68acfb7bb8c1f34ff993f85e'),
                id: 5284419,
                nickname: 'cryptoss',
                walletAddress: '0x4429A977379fdd42b54A543E91Da81Abe7bb52FD',
                currentUsdtBalance: 200.189869
              },
              {
                _id: new ObjectId('68fec05162e030d977139b30'),
                id: 5644419,
                nickname: 'seller1',
                walletAddress: '0x7F3362c7443AE1Eb1790d0A2d4D84EB306fE0bd3',
                currentUsdtBalance: 4
              }
            ],
          */}



          {/*
          /ko/admin/withdraw-vault?walletAddress=0x7F3362c7443AE1Eb1790d0A2d4D84EB306fE0bd3
          */}


          {/* buyOrderStats.totalByBuyerDepositName */}
          {/*
          <div className="w-full
            grid grid-cols-4 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-1
            items-start justify-start">
            {buyOrderStats.totalByBuyerDepositName?.map((item, index) => (
              <div
                key={index}
                className={`flex flex-col gap-1 items-center
                p-2 rounded-lg shadow-md
                backdrop-blur-md
                ${buyerDisplayValueArray && buyerDisplayValueArray[index] !== undefined && buyerDisplayValueArray[index] !== item.totalKrwAmount
                  ? 'bg-yellow-100/80 animate-pulse'
                  : 'bg-white/80'}
                `}
              >
                <div className="flex flex-row items-start justify-start gap-1">
                  <Image
                    src="/icon-user.png"
                    alt="User"
                    width={20}
                    height={20}
                    className="w-4 h-4"
                  />          
                  <button
                    className="text-xs font-semibold underline text-blue-600"
                    onClick={() => {
                      const depositName = item._id || '알수없음';
                      navigator.clipboard.writeText(depositName)
                        .then(() => {
                          toast.success(`입금자명 ${depositName} 복사됨`);
                        })
                        .catch((err) => {
                          toast.error('복사 실패: ' + err);
                        });
                    }}
                    title="입금자명 복사"
                  >
                    {item._id || '알수없음'}
                  </button>
                </div>
                <div className="w-full flex flex-row items-center justify-between gap-1">
                  <span className="text-xs text-zinc-500">
                    {item.totalCount?.toLocaleString() || '0'}
                  </span>
                  <span className="text-xs text-yellow-600"
                    style={{ fontFamily: 'monospace' }}>
                    {(item.totalKrwAmount || 0).toLocaleString()}
                  </span>
                </div>
              </div>
            ))}


            {buyOrderStats.totalReaultGroupByBuyerDepositNameCount! - buyOrderStats.totalByBuyerDepositName!.length > 0 && (

              <div className="text-xl font-bold text-red-500
                flex items-center justify-center"
              >
                +{buyOrderStats.totalReaultGroupByBuyerDepositNameCount! - buyOrderStats.totalByBuyerDepositName!.length} 명
              </div>

            )}

          </div>
          */}

          {/* 판매자 통장별 P2P 거래 통계 */}
          <div className="w-full mt-2">
            <div className="w-full flex items-center justify-between mb-2 gap-2">
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
                <span className="text-xs text-zinc-500">
                  총 {buyOrderStats.totalBySellerBankAccountNumber?.length || 0} 계좌
                </span>
              </div>
              <div />
            </div>

            {showSellerBankStats && (
                <div className="w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 items-start">
                {buyOrderStats.totalBySellerBankAccountNumber?.map((item, index) => (
                  <div
                    key={index}
                    className={`flex flex-col gap-1.5 items-start
                    p-3 rounded-xl border border-zinc-200 bg-white
                    ${
                      lastestBalanceArray && lastestBalanceArray[index] !== undefined && lastestBalanceArray[index] !== item.bankUserInfo[0]?.balance
                        ? 'ring-1 ring-emerald-200'
                        : sellerBankAccountDisplayValueArray && sellerBankAccountDisplayValueArray[index] !== undefined && sellerBankAccountDisplayValueArray[index] !== item.totalKrwAmount
                          ? 'ring-1 ring-amber-200'
                          : ''
                    }
                    ${balanceFlashSet.has(index) ? 'balance-flash' : ''}
                    `}
                  >
                    <div className="flex items-start gap-3 w-full justify-between">
                      <div className="flex flex-col min-w-0 gap-0.5 leading-tight">
                        <div className="flex items-center gap-2">
                          <Image
                            src="/icon-bank.png"
                            alt="Bank"
                            width={20}
                            height={20}
                            className="w-5 h-5 rounded-md border border-zinc-200 bg-white object-cover"
                          />
                          <button
                            className="text-sm font-semibold text-blue-600 underline truncate text-left"
                            onClick={() => {
                              const accountNumber =
                                item.bankUserInfo?.[0]?.defaultAccountNumber ||
                                item._id ||
                                '기타은행';
                              navigator.clipboard
                                .writeText(accountNumber)
                                .then(() => toast.success(`통장번호 ${accountNumber} 복사됨`))
                                .catch((err) => toast.error('복사 실패: ' + err));
                            }}
                            title="계좌번호 복사"
                          >
                            {item.bankUserInfo?.[0]?.defaultAccountNumber || item._id || '기타은행'}
                          </button>
                        </div>
                        <span className="text-xs text-zinc-500 truncate leading-tight">
                          {item.bankUserInfo?.[0]?.accountHolder || '예금주 없음'} · {item.bankUserInfo?.[0]?.bankName || '은행명 없음'}
                        </span>
                        <span className="text-[11px] text-zinc-400 truncate leading-tight" style={{ fontFamily: 'monospace' }}>
                          실계좌번호: {item.bankUserInfo?.[0]?.realAccountNumber || item.bankUserInfo?.[0]?.accountNumber || '-'}
                        </span>
                      </div>
                      <button
                        className="text-xs px-2 py-1 rounded-md border border-zinc-300 text-zinc-600 hover:bg-zinc-100 shrink-0"
                        onClick={() =>
                          fetchAliasTransfers(
                            item.bankUserInfo?.[0]?.realAccountNumber
                            || item.bankUserInfo?.[0]?.accountNumber
                            || item._id
                            || '기타은행',
                            {
                              bankName: item.bankUserInfo?.[0]?.bankName,
                              accountHolder: item.bankUserInfo?.[0]?.accountHolder,
                              aliasAccountNumber: item.bankUserInfo?.[0]?.defaultAccountNumber || item._id || '',
                              defaultAccountNumber: item.bankUserInfo?.[0]?.defaultAccountNumber || item._id || '',
                              realAccountNumber: item.bankUserInfo?.[0]?.realAccountNumber || item.bankUserInfo?.[0]?.accountNumber || item._id || '',
                            }
                          )
                        }
                      >
                        입금내역
                      </button>
                    </div>

                    <div className="w-full flex items-center justify-between text-xs">
                      <span className="text-sm text-zinc-500">잔액(원)</span>
                      <span className="text-xl font-extrabold text-amber-600 tracking-tight balance-flash-target" style={{ fontFamily: 'monospace' }}>
                        {lastestBalanceArray && lastestBalanceArray[index] !== undefined
                          ? lastestBalanceArray[index].toLocaleString()
                          : '잔액정보없음'}
                      </span>
                    </div>

                    <div className="w-full flex items-center justify-between text-xs">
                      <span className="font-semibold text-zinc-600">{item.totalCount?.toLocaleString() || '0'}</span>
                      <span className="font-semibold text-amber-600" style={{ fontFamily: 'monospace' }}>
                        {sellerBankAccountDisplayValueArray && sellerBankAccountDisplayValueArray[index] !== undefined
                          ? sellerBankAccountDisplayValueArray[index].toLocaleString()
                          : '0'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>


          {/* 미신청입금 내역 */}
          
          <div className="w-full mt-4">
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
                className="px-2 py-1 text-xs border border-zinc-300 rounded-md text-zinc-600 hover:bg-zinc-100"
                onClick={downloadUnmatchedExcel}
              >
                엑셀다운로드
              </button>
              <button
                className="px-2 py-1 text-xs border border-zinc-300 rounded-md text-zinc-600 hover:bg-zinc-100 disabled:opacity-50"
                onClick={fetchUnmatchedTransfers}
                disabled={unmatchedLoading}
              >
                {unmatchedLoading ? '갱신중...' : '새로고침'}
              </button>
              <button
                className="px-2 py-1 text-xs border border-zinc-300 rounded-md text-zinc-600 hover:bg-zinc-100"
                onClick={() => unmatchedScrollRef.current?.scrollTo({ left: 0, behavior: 'smooth' })}
                title="처음으로"
              >
                « 처음
              </button>
              <button
                className="px-2 py-1 text-xs border border-zinc-300 rounded-md text-zinc-600 hover:bg-zinc-100"
                onClick={() => {
                  const el = unmatchedScrollRef.current;
                  if (!el) return;
                  el.scrollTo({ left: el.scrollWidth, behavior: 'smooth' });
                }}
                title="마지막으로"
              >
                마지막 »
              </button>
            </div>

            {showUnmatched && (
            <div className="w-full overflow-x-auto">
              {unmatchedTransfers.length === 0 ? (
                <div className="min-h-[120px] flex flex-col items-center justify-center gap-2 text-sm text-zinc-600 border border-neutral-200 rounded-xl bg-white px-4">
                  <div className="flex items-center gap-2 text-[13px] text-zinc-500">
                    <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                    <span>{unmatchedLoading ? '불러오는 중...' : '미신청 입금이 없습니다.'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[13px] text-emerald-700 font-semibold">
                    <span>자정까지 남은 시간</span>
                    <span className="font-mono text-lg animate-pulse">{unmatchedCountdown}</span>
                  </div>
                </div>
              ) : (
                <div
                  className="flex gap-2 pb-2 overflow-x-auto"
                  ref={unmatchedScrollRef}
                >
                  {(() => {
                    const timestamps = unmatchedTransfers
                      .map((t) => {
                        const d = new Date(t.transactionDate || t.processingDate || t.regDate);
                        return Number.isNaN(d.getTime()) ? null : d.getTime();
                      })
                      .filter((v) => v !== null) as number[];
                    const oldest = timestamps.length ? Math.min(...timestamps) : null;
                    const newest = timestamps.length ? Math.max(...timestamps) : null;
                    return unmatchedTransfers.map((transfer, index) => {
                      const cardProps = getUnmatchedCardProps(
                        transfer.transactionDate || transfer.processingDate || transfer.regDate,
                        oldest,
                        newest
                      );
                      return (
                    <div
                      key={transfer._id || index}
                      className={`min-w-[220px] max-w-[240px] p-3 border rounded-lg shadow-sm flex flex-col gap-1.5 ${cardProps.alertClass}`}
                      style={cardProps.style}
                    >
                      <div className="flex items-center justify-between text-[11px] text-zinc-500">
                        <span className="font-semibold text-zinc-600">No.{unmatchedTransfers.length - index}</span>
                        <div className="flex items-center gap-1">
                          <button
                            className={`px-2 py-[2px] text-[10px] rounded-full border ${
                              transfer.alarmOn === false
                                ? 'border-zinc-300 text-zinc-500 bg-white'
                                : 'border-rose-300 text-rose-600 bg-rose-50'
                            } ${togglingAlarmId === (transfer._id || '') ? 'opacity-60 cursor-wait' : 'hover:opacity-90'}`}
                            onClick={() => toggleAlarm(transfer._id, transfer.alarmOn !== false)}
                            disabled={togglingAlarmId === (transfer._id || '')}
                          >
                            {transfer.alarmOn === false ? '알람 끔' : '알람 켬'}
                          </button>
                          <span className="px-2 py-[2px] text-[10px] font-semibold rounded-full bg-rose-50 text-rose-600 border border-rose-100">
                            {formatTimeAgo(transfer.transactionDate || transfer.processingDate || transfer.regDate)}
                          </span>
                        </div>
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
          


          {sellersBalance.length > 0 && (
            <div className="w-full flex flex-col sm:flex-row items-center justify-end gap-4 overflow-x-auto">

              {sellersBalance.map((seller, index) => (
                <div key={index}
                  //className="flex flex-row items-center justify-between gap-4
                 // bg-white/80
                  //p-4 rounded-lg shadow-md
                  //backdrop-blur-md
                  //"
                  // if currentUsdtBalanceArray[index] is changed, then animate the background color
                  className={`flex flex-col sm:flex-row items-center justify-between gap-4
                  p-4 rounded-lg shadow-md
                  backdrop-blur-md
                  ${currentUsdtBalanceArray && currentUsdtBalanceArray[index] !== undefined && currentUsdtBalanceArray[index] !== seller.currentUsdtBalance
                    ? 'bg-green-100/80 animate-pulse'
                    : 'bg-white/80'}
                  `}
                  >
                  <div className="flex flex-row items-center gap-4">
                    <Image
                      src="/icon-seller.png"
                      alt="Seller"
                      width={40}
                      height={40}
                      className="w-10 h-10"
                    />
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold">
                        {seller.nickname}
                      </span>
                      <button
                        className="text-sm text-zinc-600 underline"
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
                      width={30}
                      height={30}
                      className="w-7 h-7"
                    />
                    <span className="text-2xl font-semibold text-[#409192]"
                      style={{ fontFamily: 'monospace' }}>
                      {
                        //Number(seller.currentUsdtBalance).toFixed(3).replace(/\B(?=(\d{3})+(?!\d))/g, ',')

                        currentUsdtBalanceArray && currentUsdtBalanceArray[index] !== undefined
                        ? currentUsdtBalanceArray[index].toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                        : '0.00'
                      }
                    </span>
                  </div>

                  {/* if seller nickname is 'seller', then show withdraw button */}
                  {seller.nickname === 'seller' && (
                    <button
                      onClick={() => {
                        router.push('/' + params.lang + '/admin/withdraw-vault?walletAddress=' + seller.walletAddress);
                      }}
                      className="bg-[#3167b4] text-sm text-[#f3f4f6] px-4 py-2 rounded-lg hover:bg-[#3167b4]/80"
                    >
                      출금하기
                    </button>
                  )}

                </div>
              ))}

            </div>
          )}

          {/* 처리안한주문 먼저보기 (주문 테이블 상단) */}
          <div className="w-full flex items-start justify-start mb-2">
            <label className="flex items-center gap-2 text-sm text-zinc-600">
              <input
                type="checkbox"
                checked={prioritizePending}
                onChange={(e) => setPrioritizePending(e.target.checked)}
                className="w-5 h-5"
              />
              <span className="whitespace-nowrap">처리안한주문 먼저보기</span>
            </label>
          </div>

          {/* buyOrders table */}
          <div className="w-full overflow-x-auto">

            <table className="w-full table-auto border-collapse border border-neutral-200 rounded-xl shadow-sm bg-white text-[13px] leading-tight [&>thead>tr>th]:py-2 [&>thead>tr>th]:px-3 [&>tbody>tr>td]:py-2 [&>tbody>tr>td]:px-3">

              <thead className="bg-neutral-900 text-white text-sm font-semibold">
                <tr>

                  <th className="p-3 text-start">
                    <div className="flex flex-col items-start justify-center gap-1">
                      <span className="text-xs uppercase tracking-wide text-neutral-300">
                        가맹점
                      </span>
                      <span className="text-xs uppercase tracking-wide text-neutral-300">
                        P2P거래번호
                      </span>
                      <span className="text-xs uppercase tracking-wide text-neutral-300">
                        거래시작시간
                      </span>
                    </div>
                  </th>

                  <th className="p-3 text-start">
                    <div className="flex flex-col items-start justify-center gap-1">
                      <span className="text-xs uppercase tracking-wide text-neutral-300">
                        P2P 구매자 아이디
                      </span>
                      <span className="text-xs uppercase tracking-wide text-neutral-300">
                        USDT지갑
                      </span>
                      <span className="text-xs uppercase tracking-wide text-neutral-300">
                        입금자
                      </span>
                    </div>
                  </th>
                  
                  <th className="p-3 text-end">
                    <div className="flex flex-col items-end justify-center gap-1">
                      <span className="text-xs uppercase tracking-wide text-neutral-300">
                        {Buy_Amount}(USDT)
                      </span>
                      <span className="text-xs uppercase tracking-wide text-neutral-300">
                        구매금액(원)
                      </span>
                      <span className="text-xs uppercase tracking-wide text-neutral-300">
                        개당금액(원)
                      </span>
                    </div>
                  </th>
                  {/*
                  <th className="p-2">{Payment_Amount}</th>
                  */}

                  <th className="p-3 text-start">
                    <div className="flex flex-col items-start justify-center gap-1">

                      <div className="flex flex-col items-start justify-center gap-1">
                          <span className="text-xs uppercase tracking-wide text-neutral-300">
                            P2P 판매자 아이디
                          </span>
                          <span className="text-xs uppercase tracking-wide text-neutral-300">
                            USDT지갑
                          </span>
                      </div>

                      <div className="flex flex-row items-center justify-start gap-2 text-neutral-200">
                        <span className="text-xs uppercase tracking-wide">자동매칭</span>
                        <Image
                          src="/icon-matching.png"
                          alt="Auto Matching"
                          width={16}
                          height={16}
                          className={`
                            w-4 h-4
                            ${buyOrders.filter((item) => item.status === 'ordered').length > 0 ? 'animate-spin' : ''}
                          `}
                        />

                        {/* the count of status is ordered */}
                        <span className="text-xs font-semibold">
                          {
                            buyOrders.filter((item) => item.status === 'ordered').length
                          }
                        </span>

                        <span className="text-xs uppercase tracking-wide">
                          거래상태
                        </span>

                      </div>

                    </div>
                  </th>


                  <th className="p-2">
                    <div className="w-full flex flex-col items-start justify-center gap-2">

                      <div className="flex flex-row items-center justify-center gap-2">
                        <span>
                          자동입금확인
                        </span>
                        <Image
                          src="/icon-bank-auto.png"
                          alt="Bank Auto"
                          width={20}
                          height={20}

                          //className="w-5 h-5 animate-spin"
                          className={`
                            w-5 h-5
                            ${buyOrders.filter((item) => item.status === 'paymentRequested').length > 0 ? 'animate-spin' : ''}
                          `}
                        />
                        <span className="text-sm text-zinc-50 font-semibold">
                          {
                            buyOrders.filter((item) => item.status === 'paymentRequested').length
                          }
                        </span>

                      </div>
                      <div className="w-full flex flex-col items-start justify-center gap-2">
                        <span className="text-sm text-zinc-50 font-semibold">
                          입금통장
                        </span>
                      </div>
                      <div className="w-full flex flex-col items-end justify-center gap-2">
                        <span className="text-sm text-zinc-50 font-semibold">
                          입금액(원)
                        </span>
                      </div>

                    </div>
                  </th>


                  <th className="p-2">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <span>
                        P2P 거래취소
                      </span>
                      {
                      //isProcessingSendTransaction
                      isProcessingSendTransaction.current
                      ? (
                        <div className="flex flex-row items-center gap-2">
                          <Image
                            src="/icon-transfer.png"
                            alt="Transfer"
                            width={20}
                            height={20}
                            className="w-5 h-5 animate-spin"
                          />
                          <span className="text-sm">
                            USDT 전송중...
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm">
                          USDT 전송
                        </span>
                      )}
                    </div>
                  </th>

                  {/*
                  <th className="
                    p-2">
                    정산비율(%)
                  </th>
                  */}

                  <th className="
                    p-2">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="flex flex-row items-center justify-center gap-2">
                        <span>
                          가맹점 자동결제 및 정산(USDT)
                        </span>
                        <Image
                          src="/icon-settlement.png"
                          alt="Settlement"
                          width={20}
                          height={20}
                          ///className="w-5 h-5 animate-spin"
                          className={`
                            w-5 h-5
                            ${buyOrders.filter((item) =>
                              item.status === 'paymentConfirmed'
                              && item?.settlement?.status !== "paymentSettled"
                              && item?.storecode !== 'admin' // admin storecode is not included
                            ).length > 0
                            ? 'animate-spin' : ''}
                          `}
                        />

                        <span className="text-sm text-zinc-50 font-semibold">
                          {
                            buyOrders.filter((item) => item.status === 'paymentConfirmed'
                            && item?.settlement?.status !== "paymentSettled"
                            && item?.storecode !== 'admin' // admin storecode is not included
                          ).length
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

                  
                  <tr
                    key={item._id || index}
                    className={`
                      ${index % 2 === 0 ? 'bg-white' : 'bg-neutral-50'}
                      border-b border-neutral-200
                      transition-all duration-500 ease-out
                      ${recentlyAddedIds.has(item._id || '') ? 'scale-[1.01] shadow-md shadow-neutral-200/80 expand-row' : ''}
                      ${recentlyAddedDirection[item._id || ''] === 'top' ? 'slide-in-top' : ''}
                      ${recentlyAddedDirection[item._id || ''] === 'bottom' ? 'slide-in-bottom' : ''}
                      ${recentStatusChange[item._id || ''] ? statusPulseClass(recentStatusChange[item._id || '']) : ''}
                    `}
                  >
                  

                    <td className="
                      p-2
                    "
                    >

                      <div
                        className={`h-32 w-32 flex flex-col items-start justify-start gap-2 rounded-lg border
                        ${statusCardTone(item.status, item.settlement)}
                        cursor-pointer transition-all duration-200 ease-in-out
                        hover:scale-105 hover:shadow-lg hover:shadow-emerald-100/80 hover:cursor-pointer p-2`}
                        onClick={() => {
                          // copy traideId to clipboard
                          navigator.clipboard.writeText(item.tradeId);
                          toast.success("거래번호가 복사되었습니다.");
                        }}
                      
                      >

                        <div className="flex flex-row items-center justify-start gap-2">
                          <Image
                            src={item?.store?.storeLogo || "/icon-store.png"}
                            alt="Store Logo"
                            width={35}
                            height={35}
                            className="
                            rounded-lg
                            w-8 h-8 object-cover"
                          />
                          
                          <div className="flex flex-col items-start justify-start">
                            <RevealText value={item?.store?.storeName}>
                              <span className="text-sm text-zinc-500 font-bold">
                                {
                                  item?.store?.storeName?.length > 5 ?
                                  item?.store?.storeName?.substring(0, 5) + '...' :
                                  item?.store?.storeName
                                }
                              </span>
                            </RevealText>
                            <span className="text-sm text-zinc-500">
                              {
                                item?.agent.agentName?.length > 5 ?
                                item?.agent.agentName?.substring(0, 5) + '...' :
                                item?.agent.agentName
                              }
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-row items-start justify-start gap-1">
                          <Image
                            src="/icon-trade.png"
                            alt="Trade Icon"
                            width={20}
                            height={20}
                            //className="w-5 h-5"
                            className={`w-5 h-5
                              ${item?.status === 'cancelled' || (item?.status === 'paymentConfirmed' && item?.transactionHash !== '0x') ? '' : 'animate-spin'}`}
                          />
                          <span className="text-sm text-zinc-500 font-semibold">
                            <RevealText value={item.tradeId}>
                              {"#" + item.tradeId}
                            </RevealText>
                          </span>
                        </div>

                        <div className="w-full flex flex-row items-center justify-start gap-2">

                          <div className="w-full flex flex-col items-start justify-start">

                            <RevealText value={item.createdAt}>
                              <span className="text-sm text-zinc-800 font-semibold">
                                {new Date(item.createdAt).toLocaleTimeString('ko-KR', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  second: '2-digit',
                                })}
                              </span>
                            </RevealText>
                            {/*
                            <span className="text-sm text-zinc-500">
                              {new Date(item.createdAt).toLocaleDateString('ko-KR', {
                                year: 'numeric',
                                month: '2-digit',
                                day: '2-digit',
                              })}
                            </span>
                            */}

                            <div className="w-full flex flex-row items-center justify-between gap-1">
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
                              {/* audioOn */}
                              {item.status === 'ordered' || item.status === 'paymentRequested' && (
                                <div className="flex flex-row items-center justify-center gap-1">
                                  <span className="text-xl text-zinc-500 font-semibold">
                                    {item.audioOn ? (
                                      '🔊'
                                    ) : (
                                      '🔇'
                                    )}
                                  </span>
                                  {/* audioOn off button */}
                                  <button
                                    className="text-sm text-blue-600 font-semibold underline"
                                    onClick={() => handleAudioToggle(
                                      index,
                                      item._id
                                    )}
                                  >
                                    {item.audioOn ? '끄기' : '켜기'}
                                  </button>
                                </div>
                              )}
                            </div>

                          </div>
                          {/*
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
                          */}
                        </div>

                      </div>

                    </td>
                    
                    <td className="p-2">
                      <div className="
                        w-36  
                        flex flex-col items-start justify-start gap-2">
                        
                        <div className="w-full flex flex-col gap-2 items-center justify-start">

                          <div className="w-full flex flex-row items-center justify-start gap-1">
                            <Image
                              src={item?.buyer?.avatar || "/icon-user.png"}
                              alt="Avatar"
                              width={20}
                              height={20}
                              className="rounded-full w-5 h-5"
                              style={{
                                objectFit: 'cover',
                              }}
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
                                item?.nickname?.length > 6 ?
                                item?.nickname?.substring(0, 6) + '...' :
                                item?.nickname
                              }
                            </span>
                          </div>

                          {/* wallet address */}
                          <div className="w-full flex flex-row items-start justify-start gap-1">
                            <Image
                              src="/icon-shield.png"
                              alt="Wallet Address"
                              width={20}
                              height={20}
                              className="w-5 h-5"
                            />
                            <button
                              className="text-sm text-blue-600 font-semibold underline
                              "
                              onClick={() => {
                                navigator.clipboard.writeText(item.walletAddress);
                                toast.success(Copied_Wallet_Address);
                              }}
                            >
                              {item.walletAddress.substring(0, 6)}...{item.walletAddress.substring(item.walletAddress.length - 4)}
                            </button>
                          </div>


                          {
                          item?.paymentMethod === 'mkrw' ? (
                            <></>
                          ) : (
                            <div className="w-full flex flex-row items-center justify-start gap-1">
                              <Image
                                src="/icon-bank.png"
                                alt="Deposit Name"
                                width={20}
                                height={20}
                                className="w-5 h-5"
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
                                    item?.buyer?.depositBankName ? item?.buyer?.depositBankName : '은행명 없음'
                                  }
                                </span>
                                {/*
                                <span className="
                                  text-sm text-zinc-500">
                                  {
                                    item?.buyer?.depositBanktAccountNumber ?
                                    item?.buyer?.depositBanktAccountNumber.substring(0, 3) + '...'
                                    : '계좌번호 없음'
                                  }
                                </span>
                                */}
                              </div>
                            </div>
                          )}

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

                          <div className="flex flex-row items-center justify-center gap-2">
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
                        w-32
                        flex flex-col gap-1 items-end justify-start leading-tight">

                        <div className="flex flex-row items-center justify-end gap-1">
                          <Image
                            src="/icon-tether.png"
                            alt="Tether"
                            width={20}
                            height={20}
                            className="w-5 h-5"
                          />
                          <span className="text-xl text-[#409192] font-semibold"
                            style={{
                              fontFamily: 'monospace',
                            }}
                          >
                            {
                            Number(item.usdtAmount).toFixed(3).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                            }
                          </span>
                        </div>


                        <div className="flex flex-row items-center justify-end gap-1">
                          <span className="text-xl text-yellow-600 font-semibold"
                            style={{
                              fontFamily: 'monospace',
                            }}
                          >
                            {
                              item.krwAmount?.toLocaleString()
                            }
                          </span>
                        </div>

                        <span className="text-sm text-zinc-500"
                          style={{
                            fontFamily: 'monospace',
                          }}
                        >
                          {
                            Number(item.rate).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                            //Number(item.krwAmount / item.usdtAmount).toFixed(3)
                          }
                        </span>

                        {/* paymentMethod */}
                        <div className="flex flex-col items-end justify-end gap-1 leading-tight">
                          
                          <div className="flex flex-row items-center justify-center gap-1">
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
                            <div className="flex flex-col items-end justify-center gap-1">

                              <div className="flex flex-row items-center justify-center gap-2">
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

                            <div className="flex flex-row items-center justify-center gap-1"> 
                              <Image
                                src={item?.seller?.avatar || "/icon-seller.png"}
                                alt="Avatar"
                                width={20}
                                height={20}
                                className="rounded-full w-5 h-5"
                              />
                              <span className="text-lg font-semibold text-zinc-500">
                                {
                                  item.seller?.nickname &&
                                  item.seller.nickname.length > 8 ?
                                  item.seller.nickname.slice(0, 8) + '...' :
                                  item.seller?.nickname
                                }
                              </span>
                            </div>

                            {/* wallet address */}
                            <div className="flex flex-row items-center justify-center gap-1">
                              <Image
                                src="/icon-shield.png"
                                alt="Wallet Address"
                                width={20}
                                height={20}
                                className="w-5 h-5"
                              />
                              <button
                                className="text-sm text-blue-600 font-semibold underline
                                "
                                onClick={() => {
                                  navigator.clipboard.writeText(item.seller?.walletAddress);
                                  toast.success(Copied_Wallet_Address);
                                }}
                              >
                                {item.seller?.walletAddress && item.seller?.walletAddress.substring(0, 6) + '...' + item.seller?.walletAddress.substring(item.seller?.walletAddress.length - 4)}
                              </button>
                            </div>

                            {/*
                            <span className="text-sm text-zinc-500">
                              {
                                item.seller?.walletAddress &&
                                item.seller?.walletAddress.slice(0, 5) + '...' + item.seller?.walletAddress.slice(-5)
                              }
                            </span>
                            */}

                            <div className="flex flex-row items-center justify-center gap-1">
                              <Image
                                src="/icon-matching-completed.png"
                                alt="Matching Completed"
                                width={20}
                                height={20}
                                className="w-5 h-5 rounded-full"
                              />
                              <span className="text-sm text-zinc-500 font-semibold">
                                자동매칭
                              </span>
                            </div>

                            {/*
                            <span className="text-sm text-zinc-500">
                              {item?.seller?.userStats?.totalPaymentConfirmedCount
                                ? item?.seller?.userStats?.totalPaymentConfirmedCount.toLocaleString() + ' 건' :
                                0 + ' 건'
                              }
                            </span>
                            */}


                          </div>
                        )}


                        {item.status === 'accepted' && (

                          <div className="w-full flex flex-row gap-2 items-center justify-start">
                            <button
                              className="text-sm text-blue-600 font-semibold
                                border border-blue-600 rounded-lg p-2
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


                            {/*
                            <div className="text-sm text-white">
                              {item.seller?.nickname}
                            </div>
                            */}
                            
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
                              className="text-xs leading-tight text-yellow-600 font-semibold
                                border border-yellow-600 rounded-lg px-2.5 py-1.5
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



                              {/*
                              <span className="text-sm text-white">
                                {item.seller?.nickname}
                              </span>
                              */}

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
                              className="
                                text-xs leading-tight text-[#409192] font-semibold
                                border border-green-600 rounded-lg p-2
                                text-center whitespace-nowrap
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
                              거래완료
                            </button>
                            <a
                              href={`${paymentUrl}/${params.lang}/${clientId}/${item?.storecode}/pay-usdt-reverse/${item?._id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-blue-600 font-semibold underline"
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

                      {
                      //!item?.escrowTransactionHash &&
                      item?.status === 'paymentConfirmed' && (
                        <div className="
                          w-32
                          flex flex-col gap-1.5 items-end justify-start leading-tight text-[13px]">
                          
                          {item?.autoConfirmPayment === true ? (
                          
                            <div className="w-full flex flex-row gap-1 items-center justify-start">
                              <Image
                                src="/icon-payaction.png"
                                alt="Bank Check"
                                width={16}
                                height={16}
                                className="w-4 h-4 rounded-full"
                              />
                              <span className="text-sm font-semibold text-zinc-500">
                                자동입금확인
                              </span>
                            </div>

                          ) : (

                            <div className="w-full flex flex-row gap-1 items-center justify-start">
                              <Image
                                src="/icon-bank-check.png"
                                alt="Bank Check"
                                width={16}
                                height={16}
                                className="w-4 h-4 rounded-full"
                              />
                              <span className="text-sm font-semibold text-zinc-500">
                                수동입금확인
                              </span>
                            </div>

                          )}

                          {/* seller bank info */}
                          {item?.userType === '' ? (
                            <div className="w-full flex flex-row gap-1 items-center justify-start">
                              <Image
                                src="/icon-bank.png"
                                alt="Bank"
                                width={20}
                                height={20}
                                className="w-5 h-5 rounded-full"
                              />
                              <span className="text-lg text-gray-800 font-bold">
                                {item.store?.bankInfo?.accountHolder}
                              </span>
                              <span className="text-sm text-zinc-500">
                                {item.store?.bankInfo?.bankName}
                              </span>
                            </div>
                          ) : (item?.userType === 'AAA' ? (
                            <div className="w-full flex flex-row gap-1 items-center justify-start">
                              <Image
                                src="/icon-bank.png"
                                alt="Bank"
                                width={20}
                                height={20}
                                className="w-5 h-5 rounded-full"
                              />
                              <span className="text-lg text-gray-800 font-bold">
                                {item.store?.bankInfoAAA?.accountHolder}
                              </span>
                              <span className="text-sm text-zinc-500">
                                {item.store?.bankInfoAAA?.bankName}
                              </span>
                            </div>
                          ) : (item?.userType === 'BBB' ? (
                            <div className="w-full flex flex-row gap-1 items-center justify-start">
                              <Image
                                src="/icon-bank.png"
                                alt="Bank"
                                width={20}
                                height={20}
                                className="w-5 h-5 rounded-full"
                              />
                              <span className="text-lg text-gray-800 font-bold">
                                {item.store?.bankInfoBBB?.accountHolder}
                              </span>
                              <span className="text-sm text-zinc-500">
                                {item.store?.bankInfoBBB?.bankName}
                              </span>
                            </div>
                          ) : (item?.userType === 'CCC' ? (
                            <div className="w-full flex flex-row gap-1 items-center justify-start">
                              <Image
                                src="/icon-bank.png"
                                alt="Bank"
                                width={20}
                                height={20}
                                className="w-5 h-5 rounded-full"
                              />
                              <span className="text-lg text-gray-800 font-bold">
                                {item.store?.bankInfoCCC?.accountHolder}
                              </span>
                              <span className="text-sm text-zinc-500">
                                {item.store?.bankInfoCCC?.bankName}
                              </span>
                            </div>
                          ) : (item?.userType === 'DDD' ? (
                            <div className="w-full flex flex-row gap-1 items-center justify-start">
                              <Image
                                src="/icon-bank.png"
                                alt="Bank"
                                width={20}
                                height={20}
                                className="w-5 h-5 rounded-full"
                              />
                              <span className="text-lg text-gray-800 font-bold">
                                {item.store?.bankInfoDDD?.accountHolder}
                              </span>
                              <span className="text-sm text-zinc-500">
                                {item.store?.bankInfoDDD?.bankName}
                              </span>
                            </div>
                          ) : (
                            <div className="w-full flex flex-row gap-1 items-center justify-start">
                              <Image
                                src="/icon-bank.png"
                                alt="Bank"
                                width={20}
                                height={20}
                                className="w-5 h-5 rounded-full"
                              />
                              <span className="text-lg text-gray-800 font-bold">
                                {item.store?.bankInfo?.accountHolder}
                              </span>
                              <span className="text-sm text-zinc-500">
                                {item.store?.bankInfo?.bankName}
                              </span>
                            </div>
                          )))))}


                          {/* paymentAmount */}
                          <div className="flex flex-row gap-1 items-center justify-end">
                            <span className="text-xl text-yellow-600 font-semibold"
                              style={{ fontFamily: 'monospace' }}>
                              {
                                item.paymentAmount?.toLocaleString()
                              }
                            </span>
                          </div>

                          <span className="text-sm text-zinc-500">
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
                          w-36
                          flex flex-col gap-2 items-end justify-start">

                          {item?.paymentMethod === 'mkrw' ? (
                            <div className="flex flex-row gap-2 items-center justify-end">
                              <Image
                                src="/token-mkrw-icon.png"
                                alt="MKRW"
                                width={20}
                                height={20}
                                className="w-5 h-5 rounded-full"
                              />
                              <span className="text-sm font-semibold text-zinc-500">
                                MKRW
                              </span>
                            </div>
                          ) : (

                            <div className="w-full flex flex-col gap-1.5 items-start justify-center leading-tight">

                              <div className="flex flex-row gap-1 items-center justify-end animate-fade-slide leading-tight">
                                <Image
                                  src="/icon-search-bank.gif"
                                  alt="Bank Auto"
                                  width={30}
                                  height={30}
                                  className="rounded-full"
                                />
                                {item?.autoConfirmPayment === true ? (
                                  <span className="text-[13px] font-semibold text-zinc-500 drop-shadow-sm leading-tight">
                                    입금 확인중입니다.
                                  </span>
                                ) : (
                                  <span className="text-[13px] font-semibold text-zinc-500 drop-shadow-sm leading-tight">
                                    입금 확인중입니다.
                                  </span>
                                )}

                              </div>

                              {item?.userType === '' ? (
                                <div className="flex flex-row gap-1 items-center justify-end leading-tight">
                                  <Image
                                    src="/icon-bank.png"
                                    alt="Bank"
                                    width={20}
                                    height={20}
                                    className="w-5 h-5 rounded-full"
                                  />
                                  <span className="text-lg text-gray-800 font-bold">
                                    {
                                      item.store?.bankInfo?.accountHolder
                                    }
                                  </span>
                                  <span className="text-sm text-zinc-500">
                                    {
                                      item.store?.bankInfo?.bankName
                                    }
                                  </span>
                                </div>
                              ) : (item?.userType === 'AAA' ? (
                                <div className="flex flex-row gap-1 items-center justify-end">
                                  <Image
                                    src="/icon-bank.png"
                                    alt="Bank"
                                    width={20}
                                    height={20}
                                    className="w-5 h-5 rounded-full"
                                  />
                                  <span className="text-lg text-gray-800 font-bold">
                                    {
                                      item.store?.bankInfoAAA?.accountHolder
                                    }
                                  </span>
                                  <span className="text-sm text-zinc-500">
                                    {
                                      item.store?.bankInfoAAA?.bankName
                                    }
                                  </span>
                                </div>
                              ) : (item?.userType === 'BBB' ? (
                                <div className="flex flex-row gap-1 items-center justify-end">
                                  <Image
                                    src="/icon-bank.png"
                                    alt="Bank"
                                    width={20}
                                    height={20}
                                    className="w-5 h-5 rounded-full"
                                  />
                                  <span className="text-lg text-gray-800 font-bold">
                                    {
                                      item.store?.bankInfoBBB?.accountHolder
                                    }
                                  </span>
                                  <span className="text-sm text-zinc-500">
                                    {
                                      item.store?.bankInfoBBB?.bankName
                                    }
                                  </span>
                                </div>
                              ) : (item?.userType === 'CCC' ? (
                                <div className="flex flex-row gap-1 items-center justify-end">
                                  <Image
                                    src="/icon-bank.png"
                                    alt="Bank"
                                    width={20}
                                    height={20}
                                    className="w-5 h-5 rounded-full"
                                  />
                                  <span className="text-lg text-gray-800 font-bold">
                                    {
                                      item.store?.bankInfoCCC?.accountHolder
                                    }
                                  </span>
                                  <span className="text-sm text-zinc-500">
                                    {
                                      item.store?.bankInfoCCC?.bankName
                                    }
                                  </span>
                                </div>
                              ) : (item?.userType === 'DDD' ? (
                                <div className="flex flex-row gap-1 items-center justify-end">
                                  <Image
                                    src="/icon-bank.png"
                                    alt="Bank"
                                    width={20}
                                    height={20}
                                    className="w-5 h-5 rounded-full"
                                  />
                                  <span className="text-lg text-gray-800 font-bold">
                                    {
                                      item.store?.bankInfoDDD?.accountHolder
                                    }
                                  </span>
                                  <span className="text-sm text-zinc-500">
                                    {
                                      item.store?.bankInfoDDD?.bankName
                                    }
                                  </span>
                                </div>
                              ) : (
                                <div className="flex flex-row gap-1 items-center justify-end">
                                  <Image
                                    src="/icon-bank.png"
                                    alt="Bank"
                                    width={20}
                                    height={20}
                                    className="w-5 h-5 rounded-full"
                                  />
                                  <span className="text-lg text-gray-800 font-bold">
                                    {
                                      item.store?.bankInfo?.accountHolder
                                    }
                                  </span>
                                  <span className="text-sm text-zinc-500">
                                    {
                                      item.store?.bankInfo?.bankName
                                    }
                                  </span>
                                </div>
                              )))))}







                              {/*
                              <div className="flex flex-row items-end justify-start text-sm text-zinc-500">
                                {item.store?.bankInfo?.accountNumber}
                              </div>
                              */}
                              
                              {/* paymentAmount */}
                              <div className="w-full flex flex-row gap-1 items-center justify-end">
                                <span className="text-lg text-yellow-600 font-semibold"
                                  style={{ fontFamily: 'monospace' }}>
                                  {
                                    item.krwAmount?.toLocaleString()
                                  }
                                </span>
                              </div>




                              <div className="w-full flex flex-row items-center justify-between gap-2">

                                <span className="text-xs text-zinc-500">
                                  {params.lang === 'ko' ? (
                                    <p>{
                                      new Date().getTime() - new Date(item.paymentRequestedAt).getTime() < 1000 * 60 ? (
                                        ' ' + Math.floor((new Date().getTime() - new Date(item.paymentRequestedAt).getTime()) / 1000) + ' ' + '초'
                                      ) :
                                      new Date().getTime() - new Date(item.paymentRequestedAt).getTime() < 1000 * 60 * 60 ? (
                                      ' ' + Math.floor((new Date().getTime() - new Date(item.paymentRequestedAt).getTime()) / 1000 / 60) + ' ' + '분'
                                      ) : (
                                        ' ' + Math.floor((new Date().getTime() - new Date(item.paymentRequestedAt).getTime()) / 1000 / 60 / 60) + ' ' + '시간'
                                      )
                                    }</p>
                                  ) : (
                                    <p>{
                                      new Date().getTime() - new Date(item.paymentRequestedAt).getTime() < 1000 * 60 ? (
                                        ' ' + Math.floor((new Date().getTime() - new Date(item.paymentRequestedAt).getTime()) / 1000) + ' ' + '초'
                                      ) :
                                      new Date().getTime() - new Date(item.paymentRequestedAt).getTime() < 1000 * 60 * 60 ? (
                                      ' ' + Math.floor((new Date().getTime() - new Date(item.paymentRequestedAt).getTime()) / 1000 / 60) + ' ' + '분'
                                      ) : (
                                        ' ' + Math.floor((new Date().getTime() - new Date(item.paymentRequestedAt).getTime()) / 1000 / 60 / 60) + ' ' + '시간'
                                      )
                                    }</p>
                                  )}
                                </span>

                                {
                                
                                (item.seller.walletAddress === address || isAdmin)

                                && item.status === 'paymentRequested'
                                
                                ///////////////&& item?.autoConfirmPayment

                                && (

                                  <div className="flex flex-col gap-2 items-center justify-center">

                                      <button

                                      disabled={confirmingPayment[index]}
                                      
                                      className={`
                                        w-28 text-center px-3 py-2 rounded-xl font-semibold text-white
                                        transition-all duration-200
                                        ${
                                          confirmingPayment[index]
                                            ? 'bg-gradient-to-r from-zinc-300 to-zinc-400 border border-zinc-400 cursor-not-allowed shadow-none'
                                            : 'bg-gradient-to-r from-emerald-500 to-teal-600 border border-emerald-600 shadow-[0_10px_20px_rgba(16,185,129,0.35)] hover:shadow-[0_14px_26px_rgba(16,185,129,0.45)] hover:-translate-y-0.5 active:translate-y-0'
                                        }
                                      `}

                                      /*
                                      onClick={() => {
                                        confirm("정말 입금확인 하시겠습니까?") &&
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
                                      */
                                      onClick={() => {
                                        openDepositModalForOrder(index, item);
                                      }}


                                    >
                                      <div className="w-full flex flex-row gap-1 items-center justify-center">
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
                                          {confirmingPayment[index] ? '완료중...' : '완료하기'}
                                        </span>
                                      </div>

                                    </button>



                                  </div>


                                )}


                              </div>

                            </div>
                            
                          )}

                        </div>

                      )}
                    </td>



                    <td className="p-2">
                      <div className="
                        w-52   
                        flex flex-col gap-2 items-center justify-center">

                        {
                          user?.seller &&
                          item.status === 'ordered'  && (


                          <div className="bg-gray-500/10
                            rounded-md
                            p-2
                            w-full flex flex-col sm:flex-row gap-2 items-start justify-start">
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
                                    acceptBuyOrder(index, item._id, smsReceiverMobileNumber, item.tradeId, item.walletAddress)
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

                              <div className="flex flex-row gap-1 items-center justify-center">
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



                        {item?.seller?.walletAddress === address && (

                          <div className="
                            w-full flex flex-col gap-2 items-center justify-center">



                            {/* 상태가 cancelled 이고, escrowTransactionHash가 없을 경우 */}
                            {/* 에스크로 돌아주기 버튼 */}
                            { item.status === 'cancelled'
                            && item?.escrowWallet?.transactionHash
                            && item?.escrowWallet?.transactionHash !== '0x'
                            && (!item?.escrowTransactionHash || item?.escrowTransactionHash === '0x')
                            && (
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
                                  // TODO: implement return to escrow logic
                                }}
                              >
                                <div className="flex flex-row gap-1 items-center justify-start ml-2">
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
                                    {item?.escrowWallet?.balance?.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')} MKRW 회수하기
                                  </span>
                                </div>
                              </button>
                            )}

                          </div>

                        )}   

                        {/*
                        <div className="w-full flex flex-col gap-2 items-center justify-center">
                        */}

                        {item.status === 'paymentConfirmed' &&
                        !item?.settlement &&
                        (!item?.transactionHash || item?.transactionHash === '0x') && (
                          <div
                            key={`${item._id}-${item.status}-${item.transactionHash || 'pending'}`}
                            className="w-full flex flex-row gap-2 items-center justify-center fade-status"
                          >
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

                        {/*
                        </div>   
                        */}                 

                        {/*
                        <div className={`
                          rounded-md
                          p-2 
                          w-full flex flex-col gap-2 items-start justify-start
                          `}>
                        */}
                          

                        {
                        (item.status === 'accepted' || item.status === 'paymentRequested')
                        //&& item.seller && item.seller.walletAddress === address
                        && isAdmin
                        && (

                          <div className="w-full flex flex-col items-center gap-2">

                            <input
                              type="text"
                              value={cancelTradeReason[index]}
                              onChange={(e) => {
                                setCancelTradeReason(
                                  cancelTradeReason.map((item, idx) => idx === index ? e.target.value : item)
                                );
                              }}
                              placeholder="거래취소 사유"
                              className="w-full h-8
                              text-center rounded-md text-sm text-zinc-500 font-semibold bg-zinc-100 border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />

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

                                className="
                                  w-full flex flex-row gap-1
                                  text-sm font-semibold text-white
                                  rounded-xl p-2
                                  bg-gradient-to-r from-rose-500 to-red-600
                                  border border-red-500
                                  text-center
                                  cursor-pointer
                                  transition-all duration-200 ease-in-out
                                  shadow-[0_10px_20px_rgba(248,113,113,0.35)]
                                  hover:shadow-[0_14px_26px_rgba(248,113,113,0.45)]
                                  hover:-translate-y-0.5 active:translate-y-0
                                  disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none
                                "  
                                onClick={() => {
                                  cancelTrade(item._id, index);
                                }}
                              >
                                <div className="w-full flex flex-row gap-2 items-center justify-center">
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


                            {/* warning message */}
                            {/* 취소사유가 없을 경우 판매자 평가에 영향을 미칠 수 있습니다. */}
                            <div className="w-full flex flex-row items-center justify-center gap-1">
                              <Image
                                src="/icon-warning.png"
                                alt="Warning"
                                width={20}
                                height={20}
                                className="w-5 h-5 rounded-full"
                              />
                              <span className="text-xs text-red-500">
                                취소사유가 없을 경우 판매자 평가에 영향을 미칠 수 있습니다.
                              </span>
                            </div>



                          </div>

                        )}
                          
                          {/*
                          <div className="
                            w-full
                            flex flex-col gap-2 items-start justify-start">
                          */}

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


                            {item.seller && item.seller.walletAddress === address &&
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
                                  <div className="flex flex-row gap-1 items-center justify-center">
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
    
                                    <span className="text-sm text-zinc-500">
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

                                )}
        
                              </div>
                            )}


                            {/*}
                            {item.seller
                            && item.seller.walletAddress === address
                            && item.status === 'paymentRequested'
                            
                            ///////////////&& item?.autoConfirmPayment

                            && (

                              <div className="
                                w-full
                                flex flex-col gap-2 items-center justify-center">
                                
                                <div className="flex flex-row gap-2">

                                  <button
                                    disabled={confirmingPayment[index]}
                                    
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
                                        [],
                                        0,
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
                                        수동입금확인
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

                            */}



                            {/* paymentConfirmed */}
                            {/* paymentAmount */}
                            {item.status === 'paymentConfirmed'
                            && item.seller && item.seller.walletAddress === address && (

                              <div className="
                                w-56
                                flex flex-col gap-2 items-center justify-center">

                                {/* 자동입금처리일경우 */}
                                {/* 수동으로 결제완료처리 버튼 */}
                              
                                { !item?.settlement &&

                                ///item?.autoConfirmPayment &&

                                (item?.transactionHash === '0x' || item?.transactionHash === undefined) &&
                                
                                (


                                  <div className="w-full flex flex-col items-start justify-center gap-2">

                                    {/*
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
                                    */}

                                    <button
                                      //disabled={confirmingPayment[index] || !confirmPaymentCheck[index]}
                                      //disabled={confirmingPayment[index]}
                                      disabled={
                                        
                                        //isProcessingSendTransaction
                                        isProcessingSendTransaction.current

                                        || sendingTransaction[index]
                                      }

                                      /*
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
                                      */

                                      className={`
                                        w-full  
                                        flex flex-row gap-1 text-sm text-white px-2 py-1 rounded-md
                                        border border-green-600
                                        hover:border-green-700
                                        hover:shadow-lg
                                        hover:shadow-green-500/50
                                        transition-all duration-200 ease-in-out

                                        ${sendingTransaction[index] ? 'bg-red-500' : 'bg-green-500'}
                                      `}

                                      // onclick avoid avoid repeated execution of onclick event
                                      // use a ref to track if the event is already in progress
                                      
                                      onClick={() => {
                                        openDepositModalForOrder(index, item);
                                      }}
                                    >

                                      <div className="flex flex-row gap-2 items-center justify-center">
                                        <Image
                                          src="/icon-transfer.png"
                                          alt="Transfer"
                                          width={20}
                                          height={20}
                                          className={`
                                          ${sendingTransaction[index] ? 'animate-spin' : 'animate-pulse'}
                                            w-5 h-5
                                          `}
                                        />
                                        <span className="text-sm text-white">
                                          구매자에게 {item.usdtAmount.toFixed(3)} USDT<br />{sendingTransaction[index] ? '전송중...' : '전송하기'}
                                        </span>
                                      </div>

                                    </button>

                                    {/* warning message */}
                                    {sendingTransaction[index] && (
                                      <div className="flex flex-row gap-1 items-center justify-center">
                                        <Image
                                          src="/icon-warning.png"
                                          alt="Warning"
                                          width={20}
                                          height={20}
                                          className="w-5 h-5"
                                        />
                                        <div className="text-sm text-red-500">
                                          전송중에 절대 새로고침하거나 뒤로가기를 하지 마세요.
                                        </div>
                                      </div>
                                    )}

                                  </div>




                                )}

                              </div>
                            )}

                          {/*
                          </div>
                          */}

                        {/*
                        </div>
                        */}

                        {item.status === 'cancelled' && (

                          <div className="w-full flex flex-col gap-2 items-center justify-center">
                            <span className="text-sm text-gray-500">
                              거래취소 사유
                            </span>
                            <span className="text-sm text-red-600">
                              {item.cancelTradeReason ? item.cancelTradeReason :
                                "없음"
                              }
                            </span>
                          </div>

                        )}



                        {item?.transactionHash
                        && item?.transactionHash !== '0x'
                        && (
                          <button
                            className="
                              h-32
                              w-full
                              flex flex-row gap-2 items-center justify-between
                              text-sm text-[#409192] font-semibold
                              border border-[#409192] rounded-lg p-2
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
                              <div className="w-full flex flex-col gap-2 items-start justify-start ml-2">
                                
                                <div className="w-full flex flex-col gap-1 items-start justify-start
                                  border-b border-dashed border-zinc-300 pb-1">
                                  <div className="flex flex-row gap-1 items-center justify-start">
                                    <div className="w-2 h-2 rounded-full bg-[#409192]" />
                                    <span className="text-sm text-zinc-500 font-normal">
                                      회원지갑으로 전송한 테더
                                    </span>
                                  </div>
                                  <div className="w-full flex flex-row gap-1 items-center justify-end">
                                    <Image
                                      src={`/icon-tether.png`}
                                      alt="USDT Logo"
                                      width={20}
                                      height={20}
                                      className="w-5 h-5"
                                    />
                                    <span className="text-lg text-[#409192] font-semibold"
                                      style={{
                                        fontFamily: 'monospace',
                                      }}>
                                      {item?.usdtAmount.toFixed(3).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                    </span>
                                  </div>
                                </div>

                                {/* TXID: item.transactionHash */}
                                <div className="w-full flex flex-col gap-1 items-start justify-start mt-2">
                                  <div className="flex flex-row gap-1 items-center justify-start">
                                    <div className="w-2 h-2 rounded-full bg-[#409192]" />
                                    <span className="text-sm text-zinc-500 font-normal">
                                      거래내역 TXID
                                    </span>
                                  </div>
                                  <div className="w-full flex flex-row gap-1 items-center justify-end">
                                    <span className="text-sm text-[#409192] font-semibold"
                                      style={{
                                        fontFamily: 'monospace',
                                      }}>
                                      {item?.transactionHash && item?.transactionHash.substring(0, 6) + '...' + item?.transactionHash.substring(item?.transactionHash.length - 4)}
                                    </span>
                                  </div>
                                </div>


                                {/*
                                <div className="w-full flex flex-col gap-1 items-start justify-start">
                                  <div className="flex flex-row gap-1 items-center justify-start">
                                    <div className="w-2 h-2 rounded-full bg-[#409192]" />
                                    <span className="text-sm text-zinc-500 font-normal">
                                      판매자 지갑 잔액
                                    </span>
                                  </div>
                                  <div className="w-full flex flex-row gap-1 items-center justify-end">
                                    <Image
                                      src={`/icon-tether.png`}
                                      alt="USDT Logo"
                                      width={20}
                                      height={20}
                                      className="w-5 h-5"
                                    />
                                    <span className="text-lg text-[#409192] font-semibold"
                                      style={{
                                        fontFamily: 'monospace',
                                      }}>
                                      {item?.sellerWalletAddressBalance ? item?.sellerWalletAddressBalance.toFixed(3).replace(/\B(?=(\d{3})+(?!\d))/g, ',') : '0.000'}
                                    </span>
                                  </div>
                                </div>
                                */}

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
                          <div
                            className="
                              w-full
                              flex flex-row gap-2 items-center justify-between
                              text-sm text-[#409192] font-semibold
                              border border-[#409192] rounded-lg p-2
                              bg-blue-100
                              text-center
                              hover:bg-blue-200
                              cursor-pointer
                              transition-all duration-200 ease-in-out
                              hover:scale-105
                              hover:shadow-lg
                              hover:shadow-blue-500/50
                            "
                          >
                              <div className="flex flex-col gap-2 items-start justify-start ml-2">
                                <div className="flex flex-col gap-1 items-start justify-start">
                                  <span className="text-sm">
                                    회원지갑으로 전송한 테더
                                  </span>
                                  <div className="flex flex-row gap-1 items-center justify-start">
                                    <Image
                                      src={`/icon-tether.png`}
                                      alt="USDT Logo"
                                      width={20}
                                      height={20}
                                      className="w-5 h-5"
                                    />
                                    <span className="text-lg text-[#409192] font-semibold"
                                      style={{
                                        fontFamily: 'monospace',
                                      }}>
                                      {item?.usdtAmount.toFixed(3).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                    </span>
                                  </div>
                                  <span className="text-sm text-zinc-500">
                                    TXID 확인중...
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
                          </div>
                        )}



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
                            <div className="flex flex-row gap-1 items-center justify-start ml-2">
                              <Image
                                src={`/token-mkrw-icon.png`}
                                alt="MKRW Logo"
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
                  


                    {/*
                    <td className="
                      p-2">
                      <div className="flex flex-col gap-2 items-end justify-center">

                        <div className="w-full flex flex-row gap-2 items-center justify-center">
                          <span className="
                          w-16
                          text-sm text-zinc-500">
                            가맹점
                          </span>
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
                            {Number(item.store?.agentFeePercent ? item.store?.agentFeePercent : 0.0).toFixed(2)}%
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
                            {Number(item.store.settlementFeePercent ? item.store.settlementFeePercent : 0.0).toFixed(2)}%
                          </span>
                        </div>

                      </div>
                    </td>
                    */}


                    <td className="p-2">
                      <div className="
                        h-32
                        w-full
                        flex flex-col gap-2 items-start justify-center
                        border border-dashed border-zinc-600
                        rounded-lg p-2">

                        {item.status === "paymentConfirmed" &&
                          (!item?.transactionHash || item?.transactionHash === '0x') &&
                          !item?.settlement && (
                          
                          <div className="flex flex-col gap-2">
                            {/* 자동결제 지갑주소 */}

                            <div className="w-full flex flex-row gap-2 items-center justify-start">
                              <Image
                                src={item?.store?.storeLogo || '/icon-store.png'}
                                alt="Store Logo"
                                width={30}
                                height={30}
                                className="w-6 h-6 rounded-lg object-cover"
                              />
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
                                className="w-6 h-6 rounded-lg object-cover"
                              />
                              <Image
                                src={item?.store?.storeLogo || '/icon-store.png'}
                                alt="Store Logo"
                                width={30}
                                height={30}
                                className="w-6 h-6 rounded-lg object-cover"
                              />
                              <span className="text-sm font-semibold text-zinc-500">
                                {item?.store?.storeName}{' '}결제완료
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

                            <div className="flex flex-row gap-1 items-center">
                              <span className="text-sm font-semibold text-zinc-500">
                                지갑잔액:
                              </span>
                              <span className="text-sm font-semibold text-green-600"
                                style={{
                                  fontFamily: 'monospace',
                                }}>
                                {item?.settlement?.settlementWalletBalance &&
                                  `${Number(item?.settlement?.settlementWalletBalance).toFixed(3).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`
                                }
                              </span>
                            </div>

                          </div>

                        )}


                        <div className="flex flex-row gap-2 items-between justify-center">

                          {item?.settlement && (
                            <div className="flex flex-col gap-1 items-end justify-center">

                              <div className="w-full flex flex-row gap-2 items-center justify-center">
                                <span className="
                                w-14 
                                text-xs text-zinc-500">
                                  가맹점 결제
                                </span>
                                <span className="
                                w-12 text-end
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

                              <div className="w-full flex flex-row gap-2 items-center justify-center">
                                <span className="
                                w-14
                                text-xs text-zinc-500">
                                  AG 수수료
                                </span>
                                <span className="
                                w-12 text-end
                                text-sm text-zinc-500"
                                  style={{
                                    fontFamily: 'monospace',
                                  }}>
                                  {Number(item.store?.agentFeePercent ? item.store?.agentFeePercent : 0.0).toFixed(2)}%
                                </span>
                              </div>

                              <div className="w-full flex flex-row gap-2 items-center justify-center">
                                <span className="
                                w-14
                                text-xs text-zinc-500">
                                  PG 수수료
                                </span>
                                <span className="
                                w-12  text-end
                                text-sm text-zinc-500"
                                  style={{
                                    fontFamily: 'monospace',
                                  }}>
                                  {Number(item.store.settlementFeePercent ? item.store.settlementFeePercent : 0.0).toFixed(2)}%
                                </span>
                              </div>

                            </div>
                          )}


                          {/*
                          {item?.settlement ? (


                            <button
                              className="
                              w-48
                              flex flex-col gap-2 items-center justify-center
                              bg-purple-500 text-white px-2 py-1 rounded-md hover:bg-purple-600
                              text-sm
                              transition duration-300 ease-in-out
                              transform hover:scale-105
                              hover:shadow-lg
                              hover:shadow-purple-500/50
                              hover:cursor-pointer
                              hover:transition-transform
                              hover:duration-300
                              hover:ease-in-out

                              "

                              onClick={() => {
                                let url = '';
                                if (chain === "ethereum") {
                                  url = `https://etherscan.io/tx/${item.settlement.txid}`;
                                } else if (chain === "polygon") {
                                  url = `https://polygonscan.com/tx/${item.settlement.txid}`;
                                } else if (chain === "arbitrum") {
                                  url = `https://arbiscan.io/tx/${item.settlement.txid}`;
                                } else if (chain === "bsc") {
                                  url = `https://bscscan.com/tx/${item.settlement.txid}`;
                                } else {
                                  url = `https://arbiscan.io/tx/${item.settlement.txid}`;
                                }
                                window.open(url, '_blank');
                              }}
                            >


                              <div className="flex flex-col gap-2 items-end justify-center"
                                style={{
                                  fontFamily: 'monospace',
                                }}
                              >
          
                                <span>
                                  {item?.settlement?.settlementAmount?.toLocaleString()}
                                  {' '}
                                  {
                                    item?.settlement?.settlementWalletAddress &&
                                  item?.settlement?.settlementWalletAddress?.slice(0, 5) + '...'}
                                </span>
                                <span>
                                  {
                                    item?.settlement?.agentFeeAmount ?
                                    item?.settlement?.agentFeeAmount?.toLocaleString()
                                    : '0'
                                  }
                                  {' '}
                                  {
                                    item?.settlement?.agentFeeWalletAddress &&
                                  item?.settlement?.agentFeeWalletAddress?.slice(0, 5) + '...'}
                                </span>
                                <span>
                                  {item?.settlement?.feeAmount?.toLocaleString()}
                                  {' '}
                                  {
                                    item?.settlement?.feeWalletAddress &&
                                  item?.settlement?.feeWalletAddress?.slice(0, 5) + '...'}
                                </span>

                              </div>

                            </button>

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
                                          src="/icon-settlement.png"
                                          alt="Settlement"
                                          width={20}
                                          height={20}
                                          className="animate-spin"
                                        />
                                        <span className="text-sm font-semibold text-zinc-500">
                                          가맹점 결제 및 정산중
                                        </span>
                                      </div>

                                      <div className="flex flex-row gap-2 items-center justify-center">
                                        <Image
                                          src={item.store?.storeLogo || '/icon-store.png'}
                                          alt="Store Logo"
                                          width={20}
                                          height={20}
                                          className="rounded-lg w-6 h-6"
                                        />
                                        <span className="text-sm font-semibold text-zinc-500">
                                          {item.store?.storeName}
                                        </span>
                                      </div>

                                      <div className="flex flex-row gap-1 items-center justify-center">
                                        <Image
                                          src="/icon-tether.png"
                                          alt="USDT"
                                          width={20}
                                          height={20}
                                          className="rounded-lg w-6 h-6"
                                        />
                                        <span className="text-lg font-semibold text-[#409192]"
                                          style={{
                                            fontFamily: 'monospace',
                                          }}
                                        >
                                          {
                                          Number(item.usdtAmount).toFixed(3).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                                          }
                                        </span>
                                      </div>

                                      {item.transactionHash &&
                                        new Date().getTime() - new Date(item.paymentConfirmedAt).getTime() > 1000 * 5 * 60 && (

                                        <div className="flex flex-row gap-2 items-center justify-center">
                                          <input
                                            disabled={loadingSettlement[index]}
                                            type="checkbox"
                                            checked={settlementCheck[index]}
                                            onChange={(e) => {
                                              setSettlementCheck(
                                                settlementCheck.map((item, idx) => {
                                                  if (idx === index) {
                                                    return e.target.checked;
                                                  }
                                                  return item;
                                                })
                                              );
                                            }}
                                            className="w-5 h-5
                                            rounded-md"

                                          />

                                          <button
                                            disabled={
                                              !settlementCheck[index]
                                              || loadingSettlement[index]
                                            }
                                            className={`
                                              ${settlementCheck[index] ? 'bg-blue-500' : 'bg-gray-500'}
                                              w-full
                                              flex flex-row gap-1 text-sm text-white px-2 py-1 rounded-md
                                              hover:bg-blue-600
                                              hover:shadow-lg
                                              hover:shadow-blue-500/50
                                              transition-all duration-200 ease-in-out
                                              ${!settlementCheck[index] || loadingSettlement[index]
                                              ? 'cursor-not-allowed' : 'cursor-pointer'}
                                            `}

                                            onClick={() => {
                                            
                                              settlementRequest(
                                                index,
                                                item._id,
                                              );
                                              

                                            }}
                                          >
                                            <div className="flex flex-row gap-2 items-center justify-center">
                                              {loadingSettlement[index] ? (
                                                <span className="text-sm">
                                                  정산중...
                                                </span>
                                              ) : (
                                                <span className="text-sm">
                                                  수동으로 정산하기
                                                </span>
                                              )}
                                            </div>

                                          </button>
                                        </div>
                                      )}



                                    </div>

                                  )}


                                </div>
                              )}
                            </>
                          )}
                          */}


                          {item?.settlement && item?.settlement?.settlementAmount ? (

                            <div className="
                              w-full
                              flex flex-row gap-2 items-center justify-center">

                              <button
                                /*
                                className="
                                w-44        
                                flex flex-col gap-2 items-center justify-center
                                bg-purple-500 text-white px-2 py-1 rounded-md hover:bg-purple-600
                                text-sm
                                transition duration-300 ease-in-out
                                transform hover:scale-105
                                hover:shadow-lg
                                hover:shadow-purple-500/50
                                hover:cursor-pointer
                                hover:transition-transform
                                hover:duration-300
                                hover:ease-in-out

                                "
                                */
                                disabled={item.settlement.txid === "0x" || !item.settlement.txid}

                                className={`
                                  ${item.settlement.txid === "0x" || !item.settlement.txid ? "bg-gray-500 cursor-not-allowed" : "bg-[#AFE4AB] hover:bg-[#9BCDA5] cursor-pointer"}
                                  flex flex-col gap-1 items-center justify-center
                                  w-48 
                                  bg-[#AFE4AB] hover:bg-[#9BCDA5]
                                  text-sm text-green-800 font-semibold
                                  border border-green-600 rounded-lg px-3 py-2
                                  hover:border-green-700
                                  hover:shadow-lg
                                  hover:shadow-green-500/50
                                  transition-all duration-200 ease-in-out
                                  hover:scale-105
                                  hover:cursor-pointer
                                `}

                                onClick={() => {
                                  if (item.settlement.txid === "0x" || !item.settlement.txid) {
                                    alert("트랙젝션 해시가 없습니다.");
                                    return;
                                  } else {
                                    window.open(
                                      
                                      chain === 'ethereum' ? `https://etherscan.io/tx/${item.settlement.txid}`
                                      : chain === 'polygon' ? `https://polygonscan.com/tx/${item.settlement.txid}`
                                      : chain === 'arbitrum' ? `https://arbiscan.io/tx/${item.settlement.txid}`
                                      : chain === 'bsc' ? `https://bscscan.com/tx/${item.settlement.txid}`
                                      : `https://arbiscan.io/tx/${item.settlement.txid}`,

                                      '_blank'
                                    );
                                  }
                                }}
                              >


                                <div className="
                                  w-full  
                                  flex flex-col gap-0.5 items-end justify-center leading-tight"
                                  style={{
                                    fontFamily: 'monospace',
                                  }}
                                >
            
                                  <span>
                                    {
                                      item?.settlement?.settlementAmount &&
                                      Number(item?.settlement?.settlementAmount).toFixed(3).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                                    }
                                    {' '}
                                    {
                                      item?.settlement?.settlementWalletAddress &&
                                    item?.settlement?.settlementWalletAddress?.slice(0, 5) + '...'}
                                  </span>
                                  <span>
                                    {
                                      item?.settlement?.agentFeeAmount ?
                                      Number(item?.settlement?.agentFeeAmount).toFixed(3).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                                      : '0'
                                    }
                                    {' '}
                                    {
                                      item?.settlement?.agentFeeWalletAddress &&
                                    item?.settlement?.agentFeeWalletAddress?.slice(0, 5) + '...'}
                                  </span>
                                  <span>
                                    {item?.settlement?.feeAmount ?
                                      Number(item?.settlement?.feeAmount).toFixed(3).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                                      : '0'
                                    }
                                    {' '}
                                    {
                                      item?.settlement?.feeWalletAddress &&
                                    item?.settlement?.feeWalletAddress?.slice(0, 5) + '...'}
                                  </span>

                                </div>

                              </button>
                        
                              <div className="  
                                w-20 
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
                                  <span className="text-sm font-semibold text-blue-600">
                                    {
                                      item.nickname.length > 5
                                      ? item.nickname.slice(0, 5) + '...'
                                      : item.nickname
                                    }
                                  </span>
                                </button>

                                {/* 충전금액(원) */}
                                <span className="text-sm text-zinc-500">
                                  충전금액
                                </span>

                                <span className="text-sm text-blue-600 font-semibold"
                                  style={{
                                    fontFamily: 'monospace',
                                  }}
                                >
                                  {Number(item.krwAmount).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                </span>
                              </div>


                            </div>

                          ) : (
                            <>
                              {item.status === 'paymentConfirmed'
                              && item?.transactionHash !== '0x'
                              && item?.transactionHashFail !== true
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

                                      <div className="flex flex-row gap-1 items-center justify-center">
                                        <Image
                                          src="/icon-tether.png"
                                          alt="USDT"
                                          width={20}
                                          height={20}
                                          className="rounded-lg w-6 h-6 object-cover"
                                        />
                                        <span className="text-lg font-semibold text-[#409192]"
                                          style={{
                                            fontFamily: 'monospace',
                                          }}
                                        >
                                          {Number(item.usdtAmount).toFixed(3).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                        </span>
                                      </div>

                                      {/*
                                        if item.paymentConfirmedAt (2025-07-03T09:26:37.818Z)
                                          is last 1 hour, show button to settlement
                                      */}


                                      {/* 일단 수동으로 정산하기는 막는다. */}
                                      
                                      {item.transactionHash &&
                                        new Date().getTime() - new Date(item.paymentConfirmedAt).getTime() > 1000 * 5 * 60 && (

                                        <div className="flex flex-row gap-2 items-center justify-center">

                                          <input
                                            disabled={loadingSettlement[index]}
                                            type="checkbox"
                                            checked={settlementCheck[index]}
                                            onChange={(e) => {
                                              setSettlementCheck(
                                                settlementCheck.map((item, idx) => {
                                                  if (idx === index) {
                                                    return e.target.checked;
                                                  }
                                                  return item;
                                                })
                                              );
                                            }}
                                            className="w-5 h-5
                                            rounded-md"

                                          />

                                          <button
                                            disabled={
                                              !settlementCheck[index]
                                              || loadingSettlement[index]
                                            }
                                            className={`
                                              ${settlementCheck[index] ? 'bg-blue-500' : 'bg-gray-500'}
                                              w-full
                                              flex flex-row gap-1 text-sm text-white px-2 py-1 rounded-md
                                              hover:bg-blue-600
                                              hover:shadow-lg
                                              hover:shadow-blue-500/50
                                              transition-all duration-200 ease-in-out
                                              ${!settlementCheck[index] || loadingSettlement[index]
                                              ? 'cursor-not-allowed' : 'cursor-pointer'}
                                            `}

                                            onClick={() => {
                                            
                                              settlementRequest(
                                                index,
                                                item._id,
                                              );
                                              

                                            }}
                                          >
                                            <div className="flex flex-row gap-2 items-center justify-center">
                                              {loadingSettlement[index] ? (
                                                <span className="text-sm">
                                                  정산중...
                                                </span>
                                              ) : (
                                                <span className="text-sm">
                                                  수동으로 정산하기
                                                </span>
                                              )}
                                            </div>

                                          </button>
                                        </div>
                                      )}
                                      



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



          


        </div>

      

        {/* pagination */}
        {/* url query string */}
        {/* 1 2 3 4 5 6 7 8 9 10 */}
        {/* ?limit=10&page=1 */}
        {/* submit button */}
        {/* totalPage = Math.ceil(totalCount / limit) */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">


          <div className="flex flex-row items-center gap-2">
            <select
              value={limitValue}
              onChange={(e) =>
                router.push(`/${params.lang}/admin/buyorder?storecode=${searchStorecode}&limit=${Number(e.target.value)}&page=${pageValue}`)
              }

              className="text-sm bg-neutral-900 text-white px-3 py-2 rounded-md border border-neutral-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-neutral-500"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>

          {/* 처음으로 */}
          <button
            disabled={Number(pageValue) <= 1}
            className={`text-sm px-4 py-2 rounded-md border transition ${
              Number(pageValue) <= 1
                ? 'bg-neutral-200 text-neutral-400 border-neutral-200'
                : 'bg-neutral-900 text-white border-neutral-900 hover:-translate-y-0.5 hover:shadow-md'
            }`}
            onClick={() => {
              router.push(`/${params.lang}/admin/buyorder?storecode=${searchStorecode}&limit=${Number(limitValue)}&page=1`)
            }}
          >
            처음으로
          </button>


          <button
            disabled={Number(pageValue) <= 1}
            className={`text-sm px-4 py-2 rounded-md border transition ${
              Number(pageValue) <= 1
                ? 'bg-neutral-200 text-neutral-400 border-neutral-200'
                : 'bg-neutral-800 text-white border-neutral-900 hover:-translate-y-0.5 hover:shadow-md'
            }`}
            onClick={() => {

              router.push(`/${params.lang}/admin/buyorder?storecode=${searchStorecode}&limit=${Number(limitValue)}&page=${Number(pageValue) - 1}`)


            }}
          >
            이전
          </button>


          <span className="text-sm text-neutral-500 px-2">
            {pageValue} / {Math.ceil(Number(buyOrderStats.totalCount) / Number(limitValue))}
          </span>


          <button
            disabled={Number(pageValue) >= Math.ceil(Number(buyOrderStats.totalCount) / Number(limitValue))}
            className={`text-sm px-4 py-2 rounded-md border transition ${
              Number(pageValue) >= Math.ceil(Number(buyOrderStats.totalCount) / Number(limitValue))
                ? 'bg-neutral-200 text-neutral-400 border-neutral-200'
                : 'bg-neutral-900 text-white border-neutral-900 hover:-translate-y-0.5 hover:shadow-md'
            }`}
            onClick={() => {

              router.push(`/${params.lang}/admin/buyorder?storecode=${searchStorecode}&limit=${Number(limitValue)}&page=${Number(pageValue) + 1}`)

            }}
          >
            다음
          </button>

          {/* 마지막으로 */}
          <button
            disabled={Number(pageValue) >= Math.ceil(Number(buyOrderStats.totalCount) / Number(limitValue))}
            className={`text-sm px-4 py-2 rounded-md border transition ${
              Number(pageValue) >= Math.ceil(Number(buyOrderStats.totalCount) / Number(limitValue))
                ? 'bg-neutral-200 text-neutral-400 border-neutral-200'
                : 'bg-neutral-800 text-white border-neutral-900 hover:-translate-y-0.5 hover:shadow-md'
            }`}
            onClick={() => {

              router.push(`/${params.lang}/admin/buyorder?storecode=${searchStorecode}&limit=${Number(limitValue)}&page=${Math.ceil(Number(buyOrderStats.totalCount) / Number(limitValue))}`)

            }}
          >
            마지막으로
          </button>

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
                <span className="w-4 h-4 border-2 border-emerald-300 border-t-transparent rounded-full animate-spin" />
                불러오는 중...
              </div>
            )}

            {!tradeDetailLoading && !tradeDetailData && (
              <div className="text-sm text-zinc-500">표시할 거래 정보가 없습니다.</div>
            )}

            {!tradeDetailLoading && tradeDetailData && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3 text-sm text-zinc-700">
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
                    <span className="text-zinc-500">구매자 아이디</span>
                    <span className="font-semibold">{tradeDetailData?.buyer?.nickname || '-'}</span>
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
                    <span className="font-semibold">{formatKstDateTime(tradeDetailData?.createdAt)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500">가맹점</span>
                    <span className="font-semibold">
                      {tradeDetailData?.store?.storeName || tradeDetailData?.storecode || '-'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-2 text-[12px] text-zinc-500 rounded-xl border border-zinc-100 bg-zinc-50 p-3">
                  <div className="flex items-center justify-between">
                    <span>수락 시각</span>
                    <span className="font-mono text-zinc-700">{formatKstDateTime(tradeDetailData?.acceptedAt) || '-'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>결제요청 시각</span>
                    <span className="font-mono text-zinc-700">{formatKstDateTime(tradeDetailData?.paymentRequestedAt) || '-'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>입금확인 시각</span>
                    <span className="font-mono text-zinc-700">{formatKstDateTime(tradeDetailData?.paymentConfirmedAt) || '-'}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Modal>

        {/* 사용계좌 이력 패널 (좌측 슬라이드) */}
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
            className={`absolute inset-y-0 left-0 bg-white shadow-2xl w-full sm:w-[560px] max-w-[720px] h-full overflow-y-auto transition-transform duration-300 ease-out ${
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
                <div className="flex flex-col gap-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex flex-col gap-1.5">
                      <span className="text-xs uppercase tracking-wide text-zinc-500">사용계좌번호</span>
                      <span className="text-2xl font-extrabold text-zinc-900" style={{ fontFamily: 'monospace' }}>
                        {aliasPanelAliasNumber || aliasPanelAccountNumber || '-'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 min-w-0">
                      <Image
                        src={aliasPanelStoreLogo || '/icon-store.png'}
                        alt="Store"
                        width={28}
                        height={28}
                        className="w-7 h-7 rounded-md border border-zinc-200 bg-white object-cover"
                      />
                      <span className="text-sm font-semibold text-zinc-800 truncate max-w-[150px]">
                        {aliasPanelStoreName || '가맹점 정보 없음'}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[11px] uppercase tracking-wide text-zinc-400 mt-1">실계좌번호</span>
                    <span className="text-base font-semibold text-zinc-600" style={{ fontFamily: 'monospace' }}>
                      {aliasPanelAccountNumber || '-'}
                    </span>
                    {(aliasPanelBankName || aliasPanelAccountHolder) && (
                      <span className="text-sm font-semibold text-zinc-700">
                        {aliasPanelBankName || '은행명 없음'} · {aliasPanelAccountHolder || '예금주 없음'}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-2 text-sm font-semibold">
                  <span className="text-xs text-zinc-500">
                    조회기간 {searchFromDate} ~ {searchToDate}
                  </span>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1 bg-zinc-100 rounded-lg p-1">
                      {[
                        { key: 'all', label: '전체' },
                        { key: 'matched', label: '정상입금' },
                        { key: 'unmatched', label: '미신청입금' },
                      ].map((opt) => (
                        <button
                          key={opt.key}
                          className={`px-2.5 py-1 text-[11px] rounded-md transition ${
                            aliasPanelMatchFilter === opt.key
                              ? 'bg-white shadow-sm border border-zinc-200 font-semibold'
                              : 'text-zinc-600'
                          }`}
                          onClick={() => {
                            setAliasPanelMatchFilter(opt.key as any);
                            fetchAliasTransfers(
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
                    <div className="flex items-center gap-2">
                      <button
                        className="text-xs px-3 py-1.5 rounded-md border border-zinc-200 hover:bg-zinc-50 active:scale-95 transition"
                        onClick={() =>
                          fetchAliasTransfers(aliasPanelAccountNumber, {
                            bankName: aliasPanelBankName,
                            accountHolder: aliasPanelAccountHolder,
                            aliasAccountNumber: aliasPanelAliasNumber || aliasPanelAccountNumber,
                            defaultAccountNumber: aliasPanelAliasNumber || aliasPanelAccountNumber,
                            realAccountNumber: aliasPanelAccountNumber,
                          }, aliasPanelMatchFilter, 1, false)
                        }
                        >
                          새로고침
                        </button>
                      <button
                        className={`text-xs px-3 py-1.5 rounded-md border border-emerald-200 text-emerald-700 hover:bg-emerald-50 active:scale-95 transition disabled:opacity-50 disabled:cursor-not-allowed`}
                        onClick={downloadAliasPanelExcel}
                        disabled={aliasPanelDownloading}
                      >
                        {aliasPanelDownloading ? '다운로드중...' : '엑셀다운로드'}
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1.5 rounded-md bg-zinc-100 text-zinc-700">
                      건수 {aliasPanelTotalCount.toLocaleString()}
                    </span>
                    <span className="px-3.5 py-2 rounded-md bg-amber-50 text-amber-600" style={{ fontFamily: 'monospace' }}>
                      합계 {aliasPanelTotalAmount?.toLocaleString()} 원
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 space-y-3 pt-4">
              <div className="flex items-center justify-between text-xs text-zinc-500">
                <span>검색결과입니다.</span>
              </div>

              {aliasPanelError && (
                <div className="text-sm text-red-600 mb-3">오류: {aliasPanelError}</div>
              )}

              {!aliasPanelLoading && !aliasPanelError && aliasPanelTransfers.length === 0 && (
                <div className="text-sm text-zinc-500">표시할 이력이 없습니다.</div>
              )}

                  <div className="space-y-2">
                {aliasPanelTransfers.map((trx: any, idx: number) => (
                  <div
                    key={trx._id || idx}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs"
                  >
                  {(() => {
                    const descendingIndex = aliasPanelTotalCount
                      ? aliasPanelTotalCount - idx
                      : aliasPanelTransfers.length - idx;
                    const m = trx?.match;
                    const normalized = m === undefined || m === null
                      ? ''
                      : typeof m === 'string'
                        ? m.toLowerCase()
                        : 'object';
                    const isSuccess = normalized === 'success' || normalized === 'object';
                    const matchInfo = isSuccess
                      ? { label: '정상입금', className: 'bg-blue-100 text-blue-700 border border-blue-200' }
                      : { label: '미신청입금', className: 'bg-amber-100 text-amber-700 border border-amber-200' };
                    const manualProcessed = !!trx?.matchedByAdmin;
                    return (
                      <>
                        <div className="flex items-center gap-2 min-w-0 w-full sm:w-auto">
                          <span className="w-6 text-center text-[11px] text-zinc-400">
                            {descendingIndex}.
                          </span>
                          {!isSuccess && (
                            <button
                              className="text-[11px] px-2 py-0.5 rounded-md border border-rose-200 text-rose-600 hover:bg-rose-50 active:scale-95 transition"
                              onClick={() => openAliasConfirmModal(trx)}
                            >
                              입금처리
                            </button>
                          )}
                          <div className="flex flex-col gap-1">
                            <span className={`sm:w-[72px] w-auto min-w-[64px] text-center px-2 py-0.5 rounded-full leading-none ${matchInfo.className}`}>
                              {matchInfo.label}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                                manualProcessed
                                  ? 'bg-purple-50 border-purple-200 text-purple-700'
                                  : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                              }`}
                              style={{ textAlign: 'center' }}
                            >
                              {manualProcessed ? '수동처리' : '자동처리'}
                            </span>
                          </div>
                          <span className="font-semibold text-zinc-900 truncate">
                            {trx.transactionName || '-'}
                          </span>
                        </div>
                        <div className="flex flex-col items-end gap-1 w-full sm:w-auto text-right">
                          {(() => {
                            const rawDate = trx.transactionDate || trx.regDate;
                            const dt = rawDate ? new Date(rawDate) : null;
                            const isValid = dt && !Number.isNaN(dt.getTime());
                            const dateLabel = isValid
                              ? dt.toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' })
                              : '-';
                            const timeLabel = isValid
                              ? dt.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
                              : '';
                            return (
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-emerald-700" style={{ fontFamily: 'monospace' }}>
                                  {trx.amount !== undefined ? Number(trx.amount).toLocaleString() : '-'}
                                </span>
                                <span className="text-[11px] text-zinc-500 whitespace-nowrap">
                                  {isValid ? `${dateLabel} ${timeLabel}` : '-'}
                                </span>
                              </div>
                              );
                            })()}
                          {(() => {
                            const m = trx?.match;
                            const normalized = m === undefined || m === null
                              ? ''
                              : typeof m === 'string'
                                ? m.toLowerCase()
                                : 'object';
                            const isSuccess = normalized === 'success' || normalized === 'object';
                            const sellerName = trx.buyerInfo?.nickname || trx.userInfo?.nickname || trx.userId || '';
                            const combined = [sellerName].filter(Boolean).join(' ');
                            const fallback = '매칭되는 거래없음';
                            const text = combined || fallback;
                            const isFallback = !isSuccess && !combined;
                            return (
                              <div className="flex items-center justify-end gap-2 w-full sm:w-auto">
                                <span
                                  className={`px-3 py-0.5 rounded-md text-[11px] min-w-[120px] sm:min-w-[160px] text-center ${
                                    isFallback
                                      ? 'border border-amber-200 bg-amber-50 text-amber-700'
                                      : 'border border-zinc-200 bg-zinc-50 text-zinc-600'
                                  }`}
                                >
                                  {text}
                                </span>
                                {trx.memo && (
                                  <span className="px-3 py-0.5 rounded-md text-[11px] min-w-[120px] sm:min-w-[160px] text-center border border-zinc-200 bg-zinc-50 text-zinc-500">
                                    {trx.memo}
                                  </span>
                                )}
                              </div>
                            );
                          })()}
                          {trx.tradeId && (
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => openTradeDetailModal(trx.tradeId)}
                                className="px-2 py-0.5 rounded-md border border-emerald-200 bg-emerald-50 text-emerald-700 font-mono text-[11px] hover:bg-emerald-100 transition"
                              >
                                {trx.tradeId}
                              </button>
                            </div>
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

      {/* 입금내역 선택 모달 */}
      {depositModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-xl rounded-2xl bg-white shadow-2xl border border-zinc-200">
              <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-200">
                <div className="flex flex-col">
                  <span className="text-base font-semibold text-zinc-900">입금내역 선택</span>
                  <span className="text-xs text-zinc-500">거래를 완료하기 위해서 해당 미신청한 입금을 찾아야 합니다.</span>
                </div>
              </div>
            <div className="px-5 pt-4 pb-2 space-y-3">
              {targetConfirmOrder && (
                <div className="rounded-xl border border-zinc-200 bg-white px-3.5 py-3 text-[13px] text-zinc-800 shadow-sm space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="text-[11px] text-zinc-500">거래 ID</span>
                      <span className="font-mono text-[12px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-700">
                        {targetConfirmOrder.tradeId || '-'}
                      </span>
                    </span>
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-[16px] font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
                        {(targetConfirmOrder.krwAmount ?? 0).toLocaleString()}원
                      </span>
                      <span className="font-mono text-[16px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
                        {(targetConfirmOrder.usdtAmount ?? 0).toLocaleString(undefined, { minimumFractionDigits: 3, maximumFractionDigits: 3 })} USDT
                      </span>
                      {targetConfirmOrder.rate && (
                        <span className="font-mono text-[12px] text-zinc-500">
                          환율 {Number(targetConfirmOrder.rate).toLocaleString()}
                        </span>
                      )}
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-600">
                        {targetConfirmOrder.status === 'paymentRequested' ? '결제요청' : targetConfirmOrder.status}
                      </span>
                    </span>
                  </div>

                  <div className="flex flex-col gap-1.75 text-[12.5px]">
                    <div className="flex flex-wrap items-baseline gap-2">
                      <span className="text-[11px] font-semibold text-zinc-500 w-12">가맹점</span>
                      <span className="font-semibold text-zinc-900 text-[13.5px]">
                        {targetConfirmOrder.store?.storeName || '-'}
                      </span>
                      <span className="text-[11px] text-zinc-500">
                        {targetConfirmOrder.store?.storecode || '-'}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-baseline gap-2">
                      <span className="text-[11px] font-semibold text-zinc-500 w-12">구매자</span>
                      <span className="font-semibold text-zinc-900 text-[13.5px]">
                        {targetConfirmOrder.buyer?.depositName || '-'}
                      </span>
                      {targetConfirmOrder.buyer?.depositBankName && (
                        <span className="text-[11px] text-zinc-500">
                          {targetConfirmOrder.buyer.depositBankName}
                        </span>
                      )}
                      {targetConfirmOrder.buyer?.depositBankAccountNumber && (
                        <span className="text-[11px] font-mono text-emerald-700">
                          {targetConfirmOrder.buyer.depositBankAccountNumber}
                        </span>
                      )}
                      {targetConfirmOrder.nickname && (
                        <span className="text-[11px] text-zinc-500">
                          ({targetConfirmOrder.nickname})
                        </span>
                      )}
                      {targetConfirmOrder.buyer?.nickname && (
                        <span className="text-[11px] text-zinc-500">
                          @{targetConfirmOrder.buyer.nickname}
                        </span>
                      )}
                      {(() => {
                        const buyerId =
                          targetConfirmOrder.buyer?.id ||
                          targetConfirmOrder.buyer?._id ||
                          targetConfirmOrder.buyer?.userId ||
                          targetConfirmOrder.buyer?.uid ||
                          targetConfirmOrder.buyer?.username;
                        return buyerId ? (
                          <span className="text-[11px] text-zinc-500">
                            ID {buyerId}
                          </span>
                        ) : null;
                      })()}
                      <span className="text-[11px] text-zinc-500 font-mono">
                        {targetConfirmOrder.walletAddress ? `${targetConfirmOrder.walletAddress.slice(0, 6)}...${targetConfirmOrder.walletAddress.slice(-4)}` : '-'}
                      </span>
                      {targetConfirmOrder.buyer?.bankInfo?.bankName && (
                        <span className="text-[11px] text-zinc-500">
                          {targetConfirmOrder.buyer.bankInfo.bankName}
                        </span>
                      )}
                      {targetConfirmOrder.buyer?.bankInfo?.accountNumber && (
                        <span className="text-[11px] font-mono text-emerald-700">
                          {targetConfirmOrder.buyer.bankInfo.accountNumber}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-baseline gap-2">
                      <span className="text-[11px] font-semibold text-zinc-500 w-12">판매자</span>
                      <span className="font-semibold text-zinc-900 text-[13.5px]">
                        {targetConfirmOrder.seller?.nickname || targetConfirmOrder.seller?.name || '-'}
                      </span>
                      <span className="text-[11px] text-zinc-500">
                        {targetConfirmOrder.seller?.bankInfo?.bankName || '은행명 없음'}
                      </span>
                      {targetConfirmOrder.seller?.bankInfo?.accountHolder && (
                        <span className="text-[11px] text-zinc-500">
                          {targetConfirmOrder.seller.bankInfo.accountHolder}
                        </span>
                      )}
                      <span className="text-[11px] font-mono text-emerald-700">
                        {targetConfirmOrder.seller?.bankInfo?.accountNumber || '-'}
                      </span>
                      <span className="text-[11px] font-mono text-zinc-600">
                        {targetConfirmOrder.seller?.bankInfo?.realAccountNumber || targetConfirmOrder.seller?.bankInfo?.accountNumber || '-'}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-zinc-100 bg-zinc-50 px-3 py-2.5 text-[11.5px] text-zinc-600">
                    <span className="text-[11px] font-semibold text-zinc-500 mr-1">타임라인</span>
                    <span className="flex items-center gap-1 rounded-md border border-zinc-200 bg-white px-2 py-1">
                      <span className="text-[11px] text-zinc-500">주문</span>
                      <span className="font-mono text-[11px] text-zinc-700">{formatKstDateTime(targetConfirmOrder.createdAt)}</span>
                    </span>
                    {targetConfirmOrder.acceptedAt && (
                      <span className="flex items-center gap-1 rounded-md border border-zinc-200 bg-white px-2 py-1">
                        <span className="text-[11px] text-zinc-500">수락</span>
                        <span className="font-mono text-[11px] text-zinc-700">{formatKstDateTime(targetConfirmOrder.acceptedAt)}</span>
                      </span>
                    )}
                    {targetConfirmOrder.paymentRequestedAt && (
                      <span className="flex items-center gap-1 rounded-md border border-zinc-200 bg-white px-2 py-1">
                        <span className="text-[11px] text-zinc-500">입금요청</span>
                        <span className="font-mono text-[11px] text-zinc-700">{formatKstDateTime(targetConfirmOrder.paymentRequestedAt)}</span>
                      </span>
                    )}
                    {targetConfirmOrder.paymentConfirmedAt && (
                      <span className="flex items-center gap-1 rounded-md border border-zinc-200 bg-white px-2 py-1">
                        <span className="text-[11px] text-zinc-500">입금확인</span>
                        <span className="font-mono text-[11px] text-zinc-700">{formatKstDateTime(targetConfirmOrder.paymentConfirmedAt)}</span>
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="px-5 pb-1">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-zinc-900">미신청입금 내역</h3>
                <button
                  onClick={refreshDepositOptions}
                  disabled={depositModalLoading || !targetConfirmOrder}
                  className={`flex items-center gap-1 rounded-md border px-2.5 py-1 text-[11px] font-semibold transition ${
                    depositModalLoading
                      ? 'bg-zinc-100 text-zinc-400 border-zinc-200 cursor-not-allowed'
                      : 'bg-white text-emerald-700 border-emerald-200 hover:bg-emerald-50'
                  }`}
                >
                  {depositModalLoading ? (
                    <span className="w-3 h-3 border-2 border-emerald-300 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span className="text-emerald-700">⟳</span>
                  )}
                  <span>새로고침</span>
                </button>
              </div>
              <p className="text-[11px] text-zinc-500 mt-1">
                내역중에서 해당 주문에 해당하는 입금을 선택하세요. 중복해서 선택가능합니다.
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-[12px]">
                <span className="px-3 py-1.5 rounded-full border border-zinc-300 bg-zinc-50 text-zinc-700 font-semibold shadow-sm">
                  선택 <span className="font-bold text-zinc-900">{selectedDepositIds.length}</span>건
                </span>
                <span className="px-3.5 py-1.5 rounded-full border border-emerald-400 bg-emerald-50 text-emerald-700 font-semibold shadow-sm flex items-baseline gap-1">
                  <span>합계</span>
                  <span className="font-mono text-[13px] font-bold">
                    {selectedDepositTotal.toLocaleString()}
                  </span>
                  <span>원</span>
                </span>
                {selectedDepositIds.length > 0 && (
                  <span
                    className={`px-3 py-1.5 rounded-full border shadow-sm text-[12px] font-semibold ${
                      depositAmountMatches
                        ? 'border-emerald-400 bg-emerald-50 text-emerald-700'
                        : 'border-amber-400 bg-amber-50 text-amber-700'
                    }`}
                  >
                    {depositAmountMatches
                      ? '주문 금액과 일치'
                      : `주문 금액 ${Number(targetConfirmOrder?.krwAmount || 0).toLocaleString()}원과 불일치`}
                  </span>
                )}
              </div>
              {selectedDepositIds.length > 0 && !depositAmountMatches && (
                <div className="mt-2 rounded-md border border-rose-300 bg-rose-50 text-rose-700 text-[12px] px-3 py-2 flex items-start gap-2">
                  <span className="text-rose-600 font-bold">!</span>
                  <span>
                    선택한 입금 합계가 주문 금액과 다릅니다. 금액을 정확히 맞추지 않으면 결제 확정이 불가하거나 오류가 발생할 수 있습니다.
                  </span>
                </div>
              )}
            </div>
            <div className="max-h-[50vh] overflow-y-auto px-5 pb-3 space-y-2">
              {depositModalLoading ? (
                <div className="flex items-center justify-center py-6 text-sm text-zinc-500">
                  불러오는 중...
                </div>
              ) : depositOptions.length === 0 ? (
                <div className="flex items-center justify-center py-6 text-sm text-zinc-500">
                  표시할 입금내역이 없습니다.
                </div>
              ) : (
                depositOptions.map((trx: any, idx: number) => {
                  const key = trx._id || String(idx);
                  const isSelected = selectedDepositIds.includes(key);
                  const buyerDepositName = (targetConfirmOrder?.buyer?.depositName || '').trim();
                  const transferName = (trx.transactionName || '').trim();
                  const normalizeAcc = (v: any) => String(v || '').replace(/[^0-9a-z]/gi, '').toLowerCase();
                  const sellerAccount = normalizeAcc(targetConfirmOrder?.seller?.bankInfo?.accountNumber);
                  const transferAccount = normalizeAcc(trx.bankAccountNumber);
                  const nameMatches =
                    !!buyerDepositName &&
                    buyerDepositName.length > 0 &&
                    buyerDepositName.toLowerCase() === transferName.toLowerCase();
                  const accountMatches = !!sellerAccount && sellerAccount === transferAccount && !!transferAccount;
                  const toggle = () => {
                    setSelectedDepositIds((prev) =>
                      prev.includes(key) ? prev.filter((id) => id !== key) : [...prev, key]
                    );
                  };
                  return (
                    <label
                      key={key}
                      className={`flex items-center justify-between gap-3 rounded-lg border px-3 py-2 cursor-pointer transition ${
                        isSelected
                          ? 'border-emerald-400 bg-emerald-50'
                          : 'border-zinc-200 hover:border-emerald-200'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          name="depositSelect"
                          className="w-4 h-4 text-emerald-600 border-zinc-300 focus:ring-emerald-400"
                          checked={isSelected}
                          onChange={toggle}
                        />
                        <div className="flex flex-col gap-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border whitespace-nowrap ${
                              ((trx.match ?? '').toString().toLowerCase() === 'success' || (trx.match ?? '').toString().toLowerCase() === 'object')
                                ? 'bg-blue-50 border-blue-200 text-blue-700'
                                : 'bg-amber-50 border-amber-200 text-amber-700'
                            }`}>
                              {(() => {
                                const label = (trx.match ?? '').toString().toLowerCase();
                                return label === 'success' || label === 'object'
                                  ? '정상입금'
                                  : '미신청입금';
                              })()}
                            </span>
                            <div className="flex flex-col leading-tight max-w-[140px]">
                              <span className="text-sm font-semibold text-zinc-900 truncate">
                                {transferName || '-'}
                              </span>
                              <span className="text-[11px] text-zinc-500 truncate">
                                {trx.buyerInfo?.nickname || '-'}
                              </span>
                            </div>
                            {buyerDepositName && (
                              <span
                                className={`text-[11px] px-2 py-0.5 rounded-full border ${
                                  nameMatches
                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                    : 'bg-amber-50 border-amber-200 text-amber-700'
                                }`}
                              >
                                {nameMatches ? '입금자명 일치' : '입금자명 불일치'}
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                            <span className="flex items-center gap-1">
                              · {trx.bankName || ''} · {trx.accountHolder || ''} · {trx.bankAccountNumber || ''}
                            </span>
                            {sellerAccount && (
                              <span
                                className={`px-2 py-0.5 rounded-full border ${
                                  accountMatches
                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                    : 'bg-amber-50 border-amber-200 text-amber-700'
                                }`}
                              >
                                {accountMatches ? '계좌번호 일치' : '계좌번호 불일치'}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1 text-right">
                        <div className="flex items-center gap-2 text-[11px] text-zinc-500">
                          {trx.tradeId && (
                            <button
                              type="button"
                              onClick={() => openTradeDetailModal(trx.tradeId)}
                              className="px-2 py-0.5 rounded-md border border-emerald-200 bg-emerald-50 text-emerald-700 font-mono hover:bg-emerald-100 transition"
                            >
                              {trx.tradeId}
                            </button>
                          )}
                          {trx.userId && (
                            <span className="px-2 py-0.5 rounded-md border border-zinc-200 bg-zinc-50">
                              {trx.userId}
                            </span>
                          )}
                        </div>
                        <span className="text-base font-semibold text-emerald-700" style={{ fontFamily: 'monospace' }}>
                          {(trx.amount !== undefined ? Number(trx.amount) : 0).toLocaleString()}
                        </span>
                        <span className="text-[12px] text-zinc-600 font-medium flex items-center gap-1">
                          <span className="text-emerald-500 text-xs">●</span>
                          {formatKstDateTime(trx.transactionDate || trx.regDate)}
                        </span>
                      </div>
                    </label>
                  );
                })
              )}
            </div>
            <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-zinc-200">
              <button
                className="px-3 py-2 text-sm rounded-md border border-zinc-300 text-zinc-600 hover:bg-zinc-100 transition"
                onClick={() => {
                  setDepositModalOpen(false);
                  setSelectedDepositIds([]);
                }}
              >
                취소하기
              </button>
              <button
                disabled={depositModalLoading}
                className={`px-4 py-2 text-sm rounded-md text-white font-semibold shadow-sm transition ${
                  depositModalLoading
                    ? 'bg-emerald-300 cursor-not-allowed'
                    : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
                onClick={handleConfirmPaymentWithSelected}
              >
                {depositModalLoading ? '진행중...' : '완료하기'}
              </button>
            </div>
          </div>
        </div>
      )}

      {aliasPanelConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-zinc-200 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-zinc-900">입금내역 처리</h3>
              <button
                className="text-sm text-zinc-500 hover:text-zinc-700"
                onClick={closeAliasConfirmModal}
                disabled={aliasPanelConfirmLoading}
              >
                닫기
              </button>
            </div>
            <div className="text-sm text-zinc-600 space-y-1">
              <div>해당 입금내역을 정상입금으로 처리하고 메모를 저장합니다.</div>
              <div className="font-mono text-[12px] text-zinc-500">
                ID: {aliasPanelConfirmTarget?._id || '-'}
              </div>
              {aliasPanelConfirmTarget?.amount !== undefined && (
                <div className="font-semibold text-emerald-700">
                  금액: {Number(aliasPanelConfirmTarget.amount).toLocaleString()} 원
                </div>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-zinc-700">메모</label>
              <textarea
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                rows={3}
                value={aliasPanelConfirmMemo}
                onChange={(e) => setAliasPanelConfirmMemo(e.target.value)}
                placeholder="설명을 입력하세요"
                disabled={aliasPanelConfirmLoading}
              />
            </div>
            <div className="flex items-center justify-end gap-2">
              <button
                className="px-3 py-2 text-sm rounded-md border border-zinc-300 text-zinc-600 hover:bg-zinc-100 transition"
                onClick={closeAliasConfirmModal}
                disabled={aliasPanelConfirmLoading}
              >
                취소
              </button>
              <button
                className={`px-4 py-2 text-sm rounded-md text-white font-semibold shadow-sm transition ${
                  aliasPanelConfirmLoading
                    ? 'bg-emerald-200 cursor-not-allowed'
                    : 'bg-emerald-600 hover:bg-emerald-500'
                }`}
                onClick={confirmAliasMatchUpdate}
                disabled={aliasPanelConfirmLoading}
              >
                {aliasPanelConfirmLoading ? '처리중...' : '확인'}
              </button>
            </div>
          </div>
        </div>
      )}


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
      <h1 className="text-2xl font-semibold">거래정보</h1>
      
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
