"use client";

import { useLayoutEffect } from "react";
import { useActiveAccount } from "thirdweb/react";

import {
  buildCenterStoreAdminSigningMessage,
  extractCenterStoreAdminActionFields,
  isPlainObject,
} from "@/lib/security/center-store-admin-signing";
import {
  buildUserWalletActionSigningMessage,
  extractUserWalletActionFields,
} from "@/lib/security/user-wallet-action-signing";

const PROTECTED_CENTER_STORE_ADMIN_PATHS = new Set([
  "/api/order/acceptBuyOrder",
  "/api/order/buyOrderConfirmPaymentWithEscrow",
  "/api/order/buyOrderConfirmPaymentWithoutEscrow",
  "/api/order/buyOrderSettlement",
  "/api/order/cancelTradeBySeller",
  "/api/order/getAllBuyOrders",
  "/api/order/getAllBuyOrdersByStorecodeDaily",
  "/api/order/getAllBuyOrdersForSeller",
  "/api/order/getAllCollectOrdersForSeller",
  "/api/order/getAllCollectOrdersForUser",
  "/api/order/getCountOfPaymentRequested",
  "/api/order/transferEscrowBalanceToMyWallet",
  "/api/order/transferEscrowBalanceToSeller",
  "/api/order/updateBuyOrderSettlement",
  "/api/store/getAllStores",
  "/api/store/getOneStore",
  "/api/store/getEscrowBalance",
  "/api/user/getAllBuyers",
  "/api/user/clearanceWalletAddress",
  "/api/user/insertBuyerWithoutWalletAddressByStorecode",
  "/api/user/updateUserBankInfo",
  "/api/user/updateUserType",
]);

const PROTECTED_STORE_SETTINGS_MUTATION_PATHS = new Set([
  "/api/store/updateStoreSettlementWalletAddress",
]);

const SELF_READ_USER_PATHS = new Set([
  "/api/user/getUser",
]);

const SELF_WALLET_ACTION_PATHS = new Set([
  "/api/order/getEscrowWalletAddress",
  "/api/user/setUserVerified",
]);

const STORE_SETTINGS_MUTATION_SIGNING_PREFIX = "stable-georgia:store-settings-mutation:v1";
const SELF_READ_SIGNING_PREFIX = "stable-georgia:get-user:self:v1";
const GET_USER_BY_WALLET_ADDRESS_ADMIN_SIGNING_PREFIX =
  "stable-georgia:get-user-by-wallet:admin:v1";
const PROTECTED_REQUEST_ACCOUNT_WAIT_MS = 10000;
const PROTECTED_REQUEST_SIGN_TIMEOUT_MS = 10000;

const normalizeString = (value: unknown) => {
  if (typeof value !== "string") {
    return "";
  }
  return value.trim();
};

const normalizeActionFieldValue = (value: unknown): string => {
  if (value == null) {
    return "";
  }
  if (Array.isArray(value)) {
    return value.map((item) => normalizeActionFieldValue(item)).join(",");
  }
  if (typeof value === "object") {
    try {
      return JSON.stringify(value);
    } catch {
      return "";
    }
  }
  return String(value).trim();
};

