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
import { inAppWallet } from "thirdweb/wallets";


import { getUserPhoneNumber } from "thirdweb/wallets/in-app";


import Image from 'next/image';

import GearSetupIcon from "@/components/gearSetupIcon";


import Uploader from '@/components/uploader';

import { balanceOf, transfer } from "thirdweb/extensions/erc20";
 

import AppBarComponent from "@/components/Appbar/AppBar";
import { getDictionary } from "../../../dictionaries";






const wallets = [
    inAppWallet({
      auth: {
        options: ["phone", "email"],
      },
    }),
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
 
    const wallet = searchParams.get('wallet');




    const contract = getContract({
        // the client you have created via `createThirdwebClient()`
        client,
        // the chain the contract is deployed on
        
        
        chain: arbitrum ,
      
      
      
        // the contract's address
        ///address: contractAddressArbitrum,
    
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

    } = data;
    
    



    const router = useRouter();



    const activeAccount = useActiveAccount();

    const address = activeAccount?.address;
  
  
      
 

    const [phoneNumber, setPhoneNumber] = useState("");

    useEffect(() => {
  
  
      if (address) {
  
        //const phoneNumber = await getUserPhoneNumber({ client });
        //setPhoneNumber(phoneNumber);
  
  
        getUserPhoneNumber({ client }).then((phoneNumber) => {
          setPhoneNumber(phoneNumber || "");
        });
  
  
  
      }
  
    } , [address]);



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


    const [user, setUser] = useState(null) as any;
    const [seller, setSeller] = useState(null) as any;

    const [buyer, setBuyer] = useState(null) as any;


    useEffect(() => {
        const fetchData = async () => {
            const response = await fetch("/api/user/getUser", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    walletAddress: address,
                }),
            });

            const data = await response.json();

            console.log("data", data);



            if (data.result) {
                setUser(data.result);

                setNickname(data.result.nickname);
                
                data.result.avatar && setAvatar(data.result.avatar);
                

                setUserCode(data.result.id);

                setSeller(data.result?.seller);

                setBuyer(data.result?.buyer);

            } else {
                setUser(null);
                
                setNickname('');
                setAvatar('/profile-default.png');
                setUserCode('');
                
                setSeller(null);
                setBuyer(null);

                setEditedNickname('');
                setAccountHolder('');
                setAccountNumber('');
                setBankName('');
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

                toast.success('Nickname saved');

            } else {

                toast.error('You must enter different nickname');
            }


        } else {

            const response = await fetch("/api/user/setUserVerified", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    walletAddress: address,
                    
                    //nickname: nickname,
                    nickname: editedNickname,

                    mobile: phoneNumber,
                }),
            });

            const data = await response.json();

            //console.log("data", data);

            if (data.result) {

                setUserCode(data.result.id);
                setNickname(data.result.nickname);

                setNicknameEdit(false);
                setEditedNickname('');

                toast.success('Nickname saved');

            } else {
                toast.error('Error saving nickname');
            }
        }


        

        
    }


    // 은행명, 계좌번호, 예금주
    const [bankName, setBankName] = useState("");
    const [accountNumber, setAccountNumber] = useState("");
    const [accountHolder, setAccountHolder] = useState("");

    const [applying, setApplying] = useState(false);


    const [errorMsgForSetSeller, setErrorMsgForSetSeller] = useState("");

    /*
    const apply = async () => {
      if (applying) {
        return;
      }
  

  
      setApplying(true);


      const toWalletAddress = "0x2111b6A49CbFf1C8Cc39d13250eF6bd4e1B59cF6";
      const amount = 1;
  
      try {
  
          const response =  await fetch('/api/user/updateBuyer', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                walletAddress: address,
                buyer: buyer,
            }),
          });

          if (response.status !== 200) {
            //toast.error('Error saving Seller info');
            alert('구매자 가상계좌 발급에 실패했습니다.');
            
            setApplying(false);
            return;
        }


        const data = await response.json();

        if (data.result) {

            setErrorMsgForSetSeller('');

            alert('구매자 가상계좌 발급이 완료되었습니다.');


          await fetch('/api/user/getUser', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                walletAddress: address,
            }),
          }).then((response) => response.json())
            .then((data) => {
                setSeller(data.result?.seller);

                setUser(data.result);

                setBuyer(data.result?.buyer);

            });

        } else {

            setErrorMsgForSetSeller(data.error);

        }
  
  
          /////toast.success('USDT sent successfully');
  
        
  
  
      } catch (error) {

        

        toast.error('Failed to send USDT');
      }
  
      setApplying(false);
    };
    */
  


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
                  walletAddress: address,
              }),
            }).then((response) => response.json())
              .then((data) => {
                  setSeller(data.result.seller);
              });
  
    
    
    
            /////toast.success('USDT sent successfully');
    
          
    
    
        } catch (error) {
          //toast.error('Failed to send USDT');
          toast.error('Failed to apply as a seller');
        }
    
        setApplying(false);
      };
    





    // check box edit seller
    const [editSeller, setEditSeller] = useState(false);


    const [otp, setOtp] = useState('');

    const [verifiedOtp, setVerifiedOtp] = useState(true);
  
    const [isSendedOtp, setIsSendedOtp] = useState(false);
  
  
  
    const [isSendingOtp, setIsSendingOtp] = useState(false);
  
    const [isVerifingOtp, setIsVerifingOtp] = useState(false);
  
    
  
    const sendOtp = async () => {
  
      setIsSendingOtp(true);
        
      const response = await fetch('/api/transaction/setOtp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lang: params.lang,
          chain: params.center,
          walletAddress: address,
          mobile: phoneNumber,
        }),
      });
  
      const data = await response.json();
  
      //console.log("data", data);
  
      if (data.result) {
        setIsSendedOtp(true);
        toast.success('OTP sent successfully');
      } else {
        toast.error('Failed to send OTP');
      }
  
      setIsSendingOtp(false);
  
    };
  
    const verifyOtp = async () => {
  
      setIsVerifingOtp(true);
        
      const response = await fetch('/api/transaction/verifyOtp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lang: params.lang,
          chain: params.center,
          walletAddress: address,
          otp: otp,
        }),
      });
  
      const data = await response.json();
  
      //console.log("data", data);
  
      if (data.status === 'success') {
        setVerifiedOtp(true);
        toast.success('OTP verified successfully');
      } else {
        toast.error('Failed to verify OTP');
      }
  
      setIsVerifingOtp(false);
    
    }
  






    return (

        <main className="p-4 pb-10 min-h-[100vh] flex items-start justify-center container max-w-screen-xl mx-auto">

            <div className="py-0 w-full">
        
                {/* goto home button using go back icon
                history back
                */}

                <AppBarComponent />
        
                <div className="mt-4 flex justify-start space-x-4 mb-10">
                    <button
                        onClick={() => router.push(
                            wallet === "smart" ?
                            '/' + params.lang + '/' + params.center + '?wallet=smart'
                            :
                            '/' + params.lang + '/' + params.center
                        ) }
                        className="text-zinc-100 font-semibold underline"
                    >
                        {Go_Home}
                    </button>
                </div>


                <div className="flex flex-col items-start justify-center space-y-4">

                    <div className='flex flex-row items-center space-x-4'>
                        <GearSetupIcon />
                        <div className="text-2xl font-semibold">
                            {Profile_Settings}
                        </div>


                        {!address && (
                            <ConnectButton
                            client={client}
                            wallets={wallets}

                            /*
                            accountAbstraction={{   
                                chain: arbitrum ,
                                //
                                //chain: arbitrum,

                                //chain: arbitrum,,
                                factoryAddress: "0x655934C0B4bD79f52A2f7e6E60714175D5dd319b", // polygon, arbitrum
                                gasless: true,
                            }}
                            */
                            
                            theme={"light"}
                            connectModal={{
                                size: "wide",                            
                                //title: "Connect",

                            }}

                            appMetadata={
                                {
                                logoUrl: "https://gold.goodtether.com/logo.png",
                                name: "Next App",
                                url: "https://gold.goodtether.com",
                                description: "This is a Next App.",

                                }
                            }

                            />
                        )}

                    </div>


                    <div className='w-full  flex flex-col gap-5 '>

                        {/* profile picture */}
                    



                        {userCode && (
                            <div className='flex flex-row gap-2 items-center justify-between border border-gray-300 p-4 rounded-lg'>

                                <div className="bg-green-500 text-sm text-zinc-100 p-2 rounded">
                                    나의 아이디
                                </div>

                                <div className="p-2 bg-zinc-800 rounded text-zinc-100 text-xl font-semibold">
                                    {nickname}
                                </div>

                                
                                <button
                                    onClick={() => {

                                        nicknameEdit ? setNicknameEdit(false) : setNicknameEdit(true);

                                    } }
                                    className="p-2 bg-blue-500 text-zinc-100 rounded"
                                >
                                    {nicknameEdit ? Cancel : Edit}
                                </button>

                                <Image
                                    src="/verified.png"
                                    alt="Verified"
                                    width={20}
                                    height={20}
                                    className="rounded-lg"
                                />


                                
                            </div>
                        )}


                        { (address && (nicknameEdit || !userCode)) && (
                            <div className=' flex flex-col xl:flex-row gap-2 items-center justify-between border border-gray-300 p-4 rounded-lg'>

                                <div
                                    className="bg-green-500 text-sm text-zinc-100 p-2 rounded"
                                >
                                    나의 아이디
                                </div>

                                <input
                                    disabled={!address}
                                    className="p-2 w-64 text-zinc-100 bg-zinc-800 rounded text-2xl font-semibold"
                                    placeholder={Enter_your_nickname}
                                    
                                    //value={nickname}
                                    value={editedNickname}

                                    type='text'
                                    onChange={(e) => {
                                        // check if the value is a number
                                        // check if the value is alphanumeric and lowercase

                                        if (!/^[a-z0-9]*$/.test(e.target.value)) {
                                            toast.error(Nickname_should_be_alphanumeric_lowercase);
                                            return;
                                        }
                                        if ( e.target.value.length > 10) {
                                            toast.error(Nickname_should_be_at_least_5_characters_and_at_most_10_characters);
                                            return;
                                        }

                                        //setNickname(e.target.value);

                                        setEditedNickname(e.target.value);

                                    } }

                                />
                                <div className='flex flex-row gap-2 items-center justify-between'>
                                    <span className='text-xs font-semibold'>
                                        {Nickname_should_be_5_10_characters}
                                    </span>
                                </div>
                                <button
                                    disabled={!address}
                                    className="p-2 bg-blue-500 text-zinc-100 rounded"
                                    onClick={() => {
                                        setUserData();
                                    }}
                                >
                                    {Save}
                                </button>

                                

                            </div>
                        )}


                        {userCode && (
                            <div className='flex flex-row xl:flex-row gap-2 items-center justify-between border border-gray-300 p-4 rounded-lg'>

                                <div className="bg-green-500 text-sm text-zinc-100 p-2 rounded">
                                    {My_Profile_Picture}
                                </div>

                                <div className="p-2 bg-zinc-800 rounded text-zinc-100 text-xl font-semibold">
                                    <Uploader
                                        lang={params.lang}
                                        walletAddress={address as string}
                                    />
                                </div>

                            </div>
                        )}



                        {/*
                        {userCode && (

                            <div className='flex flex-row gap-2 items-center justify-between border border-gray-300 p-4 rounded-lg'>

                                <div className="bg-red-800 text-sm text-zinc-100 p-2 rounded">
                                    My Referral Code
                                </div>

                                <div className="p-2 bg-zinc-800 rounded text-zinc-100 text-xl font-semibold">
                                    {userCode}
                                </div>

 

                                <button
                                    onClick={() => {
                                        navigator.clipboard.writeText(userCode);
                                        toast.success('Referral code copied to clipboard');
                                    }}
                                    className="p-2 bg-blue-500 text-zinc-100 rounded"
                                >
                                    Copy
                                </button>

                                <Image
                                src="/verified.png"
                                alt="Verified"
                                width={20}
                                height={20}
                                className="rounded-lg"
                                />


                            </div>

                        )}
                        */}







                        {/*userCode && buyer && (

                            <div className='flex flex-row gap-2 items-center justify-between border border-gray-300 p-4 rounded-lg'>

                                <div className="bg-green-500 text-sm text-zinc-100 p-2 rounded">
                                    구매자 은행정보
                                </div>

                                <div className="flex flex-col p-2 bg-zinc-800 rounded text-zinc-100 text-xl font-semibold">
                                    
                                    <div className="text-lg font-semibold">
                                        
                                        
                                        {
                                        buyer?.bankInfo?.bankName === "090" ? "카카오뱅크" :
                                        buyer?.bankInfo?.bankName === "089" ? "케이뱅크" :
                                        buyer?.bankInfo?.bankName === "092" ? "토스뱅크" :
                                        buyer?.bankInfo?.bankName === "004" ? "국민은행" :
                                        buyer?.bankInfo?.bankName === "020" ? "우리은행" :
                                        buyer?.bankInfo?.bankName === "088" ? "신한은행" :
                                        buyer?.bankInfo?.bankName === "011" ? "농협" :
                                        buyer?.bankInfo?.bankName === "003" ? "기업은행" :
                                        buyer?.bankInfo?.bankName === "081" ? "하나은행" :
                                        buyer?.bankInfo?.bankName === "002" ? "외환은행" :
                                        buyer?.bankInfo?.bankName === "032" ? "부산은행" :
                                        buyer?.bankInfo?.bankName === "031" ? "대구은행" :
                                        buyer?.bankInfo?.bankName === "037" ? "전북은행" :
                                        buyer?.bankInfo?.bankName === "071" ? "경북은행" :
                                        buyer?.bankInfo?.bankName === "034" ? "광주은행" :
                                        buyer?.bankInfo?.bankName === "007" ? "수협" :
                                        buyer?.bankInfo?.bankName === "027" ? "씨티은행" :
                                        buyer?.bankInfo?.bankName === "055" ? "대신은행" :
                                        buyer?.bankInfo?.bankName === "054" ? "동양종합금융" :
                                        "은행선택"
                                        }


                                    </div>
                                    <div className="text-lg font-semibold">
                                        {buyer?.bankInfo?.accountNumber}
                                    </div>
                                    <div className="text-lg font-semibold">
                                        {buyer?.bankInfo?.accountHolder}
                                    </div>

                                </div>
                                


                                <Image
                                src="/verified.png"
                                alt="Verified"
                                width={20}
                                height={20}
                                className="rounded-lg"
                                />


                            </div>
                        )*/}

                        {
                            //(userCode && !seller) || (userCode && seller && editSeller) && (
                            true && (

                            <div className='flex flex-col gap-2 items-center justify-between border border-gray-300 p-4 rounded-lg'>
                                

                                {address && (
                                    <div className='w-full flex flex-col gap-2 items-center justify-between border border-gray-300 p-4 rounded-lg
                                    bg-zinc-800 bg-opacity-90
                                    '>
                                        <div className="w-full flex flex-row gap-2 items-center justify-start">
                                            {/* dot */}
                                            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                            <span className="text-sm font-semibold text-gray-200">
                                                구매자 가상계좌 정보
                                            </span>
                                        </div>

                                        {buyer?.bankInfo?.virtualAccount ? (
                                            <div className='flex flex-col gap-2 items-center justify-between'>

                                                <span className='text-lg font-semibold text-gray-200'>
                                                    은행: 농협
                                                </span>
                                                <div className="flex flex-row gap-2 items-center justify-between">
                                                    <span className="p-2 bg-zinc-800 rounded text-zinc-100 text-xl font-semibold">
                                                        게좌번호:{' '}{
                                                            buyer.bankInfo.virtualAccount
                                                        }
                                                    </span>
          
                                                    <button
                                                        onClick={() => {
                                                            navigator.clipboard.writeText(buyer.baankInfo.virtualAccount as string);
                                                            alert('가상계좌번호가 복사되었습니다.');
                                                        }}
                                                        className="p-2 bg-blue-500 text-zinc-100 rounded"
                                                    >
                                                        복사
                                                    </button>
                                                </div>
                                                {/*
                                                <span className='text-sm font-semibold text-gray-200'>
                                                    예금주: 스타디움엑스 (가상)
                                                </span>
                                                */}

                                                <div className='mt-5 flex flex-row gap-2 items-center justify-between'>
  
                                                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                                    <span className='text-sm font-semibold text-gray-200'>
                                                        가상계좌는 입금전용이며 출금은 지갑에서 가능합니다.
                                                    </span>
                                                </div>
                                                
                                            </div>
                                        ) : (
                                            <div className='flex flex-row gap-2 items-center justify-between'>
                                                <span className='text-sm font-semibold text-gray-200'>
                                                구매자 가상계좌 정보가 없습니다.
                                                </span>
                                            </div>
                                        )}

                                
                                    </div>

                                )}
                                
        

                                {address && !buyer?.bankInfo?.virtualAccount && (
                                        <div className='w-full flex flex-col gap-2 items-center justify-between border border-gray-300 p-4 rounded-lg
                                        bg-zinc-800 bg-opacity-90
                                        '>
                                            <div className="w-full flex flex-row gap-2 items-center justify-start">
                                                {/* dot */}
                                                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                                <span className="text-sm font-semibold text-gray-200">
                                                    구매자 가상계좌 발급하기
                                                </span>
                                            </div>

                                            <div className='flex flex-row gap-2 items-center justify-between'>


                                                {/*
                                                국민은행: 004, 우리은행: 020, 신한은행: 088, 농협: 011, 기업은행: 003, 하나은행: 081, 외환은행: 002, 부산은행: 032, 대구은행: 031, 전북은행: 037, 경북은행: 071, 부산은행: 032, 광주은행: 034, 우체국: 071, 수협: 007, 씨티은행: 027, 대신은행: 055, 동양종합금융: 054, 롯데카드: 062, 삼성카드: 029, 현대카드: 048, 신한카드: 016, 국민카드: 020, 하나카드: 081, 외환카드: 002, 씨티카드: 027, 현대카드: 048, 롯데카드: 062, 삼성카드: 029, 신한카드: 016, 국민카드: 020, 하나카드: 081, 외환카드: 002, 씨티카드: 027, 현대카드: 048, 롯데카드: 062, 삼성카드: 029, 신한카드: 016, 국민카드: 020, 하나카드: 081, 외환카드: 002, 씨티카드: 027, 현대카드: 048, 롯데카드: 062, 삼성카드: 029, 신한카드: 016, 국민카드: 020, 하나카드: 081, 외환카

                                                
                                                */}

                                                {/* select bank */}

                                                <select
                                                    disabled={!address}
                                                    className="p-2 w-full text-2xl text-center font-semibold bg-zinc-800 rounded-lg text-zinc-100
                                                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                                                    value={buyer?.bankInfo?.bankName}
                                                    onChange={(e) => {
                                                        setBuyer({
                                                            ...buyer,
                                                            bankInfo: {
                                                                ...buyer?.bankInfo,
                                                                bankName: e.target.value,
                                                            }
                                                        });
                                                    }}
                                                >
                                                    <option value="" selected={buyer?.bankInfo?.bankName === ""}>
                                                        은행선택
                                                    </option>
                                                    <option value="090" selected={buyer?.bankInfo?.bankName === "090"}>
                                                        카카오뱅크
                                                    </option>
                                                    <option value="089" selected={buyer?.bankInfo?.bankName === "089"}>
                                                        케이뱅크
                                                    </option>
                                                    <option value="092" selected={buyer?.bankInfo?.bankName === "092"}>
                                                        토스뱅크
                                                    </option>
                                                    <option value="004" selected={buyer?.bankInfo?.bankName === "004"}>
                                                        국민은행
                                                    </option>
                                                    <option value="020" selected={buyer?.bankInfo?.bankName === "020"}>
                                                        우리은행
                                                    </option>
                                                    <option value="088" selected={buyer?.bankInfo?.bankName === "088"}>
                                                        신한은행
                                                    </option>
                                                    <option value="011" selected={buyer?.bankInfo?.bankName === "011"}>
                                                        농협
                                                    </option>
                                                    <option value="003" selected={buyer?.bankInfo?.bankName === "003"}>
                                                        기업은행
                                                    </option>
                                                    <option value="081" selected={buyer?.bankInfo?.bankName === "081"}>
                                                        하나은행
                                                    </option>
                                                    <option value="002" selected={buyer?.bankInfo?.bankName === "002"}>
                                                        외환은행
                                                    </option>
                                                    <option value="032" selected={buyer?.bankInfo?.bankName === "032"}>
                                                        부산은행
                                                    </option>
                                                    <option value="031" selected={buyer?.bankInfo?.bankName === "031"}>
                                                        대구은행
                                                    </option>
                                                    <option value="037" selected={buyer?.bankInfo?.bankName === "037"}>
                                                        전북은행
                                                    </option>
                                                    <option value="071" selected={buyer?.bankInfo?.bankName === "071"}>
                                                        경북은행
                                                    </option>
                                                    <option value="034" selected={buyer?.bankInfo?.bankName === "034"}>
                                                        광주은행
                                                    </option>
                                                    <option value="007" selected={buyer?.bankInfo?.bankName === "007"}>
                                                        수협
                                                    </option>
                                                    <option value="027" selected={buyer?.bankInfo?.bankName === "027"}>
                                                        씨티은행
                                                    </option>
                                                    <option value="055" selected={buyer?.bankInfo?.bankName === "055"}>
                                                        대신은행
                                                    </option>
                                                    <option value="054" selected={buyer?.bankInfo?.bankName === "054"}>
                                                        동양종합금융
                                                    </option>


                                                </select>
                                            




                                            </div>
                                                    

                                            <div className='flex flex-row gap-2 items-center justify-between'>
                                                <input
                                                    disabled={!address}
                                                    className="p-2 w-full text-2xl text-center font-semibold bg-zinc-800 rounded-lg text-zinc-100
                                                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"

                                                    placeholder="계좌번호"
                                                    
                                                    value={buyer?.bankInfo?.accountNumber}

                                                    type='number'
                                                    onChange={(e) => {
                                                        setBuyer({
                                                            ...buyer,
                                                            bankInfo: {
                                                                ...buyer?.bankInfo,
                                                                accountNumber: e.target.value,
                                                            }
                                                        });
                                                    } }
                                                />
                                            </div>

                                            <div className='flex flex-row gap-2 items-center justify-between'>
                                                <input
                                                    disabled={!address}
                                                    className="p-2 w-full text-2xl text-center font-semibold bg-zinc-800 rounded-lg text-zinc-100
                                                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"

                                                    placeholder="예금주"
                                                    
                                                    value={buyer?.bankInfo?.accountHolder}

                                                    type='text'
                                                    onChange={(e) => {
                                                        setBuyer({
                                                            ...buyer,
                                                            bankInfo:
                                                            {
                                                                ...buyer?.bankInfo,
                                                                accountHolder: e.target.value,
                                                            }
                                                        });
                                                    } }
                                                />
                                            </div>

                                            {/* 생년월일 941109 */}
                                            <div className='flex flex-row gap-2 items-center justify-between'>
                                                <input
                                                    disabled={!address}
                                                    className="p-2 w-full text-2xl text-center font-semibold bg-zinc-800 rounded-lg text-zinc-100
                                                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"

                                                    placeholder="생년월일(6자리)"
                                                    
                                                    value={buyer?.bankInfo?.birth}

                                                    type='number'
                                                    onChange={(e) => {
                                                        setBuyer({
                                                            ...buyer,
                                                            bankInfo:
                                                            {
                                                                ...buyer?.bankInfo,
                                                                birth: e.target.value,
                                                            }
                                                        });
                                                    } }
                                                />
                                            </div>

                                            {/* gender 남성/여성 */}
                                            <div className='flex flex-row gap-2 items-center justify-between'>
                                                <select
                                                    disabled={!address}
                                                    className="p-2 w-full text-2xl text-center font-semibold bg-zinc-800 rounded-lg text-zinc-100
                                                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                                                    value={buyer?.bankInfo?.gender}

                                                    onChange={(e) => {
                                                        setBuyer({
                                                            ...buyer,
                                                            bankInfo:
                                                            {
                                                                ...buyer?.bankInfo,
                                                                gender: e.target.value,
                                                            }
                                                        });
                                                    } }
                                                >
                                                    <option value="">성별선택</option>
                                                    <option value="1">남성</option>
                                                    <option value="0">여성</option>
                                                </select>

                                            </div>

                                            {/* phoneNum */}
                                            <div className='flex flex-row gap-2 items-center justify-between'>
                                                <input
                                                    disabled={!address}
                                                    className="p-2 w-full text-2xl text-center font-semibold bg-zinc-800 rounded-lg text-zinc-100
                                                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"

                                                    placeholder="전화번호"
                                                    
                                                    value={buyer?.bankInfo?.phoneNum}

                                                    type='number'
                                                    onChange={(e) => {
                                                        setBuyer({
                                                            ...buyer,
                                                            bankInfo:
                                                            {
                                                                ...buyer?.bankInfo,
                                                                phoneNum: e.target.value,
                                                            }
                                                        });
                                                    } }
                                                />
                                            </div>



                                            {/* error message */}
                                            {errorMsgForSetSeller && (
                                                <div className='flex flex-row gap-2 items-center justify-between'>
                                                    <span className='text-sm font-semibold text-red-500'>
                                                        {errorMsgForSetSeller}
                                                    </span>
                                                </div>
                                            )}



                                            <button
                                                disabled={
                                                    !address
                                                    || !buyer?.bankInfo?.bankName
                                                    || !buyer?.bankInfo?.accountNumber
                                                    || !buyer?.bankInfo?.accountHolder
                                                    || !buyer?.bankInfo?.birth
                                                    || !buyer?.bankInfo?.gender
                                                    || !buyer?.bankInfo?.phoneNum
                                                    || applying
                                                }
                                                className={`
                                                    ${!address
                                                    || !buyer?.bankInfo?.bankName
                                                    || !buyer?.bankInfo?.accountNumber
                                                    || !buyer?.bankInfo?.accountHolder
                                                    || !buyer?.bankInfo?.birth
                                                    || !buyer?.bankInfo?.gender
                                                    || !buyer?.bankInfo?.phoneNum
                                                    || applying
                                                    ? 'bg-gray-500 text-zinc-100'
                                                    : 'bg-blue-500 text-zinc-100'}

                                                    p-2 rounded-lg text-sm font-semibold
                                                    w-full mt-5
                                                `}
                                                onClick={() => {
                                                    confirm('구매자 가상계좌를 발급하시겠습니까?') && apply();
                                                }}
                                            >
                                                {applying ? "발급중..." : "발급하기"}
                                            </button>


                                        

                                        </div>
                                    )}

                            

                                {/* otp verification */}
                                {/*
                                {verifiedOtp ? (
                                    <div className="w-full flex flex-row gap-2 items-center justify-center">
                                    <Image
                                        src="/verified.png"
                                        alt="check"
                                        width={30}
                                        height={30}
                                    />
                                    <div className="text-white">
                                        {OTP_verified}
                                    </div>
                                    </div>
                                ) : (
                                
                            
                                    <div className="w-full flex flex-row gap-2 items-start">

                                    <button
                                        disabled={!address || isSendingOtp}
                                        onClick={sendOtp}
                                        className={`
                                        
                                        ${isSendedOtp && 'hidden'}

                                        w-32 p-2 rounded-lg text-sm font-semibold

                                            ${
                                            !address || isSendingOtp
                                            ?'bg-gray-300 text-gray-400'
                                            : 'bg-green-500 text-white'
                                            }
                                        
                                        `}
                                    >
                                        {Send_OTP}
                                    </button>

                                    <div className={`flex flex-row gap-2 items-center justify-center ${!isSendedOtp && 'hidden'}`}>
                                        <input
                                        type="text"
                                        placeholder={Enter_OTP}
                                        className=" w-40 p-2 border border-gray-300 rounded text-black text-sm font-semibold"
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value)}
                                        />

                                        <button
                                        disabled={!otp || isVerifingOtp}
                                        onClick={verifyOtp}
                                        className={`w-32 p-2 rounded-lg text-sm font-semibold

                                            ${
                                            !otp || isVerifingOtp
                                            ?'bg-gray-300 text-gray-400'
                                            : 'bg-green-500 text-white'
                                            }
                                            
                                            `}
                                        >
                                            {Verify_OTP}
                                        </button>
                                    </div>

                                    </div>

                                )}
                                */}




                            </div>
                        )}






                        {
                            //(userCode && !seller) || (userCode && seller && editSeller) && (
                            true && (

                            <div className='flex flex-col gap-2 items-center justify-between border border-gray-300 p-4 rounded-lg'>
                                
                                <div className='w-full flex flex-row gap-2 items-center justify-between'>

                                    <div className="bg-green-500 text-sm text-zinc-100 p-2 rounded">
                                        {Seller}
                                    </div>

                                    {!seller && (
                                        <div className="p-2 bg-zinc-800 rounded text-zinc-100 text-xl font-semibold">
                                            {Not_a_seller}
                                        </div>
                                    )}

                                    {applying ? (
                                        <div className="p-2 bg-zinc-800 rounded text-zinc-100 text-xl font-semibold">
                                            {Applying}...
                                        </div>
                                    ) : (
                                        <button
                                            disabled={applying || !verifiedOtp}

                                            onClick={() => {
                                                // apply to be a seller
                                                // set seller to true
                                                // set seller to false
                                                // set seller to pending

                                                apply();

                                            }}
                                            className={`
                                                ${!verifiedOtp ? 'bg-gray-300 text-gray-400'
                                                : 'bg-green-500 text-zinc-100'}

                                                p-2 rounded-lg text-sm font-semibold
                                            `}
                                        >
                                            {Apply}
                                        </button>
                                    )}

                                </div>

                                {/* 은행명, 계좌번호, 예금주 */}
                                <div className='flex flex-col gap-2 items-start justify-between'>
                                                                        
                                    <input 
                                        disabled={applying}
                                        className="p-2 w-64 text-zinc-100 bg-zinc-800 rounded text-lg font-semibold"
                                        placeholder={Enter_your_bank_name}
                                        value={bankName}
                                        type='text'
                                        onChange={(e) => {
                                            setBankName(e.target.value);
                                        }}
                                    />
                                    <input 
                                        disabled={applying}
                                        className="p-2 w-64 text-zinc-100 bg-zinc-800 rounded text-lg font-semibold"
                                        placeholder={Enter_your_account_number}
                                        value={accountNumber}
                                        type='number'
                                        onChange={(e) => {

                                            // check if the value is a number

                                            e.target.value = e.target.value.replace(/[^0-9]/g, '');

                                            setAccountNumber(e.target.value);
                                        }}
                                    />
                                    <input 
                                        disabled={applying}
                                        className="p-2 w-64 text-zinc-100 bg-zinc-800 rounded text-lg font-semibold"
                                        placeholder={Enter_your_account_holder}
                                        value={accountHolder}
                                        type='text'
                                        onChange={(e) => {
                                            setAccountHolder(e.target.value);
                                        }}
                                    />
                                </div>


                                {/* otp verification */}

                                {verifiedOtp ? (
                                    <div className="w-full flex flex-row gap-2 items-center justify-center">
                                    <Image
                                        src="/verified.png"
                                        alt="check"
                                        width={30}
                                        height={30}
                                    />
                                    <div className="text-white">
                                        {OTP_verified}
                                    </div>
                                    </div>
                                ) : (
                                
                            
                                    <div className="w-full flex flex-row gap-2 items-start">

                                    <button
                                        disabled={!address || isSendingOtp}
                                        onClick={sendOtp}
                                        className={`
                                        
                                        ${isSendedOtp && 'hidden'}

                                        w-32 p-2 rounded-lg text-sm font-semibold

                                            ${
                                            !address || isSendingOtp
                                            ?'bg-gray-300 text-gray-400'
                                            : 'bg-green-500 text-white'
                                            }
                                        
                                        `}
                                    >
                                        {Send_OTP}
                                    </button>

                                    <div className={`flex flex-row gap-2 items-center justify-center ${!isSendedOtp && 'hidden'}`}>
                                        <input
                                        type="text"
                                        placeholder={Enter_OTP}
                                        className=" w-40 p-2 border border-gray-300 rounded text-black text-sm font-semibold"
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value)}
                                        />

                                        <button
                                        disabled={!otp || isVerifingOtp}
                                        onClick={verifyOtp}
                                        className={`w-32 p-2 rounded-lg text-sm font-semibold

                                            ${
                                            !otp || isVerifingOtp
                                            ?'bg-gray-300 text-gray-400'
                                            : 'bg-green-500 text-white'
                                            }
                                            
                                            `}
                                        >
                                            {Verify_OTP}
                                        </button>
                                    </div>

                                    </div>

                                )}




                            </div>
                        )}





















                        {/* update USDT Price */}
                        {address && (
                            address === '0x68B4F181d97AF97d8b111Ad50A79AfeB33CF6be6'
                            || address === '0x91CA2566C3345026647aBbACB56093144eAA4c16'
                        )
                            && (
                            <div className='flex flex-col gap-2 items-center justify-between border border-gray-300 p-4 rounded-lg'>
                                <div className='flex flex-row gap-2 items-center justify-between'>

                                    <div className="bg-green-500 text-sm text-zinc-100 p-2 rounded">
                                        Update USDT Price
                                    </div>

                                    <div className="p-2 bg-zinc-800 rounded text-zinc-100 text-xl font-semibold">
                                        1 USDT = {usdtPrice} KRW
                                    </div>

                                    <button
                                        onClick={() => {
                                            setUsdtPriceEdit(!usdtPriceEdit);
                                        }}
                                        className="p-2 bg-blue-500 text-zinc-100 rounded"
                                    >
                                        {usdtPriceEdit ? Cancel : Edit}
                                    </button>


                                </div>

                                {usdtPriceEdit && (
                                    <div className='flex flex-col gap-2 items-center justify-between'>

                                        <input 
                                            className="p-2 w-64 text-zinc-100 bg-zinc-800 rounded text-lg font-semibold"
                                            placeholder="Enter USDT Price"
                                            type='number'
                                            value={editUsdtPrice}
                                            onChange={(e) => {
                                                setEditUsdtPrice(e.target.value as any);
                                            }}
                                        />
                                        <button
                                            disabled={editingUsdtPrice}

                                            className={`
                                                ${editingUsdtPrice ? 'bg-gray-300 text-gray-400' : 'bg-green-500 text-zinc-100'}
                                                p-2 rounded-lg text-sm font-semibold
                                            `}

                                            onClick={async () => {
                                                // api call /api/order/updatePrice

                                                const response = await fetch("/api/order/updatePrice", {
                                                    method: "POST",
                                                    headers: {
                                                        "Content-Type": "application/json",
                                                    },
                                                    body: JSON.stringify({
                                                        walletAddress: address,
                                                        price: editUsdtPrice,
                                                    }),
                                                })
                                                .then((response) => (

                                                    toast.success('USDT price updated successfully'),
                                                    
                                                    setUsdtPrice(editUsdtPrice)
                                                
                                                ))

                                            } }
                                                
                                        >
                                            Save
                                        </button>
                                    </div>
                                )}

                            </div>
                        )}

                    

                    </div>


                </div>

            </div>

        </main>

    );

}

          
