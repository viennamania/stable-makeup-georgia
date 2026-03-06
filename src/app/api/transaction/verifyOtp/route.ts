import { NextResponse, type NextRequest } from "next/server";

import { findOne } from '@lib/api/otp';

export async function POST(request: NextRequest) {
  const body = await request.json();

  const { walletAddress, otp } = body;
  const targetWalletAddress = String(walletAddress || '').trim();
  const targetOtp = String(otp || '').trim();

  if (!targetWalletAddress || !targetOtp) {
    return NextResponse.json(
      {
        status: 'error',
        message: 'walletAddress and otp are required',
      },
      { status: 400 },
    );
  }

  const result = await findOne({
    walletAddress: targetWalletAddress,
    otp: targetOtp,
  });

  if (result.status === 'success') {
    return NextResponse.json({
      status: 'success',
      message: 'OTP verified successfully',
    });
  }

  if (result.status === 'locked') {
    return NextResponse.json(
      {
        status: 'error',
        message: `Too many failed attempts. Try again in ${result.retryAfterSec}s`,
        retryAfterSec: result.retryAfterSec,
      },
      { status: 429 },
    );
  }

  if (result.status === 'expired') {
    return NextResponse.json(
      {
        status: 'error',
        message: 'OTP expired. Please request a new OTP.',
      },
      { status: 410 },
    );
  }

  return NextResponse.json(
    {
      status: 'error',
      message: 'Invalid OTP',
    },
    { status: 401 },
  );
}
