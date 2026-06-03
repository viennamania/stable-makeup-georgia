"use client";

const ADMIN_AUTH_LOGIN_ROUTE = "/api/admin-auth/login";
const ADMIN_AUTH_LOGOUT_ROUTE = "/api/admin-auth/logout";
const ADMIN_AUTH_SESSION_ROUTE = "/api/admin-auth/session";

export async function loginAdminPassword({
  loginId,
  password,
  returnToken = false,
}: {
  loginId: string;
  password: string;
  returnToken?: boolean;
}) {
  const response = await fetch(ADMIN_AUTH_LOGIN_ROUTE, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(returnToken ? { "x-return-admin-token": "true" } : {}),
    },
    credentials: "same-origin",
    body: JSON.stringify({
      loginId,
      password,
      returnToken,
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.error || `Admin login failed (${response.status})`);
  }
  return data?.result || null;
}

export async function logoutAdminPassword() {
  const response = await fetch(ADMIN_AUTH_LOGOUT_ROUTE, {
    method: "POST",
    credentials: "same-origin",
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.error || `Admin logout failed (${response.status})`);
  }
  return data?.result || null;
}

export async function getAdminPasswordSession() {
  const response = await fetch(ADMIN_AUTH_SESSION_ROUTE, {
    method: "GET",
    credentials: "same-origin",
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.error || `Admin session check failed (${response.status})`);
  }
  return data?.result || null;
}
