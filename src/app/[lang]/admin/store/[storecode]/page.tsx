'use client';

import { useState, useEffect, use, act } from "react";

import Image from "next/image";



// open modal

import ModalUser from '@/components/modal-user';

import { useRouter }from "next//navigation";


import { toast } from 'react-hot-toast';

import { client } from "../../../../client";



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
  getUserEmail,
  getUserPhoneNumber,
} from "thirdweb/wallets/in-app";


import { balanceOf, transfer } from "thirdweb/extensions/erc20";
import { add } from "thirdweb/extensions/farcaster/keyGateway";
 


import AppBarComponent from "@/components/Appbar/AppBar";
import { getDictionary } from "../../../../dictionaries";
//import Chat from "@/components/Chat";
import { ClassNames } from "@emotion/react";


import useSound from 'use-sound';
import { it } from "node:test";
import { get } from "http";


import { useSearchParams } from 'next/navigation';





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

  } , [address, contract, params.storecode]);











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
        chain: params.storecode,
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
          chain: params.storecode,
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
          chain: params.storecode,
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

  } , [address, escrowWalletAddress, contract, params.storecode]);
  

  //console.log('escrowBalance', escrowBalance);







  


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
                  storecode: "admin",
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
          storecode: params.storecode,
        }
      ),
    });
    if (!response.ok) {
      setFetchingStore(false);
      return;
    }
    const data = await response.json();
    
    //console.log('getAllUsersByStorecode data', data);

    setStore(data.result);
    setFetchingStore(false);

    return data.result;
  }

  useEffect(() => {

    fetchStore();
  } , [params.storecode]);





  // fetch all buyer user 
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
          storecode: params.storecode,
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

    //console.log('getAllBuyersByStorecode data', data);

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





  {/*
  {"storecode":"teststorecode","storeName":"테스트상점","storeType":"test","storeUrl":"https://test.com","storeDescription":"설명입니다.","storeLogo":"https://test.com/logo.png","storeBanner":"https://test.com/banner.png"}
  */}


  // insert buyer user
  const [userCode, setUserCode] = useState('');
  const [userName, setUserName] = useState('');
  const [userBankName, setUserBankName] = useState('');
  const [userBankAccountNumber, setUserBankAccountNumber] = useState('');
  const [userType, setUserType] = useState('test');



  const [insertingUserCode, setInsertingUserCode] = useState(false);
  const insertBuyer = async () => {
    if (insertingUserCode) {
      return;
    }


    // generate user code
    // start with lowercase alphabet
    // lowercase alphabet and number
    // generate random user code with 4 ~ 20 characters
    
    
    //const randomString = (Math.random().toString(36).substring(2, 10)).toLowerCase();

    // randomString is lowercase alphabet
    let randomString = '';
    const characters = 'abcdefghijklmnopqrstuvwxyz';
    for (let i = 0; i < 8; i++) {
      randomString += characters.charAt(Math.floor(Math.random() * characters.length));
    }

    const randomNumber = Math.floor(Math.random() * 1000);
    const generatedUserCode = randomString + randomNumber;

    //console.log('generatedUserCode', generatedUserCode);


    setInsertingUserCode(true);
    const response = await fetch('/api/user/setBuyerWithoutWalletAddressByStorecode', {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json',
      },
      body: JSON.stringify(
        {
          storecode: params.storecode,
          walletAddress: address,
          userCode: userCode || generatedUserCode,
          userName: userName,
          userBankName: userBankName,
          userBankAccountNumber: userBankAccountNumber,
          userType: userType,
        }
      ),
    });
    if (!response.ok) {
      setInsertingUserCode(false);
      toast.error('회원아이디 추가에 실패했습니다.');
      return;
    }

    setInsertingUserCode(false);

    const data = await response.json();
    
    //console.log('setBuyerWithoutWalletAddressByStorecode data', data);

    if (data.result) {
      toast.success('회원아이디가 추가되었습니다.');
      setUserCode('');
      setUserName('');
      setUserBankName('');
      setUserBankAccountNumber('');
      setUserType('test');


      // fetch all buyer user
      fetchAllBuyer();
    } else {
      toast.error('회원아이디 추가에 실패했습니다.');
    }


    return;
  }




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
          storecode: params.storecode,
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
          storecode: params.storecode,
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

  


  // check table view or card view
  const [tableView, setTableView] = useState(true);



  const [selectedItem, setSelectedItem] = useState<any>(null);

  return (

    <main className="p-4 pb-10 min-h-[100vh] flex items-start justify-center container max-w-screen-xl mx-auto">


      <div className="py-0 w-full">


        <div className="w-full flex flex-row gap-2 items-center justify-start text-zinc-500 text-lg"
        >
            {/* go back button */}
            <div className="w-full flex justify-start items-center gap-2">
                <button
                    onClick={() => window.history.back()}
                    className="flex items-center justify-center bg-gray-200 rounded-full p-2">
                    <Image
                        src="/icon-back.png"
                        alt="Back"
                        width={20}
                        height={20}
                        className="rounded-full"
                    />
                </button>
                {/* title */}
                <span className="text-sm text-gray-500 font-semibold">
                    돌아가기
                </span>
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

            {address && !loadingUser && (
                <div className="w-full flex flex-row items-center justify-end gap-2">

                  <div className="hidden flex-row items-center justify-center gap-2">

                      <button
                          className="text-lg text-zinc-600 underline"
                          onClick={() => {
                              navigator.clipboard.writeText(address);
                              toast.success(Copied_Wallet_Address);
                          } }
                      >
                          {address.substring(0, 6)}...{address.substring(address.length - 4)}
                      </button>
                      
                      <Image
                          src="/icon-shield.png"
                          alt="Wallet"
                          width={100}
                          height={100}
                          className="w-6 h-6"
                      />

                  </div>

                  <div className="hidden flex-row items-center justify-end  gap-2">
                      <span className="text-2xl xl:text-4xl font-semibold text-[#409192]">
                          {Number(balance).toFixed(2)}
                      </span>
                      {' '}
                      <span className="text-sm">USDT</span>
                  </div>


                  <button
                    onClick={() => {
                      router.push('/' + params.lang + '/' + params.center + '/profile-settings');
                    }}
                    className="flex bg-[#3167b4] text-sm text-[#f3f4f6] px-4 py-2 rounded-lg hover:bg-[#3167b4]/80"
                  >
                    {user?.nickname || "프로필"}
                  </button>


                  {/* logout button */}
                  {/*
                  <button
                      onClick={() => {
                          confirm("로그아웃 하시겠습니까?") && activeWallet?.disconnect()
                          .then(() => {

                              toast.success('로그아웃 되었습니다');

                              //router.push(
                              //    "/" + params.lang + "/" + params.center
                              //);
                          });
                      } }

                      className="flex bg-[#3167b4] text-sm text-[#f3f4f6] px-4 py-2 rounded-lg hover:bg-[#3167b4]/80"
                  >
                      <span className="text-sm">
                      로그아웃
                      </span>
                  </button>
                  */}

              </div>
            )}

        </div>


        <div className="flex flex-col items-start justify-center space-y-4">

            <div className='flex flex-row items-center space-x-4'>
                <Image
                  src={store?.storeLogo || "/icon-franchise.png"}
                  alt="Franchise"
                  width={35}
                  height={35}
                  className="w-10 h-10"
                />

                <div className="text-xl font-semibold">
                  {
                    store && store.storeName + " (" + store.storecode + ")"
                  } 관리
                </div>



            </div>

            <div className="flex flex-row items-start justify-start gap-2">
                {/* link new window */}
                {/* https://cryptoss.beauty/ko/[storecode] */}
                <Image
                  src="/icon-homepage.png"
                  alt="Homepage"
                  width={20}
                  height={20}
                  className="w-5 h-5"
                />

                <div className="flex flex-col xl:flex-row items-center justify-start gap-2">
                  <span className="text-sm text-zinc-500">
                    가맹점 관리자 홈페이지
                  </span>
                  <button
                    onClick={() => {
                      window.open(`https://cryptoss.beauty/ko/${store?.storecode}/center`, '_blank');
                    }}
                    className="text-sm text-zinc-500 underline"
                  >
                    https://cryptoss.beauty/ko/{store?.storecode}/center
                  </button>
                </div>
                {/* 복사 버튼 */}
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`https://cryptoss.beauty/ko/${store?.storecode}/center`);
                    toast.success('가맹점 홈페이지 링크가 복사되었습니다.');
                  } }
                  className="bg-[#3167b4] text-sm text-[#f3f4f6] px-2 py-1 rounded-lg hover:bg-[#3167b4]/80"
                >
                  복사
                </button>

            </div>

            {/* store adminWalletAddress */}
            <div className="flex flex-row items-start justify-start gap-2">
                <Image
                  src="/icon-manager.png"
                  alt="Manager"
                  width={20}
                  height={20}
                  className="w-5 h-5"
                />


                <div className="flex flex-col xl:flex-row items-center justify-start gap-2">

                  <span className="text-sm text-zinc-500">
                    가맹점 관리자
                  </span>
                  {!fetchingStore && store && store.adminWalletAddress ? (
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(store?.adminWalletAddress);
                        toast.success(Copied_Wallet_Address);
                      } }
                      className="text-xs text-zinc-500 underline"
                    >
                      {store && store.adminWalletAddress.substring(0, 6)}...{store && store.adminWalletAddress.substring(store.adminWalletAddress.length - 4)}
                    </button>
                  ) : (
                    <span className="text-sm text-red-500">
                      {store && store.storeName}의 가맹점 관리자가 설정되지 않았습니다.
                    </span>
                  )}

                  {fetchingStore && (
                    <Image
                      src="/loading.png"
                      alt="Loading"
                      width={20}
                      height={20}
                      className="animate-spin"
                    />
                  )}

                  {!fetchingStore && allUsers && allUsers.length > 0 ? (
                  
                    <div className="flex flex-row items-center justify-center gap-2">
                      {/* select list of all users */}
                      <select
                        value={selectedAdminWalletAddress}
                        onChange={(e) => setSelectedAdminWalletAddress(e.target.value)}
                        className="w-36 p-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500
                          bg-white text-zinc-500 text-sm"
                        disabled={updatingAdminWalletAddress}
                      >
                        <option value="">가맹점 관리자 변경</option>
                        {allUsers.map((user) => (
                          <option key={user._id} value={user.walletAddress}>
                            {user.nickname} ({user.walletAddress.substring(0, 6)}...{user.walletAddress.substring(user.walletAddress.length - 4)})
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => {
                          if (!selectedAdminWalletAddress) {
                            toast.error('가맹점 관리자 지갑을 선택하세요.');
                            return;
                          }
                          if (selectedAdminWalletAddress === store?.adminWalletAddress) {
                            toast.error('현재 가맹점 관리자 지갑과 동일합니다.');
                            return;
                          }
                          /*
                          if (selectedAdminWalletAddress === address) {
                            toast.error('본인 지갑으로 변경할 수 없습니다.');
                            return;
                          }
                          */
                          confirm(
                            `정말 ${selectedAdminWalletAddress}로 가맹점 관리자를 변경하시겠습니까?`
                          ) && updateAdminWalletAddress();
                        }}
                        className={`bg-[#3167b4] text-white px-4 py-2 rounded-lg w-full
                          ${updatingAdminWalletAddress ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {updatingAdminWalletAddress ? '변경 중...' : '변경'}
                      </button> 
                    </div>
                  ) : (
                    <span className="text-sm text-red-500">
                      {store && store.storeName}의 회원이 없습니다.
                      <br />
                      가맹점 홈페이지에서 회원가입 후 가맹점 관리자를 설정하세요.
                    </span>
                  )}



                </div>



            </div>




              <div className="w-full flex flex-col xl:flex-row items-start justify-between gap-3">

     




                <div className="w-full flex flex-row items-center justify-end gap-5">


                  <div className="flex flex-col gap-2 items-center">
                    <div className="text-sm">{Total}</div>
                    <div className="flex flex-row items-center gap-2">
                      {
                        fetchingAllBuyer ? (
                          <Image
                            src="/loading.png"
                            alt="Loading"
                            width={20}
                            height={20}
                            className="animate-spin"
                          />
                        ) : (
                          totalCount
                        )
                      }
                    </div>
                  </div>


                </div>


              </div>


              <div className="w-full flex flex-col xl:flex-row items-center justify-between gap-2 mt-4">

                {/* 바이어 추가 input and button */}
                <div className="flex flex-row items-center gap-5 mt-4">

                  <div className="flex flex-col xl:flex-row items-center justify-start gap-2">
                    <input
                      disabled={insertingUserCode}
                      type="text"
                      value={userCode}
                      onChange={(e) => {


                        setUserCode(e.target.value);

                      } }
                      placeholder="회원아이디"
                      className="hidden w-full p-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      disabled={insertingUserCode}
                      type="text"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      placeholder="회원 입금자명"
                      className="w-full p-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />

                    {/* userBankName */}
                    <input
                      disabled={insertingUserCode}
                      type="text"
                      value={userBankName}
                      onChange={(e) => setUserBankName(e.target.value)}
                      placeholder="회원 은행명"
                      className="w-full p-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />

                    {/* userBankAccountNumber */}
                    <input
                      disabled={insertingUserCode}
                      type="text"
                      value={userBankAccountNumber}
                      onChange={(e) => setUserBankAccountNumber(e.target.value)}
                      placeholder="회원 계좌번호"
                      className="w-full p-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
              
                  
                  <button
                    disabled={insertingUserCode}
                    onClick={() => {

                      // check if store code already exists
                      if (allBuyer.find((item) => item.nickname === userCode)) {
                        toast.error('회원아이디가 이미 존재합니다.');
                        return;
                      }

                      // check if store name length is less than 2
                      if (userName.length < 2) {
                        toast.error('회원 이름은 2자 이상이어야 합니다.');
                        return;
                      }
                      // check if store name length is less than 20
                      if (userName.length > 10) {
                        toast.error('회원 이름은 10자 이하여야 합니다.');
                        return;
                      }

                      confirm(
                        `정말 ${userCode} (${userName})을 추가하시겠습니까?`
                      ) && insertBuyer();

                    }}
                    className={`bg-[#3167b4] text-white px-4 py-2 rounded-lg
                      ${insertingUserCode ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {insertingUserCode ? '회원추가 중...' : '회원추가'}
                  </button>
                </div>

                {/* search bar */}
                {/* search nickname */}
                <div className="flex flex-row items-center gap-2">
                  <input
                    type="text"
                    value={searchNickname}
                    onChange={(e) => setSearchNickname(e.target.value)}
                    placeholder="회원 검색"
                    className="w-full p-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3167b4]"
                  />

                  <button
                    onClick={() => {
                      setPageValue(1);
                      //fetchAllStore();
                      fetchAllBuyer();
                    }}
                    className="bg-[#3167b4] text-white px-4 py-2 rounded-lg w-full"

                    disabled={fetchingAllBuyer}
                  >
                    {fetchingAllBuyer ? '검색중...' : '검색'}
                  </button>

                </div>



              </div>




              {/*
              {"storecode":"teststorecode","storeName":"테스트상점","storeType":"test","storeUrl":"https://test.com","storeDescription":"설명입니다.","storeLogo":"https://test.com/logo.png","storeBanner":"https://test.com/banner.png"}
              */}

              {/* table view is horizontal scroll */}
              {tableView ? (


                <div className="w-full overflow-x-auto">

                  <table className=" w-full table-auto border-collapse border border-zinc-800 rounded-md">

                    <thead
                      className="bg-zinc-800 text-white text-sm font-semibold"
                      style={{
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                      }}
                    >
                      <tr>
                        <th className="p-2">회원아이디</th>
                        <th className="p-2">
                          회원 입금자명
                        </th>
                        <th className="
                          hidden lg:table-cell
                          p-2">
                          회원 은행명
                        </th>
                        <th className="
                          hidden lg:table-cell
                          p-2">
                          회원 계좌번호
                        </th>
                        <th className="p-2">회원 홈페이지</th>
                        <th className="
                          hidden lg:table-cell
                          p-2">
                          회원 USDT지갑주소
                        </th>
                      </tr>
                    </thead>

                    {/* if my trading, then tr has differenc color */}
                    <tbody>

                      {allBuyer.map((item, index) => (

                        
                        <tr key={index} className={`
                          ${
                            index % 2 === 0 ? 'bg-zinc-100' : 'bg-zinc-200'
                          }
                        `}>
                        

                        <td className="p-2">
                            {item.nickname}
                          </td>
                          <td className="p-2">
                            {item?.buyer?.depositName}
                          </td>
                          <td className="
                            hidden lg:table-cell
                            p-2">
                            {item?.buyer?.depositBankName}
                          </td>
                          <td className="
                            hidden lg:table-cell
                            p-2">
                            {item?.buyer?.depositBankAccountNumber}
                          </td>


                          <td className="p-2">

                            <div className="flex flex-row items-center justify-start gap-2">

                              {/*}
                              <button
                                onClick={() => {
                                  window.open(
                                    'https://cryptoss.beauty/' + params.lang + '/' + item.storecode + '/payment?'
                                    + 'storeUser=' + item.nickname + '&depositBankName=' + item?.buyer?.depositBankName + '&depositName=' + item?.buyer?.depositName,
                                    '_blank'
                                  );
                                  toast.success('회원 홈페이지를 새창으로 열었습니다.');
                                }}
                                className="bg-[#3167b4] text-sm text-white px-2 py-1 rounded-lg
                                  hover:bg-[#3167b4]/80"
                              >
                                보기
                              </button>
                              */}

                              {/* Modal open */}
                              <button
                                onClick={() => {
                                  openModal();
                                  setSelectedItem(item);
                                }}
                                className="bg-[#3167b4] text-sm text-white px-2 py-1 rounded-lg
                                  hover:bg-[#3167b4]/80"
                              >
                                보기
                              </button>



                              {/* 복사 버튼 */}
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(
                                    'https://cryptoss.beauty/' + params.lang + '/' + item.storecode + '/payment?'
                                    + 'storeUser=' + item.nickname + '&depositBankName=' + item?.buyer?.depositBankName
                                    + '&depositBankAccountNumber=' + item?.buyer?.depositBankAccountNumber
                                    + '&depositName=' + item?.buyer?.depositName
                                  );
                                  toast.success('회원 홈페이지 링크가 복사되었습니다.');
                                }}
                                className="bg-[#3167b4] text-sm text-white px-2 py-1 rounded-lg
                                  hover:bg-[#3167b4]/80"
                              >
                                링크 복사
                              </button>
                            </div>

                          </td>


                          <td className="
                            hidden lg:table-cell
                            p-2">
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(item?.walletAddress);
                                toast.success(Copied_Wallet_Address);
                              } }
                              className="text-xs text-zinc-500 underline"
                            >
                            {
                                item?.walletAddress && (
                                  item.walletAddress.substring(0, 6) + '...' + item.walletAddress.substring(item.walletAddress.length - 4)
                                )
                              }
                            </button>
                          </td>

 





                        </tr>

                      ))}

                    </tbody>

                  </table>

                </div>


              ) : (

                <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

                  {allBuyer.map((item, index) => (
                    <div key={index} className="bg-white shadow-md rounded-lg p-4">
                      <h2 className="text-lg font-semibold">{item.nickname}</h2>

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
                    
                    router.push(`/${params.lang}/admin/store/${params.storecode}?limit=${Number(e.target.value)}&page=${page}`)

                  }

                  className="text-sm bg-zinc-800 text-zinc-200 px-2 py-1 rounded-md"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>


            <button
              disabled={Number(page) <= 1}
              className={`text-sm text-white px-4 py-2 rounded-md ${Number(page) <= 1 ? 'bg-gray-500' : 'bg-green-500 hover:bg-green-600'}`}
              onClick={() => {
                
                router.push(`/${params.lang}/admin/store/${params.storecode}?limit=${Number(limit)}&page=${Number(page) - 1}`);

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
                
                router.push(`/${params.lang}/admin/store/${params.storecode}?limit=${Number(limit)}&page=${Number(page) + 1}`);

              }}
            >
              다음
            </button>

          </div>


          





          
        </div>

        
        <ModalUser isOpen={isModalOpen} onClose={closeModal}>
            <UserHomePage
                closeModal={closeModal}
                selectedItem={selectedItem}
            />
        </ModalUser>
        


      </main>

  );


};



/*
selectedItem?.buyer?.depositBankName
selectedItem?.buyer?.depositName
'https://cryptoss.beauty/' + params.lang + '/' + selectedItem.storecode + '/payment?'
'storeUser=' + selectedItem.nickname + '&depositBankName=' + selectedItem?.buyer?.depositBankName + '&depositName=' + selectedItem?.buyer?.depositName


'https://cryptoss.beauty/' + params.lang + '/' + item.storecode + '/payment?'
                                    + 'storeUser=' + item.nickname + '&depositBankName=' + item?.buyer?.depositBankName + '&depositName=' + item?.buyer?.depositName
*/

const UserHomePage = (
  {
      closeModal = () => {},
      selectedItem = null as { nickname: string; storecode: string; buyer?: {
        depositBankName?: string;
        depositBankAccountNumber?: string;
        depositName?: string
      } } | null,
  }
) => {

  return (
    <div className="w-full flex flex-col items-center justify-center gap-4">
      <h1 className="text-2xl font-semibold">회원 홈페이지</h1>
      
      {/* iframe */}
      <iframe
        src={`https://cryptoss.beauty/ko/${selectedItem?.storecode}/payment?`
          + 'storeUser=' + selectedItem?.nickname
          + '&depositBankName=' + selectedItem?.buyer?.depositBankName
          + '&depositBankAccountNumber=' + selectedItem?.buyer?.depositBankAccountNumber
          + '&depositName=' + selectedItem?.buyer?.depositName}
        width="400px"
        height="500px"
        className="border border-zinc-300 rounded-lg"
        title="User Home Page"
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
{/*
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
  */}


