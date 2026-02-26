// send USDT
'use client';


import React, { use, useEffect, useState } from 'react';

import { toast } from 'react-hot-toast';
import { client } from '../../../client';

import {
    //ThirdwebProvider,
    ConnectButton,
  
    useConnect,
  
    useReadContract,
  
    useActiveWallet,

    useActiveAccount,
    useSendBatchTransaction,

    useConnectedWallets,

    useSetActiveWallet,
    
} from "thirdweb/react";



import {
  getContract,
  //readContract,
  sendTransaction,
  sendAndConfirmTransaction,
} from "thirdweb";

import {
  balanceOf,
  transfer,
} from "thirdweb/extensions/erc20";
 


import {
  createWallet,
  inAppWallet,
} from "thirdweb/wallets";

import Image from 'next/image';

import AppBarComponent from "@/components/Appbar/AppBar";
import { getDictionary } from "../../../dictionaries";



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
} from "@/app/config/contractAddresses";




const wallets = [
  inAppWallet({
    auth: {
      options: ["email", "google"],
    },
  }),
];




const contractAddress = "0xc2132D05D31c914a87C6611C10748AEb04B58e8F"; // USDT on Polygon


const contractAddressArbitrum = "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9"; // USDT on Arbitrum






/*
const smartWallet = new smartWallet(config);
const smartAccount = await smartWallet.connect({
  client,
  personalAccount,
});
*/

import {
  useRouter,
  useSearchParams
} from "next//navigation";

import { Select } from '@mui/material';
import { Sen } from 'next/font/google';
import { Router } from 'next/router';
import path from 'path';









