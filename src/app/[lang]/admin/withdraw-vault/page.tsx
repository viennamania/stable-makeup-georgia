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

      if (data.result) {
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
        //toast.error(Failed_to_send_USDT);
        toast.success(USDT_sent_successfully);
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


  if (!address) {
    return (
      <main className="p-4 min-h-[100vh] flex items-center justify-center container max-w-screen-sm mx-auto">
        <div className="text-lg font-semibold">
          {Please_connect_your_wallet_first}
        </div>
      </main>
    );
  }

  if (loadingUser) {
    return (
      <main className="p-4 min-h-[100vh] flex items-center justify-center container max-w-screen-sm mx-auto">
        <div className="text-lg font-semibold">
          회원 정보를 불러오는 중...
        </div>
      </main>
    );
  }

  if (!isAdmin) {
    return (
      <main className="p-4 min-h-[100vh] flex items-center justify-center container max-w-screen-sm mx-auto">
        <div className="text-red-500 text-lg font-semibold">
          You do not have permission to access this page.
        </div>
      </main>
    );
  }



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

        <div className="w-full flex flex-col gap-2 items-center justify-start text-zinc-500 text-lg">
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


        <div className="mt-4 w-full flex flex-col items-start justify-center gap-6">

            <div className='flex flex-row items-center gap-4'>

              <div className='flex flex-row items-center gap-2'>
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



            {/* walletAddress and userInfo and walletBalance */}
            <div className='w-full flex flex-col gap-2 items-start justify-between'>

              <div className='w-full flex flex-row gap-2 items-center justify-between'>

                <div className='flex flex-col gap-1 items-start justify-center'>

                  <div className='flex flex-row items-start justify-start gap-1'>
                    <Image
                      src="/icon-shield.png"
                      alt="shield"
                      width={20}
                      height={20}
                      className="w-5 h-5"
                    />
                    <span className='text-sm text-gray-800 font-semibold'>
                      {walletAddress}
                    </span>
                  </div>

                  {userInfo ? (
                    <div className='text-lg font-semibold flex flex-row gap-2 items-center justify-center'>

                      <Image
                        src='/icon-seller.png'
                        alt='seller'
                        width={20}
                        height={20}
                      />

                      <span>
                        {userInfo?.nickname || Anonymous}
                      </span>
                    </div>
                  ) : (
                    <div className='text-lg font-semibold'>
                      {Anonymous}
                    </div>
                  )}

                </div>

                <div className='flex flex-row items-center justify-start gap-1'>
                  <Image
                    src="/token-usdt-icon.png"
                    alt="USDT"
                    width={30}
                    height={30}
                    className="rounded-full"
                  />
                  {/* monospace font for wallet balance */}
                  <span className='text-4xl font-semibold text-green-600'
                    style={{
                      fontFamily: 'monospace',
                    }}
                  >
                    {walletBalance && Number(walletBalance).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                  </span>
                </div>

              </div>

            </div>
           




              <div className="text-lg">
                보낼 금액과 받는 사람을 선택하세요.
              </div>


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
                        src={recipient?.avatar || '/icon-user.png'}
                        alt="profile"
                        width={38}
                        height={38}
                        className="w-9 h-9 rounded-full"
                        style={{
                          objectFit: 'cover',
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
                      className=" w-80 xl:w-96 p-2 border border-gray-300 rounded text-white bg-black text-sm xl:text-sm font-semibold mt-2"
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


              <button
                disabled={!address || !recipient?.walletAddress || !amount || sending }
                onClick={sendUsdt}
                className={`mt-10 w-full p-2 rounded-lg text-xl font-semibold

                    ${
                    !address || !recipient?.walletAddress || !amount || sending
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

    </main>

  );

}
