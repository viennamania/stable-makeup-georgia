"use client";

import { signAdminActionPayload } from "@/lib/client/admin-signed-action";
import { isAdminPasswordSessionAccount } from "@/lib/client/use-admin-active-account";
import type { Account } from "thirdweb/wallets";

export const ADMIN_PASSWORD_ACCOUNTS_LIST_ROUTE = "/api/admin-auth/accounts/list";
export const ADMIN_PASSWORD_ACCOUNTS_LIST_SIGNING_PREFIX =
  "stable-georgia:admin-password-accounts:list:v1";
export const ADMIN_PASSWORD_STORE_ADMIN_UPSERT_ROUTE =
  "/api/admin-auth/accounts/upsert-store-admin";
export const ADMIN_PASSWORD_STORE_ADMIN_UPSERT_SIGNING_PREFIX =
  "stable-georgia:admin-password-accounts:upsert-store-admin:v1";

const normalizeString = (value: unknown): string => {
  if (typeof value !== "string") {
    return "";
  }
  return value.trim();
};

const normalizeStorecodes = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.map((item) => normalizeString(item).toLowerCase()).filter(Boolean);
  }
  return normalizeString(value)
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
};

const postProtectedAdminPasswordJson = async ({
  account,
  route,
  signingPrefix,
  body,
  actionFields,
}: {
  account: Account | null | undefined;
  route: string;
  signingPrefix: string;
  body?: Record<string, unknown>;
  actionFields?: Record<string, unknown>;
}) => {
  if (!account || isAdminPasswordSessionAccount(account)) {
    return fetch(route, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "same-origin",
      body: JSON.stringify(body || {}),
    });
  }

  const signed = await signAdminActionPayload({
    account,
    route,
    signingPrefix,
    actionFields: actionFields || {},
    requesterStorecode: "admin",
  });

  return fetch(route, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ...(body || {}),
      ...signed,
    }),
  });
};

export const postAdminPasswordAccountList = (account: Account | null | undefined) => {
  return postProtectedAdminPasswordJson({
    account,
    route: ADMIN_PASSWORD_ACCOUNTS_LIST_ROUTE,
    signingPrefix: ADMIN_PASSWORD_ACCOUNTS_LIST_SIGNING_PREFIX,
    body: {},
    actionFields: {},
  });
};

export const postAdminPasswordStoreAdminUpsert = ({
  account,
  loginId,
  password,
  displayName,
  storecodes,
}: {
  account: Account | null | undefined;
  loginId: string;
  password: string;
  displayName?: string;
  storecodes: string | string[];
}) => {
  const normalizedStorecodes = Array.from(new Set(normalizeStorecodes(storecodes)));
  const safeBody = {
    loginId: normalizeString(loginId).toLowerCase(),
    displayName: normalizeString(displayName),
    role: "store_admin",
    storecodes: normalizedStorecodes,
    password,
  };

  return postProtectedAdminPasswordJson({
    account,
    route: ADMIN_PASSWORD_STORE_ADMIN_UPSERT_ROUTE,
    signingPrefix: ADMIN_PASSWORD_STORE_ADMIN_UPSERT_SIGNING_PREFIX,
    body: safeBody,
    actionFields: {
      loginId: safeBody.loginId,
      displayName: safeBody.displayName,
      role: "store_admin",
      storecodes: normalizedStorecodes.join(","),
      passwordProvided: password ? "true" : "false",
    },
  });
};
