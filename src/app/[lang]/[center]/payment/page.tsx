'use client';

import type { GetStaticProps, InferGetStaticPropsType } from 'next';



import { useState, useEffect, use } from "react";



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
} from "thirdweb/react";
import { inAppWallet } from "thirdweb/wallets";


import { getUserPhoneNumber } from "thirdweb/wallets/in-app";


import Image from 'next/image';

import GearSetupIcon from "@/components/gearSetupIcon";


import Uploader from '@/components/uploader';

import { balanceOf, deposit, transfer } from "thirdweb/extensions/erc20";
 






// open modal

import Modal from '@/components/modal';

import { useRouter }from "next//navigation";

import AppBarComponent from "@/components/Appbar/AppBar";
import { getDictionary } from "../../../dictionaries";
import { Pay } from 'twilio/lib/twiml/VoiceResponse';




import { useSearchParams } from "next/navigation";
import { parse } from 'path';








interface SellOrder {
  _id: string;
  createdAt: string;
  nickname: string;
  avatar: string;

  trades: number;
  price: number;
  available: number;
  limit: string;
  paymentMethods: string[];

  usdtAmount: number;
  krwAmount: number;
  rate: number;

  walletAddress: string;

  seller: any;


  status: string;

  acceptedAt: string;
  paymentRequestedAt: string;
  paymentConfirmedAt: string;

  tradeId: string;

  buyer: any;

  privateSale: boolean;


  escrowTransactionHash: string;
  transactionHash: string;
}





const wallets = [
  inAppWallet({
    auth: {
      options: ["phone", "email"],
    },
  }),
];


const recipientWalletAddress = "0x2111b6A49CbFf1C8Cc39d13250eF6bd4e1B59cF6";


const contractAddress = "0xc2132D05D31c914a87C6611C10748AEb04B58e8F"; // USDT on Polygon
const contractAddressArbitrum = "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9"; // USDT on Arbitrum







// [orderId].tsx

//function SellUsdt(orderId: string) {


/*
export async function getStaticProps(context: any) {
    const orderId = context.params.orderId;
    return {
      props: {
        orderId,
      },
    };
}


export default function SellUsdt({ orderId }: InferGetStaticPropsType<typeof getStaticProps>) {
*/

///export default function SellUsdt() {



//export default function SellUsdt({ params }: { params: { orderId: string } }) {

 
 
/*
// random deposit name
// korean your name
const randomDepositName = [
  '김철수', 
  '이영희',
  '박영수',
  '정미영',
  '오재원',
  '최지연',
  '강민수',
  '윤지원',
  '서동훈',
  '신미정',
  '조영호',
  '임지은',
  '한상훈',
  '황미정',
  '백성호',
  '전지은',
  '고상훈',
  '권미정',
  '문성호',
  '송지은',
  '류상훈',
  '안미정',
  '손성호',
  '홍지은',
  '이상훈',
  '김미정',
  '박성호',
  '이지은',
  '최상훈',
  '정미정',
  '오성호',
  '윤지은',
];

// random korea bank name
const koreanBankName = [
  '국민은행',
  '신한은행',
  '우리은행',
  '하나은행',
  '기업은행',
  '농협은행',
  '외환은행',
  'SC제일은행',
  '씨티은행',
  '대구은행',
  '부산은행',
  '경남은행',
  '광주은행',
  '전북은행',
  '제주은행',
  '새마을금고',
  '신협',
  '우체국',
  '카카오뱅크',
  '케이뱅크',
];

*/
  
 


