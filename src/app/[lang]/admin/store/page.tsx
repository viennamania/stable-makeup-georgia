'use client';

import { useState, useEffect, use, act } from "react";

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
  getWalletBalance,
} from "thirdweb/wallets";





import {
  getUserEmail,
  getUserPhoneNumber
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


// import datePicker
import DatePicker from "react-datepicker";


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

  storecode: string;

  agentcode: string;
  agentName: string;
  agentLogo: string;
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


// get escrow wallet address

//const escrowWalletAddress = "0x2111b6A49CbFf1C8Cc39d13250eF6bd4e1B59cF6";



const contractAddress = "0xc2132D05D31c914a87C6611C10748AEb04B58e8F"; // USDT on Polygon
const contractAddressArbitrum = "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9"; // USDT on Arbitrum




export default function Index({ params }: any) {




  const searchParams = useSearchParams();
 
  const wallet = searchParams.get('wallet');


  // limit, page number params

  const limit = searchParams.get('limit') || 20;
  const page = searchParams.get('page') || 1;


  const paramAgentcode = searchParams.get('agentcode') || '';


  const activeWallet = useActiveWallet();
  


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
    } , 1000);

    return () => clearInterval(interval);

  } , [address, contract, params.center]);











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
        chain: params.center,
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
          chain: params.center,
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
          chain: params.center,
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
    } , 1000);

    return () => clearInterval(interval);

  } , [address, escrowWalletAddress, contract, params.center]);
  

  //console.log('escrowBalance', escrowBalance);







  

  // get User by wallet address
  const [isAdmin, setIsAdmin] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [loadingUser, setLoadingUser] = useState(false);





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
              storecode: "admin",
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
                  storecode: "admin",
                  walletAddress: address,
                }),
              })
              .then(response => response.json())
              .then(data => {
                  //console.log('data', data);
                  setUser(data.result);

                  setIsAdmin(data.result?.role === "admin");
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
        console.error('Error:', error);
        setUser(null);
        setEscrowWalletAddress('');
        setIsAdmin(false);
    });

    setLoadingUser(false);


  } , [address]);


  //console.log('user', user);







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
              /////walletAddress: address,
            }),
        });

        const data = await response.json();

        //console.log("data", data);

        if (data.result) {

          setStore(data.result);

          setStoreAdminWalletAddress(data.result?.adminWalletAddress);

        }

        setFetchingStore(false);
    };

    fetchData();

  } , []);









  const [searchStore, setSearchStorecode] = useState("");


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
  const [searchFromDate, setSearchFromDate] = useState("");
  // from date is not today, but today - 30 days
  useEffect(() => {
    const today = new Date();
    const formattedDate = new Date(today.setDate(today.getDate() - 30)).toISOString().split('T')[0]; // YYYY-MM-DD format
    setSearchFromDate(formattedDate);
  }, []);



  const [searchToDate, setSearchToDate] = useState("");
  useEffect(() => {
    const today = new Date();
    const toDate = new Date(today.setDate(today.getDate() + 1)); // add 1 day to today
    setSearchToDate(toDate.toISOString().split('T')[0]); // YYYY-MM-DD format
  }, []);




  const [agentcode, setAgentcode] = useState('');
  useEffect(() => {
    setAgentcode(paramAgentcode || '');
  }, [paramAgentcode]);




  const [fetchingAllStore, setFetchingAllStore] = useState(false);
  const [allStore, setAllStore] = useState([] as any[]);
  const [totalCount, setTotalCount] = useState(0);
  const [searchCount, setSearchCount] = useState(0);

  const fetchAllStore = async () => {
    if (fetchingAllStore) {
      return;
    }
    setFetchingAllStore(true);
    const response = await fetch('/api/store/getAllStores', {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json',
      },
      body: JSON.stringify(
        {
          walletAddress: address,
          limit: Number(limitValue),
          page: Number(pageValue),
          searchStore: searchStore,
          agentcode: paramAgentcode,

          fromDate: searchFromDate,
          toDate: searchToDate,
        }
      ),
    });
    if (!response.ok) {
      setFetchingAllStore(false);
      toast.error('가맹점 조회를 실패했습니다.');
      return;
    }
    const data = await response.json();
    
    //console.log('getAllStores data', data);


    setAllStore(data.result.stores);
    setTotalCount(data.result.totalCount);
    setSearchCount(data.result.searchCount);


    /*
    for (let i = 0; i < data.result.stores.length; i++) {
   
        const usdtBalance = await balanceOf({
          contract,
          address: allStore[i].adminWalletAddress,
        });

        console.log('allStore[i].adminWalletAddress', allStore[i].adminWalletAddress, 'usdtBalance', usdtBalance);

        setAllStore((prev) => {
          const newStore = [...prev];
          newStore[i] = {
            ...newStore[i],
            usdtBalance: Number(usdtBalance) / 10 ** 6,
          };
          return newStore;
        });

    }
    */




    setFetchingAllStore(false);

    return data.result.stores;
  }



  useEffect(() => {
    if (!address) {
      setAllStore([]);
      return;
    }
    fetchAllStore();
  } , [address, limitValue, pageValue, paramAgentcode,
    searchFromDate, searchToDate,
  ]);








  {/*
  {"storecode":"teststorecode","storeName":"테스트상점","storeType":"test","storeUrl":"https://test.com","storeDescription":"설명입니다.","storeLogo":"https://test.com/logo.png","storeBanner":"https://test.com/banner.png"}
  */}


  // insert store code

  const [storeCode, setStoreCode] = useState('');
  const [storeName, setStoreName] = useState('');
  const [storeType, setStoreType] = useState('test');
  const [storeUrl, setStoreUrl] = useState('https://test.com');
  const [storeDescription, setStoreDescription] = useState('설명입니다.');
  const [storeLogo, setStoreLogo] = useState('https://stable.makeup/logo.png');
  const [storeBanner, setStoreBanner] = useState('https://stable.makeup/logo.png');


  const [insertingStore, setInsertingStore] = useState(false);

  const insertStore = async () => {

    if (insertingStore) {
      return;
    }

    if (agentcode === '') {
      toast.error('에이전트 코드를 선택해주세요.');
      return;
    }

      // randomString is lowercase alphabet

      let generatedStoreCode = '';
      const characters = 'abcdefghijklmnopqrstuvwxyz';
      for (let i = 0; i < 8; i++) {
        generatedStoreCode += characters.charAt(Math.floor(Math.random() * characters.length));
      }
  
      console.log('generatedStoreCode', generatedStoreCode);
      
  



    setInsertingStore(true);
    const response = await fetch('/api/store/setStore', {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json',
      },
      body: JSON.stringify(
        {
          agentcode: agentcode,
          storecode: storeCode || generatedStoreCode,
          storeName: storeName,
          storeType: storeType,
          storeUrl: storeUrl,
          storeDescription: storeDescription,
          storeLogo: storeLogo,
          storeBanner: storeBanner,
        }
      ),
    });

    ///console.log('response', response);

    if (!response.ok) {
      setInsertingStore(false);
      toast.error('가맹점 코드 추가에 실패했습니다.');
      return;
    }

    setInsertingStore(false);

    const data = await response.json();
    
    ///console.log('data', data);

    if (data.result) {
      toast.success('가맹점 코드가 추가되었습니다.');

      // fetch all store code
      fetchAllStore();
      /*
      allStore.push({
        agentcode: agentcode,
        storecode: storeCode || generatedStoreCode,
        storeName: storeName,
        storeType: storeType,
        storeUrl: storeUrl,
        storeDescription: storeDescription,
        storeLogo: storeLogo,
        storeBanner: storeBanner,
      });
      */



    } else {
      toast.error('가맹점 코드 추가에 실패했습니다.');
    }





    return;
  }





    // get all agents
    const [fetchingAllAgents, setFetchingAllAgents] = useState(false);
    const [allAgents, setAllAgents] = useState([] as any[]);
    const fetchAllAgents = async () => {
        if (fetchingAllAgents) {
            return;
        }
        setFetchingAllAgents(true);
        const response = await fetch('/api/agent/getAllAgents', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                limit: 100,
                page: 1,
            }),
        });
        if (!response.ok) {
            setFetchingAllAgents(false);
            toast.error('에이전트 검색에 실패했습니다.');
            return;
        }
        const data = await response.json();
        //console.log('getAllAgents data', data);
        setAllAgents(data.result.agents);
        //setTotalCount(data.result.totalCount);
        setFetchingAllAgents(false);
        return data.result.agents;
    }
    useEffect(() => {
        if (!address) {
            setAllAgents([]);
            return;
        }
        fetchAllAgents();
    } , [address, params.storecode]);
  


  


  // check table view or card view
  const [tableView, setTableView] = useState(true);




  const [tradeSummary, setTradeSummary] = useState({
      totalCount: 0,
      totalKrwAmount: 0,
      totalUsdtAmount: 0,
      totalSettlementCount: 0,
      totalSettlementAmount: 0,
      totalSettlementAmountKRW: 0,
      totalFeeAmount: 0,
      totalFeeAmountKRW: 0,
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
          /*
          storecode: params.storecode,
          walletAddress: address,
          searchMyOrders: searchMyOrders,
          searchOrderStatusCompleted: true,
          //searchBuyer: searchBuyer,
          //searchDepositName: searchDepositName,

          //searchStoreBankAccountNumber: searchStoreBankAccountNumber,

          */

          agentcode: paramAgentcode,
          storecode: "",
          walletAddress: address,
          searchMyOrders: searchMyOrders,
          searchOrderStatusCompleted: true,
          
          //searchBuyer: searchBuyer,
          searchBuyer: '',
          //searchDepositName: searchDepositName,
          searchDepositName: '',
          //searchStoreBankAccountNumber: searchStoreBankAccountNumber,
          searchStoreBankAccountNumber: '',


          fromDate: searchFromDate,
          toDate: searchToDate,



        })
      });
      if (!response.ok) {
        setLoadingTradeSummary(false);
        toast.error('Failed to fetch trade summary');
        return;
      }
      const data = await response.json();
      
      ///console.log('getTradeSummary data', data);


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


    } , [address, searchMyOrders, paramAgentcode,
        searchFromDate, searchToDate,
    ]);


    



    //const [loadingWalletBalance, setLoadingWalletBalance] = useState(false);
    const [walletBalanceArray, setWalletBalanceArray] = useState([] as any[]);
    // initialize walletBalanceArray with allStore
    useEffect(() => {
      if (allStore && allStore.length > 0) {
        const initialBalances = allStore.map(store => ({
          storecode: store.storecode,
          walletAddress: store.settlementWalletAddress,
          balance: 0,
        }));
        setWalletBalanceArray(initialBalances);
      }
    }, [allStore]);


    const getWalletBalance = async (
      walletAddress: string,
    ) => {
      
      if (!walletAddress) {
        return 0;
      }

      try {
        const balance = await balanceOf({
          contract,
          address: walletAddress,
        });

        return Number(balance) / 10 ** 6; // Convert to USDT
      } catch (error) {
        console.error('Error fetching wallet balance:', error);
        return 0;
      }
    }

    const updateWalletBalances = async () => {

        if (!allStore || allStore.length === 0) {
          console.log('No stores available to fetch balances');
          return;
        }

        const updatedBalances = await Promise.all(
          allStore.map(async (store) => {
            const balance = await getWalletBalance(store.settlementWalletAddress);

            console.log(`Store: ${store.storecode}, Wallet: ${store.settlementWalletAddress}, Balance: ${balance}`);

            return {
              storecode: store.storecode,
              walletAddress: store.settlementWalletAddress,
              balance,
            };
          })
        );

        setWalletBalanceArray(updatedBalances);
    };


    useEffect(() => {
      updateWalletBalances();
      // Fetch wallet balances every 10 seconds
      const interval = setInterval(() => {
        updateWalletBalances();
      }, 10000);
      return () => clearInterval(interval);
    }, [allStore]);

    console.log('walletBalanceArray', walletBalanceArray);

   


    /*
    // usdtBalance array
    // balanceOf USDT contract for the store's settlement wallet address
    ///const [usdtBalanceArray, setUsdtBalanceArray] = useState([] as any[]);
    const [loadingUsdtBalance, setLoadingUsdtBalance] = useState(false);

    const getUsdtBalanceArray = async () => {

      console.log('getUsdtBalanceArray address', address);



      //if (!address || !allStore || allStore.length === 0) {
      //  return;
      //}

      if (!allStore || allStore.length === 0) {
        console.log('allStore is empty');
        return;
      }

      setLoadingUsdtBalance(true);

      for ( let i = 0; i < allStore.length; i++) {

        console.log('allStore[i]', allStore[i]);



        if (!allStore[i]?.settlementWalletAddress) {
          continue;
        }



   
        const usdtBalance = await balanceOf({
          contract,
          address: allStore[i].settlementWalletAddress,
        });


        console.log('allStore[i].settlementWalletAddress', allStore[i].settlementWalletAddress, 'usdtBalance', usdtBalance);

        setAllStore((prev) => {
          const newStore = [...prev];
          newStore[i] = {
            ...newStore[i],
            usdtBalance: Number(usdtBalance) / 10 ** 6,
          };
          return newStore;
        });


      }

      /////setUsdtBalanceArray(usdtBalanceArray);

      setLoadingUsdtBalance(false);

    }

    useEffect(() => {
      getUsdtBalanceArray();
      // fetch usdt balance every 10 seconds
      const interval = setInterval(() => {
        getUsdtBalanceArray();
      }, 10000);
      return () => clearInterval(interval);
    }, []);



    console.log('allStore', allStore);
    */
  


  //  getBalanceOfStoreSettlementWalletAddress
  const getBalanceOfStoreSettlementWalletAddress = async (storecode: string) => {
    if (!storecode) {
      return 0;
    }

    const store = allStore.find(s => s.storecode === storecode);
    if (!store || !store.settlementWalletAddress) {
      return 0;
    }



    // get native balance of the store's settlement wallet address
    // getWalletBalance
    // getWalletBalance
    /*
    const result = await getWalletBalance({
      address: address,
      client: client,
      chain: arbitrum,
    });
    */





    const balance = await balanceOf({
      contract,
      address: store.settlementWalletAddress,
    });
    
    //return Number(balance) / 10 ** 6; // Convert to USDT

    setAllStore((prev) => {
      const newStore = [...prev];
      const index = newStore.findIndex(s => s.storecode === storecode);
      if (index !== -1) {
        newStore[index] = {
          ...newStore[index],
          usdtBalance: Number(balance) / 10 ** 6,
        };
      }
      return newStore;
    } );

    return Number(balance) / 10 ** 6; // Convert to USDT



  };


  // totalNumberOfBuyOrders
  const [loadingTotalNumberOfBuyOrders, setLoadingTotalNumberOfBuyOrders] = useState(false);
  const [totalNumberOfBuyOrders, setTotalNumberOfBuyOrders] = useState(0);
  useEffect(() => {
    if (!address) {
      setTotalNumberOfBuyOrders(0);
      return;
    }

    

    const fetchTotalBuyOrders = async () => {
      setLoadingTotalNumberOfBuyOrders(true);
      const response = await fetch('/api/order/getTotalNumberOfBuyOrders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
        }),
      });
      if (!response.ok) {
        console.error('Failed to fetch total number of buy orders');
        return;
      }
      const data = await response.json();
      //console.log('getTotalNumberOfBuyOrders data', data);
      setTotalNumberOfBuyOrders(data.result.totalCount);

      setLoadingTotalNumberOfBuyOrders(false);
    };
    
    fetchTotalBuyOrders();

    const interval = setInterval(() => {
      fetchTotalBuyOrders();
    }, 5000);
    return () => clearInterval(interval);

  }, [address]);

      
  
  useEffect(() => {
    if (totalNumberOfBuyOrders > 0 && loadingTotalNumberOfBuyOrders === false) {
      const audio = new Audio('/notification.wav'); 
      audio.play();
    }
  }, [totalNumberOfBuyOrders, loadingTotalNumberOfBuyOrders]);


  return (

    <main className="p-4 pb-10 min-h-[100vh] flex items-start justify-center container max-w-screen-2xl mx-auto">


      <div className="py-0 w-full">


        <div className="w-full flex flex-col xl:flex-row items-center justify-center gap-2 bg-black/10 p-2 rounded-lg mb-4">
            
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


          {!address && (
            <ConnectButton
              client={client}
              wallets={wallets}

              /*
              accountAbstraction={{
                chain: arbitrum,
                sponsorGas: true
              }}
              */
              
              theme={"light"}

              // button color is dark skyblue convert (49, 103, 180) to hex
              connectButton={{
                style: {
                  backgroundColor: "#3167b4", // dark skyblue

                  color: "#f3f4f6", // gray-300 
                  padding: "2px 2px",
                  borderRadius: "10px",
                  fontSize: "14px",
                  //width: "40px",
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









        <div className="mt-4 flex
        flex-col 
        items-start justify-center gap-2 w-full">



            {/* USDT 가격 binance market price */}
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





            <div className="w-full flex flex-row items-center justify-end gap-2">
               

              {loadingTotalNumberOfBuyOrders && (
                <Image
                  src="/loading.png"
                  alt="Loading"
                  width={20}
                  height={20}
                  className="w-6 h-6 animate-spin"
                />
              )}

              <div className="flex flex-row items-center justify-center gap-2
              bg-white/80
              p-2 rounded-lg shadow-md
              backdrop-blur-md
              ">
                <Image
                  src="/icon-buyorder.png"
                  alt="Buy Order"
                  width={35}
                  height={35}
                  className="w-6 h-6"
                />
                <p className="text-lg text-red-500 font-semibold">
                  {
                  totalNumberOfBuyOrders
                  } 건
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
                    <button
                      onClick={() => {
                        router.push('/' + params.lang + '/admin/buyorder');
                      }}
                      className="flex items-center justify-center gap-2
                      bg-[#3167b4] text-sm text-[#f3f4f6] px-4 py-2 rounded-lg hover:bg-[#3167b4]/80"
                    >
                      <span className="text-sm">
                        구매주문관리
                      </span>
                    </button>
                  </div>
                )}
              </div>
          
            </div>





            {/* 홈 / 가맹점관리 / 회원관리 / 구매주문관리 */}
            {/* memnu buttons same width left side */}
            <div className="grid grid-cols-3 xl:grid-cols-6 gap-2 items-center justify-start mb-4">

                <div className='flex w-32 items-center justify-center gap-2
                bg-yellow-500 text-[#3167b4] text-sm rounded-lg p-2'>
                  <Image
                    src="/icon-store.png"
                    alt="Store"
                    width={35}
                    height={35}
                    className="w-4 h-4"
                  />
                  <div className="text-sm font-semibold">
                    가맹점관리
                  </div>
                </div>

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

                <button
                    onClick={() => router.push('/' + params.lang + '/admin/buyorder')}
                    className="flex w-32 bg-[#3167b4] text-[#f3f4f6] text-sm rounded-lg p-2 items-center justify-center
                    hover:bg-[#3167b4]/80
                    hover:cursor-pointer
                    hover:scale-105
                    transition-transform duration-200 ease-in-out
                    ">
                    구매주문관리
                </button>

                <button
                    onClick={() => router.push('/' + params.lang + '/admin/trade-history')}
                    className="flex w-32 bg-[#3167b4] text-[#f3f4f6] text-sm rounded-lg p-2 items-center justify-center
                    hover:bg-[#3167b4]/80
                    hover:cursor-pointer
                    hover:scale-105
                    transition-transform duration-200 ease-in-out
                    ">
                    거래내역
                </button>


                <button
                    onClick={() => router.push('/' + params.lang + '/admin/clearance-history')}
                    className="flex w-32 bg-[#3167b4] text-[#f3f4f6] text-sm rounded-lg p-2 items-center justify-center
                    hover:bg-[#3167b4]/80
                    hover:cursor-pointer
                    hover:scale-105
                    transition-transform duration-200 ease-in-out
                    ">
                    청산내역
                </button>

            </div>



            <div className='flex flex-row items-center gap-2 justify-start w-full'>
                <Image
                  src="/icon-store.png"
                  alt="Store"
                  width={35}
                  height={35}
                  className="w-6 h-6"
                />

                <div className="text-xl font-semibold">
                  가맹점관리
                </div>

            </div>





            {/* trade summary */}

            <div className="flex flex-col xl:flex-row items-center justify-between gap-2
              w-full
              bg-zinc-100/50
              p-4 rounded-lg shadow-md
              ">

              <div className="w-full flex flex-row items-center justify-center gap-2">
                <div className="flex flex-col gap-2 items-center">
                  <div className="text-sm">총 거래수(건)</div>
                  <div className="text-xl font-semibold text-zinc-500">
                    {tradeSummary.totalCount?.toLocaleString()} 건
                  </div>
                </div>

                <div className="flex flex-col gap-2 items-center">
                  <div className="text-sm">총 거래금액(원)</div>
                  <div className="text-xl font-semibold text-zinc-500">
                    {tradeSummary.totalKrwAmount?.toLocaleString()} 원
                  </div>
                </div>

                <div className="flex flex-col gap-2 items-center">
                  <div className="text-sm">총 거래량(USDT)</div>
                  <div className="flex flex-row items-center gap-1">
                    <Image
                      src="/icon-tether.png"
                      alt="USDT"
                      width={20}
                      height={20}
                      className="w-5 h-5"
                    />
                    <div className="text-xl font-semibold text-zinc-500">
                      {tradeSummary.totalUsdtAmount?.toFixed(2).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>

              {/* divider */}
              <div className="hidden xl:block w-0.5 h-10 bg-zinc-300"></div>
              <div className="xl:hidden w-full h-0.5 bg-zinc-300"></div>

              <div className="w-full
                flex flex-row items-center justify-center gap-2">

                <div className="w-32 flex flex-col gap-2 items-center">
                  <div className="text-sm">총 정산수(건)</div>
                  <div className="text-xl font-semibold text-zinc-500">
                    {tradeSummary.totalSettlementCount?.toLocaleString()} 건
                  </div>
                </div>

                <div className="w-full flex flex-col gap-5 items-between justify-center">

                  <div className="w-full flex flex-row items-end justify-center gap-2">
                    <div className="w-full flex flex-col gap-2 items-end justify-center">
                      <div className="text-sm">총 정산금액(원)</div>
                      <div className="text-xl font-semibold text-zinc-500">
                        {tradeSummary.totalSettlementAmountKRW?.toLocaleString()} 원
                      </div>
                    </div>
                    <div className="w-full flex flex-col gap-2 items-end justify-center">
                      <div className="text-sm">총 정산량(USDT)</div>
                      <div className="flex flex-row items-center justify-center gap-1">
                        <Image
                          src="/icon-tether.png"
                          alt="Tether"
                          width={20}
                          height={20}
                          className="w-5 h-5"
                        />
                        <div className="text-xl font-semibold text-zinc-500">
                          {tradeSummary.totalSettlementAmount?.toFixed(2).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="w-full flex flex-row items-end justify-center gap-2">
                    <div className="w-full flex flex-col gap-2 items-end justify-center">
                      <div className="text-sm">총 수수료금액(원)</div>
                      <div className="text-xl font-semibold text-zinc-500">
                        {tradeSummary.totalFeeAmountKRW?.toLocaleString()} 원
                      </div>
                    </div>
                    <div className="w-full flex flex-col gap-2 items-end justify-center">
                      <div className="text-sm">총 수수료수량(USDT)</div>
                      <div className="flex flex-row items-center justify-center gap-1">
                        <Image
                          src="/icon-tether.png"
                          alt="Tether"
                          width={20}
                          height={20}
                          className="w-5 h-5"
                        />
                        <div className="text-xl font-semibold text-zinc-500">
                          {tradeSummary.totalFeeAmount?.toFixed(2).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>

                </div>

              </div>


              {/* divider */}
              <div className="hidden xl:block w-0.5 h-10 bg-zinc-300"></div>
              <div className="xl:hidden w-full h-0.5 bg-zinc-300"></div>

              <div className="w-full
                flex flex-row items-center justify-center gap-2">
                <div className="flex flex-col gap-2 items-center">
                  <div className="text-sm">총 청산수(건)</div>
                  <div className="text-xl font-semibold text-zinc-500">
                    {tradeSummary.totalClearanceCount?.toLocaleString()} 건
                  </div>
                </div>

                <div className="flex flex-col gap-2 items-center">
                  <div className="text-sm">총 청산금액(원)</div>
                  <div className="text-xl font-semibold text-zinc-500">
                    {tradeSummary.totalClearanceAmount?.toLocaleString()} 원
                  </div>
                </div>
                <div className="flex flex-col gap-2 items-center">
                  <div className="text-sm">총 청산수량(USDT)</div>

                  <div className="flex flex-row items-center gap-1">
                    <Image
                      src="/icon-tether.png"
                      alt="USDT"
                      width={20}
                      height={20}
                      className="w-5 h-5"
                    />
                    <div className="text-xl font-semibold text-zinc-500">
                      {tradeSummary.totalClearanceAmountUSDT?.toFixed(2).toLocaleString()}
                    </div>
                  </div>

                </div>
              </div>
              
            </div>





              <div className="w-full flex flex-row items-center justify-end gap-2">


                <div className="flex flex-col gap-2 items-center">
                  <div className="text-sm">검색수량</div>
                  <div className="flex flex-row items-center gap-2 text-lg font-semibold text-zinc-500">
                    {

                        totalCount || 0
                      
                    }
                  </div>
                </div>

                {/*
                <div className="flex flex-col gap-2 items-center">
                  <div className="text-sm">검색수량</div>
                  <div className="flex flex-row items-center gap-2">
                    {
 
                        searchCount || 0
                      
                    }
                  </div>
                </div>
                */}

              </div>

              <div className="w-full flex
                flex-col xl:flex-row items-center justify-between gap-5">

                {/* 가맹점 추가 input and button */}
                <div className="flex flex-col xl:flex-row items-center gap-2">


                  {/* select agent code */}
                  <select
                    disabled={!isAdmin || insertingStore}
                    value={agentcode}
                    onChange={(e) => {
                      
                      //setAgentcode(e.target.value);

                      router.push(
                        `/${params.lang}/admin/store?agentcode=${e.target.value}`
                      );

                    } }
                    className="w-48 p-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">
                      에이전트 전체
                    </option>
                    {allAgents.map((agent: any) => (
                      <option key={agent.agentcode} value={agent.agentcode}>
                        {agent.agentName} ({agent.agentcode})
                      </option>
                    ))}
                  </select>


                  <input
                    disabled={!isAdmin || insertingStore}
                    type="text"
                    value={storeCode}
                    onChange={(e) => {

                      setStoreCode(e.target.value)

                    } }
                    placeholder="가맹점 코드"
                    className="hidden w-full p-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    disabled={!isAdmin || insertingStore}
                    type="text"
                    value={storeName}
                    onChange={(e) => {

                      setStoreName(e.target.value)

                    } }
                    placeholder="가맹점 이름"
                    className="w-52 p-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  
                  <button
                    disabled={!isAdmin || insertingStore || fetchingAllStore}
                    onClick={() => {

                      // check if store code already exists
                      if (allStore.find((item) => item.storecode === storeCode)) {
                        toast.error('가맹점 코드가 이미 존재합니다.');
                        return;
                      }

                      // check if store name length is less than 2
                      if (storeName.length < 2) {
                        toast.error('가맹점 이름은 2자 이상이어야 합니다.');
                        return;
                      }
                      // check if store name length is less than 20
                      if (storeName.length > 10) {
                        toast.error('가맹점 이름은 10자 이하여야 합니다.');
                        return;
                      }

                      insertStore();
                    }}
                    className={`bg-[#3167b4] text-white px-4 py-2 rounded-lg w-full
                      ${!isAdmin
                      || insertingStore
                      || fetchingAllStore
                      ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {insertingStore ? '가맹점 추가 중...' : '가맹점 추가'}
                  </button>
                </div>



                {/* serach fromDate and toDate */}
                {/* DatePicker for fromDate and toDate */}
                <div className="flex flex-col xl:flex-row items-center gap-2">
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
                      onChange={(e) => setSearchFromDate(e.target.value)}
                      className="w-full p-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3167b4]"
                    />
                  </div>

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
                </div>



                {/* search bar */}
                {/* searchStore */}
                <div className="flex flex-col xl:flex-row items-center gap-2">
                  <input
                    disabled={!isAdmin || fetchingAllStore}
                    type="text"
                    value={searchStore}
                    onChange={(e) => setSearchStorecode(e.target.value)}
                    placeholder="가맹점 코드, 이름"
                    className="w-48 p-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3167b4]"
                  />

                  <button
                    onClick={() => {
                      setPageValue(1);
                      fetchAllStore();
                    }}
                    //className="bg-[#3167b4] text-white px-4 py-2 rounded-lg w-full"
                    className={`
                      w-32
                      bg-[#3167b4] text-white px-4 py-2 rounded-lg
                      ${!isAdmin || fetchingAllStore ? 'opacity-50 cursor-not-allowed' : ''}
                    `}
                    

                    disabled={!isAdmin || fetchingAllStore}
                  >
                    {fetchingAllStore ? '검색중...' : '검색'}
                  </button>

                </div>

              </div>



              {/*
              {"storecode":"teststorecode","storeName":"테스트상점","storeType":"test","storeUrl":"https://test.com","storeDescription":"설명입니다.","storeLogo":"https://test.com/logo.png","storeBanner":"https://test.com/banner.png"}
              */}

              {/* table view is horizontal scroll */}
              {tableView ? (

                <div className="w-full overflow-x-auto">

                  <table className="w-full table-auto border-collapse border border-zinc-800 rounded-md">

                    <thead
                      className="bg-zinc-800 text-white text-sm font-thin
                       w-full"
                      style={{
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                      }}
                    >
                      <tr>
                        <th className="p-2">
                          <div className="flex flex-col items-center justify-center gap-2">
                            <span className="text-center">
                              가맹점 이름
                            </span>
                            <span className="text-center">
                              가맹점 코드
                            </span>
                            <span className="text-center">
                              에이전트 이름
                            </span>
                          </div>
                        </th>

                        {/*
                        <th className="p-2">가맹점타입</th>
                        */}
                        <th className="p-2">
                          <div className="flex flex-col items-center justify-center gap-2">
                            <span className="text-center">
                              회원수(명)
                            </span>
                            <span className="text-center">
                              블랙회원수(명)
                            </span>
                          </div>
                        </th>
                        {/*
                        <th className="p-2">통장수</th>
                        */}




                        <th className="p-2">
                          <div className="flex flex-col items-center justify-center gap-2">
                            <span className="text-center">
                              회원<br />
                              홈페이지
                            </span>
                            <span className="text-center">
                              관리자<br/>
                              홈페이지
                            </span>
                          </div>
                        </th>


                        <th className="
                          p-2">
                          <div className="flex flex-col items-center justify-center gap-2">


                            <span className="text-center">
                              판매자 원화통장
                            </span>
                            <span className="text-center">
                              판매자 USDT통장
                            </span>

                            <span className="text-center">
                              관리자 USDT통장
                            </span>

                          </div>
                        </th>

                        <th className="p-2">
                          <div className="flex flex-col items-center justify-center gap-2">
                            <span className="text-center">
                              PG 수수료율(%)
                            </span>

                            <span className="text-center">
                              AG 수수료율(%)
                            </span>

                          </div>
                        </th>

                        <th className="p-2">
                          <div className="flex flex-col items-center justify-center gap-2">
                            <span className="text-center">
                              거래수(건)
                            </span>
                            <span className="text-center">
                              금액(원)
                            </span>
                            <span className="text-center">
                              수량(USDT)
                            </span>
                          </div>
                        </th>

                        <th className="p-2">
                          <div className="flex flex-col items-center justify-center gap-2">
                            <div className="flex flex-row items-center justify-center gap-2">
                              <span className="text-center">
                                정산수(건)
                              </span>
                            </div>

                            <div className="flex flex-row items-center justify-center gap-2">

                              <div className="flex flex-col items-center justify-center gap-2">
                                <span>금액(원)</span>
                                <span>수량(USDT)</span>
                              </div>
                              <div className="flex flex-col items-center justify-center gap-2">
                                <span>수수료금액(원)</span>
                                <span>수수료수량(USDT)</span>
                              </div>

                            </div>
                            
                          </div>
                        </th>



                        {/* 청산건수<br/>청산금액(원)<br/>청산수량(USDT) */}
                        <th className="p-2">

                          <div className="flex flex-col items-center justify-center gap-2">
                            <div className="flex flex-row items-center justify-center gap-2">   
                              <span className="text-center">
                                청산수(건)
                              </span>
                            </div>                       
                            <div className="flex flex-row items-center justify-center gap-2">
                              
                              <div className="flex flex-col items-center justify-center gap-2">
                                <span>금액(원)</span>
                                <span>수량(USDT)</span>
                              </div>

                              <div className="flex flex-col items-center justify-center gap-2">
                                <span>보유금액(원)</span>
                                <span>보유수량(USDT)</span>
                              </div>

                            </div>

                          </div>
                        </th>

                        {/* USDT통장 잔고 */}
                        <th className="p-2">
                          <div className="flex flex-col items-center justify-center gap-2">
                            <span className="text-center">
                              가맹점
                            </span>
                            <span className="text-center">
                              USDT통장
                            </span>
                            <span className="text-center">
                              USDT통장 잔고
                            </span>
                          </div>
                        </th>



                      </tr>
                    </thead>

                    {/* if my trading, then tr has differenc color */}
                    <tbody>

                      {allStore?.map((item, index) => (

                        
                        <tr key={index} className={`
                          ${
                            index % 2 === 0 ? 'bg-zinc-100' : 'bg-zinc-200'
                          }
                        `}>

                          <td className={`
                            p-2
                            ${item?.backgroundColor &&
                              "bg-" + item.backgroundColor + " "
                              
                            }`}>
  
                        

                            <div className=" h-56 
                              w-28
                              flex flex-col items-between justify-between gap-2">




                              <div className="w-full flex flex-col items-center justify-between gap-2"> 
                                
                                <div className="flex flex-col items-center justify-start gap-2">
                                  <Image
                                    src={item.storeLogo || '/icon-store.png'}
                                    alt="Store Logo"
                                    width={100}
                                    height={100}
                                    className="rounded-lg w-12 h-12 object-cover"

                                  />
                                  <div className="flex flex-col items-start justify-center gap-1">
                                    <span className="text-sm font-bold text-gray-700">
                                      {item.storeName.length > 8 ? item.storeName.slice(0, 8) + '...' : item.storeName}
                                    </span>
                                    <button
                                      onClick={() => {
                                        navigator.clipboard.writeText(item.storecode);
                                        toast.success('가맹점 코드가 복사되었습니다.');
                                      }}
                                      className="text-sm text-gray-500 hover:text-blue-500
                                      hover:underline"
                                    >
                                      {item.storecode}
                                    </button>

                                    <span className="text-sm text-gray-500">
                                      {item?.agentName?.slice(0, 5) || '에이전트 없음'}
                                    </span>

                                  </div>
                                </div>



                              </div>

                              <div className="mb-2
                                w-full
                                flex flex-row items-between justify-between gap-2">
                                {/* settings button */}
                                <button
                                  disabled={!isAdmin || insertingStore}
                                  onClick={() => {
                                    router.push(
                                      '/' + params.lang + '/admin/store/' + item.storecode + '/settings'
                                    );
                                  }}
                                  className={`
                                    ${!isAdmin || insertingStore ? 'opacity-50 cursor-not-allowed' : ''}
                                    w-full
                                    bg-[#3167b4] text-sm text-white px-2 py-1 rounded-lg
                                    hover:bg-[#3167b4]/80
                                  `}
                                >
                                  설정하기
                                </button>
                                {/*
                                <button
                                  onClick={() => {
                                    router.push(
                                      '/' + params.lang + '/admin/store/' + item.storecode + '/memo'
                                    );
                                  }}
                                  className="bg-[#3167b4] text-sm text-white px-2 py-1 rounded-lg
                                  hover:bg-[#3167b4]/80"
                                >
                                  메모하기
                                </button>
                                */}
                                

                              </div>


                            </div>
                            
                          </td>
                          {/*
                          <td className="p-2">
                            {item.storeType}
                          </td>
                          */}
                          <td className="
                            p-2
                            ">
 
                            <div className=" h-56
                              w-24
                              flex flex-col items-between justify-between gap-2">


                              <div className="flex flex-col items-center justify-center gap-2">
                                <span className="text-lg text-gray-500">
                                  {
                                    item.totalBuyerCount ? item.totalBuyerCount : 0
                                  }{' '}명
                                </span>
                                <span className="text-lg text-red-500">
                                  {
                                    item.totalBlackBuyerCount ? item.totalBlackBuyerCount : 0
                                  }{' '}명
                                </span>
                              </div>
                              
                              <button
                                onClick={() => {
                                  router.push(
                                    '/' + params.lang + '/admin/member?storecode=' + item.storecode
                                  );
                                }}
                                className="w-full mb-2
                                bg-[#3167b4] text-sm text-white px-2 py-1 rounded-lg
                                hover:bg-[#3167b4]/80"
                              >
                                회원관리
                              </button>
                              

                            </div>
                          </td>
                          {/*
                          <td className="p-2">
                            <div className="flex flex-col items-center gap-2">
                              <span className="text-sm text-gray-500">
                                {
                                  item.totalBankAccountCount ? item.totalBankAccountCount : 0
                                }{' '}개
                              </span>
                              <button
                                onClick={() => {
                                  router.push(
                                    '/' + params.lang + '/admin/store/' + item.storecode + '/bank'
                                  );
                                }}
                                className="bg-[#3167b4] text-sm text-white px-2 py-1 rounded-lg
                                hover:bg-[#3167b4]/80"
                              >
                                통장관리
                              </button>
                            </div>
                          </td>
                          */}




                          <td className="p-2">

                            <div className="h-56
                              w-16 
                              flex flex-col items-between justify-between gap-2">

                              <div className="flex flex-col items-center gap-2">
                                {/*
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(
                                      '/' + params.lang + '/' + item.storecode
                                    );
                                    toast.success('복사되었습니다');
                                  }
                                }
                                className="text-sm text-blue-500 hover:underline"
                                >
                                  회원 복사
                                </button>
                                */}
                                <a
                                  href={
                                    '/' + params.lang + '/' + item.storecode + '/paymaster'
                                  }
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm text-blue-500 hover:underline"
                                >
                                  회원
                                </a>
                                {/*
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(
                                      '/' + params.lang + '/' + item.storecode + '/center'
                                    );
                                    toast.success('복사되었습니다');
                                  }
                                }
                                className="text-sm text-blue-500 hover:underline"
                                >
                                  관리자 복사
                                </button>
                                */}
                                <a
                                  href={
                                    '/' + params.lang + '/' + item.storecode + '/center'
                                  }
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm text-blue-500 hover:underline"
                                >
                                  관리자
                                </a>

                              </div>

                            </div>

                          </td>

                          <td className="
                            p-2">
                            <div className="h-56
                              w-28
                              flex flex-col items-between justify-between gap-2">
                              
                              <div className="flex flex-col items-center gap-2">


                                
                                {/* 판매자 통장 */}
                                {item?.bankInfo ? (
                                  <div className="flex flex-col xl:flex-row items-center gap-2">
                                  {
                                    item?.bankInfo?.bankName
                                  }
                                  {' '}
                                  {
                                    item?.bankInfo?.accountHolder
                                  }
                                  </div>
                                ) : (
                                  <div className="flex flex-col xl:flex-row items-center gap-2">
                                    <span className="text-sm text-red-500">
                                      통장정보 없음
                                    </span>
                                    {/*
                                    <button
                                      onClick={() => {
                                        router.push(
                                          '/' + params.lang + '/admin/store/' + item.storecode + '/settings'
                                        );
                                      }
                                      }
                                      className="bg-[#3167b4] text-sm text-white px-2 py-1 rounded-lg
                                      hover:bg-[#3167b4]/80"
                                    >
                                      통장관리
                                    </button>
                                    */}

                                  </div>
                                )}
                                
                                
                                <div className="flex flex-col xl:flex-row items-center gap-2">
                                {
                                  item?.sellerWalletAddress ? (
                                    <button
                                      onClick={() => {
                                        navigator.clipboard.writeText(
                                          item.sellerWalletAddress
                                        );
                                        toast.success('복사되었습니다');
                                      }
                                    }
                                    className="text-sm text-blue-500 hover:underline"
                                    >
                                      {item.sellerWalletAddress.substring(0, 6) + '...' + item.sellerWalletAddress.substring(item.sellerWalletAddress.length - 4)
                                      }
                                    </button>
                                  ) : (
                                    <span className="text-sm text-red-500">
                                      판매자 USDT통장 없음
                                    </span>
                                  )
                                }
                                </div>


                                <div className="flex flex-col xl:flex-row items-center gap-2">
                                {
                                  item?.adminWalletAddress ? (
                                    <button
                                      onClick={() => {
                                        navigator.clipboard.writeText(
                                          item.adminWalletAddress
                                        );
                                        toast.success('복사되었습니다');
                                      }
                                    }
                                    className="text-sm text-blue-500 hover:underline"
                                    >
                                      {item.adminWalletAddress.substring(0, 6) + '...' + item.adminWalletAddress.substring(item.adminWalletAddress.length - 4)
                                      }
                                    </button>
                                  ) : (
                                    <span className="text-sm text-red-500">
                                      관리자 USDT통장 없음
                                    </span>
                                  )
                                }
                                </div>




                              </div>


                            </div>

                          </td>



                          <td className="p-2">
                            <div className="h-56
                              w-32
                              flex flex-col items-between justify-between gap-2">


                              <div className="flex flex-col items-center gap-2">
      
                                <div className="flex flex-row items-center gap-2">

                                  {item.settlementFeeWalletAddress ? (

                                    <div className="flex flex-row items-center gap-2">
                                      <button
                                        onClick={() => {
                                          navigator.clipboard.writeText(
                                            item.settlementFeeWalletAddress
                                          );
                                          toast.success('복사되었습니다');
                                        }
                                      }
                                      className="text-sm text-blue-500 hover:underline"
                                      >
                                        {item.settlementFeeWalletAddress.substring(0, 6) + '...'
                                        }
                                      </button>

                                      <span className="text-sm text-gray-500 font-semibold">
                                        {
                                          item.settlementFeePercent ? item.settlementFeePercent : 0.00
                                        }%
                                      </span>


                                    </div>

                                  ) : (
                                    <span className="text-sm text-red-500">
                                      가맹점 수수료 USDT통장 없음
                                    </span>
                                  )}
                                </div>

                                <div className="flex flex-row items-center gap-2">

                                  {item.agentFeeWalletAddress ? (
                                    <button
                                      onClick={() => {
                                        navigator.clipboard.writeText(
                                          item.agentFeeWalletAddress
                                        );
                                        toast.success('복사되었습니다');
                                      }
                                    }
                                    // underline text
                                    className="text-sm text-blue-500 hover:underline"
                                    >
                                      {item.agentFeeWalletAddress?.substring(0, 6) + '...'
                                      }
                                    </button>
                                  ) : (
                                    <span className="text-sm text-red-500">
                                      에이전트 USDT통장 없음
                                    </span>
                                  )}

                                  {' '}
                                  <span className="text-sm text-gray-500 font-semibold">
                                    {
                                      item.agentFeePercent ? item.agentFeePercent : 0.00
                                    }%
                                  </span>
                                </div>

                              </div>

                              
                            </div>
                          </td>





                          <td className="p-2">
                            <div className=" h-56
                              w-36
                              flex flex-col items-between justify-between gap-2
                              ">


                                <div className="w-full flex flex-col items-center justify-center gap-2">

                                  <div className="w-full flex flex-row items-center justify-center gap-2
                                  border-b border-gray-300 pb-2">
                                    <span className="text-sm text-gray-500">
                                      {
                                        item.totalPaymentConfirmedCount ? item.totalPaymentConfirmedCount : 0
                                      }{' '}건
                                    </span>
                                  </div>

                                  <div className="flex flex-col items-end gap-2">

                                    <span className="text-sm text-yellow-600"
                                      style={{ fontFamily: 'monospace' }}
                                    >
                                      {
                                        Number(item.totalKrwAmount ? item.totalKrwAmount.toFixed(0) : 0)
                                        ?.toLocaleString('ko-KR')
                                      }{' '}원
                                    </span>
                                    <div className="flex flex-row items-center gap-2">
                                      <Image
                                        src="/icon-tether.png"
                                        alt="Tether"
                                        width={20}
                                        height={20}
                                        className="w-5 h-5"
                                      />
                                      <span className="text-sm text-green-600"
                                        style={{ fontFamily: 'monospace' }}
                                      >
                                        {
                                          (item.totalUsdtAmount ? item.totalUsdtAmount : 0)
                                          .toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                                        }
                                      </span>
                                    </div>

                                  </div>

                                </div>

                                {/* 구매주문관리 버튼 */}
                                <button
                                  onClick={() => {
                                    router.push(
                                      '/' + params.lang + '/admin/trade-history?storecode=' + item.storecode
                                    );
                                  }}
                                  className="mb-2
                                  w-full
                                  bg-[#3167b4] text-sm text-white px-2 py-1 rounded-lg
                                  hover:bg-[#3167b4]/80"
                                >
                                  구매내역
                                </button>

                            </div>
                             

                          </td>




                          <td className="p-2">
                            <div className=" h-56
                              w-64
                              flex flex-col items-between justify-between gap-2">


                              <div className="w-full flex flex-col items-center justify-center gap-2">


                                <div className="w-full flex flex-row items-center justify-center gap-2
                                border-b border-gray-300 pb-2">
                                  <span className="text-sm text-gray-500">
                                    {
                                      item.totalSettlementCount ? item.totalSettlementCount : 0
                                    }{' '}건
                                  </span>

                                </div>

                                <div className="w-full flex flex-row items-start justify-center gap-2">

                                  <div className="w-full flex flex-col items-end gap-2">
                                    <span className="text-sm text-yellow-600"
                                      style={{ fontFamily: 'monospace' }}
                                    >
                                      {
                                        Number(item.totalSettlementAmountKRW ? item.totalSettlementAmountKRW.toFixed(0) : 0)
                                          ?.toLocaleString('ko-KR')
                                      }{' '}원
                                    </span>
                                    <div className="flex flex-row items-center gap-2">
                                      <Image
                                        src="/icon-tether.png"
                                        alt="Tether"
                                        width={20}
                                        height={20}
                                        className="w-5 h-5"
                                      />
                                      <span className="text-sm text-green-600"
                                        style={{ fontFamily: 'monospace' }}
                                      >
                                        {
                                          (item.totalSettlementAmount ? item.totalSettlementAmount : 0)
                                          .toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                                        }
                                      </span>
                                    </div>
                                  </div>


                                  <div className="w-full flex flex-col items-end gap-2">

                                    <span className="text-sm text-yellow-600"
                                      style={{ fontFamily: 'monospace' }}
                                    >
                                      {
                                        Number(item.totalFeeAmountKRW ? item.totalFeeAmountKRW.toFixed(0) : 0)
                                          ?.toLocaleString('ko-KR')
                                      }{' '}원
                                    </span>
                                    <div className="flex flex-row items-center gap-2">
                                      <Image
                                        src="/icon-tether.png"
                                        alt="Tether"
                                        width={20}
                                        height={20}
                                        className="w-5 h-5"
                                      />
                                      <span className="text-sm text-green-600"
                                        style={{ fontFamily: 'monospace' }}
                                      >
                                        {
                                          (item.totalFeeAmount ? item.totalFeeAmount : 0)
                                          .toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                                        }
                                      </span>
                                    </div>

                                    <span className="text-sm text-yellow-600"
                                      style={{ fontFamily: 'monospace' }}
                                    >
                                      {
                                        Number(item.totalAgentFeeAmountKRW ? item.totalAgentFeeAmountKRW.toFixed(0) : 0)
                                          ?.toLocaleString('ko-KR')
                                      }{' '}원
                                    </span>
                                    <div className="flex flex-row items-center gap-2">
                                      <Image
                                        src="/icon-tether.png"
                                        alt="Tether"
                                        width={20}
                                        height={20}
                                        className="w-5 h-5"
                                      />
                                      <span className="text-sm text-green-600"
                                        style={{ fontFamily: 'monospace' }}
                                      >
                                        {
                                          (item.totalAgentFeeAmount ? item.totalAgentFeeAmount : 0)
                                          .toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                                        }
                                      </span>
                                    </div>



                                  </div>


                                </div>


                              </div>

                              
                              <div className="w-full flex flex-col xl:flex-row items-center gap-2">

                                <button
                                  onClick={() => {
                                    alert('준비중입니다.');
                                  }}
                                  className="mb-2
                                  w-full
                                  bg-[#3167b4] text-sm text-white px-2 py-1 rounded-lg
                                  hover:bg-[#3167b4]/80"
                                >
                                  정산내역
                                </button>


                              </div>
                              


                            </div>

                          </td>



                          <td className="p-2">

                            <div className="w-72 h-56
                            flex flex-col items-between justify-between gap-2">


                              <div className="w-full flex flex-col items-center justify-center gap-2">


                                <div className="w-full flex flex-row items-center justify-center gap-2
                                border-b border-gray-300 pb-2">
                                  <span className="text-sm text-gray-500">
                                    {
                                      item.totalPaymentConfirmedClearanceCount ? item.totalPaymentConfirmedClearanceCount : 0
                                    }{' '}건
                                  </span>
                        
                                </div>

                                <div className="w-full flex flex-row items-center justify-center gap-2">


                                  <div className="w-full flex flex-col items-end justify-center gap-2">
                        
                                    <span className="text-sm text-yellow-600"
                                      style={{ fontFamily: 'monospace' }}
                                    >
                                      {
                                        Number(item.totalKrwAmountClearance ? item.totalKrwAmountClearance : 0)
                                          .toLocaleString('ko-KR')
                                      }{' '}원
                                    </span>
                                    <div className="flex flex-row items-center gap-2">
                                      <Image
                                        src="/icon-tether.png"
                                        alt="Tether"
                                        width={20}
                                        height={20}
                                        className="w-5 h-5"
                                      />
                                      <span className="text-sm text-green-600"
                                        style={{ fontFamily: 'monospace' }}
                                      >
                                        {
                                          (item.totalUsdtAmountClearance ? item.totalUsdtAmountClearance : 0)
                                          .toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                                        }
                                      </span>
                                    </div>

                                  </div>


                                  <div className="w-full flex flex-col items-end justify-center gap-2">

                                      <span className="text-sm text-yellow-600"
                                        style={{ fontFamily: 'monospace' }}
                                      >
                                        {
                                          //Number(item.totalKrwAmountClearanceBalance ? item.totalKrwAmountClearanceBalance : 0)
                                          //  ?.toLocaleString('ko-KR')

                                          //Number(item?.totalSettlementAmountKRW - item?.totalKrwAmountClearance || 0)

                                          // if minus is negative, show 0
                                          Number(item?.totalKrwAmountClearance - item?.totalSettlementAmountKRW || 0)
                                          < 0 ? 0 :

                                          Number(item?.totalKrwAmountClearance - item?.totalSettlementAmountKRW || 0)
                                          .toLocaleString('ko-KR')


                                        }{' '}원
                                      </span>
                                      <div className="flex flex-row items-center gap-2">
                                        <Image
                                          src="/icon-tether.png"
                                          alt="Tether"
                                          width={20}
                                          height={20}
                                          className="w-5 h-5"
                                        />
                                        <span className="text-sm text-green-600"
                                          style={{ fontFamily: 'monospace' }}
                                        >
                                          {
                                            //////(item.totalUsdtAmountClearanceBalance ? item.totalUsdtAmountClearanceBalance : 0)?.toLocaleString('us-US')
                                          

                                            //Number(item?.totalSettlementAmount - item?.totalUsdtAmountClearance || 0)
                                            // if minus is negative, show 0
                                            Number(item?.totalUsdtAmountClearance - item?.totalSettlementAmount || 0)
                                            < 0 ? 0 :
                                            Number(item?.totalUsdtAmountClearance - item?.totalSettlementAmount || 0)
                                            .toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')

                                          }
                                        </span>
                                      </div>

                                  </div>


                                </div>

                              </div>

                              {/* 청산하기 button */}
                              
                              <button
                                disabled={!isAdmin || insertingStore}
                                onClick={() => {
                                  router.push(
                                    '/' + params.lang + '/admin/store/' + item.storecode + '/clearance'
                                  );
                                }
                                }
                                className={`
                                  ${!isAdmin || insertingStore ? 'opacity-50 cursor-not-allowed' : ''}
                                  w-full mb-2
                                  bg-[#3167b4] text-sm text-white px-2 py-1 rounded-lg
                                  hover:bg-[#3167b4]/80
                                `}
                              >
                                청산관리
                              </button>



                            </div>


                          </td>

                          {/* USDT 잔액 */}
                          <td className="p-2">
                            <div className="w-32
                              h-56
                              flex flex-col items-between justify-between gap-2">


                              <div className="w-full flex flex-col items-center justify-center gap-2">

                                {/* settlementWalletAddress */}
                                <span className="text-sm text-gray-500">
                                  {item.settlementWalletAddress ? (
                                    <button
                                      onClick={() => {
                                        navigator.clipboard.writeText(
                                          item.settlementWalletAddress
                                        );
                                        toast.success('정산 지갑 주소가 복사되었습니다.');
                                      }}
                                      className="text-sm text-blue-500 hover:underline"
                                    >
                                      { item.settlementWalletAddress.substring(0, 6) + '...' + item.settlementWalletAddress.substring(item.settlementWalletAddress.length - 4)
                                      }
                                    </button>
                                  ) : (
                                    <span className="text-sm text-red-500">
                                      정산 지갑 주소 없음
                                    </span>
                                  )}
                                </span>

                                {/* USDT 잔액 표시 */}
                                <span className="text-lg text-green-600"
                                  style={{ fontFamily: 'monospace' }}
                                >
                                  {item?.usdtBalance ? item?.usdtBalance.toFixed(2).toLocaleString('us-US') : 0}{' '}USDT
                                </span>

                                <span className="text-lg text-green-600"
                                  style={{ fontFamily: 'monospace' }}
                                >
                                  {item?.nativeBalance ? item?.nativeBalance.toFixed(2).toLocaleString('us-US') : 0}{' '}ETH
                                </span>
                              
                              </div>


                              {/* button to getBalance of USDT */}
                              <button
                                //disabled={!isAdmin || insertingStore}
                                onClick={() => {
                                  //if (!isAdmin || insertingStore) return;
                                  //getBalance(item.storecode);

                                  getBalanceOfStoreSettlementWalletAddress(item.storecode);
          

                                  toast.success('잔액을 가져왔습니다.');
                                }}
                                className={`
                                  ${!isAdmin || insertingStore ? 'opacity-50 cursor-not-allowed' : ''}
                                  w-full mb-2
                                  bg-[#3167b4] text-sm text-white px-2 py-1 rounded-lg
                                  hover:bg-[#3167b4]/80
                                `}
                              >
                                잔액 확인하기
                              </button>

                            </div>
                          </td>


                        </tr>

                      ))}

                    </tbody>

                  </table>

                </div>


              ) : (

                <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

                  {allStore?.map((item, index) => (
                    <div key={index} className="bg-white shadow-md rounded-lg p-4">
                      <h2 className="text-lg font-semibold">{item.storeName}</h2>
                      <p className="text-sm text-gray-500">{item.storeDescription}</p>
                    </div>
                  ))}

                </div>

              )}



          </div>

      

          {/* pagination */}
          {/* url query string */}
          {/* 1 2 3 4 5 6 7 8 9 10 */}
          {/* ?limit=10&page=1 */}
          {/* submit button */}
          {/* totalPage = Math.ceil(totalCount / limit) */}
          <div className="mt-4 flex flex-row items-center justify-center gap-4">


            <div className="flex flex-row items-center gap-2">
                <select
                  value={limit}
                  onChange={(e) =>
                    
                    router.push(`/${params.lang}/admin/store?limit=${Number(e.target.value)}&page=${page}`)

                  }

                  className="text-sm bg-zinc-800 text-zinc-200 px-2 py-1 rounded-md"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>

            {/* 처음 페이지로 이동 */}
            <button
              disabled={Number(page) <= 1}
              className={`text-sm text-white px-4 py-2 rounded-md ${Number(page) <= 1 ? 'bg-gray-500' : 'bg-green-500 hover:bg-green-600'}`}
              onClick={() => {
                
                router.push(`/${params.lang}/admin/store?limit=${Number(limit)}&page=1`);

              }
            }
            >
              처음
            </button>

            <button
              disabled={Number(page) <= 1}
              className={`text-sm text-white px-4 py-2 rounded-md ${Number(page) <= 1 ? 'bg-gray-500' : 'bg-green-500 hover:bg-green-600'}`}
              onClick={() => {
                
                router.push(`/${params.lang}/admin/store?limit=${Number(limit)}&page=${Number(page) - 1}`);

              }}
            >
              이전
            </button>


            <span className="text-sm text-zinc-500">
              {page} / {Math.ceil(Number(totalCount) / Number(limit))}
            </span>


            <button
              disabled={Number(page) >= Math.ceil(Number(totalCount) / Number(limit))}
              className={`text-sm text-white px-4 py-2 rounded-md ${Number(page) >= Math.ceil(Number(totalCount) / Number(limit)) ? 'bg-gray-500' : 'bg-green-500 hover:bg-green-600'}`}
              onClick={() => {
                
                router.push(`/${params.lang}/admin/store?limit=${Number(limit)}&page=${Number(page) + 1}`);

              }}
            >
              다음
            </button>

            {/* 마지막 페이지로 이동 */}
            <button
              disabled={Number(page) >= Math.ceil(Number(totalCount) / Number(limit))}
              className={`text-sm text-white px-4 py-2 rounded-md ${Number(page) >= Math.ceil(Number(totalCount) / Number(limit)) ? 'bg-gray-500' : 'bg-green-500 hover:bg-green-600'}`}
              onClick={() => {
                
                router.push(`/${params.lang}/admin/store?limit=${Number(limit)}&page=${Math.ceil(Number(totalCount) / Number(limit))}`);

              }
            }
            >
              마지막
            </button>

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



