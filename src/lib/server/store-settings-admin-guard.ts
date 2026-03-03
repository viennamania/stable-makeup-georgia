import { NextRequest } from "next/server";

import { getOneByWalletAddress } from "@lib/api/user";
import { verifyAdminSignedAction } from "@/lib/server/admin-action-security";
import { normalizeWalletAddress } from "@/lib/server/user-read-security";

const STORE_SETTINGS_MUTATION_SIGNING_PREFIX = "stable-georgia:store-settings-mutation:v1";

const AUTH_FIELD_KEYS = new Set([
  "requesterStorecode",
  "requesterWalletAddress",
  "signature",
  "signedAt",
  "nonce",
]);

const isPlainObject = (value: unknown): value is Record<string, unknown> => {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
};

const extractActionFields = (body: Record<string, unknown>) => {
  const actionFields: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(body)) {
    if (AUTH_FIELD_KEYS.has(key)) {
      continue;
    }
    actionFields[key] = value;
  }

  return actionFields;
};

export const verifyStoreSettingsAdminGuard = async ({
  request,
  route,
  body,
}: {
  request: NextRequest;
  route: string;
  body: unknown;
}) => {
  const safeBody = isPlainObject(body) ? body : {};
  const requesterWalletAddressRaw =
    safeBody.requesterWalletAddress ?? safeBody.walletAddress ?? null;
  const requesterWalletAddress = normalizeWalletAddress(requesterWalletAddressRaw);

  const hasSignatureFields = Boolean(
    safeBody.signature && safeBody.signedAt && safeBody.nonce,
  );

  if (hasSignatureFields) {
    return verifyAdminSignedAction({
      request,
      route,
      signingPrefix: STORE_SETTINGS_MUTATION_SIGNING_PREFIX,
      requesterStorecodeRaw: safeBody.requesterStorecode ?? "admin",
      requesterWalletAddressRaw,
      signatureRaw: safeBody.signature,
      signedAtRaw: safeBody.signedAt,
      nonceRaw: safeBody.nonce,
      actionFields: extractActionFields(safeBody),
    });
  }

  if (!requesterWalletAddress) {
    return {
      ok: false as const,
      status: 401,
      error: "requesterWalletAddress is required",
    };
  }

  const requesterUser = await getOneByWalletAddress("admin", requesterWalletAddress);
  const requesterStorecode = String(requesterUser?.storecode || "").trim().toLowerCase();
  const requesterRole = String(requesterUser?.role || "").trim().toLowerCase();

  if (requesterStorecode !== "admin" || requesterRole !== "admin") {
    return {
      ok: false as const,
      status: 403,
      error: "Forbidden",
    };
  }

  return {
    ok: true as const,
    requesterWalletAddress,
    requesterStorecode: "admin",
    requesterUser,
    signedAtIso: "",
    nonce: "",
    ip: "unknown",
  };
};
