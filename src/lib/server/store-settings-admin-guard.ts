import { NextRequest } from "next/server";

import { getOneAdminWalletUserByWalletAddress, getOneByWalletAddress } from "@lib/api/user";
import { insertStoreSettingsApiCallLog } from "@/lib/api/storeSettingsApiCallLog";
import { verifyAdminSignedAction } from "@/lib/server/admin-action-security";
import { getRequestCountry, getRequestIp, normalizeWalletAddress } from "@/lib/server/user-read-security";

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
  requireSigned = false,
}: {
  request: NextRequest;
  route: string;
  body: unknown;
  requireSigned?: boolean;
}) => {
  const safeBody = isPlainObject(body) ? body : {};
  const actionFields = extractActionFields(safeBody);
  const publicIp = getRequestIp(request);
  const publicCountry = getRequestCountry(request);

  const requesterWalletAddressRaw =
    safeBody.requesterWalletAddress ?? safeBody.walletAddress ?? null;
  const requesterWalletAddress = normalizeWalletAddress(requesterWalletAddressRaw);

  const hasSignatureFields = Boolean(
    safeBody.signature && safeBody.signedAt && safeBody.nonce,
  );

  if (requireSigned && !hasSignatureFields) {
    let requesterUser = null;
    if (requesterWalletAddress) {
      requesterUser = await getOneAdminWalletUserByWalletAddress(requesterWalletAddress);
    }

    await insertStoreSettingsApiCallLog({
      route,
      status: "blocked",
      reason: "signature_required",
      publicIp,
      publicCountry,
      requesterWalletAddress,
      requesterUser,
      requestBody: actionFields,
    });

    return {
      ok: false as const,
      status: 401,
      error: "Invalid signature",
    };
  }

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
      requesterUser = await getOneAdminWalletUserByWalletAddress(requesterWalletAddress);
    }

    await insertStoreSettingsApiCallLog({
      route,
      status: signedResult.ok ? "allowed" : "blocked",
      reason: signedResult.ok ? "admin_signed" : signedResult.error,
      publicIp: signedResult.ok ? signedResult.ip || publicIp : publicIp,
      publicCountry,
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
      publicCountry,
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

  const requesterUser = await getOneAdminWalletUserByWalletAddress(requesterWalletAddress);
  const requesterStorecode = String(requesterUser?.storecode || "").trim().toLowerCase();
  const requesterRole = String(requesterUser?.role || "").trim().toLowerCase();

  if (requesterStorecode !== "admin" || requesterRole !== "admin") {
    await insertStoreSettingsApiCallLog({
      route,
      status: "blocked",
      reason: "Forbidden",
      publicIp,
      publicCountry,
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
    publicCountry,
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
