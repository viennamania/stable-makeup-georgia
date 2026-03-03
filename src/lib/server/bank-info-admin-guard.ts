import { NextRequest } from "next/server";

import { verifyAdminSignedAction } from "@/lib/server/admin-action-security";
import { isPlainObject } from "@/lib/security/center-store-admin-signing";

export const BANK_INFO_ADMIN_SIGNING_PREFIX = "stable-georgia:admin-bank-info:v1";

const AUTH_FIELD_KEYS = new Set([
  "requesterStorecode",
  "requesterWalletAddress",
  "signature",
  "signedAt",
  "nonce",
]);

const extractBankInfoActionFields = (body: Record<string, unknown>) => {
  const actionFields: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(body)) {
    if (AUTH_FIELD_KEYS.has(key)) {
      continue;
    }
    actionFields[key] = value;
  }

  return actionFields;
};

export const verifyBankInfoAdminGuard = async ({
  request,
  route,
  body,
}: {
  request: NextRequest;
  route: string;
  body: unknown;
}) => {
  const safeBody = isPlainObject(body) ? body : {};

  return verifyAdminSignedAction({
    request,
    route,
    signingPrefix: BANK_INFO_ADMIN_SIGNING_PREFIX,
    requesterStorecodeRaw: safeBody.requesterStorecode ?? "admin",
    requesterWalletAddressRaw: safeBody.requesterWalletAddress,
    signatureRaw: safeBody.signature,
    signedAtRaw: safeBody.signedAt,
    nonceRaw: safeBody.nonce,
    actionFields: extractBankInfoActionFields(safeBody),
  });
};
