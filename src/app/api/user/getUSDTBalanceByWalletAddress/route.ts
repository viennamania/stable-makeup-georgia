import { NextResponse, type NextRequest } from "next/server";


import { polygon, arbitrum } from "thirdweb/chains";

export async function POST(request: NextRequest) {

  const body = await request.json();



  const { chain, walletAddress } = body;

  /*
  const result = await engine.backendWallet.getBalance(
    chain: chain === "arbitrum" ? arbitrum : polygon,
    walletAddress,
  )
  */



  const chainId = arbitrum.id;


  const contractAddressPolygon = "0xc2132D05D31c914a87C6611C10748AEb04B58e8F"; // USDT on Polygon

  const contractAddressArbitrum = "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9"; // USDT on Arbitrum

  const contractAddress = contractAddressPolygon;


  try {


    return NextResponse.json({
      result: {
        balance: "0.00",
        currency: "USDT",
        walletAddress: walletAddress,
      },
      error: null,
    });


  } catch (e) {

    console.error("error=", e + "");

    return NextResponse.json({
      result: "error",
      error: e + ""
    });

  }
  
}
