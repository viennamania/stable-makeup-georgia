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

  bscContractAddressMKRW,
} from "@/app/config/contractAddresses";




const wallets = [
  inAppWallet({
    auth: {
      options: ["phone", "email"],
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

  const searchParams = useSearchParams();
 
  const wallet = searchParams.get('wallet');
  
  
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



  const contractMKRW = getContract({

    // the client you have created via `createThirdwebClient()`
    client,
    // the chain the contract is deployed on
    chain: chain === "bsc" ? bsc : bsc,

    address: bscContractAddressMKRW,

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



    // balance of MKRW
  const [mkrwBalance, setMkrwBalance] = useState(0);
  useEffect(() => {
    if (!address) {
      return;
    }
    // get the balance
    const getMkrwBalance = async () => {
      const result = await balanceOf({
        contract: contractMKRW,
        address: address,
      });
  
      setMkrwBalance( Number(result) / 10 ** 18 );

  
    };
    if (address) getMkrwBalance();
    const interval = setInterval(() => {
      if (address) getMkrwBalance();
    } , 5000);
    return () => clearInterval(interval);
  }, [address, contractMKRW]);





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

  //////const [verifiedOtp, setVerifiedOtp] = useState(false);

  const [verifiedOtp, setVerifiedOtp] = useState(true);


  const [isSendedOtp, setIsSendedOtp] = useState(false);



  const [isSendingOtp, setIsSendingOtp] = useState(false);

  const [isVerifingOtp, setIsVerifingOtp] = useState(false);

  


  const [sending, setSending] = useState(false);
  const sendMkrw = async () => {
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

    //console.log('amount', amount, "balance", balance);

    if (Number(amount) > mkrwBalance) {
      toast.error('Insufficient balance');
      return;
    }

    setSending(true);

    try {



        // send USDT
        // Call the extension function to prepare the transaction
        const transaction = transfer({
            //contract,

            contract: contractMKRW,

            to: recipient.walletAddress,
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
              toWalletAddress: recipient.walletAddress,
            }),
          });



          toast.success(USDT_sent_successfully);

          setAmount(0); // reset amount

          // refresh balance

          // get the balance

          const result = await balanceOf({
            contract: contractMKRW,
            address: address || "",
          });

          setBalance( Number(result) / 10 ** 18 );

        } else {
          toast.error('Failed to send MKRW');
        }
      

    } catch (error) {
      toast.error('Failed to send MKRW');
      console.error('Error sending MKRW:', error);
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
  






  // transfer list MKRW
  const [transferListMKRW, setTransferListMKRW] = useState([]);
  const [loadingTransferListMKRW, setLoadingTransferListMKRW] = useState(false);
  useEffect(() => {
    const getTransferListMKRW = async () => {
      setLoadingTransferListMKRW(true);
      const response = await fetch('/api/transfer/getAllTransferMKRW', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress: address,
        }),
      });
      if (!response.ok) {
        toast.error("입출금 내역을 불러오는 데 실패했습니다.");
        setLoadingTransferListMKRW(false);
        return;
      }
      const data = await response.json();

      setTransferListMKRW(data.result.transfers);

      setLoadingTransferListMKRW(false);
    };


    if (address) {
      getTransferListMKRW();
    }

    // setInterval to refresh transfer list every 5 seconds
    const interval = setInterval(() => {
      if (address) {
        getTransferListMKRW();
      }
    }
    , 5000);
    return () => {
      clearInterval(interval);
    };


  }, [address]);








  return (

    <main className="p-4 min-h-[100vh] flex items-start justify-center container max-w-screen-sm mx-auto">

      <div className="py-0 w-full ">

  
        {params.center && (
            <div className="w-full flex flex-row items-center justify-center gap-2 bg-black/10 p-2 rounded-lg mb-4">
                <span className="text-sm text-zinc-500">
                {params.center}
                </span>
            </div>
        )}

        <div className="w-full flex flex-col gap-2 items-center justify-start text-zinc-500 text-lg"
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

            
            {/*
            {!address && (
            */}



                <ConnectButton
                  client={client}
                  wallets={wallets}
                  chain={chain === "ethereum" ? ethereum :
                          chain === "polygon" ? polygon :
                          chain === "arbitrum" ? arbitrum :
                          chain === "bsc" ? bsc : arbitrum}

                  theme={"light"}

                  // button color is dark skyblue convert (49, 103, 180) to hex
                  connectButton={{
                      style: {
                          backgroundColor: "#3167b4", // dark skyblue
                          color: "#f3f4f6", // gray-300
                          padding: "2px 10px",
                          borderRadius: "10px",
                          fontSize: "14px",
                          width: "60x",
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

            {/*
            )}
            */}





            {address && (
                <div className="w-full flex flex-col items-end justify-center gap-2">

                    <div className="flex flex-row items-center justify-center gap-2">

                        <button
                            className="text-lg text-zinc-600 underline"
                            onClick={() => {
                                navigator.clipboard.writeText(address);
                                toast.success(Copied_Wallet_Address);
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
                      <Image
                        src="/token-mkrw-icon.png"
                        alt="MKRW"
                        width={20}
                        height={20}
                        className="w-6 h-6"
                      />
                      <span className="text-2xl xl:text-4xl font-semibold text-yellow-600">
                          {Number(mkrwBalance).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                      </span>
                      {' '}
                      <span className="text-sm">MKRW</span>
                    </div>

                </div>
            )}

        </div>

        


        <div className="flex flex-col items-start justify-center space-y-4">

            <div className='flex flex-row items-center space-x-4'>

              <div className='flex flex-row items-center space-x-2'>
                <Image
                  src="/icon-withdraw.png"
                  alt="Withdraw"
                  width={50}
                  height={50}
                  className="w-8 h-8 rounded-lg"
                />
              </div>

              <div className="text-xl font-semibold">
                포인트 출금
              </div>

            </div>




            <div className='w-full  flex flex-col gap-5 border border-gray-300 p-4 rounded-lg'>



              <div className="text-lg">{Enter_the_amount_and_recipient_address}</div>


              <div className='mb-5 flex flex-col gap-5 items-start justify-between'>

                <input
                  disabled={sending}
                  type="number"
                  //placeholder="Enter amount"
                  className=" w-64 p-2 border border-gray-300 rounded text-black text-5xl font-semibold "
                  
                  value={amount}

                  onChange={(e) => (

                    // check if the value is a number


                    // check if start 0, if so remove it

                    //e.target.value = e.target.value.replace(/^0+/, ''),



                    // check balance

                    setAmount(e.target.value as any)

                  )}
                />
           

            
            
                {!wantToReceiveWalletAddress ? (
                  <>
                  <div className='w-full flex flex-row gap-5 items-center justify-between'>
                    <select
                      disabled={sending}

                      className="
                        
                        w-56 p-2 border border-gray-300 rounded text-black text-2xl font-semibold "
                        
                      value={
                        recipient?.nickname
                      }


                      onChange={(e) => {

                        const selectedUser = users.find((user) => user.nickname === e.target.value) as any;

                        console.log("selectedUser", selectedUser);

                        setRecipient(selectedUser);

                      } } 

                    >
                      <option value="">{Select_a_user}</option>
                      

                      {users.map((user) => (
                        <option key={user.id} value={user.nickname}>{user.nickname}</option>
                      ))}
                    </select>

                    {/* select user profile image */}

                    <div className=" w-full flex flex-row gap-2 items-center justify-center">
                      <Image
                        src={recipient?.avatar || '/profile-default.png'}
                        alt="profile"
                        width={38}
                        height={38}
                        className="rounded-full"
                        style={{
                          objectFit: 'cover',
                          width: '38px',
                          height: '38px',
                        }}
                      />

                      {recipient?.walletAddress && (
                        <Image
                          src="/verified.png"
                          alt="check"
                          width={28}
                          height={28}
                        />
                      )}

                    </div>

                    


                  </div>
              

                    {/* input wallet address */}
                    
                    <input
                      disabled={true}
                      type="text"
                      placeholder={User_wallet_address}
                      className=" w-80  xl:w-full p-2 border border-gray-300 rounded text-white text-xs xl:text-lg font-semibold"
                      value={recipient?.walletAddress}
                      onChange={(e) => {
      
                        
                        
                          getUserByWalletAddress(e.target.value)

                          .then((data) => {

                            //console.log("data", data);

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

                      } }
                    />


          


                </>

                ) : (

                  <div className='flex flex-col gap-5 items-center justify-between'>
                    <input
                      disabled={sending}
                      type="text"
                      placeholder={User_wallet_address}
                      className=" w-80 xl:w-96 p-2 border border-gray-300 rounded text-white bg-black text-sm xl:text-sm font-semibold"
                      value={recipient.walletAddress}
                      onChange={(e) => setRecipient({
                        ...recipient,
                        walletAddress: e.target.value,
                      })}
                    />

                    {isWhateListedUser ? (
                      <div className="flex flex-row gap-2 items-center justify-center">


                        <Image
                          src={recipient.avatar || '/profile-default.png'}
                          alt="profile"
                          width={30}
                          height={30}
                          className="rounded-full"
                          style={{
                            objectFit: 'cover',
                            width: '38px',
                            height: '38px',
                          }}
                        />
                        <div className="text-white">{recipient?.nickname}</div>
                        <Image
                          src="/verified.png"
                          alt="check"
                          width={30}
                          height={30}
                        />
                        
                      </div>
                    ) : (
                      <>

                      {recipient?.walletAddress && (
                        <div className='flex flex-row gap-2 items-center justify-center'>
                          {/* dot icon */}
                          <div className="w-4 h-4 bg-green-500 rounded-full mr-2"></div>

                          <div className="text-red-500">
                            {This_address_is_not_white_listed}<br />
                            {If_you_are_sure_please_click_the_send_button}
                          </div>
                        </div>

                      )}

                      </>
                    )}



                  </div>

                )} 

              </div>

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
                  <div className="text-white">OTP verified</div>
                </div>
              ) : (
             
        
                <div className="w-full flex flex-row gap-2 items-start">

                  <button
                    disabled={!address || !recipient?.walletAddress || !amount || isSendingOtp}
                    onClick={sendOtp}
                    className={`
                      
                      ${isSendedOtp && 'hidden'}

                      w-32 p-2 rounded-lg text-sm font-semibold

                        ${
                        !address || !recipient?.walletAddress || !amount || isSendingOtp
                        ?'bg-gray-300 text-gray-400'
                        : 'bg-green-500 text-white'
                        }
                      
                      `}
                  >
                      Send OTP
                  </button>

                  <div className={`flex flex-row gap-2 items-center justify-center ${!isSendedOtp && 'hidden'}`}>
                    <input
                      type="text"
                      placeholder="Enter OTP"
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
                        Verify OTP
                    </button>
                  </div>

                </div>

              )}
                */}

              



              <button
                disabled={!address || !recipient?.walletAddress || !amount || sending || !verifiedOtp}
                onClick={sendMkrw}
                className={`mt-10 w-full p-2 rounded-lg text-xl font-semibold

                    ${
                    !address || !recipient?.walletAddress || !amount || sending || !verifiedOtp
                    ?'bg-gray-300 text-gray-400'
                    : 'bg-green-500 text-white'
                    }
                   
                   `}
              >
                  MKRW 출금하기
              </button>

              <div className="w-full flex flex-row gap-2 text-xl font-semibold">

                {/* sending rotate animation with white color*/}
                {sending && (
                  <div className="
                    w-6 h-6
                    border-2 border-zinc-800
                    rounded-full
                    animate-spin
                  ">
                    <Image
                      src="/loading.png"
                      alt="loading"
                      width={24}
                      height={24}
                    />
                  </div>
                )}
                <div className="text-zinc-800">
                  {sending ? Sending : ''}
                </div>

              </div>

            </div>





                {true && (
                  <div className="w-full mt-5 bg-white rounded-lg p-4">
                    
                      <div className='flex flex-row gap-2 items-center justify-start mb-4'>
                        <Image
                          src="/token-mkrw-icon.png"
                          alt="MKRW"
                          width={20}
                          height={20}
                          className='rounded-full w-6 h-6'
                        />
                        <h2 className="text-sm font-semibold">입출금 내역</h2>
                        {loadingTransferListMKRW && (
                          <div className="flex items-center justify-center">
                            <Image
                              src="/loading.png"
                              alt="loading"
                              width={20}
                              height={20}
                              className="animate-spin"
                            />
                          </div>
                        )}
                      </div>

                      <table className="w-full table-auto">
                        <thead>
                          <tr
                            className="bg-gray-200 text-gray-700 text-sm font-semibold">


                            <th className="px-4 py-2">날짜<br/>입금 / 출금</th>
                            <th className="px-4 py-2">보낸 사람<br/>받은 사람</th>
                            <th className="px-4 py-2">수량</th>
                          </tr>
                        </thead>
                        <tbody>
                          {transferListMKRW.map((transfer : any, index: number) => (


                            <tr key={transfer._id}

                              className={`${
                                index % 2 === 0 ? 'bg-gray-100' : 'bg-white'
                              }`}
                            >
                              <td className="border px-4 py-2">
                                <div className='flex flex-col gap-1'>
                                  <span className="text-sm">
                                    {new Date(transfer.transferData.timestamp).toLocaleTimeString()}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    {new Date(transfer.transferData.timestamp).toLocaleDateString()}
                                  </span>
                                </div>

                                <span className="font-semibold text-lg">
                                  {transfer.sendOrReceive === "send" ? (
                                    <span className="text-red-600">출금</span>
                                  ) : (
                                    <span className="text-[#409192]">입금</span>
                                  )}
                                </span>


                              </td>

                              <td className="border px-4 py-2">

                                {transfer.sendOrReceive === "send" ? (

                                  <div className='flex flex-col gap-1'>
                                    <span className="text-red-600">
                                      받은 사람
                                    </span>
                                    {transfer?.toUser?.nickname && (
                                      <span className="text-red-600">
                                        {transfer?.toUser?.nickname}
                                      </span>
                                    )}
                                    <span className="text-red-600 text-sm">
                                      {transfer.transferData.toAddress.slice(0, 6) + '...'}
                                    </span>
                                    {/*
                                    {transfer.isEscrowTransfer && (
                                      <span className="text-red-600 text-xs">
                                        에스크로 지갑으로 출금됨
                                      </span>
                                    )}
                                    */}
                                  </div>

                                ) : (
                                  <>

                                  {transfer.transferData.fromAddress === '0x0000000000000000000000000000000000000000' ? (
                                    <div className='flex flex-row gap-2 items-center justify-start'>
                                      {/* mint icon */}
                                      {/* mint */}
                                      <Image
                                        src="/icon-charge.png"
                                        alt="charge"
                                        width={20}
                                        height={20}
                                        className='rounded-full w-6 h-6'
                                      />
                                      <span className="text-[#409192]">
                                        충전
                                      </span>
                                    </div>
                                  ) : (

                                  
                                    <div className='flex flex-col gap-1'>
                                      <span className="text-[#409192]">
                                        보낸 사람
                                      </span>
                                      {transfer?.fromUser?.nickname && (
                                        <span className="text-[#409192]">
                                          {transfer?.fromUser?.nickname}
                                        </span>
                                      )}

                                      <span className="text-[#409192] text-sm">
                                        {transfer.transferData.fromAddress.slice(0, 6) + '...'}
                                      </span>
                                      {/*
                                      {transfer.isEscrowTransfer && (
                                        <span className="text-[#409192] text-xs">
                                          에스크로 지갑에서 입금됨
                                        </span>
                                      )}
                                      */}
                                    </div>

                                  )}

                                  </>
                                )}
                              </td>
                              <td className="border px-4 py-2 text-right">
                                <span className="text-lg font-semibold text-gray-800"
                                  style={{fontFamily: 'monospace'}}
                                >
                                {
                                  (Number(transfer.transferData.value) / 10 ** 18)
                                  .toFixed(0)
                                  .replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                                }
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                  

                  </div>

                )}





        </div>

       </div>

    </main>

  );

}
