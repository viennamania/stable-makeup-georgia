import { NextResponse, type NextRequest } from "next/server";
import {
  buildUserCreationAudit,
  normalizeBuyerRegistrationInput,
  validateBuyerRegistrationInput,
} from "@/lib/server/user-creation-security";
import { getRequestCountry, getRequestIp } from "@/lib/server/user-read-security";
import { insertPublicBuyerApiCallLog } from "@/lib/api/publicBuyerApiCallLog";

import {
  getUserByNickname,
	insertOne,
} from '@lib/api/user';

import {
  getStoreByStorecode,
  updateLiveOnAndOff,
} from '@lib/api/store';



import { ethers } from "ethers";



import {
  createThirdwebClient,
  eth_getTransactionByHash,
  getContract,
  sendAndConfirmTransaction,
  
  sendBatchTransaction,


} from "thirdweb";

//import { polygonAmoy } from "thirdweb/chains";
import {
  polygon,
  arbitrum,
 } from "thirdweb/chains";

import {
  privateKeyToAccount,
  smartWallet,
  getWalletBalance,
  
 } from "thirdweb/wallets";

const ROUTE = "/api/user/setBuyerWithoutWalletAddressByStorecode";

async function writePublicBuyerApiCallLog({
  request,
  payload,
  status,
  reason = null,
  resultMeta = null,
}: {
  request: NextRequest;
  payload: Record<string, any>;
  status: "success" | "error";
  reason?: string | null;
  resultMeta?: Record<string, unknown> | null;
}) {
  const ip = getRequestIp(request);
  const country = getRequestCountry(request);

  try {
    await insertPublicBuyerApiCallLog({
      route: ROUTE,
      method: request.method,
      status,
      reason,
      publicIp: ip,
      publicCountry: country,
      requestBody: payload,
      resultMeta,
    });
  } catch (error) {
    console.error("Failed to write public buyer api call log:", error);
  }
}


