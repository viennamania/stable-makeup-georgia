'use client';


import { useState, useEffect, use } from "react";



import { toast } from 'react-hot-toast';

import { client } from "../client";

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

import { balanceOf, transfer } from "thirdweb/extensions/erc20";
 






// open modal

import Modal from '../../components/modal';

import { useRouter }from "next//navigation";



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

  seller: any;

  status: string;

  acceptedAt: string;
  paymentRequestedAt: string;
  paymentConfirmedAt: string;
  cancelledAt: string;


  tradeId: string;

  buyer: any;
}





const wallets = [
  inAppWallet({
    auth: {
      options: ["phone", "email"],
    },
  }),
];



const contractAddress = "0xc2132D05D31c914a87C6611C10748AEb04B58e8F"; // USDT on Polygon
const contractAddressArbitrum = "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9"; // USDT on Arbitrum


// get a contract
const contract = getContract({
  // the client you have created via `createThirdwebClient()`
  client,
  // the chain the contract is deployed on
  chain: arbitrum,
  // the contract's address
  address: contractAddressArbitrum,
  // OPTIONAL: the contract's abi
  //abi: [...],
});



const P2PTable = () => {





  const smartAccount = useActiveAccount();

  const address = smartAccount?.address || "";




  const [balance, setBalance] = useState(0);



  useEffect(() => {

    if (!address) return;
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

  } , [address]);






    const router = useRouter();


  /*
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white border border-gray-200">
        <thead>
          <tr>
            <th className="px-4 py-2 border-b">Advertiser (Completion rate)</th>
            <th className="px-4 py-2 border-b">Price</th>
            <th className="px-4 py-2 border-b">Limit/Available</th>
            <th className="px-4 py-2 border-b">Payment method</th>
            <th className="px-4 py-2 border-b">Trade</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => (
            <tr key={index} className="border-b">
              <td className="px-4 py-2">
                <span className={`inline-block w-2 h-2 rounded-full ${item.trades > 300 ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                <span className="ml-2">{item.advertiser}</span>
                <span className="ml-2 text-gray-500">{item.trades} trades</span>
              </td>
              <td className="px-4 py-2">{item.price} KRW</td>
              <td className="px-4 py-2">{item.limit} <br /> {item.available}</td>
              <td className="px-4 py-2">
                {item.paymentMethods.map((method, idx) => (
                  <span key={idx} className="inline-block bg-yellow-100 text-yellow-800 text-xs px-2 rounded-full mr-2 mb-1">{method}</span>
                ))}
              </td>
              <td className="px-4 py-2 text-green-500 cursor-pointer">Buy USDT</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
    */

  /*
        <article>
        <h2 className="text-lg font-semibold mb-2">{props.title}</h2>
        <p className="text-sm text-zinc-400">{props.description}</p>
      </article>
    */






    
    const [sellOrders, setSellOrders] = useState<SellOrder[]>([]);


    useEffect(() => {

        if (!address) {
          return;
        }
        
        const fetchSellOrders = async () => {
          // api call
          const response = await fetch('/api/order/getSellTrades', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              walletAddress: address
            })
          });
  
          const data = await response.json();
  
          ///console.log('data', data);
  
          if (data.result) {
            setSellOrders(data.result.orders);
          }
  
        };
  
        fetchSellOrders();

        // fetch sell orders every 10 seconds
        // 여기서 버그발생 리스레수하면 코인전송후 처리가 안된다.
        /*
        const interval = setInterval(() => {
          fetchSellOrders();
        } , 10000);

        return () => clearInterval(interval);
        */
  
    }, [address]);





    const [isModalOpen, setModalOpen] = useState(false);

    const closeModal = () => setModalOpen(false);
    const openModal = () => setModalOpen(true);




    const  goChat = async (

      orderId: string,
      tradeId: string
    ) => {


      const url = 'https://api-CC1B09FC-0FEF-4C9C-96D0-E5D464ADF155.sendbird.com/v3/open_channels';



      const result = await fetch(url, {
        method: 'POST',

        headers: {
          'Content-Type': 'application/json',
          'Api-Token': 'd5e9911aa317c4ee9a3be4fce38b878941f11c68',
        },

        body: JSON.stringify({
          name: tradeId,
          channel_url: orderId,
          cover_url: 'https://gold.goodtether.com/icon-trade.png',
          custom_type: 'trade',

        }),
      });

      const data = await result.json();

      console.log('data', data);
          

      console.log('Go Chat');

      router.push(`/chat?channel=${orderId}`);



    }



    

    const [usdtAmount, setUsdtAmount] = useState(0);
    const [krwAmount, setKrwAmount] = useState(0);

    console.log('usdtAmount', usdtAmount);


    useEffect(() => {

      if (usdtAmount === 0) {
        setKrwAmount(0);
        return;
      }
    
        
      setKrwAmount( Math.round(usdtAmount * 1355.17) );

    } , [usdtAmount]);


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
          rate: 1355.17
        })
      });

      const data = await response.json();

      //console.log('data', data);

      if (data.result) {
        toast.success('Sell order has been created');

        setUsdtAmount(0);


        await fetch('/api/order/getSellOrders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            walletAddress: address
          })
        }).then(async (response) => {
          const data = await response.json();
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


    // array of escrowing
    const [escrowing, setEscrowing] = useState([] as boolean[]);

    useEffect(() => {
        
        setEscrowing(
          new Array(sellOrders.length).fill(false)
        );
  
    } , [sellOrders]);


    // array of requestingPayment
    const [requestingPayment, setRequestingPayment] = useState([] as boolean[]);


    ///console.log('requestingPayment', requestingPayment);


    useEffect(() => {

      setRequestingPayment(
        
        
        //new Array(sellOrders.length).fill(false)

        sellOrders.map((item) => {
          
          if (item.status === 'paymentRequested') {
            return true;
          }
          return false;
        } )

  


      );

    } , [sellOrders]);





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
        return;
      }


      if (requestingPayment[index]) {
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

   

      const recipientWalletAddress = "0x2111b6A49CbFf1C8Cc39d13250eF6bd4e1B59cF6";

      // send USDT
      // Call the extension function to prepare the transaction
      const transaction = transfer({
        contract,
        to: recipientWalletAddress,
        amount: amount,
      });
      

      const transactionResult = await sendAndConfirmTransaction({
          transaction: transaction,
          
          account: smartAccount as any,
      });

      console.log(transactionResult);


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
            orderId: orderId,
            transactionHash: transactionResult.transactionHash,
          })
        });

        const data = await response.json();

        //console.log('data', data);


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

          const response = await fetch('/api/order/getSellTrades', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              walletAddress: address
            })
          });
  
          const data = await response.json();
  
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
      

    }



    // request payment check box
    const [requestPaymentCheck, setRequestPaymentCheck] = useState([] as boolean[]);
    useEffect(() => {
        
        setRequestPaymentCheck(
          new Array(sellOrders.length).fill(false)
        );
  
    } , [sellOrders]);




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
          orderId: orderId,
        })
      });

      const data = await response.json();

      //console.log('data', data);

      if (data.result) {

        const response = await fetch('/api/order/getSellTrades', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            walletAddress: address
          })
        });

        const data = await response.json();

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



    
    return (

      <main className="p-4 pb-10 min-h-[100vh] flex items-start justify-center container max-w-screen-xl mx-auto">

        <div className="py-20 w-full">
  
          {/* goto home button using go back icon
          history back
          */}
  
          <div className="flex justify-start space-x-4 mb-10">
              <button onClick={() => router.push('/')} className="text-zinc-100 font-semibold underline">Go Home</button>
          </div>


          <div className="flex flex-col gap-5 items-start justify-center ">

                <div className='flex flex-row items-center space-x-4'>
                  <Image
                      src="/trade-sell.png"
                      alt="USDT"
                      width={40}
                      height={40}
                      className="rounded-lg"
                    />
                  <div className="text-2xl font-semibold">My Sell USDT Trades</div>

                  {!address && (
                    <ConnectButton

                        client={client}

                        wallets={wallets}
                        
                        accountAbstraction={{        
                        chain: arbitrum,
                        //chain: arbitrum,,
                        factoryAddress: "0x655934C0B4bD79f52A2f7e6E60714175D5dd319b", // polygon, arbitrum
                        gasless: true,
                        }}
                        
                        theme={"light"}
                        connectModal={{
                        size: "wide",


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



                {/* my usdt balance */}
                <div className="flex flex-col gap-2 items-start">
                  <div className="text-sm">My Balance</div>
                  <div className="text-5xl font-semibold text-white">
                    {Number(balance).toFixed(2)} <span className="text-lg">USDT</span>
                  </div>
                </div>




                {/* Sell Orders: 2 EA (132 USDT), Trades: 10 EA (43 USDT) */}
                {/* trades is the status is accepted or paymentRequested */}
                
                <div className="flex flex-col xl:flex-row gap-2 xl:gap-5 items-start">
                  <div className="text-sm">
            
                    <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-2"></span>
                    Total: {sellOrders.length} EA ({sellOrders.reduce((acc, item) => acc + item.usdtAmount, 0)} USDT)</div>
                  <div className="text-sm">
             
                    <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-2"></span>
                    Trades: {sellOrders.filter(item => item.status === 'accepted' || item.status === 'paymentRequested').length} EA ({sellOrders.filter(item => item.status === 'accepted' || item.status === 'paymentRequested').reduce((acc, item) => acc + item.usdtAmount, 0)} USDT)</div>

                  <div className="text-sm">
                  
                    <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-2"></span>
                    Completed: {sellOrders.filter(item => item.status === 'paymentConfirmed').length} EA ({sellOrders.filter(item => item.status === 'paymentConfirmed').reduce((acc, item) => acc + item.usdtAmount, 0)} USDT)</div>

                </div>
               





                


                <div className="w-full grid gap-4 lg:grid-cols-3 justify-center">





                    {sellOrders?.map((item, index) => (

                        <article
                            key={index}
                            className={`
                              w-96 xl:w-full bg-black p-4 rounded-md
                              ${item.status === 'paymentConfirmed' ? 'bg-gray-800' : 'bg-black border border-gray-200'}
                              
                            `}
                        >

                            <div className="flex flex-row items-center justify-between gap-2">
                              <p className="text-lg text-green-500">
                                TID: {item.tradeId}
                              </p>
                              {item.status === 'paymentConfirmed' && (
                                <p className="text-sm text-zinc-400">
                                  {new Date(item.acceptedAt)?.toLocaleString()}
                                </p>
                              )}
                            </div>

                            {item.status !== 'paymentConfirmed' && (
                              <p className="mt-4 text-sm text-zinc-400">Trade started at {
                                item.acceptedAt && new Date(item.acceptedAt)?.toLocaleString()
                              }</p>
                            )}

                            {item.status === 'paymentConfirmed' && (
                              <p className="mt-4 text-sm text-zinc-400">Completed at {
                                item.paymentConfirmedAt && new Date(item.paymentConfirmedAt)?.toLocaleString()
                              }</p>
                            )}

                            {item.status === 'cancelled' && (
                              <div className="mt-4 flex flex-row items-center gap-2">
                                <Image
                                  src='/icon-cancelled.webp'
                                  alt='cancel'
                                  width={20}
                                  height={20}
                                />
                                <p className="text-sm text-red-500">
                                  Cancelled at {
                                    new Date(item.cancelledAt).toLocaleDateString() + ' ' + new Date(item.cancelledAt).toLocaleTimeString()
                                  }
                                </p>
                              </div>
                            )}

                            
                            {item.status === 'paymentConfirmed' && (
                              <div className="mt-4 flex flex-row items-center gap-2">

                                <Image
                                  src='/timer.png'
                                  alt='timer'
                                  width={28}
                                  height={28}
                                />

                                <div className="text-sm text-green-500">
                                  Total trading time is {

                                ( (new Date(item.paymentConfirmedAt).getTime() - new Date(item.acceptedAt).getTime()) / 1000 / 60 ).toFixed(0) 

                                  } minutes
                                </div>
                                
                              </div>
                            )}


                          

                            <div className="mt-4 flex flex-row items-between space-x-2">

                              <div className="flex flex-col items-start">
                                <p className="text-2xl font-semibold text-white">{item.usdtAmount} USDT</p>

                                <p className="text-lg text-zinc-400">
                                  Price: {
                                    // currency
                                  
                                    Number(item.krwAmount)?.toLocaleString('ko-KR', {
                                      style: 'currency',
                                      currency: 'KRW',
                                    })

                                  }
                                </p>
                              </div>

                              <div className="flex flex-col items-start">
                                <p className="text-lg font-semibold text-white">Rate: {

                                  Number(item.krwAmount / item.usdtAmount).toFixed(2)

                                }</p>
                              </div>

                            </div>
                          
     


                            { (item.status === 'paymentRequested' || item.status === 'paymentConfirmed')
                              && (

                              <div className="w-full flex flex-col items-start gap-2">

                         

                                <p className="text-sm  text-gray-400">
                                  Payment requested at<br />{new Date(item.paymentRequestedAt).toLocaleDateString() + ' ' + new Date(item.paymentRequestedAt).toLocaleTimeString()}
                                </p>

                                <p className="text-xl text-green-500">
                                  Payment Information
                                </p>

                                <div className="flex flex-col gap-2 text-sm text-left text-white">
                                            
                                  <ul>
                                    <li>
                                      {item.seller?.bankInfo.bankName} {item.seller?.bankInfo.accountNumber} {item.seller?.bankInfo.accountHolder}
                                    </li>
                                    <li>Amount : {item.krwAmount} KRW</li>
                                    {/* 입금자명 표시 */}
                                    <li>Deposit Name : {item.tradeId}</li>
                                  </ul>

                                </div>

                              </div>
                            )}

                            {item.status === 'accepted' && (
                              <p className="text-sm text-zinc-400">
                                Accepted at {new Date(item.acceptedAt).toLocaleDateString() + ' ' + new Date(item.acceptedAt).toLocaleTimeString()}
                              </p>
                            )}


                            {item.status === 'paymentConfirmed' && (
                              <p className="mt-5 text-xl text-green-500">
                                Buyer: {item?.buyer?.nickname}
                              </p>
                            )}


                            {(item.status === 'accepted' || item.status === 'paymentRequested') && (
                                <div className="w-full mt-2 mb-2 flex flex-col items-start ">

                                  <div className="flex flex-row items-center gap-2">
                    

                                    
                                      <button
                                          disabled={
                                            item.status === 'accepted' &&
                                            balance < item.usdtAmount
                                          }
                                          className={`
                                              w-full text-lg mt-5
                                              ${ (item.status === 'accepted' && balance < item.usdtAmount) ? 'bg-gray-500' : 'bg-green-500'}
                                              text-white px-4 py-2 rounded-md`}

                                          onClick={() => {

                                              goChat(item._id, item.tradeId);

                                          }}
                                      >
                                          Chat with Buyer 
                                          {
                                             balance >=item.usdtAmount && item?.buyer?.nickname && (
                                            <span className="text-sm text-white ml-2">({item?.buyer?.nickname})</span>
                                          )}
                                          

                                      </button>

                                  </div>
                                 

                         

                                  {item.status === 'accepted' && (


                                    <div className="w-full mt-2 mb-2 flex flex-col items-start ">


                                      {escrowing[index] && (

                                      <div className="p-2 flex flex-col gap-2">
                                        
                                        <div className="flex flex-row items-center gap-2">
                                          <Image
                                              src='/loading.png'
                                              alt='loading'
                                              width={50}
                                              height={50}
                                              className="animate-spin"
                                          />
                                          <div className="text-lg font-semibold text-white">
                                            Escrowing {item.usdtAmount} USDT...
                                          </div>
                                        </div>

                                        {/* 1 escrow USDT */}
                                        {/* 2 request payment to buyer */}
                                        

                                        </div>

                                      )}


                                      {escrowing[index] === false && requestingPayment[index] === true && (
                                        <div className="flex flex-col gpa-2">
                                          Escrow {item.usdtAmount} USDT to the smart contract has been completed.
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
                                            <div className="text-lg font-semibold text-white">
                                              Requesting payment...
                                            </div>
                                          </div>

                                          {/* 1 escrow USDT */}
                                          {/* 2 request payment to buyer */}
                                          

                                        </div>
  
                                      )}


                                      <div className="mt-5 flex flex-row items-center gap-2">
                                        {/* dot */}
                                        <div  className="w-2 h-2 rounded-full bg-green-500"></div>

                                        <div className="text-sm text-zinc-400">
                                          If you request payment, the {item.usdtAmount} USDT will be escrowed to the smart contract and then the buyer ( {item?.buyer?.nickname} ) will be requested to pay.
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

                                            I agree to escrow {item.usdtAmount} USDT to the smart contract and request payment to the buyer ( {item?.buyer?.nickname} )


                                          </div>
                                      </div>

                                      <button
                                          disabled={
                                            balance < item.usdtAmount || requestingPayment[index] || escrowing[index]
                                            || !requestPaymentCheck[index]
                                          }
                                          className={`w-full text-lg
                                            ${balance < item.usdtAmount ? 'bg-red-500' : 'bg-blue-500'}

                                            ${requestPaymentCheck[index] ? 'bg-green-500' : 'bg-gray-500'}
                                            
                                          text-white px-4 py-2 rounded-md mt-4`}

                                          onClick={() => {
                                              console.log('request Payment');
                                              
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
                                              Request Payment
                                              </div>
                                            </div>
                                            <div className="text-lg text-white">
                                              Insufficient Balance
                                            </div>
                                            <div className="text-lg text-white">
                                              You need {item.usdtAmount} USDT
                                            </div>
                                            <div className="text-lg text-white">
                                              You have {balance} USDT
                                            </div>
                                            <div className="text-lg text-white">
                                              Please top up your balance by depositing {item.usdtAmount - balance} USDT
                                            </div>
                                            <div className="text-lg text-white">
                                              Your wallet address is
                                            </div>
                                            <div className="text-xs text-white">
                                              {address.substring(0, 10)}...{address.substring(address.length - 10, address.length)}
                                              
                                            </div>
                                            <div className="text-xs text-white">
                                            
                                              <button
                                                  onClick={() => {
                                                      navigator.clipboard.writeText(address);
                                                      toast.success('Address has been copied');
                                                  }}
                                              className="text-xs bg-green-500 text-white px-2 py-1 rounded-md">Copy</button>
                                            </div>
                                          </div>

                                        ) : (

                                          <div className="flex flex-col gap-2">

                                            <div className="flex flex-row items-center gap-2">
                                              <GearSetupIcon />
                                              <div className="text-lg font-semibold">
                                              Request Payment
                                              </div>
                                            </div>

                                            <div className="flex flex-col gap-2 text-sm text-left text-white">
                                              <ul>
                                                <li>
                                                  {item.seller?.bankInfo.bankName} {item.seller?.bankInfo.accountNumber} {item.seller?.bankInfo.accountHolder}
                                                </li>
                                                <li>Amount : {item.krwAmount} KRW</li>
                                                <li>Deposit Name : {item.tradeId}</li>
                                              </ul>
                                            </div>

                                          </div>
                                        )}


                                      </button>

                                    </div>

                                  

                                  )}

                                </div>
                            )}


                    

                            {item.status === 'paymentRequested' && (

                              <div className="w-full mt-4 mb-2 flex flex-col items-start ">


                                
                                
                                <div className="w-full flex flex-col items-start gap-2">

                                  <div className="flex flex-row items-center gap-2">

                                    <Image
                                      src='/smart-contract.png'
                                      alt='smart-contract'
                                      width={32}
                                      height={32}
                                    />

                                    <span className="textlg text-white">
                                      Escrow: {item.usdtAmount} USDT
                                    </span>

                                    <button
                                        className="ml-5 text-sm bg-white text-white px-2 py-1 rounded-md"
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
                                        <div className="text-lg font-semibold text-white">
                                          
                                          Checking the bank transfer from the buyer ( {item?.buyer?.nickname} )...


                                        </div>
                                      </div>

                                    </div>

                                  )}



                                  <div className="mt-5 flex flex-row items-center gap-2">
                                    {/* dot */}
                                    <div  className="flex w-2 h-2 rounded-full bg-green-500"></div>

                                    <div className="text-sm text-zinc-400">
                                      If you confirm the payment, the escrowed {item.usdtAmount} USDT will be transferred to the buyer ( {item?.buyer?.nickname} ) wallet address.
                                    </div>
                                  </div>

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

                                      I agree to check the bank transfer of {
                                      item.krwAmount?.toLocaleString('ko-KR', {
                                        style: 'currency',
                                        currency: 'KRW',
                                      })} from buyer ( {item?.buyer?.nickname} ) and transfer {item.usdtAmount} USDT to the buyer wallet address.

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
                                    <div className="text-lg font-semibold text-white">
                                      Transfering {item.usdtAmount} USDT to the buyer ( {item?.buyer?.nickname} ) wallet address...
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
                                          text-white px-4 py-2 rounded-md mt-4`}
                                        onClick={() => {
                                            console.log('Canfirm Payment');

                                            //toast.success('Payment has been confirmed');

                                            confirmPayment(index, item._id);
                                            
                                        }}
                                    >
                                      Confirm Payment
                                    </button>
                                  
                                  )}


                              </div>


                            )}



                            {item.status === 'paymentConfirmed' && (

                              <div className="w-full mt-2 mb-2 flex flex-col items-center ">

                                <div className="w-full flex flex-col items-start gap-2">
                                  <div className="flex flex-row items-center gap-2">
                                    <div className="text-lg font-semibold text-red-500">
                                      - {item.usdtAmount} USDT
                                    </div>
                                    <div className="text-lg font-semibold text-white">
                                      /
                                    </div>
                                    <div className="text-lg font-semibold text-green-500">
                                      + {
                                      item.krwAmount?.toLocaleString('ko-KR', {
                                        style: 'currency',
                                        currency: 'KRW',
                                      })
                                      
                                    }
                                    </div>
                                  </div>

                                </div>

                                <Image
                                  src='/confirmed.png'
                                  alt='confirmed'
                                  width={200}
                                  height={200}
                                />

                              </div>
                            )}


                            {/* status */}

                            <div className="mt-10 flex flex-row items-start justify-start">
                              <div className="text-xs text-zinc-400">
                                {item.status === 'ordered' ? 'Order opened at ' + new Date(item.createdAt)?.toLocaleString()
                                : item.status === 'accepted' ? 'Trade started at ' + new Date(item.acceptedAt)?.toLocaleString()
                                : item.status === 'paymentRequested' ? 'Payment requested at ' + new Date(item.paymentRequestedAt)?.toLocaleString()
                                : item.status === 'cancelled' ? 'Trade cancelled at ' + new Date(item.cancelledAt)?.toLocaleString()
                                : item.status === 'paymentConfirmed' ? 'Trade completed at ' + new Date(item.paymentConfirmedAt)?.toLocaleString()
                                : 'Unknown'}
                              </div>
                            </div>



                        </article>

                    ))}

                </div>

            </div>

            
          </div>


          <Modal isOpen={isModalOpen} onClose={closeModal}>
              <TradeDetail
                  closeModal={closeModal}
                  goChat={
                    () => {
                      goChat('12345', '12345');
                    }
                  }
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




export default P2PTable;
