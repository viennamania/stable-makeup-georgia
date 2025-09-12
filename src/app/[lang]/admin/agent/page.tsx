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

  agentcode: string;

  adminWalletAddress: string;
  agentFeeWalletAddress: string;
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
    } , 5000);

    return () => clearInterval(interval);

  } , [address, escrowWalletAddress, contract, params.center]);
  

  //console.log('escrowBalance', escrowBalance);







  

  // get User by wallet address
  const [isAdmin, setIsAdmin] = useState(false);

  //const [isAdmin, setIsAdmin] = useState(true); /// 디비 클리어한후 처음으로 등록할때 일단 풀어준다.
  // 필요없다.









  const [user, setUser] = useState<any>(null);
  const [loadingUser, setLoadingUser] = useState(true);





  console.log('isAdmin======', isAdmin);
  console.log('user======', user);
  console.log('address======', address);



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
              agentcode: "admin",
              /////walletAddress: address,
            }),
        });

        const data = await response.json();

        //console.log("data", data);

        if (data.result) {

          setAgent(data.result);

          setAgentAdminWalletAddress(data.result?.adminWalletAddress);

        }

        setFetchingAgent(false);
    };

    fetchData();

  } , []);









  const [searchAgent, setSearchAgentcode] = useState("");


  const [searchMyOrders, setSearchMyOrders] = useState(false);



  // limit number
  const [limitValue, setLimitValue] = useState(limit || 20);

  // page number
  const [pageValue, setPageValue] = useState(page || 1);






  const [fetchingAllAgent, setFetchingAllAgent] = useState(false);
  const [allAgent, setAllAgent] = useState([] as any[]);
  const [totalCount, setTotalCount] = useState(0);
  const [searchCount, setSearchCount] = useState(0);

  const fetchAllAgent = async () => {
    if (fetchingAllAgent) {
      return;
    }
    setFetchingAllAgent(true);
    const response = await fetch('/api/agent/getAllAgents', {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json',
      },
      body: JSON.stringify(
        {
          walletAddress: address,
          limit: Number(limitValue),
          page: Number(pageValue),
          searchAgent: searchAgent,
        }
      ),
    });
    if (!response.ok) {
      setFetchingAllAgent(false);
      toast.error('에이전트 조회를 실패했습니다.');
      return;
    }
    const data = await response.json();
    
    
    //console.log('data', data);


    setAllAgent(data.result.agents);
    setTotalCount(data.result.totalCount);
    setSearchCount(data.result.searchCount);


    setFetchingAllAgent(false);

    return data.result.agents;
  }



  useEffect(() => {
    if (!address) {
      setAllAgent([]);
      return;
    }
    fetchAllAgent();
  } , [address, limitValue, pageValue]);



  {/*
  {"agentcode":"testagentcode","agentName":"테스트상점","agentType":"test","agentUrl":"https://test.com","agentDescription":"설명입니다.","agentLogo":"https://test.com/logo.png","agentBanner":"https://test.com/banner.png"}
  */}


  // insert agent code
  const [agentCode, setAgentCode] = useState('');
  const [agentName, setAgentName] = useState('');
  const [agentType, setAgentType] = useState('test');
  const [agentUrl, setAgentUrl] = useState('https://test.com');
  const [agentDescription, setAgentDescription] = useState('설명입니다.');
  const [agentLogo, setAgentLogo] = useState('https://cryptoss.beauty/logo.png');
  const [agentBanner, setAgentBanner] = useState('https://cryptoss.beauty/logo.png');


  const [insertingAgent, setInsertingAgent] = useState(false);

  const insertAgent = async () => {

    if (insertingAgent) {
      return;
    }


      // randomString is lowercase alphabet

      let generatedAgentCode = '';
      const characters = 'abcdefghijklmnopqrstuvwxyz';
      for (let i = 0; i < 8; i++) {
        generatedAgentCode += characters.charAt(Math.floor(Math.random() * characters.length));
      }
  
      console.log('generatedAgentCode', generatedAgentCode);
      
  



    setInsertingAgent(true);
    const response = await fetch('/api/agent/setAgent', {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json',
      },
      body: JSON.stringify(
        {
          agentcode: agentCode || generatedAgentCode,
          agentName: agentName,
          agentType: agentType,
          agentUrl: agentUrl,
          agentDescription: agentDescription,
          agentLogo: agentLogo,
          agentBanner: agentBanner,
        }
      ),
    });

    //console.log('response', response);

    if (!response.ok) {
      setInsertingAgent(false);
      toast.error('에이전트 코드 추가에 실패했습니다.');
      return;
    }

    setInsertingAgent(false);

    const data = await response.json();
    
    ///console.log('data', data);

    if (data.result) {
      toast.success('에이전트 코드가 추가되었습니다.');
      setAgentCode('');
      setAgentName('');
      setAgentType('');
      setAgentUrl('');
      setAgentDescription('');
      setAgentLogo('');
      setAgentBanner('');


      // fetch all agent code
      fetchAllAgent();
    } else {
      toast.error('에이전트 코드 추가에 실패했습니다.');
    }





    return;
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

  


  // check table view or card view
  const [tableView, setTableView] = useState(true);






  if (!address) {
    return (
      <div className="flex flex-col items-center justify-center">

        <h1 className="text-2xl font-bold">로그인</h1>

          <ConnectButton
            client={client}
            wallets={wallets}
            chain={chain === "ethereum" ? ethereum :
                    chain === "polygon" ? polygon :
                    chain === "arbitrum" ? arbitrum :
                    chain === "bsc" ? bsc : arbitrum}
            
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

        <h1 className="text-2xl font-bold">접근이 거부되었습니다</h1>
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









        <div className="mt-4 flex flex-col items-start justify-center gap-2 w-full">



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





            {/* 홈 / 가맹점관리 / 에이전트관리 / 회원관리 / 구매주문관리 */}
            {/* memnu buttons same width left side */}
            <div className="grid grid-cols-3 xl:grid-cols-6 gap-2 items-center justify-start mb-4">

              <button
                  onClick={() => router.push('/' + params.lang + '/admin/store')}
                  className="flex w-32 bg-[#3167b4] text-[#f3f4f6] text-sm rounded-lg p-2 items-center justify-center
                  hover:bg-[#3167b4]/80
                  hover:cursor-pointer
                  hover:scale-105
                  transition-transform duration-200 ease-in-out
                  ">
                  가맹점관리
              </button>

              <div className='flex w-32 items-center justify-center gap-2
              bg-yellow-500 text-[#3167b4] text-sm rounded-lg p-2'>
                <Image
                  src="/icon-agent.png"
                  alt="Agent"
                  width={35}
                  height={35}
                  className="w-4 h-4"
                />
                <div className="text-sm font-semibold">
                  에이전트관리
                </div>
              </div>

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
                  P2P 거래내역
              </button>

              {version !== 'bangbang' && (
              <button
                  onClick={() => router.push('/' + params.lang + '/admin/clearance-history')}
                  className="flex w-32 bg-[#3167b4] text-[#f3f4f6] text-sm rounded-lg p-2 items-center justify-center
                  hover:bg-[#3167b4]/80
                  hover:cursor-pointer
                  hover:scale-105
                  transition-transform duration-200 ease-in-out
                  ">
                  청산관리
              </button>
              )}

              <button
                  onClick={() => router.push('/' + params.lang + '/admin/trade-history-daily')}
                  className="flex w-32 bg-[#3167b4] text-[#f3f4f6] text-sm rounded-lg p-2 items-center justify-center
                  hover:bg-[#3167b4]/80
                  hover:cursor-pointer
                  hover:scale-105
                  transition-transform duration-200 ease-in-out
                  ">
                  통계(가맹)
              </button>

              <button
                  onClick={() => router.push('/' + params.lang + '/admin/trade-history-daily-agent')}
                  className="flex w-32 bg-[#3167b4] text-[#f3f4f6] text-sm rounded-lg p-2 items-center justify-center
                  hover:bg-[#3167b4]/80
                  hover:cursor-pointer
                  hover:scale-105
                  transition-transform duration-200 ease-in-out
                  ">
                  통계(AG)
              </button>

              {version !== 'bangbang' && (
              <button
                  onClick={() => router.push('/' + params.lang + '/admin/escrow-history')}
                  className="flex w-32 bg-[#3167b4] text-[#f3f4f6] text-sm rounded-lg p-2 items-center justify-center
                  hover:bg-[#3167b4]/80
                  hover:cursor-pointer
                  hover:scale-105
                  transition-transform duration-200 ease-in-out
                  ">
                  보유량내역
              </button>
              )}

            </div>



            <div className='flex flex-row items-center gap-2 justify-start w-full'>
                <Image
                  src="/icon-agent.png"
                  alt="Agent"
                  width={35}
                  height={35}
                  className="w-6 h-6"
                />

                <div className="text-xl font-semibold">
                  에이전트관리
                </div>

            </div>




              <div className="w-full flex flex-row items-center justify-end gap-2">


                <div className="flex flex-col gap-2 items-center">
                  <div className="text-sm">전체수량</div>
                  <div className="flex flex-row items-center gap-2">
                    {
  
                        totalCount || 0
                    
                    }
                  </div>
                </div>


                <div className="flex flex-col gap-2 items-center">
                  <div className="text-sm">검색수량</div>
                  <div className="flex flex-row items-center gap-2">
                    {
   
                        searchCount || 0

                    }
                  </div>
                </div>

              </div>

              <div className="w-full flex flex-col xl:flex-row items-start justify-between gap-5">

                {/* 에이전트 추가 input and button */}
                <div className="flex flex-row items-center gap-2">
                  <input
                    
                    
                    disabled={!isAdmin || insertingAgent}


                    type="text"
                    value={agentCode}
                    onChange={(e) => {

                      setAgentCode(e.target.value)

                    } }
                    placeholder="에이전트 코드"
                    className="hidden w-full p-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    disabled={!isAdmin || insertingAgent}
                    type="text"
                    value={agentName}
                    onChange={(e) => {

                      setAgentName(e.target.value)

                    } }
                    placeholder="에이전트 이름"
                    className="w-52 p-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  
                  <button
                    disabled={!isAdmin || insertingAgent}
                    onClick={() => {

                      // check if agent code already exists
                      if (allAgent?.find((item) => item.agentcode === agentCode)) {
                        toast.error('에이전트 코드가 이미 존재합니다.');
                        return;
                      }

                      // check if agent name length is less than 2
                      if (agentName.length < 2) {
                        toast.error('에이전트 이름은 2자 이상이어야 합니다.');
                        return;
                      }
                      // check if agent name length is less than 20
                      if (agentName.length > 10) {
                        toast.error('에이전트 이름은 10자 이하여야 합니다.');
                        return;
                      }

                      insertAgent();
                    }}
                    className={`bg-[#3167b4] text-white px-4 py-2 rounded-lg w-full
                      ${!isAdmin || insertingAgent ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {insertingAgent ? '에이전트 추가 중...' : '에이전트 추가'}
                  </button>
                </div>

                {/* search bar */}
                {/* searchAgent */}
                <div className="flex flex-row items-center gap-2">
                  <input
                    disabled={!isAdmin || fetchingAllAgent}
                    type="text"
                    value={searchAgent}
                    onChange={(e) => setSearchAgentcode(e.target.value)}
                    placeholder="에이전트 코드, 이름"
                    className="w-48 p-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3167b4]"
                  />

                  <button
                    onClick={() => {
                      setPageValue(1);
                      fetchAllAgent();
                    }}
                    //className="bg-[#3167b4] text-white px-4 py-2 rounded-lg w-full"
                    className={`
                      w-32
                      bg-[#3167b4] text-white px-4 py-2 rounded-lg
                      ${!isAdmin || fetchingAllAgent ? 'opacity-50 cursor-not-allowed' : ''}
                    `}
                    

                    disabled={!isAdmin || fetchingAllAgent}
                  >
                    {fetchingAllAgent ? '검색중...' : '검색'}
                  </button>

                </div>

              </div>


              <div className="w-full flex flex-row items-center justify-end gap-2">

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


                  <p className="text-lg text-red-500 font-semibold">
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


                {/* Clearance Orders */}
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

                  <p className="text-lg text-yellow-500 font-semibold">
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


              {/*
              {"agentcode":"testagentcode","agentName":"테스트상점","agentType":"test","agentUrl":"https://test.com","agentDescription":"설명입니다.","agentLogo":"https://test.com/logo.png","agentBanner":"https://test.com/banner.png"}
              */}

              {/* table view is horizontal scroll */}
              {tableView ? (

                <div className="w-full overflow-x-auto">

                  <table className="w-full table-auto border-collapse border border-zinc-800 rounded-md">

                    <thead
                      className="bg-zinc-800 text-white text-sm font-semibold w-full"
                      style={{
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                      }}
                    >
                      <tr>
                        <th className="p-2">에이전트</th>

                        <th className="p-2">
                          관리자 지갑주소<br/>
                          수수료 수납용 USDT지갑 주소
                        </th>
                        
                        <th className="p-2">관리자 홈페이지</th>
                        
                        {/* 가맹점수 */}
                        <th className="p-2">
                          가맹점수
                        </th>

                        {/*
                        <th className="p-2">통장수</th>
                        */}
                        <th className="p-2">거래수<br/>금액(원)<br/>거래수량(USDT)</th>

                        <th className="p-2">결제수<br/>결제수수료(원)<br/>결제수수료수량(USDT)</th>
                        {/*
                        <th className="p-2">
                          청산건수<br/>청산금액(원)<br/>청산수량(USDT)
                        </th>
                        */}
                      </tr>
                    </thead>

                    {/* if my trading, then tr has differenc color */}
                    <tbody>

                      {allAgent?.map((item, index) => (

                        
                        <tr key={index} className={`
                          ${
                            index % 2 === 0 ? 'bg-zinc-100' : 'bg-zinc-200'
                          }
                        `}>

                          <td className="p-2">

                            <div className="
                            w-32  xl:w-full
                            flex flex-col items-center justify-center gap-2">
                              
                              <div className="w-full flex flex-row items-center justify-start gap-2">
                                <Image
                                  src={item.agentLogo || '/icon-agent.png'}
                                  alt="Agent Logo"
                                  width={100}
                                  height={100}
                                  className="
                                    rounded-lg w-16 h-16
                                    object-cover
                                  "
                                />
                                <div className="flex flex-col items-start justify-center">
                                  <span className="text-lg font-semibold">
                                  {item.agentName.length > 8 ? item.agentName.slice(0, 8) + '...' : item.agentName}
                                  </span>
                                  
                                  {/*
                                  <span className="text-sm text-gray-500">
                                    {item.agentcode}
                                  </span>
                                  */}
                                  {/* 복사하기 */}
                                  <button
                                    onClick={() => {
                                      navigator.clipboard.writeText(item.agentcode);
                                      toast.success('에이전트 코드가 복사되었습니다.');
                                    }}
                                    className="text-sm text-gray-500 hover:text-blue-500
                                    hover:underline"
                                  >
                                    {item.agentcode}
                                  </button>


                                </div>
                              </div>

                              <div className="w-full flex flex-col xl:flex-row items-center justify-center gap-2">
                                {/* settings button */}
                                <button
                                  disabled={!isAdmin}
                                  onClick={() => {
                                    router.push(
                                      '/' + params.lang + '/admin/agent/' + item.agentcode + '/settings'
                                    );
                                  }}
                                  className={`${
                                    !isAdmin ? 'opacity-50 cursor-not-allowed' : ''
                                  } bg-[#3167b4] text-sm text-white px-2 py-1 rounded-lg
                                  hover:bg-[#3167b4]/80
                                  w-full
                                  `}
                                    
                                  //className="w-full bg-[#3167b4] text-sm text-white px-2 py-1 rounded-lg
                                  //hover:bg-[#3167b4]/80"
                                >
                                  설정하기
                                </button>

                                

                              </div>


                            </div>
                            
                          </td>

                          <td className="p-2">
                            <div className="flex flex-col items-center justify-center gap-2">
                              
                               {item.adminWalletAddress ? (
                                  <button
                                    onClick={() => {
                                      navigator.clipboard.writeText(item.adminWalletAddress || '');
                                      toast.success('관리자 지갑주소가 복사되었습니다.');
                                    }}
                                    className="text-sm text-gray-500 hover:text-blue-500
                                    hover:underline"
                                  >
                                      {item.adminWalletAddress.slice(0, 8) + '...' + item.adminWalletAddress.slice(-8)}

                                  </button>
                                ) : (
                                  <span className="text-red-500">
                                    관리자 지갑주소가 없습니다.
                                  </span>
                                )}
                              
                                {item.agentFeeWalletAddress ? (
                                  <button
                                    onClick={() => {
                                      navigator.clipboard.writeText(item?.agentFeeWalletAddress || '');
                                      toast.success('수수료 수납용 USDT지갑 주소가 복사되었습니다.');
                                    }}
                                    className="text-sm text-gray-500 hover:text-blue-500
                                    hover:underline"
                                  >
                                    {item.agentFeeWalletAddress.slice(0, 8) + '...' + item.agentFeeWalletAddress.slice(-8)}

                                    </button>
                                ) : (                 


                                  <span className="text-red-500">
                                    수수료 수납용 USDT지갑 주소가 없습니다.
                                  </span>
                                )}
                                
                              
                            </div>
                          </td>

                          {/* 관리자 홈페이지 */}
                          {/* https://crytpopay.beauty/ko/admin/agent/testagentcode */}
                          <td className="p-2">
                            <div className="flex flex-col items-center justify-center gap-2">
                              <div className="flex flex-col items-center justify-center gap-2">
                                <button
                                  onClick={() => {

                                    window.open(
                                      `/${params.lang}/admin/agent/${item.agentcode}`,
                                      "_blank"
                                    );
                                  }}
                                  className="bg-[#3167b4] text-sm text-white px-2 py-1 rounded-lg
                                  hover:bg-[#3167b4]/80"
                                >
                                  홈페이지 열기
                                </button>
                              </div>
                            </div>
                          </td>

                          
                          <td className="p-2">
                            <div className="flex flex-col items-center justify-center gap-2">
                              <span className="text-sm text-gray-500">
                                {item.totalStoreCount ? item.totalStoreCount : 0}개
                              </span>
                              {/* 가맹점 관리 버튼 */}
                              <button
                                onClick={() => {
                                  router.push(
                                    '/' + params.lang + '/admin/store?agentcode=' + item.agentcode
                                  );
                                }}
                                className="bg-[#3167b4] text-sm text-white px-2 py-1 rounded-lg
                                hover:bg-[#3167b4]/80"
                              >
                                가맹점 관리
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
                                    '/' + params.lang + '/admin/agent/' + item.agentcode + '/bank'
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
                            <div className="flex flex-col items-center justify-center gap-2">

                              <div className="flex flex-col items-center justify-center gap-2">


                                <div className="flex flex-row items-start gap-2">
                                  <span className="text-sm text-gray-500">
                                    {
                                      item.totalPaymentConfirmedCount ? item.totalPaymentConfirmedCount : 0
                                    }{' '}건
                                  </span>
                                </div>

                                <div className="flex flex-col items-start gap-2">

                                  <span className="text-lg text-gray-500 font-semibold"
                                    style={{ fontFamily: 'monospace' }}
                                  >
                                    {
                                      Number(item.totalKrwAmount ? item.totalKrwAmount : 0)
                                      ?.toLocaleString('ko-KR')
                                    }{' '}원
                                  </span>
                                  <span className="text-lg text-gray-500 font-semibold"
                                    style={{ fontFamily: 'monospace' }}
                                  >
                                    {
                                      (item.totalUsdtAmount ? item.totalUsdtAmount : 0)?.toLocaleString('us-US')
                                    }{' '}USDT
                                  </span>

                                </div>


                              </div>

                              {/*
                              <div className="flex flex-col xl:flex-row items-center gap-2">
                                <button
                                  onClick={() => {
                                    router.push(
                                      '/' + params.lang + '/admin/agent/' + item.agentcode + '/trade'
                                    );
                                  }}
                                  className="bg-[#3167b4] text-sm text-white px-2 py-1 rounded-lg
                                  hover:bg-[#3167b4]/80"
                                >
                                  구매주문관리
                                </button>
                                <button
                                  onClick={() => {
                                    router.push(
                                      '/' + params.lang + '/admin/agent/' + item.agentcode + '/trade-history'
                                    );
                                  }}
                                  className="bg-[#3167b4] text-sm text-white px-2 py-1 rounded-lg
                                  hover:bg-[#3167b4]/80"
                                >
                                  P2P 거래내역
                                </button>
                              </div>
                              */}


                            </div>
                             

                          </td>


                         <td className="p-2">
                            <div className="flex flex-col items-center justify-center gap-2">

                              <div className="flex flex-col items-center  justify-center gap-2">

                                <div className="flex flex-row items-start gap-2">
                                  <span className="text-sm text-gray-500">
                                    {
                                      item.totalSettlementCount ? item.totalSettlementCount : 0
                                    }{' '}건
                                  </span>
                                </div>

                                <div className="flex flex-col items-start gap-2">

                                  <span className="text-lg text-gray-500 font-semibold"
                                    style={{ fontFamily: 'monospace' }}
                                  >
                                    {
                                      Number(item.totalFeeAmountKRW ? item.totalFeeAmountKRW : 0)
                                        ?.toLocaleString('ko-KR')
                                    }{' '}원
                                  </span>
                                  <span className="text-lg text-gray-500 font-semibold"
                                    style={{ fontFamily: 'monospace' }}
                                  >
                                    {
                                      (item.totalFeeAmount ? item.totalFeeAmount : 0)?.toLocaleString('us-US')
                                    }{' '}USDT
                                  </span>

                                </div>


                              </div>


                            </div>

                          </td>

                          {/*
                          <td className="p-2">
                            <div className="flex flex-col items-start justify-start gap-2">

                              <div className="flex flex-col items-start gap-2">

                                <div className="flex flex-row items-start gap-2">
                                  <span className="text-sm text-gray-500">
                                    {
                                      item.totalPaymentConfirmedClearanceCount ? item.totalPaymentConfirmedClearanceCount : 0
                                    }{' '}건
                                  </span>
                                </div>

                                <div className="flex flex-col items-start gap-2">
                                  <span className="text-lg text-gray-500 font-semibold"
                                    style={{ fontFamily: 'monospace' }}
                                  >
                                    {
                                      Number(item.totalKrwAmountClearance ? item.totalKrwAmountClearance : 0)
                                        ?.toLocaleString('ko-KR')
                                    }{' '}원
                                  </span>
                                  <span className="text-lg text-gray-500 font-semibold"
                                    style={{ fontFamily: 'monospace' }}
                                  >
                                    {
                                      (item.totalUsdtAmountClearance ? item.totalUsdtAmountClearance : 0)?.toLocaleString('us-US')
                                    }{' '}USDT
                                  </span>
                                </div>

                              </div>

          
                              <div className="flex flex-col xl:flex-row items-center gap-2">
                                <button
                                  disabled={!isAdmin}
                                  onClick={() => {
                                    router.push(
                                      '/' + params.lang + '/admin/store/' + item.storecode + '/clearance'
                                    );
                                  }}
                                  className={`${
                                    !isAdmin ? 'opacity-50 cursor-not-allowed' : ''
                                  } bg-[#3167b4] text-sm text-white px-2 py-1 rounded-lg
                                  hover:bg-[#3167b4]/80`}
                                  //className="bg-[#3167b4] text-sm text-white px-2 py-1 rounded-lg
                                  //hover:bg-[#3167b4]/80"  
                                >
                                  청산관리
                                </button>

                              </div>


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

                  {allAgent?.map((item, index) => (
                    <div key={index} className="bg-white shadow-md rounded-lg p-4">
                      <h2 className="text-lg font-semibold">{item.agentName}</h2>
                      <p className="text-sm text-gray-500">{item.agentDescription}</p>
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
                    
                    router.push(`/${params.lang}/admin/agent?limit=${Number(e.target.value)}&page=${page}`)

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
                
                router.push(`/${params.lang}/admin/agent?limit=${Number(limit)}&page=${Number(page) - 1}`);

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
                
                router.push(`/${params.lang}/admin/agent?limit=${Number(limit)}&page=${Number(page) + 1}`);

              }}
            >
              다음
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



