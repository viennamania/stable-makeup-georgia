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

  store: any,
  storecode: string;

  paymentUrl: string;
}


/*
const wallets = [
  inAppWallet({
    auth: {
      options: ["email", "google"],
    },
  }),
];
*/
const wallets = [
    inAppWallet({
      auth: {
        options: ["email", "google"],
      },
    }),
  ];
  
const BANK_OPTIONS = [
  '카카오뱅크',
  '케이뱅크',
  '토스뱅크',
  '국민은행',
  '우리은행',
  '신한은행',
  '농협',
  '새마을금고',
  '우체국',
  '산림조합',
  '기업은행',
  '하나은행',
  '외환은행',
  'SC제일은행',
  '부산은행',
  '경남은행',
  '대구은행',
  '전북은행',
  '경북은행',
  '광주은행',
  '제주은행',
  '수협',
  '신협',
  '저축은행',
  '씨티은행',
  '대신은행',
  '동양종합금융',
  'JT친애저축은행',
  '산업은행',
];

const MEMBER_TYPE_OPTIONS = [
  { value: '', label: '일반 회원' },
  { value: 'AAA', label: '1등급 회원' },
  { value: 'BBB', label: '2등급 회원' },
  { value: 'CCC', label: '3등급 회원' },
  { value: 'DDD', label: '4등급 회원' },
];



// get escrow wallet address

//const escrowWalletAddress = "0x2111b6A49CbFf1C8Cc39d13250eF6bd4e1B59cF6";



const contractAddress = "0xc2132D05D31c914a87C6611C10748AEb04B58e8F"; // USDT on Polygon
const contractAddressArbitrum = "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9"; // USDT on Arbitrum




