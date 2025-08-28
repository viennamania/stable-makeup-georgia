'use client';

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThirdwebProvider } from "thirdweb/react";

import { Toaster } from "react-hot-toast";



import React, { useEffect } from "react";
import Script from "next/script";

import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';


//const inter = Inter({ subsets: ["latin"] });

import localFont from "next/font/local";

import { clientId } from "./client";
import { chain } from "@/app/config/contractAddresses";
import Image from "next/image";


const pretendard = localFont({
  src: "../static/fonts/PretendardVariable.woff2",
  display: "swap",
  weight: "45 920",
  variable: "--font-pretendard",
});



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


  /*
  useEffect(() => {
  
    window.googleTranslateElementInit = () => {
     new window.google.translate.TranslateElement({ pageLanguage: 'en' }, 'google_translate_element');
    };
  
   }, []);
   */


   const [showChain, setShowChain] = React.useState(false);


  return (

    <html lang="kr" className={`${pretendard.variable}`}>

    {/*
    <html lang="en">
    */}



      <head>
        
        {/* Google Translate */}
        {/*}
        <Script
        src="https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"
        ></Script>
        */}

   

        {/* Google Translate CSS */}
        {/*
        <link
        rel="stylesheet"
        type="text/css"
        href="https://www.gstatic.com/_/translate_http/_/ss/k=translate_http.tr.26tY-h6gH9w.L.W.O/am=CAM/d=0/rs=AN8SPfpIXxhebB2A47D9J-MACsXmFF6Vew/m=el_main_css"
        />
        */}


        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>OneClick Stable</title>
        <meta name="description" content="Gate for Crypto OTC." />
        <link rel="icon" href="/favicon.ico" />




      </head>


          {/*
      <body className={inter.className}>
      */}
      <body className={pretendard.className}>



        <ThirdwebProvider>

          <Toaster />

          {/* chain image */}

          <div className="flex flex-col items-center justify-center p-4 bg-gray-100 rounded-lg shadow-md mb-4">

            {/* fixed position vertically top */}
            <div className="fixed top-2 right-2 z-50 flex flex-col items-center justify-center">


              {/* Display the current chain */}
              {/* show and hide button to toggle chain display */}
              {/* button bg is transparent black */}
              <button
                className="
                mb-2 px-4 py-2 bg-black bg-opacity-50 text-white rounded hover:bg-opacity-75"
                onClick={() => setShowChain(!showChain)}
              >
                <div className="flex flex-row items-center justify-center gap-2">

                  <Image
                    src={`/icon-system-stability.gif`}
                    alt={`System Stability`}
                    width={50}
                    height={50}
                  />

                  <span className="text-sm text-white">
                    {showChain ? 'Hide Chain' : 'Show Chain'}
                  </span>

                </div>
              </button>

              <div className={`flex flex-col items-center justify-center
                ${showChain ? 'bg-white' : 'hidden'}
                p-4 rounded-lg shadow-md transition-all duration-300 ease-in-out
              `}>

                {/* Display client ID */}
                <div className="flex flex-col items-center justify-center border-b border-gray-200 pb-4 mb-4">

                  <div className="flex flex-col items-center gap-2">
                    <Image
                      src={`/icon-clientid.png`}
                      alt={`Client logo`}
                      width={50}
                      height={50}
                      className="h-12 w-12 rounded-lg object-cover"
                    />
                    <span className="text-sm text-gray-600">STABILITY ID</span>
                  </div>

                  <div className="flex flex-row items-center gap-2">
                    <Image
                      src={`/icon-stability.png`}
                      alt={`Stability logo`}
                      width={25}
                      height={25}
                      className="h-6 w-6 rounded-full object-cover"
                    />
                    <span className="text-lg font-semibold text-gray-800">
                      {clientId}
                    </span>
                  </div>

                </div>

                {/* horizontally listing all chain */}
                {/* Ethereum, Polygon, BSC, Arbitrum */}
                {/* and delected chain is current chaing */}


                <div className="flex flex-col items-center justify-center gap-4 border-b border-gray-200 pb-4 mb-4">

                  {/* current chain */}
                  <div className="flex flex-col items-center justify-center">
                    <Image
                      src={`/icon-blockchain.png`}
                      alt={`Current Chain`}
                      width={50}
                      height={50}
                      className="h-12 w-12 rounded-lg object-cover"
                    />
                    <span className="text-sm text-gray-600">BLOCKCHAIN ID</span>
                  </div>

                  <div className="flex flex-row items-center justify-center gap-4 mb-4">
                    
                    <div className={`
                      w-24 h-24
                      flex flex-col items-center justify-center gap-1 ${chain === 'ethereum' ? 'border-2 border-blue-500 p-2 rounded' : ''}
                      hover:bg-blue-500 hover:text-white transition-colors duration-200`}>
                      <Image
                        src={`/logo-chain-ethereum.png`}
                        alt={`Chain logo for Ethereum`}
                        width={25}
                        height={25}
                        className="h-6 w-6 rounded-full"
                        style={{ objectFit: "cover" }}
                      />
                      <span className={`
                        ${chain === 'ethereum' ? 'text-blue-500' : 'text-gray-600'}
                        hover:text-blue-500
                      `}>
                        Ethereum
                      </span>
                    </div>

                    <div className={`
                      w-24 h-24
                      flex flex-col items-center justify-center gap-1 ${chain === 'polygon' ? 'border-2 border-blue-500 p-2 rounded' : ''}
                      hover:bg-blue-500 hover:text-white transition-colors duration-200`}>
                      <Image
                        src={`/logo-chain-polygon.png`}
                        alt={`Chain logo for Polygon`}
                        width={25}
                        height={25}
                        className="h-6 w-6 rounded-full"
                        style={{ objectFit: "cover" }}
                      />
                      <span className={`
                        ${chain === 'polygon' ? 'text-blue-500' : 'text-gray-600'}
                        hover:text-blue-500
                      `}>
                        Polygon
                      </span>
                    </div>

                    <div className={`
                      w-24 h-24
                      flex flex-col items-center justify-center gap-1 ${chain === 'bsc' ? 'border-2 border-blue-500 p-2 rounded' : ''}
                      hover:bg-blue-500 hover:text-white transition-colors duration-200`}>
                      <Image
                        src={`/logo-chain-bsc.png`}
                        alt={`Chain logo for BSC`}
                        width={25}
                        height={25}
                        className="h-6 w-6 rounded-full"
                        style={{ objectFit: "cover" }}
                      />
                      <span className={`
                        ${chain === 'bsc' ? 'text-blue-500' : 'text-gray-600'}
                        hover:text-blue-500
                      `}>
                        BSC
                      </span>
                    </div>

                    <div className={`
                      w-24 h-24
                      flex flex-col items-center justify-center gap-1 ${chain === 'arbitrum' ? 'border-2 border-blue-500 p-2 rounded' : ''}
                      hover:bg-blue-500 hover:text-white transition-colors duration-200`}>
                      <Image
                        src={`/logo-chain-arbitrum.png`}
                        alt={`Chain logo for Arbitrum`}
                        width={25}
                        height={25}
                        className="h-6 w-6 rounded-full"
                        style={{ objectFit: "cover" }}
                      />
                      <span className={`
                        ${chain === 'arbitrum' ? 'text-blue-500' : 'text-gray-600'}
                        hover:text-blue-500
                      `}>
                        Arbitrum
                      </span>
                    </div>


                  </div>


                </div>











                {/* Display the current chain name */}
                {/* Use the chain variable to determine which chain is currently selected */}
                {/* Assuming you have a variable named 'chain' that holds the current chain name */}
                {/*
                <h1 className="text-lg font-semibold text-gray-800 mb-2">
                  Current Chain
                </h1>
                */}
                {/* Display the chain logo */}
                {/* Use the chain variable to determine which logo to display */}
                {/* Assuming you have images named logo-chain-ethereum.png, logo-chain-polygon.png, etc. in the public directory */}
                {/* Adjust the path as necessary based on your project structure */}



                {/*
                <Image
                  src={`/logo-chain-${chain}.png`}
                  alt={`Chain logo for ${chain}`}
                  width={48}
                  height={48}
                  className="h-12 w-12 rounded-full"
                  style={{ objectFit: "cover" }}
                />
                <span className="text-sm text-gray-600">
                  {
                  chain &&
                  chain.charAt(0).toUpperCase() + chain.slice(1)
                  }
                </span>
                */}


              </div>

            </div>
            
          {children}

          </div>

          <Analytics />
          <SpeedInsights />

        </ThirdwebProvider>

      </body>
    </html>
  );


}
