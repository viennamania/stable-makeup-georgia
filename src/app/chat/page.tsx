'use client';

import { toast } from 'react-hot-toast';


import { client } from "../client";

import {
  ConnectButton,
  useActiveWallet,
  
} from "thirdweb/react";

import {
  inAppWallet,
  createWallet,
} from "thirdweb/wallets";

import { polygon, arbitrum } from "thirdweb/chains";

import { balanceOf, transfer } from "thirdweb/extensions/erc20";
 

import { useSearchParams } from 'next/navigation'

import Image from 'next/image';

// parameters for dynamic import
// userId parameter is required

/*
const DynamicAppWithNoSSR = dynamic(() => import("../../components/Chat"), {
  ssr: false,
  loading: () => <p>...</p>
});
*/

/*
const DynamicAppWithNoSSR = dynamic(() => import("../../components/Chat"), {

  ssr: false,

  loading: (

  ) => <p>...</p>

});
*/



import React, { useEffect, useState, Suspense } from 'react';
import { add } from 'thirdweb/extensions/farcaster/keyGateway';

// /chat?tradeId=
// get parameter from url






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



export default function ChatPage() {


  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ChatPageContent />
    </Suspense>
  );
}


function ChatPageContent() {
  
  const searchParams = useSearchParams()

  
  //const storecode = searchParams.get('storecode')

 
  const channel = searchParams.get('channel')
 

  console.log("ChatPageContent channel", channel);







  // get the active wallet
  const activeWallet = useActiveWallet();


  //console.log("activeWallet", activeWallet);

  console.log("activeWallet", activeWallet);


  // get wallet address

  const address = activeWallet?.getAccount()?.address;
  


  console.log('address', address);

  const [balance, setBalance] = useState(0);

  /*
  useEffect(() => {

    if (!address) return;
    // get the balance
    const getBalance = async () => {
      const result = await balanceOf({
        contract,
        address: address,
      });
  
      //console.log(result);
  
      setBalance( Number(result) / 10 ** 6 );

    };

    if (address) getBalance();

    const interval = setInterval(() => {
      if (address) getBalance();
    } , 5000);

    return () => clearInterval(interval);

  } , [address]);
  */


      

  const [nickname, setNickname] = useState("");
  const [avatar, setAvatar] = useState("/profile-default.png");
  const [userCode, setUserCode] = useState("");


  const [user, setUser] = useState<any>(null);


  const [seller, setSeller] = useState(null) as any;


  useEffect(() => {
      const fetchData = async () => {
          const response = await fetch("/api/user/getUser", {
              method: "POST",
              headers: {
                  "Content-Type": "application/json",
              },
              body: JSON.stringify({
                storecode: "admin", // storecode,
                walletAddress: address,
              }),
          });

          const data = await response.json();

          //console.log("data", data);

          if (data.result) {
              setNickname(data.result.nickname);
              data.result.avatar && setAvatar(data.result.avatar);
              setUserCode(data.result.id);

              setUser(data.result);

              setSeller(data.result.seller);

          }
      };

      if (address )  // only fetch data if address and storecode are available
        fetchData();

  }, [address]);






  return (

      <main className="p-4 pb-10 min-h-[100vh] flex items-start justify-center container max-w-screen-sm mx-auto">



        <div className="py-20 w-full h-full">
  
          <div className="w-full flex flex-row items-center justify-between gap-2 mb-4"
          >
              {/* go back button */}
              <div className="flex justify-start items-center gap-2">
                  <button
                      onClick={() => window.history.back()}
                      className="flex items-center justify-center
                      p-2 bg-zinc-100 hover:bg-zinc-200 rounded-lg transition-colors duration-200"
                  >
                      <div className='flex flex-row items-center justify-center gap-2'>
                          <Image
                              src="/icon-back.png"
                              alt="Back"
                              width={20}
                              height={20}
                              className="rounded-full"
                          />
                          <span className="text-sm text-gray-500 font-semibold">
                              돌아가기
                          </span>
                      </div>
                  </button>
              </div>

              {!address && (
                <ConnectButton
                  client={client}
                  wallets={wallets}

                  /*
                  accountAbstraction={{
                    chain: arbitrum,
                    sponsorGas: true
                  }}
                  */
                  
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


              {address && (
                  <div className="hidden w-full flex-col items-end justify-center gap-2">

                      <div className="flex flex-row items-center justify-center gap-2">

                          <button
                              className="text-lg text-zinc-600 underline"
                              onClick={() => {
                                  navigator.clipboard.writeText(address);
                                  toast.success('주소가 클립보드에 복사되었습니다.', {
                                      duration: 2000,
                                      position: 'top-center',
                                      style: { background: '#f3f4f6', color: '#111827' },
                                      iconTheme: {
                                          primary: '#4ade80', // green-400
                                          secondary: '#111827', // gray-900
                                      },
                                  });
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

                      <div className="flex flex-row items-center justify-end  gap-2">
                          <span className="text-2xl xl:text-4xl font-semibold text-[#409192]">
                              {Number(balance).toFixed(2)}
                          </span>
                          {' '}
                          <span className="text-sm">USDT</span>
                      </div>

                  </div>
              )}

          </div>







            {/*true && (


                <Session
                    appId="tPgv5UF1"
                    userId="sample_user_alice"
                >


                    <Chatbox
                        conversationId="sample_conversation"
                        style={{ width: "100%", height: "800px" }}
                    />

                </Session>




            )*/}

        </div>

    </main>


  );
}