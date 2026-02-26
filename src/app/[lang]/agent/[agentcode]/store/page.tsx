'use client';

import { useState, useEffect, use, act } from "react";

import Image from "next/image";



// open modal

import Modal from '@/components/modal';

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
  getUserPhoneNumber
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


import { paymentUrl } from "../../../../config/payment";


import { version } from "../../../../config/version";




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
      options: ["email", "google"],
    },
  }),
];


// get escrow wallet address

//const escrowWalletAddress = "0x2111b6A49CbFf1C8Cc39d13250eF6bd4e1B59cF6";



const contractAddress = "0xc2132D05D31c914a87C6611C10748AEb04B58e8F"; // USDT on Polygon
const contractAddressArbitrum = "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9"; // USDT on Arbitrum




export default function Index({ params }: any) {

  const searchParams = useSearchParams()!;
 
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
        console.error('Error:', JSON.stringify(error));
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

  

    // search form date to date
    const [searchFromDate, setSearchFormDate] = useState("");
    // set today's date in YYYY-MM-DD format
    useEffect(() => {
      //const today = new Date();
      //const formattedDate = today.toISOString().split('T')[0]; // YYYY-MM-DD format

      // this month first day
      const today = new Date();
      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const formattedDate = firstDayOfMonth.toISOString().split('T')[0]; // YYYY-MM-DD format

      setSearchFormDate(formattedDate);
    }, []);
  
  
  
  
    const [searchToDate, setSearchToDate] = useState("");
  
    // set today's date in YYYY-MM-DD format
    useEffect(() => {
      const today = new Date();
      const formattedDate = today.toISOString().split('T')[0]; // YYYY-MM-DD format
      setSearchToDate(formattedDate);
    }, []);
  






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

  // page number
  const [pageValue, setPageValue] = useState(page || 1);




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
          agentcode: params.agentcode,
        }
      ),
    });
    if (!response.ok) {
      setFetchingAllStore(false);
      toast.error('가맹점 조회를 실패했습니다.');
      return;
    }
    const data = await response.json();
    
    console.log('getAllStores data', data);


    setAllStore(data.result.stores);
    setTotalCount(data.result.totalCount);
    setSearchCount(data.result.searchCount);


    setFetchingAllStore(false);

    return data.result.stores;
  }



  useEffect(() => {
    if (!address) {
      setAllStore([]);
      return;
    }
    fetchAllStore();
  } , [address, limitValue, pageValue, params.agentcode]);



  {/*
  {"storecode":"teststorecode","storeName":"테스트상점","storeType":"test","storeUrl":"https://test.com","storeDescription":"설명입니다.","storeLogo":"https://test.com/logo.png","storeBanner":"https://test.com/banner.png"}
  */}


  // insert store code

  const [storeCode, setStoreCode] = useState('');
  const [storeName, setStoreName] = useState('');
  const [storeType, setStoreType] = useState('test');
  const [storeUrl, setStoreUrl] = useState('https://test.com');
  const [storeDescription, setStoreDescription] = useState('설명입니다.');
  const [storeLogo, setStoreLogo] = useState('https://cryptoss.beauty/logo.png');
  const [storeBanner, setStoreBanner] = useState('https://cryptoss.beauty/logo.png');


  const [insertingStore, setInsertingStore] = useState(false);

  const insertStore = async () => {

    if (insertingStore) {
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
          agentcode: params.agentcode,
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
      setStoreCode('');
      setStoreName('');
      setStoreType('');
      setStoreUrl('');
      setStoreDescription('');
      setStoreLogo('');
      setStoreBanner('');


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



  const [agentList, setAgentList] = useState([] as any[]);
  
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

        }

        setFetchingAgent(false);
    };

    fetchData();

  } , [params.agentcode]);





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
                          href={`/${params.lang}/agent/${agent.agentcode}`}
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
            <div className="mt-4 flex flex-row items-center justify-between gap-2">
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




  if (
    (address
    && agent
    &&  address !== agent.adminWalletAddress
    && user?.role !== "admin")
  ) {
    return (
      <main className="p-4 pb-10 min-h-[100vh] flex items-start justify-center container max-w-screen-2xl mx-auto">

        <div className="py-0 w-full">

          <div className={`w-full flex flex-col sm:flex-row items-center justify-start gap-2
            p-2 rounded-lg mb-4
            ${agent?.backgroundColor ?
              "bg-[#"+agent?.backgroundColor+"]" :
              "bg-black/10"
            }`}>

        

              {address && !loadingUser && (

                <div className="w-full flex flex-row items-center justify-end gap-2">
                  <button
                    onClick={() => {
                      router.push('/' + params.lang + '/profile-settings');
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
                  router.push('/' + params.lang + '/agent/' + params.agentcode + '/profile-settings');
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




  return (

    <main className="p-4 pb-10 min-h-[100vh] flex items-start justify-center container max-w-screen-2xl mx-auto">


      <div className="py-0 w-full">


        <div className="w-full flex flex-col sm:flex-row items-center justify-center gap-2 bg-black/10 p-2 rounded-lg mb-4">
            
          {address && !loadingUser && (


            <div className="w-full flex flex-row items-center justify-end gap-2">
              
              <button
                onClick={() => {
                  router.push('/' + params.lang + '/agent/' + params.agentcode + '/profile-settings');
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




        </div>









        <div className="mt-4 flex flex-col items-start justify-center gap-2 w-full">



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
                    onClick={() => router.push('/' + params.lang + '/agent/' + params.agentcode + '/member')}
                    className="flex w-32 bg-[#3167b4] text-[#f3f4f6] text-sm rounded-lg p-2 items-center justify-center
                    hover:bg-[#3167b4]/80
                    hover:cursor-pointer
                    hover:scale-105
                    transition-transform duration-200 ease-in-out
                    ">
                    회원관리
                </button>

                <button
                    onClick={() => router.push('/' + params.lang + '/agent/' + params.agentcode + '/buyorder')}
                    className="flex w-32 bg-[#3167b4] text-[#f3f4f6] text-sm rounded-lg p-2 items-center justify-center
                    hover:bg-[#3167b4]/80
                    hover:cursor-pointer
                    hover:scale-105
                    transition-transform duration-200 ease-in-out
                    ">
                    구매주문관리
                </button>

                <button
                    onClick={() => router.push('/' + params.lang + '/agent/' + params.agentcode + '/trade-history')}
                    className="flex w-32 bg-[#3167b4] text-[#f3f4f6] text-sm rounded-lg p-2 items-center justify-center
                    hover:bg-[#3167b4]/80
                    hover:cursor-pointer
                    hover:scale-105
                    transition-transform duration-200 ease-in-out
                    ">
                    P2P 거래내역
                </button>

                <button
                    onClick={() => router.push('/' + params.lang + '/agent/' + params.agentcode + '/trade-history-daily')}
                    className="flex w-32 bg-[#3167b4] text-[#f3f4f6] text-sm rounded-lg p-2 items-center justify-center
                    hover:bg-[#3167b4]/80
                    hover:cursor-pointer
                    hover:scale-105
                    transition-transform duration-200 ease-in-out
                    ">
                    통계(일별)
                </button>

                <button
                    onClick={() => router.push('/' + params.lang + '/agent/' + params.agentcode + '/trade-history-stores')}
                    className="flex w-32 bg-[#3167b4] text-[#f3f4f6] text-sm rounded-lg p-2 items-center justify-center
                    hover:bg-[#3167b4]/80
                    hover:cursor-pointer
                    hover:scale-105
                    transition-transform duration-200 ease-in-out
                    ">
                    통계(가맹점별)
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




            <div className="w-full flex flex-row items-center justify-end gap-2">


              <div className="flex flex-col gap-2 items-center">
                <div className="text-sm">전체수</div>
                <div className="flex flex-row items-center gap-2">
                  {
                    fetchingAllStore ? (
                      <Image
                        src="/loading.png"
                        alt="Loading"
                        width={20}
                        height={20}
                        className="animate-spin"
                      />
                    ) : (
                      totalCount || 0
                    )
                  }
                </div>
              </div>

              {/*
              <div className="flex flex-col gap-2 items-center">
                <div className="text-sm">검색수량</div>
                <div className="flex flex-row items-center gap-2">
                  {
                    fetchingAllStore ? (
                      <Image
                        src="/loading.png"
                        alt="Loading"
                        width={20}
                        height={20}
                        className="animate-spin"
                      />
                    ) : (
                      searchCount || 0
                    )
                  }
                </div>
              </div>
              */}

            </div>
              

            <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-5">

              {/*
              <div className="flex flex-row items-center gap-2">
                <input
                  disabled={insertingStore}
                  type="text"
                  value={storeName}
                  onChange={(e) => {

                    setStoreName(e.target.value)

                  } }
                  placeholder="가맹점 이름"
                  className="w-52 p-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                
                <button
                  disabled={insertingStore}
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
                    ${insertingStore ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {insertingStore ? '가맹점 추가 중...' : '가맹점 추가'}
                </button>
              </div>
              */}




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
              <div className="flex flex-row items-center gap-2">
                <input
                  disabled={fetchingAllStore}
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
                    bg-[#3167b4] text-white px-4 py-2 rounded-lg w-full
                    ${fetchingAllStore ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                  

                  disabled={fetchingAllStore}
                >
                  {fetchingAllStore ? '검색중...' : '검색'}
                </button>

              </div>

            </div>



            {/*
            {"storecode":"teststorecode","storeName":"테스트상점","storeType":"test","storeUrl":"https://test.com","storeDescription":"설명입니다.","storeLogo":"https://test.com/logo.png","storeBanner":"https://test.com/banner.png"}
            */}


            <div className="w-full overflow-x-auto">

              <table className="w-full table-auto border-collapse border border-zinc-800 rounded-md">

                <thead
                  className="bg-zinc-800 text-white text-sm font-semibold w-full"
                  style={{
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                  }}
                >
                  <tr>
                    <th className="p-2">가맹점</th>
                    {/*
                    <th className="p-2">가맹점타입</th>
                    */}
                    <th className="p-2">
                      회원수
                    </th>
                    {/*
                    <th className="p-2">통장수</th>
                    */}


                    <th className="p-2">
                      회원 홈페이지
                    </th>
                    <th className="p-2">
                      관리자 홈페이지
                    </th>

                    <th className="p-2">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <span className="text-center">
                          AG 수수료율(%)
                        </span>
                        <span className="text-center">
                          수납용 USDT 지갑주소
                        </span>
                      </div>
                    </th>

                    {/* 가맹점 결제 수수료율(%) */}
                    <th className="p-2">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <span className="text-center">
                          PG 수수료율(%)
                        </span>
                        <span className="text-center">
                          수납용 USDT 지갑주소
                        </span>
                      </div>
                    </th>


                    <th className="p-2">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <span className="text-center">
                          P2P 거래
                        </span>
                      </div>
                    </th>

                    <th className="p-2">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <span className="text-center">
                          가맹점 결제
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

                      <td className="p-2">
                      

                        <div className="
                          w-48 
                          flex flex-col items-center justify-center gap-2">

                          <div className="w-full flex flex-row items-center justify-start gap-2"> 
                            
                            <div className="w-full flex flex-row items-center justify-start gap-2">
                              <Image
                                src={item.storeLogo || '/icon-store.png'}
                                alt="Store Logo"
                                width={100}
                                height={100}
                                className="
                                  rounded-lg w-20 h-20
                                  object-cover
                                  "
                              />
                              <div className="flex flex-col items-start justify-center">
                                <span className="text-lg font-semibold">
                                  {item.storeName.length > 8 ? item.storeName.slice(0, 8) + '...' : item.storeName}
                                </span>
                                
                                {/*
                                <span className="text-sm text-gray-500">
                                  {item.storecode}
                                </span>
                                */}
                                {/* 복사하기 */}
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


                              </div>
                            </div>


                          </div>

                          {/* 설정하기 */}
                          <div className="w-full flex flex-row items-center justify-center gap-2">
                            <button
                              onClick={() => {
                                
                                if (version  === 'bangbang') {
                                  router.push('/' + params.lang + '/agent/' + params.agentcode + '/' + item.storecode + '/settings-bangbang');
                                } else {
                                  router.push('/' + params.lang + '/agent/' + params.agentcode + '/' + item.storecode + '/settings');
                                }

                              }}
                              className="w-full
                              bg-[#3167b4] text-sm text-white px-2 py-1 rounded-lg
                              hover:bg-[#3167b4]/80"
                            >
                              설정하기
                            </button>
                          </div>


                        </div>
                        
                      </td>
      
                      <td className="p-2">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <span className="text-lg text-gray-500">
                            {
                              item.totalBuyerCount ? item.totalBuyerCount : 0
                            }{' '}명
                          </span>
                          
                        </div>
                      </td>




                      <td className="p-2">

                        <div className="flex-col items-center justify-center gap-2">

                          {/* 회원 홈페이지 */}
                          <div className="flex flex-row items-center gap-2">

                            <a
                              href={
                                '/' + params.lang + '/' + item.storecode + '/homepage'
                              }
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-blue-500 hover:underline"
                            >
                              새창
                            </a>
                          </div>

                        </div>

                      </td>

                      <td className="p-2">

                        <div className="flex-col items-center justify-center gap-2">

                          {/* 관리자 홈페이지 */}
                          <div className="flex flex-row items-center gap-2">

                            <a
                              href={
                                '/' + params.lang + '/' + item.storecode + '/center'
                              }
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-blue-500 hover:underline"
                            >
                              새창
                            </a>
                          </div>

                        </div>

                      </td>


                      <td className="p-2">
                        <div className="flex flex-col items-center justify-center gap-2">

                          <div className="flex flex-col items-center justify-center gap-2">

                            <span className="text-xl text-gray-500 font-semibold">
                              {
                                item.agentFeePercent ? item.agentFeePercent : 0.00
                              }
                            </span>

                            {item.agentFeeWalletAddress ? (
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(
                                    item.agentFeeWalletAddress
                                  );
                                  toast.success('복사되었습니다');
                                }
                              }
                              className="text-sm text-blue-500 hover:underline"
                              >
                                {item.agentFeeWalletAddress.substring(0, 6) + '...' + item.agentFeeWalletAddress.substring(item.agentFeeWalletAddress.length - 4)
                                }
                              </button>
                            ) : (
                              <span className="text-sm text-red-500">
                                AG USDT지갑 없음
                              </span>
                            )}

                          </div>
                          
                        </div>
                      </td>

                      <td className="p-2">
                        <div className="flex flex-col items-center justify-center gap-2">

                          <div className="flex flex-col items-center justify-center gap-2">

                            <span className="text-xl text-gray-500 font-semibold">
                              {
                                item.settlementFeePercent ? item.settlementFeePercent : 0.00
                              }
                            </span>

                            {item.settlementFeeWalletAddress ? (
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
                                {item.settlementFeeWalletAddress.substring(0, 6) + '...' + item.settlementFeeWalletAddress.substring(item.settlementFeeWalletAddress.length - 4)
                                }
                              </button>
                            ) : (
                              <span className="text-sm text-red-500">
                                PG USDT지갑 없음
                              </span>
                            )}

                          </div>
                          
                        </div>
                      </td>





                      <td className="p-2">
                        <div className="
                          w-40 h-36
                          flex flex-col items-end justify-start gap-2">


                            {/* 거래내역 */}
                            <button
                              onClick={() => {
                                router.push('/' + params.lang + '/agent/' + params.agentcode + '/trade-history?storecode=' + item.storecode);
                              }}
                              className="
                              w-full
                              bg-[#3167b4] text-sm text-white px-2 py-1 rounded-lg
                              hover:bg-[#3167b4]/80"
                            >
                              P2P 거래내역
                            </button>

                        </div>
                          

                      </td>

                      <td className="p-2">
                        <div className="
                          w-80 h-36
                          flex flex-col items-end justify-start gap-2">

                          <button
                            onClick={() => {
                              alert('준비중입니다.');
                            }}
                            className="
                            w-full
                            bg-[#3167b4] text-sm text-white px-2 py-1 rounded-lg
                            hover:bg-[#3167b4]/80"
                          >
                            결제 및 정산내역
                          </button>


                        </div>

                      </td>


                    </tr>

                  ))}

                </tbody>

              </table>

            </div>






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
                    
                    router.push(`/${params.lang}/agent/${params.agentcode}/store?limit=${e.target.value}&page=1`)

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
                
                router.push(`/${params.lang}/agent/${params.agentcode}/store?limit=${Number(limit)}&page=${Number(page) - 1}`);

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
                
                router.push(`/${params.lang}/agent/${params.agentcode}/store?limit=${Number(limit)}&page=${Number(page) + 1}`);

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