export async function POST(request: NextRequest) {
  let body: any = {};
  try {
    body = await request.json();
  } catch {
    await writePublicBuyerApiCallLog({
      request,
      payload: {},
      status: "error",
      reason: "invalid_json",
    });
    return NextResponse.json({
      result: null,
      error: "Invalid JSON body",
    }, { status: 400 });
  }


  const {
    storecode,
    walletAddress,
    userCode,
    userName,
    userBankName,
    userBankAccountNumber,
    userType,
  } = body;

  //const { storecode, nickname, mobile, password } = body;

  //console.log("body", body);

  //const nickname = userCode; // trim left and right spaces
  const normalizedInput = normalizeBuyerRegistrationInput({
    nickname: userCode,
    userName,
    userBankName,
    userBankAccountNumber,
  });
  const nickname = normalizedInput.nickname;

  const validationError = validateBuyerRegistrationInput({
    nickname,
    userName: normalizedInput.userName,
    userBankName: normalizedInput.userBankName,
    userBankAccountNumber: normalizedInput.userBankAccountNumber,
  }, {
    requireBankName: false,
    requireBankAccountNumber: false,
  });

  if (validationError) {
    await writePublicBuyerApiCallLog({
      request,
      payload: body,
      status: "error",
      reason: validationError,
    });
    return NextResponse.json(
      {
        result: null,
        error: validationError,
      },
      { status: 400 }
    );
  }

  const mobile = "+821012345678";
  const password = "12345678";


  /*
  buyer
  Object
  depositBankName
  "국민은행"
  depositName
  "김성종"
  */
  const buyer = {
    depositBankName: normalizedInput.userBankName || "",
    depositBankAccountNumber: normalizedInput.userBankAccountNumber || "",
    depositName: normalizedInput.userName,
  };



  try {
    const creationAudit = buildUserCreationAudit(request, ROUTE);


    // https://store.otc.earth/Api/walletAddress?storecode=2000001&memberid=google@gmail.com

    // {"result":1,"data":"0x8c1C4C15bd7e74A368E847C8278C0aB9F8182B25"}
    
    /*
    const data = await fetch(`https://store.otc.earth/Api/walletAddress?storecode=${storecode}&memberid=${memberid}`);




    const json = await data?.json();

    if (!json?.data) {
      throw new Error("No wallet address found");
    }

    const walletAddress = json?.data;



    console.log("walletAddress", walletAddress);
    */



    // find user by nickname
    const user = await getUserByNickname(
      storecode,
      nickname
    );


    ///console.log("user", user);

    if (user) {
      await writePublicBuyerApiCallLog({
        request,
        payload: body,
        status: "success",
        reason: "user_already_exists",
        resultMeta: {
          nickname: user?.nickname || null,
          walletAddress: user?.walletAddress || null,
          storecode: user?.storecode || null,
          buyOrderStatus: user?.buyOrderStatus || null,
          userType: user?.userType || "",
          liveOnAndOff: user?.liveOnAndOff,
          isBlack: user?.isBlack || false,
        },
      });
      return NextResponse.json({
        result: "User already exists",
        walletAddress: user.walletAddress,
        storecode: user?.storecode,
        buyOrderStatus: user?.buyOrderStatus,
        userType: user?.userType || '',

        liveOnAndOff: user?.liveOnAndOff,

        isBlack: user?.isBlack || false,
      });
    }

    // 원클릭 스텔스 (alwmkqst) 일경우
    // 등록된 회원이 아닐경우 오류처리

    if (!user && storecode === 'alwmkqst') {
      await writePublicBuyerApiCallLog({
        request,
        payload: body,
        status: "error",
        reason: "user_not_found_for_store_restriction",
        resultMeta: {
          storecode,
          nickname,
        },
      });
      return NextResponse.json({
        result: "User not found",
        walletAddress: null,
        storecode: null,
        buyOrderStatus: null,
        userType: null,
        liveOnAndOff: null,
      });
    }



    
    const userWalletPrivateKey = ethers.Wallet.createRandom().privateKey;




    //console.log("escrowWalletPrivateKey", escrowWalletPrivateKey);

    if (!userWalletPrivateKey) {
      await writePublicBuyerApiCallLog({
        request,
        payload: body,
        status: "error",
        reason: "failed_to_generate_wallet_private_key",
      });
      return NextResponse.json({
        result: null,
      });
    }



    const client = createThirdwebClient({
      secretKey: process.env.THIRDWEB_SECRET_KEY || "",
    });

    if (!client) {
      await writePublicBuyerApiCallLog({
        request,
        payload: body,
        status: "error",
        reason: "failed_to_create_thirdweb_client",
      });
      return NextResponse.json({
        result: null,
      });
    }


    const personalAccount = privateKeyToAccount({
      client,
      privateKey: userWalletPrivateKey,
    });
  

    if (!personalAccount) {
      await writePublicBuyerApiCallLog({
        request,
        payload: body,
        status: "error",
        reason: "failed_to_create_personal_account",
      });
      return NextResponse.json({
        result: null,
      });
    }

    const wallet = smartWallet({
      chain:  polygon ,
      ///factoryAddress: "0x9Bb60d360932171292Ad2b80839080fb6F5aBD97", // your own deployed account factory address
      sponsorGas: true,
    });


    // Connect the smart wallet
    const account = await wallet.connect({
      client: client,
      personalAccount: personalAccount,
    });

    if (!account) {
      await writePublicBuyerApiCallLog({
        request,
        payload: body,
        status: "error",
        reason: "failed_to_connect_smart_wallet",
      });
      return NextResponse.json({
        result: null,
      });
    }
    


    const userWalletAddress = account.address;

    








    const result = await insertOne({
      storecode: storecode,
      walletAddress: userWalletAddress,
      walletPrivateKey: userWalletPrivateKey,
      nickname: nickname,
      mobile: mobile,
      password: password,
      buyer: buyer,
      userType: userType,
      createdByApi: ROUTE,
      creationAudit,
    });

    if (!result || result?.error) {
      await writePublicBuyerApiCallLog({
        request,
        payload: body,
        status: "error",
        reason: typeof result?.error === "string" ? result.error : "failed_to_create_buyer",
        resultMeta: {
          walletAddress: userWalletAddress,
          nickname,
          storecode,
        },
      });
      return NextResponse.json({
        result: null,
        walletAddress: userWalletAddress,
        error: result?.error || "Failed to create buyer",
      }, { status: 500 });
    }

    // return wallet address to user

    await writePublicBuyerApiCallLog({
      request,
      payload: body,
      status: "success",
      reason: "buyer_created",
      resultMeta: {
        id: result?.id || null,
        nickname: result?.nickname || nickname,
        storecode: result?.storecode || storecode,
        walletAddress: userWalletAddress,
        userType: userType || null,
        liveOnAndOff: true,
      },
    });

    return NextResponse.json({

      result,
      walletAddress: userWalletAddress,
      userType: userType,
      
      liveOnAndOff: true,
    });


  } catch (error) {
    console.log("error", error);
    await writePublicBuyerApiCallLog({
      request,
      payload: body,
      status: "error",
      reason: error instanceof Error ? error.message : "unexpected_error",
    });

    return NextResponse.json({
      error,
      
    });
  }


 

  
}
