import { NextResponse, type NextRequest } from "next/server";

import {
	insertOneVerified,
} from '@lib/api/user';
import { verifyUserWalletActionGuard } from "@/lib/server/user-wallet-action-guard";



export async function POST(request: NextRequest) {

  let body: Record<string, unknown> = {};
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    body = {};
  }

  const guard = await verifyUserWalletActionGuard({
    request,
    route: "/api/user/setUserVerified",
    body,
    storecodeRaw: body.storecode,
    walletAddressRaw: body.walletAddress,
  });

  if (!guard.ok) {
    return NextResponse.json(
      {
        result: null,
        error: guard.error,
      },
      { status: guard.status }
    );
  }

  const nickname = typeof body.nickname === "string" ? body.nickname.trim() : "";
  const mobile = typeof body.mobile === "string" ? body.mobile.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim() : "";

  


  ///console.log("setUserVerified =====  body", body);

  /*
    setUserVerified =====  body {
    lang: 'ko',
    storecode: 'admin',
    walletAddress: '0x98773aF65AE660Be4751ddd09C4350906e9D88F3',
    nickname: 'georgia',
    mobile: ''
  }
  */
  // 최초에 storecode가 admin 인 Document 를 추가해야한다.




  const result = await insertOneVerified({
    storecode: guard.storecode,
    walletAddress: guard.walletAddress,
    nickname: nickname,
    mobile: mobile,
    email: email,
  });


 
  return NextResponse.json({
    
    result,
    
  });
  
}
