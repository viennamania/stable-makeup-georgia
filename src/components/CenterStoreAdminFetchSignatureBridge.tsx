"use client";

import { useEffect, useRef } from "react";
import { useActiveAccount } from "thirdweb/react";

import {
  buildCenterStoreAdminSigningMessage,
  extractCenterStoreAdminActionFields,
  isPlainObject,
} from "@/lib/security/center-store-admin-signing";

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
  "/api/store/getEscrowBalance",
  "/api/user/clearanceWalletAddress",
]);

const PROTECTED_STORE_SETTINGS_MUTATION_PATHS = new Set([
  "/api/store/updateStoreSettlementWalletAddress",
]);

const STORE_SETTINGS_MUTATION_SIGNING_PREFIX = "stable-georgia:store-settings-mutation:v1";

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

export default function CenterStoreAdminFetchSignatureBridge() {
  const activeAccount = useActiveAccount();
  const activeAccountRef = useRef(activeAccount);

  useEffect(() => {
    activeAccountRef.current = activeAccount;
  }, [activeAccount]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const globalWindow = window as typeof window & {
      __centerStoreAdminFetchPatched?: boolean;
    };

    if (globalWindow.__centerStoreAdminFetchPatched) {
      return;
    }
    globalWindow.__centerStoreAdminFetchPatched = true;

    const originalFetch = window.fetch.bind(window);

    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const path = toRequestPath(input);
      const isCenterStoreAdminPath = PROTECTED_CENTER_STORE_ADMIN_PATHS.has(path);
      const isStoreSettingsMutationPath = PROTECTED_STORE_SETTINGS_MUTATION_PATHS.has(path);

      if (!isCenterStoreAdminPath && !isStoreSettingsMutationPath) {
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

      const alreadySigned = Boolean(payload.signature && payload.signedAt && payload.nonce);
      if (alreadySigned) {
        return originalFetch(input, init);
      }

      const account = activeAccountRef.current;
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
      const nonce = createNonce();
      const actionFields = extractCenterStoreAdminActionFields(payload);
      let signingMessage = "";
      let signedPayload: Record<string, unknown> = {
        ...payload,
        requesterWalletAddress: requesterWalletAddress,
      };

      if (isCenterStoreAdminPath) {
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

      const signature = await account.signMessage({
        message: signingMessage,
      });

      signedPayload = {
        ...signedPayload,
        signature,
        signedAt,
        nonce,
      };

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

      if (input instanceof Request) {
        return originalFetch(input.url, signedInit);
      }

      return originalFetch(input, signedInit);
    };
  }, []);

  return null;
}
