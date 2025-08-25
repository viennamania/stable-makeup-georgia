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




const storecode = "admin";



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
 
    ///const wallet = searchParams.get('wallet');




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



  // get the active wallet
  const activeWallet = useActiveWallet();

  const setActiveAccount = useSetActiveWallet();
 
  const connectWallets = useConnectedWallets();

  //console.log('connectWallets', connectWallets);

  const smartConnectWallet = connectWallets?.[0];
  const inAppConnectWallet = connectWallets?.[1];






    const smartAccount = useActiveAccount();

    const address = smartAccount?.address;

      
 

    const [phoneNumber, setPhoneNumber] = useState("");

    useEffect(() => {
  
  
      if (smartAccount) {
  
        //const phoneNumber = await getUserPhoneNumber({ client });
        //setPhoneNumber(phoneNumber);
  
  
        getUserPhoneNumber({ client }).then((phoneNumber) => {
          setPhoneNumber(phoneNumber || "");
        });
  
  
  
      }
  
    } , [smartAccount]);








    const [nativeBalance, setNativeBalance] = useState(0);
    const [balance, setBalance] = useState(0);
    useEffect(() => {
  
      // get the balance
      const getBalance = async () => {
  
        ///console.log('getBalance address', address);
  
        
        const result = await balanceOf({
          contract,
          address: address || "",
        });
  
    
        //console.log(result);
    
        setBalance( Number(result) / 10 ** 6 );
  
  
        await fetch('/api/user/getBalanceByWalletAddress', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            chain: storecode,
            walletAddress: address,
          }),
        })
  
        .then(response => response.json())
  
        .then(data => {
            setNativeBalance(data.result?.displayValue);
        });
  
  
  
      };
  
      if (address) getBalance();
  
      const interval = setInterval(() => {
        if (address) getBalance();
      } , 5000);
  
      return () => clearInterval(interval);
  
    } , [address, contract, storecode]);
  




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



    const [seller, setSeller] = useState(null) as any;




    useEffect(() => {
        const fetchData = async () => {
            const response = await fetch("/api/user/getUser", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    storecode: storecode,
                    walletAddress: address,
                }),
            });

            const data = await response.json();

            ////console.log("data", data);

            if (data.result) {
                setNickname(data.result.nickname);
                
                data.result.avatar && setAvatar(data.result.avatar);
                

                setUserCode(data.result.id);

                setSeller(data.result.seller);

                setEscrowWalletAddress(data.result.escrowWalletAddress);
            } else {
                setNickname('');
                setAvatar('/profile-default.png');
                setUserCode('');
                setSeller(null);
                setEditedNickname('');
                setAccountHolder('');
                setAccountNumber('');

                setEscrowWalletAddress('');

                //setBankName('');
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
                    storecode: storecode,
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

                toast.success('아이디이 저장되었습니다');

            } else {

                toast.error('아이디 저장에 실패했습니다');
            }


        } else {

            const response = await fetch("/api/user/setUserVerified", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    lang: params.lang,
                    storecode: storecode,
                    walletAddress: address,
                    
                    //nickname: nickname,
                    nickname: editedNickname,

                    mobile: phoneNumber,
                }),
            });

            const data = await response.json();

            console.log("data", data);

            if (data.result) {

                setUserCode(data.result.id);
                setNickname(data.result.nickname);

                setNicknameEdit(false);
                setEditedNickname('');

                toast.success('아이디이 저장되었습니다');

            } else {
                toast.error('아이디 저장에 실패했습니다');
            }
        }


        

        
    }


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
                storecode: storecode,
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
                storecode: storecode,
                walletAddress: address,
            }),
          }).then((response) => response.json())
            .then((data) => {
                setSeller(data.result.seller);
            });

  
  
  
          /////toast.success('USDT sent successfully');
  
        
  
  
      } catch (error) {
        toast.error('Failed to apply');
      }
  
      setApplying(false);
    };






    const [escrowWalletAddress, setEscrowWalletAddress] = useState('');
    const [makeingEscrowWallet, setMakeingEscrowWallet] = useState(false);

    const makeEscrowWallet = async () => {
        
        if (!address) {
            toast.error('Please connect your wallet');
            return;
        }


        setMakeingEscrowWallet(true);

        fetch('/api/order/getEscrowWalletAddress', {
            method: 'POST',
            headers: {
            'Content-Type': 'application/json',
            },
            body: JSON.stringify({
            lang: params.lang,
            storecode: storecode,
            walletAddress: address,
            //isSmartAccount: activeWallet === inAppConnectWallet ? false : true,
            isSmartAccount: false,
            }),
        })
        .then(response => response.json())
        .then(data => {
            
            //console.log('getEscrowWalletAddress data.result', data.result);


            if (data.result) {
                setEscrowWalletAddress(data.result.escrowWalletAddress);
                toast.success(Escrow_Wallet_Address_has_been_created);
            } else {
                toast.error(Failed_to_create_Escrow_Wallet_Address);
            }
        })
        .finally(() => {
            setMakeingEscrowWallet(false);
        });

    }

    //console.log("escrowWalletAddress", escrowWalletAddress);




    // get escrow wallet address and balance
    
    const [escrowBalance, setEscrowBalance] = useState(0);
    const [escrowNativeBalance, setEscrowNativeBalance] = useState(0);

    
    useEffect(() => {

    const getEscrowBalance = async () => {

        if (!address) {
        setEscrowBalance(0);
        return;
        }

        if (!escrowWalletAddress || escrowWalletAddress === '') return;


        
        const result = await balanceOf({
        contract,
        address: escrowWalletAddress,
        });

        //console.log('escrowWalletAddress balance', result);

    
        setEscrowBalance( Number(result) / 10 ** 6 );
            


        /*
        await fetch('/api/user/getUSDTBalanceByWalletAddress', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            chain: storecode,
            walletAddress: escrowWalletAddress,
        }),
        })
        .then(response => response?.json())
        .then(data => {

        console.log('getUSDTBalanceByWalletAddress data.result.displayValue', data.result?.displayValue);

        setEscrowBalance(data.result?.displayValue);

        } );
        */




        await fetch('/api/user/getBalanceByWalletAddress', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            storecode: storecode,
            walletAddress: escrowWalletAddress,
        }),
        })
        .then(response => response?.json())
        .then(data => {


        ///console.log('getBalanceByWalletAddress data', data);


            setEscrowNativeBalance(data.result?.displayValue);

        });
        



    };

    getEscrowBalance();

    const interval = setInterval(() => {
        getEscrowBalance();
    } , 5000);

    return () => clearInterval(interval);

    } , [address, escrowWalletAddress, contract, storecode]);




    // transfer escrow balance to seller wallet address

    const [amountOfEscrowBalance, setAmountOfEscrowBalance] = useState("");

    const [transferingEscrowBalance, setTransferingEscrowBalance] = useState(false);


    const transferEscrowBalance = async () => {

        if (transferingEscrowBalance) {
        return;
        }

        setTransferingEscrowBalance(true);

        try {

        const response = await fetch('/api/order/transferEscrowBalanceToSeller', {
            method: 'POST',
            headers: {
            'Content-Type': 'application/json'
            },
            body: JSON.stringify({
            lang: params.lang,
            storecode: storecode,
            walletAddress: address,
            amount: amountOfEscrowBalance,
            ///escrowWalletAddress: escrowWalletAddress,
            //isSmartAccount: activeWallet === inAppConnectWallet ? false : true,
            isSmartAccount: false,
            })
        });

        const data = await response.json();

        //console.log('data', data);

        if (data.result) {

            setAmountOfEscrowBalance("");

            toast.success('Escrow balance has been transfered to seller wallet address');

        }

        } catch (error) {
        console.error('Error:', error);
        toast.error('Transfer escrow balance has been failed');
        }

        setTransferingEscrowBalance(false);

    }




    return (

        <main className="p-4 min-h-[100vh] flex items-start justify-center container max-w-screen-sm mx-auto">

            <div className="py-0 w-full">
        

                {storecode && (
                    <div className="w-full flex flex-row items-center justify-center gap-2 bg-black/10 p-2 rounded-lg mb-4">
                        <span className="text-sm text-zinc-500">
                        {storecode}
                        </span>
                    </div>
                )}
        
                <div className="w-full flex flex-row gap-2 items-center justify-between text-zinc-500 text-lg"
                >
                    {/* go back button */}
                    <div className="flex justify-start items-center gap-2">
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

                        <ConnectButton
                        client={client}
                        wallets={wallets}

                        
                        //accountAbstraction={{
                        //    chain: arbitrum,
                        //    sponsorGas: true
                        //}}
                        
                        
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
                    )}
                    */}

                    {address && (
                        <div className="flex flex-row items-center justify-center gap-2">
                            <Image
                                src="/icon-shield.png"
                                alt="Check"
                                width={20}
                                height={20}
                                className="rounded-full"
                            />
                            <button
                                onClick={() => {
                                    navigator.clipboard.writeText(address as string);
                                    toast.success(Copied_Wallet_Address);
                                }}
                                className="
                                text-sm text-gray-500 font-semibold
                                hover:text-gray-700 transition duration-200
                                underline underline-offset-4"
                            >
                                <span className="text-lg text-gray-500 font-semibold">
                                    {address.slice(0, 6)}...{address.slice(-4)}
                                </span>
                            </button>

                        </div>
                    )}


                </div>



                <div className="mt-5 flex flex-col items-start justify-center space-y-4">

                    <div className='flex flex-row items-center space-x-4'>
                        <Image
                            src={"/icon-user.png"}
                            alt="Avatar"
                            width={20}
                            height={20}
                            priority={true} // Added priority property
                            className="rounded-full"
                            style={{
                                objectFit: 'cover',
                                width: '20px',
                                height: '20px',
                            }}
                        />
                        <div className="text-xl font-semibold">
                            {Profile_Settings}
                            
                        </div>


                    </div>


                    {/* 회원코드(id) */}
                    {userCode && (
                        <div className='flex flex-row gap-2 items-center justify-between border border-gray-300 p-4 rounded-lg'>
                            <div className="flex flex-row items-center gap-2">
                                {/* dot */}
                                <div className='w-2 h-2 bg-green-500 rounded-full'></div>
                                <span className="text-lg">
                                    회원코드
                                </span>
                            </div>
                            <span className="text-xl font-semibold text-zinc-500">
                                {userCode}
                            </span>
                            <button
                                onClick={() => {
                                    navigator.clipboard.writeText(userCode);
                                    toast.success('회원코드가 복사되었습니다');
                                }}
                                className="p-2 bg-green-500 text-zinc-100 rounded-lg"
                            >
                                복사
                            </button>
                        </div>
                    )}



                
                    <div className='w-full  flex flex-col gap-5 '>

                        {userCode && (
                            <div className='flex flex-row gap-2 items-center justify-between border border-gray-300 p-4 rounded-lg'>


                                <div className="flex flex-row items-center gap-2">
                                    {/* dot */}
                                    <div className='w-2 h-2 bg-green-500 rounded-full'></div>
                                    <span className="text-lg">
                                        나의 아이디
                                    </span>
                                </div>


                                <span className="text-xl font-semibold text-zinc-500">
                                    {nickname}
                                </span>



                                
                                <button
                                    onClick={() => {

                                        nicknameEdit ? setNicknameEdit(false) : setNicknameEdit(true);

                                    } }
                                    className="p-2 bg-green-500 text-zinc-100 rounded-lg"
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


                                <div className="flex flex-row items-center gap-2">
                                    {/* dot */}
                                    <div className='w-2 h-2 bg-green-500 rounded-full'></div>
                                    <span className="text-lg">
                                        {nicknameEdit ? "내 아이디 수정" : "내 아이디 설정"}
                                    </span>
                                </div>


                                <div className='flex flex-col gap-2'>
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
                                </div>
                                <button
                                    disabled={!address}
                                    className="p-2 bg-green-500 text-zinc-100 rounded-lg"
                                    onClick={() => {
                                        setUserData();
                                    }}
                                >
                                    {Save}
                                </button>

                                

                            </div>
                        )}


                        {false && userCode && (
                            <div className='flex flex-row xl:flex-row gap-2 items-center justify-between border border-gray-300 p-4 rounded-lg'>

                                <div className="bg-green-500 text-sm text-zinc-100 p-2 rounded-lg">
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


                    </div>


                </div>



                <div className='hidden w-full flex-col gap-5 mt-4'>
                    <div className='w-full flex flex-row items-center justify-start gap-2'>
                        <Image
                            src={"/icon-gear.png"}
                            alt="Settings"
                            width={20}
                            height={20}
                            className="rounded-full"
                        />
                        <span className='text-xl font-semibold text-zinc-500'>
                            지갑 관리
                        </span>
                    </div>

                    <div className='w-full flex flex-col gap-2
                    border border-gray-300 p-4 rounded-lg'>

                        <div className='flex flex-row items-center justify-start gap-2 mb-2'>
                            {/* dot */}
                            <div className='w-2 h-2 bg-green-500 rounded-full'></div>
                            <span className='text-lg'>
                                {Wallet_Settings}
                            </span>
                        </div>


                        <ConnectButton
                        client={client}
                        wallets={wallets}

                        
                        //accountAbstraction={{
                        //    chain: arbitrum,
                        //    sponsorGas: true
                        //}}
                        
                        
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

                    </div>


                </div>


            </div>

        </main>

    );

}

          
