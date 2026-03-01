import { NextResponse, type NextRequest } from "next/server";
import { ethers } from "ethers";
import { verifySignature } from "thirdweb/auth";
import { arbitrum, bsc, ethereum, polygon } from "thirdweb/chains";

import {
  updateOne,
} from "@lib/api/user";
import { client } from "@/app/client";
import { chain as configuredChain } from "@/app/config/contractAddresses";

const UPDATE_USER_SIGNING_PREFIX = "stable-georgia:update-user:v1";
const UPDATE_USER_SIGNATURE_TTL_MS = 5 * 60 * 1000; // 5 minutes

type UpdateUserRequestBody = {
  storecode?: unknown;
  walletAddress?: unknown;
  nickname?: unknown;
  mobile?: unknown;
  email?: unknown;
  signature?: unknown;
  signedAt?: unknown;
};

const normalizeString = (value: unknown): string => {
  if (typeof value !== "string") {
    return "";
  }
  return value.trim();
};

const normalizeWalletAddress = (value: unknown): string | null => {
  if (typeof value !== "string") {
    return null;
  }

  try {
    return ethers.utils.getAddress(value.trim()).toLowerCase();
  } catch {
    return null;
  }
};

const resolveSignatureChains = (storecode: string) => {
  const chainMap: Record<string, any> = {
    arbitrum,
    polygon,
    ethereum,
    bsc,
  };

  const candidates = [
    String(storecode || "").trim().toLowerCase(),
    String(configuredChain || "").trim().toLowerCase(),
    "arbitrum",
    "polygon",
    "ethereum",
    "bsc",
  ];

  const chains: any[] = [];
  for (const name of candidates) {
    const candidate = chainMap[name];
    if (!candidate) {
      continue;
    }
    if (!chains.some((item) => item.id === candidate.id)) {
      chains.push(candidate);
    }
  }

  return chains;
};

const buildUpdateUserSigningMessage = ({
  storecode,
  walletAddress,
  nickname,
  mobile,
  email,
  signedAtIso,
}: {
  storecode: string;
  walletAddress: string;
  nickname: string;
  mobile: string;
  email: string;
  signedAtIso: string;
}): string => {
  return [
    UPDATE_USER_SIGNING_PREFIX,
    `storecode:${storecode}`,
    `walletAddress:${walletAddress}`,
    `nickname:${nickname}`,
    `mobile:${mobile}`,
    `email:${email}`,
    `signedAt:${signedAtIso}`,
  ].join("\n");
};

export async function POST(request: NextRequest) {
  const body = (await request.json()) as UpdateUserRequestBody;

  const storecode = normalizeString(body.storecode);
  const walletAddress = normalizeWalletAddress(body.walletAddress);
  const nickname = normalizeString(body.nickname);
  const mobile = normalizeString(body.mobile);
  const email = normalizeString(body.email);
  const signature = normalizeString(body.signature);
  const signedAtRaw = normalizeString(body.signedAt);

  if (!storecode || !walletAddress || !nickname) {
    return NextResponse.json(
      { result: null, error: "Missing required fields" },
      { status: 400 }
    );
  }

  const signedAtMs = Date.parse(signedAtRaw);
  if (!signature || !signedAtRaw || Number.isNaN(signedAtMs)) {
    return NextResponse.json(
      { result: null, error: "signature and signedAt are required" },
      { status: 401 }
    );
  }

  const now = Date.now();
  if (Math.abs(now - signedAtMs) > UPDATE_USER_SIGNATURE_TTL_MS) {
    return NextResponse.json(
      { result: null, error: "Signature expired" },
      { status: 401 }
    );
  }

  const signedAtIso = new Date(signedAtMs).toISOString();
  const signingMessage = buildUpdateUserSigningMessage({
    storecode,
    walletAddress,
    nickname,
    mobile,
    email,
    signedAtIso,
  });

  let isValidSignature = false;
  try {
    const recoveredAddress = ethers.utils.verifyMessage(signingMessage, signature).toLowerCase();
    isValidSignature = recoveredAddress === walletAddress;
  } catch {
    isValidSignature = false;
  }

  // Fallback for smart-account signatures (EIP-1271 / ERC-6492)
  if (!isValidSignature) {
    try {
      const verificationChains = resolveSignatureChains(storecode);

      for (const verificationChain of verificationChains) {
        isValidSignature = await verifySignature({
          message: signingMessage,
          signature,
          address: walletAddress,
          client,
          chain: verificationChain,
        });

        if (isValidSignature) {
          break;
        }
      }
    } catch {
      isValidSignature = false;
    }
  }

  if (!isValidSignature) {
    return NextResponse.json(
      { result: null, error: "Invalid signature" },
      { status: 401 }
    );
  }

  console.log("walletAddress", walletAddress);
  console.log("nickname", nickname);
  console.log("mobile", mobile);
  console.log("email", email);

  const result = await updateOne({
    storecode,
    walletAddress,
    nickname,
    mobile,
    email,
  });

  return NextResponse.json({
    result,
  });
}
