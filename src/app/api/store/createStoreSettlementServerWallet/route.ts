import { NextResponse, type NextRequest } from "next/server";
import { createThirdwebClient, Engine } from "thirdweb";

import {
  getStoreByStorecode,
  updateStoreSettlementWalletAddress,
} from "@lib/api/store";
import {
  getAllUsersByStorecodeFiltered,
  upsertStoreServerWalletUser,
} from "@lib/api/user";

import { verifyStoreSettingsAdminGuard } from "@/lib/server/store-settings-admin-guard";
import { syncThirdwebSellerUsdtWebhooks } from "@/lib/server/thirdweb-insight-webhook-sync";
import {
  primeThirdwebServerWalletCache,
  resolveThirdwebServerWalletByAddress,
} from "@/lib/server/thirdweb-server-wallet-cache";
import { getRequestIp, normalizeWalletAddress } from "@/lib/server/user-read-security";

export const runtime = "nodejs";
export const preferredRegion = "icn1";
const ROUTE_PATH = "/api/store/createStoreSettlementServerWallet";

const normalizeString = (value: unknown): string => {
  if (typeof value !== "string") {
    return "";
  }
  return value.trim();
};

const buildSettlementWalletLabel = (storecode: string) =>
  `stable-georgia:settlement:${normalizeString(storecode).toLowerCase()}`;

const buildSettlementWalletNickname = (store: any, storecode: string) => {
  const storeName = normalizeString(store?.storeName);
  return storeName ? `${storeName} 자동결제` : `${normalizeString(storecode)} 자동결제`;
};

const serializeUser = (user: any) => ({
  _id: user?._id ? String(user._id) : "",
  storecode: normalizeString(user?.storecode),
  nickname: normalizeString(user?.nickname),
  walletAddress: normalizeWalletAddress(user?.walletAddress),
  signerAddress: normalizeWalletAddress(user?.signerAddress),
});

const syncThirdwebWebhookState = async (request: NextRequest) => {
  try {
    return await syncThirdwebSellerUsdtWebhooks({
      baseUrl: new URL(request.url).origin,
    });
  } catch (error) {
    console.error("Failed to sync thirdweb store wallet webhooks after settlement server wallet create:", error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to sync thirdweb store wallet webhooks",
    };
  }
};

export async function POST(request: NextRequest) {
  let body: Record<string, unknown> = {};
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    body = {};
  }

  const storecode = normalizeString(body.storecode);
  if (!storecode) {
    return NextResponse.json(
      {
        result: null,
        error: "storecode is required",
      },
      { status: 400 },
    );
  }

  const guard = await verifyStoreSettingsAdminGuard({
    request,
    route: ROUTE_PATH,
    body,
    requireSigned: true,
  });

  if (!guard.ok) {
    return NextResponse.json(
      {
        result: null,
        error: guard.error,
      },
      { status: guard.status },
    );
  }

  const settlementWalletAudit = {
    route: ROUTE_PATH,
    publicIp: guard.ip || getRequestIp(request),
    requesterWalletAddress: guard.requesterWalletAddress,
    userAgent: request.headers.get("user-agent"),
  };

  const store = await getStoreByStorecode({ storecode });
  if (!store) {
    return NextResponse.json(
      {
        result: null,
        error: "Store not found",
      },
      { status: 404 },
    );
  }

  const existingUsers = await getAllUsersByStorecodeFiltered({
    storecode,
    limit: 1,
    page: 1,
    verifiedOnly: false,
    requireSignerAddress: true,
  });

  const existingUser = existingUsers?.users?.[0] || null;
  const existingWalletAddress = normalizeWalletAddress(existingUser?.walletAddress);
  const existingSignerAddress = normalizeWalletAddress(existingUser?.signerAddress);
  let existingResolvedServerWallet = null;

  if (existingUser && existingWalletAddress) {
    try {
      existingResolvedServerWallet = await resolveThirdwebServerWalletByAddress(existingWalletAddress);
    } catch (error) {
      return NextResponse.json(
        {
          result: null,
          error: error instanceof Error ? error.message : "Failed to validate existing settlement server wallet",
        },
        { status: 500 },
      );
    }
  }

  if (
    existingUser
    && existingWalletAddress
    && existingResolvedServerWallet
    && existingResolvedServerWallet.smartAccountAddress === existingWalletAddress
    && existingSignerAddress
    && existingSignerAddress === existingResolvedServerWallet.signerAddress
  ) {
    const updatedStore = await updateStoreSettlementWalletAddress({
      storecode,
      settlementWalletAddress: existingWalletAddress,
      audit: settlementWalletAudit,
    });

    if (!updatedStore) {
      return NextResponse.json(
        {
          result: null,
          error: "Store not found",
        },
        { status: 404 },
      );
    }

    const thirdwebWebhookSync = await syncThirdwebWebhookState(request);

    return NextResponse.json({
      result: {
        created: false,
        engineWalletCreated: false,
        settlementWalletAddress: existingWalletAddress,
        signerAddress: normalizeWalletAddress(existingUser?.signerAddress),
        user: serializeUser(existingUser),
        thirdwebWebhookSync,
      },
    });
  }

  const thirdwebSecretKey = normalizeString(process.env.THIRDWEB_SECRET_KEY);
  if (!thirdwebSecretKey) {
    return NextResponse.json(
      {
        result: null,
        error: "THIRDWEB_SECRET_KEY is required",
      },
      { status: 500 },
    );
  }

  try {
    const client = createThirdwebClient({
      secretKey: thirdwebSecretKey,
    });

    const label = buildSettlementWalletLabel(storecode);
    const engineWallet = await Engine.createServerWallet({
      client,
      label,
    });
    const engineWalletCreated = true;

    let signerAddress = normalizeWalletAddress(engineWallet?.address);
    let smartAccountAddress = normalizeWalletAddress(engineWallet?.smartAccountAddress);

    if (!signerAddress || !smartAccountAddress) {
      return NextResponse.json(
        {
          result: null,
          error: "Thirdweb server wallet was created without a smart account address. Retry the request.",
        },
        { status: 500 },
      );
    }

    await primeThirdwebServerWalletCache({
      signerAddress,
      smartAccountAddress,
      label,
    });

    const user = await upsertStoreServerWalletUser({
      storecode,
      walletAddress: smartAccountAddress,
      signerAddress,
      nicknameBase: buildSettlementWalletNickname(store, storecode),
    });

    if (!user) {
      return NextResponse.json(
        {
          result: null,
          error: "Failed to save settlement server wallet user",
        },
        { status: 500 },
      );
    }

    const updatedStore = await updateStoreSettlementWalletAddress({
      storecode,
      settlementWalletAddress: smartAccountAddress,
      audit: settlementWalletAudit,
    });

    if (!updatedStore) {
      return NextResponse.json(
        {
          result: null,
          error: "Store not found",
        },
        { status: 404 },
      );
    }

    const thirdwebWebhookSync = await syncThirdwebWebhookState(request);

    return NextResponse.json({
      result: {
        created: true,
        engineWalletCreated,
        settlementWalletAddress: smartAccountAddress,
        signerAddress,
        user: serializeUser(user),
        thirdwebWebhookSync,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        result: null,
        error: error instanceof Error ? error.message : "Failed to create settlement server wallet",
      },
      { status: 500 },
    );
  }
}
