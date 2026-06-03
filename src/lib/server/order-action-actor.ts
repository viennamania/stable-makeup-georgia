import type { NextRequest } from "next/server";

import {
  getOneAdminWalletUserByWalletAddress,
  getOneByWalletAddress,
} from "@lib/api/user";
import {
  getRequestIp,
  normalizeWalletAddress,
} from "@/lib/server/user-read-security";

const normalizeString = (value: unknown) => {
  if (typeof value !== "string") {
    return "";
  }
  return value.trim();
};

export type CenterStoreOrderActionActor = {
  walletAddress: string | null;
  nickname?: string | null;
  storecode?: string | null;
  role?: string | null;
  publicIp?: string | null;
  signedAt?: string | null;
  matchedBy?: "store_admin_wallet" | "global_admin" | "store_admin_password" | null;
};

export async function resolveCenterStoreOrderActionActor({
  request,
  requesterWalletAddress,
  requesterIsAdmin,
  matchedBy,
  storecode,
  signedAt,
}: {
  request: NextRequest;
  requesterWalletAddress: string;
  requesterIsAdmin: boolean;
  matchedBy: "store_admin_wallet" | "global_admin" | "store_admin_password";
  storecode: string;
  signedAt?: unknown;
}): Promise<CenterStoreOrderActionActor> {
  const normalizedWalletAddress = normalizeWalletAddress(requesterWalletAddress);
  const normalizedStorecode = normalizeString(storecode);
  const normalizedSignedAt = normalizeString(signedAt);

  if (!normalizedWalletAddress) {
    const passwordLoginId = requesterWalletAddress.startsWith("password:")
      ? requesterWalletAddress.slice("password:".length)
      : "";
    return {
      walletAddress: null,
      nickname: passwordLoginId || null,
      storecode: requesterIsAdmin ? "admin" : normalizedStorecode || null,
      role: requesterIsAdmin ? "admin" : "store_admin",
      publicIp: getRequestIp(request) || null,
      signedAt: normalizedSignedAt || null,
      matchedBy,
    };
  }

  let user: any = null;

  if (requesterIsAdmin) {
    user = await getOneAdminWalletUserByWalletAddress(normalizedWalletAddress);
  } else if (normalizedStorecode) {
    user = await getOneByWalletAddress(normalizedStorecode, normalizedWalletAddress);
  }

  return {
    walletAddress: normalizedWalletAddress || null,
    nickname: normalizeString(user?.nickname || user?.name) || null,
    storecode:
      normalizeString(user?.storecode) || (requesterIsAdmin ? "admin" : normalizedStorecode) || null,
    role: normalizeString(user?.role) || "admin",
    publicIp: getRequestIp(request) || null,
    signedAt: normalizedSignedAt || null,
    matchedBy,
  };
}
