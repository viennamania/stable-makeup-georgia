'use client';

import { useState, useEffect, use } from "react";

import Image from "next/image";


import {
  clientId,
  client
} from "../../client";


import { createThirdwebClient } from "thirdweb";

import {
  //ThirdwebProvider,
  ConnectButton,

  useConnect,

  useReadContract,

  useActiveWallet,

  useActiveAccount,

  useSetActiveWallet,
  useConnectedWallets,

  darkTheme,

  lightTheme,

  useConnectModal,
  
} from "thirdweb/react";

import {
  inAppWallet,
  createWallet,
  getWalletBalance,
} from "thirdweb/wallets";



import {
  getContract,
  //readContract,
} from "thirdweb";


import { balanceOf, transfer } from "thirdweb/extensions/erc20";
 


import { getUserPhoneNumber } from "thirdweb/wallets/in-app";


import { toast } from 'react-hot-toast';

import {
  useRouter,
  useSearchParams
}from "next//navigation";
import { add } from "thirdweb/extensions/farcaster/keyGateway";


import { getOwnedNFTs } from "thirdweb/extensions/erc721";


import GearSetupIcon from "@/components/gearSetupIcon";


//import LanguageSelector from "@/components/LanguageSelector";

import AppBarComponent from "@/components/Appbar/AppBar";
import { getDictionary } from "../../dictionaries";


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

import { paymentUrl } from "../../config/payment";

import { version } from "../../config/version";



const storecode = "admin";


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



