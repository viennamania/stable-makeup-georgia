'use client';

///import type { Metadata } from "next";
///import { Inter } from "next/font/google";

///import "./globals.css";

///import { ThirdwebProvider } from "thirdweb/react";

import { useState, useEffect } from "react";


//import Script from "next/script";

//import { Analytics } from '@vercel/analytics/next';
//import { SpeedInsights } from '@vercel/speed-insights/next';


//const inter = Inter({ subsets: ["latin"] });

////import localFont from "next/font/local";



import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import { Button, Menu, MenuItem, Typography } from "@mui/material";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { langs } from "@/utils/langs";




import Image from "next/image";





import {
  getContract,
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
  getUserPhoneNumber,
  getUserEmail,
} from "thirdweb/wallets/in-app";


import {
  balanceOf,
  transfer,
} from "thirdweb/extensions/erc20";


import {
  ethereum,
  polygon,
  arbitrum,
  bsc,
} from "thirdweb/chains";


import {
  clientId,
  client,
} from "./../app/client";

import {
  chain,
  ethereumContractAddressUSDT,
  polygonContractAddressUSDT,
  arbitrumContractAddressUSDT,
  bscContractAddressUSDT,

  bscContractAddressMKRW,
} from "@/app/config/contractAddresses";
import { add } from "thirdweb/extensions/farcaster/keyGateway";
import { toast } from "react-hot-toast";




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



