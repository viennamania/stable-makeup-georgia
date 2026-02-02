import { NextResponse, type NextRequest } from "next/server";


// getAllUsersByStorecode
import {
  getAllUsersByStorecode,
  upsertBankUserAndBalance,
} from "@lib/api/user";



import {
  insertOne,
} from '@lib/api/bankTransfer';


// checkBuyOrderMatchDeposit
import {
  checkBuyOrderMatchDeposit,
} from '@lib/api/order';



// getStoreByBankAccountNumber
import {
  getStoreByBankAccountNumber,
} from '@lib/api/store';



import {
  isBankTransferMultipleTimes,
} from '@lib/api/bankTransfer';

// touchBankInfoByRealAccountNumber
import {
  touchBankInfoByRealAccountNumber,
} from '@lib/api/bankInfo';


// insertWebhookLog
import {
  insertWebhookLog,
} from '@lib/api/webhookLog';
import { error } from "console";

// webhook
// header
/*

Content-Type
application/json
x-webhook-key
your-webhook-key
(대시보드 > API설정 > 웹훅키에서 확인 가능)
x-mall-id
your-mall-id
(대시보드 > API설정 > 상점ID에서 확인 가능)
x-trace-id
트랜잭션 고유 ID
*/
// body
/*
{
    "transaction_type": "deposited",
    "bank_account_id": "1689197615581x256615117901486500",
    "bank_account_number": "12345678901234",
    "bank_code": "003",
    "amount": 100000,
    "transaction_date": "2024-04-15T15:03:00+09:00",
    "transaction_name": "홍길동",
    "balance": 111222333,
    "processing_date": "2024-04-15T15:03:01+09:00"
}
*/

// response body

/*
유형
상태코드
결과값
Response Body
200
{ "status": "success" }
 */


