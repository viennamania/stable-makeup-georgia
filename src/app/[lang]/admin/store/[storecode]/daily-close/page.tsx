'use client';

import { useState, useEffect, use, act } from "react";

import Image from "next/image";



// open modal

import Modal from '@/components/modal';

import { useRouter }from "next//navigation";


import { toast } from 'react-hot-toast';

import { client } from "../../../../../client";



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
import { getDictionary } from "../../../../../dictionaries";
//import Chat from "@/components/Chat";
import { ClassNames } from "@emotion/react";


import useSound from 'use-sound';
import { it } from "node:test";
import { get } from "http";


import { useSearchParams } from 'next/navigation';



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
}



const wallets = [
  inAppWallet({
    auth: {
      options: [
        "google",
      ],
    },
  }),
];


// get escrow wallet address

//const escrowWalletAddress = "0x2111b6A49CbFf1C8Cc39d13250eF6bd4e1B59cF6";



const contractAddress = "0xc2132D05D31c914a87C6611C10748AEb04B58e8F"; // USDT on Polygon
const contractAddressArbitrum = "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9"; // USDT on Arbitrum




export default function Index({ params }: any) {

  const searchParams = useSearchParams();
 
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
          chain: params.storecode,
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
              storecode: params.storecode,
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
                  storecode: params.storecode,
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
        console.error('Error:', error);
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
              storecode: params.storecode,
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

    params.storecode,
    searchFromDate,
    searchToDate,
    searchBuyer,
    searchDepositName,
    searchStoreBankAccountNumber
]);


///console.log('agreementForTrade', agreementForTrade);


const [fetchingBuyOrders, setFetchingBuyOrders] = useState(false);

