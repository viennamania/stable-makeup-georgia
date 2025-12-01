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
  getUserPhoneNumber,
  getUserEmail,
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



import { version } from "../../../../config/version";



interface BuyOrder {

  date: string,

  totalCount: number, // Count the number of orders
  totalUsdtAmount: number,
  totalKrwAmount: number,

  totalSettlementCount: number, // Count the number of settlements
  totalSettlementAmount: number,
  totalSettlementAmountKRW: number,

  totalAgentFeeAmount: number,
  totalAgentFeeAmountKRW: number,
  totalFeeAmount: number,
  totalFeeAmountKRW: number,
}



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

  const limit = searchParams.get('limit') || 10;
  const page = searchParams.get('page') || 1;



  const [searchAgentcode, setSearchAgentcode] = useState(params.agentcode || "");




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


 
  const activeWallet = useActiveWallet();




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



    };


    if (address) getBalance();

    const interval = setInterval(() => {
      if (address) getBalance();
    } , 5000);

    return () => clearInterval(interval);

  } , [address, contract]);






  const [isAdmin, setIsAdmin] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [loadingUser, setLoadingUser] = useState(true);


  
  // get User by wallet address


  
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
        
        ///console.log('getUser data.result', data.result);


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
  



  // search form date to date
  const [searchFromDate, setSearchFormDate] = useState("");
  // set today's date in YYYY-MM-DD format
  useEffect(() => {

    //const today = new Date();
    //first day of the year
    const today = new Date( new Date().getFullYear(), 0, 1);

    today.setHours(today.getHours() + 9); // Adjust for Korean timezone (UTC+9)


    const formattedDate = today.toISOString().split('T')[0]; // YYYY-MM-DD format
    setSearchFormDate(formattedDate);
  }, []);




  const [searchToDate, setSearchToDate] = useState("");

  // set today's date in YYYY-MM-DD format
  useEffect(() => {
    const today = new Date();
    today.setHours(today.getHours() + 9); // Adjust for Korean timezone (UTC+9)

    const formattedDate = today.toISOString().split('T')[0]; // YYYY-MM-DD format
    setSearchToDate(formattedDate);
  }, []);





  const [searchBuyer, setSearchBuyer] = useState("");

  const [searchDepositName, setSearchDepositName] = useState("");


  // search store bank account number
  const [searchStoreBankAccountNumber, setSearchStoreBankAccountNumber] = useState("");

  





  // limit number
  //const [limit, setLimit] = useState(20);

  // page number
  //const [page, setPage] = useState(1);


  const [totalCount, setTotalCount] = useState(0);

  const [loadingBuyOrders, setLoadingBuyOrders] = useState(false);
    
  const [buyOrders, setBuyOrders] = useState<BuyOrder[]>([]);



   

  useEffect(() => {


    const fetchBuyOrders = async () => {


      if (!searchAgentcode || searchAgentcode === "") {
        setBuyOrders([]);
        setTotalCount(0);
        return;
      }


      setLoadingBuyOrders(true);

      const response = await fetch('/api/order/getAllBuyOrdersByAgentcodeDaily', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
          },
          body: JSON.stringify(

            {
              agentcode: searchAgentcode,
              limit: Number(limit),
              page: Number(page),
              walletAddress: address,
              searchMyOrders: searchMyOrders,

              fromDate: searchFromDate,
              toDate: searchToDate,

              searchBuyer: searchBuyer,
              searchDepositName: searchDepositName,
              searchStoreBankAccountNumber: searchStoreBankAccountNumber,
            }

        ),
      });

      setLoadingBuyOrders(false);

      if (!response.ok) {
        return;
      }

      const data = await response.json();

      setBuyOrders(data.result.orders);

      setTotalCount(data.result.totalCount);
      
    }

    fetchBuyOrders();

  } , [
    limit,
    page,
    address,
    searchMyOrders,

    searchAgentcode,
    searchFromDate,
    searchToDate,
    searchBuyer,
    searchDepositName,
    searchStoreBankAccountNumber
]);




  // array of agents
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
                agentcode: searchAgentcode,
            }),
        });

        const data = await response.json();

        //console.log("data", data);

        if (data.result) {

          setAgent(data.result);

          setAgentAdminWalletAddress(data.result?.adminWalletAddress);

          if (data.result?.adminWalletAddress === address) {
            setIsAdmin(true);
          }

      } else {
        // get agent list
        const response = await fetch("/api/agent/getAllAgents", {
          method: "POST",
          headers: {
              "Content-Type": "application/json",
          },
          body: JSON.stringify({
          }),
        });
        const data = await response.json();
        //console.log("getAgentList data", data);
        setAgentList(data.result.agents);
        setAgent(null);
        setAgentAdminWalletAddress("");
      }

        setFetchingAgent(false);
    };

    if (!searchAgentcode || searchAgentcode === "") {
      return;
    }

    fetchData();

    // interval to fetch store data every 10 seconds
    const interval = setInterval(() => {
      fetchData();
    }
    , 5000);
    return () => clearInterval(interval);

  } , [searchAgentcode, address]);







  // get all Agents
  const [fetchingAllAgents, setFetchingAllAgents] = useState(false);
  const [allAgents, setAllAgents] = useState([] as any[]);
  const [agentTotalCount, setAgentTotalCount] = useState(0);
  const fetchAllAgents = async () => {
    if (fetchingAllAgents) {
      return;
    }
    setFetchingAllAgents(true);
    const response = await fetch('/api/agent/getAllAgents', {
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
      setFetchingAllAgents(false);
      toast.error('에이전트 검색에 실패했습니다.');
      return;
    }

    const data = await response.json();

    ///console.log('getAllStores data', data);

    setAllAgents(data.result.agents);
    setAgentTotalCount(data.result.totalCount);
    setFetchingAllAgents(false);
    return data.result.agents;
  }
  useEffect(() => {
    fetchAllAgents();
  }, []);





  // totalNumberOfBuyOrders
  const [loadingTotalNumberOfBuyOrders, setLoadingTotalNumberOfBuyOrders] = useState(false);
  const [totalNumberOfBuyOrders, setTotalNumberOfBuyOrders] = useState(0);
  useEffect(() => {
    if (!address) {
      setTotalNumberOfBuyOrders(0);
      return;
    }

    

    const fetchTotalBuyOrders = async () => {
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
        return;
      }
      const data = await response.json();
      //console.log('getTotalNumberOfBuyOrders data', data);
      setTotalNumberOfBuyOrders(data.result.totalCount);

      setLoadingTotalNumberOfBuyOrders(false);
    };
    
    fetchTotalBuyOrders();

    const interval = setInterval(() => {
      fetchTotalBuyOrders();
    }, 5000);
    return () => clearInterval(interval);

  }, [address]);

      
  
  useEffect(() => {
    if (totalNumberOfBuyOrders > 0 && loadingTotalNumberOfBuyOrders === false) {
      const audio = new Audio('/notification.wav'); 
      audio.play();
    }
  }, [totalNumberOfBuyOrders, loadingTotalNumberOfBuyOrders]);



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

          {/* 홈 / 가맹점관리 / 회원관리 / 구매주문관리 */}
          {/* memnu buttons same width left side */}
          <div className="grid grid-cols-3 xl:grid-cols-6 gap-2 items-center justify-start mb-4">

            <button
                onClick={() => router.push('/' + params.lang + '/agent/' + params.agentcode + '/store')}
                className="flex w-32 bg-[#3167b4] text-[#f3f4f6] text-sm rounded-lg p-2 items-center justify-center
                hover:bg-[#3167b4]/80
                hover:cursor-pointer
                hover:scale-105
                transition-transform duration-200 ease-in-out
                ">
                가맹점관리
            </button>

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
                hover: scale-105
                transition-all duration-200 ease-in-out
                ">
                P2P 거래내역
            </button>

            <div className='flex w-32 items-center justify-center gap-2
            bg-yellow-500 text-[#3167b4] text-sm rounded-lg p-2'>
              <Image
                src="/icon-statistics.png"
                alt="Statistics"
                width={35}
                height={35}
                className="w-4 h-4"
              />
              <div className="text-sm font-semibold">
                통계(일별)
              </div>
            </div>

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


          <div className='flex flex-row items-center space-x-4'>
              <Image
                src="/icon-statistics.png"
                alt="Trade"
                width={35}
                height={35}
                className="w-6 h-6"
              />

              <div className="text-xl font-semibold">
                통계(일별)
              </div>

          </div>




            <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-3">



              {/* select agentcode */}
              {/*
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
                    에이전트 선택
                  </span>


                  <select
                    value={searchAgentcode}

                    //onChange={(e) => setSearchStorecode(e.target.value)}

                    // storecode parameter is passed to fetchBuyOrders
                    onChange={(e) => {
                      router.push('/' + params.lang + '/admin/trade-history-daily-agent?agentcode=' + e.target.value);
                      setSearchAgentcode(e.target.value);
                    }}



                    className="w-full p-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3167b4]"
                  >
                    <option value="">에이전트 선택</option>

                    {fetchingAllAgents && (
                      <option value="" disabled>
                        에이전트 검색중...
                      </option>
                    )}

                    {!fetchingAllAgents && allAgents && allAgents.map((item, index) => (
                      <option key={index} value={item.agentcode}
                        className="flex flex-row items-center justify-start gap-2"
                      >

                        {item.agentName}{' '}({item.agentcode})

                      </option>
                    ))}
                  </select>
              
              </div>
              */}



              {/* serach fromDate and toDate */}
              {/* DatePicker for fromDate and toDate */}
              {/*
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
              </div>
              */}


              {/*
              <div className="flex flex-col items-center gap-2">

                <div className="flex flex-col sm:flex-row items-center justify-center gap-2">

                  <div className="flex flex-row items-center gap-2">
                    <input
                      type="text"
                      value={searchBuyer}
                      onChange={(e) => setSearchBuyer(e.target.value)}
                      placeholder="회원 아이디"
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

                  <div className="flex flex-row items-center gap-2">
                    <input
                      type="text"
                      value={searchStoreBankAccountNumber}
                      onChange={(e) => setSearchStoreBankAccountNumber(e.target.value)}
                      placeholder="입금통장번호"
                      className="w-full p-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3167b4]"
                    /> 
                  </div>

                  <div className="
                    w-28  
                    flex flex-row items-center gap-2">
                    <button
                      onClick={() => {
                        setPageValue(1);
                        
                        fetchBuyOrders();

                        getTradeSummary();
                      }}
                      //className="bg-[#3167b4] text-white px-4 py-2 rounded-lg w-full"
                      className={`${
                        fetchingBuyOrders ? 'bg-gray-400' : 'bg-[#3167b4]'
                      }
                      text-white px-4 py-2 rounded-lg w-full
                      hover:bg-[#3167b4]/80
                      hover:cursor-pointer
                      hover:scale-105
                      transition-transform duration-200 ease-in-out`}
                      title="검색"

                      disabled={fetchingBuyOrders}
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
                          {fetchingBuyOrders ? '검색중...' : '검색'}
                        </span>
                      </div>

                    </button>
                  </div>

                </div>



              </div>
              */}






            </div>





            <div className="w-full overflow-x-auto">

              <table className=" w-full table-auto border-collapse border border-zinc-800 rounded-md">

                <thead className="bg-zinc-200">
                  <tr>
                    <th className="px-4 py-2 text-left text-sm font-semibold text-zinc-600">
                      날짜
                    </th>
                    {/* align right */}
                    <th className="px-4 py-2 text-right text-sm font-semibold text-zinc-600">P2P 거래수(건)</th>
                    <th className="px-4 py-2 text-right text-sm font-semibold text-zinc-600">P2P 거래량(USDT)</th>
                    <th className="px-4 py-2 text-right text-sm font-semibold text-zinc-600">P2P 거래금액(원)</th>

                    {/*
                    <th className="px-4 py-2 text-right text-sm font-semibold text-zinc-600">결제수(건)<br/>미결제수(건)</th>
                    */}
                    
                    <th className="px-4 py-2 text-right text-sm font-semibold text-zinc-600">AG 수수료량(USDT)</th>
                    <th className="px-4 py-2 text-right text-sm font-semibold text-zinc-600">AG 수수료금액(원)</th>

                    
                    <th className="px-4 py-2 text-right text-sm font-semibold text-zinc-600">PG 수수료량(USDT)</th>
                    <th className="px-4 py-2 text-right text-sm font-semibold text-zinc-600">PG 수수료금액(원)</th>

                    <th className="px-4 py-2 text-right text-sm font-semibold text-zinc-600">결제량(USDT)</th>
                    <th className="px-4 py-2 text-right text-sm font-semibold text-zinc-600">결제금액(원)</th>
                    


                  </tr>
                </thead>
                <tbody>
                  {buyOrders?.map((order, index) => (
                    <tr key={index} className="border-b border-zinc-300 hover:bg-zinc-100">
                      <td className="px-4 py-2 text-sm text-zinc-700">
                        {new Date(order.date).toLocaleDateString('ko-KR')}
                      </td>
                      {/* align right */}
                      <td className="px-4 py-2 text-sm text-zinc-700 text-right">
                        {order.totalCount ? order.totalCount.toLocaleString() : 0}
                      </td>


                      <td className="px-4 py-2 text-sm text-[#409192] font-semibold text-right"
                        style={{ fontFamily: 'monospace' }}
                      >
                        {Number(order.totalUsdtAmount).toFixed(3).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                      </td>
                      <td className="px-4 py-2 text-sm text-yellow-600 font-semibold text-right"
                        style={{ fontFamily: 'monospace' }}
                      >
                        {Number(order.totalKrwAmount).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                      </td>

                      {/*
                      <td className="px-4 py-2 text-sm text-zinc-700 text-right">
                        {order.totalSettlementCount ? order.totalSettlementCount.toLocaleString() : 0}
                        {' / '}
                        {(order.totalCount || 0) - (order.totalSettlementCount || 0)}
                      </td>
                      */}

                      <td className="px-4 py-2 text-sm text-[#409192] font-semibold text-right"
                        style={{ fontFamily: 'monospace' }}
                      >
                        {Number(order.totalAgentFeeAmount).toFixed(3).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                      </td>
                      <td className="px-4 py-2 text-sm text-yellow-600 font-semibold text-right"
                        style={{ fontFamily: 'monospace' }}
                      >
                        {Number(order.totalAgentFeeAmountKRW).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                      </td>



                      
                      <td className="px-4 py-2 text-sm text-[#409192] font-semibold text-right"
                        style={{ fontFamily: 'monospace' }}
                      >
                        {Number(order.totalFeeAmount).toFixed(3).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                      </td>
                      <td className="px-4 py-2 text-sm text-yellow-600 font-semibold text-right"
                        style={{ fontFamily: 'monospace' }}
                      >
                        {Number(order.totalFeeAmountKRW).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                      </td>

                      <td className="px-4 py-2 text-sm text-[#409192] font-semibold text-right"
                        style={{ fontFamily: 'monospace' }}
                      >
                        {Number(order.totalSettlementAmount).toFixed(3).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                      </td>
                      <td className="px-4 py-2 text-sm text-yellow-600 font-semibold text-right"
                        style={{ fontFamily: 'monospace' }}
                      >
                        {Number(order.totalSettlementAmountKRW).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                      </td>
                      


                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={4} className="px-4 py-2 text-sm text-zinc-500">
                      
                    </td>
                  </tr>
                </tfoot>
              </table>

            </div>

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



