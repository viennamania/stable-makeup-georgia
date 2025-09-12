'use client';

import { useState, useEffect, use, act } from "react";

import Image from "next/image";



// open modal

//import Modal from '@/components/modal';
import ModalUser from '@/components/modal-user';

import { useRouter }from "next//navigation";


import { toast } from 'react-hot-toast';

import { client } from "../../../client";



import {
  getContract,
  sendAndConfirmTransaction,
  sendTransaction,
  waitForReceipt,
} from "thirdweb";


import {
  ConnectButton,
  useActiveAccount,
  useActiveWallet,
  useWalletBalance,

  useSetActiveWallet,

  useConnectedWallets,


} from "thirdweb/react";

import {
  inAppWallet,
  createWallet,
} from "thirdweb/wallets";





import {
  getUserPhoneNumber,
  getUserEmail,
} from "thirdweb/wallets/in-app";


import { balanceOf, transfer } from "thirdweb/extensions/erc20";
import { add } from "thirdweb/extensions/farcaster/keyGateway";
 


import AppBarComponent from "@/components/Appbar/AppBar";
import { getDictionary } from "../../../dictionaries";

import { ClassNames } from "@emotion/react";


import useSound from 'use-sound';


import { useSearchParams } from 'next/navigation';

import { version } from "../../../config/version";



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

  settlement: any;

  store: any;


}


/*
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
*/

const wallets = [
  inAppWallet({
    auth: {
      options: [
        "google",
      ],
    },
  }),
];





export default function Index({ params }: any) {

  const searchParams = useSearchParams();
 
  const wallet = searchParams.get('wallet');


  // limit, page number params

  const limit = searchParams.get('limit') || 10;
  const page = searchParams.get('page') || 1;



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


 
  const activeWallet = useActiveWallet();




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
    Sell: "",
    Amount: "",
    Price: "",
    Total: "",
    Orders: "",
    Trades: "",
    Search_my_trades: "",

    Anonymous: "",

    Seller: "",
    Buyer: "",
    Me: "",

    Buy_USDT: "",
    Rate: "",
    Payment: "",
    Bank_Transfer: "",

    I_agree_to_the_terms_of_trade: "",
    I_agree_to_cancel_the_trade: "",

    Opened_at: "",
    Cancelled_at: "",
    Completed_at: "",


    Opened: "",
    Completed: "",
    Cancelled: "",


    Waiting_for_seller_to_deposit: "",

    to_escrow: "",
    If_the_seller_does_not_deposit_the_USDT_to_escrow: "",
    this_trade_will_be_cancelled_in: "",

    Cancel_My_Trade: "",


    Order_accepted_successfully: "",
    Order_has_been_cancelled: "",
    My_Order: "",

    hours: "",
    minutes: "",
    seconds: "",

    hours_ago: "",
    minutes_ago: "",
    seconds_ago: "",

    Order_Opened: "",
    Trade_Started: "",
    Expires_in: "",

    Accepting_Order: "",

    Escrow: "",

    Chat_with_Seller: "",
    Chat_with_Buyer: "",

    Table_View: "",

    TID: "",

    Status: "",

    Sell_USDT: "",

    Buy_Order_Opened: "",
  
    Insufficient_balance: "",


    Request_Payment: "",

    Payment_has_been_confirmed: "",

    Confirm_Payment: "",

    Escrow_Completed: "",

    Buy_Order_Accept: "",

    Payment_Amount: "",

    Buy_Amount: "",

    Deposit_Name: "",

    My_Balance: "",

    Make_Escrow_Wallet: "",
    Escrow_Wallet_Address_has_been_created: "",
    Failed_to_create_Escrow_Wallet_Address: "",

    Newest_order_has_been_arrived: "",
    Payment_request_has_been_sent: "",
    Escrow_balance_is_less_than_payment_amount: "",

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
    Buy,
    Sell,
    Amount,
    Price,
    Total,
    Orders,
    Trades,
    Search_my_trades,

    Anonymous,

    Seller,
    Buyer,
    Me,

    Buy_USDT,
    Rate,
    Payment,
    Bank_Transfer,
    I_agree_to_the_terms_of_trade,
    I_agree_to_cancel_the_trade,

    Opened_at,
    Cancelled_at,
    Completed_at,

    Opened,
    Completed,
    Cancelled,

    Waiting_for_seller_to_deposit,

    to_escrow,

    If_the_seller_does_not_deposit_the_USDT_to_escrow,
    this_trade_will_be_cancelled_in,

    Cancel_My_Trade,

    Order_accepted_successfully,
    Order_has_been_cancelled,
    My_Order,

    hours,
    minutes,
    seconds,

    hours_ago,
    minutes_ago,
    seconds_ago,

    Order_Opened,
    Trade_Started,
    Expires_in,

    Accepting_Order,

    Escrow,

    Chat_with_Seller,
    Chat_with_Buyer,

    Table_View,

    TID,

    Status,

    Sell_USDT,

    Buy_Order_Opened,

    Insufficient_balance,

    Request_Payment,

    Payment_has_been_confirmed,

    Confirm_Payment,

    Escrow_Completed,

    Buy_Order_Accept,

    Payment_Amount,

    Buy_Amount,

    Deposit_Name,

    My_Balance,

    Make_Escrow_Wallet,
    Escrow_Wallet_Address_has_been_created,
    Failed_to_create_Escrow_Wallet_Address,

    Newest_order_has_been_arrived,
    Payment_request_has_been_sent,
    Escrow_balance_is_less_than_payment_amount,

    Copied_Wallet_Address,

  } = data;




  const router = useRouter();



  /*
  const setActiveAccount = useSetActiveWallet();
 

  const connectWallets = useConnectedWallets();

  const smartConnectWallet = connectWallets?.[0];
  const inAppConnectWallet = connectWallets?.[1];
  */


  const activeAccount = useActiveAccount();

  const address = activeAccount?.address;



  const [phoneNumber, setPhoneNumber] = useState("");

  

  


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

  
      console.log('getBalance result', result);
  
       if (chain === 'bsc') {
        setBalance( Number(result) / 10 ** 18 );
      } else {
        setBalance( Number(result) / 10 ** 6 );
      }
      /*
      await fetch('/api/user/getBalanceByWalletAddress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          storecode: params.center,
          walletAddress: address,
        }),
      })

      .then(response => response.json())

      .then(data => {
          setNativeBalance(data.result?.displayValue);
      });
      */



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
        storecode: params.center,
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





  

  // get User by wallet address
  const [isAdmin, setIsAdmin] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [loadingUser, setLoadingUser] = useState(true);





  useEffect(() => {

    if (address) {

      getUserEmail({ client }).then((email) => {
        console.log('email', email);

        if (email) {
          

          fetch('/api/user/setUserVerified', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            // storecode, walletAddress, nickname, mobile, email
            body: JSON.stringify({
              storecode: params.center,
              walletAddress: address,
              nickname: email,
              mobile: '+82',
              email: email,
            }),
          })
          .then(response => response.json())
          .then(data => {
              //console.log('data', data);



              fetch('/api/user/getUser', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  storecode: params.center,
                  walletAddress: address,
                }),
              })
              .then(response => response.json())
              .then(data => {
                  //console.log('data', data);
                  setUser(data.result);
              })

          });



        }

      });

  

      //const phoneNumber = await getUserPhoneNumber({ client });
      //setPhoneNumber(phoneNumber);


      getUserPhoneNumber({ client }).then((phoneNumber) => {
        setPhoneNumber(phoneNumber || "");
      });

    }

  } , [address]);



  
  useEffect(() => {

    if (!address) {

      setUser(null);
      return;
    }

    setLoadingUser(true);

    fetch('/api/user/getUser', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            storecode: params.center,
            walletAddress: address,
        }),
    })
    .then(response => response.json())
    .then(data => {
        
        /////console.log('data.result', data.result);


        setUser(data.result);

        setEscrowWalletAddress(data.result.escrowWalletAddress);

        setIsAdmin(data.result?.role === "admin");

    })
    .catch((error) => {
        console.error('Error:', error);
        setUser(null);
        setEscrowWalletAddress('');
        setIsAdmin(false);
    });

    setLoadingUser(false);


  } , [address, params.center]);

  


  const [isPlaying, setIsPlaying] = useState(false);
  //const [play, { stop }] = useSound(galaxySfx);
  const [play, { stop }] = useSound('/ding.mp3');

  function playSong() {
    setIsPlaying(true);
    play();
  }

  function stopSong() {
    setIsPlaying(false);
    stop();
  }






  const [isModalOpen, setModalOpen] = useState(false);

  const closeModal = () => setModalOpen(false);
  const openModal = () => setModalOpen(true);

  


  const [searchMyOrders, setSearchMyOrders] = useState(false);



  // limit number
  const [limitValue, setLimitValue] = useState(limit || 20);
  useEffect(() => {
    setLimitValue(limit || 20);
  }, [limit]);

  // page number
  const [pageValue, setPageValue] = useState(page || 1);
  useEffect(() => {
    setPageValue(page || 1);
  }, [page]);





  const fromDate = searchParams.get('fromDate') || '';
  const toDate = searchParams.get('toDate') || '';