const fetchBuyOrders = async () => {


  if (fetchingBuyOrders) {
    return;
  }
  setFetchingBuyOrders(true);

  const response = await fetch('/api/order/getAllBuyOrdersByStorecodeDaily', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    },
    body: JSON.stringify(
      {
        storecode: params.storecode,
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

  return data.result.orders;
}




  


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
              storecode: params.storecode,
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

    if (!params.storecode) {
      return;
    }

    fetchData();

  } , [params.storecode, address]);

  








  // get escrow history
  const [escrowHistory, setEscrowHistory] = useState<any[]>([]);
  const [fetchingEscrowHistory, setFetchingEscrowHistory] = useState(false);
  useEffect(() => {
    const fetchEscrowHistory = async () => {
      if (fetchingEscrowHistory) {
        return;
      }
      setFetchingEscrowHistory(true);

      const response = await fetch('/api/escrow/history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          storecode: params.storecode,
          limit: 100,
          page: 1, // Assuming page 0 is the first page
        }),
      });

      if (!response.ok) {
        toast.error('Failed to fetch escrow history');
        return;
      }

      const data = await response.json();

      setEscrowHistory(data.result.escrows || []);
      setFetchingEscrowHistory(false);

    };

    fetchEscrowHistory();

  }, [params.storecode, limitValue, pageValue]);





  

  const withdrawEscrow = async (date: string, withdrawAmount: number) => {

    const response = await fetch('/api/escrow/withdraw', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        storecode: params.storecode,
        date: date,
        withdrawAmount: withdrawAmount
      }),
    });

    if (!response.ok) {
      toast.error('Failed to withdraw from escrow');
      return;
    }

    toast.success('Escrow withdrawal successful');

    const data = await response.json();

    // get store.escrowAmountUSDT from storecode
    // api getStoreEscrowAmountUSDT

    const responseStore = await fetch('/api/store/getOneStore', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        storecode: params.storecode,
      }),
    });

    if (!responseStore.ok) {
      toast.error('Failed to fetch store data');
      return;
    }

    const storeData = await responseStore.json();

    //console.log("storeData", storeData);

    if (storeData.result) {

      setStore(storeData.result);

    }

    // get escrow history
    const fetchEscrowHistory = async () => {
      const response = await fetch('/api/escrow/history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          storecode: params.storecode,
          limit: 100,
          page: 1,
        }),
      });

      if (!response.ok) {
        toast.error('Failed to fetch escrow history');
        return;
      }

      const data = await response.json();

      setEscrowHistory(data.result.escrows || []);
    };

    fetchEscrowHistory();


    return data.result;

  };



  // depositEscrow function

  ///const [depositEscrowDate, setDepositEscrowDate] = useState("");
  
  const [depositEscrowAmount, setDepositEscrowAmount] = useState(0);

  const depositEscrow = async (depositAmount: number) => {

    // date is set to today
    const date = new Date();
    date.setHours(date.getHours() + 9); // Adjust for Korean timezone (UTC+9)
    const formattedDate = date.toISOString().split('T')[0]; // YYYY-MM-DD format


    const response = await fetch('/api/escrow/deposit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        storecode: params.storecode,
        date: formattedDate,
        depositAmount: depositAmount
      }),
    });

    if (!response.ok) {
      toast.error('Failed to deposit to escrow');
      return;
    }

    toast.success('Escrow deposit successful');

    const data = await response.json();

    // get store.escrowAmountUSDT from storecode
    // api getStoreEscrowAmountUSDT

    const responseStore = await fetch('/api/store/getOneStore', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        storecode: params.storecode,
      }),
    });

    if (!responseStore.ok) {
      toast.error('Failed to fetch store data');
      return;
    }

    const storeData = await responseStore.json();

    //console.log("storeData", storeData);

    if (storeData.result) {

      setStore(storeData.result);

    }

    // get escrow history
    const fetchEscrowHistory = async () => {
      const response = await fetch('/api/escrow/history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          storecode: params.storecode,
          limit: 100,
          page: 1,
        }),
      });

      if (!response.ok) {
        toast.error('Failed to fetch escrow history');
        return;
      }

      const data = await response.json();

      setEscrowHistory(data.result.escrows || []);
    };

    fetchEscrowHistory();

    return data.result;
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

  // if params.storecode is empty, error page
  if (!fetchingStore && !params.storecode) {
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

    <main className="p-4 pb-10 min-h-[100vh] flex items-start justify-center container max-w-screen-lg mx-auto">


      <div className="py-0 w-full">



          <div className="flex flex-col items-start justify-center gap-2">





            <div className="w-full flex flex-row gap-2 items-center justify-start text-zinc-500 text-lg"
            >
                {/* go back button */}
                <div className="w-full flex justify-start items-center gap-2">
                    <button
                        onClick={() => window.history.back()}
                        className="flex items-center justify-center bg-gray-200 rounded-lg p-2
                        hover:bg-gray-300 transition duration-200 ease-in-out"
                    >
                        <Image
                            src="/icon-back.png"
                            alt="Back"
                            width={20}
                            height={20}
                            className="rounded-full"
                        />
                        <span className="ml-2 text-sm text-gray-500 font-semibold">
                            돌아가기
                        </span>
                    </button>

                </div>



                {!address && (
                <ConnectButton
                    client={client}
                    wallets={wallets}
                    chain={arbitrum}
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

                {/*
                {address && !loadingUser && (
                    <div className="w-full flex flex-row items-center justify-end gap-2">

                        <span className="text-lg text-gray-500 font-semibold">
                        {user?.nickname || "프로필"}
                        </span>

                    </div>
                )}
                */}

            </div>



            <div className='flex flex-row items-center justify-start gap-2'>
                <Image
                    src={store?.storeLogo || "/icon-store.png"}
                    alt="Store Logo"
                    width={35}
                    height={35}
                    className="w-10 h-10 rounded-full"
                />

                <div className="text-xl font-semibold">
                가맹점{' '}{
                    store && store.storeName + " (" + store.storecode + ")"
                }{' '}에스크로관리
                </div>
            </div>


            {/* store?.escrowAmountUSDT */}
            {/* 보유수량(USDT) */}
            <div className="w-full flex flex-col items-end justify-end gap-2
            border-b border-zinc-300 pb-2">
  
              {/* 가맹점 보유 */}
              <div className="flex flex-col xl:flex-row items-start xl:items-center gap-2">
                <div className="flex flex-row gap-2 items-center">
                  <Image
                    src="/icon-escrow.png"
                    alt="Escrow"
                    width={20}
                    height={20}
                    className="w-5 h-5"
                  />
                  <span className="text-lg font-semibold text-zinc-500">
                    가맹점 보유수량(USDT)
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
                      store?.escrowAmountUSDT
                      ? Number(store?.escrowAmountUSDT).toFixed(3).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                      : 0
                    }
                  </span>
                </div>
  
              </div>
            </div>


            {/* dpposit date picker and deposit amount and deposit escrow button */}
            <div className="flex flex-row items-center justify-between gap-2 mt-4">
              
              <div className="flex flex-col items-start justify-start gap-2 w-full">
                <label className="text-sm text-zinc-500 font-semibold">
                  에스크로 입금 금액(USDT)
                </label>
                <input
                  type="number"
                  value={depositEscrowAmount}
                  onChange={(e) => setDepositEscrowAmount(Number(e.target.value))}
                  className="w-full p-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                onClick={() => depositEscrow(depositEscrowAmount)}
                disabled={depositEscrowAmount <= 0}
                className={`
                  ${depositEscrowAmount <= 0 ? "bg-gray-300 cursor-not-allowed" : "bg-blue-500 hover:bg-blue-600"}
                  w-72 h-10 flex items-center justify-center
                  text-white font-semibold py-2 px-4 rounded-md transition duration-200 ease-in-out
                `}
              >
                에스크로 입금
              </button>
            </div>


            {/* escrow history table */}
            <div className="w-full flex flex-col items-start justify-start gap-2 mt-4">

              <h2 className="text-lg font-semibold text-zinc-600">
                에스크로 입출금 내역
              </h2>

              <table className="w-full table-auto border-collapse border border-zinc-800 rounded-md">

                <thead className="bg-zinc-200">
                  <tr>
                    <th className="px-4 py-2 text-left text-sm font-semibold text-zinc-600">
                      날짜
                    </th>
                    <th className="px-4 py-2 text-right text-sm font-semibold text-zinc-600">
                      에스크로 출금량(USDT)
                    </th>
                    <th className="px-4 py-2 text-right text-sm font-semibold text-zinc-600">
                      에스크로 입금량(USDT)
                    </th>
                    {/* 처리전 잔고 */}
                    <th className="px-4 py-2 text-right text-sm font-semibold text-zinc-600">
                      처리전 잔고(USDT)
                    </th>
                    {/* 처리후 잔고 */}
                    <th className="px-4 py-2 text-right text-sm font-semibold text-zinc-600">
                      처리후 잔고(USDT)
                    </th>

                  </tr>
                </thead>

                <tbody>
                  {
                  escrowHistory && escrowHistory.length > 0 &&
                  escrowHistory.map((escrow, index) => (
                    <tr key={index} className="border-b border-zinc-300 hover:bg-zinc-100">
                      <td className="px-4 py-2 text-sm text-zinc-700">
                        {new Date(escrow.date).toLocaleDateString('ko-KR')}
                      </td>
                      <td className="px-4 py-2 text-sm text-[#409192] font-semibold text-right"
                        style={{ fontFamily: 'monospace' }}
                      >
                        {
                          escrow.withdrawAmount
                          ? Number(escrow.withdrawAmount).toFixed(3).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                          : 0
                        }
                      </td>
                      <td className="px-4 py-2 text-sm text-[#409192] font-semibold text-right"
                        style={{ fontFamily: 'monospace' }}
                      >
                        {
                          escrow.depositAmount
                          ? Number(escrow.depositAmount).toFixed(3).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                          : 0
                        }
                      </td>
                      {/* beforeBalance */}
                      <td className="px-4 py-2 text-sm text-[#409192] font-semibold text-right"
                        style={{ fontFamily: 'monospace' }}
                      >
                        {
                          escrow.beforeBalance
                          ? Number(escrow.beforeBalance).toFixed(3).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                          : 0
                        }
                      </td>
                      {/* afterBalance */}
                      <td className="px-4 py-2 text-sm text-[#409192] font-semibold text-right"
                        style={{ fontFamily: 'monospace' }}
                      >
                        {
                          escrow.afterBalance
                          ? Number(escrow.afterBalance).toFixed(3).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                          : 0
                        }
                      </td>
                      
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="w-full overflow-x-auto mt-4">
              <h2 className="text-lg font-semibold text-zinc-600">
                에스크로 출금처리
              </h2>

                <table className=" w-full table-auto border-collapse border border-zinc-800 rounded-md">

                  <thead className="bg-zinc-200">
                    <tr>
                      <th className="px-4 py-2 text-left text-sm font-semibold text-zinc-600">
                        날짜
                      </th>
                      {/* align right */}
                      <th className="px-4 py-2 text-right text-sm font-semibold text-zinc-600">P2P 거래수(건)</th>
                      <th className="px-4 py-2 text-right text-sm font-semibold text-zinc-600">P2P 거래량(USDT)</th>
                      <th className="px-4 py-2 text-right text-sm font-semibold text-zinc-600">P2P 거래금액(원)</th>

                      {/*
                      <th className="px-4 py-2 text-right text-sm font-semibold text-zinc-600">결제수(건)/미결제수(건)</th>
                      */}

                      <th className="px-4 py-2 text-right text-sm font-semibold text-zinc-600">AG 수수료량(USDT)</th>
                      <th className="px-4 py-2 text-right text-sm font-semibold text-zinc-600">AG 수수료금액(원)</th>

                      <th className="px-4 py-2 text-right text-sm font-semibold text-zinc-600">PG 수수료량(USDT)</th>
                      <th className="px-4 py-2 text-right text-sm font-semibold text-zinc-600">PG 수수료금액(원)</th>

                      <th className="px-4 py-2 text-right text-sm font-semibold text-zinc-600">결제량(USDT)</th>
                      <th className="px-4 py-2 text-right text-sm font-semibold text-zinc-600">결제금액(원)</th>

                      {/* escrow withdraw */}
                      <th className="px-4 py-2 text-right text-sm font-semibold text-zinc-600">
                        에스크로 출금
                      </th>

                    </tr>
                  </thead>
                  <tbody>
                    
                    {buyOrders.map((order, index) => (
                      <>

                      {/* skip if order.data is today's date */}
                      
                      {new Date(order.date).toLocaleDateString('ko-KR') !== new Date().toLocaleDateString('ko-KR') && (
                      

                        <tr key={index} className="border-b border-zinc-300 hover:bg-zinc-100">
                          <td className="px-4 py-2 text-sm text-zinc-700">
                            {new Date(order.date).toLocaleDateString('ko-KR')}
                          </td>
                          {/* align right */}
                          <td className="px-4 py-2 text-sm text-zinc-700 text-right">
                            {order.totalCount ? order.totalCount.toLocaleString() : 0}
                          </td>


                          <td className="px-4 py-2 text-sm text-[#409192] font-semibold text-right"
                            style={{ fontFamily: 'monospace' }}
                          >
                            {Number(order.totalUsdtAmount).toFixed(3).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                          </td>
                          <td className="px-4 py-2 text-sm text-yellow-600 font-semibold text-right"
                            style={{ fontFamily: 'monospace' }}
                          >
                            {Number(order.totalKrwAmount).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                          </td>

                          {/*
                          <td className="px-4 py-2 text-sm text-zinc-700 text-right">
                            {order.totalSettlementCount ? order.totalSettlementCount.toLocaleString() : 0}
                            {' / '}
                            {(order.totalCount || 0) - (order.totalSettlementCount || 0)}
                          </td>
                          */}

                          <td className="px-4 py-2 text-sm text-[#409192] font-semibold text-right"
                            style={{ fontFamily: 'monospace' }}
                          >
                            {Number(order.totalAgentFeeAmount).toFixed(3).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                          </td>
                          <td className="px-4 py-2 text-sm text-yellow-600 font-semibold text-right"
                            style={{ fontFamily: 'monospace' }}
                          >
                            {Number(order.totalAgentFeeAmountKRW).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                          </td>

                          <td className="px-4 py-2 text-sm text-[#409192] font-semibold text-right"
                            style={{ fontFamily: 'monospace' }}
                          >
                            {Number(order.totalFeeAmount).toFixed(3).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                          </td>
                          <td className="px-4 py-2 text-sm text-yellow-600 font-semibold text-right"
                            style={{ fontFamily: 'monospace' }}
                          >
                            {Number(order.totalFeeAmountKRW).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                          </td>

                          <td className="px-4 py-2 text-sm text-[#409192] font-semibold text-right"
                            style={{ fontFamily: 'monospace' }}
                          >
                            {Number(order.totalSettlementAmount).toFixed(3).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                          </td>
                          <td className="px-4 py-2 text-sm text-yellow-600 font-semibold text-right"
                            style={{ fontFamily: 'monospace' }}
                          >
                            {Number(order.totalSettlementAmountKRW).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                          </td>


                          <td className="px-4 py-2 text-sm text-blue-600 font-semibold text-right">
                            {order.totalEscrowCount && order.totalEscrowCount > 0 ? (
                              <span className="text-[#409192]">
                                {Number(order.totalEscrowWithdrawAmount).toFixed(3).replace(/\B(?=(\d{3})+(?!\d))/g, ',')} USDT
                                출금완료
                              </span>
                            ) : (

                              <button
                                onClick={() => {

                                  withdrawEscrow(order.date, order.totalAgentFeeAmount + order.totalFeeAmount)
                                  
                                }}
                                className="text-blue-600 hover:underline"
                              >
                                {Number(order.totalAgentFeeAmount + order.totalFeeAmount).toFixed(3).replace(/\B(?=(\d{3})+(?!\d))/g, ',')} USDT
                                출금하기
                              </button>
                            
                            )}
                          </td>

                        </tr>

                      
                      )}

                      </>
                    

                        
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={4} className="px-4 py-2 text-sm text-zinc-500">
                        
                      </td>
                    </tr>
                  </tfoot>
                </table>

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



