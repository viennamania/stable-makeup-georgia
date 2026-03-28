const AUTH_FIELD_KEYS = new Set([
  "signature",
  "signedAt",
  "nonce",
]);

export const USER_WALLET_ACTION_SIGNING_PREFIX = "stable-georgia:user-wallet-action:v1";

export const isPlainObject = (value: unknown): value is Record<string, unknown> => {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
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

export const extractUserWalletActionFields = (body: Record<string, unknown>) => {
  const actionFields: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(body)) {
    if (AUTH_FIELD_KEYS.has(key)) {
      continue;
    }
    actionFields[key] = value;
  }

  return actionFields;
};

export const buildUserWalletActionSigningMessage = ({
  route,
  storecode,
  walletAddress,
  nonce,
  signedAtIso,
  actionFields,
}: {
  route: string;
  storecode: string;
  walletAddress: string;
  nonce: string;
  signedAtIso: string;
  actionFields: Record<string, unknown>;
}) => {
  const actionLines = Object.entries(actionFields || {})
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}:${normalizeActionFieldValue(value)}`);

  return [
    USER_WALLET_ACTION_SIGNING_PREFIX,
    `route:${route}`,
    `storecode:${storecode}`,
    `walletAddress:${walletAddress}`,
    `nonce:${nonce}`,
    `signedAt:${signedAtIso}`,
    ...actionLines,
  ].join("\n");
};
