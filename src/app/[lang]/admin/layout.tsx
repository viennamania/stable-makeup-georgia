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





/*
export const metadata: Metadata = {
  title: "WEB3 Starter",
  description:
    "Starter for  WEB3 Wallet.",
};
*/






export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  const router = useRouter();

  /*
  useEffect(() => {
  
    window.googleTranslateElementInit = () => {
     new window.google.translate.TranslateElement({ pageLanguage: 'en' }, 'google_translate_element');
    };
  
   }, []);
   */


  const [showChain, setShowChain] = useState(false);

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
              setStores(data.result.stores || []);
              setTotalCurrentUsdtBalance(data.result.totalCurrentUsdtBalance || 0);
          }



      };

      fetchStores();

      // poll every 10 seconds
      const interval = setInterval(() => {
        fetchStores();
      }, 10000);

      return () => clearInterval(interval);
  }, []);

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
          currentUsdtBalance: 2098.3850755020003
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
          currentUsdtBalance: 2098.3850755020003
        },
      ],
      totalCurrentUsdtBalance: 4196.7701510040006
    }
  */



  return (

        <div className="w-full flex flex-col items-center justify-center pt-20 bg-gray-100 rounded-lg shadow-md mb-4">

            {/* fixed position left and vertically top */}
            <div className="
            fixed top-2 left-2 z-50 flex flex-col items-start justify-start gap-2
            ">

              <div className="flex flex-row items-center justify-center
                bg-white bg-opacity-90
                p-2 rounded-lg shadow-lg
              ">
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
              </div>

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

            {/* fixed position top and horizontally center */}
            {/* horizontal list of stores */}
            <div className="
            fixed top-2 left-1/2 transform -translate-x-1/2 z-50 flex flex-col items-center justify-center gap-2
            ">

              {stores.length > 0 && (
                <div className="flex flex-row items-center justify-center gap-2
                  bg-white bg-opacity-90
                  p-2 rounded-lg shadow-lg
                ">

                  {/* totalCurrentUsdtBalance */}
                  <div className="
                  w-28 h-20 flex flex-col items-start justify-between
                  bg-gray-100 p-2 rounded-lg shadow-md mr-4
                  ">
                    <p className="text-xs text-gray-800 font-bold mb-1">Total USDT</p>

                    {/* monospaced font for amount */}
                    
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
                      className="flex flex-col items-start justify-between
                      bg-gray-100 p-2 rounded-lg shadow-md
                      w-24 h-20
                      "
                    >
                      {/* store logo and name */}
                      {/* horizontal flexbox */}
                      {/* gap between logo and name */}
                      {/* fixed width for logo and name */}
                      {/* if store logo is not available, use default logo */}
                      {/* if store name is not available, use 'Store' */}
                      {/* amount in monospaced font */}
                      {/* if amount is not available, use 0.00 */}
                      {/* amount with 2 decimal places */}
                      {/* amount with comma as thousand separator */}
                      {/* e.g. 1,234.56 */}
                      {/* if amount is null or undefined, show 0.00 */}
                      {/* if amount is negative, show in red color */}
                      {/* if amount is positive, show in green color */}

                      <div className="w-full flex flex-row items-center justify-between mb-1">
                        <Image
                          src={store.storeLogo || "/icon-store.png"}
                          alt={store.storeName}
                          width={15}
                          height={15}
                          className="rounded-lg bg-white w-6 h-6"
                        />
                        <p className="text-xs text-gray-800 font-bold">
                          {store.storeName.length > 5 ? store.storeName.substring(0, 5) + '...' : store.storeName || 'Store'}
                        </p>
                      </div>

                      {/* monospaced font for amount */}
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
                    </div>
                  ))}



                </div>
              )}

            </div>


            
          {children}

        </div>

  );


}
