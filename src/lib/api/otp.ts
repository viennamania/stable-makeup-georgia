import clientPromise from '../mongodb';

import { dbName } from '../mongodb';

const OTP_COLLECTION = 'opts';
const OTP_TTL_SEC = 300;
const OTP_RESEND_COOLDOWN_SEC = 180;
const OTP_MAX_VERIFY_ATTEMPTS = 5;
const OTP_VERIFY_LOCK_SEC = 600;

export interface UserProps {
  walletAddress: string;
  otp: string;
  createdAt: string;
  expiresAt?: string;
  failedAttempts?: number;
  lastSentAt?: string;
  lockedUntil?: string | null;
  verifiedAt?: string | null;
}

export type InsertOtpResult =
  | {
      ok: true;
      walletAddress: string;
      otp: string;
      createdAt: string;
      expiresAt: string;
      cooldownSec: number;
    }
  | {
      ok: false;
      reason: 'cooldown';
      retryAfterSec: number;
    }
  | {
      ok: false;
      reason: 'invalid_wallet';
    };

export async function insertOne(data: any): Promise<InsertOtpResult> {
  const walletAddress = String(data?.walletAddress || '').trim();
  if (!walletAddress) {
    return { ok: false, reason: 'invalid_wallet' };
  }

  const client = await clientPromise;
  const collection = client.db(dbName).collection<UserProps>(OTP_COLLECTION);

  const now = new Date();
  const nowMs = now.getTime();
  const createdAt = now.toISOString();
  const expiresAt = new Date(nowMs + OTP_TTL_SEC * 1000).toISOString();

  const checkUser = await collection.findOne<UserProps>({ walletAddress });
  if (checkUser?.lastSentAt) {
    const elapsedSec = Math.floor((nowMs - new Date(checkUser.lastSentAt).getTime()) / 1000);
    if (elapsedSec < OTP_RESEND_COOLDOWN_SEC) {
      return {
        ok: false,
        reason: 'cooldown',
        retryAfterSec: OTP_RESEND_COOLDOWN_SEC - Math.max(elapsedSec, 0),
      };
    }
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  if (checkUser) {
    await collection.updateOne(
      { walletAddress },
      {
        $set: {
          otp,
          createdAt,
          expiresAt,
          failedAttempts: 0,
          lastSentAt: createdAt,
          lockedUntil: null,
          verifiedAt: null,
        },
      },
    );
  } else {
    await collection.insertOne({
      walletAddress,
      otp,
      createdAt,
      expiresAt,
      failedAttempts: 0,
      lastSentAt: createdAt,
      lockedUntil: null,
      verifiedAt: null,
    });
  }

  return {
    ok: true,
    walletAddress,
    otp,
    createdAt,
    expiresAt,
    cooldownSec: OTP_RESEND_COOLDOWN_SEC,
  };
}

export type VerifyOtpResult =
  | { status: 'success' }
  | { status: 'invalid' }
  | { status: 'expired' }
  | { status: 'locked'; retryAfterSec: number };

export async function findOne(data: any): Promise<VerifyOtpResult> {
  const walletAddress = String(data?.walletAddress || '').trim();
  const otp = String(data?.otp || '').trim();
  if (!walletAddress || !otp) {
    return { status: 'invalid' };
  }

  const now = new Date();
  const nowMs = now.getTime();
  const nowIso = now.toISOString();

  const client = await clientPromise;
  const collection = client.db(dbName).collection<UserProps>(OTP_COLLECTION);
  const result = await collection.findOne<UserProps>({ walletAddress });

  if (!result) {
    return { status: 'invalid' };
  }

  if (result.lockedUntil) {
    const lockedUntilMs = new Date(result.lockedUntil).getTime();
    if (Number.isFinite(lockedUntilMs) && lockedUntilMs > nowMs) {
      return {
        status: 'locked',
        retryAfterSec: Math.ceil((lockedUntilMs - nowMs) / 1000),
      };
    }
  }

  if (!result.expiresAt || new Date(result.expiresAt).getTime() <= nowMs) {
    return { status: 'expired' };
  }

  if (result.otp !== otp) {
    const nextFailedAttempts = (result.failedAttempts || 0) + 1;
    if (nextFailedAttempts >= OTP_MAX_VERIFY_ATTEMPTS) {
      const lockedUntil = new Date(nowMs + OTP_VERIFY_LOCK_SEC * 1000).toISOString();
      await collection.updateOne(
        { walletAddress },
        {
          $set: {
            failedAttempts: nextFailedAttempts,
            lockedUntil,
          },
        },
      );
      return { status: 'locked', retryAfterSec: OTP_VERIFY_LOCK_SEC };
    }

    await collection.updateOne(
      { walletAddress },
      {
        $set: {
          failedAttempts: nextFailedAttempts,
        },
      },
    );
    return { status: 'invalid' };
  }

  await collection.updateOne(
    { walletAddress },
    {
      $set: {
        verifiedAt: nowIso,
        failedAttempts: 0,
        lockedUntil: null,
        expiresAt: nowIso,
        otp: '',
      },
    },
  );

  return { status: 'success' };
}
