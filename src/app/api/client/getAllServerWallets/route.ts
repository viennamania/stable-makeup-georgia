import { NextResponse, type NextRequest } from "next/server";

import {
  createThirdwebClient,
  Engine,
  getContract,
  sendAndConfirmTransaction,
  sendTransaction,
} from "thirdweb";

import { balanceOf, transfer } from "thirdweb/extensions/erc20";
 

export async function POST(request: NextRequest) {


  const client = createThirdwebClient({
    secretKey: process.env.THIRDWEB_SECRET_KEY || "",
  });

  if (!client) {
    return NextResponse.json({
      result: null,
      error: "Thirdweb client is not initialized",
    }, { status: 500 });
  }


  const wallets = await Engine.getServerWallets({
    client,
  });

  //console.log("getAllServerWallet =====  wallets", wallets);
  /*
  {
    accounts: [
      {
        address: '0xf7a2B5aD9398c0E4c98ed35086617764275Bd752',
        smartAccountAddress: '0xa9356206D2d5Ea04aE36632C4C75936F9882Bb79',
        label: 'seller'
      },
      {
        address: '0x8476DAF0BfD4821C0F8a80f91C5Ad7484Ead026c',
        smartAccountAddress: '0x823D8a3f1a6C28064Eb942275c6c3C0287CE5884',
        label: 'seller'
      },
      {
        address: '0x8043358A6cA479Ef4CFDf039f10e7150dcdacff3',
        smartAccountAddress: '0x2dEaF0FEd211D5fB2Ca688F4E952403234BC90ee',
        label: 'Colorado(ONECLICK) Projec Wallet'
      }
    ],
    pagination: { page: 1, limit: 100, totalCount: 3 }
  }
  */




  return NextResponse.json({
    result: wallets,
  });

}
