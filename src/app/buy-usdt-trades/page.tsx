'use client';

import { useState, useEffect, use } from "react";

import Image from "next/image";



// open modal

import Modal from '../../components/modal';

import { useRouter }from "next//navigation";


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



import { balanceOf, transfer } from "thirdweb/extensions/erc20";
 





interface SellOrder {
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

  const router = useRouter();



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


  


  // get User by wallet address

  const [user, setUser] = useState<any>(null);
  useEffect(() => {

    if (!address) {
        return;
    }

    fetch('/api/user/getUser', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            walletAddress: address,
        }),
    })
    .then(response => response.json())
    .then(data => {
        //console.log('data', data);
        setUser(data.result);
    })
    .catch((error) => {
        console.error('Error:', error);
    });
  } , [address]);






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

      //router.push(`/chat?channel=${orderId}`);


    }

    

    
    const [sellOrders, setSellOrders] = useState<SellOrder[]>([]);

    useEffect(() => {
        fetch('/api/order/getBuyTrades', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                walletAddress: address,
            }),
        })
        .then(response => response.json())
        .then(data => {
            
            //console.log('data', data);

            setSellOrders(data.result.orders);
        })
        .catch((error) => {
            console.error('Error:', error);
        });
    } , [address]);


    const [acceptingSellOrder, setAcceptingSellOrder] = useState(false);

    const acceptSellOrder = (orderId: string) => {

        if (!user) {
            return;
        }

        setAcceptingSellOrder(true);

        fetch('/api/order/acceptSellOrder', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                orderId: orderId,
                buyerWalletAddress: user.walletAddress,
                buyerNickname: user.nickname,
                buyerAvatar: user.avatar,
                buyerMobile: user.mobile,
            }),
        })
        .then(response => response.json())
        .then(data => {

            console.log('data', data);

            //setSellOrders(data.result.orders);
            //openModal();

            toast.success('Order accepted successfully');



            fetch('/api/order/getBuyTrades', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  walletAddress: address,
                }),
            })
            .then(response => response.json())
            .then(data => {
                ///console.log('data', data);
                setSellOrders(data.result.orders);
            })





        })
        .catch((error) => {
            console.error('Error:', error);
        });

        setAcceptingSellOrder(false);
    }


    // reload button disabled when 10 seconds
    // countdowm 10 seconds for each reload
    const [reloadDisabled, setReloadDisabled] = useState(false);

    const [countdown, setCountdown] = useState(10);

    useEffect(() => {
      const interval = setInterval(() => {
        if (countdown === 0) {

          setReloadDisabled(false);
          setCountdown(10);

          




        } else {
          setCountdown(countdown - 1);
        }
      } , 5000);

      return () => clearInterval(interval);
    } , [countdown]);



    return (

      <main className="p-4 pb-10 min-h-[100vh] flex items-start justify-center container max-w-screen-xl mx-auto">

        <div className="py-20 w-full">
  
  
          <div className="flex justify-start space-x-4 mb-10">
              <button onClick={() => router.push('/')} className="text-zinc-100 font-semibold underline">Go Home</button>
          </div>


          <div className="flex flex-col items-start justify-center space-y-4">

              <div className='flex flex-row items-center space-x-4'>
                  <Image
                      src="/trade-buy.png"
                      alt="USDT"
                      width={40}
                      height={40}
                      className="rounded-lg"
                    />
                  <div className="text-2xl font-semibold">My Buy USDT Trades</div>




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



                <div className="flex flex-row items-center space-x-4">

                  {/* trades is the status is accepted or paymentRequested */}

                  <div className="flex flex-col xl:flex-row gap-2 xl:gap-5 items-start">
                    <div className="text-sm">
                      {/* dot */}
                      <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-2"></span>
                      Total: {sellOrders.length} EA ({
                      Number(sellOrders.reduce((acc, item) => acc + item.usdtAmount, 0)).toFixed(2)
                      } USDT)</div>
                    <div className="text-sm">
                      {/* dot */}
                      <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-2"></span>
                      Trades: {sellOrders.filter(item => item.status === 'accepted' || item.status === 'paymentRequested').length} EA ({
                      sellOrders.filter(item => item.status === 'accepted' || item.status === 'paymentRequested').reduce((acc, item) => acc + item.usdtAmount, 0).toFixed(2)
                      } USDT)</div>

                    <div className="text-sm">
                      {/* dot */}
                      <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-2"></span>
                      Completed: {sellOrders.filter(item => item.status === 'paymentConfirmed').length} EA ({
                      Number(sellOrders.filter(item => item.status === 'paymentConfirmed').reduce((acc, item) => acc + item.usdtAmount, 0)).toFixed(2)
                      } USDT)</div>

                  </div>


                  {/* reload button */}
                  <button

                      disabled={reloadDisabled}


                      className={`text-sm bg-green-500 text-white px-4 py-2 rounded-lg ${reloadDisabled ? 'bg-gray-200 text-gray-700' : ''}`}

                      onClick={() => {

                          setReloadDisabled(true);

                          setCountdown(10);

                          fetch('/api/order/getBuyTrades', {
                              method: 'POST',
                              headers: {
                                  'Content-Type': 'application/json',
                              },
                              body: JSON.stringify({

                                walletAddress: address,

                              }),
                          })
                          .then(response => response.json())
                          .then(data => {
                              ///console.log('data', data);
                              setSellOrders(data.result.orders);
                          })

                      }}
                  >
                      Reload {  countdown > 0 ? `${countdown} sec` : '' }
                  </button>

                </div>




                <div className="w-full grid gap-4 lg:grid-cols-3 justify-center">

                    {sellOrders.map((item, index) => (

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
                        


                            <p className="mt-2 mb-2 flex items-center gap-2">
                              <div className="flex items-center space-x-2">Seller: </div>
                              <Image
                                  src={item.avatar || '/profile-default.png'}
                                  alt="Avatar"
                                  width={28}
                                  height={28}
                                  priority={true} // Added priority property
                                  className="rounded-full"
                                  style={{
                                      objectFit: 'cover',
                                      width: '28px',
                                      height: '28px',
                                  }}
                              />
                              <h2 className="text-lg font-semibold text-green-500">
                                {item.nickname}
                              </h2>


                              <button
                                className="bg-green-500 text-white px-4 py-2 rounded-lg"
                                onClick={() => {
                                    //console.log('Buy USDT');
                                    // go to chat
                                    // close modal
                                    //closeModal();

                                    goChat(item._id, item.tradeId);

                                }}
                              >
                                Chat
                              </button>

                            </p>

                            {/* waiting for escrow */}
                            {item.status === 'accepted' && (
                                <div className="mt-4 flex flex-row gap-2 items-center justify-start">

                                  {/* rotate loading icon */}
                                
                                  <Image
                                    src="/loading.png"
                                    alt="Escrow"
                                    width={32}
                                    height={32}
                                    className="animate-spin"
                                  />

                                  <div>Waiting for seller to deposit {item.usdtAmount} USDT to escrow...</div>

                                </div>
                            )}





                            {item.status === 'paymentConfirmed' && (
                              <div className="w-full flex flex-col items-start gap-2">
                                <div className="flex flex-row items-center gap-2">
                                  <div className="text-lg font-semibold text-red-500">
                                    - {item.krwAmount} KRW
                                  </div>
                                  <div className="text-lg font-semibold text-white">
                                    /
                                  </div>
                                  <div className="text-lg font-semibold text-green-500">
                                    + {item.usdtAmount} USDT
                                  </div>
                                </div>

                                

                                

                              </div>
                            )}


                            {/*item.paymentRequestedAt && (
                              <p className="text-sm text-zinc-400">Payment requested at<br />{
                                item.paymentRequestedAt && new Date(item.paymentRequestedAt)?.toLocaleString()
                              }</p>
                            )*/}

                            {item.status === 'paymentRequested' && (
                              <div className="mt-4 mb-2 flex flex-col gap-2 text-sm text-left bg-gray-800 p-4 rounded-md">
                                <p className="text-xl text-white font-semibold">
                                  Payment Infomation
                                </p>

                              
                                <ul>

                                  <li className="text-lg" >{item.seller?.bankInfo.bankName} {item.seller?.bankInfo.accountNumber} {item.seller?.bankInfo.accountHolder}</li>
                                  <li className="text-lg">Amount : {item.krwAmount} KRW</li>
                                  
                                  <li className="mt-2">You must deposit to the above account using deposit name<br /><br />
                                    <span className="text-red-500 font-semibold text-xl">{item.tradeId}</span>
                                  </li>

                                  {/*
                                  <li className="mt-2">
                                    After deposit, click the button below.
                                  </li>
                                  */}

                                </ul>

                                {/*
                                <button className="m-2 bg-green-500 text-white px-4 py-2 rounded-lg">
                                  Payment Completed
                                </button>
                                */}

                              </div>
                            )}


                            {/*
                            {item.status === 'accepted' && (
                              <button className="mt-2 mb-2 bg-green-500 text-white px-4 py-2 rounded-lg">
                                Cancel Trade
                              </button>
                            )}
                            */}
                            





                           

                            




                            {item.status === 'ordered' && (
                              <>

                              {acceptingSellOrder ? (
                                  <button
                                      disabled={true}
                                      className="text-lg bg-gray-200 text-gray-700 px-4 py-2 rounded-md mt-4"
                                  >
                                      Processing...
                                  </button>
                              ) : (
                                <>
                                  
                                  {item.walletAddress === address ? (
                                    <div className="flex flex-col space-y-4">
                                      My Order
                                    </div>
                                  ) : (

                                      <button
                                          disabled={!user}
                                          className="text-lg bg-green-500 text-white px-4 py-2 rounded-md mt-4"
                                          onClick={() => {
                                              console.log('Buy USDT');

                                              // open trade detail
                                              // open modal of trade detail



                                              //openModal();


                                              acceptSellOrder(item._id);
                                        

                                          }}
                                      >
                                          Buy USDT
                                      </button>

                                    )}

                                  </>

                                )}

                              </>

                            )}


                            {item.status === 'paymentConfirmed' && (
                              <div className="w-full mt-2 mb-2 flex flex-col items-center ">
                                
                                <Image
                                  src='/confirmed.png'
                                  alt='confirmed'
                                  width={200}
                                  height={200}
                                />


                              </div>
                            )}


                        {/* status */}

                        <div className="mt-10 flex flex-row items-start justify-end">
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
