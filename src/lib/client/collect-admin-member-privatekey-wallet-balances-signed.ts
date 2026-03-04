"use client";

import type { Account } from "thirdweb/wallets";

import { postAdminSignedJson } from "@/lib/client/admin-signed-action";

const ROUTE = "/api/admin/member/collectPrivateKeyWalletBalances";
const SIGNING_PREFIX = "stable-georgia:admin-member-private-key-wallet-collect:v1";

export async function postAdminMemberPrivateKeyWalletCollectSigned({
  account,
  requesterStorecode = "admin",
  requesterWalletAddress,
}: {
  account: Account | null | undefined;
  requesterStorecode?: string;
  requesterWalletAddress?: string;
}) {
  try {
    const response = await postAdminSignedJson({
      account,
      route: ROUTE,
      signingPrefix: SIGNING_PREFIX,
      body: {},
      requesterStorecode,
      requesterWalletAddress,
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
      error: error instanceof Error ? error.message : "Failed to request wallet collection",
    };
  }
}
