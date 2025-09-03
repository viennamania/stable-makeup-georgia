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



const StabilityConsole = () => {

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




  return (

    <div className="flex flex-col items-center justify-center p-4 bg-gray-100 rounded-lg shadow-md mb-4">



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




      {/* address balance */}
      <div className="flex flex-col gap-2 justify-between items-center">

        {address ? (

          <>
            <div className="flex flex-row gap-2 justify-center items-center">


              <div className="flex flex-row gap-2 justify-center items-center">
                {/* dot */}
                <div className="w-2 h-2 bg-zinc-600 rounded-full"></div>
                <span className="text-sm text-zinc-600">
                  내 지갑주소
                </span>
              </div>

              <Image
                src="/icon-shield.png"
                alt="Shield"
                width={25}
                height={25}
              />
              <button
                className="text-lg text-zinc-800 underline"
                onClick={() => {
                  navigator.clipboard.writeText(address);
                  //toast.success(Copied_Wallet_Address);
                } }
              >
                {address.substring(0, 6)}...{address.substring(address.length - 4)}
              </button>


            </div>
      



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
                  내 테더 잔액(USDT)
                </span>
              </div>

              <div className="
              w-40 flex flex-col items-end justify-center
              text-xl font-semibold text-[#409192]"
              style={{ fontFamily: "monospace" }}
              >
                {Number(balance).toFixed(3).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
              </div>


              {/*
              <button
                disabled={!address}
                onClick={() => {
                  // redirect to send USDT page
                  router.push(
                    "/kr/admin/withdraw-usdt"
                  );

                }}
                className="w-full flex items-center justify-center
                bg-[#3167b4]
                text-white px-4 py-2 rounded-lg hover:bg-blue-600"
              >
                <span className="text-sm text-gray-100">
                  출금하기
                </span>
                <Image
                  src="/icon-share.png"
                  alt="Withdraw USDT"
                  width={20}
                  height={20}
                  className="ml-2"
                />

              </button>
              */}

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
                가스보유량({chain === "ethereum" ? "ETH" :
                chain === "polygon" ? "POL" :
                chain === "arbitrum" ? "ETH" :
                chain === "bsc" ? "BNB" : ""})
              </span>
              <div className="text-xl font-semibold text-zinc-800"
                style={{ fontFamily: "monospace" }}
              >
                {Number(nativeBalance).toFixed(8)}
              </div>
            </div>

            <div className="flex flex-row gap-2 justify-center items-center">
              {/* if pol balance is 0, comment out the text */}
              {nativeBalance < 0.0001 && (
                <p className="text-sm text-red-500">
                  가스비용이 부족합니다.<br/>가스비용이 부족하면 입금은 가능하지만 출금은 불가능합니다.
                </p>
              )}
            </div>

          </>

        ) : (

          <div className="mt-5 flex flex-row gap-2 justify-center items-center">
            {/* 로그인하고 나의 자산을 확인하세요 */}
            <span className="text-sm text-zinc-600">
              로그인하고 나의 지갑주소에서 자산을 확인하세요
            </span>






          </div>

        )}

      </div>


    </div>

  );


};



StabilityConsole.displayName = "StabilityConsole";

export default StabilityConsole;