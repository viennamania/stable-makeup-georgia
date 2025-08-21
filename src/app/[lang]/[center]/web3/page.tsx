// nickname settings
'use client';
import React, { use, useEffect, useState } from 'react';



import { toast } from 'react-hot-toast';

import { client } from "../../../client";

import {
    getContract,
    sendAndConfirmTransaction,
    sendTransaction
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







    const [balance, setBalance] = useState(0);

    useEffect(() => {
  
      if (!address) return;
      // get the balance
  
  
      if (!contract) {
        return;
      }
  
      const getBalance = async () => {
  
        try {
          const result = await balanceOf({
            contract,
            address: address,
          });
      
          //console.log(result);
      
          setBalance( Number(result) / 10 ** 6 );
  
        } catch (error) {
          console.error("Error getting balance", error);
        }
  
      };
  
      if (address) getBalance();
  
      // get the balance in the interval
  
      const interval = setInterval(() => {
        if (address) getBalance();
      }, 5000);
  
  
      return () => clearInterval(interval);
  
    } , [address, contract]);
  

















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

            ////console.log("data", data);

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

    const apply = async () => {
      if (applying) {
        return;
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

    const [amount, setAmount] = useState(0);


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

        const { transactionHash } = await sendTransaction({
            
            account: activeAccount as any,

            transaction,
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



            //toast.success(USDT_sent_successfully);
            alert('USDT 전송을 성공했습니다.');

            setAmount(0); // reset amount

            // refresh balance

            // get the balance

            const result = await balanceOf({
            contract,
            address: address || "",
            });

            //console.log(result);

            setBalance( Number(result) / 10 ** 6 );

        } else {

            //toast.error(Failed_to_send_USDT);

            alert('USDT 전송을 실패했습니다.');

        }
        


    } catch (error) {

        //toast.error(Failed_to_send_USDT);

        alert('USDT 전송을 실패했습니다.');

    }

    setSending(false);
    };



    // get bank transfer list by virtual account
    // api /api/bankTransfer/getAllByVirtualAccount

    interface BankTransfer {
        _id: string;
        amount: number;
        sender: string;
        custAccnt: string;
        vactId: string;
        regDate: string;
        distName: string;
        mchtId: string;
        trxType: string;
        bankName: string;
        custBankName: string;
        account: string;
    }
    
    const [bankTransfers, setBankTransfers] = useState<BankTransfer[]>([]);
    const [loadingBankTransfers, setLoadingBankTransfers] = useState(false);
    useEffect(() => {

        if (!address) {
            return;
        }

        const fetchData = async () => {

            setLoadingBankTransfers(true);

            const response = await fetch("/api/bankTransfer/getAllByVirtualAccount", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    virtualAccount: buyer?.bankInfo?.virtualAccount,
                }),
            });

            const data = await response.json();

            //console.log("getAllByVirtualAccount data", data);

            if (data.result) {
                setBankTransfers(data.result);
            }

            setLoadingBankTransfers(false);
        };

        fetchData();
    } , [address, buyer]);




    // /api/wallet/getTransfersByWalletAddress
    const [loadingTransfers, setLoadingTransfers] = useState(false);
    const [transfers, setTransfers] = useState([]);
    useEffect(() => {

        if (!address) {
            return;
        }

        const fetchData = async () => {

            setLoadingTransfers(true);

            const response = await fetch("/api/wallet/getTransfersByWalletAddress", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    walletAddress: address,
                }),
            });

            const data = await response.json();

            ///console.log("getTransfersByWalletAddress data", data);

            if (data.result) {
                setTransfers(data.result?.transfers);
            }

            setLoadingTransfers(false);
        };

        fetchData();

        // interval
        const interval = setInterval(() => {
            if (address) fetchData();
        }, 5000);

        return () => clearInterval(interval);

    } , [address]);

    /*
    {
    "transfers": [
        {
            "_id": "67a213bc265f833931184d85",
            "user": {
                "_id": "670dd8e6434183ffdd615325",
                "walletAddress": "0x2133209631C60c9A8E13BdbbdB81511917f12501"
            },
            "sendOrReceive": "send",
            "transferData": {
                "transactionHash": "0x82579063d6ead182487c4896e25746b72e9fb5708a759dbbe7460621c6a9c101",
                "transactionIndex": 59,
                "fromAddress": "0x2133209631C60c9A8E13BdbbdB81511917f12501",
                "toAddress": "0x9Caec0815C1488798c09176d61B702C10f7805C5",
                "value": "300000",
                "timestamp": 1738675128000,
                "_id": "67a213bc265f833931184d84"
            }
        }
    ],
    "totalTransfers": 1
}
    */




    return (

        <main className="p-4 pb-10 min-h-[100vh] flex items-start justify-center container max-w-screen-xl mx-auto">

            <div className="py-0 w-full">
        
                {/* goto home button using go back icon
                history back
                */}

                <AppBarComponent />


                <div className="w-full flex flex-col items-start justify-center space-y-4">

                    <div className='mt-5 w-full flex flex-row  items-center space-x-4'>
                        <GearSetupIcon />
                        <div className='flex flex-col items-start justify-center'>
                            <span className="text-2xl ">
                                WEB3 Wallet
                            </span>

                            {/* wallet address */}
                            {address && (
                                <div className='flex flex-row items-center justify-between gap-2'>
                                    <span className="text-lg text-gray-500 ">
                                        {address.slice(0, 6)}...{address.slice(-4)}
                                    </span>
                                    {/* 복사 버튼 */}
                                    <button
                                        onClick={() => {
                                            navigator.clipboard.writeText(address);
                                            //toast.success('USDT지갑주소가 복사되었습니다.');
                                            alert('USDT지갑주소가 복사되었습니다.');
                                        }}
                                        className="p-2 bg-blue-500 text-zinc-100 rounded"
                                    >
                                        복사
                                    </button>
                                    {/* goto send-usdt-web3 page */}
                                    <button
                                        onClick={() => router.push(`
                                            /${params.lang}/${params.center}/send-usdt-web3
                                        `)}
                                        className="p-2 bg-green-500 text-zinc-100 rounded"
                                    >
                                        USDT 보내기
                                    </button>
                                </div>
                            )}

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

                    <div className='w-full flex flex-row gap-5 '>

                        {/* balance */}
                        {address && (
                            <div className='w-full flex flex-col gap-2 items-start justify-start'>
                                {/*
                                <button
                                    onClick={() => {
                                        //confirm('지갑연결을 해제하시겠습니까?') && activeAccount?.disconnect();
                                    }}
                                    className="p-2 bg-red-500 text-zinc-100 rounded"
                                >
                                    지갑연결 해제
                                </button>
                                */}


                                <div className='w-full flex flex-row gap-2 items-center justify-between border border-gray-300 p-4 rounded-lg'>
                                    <Image
                                        src="/logo-tether.svg"
                                        alt="USDT"
                                        width={40}
                                        height={40}
                                        className="rounded-lg"
                                    />
                                    
                                    <div className='flex flex-col gap-2 items-end justify-between'>
   
                                        <div className='flex flex-row gap-2 items-center justify-between'>
                                            <span className="text-lg text-zinc-100">
                                                {My_Balance}:
                                            </span>
                                            <span className="text-4xl text-green-500 font-bold ">
                                                {
                                                    Number(balance).toFixed(2)
                                                } USDT
                                            </span>
                                        </div>

                                        <div className='mt-2 w-full flex flex-col gap-2'>

                                            {/* table body */}
                                            {transfers.map((transfer: any) => (
                                                <div key={transfer._id} className='w-full flex flex-row gap-2 items-center justify-between'>
                                                    <span className={` w-24 text-sm text-gray-500 `}>
                                                        {
                                                            //new Date(transfer.transferData.timestamp)?.toLocaleString()

                                                            // time ago format
                                                            // just now, 1 minute ago, 10 minutes ageo, 30 minutes ago, 1 hour ago, 1 day ago, 1 week ago, 1 month ago, 1 year ago


                                                            new Date(transfer.transferData.timestamp) > new Date(new Date().getTime() - 1000 * 60) ? '방금' :
                                                            new Date(transfer.transferData.timestamp) > new Date(new Date().getTime() - 1000 * 60 * 2) ? '1분 전' :
                                                            new Date(transfer.transferData.timestamp) > new Date(new Date().getTime() - 1000 * 60 * 10) ? '10분 전' :
                                                            new Date(transfer.transferData.timestamp) > new Date(new Date().getTime() - 1000 * 60 * 30) ? '30분 전' :

                                                            new Date(transfer.transferData.timestamp) > new Date(new Date().getTime() - 1000 * 60 * 60) ? '1시간 전' :
                                                            new Date(transfer.transferData.timestamp) > new Date(new Date().getTime() - 1000 * 60 * 60 * 24) ? '오늘' :
                                                            new Date(transfer.transferData.timestamp) > new Date(new Date().getTime() - 1000 * 60 * 60 * 24 * 2) ? '어제' :
                                                            new Date(transfer.transferData.timestamp) > new Date(new Date().getTime() - 1000 * 60 * 60 * 24 * 7) ? '이번주' :
                                                            new Date(transfer.transferData.timestamp) > new Date(new Date().getTime() - 1000 * 60 * 60 * 24 * 7 * 4) ? '이번달' :
                                                            new Date(transfer.transferData.timestamp) > new Date(new Date().getTime() - 1000 * 60 * 60 * 24 * 7 * 4 * 12) ? '올해' :
                                                            '올해'







                                                        }
                                                    </span>
                                                    <span className={`text-sm text-gray-500 ${transfer.sendOrReceive === 'send' ? 'text-red-500' : 'text-green-500'}`}>
                                                        {transfer.sendOrReceive === 'send' ? '송금' : '수신'}
                                                    </span>
                                                    <span className={`w-20 text-right text-sm text-gray-500 ${transfer.sendOrReceive === 'send' ? 'text-red-500' : 'text-green-500'}`}>
                                                        {transfer.sendOrReceive === 'send' ? '-' : '+'} {transfer.transferData.value / 10 ** 6}
                                                    </span>
                                                </div>
                                            ))}

                                        </div>

                                    </div>

                                </div>

                                {/* goto sell-usdt-web3 page */}
                                <button
                                    onClick={() => router.push(`
                                        /${params.lang}/${params.center}/sell-usdt-web3
                                    `)}
                                    className="w-full p-2 rounded-lg text-xl bg-green-500 text-white"
                                >
                                    USDT 판매하기
                                </button>



                                {/*
                                <div className='w-full  flex flex-col gap-5 border border-gray-300 p-4 rounded-lg'>



                                    <div className="text-sm">

                                        보낼 금액과 받을 사람의 USDT지갑주소를 입력하세요

                                    </div>


                                    <div className='flex flex-col xl:flex-row gap-5 items-center justify-between'>

                                        <div className='flex flex-row gap-2 items-center justify-between'>
                                            <input
                                                disabled={sending}
                                                type="number"
                                                //placeholder="Enter amount"
                                                className=" w-64 p-2 border border-gray-300 rounded text-5xl font-bold text-center
                                                text-green-500 bg-zinc-800"
                                                
                                                value={amount}

                                                onChange={(e) => (

                                                    // check if the value is a number


                                                    // check if start 0, if so remove it

                                                    //e.target.value = e.target.value.replace(/^0+/, ''),



                                                    // check less than balance, then set balance
                                                    // check more than 0, then set amount

                                                    //Number(e.target.value) > balance ? setAmount(balance) :

                                                    setAmount(e.target.value as any)

                                                )}
                                            />
                                            <div className='flex flex-col gap-2 items-center justify-between'>

                                            
                                                <button
                                                    disabled={sending}
                                                    onClick={() => setAmount(0)}
                                                    className="w-20 text-sm
                                                    p-2 bg-gray-300 text-gray-500 rounded"

                                                >
                                                    초기화
                                                </button>

                                        
                                                <button
                                                    disabled={sending}
                                                    onClick={() => setAmount(balance)}
                                                    className="w-20 text-sm
                                                    p-2 bg-gray-300 text-gray-500 rounded"
                                                >
                                                    최대
                                                </button>

                                            </div>
                                        </div>
                                

                                    
                                    


                                        <div className='flex flex-col gap-5 items-center justify-between'>
                                            <input
                                            disabled={sending}
                                            type="text"
                                            placeholder="받을 사람의 USDT지갑주소"
                                            className=" w-80 xl:w-96 p-2 border border-gray-300 rounded text-white bg-black text-sm xl:text-sm "
                                            value={recipient.walletAddress}
                                            onChange={(e) => setRecipient({
                                                ...recipient,
                                                walletAddress: e.target.value,
                                            })}
                                            />



                                            {recipient?.walletAddress && (
                                                <div className='flex flex-row gap-2 items-center justify-center'>

                                                </div>

                                            )}



                                        </div>


                                    </div>

                            

                                
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

                                            w-32 p-2 rounded-lg text-sm 

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
                                            className=" w-40 p-2 border border-gray-300 rounded text-black text-sm "
                                            value={otp}
                                            onChange={(e) => setOtp(e.target.value)}
                                            />

                                            <button
                                            disabled={!otp || isVerifingOtp}
                                            onClick={verifyOtp}
                                            className={`w-32 p-2 rounded-lg text-sm 

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
                                

                                



                                    <button
                                        disabled={!address || !recipient?.walletAddress || !amount || sending || !verifiedOtp}
                                        onClick={sendUsdt}
                                        className={`mt-10 w-full p-2 rounded-lg text-xl 

                                            ${
                                            !address || !recipient?.walletAddress || !amount || sending || !verifiedOtp
                                            ?'bg-gray-300 text-gray-400'
                                            : 'bg-green-500 text-white'
                                            }
                                        
                                        `}
                                    >
                                        {Send_USDT}
                                    </button>

                                    <div className="w-full flex flex-row gap-2 text-xl ">

                                    
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
                                        <div className="text-white">
                                        {sending ? "전송중..." : ''}
                                        </div>

                                    </div>

                                </div>
                                */}


                            </div>
                        )}


                    </div>

                            

                        


                    <div className='w-full  flex flex-col gap-5 '>

                        {/* profile picture */}
                    



                        {address && userCode && (
                            <div className='flex flex-row gap-2 items-center justify-between border border-gray-300 p-4 rounded-lg'>

                                {/*
                                <div className="bg-green-500 text-sm text-zinc-100 p-2 rounded">
                                    나의 아이디
                                </div>
                                */}


                                <div className='flex flex-row gap-2 items-center justify-between'>
                                    {/* dot */}
                                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                    <span className="text-sm text-gray-200">
                                        나의 아이디
                                    </span>
                                </div>


                                <div className="p-2 bg-zinc-800 rounded text-zinc-100 text-xl ">
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
                                    className="p-2 w-64 text-zinc-100 bg-zinc-800 rounded text-2xl "
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
                                    <span className='text-xs '>
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


                        {/*userCode && (
                            <div className='flex flex-row xl:flex-row gap-2 items-center justify-between border border-gray-300 p-4 rounded-lg'>

                                <div className="bg-green-500 text-sm text-zinc-100 p-2 rounded">
                                    {My_Profile_Picture}
                                </div>

                                <div className="p-2 bg-zinc-800 rounded text-zinc-100 text-xl ">
                                    <Uploader
                                        lang={params.lang}
                                        walletAddress={address as string}
                                    />
                                </div>

                            </div>
                        )*/}



                        {/*
                        {userCode && (

                            <div className='flex flex-row gap-2 items-center justify-between border border-gray-300 p-4 rounded-lg'>

                                <div className="bg-red-800 text-sm text-zinc-100 p-2 rounded">
                                    My Referral Code
                                </div>

                                <div className="p-2 bg-zinc-800 rounded text-zinc-100 text-xl ">
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

                                <div className="flex flex-col xl:flex-row p-2 bg-zinc-800 rounded text-zinc-100 text-xl 
                                gap-2 items-center justify-between">
                                    
                                    <div className="text-lg ">
                                        
                                        
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
                                    <div className="text-lg ">
                                        {buyer?.bankInfo?.accountNumber}
                                    </div>
                                    <div className="text-lg ">
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
                                    <div className='w-full flex flex-col gap-2 items-center justify-between'>
                                        <div className="w-full flex flex-row gap-2 items-center justify-start">
                                            {/* dot */}
                                            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                            <span className="text-sm  text-gray-200">
                                                구매자 가상계좌 정보
                                            </span>
                                        </div>

                                        {buyer?.bankInfo?.virtualAccount ? (
                                            <div className='flex flex-col gap-2 items-center justify-between'>
                                                {/* 제주은행 */}
                                                <span className='text-sm  text-gray-200'>
                                                    은행: 제주은행
                                                </span>
                                                <div className="flex flex-row gap-2 items-center justify-between">
                                                    <span className="p-2 bg-zinc-800 rounded text-zinc-100 text-xl ">
                                                        게좌번호:{' '}{
                                                            buyer.bankInfo.virtualAccount
                                                        }
                                                    </span>
                                                    {/* 복사 버튼 */}
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
                                                <span className='text-sm  text-gray-200'>
                                                    예금주: 스타디움엑스 (가상)
                                                </span>

                                                <div className='mt-5 flex flex-row gap-2 items-center justify-between'>
                                                    {/* dot */}
                                                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                                    <span className='text-sm  text-gray-200'>
                                                        가상계좌는 입금전용이며 출금은 지갑에서 가능합니다.
                                                    </span>
                                                </div>
                                                {/* 교화비윯 */}
                                                {/* 1 USDT = 1,470 KRW */}
                                                <div className='flex flex-col gap-2 items-center justify-between'>
                                                    <span className='text-sm  text-gray-200'>
                                                        환율: 1 USDT = 1,470 KRW
                                                    </span>
                                                    <span className='text-sm  text-gray-200'>
                                                        입금후 10분 이내에 확인됩니다.
                                                    </span>
                                                </div>
                                                
                                            </div>
                                        ) : (
                                            <div className='flex flex-row gap-2 items-center justify-between'>
                                                <span className='text-sm  text-gray-200'>
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
                                                <span className="text-sm  text-gray-200">
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
                                                    className="p-2 w-full text-2xl text-center  bg-zinc-800 rounded-lg text-zinc-100
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
                                                    className="p-2 w-full text-2xl text-center  bg-zinc-800 rounded-lg text-zinc-100
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
                                                    className="p-2 w-full text-2xl text-center  bg-zinc-800 rounded-lg text-zinc-100
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
                                                    className="p-2 w-full text-2xl text-center  bg-zinc-800 rounded-lg text-zinc-100
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
                                                    className="p-2 w-full text-2xl text-center  bg-zinc-800 rounded-lg text-zinc-100
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
                                                    className="p-2 w-full text-2xl text-center  bg-zinc-800 rounded-lg text-zinc-100
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
                                                    <span className='text-sm  text-red-500'>
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

                                                    p-2 rounded-lg text-sm 
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

                                        w-32 p-2 rounded-lg text-sm 

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
                                        className=" w-40 p-2 border border-gray-300 rounded text-black text-sm "
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value)}
                                        />

                                        <button
                                        disabled={!otp || isVerifingOtp}
                                        onClick={verifyOtp}
                                        className={`w-32 p-2 rounded-lg text-sm 

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




                      {/* bankTransfers */}
                        {/* 입급내역 (최신순) */}
                        {/*
                        {
                            "_id": {
                                "$oid": "67a1b6794e2131d430f1aea1"
                            },
                            "amount": 15000,
                            "sender": "이철호",
                            "custAccnt": "3522246464283",
                            "vactId": "V250204350140",
                            "regDate": "2025-02-04 15:32:35",
                            "distName": "스타디움엑스(가상)",
                            "mchtId": "w63791online",
                            "trxType": "입금",
                            "bankName": "제주은행",
                            "custBankName": "단위농협",
                            "account": "50902006486789"
                            }
                        */}
                        {address && bankTransfers && (
                            <div className='mt-5 w-full flex flex-col gap-2 items-center justify-between'>

                                <div className="w-full flex flex-row gap-2 items-start justify-start">
                                    {/* dot */}
                                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                    <span className="text-sm  text-gray-200">
                                        입금내역 (최신순)
                                    </span>
                                </div>

                                {bankTransfers.length === 0 && (
                                    <div className='flex flex-row gap-2 items-center justify-between'>
                                        <span className='text-sm  text-gray-200'>
                                            입금내역이 없습니다.
                                        </span>
                                    </div>
                                )}

                                {bankTransfers.map((transfer, index) => (
                                    <div key={index} className='flex flex-col gap-2 items-center justify-between'>

                                        <div className='flex flex-row gap-2 items-center justify-between'>
                                            <span className='text-sm  text-gray-200'>
                                                {transfer.regDate}
                                            </span>
                                        </div>

                                        <div className='flex flex-row gap-2 items-center justify-between'>
                                            <span className='text-sm  text-gray-200'>
                                                {transfer.bankName}
                                            </span>
                                            <span className='text-sm  text-gray-200'>
                                                {transfer.custBankName}
                                            </span>
                                        </div>

                                        <div className='flex flex-row gap-2 items-center justify-between'>
                                            <span className='text-sm  text-gray-200'>
                                                {transfer.sender}
                                            </span>
                                            <span className='text-sm  text-gray-200'>
                                                {transfer.account}
                                            </span>
                                        </div>

                                        <div className='flex flex-row gap-2 items-center justify-between'>
                                            <span className='text-sm  text-gray-200'>
                                                {transfer.amount} KRW
                                            </span>
                                        </div>

                                    </div>
                                ) )}

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

          