export default function Index({ params }: any) {

    //console.log('params', params);

    // get params

    const searchParams = useSearchParams();

    const storeUser = searchParams.get('storeUser');

    console.log('storeUser', storeUser);


    //const storecode = storeUser?.split('@').slice(-1)[0];
    //const memberid = storeUser?.split('@').slice(0, -1).join('@');

    
    const storecode = params?.center;

    console.log("storecode", storecode);

    const memberid = storeUser;
  
    console.log("memberid", memberid);

  


  

    const paramDepositName = searchParams.get('depositName');
    const paramDepositBankName = searchParams.get('depositBankName');
    const paramDepositBankAccountNumber = searchParams.get('depositBankAccountNumber');
    

    const paramDepositAmountKrw = searchParams.get('depositAmountKrw');


    useEffect(() => {
      // Dynamically load the Binance widget script
      const script = document.createElement("script");
      script.src = "https://public.bnbstatic.com/unpkg/growth-widget/cryptoCurrencyWidget@0.0.20.min.js";
      script.async = true;
      document.body.appendChild(script);
  
      return () => {
        // Cleanup the script when the component unmounts
        document.body.removeChild(script);
      };
    }, []);



    const contract = getContract({
      // the client you have created via `createThirdwebClient()`
      client,
      // the chain the contract is deployed on
      
      
      chain: arbitrum,
    
    
    
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
      Buy: "",
      Total: "",
      Orders: "",
      Trades: "",
      Search_my_trades: "",
  
      Seller: "",
      Buyer: "",
      Me: "",

      Price: "",
      Amount: "",
      Rate: "",
  
      Go_Buy_USDT: "",
      Go_Sell_USDT: "",

      Disconnect_Wallet: "",

      My_Order: "",

      Payment: "",
      Bank_Transfer: "",


      hours: "",
      minutes: "",
      seconds: "",

      hours_ago: "",
      minutes_ago: "",
      seconds_ago: "",

      Waiting_for_seller_to_deposit: "",
      to_escrow: "",

      If_you_request_payment: "",
      I_agree_to_escrow_USDT: "",


 
      Bank_Name: "",
      Account_Number: "",
      Account_Holder: "",
      Deposit_Name: "",
      Deposit_Amount: "",
      Deposit_Deadline: "",

      Waiting_for_seller_to_confirm_payment: "",

      Confirm_Payment: "",

      Connect_Wallet_Description_For_Buyers: "",

      I_agree_to_the_terms_of_trade: "",

      Requesting_Payment: "",

      Deposit_Information: "",

      Request_Payment: "",

      Checking_the_bank_transfer_from_the_buyer: "",

      I_agree_to_check_the_bank_transfer_of: "",

      Transfering_USDT_to_the_buyer_wallet_address: "",

      Anonymous: "",

      TID: "",

      Escrow: "",

      Profile: "",
      My_Profile_Picture: "",
  
      Edit: "",


      Cancel: "",
      Save: "",
      Enter_your_nickname: "",

      Nickname_should_be_5_10_characters: "",

      You_must_have_a_wallet_address_to_buy_USDT: "",
      Make_Wallet_Address: "",

      My_Wallet_Address: "",

      PRICE_10000_KRW: "",
      PRICE_50000_KRW: "",
      PRICE_100000_KRW: "",
      PRICE_300000_KRW: "",
      PRICE_500000_KRW: "",
      PRICE_1000000_KRW: "",
      PRICE_5000000_KRW: "",
      PRICE_10000000_KRW: "",

      Please_keep_Your_Wallet_address_safe: "",

      Waiting_for_the_USDT_to_be_sent_to_the_store_address: "",
      Successfully_sent_USDT_to_the_store_address: "",

      Order_accepted_successfully: "",

      Order_Opened: "",
      Trade_Started: "",

      When_the_deposit_is_completed: "",

      Completed_at: "",

      Please_enter_deposit_name: "",

      Copy: "",

      Your_wallet_address_is_copied: "",

      Charge: "",

      Deposit_name_description: "",

      Deposit_Confirmed: "",

      Account_number_has_been_copied: "",

      Payment_name_has_been_copied: "",

      Payment_amount_has_been_copied: "",

      My_Balance: "",


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
      Buy,
      Total,
      Orders,
      Trades,
      Price,
      Amount,
      Rate,

      Search_my_trades,
      Seller,
      Buyer,
      Me,
      Go_Buy_USDT,
      Go_Sell_USDT,

      Disconnect_Wallet,

      My_Order,

      Payment,
      Bank_Transfer,

      hours,
      minutes,
      seconds,

      hours_ago,
      minutes_ago,
      seconds_ago,

      Waiting_for_seller_to_deposit,
      to_escrow,

      If_you_request_payment,
      I_agree_to_escrow_USDT,

      Bank_Name,
      Account_Number,
      Account_Holder,
      Deposit_Name,
      Deposit_Amount,
      Deposit_Deadline,

      Waiting_for_seller_to_confirm_payment,

      Confirm_Payment,

      Connect_Wallet_Description_For_Buyers,

      I_agree_to_the_terms_of_trade,

      Requesting_Payment,

      Deposit_Information,

      Request_Payment,

      Checking_the_bank_transfer_from_the_buyer,

      I_agree_to_check_the_bank_transfer_of,

      Transfering_USDT_to_the_buyer_wallet_address,

      Anonymous,

      TID,

      Escrow,

      Profile,
      My_Profile_Picture,

      Edit,

      Cancel,
      Save,
      Enter_your_nickname,

      Nickname_should_be_5_10_characters,

      You_must_have_a_wallet_address_to_buy_USDT,
      Make_Wallet_Address,

      My_Wallet_Address,

      PRICE_10000_KRW,
      PRICE_50000_KRW,
      PRICE_100000_KRW,
      PRICE_300000_KRW,
      PRICE_500000_KRW,
      PRICE_1000000_KRW,
      PRICE_5000000_KRW,
      PRICE_10000000_KRW,

      Please_keep_Your_Wallet_address_safe,

      Waiting_for_the_USDT_to_be_sent_to_the_store_address,
      Successfully_sent_USDT_to_the_store_address,

      Order_accepted_successfully,

      Order_Opened,
      Trade_Started,

      When_the_deposit_is_completed,

      Completed_at,

      Please_enter_deposit_name,

      Copy,

      Your_wallet_address_is_copied,

      Charge,

      Deposit_name_description,

      Deposit_Confirmed,

      Account_number_has_been_copied,

      Payment_name_has_been_copied,

      Payment_amount_has_been_copied,

      My_Balance,

    } = data;
   
 
 
 
 
  const router = useRouter();
    

  //const orderId = params.orderId as string;

  const orderId = "0";
  
  console.log('orderId', orderId);


 

    // get the active wallet
    const activeWallet = useActiveWallet();




  const smartAccount = useActiveAccount();


  //const address = smartAccount?.address || "";

  const [address, setAddress] = useState(
    smartAccount?.address || ""
  );




    const [balance, setBalance] = useState(0);
    useEffect(() => {

      if (!address) {
        return;
      }
  
      // get the balance
      const getBalance = async () => {
        const result = await balanceOf({
          contract,
          address: address,
        });
    
        //console.log(result);
    
        setBalance( Number(result) / 10 ** 6 );
  
      };
  
      if (address) getBalance();
  
      const interval = setInterval(() => {
        if (address) getBalance();
      } , 5000);

      return () => clearInterval(interval);
  
    } , [address, contract]);




    

    // fetch store info by storecode
    const [storeInfo, setStoreInfo] = useState<any>(null);
    const [loadingStoreInfo, setLoadingStoreInfo] = useState(true);
    useEffect(() => {
      const fetchStoreInfo = async () => {
        if (!storecode) {
          return;
        }

        setLoadingStoreInfo(true);
        const response = await fetch('/api/store/getOneStore', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            storecode: storecode,
          }),
        });

        if (!response) {
          setLoadingStoreInfo(false);
          toast.error('가맹점 정보를 가져오는 데 실패했습니다.');
          return;
        }
  
        const data = await response?.json();
  
        //console.log('data', data);
  
        if (data.result) {
          setStoreInfo(data.result);
        }
  
        setLoadingStoreInfo(false);
      };
  
      fetchStoreInfo();
    }, [storecode]);

    /*
    {
    "_id": "681b3cd4b6da3a9ffe0f7831",
    "storecode": "wmipqryz",
    "storeName": "비고비",
    "storeType": "test",
    "storeUrl": "https://test.com",
    "storeDescription": "설명입니다.",
    "storeLogo": "https://www.stable.makeup/logo.png",
    "storeBanner": "https://www.stable.makeup/logo.png",
    "createdAt": "2025-05-07T10:58:28.019Z"
    }
    */






    /*
    const [totalSummary, setTotalSummary] = useState<any>(null);
    const [loadingSummary, setLoadingSummary] = useState(true);
  
   
  
    useEffect(() => {
  
      const fetchTotalSummary = async () => {
  
        console.log('fetchTotalSummary=======>');
  
        try {
    
          setLoadingSummary(true);
          const response = await fetch('/api/summary/getTotalSummary', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(
              {
                //searchStore: searchStore,
              }
            ),
          });
  
  
  
  
          if (!response.ok) {
            setLoadingSummary(false);
            toast.error('Failed to fetch total summary');
            console.log('Failed to fetch total summary');
            return;
          }
          const data = await response.json();
          
          console.log('getStoreSummary data', data);
      
          setTotalSummary(data.result);
  
        } catch (error) {
          console.error('Error fetching total summary:', error);
          toast.error('Error fetching total summary');
        } finally {
      
          setLoadingSummary(false);
  
        }
    
      }
  
      fetchTotalSummary();
  
      // interval
      const interval = setInterval(() => {
        fetchTotalSummary();
      }, 10000);
      return () => clearInterval(interval);
  
  
      
    }, []);

    */




   


    const [nickname, setNickname] = useState(storeUser);

    const [inputNickname, setInputNickname] = useState('');


   // select krw amount (10000, 50000, 100000, 300000, 500000, 1000000, 5000000, 10000000)

   const [krwAmounts, setKrwAmounts] = useState([10000, 50000, 100000, 300000, 500000, 1000000, 5000000, 10000000]);
   // select one of krw amount

   const [selectedKrwAmount, setSelectedKrwAmount] = useState(0);


   useEffect(() => {
      if (paramDepositAmountKrw) {
        setSelectedKrwAmount(Number(paramDepositAmountKrw));
      } else {
        setSelectedKrwAmount(0);
      }
   }, [paramDepositAmountKrw]);









   const [depositName, setDepositName] = useState(
     ////randomDepositName[Math.floor(Math.random() * randomDepositName.length)]
     paramDepositName
   );

   const [depositBankName, setDepositBankName] = useState(
     //koreanBankName[Math.floor(Math.random() * koreanBankName.length)]
     paramDepositBankName
   );

   const [depositBankAccountNumber, setDepositBankAccountNumber] = useState(
     paramDepositBankAccountNumber
   );

   const [depositAmountKrw, setDepositAmountKrw] = useState(
      paramDepositAmountKrw
    );



    const [loadingUser, setLoadingUser] = useState(true);
    const [user, setUser] = useState<any>(null);


   /*
    const fetchWalletAddress = async (
      paramNickname: string
    ) => {

      if (nickname) {
        return;
      }


      const mobile = '010-1234-5678';


      const response = await fetch('/api/user/setUserWithoutWalletAddress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          storecode: storecode,
          nickname: paramNickname,
          mobile: mobile,
        }),
      });
  
      const data = await response?.json();
  
      console.log('setUserWithoutWalletAddress data', data);

      if (!data.walletAddress) {

        toast.error('User registration has been failed');
        return;
      }

      const walletAddress = data.walletAddress;

      setAddress(walletAddress);

      setNickname(paramNickname);


    }
    */

 

    // user walletAddress is auto generated or not
    const [isMyWalletAddress, setIsMyWalletAddress] = useState(false);
    const [userPassword, setUserPassword] = useState('');

    
    useEffect(() => {

      const fetchWalletAddress = async ( ) => {

        setLoadingUser(true);
  
        const mobile = '010-1234-5678';
  
        /*
        const response = await fetch('/api/user/setUserWithoutWalletAddress', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            storecode: storecode,
            nickname: nickname,
            mobile: mobile,
          }),
        });
        */

        const response = await fetch('/api/user/setBuyerWithoutWalletAddressByStorecode', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
          },
          body: JSON.stringify(
            {
              storecode: storecode,
              
              userCode: storeUser,
              mobile: mobile,
    
              userName: depositName,
              userBankName: depositBankName,
              userBankAccountNumber: depositBankAccountNumber,
              userType: 'abc',
            }
          ),
        });

        if (!response) {
          setLoadingUser(false);
          toast.error('회원등록에 실패했습니다.');
          console.log('회원등록에 실패했습니다.');
          return;
        }

    
        const data = await response?.json();
    
        console.log('setBuyerWithoutWalletAddressByStorecode data', data);
  
        if (!data.walletAddress) {
          setLoadingUser(false);
          toast.error('회원등록에 실패했습니다.');
          return;
        }
  
   
  
        setAddress(data.walletAddress);
        


        setUser({
          storecode: storecode,
          walletAddress: data.walletAddress,
          nickname: storeUser,
          avatar: '',
          mobile: mobile,
        });





        // check if user buy order by nickname and storecode
           // get one buy order by nickname and storecode
        const responseGetOneBuyOrder = await fetch('/api/order/getOneBuyOrderByNicknameAndStorecode', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            lang: params.lang,
            storecode: storecode,
            nickname: nickname,
          })
        });
        const dataGetBuyOrder = await responseGetOneBuyOrder.json();
        //console.log('acceptSellOrderRandom dataGetBuyOrder', dataGetBuyOrder);
        if (dataGetBuyOrder.result) {
          const order = dataGetBuyOrder.result;

          router.push('/' + params.lang + '/' + storecode + '/pay-usdt-reverse/' + order._id);
          return;
        }

        setLoadingUser(false);
      }
  

      if (isMyWalletAddress === false) {

        fetchWalletAddress();
        
      }


    } , [isMyWalletAddress, storecode, storeUser,  depositName, depositBankName, depositBankAccountNumber]);
    


    ///console.log('isMyWalletAddress', isMyWalletAddress);










    // set user wallet address
    // /api/user/setUserWithoutWalletAddress
    const setUserWalletAddress = async () => {
        
      if (!nickname) {
        toast.error('Please enter your nickname');
        return;
      }

      if (!userPassword) {
        toast.error('Please enter your password');
        return;
      }

      const mobile = '010-1234-5678';

      const response = await fetch('/api/user/setUserWithoutWalletAddress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          storecode: storecode,
          nickname: nickname,
          mobile: mobile,
          password: userPassword,
        }),
      });

      const data = await response?.json();

      console.log('setUserWithoutWalletAddress data', data);

      if (!data.walletAddress) {

        toast.error('User registration has been failed');
        return;
      }

      const walletAddress = data.walletAddress;

      console.log('walletAddress', walletAddress);

      setAddress(walletAddress);

      setUser({
        walletAddress: address,
        nickname: nickname,
        avatar: '',
        mobile: '010-1234-5678',
      });

    }








  












 

    const [sellOrders, setSellOrders] = useState<SellOrder[]>([]);


    /*
    useEffect(() => {

      const fetchSellOrders = async () => {

        if (orderId !== '0') {
          return;
        }
        

        if (!selectedKrwAmount) {
          return;
        }





        // api call
        const responseGetAllSellOrders = await fetch('/api/order/getAllSellOrders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            lang: params.lang,
            chain: params.center,
          })
        });

        const dataGetAllSellOrders = await responseGetAllSellOrders.json();

        
        //console.log('data', data);



        if (dataGetAllSellOrders.result) {

          // find one of sell order which is krwAmount is selectedKrwAmount and status is ordered
          

          const order = dataGetAllSellOrders.result.orders.find((item: any) => {
            return item.krwAmount === selectedKrwAmount && item.status === 'ordered';
          });

          if (order) {
            setSellOrders([order]);
          } else {
            toast.error('Sell order not found');
          }

        }

      }

      fetchSellOrders();

    } , [selectedKrwAmount, params.lang, params.center, orderId]);
    */
    

    

  
    

    



    useEffect(() => {

        if (!orderId) {
          return;
        }
        
        const fetchSellOrders = async () => {





          // api call
          const response = await fetch('/api/order/getOneSellOrder', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                orderId: orderId,
            })
          });
  
          const data = await response?.json();
  
          console.log('getOneSellOrder data', data);
  
          if (data.result) {

            if (data.result.orders.length > 0) {

              setSellOrders(data.result.orders);

              setAddress(data.result.orders[0].buyer.walletAddress);

              ////setNickname(data.result.orders[0].buyer.nickname);
            }


          }
  
        };
  
        fetchSellOrders();



        
        const interval = setInterval(() => {

          fetchSellOrders();
        }, 10000);
        
        return () => clearInterval(interval);
        
  
    }, [orderId]);





    // array of escrowing
    const [escrowing, setEscrowing] = useState([] as boolean[]);

    useEffect(() => {
        
        setEscrowing(
          new Array(sellOrders.length).fill(false)
        );
  
    } , [sellOrders]);





    // array of requestingPayment
    const [requestingPayment, setRequestingPayment] = useState([] as boolean[]);

    useEffect(() => {

      setRequestingPayment(
        
        sellOrders.map((item) => {
          
          if (item.status === 'paymentRequested') {
            return true;
          }
          return false;
        } )

      );

    } , [sellOrders]);








    const [isModalOpen, setModalOpen] = useState(false);

    const closeModal = () => setModalOpen(false);
    const openModal = () => setModalOpen(true);





    const [usdtAmount, setUsdtAmount] = useState(0);

    const [defaultKrWAmount, setDefaultKrwAmount] = useState(0);

    const [krwAmount, setKrwAmount] = useState(
      krwAmounts[0]
    );

    ///console.log('usdtAmount', usdtAmount);



    const [rate, setRate] = useState(1380);




    useEffect(() => {

      if (usdtAmount === 0) {

        setDefaultKrwAmount(0);

        setKrwAmount(0);

        return;
      }
    
        
      setDefaultKrwAmount( Math.round(usdtAmount * rate) );


      setKrwAmount( Math.round(usdtAmount * rate) );

    } , [usdtAmount, rate]);








    /* agreement for trade */
    const [agreementForTrade, setAgreementForTrade] = useState([] as boolean[]);
    useEffect(() => {
        setAgreementForTrade (
            sellOrders.map((item, idx) => {
                return false;
            })
        );
    } , [sellOrders]);

    const [acceptingSellOrder, setAcceptingSellOrder] = useState([] as boolean[]);

    useEffect(() => {
        setAcceptingSellOrder (
            sellOrders.map((item, idx) => {
                return false;
            })
        );
    } , [sellOrders]);


    // request payment check box
    const [requestPaymentCheck, setRequestPaymentCheck] = useState([] as boolean[]);
    useEffect(() => {
        
        setRequestPaymentCheck(
          new Array(sellOrders.length).fill(false)
        );
  
    } , [sellOrders]);





    const acceptSellOrder = (index: number, orderId: string) => {

        if (!user) {
            return;
        }

        setAcceptingSellOrder (
            sellOrders.map((item, idx) => {
                if (idx === index) {
                    return true;
                } else {
                    return false;
                }
            })
        );


        fetch('/api/order/acceptSellOrder', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                lang: params.lang,
                storecode: storecode,
                orderId: orderId,
                buyerWalletAddress: user.walletAddress,
                buyerNickname: user.nickname,
                buyerAvatar: user.avatar,
                buyerMobile: user.mobile,
            }),
        })
        .then(response => response?.json())
        .then(data => {

            console.log('data', data);

            //setSellOrders(data.result.orders);
            //openModal();

            toast.success(Order_accepted_successfully);


            /*
            fetch('/api/order/getOneSellOrder', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  orderId: orderId,
                }),
            })
            .then(response => response?.json())
            .then(data => {
                ///console.log('data', data);
                setSellOrders(data.result.orders);
            })
            */


            // reouter to

            router.push('/' + params.lang + '/' + storecode + '/pay-usdt/' + orderId);




        })
        .catch((error) => {
            console.error('Error:', error);
        })
        .finally(() => {
            setAcceptingSellOrder (
                sellOrders.map((item, idx) => {
                    return false;
                })
            );
        } );


    }





    const requstPayment = async (
      index: number,
      orderId: string,
      tradeId: string,
      amount: number,
    ) => {
      // check balance
      // send payment request

      if (balance < amount) {
        toast.error('Insufficient balance');
        return;
      }

      if (escrowing[index]) {
        toast.error('Escrowing');
        return;
      }


      if (requestingPayment[index]) {
        toast.error('Requesting payment');
        return;
      }



      setEscrowing(
        escrowing.map((item, idx) => {
          if (idx === index) {
            return true;
          }
          return item;
        })
      );

   


      // send USDT
      // Call the extension function to prepare the transaction
      const transaction = transfer({
        contract,
        to: recipientWalletAddress,
        amount: amount,
      });
      


      try {


        const transactionResult = await sendAndConfirmTransaction({
            transaction: transaction,
            
            account: smartAccount as any,
        });

        console.log("transactionResult===", transactionResult);


        setEscrowing(
          escrowing.map((item, idx) => {
            if (idx === index) {
              return false;
            }
            return item;
          })
        );



        // send payment request

        if (transactionResult) {

          /*
          setRequestingPayment(
            requestingPayment.map((item, idx) => {
              if (idx === index) {
                return true;
              }
              return item;
            })
          );
          */
          
          


        
          const response = await fetch('/api/order/requestPayment', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              lang: params.lang,
              storecode: storecode,
              orderId: orderId,
              transactionHash: transactionResult.transactionHash,
            })
          });

          const data = await response?.json();

          console.log('/api/order/requestPayment data====', data);


          /*
          setRequestingPayment(
            requestingPayment.map((item, idx) => {
              if (idx === index) {
                return false;
              }
              return item;
            })
          );
          */
          


          if (data.result) {

            const response = await fetch('/api/order/getOneSellOrder', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                orderId: orderId,
              })
            });
    
            const data = await response?.json();
    
            ///console.log('data', data);
    
            if (data.result) {
              setSellOrders(data.result.orders);
            }
            


            // refresh balance

            const result = await balanceOf({
              contract,
              address: address,
            });

            //console.log(result);

            setBalance( Number(result) / 10 ** 6 );


            toast.success('Payment request has been sent');
          } else {
            toast.error('Payment request has been failed');
          }

        }


      } catch (error) {
        console.error('Error:', error);

        toast.error('Payment request has been failed');

        setEscrowing(
          escrowing.map((item, idx) => {
            if (idx === index) {
              return false;
            }
            return item;
          })
        );


      }


      

    }










    const [privateSale, setprivateSale] = useState(false);


    const [sellOrdering, setSellOrdering] = useState(false);

    const sellOrder = async () => {
      // api call
      // set sell order

      if (sellOrdering) {
        return;
      }

      setSellOrdering(true);

      const response = await fetch('/api/order/setSellOrder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          walletAddress: address,
          usdtAmount: usdtAmount,
          krwAmount: krwAmount,
          rate: rate,
          privateSale: privateSale,
        })
      });

      const data = await response?.json();

      //console.log('data', data);

      if (data.result) {
        toast.success('Sell order has been created');

        setUsdtAmount(0);
        setprivateSale(false);
     


        await fetch('/api/order/getOneSellOrder', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            walletAddress: address
          })
        }).then(async (response) => {
          const data = await response?.json();
          //console.log('data', data);
          if (data.result) {
            setSellOrders(data.result.orders);
          }
        });




      } else {
        toast.error('Sell order has been failed');
      }

      setSellOrdering(false);

      

    };







  // array of confirmingPayment

  const [confirmingPayment, setConfirmingPayment] = useState([] as boolean[]);

  useEffect(() => {
      
      setConfirmingPayment(
        new Array(sellOrders.length).fill(false)
      );

  } , [sellOrders]);



  // confirm payment check box
  const [confirmPaymentCheck, setConfirmPaymentCheck] = useState([] as boolean[]);
  useEffect(() => {
      
      setConfirmPaymentCheck(
        new Array(sellOrders.length).fill(false)
      );

  } , [sellOrders]);



  const confirmPayment = async (

    index: number,
    orderId: string,

  ) => {
    // confirm payment
    // send usdt to buyer wallet address

    if (confirmingPayment[index]) {
      return;
    }

    setConfirmingPayment(
      confirmingPayment.map((item, idx) => {
        if (idx === index) {
          return true;
        }
        return item;
      })
    );




    const response = await fetch('/api/order/confirmPayment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        lang: params.lang,
        storecode: storecode,
        orderId: orderId,
      })
    });

    const data = await response?.json();

    //console.log('data', data);

    if (data.result) {

      const response = await fetch('/api/order/getOneSellOrder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          orderId: orderId,
        })
      });

      const data = await response?.json();

      ///console.log('data', data);

      if (data.result) {
        setSellOrders(data.result.orders);
      }

      toast.success('Payment has been confirmed');
    } else {
      toast.error('Payment has been failed');
    }

    setConfirmingPayment(
      confirmingPayment.map((item, idx) => {
        if (idx === index) {
          return false;
        }
        return item;
      })
    );



  }



  // api setUserWithoutWalletAddress

  const setUserWithoutWalletAddress = async () => {

    ///////const nickname = prompt('Enter your nickname');

    if (!nickname) {

      toast.error('Please enter your nickname for temporary user');
      return;
    }

    const mobile = '010-1234-5678';
    

    const response = await fetch('/api/user/setUserWithoutWalletAddress', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        storecode: storecode,
        nickname: nickname,
        mobile: mobile,
      }),
    });

    const data = await response?.json();

    console.log('setUserWithoutWalletAddress data.walletAddress', data.walletAddress);

    if (data.walletAddress) {

      //setAddress(data.result);

      ////setUser(data.result);
      
      //window.location.reload();

      setAddress(data.walletAddress);


      /*
      await fetch('/api/user/getUser', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress: data.result.walletAddress,
        }),
      })
      .then(response => response?.json())
      .then(data => {
          console.log('data=======', data);
          setUser(data.result);
      })
      .catch((error) => {
          console.error('Error:', error);
      });
      */



    } else {
      toast.error('User registration has been failed');
    }


  }


  const [acceptingSellOrderRandom, setAcceptingSellOrderRandom] = useState(false);


  const acceptSellOrderRandom = async (
    krwAmount: number,
    depositName: string,
    depositBankName: string,
    depositBankAccountNumber: string,
  ) => {

    
    //console.log('acceptSellOrderRandom depositName', depositName);
    //console.log('acceptSellOrderRandom depositBankName', depositBankName);

    if (acceptingSellOrderRandom) {
      return;
    }

    setAcceptingSellOrderRandom(true);




    // fectch sell order and accept one of them
    
    const responseGetAllSellOrders = await fetch('/api/order/getAllSellOrders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        lang: params.lang,
        storecode: storecode,
      })
    });

    const dataGetAllSellOrders = await responseGetAllSellOrders.json();

    ///console.log('acceptSellOrderRandom dataGetAllSellOrders', dataGetAllSellOrders);

    //console.log('acceptSellOrderRandom krwAmount', krwAmount);


    if (dataGetAllSellOrders.result) {

      // find one of sell order which is krwAmount is selectedKrwAmount and status is ordered
      

      const order = dataGetAllSellOrders.result.orders.find((item: any) => {
        return item.krwAmount === krwAmount && item.status === 'ordered';
      });

      if (order) {


        // accept sell order

        const response = await fetch('/api/order/acceptSellOrder', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            lang: params.lang,
            storecode: storecode,
            
            orderId: order._id,

            buyerWalletAddress: address,
            buyerNickname: nickname,
            buyerAvatar: '',
            buyerMobile: '010-1234-5678',
            depositName: depositName,
            depositBankName: depositBankName,
            depositBankAccountNumber: depositBankAccountNumber,
          }),
        });

        const data = await response?.json();

        if (data.result) {
          toast.success("판매 주문이 수락되었습니다");

          //router.push('/' + params.lang + '/' + storecode + '/pay-usdt/' + order._id);

        } else {
          toast.error('판매 주문 수락에 실패했습니다');
        }



        //setSellOrders([order]);
      } else {

        
        ///toast.error('Sell order not found');

        // if sell order not found, create buy order

        const usdtAmount =  parseFloat((krwAmount / rate).toFixed(2));

        console.log('usdtAmount', usdtAmount);


        const response = await fetch('/api/order/setBuyOrder', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            lang: params.lang,
            storecode: storecode,
            walletAddress: address,
            nickname: nickname,
            usdtAmount: usdtAmount,
            krwAmount: krwAmount,
            rate: rate,
            privateSale: false,
            buyer: {
              depositBankName: depositBankName,
              depositBankAccountNumber: depositBankAccountNumber,
              depositName: depositName,
            }
          })
        });

        const data = await response.json();

        ///console.log('setBuyOrder data.result', data.result);



        if (data.result) {
          toast.success('구매 주문이 생성되었습니다');

          const order = data.result;

          router.push('/' + params.lang + '/' + storecode + '/pay-usdt-reverse/' + order._id);


        } else {
          toast.error('구매 주문에 실패했습니다');
        }



      }



    } else {
      toast.error('Sell order not found');
    }

    setAcceptingSellOrderRandom(false);

  }



  const [storeCodeNumber, setStoreCodeNumber] = useState('');

  useEffect(() => {

    const fetchStoreCode = async () => {

      const response = await fetch('/api/order/getStoreCodeNumber', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      //console.log('data', data);

      setStoreCodeNumber(data?.storeCodeNumber);

    }

    fetchStoreCode();

  } , []);













  if (orderId !== '0') {
      
      return (
        <div>
          Order not found
        </div>
      );

    }



  if (orderId === '0' && !storeUser) {
    return (
      <div>
        Store user not found
      </div>
    );
  }


  /*
  if (orderId === '0' && storeCodeNumber && storecode !== storeCodeNumber) {
    return (
      <div>
        Store code is invalid
      </div>
    );
  }
    */
  

  if (orderId === '0' && !paramDepositName) {
    return (
      <div>
        Deposit name is invalid
      </div>
    );
  }

  if (orderId === '0' && !paramDepositBankName) {
    return (
      <div>
        Deposit bank name is invalid
      </div>
    );
  }



  // check storeInfo
  if (loadingStoreInfo) {
    return (
      <div className="w-full h-screen flex items-center justify-center">

        <div className='flex flex-col items-center justify-center gap-2'>

          <Image
            src="/banner-loading.gif"
            alt="Loading"
            width={200}
            height={200}
            className="w-32 h-32"
          />
          <div className="text-sm text-zinc-500">
            가맹점 정보를 불러오는 중입니다...
          </div>
        </div>
      </div>
    );
  }

  if (!loadingStoreInfo && !storeInfo) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <div className="flex flex-col items-center justify-center gap-2">
          <Image
            src="/banner-404.gif"
            alt="Error"
            width={200}
            height={200}
            className="w-32 h-32"
          />
          <div className="text-sm text-zinc-500">
            가맹점 정보를 찾을 수 없습니다.
          </div>
        </div>
      </div>
    );
  }




    
  return (

    <main className="
      pl-2 pr-2
      pb-10 min-h-[100vh] flex flex-col items-center justify-start container
      max-w-screen-sm
      mx-auto
      bg-zinc-50
      text-zinc-500
      ">


      <div className="
        h-32

        w-full flex flex-col gap-2 justify-center items-center
        p-4
        bg-gradient-to-r from-[#f9a8d4] to-[#f472b6]
        rounded-b-2xl
        shadow-lg
        shadow-[#f472b6]
        border-b-2 border-[#f472b6]
        border-opacity-50
        ">

        {loadingStoreInfo ? (
          <div className="w-full flex flex-row items-center justify-start gap-2">
            <Image
              src="/loading.png"
              alt="Loading"
              width={24}
              height={24}
              className='animate-spin'
            />
            <div className="text-sm text-zinc-50">
              가맹점 정보를 불러오는 중입니다.
            </div>
          </div>
        ) : (
          <div className="w-full flex flex-row items-center justify-between gap-2">

            <div className='flex flex-col gap-2 items-center justify-start'>
              <Image
                src={storeInfo?.storeLogo || '/logo.png'}
                alt="Store Logo"
                width={38}
                height={38}
                className='rounded-full w-10 h-10'
              />
              <span className="text-sm text-zinc-100 font-semibold">
                {storeInfo?.storeName}
              </span>
            </div>

            {loadingUser && (
              <div className="flex flex-row items-center justify-center gap-2">
                <Image
                  src="/loading.png"
                  alt="Loading"
                  width={24}
                  height={24}
                  className='animate-spin'
                />
                <div className="text-sm text-zinc-50">
                  회원정보를 불러오는 중입니다.
                </div>
              </div>
            )}

            {!loadingUser && user && (

              <div className="flex flex-col items-start justify-center gap-2">

                <div className='flex flex-row gap-2 items-center justify-center'>
                  <span className="text-sm text-zinc-100">

                    아이디:{' '}{
                      memberid ? memberid : sellOrders.length > 0 ? sellOrders[0]?.buyer.nickname
                      : user?.nickname
                    }
                  </span>
                </div>

                <div className='flex flex-row gap-2 items-center justify-center'>
                  <span className="text-sm text-zinc-100">
                    USDT지갑:{' '}
                  </span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(address);
                      toast.success("USDT지갑주소가 복사되었습니다.");
                    }}
                    className="text-sm underline text-zinc-100 hover:text-zinc-200"
                  >
                    {address.slice(0, 6)}...{address.slice(-4)}
                  </button>
                </div>

                {/* balance */}
                <div className="flex flex-row gap-2 items-center justify-center">
                  <span className="text-sm text-zinc-100">
                    잔액:{' '}
                  </span>

                  <div className="flex flex-row items-center justify-center gap-2">
                    <span className="text-xl font-semibold text-zinc-100">
                      {Number(balance).toFixed(2)}
                    </span>
                    {' '}
                    <span className="text-sm text-zinc-100">
                      USDT
                    </span>
                  </div>
                </div>

                
              </div>

            )}




          </div>
        )}


      </div>




      {/* USDT 가격 binance market price */}
      {/*
      <div
        className="binance-widget-marquee
        w-full flex flex-row items-center justify-center gap-2
        p-2
        "


        data-cmc-ids="1,1027,52,5426,3408,74,20947,5994,24478,13502,35336,825"
        data-theme="dark"
        data-transparent="true"
        data-locale="ko"
        data-fiat="KRW"
        //data-powered-by="Powered by OneClick USDT"
        //data-disclaimer="Disclaimer"
      ></div>
      */} 



      <div className="
        mt-5
        p-4  w-full
        flex flex-col gap-2 justify-start items-center
        bg-zinc-50
        rounded-2xl
        shadow-lg
        shadow-zinc-200
        border-2 border-zinc-200
        border-opacity-50
        ">

 





        {!address && (

          <div className="w-full mt-5 flex flex-row items-center justify-center gap-2 mb-4">



            {orderId === '0' && (
              <div className='hidden w-full flex-col xl:flex-row gap-2 items-center xl:items-end justify-center'>

              
                  <span className="text-sm text-zinc-500">
                    {You_must_have_a_wallet_address_to_buy_USDT}
                  </span>

                  <div className='flex flex-col gap-2 items-center justify-center'>

                    <span className="text-sm text-zinc-500">
                      {Nickname_should_be_5_10_characters}
                    </span>

                    <input
                      type="text"

                      value={nickname || ''}

                      /*
                      value={inputNickname}

                      
                      onChange={(e) => {


                        // check alphabet and number 5-10 characters

                        //e.target.value = e.target.value.replace(/[^a-zA-Z0-9]/g, '');




                        setInputNickname(

                          e.target.value.replace(/[^a-zA-Z0-9]/g, '').substring(0, 10)
                        );



                      } }
                        */



                      placeholder={Enter_your_nickname}
                      className="text-lg bg-black text-zinc-500 px-4 py-2 rounded-md border border-zinc-100"
                    />


                  </div>




              </div>

            )}




          </div>

        )}



              {!loadingUser && (
                <div className="w-full flex flex-col items-start justify-between gap-2">

                  {/* my usdt balance */}
                  <div className='hidden w-full  flex-row items-between justify-start gap-5'>

                    <div className=" flex flex-col gap-2 items-start">
                      <div className="text-5xl font-semibold text-zinc-500">
                        {Number(balance).toFixed(2)} <span className="text-lg">USDT</span>
                      </div>
                    </div>

                    <div className="hidden flex-row gap-2 items-center justify-center">
                      
                        <Image
                          src={user?.avatar || "/profile-default.png"}
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
                        <div className="text-lg font-semibold text-zinc-500 ">{
                          user?.nickname ? user.nickname : Anonymous
                        }</div>

                        {user?.seller && (
                          <div className="flex flex-row items-center gap-2">
                            <Image
                              src="/verified.png"
                              alt="Verified"
                              width={24}
                              height={24}
                            />
                            <Image
                              src="/best-seller.png"
                              alt="Best Seller"
                              width={24}
                              height={24}
                            />
                          </div>
                        )}
                      
                    </div>
                  </div>

                  {/* check box for isMyWalletAddress */}
                  {/*
                  <div className="w-full flex flex-col gap-2 items-center justify-start">

                      
                    <div className='flex flex-row gap-2 items-center justify-center'>
                      <input
                        type="checkbox"
                        checked={isMyWalletAddress}
                        onChange={(e) => setIsMyWalletAddress(e.target.checked)}
                      />
                      <span className="text-lg text-zinc-500">
                        내 USDT지갑주소
                      </span>
                    </div>


                    {isMyWalletAddress && (
                      <div className="w-full flex flex-col xl:flex-row gap-2 items-start justify-start">

                        <input
                          disabled
                          type="text"
                          value={memberid || ''}
                          placeholder="아이디"
                          className="text-lg bg-black text-zinc-500 px-4 py-2 rounded-md border border-zinc-100"
                        />

                        <input
                          type="password"
                          value={userPassword}
                          onChange={(e) => setUserPassword(e.target.value)}
                          placeholder="비밀번호"
                          className="text-lg bg-black text-zinc-500 px-4 py-2 rounded-md border border-zinc-100"
                        />


                        <button
                          onClick={setUserWalletAddress}
                          className="text-lg bg-green-500 text-zinc-500 px-4 py-2 rounded-md"
                        >
                          USDT지갑주소 설정
                        </button>

                      </div>
                    )}

                  </div>
                  */}

        


                  {/* select one of krw amounts combo box */}
                  {/* combo box */}

                  {/* 10000, 50000, 100000, 300000, 500000, 1000000, 5000000, 10000000 */}

                  {orderId === '0' && (

                    <div className='w-full flex flex-col gap-2 items-center justify-start'>



                      {/* usdtAmount */}
                      {/* 구매량 */}
                      <div className="flex flex-row gap-2 items-center justify-center
                        border-b-2 border-zinc-200 border-opacity-50
                        pb-2 mb-2
                        ">
                          <span className="text-sm text-zinc-500">
                            구매량
                          </span>
                          <Image
                            src="/logo-tether.png"
                            alt="USDT"
                            width={24}
                            height={24}
                            className="rounded-full w-6 h-6"
                          />

                          <div className="text-2xl font-semibold text-zinc-500">
                            {
                              (selectedKrwAmount / rate)?.toLocaleString('us-US', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })  
                            } USDT
                          </div>
                      </div>

                      {/* 구매한 수량은 자동으로 가맹점 결제에 반영됩니다. */}
                      <div className='flex flex-row gap-2 items-center justify-center'>
                        <Image
                          src="/icon-info.png"
                          alt="Info"
                          width={16}
                          height={16}
                          className="rounded-full w-4 h-4"
                        />
                        <span className="text-sm text-zinc-500">
                          구매한 수량은 자동으로 가맹점 결제에 반영됩니다.
                        </span>
                      </div>

                      {/* selected krw amount */}

                  

                      <div className="flex flex-col xl:flex-row gap-2 items-center justify-center
                        border-b-2 border-zinc-200 border-opacity-50
                        pb-2 mb-2
                        ">
                        <div className="flex flex-row gap-2 items-center justify-center">
                            <span className="text-sm text-zinc-500">
                              구매금액
                            </span>
                            <div className="text-2xl font-semibold text-zinc-500">
                              {
                                selectedKrwAmount?.toLocaleString('ko-KR')
                              } 원
                            </div>


                            {/* reset button */}
                            {(!depositAmountKrw || depositAmountKrw === "0") && (

                              <button
                                onClick={() => setSelectedKrwAmount(0)}
                                className={`${loadingStoreInfo ? 'bg-[#f472b6]' : 'bg-green-500'
                                  }
                                  text-sm text-zinc-100
                                  px-4 py-2 rounded-md border border-zinc-100
                                  hover:bg-[#f472b6] hover:text-zinc-50
                                  `}
                                disabled={loadingStoreInfo}
                              >
                                초기화
                              </button>
                            )}

                        </div>

                        {/* 시세 */}
                        <div className="flex flex-row gap-2 items-center justify-center">
 
                            <span className="text-sm text-zinc-500">
                              시세
                            </span>
                            <div className="text-2xl font-semibold text-zinc-500">
                              {
                                rate?.toLocaleString('ko-KR')
                              } 원
                            </div>

                           {/* new window for upbit site */}
                            <a
                              href="https://upbit.com/exchange?code=CRIX.UPBIT.KRW-USDT"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex flex-row gap-2 items-center justify-center"
                            >
                              <div className='flex flex-row gap-2 items-center justify-center'>
                                <span className="text-sm text-zinc-500">
                                  시세제공
                                </span>
                                <Image
                                  src="/logo-upbit.jpg"
                                  alt="upbit"
                                  width={100}
                                  height={100}
                                  className="rounded-full w-12 h-12"
                                />
                              </div>
                            </a>


                        </div>



                      </div>



                      {(!depositAmountKrw || depositAmountKrw === "0") && (

                        <div className="mt-4 grid grid-cols-2 xl:grid-cols-3 gap-4 w-full text-sm text-zinc-200">



                            {/* when mouse over, background color is green */}

                            <button
                              onClick={() => setSelectedKrwAmount(
                                selectedKrwAmount + 5000
                              )}
                              className={`${loadingStoreInfo ? 'bg-zinc-800' : 'bg-green-500'
                              }
                                text-lg text-zinc-100
                                px-4 py-2 rounded-md border border-zinc-100
                                hover:bg-[#f472b6] hover:text-zinc-50
                                `}
                              disabled={loadingStoreInfo}
                            >
                              5,000원
                            </button>


                            <button
                              onClick={() => setSelectedKrwAmount(
                                selectedKrwAmount + 10000
                              )}
                              className={`${loadingStoreInfo ? 'bg-[#f472b6]' : 'bg-green-500'
                              }
                                text-lg text-zinc-100
                                px-4 py-2 rounded-md border border-zinc-100
                                hover:bg-[#f472b6] hover:text-zinc-50
                                `}
                            >
                              10,000원
                            </button>

                            <button
                              onClick={() => setSelectedKrwAmount(
                                selectedKrwAmount + 50000
                              )}
                              className={`${loadingStoreInfo ? 'bg-[#f472b6]' : 'bg-green-500'
                              }
                                text-lg text-zinc-100
                                px-4 py-2 rounded-md border border-zinc-100
                                hover:bg-[#f472b6] hover:text-zinc-50
                                `}
                            >
                              50,000원
                            </button>

                            <button
                              onClick={() => setSelectedKrwAmount(
                                selectedKrwAmount + 100000
                              )}
                              className={`${loadingStoreInfo ? 'bg-[#f472b6]' : 'bg-green-500'
                              }
                                text-lg text-zinc-100
                                px-4 py-2 rounded-md border border-zinc-100
                                hover:bg-[#f472b6] hover:text-zinc-50
                                `}
                            >
                              100,000원
                            </button>

                            <button
                              onClick={() => setSelectedKrwAmount(
                                selectedKrwAmount + 500000
                              )}
                              className={`${loadingStoreInfo ? 'bg-[#f472b6]' : 'bg-green-500'
                              }
                                text-lg text-zinc-100
                                px-4 py-2 rounded-md border border-zinc-100
                                hover:bg-[#f472b6] hover:text-zinc-50
                                `}
                            >
                              500,000원
                            </button>

                            <button
                              onClick={() => setSelectedKrwAmount(
                                selectedKrwAmount + 1000000
                              )}
                              className={`${loadingStoreInfo ? 'bg-[#f472b6]' : 'bg-green-500'
                              }
                                text-lg text-zinc-100
                                px-4 py-2 rounded-md border border-zinc-100
                                hover:bg-[#f472b6] hover:text-zinc-50
                                `}
                            >
                              1,000,000원
                            </button>


                        </div>

                      )}


                      <div className='mt-5 flex flex-col xl:flex-row gap-2 items-center justify-center'>

                        <div className="felex flex-col gap-2 items-center justify-center">

                          {/* deposit bank name */}
                          <div className='flex flex-row gap-2 items-center justify-center'>
                            <span className="w-24 text-sm text-zinc-500">
                              입금자은행명
                            </span>
                            <input
                              //disabled={!address || !selectedKrwAmount || acceptingSellOrderRandom}
                              disabled={true}
                              type="text"
                              value={depositBankName || ''}
                              onChange={(e) => setDepositBankName(e.target.value)}
                              placeholder="입금자은행명"
                              className=" text-sm font-semibold bg-zinc-200 text-zinc-600 px-4 py-2 rounded-md border border-zinc-100"
                            />
                          </div>


                          {/* deposit bank account number */}
                          <div className='mt-2 flex flex-row gap-2 items-center justify-center'>
                            <span className=" w-24 text-sm text-zinc-500">
                              입금자계좌번호
                            </span>
                            <input
                              //disabled={!address || !selectedKrwAmount || acceptingSellOrderRandom}
                              disabled={true}
                              type="text"
                              value={depositBankAccountNumber || ''}
                              onChange={(e) => setDepositBankAccountNumber(e.target.value)}
                              placeholder="입금자계좌번호"
                              className=" text-sm font-semibold bg-zinc-200 text-zinc-600 px-4 py-2 rounded-md border border-zinc-100"
                            />
                          </div>

                          


                          {/* input deposit name */}
                          <div className='mt-2 flex flex-row gap-2 items-center justify-center'>
                            
                            <span className=" w-24 text-sm text-zinc-500">
                              입금자명
                            </span>

                            <input
                              //disabled={!address || !selectedKrwAmount || acceptingSellOrderRandom}
                              disabled={true}
                              type="text"
                              value={depositName || ''}
                              onChange={(e) => setDepositName(e.target.value)}
                              placeholder={Deposit_Name}
                              className=" text-sm font-semibold bg-zinc-200 text-zinc-600 px-4 py-2 rounded-md border border-zinc-100"
                            />
                          </div>


                        </div>
                        



                        <button
                          disabled={!address || !user || !selectedKrwAmount || acceptingSellOrderRandom}
                          className={`
                          ${!user || !selectedKrwAmount || acceptingSellOrderRandom ? 'bg-zinc-200' : 'bg-[#f472b6]'
                          }
                            w-full
                            text-lg text-zinc-50 px-4 py-2 rounded-md border border-zinc-100
                            hover:bg-[#f472b6] hover:text-zinc-50
                            `}

                          onClick={() => {

                              // check deposit name is empty
                              if (!depositName) {
                                toast.error(Please_enter_deposit_name);
                                return;
                              }

                              acceptSellOrderRandom(
                                selectedKrwAmount,
                                depositName,
                                depositBankName || '',
                                depositBankAccountNumber || ''
                              );
                        

                          }}
                        >
                          <div className="flex flex-row items-center justify-center gap-2">
                            {/* loaaing icon */}
                            {acceptingSellOrderRandom ? (
                              <Image
                                src="/loading.png"
                                alt="Loading"
                                width={24}
                                height={24}
                                className='animate-spin'
                              />
                            ) : (
                              <Image
                                src="/icon-buy.webp"
                                alt="Check"
                                width={24}
                                height={24}
                              />
                            )}
                          
                            <div className="flex flex-row items-center justify-center gap-2">
                              {acceptingSellOrderRandom ? (
                                <span className="text-sm text-zinc-500">
                                  구매주문 중입니다.
                                </span>
                              ) : (
                                <span className="text-sm text-zinc-500
                                  hover:text-zinc-50
                                  ">
                                  
                                  구매하기
                                </span>
                              )}
                            </div>

                          </div>

                        </button>

                      </div>

                      {/* deposit name description */}
                      <div className='
                        mt-2 w-full flex flex-row items-center justify-start gap-2
                        '>
                        <Image
                          src="/icon-info.png"
                          alt="Info"
                          width={24}
                          height={24}
                        />
                        <span className="text-sm text-zinc-500">
                          입금 시 반드시 사전 등록한 은행과 이름, 계좌번호로 송금해야 합니다. 이와 다를 시에는 입금 처리가 안될 수 있습니다.
                        </span>
                      </div>


                    </div>
                  )}






                </div>
              )}



            {sellOrders.length > 0 && (
              <div className="mt-4 w-full flex flex-col gap-5 xl:flex-row items-start justify-center ">


                <div className="w-full mb-10 grid grid-cols-1 gap-4  justify-center  ">

                    {sellOrders.map((item, index) => (




                      <div
                        key={index}
                        className="relative flex flex-col items-center justify-center"
                      >

  




                        {item.status === 'ordered' && (new Date().getTime() - new Date(item.createdAt).getTime() > 1000 * 60 * 60 * 24) && (
                          <div className="absolute inset-0 flex justify-center items-center z-10
                            bg-black bg-opacity-50
                          ">
                            <Image
                              src="/icon-expired.png"
                              alt="Expired"
                              width={100}
                              height={100}
                              className="opacity-20"
                            />
                          </div>
                        )}



                        {item.status === 'cancelled' && (
                          <div className="absolute inset-0 flex justify-center items-center z-10
                            bg-black bg-opacity-50
                          ">
                            <Image
                              src="/icon-cancelled.png"
                              alt="Cancelled"
                              width={100}
                              height={100}
                              className="opacity-20"
                            />
                          </div>
                        )}



                        <div className=" w-full flex flex-col gap-2 items-center justify-start">


                          {address && item.buyer && item?.buyer?.walletAddress === address && (
                            <div className="w-full flex flex-row items-center justify-start">
                              <div className='flex flex-row items-center gap-2'>

                                <Image
                                    src={item.avatar || '/profile-default.png'}
                                    alt="Avatar"
                                    width={32}
                                    height={32}
                                    priority={true} // Added priority property
                                    className="rounded-full"
                                    style={{
                                        objectFit: 'cover',
                                        width: '32px',
                                        height: '32px',
                                    }}
                                />      


                                <h2 className="text-lg font-semibold">
                                    {Seller}: {

                                        item.walletAddress === address ? item.nickname ? item.nickname : Anonymous  + ' :' + Me :
                                        
                                        item.nickname ? item.nickname : Anonymous

                                    }
                                </h2>

                                <Image
                                    src="/verified.png"
                                    alt="Verified"
                                    width={24}
                                    height={24}
                                />

                                <Image
                                  src='/best-seller.png'
                                  alt='Best Seller'
                                  width={24}
                                  height={24}
                                />

                              </div>

                            </div>
                          )}

                          {/* byer information */}
                          {address && item.walletAddress === address && (
                            <div className="w-full flex flex-row items-center justify-start">
                              <div className='flex flex-row items-center gap-2'>

                                <Image
                                    src={item.buyer?.avatar || '/profile-default.png'}
                                    alt="Avatar"
                                    width={32}
                                    height={32}
                                    priority={true} // Added priority property
                                    className="rounded-full"
                                    style={{
                                        objectFit: 'cover',
                                        width: '32px',
                                        height: '32px',
                                    }}
                                />

                                <h2 className="text-lg font-semibold">
                                    {Buyer}: {
                                        item.buyer?.nickname ? item.buyer?.nickname : Anonymous
                                    }
                                </h2>

                                <Image
                                    src="/verified.png"
                                    alt="Verified"
                                    width={24}
                                    height={24}

                                />

                                <Image
                                  src='/icon-user.png'
                                  alt='Best Buyer'
                                  width={24}
                                  height={24}

                                />

                              </div>
      
                            </div>


                          )}




                          <article
                              className={`w-full bg-black p-4 rounded-md border
                                
                                ${item.walletAddress === address ? 'border-green-500' : 'border-gray-200'}

                                ${item.status === 'paymentConfirmed' ? 'bg-gray-900 border-gray-900' : ''}

                                w-96 `
                              }
                          >

                              {item.status === 'ordered' && (
                                <div className=" flex flex-col items-start justify-start gap-1">


                                  <div className="flex flex-row items-center gap-2">
                                    {/* new order icon */}
                                    {
                                      (new Date(item.createdAt).getTime() - new Date().getTime()) / 1000 / 60 / 60 < 24 && (
                                        <Image
                                          src="/icon-new.png"
                                          alt="New Order"
                                          width={32}
                                          height={32}
                                        />
                                      )
                                    } 



                                    {item.privateSale ? (
                                        <Image
                                          src="/icon-private-sale.png"
                                          alt="Private Sale"
                                          width={32}
                                          height={32}
                                        />
                                    ) : (
                                        <Image
                                          src="/icon-public-sale.png"
                                          alt="Public Sale"
                                          width={32}
                                          height={32}
                                        />
                                    )}

                                    
                                    {/* Expired in 24 hours */}
                                    <p className=" text-sm text-zinc-400">
                                      Expired in {24 - Math.floor((new Date().getTime() - new Date(item.createdAt).getTime()) / 1000 / 60 / 60)} {hours}
                                    </p>

                                  </div>

                                  <p className="mb-4 text-sm text-zinc-400">
                                    Opened at {
                                      new Date(item.createdAt).toLocaleDateString() + ' ' + new Date(item.createdAt).toLocaleTimeString()
                                    }
                                  </p>

                                </div>
                              )}


                              { (item.status === 'accepted' || item.status === 'paymentRequested' || item.status === 'paymentConfirmed') && (

                                <div className='flex flex-row items-center gap-2 bg-white px-2 py-3 rounded-md mb-4'>

                                  {item.status === 'accepted' || item.status === 'paymentRequested' && (
                                    <Image
                                      src='/icon-trade.png'
                                      alt='Trade'
                                      width={32}
                                      height={32}
                                    />
                                  )}

                                  <p className=" text-xl font-semibold text-green-500 ">
                                    {TID}: {item.tradeId}
                                  </p>



                                  {item.status === 'paymentConfirmed' && (

                                    <div className='flex flex-row items-end gap-2'>
                                      <Image
                                        src='/confirmed.png'
                                        alt='Confirmed'
                                        width={80}
                                        height={12}
                                      />
                                    </div>

                                  )}

                                  
                                </div>

                              )}

                              {item.acceptedAt && (

                                <div className='flex flex-col items-start gap-2 mb-2'>



                                  <div className='hidden  flex-row items-center gap-2'>
                                
                                    {item.privateSale ? (
                                      <Image
                                        src='/icon-private-sale.png'
                                        alt='Private Sale'
                                        width={32}
                                        height={32}
                                      />
                                    ) : (
                                      <Image
                                        src='/icon-public-sale.png'
                                        alt='Public Sale'
                                        width={32}
                                        height={32}
                                      /> 
                                    )}
                                    <p className="text-sm text-zinc-400">
                                      

                                      {params.lang === 'ko' ? (

                                        <p className="text-sm text-zinc-400">


                                          {

                                            new Date().getTime() - new Date(item.createdAt).getTime() < 1000 * 60 ? (
                                              ' ' + Math.floor((new Date().getTime() - new Date(item.createdAt).getTime()) / 1000) + ' ' + seconds_ago
                                            ) :
                                            new Date().getTime() - new Date(item.createdAt).getTime() < 1000 * 60 * 60 ? (
                                            ' ' + Math.floor((new Date().getTime() - new Date(item.createdAt).getTime()) / 1000 / 60) + ' ' + minutes_ago
                                            ) : (
                                              ' ' + Math.floor((new Date().getTime() - new Date(item.createdAt).getTime()) / 1000 / 60 / 60) + ' ' + hours_ago
                                            )
                                          }{' '}{Order_Opened} 

                                        </p>

                                        ) : (

                                          <p className="text-sm text-zinc-400">



                                          {Order_Opened}{' '}{

                                            new Date().getTime() - new Date(item.createdAt).getTime() < 1000 * 60 ? (
                                              ' ' + Math.floor((new Date().getTime() - new Date(item.createdAt).getTime()) / 1000) + ' ' + seconds_ago
                                            ) :
                                            new Date().getTime() - new Date(item.createdAt).getTime() < 1000 * 60 * 60 ? (
                                            ' ' + Math.floor((new Date().getTime() - new Date(item.createdAt).getTime()) / 1000 / 60) + ' ' + minutes_ago
                                            ) : (
                                              ' ' + Math.floor((new Date().getTime() - new Date(item.createdAt).getTime()) / 1000 / 60 / 60) + ' ' + hours_ago
                                            )
                                          }



                                        </p>


                                      )}


                                    </p>

                                  </div>


                                  <div className='hidden flex-row items-center gap-2'>
                                    <div className={
                                      ` ml-4 mr-3 bg-green-500 w-1 h-[20px]
                                      rounded-full`
                                    }></div>

                                    {/* difference minutes between payment confirmed and trade started */}
                                    <div className='flex flex-row items-center gap-2'>

                                      <Image
                                        src='/timer.png'
                                        alt='Timer'
                                        width={32}
                                        height={32}
                                      />
                                      <div className="text-sm text-green-500">
                                        {
                                          ( (new Date(item.acceptedAt).getTime() - new Date(item.createdAt).getTime()) / 1000 / 60 ).toFixed(0)
                                        } {minutes}
                                      </div>
                                    </div>

                                  </div>


                                


                                  <div className='flex flex-row items-center gap-2'>

                                    <Image
                                      src='/icon-trade.png'
                                      alt='Trade'
                                      width={32}
                                      height={32}
                                    />

                                    <p className="text-sm text-zinc-400">


                                    {params.lang === 'ko' ? (

                                      <p className="ml-2 text-sm text-zinc-400">


                                        {new Date().getTime() - new Date(item.acceptedAt).getTime() < 1000 * 60 ? (
                                          ' ' + Math.floor((new Date().getTime() - new Date(item.acceptedAt).getTime()) / 1000) + ' ' + seconds_ago
                                        ) :
                                        new Date().getTime() - new Date(item.acceptedAt).getTime() < 1000 * 60 * 60 ? (
                                        ' ' + Math.floor((new Date().getTime() - new Date(item.acceptedAt).getTime()) / 1000 / 60) + ' ' + minutes_ago
                                        ) : (
                                          ' ' + Math.floor((new Date().getTime() - new Date(item.acceptedAt).getTime()) / 1000 / 60 / 60) + ' ' + hours_ago
                                        )
                                        }{' '}{Trade_Started}

                                      </p>



                                    ) : (

                                      <p className="ml-2 text-sm text-zinc-400">

                                        {Trade_Started} {
                                          new Date().getTime() - new Date(item.acceptedAt).getTime() < 1000 * 60 ? (
                                            ' ' + Math.floor((new Date().getTime() - new Date(item.acceptedAt).getTime()) / 1000) + ' ' + seconds_ago
                                          ) :
                                          new Date().getTime() - new Date(item.acceptedAt).getTime() < 1000 * 60 * 60 ? (
                                          ' ' + Math.floor((new Date().getTime() - new Date(item.acceptedAt).getTime()) / 1000 / 60) + ' ' + minutes_ago
                                          ) : (
                                            ' ' + Math.floor((new Date().getTime() - new Date(item.acceptedAt).getTime()) / 1000 / 60 / 60) + ' ' + hours_ago
                                          )
                                        }

                                      </p>

                                    )}
                                    
                                    
                                    </p>
                                  </div>

                                </div>

                              )}

                              {item.status === 'paymentConfirmed' && (

                                <div className='flex flex-col items-start gap-2 mb-4'>

                                  {/* vertical line of height for time between trade started  and payment confirmed */}

                                  <div className='flex flex-row items-center gap-2'>
                                    <div className={
                                      ` ml-4 mr-3 bg-green-500 w-1 h-[20px]
                                      rounded-full`
                                    }></div>

                                    {/* difference minutes between payment confirmed and trade started */}
                                    <div className='flex flex-row items-center gap-2'>

                                      <Image
                                        src='/timer.png'
                                        alt='Timer'
                                        width={32}
                                        height={32}
                                      />
                                      <div className="text-sm text-green-500">
                                        { ( (new Date(item.paymentConfirmedAt).getTime() - new Date(item.acceptedAt).getTime()) / 1000 / 60 ).toFixed(0) } {minutes}
                                      </div>
                                    </div>

                                  </div>

                                  <div className='flex flex-row items-center gap-2 mb-4'>
                                    

                                    <Image
                                      src='/icon-completed.png'
                                      alt='Completed'
                                      width={32}
                                      height={32}
                                    />
                                    <p className="text-sm text-green-500">
                                      {Completed_at} {new Date(item.paymentConfirmedAt).toLocaleDateString() + ' ' + new Date(item.paymentConfirmedAt).toLocaleTimeString()}
                                    </p>
                                  </div>

                                </div>



                              )}


                              <div className="mt-4 flex flex-col items-start">

                                <p className="text-2xl text-zinc-400">
                                  {Price}: {
                                    // currency
                                  
                                    Number(item.krwAmount)?.toLocaleString('ko-KR', {
                                      style: 'currency',
                                      currency: 'KRW',
                                    })

                                  }
                                </p>


                                <div className="mt-2 flex flex-row items-between space-x-2">


                                  <p className="text-lg font-semibold text-zinc-500">{item.usdtAmount} USDT</p>
                                  <p className="text-lg font-semibold text-zinc-500">{Rate}: {

                                    Number(item.krwAmount / item.usdtAmount).toFixed(2)

                                  }</p>
                                </div>

                              </div>


                            


                              {item.status === 'paymentConfirmed' && (
                                <div className="mt-4 flex flex-col items-start gap-2">
                                  <p className="mt-4 text-sm text-zinc-400">
                                    {Payment}: {item.seller?.bankInfo.bankName} {item.seller?.bankInfo.accountNumber} {item.seller?.bankInfo.accountHolder}
                                  </p> 
                                  <p className="text-sm text-zinc-400">
                                    {Deposit_Amount}: {item.krwAmount} KRW
                                  </p>
                                  <p className="text-sm text-zinc-400">
                                    {Deposit_Name}: {
                                      item.buyer?.depositName ? item.buyer?.depositName : item.tradeId
                                    }
                                  </p>                        

                                  {/* 판매자가 입급을 확인였습니다. */}

                                  <p className="mt-4 text-lg text-green-500">
                                    {Deposit_Confirmed}
                                  </p>
                                </div>
                              )}
                              

                          


                              {/* share button */}
                              {/*

                                <div className='flex flex-row items-center justify-end gap-2'>
                                  <button
                                      className="flex text-sm bg-blue-500 text-zinc-500 px-2 py-1 rounded-md"
                                      onClick={() => {
                                        
                                        //router.push(`/sell-usdt/${item._id}`);

                                        // copy link to clipboard
                                        navigator.clipboard.writeText(`https://gold.goodtether.com/${params.lang}/sell-usdt/${item._id}`);
                                        toast.success('Link has been copied');

                                      }}
                                  >
                                    <Image
                                      src="/icon-share.png"
                                      alt="Share"
                                      width={16}
                                      height={16}
                                      className='mr-2'
                                    />
                                    Share
                                  </button>
                                </div>
                                */}
                              



                              {/* waiting for escrow */}
                              {address && item.walletAddress !== address && item.status === 'accepted' && (
                                  <div className="mt-10 mb-10 flex flex-row gap-2 items-center justify-start">

                                    {/* rotate loading icon */}
                                  
                                    <Image
                                      src="/loading.png"
                                      alt="Escrow"
                                      width={32}
                                      height={32}
                                      className="animate-spin"
                                    />

                                    <span>
                                      {Waiting_for_seller_to_deposit}
                                      {' '}{item.usdtAmount} USDT
                                      {' '}{to_escrow}....
                                    </span>




                                  </div>

                              )}





                              {
                                address && item.walletAddress === address &&  item.status === 'accepted' && (

                                <div className="w-full mt-2 mb-2 flex flex-col items-start ">


                                {escrowing[index] && (

                                  <div className="flex flex-col gap-2">
                                    
                                    <div className="flex flex-row items-center gap-2">
                                      <Image
                                          src='/loading.png'
                                          alt='loading'
                                          width={32}
                                          height={32}
                                          className="animate-spin"
                                      />
                                      <div className="text-lg font-semibold text-zinc-500">
                                        Escrowing {item.usdtAmount} USDT...
                                      </div>
                                    </div>

                                  </div>

                                )}


                                {escrowing[index] === false && requestingPayment[index] === true && (
                                  <div className="flex flex-col gpa-2">
                                    {Escrow} {item.usdtAmount} USDT to the smart contract has been completed.
                                  </div>
                                )}


                                {requestingPayment[index] && (

                                  <div className="p-2 flex flex-col gap-2">
                                    
                                    <div className="flex flex-row items-center gap-2">
                                      <Image
                                          src='/loading.png'
                                          alt='loading'
                                          width={50}
                                          height={50}
                                          className="animate-spin"
                                      />
                                      <div className="text-lg font-semibold text-zinc-500">
                                        {Requesting_Payment}...
                                      </div>
                                    </div>

                                  </div>

                                )}


                                <div className="mt-5 flex flex-row items-center gap-2">
                                  {/* dot */}
                                  <div  className="w-2 h-2 rounded-full bg-green-500"></div>

                                  <div className="text-sm text-zinc-400">
                                    {/*
                                    If you request payment, the {item.usdtAmount} USDT will be escrowed to the smart contract and then the buyer ( {item?.buyer?.nickname} ) will be requested to pay.
                                    */}

                                    {If_you_request_payment}
                                  </div>
                                </div>

                                <div className="mt-5 flex flex-row items-center gap-2">
                                    
                                    <div className="flex flex-row items-center gap-2">
                                      <input
                                          type="checkbox"
                                          checked={requestPaymentCheck[index]}
                                          onChange={(e) => {
                                            setRequestPaymentCheck(
                                              requestPaymentCheck.map((item, idx) => {
                                                if (idx === index) {
                                                  return e.target.checked;
                                                }
                                                return item;
                                              })
                                            );
                                          }}
                                          className=" w-6 h-6 rounded-md border border-gray-200"
                                      />
                                    </div>
                                    <div className="text-sm text-zinc-400">
                                      {/*
                                      I agree to escrow {item.usdtAmount} USDT to the smart contract and request payment to the buyer ( {item?.buyer?.nickname} )
                                      */}

                                        {I_agree_to_escrow_USDT}

                                    </div>
                                </div>



                                <div className="mt-4 flex flex-col gap-2 text-sm text-left text-zinc-500">
                                  <div className='flex flex-row items-center gap-2'>
                                    {/* dot */}
                                    <div  className="w-2 h-2 rounded-full bg-green-500"></div>
                                    <span>
                                      {Bank_Transfer} {Deposit_Information}
                                    </span>
                                  </div>
                                  <ul>
                                    <li>
                                      {item.seller?.bankInfo.bankName}
                                      {' '}
                                      <button
                                        onClick={() => {
                                            navigator.clipboard.writeText(item.seller?.bankInfo.accountNumber);
                                            toast.success(Account_number_has_been_copied);
                                        } }
                                        className='text-lg font-semibold'
                                      >
                                        {item.seller?.bankInfo.accountNumber}
                                      </button>
                                      {' '}
                                      {item.seller?.bankInfo.accountHolder}
                                    </li>
                                    <li>{Deposit_Amount} : {item.krwAmount} KRW</li>
                                    <li>{Deposit_Name} : {
                                      item.buyer?.depositName ? item.buyer?.depositName : item.tradeId
                                    }</li>
                                  </ul>
                                </div>


                                <button
                                    disabled={
                                      balance < item.usdtAmount || requestingPayment[index] || escrowing[index]
                                      || !requestPaymentCheck[index]
                                    }
                                    className={`w-full text-lg
                                      ${balance < item.usdtAmount ? 'bg-red-500' : 'bg-blue-500'}

                                      ${requestPaymentCheck[index] ? 'bg-green-500' : 'bg-gray-500'}
                                      
                                    text-zinc-500 px-4 py-2 rounded-md mt-4`}

                                    onClick={() => {
                                        //console.log('request Payment');
                                        
                                        ///router.push(`/chat?tradeId=12345`);

                                        requstPayment(
                                          index,
                                          item._id,
                                          item.tradeId,
                                          item.usdtAmount,
                                        );

                                    }}
                                  >



                                  {balance < item.usdtAmount ? (

                                    <div className="flex flex-col gap-2">
                                      <div className="flex flex-row items-center gap-2">
                                        <GearSetupIcon />
                                        <div className="text-lg font-semibold">
                                        {Request_Payment}
                                        </div>
                                      </div>

                                      <div className="text-lg text-zinc-500">
                                        Insufficient Balance
                                      </div>
                                      <div className="text-lg text-zinc-500">
                                        You need {item.usdtAmount} USDT
                                      </div>
                                      <div className="text-lg text-zinc-500">
                                        You have {balance} USDT
                                      </div>
                                      <div className="text-lg text-zinc-500">
                                        Please top up your balance by depositing {item.usdtAmount - balance} USDT
                                      </div>
                                      <div className="text-lg text-zinc-500">
                                        Your wallet address is
                                      </div>
                                      <div className="text-xs text-zinc-500">
                                        {address.substring(0, 10)}...{address.substring(address.length - 10, address.length)}
                                        
                                      </div>
                                      <div className="text-xs text-zinc-500">
                                      
                                        <button
                                            onClick={() => {
                                                navigator.clipboard.writeText(address);
                                                toast.success('USDT지갑주소가 복사되었습니다.');
                                            }}
                                          className="text-xs bg-green-500 text-zinc-500 px-2 py-1 rounded-md">
                                          복사
                                        </button>
                                      </div>
                                    </div>

                                  ) : (

                                    <div className="flex flex-col gap-2">

                                      <div className="flex flex-row items-center gap-2">
                                        

                                        {requestingPayment[index] || escrowing[index] ? (
                                          <Image
                                            src='/loading.png'
                                            alt='loading'
                                            width={32}
                                            height={32}
                                            className="animate-spin"
                                          />
                                        ) : (
                                          <GearSetupIcon />
                                        )}


                                        <div className="text-lg font-semibold">
                                        {Request_Payment}
                                        </div>
                                      </div>


                                    </div>
                                  )}


                                </button>

                                </div>


                              )}


                              


                              {item.status === 'ordered' && (
                                <>

                                {acceptingSellOrder[index] ? (

                                  <div className="flex flex-row items-center gap-2">
                                    <Image
                                      src='/loading.png'
                                      alt='loading'
                                      width={38}
                                      height={38}
                                      className="animate-spin"
                                    />
                                    <div>Accepting...</div>
                                  </div>


                                ) : (
                                  <>
                                    
                                    {item.walletAddress === address ? (
                                      <div className="flex flex-col space-y-4">
                                        {My_Order}
                                      </div>
                                    ) : (
                                      <div className="w-full flex items-center justify-center">

                                        {item.status === 'ordered' && (
                                          
                                          // check if the order is expired
                                          new Date().getTime() - new Date(item.createdAt).getTime() > 1000 * 60 * 60 * 24

                                        ) ? (
                                          
                                          <Image
                                            src="/icon-expired.png"
                                            alt="Expired"
                                            width={80}
                                            height={80}
                                          />
                                        
                                        ) : (

                                          <div className='mt-4 flex flex-col items-center gap-2'>


                                            {/* agreement for trade */}
                                            <div className="flex flex-row items-center space-x-2">
                                              <input
                                                disabled={!address}
                                                type="checkbox"
                                                checked={agreementForTrade[index]}
                                                onChange={(e) => {
                                                    setAgreementForTrade(
                                                        sellOrders.map((item, idx) => {
                                                            if (idx === index) {
                                                                return e.target.checked;
                                                            } else {
                                                                return false;
                                                            }
                                                        })
                                                    );
                                                }}
                                              />
                                              <label className="text-sm text-zinc-400">
                                                {I_agree_to_the_terms_of_trade}
                                              </label>
                                            </div>



                                          
                                            <button
                                              disabled={!address || !agreementForTrade[index]}
                                              className={`text-lg text-zinc-500 px-4 py-2 rounded-md
                                              ${!user || !agreementForTrade[index] ? 'bg-zinc-800' : 'bg-green-500 hover:bg-green-600'}
                                              `}

                                              onClick={() => {

                                                  acceptSellOrder(index, item._id);
                                            

                                              }}
                                            >
                                              {Buy} {item.usdtAmount} USDT
                                            </button>



                                          </div>

                                        )}

                                      </div>



                                      )}

                                    </>

                                  )}

                                </>

                              )}



                              {/* bank transfer infomation */}
                              {item.status === 'paymentRequested' && (

                                <div className="mt-4 mb-10 flex flex-col items-start gap-2">

                                  {/* escrow infomation */}
                                  <div className='flex flex-row items-center gap-2'>

                                    <Image
                                      src='/smart-contract.png'
                                      alt='Escrow'
                                      width={32}
                                      height={32}
                                    />

                                    <div className="text-lg font-semibold text-green-500">
                                      {Escrow}: {item.usdtAmount} USDT
                                    </div>

                                    {/* polygon icon to go to polygon scan */}
                                    <button
                                      className="text-sm bg-green-500 text-zinc-500 px-2 py-1 rounded-md"
                                      onClick={() => {
                                        {
                                          window.open(`https://arbiscan.io/token/${contractAddress}?a=${item.walletAddress}`, '_blank')
                                        }
                                      }}
                                    >
                                      <Image
                                        src='/logo-arbitrum.png'
                                        alt="Chain"
                                        width={24}
                                        height={24}
                                      /> 
                                    </button>


                                  </div>


                                  <div className='flex flex-row items-center gap-2'>
                                    <Image
                                      src='/icon-bank.png'
                                      alt='Bank'
                                      width={32}
                                      height={32}
                                    />
                                    <div className="text-lg font-semibold text-green-500">
                                      {Bank_Transfer}
                                    </div>
                                    <span className="text-sm text-green-500">
                                      {When_the_deposit_is_completed}
                                    </span>
                                  </div>




                                  {address && (item.walletAddress === address || item.buyer?.walletAddress === address ) && (
                                    <>
                                      {/* bank transfer information 입금은행 */}
                                      <div className='mt-4 text-lg text-green-500 font-semibold'>
                                        입금은행
                                      </div>
                                      <div className='flex flex-row items-center justify-center gap-2'>
                                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                        <div className="text-sm ">
                                        {item.seller?.bankInfo.bankName}
                                        {' '}
                                        <button
                                          onClick={() => {
                                              navigator.clipboard.writeText(item.seller?.bankInfo.accountNumber);
                                              toast.success("계좌번호가 복사되었습니다.");
                                          } }
                                          className='text-lg font-semibold'
                                        >
                                          {item.seller?.bankInfo.accountNumber}
                                        </button>
                                        {' '}
                                        <button
                                          onClick={() => {
                                              navigator.clipboard.writeText(item.seller?.bankInfo.accountNumber);
                                              toast.success("계좌번호가 복사되었습니다.");
                                          } }
                                          className="text-xs bg-green-500 text-zinc-500 px-2 py-1 rounded-md"
                                        >
                                          복사
                                        </button>
                                        {' '}
                                        {item.seller?.bankInfo.accountHolder}
                                        </div>
                                      </div>


                                      <div className='flex flex-row items-center gap-2'>
                                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                        <div className="text-sm">
                                          {Deposit_Name}:{' '}
                                          <button
                                            onClick={() => {
                                                navigator.clipboard.writeText(item.buyer?.depositName ? item.buyer?.depositName : item.tradeId);
                                                toast.success(Payment_name_has_been_copied);
                                            } }
                                            className="text-lg font-semibold"
                                          >
                                            {item.buyer?.depositName ? item.buyer?.depositName : item.tradeId}
                                          </button>
                                          {' '}
                                          <button
                                            onClick={() => {
                                                navigator.clipboard.writeText(item.buyer?.depositName ? item.buyer?.depositName : item.tradeId);
                                                toast.success(Payment_name_has_been_copied);
                                            } }
                                            className="hidden text-xs bg-green-500 text-zinc-500 px-2 py-1 rounded-md"
                                          >
                                            복사
                                          </button>
                                        </div>
                                      </div>

                                      <div className='flex flex-row items-center gap-2'>
                                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                        <div className="text-sm">
                                          {Deposit_Amount}:{' '}

                                          <button
                                            onClick={() => {
                                                navigator.clipboard.writeText(item.krwAmount.toString());
                                                toast.success(Payment_amount_has_been_copied);
                                            } }
                                            className="text-lg font-semibold"
                                          >
                                            {item.krwAmount?.toLocaleString('ko-KR', {
                                                style: 'currency',
                                                currency: 'KRW'
                                              })
                                            }
                                          </button>
                                          {' '}
                                          <button
                                            onClick={() => {
                                                navigator.clipboard.writeText(item.krwAmount.toString());
                                                toast.success(Payment_amount_has_been_copied);
                                            } }
                                            className="hidden text-xs bg-green-500 text-zinc-500 px-2 py-1 rounded-md"
                                          >
                                            복사
                                          </button>
                                        </div>
                                      </div>

                                    </>

                                  )}




                                  <div className='flex flex-row items-center gap-2'>
                                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                    <div className="text-sm">
                                      {Deposit_Deadline}: {
                                      
                                        new Date(new Date(item.paymentRequestedAt).getTime() + 1000 * 60 * 60 * 1)?.toLocaleString()
                                      
                                      }
                                    </div>
                                  </div>


                                  {/* waiting for receive USDT */}

                                  {!address && (
                                
                                    <div className="mt-4 flex flex-row gap-2 items-center justify-start">

                                      {/* rotate loading icon */}
                                    
                                      <Image
                                        src="/loading.png"
                                        alt="Escrow"
                                        width={32}
                                        height={32}
                                        className="animate-spin"
                                      />

                                      <div>{Waiting_for_seller_to_confirm_payment}...</div>

                                    </div>
                                    
                                  )}  

                                </div>
                              )}








                              {address && item.walletAddress === address && item.status === 'paymentRequested' && (

                              <div className="w-full mt-4 mb-2 flex flex-col items-start ">


                                
                                
                                <div className="w-full flex flex-col items-start gap-2">

                                  {/*
                                  <div className="flex flex-row items-center gap-2">

                                    <Image
                                      src='/smart-contract.png'
                                      alt='smart-contract'
                                      width={32}
                                      height={32}
                                    />

                                    <span className="textlg text-zinc-500">
                                      Escrow: {item.usdtAmount} USDT
                                    </span>

                                    <button
                                        className="ml-5 text-sm bg-white text-zinc-500 px-2 py-1 rounded-md"
                                        onClick={() => {
                                            //console.log('Cancel Payment Request');
                                            // new window

                                            window.open(`https://arbiscan.io/token/0xc2132d05d31c914a87c6611c10748aeb04b58e8f?a=0x2111b6A49CbFf1C8Cc39d13250eF6bd4e1B59cF6`, '_blank');
                                        }}
                                    >
                                      <Image
                                        src='/logo-arbitrum.png'
                                        alt='cancel'
                                        width={20}
                                        height={20}
                                      />
                                    </button>


                                  </div>
                                  */}




                                
                                  { 
                                    item.status === 'paymentRequested'
                                    && requestingPayment[index]
                                    && confirmingPayment[index] === false
                                    && (

                                    <div className="flex flex-col gap-2">
                                      
                                      <div className="flex flex-row items-center gap-2">
                                        <Image
                                            src='/loading.png'
                                            alt='loading'
                                            width={32}
                                            height={32}
                                            className="animate-spin"
                                        />
                                        <div className="text-lg font-semibold text-zinc-500">
                                          
                                          {Checking_the_bank_transfer_from_the_buyer} ( {
                                            item?.buyer?.nickname ? item?.buyer?.nickname : Anonymous
                                          } )...


                                        </div>
                                      </div>

                                    </div>

                                  )}


                                  {/*
                                  <div className="mt-5 flex flex-row items-center gap-2">
                                    <div  className="flex w-2 h-2 rounded-full bg-green-500"></div>

                                    <div className="text-sm text-zinc-400">
                                      If you confirm the payment, the escrowed {item.usdtAmount} USDT will be transferred to the buyer ( {item?.buyer?.nickname} ) wallet address.
                                    </div>
                                  </div>
                                  */}

                                  {/* check box for confirming payment */}

                                  <div className="flex flex-row items-center gap-2">

                                    <div className="flex flex-row items-center gap-2">
                                      <input
                                          type="checkbox"
                                          checked={confirmPaymentCheck[index]}
                                          onChange={(e) => {
                                            setConfirmPaymentCheck(
                                              confirmPaymentCheck.map((item, idx) => {
                                                if (idx === index) {
                                                  return e.target.checked;
                                                }
                                                return item;
                                              })
                                            );
                                          }}
                                          className=" w-6 h-6 rounded-md border border-gray-200"
                                      />
                                    </div>

                                    <span className="text-sm text-zinc-400">
                                      {/*
                                      I agree to check the bank transfer of {
                                      item.krwAmount?.toLocaleString('ko-KR', {
                                        style: 'currency',
                                        currency: 'KRW',
                                      })} from buyer ( {item?.buyer?.nickname} ) and transfer {item.usdtAmount} USDT to the buyer wallet address.
                                      */}



                                      {I_agree_to_check_the_bank_transfer_of}


                                    </span>

                                  </div>




                                </div>
                                  


                                {confirmingPayment[index] ? (

                                  <div className="p-2 flex flex-row items-center gap-2">

                                    <Image
                                        src='/loading.png'
                                        alt='loading'
                                        width={32}
                                        height={32}
                                        className="animate-spin"
                                    />
                                    <div className="text-lg font-semibold text-zinc-500">

                                      {/*
                                      Transfering {item.usdtAmount} USDT to the buyer ( {item?.buyer?.nickname} ) wallet address...
                                      */}
                                      {Transfering_USDT_to_the_buyer_wallet_address}...
                                  
                                    </div>
                                  </div>

                                ) : (

                                    <button
                                        disabled={
                                          confirmingPayment[index]
                                          || !confirmPaymentCheck[index]
                                      }
                                        className={`w-full text-lg
                                          ${confirmPaymentCheck[index] ? 'bg-green-500' : 'bg-gray-500'}
                                          text-zinc-500 px-4 py-2 rounded-md mt-4`}
                                        onClick={() => {
                                            console.log('Canfirm Payment');

                                            //toast.success('Payment has been confirmed');

                                            confirmPayment(index, item._id);
                                            
                                        }}
                                    >
                                      {Confirm_Payment}
                                    </button>
                                  
                                  )}


                              </div>


                              )}


                              {/* buyer mobile number */}
                              {/*address && item.buyer?.walletAddress === address && (
                                <div className="mt-4 flex flex-row items-center gap-2">
                                  <div className="text-lg font-semibold text-green-500">
                                    SMS: {item.buyer?.mobile}
                                  </div>
                                </div>
                              )*/}


                          </article>


                        </div>







                      
                      </div>


                    ))}

                </div>




              </div>
            )}



          {/*
          📌 필독 안내사항
              1.	대행 신청 전 유의사항을 반드시 확인해 주세요.
            신청 전 안내된 내용을 충분히 숙지하지 않아 발생하는 모든 문제는 회원 본인의 책임이며, 당사는 이에 대해 책임지지 않습니다.
              2.	코인 전송 완료 후에는 취소 및 환불이 불가능합니다.
            대행 신청 완료 후 진행된 코인 거래는 어떤 경우에도 취소나 환불이 불가하오니 신중히 진행해 주세요.
              3.	최근 코인 거래 관련 사기가 빈번하게 발생하고 있습니다.
            구매 및 판매 시 반드시 신원과 거래 내용을 철저히 확인하신 후 진행해 주시기 바랍니다.
            ※ 대행 신청 후 사고 발생 시 당사는 도움을 드릴 수 없습니다.
              4.	불법 자금 거래 및 금융사기 방지를 위해 최선을 다하고 있습니다.
            의심스러운 거래로 판단될 경우, 회원 본인에게 신분증, 통장 사본, 거래 내역, 이체 확인증 등의 추가 인증을 요청드릴 수 있습니다.
              5.	잘못된 정보 입력 시 거래에 문제가 발생할 수 있습니다.
            모든 정보를 정확히 기입해 주시고, 신청 전 다시 한 번 확인 부탁드립니다.
              6.	영업시간: 연중무휴 24시간 운영
            언제든지 문의 및 이용이 가능합니다.
            */}


          <div className="w-full flex flex-col items-center justify-center mt-10 mb-10
            bg-white shadow-lg rounded-lg p-6
            border border-gray-200
            ">
            <p className="text-sm text-zinc-500 font-semibold">
            📌 필독 안내사항
            </p>
            <div className='flex flex-col items-start justify-start mt-2'>
              <ul className="list-disc list-inside text-sm text-zinc-500 font-semibold">
                <li>대행 신청 전 유의사항을 반드시 확인해 주세요. 신청 전 안내된 내용을 충분히 숙지하지 않아 발생하는 모든 문제는 회원 본인의 책임이며, 당사는 이에 대해 책임지지 않습니다.</li>
                <li>코인 전송 완료 후에는 취소 및 환불이 불가능합니다. 대행 신청 완료 후 진행된 코인 거래는 어떤 경우에도 취소나 환불이 불가하오니 신중히 진행해 주세요.</li>
                <li>최근 코인 거래 관련 사기가 빈번하게 발생하고 있습니다. 구매 및 판매 시 반드시 신원과 거래 내용을 철저히 확인하신 후 진행해 주시기 바랍니다. ※ 대행 신청 후 사고 발생 시 당사는 도움을 드릴 수 없습니다.</li>
                <li>불법 자금 거래 및 금융사기 방지를 위해 최선을 다하고 있습니다. 의심스러운 거래로 판단될 경우, 회원 본인에게 신분증, 통장 사본, 거래 내역, 이체 확인증 등의 추가 인증을 요청드릴 수 있습니다.</li>
                <li>잘못된 정보 입력 시 거래에 문제가 발생할 수 있습니다. 모든 정보를 정확히 기입해 주시고, 신청 전 다시 한 번 확인 부탁드립니다.</li>
                <li>영업시간: 연중무휴 24시간 운영 언제든지 문의 및 이용이 가능합니다.</li>
              </ul>
            </div>
          </div>
            



          
      </div>


      {/* footer */}
      {/* 이용약관 / 개인정보처리방침 / 고객센터 */}
      <div className="
        w-full
        flex flex-col items-center justify-center mt-10 mb-10
        bg-white shadow-lg rounded-lg p-6
        border border-gray-200
        ">
        <div className="flex flex-row items-center justify-center gap-2">
          <a
            href="#"
            className="text-sm text-zinc-500 hover:text-blue-500"
          >
            이용약관
          </a>
          <span className="text-sm text-zinc-500">|</span>
          <a
            href="#"
            className="text-sm text-zinc-500 hover:text-blue-500"
          >
            개인정보처리방침
          </a>
          <span className="text-sm text-zinc-500">|</span>
          <a
            href="#"
            className="text-sm text-zinc-500 hover:text-blue-500"
          >
            고객센터
          </a>
        </div>
        <div className="text-sm text-zinc-500 mt-2">
          © 2023 Iskan9. All rights reserved.
        </div>

      </div>




        <Modal isOpen={isModalOpen} onClose={closeModal}>
            <TradeDetail
                closeModal={closeModal}
                //goChat={goChat}
            />
        </Modal>

            

    </main>

  );


};






