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


   const [showChain, setShowChain] = React.useState(true);


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
        <title>OneClick USDT</title>
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
            {/* Display the current chain */}
            {/* show and hide button to toggle chain display */}
  
            <button
              className="mb-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              onClick={() => setShowChain(!showChain)}
            >
              {showChain ? 'Hide Chain' : 'Show Chain'}
            </button>

            <div className={`flex flex-col items-center justify-center ${showChain ? 'block' : 'hidden'}`}>
              {/* Display client ID */}
              <div className="flex flex-row items-center gap-2 mb-4">
                <span className="text-sm text-gray-600">Client ID:</span>
                <span className="text-sm font-semibold text-gray-800">
                  {clientId}
                </span>
              </div>

              {/* Display the current chain name */}
              {/* Use the chain variable to determine which chain is currently selected */}
              {/* Assuming you have a variable named 'chain' that holds the current chain name */}
              <h1 className="text-lg font-semibold text-gray-800 mb-2">
                Current Chain
              </h1>
              {/* Display the chain logo */}
              {/* Use the chain variable to determine which logo to display */}
              {/* Assuming you have images named logo-chain-ethereum.png, logo-chain-polygon.png, etc. in the public directory */}
              {/* Adjust the path as necessary based on your project structure */}

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
