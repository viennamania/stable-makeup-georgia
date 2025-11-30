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





export default function TradeDetailsPage({ params }: any) {


    //console.log("params", params);
    
    const searchParams = useSearchParams();
 
    const tradeId = searchParams.get('tradeId') || '';


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

      
 




    /*
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

            setMemberData(data.result);
        })
        .finally(() => {
            setFetchingMemberData(false);
        });

    } , [userStorecode, userWalletAddress]);
    */

    const [tradeData, setTradeData] = useState<any>(null);

    const [fetchingTradeData, setFetchingTradeData] = useState(false);

    useEffect(() => {

        if (!tradeId) {
            return;
        }

        setFetchingTradeData(true);

        fetch('/api/order/getOneBuyOrderByTradeId', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                tradeId: tradeId,
            }),
        }).then((response) => response.json())
        .then((data) => {


            //console.log("tradeData data", data);

            setTradeData(data.result);
        })
        .finally(() => {
            setFetchingTradeData(false);
        });

    } , [tradeId]);


    const [applying, setApplying] = useState(false);

    const [buyerBankInfo, setBuyerBankInfo] = useState({
        bankName: '',
        accountNumber: '',
        accountHolder: '',
    });

    const apply = async () => {
      if (applying) {
        return;
      }

        setApplying(true);
        try {
            // apply buyer bank info update
            const response = await fetch('/api/order/updateBuyerBankInfoUpdate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    tradeId: tradeId,
                    buyerBankInfo: buyerBankInfo,
                }),
            });
            const data = await response.json();
            if (data.error) {
                toast.error(data.error);
            } else {
                toast.success('Buyer bank info update applied successfully');
                
                //console.log("updated trade data", data);

                // reload trade data
                setTradeData(data.result);

            }
        } catch (error) {
            console.error('Error applying buyer bank info update:', error);
            toast.error('Failed to apply buyer bank info update');
        } finally {
            setApplying(false);
        }

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

