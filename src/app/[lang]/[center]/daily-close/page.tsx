'use client';

import { useState, useEffect, useMemo, use, act } from "react";

import Image from "next/image";



// open modal

import Modal from '@/components/modal';

import { useRouter }from "next//navigation";


import { toast } from 'react-hot-toast';

import { client } from "../../../client";



import {
  getContract,
  sendAndConfirmTransaction,
  sendTransaction,
  waitForReceipt,
} from "thirdweb";



import {
  polygon,
  arbitrum,
} from "thirdweb/chains";

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
//import Chat from "@/components/Chat";
import { ClassNames } from "@emotion/react";


import useSound from 'use-sound';
import { it } from "node:test";
import { get } from "http";


import { useSearchParams } from 'next/navigation';

import { version } from "../../../config/version";
import CenterTopMenu from "@/components/center/CenterTopMenu";



/*
    {
      date: '2025-07-25',
      storecode: 'repruuqp',
      totalUsdtAmount: 19339.14,
      totalKrwAmount: 26688000
    },
    */

interface BuyOrder {

  date: string,

  totalCount: number, // Count the number of orders
  totalUsdtAmount: number,
  totalKrwAmount: number,

  totalSettlementCount: number, // Count the number of settlements
  totalSettlementAmount: number,
  totalSettlementAmountKRW: number,

  totalAgentFeeAmount: number,
  totalAgentFeeAmountKRW: number,
  totalFeeAmount: number,
  totalFeeAmountKRW: number,

  totalEscrowCount: number, // Count the number of escrows
  totalEscrowWithdrawAmount: number, // Total amount withdrawn from escrow
  totalEscrowDepositAmount: number, // Total amount deposited to escrow

  totalClearanceCount: number,
  totalClearanceUsdtAmount: number,
  totalClearanceKrwAmount: number,  

  store: any,
  seller: any,
}



const wallets = [
  inAppWallet({
    auth: {
      options: ["email", "google"],
    },
  }),
];


// get escrow wallet address

//const escrowWalletAddress = "0x2111b6A49CbFf1C8Cc39d13250eF6bd4e1B59cF6";



const contractAddress = "0xc2132D05D31c914a87C6611C10748AEb04B58e8F"; // USDT on Polygon
const contractAddressArbitrum = "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9"; // USDT on Arbitrum

const formatUsdtDisplay = (value: number | null | undefined) =>
  Number(value || 0).toFixed(3).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

const formatKrwDisplay = (value: number | null | undefined) =>
  Number(value || 0).toLocaleString('ko-KR');

const formatDateInputValue = (date: Date) => {
  const target = new Date(date);
  target.setHours(target.getHours() + 9);
  return target.toISOString().split('T')[0];
};

const formatDailyCloseDate = (value: string | null | undefined) => {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString('ko-KR');
};

const formatDailyCloseWeekday = (value: string | null | undefined) => {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleDateString('ko-KR', { weekday: 'short' });
};

const DailyCloseMetricCard = ({
  label,
  value,
  unit,
  tone = 'zinc',
  helper,
}: {
  label: string;
  value: string;
  unit?: string;
  tone?: 'zinc' | 'emerald' | 'amber';
  helper?: string;
}) => {
  const toneClassName =
    tone === 'emerald'
      ? 'text-emerald-700'
      : tone === 'amber'
        ? 'text-amber-600'
        : 'text-zinc-900';

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-4 shadow-sm">
      <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
        {label}
      </div>
      <div className="mt-3 flex items-end gap-1.5">
        <span className={`text-2xl font-semibold leading-none tracking-tight ${toneClassName}`}>
          {value}
        </span>
        {unit && (
          <span className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
            {unit}
          </span>
        )}
      </div>
      {helper && (
        <div className="mt-2 text-xs text-zinc-500">
          {helper}
        </div>
      )}
    </div>
  );
};

