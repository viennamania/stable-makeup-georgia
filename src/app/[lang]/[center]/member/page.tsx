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
import { getDictionary } from "../../../dictionaries";

import { ClassNames } from "@emotion/react";


import useSound from 'use-sound';


import { useSearchParams } from 'next/navigation';


import { paymentUrl } from "../../../config/payment";

import { version } from "../../../config/version";



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


/*
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
*/
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
  useEffect(() => {
    setLimitValue(limit || 20);
  }, [limit]);

  // page number
  const [pageValue, setPageValue] = useState(page || 1);
  useEffect(() => {
    setPageValue(page || 1);
  }, [page]);



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
              /////walletAddress: address,
            }),
        });

        const data = await response.json();

        //console.log("data", data);

        if (data.result) {

          setStore(data.result);

          setStoreAdminWalletAddress(data.result?.adminWalletAddress);

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

    // interval to fetch store every 10 seconds
    const interval = setInterval(() => {
      fetchData();
    } , 5000);
    return () => clearInterval(interval);

  } , [params.center]);





  const [searchBuyer, setSearchBuyer] = useState("");
  
  const [searchDepositName, setSearchDepositName] = useState("");
  

  // fetch all buyer user 
  const [fetchingAllBuyer, setFetchingAllBuyer] = useState(false);
  const [allBuyer, setAllBuyer] = useState([] as any[]);

  const fetchAllBuyer = async () => {
    if (fetchingAllBuyer) {
      return;
    }
    setFetchingAllBuyer(true);
    
    //const response = await fetch('/api/user/getAllBuyersByStorecode', {
    const response = await fetch('/api/user/getAllBuyers', {


      method: 'POST',
      headers: {
          'Content-Type': 'application/json',
      },
      body: JSON.stringify(
        {
          storecode: params.center,

          search: searchBuyer,
          depositName: searchDepositName,

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
  
  
  
  

  const [userPassword, setUserPassword] = useState('');
  const [userName, setUserName] = useState('');
  const [userBankDepositName, setUserBankDepositName] = useState('');
  const [userBankName, setUserBankName] = useState('');
  const [userBankAccountNumber, setUserBankAccountNumber] = useState('');
  const [userType, setUserType] = useState('test');



  const [insertingUserCode, setInsertingUserCode] = useState(false);
  const insertBuyer = async () => {
    if (insertingUserCode) {
      return;
    }


    let generatedUserCode = userCode;
    
    if (userCode === '') {

      
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

    }

  
    

    //console.log('generatedUserCode', generatedUserCode);


    setInsertingUserCode(true);
    const response = await fetch('/api/user/setBuyerWithoutWalletAddressByStorecode', {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json',
      },
      body: JSON.stringify(
        {
          storecode: params.center,
          walletAddress: address,
          userCode: generatedUserCode,
          userPassword: userPassword,
          userName: userName,
          userBankDepositName: userBankDepositName,
          userBankName: userBankName,
          userBankAccountNumber: userBankAccountNumber,
          userType: userType,
        }
      ),
    });
    if (!response.ok) {
      setInsertingUserCode(false);
      toast.error('회원 아이디 추가에 실패했습니다.');
      return;
    }

    setInsertingUserCode(false);

    const data = await response.json();
    
    //console.log('setBuyerWithoutWalletAddressByStorecode data', data);

    if (data.result) {
      toast.success('회원 아이디가 추가되었습니다.');
      setUserCode('');
      setUserPassword('');
      setUserName('');
      setUserBankDepositName('');
      setUserBankName('');
      setUserBankAccountNumber('');
      setUserType('test');


      // fetch all buyer user
      fetchAllBuyer();
    } else {
      toast.error('회원 아이디 추가에 실패했습니다.');
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



  const [usdtBalance, setUsdtBalance] = useState([] as any[]);
  allUsers.forEach((user) => {
    usdtBalance.push(0);
  });



  const getBalanceOfWalletAddress = async (walletAddress: string) => {
  

    const balance = await balanceOf({
      contract,
      address: walletAddress,
    });
    
    console.log('getBalanceOfWalletAddress', walletAddress, 'balance', balance);

    toast.success(`잔액이 업데이트되었습니다. 잔액: ${(Number(balance) / 10 ** 6).toFixed(3)} USDT`);

    /*
    setAllUsers((prev) => {
      const newUsers = [...prev];
      const index = newUsers.findIndex(u => u.walletAddress === walletAddress);
      if (index !== -1) {
        newUsers[index] = {
          ...newUsers[index],
          usdtBalance: Number(balance) / 10 ** 6,
        };
      }
      return newUsers;
    });
    */
    // update the usdtBalance of the user
    setUsdtBalance((prev) => {
      const newUsdtBalance = [...prev];
      const index = allUsers.findIndex(u => u.walletAddress === walletAddress);
      if (index !== -1) {
        newUsdtBalance[index] = Number(balance) / 10 ** 6; // Convert to USDT
      }
      return newUsdtBalance;
    });




    return Number(balance) / 10 ** 6; // Convert to USDT

  };



  // clearanceWalletAddress
  const [clearanceingWalletAddress, setClearanceingWalletAddress] = useState([] as boolean[]);
  for (let i = 0; i < 100; i++) {
    clearanceingWalletAddress.push(false);
  }

  const clearanceWalletAddress = async (walletAddress: string) => {
    
    if (clearanceingWalletAddress.includes(true)) {
      return;
    }

    // api call to clear the wallet address
    setClearanceingWalletAddress((prev) => {
      const newClearanceing = [...prev];
      const index = newClearanceing.findIndex(u => u === false);
      if (index !== -1) {
        newClearanceing[index] = true;
      }
      return newClearanceing;
    });

    const response = await fetch('/api/user/clearanceWalletAddress', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        walletAddress: walletAddress,
      }),
    });

    if (!response.ok) {
      setClearanceingWalletAddress((prev) => {
        const newClearanceing = [...prev];
        const index = newClearanceing.findIndex(u => u === true);
        if (index !== -1) {
          newClearanceing[index] = false;
        }
        return newClearanceing;
      });
      toast.error('지갑 주소 정산에 실패했습니다.');
      return;
    }

    const data = await response.json();
    //console.log('clearanceWalletAddress data', data);
    if (data.result) {
      toast.success('지갑 주소 정산이 완료되었습니다.');
      // update the balance of the user
      getBalanceOfWalletAddress(walletAddress);
    } else {
      toast.error('지갑 주소 정산에 실패했습니다.');
    }
    setClearanceingWalletAddress((prev) => {
      const newClearanceing = [...prev];
      const index = newClearanceing.findIndex(u => u === true);
      if (index !== -1) {
        newClearanceing[index] = false;
      }
      return newClearanceing;
    });
    return data.result;
  };



 




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








  // check table view or card view
  const [tableView, setTableView] = useState(true);



  const [selectedItem, setSelectedItem] = useState<any>(null);





  // array of depositAmountKrw
  const [depositAmountKrw, setDepositAmountKrw] = useState([] as number[]);
  for (let i = 0; i < 100; i++) {
    depositAmountKrw.push(0);
  }




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

          <div className="text-lg text-gray-500">가맹점 정보를 불러오는 중...</div>
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


            <div className={`w-full flex flex-col xl:flex-row items-center justify-start gap-2
              p-2 rounded-lg mb-4
              ${store?.backgroundColor ?
                "bg-" + store.backgroundColor + " " :
                "bg-black/10"
              }`}>


              <div className="w-full flex flex-row items-center justify-start gap-2">
                <Image
                  src={store?.storeLogo || "/logo.png"}
                  alt="logo"
                  width={35}
                  height={35}
                  className="rounded-lg w-6 h-6"
                />
                {address && address === storeAdminWalletAddress && (
                  <div className="text-sm text-[#3167b4] font-bold">
                    {store?.storeName + " (" + store?.storecode + ") 가맹점 관리자"}
                  </div>
                )}
                {address && address !== storeAdminWalletAddress && (
                  <div className="text-sm text-[#3167b4] font-bold">
                    {store?.storeName + " (" + store?.storecode + ")"}
                  </div>
                )}

              </div>


              {address && !loadingUser && (


                <div className="w-full flex flex-row items-center justify-end gap-2">
                  <button
                    onClick={() => {
                      router.push('/' + params.lang + '/' + params.center + '/profile-settings');
                    }}
                    className="flex bg-[#3167b4] text-sm text-[#f3f4f6] px-4 py-2 rounded-lg hover:bg-[#3167b4]/80"
                  >
                    {user?.nickname || "프로필"}
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
        )}


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


      </div>

    </main>


    );
  }




  // if store.adminWalletAddress is same as address, return "가맹점 관리자" else return "가맹점"
  // if user?.role is not "admin", return "가맹점"

  
  if (
    (
      address
    && store
    
    &&  address !== store.adminWalletAddress

    && user?.role !== "admin")
    

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
            className="rounded-lg w-6 h-6"
          />
          <div className="text-sm text-[#3167b4] font-bold">
            {store?.storeName + " (" + store?.storecode + ") 가맹점 관리자가 아닙니다."}
          </div>
        </div>

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

    <main className="p-4 pb-10 min-h-[100vh] flex items-start justify-center container max-w-screen-2xl mx-auto">


      <div className="py-0 w-full">


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
                      className="rounded-lg w-5 h-5 object-cover"
                  />
                  <span className="text-sm text-zinc-50">
                    {
                      store && store?.storeName + " (" + store?.storecode + ")"
                    }
                  </span>

                </div>

              </button>


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



            {/*
            <div className="w-full flex flex-col items-end justify-end gap-2
            border-b border-zinc-300 pb-2">

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
                      w-32
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

                  <div className="flex flex-row gap-2 items-center">
                    <span className="text-sm text-zinc-500 font-semibold">
                      오늘 수수료 차감량
                    </span>
                    <div className="
                      w-32
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
            */}





            <div className="grid grid-cols-2 xl:grid-cols-4 gap-2 mb-4">


                  <div className='flex w-32 items-center justify-center gap-2
                    bg-yellow-500 text-[#3167b4] text-sm rounded-lg p-2'>
                      <Image
                        src="/icon-user.png"
                        alt="Trade"
                        width={35}
                        height={35}
                        className="w-4 h-4"
                      />
                      <div className="text-sm font-semibold">
                        회원관리
                      </div>
                  </div>

                  <button
                      onClick={() => router.push('/' + params.lang + '/' + params.center + '/buyorder')}
                      className="flex w-32 bg-[#3167b4] text-[#f3f4f6] text-sm rounded-lg p-2 items-center justify-center
                      hover:bg-[#3167b4]/80
                      hover:cursor-pointer
                      hover:scale-105
                      transition-transform duration-200 ease-in-out
                      ">
                      구매주문관리
                  </button>

                  <button
                      onClick={() => router.push('/' + params.lang + '/' + params.center + '/trade-history')}
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
                      onClick={() => router.push('/' + params.lang + '/' + params.center + '/clearance-history')}
                      className="flex w-32 bg-[#3167b4] text-[#f3f4f6] text-sm rounded-lg p-2 items-center justify-center
                      hover:bg-[#3167b4]/80
                      hover:cursor-pointer
                      hover:scale-105
                      transition-transform duration-200 ease-in-out
                      ">
                      판매(거래소)
                  </button>
                  )}

                  {version !== 'bangbang' && (
                  <button
                    onClick={() => router.push('/' + params.lang + '/' + params.center + '/clearance-request')}
                    className="flex w-32 bg-[#3167b4] text-[#f3f4f6] text-sm rounded-lg p-2 items-center justify-center
                    hover:bg-[#3167b4]/80
                    hover:cursor-pointer
                    hover:scale-105
                    transition-transform duration-200 ease-in-out
                    ">
                      출금(회원)
                  </button>
                  )}

                  <button
                    onClick={() => router.push('/' + params.lang + '/' + params.center + '/daily-close')}
                    className="flex w-32 bg-[#3167b4] text-[#f3f4f6] text-sm rounded-lg p-2 items-center justify-center
                    hover:bg-[#3167b4]/80
                    hover:cursor-pointer
                    hover:scale-105
                    transition-transform duration-200 ease-in-out
                    ">
                      통계(일별)
                  </button>


            </div>





            <div className='flex flex-row items-center space-x-4'>
                <Image
                  src="/icon-user.png"
                  alt="Buyer"
                  width={35}
                  height={35}
                  className="w-6 h-6"
                />

                <div className="text-xl font-semibold">
                  회원관리
                </div>

            </div>




            <div className="w-full flex flex-col xl:flwx-row items-start justify-center gap-2 mt-4">


  
                <div className="flex flex-row items-center justify-start gap-2">  
                  <Image
                    src="/icon-homepage.png"
                    alt="Homepage"
                    width={20}
                    height={20}
                    className="rounded-lg w-6 h-6"
                  />
                  <span className="text-sm text-zinc-500">
                    회원 홈페이지
                  </span>
                </div>
                <div className="flex flex-row items-center justify-start gap-2">
                  <button
                    onClick={() => {
                      window.open(`${paymentUrl}/${params.lang}/${clientId}/${store?.storecode}/paymaster`, '_blank');
                    }}
                    className="text-sm text-zinc-500 underline"
                  >
                    {paymentUrl + '/' + params.lang + '/' + clientId + '/' + store?.storecode + '/paymaster'}
                  </button>

                  {/* 복사 버튼 */}
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`${paymentUrl}/${params.lang}/${clientId}/${store?.storecode}/center`);
                      toast.success('가맹점 홈페이지 링크가 복사되었습니다.');
                    }}
                    className="bg-[#3167b4] text-sm text-[#f3f4f6] px-2 py-1 rounded-lg hover:bg-[#3167b4]/80"
                  >
                    복사
                  </button>
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


              <div className="w-full flex flex-col xl:flex-row items-center justify-between gap-5 mt-4">

                {/* 바이어 추가 input and button */}
                <div className="
                  w-full xl:w-1/2
                  flex flex-col xl:flex-col items-center justify-center gap-2">


                  <div className="flex flex-row items-center justify-start gap-2">

                    <input
                      disabled={insertingUserCode}
                      type="text"
                      value={userCode}
                      onChange={(e) => {


                        setUserCode(e.target.value);

                      } }
                      placeholder="회원 아이디"
                      className="w-full p-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />

                    {/* userPassword */}
                    <input
                      disabled={insertingUserCode}
                      type="text"
                      value={userPassword}
                      onChange={(e) => setUserPassword(e.target.value)}
                      placeholder="회원 비밀번호"
                      className="w-full p-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />


        
                    <input
                      disabled={insertingUserCode}
                      type="text"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      placeholder="회원 이름"
                      className="w-full p-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />

                  </div>


                  <div className="flex flex-row items-center justify-start gap-2">


                    {/* userBankDepositName */}
                    <input
                      disabled={insertingUserCode}
                      type="text"
                      value={userBankDepositName}
                      onChange={(e) => setUserBankDepositName(e.target.value)}
                      placeholder="회원 입금자명"
                      className="w-full p-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />



                    {/* userBankName */}
                    <select
                      disabled={insertingUserCode}
                      value={userBankName}
                      onChange={(e) => setUserBankName(e.target.value)}
                      className="w-full p-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="" selected={userBankName === ""}>
                        은행선택
                      </option>
                      <option value="카카오뱅크" selected={userBankName === "카카오뱅크"}>
                        카카오뱅크
                      </option>
                      <option value="케이뱅크" selected={userBankName === "케이뱅크"}>
                        케이뱅크
                      </option>
                      <option value="토스뱅크" selected={userBankName === "토스뱅크"}>
                        토스뱅크
                      </option>
                      <option value="국민은행" selected={userBankName === "국민은행"}>
                        국민은행
                      </option>
                      <option value="우리은행" selected={userBankName === "우리은행"}>
                        우리은행
                      </option>
                      <option value="신한은행" selected={userBankName === "신한은행"}>
                        신한은행
                      </option>
                      <option value="농협" selected={userBankName === "농협"}>
                        농협
                      </option>
                      <option value="새마을금고" selected={userBankName === "새마을금고"}>
                        새마을금고
                      </option>
                      <option value="우체국" selected={userBankName === "우체국"}>
                        우체국
                      </option>
                      <option value="산림조합" selected={userBankName === "산림조합"}>
                        산림조합
                      </option>
                      <option value="SC제일은행" selected={userBankName === "SC제일은행"}>
                        SC제일은행
                      </option>
                      <option value="기업은행" selected={userBankName === "기업은행"}>
                        기업은행
                      </option>
                      <option value="하나은행" selected={userBankName === "하나은행"}>
                        하나은행
                      </option>
                      <option value="외환은행" selected={userBankName === "외환은행"}>
                        외환은행
                      </option>
                      <option value="부산은행" selected={userBankName === "부산은행"}>
                        부산은행
                      </option>
                      <option value="경남은행" selected={userBankName === "경남은행"}>
                        경남은행
                      </option>
                      <option value="대구은행" selected={userBankName === "대구은행"}>
                        대구은행
                      </option>
                      <option value="전북은행" selected={userBankName === "전북은행"}>
                        전북은행
                      </option>
                      <option value="경북은행" selected={userBankName === "경북은행"}>
                        경북은행
                      </option>
                      <option value="광주은행" selected={userBankName === "광주은행"}>
                        광주은행
                      </option>
                      <option value="제주은행" selected={userBankName === "제주은행"}>
                        제주은행
                      </option>
                      <option value="수협" selected={userBankName === "수협"}>
                        수협
                      </option>
                      <option value="신협" selected={userBankName === "신협"}>
                        신협
                      </option>
                      <option value="저축은행" selected={userBankName === "저축은행"}>
                        저축은행
                      </option>
                      <option value="씨티은행" selected={userBankName === "씨티은행"}>
                        씨티은행
                      </option>
                      <option value="대신은행" selected={userBankName === "대신은행"}>
                        대신은행
                      </option>
                      <option value="동양종합금융" selected={userBankName === "동양종합금융"}>
                        동양종합금융
                      </option>
                      <option value="산업은행" selected={userBankName === "산업은행"}>
                        산업은행
                      </option>
                    </select>

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
                    className={`bg-[#3167b4] text-sm text-white px-4 py-2 rounded-lg w-full
                      ${insertingUserCode ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {insertingUserCode ? '회원추가 중...' : '회원추가'}
                  </button>
                </div>






                <div className="flex flex-row items-center gap-2">


                  <div className="flex flex-col xl:flex-row items-center justify-center gap-2">
                    {/* search nickname */}
                    <div className="flex flex-row items-center gap-2">
                      <input
                        type="text"
                        value={searchBuyer}
                        onChange={(e) => setSearchBuyer(e.target.value)}
                        placeholder="회원아이디"
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
                  </div>


                  {/* 검색 버튼 */}
                  <div className="
                  w-32
                  flex flex-row items-center gap-2">
                    <button
                      onClick={() => {
                        setPageValue(1);
                        fetchAllBuyer();
                      }}
                      className="bg-[#3167b4] text-white px-4 py-2 rounded-lg w-full"
                      disabled={fetchingAllBuyer}
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
                          {fetchingAllBuyer ? '검색중...' : '검색'}
                        </span>
                      </div>

                    </button>
                  </div>
                  
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
                        <th className="p-2">등록일</th>
                        <th className="p-2">회원아이디</th>
                        <th className="p-2">회원 통장</th>
                        <th className="p-2">구매수(건)</th>
                        <th className="p-2 text-right">
                          구매량(USDT)
                          <br />
                          구매금액(원)
                        </th>
                        <th className="p-2">충전금액</th>
                        <th className="p-2">회원 결제페이지</th>
                        <th className="p-2">회원 USDT지갑</th>
                        <th className="p-2">주문상태</th>
                        <th className="p-2">잔액확인</th>
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
                            {new Date(item.createdAt).toLocaleDateString('ko-KR', {
                              year: 'numeric',
                              month: '2-digit',
                              day: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                            })}
                          </td>

                          <td className="p-2">
                            {item.nickname}
                          </td>

                          <td className="p-2">
                            <div className="flex flex-col items-end justify-center gap-1">
                              <span className="text-sm text-zinc-500">
                                {item?.buyer?.depositBankName}
                              </span>
                              <span className="text-sm text-zinc-500">
                                {item?.buyer?.depositBankAccountNumber}
                              </span>
                              <span className="text-sm text-zinc-500">
                                {item?.buyer?.depositName}
                              </span>
                            </div>
                          </td>

                          <td className="p-2">
                            <div className="w-20 flex flex-col items-end justify-center gap-1">
                              {item?.totalPaymentConfirmedCount || 0}
                            </div>
                          </td>
                          <td className="p-2">
                            <div className="
                              mr-5
                              w-48
                              flex flex-col items-end justify-center gap-1">

                              <div className="w-full flex flex-row items-center justify-end gap-1">
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
                                Number(item?.totalPaymentConfirmedUsdtAmount ?
                                  item?.totalPaymentConfirmedUsdtAmount
                                  : 0)
                                  .toFixed(3).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                                }
                                </span>
                              </div>
                              <div className="w-full flex flex-row items-center justify-end gap-1">
                                <span className="text-lg text-yellow-600 font-semibold"
                                  style={{ fontFamily: 'monospace' }}
                                >
                                {item?.totalPaymentConfirmedKrwAmount && item?.totalPaymentConfirmedKrwAmount.toLocaleString('ko-KR') || 0}
                                </span>
                              </div>

                            </div>
                          </td>

                          <td className="p-2">
                            <div className="flex flex-col xl:flex-row items-start justify-center gap-2">
                              <input
                                type="text"
                                value={depositAmountKrw[index]}
                                onChange={(e) => {
                                  setDepositAmountKrw((prev) => {
                                    const newDepositAmountKrw = [...prev];
                                    newDepositAmountKrw[index] = Number(e.target.value);
                                    return newDepositAmountKrw;
                                  });
                                }}
                                placeholder="충전금액"
                                className="w-full p-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3167b4]"
                              />
                            </div>
                          </td>



                          <td className="p-2">

                            <div className="
                              w-64
                              flex flex-col items-center justify-center gap-2">

                              <div className="w-full flex flex-row items-center justify-between gap-2">

                                {/* Modal open */}
                                <button
                                  onClick={() => {
                                    setSelectedItem({
                                      ...item,
                                      depositAmountKrw: depositAmountKrw[index],
                                    });
                                    openModal();
                                  }}
                                  className="w-full bg-[#3167b4] text-sm text-white px-2 py-1 rounded-lg
                                    hover:bg-[#3167b4]/80"
                                >
                                  보기
                                </button>



                                {/* 복사 버튼 */}
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(
                                      paymentUrl + '/' + params.lang + '/' + clientId + '/' + item.storecode + '/payment?'
                                      + 'storeUser=' + item.nickname
                                      + '&depositBankName='+ item?.buyer?.depositBankName
                                      + '&depositBankAccountNumber=' + item?.buyer?.depositBankAccountNumber
                                      + '&depositName=' + item?.buyer?.depositName
                                      + '&depositAmountKrw=' + depositAmountKrw[index]
                                    );
                                    toast.success('회원 결제페이지 링크가 복사되었습니다.');
                                  }}
                                  className="w-full bg-[#3167b4] text-sm text-white px-2 py-1 rounded-lg
                                    hover:bg-[#3167b4]/80"
                                >
                                  링크 복사
                                </button>

                              </div>

                              <div className="w-full flex flex-row items-center justify-between gap-2">


                                {/* copy javascript code */}
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(
                                      `<script src="${paymentUrl}/${params.lang}/${clientId}/${item.storecode}/payment?storeUser=${item.nickname}&depositBankName=${item?.buyer?.depositBankName}&depositBankAccountNumber=${item?.buyer?.depositBankAccountNumber}&depositName=${item?.buyer?.depositName}&depositAmountKrw=${depositAmountKrw[index]}">결제하기</script>`
                                    );
                                    toast.success('회원 결제페이지 스크립트가 복사되었습니다.');
                                  }}
                                  className="w-full bg-[#3167b4] text-sm text-white px-2 py-1 rounded-lg
                                    hover:bg-[#3167b4]/80"
                                >
                                  스크립트 복사
                                </button>
                                      


                                {/* 새창 열기 버튼 */}
                                <button
                                  onClick={() => {
                                    window.open(
                                      paymentUrl + '/' + params.lang + '/' + clientId + '/' + item.storecode + '/payment?'
                                      + 'storeUser=' + item.nickname
                                      + '&depositBankName=' + item?.buyer?.depositBankName
                                      + '&depositBankAccountNumber=' + item?.buyer?.depositBankAccountNumber
                                      + '&depositName=' + item?.buyer?.depositName
                                      + '&depositAmountKrw=' + depositAmountKrw[index]
                                      ,
                                      '_blank'
                                    );
                                    toast.success('회원 홈페이지를 새창으로 열었습니다.');
                                  }}
                                  className="w-full bg-[#3167b4] text-sm text-white px-2 py-1 rounded-lg
                                    hover:bg-[#3167b4]/80"
                                >
                                  새창열기
                                </button>

                              </div>


                            </div>

                          </td>


                          <td className="p-2">
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(item?.walletAddress);
                                toast.success(Copied_Wallet_Address);
                              } }
                              className="text-sm text-zinc-500 underline"
                            >
                            {
                                item?.walletAddress && (
                                  item.walletAddress.substring(0, 6) + '...' + item.walletAddress.substring(item.walletAddress.length - 4)
                                )
                              }
                            </button>
                          </td>

 
                          <td className="p-2">
                            <div className="
                              w-32
                              flex flex-col xl:flex-row items-start justify-center gap-2">
                              <span className="text-sm text-zinc-500">
                                {
                                item?.buyOrderStatus === 'ordered' ? (
                                  <span className="text-lg text-yellow-500 font-semibold">
                                    구매주문
                                  </span>
                                ) : item?.buyOrderStatus === 'accepted' ? (
                                  <span className="text-lg text-green-500 font-semibold">
                                    판매자확정
                                  </span>
                                ) : item?.buyOrderStatus === 'paymentRequested' ? (
                                  <span className="text-lg text-red-500 font-semibold">
                                    결제요청
                                  </span>
                                ) : item?.buyOrderStatus === 'paymentConfirmed' ? (
                                  <span className="text-lg text-green-500 font-semibold">
                                    결제완료
                                  </span>
                                ) : item?.buyOrderStatus === 'cancelled' ? (
                                  <span className="text-lg text-red-500 font-semibold">
                                    거래취소
                                  </span>
                                ) : ''
                                }

                              </span>
                            </div>
                          </td>

                          {/* 잔고확인 버튼 */}
                          {/* USDT 잔액 */}
                          <td className="p-2">
                            <div className="w-24
                              flex flex-col items-between justify-between gap-2">

                              {/*
                              <div className="w-full flex flex-col items-center justify-center gap-2">

                                <span className="text-lg text-[#409192]"
                                  style={{ fontFamily: 'monospace' }}
                                >
                                  {usdtBalance[index] ?
                                    usdtBalance[index].toFixed(3).replace(/\B(?=(\d{3})+(?!\d))/g, ',') : '0.000'}{' USDT'}
                                </span>
         
                              </div>
                              */}


                              {/* button to getBalance of USDT */}
                              <button
                                //disabled={!isAdmin || insertingStore}
                                onClick={() => {
                                  //if (!isAdmin || insertingStore) return;
                                  //getBalance(item.storecode);

                                  getBalanceOfWalletAddress(item.walletAddress);
          

                                  //toast.success('잔액을 가져왔습니다.');

                                  // toast usdtBalance[index] is updated
                                  //toast.success(`잔액을 가져왔습니다. 현재 잔액: ${usdtBalance[index] ? usdtBalance[index].toFixed(3).replace(/\B(?=(\d{3})+(?!\d))/g, ',') : '0.000'} USDT`);

                                }}
                                className={`
                                  w-full mb-2
                                  bg-[#3167b4] text-sm text-white px-2 py-1 rounded-lg
                                  hover:bg-[#3167b4]/80
                                `}
                              >
                                잔액 확인하기
                              </button>


                              {/* function call button clearanceWalletAddress */}
                              <button
                                onClick={() => {
                                  clearanceWalletAddress(item.walletAddress);
                                  toast.success('잔액을 회수했습니다.');
                                }}
                                className={`
                                  w-full mb-2
                                  bg-[#3167b4] text-sm text-white px-2 py-1 rounded-lg
                                  hover:bg-[#3167b4]/80
                                `}
                              >
                                잔액 회수하기
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
                    
                    router.push(`/${params.lang}/${params.center}/member?limit=${Number(e.target.value)}&page=${page}`)

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
                
                router.push(`/${params.lang}/${params.center}/member?limit=${Number(limit)}&page=${Number(page) - 1}`);

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
                
                router.push(`/${params.lang}/${params.center}/member?limit=${Number(limit)}&page=${Number(page) + 1}`);

              }}
            >
              다음
            </button>

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

        
        <ModalUser isOpen={isModalOpen} onClose={closeModal}>
            <UserHomePage
                closeModal={closeModal}
                selectedItem={selectedItem}
            />
        </ModalUser>
        


      </main>

  );


};



const UserHomePage = (
  {
      closeModal = () => {},
      selectedItem = null as {
        nickname: string; storecode: string; buyer?: {
          depositBankName?: string; depositName?: string; depositBankAccountNumber?: string;
        }; depositAmountKrw?: number;
      } | null,
  }
) => {

  return (
    <div className="w-full flex flex-col items-center justify-center gap-4">
      <h1 className="text-2xl font-semibold">회원 결제페이지</h1>
      
      {/* iframe */}
      <iframe
        src={`${paymentUrl}/ko/${clientId}/${selectedItem?.storecode}/payment?`
          + 'storeUser=' + selectedItem?.nickname
          + '&depositBankName=' + selectedItem?.buyer?.depositBankName
          + '&depositBankAccountNumber=' + selectedItem?.buyer?.depositBankAccountNumber
          + '&depositName=' + selectedItem?.buyer?.depositName
          + '&depositAmountKrw=' + selectedItem?.depositAmountKrw}

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
  */}


