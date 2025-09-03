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
                        <span className="text-2xl xl:text-4xl font-semibold text-[#409192]"
                          style={{ fontFamily: 'monospace' }}
                        >
                            {Number(balance).toFixed(3).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                        </span>
                        {' '}
                        <span className="text-sm">USDT</span>
                    </div>

                </div>
            )}

        </div>

        


        <div className="flex flex-col items-start justify-center space-y-4">

            <div className='flex flex-row items-center space-x-4'>

              <div className='flex flex-row items-center space-x-2'>
                <Image
                  src="/logo-tether.svg"
                  alt="USDT"
                  width={35}
                  height={35}
                  className="w-6 h-6"
                />
              </div>

              <div className="text-xl font-semibold">
                {Withdraw_USDT}
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
                onClick={sendUsdt}
                className={`mt-10 w-full p-2 rounded-lg text-xl font-semibold

                    ${
                    !address || !recipient?.walletAddress || !amount || sending || !verifiedOtp
                    ?'bg-gray-300 text-gray-400'
                    : 'bg-green-500 text-white'
                    }
                   
                   `}
              >
                  {Send_USDT}
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



        </div>

       </div>

    </main>

  );

}