export default function SendUsdt({ params }: any) {


  //console.log("params", params);

  const searchParams = useSearchParams()!;

  // vault wallet address
  const walletAddress = searchParams.get('walletAddress');
  
  const contract = getContract({
    // the client you have created via `createThirdwebClient()`
    client,
    // the chain the contract is deployed on
    
    
    chain: chain === "ethereum" ? ethereum :
            chain === "polygon" ? polygon :
            chain === "arbitrum" ? arbitrum :
            chain === "bsc" ? bsc : arbitrum,

    address: chain === "ethereum" ? ethereumContractAddressUSDT :
            chain === "polygon" ? polygonContractAddressUSDT :
            chain === "arbitrum" ? arbitrumContractAddressUSDT :
            chain === "bsc" ? bscContractAddressUSDT : arbitrumContractAddressUSDT,


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

    USDT_sent_successfully: "",
    Failed_to_send_USDT: "",

    Go_Buy_USDT: "",
    Enter_Wallet_Address: "",
    Enter_the_amount_and_recipient_address: "",
    Select_a_user: "",
    User_wallet_address: "",
    This_address_is_not_white_listed: "",
    If_you_are_sure_please_click_the_send_button: "",

    Sending: "",

    Anonymous: "",

    Copied_Wallet_Address: "",
    Withdraw_USDT: "",

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

    USDT_sent_successfully,
    Failed_to_send_USDT,

    Go_Buy_USDT,
    Enter_Wallet_Address,
    Enter_the_amount_and_recipient_address,
    Select_a_user,
    User_wallet_address,
    This_address_is_not_white_listed,
    If_you_are_sure_please_click_the_send_button,

    Sending,

    Anonymous,

    Copied_Wallet_Address,
    Withdraw_USDT,

  } = data;



  const router = useRouter();



  const activeAccount = useActiveAccount();

  const address = activeAccount?.address;





  const [user, setUser] = useState(
    {
      _id: '',
      id: 0,
      email: '',
      nickname: '',
      avatar: '',
      mobile: '',
      walletAddress: '',
      createdAt: '',
      settlementAmountOfFee: '',
    }
  );
  const [loadingUser, setLoadingUser] = useState(true);

  // if role is admin
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {

    if (!address) return;

    const getUser = async () => {
      setLoadingUser(true);

      const response = await fetch('/api/user/getUserByWalletAddress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          storecode: 'admin',
          walletAddress: address,
        }),
      });

      const data = await response.json();

      //console.log("getUserByWalletAddress", data);


      setUser(data.result);

      if (data.result && data.result?.role === 'admin') {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }

      setLoadingUser(false);

    };

    address && getUser();

  }, [address]);





  const [walletBalance, setWalletBalance] = useState(0);
  useEffect(() => {

    // get the balance
    const getBalance = async () => {


      const result = await balanceOf({
        //contract,
        contract: contract,
        address: walletAddress as string,
      });

      if (chain === "bsc") {
        setWalletBalance( Number(result) / 10 ** 18 );
      } else {
        setWalletBalance( Number(result) / 10 ** 6 );
      }

    };

    if (walletAddress) getBalance();

    const interval = setInterval(() => {
      if (walletAddress) getBalance();
    } , 5000);

    return () => clearInterval(interval);

  //} , [walletAddress, contract, params.center]);

  } , [walletAddress, contract]);

  // get user info by wallet address
  /*
  {
    "_id": "68fec05162e030d977139b30",
    "id": 5663419,
    "email": null,
    "nickname": "seller",
    "mobile": "",
    "storecode": "admin",
    "store": {
        "_id": "68acfb572a08ad7c665d6fed",
        "storecode": "admin",
        "storeName": "당근",
        "storeType": "test",
        "storeUrl": "https://test.com",
        "storeDescription": "일반구매가맹점입니다.",
        "storeLogo": "https://t0gqytzvlsa2lapo.public.blob.vercel-storage.com/oVV0onv-eTf0qyR7lklOPyK7p27EkfD4pif5Kk.png",
        "storeBanner": "https://cryptopay.beauty/logo.png",
        "createdAt": "2025-05-06T07:14:00.744Z",
        "totalBuyerCount": 4,
        "settlementFeeWalletAddress": "0x4c4Df6ADe9a534c6fD4F46217012B8A13679673f",
        "totalKrwAmount": 352000,
        "totalPaymentConfirmedCount": 75,
        "totalUsdtAmount": 255.036,
        "adminWalletAddress": "0x4c4Df6ADe9a534c6fD4F46217012B8A13679673f",
        "settlementWalletAddress": "0x4c4Df6ADe9a534c6fD4F46217012B8A13679673f",
        "settlementFeePercent": 0.4,
        "sellerWalletAddress": "0xDF5106958d5639395498B021052f22b482093813",
        "bankInfo": {
            "bankName": "카카오뱅크",
            "accountNumber": "9802938402",
            "accountHolder": "김이정"
        },
        "agentcode": "ogsxorrs",
        "agentFeePercent": 0.1,
        "backgroundColor": "red-500",
        "payactionKey": {
            "payactionApiKey": "305OP202EEOP",
            "payactionWebhookKey": "24AMJQ378JFO",
            "payactionShopId": "1746684776128x428338616198234100"
        },
        "totalKrwAmountClearance": 0,
        "totalPaymentConfirmedClearanceCount": 0,
        "totalUsdtAmountClearance": 0,
        "withdrawalBankInfo": {
            "bankName": "전북은행",
            "accountNumber": "4902304032",
            "accountHolder": "장정수",
            "accountBankCode": null,
            "createdAt": "2025-07-17T15:36:25.405Z"
        },
        "storeMemo": "<script src=\"https://cryptoss.beauty/ko/mgorlkxu/payment?storeUser=matoto44&depositBankName=카카오뱅크&depositBankAccountNumber=3333338246503&depositName=허경수&depositAmountKrw=10000\">결제하기</script>"
    },
    "walletAddress": "0x7F3362c7443AE1Eb1790d0A2d4D84EB306fE0bd3",
    "createdAt": "2025-08-26T00:10:35.718Z",
    "settlementAmountOfFee": "0",
    "verified": true,
    "seller": {
        "status": "confirmed"
    }
  }
  */
  const [userInfo, setUserInfo] = useState(null as any);
  useEffect(() => {

    const getUserInfo = async () => {

      const response = await fetch('/api/user/getUserByWalletAddress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          storecode: 'admin',
          walletAddress: walletAddress,
        }),
      });

      const data = await response.json();

      //console.log("getUserInfo", data);

      setUserInfo(data.result);

    };

    if (walletAddress) getUserInfo();

  } , [walletAddress]);







  // get list of user wallets from api
  const [users, setUsers] = useState([
    {
      _id: '',
      id: 0,
      email: '',
      avatar: '',
      nickname: '',
      mobile: '',
      walletAddress: '',
      createdAt: '',
      settlementAmountOfFee: '',
    }
  ]);


  const [totalCountOfUsers, setTotalCountOfUsers] = useState(0);

  useEffect(() => {

    if (!address) return;

    const getUsers = async () => {

      const response = await fetch('/api/user/getAllAdmins', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          storecode: 'admin',
        }),
      });

      const data = await response.json();

      //console.log("getUsers", data);


      ///setUsers(data.result.users);
      // set users except the current user

      setUsers(data.result.users.filter((user: any) => user.walletAddress === address));
 
      setTotalCountOfUsers(data.result.totalCount);

    };

    getUsers();


  }, [address]);






  const [recipient, setRecipient] = useState({
    _id: '',
    id: 0,
    email: '',
    nickname: '',
    avatar: '',
    mobile: '',
    walletAddress: '',
    createdAt: '',
    settlementAmountOfFee: '',
  });



  ///console.log("recipient", recipient);

  //console.log("recipient.walletAddress", recipient.walletAddress);
  //console.log("amount", amount);



  
  const [amount, setAmount] = useState<number | string>(0);

  const [sending, setSending] = useState(false);
  const sendUsdt = async () => {
    if (sending) {
      return;
    }


    if (!recipient.walletAddress) {
      toast.error('Please enter a valid address');
      return;
    }

    if (!amount) {
      toast.error('Please enter a valid amount');
      return;
    }


    setSending(true);

    try {
      const response = await fetch('/api/vault/withdrawVault', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress: walletAddress,
          toAddress: recipient.walletAddress,
          amount: amount,
        }),
      });

      const data = await response.json();

      //console.log("withdrawVault", data);

      const isSuccess = data?.success ?? Boolean(data?.result);

      if (isSuccess) {
        toast.success(USDT_sent_successfully);

        // reset amount
        setAmount(0);

        // reset recipient
        setRecipient({
          _id: '',
          id: 0,
          email: '',
          nickname: '',
          avatar: '',
          mobile: '',
          walletAddress: '',
          createdAt: '',
          settlementAmountOfFee: '',
        });

      } else {
        toast.error(data?.message || data?.error || Failed_to_send_USDT);
      }


    } catch (error) {
      toast.error(Failed_to_send_USDT);
    }

    setSending(false);
  };



  // get user by wallet address
  const getUserByWalletAddress = async (walletAddress: string) => {

    const response = await fetch('/api/user/getUserByWalletAddress', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        walletAddress: walletAddress,
      }),
    });

    const data = await response.json();

    //console.log("getUserByWalletAddress", data);

    return data.result;

  };
  
  ///const [wantToReceiveWalletAddress, setWantToReceiveWalletAddress] = useState(false);


  const [wantToReceiveWalletAddress, setWantToReceiveWalletAddress] = useState(false);



  const [isWhateListedUser, setIsWhateListedUser] = useState(false);

  
  useEffect(() => {

    if (!recipient?.walletAddress) {
      return;
    }

    // check recipient.walletAddress is in the user list
    getUserByWalletAddress(recipient?.walletAddress)
    .then((data) => {
        
        //console.log("data============", data);
  
        const checkUser = data

        if (checkUser) {
          setIsWhateListedUser(true);

          setRecipient(checkUser as any);

        } else {
          setIsWhateListedUser(false);

          setRecipient({


            _id: '',
            id: 0,
            email: '',
            nickname: '',
            avatar: '',
            mobile: '',
            walletAddress: recipient?.walletAddress,
            createdAt: '',
            settlementAmountOfFee: '',

          });


        }

    });

  } , [recipient?.walletAddress]);


  const formattedWalletBalance = Number(walletBalance || 0)
    .toFixed(2)
    .replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const senderName = userInfo?.nickname || Anonymous;
  const canSend = Boolean(address && recipient?.walletAddress && amount && !sending);

  if (!address) {
    return (
      <main className="min-h-[100vh] bg-zinc-100 px-4 py-10">
        <div className="mx-auto max-w-lg rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-sm">
          <div className="text-lg font-semibold text-zinc-700">{Please_connect_your_wallet_first}</div>
        </div>
      </main>
    );
  }

  if (loadingUser) {
    return (
      <main className="min-h-[100vh] bg-zinc-100 px-4 py-10">
        <div className="mx-auto max-w-lg rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-sm">
          <div className="text-lg font-semibold text-zinc-700">회원 정보를 불러오는 중...</div>
        </div>
      </main>
    );
  }

  if (!isAdmin) {
    return (
      <main className="min-h-[100vh] bg-zinc-100 px-4 py-10">
        <div className="mx-auto max-w-lg rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm">
          <div className="text-lg font-semibold text-red-500">You do not have permission to access this page.</div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[100vh] bg-zinc-100 px-4 py-6 sm:py-10">
      <div className="mx-auto w-full max-w-4xl">
        <div className="rounded-3xl border border-zinc-200 bg-white p-4 shadow-lg sm:p-6">
          {params.center && (
            <div className="mb-5 inline-flex items-center rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-semibold tracking-wide text-zinc-600">
              CENTER {params.center}
            </div>
          )}

          <div className="flex items-center justify-between gap-3">
            <button
              onClick={() => window.history.back()}
              className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-sm font-semibold text-zinc-600 transition hover:bg-zinc-50"
            >
              <Image
                src="/icon-back.png"
                alt="Back"
                width={18}
                height={18}
                className="rounded-full"
              />
              돌아가기
            </button>
          </div>

          <div className="mt-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 ring-1 ring-emerald-200">
              <Image
                src="/logo-tether.svg"
                alt="USDT"
                width={24}
                height={24}
                className="h-6 w-6"
              />
            </div>
            <div>
              <div className="text-2xl font-bold text-zinc-900">{Withdraw_USDT}</div>
              <div className="text-sm text-zinc-500">Vault 지갑에서 USDT를 안전하게 전송합니다.</div>
            </div>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-[1.3fr_1fr]">
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 sm:p-5">
              <div className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">Sender Wallet</div>
              <div className="mt-3 flex items-start gap-2">
                <Image
                  src="/icon-shield.png"
                  alt="shield"
                  width={18}
                  height={18}
                  className="mt-0.5 h-[18px] w-[18px]"
                />
                <span className="break-all text-sm font-semibold text-zinc-700">{walletAddress}</span>
              </div>

              <div className="mt-3 inline-flex items-center gap-2 rounded-xl bg-white px-3 py-2 ring-1 ring-zinc-200">
                <Image
                  src="/icon-seller.png"
                  alt="seller"
                  width={18}
                  height={18}
                />
                <span className="text-sm font-semibold text-zinc-800">{senderName}</span>
              </div>
            </div>

            <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-4 sm:p-5">
              <div className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">Available Balance</div>
              <div className="mt-3 flex items-end gap-2">
                <Image
                  src="/token-usdt-icon.png"
                  alt="USDT"
                  width={30}
                  height={30}
                  className="mb-1 rounded-full"
                />
                <span
                  className="text-3xl font-bold text-emerald-700 sm:text-4xl"
                  style={{ fontFamily: 'monospace' }}
                >
                  {formattedWalletBalance}
                </span>
                <span className="mb-1 text-sm font-semibold text-emerald-700/80">USDT</span>
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="text-base font-semibold text-zinc-900">{Enter_the_amount_and_recipient_address}</div>

            <div className="mt-4">
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">Amount</label>
              <input
                disabled={sending}
                type="number"
                className="w-full rounded-xl border border-zinc-300 bg-zinc-50 px-4 py-3 text-3xl font-bold text-zinc-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 sm:text-4xl"
                value={amount}
                onChange={(e) => setAmount(e.target.value as any)}
              />
            </div>

            <div className="mt-4">
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">Recipient</label>

              {!wantToReceiveWalletAddress ? (
                <>
                  <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                    <select
                      disabled={sending}
                      className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-3 text-base font-semibold text-zinc-800 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                      value={recipient?.nickname}
                      onChange={(e) => {
                        const selectedUser = users.find((user) => user.nickname === e.target.value) as any;
                        setRecipient(selectedUser);
                      }}
                    >
                      <option value="">{Select_a_user}</option>
                      {users.map((user) => (
                        <option key={user.id} value={user.nickname}>{user.nickname}</option>
                      ))}
                    </select>

                    <div className="flex min-h-[42px] items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-3">
                      <Image
                        src={recipient?.avatar || '/icon-user.png'}
                        alt="profile"
                        width={34}
                        height={34}
                        className="h-8 w-8 rounded-full object-cover"
                      />
                      {recipient?.walletAddress && (
                        <Image
                          src="/verified.png"
                          alt="verified"
                          width={20}
                          height={20}
                        />
                      )}
                    </div>
                  </div>

                  <input
                    disabled={true}
                    type="text"
                    placeholder={User_wallet_address}
                    className="mt-3 w-full rounded-xl border border-zinc-300 bg-zinc-900 px-3 py-3 text-sm font-semibold text-zinc-100"
                    value={recipient?.walletAddress}
                    onChange={(e) => {
                      getUserByWalletAddress(e.target.value).then((data) => {
                        const checkUser = data;
                        if (checkUser) {
                          setRecipient(checkUser as any);
                        } else {
                          setRecipient({
                            ...recipient,
                            walletAddress: e.target.value,
                          });
                        }
                      });
                    }}
                  />
                </>
              ) : (
                <div className="flex flex-col gap-4">
                  <input
                    disabled={sending}
                    type="text"
                    placeholder={User_wallet_address}
                    className="w-full rounded-xl border border-zinc-300 bg-zinc-900 px-3 py-3 text-sm font-semibold text-zinc-100"
                    value={recipient.walletAddress}
                    onChange={(e) => setRecipient({
                      ...recipient,
                      walletAddress: e.target.value,
                    })}
                  />

                  {isWhateListedUser ? (
                    <div className="inline-flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 ring-1 ring-emerald-200">
                      <Image
                        src={recipient.avatar || '/profile-default.png'}
                        alt="profile"
                        width={30}
                        height={30}
                        className="h-8 w-8 rounded-full object-cover"
                      />
                      <div className="text-sm font-semibold text-emerald-700">{recipient?.nickname}</div>
                      <Image
                        src="/verified.png"
                        alt="verified"
                        width={20}
                        height={20}
                      />
                    </div>
                  ) : (
                    <>
                      {recipient?.walletAddress && (
                        <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
                          {This_address_is_not_white_listed}
                          <br />
                          {If_you_are_sure_please_click_the_send_button}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>

            <button
              disabled={!canSend}
              onClick={sendUsdt}
              className={`mt-6 w-full rounded-xl px-4 py-3 text-lg font-bold transition ${
                canSend
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-200 hover:brightness-105'
                  : 'cursor-not-allowed bg-zinc-200 text-zinc-400'
              }`}
            >
              {Send_USDT}
            </button>

            {sending && (
              <div className="mt-3 flex items-center gap-2 text-sm font-semibold text-zinc-600">
                <Image
                  src="/loading.png"
                  alt="loading"
                  width={18}
                  height={18}
                  className="h-[18px] w-[18px] animate-spin"
                />
                <span>{Sending}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );

}
