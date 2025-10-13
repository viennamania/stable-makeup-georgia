import { NextResponse, type NextRequest } from "next/server";

import {
	getAllStoresForBalanceInquiry,
} from '@lib/api/store';


import {
  createThirdwebClient,
  eth_getTransactionByHash,
  getContract,
  sendAndConfirmTransaction,
  
  sendBatchTransaction,


} from "thirdweb";

//import { polygonAmoy } from "thirdweb/chains";
import {
  ethereum,
  polygon,
  arbitrum,
  bsc,
 } from "thirdweb/chains";

import {
  balanceOf,
} from "thirdweb/extensions/erc20";

import {
  chain,
  ethereumContractAddressUSDT,
  polygonContractAddressUSDT,
  arbitrumContractAddressUSDT,
  bscContractAddressUSDT,

  bscContractAddressMKRW,
} from "@/app/config/contractAddresses";



export async function POST(request: NextRequest) {

  const body = await request.json();

  const {
    limit,
    page,
    searchStore,
  } = body;

  //console.log("getAllStores request body", body);


  const result = await getAllStoresForBalanceInquiry({
    limit: limit || 100,
    page: page || 1,
    //search: '',
    search: searchStore || '',
  });

  //console.log("getAllStoresForBalanceInquiry result", result);
  /*
    {
      totalCount: 5,
      stores: [
        {
          _id: new ObjectId('68ad0cced375320e8a69b2ea'),
          storecode: 'krbdscsd',
          storeName: 'confection',
          storeLogo: 'https://t0gqytzvlsa2lapo.public.blob.vercel-storage.com/P7DIjS7-DxG2zcp7o3qGKniSLTi1UDFehe0akM.png',
          createdAt: '2025-08-26T01:24:30.959Z',
          backgroundColor: 'yellow-100',
          settlementWalletAddress: '0x4429A977379fdd42b54A543E91Da81Abe7bb52FD',
          totalUsdtAmount: 118.19
        },
        {
          _id: new ObjectId('68ad00d15359024833432764'),
          storecode: 'jysmbsco',
          storeName: 'macaron',
          storeLogo: 'https://t0gqytzvlsa2lapo.public.blob.vercel-storage.com/IYigWCF-vj1meScA5QItw3RRVaqxCkEWI98Ay1.png',
          createdAt: '2025-08-26T00:33:21.613Z',
          backgroundColor: 'blue-100',
          settlementWalletAddress: '0x4429A977379fdd42b54A543E91Da81Abe7bb52FD',
          totalUsdtAmount: 93.96
        },
      ]
    }
  */


  try {

    const client = createThirdwebClient({
      secretKey: process.env.THIRDWEB_SECRET_KEY || "",
    });

    // get a contract
    const contract = getContract({
        // the client you have created via `createThirdwebClient()`
        client,
        // the chain the contract is deployed on
        chain: chain === 'ethereum' ? ethereum
                : chain === 'polygon' ? polygon
                : chain === 'arbitrum' ? arbitrum
                : chain === 'bsc' ? bsc
                : bsc,
        // the contract's address
        address: chain === 'ethereum' ? ethereumContractAddressUSDT
                  : chain === 'polygon' ? polygonContractAddressUSDT
                  : chain === 'arbitrum' ? arbitrumContractAddressUSDT
                  : chain === 'bsc' ? bscContractAddressUSDT
                  : bscContractAddressMKRW,

        // OPTIONAL: the contract's abi
        //abi: [...],
    });

    // for each store, get the balance of settlementWalletAddress
    for (let i = 0; i < result.stores.length; i++) {
      const store = result.stores[i];
      if (store.settlementWalletAddress) {
        try {

          const result = await balanceOf({
            contract,
            address: store.settlementWalletAddress,
          });

          if (chain === 'bsc') {
            // USDT has 18 decimals
            store.currentUsdtBalance = Number(result) / 10 ** 18;
          } else {
            // USDT has 6 decimals
            store.currentUsdtBalance = Number(result) / 10 ** 6;
          }



        } catch (error) {
          console.error(`Error getting balance for store ${store.storeName} (${store.settlementWalletAddress}):`, error);
          store.currentUsdtBalance = 0;
        }
      } else {
        store.currentUsdtBalance = 0;
      }
    }

    // sort by currentUsdtBalance desc
    result.stores.sort(
      (a: { currentUsdtBalance?: number }, b: { currentUsdtBalance?: number }) =>
        (b.currentUsdtBalance || 0) - (a.currentUsdtBalance || 0)
    );

    ///console.log("getAllStoresForBalance result with balances", result);

    // sum of currentUsdtBalance
    let totalCurrentUsdtBalance = 0;
    for (let i = 0; i < result.stores.length; i++) {
      const store = result.stores[i];
      totalCurrentUsdtBalance += store.currentUsdtBalance || 0;
    }

    result.totalCurrentUsdtBalance = totalCurrentUsdtBalance;

  } catch (error) {
    console.error("Error in getAllStoresForBalance:", JSON.stringify(error));
  }


 
  return NextResponse.json({

    result,
    
  });
  
}
