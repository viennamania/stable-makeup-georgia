'use client';

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThirdwebProvider } from "thirdweb/react";

import { Toaster } from "react-hot-toast";

import { useState, useEffect } from "react";


import Script from "next/script";

import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';


//const inter = Inter({ subsets: ["latin"] });

import localFont from "next/font/local";



import Image from "next/image";
import { useRouter }from "next//navigation";



// import components
import StabilityConsole from '@/components/StabilityConsole';

import CenterConsole from '@/components/CenterConsole';


import {
  clientId,
  client,
} from "../../client";



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


import { useSearchParams } from 'next/navigation';


/*
export const metadata: Metadata = {
  title: "WEB3 Starter",
  description:
    "Starter for  WEB3 Wallet.",
};
*/








// params
// { lang: string; center: string; }
export default function RootLayout({
  params,
  children,
}: Readonly<{
  params: { lang: string; center: string; };
  children: React.ReactNode;
}>) {

  const searchParams = useSearchParams();


  const router = useRouter();

  /*
  useEffect(() => {
  
    window.googleTranslateElementInit = () => {
     new window.google.translate.TranslateElement({ pageLanguage: 'en' }, 'google_translate_element');
    };
  
   }, []);
   */




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
              ////walletAddress: address,
            }),
        });

        const data = await response.json();

        //console.log("data", data);

        if (data.result) {

          setStore(data.result);

        } else {
          setStore(null);
        }

        setFetchingStore(false);
    };

    if (!params.center) {
      return;
    }

    fetchData();

  } , [params.center]);



  const [showChain, setShowChain] = useState(false);

  const [showCenter, setShowCenter] = useState(false);

  return (

        <div className="w-full flex flex-col items-center justify-center p-0 bg-gray-100 rounded-lg shadow-md mb-4">


          {/* fixed position left and vertically top */}
          <div className="
          fixed top-2 left-2 z-50 flex flex-col items-start justify-start">

            {/* storeLogo and storeName and storecode */}
            {store && (
              <div className="flex flex-row items-center justify-center">
                {store.storeLogo && (
                  <Image
                    src={store.storeLogo}
                    alt={store.storeName}
                    width={50}
                    height={50}
                    className="
                    w-10 h-10 mr-2
                    rounded-lg object-cover mb-2"
                  />
                )}
                <h1 className="text-2xl font-bold">{store.storeName}</h1>
              </div>
            )}


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
              <CenterConsole />
            </div>
          </div>

            
          {children}

        </div>

  );


}
