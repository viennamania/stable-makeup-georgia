import { NextResponse, type NextRequest } from "next/server";

import {
	getAllStoresForBalanceInquiry,
} from '@lib/api/store';



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



 
  return NextResponse.json({

    result,
    
  });
  
}