{/*
{
    "_id": "6928f3b8bc8881e6517b6694",
    "chain": "ethereum",
    "lang": null,
    "agentcode": "cwftsfql",
    "agent": {
        "_id": "68acffbb6d8d0d08f1a09f73",
        "agentcode": "cwftsfql",
        "agentName": "DESSERT",
        "agentType": "test",
        "agentUrl": "https://test.com",
        "agentDescription": "설명입니다.",
        "agentLogo": "https://t0gqytzvlsa2lapo.public.blob.vercel-storage.com/vVWYCe5-aDUc19iU60ae9FwJhXBfRtiOwVqC5v.png",
        "agentBanner": "https://cryptoss.beauty/logo.png",
        "createdAt": "2025-08-26T00:28:43.066Z",
        "adminWalletAddress": "0x4429A977379fdd42b54A543E91Da81Abe7bb52FD",
        "agentFeeWalletAddress": "0x4429A977379fdd42b54A543E91Da81Abe7bb52FD",
        "usdtKRWRate": 1370,
        "totalStoreCount": 7,
        "totalKrwAmount": 72141210,
        "totalKrwAmountClearance": 0,
        "totalPaymentConfirmedClearanceCount": 0,
        "totalPaymentConfirmedCount": 498,
        "totalUsdtAmount": 246.9,
        "totalUsdtAmountClearance": 0,
        "totalFeeAmount": 102.994,
        "totalFeeAmountKRW": 142454.01,
        "totalSettlementAmount": 24199.060999999998,
        "totalSettlementAmountKRW": 33760963,
        "totalSettlementCount": 216
    },
    "storecode": "tqjagtqs",
    "store": {
        "_id": "68d8b052723a9db0dfdfc78a",
        "agentcode": "cwftsfql",
        "storecode": "tqjagtqs",
        "storeName": "OAKELY",
        "storeType": "test",
        "storeUrl": "https://test.com",
        "storeDescription": "오클리",
        "storeLogo": "https://t0gqytzvlsa2lapo.public.blob.vercel-storage.com/xl8c0Ck-t8DQa1dVKJIFUbGln2M4r9cZkNgqrt.png",
        "adminWalletAddress": "0xf4eF908045D956cc6e24C23d845cd0631FAB5152",
        "settlementWalletAddress": "0x3A222E7e485B67D2994BBDcA3497a21C43D7c4E3",
        "settlementFeeWalletAddress": "0xC2A022Acb3F4c8ecA828C8F4896391c7df641145",
        "settlementFeePercent": 0.3,
        "sellerWalletAddress": "0x7F3362c7443AE1Eb1790d0A2d4D84EB306fE0bd3",
        "totalBuyerCount": 247,
        "bankInfo": {
            "bankName": "신한은행",
            "accountNumber": "2794982374982",
            "accountHolder": "고민지"
        },
        "totalSettlementAmount": 16409.756,
        "agentFeePercent": 0.15
    },
    "walletAddress": "0x7F3362c7443AE1Eb1790d0A2d4D84EB306fE0bd3",
    "nickname": "seller",
    "mobile": "",
    "avatar": null,
    "usdtAmount": 0.07,
    "krwAmount": 100,
    "rate": 1390,
    "createdAt": "2025-11-28T00:58:32.187Z",
    "status": "paymentRequested",
    "privateSale": true,
    "buyer": {
        "depositName": "",
        "bankInfo": {
            "bankName": "광주은행",
            "accountNumber": "2379482492",
            "accountHolder": "마성진"
        }
    },
    "tradeId": "895619737",
    "transactionHash": "0x",
    "queueId": null,
    "acceptedAt": "2025-11-28T00:58:36.447Z",
    "seller": {
        "walletAddress": "0x3A222E7e485B67D2994BBDcA3497a21C43D7c4E3",
        "nickname": "seller",
        "avatar": "",
        "mobile": "+82",
        "memo": null,
        "bankInfo": {
            "bankName": "케이뱅크",
            "accountNumber": "2794983223",
            "accountHolder": "문소영",
            "amount": 100
        }
    },
    "escrowTransactionHash": "0x",
    "paymentRequestedAt": "2025-11-28T00:58:39.800Z"
}
*/}

            

                <div className='
                    mt-4 mb-4 w-full
                    flex flex-row gap-2 items-center justify-between border border-gray-300 p-4 rounded-lg'>

                    <div className="flex flex-row items-center gap-2">
                        {/* dot */}
                        <div className='w-2 h-2 bg-green-500 rounded-full'></div>
                        <span className="text-lg">
                            거래 정보
                        </span>
                    </div>

                </div>

                <div className='w-full flex flex-col gap-4'>

                    {fetchingTradeData ? (
                        <div className='w-full flex items-center justify-center'>
                            <span className='text-gray-500'>
                                거래 정보를 불러오는 중...
                            </span>
                        </div>
                    ) : (
                        <>
                            {tradeData ? (
                                <div className='w-full flex flex-col gap-2'>

                                    <div>
                                        <span className='font-semibold'>
                                            거래 ID:
                                        </span>
                                        <span className='ml-2'>
                                            {tradeData.tradeId}
                                        </span>
                                    </div>

                                    <div>
                                        <span className='font-semibold'>
                                            상태:
                                        </span>
                                        <span className='ml-2'>
                                            {tradeData.status}
                                        </span>
                                    </div>

                                    <div>
                                        <span className='font-semibold'>
                                            구매자 지갑 주소:
                                        </span>
                                        <span className='ml-2'>
                                            {tradeData.walletAddress}
                                        </span>
                                    </div>

                                    <div>
                                        <span className='font-semibold'>
                                            USDT 금액:
                                        </span>
                                        <span className='ml-2'>
                                            {tradeData.usdtAmount} USDT
                                        </span>
                                    </div>

                                    {/* buyer bank info */}
                                    <div>
                                        <span className='font-semibold'>
                                            구매자 은행 정보:
                                        </span>

                                        <div className='ml-4 mt-1'>

                                            <div>
                                                <span className='font-semibold'>
                                                    은행명:
                                                </span>
                                                <span className='ml-2'>
                                                    {tradeData?.buyer?.bankInfo?.bankName
                                                    ? tradeData.buyer.bankInfo.bankName : '정보 없음'}
                                                </span>
                                                <input
                                                    type="text"
                                                    className='w-full border border-gray-300 rounded-md p-1 mt-1 text-sm text-gray-700'
                                                    placeholder="은행명 입력"
                                                    value={buyerBankInfo.bankName}
                                                    onChange={(e) => setBuyerBankInfo({
                                                        ...buyerBankInfo,
                                                        bankName: e.target.value,
                                                    })}
                                                />
                                            </div>
                                            <div>
                                                <span className='font-semibold'>
                                                    계좌번호:
                                                </span>
                                                <span className='ml-2'>
                                                    {tradeData?.buyer?.bankInfo?.accountNumber
                                                    ? tradeData.buyer.bankInfo.accountNumber : '정보 없음'}
                                                </span>
                                                <input
                                                    type="text"
                                                    className='w-full border border-gray-300 rounded-md p-1 mt-1 text-sm text-gray-700'
                                                    placeholder="계좌번호 입력"
                                                    value={buyerBankInfo.accountNumber}
                                                    onChange={(e) => setBuyerBankInfo({
                                                        ...buyerBankInfo,
                                                        accountNumber: e.target.value,
                                                    })}
                                                />
                                            </div>
                                            <div>
                                                <span className='font-semibold'>
                                                    예금주명:
                                                </span>
                                                <span className='ml-2'>
                                                    {tradeData?.buyer?.bankInfo?.accountHolder
                                                    ? tradeData.buyer.bankInfo.accountHolder : '정보 없음'}
                                                </span>
                                                <input
                                                    type="text"
                                                    className='w-full border border-gray-300 rounded-md p-1 mt-1 text-sm text-gray-700'
                                                    placeholder="예금주명 입력"
                                                    value={buyerBankInfo.accountHolder}
                                                    onChange={(e) => setBuyerBankInfo({
                                                        ...buyerBankInfo,
                                                        accountHolder: e.target.value,
                                                    })}
                                                />
                                            </div>

                                        </div>

                                        <button
                                            className={`
                                                mt-2 w-full
                                                ${applying ? 'bg-gray-400' : 'bg-blue-500 hover:bg-blue-600'}
                                                text-white font-semibold py-2 px-4 rounded-md
                                            `}
                                            onClick={apply}
                                            disabled={applying}
                                        >
                                            {applying ? '적용 중...' : '구매자 은행 정보 업데이트 적용'}
                                        </button>

                                    </div>

                                </div>
                            ) : (
                                <div className='w-full flex items-center justify-center'>
                                    <span className='text-gray-500'>
                                        거래 정보를 찾을 수 없습니다.
                                    </span>
                                </div>
                            )}
                        </>
                    )}

                </div>

            </div>

        </main>

    );
}