const AgentConsole = (
  { agentcode } : { agentcode: string }
) => {

  console.log("AgentConsole agentcode", agentcode);

  
  const router = useRouter();


  /*
  useEffect(() => {
  
    window.googleTranslateElementInit = () => {
     new window.google.translate.TranslateElement({ pageLanguage: 'en' }, 'google_translate_element');
    };
  
   }, []);
   */


  //const [showChain, setShowChain] = useState(false);



  const activeAccount = useActiveAccount();

  const address = activeAccount?.address;

  console.log("address", address);


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




  const [showCenter, setShowCenter] = useState(false);


  const [clientName, setClientName] = useState("");
  const [clientDescription, setClientDescription] = useState("");
  const [clientLogo, setClientLogo] = useState("");

  useEffect(() => {
      const fetchClientInfo = async () => {
          const response = await fetch("/api/client/getClientInfo", {
              method: "POST",
              headers: {
                  "Content-Type": "application/json",
              },
          });

          const data = await response.json();

          //console.log("clientInfo", data);

          if (data.result) {

              setClientName(data.result.clientInfo?.name || "");
              setClientDescription(data.result.clientInfo?.description || "");
              setClientLogo(data.result.clientInfo?.avatar || "/logo.png");
          }

      };

      fetchClientInfo();
  }, []);







  // check admin
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
      const fetchIsAdmin = async () => {
          const response = await fetch("/api/user/getUser", {
              method: "POST",
              headers: {
                  "Content-Type": "application/json",
              },
              body: JSON.stringify({
                storecode: "admin",
                walletAddress: address,
            }),
          });

          const data = await response.json();

          ///console.log("getUser", data);

          setIsAdmin(data.result?.role === "admin");
          //setIsAdmin(data.result?.isAdmin === true);

          /*
          if (data.result?.isAdmin !== true) {
            router.push(`/${"en"}/admin/login`);
          }
          */

      };

      if (address) {
        fetchIsAdmin();
      } else {
        ////router.push(`/${"en"}/admin/login`);
      }

  //}, [address, router]);
  }, [address]);




  const [agentAdminWalletAddress, setAgentAdminWalletAddress] = useState("");

  const [fetchingAgent, setFetchingAgent] = useState(true);
  const [agent, setAgent] = useState(null) as any;
  useEffect(() => {
      const fetchAgent = async () => {
          const response = await fetch("/api/agent/getOneAgent", {
              method: "POST",
              headers: {
                  "Content-Type": "application/json",
              },
              body: JSON.stringify({
                agentcode,
              }),
          });

          const data = await response.json();

          console.log("agent data", data);

          if (data.result) {

            setAgent(data.result);

            setAgentAdminWalletAddress(data.result?.adminWalletAddress);

            ///console.log("data.result.adminWalletAddress", data.result.adminWalletAddress);

            if (data.result?.adminWalletAddress === address) {
              setIsAdmin(true);
            }
          } else {
            setAgent(null);
            setAgentAdminWalletAddress("");
          }

          setFetchingAgent(false);

      };

      if (agentcode) {
        fetchAgent();
      } else {
        setFetchingAgent(false);
        //router.push(`/${"en"}/admin/login`);
      }

  //}, [address, router]);
  }, [address, agentcode]);


  const [totalCurrentUsdtBalance, setTotalCurrentUsdtBalance] = useState(0);

  
  // list of stores
  const [stores, setStores] = useState<Array<any>>([]);

  useEffect(() => {
      const fetchStores = async () => {
          const response = await fetch("/api/agent/getAllStoresForBalance", {
              method: "POST",
              headers: {
                  "Content-Type": "application/json",
              },
              body: JSON.stringify({
                clientId,
                agentcode,
              }),
          });

          const data = await response.json();

          //console.log("stores", data);


          if (data.result) {
            // set list if viewOnAndOff is true
            const filteredStores = data.result.stores.filter((store: { viewOnAndOff: boolean }) => store.viewOnAndOff === true);


            if (filteredStores.length > 10) {
              setStores(filteredStores.slice(0, 10) || []);
            } else {
              setStores(filteredStores || []);
            }

            setTotalCurrentUsdtBalance(data.result?.totalCurrentUsdtBalance || 0);
          } else {
            setStores([]);
            setTotalCurrentUsdtBalance(0);
          }
      };

      address && isAdmin && fetchStores();

      // poll every 10 seconds
      const interval = setInterval(() => {
        address && isAdmin && fetchStores();
      }, 10000);

      return () => clearInterval(interval);

  }, [address, isAdmin]);
  



  /*
    {
      totalCount: 5,
      stores: [
        {
          _id: new ObjectId('68ad0cced375320e8a69b2ea'),
          storecode: 'krbdscsd',
          storeName: 'confection',
          storeLogo: 'https://t0gqytzvlsa2lapo.public.blob.vercel-storage.com/P7DIjS7-DxG2zcp7o3qGKniSLTi1UDFehe0akM.png',
          createdAt: '2025-08-26T01:24:30.959Z',
          backgroundColor: 'yellow-100',
          settlementWalletAddress: '0x4429A977379fdd42b54A543E91Da81Abe7bb52FD',
          totalUsdtAmount: 118.19,
          currentUsdtBalance: 2098.3850755020003,
          liveOnAndOff: true
        },
        {
          _id: new ObjectId('68ad00d15359024833432764'),
          storecode: 'jysmbsco',
          storeName: 'macaron',
          storeLogo: 'https://t0gqytzvlsa2lapo.public.blob.vercel-storage.com/IYigWCF-vj1meScA5QItw3RRVaqxCkEWI98Ay1.png',
          createdAt: '2025-08-26T00:33:21.613Z',
          backgroundColor: 'blue-100',
          settlementWalletAddress: '0x4429A977379fdd42b54A543E91Da81Abe7bb52FD',
          totalUsdtAmount: 93.96,
          currentUsdtBalance: 2098.3850755020003,
          liveOnAndOff: false
        },
      ],
      totalCurrentUsdtBalance: 4196.7701510040006
    }
  */


  // liveOnAndOff
  // /api/store/toggleLive
  // toggling array of objects in state
  // find the object in the array and update it
  // const updatedStores = stores.map(store => {
  const [isToggling, setIsToggling] = useState([] as Array<string>);


  const toggleLiveOnAndOff = async (storecode: string, liveOnAndOff: boolean) => {

    if (isToggling.includes(storecode)) {
      return;
    }

    setIsToggling((prev) => [...prev, storecode]);

    const response = await fetch("/api/store/toggleLive", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        storecode,
        liveOnAndOff,
      }),
    });

    const data = await response.json();
    //console.log("toggleLiveOnAndOff", data);

    if (data.success) {
      
      // Update the store's liveOnAndOff status in the local state
      setStores((prevStores => 
        prevStores.map(store => 
          store.storecode === storecode ? { ...store, liveOnAndOff } : store
        )
      ));

    }


    setIsToggling((prev) => prev.filter(code => code !== storecode));

  };








  return (
    <>

      <div className="
      fixed top-2 left-2 z-50 flex flex-col items-start justify-start gap-2
      ">

        <button
          className="flex flex-row items-center justify-center
          bg-white bg-opacity-90
          p-2 rounded-lg shadow-lg
          hover:bg-gray-100 transition-colors duration-200
          "
          onClick={() => {
            router.push(`/${"ko"}/agent/${agentcode}`);
          }}
        >
          <Image
            src={agent?.agentLogo || "/icon-agent.png"}
            alt={agent?.agentName || "Agent Console"}
            width={50}
            height={50}
            className="rounded-lg bg-white w-12 h-12 object-contain"
          />
          <div className="ml-2 flex flex-col items-start justify-center">
            <h1 className="text-lg font-bold text-black">{agent?.agentName || "Admin Console"}</h1>
            <p className="text-sm text-gray-600">{agent?.agentDescription || "Manage your application settings"}</p>
          </div>
        </button>

        <button
          className="
          w-32
          flex flex-row items-center justify-center gap-2
          mb-2 px-4 py-2 bg-black bg-opacity-50 text-white rounded hover:bg-opacity-75"
          onClick={() => setShowCenter(!showCenter)}
        >
            <Image
              src={`/icon-shield.png`}
              alt={`Shield`}
              width={25}
              height={25}
            />

            <span className="text-sm text-white">
              {showCenter ? 'Hide Wallet' : 'Show Wallet'}
            </span>
        </button>

        <div className={`flex flex-col items-center justify-center
          ${showCenter ? 'bg-white' : 'hidden'}
          p-2 rounded-lg shadow-lg
        `}>

          <div className="
          w-36
          flex flex-col items-center justify-center p-2 bg-gray-100 rounded-lg shadow-md">

            {address ? (

              <div className="w-full flex flex-col gap-2 justify-between items-center">

                <button
                  className="text-lg text-zinc-800 underline"
                  onClick={() => {
                    navigator.clipboard.writeText(address);
                    toast.success("주소가 복사되었습니다.");
                  }}
                >
                  {address.substring(0, 6)}...
                </button>



                <div className="w-full flex flex-col gap-2 justify-between items-center
                  bg-green-50 p-2 rounded-lg">
                  <div className="flex flex-row gap-2 justify-center items-center">
                    <Image
                      src="/icon-tether.png"
                      alt="USDT"
                      width={35}
                      height={35}
                      className="rounded-lg w-6 h-6"
                    />
                    <span className="text-sm text-zinc-600">
                      USDT
                    </span>
                  </div>

                  <div className="
                  flex flex-col items-end justify-center
                  text-lg font-semibold text-[#409192]"
                  style={{ fontFamily: "monospace" }}
                  >
                    {Number(balance).toFixed(3).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                  </div>

                </div>

                <div className="flex flex-row gap-2 justify-center items-center">
                  <Image
                    src={`/logo-chain-${chain}.png`}
                    alt={`${chain} logo`}
                    width={20}
                    height={20}
                    className="rounded-lg"
                  />
                  <span className="text-sm text-zinc-600">
                    {chain === "ethereum" ? "ETH" :
                    chain === "polygon" ? "POL" :
                    chain === "arbitrum" ? "ETH" :
                    chain === "bsc" ? "BNB" : ""}
                  </span>
                </div>
                <div className="text-sm font-semibold text-zinc-800"
                  style={{ fontFamily: "monospace" }}
                >
                  {Number(nativeBalance).toFixed(8)}
                </div>

                <div className="flex flex-col gap-2 justify-center items-center">
                  {/* if pol balance is 0, comment out the text */}
                  {nativeBalance < 0.0001 && (
                    <p className="text-sm text-red-500">
                      가스비용이 부족합니다.<br/>가스비용이 부족하면<br/>입금은 가능하지만<br/>출금은 불가능합니다.
                    </p>
                  )}
                </div>

                <button
                  className="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600 transition-colors duration-200"
                  onClick={() => {

                    router.push('/ko/withdraw-usdt');

                  }}
                >
                  출금하기
                </button>



              </div>

            ) : (

              <div className="w-full flex flex-col gap-2 justify-center items-center">

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

                {/* 로그인하고 나의 자산을 확인하세요 */}
                <span className="text-sm text-zinc-600">
                  로그인하고 나의 지갑주소에서 자산을 확인하세요.
                </span>

              </div>

            )}


          </div>

        </div>
        
      </div>




      {address && isAdmin && (
        <div className="
        container max-w-screen-2xl mx-auto pl-16 pr-16
        p-2
        bg-white bg-opacity-90
        rounded-lg shadow-lg
        fixed top-2
        z-20 flex flex-col items-center justify-center gap-2
        ">


          {/* stores */}

          {stores.length > 0 && (

            <div
              //className="w-full flex flex-row items-center justify-start gap-2 overflow-x-auto
              //scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100
              //py-2"

              className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 4xl:grid-cols-11 gap-2
              overflow-x-auto
              scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100
              py-2
              "
            >

              <div className="
              w-28 h-20
              flex flex-col items-start justify-between
              bg-gray-100 p-1 rounded-lg shadow-md mr-4
              ">
                <p className="text-xs text-gray-800 font-bold mb-1">Total USDT</p>

                <div className="
                  w-full flex flex-row items-center justify-end gap-1">
                  <Image
                    src={`/icon-tether.png`}
                    alt={`USDT`}
                    width={18}  
                    height={18}
                  />
                  <span className="text-lg text-green-600 font-mono">
                    {totalCurrentUsdtBalance?.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",") || '0'}
                  </span>
                </div>

              </div>


              {stores.map((store) => (
                <div
                  key={store._id}

                  //className="flex flex-col items-start justify-between
                  //bg-gray-100 p-1 rounded-lg shadow-md
                  //w-24 h-20
                  //"
                  className={`${store?.liveOnAndOff ? 'bg-green-50' : 'bg-red-50'
                  } flex flex-col items-start justify-between
                  p-1 rounded-lg shadow-md
                  w-24 h-20
                  `}>

                  <div className="w-full flex flex-row items-center justify-between gap-1">
                    <Image
                      src={store.storeLogo || "/icon-store.png"}
                      alt={store.storeName}
                      width={18}
                      height={18}
                      className="rounded-lg bg-white w-6 h-6"
                    />
                    <p className="text-xs text-gray-800 font-bold">
                      {store.storeName.length > 4 ? store.storeName.substring(0, 4) + '...' : store.storeName || 'Store'}
                    </p>
                  </div>

                  <div className="flex flex-row items-center justify-end w-full gap-1">
                    <Image
                      src={`/icon-tether.png`}
                      alt={`USDT`}
                      width={12}
                      height={12}
                    />
                    <span className="text-sm text-green-600 font-mono">
                      {store.currentUsdtBalance?.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",") || '0'}
                    </span>
                  </div>

                  {/*
                  <div className="w-full flex flex-row items-center justify-center">
                    <button
                      disabled={isToggling.includes(store.storecode)}
                      className="w-full flex flex-row items-center justify-center"
                      title={store?.liveOnAndOff ? 'Live On' : 'Live Off'}
                      onClick={() => toggleLiveOnAndOff(store.storecode, !store?.liveOnAndOff)}
                    >
                      <Image
                        src={store?.liveOnAndOff ? `/icon-on.png` : `/icon-off.png`}
                        alt={store?.liveOnAndOff ? `Live On` : `Live Off`}
                        width={40}
                        height={15}
                        className={`
                          ${isToggling.includes(store.storecode) ?
                          'opacity-50 cursor-not-allowed animate-pulse' : ''
                        }`}
                      />
                      
                    </button>
                  </div>
                  */}
                  
                </div>
              ))}

            </div>

          )}

        </div>
      )}










    </>

  );


};



AgentConsole.displayName = "AgentConsole";

export default AgentConsole;