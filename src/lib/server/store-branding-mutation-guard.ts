import { NextRequest } from "next/server";

import { verifyCenterStoreAdminGuard } from "@/lib/server/center-store-admin-guard";
import { verifyStoreSettingsAdminGuard } from "@/lib/server/store-settings-admin-guard";

const isPlainObject = (value: unknown): value is Record<string, unknown> => {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
};

const normalizeString = (value: unknown) => {
  if (typeof value !== "string") {
    return "";
  }
  return value.trim();
};

export const verifyStoreBrandingMutationGuard = async ({
  request,
  route,
  body,
}: {
  request: NextRequest;
  route: string;
  body: unknown;
}) => {
  const safeBody = isPlainObject(body) ? body : {};
  const requesterStorecode = normalizeString(safeBody.requesterStorecode).toLowerCase();

  if (requesterStorecode && requesterStorecode !== "admin") {
    return verifyCenterStoreAdminGuard({
      request,
      route,
      body: safeBody,
      storecodeRaw: safeBody.storecode,
      requesterWalletAddressRaw: safeBody.requesterWalletAddress ?? safeBody.walletAddress,
    });
  }

  return verifyStoreSettingsAdminGuard({
    request,
    route,
    body: safeBody,
    requireSigned: true,
  });
};
