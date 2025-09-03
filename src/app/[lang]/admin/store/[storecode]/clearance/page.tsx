'use client';

import { useState, useEffect, use } from "react";



import { toast } from 'react-hot-toast';

import { client } from "../../../../../client";

import {
    getContract,
    sendAndConfirmTransaction,
} from "thirdweb";


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
  getWalletBalance,
} from "thirdweb/wallets";


import { getUserPhoneNumber } from "thirdweb/wallets/in-app";


import Image from 'next/image';

import GearSetupIcon from "@/components/gearSetupIcon";


import Uploader from '@/components/uploader';

import { balanceOf, transfer } from "thirdweb/extensions/erc20";
 






// open modal

import Modal from '@/components/modal';

import {
  useRouter,
  useSearchParams,
}from "next//navigation";



import { getDictionary } from "../../../../../dictionaries";


interface BuyOrder {
  _id: string;
  createdAt: string;
  walletAddress: string;
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



  seller: any;

  tradeId: string;
  status: string;
  acceptedAt: string;
  paymentRequestedAt: string;
  paymentConfirmedAt: string;
  cancelledAt: string;


  buyer: any;

  canceller: string;

  escrowTransactionHash: string;
  transactionHash: string;

  storecode: string;
  store: any;

  settlement: any;

  paymentAmount: number;

  autoConfirmPayment: boolean;

  privateSale: boolean;
}



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


