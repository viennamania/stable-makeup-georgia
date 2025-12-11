// nickname settings
'use client';
import React, { use, useEffect, useState } from 'react';



import { toast } from 'react-hot-toast';

import { client } from "../../../client";

import {
    getContract,
    sendAndConfirmTransaction,
} from "thirdweb";



import {
    polygon,
    arbitrum,
} from "thirdweb/chains";

import {
    ConnectButton,
    useActiveAccount,
    useActiveWallet,

    useConnectedWallets,
    useSetActiveWallet,
} from "thirdweb/react";


import {
  inAppWallet,
  createWallet,
} from "thirdweb/wallets";

import { getUserPhoneNumber } from "thirdweb/wallets/in-app";


import Image from 'next/image';

import GearSetupIcon from "@/components/gearSetupIcon";


//import Uploader from '@/components/uploader';

import { balanceOf, transfer } from "thirdweb/extensions/erc20";
 

import AppBarComponent from "@/components/Appbar/AppBar";
import { getDictionary } from "../../../dictionaries";


import Uploader from '@/components/uploader-client';



const storecode = "admin";



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




import {
    useRouter,
    useSearchParams,
} from "next//navigation";





export default function SettingsPage({ params }: any) {


    //console.log("params", params);
    
    const searchParams = useSearchParams();
 
    ///const wallet = searchParams.get('wallet');




    const contract = getContract({
        // the client you have created via `createThirdwebClient()`
        client,
        // the chain the contract is deployed on 
        
        chain: arbitrum,

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
        Please_connect_your_wallet_first: "",

        Wallet_Settings: "",
        Profile_Settings: "",

        Profile: "",
        My_Profile_Picture: "",
  
        Edit: "",


        Cancel: "",
        Save: "",
        Enter_your_nickname: "",
        Nickname_should_be_5_10_characters: "",

        Seller: "",
        Not_a_seller: "",
        Apply: "",
        Applying: "",
        Enter_your_bank_name: "",
        Enter_your_account_number: "",
        Enter_your_account_holder: "",
        Send_OTP: "",
        Enter_OTP: "",
        Verify_OTP: "",
        OTP_verified: "",

        Nickname_should_be_alphanumeric_lowercase: "",
        Nickname_should_be_at_least_5_characters_and_at_most_10_characters: "",

        Copied_Wallet_Address: "",

        Escrow: "",

        Make_Escrow_Wallet: "",

        Escrow_Wallet_Address_has_been_created: "",
        Failed_to_create_Escrow_Wallet_Address: "",
  
    
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
        Please_connect_your_wallet_first,

        Wallet_Settings,
        Profile_Settings,

        Profile,
        My_Profile_Picture,
  
        Edit,

        Cancel,
        Save,
        Enter_your_nickname,
        Nickname_should_be_5_10_characters,

        Seller,
        Not_a_seller,
        Apply,
        Applying,
        Enter_your_bank_name,
        Enter_your_account_number,
        Enter_your_account_holder,
        Send_OTP,
        Enter_OTP,
        Verify_OTP,
        OTP_verified,

        Nickname_should_be_alphanumeric_lowercase,
        Nickname_should_be_at_least_5_characters_and_at_most_10_characters,

        Copied_Wallet_Address,

        Escrow,

        Make_Escrow_Wallet,

        Escrow_Wallet_Address_has_been_created,
        Failed_to_create_Escrow_Wallet_Address,

    } = data;
    
    



    const router = useRouter();



  // get the active wallet
  const activeWallet = useActiveWallet();

  const setActiveAccount = useSetActiveWallet();
 
  const connectWallets = useConnectedWallets();

  //console.log('connectWallets', connectWallets);

  const smartConnectWallet = connectWallets?.[0];
  const inAppConnectWallet = connectWallets?.[1];






    const smartAccount = useActiveAccount();

    const address = smartAccount?.address;

      
 

    const [phoneNumber, setPhoneNumber] = useState("");

    useEffect(() => {
  
  
      if (smartAccount) {
  
        //const phoneNumber = await getUserPhoneNumber({ client });
        //setPhoneNumber(phoneNumber);
  
  
        getUserPhoneNumber({ client }).then((phoneNumber) => {
          setPhoneNumber(phoneNumber || "");
        });
  
  
  
      }
  
    } , [smartAccount]);




    const [user, setUser] = useState(null) as any;

    const [loadingUser, setLoadingUser] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            
            setLoadingUser(true);

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


            if (data.result) {
                setUser(data.result);

            } else {
                setUser(null);
            }
            setLoadingUser(false);

        };

        address && fetchData();

    }, [address]);




    const [chain, setChain] = useState("ethereum");

    const [clientName, setClientName] = useState("");
    const [clientDescription, setClientDescription] = useState("");

    // exchange rate USDT to USD
    // exchange rate USDT to KRW
    // exchange roate USDT to JPY
    // exchange rate USDT to CNY
    // exchange rate USDT to EUR
    const [exchangeRateUSDT, setExchangeRateUSDT] = useState({
        USD: 0,
        KRW: 0,
        JPY: 0,
        CNY: 0,
        EUR: 0,
    });

    const [exchangeRateUSDTSell, setExchangeRateUSDTSell] = useState({
        USD: 0,
        KRW: 0,
        JPY: 0,
        CNY: 0,
        EUR: 0,
    });


    // /api/client/getClientInfo
    const [clientId, setClientId] = useState("");
    const [clientInfo, setClientInfo] = useState<any>(null);

    // payactionViewOn
    const [payactionViewOn, setPayactionViewOn] = useState(false);

    useEffect(() => {
        const fetchClientInfo = async () => {
            const response = await fetch("/api/client/getClientInfo", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
            });

            const data = await response.json();

            ///console.log("clientInfo", data);

            if (data.result) {

                setChain(data.result.chain || "ethereum");

                setClientId(data.result.clientId || "");

                setClientInfo(data.result.clientInfo);

                setClientName(data.result.clientInfo?.name || "");
                setClientDescription(data.result.clientInfo?.description || "");

                setExchangeRateUSDT(data.result.clientInfo?.exchangeRateUSDT || {
                    USD: 0,
                    KRW: 0,
                    JPY: 0,
                    CNY: 0,
                    EUR: 0,
                });

                setExchangeRateUSDTSell(data.result.clientInfo?.exchangeRateUSDTSell || {
                    USD: 0,
                    KRW: 0,
                    JPY: 0,
                    CNY: 0,
                    EUR: 0,
                });

                setPayactionViewOn(data.result.clientInfo?.payactionViewOn || false);
            }

        };

        fetchClientInfo();
    }, []);






    // /api/client/setClientInfo

    const [updatingClientInfo, setUpdatingClientInfo] = useState(false);

    const updateClientInfo = async () => {
        if (updatingClientInfo) {
            return;
        }
        
        setUpdatingClientInfo(true);
        const response = await fetch("/api/client/setClientInfo", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                data: {
                    name: clientName,
                    description: clientDescription,

                    exchangeRateUSDT: exchangeRateUSDT,
                    exchangeRateUSDTSell: exchangeRateUSDTSell,
                }
            }),
        });

        const data = await response.json();

        //console.log("setClientInfo", data);

        if (data.result) {
            setClientInfo({
                ...clientInfo,
                name: clientName,
                description: clientDescription,
                exchangeRateUSDT: exchangeRateUSDT,
                exchangeRateUSDTSell: exchangeRateUSDTSell,
            });
            toast.success('Client info updated');
        } else {
            toast.error('Failed to update client info');
        }

        setUpdatingClientInfo(false);
    };



    // /api/client/updatePayactionViewOn
    const [updatingPayactionViewOn, setUpdatingPayactionViewOn] = useState(false);
    const updatePayactionViewOn = async (value: boolean) => {
        if (updatingPayactionViewOn) {
            return;
        }
        setUpdatingPayactionViewOn(true);
        const response = await fetch("/api/client/updatePayactionViewOn", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                payactionViewOn: value,
            }),
        });
        const data = await response.json();
        if (data.result) {
            setPayactionViewOn(value);
        }
        setUpdatingPayactionViewOn(false);
    };




    // /api/client/getAllServerWallets
    const [serverWallets, setServerWallets] = useState<any[]>([]);
    useEffect(() => {
        const fetchServerWallets = async () => {
            const response = await fetch("/api/client/getAllServerWallets", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
            });
            const data = await response.json();
            if (data.result) {
                setServerWallets(data.result);
            }
        };
        fetchServerWallets();
    }, []);



    // serverWalletTransfer
    const [serverWalletTransferring, setServerWalletTransferring] = useState(false);
    const serverWalletTransfer = async () => {
        if (serverWalletTransferring) {
            return;
        }
        setServerWalletTransferring(true);
        const response = await fetch("/api/client/serverWalletTransfer", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
            }),
        });
        const data = await response.json();
        if (data.result) {
            toast.success("Transfer successful");
        } else {
            toast.error("Transfer failed");
        }
        setServerWalletTransferring(false);
    };



    return (

        <main className="p-4 min-h-[100vh] flex items-start justify-center container max-w-screen-sm mx-auto">

            <div className="py-0 w-full">
        

                <div className="w-full flex flex-row gap-2 items-center justify-start text-zinc-500 text-lg"
                >
                    {/* go back button */}
                    <div className="w-full flex justify-start items-center gap-2">
                        <button
                            onClick={() => window.history.back()}
                            className="flex items-center justify-center bg-gray-200 rounded-lg p-2
                            hover:bg-gray-300 transition duration-200 ease-in-out"
                        >
                            <Image
                                src="/icon-back.png"
                                alt="Back"
                                width={20}
                                height={20}
                                className="rounded-full"
                            />
                            <span className="ml-2 text-sm text-gray-500 font-semibold">
                                돌아가기
                            </span>
                        </button>

                    </div>

                    {loadingUser && (
                        <div className="w-full flex flex-row items-center justify-end gap-1">
                            <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse" />
                            <div className="w-20 h-6 bg-gray-200 rounded-lg animate-pulse" />
                        </div>
                    )}

                    {address && !loadingUser && (
                        <div className="w-full flex flex-row items-center justify-end gap-1">
                            <Image
                                src={user?.avatar || "/icon-user.png"}
                                alt="User Avatar"
                                width={30}
                                height={30}
                                className="w-8 h-8 rounded-full"
                            />
                            <span className="text-lg text-gray-500 font-semibold">
                            {user?.nickname || "프로필"}
                            </span>
                        </div>
                    )}

                </div>



                <div className="mt-5 flex flex-col items-start justify-center space-y-4">

                    <div className='flex flex-row items-center space-x-4'>
                        <Image
                            src={"/icon-gear.png"}
                            alt="Settings"
                            width={20}
                            height={20}
                            className="rounded-full"
                        />
                        <div className="text-xl font-semibold">
                            센터 설정
                        </div>

                    </div>


                    {/* clientInfo */}
                    {true ? (
                        <div className="
                            mt-4
                            w-full flex flex-col items-start justify-start gap-4">

                            {/* CLIENTID */}
                            <div className="w-full flex flex-col items-start justify-start gap-2
                            border-b border-gray-200 pb-4">
                                <div className='flex flex-row items-center justify-start gap-2'>
                                    <Image
                                        src={`/icon-dot-green.png`}
                                        alt={`Dot icon`}
                                        width={10}
                                        height={10}
                                        className="h-2.5 w-2.5"
                                    />
                                    <span className="text-sm text-gray-500 font-semibold">
                                        CLIENTID
                                    </span>
                                </div>
                                <span className="text-sm text-gray-500">
                                    {clientId || 'Loading...'}
                                </span>
                            </div>


                            <div className="w-full flex flex-col items-start justify-start gap-2
                            border-b border-gray-200 pb-4">
                                <div className='flex flex-row items-center justify-start gap-2'>
                                    <Image
                                        src={`/icon-dot-green.png`}
                                        alt={`Dot icon`}
                                        width={10}
                                        height={10}
                                        className="h-2.5 w-2.5"
                                    />
                                    <span className="text-sm text-gray-500 font-semibold">
                                        현재 체인
                                    </span>
                                </div>

                                <div className="flex flex-row items-center justify-center gap-4 mb-4">
                                    
                                    <div className={`
                                    w-20 h-20
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
                                    w-20 h-20
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
                                    w-20 h-20
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
                                    w-20 h-20
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



                            {/* 센터 로고 */}
                            <div className="w-full flex flex-col items-start justify-start gap-2
                            border-b border-gray-200 pb-4">
                                <div className='flex flex-row items-center justify-start gap-2'>
                                    <Image
                                        src={`/icon-dot-green.png`}
                                        alt={`Dot icon`}
                                        width={10}
                                        height={10}
                                        className="h-2.5 w-2.5"
                                    />
                                    <span className="text-sm text-gray-500 font-semibold">
                                        센터 로고
                                    </span>
                                </div>
                                <Uploader
                                    lang={params.lang}
                                />
                            </div>


                            <div className="w-full flex flex-col items-start justify-start gap-2
                                background-gray-50 p-4 rounded-lg border border-gray-500">

                                {/* 센터 정보 변경 */}
                                <div className='flex flex-row items-center justify-start gap-2 mb-4
                                border-b border-gray-200 pb-2'>
                                    <Image
                                        src={`/icon-dot-green.png`}
                                        alt={`Dot icon`}
                                        width={10}
                                        height={10}
                                        className="h-2.5 w-2.5"
                                    />
                                    <span className="text-lg text-gray-500 font-semibold">
                                        센터 정보 변경
                                    </span>
                                </div>

                                <div className="w-full flex flex-col items-start justify-start gap-2
                                border-b border-gray-200 pb-4">
                                    <div className='flex flex-row items-center justify-start gap-2'>
                                        <Image
                                            src={`/icon-dot-green.png`}
                                            alt={`Dot icon`}
                                            width={10}
                                            height={10}
                                            className="h-2.5 w-2.5"
                                        />
                                        <span className="text-sm text-gray-500 font-semibold">
                                            센터 이름
                                        </span>
                                    </div>
                                    <input
                                        type="text"
                                        value={clientName}
                                        onChange={(e) => setClientName(e.target.value)}
                                        className="w-full p-2 border border-gray-300 rounded-lg"
                                        placeholder="센터 이름"
                                    />
                                </div>

                                <div className="w-full flex flex-col items-start justify-start gap-2
                                border-b border-gray-200 pb-4">
                                    <div className='flex flex-row items-center justify-start gap-2'>
                                        <Image
                                            src={`/icon-dot-green.png`}
                                            alt={`Dot icon`}
                                            width={10}
                                            height={10}
                                            className="h-2.5 w-2.5"
                                        />
                                        <span className="text-sm text-gray-500 font-semibold">
                                            센터 소개
                                        </span>
                                    </div>
                                    <textarea
                                        value={clientDescription}
                                        rows={4}
                                        onChange={(e) => setClientDescription(e.target.value)}
                                        className="w-full p-2 border border-gray-300 rounded-lg"
                                        placeholder="센터 소개"
                                    />
                                </div>

                                {/*
                                <div className="w-full flex flex-col items-start justify-start space-y-2">
                                    <span className="text-sm text-gray-500 font-semibold">
                                        센터 로고
                                    </span>
                                    <Uploader
                                        value={clientInfo.logo || ''}
                                        onChange={(value) => updateClientInfo({ logo: value })}
                                    />
                                </div>
                                */}


                                {/* exchange rate USDT */}
                                <div className="w-full flex flex-col items-start justify-start gap-2
                                border-b border-gray-200 pb-4">
                                    <div className='flex flex-row items-center justify-start gap-2'>
                                        <Image
                                            src={`/icon-dot-green.png`}
                                            alt={`Dot icon`}
                                            width={10}
                                            height={10}
                                            className="h-2.5 w-2.5"
                                        />
                                        <span className="text-sm text-gray-500 font-semibold">
                                            환율(살때) (USDT to ...)
                                        </span>
                                    </div>

                                    <div className="w-full grid grid-cols-5 gap-4">

                                        <div className="flex flex-col items-start justify-start space-y-1">
                                            <span className="text-sm text-gray-500">
                                                USD
                                            </span>
                                            <input
                                                type="text"
                                                value={exchangeRateUSDT.USD}
                                                onChange={(e) => {
                                                    // check number character only
                                                    if (!/^\d*\.?\d*$/.test(e.target.value)) {
                                                        return;
                                                    }

                                                    setExchangeRateUSDT({ ...exchangeRateUSDT, USD: Number(e.target.value) })
                                                }}
                                                className="w-full p-2 border border-gray-300 rounded-lg"
                                            />
                                        </div>

                                        <div className="flex flex-col items-start justify-start space-y-1">
                                            <span className="text-sm text-gray-500">
                                                KRW
                                            </span>
                                            <input
                                                type="text"
                                                value={exchangeRateUSDT.KRW}
                                                onChange={(e) => {
                                                    // check number character only
                                                    if (!/^\d*\.?\d*$/.test(e.target.value)) {
                                                        return;
                                                    }

                                                    setExchangeRateUSDT({ ...exchangeRateUSDT, KRW: Number(e.target.value) })
                                                }}
                                                className="w-full p-2 border border-gray-300 rounded-lg"
                                            />
                                        </div>

                                        <div className="flex flex-col items-start justify-start space-y-1">
                                            <span className="text-sm text-gray-500">
                                                JPY
                                            </span>
                                            <input
                                                type="text"
                                                value={exchangeRateUSDT.JPY}
                                                onChange={(e) => {
                                                    // check number character only
                                                    if (!/^\d*\.?\d*$/.test(e.target.value)) {
                                                        return;
                                                    }

                                                    setExchangeRateUSDT({ ...exchangeRateUSDT, JPY: Number(e.target.value) })
                                                }}
                                                className="w-full p-2 border border-gray-300 rounded-lg"
                                            />
                                        </div>

                                        <div className="flex flex-col items-start justify-start space-y-1">
                                            <span className="text-sm text-gray-500">
                                                CNY
                                            </span>
                                            <input
                                                type="text"
                                                value={exchangeRateUSDT.CNY}
                                                onChange={(e) => {
                                                    // check number character only
                                                    if (!/^\d*\.?\d*$/.test(e.target.value)) {
                                                        return;
                                                    }

                                                    setExchangeRateUSDT({ ...exchangeRateUSDT, CNY: Number(e.target.value) })
                                                }}
                                                className="w-full p-2 border border-gray-300 rounded-lg"
                                            />
                                        </div>

                                        <div className="flex flex-col items-start justify-start space-y-1">
                                            <span className="text-sm text-gray-500">
                                                EUR
                                            </span>
                                            <input
                                                type="text"
                                                value={exchangeRateUSDT.EUR}
                                                onChange={(e) => {
                                                    // check number character only
                                                    if (!/^\d*\.?\d*$/.test(e.target.value)) {
                                                        return;
                                                    }

                                                    setExchangeRateUSDT({ ...exchangeRateUSDT, EUR: Number(e.target.value) })
                                                }}
                                                className="w-full p-2 border border-gray-300 rounded-lg"
                                            />
                                        </div>
                                    </div>

                                </div>
        

                                {/*  환율(팔때) (USDT to ...) */}
                                <div className="w-full flex flex-col items-start justify-start gap-2 border-b border-gray-200 pb-4">
                                    <div className='flex flex-row items-center justify-start gap-2'>
                                        <Image
                                            src={`/icon-dot-green.png`}
                                            alt={`Dot icon`}
                                            width={10}
                                            height={10}
                                            className="h-2.5 w-2.5"
                                        />
                                        <span className="text-sm text-gray-500 font-semibold">
                                            환율(팔때) (USDT to ...)
                                        </span>
                                    </div>
                                    <div className="w-full grid grid-cols-5 gap-4">
                                        <div className="flex flex-col items-start justify-start space-y-1">
                                            <span className="text-sm text-gray-500">
                                                USD
                                            </span>
                                            <input
                                                type="text"
                                                value={exchangeRateUSDTSell.USD}
                                                onChange={(e) => {
                                                    // check number character only
                                                    if (!/^\d*\.?\d*$/.test(e.target.value)) {
                                                        return;
                                                    }

                                                    setExchangeRateUSDTSell({ ...exchangeRateUSDTSell, USD: Number(e.target.value) })
                                                }}
                                                className="w-full p-2 border border-gray-300 rounded-lg"
                                            />
                                        </div>

                                        <div className="flex flex-col items-start justify-start space-y-1">
                                            <span className="text-sm text-gray-500">
                                                KRW
                                            </span>
                                            <input
                                                type="text"
                                                value={exchangeRateUSDTSell.KRW}
                                                onChange={(e) => {
                                                    // check number character only
                                                    if (!/^\d*\.?\d*$/.test(e.target.value)) {
                                                        return;
                                                    }

                                                    setExchangeRateUSDTSell({ ...exchangeRateUSDTSell, KRW: Number(e.target.value) })
                                                }}
                                                className="w-full p-2 border border-gray-300 rounded-lg"
                                            />
                                        </div>

                                        <div className="flex flex-col items-start justify-start space-y-1">
                                            <span className="text-sm text-gray-500">
                                                JPY
                                            </span>
                                            <input
                                                type="text"
                                                value={exchangeRateUSDTSell.JPY}
                                                onChange={(e) => {
                                                    // check number character only
                                                    if (!/^\d*\.?\d*$/.test(e.target.value)) {
                                                        return;
                                                    }

                                                    setExchangeRateUSDTSell({ ...exchangeRateUSDTSell, JPY: Number(e.target.value) })
                                                }}
                                                className="w-full p-2 border border-gray-300 rounded-lg"
                                            />
                                        </div>

                                        <div className="flex flex-col items-start justify-start space-y-1">
                                            <span className="text-sm text-gray-500">
                                                CNY
                                            </span>
                                            <input
                                                type="text"
                                                value={exchangeRateUSDTSell.CNY}
                                                onChange={(e) => {
                                                    // check number character only
                                                    if (!/^\d*\.?\d*$/.test(e.target.value)) {
                                                        return;
                                                    }

                                                    setExchangeRateUSDTSell({ ...exchangeRateUSDTSell, CNY: Number(e.target.value) })
                                                }}
                                                className="w-full p-2 border border-gray-300 rounded-lg"
                                            />
                                        </div>

                                        <div className="flex flex-col items-start justify-start space-y-1">
                                            <span className="text-sm text-gray-500">
                                                EUR
                                            </span>
                                            <input
                                                type="text"
                                                value={exchangeRateUSDTSell.EUR}
                                                onChange={(e) => {
                                                    // check number character only
                                                    if (!/^\d*\.?\d*$/.test(e.target.value)) {
                                                        return;
                                                    }

                                                    setExchangeRateUSDTSell({ ...exchangeRateUSDTSell, EUR: Number(e.target.value) })
                                                }}
                                                className="w-full p-2 border border-gray-300 rounded-lg"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <button
                                    disabled={updatingClientInfo}
                                    onClick={() => updateClientInfo()}
                                    className={`w-full bg-blue-500 text-white p-2 rounded-lg ${updatingClientInfo ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-600'}`}
                                >
                                    {updatingClientInfo ? '저장 중...' : '저장하기'}
                                </button>

                            </div>


                            {/* 페이액션 사용 유무 */}
                            {/* On/Off 토글 */}
                            {/* payactionViewOn */}
                            <div className="w-full flex flex-col items-start justify-start gap-2
                                background-gray-50 p-4 rounded-lg border border-gray-500">

                                <div className='flex flex-row items-center justify-start gap-2 mb-4
                                border-b border-gray-200 pb-2'>
                                    <Image
                                        src={`/icon-dot-green.png`}
                                        alt={`Dot icon`}
                                        width={10}
                                        height={10}
                                        className="h-2.5 w-2.5"
                                    />
                                    <span className="text-lg text-gray-500 font-semibold">
                                        페이액션 사용 유무
                                    </span>
                                </div>

                                <div className="w-full flex flex-row items-center justify-between">
                                    <span className="text-sm text-gray-500 font-semibold">
                                        페이액션 사용 설정
                                    </span>
                                    {payactionViewOn === false ? (
                                        <button
                                            disabled={updatingPayactionViewOn}
                                            onClick={() => updatePayactionViewOn(true)}
                                            className={`
                                                ${updatingPayactionViewOn ? 'opacity-50 cursor-not-allowed' : 'hover:bg-red-500'}
                                                px-4 py-2 bg-red-400 text-white rounded-lg
                                            `}
                                        >
                                            {updatingPayactionViewOn ? '업데이트 중...' : '사용 안함'}
                                        </button>
                                    ) : (
                                        <button
                                            disabled={updatingPayactionViewOn}
                                            onClick={() => updatePayactionViewOn(false)}
                                            className={`
                                                ${updatingPayactionViewOn ? 'opacity-50 cursor-not-allowed' : 'hover:bg-green-500'}
                                                px-4 py-2 bg-green-400 text-white rounded-lg
                                            `}
                                        >
                                            {updatingPayactionViewOn ? '업데이트 중...' : '사용 함'}
                                        </button>
                                    )}
                                </div>

                            </div>



                            {/* 판매자 정보 */}

                            {/* servier wallet transfer */}
                            
                            <div className="w-full flex flex-col items-start justify-start gap-2
                                background-gray-50 p-4 rounded-lg border border-gray-500">

                               <button
                                    disabled={serverWalletTransferring}
                                    onClick={() => serverWalletTransfer()}
                                    className={`
                                        ${serverWalletTransferring ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-600'}
                                        w-full bg-blue-500 text-white p-2 rounded-lg
                                    `}
                                >
                                    서버 월렛 USDT 1 전송 테스트
                                </button>

                            </div>
                            




                        </div>
                    ) : (
                        <div className="w-full flex flex-col items-center justify-center">
                            <span className="text-sm text-gray-500">
                                Loading...
                            </span>
                        </div>
                    )}


                </div>


            </div>

        </main>

    );

}

          
