"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useActiveAccount } from "thirdweb/react";
import type { Account } from "thirdweb/wallets";

import { getAdminPasswordSession } from "@/lib/client/admin-password-auth";

export const ADMIN_PASSWORD_VIRTUAL_WALLET_ADDRESS =
  "0x0000000000000000000000000000000000000000";

export type AdminPasswordSessionAccount = {
  loginId: string;
  displayName: string | null;
  role: string;
  storecodes: string[];
  status: string;
};

export type AdminPasswordSessionState = {
  authenticated: boolean;
  loading: boolean;
  error: string;
  source: string;
  account: AdminPasswordSessionAccount | null;
  requesterWalletAddress: string;
  requesterStorecode: string;
  expiresAt: string;
  refresh: () => Promise<void>;
};

type AdminPasswordVirtualAccount = Account & {
  __adminPasswordSession: true;
  adminPasswordSession: AdminPasswordSessionState;
};

const AdminPasswordSessionContext = createContext<AdminPasswordSessionState | null>(null);

const normalizeString = (value: unknown): string => {
  if (typeof value !== "string") {
    return "";
  }
  return value.trim();
};

const createEmptySessionState = (
  refresh: () => Promise<void>,
): AdminPasswordSessionState => ({
  authenticated: false,
  loading: true,
  error: "",
  source: "",
  account: null,
  requesterWalletAddress: "",
  requesterStorecode: "",
  expiresAt: "",
  refresh,
});

export function isAdminPasswordSessionAccount(
  account: Account | null | undefined,
): account is AdminPasswordVirtualAccount {
  return Boolean((account as any)?.__adminPasswordSession === true);
}

export function AdminPasswordSessionProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [state, setState] = useState<AdminPasswordSessionState>(() =>
    createEmptySessionState(async () => {}),
  );

  const refresh = useCallback(async () => {
    setState((current) => ({
      ...current,
      loading: true,
      error: "",
    }));

    try {
      const result = await getAdminPasswordSession();
      const authenticated = Boolean(result?.authenticated);

      setState({
        authenticated,
        loading: false,
        error: "",
        source: normalizeString(result?.source),
        account: authenticated
          ? {
              loginId: normalizeString(result?.account?.loginId),
              displayName: normalizeString(result?.account?.displayName) || null,
              role: normalizeString(result?.account?.role),
              storecodes: Array.isArray(result?.account?.storecodes)
                ? result.account.storecodes.map((item: unknown) => normalizeString(item)).filter(Boolean)
                : [],
              status: normalizeString(result?.account?.status),
            }
          : null,
        requesterWalletAddress: normalizeString(result?.requesterWalletAddress),
        requesterStorecode: normalizeString(result?.requesterStorecode),
        expiresAt: normalizeString(result?.expiresAt),
        refresh,
      });
    } catch (error) {
      setState({
        authenticated: false,
        loading: false,
        error: error instanceof Error ? error.message : "관리자 세션 확인에 실패했습니다.",
        source: "",
        account: null,
        requesterWalletAddress: "",
        requesterStorecode: "",
        expiresAt: "",
        refresh,
      });
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const value = useMemo(
    () => ({
      ...state,
      refresh,
    }),
    [refresh, state],
  );

  return (
    <AdminPasswordSessionContext.Provider value={value}>
      {children}
    </AdminPasswordSessionContext.Provider>
  );
}

export function useAdminPasswordSessionState(): AdminPasswordSessionState {
  const context = useContext(AdminPasswordSessionContext);
  if (context) {
    return context;
  }

  return createEmptySessionState(async () => {});
}

export function useAdminActiveAccount(): Account | undefined {
  const activeAccount = useActiveAccount();
  const passwordSession = useAdminPasswordSessionState();

  return useMemo(() => {
    if (activeAccount) {
      return activeAccount;
    }

    if (!passwordSession.authenticated) {
      return undefined;
    }

    return {
      address: ADMIN_PASSWORD_VIRTUAL_WALLET_ADDRESS,
      __adminPasswordSession: true,
      adminPasswordSession: passwordSession,
    } as AdminPasswordVirtualAccount;
  }, [activeAccount, passwordSession]);
}