// close modal

const TradeDetail = (
    {
        closeModal = () => {},
        goChat = () => {},
        
    }
) => {


    const [amount, setAmount] = useState(1000);
    const price = 91.17; // example price
    const receiveAmount = (amount / price).toFixed(2);
    const commission = 0.01; // example commission
  
    return (

      <div className="max-w-2xl mx-auto bg-white shadow-lg rounded-lg p-6">
        <div className="flex items-center">
          <span className="inline-block w-4 h-4 rounded-full bg-green-500 mr-2"></span>
          <h2 className="text-lg font-semibold text-black ">Iskan9</h2>
          <span className="ml-2 text-blue-500 text-sm">318 trades</span>
        </div>
        <p className="text-gray-600 mt-2">The offer is taken from another source. You can only use chat if the trade is open.</p>
        
        <div className="mt-4">
          <div className="flex justify-between text-gray-700">
            <span>Price</span>
            <span>{price} KRW</span>
          </div>
          <div className="flex justify-between text-gray-700 mt-2">
            <span>Limit</span>
            <span>40680.00 KRW - 99002.9 KRW</span>
          </div>
          <div className="flex justify-between text-gray-700 mt-2">
            <span>Available</span>
            <span>1085.91 USDT</span>
          </div>
          <div className="flex justify-between text-gray-700 mt-2">
            <span>Seller&apos;s payment method</span>
            <span className="bg-yellow-100 text-yellow-800 px-2 rounded-full">Tinkoff</span>
          </div>
          <div className="mt-4 text-gray-700">
            <p>24/7</p>
          </div>
        </div>
  
        <div className="mt-6 border-t pt-4 text-gray-700">
          <div className="flex flex-col space-y-4">
            <div>
              <label className="block text-gray-700">I want to pay</label>
              <input 
                type="number"
                value={amount}
                onChange={(e) => setAmount(
                    e.target.value === '' ? 0 : parseInt(e.target.value)
                ) }

                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-gray-700">I will receive</label>
              <input 
                type="text"
                value={`${receiveAmount} USDT`}
                readOnly
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-gray-700">Commission</label>
              <input 
                type="text"
                value={`${commission} USDT`}
                readOnly
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
          </div>
          
          <div className="mt-6 flex space-x-4">
            <button
                className="bg-green-500 text-zinc-500 px-4 py-2 rounded-lg"
                onClick={() => {
                    console.log('Buy USDT');
                    // go to chat
                    // close modal
                    closeModal();
                    goChat();

                }}
            >
                Buy USDT
            </button>
            <button
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg"
                onClick={() => {
                    console.log('Cancel');
                    // close modal
                    closeModal();
                }}
            >
                Cancel
            </button>
          </div>

        </div>


      </div>
    );
  };


