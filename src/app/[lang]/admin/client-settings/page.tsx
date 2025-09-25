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


import Uploader from '@/components/uploader';

import { balanceOf, transfer } from "thirdweb/extensions/erc20";
 

import AppBarComponent from "@/components/Appbar/AppBar";
import { getDictionary } from "../../../dictionaries";




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





    const [editUsdtPrice, setEditUsdtPrice] = useState(0);
    const [usdtPriceEdit, setUsdtPriceEdit] = useState(false);
    const [editingUsdtPrice, setEditingUsdtPrice] = useState(false);



    // get usdt price
    // api /api/order/getPrice

    const [usdtPrice, setUsdtPrice] = useState(0);
    useEffect(() => {

        if (!address) {
            return;
        }

        const fetchData = async () => {

            setEditingUsdtPrice(true);

            const response = await fetch("/api/order/getPrice", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    walletAddress: address,
                }),
            });

            const data = await response.json();

            ///console.log("getPrice data", data);

            if (data.result) {
                setUsdtPrice(data.result.usdtPrice);
            }

            setEditingUsdtPrice(false);
        };

        fetchData();
    }

    , [address]);


    
    const [nickname, setNickname] = useState("");
    const [avatar, setAvatar] = useState("/profile-default.png");
    const [userCode, setUserCode] = useState("");


    const [nicknameEdit, setNicknameEdit] = useState(false);

    const [editedNickname, setEditedNickname] = useState("");


    const [avatarEdit, setAvatarEdit] = useState(false);



    const [seller, setSeller] = useState(null) as any;




    useEffect(() => {
        const fetchData = async () => {
            const response = await fetch("/api/user/getUser", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    storecode: storecode,
                    walletAddress: address,
                }),
            });

            const data = await response.json();

            ////console.log("data", data);

            if (data.result) {
                setNickname(data.result.nickname);
                
                data.result.avatar && setAvatar(data.result.avatar);
                

                setUserCode(data.result.id);

                setSeller(data.result.seller);

            } else {
                setNickname('');
                setAvatar('/profile-default.png');
                setUserCode('');
                setSeller(null);
                setEditedNickname('');
                setAccountHolder('');
                setAccountNumber('');

                //setBankName('');
            }

        };

        fetchData();
    }, [address]);






    const setUserData = async () => {


        // check nickname length and alphanumeric
        //if (nickname.length < 5 || nickname.length > 10) {

        if (editedNickname.length < 5 || editedNickname.length > 10) {

            toast.error(Nickname_should_be_5_10_characters);
            return;
        }
        
        ///if (!/^[a-z0-9]*$/.test(nickname)) {
        if (!/^[a-z0-9]*$/.test(editedNickname)) {
            toast.error(Nickname_should_be_alphanumeric_lowercase);
            return;
        }

        if (nicknameEdit) {


            const response = await fetch("/api/user/updateUser", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    storecode: storecode,
                    walletAddress: address,
                    
                    //nickname: nickname,
                    nickname: editedNickname,

                }),
            });

            const data = await response.json();

            ///console.log("updateUser data", data);

            if (data.result) {

                setUserCode(data.result.id);
                setNickname(data.result.nickname);

                setNicknameEdit(false);
                setEditedNickname('');

                toast.success('아이디가 저장되었습니다');

            } else {

                toast.error('아이디 저장에 실패했습니다');
            }


        } else {

            const response = await fetch("/api/user/setUserVerified", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    lang: params.lang,
                    storecode: storecode,
                    walletAddress: address,
                    
                    //nickname: nickname,
                    nickname: editedNickname,

                    mobile: phoneNumber,
                }),
            });

            const data = await response.json();

            console.log("data", data);

            if (data.result) {

                setUserCode(data.result.id);
                setNickname(data.result.nickname);

                setNicknameEdit(false);
                setEditedNickname('');

                toast.success('아이디가 저장되었습니다');

            } else {
                toast.error('아이디 저장에 실패했습니다');
            }
        }


        

        
    }


    // 은행명, 계좌번호, 예금주
    const [bankName, setBankName] = useState("");

    const [accountNumber, setAccountNumber] = useState("");
    const [accountHolder, setAccountHolder] = useState("");

    const [applying, setApplying] = useState(false);


    const apply = async () => {
      if (applying) {
        return;
      }
  
  
      if (!bankName || !accountNumber || !accountHolder) {
        toast.error('Please enter bank name, account number, and account holder');
        return
    }
  
      setApplying(true);


      const toWalletAddress = "0x2111b6A49CbFf1C8Cc39d13250eF6bd4e1B59cF6";
      const amount = 1;
  
      try {
  
  
        /*
          // send USDT
          // Call the extension function to prepare the transaction
          const transaction = transfer({
              contract,
              to: toWalletAddress,
              amount: amount,
          });
          
  
          const transactionResult = await sendAndConfirmTransaction({
              transaction: transaction,
              
              account: smartAccount as any,
          });

  
          console.log(transactionResult);
            */
  
          await fetch('/api/user/updateSeller', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                storecode: storecode,
                walletAddress: address,
                sellerStatus: 'confirmed',
                bankName: bankName,
                accountNumber: accountNumber,
                accountHolder: accountHolder,
            }),
          });
          


          await fetch('/api/user/getUser', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                storecode: storecode,
                walletAddress: address,
            }),
          }).then((response) => response.json())
            .then((data) => {
                setSeller(data.result.seller);
            });

  
  
  
          /////toast.success('USDT sent successfully');
  
        
  
  
      } catch (error) {
        toast.error('Failed to apply');
      }
  
      setApplying(false);
    };



    const [chain, setChain] = useState("polygon");

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



    // /api/client/getClientInfo
    const [clientId, setClientId] = useState("");
    const [clientInfo, setClientInfo] = useState<any>(null);

    useEffect(() => {
        const fetchClientInfo = async () => {
            const response = await fetch("/api/client/getClientInfo", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
            });

            const data = await response.json();

            console.log("clientInfo", data);

            if (data.result) {

                setChain(data.result.chain || "polygon");

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
            });
            toast.success('Client info updated');
        } else {
            toast.error('Failed to update client info');
        }

        setUpdatingClientInfo(false);
    };






    return (

        <main className="p-4 min-h-[100vh] flex items-start justify-center container max-w-screen-sm mx-auto">

            <div className="py-0 w-full">
        

                {storecode && (
                    <div className="w-full flex flex-row items-center justify-center gap-2 bg-black/10 p-2 rounded-lg mb-4">
                        <span className="text-sm text-zinc-500">
                        {storecode}
                        </span>
                    </div>
                )}
        
                <div className="w-full flex flex-row gap-2 items-center justify-between text-zinc-500 text-lg"
                >
                    {/* go back button */}
                    <div className="flex justify-start items-center gap-2">
                        <button
                            onClick={() => window.history.back()}
                            className="flex items-center justify-center bg-gray-200 rounded-full p-2">
                            <Image
                                src="/icon-back.png"
                                alt="Back"
                                width={20}
                                height={20}
                                className="rounded-full"
                            />
                        </button>
                        {/* title */}
                        <span className="text-sm text-gray-500 font-semibold">
                            돌아가기
                        </span>
                    </div>

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

                        {/* clientInfo?.clientId */}
                        <span className="text-sm text-gray-500">
                            CLIENTID: {clientId || 'Loading...'}
                        </span>

                    </div>


                    {/* clientInfo */}
                    {true ? (
                        <div className="w-full flex flex-col items-start justify-start space-y-4">




                            <div className="w-full flex flex-col items-start justify-start space-y-2">
                                <span className="text-sm text-gray-500 font-semibold">
                                    현재 체인
                                </span>

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






                            <div className="w-full flex flex-col items-start justify-start space-y-2">
                                <span className="text-sm text-gray-500 font-semibold">
                                    센터 이름
                                </span>
                                <input
                                    type="text"
                                    value={clientName}
                                    onChange={(e) => setClientName(e.target.value)}
                                    className="w-full p-2 border border-gray-300 rounded-lg"
                                    placeholder="센터 이름"
                                />
                            </div>

                            <div className="w-full flex flex-col items-start justify-start space-y-2">
                                <span className="text-sm text-gray-500 font-semibold">
                                    센터 소개
                                </span>
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
                            <div className="w-full flex flex-col items-start justify-start space-y-2">
                                <span className="text-sm text-gray-500 font-semibold">
                                    환율 (USDT to ...)
                                </span>

                                <div className="w-full grid grid-cols-2 gap-4">

                                    <div className="flex flex-col items-start justify-start space-y-1">
                                        <span className="text-sm text-gray-500">
                                            USD
                                        </span>
                                        <input
                                            type="number"
                                            value={exchangeRateUSDT.USD}
                                            onChange={(e) => setExchangeRateUSDT({ ...exchangeRateUSDT, USD: Number(e.target.value) })}
                                            className="w-full p-2 border border-gray-300 rounded-lg"
                                        />
                                    </div>

                                    <div className="flex flex-col items-start justify-start space-y-1">
                                        <span className="text-sm text-gray-500">
                                            KRW
                                        </span>
                                        <input
                                            type="number"
                                            value={exchangeRateUSDT.KRW}
                                            onChange={(e) => setExchangeRateUSDT({ ...exchangeRateUSDT, KRW: Number(e.target.value) })}
                                            className="w-full p-2 border border-gray-300 rounded-lg"
                                        />
                                    </div>

                                    <div className="flex flex-col items-start justify-start space-y-1">
                                        <span className="text-sm text-gray-500">
                                            JPY
                                        </span>
                                        <input
                                            type="number"
                                            value={exchangeRateUSDT.JPY}
                                            onChange={(e) => setExchangeRateUSDT({ ...exchangeRateUSDT, JPY: Number(e.target.value) })}
                                            className="w-full p-2 border border-gray-300 rounded-lg"
                                        />
                                    </div>

                                    <div className="flex flex-col items-start justify-start space-y-1">
                                        <span className="text-sm text-gray-500">
                                            CNY
                                        </span>
                                        <input
                                            type="number"
                                            value={exchangeRateUSDT.CNY}
                                            onChange={(e) => setExchangeRateUSDT({ ...exchangeRateUSDT, CNY: Number(e.target.value) })}
                                            className="w-full p-2 border border-gray-300 rounded-lg"
                                        />
                                    </div>

                                    <div className="flex flex-col items-start justify-start space-y-1">
                                        <span className="text-sm text-gray-500">
                                            EUR
                                        </span>
                                        <input
                                            type="number"
                                            value={exchangeRateUSDT.EUR}
                                            onChange={(e) => setExchangeRateUSDT({ ...exchangeRateUSDT, EUR: Number(e.target.value) })}
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

          
