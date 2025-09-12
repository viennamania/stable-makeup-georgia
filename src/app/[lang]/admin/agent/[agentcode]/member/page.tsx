'use client';

import { useState, useEffect, use, act } from "react";

import Image from "next/image";



// open modal

import ModalUser from '@/components/modal-user';

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
  getUserEmail,
  getUserPhoneNumber,
} from "thirdweb/wallets/in-app";


import { balanceOf, deposit, transfer } from "thirdweb/extensions/erc20";
import { add } from "thirdweb/extensions/farcaster/keyGateway";
 


import AppBarComponent from "@/components/Appbar/AppBar";
import { getDictionary } from "../../../../../dictionaries";
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


  const searchParamsStorecode = searchParams.get('storecode') || "";




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
          storecode: "admin",
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

  } , [address, escrowWalletAddress, contract]);
  

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
                  storecode: "agent",
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
              ////walletAddress: address,
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



  const [searchStorecode, setSearchStorecode] = useState(searchParamsStorecode || "");


  const [agentcode, setAgentcode] = useState(params.agentcode || "");
  

  const [searchBuyer, setSearchBuyer] = useState("");

  const [searchDepositName, setSearchDepositName] = useState("");


  // fetch all buyer user 
  const [fetchingAllBuyer, setFetchingAllBuyer] = useState(false);
  const [allBuyer, setAllBuyer] = useState([] as any[]);
  const [totalCount, setTotalCount] = useState(0);
    
  const fetchAllBuyer = async () => {
    if (fetchingAllBuyer) {
      return;
    }
    setFetchingAllBuyer(true);
    const response = await fetch('/api/user/getAllBuyersByAgentcode', {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json',
      },
      body: JSON.stringify(
        {
          storecode: searchStorecode,
          agentcode: agentcode,
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
  } , [address, limitValue, pageValue, searchStorecode]);





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
    if (searchStorecode === '') {
      toast.error('가맹점 코드를 선택해주세요.');
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
          storecode: searchStorecode,
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




   const [agentAdminWalletAddress, setAgentAdminWalletAddress] = useState("");
  
    const [fetchingAgent, setFetchingAgent] = useState(false);
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

            if (data.result?.adminWalletAddress === address) {
              setIsAdmin(true);
            }
  
          }
  
          setFetchingAgent(false);
      };
  
      fetchData();
  
    } , [params.agentcode, address]);









  // check table view or card view
  const [tableView, setTableView] = useState(true);



  const [selectedItem, setSelectedItem] = useState<any>(null);


  // get All stores
  const [fetchingAllStores, setFetchingAllStores] = useState(false);
  const [allStores, setAllStores] = useState([] as any[]);
  const [storeTotalCount, setStoreTotalCount] = useState(0);
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
          agentcode: params.agentcode || "",
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
  }, [address, params.agentcode]);

  //console.log('allStores', allStores);




  // array of depositAmountKrw
  const [depositAmountKrw, setDepositAmountKrw] = useState([] as number[]);
  for (let i = 0; i < 100; i++) {
    depositAmountKrw.push(0);
  }


  return (

    <main className="p-4 pb-10 min-h-[100vh] flex items-start justify-center container max-w-screen-2xl mx-auto">


      <div className="py-0 w-full">



        <div className="w-full flex flex-col xl:flex-row items-center justify-center gap-2 bg-black/10 p-2 rounded-lg mb-4">
            
          <div className="w-full flex flex-row items-center justify-start gap-2">

             <button
               onClick={() => router.push('/' + params.lang + '/admin/agent/' + params.agentcode + '/')}
               className="flex items-center justify-center gap-2
                rounded-lg p-2
                hover:bg-black/20
                hover:cursor-pointer
                hover:scale-105
                transition-transform duration-200 ease-in-out"

             >
                <Image
                  src={agent?.agentLogo || "/logo.png"}
                  alt="logo"
                  width={35}
                  height={35}
                  className="rounded-lg w-6 h-6"
                />
             </button>

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






        <div className="flex flex-col items-start justify-center gap-2 mt-4">
              
            {/* USDT 가격 binance market price */}
            {/*
            <div
              className="
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




          <div className="w-full flex flex-row gap-2 items-center justify-start text-zinc-500 text-lg"
          >

      
              {/* 홈 / 가맹점관리 / 회원관리 / 구매주문관리 */}
              {/* memnu buttons same width left side */}
            <div className="w-full flex flex-row itmes-start justify-start gap-2 mb-4">
              <div className="grid grid-cols-3 xl:grid-cols-4 gap-2 mb-4">
                  <button
                      onClick={() => router.push('/' + params.lang + '/admin/agent/' + params.agentcode + '/store')}
                      className="flex w-32 bg-[#3167b4] text-[#f3f4f6] text-sm rounded-lg p-2 items-center justify-center
                      hover:bg-[#3167b4]/80
                      hover:cursor-pointer
                      hover: scale-105
                      transition-all duration-200 ease-in-out
                      ">
                      가맹점관리
                  </button>


                  <div className='flex w-32 items-center justify-center gap-2
                  bg-yellow-500 text-[#3167b4] text-sm rounded-lg p-2'>
                    <Image
                      src="/icon-user.png"
                      alt="Buyer"
                      width={35}
                      height={35}
                      className="w-4 h-4"
                    />
                    <div className="text-sm font-semibold">
                      회원관리
                    </div>
                </div>

                  <button
                      onClick={() => router.push('/' + params.lang + '/admin/agent/' + params.agentcode + '/buyorder')}
                      className="flex w-32 bg-[#3167b4] text-[#f3f4f6] text-sm rounded-lg p-2 items-center justify-center
                      hover:bg-[#3167b4]/80
                      hover:cursor-pointer
                      hover: scale-105
                      transition-all duration-200 ease-in-out
                      ">
                      구매주문관리
                  </button>

                  <button
                      onClick={() => router.push('/' + params.lang + '/admin/agent/' + params.agentcode + '/trade-history')}
                      className="flex w-32 bg-[#3167b4] text-[#f3f4f6] text-sm rounded-lg p-2 items-center justify-center
                      hover:bg-[#3167b4]/80
                      hover:cursor-pointer
                      hover: scale-105
                      transition-all duration-200 ease-in-out
                      ">
                      P2P 거래내역
                  </button>

                  <button
                      onClick={() => router.push('/' + params.lang + '/admin/agent/' + params.agentcode + '/trade-history-daily')}
                      className="flex w-32 bg-[#3167b4] text-[#f3f4f6] text-sm rounded-lg p-2 items-center justify-center
                      hover:bg-[#3167b4]/80
                      hover:cursor-pointer
                      hover: scale-105
                      transition-all duration-200 ease-in-out
                      ">
                      통계(일별)
                  </button>

              </div>

            </div>
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






              <div className="w-full flex flex-col xl:flex-row items-start justify-between gap-3">

     




                <div className="w-full flex flex-row items-center justify-end gap-5">


                  <div className="flex flex-col gap-2 items-center">
                    <div className="text-sm">{Total}</div>
                    <div className="
                      h-10 w-10
                      text-center
                      flex flex-row items-center gap-2">
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
                          <span className="text-xl font-semibold">
                            {totalCount}
                          </span>
                        )
                      }
                    </div>
                  </div>

                </div>

              </div>



              <div className="w-full flex flex-col xl:flex-row items-start justify-between gap-2 mt-4">


                {/* search bar */}

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
                        text-sm font-semibold">
                        가맹점선택
                      </span>


                      <select
                        value={searchStorecode}
                        onChange={(e) => setSearchStorecode(e.target.value)}
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
           

              





                {/* search depositName */}
                <div className="flex flex-row items-center gap-2">


                  <div className="flex flex-col xl:flex-row items-center justify-center gap-2">
                    {/* search nickname */}
                    <div className="flex flex-row items-center gap-2">
                      <input
                        type="text"
                        value={searchBuyer}
                        onChange={(e) => setSearchBuyer(e.target.value)}
                        placeholder="회원 아이디"
                        className="w-full p-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3167b4]"
                      />

                      {/*
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
                      */}

                    </div>

                    <div className="flex flex-row items-center gap-2">
                      <input
                        type="text"
                        value={searchDepositName}
                        onChange={(e) => setSearchDepositName(e.target.value)}
                        placeholder="입금자명"
                        className="w-full p-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3167b4]"
                      />

                      {/*
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
                      */}
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

                        <th className="
                          p-2">
                            <div className="flex flex-col items-center justify-center gap-2">
                              <span>가입일시</span>
                              <span>YYYY-MM-DD HH:mm:ss</span>
                            </div>
                        </th>

                        <th className="p-2">
                          <div className="flex flex-col xl:flex-row items-center justify-center gap-2">
                            <span>회원아이디</span>
                            <span>가맹점 </span>
                          </div>
                        </th>

                        <th className="p-2">
                          <div className="flex flex-col items-center justify-center gap-2">
                            <span>회원은행정보</span>
                          </div>
                        </th>

                        <th className="p-2">
                          <div className="flex flex-row items-center justify-between gap-2">
                            <span>결제건수(건)</span>
                            <span>구매량(USDT)</span>
                            <span>구매금액(원)</span>

                          </div>
                        </th>

                        <th className="
                          p-2">
                          USDT지갑
                        </th>
                        {/*
                        <th className="p-2">충전금액</th>
                        <th className="p-2">결제페이지</th>
                        */}
                        {/*
                        <th className="p-2">주문상태</th>
                        */}

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

                          <td className="
                            p-2">
                            {new Date(item.createdAt).toLocaleDateString('ko-KR', {
                              year: 'numeric',
                              month: '2-digit',
                              day: '2-digit',
                            })}
                            {' '}
                            {new Date(item.createdAt).toLocaleTimeString('ko-KR', {
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                            })}
                          </td>
                        
                          <td className="p-2">
                            <div className="
                              w-40
                              xl:w-64
                              flex flex-col xl:flex-row items-center justify-between gap-2">
                              <span className="
                                w-1/2
                                text-lg font-semibold">
                                {item.nickname}
                              </span>
                              <span className="
                                w-1/2
                                text-sm text-zinc-500">
                                {item?.store?.storeName}{' '}({item?.store?.storecode})
                              </span>
                            </div>
                          </td>

                          <td className="p-2">
                            <div className="flex flex-col xl:flex-row items-start justify-center gap-2">
                              <span>{item?.buyer?.depositBankName}</span>
                              
                              <span>
                                {item?.buyer?.depositBankAccountNumber
                                && item?.buyer?.depositBankAccountNumber.length > 5
                                  ? item?.buyer?.depositBankAccountNumber.substring(0, 3) + '****' + item?.buyer?.depositBankAccountNumber.substring(item?.buyer?.depositBankAccountNumber.length - 2)
                                  : '****'}
                              </span>
                              
                              <span>
                                {item?.buyer?.depositName
                                && item?.buyer?.depositName.length > 1
                                  ? item?.buyer?.depositName.substring(0, 1) + '****'
                                  : '****'}
                              </span>
                            </div>
                          </td>

                          <td className="p-2">
                            <div className="flex flex-row items-center mr-2 justify-between gap-2">

                              {item?.totalBuyCount ? (
                                <div className="flex flex-row items-center justify-center gap-2">
                                  {item?.totalPaymentConfirmedCount}
                                </div>
                              ) : (
                                <div className="flex flex-row items-center justify-center gap-2">
                                  0 건
                                </div>
                              )}
                                


                              {item?.totalPaymentConfirmedUsdtAmount ? (
                                <div className="flex flex-row items-center justify-center gap-2">
                                  {Number(item?.totalPaymentConfirmedUsdtAmount)?.toLocaleString('ko-KR')}
                                </div>
                              ) : (
                                <div className="flex flex-row items-center justify-center gap-2">
                                  0
                                </div>
                              )}


                              {item?.totalPaymentConfirmedKrwAmount ? (

                                <div className="flex flex-row items-center justify-center gap-2">
                                  {Number(item?.totalPaymentConfirmedKrwAmount)?.toLocaleString('ko-KR')}
                                </div>
                              ) : (
                                <div className="flex flex-row items-center justify-center gap-2">
                                  0
                                </div>
                              )}


                            </div>
                            
                          </td>

                          <td className="
                            p-2">

                            <div className="flex flex-row items-center gap-1">
                              <Image
                                src="/icon-shield.png"
                                alt="Shield Icon"
                                width={20}
                                height={20}
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

                          {/*
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

                            <div className="flex flex-col xl:flex-row items-start justify-center gap-2">
                              <button
                                onClick={() => {
                                  
                                  setSelectedItem({
                                    ...item,
                                    depositAmountKrw: depositAmountKrw[index],
                                  });
                                  openModal();

                                }}
                                className="bg-[#3167b4] text-sm text-white px-2 py-1 rounded-lg
                                  hover:bg-[#3167b4]/80"
                              >
                                보기
                              </button>

                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(
                                    'https://cryptoss.beauty/' + params.lang + '/' + item.storecode + '/payment?'
                                    + 'storeUser=' + item.nickname
                                    + '&depositBankName=' + item?.buyer?.depositBankName
                                    + '&depositBankAccountNumber=' + item?.buyer?.depositBankAccountNumber
                                    + '&depositName=' + item?.buyer?.depositName
                                    + '&depositAmountKrw=' + depositAmountKrw[index]
                                  );
                                  toast.success('회원 홈페이지 링크가 복사되었습니다.');
                                }}
                                className="bg-[#3167b4] text-sm text-white px-2 py-1 rounded-lg
                                  hover:bg-[#3167b4]/80"
                              >
                                복사
                              </button>
                            </div>

                          </td>
                          */}

                          {/*
                          <td className="p-2">
                            <div className="flex flex-col xl:flex-row items-start justify-center gap-2">
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
                          */}


 





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
                    
                    router.push(`/${params.lang}/admin/agent/${params.agentcode}/member?limit=${e.target.value}&page=1`)

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
                
                router.push(`/${params.lang}/admin/agent/${params.agentcode}/member?limit=${Number(limit)}&page=${Number(page) - 1}`);

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
                
                router.push(`/${params.lang}/admin/agent/${params.agentcode}/member?limit=${Number(limit)}&page=${Number(page) + 1}`);

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
        src={`https://cryptoss.beauty/ko/${selectedItem?.storecode}/payment?`
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