const DailyCloseAmountCell = ({
  usdtValue,
  krwValue,
}: {
  usdtValue: number | null | undefined;
  krwValue: number | null | undefined;
}) => (
  <div className="flex flex-col items-end gap-1">
    <span
      className="text-sm font-semibold text-emerald-700 sm:text-base"
      style={{ fontFamily: 'monospace' }}
    >
      {formatUsdtDisplay(usdtValue)}
    </span>
    <span
      className="text-sm font-semibold text-amber-600 sm:text-base"
      style={{ fontFamily: 'monospace' }}
    >
      {formatKrwDisplay(krwValue)}
    </span>
  </div>
);



export default function Index({ params }: any) {

  const searchParams = useSearchParams()!;
 
  const wallet = searchParams.get('wallet');


  // limit, page number params

  const limit = searchParams.get('limit') || 10;
  const page = searchParams.get('page') || 1;



  const contract = getContract({
    // the client you have created via `createThirdwebClient()`
    client,
    // the chain the contract is deployed on
    
    
    chain: arbitrum,
  
  
  
    // the contract's address
    ///address: contractAddressArbitrum,

    address: contractAddressArbitrum,


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

  

  


  const [nativeBalance, setNativeBalance] = useState(0);
  const [balance, setBalance] = useState(0);
  useEffect(() => {

    // get the balance
    const getBalance = async () => {

      ///console.log('getBalance address', address);

      
      const result = await balanceOf({
        contract,
        address: address || "",
      });

  
      //console.log(result);
  
      setBalance( Number(result) / 10 ** 6 );


      /*
      await fetch('/api/user/getBalanceByWalletAddress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chain: params.center,
          walletAddress: address,
        }),
      })

      .then(response => response.json())

      .then(data => {
          setNativeBalance(data.result?.displayValue);
      });
      */



    };


    if (address) getBalance();

    const interval = setInterval(() => {
      if (address) getBalance();
    } , 5000);

    return () => clearInterval(interval);

  } , [address, contract]);






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



  
  // get User by wallet address


  
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
        
        ///console.log('getUser data.result', data.result);


        setUser(data.result);

        setIsAdmin(data.result?.role === "admin");


    })
    .catch((error) => {
        console.error('Error:', JSON.stringify(error));
        setUser(null);
        setIsAdmin(false);
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

  


  const [searchMyOrders, setSearchMyOrders] = useState(false);




  // limit number
  const [limitValue, setLimitValue] = useState(limit || 20);
  useEffect(() => {
    setLimitValue(limit || 20);
  }, [limit]);

  // page number
  const [pageValue, setPageValue] = useState(page || 1);
  useEffect(() => {
    setPageValue(page || 1);
  }, [page]);
  



  // search form date to date
  const [searchFromDate, setSearchFormDate] = useState("");
  // set today's date in YYYY-MM-DD format
  useEffect(() => {

    //const today = new Date();
    //first day of the year
    const today = new Date( new Date().getFullYear(), 0, 1);

    today.setHours(today.getHours() + 9); // Adjust for Korean timezone (UTC+9)


    const formattedDate = today.toISOString().split('T')[0]; // YYYY-MM-DD format
    setSearchFormDate(formattedDate);
  }, []);




  const [searchToDate, setSearchToDate] = useState("");

  // set today's date in YYYY-MM-DD format
  useEffect(() => {
    const today = new Date();
    today.setHours(today.getHours() + 9); // Adjust for Korean timezone (UTC+9)

    const formattedDate = today.toISOString().split('T')[0]; // YYYY-MM-DD format
    setSearchToDate(formattedDate);
  }, []);





  const [searchBuyer, setSearchBuyer] = useState("");

  const [searchDepositName, setSearchDepositName] = useState("");


  // search store bank account number
  const [searchStoreBankAccountNumber, setSearchStoreBankAccountNumber] = useState("");

  





  // limit number
  //const [limit, setLimit] = useState(20);

  // page number
  //const [page, setPage] = useState(1);


  const [totalCount, setTotalCount] = useState(0);

  const [loadingBuyOrders, setLoadingBuyOrders] = useState(false);
    
  const [buyOrders, setBuyOrders] = useState<BuyOrder[]>([]);



   

  useEffect(() => {


    const fetchBuyOrders = async () => {


      setLoadingBuyOrders(true);

      const response = await fetch('/api/order/getAllBuyOrdersByStorecodeDaily', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
          },
          body: JSON.stringify(

            {
              storecode: params.center,
              limit: Number(limit),
              page: Number(page),
              walletAddress: address,
              searchMyOrders: searchMyOrders,

              fromDate: searchFromDate,
              toDate: searchToDate,

              searchBuyer: searchBuyer,
              searchDepositName: searchDepositName,
              searchStoreBankAccountNumber: searchStoreBankAccountNumber,
            }

        ),
      });

      setLoadingBuyOrders(false);

      if (!response.ok) {
        return;
      }



      const data = await response.json();


      setBuyOrders(data.result.orders);

      setTotalCount(data.result.totalCount);
      


    }


    fetchBuyOrders();

    
    
    const interval = setInterval(() => {

      fetchBuyOrders();


    }, 5000);
  

    return () => clearInterval(interval);
    
    
    
    


  } , [
    limit,
    page,
    address,
    searchMyOrders,

    params.center,
    searchFromDate,
    searchToDate,
    searchBuyer,
    searchDepositName,
    searchStoreBankAccountNumber
]);







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
              walletAddress: address,
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

  const dailyCloseSummary = useMemo(() => {
    return buyOrders.reduce(
      (acc, order) => {
        acc.totalDays += 1;
        acc.totalCount += Number(order.totalCount || 0);
        acc.totalUsdtAmount += Number(order.totalUsdtAmount || 0);
        acc.totalKrwAmount += Number(order.totalKrwAmount || 0);
        acc.totalSettlementAmount += Number(order.totalSettlementAmount || 0);
        acc.totalSettlementAmountKRW += Number(order.totalSettlementAmountKRW || 0);
        acc.totalFeeAmount += Number(order.totalAgentFeeAmount || 0) + Number(order.totalFeeAmount || 0);
        acc.totalFeeAmountKRW += Number(order.totalAgentFeeAmountKRW || 0) + Number(order.totalFeeAmountKRW || 0);
        acc.totalEscrowWithdrawAmount += Number(order.totalEscrowWithdrawAmount || 0);
        acc.totalClearanceCount += Number(order.totalClearanceCount || 0);
        acc.totalClearanceUsdtAmount += Number(order.totalClearanceUsdtAmount || 0);
        acc.totalClearanceKrwAmount += Number(order.totalClearanceKrwAmount || 0);
        return acc;
      },
      {
        totalDays: 0,
        totalCount: 0,
        totalUsdtAmount: 0,
        totalKrwAmount: 0,
        totalSettlementAmount: 0,
        totalSettlementAmountKRW: 0,
        totalFeeAmount: 0,
        totalFeeAmountKRW: 0,
        totalEscrowWithdrawAmount: 0,
        totalClearanceCount: 0,
        totalClearanceUsdtAmount: 0,
        totalClearanceKrwAmount: 0,
      },
    );
  }, [buyOrders]);

  const applyQuickDateRange = (days: number) => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - Math.max(0, days - 1));

    setSearchFormDate(formatDateInputValue(startDate));
    setSearchToDate(formatDateInputValue(endDate));
  };

  const resetDailyCloseFilters = () => {
    const today = formatDateInputValue(new Date());
    setSearchFormDate(today);
    setSearchToDate(today);
    setSearchBuyer("");
    setSearchDepositName("");
    setSearchStoreBankAccountNumber("");
  };












  


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

        }

        setFetchingStore(false);
    };

    if (!params.center) {
      return;
    }

    fetchData();

  } , [params.center, address]);

  


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





  // if loadingStore is true, show loading
  if (fetchingStore) {
    return (
      <main className="p-4 pb-10 min-h-[100vh] flex items-start justify-center container max-w-screen-2xl mx-auto">
        <div className="py-0 w-full">
          <h1 className="text-2xl font-bold">로딩 중...</h1>
        </div>
      </main>
    );
  }

  // if params.center is empty, error page
  if (!fetchingStore && !params.center) {
    return (
      <main className="p-4 pb-10 min-h-[100vh] flex items-start justify-center container max-w-screen-2xl mx-auto">
        <div className="py-0 w-full">
          <h1 className="text-2xl font-bold text-red-500">잘못된 접근입니다.</h1>
          <p className="text-gray-500">올바른 상점 코드를 입력해주세요.</p>
        </div>
      </main>
    );
  }



  return (

    <main className="p-4 pb-10 min-h-[100vh] flex items-start justify-center container max-w-screen-2xl mx-auto">


      {/* fixed position right and vertically center */}
      <div className="
        hidden sm:flex
        fixed right-4 top-1/2 transform -translate-y-1/2
        z-40
        ">

          <div className="w-full flex flex-col items-end justify-center gap-4">


            {/* Clearance Orders */}
            
            {version !== 'bangbang' && (
            <div className="flex flex-row items-center justify-center gap-2
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
            

        
          </div>

      </div>

      <div className="py-0 w-full">


          <div className="mb-4 w-full rounded-2xl border border-zinc-200 bg-white/90 p-3 shadow-sm backdrop-blur-sm">

              <div className="flex flex-row items-center gap-2">
                
                {/*
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
                        className="items-center justify-center rounded-xl border border-zinc-900 bg-zinc-900 px-4 py-2 text-sm text-zinc-50 transition hover:bg-zinc-800"
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

                          className="w-32 flex items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm text-zinc-700 transition hover:bg-zinc-50"
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





            <CenterTopMenu lang={params.lang} center={params.center} activeKey="daily-close" />

            <div className="mt-1 w-full flex flex-col gap-4">
              <section className="w-full overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm">
                <div className="flex flex-col gap-4 p-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-zinc-900 text-white shadow-sm">
                      <Image
                        src="/icon-statistics.png"
                        alt="Statistics"
                        width={26}
                        height={26}
                        className="h-6 w-6"
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                        Daily Close
                      </div>
                      <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-900">
                        통계(일별)
                      </h1>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                        <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-1">
                          {store?.storeName || params.center}
                        </span>
                        <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-1">
                          {searchFromDate || '-'} ~ {searchToDate || '-'}
                        </span>
                        <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-1">
                          집계 {buyOrders.length.toLocaleString()}일
                        </span>
                      </div>
                    </div>
                  </div>

                  {version !== 'bangbang' && (
                    <div className="grid w-full gap-3 lg:max-w-[520px] lg:grid-cols-[minmax(0,1fr)_auto]">
                      <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3">
                        <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
                          Escrow Snapshot
                        </div>
                        <div className="mt-3 grid gap-3 sm:grid-cols-2">
                          <div>
                            <div className="text-xs text-zinc-500">현재 보유량</div>
                            <div
                              className="mt-1 text-xl font-semibold text-emerald-700"
                              style={{ fontFamily: 'monospace' }}
                            >
                              {formatUsdtDisplay(escrowBalance)}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-zinc-500">오늘 수수료 차감량</div>
                            <div
                              className="mt-1 text-xl font-semibold text-rose-600"
                              style={{ fontFamily: 'monospace' }}
                            >
                              {formatUsdtDisplay(todayMinusedEscrowAmount)}
                            </div>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          router.push('/' + params.lang + '/' + params.center + '/escrow-history');
                        }}
                        className="inline-flex items-center justify-center rounded-2xl border border-zinc-900 bg-zinc-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800"
                      >
                        보유량 내역
                      </button>
                    </div>
                  )}
                </div>
              </section>

              <section className="w-full rounded-2xl border border-zinc-200 bg-white/90 p-4 shadow-sm">
                <div className="flex flex-col gap-3 xl:grid xl:grid-cols-[minmax(0,1fr)_540px] xl:items-end">
                  <div className="grid flex-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
                    <label className="flex flex-col gap-1">
                      <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
                        From
                      </span>
                      <input
                        type="date"
                        value={searchFromDate}
                        onChange={(e) => setSearchFormDate(e.target.value)}
                        className="h-11 rounded-xl border border-zinc-300 bg-zinc-50 px-3 text-sm text-zinc-800 outline-none transition focus:border-zinc-500"
                      />
                    </label>

                    <label className="flex flex-col gap-1">
                      <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
                        To
                      </span>
                      <input
                        type="date"
                        value={searchToDate}
                        onChange={(e) => setSearchToDate(e.target.value)}
                        className="h-11 rounded-xl border border-zinc-300 bg-zinc-50 px-3 text-sm text-zinc-800 outline-none transition focus:border-zinc-500"
                      />
                    </label>

                    <label className="flex flex-col gap-1">
                      <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
                        Buyer
                      </span>
                      <input
                        type="text"
                        value={searchBuyer}
                        onChange={(e) => setSearchBuyer(e.target.value)}
                        placeholder="구매자 검색"
                        className="h-11 rounded-xl border border-zinc-300 bg-zinc-50 px-3 text-sm text-zinc-800 outline-none transition focus:border-zinc-500"
                      />
                    </label>

                    <label className="flex flex-col gap-1">
                      <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
                        Deposit Name
                      </span>
                      <input
                        type="text"
                        value={searchDepositName}
                        onChange={(e) => setSearchDepositName(e.target.value)}
                        placeholder="입금자명 검색"
                        className="h-11 rounded-xl border border-zinc-300 bg-zinc-50 px-3 text-sm text-zinc-800 outline-none transition focus:border-zinc-500"
                      />
                    </label>

                    <label className="flex flex-col gap-1">
                      <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
                        Bank Account
                      </span>
                      <input
                        type="text"
                        value={searchStoreBankAccountNumber}
                        onChange={(e) => setSearchStoreBankAccountNumber(e.target.value)}
                        placeholder="통장번호 검색"
                        className="h-11 rounded-xl border border-zinc-300 bg-zinc-50 px-3 text-sm text-zinc-800 outline-none transition focus:border-zinc-500"
                      />
                    </label>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 xl:w-[540px] xl:justify-end">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
                        onClick={() => applyQuickDateRange(1)}
                      >
                        오늘
                      </button>
                      <button
                        type="button"
                        className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
                        onClick={() => applyQuickDateRange(7)}
                      >
                        7일
                      </button>
                      <button
                        type="button"
                        className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
                        onClick={() => applyQuickDateRange(30)}
                      >
                        30일
                      </button>
                      <button
                        type="button"
                        className="h-10 rounded-xl border border-zinc-900 bg-zinc-900 px-3 text-sm font-semibold text-white transition hover:bg-zinc-800"
                        onClick={resetDailyCloseFilters}
                      >
                        초기화
                      </button>
                    </div>
                    <div className="flex h-10 min-w-[112px] items-center justify-end">
                      <div
                        className={`flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-500 transition-opacity ${
                          loadingBuyOrders ? 'opacity-100' : 'pointer-events-none opacity-0'
                        }`}
                        aria-hidden={!loadingBuyOrders}
                      >
                        <Image
                          src="/loading.png"
                          alt="Loading"
                          width={16}
                          height={16}
                          className="h-4 w-4 animate-spin"
                        />
                        로딩중...
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <section className="grid w-full gap-3 md:grid-cols-2 xl:grid-cols-3">
                <DailyCloseMetricCard
                  label="집계 일수"
                  value={dailyCloseSummary.totalDays.toLocaleString()}
                  unit="DAY"
                />
                <DailyCloseMetricCard
                  label="총 거래수"
                  value={dailyCloseSummary.totalCount.toLocaleString()}
                  unit="건"
                />
                <DailyCloseMetricCard
                  label="총 거래량"
                  value={formatUsdtDisplay(dailyCloseSummary.totalUsdtAmount)}
                  unit="USDT"
                  tone="emerald"
                />
                <DailyCloseMetricCard
                  label="총 거래금액"
                  value={formatKrwDisplay(dailyCloseSummary.totalKrwAmount)}
                  unit="KRW"
                  tone="amber"
                />
                <DailyCloseMetricCard
                  label="총 결제금액"
                  value={formatKrwDisplay(dailyCloseSummary.totalSettlementAmountKRW)}
                  unit="KRW"
                  tone="amber"
                />
                <DailyCloseMetricCard
                  label="총 청산금액"
                  value={formatKrwDisplay(dailyCloseSummary.totalClearanceKrwAmount)}
                  unit="KRW"
                  tone="amber"
                />
              </section>

              <section className="w-full overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
                <div className="flex flex-col gap-2 border-b border-zinc-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
                      Daily Table
                    </div>
                    <div className="mt-1 text-lg font-semibold tracking-tight text-zinc-900">
                      일별 마감 내역
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                    <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-1">
                      {buyOrders.length.toLocaleString()} rows
                    </span>
                    <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-1">
                      {searchFromDate || '-'} ~ {searchToDate || '-'}
                    </span>
                  </div>
                </div>

                {loadingBuyOrders && buyOrders.length === 0 ? (
                  <div className="px-4 py-10 text-center text-sm text-zinc-500">
                    일별 마감 데이터를 불러오는 중입니다.
                  </div>
                ) : buyOrders.length === 0 ? (
                  <div className="px-4 py-10 text-center text-sm text-zinc-500">
                    조회된 일별 마감 데이터가 없습니다.
                  </div>
                ) : (
                  <div className="w-full overflow-x-auto">
                    <table className="min-w-[1160px] w-full table-auto border-collapse">
                      <thead className="bg-zinc-900/95 text-zinc-100 backdrop-blur-sm">
                        <tr>
                          <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-300">
                            날짜
                          </th>
                          <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-300">
                            거래수
                          </th>
                          <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-300">
                            거래량 / 금액
                          </th>
                          <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-300">
                            결제량 / 금액
                          </th>
                          <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-300">
                            수수료량 / 금액
                          </th>
                          <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-300">
                            출금
                          </th>
                          <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-300">
                            청산수
                          </th>
                          <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-300">
                            청산량 / 금액
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {buyOrders.map((order, index) => (
                          <tr
                            key={`${order.date}-${index}`}
                            className="border-b border-zinc-200 bg-white transition-colors hover:bg-zinc-50/80"
                          >
                            <td className="px-4 py-3 align-top">
                              <div className="flex flex-col gap-1">
                                <span className="text-base font-semibold text-zinc-900">
                                  {formatDailyCloseDate(order.date)}
                                </span>
                                <span className="text-xs text-zinc-500">
                                  {formatDailyCloseWeekday(order.date)}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-right align-top">
                              <div className="text-lg font-semibold text-zinc-900">
                                {Number(order.totalCount || 0).toLocaleString()}
                              </div>
                            </td>
                            <td className="px-4 py-3 align-top">
                              <DailyCloseAmountCell
                                usdtValue={order.totalUsdtAmount}
                                krwValue={order.totalKrwAmount}
                              />
                            </td>
                            <td className="px-4 py-3 align-top">
                              <DailyCloseAmountCell
                                usdtValue={order.totalSettlementAmount}
                                krwValue={order.totalSettlementAmountKRW}
                              />
                            </td>
                            <td className="px-4 py-3 align-top">
                              <DailyCloseAmountCell
                                usdtValue={Number(order.totalAgentFeeAmount || 0) + Number(order.totalFeeAmount || 0)}
                                krwValue={Number(order.totalAgentFeeAmountKRW || 0) + Number(order.totalFeeAmountKRW || 0)}
                              />
                            </td>
                            <td className="px-4 py-3 text-right align-top">
                              {Number(order.totalEscrowCount || 0) > 0 ? (
                                <div className="flex flex-col items-end gap-1">
                                  <span
                                    className="text-sm font-semibold text-emerald-700"
                                    style={{ fontFamily: 'monospace' }}
                                  >
                                    {formatUsdtDisplay(order.totalEscrowWithdrawAmount)}
                                  </span>
                                  <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                                    출금완료
                                  </span>
                                </div>
                              ) : (
                                <span className="inline-flex items-center rounded-full border border-rose-200 bg-rose-50 px-2 py-1 text-[11px] font-semibold text-rose-600">
                                  출금대기
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-right align-top">
                              <div className="text-lg font-semibold text-zinc-900">
                                {Number(order.totalClearanceCount || 0).toLocaleString()}
                              </div>
                            </td>
                            <td className="px-4 py-3 align-top">
                              <DailyCloseAmountCell
                                usdtValue={order.totalClearanceUsdtAmount}
                                krwValue={order.totalClearanceKrwAmount}
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
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

        </div>

          <Modal isOpen={isModalOpen} onClose={closeModal}>
              <TradeDetail
                  closeModal={closeModal}
                  //goChat={goChat}
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
