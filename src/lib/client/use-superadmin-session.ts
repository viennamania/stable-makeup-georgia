"use client";

import { useCallback, useEffect, useState } from "react";

import { postAdminSignedJson } from "@/lib/client/admin-signed-action";
import type { Account } from "thirdweb/wallets";

type SuperadminSessionState = {
  user: any | null;
  role: string;
  isSuperadmin: boolean;
  requesterWalletAddress: string;
  loading: boolean;
  error: string;
  refresh: () => Promise<void>;
};

const SESSION_ROUTE = "/api/superadmin/session";
const SESSION_SIGNING_PREFIX = "stable-georgia:superadmin:session:v1";

const normalizeString = (value: unknown): string => {
  if (typeof value !== "string") {
    return "";
  }
  return value.trim();
};

export const useSuperadminSession = (
  account: Account | null | undefined,
): SuperadminSessionState => {
  const [user, setUser] = useState<any | null>(null);
  const [role, setRole] = useState("");
  const [isSuperadmin, setIsSuperadmin] = useState(false);
  const [requesterWalletAddress, setRequesterWalletAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    if (!account) {
      setUser(null);
      setRole("");
      setIsSuperadmin(false);
      setRequesterWalletAddress("");
      setError("");
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const response = await postAdminSignedJson({
        account,
        route: SESSION_ROUTE,
        signingPrefix: SESSION_SIGNING_PREFIX,
        requesterStorecode: "superadmin",
        body: {},
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "슈퍼어드민 권한 확인에 실패했습니다.");
      }

      const nextRole = normalizeString(data?.result?.role).toLowerCase();
      setUser(data?.result?.user || null);
      setRole(nextRole);
      setIsSuperadmin(Boolean(data?.result?.isSuperadmin));
      setRequesterWalletAddress(normalizeString(data?.result?.requesterWalletAddress).toLowerCase());
      setError("");
    } catch (nextError) {
      setUser(null);
      setRole("");
      setIsSuperadmin(false);
      setRequesterWalletAddress("");
      setError(nextError instanceof Error ? nextError.message : "슈퍼어드민 권한 확인에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }, [account]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    user,
    role,
    isSuperadmin,
    requesterWalletAddress,
    loading,
    error,
    refresh,
  };
};
