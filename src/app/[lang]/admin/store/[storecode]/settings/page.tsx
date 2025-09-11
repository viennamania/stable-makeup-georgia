// nickname settings
'use client';
import React, { use, useEffect, useState } from 'react';



import { toast } from 'react-hot-toast';

import { client } from "../../../../../client";

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
import { getDictionary } from "../../../../../dictionaries";







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


    const [nicknameEdit, setNicknameEdit] = useState(true);

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

    const [storeName, setStoreName] = useState("");

    const [settingStoreName, setSettingStoreName] = useState(false);
    const writeStoreName = async () => {
        if (!address) {
            toast.error(Please_connect_your_wallet_first);
            return;
        }
        if (storeName.length < 2 || storeName.length > 10) {

            toast.error("가맹점 이름을 2자 이상 10자 이하로 설정하세요");
            return;
        }

        setSettingStoreName(true);

        const response = await fetch('/api/store/setStoreName', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                lang: params.lang,
                storecode: params.storecode,
                walletAddress: address,
                storeName: storeName,
            }),
        });
        const data = await response.json();
        //console.log("data", data);
        if (data.result) {
            toast.success('가맹점 이름이 설정되었습니다');
            setStoreName(storeName);

  
            setStore({
                ...store,
                storeName: storeName,
            });


        } else {
            toast.error('가맹점 이름 설정에 실패하였습니다');
        }
        setSettingStoreName(false);
    }







    // set storeDescription
    const [storeDescription, setStoreDescription] = useState("");
    const [writingStoreDescription, setWritingStoreDescription] = useState(false);
    const writeStoreDescription = async () => {
        if (!address) {
            toast.error(Please_connect_your_wallet_first);
            return;
        }
        if (storeDescription.length < 2 || storeDescription.length > 100) {
            toast.error("가맹점 설명을 2자 이상 100자 이하로 설정하세요");
            return;
        }
        setWritingStoreDescription(true);
        const response = await fetch('/api/store/setStoreDescription', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                lang: params.lang,
                storecode: params.storecode,
                walletAddress: address,
                storeDescription: storeDescription,
            }),
        });
        const data = await response.json();

        //console.log("data", data);

        if (data.result) {
            toast.success('가맹점 설명이 설정되었습니다');
            setStore({
                ...store,
                storeDescription: storeDescription,
            });
        } else {
            toast.error('가맹점 설명 설정에 실패하였습니다');
        }
        setWritingStoreDescription(false);
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
                storecode: params.storecode,
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

            setStore({
                ...store,
                bankInfo: {
                    bankName: bankName,
                    accountNumber: accountNumber,
                    accountHolder: accountHolder,
                },
            });

            
            //fetchStore();


        } else {
            toast.error('가맹점 은행 정보 설정에 실패하였습니다');
        }
        setWritingStoreBankInfo(false);
    }


    // setWithdrawalBankName
    // setWithdrawalAccountNumber
    // setWithdrawalAccountHolder
    // writeStoreWithdrawalBankInfo
    const [withdrawalBankName, setWithdrawalBankName] = useState("");
    const [withdrawalAccountNumber, setWithdrawalAccountNumber] = useState("");
    const [withdrawalAccountHolder, setWithdrawalAccountHolder] = useState("");
    const [writingStoreWithdrawalBankInfo, setWritingWithdrawalBankInfo] = useState(false);

    const writeStoreWithdrawalBankInfo = async () => {
        if (!address) {
            toast.error(Please_connect_your_wallet_first);
            return;
        }
        if (withdrawalBankName.length < 2 || withdrawalBankName.length > 20) {
            toast.error("출금 은행 이름을 2자 이상 20자 이하로 설정하세요");
            return;
        }
        if (withdrawalAccountNumber.length < 2 || withdrawalAccountNumber.length > 20) {
            toast.error("출금 계좌 번호를 2자 이상 20자 이하로 설정하세요");
            return;
        }
        if (withdrawalAccountHolder.length < 2 || withdrawalAccountHolder.length > 20) {
            toast.error("출금 예금주 이름을 2자 이상 20자 이하로 설정하세요");
            return;
        }
        setWritingWithdrawalBankInfo(true);
        const response = await fetch('/api/store/setStoreWithdrawalBankInfo', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                lang: params.lang,
                storecode: params.storecode,
                walletAddress: address,
                withdrawalBankName: withdrawalBankName,
                withdrawalAccountNumber: withdrawalAccountNumber,
                withdrawalAccountHolder: withdrawalAccountHolder,
            }),
        });
        const data = await response.json();
        //console.log("data", data);
        if (data.result) {
            toast.success('가맹점 출금 은행 정보가 설정되었습니다');
            setWithdrawalBankName('');
            setWithdrawalAccountNumber('');
            setWithdrawalAccountHolder('');

            setStore({
                ...store,
                withdrawalBankInfo: {
                    bankName: withdrawalBankName,
                    accountNumber: withdrawalAccountNumber,
                    accountHolder: withdrawalAccountHolder,
                },
            });

            
            //fetchStore();

        } else {
            toast.error('가맹점 출금 은행 정보 설정에 실패하였습니다');
        }
        setWritingWithdrawalBankInfo(false);
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
                ////walletAddress: address,
                storecode: params.storecode,
            }
        ),
        });
        if (!response.ok) {
        setFetchingStore(false);
        return;
        }
        const data = await response.json();
        
        ///console.log('getOneStore data', data);

        setStore(data.result);


        setFetchingStore(false);

        return data.result;
    }

    useEffect(() => {
        if (!params.storecode) {
            setStore(null)
            return;
        }
        fetchStore();
    } , [params.storecode])





    // fetch all seller 
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
            role: "admin",

            limit: 100,
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

        console.log('getAllSellersByStorecode data', data);

        setAllAdminSellers(data.result.users);
        //setTotalCount(data.result.totalCount);

        setFetchingAllAdminSellers(false);

        return data.result.users;
    }

    useEffect(() => {
        if (!params.storecode) {
        setAllAdminSellers([]);
        return;
        }
        fetchAllAdminSeller();
    } , [params.storecode]);







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
                    storecode: params.storecode,
                    limit: 10,
                    page: 1,
                    role: "",
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
        if (!params.storecode) {
            setAllStoreSellers([]);
            return;
        }
        fetchAllStoreSellers();
    } , [params.storecode]);







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
            storecode: params.storecode,
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
        //setSelectedAdminWalletAddress('');

        //fetchStore();


        setStore({
            ...store,
            adminWalletAddress: selectedAdminWalletAddress,
        });


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
            storecode: params.storecode,
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
        //setSelectedSettlementWalletAddress('');

        //fetchStore();
        setStore({
            ...store,
            settlementWalletAddress: selectedSettlementWalletAddress,
        });

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
                    storecode: params.storecode,
                    settlementFeeWalletAddress: selectedSettlementFeeWalletAddress,
                }
            ),
        });
        if (!response.ok) {
            setUpdatingSettlementFeeWalletAddress(false);
            toast.error('가맹점 수수료 수납용 USDT지갑 변경에 실패했습니다.');
            return;
        }
        const data = await response.json();
        //console.log('data', data);
        if (data.result) {
            toast.success('가맹점 수수료 수납용 USDT지갑이 변경되었습니다.');
            ////setSelectedSettlementFeeWalletAddress('');

            //fetchStore();

            setStore({
                ...store,
                settlementFeeWalletAddress: selectedSettlementFeeWalletAddress,
            });


        } else {
            toast.error('가맹점 수수료 수납용 USDT지갑 변경에 실패했습니다.');
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

        setUpdatingSettlementFeePercent(true);
        const response = await fetch('/api/store/updateStoreSettlementFeePercent', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(
                {
                    storecode: params.storecode,
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
            //setSettlementFeePercent(0);

            //fetchStore();
            setStore({
                ...store,
                settlementFeePercent: settlementFeePercent,
            });

        } else {
            toast.error('가맹점 수수료 비율 변경에 실패했습니다.');
        }
        setUpdatingSettlementFeePercent(false);
        return data.result;
    }




   // agentFeeWalletAddress 변경
    const [updatingAgentWFeeWalletAddress, setUpdatingAgentWFeeWalletAddress] = useState(false);
    const [selectedAgentFeeWalletAddress, setSelectedAgentWFeeWalletAddress] = useState('');

    const updateAgentFeeWalletAddress = async () => {
        if (updatingAgentWFeeWalletAddress) {
            return;
        }
        setUpdatingAgentWFeeWalletAddress(true);
        const response = await fetch('/api/store/updateStoreAgentFeeWalletAddress', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(
                {
                    storecode: params.storecode,
                    agentFeeWalletAddress: selectedAgentFeeWalletAddress,
                }
            ),
        });
        if (!response.ok) {
            setUpdatingAgentWFeeWalletAddress(false);
            toast.error('가맹점 에이전트 결제 지갑 변경에 실패했습니다.');
            return;
        }
        const data = await response.json();
        //console.log('data', data);
        if (data.result) {
            toast.success('가맹점 에이전트 결제 지갑이 변경되었습니다.');

            //fetchStore();
            setStore({
                ...store,
                agentFeeWalletAddress: selectedAgentFeeWalletAddress,
            });

        } else {
            toast.error('가맹점 에이전트 결제 지갑 변경에 실패했습니다.');
        }
        setUpdatingAgentWFeeWalletAddress(false);
        return data.result;
    }


    // update agentFeePercent
    // 가맹점 에이전트 수수료 비율 변경
    const [updatingAgentFeePercent, setUpdatingAgentFeePercent] = useState(false);
    const [agentFeePercent, setAgentFeePercent] = useState(store?.agentFeePercent || 0.0);

    const updateAgentFeePercent = async () => {
        if (updatingAgentFeePercent) {
            return;
        }

        if (!agentFeePercent) {
            toast.error("가맹점 에이전트 수수료율을 입력하세요");
            return;
        }
        if (agentFeePercent < 0.01 || agentFeePercent > 5.00) {
            toast.error("가맹점 에이전트 수수료율은 0.01 ~ 5.00%로 설정하세요");
            return;
        }
        if (agentFeePercent === store?.agentFeePercent) {
            toast.error('현재 가맹점 에이전트 수수료율과 동일합니다.');
            return;
        }

        setUpdatingAgentFeePercent(true);
        const response = await fetch('/api/store/updateStoreAgentFeePercent', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(
                {
                    storecode: params.storecode,
                    agentFeePercent: agentFeePercent,
                }
            ),
        });
        if (!response.ok) {
            setUpdatingAgentFeePercent(false);
            toast.error('가맹점 에이전트 수수료 비율 변경에 실패했습니다.');
            return;
        }
        const data = await response.json();
        //console.log('data', data);
        if (data.result) {
            toast.success('가맹점 에이전트 수수료 비율이 변경되었습니다.');
            //setAgentFeePercent(0);

            //fetchStore();
            setStore({
                ...store,
                agentFeePercent: agentFeePercent,
            });

        } else {
            toast.error('가맹점 에이전트 수수료 비율 변경에 실패했습니다.');
        }
        setUpdatingAgentFeePercent(false);
        return data.result;
    }




    // resetAgentFeePercent
    const [resettingAgentFeePercent, setResettingAgentFeePercent] = useState(false);
    const resetAgentFeePercent = async () => {
        if (resettingAgentFeePercent) {
            return;
        }
        setResettingAgentFeePercent(true);
        const response = await fetch('/api/store/updateStoreAgentFeePercent', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(
                {
                    storecode: params.storecode,
                    agentFeePercent: 0,
                }
            ),
        });
        if (!response.ok) {
            setResettingAgentFeePercent(false);
            toast.error('가맹점 에이전트 수수료 비율 리셋에 실패했습니다.');
            return;
        }
        const data = await response.json();
        //console.log('data', data);
        if (data.result) {
            toast.success('가맹점 에이전트 수수료 비율이 리셋되었습니다.');
            setStore({
                ...store,
                agentFeePercent: 0,
            });

        } else {
            toast.error('가맹점 에이전트 수수료 비율 리셋에 실패했습니다.');
        }
        setResettingAgentFeePercent(false);
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
                    storecode: params.storecode,
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

            ///fetchStore();
            setStore({
                ...store,
                sellerWalletAddress: selectedSellerWalletAddress,
            });

        } else {
            toast.error('가맹점 판매자 변경에 실패했습니다.');
        }
        setUpdatingSellerWalletAddress(false);
        return data.result;
    }


    // update escrowAmountUSDT of store
    // 가맹점 에스크로 수량 변경
    const [updatingEscrowAmountUSDT, setUpdatingEscrowAmountUSDT] = useState(false);
    const [escrowAmountUSDT, setEscrowAmountUSDT] = useState(store?.escrowAmountUSDT || 0.0);
    const updateEscrowAmountUSDT = async () => {
        if (updatingEscrowAmountUSDT) {
            return;
        }
        if (!escrowAmountUSDT) {
            toast.error("가맹점 에스크로 수량을 입력하세요");
            return;
        }
        if (escrowAmountUSDT < 10 || escrowAmountUSDT > 10000.00) {
            toast.error("가맹점 에스크로 수량은 10.00 ~ 10000.00 USDT로 설정하세요");
            return;
        }
        if (escrowAmountUSDT === store?.escrowAmountUSDT) {
            toast.error('현재 가맹점 에스크로 수량과 동일합니다.');
            return;
        }
        setUpdatingEscrowAmountUSDT(true);
        const response = await fetch('/api/store/updateStoreEscrowAmountUSDT', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(
                {
                    storecode: params.storecode,
                    escrowAmountUSDT: escrowAmountUSDT,
                }
            ),
        });
        if (!response.ok) {
            setUpdatingEscrowAmountUSDT(false);
            toast.error('가맹점 에스크로 수량 변경에 실패했습니다.');
            return;
        }
        const data = await response.json();
        //console.log('data', data);
        if (data.result) {
            toast.success('가맹점 에스크로 수량이 변경되었습니다.');
            //setEscrowAmountUSDT(0);
            //fetchStore();
            setStore({
                ...store,
                escrowAmountUSDT: escrowAmountUSDT,
            });
        } else {
            toast.error('가맹점 에스크로 수량 변경에 실패했습니다.');
        }
        setUpdatingEscrowAmountUSDT(false);
        return data.result;
    }




    const [payactionApiKey, setPayactionApiKey] = useState("");
    const [payactionWebhookKey, setPayactionWebhookKey] = useState("");
    const [payactionShopId, setPayactionShopId] = useState("");

    // updatingPayactionKeys
    const [updatingPayactionKeys, setUpdatingPayactionKeys] = useState(false);

    const updatePayactionKeys = async () => {
        if (!address) {
            toast.error(Please_connect_your_wallet_first);
            return;
        }
        if (payactionApiKey.length < 2 || payactionApiKey.length > 100) {
            toast.error("PAYACTION API KEY를 2자 이상 100자 이하로 설정하세요");
            return;
        }
        if (payactionWebhookKey.length < 2 || payactionWebhookKey.length > 100) {
            toast.error("PAYACTION WEBHOOK KEY를 2자 이상 100자 이하로 설정하세요");
            return;
        }
        if (payactionShopId.length < 2 || payactionShopId.length > 100) {
            toast.error("PAYACTION SHOP ID를 2자 이상 100자 이하로 설정하세요");
            return;
        }

        const payactionKey = {
            payactionApiKey: payactionApiKey,
            payactionWebhookKey: payactionWebhookKey,
            payactionShopId: payactionShopId,
        };

        setUpdatingPayactionKeys(true);

        const response = await fetch('/api/store/updatePayactionKeys', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                walletAddress: address,
                storecode: params.storecode,
                payactionKey: payactionKey,
            }),
        });
        const data = await response.json();
        //console.log("data", data);
        if (data.result) {
            toast.success('PAYACTION API KEY가 설정되었습니다');
            setPayactionApiKey('');
            setPayactionWebhookKey('');
            setPayactionShopId('');

            setStore({
                ...store,
                payactionKey: {
                    payactionApiKey: payactionApiKey,
                    payactionWebhookKey: payactionWebhookKey,
                    payactionShopId: payactionShopId,
                },
            });

            //fetchStore();
        } else {
            toast.error('PAYACTION API KEY 설정에 실패하였습니다');
        }

        setUpdatingPayactionKeys(false);
    }



    // resetPayactionKeys
    const resetPayactionKeys = async () => {
        if (!address) {
            toast.error(Please_connect_your_wallet_first);
            return;
        }

        setUpdatingPayactionKeys(true);

        const payactionKey = {
            payactionApiKey: '',
            payactionWebhookKey: '',
            payactionShopId: '',
        };

        const response = await fetch('/api/store/updatePayactionKeys', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                walletAddress: address,
                storecode: params.storecode,
                payactionKey: payactionKey,
            }),
        });
        const data = await response.json();
        //console.log("data", data);
        if (data.result) {
            toast.success('PAYACTION API KEY가 초기화되었습니다');
            setPayactionApiKey('');
            setPayactionWebhookKey('');
            setPayactionShopId('');

            setStore({
                ...store,
                payactionKey: {
                    payactionApiKey: payactionApiKey,
                    payactionWebhookKey: payactionWebhookKey,
                    payactionShopId: payactionShopId,
                },
            });

            //fetchStore();
        } else {
            toast.error('PAYACTION API KEY 초기화에 실패하였습니다');
        }

        setUpdatingPayactionKeys(false);
    }








    // update backgroundColor (000000 ~ ffffff)
    const [backgroundColor, setBackgroundColor] = useState("#ffffff");
    const [updatingBackgroundColor, setUpdatingBackgroundColor] = useState(false);
    const updateBackgroundColor = async () => {
        if (!address) {
            toast.error(Please_connect_your_wallet_first);
            return;
        }

        setUpdatingBackgroundColor(true);

        const response = await fetch('/api/store/updateBackgroundColor', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                walletAddress: address,
                storecode: params.storecode,
                backgroundColor: backgroundColor,
            }),
        });
        const data = await response.json();
        //console.log("data", data);
        if (data.result) {
            toast.success('배경색이 설정되었습니다');
            setBackgroundColor('');

            setStore({
                ...store,
                backgroundColor: backgroundColor,
            });

            //fetchStore();


        } else {
            toast.error('배경색 설정에 실패하였습니다');
        }
        setUpdatingBackgroundColor(false);
    }



    const [agentcode, setAgentCode] = useState("");

    const [updatingAgentcode, setUpdatingAgentcode] = useState(false);

    const updateAgentcode = async () => {

        if (!address) {
            toast.error(Please_connect_your_wallet_first);
            return;
        }
        if (agentcode.length < 2 || agentcode.length > 20) {
            toast.error("에이전트 코드를 2자 이상 20자 이하로 설정하세요");
            return;
        }

        if (updatingAgentcode) {
            return;
        }
        setUpdatingAgentcode(true);

        const response = await fetch('/api/store/updateAgentcode', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                walletAddress: address,
                storecode: params.storecode,
                agentcode: agentcode,
            }),
        });
        const data = await response.json();
        //console.log("data", data);
        if (data.result) {
            toast.success('에이전트 코드가 설정되었습니다');
            setAgentCode('');
            setStore({
                ...store,
                agentcode: agentcode,
            });
        } else {
            toast.error('에이전트 코드 설정에 실패하였습니다');
        }
        setUpdatingAgentcode(false);
    }


    // get all agents
    const [fetchingAllAgents, setFetchingAllAgents] = useState(false);
    const [allAgents, setAllAgents] = useState([] as any[]);
    const fetchAllAgents = async () => {
        if (fetchingAllAgents) {
            return;
        }
        setFetchingAllAgents(true);
        const response = await fetch('/api/agent/getAllAgents', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                limit: 100,
                page: 1,
            }),
        });
        if (!response.ok) {
            setFetchingAllAgents(false);
            toast.error('에이전트 검색에 실패했습니다.');
            return;
        }
        const data = await response.json();
        //console.log('getAllAgents data', data);
        setAllAgents(data.result.agents);
        //setTotalCount(data.result.totalCount);
        setFetchingAllAgents(false);
        return data.result.agents;
    }
    useEffect(() => {
        if (!address) {
            setAllAgents([]);
            return;
        }
        fetchAllAgents();
    } , [address, params.storecode]);


    //console.log("allAgents", allAgents);



    // update paymentUrl
    const [paymentUrl, setPaymentUrl] = useState("");
    const [updatingPaymentUrl, setUpdatingPaymentUrl] = useState(false);
    const updatePaymentUrl = async () => {
        if (!address) {
            toast.error(Please_connect_your_wallet_first);
            return;
        }

        if (paymentUrl.length < 5 || paymentUrl.length > 100) {
            toast.error("결제 URL을 5자 이상 100자 이하로 설정하세요");
            return;
        }

        setUpdatingPaymentUrl(true);

        const response = await fetch('/api/store/updatePaymentUrl', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                walletAddress: address,
                storecode: params.storecode,
                paymentUrl: paymentUrl,
            }),
        });
        const data = await response.json();
        //console.log("data", data);
        if (data.result) {
            toast.success('결제 URL이 설정되었습니다');
            setPaymentUrl('');

            setStore({
                ...store,
                paymentUrl: paymentUrl,
            });

            //fetchStore();
        } else {
            toast.error('결제 URL 설정에 실패하였습니다');
        }
        setUpdatingPaymentUrl(false);
    }



      


    return (

        <main className="p-4 min-h-[100vh] flex items-start justify-center container max-w-screen-sm mx-auto">

            <div className="py-0 w-full
                mb-36
            ">
        

                <div className="w-full flex flex-row gap-2 items-center justify-start text-zinc-500 text-lg"
                >
                    {/* go back button */}
                    <div className="w-full flex justify-start items-center gap-2">
                        <button
                            onClick={() => window.history.back()}
                            className="flex items-center justify-center bg-gray-200 rounded-lg p-2
                            hover:bg-gray-300 transition duration-200 ease-in-out"
                        >
                            <Image
                                src="/icon-back.png"
                                alt="Back"
                                width={20}
                                height={20}
                                className="rounded-full"
                            />
                            <span className="ml-2 text-sm text-gray-500 font-semibold">
                                돌아가기
                            </span>
                        </button>

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

                            <span className="text-lg text-gray-500 font-semibold">
                            {user?.nickname || "프로필"}
                            </span>

                        </div>
                    )}

                </div>




                <div className="mt-5 flex flex-col items-start justify-center gap-5">

                    <div className='flex flex-row items-center justify-start gap-2'>
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






                        <div className="w-full flex flex-row gap-5 items-center justify-center">

                                <button
                                    onClick={() => {
                                    router.push(
                                        '/' + params.lang + '/admin/store/' + params.storecode + '/memo'
                                    );
                                    }}
                                    className="bg-[#3167b4] text-sm text-white px-2 py-1 rounded-lg
                                    hover:bg-[#3167b4]/80 flex flex-row items-center gap-2"
                                >
                                    <Image
                                        src="/icon-memo.png"
                                        alt="Memo"
                                        width={20}
                                        height={20}
                                        className="w-4 h-4"
                                    />
                                    {' '}메모하기{' '}
                                    {store?.memoCount > 0 && (
                                        <span className="text-red-500 font-semibold">
                                            ({store?.memoCount})
                                        </span>
                                    )}
                                </button>

                                {/*
                                <button
                                    onClick={() => {
                                    router.push(
                                        '/' + params.lang + '/admin/store/' + params.storecode + '/clearance'
                                    );
                                    }
                                    }
                                    className="bg-[#3167b4] text-sm text-white px-2 py-1 rounded-lg
                                    hover:bg-[#3167b4]/80 flex flex-row items-center gap-2"
                                >
                                    <Image
                                        src="/icon-clearance.png"
                                        alt="Clearance"
                                        width={20}
                                        height={20}
                                        className="w-4 h-4"
                                    />
                                    {' '}청산관리{' '}
                                    {store?.clearanceCount > 0 && (
                                        <span className="text-red-500 font-semibold">
                                            ({store?.clearanceCount})
                                        </span>
                                    )}
                                </button>
                                */}




                        </div>


                        <div className='w-full flex flex-col items-start justify-center gap-2
                            border border-gray-400 rounded-lg p-4'>
            
                            
                            <div className='w-full flex flex-row items-center justify-start gap-2
                                    border-b border-gray-300 pb-2'>
                                    <Image
                                        src="/icon-store.png"
                                        alt="Manager"
                                        width={20}
                                        height={20}
                                        className="w-6 h-6"
                                    />
                                    <span className="text-lg text-zinc-500">
                                        가맹점 기본정보 설정
                                    </span>
                                </div>



                            
                            <div className="flex flex-row items-center gap-2">
                                {/* dot */}
                                <div className='w-2 h-2 bg-green-500 rounded-full'></div>
                                <span className="text-lg">
                                    가맹점 코드
                                </span>
                                <span className="text-xl text-blue-500 font-semibold">
                                    {store?.storecode}
                                </span>
                            </div>
                            
                            
                            <div className='w-full flex flex-col xl:flex-row items-center justify-between gap-2'>



                                <div className="flex flex-row items-center gap-2">
                                    {/* dot */}
                                    <div className='w-2 h-2 bg-green-500 rounded-full'></div>
                                    <span className="text-lg">
                                        가맹점 이름
                                    </span>
                                    <span className="text-xl text-blue-500 font-semibold">
                                        {store?.storeName}
                                    </span>
                                </div>

                                <div className='flex flex-row gap-2 items-center justify-between'>
                                    <div className='flex flex-col gap-2'>
                                        <input
                                            disabled={!address || settingStoreName}
                                            className="bg-white text-zinc-500 rounded-lg p-2 text-sm"
                                                
                                            placeholder="가맹점 이름을 입력하세요"                                              
                                            value={storeName}

                                            type='text'
                                            onChange={(e) => {
                                                setStoreName(e.target.value);                                       
                                            } }

                                        />

                                    </div>

                                    <button
                                        disabled={!address || !nickname
                                            || settingStoreName
                                        }
                                        className={`bg-[#3167b4] text-zinc-100 rounded-lg p-2
                                            ${!storeName || settingStoreName
                                            ? "opacity-50" : ""}`}
                                        onClick={() => {
                                            confirm(
                                                `정말 ${storeName}으로 가맹점 이름을 변경하시겠습니까?`
                                            ) && writeStoreName();
                                        }}
                                    >
                                        {settingStoreName ? "수정 중..." : "수정"}
                                    </button>
                                
                                </div>

                                
                            </div>




                            <div className='w-full flex flex-col xl:flex-row items-center justify-between gap-2'>
                                <div className="flex flex-row items-center justify-start gap-2">
                                    {/* dot */}
                                    <div className='w-2 h-2 bg-green-500 rounded-full'></div>
                                    <span className="text-lg">
                                        가맹점 설명
                                    </span>
                                    <span className="text-xl text-blue-500 font-semibold">
                                        {store?.storeDescription}
                                    </span>
                                </div>
                                <div className='flex flex-row gap-2 items-center justify-between'>
                                    <input
                                        disabled={!address || writingStoreDescription}
                                        className="bg-white text-zinc-500 rounded-lg p-2 text-sm"
                                        placeholder="가맹점 설명을 입력하세요"
                                        value={storeDescription}
                                        type='text'
                                        onChange={(e) => {
                                            setStoreDescription(e.target.value);
                                        } }
                                    />
                                    <button
                                        disabled={!address || !storeDescription || writingStoreDescription}
                                        className={`bg-[#3167b4] text-zinc-100 rounded-lg p-2
                                            ${!storeDescription || writingStoreDescription
                                            ? "opacity-50" : ""}`}
                                        onClick={() => {
                                            confirm(
                                                `정말 ${storeDescription}으로 가맹점 설명을 변경하시겠습니까?`
                                            ) &&
                                            writeStoreDescription();
                                        }}
                                    >
                                        {writingStoreDescription ? "수정 중..." : "수정"}
                                    </button>
                                </div>
                            </div>
                            
                

            
                            <div className="w-full flex flex-row items-center justify-start gap-2">
                                {/* dot */}
                                <div className='w-2 h-2 bg-green-500 rounded-full'></div>
                                <span className="text-lg">
                                    가맹점 로고
                                </span>
                            </div>

                            <div className="w-full flex flex-row items-center justify-center gap-2">
                                <Uploader
                                    lang={params.lang}
                                    storecode={params.storecode as string}
                                />
                            </div>








                            {/* store backgroundColor */}


                            <div className='w-full flex flex-col items-start gap-2  
                            
                            '>
                                <div className='flex flex-row items-center justify-center gap-2'>
                                    {/* dot */}
                                    <div className='w-2 h-2 bg-green-500 rounded-full'></div>
                                    <span className="text-lg">
                                        배경색
                                    </span>
                                    {/* bg-red-500 */}
                                    <div className={`w-8 h-8 rounded-full ${store && store.backgroundColor ? `bg-${store.backgroundColor}` : 'bg-gray-300'}`}></div>
                                </div>
                            </div>

                            <div className='
                            w-64 flex flex-col gap-2 items-center justify-between'>
                                <select
                                    className="bg-white text-zinc-500 rounded-lg p-2 text-sm w-full"
                                    value={backgroundColor}
                                    onChange={(e) => setBackgroundColor(e.target.value)}
                                >
                                    <option value="">가맹점 배경색 변경</option>

                                    {/* 100 ~ 900 */}
                                    
                                    {/* 흰색 */}
                                    <option value="white-900">흰색</option>
                                    <option value="black-900">검은색</option>

                                    <option value="blue-500">파란색</option>
                                    <option value="red-500">빨간색</option>
                                    <option value="green-500">초록색</option>
                                    <option value="yellow-500">노란색</option>
                                    <option value="purple-500">보라색</option>
                                    <option value="gray-500">회색</option>


                                    {/* 연한 색상 */}
                                    <option value="blue-100">연한 파란색</option>
                                    <option value="red-100">연한 빨간색</option>
                                    <option value="green-100">연한 초록색</option>
                                    <option value="yellow-100">연한 노란색</option>
                                    <option value="purple-100">연한 보라색</option>
                                    <option value="gray-100">연한 회색</option>

                       



                                </select>


                                <button
                                    disabled={!address || !backgroundColor || updatingBackgroundColor}
                                    className={`w-full bg-[#3167b4] text-zinc-100 rounded-lg p-2
                                        ${!backgroundColor || updatingBackgroundColor
                                        ? "opacity-50" : ""}`}
                                    onClick={() => {
                                        if (!backgroundColor) {
                                            toast.error("배경색을 입력하세요");
                                            return;
                                        }

                                        confirm(
                                            `정말 ${backgroundColor}로 가맹점 배경색을 변경하시겠습니까?`
                                        ) && updateBackgroundColor();
                                    }}
                                >
                                    {updatingBackgroundColor ? '변경 중...' : '변경'}
                                </button>
                            
                            </div>

    
                        </div>


                        {/* agent code */}
                        <div className='w-full flex flex-col items-start justify-center gap-2
                            border border-gray-400 rounded-lg p-4'>
                            
                            <div className='w-full flex flex-row items-center justify-start gap-2
                                    border-b border-gray-300 pb-2'>
                                <Image
                                    src="/icon-agent.png"
                                    alt="Agent"
                                    width={20}
                                    height={20}
                                    className="w-6 h-6"
                                />
                                <span className="text-lg text-zinc-500">
                                    에이전트 설정
                                </span>
                            </div>
                            
                            <div className='w-full flex flex-col items-start justify-center gap-2'>

                                <div className="flex flex-row items-center gap-2">
                                
                                    <div className='w-2 h-2 bg-green-500 rounded-full'></div>
                                    <span className="text-lg">
                                        에이전트 이름
                                    </span>
                                    <span className="text-xl text-blue-500 font-semibold">
                                        {store?.agentName || "없음"}
                                    </span>
                                </div>
                                <div className="flex flex-row items-center gap-2">
                                
                                    <div className='w-2 h-2 bg-green-500 rounded-full'></div>
                                    <span className="text-lg">
                                        에이전트 코드
                                    </span>
                                    <span className="text-xl text-blue-500 font-semibold">
                                        {store?.agentcode || "없음"}
                                    </span>
                                </div>

                                {/*
                                <div className='flex flex-row gap-2 items-center justify-between'>
                                    <div className='flex flex-col gap-2'>
                                        {allAgents && allAgents.length > 0 && (
                                            <select
                                                disabled={!address || updatingAgentcode}
                                                className="bg-white text-zinc-500 rounded-lg p-2 text-sm"
                                                value={agentcode}
                                                onChange={(e) => {
                                                    setAgentCode(e.target.value);
                                                }}
                                            >
                                                <option value="">에이전트 코드 선택</option>
                                                {allAgents.map((agent: any) => (
                                                    <option key={agent.agentcode} value={agent.agentcode}>
                                                        {agent.agentName} ({agent.agentcode})
                                                    </option>
                                                ))}
                                            </select>
                                        )}
                                    </div>

                                    <button
                                        disabled={!address || updatingAgentcode || !agentcode}
                                        className={`bg-[#3167b4] text-zinc-100 rounded-lg p-2
                                            ${!agentcode || updatingAgentcode ? "opacity-50" : ""}`}
                                        onClick={() => {
                                            confirm(
                                                `정말 ${agentcode}으로 에이전트 코드를 변경하시겠습니까?`
                                            ) && updateAgentcode();
                                        }}
                                    >
                                        {updatingAgentcode ? "수정 중..." : "수정"}
                                    </button>
                                
                                </div>
                                */}
                                
                            </div>

                        
                            {/*
                        
                            <div className='w-full flex flex-col items-center justify-center gap-2'>
                                <div className="w-full flex flex-row items-center justify-start gap-2">
                                    <div className='w-2 h-2 bg-green-500 rounded-full'></div>
                                    <span className="text-lg">
                                        에이전트 수수료 지갑
                                    </span>
                                    <span className="text-xl text-blue-500 font-semibold">
                                        {store?.agentFeeWalletAddress || "없음"}
                                    </span>
                                </div>

                                <div className='flex flex-col xl:flex-row gap-2 items-center justify-between'>
                                    <select
                                        disabled={!address || updatingAgentWFeeWalletAddress}
                                        className="bg-white text-zinc-500 rounded-lg p-2 text-sm"
                                        value={selectedAgentFeeWalletAddress}
                                        onChange={(e) => {
                                            setSelectedAgentWFeeWalletAddress(e.target.value);
                                        }}
                                    >
                                        <option value="">에이전트 수수료 지갑 선택</option>
                                        {allAdminSellers.map((user) => (
                                            <option key={user._id} value={user.walletAddress}>
                                                {user.nickname} ({user.walletAddress.substring(0, 6)}...{user.walletAddress.substring(user.walletAddress.length - 4)})
                                            </option>
                                        ))}
                                    </select>
                                    <button
                                        disabled={!address || !selectedAgentFeeWalletAddress || updatingAgentWFeeWalletAddress}
                                        className={`bg-[#3167b4] text-zinc-100 rounded-lg p-2
                                            ${!selectedAgentFeeWalletAddress || updatingAgentWFeeWalletAddress ? "opacity-50" : ""}`}
                                        onClick={() => {
                                            confirm(
                                                `정말 ${selectedAgentFeeWalletAddress}으로 에이전트 수수료 지갑을 변경하시겠습니까?`
                                            ) && updateAgentFeeWalletAddress();
                                        }}
                                    >
                                        {updatingAgentWFeeWalletAddress ? "수정 중..." : "수정"}
                                    </button>
                                </div>

                            </div>
                            
                            */}
                            
                            
                            
                            
                            <div className='w-full flex flex-col items-center justify-center gap-2'>
                                <div className="w-full flex flex-row items-center justify-start gap-2">
                                    <div className='w-2 h-2 bg-green-500 rounded-full'></div>
                                    <span className="text-lg">
                                        에이전트 수수료율(%)
                                    </span>
                                    <span className="text-xl text-blue-500 font-semibold">
                                        {store?.agentFeePercent || "없음"}
                                    </span>
                                </div>

                                <div className='flex flex-row gap-2 items-center justify-between'>
                                    <input
                                        disabled={!address || updatingAgentFeePercent}
                                        className="bg-white text-zinc-500 rounded-lg p-2 text-sm"
                                        placeholder="에이전트 수수료율을 입력하세요 (0.01 ~ 5.00)"
                                        value={agentFeePercent}
                                        type='number'
                                        min={0.01}
                                        max={5.00}
                                        step={0.01}
                                        onChange={(e) => {
                                            setAgentFeePercent(parseFloat(e.target.value));
                                        } }
                                    />
                                    <button
                                        disabled={!address || !agentFeePercent || updatingAgentFeePercent}
                                        className={`bg-[#3167b4] text-zinc-100 rounded-lg p-2
                                            ${!agentFeePercent || updatingAgentFeePercent ? "opacity-50" : ""}`}
                                        onClick={() => {
                                            confirm(
                                                `정말 ${agentFeePercent}으로 에이전트 수수료율을 변경하시겠습니까?`
                                            ) && updateAgentFeePercent();
                                        }}
                                    >
                                        {updatingAgentFeePercent ? "수정 중..." : "수정"}
                                    </button>
                                </div>


                                {/* 수수료율 리셋 버튼 */}
                                {/* resetAgentFeePercent() */}
                                <button
                                    disabled={!address || resettingAgentFeePercent}
                                    className={`bg-[#3167b4] text-zinc-100 rounded-lg p-2
                                        ${!address || resettingAgentFeePercent ? "opacity-50" : ""}`}
                                    onClick={() => {
                                        confirm(
                                            `정말 에이전트 수수료율을 0%로 리셋하시겠습니까?`
                                        ) && resetAgentFeePercent();
                                    }}
                                >
                                    {resettingAgentFeePercent ? "0%로 리셋 중..." : "0%로 리셋하기"}
                                </button>


                            </div>
         

                        </div>









                        {/* store adminWalletAddress */}
                        
                        <div className="w-full flex flex-col gap-5 items-center justify-between border border-gray-400 p-4 rounded-lg">
                            

                            <div className='w-full flex flex-row items-center justify-start gap-2
                                border-b border-gray-300 pb-2'>
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



                            <div className="w-full flex flex-col items-center justify-center gap-2">
                    
                                <div className="w-full flex flex-row items-center justify-start gap-2">
                                    {/* dot */}
                                    <div className='w-2 h-2 bg-green-500 rounded-full'></div>
                                    <span className="text-lg">
                                        관리자용 지갑주소
                                    </span>
                                </div>

                                {!fetchingStore && store && store.adminWalletAddress ? (
                                <button
                                    onClick={() => {
                                    navigator.clipboard.writeText(store.adminWalletAddress);
                                    toast.success(Copied_Wallet_Address);
                                    } }
                                    className="text-lg text-zinc-500 underline"
                                >
                                    <div className='flex flex-row items-center justify-start gap-2'>
                                        <Image
                                            src="/icon-shield.png"
                                            alt="Shield"
                                            width={20}
                                            height={20}
                                            className="w-5 h-5"
                                        />
                                        <span className="text-lg text-zinc-500">
                                            {store && store.adminWalletAddress.substring(0, 6)}...{store && store.adminWalletAddress.substring(store.adminWalletAddress.length - 4)}
                                        </span>
                                    </div>
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
                                
                                    <div className="w-full flex flex-row items-center justify-center gap-2">
                                        <select
                                        value={selectedAdminWalletAddress}
                                        //value={store?.adminWalletAddress}
                                        onChange={(e) => setSelectedAdminWalletAddress(e.target.value)}
                                        className="w-64 p-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500
                                            bg-white text-zinc-500 text-sm"
                                        disabled={updatingAdminWalletAddress}
                                        >
                                        <option value="">가맹점 관리자용 지갑주소 변경</option>
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



                                    </div>
                                )}


                            </div>

 

                            <div className="w-full flex flex-col items-center justify-start gap-2">

                                <div className="w-full flex flex-row items-center justify-start gap-2">
                                    {/* dot */}
                                    <div className='w-2 h-2 bg-green-500 rounded-full'></div>
                                    <span className="text-lg">
                                        자동결제용 USDT지갑
                                    </span>
                                </div>


                                {!fetchingStore && store && store.settlementWalletAddress ? (
                                <button
                                    onClick={() => {
                                    navigator.clipboard.writeText(store.settlementWalletAddress);
                                    toast.success(Copied_Wallet_Address);
                                    } }
                                    className="text-lg text-zinc-500 underline"
                                >
                                    <div className='flex flex-row items-center justify-start gap-2'>
                                        <Image
                                            src="/icon-shield.png"
                                            alt="Shield"
                                            width={20}
                                            height={20}
                                            className="w-5 h-5"
                                        />
                                        <span className="text-lg text-zinc-500">
                                            {store && store.settlementWalletAddress.substring(0, 6)}...{store && store.settlementWalletAddress.substring(store.settlementWalletAddress.length - 4)}
                                        </span>
                                    </div>
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
                                
                                <div className="w-full flex flex-row items-center justify-center gap-2">
                                    {/* select list of all users */}
                                    <select
                                    value={selectedSettlementWalletAddress}
                                    //value={store?.settlementWalletAddress}
                                    onChange={(e) => setSelectedSettlementWalletAddress(e.target.value)}
                                    className="w-64 p-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500
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
                                    <span className="text-sm text-red-500">
                                    {store && store.storeName}의 회원이 없습니다.
                                    <br />
                                    가맹점 홈페이지에서 회원가입 후 가맹점 자동결제용 USDT지갑을 설정하세요.
                                    </span>
                                </div>
                                )}

                            </div>
                        </div>





                        
                        <div className="w-full flex flex-col gap-5 items-center justify-between border border-gray-400 p-4 rounded-lg">
                            

                            {/* store settlementFeeWalletAddress */}

                            <div className='w-full flex flex-col items-start justify-center gap-2'>

                                <div className='w-full flex flex-row items-center justify-start gap-2
                                    border-b border-gray-300 pb-2'>
                                    <Image
                                        src="/icon-settlement.png"
                                        alt="Settlement"
                                        width={20}
                                        height={20}
                                        className="w-5 h-5"
                                    />
                                    <span className="text-lg text-zinc-500">
                                        가맹점 PG 수수료 설정
                                    </span>
                                </div>

                                <div className="w-full flex flex-col items-center justify-center gap-2">

                                    <div className="w-full flex flex-row items-center justify-start gap-2">
                                        {/* dot */}
                                        <div className='w-2 h-2 bg-green-500 rounded-full'></div>
                                        <span className="text-lg">
                                            PG 수수료 수납용 USDT지갑
                                        </span>
                                    </div>



                                    {!fetchingStore && store && store.settlementFeeWalletAddress ? (
                                        <button
                                            onClick={() => {
                                            navigator.clipboard.writeText(store.settlementFeeWalletAddress);
                                            toast.success(Copied_Wallet_Address);
                                            } }
                                            className="text-lg text-zinc-500 underline"
                                        >
                                            <div className='flex flex-row items-center justify-start gap-2'>
                                                <Image
                                                    src="/icon-shield.png"
                                                    alt="Shield"
                                                    width={20}
                                                    height={20}
                                                    className="w-5 h-5"
                                                />
                                                <span className="text-lg text-zinc-500">
                                                    {store && store.settlementFeeWalletAddress.substring(0, 6)}...{store && store.settlementFeeWalletAddress.substring(store.settlementFeeWalletAddress.length - 4)}
                                                </span>
                                            </div>
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
                                            {store && store.storeName}의 가맹점 PG 수수료 수납용 USDT지갑이 설정되지 않았습니다.
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
                                    
                                        <div className="flex flex-row items-center justify-center gap-2">
                                            {/* select list of all users */}
                                            <select
                                            value={selectedSettlementFeeWalletAddress}
                                            //value={store?.settlementFeeWalletAddress}
                                            onChange={(e) => setSelectedSettlementFeeWalletAddress(e.target.value)}
                                            className="w-64 p-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500
                                                bg-white text-zinc-500 text-sm"
                                            disabled={updatingSettlementFeeWalletAddress}
                                            >
                                            <option value="">가맹점 PG 수수료 수납용 USDT지갑 변경</option>
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
                                                toast.error('가맹점 PG 수수료 수납용 USDT지갑을 선택하세요.');
                                                return;
                                                }
                                                if (selectedSettlementFeeWalletAddress === store?.settlementFeeWalletAddress) {
                                                toast.error('현재 가맹점 PG 수수료 수납용 USDT지갑과 동일합니다.');
                                                return;
                                                }
                                                confirm(
                                                `정말 ${selectedSettlementFeeWalletAddress}로 가맹점 PG 수수료 수납용 USDT지갑을 변경하시겠습니까?`
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
                                            가맹점 홈페이지에서 회원가입 후 가맹점 PG 수수료 수납용 USDT지갑을 설정하세요.
                                            </span>
                                        </div>


                                    )}

                                </div>
                            </div>




                            <div className='w-full flex flex-col items-start justify-center gap-2'>

                                <div className='w-full flex flex-col gap-2 items-center justify-between'>
                                    {/* store.settlementFeePercent */}
                                    <div className="w-full flex flex-row items-center justify-start gap-2">
                                        {/* dot */}
                                        <div className='w-2 h-2 bg-green-500 rounded-full'></div>
                                        <span className="text-lg">
                                            가맹점 PG 수수료율(%)
                                        </span>
                                    </div>
                                    <div className='w-full flex flex-row items-center justify-center gap-2'>

                                        <span className="text-lg text-zinc-500">
                                            {store && store.settlementFeePercent || 0}%
                                        </span>
                                        <input
                                            disabled={!address}
                                            className="bg-[#1f2937] text-zinc-100 rounded-lg p-2 text-sm"
                                            placeholder="가맹점 수수료율을 입력하세요"
                                            //value={store.settlementFeePercent || 0}
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

                                        <button
                                            disabled={!address || !settlementFeePercent
                                                || settlementFeePercent < 0.01 || settlementFeePercent > 5.00
                                                || updatingSettlementFeePercent}
                                            className={`bg-[#3167b4] text-zinc-100 rounded-lg p-2 ${!settlementFeePercent ? "opacity-50" : ""}`}
                                            onClick={() => {

                                                confirm(
                                                    `정말 ${settlementFeePercent}로 가맹점 수수료율을 변경하시겠습니까?`
                                                ) && updateSettlementFeePercent();
                                            }}
                                        >
                                            {updatingSettlementFeePercent ? '변경 중...' : '변경'}
                                        </button>

                                    </div>


                                </div>
                                <div className='flex flex-row gap-2 items-center justify-between'>
                                    <Image
                                        src="/icon-info.png"
                                        alt="Info"
                                        width={20}
                                        height={20}
                                        className="w-5 h-5"
                                    />
                                    <span className='text-sm font-semibold'>
                                        가맹점 PG 수수료율은 0.01 ~ 5.00%로 설정하세요
                                    </span>
                                </div>



                            </div>

                        </div>



                        {/* store sellerWalletAddress */}
                        <div className="w-full flex flex-col gap-5 items-center justify-between border border-gray-400 p-4 rounded-lg">
                            

                            <div className='w-full flex flex-row items-center justify-start gap-2
                                border-b border-gray-300 pb-2'>
                                <Image
                                    src="/icon-trade.png"
                                    alt="Trade"
                                    width={20}
                                    height={20}
                                    className="w-5 h-5"
                                />
                                <span className="text-lg text-zinc-500">
                                    가맹점 P2P 거래소 설정
                                </span>
                            </div>



                            <div className="w-full flex flex-col items-center justify-center gap-2">
                    

                                <div className="w-full flex flex-row items-center justify-start gap-2">
                                    {/* dot */}
                                    <div className='w-2 h-2 bg-green-500 rounded-full'></div>
                                    <span className="text-lg">
                                        판매용 USDT지갑
                                    </span>
                                </div>


                                {!fetchingStore && store && store.sellerWalletAddress ? (
                                <button
                                    onClick={() => {
                                    navigator.clipboard.writeText(store.sellerWalletAddress);
                                    toast.success(Copied_Wallet_Address);
                                    } }
                                    className="text-lg text-zinc-500 underline"
                                >
                                <div className='flex flex-row items-center justify-start gap-2'>
                                    <Image
                                        src="/icon-shield.png"
                                        alt="Shield"
                                        width={20}
                                        height={20}
                                        className="w-5 h-5"
                                    />
                                    <span className="text-lg text-zinc-500">
                                    {store && store.sellerWalletAddress.substring(0, 6)}...{store && store.sellerWalletAddress.substring(store.sellerWalletAddress.length - 4)}
                                    </span>
                                </div>
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
                                    {store && store.storeName}의 P2P 거래소 판매용 USDT지갑이 설정되지 않았습니다.
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
                                
                                <div className="w-full flex flex-row items-center justify-center gap-2">
                                    <select
                                    value={selectedSellerWalletAddress}
                                    ///value={store?.sellerWalletAddress}
                                    onChange={(e) => setSelectedSellerWalletAddress(e.target.value)}
                                    className="w-64 p-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500
                                        bg-white text-zinc-500 text-sm"
                                    disabled={updatingSellerWalletAddress}
                                    >
                                    <option value="">P2P 거래소 판매용 USDT지갑 변경</option>
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
                                        toast.error('P2P 거래소 판매용 USDT지갑을 선택하세요.');
                                        return;
                                        }
                                        if (selectedSellerWalletAddress === store?.sellerWalletAddress) {
                                        toast.error('현재 P2P 거래소 판매용 USDT지갑과 동일합니다.');
                                        return;
                                        }

                                        confirm(
                                        `정말 ${selectedSellerWalletAddress}로 P2P 거래소 판매용 USDT지갑을 변경하시겠습니까?`
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
                                    회원가입 후 P2P 거래소 판매용 USDT지갑을 설정하세요.
                                    </span>
                                </div>
                                )}





                                {/*
                                {!fetchingAllStoreSellers && allStoreSellers && allStoreSellers.length > 0 ? (
                                
                                <div className="w-full flex flex-row items-center justify-center gap-2">
                                    <select
                                    value={selectedSellerWalletAddress}
                                    //value={store?.settlementWalletAddress}
                                    onChange={(e) => setSelectedSellerWalletAddress(e.target.value)}
                                    className="w-64 p-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500
                                        bg-white text-zinc-500 text-sm"
                                    disabled={updatingSellerWalletAddress}
                                    >
                                    <option value="">P2P 거래소 판매용 USDT지갑 변경</option>
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
                                        toast.error
                                            ('P2P 거래소 판매용 USDT지갑을 선택하세요.');
                                        return;
                                        }
                                        if (selectedSellerWalletAddress === store?.sellerWalletAddress) {
                                        toast.error('현재 P2P 거래소 판매용 USDT지갑과 동일합니다.');
                                        return;
                                        }
                                        confirm(
                                        `정말 ${selectedSellerWalletAddress}로 P2P 거래소 판매용 USDT지갑을 변경하시겠습니까?`
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
                                    가맹점 홈페이지에서 회원가입 후 P2P 거래소 판매용 USDT지갑을 설정하세요.
                                    </span>
                                </div>
                                )}
                                */}
                               

                            </div>

                            {/* store escrowAmountUSDT */}
                            {/* 판매자용 USDT 수량 */}
                            <div className='w-full flex flex-col items-start justify-center gap-2'>

                                <div className='w-full flex flex-row items-center justify-start gap-2'>
                                    {/* dot */}
                                    <div className='w-2 h-2 bg-green-500 rounded-full'></div>
                                    <span className="text-lg text-zinc-600">
                                        판매자 보유금 수량(USDT)
                                    </span>
                                </div>

                                <div className='w-full flex flex-row items-center justify-center gap-2'>

                                    <div className='flex flex-row items-center justify-center gap-2'>
                                        <Image
                                            src="/icon-tether.png"
                                            alt="Tether"
                                            width={20}
                                            height={20}
                                            className="w-5 h-5"
                                        />
                                        <span className="text-xl text-[#409192] font-semibold">
                                            {store && store.escrowAmountUSDT &&
                                            store.escrowAmountUSDT.toFixed(3).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                                            || 0.00}
                                        </span>
                                    </div>

                                    {/* route to daily-close page */}
                                    <button
                                        onClick={() => router.push(`/${params.lang}/admin/store/${params.storecode}/daily-close`)}
                                        className="bg-[#3167b4] text-zinc-100 rounded-lg p-2 text-sm"
                                        disabled={!address}
                                    >
                                        일일 마감 페이지로 이동
                                    </button>

                                    {/*
                                    <input
                                        disabled={!address}
                                        className="bg-[#1f2937] text-zinc-100 rounded-lg p-2 text-sm"
                                        placeholder="판매용 USDT지갑 수량을 입력하세요"
                                        value={escrowAmountUSDT}
                                        type='number'
                                        onChange={(e) => {
                                            setEscrowAmountUSDT(Number(e.target.value));
                                        } }

                                        // disable up and down arrow
                                        onKeyDown={(e) => {
                                            if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                                                e.preventDefault();
                                            }
                                        }}
                                        min={0.00}
                                        step={1.00}
                                        onWheel={(e) => e.currentTarget.blur()}
                                    />

                                    <button
                                        disabled={!address || !escrowAmountUSDT || updatingEscrowAmountUSDT}
                                        className={`bg-[#3167b4] text-zinc-100 rounded-lg p-2 ${!escrowAmountUSDT ? "opacity-50" : ""}`}
                                        onClick={() => {

                                            confirm(
                                                `정말 ${escrowAmountUSDT}로 가맹점 판매자용 USDT 수량을 변경하시겠습니까?`
                                            ) && updateEscrowAmountUSDT();
                                        }}
                                    >
                                        {updatingEscrowAmountUSDT ? '변경 중...' : '변경'}
                                    </button>
                                    */}

                                </div>

                            </div>

                        </div>






                        {/* 가맹점 출금 원화통장 설정 */}
                        {/* writeStoreWithdrawalBankInfo */}
                        <div className='w-full flex flex-col items-start justify-center gap-2
                            border border-gray-400 p-4 rounded-lg'>
                            <div className='w-full flex flex-col items-center justify-between gap-2
                                border-b border-gray-300 pb-2'>

                                {/* store withdrawal bankInfo */}
                                
                                <div className="w-full flex flex-row items-center justify-start gap-2
                                    border-b border-gray-300 pb-2">
                                    <Image
                                        src="/icon-bank.png"
                                        alt="Bank"
                                        width={20}
                                        height={20}
                                        className="w-5 h-5"
                                    />
                                    <span className="text-lg text-zinc-500">
                                        가맹점 출금용(USDT판매용) 원화통장 설정
                                    </span>
                                </div>

                                <div className='w-full flex flex-col items-start gap-2'>
                                    
                                    <div className='flex flex-row items-center justify-center gap-2'>
                                        {/* dot */}
                                        <div className='w-2 h-2 bg-green-500 rounded-full'></div>
                                        <span className="text-lg">
                                            은행이름:{' '}{store && store?.withdrawalBankInfo && store.withdrawalBankInfo.bankName}
                                        </span>
                                    </div>

                                    <div className='flex flex-row items-center justify-center gap-2'>
                                        <div className='w-2 h-2 bg-green-500 rounded-full'></div>
                                        <span className="text-lg">
                                            계좌번호:{' '}{store && store?.withdrawalBankInfo && store.withdrawalBankInfo.accountNumber}
                                        </span>
                                    </div>
                                    <div className='flex flex-row items-center justify-center gap-2'>
                                        <div className='w-2 h-2 bg-green-500 rounded-full'></div>
                                        <span className="text-lg">
                                            예금주:{' '}{store && store?.withdrawalBankInfo && store.withdrawalBankInfo.accountHolder}
                                        </span>
                                    </div>
                                </div>

                                {/* divider */}
                                <div className='w-full h-[1px] bg-zinc-300'></div>

                                <div className='w-64 flex flex-col gap-2 items-center justify-between'>

                                    <select
                                        className="bg-white text-zinc-500 rounded-lg p-2 text-sm w-full"
                                        value={withdrawalBankName}
                                        onChange={(e) => setWithdrawalBankName(e.target.value)}
                                    >
                                        <option value="">은행이름 선택</option>
                                        <option value="카카오뱅크">카카오뱅크</option>
                                        <option value="케이뱅크">케이뱅크</option>
                                        <option value="토스뱅크">토스뱅크</option>
                                        <option value="국민은행">국민은행</option>
                                        <option value="우리은행">우리은행</option>
                                        <option value="신한은행">신한은행</option>
                                        <option value="농협">농협</option>
                                        <option value="기업은행">기업은행</option>
                                        <option value="하나은행">하나은행</option>
                                        <option value="외환은행">외환은행</option>
                                        <option value="부산은행">부산은행</option>
                                        <option value="대구은행">대구은행</option>
                                        <option value="전북은행">전북은행</option>
                                        <option value="경북은행">경북은행</option>
                                        <option value="광주은행">광주은행</option>
                                        <option value="제주은행">제주은행</option>
                                        <option value="새마을금고">새마을금고</option>
                                        <option value="수협">수협</option>
                                        <option value="신협">신협</option>
                                        <option value="씨티은행">씨티은행</option>
                                        <option value="대신은행">대신은행</option>
                                        <option value="동양종합금융">동양종합금융</option>
                                        <option value="산업은행">산업은행</option>
                                    </select>
                                    <input
                                        type="number"
                                        className="bg-white text-zinc-500 rounded-lg p-2 text-sm w-full"
                                        placeholder="계좌번호"
                                        value={withdrawalAccountNumber}
                                        onChange={(e) => setWithdrawalAccountNumber(e.target.value)}
                                        // hide up and down arrow
                                        onKeyDown={(e) => {
                                            if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                                                e.preventDefault();
                                            }
                                        }}
                                        onWheel={(e) => e.currentTarget.blur()}
                                    />
                                    <input
                                        type="text"
                                        className="bg-white text-zinc-500 rounded-lg p-2 text-sm w-full"
                                        placeholder="예금주"
                                        value={withdrawalAccountHolder}
                                        onChange={(e) => setWithdrawalAccountHolder(e.target.value)}
                                    />
                                    <button
                                        disabled={!address || !withdrawalBankName || !withdrawalAccountNumber || !withdrawalAccountHolder
                                            || writingStoreWithdrawalBankInfo}
                                        className={`w-full bg-[#3167b4] text-zinc-100 rounded-lg p-2
                                            ${!withdrawalBankName || !withdrawalAccountNumber || !withdrawalAccountHolder || writingStoreWithdrawalBankInfo
                                            ? "opacity-50" : ""}`}
                                        onClick={() => {
                                            if (!withdrawalBankName || !withdrawalAccountNumber || !withdrawalAccountHolder) {
                                                toast.error("은행명, 계좌번호, 예금주를 입력하세요");
                                                return;
                                            }

                                            confirm(
                                                `정말 ${withdrawalBankName} ${withdrawalAccountNumber} ${withdrawalAccountHolder}로 가맹점 출금 원화통장을 변경하시겠습니까?`
                                            ) && writeStoreWithdrawalBankInfo();
                                        }}
                                    >
                                        {writingStoreWithdrawalBankInfo ? '변경 중...' : '변경'}
                                    </button>

                                </div>

                            </div>
                        </div>












                        {/* store bankInfo settings */}
                        {/* 가맹점 결제용 통장 설정 */}
                        <div className='w-full flex flex-col items-start justify-center gap-2
                            border border-gray-400 p-4 rounded-lg'>

                            <div className='w-full flex flex-col items-center justify-between gap-2'>
                                
                                <div className="w-full flex flex-row items-center justify-start gap-2
                                    border-b border-gray-300 pb-2">
                                    {/* dot */}
                                    <Image
                                        src="/icon-bank.png"
                                        alt="Bank"
                                        width={20}
                                        height={20}
                                        className="w-5 h-5"
                                    />
                                    <span className="text-lg text-zinc-500">
                                        P2P 구매자 계좌이체용 원화통장 설정
                                    </span>
                                </div>

                                <div className='w-full flex flex-col items-start gap-2'>
                                    
                                    <div className='flex flex-row items-center justify-center gap-2'>
                                        {/* dot */}
                                        <div className='w-2 h-2 bg-green-500 rounded-full'></div>
                                        <span className="text-lg">
                                            은행이름:{' '}{store && store.bankInfo && store.bankInfo.bankName}
                                        </span>
                                    </div>

                                    <div className='flex flex-row items-center justify-center gap-2'>
                                        <div className='w-2 h-2 bg-green-500 rounded-full'></div>
                                        <span className="text-lg">
                                        계좌번호:{' '}{store && store.bankInfo && store.bankInfo.accountNumber}
                                        </span>
                                    </div>
                                    <div className='flex flex-row items-center justify-center gap-2'>
                                        <div className='w-2 h-2 bg-green-500 rounded-full'></div>
                                        <span className="text-lg">
                                        예금주:{' '}{store && store.bankInfo && store.bankInfo.accountHolder}
                                        </span>
                                    </div>
                                </div>

                                {/* divider */}
                                <div className='w-full h-[1px] bg-zinc-300'></div>



                                <div className='w-64 flex flex-col gap-2 items-center justify-between'>
                                    
                                    <select
                                        className="bg-white text-zinc-500 rounded-lg p-2 text-sm w-full"
                                        value={bankName}
                                        onChange={(e) => setBankName(e.target.value)}
                                    >
                                        <option value="">은행이름 선택</option>
                                        <option value="카카오뱅크">카카오뱅크</option>
                                        <option value="케이뱅크">케이뱅크</option>
                                        <option value="토스뱅크">토스뱅크</option>
                                        <option value="국민은행">국민은행</option>
                                        <option value="우리은행">우리은행</option>
                                        <option value="신한은행">신한은행</option>
                                        <option value="농협">농협</option>
                                        <option value="기업은행">기업은행</option>
                                        <option value="하나은행">하나은행</option>
                                        <option value="외환은행">외환은행</option>
                                        <option value="부산은행">부산은행</option>
                                        <option value="대구은행">대구은행</option>
                                        <option value="전북은행">전북은행</option>
                                        <option value="경북은행">경북은행</option>
                                        <option value="광주은행">광주은행</option>
                                        <option value="수협">수협</option>
                                        <option value="신협">신협</option>
                                        <option value="씨티은행">씨티은행</option>
                                        <option value="대신은행">대신은행</option>
                                        <option value="동양종합금융">동양종합금융</option>
                                        <option value="산업은행">산업은행</option>
                                    </select>



                                    <input
                                        type="number"
                                        className="bg-white text-zinc-500 rounded-lg p-2 text-sm w-full"
                                        placeholder="계좌번호"
                                        value={accountNumber}
                                        onChange={(e) => setAccountNumber(e.target.value)}
                                        // hide up and down arrow
                                        onKeyDown={(e) => {
                                            if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                                                e.preventDefault();
                                            }
                                        }}
                                        onWheel={(e) => e.currentTarget.blur()}

                                    />
                                    <input
                                        type="text"
                                        className="bg-white text-zinc-500 rounded-lg p-2 text-sm w-full"
                                        placeholder="예금주"
                                        value={accountHolder}
                                        onChange={(e) => setAccountHolder(e.target.value)}
                                    />

                                    <button
                                        disabled={!address || !bankName || !accountNumber || !accountHolder
                                            || writingStoreBankInfo
                                        }
                                        className={`w-full bg-[#3167b4] text-zinc-100 rounded-lg p-2
                                            ${!bankName || !accountNumber || !accountHolder || writingStoreBankInfo
                                            ? "opacity-50" : ""}`}
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







                        {/* payactionKey settings */}
                        {/*
                                const payactionKey = {
                                payactionApiKey: payactionApiKey,
                                payactionWebhookKey: payactionWebhookKey,
                                payactionShopId: payactionShopId,
                            };
                            */  }
                        {/* 가맹점 결제용 통장 설정 */}
                        <div className='w-full flex flex-col items-start justify-center gap-2
                            border border-gray-400 p-4 rounded-lg'>

                            <div className='w-full flex flex-col items-center justify-between gap-2
                                border-b border-gray-300 pb-2'>

                                {/* store payactionKey */}
                                
                                <div className="w-full flex flex-row items-center justify-start gap-2
                                    border-b border-gray-300 pb-2">
                                    <Image
                                        src="/icon-payaction.png"
                                        alt="Payaction"
                                        width={20}
                                        height={20}
                                        className="w-5 h-5"
                                    />
                                    <span className="text-lg text-zinc-500">
                                        페이액션 자동입금 설정
                                    </span>
                                </div>

                                <div className='w-full flex flex-col items-start gap-2'>
                                    
                                    <div className='flex flex-row items-center justify-center gap-2'>
                                        {/* dot */}
                                        <div className='w-2 h-2 bg-green-500 rounded-full'></div>
                                        <span className="text-lg">
                                        payactionApiKey:{' '}{store && store.payactionKey && store.payactionKey.payactionApiKey}
                                        </span>
                                    </div>
                                    <div className='flex flex-row items-center justify-center gap-2'>
                                        <div className='w-2 h-2 bg-green-500 rounded-full'></div>
                                        <span className="text-lg">
                                        payactionWebhookKey:{' '}{store && store.payactionKey && store.payactionKey.payactionWebhookKey}
                                        </span>
                                    </div>
                                
                                    <div className='flex flex-row items-center justify-center gap-2'>
                                        <div className='w-2 h-2 bg-green-500 rounded-full'></div>
                                        <span className="text-lg">
                                        payactionShopId:{' '}{store && store.payactionKey && store.payactionKey.payactionShopId}
                                        </span>
                                    
                                    </div>
                                </div>

                                {/* divider */}
                                <div className='w-full h-[1px] bg-zinc-300'></div>

                                <div className='w-64 flex flex-col items-center justify-center gap-2'>
                                    
                                    <input
                                        type="text"
                                        className="bg-white text-zinc-500 rounded-lg p-2 text-sm w-full"
                                        placeholder="payactionApiKey"
                                        value={payactionApiKey}
                                        onChange={(e) => setPayactionApiKey(e.target.value)}
                                    />
                                    <input
                                        type="text"
                                        className="bg-white text-zinc-500 rounded-lg p-2 text-sm w-full"
                                        placeholder="payactionWebhookKey"
                                        value={payactionWebhookKey}
                                        onChange={(e) => setPayactionWebhookKey(e.target.value)}
                                    />
                                    
                                
                                    <input
                                        type="text"
                                        className="bg-white text-zinc-500 rounded-lg p-2 text-sm w-full"
                                        placeholder="payactionShopId"
                                        value={payactionShopId}
                                        onChange={(e) => setPayactionShopId(e.target.value)}
                                    />
                                    <button
                                        disabled={!address || !payactionApiKey || !payactionWebhookKey || !payactionShopId
                                            || updatingPayactionKeys
                                        }
                                        className={`w-full bg-[#3167b4] text-zinc-100 rounded-lg p-2
                                            ${!payactionApiKey || !payactionWebhookKey || !payactionShopId || updatingPayactionKeys
                                            ? "opacity-50" : ""}`}
                                        onClick={() => {
                                            if (!payactionApiKey || !payactionWebhookKey || !payactionShopId) {
                                                toast.error("payactionApiKey, payactionWebhookKey, payactionShopId를 입력하세요");
                                                return;
                                            }

                                            confirm(
                                                `정말 ${payactionApiKey} ${payactionWebhookKey} ${payactionShopId}로 가맹점 결제용 키를 변경하시겠습니까?`
                                            ) && updatePayactionKeys();
                                        }}
                                    >
                                        {updatingPayactionKeys ? '변경 중...' : '변경'}
                                    </button>

                                    <div className='mt-2 w-full flex flex-col items-center justify-center gap-2'>
                                        {/* button for reset update */}
                                        <span className="text-sm text-red-500">
                                            자동입금기능을 사용하지 않을 경우 <br />
                                            아래 버튼을 눌러 초기화 해주세요.
                                        </span>
                                        <button
                                            className={`w-full bg-red-500 text-zinc-100 rounded-lg p-2
                                                ${updatingPayactionKeys
                                                ? "opacity-50" : ""}`}
                                            onClick={() => {
                                                confirm(
                                                    `정말 초기화하시겠습니까?`
                                                ) && resetPayactionKeys();
                                            }}
                                        >
                                            {updatingPayactionKeys ? '초기화 중...' : '초기화'}
                                        </button>
                                    </div>

                                </div>
                            </div>
                        </div>
                    

                        

                        {/* 결제 URL settings */}
                        {/* store paymentUrl */}
                        <div className='w-full flex flex-col items-start justify-center gap-2
                            border border-gray-400 p-4 rounded-lg'>

                            <div className='w-full flex flex-col items-center justify-between gap-2
                                border-b border-gray-300 pb-2'>

                                {/* store paymentUrl */}
                                
                                <div className="w-full flex flex-row items-center justify-start gap-2
                                    border-b border-gray-300 pb-2">
                                    <Image
                                        src="/icon-url.png"
                                        alt="Payment URL"
                                        width={20}
                                        height={20}
                                        className="w-5 h-5"
                                    />
                                    <span className="text-lg text-zinc-500">
                                        가맹점 결제 URL 설정
                                    </span>
                                </div>

                                {/* information */}
                                {/* url format */}
                                <div className='w-full text-sm text-zinc-500'>
                                    <span>
                                        결제 URL은 https:// 또는 http:// 로 시작해야 합니다. <br />
                                        예시: https://yourstore.com/pay
                                    </span>
                                </div>

                                <div className='w-full flex flex-col items-start gap-2'>
                                    
                                    <div className='flex flex-row items-center justify-center gap-2'>
                                        {/* dot */}
                                        <div className='w-2 h-2 bg-green-500 rounded-full'></div>
                                        <span className="text-lg">
                                        결제 URL:{' '}{store && store.paymentUrl
                                            ? <a href={store.paymentUrl} target="_blank" className="text-blue-500 underline">
                                                {store.paymentUrl}
                                              </a>
                                            : '설정된 결제 URL이 없습니다.'}
                                        </span>
                                    </div>
                                </div>

                                {/* divider */}
                                <div className='w-full h-[1px] bg-zinc-300'></div>

                                <div className='w-64 flex flex-col items-center justify-center gap-2'>

                                    <input
                                        type="text"
                                        className="bg-white text-zinc-500 rounded-lg p-2 text-sm w-full"
                                        placeholder="결제 URL을 입력하세요"
                                        value={paymentUrl}
                                        onChange={(e) => setPaymentUrl(e.target.value)}
                                    />
                                    <button
                                        disabled={!address || !paymentUrl || updatingPaymentUrl}
                                        className={`w-full bg-[#3167b4] text-zinc-100 rounded-lg p-2
                                            ${!paymentUrl || updatingPaymentUrl
                                            ? "opacity-50" : ""}`}
                                        onClick={() => {
                                            if (!paymentUrl) {
                                                toast.error("결제 URL을 입력하세요");
                                                return;
                                            }

                                            // check url format
                                            const urlPattern = new RegExp('^(https?:\\/\\/)?' + // protocol
                                                '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // domain name
                                                '((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
                                                '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // port and path
                                                '(\\?[;&a-z\\d%_.~+=-]*)?' + // query string
                                                '(\\#[-a-z\\d_]*)?$', 'i'); // fragment locator
                                            if (!urlPattern.test(paymentUrl)) {
                                                toast.error("올바른 URL 형식이 아닙니다.");
                                                return;
                                            }

                                            confirm(
                                                `정말 ${paymentUrl}로 가맹점 결제 URL을 변경하시겠습니까?`
                                            ) && updatePaymentUrl();
                                        }}
                                    >
                                        {updatingPaymentUrl ? '변경 중...' : '변경'}
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

          
