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
 
    const userStorecode = searchParams.get('storecode');
    const userWalletAddress = searchParams.get('walletAddress');


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



    const smartAccount = useActiveAccount();

    const address = smartAccount?.address;

      
 





    const [memberData, setMemberData] = useState<any>(null);

    const [fetchingMemberData, setFetchingMemberData] = useState(false);

    useEffect(() => {

        if (!userStorecode || !userWalletAddress) {
            return;
        }

        setFetchingMemberData(true);

        fetch('/api/user/getUserByStorecodeAndWalletAddress', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                storecode: userStorecode,
                walletAddress: userWalletAddress,
            }),
        }).then((response) => response.json())
        .then((data) => {

            //console.log('getUserByWalletAddress data', data);
            /*
            {
                "_id": "68c7afaccd8e3d2fb08df1be",
                "email": null,
                "nickname": "jsk",
                "walletAddress": "0x57953d9e575C36075c26A762A26685f255bD82b3",
                "createdAt": "2025-09-15T06:18:20.377Z",
                "buyer": {
                    "depositBankAccountNumber": "9002183081286",
                    "depositBankName": "새마을금고",
                    "depositName": "전성권"
                }
            }
            */


            setMemberData(data.result);
        })
        .finally(() => {
            setFetchingMemberData(false);
        });

    } , [userStorecode, userWalletAddress]);






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
        return;
      }

      if (!userStorecode || !userWalletAddress) {
        toast.error('User store code and wallet address are required');
        return;
      }

      setApplying(true);


  
    try {
  
        const response = await fetch('/api/user/updateUserBankInfo', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                storecode: userStorecode,
                walletAddress: userWalletAddress,
                depositBankName: bankName,
                depositBankAccountNumber: accountNumber,
                depositName: accountHolder,
            }),
        });

        const data = await response.json();

        toast.success('회원정보가 성공적으로 업데이트되었습니다.');

        // reload member data
        if (userStorecode && userWalletAddress) {

            setFetchingMemberData(true);

            fetch('/api/user/getUserByStorecodeAndWalletAddress', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    storecode: userStorecode,
                    walletAddress: userWalletAddress,
                }),
            }).then((response) => response.json())
            .then((data) => {

                setMemberData(data.result);
            })
            .finally(() => {
                setFetchingMemberData(false);
            });

        }

        } catch (e) {

            toast.error('회원정보 업데이트에 실패했습니다. 다시 시도해주세요.');
        }

        setApplying(false);

    }


    /// change userType of memberData
    const [updateUserType, setUpdateUserType] = useState('');

    const [changingUserType, setChangingUserType] = useState(false);

    // api call to get userType from memberData
    const changeUserType = async (newType: string) => {

        if (changingUserType) {
            return;
        }

        if (!userStorecode || !userWalletAddress) {
            toast.error('User store code and wallet address are required');
            return;
        }

        const userType = newType === 'normal' ? '' : ['AAA', 'BBB', 'CCC', 'DDD'].includes(newType) ? newType : null;

        if (userType === null) {
            toast.error('잘못된 회원 등급입니다.');
            return;
        }

        setChangingUserType(true);

        try {

            const response = await fetch('/api/user/updateUserType', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    storecode: userStorecode,
                    walletAddress: userWalletAddress,
                    userType: userType,
                }),
            });

            const data = await response.json();

            toast.success('회원 등급이 성공적으로 업데이트되었습니다.');

            setMemberData({
                ...memberData,
                userType: newType,
            });

            setUpdateUserType('');

        } catch (e) {
            toast.error('회원 등급 업데이트에 실패했습니다. 다시 시도해주세요.');
        }

        setChangingUserType(false);

    }




    return (

        <main className="p-4 min-h-[100vh] flex items-start justify-center container max-w-screen-sm mx-auto">

            <div className="py-0 w-full">
        

                <div className="w-full flex flex-row gap-2 items-center justify-start text-zinc-500 text-lg"
                >
                    {/* go back button */}
                    <div className="w-full flex justify-start items-center gap-2">
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



            

                <div className='
                    mt-4 mb-4 w-full
                    flex flex-row gap-2 items-center justify-between border border-gray-300 p-4 rounded-lg'>

                    <div className="flex flex-row items-center gap-2">
                        {/* dot */}
                        <div className='w-2 h-2 bg-green-500 rounded-full'></div>
                        <span className="text-lg">
                            회원 정보
                        </span>
                    </div>

                    {/*
                        {
                            "_id": "68c7afaccd8e3d2fb08df1be",
                            "email": null,
                            "nickname": "jsk",
                            "walletAddress": "0x57953d9e575C36075c26A762A26685f255bD82b3",
                            "createdAt": "2025-09-15T06:18:20.377Z",
                            "buyer": {
                                "depositBankAccountNumber": "9002183081286",
                                "depositBankName": "새마을금고",
                                "depositName": "전성권"
                            }
                        }
                    */}

                    
                    <div className="flex flex-col gap-1 items-start justify-between">
                        
                        <span className="text-lg text-zinc-500 font-semibold">
                            아이디: {memberData?.nickname}
                        </span>

                        <span className="text-lg text-zinc-500 font-semibold">
                            지갑 주소: {memberData?.walletAddress.slice(0, 6) + "..." + memberData?.walletAddress.slice(-4)}
                        </span>
                        <span className="text-lg text-zinc-500 font-semibold">
                            가입일: {new Date(memberData?.createdAt).toLocaleDateString()}
                        </span>
                        <span className="text-lg text-zinc-500 font-semibold">
                            은행명: {memberData?.buyer?.depositBankName || "-"}
                        </span>
                        <span className="text-lg text-zinc-500 font-semibold">
                            계좌번호: {memberData?.buyer?.depositBankAccountNumber || "-"}
                        </span>
                        <span className="text-lg text-zinc-500 font-semibold">
                            예금주: {memberData?.buyer?.depositName || "-"}
                        </span>

                    </div>

                </div>
           



                <div className='flex flex-col gap-2 items-center justify-between border border-gray-300 p-4 rounded-lg'>
                    
                    <div className='w-full flex flex-row gap-2 items-center justify-between'>

                        <div className="flex flex-row items-center gap-2">
                            {/* dot */}
                            <div className='w-2 h-2 bg-green-500 rounded-full'></div>
                            <span className="text-lg">
                                회원 정보 수정
                            </span>
                        </div>

                    </div>

                    {/* 은행명, 계좌번호, 예금주 */}
                    <div className='flex flex-col gap-2 items-start justify-between'>

                        {/*                             
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
                        */}


                        <select
                            className="p-2 w-full text-lg text-center bg-zinc-800 rounded-lg text-zinc-100
                            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                            value={bankName}
                            onChange={(e) => {
                                setBankName(e.target.value);
                            }}
                        >
                            <option value="" selected={bankName === ""}>
                                은행명선택
                            </option>
                            <option value="카카오뱅크" selected={bankName === "카카오뱅크"}>
                                카카오뱅크
                            </option>
                            <option value="케이뱅크" selected={bankName === "케이뱅크"}>
                                케이뱅크
                            </option>
                            <option value="토스뱅크" selected={bankName === "토스뱅크"}>
                                토스뱅크
                            </option>
                            <option value="국민은행" selected={bankName === "국민은행"}>
                                국민은행
                            </option>
                            <option value="우리은행" selected={bankName === "우리은행"}>
                                우리은행
                            </option>
                            <option value="신한은행" selected={bankName === "신한은행"}>
                                신한은행
                            </option>
                            <option value="농협" selected={bankName === "농협"}>
                                농협
                            </option>
                            <option value="기업은행" selected={bankName === "기업은행"}>
                                기업은행
                            </option>
                            <option value="하나은행" selected={bankName === "하나은행"}>
                                하나은행
                            </option>
                            <option value="외환은행" selected={bankName === "외환은행"}>
                                외환은행
                            </option>
                            <option value="부산은행" selected={bankName === "부산은행"}>
                                부산은행
                            </option>
                            <option value="대구은행" selected={bankName === "대구은행"}>
                                대구은행
                            </option>
                            <option value="전북은행" selected={bankName === "전북은행"}>
                                전북은행
                            </option>
                            <option value="경북은행" selected={bankName === "경북은행"}>
                                경북은행
                            </option>
                            <option value="광주은행" selected={bankName === "광주은행"}>
                                광주은행
                            </option>
                            <option value="수협" selected={bankName === "수협"}>
                                수협
                            </option>
                            <option value="신협" selected={bankName === "신협"}>
                                신협
                            </option>
                            <option value="씨티은행" selected={bankName === "씨티은행"}>
                                씨티은행
                            </option>
                            <option value="대신은행" selected={bankName === "대신은행"}>
                                대신은행
                            </option>
                            <option value="동양종합금융" selected={bankName === "동양종합금융"}>
                                동양종합금융
                            </option>
                            <option value="산업은행" selected={bankName === "산업은행"}>
                                산업은행
                            </option>
                            {/* 새마을금고 */}
                            <option value="새마을금고" selected={bankName === "새마을금고"}>
                                새마을금고
                            </option>
                        </select>

                        <input
                            disabled={applying}
                            className="p-2 w-64 text-zinc-100 bg-zinc-800 rounded-lg text-lg"
                            placeholder={Enter_your_account_number}
                            value={accountNumber}
                            
                            type='text'
                            inputMode="numeric"
                            pattern="[0-9]*"
                            
                            // disable mouse wheel
                            onWheel={(e) => e.currentTarget.blur()}
                            // remove updown button
                            style={{ MozAppearance: 'textfield' }}
                            


                            onChange={(e) => {

                                // check if the value is a number

                                e.target.value = e.target.value.replace(/[^0-9]/g, '');

                                setAccountNumber(e.target.value);
                            }}
                        />
                        <input 
                            disabled={applying}
                            className="p-2 w-64 text-zinc-100 bg-zinc-800 rounded-lg text-lg"
                            placeholder={Enter_your_account_holder}
                            value={accountHolder}
                            type='text'
                            onChange={(e) => {
                                setAccountHolder(e.target.value);
                            }}
                        />


                        <button
                            disabled={applying || !address}
                            onClick={() => {
                                apply();
                            }}
                            className={`${!bankName || !accountNumber || !accountHolder || applying || !address
                                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                                : "bg-blue-500 text-white hover:bg-blue-600"
                            } p-2 rounded-lg w-64
                            disabled:opacity-50 disabled:cursor-not-allowed
                            `}>
                                
                            {applying ? Applying + "..." : Apply}
                        </button>
                    </div>


                </div>
  

                {/* 회원 등급*/}
                <div className='w-full flex flex-row gap-2 items-center justify-between mt-4 mb-4
                    border border-gray-300 p-4 rounded-lg'>

                    <div className="flex flex-row items-center gap-2">
                        {/* dot */}
                        <div className='w-2 h-2 bg-green-500 rounded-full'></div>
                        <span className="text-lg">
                            회원 등급
                        </span>
                    </div>

          
                    {/* userType */}
                    {/* 일반회원, 1등급 회원, 2등급회원, 3등급회원, 4등급회원 */}
                    <div className='flex flex-col gap-2 items-start justify-between'>
                        <div className="w-full flex flex-row gap-2 items-center justify-start">
                            <span className="text-lg text-zinc-500 font-semibold">
                                현재 등급: {memberData?.userType === 'AAA' ? '1등급 회원' 
                                : memberData?.userType === 'BBB' ? '2등급 회원' 
                                : memberData?.userType === 'CCC' ? '3등급 회원' 
                                : memberData?.userType === 'DDD' ? '4등급 회원' 
                                : '일반 회원'}
                            </span>
                        </div>

                    </div>

                </div>

                {/* 회원 등급 수정 */}
                <div className='w-full flex flex-row gap-2 items-center justify-between mt-4 mb-4
                    border border-gray-300 p-4 rounded-lg'>

                    <div className="flex flex-row items-center gap-2">
                        {/* dot */}
                        <div className='w-2 h-2 bg-green-500 rounded-full'></div>
                        <span className="text-lg">
                            회원 등급 수정
                        </span>
                    </div>

          
                    {/* userType */}
                    {/* 일반회원, 1등급 회원, 2등급회원, 3등급회원, 4등급회원 */}
                    <div className='flex flex-col gap-2 items-start justify-between'>

                        {/* checkbox style radio button */}
                        <div className="w-full flex flex-col gap-2 items-start justify-start">

                            <label className="flex items-center gap-2">
                                <input 
                                    type="radio"
                                    name="userType"
                                    value="normal"
                                    checked={updateUserType === 'normal'}
                                    onChange={() => {
                                        setUpdateUserType('normal');
                                    }}
                                />
                                <span className="text-lg text-zinc-500 font-semibold">
                                    일반 회원
                                </span>
                            </label>

                            <label className="flex items-center gap-2">
                                <input 
                                    type="radio"
                                    name="userType"
                                    value="AAA"
                                    checked={updateUserType === 'AAA'}
                                    onChange={() => {
                                        setUpdateUserType('AAA');
                                    }}
                                />
                                <span className="text-lg text-zinc-500 font-semibold">
                                    1등급 회원
                                </span>
                            </label>

                            <label className="flex items-center gap-2">
                                <input 
                                    type="radio"
                                    name="userType"
                                    value="BBB"
                                    checked={updateUserType === 'BBB'}
                                    onChange={() => {
                                        setUpdateUserType('BBB');
                                    }}
                                />
                                <span className="text-lg text-zinc-500 font-semibold">
                                    2등급 회원
                                </span>
                            </label>

                            <label className="flex items-center gap-2">
                                <input 
                                    type="radio"
                                    name="userType"
                                    value="CCC"
                                    checked={updateUserType === 'CCC'}
                                    onChange={() => {
                                        setUpdateUserType('CCC');
                                    }}
                                />
                                <span className="text-lg text-zinc-500 font-semibold">
                                    3등급 회원
                                </span>
                            </label>

                            <label className="flex items-center gap-2">
                                <input 
                                    type="radio"
                                    name="userType"
                                    value="DDD"
                                    checked={updateUserType === 'DDD'}
                                    onChange={() => {
                                        setUpdateUserType('DDD');
                                    }}
                                />
                                <span className="text-lg text-zinc-500 font-semibold">
                                    4등급 회원
                                </span>
                            </label>

                        </div>


                        <button
                            disabled={!updateUserType || !userStorecode || !userWalletAddress}
                            onClick={async () => {
                                updateUserType && changeUserType(updateUserType);
                                
                            }}
                            className={`${
                                !updateUserType
                                || !userStorecode || !userWalletAddress
                                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                                : "bg-blue-500 text-white hover:bg-blue-600"
                            } p-2 rounded-lg w-64
                            disabled:opacity-50 disabled:cursor-not-allowed
                            `}
                        >
                            {changingUserType ? "변경중..." : "등급 변경하기"}
                        </button>

                    </div>

                </div>




            </div>

        </main>

    );
}

