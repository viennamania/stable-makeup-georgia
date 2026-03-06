// send USDT
'use client';


import React, { use, useEffect, useState } from 'react';

import { toast } from 'react-hot-toast';
import { client } from '../../client';

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
import { getDictionary } from "../../dictionaries";



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



  const [amount, setAmount] = useState(0);




  const [nativeBalance, setNativeBalance] = useState(0);
  const [balance, setBalance] = useState(0);
  useEffect(() => {

    // get the balance
    const getBalance = async () => {


      const result = await balanceOf({
        //contract,
        contract: contract,
        address: address || "",
      });

      if (chain === "bsc") {
        setBalance( Number(result) / 10 ** 18 );
      } else {
        setBalance( Number(result) / 10 ** 6 );
      }

    };

    if (address) getBalance();

    const interval = setInterval(() => {
      if (address) getBalance();
    } , 5000);

    return () => clearInterval(interval);

  //} , [address, contract, params.center]);

  } , [address, contract]);








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

  useEffect(() => {

    if (!address) return;

    const getUser = async () => {

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


      setUser(data.result);

    };

    getUser();

  }, [address]);



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

      const response = await fetch('/api/user/getAllUsers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      const data = await response.json();

      //console.log("getUsers", data);


      ///setUsers(data.result.users);
      // set users except the current user

      setUsers(data.result.users.filter((user: any) => user.walletAddress !== address));



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



  const [otp, setOtp] = useState('');

  const [verifiedOtp, setVerifiedOtp] = useState(false);


  const [isSendedOtp, setIsSendedOtp] = useState(false);



  const [isSendingOtp, setIsSendingOtp] = useState(false);

  const [isVerifingOtp, setIsVerifingOtp] = useState(false);
  const [otpCooldownSec, setOtpCooldownSec] = useState(0);
  const [recipientSuffixConfirm, setRecipientSuffixConfirm] = useState("");
  const [isWhateListedUser, setIsWhateListedUser] = useState(false);

  


  const [sending, setSending] = useState(false);
  const [confirmExternalRecipient, setConfirmExternalRecipient] = useState(false);
  const isValidEvmAddress = (value: string) => /^0x[a-fA-F0-9]{40}$/.test(value.trim());

  useEffect(() => {
    setConfirmExternalRecipient(false);
    setVerifiedOtp(false);
    setIsSendedOtp(false);
    setOtp("");
    setRecipientSuffixConfirm("");
  }, [recipient?.walletAddress, isWhateListedUser, amount]);

  useEffect(() => {
    if (otpCooldownSec <= 0) {
      return;
    }
    const timer = setTimeout(() => {
      setOtpCooldownSec((prev) => Math.max(prev - 1, 0));
    }, 1000);
    return () => clearTimeout(timer);
  }, [otpCooldownSec]);

  const sendOtp = async () => {
    if (isSendingOtp || otpCooldownSec > 0) {
      return;
    }

    const senderWalletAddress = String(address || "").trim();
    const recipientWalletAddress = String(recipient?.walletAddress || "").trim();
    const senderMobile = String((user as any)?.mobile || "").trim();

    if (!senderWalletAddress || !recipientWalletAddress || Number(amount) <= 0) {
      toast.error("수신 지갑주소와 출금 금액을 먼저 입력해주세요.");
      return;
    }

    if (!senderMobile) {
      toast.error("OTP를 받을 휴대폰 번호가 등록되어 있지 않습니다.");
      return;
    }

    setIsSendingOtp(true);
    try {
      const response = await fetch('/api/transaction/setOtp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lang: params.lang,
          chain: params.center || chain,
          walletAddress: senderWalletAddress,
          mobile: senderMobile,
        }),
      });
      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.result) {
        if (data?.retryAfterSec) {
          toast.error(`OTP 재요청 대기시간 ${data.retryAfterSec}s`);
        } else {
          toast.error(String(data?.message || "OTP 발송에 실패했습니다."));
        }
        return;
      }

      setVerifiedOtp(false);
      setIsSendedOtp(true);
      setOtpCooldownSec(180);
      toast.success("OTP를 발송했습니다.");
    } catch (error) {
      console.error("sendOtp failed", error);
      toast.error("OTP 발송 중 오류가 발생했습니다.");
    } finally {
      setIsSendingOtp(false);
    }
  };

  const verifyOtp = async () => {
    if (isVerifingOtp) {
      return;
    }

    const senderWalletAddress = String(address || "").trim();
    if (!senderWalletAddress || !otp) {
      toast.error("OTP 코드를 입력해주세요.");
      return;
    }

    setIsVerifingOtp(true);
    try {
      const response = await fetch('/api/transaction/verifyOtp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lang: params.lang,
          chain: params.center || chain,
          walletAddress: senderWalletAddress,
          otp,
        }),
      });
      const data = await response.json().catch(() => null);

      if (!response.ok || data?.status !== "success") {
        setVerifiedOtp(false);
        toast.error(String(data?.message || "OTP 인증에 실패했습니다."));
        return;
      }

      setVerifiedOtp(true);
      toast.success("OTP 인증이 완료되었습니다.");
    } catch (error) {
      console.error("verifyOtp failed", error);
      setVerifiedOtp(false);
      toast.error("OTP 인증 중 오류가 발생했습니다.");
    } finally {
      setIsVerifingOtp(false);
    }
  };

  const sendUsdt = async () => {
    if (sending) {
      return;
    }

    const recipientWalletAddress = String(recipient?.walletAddress || "").trim();
    const senderWalletAddress = String(address || "").trim();


    if (!recipientWalletAddress) {
      toast.error('Please enter a valid address');
      return;
    }

    if (!isValidEvmAddress(recipientWalletAddress)) {
      toast.error("유효한 외부 지갑주소(0x...)를 입력해주세요.");
      return;
    }

    if (senderWalletAddress && recipientWalletAddress.toLowerCase() === senderWalletAddress.toLowerCase()) {
      toast.error("내 지갑주소로는 출금할 수 없습니다.");
      return;
    }

    if (!isWhateListedUser && !confirmExternalRecipient) {
      toast.error("외부 지갑주소 위험 안내를 확인해주세요.");
      return;
    }

    if (!verifiedOtp) {
      toast.error("OTP 인증이 완료되어야 출금할 수 있습니다.");
      return;
    }

    if (needsRecipientSuffixConfirm && !recipientSuffixMatched) {
      toast.error("수신 지갑주소 끝 6자리를 정확히 입력해주세요.");
      return;
    }

    if (!amount) {
      toast.error('Please enter a valid amount');
      return;
    }

    //console.log('amount', amount, "balance", balance);

    if (Number(amount) > balance) {
      toast.error('Insufficient balance');
      return;
    }

    setSending(true);

    try {



        // send USDT
        // Call the extension function to prepare the transaction
        const transaction = transfer({
            //contract,

            contract: contract,

            to: recipientWalletAddress,
            amount: amount,
        });
        

        /*
        const transactionResult = await sendAndConfirmTransaction({

            transaction: transaction,
            
            account: smartAccount as any,
        });

        console.log("transactionResult", transactionResult);
        
        if (transactionResult.status !== "success") {
          toast.error(Failed_to_send_USDT);
          return;
        }
        */

        /*
        const { transactionHash } = await sendTransaction({
          
          account: activeAccount as any,

          transaction,
        });
        */
        // sendAndConfirmTransaction
        const { transactionHash } = await sendAndConfirmTransaction({
          transaction: transaction,
          account: activeAccount as any,
        });

        
        if (transactionHash) {


          await fetch('/api/transaction/setTransfer', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              lang: params.lang,
              chain: params.center,
              walletAddress: address,
              amount: amount,
              toWalletAddress: recipientWalletAddress,
            }),
          });



          toast.success(USDT_sent_successfully);

          setAmount(0); // reset amount
          setOtp("");
          setIsSendedOtp(false);
          setVerifiedOtp(false);
          setConfirmExternalRecipient(false);
          setRecipientSuffixConfirm("");

          // refresh balance

          // get the balance

          const result = await balanceOf({
            contract,
            address: address || "",
          });

          if (chain === "bsc") {
            setBalance( Number(result) / 10 ** 18 );
          } else {
            setBalance( Number(result) / 10 ** 6 );
          }


        } else {

          toast.error(Failed_to_send_USDT);

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


  const [wantToReceiveWalletAddress, setWantToReceiveWalletAddress] = useState(true);



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
  




  const hasAddress = Boolean(address);
  const hasRecipient = Boolean(String(recipient?.walletAddress || "").trim());
  const hasAmount = Number(amount) > 0;
  const needsExternalConfirmation = hasRecipient && !isWhateListedUser;
  const externalHighAmountThreshold = 100;
  const needsRecipientSuffixConfirm =
    needsExternalConfirmation && Number(amount || 0) >= externalHighAmountThreshold;
  const recipientSuffixExpected = String(recipient?.walletAddress || "").trim().slice(-6);
  const recipientSuffixMatched =
    !needsRecipientSuffixConfirm
    || recipientSuffixConfirm.trim().toLowerCase() === recipientSuffixExpected.toLowerCase();
  const canSend =
    hasAddress
    && hasRecipient
    && hasAmount
    && !sending
    && verifiedOtp
    && (!needsExternalConfirmation || confirmExternalRecipient)
    && recipientSuffixMatched;

  return (
    <main className="min-h-[100vh] bg-slate-100 px-4 py-6">
      <div className="mx-auto w-full max-w-xl">
        <div className="mb-4 flex items-center justify-between">
          <button
            onClick={() => window.history.back()}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
          >
            <Image src="/icon-back.png" alt="Back" width={16} height={16} className="h-4 w-4 rounded-full" />
            돌아가기
          </button>
          <div className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
            {params.center || chain}
          </div>
        </div>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <Image src="/logo-tether.svg" alt="USDT" width={20} height={20} className="h-5 w-5" />
            <h1 className="text-lg font-semibold text-slate-900">{Withdraw_USDT || "USDT 출금하기"}</h1>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            연결된 내 지갑에서 외부 지갑주소로 USDT를 전송합니다.
          </p>

          {!hasAddress && (
            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
              <ConnectButton
                client={client}
                wallets={wallets}
                showAllWallets={false}
                chain={chain === "ethereum" ? ethereum :
                  chain === "polygon" ? polygon :
                  chain === "arbitrum" ? arbitrum :
                  chain === "bsc" ? bsc : arbitrum}
                theme={"light"}
                connectButton={{
                  style: {
                    backgroundColor: "#0f172a",
                    color: "#f8fafc",
                    padding: "2px 12px",
                    borderRadius: "10px",
                    fontSize: "14px",
                    height: "38px",
                  },
                  label: "지갑 연결",
                }}
                connectModal={{
                  size: "wide",
                  titleIcon: "https://www.stable.makeup/logo.png",
                  showThirdwebBranding: false,
                }}
                locale={"ko_KR"}
              />
              <p className="mt-2 text-xs text-slate-500">{Please_connect_your_wallet_first || "먼저 지갑을 연결해주세요."}</p>
            </div>
          )}

          {hasAddress && (
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs text-slate-500">출금 지갑</p>
                <button
                  className="mt-1 text-sm font-semibold text-slate-800 underline"
                  onClick={() => {
                    navigator.clipboard.writeText(address || "");
                    toast.success(Copied_Wallet_Address || "지갑주소가 복사되었습니다.");
                  }}
                >
                  {address?.substring(0, 8)}...{address?.substring((address?.length || 0) - 6)}
                </button>
                <p className="mt-1 text-xs text-slate-500">{user?.nickname || Anonymous || "Anonymous"}</p>
              </div>

              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-right">
                <p className="text-xs text-emerald-700">출금 가능 잔고</p>
                <p className="mt-1 font-mono text-2xl font-semibold text-emerald-700">
                  {Number(balance).toFixed(3).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                </p>
                <p className="text-xs font-semibold text-emerald-700">USDT</p>
              </div>
            </div>
          )}
        </section>

        <section className="mt-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900">{Enter_the_amount_and_recipient_address || "금액과 수신 지갑주소를 입력하세요."}</h2>

          <div className="mt-4">
            <label className="text-xs font-semibold text-slate-500">출금 금액 (USDT)</label>
            <div className="mt-2 flex items-center rounded-xl border border-slate-300 bg-slate-50 px-3">
              <input
                disabled={sending}
                type="number"
                min="0"
                step="0.001"
                className="w-full bg-transparent py-3 text-2xl font-semibold text-slate-900 outline-none"
                value={amount}
                onChange={(e) => {
                  const next = Number(e.target.value);
                  setAmount(Number.isFinite(next) ? next : 0);
                }}
              />
              <span className="text-sm font-semibold text-slate-500">USDT</span>
            </div>
            <div className="mt-2 grid grid-cols-4 gap-2">
              {[0.25, 0.5, 0.75, 1].map((ratio) => (
                <button
                  key={ratio}
                  type="button"
                  disabled={!hasAddress || sending}
                  onClick={() => setAmount(Number((Number(balance || 0) * ratio).toFixed(3)))}
                  className="rounded-lg border border-slate-300 bg-white py-1 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {Math.round(ratio * 100)}%
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4">
            <label className="text-xs font-semibold text-slate-500">{User_wallet_address || "수신 지갑주소"}</label>
            <input
              disabled={sending}
              type="text"
              placeholder={Enter_Wallet_Address || "0x..."}
              className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-3 text-sm font-medium text-slate-900 outline-none focus:border-slate-500"
              value={recipient.walletAddress}
              onChange={(e) => setRecipient({
                ...recipient,
                walletAddress: e.target.value,
              })}
            />
          </div>

          {isWhateListedUser ? (
            <div className="mt-3 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3">
              <Image
                src={recipient.avatar || "/profile-default.png"}
                alt="profile"
                width={28}
                height={28}
                className="h-7 w-7 rounded-full object-cover"
              />
              <span className="text-sm font-semibold text-emerald-700">{recipient?.nickname || "등록 사용자"}</span>
              <Image src="/verified.png" alt="verified" width={18} height={18} className="h-[18px] w-[18px]" />
            </div>
          ) : (
            hasRecipient && (
              <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                <p className="font-semibold">{This_address_is_not_white_listed || "등록된 사용자 지갑이 아닙니다."}</p>
                <p className="mt-1 text-xs">{If_you_are_sure_please_click_the_send_button || "주소를 다시 확인한 뒤 전송하세요."}</p>
              </div>
            )
          )}

          {needsExternalConfirmation && (
            <label className="mt-3 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
              <input
                type="checkbox"
                checked={confirmExternalRecipient}
                onChange={(e) => setConfirmExternalRecipient(e.target.checked)}
                className="mt-1 h-4 w-4 accent-rose-600"
              />
              <span>외부 지갑주소를 직접 검증했으며, 오전송 시 복구가 불가능함을 확인했습니다.</span>
            </label>
          )}

          {needsRecipientSuffixConfirm && (
            <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 p-3">
              <p className="text-xs font-semibold text-rose-800">
                고액 외부 출금 보호: 수신 지갑주소 끝 6자리를 입력하세요.
              </p>
              <div className="mt-2 flex items-center gap-2">
                <span className="rounded-md bg-white px-2 py-1 font-mono text-xs text-rose-700">
                  ...{recipientSuffixExpected}
                </span>
                <input
                  type="text"
                  value={recipientSuffixConfirm}
                  onChange={(e) => setRecipientSuffixConfirm(e.target.value)}
                  placeholder="끝 6자리 입력"
                  className="w-full rounded-lg border border-rose-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none"
                />
              </div>
            </div>
          )}

          <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs font-semibold text-slate-700">2차 인증 (OTP)</p>
            <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
              <button
                type="button"
                disabled={!hasAddress || !hasRecipient || !hasAmount || sending || isSendingOtp || otpCooldownSec > 0}
                onClick={sendOtp}
                className={`rounded-lg px-3 py-2 text-xs font-semibold ${
                  !hasAddress || !hasRecipient || !hasAmount || sending || isSendingOtp || otpCooldownSec > 0
                    ? "cursor-not-allowed bg-slate-200 text-slate-400"
                    : "bg-slate-700 text-white hover:bg-slate-600"
                }`}
              >
                {isSendingOtp ? "OTP 발송중..." : otpCooldownSec > 0 ? `재발송 ${otpCooldownSec}s` : "OTP 발송"}
              </button>

              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="OTP 코드 입력"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none"
              />

              <button
                type="button"
                disabled={!otp || isVerifingOtp || sending}
                onClick={verifyOtp}
                className={`rounded-lg px-3 py-2 text-xs font-semibold ${
                  !otp || isVerifingOtp || sending
                    ? "cursor-not-allowed bg-slate-200 text-slate-400"
                    : "bg-emerald-600 text-white hover:bg-emerald-500"
                }`}
              >
                {isVerifingOtp ? "인증중..." : "OTP 인증"}
              </button>
            </div>
            {verifiedOtp ? (
              <p className="mt-2 text-xs font-semibold text-emerald-700">OTP 인증 완료</p>
            ) : (
              <p className="mt-2 text-xs text-slate-500">출금을 위해 OTP 인증이 필요합니다.</p>
            )}
          </div>

          <button
            disabled={!canSend}
            onClick={sendUsdt}
            className={`mt-5 w-full rounded-xl py-3 text-base font-semibold transition-colors ${
              canSend
                ? "bg-slate-900 text-white hover:bg-slate-700"
                : "cursor-not-allowed bg-slate-200 text-slate-400"
            }`}
          >
            {sending ? (Sending || "전송중...") : (Send_USDT || "USDT 전송")}
          </button>

          {sending && (
            <div className="mt-3 flex items-center justify-center gap-2 text-sm font-semibold text-slate-600">
              <Image src="/loading.png" alt="loading" width={18} height={18} className="h-[18px] w-[18px] animate-spin" />
              {Sending || "전송중..."}
            </div>
          )}
        </section>

        <p className="mt-3 text-[11px] leading-relaxed text-slate-500">
          보안 안내: 전송 주소를 2회 이상 확인하고, 큰 금액은 소액 테스트 전송 후 진행하세요.
        </p>
      </div>
    </main>
  );

}
