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
import { postAdminSignedJson } from "@/lib/client/admin-signed-action";




const wallets = [
  inAppWallet({
    auth: {
      options: ["email", "google"],
    },
  }),
];

const STORE_SETTINGS_MUTATION_SIGNING_PREFIX = "stable-georgia:store-settings-mutation:v1";



const CenterConsole = () => {

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




  const [totalCurrentUsdtBalance, setTotalCurrentUsdtBalance] = useState(0);

  // list of stores
  const [stores, setStores] = useState<Array<any>>([]);

  useEffect(() => {
      const fetchStores = async () => {
          const response = await fetch("/api/store/getAllStoresForBalance", {
              method: "POST",
              headers: {
                  "Content-Type": "application/json",
              },
              body: JSON.stringify({
                clientId,
              }),
          });

          const data = await response.json();

          //console.log("stores", data);


          if (data.result) {
            // set list if viewOnAndOff is true
            const filteredStores = data.result.stores.filter((store: { viewOnAndOff: boolean }) => store.viewOnAndOff === true);

            setStores(filteredStores || []);


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


  const [isToggling, setIsToggling] = useState([] as Array<string>);


  const toggleLiveOnAndOff = async (storecode: string, liveOnAndOff: boolean) => {

    if (isToggling.includes(storecode)) {
      return;
    }

    if (!activeAccount || !address) {
      toast.error("관리자 지갑 연결이 필요합니다.");
      return;
    }

    setIsToggling((prev) => [...prev, storecode]);

    try {
      const response = await postAdminSignedJson({
        account: activeAccount,
        route: "/api/store/toggleLive",
        signingPrefix: STORE_SETTINGS_MUTATION_SIGNING_PREFIX,
        requesterStorecode: "admin",
        requesterWalletAddress: address,
        body: {
          storecode,
          liveOnAndOff,
        },
      });

      const data = await response.json().catch(() => null);
      //console.log("toggleLiveOnAndOff", data);

      if (!response.ok || !data?.success) {
        toast.error(
          String(data?.message || "").trim() || "라이브 상태 변경에 실패했습니다.",
        );
        return;
      }

      // Update the store's liveOnAndOff status in the local state
      setStores((prevStores =>
        prevStores.map((store) =>
          store.storecode === storecode ? { ...store, liveOnAndOff } : store
        )
      ));
    } catch (error) {
      console.error("toggleLiveOnAndOff failed", error);
      toast.error("라이브 상태 변경 중 오류가 발생했습니다.");
    } finally {
      setIsToggling((prev) => prev.filter(code => code !== storecode));
    }

  };

  const [showStores, setShowStores] = useState(false);

  return (
    <>

      <div className="
      fixed top-2 left-2 z-50 flex flex-col items-start justify-start gap-2
      ">

        <button className="flex flex-row items-center justify-center
          bg-white bg-opacity-90
          p-2 rounded-lg shadow-lg
          hover:shadow-xl transition-shadow duration-300
        "
          onClick={() => router.push(`/${"ko"}/admin`)}
        >
          <Image
            src={clientLogo || "/logo.png"}
            alt={clientName}
            width={50}
            height={50}
            className="rounded-lg bg-white w-12 h-12 object-contain"
          />
          <div className="ml-2 flex flex-col items-start justify-center">
            <h1 className="text-lg font-bold text-black">{clientName || "Admin Console"}</h1>
            <p className="text-sm text-gray-600">{clientDescription || "Manage your application settings"}</p>
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
                  showAllWallets={false}
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

                <span className="text-sm text-zinc-600">
                  로그인하고 나의 지갑주소에서 자산을 확인하세요.
                </span>

              </div>

            )}


          </div>

        </div>
        


        
      </div>




      {address && isAdmin && (
        <div className="fixed left-2 right-2 top-[5.25rem] z-20 md:left-[17.5rem] md:top-2">
          <div className="rounded-2xl border border-zinc-200/80 bg-white/95 p-2 shadow-lg backdrop-blur">
            <div className="flex flex-wrap items-center gap-2">
              <button
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-zinc-900 px-4 text-sm font-semibold text-white transition-colors hover:bg-zinc-700"
                onClick={() => setShowStores(!showStores)}
              >
                <Image
                  src="/icon-store.png"
                  alt="Store"
                  width={18}
                  height={18}
                  className="h-[18px] w-[18px]"
                />
                <span>{showStores ? "Hide Stores" : "Show Stores"}</span>
              </button>

              <div className="inline-flex h-11 items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-3">
                <span className="text-sm font-semibold text-zinc-700">Total USDT</span>
                <Image
                  src="/icon-tether.png"
                  alt="USDT"
                  width={16}
                  height={16}
                  className="h-4 w-4"
                />
                <span className="font-mono text-lg font-semibold text-emerald-600">
                  {Number(totalCurrentUsdtBalance || 0).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                </span>
              </div>
            </div>

            {showStores && (
              <div className="mt-2 max-h-[42vh] overflow-y-auto pr-1">
                {stores.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 px-4 py-6 text-center text-sm text-zinc-500">
                    표시할 가맹점이 없습니다.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5 2xl:grid-cols-7">
                    {stores.map((store) => (
                      <div
                        key={store._id}
                        className={`min-w-0 rounded-xl border p-2 shadow-sm ${
                          store?.liveOnAndOff
                            ? "border-emerald-100 bg-emerald-50/70"
                            : "border-rose-100 bg-rose-50/70"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Image
                            src={store.storeLogo || "/icon-store.png"}
                            alt={store.storeName || "Store"}
                            width={28}
                            height={28}
                            className="h-7 w-7 rounded-lg border border-zinc-200 bg-white object-cover"
                          />
                          <div className="min-w-0">
                            <p className="truncate text-[13px] font-semibold text-zinc-800">
                              {store.storeName || "Store"}
                            </p>
                            <p className="truncate text-[11px] text-zinc-500">
                              {store.storecode || "-"}
                            </p>
                          </div>
                        </div>

                        <div className="mt-2 flex items-center justify-between gap-2">
                          <div className="flex min-w-0 items-center gap-1">
                            <Image
                              src="/icon-tether.png"
                              alt="USDT"
                              width={12}
                              height={12}
                              className="h-3 w-3 shrink-0"
                            />
                            <span className="truncate font-mono text-[13px] font-semibold text-emerald-600">
                              {Number(store.currentUsdtBalance || 0).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                            </span>
                          </div>

                          <button
                            disabled={isToggling.includes(store.storecode)}
                            className="inline-flex items-center justify-center"
                            title={store?.liveOnAndOff ? "Live On" : "Live Off"}
                            onClick={() => toggleLiveOnAndOff(store.storecode, !store?.liveOnAndOff)}
                          >
                            <Image
                              src={store?.liveOnAndOff ? "/icon-on.png" : "/icon-off.png"}
                              alt={store?.liveOnAndOff ? "Live On" : "Live Off"}
                              width={52}
                              height={18}
                              className={`h-[18px] w-[52px] ${
                                isToggling.includes(store.storecode)
                                  ? "cursor-not-allowed animate-pulse opacity-60"
                                  : ""
                              }`}
                            />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}










    </>

  );


};



CenterConsole.displayName = "CenterConsole";

export default CenterConsole;