const buildStoreSettingsMutationSigningMessage = ({
  route,
  requesterStorecode,
  requesterWalletAddress,
  nonce,
  signedAtIso,
  actionFields,
}: {
  route: string;
  requesterStorecode: string;
  requesterWalletAddress: string;
  nonce: string;
  signedAtIso: string;
  actionFields: Record<string, unknown>;
}) => {
  const actionLines = Object.entries(actionFields || {})
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}:${normalizeActionFieldValue(value)}`);

  return [
    STORE_SETTINGS_MUTATION_SIGNING_PREFIX,
    `route:${route}`,
    `requesterStorecode:${requesterStorecode}`,
    `requesterWalletAddress:${requesterWalletAddress}`,
    `nonce:${nonce}`,
    `signedAt:${signedAtIso}`,
    ...actionLines,
  ].join("\n");
};

const buildSelfReadSigningMessage = ({
  storecode,
  walletAddress,
  signedAtIso,
}: {
  storecode: string;
  walletAddress: string;
  signedAtIso: string;
}) => {
  return [
    SELF_READ_SIGNING_PREFIX,
    `storecode:${storecode}`,
    `walletAddress:${walletAddress}`,
    `signedAt:${signedAtIso}`,
  ].join("\n");
};

const toRequestPath = (input: RequestInfo | URL) => {
  try {
    if (typeof input === "string") {
      return new URL(input, window.location.origin).pathname;
    }
    if (input instanceof URL) {
      return input.pathname;
    }
    return new URL(input.url, window.location.origin).pathname;
  } catch {
    return "";
  }
};

const createNonce = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

const wait = (ms: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

type SignableAccount = {
  address?: string;
  signMessage: (input: { message: string }) => Promise<string>;
};

type BridgeWindow = typeof window & {
  __centerStoreAdminFetchPatched?: boolean;
  __centerStoreAdminActiveAccount?: SignableAccount | null;
};

const signMessageWithRetry = async ({
  account,
  message,
  timeoutMs = PROTECTED_REQUEST_SIGN_TIMEOUT_MS,
}: {
  account: { signMessage: (input: { message: string }) => Promise<string> };
  message: string;
  timeoutMs?: number;
}) => {
  const waitUntil = Date.now() + Math.max(500, timeoutMs);
  let lastError: unknown = null;

  while (Date.now() < waitUntil) {
    try {
      return await account.signMessage({
        message,
      });
    } catch (error) {
      lastError = error;
      await wait(100);
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("Failed to sign protected request");
};

export default function CenterStoreAdminFetchSignatureBridge() {
  const activeAccount = useActiveAccount();

  const installFetchPatch = () => {
    if (typeof window === "undefined") {
      return;
    }

    const globalWindow = window as BridgeWindow;
    globalWindow.__centerStoreAdminActiveAccount = activeAccount ?? null;

    if (globalWindow.__centerStoreAdminFetchPatched) {
      return;
    }
    globalWindow.__centerStoreAdminFetchPatched = true;

    const originalFetch = window.fetch.bind(window);

    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const path = toRequestPath(input);
      const isCenterStoreAdminPath = PROTECTED_CENTER_STORE_ADMIN_PATHS.has(path);
      const isStoreSettingsMutationPath = PROTECTED_STORE_SETTINGS_MUTATION_PATHS.has(path);
      const isSelfReadPath = SELF_READ_USER_PATHS.has(path);
      const isSelfWalletActionPath = SELF_WALLET_ACTION_PATHS.has(path);

      if (!isCenterStoreAdminPath && !isStoreSettingsMutationPath && !isSelfReadPath && !isSelfWalletActionPath) {
        return originalFetch(input, init);
      }

      const method = normalizeString(init?.method || (input instanceof Request ? input.method : "GET"))
        .toUpperCase();
      if (method !== "POST") {
        return originalFetch(input, init);
      }

      const bodyText = typeof init?.body === "string" ? init.body : null;
      if (!bodyText) {
        return originalFetch(input, init);
      }

      let payload: unknown = null;
      try {
        payload = JSON.parse(bodyText);
      } catch {
        return originalFetch(input, init);
      }

      if (!isPlainObject(payload)) {
        return originalFetch(input, init);
      }

      const alreadySigned = isSelfReadPath
        ? Boolean(payload.signature && payload.signedAt)
        : Boolean(payload.signature && payload.signedAt && payload.nonce);
      if (alreadySigned) {
        return originalFetch(input, init);
      }

      let account = globalWindow.__centerStoreAdminActiveAccount;
      if (!account) {
        const waitUntil = Date.now() + PROTECTED_REQUEST_ACCOUNT_WAIT_MS;
        while (!account && Date.now() < waitUntil) {
          await wait(50);
          account = globalWindow.__centerStoreAdminActiveAccount;
        }
      }

      if (!account) {
        return originalFetch(input, init);
      }

      const requesterWalletAddressFromPayload = normalizeString(
        payload.requesterWalletAddress,
      ).toLowerCase();
      const requesterWalletAddress = requesterWalletAddressFromPayload
        || normalizeString(account.address).toLowerCase();

      if (!requesterWalletAddress) {
        return originalFetch(input, init);
      }

      const signedAt = new Date().toISOString();
      const nonce = isSelfReadPath ? "" : createNonce();
      const actionFields = extractCenterStoreAdminActionFields(payload);
      let signingMessage = "";
      let signedPayload: Record<string, unknown> = {
        ...payload,
        requesterWalletAddress: requesterWalletAddress,
      };
      let targetInput: RequestInfo | URL = input;

      if (isSelfReadPath) {
        const storecode = normalizeString(payload.storecode);
        const targetWalletAddress =
          normalizeString(payload.walletAddress).toLowerCase() || requesterWalletAddress;
        if (!storecode || !targetWalletAddress) {
          return originalFetch(input, init);
        }
        if (storecode.toLowerCase() === "admin") {
          const adminActionFields = {
            storecode: "admin",
            walletAddress: targetWalletAddress,
          };
          signingMessage = buildStoreSettingsMutationSigningMessage({
            route: "/api/user/getUserByWalletAddress",
            requesterStorecode: "admin",
            requesterWalletAddress,
            nonce,
            signedAtIso: signedAt,
            actionFields: adminActionFields,
          }).replace(STORE_SETTINGS_MUTATION_SIGNING_PREFIX, GET_USER_BY_WALLET_ADDRESS_ADMIN_SIGNING_PREFIX);
          signedPayload = {
            ...adminActionFields,
            requesterStorecode: "admin",
            requesterWalletAddress,
          };
          targetInput = "/api/user/getUserByWalletAddress";
        } else {
          signingMessage = buildSelfReadSigningMessage({
            storecode,
            walletAddress: targetWalletAddress,
            signedAtIso: signedAt,
          });
          signedPayload = {
            ...payload,
            storecode,
            walletAddress: targetWalletAddress,
            requesterWalletAddress: targetWalletAddress,
          };
        }
      } else if (isSelfWalletActionPath) {
        const storecode = normalizeString(payload.storecode);
        const targetWalletAddress =
          normalizeString(payload.walletAddress).toLowerCase() || requesterWalletAddress;
        if (!storecode || !targetWalletAddress || targetWalletAddress !== requesterWalletAddress) {
          return originalFetch(input, init);
        }
        signedPayload = {
          ...payload,
          storecode,
          walletAddress: targetWalletAddress,
        };
        const selfActionFields = extractUserWalletActionFields(signedPayload);
        selfActionFields.storecode = storecode;
        selfActionFields.walletAddress = targetWalletAddress;
        signingMessage = buildUserWalletActionSigningMessage({
          route: path,
          storecode,
          walletAddress: targetWalletAddress,
          nonce,
          signedAtIso: signedAt,
          actionFields: selfActionFields,
        });
      } else if (isCenterStoreAdminPath) {
        const storecode = normalizeString(payload.storecode);
        const requesterStorecode = normalizeString(payload.requesterStorecode);
        const signingStorecode = storecode || requesterStorecode || "admin";
        signingMessage = buildCenterStoreAdminSigningMessage({
          route: path,
          storecode: signingStorecode,
          requesterWalletAddress,
          nonce,
          signedAtIso: signedAt,
          actionFields,
        });
        signedPayload = {
          ...signedPayload,
          requesterStorecode: signingStorecode,
        };
      } else {
        const requesterStorecode = normalizeString(payload.requesterStorecode) || "admin";
        signingMessage = buildStoreSettingsMutationSigningMessage({
          route: path,
          requesterStorecode,
          requesterWalletAddress,
          nonce,
          signedAtIso: signedAt,
          actionFields,
        });
        signedPayload = {
          ...signedPayload,
          requesterStorecode,
        };
      }

      const signature = await signMessageWithRetry({
        account,
        message: signingMessage,
      });

      signedPayload = {
        ...signedPayload,
        signature,
        signedAt,
      };
      if (!isSelfReadPath || normalizeString((signedPayload as Record<string, unknown>).requesterStorecode)) {
        signedPayload = {
          ...signedPayload,
          nonce,
        };
      }

      const headers = new Headers(init?.headers || (input instanceof Request ? input.headers : undefined));
      if (!headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json");
      }

      const signedInit: RequestInit = {
        ...init,
        method: "POST",
        headers,
        body: JSON.stringify(signedPayload),
      };

      if (targetInput instanceof Request) {
        return originalFetch(targetInput.url, signedInit);
      }

      if (input instanceof Request) {
        return originalFetch(typeof targetInput === "string" ? targetInput : targetInput.toString(), signedInit);
      }

      return originalFetch(targetInput, signedInit);
    };
  };

  installFetchPatch();

  useLayoutEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const globalWindow = window as BridgeWindow;
    globalWindow.__centerStoreAdminActiveAccount = activeAccount ?? null;
  }, [activeAccount]);

  return null;
}
