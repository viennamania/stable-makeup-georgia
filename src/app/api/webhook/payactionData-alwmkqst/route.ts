import { NextResponse, type NextRequest } from "next/server";


// getAllUsersByStorecode
import {
  getAllUsersByStorecode,
} from "@lib/api/user";



import {
  UserProps,
	acceptBuyOrder,
  updateBuyOrderByQueueId,


  //getOneBuyOrder,
  getOneBuyOrderByTradeId,

  buyOrderConfirmPayment,

} from '@lib/api/order';






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

 

  /*
  console.log("payaction transaction_type", transaction_type);
  console.log("payaction bank_account_id", bank_account_id); // 1746688005960x805860620824215600
  console.log("payaction bank_account_number", bank_account_number);
  console.log("payaction bank_code", bank_code);
  console.log("payaction amount", amount);
  console.log("payaction transaction_date", transaction_date);
  console.log("payaction transaction_name", transaction_name);
  console.log("payaction balance", balance);
  console.log("payaction processing_date", processing_date);
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
  씨티은행: 027,
  대신은행: 055,
  동양종합금융: 054,
  롯데카드: 062,
  삼성카드: 029,
  현대카드: 048,
  신한카드: 016,
  국민카드: 020,
  하나카드: 081,
  외환카드: 002,
  씨티카드: 027,
  현대카드: 048,
  롯데카드: 062,
  삼성카드: 029,
  신한카드: 016,
  국민카드: 020,
  하나카드: 081,
  외환카드: 002,
  씨티카드: 027,
  현대카드: 048,
  롯데카드: 062,
  삼성카드: 029,
  신한카드: 016,
  국민카드: 020,
  하나카드: 081,
  외환카드: 002,
  씨티카드: 027,
  현대카드: 048,
  롯데카드: 062,
  삼성카드: 029,
  신한카드: 016,
  국민카드: 020,
  하나카드: 081, 외환카드: 002,

  */
  const bankName = bank_code === '004' ? '국민은행' :
    bank_code === '020' ? '우리은행' :
    bank_code === '088' ? '신한은행' :
    bank_code === '011' ? '농협' :
    bank_code === '003' ? '기업은행' :
    bank_code === '081' ? '하나은행' :
    bank_code === '002' ? '외환은행' :
    bank_code === '032' ? '부산은행' :
    bank_code === '031' ? '대구은행' :
    bank_code === '037' ? '전북은행' :
    bank_code === '071' ? '경북은행' :
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


  const message = `${transaction_type === 'deposited' ? (
    '🌕 입금'
  ) : (
    '⭐️ 출금'
  )} [${bankName}] ${transaction_type === 'deposited' ? '🌕' : '⭐️'}\n\n` +
    `금액: <b>${amount.toLocaleString()}</b>원\n` +
    `이름: ${transaction_name}\n` +
    `시간: ${transaction_date.replace('T', ' ').replace('+09:00', '')}\n` +
    `계좌: ${bankName} ${bank_account_number}\n` +
    `잔액: ${balance.toLocaleString()}원`;





  //const storecode = "ixryqqtw"; // upbet

  //const storecode = "dtwuzgst"; // 매니 가맹점


  const storecode = "alwmkqst"; // oneclick 스텔스 가맹점 




  try {


    // get all users by storecode
    const response = await getAllUsersByStorecode({
      storecode: storecode,
      limit: 1000,
      page: 1,
    });

    const users = response?.users || [];

    console.log("getAllUsersByStorecode response", response);
    console.log("getAllUsersByStorecode users", users);


    if (users && users.length > 0) {


      //for (const user of users) {


      for (let i = 0; i < users.length; i++) {
        const user = users[i];


        //const userid = user.nickname;

        //const userid = user.id;
        // toString()으로 변환하여 사용
        const userid = user.id.toString();




        


        const response = await fetch("https://dubai-telegram.vercel.app/api/telegram/sendMessageByUseridAndStorecodeLycheeBot", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            center: "oneclick_lychee_bot",
            userid: userid,
            storecode: storecode,
    
            /*
            "deposited" (입금) 또는 "withdrawn" (출금)
            입금자명
            */
            message: message,

          }),
        });

        if (!response.ok) {
          console.error("Failed to send Telegram message for user:", userid, "with status:", response.status);
          continue; // Skip to the next user if sending fails
        }
        const data = await response.json();
        console.log("Telegram message sent for user:", userid, "with response:", data);

      }


    } else {
      console.log("No users found for storecode:", storecode);
    }

  } catch (error) {
    console.error("Error sending Telegram message:", error);
  }




  

  return NextResponse.json({
    status: "success",
  });
  
}
