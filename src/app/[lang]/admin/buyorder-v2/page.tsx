'use client';

import { useState, useEffect, use, act, useRef } from "react";

import Image from "next/image";



// open modal

///import Modal from '@/components/modal';

import ModalUser from '@/components/modal-user';

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

  const searchParams = useSearchParams();
 
  

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
  function updateLastestBalanceArray(index: number, value: number) {
    setLastestBalanceArray((prevValues) => {
      const newValues = [...prevValues];
      newValues[index] = value;
      return newValues;
    });
  }
  useEffect(() => {
    buyOrderStats.totalBySellerBankAccountNumber.forEach((item, index) => {
      const targetValue = item.bankUserInfo && item.bankUserInfo.length > 0 && item.bankUserInfo[0].balance ? item.bankUserInfo[0].balance : 0;
      const duration = 1000; // animation duration in ms
      const startValue = lastestBalanceArray[index] || 0;
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
  }, [buyOrderStats.totalBySellerBankAccountNumber]);







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
                setBuyOrders(data.result.orders);

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
              setBuyOrders(data.result.orders);

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
            setBuyOrders(data.result.orders);

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
                setBuyOrders(data.result.orders);
    
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
              setBuyOrders(data.result.orders);
  
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
              setBuyOrders(data.result.orders);
  
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

          setBuyOrders(
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

          setBuyOrders(
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
            setBuyOrders(data.result.orders);

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


      setBuyOrders(data.result.orders);

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

  setBuyOrders(data.result.orders);
  //setTotalCount(data.result.totalCount);
  setFetchingBuyOrders(false);

  return data.result.orders;
}






  // check table view or card view
  const [tableView, setTableView] = useState(true);


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
      <main className="p-4 pb-10 min-h-[100vh] flex items-start justify-center container max-w-screen-2xl mx-auto font-light">
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

        <h1 className="text-2xl font-normal">접근권한을 확인중입니다...</h1>
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

    <main className="p-4 pb-10 min-h-[100vh] flex items-start justify-center container max-w-screen-2xl mx-auto font-light">

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
                    <span className="text-sm text-gray-800 font-normal">
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

              <p className="text-lg text-red-500 font-normal">
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
                    <span className="text-sm text-gray-800 font-normal">
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


              <p className="text-lg text-yellow-500 font-normal">
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
              <p className="text-lg text-green-500 font-normal">
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
              <p className="text-lg text-green-500 font-normal">
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
          


            <div className="grid grid-cols-3 xl:grid-cols-6 gap-2 items-center justify-start mb-6">


              <button
                  onClick={() => router.push('/' + params.lang + '/admin/store')}
                  className="flex w-32 border border-zinc-200 bg-white text-zinc-700 text-sm rounded-lg p-2 items-center justify-center hover:bg-zinc-50"
                  >
                  가맹점관리
              </button>

              <button
                  onClick={() => router.push('/' + params.lang + '/admin/agent')}
                  className="flex w-32 border border-zinc-200 bg-white text-zinc-700 text-sm rounded-lg p-2 items-center justify-center hover:bg-zinc-50"
                  >
                  에이전트관리
              </button>


              <button
                  onClick={() => router.push('/' + params.lang + '/admin/member')}
                  className="flex w-32 border border-zinc-200 bg-white text-zinc-700 text-sm rounded-lg p-2 items-center justify-center hover:bg-zinc-50"
                  >
                  회원관리
              </button>

              <div className='flex w-32 items-center justify-center gap-2 bg-zinc-900 text-white text-sm rounded-lg p-2'>
                <Image
                  src="/icon-buyorder.png"
                  alt="Trade"
                  width={35}
                  height={35}
                  className="w-4 h-4"
                />
                <div className="text-sm font-normal">
                  구매주문관리
                </div>
              </div>

              <button
                  onClick={() => router.push('/' + params.lang + '/admin/trade-history')}
                  className="flex w-32 border border-zinc-200 bg-white text-zinc-700 text-sm rounded-lg p-2 items-center justify-center hover:bg-zinc-50"
                  >
                  P2P 거래내역
              </button>

              {version !== 'bangbang' && (
                <button
                  onClick={() => router.push('/' + params.lang + '/admin/clearance-history')}
                  className="flex w-32 border border-zinc-200 bg-white text-zinc-700 text-sm rounded-lg p-2 items-center justify-center hover:bg-zinc-50"
                  >
                  청산관리
              </button>
              )}

              <button
                  onClick={() => router.push('/' + params.lang + '/admin/trade-history-daily')}
                  className="flex w-32 border border-zinc-200 bg-white text-zinc-700 text-sm rounded-lg p-2 items-center justify-center hover:bg-zinc-50"
                  >
                  P2P통계(가맹)
              </button>

              <button
                  onClick={() => router.push('/' + params.lang + '/admin/trade-history-daily-agent')}
                  className="flex w-32 border border-zinc-200 bg-white text-zinc-700 text-sm rounded-lg p-2 items-center justify-center hover:bg-zinc-50"
                  >
                  P2P통계(AG)
              </button>

              {version !== 'bangbang' && (
                <button
                    onClick={() => router.push('/' + params.lang + '/admin/escrow-history')}
                    className="flex w-32 border border-zinc-200 bg-white text-zinc-700 text-sm rounded-lg p-2 items-center justify-center hover:bg-zinc-50"
                  >
                  보유량내역
                </button>
              )}

          </div>




          


          <div className='flex flex-row items-center space-x-4 font-normal'>
              <Image
                src="/icon-buyorder.png"
                alt="Trade"
                width={35}
                height={35}
                className="w-6 h-6"
              />

              <div className="text-xl font-normal">
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
                    <span className="text-2xl xl:text-4xl font-normal text-[#409192]"
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
                      text-sm font-normal">
                      가맹점 선택
                    </span>


                    <select
                      value={searchStorecode}
                      
                      //onChange={(e) => setSearchStorecode(e.target.value)}

                      // storecode parameter is passed to fetchBuyOrders
                      onChange={(e) => {
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
              <div className="text-sm xl:text-xl font-normal">
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
                <span className="text-sm font-normal text-zinc-500">
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
              <div className="text-sm text-zinc-500 font-normal">
                입금통장정보가 없습니다. 입금통장정보가 없으면 판매가 불가능합니다.
              </div>
            </div>
          )}
          */}

          {/* trade summary */}


          <div className="w-full flex flex-col sm:flex-row items-start justify-between gap-2">

            {/* if animatedTotalUsdtAmount is changed, border pulse animation */}
            {/*
            <div className="xl:w-1/3 w-full
              flex flex-col sm:flex-row items-between justify-between gap-4
              border border-zinc-300 p-4 rounded-lg
            ">
            */}
            <div className={`xl:w-1/3 w-full
              flex flex-col sm:flex-row items-between justify-between gap-4
              ${buyOrderStats.totalUsdtAmount !== animatedTotalUsdtAmount ? 'border-2 border-green-400 animate-pulse p-4 rounded-lg' : 'border border-zinc-300 p-4 rounded-lg'}
            `}>

              <div className="flex flex-col gap-2 items-center">
                <Image
                  src="/icon-trade.png"
                  alt="P2P"
                  width={50}
                  height={50}
                  className={`w-12 h-12 rounded-lg object-cover
                    ${buyOrderStats.totalCount !== animatedTotalCount ? 'animate-spin' : ''}
                  `}
                />
                <div className="text-sm">P2P 거래수(건)</div>
                <div className="text-4xl font-normal text-zinc-500">
                  {
                  //buyOrderStats.totalCount?.toLocaleString()
                  animatedTotalCount.toLocaleString()
                  }
                </div>
              </div>

              <div className="flex flex-col items-end justify-center gap-2">

                <div className="flex flex-row items-center justify-center gap-1">
                  <Image
                    src="/icon-tether.png"
                    alt="Tether"
                    width={20}
                    height={20}
                    className="w-5 h-5"
                  />
                  {/* RGB: 64, 145, 146 */}
                  <span className="text-4xl font-normal text-[#409192]"
                    style={{ fontFamily: 'monospace' }}>
                    {
                    animatedTotalUsdtAmount
                      ? animatedTotalUsdtAmount.toFixed(3).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                      : '0.000'
                    }
                  </span>
                </div>

                <div className="flex flex-row items-center justify-center gap-1">
                  <span className="text-4xl font-normal text-yellow-600"
                    style={{ fontFamily: 'monospace' }}>
                    {
                    //buyOrderStats.totalKrwAmount?.toLocaleString()
                    animatedTotalKrwAmount.toLocaleString()
                    }
                  </span>
                </div>

              </div>

            </div>

            {/* divider */}
            <div className="hidden xl:block w-0.5 h-20 bg-zinc-300"></div>
            <div className="sm:hidden w-full h-0.5 bg-zinc-300"></div>

            {/*
            <div className="xl:w-2/3 w-full
              flex flex-col sm:flex-row items-start justify-end gap-4">
            */}
            <div className={`xl:w-2/3 w-full
              flex flex-col sm:flex-row items-start justify-end gap-4
              ${buyOrderStats.totalSettlementAmount !== animatedTotalSettlementAmount ? 'border-2 border-green-400 animate-pulse p-4 rounded-lg' : 'border border-zinc-300 p-4 rounded-lg'}
            `}>

              <div className="flex flex-col sm:flex-row items-start justify-start gap-2">

                <div className="flex flex-col gap-2 items-center">
                  <Image
                    src="/icon-payment2.png"
                    alt="Payment"
                    width={50}
                    height={50}
                    className={`w-12 h-12 rounded-lg object-cover
                      ${buyOrderStats.totalSettlementCount !== animatedTotalSettlementCount ? 'animate-spin' : ''}
                    `}
                  />   

                  <div className="text-sm">가맹점 결제수(건)</div>
                    <span className="text-4xl font-normal text-zinc-500">
                      {animatedTotalSettlementCount.toLocaleString()}
                    </span>
                </div>

                <div className="flex flex-col items-end justify-center gap-2">

                  <div className="flex flex-row items-center justify-center gap-1">
                    <Image
                      src="/icon-tether.png"
                      alt="Tether"
                      width={20}
                      height={20}
                      className="w-5 h-5"
                    />
                    <span className="text-4xl font-normal text-[#409192]"
                      style={{ fontFamily: 'monospace' }}>
                      {
                        animatedTotalSettlementAmount
                        ? animatedTotalSettlementAmount.toFixed(3).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                        : '0.000'}
                    </span>
                  </div>

                  <div className="flex flex-row items-center justify-center gap-1">
                    <span className="text-4xl font-normal text-yellow-600"
                      style={{ fontFamily: 'monospace' }}>
                      {animatedTotalSettlementAmountKRW.toLocaleString()}
                    </span>
                  </div>

                </div>

              </div>

              <div className="flex flex-col gap-2 items-center">

                <div className="flex flex-row gap-2 items-center
                  border-b border-zinc-300 pb-2">

                  <div className="flex flex-col gap-2 items-center">
                    <div className="text-sm">PG 수수료량(USDT)</div>
                    <div className="w-full flex flex-row items-center justify-end gap-1">
                      <Image
                        src="/icon-tether.png"
                        alt="Tether"
                        width={20}
                        height={20}
                        className="w-5 h-5"
                      />
                      <span className="text-lg font-normal text-[#409192]"
                        style={{ fontFamily: 'monospace' }}>
                        {buyOrderStats.totalFeeAmount
                          ? buyOrderStats.totalFeeAmount.toFixed(3).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                          : '0.000'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-2 items-center">
                    <div className="text-sm">PG 수수료금액(원)</div>
                    <div className="w-full flex flex-row items-center justify-end gap-1">
                      <span className="text-lg font-normal text-yellow-600"
                        style={{ fontFamily: 'monospace' }}>
                        {buyOrderStats.totalFeeAmountKRW
                          ? buyOrderStats.totalFeeAmountKRW.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                          : '0'}
                      </span>
                    </div>
                  </div>

                </div>


                <div className="flex flex-row gap-2 items-center">

                  <div className="flex flex-col gap-1 items-center">
                    <div className="text-sm">AG 수수료량(USDT)</div>
                    <div className="w-full flex flex-row items-center justify-end gap-1">
                      <Image
                        src="/icon-tether.png"
                        alt="Tether"
                        width={20}
                        height={20}
                        className="w-5 h-5"
                      />
                      <span className="text-lg font-normal text-[#409192]"
                        style={{ fontFamily: 'monospace' }}>
                        {buyOrderStats.totalAgentFeeAmount
                          ? buyOrderStats.totalAgentFeeAmount.toFixed(3).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                          : '0.000'}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1 items-center">
                    <div className="text-sm">AG 수수료금액(원)</div>
                    <div className="w-full flex flex-row items-center justify-end gap-1">
                      <span className="text-lg font-normal text-yellow-600"
                        style={{ fontFamily: 'monospace' }}>
                        {buyOrderStats.totalAgentFeeAmountKRW
                          ? buyOrderStats.totalAgentFeeAmountKRW.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                          : '0'}
                      </span>
                    </div>
                  </div>

                </div>

              </div>

            </div>

            
            {/* divider */}
            {/*}
            <div className="hidden xl:block w-0.5 h-10 bg-zinc-300"></div>
            <div className="sm:hidden w-full h-0.5 bg-zinc-300"></div>

            <div className="xl:w-1/4 flex flex-row items-center justify-center gap-2">
              <div className="flex flex-col gap-2 items-center">
                <div className="text-sm">총 청산수(건)</div>
                <div className="text-xl font-normal text-zinc-500">
                  {tradeSummary.totalClearanceCount?.toLocaleString()}
                </div>
              </div>

              <div className="flex flex-col gap-2 items-center">
                <div className="text-sm">총 청산금액(원)</div>
                <div className="text-xl font-normal text-zinc-500">
                  {tradeSummary.totalClearanceAmount?.toLocaleString()} 원
                </div>
              </div>
              <div className="flex flex-col gap-2 items-center">
                <div className="text-sm">총 청산수량(USDT)</div>
                <div className="text-xl font-normal text-zinc-500">
                  {tradeSummary.totalClearanceAmountUSDT?.toLocaleString()} USDT
                </div>
              </div>
            </div>
            */}
            
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
                    <span className="text-sm text-gray-800 font-normal">
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



              <p className="text-lg text-red-500 font-normal">
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

              <p className="text-lg text-yellow-500 font-normal">
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
                    className="text-xs font-normal underline text-blue-600"
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

              <div className="text-xl font-normal text-red-500
                flex items-center justify-center"
              >
                +{buyOrderStats.totalReaultGroupByBuyerDepositNameCount! - buyOrderStats.totalByBuyerDepositName!.length} 명
              </div>

            )}

          </div>
          */}


          {/* buyOrderStats.totalBySellerBankAccountNumber */}
          <div className="w-full
            grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-1
            items-start justify-start">

            
            {buyOrderStats.totalBySellerBankAccountNumber?.map((item, index) => (
              
              <div
                key={index}
                //className="flex flex-col gap-2 items-center
                //border border-zinc-300 rounded-lg p-2"
                // if lastestBalanceArray[index] is changed, then animate the background color
                // if sellerBankAccountDisplayValueArray[index] is changed, then animate the background color
                // two color is differentiate between the two conditions
                className={`flex flex-col gap-1 items-center
                p-2 rounded-lg shadow-md
                backdrop-blur-md
                ${lastestBalanceArray && lastestBalanceArray[index] !== undefined && lastestBalanceArray[index] !== item.bankUserInfo[0]?.balance
                  ? 'bg-green-100/80 animate-pulse'
                  : sellerBankAccountDisplayValueArray && sellerBankAccountDisplayValueArray[index] !== undefined && sellerBankAccountDisplayValueArray[index] !== item.totalKrwAmount
                    ? 'bg-yellow-100/80 animate-pulse'
                    : 'bg-white/80'}
                `}
                >

                <div className="flex flex-row items-start justify-start gap-1">
                  <Image
                    src="/icon-bank.png"
                    alt="Bank"
                    width={20}
                    height={20}
                    className="w-5 h-5"
                  />              
                  <button
                    className="text-sm text-zinc-500 underline font-normal"
                    onClick={() => {
                      const accountNumber = item._id || '기타은행';
                      navigator.clipboard.writeText(accountNumber)
                        .then(() => {
                          toast.success(`통장번호 ${accountNumber} 복사됨`);
                        })
                        .catch((err) => {
                          toast.error('복사 실패: ' + err);
                        });
                    }}
                    title="통장번호 복사"
                  >
                    {item._id || '기타은행'}
                  </button>

                  {/* accountHolder if exists */}
                  {item.bankUserInfo.length > 0 && (
                    <div className="flex flex-col">
                      <span className="text-sm text-zinc-500 font-normal">
                        {item.bankUserInfo[0].accountHolder || '알수없음'}
                      </span>
                    </div>
                  )}

                </div>

                <div className="flex flex-row items-center justify-center gap-1">
                  잔액(원):{' '}
                  {item.bankUserInfo.length > 0 && (
                    <span className="text-lg font-normal text-yellow-600"
                      style={{ fontFamily: 'monospace' }}
                    >
                      {
                        //item.bankUserInfo[0]?.balance ? item.bankUserInfo[0]?.balance.toLocaleString() : '잔액정보없음'
                        lastestBalanceArray && lastestBalanceArray[index] !== undefined
                        ? lastestBalanceArray[index].toLocaleString()
                        : '잔액정보없음'
                      }
                    </span>
                  )}
                </div>

                <div className="w-full flex flex-row items-center justify-between gap-1">
                  <span className="text-sm xl:text-lg font-normal text-zinc-500">
                    {item.totalCount?.toLocaleString() || '0'}
                  </span>
                  <span className="text-sm xl:text-lg font-normal text-yellow-600"
                    style={{ fontFamily: 'monospace' }}>
                    {
                      
                      //(item.totalKrwAmount || 0).toLocaleString()

                      sellerBankAccountDisplayValueArray && sellerBankAccountDisplayValueArray[index] !== undefined
                      && sellerBankAccountDisplayValueArray[index].toLocaleString()
                      
                    }
                  </span>
                </div>

              </div>
            ))}



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
                      <span className="text-sm font-normal">
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
                    <span className="text-2xl font-normal text-[#409192]"
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

          {/* table view is horizontal scroll */}
          {tableView ? (


            <div className="w-full overflow-x-auto">

              <table className="w-full table-auto border-collapse border border-zinc-200 rounded-md">

                <thead className="bg-zinc-50 text-zinc-600 text-sm font-normal border-b border-zinc-200">
                  <tr>

                    <th className="p-2 text-start">
                      <div className="flex flex-col items-start justify-center gap-2">
                        <span className="text-sm text-zinc-600 font-normal">
                          가맹점
                        </span>
                        <span className="text-sm text-zinc-600 font-normal">
                          P2P거래번호
                        </span>
                        <span className="text-sm text-zinc-600 font-normal">
                          거래시작시간
                        </span>
                      </div>
                    </th>

                    <th className="p-2 text-start">
                      <div className="flex flex-col items-start justify-center gap-2">
                        <span className="text-sm text-zinc-600 font-normal">
                          P2P 구매자 아이디
                        </span>
                        <span className="text-sm text-zinc-600 font-normal">
                          USDT지갑
                        </span>
                        <span className="text-sm text-zinc-600 font-normal">
                          입금자
                        </span>
                      </div>
                    </th>
                    
                    <th className="p-2 text-end">
                      <div className="flex flex-col items-end justify-center gap-2">
                        <span className="text-sm text-zinc-600 font-normal">
                          {Buy_Amount}(USDT)
                        </span>
                        <span className="text-sm text-zinc-600 font-normal">
                          구매금액(원)
                        </span>
                        <span className="text-sm text-zinc-600 font-normal">
                          개당금액(원)
                        </span>
                      </div>
                    </th>
                    {/*
                    <th className="p-2">{Payment_Amount}</th>
                    */}

                    <th className="p-2 text-start">
                      <div className="flex flex-col items-start justify-center gap-2">

                        <div className="flex flex-col items-start justify-center gap-2">
                            <span className="text-sm text-zinc-600 font-normal">
                              P2P 판매자 아이디
                            </span>
                            <span className="text-sm text-zinc-600 font-normal">
                              USDT지갑
                            </span>
                        </div>

                        <div className="flex flex-row items-center justify-center gap-2">
                          <span className="text-sm text-zinc-600">자동매칭</span>
                          <Image
                            src="/icon-matching.png"
                            alt="Auto Matching"
                            width={20}
                            height={20}

                            /*
                            className="
                            bg-zinc-100 rounded-full
                            w-5 h-5 animate-spin"
                            */
                            // if buyOrders.filter((item) => item.status === 'ordered').length > 0, then animate spin
                            className={`
                              w-5 h-5
                              ${buyOrders.filter((item) => item.status === 'ordered').length > 0 ? 'animate-spin' : ''}
                            `}
                          />

                          {/* the count of status is ordered */}
                          <span className="text-sm text-zinc-600 font-normal">
                            {
                              buyOrders.filter((item) => item.status === 'ordered').length
                            }
                          </span>

                          <span className="text-sm text-zinc-600 font-normal">
                            거래상태
                          </span>

                        </div>

                      </div>
                    </th>


                    <th className="p-2">
                      <div className="w-full flex flex-col items-start justify-center gap-2">

                        <div className="flex flex-row items-center justify-center gap-2">
                          <span className="text-sm text-zinc-600">
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
                          <span className="text-sm text-zinc-600 font-normal">
                            {
                              buyOrders.filter((item) => item.status === 'paymentRequested').length
                            }
                          </span>

                        </div>
                        <div className="w-full flex flex-col items-start justify-center gap-2">
                          <span className="text-sm text-zinc-600 font-normal">
                            입금통장
                          </span>
                        </div>
                        <div className="w-full flex flex-col items-end justify-center gap-2">
                          <span className="text-sm text-zinc-600 font-normal">
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

                          <span className="text-sm text-zinc-600 font-normal">
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

                    
                    <tr key={index} className={`
                      ${
                        index % 2 === 0 ? 'bg-zinc-100' : 'bg-zinc-200'


                        //item.walletAddress === address ?
                        

                      }  
                    `}>
                    

                      <td className="
                        p-2
                      "
                      >

                        <div className="
                          h-40
                          w-32
                          flex flex-col items-start justify-start gap-2
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
                              <span className="text-sm text-zinc-500 font-normal">
                                {
                                  item?.store?.storeName?.length > 5 ?
                                  item?.store?.storeName?.substring(0, 5) + '...' :
                                  item?.store?.storeName
                                }
                              </span>
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
                            <span className="text-sm text-zinc-500 font-normal">
                            {
                              "#" + item.tradeId
                            }
                            </span>
                          </div>

                          <div className="w-full flex flex-row items-center justify-start gap-2">

                            <div className="w-full flex flex-col items-start justify-start">

                              <span className="text-sm text-zinc-800 font-normal">
                                {new Date(item.createdAt).toLocaleTimeString('ko-KR', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  second: '2-digit',
                                })}
                              </span>
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
                                <span className="text-sm text-zinc-500 font-normal">
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
                                    <span className="text-xl text-zinc-500 font-normal">
                                      {item.audioOn ? (
                                        '🔊'
                                      ) : (
                                        '🔇'
                                      )}
                                    </span>
                                    {/* audioOn off button */}
                                    <button
                                      className="text-sm text-blue-600 font-normal underline"
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
                            <span className="text-sm text-zinc-500 font-normal">
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
                              <span className="text-sm text-zinc-500 font-normal">
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
                                className="text-sm text-blue-600 font-normal underline
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
                                  <span className="text-lg text-gray-800 font-normal">
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
                          flex flex-col gap-2 items-end justify-start">

                          <div className="flex flex-row items-center justify-end gap-1">
                            <Image
                              src="/icon-tether.png"
                              alt="Tether"
                              width={20}
                              height={20}
                              className="w-5 h-5"
                            />
                            <span className="text-xl text-[#409192] font-normal"
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
                            <span className="text-xl text-yellow-600 font-normal"
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
                                    className="text-sm text-blue-600 font-normal underline"
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
                                    <span className="text-lg text-yellow-600 font-normal"
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
                                <span className="text-sm text-zinc-500 font-normal">
                                  판매자 매칭중입니다.
                                </span>
                              </div>

                              <button
                                className="text-sm text-red-600 font-normal
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
                            <div className="text-lg text-yellow-600 font-normal
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
                            <span className="text-sm text-zinc-500 font-normal">
                              
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
                                <span className="text-lg font-normal text-zinc-500">
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
                                  className="text-sm text-blue-600 font-normal underline
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
                                <span className="text-sm text-zinc-500 font-normal">
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
                                className="text-sm text-blue-600 font-normal
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
                                className="text-sm text-yellow-600 font-normal
                                  border border-yellow-600 rounded-lg p-2
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
                                  className="text-sm text-red-600 font-normal
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
                                  text-sm text-[#409192] font-normal
                                  border border-green-600 rounded-lg p-2
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
                                거래<br/>완료
                              </button>
                              <a
                                href={`${paymentUrl}/${params.lang}/${clientId}/${item?.storecode}/pay-usdt-reverse/${item?._id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-blue-600 font-normal underline"
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
                            w-36
                            flex flex-col gap-2 items-end justify-start">
                            
                            {item?.autoConfirmPayment === true ? (
                            
                              <div className="w-full flex flex-row gap-1 items-center justify-start">
                                <Image
                                  src="/icon-payaction.png"
                                  alt="Bank Check"
                                  width={20}
                                  height={20}
                                  className="w-5 h-5 rounded-full"
                                />
                                <span className="text-sm font-normal text-zinc-500">
                                  자동입금확인
                                </span>
                              </div>

                            ) : (

                              <div className="w-full flex flex-row gap-1 items-center justify-start">
                                <Image
                                  src="/icon-bank-check.png"
                                  alt="Bank Check"
                                  width={20}
                                  height={20}
                                  className="w-5 h-5 rounded-full"
                                />
                                <span className="text-sm font-normal text-zinc-500">
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
                                <span className="text-lg text-gray-800 font-normal">
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
                                <span className="text-lg text-gray-800 font-normal">
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
                                <span className="text-lg text-gray-800 font-normal">
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
                                <span className="text-lg text-gray-800 font-normal">
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
                                <span className="text-lg text-gray-800 font-normal">
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
                                <span className="text-lg text-gray-800 font-normal">
                                  {item.store?.bankInfo?.accountHolder}
                                </span>
                                <span className="text-sm text-zinc-500">
                                  {item.store?.bankInfo?.bankName}
                                </span>
                              </div>
                            )))))}


                            {/* paymentAmount */}
                            <div className="flex flex-row gap-1 items-center justify-end">
                              <span className="text-xl text-yellow-600 font-normal"
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
                                <span className="text-sm font-normal text-zinc-500">
                                  MKRW
                                </span>
                              </div>
                            ) : (

                              <div className="w-full flex flex-col gap-2 items-start justify-center">

                                <div className="flex flex-row gap-1 items-center justify-end">
                                  <Image
                                    src="/icon-search-bank.gif"
                                    alt="Bank Auto"
                                    width={30}
                                    height={30}
                                    className="rounded-full"
                                  />
                                  {item?.autoConfirmPayment === true ? (
                                    <span className="text-sm font-normal text-zinc-500">
                                      입금 확인중입니다.
                                    </span>
                                  ) : (
                                    <span className="text-sm font-normal text-zinc-500">
                                      입금 확인중입니다.
                                    </span>
                                  )}

                                </div>

                                {item?.userType === '' ? (
                                  <div className="flex flex-row gap-1 items-center justify-end">
                                    <Image
                                      src="/icon-bank.png"
                                      alt="Bank"
                                      width={20}
                                      height={20}
                                      className="w-5 h-5 rounded-full"
                                    />
                                    <span className="text-lg text-gray-800 font-normal">
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
                                    <span className="text-lg text-gray-800 font-normal">
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
                                    <span className="text-lg text-gray-800 font-normal">
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
                                    <span className="text-lg text-gray-800 font-normal">
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
                                    <span className="text-lg text-gray-800 font-normal">
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
                                    <span className="text-lg text-gray-800 font-normal">
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
                                  <span className="text-lg text-yellow-600 font-normal"
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
                                          ${confirmingPayment[index]
                                          ? 'text-gray-400 border-gray-400 bg-gray-100 cursor-not-allowed'
                                          : 'text-blue-600 border-blue-600 bg-blue-100 hover:bg-blue-200 cursor-pointer hover:scale-105 hover:shadow-lg hover:shadow-blue-500/50'
                                          } bg-blue-100 border border-blue-600 rounded-lg p-2
                                          w-24 text-center
                                        `}

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
                                      text-sm text-blue-600 font-normal
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
                                  <div className="text-lg text-zinc-500 font-normal">
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
                                  className="text-sm text-blue-600 font-normal
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
                            <div className="w-full flex flex-row gap-2 items-center justify-center">
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
                                text-center rounded-md text-sm text-zinc-500 font-normal bg-zinc-100 border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                                    text-sm text-red-600 font-normal
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
                                        
                                        className="text-sm text-yellow-600 font-normal
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
                                      <span className="text-sm text-red-600 font-normal">
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
                                      
                                      className="text-sm text-[#409192] font-normal
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
                                      className="w-20 h-8 rounded-md text-right text-lg text-zinc-500 font-normal bg-zinc-100 border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                                        
                                        onClick={(e) => {

                                          //e.preventDefault();
                                          //e.stopPropagation();

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
                                h-40
                                w-full
                                flex flex-row gap-2 items-center justify-between
                                text-sm text-[#409192] font-normal
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
                                      <span className="text-lg text-[#409192] font-normal"
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
                                      <span className="text-sm text-[#409192] font-normal"
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
                                      <span className="text-lg text-[#409192] font-normal"
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
                                text-sm text-[#409192] font-normal
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
                                      <span className="text-lg text-[#409192] font-normal"
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
                                text-sm font-normal
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
                          h-40
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
                                <span className="text-sm font-normal text-zinc-500">
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
                                <span className="text-sm font-normal text-zinc-500">
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
                                <span className="text-sm font-normal text-zinc-500">
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
                                <Image
                                  src={item?.store?.storeLogo || '/icon-store.png'}
                                  alt="Store Logo"
                                  width={30}
                                  height={30}
                                  className="w-6 h-6 rounded-lg object-cover"
                                />
                                <span className="text-sm font-normal text-zinc-500">
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
                                <span className="text-sm font-normal text-zinc-500">
                                  지갑잔액:
                                </span>
                                <span className="text-lg font-normal text-green-600"
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
                                          <span className="text-sm font-normal text-zinc-500">
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
                                          <span className="text-sm font-normal text-zinc-500">
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
                                          <span className="text-lg font-normal text-[#409192]"
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
                                    w-full  
                                    flex flex-col gap-2 items-center justify-center

                                    bg-[#AFE4AB] hover:bg-[#9BCDA5]
                                    text-sm text-green-800 font-normal
                                    border border-green-600 rounded-lg p-2
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
                                    w-40   
                                    flex flex-col gap-1 items-end justify-center"
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
                                  w-32
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
                                    <span className="text-sm font-normal text-blue-600">
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

                                  <span className="text-sm text-blue-600 font-normal"
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
                                          <span className="text-sm font-normal text-zinc-500">
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
                                          <span className="text-sm font-normal text-zinc-500">
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
                                          <span className="text-lg font-normal text-[#409192]"
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


                            <p className="text-sm font-normal text-[#409192] ">
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

                            <p className="text-xl font-normal text-zinc-500">
                              {item.usdtAmount}{' '}USDT
                            </p>
                            <p className="text-lg font-normal text-zinc-500">{Rate}: {

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
                                src={item.avatar || '/icon-user.png'}
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

                              <div className="text-sm font-normal">
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
                            <div className="flex flex-row items-center gap-1">
                              <Image
                                src={item?.buyer?.avatar || "/icon-user.png"}
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
                              <p className="text-sm text-red-500 font-normal">
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
                              src={item.seller?.avatar || "/icon-seller.png"}
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
                            <p className="text-xl text-[#409192] font-normal">
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
                            <span className="text-sm font-normal text-[#409192]">
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
  
                                                acceptBuyOrder(index, item._id, smsReceiverMobileNumber, item.tradeId, item.walletAddress)
                                          

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

      

        {/* pagination */}
        {/* url query string */}
        {/* 1 2 3 4 5 6 7 8 9 10 */}
        {/* ?limit=10&page=1 */}
        {/* submit button */}
        {/* totalPage = Math.ceil(totalCount / limit) */}
        <div className="mt-6 flex flex-row items-center justify-center gap-3">


          <div className="flex flex-row items-center gap-2">
            <select
              value={limitValue}
              onChange={(e) =>
                router.push(`/${params.lang}/admin/buyorder?storecode=${searchStorecode}&limit=${Number(e.target.value)}&page=${pageValue}`)
              }

              className="text-sm bg-white text-zinc-700 border border-zinc-200 px-2 py-1 rounded-md"
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
            className={`text-sm px-4 py-2 rounded-full border border-zinc-200 ${Number(pageValue) <= 1 ? 'bg-zinc-100 text-zinc-400' : 'bg-white text-zinc-700 hover:bg-zinc-50'}`}
            onClick={() => {
              router.push(`/${params.lang}/admin/buyorder?storecode=${searchStorecode}&limit=${Number(limitValue)}&page=1`)
            }}
          >
            처음으로
          </button>


          <button
            disabled={Number(pageValue) <= 1}
            className={`text-sm px-4 py-2 rounded-full border border-zinc-200 ${Number(pageValue) <= 1 ? 'bg-zinc-100 text-zinc-400' : 'bg-white text-zinc-700 hover:bg-zinc-50'}`}
            onClick={() => {

              router.push(`/${params.lang}/admin/buyorder?storecode=${searchStorecode}&limit=${Number(limitValue)}&page=${Number(pageValue) - 1}`)


            }}
          >
            이전
          </button>


          <span className="text-sm text-zinc-500">
            {pageValue} / {Math.ceil(Number(buyOrderStats.totalCount) / Number(limitValue))}
          </span>


          <button
            disabled={Number(pageValue) >= Math.ceil(Number(buyOrderStats.totalCount) / Number(limitValue))}
            className={`text-sm px-4 py-2 rounded-full border border-zinc-200 ${Number(pageValue) >= Math.ceil(Number(buyOrderStats.totalCount) / Number(limitValue)) ? 'bg-zinc-100 text-zinc-400' : 'bg-white text-zinc-700 hover:bg-zinc-50'}`}
            onClick={() => {

              router.push(`/${params.lang}/admin/buyorder?storecode=${searchStorecode}&limit=${Number(limitValue)}&page=${Number(pageValue) + 1}`)

            }}
          >
            다음
          </button>

          {/* 마지막으로 */}
          <button
            disabled={Number(pageValue) >= Math.ceil(Number(buyOrderStats.totalCount) / Number(limitValue))}
            className={`text-sm px-4 py-2 rounded-full border border-zinc-200 ${Number(pageValue) >= Math.ceil(Number(buyOrderStats.totalCount) / Number(limitValue)) ? 'bg-zinc-100 text-zinc-400' : 'bg-white text-zinc-700 hover:bg-zinc-50'}`}
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


    </main>

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
      <h1 className="text-2xl font-normal">거래정보</h1>
      
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
          <h2 className="text-lg font-normal text-black ">Iskan9</h2>
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