// search form date to date
/*
  const [searchFromDate, setSearchFromDate] = useState("");
  // set today's date in YYYY-MM-DD format
  // korean timezone
  useEffect(() => {

    // get today's date in Korean timezone
    const today = new Date();
    today.setHours(today.getHours() + 9); // Adjust for Korean timezone (UTC+9)

    const formattedDate = today.toISOString().split('T')[0]; // YYYY-MM-DD format
    setSearchFromDate(formattedDate);
  }, []);
  */

  // get today's date in Korean timezone
  const today = new Date();
  today.setHours(today.getHours() + 9); // Adjust for Korean timezone (UTC+9)

  const formattedDate = today.toISOString().split('T')[0]; // YYYY-MM-DD format

  const [searchFromDate, setSearchFromDate] = useState(fromDate || formattedDate);
  useEffect(() => {
    fromDate && setSearchFromDate(fromDate);
  }, [fromDate]);

  /*
  const [searchToDate, setSearchToDate] = useState("");

  // set today's date in YYYY-MM-DD format
  useEffect(() => {
    const today = new Date();
    today.setHours(today.getHours() + 9); // Adjust for Korean timezone (UTC+9)
    
    const formattedDate = today.toISOString().split('T')[0]; // YYYY-MM-DD format
    setSearchToDate(formattedDate);
  }, []);
  */

  const [searchToDate, setSearchToDate] = useState(toDate || formattedDate);
  useEffect(() => {
    toDate && setSearchToDate(toDate);
  }, [toDate]);






  const [totalCount, setTotalCount] = useState(0);

  const [totalClearanceCount, setTotalClearanceCount] = useState(0);
  const [totalClearanceAmount, setTotalClearanceAmount] = useState(0);
  const [totalClearanceAmountKRW, setTotalClearanceAmountKRW] = useState(0);
    
  const [buyOrders, setBuyOrders] = useState<BuyOrder[]>([]);


  ///console.log('buyOrders', buyOrders);

  



  /* agreement for trade */
  const [agreementForTrade, setAgreementForTrade] = useState([] as boolean[]);
  for (let i = 0; i < 100; i++) {
      agreementForTrade.push(false);
  }
  /*
  useEffect(() => {
      setAgreementForTrade (
          buyOrders.map((item, idx) => {
              return false;
          })
      );
  } , [buyOrders]);
    */
    
    
  // initialize false array of 100
  const [acceptingBuyOrder, setAcceptingBuyOrder] = useState([] as boolean[]);
  for (let i = 0; i < 100; i++) {
      acceptingBuyOrder.push(false);
  }

   



   
    /*
    useEffect(() => {
        setAcceptingBuyOrder (
            buyOrders.map((item, idx) => {
                return false;
            })
        );
    } , [buyOrders]);
     */


    /*
    // sms receiver mobile number array
    const [smsReceiverMobileNumbers, setSmsReceiverMobileNumbers] = useState([] as string[]);
    useEffect(() => {
        setSmsReceiverMobileNumbers(
            buyOrders.map((item, idx) => {
                return user?.mobile || '';
            })
        );
    } , [buyOrders, user]);
    */

    const [smsReceiverMobileNumber, setSmsReceiverMobileNumber] = useState('');
    useEffect(() => {
        setSmsReceiverMobileNumber(phoneNumber);
    } , [phoneNumber]);



    const acceptBuyOrder = (
      index: number,
      orderId: string,
      smsNumber: string,
    ) => {



      console.log('acceptBuyOrder index', index);



        if (!address) {
            toast.error('Please connect your wallet');
            return;
        }

        /*
        if (!escrowWalletAddress || escrowWalletAddress === '') {
          toast.error('에스크로 지갑이 없습니다.');
          return;
        }
        */

        setAcceptingBuyOrder (
          acceptingBuyOrder.map((item, idx) => idx === index ? true : item)
        );



        /*
            lang,
            storecode,
            orderId,
            sellerWalletAddress,
            sellerStorecode,
            sellerMemo,
          */



        fetch('/api/order/acceptBuyOrder', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                lang: params.lang,
                storecode: params.center,
                orderId: orderId,
                sellerWalletAddress: address,
                sellerStorecode: params.center,

                /*
                sellerNickname: user ? user.nickname : '',
                sellerAvatar: user ? user.avatar : '',

                //buyerMobile: user.mobile,

                sellerMobile: smsNumber,
                */



                seller: user?.seller,

            }),
        })
        .then(response => response.json())
        .then(data => {

            console.log('data', data);

            //setBuyOrders(data.result.orders);
            //openModal();

            toast.success(Order_accepted_successfully);

            playSong();



            fetch('/api/order/getAllCollectOrdersForUser', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(
                  {
                    storecode: params.center,
                    limit: Number(limit),
                    page: Number(page),
                    walletAddress: address,
                    searchMyOrders: searchMyOrders,

                    fromDate: searchFromDate,
                    toDate: searchToDate,
                    searchWithdrawDepositName: searchWithdrawDepositName,
                  }
                ),
            })
            .then(response => response.json())
            .then(data => {
                ///console.log('data', data);
                setBuyOrders(data.result.orders);

                setTotalCount(data.result.totalCount);

                setTotalClearanceCount(data.result.totalClearanceCount);
                setTotalClearanceAmount(data.result.totalClearanceAmount);
                setTotalClearanceAmountKRW(data.result.totalClearanceAmountKRW);
            })



        })
        .catch((error) => {
            console.error('Error:', error);
        })
        .finally(() => {


            setAgreementForTrade (
              agreementForTrade.map((item, idx) => idx === index ? false : item)
            );


            setAcceptingBuyOrder (
                acceptingBuyOrder.map((item, idx) => idx === index ? false : item)
            );

        } );


    }



  // agreement for cancel trade
  const [agreementForCancelTrade, setAgreementForCancelTrade] = useState([] as boolean[]);
  for (let i = 0; i < 100; i++) {
    agreementForCancelTrade.push(false);
  }
  /*
  useEffect(() => {
    setAgreementForCancelTrade(
      buyOrders.map(() => false)
    );
  } , [buyOrders]);
   */






    // cancel sell order state
    const [cancellings, setCancellings] = useState([] as boolean[]);
    for (let i = 0; i < 100; i++) {
      cancellings.push(false);
    }
    /*
    useEffect(() => {
      setCancellings(buyOrders.map(() => false));
    }, [buyOrders]);
    */


    const cancelTrade = async (orderId: string, index: number) => {

      if (cancellings[index]) {
        return;
      }

      setCancellings(
        cancellings.map((item, i) => i === index ? true : item)
      );


      const response = await fetch('/api/order/cancelTradeBySeller', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          storecode: params.center,
          orderId: orderId,
          walletAddress: address,
        })
      });

      const data = await response.json();

      ///console.log('data', data);

      if (data.result) {

        toast.success(Order_has_been_cancelled);

        playSong();


        await fetch('/api/order/getAllCollectOrdersForUser', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(
            {
              storecode: params.center,
              limit: Number(limit),
              page: Number(page),
              walletAddress: address,
              searchMyOrders: searchMyOrders,

              fromDate: searchFromDate,
              toDate: searchToDate,
              searchWithdrawDepositName: searchWithdrawDepositName,
            }
          )
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


      setAgreementForCancelTrade(
        agreementForCancelTrade.map((item, i) => i === index ? false : item)
      );

      setCancellings(
        cancellings.map((item, i) => i === index ? false : item)
      );

    }









    // request payment check box
    const [requestPaymentCheck, setRequestPaymentCheck] = useState([] as boolean[]);
    for (let i = 0; i < 100; i++) {
      requestPaymentCheck.push(false);
    }

    /*
    useEffect(() => {
        
        setRequestPaymentCheck(
          new Array(buyOrders.length).fill(false)
        );
  
    } , [buyOrders]);
     */
    




    // array of escrowing
    const [escrowing, setEscrowing] = useState([] as boolean[]);
    for (let i = 0; i < 100; i++) {
      escrowing.push(false);
    }

    /*
    useEffect(() => {
        
        setEscrowing(
          new Array(buyOrders.length).fill(false)
        );
  
    } , [buyOrders]);
     */

    // array of requestingPayment
    const [requestingPayment, setRequestingPayment] = useState([] as boolean[]);
    for (let i = 0; i < 100; i++) {
      requestingPayment.push(false);
    }


    /*
    useEffect(() => {

      setRequestingPayment(

        new Array(buyOrders.length).fill(false)

      );

    } , [buyOrders]);
      */


    // without escrow
    const [isWithoutEscrow, setIsWithoutEscrow] = useState(true);


    const requestPayment = async (
      index: number,
      orderId: string,
      tradeId: string,
      amount: number,
    ) => {


      // check escrowWalletAddress

      if (!isWithoutEscrow && escrowWalletAddress === '') {
        toast.error('Recipient wallet address is empty');
        return;
      }

      // check balance
      // send payment request

      if (balance < amount) {
        toast.error(Insufficient_balance);
        return;
      }


      // check all escrowing is false
      if (!isWithoutEscrow && escrowing.some((item) => item === true)) {
        toast.error('Escrowing');
        return;
      }




      // check all requestingPayment is false
      if (requestingPayment.some((item) => item === true)) {
        toast.error('Requesting Payment');
        return;
      }


      if (!isWithoutEscrow) {


        setEscrowing(
          escrowing.map((item, idx) =>  idx === index ? true : item) 
        );
    

   


        // send USDT
        // Call the extension function to prepare the transaction
        const transaction = transfer({
          contract,
          to: escrowWalletAddress,
          amount: amount,
        });
        


        try {


          /*
          const transactionResult = await sendAndConfirmTransaction({
              account: smartAccount as any,
              transaction: transaction,
          });

          //console.log("transactionResult===", transactionResult);
          */

          const { transactionHash } = await sendTransaction({
            
            account: activeAccount as any,

            transaction,
          });

          console.log("transactionHash===", transactionHash);


          /*
          const transactionResult = await waitForReceipt({
            client,
            arbitrum,
            maxBlocksWaitTime: 1,
            transactionHash: transactionHash,
          });


          console.log("transactionResult===", transactionResult);
          */
    

          // send payment request

          //if (transactionResult) {
          if (transactionHash) {

            
            setRequestingPayment(
              requestingPayment.map((item, idx) => idx === index ? true : item)
            );
            
            
            


          
            const response = await fetch('/api/order/buyOrderRequestPayment', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                lang: params.lang,
                storecode: params.center,
                orderId: orderId,
                //transactionHash: transactionResult.transactionHash,
                transactionHash: transactionHash,
              })
            });

            const data = await response.json();

            //console.log('/api/order/buyOrderRequestPayment data====', data);


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

              toast.success(Payment_request_has_been_sent);

              //toast.success('Payment request has been sent');

              playSong();
              

              
              //fetchBuyOrders();
              // fetch Buy Orders
              await fetch('/api/order/getAllCollectOrdersForUser', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(
                  {
                    storecode: params.center,
                    limit: Number(limit),
                    page: Number(page),
                    walletAddress: address,
                    searchMyOrders: searchMyOrders,

                    fromDate: searchFromDate,
                    toDate: searchToDate,
                    searchWithdrawDepositName: searchWithdrawDepositName,
                  }
                ),
              })
              .then(response => response.json())
              .then(data => {
                  ///console.log('data', data);
                  setBuyOrders(data.result.orders);

                  setTotalCount(data.result.totalCount);

                  setTotalClearanceCount(data.result.totalClearanceCount);
                  setTotalClearanceAmount(data.result.totalClearanceAmount);
                  setTotalClearanceAmountKRW(data.result.totalClearanceAmountKRW);
              })


              // refresh balance

              const result = await balanceOf({
                contract,
                address: address || "",
              });

              //console.log(result);

              setBalance( Number(result) / 10 ** 6 );


            

            } else {
              toast.error('Payment request has been failed');
            }

          }


        } catch (error) {
          console.error('Error:', error);

          toast.error('Payment request has been failed');
        }

        setEscrowing(
          escrowing.map((item, idx) =>  idx === index ? false : item)
        );



      } else {
        // without escrow


        try {

          const transactionHash = '0x';


          setRequestingPayment(
            requestingPayment.map((item, idx) => idx === index ? true : item)
          );
          
          
          


        
          const response = await fetch('/api/order/buyOrderRequestPayment', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              lang: params.lang,
              storecode: params.center,
              orderId: orderId,
              //transactionHash: transactionResult.transactionHash,
              transactionHash: transactionHash,
            })
          });

          const data = await response.json();


          if (data.result) {

            toast.success(Payment_request_has_been_sent);

            //toast.success('Payment request has been sent');

            playSong();
            

            
            //fetchBuyOrders();
            // fetch Buy Orders
            await fetch('/api/order/getAllCollectOrdersForUser', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(
                {
                  storecode: params.center,
                  limit: Number(limit),
                  page: Number(page),
                  walletAddress: address,
                  searchMyOrders: searchMyOrders,

                  fromDate: searchFromDate,
                  toDate: searchToDate,
                  searchWithdrawDepositName: searchWithdrawDepositName,
                }
              ),
            })
            .then(response => response.json())
            .then(data => {
                ///console.log('data', data);
                setBuyOrders(data.result.orders);

                setTotalCount(data.result.totalCount);

                setTotalClearanceCount(data.result.totalClearanceCount);
                setTotalClearanceAmount(data.result.totalClearanceAmount);
                setTotalClearanceAmountKRW(data.result.totalClearanceAmountKRW);
            })


            // refresh balance

            const result = await balanceOf({
              contract,
              address: address || "",
            });

            //console.log(result);

            setBalance( Number(result) / 10 ** 6 );


          } else {
            toast.error('결제요청이 실패했습니다.');
          }
 
        } catch (error) {
          console.error('Error:', error);

          toast.error('결제요청이 실패했습니다.');
        }

        
      } // end of without escrow


      setRequestingPayment(
        requestingPayment.map((item, idx) => idx === index ? false : item)
      );







    }










  // array of confirmingPayment

  const [confirmingPayment, setConfirmingPayment] = useState([] as boolean[]);
  for (let i = 0; i < 100; i++) {
    confirmingPayment.push(false);
  }

  /*
  useEffect(() => {
      
      setConfirmingPayment(
        new Array(buyOrders.length).fill(false)
      );

  } , [buyOrders]);
   */


  // confirm payment check box
  const [confirmPaymentCheck, setConfirmPaymentCheck] = useState([] as boolean[]);
  for (let i = 0; i < 100; i++) {
    confirmPaymentCheck.push(false);
  }

  /*
  useEffect(() => {
      
      setConfirmPaymentCheck(
        new Array(buyOrders.length).fill(false)
      );

  } , [buyOrders]);
    */




  // payment amoount array
  const [paymentAmounts, setPaymentAmounts] = useState([] as number[]);
  useEffect(() => {

    // default payment amount is from sellOrders krwAmount
      
    setPaymentAmounts(
      buyOrders.map((item) => item.krwAmount)
      );

  } , [buyOrders]);

  const [paymentAmountsUsdt, setPaymentAmountsUsdt] = useState([] as number[]);
  useEffect(() => {

    // default payment amount is from sellOrders krwAmount
      
    setPaymentAmountsUsdt(
      buyOrders.map((item) => item.usdtAmount)
      );

  } , [buyOrders]);



  // confirm payment
  const confirmPayment = async (

    index: number,
    orderId: string,
    paymentAmount: number,
    paymentAmountUsdt: number,

  ) => {
    // confirm payment
    // send usdt to buyer wallet address


    // if escrowWalletAddress balance is less than paymentAmount, then return

    //console.log('escrowBalance', escrowBalance);
    //console.log('paymentAmountUsdt', paymentAmountUsdt);
    
    /*
    if (escrowBalance < paymentAmountUsdt) {
      toast.error(Escrow_balance_is_less_than_payment_amount);
      return;
    }
    
    // if escrowNativeBalance is less than 0.1, then return
    if (escrowNativeBalance < 0.1) {
      toast.error('ETH balance is less than 0.1');
      return;
    }
      */

    if (!address) {
      toast.error('Please connect your wallet');
      return;
    }

    /*
    if (isWithoutEscrow && balance < paymentAmountUsdt) {
      toast.error(Insufficient_balance);
      return;
    }
    

    if (!isWithoutEscrow && escrowBalance < paymentAmountUsdt) {
      toast.error(Escrow_balance_is_less_than_payment_amount);
      return;
    }
    */

    if (confirmingPayment[index]) {
      return;
    }

    setConfirmingPayment(
      confirmingPayment.map((item, idx) =>  idx === index ? true : item)
    );


    try {

      
      if (!isWithoutEscrow) {
      
        const response = await fetch('/api/order/buyOrderConfirmPayment', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            lang: params.lang,
            storecode: params.center,
            orderId: orderId,
            paymentAmount: paymentAmount,
            ///isSmartAccount: activeWallet === inAppConnectWallet ? false : true,
            isSmartAccount: false,
          })
        });

        const data = await response.json();

        //console.log('data', data);

        if (data.result) {
          
          ///fetchBuyOrders();

          // fetch Buy Orders
          await fetch('/api/order/getAllCollectOrdersForUser', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(
              {
                storecode: params.center,
                limit: Number(limit),
                page: Number(page),
                walletAddress: address,
                searchMyOrders: searchMyOrders,

                fromDate: searchFromDate,
                toDate: searchToDate,
                searchWithdrawDepositName: searchWithdrawDepositName,
              }
            ),
          })
          .then(response => response.json())
          .then(data => {
              ///console.log('data', data);
              setBuyOrders(data.result.orders);

              setTotalCount(data.result.totalCount);

              setTotalClearanceCount(data.result.totalClearanceCount);
              setTotalClearanceAmount(data.result.totalClearanceAmount);
              setTotalClearanceAmountKRW(data.result.totalClearanceAmountKRW);
          })



          toast.success(Payment_has_been_confirmed);

          playSong();


        } else {
          toast.error('결제확인이 실패했습니다.');
        }

      } else {


        // transfer my wallet to seller wallet address

        
        //const sellerWalletAddress = buyOrders[index].store.sellerWalletAddress;
        //const sellerWalletAddress = "0x3f1e7D26A2704BE994aF84cEbf19BA9683E23666"; // for test

        //const sellerWalletAddress = buyOrders[index].store.sellerWalletAddress;

        const buyerWalletAddress = buyOrders[index].walletAddress;

        //alert('sellerWalletAddress: ' + sellerWalletAddress);

        console.log('buyerWalletAddress', buyerWalletAddress);

        const usdtAmount = buyOrders[index].usdtAmount;

        const transaction = transfer({
          contract,
          to: buyerWalletAddress,
          amount: usdtAmount,
        });


        try {

          
          const { transactionHash } = await sendTransaction({
            account: activeAccount as any,
            transaction,
          });
          
          /*
         const { transactionHash } = await sendAndConfirmTransaction({
            account: activeAccount as any,
            transaction,
          });
          */

          console.log("transactionHash===", transactionHash);



          if (transactionHash) {

            const response = await fetch('/api/order/buyOrderConfirmPaymentWithoutEscrow', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                lang: params.lang,
                storecode: params.center,
                orderId: orderId,
                paymentAmount: paymentAmount,
                transactionHash: transactionHash,
                ///isSmartAccount: activeWallet === inAppConnectWallet ? false : true,
                isSmartAccount: false,
              })
            });

            const data = await response.json();

            //console.log('data', data);

            if (data.result) {
              
              ///fetchBuyOrders();

              // fetch Buy Orders
              await fetch('/api/order/getAllCollectOrdersForUser', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(
                  {
                    storecode: params.center,
                    limit: Number(limit),
                    page: Number(page),
                    walletAddress: address,
                    searchMyOrders: searchMyOrders,

                    fromDate: searchFromDate,
                    toDate: searchToDate,
                    searchWithdrawDepositName: searchWithdrawDepositName,
                  }
                ),
              })
              .then(response => response.json())
              .then(data => {
                  ///console.log('data', data);
                  setBuyOrders(data.result.orders);

                  setTotalCount(data.result.totalCount);

                  setTotalClearanceCount(data.result.totalClearanceCount);
                  setTotalClearanceAmount(data.result.totalClearanceAmount);
                  setTotalClearanceAmountKRW(data.result.totalClearanceAmountKRW);
              })

              toast.success(Payment_has_been_confirmed);
              playSong();
            } else {
              toast.error('결제확인이 실패했습니다.');
            }


          } else {
            toast.error('결제확인이 실패했습니다.');
          }

        } catch (error) {
          console.error('Error:', error);
          toast.error('결제확인이 실패했습니다.' + JSON.stringify(error));
        }

      }



    } catch (error) {
      console.error('Error:', error);
      toast.error('결제확인이 실패했습니다.');
    }


    setConfirmingPayment(
      confirmingPayment.map((item, idx) => idx === index ? false : item)
    );

    
    setConfirmPaymentCheck(
      confirmPaymentCheck.map((item, idx) => idx === index ? false : item)
    );

  }



  
  // array of rollbackingPayment
  const [rollbackingPayment, setRollbackingPayment] = useState([] as boolean[]);
  for (let i = 0; i < 100; i++) {
    rollbackingPayment.push(false);
  }
  /*
  useEffect(() => {
      
      setRollbackingPayment(
        new Array(buyOrders.length).fill(false)
      );

  } , [buyOrders]);
   */

  // rollback payment check box
  const [rollbackPaymentCheck, setRollbackPaymentCheck] = useState([] as boolean[]);
  for (let i = 0; i < 100; i++) {
    rollbackPaymentCheck.push(false);
  }
  /*
  useEffect(() => {
      
      setRollbackPaymentCheck(
        new Array(buyOrders.length).fill(false)
      );

  } , [buyOrders]);
   */


  // rollback payment
  const rollbackPayment = async (

    index: number,
    orderId: string,
    paymentAmount: number,
    paymentAmountUsdt: number,

  ) => {
    // rollback payment
    // send usdt to seller wallet address

    if (rollbackingPayment[index]) {
      return;
    }


    /*
    // if escrowWalletAddress balance is less than paymentAmount, then return
    if (escrowBalance < paymentAmountUsdt) {
      toast.error(Escrow_balance_is_less_than_payment_amount);
      return;
    }

    // if escrowNativeBalance is less than 0.1, then return
    if (escrowNativeBalance < 0.1) {
      toast.error('ETH balance is less than 0.1');
      return;
    }
      */
    


    setRollbackingPayment(
      rollbackingPayment.map((item, idx) => idx === index ? true : item)
    );


    try {

      const response = await fetch('/api/order/buyOrderRollbackPayment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          lang: params.lang,
          storecode: params.center,
          orderId: orderId,
          paymentAmount: paymentAmount,
          ///isSmartAccount: activeWallet === inAppConnectWallet ? false : true,
          isSmartAccount: false,
        })
      });

      const data = await response.json();

      //console.log('data', data);

      if (data.result) {


        toast.success('Payment has been rollbacked');

        playSong();

        
        ///fetchBuyOrders();

        // fetch Buy Orders
        await fetch('/api/order/getAllCollectOrdersForUser', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(
            {
              storecode: params.center,
              limit: Number(limit),
              page: Number(page),
              walletAddress: address,
              searchMyOrders: searchMyOrders,

              fromDate: searchFromDate,
              toDate: searchToDate,
              searchWithdrawDepositName: searchWithdrawDepositName,
            }
          ),
        })
        .then(response => response.json())
        .then(data => {
            ///console.log('data', data);
            setBuyOrders(data.result.orders);

            setTotalCount(data.result.totalCount);

            setTotalClearanceCount(data.result.totalClearanceCount);
            setTotalClearanceAmount(data.result.totalClearanceAmount);
            setTotalClearanceAmountKRW(data.result.totalClearanceAmountKRW);
        })

      }

    } catch (error) {
      console.error('Error:', error);
      toast.error('Rollback payment has been failed');
    }



    setRollbackingPayment(
      rollbackingPayment.map((item, idx) => idx === index ? false : item)
    );

    setRollbackPaymentCheck(
      rollbackPaymentCheck.map((item, idx) => idx === index ? false : item)
    );


  }




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
          storecode: params.center,
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






  const [fetchingBuyOrders, setFetchingBuyOrders] = useState(false);

  const [latestBuyOrder, setLatestBuyOrder] = useState<BuyOrder | null>(null);

  const [searchWithdrawDepositName, setSearchWithdrawDepositName] = useState("");


  const fetchBuyOrders = async () => {

    console.log('fetchBuyOrders===============>');
    //console.log("address=", address);
    //console.log("searchMyOrders=", searchMyOrders);


    //console.log('acceptingBuyOrder', acceptingBuyOrder);
    //console.log('escrowing', escrowing);
    //console.log('requestingPayment', requestingPayment);
    //console.log('confirmingPayment', confirmingPayment);



    // check all agreementForTrade is false

    if (
      //!address || !searchMyOrders
      agreementForTrade.some((item) => item === true)
      || acceptingBuyOrder.some((item) => item === true)
      || agreementForCancelTrade.some((item) => item === true)
      || confirmPaymentCheck.some((item) => item === true)
      || rollbackPaymentCheck.some((item) => item === true)
      || acceptingBuyOrder.some((item) => item === true)
      || escrowing.some((item) => item === true)
      || requestingPayment.some((item) => item === true)
      || confirmingPayment.some((item) => item === true)
      || rollbackingPayment.some((item) => item === true)
    ) {
      return;
    }


    
    setFetchingBuyOrders(true);

    const response = await fetch('/api/order/getAllCollectOrdersForUser', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(

          {
            storecode: params.center,
            limit: Number(limit),
            page: Number(page),
            walletAddress: address,
            searchMyOrders: searchMyOrders,

            fromDate: searchFromDate,
            toDate: searchToDate,

            searchWithdrawDepositName: searchWithdrawDepositName,

          }

      ),
    });

    if (!response.ok) {
      console.error('Failed to fetch buy orders');
      setFetchingBuyOrders(false);
      toast.error('주문을 불러오는 데 실패했습니다');
      return;
    }

    setFetchingBuyOrders(false);


    const data = await response.json();


    setBuyOrders(data.result.orders);

    setTotalCount(data.result.totalCount);
    
    setTotalClearanceCount(data.result.totalClearanceCount);
    setTotalClearanceAmount(data.result.totalClearanceAmount);
    setTotalClearanceAmountKRW(data.result.totalClearanceAmountKRW);


  }



  useEffect(() => {





    if (!address || !searchFromDate || !searchToDate) {
      return;
    }


    fetchBuyOrders();


    // interval to fetch latest buy order every 5 seconds
    const interval = setInterval(() => {
      fetchBuyOrders();
    }, 5000);
    return () => clearInterval(interval);

    

  } , [
    limit,
    page,
    address,
    searchMyOrders,
    agreementForTrade,
    acceptingBuyOrder,
    escrowing,
    requestingPayment,
    confirmingPayment,
    rollbackingPayment,
    agreementForCancelTrade,
    confirmPaymentCheck,
    rollbackPaymentCheck,

    latestBuyOrder,
    //playSong,

    params.center,
    searchFromDate,
    searchToDate,
    searchWithdrawDepositName,
]);






  const [escrowBalance, setEscrowBalance] = useState(0);
  const [todayMinusedEscrowAmount, setTodayMinusedEscrowAmount] = useState(0);

  useEffect(() => {

    const fetchEscrowBalance = async () => {
      if (!params.center) {
        return;
      }

      const response = await fetch('/api/store/getEscrowBalance', {
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
        return;
      }



      const data = await response.json();

      setEscrowBalance(data.result.escrowBalance);
      setTodayMinusedEscrowAmount(data.result.todayMinusedEscrowAmount);

    }


    fetchEscrowBalance();

    
    
    const interval = setInterval(() => {

      fetchEscrowBalance();

    }, 5000);

    return () => clearInterval(interval);

  } , [
    params.center,
  ]);








  // check table view or card view
  const [tableView, setTableView] = useState(true);




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

      //console.log('getStoreCodeNumber data', data);

      setStoreCodeNumber(data?.storeCodeNumber);

    }

    fetchStoreCode();

  } , []);
  



  // array of stores
  const [storeList, setStoreList] = useState([] as any[]);


  // sellerWalletAddress
  const [sellerWalletAddress, setSellerWalletAddress] = useState("");


  const [storeAdminWalletAddress, setStoreAdminWalletAddress] = useState("");

  const [fetchingStore, setFetchingStore] = useState(false);
  const [store, setStore] = useState(null) as any;

  useEffect(() => {

    setFetchingStore(true);

    const fetchData = async () => {
        const response = await fetch("/api/store/getOneStore", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
              storecode: params.center,
              //////walletAddress: address,
            }),
        });

        const data = await response.json();

        if (data.result) {

          setStore(data.result);

          setStoreAdminWalletAddress(data.result?.adminWalletAddress);

          if (data.result?.adminWalletAddress === address) {
            setIsAdmin(true);
          }

          setSellerWalletAddress(data.result?.sellerWalletAddress || "");

        } else {
          // get store list
          const response = await fetch("/api/store/getAllStores", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
            }),
          });
          const data = await response.json();
          //console.log("getAllStores data", data);
          setStoreList(data.result.stores || []);
          setStore(null);
          setStoreAdminWalletAddress("");
        }

        setFetchingStore(false);
    };

    if (!params.center) {
      return;
    }

    fetchData();

  } , [params.center, address]);



  const [selectedItem, setSelectedItem] = useState<any>(null);
  



  // balance of sellerWalletAddress
  const [balanceOfSellerWallet, setBalanceOfSellerWallet] = useState(0);
  useEffect(() => {
    const fetchBalanceOfSellerWallet = async () => {
      if (!sellerWalletAddress) {
        setBalanceOfSellerWallet(0);
        return;
      }
      const result = await balanceOf({
        contract,
        address: sellerWalletAddress,
      });
      //console.log('balanceOfSellerWallet result', result);
      setBalanceOfSellerWallet(Number(result) / 10 ** 6);
    }
    fetchBalanceOfSellerWallet();
  } , [sellerWalletAddress, contract]);



