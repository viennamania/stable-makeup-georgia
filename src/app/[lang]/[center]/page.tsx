'use client';

import { useState, useEffect, use } from "react";

import Image from "next/image";

import thirdwebIcon from "@public/thirdweb.svg";


import { client } from "../../client";

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
  polygon,
  arbitrum,
} from "thirdweb/chains";


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


const contractAddress = "0xc2132D05D31c914a87C6611C10748AEb04B58e8F"; // USDT on Polygon

const contractAddressArbitrum = "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9"; // USDT on Arbitrum


/*
const client = createThirdwebClient({
  clientId: "dfb94ef692c2f754a60d35aeb8604f3d",
});
*/





export default function Index({ params }: any) {


  //console.log("params", params);

  // get params from the URL

  const searchParams = useSearchParams();
 
  const wallet = searchParams.get('wallet');

  //console.log(wallet);



  const { connect, isConnecting } = useConnectModal();
  const handleConnect = async () => {
    await connect({
      chain: arbitrum,
      client,
      wallets,



      showThirdwebBranding: false,
      theme: 'light',
      
      /*
      appMetadata: {
        name: "GoodTether",
        description: "GoodTether",
        url: "https://gold.goodtether.com",
        //icons: ["https://gold.goodtether.com/logo.png"],
      },
      */

      size: 'compact',

      /*
      size: 'wide',

      welcomeScreen: {
        title: "Custom Title",
        subtitle: "Custom Subtitle",
        img: {
          src: "https://example.com/image.png",
          width: 100,
          height: 100,
        },
      },
      */
    
     //locale: 'en_US',
     locale: 'ko_KR',
      
    });
  };



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
    
        //console.log(result);
    
        setBalance( Number(result) / 10 ** 6 );

      } catch (error) {
        console.error("Error getting balance", error);
      }


      // getWalletBalance
      const result = await getWalletBalance({
        address: address,
        client: client,
        chain: arbitrum,
      });
      //console.log("getWalletBalance", result);
      /*
      {value: 193243898588330546n, decimals: 18, displayValue: '0.193243898588330546', symbol: 'ETH', name: 'ETH'}
      */
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
 

  const [user, setUser] = useState(null) as any;
  const [nickname, setNickname] = useState("");
  const [avatar, setAvatar] = useState("/profile-default.png");
  const [userCode, setUserCode] = useState("");


  const [seller, setSeller] = useState(null) as any;


  const [loadingUser, setLoadingUser] = useState(true);

  useEffect(() => {

      if (!address) {
          return;
      }

      
      const fetchData = async () => {

          const response = await fetch("/api/user/getUser", {
              method: "POST",
              headers: {
                  "Content-Type": "application/json",
              },
              body: JSON.stringify({
                  storecode: params.center,
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
          

          setLoadingUser(false);
      };

      fetchData();

  }, [address, params.center]);


  


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
              ///walletAddress: address,
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

  } , [params.center]);


  ///console.log("storeCode", storeCode);
 {/*
  {"storecode":"teststorecode","storeName":"테스트상점","storeType":"test","storeUrl":"https://test.com","storeDescription":"설명입니다.","storeLogo":"https://test.com/logo.png","storeBanner":"https://test.com/banner.png"}
  */}


  return (


    <main className="p-4 min-h-[100vh] flex items-start justify-center container max-w-screen-lg mx-auto
    bg-[#E7EDF1]">


      <div className="py-0 w-full">

 
          <div className="w-full flex flex-col xl:flex-row items-center justify-between
          gap-2 bg-black/10 p-2 rounded-lg mb-4">
              
              
              
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
                      className="rounded-lg w-5 h-5"
                  />
                  <span className="text-sm text-zinc-50">
                    {
                      store && store?.storeName + " (" + store?.storecode + ")"
                    }
                  </span>
                  {address === storeAdminWalletAddress && (
                    <div className="flex flex-row gap-2 items-center">
                      <Image
                        src="/icon-manager.png"
                        alt="Store Admin"
                        width={20}
                        height={20}
                      />
                      <span className="text-sm text-zinc-50">
                        가맹점 관리자
                      </span>
                    </div>
                  )}
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
                </div>

              </button>


              <div className="flex flex-row items-center gap-2">
                
                
                <div className="w-full flex flex-row items-center justify-end gap-2">
                  {!address && (
                    <ConnectButton
                      client={client}
                      wallets={wallets}
                      
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
                        className="
                        w-32 h-10 items-center justify-center
                        flex bg-[#3167b4] text-sm text-[#f3f4f6] px-4 py-2 rounded-lg hover:bg-[#3167b4]/80"
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


        <div className="w-full flex flex-col justify-between items-center gap-2 mb-5">
          {/*
          <AppBarComponent />
          */}

          {/* select input for network selection (polygon, arbitrum) */}
          {/*
          <div className="flex flex-row gap-2 justify-center items-center">
            <button
              onClick={() => {
                // switch to polygon

                address && activeWallet?.disconnect();
                router.push(
                  "/" + params.lang + "/polygon"
                );
              }}
              className={`
                ${params.center === "polygon" ? "bg-zinc-200 text-zinc-800" : "bg-zinc-800 text-zinc-300"} p-2 rounded`}
            >
              Polygon
            </button>
            <button
              onClick={() => {
                // switch to arbitrum
                address && activeWallet?.disconnect();
                router.push(
                  "/" + params.lang + "/arbitrum"
                );
              }}
              className={`
                ${params.center === "arbitrum" ? "bg-zinc-200 text-zinc-800" : "bg-zinc-800 text-zinc-300"} p-2 rounded`}
            >
              Arbitrum
            </button>


          </div>
          */}

          <div className="w-full flex flex-row gap-2 justify-end items-center">


          {/* right space */}
          {/* background transparent */}
          <select
            //className="p-2 text-sm bg-zinc-800 text-white rounded"


            className="p-2 text-sm bg-transparent text-zinc-800 rounded"

            onChange={(e) => {
              const lang = e.target.value;
              router.push(
                "/" + lang + "/" + params.center
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


  
          <div className="w-full flex flex-col xl:flex-row gap-5 items-start justify-start">
      

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
                                  "/" + params.lang + "/" + params.center + "/profile-settings"
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

                            
                            <button

                              onClick={() => {

                                if (!address) {
                                  toast.error(Please_connect_your_wallet_first);
                                  return;
                                }

                                // redirect to settings page
                                router.push(
                                  "/" + params.lang + "/" + params.center + "/profile-settings"
                                );


                              }}
                              className="text-zinc-800 underline"
                            >

                              프로필 설정

                            </button>
                            



                          </div>
                        ) : (

                          <div className="flex flex-col gap-2 justify-center items-center">
                            {/* 아이디를 설정해야 거래를 시작할 수 있습니다. */}
                            {address && (
                              <span className="text-sm text-red-500">
                                회원아이디가 설정되지 않았습니다.<br/>
                                거래를 시작하려면 회원아이디를 설정해야 합니다.
                              </span>
                            )}

                            <button

                            onClick={() => {

                              if (!address) {
                                toast.error(Please_connect_your_wallet_first);
                                return;
                              }

                              // redirect to settings page
                              router.push(
                                "/" + params.lang + "/" + params.center + "/profile-settings"
                              );


                            }}
                            className="text-zinc-800 underline"
                            >

                            프로필 설정

                            </button>
                          

                          </div>
                        )}

                      </>

                    )}


                  </div>


                  {!isAdmin && (
              
                    <div className="w-full flex flex-row gap-2 justify-between items-center mt-5">

                      <button
                        onClick={() => {
      

                          // redirect to buy USDT page
                          router.push(
                            //"/" + params.lang + "/" + params.center + "/buyorder-usdt"

                            //wallet === "smart" ?
                            //</div>"/" + params.lang + "/" + params.center + "/buyorder-usdt?wallet=smart"
                            //:

                            "/" + params.lang + "/" + params.center + "/buyorder-placement"

                          );

                        }}
                        className="w-full flex items-center justify-start bg-[#3167b4] text-white px-4 py-2 rounded-lg hover:bg-blue-600"
                      >
                        <Image
                          src="/icon-buy-label-color.png"
                          alt="Buy"
                          width={40}
                          height={40}
                          className=" mr-2"
                        />
                        {Buy}
                      </button>
                



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
                            //"/" + params.lang + "/" + params.center + "/accept-buyorder-usdt"

                            //wallet === "smart" ?
                            //</div>"/" + params.lang + "/" + params.center + "/accept-buyorder-usdt?wallet=smart"
                            //:

                            "/" + params.lang + "/" + params.center + "/buyorder"

                          );

                        }}
                        className="w-full flex items-center justify-start bg-[#3167b4] text-white px-4 py-2 rounded-lg hover:bg-blue-600"
                      >
                        <Image
                          src="/icon-sell-label-color.png"
                          alt="Sell"
                          width={40}
                          height={40}
                          className="mr-2"
                        />
                        {Sell}
                      </button>

                    </div>

                  )}



                  {isAdmin && (

                    <div className="w-full grid grid-cols-2 xl:grid-cols-4 gap-2 mt-5">

                      <button
                        onClick={() => {
                          // comming soon

                          //toast.success(Coming_Soon);

                          router.push('/' + params.lang + '/' + params.center + '/store');

                        }}
                        className=" w-full flex bg-[#3167b4] text-white px-4 py-2 rounded-lg hover:bg-blue-600"
                      >
                        가맹점관리
                      </button>

                      <button
                        onClick={() => {
                          // comming soon

                          toast.success(Coming_Soon);

                          //router.push('/' + params.lang + '/' + params.center + '/sell-usdt');

                        }}
                        className=" w-full flex bg-[#3167b4] text-white px-4 py-2 rounded-lg hover:bg-blue-600"
                      >
                        판매자 관리
                      </button>


                      <button
                        onClick={() => {
                          // comming soon

                          toast.success(Coming_Soon);

                          //router.push('/' + params.lang + '/' + params.center + '/buyorder');

                        }}
                        className=" w-full flex bg-[#3167b4] text-white px-4 py-2 rounded-lg hover:bg-blue-600"
                      >
                        구매자 관리
                      </button>



                      <button
                        onClick={() => {
                          // comming soon

                          //toast.success(Coming_Soon);

                          router.push('/' + params.lang + '/' + params.center + '/dashboard/trade-history');

                        }}
                        className=" w-full flex bg-[#3167b4] text-white px-4 py-2 rounded-lg hover:bg-blue-600"
                      >
                        거래 관리
                      </button>






                    </div>

                  )}




                  {address && !fetchingStore && address === storeAdminWalletAddress && (
                    <div className="mt-4 w-full grid grid-cols-2 gap-2">

                      <button
                        onClick={() => {
                          // comming soon

                          //toast.success(Coming_Soon);

                          router.push('/' + params.lang + '/' + params.center + '/admin/store');

                        }}
                        className=" w-full flex bg-[#3167b4] text-white px-4 py-2 rounded-lg hover:bg-blue-600"
                      >
                        가맹점관리
                      </button>

                      <button
                        onClick={() => {
                          // comming soon

                          toast.success(Coming_Soon);

                          //router.push('/' + params.lang + '/' + params.center + '/sell-usdt');

                        }}
                        className=" w-full flex bg-[#3167b4] text-white px-4 py-2 rounded-lg hover:bg-blue-600"
                      >
                        판매자 관리
                      </button>

                      <button
                        onClick={() => {
                          // comming soon

                          toast.success(Coming_Soon);

                          //router.push('/' + params.lang + '/' + params.center + '/sell-usdt');

                        }}
                        className=" w-full flex bg-[#3167b4] text-white px-4 py-2 rounded-lg hover:bg-blue-600"
                      >
                        구매자 관리
                      </button>

                      <button
                        onClick={() => {
                          // comming soon

                          //toast.success(Coming_Soon);

                          router.push('/' + params.lang + '/' + params.center + '/trade-history');

                        }}
                        className=" w-full flex bg-[#3167b4] text-white px-4 py-2 rounded-lg hover:bg-blue-600"
                      >
                        거래 관리
                      </button>

                    </div>
                  )}


                  
                


              </div>



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
          src={props.avatar || thirdwebIcon}
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
