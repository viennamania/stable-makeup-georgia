import { NextResponse, type NextRequest } from "next/server";

import {
	getAllSellersForBalanceInquiry,
} from '@lib/api/user';


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
  } = body;

  //console.log("getAllStores request body", body);


  const result = await getAllSellersForBalanceInquiry({
    limit: limit || 100,
    page: page || 1,
  });

  //console.log("getAllSellersForBalanceInquiry result", result);

  /*
    {
      totalCount: 2,
      users: [
        {
          _id: new ObjectId('68acfb7bb8c1f34ff993f85e'),
          id: 5284419,
          nickname: 'cryptoss',
          walletAddress: '0x4429A977379fdd42b54A543E91Da81Abe7bb52FD'
        },
        {
          _id: new ObjectId('68fec05162e030d977139b30'),
          id: 5644419,
          nickname: 'seller1',
          walletAddress: '0x7F3362c7443AE1Eb1790d0A2d4D84EB306fE0bd3'
        }
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

    // for each user, get the balance of walletAddress
    for (let i = 0; i < result.users.length; i++) {
      const user = result.users[i];
      if (user.walletAddress) {
        try {

          const result = await balanceOf({
            contract,
            address: user.walletAddress,
          });

          if (chain === 'bsc') {
            // USDT has 18 decimals
            user.currentUsdtBalance = Number(result) / 10 ** 18;
          } else {
            // USDT has 6 decimals
            user.currentUsdtBalance = Number(result) / 10 ** 6;
          }



        } catch (error) {
          console.error(`Error getting balance for user ${user.nickname} (${user.walletAddress}):`, error);
          user.currentUsdtBalance = 0;
        }
      } else {
        user.currentUsdtBalance = 0;
      }
    }

    // sort by currentUsdtBalance desc
    result.users.sort(
      (a: { currentUsdtBalance?: number }, b: { currentUsdtBalance?: number }) =>
        (b.currentUsdtBalance || 0) - (a.currentUsdtBalance || 0)
    );

    ///console.log("getAllStoresForBalance result with balances", result);

    // sum of currentUsdtBalance
    let totalCurrentUsdtBalance = 0;
    for (let i = 0; i < result.users.length; i++) {
      const user = result.users[i];
      totalCurrentUsdtBalance += user.currentUsdtBalance || 0;
    }

    result.totalCurrentUsdtBalance = totalCurrentUsdtBalance;

  } catch (error) {
    console.error("Error in getAllStoresForBalance:", JSON.stringify(error));
  }

  //console.log("Final getAllSellersForBalance result", result);

 
  return NextResponse.json({

    result,
    
  });
  
}
