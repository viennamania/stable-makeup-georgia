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


import Uploader from '@/components/uploader-agent';

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

    const agentcode = "admin";



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
            chain: agentcode,
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
  
    } , [address, contract, agentcode]);
  




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
                    storecode: agentcode,
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

        address && agentcode && fetchData();

    }, [address, agentcode]);




    // getOneAgent
    





    // set agentName
    const setAgentName = async () => {
        if (!address) {
            toast.error(Please_connect_your_wallet_first);
            return;
        }
        if (editedNickname.length < 2 || editedNickname.length > 10) {

            toast.error("에이전트 이름을 2자 이상 10자 이하로 설정하세요");
            return;
        }

        const response = await fetch('/api/agent/setAgentName', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                lang: params.lang,
                agentcode: params.agentcode,
                walletAddress: address,
                agentName: editedNickname,
            }),
        });
        const data = await response.json();
        //console.log("data", data);
        if (data.result) {
            toast.success('에이전트 이름이 설정되었습니다');
            setNickname(editedNickname);
            setNicknameEdit(false);
            setEditedNickname('');

            setAgent({
                ...agent,
                agentName: editedNickname,
            });


        } else {
            toast.error('에이전트 이름 설정에 실패하였습니다');
        }
    }







    // set agentDescription
    const [agentDescription, setAgentDescription] = useState("");

    const writeAgentDescription = async () => {
        if (!address) {
            toast.error(Please_connect_your_wallet_first);
            return;
        }
        if (agentDescription.length < 2 || agentDescription.length > 100) {
            toast.error("에이전트 설명을 2자 이상 100자 이하로 설정하세요");
            return;
        }
        const response = await fetch('/api/agent/setAgentDescription', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                lang: params.lang,
                agentcode: params.agentcode,
                walletAddress: address,
                agentDescription: agentDescription,
            }),
        });
        const data = await response.json();

        //console.log("data", data);

        if (data.result) {
            toast.success('에이전트 설명이 설정되었습니다');
            setAgentDescription(agentDescription);

            setAgent({
                ...agent,
                agentDescription: agentDescription,
            });
        } else {
            toast.error('에이전트 설명 설정에 실패하였습니다');
        }
    }




    // set agentBankInfo
    const [bankName, setBankName] = useState("");
    const [accountNumber, setAccountNumber] = useState("");
    const [accountHolder, setAccountHolder] = useState("");

    const [writingAgentBankInfo, setWritingAgentBankInfo] = useState(false);

    const writeAgentBankInfo = async () => {
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
        setWritingAgentBankInfo(true);
        const response = await fetch('/api/agent/setAgentBankInfo', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                lang: params.lang,
                agentcode: params.agentcode,
                walletAddress: address,
                bankName: bankName,
                accountNumber: accountNumber,
                accountHolder: accountHolder,
            }),
        });
        const data = await response.json();
        //console.log("data", data);
        if (data.result) {
            toast.success('에이전트 은행 정보가 설정되었습니다');
            setBankName('');
            setAccountNumber('');
            setAccountHolder('');


            
            fetchAgent();


        } else {
            toast.error('에이전트 은행 정보 설정에 실패하였습니다');
        }
        setWritingAgentBankInfo(false);
    }
















    // check box edit seller
    const [editSeller, setEditSeller] = useState(false);


    const [otp, setOtp] = useState('');

    ///const [verifiedOtp, setVerifiedOtp] = useState(false);
    const [verifiedOtp, setVerifiedOtp] = useState(true);
  
    const [isSendedOtp, setIsSendedOtp] = useState(false);
  
  
  
    const [isSendingOtp, setIsSendingOtp] = useState(false);
  
    const [isVerifingOtp, setIsVerifingOtp] = useState(false);
  
    




    // get agent by agentcode
    const [fetchingAgent, setFetchingAgent] = useState(false);
    const [agent, setAgent] = useState<any>(null);
    
    const fetchAgent = async () => {
        if (fetchingAgent) {
        return;
        }
        setFetchingAgent(true);
        const response = await fetch('/api/agent/getOneAgent', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(
            {
            agentcode: params.agentcode,
            }
        ),
        });
        if (!response.ok) {
        setFetchingAgent(false);
        return;
        }
        const data = await response.json();
        
        ////console.log('getOneAgent data', data);

        setAgent(data.result);

        setAgentDescription(data.result.agentDescription);


        setFetchingAgent(false);

        return data.result;
    }

    useEffect(() => {

        fetchAgent();
    } , [params.agentcode]);





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
    } , [address, params.agentcode]);







    // fetch all seller for agent
    // 에이전트 판매자 검색
    const [fetchingAllAgentSellers, setFetchingAllAgentSellers] = useState(false);
    const [allAgentSellers, setAllAgentSellers] = useState([] as any[]);
    const fetchAllAgentSellers = async () => {
        if (fetchingAllAgentSellers) {
            return;
        }
        setFetchingAllAgentSellers(true);
        const response = await fetch('/api/user/getAllSellersByStorecode', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(
                {
                    storecode: "agent",
                    limit: 10,
                    page: 1,
                }
            ),
        });
        if (!response.ok) {
            setFetchingAllAgentSellers(false);
            toast.error('회원 검색에 실패했습니다.');
            return;
        }
        const data = await response.json();
        //console.log('getAllSellersByStorecode data', data);
        setAllAgentSellers(data.result.users);
        //setTotalCount(data.result.totalCount);
        setFetchingAllAgentSellers(false);
        return data.result.users;
    }

    useEffect(() => {
        if (!address) {
            setAllAgentSellers([]);
            return;
        }
        fetchAllAgentSellers();
    } , [address, params.agentcode]);







    // update adminWalletAddress of agent
    // 에이전트 관리자 변경
    const [updatingAdminWalletAddress, setUpdatingAdminWalletAddress] = useState(false);
    const [selectedAdminWalletAddress, setSelectedAdminWalletAddress] = useState('');
    const updateAdminWalletAddress = async () => {
        if (updatingAdminWalletAddress) {
        return;
        }
        setUpdatingAdminWalletAddress(true);
        const response = await fetch('/api/agent/updateAgentAdminWalletAddress', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(
            {
            agentcode: params.agentcode,
            adminWalletAddress: selectedAdminWalletAddress,
            }
        ),
        });
        if (!response.ok) {
        setUpdatingAdminWalletAddress(false);
        toast.error('에이전트 관리자 변경에 실패했습니다.');
        return;
        }

        const data = await response.json();
        //console.log('data', data);
        if (data.result) {
        toast.success('에이전트 관리자가 변경되었습니다.');
        setSelectedAdminWalletAddress('');

        ///fetchAgent();
        setAgent({
            ...agent,
            adminWalletAddress: selectedAdminWalletAddress,
        });

        } else {
        toast.error('에이전트 관리자 변경에 실패했습니다.');
        }

        setUpdatingAdminWalletAddress(false);

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
        const response = await fetch('/api/agent/updateAgentFeeWalletAddress', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(
                {
                    agentcode: params.agentcode,
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
            setAgent({
                ...agent,
                agentFeeWalletAddress: selectedAgentFeeWalletAddress,
            });

        } else {
            toast.error('가맹점 에이전트 결제 지갑 변경에 실패했습니다.');
        }
        setUpdatingAgentWFeeWalletAddress(false);
        return data.result;
    }




    // update agentFeePercent
    // 에이전트 수수료 비율 변경
    const [updatingAgentFeePercent, setUpdatingAgentFeePercent] = useState(false);
    const [agentFeePercent, setAgentFeePercent] = useState(agent?.agentFeePercent || 0.0);

    const updateAgentFeePercent = async () => {
        if (updatingAgentFeePercent) {
            return;
        }

        if (!agentFeePercent) {
            toast.error("에이전트 수수료율을 입력하세요");
            return;
        }
        if (agentFeePercent < 0.01 || agentFeePercent > 5.00) {
            toast.error("에이전트 수수료율은 0.01 ~ 5.00%로 설정하세요");
            return;
        }
        if (agentFeePercent === agent?.agentFeePercent) {
            toast.error('현재 에이전트 수수료율과 동일합니다.');
            return;
        }

        setUpdatingAgentFeePercent(true);
        const response = await fetch('/api/agent/updateAgentFeePercent', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(
                {
                    agentcode: params.agentcode,
                    agentFeePercent: agentFeePercent,
                }
            ),
        });
        if (!response.ok) {
            setUpdatingAgentFeePercent(false);
            toast.error('에이전트 수수료 비율 변경에 실패했습니다.');
            return;
        }
        const data = await response.json();
        //console.log('data', data);
        if (data.result) {
            toast.success('에이전트 수수료 비율이 변경되었습니다.');
            //setAgentFeePercent(0);

            //fetchStore();
            setAgent({
                ...agent,
                agentFeePercent: agentFeePercent,
            });

        } else {
            toast.error('에이전트 수수료 비율 변경에 실패했습니다.');
        }
        setUpdatingAgentFeePercent(false);
        return data.result;
    }





    // update usdtKRWRate
    // 1300 - 1500
    const [updatingUsdtKRWRate, setUpdatingUsdtKRWRate] = useState(false);
    const [usdtKRWRate, setUsdtKRWRate] = useState(agent?.usdtKRWRate || 0.0);

    const updateUsdtKRWRate = async () => {
        if (updatingUsdtKRWRate) {
            return;
        }

        if (!usdtKRWRate) {
            toast.error("USDT-KRW 환율을 입력하세요");
            return;
        }
        if (usdtKRWRate < 1300 || usdtKRWRate > 1500) {
            toast.error("USDT-KRW 환율은 1300 ~ 1500으로 설정하세요");
            return;
        }
        if (usdtKRWRate === agent?.usdtKRWRate) {
            toast.error('현재 USDT-KRW 환율과 동일합니다.');
            return;
        }

        setUpdatingUsdtKRWRate(true);
        const response = await fetch('/api/agent/updateAgentUsdtKRWRate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(
                {
                    agentcode: params.agentcode,
                    usdtKRWRate: usdtKRWRate,
                }
            ),
        });
        if (!response.ok) {
            setUpdatingUsdtKRWRate(false);
            toast.error('USDT-KRW 환율 변경에 실패했습니다.');
            return;
        }
        const data = await response.json();
        //console.log('data', data);
        if (data.result) {
            toast.success('USDT-KRW 환율이 변경되었습니다.');
            //setUsdtKRWRate(0);

            //fetchStore();
            setAgent({
                ...agent,
                usdtKRWRate: usdtKRWRate,
            });

        } else {
            toast.error('USDT-KRW 환율 변경에 실패했습니다.');
        }
        setUpdatingUsdtKRWRate(false);
        return data.result;
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

                            <span className="text-sm text-zinc-500">
                            {user?.nickname || "프로필"}
                            </span>

                        </div>
                    )}

                </div>




                <div className="mt-5 flex flex-col items-start justify-center gap-5">



                
                    

                    {!fetchingAgent && agent && (

                        <>

                            <div className='w-full flex flex-col items-start justify-center gap-2
                                border border-gray-300 p-4 rounded-lg'>

                                

                                <div className='flex flex-row items-center justify-center gap-2 mb-4'>
                                    <Image
                                        src={agent?.agentLogo || "/icon-agent.png"}
                                        alt="Agent Logo"
                                        width={35}
                                        height={35}
                                        className="w-6 h-6 rounded-full object-cover"
                                    />

                                    <div className="text-lg font-semibold">
                                    에이전트 기본 정보
                                    </div>
                                </div>                                
                                
                                <div className='w-full flex flex-row items-center justify-between gap-2
                                    border-t border-gray-300 pt-4'>

                                    <div className="flex flex-row items-center gap-2">
                                        {/* dot */}
                                        <div className='w-2 h-2 bg-green-500 rounded-full'></div>
                                        <span className="text-lg">
                                            에이전트 코드
                                        </span>
                                        <span className="text-xl text-blue-500 font-semibold">
                                            {agent?.agentcode}
                                        </span>
                                    </div>
                                </div>                                
                                
                                <div className='w-full flex flex-row items-center justify-between gap-2
                                    border-t border-gray-300 pt-4'>


                                    <div className="flex flex-row items-center gap-2">
                                        {/* dot */}
                                        <div className='w-2 h-2 bg-green-500 rounded-full'></div>
                                        <span className="text-lg">
                                            에이전트 이름
                                        </span>
                                        <span className="text-xl text-blue-500 font-semibold">
                                            {agent?.agentName}
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
                                    <div className='w-full flex flex-col gap-2 items-start justify-start
                                        border-t border-gray-300 pt-4'>


                                        <div className="flex flex-row items-center gap-2">
                                            {/* dot */}
                                            <div className='w-2 h-2 bg-green-500 rounded-full'></div>
                                            <span className="text-lg">
                                                {nicknameEdit ? "에이전트 이름 수정" : "에이전트 이름 설정"}
                                            </span>
                                        </div>
                                        <div className='flex flex-row gap-2 items-center justify-between'>
                                            <span className='text-sm font-semibold'>
                                                {nicknameEdit ? "에이전트 이름을 수정하세요" : "에이전트 이름을 설정하세요"}
                                            </span>
                                        </div>

                                        <div className='w-full flex flex-row gap-2 items-center justify-between'>
                                            <div className='w-full flex flex-col gap-2'>
                                                <input
                                                    disabled={!address}
                                                    className="p-2 w-64 text-zinc-100 bg-zinc-800 rounded text-xl font-semibold"
                                                    placeholder="에이전트 이름을 입력하세요"
                                                    
                                                    //value={nickname}
                                                    value={editedNickname}

                                                    type='text'
                                                    onChange={(e) => {


                                                        //setNickname(e.target.value);

                                                        setEditedNickname(e.target.value);

                                                    } }


                                                />

                                            </div>

                                            <button
                                                disabled={!address || !editedNickname}
                                                className={`bg-[#3167b4] text-zinc-100 rounded-lg p-2 w-full ${!editedNickname ? "opacity-50" : ""}`}
                                                onClick={() => {
                                                    if (!editedNickname) {
                                                        toast.error("에이전트 이름을 입력하세요");
                                                        return;
                                                    }
                                                    setAgentName();
                                                    setNicknameEdit(false);
                                                    setEditedNickname('');
                                                }}
                                            >
                                                {Save}
                                            </button>
                                        
                                        </div>

                                        

                                    </div>
                                )}



                                <div className='w-full flex flex-col xl:flex-row items-center justify-between gap-2
                                    border-t border-gray-300 pt-4'>


                                    <div className="w-full flex flex-row items-center justify-start gap-2">
                                        {/* dot */}
                                        <div className='w-2 h-2 bg-green-500 rounded-full'></div>
                                        <span className="text-lg">
                                            에이전트 설명
                                        </span>
                                    </div>

                                    {/*
                                    <input
                                        disabled={!address}
                                        className="bg-[#1f2937] text-zinc-100 rounded-lg p-2 text-sm w-full"
                                        placeholder="에이전트 설명을 입력하세요"
                                        value={agentDescription}
                                        type='text'
                                        onChange={(e) => {
                                            setAgentDescription(e.target.value);
                                        } }
                                    />
                                    */}

                                    <textarea
                                        disabled={!address}
                                        className="bg-zinc-100 text-zinc-800 rounded-lg p-2 text-sm w-full h-24 resize-none"
                                        placeholder="에이전트 설명을 입력하세요"
                                        value={agentDescription}
                                        onChange={(e) => {
                                            setAgentDescription(e.target.value);
                                        } }
                                    />
                                    <button
                                        disabled={!address || !agentDescription}
                                        className={`bg-[#3167b4] text-zinc-100 rounded-lg p-2 w-full ${!agentDescription ? "opacity-50" : ""}`}
                                        onClick={() => {
                                            if (!agentDescription) {
                                                toast.error("에이전트 설명을 입력하세요");
                                                return;
                                            }
                                            writeAgentDescription();
                                        }}
                                    >
                                        {Save}
                                    </button>
                                </div>


                                <div className='w-full flex flex-col xl:flex-row items-center justify-between gap-2
                                    border-t border-gray-300 pt-4'>
                            
                                    <div className="w-full flex flex-row items-center gap-2">
                                        {/* dot */}
                                        <div className='w-2 h-2 bg-green-500 rounded-full'></div>
                                        <span className="text-lg">
                                            에이전트 로고
                                        </span>
                                    </div>

                                    <div className="w-full
                                    flex flex-col items-center justify-center gap-2
                                    p-2 bg-zinc-800 rounded text-zinc-100 text-xl font-semibold">
                                        <Uploader
                                            lang={params.lang}
                                            agentcode={params.agentcode as string}

                                        />
                                    </div>

                                </div>

                            </div>









                            {/* agent adminWalletAddress */}
                            
                            <div className="w-full flex flex-col gap-5 items-center justify-between border border-gray-300 p-4 rounded-lg">
                                

                                <div className='w-full flex flex-row items-center justify-start gap-2'>
                                    <Image
                                        src="/icon-manager.png"
                                        alt="Manager"
                                        width={20}
                                        height={20}
                                        className="w-5 h-5"
                                    />
                                    <span className="text-lg text-zinc-500 font-semibold">
                                        에이전트 관리자
                                    </span>
                                </div>


                                <div className='w-full flex flex-col items-center justify-between gap-2
                                    border-t border-gray-300 pt-4'>

                                    {/* agent adminWalletAddress */}

                    
                                    <div className='w-full flex flex-row items-center justify-start gap-2'>
                                        <div className='w-2 h-2 bg-green-500 rounded-full'></div>
                                        <span className="text-lg">
                                            에이전트 관리자 지갑주소(EOA)
                                        </span>
                                    </div>
                        

                                    <div className="flex flex-col items-center justify-center gap-2">
                            


                                        {!fetchingAgent && agent && agent.adminWalletAddress ? (
                                        <button
                                            onClick={() => {
                                            navigator.clipboard.writeText(agent.adminWalletAddress);
                                            toast.success(Copied_Wallet_Address);
                                            } }
                                            className="text-lg text-zinc-500 underline font-semibold"
                                        >
                                            {agent && agent.adminWalletAddress.substring(0, 6)}...{agent && agent.adminWalletAddress.substring(agent.adminWalletAddress.length - 4)}
                                        </button>
                                        ) : (
                                            <div className='flex flex-col items-center justify-center gap-2'>
                                                <div className="flex flex-row items-center justify-start gap-2">
                                                    <Image
                                                    src="/icon-warning.png"
                                                    alt="Warning"
                                                    width={20}
                                                    height={20}
                                                    className="w-5 h-5"
                                                    />
                                                    <span className="text-sm text-red-500">
                                                    {agent && agent.agentName}의 에이전트 관리자 설정이 되어 있지 않습니다.
                                                    </span>
                                                </div>


                                            </div>
                                        )}


                                    </div>
                                </div>


                                <div className='w-full flex flex-col items-center justify-between gap-2
                                    border-t border-gray-300 pt-4'>


        
                                    <div className="w-full flex flex-col items-center justify-start gap-2">
                                        
                                        <div className='w-full flex flex-row items-center justify-start gap-2'>
                                            <div className='w-2 h-2 bg-green-500 rounded-full'></div>
                                            <span className="text-lg">
                                                에이전트 수수료 수납용 USDT지갑주소(EOA)
                                            </span>
                                        </div>


                                        <span className="text-lg text-blue-500 font-semibold">
                                            {agent?.agentFeeWalletAddress 
                                                ? (
                                                    <button
                                                        onClick={() => {
                                                            navigator.clipboard.writeText(agent.agentFeeWalletAddress);
                                                            toast.success(Copied_Wallet_Address);
                                                        } }
                                                        className="text-lg text-zinc-500 underline"
                                                    >
                                                        {agent.agentFeeWalletAddress.substring(0, 6)}...{agent.agentFeeWalletAddress.substring(agent.agentFeeWalletAddress.length - 4)}
                                                    </button>
                                                )
                                                : "에이전 수수료 수납용 USDT지갑이 설정되지 않았습니다."
                                            }

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
                                            {allAgentSellers.map((user) => (
                                                <option key={user._id} value={user.walletAddress}>
                                                    {user.nickname} ({user.walletAddress.substring(0, 6)}...{user.walletAddress.substring(user.walletAddress.length - 4)})
                                                </option>
                                            ))}
                                        </select>
                                        <button
                                            disabled={!address || !selectedAgentFeeWalletAddress || updatingAgentWFeeWalletAddress}
                                            className={`bg-[#3167b4] text-zinc-100 text-sm rounded-lg p-2 px-4 py-2
                                                ${!selectedAgentFeeWalletAddress || updatingAgentWFeeWalletAddress ? "opacity-50" : ""}`}
                                            onClick={() => {
                                                confirm(
                                                    `정말 ${selectedAgentFeeWalletAddress}으로 에이전트 수수료 지갑을 변경하시겠습니까?`
                                                ) && updateAgentFeeWalletAddress();
                                            }}
                                        >
                                            {updatingAgentWFeeWalletAddress ? "변경 중..." : "변경"}
                                        </button>
                                    </div>

                                </div>

                            </div>


                            {/* agent usdtKRWRate */}
                            <div className="w-full flex flex-col gap-5 items-center justify-between border border-gray-300 p-4 rounded-lg">
                                

                                <div className='w-full flex flex-row items-center justify-start gap-2'>
                                    <Image
                                        src="/icon-exchange-rate.png"
                                        alt="Exchange Rate"
                                        width={20}
                                        height={20}
                                        className="w-5 h-5"
                                    />
                                    <span className="text-lg text-zinc-500 font-semibold">
                                        기준환율
                                    </span>
                                </div>

                                <div className='w-full flex flex-row items-center justify-start gap-2'>
                                    {/* dot */}
                                    <div className='w-2 h-2 bg-green-500 rounded-full'></div>
                                    <span className="text-lg text-zinc-500 font-semibold">
                                        USDT-KRW 환율(원)
                                    </span>
                                    <span className="text-xl text-blue-500 font-semibold">
                                        {
                                        agent?.usdtKRWRate && agent?.usdtKRWRate > 0
                                        ? agent?.usdtKRWRate.toLocaleString()
                                        : "없음"
                                        }
                                    </span>
                                </div>

                                {/* updateUsdtKRWRate */}
                                {/* 1300 - 1500 */}
                                {/* step 1 */}
                                {/*
                                <div className='w-full flex flex-row items-center justify-start gap-2'>
                                    <input
                                        disabled={!address || updatingUsdtKRWRate}
                                        className="bg-white text-zinc-500 rounded-lg p-2 text-sm"
                                        placeholder="USDT-KRW 환율을 입력하세요 (1300 ~ 1500)"
                                        value={usdtKRWRate}
                                        type='number'
                                        min={1300}
                                        max={1500}
                                        step={1}
                                        onChange={(e) => {
                                            if (e.target.value === '') {
                                                setUsdtKRWRate('');
                                                return;
                                            }
                                            setUsdtKRWRate(parseFloat(e.target.value));
                                        }}
                                    />
                                    <button
                                        disabled={!address || !usdtKRWRate || updatingUsdtKRWRate}
                                        className={`bg-[#3167b4] text-zinc-100 rounded-lg p-2
                                            ${!usdtKRWRate || updatingUsdtKRWRate ? "opacity-50" : ""}`}
                                        onClick={() => {
                                            confirm(
                                                `정말 ${usdtKRWRate}으로 USDT-KRW 환율을 변경하시겠습니까?`
                                            ) && updateUsdtKRWRate();
                                        }}
                                    >
                                        {updatingUsdtKRWRate ? "수정 중..." : "수정"}
                                    </button>
                                </div>
                                */}

                            </div>

                        {/*
                        <div className="w-full flex flex-col gap-5 items-center justify-between border border-gray-300 p-4 rounded-lg">
                            

                            <div className="w-full flex flex-row items-center justify-start gap-2">
                                <div className='w-2 h-2 bg-green-500 rounded-full'></div>
                                <span className="text-lg">
                                    에이전트 수수료율
                                </span>
                                <span className="text-xl text-blue-500 font-semibold">
                                    {agent?.agentFeePercent || "없음"}%
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

                        </div>
                        */}







                        </>

                    )}




                    


                </div>

            </div>

        </main>

    );

}

          