export default function Index({ params }: any) {

  //console.log('params', params);

  const searchParams = useSearchParams();
 
  const wallet = searchParams.get('wallet');

  const storecode = params?.center;

  console.log("storecode", storecode);

  const contract = getContract({
    // the client you have created via `createThirdwebClient()`
    client,
    // the chain the contract is deployed on
    
    
    //chain: arbitrum,
    chain:  chain === "ethereum" ? ethereum :
            chain === "polygon" ? polygon :
            chain === "arbitrum" ? arbitrum :
            chain === "bsc" ? bsc : arbitrum,
  
  
  
    // the contract's address
    ///address: contractAddressArbitrum,

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
    chain: chain === "ethereum" ? ethereum :
           chain === "polygon" ? polygon :
           chain === "arbitrum" ? arbitrum :
           chain === "bsc" ? bsc : arbitrum,

    // the contract's address
    address: chain === "ethereum" ? bscContractAddressMKRW :
            chain === "polygon" ? bscContractAddressMKRW :
            chain === "arbitrum" ? bscContractAddressMKRW :
            chain === "bsc" ? bscContractAddressMKRW : bscContractAddressMKRW,

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

    Order: "",
    Buy: "",
    Sell: "",
    Amount: "",
    Price: "",
    Total: "",
    Orders: "",
    Trades: "",
    Search_my_trades: "",

    Seller: "",
    Buyer: "",
    Me: "",

    Buy_USDT: "",
    Sell_USDT: "",  
    Rate: "",
    Payment: "",
    Bank_Transfer: "",

    I_agree_to_the_terms_of_trade: "",
    I_agree_to_cancel_the_trade: "",

    Opened_at: "",
    Cancelled_at: "",
    Completed_at: "",

    Waiting_for_seller_to_deposit: "",

    to_escrow: "",
    If_the_seller_does_not_deposit_the_USDT_to_escrow: "",
    this_trade_will_be_cancelled_in: "",

    Cancel_My_Trade: "",


    Order_accepted_successfully: "",
    Order_has_been_cancelled: "",
    My_Order: "",

    Sale: "",
    Private_Sale: "",

    Place_Order: "",

    Search_my_orders: "",

    Go_Sell_USDT: "",

    Cancel_My_Order: "",


    Order_has_been_placed: "",


    Placing_Order: "",

    hours_ago: "",
    minutes_ago: "",
    seconds_ago: "",

    SMS_will_be_sent_to_your_mobile_number: "",

    Profile : "",
    My_Profile_Picture : "",

    Edit : "",

    Escrow: "",

    TID: "",

    Chat_with_Buyer: "",

    Table_View: "",
    Started_at: "",
    Trading_Time_is: "",
    Memo: "",
    Buy_Amount: "",
    Status: "",
    Payment_Amount: "",

    hours: "",
    minutes: "",
    seconds: "",

    Opened: "",
    Completed: "",
    Cancelled: "",

    Deposit_Name: "",

    Request_Payment: "",

    Waiting_for_seller_to_confirm_payment: "",

    Confirm_Payment: "",

    Escrow_Completed: "",

    Payment_request_has_been_sent: "",

    Payment_has_been_confirmed: "",

    Reload: "",

    Insufficient_balance: "",


    Private_Buy_Order: "",

    Buy_Order_USDT: "",

    Buy_Order_SMS_will_be_sent_to_your_mobile_number: "",

    Buy_Orders: "",

    My_Balance: "",

    Anonymous: "",

    Copied_Wallet_Address: "",

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

    Order,
    Buy,
    Sell,
    Amount,
    Price,
    Total,
    Orders,
    Trades,
    Search_my_trades,
    Seller,
    Buyer,
    Me,

    Buy_USDT,
    Sell_USDT,
    Rate,
    Payment,
    Bank_Transfer,
    I_agree_to_the_terms_of_trade,
    I_agree_to_cancel_the_trade,

    Opened_at,
    Cancelled_at,
    Completed_at,

    Waiting_for_seller_to_deposit,

    to_escrow,

    If_the_seller_does_not_deposit_the_USDT_to_escrow,
    this_trade_will_be_cancelled_in,

    Cancel_My_Trade,

    Order_accepted_successfully,
    Order_has_been_cancelled,
    My_Order,

    Sale,
    Private_Sale,

    Place_Order,

    Search_my_orders,

    Go_Sell_USDT,

    Cancel_My_Order,

    Order_has_been_placed,

    Placing_Order,

    hours_ago,
    minutes_ago,
    seconds_ago,

    SMS_will_be_sent_to_your_mobile_number,

    Profile,
    My_Profile_Picture,

    Edit,

    Escrow,

    TID,

    Chat_with_Buyer,

    Table_View,
    Started_at,
    Trading_Time_is,
    Memo,
    Buy_Amount,
    Status,
    Payment_Amount,

    hours,
    minutes,
    seconds,

    Opened,
    Completed,
    Cancelled,

    Deposit_Name,

    Request_Payment,

    
    Waiting_for_seller_to_confirm_payment,

    Confirm_Payment,

    Escrow_Completed,

    Payment_request_has_been_sent,

    Payment_has_been_confirmed,

    Reload,

    Insufficient_balance,

    Private_Buy_Order,

    Buy_Order_USDT,

    Buy_Order_SMS_will_be_sent_to_your_mobile_number,

    Buy_Orders,

    My_Balance,

    Anonymous,

    Copied_Wallet_Address,

  } = data;






    const router = useRouter();

    const activeAccount = useActiveAccount();

    const address = activeAccount?.address;
  
  


    const [rate, setRate] = useState(1380);


    /*
    const [usdtPrice, setUsdtPrice] = useState(0);
    useEffect(() => {

        if (!address) {
            return;
        }

        const fetchData = async () => {

            const response = await fetch("/api/order/getPrice", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    walletAddress: "0x91CA2566C3345026647aBbACB56093144eAA4c16",
                }),
            });

            const data = await response.json();

            ///console.log("getPrice data", data);

            if (data.result) {
                setUsdtPrice(data.result.usdtPrice);

                setRate(data.result.usdtPrice);
            }

        };

        fetchData();
    }

    , []);
    */






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


    



    const [nativeBalance, setNativeBalance] = useState(0);
    const [balance, setBalance] = useState(0);
    useEffect(() => {
  
      // get the balance
      const getBalance = async () => {
  
        ///console.log('getBalance address', address);
        if (!address) {
          setBalance(0);
          return;
        }
  
        try {
          const result = await balanceOf({
            contract,
            address: address || "",
          });
    
      
          if (chain === 'bsc') {
            setBalance( Number(result) / 10 ** 18 );
          } else {
            setBalance( Number(result) / 10 ** 6 );
          }



        } catch (error) {
          console.error('Error:', error);
          setBalance(0);
        }
    
  

        // getWalletBalance
        const result = await getWalletBalance({
          address: address,
          client: client,
          chain: chain === "ethereum" ? ethereum :
                 chain === "polygon" ? polygon :
                 chain === "arbitrum" ? arbitrum :
                 chain === "bsc" ? bsc : arbitrum,
        });
        //console.log("getWalletBalance", result);
        /*
        {value: 193243898588330546n, decimals: 18, displayValue: '0.193243898588330546', symbol: 'ETH', name: 'ETH'}
        */
        if (result) {
          setNativeBalance(Number(result.value) / 10 ** result.decimals);
        }
  
  
  
      };
  
      if (address) getBalance();
  
      const interval = setInterval(() => {
        if (address) getBalance();
      } , 5000);
  
      return () => clearInterval(interval);
  
    } , [address, contract]);
  
  
  
    const [escrowWalletAddress, setEscrowWalletAddress] = useState('');




    const [nickname, setNickname] = useState("");
    const [avatar, setAvatar] = useState("/icon-user.png");
    const [userCode, setUserCode] = useState("");
  
  
    const [user, setUser] = useState<any>(null);


    const [seller, setSeller] = useState(null) as any;
  

    const [loadingUser, setLoadingUser] = useState(true);

    useEffect(() => {
        const fetchData = async () => {

            if (!address) {
                return;
            }
            setLoadingUser(true);

            const response = await fetch("/api/user/getUser", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    storecode: "admin",
                    walletAddress: address,
                }),
            });

            if (!response.ok) {
                console.error("Error fetching user data");
                setLoadingUser(false);
                return;
              
            }
  
            const data = await response.json();
  
            //console.log("data", data);
  
            if (data.result) {
                setLoadingUser(false);
                setNickname(data.result.nickname);
                data.result.avatar && setAvatar(data.result.avatar);
                setUserCode(data.result.id);

                setUser(data.result);
  
                setSeller(data.result.seller);
  
            }
        };
  
        fetchData();
  
    }, [address]);


    const [totalClearanceCount, setTotalClearanceCount] = useState(0);
    const [totalClearanceAmount, setTotalClearanceAmount] = useState(0);
    const [totalClearanceAmountKRW, setTotalClearanceAmountKRW] = useState(0);

    const [totalCount, setTotalCount] = useState(0);
    const [buyOrders, setBuyOrders] = useState<BuyOrder[]>([]);

    const [searchMyOrders, setSearchMyOrders] = useState(false);


    const [limitValue, setLimitValue] = useState(20);
    useEffect(() => {
      const limit = searchParams.get('limit') || 20;
      setLimitValue(Number(limit));
    }, [searchParams]);



    const [pageValue, setPageValue] = useState(1);
    useEffect(() => {
      const page = searchParams.get('page') || 1;
      setPageValue(Number(page));
    }, [searchParams]);



    const today = new Date();
    today.setHours(today.getHours() + 9); // Adjust for Korean timezone (UTC+9)
    const formattedDate = today.toISOString().split('T')[0]; // YYYY-MM-DD format

    // search form date to date
    const [searchFromDate, setSearchFormDate] = useState(formattedDate);
    const [searchToDate, setSearchToDate] = useState(formattedDate);






    const [loadingFetchBuyOrders, setLoadingFetchBuyOrders] = useState(false);

    const fetchBuyOrders = async () => {

      if (!address) {
        return;
      }

      setLoadingFetchBuyOrders(true);

      // api call
      //const response = await fetch('/api/order/getAllBuyOrders', {
      const response = await fetch('/api/order/getAllCollectOrdersForSeller', {


        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          lang: params.lang,
          storecode: params.storecode,
          limit: Number(limitValue),
          page: Number(pageValue),
          walletAddress: address,
          searchMyOrders: searchMyOrders,
          privateSale: true,
          fromDate: searchFromDate,
          toDate: searchToDate,
        })
      });

      const data = await response.json();

      
      //console.log('data', data);



      if (data.result) {
        setBuyOrders(data.result.orders);
        setTotalCount(data.result.totalCount);

        setTotalClearanceCount(data.result.totalClearanceCount);
        setTotalClearanceAmount(data.result.totalClearanceAmount);
        setTotalClearanceAmountKRW(data.result.totalClearanceAmountKRW);
        

      }

      setLoadingFetchBuyOrders(false);

    };




    useEffect(() => {

        
        if (!address) {
          return;
        }
        
        

  
        fetchBuyOrders();

        // fetch sell orders every 10 seconds
      
        const interval = setInterval(() => {
          fetchBuyOrders();
        }, 10000);

        return () => clearInterval(interval);


    }, [address, searchMyOrders, params.lang, params.storecode, limitValue, pageValue, searchFromDate, searchToDate]);





    const [isModalOpen, setModalOpen] = useState(false);

    const closeModal = () => setModalOpen(false);
    const openModal = () => setModalOpen(true);

    const goChat = () => {
        console.log('Go Chat');
        router.push(`/chat?tradeId=12345`);
    }


    const [usdtAmount, setUsdtAmount] = useState(0);

    const [defaultKrWAmount, setDefaultKrwAmount] = useState(0);

    const [krwAmount, setKrwAmount] = useState(0);

    console.log('usdtAmount', usdtAmount);


 

    useEffect(() => {

      if (usdtAmount === 0) {

        setDefaultKrwAmount(0);

        setKrwAmount(0);

        return;
      }
    
        
      setDefaultKrwAmount( Math.round(usdtAmount * rate) );


      setKrwAmount( Math.round(usdtAmount * rate) );

    } , [usdtAmount, rate]);









    const [privateBuyOrder, setprivateBuyOrder] = useState(true);


    const [buyOrdering, setBuyOrdering] = useState(false);

    const [agreementPlaceOrder, setAgreementPlaceOrder] = useState(false);


    // check input krw amount at sell order
    const [checkInputKrwAmount, setCheckInputKrwAmount] = useState(true);

    const buyOrder = async () => {
      // api call
      // set sell order

      if (buyOrdering) {
        return;
      }



      


      if (agreementPlaceOrder === false) {
        toast.error('You must agree to the terms and conditions');
        return;
      }


      setBuyOrdering(true);


      let orderUsdtAmount = usdtAmount;

      if (checkInputKrwAmount) {
        orderUsdtAmount = parseFloat(Number(krwAmount / rate).toFixed(2));
      }
      

      const response = await fetch('/api/order/setBuyOrderForClearance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },

        /*
        body: JSON.stringify({
          lang: params.lang,
          chain: params.storecode,
          walletAddress: address,
          usdtAmount: orderUsdtAmount,
          krwAmount: krwAmount,
          rate: rate,
          privateSale: privateBuyOrder,
        })
        */


        body: JSON.stringify({
          lang: params.lang,
          
          
          ////////////////////////////////////storecode: params.storecode,

          storecode: params.storecode,



          walletAddress: address,



          nickname: nickname,
          //storecode: storecode,
          usdtAmount: orderUsdtAmount,
          krwAmount: krwAmount,
          rate: rate,
          privateSale: true,
          buyer: {
            depositBankName: "",
            depositName: "",
          }
        })




      });

      console.log('buyOrder response', response);

      if (!response.ok) {
        setBuyOrdering(false);
        toast.error('주문을 처리하는 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
        return;
      }




      const data = await response.json();

      //console.log('data', data);

      if (data.result) {

        toast.success(
          Order_has_been_placed
        );

        setUsdtAmount(0);
        setprivateBuyOrder(false);

        setAgreementPlaceOrder(false);
     


        //await fetch('/api/order/getAllBuyOrders', {
        await fetch('/api/order/getAllCollectOrdersForSeller', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            lang: params.lang,
            limit: Number(limitValue),
            page: Number(pageValue),
            storecode: params.storecode,
            //storecode: "admin",

            walletAddress: address,
            searchMyOrders: searchMyOrders,

            privateSale: true,
            fromDate: searchFromDate,
            toDate: searchToDate

          })
        }).then(async (response) => {
          const data = await response.json();
          //console.log('data', data);
          if (data.result) {
            setBuyOrders(data.result.orders);
            setTotalCount(data.result.totalCount);

            setTotalClearanceCount(data.result.totalClearanceCount);
            setTotalClearanceAmount(data.result.totalClearanceAmount);
            setTotalClearanceAmountKRW(data.result.totalClearanceAmountKRW);

          }
        });


  


      } else {
        toast.error('Order has been failed');
      }

      setBuyOrdering(false);

      

    };




    
    /*
    const [cancellings, setCancellings] = useState([] as boolean[]);
    useEffect(() => {
      setCancellings(buyOrders.map(() => false));
    }, [buyOrders]);



    const cancelBuyOrder = async (orderId: string, index: number) => {

      if (cancellings[index]) {
        return;
      }

      setCancellings(cancellings.map((item, i) => i === index ? true : item));

      const response = await fetch('/api/order/cancelBuyOrder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          orderId: orderId,
          walletAddress: address
        })
      });

      const data = await response.json();

      ///console.log('data', data);

      if (data.result) {
        toast.success(Order_has_been_cancelled);


        fetchBuyOrders();


      } else {
        toast.error('Order has been failed');
      }

      setCancellings(cancellings.map((item, i) => i === index ? false : item));

    }
    */










    // cancel buy order state
    const [cancellings, setCancellings] = useState([] as boolean[]);
    useEffect(() => {
      setCancellings(
        buyOrders.map(() => false)
      );
    }, [buyOrders]);



    const cancelTrade = async (orderId: string, index: number) => {



      if (cancellings[index]) {
        return;
      }



      setCancellings(cancellings.map((item, i) => i === index ? true : item));

      //const response = await fetch('/api/order/cancelTradeByBuyer', {

      const response = await fetch('/api/order/cancelTradeBySeller', {

        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          orderId: orderId,
          storecode: params.storecode,
          walletAddress: address,
          cancelTradeReason: "cancelled by seller",
        })
      });

      const data = await response.json();

      ///console.log('data', data);

      if (data.result) {
        toast.success(Order_has_been_cancelled);

        //await fetch('/api/order/getAllBuyOrders', {
        await fetch('/api/order/getAllCollectOrdersForSeller', {

          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            body: JSON.stringify({
              lang: params.lang,
              limit: Number(limitValue),
              page: Number(pageValue),
              storecode: params.storecode,
              //storecode: "admin",
              walletAddress: address,
              searchMyOrders: searchMyOrders,
              privateSale: true,
              fromDate: searchFromDate,
              toDate: searchToDate
        })
          })
        }).then(async (response) => {
          const data = await response.json();
          //console.log('data', data);
          if (data.result) {
            setBuyOrders(data.result.orders);
            setTotalCount(data.result.totalCount);
            setTotalClearanceCount(data.result.totalClearanceCount);
            setTotalClearanceAmount(data.result.totalClearanceAmount);
            setTotalClearanceAmountKRW(data.result.totalClearanceAmountKRW);
          }
        });

      } else {
        toast.error('실패했습니다. 잠시 후 다시 시도해주세요.');
      }

      setCancellings(cancellings.map((item, i) => i === index ? false : item));

    }










    // request payment check box
    const [requestPaymentCheck, setRequestPaymentCheck] = useState([] as boolean[]);
    useEffect(() => {
        
        setRequestPaymentCheck(
          new Array(buyOrders.length).fill(false)
        );
  
    } , [buyOrders]);
    




    // array of escrowing
    const [escrowing, setEscrowing] = useState([] as boolean[]);

    useEffect(() => {
        
        setEscrowing(
          new Array(buyOrders.length).fill(false)
        );
  
    } , [buyOrders]);





    // array of requestingPayment
    const [requestingPayment, setRequestingPayment] = useState([] as boolean[]);

    useEffect(() => {

      setRequestingPayment(

        new Array(buyOrders.length).fill(false)

      );

    } , [buyOrders]);





  // array of confirmingPayment

  const [confirmingPayment, setConfirmingPayment] = useState([] as boolean[]);

  useEffect(() => {
      
      setConfirmingPayment(
        new Array(buyOrders.length).fill(false)
      );

  } , [buyOrders]);



  // confirm payment check box
  const [confirmPaymentCheck, setConfirmPaymentCheck] = useState([] as boolean[]);
  useEffect(() => {
      
      setConfirmPaymentCheck(
        new Array(buyOrders.length).fill(false)
      );

  } , [buyOrders]);





  // payment amoount array
  const [paymentAmounts, setPaymentAmounts] = useState([] as number[]);
  useEffect(() => {

    // default payment amount is from buyOrders krwAmount
      
    setPaymentAmounts(
      buyOrders.map((item) => item.krwAmount)
      );

  } , [buyOrders]);



  const confirmPayment = async (

    index: number,
    orderId: string,
    paymentAmount: number,

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
        chain: params.storecode,
        orderId: orderId,
        paymentAmount: paymentAmount,
      })
    });

    const data = await response.json();

    //console.log('data', data);

    if (data.result) {
      
      fetchBuyOrders();

      toast.success(Payment_has_been_confirmed);

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








  // buyOrderDepositCompleted
  const [loadingDeposit, setLoadingDeposit] = useState([] as boolean[]);
  for (let i = 0; i < 100; i++) {
    loadingDeposit.push(false);
  }

  const buyOrderDepositCompleted = async (index: number, orderId: string) => {
    // call API to set deposit completed
    // update the state to reflect the change

    if (loadingDeposit[index]) {
      return;
    }

    setLoadingDeposit(
      loadingDeposit.map((item, idx) => idx === index ? true : item)
    );



    const response = await fetch('/api/order/buyOrderDepositCompleted', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        orderId: orderId,
        walletAddress: address,
      }),
    });
    

    setLoadingDeposit(
      loadingDeposit.map((item, idx) => idx === index ? false : item)
    );


    //await fetch('/api/order/getAllBuyOrders', {
    await fetch('/api/order/getAllCollectOrdersForSeller', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        lang: params.lang,
        limit: Number(limitValue),
        page: Number(pageValue),
        storecode: params.storecode,
        walletAddress: address,
        searchMyOrders: searchMyOrders,
        privateSale: true,
        fromDate: searchFromDate,
        toDate: searchToDate,

      })
    }).then(async (response) => {
      const data = await response.json();
      //console.log('data', data);
      if (data.result) {
        setBuyOrders(data.result.orders);
        setTotalCount(data.result.totalCount);
        setTotalClearanceCount(data.result.totalClearanceCount);
        setTotalClearanceAmount(data.result.totalClearanceAmount);
        setTotalClearanceAmountKRW(data.result.totalClearanceAmountKRW);
      }
    });


  }











    // check table view or card view
    const [tableView, setTableView] = useState(true);



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
            storecode: params.storecode,
            }
        ),
        });
        if (!response.ok) {
        setFetchingStore(false);
        return;
        }
        const data = await response.json();
        
        //console.log('getAllUsersByStorecode data', data);

        setStore(data.result);
        setFetchingStore(false);

        return data.result;
    }

    useEffect(() => {

        fetchStore();
    } , [params.storecode]);










    const [tradeSummary, setTradeSummary] = useState({
      totalCount: 0,
      totalKrwAmount: 0,
      totalUsdtAmount: 0,
      totalSettlementCount: 0,
      totalSettlementAmount: 0,
      totalSettlementAmountKRW: 0,
      totalFeeAmount: 0,
      totalFeeAmountKRW: 0,
      orders: [] as BuyOrder[],

      totalClearanceCount: 0,
      totalClearanceAmount: 0,
      totalClearanceAmountUSDT: 0,
    });
    const [loadingTradeSummary, setLoadingTradeSummary] = useState(false);


    const getTradeSummary = async () => {
      if (!address) {
        return;
      }
      setLoadingTradeSummary(true);
      const response = await fetch('/api/summary/getTradeSummary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          storecode: params.storecode,
          walletAddress: address,
          searchMyOrders: searchMyOrders,
          searchOrderStatusCompleted: true,
          //searchBuyer: searchBuyer,
          //searchDepositName: searchDepositName,

          //searchStoreBankAccountNumber: searchStoreBankAccountNumber,
        })
      });
      if (!response.ok) {
        setLoadingTradeSummary(false);
        toast.error('Failed to fetch trade summary');
        return;
      }
      const data = await response.json();
      
      console.log('getTradeSummary data', data);


      setTradeSummary(data.result);
      setLoadingTradeSummary(false);
      return data.result;
    }




    useEffect(() => {

      if (!address) {
        return;
      }

      getTradeSummary();

      // fetch trade summary every 10 seconds
      const interval = setInterval(() => {
        getTradeSummary();
      }, 10000);
      return () => clearInterval(interval);


    } , [address, searchMyOrders, params.storecode,]);




    // store settlementWalletAddress USDT balance
    
    const [settlementWalletBalance, setSettlementWalletBalance] = useState(0);

    useEffect(() => {

      const getSettlementWalletBalance = async () => {
        if (!store || !store.settlementWalletAddress) {
          setSettlementWalletBalance(0);
          return;
        }
        const result = await balanceOf({
          contract,
          address: store.settlementWalletAddress,
        });
 
        if (chain === 'bsc') {
          setSettlementWalletBalance( Number(result) / 10 ** 18 );
        } else {
          setSettlementWalletBalance( Number(result) / 10 ** 6 );
        }

      };

      getSettlementWalletBalance();
    }, [store, contract, store?.settlementWalletAddress]);




    // adminWalletAddress USDT balance
    /*
    const [adminWalletBalance, setAdminWalletBalance] = useState(0);
    useEffect(() => {
      const getAdminWalletBalance = async () => {
        if (!store || !store.adminWalletAddress) {
          setAdminWalletBalance(0);
          return;
        }
        const result = await balanceOf({
          contract,
          address: store.adminWalletAddress,
        });
        //console.log('adminWalletBalance result', result);
        setAdminWalletBalance(Number(result) / 10 ** 6);
      };
      getAdminWalletBalance();
    }, [store, contract]);
    */

    // sellerWalletAddress USDT balance
    const [sellerWalletBalance, setSellerWalletBalance] = useState(0);
    useEffect(() => {
      const getSellerWalletBalance = async () => {
        if (!store || !store.sellerWalletAddress) {
          setSellerWalletBalance(0);
          return;
        }
        const result = await balanceOf({
          contract,
          address: store.sellerWalletAddress,
        });

        if (chain === 'bsc') {
          setSellerWalletBalance(Number(result) / 10 ** 18);
        } else {
          setSellerWalletBalance(Number(result) / 10 ** 6);
        }
      };
      getSellerWalletBalance();
    }, [store, contract]);





    
    return (

      <main className="p-4 pb-10 min-h-[100vh] flex items-start justify-center container max-w-screen-2xl mx-auto">

        <div className="py-0 w-full">


  
        <div className="w-full flex flex-row gap-2 items-center justify-start text-zinc-500 text-lg"
        >
            {/* go back button */}
            <div className="w-full flex justify-start items-center gap-2">
                {/*
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
                */}
                {/* windows back button */}
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

                    <div className="flex flex-row items-center justify-center gap-2
                      bg-zinc-100 border border-zinc-200 rounded-full p-1
                      ">
                      <Image
                        src={user?.avatar || avatar || "/icon-user.png"}
                        alt="User"
                        width={20}
                        height={20}
                        className="rounded-full"
                      />
                      <span className="text-sm text-zinc-600">
                        {user?.nickname || "프로필"}
                      </span>
                    </div>

                </div>
              )}

        </div>


          <div className="mt-4
            w-full flex flex-col items-start justify-center gap-4">

            <div className='flex flex-row items-center space-x-4'>
                  <Image
                      src={store?.storeLogo || "/icon-collect.png"}
                      alt="Store Logo"
                      width={35}
                      height={35}
                      className="w-10 h-10 rounded-full"
                  />

                  <div className="text-xl font-semibold">
                  가맹점{' '}{
                      store && store.storeName + " (" + store.storecode + ")"
                  }{' '}청산관리
                  </div>
              </div>

              <div className="w-full flex flex-col xl:flex-row items-start justify-between gap-4">


                {/*
                <div className="flex flex-col items-start justify-start space-y-2">

                  <div className="flex flex-row items-center justify-start gap-2">
                      <Image
                          src="/icon-dot-green.png"
                          alt="dot"
                          width={20}
                          height={20}
                          className="w-4 h-4"
                      />
                      <span className="text-sm text-zinc-500">
                        판매자 USDT지갑
                      </span>
                  </div>
                  
                  <div className="flex flex-row items-center justify-center gap-2">

                    <div className="flex flex-row items-center justify-center gap-1">
                      <Image
                          src="/icon-shield.png"
                          alt="Wallet"
                          width={100}
                          height={100}
                          className="w-6 h-6"
                      />
                      <button
                          className="text-lg text-zinc-600 underline"
                          onClick={() => {
                              navigator.clipboard.writeText(store?.sellerWalletAddress || "");
                              toast.success(Copied_Wallet_Address);
                          } }
                      >
                          {store?.sellerWalletAddress?.substring(0, 6)}...{store?.sellerWalletAddress?.substring(store?.sellerWalletAddress.length - 4)}
                      </button>
                    </div>

                    <div className="flex flex-row items-center justify-center gap-1">
                      <Image
                        src="/icon-tether.png"
                        alt="USDT"
                        width={30}
                        height={30}
                        className="w-6 h-6"
                      />
                      <span className="text-2xl xl:text-4xl font-semibold text-[#409192]"
                        style={{ fontFamily: "monospace" }}>
                          {
                            (Number(sellerWalletBalance || 0).toFixed(3))
                            .toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                          }
                      </span>
                    </div>

                  </div>

                </div>
                */}



                {/*
                <div className="flex flex-col items-start justify-start space-y-2">

                  <div className="flex flex-row items-center justify-start gap-2">
                      <Image
                          src="/icon-dot-green.png"
                          alt="dot"
                          width={20}
                          height={20}
                          className="w-4 h-4"
                      />
                      <span className="text-sm text-zinc-500">
                        나의 USDT지갑
                      </span>
                  </div>
                  
                  <div className="flex flex-row items-center justify-center gap-2">

                    <div className="flex flex-row items-center justify-center gap-1">
                      <Image
                          src="/icon-shield.png"
                          alt="Wallet"
                          width={100}
                          height={100}
                          className="w-6 h-6"
                      />
                      <button
                          className="text-lg text-zinc-600 underline"
                          onClick={() => {
                              navigator.clipboard.writeText(address || "");
                              toast.success(Copied_Wallet_Address);
                          } }
                      >
                          {address?.substring(0, 6)}...{address?.substring(address.length - 4)}
                      </button>
                    </div>

                    <div className="flex flex-row items-center justify-center gap-1">
                      <Image
                        src="/icon-tether.png"
                        alt="USDT"
                        width={30}
                        height={30}
                        className="w-6 h-6"
                      />
                      <span className="text-2xl xl:text-4xl font-semibold text-[#409192]"
                        style={{ fontFamily: "monospace" }}>
                          {
                            (Number(balance || 0).toFixed(3))
                            .toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                          }
                      </span>
                    </div>

                  </div>

                </div>
                */}








              </div>







                  <div className="w-full flex flex-col xl:flex-row items-center justify-start gap-5">


                    <div className="flex flex-col xl:flex-row items-between justify-between gap-5
                      border border-zinc-300/50
                      bg-white/50
                      p-4 rounded-lg shadow-md
                      w-full
                      ">
                      
                      <div className="flex flex-row items-center justify-end gap-5">

                        <Image
                          src="/icon-escrow.jpeg"
                          alt="Escrow"
                          width={100}
                          height={100}
                          className="w-18 h-18 rounded-full"
                        />
                        <div className="flex flex-col items-center justify-end gap-2">

                            <div className="flex flex-row items-center justify-center gap-2">
                              <Image
                                  src="/icon-dot-green.png"
                                  alt="Dot"
                                  width={20}
                                  height={20}
                                  className="w-4 h-4"
                              />
                              <span className="text-sm text-zinc-500">
                                  가맹점 보유금
                              </span>
                            </div>
                            <div className="flex flex-row items-center gap-1">
                              <Image
                                src="/icon-tether.png"
                                alt="USDT"
                                width={30}
                                height={30}
                                className="w-6 h-6"
                              />
                              <span className="text-2xl xl:text-4xl font-semibold text-[#409192]"
                                style={{ fontFamily: "monospace" }}>
                                {store && store.escrowAmountUSDT &&
                                store.escrowAmountUSDT.toFixed(3).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                                || 0.00}
                              </span>
                            </div>


                        </div>

                      </div>


                      <div className="flex flex-col items-center justify-end gap-2">

                        <div className="flex flex-row items-center justify-center gap-2">
                            <Image
                              src="/icon-dot-green.png"
                              alt="Dot"
                              width={20}
                              height={20}
                              className="w-4 h-4"
                            />
                            <span className="text-sm text-zinc-500">
                              가맹점 자동결제용 USDT지갑
                            </span>
                        </div>

                        <div className="flex flex-row items-center justify-center gap-2">

                          {/* settlementWalletAddress */}
                          <div className="flex flex-row items-center justify-center gap-2">
                              <Image
                                  src="/icon-shield.png"
                                  alt="Wallet"
                                  width={100}
                                  height={100}
                                  className="w-6 h-6"
                              />
                              <button
                                  className="text-lg text-zinc-600 underline"
                                  onClick={() => {
                                      navigator.clipboard.writeText(store?.settlementWalletAddress || "");
                                      toast.success(Copied_Wallet_Address);
                                  } }
                              >
                                  {store?.settlementWalletAddress?.substring(0, 6)}...{store?.settlementWalletAddress?.substring(store?.settlementWalletAddress.length - 4)}
                              </button>

                          </div>

                          <div className="flex flex-row items-center justify-center gap-2">
                              <div className="flex flex-row items-center gap-1">
                                <Image
                                    src="/icon-tether.png"
                                    alt="USDT"
                                    width={30}
                                    height={30}
                                    className="w-6 h-6"
                                />
                                <span className="text-2xl xl:text-4xl font-semibold text-[#409192]"
                                  style={{ fontFamily: "monospace" }}>
                                    {
                                      (Number(settlementWalletBalance || 0).toFixed(3))
                                      .replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                                    }
                                </span>
                              </div>
                          </div>

                        </div>


                      </div>




                    </div>


                  </div>







                  {/* check box for sell order */}
                  {/*
                  <div className="flex flex-row items-center gap-2">
                    <input
                      type="checkbox"
                      checked={checkInputKrwAmount}
                      onChange={(e) => setCheckInputKrwAmount(e.target.checked)}
                    />
                    <p className="text-sm text-zinc-400">
                      원화로 주문하기
                    </p>
                  </div>
                  */}

                  <div className=" w-full grid gap-4  justify-center">

                    

                    {/* sell order is different border color
                    */}
                    <article
                      className={`
                        ${checkInputKrwAmount ? 'hidden' : 'block'}
                      bg-white shadow-md rounded-lg p-4 border border-gray-300`}
              
                    >

                      <div className="flex flex-col xl:flex-row gap-5 xl:gap-10 items-center">


                        <div className="flex flex-col gap-2 items-start">


                          <p className="mt-4 text-xl font-bold text-zinc-400">1 USDT = {
                            // currency format
                            Number(rate)?.toLocaleString('ko-KR', {
                              style: 'currency',
                              currency: 'KRW'
                            })
                          }</p>
                          
                          <div className=" flex flex-row items-center gap-2">
                            <p className="text-xl text-blue-500 font-bold ">
                              <input 
                                type="number"
                                className=" w-28 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 "
                                placeholder="Amount"
                                value={usdtAmount}
                                onChange={(e) => {
                                  // check number
                                  e.target.value = e.target.value.replace(/[^0-9.]/g, '');

                                  // if the value is start with 0, then remove 0
                                  if (e.target.value.startsWith('0')) {
                                    e.target.value = e.target.value.substring(1);
                                  }

                                  
                                  if (e.target.value === '') {
                                    setUsdtAmount(0);
                                    return;
                                  }

                                  
                              


                                  parseFloat(e.target.value) < 0 ? setUsdtAmount(0) : setUsdtAmount(parseFloat(e.target.value));

                                  parseFloat(e.target.value) > 1000 ? setUsdtAmount(1000) : setUsdtAmount(parseFloat(e.target.value));

                                } }


                              />
                              <span className="ml-1 text-sm">USDT</span>
                            </p>

                            <p className=" text-xl text-zinc-400 font-bold">
                              = {
                              Number(defaultKrWAmount)?.toLocaleString('ko-KR', {
                                style: 'currency',
                                currency: 'KRW'
                              })
                              }
                            </p>
                          </div>


                          {seller && (
                            <p className=" text-sm text-zinc-400">
                              {Payment}: {Bank_Transfer} ({seller?.bankInfo.bankName} {seller?.bankInfo.accountNumber} {seller?.bankInfo.accountHolder})
                            </p>
                          )}

                        </div>


                        {/* input krw amount */}
                        {/* left side decrease button and center is input and  right side increase button */}
                        {/* -1, -10, -100, +1, +10, +100 */}
                        {/* if - button change bg color red */}
                        {/* if + button change bg color */}

                          <div className="mt-4  flex flex-row items-center justify-between gap-2">


                            <div className="flex flex-col gap-2">

                              <button
                                disabled={usdtAmount === 0}
                                className="bg-red-400 text-white px-2 py-2 rounded-md"
                                onClick={() => {
                                  krwAmount > 0 && setKrwAmount(krwAmount - 1);
                                }}
                              >
                                -1
                              </button>

                              <button
                                disabled={usdtAmount === 0}
                                className="bg-red-600 text-white px-2 py-2 rounded-md"
                                onClick={() => {
                                  krwAmount > 10 && setKrwAmount(krwAmount - 10);
                                }}
                              >
                                -10
                              </button>

                              <button
                                disabled={usdtAmount === 0}
                                className="bg-red-800 text-white px-2 py-2 rounded-md"
                                onClick={() => {
                                  krwAmount > 100 && setKrwAmount(krwAmount - 100);
                                }}
                              >
                                -100
                              </button>

                              <button
                                disabled={usdtAmount === 0}
                                className="bg-red-900 text-white px-2 py-2 rounded-md"
                                onClick={() => {
                                  krwAmount > 1000 && setKrwAmount(krwAmount - 1000);
                                }}
                              >
                                -1000
                              </button>

                            </div>

                            <div className="flex flex-col gap-2">
                              <div className="flex flex-row items-center gap-2"> 
    
                                <input 
                                  disabled
                                  type="number"
                                  className=" w-36  px-3 py-2 text-black bg-white text-xl font-bold border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 "
                                  value={krwAmount}
                                  onChange={(e) => {
                                    // check number
                                    e.target.value = e.target.value.replace(/[^0-9.]/g, '');

                                    if (e.target.value === '') {
                                      setKrwAmount(0);
                                      return;
                                    }

                                    parseFloat(e.target.value) < 0 ? setKrwAmount(0) : setKrwAmount(parseFloat(e.target.value));

                                    parseFloat(e.target.value) > 1000 ? setKrwAmount(1000) : setKrwAmount(parseFloat(e.target.value));

                                  } }
                                />
                              </div>

                              {krwAmount > 0 && (
                                <div className="text-lg font-semibold text-zinc-400">
                                  {Rate}: {

                                    // currency format
                                    Number((krwAmount / usdtAmount).toFixed(2))?.toLocaleString('ko-KR', {
                                      style: 'currency',
                                      currency: 'KRW'
                                    })

                                  } 
                                </div>
                              )}
                            </div>

                            <div className="flex flex-col gap-2">
                              <button
                                disabled={usdtAmount === 0}
                                className="bg-green-400 text-white px-2 py-2 rounded-md"
                                onClick={() => {
                                  setKrwAmount(krwAmount + 1);
                                }}
                              >
                                +1
                              </button>
                              <button
                                disabled={usdtAmount === 0}
                                className="bg-green-600 text-white px-2 py-2 rounded-md"
                                onClick={() => {
                                  setKrwAmount(krwAmount + 10);
                                }}
                              >
                                +10
                              </button>

                              <button
                                disabled={usdtAmount === 0}
                                className="bg-green-800 text-white px-2 py-2 rounded-md"
                                onClick={() => {
                                  setKrwAmount(krwAmount + 100);
                                }}
                              >
                                +100
                              </button>

                              <button
                                disabled={usdtAmount === 0}
                                className="bg-green-900 text-white px-2 py-2 rounded-md"
                                onClick={() => {
                                  setKrwAmount(krwAmount + 1000);
                                }}
                              >
                                +1000
                              </button>

                            </div>


                          </div>

                        </div>




                        {/* sms mobile number */}
                        {address && phoneNumber && (
                          <div className="mt-4 flex flex-col gap-2 items-start">
                            <div className="flex flex-row items-center gap-2">
                              <div className="h-2 w-2 bg-zinc-400 rounded-full inline-block mr-2"></div>
                              <span className="text-sm text-zinc-400">
                                SMS: {phoneNumber}
                              </span>
                            </div>
                           
                            <div className="flex flex-row items-center gap-2">
                              <div className="h-2 w-2 bg-zinc-400 rounded-full inline-block mr-2"></div>
                              <span className="text-sm text-zinc-400">
                                 {Buy_Order_SMS_will_be_sent_to_your_mobile_number}
                              </span>
                            </div>
                            
                          </div>
                        )}



                        {/* aggremment */}
                        {/* After you place order and the buyer accepts the order, you can not cancel the order. */}


                        <div className="mt-4 flex flex-row items-center gap-2">
                          <input
                            disabled={!address || usdtAmount === 0 || buyOrdering}
                            type="checkbox"
                            checked={agreementPlaceOrder}
                            onChange={(e) => setAgreementPlaceOrder(e.target.checked)}
                          />
                          <p className="text-sm text-zinc-400">
                            
                            {I_agree_to_the_terms_of_trade}

                          </p>
                        </div>


                        {/* terms and conditions */}
                        {/* text area */}
                        {/*
                        <textarea
                          className="w-full h-32 p-2 border border-gray-300 rounded-md text-sm text-black"
                          placeholder="
                            After you place order, the buyer has 24 hours to accept the order.
                            If the buyer does not accept the order within 24 hours, the order will be expired.
                            After the buyer accepts the order, you can not cancel the order.
                            After the buyer accepts the order, you must deposit the USDT to escrow within 1 hour.
                            If you do not deposit the USDT to escrow within 1 hour, the order will be expired.
                            If you want to cancel the order, you must contact the buyer and request to cancel the order.
                            If the buyer agrees to cancel the order, the order will be cancelled.
                          "
                        ></textarea>
                        */}



                        {/*
                        <div className="mt-4 text-sm text-zinc-400">

                          <div className="h-2 w-2 bg-zinc-400 rounded-full inline-block mr-2"></div>
                          <span>After you place order, the buyer has 24 hours to accept the order.
                            If the buyer does not accept the order within 24 hours, the order will be expired.
                          </span>
                        </div>
                        <div className="mt-4 text-sm text-zinc-400">

                          <div className="h-2 w-2 bg-zinc-400 rounded-full inline-block mr-2"></div>
                          <span>After the buyer accepts the order, you can not cancel the order.</span>
                        </div>
                        <div className="mt-4 text-sm text-zinc-400">

                          <div className="h-2 w-2 bg-zinc-400 rounded-full inline-block mr-2"></div>
                          <span>After the buyer accepts the order, you must deposit the USDT to escrow within 1 hour.
                            If you do not deposit the USDT to escrow within 1 hour, the order will be expired.
                          </span>
                        </div>
                        <div className="mt-4 text-sm text-zinc-400">

                          <div className="h-2 w-2 bg-zinc-400 rounded-full inline-block mr-2"></div>
                          <span>If you want to cancel the order, you must contact the buyer and request to cancel the order.
                            If the buyer agrees to cancel the order, the order will be cancelled.
                          </span>
                        </div>
                        */}





                        <div className="mt-4 flex flex-col gap-2">
                  
                          {buyOrdering ? (

                            <div className="flex flex-row items-center gap-2">
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
                                <div className="text-zinc-400">
                                  {Placing_Order}...
                                </div>
                  
                            </div>


                          ) : (
                              <button
                                  disabled={usdtAmount === 0 || agreementPlaceOrder === false}
                                  className={`text-lg text-white px-4 py-2 rounded-md ${usdtAmount === 0 || agreementPlaceOrder === false ? 'bg-gray-500' : 'bg-green-500'}`}
                                  onClick={() => {
                                      console.log('Buy USDT');
                                      // open trade detail
                                      // open modal of trade detail
                                      ///openModal();

                                      buyOrder();
                                  }}
                              >
                                {Place_Order}
                              </button>
                          )}

                        </div>


                    </article>


                    {/* sell order card view */}
                    {/* input price and auto change usdt amount */}
                    <article
                      className={` ${checkInputKrwAmount ? 'block' : 'hidden'}
                        w-full
                         bg-white shadow-md rounded-lg p-4 border border-gray-300`}
                    >
                        
                        <div className="
                        w-full
                        flex flex-col xl:flex-row gap-5 xl:gap-20 items-center ">
                            
                            <div className="flex flex-col gap-2 items-start">

                              <p className="mt-4 text-xl font-bold text-zinc-400">1 USDT = {
                                // currency format
                                Number(rate)?.toLocaleString('ko-KR', {
                                  style: 'currency',
                                  currency: 'KRW'
                                })
                              }</p>

                              <div className=" flex flex-col items-center gap-2">
                                
                                <div className="flex flex-row items-center gap-2">

                                  <span className="text-xl text-blue-500 font-bold ">
                                    매입금액
                                  </span>

                                  <input 
                                    type="number"
                                    className="
                                      text-xl text-blue-500 font-bold
                                      w-40 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 "
                                    placeholder={Price}
                                    value={krwAmount}
                                    onChange={(e) => {
                                      // check number
                                      e.target.value = e.target.value.replace(/[^0-9.]/g, '');
                                      
                                      // if prefix 0, then remove 0
                                      if (e.target.value.startsWith('0')) {
                                        e.target.value = e.target.value.substring(1);
                                      }


                                      /*
                                      if (e.target.value === '') {
                                        setKrwAmount(0);
                                        return;
                                      }
                                      */

  
                                      parseFloat(e.target.value) < 0 ? setKrwAmount(0) : setKrwAmount(parseFloat(e.target.value));
  
                                      parseFloat(e.target.value) > 100000000 ? setKrwAmount(1000) : setKrwAmount(parseFloat(e.target.value));
  
                                      //setUsdtAmount(Number((krwAmount / rate).toFixed(2)));
                                    
                                    
                                    } }
                                  />

                                  <span className="text-xl text-zinc-400 font-bold">
                                    원  
                                  </span>

                                </div>
                                {/* 매입수량 */}
                                <span className="text-lg font-semibold text-zinc-400">
                                  매입수량(USDT)
                                </span>
  
                                <p className=" text-xl text-zinc-400 font-bold">
                                  


                                  = {
                                  krwAmount === 0 ? '0' :
                                  
                                  (krwAmount / rate).toFixed(3) === 'NaN' ? '0' : (krwAmount / rate).toFixed(3)

                                  }{' '}USDT
                                </p>

                              </div>

                            </div>


                          <div className="mt-4 flex flex-col gap-2">

                            <div className="flex flex-row items-center gap-2">
                              <input
                                // disable mouse scroll up and down
                                //
                                
                                onWheel={(e) => e.preventDefault()}



                                disabled={!address || krwAmount === 0 || buyOrdering}
                                type="checkbox"
                                checked={agreementPlaceOrder}
                                onChange={(e) => setAgreementPlaceOrder(e.target.checked)}
                              />
                    
                              {buyOrdering ? (

                                <div className="flex flex-row items-center gap-2">
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
                                    <div className="text-zinc-400">
                                      신청중...
                                    </div>
                      
                                </div>
                              ) : (
                                  <button
                                      disabled={krwAmount === 0 || agreementPlaceOrder === false}
                                      className={`text-lg text-white  px-4 py-2 rounded-md ${krwAmount === 0 || agreementPlaceOrder === false ? 'bg-gray-500' : 'bg-green-500'}`}


                                      onClick={() => {
                                          console.log('Buy USDT');
                                          // open trade detail
                                          // open modal of trade detail
                                          ///openModal();
    
                                          buyOrder();
                                      }}
                                  >
                                    매입신청
                                  </button>
                              )}

                            </div>

                          </div>

                        </div>

                    </article>









                    <article
                      className="hidden xl:block"
                    ></article>

                    <article
                      className="hidden xl:block"
                    ></article>


                  </div>

         


                  <div className="mt-10 w-full flex flex-row items-center justify-between gap-4">



                    {/* serach fromDate and toDate */}
                    {/* DatePicker for fromDate and toDate */}
                    <div className="flex flex-col xl:flex-row items-center gap-2">
                      <div className="flex flex-row items-center gap-2">
                        <Image
                          src="/icon-calendar.png"
                          alt="Calendar"
                          width={20}
                          height={20}
                          className="rounded-lg w-5 h-5"
                        />
                        <input
                          type="date"
                          value={searchFromDate}
                          onChange={(e) => setSearchFormDate(e.target.value)}
                          className="w-full p-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3167b4]"
                        />
                      </div>

                      <span className="text-sm text-gray-500">~</span>

                      <div className="flex flex-row items-center gap-2">
                        <Image
                          src="/icon-calendar.png"
                          alt="Calendar"
                          width={20}
                          height={20}
                          className="rounded-lg w-5 h-5"
                        />
                        <input
                          type="date"
                          value={searchToDate}
                          onChange={(e) => setSearchToDate(e.target.value)}
                          className="w-full p-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3167b4]"
                        />
                      </div>
                    </div>


                    {/*
                    <div className="flex flex-col gap-2 items-center">
                      <div className="text-sm">건수</div>
                      <div className="text-xl font-semibold text-zinc-400">
                        {buyOrders.length.toLocaleString()}
                      </div>
                    </div>
                    */}




                    <div className="flex flex-row items-center justify-center gap-5
                      border border-zinc-300/50
                      bg-white/50
                      p-4 rounded-lg shadow-md
                      w-full xl:w-1/2
                      ">

                        {/* totalClearanceAmount */}
                        {/* totalClearanceAmountUSDT */}
                        <div className="flex flex-row items-center justify-center gap-2">
                          
                          <div className="flex flex-col items-center">
                            <span className="text-sm text-zinc-500">
                              총 매입주문수(건)
                            </span>
                            <span className="text-xl xl:text-2xl font-semibold text-[#409192]">
                              {totalClearanceCount.toLocaleString()}
                            </span>
                          </div>

                          <div className="flex flex-col items-center">
                              <span className="text-sm text-zinc-500">
                                  총 매입수량(USDT)
                              </span>
                              <div className="flex flex-row items-center justify-center gap-2">
                                <span className="text-xl xl:text-2xl font-semibold text-[#409192]"
                                  style={{ fontFamily: "monospace" }}>
                                    {
                                      (Number(totalClearanceAmount).toFixed(3))
                                      .replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                                    }
                                </span>
                              </div>
                          </div>
                          
                          <div className="flex flex-col items-center">
                              <span className="text-sm text-zinc-500">
                                  총 매입금액(원)
                              </span>
                              <div className="flex flex-row items-center justify-center gap-2">
                                <span className="text-xl xl:text-2xl font-semibold text-yellow-600"
                                  style={{ fontFamily: "monospace" }}>
                                    {
                                      (Number(totalClearanceAmountKRW).toFixed(0))
                                      .replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                                    }
                                </span>
                              </div>
                          </div>

                        </div>

                      </div>



                  
                </div>



   





                {tableView ? (


           
                  <table className=" w-full table-auto border-collapse border border-zinc-800 rounded-md">

                    <thead
                      className="bg-zinc-800 text-white text-sm font-semibold"
                      style={{
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                      }}
                    >
                      <tr>

                          <th className="p-2 text-left">#신청번호</th>

                          <th className="p-2 text-center">신청시간</th>

                          <th className="p-2 text-left">구매자정보</th>

                          <th className="p-2 text-left">판매자 정보</th>


                          <th className="p-2 text-left">
                            <div className="flex flex-col items-end justify-center gap-1">
                              <span>매입수량(USDT)</span>
                              <span>매입금액(원)</span>
                              <span>{Rate}(원)</span>
                            </div>
                          </th>


                          <th className="p-2 text-left">결제방법</th>
                          <th className="p-2 text-left">결제금액(원)</th>
                          
                          <th className="p-2 text-center">거래상태</th>
                          <th className="p-2 text-left">출금상태</th>

                          
                      </tr>
                  </thead>
                  <tbody>
                      {buyOrders.map((item, index) => (
                        <tr key={index} className={`
                          ${
                            index % 2 === 0 ? 'bg-zinc-100' : 'bg-zinc-200'
                          }
                        `}>

                              {/* monospace font */}
                              <td className="p-2 text-lg text-zinc-600 font-semibold"
                                style={{
                                  fontFamily: 'monospace',
                                }}
                              >
                            

                                #{item.tradeId}
                              </td>


                              <td className="p-2">

                                <div className="flex flex-col items-center justify-center gap-1">
                                  <span className="text-lg text-zinc-600 font-semibold">
                                    {new Date(item.createdAt).toLocaleString()}
                                  </span>
  
                                  <span className="text-sm text-zinc-400">
                                    {
                                      new Date().getTime() - new Date(item.createdAt).getTime() < 1000 * 60 ? (
                                        ' ' + Math.floor((new Date().getTime() - new Date(item.createdAt).getTime()) / 1000) + ' ' + seconds_ago
                                      ) :
                                      new Date().getTime() - new Date(item.createdAt).getTime() < 1000 * 60 * 60 ? (
                                        ' ' + Math.floor((new Date().getTime() - new Date(item.createdAt).getTime()) / 1000 / 60) + ' ' + minutes_ago
                                      ) : (
                                        ' ' + Math.floor((new Date().getTime() - new Date(item.createdAt).getTime()) / 1000 / 60 / 60) + ' ' + hours_ago
                                      )}

                                  </span>
                                </div>
                              </td>

                           

                              <td className="p-2">
                                <div className="flex flex-col items-start justify-center gap-1">

                                  <div className="flex flex-row items-center gap-1">
                                    <Image
                                      src="/icon-user.png"
                                      alt="Buyer"
                                      width={20}
                                      height={20}
                                      className="w-5 h-5 rounded-full"
                                    />


                                    {item?.buyer?.nickname ? (
                                      <span className="text-lg text-zinc-600">
                                        {item.buyer?.nickname}
                                      </span>
                                    ) : (
                                      <span className="text-lg text-zinc-600">
                                        {item.nickname || '익명'}
                                      </span>
                                    )}


                                  </div>

                                  <div className="flex flex-row items-center gap-1">
                                    <Image
                                      src="/icon-shield.png"
                                      alt="Shield"
                                      width={20}
                                      height={20}
                                      className="w-5 h-5 rounded-full"
                                    />
                                    <span className="text-lg text-zinc-400 font-semibold">
                                      {item.walletAddress.slice(0, 6) + '...' + item.walletAddress.slice(-4)}
                                    </span>
                                  </div>

                                </div>
                              </td>


                              <td className="p-2">
                                <div className="flex flex-col items-start justify-center gap-1">

                                  <div className="flex flex-row items-center gap-1">
                                    <Image
                                      src="/icon-seller.png"
                                      alt="Seller"
                                      width={20}
                                      height={20}
                                      className="w-5 h-5 rounded-full"
                                    />
                                    <span className="text-lg text-zinc-600">
                                      {item?.seller?.nickname || '익명'}
                                    </span>
                                  </div>

                                  <div className="flex flex-row items-center gap-1">
                                    <Image
                                      src="/icon-shield.png"
                                      alt="Shield"
                                      width={20}
                                      height={20}
                                      className="w-5 h-5 rounded-full"
                                    />
                                    <span className="text-lg text-zinc-400 font-semibold">
                                      {item?.seller?.walletAddress.slice(0, 6) + '...' + item?.seller?.walletAddress.slice(-4)}
                                    </span>
                                  </div>

                                </div>
                              </td>



                              <td>
                                <div className="flex flex-col items-end justify-center gap-1 mr-5">

                                
                                  <div className="flex flex-row items-center gap-1">
                                    <Image
                                      src="/icon-tether.png"
                                      alt="Tether"
                                      width={20}
                                      height={20}
                                      className="w-5 h-5"
                                    />
                                    <span className="text-xl text-[#409192] font-semibold"
                                      style={{
                                        fontFamily: 'monospace',
                                      }}
                                    >
                                      {item.usdtAmount && item.usdtAmount.toFixed(3).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                                    </span>
                                  </div>

                                  <span className="text-xl text-yellow-600 font-semibold"
                                    style={{
                                      fontFamily: 'monospace',
                                    }}
                                  >
                                    {Number(item.krwAmount)?.toLocaleString()}
                                  </span>


                                  <span className="text-lg text-zinc-400 font-semibold"
                                    style={{
                                      fontFamily: 'monospace',
                                    }}
                                  >
                                    {Number(item.rate).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                                    </span>
                                </div>
                              </td>

                           
                              <td>
                                {item?.buyer?.nickname ? (
                                  <div className="w-36 flex flex-col items-start justify-center gap-1">

                                  {/* 
                                    nickname
                                    "matoto44"
                                    depositBankName
                                    "카카오뱅크"
                                    depositBankAccountNumber
                                    "3333338246503"
                                    depositName
                                    "허경수"
                                    */}


                                    <span className="text-sm text-zinc-600">
                                      {item.buyer?.depositBankName}
                                    </span>
                                    <span className="text-sm text-zinc-600">
                                      {item.buyer?.depositBankAccountNumber}
                                    </span>
                                    <span className="text-sm text-zinc-600">
                                      {item.buyer?.depositName}
                                    </span>

                                  </div>
                                ) : (
                                  <div className="w-36 flex flex-col items-start justify-center gap-1">
                                    <span className="text-sm text-zinc-600">
                                      {item.seller?.bankInfo?.bankName}
                                    </span>
                                    <span className="text-sm text-zinc-600">
                                      {item.seller?.bankInfo?.accountNumber}
                                      </span>
                                    <span className="text-sm text-zinc-600">
                                      {item.seller?.bankInfo?.accountHolder}
                                      </span>
                                  </div>
                                )}

                              </td>


                              <td>
                                
                                {item.status === 'paymentConfirmed' && (
                                  <span className="text-xl text-yellow-600 font-semibold">
                                    
                                    {Number(item.krwAmount)?.toLocaleString()}
                                  </span>
                                )}

                                {item.status === 'paymentRequested' && (

                                  <div className="flex flex-row gap-1">
                                    <input
                                      disabled={true}
                                      type="number"
                                      className="w-36
                                      px-2 py-1 border border-gray-300 rounded-md text-lg text-black"
                                      placeholder="Amount"
                                      value={paymentAmounts[index]}
                                      onChange={(e) => {
                                        // check number
                                        e.target.value = e.target.value.replace(/[^0-9.]/g, '');


                                        parseFloat(e.target.value) < 0 ? setPaymentAmounts(
                                          paymentAmounts.map((item, idx) => {
                                            if (idx === index) {
                                              return 0;
                                            }
                                            return item;
                                          })
                                        ) : setPaymentAmounts(
                                          paymentAmounts.map((item, idx) => {
                                            if (idx === index) {
                                              return parseFloat(e.target.value);
                                            }
                                            return item;
                                          })
                                        );

                                      }
                                    }
                                    />
                                      
                                  </div>

                                )}
                              </td>
                              

                              <td className="p-2">
                                <div className="flex flex-row items-center justify-center gap-2">

                                {(item.status === 'ordered'
                                  || item.status === 'accepted'
                                )
                                && (

                                  <>
                                  {/*
                                  <button
                                    disabled={cancellings[index]}
                                    className={`flex flex-row gap-1 text-sm text-white px-2 py-1 rounded-md ${cancellings[index] ? 'bg-gray-500' : 'bg-red-500'}`}
                                    onClick={() => cancelBuyOrder(item._id, index)}
                                  >
                                    <Image
                                      src="/loading.png"
                                      alt="loading"
                                      width={16}
                                      height={16}
                                      className={cancellings[index] ? 'animate-spin' : 'hidden'}
                                    />
                                    <span>{Cancel_My_Order}</span>
                                   
                                  </button>
                                  */}


                                  </>

                                )}

                                {item.status === 'ordered' && (

                                    <>
                              
                                    <span className="text-lg text-yellow-600 font-semibold">
                    
                                      주문 신청중...
                                    </span>


                                    </>

                                )}



                                {item.status === 'paymentConfirmed' && (
                                  <div className="flex flex-col items-center justify-center gap-2">

                                    <span className="text-lg font-semibold text-[#409192]">
                                      {Completed}
                                    </span>
                                    <span>{
                                      item.paymentConfirmedAt && new Date(item.paymentConfirmedAt)?.toLocaleString()
                                    }</span>

                                    <button
                                      className="text-sm text-blue-600 font-semibold
                                        border border-blue-600 rounded-lg p-2
                                        bg-blue-100
                                        w-full text-center
                                        hover:bg-blue-200
                                        cursor-pointer
                                        transition-all duration-200 ease-in-out
                                        hover:scale-105
                                        hover:shadow-lg
                                        hover:shadow-blue-500/50
                                      "

                                      onClick={() => {
                                        let url = '';
                                        if (chain === "ethereum") {
                                          url = `https://etherscan.io/tx/${item.transactionHash}`;
                                        } else if (chain === "polygon") {
                                          url = `https://polygonscan.com/tx/${item.transactionHash}`;
                                        } else if (chain === "arbitrum") {
                                          url = `https://arbiscan.io/tx/${item.transactionHash}`;
                                        } else if (chain === "bsc") {
                                          url = `https://bscscan.com/tx/${item.transactionHash}`;
                                        } else {
                                          url = `https://arbiscan.io/tx/${item.transactionHash}`;
                                        }
                                        window.open(url, '_blank');

                                      }}

                                    >
                                      <div className="flex flex-row gap-2 items-center justify-center">
                                        <Image
                                          src={`/logo-chain-${chain}.png`}
                                          alt="Chain"
                                          width={20}
                                          height={20}
                                          className="w-5 h-5"
                                        />
                                        <span className="text-sm">
                                          USDT 전송내역
                                        </span>
                                      </div>
                                    </button>



                                  </div>
                                )}

                                {item.status === 'accepted' && (
                                  <div className="flex flex-row gap-1">

                                    <span className="text-lg font-semibold text-yellow-600">
                                      주문접수
                                    </span>

                                    {/* check box for agreement */}
                                    {/*
                                    <input
                                      disabled={escrowing[index] || requestingPayment[index]}
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
                                    />

                                    <button
                                      disabled={escrowing[index] || requestingPayment[index] || !requestPaymentCheck[index]}
                                      
                                      className={`flex flex-row gap-1 text-sm text-white px-2 py-1 rounded-md ${escrowing[index] || requestingPayment[index] || !requestPaymentCheck[index] ? 'bg-gray-500' : 'bg-green-500'}`}
                                      onClick={() => {
         
                                        requestPayment(
                                          index,
                                          item._id,
                                          item.tradeId,
                                          item.usdtAmount
                                        );
                                      }}
                                    >
                                      <Image
                                        src="/loading.png"
                                        alt="loading"
                                        width={16}
                                        height={16}
                                        className={escrowing[index] || requestingPayment[index] ? 'animate-spin' : 'hidden'}
                                      />
                                      <span>{Request_Payment}</span>
                                    
                                    </button>
                                    */}

                                  </div>
                                )}

                                {item.status === 'paymentRequested' && (

                                  <div className="flex flex-row gap-1">

                                    <span className="text-lg font-semibold text-yellow-600">
                                      결제요청
                                    </span>

                                    {/* cancelTrade button */}
                                    {/* functio cancelTrade(index, item._id) */}
                                    <button
                                      disabled={cancellings[index]}
                                      className={`flex flex-row gap-1 text-sm text-white px-2 py-1 rounded-md ${cancellings[index] ? 'bg-gray-500' : 'bg-red-500'}`}
                                      onClick={() => {
                                        confirm (
                                          "정말로 취소하시겠습니까? \n\n" +
                                          "취소시 거래가 취소됩니다.\n\n"
                                        )
                                          &&  cancelTrade(item._id, index);
                                     

                                      } }
                                    >
                                      <Image
                                        src="/loading.png"
                                        alt="loading"
                                        width={16}
                                        height={16}
                                        className={`
                                          ${cancellings[index] ? 'animate-spin' : 'hidden'}
                                          w-4 h-4
                                        `}

                                      />
                                      <span>{Cancel_My_Order}</span>
                                    </button>



                                  



                                    {/*
                                    <div className="flex flex-row gap-1">

                                      <input
                                        disabled={confirmingPayment[index]}
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
                                      />

                                      <button
                                        disabled={confirmingPayment[index] || !confirmPaymentCheck[index]}
                                        className={`flex flex-row gap-1 text-sm text-white px-2 py-1 rounded-md ${confirmingPayment[index] || !confirmPaymentCheck[index] ? 'bg-gray-500' : 'bg-green-500'}`}
                                        onClick={() => {
                                          confirmPayment(
                                            index,
                                            item._id,
                                            paymentAmounts[index]
                                          );
                                        }}

                                      >

                                        <Image
                                          src="/loading.png"
                                          alt="loading"
                                          width={16}
                                          height={16}
                                          className={confirmingPayment[index] ? 'animate-spin' : 'hidden'}
                                        />
                                        <span>{Confirm_Payment}</span>

                                      </button>

                                    </div>
                                    */}

                                  </div>



                                )}
                                {item.status === 'cancelled' && (
                                  <span className="text-red-500">{Cancelled}</span>
                                )}

                                </div>

                              </td>


                              {/* 출금상태: buyer.depositCompleted */}
                              <td className="p-2
                                flex items-center justify-center
                                text-center
                                ">

                                {
                                item.transactionHash && item.transactionHash !== '0x' && (
                                  <>

                                  {item?.buyer?.depositCompleted !== true
                                  ? (
                                    <div className="flex flex-col items-center justify-center gap-1">
                                      <span className="text-sm text-red-600
                                        border border-red-600
                                        rounded-md px-2 py-1">
                                        출금대기중
                                      </span>
                                      {/* 출금완료 버튼 */}
                                      <button
                                        disabled={loadingDeposit[index]}
                                        className={`
                                          w-44 h-8 flex flex-row items-center justify-center
                                          text-sm text-white px-2 py-1 rounded-md
                                          bg-green-500 hover:bg-green-600
                                          transition-all duration-200 ease-in-out
                                          ${loadingDeposit[index] ? 'opacity-50 cursor-not-allowed' : ''}
                                        `}

                                        onClick={async () => {

                                          if ( !confirm('정말로 출금을 완료하시겠습니까?')) {
                                            return;
                                          }    

                                          // buyOrderDepositCompleted
                                          buyOrderDepositCompleted(index, item._id)

                                          
                                        }}
                                      >
                                        {loadingDeposit[index] && (
                                          <Image
                                            src="/loading.png"
                                            alt="Loading"
                                            width={20}
                                            height={20}
                                            className="animate-spin"
                                          />
                                        )}
                                        <span className="text-sm">출금완료하기</span>
                                      </button>
                                    </div>
                                  ) : (
                                    <span className="text-sm text-[#409192]
                                      border border-green-600
                                      rounded-md px-2 py-1">
                                      출금완료
                                    </span>
                                  )}

                                  </>

                                )}
                              
                              </td>






                          </tr>
                      ))}
                  </tbody>
                  </table>

                  ) : (



                  <div className=" w-full grid gap-4 xl:grid-cols-3 justify-center">

                    {buyOrders.map((item, index) => (

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




                        <article
                            key={index}
                            className={`

                              w-96 xl:w-full h-full

                              bg-black p-4 rounded-md border
                              
                               ${item.walletAddress === address ? 'border-green-500' : 'border-gray-200'}
                               

                               ${item.status === 'paymentConfirmed' ? 'bg-gray-900 border-gray-900' : ''}

                            `}
                        >

                            {item.status === 'ordered' && (
                              <div className="flex flex-col items-start gap-1">


                                <div className="flex flex-row items-center gap-2">
                                  {/* new order icon 1 hour after created */}

            
                                  {
                                    (new Date().getTime() - new Date(item.createdAt).getTime()) / 1000 / 60 / 60 < 1 && (
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

                                  <p className="text-sm text-zinc-400">



                                    {params.lang === 'en' && Opened_at} {
                                    new Date().getTime() - new Date(item.createdAt).getTime() < 1000 * 60 ? (
                                      ' ' + Math.floor((new Date().getTime() - new Date(item.createdAt).getTime()) / 1000) + ' ' + seconds_ago
                                    ) :
                                    new Date().getTime() - new Date(item.createdAt).getTime() < 1000 * 60 * 60 ? (
                                      ' ' + Math.floor((new Date().getTime() - new Date(item.createdAt).getTime()) / 1000 / 60) + ' ' + minutes_ago
                                    ) : (
                                      ' ' + Math.floor((new Date().getTime() - new Date(item.createdAt).getTime()) / 1000 / 60 / 60) + ' ' + hours_ago
                                    )}{' '}{params.lang === 'ko' && Opened_at}


                                  </p>

                                </div>

                                {24 - Math.floor((new Date().getTime() - new Date(item.createdAt).getTime()) / 1000 / 60 / 60) > 0 ? (

                                  <div className="mt-2 flex flex-row items-center space-x-2">
                                    <Image
                                      src="/icon-timer.webp"
                                      alt="Timer"
                                      width={28}
                                      height={28}
                                    />
                                    <p className="text-sm text-zinc-400">Expires in {

                                      24 - Math.floor((new Date().getTime() - new Date(item.createdAt).getTime()) / 1000 / 60 / 60) - 1

                                    } hours {
                                      60 - Math.floor((new Date().getTime() - new Date(item.createdAt).getTime()) / 1000 / 60) % 60
                                    } minutes

                                    
                                    </p>
                                  </div>

                                  ) : (
                                  <div className="mt-2 flex flex-row items-center space-x-2">
                                    <Image
                                      src="/icon-timer.webp"
                                      alt="Expired"
                                      width={28}
                                      height={28}
                                    />
                                    <p className="text-sm text-zinc-400">Expired</p>
                                  </div>
                                )}

                              </div>
                            )}






                            { (item.status === 'accepted' || item.status === 'paymentRequested' || item.status === 'cancelled') && (

                              <div className="flex flex-row items-center gap-2  bg-white px-2 py-1 rounded-md mb-4  ">




                                {item.privateSale && (
                                    <Image
                                      src="/icon-private-sale.png"
                                      alt="Private Sale"
                                      width={32}
                                      height={32}
                                    />
                                ) }

                                { (item.status === 'accepted' || item.status === 'paymentRequested') && (
                                  <Image
                                    src="/icon-trade.png"
                                    alt="Trade"
                                    width={32}
                                    height={32}
                                  />
                                )}


                                <p className="text-xl font-semibold text-green-500 ">
                                  {TID}: {item.tradeId}
                                </p>

                              </div>

                            )}


                            { (item.status === 'paymentConfirmed') && (

                              <div className="flex flex-row items-center gap-2  bg-white px-2 py-1 rounded-md mb-4">

                                <Image
                                  src="/confirmed.png"
                                  alt="Payment Confirmed"
                                  width={50}
                                  height={50}
                                />

                                <p className="text-xl font-semibold text-green-500 ">
                                  {TID}: {item.tradeId}
                                </p>
                              </div>

                            )}


                            {item.acceptedAt && (
                              <p className="mb-2 text-sm text-zinc-400">
                                Trade started at {new Date(item.acceptedAt).toLocaleDateString() + ' ' + new Date(item.acceptedAt).toLocaleTimeString()}
                              </p>
                            )}



                            {item.status === 'cancelled' && (

                                <p className="text-sm text-zinc-400"> 
                                  Cancelled at {new Date(item?.cancelledAt)?.toLocaleString()}
                                </p>
                    
                            )}



                            {item.paymentConfirmedAt && (
                              <p className="mb-2 text-sm text-zinc-400">
                                
                                Completed at {new Date(item.paymentConfirmedAt).toLocaleDateString() + ' ' + new Date(item.paymentConfirmedAt).toLocaleTimeString()}
                            
                              </p>
                            )}



                            <div className="mt-4 flex flex-col items-start gap-2">


                              <p className="text-2xl text-zinc-400">
                                {Price}: {
                                  // currency
                                
                                  Number(item.krwAmount)?.toLocaleString('ko-KR', {
                                    style: 'currency',
                                    currency: 'KRW',
                                  })

                                }
                              </p>


                              <div className="flex flex-row items-start gap-2">

                                <p className="text-lg font-semibold text-white">{item.usdtAmount} USDT</p>

                                <p className="text-lg font-semibold text-white">{Rate}: {

                                  Number(item.krwAmount / item.usdtAmount).toFixed(2)

                                }</p>

                              </div>

                            </div>


                            {address && item.walletAddress === address && item.status !== 'cancelled' && (
                              <div className="mt-4 flex flex-col gap-2 items-start">
                                <p className="mt-2 text-sm text-zinc-400">
                                  {Payment}: {item.seller?.bankInfo?.bankName} {item.seller?.bankInfo?.accountNumber} {item.seller?.bankInfo?.accountHolder}
                                </p>
                                <p className="text-sm text-zinc-400">
                                  {Deposit_Name}: {
                                    item.buyer?.depositName ? item.buyer?.depositName : item.tradeId
                                  }
                                </p>  
                              </div>

                            )}



                       

                            
                            <div className="mt-4 flex text-lg font-semibold mb-2">
                              {
   

                                item.walletAddress === address &&
                                (item.status === 'accepted' || item.status === 'paymentRequested') ? (

                                  <div className="flex flex-row items-center gap-2">
                                    <span>{Seller}: {item.nickname}</span>
                                    <span className="text-green-500">:{Me}</span>
                                    
                                    {/* goto /sell-usdt/:id */}
                                    {/*
                                    <div
                                      className="text-sm
                                        bg-blue-500 text-white px-3 py-2 rounded-md hover:bg-blue-600 cursor-pointer"

                                      onClick={() => {
                                        router.push(
                                          "/" + params.lang + "/" + params.storecode + `/sell-usdt/${item._id}`);
                                      }}
                                    >
                                      {Go_Sell_USDT}
                                    </div>
                                    */}
                                
                                  </div>

                                ) : (item.walletAddress === address && item.status === 'ordered') ? (

                                  <div className="flex flex-row items-center gap-2">

                                    {/*
                                    <span>{Seller}: {item.nickname}</span>
                                    <span className="text-green-500">:{Me}</span>
                                    */}
                                           
                                    {/*
                                    <button
                                        disabled={cancellings[index]}
                                        className={`text-sm bg-red-500 text-white px-3 py-2 rounded-md ${cancellings[index] ? 'bg-gray-500' : ''}`}
                                        onClick={() => {
                                          // api call
                                          // cancelBuyOrder
      
                                          cancelBuyOrder(item._id, index);
      
                                        }}
                                    >
      
                                      <div className="flex flex-row text-sm items-center gap-2 ">
                                        {cancellings[index] ? (
                                          <div className="
                                            w-4 h-4
                                            border-2 border-zinc-800
                                            rounded-full
                                            animate-spin
                                          ">
                                            <Image
                                              src="/loading.png"
                                              alt="loading"
                                              width={12}
                                              height={12}
                                            />
                                          </div>
                                        ) : (
                                          <Image
                                            src="/icon-cancelled.png"
                                            alt="Cancel"
                                            width={12}
                                            height={12}
                                          />
                                        )}
                                        <div className="flex flex-row xl:flex-col items-center gap-1">
                                          <span>{Cancel_My_Order}</span>
                                        </div>
                                      </div>
                                      
                                    </button>
                                    */}

                                  </div>
  

                                ) : (
                                
                                  <>
                                  {/*
                                  <span>
                                    {Seller}: {item.nickname}
                                  </span>
                                  */}
                                  </>
                                )

                              }
                            </div>

   



                            {/* accept order button for seller */}

                            {(item.status === 'accepted' || item.status === 'paymentRequested' || item.status === 'paymentConfirmed' || item.status === 'cancelled') 
                              && (
                                <div className="w-full mt-4 mb-2 flex flex-col gap-2 items-start ">

                                  <p className="text-sm text-green-500 font-semibold">
                                    {Seller}: {
                                      item.seller.walletAddress === address ? item.seller.nickname + ' :' + Me :
                                    
                                      item.seller.nickname
                                    }
                                  </p>


                                  {item.status !== 'paymentConfirmed' && item.status !== 'cancelled'
                                  && address && item.walletAddress === address && (
                                    <>
                                    {/* chat with buyer */}

                                    {/*
                                    <button
                                      className="bg-blue-500 text-white px-2 py-1 rounded-md"
                                      onClick={() => {
                                        

                                        router.push("/" + params.lang + "/" + params.storecode + `/sell-usdt/${item._id}`);

                                      }}
                                    >
                                      
                                      판매 진행하기


                                    </button>
                                    */}
                                    
                                    </>
                                  )}



                                </div>
                            )}





                            {/* share button */}
                           


                            <div className=" mt-4 flex flex-row gap-2 items-center justify-center">

                              {item.privateSale && (
                                <Image
                                  src="/icon-private-sale.png"
                                  alt="Private Sale"
                                  width={48}
                                  height={48}
                                />
                              )}
   

                              {item.walletAddress === address && item.privateSale && (
                                <button
                                    className=" flex flex-row text-sm bg-blue-500 text-white px-2 py-1 rounded-md"
                                    onClick={() => {
                                      
                                      ////router.push(`/sell-usdt/${item._id}`);

                                      // copy to clipboard
                                      navigator.clipboard.writeText(`https://gold.goodtether.com/${params.lang}/${params.storecode}/sell-usdt/${item._id}`);
                                      toast.success('Link has been copied to clipboard');

                                    }}
                                >

                                  <Image
                                    src="/icon-share.png"
                                    alt="Share"
                                    width={16}
                                    height={16}
                                    className="mr-2"
                                  />
                                  Share
                                </button>
                              )}


                            </div>
                          




                            {/* waiting for escrow */}
                            {item.status === 'accepted' && (
                                <div className="mt-4 flex flex-row gap-2 items-center justify-start">
                                  <Image
                                    src="/loading.png"
                                    alt="Escrow"
                                    width={32}
                                    height={32}
                                    className="animate-spin"
                                  />

                                  <div className="flex flex-col gap-2 items-start">
                                    <span>
                                      {Waiting_for_seller_to_deposit}
                                      {item.usdtAmount} USDT
                                      {to_escrow}....
                                    </span>

                                    <span className="text-sm text-zinc-400">

                                      {If_the_seller_does_not_deposit_the_USDT_to_escrow}

                                      {this_trade_will_be_cancelled_in}

                                      {
                                        (1 - Math.floor((new Date().getTime() - new Date(item.acceptedAt).getTime()) / 1000 / 60 / 60) - 1) > 0
                                        ? (1 - Math.floor((new Date().getTime() - new Date(item.acceptedAt).getTime()) / 1000 / 60 / 60) - 1) + ' hours'
                                        : (60 - Math.floor((new Date().getTime() - new Date(item.acceptedAt).getTime()) / 1000 / 60) % 60) + ' minutes'

                                      }

                                    </span>
                                  </div>
                                </div>
                            )}



                            {/* waiting for payment */}
                            {item.status === 'paymentRequested' && (

                                <div className="mt-4 flex flex-col gap-2 items-start justify-start">

                                  <div className="flex flex-row items-center gap-2">

                                    <Image
                                      src="/smart-contract.png"
                                      alt="Smart Contract"
                                      width={32}
                                      height={32}
                                    />
                                    <div>{Escrow}: {item.usdtAmount} USDT</div>

                                    <button
                                      className="bg-white text-black px-2 py-2 rounded-md"
                                      onClick={() => {
                                          // new window for smart contract
                                          ///window.open(`https://arbiscan.io/tx/${item.escrowTransactionHash}`);


                                          {
                                            params.storecode === 'polygon' ? (
                                              window.open(`https://arbiscan.io/tx/${item.escrowTransactionHash}`)
                                            ) : (
                                              window.open(`https://etherscan.io/tx/${item.escrowTransactionHash}`)
                                            )
                                          }


                                      }}
                                    >
                                      <Image
                                        src="/logo-arbitrum.png"
                                        alt="Polygon"
                                        width={20}
                                        height={20}
                                      />
                                    </button>
                                  </div>

                                  <div className="flex flex-row gap-2 items-center justify-start">

                                    {/* rotate loading icon */}
                                  
                                    <Image
                                      src="/loading.png"
                                      alt="Escrow"
                                      width={32}
                                      height={32}
                                      className="animate-spin"
                                    />

                                    <div>
                                      {Waiting_for_seller_to_deposit} {item.krwAmount} KRW to {Seller}...
                                    </div>

                                  </div>

                                </div>
                            )}
                        </article>


                      </div>

                    ))}

                  </div>


                )}

            </div>





          {/* pagination */}
          {/* url query string */}
          {/* 1 2 3 4 5 6 7 8 9 10 */}
          {/* ?limit=10&page=1 */}
          {/* submit button */}
          {/* totalPage = Math.ceil(totalCount / limit) */}
          <div className="mt-4 flex flex-row items-center justify-center gap-4">


            <div className="flex flex-row items-center gap-2">
              <select
                value={limitValue}
                onChange={(e) =>

                  router.push(`/${params.lang}/admin/store/${params.storecode}/clearance?limit=${e.target.value}&page=1`)

                }

                className="text-sm bg-zinc-800 text-zinc-200 px-2 py-1 rounded-md"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>

            {/* 처음 페이지로 이동 */}
            <button
              disabled={Number(pageValue) <= 1}
              className={`text-sm text-white px-4 py-2 rounded-md ${Number(pageValue) <= 1 ? 'bg-gray-500' : 'bg-green-500 hover:bg-green-600'}`}
              onClick={() => {

                router.push(`/${params.lang}/admin/store/${params.storecode}/clearance?limit=${limitValue}&page=1`);

              }}
            >
              처음
            </button>


            <button
              disabled={Number(pageValue) <= 1}
              className={`text-sm text-white px-4 py-2 rounded-md ${Number(pageValue) <= 1 ? 'bg-gray-500' : 'bg-green-500 hover:bg-green-600'}`}
              onClick={() => {

                router.push(`/${params.lang}/admin/store/${params.storecode}/clearance?limit=${limitValue}&page=${Number(pageValue) - 1}`);

              }}
            >
              이전
            </button>


            <span className="text-sm text-zinc-500">
              {pageValue} / {Math.ceil(Number(totalCount) / Number(limitValue))}
            </span>


            <button
              disabled={Number(pageValue) >= Math.ceil(Number(totalCount) / Number(limitValue))}
              className={`text-sm text-white px-4 py-2 rounded-md ${Number(pageValue) >= Math.ceil(Number(totalCount) / Number(limitValue)) ? 'bg-gray-500' : 'bg-green-500 hover:bg-green-600'}`}
              onClick={() => {

                router.push(`/${params.lang}/admin/store/${params.storecode}/clearance?limit=${limitValue}&page=${Number(pageValue) + 1}`);

              }}
            >
              다음
            </button>

            {/* 마지막 페이지로 이동 */}
            <button
              disabled={Number(pageValue) >= Math.ceil(Number(totalCount) / Number(limitValue))}
              className={`text-sm text-white px-4 py-2 rounded-md ${Number(pageValue) >= Math.ceil(Number(totalCount) / Number(limitValue)) ? 'bg-gray-500' : 'bg-green-500 hover:bg-green-600'}`}
              onClick={() => {

                router.push(`/${params.lang}/admin/store/${params.storecode}/clearance?limit=${limitValue}&page=${Math.ceil(Number(totalCount) / Number(limitValue))}`);

              }}
            >
              마지막
            </button>

          </div>



          <div className="w-full flex flex-col items-center justify-center gap-4 p-4 bg-white shadow-md rounded-lg mt-5">
            <div className="text-sm text-zinc-600">
              © 2024 Stable Makeup. All rights reserved.
            </div>
            <div className="text-sm text-zinc-600">
              <a href={`/${params.lang}/terms-of-service`} className="text-blue-500 hover:underline">
                이용약관
              </a>
              {' | '}
              <a href={`/${params.lang}/privacy-policy`} className="text-blue-500 hover:underline">
                개인정보처리방침
              </a>
              {' | '}
              <a href={`/${params.lang}/contact`} className="text-blue-500 hover:underline">
                고객센터
              </a>
            </div>
          </div> 



            
          </div>


          <Modal isOpen={isModalOpen} onClose={closeModal}>
              <TradeDetail
                  closeModal={closeModal}
                  goChat={goChat}
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
                className="bg-green-500 text-white px-4 py-2 rounded-lg"
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

