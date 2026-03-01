"use client";

import type { Account } from "thirdweb/wallets";

const UPDATE_USER_SIGNING_PREFIX = "stable-georgia:update-user:v1";

type UpdateUserPayloadInput = {
  storecode?: string;
  walletAddress?: string;
  nickname?: string;
  mobile?: string;
  email?: string;
};

type PostUpdateUserWithSignatureParams = {
  account: Account | null | undefined;
  payload: UpdateUserPayloadInput;
  fallbackStorecode?: string;
};

const normalize = (value: unknown): string => {
  if (typeof value !== "string") {
    return "";
  }
  return value.trim();
};

const buildUpdateUserSigningMessage = ({
  storecode,
  walletAddress,
  nickname,
  mobile,
  email,
  signedAt,
}: {
  storecode: string;
  walletAddress: string;
  nickname: string;
  mobile: string;
  email: string;
  signedAt: string;
}): string => {
  return [
    UPDATE_USER_SIGNING_PREFIX,
    `storecode:${storecode}`,
    `walletAddress:${walletAddress}`,
    `nickname:${nickname}`,
    `mobile:${mobile}`,
    `email:${email}`,
    `signedAt:${signedAt}`,
  ].join("\n");
};

export async function postUpdateUserWithSignature({
  account,
  payload,
  fallbackStorecode,
}: PostUpdateUserWithSignatureParams): Promise<any> {
  const storecode = normalize(payload.storecode) || normalize(fallbackStorecode);
  const walletAddress = normalize(payload.walletAddress).toLowerCase();
  const nickname = normalize(payload.nickname);
  const mobile = normalize(payload.mobile);
  const email = normalize(payload.email);

  if (!account) {
    return { result: null, error: "Wallet account not connected" };
  }

  if (!storecode || !walletAddress || !nickname) {
    return { result: null, error: "Missing required fields" };
  }

  const signedAt = new Date().toISOString();
  const signingMessage = buildUpdateUserSigningMessage({
    storecode,
    walletAddress,
    nickname,
    mobile,
    email,
    signedAt,
  });

  try {
    const signature = await account.signMessage({
      message: signingMessage,
    });

    const response = await fetch("/api/user/updateUser", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        storecode,
        walletAddress,
        nickname,
        mobile,
        email,
        signature,
        signedAt,
      }),
    });

    const data = await response.json();
    if (!response.ok && !data?.error) {
      return {
        ...data,
        result: data?.result ?? null,
        error: `Request failed (${response.status})`,
      };
    }

    return data;
  } catch (error) {
    return {
      result: null,
      error: error instanceof Error ? error.message : "Failed to sign update request",
    };
  }
}
