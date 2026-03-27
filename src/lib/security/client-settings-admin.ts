const AUTH_FIELD_KEYS = new Set([
  "requesterStorecode",
  "requesterWalletAddress",
  "signature",
  "signedAt",
  "nonce",
]);

export const CLIENT_SETTINGS_ADMIN_MUTATION_SIGNING_PREFIX =
  "stable-georgia:admin-client-settings:v1";

export const CLIENT_SETTINGS_ADMIN_UPLOAD_SIGNING_PREFIX =
  "stable-georgia:admin-client-settings-upload:v1";

export const CLIENT_SETTINGS_UPDATE_PROFILE_ROUTE = "/api/client/updateClientProfile";
export const CLIENT_SETTINGS_UPDATE_BUY_RATE_ROUTE = "/api/client/updateExchangeRateBuy";
export const CLIENT_SETTINGS_UPDATE_SELL_RATE_ROUTE = "/api/client/updateExchangeRateSell";
export const CLIENT_SETTINGS_UPDATE_AVATAR_ROUTE = "/api/client/updateAvatar";
export const CLIENT_SETTINGS_UPDATE_PAYACTION_ROUTE = "/api/client/updatePayactionViewOn";
export const CLIENT_SETTINGS_ADMIN_UPLOAD_ROUTE = "/api/upload/admin-client-settings";

export const isPlainObject = (value: unknown): value is Record<string, unknown> => {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
};

export const extractClientSettingsAdminActionFields = (body: Record<string, unknown>) => {
  const actionFields: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(body || {})) {
    if (AUTH_FIELD_KEYS.has(key)) {
      continue;
    }
    actionFields[key] = value;
  }

  return actionFields;
};
