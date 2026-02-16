'use client';

import { useState, useEffect, use, act, useMemo } from "react";

import Image from "next/image";



// open modal

import ModalUser from '@/components/modal-user';

import { useRouter }from "next//navigation";


import { toast } from 'react-hot-toast';
import * as XLSX from "xlsx";

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
  getUserEmail,
  getUserPhoneNumber,
} from "thirdweb/wallets/in-app";


import { balanceOf, deposit, transfer } from "thirdweb/extensions/erc20";
import { add } from "thirdweb/extensions/farcaster/keyGateway";
 


import AppBarComponent from "@/components/Appbar/AppBar";
import { getDictionary } from "../../../dictionaries";
//import Chat from "@/components/Chat";
import { ClassNames } from "@emotion/react";


import useSound from 'use-sound';
import { it } from "node:test";
import { get } from "http";


import { useSearchParams } from 'next/navigation';


// import config/payment.ts
import { paymentUrl } from "@/app/config/payment";
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
  





export default function Index({ params }: any) {

  const searchParams = useSearchParams()!;

  // limit, page number params

  const limitParam = Number(searchParams.get('limit') || 20);
  const pageParam = Number(searchParams.get('page') || 1);
  const parsedLimitParam = limitParam > 0 ? limitParam : 20;
  const parsedPageParam = pageParam > 0 ? pageParam : 1;


  const searchParamsStorecode = (searchParams.get('storecode') || "").trim();
  const searchBuyerParam = (searchParams.get('searchBuyer') || "").trim();
  const searchDepositNameParam = (searchParams.get('searchDepositName') || "").trim();
  const searchUserTypeCandidate = (searchParams.get('searchUserType') || 'all').trim();
  const searchUserTypeParam = ['all', 'AAA', 'BBB', 'CCC', 'DDD', 'normal'].includes(searchUserTypeCandidate)
    ? searchUserTypeCandidate
    : 'all';




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
  const menuButtonBase =
    "flex w-32 shrink-0 items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 " +
    "bg-gradient-to-b from-white via-slate-50 to-slate-100 border border-slate-200 shadow-[0_8px_18px_-12px_rgba(0,0,0,0.35)] " +
    "hover:-translate-y-0.5 hover:shadow-md transition-all duration-200";



  /*
  const setActiveAccount = useSetActiveWallet();
 

  const connectWallets = useConnectedWallets();

  const smartConnectWallet = connectWallets?.[0];
  const inAppConnectWallet = connectWallets?.[1];
  */


  const activeAccount = useActiveAccount();

  const address = activeAccount?.address;



  const [phoneNumber, setPhoneNumber] = useState("");
  const [isAddModalOpen, setAddModalOpen] = useState(false);
  const [capsLockOn, setCapsLockOn] = useState(false);

  
  useEffect(() => {

    if (address) {

  

      //const phoneNumber = await getUserPhoneNumber({ client });
      //setPhoneNumber(phoneNumber);


      getUserPhoneNumber({ client }).then((phoneNumber) => {
        setPhoneNumber(phoneNumber || "");
      });

    }

  } , [address]);
  








  


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
  const closeAddModal = () => setAddModalOpen(false);
  const handleKeyboardState = (e: React.KeyboardEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (e.getModifierState) {
      setCapsLockOn(!!e.getModifierState("CapsLock"));
    }
  };

  


  const [searchMyOrders, setSearchMyOrders] = useState(false);



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



  ///////const [storePaymentUrl, setStorePaymentUrl] = useState(paymentUrl + '/' + params.lang + '/' + clientId + '/' + params.center + '/payment');



  const [storePaymentUrl, setStorePaymentUrl] = useState(paymentUrl + '/' + params.lang + '/' + clientId);


  const [storeAdminWalletAddress, setStoreAdminWalletAddress] = useState("");

  const [fetchingStore, setFetchingStore] = useState(false);
  const [store, setStore] = useState(null) as any;

  useEffect(() => {

    if (!searchParamsStorecode) {
      setStore(null);
      setStoreAdminWalletAddress("");
      
      //setStorePaymentUrl(paymentUrl + '/' + params.lang + '/' + clientId + '/' + params.center + '/payment');

      ////setStorePaymentUrl(paymentUrl + '/' + params.lang + '/' + clientId);


      return;
    }

    setFetchingStore(true);

    const fetchData = async () => {
        const response = await fetch("/api/store/getOneStore", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
              
              //storecode: "admin",

              storecode: searchParamsStorecode,

              ////walletAddress: address,
            }),
        });

        const data = await response.json();

        //console.log("data", data);

        if (data.result) {

          setStore(data.result);

          setStoreAdminWalletAddress(data.result?.adminWalletAddress);

          //data.result?.paymentUrl ? setStorePaymentUrl(data.result?.paymentUrl)
          //                        : setStorePaymentUrl(paymentUrl + '/' + params.lang + '/' + clientId + '/' + searchParamsStorecode + '/payment');

        }

        setFetchingStore(false);
    };

    fetchData();

  } , [searchParamsStorecode, params.lang]);



  //const [searchStorecode, setSearchStorecode] = useState(searchParamsStorecode || "");




  const [searchBuyer, setSearchBuyer] = useState(searchBuyerParam);

  const [searchDepositName, setSearchDepositName] = useState(searchDepositNameParam);
  const [searchUserType, setSearchUserType] = useState(searchUserTypeParam);
  useEffect(() => {
    setSearchBuyer(searchBuyerParam);
    setSearchDepositName(searchDepositNameParam);
    setSearchUserType(searchUserTypeParam);
  }, [searchBuyerParam, searchDepositNameParam, searchUserTypeParam]);

  const buildMemberQuery = ({
    limit,
    page,
    storecode,
    searchBuyerValue,
    searchDepositNameValue,
    searchUserTypeValue,
  }: {
    limit?: number;
    page?: number;
    storecode?: string;
    searchBuyerValue?: string;
    searchDepositNameValue?: string;
    searchUserTypeValue?: string;
  }) => {
    const query = new URLSearchParams({
      limit: String(limit ?? parsedLimitParam),
      page: String(page ?? parsedPageParam),
    });

    const nextStorecode = String(storecode ?? searchParamsStorecode).trim();
    if (nextStorecode) {
      query.set('storecode', nextStorecode);
    }

    const nextSearchBuyer = (searchBuyerValue ?? searchBuyer).trim();
    if (nextSearchBuyer) {
      query.set('searchBuyer', nextSearchBuyer);
    }

    const nextSearchDepositName = (searchDepositNameValue ?? searchDepositName).trim();
    if (nextSearchDepositName) {
      query.set('searchDepositName', nextSearchDepositName);
    }

    const nextSearchUserType = String(searchUserTypeValue ?? searchUserType).trim();
    if (nextSearchUserType && nextSearchUserType !== 'all') {
      query.set('searchUserType', nextSearchUserType);
    }

    return `/${params.lang}/admin/member?${query.toString()}`;
  };


  // fetch all buyer user 
  const [fetchingAllBuyer, setFetchingAllBuyer] = useState(false);
  const [allBuyer, setAllBuyer] = useState([] as any[]);
  const [totalCount, setTotalCount] = useState(0);
  const [downloadingBuyerExcel, setDownloadingBuyerExcel] = useState(false);
    
  const fetchAllBuyer = async () => {
    if (fetchingAllBuyer) {
      return;
    }
    setFetchingAllBuyer(true);
    const response = await fetch('/api/user/getAllBuyers', {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json',
      },
      body: JSON.stringify(
        {
          //storecode: searchStorecode,
          storecode: searchParamsStorecode,

          search: searchBuyerParam,
          depositName: searchDepositNameParam,
          userType: searchUserTypeParam,
          limit: Number(parsedLimitParam),
          page: Number(parsedPageParam),
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

  const getUserTypeLabel = (userType: string) => {
    if (userType === 'AAA') {
      return '1등급';
    }
    if (userType === 'BBB') {
      return '2등급';
    }
    if (userType === 'CCC') {
      return '3등급';
    }
    if (userType === 'DDD') {
      return '4등급';
    }
    return '일반';
  };

  const getBuyOrderStatusLabel = (status: string) => {
    if (status === 'ordered') {
      return '구매주문';
    }
    if (status === 'accepted') {
      return '판매자확정';
    }
    if (status === 'paymentRequested') {
      return '결제요청';
    }
    if (status === 'paymentConfirmed') {
      return '결제완료';
    }
    if (status === 'cancelled') {
      return '거래취소';
    }
    return '';
  };

  const downloadBuyerExcel = async () => {
    if (downloadingBuyerExcel) {
      return;
    }

    setDownloadingBuyerExcel(true);

    try {
      const batchLimit = 500;
      let currentPage = 1;
      let totalCountFromApi = 0;
      const downloadedUsers: any[] = [];

      while (true) {
        const response = await fetch('/api/user/getAllBuyers', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            storecode: searchParamsStorecode,
            search: searchBuyerParam,
            depositName: searchDepositNameParam,
            userType: searchUserTypeParam,
            limit: batchLimit,
            page: currentPage,
          }),
        });

        if (!response.ok) {
          throw new Error('회원 목록을 불러오지 못했습니다.');
        }

        const payload = await response.json();
        const users = payload?.result?.users || [];
        const totalCount = Number(payload?.result?.totalCount || 0);

        if (currentPage === 1) {
          totalCountFromApi = totalCount;
        }

        if (!users.length) {
          break;
        }

        downloadedUsers.push(...users);

        if (users.length < batchLimit || downloadedUsers.length >= totalCountFromApi) {
          break;
        }

        currentPage += 1;
      }

      if (!downloadedUsers.length) {
        toast.error('다운로드할 회원이 없습니다.');
        return;
      }

      const rows = downloadedUsers.map((item: any, index: number) => ({
        No: index + 1,
        가입일시: item?.createdAt
          ? new Date(item.createdAt).toLocaleString('ko-KR', { hour12: false })
          : '',
        회원상태: item?.liveOnAndOff === false ? '차단상태' : '정상상태',
        회원아이디: item?.nickname || '',
        회원등급: getUserTypeLabel(item?.userType || ''),
        가맹점명: item?.store?.storeName || '',
        가맹점코드: item?.storecode || '',
        은행명: item?.buyer?.depositBankName || '',
        계좌번호: item?.buyer?.depositBankAccountNumber || '',
        입금자명: item?.buyer?.depositName || '',
        결제건수: Number(item?.totalPaymentConfirmedCount || 0),
        결제금액원: Number(item?.totalPaymentConfirmedKrwAmount || 0),
        구매량USDT: Number(item?.totalPaymentConfirmedUsdtAmount || 0),
        주문상태: getBuyOrderStatusLabel(item?.buyOrderStatus || ''),
        지갑주소: item?.walletAddress || '',
      }));

      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Members');

      const now = new Date();
      const timestamp = [
        now.getFullYear(),
        String(now.getMonth() + 1).padStart(2, '0'),
        String(now.getDate()).padStart(2, '0'),
      ].join('-')
      + '_'
      + [
        String(now.getHours()).padStart(2, '0'),
        String(now.getMinutes()).padStart(2, '0'),
        String(now.getSeconds()).padStart(2, '0'),
      ].join('-');

      const safeStorecode = searchParamsStorecode || 'all';
      const fileName = `member_list_${safeStorecode}_${timestamp}.xlsx`;

      XLSX.writeFile(wb, fileName);
      toast.success(`회원 ${downloadedUsers.length.toLocaleString('ko-KR')}건을 다운로드했습니다.`);
    } catch (error: any) {
      console.error('회원 엑셀 다운로드 실패', error);
      toast.error(error?.message || '엑셀 다운로드에 실패했습니다.');
    } finally {
      setDownloadingBuyerExcel(false);
    }
  };

  

  useEffect(() => {
    if (!address) {
      setAllBuyer([]);
      return;
    }
    fetchAllBuyer();
  ///} , [address, searchStorecode]);

  } , [address, parsedLimitParam, parsedPageParam, searchParamsStorecode, searchBuyerParam, searchDepositNameParam, searchUserTypeParam]);
  





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


    if (!address) {
      toast.error('지갑을 연결해주세요.');
      return;
    }

    if (!userPassword) {
      toast.error('비밀번호를 입력해주세요.');
      return;
    }
    if (!userName) {
      toast.error('이름을 입력해주세요.');
      return;
    }
    if (!userBankDepositName) {
      toast.error('입금자명을 입력해주세요.');
      return;
    }
    if (!userBankName) {
      toast.error('은행명을 입력해주세요.');
      return;
    }
    if (!userBankAccountNumber) {
      toast.error('계좌번호를 입력해주세요.');
      return;
    }

    /*
    if (searchStorecode === '') {
      toast.error('가맹점 코드를 선택해주세요.');
      return;
    }
    */
    if (searchParamsStorecode === '') {
      toast.error('가맹점 코드를 선택해주세요.');
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
          //storecode: searchStorecode,
          storecode: searchParamsStorecode,


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
          storecode: "admin",
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
  //console.log('allUsers', allUsers);
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
          storecode: "admin",
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

  allBuyer.forEach((user) => {
    usdtBalance.push(0);
  });




  const getBalanceOfWalletAddress = async (walletAddress: string) => {
  

    const balance = await balanceOf({
      contract,
      address: walletAddress,
    });
    
    console.log('getBalanceOfWalletAddress', walletAddress, 'balance', balance);

    //toast.success(`잔액이 업데이트되었습니다. 잔액: ${(Number(balance) / 10 ** 6).toFixed(3)} USDT`);

    // if chain is bsc, then 10 ** 18
    if (chain === 'bsc') {
      toast.success(`잔액이 업데이트되었습니다. 잔액: ${(Number(balance) / 10 ** 18).toFixed(3)} USDT`);
    } else {
      toast.success(`잔액이 업데이트되었습니다. 잔액: ${(Number(balance) / 10 ** 6).toFixed(3)} USDT`);
    }

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
      const index = allBuyer.findIndex(u => u.walletAddress === walletAddress);
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









  // check table view or card view
  const [tableView, setTableView] = useState(true);



  const [selectedItem, setSelectedItem] = useState<any>(null);


  // get All stores
  const [fetchingAllStores, setFetchingAllStores] = useState(false);
  const [allStores, setAllStores] = useState([] as any[]);
  const [selectedStorecode, setSelectedStorecode] = useState<string>(searchParamsStorecode);
  const [storeTotalCount, setStoreTotalCount] = useState(0);
  const [storeDropdownOpen, setStoreDropdownOpen] = useState(false);
  const selectedStore = useMemo(
    () => allStores.find((s: any) => s.storecode === selectedStorecode)
      || allStores.find((s: any) => s.storecode === "")
      || allStores[0]
      || null,
    [allStores, selectedStorecode],
  );
  const fetchAllStores = async () => {
    if (fetchingAllStores) {
      return;
    }
    setFetchingAllStores(true);
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
      setFetchingAllStores(false);
      toast.error('가맹점 검색에 실패했습니다.');
      return;
    }

    const data = await response.json();
    const sorted = (data.result.stores || []).slice().sort((a: any, b: any) => (b.storeName || "").localeCompare(a.storeName || "", "ko-KR"));
    const storeList = [
      {
        storecode: "",
        storeName: "전체",
        storeLogo: "/icon-store.png",
      },
      ...sorted,
    ];
    setAllStores(storeList);
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

  useEffect(() => {
    // URL 쿼리에 storecode가 없을 때는 '전체'로 세팅
    if (!searchParamsStorecode) {
      setSelectedStorecode("");
      return;
    }
    setSelectedStorecode(searchParamsStorecode);
  }, [searchParamsStorecode]);

  //console.log('allStores', allStores);




  // array of depositAmountKrw
  const [depositAmountKrw, setDepositAmountKrw] = useState([] as number[]);
  for (let i = 0; i < 100; i++) {
    depositAmountKrw.push(0);
  }





  // totalNumberOfBuyOrders
  const [loadingTotalNumberOfBuyOrders, setLoadingTotalNumberOfBuyOrders] = useState(false);
  const [totalNumberOfBuyOrders, setTotalNumberOfBuyOrders] = useState(0);
  const [totalNumberOfAudioOnBuyOrders, setTotalNumberOfAudioOnBuyOrders] = useState(0);

  useEffect(() => {
    const fetchTotalBuyOrders = async (): Promise<void> => {
      if (!address) {
        setTotalNumberOfBuyOrders(0);
        return;
      }
      
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
        setLoadingTotalNumberOfBuyOrders(false);
        return;
      }
      const data = await response.json();
      //console.log('getTotalNumberOfBuyOrders data', data);
      setTotalNumberOfBuyOrders(data.result.totalCount);
      setTotalNumberOfAudioOnBuyOrders(data.result.audioOnCount);

      setLoadingTotalNumberOfBuyOrders(false);
    };

    fetchTotalBuyOrders();

    const interval = setInterval(() => {
      fetchTotalBuyOrders();
    }, 5000);
    return () => clearInterval(interval);

  }, [address]);

  useEffect(() => {
    if (totalNumberOfAudioOnBuyOrders > 0 && loadingTotalNumberOfBuyOrders === false) {
      const audio = new Audio('/notification.wav');
      audio.play();
    }
  }, [totalNumberOfAudioOnBuyOrders, loadingTotalNumberOfBuyOrders]);




  // totalNumberOfClearanceOrders
  const [loadingTotalNumberOfClearanceOrders, setLoadingTotalNumberOfClearanceOrders] = useState(false);
  const [totalNumberOfClearanceOrders, setTotalNumberOfClearanceOrders] = useState(0);
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






  if (!address) {
    return (
      <div className="flex flex-col items-center justify-center">

        <h1 className="text-2xl font-bold">로그인</h1>

          <ConnectButton
            client={client}
            wallets={wallets}
            /*
            chain={chain === "ethereum" ? ethereum :
                    chain === "polygon" ? polygon :
                    chain === "arbitrum" ? arbitrum :
                    chain === "bsc" ? bsc : arbitrum}
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

      </div>
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
                  }}
                  className="flex items-center justify-center gap-2 bg-[#3167b4] text-sm text-[#f3f4f6] px-4 py-2 rounded-lg hover:bg-[#3167b4]/80"
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



          {/* 홈 / 가맹점관리 / 회원관리 / 구매주문관리 */}
          <div className="flex flex-wrap md:flex-nowrap items-center gap-2 mb-4 overflow-x-auto pb-1">
            <button onClick={() => router.push('/' + params.lang + '/admin/store')} className={menuButtonBase}>가맹점관리</button>
            <button onClick={() => router.push('/' + params.lang + '/admin/agent')} className={menuButtonBase}>에이전트관리</button>
            <div className="flex w-32 shrink-0 items-center justify-center gap-2 bg-gradient-to-r from-amber-400 to-amber-500 text-slate-900 text-sm font-semibold rounded-xl px-3 py-2 shadow-[0_10px_20px_-14px_rgba(0,0,0,0.45)] border border-amber-300">
              <Image src="/icon-user.png" alt="Buyer" width={35} height={35} className="w-4 h-4" />
              <div className="text-sm font-semibold drop-shadow-sm">회원관리</div>
            </div>
            <button onClick={() => router.push('/' + params.lang + '/admin/buyorder')} className={menuButtonBase}>구매주문관리</button>
            <button onClick={() => router.push('/' + params.lang + '/admin/trade-history')} className={menuButtonBase}>P2P 거래내역</button>
            {version !== 'bangbang' && (
              <button onClick={() => router.push('/' + params.lang + '/admin/escrow-history')} className={menuButtonBase}>청산관리</button>
            )}
            <button onClick={() => router.push('/' + params.lang + '/admin/trade-history-daily')} className={menuButtonBase}>P2P통계(가맹)</button>
            <button onClick={() => router.push('/' + params.lang + '/admin/trade-history-daily-agent')} className={menuButtonBase}>P2P통계(AG)</button>
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

          {/* 가맹점 선택 - 상단 배치 */}
          <div className="w-full mt-3 max-w-md">
            {fetchingAllStores ? (
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Image
                  src="/loading.png"
                  alt="Loading"
                  width={20}
                  height={20}
                  className="animate-spin"
                />
                불러오는 중...
              </div>
            ) : (
              <div className="w-full p-3 bg-white/95 border border-slate-200 rounded-xl shadow-sm flex flex-col gap-2">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Image
                      src="/icon-store.png"
                      alt="Store"
                      width={20}
                      height={20}
                      className="rounded-lg w-5 h-5"
                    />
                    <span className="text-sm font-semibold text-slate-900">가맹점 선택</span>
                  </div>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                    {storeTotalCount.toLocaleString()}곳
                  </span>
                </div>

                <div className="relative w-full sm:min-w-[260px]">
                  <button
                    type="button"
                    onClick={() => setStoreDropdownOpen((o) => !o)}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-800 flex items-center justify-between gap-3 hover:border-emerald-300 hover:ring-1 hover:ring-emerald-200 transition"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Image
                        src={selectedStore?.storeLogo || "/icon-store.png"}
                        alt="store"
                        width={28}
                        height={28}
                        className="w-7 h-7 rounded-md object-cover border border-slate-200"
                      />
                      <div className="flex flex-col text-left min-w-0">
                        <span className="truncate">{selectedStore?.storeName || "가맹점 없음"}</span>
                        <span className="text-[11px] text-slate-500 truncate">
                          {selectedStore?.storecode === "" ? "전체" : (selectedStore?.storecode || "")}
                        </span>
                      </div>
                    </div>
                    <span className="text-xs text-slate-500">{storeDropdownOpen ? "닫기" : "선택"}</span>
                  </button>
                  {storeDropdownOpen && (
                    <div className="absolute z-30 mt-2 w-full max-h-64 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg">
                      {allStores.map((item: any, index: number) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => {
                            setSelectedStorecode(item.storecode);
                            setStoreDropdownOpen(false);
                            router.push(
                              buildMemberQuery({
                                page: 1,
                                storecode: item.storecode,
                              })
                            );
                          }}
                          className="w-full px-3 py-2 flex items-center gap-2 hover:bg-emerald-50"
                        >
                          <Image
                            src={item.storeLogo || "/icon-store.png"}
                            alt="store"
                            width={24}
                            height={24}
                            className="w-6 h-6 rounded-md object-cover border border-slate-200"
                          />
                          <div className="flex flex-col text-left">
                            <span className="text-sm font-semibold text-slate-800">{item.storeName}</span>
                            <span className="text-[11px] text-slate-500">
                              {item.storecode === "" ? "전체" : item.storecode}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>






          {/* 바이어 추가: 버튼 + 모달 */}
          <div className="w-full max-w-3xl flex items-center justify-between">
            <div className="text-sm font-semibold text-slate-700">회원 추가</div>
            <button
              onClick={() => setAddModalOpen(true)}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-4 py-2 rounded-lg shadow-sm hover:shadow-md text-sm font-semibold"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              회원 추가하기
            </button>
          </div>







          <div className="w-full mt-4 rounded-2xl border border-slate-200 bg-white/95 shadow-sm p-5 flex flex-col gap-5">

            <div className="w-full flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-slate-700">검색 / 결과</span>
                <span className="px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-sm font-bold text-slate-900 tabular-nums">
                  합계 {Number(totalCount || 0).toLocaleString('ko-KR')}
                </span>
              </div>
              <span className="text-xs text-slate-500">회원 아이디, 입금자명, 회원등급으로 필터링</span>
            </div>

            <div className="w-full grid grid-cols-1 2xl:grid-cols-[minmax(0,1fr)_minmax(460px,560px)] gap-4 items-start">
              <div className="w-full rounded-xl border border-slate-200/80 bg-slate-50/70 p-3">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2.5">
                  <input
                    type="text"
                    value={searchBuyer}
                    onChange={(e) => setSearchBuyer(e.target.value)}
                    placeholder="회원 아이디"
                    className="w-full h-11 px-3 border border-slate-200 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3167b4]"
                  />

                  <input
                    type="text"
                    value={searchDepositName}
                    onChange={(e) => setSearchDepositName(e.target.value)}
                    placeholder="입금자명"
                    className="w-full h-11 px-3 border border-slate-200 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3167b4]"
                  />

                  <select
                    value={searchUserType}
                    onChange={(e) => setSearchUserType(e.target.value)}
                    className="w-full h-11 px-3 border border-slate-200 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3167b4]"
                  >
                    <option value="all">회원등급 전체</option>
                    <option value="normal">일반등급</option>
                    <option value="AAA">1등급</option>
                    <option value="BBB">2등급</option>
                    <option value="CCC">3등급</option>
                    <option value="DDD">4등급</option>
                  </select>
                </div>

                <div className="mt-3 flex flex-col sm:flex-row items-stretch gap-2.5">
                  <button
                    onClick={() => {
                      router.push(
                        buildMemberQuery({
                          page: 1,
                          storecode: selectedStorecode,
                          searchBuyerValue: searchBuyer,
                          searchDepositNameValue: searchDepositName,
                          searchUserTypeValue: searchUserType,
                        })
                      );
                    }}
                    className="h-11 min-w-[128px] inline-flex items-center justify-center gap-2 bg-gradient-to-r from-sky-500 to-blue-600 text-white px-5 rounded-lg shadow-sm hover:shadow-md hover:from-sky-600 hover:to-blue-700 transition whitespace-nowrap"
                    disabled={fetchingAllBuyer}
                  >
                    <Image
                      src="/icon-search.png"
                      alt="Search"
                      width={20}
                      height={20}
                      className="rounded-lg w-5 h-5"
                    />
                    <span className="text-sm font-semibold">
                      {fetchingAllBuyer ? '검색중...' : '검색'}
                    </span>
                  </button>

                  <button
                    onClick={downloadBuyerExcel}
                    className={`h-11 min-w-[112px] px-5 rounded-lg text-sm font-semibold text-white shadow-sm transition whitespace-nowrap ${
                      downloadingBuyerExcel
                        ? 'bg-slate-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 hover:shadow-md'
                    }`}
                    disabled={downloadingBuyerExcel}
                  >
                    {downloadingBuyerExcel ? '다운로드중...' : '엑셀 다운로드'}
                  </button>
                </div>
              </div>

              <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="flex items-center gap-3 bg-gradient-to-r from-white via-slate-50 to-sky-50 border border-slate-200 px-4 py-3 rounded-xl shadow-sm min-h-[84px]">
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
                      width={28}
                      height={28}
                      className="w-6 h-6"
                    />
                  )}
                  <div className="flex flex-col">
                    <span className="text-xs text-slate-500">구매주문 총건</span>
                    <span className="text-lg font-bold text-slate-900 tabular-nums">{totalNumberOfBuyOrders?.toLocaleString?.('ko-KR') ?? totalNumberOfBuyOrders}</span>
                  </div>
                  <button
                    onClick={() => router.push('/' + params.lang + '/admin/buyorder')}
                    className="ml-auto inline-flex items-center gap-1.5 bg-gradient-to-r from-sky-500 to-blue-600 text-[11px] font-semibold text-white px-3 py-1.5 rounded-lg shadow-sm hover:shadow-md whitespace-nowrap"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/></svg>
                    이동
                  </button>
                </div>

                {version !== 'bangbang' && (
                  <div className="flex items-center gap-3 bg-gradient-to-r from-white via-slate-50 to-amber-50 border border-slate-200 px-4 py-3 rounded-xl shadow-sm min-h-[84px]">
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
                        width={28}
                        height={28}
                        className="w-6 h-6"
                      />
                    )}
                    <div className="flex flex-col">
                      <span className="text-xs text-slate-500">청산 대기 건</span>
                      <span className="text-lg font-bold text-slate-900 tabular-nums">{totalNumberOfClearanceOrders?.toLocaleString?.('ko-KR') ?? totalNumberOfClearanceOrders}</span>
                    </div>
                    <button
                      onClick={() => router.push('/' + params.lang + '/admin/clearance-history')}
                      className="ml-auto inline-flex items-center gap-1.5 bg-gradient-to-r from-amber-400 to-amber-500 text-[11px] font-semibold text-white px-3 py-1.5 rounded-lg shadow-sm hover:shadow-md whitespace-nowrap"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/></svg>
                      이동
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>



              {/*
              {"storecode":"teststorecode","storeName":"테스트상점","storeType":"test","storeUrl":"https://test.com","storeDescription":"설명입니다.","storeLogo":"https://test.com/logo.png","storeBanner":"https://test.com/banner.png"}
              */}

              {/* table view is horizontal scroll */}
              {tableView ? (


                <div className="w-full overflow-auto rounded-2xl border border-slate-200 bg-white/95 shadow-sm">

                  <table className="min-w-[1150px] w-full text-sm text-slate-700">

                    <thead className="bg-slate-50 text-slate-900 text-[12px] font-semibold uppercase tracking-[0.02em] sticky top-0 z-10">
                      <tr>

                        <th className="px-3 py-3 border-b border-slate-200 text-left align-middle whitespace-nowrap min-w-[120px]">
                          <div className="flex flex-col items-start justify-center gap-1">
                            <span>가입일시</span>
                          </div>
                        </th>
                        {/* 회원상태 */}
                        <th className="px-3 py-3 border-b border-slate-200 text-left align-middle whitespace-nowrap min-w-[90px]">
                          <div className="flex flex-col sm:flex-row items-start justify-start gap-2">
                            <span>회원 상태</span>
                          </div>
                        </th>

                        <th className="px-3 py-3 border-b border-slate-200 text-left align-middle whitespace-nowrap min-w-[180px]">
                          <div className="flex flex-col items-start gap-1 leading-tight">
                            <span>회원 아이디</span>
                            <span className="text-[11px] text-slate-500">가맹점</span>
                          </div>
                        </th>

                        <th className="px-3 py-3 border-b border-slate-200 text-left align-middle whitespace-nowrap min-w-[150px]">
                          <div className="flex flex-col items-start justify-center gap-2">
                            <span>회원은행정보</span>
                          </div>
                        </th>

                        <th className="px-3 py-3 border-b border-slate-200 text-left align-middle whitespace-nowrap min-w-[190px]">
                          <div className="flex flex-col items-start justify-center gap-2">
                            <span>결제건수(건)</span>
                            <span>결제금액(원)</span>
                            <span>구매량(USDT)</span>
                          </div>
                          </th>

                        <th className="px-3 py-3 border-b border-slate-200 text-left align-middle whitespace-nowrap min-w-[120px]">
                          USDT지갑
                        </th>
                        <th className="px-3 py-3 border-b border-slate-200 text-left align-middle whitespace-nowrap min-w-[200px]">충전/결제</th>
                        <th className="px-3 py-3 border-b border-slate-200 text-left align-middle whitespace-nowrap min-w-[110px]">주문상태</th>

                        <th className="px-3 py-3 border-b border-slate-200 text-left align-middle whitespace-nowrap min-w-[130px]">잔액확인</th>
                      </tr>
                    </thead>

                    {/* if my trading, then tr has differenc color */}
                    <tbody>

                      {allBuyer.map((item, index) => (

                        
                        <tr
                          key={index}
                          className="even:bg-slate-50/60 hover:bg-emerald-50 transition-colors"
                        >

                          <td className="px-3 py-3 border-b border-slate-100 align-top">
                            <div className="flex flex-col items-center justify-center gap-2">
                              <span className="text-sm text-zinc-500">
                                {new Date(item.createdAt).toLocaleDateString('ko-KR', {
                                  year: 'numeric',
                                  month: '2-digit',
                                  day: '2-digit',
                                })}
                              </span>
                              <span className="text-sm text-zinc-500">
                                {new Date(item.createdAt).toLocaleTimeString('ko-KR', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  second: '2-digit',
                                })}
                              </span>
                            </div>

                          </td>

                          {/* 회원상태  liveOnAndOff  true => 정상상태 , false => 차단상태 */}
                          <td className="px-3 py-3 border-b border-slate-100 align-top">
                            <div className="flex flex-col items-start justify-center gap-2">
                              {item?.liveOnAndOff === false ? (
                                <span className="bg-red-500 text-white px-2 py-1 rounded-lg text-xs">
                                  차단상태
                                </span>
                              ) : (
                                <span className="bg-green-500 text-white px-2 py-1 rounded-lg text-xs">
                                  정상상태
                                </span>
                              )}
                            </div>
                          </td>
                        
                          <td className="px-3 py-3 border-b border-slate-100 align-top">
                            <div className="flex flex-col items-start gap-1">
                              <div className="flex items-center gap-2">
                                <span className="text-base font-semibold text-slate-900">{item.nickname}</span>
                                {item?.userType === ''
                                ? <span className="bg-gray-500 text-white px-2 py-0.5 rounded-full text-[11px]">일반</span>
                                : item?.userType === 'AAA'
                                  ? <span className="bg-red-500 text-white px-2 py-0.5 rounded-full text-[11px]">1등급</span>
                                  : item?.userType === 'BBB'
                                    ? <span className="bg-orange-500 text-white px-2 py-0.5 rounded-full text-[11px]">2등급</span>
                                    : item?.userType === 'CCC'
                                      ? <span className="bg-yellow-500 text-white px-2 py-0.5 rounded-full text-[11px]">3등급</span>
                                      : item?.userType === 'DDD'
                                        ? <span className="bg-green-500 text-white px-2 py-0.5 rounded-full text-[11px]">4등급</span>
                                        : <span className="bg-gray-500 text-white px-2 py-0.5 rounded-full text-[11px]">일반</span>
                                }
                              </div>
                              <div className="text-sm text-slate-600 leading-tight">
                                {item?.store?.storeName} ({item?.store?.storecode})
                              </div>

                              <button
                                onClick={() => {
                                  router.push(
                                    `/${params.lang}/admin/member-settings?storecode=${item?.storecode}&walletAddress=${item?.walletAddress}`
                                  );
                                }}
                                className="mt-2 inline-flex items-center gap-1.5 bg-gradient-to-r from-sky-500 to-blue-600 text-xs font-semibold text-white px-3 py-1.5 rounded-lg shadow-sm hover:shadow-md transition whitespace-nowrap"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536M16.5 3.5a2.121 2.121 0 113 3L7 19H4v-3L16.5 3.5z" />
                                </svg>
                                변경하기
                              </button>

                            </div>

                          </td>

                          <td className="px-3 py-3 border-b border-slate-100 align-top">
                            <div className="flex flex-col items-start justify-center gap-1">
                              <span className="text-sm font-semibold text-slate-800">{item?.buyer?.depositBankName}</span>
                              
                              <span className="text-[13px] text-slate-600 tabular-nums">{item?.buyer?.depositBankAccountNumber}</span>
                              
                              <span className="text-[12px] text-slate-500">{item?.buyer?.depositName}</span>
                            </div>

                            {/* 변경하기 button */}
                            {/* member-settings?storecode=mgorlkxu&walletAddress=0x59B3597fF4e109a22e262AF940B77e3c59f7c56C */}
                            {/*
                            <button
                              onClick={() => {
                                router.push(
                                  `/${params.lang}/admin/member-settings?storecode=${item?.storecode}&walletAddress=${item?.walletAddress}`
                                );
                              }}
                              className="mt-2 bg-[#3167b4] text-sm text-white px-2 py-1 rounded-lg
                                hover:bg-[#3167b4]/80"
                            >
                              변경하기
                            </button>
                            */}

                          </td>

                          <td className="px-3 py-3 border-b border-slate-100 align-top">
                            <div className="flex flex-col items-end mr-2 justify-center gap-2 text-right">

                              <div className="text-xs text-slate-500">건수</div>
                              <div className="text-base font-semibold text-slate-900 tabular-nums">
                                {Number(item?.totalPaymentConfirmedCount || 0).toLocaleString('ko-KR')}
                              </div>

                              <div className="text-xs text-slate-500">금액(원)</div>
                              <div className="text-base font-semibold text-emerald-700 tabular-nums">
                                {Number(item?.totalPaymentConfirmedKrwAmount || 0).toLocaleString('ko-KR')}
                              </div>

                              <div className="text-xs text-slate-500">USDT</div>
                              <div className="text-base font-semibold text-sky-700 tabular-nums">
                                {Number(item?.totalPaymentConfirmedUsdtAmount || 0).toLocaleString('ko-KR')}
                              </div>

                            </div>
                            
                          </td>



                          <td className="px-3 py-3 border-b border-slate-100 align-top">
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(item?.walletAddress);
                                  toast.success(Copied_Wallet_Address);
                                } }
                              className="inline-flex items-center gap-1 text-sm text-slate-700 hover:text-slate-900 underline underline-offset-2 whitespace-nowrap"
                            >
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16h8m-8-4h8m-2-9H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7l-4-4z" />
                            </svg>
                            {
                                item?.walletAddress && (
                                  item.walletAddress.substring(0, 6) + '...' + item.walletAddress.substring(item.walletAddress.length - 4)
                                )
                              }
                            </button>
                          </td>

                          {/* depositAmountKrw input */}
                          <td className="px-3 py-3 border-b border-slate-100 align-top">
                            <div className="flex flex-col items-start justify-center gap-2">
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
                                className="w-full p-2 border border-slate-200 bg-slate-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3167b4] tabular-nums"
                              />

                              <div className="flex flex-row items-center justify-start gap-2">
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(
                                      storePaymentUrl + '/' + item.storecode + '/payment'
                                      + '?'
                                      + 'storeUser=' + item.nickname
                                      + '&depositBankName=' + item?.buyer?.depositBankName
                                      + '&depositBankAccountNumber=' + item?.buyer?.depositBankAccountNumber
                                      + '&depositName=' + item?.buyer?.depositName
                                      + '&depositAmountKrw=' + depositAmountKrw[index]
                                      + '&accessToken=' + item?.storeInfo?.accessToken
                                    );
                                    toast.success('회원 홈페이지 링크가 복사되었습니다.');
                                  }}
                                  className="inline-flex items-center gap-1.5 bg-emerald-500 text-xs font-semibold text-white px-3 py-1.5 rounded-lg shadow-sm hover:bg-emerald-600 transition whitespace-nowrap"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V5a2 2 0 012-2h6a2 2 0 012 2v10a2 2 0 01-2 2h-2m-4 0H6a2 2 0 01-2-2V9a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2z" />
                                  </svg>
                                  복사
                                </button>

                                <button
                                  onClick={() => {
                                    window.open(
                                      storePaymentUrl + '/' + item.storecode + '/payment'
                                      + '?'
                                      + 'storeUser=' + item.nickname
                                      + '&depositBankName=' + item?.buyer?.depositBankName
                                      + '&depositBankAccountNumber=' + item?.buyer?.depositBankAccountNumber
                                      + '&depositName=' + item?.buyer?.depositName
                                      + '&depositAmountKrw=' + depositAmountKrw[index]
                                      + '&accessToken=' + item?.storeInfo?.accessToken,
                                      '_blank'
                                    );
                                    toast.success('회원 홈페이지를 새창으로 열었습니다.');
                                  }}
                                  className="inline-flex items-center gap-1.5 bg-indigo-500 text-xs font-semibold text-white px-3 py-1.5 rounded-lg shadow-sm hover:bg-indigo-600 transition whitespace-nowrap"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 9h6m-6 4h6m-8 5h10a2 2 0 002-2V8l-4-4H7a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 3v4a1 1 0 001 1h4" />
                                  </svg>
                                  새창열기
                                </button>
                              </div>
                            </div>
                          </td>


                          <td className="px-3 py-3 border-b border-slate-100 align-top">
                            <div className="flex flex-col sm:flex-row items-start justify-center gap-2">
                              <span className="text-sm text-zinc-500">
                                {
                                item?.buyOrderStatus === 'ordered' ? (
                                  <span className="text-sm text-yellow-500">
                                    구매주문
                                  </span>
                                ) : item?.buyOrderStatus === 'accepted' ? (
                                  <span className="text-sm text-green-500">
                                    판매자확정
                                  </span>
                                ) : item?.buyOrderStatus === 'paymentRequested' ? (
                                  <span className="text-sm text-red-500">
                                    결제요청
                                  </span>
                                ) : item?.buyOrderStatus === 'paymentConfirmed' ? (
                                  <span className="text-sm text-green-500">
                                    결제완료
                                  </span>
                                ) : item?.buyOrderStatus === 'cancelled' ? (
                                  <span className="text-sm text-red-500">
                                    거래취소
                                  </span>
                                ) : ''
                                }

                              </span>
                            </div>
                          </td>


                           {/* 잔고확인 버튼 */}
                           {/* USDT 잔액 */}
                           <td className="px-3 py-3 border-b border-slate-100 align-top">
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
                                   getBalanceOfWalletAddress(item.walletAddress);
                                 }}
                                 className="w-full mb-2 inline-flex items-center justify-center gap-1.5 bg-gradient-to-r from-sky-500 to-blue-600 text-xs font-semibold text-white px-3 py-1.5 rounded-lg shadow-sm hover:shadow-md transition whitespace-nowrap"
                               >
                                 <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                 </svg>
                                 잔액 확인하기
                               </button>
 
 
                               {/* function call button clearanceWalletAddress */}
                               
                               <button
                                 onClick={() => {
                                   clearanceWalletAddress(item.walletAddress);
                                   toast.success('잔액을 회수했습니다.');
                                 }}
                                 className="w-full mb-2 inline-flex items-center justify-center gap-1.5 bg-gradient-to-r from-rose-500 to-red-600 text-xs font-semibold text-white px-3 py-1.5 rounded-lg shadow-sm hover:shadow-md transition whitespace-nowrap"
                               >
                                 <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v8m0 0l-3-3m3 3l3-3M6 4h12l-1 14H7L6 4z" />
                                 </svg>
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
                value={parsedLimitParam}
                onChange={(e) =>
                  router.push(
                    buildMemberQuery({
                      limit: Number(e.target.value),
                      page: 1,
                      storecode: selectedStorecode,
                    })
                  )
                }

                className="text-sm bg-zinc-800 text-zinc-200 px-2 py-1 rounded-md"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>

            {/* 처음 페이지로 이동 버튼 */}
            <button
              disabled={parsedPageParam <= 1}
              className={`text-sm text-white px-4 py-2 rounded-md ${parsedPageParam <= 1 ? 'bg-gray-500' : 'bg-green-500 hover:bg-green-600'}`}
              onClick={() => {
                router.push(buildMemberQuery({ page: 1, storecode: selectedStorecode }));
              }}
            >
              처음
            </button>


            <button
              disabled={parsedPageParam <= 1}
              className={`text-sm text-white px-4 py-2 rounded-md ${parsedPageParam <= 1 ? 'bg-gray-500' : 'bg-green-500 hover:bg-green-600'}`}
              onClick={() => {
                router.push(buildMemberQuery({ page: parsedPageParam - 1, storecode: selectedStorecode }));
              }}
            >
              이전
            </button>


            <span className="text-sm text-zinc-500">
              {parsedPageParam} / {Math.ceil(Number(totalCount) / Number(parsedLimitParam))}
            </span>


            <button
              disabled={parsedPageParam >= Math.ceil(Number(totalCount) / Number(parsedLimitParam))}
              className={`text-sm text-white px-4 py-2 rounded-md ${parsedPageParam >= Math.ceil(Number(totalCount) / Number(parsedLimitParam)) ? 'bg-gray-500' : 'bg-green-500 hover:bg-green-600'}`}
              onClick={() => {
                router.push(buildMemberQuery({ page: parsedPageParam + 1, storecode: selectedStorecode }));
              }}
            >
              다음
            </button>

            <button
              disabled={parsedPageParam >= Math.ceil(Number(totalCount) / Number(parsedLimitParam))}
              className={`text-sm text-white px-4 py-2 rounded-md ${parsedPageParam >= Math.ceil(Number(totalCount) / Number(parsedLimitParam)) ? 'bg-gray-500' : 'bg-green-500 hover:bg-green-600'}`}
              onClick={() => {
                router.push(buildMemberQuery({ page: Math.ceil(Number(totalCount) / Number(parsedLimitParam)), storecode: selectedStorecode }));
              }}
            >
              마지막
            </button>

          </div>


          





          
        </div>

        
        <ModalUser isOpen={isModalOpen} onClose={closeModal}>
            <UserHomePage
                closeModal={closeModal}
                selectedItem={selectedItem}
            />
        </ModalUser>

        <ModalUser isOpen={isAddModalOpen} onClose={closeAddModal}>
          <div className="w-full bg-white rounded-2xl p-6 flex flex-col gap-4 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <div className="text-[22px] font-bold text-slate-900">회원 추가</div>
                <div className="text-xs text-slate-500 mt-1">새 회원 정보를 입력해 등록하세요.</div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-[12px] font-bold tracking-tight shadow-sm ${capsLockOn ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-amber-900 border border-amber-300' : 'bg-gradient-to-r from-slate-100 to-slate-200 text-slate-700 border border-slate-300'}`}>
                  <span className={`w-2 h-2 rounded-full ${capsLockOn ? 'bg-red-500 shadow-[0_0_0_3px_rgba(248,113,113,0.2)]' : 'bg-slate-400'}`} />
                  {capsLockOn ? 'CapsLock 켜짐' : 'CapsLock 꺼짐'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <input
                disabled={insertingUserCode}
                type="text"
                value={userCode}
                onChange={(e) => setUserCode(e.target.value)}
                placeholder="회원 아이디"
                onKeyUp={handleKeyboardState}
                onKeyDown={handleKeyboardState}
                className="w-full p-3 border border-slate-200 bg-slate-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
              <span className="text-[11px] text-slate-500 -mt-2">로그인에 사용할 고유 아이디</span>
              <input
                disabled={insertingUserCode}
                type="text"
                value={userPassword}
                onChange={(e) => setUserPassword(e.target.value)}
                placeholder="회원 비밀번호"
                onKeyUp={handleKeyboardState}
                onKeyDown={handleKeyboardState}
                className="w-full p-3 border border-slate-200 bg-slate-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
              <span className="text-[11px] text-slate-500 -mt-2">숫자/문자 조합 4~12자 권장</span>
              <input
                disabled={insertingUserCode}
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="회원 이름"
                onKeyUp={handleKeyboardState}
                onKeyDown={handleKeyboardState}
                className="w-full p-3 border border-slate-200 bg-slate-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
              <span className="text-[11px] text-slate-500 -mt-2">화면에 표시될 이름</span>
              <input
                disabled={insertingUserCode}
                type="text"
                value={userBankDepositName}
                onChange={(e) => setUserBankDepositName(e.target.value)}
                placeholder="회원 입금자명"
                onKeyUp={handleKeyboardState}
                onKeyDown={handleKeyboardState}
                className="w-full p-3 border border-slate-200 bg-slate-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
              <span className="text-[11px] text-slate-500 -mt-2">입금 시 표시되는 예금주명</span>
              <select
                disabled={insertingUserCode}
                value={userBankName}
                onChange={(e) => setUserBankName(e.target.value)}
                onKeyUp={handleKeyboardState}
                onKeyDown={handleKeyboardState}
                className="w-full p-3 border border-slate-200 bg-slate-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400"
              >
                <option value="">은행선택</option>
                <option value="카카오뱅크">카카오뱅크</option>
                <option value="케이뱅크">케이뱅크</option>
                <option value="토스뱅크">토스뱅크</option>
                <option value="국민은행">국민은행</option>
                <option value="우리은행">우리은행</option>
                <option value="신한은행">신한은행</option>
                <option value="농협">농협</option>
                <option value="새마을금고">새마을금고</option>
                <option value="우체국">우체국</option>
                <option value="산림조합">산림조합</option>
                <option value="기업은행">기업은행</option>
                <option value="하나은행">하나은행</option>
                <option value="외환은행">외환은행</option>
                <option value="SC제일은행">SC제일은행</option>
                <option value="부산은행">부산은행</option>
                <option value="대구은행">대구은행</option>
                <option value="전북은행">전북은행</option>
                <option value="경북은행">경북은행</option>
                <option value="경남은행">경남은행</option>
                <option value="광주은행">광주은행</option>
                <option value="제주은행">제주은행</option>
                <option value="수협">수협</option>
                <option value="신협">신협</option>
                <option value="저축은행">저축은행</option>
                <option value="씨티은행">씨티은행</option>
                <option value="대신은행">대신은행</option>
                <option value="동양종합금융">동양종합금융</option>
                <option value="JT친애저축은행">JT친애저축은행</option>
                <option value="산업은행">산업은행</option>
              </select>
              <input
                disabled={insertingUserCode}
                type="text"
                value={userBankAccountNumber}
                onChange={(e) => setUserBankAccountNumber(e.target.value)}
                placeholder="회원 계좌번호"
                onKeyUp={handleKeyboardState}
                onKeyDown={handleKeyboardState}
                className="w-full p-3 border border-slate-200 bg-slate-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
              <span className="text-[11px] text-slate-500 -mt-2">숫자만 입력해주세요</span>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={closeAddModal}
                className="px-4 py-2 text-sm font-semibold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition"
              >
                취소
              </button>
              <button
                disabled={insertingUserCode}
                onClick={() => {
                  const trimmedUserCode = userCode.trim();
                  if (!trimmedUserCode) return toast.error('회원 아이디를 입력해주세요.');
                  if (userName.length < 2) return toast.error('회원 이름은 2자 이상이어야 합니다.');
                  if (userName.length > 10) return toast.error('회원 이름은 10자 이하여야 합니다.');
                  if (confirm(`정말 ${trimmedUserCode} (${userName})을 추가하시겠습니까?`)) {
                    insertBuyer();
                    closeAddModal();
                  }
                }}
                className={`px-5 py-2 text-sm font-semibold text-white rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 shadow-md hover:shadow-lg ${insertingUserCode ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {insertingUserCode ? '추가 중...' : '추가'}
              </button>
            </div>
          </div>
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
