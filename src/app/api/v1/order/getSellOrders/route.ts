import { NextResponse, type NextRequest } from "next/server";



import {
	getAllSellOrders,
} from '@lib/api/order';



export async function GET(request: NextRequest) {

  // get wallet address from request

  let status = request.nextUrl.searchParams.get('status') as string;


  if (status !== 'ordered'
    && status !== 'paymentRequested'
    && status !== 'paymentConfirmed'
  ) {
    /*
    return NextResponse.json({
      error: 'Invalid status',
    });
    */
    status = 'all';
  }


  const searchMyOrders = request.nextUrl.searchParams.get('searchMyOrders') === 'true' ? true : false;

  const walletAddress = request.nextUrl.searchParams.get('walletAddress') as string;

  if (searchMyOrders && !walletAddress) {
    return NextResponse.json({
      error: 'Wallet address is required',
    });
  }

  const limit = request.nextUrl.searchParams.get('limit') ? parseInt(request.nextUrl.searchParams.get('limit') as string, 10) : 10;
  const page = request.nextUrl.searchParams.get('page') ? parseInt(request.nextUrl.searchParams.get('page') as string, 10) : 1;




  const result = await getAllSellOrders({
    status: status,
    limit: limit,
    page: page,
    walletAddress: walletAddress,
    searchMyOrders: searchMyOrders,
  });

 
  return NextResponse.json({

    result,
    
  });
  
}
