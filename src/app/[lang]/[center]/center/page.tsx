'use client';

import { useState, useEffect, use, act } from "react";

import Image from "next/image";



// open modal

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
  getWalletBalance,
} from "thirdweb/wallets";





import {
  getUserEmail,
  getUserPhoneNumber,
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
}


const wallets = [
  inAppWallet({
    auth: {
      options: [
        "google",
        "discord",
        "email",
        "x",
        //"passkey",
        //"phone",
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



/*
const wallets = [
    inAppWallet({
      auth: {
        options: [
          "google",
        ],
      },
    }),
  ];
*/
  


// get escrow wallet address

//const escrowWalletAddress = "0x2111b6A49CbFf1C8Cc39d13250eF6bd4e1B59cF6";





export default function Index({ params }: any) {




  const searchParams = useSearchParams();
 
  const wallet = searchParams.get('wallet');


  // limit, page number params

  const limit = searchParams.get('limit') || 20;
  const page = searchParams.get('page') || 1;



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


 
  /*
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
  */



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

    Withdraw_USDT: "",
    Please_connect_your_wallet_first: "",
    Coming_Soon: "",
    Pay_USDT: "",


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

    Withdraw_USDT,
    Please_connect_your_wallet_first,
    Coming_Soon,
    Pay_USDT,

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

      if (!address) {
        setBalance(0);
        return;
      }

      try {
        const result = await balanceOf({
          contract,
          address: address,
        });

        if (chain === 'bsc') {
          setBalance( Number(result) / 10 ** 18 );
        } else {
          setBalance( Number(result) / 10 ** 6 );
        }

        } catch (error) {
          console.log("getBalance error", error);
      }


      // getWalletBalance
      const result = await getWalletBalance({
        address: address || "",
        client: client,
        chain: chain === "ethereum" ? ethereum :
               chain === "polygon" ? polygon :
               chain === "arbitrum" ? arbitrum :
               chain === "bsc" ? bsc : arbitrum,
      });
      //console.log("getWalletBalance", result);
      /*
      {value: 193243898588330546n, decimals: 18, displayValue: '0.193243898588330546', symbol: 'ETH', name: 'ETH'}
      */
      if (result) {
        setNativeBalance(Number(result.value) / 10 ** result.decimals);
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




  


  // get User by wallet address
  const [isAdmin, setIsAdmin] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  const [seller, setSeller] = useState(null) as any;




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
                  setSeller(data.result.seller);
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

  } , [address, params.center]);






  
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
        
        //console.log('data.result', data.result);


        setUser(data.result);

        setSeller(data.result.seller);

        setEscrowWalletAddress(data.result.escrowWalletAddress);

        setIsAdmin(data.result?.role === "admin");

    })
    .catch((error) => {
        console.error('Error:', error);
        setUser(null);
        setSeller(null);
        setEscrowWalletAddress('');
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

  
  const [searchNickname, setSearchNickname] = useState("");


  const [searchMyOrders, setSearchMyOrders] = useState(false);



  // limit number
  const [limitValue, setLimitValue] = useState(limit || 20);

  // page number
  const [pageValue, setPageValue] = useState(page || 1);



  const [totalCount, setTotalCount] = useState(0);
    
  //const [buyOrders, setBuyOrders] = useState<BuyOrder[]>([]);


  //console.log('buyOrders', buyOrders);

  



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



  // array of stores
  const [storeList, setStoreList] = useState([] as any[]);
  const [fetchingStoreList, setFetchingStoreList] = useState(false);
  const fetchStoreList = async () => {
    if (fetchingStoreList) {
      return;
    }
    setFetchingStoreList(true);
    const response = await fetch('/api/store/getAllStores', {
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
      setFetchingStoreList(false);
      toast.error('가맹점 검색에 실패했습니다.');
      return;
    }
    const data = await response.json();
    //console.log('data', data);
    setStoreList(data.result.stores);
    setTotalCount(data.result.totalCount);

    setFetchingStoreList(false);

    return data.result.stores;
  }




  //const [storeBackgroundColor, setStoreBackgroundColor] = useState("blue-500");

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

          //setStoreBackgroundColor(data.result?.backgroundColor || "blue-500");

        } else {
          toast.error("가맹점 정보를 불러오는데 실패했습니다.");

          setStore(null);
          setStoreAdminWalletAddress("");

          fetchStoreList();


        }



        setFetchingStore(false);
    };

    fetchData();

  } , [params.center]);





  // fetch all buyer user 
  /*
  const [fetchingAllBuyer, setFetchingAllBuyer] = useState(false);
  const [allBuyer, setAllBuyer] = useState([] as any[]);

  const fetchAllBuyer = async () => {
    if (fetchingAllBuyer) {
      return;
    }
    setFetchingAllBuyer(true);
    const response = await fetch('/api/user/getAllBuyersByStorecode', {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json',
      },
      body: JSON.stringify(
        {
          storecode: params.center,
          limit: Number(limitValue),
          page: Number(pageValue),
        }
      ),
    });
    if (!response.ok) {
      setFetchingAllBuyer(false);
      toast.error('회원 검색에 실패했습니다.');
      return;
    }
    const data = await response.json();
    //console.log('data', data);
    setAllBuyer(data.result.users);
    setTotalCount(data.result.totalCount);

    setFetchingAllBuyer(false);

    return data.result.users;
  }

  useEffect(() => {
    if (!address) {
      setAllBuyer([]);
      return;
    }
    fetchAllBuyer();
  } , [address, limitValue, pageValue]);
  */




  {/*
  {"storecode":"teststorecode","storeName":"테스트상점","storeType":"test","storeUrl":"https://test.com","storeDescription":"설명입니다.","storeLogo":"https://test.com/logo.png","storeBanner":"https://test.com/banner.png"}
  */}


  // insert buyer user
  const [userCode, setUserCode] = useState('');
  const [userName, setUserName] = useState('');
  const [userBankName, setUserBankName] = useState('');
  const [userType, setUserType] = useState('test');






  /*
  {
    "_id": "681991dcd631f7d635a06492",
    "storecode": "handsome",
    "storeName": "핸썸",
    "storeType": "test",
    "storeUrl": "https://test.com",
    "storeDescription": "설명입니다.",
    "storeLogo": "https://www.stable.makeup/logo.png",
    "storeBanner": "https://www.stable.makeup/logo.png",
    "createdAt": "2025-05-06T04:36:44.683Z"
    "adminWalletAddress": "0x2111b6A49CbFf1C8Cc39d13250eF6bd4e1B59cF6",
  }
  */
  




  /*
  // get All users by storecode
  const [fetchingAllUsers, setFetchingAllUsers] = useState(false);
  const [allUsers, setAllUsers] = useState([] as any[]);
  const [userTotalCount, setUserTotalCount] = useState(0);
  const fetchAllUsers = async () => {
    if (fetchingAllUsers) {
      return;
    }
    setFetchingAllUsers(true);
    const response = await fetch('/api/user/getAllUsersByStorecode', {
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
      setFetchingAllUsers(false);
      return;
    }
    const data = await response.json();
    
    //console.log('getAllUsersByStorecode data', data);

    setAllUsers(data.result.users);
    setUserTotalCount(data.result.totalCount);

    setFetchingAllUsers(false);

    return data.result.users;
  }

  useEffect(() => {
    if (!address) {
      setAllUsers([]);
      return;
    }
    fetchAllUsers();
    // interval
    const interval = setInterval(() => {
      fetchAllUsers();
    } , 5000);
    return () => clearInterval(interval);
  } , [address]);
   */

  /*
  {
    "_id": "6819b8071da61ff93eeac02e",
    "id": 3497428,
    "email": null,
    "nickname": "bansua",
    "mobile": "",
    "storecode": "handsome",
    "walletAddress": "0x4020CDbd580603dEd0eAe33520b1F4A1653010fF",
    "createdAt": "2025-05-06T07:19:35.173Z",
    "settlementAmountOfFee": "0",
    "verified": true
  }
  */


  // update adminWalletAddress of store
  // 관리자 지갑 변경
  /*
  const [updatingAdminWalletAddress, setUpdatingAdminWalletAddress] = useState(false);
  const [selectedAdminWalletAddress, setSelectedAdminWalletAddress] = useState('');
  const updateAdminWalletAddress = async () => {
    if (updatingAdminWalletAddress) {
      return;
    }
    setUpdatingAdminWalletAddress(true);
    const response = await fetch('/api/store/updateStoreAdminWalletAddress', {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json',
      },
      body: JSON.stringify(
        {
          storecode: params.center,
          adminWalletAddress: selectedAdminWalletAddress,
        }
      ),
    });
    if (!response.ok) {
      setUpdatingAdminWalletAddress(false);
      toast.error('가맹점 관리자 변경에 실패했습니다.');
      return;
    }

    const data = await response.json();
    //console.log('data', data);
    if (data.result) {
      toast.success('가맹점 관리자가 변경되었습니다.');
      setSelectedAdminWalletAddress('');

      fetchStore();
      


    } else {
      toast.error('가맹점 관리자 변경에 실패했습니다.');
    }

    setUpdatingAdminWalletAddress(false);

    return data.result;
  }
  */
  





  // get store summary
  // total number of buyers, total number of trades, total buy amount krw, total usdt amount
  /*
      latestBuyers,
    totalNumberOfBuyers,

    latestOrders,
    totalNumberOfOrders,
    totalBuyKrwAmount,
    totalBuyUsdtAmount,


    latestTrades,

    totalNumberOfTrades,
    totalTradeKrwAmount,
    totalTradeUsdtAmount,

    totalSettlementCount,
    totalSettlementAmount,
    totalSettlementAmountKRW,
    */
 
  
  const [storeSummary, setStoreSummary] = useState<{
    latestBuyers: any[];
    totalNumberOfBuyers: number;

    latestOrders: any[];
    totalNumberOfOrders: number;
    totalBuyKrwAmount: number;
    totalBuyUsdtAmount: number;

    latestTrades: any[];
    totalNumberOfTrades: number;
    totalTradeKrwAmount: number;
    totalTradeUsdtAmount: number;

    latestSettlements: any[];
    totalSettlementCount: number;
    totalSettlementAmount: number;
    totalSettlementAmountKRW: number;

    latestClearances: any[];
    totalClearanceCount: number;
    totalClearanceKrwAmount: number;
    totalClearanceUsdtAmount: number;

  }>({
    latestBuyers: [],
    totalNumberOfBuyers: 0,

    latestOrders: [],
    totalNumberOfOrders: 0,
    totalBuyKrwAmount: 0,
    totalBuyUsdtAmount: 0,

    latestTrades: [],
    totalNumberOfTrades: 0,
    totalTradeKrwAmount: 0,
    totalTradeUsdtAmount: 0,

    latestSettlements: [],
    totalSettlementCount: 0,
    totalSettlementAmount: 0,
    totalSettlementAmountKRW: 0,

    latestClearances: [],
    totalClearanceCount: 0,
    totalClearanceKrwAmount: 0,
    totalClearanceUsdtAmount: 0,


  });

  const [fetchingStoreSummary, setFetchingStoreSummary] = useState(false);

  const fetchStoreSummary = async () => {
    if (!address) {
      return;
    }
    if (fetchingStoreSummary) {
      return;
    }
    setFetchingStoreSummary(true);
    const response = await fetch('/api/summary/getStoreSummary', {
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
      setFetchingStoreSummary(false);
      return;
    }
    const data = await response.json();
    
    //console.log('getStoreSummary data', data);

    setStoreSummary(data.result);

    setFetchingStoreSummary(false);

  }


  useEffect(() => {
    if (!address) {
      return;
    }
    fetchStoreSummary();
    // interval
    const interval = setInterval(() => {
      fetchStoreSummary();
    } , 10000);
    return () => clearInterval(interval);
  } , [address]);




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



  const [selectedItem, setSelectedItem] = useState<any>(null);












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



  return (

    <main className="p-4 pb-10 min-h-[100vh] flex items-start justify-center container max-w-screen-2xl mx-auto">


      <div className="w-full flex flex-col items-center justify-center gap-4">

      {fetchingStore ? (
        <div className="w-full flex flex-col items-center justify-center gap-4">
          <Image
            src="/banner-loading.gif"
            alt="Loading"
            width={200}
            height={200}
          />
          <div className="text-lg text-gray-500">가맹점 정보를 불러오는 중...</div>
        </div>
      ) : !store ? (
        <div className="py-0 w-full flex flex-col items-center justify-center gap-4">
          <Image
            src="/banner-404.gif"
            alt="Error"
            width={200}
            height={200}
          />
          <div className="text-lg text-gray-500">가맹점 정보가 없습니다.</div>
          <div className="text-sm text-gray-400">가맹점 홈페이지로 이동해주세요.</div>  
          <div className="w-full max-w-2xl">
            <table className="w-full table-auto border-collapse
            border border-gray-300 rounded-lg shadow-md">
              <thead>
                <tr className="bg-gray-200
                text-gray-700">
                  <th className="px-4 py-2 text-left">가맹점 이름</th>
                  <th className="px-4 py-2 text-left">가맹점 코드</th>
                  <th className="px-4 py-2 text-left">가맹점 로고</th>
                  <th className="px-4 py-2 text-left">가맹점 페이지</th>
                </tr>
              </thead>
              <tbody>
                {storeList.map((store, index) => (
                  <tr key={store.storecode}
                    className={`hover:bg-gray-100 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                  >
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
      ) : !address ? (
        <div className="py-0 w-full flex flex-col items-center justify-center gap-4">
          <Image
            src="/banner-login.gif"
            alt="Login"
            width={200}
            height={200}
          />
          <div className="text-lg text-gray-500">로그인이 필요합니다.</div>
          <div className="text-sm text-gray-400">로그인 후 가맹점 정보를 확인하세요.</div>
          <ConnectButton
            client={client}
            wallets={wallets}
            theme={"light"}
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
        </div>
      ) : (
        <div className="w-full flex flex-col items-start justify-start gap-4">


          <div className={`w-full flex flex-col xl:flex-row items-center justify-between gap-2
            p-2 rounded-lg mb-4
            ${store?.backgroundColor ?
              "bg-" + store.backgroundColor + " " :
              "bg-black/10"
            }`}>
              
              
              <button
                onClick={() => {
                  router.push('/' + params.lang + '/' + params.center + '/center');
                }}
                className="flex bg-[#3167b4] text-sm text-[#f3f4f6] px-4 py-2 rounded-lg hover:bg-[#3167b4]/80"
              >

                <div className="flex flex-row items-center gap-2">
                  <Image
                      src={store?.storeLogo || "/logo.png"}
                      alt="Store"
                      width={35}
                      height={35}
                      className="rounded-lg w-12 h-12 object-cover"
                  />
                  <span className="text-sm text-zinc-50">
                    {
                      store && store?.storeName + " (" + store?.storecode + ")" + " 가맹점"
                    }
                  </span>

                </div>

              </button>

              {/* 가맹점 설정 */}
              {version === 'bangbang' &&
              address === store?.adminWalletAddress && (
                <div className="flex flex-row items-center gap-2">
                  <button
                    onClick={() => {
                      router.push('/' + params.lang + '/' + params.center + '/settings-bangbang');
                    }}
                    className="
                      items-center justify-center
                      bg-[#3167b4] text-sm text-[#f3f4f6] px-4 py-2 rounded-lg hover:bg-[#3167b4]/80"
                  >
                    <span className="text-sm text-zinc-50">가맹점 설정</span>
                  </button>
                </div>
              )}


              <div className="flex flex-row items-center gap-2">
                

                <div className="w-full flex flex-row items-center justify-end gap-2">
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
                          flex flex-col xl:flex-row items-center justify-center gap-2">
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
          


          <div className="w-full flex flex-col justify-between items-center gap-2">
    

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




          {/* USDT 가격 binance market price */}
          {/*
          <div
            className="binance-widget-marquee
            
            h-20

            w-full flex flex-row items-center justify-center gap-2
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




          <div className="w-full flex flex-col items-end justify-end gap-2
            border-b border-zinc-300 pb-2">

            {/* 가맹점 보유량 */}
            {version !== 'bangbang' && (
            <div className="flex flex-col xl:flex-row items-start xl:items-center gap-2
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
                    w-48 
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
                    w-48
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


            {/* 가맹점 거래 */}
            <div className="flex flex-col xl:flex-row items-start xl:items-center gap-2">
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




            {/* 가맹점 정산금 */}
            <div className="flex flex-col xl:flex-row items-start xl:items-center gap-2">
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


            {/* 가맹점 판매금 */}
            {version !== 'bangbang' && (
            <div className="flex flex-col xl:flex-row items-start xl:items-center gap-2">
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
            )}



          </div>




          <div className="flex flex-row items-center justify-start gap-2">

              <Image
                src="/icon-homepage.png"
                alt="Homepage"
                width={20}
                height={20}
                className="rounded-lg w-6 h-6"
              />

              <div className="flex flex-col xl:flex-row items-center justify-start gap-2">

                <button
                  onClick={() => {
                    window.open(`/${params.lang}/${params.center}/homepage`, '_blank');
                  }}
                  className="text-sm text-zinc-500 underline"
                >
                  회원 홈페이지 새창
                </button>
     
              </div>

          </div>





          {/* store summary */}
          {/* dashboard style */}
          {/* storeSummary {totalNumberOfBuyers, totalNumberOfTrades, totalBuyAmountKrw, totalUsdtAmount} */}
          
          <div className="w-full flex flex-col items-start justify-center gap-2 mt-4">


            <div className="w-full grid grid-cols-1 xl:grid-cols-2 gap-4 mt-4">
              
              <div className="w-full flex flex-col items-start justify-start gap-2  bg-white shadow-md rounded-lg p-4">
                
                <div className="w-full flex flex-row items-center justify-between gap-2">

                  <div className="flex flex-row items-center justify-start gap-2
                    border-b-2 border-b-[#3167b4] pb-2">
                    <Image
                      src="/icon-user.png"
                      alt="Buyer"
                      width={35}
                      height={35}
                      className="w-5 h-5"
                    />
                    <h2 className="text-lg font-semibold">최근 구매회원</h2>
                    {fetchingStoreSummary && (
                      <Image
                        src="/loading.png"
                        alt="Loading"
                        width={20}
                        height={20}
                        className="rounded-lg w-5 h-5 animate-spin"
                      />
                    )}
                  </div>

                  <button
                    onClick={() => {
                      router.push('/' + params.lang + '/' + params.center + '/member');
                    }}
                    className="bg-[#3167b4] text-sm text-[#f3f4f6] px-4 py-2 rounded-lg hover:bg-[#3167b4]/80"
                  >
                    회원관리
                  </button>

                </div>


                <div className="w-full flex flex-col items-end justify-center gap-2
                border-b-2 border-b-[#3167b4]">
                  <h2 className="text-lg font-semibold">총 회원수</h2>
                  <p className="text-lg text-zinc-500">
                    {storeSummary.totalNumberOfBuyers}명
                  </p>
                </div>

                {/* latest buyers talble */}
                <div className="w-full mt-4">
                  
                  <table className="min-w-full">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="px-4 py-2 text-left">회원아이디</th>
                        <th className="px-4 py-2 text-left">입금자명</th>
                        <th className="px-4 py-2 text-left">가입일</th>
                      </tr>
                    </thead>
                    <tbody>
                      {storeSummary.latestBuyers.map((buyer, index) => (
                        <tr key={index} className="border-b">
                          <td className="px-4 py-2">{buyer.nickname}</td>
                          <td className="px-4 py-2">{buyer?.buyer?.depositName}</td>
                          <td className="px-4 py-2">{new Date(buyer.createdAt).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                </div>

              </div>


              {/* total number of orders, total buy amount krw, total usdt amount */}
              <div className="w-full flex flex-col items-start justify-start gap-2  bg-white shadow-md rounded-lg p-4">
                
                <div className="w-full flex flex-row items-center justify-between gap-2">

                  <div className="flex flex-row items-center justify-start gap-2
                    border-b-2 border-b-[#3167b4] pb-2">
                    <Image
                      src="/icon-buyorder.png"
                      alt="Order"
                      width={35}
                      height={35}
                      className="w-6 h-6"
                    />
                    <h2 className="text-lg font-semibold">최근 구매주문</h2>
                    {fetchingStoreSummary && (
                      <Image
                        src="/loading.png"
                        alt="Loading"
                        width={20}
                        height={20}
                        className="rounded-lg w-5 h-5 animate-spin"
                      />
                    )}
                  </div>

                  <button
                    onClick={() => {
                      router.push('/' + params.lang + '/' + params.center + '/buyorder');
                    }}
                    className="bg-[#3167b4] text-sm text-[#f3f4f6] px-4 py-2 rounded-lg hover:bg-[#3167b4]/80"
                  >
                    구매주문관리
                  </button>

                </div>


                <div className="w-full flex flex-row items-center justify-end gap-2
                  border-b-2 border-b-[#3167b4]">


                  <div className="flex flex-col items-center justify-center gap-2">
                    <h2 className="text-lg font-semibold">총 구매주문수</h2>
                    <p className="text-lg text-zinc-500">
                      {storeSummary.totalNumberOfOrders}
                    </p>
                  </div>
                  <div className="flex flex-col items-center justify-center gap-2">
                    <h2 className="text-lg font-semibold">총 구매금액(원)</h2>
                    <div className="flex flex-row items-center justify-end gap-2">
                      <p className="text-lg text-yellow-600"
                        style={{ fontFamily: 'monospace' }}>
                        {Number(storeSummary.totalBuyKrwAmount)?.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-center justify-center gap-2">
                    <h2 className="text-lg font-semibold">총 구매량(USDT)</h2>

                    <div className="flex flex-row items-center justify-center gap-2">
                      <Image
                        src="/icon-tether.png"
                        alt="Tether"
                        width={20}
                        height={20}
                        className="rounded-lg w-4 h-4"
                      />
                      <p className="text-lg text-[#409192]"
                        style={{ fontFamily: 'monospace' }}>
                        {Number(storeSummary.totalBuyUsdtAmount
                          ? storeSummary.totalBuyUsdtAmount : 0
                        ).toFixed(3).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                      </p>
                    </div>

                  </div>
                </div>


                {/* latest trades table */}
                <div className="w-full mt-4">
                  
                  <table className="min-w-full">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="px-4 py-2 text-left">거래번호</th>
                        <th className="px-4 py-2 text-left">거래금액(원)</th>
                        <th className="px-4 py-2 text-left">거래량(USDT)</th>
                        <th className="px-4 py-2 text-left">거래상태</th>
                      </tr>
                    </thead>
                    <tbody>
                      {storeSummary.latestOrders.map((order, index) => (
                        <tr key={index} className="border-b">
                          <td className="px-4 py-2">#{order.tradeId}</td>
                          <td className="px-4 py-2">
                            <div className="flex flex-row items-center justify-end gap-2">
                              <span className="text-lg text-yellow-600"
                                style={{ fontFamily: 'monospace' }}>
                                {Number(order.krwAmount)?.toLocaleString()}
                              </span>
                            </div>
                          </td>
                          
                          <td className="px-4 py-2">
                            <div className="
                              w-20
                              flex flex-row items-center justify-between gap-2">
                              <Image
                                src="/icon-tether.png"
                                alt="Tether"
                                width={20}
                                height={20}
                                className="rounded-lg w-4 h-4"
                              />
                              <span className="text-lg text-[#409192]"
                                style={{ fontFamily: 'monospace' }}>
                                {Number(order.usdtAmount).toFixed(3).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                              </span>
                            </div>
                          </td>

                          <td className="px-4 py-2">

                            {order.status === 'ordered' && (
                              <span className="text-sm text-yellow-500 font-semibold">
                                구매신청
                              </span>
                            )}
                            {order.status === 'accepted' && (
                              <span className="text-sm text-green-500 font-semibold">
                                구매승인
                              </span>
                            )}
                            {order.status === 'paymentRequested' && (
                              <span className="text-sm text-blue-500 font-semibold">
                                결제요청
                              </span>
                            )}
                            {order.status === 'paymentConfirmed' && (
                              <span className="text-sm text-blue-500 font-semibold">
                                결제완료
                              </span>
                            )}
                          
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                </div>

              </div>




              {/* 최근 거래내역 */}
              <div className="w-full flex flex-col items-start justify-start gap-2  bg-white shadow-md rounded-lg p-4">
                  
                <div className="w-full flex flex-row items-center justify-between gap-2">

                  <div className="flex flex-row items-center justify-start gap-2
                    border-b-2 border-b-[#3167b4] pb-2">
                    <Image
                      src="/icon-trade.png"
                      alt="Trade"
                      width={35}
                      height={35}
                      className="w-6 h-6"
                    />
                    <h2 className="text-lg font-semibold">최근 거래내역(회원)</h2>
                    {fetchingStoreSummary && (
                      <Image
                        src="/loading.png"
                        alt="Loading"
                        width={20}
                        height={20}
                        className="rounded-lg w-5 h-5 animate-spin"
                      />
                    )}
                  </div>
                  <button
                    onClick={() => {
                      router.push('/' + params.lang + '/' + params.center + '/trade-history');
                    }}
                    className="bg-[#3167b4] text-sm text-[#f3f4f6] px-4 py-2 rounded-lg hover:bg-[#3167b4]/80"
                  >
                    P2P 거래내역
                  </button>

                </div>


                <div className="w-full flex flex-col items-center justify-end gap-2
                border-b-2 border-b-[#3167b4]">

                  {/* total number of trades, total buy amount krw, total usdt amount */}

                  <div className="w-full flex flex-row items-center justify-center gap-2">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <h2 className="text-lg font-semibold">총 거래수</h2>
                      <p className="text-lg text-zinc-500">
                        {storeSummary.totalNumberOfTrades}
                      </p>
                    </div>
                    <div className="flex flex-col items-center justify-center gap-2">
                      <h2 className="text-lg font-semibold">총 거래금액(원)</h2>
                      <div className="flex flex-row items-center justify-end gap-2">
                        <p className="text-lg text-yellow-600"
                          style={{ fontFamily: 'monospace' }}>
                          {Number(storeSummary.totalTradeKrwAmount)?.toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-center justify-center gap-2">
                      <h2 className="text-lg font-semibold">총 거래량(USDT)</h2>

                      <div className="flex flex-row items-center justify-center gap-2">
                        <Image
                          src="/icon-tether.png"
                          alt="Tether"
                          width={20}
                          height={20}
                          className="rounded-lg w-4 h-4"
                        />
                        <p className="text-lg text-[#409192]"
                          style={{ fontFamily: 'monospace' }}>
                          {Number(storeSummary.totalTradeUsdtAmount).toFixed(3).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                        </p>
                      </div>

                    </div>
                  </div>

                  {/* divider */}
                  <div className="w-full h-[1px] bg-zinc-300 my-2"></div>

                  {/* total settlement count, total settlement amount krw, total usdt amount */}
                  <div className="w-full flex flex-row items-center justify-center gap-2">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <h2 className="text-lg font-semibold">총 결제수</h2>
                      <p className="text-lg text-zinc-500">
                        {storeSummary.totalSettlementCount}
                      </p>
                    </div>
                    <div className="flex flex-col items-center justify-center gap-2">
                      <h2 className="text-lg font-semibold">총 결제금액(원)</h2>
                      <div className="flex flex-row items-center justify-end gap-2">
                        <p className="text-lg text-yellow-600"
                          style={{ fontFamily: 'monospace' }}>
                          {Number(storeSummary.totalSettlementAmountKRW)?.toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-center justify-center gap-2">
                      <h2 className="text-lg font-semibold">총 결제량(USDT)</h2>
                      <div className="flex flex-row items-center justify-center gap-2">
                        <Image
                          src="/icon-tether.png"
                          alt="Tether"
                          width={20}
                          height={20}
                          className="rounded-lg w-4 h-4"
                        />
                        <p className="text-lg text-[#409192]"
                          style={{ fontFamily: 'monospace' }}>
                          {Number(storeSummary.totalSettlementAmount).toFixed(3).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                        </p>
                      </div>
                    </div>
                  </div>
 
                </div>


                <div className="w-full flex flex-row items-center justify-end gap-2">
                  {/* latest trades table */}
                  <div className="w-full mt-4">
                    
                    <table className="min-w-full">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="
                          hidden xl:table-cell
                          px-4 py-2 text-left">거래번호</th>
                          <th className="px-4 py-2 text-left">구매자</th>
                          <th className="px-4 py-2 text-right">거래금액(원)</th>
                          <th className="px-4 py-2 text-right">거래량(USDT)</th>
                          <th className="
                          hidden xl:table-cell
                          px-4 py-2 text-left">거래일시</th>
                        </tr>
                      </thead>
                      <tbody>
                        {storeSummary.latestTrades.map((trade, index) => (
                          <tr key={index} className="border-b">
                            <td className="
                            hidden xl:table-cell
                            px-4 py-2">#{trade.tradeId}</td>
                            <td className="px-4 py-2">
                              <span className="text-sm text-zinc-500">
                                {trade.nickname || '익명'}
                              </span>
                              <br />
                              <span className="text-sm text-zinc-400">
                                {trade.buyer?.depositName || '입금자명 없음'}
                              </span>
                            </td>
                            <td className="px-4 py-2">
                              <div className="
                                w-full
                                flex flex-row items-center justify-end gap-2">
                                <span className="text-lg text-yellow-600"
                                  style={{ fontFamily: 'monospace' }}>
                                  {Number(trade.krwAmount)?.toLocaleString()}
                                </span>
                              </div>
                            </td>
                            
                            <td className="px-4 py-2">
                              <div className="w-full flex flex-row items-center justify-end gap-1">
                                <Image
                                  src="/icon-tether.png"
                                  alt="Tether"
                                  width={20}
                                  height={20}
                                  className="rounded-lg w-4 h-4"
                                />
                                <span className="text-lg text-[#409192]"
                                  style={{ fontFamily: 'monospace' }}>
                                  {Number(trade.usdtAmount).toFixed(3).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                                </span>
                              </div>
                            </td>


                            <td className="
                            hidden xl:table-cell
                            px-4 py-2">
                              {new Date(trade.createdAt).toLocaleDateString()}
                              <br />
                              {new Date(trade.createdAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                                second: '2-digit'
                              })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>


              </div>



              {/* 최근 판매내역(거래소) */}
              {version !== 'bangbang' && (
              <div className="w-full flex flex-col items-start justify-start gap-2  bg-white shadow-md rounded-lg p-4">
                  
                <div className="w-full flex flex-row items-center justify-between gap-2">

                  <div className="flex flex-row items-center justify-start gap-2
                    border-b-2 border-b-[#3167b4] pb-2">
                    <Image
                      src="/icon-clearance.png"
                      alt="Trade"
                      width={35}
                      height={35}
                      className="w-6 h-6"
                    />
                    <h2 className="text-lg font-semibold">최근 판매내역(거래소)</h2>
                    {fetchingStoreSummary && (
                      <Image
                        src="/loading.png"
                        alt="Loading"
                        width={20}
                        height={20}
                        className="rounded-lg w-5 h-5 animate-spin"
                      />
                    )}
                  </div>
                  <button
                    onClick={() => {
                      router.push('/' + params.lang + '/' + params.center + '/clearance-history');
                    }}
                    className="bg-[#3167b4] text-sm text-[#f3f4f6] px-4 py-2 rounded-lg hover:bg-[#3167b4]/80"
                  >
                    USDT 판매(거래소)
                  </button>

                </div>


                <div className="w-full flex flex-row items-center justify-end gap-2
                border-b-2 border-b-[#3167b4]">

                  {/* total number of trades, total buy amount krw, total usdt amount */}

                  <div className="flex flex-row items-center justify-center gap-2">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <h2 className="text-lg font-semibold">총 판매주문수</h2>
                      <p className="text-lg text-zinc-500">
                        {storeSummary.totalClearanceCount}
                      </p>
                    </div>
                    <div className="flex flex-col items-center justify-center gap-2">
                      <h2 className="text-lg font-semibold">총 판매금액(원)</h2>
                      <div className="flex flex-row items-center justify-end gap-2">
                        <p className="text-lg text-yellow-600"
                          style={{ fontFamily: 'monospace' }}>
                          {Number(storeSummary.totalClearanceKrwAmount)?.toLocaleString()}
                        </p>
                        <span className="text-lg text-zinc-500">
                          원
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-center justify-center gap-2">
                      <h2 className="text-lg font-semibold">총 판매량(USDT)</h2>
                      <div className="flex flex-row items-center justify-center gap-2">
                        <Image
                          src="/icon-tether.png"
                          alt="Tether"
                          width={20}
                          height={20}
                          className="rounded-lg w-4 h-4"
                        />
                        <p className="text-lg text-[#409192]"
                          style={{ fontFamily: 'monospace' }}>
                          {Number(storeSummary.totalClearanceUsdtAmount).toFixed(3).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                        </p>
                      </div>
                    </div>
                  </div>

 
                </div>


                <div className="w-full flex flex-row items-center justify-end gap-2">
                  {/* latest trades table */}
                  <div className="w-full mt-4">
                    
                    <table className="min-w-full">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="
                          hidden xl:table-cell
                          px-4 py-2 text-left">판매번호</th>
                          <th className="px-4 py-2 text-left">구매자</th>
                          <th className="px-4 py-2 text-left">판매금액(원)</th>
                          <th className="px-4 py-2 text-left">판매량(USDT)</th>
                          {/*
                          <th className="px-4 py-2 text-left">판매상태</th>
                          */}
                          <th className="
                          hidden xl:table-cell
                          px-4 py-2 text-left">판매일시</th>
                        </tr>
                      </thead>
                      <tbody>
                        {storeSummary?.latestClearances?.map((trade, index) => (
                          <tr key={index} className="border-b">
                            <td className="
                            hidden xl:table-cell
                            px-4 py-2">#{trade.tradeId}</td>
                            <td className="px-4 py-2">
                              
                              {trade?.buyer?.depositName ? (
                                <div className="flex flex-col items-start justify-start gap-1">
                                  <span className="text-sm text-zinc-400">
                                    {trade?.buyer?.depositName || '입금자명 없음'}
                                  </span>
                                </div>
                              ) : (
                                <div className="flex flex-col items-start justify-start gap-1">
                                  <span className="text-sm text-zinc-400">
                                    {trade.seller?.bankInfo?.bankName || '은행명 없음'}
                                  </span>
                                  <span className="text-sm text-zinc-400">
                                    {trade.seller?.bankInfo?.accountHolder || '입금자명 없음'}
                                  </span>
                                </div>
                              )}

                            </td>

                            <td className="px-4 py-2">
                              <div className="w-20 flex flex-row items-center justify-end gap-1">
                                <span className="text-lg text-yellow-600"
                                  style={{ fontFamily: 'monospace' }}>
                                  {Number(trade.krwAmount)?.toLocaleString()}
                                </span>
                                <span className="text-sm text-zinc-500">
                                  원
                                </span>
                              </div>
                            </td>

                            <td className="px-4 py-2">
                              <div className="
                                w-20
                                flex flex-row items-center justify-between gap-2">
                                <Image
                                  src="/icon-tether.png"
                                  alt="Tether"
                                  width={20}
                                  height={20}
                                  className="rounded-lg w-4 h-4"
                                />
                                <span className="text-lg text-[#409192]"
                                  style={{ fontFamily: 'monospace' }}>
                                  {Number(trade.usdtAmount).toFixed(3).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                                </span>

                              </div>
                            </td>

                            {/*
                            <td className="px-4 py-2">
                              {trade.status === 'paymentConfirmed' && (
                                <span className="text-sm text-green-500 font-semibold">
                                  판매완료
                                </span>
                              )}
                              {trade.status === 'paymentRequested' && (
                                <span className="text-sm text-blue-500 font-semibold">  
                                  판매요청
                                </span>
                              )}
                            </td>
                            */}

                            <td className="
                            hidden xl:table-cell
                            px-4 py-2">
                              {new Date(trade.createdAt).toLocaleDateString()}
                              <br />
                              {new Date(trade.createdAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                                second: '2-digit'
                              })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>


              </div>
              )}




            </div>


            <div className="
            mt-5
            w-full flex flex-col xl:flex-row gap-5 items-start justify-start">
        

              <div className="w-full flex flex-col gap-0 items-center justify-between">

                <div className="w-full flex flex-row gap-2 items-center justify-start
                    rounded-t-lg
                    bg-[#3167b4]
                    p-2
                  ">
                      <Image
                        src="/icon-mypage.png"
                        alt="USDT"
                        width={35}
                        height={35}
                        className="rounded-lg w-6 h-6"
                      />
                      <span className="text-sm md:text-lg text-white">
                        마이 페이지
                      </span>
                </div>

                <div className="w-full flex flex-col gap-2 items-center justify-center
                      bg-white p-2
                      rounded-b-lg
                  ">
                  

                    <div className="mt-4 flex flex-row justify-center items-center">


                      {address && loadingUser ? (

                        <div className="flex flex-row justify-center items-center">
                          <Image
                            src="/loading.png"
                            alt="Loading"
                            width={35}
                            height={35}
                            className="animate-spin"
                          />
                        </div>

                      ) : (

                        <>

                          {user?.nickname ? (

                            <div className="flex flex-row gap-2 justify-center items-center">
                              
                              <span className="text-3xl font-semibold text-zinc-800">
                                {user?.nickname}
                              </span>
                              
                              {/*
                              <button
                                // monospaced font
                                //style={{ fontFamily: "monospace" }}
                                className="mt-5 text-lg text-zinc-800 underline"
                                onClick={() => {

                                  if (!address) {
                                    toast.error(Please_connect_your_wallet_first);
                                    return;
                                  }

                                  // redirect to settings page
                                  router.push(
                                    "/" + params.lang + "/" + storecode + "/profile-settings"
                                  );

                                } }
                              >
                                {nickname}
                              </button>
                              */}

                              {userCode && (
                                <Image
                                  src="/verified.png"
                                  alt="Verified"
                                  width={20}
                                  height={20}
                                  className="rounded-lg"
                                />
                              )}
                              {seller && (
                                <Image
                                  src="/icon-seller.png"
                                  alt="Seller"
                                  width={20}
                                  height={20}
                                />
                              )}

                              <div className="flex flex-col gap-5 justify-center items-center">
                                <button

                                  onClick={() => {

                                    if (!address) {
                                      toast.error(Please_connect_your_wallet_first);
                                      return;
                                    }

                                    // redirect to settings page
                                    router.push(
                                      "/" + params.lang + "/" + params.center + "/profile-settings"
                                    );


                                  }}
                                  //className="text-zinc-800 underline"
                                  className="bg-[#3167b4] text-white px-4 py-2 rounded-lg hover:bg-[#3167b4]/80"
                                >

                                  프로필 설정

                                </button>

                                {/*
                                <button

                                  onClick={() => {

                                    if (!address) {
                                      toast.error(Please_connect_your_wallet_first);
                                      return;
                                    }

                                    // redirect to settings page
                                    router.push(
                                      "/" + params.lang + "/" + params.center + "/seller-settings"
                                    );


                                  }}
                                  //className="text-zinc-800 underline"
                                  className="bg-[#3167b4] text-white px-4 py-2 rounded-lg hover:bg-[#3167b4]/80"
                                  >

                                  판매자 회원 결제용 통장 설정하기

                                </button>
                                */}

                         

                                {/*
                                <button

                                  onClick={() => {

                                    if (!address) {
                                      toast.error(Please_connect_your_wallet_first);
                                      return;
                                    }

                                    // redirect to settings page
                                    router.push(
                                      "/" + params.lang + "/" + params.center + "/seller-clearance-settings"
                                    );


                                  }}
                                  //className="text-zinc-800 underline"
                                  className="bg-[#3167b4] text-white px-4 py-2 rounded-lg hover:bg-[#3167b4]/80"
                                  >

                                  출금통장(USDT 판매용) 설정하기

                                </button>
                                */}
                                





                              </div>
                              



                            </div>
                          ) : (

                            <div className="flex flex-col gap-2 justify-center items-center">

                              {address && (
                                <span className="text-sm text-red-500">
                                  아이디이 설정되지 않았습니다.<br/>
                                  거래를 시작하려면 아이디를 설정해야 합니다.
                                </span>
                              )}

                              <div className="flex flex-col gap-2 justify-center items-center">
                                <button

                                  onClick={() => {

                                    if (!address) {
                                      toast.error(Please_connect_your_wallet_first);
                                      return;
                                    }

                                    // redirect to settings page
                                    router.push(
                                      "/" + params.lang + "/admin/profile-settings"
                                    );


                                  }}
                                  className="bg-[#3167b4] text-white px-4 py-2 rounded-lg hover:bg-[#3167b4]/80"
                                >

                                  프로필 설정

                                </button>

                                {/*
                                <button

                                  onClick={() => {

                                    if (!address) {
                                      toast.error(Please_connect_your_wallet_first);
                                      return;
                                    }

                                    // redirect to settings page
                                    router.push(
                                      "/" + params.lang + "/admin/seller-settings"
                                    );


                                  }}
                                  className="bg-[#3167b4] text-white px-4 py-2 rounded-lg hover:bg-[#3167b4]/80"
                                  >

                                  판매자 설정

                                </button>
                                */}



                              </div>
                            

                            </div>
                          )}

                        </>

                      )}


                    </div>



                </div>



              </div>


            </div>




          </div>


          
        </div>

        
      )}


       
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


      </main>

  );


};




