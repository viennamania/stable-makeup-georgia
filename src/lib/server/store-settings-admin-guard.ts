import { NextRequest } from "next/server";

import { getOneByWalletAddress } from "@lib/api/user";
import { insertStoreSettingsApiCallLog } from "@/lib/api/storeSettingsApiCallLog";
import { verifyAdminSignedAction } from "@/lib/server/admin-action-security";
import { getRequestIp, normalizeWalletAddress } from "@/lib/server/user-read-security";

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
  const actionFields = extractActionFields(safeBody);
  const publicIp = getRequestIp(request);

  const requesterWalletAddressRaw =
    safeBody.requesterWalletAddress ?? safeBody.walletAddress ?? null;
  const requesterWalletAddress = normalizeWalletAddress(requesterWalletAddressRaw);

  const hasSignatureFields = Boolean(
    safeBody.signature && safeBody.signedAt && safeBody.nonce,
  );

  if (hasSignatureFields) {
    const signedResult = await verifyAdminSignedAction({
      request,
      route,
      signingPrefix: STORE_SETTINGS_MUTATION_SIGNING_PREFIX,
      requesterStorecodeRaw: safeBody.requesterStorecode ?? "admin",
      requesterWalletAddressRaw,
      signatureRaw: safeBody.signature,
      signedAtRaw: safeBody.signedAt,
      nonceRaw: safeBody.nonce,
      actionFields,
    });

    let requesterUser = signedResult.ok ? signedResult.requesterUser : null;
    if (!requesterUser && requesterWalletAddress) {
      requesterUser = await getOneByWalletAddress("admin", requesterWalletAddress);
    }

    await insertStoreSettingsApiCallLog({
      route,
      status: signedResult.ok ? "allowed" : "blocked",
      reason: signedResult.ok ? "admin_signed" : signedResult.error,
      publicIp: signedResult.ok ? signedResult.ip || publicIp : publicIp,
      requesterWalletAddress: signedResult.ok
        ? signedResult.requesterWalletAddress
        : requesterWalletAddress,
      requesterUser,
      requestBody: actionFields,
    });

    return signedResult;
  }

  if (!requesterWalletAddress) {
    await insertStoreSettingsApiCallLog({
      route,
      status: "blocked",
      reason: "requesterWalletAddress is required",
      publicIp,
      requesterWalletAddress: null,
      requesterUser: null,
      requestBody: actionFields,
    });

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
    await insertStoreSettingsApiCallLog({
      route,
      status: "blocked",
      reason: "Forbidden",
      publicIp,
      requesterWalletAddress,
      requesterUser,
      requestBody: actionFields,
    });

    return {
      ok: false as const,
      status: 403,
      error: "Forbidden",
    };
  }

  await insertStoreSettingsApiCallLog({
    route,
    status: "allowed",
    reason: "admin_wallet",
    publicIp,
    requesterWalletAddress,
    requesterUser,
    requestBody: actionFields,
  });

  return {
    ok: true as const,
    requesterWalletAddress,
    requesterStorecode: "admin",
    requesterUser,
    signedAtIso: "",
    nonce: "",
    ip: publicIp,
  };
};
