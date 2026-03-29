import { randomUUID } from "crypto";

import {
  createThirdwebClient,
  Engine,
} from "thirdweb";

import { primeThirdwebServerWalletCache } from "@/lib/server/thirdweb-server-wallet-cache";
import { normalizeWalletAddress } from "@/lib/server/user-read-security";

export const BUY_ORDER_ESCROW_WALLET_MODE = {
  LEGACY_SMART_WALLET: "legacy-private-key-smart-wallet",
  SERVER_WALLET: "thirdweb-server-wallet",
} as const;

export type BuyOrderEscrowWalletMode =
  | typeof BUY_ORDER_ESCROW_WALLET_MODE.LEGACY_SMART_WALLET
  | typeof BUY_ORDER_ESCROW_WALLET_MODE.SERVER_WALLET;

type NormalizedEscrowWallet =
  | {
      mode: typeof BUY_ORDER_ESCROW_WALLET_MODE.LEGACY_SMART_WALLET;
      address: string;
      smartAccountAddress: string;
      privateKey: string;
      signerAddress: string;
      label: string;
    }
  | {
      mode: typeof BUY_ORDER_ESCROW_WALLET_MODE.SERVER_WALLET;
      address: string;
      smartAccountAddress: string;
      signerAddress: string;
      label: string;
    };

const normalizeString = (value: unknown): string => {
  if (typeof value !== "string") {
    return "";
  }
  return value.trim();
};

const getThirdwebSecretKey = () => {
  const secretKey = normalizeString(process.env.THIRDWEB_SECRET_KEY);
  if (!secretKey) {
    throw new Error("THIRDWEB_SECRET_KEY is required");
  }
  return secretKey;
};

const getThirdwebClient = () =>
  createThirdwebClient({
    secretKey: getThirdwebSecretKey(),
  });

export const normalizeBuyOrderEscrowWallet = (
  rawEscrowWallet: unknown,
): NormalizedEscrowWallet | null => {
  if (!rawEscrowWallet || typeof rawEscrowWallet !== "object") {
    return null;
  }

  const escrowWallet = rawEscrowWallet as Record<string, unknown>;
  const modeRaw = normalizeString(escrowWallet.mode || escrowWallet.type).toLowerCase();
  const privateKey = normalizeString(escrowWallet.privateKey);
  const signerAddress = normalizeWalletAddress(escrowWallet.signerAddress);
  const smartAccountAddress = normalizeWalletAddress(
    escrowWallet.smartAccountAddress || escrowWallet.address,
  );
  const label = normalizeString(escrowWallet.label);

  const isServerWallet =
    modeRaw === BUY_ORDER_ESCROW_WALLET_MODE.SERVER_WALLET
    || (!privateKey && !!signerAddress && !!smartAccountAddress);

  if (isServerWallet) {
    if (!signerAddress || !smartAccountAddress) {
      return null;
    }

    return {
      mode: BUY_ORDER_ESCROW_WALLET_MODE.SERVER_WALLET,
      address: smartAccountAddress,
      smartAccountAddress,
      signerAddress,
      label,
    };
  }

  if (!privateKey) {
    return null;
  }

  const legacyAddress = smartAccountAddress;
  if (!legacyAddress) {
    return null;
  }

  return {
    mode: BUY_ORDER_ESCROW_WALLET_MODE.LEGACY_SMART_WALLET,
    address: legacyAddress,
    smartAccountAddress: legacyAddress,
    privateKey,
    signerAddress: signerAddress || "",
    label,
  };
};

export const createBuyOrderEscrowWallet = async ({
  storecode,
}: {
  storecode: string;
}) => {
  const safeStorecode = normalizeString(storecode).toLowerCase() || "unknown";
  const client = getThirdwebClient();
  const label = `stable-georgia:buyorder-escrow:${safeStorecode}:${randomUUID()}`;

  let engineWallet = await Engine.createServerWallet({
    client,
    label,
  });

  let signerAddress = normalizeWalletAddress(engineWallet?.address);
  let smartAccountAddress = normalizeWalletAddress(engineWallet?.smartAccountAddress);

  if (!signerAddress || !smartAccountAddress) {
    throw new Error("Thirdweb server wallet was created without a smart account address. Retry the request.");
  }

  await primeThirdwebServerWalletCache({
    signerAddress,
    smartAccountAddress,
    label,
  });

  return {
    mode: BUY_ORDER_ESCROW_WALLET_MODE.SERVER_WALLET,
    address: smartAccountAddress,
    smartAccountAddress,
    signerAddress,
    label,
    createdAt: new Date().toISOString(),
  };
};
