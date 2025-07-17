import { NextResponse, type NextRequest } from "next/server";

import {
    updateBuyer,
} from '@lib/api/user';



export async function POST(request: NextRequest) {

  const body = await request.json();

  //const { walletAddress, sellerStatus, bankName, accountNumber, accountHolder } = body;


  const {
    storecode,
    walletAddress,
    buyer
  } = body;


  //console.log("walletAddress", walletAddress);
  //console.log("sellerStatus", sellerStatus);




 // https://na.winglobalpay.com/api/v1/vactFcs
  /*
  mchtId : 가맹점 ID
  bankCd : 실명인증 은행코드
  account : 실명인증 계좌번호
  payerName : 발급요청자 실명
  payerTel : 발급요청자 연락처
  dob : 발급요청자 생년월일
  gender : 발급요청자 성별, 0:여성, 1:남성

  recvBankCd : 수취은행코드, 비어있을 경우 광주은행으로 발급됩니다.
  //광주은행:034, 경남은행:039, 제주은행:035

  국민은행: 004, 우리은행: 020, 신한은행: 088, 농협: 011, 기업은행: 003, 하나은행: 081, 외환은행: 002, 부산은행: 032, 대구은행: 031, 전북은행: 037, 경북은행: 071, 부산은행: 032, 광주은행: 034, 우체국: 071, 수협: 007, 씨티은행: 027, 대신은행: 055, 동양종합금융: 054, 롯데카드: 062, 삼성카드: 029, 현대카드: 048, 신한카드: 016, 국민카드: 020, 하나카드: 081, 외환카드: 002, 씨티카드: 027, 현대카드: 048, 롯데카드: 062, 삼성카드: 029, 신한카드: 016, 국민카드: 020, 하나카드: 081, 외환카드: 002, 씨티카드: 027, 현대카드: 048, 롯데카드: 062, 삼성카드: 029, 신한카드: 016, 국민카드: 020, 하나카드: 081, 외환카드: 002, 씨티카드: 027, 현대카드: 048, 롯데카드: 062, 삼성카드: 029, 신한카드: 016, 국민카드: 020, 하나카드: 081, 외환카

  카카오뱅크: 090, 케이뱅크: 089, 토스뱅크: 092,
  */

  //const bankCd = '035';

  const bankCd =
    buyer?.bankInfo?.bankName === '카카오뱅크' ? '090' :
    buyer?.bankInfo?.bankName === '케이뱅크' ? '089' :
    buyer?.bankInfo?.bankName === '토스뱅크' ? '092' :

    buyer?.bankInfo?.bankName === '국민은행' ? '004' :
    buyer?.bankInfo?.bankName === '우리은행' ? '020' :
    buyer?.bankInfo?.bankName === '신한은행' ? '088' :
    buyer?.bankInfo?.bankName === '농협' ? '011' :
    buyer?.bankInfo?.bankName === '기업은행' ? '003' :
    buyer?.bankInfo?.bankName === '하나은행' ? '081' :
    buyer?.bankInfo?.bankName === '외환은행' ? '002' :
    buyer?.bankInfo?.bankName === '부산은행' ? '032' :
    buyer?.bankInfo?.bankName === '대구은행' ? '031' :
    buyer?.bankInfo?.bankName === '전북은행' ? '037' :
    buyer?.bankInfo?.bankName === '경북은행' ? '071' :
    buyer?.bankInfo?.bankName === '광주은행' ? '034' :
    buyer?.bankInfo?.bankName === '우체국' ? '071' :
    buyer?.bankInfo?.bankName === '수협' ? '007' :
    buyer?.bankInfo?.bankName === '씨티은행' ? '027' :
    buyer?.bankInfo?.bankName === '대신은행' ? '055' :
    buyer?.bankInfo?.bankName === '동양종합금융' ? '054'
    : '034';





  //const bankCd = '034';
  const recvBankCd = '035'; // 제주은행


  //const bankAccount = '110019648787';

  const bankAccount = buyer?.bankInfo?.accountNumber || '';



  //const payerName = '박승현';

  const payerName = buyer?.bankInfo?.accountHolder || '';


  //const payerTel = '01098551647';

  const payerTel = buyer?.bankInfo?.phoneNum || '';


  //const dob = '691120';

  const dob = buyer?.bankInfo?.birth || '';



  ///const gender = '1';

  const gender = buyer?.bankInfo?.gender || '1';


  /*
  {
    "vact":{
            "tmnId":"sorhkrj",
            "mchtId":"sorhkrj",
            "trackId":"",
            "bankCd":"004",
            "account":"111122223333",
            "payerName":"홍길동",
            "payerTel":"01012345678",
            "dob":"880101",
            "gender":"1",
            "recvBankCd":"",
      "itndAmount":"20000",
            "holderName":""
            }
}
  */

  /*

  const response2 = await fetch('https://na.winglobalpay.com/api/v1/vactFcs', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Authorization': process.env.WINGLOBALPAY_API_KEY || '',
    },
    body: JSON.stringify({
      "vact": {
        tmnId: '',
        mchtId: 'w63791online',
        trackId: '',
        bankCd: bankCd,
        account: bankAccount,
        payerName: payerName,
        payerTel: payerTel,
        dob: dob,
        gender: gender,
        recvBankCd: recvBankCd,
        itndAmount: '20000',
        holderName: '',

      },
    })
  });

  const response2Json = await response2.json();
  */

  const response2Json = {
    result: {
      resultCd: '0000',
      advanceMsg: '정상처리',
    },
    vact: {
      account: '111122223333',
    },
  };
  

  console.log("response2Json: ", response2Json);


  // 성공
  if (response2Json.result.resultCd === '0000') {

    //console.log("account: ", response2Json.vact.account);


    const virtualAccount = response2Json.vact.account;


    const updatedBuyer = {
        ...buyer,
        bankInfo: {
            ...buyer.bankInfo,
            virtualAccount: virtualAccount,
        }
    };


    const result = await updateBuyer({
      storecode: storecode,
      walletAddress: walletAddress,
      buyer: updatedBuyer,
    });

    //console.log("result: ", result);


    if (!result) {
      return NextResponse.json({
        result: null,
        error: "Failed to update buyer",
      });
    }

    return NextResponse.json({
      result,
      error: "",
    });

  }


  return NextResponse.json({
    result: null,
    error: response2Json.result.advanceMsg,
  });



  
}
