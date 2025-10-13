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

import StoreConsole from '@/components/StoreConsole';


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


import {
  ConnectButton,
  useActiveAccount,
  AutoConnect,
} from "thirdweb/react";


import {
  inAppWallet,
} from "thirdweb/wallets";

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

];



/*
export const metadata: Metadata = {
  title: "WEB3 Starter",
  description:
    "Starter for  WEB3 Wallet.",
};
*/


const wallet = inAppWallet({
	smartAccount: {
		sponsorGas: false,
		chain: chain === "bsc" ? bsc : chain === "polygon" ? polygon : chain === "arbitrum" ? arbitrum : ethereum,
	}
});



export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  const router = useRouter();

  const activeAccount = useActiveAccount();

  const address = activeAccount?.address;

  console.log("address", address);


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


  /*

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

          // setIsAdmin(data.result?.role === "admin");
          setIsAdmin(data.result?.isAdmin === true);


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
              setStores(data.result.stores || []);
              setTotalCurrentUsdtBalance(data.result.totalCurrentUsdtBalance || 0);
          }



      };

      address && fetchStores();

      // poll every 10 seconds
      const interval = setInterval(() => {
        address && fetchStores();
      }, 10000);

      return () => clearInterval(interval);

  }, [address]);
  */



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


  /*
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

    if (data.result) {
      
      // Update the store's liveOnAndOff status in the local state
      setStores((prevStores => 
        prevStores.map(store => 
          store.storecode === storecode ? { ...store, liveOnAndOff } : store
        )
      ));

    }


    setIsToggling((prev) => prev.filter(code => code !== storecode));

  };

  */

  



  return (

    <div className="w-full flex flex-col items-center justify-center pt-24 bg-gray-100 rounded-lg shadow-md mb-4">

      {/*
      <AutoConnect
          client={client}
          wallets={[wallet]}
      />
      */}

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

      <StoreConsole />
            
      {children}

    </div>

  );


}