export async function POST(request: NextRequest) {


  // parse header
  const webhookKey = request.headers.get("x-webhook-key");
  const mallId = request.headers.get("x-mall-id");
  const traceId = request.headers.get("x-trace-id");

  console.log("payaction webhookKey", webhookKey);
  console.log("payaction mallId", mallId);
  console.log("payaction traceId", traceId); // payaction traceId 1747808169270x797731416156850300



  const body = await request.json();

  console.log("payaction body", body);

  /*
  {
    transaction_type: 'deposited',
    bank_account_number: '1013016171814',
    amount: 50000,
    transaction_date: '2026-01-10T15:50:40.598+09:00',
    transaction_name: '윤석산',
    balance: 1820004
  }
  */

  




  /*
{
    "transaction_type": "deposited",
    "bank_account_id": "1689197615581x256615117901486500",
    "bank_account_number": "12345678901234",
    "bank_code": "003",
    "amount": 100000,
    "transaction_date": "2024-04-15T15:03:00+09:00",
    "transaction_name": "홍길동",
    "balance": 111222333,
    "processing_date": "2024-04-15T15:03:01+09:00"
}
  */
 /*
 {
    "transaction_type": "withdrawn",
    "bank_account_id": "1689197615581x256615117901486500",
    "bank_account_number": "12345678901234",
    "bank_code": "003",
    "amount": 100000,
    "transaction_date": "2024-04-15T15:03:00+09:00",
    "transaction_name": "홍길동",
    "balance": 111222333,
    "processing_date": "2024-04-15T15:03:01+09:00"
}
  */


  if (!body) {
    return NextResponse.json({
      status: "error",
      message: "body is empty",
    });
  }



  const {
    transaction_type,
    bank_account_id,
    bank_account_number,
    bank_code,
    amount,
    transaction_date,
    transaction_name,
    balance,
    processing_date,
  } = body;

 

  
  console.log("transaction_type", transaction_type);
  console.log("bank_account_id", bank_account_id); // 1746688005960x805860620824215600
  console.log("bank_account_number", bank_account_number);
  console.log("bank_code", bank_code);
  console.log("amount", amount);
  console.log("transaction_date", transaction_date);
  console.log("transaction_name", transaction_name);
  console.log("balance", balance);
  console.log("processing_date", processing_date);





  /*
    event: string;
  headers?: Headers | Record<string, any>;
  body: any;
  error?: any;
  createdAt?: string | Date;
  */

  const data = {
    event: "banktransfer_webhook",
    headers: {
      "x-webhook-key": webhookKey,
      "x-mall-id": mallId,
      "x-trace-id": traceId,
    },
    body: body,
    error: null,
    createdAt: new Date(),
  };

  await insertWebhookLog(data);







  // touchBankInfoByRealAccountNumber
  const bankInfo = await touchBankInfoByRealAccountNumber(
    bank_account_number,
    balance
  );




  {/*
  {
    transaction_type: 'deposited',
    bank_account_id: ' ',
    bank_account_number: '22105556021573',
    bank_code: '011',
    amount: 1000000,
    transaction_date: '2025-09-13T02:38:50.000+09:00',
    transaction_name: '엄영식',
    balance: 3532913,
    processing_date: '2025-09-13T02:38:52.653+09:00'
  }
  */}

  {/*
     더블디 (mslxvbmm)
    은행이름: 국민은행
    계좌번호: 66200201761933
    예금주: 전성미
  */}
  {/*
    스텔스 (alwmkqst)

  은행이름: 농협
  계좌번호: 22105556021573
  예금주: 김명실
  */}

  {/*
     BLUFF (gbndgyfl)
    은행이름: 농협
    계좌번호: 3521522179003
    예금주: 함태곤
  */}

  {/*
    MOON (arygljqt)

  은행이름: 농협
  계좌번호: 3022084120331
  예금주: 조건희
  */}

  {/*
    마돈나 (wvdjgmbq)
    은행이름: 농협
    계좌번호: 3520836679913
    예금주: 민수영
  */}


  {/*
    라이징 (crluonsn)
    은행이름: 농협
    계좌번호: 3521497643823
    예금주: 김지섭
  */}


  
  let storecode = '';
  let center = '';
  
  /*
  if (bank_account_number === '66200201761933') {
    storecode = 'mslxvbmm'; // 더블디 (mslxvbmm)
    center = 'place69_bot';
  } else if (bank_account_number === '22105556021573') {
    storecode = 'alwmkqst'; // 스텔스 (alwmkqst)
    center = 'place69_bot';
  } else if (bank_account_number === '3521522179003') {
    storecode = 'gbndgyfl'; // BLUFF (gbndgyfl)
    center = 'place69_bot';
  } else if (bank_account_number === '3022084120331') {
    storecode = 'arygljqt'; // MOON (arygljqt)
    center = 'place69_bot';
  } else if (bank_account_number === '3520836679913') {
    storecode = 'wvdjgmbq'; // 마돈나 (wvdjgmbq)
    center = 'place69_bot';
  } else if (bank_account_number === '3521497643823') {
    storecode = 'crluonsn'; // 라이징 (crluonsn)
    center = 'place69_bot';
  }




  if (storecode === '') {
    console.log("No matching storecode for bank_account_number:", bank_account_number);
    return NextResponse.json({
      status: "error",
      message: "No matching storecode for bank_account_number",
    });
  }

  if (center === '') {
    console.log("No matching center for bank_account_number:", bank_account_number);
    return NextResponse.json({
      status: "error",
      message: "No matching center for bank_account_number",
    });
  }

  console.log("storecode", storecode);
  console.log("center", center);
  */



  // center = 'place69_bot'
  // userid = 'mcmcmo'
  // storecode = storecode

  //const storecode = "gjdzwxes"; // 예시로 storecode를 지정합니다. 실제로는 mallId나 다른 방법으로 가져와야 합니다.






  /*
  bank_code


  국민은행: 004,
  우리은행: 020,
  신한은행: 088,
  농협: 011,
  기업은행: 003,
  하나은행: 081,
  외환은행: 002,
  부산은행: 032,
  대구은행: 031,
  전북은행: 037,
  경북은행: 071,
  부산은행: 032,
  광주은행: 034,
  우체국: 071,
  수협: 007,
  씨티은행: 027

  */
  /*
  const bankName = bank_code === '004' ? '국민은행' :
    bank_code === '020' ? '우리은행' :
    bank_code === '088' ? '신한은행' :
    bank_code === '011' ? '농협' :
    bank_code === '003' ? '기업은행' :
    bank_code === '081' ? '하나은행' :
    bank_code === '002' ? '외환은행' :
    bank_code === '090' ? 'SC제일은행' :
    bank_code === '032' ? '부산은행' :
    bank_code === '031' ? '대구은행' :
    bank_code === '037' ? '전북은행' :
    bank_code === '071' ? '경북은행' :
    bank_code === '039' ? '경남은행' :
    bank_code === '034' ? '광주은행' :
    bank_code === '071' ? '우체국' :
    bank_code === '007' ? '수협' :
    bank_code === '027' ? '씨티은행' :
    bank_code === '055' ? '대신은행' :
    bank_code === '054' ? '동양종합금융' :
    bank_code === '062' ? '롯데카드' :
    bank_code === '029' ? '삼성카드' :
    bank_code === '048' ? '현대카드' :
    bank_code === '016' ? '신한카드' :
    bank_code === '020' ? '국민카드' :
    bank_code === '081' ? '하나카드' :
    bank_code === '002' ? '외환카드' :
    bank_code === '027' ? '씨티카드' :
    bank_code === '048' ? '현대카드' :
    bank_code === '062' ? '롯데카드' :
    bank_code === '029' ? '삼성카드' :
    bank_code === '016' ? '신한카드' :
    bank_code === '020' ? '국민카드' :
    bank_code === '081' ? '하나카드' :
    bank_code === '002' ? '외환카드' :
    bank_code === '027' ? '씨티카드' :
    bank_code === '048' ? '현대카드' :
    bank_code === '062' ? '롯데카드' :
    bank_code === '029' ? '삼성카드' :
    bank_code === '016' ? '신한카드' :
    bank_code === '020' ? '국민카드' :
    bank_code === '081' ? '하나카드' :
    bank_code === '002' ? '외환카드' :
    bank_code === '089' ? '케이뱅크' :
    '알 수 없는 은행';
  */



  // message 내용 구성
  /*
  ⭐️ 출금 [NH농협] ⭐️

  금액 : 1,000원
  이름 : MBC지금은라
  시간 : 2024-11-07 00:14:30
  계좌 : NH농협 3120117190551
  */

  /*
  🌕 입금 [NH농협] 🌕

  금액 : 3,000,000원
  이름 : (주)제이엔케
  시간 : 2024-11-07 00:14:58
  계좌 : NH농협 3120117190551
  */

  /*
  const message = `${transaction_type === 'deposited' ? (
    '🌕 입금'
  ) : (
    '⭐️ 출금'
  )} [${bankName}] ${transaction_type === 'deposited' ? '🌕' : '⭐️'}\n\n` +
    `금액: <b>${amount ? amount.toLocaleString() : 0}</b>원\n` +
    `이름: ${transaction_name}\n` +
    `시간: ${transaction_date.replace('T', ' ').replace('+09:00', '')}\n` +
    `계좌: ${bankName} ${bank_account_number}\n` +
    `잔액: ${balance ? balance.toLocaleString() : 0}원`;
  */

  /*
  const message = `${transaction_type === 'deposited' ? (
    '🌕 입금'
  ) : (
    '⭐️ 출금'
  )} \n\n` +
    `금액: <b>${amount ? amount.toLocaleString() : 0}</b>원\n` +
    `이름: ${transaction_name}\n` +
    `시간: ${transaction_date.replace('T', ' ').replace('+09:00', '')}\n` +
    `계좌번호: ${bank_account_number}\n` +
    `잔액: ${balance ? balance.toLocaleString() : 0}원`;
  */



  //const storecode = "ixryqqtw"; // upbet
  

  ///const storecode = "ycvqgqgg"; // 타이틀

 
  // 132067165012 => 13207716701
  // 1021029548189 => 02277987999
  // 3521660264663 => 3560243561679
  // 1013016171814 => 01013001085

  // 1002753153102 => 01040772911

  // 1002532555836 => 01039126579


  // 57491038528407 => 01048859573

  // 3560820389133 => 10897495680-99

  //////// 1089749568099 => 356-0820-3891-33


  // 1021026804140 => 맞춤계좌: 02103378912

  // 110496321987 => 07891237777

  // 41402149330 => 2427343744778

  // 3560820389133 => 1089749568099

  /*
  계좌번호 : 3520946632383
맞춤계좌 : 3528879532639
  */

    /*
    계좌번호 : 9002158502801
    맞춤계좌 : 8010715698760
    */

    /*
    계좌번호 : 3510166188053
    맞춤계좌 : 3510166639
    */
   /*
   본계좌 : 010844647440
    맞춤계좌 : 202053696796
    */

    /*
    ◾️이름 : 박진우
    ◾️은행 : 전북
    ▫️계좌번호 : 1021029721413
      맞춤계좌 : 02102573599
    */
    /*
    3020621418681 농협 임도운
    3520106623778
    */

    /*
    계좌번호 : 221-0092-5247-04
    맞춤계좌: 22200925777
    */

    /*
    본 : 1002753153102
    맞춤 : 01086364077
    */

    /*
    // 1021023221787
    이름 : 조강민
    은행 : 전북
    계좌번호 : 전북 1021-02-3221787
    맞춤계좌 : 04558997011
    */

    /*
    이름 : 김희왕
    은행 : 케이뱅크
    계좌번호 :  100224438470
    맞춤계좌 : 001030458524
    */


    /*
    이름 : 박인수
◾️   은행 : 농협
    ▫️계좌번호 : 3560411570193
    맞춤계좌 : 3560517653939
    */


    /*
  let bankAccountNumber = bank_account_number;


  if (bank_account_number == '132067165012') {
    bankAccountNumber = '13207716701';
  } else if (bank_account_number == '1021029548189') {
    bankAccountNumber = '02277987999';
  } else if (bank_account_number == '3521660264663') {
    bankAccountNumber = '3560243561679';

  // 2026-01-27 수정
  //} else if (bank_account_number == '1013016171814') {
  //  bankAccountNumber = '01013001085';



  } else if (bank_account_number == '1002532555836') {
    bankAccountNumber = '01039126579';
  } else if (bank_account_number == '57491038528407') {
    bankAccountNumber = '01048859573';


  } else if (bank_account_number == '1021026804140') {
    bankAccountNumber = '02103378912';
  } else if (bank_account_number == '110496321987') {
    bankAccountNumber = '07891237777';
  } else if (bank_account_number == '41402149330') {
    bankAccountNumber = '2427343744778';

  } else if (bank_account_number == '3520946632383') {
    bankAccountNumber = '3528879532639';
  } else if (bank_account_number == '9002158502801') {
    bankAccountNumber = '8010715698760';
  } else if (bank_account_number == '3510166188053') {
    bankAccountNumber = '3510166639';
  } else if (bank_account_number == '010844647440') {
    bankAccountNumber = '202053696796';
  } else if (bank_account_number == '1021029721413') {
    bankAccountNumber = '02102573599';
  } else if (bank_account_number == '3020621418681') {
    bankAccountNumber = '3520106623778';


  } else if (bank_account_number == '2210092524704') {
    bankAccountNumber = '22200925777';

  } else if (bank_account_number == '1021023221787') {
    bankAccountNumber = '04558997011';
  } else if (bank_account_number == '100224438470') {
    bankAccountNumber = '001030458524';
  } else if (bank_account_number == '3560411570193') {
    bankAccountNumber = '3560517653939';
  }
  */

  const bankAccountNumber = bankInfo?.defaultAccountNumber || bank_account_number;
  



  try {






    //upsertBankUser
    /*
        bankAccountNumber,
    bankName,
    accountHolder,
    balance,
    */

    //const bankName = '';
    //const accountHolder = '';

    await upsertBankUserAndBalance({
      bankAccountNumber: bankAccountNumber,
      //bankName: bankName,
      //accountHolder: accountHolder,
      latestDepositName: transaction_name,
      latestBalance: balance,
    });



    let errorMessage = null;

    // get store by bankAccountNumber
    const storeInfo = await getStoreByBankAccountNumber({
      bankAccountNumber: bankAccountNumber,
    });

    if (!storeInfo) {
      console.log("No store found for bankAccountNumber:", bankAccountNumber);
      
      errorMessage = "No store found for bankAccountNumber";

      return NextResponse.json({
        status: "error",
        message: "No store found for bankAccountNumber",
      });
    }





    let match = null;
    let tradeId = null;
    let buyerInfo = null;
    let sellerInfo = null;

    if (transaction_type === 'deposited') {

   

      // check bankTransfer multiple times
      // isBankTransferMultipleTimes
      /*
      const isMultiple = await isBankTransferMultipleTimes({
        transactionName: transaction_name,
        amount: amount,
        transactionDate: new Date(transaction_date),
      });

      console.log("isBankTransferMultipleTimes", isMultiple);

      if (isMultiple) {
        console.log("Bank transfer is multiple times, skip matching buyorder");
        return NextResponse.json({
          status: "success",
        });
      }
      */


      
      // check match from buyorders collection
      // when buyerDepositName and krwAmount match

      const matchResult = await checkBuyOrderMatchDeposit({
        buyerDepositName: transaction_name,
        krwAmount: amount,
      });

      console.log("checkBuyOrderMatchDeposit result", matchResult);

      if (matchResult) {
        match = 'success';
        tradeId = matchResult.tradeId;
        buyerInfo = matchResult.buyer;
        sellerInfo = matchResult.seller;

        console.log("Matched tradeId:", tradeId);
      }

    }
    
    
    


    // insert bank transfer record
    await insertOne({
      transactionType: transaction_type,
      bankAccountId: bank_account_id,
      originalBankAccountNumber: bank_account_number,
      bankAccountNumber: bankAccountNumber,
      bankCode: bank_code,
      amount: amount,
      transactionDate: transaction_date,
      transactionName: transaction_name,
      balance: balance,
      processingDate: processing_date,
      match: match,
      matchedByAdmin: false,
      tradeId: tradeId,
      storeInfo: storeInfo,
      buyerInfo: buyerInfo,
      sellerInfo: sellerInfo,
      errorMessage: errorMessage,
    });



  }  catch (error) {
    console.error("Error processing webhook:", error);
    return NextResponse.json({
      status: "error",
      message: "Error processing webhook",
    });
  }



  

  return NextResponse.json({
    status: "success",
  });
  
}
