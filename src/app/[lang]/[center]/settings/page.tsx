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


import Uploader from '@/components/uploader-store';

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
 
    ///const wallet = searchParams.get('wallet');

    const storecode = "admin";



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


    const [user, setUser] = useState(null) as any;

    const [loadingUser, setLoadingUser] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            
            setLoadingUser(true);

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

            
            console.log("getUser data", data);



            if (data.result) {
                setUser(data.result);

                setNickname(data.result.nickname);
                
                data.result.avatar && setAvatar(data.result.avatar);
                

                setUserCode(data.result.id);

                setSeller(data.result.seller);

            } else {
                setUser(null);

                setNickname('');
                setAvatar('/profile-default.png');
                setUserCode('');
                setSeller(null);
                setEditedNickname('');

                //setBankName('');
            }
            setLoadingUser(false);

        };

        address && storecode && fetchData();

    }, [address, storecode]);




    // getOneStore
    





    // set storeName
    const setStoreName = async () => {
        if (!address) {
            toast.error(Please_connect_your_wallet_first);
            return;
        }
        if (editedNickname.length < 2 || editedNickname.length > 10) {

            toast.error("가맹점 이름을 2자 이상 10자 이하로 설정하세요");
            return;
        }

        const response = await fetch('/api/store/setStoreName', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                lang: params.lang,
                storecode: params.center,
                walletAddress: address,
                storeName: editedNickname,
            }),
        });
        const data = await response.json();
        //console.log("data", data);
        if (data.result) {
            toast.success('가맹점 이름이 설정되었습니다');
            setNickname(editedNickname);
            setNicknameEdit(false);
            setEditedNickname('');
        } else {
            toast.error('가맹점 이름 설정에 실패하였습니다');
        }
    }







    // set storeDescription
    const [storeDescription, setStoreDescription] = useState("");

    const writeStoreDescription = async () => {
        if (!address) {
            toast.error(Please_connect_your_wallet_first);
            return;
        }
        if (storeDescription.length < 2 || storeDescription.length > 100) {
            toast.error("가맹점 설명을 2자 이상 100자 이하로 설정하세요");
            return;
        }
        const response = await fetch('/api/store/setStoreDescription', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                lang: params.lang,
                storecode: params.center,
                walletAddress: address,
                storeDescription: storeDescription,
            }),
        });
        const data = await response.json();

        //console.log("data", data);

        if (data.result) {
            toast.success('가맹점 설명이 설정되었습니다');
            setStoreDescription(storeDescription);
        } else {
            toast.error('가맹점 설명 설정에 실패하였습니다');
        }
    }




    // set storeBankInfo
    const [bankName, setBankName] = useState("");
    const [accountNumber, setAccountNumber] = useState("");
    const [accountHolder, setAccountHolder] = useState("");

    const [writingStoreBankInfo, setWritingStoreBankInfo] = useState(false);

    const writeStoreBankInfo = async () => {
        if (!address) {
            toast.error(Please_connect_your_wallet_first);
            return;
        }
        if (bankName.length < 2 || bankName.length > 20) {
            toast.error("은행 이름을 2자 이상 20자 이하로 설정하세요");
            return;
        }
        if (accountNumber.length < 2 || accountNumber.length > 20) {
            toast.error("계좌 번호를 2자 이상 20자 이하로 설정하세요");
            return;
        }
        if (accountHolder.length < 2 || accountHolder.length > 20) {
            toast.error("예금주 이름을 2자 이상 20자 이하로 설정하세요");
            return;
        }
        setWritingStoreBankInfo(true);
        const response = await fetch('/api/store/setStoreBankInfo', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                lang: params.lang,
                storecode: params.center,
                walletAddress: address,
                bankName: bankName,
                accountNumber: accountNumber,
                accountHolder: accountHolder,
            }),
        });
        const data = await response.json();
        //console.log("data", data);
        if (data.result) {
            toast.success('가맹점 은행 정보가 설정되었습니다');
            setBankName('');
            setAccountNumber('');
            setAccountHolder('');


            
            fetchStore();


        } else {
            toast.error('가맹점 은행 정보 설정에 실패하였습니다');
        }
        setWritingStoreBankInfo(false);
    }
















    // check box edit seller
    const [editSeller, setEditSeller] = useState(false);


    const [otp, setOtp] = useState('');

    ///const [verifiedOtp, setVerifiedOtp] = useState(false);
    const [verifiedOtp, setVerifiedOtp] = useState(true);
  
    const [isSendedOtp, setIsSendedOtp] = useState(false);
  
  
  
    const [isSendingOtp, setIsSendingOtp] = useState(false);
  
    const [isVerifingOtp, setIsVerifingOtp] = useState(false);
  
    




    // get store by storecode
    const [fetchingStore, setFetchingStore] = useState(false);
    const [store, setStore] = useState<any>(null);
    
    const fetchStore = async () => {
        if (fetchingStore) {
        return;
        }
        setFetchingStore(true);
        const response = await fetch('/api/store/getOneStore', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(
            {
            storecode: params.center,
            }
        ),
        });
        if (!response.ok) {
        setFetchingStore(false);
        return;
        }
        const data = await response.json();
        
        console.log('getOneStore data', data);

        setStore(data.result);

        setStoreDescription(data.result.storeDescription);


        setFetchingStore(false);

        return data.result;
    }

    useEffect(() => {

        fetchStore();
        
    } , [params.center]);





    // fetch all buyer user 
    const [fetchingAllAdminSellers, setFetchingAllAdminSellers] = useState(false);
    const [allAdminSellers, setAllAdminSellers] = useState([] as any[]);

    const fetchAllAdminSeller = async () => {
        if (fetchingAllAdminSellers) {
        return;
        }
        setFetchingAllAdminSellers(true);
        
        const response = await fetch('/api/user/getAllSellersByStorecode', {

        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(
            {
            
            storecode: "admin",

            limit: 10,
            page: 1,
            }
        ),
        });
        if (!response.ok) {
        setFetchingAllAdminSellers(false);
        toast.error('회원 검색에 실패했습니다.');
        return;
        }
        const data = await response.json();

        ///console.log('getAllSellersByStorecode data', data);

        setAllAdminSellers(data.result.users);
        //setTotalCount(data.result.totalCount);

        setFetchingAllAdminSellers(false);

        return data.result.users;
    }

    useEffect(() => {
        if (!address) {
        setAllAdminSellers([]);
        return;
        }
        fetchAllAdminSeller();
    } , [address, params.center]);







    // fetch all seller for store
    // 가맹점 판매자 검색
    const [fetchingAllStoreSellers, setFetchingAllStoreSellers] = useState(false);
    const [allStoreSellers, setAllStoreSellers] = useState([] as any[]);
    const fetchAllStoreSellers = async () => {
        if (fetchingAllStoreSellers) {
            return;
        }
        setFetchingAllStoreSellers(true);
        const response = await fetch('/api/user/getAllSellersByStorecode', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(
                {
                    storecode: params.center,
                    limit: 10,
                    page: 1,
                }
            ),
        });
        if (!response.ok) {
            setFetchingAllStoreSellers(false);
            toast.error('회원 검색에 실패했습니다.');
            return;
        }
        const data = await response.json();
        //console.log('getAllSellersByStorecode data', data);
        setAllStoreSellers(data.result.users);
        //setTotalCount(data.result.totalCount);
        setFetchingAllStoreSellers(false);
        return data.result.users;
    }

    useEffect(() => {
        if (!address) {
            setAllStoreSellers([]);
            return;
        }
        fetchAllStoreSellers();
    } , [address, params.center]);







    // update adminWalletAddress of store
    // 가맹점 관리자 변경
    const [updatingAdminWalletAddress, setUpdatingAdminWalletAddress] = useState(false);
    const [selectedAdminWalletAddress, setSelectedAdminWalletAddress] = useState('');
    const updateAdminWalletAddress = async () => {
        if (updatingAdminWalletAddress) {
        return;
        }
        setUpdatingAdminWalletAddress(true);
        const response = await fetch('/api/store/updateStoreAdminWalletAddress', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(
            {
            storecode: params.center,
            adminWalletAddress: selectedAdminWalletAddress,
            }
        ),
        });
        if (!response.ok) {
        setUpdatingAdminWalletAddress(false);
        toast.error('가맹점 관리자 변경에 실패했습니다.');
        return;
        }

        const data = await response.json();
        //console.log('data', data);
        if (data.result) {
        toast.success('가맹점 관리자가 변경되었습니다.');
        setSelectedAdminWalletAddress('');

        fetchStore();

        } else {
        toast.error('가맹점 관리자 변경에 실패했습니다.');
        }

        setUpdatingAdminWalletAddress(false);

        return data.result;
    }





    // update settlementWalletAddress of store
    // 가맹점 결제지갑 변경
    const [updatingSettlementWalletAddress, setUpdatingSettlementWalletAddress] = useState(false);
    const [selectedSettlementWalletAddress, setSelectedSettlementWalletAddress] = useState('');
    const updateSettlementWalletAddress = async () => {
        if (updatingAdminWalletAddress) {
        return;
        }
        setUpdatingSettlementWalletAddress(true);
        const response = await fetch('/api/store/updateStoreSettlementWalletAddress', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(
            {
            storecode: params.center,
            settlementWalletAddress: selectedSettlementWalletAddress,
            }
        ),
        });
        if (!response.ok) {
        setUpdatingSettlementWalletAddress(false);
        toast.error('가맹점 자동결제용 USDT지갑 변경에 실패했습니다.');
        return;
        }

        const data = await response.json();
        //console.log('data', data);
        if (data.result) {
        toast.success('가맹점 자동결제용 USDT지갑이 변경되었습니다.');
        setSelectedSettlementWalletAddress('');

        fetchStore();

        } else {
        toast.error('가맹점 자동결제용 USDT지갑 변경에 실패했습니다.');
        }

        setUpdatingSettlementWalletAddress(false);

        return data.result;
    }



    // update settlementFeeWalletAddress of store
    // 가맹점 수수료 지갑 변경
    const [updatingSettlementFeeWalletAddress, setUpdatingSettlementFeeWalletAddress] = useState(false);
    const [selectedSettlementFeeWalletAddress, setSelectedSettlementFeeWalletAddress] = useState('');
    const updateSettlementFeeWalletAddress = async () => {
        if (updatingSettlementFeeWalletAddress) {
            return;
        }
        setUpdatingSettlementFeeWalletAddress(true);
        const response = await fetch('/api/store/updateStoreSettlementFeeWalletAddress', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(
                {
                    storecode: params.center,
                    settlementFeeWalletAddress: selectedSettlementFeeWalletAddress,
                }
            ),
        });
        if (!response.ok) {
            setUpdatingSettlementFeeWalletAddress(false);
            toast.error('가맹점 수수료 지갑 변경에 실패했습니다.');
            return;
        }
        const data = await response.json();
        //console.log('data', data);
        if (data.result) {
            toast.success('가맹점 수수료 지갑이 변경되었습니다.');
            setSelectedSettlementFeeWalletAddress('');

            fetchStore();

        } else {
            toast.error('가맹점 수수료 지갑 변경에 실패했습니다.');
        }
        setUpdatingSettlementFeeWalletAddress(false);
        return data.result;
    }



    
    // update settlementFeePercent
    // 가맹점 수수료 비율 변경
    const [updatingSettlementFeePercent, setUpdatingSettlementFeePercent] = useState(false);
    const [settlementFeePercent, setSettlementFeePercent] = useState(store?.settlementFeePercent || 0.0);
    const updateSettlementFeePercent = async () => {
        if (updatingSettlementFeePercent) {
            return;
        }
        setUpdatingSettlementFeePercent(true);
        const response = await fetch('/api/store/updateStoreSettlementFeePercent', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(
                {
                    storecode: params.center,
                    settlementFeePercent: settlementFeePercent,
                }
            ),
        });
        if (!response.ok) {
            setUpdatingSettlementFeePercent(false);
            toast.error('가맹점 수수료 비율 변경에 실패했습니다.');
            return;
        }
        const data = await response.json();
        //console.log('data', data);
        if (data.result) {
            toast.success('가맹점 수수료 비율이 변경되었습니다.');
            setSettlementFeePercent(0);

            fetchStore();

        } else {
            toast.error('가맹점 수수료 비율 변경에 실패했습니다.');
        }
        setUpdatingSettlementFeePercent(false);
        return data.result;
    }








    // update sellerWalletAddress of store
    // 가맬점 판매자 지갑 변경
    const [updatingSellerWalletAddress, setUpdatingSellerWalletAddress] = useState(false);
    const [selectedSellerWalletAddress, setSelectedSellerWalletAddress] = useState('');
    const updateSellerWalletAddress = async () => {
        if (updatingSellerWalletAddress) {
            return;
        }
        setUpdatingSellerWalletAddress(true);
        const response = await fetch('/api/store/updateStoreSellerWalletAddress', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(
                {
                    storecode: params.center,
                    sellerWalletAddress: selectedSellerWalletAddress,
                }
            ),
        });
        if (!response.ok) {
            setUpdatingSellerWalletAddress(false);
            toast.error('가맹점 판매자 변경에 실패했습니다.');
            return;
        }
        const data = await response.json();
        //console.log('data', data);
        if (data.result) {
            toast.success('가맹점 판매자가 변경되었습니다.');
            setSelectedSellerWalletAddress('');

            fetchStore();

        } else {
            toast.error('가맹점 판매자 변경에 실패했습니다.');
        }
        setUpdatingSellerWalletAddress(false);
        return data.result;
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



                    {!address && (
                    <ConnectButton
                        client={client}
                        wallets={wallets}
                        chain={arbitrum}
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

                    {address && !loadingUser && (
                        <div className="w-full flex flex-row items-center justify-end gap-2">

                            <span className="text-sm text-zinc-500">
                            {user?.nickname || "프로필"}
                            </span>

                        </div>
                    )}

                </div>




                <div className="flex flex-col items-start justify-center space-y-4">

                    <div className='flex flex-row items-center space-x-4'>
                        <Image
                            src={store?.storeLogo || "/icon-store.png"}
                            alt="Store Logo"
                            width={35}
                            height={35}
                            className="w-10 h-10 rounded-full"
                        />

                        <div className="text-xl font-semibold">
                        가맹점{' '}{
                            store && store.storeName + " (" + store.storecode + ")"
                        }{' '}관리
                        </div>
                    </div>


                
                    

                    {!fetchingStore && store && (

                        <>

                            <div className='w-full flex flex-col items-start justify-center gap-2
                                border border-gray-300 p-4 rounded-lg'>

                                <div className='w-full flex flex-row items-center justify-between gap-2'>


                                    <div className="flex flex-row items-center gap-2">
                                        {/* dot */}
                                        <div className='w-2 h-2 bg-green-500 rounded-full'></div>
                                        <span className="text-lg">
                                            가맹점 이름
                                        </span>
                                    </div>

                                    <button
                                        onClick={() => {

                                            nicknameEdit ? setNicknameEdit(false) : setNicknameEdit(true);

                                        } }
                                        className="bg-[#3167b4] text-zinc-100 rounded-lg p-2"
                                        disabled={!address}
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







                                { (address && (nicknameEdit || !userCode)) && (
                                    <div className='w-full flex flex-col gap-2 items-start justify-start'>


                                        <div className="flex flex-row items-center gap-2">
                                            {/* dot */}
                                            <div className='w-2 h-2 bg-green-500 rounded-full'></div>
                                            <span className="text-lg">
                                                {nicknameEdit ? "가맹점 이름 수정" : "가맹점 이름 설정"}
                                            </span>
                                        </div>


                                        <div className='flex flex-row gap-2 items-center justify-between'>
                                            <div className='flex flex-col gap-2'>
                                                <input
                                                    disabled={!address}
                                                    className="p-2 w-64 text-zinc-100 bg-zinc-800 rounded text-xl font-semibold"
                                                    placeholder="가맹점 이름을 입력하세요"
                                                    
                                                    //value={nickname}
                                                    value={editedNickname}

                                                    type='text'
                                                    onChange={(e) => {


                                                        //setNickname(e.target.value);

                                                        setEditedNickname(e.target.value);

                                                    } }


                                                />
                                                <div className='flex flex-row gap-2 items-center justify-between'>
                                                    <span className='text-sm font-semibold'>
                                                        {nicknameEdit ? "가맹점 이름을 수정하세요" : "가맹점 이름을 설정하세요"}
                                                    </span>
                                                </div>
                                            </div>

                                            <button
                                                disabled={!address || !editedNickname}
                                                className={`bg-[#3167b4] text-zinc-100 rounded-lg p-2 ${!editedNickname ? "opacity-50" : ""}`}
                                                onClick={() => {
                                                    if (!editedNickname) {
                                                        toast.error("가맹점 이름을 입력하세요");
                                                        return;
                                                    }
                                                    setStoreName();
                                                    setNicknameEdit(false);
                                                    setEditedNickname('');
                                                }}
                                            >
                                                {Save}
                                            </button>
                                        
                                        </div>

                                        

                                    </div>
                                )}

                            </div>

                            {/* storeDescription */}
                            <div className='w-full flex flex-col items-start justify-center gap-2
                                border border-gray-300 p-4 rounded-lg'>

                                <div className='w-full flex flex-row items-center justify-between gap-2'>
                                    <div className="w-full flex flex-row items-center justify-start gap-2">
                                        {/* dot */}
                                        <div className='w-2 h-2 bg-green-500 rounded-full'></div>
                                        <span className="text-lg">
                                            가맹점 설명
                                        </span>
                                    </div>
                                    <input
                                        disabled={!address}
                                        className="bg-[#1f2937] text-zinc-100 rounded-lg p-2 w-full text-sm"
                                        placeholder="가맹점 설명을 입력하세요"
                                        value={storeDescription}
                                        type='text'
                                        onChange={(e) => {
                                            setStoreDescription(e.target.value);
                                        } }
                                    />
                                    <button
                                        disabled={!address || !storeDescription}
                                        className={`bg-[#3167b4] text-zinc-100 rounded-lg p-2 ${!storeDescription ? "opacity-50" : ""}`}
                                        onClick={() => {
                                            if (!storeDescription) {
                                                toast.error("가맹점 설명을 입력하세요");
                                                return;
                                            }
                                            writeStoreDescription();
                                        }}
                                    >
                                        {Save}
                                    </button>
                                </div>
                            
                            </div>


    
                            <div className='w-full flex flex-row gap-2 items-center justify-between border border-gray-300 p-4 rounded-lg'>

                                <div className="flex flex-row items-center gap-2">
                                    {/* dot */}
                                    <div className='w-2 h-2 bg-green-500 rounded-full'></div>
                                    <span className="text-lg">
                                        가맹점 로고
                                    </span>
                                </div>

                                <div className="p-2 bg-zinc-800 rounded text-zinc-100 text-xl font-semibold">
                                    <Uploader
                                        lang={params.lang}
                                        storecode={params.center as string}
                                    />
                                </div>

                            </div>









                        {/* store adminWalletAddress */}
                        
                        <div className="w-full flex flex-col gap-5 items-center justify-between border border-gray-300 p-4 rounded-lg">
                            

                            <div className='w-full flex flex-row items-start gap-2'>
                                <Image
                                    src="/icon-manager.png"
                                    alt="Manager"
                                    width={20}
                                    height={20}
                                    className="w-5 h-5"
                                />
                                <span className="text-lg text-zinc-500">
                                    가맹점 관리자 설정
                                </span>
                            </div>



                            <div className="flex flex-col xl:flex-row items-center justify-center gap-2">
                    


                                {!fetchingStore && store && store.adminWalletAddress ? (
                                <button
                                    onClick={() => {
                                    navigator.clipboard.writeText(store.adminWalletAddress);
                                    toast.success(Copied_Wallet_Address);
                                    } }
                                    className="text-lg text-zinc-500 underline"
                                >
                                    {store && store.adminWalletAddress.substring(0, 6)}...{store && store.adminWalletAddress.substring(store.adminWalletAddress.length - 4)}
                                </button>
                                ) : (
                                <div className="flex flex-row items-center justify-start gap-2">
                                    <Image
                                    src="/icon-warning.png"
                                    alt="Warning"
                                    width={20}
                                    height={20}
                                    className="w-5 h-5"
                                    />
                                    <span className="text-sm text-red-500">
                                    {store && store.storeName}의 가맹점 관리자 설정이 되어 있지 않습니다.
                                    </span>
                                </div>
                                )}

                                {fetchingStore && (
                                <Image
                                    src="/loading.png"
                                    alt="Loading"
                                    width={20}
                                    height={20}
                                    className="animate-spin"
                                />
                                )}

                                {!fetchingAllStoreSellers && allStoreSellers && allStoreSellers.length > 0 ? (
                                
                                <div className="hidden w-full flex-row items-center justify-center gap-2">
                                    <select
                                    value={selectedAdminWalletAddress}
                                    onChange={(e) => setSelectedAdminWalletAddress(e.target.value)}
                                    className="w-36 p-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500
                                        bg-white text-zinc-500 text-sm"
                                    disabled={updatingAdminWalletAddress}
                                    >
                                    <option value="">가맹점 관리자 변경</option>
                                    {allStoreSellers.map((user) => (
                                        <option key={user._id} value={user.walletAddress}>
                                        {user.nickname}
                                        {' '}
                                        ({user.walletAddress.substring(0, 6)}...{user.walletAddress.substring(user.walletAddress.length - 4)})
                                        </option>
                                    ))}
                                    </select>
                                    <button
                                    onClick={() => {
                                        if (!selectedAdminWalletAddress) {
                                        toast.error('가맹점 관리자를 선택하세요.');
                                        return;
                                        }
                                        if (selectedAdminWalletAddress === store?.adminWalletAddress) {
                                        toast.error('현재 가맹점 관리자와 동일합니다.');
                                        return;
                                        }

                                        confirm(
                                        `정말 ${selectedAdminWalletAddress}로 가맹점 관리자를 변경하시겠습니까?`
                                        ) && updateAdminWalletAddress();
                                    }}
                                    className={`bg-[#3167b4] text-sm text-white px-4 py-2 rounded-lg
                                        ${updatingAdminWalletAddress ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                    {updatingAdminWalletAddress ? '변경 중...' : '변경'}
                                    </button> 
                                </div>
                                ) : (

                                    <div className='flex flex-col items-center justify-center gap-2'>

                                        <div className="flex flex-row items-center justify-center gap-2">
                                            <Image
                                            src="/icon-warning.png"
                                            alt="Warning"
                                            width={20}
                                            height={20}
                                            className="w-5 h-5"
                                            />
                                            <span className="text-sm text-red-500">
                                            {store && store.storeName}의 회원이 없습니다.
                                            <br />
                                            가맹점 홈페이지에서 회원가입 후 가맹점 관리자를 설정하세요.
                                            </span>
                                        </div>

                                        {/* new window button for store admin page */}
                                        <button
                                            onClick={() => {
                                                window.open(
                                                    `/${params.lang}/${params.storecode}/center`,
                                                    '_blank'
                                                );
                                            }}
                                            className="bg-[#3167b4] text-sm text-white px-4 py-2 rounded-lg"
                                        >
                                            가맹점 관리자 홈페이지 열기
                                        </button>

                                    </div>


                                )}


                            </div>

                        </div>
                        

                        {/* store settlementWalletAddress */}
                        <div className="w-full flex flex-col gap-5 items-center justify-between border border-gray-300 p-4 rounded-lg">
                            

                            <div className='w-full flex flex-row items-start gap-2'>
                                <Image
                                    src="/icon-settlement.png"
                                    alt="Settlement"
                                    width={20}
                                    height={20}
                                    className="w-5 h-5"
                                />
                                <span className="text-lg text-zinc-500">
                                    가맹점 자동결제용 USDT지갑 설정
                                </span>
                            </div>
                            <div className="flex flex-col xl:flex-row items-center justify-center gap-2">


                                {!fetchingStore && store && store.settlementWalletAddress ? (
                                <button
                                    onClick={() => {
                                    navigator.clipboard.writeText(store.settlementWalletAddress);
                                    toast.success(Copied_Wallet_Address);
                                    } }
                                    className="text-lg text-zinc-500 underline"
                                >
                                    {store && store.settlementWalletAddress.substring(0, 6)}...{store && store.settlementWalletAddress.substring(store.settlementWalletAddress.length - 4)}
                                </button>
                                ) : (
                                <div className="flex flex-row items-center justify-start gap-2">
                                    <Image
                                    src="/icon-warning.png"
                                    alt="Warning"
                                    width={20}
                                    height={20}
                                    className="w-5 h-5"
                                    />
                                    <span className="text-lg text-red-500">
                                    {store && store.storeName}의 가맹점 자동결제용 USDT지갑이 설정되지 않았습니다.
                                    </span>
                                </div>
                                )}

                                {fetchingAllStoreSellers && (
                                <Image
                                    src="/loading.png"
                                    alt="Loading"
                                    width={20}
                                    height={20}
                                    className="animate-spin"
                                />
                                )}

                                {!fetchingAllStoreSellers && allStoreSellers && allStoreSellers.length > 0 ? (
                                
                                <div className="hidden w-full flex-row items-center justify-center gap-2">
                                    {/* select list of all users */}
                                    <select
                                    value={selectedSettlementWalletAddress}
                                    onChange={(e) => setSelectedSettlementWalletAddress(e.target.value)}
                                    className="w-36 p-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500
                                        bg-white text-zinc-500 text-sm"
                                    disabled={updatingSettlementWalletAddress}
                                    >
                                    <option value="">가맹점 자동결제용 USDT지갑 변경</option>
                                    {allStoreSellers.map((user) => (
                                        <option key={user._id} value={user.walletAddress}>
                                        {user.nickname}
                                        {' '}
                                        ({user.walletAddress.substring(0, 6)}...{user.walletAddress.substring(user.walletAddress.length - 4)})
                                        </option>
                                    ))}
                                    </select>
                                    <button
                                    onClick={() => {
                                        if (!selectedSettlementWalletAddress) {
                                        toast.error
                                            ('가맹점 자동결제용 USDT지갑을 선택하세요.');
                                        return;
                                        }
                                        if (selectedSettlementWalletAddress === store?.settlementWalletAddress) {
                                        toast.error('현재 가맹점 자동결제용 USDT지갑과 동일합니다.');
                                        return;
                                        }
                                        confirm(
                                        `정말 ${selectedSettlementWalletAddress}로 가맹점 자동결제용 USDT지갑을 변경하시겠습니까?`
                                        ) && updateSettlementWalletAddress();
                                    }}
                                    className={`bg-[#3167b4] text-sm text-white px-4 py-2 rounded-lg
                                        ${updatingSettlementWalletAddress ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                    {updatingSettlementWalletAddress ? '변경 중...' : '변경'}
                                    </button>
                                </div>
                                ) : (
                                <div className="flex flex-row items-center justify-center gap-2">
                                    <Image
                                    src="/icon-warning.png"
                                    alt="Warning"
                                    width={20}
                                    height={20}
                                    className="w-5 h-5"
                                    />
                                    <span className="text-lg text-red-500">
                                    {store && store.storeName}의 회원이 없습니다.
                                    <br />
                                    가맹점 홈페이지에서 회원가입 후 가맹점 자동결제용 USDT지갑을 설정하세요.
                                    </span>
                                </div>
                                )}
                            </div>
                        </div>





                        
                        <div className="w-full flex flex-col gap-5 items-center justify-between border border-gray-300 p-4 rounded-lg">
                            

                            {/* store settlementFeeWalletAddress */}

                            <div className='w-full flex flex-col items-start justify-center gap-2'>

                                <div className='w-full flex flex-row items-start gap-2'>
                                    <Image
                                        src="/icon-settlement.png"
                                        alt="Settlement"
                                        width={20}
                                        height={20}
                                        className="w-5 h-5"
                                    />
                                    <span className="text-lg text-zinc-500">
                                        가맹점 수수료 USDT지갑 설정
                                    </span>
                                </div>
                                <div className="w-full flex flex-col xl:flex-row items-center justify-center gap-2">
                                    {!fetchingStore && store && store.settlementFeeWalletAddress ? (
                                    <button
                                        onClick={() => {
                                        navigator.clipboard.writeText(store.settlementFeeWalletAddress);
                                        toast.success(Copied_Wallet_Address);
                                        } }
                                        className="text-lg text-zinc-500 underline"
                                    >
                                        {store && store.settlementFeeWalletAddress.substring(0, 6)}...{store && store.settlementFeeWalletAddress.substring(store.settlementFeeWalletAddress.length - 4)}
                                    </button>
                                    ) : (
                                    <div className="flex flex-row items-center justify-start gap-2">
                                        <Image
                                        src="/icon-warning.png"
                                        alt="Warning"
                                        width={20}
                                        height={20}
                                        className="w-5 h-5"
                                        />
                                        <span className="text-sm text-red-500">
                                        {store && store.storeName}의 가맹점 수수료 USDT지갑 설정되지 않았습니다.
                                        </span>
                                    </div>
                                    )}

                                    {fetchingAllAdminSellers && (
                                    <Image
                                        src="/loading.png"
                                        alt="Loading"
                                        width={20}
                                        height={20}
                                        className="animate-spin"
                                    />
                                    )}

                                    {!fetchingAllAdminSellers && allAdminSellers && allAdminSellers.length > 0 ? (
                                    
                                    <div className="hidden flex-row items-center justify-center gap-2">
                                        {/* select list of all users */}
                                        <select
                                        value={selectedSettlementFeeWalletAddress}
                                        onChange={(e) => setSelectedSettlementFeeWalletAddress(e.target.value)}
                                        className="w-36 p-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500
                                            bg-white text-zinc-500 text-sm"
                                        disabled={updatingSettlementFeeWalletAddress}
                                        >
                                        <option value="">가맹점 수수료 USDT지갑 변경</option>
                                        {allAdminSellers.map((user) => (
                                            <option key={user._id} value={user.walletAddress}>
                                            {user.nickname}
                                            {' '}
                                            ({user.walletAddress.substring(0, 6)}...{user.walletAddress.substring(user.walletAddress.length - 4)})
                                            </option>
                                        ))}
                                        </select>
                                        <button
                                        onClick={() => {
                                            if (!selectedSettlementFeeWalletAddress) {
                                            toast.error('가맹점 수수료 USDT지갑을 선택하세요.');
                                            return;
                                            }
                                            if (selectedSettlementFeeWalletAddress === store?.settlementFeeWalletAddress) {
                                            toast.error('현재 가맹점 수수료 USDT지갑과 동일합니다.');
                                            return;
                                            }
                                            confirm(
                                            `정말 ${selectedSettlementFeeWalletAddress}로 가맹점 수수료 USDT지갑을 변경하시겠습니까?`
                                            ) && updateSettlementFeeWalletAddress();
                                        }}
                                        className={`bg-[#3167b4] text-sm text-white px-4 py-2 rounded-lg
                                            ${updatingSettlementFeeWalletAddress ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        >
                                        {updatingSettlementFeeWalletAddress ? '변경 중...' : '변경'}
                                        </button>
                                    </div>
                                    ) : (
                                    <div className="flex flex-row items-center justify-center gap-2">
                                        <Image
                                        src="/icon-warning.png"
                                        alt="Warning"
                                        width={20}
                                        height={20}
                                        className="w-5 h-5"
                                        />
                                        <span className="text-sm text-red-500">
                                        {store && store.storeName}의 회원이 없습니다.
                                        <br />
                                        가맹점 홈페이지에서 회원가입 후 가맹점 수수료 USDT지갑을 설정하세요.
                                        </span>
                                    </div>
                                    )}
                                </div>
                            </div>




                            <div className='w-full flex flex-col items-start justify-center gap-2'>
                                {/* settlementFeePercent */}
                                {/* 0.01 ~ 5.00 */}
                                <div className='w-full flex flex-row items-start gap-2'>
                                    <Image
                                        src="/icon-settlement.png"
                                        alt="Settlement"
                                        width={20}
                                        height={20}
                                        className="w-5 h-5"
                                    />
                                    <span className="text-lg text-zinc-500">
                                        가맹점 수수료 수수료율(%) 설정
                                    </span>
                                </div>

                                <div className='w-full flex flex-col gap-2 items-center justify-between'>
                                    {/* store.settlementFeePercent */}
                                    <div className="flex flex-row items-center gap-2">
                                        {/* dot */}
                                        <div className='w-2 h-2 bg-green-500 rounded-full'></div>
                                        <span className="text-lg">
                                            가맹점 수수료율
                                        </span>
                                        <span className="text-lg text-zinc-500">
                                            {store && store.settlementFeePercent}%
                                        </span>
                                    </div>
                                    <div className='hidden flex-col gap-2'>
                                        <input
                                            disabled={!address}
                                            className="p-2 w-64 text-zinc-100 bg-zinc-800 rounded text-xl font-semibold"
                                            placeholder="가맹점 수수료율을 입력하세요"
                                            value={settlementFeePercent}
                                            type='number'
                                            onChange={(e) => {
                                                setSettlementFeePercent(Number(e.target.value));
                                            } }

                                            // disable up and down arrow
                                            onKeyDown={(e) => {
                                                if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                                                    e.preventDefault();
                                                }
                                            }}
                                            min={0.01}
                                            max={5.00}
                                            step={0.01}
                                            onWheel={(e) => e.currentTarget.blur()}
                                        />
                                        <div className='flex flex-row gap-2 items-center justify-between'>
                                            <span className='text-sm font-semibold'>
                                                가맹점 수수료율을 설정하세요
                                            </span>
                                        </div>
                                    </div>

                                    <button
                                        disabled={!address || !settlementFeePercent
                                            || settlementFeePercent < 0.01 || settlementFeePercent > 5.00
                                            || updatingSettlementFeePercent}
                                        className={`bg-[#3167b4] text-zinc-100 rounded-lg p-2 ${!settlementFeePercent ? "opacity-50" : ""}`}
                                        onClick={() => {
                                            if (!settlementFeePercent) {
                                                toast.error("가맹점 수수료율을 입력하세요");
                                                return;
                                            }
                                            if (settlementFeePercent < 0.01 || settlementFeePercent > 5.00) {
                                                toast.error("가맹점 수수료율은 0.01 ~ 5.00%로 설정하세요");
                                                return;
                                            }
                                            if (settlementFeePercent === store?.settlementFeePercent) {
                                                toast.error('현재 가맹점 수수료율과 동일합니다.');
                                                return;
                                            }
                                            confirm(
                                                `정말 ${settlementFeePercent}로 가맹점 수수료율을 변경하시겠습니까?`
                                            ) && updateSettlementFeePercent();
                                        }}
                                    >
                                        {Save}
                                    </button>
                                </div>
                                <div className='flex flex-row gap-2 items-center justify-between'>
                                    <span className='text-sm font-semibold'>
                                        가맹점 수수료율은 0.01 ~ 5.00%로 설정하세요
                                    </span>
                                </div>



                            </div>

                        </div>












                        {/* store sellerWalletAddress */}
                        <div className="w-full flex flex-col gap-5 items-center justify-between border border-gray-300 p-4 rounded-lg">
                            

                            <div className='w-full flex flex-row items-start gap-2'>
                                <Image
                                    src="/icon-seller.png"
                                    alt="Seller"
                                    width={20}
                                    height={20}
                                    className="w-5 h-5"
                                />
                                <span className="text-lg text-zinc-500">
                                    가맹점 판매자 USDT지갑 설정
                                </span>
                            </div>



                            <div className="flex flex-col xl:flex-row items-center justify-center gap-2">
                    


                                {!fetchingStore && store && store.sellerWalletAddress ? (
                                <button
                                    onClick={() => {
                                    navigator.clipboard.writeText(store.sellerWalletAddress);
                                    toast.success(Copied_Wallet_Address);
                                    } }
                                    className="text-lg text-zinc-500 underline"
                                >
                                    {store && store.sellerWalletAddress.substring(0, 6)}...{store && store.sellerWalletAddress.substring(store.sellerWalletAddress.length - 4)}
                                </button>
                                ) : (
                                <div className="flex flex-row items-center justify-start gap-2">
                                    <Image
                                    src="/icon-warning.png"
                                    alt="Warning"
                                    width={20}
                                    height={20}
                                    className="w-5 h-5"
                                    />
                                    <span className="text-sm text-red-500">
                                    {store && store.storeName}의 가맹점 판매자 USDT지갑이 설정되지 않았습니다.
                                    </span>
                                </div>
                                )}

                                {fetchingStore && (
                                <Image
                                    src="/loading.png"
                                    alt="Loading"
                                    width={20}
                                    height={20}
                                    className="animate-spin"
                                />
                                )}




                                
                                {!fetchingAllAdminSellers && allAdminSellers && allAdminSellers.length > 0 ? (
                                
                                <div className="hidden w-full flex-row items-center justify-center gap-2">
                                    <select
                                    value={selectedSellerWalletAddress}
                                    onChange={(e) => setSelectedSellerWalletAddress(e.target.value)}
                                    className="w-36 p-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500
                                        bg-white text-zinc-500 text-sm"
                                    disabled={updatingSellerWalletAddress}
                                    >
                                    <option value="">가맹점 판매자 USDT지갑 변경</option>
                                    {allAdminSellers.map((user) => (
                                        <option key={user._id} value={user.walletAddress}>
                                        {user.nickname}
                                        {' '}
                                        ({user.walletAddress.substring(0, 6)}...{user.walletAddress.substring(user.walletAddress.length - 4)})
                                        </option>
                                    ))}
                                    </select>
                                    <button
                                    onClick={() => {
                                        if (!selectedSellerWalletAddress) {
                                        toast.error('가맹점 판매자 USDT지갑을 선택하세요.');
                                        return;
                                        }
                                        if (selectedSellerWalletAddress === store?.sellerWalletAddress) {
                                        toast.error('현재 가맹점 판매자 USDT지갑과 동일합니다.');
                                        return;
                                        }

                                        confirm(
                                        `정말 ${selectedSellerWalletAddress}로 가맹점 판매자 USDT지갑을 변경하시겠습니까?`
                                        ) && updateSellerWalletAddress();
                                    }}
                                    className={`bg-[#3167b4] text-sm text-white px-4 py-2 rounded-lg
                                        ${updatingSellerWalletAddress ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                    {updatingSellerWalletAddress ? '변경 중...' : '변경'}
                                    </button> 
                                </div>
                                ) : (
                                <div className="flex flex-row items-center justify-center gap-2">
                                    <Image
                                    src="/icon-warning.png"
                                    alt="Warning"
                                    width={20}
                                    height={20}
                                    className="w-5 h-5"
                                    />
                                    <span className="text-sm text-red-500">
                                    {store && store.storeName}의 회원이 없습니다.
                                    <br />
                                    회원가입 후 가맹점 USDT지갑을 설정하세요.
                                    </span>
                                </div>
                                )}
                            

                                {/*
                                {!fetchingAllStoreSellers && allStoreSellers && allStoreSellers.length > 0 ? (
                                
                                <div className="w-full flex flex-row items-center justify-center gap-2">
                                    <select
                                    value={selectedSellerWalletAddress}
                                    onChange={(e) => setSelectedSellerWalletAddress(e.target.value)}
                                    className="w-36 p-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500
                                        bg-white text-zinc-500 text-sm"
                                    disabled={updatingSellerWalletAddress}
                                    >
                                    <option value="">가맹점 판매자 USDT지갑 변경</option>
                                    {allStoreSellers.map((user) => (
                                        <option key={user._id} value={user.walletAddress}>
                                        {user.nickname}
                                        {' '}
                                        ({user.walletAddress.substring(0, 6)}...{user.walletAddress.substring(user.walletAddress.length - 4)})
                                        </option>
                                    ))}
                                    </select>
                                    <button
                                    onClick={() => {
                                        if (!selectedSellerWalletAddress) {
                                        toast.error('가맹점 판매자 USDT지갑을 선택하세요.');
                                        return;
                                        }
                                        if (selectedSellerWalletAddress === store?.sellerWalletAddress) {
                                        toast.error('현재 가맹점 판매자 USDT지갑과 동일합니다.');
                                        return;
                                        }

                                        confirm(
                                        `정말 ${selectedSellerWalletAddress}로 가맹점 판매자 USDT지갑을 변경하시겠습니까?`
                                        ) && updateSellerWalletAddress();
                                    }}
                                    className={`bg-[#3167b4] text-sm text-white px-4 py-2 rounded-lg
                                        ${updatingSellerWalletAddress ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                    {updatingSellerWalletAddress ? '변경 중...' : '변경'}
                                    </button> 
                                </div>
                                ) : (
                                <div className="flex flex-row items-center justify-center gap-2">
                                    <Image
                                    src="/icon-warning.png"
                                    alt="Warning"
                                    width={20}
                                    height={20}
                                    className="w-5 h-5"
                                    />
                                    <span className="text-sm text-red-500">
                                    {store && store.storeName}의 회원이 없습니다.
                                    <br />
                                    회원가입 후 가맹점 USDT지갑을 설정하세요.
                                    </span>
                                </div>
                                )}
                                */}








                            </div>

                        </div>






                        {/* store bankInfo settings */}
                        {/* 가맹점 결제용 통장 설정 */}
                        <div className='w-full flex flex-col items-start justify-center gap-2
                            border border-gray-300 p-4 rounded-lg'>

                            <div className='w-full flex flex-col items-center justify-between gap-2'>
                                
                                <div className="w-full flex flex-row items-center justify-start gap-2">
                                
                                    <Image
                                        src="/icon-bank.png"
                                        alt="Bank"
                                        width={20}
                                        height={20}
                                        className="w-5 h-5"
                                    />
                                    
                                    <span className="text-lg">
                                        가맹점 결제용 통장 설정
                                    </span>
                                </div>

                                <div className='w-full flex flex-col items-start gap-2'>
                                    <div className='flex flex-row items-center justify-center gap-2'>
                                        은행이름:{' '}{store && store.bankInfo && store.bankInfo.bankName}
                                    </div>
                                    <div className='flex flex-row items-center justify-center gap-2'>
                                        계좌번호:{' '}{store && store.bankInfo && store.bankInfo.accountNumber}
                                    </div>
                                    <div className='flex flex-row items-center justify-center gap-2'>
                                        예금주:{' '}{store && store.bankInfo && store.bankInfo.accountHolder}
                                    </div>
                                </div>

                                {/* divider */}
                                <div className='w-full h-[1px] bg-zinc-300'></div>




                                <div className='hidden w-full flex-row items-center justify-start gap-2'>
                                    <input
                                        type="text"
                                        className="p-2 w-64 text-zinc-100 bg-zinc-800 rounded text-xl font-semibold"
                                        placeholder="은행명"
                                        value={bankName}
                                        onChange={(e) => setBankName(e.target.value)}
                                    />
                                    <input
                                        type="number"
                                        className="p-2 w-64 text-zinc-100 bg-zinc-800 rounded text-xl font-semibold"
                                        placeholder="계좌번호"
                                        value={accountNumber}
                                        onChange={(e) => setAccountNumber(e.target.value)}
                                    />
                                    <input
                                        type="text"
                                        className="p-2 w-64 text-zinc-100 bg-zinc-800 rounded text-xl font-semibold"
                                        placeholder="예금주"
                                        value={accountHolder}
                                        onChange={(e) => setAccountHolder(e.target.value)}
                                    />

                                    <button
                                        disabled={!address || !bankName || !accountNumber || !accountHolder
                                            || writingStoreBankInfo
                                        }
                                        className={`bg-[#3167b4] text-zinc-100 rounded-lg p-2 ${!bankName || !accountNumber || !accountHolder ? "opacity-50" : ""}`}
                                        onClick={() => {
                                            if (!bankName || !accountNumber || !accountHolder) {
                                                toast.error("은행명, 계좌번호, 예금주를 입력하세요");
                                                return;
                                            }

                                            confirm(
                                                `정말 ${bankName} ${accountNumber} ${accountHolder}로 가맹점 결제용 통장을 변경하시겠습니까?`
                                            ) && writeStoreBankInfo();
                                        }}
                                    >
                                        {writingStoreBankInfo ? '변경 중...' : '변경'}
                                    </button>
                                </div>



                            </div>

                        </div>

                        


















                        </>

                    )}




                    


                </div>

            </div>

        </main>

    );

}

          
