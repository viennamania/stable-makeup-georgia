import { NextResponse, type NextRequest } from "next/server";

import { insertOne } from '@lib/api/otp';

// Download the helper library from https://www.twilio.com/docs/node/install
import twilio from "twilio";

type OtpChannel = 'email' | 'sms';

function maskEmail(value: string): string {
  const email = String(value || '').trim();
  const [localPartRaw, domainRaw] = email.split('@');
  const localPart = localPartRaw || '';
  const domain = domainRaw || '';
  if (!localPart || !domain) {
    return '';
  }
  const head = localPart.slice(0, 2);
  return `${head}${'*'.repeat(Math.max(localPart.length - 2, 2))}@${domain}`;
}

function maskPhone(value: string): string {
  const raw = String(value || '').trim();
  if (!raw) {
    return '';
  }
  const digits = raw.replace(/\D/g, '');
  if (digits.length < 4) {
    return raw;
  }
  return `${raw.slice(0, 4)}****${raw.slice(-2)}`;
}

async function sendOtpSms(params: {
  lang: string;
  otpCode: string;
  targetMobile: string;
}) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_FROM_NUMBER || "+17622254217";

  if (!accountSid || !authToken) {
    throw new Error('SMS provider is not configured');
  }

  const client = twilio(accountSid, authToken);

  let smsBody = '';
  if (params.lang === 'en') {
    smsBody = `[GTETHER] Your OTP code is ${params.otpCode}`;
  } else if (params.lang === 'kr') {
    smsBody = `[GTETHER] 당신의 OTP 코드는 ${params.otpCode} 입니다`;
  } else {
    smsBody = `[GTETHER] Your OTP code is ${params.otpCode}`;
  }

  await client.messages.create({
    body: smsBody,
    from: fromNumber,
    to: params.targetMobile,
  });
}

async function sendOtpEmail(params: {
  lang: string;
  otpCode: string;
  targetEmail: string;
}) {
  const apiKey = process.env.SENDGRID_API_KEY;
  const fromEmail = process.env.OTP_EMAIL_FROM || process.env.SENDGRID_FROM_EMAIL;
  if (!apiKey || !fromEmail) {
    throw new Error('Email provider is not configured');
  }

  const subject = params.lang === 'kr' ? '[GTETHER] OTP 인증코드' : '[GTETHER] OTP Verification Code';
  const text =
    params.lang === 'kr'
      ? `[GTETHER] 당신의 OTP 코드는 ${params.otpCode} 입니다`
      : `[GTETHER] Your OTP code is ${params.otpCode}`;

  const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      personalizations: [
        {
          to: [{ email: params.targetEmail }],
          subject,
        },
      ],
      from: {
        email: fromEmail,
        name: 'GTETHER',
      },
      content: [
        {
          type: 'text/plain',
          value: text,
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(`Email provider error: ${response.status} ${errorText}`);
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  const { lang, walletAddress, mobile, email } = body;
  const requestedChannel = String(body?.channel || '').trim().toLowerCase();

  const targetWalletAddress = String(walletAddress || '').trim();
  const targetMobile = String(mobile || '').trim();
  const targetEmail = String(email || '').trim();

  if (!targetWalletAddress) {
    return NextResponse.json(
      {
        result: null,
        status: 'error',
        message: 'walletAddress is required',
      },
      { status: 400 },
    );
  }

  let channel: OtpChannel | null = null;
  if (requestedChannel === 'email' && targetEmail) {
    channel = 'email';
  } else if (requestedChannel === 'sms' && targetMobile) {
    channel = 'sms';
  } else if (targetEmail) {
    channel = 'email';
  } else if (targetMobile) {
    channel = 'sms';
  }

  if (!channel) {
    return NextResponse.json(
      {
        result: null,
        status: 'error',
        message: 'email or mobile is required',
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

  try {
    if (channel === 'email') {
      await sendOtpEmail({
        lang,
        otpCode,
        targetEmail,
      });
    } else {
      await sendOtpSms({
        lang,
        otpCode,
        targetMobile,
      });
    }
  } catch (error) {
    console.error('Error sending OTP', error);
    return NextResponse.json(
      {
        result: null,
        status: 'error',
        message: channel === 'email' ? 'Failed to send OTP email' : 'Failed to send OTP SMS',
      },
      { status: 500 },
    );
  }

  return NextResponse.json({
    result: {
      ok: true,
      cooldownSec: result.cooldownSec,
      expiresAt: result.expiresAt,
      channel,
      targetMasked: channel === 'email' ? maskEmail(targetEmail) : maskPhone(targetMobile),
    },
    status: 'success',
  });
}
