import { NextResponse, type NextRequest } from "next/server";

import { updateClientProfile } from "@lib/api/client";
import { verifyAdminSignedAction } from "@/lib/server/admin-action-security";
import {
  CLIENT_SETTINGS_ADMIN_MUTATION_SIGNING_PREFIX,
  CLIENT_SETTINGS_UPDATE_PROFILE_ROUTE,
  extractClientSettingsAdminActionFields,
  isPlainObject,
} from "@/lib/security/client-settings-admin";

const clientId = process.env.NEXT_PUBLIC_TEMPLATE_CLIENT_ID || "";
const MAX_CLIENT_NAME_LENGTH = 120;
const MAX_CLIENT_DESCRIPTION_LENGTH = 2000;

const normalizeString = (value: unknown) => {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
};

export async function POST(request: NextRequest) {
  if (!clientId) {
    return NextResponse.json(
      {
        result: null,
        error: "No clientId configured in environment",
      },
      { status: 500 },
    );
  }

  let body: Record<string, unknown> = {};

  try {
    const parsed = await request.json();
    body = isPlainObject(parsed) ? parsed : {};
  } catch {
    body = {};
  }

  const authResult = await verifyAdminSignedAction({
    request,
    route: CLIENT_SETTINGS_UPDATE_PROFILE_ROUTE,
    signingPrefix: CLIENT_SETTINGS_ADMIN_MUTATION_SIGNING_PREFIX,
    requesterStorecodeRaw: body.requesterStorecode ?? "admin",
    requesterWalletAddressRaw: body.requesterWalletAddress,
    signatureRaw: body.signature,
    signedAtRaw: body.signedAt,
    nonceRaw: body.nonce,
    actionFields: extractClientSettingsAdminActionFields(body),
  });

  if (!authResult.ok) {
    return NextResponse.json(
      {
        result: null,
        error: authResult.error,
      },
      { status: authResult.status },
    );
  }

  const name = normalizeString(body.name);
  const description = normalizeString(body.description);

  if (!name || name.length > MAX_CLIENT_NAME_LENGTH) {
    return NextResponse.json(
      {
        result: null,
        error: "Invalid client name",
      },
      { status: 400 },
    );
  }

  if (description.length > MAX_CLIENT_DESCRIPTION_LENGTH) {
    return NextResponse.json(
      {
        result: null,
        error: "Invalid client description",
      },
      { status: 400 },
    );
  }

  const result = await updateClientProfile(clientId, {
    name,
    description,
  });

  return NextResponse.json({
    result,
  });
}
