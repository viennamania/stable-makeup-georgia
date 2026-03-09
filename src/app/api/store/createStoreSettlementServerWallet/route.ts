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
import { normalizeWalletAddress } from "@/lib/server/user-read-security";

export const runtime = "nodejs";
export const preferredRegion = "icn1";

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

const findServerWalletByLabel = async ({
  client,
  label,
}: {
  client: ReturnType<typeof createThirdwebClient>;
  label: string;
}) => {
  let page = 1;

  while (true) {
    const result = await Engine.getServerWallets({
      client,
      page,
      limit: 500,
    });

    const accounts = Array.isArray(result?.accounts) ? result.accounts : [];
    const matched = accounts.find(
      (account) => normalizeString(account?.label) === label,
    );

    if (matched) {
      return matched;
    }

    const pagination = result?.pagination;
    const currentPage = Number(pagination?.page || page);
    const limit = Number(pagination?.limit || 0);
    const totalCount = Number(pagination?.totalCount || 0);
    const hasMore = Boolean(limit > 0 && totalCount > currentPage * limit);

    if (!hasMore || accounts.length === 0) {
      return null;
    }

    page = currentPage + 1;
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
    route: "/api/store/createStoreSettlementServerWallet",
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
  if (existingUser && existingWalletAddress) {
    const updatedStore = await updateStoreSettlementWalletAddress({
      storecode,
      settlementWalletAddress: existingWalletAddress,
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

    return NextResponse.json({
      result: {
        created: false,
        engineWalletCreated: false,
        settlementWalletAddress: existingWalletAddress,
        signerAddress: normalizeWalletAddress(existingUser?.signerAddress),
        user: serializeUser(existingUser),
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
    let engineWallet = await findServerWalletByLabel({ client, label });
    let engineWalletCreated = false;

    if (!engineWallet) {
      engineWallet = await Engine.createServerWallet({
        client,
        label,
      });
      engineWalletCreated = true;
    }

    let signerAddress = normalizeWalletAddress(engineWallet?.address);
    let smartAccountAddress = normalizeWalletAddress(engineWallet?.smartAccountAddress);

    if (!smartAccountAddress) {
      const refreshedWallet = await findServerWalletByLabel({ client, label });
      signerAddress = normalizeWalletAddress(refreshedWallet?.address || signerAddress);
      smartAccountAddress = normalizeWalletAddress(
        refreshedWallet?.smartAccountAddress,
      );
    }

    if (!signerAddress || !smartAccountAddress) {
      return NextResponse.json(
        {
          result: null,
          error: "Failed to resolve created Thirdweb server wallet addresses",
        },
        { status: 500 },
      );
    }

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

    return NextResponse.json({
      result: {
        created: true,
        engineWalletCreated,
        settlementWalletAddress: smartAccountAddress,
        signerAddress,
        user: serializeUser(user),
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
