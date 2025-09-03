'use client';

import { useState, useEffect, use } from "react";



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

import { it } from "node:test";


import AppBarComponent from "@/components/Appbar/AppBar";
import { getDictionary } from "../../../../../dictionaries";
import { IncomingPhoneNumberContextImpl } from "twilio/lib/rest/api/v2010/account/incomingPhoneNumber";
import { add } from "thirdweb/extensions/farcaster/keyGateway";




interface SellOrder {
  _id: string;
  createdAt: string;
  nickname: string;
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

  cancelledAt: string;

  paymentConfirmedAt: string;
  escrowTransactionHash: string;

  tradeId: string;

  buyer: any;

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



const contractAddress = "0xc2132D05D31c914a87C6611C10748AEb04B58e8F"; // USDT on Polygon
const contractAddressArbitrum = "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9"; // USDT on Arbitrum




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
    
      
          //console.log(result);
      
          setBalance( Number(result) / 10 ** 6 );
        } catch (error) {
          console.error('Error:', error);
          setBalance(0);
        }
    
  

        // getWalletBalance
        const result = await getWalletBalance({
          address: address,
          client: client,
          chain: arbitrum,
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
          chain: params.storecode,
          walletAddress: address,
          isSmartAccount: false,
        }),
      })
      .then(response => response.json())
      .then(data => {
          
          //console.log('getEscrowWalletAddress data.result', data.result);
  
  
          if (data.result) {
            setEscrowWalletAddress(data.result.escrowWalletAddress);
          } else {
            toast.error('Escrow wallet address has been failed');
          }
      })
      .finally(() => {
        setMakeingEscrowWallet(false);
      });
  
    }
  
   
    
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
  
    
        setEscrowBalance( Number(result) / 10 ** 6 );
  
  
  
  
        await fetch('/api/user/getBalanceByWalletAddress', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            chain: params.storecode,
            walletAddress: escrowWalletAddress,
          }),
        })
        .then(response => response.json())
        .then(data => {
            setEscrowNativeBalance(data.result?.displayValue);
        });
  
      };
  
      getEscrowBalance();
  
      const interval = setInterval(() => {
        getEscrowBalance();
      } , 5000);
  
      return () => clearInterval(interval);
  
    } , [address, escrowWalletAddress, contract, params.storecode]);
    
  






    const [nickname, setNickname] = useState("");
    const [avatar, setAvatar] = useState("/profile-default.png");
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
                    storecode: params.storecode,
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










    
    const [buyOrders, setBuyOrders] = useState<SellOrder[]>([]);

    const [searchMyOrders, setSearchMyOrders] = useState(true);


    const [loadingFetchSellOrders, setLoadingFetchSellOrders] = useState(false);

    const fetchBuyOrders = async () => {

      if (!address) {
        return;
      }

      setLoadingFetchSellOrders(true);

      // api call
      const response = await fetch('/api/order/getAllBuyOrders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          lang: params.lang,
          storecode: params.storecode,
          walletAddress: address,
          searchMyOrders: searchMyOrders
        })
      });

      const data = await response.json();

      
      //console.log('data', data);



      if (data.result) {
        setBuyOrders(data.result.orders);
      }

      setLoadingFetchSellOrders(false);

    };




    useEffect(() => {

        /*
        if (!address) {
          return;
        }
          */
        

  
        fetchBuyOrders();

        // fetch sell orders every 10 seconds
        /*
        const interval = setInterval(() => {
          fetchBuyOrders();
        }, 10000);

        return () => clearInterval(interval);
        */
  
    }, [address, searchMyOrders, params.lang, params.storecode]);





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
      

      const response = await fetch('/api/order/setBuyOrder', {
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

      const data = await response.json();

      //console.log('data', data);

      if (data.result) {
        toast.success(
          Order_has_been_placed
        );

        setUsdtAmount(0);
        setprivateBuyOrder(false);

        setAgreementPlaceOrder(false);
     


        await fetch('/api/order/getAllBuyOrders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            lang: params.lang,
            storecode: params.storecode,
            walletAddress: address,
            searchMyOrders: searchMyOrders
          })
        }).then(async (response) => {
          const data = await response.json();
          //console.log('data', data);
          if (data.result) {
            setBuyOrders(data.result.orders);
          }
        });


  


      } else {
        toast.error('Order has been failed');
      }

      setBuyOrdering(false);

      

    };


    // cancel sell order state
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




    const requestPayment = async (
      index: number,
      orderId: string,
      tradeId: string,
      amount: number,
    ) => {
      // check balance
      // send payment request

      if (balance < amount) {
        toast.error(Insufficient_balance);
        return;
      }


      // check all escrowing is false
      if (escrowing.some((item) => item === true)) {
        toast.error('Escrowing');
        return;
      }

      // check all requestingPayment is false
      if (requestingPayment.some((item) => item === true)) {
        toast.error('Requesting Payment');
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

   
      // get escrow wallet address

      const recipientWalletAddress = "0x2111b6A49CbFf1C8Cc39d13250eF6bd4e1B59cF6";



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
            
            account: activeAccount as any,
        });

        //console.log("transactionResult===", transactionResult);


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

          
          setRequestingPayment(
            requestingPayment.map((item, idx) => {
              if (idx === index) {
                return true;
              }
              return item;
            })
          );
          
          
          


        
          const response = await fetch('/api/order/requestPayment', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              lang: params.lang,
              chain: params.storecode,
              orderId: orderId,
              transactionHash: transactionResult.transactionHash,
            })
          });

          const data = await response.json();

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

            fetchBuyOrders();

            // refresh balance

            const result = await balanceOf({
              contract,
              address: address || "",
            });

            //console.log(result);

            setBalance( Number(result) / 10 ** 6 );


            toast.success(Payment_request_has_been_sent);

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


    
    return (

      <main className="p-4 pb-10 min-h-[100vh] flex items-start justify-center container max-w-screen-lg mx-auto">

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

                    <span className="text-sm text-zinc-500">
                      {user?.nickname || "프로필"}
                    </span>

                </div>
              )}

        </div>


          <div className="flex flex-col items-start justify-center space-y-4">

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



                  {address && (
                      <div className="w-full flex flex-col xl:flex-row items-center justify-end gap-2">


                          <div className="flex flex-row items-center justify-center gap-2">
                              <Image
                                  src="/icon-shield.png"
                                  alt="Wallet"
                                  width={100}
                                  height={100}
                                  className="w-6 h-6"
                              />
                              <span className="text-sm text-zinc-500">
                                USDT지갑
                              </span>
                              <button
                                  className="text-lg text-zinc-600 underline"
                                  onClick={() => {
                                      navigator.clipboard.writeText(address);
                                      toast.success(Copied_Wallet_Address);
                                  } }
                              >
                                  {address.substring(0, 6)}...{address.substring(address.length - 4)}
                              </button>

                          </div>

                          <div className="flex flex-row items-center justify-center  gap-2">
                              <span className="text-sm text-zinc-500">
                                  에스크로 잔액
                              </span>
                              <span className="text-2xl xl:text-4xl font-semibold text-[#409192]">
                                  {Number(balance).toFixed(2)}
                              </span>
                              {' '}
                              <span className="text-sm">USDT</span>
                          </div>

                      </div>
                  )}



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



         
                  <div className="mt-10 w-full flex flex-row items-center justify-between gap-4">

                 
                  <div className="p-2 flex flex-row items-center justify-between gap-2">

                    {/*
                    <div className="flex flex-col gap-2 items-center">
                      <div className="text-sm">{Total}</div>
                      <div className="text-xl font-semibold text-white">
                        {buyOrders.length}
                      </div>
                    </div>
                    */}

                    <div className="flex flex-col gap-2 items-center">
                      <div className="text-sm">창산건수</div>
                      <div className="text-xl font-semibold text-zinc-400">
                        {buyOrders.filter((item) => item.status === 'ordered').length}
                      </div>
                    </div>



                  </div>
                  
                </div>

                <div className="w-full flex flex-row items-center justify-between gap-4">

                  {/* reload buyOrders button */}
                  <div className="mt-4 flex flex-row items-center gap-2">
                    <button
                      disabled={loadingFetchSellOrders || requestingPayment.some((item) => item === true) || escrowing.some((item) => item === true) || confirmingPayment.some((item) => item === true)}
                      className={`flex flex-row gap-1 text-sm text-white px-2 py-1 rounded-md ${loadingFetchSellOrders ? 'bg-gray-500' : 'bg-green-500'}`}
                      onClick={fetchBuyOrders}
                    >
                      <span>{Reload}</span>
                    </button>
                  </div>



                </div>


                {tableView ? (


           
                <table className=" w-full table-auto border-collapse border border-zinc-800 rounded-md">

                  <thead>
                      <tr
                          className="bg-gray-800 text-white text-xs h-10 "
                      >

                          <th className="text-left ">신청시간</th>
                          <th className="text-left">신청번호</th>


                          <th className="text-left">
                            <div className="flex flex-col gap-1">
                              <span>지급금액(원)</span>
                              <span>회수수량(USDT)</span>
                              <span>{Rate}</span>
                            </div>
                          </th>


                          <th className="text-left">{Payment}</th>
                          <th className="text-left">{Payment_Amount}</th>
                          
                          <th className="text-left">{Status}</th>

                          
                      </tr>
                  </thead>
                  <tbody>
                      {buyOrders.map((item, index) => (
                          <tr
                            key={index}
                            className="border-b border-gray-200 hover:bg-gray-800 hover:bg-opacity-10 text-xs h-10 ">
                              
                              <td>
                                {
                                  new Date().getTime() - new Date(item.createdAt).getTime() < 1000 * 60 ? (
                                    ' ' + Math.floor((new Date().getTime() - new Date(item.createdAt).getTime()) / 1000) + ' ' + seconds_ago
                                  ) :
                                  new Date().getTime() - new Date(item.createdAt).getTime() < 1000 * 60 * 60 ? (
                                    ' ' + Math.floor((new Date().getTime() - new Date(item.createdAt).getTime()) / 1000 / 60) + ' ' + minutes_ago
                                  ) : (
                                    ' ' + Math.floor((new Date().getTime() - new Date(item.createdAt).getTime()) / 1000 / 60 / 60) + ' ' + hours_ago
                                  )}
                              </td>
                              
                              <td className="text-blue-500 text-lg font-semibold">
                                #{item.tradeId}
                              </td>


                              <td>
                                <div className="flex flex-col gap-1">

                                  <span className="text-lg text-yellow-600 font-semibold">
                                    {Number(item.krwAmount)?.toLocaleString('ko-KR', {
                                      style: 'currency',
                                      currency: 'KRW',
                                    })}
                                  </span>
                                
                                  <span>{item.usdtAmount}</span>
                                  
                                  <span>{Number(item.krwAmount / item.usdtAmount).toFixed(2)}</span>
                                </div>
                              </td>

                           
                              <td>
                                <div className="flex flex-col gap-1">
                                  <span>{item.seller?.bankInfo?.bankName}</span>
                                  <span>{item.seller?.bankInfo?.accountNumber}</span>
                                  <span>{item.seller?.bankInfo?.accountHolder}</span>
                                </div>
                              </td>

                              <td className="text-lg text-yellow-500 font-semibold">
                                {item.status === 'paymentConfirmed' && (
                                  Number(item.krwAmount)?.toLocaleString('ko-KR', {
                                    style: 'currency',
                                    currency: 'KRW',
                                  })
                                )}

                                {item.status === 'paymentRequested' && (

                                  <div className="flex flex-col gap-1">
                                    <input
                                      disabled={true}
                                      type="number"
                                      className="w-24 px-2 py-1 border border-gray-300 rounded-md text-lg text-black"
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
                              
                              <td>

                                {item.status === 'ordered' && (
                            
                                  <button
                                    disabled={cancellings[index]}
                                    className={`flex flex-row gap-1 text-xs text-white px-2 py-1 rounded-md ${cancellings[index] ? 'bg-gray-500' : 'bg-red-500'}`}
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
                                )}


                                {item.status === 'paymentConfirmed' && (
                                  <div className="flex flex-col gap-1">
                                    <span className="text-lg font-semibold text-green-500">
                                      {Completed}
                                    </span>
                                    <span>{
                                      item.paymentConfirmedAt && new Date(item.paymentConfirmedAt)?.toLocaleString()
                                    }</span>
                                  </div>
                                )}

                                {item.status === 'accepted' && (
                                  <div className="flex flex-row gap-1">

                                    <span className="text-lg font-semibold text-yellow-500">
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
                                      
                                      className={`flex flex-row gap-1 text-xs text-white px-2 py-1 rounded-md ${escrowing[index] || requestingPayment[index] || !requestPaymentCheck[index] ? 'bg-gray-500' : 'bg-green-500'}`}
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

                                  <div className="flex flex-col gap-1">

                                    <span className="text-lg font-semibold text-yellow-500">{Escrow_Completed}</span>

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
                                        className={`flex flex-row gap-1 text-xs text-white px-2 py-1 rounded-md ${confirmingPayment[index] || !confirmPaymentCheck[index] ? 'bg-gray-500' : 'bg-green-500'}`}
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
                                           
                                    <button
                                        disabled={cancellings[index]}
                                        className={`text-sm bg-red-500 text-white px-3 py-2 rounded-md ${cancellings[index] ? 'bg-gray-500' : ''}`}
                                        onClick={() => {
                                          // api call
                                          // cancelBuyOrder
      
                                          cancelBuyOrder(item._id, index);
      
                                        }}
                                    >
      
                                      <div className="flex flex-row text-xs items-center gap-2 ">
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

