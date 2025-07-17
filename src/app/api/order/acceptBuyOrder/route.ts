import { NextResponse, type NextRequest } from "next/server";

import {
	acceptBuyOrder,
} from '@lib/api/order';

// Download the helper library from https://www.twilio.com/docs/node/install
import twilio from "twilio";
import { idCounter } from "thirdweb/extensions/farcaster/idRegistry";


export async function POST(request: NextRequest) {

  const body = await request.json();

  const {
    lang,
    storecode,
    
    orderId,

    sellerWalletAddress,
    sellerStorecode,
    sellerMemo,
    //sellerNickname, sellerAvatar, sellerMobile, seller

    tradeId,
    buyerWalletAddress,
  } = body;

  ///console.log("acceptBuyOrder body", body);


  /*
  {
    lang: 'ko',
    storecode: 'suroggyc',
    orderId: new ObjectId('6827479e460e1b9e73417ebc'),
    sellerWalletAddress: '0x98773aF65AE660Be4751ddd09C4350906e9D88F3',
    sellerStorecode: 'admin'
  }
  */

  

  const result = await acceptBuyOrder({
    lang: lang,
    storecode: storecode,
    orderId: orderId,
    sellerWalletAddress: sellerWalletAddress,
    sellerStorecode: sellerStorecode || "admin",
    sellerMemo: sellerMemo,

    /*
    sellerNickname: sellerNickname,
    sellerAvatar: sellerAvatar,
    sellerMobile: sellerMobile,
    seller: seller,
    */

  });

  //console.log("result", result);

  if (result) {






    const APPLICATION_ID = 'CCD67D05-55A6-4CA2-A6B1-187A5B62EC9D';

    const apiToken = process.env.SENDBIRD_API_TOKEN;

    if (apiToken) {
 
      /*
      const url = `https://api-${APPLICATION_ID}.sendbird.com/v3/open_channels`;

      try {
        const result = await fetch(url, {
          method: 'POST',

          headers: {
            'Content-Type': 'application/json',
            'Api-Token': apiToken,
          },

          body: JSON.stringify({
            name: tradeId,
            channel_url: orderId,
            cover_url: 'https://stable.makeup/icon-trade.png',
            custom_type: 'trade',

          }),
        });

        const data = await result.json();

      } catch (error) {
        console.error('Error creating Sendbird channel:', error);
      }
      */


      // group_channels
      const url = `https://api-${APPLICATION_ID}.sendbird.com/v3/group_channels`;

      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Api-Token': apiToken,
          },
          body: JSON.stringify({
            name: "거래번호: #" + tradeId,
            channel_url: orderId,
            cover_url: 'https://stable.makeup/icon-trade.png',
            custom_type: 'trade',
            user_ids: [buyerWalletAddress, sellerWalletAddress],
            data: JSON.stringify({
              tradeId: tradeId,
              buyerWalletAddress: buyerWalletAddress,
              sellerWalletAddress: sellerWalletAddress,
              sellerStorecode: sellerStorecode,
            }),
            
          }),
        });

        const data = await response.json();
        //console.log('Sendbird group channel created:', data);



        /*
        {
          channel_url: '685ca1512a3f834ed95e93d4',
          name: '거래번호: #96903357',
          cover_url: 'https://stable.makeup/icon-trade.png',
          data: '{"tradeId":"96903357","buyerWalletAddress":"0x2C264C8772758A186802f2595E5869b2c991c431","sellerWalletAddress":"0x98773aF65AE660Be4751ddd09C4350906e9D88F3","sellerStorecode":"admin"}',
          member_count: 2,
          joined_member_count: 2,
          max_length_message: 5000,
          created_at: 1750901301,
          custom_type: 'trade',
          is_distinct: false,
          is_super: false,
          is_broadcast: false,
          is_public: false,
          is_discoverable: false,
          freeze: false,
          is_ephemeral: false,
          unread_message_count: 0,
          unread_mention_count: 0,
          ignore_profanity_filter: false,
          has_ai_bot: false,
          has_bot: false,
          is_desk_channel: false,
          is_ai_agent_channel: false,
          id: 161700839,
          channel: {
            channel_url: '685ca1512a3f834ed95e93d4',
            name: '거래번호: #96903357',
            cover_url: 'https://stable.makeup/icon-trade.png',
            data: '{"tradeId":"96903357","buyerWalletAddress":"0x2C264C8772758A186802f2595E5869b2c991c431","sellerWalletAddress":"0x98773aF65AE660Be4751ddd09C4350906e9D88F3","sellerStorecode":"admin"}',
            created_at: 1750901301,
            custom_type: 'trade',
            max_length_message: 5000,
            member_count: 2
          },
          created_by: null,
          disappearing_message: { is_triggered_by_message_read: false, message_survival_seconds: -1 },
          is_access_code_required: false,
          is_created: true,
          message_survival_seconds: -1,
          sms_fallback: { wait_seconds: -1, exclude_user_ids: [] },
          last_message: null,
          members: [
            {
              user_id: '0x98773aF65AE660Be4751ddd09C4350906e9D88F3',
              nickname: 'georgia',
              profile_url: '/profile-default.png',
              require_auth_for_profile_image: false,
              metadata: {},
              is_online: false,
              last_seen_at: -1,
              state: 'joined',
              is_active: true,
              role: '',
              is_muted: false,
              muted_end_at: -1,
              muted_description: ''
            },
            {
              user_id: '0x2C264C8772758A186802f2595E5869b2c991c431',
              nickname: 'hanguu',
              profile_url: '/profile-default.png',
              require_auth_for_profile_image: false,
              metadata: {},
              is_online: true,
              last_seen_at: 0,
              state: 'joined',
              is_active: true,
              role: '',
              is_muted: false,
              muted_end_at: -1,
              muted_description: ''
            }
          ],
          operators: []
        }
        */






      } catch (error) {
        console.error('Error creating Sendbird group channel:', error);
      }



    }




  }


  /*
  const {
    mobile: mobile,
    buyer: buyer,
    tradeId: tradeId,
  } = result as UserProps;
  */

  // if mobile number is not prefix with country code don't send sms
  /*
  if (!mobile || !mobile.startsWith('+')) {
    return NextResponse.json({
      result,
    });
  }
    */


    // send sms
    /*
    const to = mobile;


    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const client = twilio(accountSid, authToken);



    let message = null;

   

    try {

      let msgBody = '';

      if (lang === 'en') {
        msgBody = `[GTETHER] TID[${tradeId}] Your buy order has been accepted by ${seller?.nickname}! You must escrow USDT to proceed with the trade in 10 minutes!`;
      } else if (lang === 'kr') {
        msgBody = `[GTETHER] TID[${tradeId}] ${seller?.nickname}님이 구매 주문을 수락했습니다! 거래를 계속하기 위해 USDT를 에스크로해야 합니다!`;
      } else {
        msgBody = `[GTETHER] TID[${tradeId}] Your buy order has been accepted by ${seller?.nickname}! You must escrow USDT to proceed with the trade in 10 minutes!`;
      }



      message = await client.messages.create({
        body: msgBody,
        from: "+17622254217",
        to: to,
      });

      console.log(message.sid);



    } catch (e) {
      console.error('error', e);
    }

    */





 
  return NextResponse.json({

    result,
    
  });
  
}
