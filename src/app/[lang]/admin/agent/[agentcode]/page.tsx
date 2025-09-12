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
import { getDictionary } from "../../../../dictionaries";
//import Chat from "@/components/Chat";
import { ClassNames } from "@emotion/react";


import useSound from 'use-sound';
import { it } from "node:test";
import { get } from "http";


import { useSearchParams } from 'next/navigation';



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

  agentcode: string;
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
    chain: bsc,

    // the contract's address
    address: bscContractAddressMKRW,

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
  


  const [balance, setBalance] = useState(0);
  const [nativeBalance, setNativeBalance] = useState(0);

  useEffect(() => {

    if (!address) return;
    // get the balance


    if (!contract) {
      return;
    }

    const getBalance = async () => {

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
        console.error("Error getting balance", error);
      }


      // getWalletBalance
      const result = await getWalletBalance({
        address: address,
        client: client,
        chain: chain === "ethereum" ? ethereum :
                chain === "polygon" ? polygon :
                chain === "arbitrum" ? arbitrum :
                chain === "bsc" ? bsc : arbitrum,
      });

      if (result) {
        setNativeBalance(Number(result.value) / 10 ** result.decimals);
      }

      

    };

    if (address) getBalance();

    // get the balance in the interval

    const interval = setInterval(() => {
      if (address) getBalance();
    }, 5000);


    return () => clearInterval(interval);

  } , [address, contract]);




  // balance of MKRW
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
        chain: params.agentcode,
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
          chain: params.agentcode,
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
          chain: params.agentcode,
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

  } , [address, escrowWalletAddress, contract, params.agentcode]);
  

  //console.log('escrowBalance', escrowBalance);




  console.log('params.agentcode', params.agentcode);




  


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
            // agentcode, walletAddress, nickname, mobile, email
            body: JSON.stringify({
              storecode: "agent",
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
                  storecode: "agent",
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
            storecode: "agent",
            walletAddress: address,
        }),
    })
    .then(response => response.json())
    .then(data => {
        
        //console.log('getUser data.result', data.result);


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



  const [agentList, setAgentList] = useState([] as any[]);


  const [agentAdminWalletAddress, setAgentAdminWalletAddress] = useState("");

  const [fetchingAgent, setFetchingAgent] = useState(true);
  const [agent, setAgent] = useState(null) as any;

  useEffect(() => {

    setFetchingAgent(true);

    const fetchData = async () => {
        const response = await fetch("/api/agent/getOneAgent", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
              agentcode: params.agentcode,
              ////walletAddress: address,
            }),
        });

        const data = await response.json();


        if (data.result) {

          setAgent(data.result);

          setAgentAdminWalletAddress(data.result?.adminWalletAddress);

          ///console.log("data.result.adminWalletAddress", data.result.adminWalletAddress);

          if (data.result?.adminWalletAddress === address) {
            setIsAdmin(true);
          }


        } else {
          console.error("Agent not found for agentcode:", params.agentcode);
          setAgent(null);
          setAgentAdminWalletAddress("");

          toast.error("에이전트 정보를 찾을 수 없습니다.");

          // get agent list
          const agentListResponse = await fetch("/api/agent/getAllAgents", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
              limit: 100,
              page: 1,
            }),
          });
          const agentListData = await agentListResponse.json();
          if (agentListData.result) {
            setAgentList(agentListData.result.agents);
          } else {
            console.error("Failed to fetch agent list");
            setAgentList([]);
          }
        }

        setFetchingAgent(false);
    };

    params.agentcode && fetchData();

  } , [params.agentcode, address]);





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
          agentcode: params.agentcode,
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
  {"agentcode":"testagentcode","agentName":"테스트상점","agentType":"test","agentUrl":"https://test.com","agentDescription":"설명입니다.","agentLogo":"https://test.com/logo.png","agentBanner":"https://test.com/banner.png"}
  */}


  // insert buyer user
  const [userCode, setUserCode] = useState('');
  const [userName, setUserName] = useState('');
  const [userBankName, setUserBankName] = useState('');
  const [userType, setUserType] = useState('test');








  const [totalSummary, setTotalSummary] = useState<{
    totalNumberOfStores: number;
    latestStores: any[];

    totalNumberOfBuyers: number;
    latestBuyers: any[];

    totalNumberOfTrades: number;
    totalBuyAmountKrw: number;
    totalUsdtAmount: number;
    totalSettlementAmount: number;
    totalSettlementAmountKRW: number;

    totalFeeAmount: number;
    totalFeeAmountKRW: number;

    totalAgentFeeAmount: number;
    totalAgentFeeAmountKRW: number;

    latestTrades: any[];

    totalNumberOfBuyOrders: number;
    latestBuyOrders: any[];
  }>({
    totalNumberOfStores: 0,
    latestStores: [],
    totalNumberOfBuyers: 0,
    latestBuyers: [],

    totalNumberOfTrades: 0,
    totalBuyAmountKrw: 0,
    totalUsdtAmount: 0,
    totalSettlementAmount: 0,
    totalSettlementAmountKRW: 0,

    totalFeeAmount: 0,
    totalFeeAmountKRW: 0,
    totalAgentFeeAmount: 0,
    totalAgentFeeAmountKRW: 0,

    latestTrades: [],

    totalNumberOfBuyOrders: 0,
    latestBuyOrders: [],
  });

  const [loadingSummary, setLoadingSummary] = useState(true);

  const fetchTotalSummary = async () => {
    if (!address) {
      return;
    }

    setLoadingSummary(true);
    //const response = await fetch('/api/summary/getTotalSummaryForAgent', {
    const response = await fetch('/api/summary/getTotalSummary', {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json',
      },
      body: JSON.stringify(
        {
          agentcode: params.agentcode,
        }
      ),
    });
    if (!response.ok) {
      console.error('Error fetching total summary', response.statusText);
      setLoadingSummary(false);
      return;
    }
    const data = await response.json();
    
    //console.log('getTotalSummary data', data);

    setTotalSummary(data.result);

    setLoadingSummary(false);

  }


  useEffect(() => {
    if (!address) {
      return;
    }
    fetchTotalSummary();
    // interval
    
    const interval = setInterval(() => {
      fetchTotalSummary();
    } , 10000);
    return () => clearInterval(interval);
  } , [address, params.agentcode]);









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
  }, [!fetchingAgent && agent]); // Only run this effect when fetchingAgent is false




  // if loadinAgent is true, show loading
  if (fetchingAgent) {
    return (
      <main className="w-full p-4 pb-10 min-h-[100vh] flex items-start justify-center container max-w-screen-2xl mx-auto">
        <div className="py-0 w-full">
          <div className="flex flex-col items-center justify-center gap-4">
            <Image
              src="/banner-loading.gif"
              alt="Loading"
              width={100}
              height={100}
              className="rounded-lg w-40 h-40"
            />
            <span className="text-lg text-gray-500 ml-2">
              에이전트 정보를 불러오는 중...
            </span>
          </div>
        </div>
      </main>
    );
  }


  if (!fetchingAgent && !agent) {
    return (
      <main className="w-full p-4 pb-10 min-h-[100vh] flex items-start justify-center container max-w-screen-2xl mx-auto">
        <div className="py-0 w-full">
          
          
          <div className="flex flex-col items-center justify-center gap-4">
            <Image
              src="/banner-404.gif"
              alt="Error"
              width={100}
              height={100}
              className="rounded-lg w-20 h-20"
            />
            <div className="flex flex-row items-center justify-center gap-2">
              <span className="text-lg text-gray-500 ml-2">
                에이전트 정보를 찾을 수 없습니다.
              </span>   
            </div> 
          </div>

          {/* agent list */}
          {/* table view */}
          <div className="mt-8">
            
            <div className="flex flex-row items-center justify-start mb-4">
              <Image
                src="/icon-agent.png"
                alt="Agent Icon"
                width={50}
                height={50}
                className="rounded-lg w-10 h-10"
              />
              <span className="text-xl font-bold">에이전트 목록</span>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full bg-white">
                <thead>
                  <tr>
                    <th className="px-4 py-2 border">에이전트 로고</th>
                    <th className="px-4 py-2 border">에이전트 이름</th>
                    <th className="px-4 py-2 border">에이전트 코드</th>
                    <th className="px-4 py-2 border">에이전트 타입</th>
                    <th className="px-4 py-2 border">에이전트 URL</th>
                  </tr>
                </thead>
                <tbody>
                  {agentList.map((agent) => (
                    <tr key={agent.agentcode}>

                      <td className="px-4 py-2 border">
                        <Image
                          src={agent.agentLogo || "/logo.png"}
                          alt="Agent Logo"
                          width={50}
                          height={50}
                          className="rounded-lg w-10 h-10"
                        />
                      </td>
                      <td className="px-4 py-2 border">{agent.agentName}</td>
                      <td className="px-4 py-2 border">{agent.agentcode}</td>
                      <td className="px-4 py-2 border">{agent.agentType}</td>
                      <td className="px-4 py-2 border">
                        <a
                          href={`/${params.lang}/admin/agent/${agent.agentcode}`}
                          className="text-blue-500 hover:underline"
                        >
                          이동하기
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 flex flex-row items-center justify-between mt-4">
              <Image
                src="/icon-info.png"
                alt="Info Icon"
                width={30}
                height={30}
                className="rounded-lg w-6 h-6"
              />
              <span className="text-sm text-gray-500">
                에이전트 목록을 확인하고, 원하는 에이전트를 선택하여 거래를 시작하세요.
              </span>
            </div>

          </div>


        </div>
      </main>
    );
  }







  if (!address) {
    return (
   <main className="p-4 pb-10 min-h-[100vh] flex items-start justify-center container max-w-screen-2xl mx-auto">


      <div className="py-0 w-full">




        {params.agentcode && (
          <div className={`w-full flex flex-col xl:flex-row items-center justify-start gap-2
            p-2 rounded-lg mb-4
              "bg-black/10"
            }`}>
                
              <div className="w-full flex flex-row items-center justify-start gap-2">
                <div className="flex flex-row items-center justify-start gap-2">
                  <Image
                    src={agent?.agentLogo || "/logo.png"}
                    alt="logo"
                    width={50}
                    height={50}
                    className="rounded-lg w-16 h-16"
                  />
                  <div className="flex flex-col items-start justify-start">
                    <span className="text-sm text-[#3167b4] font-bold">
                      {agent?.agentName || "에이전트 이름"}
                    </span>
                    <span className="text-sm text-gray-500">
                      {agent?.agentcode || "에이전트 코드"}
                    </span>
                  </div>
                </div>

                {address && address === agentAdminWalletAddress && (
                  <div className="text-sm text-[#3167b4] font-bold">
                    {agent?.agentName + " (" + agent?.agentcode + ") 에이전트"}
                  </div>
                )}
                {address && address !== agentAdminWalletAddress && (
                  <div className="text-sm text-[#3167b4] font-bold">
                    {agent?.agentName + " (" + agent?.agentcode + ")"}
                  </div>
                )}

              </div>


              {address && !loadingUser && (


                <div className="w-full flex flex-row items-center justify-end gap-2">
                  <button
                    onClick={() => {
                      router.push('/' + params.lang + '/admin/profile-settings');
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
                              //    "/admin/" + params.agentcode
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


        <div className="w-full flex flex-col justify-between items-center gap-2 mb-5">
   

          <div className="w-full flex flex-row gap-2 justify-end items-center">


          {/* right space */}
          {/* background transparent */}
          <select
            //className="p-2 text-sm bg-zinc-800 text-white rounded"


            className="p-2 text-sm bg-transparent text-zinc-800 rounded"

            onChange={(e) => {
              const lang = e.target.value;
              router.push(
                "/" + lang + "/" + params.agentcode + "/center"
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

      </div>

    </main>


    );
  }





  // if agent.adminWalletAddress is same as address, return "에이전트 관리자" else return "에이전트"
  // if user?.role is not "admin", return "에이전트"

  if (
    (address
    && agent
    //&&  address !== agent.adminWalletAddress)
    && !isAdmin)
    

  ) {
    return (
      <main className="p-4 pb-10 min-h-[100vh] flex items-start justify-center container max-w-screen-2xl mx-auto">

        <div className="py-0 w-full">

          <div className={`w-full flex flex-col xl:flex-row items-center justify-start gap-2
            p-2 rounded-lg mb-4
            ${agent?.backgroundColor ?
              "bg-[#"+agent?.backgroundColor+"]" :
              "bg-black/10"
            }`}>


            <div className="w-full flex flex-row items-center justify-start gap-2">
              <Image
                src={agent?.agentLogo || "/logo.png"}
                alt="logo"
                width={50}
                height={50}
                className="rounded-lg w-16 h-16"
              />
              <div className="flex flex-col items-start justify-start">
                <span className="text-sm text-[#3167b4] font-bold">
                  {agent?.agentName || "에이전트 이름"}
                </span>
                <span className="text-xs text-gray-500">
                  {agent?.agentcode || "에이전트 코드"}
                </span>
              </div>
            </div>
              


        

            {/* 로그아웃 버튼 */}
            <div className="w-full flex flex-row items-center justify-end gap-2">
              <button
                onClick={() => {
                  confirm("로그아웃 하시겠습니까?") && activeWallet?.disconnect()
                  .then(() => {

                      toast.success('로그아웃 되었습니다');

                      //router.push(
                      //    "/admin/" + params.agentcode
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




          </div>



          {/* 에이전트 관리자가 아닙니다. 회원가입한후 센터에 문의하세요. */}
          <div className="w-full flex flex-col items-center justify-center gap-4 mt-8">
            <Image
              src="/banner-404.gif"
              alt="Error"
              width={100}
              height={100}
              className="rounded-lg w-20 h-20"
            />
            <span className="text-lg text-gray-500 ml-2">
              에이전트 관리자가 아닙니다. 회원가입한후 센터에 문의하세요.
            </span>


            {/* 회원가입하러 가기 */}
            <div className="flex flex-row items-center justify-center gap-2">
              <button
                onClick={() => {
                  router.push('/' + params.lang + '/admin/agent/' + params.agentcode + '/profile-settings');
                  //router.push('/' + params.lang + '/' + params.agentcode + '/profile-settings');
                }}
                className="flex bg-[#3167b4] text-sm text-[#f3f4f6] px-4 py-2 rounded-lg hover:bg-[#3167b4]/80"
              >
                회원가입하러 가기
              </button>
            </div>

          </div>

        </div>

      </main>
    );

  }



  // 



  return (

    <main className="p-4 pb-10 min-h-[100vh] flex items-start justify-center container max-w-screen-2xl mx-auto">


      <div className="py-0 w-full">


        {/*
        
                    <div className=`{w-full flex flex-row items-center justify-center gap-2
             
            
            bg-black/10

          

             p-2 rounded-lg mb-4}`
             >

              <div className={`w-full flex flex-row items-center justify-start gap-2
                p-2 rounded-lg mb-4
                ${agent?.backgroundColor ?
                  "bg-[#"+agent?.backgroundColor+"]" :
                  "bg-black/10"
                }`}>



          */}             

          {/* agent?.backgroundColor is 000000 - ffffff */}



          <div className={`w-full flex flex-col xl:flex-row items-center justify-start gap-2
              p-2 rounded-lg mb-4
              ${agent?.backgroundColor ?
                "bg-[#"+agent?.backgroundColor+"]" :
                "bg-black/10"
              }`}>

              
            <div className="w-full flex flex-row items-center justify-start gap-2">
              <Image
                src={agent?.agentLogo || "/logo.png"}
                alt="logo"
                width={50}
                height={50}
                className="rounded-lg w-16 h-16"
              />
              {address && address === agentAdminWalletAddress && (
                <div className="text-sm text-[#3167b4] font-bold">
                  {agent && agent?.agentName + " (" + agent?.agentcode + ") 에이전트"}
                </div>
              )}
              {address && address !== agentAdminWalletAddress && (
                <div className="text-sm text-[#3167b4] font-bold">
                  {agent && agent?.agentName + " (" + agent?.agentcode + ")"}
                </div>
              )}

            </div>


              {/* 가맹점 설정 */}
              {
              ///address === agent?.adminWalletAddress && (
              isAdmin && (
                <div className="
                  w-full
                  flex flex-row items-center gap-2">
                  <button
                    onClick={() => {
                      router.push('/' + params.lang + '/admin/agent/' + params.agentcode + '/my-settings');
                    }}
                    className="
                      items-center justify-center
                      bg-[#3167b4] text-sm text-[#f3f4f6] px-4 py-2 rounded-lg hover:bg-[#3167b4]/80"
                  >
                    <span className="text-sm text-zinc-50">에이전트 설정</span>
                  </button>
                </div>
              )}



            {address && !loadingUser && (


              <div className="w-full flex flex-row items-center justify-end gap-2">

                <button
                  onClick={() => {
                    router.push('/' + params.lang + '/admin/agent/' + params.agentcode + '/profile-settings');
                  }}
                  className="flex bg-[#3167b4] text-sm text-[#f3f4f6] px-4 py-2 rounded-lg hover:bg-[#3167b4]/80"
                >
                  <div className="flex flex-row items-center justify-center gap-2">

                      <div className="flex flex-row items-center justify-center gap-2">
                        <Image
                          src="/icon-agent.png"
                          alt="Agent"
                          width={20}
                          height={20}
                          className="rounded-lg w-5 h-5"
                        />
                        <span className="text-sm text-yellow-500">
                          에이전트 관리자
                        </span>
                      </div>

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
                            //    "/admin/" + params.agentcode
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
 


        <div className="w-full flex flex-col justify-between items-center gap-2 mb-5">
   

          <div className="w-full flex flex-row gap-2 justify-end items-center">


          {/* right space */}
          {/* background transparent */}
          <select
            //className="p-2 text-sm bg-zinc-800 text-white rounded"


            className="p-2 text-sm bg-transparent text-zinc-800 rounded"

            onChange={(e) => {
              const lang = e.target.value;
              router.push(
                "/" + lang + "/" + params.agentcode + "/center"
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






        {/* total summary */}
        {/* dashboard style */}

        <div className="w-full flex flex-col items-start justify-center gap-2 mt-4">


          <div className="w-full grid grid-cols-1 xl:grid-cols-2 gap-4 mt-4">


       
            
            {/* store */}
            <div className="w-full flex flex-col items-start justify-start gap-2  bg-white shadow-md rounded-lg p-4">
              
              <div className="w-full flex flex-col xl:flex-row items-center justify-start gap-2">

                <div className="w-full flex flex-row items-center justify-start gap-2">                
                  <Image
                    src="/icon-store.png"
                    alt="Store"
                    width={35}
                    height={35}
                    className="w-7 h-7"
                  />
                  <h2 className="text-lg font-semibold">총 가맹점수</h2>
                  <p className="text-lg text-zinc-500">
                    {totalSummary.totalNumberOfStores} 개
                  </p>
                  {loadingSummary && (
                    <Image
                      src="/loading.png"
                      alt="Loading"
                      width={20}
                      height={20}
                      className="w-5 h-5 animate-spin"
                    />
                  )}
                </div>

                <div className="w-full flex flex-row items-center justify-end gap-2">
                  <button
                    onClick={() => {
                      router.push('/' + params.lang + '/admin/agent/' + params.agentcode + '/store');
                    }}
                    className="
                      w-full
                      bg-[#3167b4] text-sm text-[#f3f4f6] px-4 py-2 rounded-lg hover:bg-[#3167b4]/80"
                  >
                    <div className="flex flex-row items-center justify-center gap-2">
                      {
                        agent?.agentLogo ? (
                          <Image
                            src={agent?.agentLogo}
                            alt="Agent Logo"
                            width={20}
                            height={20}
                            className="rounded-full w-5 h-5"
                          />
                        ) : (
                          <Image
                            src="/icon-store.png"
                            alt="Store Icon"
                            width={20}
                            height={20}
                            className="rounded-full w-5 h-5"
                          />
                        )
                      }
                      <span className="text-sm">
                        {agent?.agentName}
                      </span>
                      <span className="text-sm">
                        가맹점관리
                      </span>
                    </div>

                  </button>
                </div>

              </div>


              {/* latest stores talble */}
              <div className="w-full mt-4">
                <div className="flex flex-row items-center justify-start gap-2">
                  {/* dot */}
                  <div className="w-2 h-2 bg-[#3167b4] rounded-full"></div>
                  <h2 className="text-lg font-semibold">최근 등록 가맹점</h2>
                </div>
                <table className="min-w-full
                  border-collapse
                  border border-gray-300
                  rounded-lg
                  overflow-hidden
                  shadow-md
                ">
                  <thead 
                    className="bg-gray-100
                      text-gray-600
                      text-sm
                      font-semibold
                      uppercase
                      border-b
                    "
                  >
                    <tr>
                      <th className="px-4 py-2 text-left">가맹점</th>
                      <th className="px-4 py-2 text-right">
                        AG 수수료율(%)
                      </th>
                      <th className="px-4 py-2 text-right">
                          회원수(명)
                          <br/>
                          거래수(건)
                      </th>
                      <th className="px-4 py-2 text-right">
                        거래량(USDT)<br/>거래금액(원)
                      </th>
                      <th className="px-4 py-2 text-right">
                        결제량(USDT)<br/>결제금액(원)
                      </th>
                      <th className="px-4 py-2 text-right">
                        수수료수량(USDT)<br/>수수료금액(원)
                      </th>

                      {/*
                      <th className="px-4 py-2 text-left">가입일</th>
                      */}
                    </tr>
                  </thead>
                  <tbody>
                    {totalSummary.latestStores.map((store, index) => (
                      <tr key={index} className="border-b">
                        <td className="
                          px-4 py-2">
                            <div className="flex flex-col items-center justify-start gap-2">
                              <Image
                                src={store.storeLogo || "/icon-store.png"}
                                alt="Store Logo"
                                width={40}
                                height={40}
                                className="rounded-full w-10 h-10"
                              />
                              <button
                                onClick={() => {
                                  router.push('/' + params.lang + '/admin/agent/' + params.agentcode + '/store/')
                                }}
                                className="text-blue-500 hover:underline"
                              >
                                {store.storeName}
                              </button>
                          </div>
                        </td>

                        <td className="px-4 py-2
                        text-right
                        ">
                          {store.agentFeePercent}
                        </td>

                        <td className="px-4 py-2
                        text-right
                        ">
                          {store.totalPaymentConfirmedCount > 0 ? Number(store.totalPaymentConfirmedCount)?.toLocaleString() : 0}
                          <br/>
                          {store.totalBuyerCount > 0 ? Number(store.totalBuyerCount)?.toLocaleString() : 0}
                          
                        </td>

                        <td className="px-4 py-2
                        text-right">
                          {store.totalUsdtAmount > 0 ? Number(store.totalUsdtAmount)?.toLocaleString() : 0}
                          <br/>
                          {store.totalKrwAmount > 0 ? Number(store.totalKrwAmount)?.toLocaleString() : 0}
                        </td>

                        <td className="px-4 py-2
                        text-right">
                          {store.totalSettlementAmount > 0 ? Number(store.totalSettlementAmount)?.toLocaleString() : 0}
                          <br/>
                          {store.totalSettlementAmountKRW > 0 ? Number(store.totalSettlementAmountKRW)?.toLocaleString() : 0}
                        </td>
                        <td className="px-4 py-2
                        text-right
                        ">
                          {store.totalAgentFeeAmount > 0 ? Number(store.totalAgentFeeAmount)?.toLocaleString() : 0}
                          <br/>
                          {store.totalAgentFeeAmountKRW > 0 ? Number(store.totalAgentFeeAmountKRW)?.toLocaleString() : 0}
                        </td>
                        {/*
                        <td className="px-4 py-2">{new Date(store.createdAt).toLocaleDateString()}</td>
                        */}
                      </tr>
                    ))}
                  </tbody>
                </table>

              </div>

            </div>
            
            
            <div className="w-full flex flex-col items-start justify-start gap-2  bg-white shadow-md rounded-lg p-4">
              

              <div className="w-full flex flex-col xl:flex-row items-center justify-start gap-2">

                <div className="w-full flex flex-row items-center justify-start gap-2">                
                  <Image
                    src="/icon-user.png"
                    alt="Buyer"
                    width={35}
                    height={35}
                    className="w-6 h-6"
                  />
                  <h2 className="text-lg font-semibold">총 회원수</h2>
                  <p className="text-lg text-zinc-500">
                    {totalSummary.totalNumberOfBuyers} 명
                  </p>
                  {loadingSummary && (
                    <Image
                      src="/loading.png"
                      alt="Loading"
                      width={20}
                      height={20}
                      className="w-5 h-5 animate-spin"
                    />
                  )}
                </div>

                <div className="w-full flex flex-row items-center justify-end gap-2">
                  <button
                    onClick={() => {
                      router.push('/' + params.lang + '/admin/agent/' + params.agentcode + '/member');
                    }}
                    className="
                      w-full
                      bg-[#3167b4] text-sm text-[#f3f4f6] px-4 py-2 rounded-lg hover:bg-[#3167b4]/80"
                  >
                    <div className="flex flex-row items-center justify-center gap-2">
                      {
                        agent?.agentLogo ? (
                          <Image
                            src={agent?.agentLogo}
                            alt="Agent Logo"
                            width={20}
                            height={20}
                            className="rounded-full w-5 h-5"
                          />
                        ) : (
                          <Image
                            src="/icon-store.png"
                            alt="Store Icon"
                            width={20}
                            height={20}
                            className="rounded-full w-5 h-5"
                          />
                        )
                      }
                      <span className="text-sm">
                        {agent?.agentName}
                      </span>
                      <span className="text-sm">
                        회원관리
                      </span>
                    </div>

                  </button>
                </div>

              </div>




              {/* latest buyers talble */}
              <div className="w-full mt-4">
                <div className="flex flex-row items-center justify-start gap-2">
                  {/* dot */}
                  <div className="w-2 h-2 bg-[#3167b4] rounded-full"></div>
                  <h2 className="text-lg font-semibold">최근 구매회원</h2>
                </div>
                <table className="min-w-full
                  border-collapse
                  border border-gray-300
                  rounded-lg
                  overflow-hidden
                  shadow-md
                ">
                  <thead
                    className="bg-gray-100
                      text-gray-600
                      text-sm
                      font-semibold
                      uppercase
                      border-b
                    "
                  >
                    <tr>
                      
                      <th className="px-4 py-2 text-left">회원아이디</th>
                      <th className="px-4 py-2 text-left">가맹점</th>
                      <th className="px-4 py-2 text-left">입금자명</th>
                      <th className="
                        hidden xl:block
                        px-4 py-2 text-left">은행</th>
                      {/*
                      <th className="px-4 py-2 text-left">가입일</th>
                      */}
                    </tr>
                  </thead>
                  <tbody>
                    {totalSummary.totalNumberOfBuyers > 0 && totalSummary.latestBuyers.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-4 py-2 text-center">
                          최근 구매회원이 없습니다.
                        </td>
                      </tr>
                    )}
                    {totalSummary.latestBuyers.map((buyer, index) => (
                      <tr key={index} className="border-b">
                        <td className="px-4 py-2">{buyer.nickname}</td>
                        <td className="px-4 py-2">
                          {buyer?.store?.storeName}
                        </td>
                        
                        <td className="px-4 py-2">{buyer?.buyer.depositName}</td>
                        <td className="
                          hidden xl:block
                          px-4 py-2">
                          {buyer?.buyer.depositBankName}
                        </td>
                        {/*
                        <td className="px-4 py-2">{new Date(buyer.createdAt).toLocaleDateString()}</td>
                        */}
                      </tr>
                    ))}
                  </tbody>
                </table>

              </div>

            </div>


            {/* total number of trades, total buy amount krw, total usdt amount */}
            <div className="w-full flex flex-col items-start justify-start gap-2  bg-white shadow-md rounded-lg p-4">

              <div className="w-full flex flex-col xl:flex-row items-center justify-start gap-2">

                <div className="w-full flex flex-row items-center justify-start gap-2">                
                  <Image
                    src="/icon-trade.png"
                    alt="Trade"
                    width={35}
                    height={35}
                    className="w-6 h-6"
                  />
                  <h2 className="text-lg font-semibold">총 거래수</h2>
                  <p className="text-lg text-zinc-500">
                    {totalSummary.totalNumberOfTrades}
                  </p>
                  {loadingSummary && (
                    <Image
                      src="/loading.png"
                      alt="Loading"
                      width={20}
                      height={20}
                      className="w-5 h-5 animate-spin"
                    />
                  )}
                </div>

                <div className="w-full flex flex-row items-center justify-end gap-2">
                  <button
                    onClick={() => {
                      router.push('/' + params.lang + '/admin/agent/' + params.agentcode + '/trade-history');
                    }}
                    className="
                      w-full
                      bg-[#3167b4] text-sm text-[#f3f4f6] px-4 py-2 rounded-lg hover:bg-[#3167b4]/80"
                  >
                    <div className="flex flex-row items-center justify-center gap-2">
                      {
                        agent?.agentLogo ? (
                          <Image
                            src={agent?.agentLogo}
                            alt="Agent Logo"
                            width={20}
                            height={20}
                            className="rounded-full w-5 h-5"
                          />
                        ) : (
                          <Image
                            src="/icon-store.png"
                            alt="Store Icon"
                            width={20}
                            height={20}
                            className="rounded-full w-5 h-5"
                          />
                        )
                      }
                      <span className="text-sm">
                        {agent?.agentName}
                      </span>
                      <span className="text-sm">
                        P2P 거래내역
                      </span>
                    </div>

                  </button>
                </div>

              </div>

              <div className="w-full flex flex-col items-center justify-center gap-2
                bg-white shadow-md rounded-lg p-4 mt-4">

                <div className="flex flex-row items-center justify-center gap-2">
                
                  <div className="flex flex-col xl:flex-row items-center justify-center gap-2">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <h2 className="text-lg font-semibold">총 거래금액(원)</h2>
                      <p className="text-lg text-zinc-500">
                        {Number(totalSummary.totalBuyAmountKrw)?.toLocaleString()} 원
                      </p>
                    </div>

                    <div className="flex flex-col items-center justify-center gap-2">
                      <h2 className="text-lg font-semibold">총 거래량(USDT)</h2>
                      <p className="text-lg text-zinc-500">
                        {Number(totalSummary.totalUsdtAmount)?.toLocaleString()} USDT
                      </p>
                    </div>
                  </div>

                  {/* divider */}
                  <div className="w-0.5 h-10 bg-gray-300 mx-2"></div>

                  <div className="flex flex-col xl:flex-row items-center justify-center gap-2">
                  
                    <div className="flex flex-col items-center justify-center gap-2">
                      <h2 className="text-lg font-semibold">총 결제금액(원)</h2>
                      <p className="text-lg text-zinc-500">
                        {Number(totalSummary.totalSettlementAmountKRW)?.toLocaleString()} 원
                      </p>
                    </div>
                    <div className="flex flex-col items-center justify-center gap-2">
                      <h2 className="text-lg font-semibold">총 결제량(USDT)</h2>
                      <p className="text-lg text-zinc-500">
                        {Number(totalSummary.totalSettlementAmount)?.toLocaleString()} USDT
                      </p>
                    </div>

                  </div>

                </div>

                {/* 총 수수료금액 */}
                <div className="flex flex-row items-center justify-center gap-2 mt-4">
                  <div className="flex flex-col xl:flex-row items-center justify-center gap-2">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <h2 className="text-lg font-semibold">총 수수료금액(원)</h2>
                      <p className="text-lg text-zinc-500">
                        {Number(totalSummary.totalAgentFeeAmountKRW)?.toLocaleString()} 원
                      </p>
                    </div>
                    <div className="flex flex-col items-center justify-center gap-2">
                      <h2 className="text-lg font-semibold">총 수수료량(USDT)</h2>
                      <p className="text-lg text-zinc-500">
                        {Number(totalSummary.totalAgentFeeAmount)?.toLocaleString()} USDT
                      </p>
                    </div>
                  </div>
                </div>



              </div>


              <div className="w-full flex flex-row items-center justify-end gap-2">

                {/* latest trades table */}
                <div className="w-full mt-4">
                  <div className="flex flex-row items-center justify-start gap-2">
                    {/* dot */}
                    <div className="w-2 h-2 bg-[#3167b4] rounded-full"></div>
                    <h2 className="text-lg font-semibold">최근 거래</h2>
                  </div>

                  <table className="min-w-full
                    border-collapse
                    border border-gray-300
                    rounded-lg
                    overflow-hidden
                    shadow-md
                  ">
                    <thead
                      className="bg-gray-100
                        text-gray-600
                        text-sm
                        font-semibold
                        uppercase
                        border-b
                      "
                    >
                      <tr>
                        
                        <th className="px-4 py-2 text-left">거래번호<br/>거래시간</th>
                        <th className="
                          hidden xl:block
                          px-4 py-2 text-left">
                          가맹점<br/>구매자
                        </th>
                        <th className="px-4 py-2 text-left">거래금액(원)<br/>거래량(USDT)</th>
                        <th className="px-4 py-2 text-left">결제금액(원)<br/>결제량(USDT)</th>
                        <th className="px-4 py-2 text-left">수수료금액(원)<br/>수수료량(USDT)</th>
                    
                        {/*
                        <th className="hidden xl:block
                          px-4 py-2 text-left">판매자</th>
                        {/*
                        <th className="px-4 py-2 text-left">거래일시</th>
                        */}
                      </tr>
                    </thead>
                    <tbody>
                      {totalSummary.latestTrades.map((trade, index) => (
                        <tr key={index} className="border-b">
                          <td className="px-4 py-2">
                            #{trade.tradeId.slice(0, 3) + "..."}
                            <br/>
                            {
                              new Date().getTime() - new Date(trade.paymentConfirmedAt).getTime() < 1000 * 60 ? (
                                ' ' + Math.floor((new Date().getTime() - new Date(trade.paymentConfirmedAt).getTime()) / 1000) + ' 초 전'
                              ) :
                              new Date().getTime() - new Date(trade.paymentConfirmedAt).getTime() < 1000 * 60 * 60 ? (
                                ' ' + Math.floor((new Date().getTime() - new Date(trade.paymentConfirmedAt).getTime()) / 1000 / 60) + ' 분 전'
                              ) : (
                                ' ' + Math.floor((new Date().getTime() - new Date(trade.paymentConfirmedAt).getTime()) / 1000 / 60 / 60) + ' 시간 전'
                              )
                            }
                          </td>
                          <td className="
                            hidden xl:block
                            px-4 py-2">
                            {trade?.store?.storeName}
                            <br/>
                            {trade?.buyer?.depositName}
                          </td>

                          <td className="px-4 py-2">
                            {Number(trade.krwAmount)?.toLocaleString()} 원
                            <br/>
                            {Number(trade.usdtAmount)?.toLocaleString()} USDT
                          </td>
                          <td className="px-4 py-2">
                            {trade?.settlement?.settlementAmountKRW > 0 ? Number(trade.settlement.settlementAmountKRW)?.toLocaleString() : 0} 원
                            <br/>
                            {trade?.settlement?.settlementAmount > 0 ? Number(trade.settlement.settlementAmount)?.toLocaleString() : 0} USDT
                          </td>
                          <td className="px-4 py-2">
                            {trade?.settlement?.agentFeeAmountKRW > 0 ? Number(trade.settlement.agentFeeAmountKRW)?.toLocaleString() : 0} 원
                            <br/>
                            {trade?.settlement?.agentFeeAmount > 0 ? Number(trade.settlement.agentFeeAmount)?.toLocaleString() : 0} USDT
                          </td>

                          {/*}
                          <td className="
                            hidden xl:block
                            px-4 py-2">
                            {trade?.seller?.nickname.length > 10 ? trade?.seller?.nickname.slice(0, 10) + "..." : trade?.seller?.nickname}
                            <br/>
                            {trade?.seller?.bankInfo?.bankName}
                            <br/>
                            {trade?.seller?.bankInfo?.accountHolder}
                          </td>
                          */}

                          {/*}
                          <td className="px-4 py-2 text-xs">
                            {
                              //new Date(trade.createdAt).toLocaleDateString() + " " + new Date(trade.createdAt).toLocaleTimeString()
                              new Date(trade.createdAt).toLocaleTimeString()
                            }

                          </td>
                          */}
                        </tr>
                      ))}
                    </tbody>
                  </table>

                </div>

              </div>
              {/*
              <div className="w-full flex flex-row items-center justify-end gap-2">

                <button
                  onClick={() => {
                    router.push('/' + params.lang + '/admin/trade-history');
                  }}
                  className="bg-[#3167b4] text-sm text-[#f3f4f6] px-4 py-2 rounded-lg hover:bg-[#3167b4]/80"
                >
                  P2P 거래내역
                </button>
              </div>
              */}

            </div>



            {/* total number of trades, total buy amount krw, total usdt amount */}
            <div className="w-full flex flex-col items-start justify-start gap-2  bg-white shadow-md rounded-lg p-4">

              <div className="w-full flex flex-col xl:flex-row items-center justify-start gap-2">

                <div className="w-full flex flex-row items-center justify-start gap-2">                
                  <Image
                    src="/icon-buyorder.png"
                    alt="Buy Order"
                    width={35}
                    height={35}
                    className="w-6 h-6"
                  />
                  <h2 className="text-lg font-semibold">총 구매주문수</h2>
                  <p className="text-lg text-zinc-500">
                    {totalSummary.totalNumberOfBuyOrders}
                  </p>
                  {loadingSummary && (
                    <Image
                      src="/loading.png"
                      alt="Loading"
                      width={20}
                      height={20}
                      className="w-5 h-5 animate-spin"
                    />
                  )}
                </div>

                <div className="w-full flex flex-row items-center justify-end gap-2">
                  <button
                    onClick={() => {
                      router.push('/' + params.lang + '/admin/agent/' + params.agentcode + '/buyorder');
                    }}
                    className="
                      w-full
                      bg-[#3167b4] text-sm text-[#f3f4f6] px-4 py-2 rounded-lg hover:bg-[#3167b4]/80"
                  >
                    <div className="flex flex-row items-center justify-center gap-2">
                      {
                        agent?.agentLogo ? (
                          <Image
                            src={agent?.agentLogo}
                            alt="Agent Logo"
                            width={20}
                            height={20}
                            className="rounded-full w-5 h-5"
                          />
                        ) : (
                          <Image
                            src="/icon-store.png"
                            alt="Store Icon"
                            width={20}
                            height={20}
                            className="rounded-full w-5 h-5"
                          />
                        )
                      }
                      <span className="text-sm">
                        {agent?.agentName}
                      </span>
                      <span className="text-sm">
                        구매주문관리
                      </span>
                    </div>

                  </button>
                </div>

              </div>



              <div className="w-full flex flex-row items-center justify-end gap-2">

                <div className="w-full mt-4">
                  <div className="flex flex-row items-center justify-start gap-2">
                    {/* dot */}
                    <div className="w-2 h-2 bg-[#3167b4] rounded-full"></div>
                    <h2 className="text-lg font-semibold">최근 구매주문</h2>
                  </div>

                  <table className="min-w-full
                    border-collapse
                    border border-gray-300
                    rounded-lg
                    overflow-hidden
                    shadow-md
                  ">
                    <thead
                      className="bg-gray-100
                        text-gray-600
                        text-sm
                        font-semibold
                        uppercase
                        border-b
                      "
                    >
                      <tr>
                        
                        <th className="px-4 py-2 text-left">거래번호<br/>거래시간</th>
                        <th className="px-4 py-2 text-left">
                          가맹점<br/>구매자
                        </th>
                        <th className="px-4 py-2 text-left">구매금액(원)<br/>구매량(USDT)</th>
                        <th className="px-4 py-2 text-left">상태</th>
                      </tr>
                    </thead>
                    <tbody>
                      {totalSummary.latestBuyOrders.map((trade, index) => (
                        <tr key={index} className="border-b">
                          <td className="px-4 py-2">
                            #{trade.tradeId.slice(0, 3) + "..."}
                            <br/>
                            {
                              new Date().getTime() - new Date(trade.createdAt).getTime() < 1000 * 60 ? (
                                ' ' + Math.floor((new Date().getTime() - new Date(trade.createdAt).getTime()) / 1000) + ' 초 전'
                              ) :
                              new Date().getTime() - new Date(trade.createdAt).getTime() < 1000 * 60 * 60 ? (
                                ' ' + Math.floor((new Date().getTime() - new Date(trade.createdAt).getTime()) / 1000 / 60) + ' 분 전'
                              ) : (
                                ' ' + Math.floor((new Date().getTime() - new Date(trade.createdAt).getTime()) / 1000 / 60 / 60) + ' 시간 전'
                              )
                            }
                          </td>

                          <td className="px-4 py-2">
                            {trade?.store?.storeName}
                            <br/>
                            {trade?.buyer?.depositName}
                          </td>
                          <td className="px-4 py-2">
                            {Number(trade.krwAmount)?.toLocaleString()} 원
                            <br/>
                            {Number(trade.usdtAmount)?.toLocaleString()} USDT
                          </td>

                          <td className="px-4 py-2">
                            {/* "orderded", "accepted", "paymentRequested" */}

                            <button
                              onClick={() => {
                                //router.push('/' + params.lang + '/' + trade.storecode + '/pay-usdt-reverse/' + trade.tradeId);
                                // new window open
                                window.open(
                                  '/' + params.lang + '/' + trade.storecode + '/pay-usdt-reverse/' + trade._id,
                                  '_blank'
                                );
                              }}
                              className={`
                                text-sm font-semibold
                                bg-[#3167b4] text-white
                                px-2 py-1 rounded-lg
                                hover:bg-[#3167b4]/80
                                ${trade.status === "ordered" ? "bg-red-500" : ""}
                                ${trade.status === "accepted" ? "bg-green-500" : ""}
                                ${trade.status === "paymentRequested" ? "bg-yellow-500" : ""}
                              `}
                            >

                              {trade.status === "ordered" ? (
                                <span className="text-white font-semibold">
                                  구매주문
                                </span>
                              ) : trade.status === "accepted" ? (
                                <span className="text-white font-semibold">
                                  거래시작
                                </span>
                              ) : trade.status === "paymentRequested" ? (
                                <span className="text-white font-semibold">
                                  결제요청
                                </span>
                              ) : (
                                <span className="text-white font-semibold">
                                  {trade.status}
                                </span>
                              )}


                              
                                {/*
                              {trade.status === "ordered" ? (
                                <span className="text-red-500 font-semibold
                                  bg-red-100/50
                                  px-2 py-1 rounded-lg
                                ">
                                  구매주문
                                </span>
                              ) : trade.status === "accepted" ? (
                              <span className="text-green-500 font-semibold
                                bg-green-100/50
                                px-2 py-1 rounded-lg
                              ">
                                  거래시작
                                </span>
                              ) : trade.status === "paymentRequested" ? (
                                <span className="text-yellow-500 font-semibold
                                  bg-yellow-100/50
                                  px-2 py-1 rounded-lg
                                ">
                                  결제요청
                                </span>
                              ) : ""
                              }
                              */}

                            </button>
                          </td>

                        </tr>
                      ))}
                    </tbody>
                  </table>

                </div>

              </div>
              {/*
              <div className="w-full flex flex-row items-center justify-end gap-2">

                <button
                  onClick={() => {
                    router.push('/' + params.lang + '/admin/trade-history');
                  }}
                  className="bg-[#3167b4] text-sm text-[#f3f4f6] px-4 py-2 rounded-lg hover:bg-[#3167b4]/80"
                >
                  P2P 거래내역
                </button>
              </div>
              */}

            </div>





          </div>

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
                          


                        </div>
                      ) : (

                        <div className="flex flex-col gap-2 justify-center items-center">
                          {/* 아이디를 설정해야 거래를 시작할 수 있습니다. */}
                          {
                          address
                          && !loadingUser
                          && (
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
                                  "/" + params.lang + "/admin/agent/" + params.agentcode + "/profile-settings"
                                );


                              }}
                              className="text-zinc-800 underline"
                            >

                              프로필 설정

                            </button>

                          </div>
                        

                        </div>
                      )}

                    </>

                  )}


                </div>


                {true && (
            
                  <div className="w-full flex flex-row gap-2 justify-between items-center mt-5">

                    {/*
                    <button
                      onClick={() => {
    

                        // redirect to buy USDT page
                        router.push(
                          //"/" + params.lang + "/" + storecode + "/buyorder-usdt"

                          //wallet === "smart" ?
                          //</div>"/" + params.lang + "/" + storecode + "/buyorder-usdt?wallet=smart"
                          //:

                          "/" + params.lang + "/" + storecode + "/buyorder-placement"

                        );

                      }}
                      className="w-full flex flex-row gap-2 justify-center items-center
                      bg-[#3167b4] text-sm text-[#f3f4f6] px-4 py-2 rounded-lg hover:bg-[#3167b4]/80"
                    >
                      <Image
                        src="/icon-buy-label-color.png"
                        alt="Buy"
                        width={40}
                        height={40}
                        className="w-6 h-6"
                      />
                      {Buy}
                    </button>
                    */}
              


                    {/*
                    <button
                      //disabled={!address}
                      onClick={() => {
                        // my sell trades
                        //console.log("my sell trades");
                        //if (!address) {
                        //  toast.error(Please_connect_your_wallet_first);
                        //  return;
                        //}

                        //if (!seller && !userCode) {
                        //  toast.error(Please_verify_your_account_first_for_selling);
                        //  return;
                        // }

                        // redirect to sell trades page
                        router.push(
                          //"/" + params.lang + "/" + storecode + "/accept-buyorder-usdt"

                          //wallet === "smart" ?
                          //</div>"/" + params.lang + "/" + storecode + "/accept-buyorder-usdt?wallet=smart"
                          //:

                          "/" + params.lang + "/admin/trade"

                        );

                      }}
                      className="w-full flex flex-row gap-2 justify-center items-center
                      bg-[#3167b4] text-sm text-[#f3f4f6] px-4 py-2 rounded-lg hover:bg-[#3167b4]/80"
                    >
                      <Image
                        src="/icon-sell-label-color.png"
                        alt="Sell"
                        width={40}
                        height={40}
                        className="w-6 h-6"
                      />
                      {Sell}
                    </button>
                    */}

                  </div>

                )}



                {false && isAdmin && (

                  <div className="w-full grid grid-cols-2 xl:grid-cols-4 gap-2 mt-5">


                  </div>

                )}






            </div>



          </div>


        </div>




        {/* footer */}
        {/* 이용약관 / 개인정보처리방침 / 고객센터 */}
        <div className="
          w-full
          flex flex-col items-center justify-center mt-10 mb-10
          bg-white shadow-lg rounded-lg p-6
          border border-gray-200
          ">
          <div className="flex flex-row items-center justify-center gap-2">
            <a
              href="#"
              className="text-sm text-zinc-500 hover:text-blue-500"
            >
              이용약관
            </a>
            <span className="text-sm text-zinc-500">|</span>
            <a
              href="#"
              className="text-sm text-zinc-500 hover:text-blue-500"
            >
              개인정보처리방침
            </a>
            <span className="text-sm text-zinc-500">|</span>
            <a
              href="#"
              className="text-sm text-zinc-500 hover:text-blue-500"
            >
              고객센터
            </a>
          </div>
          <div className="text-sm text-zinc-500 mt-2">
            © 2023 Iskan9. All rights reserved.
          </div>

        </div>
   

          
        </div>

        

        


      </main>

  );


};



/*
selectedItem?.buyer?.depositBankName
selectedItem?.buyer?.depositName
'https://cryptoss.beauty/' + params.lang + '/' + selectedItem.agentcode + '/payment?'
'agentUser=' + selectedItem.nickname + '&depositBankName=' + selectedItem?.buyer?.depositBankName + '&depositName=' + selectedItem?.buyer?.depositName


'https://cryptoss.beauty/' + params.lang + '/' + item.agentcode + '/payment?'
                                    + 'agentUser=' + item.nickname + '&depositBankName=' + item?.buyer?.depositBankName + '&depositName=' + item?.buyer?.depositName
*/

const UserHomePage = (
  {
      closeModal = () => {},
      selectedItem = null as { nickname: string; agentcode: string; buyer?: {
        depositBankName?: string; depositName?: string; depositBankAccountNumber?: string;
      } } | null,
  }
) => {

  return (
    <div className="w-full flex flex-col items-center justify-center gap-4">
      <h1 className="text-2xl font-semibold">회원 홈페이지</h1>
      
      {/* iframe */}
      <iframe
        src={`https://cryptoss.beauty/ko/${selectedItem?.agentcode}/payment?`
          + 'agentUser=' + selectedItem?.nickname
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


