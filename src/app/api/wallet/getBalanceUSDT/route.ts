import { NextResponse, type NextRequest } from "next/server";

import { Network, Alchemy } from 'alchemy-sdk';



const settings = {
  apiKey: process.env.ALCHEMY_API_KEY,
  network: Network.MATIC_MAINNET,
};

const alchemy = new Alchemy(settings);

// polygon USDT contract address
const USDT_CONTRACT_ADDRESS = "0xc2132D05D31c914a87C6611C10748AEb04B58e8F";


export async function POST(request: NextRequest) {

  const body = await request.json();

  const { limit, page, walletAddress } = body;



  // balance of USDT
  const balance = await alchemy.core.getTokenBalances(walletAddress, [USDT_CONTRACT_ADDRESS]);

  if (balance.tokenBalances.length === 0) {
    return NextResponse.json({ balance: "0" });
  }

  const usdtBalance = balance.tokenBalances[0].tokenBalance;

  // Convert the balance from string to BigInt, handle null case
  const balanceBigInt = usdtBalance !== null ? BigInt(usdtBalance) : BigInt(0);

  // Convert the balance to a human-readable format (assuming USDT has 6 decimals)
  const humanReadableBalance = balanceBigInt / BigInt(10 ** 6);

  return NextResponse.json({ balance: humanReadableBalance.toString() });

}


