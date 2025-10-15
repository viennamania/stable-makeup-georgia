import { NextResponse, type NextRequest } from "next/server";

import {
	getAllAgentsForBalanceInquiry,
} from '@lib/api/agent';


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
    searchAgent
  } = body;

  //console.log("getAllStores request body", body);


  const result = await getAllAgentsForBalanceInquiry({
    limit: limit || 100,
    page: page || 1,
    //search: '',
    search: searchAgent || '',
  });

  //console.log("getAllAgentsForBalanceInquiry result", result);

  /*
    {
      totalCount: 5,
      agents: [
        {
          _id: new ObjectId('68ad0cced375320e8a69b2ea'),
          agentcode: 'krbdscsd',
          agentName: 'confection',
          agentLogo: 'https://t0gqytzvlsa2lapo.public.blob.vercel-storage.com/P7DIjS7-DxG2zcp7o3qGKniSLTi1UDFehe0akM.png',
          createdAt: '2025-08-26T01:24:30.959Z',
          backgroundColor: 'yellow-100',
          agentFeeWalletAddress: '0x4429A977379fdd42b54A543E91Da81Abe7bb52FD',
          totalUsdtAmount: 118.19,
          liveOnAndOff: true,
          viewOnAndOff: true,
        },
        {
          _id: new ObjectId('68ad00d15359024833432764'),
          agentcode: 'jysmbsco',
          agentName: 'macaron',
          agentLogo: 'https://t0gqytzvlsa2lapo.public.blob.vercel-storage.com/IYigWCF-vj1meScA5QItw3RRVaqxCkEWI98Ay1.png',
          createdAt: '2025-08-26T00:33:21.613Z',
          backgroundColor: 'blue-100',
          agentFeeWalletAddress: '0x4429A977379fdd42b54A543E91Da81Abe7bb52FD',
          totalUsdtAmount: 93.96,
          liveOnAndOff: true,
          viewOnAndOff: true,
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

    // for each agent, get the balance of agentFeeWalletAddress
    for (let i = 0; i < result.agents.length; i++) {
      const agent = result.agents[i];
      if (agent.agentFeeWalletAddress) {
        try {

          const result = await balanceOf({
            contract,
            address: agent.agentFeeWalletAddress,
          });

          if (chain === 'bsc') {
            // USDT has 18 decimals
            agent.currentUsdtBalance = Number(result) / 10 ** 18;
          } else {
            // USDT has 6 decimals
            agent.currentUsdtBalance = Number(result) / 10 ** 6;
          }



        } catch (error) {
          console.error(`Error getting balance for agent ${agent.agentName} (${agent.agentFeeWalletAddress}):`, error);
          agent.currentUsdtBalance = 0;
        }
      } else {
        agent.currentUsdtBalance = 0;
      }
    }

    // sort by currentUsdtBalance desc
    result.agents.sort(
      (a: { currentUsdtBalance?: number }, b: { currentUsdtBalance?: number }) =>
        (b.currentUsdtBalance || 0) - (a.currentUsdtBalance || 0)
    );

    ///console.log("getAllStoresForBalance result with balances", result);

    // sum of currentUsdtBalance
    let totalCurrentUsdtBalance = 0;
    for (let i = 0; i < result.agents.length; i++) {
      const agent = result.agents[i];
      totalCurrentUsdtBalance += agent.currentUsdtBalance || 0;
    }

    result.totalCurrentUsdtBalance = totalCurrentUsdtBalance;

  } catch (error) {
    console.error("Error in getAllAgentsForBalance:", JSON.stringify(error));
  }

 
  return NextResponse.json({

    result,
    
  });
  
}
