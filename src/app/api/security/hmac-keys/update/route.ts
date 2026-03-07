import { NextRequest, NextResponse } from "next/server";

import { verifyAdminSignedAction } from "@/lib/server/admin-action-security";
import { updateHmacApiKey } from "@/lib/server/hmac-api-key-store";

export const runtime = "nodejs";

const ROUTE_PATH = "/api/security/hmac-keys/update";
const SIGNING_PREFIX = "stable-georgia:hmac-keys:update:v1";

const normalizeString = (value: unknown) => {
  if (typeof value !== "string") {
    return "";
  }
  return value.trim();
};

const parseStringList = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value
      .map((item) => normalizeString(item))
      .filter(Boolean);
  }
  const normalized = normalizeString(value);
  if (!normalized) {
    return [];
  }
  return normalized
    .split(",")
    .map((item) => normalizeString(item))
    .filter(Boolean);
};

export async function POST(request: NextRequest) {
  let body: any = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const keyId = normalizeString(body?.keyId);
  const status = normalizeString(body?.status);
  const description = normalizeString(body?.description);
  const allowedStorecodes = parseStringList(body?.allowedStorecodes);
  const allowedRoutes = parseStringList(body?.allowedRoutes);

  const auth = await verifyAdminSignedAction({
    request,
    route: ROUTE_PATH,
    signingPrefix: SIGNING_PREFIX,
    requesterStorecodeRaw: body?.requesterStorecode,
    requesterWalletAddressRaw: body?.requesterWalletAddress,
    signatureRaw: body?.signature,
    signedAtRaw: body?.signedAt,
    nonceRaw: body?.nonce,
    actionFields: {
      keyId,
      status,
      description,
      allowedStorecodes: allowedStorecodes.join(","),
      allowedRoutes: allowedRoutes.join(","),
    },
  });

  if (!auth.ok) {
    return NextResponse.json(
      {
        result: null,
        error: auth.error,
      },
      { status: auth.status },
    );
  }

  try {
    await updateHmacApiKey({
      keyIdRaw: keyId,
      statusRaw: status || undefined,
      descriptionRaw: body?.description !== undefined ? description : undefined,
      allowedStorecodesRaw: body?.allowedStorecodes !== undefined ? allowedStorecodes : undefined,
      allowedRoutesRaw: body?.allowedRoutes !== undefined ? allowedRoutes : undefined,
      actor: auth.requesterUser,
    });

    return NextResponse.json({
      result: {
        ok: true,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        result: null,
        error: error instanceof Error ? error.message : "Failed to update HMAC key",
      },
      { status: 400 },
    );
  }
}