export default function Index({ params }: any) {




  const searchParams = useSearchParams()!;
 
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

  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);

  const closeAddMemberModal = () => setIsAddMemberModalOpen(false);
  const openAddMemberModal = () => setIsAddMemberModalOpen(true);

  
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


  const [storePaymentUrl, setStorePaymentUrl]
    = useState(paymentUrl + '/' + params.lang + '/' + clientId + '/' + params.center + '/payment');


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
  
            data.result?.paymentUrl && setStorePaymentUrl(data.result?.paymentUrl);

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
  
    } , [params.center, address]);





  const [searchBuyer, setSearchBuyer] = useState("");
  
  const [searchDepositName, setSearchDepositName] = useState("");
  const [searchUserType, setSearchUserType] = useState("all");
  

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
          userType: searchUserType,

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
  } , [address, params.center, limitValue, pageValue]);





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
  const [userType, setUserType] = useState('');



  const [insertingUserCode, setInsertingUserCode] = useState(false);
  const insertBuyer = async () => {
    if (insertingUserCode) {
      return;
    }

    const trimmedUserCode = userCode.trim();
    if (!trimmedUserCode) {
      toast.error('회원 아이디를 입력해주세요.');
      return;
    }

  
    

    //console.log('trimmedUserCode', trimmedUserCode);


    setInsertingUserCode(true);
    const response = await fetch('/api/user/insertBuyerWithoutWalletAddressByStorecode', {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json',
      },
      body: JSON.stringify(
        {
          storecode: params.center,
          walletAddress: address,
          userCode: trimmedUserCode,
          userPassword: userPassword,
          userName: userName,
          userBankDepositName: userBankDepositName,
          userBankName: userBankName,
          userBankAccountNumber: userBankAccountNumber,
          userType: userType,
        }
      ),
    });
    const data = await response.json();

    if (!response.ok) {
      setInsertingUserCode(false);
      toast.error(data?.error || '회원 아이디 추가에 실패했습니다.');
      return;
    }

    setInsertingUserCode(false);
    
    //console.log('setBuyerWithoutWalletAddressByStorecode data', data);

    if (data.result) {
      toast.success('회원 아이디가 추가되었습니다.');
      setUserCode('');
      setUserPassword('');
      setUserName('');
      setUserBankDepositName('');
      setUserBankName('');
      setUserBankAccountNumber('');
      setUserType('');
      setIsAddMemberModalOpen(false);


      // fetch all buyer user
      fetchAllBuyer();
    } else {
      toast.error('회원 아이디 추가에 실패했습니다.');
    }


    return;
  }

  const submitInsertBuyer = () => {
    const trimmedUserCode = userCode.trim();
    if (!trimmedUserCode) {
      toast.error('회원 아이디를 입력해주세요.');
      return;
    }
    if (userName.length < 2) {
      toast.error('회원 이름은 2자 이상이어야 합니다.');
      return;
    }
    if (userName.length > 10) {
      toast.error('회원 이름은 10자 이하여야 합니다.');
      return;
    }

    if (!confirm(`정말 ${trimmedUserCode} (${userName})을 추가하시겠습니까?`)) {
      return;
    }

    insertBuyer();
  };




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
  } , [address, params.center]);

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








  // check table view or card view
  const [tableView, setTableView] = useState(true);
  const [isMobileViewport, setIsMobileViewport] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const mediaQuery = window.matchMedia('(max-width: 1023px)');
    const handleViewportChange = () => {
      const isMobile = mediaQuery.matches;
      setIsMobileViewport(isMobile);
      setTableView(!isMobile);
    };

    handleViewportChange();

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleViewportChange);
      return () => mediaQuery.removeEventListener('change', handleViewportChange);
    }

    mediaQuery.addListener(handleViewportChange);
    return () => mediaQuery.removeListener(handleViewportChange);
  }, []);



  const [selectedItem, setSelectedItem] = useState<any>(null);





  // array of depositAmountKrw
  const [depositAmountKrw, setDepositAmountKrw] = useState([] as number[]);
  for (let i = 0; i < 100; i++) {
    depositAmountKrw.push(0);
  }




  if (fetchingStore) {
    return (
      <main className="p-4 pb-10 min-h-[100vh] flex items-start justify-center bg-slate-100/60">
        <div className="py-0 w-full max-w-screen-2xl flex flex-col items-center justify-center gap-4">

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
      <main className="p-4 pb-10 min-h-[100vh] flex items-start justify-center bg-slate-100/60">
        <div className="py-0 w-full max-w-screen-2xl flex flex-col items-center justify-center gap-4">
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
   <main className="p-4 pb-10 min-h-[100vh] flex items-start justify-center bg-slate-100/60">


      <div className="py-0 w-full max-w-screen-2xl">


        {params.center && (


            <div className={`w-full flex flex-col sm:flex-row items-center justify-start gap-2
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

              {/*
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
              */}

              {/*
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
              */}



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


        {/* 로그인을 해야합니다. */}
        <div className="w-full flex flex-col items-center justify-center gap-4
          mt-20
        ">

          <Image
            src="/banner-login.gif"
            alt="Login"
            width={200}
            height={200}
          />

          <div className="text-lg text-gray-500">로그인을 해야합니다.</div>
          <div className="text-sm text-gray-400">지갑 연결 후, 가맹점 관리자에게 회원 가입을 요청하세요.</div>

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

  const topMenuButtonClassName = `
    h-11 w-full min-w-0 px-4 rounded-xl border border-slate-200
    bg-slate-50 text-slate-700 text-sm font-medium
    hover:bg-slate-100 hover:border-slate-300 transition-colors
    md:w-auto md:min-w-[120px]
  `;











  return (

    <main className="p-4 pb-10 min-h-[100vh] flex items-start justify-center bg-slate-100/60">


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



      <div className="py-0 w-full max-w-screen-2xl space-y-4">


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
                  <div className="w-full flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2">

                    <button
                      onClick={() => {
                        router.push('/' + params.lang + '/' + params.center + '/profile-settings');
                      }}
                      className="
                      w-full sm:w-auto
                      flex items-center justify-center
                      bg-[#3167b4] text-sm text-[#f3f4f6] px-4 py-2 rounded-lg hover:bg-[#3167b4]/80"
                    >
                      <div className="
                        w-full sm:w-48
                        flex flex-row items-center justify-center gap-2">
                        <span className="text-sm text-zinc-50">
                          {user?.nickname || "프로필"}
                        </span>
                        {isAdmin && (
                          <div className="flex flex-row items-center justify-center gap-1">
                            <Image
                              src="/icon-admin.png"
                              alt="Admin"
                              width={20}
                              height={20}
                              className="rounded-lg w-5 h-5"
                            />
                            <span className="text-xs sm:text-sm text-yellow-500">
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
                          w-full sm:w-32
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

              {version !== 'bangbang' && (
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
              )}

            </div>
            */}





            <div className="mb-4 rounded-2xl border border-slate-200 bg-white/90 p-3 shadow-sm">
              <div className="grid grid-cols-2 gap-2 md:flex md:flex-row md:flex-nowrap md:gap-2 md:overflow-x-auto">
                <div className="col-span-2 md:col-span-1 h-11 flex items-center justify-center gap-2 px-4 rounded-xl border border-[#1f4f94] bg-[#1f4f94] text-sm font-semibold text-white shadow-sm md:w-auto md:min-w-[120px]">
                  <Image
                    src="/icon-user.png"
                    alt="Member"
                    width={16}
                    height={16}
                    className="w-4 h-4"
                  />
                  회원관리
                </div>

                <button
                  onClick={() => router.push('/' + params.lang + '/' + params.center + '/buyorder')}
                  className={topMenuButtonClassName}
                >
                  구매주문관리
                </button>

                <button
                  onClick={() => router.push('/' + params.lang + '/' + params.center + '/trade-history')}
                  className={topMenuButtonClassName}
                >
                  P2P 거래내역
                </button>

                {version !== 'bangbang' && (
                  <button
                    onClick={() => router.push('/' + params.lang + '/' + params.center + '/clearance-history')}
                    className={topMenuButtonClassName}
                  >
                    판매(거래소)
                  </button>
                )}

                {version !== 'bangbang' && (
                  <button
                    onClick={() => router.push('/' + params.lang + '/' + params.center + '/clearance-request')}
                    className={topMenuButtonClassName}
                  >
                    출금(회원)
                  </button>
                )}

                <button
                  onClick={() => router.push('/' + params.lang + '/' + params.center + '/daily-close')}
                  className={topMenuButtonClassName}
                >
                  통계(일별)
                </button>
              </div>
            </div>





            <div className="w-full rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1f4f94]/10">
                    <Image
                      src="/icon-user.png"
                      alt="Buyer"
                      width={22}
                      height={22}
                      className="h-5 w-5"
                    />
                  </div>
                  <div className="flex flex-col">
                    <div className="text-lg font-semibold text-slate-900">
                      회원관리
                    </div>
                    <span className="text-xs text-slate-500">
                      회원 등록, 조회, 등급 검색
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4">
                    <span className="text-xs font-medium text-slate-500">{Total}</span>
                    {fetchingAllBuyer ? (
                      <Image
                        src="/loading.png"
                        alt="Loading"
                        width={16}
                        height={16}
                        className="h-4 w-4 animate-spin"
                      />
                    ) : (
                      <span className="text-sm font-semibold text-slate-900">{totalCount}</span>
                    )}
                  </div>

                  <button
                    onClick={openAddMemberModal}
                    className="h-11 rounded-xl bg-[#1f4f94] px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#173d72]"
                  >
                    회원추가하기
                  </button>
                </div>
              </div>

              <div className="mt-4 flex flex-col gap-2 xl:flex-row xl:items-center xl:justify-between">
                <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-2 xl:flex xl:flex-row xl:items-center">
                  <input
                    type="text"
                    value={searchBuyer}
                    onChange={(e) => setSearchBuyer(e.target.value)}
                    placeholder="회원 아이디"
                    className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#3167b4]/35"
                  />

                  <input
                    type="text"
                    value={searchDepositName}
                    onChange={(e) => setSearchDepositName(e.target.value)}
                    placeholder="입금자명"
                    className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#3167b4]/35"
                  />

                  <select
                    value={searchUserType}
                    onChange={(e) => setSearchUserType(e.target.value)}
                    className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#3167b4]/35"
                  >
                    <option value="all">회원등급: 전체</option>
                    <option value="normal">회원등급: 일반등급</option>
                    <option value="AAA">회원등급: 1등급</option>
                    <option value="BBB">회원등급: 2등급</option>
                    <option value="CCC">회원등급: 3등급</option>
                    <option value="DDD">회원등급: 4등급</option>
                  </select>
                </div>

                <div className="w-full xl:w-auto xl:min-w-[120px]">
                  <button
                    onClick={() => {
                      setPageValue(1);
                      fetchAllBuyer();
                    }}
                    className="h-11 w-full rounded-xl bg-[#1f4f94] px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#173d72] disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={fetchingAllBuyer}
                  >
                    <div className="flex flex-row items-center justify-center gap-2">
                      <Image
                        src="/icon-search.png"
                        alt="Search"
                        width={18}
                        height={18}
                        className="h-4 w-4"
                      />
                      <span>
                        {fetchingAllBuyer ? '검색중...' : '검색'}
                      </span>
                    </div>

                  </button>
                </div>
              </div>

              <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-xs text-slate-500">
                  {isMobileViewport ? '모바일 화면: 카드형 목록' : '웹 화면: 테이블 목록'}
                </span>

                <div className="inline-flex rounded-xl border border-slate-200 bg-slate-100 p-1">
                  <button
                    onClick={() => setTableView(true)}
                    className={`h-8 rounded-lg px-3 text-xs font-semibold transition-colors ${
                      tableView
                        ? 'bg-white text-slate-800 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    테이블
                  </button>
                  <button
                    onClick={() => setTableView(false)}
                    className={`h-8 rounded-lg px-3 text-xs font-semibold transition-colors ${
                      !tableView
                        ? 'bg-white text-slate-800 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    카드
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
                      <th className="p-2">회원 아이디</th>
                      <th className="p-2">회원등급</th>
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
                          <div className="
                            w-24
                            flex flex-col items-start justify-center">
                            <span className="text-sm font-semibold">
                              {new Date(item.createdAt).toLocaleDateString('ko-KR', {
                                year: 'numeric',
                                month: '2-digit',
                                day: '2-digit',
                              })}
                            </span>
                            <span className="text-sm font-semibold">
                              {new Date(item.createdAt).toLocaleTimeString('ko-KR', {
                                hour: '2-digit',
                                minute: '2-digit',
                                second: '2-digit',
                              })}
                            </span>
                          </div>
                        </td>

                        <td className="p-2">
                          {item.nickname}
                        </td>

                        {/* userType */}
                        {/* '', 'AAA', 'BBB', 'CCC', 'DDD', 'EEE' */}
                        {/* if '' or not exists then '일반회원' */}
                        <td className="p-2">
                          <div className="
                          w-20
                          flex flex-col items-center justify-center">
                            {
                              item?.userType === 'AAA' ? (
                                <div className="
                                  text-xs text-white bg-red-500 px-1 rounded-md
                                  ">
                                  1등급
                                </div>
                              )
                              : item?.userType === 'BBB' ? (
                                <div className="
                                  text-xs text-white bg-orange-500 px-1 rounded-md
                                  ">
                                  2등급
                                </div>
                              )
                              : item?.userType === 'CCC' ? (
                                <div className="
                                  text-xs text-white bg-yellow-500 px-1 rounded-md
                                  ">
                                  3등급
                                </div>
                              )
                              : item?.userType === 'DDD' ? (
                                <div className="
                                  text-xs text-white bg-green-500 px-1 rounded-md
                                  ">
                                  4등급
                                </div>
                              )
                              : (
                                <div className="
                                  text-xs text-white bg-gray-500 px-1 rounded-md
                                  ">
                                  일반
                                </div>
                              )
                            }

                            <button
                              onClick={() => {
                                router.push(
                                  `/${params.lang}/admin/member-grade-settings?storecode=${item?.storecode}&walletAddress=${item?.walletAddress}`
                                );
                              }}
                              className="mt-2 bg-[#3167b4] text-sm text-white px-2 py-1 rounded-lg
                                hover:bg-[#3167b4]/80"
                            >
                              변경하기
                            </button>

                          </div>
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
                          <div className="w-16 flex flex-col items-end justify-center gap-1">
                            {item?.totalPaymentConfirmedCount || 0}
                          </div>
                        </td>
                        <td className="p-2">
                          <div className="
                            mr-5
                            w-32
                            flex flex-col items-end justify-center gap-1">

                            <div className="w-full flex flex-row items-center justify-end gap-1">
                              <Image
                                src="/icon-tether.png"
                                alt="Tether"
                                width={20}
                                height={20}
                                className="w-5 h-5"
                              />
                              <span className="text-lg text-[#409192]"
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
                              <span className="text-lg text-yellow-600"
                                style={{ fontFamily: 'monospace' }}
                              >
                              {item?.totalPaymentConfirmedKrwAmount && item?.totalPaymentConfirmedKrwAmount.toLocaleString('ko-KR') || 0}
                              </span>
                            </div>

                          </div>
                        </td>

                        <td className="p-2">
                          <div className="
                            w-32
                            flex flex-col sm:flex-row items-start justify-center gap-2">
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
                              {/*
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
                              */}



                              {/* 복사 버튼 */}
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(
                                    storePaymentUrl + '?'
                                    + 'storeUser=' + item.nickname
                                    + '&depositBankName='+ item?.buyer?.depositBankName
                                    + '&depositBankAccountNumber=' + item?.buyer?.depositBankAccountNumber
                                    + '&depositName=' + item?.buyer?.depositName
                                    + '&depositAmountKrw=' + depositAmountKrw[index]
                                    + '&accessToken=' + store?.accessToken
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
                                    `<script src="${storePaymentUrl}?storeUser=${item.nickname}&depositBankName=${item?.buyer?.depositBankName}&depositBankAccountNumber=${item?.buyer?.depositBankAccountNumber}&depositName=${item?.buyer?.depositName}&depositAmountKrw=${depositAmountKrw[index]}&accessToken=${store?.accessToken}">결제하기</script>`
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
                                    storePaymentUrl + '?'
                                    + 'storeUser=' + item.nickname
                                    + '&depositBankName=' + item?.buyer?.depositBankName
                                    + '&depositBankAccountNumber=' + item?.buyer?.depositBankAccountNumber
                                    + '&depositName=' + item?.buyer?.depositName
                                    + '&depositAmountKrw=' + depositAmountKrw[index]
                                    + '&accessToken=' + store?.accessToken
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
                          <div className="flex flex-row items-center justify-center gap-1">
                            <Image
                              src="/icon-shield.png"
                              alt="Wallet"
                              width={20}
                              height={20}
                              className="w-5 h-5"
                            />
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
                          </div>
                        </td>


                        <td className="p-2">
                          <div className="
                            w-28 
                            flex flex-col sm:flex-row items-start justify-center gap-2">
                            <span className="text-sm text-zinc-500">
                              {
                              item?.buyOrderStatus === 'ordered' ? (
                                <span className="text-sm text-yellow-500 font-semibold">
                                  구매주문
                                </span>
                              ) : item?.buyOrderStatus === 'accepted' ? (
                                <span className="text-sm text-green-500 font-semibold">
                                  판매자확정
                                </span>
                              ) : item?.buyOrderStatus === 'paymentRequested' ? (
                                <span className="text-sm text-red-500 font-semibold">
                                  결제요청
                                </span>
                              ) : item?.buyOrderStatus === 'paymentConfirmed' ? (
                                <span className="text-sm text-green-500 font-semibold">
                                  결제완료
                                </span>
                              ) : item?.buyOrderStatus === 'cancelled' ? (
                                <span className="text-sm text-red-500 font-semibold">
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

              <div className="w-full grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">

                {allBuyer.map((item, index) => (
                  <div key={index} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h2 className="truncate text-base font-semibold text-slate-900">{item.nickname}</h2>
                        <p className="text-xs text-slate-500">
                          {new Date(item.createdAt).toLocaleDateString('ko-KR')} {new Date(item.createdAt).toLocaleTimeString('ko-KR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>

                      <div>
                        {item?.userType === 'AAA' ? (
                          <div className="text-xs text-white bg-red-500 px-2 py-1 rounded-md">1등급</div>
                        ) : item?.userType === 'BBB' ? (
                          <div className="text-xs text-white bg-orange-500 px-2 py-1 rounded-md">2등급</div>
                        ) : item?.userType === 'CCC' ? (
                          <div className="text-xs text-white bg-yellow-500 px-2 py-1 rounded-md">3등급</div>
                        ) : item?.userType === 'DDD' ? (
                          <div className="text-xs text-white bg-green-500 px-2 py-1 rounded-md">4등급</div>
                        ) : (
                          <div className="text-xs text-white bg-gray-500 px-2 py-1 rounded-md">일반</div>
                        )}
                      </div>
                    </div>

                    <div className="mt-2">
                      <button
                        onClick={() => {
                          router.push(
                            `/${params.lang}/admin/member-grade-settings?storecode=${item?.storecode}&walletAddress=${item?.walletAddress}`
                          );
                        }}
                        className="w-full bg-[#3167b4] text-xs text-white px-2 py-2 rounded-lg hover:bg-[#3167b4]/80"
                      >
                        회원등급 변경하기
                      </button>
                    </div>

                    <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <div className="text-xs font-medium text-slate-500">회원 통장</div>
                      <div className="mt-1 text-sm text-slate-700">{item?.buyer?.depositBankName}</div>
                      <div className="text-sm text-slate-700">{item?.buyer?.depositBankAccountNumber}</div>
                      <div className="text-sm text-slate-700">{item?.buyer?.depositName}</div>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                        <div className="text-slate-500">구매수(건)</div>
                        <div className="mt-1 text-sm font-semibold text-slate-900">{item?.totalPaymentConfirmedCount || 0}</div>
                      </div>
                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                        <div className="text-slate-500">상태</div>
                        <div className="mt-1 text-sm font-semibold">
                          {
                            item?.buyOrderStatus === 'ordered' ? (
                              <span className="text-yellow-500">구매주문</span>
                            ) : item?.buyOrderStatus === 'accepted' ? (
                              <span className="text-green-500">판매자확정</span>
                            ) : item?.buyOrderStatus === 'paymentRequested' ? (
                              <span className="text-red-500">결제요청</span>
                            ) : item?.buyOrderStatus === 'paymentConfirmed' ? (
                              <span className="text-green-500">결제완료</span>
                            ) : item?.buyOrderStatus === 'cancelled' ? (
                              <span className="text-red-500">거래취소</span>
                            ) : (
                              <span className="text-slate-500">-</span>
                            )
                          }
                        </div>
                      </div>
                    </div>

                    <div className="mt-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">구매량</span>
                        <span className="font-semibold text-[#409192]">
                          {Number(item?.totalPaymentConfirmedUsdtAmount || 0).toFixed(3).replace(/\B(?=(\d{3})+(?!\d))/g, ',')} USDT
                        </span>
                      </div>
                      <div className="mt-1 flex items-center justify-between">
                        <span className="text-slate-500">구매금액</span>
                        <span className="font-semibold text-yellow-600">
                          {item?.totalPaymentConfirmedKrwAmount?.toLocaleString('ko-KR') || 0} 원
                        </span>
                      </div>
                    </div>

                    <div className="mt-3">
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
                        className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#3167b4]/35"
                      />
                    </div>

                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(
                            storePaymentUrl + '?'
                            + 'storeUser=' + item.nickname
                            + '&depositBankName='+ item?.buyer?.depositBankName
                            + '&depositBankAccountNumber=' + item?.buyer?.depositBankAccountNumber
                            + '&depositName=' + item?.buyer?.depositName
                            + '&depositAmountKrw=' + depositAmountKrw[index]
                            + '&accessToken=' + store?.accessToken
                          );
                          toast.success('회원 결제페이지 링크가 복사되었습니다.');
                        }}
                        className="rounded-lg bg-[#3167b4] px-2 py-2 text-xs font-semibold text-white hover:bg-[#3167b4]/80"
                      >
                        링크 복사
                      </button>

                      <button
                        onClick={() => {
                          window.open(
                            storePaymentUrl + '?'
                            + 'storeUser=' + item.nickname
                            + '&depositBankName=' + item?.buyer?.depositBankName
                            + '&depositBankAccountNumber=' + item?.buyer?.depositBankAccountNumber
                            + '&depositName=' + item?.buyer?.depositName
                            + '&depositAmountKrw=' + depositAmountKrw[index]
                            + '&accessToken=' + store?.accessToken
                            ,
                            '_blank'
                          );
                          toast.success('회원 홈페이지를 새창으로 열었습니다.');
                        }}
                        className="rounded-lg bg-[#3167b4] px-2 py-2 text-xs font-semibold text-white hover:bg-[#3167b4]/80"
                      >
                        새창열기
                      </button>

                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(
                            `<script src="${storePaymentUrl}?storeUser=${item.nickname}&depositBankName=${item?.buyer?.depositBankName}&depositBankAccountNumber=${item?.buyer?.depositBankAccountNumber}&depositName=${item?.buyer?.depositName}&depositAmountKrw=${depositAmountKrw[index]}&accessToken=${store?.accessToken}">결제하기</script>`
                          );
                          toast.success('회원 결제페이지 스크립트가 복사되었습니다.');
                        }}
                        className="col-span-2 rounded-lg bg-[#3167b4] px-2 py-2 text-xs font-semibold text-white hover:bg-[#3167b4]/80"
                      >
                        스크립트 복사
                      </button>
                    </div>

                    <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs text-slate-500">회원 USDT 지갑</span>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(item?.walletAddress);
                            toast.success(Copied_Wallet_Address);
                          }}
                          className="text-xs font-semibold text-[#3167b4] underline"
                        >
                          복사
                        </button>
                      </div>
                      <div className="mt-1 break-all text-xs text-slate-700">
                        {item?.walletAddress}
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <button
                        onClick={() => {
                          getBalanceOfWalletAddress(item.walletAddress);
                        }}
                        className="rounded-lg bg-[#3167b4] px-2 py-2 text-xs font-semibold text-white hover:bg-[#3167b4]/80"
                      >
                        잔액 확인하기
                      </button>

                      <button
                        onClick={() => {
                          clearanceWalletAddress(item.walletAddress);
                          toast.success('잔액을 회수했습니다.');
                        }}
                        className="rounded-lg bg-[#3167b4] px-2 py-2 text-xs font-semibold text-white hover:bg-[#3167b4]/80"
                      >
                        잔액 회수하기
                      </button>
                    </div>
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
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 sm:gap-4">


            <div className="flex flex-row items-center gap-2">
                <select
                  value={limit}
                  onChange={(e) =>
                    
                    router.push(`/${params.lang}/${params.center}/member?limit=${Number(e.target.value)}&page=${page}`)

                  }

                  className="h-9 text-sm bg-zinc-800 text-zinc-200 px-2 py-1 rounded-md"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>


            <button
              disabled={Number(page) <= 1}
              className={`h-9 text-sm text-white px-3 sm:px-4 py-2 rounded-md ${Number(page) <= 1 ? 'bg-gray-500' : 'bg-green-500 hover:bg-green-600'}`}
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
              className={`h-9 text-sm text-white px-3 sm:px-4 py-2 rounded-md ${Number(page) >= Math.ceil(Number(totalCount) / Number(limit)) ? 'bg-gray-500' : 'bg-green-500 hover:bg-green-600'}`}
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

        
        <ModalUser isOpen={isAddMemberModalOpen} onClose={closeAddMemberModal}>
          <div className="w-full rounded-2xl bg-white p-4 sm:p-5">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex flex-col">
                <h2 className="text-lg font-semibold text-slate-900">회원추가하기</h2>
                <p className="text-xs text-slate-500">회원 기본 정보와 입금 계좌를 등록합니다.</p>
              </div>

              <button
                onClick={closeAddMemberModal}
                disabled={insertingUserCode}
                className="h-9 rounded-lg border border-slate-200 px-3 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                닫기
              </button>
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <input
                disabled={insertingUserCode}
                type="text"
                value={userCode}
                onChange={(e) => setUserCode(e.target.value)}
                placeholder="회원 아이디"
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#3167b4]/35"
              />

              <input
                disabled={insertingUserCode}
                type="text"
                value={userPassword}
                onChange={(e) => setUserPassword(e.target.value)}
                placeholder="회원 비밀번호"
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#3167b4]/35"
              />

              <input
                disabled={insertingUserCode}
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="회원 이름"
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#3167b4]/35"
              />

              <input
                disabled={insertingUserCode}
                type="text"
                value={userBankDepositName}
                onChange={(e) => setUserBankDepositName(e.target.value)}
                placeholder="회원 입금자명"
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#3167b4]/35"
              />

              <select
                disabled={insertingUserCode}
                value={userBankName}
                onChange={(e) => setUserBankName(e.target.value)}
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#3167b4]/35"
              >
                <option value="">은행선택</option>
                {BANK_OPTIONS.map((bankName) => (
                  <option key={bankName} value={bankName}>
                    {bankName}
                  </option>
                ))}
              </select>

              <input
                disabled={insertingUserCode}
                type="text"
                value={userBankAccountNumber}
                onChange={(e) => {
                  const value = e.target.value;
                  const regex = /^[0-9]*$/;
                  if (regex.test(value)) {
                    setUserBankAccountNumber(value);
                  }
                }}
                placeholder="회원 계좌번호 (숫자만)"
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#3167b4]/35"
              />

              <select
                disabled={insertingUserCode}
                value={userType}
                onChange={(e) => setUserType(e.target.value)}
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#3167b4]/35 sm:col-span-2"
              >
                {MEMBER_TYPE_OPTIONS.map((option) => (
                  <option key={option.label} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                disabled={insertingUserCode}
                onClick={closeAddMemberModal}
                className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                취소
              </button>

              <button
                disabled={insertingUserCode}
                onClick={submitInsertBuyer}
                className="h-11 rounded-xl bg-[#1f4f94] px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#173d72] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {insertingUserCode ? '회원추가 중...' : '회원추가'}
              </button>
            </div>
          </div>
        </ModalUser>

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
