import { NextResponse, type NextRequest } from "next/server";

import { insertOne } from '@lib/api/otp';

// Download the helper library from https://www.twilio.com/docs/node/install
import twilio from "twilio";

export async function POST(request: NextRequest) {
  const body = await request.json();

  const { lang, walletAddress, mobile } = body;
  const targetWalletAddress = String(walletAddress || '').trim();
  const targetMobile = String(mobile || '').trim();

  if (!targetWalletAddress || !targetMobile) {
    return NextResponse.json(
      {
        result: null,
        status: 'error',
        message: 'walletAddress and mobile are required',
      },
      { status: 400 },
    );
  }

  const result = await insertOne({
    walletAddress: targetWalletAddress,
  });

  if (!result.ok) {
    if (result.reason === 'cooldown') {
      return NextResponse.json(
        {
          result: null,
          status: 'error',
          message: 'OTP resend cooldown',
          retryAfterSec: result.retryAfterSec,
        },
        { status: 429 },
      );
    }

    return NextResponse.json(
      {
        result: null,
        status: 'error',
        message: 'Invalid walletAddress',
      },
      { status: 400 },
    );
  }

  const otpCode = result.otp;
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (!accountSid || !authToken) {
    return NextResponse.json(
      {
        result: null,
        status: 'error',
        message: 'OTP provider is not configured',
      },
      { status: 500 },
    );
  }

  const client = twilio(accountSid, authToken);

  try {
    let smsBody = '';
    if (lang === 'en') {
      smsBody = `[GTETHER] Your OTP code is ${otpCode}`;
    } else if (lang === 'kr') {
      smsBody = `[GTETHER] 당신의 OTP 코드는 ${otpCode} 입니다`;
    } else {
      smsBody = `[GTETHER] Your OTP code is ${otpCode}`;
    }

    await client.messages.create({
      body: smsBody,
      from: "+17622254217",
      to: targetMobile,
    });
  } catch (e) {
    console.error('Error sending OTP SMS', e);
    return NextResponse.json(
      {
        result: null,
        status: 'error',
        message: 'Failed to send OTP',
      },
      { status: 500 },
    );
  }

  return NextResponse.json({
    result: {
      ok: true,
      cooldownSec: result.cooldownSec,
      expiresAt: result.expiresAt,
    },
    status: 'success',
  });
}
