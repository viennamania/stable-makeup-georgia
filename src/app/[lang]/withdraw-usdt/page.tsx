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
import {
  getUserEmail,
  getUserPhoneNumber,
} from "thirdweb/wallets/in-app";

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
          walletAddress: address,
        }),
      });

      const data = await response.json();


      setUser(data.result);

    };

    getUser();

  }, [address]);



  const [serverWalletUsers, setServerWalletUsers] = useState<any[]>([]);
  const [totalCountOfServerWalletUsers, setTotalCountOfServerWalletUsers] = useState(0);
  const [serverWalletKeyword, setServerWalletKeyword] = useState("");
  const [loadingServerWalletUsers, setLoadingServerWalletUsers] = useState(false);

  useEffect(() => {
    if (!address) {
      setServerWalletUsers([]);
      setTotalCountOfServerWalletUsers(0);
      return;
    }

    let cancelled = false;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoadingServerWalletUsers(true);

      try {
        const response = await fetch('/api/user/getAllServerWalletUsers', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          signal: controller.signal,
          body: JSON.stringify({
            keyword: serverWalletKeyword,
            limit: 20,
            page: 1,
          }),
        });

        const data = await response.json().catch(() => null);
        if (cancelled) {
          return;
        }

        const nextUsers = Array.isArray(data?.result?.users)
          ? data.result.users.filter((item: any) => String(item?.walletAddress || "").toLowerCase() !== String(address || "").toLowerCase())
          : [];

        setServerWalletUsers(nextUsers);
        setTotalCountOfServerWalletUsers(Number(data?.result?.totalCount || 0));
      } catch (error: any) {
        if (cancelled || error?.name === "AbortError") {
          return;
        }

        console.error("Failed to load server wallet users", error);
        setServerWalletUsers([]);
        setTotalCountOfServerWalletUsers(0);
      } finally {
        if (!cancelled) {
          setLoadingServerWalletUsers(false);
        }
      }
    }, 250);

    return () => {
      cancelled = true;
      controller.abort();
      clearTimeout(timer);
    };
  }, [address, serverWalletKeyword]);






  const [recipient, setRecipient] = useState({
    _id: '',
    id: 0,
    email: '',
    nickname: '',
    avatar: '',
    mobile: '',
    walletAddress: '',
    signerAddress: '',
    storecode: '',
    createdAt: '',
    settlementAmountOfFee: '',
    store: null as any,
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
  const [inAppEmail, setInAppEmail] = useState("");
  const [inAppPhoneNumber, setInAppPhoneNumber] = useState("");
  const [otpChannel, setOtpChannel] = useState<'email' | 'sms' | null>(null);
  const [otpTargetMasked, setOtpTargetMasked] = useState("");

  


  const [sending, setSending] = useState(false);
  const [confirmExternalRecipient, setConfirmExternalRecipient] = useState(false);
  const isValidEvmAddress = (value: string) => /^0x[a-fA-F0-9]{40}$/.test(value.trim());
  const maskEmail = (value: string) => {
    const email = String(value || "").trim();
    const [localPartRaw, domainRaw] = email.split("@");
    const localPart = localPartRaw || "";
    const domain = domainRaw || "";
    if (!localPart || !domain) {
      return "";
    }
    return `${localPart.slice(0, 2)}${"*".repeat(Math.max(localPart.length - 2, 2))}@${domain}`;
  };
  const maskPhone = (value: string) => {
    const raw = String(value || "").trim();
    if (!raw) {
      return "";
    }
    if (raw.length <= 6) {
      return `${raw.slice(0, 2)}****`;
    }
    return `${raw.slice(0, 4)}****${raw.slice(-2)}`;
  };
  const smsFallbackMobile = String((user as any)?.mobile || "").trim();
  const preferredOtpChannel: 'email' | 'sms' | null = inAppEmail
    ? "email"
    : (inAppPhoneNumber || smsFallbackMobile)
      ? "sms"
      : null;
  const preferredOtpTargetMasked = preferredOtpChannel === "email"
    ? maskEmail(inAppEmail)
    : preferredOtpChannel === "sms"
      ? maskPhone(inAppPhoneNumber || smsFallbackMobile)
      : "";

  useEffect(() => {
    let cancelled = false;
    if (!address) {
      setInAppEmail("");
      setInAppPhoneNumber("");
      return;
    }

    getUserEmail({ client })
      .then((email) => {
        if (!cancelled) {
          setInAppEmail(String(email || "").trim());
        }
      })
      .catch(() => {
        if (!cancelled) {
          setInAppEmail("");
        }
      });

    getUserPhoneNumber({ client })
      .then((phoneNumber) => {
        if (!cancelled) {
          setInAppPhoneNumber(String(phoneNumber || "").trim());
        }
      })
      .catch(() => {
        if (!cancelled) {
          setInAppPhoneNumber("");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [address]);

  useEffect(() => {
    setConfirmExternalRecipient(false);
    setVerifiedOtp(false);
    setIsSendedOtp(false);
    setOtp("");
    setRecipientSuffixConfirm("");
    setOtpChannel(null);
    setOtpTargetMasked("");
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
    const senderEmail = String(inAppEmail || (user as any)?.email || "").trim();
    const senderMobile = String(inAppPhoneNumber || (user as any)?.mobile || "").trim();
    const resolvedChannel: 'email' | 'sms' | null = senderEmail ? "email" : senderMobile ? "sms" : null;

    if (!senderWalletAddress || !recipientWalletAddress || Number(amount) <= 0) {
      toast.error("수신 지갑주소와 출금 금액을 먼저 입력해주세요.");
      return;
    }

    if (!resolvedChannel) {
      toast.error("OTP를 받을 이메일 또는 휴대폰 번호가 등록되어 있지 않습니다.");
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
          channel: resolvedChannel,
          email: senderEmail || undefined,
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
      const sentChannel = data?.result?.channel === "email" ? "email" : "sms";
      const sentTargetMasked = String(data?.result?.targetMasked || "");
      setOtpChannel(sentChannel);
      setOtpTargetMasked(sentTargetMasked);
      toast.success(sentChannel === "email" ? "OTP를 이메일로 발송했습니다." : "OTP를 문자로 발송했습니다.");
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
      toast.error('받는 사람 서버월렛을 선택해주세요.');
      return;
    }

    if (!isValidEvmAddress(recipientWalletAddress)) {
      toast.error("선택된 받는 사람 지갑주소가 올바르지 않습니다.");
      return;
    }

    if (senderWalletAddress && recipientWalletAddress.toLowerCase() === senderWalletAddress.toLowerCase()) {
      toast.error("내 지갑주소로는 출금할 수 없습니다.");
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
          setOtpChannel(null);
          setOtpTargetMasked("");

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



  useEffect(() => {
    setIsWhateListedUser(Boolean(String(recipient?.walletAddress || "").trim()));
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
            <label className="text-xs font-semibold text-slate-500">{Select_a_user || "받는 사람 선택"}</label>
            <input
              disabled={sending}
              type="text"
              placeholder="가맹점명 / 지갑주소 검색"
              className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-3 text-sm font-medium text-slate-900 outline-none focus:border-slate-500"
              value={serverWalletKeyword}
              onChange={(e) => setServerWalletKeyword(e.target.value)}
            />
            <p className="mt-2 text-xs text-slate-500">
              users 컬렉션의 server wallet 회원만 표시합니다.
              {totalCountOfServerWalletUsers > 0 ? ` 검색 결과 ${totalCountOfServerWalletUsers}명` : ""}
            </p>
          </div>

          {hasRecipient && (
            <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3">
              <p className="text-xs font-semibold text-emerald-700">선택된 받는 사람</p>
              <div className="mt-2 flex items-center gap-3">
                <Image
                  src={recipient?.store?.storeLogo || recipient.avatar || "/icon-store.png"}
                  alt={recipient?.store?.storeName || recipient?.nickname || "store"}
                  width={40}
                  height={40}
                  className="h-10 w-10 rounded-xl object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-emerald-900">
                    {recipient?.store?.storeName || recipient?.nickname || "가맹점 서버월렛"}
                  </p>
                  <p className="truncate text-xs text-emerald-700">
                    {recipient?.nickname ? `${recipient.nickname} · ` : ""}
                    {recipient?.storecode || ""}
                  </p>
                  <p className="truncate font-mono text-xs text-emerald-700">
                    {recipient.walletAddress}
                  </p>
                </div>
                <Image src="/verified.png" alt="selected" width={18} height={18} className="h-[18px] w-[18px]" />
              </div>
            </div>
          )}

          <div className="mt-3 max-h-72 space-y-2 overflow-y-auto">
            {loadingServerWalletUsers ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-500">
                server wallet 목록을 불러오는 중입니다.
              </div>
            ) : serverWalletUsers.length > 0 ? (
              serverWalletUsers.map((serverWalletUser: any) => {
                const isSelected =
                  String(serverWalletUser?.walletAddress || "").toLowerCase()
                  === String(recipient?.walletAddress || "").toLowerCase();

                return (
                  <button
                    key={serverWalletUser?._id || serverWalletUser?.walletAddress}
                    type="button"
                    disabled={sending}
                    onClick={() => {
                      setRecipient(serverWalletUser as any);
                      setIsWhateListedUser(true);
                    }}
                    className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors ${
                      isSelected
                        ? "border-emerald-400 bg-emerald-50"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <Image
                      src={serverWalletUser?.store?.storeLogo || serverWalletUser?.avatar || "/icon-store.png"}
                      alt={serverWalletUser?.store?.storeName || serverWalletUser?.nickname || "store"}
                      width={44}
                      height={44}
                      className="h-11 w-11 rounded-xl object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {serverWalletUser?.store?.storeName || serverWalletUser?.nickname || "가맹점 서버월렛"}
                      </p>
                      <p className="truncate text-xs text-slate-500">
                        {serverWalletUser?.storecode || ""}
                        {serverWalletUser?.nickname ? ` · ${serverWalletUser.nickname}` : ""}
                      </p>
                      <p className="truncate font-mono text-xs text-slate-500">
                        {serverWalletUser?.walletAddress}
                      </p>
                    </div>
                    <span className={`rounded-full px-2 py-1 text-[11px] font-semibold ${
                      isSelected
                        ? "bg-emerald-600 text-white"
                        : "bg-slate-100 text-slate-600"
                    }`}>
                      {isSelected ? "선택됨" : "선택"}
                    </span>
                  </button>
                );
              })
            ) : (
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3 text-sm text-slate-500">
                검색 조건에 맞는 가맹점 server wallet 회원이 없습니다.
              </div>
            )}
          </div>

          <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs font-semibold text-slate-700">2차 인증</p>
            <p className="mt-1 text-[11px] text-slate-500">
              당분간 이 페이지에서는 2차 인증을 처리하지 않습니다. 선택한 server wallet 대상으로 바로 출금됩니다.
            </p>
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
