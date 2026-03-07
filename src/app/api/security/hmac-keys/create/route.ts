import { NextRequest, NextResponse } from "next/server";

import { verifyAdminSignedAction } from "@/lib/server/admin-action-security";
import {
  createHmacApiKey,
  generateHmacApiSecret,
} from "@/lib/server/hmac-api-key-store";

export const runtime = "nodejs";

const ROUTE_PATH = "/api/security/hmac-keys/create";
const SIGNING_PREFIX = "stable-georgia:hmac-keys:create:v1";
const DEFAULT_ALLOWED_ROUTE = "/api/order/buyOrderSettlement";

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

  const keyId = normalizeString(body?.keyId || "");
  const description = normalizeString(body?.description || "");
  const allowedStorecodes = parseStringList(body?.allowedStorecodes);
  const allowedRoutesInput = parseStringList(body?.allowedRoutes);
  const allowedRoutes = allowedRoutesInput.length > 0 ? allowedRoutesInput : [DEFAULT_ALLOWED_ROUTE];
  const actionFields: Record<string, unknown> = {
    allowedStorecodes: allowedStorecodes.join(","),
    allowedRoutes: allowedRoutes.join(","),
  };

  if (body?.keyId !== undefined) {
    actionFields.keyId = keyId;
  }

  if (body?.description !== undefined) {
    actionFields.description = description;
  }

  const auth = await verifyAdminSignedAction({
    request,
    route: ROUTE_PATH,
    signingPrefix: SIGNING_PREFIX,
    requesterStorecodeRaw: body?.requesterStorecode,
    requesterWalletAddressRaw: body?.requesterWalletAddress,
    signatureRaw: body?.signature,
    signedAtRaw: body?.signedAt,
    nonceRaw: body?.nonce,
    actionFields,
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
    const plainSecret = generateHmacApiSecret();
    const created = await createHmacApiKey({
      keyIdRaw: keyId,
      secretPlain: plainSecret,
      allowedRoutesRaw: allowedRoutes,
      allowedStorecodesRaw: allowedStorecodes,
      descriptionRaw: description,
      actor: auth.requesterUser,
    });

    return NextResponse.json({
      result: {
        keyId: created.keyId,
        secret: created.secret,
        allowedRoutes,
        allowedStorecodes,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create HMAC key";
    const status = (error as any)?.code === 11000 || message.includes("E11000") ? 409 : 400;
    return NextResponse.json(
      {
        result: null,
        error: message,
      },
      { status },
    );
  }
}
