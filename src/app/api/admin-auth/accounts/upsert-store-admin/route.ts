import { NextResponse, type NextRequest } from "next/server";

import { upsertAdminPasswordAccount } from "@/lib/server/admin-password-auth";
import { verifyAdminSignedAction } from "@/lib/server/admin-action-security";

export const runtime = "nodejs";

const ROUTE = "/api/admin-auth/accounts/upsert-store-admin";
const SIGNING_PREFIX = "stable-georgia:admin-password-accounts:upsert-store-admin:v1";

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

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const loginId = normalizeString(body?.loginId).toLowerCase();
  const displayName = normalizeString(body?.displayName);
  const storecodes = Array.from(new Set(normalizeStorecodes(body?.storecodes)));
  const passwordProvided = typeof body?.password === "string" && body.password.length > 0;
  const actionFields = {
    loginId,
    displayName,
    role: "store_admin",
    storecodes: storecodes.join(","),
    passwordProvided: passwordProvided ? "true" : "false",
  };

  const authResult = await verifyAdminSignedAction({
    request,
    route: ROUTE,
    signingPrefix: SIGNING_PREFIX,
    requesterStorecodeRaw: body?.requesterStorecode,
    requesterWalletAddressRaw: body?.requesterWalletAddress,
    signatureRaw: body?.signature,
    signedAtRaw: body?.signedAt,
    nonceRaw: body?.nonce,
    actionFields,
    requestLogActionFields: actionFields,
    allowedRoles: ["admin"],
    requireAdminStorecode: true,
  });

  if (!authResult.ok) {
    return NextResponse.json(
      {
        status: "error",
        result: null,
        error: authResult.error,
      },
      { status: authResult.status },
    );
  }

  try {
    const result = await upsertAdminPasswordAccount({
      loginIdRaw: loginId,
      passwordRaw: body?.password,
      displayNameRaw: displayName,
      roleRaw: "store_admin",
      storecodesRaw: storecodes,
      statusRaw: "active",
      updateExisting: true,
    });

    return NextResponse.json({
      status: "success",
      result,
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        result: null,
        error: error instanceof Error ? error.message : "Failed to save admin password account",
      },
      { status: 400 },
    );
  }
}