/*
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
        storecode: params.center,
        walletAddress: address,
        searchMyOrders: searchMyOrders,
        searchOrderStatusCompleted: true,
        //searchBuyer: searchBuyer,
        //searchDepositName: searchDepositName,

        //searchStoreBankAccountNumber: searchStoreBankAccountNumber,

        fromDate: searchFromDate,
        toDate: searchToDate,
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

    if (!address || !params.center || !searchFromDate || !searchToDate) {
      return;
    }

    getTradeSummary();

    // fetch trade summary every 10 seconds
    const interval = setInterval(() => {
      getTradeSummary();
    }, 10000);
    return () => clearInterval(interval);

  } , [address, searchMyOrders, params.center,
    searchFromDate, searchToDate]);





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
  }, [address, store]);
    
  */







  const [searchBuyer, setSearchBuyer] = useState("");
  
  const [searchDepositName, setSearchDepositName] = useState("");
  

  // fetch all buyer user 
  const [fetchingAllBuyer, setFetchingAllBuyer] = useState(false);
  const [allBuyer, setAllBuyer] = useState([] as any[]);

  const fetchAllBuyer = async () => {


    if (searchBuyer === '' && searchDepositName === '') {
      setAllBuyer([]);
      setTotalCount(0);
      return;
    }


    if (fetchingAllBuyer) {
      return;
    }


    setFetchingAllBuyer(true);
    
    //const response = await fetch('/api/user/getAllBuyersByStorecode', {
    const response = await fetch('/api/user/getAllBuyers', {


      method: 'POST',
      headers: {
          'Content-Type': 'application/json',
      },
      body: JSON.stringify(
        {
          storecode: params.center,

          search: searchBuyer,
          depositName: searchDepositName,

          limit: 100,
          page: 1,
        }
      ),
    });
    if (!response.ok) {
      setFetchingAllBuyer(false);
      toast.error('회원 검색에 실패했습니다.');
      return;
    }
    const data = await response.json();
    
    //console.log('getAllBuyersByStorecode data', data);


    setAllBuyer(data.result.users);
    setTotalCount(data.result.totalCount);



    setFetchingAllBuyer(false);

    return data.result.users;
  }








  const [buyerWalletAddress, setBuyerWalletAddress] = useState('');
  const [buyerNickname, setBuyerNickname] = useState('');
  const [buyerDepositBankName, setBuyerDepositBankName] = useState('');
  const [buyerDepositBankAccountNumber, setBuyerDepositBankAccountNumber] = useState('');
  const [buyerDepositName, setBuyerDepositName] = useState('');




  const [nickname, setNickname] = useState(user?.nickname || '');

  const [usdtAmount, setUsdtAmount] = useState(0);
  const [krwAmount, setKrwAmount] = useState(0);
  const [rate, setRate] = useState(1380);



  const [buyOrdering, setBuyOrdering] = useState(false);

  const [agreementPlaceOrder, setAgreementPlaceOrder] = useState(false);


  // check input krw amount at sell order
  const [checkInputKrwAmount, setCheckInputKrwAmount] = useState(true);

  const clearanceRequest = async () => {
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
      orderUsdtAmount = parseFloat(Number(krwAmount / rate).toFixed(3));
    }
    

    const response = await fetch('/api/order/setBuyOrderForUser', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },

      body: JSON.stringify({
        lang: params.lang,
        
        
        ////////////////////////////////////storecode: params.storecode,

        storecode: params.center,



        walletAddress: buyerWalletAddress,



        nickname: nickname,
        //storecode: storecode,
        usdtAmount: orderUsdtAmount,
        krwAmount: krwAmount,
        rate: rate,
        privateSale: true,

        /*
        buyer: {
          depositBankName: "",
          depositName: "",
        }
        */
        /*


        buyer: {
          depositBankName: "카카오뱅크",
          depositBankAccountNumber: "3333339371789",
          depositName: "김승준"
        },
        */

        buyer: {
          nickname: buyerNickname,
          depositBankName: buyerDepositBankName,
          depositBankAccountNumber: buyerDepositBankAccountNumber,
          depositName: buyerDepositName,
          depositCompleted: false,
        },

        seller: {
          walletAddress: address,
        },


      })




    });

    //console.log('buyOrder response', response);


    if (!response.ok) {
      console.error('Failed to place buy order');
      setBuyOrdering(false);
      toast.error('주문 접수에 실패했습니다');
      return;
    }


    const data = await response.json();

    //console.log('data', data);

    if (data.result) {

      toast.success(
        '주문이 성공적으로 접수되었습니다'
      );

      setUsdtAmount(0);

      setKrwAmount(0);


      setAgreementPlaceOrder(false);
    



      setFetchingBuyOrders(true);

      const response = await fetch('/api/order/getAllCollectOrdersForUser', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
          },
          body: JSON.stringify(

            {
              storecode: params.center,
              limit: Number(limit),
              page: Number(page),
              walletAddress: address,
              searchMyOrders: searchMyOrders,

              fromDate: searchFromDate,
              toDate: searchToDate,

              searchWithdrawDepositName: searchWithdrawDepositName,
            }

        ),
      });

      if (!response.ok) {
        console.error('Failed to fetch buy orders');
        setFetchingBuyOrders(false);
        toast.error('주문을 불러오는 데 실패했습니다');
        return;
      }

      setFetchingBuyOrders(false);


      const data = await response.json();


      setBuyOrders(data.result.orders);

      setTotalCount(data.result.totalCount);



    } else {
      toast.error('Order has been failed');
    }

    setBuyOrdering(false);

    

  };












  if (fetchingStore) {
    return (
      <main className="p-4 pb-10 min-h-[100vh] flex items-start justify-center container max-w-screen-2xl mx-auto">
        <div className="py-0 w-full flex flex-col items-center justify-center gap-4">

          <Image
            src="/banner-loading.gif"
            alt="Loading"
            width={200}
            height={200}
          />

          <div className="text-lg text-gray-500">가맹점 정보를 불러오는 중...</div>
        </div>
      </main>
    );
  }
  if (!fetchingStore && !store) {
    return (
      <main className="p-4 pb-10 min-h-[100vh] flex items-start justify-center container max-w-screen-2xl mx-auto">
        <div className="py-0 w-full flex flex-col items-center justify-center gap-4">
          <Image
            src="/banner-404.gif"
            alt="Error"
            width={200}
            height={200}
          />
          <div className="text-lg text-gray-500">가맹점 정보가 없습니다.</div>
          <div className="text-sm text-gray-400">가맹점 홈페이지로 이동해주세요.</div>

          {/* table of storeList */}
          {/* storeName, storeCode, storeLogo, goto center page */}
          
          <div className="w-full max-w-2xl">
            <table className="w-full table-auto border-collapse">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left">가맹점 이름</th>
                  <th className="px-4 py-2 text-left">가맹점 코드</th>
                  <th className="px-4 py-2 text-left">가맹점 로고</th>
                </tr>
              </thead>
              <tbody>
                {storeList.map((store) => (
                  <tr key={store.storecode} className="hover:bg-gray-100">
                    <td className="px-4 py-2">{store.storeName}</td>
                    <td className="px-4 py-2">{store.storecode}</td>
                    <td className="px-4 py-2">
                      <Image
                        src={store.storeLogo || "/logo.png"}
                        alt={store.storeName}
                        width={100}
                        height={100}
                        className="rounded-lg w-20 h-20 object-cover"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <button
                        onClick={() => router.push('/' + params.lang + '/' + store.storecode + '/center')}
                        className="text-blue-500 hover:underline"
                      >
                        가맹점 페이지로 이동
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      </main>
    );
  }











  if (!address) {
    return (
   <main className="p-4 pb-10 min-h-[100vh] flex items-start justify-center container max-w-screen-2xl mx-auto">


      <div className="py-0 w-full">




        <div className={`w-full flex flex-row items-center justify-start gap-2
          p-2 rounded-lg mb-4
          ${store?.backgroundColor ?
            "bg-" + store.backgroundColor + " " :
            "bg-black/10"
          }`}>


          <div className="w-full flex flex-row items-center justify-start gap-2">
            <Image
              src={store?.storeLogo || "/logo.png"}
              alt="logo"
              width={35}
              height={35}
              className="rounded-lg w-6 h-6"
            />
            {address && address === storeAdminWalletAddress && (
              <div className="text-sm text-[#3167b4] font-bold">
                {store?.storeName + " (" + store?.storecode + ") 가맹점 관리자"}
              </div>
            )}
            {address && address !== storeAdminWalletAddress && (
              <div className="text-sm text-[#3167b4] font-bold">
                {store?.storeName + " (" + store?.storecode + ")"}
              </div>
            )}

          </div>


          {address && !loadingUser && (


            <div className="w-full flex flex-row items-center justify-end gap-2">
              <button
                onClick={() => {
                  router.push('/' + params.lang + '/' + params.center + '/profile-settings');
                }}
                className="flex bg-[#3167b4] text-sm text-[#f3f4f6] px-4 py-2 rounded-lg hover:bg-[#3167b4]/80"
              >
                {user?.nickname || "프로필"}
              </button>


              {/* logout button */}
              <button
                  onClick={() => {
                      confirm("로그아웃 하시겠습니까?") && activeWallet?.disconnect()
                      .then(() => {

                          toast.success('로그아웃 되었습니다');

                          //router.push(
                          //    "/admin/" + params.center
                          //);
                      });
                  } }

                  className="flex items-center justify-center gap-2
                    bg-[#3167b4] text-sm text-[#f3f4f6] px-4 py-2 rounded-lg hover:bg-[#3167b4]/80"
              >
                <Image
                  src="/icon-logout.webp"
                  alt="Logout"
                  width={20}
                  height={20}
                  className="rounded-lg w-5 h-5"
                />
                <span className="text-sm">
                  로그아웃
                </span>
              </button>

            </div>


          )}


          {!address && (
            <ConnectButton
              client={client}
              wallets={wallets}

              /*
              accountAbstraction={{
                chain: arbitrum,
                sponsorGas: true
              }}
              */
              
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




        </div>
 


        <div className="w-full flex flex-col justify-between items-center gap-2 mb-5">
   

          <div className="w-full flex flex-row gap-2 justify-end items-center">


          {/* right space */}
          {/* background transparent */}
          <select
            //className="p-2 text-sm bg-zinc-800 text-white rounded"


            className="p-2 text-sm bg-transparent text-zinc-800 rounded"

            onChange={(e) => {
              const lang = e.target.value;
              router.push(
                "/" + lang + "/" + params.center + "/center"
              );
            }}
          >
            <option
              value="en"
              selected={params.lang === "en"}
            >
              English(US)
            </option>
            <option
              value="ko"
              selected={params.lang === "ko"}
            >
              한국어(KR)
            </option>
            <option
              value="zh"
              selected={params.lang === "zh"}
            >
              中文(ZH)
            </option>
            <option
              value="ja"
              selected={params.lang === "ja"}
            >
              日本語(JP)
            </option>
          </select>

          {/* icon-language */}
          {/* color is tone down */}
          <Image
            src="/icon-language.png"
            alt="Language"
            width={20}
            height={20}
            className="rounded-lg w-6 h-6
              opacity-50
              "
          />

          </div>

        </div>


      </div>

    </main>


    );
  }




  // if store.adminWalletAddress is same as address, return "가맹점 관리자" else return "가맹점"
  // if user?.role is not "admin", return "가맹점"


  if (
    (address
    && store
    &&  address !== store.adminWalletAddress
    && user?.role !== "admin")
    

  ) {
    return (


      <div className={`w-full flex flex-row items-center justify-start gap-2
        p-2 rounded-lg mb-4
        ${store?.backgroundColor ?
          "bg-" + store.backgroundColor + " " :
          "bg-black/10"
        }`}>

        <div className="flex flex-row items-center justify-center gap-2">
          <Image
            src={store?.storeLogo || "/logo.png"}
            alt="logo"
            width={35}
            height={35}
            className="rounded-lg w-6 h-6"
          />
          <div className="text-sm text-[#3167b4] font-bold">
            {store?.storeName + " (" + store?.storecode + ") 가맹점 관리자가 아닙니다."}
          </div>
        </div>

        {/* 회원가입한후 가맹점 관리자 등록신청을 하세요 */}
        {/* 회원가입하러 가기 */}
        <div className="flex flex-row items-center justify-center gap-2">
          <button
            onClick={() => {
              router.push('/' + params.lang + '/' + params.center + '/profile-settings');
            }}
            className="flex bg-[#3167b4] text-sm text-[#f3f4f6] px-4 py-2 rounded-lg hover:bg-[#3167b4]/80"
          >
            회원가입하러 가기
          </button>
        </div>

        {/* 로그아웃 버튼 */}
        <button
          onClick={() => {
            confirm("로그아웃 하시겠습니까?") && activeWallet?.disconnect()
            .then(() => {

                toast.success('로그아웃 되었습니다');

                //router.push(
                //    "/admin/" + params.center
                //);
            });
          } }

          className="flex items-center justify-center gap-2
            bg-[#3167b4] text-sm text-[#f3f4f6] px-4 py-2 rounded-lg hover:bg-[#3167b4]/80"
        >
          <Image
            src="/icon-logout.webp"
            alt="Logout"
            width={20}
            height={20}
            className="rounded-lg w-5 h-5"
          />
          <span className="text-sm">
            로그아웃
          </span>
        </button>

      </div>
    );

  }







    return (

      <main className="p-4 pb-10 min-h-[100vh] flex items-start justify-center container max-w-screen-2xl mx-auto">


        <div className="py-0 w-full">

       
          <div className={`w-full flex flex-col xl:flex-row items-center justify-between gap-2
            p-2 rounded-lg mb-4
            ${store?.backgroundColor ?
              "bg-" + store.backgroundColor + " " :
              "bg-black/10"
            }`}>
              
              
              <button
                onClick={() => {
                  router.push('/' + params.lang + '/' + params.center + '/center');
                }}
                className="flex bg-[#3167b4] text-sm text-[#f3f4f6] px-4 py-2 rounded-lg hover:bg-[#3167b4]/80"
              >

                <div className="flex flex-row items-center gap-2">
                  <Image
                      src={store?.storeLogo || "/logo.png"}
                      alt="Store"
                      width={35}
                      height={35}
                      className="rounded-lg w-5 h-5"
                  />
                  <span className="text-sm text-zinc-50">
                    {
                      store && store?.storeName + " (" + store?.storecode + ")"
                    }
                  </span>

                </div>

              </button>


              <div className="flex flex-row items-center gap-2">
                

                <div className="w-full flex flex-row items-center justify-end gap-2">
                  {!address && (
                    <ConnectButton
                      client={client}
                      wallets={wallets}

                      /*
                      accountAbstraction={{
                        chain: arbitrum,
                        sponsorGas: true
                      }}
                      */
                      
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
                </div>

            
                {address && !loadingUser && (
                    <div className="w-full flex flex-row items-center justify-end gap-2">

                      <button
                        onClick={() => {
                          router.push('/' + params.lang + '/' + params.center + '/profile-settings');
                        }}
                        className="
                        items-center justify-center
                        bg-[#3167b4] text-sm text-[#f3f4f6] px-4 py-2 rounded-lg hover:bg-[#3167b4]/80"
                      >
                        <div className="
                          w-40 xl:w-48
                          flex flex-col xl:flex-row items-center justify-center gap-2">
                          <span className="text-sm text-zinc-50">
                            {user?.nickname || "프로필"}
                          </span>
                          {isAdmin && (
                            <div className="flex flex-row items-center justify-center gap-2">
                              <Image
                                src="/icon-admin.png"
                                alt="Admin"
                                width={20}
                                height={20}
                                className="rounded-lg w-5 h-5"
                              />
                              <span className="text-sm text-yellow-500">
                                가맹점 관리자
                              </span>
                            </div>
                          )}
                        </div>
                      </button>

                      {/* logout button */}
                      <button
                          onClick={() => {
                              confirm("로그아웃 하시겠습니까?") && activeWallet?.disconnect()
                              .then(() => {

                                  toast.success('로그아웃 되었습니다');

                                  //router.push(
                                  //    "/admin/" + params.center
                                  //);
                              });
                          } }

                          className="
                            w-32
                            flex items-center justify-center gap-2
                            bg-[#3167b4] text-sm text-[#f3f4f6] px-4 py-2 rounded-lg hover:bg-[#3167b4]/80"
                      >
                        <Image
                          src="/icon-logout.webp"
                          alt="Logout"
                          width={20}
                          height={20}
                          className="rounded-lg w-5 h-5"
                        />
                        <span className="text-sm">
                          로그아웃
                        </span>
                      </button>

                  </div>
                )}


              </div>


          </div>



          <div className="flex flex-col items-start justify-center gap-2">

            

            {/* USDT 가격 binance market price */}
            {/*
            <div
              className="
              h-20
                w-full flex
                binance-widget-marquee
              flex-row items-center justify-center gap-2
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


            <div className="grid grid-cols-2 xl:grid-cols-4 gap-2 mb-4">

                <button
                    onClick={() => router.push('/' + params.lang + '/' + params.center + '/member')}
                    className="flex w-32 bg-[#3167b4] text-[#f3f4f6] text-sm rounded-lg p-2 items-center justify-center
                    hover:bg-[#3167b4]/80
                    hover:cursor-pointer
                    hover:scale-105
                    transition-transform duration-200 ease-in-out
                    ">
                    회원관리
                </button>

                <button
                    onClick={() => router.push('/' + params.lang + '/' + params.center + '/buyorder')}
                    className="flex w-32 bg-[#3167b4] text-[#f3f4f6] text-sm rounded-lg p-2 items-center justify-center
                    hover:bg-[#3167b4]/80
                    hover:cursor-pointer
                    hover:scale-105
                    transition-transform duration-200 ease-in-out
                    ">
                    구매주문관리
                </button>


                <button
                    onClick={() => router.push('/' + params.lang + '/' + params.center + '/trade-history')}
                    className="flex w-32 bg-[#3167b4] text-[#f3f4f6] text-sm rounded-lg p-2 items-center justify-center
                    hover:bg-[#3167b4]/80
                    hover:cursor-pointer
                    hover:scale-105
                    transition-transform duration-200 ease-in-out
                    ">
                    P2P 거래내역
                </button>

                <button
                    onClick={() => router.push('/' + params.lang + '/' + params.center + '/clearance-history')}
                    className="flex w-32 bg-[#3167b4] text-[#f3f4f6] text-sm rounded-lg p-2 items-center justify-center
                    hover:bg-[#3167b4]/80
                    hover:cursor-pointer
                    hover:scale-105
                    transition-transform duration-200 ease-in-out
                    ">
                    판매(거래소)
                </button>

                <div className='flex w-32 items-center justify-center gap-2
                  bg-yellow-500 text-[#3167b4] text-sm rounded-lg p-2'>
                  <Image
                    src="/icon-clearance.png"
                    alt="Trade"
                    width={35}
                    height={35}
                    className="w-4 h-4"
                  />
                  <div className="text-sm font-semibold">
                    출금(회원)
                  </div>
                </div>

                <button
                  onClick={() => router.push('/' + params.lang + '/' + params.center + '/daily-close')}
                  className="flex w-32 bg-[#3167b4] text-[#f3f4f6] text-sm rounded-lg p-2 items-center justify-center
                  hover:bg-[#3167b4]/80
                  hover:cursor-pointer
                  hover:scale-105
                  transition-transform duration-200 ease-in-out
                  ">
                    통계(일별)
                </button>


            </div>


   

            <div className='flex flex-row items-center space-x-4'>
                <Image
                  src="/icon-clearance.png"
                  alt="Clearance"
                  width={35}
                  height={35}
                  className="w-6 h-6"
                />

                <div className="text-xl font-semibold">
                  출금(회원)
                </div>

            </div>



            




                {/* check box for Native Wallet */}
                {/*
                {address && (
                  <div className="flex flex-row items-center gap-2">
                    <input
                      disabled={true}
                      type="checkbox"
                      checked={
                        activeWallet === inAppConnectWallet
                      }
                      onChange={(e) => 
                        ///e.target.checked ? setActiveAccount(inAppConnectWallet) : setActiveAccount(smartConnectWallet)

                        e.target.checked ?
                        router.push( window.location.pathname )
                        :
                        router.push( window.location.pathname  + '?wallet=smart' )

                      } 
                      className="w-5 h-5"
                    />
                    <label className="text-sm text-zinc-500">Pro Wallet</label>
                  </div>
                )}
                */}








                <div className="w-full flex flex-col xl:flex-row items-center justify-between gap-5">

                  <div className="hidden flex-row items-start gap-3">

                    {address && !loadingUser && (

                      <div className="flex flex-row gap-5 items-center p-2">

                        <div className="flex flex-row items-center gap-2">


                          <div className="flex flex-row items-center gap-2">
                      
                            
                            <div className="flex flex-col gap-2">

                              <div className="flex flex-col xl:flex-row gap-2">
                                <span className="text-sm">
                                  {
                                    user && user.seller?.bankInfo.bankName
                                  }
                                </span>
                                <span className="text-sm">
                                  {
                                    user && user.seller?.bankInfo.accountNumber
                                  }
                                </span>
                                <span className="text-sm">
                                  {
                                    user && user.seller?.bankInfo.accountHolder
                                  }
                                </span>
                              </div>

                              {/* go to profile */}
                              {!user?.seller && (
                                <button
                                  onClick={() => {
                                    router.push('/' + params.lang + '/' + params.center + '/seller-settings');
                                  }}
                                  className="text-sm text-zinc-500 underline"
                                >
                                  판매를 위해서 판매자 설정을 해야합니다.
                                </button>
                              )}

                            </div>

                          </div>

                        </div>




                        {/*
                        {activeWallet === inAppConnectWallet && (
                          <div className="flex flex-row items-center gap-2 text-sm ">
                            {nativeBalance && Number(nativeBalance).toFixed(4)}{' '}ETH
                          </div>
                        )}
                        */}

                      </div>

                    )}

                  </div>





                  {/*
                  {address && (
                      <div className="flex
                      mt-4 mb-2
                      w-full flex-col xl:flex-row items-start justify-start gap-5
                      border border-zinc-200 rounded-lg p-4
                      bg-white shadow-md
                      ">


                        
                        <div className="flex flex-col xl:flex-row items-center justify-center gap-2">
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
                                  잔액
                              </span>
                              <span className="text-2xl xl:text-4xl font-semibold text-[#409192]"
                                  style={{ fontFamily: 'monospace' }}
                              >
                                  {
                                    Number(balance).toFixed(3).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                                  }
                              </span>
                              {' '}
                              <span className="text-sm">USDT</span>
                          </div>

                        </div>
                        


                      </div>
                  )}
                  */}








                  {/*}
                  <div className="mt-4 flex flex-row items-center justify-between gap-2 w-full">

                    <div className="flex flex-col gap-2 items-start">
                      <div className="flex flex-row items-start gap-2">
                        <Image
                          src="/icon-bank.png"
                          alt="Bank"
                          width={20}
                          height={20}
                          className="w-5 h-5"
                        />
                        <div className="text-sm text-zinc-500">
                          결제통장 정보
                        </div>
                      </div>
                      <div className="flex flex-row items-start gap-2 text-zinc-500">

                        <span className="text-lg font-semibold text-zinc-500">
                          {store?.withdrawalBankInfo?.bankName}
                        </span>
                        <span className="text-lg font-semibold text-zinc-500">
                          {store?.withdrawalBankInfo?.accountNumber}
                        </span>
                        <span className="text-lg font-semibold text-zinc-500">
                          {store?.withdrawalBankInfo?.accountHolder}
                        </span>

                      </div>
                    </div>

                  </div>
                  */}




                </div>

              {/* withdrawalBankInfo */}
              {/* 가맹점 출금 통장 정보 */}
              {address && store?.withdrawalBankInfo && (
                <div className="mt-4 flex flex-col items-start gap-2 w-full">

                  <div className="flex flex-row items-start gap-2">
                    <Image
                      src="/icon-bank.png"
                      alt="Bank"
                      width={20}
                      height={20}
                      className="w-5 h-5"
                    />
                    <div className="text-sm text-zinc-500">
                      가맹점 출금 통장 정보
                    </div>
                  </div>

                  <div className="flex flex-row items-start gap-2 text-zinc-500">

                    <span className="text-lg font-semibold text-zinc-500">
                      {store.withdrawalBankInfo.bankName}
                    </span>
                    <span className="text-lg font-semibold text-zinc-500">
                      {store.withdrawalBankInfo.accountNumber}
                    </span>
                    <span className="text-lg font-semibold text-zinc-500">
                      {store.withdrawalBankInfo.accountHolder}
                    </span>

                  </div>

                </div>
              )}




              <div className="w-full flex flex-col xl:flex-row items-center justify-center gap-5 mt-4">


                <div className="flex flex-col gap-2 items-start">

                  <div className="flex flex-row items-center gap-2">

                    <div className="flex flex-col xl:flex-row items-center justify-center gap-2">
                      {/* search nickname */}
                      <div className="flex flex-row items-center gap-2">
                        <input
                          type="text"
                          value={searchBuyer}
                          onChange={(e) => setSearchBuyer(e.target.value)}
                          placeholder="회원아이디"
                          className="w-full p-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3167b4]"
                        />

                      </div>

                      {/*}
                      <div className="flex flex-row items-center gap-2">
                        <input
                          type="text"
                          value={searchDepositName}
                          onChange={(e) => setSearchDepositName(e.target.value)}
                          placeholder="입금자명"
                          className="w-full p-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3167b4]"
                        />
                      </div>
                      */}

                    </div>


                    {/* 검색 버튼 */}
                    <div className="
                    w-32
                    flex flex-row items-center gap-2">
                      <button
                        onClick={() => {
                          setPageValue(1);
                          fetchAllBuyer();
                        }}
                        className="bg-[#3167b4] text-white px-4 py-2 rounded-lg w-full"
                        disabled={fetchingAllBuyer}
                      >
                        <div className="flex flex-row items-center justify-between gap-2">
                          <Image
                            src="/icon-search.png"
                            alt="Search"
                            width={20}
                            height={20}
                            className="rounded-lg w-5 h-5"
                          />
                          <span className="text-sm">
                            {fetchingAllBuyer ? '검색중...' : '검색'}
                          </span>
                        </div>

                      </button>
                    </div>
                    
                  </div>                

                  {/* 검색된 회원목록 */}
                  <div className="mt-2 w-full max-h-[300px] overflow-y-auto
                    border border-zinc-300 rounded-lg p-2 bg-white shadow-md">
                    {allBuyer.length > 0 ? (
                      allBuyer.map((buyer, index) => (
                        <div
                          key={index}
                          className="flex flex-row items-center justify-between gap-2 p-2 hover:bg-zinc-100 cursor-pointer
                          border-b border-zinc-200"
                          onClick={() => {
                            setBuyerWalletAddress(buyer.walletAddress);
                            setBuyerNickname(buyer.nickname);
                            setBuyerDepositName(buyer.buyer.depositName);
                            setBuyerDepositBankName(buyer.buyer.depositBankName);
                            setBuyerDepositBankAccountNumber(buyer.buyer.depositBankAccountNumber);


                            setKrwAmount(0);

                          }}
                        >
                          <div className="flex flex-col">
                            <div className="flex flex-row items-center gap-2">
                              <Image
                                src="/icon-shield.png"
                                alt="Shield"
                                width={20}
                                height={20}
                                className="w-5 h-5"
                              />
                              <span className="text-sm font-semibold text-zinc-800">
                                {buyer.walletAddress.substring(0, 6) + '...' + buyer.walletAddress.substring(buyer.walletAddress.length - 4)}
                              </span>
                            </div>
                            <span className="text-sm text-[#409192]">
                              {buyer.nickname}
                            </span>
                            <span className="text-sm font-semibold text-zinc-800">
                              {buyer.buyer.depositName}
                            </span>
                            <span className="text-sm text-zinc-500">
                              {buyer.buyer.depositBankName}
                            </span>
                            <span className="text-sm text-zinc-500">
                              {buyer.buyer.depositBankAccountNumber}
                            </span>
                          </div>

                        </div>
                      ))
                    ) : (
                      <div className="text-sm text-zinc-500">
                        검색된 회원이 없습니다.
                      </div>
                    )}
                  </div>



                </div>


                <article
                  className={` w-full max-w-2xl
                      bg-white shadow-md rounded-lg p-4 border border-gray-300`}
                >
                    
                    <div className="
                    flex flex-col xl:flex-row gap-5 xl:gap-20 items-center ">
                        
                        <div className="flex flex-col gap-2 items-start">

                          {/* 선택된 회원 정보 */}
                          {/* USDT 통장 주소 */}
                          <div className="flex flex-row items-center gap-2">
                            <Image
                              src="/icon-shield.png"
                              alt="Wallet"
                              width={20}
                              height={20}
                              className="w-5 h-5"
                            />
                            <span className="text-sm text-zinc-400">
                              {buyerWalletAddress ? buyerWalletAddress.substring(0, 6) + '...' + buyerWalletAddress.substring(buyerWalletAddress.length - 4) : ''}
                            </span>
                          </div>

                          <div className="flex flex-row items-center gap-2">
                            <span className="text-lg font-semibold text-zinc-500">
                              {buyerNickname || '출금할 회원을 선택해주세요'}
                            </span>
                            {buyerNickname && (
                              <div className="flex flex-row items-center gap-2">
                                <span className="text-sm text-zinc-400">
                                  ({buyerDepositName})
                                </span>
                                <span className="text-sm text-zinc-400">
                                  {buyerDepositBankName} {buyerDepositBankAccountNumber}
                                </span>
                              </div>
                            )}
                          </div>


                          <p className="mt-4 text-xl font-bold text-zinc-400">1 USDT = {
                            // currency format
                            Number(rate).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                          } 원
                          </p>

                          <div className=" flex flex-col items-center gap-2">
                            
                            <div className="flex flex-row items-center gap-2">

                              <span className="text-xl text-blue-500 font-bold ">
                                지급금액
                              </span>

                              <input 
                                // disable mouse up down scroll
                                //onWheel={(e) => e.preventDefault()}




                                type="number"
                                className="
                                  text-xl text-blue-500 font-bold
                                  w-40 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 "
                                placeholder={Price}
                                value={
                                  //Number(krwAmount).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                                  krwAmount
                                }
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

                                  //setUsdtAmount(Number((krwAmount / rate).toFixed(3)));
                                
                                
                                } }
                              />
                              <span className="text-2xl text-yellow-600 font-semibold"
                                style={{ fontFamily: 'monospace' }}
                              >
                                {krwAmount === 0 ? '0' : Number(krwAmount).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                              </span>
                              <span className="text-xl text-zinc-400 font-bold">
                                원  
                              </span>

                            </div>
                            {/* 판매량 */}
                            <div className="flex flex-row items-center gap-2">
                              <span className="text-lg font-semibold text-zinc-400">
                                판매량(USDT)
                              </span>
                              {'='}
                              <div className="flex flex-row items-center gap-1">
                                <Image
                                  src="/icon-tether.png"
                                  alt="Tether"
                                  width={20}
                                  height={20}
                                  className="w-5 h-5"
                                />
                                <span className=" text-2xl text-[#409192] font-semibold"
                                  style={{ fontFamily: 'monospace' }}
                                >
                                {
                                  krwAmount === 0 ? '0' :
                                  (krwAmount / rate).toFixed(3) === 'NaN' ? '0' : (krwAmount / rate).toFixed(3).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                                }
                                </span>
                              </div>
                            </div>

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
                                  disabled={krwAmount === 0 || agreementPlaceOrder === false
                                    || !buyerNickname
                                  }
                                  className={`text-lg text-white  px-4 py-2 rounded-md ${krwAmount === 0 || agreementPlaceOrder === false
                                    || !buyerNickname
                                     ? 'bg-gray-500' : 'bg-green-600'}`}


                                  onClick={() => {
                                      console.log('Buy USDT');
                                      // open trade detail
                                      // open modal of trade detail
                                      ///openModal();

                                      clearanceRequest();
                                  }}
                              >
                                출금신청
                              </button>
                          )}

                        </div>

                      </div>

                    </div>

                </article>



              </div>



              <div className="w-full flex flex-col xl:flex-row items-center justify-between gap-3 mt-4">

                <div className="selection:w-full flex flex-col xl:flex-row items-center justify-between gap-3">

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
                        
                        //onChange={(e) => setSearchFromDate(e.target.value)}
                        // route to the date picker
                        onChange={(e) => {
                          router.push(
                            '/' + params.lang + '/' + params.center + '/clearance-request?limit=' + limitValue + '&page=1' +
                            '&fromDate=' + e.target.value + '&toDate=' + searchToDate
                          );
                        }}
                        className="w-full p-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3167b4]"
                      />
                    </div>

                    <span className="text-sm text-zinc-500">~</span>

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
                        //onChange={(e) => setSearchToDate(e.target.value)}
                        // route to the date picker
                        onChange={(e) => {
                          router.push(
                            '/' + params.lang + '/' + params.center + '/clearance-request?limit=' + limitValue + '&page=1' +
                            '&fromDate=' + searchFromDate + '&toDate=' + e.target.value
                          );
                        }}
                        className="w-full p-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3167b4]"
                      />
                    </div>
                  </div>

                  {fetchingBuyOrders ? (
                    <div className="flex flex-row items-center justify-center gap-2">
                      <Image
                        src="/loading.png"
                        alt="Loading"
                        width={20}
                        height={20}
                        className="w-5 h-5 animate-spin"
                      />
                      <span className="text-sm text-zinc-500">로딩중...</span>
                    </div>
                  ) : (
                    <>  </>
                  )}

                </div>


                {/* search depositName */}
                
                <div className="flex flex-col xl:flex-row items-center justify-center gap-2">

                  <div className="flex flex-row items-center gap-2">
                    <input
                      type="text"
                      value={searchWithdrawDepositName}
                      onChange={(e) => setSearchWithdrawDepositName(e.target.value)}
                      placeholder="입금자명"
                      className="w-full p-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3167b4]"
                    />
                  </div>
                  {/*
                  <div className="
                    w-28  
                    flex flex-row items-center gap-2">
                    <button
                      onClick={() => {
                        setPageValue(1);
                        
                        fetchBuyOrders();

                        getTradeSummary();
                      }}
                      className="bg-[#3167b4] text-white px-4 py-2 rounded-lg w-full"
   
                      title="검색"

                      //disabled={fetchingBuyOrders}
                    >
                      <div className="flex flex-row items-center justify-between gap-2">
                        <Image
                          src="/icon-search.png"
                          alt="Search"
                          width={20}
                          height={20}
                          className="rounded-lg w-5 h-5"
                        />
                        <span className="text-sm">
                          검색
                        </span>
                      </div>

                    </button>
                  </div>
                  */}

                </div>
                


              </div>



                {/* trade summary */}

                <div className="flex flex-col xl:flex-row items-center justify-between gap-2
                  w-full
                  bg-zinc-100/50
                  p-4 rounded-lg shadow-md
                  ">


                  {/* divider */}
                  
                  <div className="hidden xl:block w-0.5 h-10 bg-zinc-300"></div>
                  <div className="xl:hidden w-full h-0.5 bg-zinc-300"></div>

                  <div className="w-full xl:w-1/3
                    flex flex-row items-start justify-between gap-2 pl-4 pr-4">
                    <div className="flex flex-col gap-2 items-center">
                      <div className="text-sm">총 판매주문수(건)</div>
                      <div className="text-xl font-semibold text-zinc-500">
                        {totalClearanceCount?.toLocaleString()}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 items-center">
                      <div className="text-sm">총 판매금액(원)</div>
                      <div className="text-sm font-semibold text-zinc-500">
                        <span className="text-xl text-yellow-600"
                          style={{ fontFamily: 'monospace' }}
                        >
                          {totalClearanceAmountKRW?.toLocaleString()}
                        </span>{' '}
                          원
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 items-center">
                      <div className="text-sm">총 판매량(USDT)</div>
                      <div className="text-sm font-semibold text-zinc-500">
                        <span className="text-xl text-[#409192]"
                          style={{ fontFamily: 'monospace' }}
                        >
                          {totalClearanceAmount?.toLocaleString()}
                        </span>{' '}
                          USDT
                      </div>
                    </div>
                  </div>
                  
                  
                </div>





                {/* table view is horizontal scroll */}
                {tableView ? (


                  <div className="w-full overflow-x-auto">

                    <table className=" w-full table-auto border-collapse border border-zinc-800 rounded-md">


                      <thead
                        className="bg-zinc-800 text-white text-sm font-semibold"
                        style={{
                          backgroundColor: 'rgba(0, 0, 0, 0.5)',
                        }}
                      >
                        <tr>
                          <th className="p-2">
                            <div className="flex flex-col items-center">
                              <span className="text-sm">
                                #{TID}
                              </span>
                              <span className="text-sm">
                                신청시간
                              </span>
                            </div>
                          </th>

                          <th className="p-2">
                            <div className="flex flex-col items-end">
                              {Buyer}
                            </div>
                          </th>

                          <th className="p-2">
                            <div className="flex flex-col items-start">
                              구매자 통장
                            </div>
                          </th>

                          <th className="p-2">
                            <div className="flex flex-col items-end">
                              <span>
                                판매량(USDT)
                              </span>
                              <span>
                                판매금액(원)
                              </span>
                              <span>
                                환율(원)
                              </span>
                            </div>
                          </th>
                         
                          {/*
                          <th className="p-2">{Payment_Amount}</th>
                          */}

                          <th className="p-2">
                            <div className="flex flex-col items-center">
                              <span className="text-sm">
                                {Seller}
                              </span>
                              <span className="text-sm">
                                {Status}
                              </span>
                            </div>
                          </th>

                          <th className="p-2">거래소전송</th>

                          <th className="p-2">거래취소</th>
                          <th className="p-2">USDT 전송</th>
                          <th className="p-2">출금상태</th>
                        </tr>
                      </thead>

                      {/* if my trading, then tr has differenc color */}
                      <tbody>

                        {buyOrders.map((item, index) => (

                          
                          <tr key={index} className={`
                            ${
                              index % 2 === 0 ? 'bg-zinc-100' : 'bg-zinc-200'


                              //item.walletAddress === address ?
                              
   
                            }
                          `}>
                          

                            <td className="p-2">
                              <div className="flex flex-col items-center gap-2">
                                <span className="text-sm text-zinc-500">
                                  #{item.tradeId}
                                </span>
                                <div className="flex flex-col items-center gap-2">

                                  {
                                    new Date(item.createdAt).toLocaleDateString(params.lang, {
                                      year: 'numeric',
                                      month: '2-digit',
                                      day: '2-digit',
                                    }) + ' ' +
                                    new Date(item.createdAt).toLocaleTimeString(params.lang, {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                      second: '2-digit',
                                    })
                                  }

                                  <div className="text-sm text-zinc-500">
                                    {params.lang === 'ko' ? (
                                      <p>{
                                        new Date().getTime() - new Date(item.createdAt).getTime() < 1000 * 60 ? (
                                          ' ' + Math.floor((new Date().getTime() - new Date(item.createdAt).getTime()) / 1000) + ' ' + seconds_ago
                                        ) :
                                        new Date().getTime() - new Date(item.createdAt).getTime() < 1000 * 60 * 60 ? (
                                        ' ' + Math.floor((new Date().getTime() - new Date(item.createdAt).getTime()) / 1000 / 60) + ' ' + minutes_ago
                                        ) : (
                                          ' ' + Math.floor((new Date().getTime() - new Date(item.createdAt).getTime()) / 1000 / 60 / 60) + ' ' + hours_ago
                                        )
                                      }</p>
                                    ) : (
                                      <p>{
                                        new Date().getTime() - new Date(item.createdAt).getTime() < 1000 * 60 ? (
                                          ' ' + Math.floor((new Date().getTime() - new Date(item.createdAt).getTime()) / 1000) + ' ' + seconds_ago
                                        ) :
                                        new Date().getTime() - new Date(item.createdAt).getTime() < 1000 * 60 * 60 ? (
                                        ' ' + Math.floor((new Date().getTime() - new Date(item.createdAt).getTime()) / 1000 / 60) + ' ' + minutes_ago
                                        ) : (
                                          ' ' + Math.floor((new Date().getTime() - new Date(item.createdAt).getTime()) / 1000 / 60 / 60) + ' ' + hours_ago
                                        )
                                      }</p>
                                    )}
                                  </div>
                                </div>

                              </div>
                            </td>
                            
                            <td className="p-2">
                              <div className="flex flex-col items-end">

                                <div className="flex flex-row items-center gap-1">

                                  <Image
                                    src={item?.buyer?.avatar || "/icon-user.png"}
                                    alt="Avatar"
                                    width={20}
                                    height={20}
                                    priority={true} // Added priority property
                                    className="rounded-full"
                                  />
                                  <span className="text-lg font-semibold text-yellow-600">
                                    {
                                      item?.buyer?.nickname ? item?.buyer?.nickname : item?.nickname
                                    }
                                  </span>

                                </div>

                                <div className="flex flex-col gap-2 items-center justify-center">
                                  <div className="flex flex-row items-center gap-2">
                                    <Image
                                      src="/icon-shield.png"
                                      alt="Shield"
                                      width={20}
                                      height={20}
                                      className="w-5 h-5"
                                    />
                                    <span className="text-sm font-semibold text-zinc-800">
                                      {item.walletAddress.slice(0, 6) + '...' + item.walletAddress.slice(-4)}
                                    </span>
                                  </div>
                                  {/*
                                  <div className="text-sm text-zinc-500">
                                    {
                                      //item.walletAddress === address ? 'Me' : item.tradeId ? item.tradeId : ''

                                      //item.walletAddress === address ? 'Me' :

                                      item?.buyer?.depositBankName + ' ' + item?.buyer?.depositName

                                    }
                                  </div>
                                  */}


                                </div>
                              </div>
                            </td>


                            <td className="p-2">

                              {item?.buyer?.nickname ? (

                                <div className="flex flex-col gap-2 items-start">
                                  <div className="text-lg font-semibold text-zinc-500">
                                    {item.buyer?.depositBankName}
                                  </div>
                                  <div className="text-lg font-semibold text-zinc-500">
                                    {item.buyer?.depositBankAccountNumber}
                                  </div>
                                  <div className="text-lg font-semibold text-zinc-500">
                                    {item.buyer?.depositName}
                                  </div>
                                </div>


                              ) : (

                                <div className="flex flex-col gap-2 items-start">
                                  <div className="text-lg font-semibold text-zinc-500">
                                    {item.seller?.bankInfo?.bankName}
                                  </div>
                                  <div className="text-lg font-semibold text-zinc-500">
                                    {item.seller?.bankInfo?.accountNumber}
                                  </div>
                                  <div className="text-lg font-semibold text-zinc-500">
                                    {item.seller?.bankInfo?.accountHolder}
                                  </div>
                                </div>

                              )}

                            </td>


                            <td className="p-2">
                              <div className="flex flex-col gap-2 items-end justify-start">

                                <div className="flex flex-row gap-2 items-center justify-center">
                                  <Image
                                    src="/icon-tether.png"
                                    alt="Tether"
                                    width={20}
                                    height={20}
                                    className="w-5 h-5"
                                  />
                                  <span className="text-xl text-[#409192] font-semibold"
                                    style={{ fontFamily: 'monospace' }}
                                  >
                                    {item.usdtAmount.toFixed(3).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                                  </span>
                                </div>

                                <div className="flex flex-row items-center gap-1">
                                  <span className="text-xl text-yellow-600 font-semibold"
                                    style={{ fontFamily: 'monospace' }}
                                  >
                                    {Number(item.krwAmount)?.toLocaleString()}
                                  </span>
                                </div>



                                <span className="text-sm text-zinc-500">
                                  {
                                    Number(item.rate).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                                    //Number(item.krwAmount / item.usdtAmount).toFixed(3)
                                  }
                                </span>
                              </div>
                            </td>

                            {/*
                            <td className="p-2">
                              <div className="flex mr-2 text-right">
                                {

                                  item.status === 'paymentConfirmed' ? (

                                    <div className=" text-[#409192] text-xl font-semibold">
                                      {
                                        item.krwAmount
                                        ? Number(item.krwAmount)?.toLocaleString('ko-KR', {
                                          style: 'currency',
                                          currency: 'KRW',
                                        })
                                        : '0'
                                      }
                                    </div>

                                  ) : item.status === 'paymentRequested' ? (
                                    <input
                                      disabled={false}
                                      type="number"
                                      value={paymentAmounts[index]}
                                      onChange={(e) => {
                                        setPaymentAmounts(
                                          paymentAmounts.map((item, idx) => idx === index ? Number(e.target.value) : item)
                                        );
                                      }}
                                      className="w-20 h-8 rounded-md text-right text-zinc-500 text-lg text-semibold"
                                    />
                                  ) : (
                                    <></>
                                  )

                                }
                              </div>
                            </td>
                            */}

                            <td className="p-2">
                              <div className="
                              w-52 
                              flex flex-row items-center gap-2 justify-center">
                                {/* status */}
                                {item.status === 'ordered' && (
                                  <div className="text-lg text-yellow-600 font-semibold">
                                    {Buy_Order_Opened}
                                  </div>
                                )}


                                {item.status === 'accepted' && (

                                  <div className="flex flex-row gap-2 items-center justify-center">
                                    
                                    <div className="text-sm text-zinc-500">
                                      {item.seller?.nickname}
                                    </div>

                                    <div className="text-sm text-[#409192]">
                                      {Trade_Started}
                                    </div>

   


                                  </div>
                                )}

                                {item.status === 'paymentRequested' && (
                                  <div className="flex flex-col gap-2 items-center justify-center">
                                    
                                    <div className="text-sm text-zinc-500">
                                      {
                                        //item.store.sellerWalletAddress.slice(0, 6) + '...' + item.store.sellerWalletAddress.slice(-4)
                                        item.seller?.walletAddress.slice(0, 6) + '...' + item.seller?.walletAddress.slice(-4)
                                      }
                                    </div>
                                  
                                    <div className="text-lg text-[#409192] font-semibold">
                                      {/*Waiting_for_seller_to_deposit*/}
                                      결제요청
                                    </div>




                                  </div>
                                )}

                                {item.status === 'cancelled' && (
                                  <div className="flex flex-row gap-2 items-center justify-center">
                                       <span className="text-sm text-zinc-500">
                                        {item.seller?.nickname}
                                      </span>

                                      <div className="text-lg text-red-600 font-semibold">
                                        {
                                          Cancelled_at
                                        }
                                      </div>


                                  </div>
                                )}


                                {/* if status is accepted, show payment request button */}
                                {item.status === 'paymentConfirmed' && (
                                  <div className="flex flex-col gap-2 items-center justify-center">

                                    <div className="text-sm text-zinc-500">
                                      {
                                        ///item.store.sellerWalletAddress.slice(0, 6) + '...' + item.store.sellerWalletAddress.slice(-4)
                                        item.seller?.walletAddress.slice(0, 6) + '...' + item.seller?.walletAddress.slice(-4)
                                      }
                                    </div>


                                    <span className="text-lg font-semibold text-yellow-600">
                                      {Completed}
                                    </span>

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
                                          USDT 전송내역(구매자)
                                        </span>
                                      </div>
                                    </button>



                      

                                  </div>
                                )}


                                {item.status === 'completed' && (
                                  <div className="text-sm text-[#409192]">
                                    {Completed_at}
                                  </div>
                                )}

                              </div>
                            </td>



                            <td className="p-2">
                              <div className="flex flex-row items-center gap-2 justify-center">
                                    {item?.settlement
                                    && item?.settlement?.txid
                                    && item?.settlement?.txid !== '0x'
                                    && (
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
                                            url = `https://etherscan.io/tx/${item.settlement.txid}`;
                                          } else if (chain === "polygon") {
                                            url = `https://polygonscan.com/tx/${item.settlement.txid}`;
                                          } else if (chain === "arbitrum") {
                                            url = `https://arbiscan.io/tx/${item.settlement.txid}`;
                                          } else if (chain === "bsc") {
                                            url = `https://bscscan.com/tx/${item.settlement.txid}`;
                                          } else {
                                            url = `https://arbiscan.io/tx/${item.settlement.txid}`;
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
                                    )}

                                  </div>
                                
                            </td>



                            <td className="p-2">

                              <div className="flex flex-row gap-2 items-start justify-start">


                                {
                                (item.status === 'accepted' || item.status === 'paymentRequested')
                                && item.seller && item.seller.walletAddress === address && (
                                  
                                  <div className="flex flex-row items-center gap-2">
                                    <input
                                      type="checkbox"
                                      checked={agreementForCancelTrade[index]}
                                      onChange={(e) => {
                                        setAgreementForCancelTrade(
                                          agreementForCancelTrade.map((item, idx) => idx === index ? e.target.checked : item)
                                        );
                                      }}
                                    />
                                    <button
                                      disabled={cancellings[index] || !agreementForCancelTrade[index]}
                   
                                      className={`
                                        w-24 h-8
                                        flex flex-row
                                        items-center justify-center
                                        gap-1 text-sm text-white px-2 py-1 rounded-md ${cancellings[index] || !agreementForCancelTrade[index] ? 'bg-gray-500' : 'bg-red-500'}`}
                                        
                                      onClick={() => {
                                        cancelTrade(item._id, index);
                                      }}
                                    >
                                      {cancellings[index] && (
                                        <Image
                                          src="/loading.png"
                                          alt="Loading"
                                          width={20}
                                          height={20}
                                          className="animate-spin"
                                        />
                                      )}
                                      
                                      <span className="text-sm">{Cancel_My_Trade}</span>
                                    
                                    </button>
                                  </div>

                                )}
                                {item.status === 'cancelled' && (
                                  <div className="text-sm text-red-600">
                                    
                                  </div>
                                )}
                              </div>
                            </td>


                            <td className="p-2">

                              <div className="flex flex-row gap-2 items-start justify-start">

                                {/*
                                (item.status === 'accepted' || item.status === 'paymentRequested')
                                && item.seller && item.seller.walletAddress === address && (
                                  
                                  <div className="flex flex-row items-center gap-2">
                                    <input
                                      type="checkbox"
                                      checked={agreementForCancelTrade[index]}
                                      onChange={(e) => {
                                        setAgreementForCancelTrade(
                                          agreementForCancelTrade.map((item, idx) => idx === index ? e.target.checked : item)
                                        );
                                      }}
                                    />
                                    <button
                                      disabled={cancellings[index] || !agreementForCancelTrade[index]}
                   
                                      className={`flex flex-row gap-1 text-sm text-white px-2 py-1 rounded-md ${cancellings[index] || !agreementForCancelTrade[index] ? 'bg-gray-500' : 'bg-red-500'}`}
                                        
                                      onClick={() => {
                                        cancelTrade(item._id, index);
                                      }}
                                    >
                                      {cancellings[index] && (
                                        <Image
                                          src="/loading.png"
                                          alt="Loading"
                                          width={20}
                                          height={20}
                                          className="animate-spin"
                                        />
                                      )}
                                      
                                      <span className="text-sm">{Cancel_My_Trade}</span>
                                    
                                    </button>
                                  </div>

                                )*/}





                                {user && user.seller &&
                                item.status === 'ordered' && item.walletAddress !== address && (
                                  
                                  <div className="flex flex-row items-center gap-2">
                                    <input
                                      type="checkbox"
                                      checked={agreementForTrade[index]}
                                      onChange={(e) => {
                                        setAgreementForTrade(
                                          agreementForTrade.map((item, idx) => idx === index ? e.target.checked : item)
                                        );
                                      }}
                                    />
                                    <button
                                      disabled={acceptingBuyOrder[index] || !agreementForTrade[index]}
                                      className={`
                                        w-24 h-8
                                        flex flex-row 
                                        items-center justify-center
                                        gap-1 text-sm text-white px-2 py-1 rounded-md
                                        ${acceptingBuyOrder[index] || !agreementForTrade[index] ?
                                          'bg-zinc-500 text-white' :
                                          'bg-green-600 text-white '}
                                      `}
                                      onClick={() => {
                                        acceptBuyOrder(index, item._id, smsReceiverMobileNumber);
                                      }}
                                    >
                                      {acceptingBuyOrder[index] && (
                                        <Image
                                          src="/loading.png"
                                          alt="Loading"
                                          width={20}
                                          height={20}
                                          className="w-4 h-4 animate-spin "
                                        />
                                      )}
                                      <span className="text-sm">{Buy_Order_Accept}</span>
                                      
                                    </button>
                                  </div>

                                )}






                                
                                {
                                  item.seller && item.seller.walletAddress === address &&
                                  item.status === 'accepted' && (
                                  <div className="flex flex-row gap-2">

                                    {/* check box for agreement */}
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
                                      
                                      className={`
                                        w-24 h-8
                                        flex flex-row gap-1 text-sm text-white px-2 py-1 rounded-md ${escrowing[index] || requestingPayment[index] || !requestPaymentCheck[index] ? 'bg-gray-500' : 'bg-green-600'}`}
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
                                      <span className="text-sm">
                                        {Request_Payment}
                                      </span>
                                    
                                    </button>

                                  </div>
                                )}










                                {item.seller && item.seller.walletAddress === address &&   
                                item.status === 'paymentRequested' && (

                                  <div className="flex flex-row gap-2">

                               
                                    
                                    <div className="flex flex-row gap-2">

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
                                        className={`
                                          w-32 h-8
                                          flex flex-row
                                          items-center justify-center
                                          gap-1 text-sm text-white px-2 py-1 rounded-md ${confirmingPayment[index] || !confirmPaymentCheck[index] ? 'bg-gray-500' : 'bg-green-600'}`}

                                
                                        onClick={() => {
                                          confirmPayment(
                                            index,
                                            item._id,
                                            paymentAmounts[index],
                                            paymentAmountsUsdt[index]
                                          );
                                        }}

                                      >
                                        
                                        {confirmingPayment[index] && (
                                          <Image
                                            src="/loading.png"
                                            alt="Loading"
                                            width={20}
                                            height={20}
                                            className="w-4 h-4 animate-spin "
                                          />
                                        )}
                                        <span className="text-sm">
                                          USDT 전송
                                        </span>

                                      </button>

                                    </div>


                                    {!isWithoutEscrow && (
                                      <div className="flex flex-row gap-2">

                                        <input
                                          disabled={rollbackingPayment[index]}
                                          type="checkbox"
                                          checked={rollbackPaymentCheck[index]}
                                          onChange={(e) => {
                                            setRollbackPaymentCheck(
                                              rollbackPaymentCheck.map((item, idx) => {
                                                if (idx === index) {
                                                  return e.target.checked;
                                                }
                                                return item;
                                              })
                                            );
                                          }}
                                        />

                                        <button
                                          disabled={rollbackingPayment[index] || !rollbackPaymentCheck[index]}
                                          className={`
                                            w-24 h-8
                                            flex flex-row
                                            items-center justify-center
                                            gap-1 text-sm text-white px-2 py-1 rounded-md ${rollbackingPayment[index] || !rollbackPaymentCheck[index] ? 'bg-gray-500' : 'bg-red-500'}`}
                                          onClick={() => {
                                            rollbackPayment(
                                              index,
                                              item._id,
                                              paymentAmounts[index],
                                              paymentAmountsUsdt[index]
                                            );
                                          }}

                                        >
                                            
                                            <Image
                                              src="/loading.png"
                                              alt="loading"
                                              width={16}
                                              height={16}
                                              className={rollbackingPayment[index] ? 'animate-spin' : 'hidden'}
                                            />
                                            <span className="text-sm">
                                              에스크로 취소
                                            </span>

                                        </button>

                                      </div>
                                    )}


                                  </div>

                                



                                )}

                                

                              </div>


                            </td>

                            {/* 출금상태: buyer.depositCompleted */}
                            <td className="p-2">

                              {item.status !== 'cancelled' && (
                                <>   
                                  {item?.buyer?.depositCompleted !== true
                                  ? (
                                    <div className="text-sm text-red-600
                                    flex flex-row items-center gap-2
                                    border border-red-600
                                    rounded-md px-2 py-1">
                                      출금대기중
                                    </div>
                                  ) : (
                                    <div className="text-sm text-[#409192]
                                    flex flex-row items-center gap-2
                                    border border-green-600
                                    rounded-md px-2 py-1">
                                      출금완료
                                    </div>
                                  )}
                                </>
                              )}
                            
                            </td>

                          </tr>

                        ))}

                      </tbody>

                    </table>

                  </div>


                ) : (

                  <div className="w-full grid gap-4 lg:grid-cols-2 xl:grid-cols-3 justify-center ">

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
                              //key={index}
                              className={` w-96 xl:w-full h-full relative
                                ${item.walletAddress === address ? 'border-green-600' : 'border-gray-200'}

                                ${item.status === 'accepted' || item.status === 'paymentRequested' ? 'border-red-600' : 'border-gray-200'}

                                p-4 rounded-md border bg-black bg-opacity-50
                            `}
                          >

                            {item.status === 'ordered' && (

    
                              <div className="w-full flex flex-col gpa-2 items-start justify-start">


                                  <div className="w-full flex flex-row items-center justify-between gap-2">

                                    <div className="flex flex-row items-center gap-2">

                                      {/* if createdAt is recent 1 hours, show new badge */}
                                      {new Date().getTime() - new Date(item.createdAt).getTime() < 1000 * 60 * 60 && (
                                        <Image
                                          src="/icon-new.png"
                                          alt="New"
                                          width={28}
                                          height={28}
                                        />
                                      )}

                                      <Image
                                        src="/icon-public-sale.png"
                                        alt="Public Sale"
                                        width={28}
                                        height={28}
                                      />

                                    

                                      {params.lang === 'ko' ? (

                                        <p className="text-sm text-zinc-500">

                                        
                                          {

                                            new Date().getTime() - new Date(item.createdAt).getTime() < 1000 * 60 ? (
                                              ' ' + Math.floor((new Date().getTime() - new Date(item.createdAt).getTime()) / 1000) + ' ' + seconds_ago
                                            ) :
                                            new Date().getTime() - new Date(item.createdAt).getTime() < 1000 * 60 * 60 ? (
                                            ' ' + Math.floor((new Date().getTime() - new Date(item.createdAt).getTime()) / 1000 / 60) + ' ' + minutes_ago
                                            ) : (
                                              ' ' + Math.floor((new Date().getTime() - new Date(item.createdAt).getTime()) / 1000 / 60 / 60) + ' ' + hours_ago
                                            )
                                          }{' '}{Buy_Order_Opened} 

                                        </p>
                                        
                                        ) : (

                                          <p className="text-sm text-zinc-500">


                                        
                                          {Buy_Order_Opened}{' '}{

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

                                    </div>



                                    {/* share button */}
                                    {/*
                                    <button
                                      className="text-sm bg-blue-500 text-white px-2 py-1 rounded-md hover:bg-blue-600"
                                      onClick={() => {

                                        window.open(`https://gold.goodtether.com/${params.lang}/sell-usdt/${item._id}`, '_blank');

                                      }}
                                    >
                                      <Image
                                        src="/icon-share.png"
                                        alt="Share"
                                        width={20}
                                        height={20}
                                      />
                                    </button>
                                    */}


                                  </div>


                                  {24 - Math.floor((new Date().getTime() - new Date(item.createdAt).getTime()) / 1000 / 60 / 60) > 0 ? (

                                    <div className="mt-2 flex flex-row items-center space-x-2">
                                      <Image
                                        src="/icon-timer.webp"
                                        alt="Timer"
                                        width={28}
                                        height={28}
                                      />
                                      <p className="text-sm text-zinc-500">{Expires_in} {
      
                                        24 - Math.floor((new Date().getTime() - new Date(item.createdAt).getTime()) / 1000 / 60 / 60) - 1

                                        } {hours} {
                                          60 - Math.floor((new Date().getTime() - new Date(item.createdAt).getTime()) / 1000 / 60) % 60
                                        } {minutes}

                                      </p>
                                    </div>

                                  ) : (
                                    <div className="mt-2 flex flex-row items-center space-x-2">
                                      {/*
                                      <Image
                                        src="/icon-timer.webp"
                                        alt="Expired"
                                        width={28}
                                        height={28}
                                      />
                                      <p className="text-sm text-zinc-500">Expired</p>
                                      */}
                                    </div>
                                  )}
      
                              </div>

                            )}





                            { (item.status === 'accepted' || item.status === 'paymentRequested' || item.status === 'cancelled') && (
                                
                              <div className={`
                                ${item.status !== 'cancelled' && 'h-16'}

                                mb-4 flex flex-row items-center bg-zinc-800 px-2 py-1 rounded-md`}>
                                  <Image
                                    src="/icon-trade.png"
                                    alt="Trade"
                                    width={32}
                                    height={32}
                                  />


                                  <p className="text-sm font-semibold text-[#409192] ">
                                    {item.tradeId}
                                  </p>

                                  {item.status === 'cancelled' ? (
                                    <p className="ml-2 text-sm text-zinc-500">
                                      {new Date(item.acceptedAt)?.toLocaleString()}
                                    </p>
                                  ) : (
                                    
                                    <>
                                      {params.lang === 'ko' ? (

                                        <p className="ml-2 text-sm text-zinc-500">

                                        
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

                                        <p className="ml-2 text-sm text-zinc-500">

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




                                    </>
                                  
                                  )}



                                    {/* share button */}
                                    <button
                                      className="ml-5 text-sm bg-blue-500 text-white px-2 py-1 rounded-md hover:bg-blue-600"
                                      onClick={() => {

                                        //window.open(`https://gold.goodtether.com/${params.lang}/${params.center}/sell-usdt/${item._id}`, '_blank');

                                        // copy to clipboard

                                        navigator.clipboard.writeText(`https://gold.goodtether.com/${params.lang}/${params.center}/sell-usdt/${item._id}`);

                                        toast.success('Link copied to clipboard');

                                      }}
                                    >
                                      <Image
                                        src="/icon-share.png"
                                        alt="Share"
                                        width={20}
                                        height={20}
                                      />
                                    </button>



                                </div>
                            )}


                              {/*
                              
                              {item.acceptedAt && (
                                <p className="mb-2 text-sm text-zinc-500">
                                  Trade started at {new Date(item.acceptedAt).toLocaleDateString() + ' ' + new Date(item.acceptedAt).toLocaleTimeString()}
                                </p>
                              )}
                              */}




                            {item.status === 'cancelled' && (
                                <div className="mt-4 flex flex-row items-center gap-2">
                                  <Image
                                    src='/icon-cancelled.webp'
                                    alt='cancel'
                                    width={20}
                                    height={20}
                                  />
                                  <p className="text-sm text-red-500">
                                    {Cancelled_at} {
                                      new Date(item.cancelledAt).toLocaleDateString() + ' ' + new Date(item.cancelledAt).toLocaleTimeString()
                                    }
                                  </p>
                                </div>
                              )}




                    

                              <div className="mt-4 flex flex-col items-start">



                                <p className="text-2xl text-zinc-500">
                                  {Price}: {
                                    // currency
                                  
                                    Number(item.krwAmount)?.toLocaleString('ko-KR', {
                                      style: 'currency',
                                      currency: 'KRW',
                                    })

                                  }
                                </p>

                                <div className="mt-2 flex flex-row items-start gap-2">

                                  <p className="text-xl font-semibold text-zinc-500">
                                    {item.usdtAmount}{' '}USDT
                                  </p>
                                  <p className="text-lg font-semibold text-zinc-500">{Rate}: {

                                    Number(item.krwAmount / item.usdtAmount).toFixed(3)

                                    }</p>
                                </div>


                              </div>

                      

                              <div className="mb-4 flex flex-col items-start text-sm ">
                                {Payment}: {Bank_Transfer} ({item.seller?.bankInfo?.bankName})
                              </div>



                              <div className="flex flex-col items-start justify-start gap-2">
                                <p className="mt-2 mb-2 flex items-center gap-2">

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

                                  <div className="flex flex-col gap-2 items-start">
                                    <div className="flex items-center space-x-2">{Buyer}:</div>

                                    <div className="text-sm font-semibold">
                                      {item.walletAddress === address ? 'Me' : item.nickname}
                                    </div>
                                    <div className="text-lg text-[#409192]">
                                      {item.buyer?.depositName}
                                    </div>
                                  </div>

                                  <Image
                                    src="/verified.png"
                                    alt="Verified"
                                    width={20}
                                    height={20}
                                    className="rounded-lg"
                                  />

                                  <Image
                                    src="/best-buyer.png"
                                    alt="Best Buyer"
                                    width={20}
                                    height={20}
                                    className="rounded-lg"
                                  />

                                </p>


                                {address && item.walletAddress !== address && item?.buyer && item?.buyer?.walletAddress === address && (
                                  <button
                                    className="bg-green-600 text-white px-4 py-2 rounded-lg"
                                    onClick={() => {
                                        //console.log('Buy USDT');
                                        // go to chat
                                        // close modal
                                        //closeModal();
                                        ///goChat(item._id, item.tradeId);

                                        router.push(`/${params.lang}/${params.center}/sell-usdt/${item._id}`);

                                    }}
                                  >
                                    {Chat_with_Buyer + ' ' + item.nickname}
                                  </button>
                                )}


                              </div>




                              {/* buyer cancelled the trade */}
                              {item.status === 'cancelled' && (
                                <div className="mt-4 flex flex-col gap-2 items-start justify-center">
                                  <div className="flex flex-row items-center gap-2">
                                    <Image
                                      src={item?.buyer?.avatar || "/profile-default.png"}
                                      alt="Profile Image"
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
                                    <p className="text-sm text-red-500 font-semibold">
                                      {Buyer}: {
                                        address && item?.buyer?.walletAddress === address ? Me :
                                        address && item?.buyer?.nickname ? item?.buyer?.nickname : Anonymous
                                      }
                                    </p>
  
                                  </div>


                                </div>
                              )}



                              {(item.status === 'accepted' || item.status === 'paymentRequested') && (
                          
                                <div className="mt-4 flex flex-row items-center gap-2">
                                  <Image
                                    src={item.seller?.avatar || "/profile-default.png"}
                                    alt="Profile Image"
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
                                  <p className="text-xl text-[#409192] font-semibold">
                                    {Seller}: {
                                      item.seller?.walletAddress === address ? Me :
                                      item.seller?.nickname.substring(0, 1) + '***'
                                    }
                                  </p>
                                  <Image
                                    src="/verified.png"
                                    alt="Verified"
                                    width={20}
                                    height={20}
                                    className="rounded-lg"
                                  />
                                </div>
                              
                              )}
                            

                              {/* waiting for escrow */}
                              {item.status === 'accepted' && (



                                <div className="mt-4 flex flex-col gap-2 items-center justify-start">


                                    
                                    
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
                                        {Waiting_for_seller_to_deposit} {item.usdtAmount} USDT {to_escrow}...
                                      </span>

                                      <span className="text-sm text-zinc-500">

                                        {If_the_seller_does_not_deposit_the_USDT_to_escrow},

                                        {this_trade_will_be_cancelled_in} {

                                          (1 - Math.floor((new Date().getTime() - new Date(item.acceptedAt).getTime()) / 1000 / 60 / 60) - 1) > 0
                                          ? (1 - Math.floor((new Date().getTime() - new Date(item.acceptedAt).getTime()) / 1000 / 60 / 60) - 1) + ' ' + hours
                                          : (60 - Math.floor((new Date().getTime() - new Date(item.acceptedAt).getTime()) / 1000 / 60) % 60) + ' ' + minutes

                                        } 

                                      </span>
                                    </div>
                                  </div>





                                  {item.buyer?.walletAddress === address && (

                                    <div className="mt-4 flex flex-col items-center justify-center gap-2">



                                      <div className="flex flex-row items-center gap-2">
                                        <input
                                          type="checkbox"
                                          checked={agreementForCancelTrade[index]}
                                          onChange={(e) => {
                                            setAgreementForCancelTrade(
                                              buyOrders.map((item, idx) => {
                                                if (idx === index) {
                                                  return e.target.checked;
                                                } else {
                                                  return false;
                                                }
                                              })
                                            );
                                          }}
                                        />
                                        <label className="text-sm text-zinc-500">
                                          {I_agree_to_cancel_the_trade}
                                        </label>
                                      </div>


                                      <div className="mt-5 flex flex-row items-center gap-2">

                                        <button
                                          disabled={cancellings[index] || !agreementForCancelTrade[index]}
                                          className={`text-sm bg-red-500 text-white px-2 py-1 rounded-md ${cancellings[index] || !agreementForCancelTrade[index] ? 'opacity-50 cursor-not-allowed' : 'hover:bg-red-600'}`}
                                          onClick={() => {

                                            cancelTrade(item._id, index);

                                          }}
                                        >

                                          <div className="flex flex-row items-center gap-2 px-2 py-1">
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
                                                  width={16}
                                                  height={16}
                                                />
                                              </div>
                                            ) : (
                                              <Image
                                                src="/icon-cancelled.png"
                                                alt="Cancel"
                                                width={16}
                                                height={16}
                                              />
                                            )}
                                            {Cancel_My_Trade}
                                          </div>
                                            
                                        
                                        </button>
                                      </div>

                                    </div>

                                  )}


                                </div>
                              )}



                              {/* if status is accepted, show payment request button */}
                              {item.status === 'paymentConfirmed' && (
                                <div className="flex flex-col gap-1">
                                  <span className="text-sm font-semibold text-[#409192]">
                                    {Completed}
                                  </span>
                                  <span>{
                                    item.paymentConfirmedAt && new Date(item.paymentConfirmedAt)?.toLocaleString()
                                  }</span>
                                </div>
                              )}

                              {
                              item.seller && item.seller.walletAddress === address &&
                              item.status === 'accepted' && (
                                <div className="flex flex-row gap-1">

                                  {/* check box for agreement */}
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
                                    
                                    className={`flex flex-row gap-1 text-sm text-white px-2 py-1 rounded-md ${escrowing[index] || requestingPayment[index] || !requestPaymentCheck[index] ? 'bg-gray-500' : 'bg-green-600'}`}
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
                              
                                          chain === 'arbitrum' ? window.open(`https://arbiscan.io/tx/${item.escrowTransactionHash}`) : window.open(`https://arbiscan.io/tx/${item.escrowTransactionHash}`);
                                          chain === 'bsc' ? window.open(`https://bscscan.com/tx/${item.escrowTransactionHash}`) : window.open(`https://bscscan.com/tx/${item.escrowTransactionHash}`);
                                          chain === 'polygon' ? window.open(`https://polygonscan.com/tx/${item.escrowTransactionHash}`) : window.open(`https://polygonscan.com/tx/${item.escrowTransactionHash}`);
                                          window.open(`https://arbiscan.io/tx/${item.escrowTransactionHash}`); // default to arbitrum


                                        }}
                                      >
                                        <Image
                                          src={params.center === 'arbitrum' ? '/logo-arbitrum.png' : '/logo-arbitrum.png'}
                                          alt="Chain"
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

                                      <div>Waiting for buyer to send {
                                      item.krwAmount?.toLocaleString('ko-KR', {
                                        style: 'currency',
                                        currency: 'KRW',
                                      })} to seller...</div>
                                    

                                    </div>


                                  </div>
                              )}



                            





                              {item.status === 'ordered' && (
                                <>

                                {acceptingBuyOrder[index] ? (

                                  <div className="flex flex-row items-center gap-2">
                                    <Image
                                      src='/loading.png'
                                      alt='loading'
                                      width={35}
                                      height={35}
                                      className="animate-spin"
                                    />
                                    <div>{Accepting_Order}...</div>
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

                                          <>
                                            {/*
                                            <Image
                                              src="/icon-expired.png"
                                              alt="Expired"
                                              width={80}
                                              height={80}
                                            />
                                            */}
                                        
                                        </>
                                        ) : (
                                          <>

                                            {user?.seller && user?.seller?.bankInfo && (

                

                                              <div className="mt-4 flex flex-col items-center justify-center">

                                                {/* agreement for trade */}
                                                <div className="flex flex-row items-center space-x-2">
                                                  <input
                                                    disabled={!address}
                                                    type="checkbox"
                                                    checked={agreementForTrade[index]}
                                                    onChange={(e) => {
                                                        setAgreementForTrade(
                                                            buyOrders.map((item, idx) => {
                                                                if (idx === index) {
                                                                    return e.target.checked;
                                                                } else {
                                                                    return false;
                                                                }
                                                            })
                                                        );
                                                    }}
                                                  />
                                                  <label className="text-sm text-zinc-500">
                                                    {I_agree_to_the_terms_of_trade}
                                                  </label>
                                                </div>



                                                {/* input sms receiver mobile number */}

                                                {address && agreementForTrade[index] && (
                                                  <div className="mt-8 flex flex-row items-center justify-start gap-2">

                                                    <span className="text-sm text-zinc-500">SMS</span>

                                                    <div className="flex flex-col items-start justify-start">
                                                      <input
                                                        disabled={!address || !agreementForTrade[index]}
                                                        type="text"
                                                        placeholder="SMS Receiver Mobile Number"
                                                        className={`w-full px-4 py-2 rounded-md text-black`}
                                                        value={smsReceiverMobileNumber}
                                                        onChange={(e) => {
                                                            setSmsReceiverMobileNumber(e.target.value);
                                                        }}
                                                      />
                                                    </div>
                                                  </div>
                                                )}

                                                <button
                                                  disabled={!address || !agreementForTrade[index]}
                                                  className={`m-10 text-lg text-white px-4 py-2 rounded-md
                                                    ${!address || !agreementForTrade[index] ? 'bg-zinc-800' : 'bg-green-600 hover:bg-green-600'}
                                                    `}
                                                  onClick={() => {
        
                                                      acceptBuyOrder(index, item._id, smsReceiverMobileNumber);
                                                

                                                  }}
                                                >
                                                  {Buy_Order_Accept} {item.usdtAmount} USDT
                                                </button>


                                              </div>

                                            )}

                                          </>

                                        )}

                                      </div>



                                      )}

                                    </>

                                  )}

                                </>

                              )}



                          </article>




                          {/* status */}
                          {/*
                          <div className="absolute bottom-4 right-4 flex flex-row items-start justify-start">
                            <div className="text-sm text-zinc-500">
                              {item.status === 'ordered' ? 'Order opened at ' + new Date(item.createdAt)?.toLocaleString()
                              : item.status === 'accepted' ? 'Trade started at ' + new Date(item.acceptedAt)?.toLocaleString()
                              : item.status === 'paymentRequested' ? 'Payment requested at ' + new Date(item.paymentRequestedAt)?.toLocaleString()
                              : item.status === 'cancelled' ? 'Trade cancelled at ' + new Date(item.cancelledAt)?.toLocaleString()
                              : item.status === 'paymentConfirmed' ? 'Trade completed at ' + new Date(item.paymentConfirmedAt)?.toLocaleString()
                              : 'Unknown'}
                            </div>
                          </div>
                          */}






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
                  value={limit}
                  onChange={(e) =>
                    
                    //router.push(`/${params.lang}/${params.center}/clearance-request?limit=${Number(e.target.value)}&page=${page}&wallet=${wallet}&searchMyOrders=${searchMyOrders}`)

                    router.push('/' + params.lang + '/' + params.center + '/clearance-request?limit=' + Number(e.target.value) + '&page=1' +
                    '&searchFromDate=' + searchFromDate + '&searchToDate=' + searchToDate)
                  }

                  className="text-sm bg-zinc-800 text-zinc-200 px-2 py-1 rounded-md"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>

              {/* 처음으로 */}
              <button
                disabled={Number(page) <= 1}
                className={`text-sm text-white px-4 py-2 rounded-md ${Number(page) <= 1 ? 'bg-gray-500' : 'bg-green-600 hover:bg-green-600'}`}
                onClick={() => {
                  
                  //router.push(`/${params.lang}/${params.center}/clearance-request?limit=${Number(limit)}&page=1`);

                  router.push('/' + params.lang + '/' + params.center + '/clearance-request?limit=' + Number(limit) + '&page=1' +
                  '&searchFromDate=' + searchFromDate + '&searchToDate=' + searchToDate)
                }}
              >
                처음
              </button>


              <button
                disabled={Number(page) <= 1}
                className={`text-sm text-white px-4 py-2 rounded-md ${Number(page) <= 1 ? 'bg-gray-500' : 'bg-green-600 hover:bg-green-600'}`}
                onClick={() => {
                  
                  //router.push(`/${params.lang}/${params.center}/clearance-request?limit=${Number(limit)}&page=${Number(page) - 1}`);

                  router.push('/' + params.lang + '/' + params.center + '/clearance-request?limit=' + Number(limit) + '&page=' + (Number(page) - 1) +
                  '&searchFromDate=' + searchFromDate + '&searchToDate=' + searchToDate)
                }}
              >
                이전
              </button>


              <span className="text-sm text-zinc-500">
                {page} / {Math.ceil(Number(totalCount) / Number(limit))}
              </span>


              <button
                disabled={Number(page) >= Math.ceil(Number(totalCount) / Number(limit))}
                className={`text-sm text-white px-4 py-2 rounded-md ${Number(page) >= Math.ceil(Number(totalCount) / Number(limit)) ? 'bg-gray-500' : 'bg-green-600 hover:bg-green-600'}`}
                onClick={() => {
                  
                  //router.push(`/${params.lang}/${params.center}/clearance-request?limit=${Number(limit)}&page=${Number(page) + 1}`);

                  router.push('/' + params.lang + '/' + params.center + '/clearance-request?limit=' + Number(limit) + '&page=' + (Number(page) + 1) +
                  '&searchFromDate=' + searchFromDate + '&searchToDate=' + searchToDate)
                }}
              >
                다음
              </button>

              {/* 마지막 */}
              <button
                disabled={Number(page) >= Math.ceil(Number(totalCount) / Number(limit))}
                className={`text-sm text-white px-4 py-2 rounded-md ${Number(page) >= Math.ceil(Number(totalCount) / Number(limit)) ? 'bg-gray-500' : 'bg-green-600 hover:bg-green-600'}`}
                onClick={() => {
                  
                  //router.push(`/${params.lang}/${params.center}/clearance-request?limit=${Number(limit)}&page=${Math.ceil(Number(totalCount) / Number(limit))}`);
                  router.push('/' + params.lang + '/' + params.center + '/clearance-request?limit=' + Number(limit) + '&page=' + Math.ceil(Number(totalCount) / Number(limit)) +
                  '&searchFromDate=' + searchFromDate + '&searchToDate=' + searchToDate)
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

                {/*
          <Modal isOpen={isModalOpen} onClose={closeModal}>
              <TradeDetail
                  closeModal={closeModal}
                  //goChat={goChat}
              />
          </Modal>
          */}


          <ModalUser isOpen={isModalOpen} onClose={closeModal}>
              <UserPaymentPage
                  closeModal={closeModal}
                  selectedItem={selectedItem}
              />
          </ModalUser>



        </main>

    );


};




const UserPaymentPage = (
  {
      closeModal = () => {},
      selectedItem = null as {
        _id: string;
        nickname: string;
        storecode: string;
        buyer?: {
          depositBankName?: string;
          depositBankAccountNumber?: string;
          depositName?: string
        }
      } | null,
  }
) => {

  return (
    <div className="w-full flex flex-col items-center justify-center gap-4">
      <h1 className="text-2xl font-semibold">상세정보</h1>
      
      {/* iframe */}
      <iframe
        src={`https://cryptoss-runway.vercel.app/ko/${selectedItem?.storecode}/pay-usdt-reverse/${selectedItem?._id}`}

        
          
        width="400px"
        height="500px"
        className="border border-zinc-300 rounded-lg"
        title="Page"
      ></iframe>


      <button
        onClick={closeModal}
        className="bg-[#3167b4] text-white px-4 py-2 rounded-lg hover:bg-[#3167b4]/80"
      >
        닫기
      </button>
    </div>
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
    const receiveAmount = (amount / price).toFixed(3);
    const commission = 0.01; // example commission
  
    return (

      <div className="max-w-2xl mx-auto bg-white shadow-lg rounded-lg p-6">
        <div className="flex items-center">
          <span className="inline-block w-4 h-4 rounded-full bg-green-600 mr-2"></span>
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
                className="bg-green-600 text-white px-4 py-2 rounded-lg"
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