export default function Index({ params }: any) {


  //console.log("params", params);

  // get params from the URL

  const searchParams = useSearchParams();
 
  const wallet = searchParams.get('wallet');

  //console.log(wallet);



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
    My_Balance: "",
    My_Nickname: "",
    My_Buy_Trades: "",
    My_Sell_Trades: "",
    Buy: "",
    Sell: "",
    Buy_USDT: "",
    Sell_USDT: "",
    Contact_Us: "",
    Buy_Description: "",
    Sell_Description: "",
    Send_USDT: "",
    Pay_USDT: "",
    Coming_Soon: "",
    Open_Orders: "",
    Please_connect_your_wallet_first: "",

    Please_verify_your_account_first_for_selling: "",

    Copied_Wallet_Address: "",
    Withdraw_USDT: "",


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
    My_Balance,
    My_Nickname,
    My_Buy_Trades,
    My_Sell_Trades,
    Buy,
    Sell,
    Buy_USDT,
    Sell_USDT,
    Contact_Us,
    Buy_Description,
    Sell_Description,
    Send_USDT,
    Pay_USDT,
    Coming_Soon,
    Open_Orders,
    Please_connect_your_wallet_first,

    Please_verify_your_account_first_for_selling,

    Copied_Wallet_Address,
    Withdraw_USDT,
  } = data;










  //const { connect, isConnecting, error } = useConnect();

  ///console.log(isConnecting, error);



  const router = useRouter();

  





  // get the active wallet
  const activeWallet = useActiveWallet();



  ///console.log('activeWallet', activeWallet);



  //const setActiveAccount = useSetActiveWallet();
 

  //const connectWallets = useConnectedWallets();

  //console.log('connectWallets', connectWallets);

  //const smartConnectWallet = connectWallets?.[0];
  //const inAppConnectWallet = connectWallets?.[1];

  //console.log("connectWallets", connectWallets);
  
  /*
  useEffect(() => {

    if (inAppConnectWallet) {
      setActiveAccount(inAppConnectWallet);
    }

  } , [inAppConnectWallet, setActiveAccount]);
  */

  //inAppConnectWallet && setActiveAccount(inAppConnectWallet);



  const activeAccount = useActiveAccount();

  const address = activeAccount?.address;

  //console.log('address', address);



  ///console.log('address', address);



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










  const [loadingAnimation, setLoadingAnimation] = useState(false);
  // loadingAnimation duration is 2 seconds
  // and then 10 seconds later it will be toggled again

  useEffect(() => {

    if (loadingAnimation) {
      setTimeout(() => {
        setLoadingAnimation(false);
      }, 2000);
    } else {
      setTimeout(() => {
        setLoadingAnimation(true);
      }, 10000);
    }


    


  } , [loadingAnimation]);


  /*
  const { data: balanceData } = useReadContract({
    contract, 
    method: "function balanceOf(address account) view returns (uint256)", 

    params: [ address ], // the address to get the balance of

  });

  console.log(balanceData);

  useEffect(() => {
    if (balanceData) {
      setBalance(
        Number(balanceData) / 10 ** 6
      );
    }
  }, [balanceData]);


  console.log(balance);
  */






      

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

 

  ////console.log(phoneNumber);




  const [isAdmin, setIsAdmin] = useState(false);
 

  const [nickname, setNickname] = useState("");
  const [avatar, setAvatar] = useState("/profile-default.png");
  const [userCode, setUserCode] = useState("");


  const [user, setUser] = useState(null) as any;

  const [seller, setSeller] = useState(null) as any;


  const [loadingUser, setLoadingUser] = useState(true);

  useEffect(() => {


      
      const fetchData = async () => {
        
        if (!address) {
          return;
        }

        setLoadingUser(true);

        try {

          const response = await fetch("/api/user/getUser", {
              method: "POST",
              headers: {
                  "Content-Type": "application/json",
              },
              body: JSON.stringify({
                  storecode: storecode,
                  walletAddress: address,
              }),
          });

          const data = await response.json();

          //console.log("getUser data.result", data.result);


          if (data.result) {
              setUser(data.result);

              setNickname(data.result.nickname);
              data.result.avatar && setAvatar(data.result.avatar);
              setUserCode(data.result.id);

              setSeller(data.result.seller);

              setIsAdmin(data.result?.role === "admin");

          } else {
              setUser(null);
              setNickname("");
              setAvatar("/profile-default.png");
              setUserCode("");
              setSeller(null);

              setIsAdmin(false);
          }

        } catch (error) {
          console.error("회원 정보 가져오기 실패", error);
          setUser(null);
          setNickname("");
          setAvatar("/profile-default.png");
          setUserCode("");
          setSeller(null);

          setIsAdmin(false);
        }
          

          setLoadingUser(false);

      };

      fetchData();

  }, [address, storecode]);


  


  const [countOfOpenOrders, setCountOfOpenOrders] = useState(0);
  useEffect(() => {
    const fetchData = async () => {
        const response = await fetch("/api/order/getCountOfOpenOrders", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
            }),
        });

        const data = await response?.json();

        console.log("data", data);

        if (data.result) {

            setCountOfOpenOrders(data.result);
        }
    };

    fetchData();

  } , []);




  const [bestSellers, setBestSellers] = useState([]);
  useEffect(() => {
    const fetchData = async () => {
        const response = await fetch("/api/user/getBestSellers", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
            }),
        });

        const data = await response.json();

        //console.log("data", data);

        if (data.result) {

            setBestSellers(data.result.users);
        }
    };

    fetchData();

  }, []);  
  


  ///console.log("bestSellers", bestSellers);




  const [buyTrades, setBuyTrades] = useState([]);

  useEffect(() => {

    if (!address) {
      return;
    }

    const fetchData = async () => {
        const response = await fetch("/api/order/getBuyTradesProcessing", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
              walletAddress: address,
              limit: 10,
              page: 1,
            }),
        });

        const data = await response.json();

        //console.log("data", data);

        if (data.result) {

          setBuyTrades(data.result.orders);
        }
    };

    fetchData();

  } , [address]);





  const [sellTrades, setSellTrades] = useState([]);

  useEffect(() => {

    if (!address) {
      return;
    }

    const fetchData = async () => {
        const response = await fetch("/api/order/getSellTradesProcessing", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
              walletAddress: address,
              limit: 10,
              page: 1,
            }),
        });

        const data = await response.json();

        //console.log("data", data);

        if (data.result) {

          setSellTrades(data.result.orders);
        }
    };

    fetchData();

  } , [address]);



  const [storeAdminWalletAddress, setStoreAdminWalletAddress] = useState("");

  const [fetchingStore, setFetchingStore] = useState(false);
  const [store, setStore] = useState("");

  useEffect(() => {

    setFetchingStore(true);

    const fetchData = async () => {
        const response = await fetch("/api/store/getOneStore", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
              storecode: storecode,
              ////walletAddress: address,
            }),
        });

        const data = await response.json();

        ///console.log("data", data);

        if (data.result) {

          setStore(data.result);

          setStoreAdminWalletAddress(data.result?.adminWalletAddress);

        }

        setFetchingStore(false);
    };

    fetchData();

  } , [storecode]);


  ///console.log("storeCode", storeCode);





  // searchStore
  const [searchStore, setSearchStore] = useState({
    storecode: storecode,
    walletAddress: address,
  } as any);

  // get store summary
  // total number of buyers, total number of trades, total buy amount krw, total usdt amount
 
  
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
    latestTrades: any[];


    totalNumberOfClearances?: number;
    totalClearanceAmountKrw?: number;
    totalClearanceAmountUsdt?: number;
    latestClearances?: any[];


    totalNumberOfBuyOrders: number;
    latestBuyOrders: any[];

    totalNumberOfSellOrders?: number;
    latestSellOrders?: any[];


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
    latestTrades: [],

    totalNumberOfClearances: 0,
    totalClearanceAmountKrw: 0,
    totalClearanceAmountUsdt: 0,
    latestClearances: [],


    totalNumberOfBuyOrders: 0,
    latestBuyOrders: [],

    totalNumberOfSellOrders: 0,
    latestSellOrders: [],
  });

  const [loadingSummary, setLoadingSummary] = useState(true);

  const fetchTotalSummary = async () => {
    if (!address) {
      return;
    }

    setLoadingSummary(true);
    const response = await fetch('/api/summary/getTotalSummary', {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json',
      },
      body: JSON.stringify(
        {
          //searchStore: searchStore,
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
    
  } , [address]);




  // if totalNumberOfBuyOrders > 0, then play audio notification(notification.wave)
  useEffect(() => {
    if (totalSummary.totalNumberOfBuyOrders > 0 && loadingSummary === false) {
      const audio = new Audio('/notification.wav');
      audio.play();
    }
  }, [totalSummary.totalNumberOfBuyOrders, loadingSummary]);




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
      <div className="flex flex-col items-center justify-center gap-4 p-4">

        <h1 className="text-2xl font-bold">접근이 거부되었습니다</h1>
        <p className="text-lg">이 페이지에 접근할 권한이 없습니다.</p>
        <div className="text-lg text-gray-500">{address}</div>


            {/* 회원가입한후 가맹점 관리자 등록신청을 하세요 */}
            {/* 회원가입하러 가기 */}
            <div className="flex flex-row items-center justify-center gap-2">
              <button
                onClick={() => {
                  router.push('/' + params.lang + '/admin/profile-settings');
                }}
                className="flex bg-[#3167b4] text-sm text-[#f3f4f6] px-4 py-2 rounded-lg hover:bg-[#3167b4]/80"
              >
                회원가입하러 가기
              </button>
            </div>



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


    <main className="p-4 min-h-[100vh] flex items-start justify-center container max-w-screen-2xl mx-auto
    
    ">


      <div className="py-0 w-full">


        <div className="w-full flex flex-col xl:flex-row items-center justify-center gap-2 bg-black/10 p-2 rounded-lg mb-4">
            
          <div className="w-full flex flex-row items-center justify-start gap-2">
            <Image
              src="/logo.png"
              alt="logo"
              width={100}
              height={100}
              className="h-10 w-10 rounded-full"
            />

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

          )}




        </div>
  


        <div className="w-full flex flex-col justify-between items-center gap-2 mb-5">
   

          <div className="w-full flex flex-row gap-2 justify-end items-center">


          {/* right space */}
          {/* background transparent */}
          <select
            //className="p-2 text-sm bg-zinc-800 text-white rounded"


            className="p-2 text-sm bg-transparent text-zinc-800 rounded"
            value={params.lang}
            onChange={(e) => {
              const lang = e.target.value;
              router.push(
                "/" + lang + "/" + storecode
              );
            }}
          >
            <option value="en">
              English(US)
            </option>
            <option value="ko">
              한국어(KR)
            </option>
            <option value="zh">
              中文(ZH)
            </option>
            <option value="ja">
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
                  <h2 className="text-lg font-semibold">구매주문</h2>
                  <p className="text-lg text-red-500 font-semibold">
                    {totalSummary.totalNumberOfBuyOrders}
                  </p>
                  {totalSummary.totalNumberOfBuyOrders > 0 && (
                    <Image
                      src="/icon-notification.gif"
                      alt="Notification"
                      width={50}
                      height={50}
                      className="w-15 h-15 object-cover"
                      
                    />
                  )}
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
                      router.push('/' + params.lang + '/admin/buyorder');
                    }}
                    className="bg-[#3167b4] text-sm text-[#f3f4f6] px-4 py-2 rounded-lg hover:bg-[#3167b4]/80"
                  >
                    구매주문관리
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

                  <table className="min-w-full min-h-[400px] align-top
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
                        
                        <th className="px-4 py-2 text-left">
                          거래번호<br/>거래시간
                        </th>
                        <th className="px-4 py-2 text-left">
                          구매자<br/>가맹점
                        </th>
                        <th className="px-4 py-2 text-right">
                          구매량(USDT)<br/>구매금액(원)<br/>구매개당금액(원)
                        </th>
                        <th className="px-4 py-2 text-center">
                          상태
                        </th>
                        <th className="px-4 py-2 text-left">
                          판매자
                          <br/>
                          결제방법
                        </th>
                      </tr>
                    </thead>
                    <tbody className="align-top">
                      {totalSummary.latestBuyOrders.map((trade, index) => (
                        <tr key={index} className="border-b border-gray-200 hover:bg-gray-50">
                          <td className="px-4 py-2">
                            #{trade.tradeId}
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
                            {trade?.nickname}({trade?.buyer?.depositName})
                            <br/>
                            {trade?.store?.storeName}
                          </td>
                          <td className="px-4 py-2 text-right">
                            <div className="flex flex-col items-end">
                              <div className="flex flex-row items-center justify-end gap-1">
                                <Image
                                  src="/icon-tether.png"
                                  alt="USDT"
                                  width={16}
                                  height={16}
                                />
                                <span className="text-lg text-[#409192] font-semibold"
                                  style={{ fontFamily: "monospace" }}
                                >
                                  {
                                  Number(trade.usdtAmount).toFixed(3).replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                                  }
                                </span>
                              </div>
                              <span className="text-lg text-yellow-600 font-semibold"
                                style={{ fontFamily: "monospace" }}
                              >
                                {Number(trade.krwAmount).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                              </span>
                              <span className="text-lg text-zinc-600 font-semibold"
                                style={{ fontFamily: "monospace" }}
                              >
                                {Number(trade.rate).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                              </span>
                            </div>
                          </td>

                          <td className="px-4 py-2">
                            {/* "orderded", "accepted", "paymentRequested" */}

                            <div className="flex items-center justify-center">

                              <button
                                onClick={() => {
                                  //router.push('/' + params.lang + '/' + trade.storecode + '/pay-usdt-reverse/' + trade.tradeId);
                                  // new window open
                                  // href={`${paymentUrl}/${params.lang}/${clientId}/${item?.storecode}/pay-usdt-reverse/${item?._id}`}
                                  window.open(
                                    `${paymentUrl}/${params.lang}/${clientId}/${trade.storecode}/pay-usdt-reverse/${trade._id}`,
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

                              </button>
                          
                            </div>
                          
                          </td>

                          <td className="px-4 py-2">
                            {trade?.seller?.nickname.length > 10 ? trade?.seller?.nickname.slice(0, 10) + "..." : trade?.seller?.nickname}
                            <br/>
                            {trade?.store?.bankInfo?.bankName}
                            <br/>
                            {trade?.store?.bankInfo?.accountHolder}
                          </td>

                        </tr>
                      ))}
                    </tbody>
                  </table>

                </div>

              </div>

            </div>


            
            {version !== 'bangbang' && (
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
                  <h2 className="text-lg font-semibold">청산주문</h2>
                  <p className="text-lg text-zinc-500">
                    {totalSummary.totalNumberOfSellOrders}
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
                      router.push('/' + params.lang + '/admin/clearance-history');
                    }}
                    className="bg-[#3167b4] text-sm text-[#f3f4f6] px-4 py-2 rounded-lg hover:bg-[#3167b4]/80"
                  >
                    청산관리
                  </button>
                </div>

              </div>



              <div className="w-full flex flex-row items-center justify-end gap-2">

                <div className="w-full mt-4">
                  <div className="flex flex-row items-center justify-start gap-2">
                    {/* dot */}
                    <div className="w-2 h-2 bg-[#3167b4] rounded-full"></div>
                    <h2 className="text-lg font-semibold">최근 청산주문</h2>
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
                          가맹점<br/>청산자
                        </th>
                        <th className="px-4 py-2 text-left">청산금액(원)<br/>청산량(USDT)</th>
                        <th className="px-4 py-2 text-left">상태</th>
                      </tr>
                    </thead>
                    <tbody>
                      {totalSummary.latestSellOrders?.map((trade, index) => (
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


                            </button>
                          </td>

                        </tr>
                      ))}
                    </tbody>
                  </table>

                </div>

              </div>

            </div>
            )}



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
                  <h2 className="text-lg font-semibold">거래내역</h2>
                </div>

                <div className="w-full flex flex-row items-center justify-end gap-2">
                  <button
                    onClick={() => {
                      router.push('/' + params.lang + '/admin/trade-history');
                    }}
                    className="bg-[#3167b4] text-sm text-[#f3f4f6] px-4 py-2 rounded-lg hover:bg-[#3167b4]/80"
                  >
                    P2P 거래내역관리
                  </button>
                </div>

              </div>

              <div className="w-full flex flex-row items-center justify-center gap-2
                bg-white shadow-md rounded-lg p-4 mt-4">

                <div className="flex flex-col xl:flex-row items-center justify-center gap-2">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <h2 className="text-lg font-semibold">총 거래금액(원)</h2>
                    <p className="text-lg text-yellow-600 font-semibold"
                      style={{ fontFamily: "monospace" }}
                    >
                      {
                        Number(totalSummary.totalBuyAmountKrw).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                      }
                    </p>
                  </div>

                  <div className="flex flex-col items-center justify-center gap-2">
                    <h2 className="text-lg font-semibold">총 거래량(USDT)</h2>
                    <div className="flex flex-row items-center justify-center gap-1">
                      <Image
                        src="/icon-tether.png"
                        alt="USDT"
                        width={20}
                        height={20}
                        className="w-5 h-5"
                      />
                      <span className="text-lg text-[#409192] font-semibold"
                        style={{ fontFamily: "monospace" }}
                      >
                        {Number(totalSummary.totalUsdtAmount).toFixed(3).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                      </span>
                    </div>
                  </div>
                </div>

                {/* divider */}
                <div className="w-0.5 h-10 bg-gray-300 mx-2"></div>

                <div className="flex flex-col xl:flex-row items-center justify-center gap-2">
                
                  <div className="flex flex-col items-center justify-center gap-2">
                    <h2 className="text-lg font-semibold">총 결제금액(원)</h2>
                    <p className="text-lg text-yellow-600 font-semibold"
                      style={{ fontFamily: "monospace" }}
                    >
                      {
                        Number(totalSummary.totalSettlementAmountKRW).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                      }
                    </p>
                  </div>
                  <div className="flex flex-col items-center justify-center gap-2">
                    <h2 className="text-lg font-semibold">총 결제량(USDT)</h2>
                    <div className="flex flex-row items-center justify-center gap-1">
                      <Image
                        src="/icon-tether.png"
                        alt="USDT"
                        width={20}
                        height={20}
                        className="w-5 h-5"
                      />
                      <span className="text-lg text-[#409192] font-semibold"
                        style={{ fontFamily: "monospace" }}
                      >
                        {
                          Number(totalSummary.totalSettlementAmount).toFixed(3).replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                        }
                      </span>
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
                          구매자<br/>가맹점
                        </th>
                        <th className="px-4 py-2 text-right">
                          거래량(USDT)
                          <br/>
                          거래금액(원)
                        </th>

                        <th className="hidden xl:block
                          px-4 py-2 text-left">
                          판매자
                          <br/>
                          결제방법
                        </th>

                        <th className="px-4 py-2 text-right">
                          결제량(USDT)
                          <br/>
                          결제금액(원)
                        </th>
                    
                        {/*
                        <th className="px-4 py-2 text-left">거래일시</th>
                        */}
                      </tr>
                    </thead>
                    <tbody>
                      {totalSummary.latestTrades.map((trade, index) => (
                        <tr key={index} className="border-b">
                          <td className="px-4 py-2">
                            #{trade.tradeId}
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
                            <div className="flex flex-col items-start">
                              {trade.nickname}({trade?.buyer?.depositName})
                              <br />
                              {trade?.store?.storeName}
                            </div>
                          </td>

                          <td className="px-4 py-2">
                            <div className="flex flex-col items-end">
                              <div className="flex flex-row items-center justify-end gap-1">
                                <Image
                                  src="/icon-tether.png"
                                  alt="USDT"
                                  width={16}
                                  height={16}
                                />
                                <span className="text-lg text-[#409192] font-semibold"
                                style={{ fontFamily: "monospace" }}
                                >
                                  {Number(trade.usdtAmount).toFixed(3).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                                </span>
                              </div>
                              <span className="text-lg text-yellow-600 font-semibold"
                                style={{ fontFamily: "monospace" }}
                              >
                                {Number(trade.krwAmount).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                              </span>
                            </div>
                          </td>

                          <td className="
                            hidden xl:block
                            px-4 py-2">
                            {trade?.seller?.nickname.length > 10 ? trade?.seller?.nickname.slice(0, 10) + "..." : trade?.seller?.nickname}
                            <br/>
                            {trade?.store?.bankInfo?.bankName}
                            <br/>
                            {trade?.store?.bankInfo?.accountHolder}
                          </td>

                          <td className="px-4 py-2">
                            <div className="flex flex-col items-end">
                              <div className="flex flex-row items-center justify-end gap-1">
                                <Image
                                  src="/icon-tether.png"
                                  alt="USDT"
                                  width={16}
                                  height={16}
                                />
                                <span className="text-lg text-[#409192] font-semibold"
                                  style={{ fontFamily: "monospace" }}
                                >
                                  {Number(trade.settlement?.settlementAmount).toFixed(3).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                                </span>
                              </div>
                              <span className="text-lg text-yellow-600 font-semibold"
                                style={{ fontFamily: "monospace" }}
                              >
                                {Number(trade.settlement?.settlementAmountKRW).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                              </span>
                            </div>
                          </td>

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
            {version !== 'bangbang' && (
            <div className="w-full flex flex-col items-start justify-start gap-2  bg-white shadow-md rounded-lg p-4">

              <div className="w-full flex flex-col xl:flex-row items-center justify-start gap-2">

                <div className="w-full flex flex-row items-center justify-start gap-2">                
                  <Image
                    src="/icon-clearance.png"
                    alt="Clearance"
                    width={35}
                    height={35}
                    className="w-6 h-6"
                  />
                  <h2 className="text-lg font-semibold">청산관리</h2>
                </div>

                <div className="w-full flex flex-row items-center justify-end gap-2">
                  <button
                    onClick={() => {
                      router.push('/' + params.lang + '/admin/clearance-history');
                    }}
                    className="bg-[#3167b4] text-sm text-[#f3f4f6] px-4 py-2 rounded-lg hover:bg-[#3167b4]/80"
                  >
                    청산관리
                  </button>
                </div>

              </div>

              <div className="w-full flex flex-row items-center justify-center gap-2
                bg-white shadow-md rounded-lg p-4 mt-4">

                <div className="flex flex-col xl:flex-row items-center justify-center gap-2">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <h2 className="text-lg font-semibold">총 거래금액(원)</h2>
                    <p className="text-lg text-zinc-500">
                      {
                        !totalSummary.totalClearanceAmountKrw ? "0" :
                      Number(totalSummary.totalClearanceAmountKrw)?.toLocaleString()} 원
                    </p>
                  </div>

                  <div className="flex flex-col items-center justify-center gap-2">
                    <h2 className="text-lg font-semibold">총 거래량(USDT)</h2>
                    <p className="text-lg text-zinc-500">
                      {
                        !totalSummary.totalClearanceAmountUsdt ? "0" :
                      Number(totalSummary.totalClearanceAmountUsdt)?.toLocaleString()} USDT
                    </p>
                  </div>
                </div>

              </div>


              <div className="w-full flex flex-row items-center justify-end gap-2">

                {/* latest trades table */}
                <div className="w-full mt-4">
                  <div className="flex flex-row items-center justify-start gap-2">
                    {/* dot */}
                    <div className="w-2 h-2 bg-[#3167b4] rounded-full"></div>
                    <h2 className="text-lg font-semibold">총 거래수</h2>
                    <p className="text-lg text-zinc-500">
                      {totalSummary.totalNumberOfClearances}
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
                          구매자<br/>가맹점
                        </th>
                        <th className="px-4 py-2 text-left">거래금액(원)<br/>거래량(USDT)</th>
                        <th className="px-4 py-2 text-left">결제금액(원)<br/>결제량(USDT)</th>
                    
                        <th className="hidden xl:block
                          px-4 py-2 text-left">판매자</th>
                        {/*
                        <th className="px-4 py-2 text-left">거래일시</th>
                        */}
                      </tr>
                    </thead>
                    <tbody>
                      {totalSummary.latestClearances?.map((trade, index) => (
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
                            {trade?.buyer?.depositName}
                            <br/>
                            {trade?.store?.storeName}
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


                          <td className="
                            hidden xl:block
                            px-4 py-2">
                            {trade?.seller?.nickname.length > 10 ? trade?.seller?.nickname.slice(0, 10) + "..." : trade?.seller?.nickname}
                            <br/>
                            {trade?.seller?.bankInfo?.bankName}
                            <br/>
                            {trade?.seller?.bankInfo?.accountHolder}
                          </td>

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
            )}





            
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
                  <h2 className="text-lg font-semibold">가맹점</h2>

                </div>

                <div className="w-full flex flex-row items-center justify-end gap-2">
                  <button
                    onClick={() => {
                      router.push('/' + params.lang + '/admin/store');
                    }}
                    className="bg-[#3167b4] text-sm text-[#f3f4f6] px-4 py-2 rounded-lg hover:bg-[#3167b4]/80"
                  >
                    가맹점관리
                  </button>
                </div>

              </div>


              {/* latest stores talble */}
              <div className="w-full mt-4">
                
                <div className="flex flex-row items-center justify-start gap-2">
                  {/* dot */}
                  <div className="w-2 h-2 bg-[#3167b4] rounded-full"></div>
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
                      <th className="px-4 py-2 text-left">가맹점이름</th>
                      <th className="
                        hidden xl:block
                        px-4 py-2 text-left"
                      >
                          회원수
                          <br/>
                          거래수
                      </th>
                      <th className="px-4 py-2 text-left">거래금액(원)<br/>거래량(USDT)</th>
                      <th className="px-4 py-2 text-left">결제금액(원)<br/>결제량(USDT)</th>

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
                            <div className="flex flex-col xl:flex-row items-center justify-start gap-2">
                              <Image
                                src={store.storeLogo || "/profile-default.png"}
                                alt="Store Logo"
                                width={40}
                                height={40}
                                className="rounded-lg w-10 h-10 object-cover"
                              />
                              <div className="flex flex-col items-start justify-start">
                                <button
                                  onClick={() => {
                                    router.push('/' + params.lang + '/admin/store/' + store.storecode + '/settings');
                                  }}
                                  className="text-blue-500 hover:underline"
                                >
                                  {store.storeName}
                                </button>
                                <span className="text-sm text-zinc-500">
                                  {store?.agentName || store?.agentcode}
                                </span>
                              </div>
                          </div>
                        </td>
                        
                        <td className="
                          hidden xl:block
                          px-4 py-2"
                        >
                          {store.totalBuyerCount > 0 ? Number(store.totalBuyerCount)?.toLocaleString() : 0} 명
                          <br/>
                          {store.totalPaymentConfirmedCount > 0 ? Number(store.totalPaymentConfirmedCount)?.toLocaleString() : 0}
                        </td>

                        <td className="px-4 py-2">{
                          store.totalKrwAmount > 0 ? Number(store.totalKrwAmount)?.toLocaleString() : 0} 원
                          <br/>
                          {store.totalUsdtAmount > 0 ? Number(store.totalUsdtAmount)?.toLocaleString() : 0} USDT
                        </td>

                        <td className="px-4 py-2">
                          {store.totalSettlementAmountKRW > 0 ? Number(store.totalSettlementAmountKRW)?.toLocaleString() : 0} 원
                          <br/>
                          {store.totalSettlementAmount > 0 ? Number(store.totalSettlementAmount)?.toLocaleString() : 0} USDT
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
                  <h2 className="text-lg font-semibold">구매회원</h2>
                </div>

                <div className="w-full flex flex-row items-center justify-end gap-2">
                  <button
                    onClick={() => {
                      router.push('/' + params.lang + '/admin/member');
                    }}
                    className="bg-[#3167b4] text-sm text-[#f3f4f6] px-4 py-2 rounded-lg hover:bg-[#3167b4]/80"
                  >
                    회원관리
                  </button>
                </div>

              </div>




              {/* latest buyers talble */}
              <div className="w-full mt-4">
                <div className="flex flex-row items-center justify-start gap-2">
                  {/* dot */}
                  <div className="w-2 h-2 bg-[#3167b4] rounded-full"></div>
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

                      {nickname ? (

                        <div className="flex flex-row gap-2 justify-center items-center">
                          
                          <span className="text-3xl font-semibold text-zinc-800">
                            {nickname}
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

                          <div className="flex flex-col gap-2 justify-center items-center">
                            <button

                              onClick={() => {

                                if (!address) {
                                  toast.error(Please_connect_your_wallet_first);
                                  return;
                                }

                                // redirect to settings page
                                router.push(
                                  "/" + params.lang + "/" + storecode + "/profile-settings"
                                );


                              }}
                              //className="text-zinc-800 underline"
                              className="bg-[#3167b4] text-sm text-[#f3f4f6] px-4 py-2 rounded-lg hover:bg-[#3167b4]/80"
                            >

                              프로필 설정

                            </button>

                            <button

                              onClick={() => {

                                if (!address) {
                                  toast.error(Please_connect_your_wallet_first);
                                  return;
                                }

                                // redirect to settings page
                                router.push(
                                  "/" + params.lang + "/" + storecode + "/seller-settings"
                                );


                              }}
                              //className="text-zinc-800 underline"
                              className="bg-[#3167b4] text-sm text-[#f3f4f6] px-4 py-2 rounded-lg hover:bg-[#3167b4]/80"
                              >

                              판매자 설정

                              </button>

                          </div>
                          



                        </div>
                      ) : (

                        <div className="flex flex-col gap-2 justify-center items-center">
                          {/* 아이디를 설정해야 거래를 시작할 수 있습니다. */}
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
                              className="text-zinc-800 underline"
                            >

                              프로필 설정

                            </button>

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
                              className="text-zinc-800 underline"
                              >

                              판매자 설정

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
}



function Header() {
  return (
    <header className="flex flex-col items-center mb-20 md:mb-20">
      {/*
      <Image
        src={thirdwebIcon}
        alt=""
        className="size-[150px] md:size-[150px]"
        style={{
          filter: "drop-shadow(0px 0px 24px #a726a9a8)",
        }}
      />

      
      <h1 className="text-2xl md:text-6xl font-semibold md:font-bold tracking-tighter mb-6 text-zinc-100">
        thirdweb SDK
        <span className="text-zinc-300 inline-block mx-1"> + </span>
        <span className="inline-block -skew-x-6 text-blue-500"> Next.js </span>
      </h1>

      <p className="text-zinc-300 text-base">
        Read the{" "}
        <code className="bg-zinc-800 text-zinc-300 px-2 rounded py-1 text-sm mx-1">
          README.md
        </code>{" "}
        file to get started.
      </p>
      */}
    </header>
  );
}

function ThirdwebResources() {
  return (
    <div className="grid gap-4 lg:grid-cols-3 justify-center">
      <ArticleCard
        title="thirdweb SDK Docs"
        href="https://portal.thirdweb.com/typescript/v5"
        description="thirdweb TypeScript SDK documentation"
      />

      <ArticleCard
        title="Components and Hooks"
        href="https://portal.thirdweb.com/typescript/v5/react"
        description="Learn about the thirdweb React components and hooks in thirdweb SDK"
      />

      <ArticleCard
        title="thirdweb Dashboard"
        href="https://thirdweb.com/dashboard"
        description="Deploy, configure, and manage your smart contracts from the dashboard."
      />
    </div>
  );
}


function MarketResources() {
  return (
    <div className="grid gap-4 lg:grid-cols-3 justify-center">

      <ArticleCard
        title="Buy USDT"
        href="/buy-usdt"
        description="Buy USDT with your favorite real-world currency"
      />

  
      <ArticleCard
        title="Sell USDT"
        href="/sell-usdt"
        description="Sell USDT for your favorite real-world currency"
      />

      <ArticleCard
        title="How to use USDT"
        href="/"
        description="Learn how to use USDT in your favorite DeFi apps"
      />

    </div>
  );
}



function ArticleCard(props: {
  avatar?: string;
  title: string;
  href: string;
  description: string;
}) {
  return (
    <a
      
      //href={props.href + "?utm_source=next-template"}
      href={props.href}

      //target="_blank"

      className="flex flex-col border border-zinc-800 p-4 rounded-lg hover:bg-zinc-900 transition-colors hover:border-zinc-700"
    >

      <div className="flex justify-center">
        <Image
          src={props.avatar || "/icon-thirdweb.png"} // Default avatar if none provided
          alt="avatar"
          width={38}
          height={38}
          priority={true} // Added priority property
          className="rounded-full"
          style={{
              objectFit: 'cover',
              width: '38px',
              height: '38px',
          }}
        />
      </div>

      <article>
        <h2 className="text-lg font-semibold mb-2">{props.title}</h2>
        <p className="text-sm text-zinc-400">{props.description}</p>
      </article>
    </a>
  );
}
